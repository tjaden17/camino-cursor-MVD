import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { loadAllKnowledgeChunks, indexChunks, setNamespace } from "../../rag/index.js";
import { dropCollection } from "../../rag/store.js";
import { retrieveContextForKpi, assemblePrompts } from "./rag-prompt-assembly.js";
import type { ComputedKpi } from "./kpi-compute.js";

/* ================================================================== */
/*  RAG setup / teardown                                               */
/* ================================================================== */

beforeAll(async () => {
  setNamespace("rag-prompt-test");
  const chunks = loadAllKnowledgeChunks();
  await indexChunks(chunks);
});

afterAll(async () => {
  await dropCollection();
  setNamespace("default");
});

/* ================================================================== */
/*  Mock KPI                                                           */
/* ================================================================== */

const mockKpi: ComputedKpi = {
  kpiId: "win_rate",
  value: 42.86,
  displayValue: "42.86%",
  previousValue: null,
  trend: { direction: "flat", delta: null, deltaPct: null },
  provenance: {
    sourceId: "zoho_crm_deals",
    sourcePath: "data/zoho/Zoho - CRM - Deals.csv",
    formula: "count(Closed Won) / count(Closed *) * 100",
    rowCount: 28,
    sampleRows: [{ Stage: "Closed Won", Amount: "15000" }],
  },
  dataFreshness: "2025-03-01T00:00:00.000Z",
  breakdowns: undefined,
};

/* ================================================================== */
/*  retrieveContextForKpi                                              */
/* ================================================================== */

describe("retrieveContextForKpi", () => {
  it("returns non-empty kb2Benchmarks for win_rate", async () => {
    const ctx = await retrieveContextForKpi("win_rate", "Win Rate", "surge");
    expect(ctx.kb2Benchmarks.length).toBeGreaterThan(0);
    const combined = ctx.kb2Benchmarks.join(" ").toLowerCase();
    expect(combined).toMatch(/win|rate|benchmark|saas/);
  });

  it("returns non-empty kb3Patterns for support_issue_volume", async () => {
    const ctx = await retrieveContextForKpi(
      "support_issue_volume",
      "Support Issue Volume",
      "surge",
    );
    expect(ctx.kb3Patterns.length).toBeGreaterThan(0);
  });

  it("returns non-empty sources array", async () => {
    const ctx = await retrieveContextForKpi("win_rate", "Win Rate", "surge");
    expect(ctx.sources.length).toBeGreaterThan(0);
    for (const src of ctx.sources) {
      expect(src.kb).toBeTruthy();
      expect(src.heading).toBeTruthy();
      expect(src.sourcePath).toBeTruthy();
    }
  });
});

/* ================================================================== */
/*  assemblePrompts                                                    */
/* ================================================================== */

describe("assemblePrompts", () => {
  it("returns two prompts with different versions", async () => {
    const { versionA, versionB } = await assemblePrompts(
      mockKpi,
      "surge",
      "Win Rate",
    );
    expect(versionA.version).toBe("A");
    expect(versionB.version).toBe("B");
    expect(versionA.kpiId).toBe("win_rate");
    expect(versionB.kpiId).toBe("win_rate");
  });

  it("version A does NOT contain personal user goals", async () => {
    const { versionA } = await assemblePrompts(mockKpi, "surge", "Win Rate");
    expect(versionA.userPrompt).not.toContain("## Personal Context");
    expect(versionA.userPrompt).not.toContain("Synthesis — Personal");
  });

  it("version B DOES contain personal context section", async () => {
    const { versionB } = await assemblePrompts(mockKpi, "surge", "Win Rate");
    expect(versionB.userPrompt).toContain("## Personal Context");
    expect(versionB.userPrompt).toContain("Synthesis — Personal");
  });

  it("both versions contain the computed data section", async () => {
    const { versionA, versionB } = await assemblePrompts(
      mockKpi,
      "surge",
      "Win Rate",
    );
    expect(versionA.userPrompt).toContain("## Computed Data");
    expect(versionA.userPrompt).toContain("42.86%");
    expect(versionA.userPrompt).toContain("zoho_crm_deals");

    expect(versionB.userPrompt).toContain("## Computed Data");
    expect(versionB.userPrompt).toContain("42.86%");
    expect(versionB.userPrompt).toContain("zoho_crm_deals");
  });

  it("both versions contain anti-hallucination rules in the system prompt", async () => {
    const { versionA, versionB } = await assemblePrompts(
      mockKpi,
      "surge",
      "Win Rate",
    );
    for (const prompt of [versionA, versionB]) {
      expect(prompt.systemPrompt).toContain("COMPUTED DATA");
      expect(prompt.systemPrompt).toContain("BENCHMARKS");
      expect(prompt.systemPrompt).toContain("no benchmark available");
    }
  });

  it("retrievedContext.sources is non-empty on both versions", async () => {
    const { versionA, versionB } = await assemblePrompts(
      mockKpi,
      "surge",
      "Win Rate",
    );
    expect(versionA.retrievedContext.sources.length).toBeGreaterThan(0);
    expect(versionB.retrievedContext.sources.length).toBeGreaterThan(0);
  });
});
