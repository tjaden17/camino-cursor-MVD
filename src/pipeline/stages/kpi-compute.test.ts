import { describe, expect, it } from "vitest";
import { computeKpi, computeAllForUser } from "./kpi-compute.js";
import type { ComputedKpi } from "./kpi-compute.js";

/* ------------------------------------------------------------------ */
/*  Helper: assert every KPI has the required structural fields        */
/* ------------------------------------------------------------------ */
function assertStructure(kpi: ComputedKpi) {
  expect(kpi.kpiId).toBeTruthy();
  expect(typeof kpi.value).toBe("number");
  expect(kpi.displayValue).toBeTruthy();
  expect(kpi.trend).toBeDefined();
  expect(["up", "down", "flat"]).toContain(kpi.trend.direction);
  expect(kpi.provenance).toBeDefined();
  expect(kpi.provenance.sourceId).toBeTruthy();
  expect(kpi.provenance.sourcePath).toBeTruthy();
  expect(kpi.provenance.formula).toBeTruthy();
  expect(kpi.provenance.rowCount).toBeGreaterThan(0);
  expect(kpi.provenance.sampleRows.length).toBeGreaterThan(0);
  expect(kpi.dataFreshness).toBeTruthy();
}

/* ================================================================== */
/*  Surge KPIs                                                         */
/* ================================================================== */
describe("Surge KPIs", () => {
  it("win_rate returns a percentage between 0-100", () => {
    const result = computeKpi("win_rate");
    expect(result).not.toBeNull();
    assertStructure(result!);
    expect(result!.value).toBeGreaterThanOrEqual(0);
    expect(result!.value).toBeLessThanOrEqual(100);
  });

  it("support_issue_volume returns 4645 (total desk tickets)", () => {
    const result = computeKpi("support_issue_volume");
    expect(result).not.toBeNull();
    assertStructure(result!);
    expect(result!.value).toBe(4645);
    expect(result!.breakdowns).toBeDefined();
    expect(result!.breakdowns!["by_channel"]).toBeDefined();
    expect(result!.breakdowns!["by_category"]).toBeDefined();
    expect(result!.breakdowns!["by_priority"]).toBeDefined();
  });

  it("prospects returns the count of lead rows", () => {
    const result = computeKpi("prospects");
    expect(result).not.toBeNull();
    assertStructure(result!);
    expect(result!.value).toBe(53);
    expect(result!.breakdowns).toBeDefined();
    expect(result!.breakdowns!["by_converted"]).toBeDefined();
  });

  it("pipeline_value returns a positive number", () => {
    const result = computeKpi("pipeline_value");
    expect(result).not.toBeNull();
    assertStructure(result!);
    expect(result!.value).toBeGreaterThan(0);
  });

  it("resolution_time returns a positive number (hours)", () => {
    const result = computeKpi("resolution_time");
    expect(result).not.toBeNull();
    assertStructure(result!);
    expect(result!.value).toBeGreaterThan(0);
  });

  it("sla_compliance returns a percentage between 0-100", () => {
    const result = computeKpi("sla_compliance");
    expect(result).not.toBeNull();
    assertStructure(result!);
    expect(result!.value).toBeGreaterThanOrEqual(0);
    expect(result!.value).toBeLessThanOrEqual(100);
  });

  it("fcr_rate returns a percentage between 0-100", () => {
    const result = computeKpi("fcr_rate");
    expect(result).not.toBeNull();
    assertStructure(result!);
    expect(result!.value).toBeGreaterThanOrEqual(0);
    expect(result!.value).toBeLessThanOrEqual(100);
  });

  it("ticket_reopen_rate returns a percentage between 0-100", () => {
    const result = computeKpi("ticket_reopen_rate");
    expect(result).not.toBeNull();
    assertStructure(result!);
    expect(result!.value).toBeGreaterThanOrEqual(0);
    expect(result!.value).toBeLessThanOrEqual(100);
  });

  it("csat returns a positive number", () => {
    const result = computeKpi("csat");
    expect(result).not.toBeNull();
    assertStructure(result!);
    expect(result!.value).toBeGreaterThan(0);
  });

  it("sentiment_trend has breakdowns with positive/negative/neutral counts", () => {
    const result = computeKpi("sentiment_trend");
    expect(result).not.toBeNull();
    assertStructure(result!);
    expect(result!.breakdowns).toBeDefined();
    const bySentiment = result!.breakdowns!["by_sentiment"];
    expect(bySentiment).toBeDefined();
    const keys = Object.keys(bySentiment);
    expect(keys.length).toBeGreaterThanOrEqual(1);
    for (const count of Object.values(bySentiment)) {
      expect(count).toBeGreaterThanOrEqual(0);
    }
    expect(result!.value).toBeGreaterThanOrEqual(0);
    expect(result!.value).toBeLessThanOrEqual(100);
  });
});

/* ================================================================== */
/*  Sam KPIs                                                           */
/* ================================================================== */
describe("Sam KPIs", () => {
  it("shifts returns a positive count", () => {
    const result = computeKpi("shifts");
    expect(result).not.toBeNull();
    assertStructure(result!);
    expect(result!.value).toBeGreaterThan(0);
  });

  it("shift_utilisation returns a percentage between 0-100", () => {
    const result = computeKpi("shift_utilisation");
    expect(result).not.toBeNull();
    assertStructure(result!);
    expect(result!.value).toBeGreaterThanOrEqual(0);
    expect(result!.value).toBeLessThanOrEqual(100);
  });

  it("inactive_pharmacy_rate returns a percentage between 0-100", () => {
    const result = computeKpi("inactive_pharmacy_rate");
    expect(result).not.toBeNull();
    assertStructure(result!);
    expect(result!.value).toBeGreaterThanOrEqual(0);
    expect(result!.value).toBeLessThanOrEqual(100);
  });

  it("jobs_posted returns a positive count", () => {
    const result = computeKpi("jobs_posted");
    expect(result).not.toBeNull();
    assertStructure(result!);
    expect(result!.value).toBeGreaterThan(0);
  });

  it("avg_deal_size returns a positive number", () => {
    const result = computeKpi("avg_deal_size");
    expect(result).not.toBeNull();
    assertStructure(result!);
    expect(result!.value).toBeGreaterThan(0);
  });
});

/* ================================================================== */
/*  computeAllForUser                                                  */
/* ================================================================== */
describe("computeAllForUser", () => {
  it("surge returns 10 KPIs", () => {
    const results = computeAllForUser("surge");
    expect(results).toHaveLength(10);
    for (const kpi of results) {
      assertStructure(kpi);
    }
  });

  it("sam returns 7 KPIs (sufficient + org-wide recommended)", () => {
    const results = computeAllForUser("sam");
    expect(results).toHaveLength(7);
    for (const kpi of results) {
      assertStructure(kpi);
    }
  });
});

/* ================================================================== */
/*  Provenance & freshness on every KPI                                */
/* ================================================================== */
describe("provenance and data freshness", () => {
  it("every computed KPI has non-empty provenance", () => {
    const all = [...computeAllForUser("surge"), ...computeAllForUser("sam")];
    for (const kpi of all) {
      expect(kpi.provenance.sourceId, `${kpi.kpiId} missing sourceId`).toBeTruthy();
      expect(kpi.provenance.sourcePath, `${kpi.kpiId} missing sourcePath`).toBeTruthy();
      expect(kpi.provenance.formula, `${kpi.kpiId} missing formula`).toBeTruthy();
      expect(kpi.provenance.rowCount, `${kpi.kpiId} rowCount=0`).toBeGreaterThan(0);
    }
  });

  it("every computed KPI has a dataFreshness ISO date string", () => {
    const all = [...computeAllForUser("surge"), ...computeAllForUser("sam")];
    for (const kpi of all) {
      expect(kpi.dataFreshness, `${kpi.kpiId} missing dataFreshness`).toBeTruthy();
      expect(new Date(kpi.dataFreshness).toString()).not.toBe("Invalid Date");
    }
  });
});
