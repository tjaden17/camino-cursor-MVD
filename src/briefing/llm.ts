/**
 * Shared LLM helper for the briefing pipeline.
 * Wraps the Anthropic SDK with:
 * - skip-llm mode (returns stub responses)
 * - configurable model via ANTHROPIC_MODEL env var
 * - JSON extraction from response text
 */
import { jsonrepair } from "jsonrepair";

export interface LlmCallOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export interface LlmResult {
  text: string;
  source: "llm" | "stub";
}

let skipLlmGlobal = false;

export function setSkipLlm(skip: boolean): void {
  skipLlmGlobal = skip;
}

export function isLlmAvailable(): boolean {
  return !skipLlmGlobal && !!process.env.ANTHROPIC_API_KEY?.trim();
}

/** Milliseconds to wait before each LLM request (spreads load for Tier 1 ~30K TPM). Set via BRIEFING_THROTTLE_MS. */
export function getBriefingThrottleMs(): number {
  const n = Number(process.env.BRIEFING_THROTTLE_MS ?? "0");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function throttleBeforeLlm(): Promise<void> {
  const ms = getBriefingThrottleMs();
  if (ms > 0) await sleep(ms);
}

function isRateLimitError(e: unknown): boolean {
  if (e && typeof e === "object" && "status" in e) {
    const s = (e as { status?: number }).status;
    if (s === 429) return true;
  }
  const msg = e instanceof Error ? e.message : String(e);
  return /429|rate limit|too many requests|rate_limit_error/i.test(msg);
}

type HeaderRecord = Record<string, string | null | undefined>;

function getErrorHeaders(e: unknown): HeaderRecord | null {
  if (e && typeof e === "object" && "headers" in e) {
    const h = (e as { headers?: HeaderRecord }).headers;
    return h ?? null;
  }
  return null;
}

/**
 * How long to wait before retrying a 429, using Anthropic response headers when present:
 * - retry-after (seconds)
 * - anthropic-ratelimit-input-tokens-reset (ISO timestamp — input TPM window)
 * Falls back to exponential backoff from BRIEFING_429_BACKOFF_MS.
 */
export function computeRateLimitWaitMs(e: unknown, attemptIndexZeroBased: number): number {
  const base = Number(process.env.BRIEFING_429_BACKOFF_MS ?? "8000");
  const fallback = Math.min(120_000, Math.max(2000, base) * 2 ** attemptIndexZeroBased);

  const h = getErrorHeaders(e);
  if (!h) return fallback;

  let fromRetry = 0;
  const ra = h["retry-after"];
  if (ra) {
    const sec = parseInt(ra, 10);
    if (Number.isFinite(sec) && sec > 0) fromRetry = sec * 1000;
  }

  let fromReset = 0;
  const resetRaw = h["anthropic-ratelimit-input-tokens-reset"];
  if (resetRaw) {
    const t = new Date(resetRaw).getTime();
    if (!Number.isNaN(t)) fromReset = Math.max(0, t - Date.now()) + 2000;
  }

  const combined = Math.max(fallback, fromRetry, fromReset);
  return Math.min(180_000, Math.max(1000, combined));
}

async function callLlmOnce(opts: LlmCallOptions): Promise<LlmResult> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";

  const resp = await client.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.systemPrompt,
    messages: [{ role: "user", content: opts.userPrompt }],
  });

  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => ("text" in b ? b.text : ""))
    .join("\n");

  return { text, source: "llm" };
}

/**
 * Calls the LLM with optional spacing between requests (BRIEFING_THROTTLE_MS) and
 * retries on HTTP 429 (Tier 1 caps: ~50 RPM / ~30K input TPM for Sonnet & Opus).
 */
export async function callLlm(opts: LlmCallOptions): Promise<LlmResult> {
  if (!isLlmAvailable()) {
    return { text: "", source: "stub" };
  }

  const maxAttempts = Number(process.env.BRIEFING_LLM_MAX_RETRIES ?? "4");
  const attempts = Number.isFinite(maxAttempts) && maxAttempts >= 1 ? Math.min(10, maxAttempts) : 4;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    await throttleBeforeLlm();
    try {
      return await callLlmOnce(opts);
    } catch (e) {
      lastErr = e;
      if (isRateLimitError(e) && attempt < attempts) {
        const wait = computeRateLimitWaitMs(e, attempt - 1);
        console.warn(
          `[briefing] Rate limited (429). Waiting ${Math.round(wait / 1000)}s before retry ${attempt + 1}/${attempts} (uses Retry-After / Anthropic reset headers when present)…`,
        );
        await sleep(wait);
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

/**
 * Extract JSON from an LLM response that may contain markdown fences, preamble,
 * or missing closing fences (truncated). Models often return ```json ... ``` with
 * varied spacing or no closing fence.
 */
export function extractJson<T>(text: string): T {
  let s = text.trim();

  // Prefer a ```json ... ``` block anywhere in the text (handles preamble / epilogue)
  const fenceInner = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceInner) {
    s = fenceInner[1]!.trim();
  } else {
    // Remove leading fence: ```json, ``` JSON, or ``` alone (case-insensitive)
    s = s.replace(/^```(?:json)?\s*/i, "");
    // Remove trailing fence if present
    s = s.replace(/\s*```\s*$/i, "").trim();
    // If text still starts with ``` (e.g. ```\n{), strip first line
    if (s.startsWith("```")) {
      const firstNl = s.indexOf("\n");
      s = firstNl >= 0 ? s.slice(firstNl + 1).trim() : s.replace(/^```\w*\s*/i, "");
      s = s.replace(/\s*```\s*$/i, "").trim();
    }
  }

  const tryParse = (raw: string): T | null => {
    try {
      return JSON.parse(raw) as T;
    } catch {
      try {
        return JSON.parse(jsonrepair(raw)) as T;
      } catch {
        return null;
      }
    }
  };

  const direct = tryParse(s);
  if (direct !== null) return direct;

  // Fallback: object from first { to last } (handles prose before/after)
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const inner = s.slice(start, end + 1);
    const obj = tryParse(inner);
    if (obj !== null) return obj;
  }

  const aStart = s.indexOf("[");
  const aEnd = s.lastIndexOf("]");
  if (aStart >= 0 && aEnd > aStart) {
    const inner = s.slice(aStart, aEnd + 1);
    const arr = tryParse(inner);
    if (arr !== null) return arr;
  }

  throw new Error(
    `extractJson: could not parse JSON from LLM response (first 200 chars): ${text.slice(0, 200).replace(/\s+/g, " ")}`,
  );
}
