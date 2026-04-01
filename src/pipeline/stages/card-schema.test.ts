import { describe, expect, it } from "vitest";
import {
  buildProvenanceSummary,
  buildSignalCard,
  buildInsufficientCardV2,
} from "./card-schema.js";
import type { ComputedKpi } from "./kpi-compute.js";
import type { InsufficientCard } from "./insufficient-cards.js";

const MOCK_KPI: ComputedKpi = {
  kpiId: "win_rate",
  value: 42.86,
  displayValue: "42.86%",
  previousValue: null,
  trend: { direction: "flat", delta: null, deltaPct: null },
  provenance: {
    sourceId: "zoho_crm_deals",
    sourcePath: "data/zoho/Zoho - CRM - Deals.csv",
    formula: "Closed Won / (Closed Won + Closed Lost) * 100",
    rowCount: 245,
    sampleRows: [{ Id: "1", Stage: "Closed Won" }],
    timeRange: { start: "2025-01-01", end: "2026-03-29", label: "Jan 2025–Mar 2026" },
  },
  dataFreshness: "2026-03-15",
  breakdowns: { by_stage: { "Closed Won": 90, "Closed Lost": 120 } },
};

const MOCK_INSUFFICIENT: InsufficientCard = {
  kpiId: "calls_per_week",
  title: "Calls Per Week",
  type: "recommended",
  status: "insufficient",
  whatItWouldTell: "How many outbound calls the sales team makes weekly",
  whatsNeeded: "Zoho CRM Activities export",
  howToProvide: "Export from Zoho CRM > Activities > Export to CSV",
  whatItUnlocks: "Outbound activity visibility",
  decisionLink: "Sales team resource allocation",
  relatedDecisionIds: ["d-1"],
};

describe("card-schema", () => {
  describe("buildProvenanceSummary", () => {
    it("produces a human-readable summary", () => {
      const s = buildProvenanceSummary(MOCK_KPI);
      expect(s).toContain("245");
      expect(s).toContain("zoho_crm_deals");
      expect(s).toContain("2026-03-15");
    });
  });

  describe("buildSignalCard", () => {
    const card = buildSignalCard(
      MOCK_KPI,
      "Win Rate",
      "%",
      "A",
      "requested",
      {
        conclusion: "Win rate is healthy at 42.86%",
        chainOfThought: ["Checked closed deals", "Computed ratio"],
      },
      {
        conclusion: "Above seed-stage SaaS benchmark of 20-25%",
        chainOfThought: ["Compared to OpenView 2024"],
        citedBenchmarks: [
          { claim: "Seed-stage SaaS win rate: 20-25%", source: "OpenView SaaS Benchmarks 2024" },
        ],
      },
      [
        { kpiId: "pipeline_value", title: "Pipeline Value", relationship: "Contributing factor" },
      ],
      new Map([["pipeline_value", "$340,000"]]),
      [{ kb: "kb2", heading: "Sales Benchmarks", sourcePath: "knowledge/kb2-sales.md" }],
      [],
      "llm",
    );

    it("has correct kpiId and version", () => {
      expect(card.kpiId).toBe("win_rate");
      expect(card.cardVersion).toBe("A");
    });

    it("has dataFreshness", () => {
      expect(card.dataFreshness).toBe("2026-03-15");
    });

    it("has provenanceSummary", () => {
      expect(card.provenanceSummary).toContain("245");
    });

    it("has analysis with chain of thought", () => {
      expect(card.analysis.chainOfThought.length).toBeGreaterThan(0);
    });

    it("has synthesis with cited benchmarks", () => {
      expect(card.synthesis.citedBenchmarks.length).toBeGreaterThan(0);
      expect(card.synthesis.citedBenchmarks[0].source).toContain("OpenView");
    });

    it("has cross-signal references with current values", () => {
      expect(card.crossSignalReferences.length).toBe(1);
      expect(card.crossSignalReferences[0].currentValue).toBe("$340,000");
    });

    it("has retrieved sources", () => {
      expect(card.retrievedSources.length).toBeGreaterThan(0);
    });

    it("marks as sufficient and requested", () => {
      expect(card.dataSufficiency).toBe("sufficient");
      expect(card.requestType).toBe("requested");
    });

    it("records narrativeSource", () => {
      expect(card.narrativeSource).toBe("llm");
    });
  });

  describe("buildInsufficientCardV2", () => {
    const card = buildInsufficientCardV2(MOCK_INSUFFICIENT, "A");

    it("has correct kpiId", () => {
      expect(card.kpiId).toBe("calls_per_week");
    });

    it("marks as insufficient and recommended", () => {
      expect(card.dataSufficiency).toBe("insufficient");
      expect(card.requestType).toBe("recommended");
    });

    it("has all required fields", () => {
      expect(card.whatItWouldTell).toBeTruthy();
      expect(card.whatsNeeded).toBeTruthy();
      expect(card.howToProvide).toBeTruthy();
      expect(card.whatItUnlocks).toBeTruthy();
      expect(card.decisionLink).toBeTruthy();
    });

    it("card missing dataFreshness fails type check", () => {
      const partial = { ...card } as Record<string, unknown>;
      expect(partial["dataFreshness"]).toBeUndefined();
    });
  });
});
