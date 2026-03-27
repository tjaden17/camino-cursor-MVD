import { describe, expect, it } from "vitest";
import { buildUserStrategyMirror } from "./strategy-mirror.js";
import type { StrategyCatalogueFile } from "./strategy-types.js";

describe("buildUserStrategyMirror", () => {
  it("filters KPIs and decisions by userId", () => {
    const cat: StrategyCatalogueFile = {
      kind: "strategy_catalogue",
      version: 1,
      generatedAt: "t",
      runId: "r1",
      orgId: "acme",
      orgName: "Acme",
      kpis: [
        {
          kpiId: "kpi.a",
          title: "A",
          horizon: "now",
          rationale: "",
          userId: "surge",
        },
        {
          kpiId: "kpi.b",
          title: "B",
          horizon: "now",
          rationale: "",
          userId: "sam",
        },
      ],
      decisions: [
        {
          id: "d1",
          title: "D",
          horizon: "now",
          hypothesis: "h",
          userId: "surge",
        },
      ],
      sampleCalcsRequested: [],
      sampleCalcsRecommended: [],
    };
    const m = buildUserStrategyMirror(cat, "Surge");
    expect(m.kpis).toHaveLength(1);
    expect(m.kpis[0]!.kpiId).toBe("kpi.a");
    expect(m.decisions).toHaveLength(1);
  });
});
