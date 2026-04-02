import { describe, it, expect } from "vitest";
import { computeRateLimitWaitMs, extractJson } from "./llm.js";

describe("extractJson", () => {
  it("parses raw JSON object", () => {
    expect(extractJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips ```json ... ``` fences with newlines", () => {
    const raw = '```json\n{"subIssueId":"1.1","kpis":[]}\n```';
    expect(extractJson(raw)).toEqual({ subIssueId: "1.1", kpis: [] });
  });

  it("strips ```json{ without newline (model glued brace)", () => {
    const raw = '```json {"subIssueId":"1.1","kpis":[]}\n```';
    expect(extractJson(raw)).toEqual({ subIssueId: "1.1", kpis: [] });
  });

  it("handles ```JSON case-insensitive", () => {
    const raw = '```JSON\n{"x":true}\n```';
    expect(extractJson(raw)).toEqual({ x: true });
  });

  it("parses when closing fence is missing (truncated) using brace slice", () => {
    const raw = '```json\n{"a":2,"b":3}';
    expect(extractJson(raw)).toEqual({ a: 2, b: 3 });
  });

  it("parses when preamble exists before JSON", () => {
    const raw = 'Here is the output:\n\n```json\n{"ok":1}\n```\nDone.';
    expect(extractJson(raw)).toEqual({ ok: 1 });
  });

  it("repairs trailing commas via jsonrepair", () => {
    const raw = '{"a":1,}';
    expect(extractJson(raw)).toEqual({ a: 1 });
  });

  it("repairs unclosed array when jsonrepair can close it", () => {
    const raw = '{"kpis":[{"name":"x"}';
    const out = extractJson<{ kpis: Array<{ name: string }> }>(raw);
    expect(out.kpis).toBeDefined();
    expect(out.kpis[0]?.name).toBe("x");
  });
});

describe("computeRateLimitWaitMs", () => {
  it("uses retry-after header (seconds)", () => {
    const err = { status: 429, headers: { "retry-after": "69" } };
    expect(computeRateLimitWaitMs(err, 0)).toBe(69_000);
  });

  it("uses later of retry-after and token reset window", () => {
    const resetAt = new Date(Date.now() + 95_000).toISOString();
    const err = {
      status: 429,
      headers: {
        "retry-after": "10",
        "anthropic-ratelimit-input-tokens-reset": resetAt,
      },
    };
    const w = computeRateLimitWaitMs(err, 0);
    expect(w).toBeGreaterThanOrEqual(90_000);
    expect(w).toBeLessThanOrEqual(180_000);
  });
});
