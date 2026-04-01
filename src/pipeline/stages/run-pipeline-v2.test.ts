import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { runPipelineV2 } from "./run-pipeline-v2.js";
import type { PipelineV2Result } from "./run-pipeline-v2.js";
import type { SignalCardV2, InsufficientCardV2 } from "./card-schema.js";
import { join } from "node:path";
import { existsSync, rmSync, mkdirSync } from "node:fs";
import { getRepoRoot } from "../../repo-root.js";
import { setNamespace, dropCollection } from "../../rag/store.js";

const TEST_OUT = join(getRepoRoot(), "out", "test-e2e-v2");

describe("Pipeline V2 — end-to-end", () => {
  let result: PipelineV2Result;

  beforeAll(async () => {
    if (existsSync(TEST_OUT)) rmSync(TEST_OUT, { recursive: true });
    mkdirSync(TEST_OUT, { recursive: true });

    result = await runPipelineV2({
      userIds: ["surge", "sam"],
      outDir: TEST_OUT,
      skipLlm: true,
    });
  }, 30_000);

  afterAll(async () => {
    setNamespace("pipeline-v2");
    await dropCollection();
    setNamespace("default");
  });

  it("completes successfully", () => {
    expect(result.ok).toBe(true);
    expect(result.output.runId).toMatch(/^run-/);
    expect(Array.isArray(result.output.triggeredDecisionRecommendations)).toBe(true);
  });

  it("produces output for both users", () => {
    expect(result.output.users.length).toBe(2);
    const userIds = result.output.users.map((u) => u.userId);
    expect(userIds).toContain("surge");
    expect(userIds).toContain("sam");
  });

  describe("data quality reports", () => {
    it("ran quality checks on all data files", () => {
      expect(result.qualityReports.length).toBeGreaterThanOrEqual(4);
    });

    it("no file failed the quality gate", () => {
      const failed = result.qualityReports.filter((r) => r.level === "fail");
      expect(failed).toEqual([]);
    });
  });

  describe("Surge cards", () => {
    let surgeCards: (SignalCardV2 | InsufficientCardV2)[];
    let sufficientCards: SignalCardV2[];
    let insufficientCards: InsufficientCardV2[];

    beforeAll(() => {
      const surge = result.output.users.find((u) => u.userId === "surge")!;
      surgeCards = surge.cards;
      sufficientCards = surgeCards.filter(
        (c): c is SignalCardV2 => c.dataSufficiency === "sufficient",
      );
      insufficientCards = surgeCards.filter(
        (c): c is InsufficientCardV2 => c.dataSufficiency === "insufficient",
      );
    });

    it("has sufficient cards (A and B versions) — 10 KPIs × 2", () => {
      const versionA = sufficientCards.filter((c) => c.cardVersion === "A");
      const versionB = sufficientCards.filter((c) => c.cardVersion === "B");
      expect(versionA).toHaveLength(10);
      expect(versionB).toHaveLength(10);
    });

    it("has insufficient cards", () => {
      expect(insufficientCards.length).toBeGreaterThanOrEqual(1);
    });

    it("every sufficient card has a real numeric value", () => {
      for (const c of sufficientCards) {
        expect(typeof c.numericValue).toBe("number");
        expect(Number.isFinite(c.numericValue)).toBe(true);
      }
    });

    it("every sufficient card has dataFreshness", () => {
      for (const c of sufficientCards) {
        expect(c.dataFreshness).toBeTruthy();
      }
    });

    it("every sufficient card has provenanceSummary", () => {
      for (const c of sufficientCards) {
        expect(c.provenanceSummary).toBeTruthy();
        expect(c.provenanceSummary).toContain("Calculated from");
      }
    });

    it("every sufficient card has analysis with chain of thought", () => {
      for (const c of sufficientCards) {
        expect(c.analysis.conclusion).toBeTruthy();
        expect(c.analysis.chainOfThought.length).toBeGreaterThan(0);
      }
    });

    it("every sufficient card has synthesis", () => {
      for (const c of sufficientCards) {
        expect(c.synthesis.conclusion).toBeTruthy();
      }
    });

    it("A/B versions have different synthesis", () => {
      const winRateA = sufficientCards.find(
        (c) => c.kpiId === "win_rate" && c.cardVersion === "A",
      );
      const winRateB = sufficientCards.find(
        (c) => c.kpiId === "win_rate" && c.cardVersion === "B",
      );
      if (winRateA && winRateB) {
        expect(winRateA.synthesis.conclusion).not.toBe(winRateB.synthesis.conclusion);
      }
    });

    it("every sufficient card has cross-signal references", () => {
      for (const c of sufficientCards) {
        expect(c.crossSignalReferences).toBeDefined();
      }
    });

    it("every sufficient card has retrieved sources", () => {
      for (const c of sufficientCards) {
        expect(c.retrievedSources.length).toBeGreaterThan(0);
      }
    });

    it("stub run marks narrativeSource fallback on sufficient cards", () => {
      for (const c of sufficientCards) {
        expect(c.narrativeSource).toBe("fallback");
      }
    });

    it("every insufficient card explains what is missing", () => {
      for (const c of insufficientCards) {
        expect(c.whatsNeeded).toBeTruthy();
        expect(c.howToProvide).toBeTruthy();
        expect(c.whatItUnlocks).toBeTruthy();
      }
    });
  });

  describe("Sam cards", () => {
    let samCards: (SignalCardV2 | InsufficientCardV2)[];
    let sufficientCards: SignalCardV2[];
    let insufficientCards: InsufficientCardV2[];

    beforeAll(() => {
      const sam = result.output.users.find((u) => u.userId === "sam")!;
      samCards = sam.cards;
      sufficientCards = samCards.filter(
        (c): c is SignalCardV2 => c.dataSufficiency === "sufficient",
      );
      insufficientCards = samCards.filter(
        (c): c is InsufficientCardV2 => c.dataSufficiency === "insufficient",
      );
    });

    it("has sufficient cards (A and B versions) — 7 KPIs × 2 (incl. org-wide recommended)", () => {
      const versionA = sufficientCards.filter((c) => c.cardVersion === "A");
      const versionB = sufficientCards.filter((c) => c.cardVersion === "B");
      expect(versionA).toHaveLength(7);
      expect(versionB).toHaveLength(7);
    });

    it("has insufficient cards", () => {
      expect(insufficientCards.length).toBeGreaterThanOrEqual(1);
    });

    it("every sufficient card has a real numeric value", () => {
      for (const c of sufficientCards) {
        expect(typeof c.numericValue).toBe("number");
        expect(Number.isFinite(c.numericValue)).toBe(true);
      }
    });

    it("every sufficient card has provenance and freshness", () => {
      for (const c of sufficientCards) {
        expect(c.dataFreshness).toBeTruthy();
        expect(c.provenanceSummary).toBeTruthy();
      }
    });

    it("stub run marks narrativeSource fallback on sufficient cards", () => {
      for (const c of sufficientCards) {
        expect(c.narrativeSource).toBe("fallback");
      }
    });
  });

  describe("output files", () => {
    it("writes pipeline-v2-output.json", () => {
      expect(existsSync(join(TEST_OUT, "pipeline-v2-output.json"))).toBe(true);
    });

    it("writes data-quality-report.json", () => {
      expect(existsSync(join(TEST_OUT, "data-quality-report.json"))).toBe(true);
    });

    it("writes inspector step JSON (1c, 2-3, 4)", () => {
      expect(existsSync(join(TEST_OUT, "step-1c-data-quality.json"))).toBe(true);
      expect(existsSync(join(TEST_OUT, "step-2-3-computed.json"))).toBe(true);
      expect(existsSync(join(TEST_OUT, "step-4-llm-calls.json"))).toBe(true);
    });
  });
});
