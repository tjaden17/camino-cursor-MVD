import { describe, expect, it } from "vitest";
import { evaluateDecisionTriggers } from "./decision-triggers.js";
import type { ComputedKpi } from "./kpi-compute.js";

function kpi(
  id: string,
  trend: ComputedKpi["trend"]["direction"],
): ComputedKpi {
  return {
    kpiId: id,
    value: 1,
    displayValue: "1",
    previousValue: 0.9,
    trend: { direction: trend, delta: 0, deltaPct: 0 },
    provenance: {
      sourceId: "test",
      sourcePath: "t.csv",
      formula: "x",
      rowCount: 1,
      sampleRows: [],
    },
    dataFreshness: "2026-03-30",
  };
}

describe("evaluateDecisionTriggers", () => {
  const decisions = [
    {
      decisionId: "surge-hiring-vs-outsourcing-support",
      role: "CEO",
      userId: "surge",
      decision: "Hiring vs outsourcing for support",
      timeframe: "90d",
      informingSignals: ["support_issue_volume", "resolution_time"],
      triggerPatterns: [
        {
          pattern:
            "support_issue_volume rising 3+ consecutive weeks AND resolution_time stable",
          recommendation: "Consider capacity before SLA risk.",
        },
        {
          pattern: "sla_compliance trending down while support_issue_volume is high",
          recommendation: "Evaluate hire vs outsource.",
        },
      ],
    },
    {
      decisionId: "surge-market-expansion",
      role: "CEO",
      userId: "surge",
      decision: "Market expansion",
      timeframe: "6 months",
      informingSignals: ["prospects", "pipeline_value"],
      triggerPatterns: [
        {
          pattern: "pipeline_value growing but prospects or calls_per_week not keeping pace",
          recommendation: "Check GTM focus.",
        },
      ],
    },
  ];

  it("fires support volume + resolution stable pattern", () => {
    const computed = [
      kpi("support_issue_volume", "up"),
      kpi("resolution_time", "flat"),
    ];
    const hits = evaluateDecisionTriggers("surge", computed, decisions);
    expect(hits.some((h) => h.decisionId === "surge-hiring-vs-outsourcing-support")).toBe(true);
  });

  it("fires pipeline vs prospects pattern", () => {
    const computed = [kpi("pipeline_value", "up"), kpi("prospects", "flat")];
    const hits = evaluateDecisionTriggers("surge", computed, decisions);
    expect(hits.some((h) => h.decisionId === "surge-market-expansion")).toBe(true);
  });

  it("does not fire for wrong user", () => {
    const computed = [kpi("support_issue_volume", "up"), kpi("resolution_time", "flat")];
    const hits = evaluateDecisionTriggers("sam", computed, decisions);
    expect(hits.filter((h) => h.userId === "surge")).toHaveLength(0);
  });
});
