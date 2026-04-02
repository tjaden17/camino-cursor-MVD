import { describe, it, expect, afterAll } from "vitest";
import { runBriefingPipeline } from "./run-briefing-pipeline.js";
import { readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import type { BriefingOutput } from "./types.js";

describe("run-briefing-pipeline (skip-llm)", () => {
  let result: Awaited<ReturnType<typeof runBriefingPipeline>>;
  let output: BriefingOutput;

  // Run once, verify many
  it("completes end-to-end for locumate", async () => {
    result = await runBriefingPipeline({ orgId: "locumate", skipLlm: true });
    expect(result.runId).toMatch(/^run-\d{8}-/);
    expect(result.cardCount).toBe(14);
    expect(result.takeawayCount).toBe(4);
  });

  it("writes output.json with valid structure", () => {
    const raw = readFileSync(resolve(result.runDir, "output.json"), "utf-8");
    output = JSON.parse(raw) as BriefingOutput;

    expect(output.runId).toBe(result.runId);
    expect(output.orgId).toBe("locumate");
    expect(output.orgName).toBe("Locumate");
  });

  it("has a complete issue tree with 4 branches", () => {
    expect(output.issueTree.branches.length).toBe(4);
    expect(output.issueTree.rootIssue).toContain("Locumate");
    expect(output.issueTree.formulaLabel).toContain("Revenue");
  });

  it("has 14 analysis cards with observations and tags", () => {
    expect(output.analysisCards.length).toBe(14);
    for (const card of output.analysisCards) {
      expect(card.cardId).toMatch(/^subissue-/);
      expect(card.branchId).toBeTruthy();
      expect(card.observations.length).toBeGreaterThan(0);
    }
  });

  it("has 4 branch takeaways with summaryCategory", () => {
    expect(output.branchTakeaways.length).toBe(4);
    for (const t of output.branchTakeaways) {
      expect(["finding", "risk", "opportunity"]).toContain(t.summaryCategory);
      expect(t.title).toBeTruthy();
      expect(t.branchId).toBeTruthy();
    }
  });

  it("has lenses with issueTree and decisions", () => {
    expect(Object.keys(output.lenses.issueTree).length).toBe(14);
    expect(Object.keys(output.lenses.decisions).length).toBeGreaterThan(0);
  });

  it("has userViews for surge and sam", () => {
    expect(output.userViews.surge).toBeDefined();
    expect(output.userViews.sam).toBeDefined();
    expect(output.userViews.surge.relevantBranches).toContain("volume");
    expect(output.userViews.sam.relevantBranches).toContain("retention");
  });

  it("writes run artifacts to disk", () => {
    const manifest = JSON.parse(readFileSync(resolve(result.runDir, "manifest.json"), "utf-8"));
    expect(manifest.runId).toBe(result.runId);

    const qc = JSON.parse(readFileSync(resolve(result.runDir, "qc-failures.json"), "utf-8"));
    expect(qc.runId).toBe(result.runId);
    expect(Array.isArray(qc.failures)).toBe(true);
  });

  afterAll(() => {
    // Clean up the test run artifacts
    try {
      rmSync(result.runDir, { recursive: true, force: true });
    } catch {
      // Non-critical if cleanup fails
    }
  });
});
