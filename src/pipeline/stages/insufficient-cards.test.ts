import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getRepoRoot } from "../../repo-root.js";
import {
  generateInsufficientCard,
  generateAllInsufficientCards,
} from "./insufficient-cards.js";
import type { KpiSpecEntry, Decision } from "./insufficient-cards.js";

/* ================================================================== */
/*  Test helpers — load fixtures once                                  */
/* ================================================================== */

interface KpiSpecFile {
  kpis: KpiSpecEntry[];
}
interface DecisionFile {
  decisions: Decision[];
}

const specFile = JSON.parse(
  readFileSync(join(getRepoRoot(), "data/kpi-spec/kpi-spec-v2.json"), "utf8"),
) as KpiSpecFile;

const decisionFile = JSON.parse(
  readFileSync(join(getRepoRoot(), "data/decision-catalogue/decisions-v1.json"), "utf8"),
) as DecisionFile;

function findKpi(kpiId: string): KpiSpecEntry {
  const kpi = specFile.kpis.find((k) => k.kpiId === kpiId);
  if (!kpi) throw new Error(`KPI ${kpiId} not found in spec`);
  return kpi;
}

/* ================================================================== */
/*  Individual card tests                                              */
/* ================================================================== */

describe("generateInsufficientCard", () => {
  it("Surge's calls_per_week generates a valid card", () => {
    const kpi = findKpi("calls_per_week");
    const card = generateInsufficientCard("calls_per_week", kpi, decisionFile.decisions);

    expect(card.kpiId).toBe("calls_per_week");
    expect(card.title).toBe("Calls Per Week");
    expect(card.type).toBe("recommended");
    expect(card.status).toBe("insufficient");
    expect(card.whatItWouldTell).toContain("Calls Per Week");
    expect(card.whatsNeeded).toContain("Zoho CRM Activities");
    expect(card.howToProvide).toBeTruthy();
    expect(card.relatedDecisionIds.length).toBeGreaterThanOrEqual(1);
  });

  it("Sam's signups generates a valid card", () => {
    const kpi = findKpi("signups");
    const card = generateInsufficientCard("signups", kpi, decisionFile.decisions);

    expect(card.kpiId).toBe("signups");
    expect(card.title).toBe("Signups");
    expect(card.type).toBe("recommended");
    expect(card.status).toBe("insufficient");
    expect(card.whatItWouldTell).toContain("Signups");
    expect(card.whatsNeeded).toContain("Admin CP");
    expect(card.howToProvide).toBeTruthy();
  });
});

/* ================================================================== */
/*  Batch generation tests                                             */
/* ================================================================== */

describe("generateAllInsufficientCards", () => {
  it("surge returns 5 cards", () => {
    const cards = generateAllInsufficientCards("surge");
    expect(cards).toHaveLength(5);
  });

  it("sam returns 3 cards", () => {
    const cards = generateAllInsufficientCards("sam");
    expect(cards).toHaveLength(3);
  });

  it("every card has non-empty whatItWouldTell, whatsNeeded, howToProvide", () => {
    const all = [
      ...generateAllInsufficientCards("surge"),
      ...generateAllInsufficientCards("sam"),
    ];
    for (const card of all) {
      expect(card.whatItWouldTell, `${card.kpiId} missing whatItWouldTell`).toBeTruthy();
      expect(card.whatsNeeded, `${card.kpiId} missing whatsNeeded`).toBeTruthy();
      expect(card.howToProvide, `${card.kpiId} missing howToProvide`).toBeTruthy();
    }
  });

  it("every card has type 'recommended' and status 'insufficient'", () => {
    const all = [
      ...generateAllInsufficientCards("surge"),
      ...generateAllInsufficientCards("sam"),
    ];
    for (const card of all) {
      expect(card.type).toBe("recommended");
      expect(card.status).toBe("insufficient");
    }
  });

  it("cards link to relevant decisions from the catalogue", () => {
    const surgeCards = generateAllInsufficientCards("surge");
    const callsCard = surgeCards.find((c) => c.kpiId === "calls_per_week");
    expect(callsCard).toBeDefined();
    expect(callsCard!.relatedDecisionIds.length).toBeGreaterThanOrEqual(1);
    expect(callsCard!.decisionLink).toContain("Market expansion");
  });
});
