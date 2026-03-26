/**
 * Claude call 1 (selection) and call 2 (narrative merge). Uses cache unless `--no-cache`.
 * When `skipLlm` or no API key, callers should use stub-cards only.
 */
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { LoadedProfile } from "./load-onboarding.js";
import { buildStubCards, stubSelectionFromCards } from "./stub-cards.js";
import type { AgentSignalsUser, ProcessedCard, UserKpiContext } from "./types.js";

const DEFAULT_MODEL = "claude-3-5-sonnet-20241022";

function cacheDir(repoRoot: string): string {
  return join(repoRoot, ".cache", "mvd");
}

function hashKey(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

function readCache(repoRoot: string, key: string): string | null {
  const p = join(cacheDir(repoRoot), `${key}.json`);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
}

function writeCache(repoRoot: string, key: string, body: string): void {
  const dir = cacheDir(repoRoot);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${key}.json`), body, "utf8");
}

function extractText(response: { content: Array<{ type: string; text?: string }> }): string {
  const block = response.content[0];
  if (block?.type === "text" && block.text) return block.text;
  return "";
}

/** Strip markdown code fences if the model wraps JSON. */
function parseJsonFromModel(text: string): unknown {
  const t = text.trim();
  const unfenced = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(unfenced) as unknown;
}

export interface LlmMergeResult {
  agentUsers: AgentSignalsUser[];
  cardsByUser: Map<string, ProcessedCard[]>;
}

export async function runLlmStages(params: {
  repoRoot: string;
  profiles: LoadedProfile[];
  contexts: UserKpiContext[];
  skipLlm: boolean;
  noCache: boolean;
  model?: string;
}): Promise<LlmMergeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const model = params.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  const cardsByUser = new Map<string, ProcessedCard[]>();
  for (const ctx of params.contexts) {
    cardsByUser.set(ctx.userId, buildStubCards(ctx));
  }

  if (params.skipLlm || !apiKey) {
    const agentUsers = params.contexts.map((ctx) =>
      stubSelectionFromCards(ctx.userId, cardsByUser.get(ctx.userId) ?? []),
    );
    return { agentUsers, cardsByUser };
  }

  const client = new Anthropic({ apiKey });
  const selectionPrompt = readFileSync(
    join(params.repoRoot, "prompts", "kpi-selection.md"),
    "utf8",
  );
  const copyPrompt = readFileSync(join(params.repoRoot, "prompts", "signal-copy.md"), "utf8");

  const agentUsers: AgentSignalsUser[] = [];

  for (const ctx of params.contexts) {
    const profile = params.profiles.find((p) => p.userId === ctx.userId);
    if (!profile) throw new Error(`Missing profile for ${ctx.userId}`);

    const stubCards = cardsByUser.get(ctx.userId) ?? [];
    const cacheKey1 = hashKey([
      "sel",
      ctx.userId,
      JSON.stringify(profile.raw),
      selectionPrompt,
      model,
    ]);

    let selectionJson: string;
    const cached1 = !params.noCache ? readCache(params.repoRoot, cacheKey1) : null;
    if (cached1) {
      selectionJson = cached1;
    } else {
      const msg = `${selectionPrompt}\n\n## KPI pool (fixed ids for this MVD run)\n${stubCards.map((c) => c.kpiId).join(", ")}\n\n## Onboarding JSON\n${JSON.stringify(profile.raw)}`;
      const res = await client.messages.create({
        model,
        max_tokens: 2048,
        messages: [{ role: "user", content: msg }],
      });
      selectionJson = extractText(res);
      writeCache(params.repoRoot, cacheKey1, selectionJson);
    }

    const sel = parseJsonFromModel(selectionJson) as {
      userId?: string;
      requestedKpis?: string[];
      recommendedKpis?: string[];
      selectionRationale?: string;
    };
    agentUsers.push({
      userId: ctx.userId,
      requestedKpis:
        sel.requestedKpis ?? stubSelectionFromCards(ctx.userId, stubCards).requestedKpis,
      recommendedKpis:
        sel.recommendedKpis ?? stubSelectionFromCards(ctx.userId, stubCards).recommendedKpis,
      selectionRationale: sel.selectionRationale ?? "Claude selection call.",
    });

    const cacheKey2 = hashKey(["nar", ctx.userId, selectionJson, copyPrompt, model]);
    let narrativeJson: string;
    const cached2 = !params.noCache ? readCache(params.repoRoot, cacheKey2) : null;
    if (cached2) {
      narrativeJson = cached2;
    } else {
      const msg2 = `${copyPrompt}\n\n## Stub cards (kpiId + sufficiency)\n${JSON.stringify(
        stubCards.map((c) => ({
          kpiId: c.kpiId,
          requestType: c.requestType,
          dataSufficiency: c.dataSufficiency,
        })),
      )}\n\n## User context\nName: ${ctx.displayName}\nLeads (sample): ${ctx.leadsTotal}`;
      const res2 = await client.messages.create({
        model,
        max_tokens: 8192,
        messages: [{ role: "user", content: msg2 }],
      });
      narrativeJson = extractText(res2);
      writeCache(params.repoRoot, cacheKey2, narrativeJson);
    }

    const nar = parseJsonFromModel(narrativeJson) as {
      narratives?: Array<{
        kpiId: string;
        execSummary?: string;
        directionGoodOrBad?: string;
        expectedOrUnexpected?: string;
        benchmarkComparison?: string;
        rootCauseAnalysis?: string;
        rootCauseRationale?: string;
      }>;
    };
    const merged = mergeNarrativesIntoCards(stubCards, nar.narratives ?? []);
    cardsByUser.set(ctx.userId, merged);
  }

  return { agentUsers, cardsByUser };
}

function mergeNarrativesIntoCards(
  cards: ProcessedCard[],
  narratives: Array<{
    kpiId: string;
    execSummary?: string;
    directionGoodOrBad?: string;
    expectedOrUnexpected?: string;
    benchmarkComparison?: string;
    rootCauseAnalysis?: string;
    rootCauseRationale?: string;
  }>,
): ProcessedCard[] {
  const byKpi = new Map(narratives.map((n) => [n.kpiId, n]));
  return cards.map((c) => {
    const n = byKpi.get(c.kpiId);
    if (!n || !c.expanded) return c;
    return {
      ...c,
      expanded: {
        ...c.expanded,
        execSummary: n.execSummary ?? c.expanded.execSummary,
        takeawayBreakdown: {
          directionGoodOrBad:
            n.directionGoodOrBad ?? c.expanded.takeawayBreakdown.directionGoodOrBad,
          expectedOrUnexpected:
            n.expectedOrUnexpected ?? c.expanded.takeawayBreakdown.expectedOrUnexpected,
        },
        benchmarkComparison: n.benchmarkComparison ?? c.expanded.benchmarkComparison,
        rootCauseAnalysis: n.rootCauseAnalysis ?? c.expanded.rootCauseAnalysis,
        rootCauseRationale: n.rootCauseRationale ?? c.expanded.rootCauseRationale,
      },
    };
  });
}
