/**
 * E13: Same org — for a given kpiId, replayed KPI facts and provenance must not
 * diverge per user; persona copy may differ (display name in narrative strings).
 */
import { describe, expect, it } from "vitest";
import { buildUserKpiContexts } from "./bi-stage.js";
import { buildStubCards } from "./stub-cards.js";

describe("shared KPI replay across users (E13)", () => {
  it("matches overview numbers and provenance for every shared kpiId", () => {
    const ctxs = buildUserKpiContexts(
      ["surge", "sam"],
      new Map([
        ["surge", "Surge User"],
        ["sam", "Sam User"],
      ]),
    );
    const a = buildStubCards(ctxs[0]!);
    const b = buildStubCards(ctxs[1]!);
    expect(a).toHaveLength(b.length);
    const byKpi = new Map(b.map((c) => [c.kpiId, c]));
    for (const card of a) {
      const other = byKpi.get(card.kpiId);
      expect(other).toBeDefined();
      expect(card.overview.currentValue).toBe(other!.overview.currentValue);
      expect(card.overview.changePct).toEqual(other!.overview.changePct);
      expect(card.overview.provenance).toEqual(other!.overview.provenance);
      if (card.expanded && other!.expanded) {
        expect(card.expanded.provenance).toEqual(other!.expanded.provenance);
      }
      if (card.insufficient && other!.insufficient) {
        expect(card.insufficient.kpiId).toBe(other!.insufficient.kpiId);
        expect(card.insufficient.metricsWithheld).toBe(true);
      }
    }
  });

  it("allows persona-specific copy strings while facts stay aligned", () => {
    const ctxs = buildUserKpiContexts(
      ["surge", "sam"],
      new Map([
        ["surge", "Surge"],
        ["sam", "Sam"],
      ]),
    );
    const a = buildStubCards(ctxs[0]!).find((c) => c.dataSufficiency === "sufficient");
    const b = buildStubCards(ctxs[1]!).find((c) => c.kpiId === a?.kpiId);
    expect(a?.overview.oneLineSummary).not.toBe(b?.overview.oneLineSummary);
    expect(a?.overview.currentValue).toBe(b?.overview.currentValue);
  });
});
