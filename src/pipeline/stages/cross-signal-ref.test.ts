import { describe, expect, it } from "vitest";
import { getRelatedSignals } from "./cross-signal-ref.js";

describe("cross-signal-ref", () => {
  it("win_rate returns 2 related signals", () => {
    const signals = getRelatedSignals("win_rate");
    expect(signals).toHaveLength(2);
    expect(signals[0].kpiId).toBe("pipeline_value");
    expect(signals[1].kpiId).toBe("avg_deal_size");
  });

  it("shifts returns 2 related signals", () => {
    const signals = getRelatedSignals("shifts");
    expect(signals).toHaveLength(2);
    expect(signals[0].kpiId).toBe("shift_utilisation");
    expect(signals[1].kpiId).toBe("inactive_pharmacy_rate");
  });

  it("unknown KPI returns empty array", () => {
    const signals = getRelatedSignals("totally_made_up_kpi");
    expect(signals).toEqual([]);
  });

  it("all known KPIs in the graph have at most 2 related signals", () => {
    const knownKpis = [
      "win_rate", "support_issue_volume", "prospects", "pipeline_value",
      "shifts", "shift_utilisation", "inactive_pharmacy_rate", "jobs_posted",
      "resolution_time", "sla_compliance", "fcr_rate", "ticket_reopen_rate",
      "csat", "sentiment_trend", "avg_deal_size",
    ];
    for (const kpiId of knownKpis) {
      const signals = getRelatedSignals(kpiId);
      expect(signals.length, `${kpiId} has more than 2 related signals`).toBeLessThanOrEqual(2);
    }
  });

  it("related signals have non-empty relationship descriptions", () => {
    const knownKpis = [
      "win_rate", "support_issue_volume", "prospects", "pipeline_value",
      "shifts", "shift_utilisation", "inactive_pharmacy_rate", "jobs_posted",
      "resolution_time", "sla_compliance", "fcr_rate", "ticket_reopen_rate",
      "csat", "sentiment_trend", "avg_deal_size",
    ];
    for (const kpiId of knownKpis) {
      for (const signal of getRelatedSignals(kpiId)) {
        expect(signal.relationship, `${kpiId} → ${signal.kpiId} has empty relationship`).toBeTruthy();
        expect(signal.title, `${kpiId} → ${signal.kpiId} has empty title`).toBeTruthy();
        expect(signal.kpiId, `signal in ${kpiId} has empty kpiId`).toBeTruthy();
      }
    }
  });
});
