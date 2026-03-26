import { describe, expect, it } from "vitest";
import { evaluateReviewGates } from "./gates.js";

describe("evaluateReviewGates", () => {
  it("fails when non-leads KPI reuses leads value", () => {
    const result = evaluateReviewGates({
      users: [
        {
          userId: "surge",
          cards: [
            mkCard("kpi.pipeline.leads_total", "53"),
            mkCard("kpi.sales.velocity", "53"),
          ],
        },
      ],
    });
    const gate = result.gates.find((g) => g.id === "no_leads_reuse_non_leads");
    expect(gate?.pass).toBe(false);
  });

  it("passes benchmark gate when omitted", () => {
    const result = evaluateReviewGates({
      users: [{ userId: "sam", cards: [mkCard("kpi.sales.win_rate", "14%")] }],
    });
    const gate = result.gates.find((g) => g.id === "benchmark_claim_quality");
    expect(gate?.pass).toBe(true);
  });

  it("fails personalization gate when only names differ", () => {
    const base = mkCard("kpi.sales.velocity", "12.4");
    const surgeCard = {
      ...base,
      overview: { ...base.overview, oneLineSummary: "Sales velocity for Surge is stable this week." },
      expanded: { ...base.expanded!, execSummary: "This matters for Surge planning." },
      recommendationRationale: "Recommended for Surge to support weekly planning decisions.",
    };
    const samCard = {
      ...base,
      overview: { ...base.overview, oneLineSummary: "Sales velocity for Sam is stable this week." },
      expanded: { ...base.expanded!, execSummary: "This matters for Sam planning." },
      recommendationRationale: "Recommended for Sam to support weekly planning decisions.",
    };
    const result = evaluateReviewGates({
      users: [
        { userId: "surge", cards: [surgeCard] },
        { userId: "sam", cards: [samCard] },
      ],
    });
    const gate = result.gates.find((g) => g.id === "surge_sam_personalization");
    expect(gate?.pass).toBe(false);
  });
});

function mkCard(kpiId: string, value: string) {
  return {
    kpiId,
    requestType: "recommended" as const,
    dataSufficiency: "sufficient" as const,
    recommendationRationale: "Because this impacts weekly decisions for growth.",
    narrativeSource: "fallback" as const,
    overview: {
      currentValue: value,
      kpiId,
      title: "KPI",
      changePct: 0,
      changeLabel: "",
      oneLineSummary: "",
      provenance: {},
    },
    expanded: {
      execSummary: "Summary",
      takeawayBreakdown: { directionGoodOrBad: "good", expectedOrUnexpected: "expected" },
      provenance: {},
    },
  };
}
