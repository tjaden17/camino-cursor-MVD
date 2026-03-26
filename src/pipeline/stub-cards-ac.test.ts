/**
 * Gap-close AC: recommendation rationale + sourcing tips on stub cards.
 */
import { describe, expect, it } from "vitest";
import { buildUserKpiContexts } from "./bi-stage.js";
import { buildStubCards } from "./stub-cards.js";

describe("stub-cards AC copy fields", () => {
  const ctx = buildUserKpiContexts(["surge"], new Map([["surge", "Surge"]]))[0]!;
  const cards = buildStubCards(ctx);

  it("sets recommendationRationale only on recommended cards", () => {
    for (const c of cards) {
      if (c.requestType === "recommended") {
        expect(c.recommendationRationale).toBeDefined();
        expect(String(c.recommendationRationale).length).toBeGreaterThan(0);
      } else {
        expect(c.recommendationRationale).toBeUndefined();
      }
    }
  });

  it("adds sourcingTips to every insufficient-data card", () => {
    for (const c of cards.filter((x) => x.dataSufficiency === "insufficient")) {
      expect(c.insufficient?.sourcingTips).toBeDefined();
      expect(c.insufficient!.sourcingTips!.length).toBeGreaterThan(0);
    }
  });

  it("keeps recommendation rationale distinct from whyItMatters on recommended+insufficient", () => {
    for (const c of cards) {
      if (c.requestType !== "recommended" || c.dataSufficiency !== "insufficient") continue;
      const why = c.insufficient!.whyItMatters;
      const rec = c.recommendationRationale!;
      expect(rec.trim()).not.toBe(why.trim());
      expect(rec.length).toBeGreaterThan(10);
    }
  });
});
