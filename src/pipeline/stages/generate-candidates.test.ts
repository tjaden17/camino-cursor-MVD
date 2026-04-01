import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getRepoRoot } from "../../repo-root.js";
import { generateCandidates } from "./generate-candidates.js";

function loadDataSourceIndex(): Map<
  string,
  { sourceId: string; status: string; filePath: string }
> {
  const root = getRepoRoot();
  const path = join(root, "data/kpi-spec/kpi-spec-v2.json");
  const spec = JSON.parse(readFileSync(path, "utf8")) as {
    dataSources: { sourceId: string; status: string; filePath: string }[];
  };
  return new Map(spec.dataSources.map((d) => [d.sourceId, d]));
}

describe("generateCandidates", () => {
  it("returns 10 sufficient and 5 insufficient candidates for Surge (15 total)", () => {
    const candidates = generateCandidates("Surge");
    const sufficient = candidates.filter((c) => c.status === "sufficient");
    const insufficient = candidates.filter((c) => c.status === "insufficient");
    expect(sufficient).toHaveLength(10);
    expect(insufficient).toHaveLength(5);
    expect(candidates).toHaveLength(15);
  });

  it("returns 7 sufficient and 3 insufficient candidates for Sam (10 total) — includes org-wide recommended KPIs", () => {
    const candidates = generateCandidates("Sam");
    const sufficient = candidates.filter((c) => c.status === "sufficient");
    const insufficient = candidates.filter((c) => c.status === "insufficient");
    expect(sufficient).toHaveLength(7);
    expect(insufficient).toHaveLength(3);
    expect(candidates).toHaveLength(10);
  });

  it("gives every candidate a non-empty formula", () => {
    for (const user of ["surge", "sam"]) {
      for (const c of generateCandidates(user)) {
        expect(c.formula.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("marks spec-driven recommended sufficient KPIs as recommended (others requested)", () => {
    const surge = generateCandidates("Surge");
    const sam = generateCandidates("Sam");
    const surgeRec = surge.filter((c) => c.status === "sufficient" && c.type === "recommended").map((c) => c.kpiId);
    const samRec = sam.filter((c) => c.status === "sufficient" && c.type === "recommended").map((c) => c.kpiId);
    expect(surgeRec.sort()).toEqual(["resolution_time", "sla_compliance"].sort());
    expect(samRec.sort()).toEqual(["avg_deal_size", "inactive_pharmacy_rate", "pipeline_value", "win_rate"].sort());
  });

  it("marks all insufficient candidates as recommended", () => {
    for (const user of ["Surge", "Sam"]) {
      for (const c of generateCandidates(user)) {
        if (c.status === "insufficient") expect(c.type).toBe("recommended");
      }
    }
  });

  it("has non-empty resolved paths for each connected source on every candidate", () => {
    const byId = loadDataSourceIndex();
    for (const user of ["surge", "sam"]) {
      for (const c of generateCandidates(user)) {
        expect(c.sourceIds.length).toBe(c.sourcePaths.length);
        for (let i = 0; i < c.sourceIds.length; i++) {
          const ds = byId.get(c.sourceIds[i]);
          if (ds?.status === "connected") {
            expect(c.sourcePaths[i].length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("returns an empty array for an unknown userId", () => {
    expect(generateCandidates("unknown-user-xyz")).toEqual([]);
  });
});
