import { describe, expect, it } from "vitest";
import { mergeNarrativesIntoCards } from "./llm.js";
import { buildUserKpiContexts } from "./bi-stage.js";
import { buildStubCards } from "./stub-cards.js";

describe("mergeNarrativesIntoCards", () => {
  it("marks merged cards as llm and untouched cards as fallback", () => {
    const ctx = buildUserKpiContexts(["surge"], new Map([["surge", "Surge"]]))[0]!;
    const cards = buildStubCards(ctx);
    const target = cards.find((c) => c.dataSufficiency === "sufficient")!;

    const out = mergeNarrativesIntoCards(cards, [
      { kpiId: target.kpiId, execSummary: "Updated by model" },
    ]);

    const updated = out.find((c) => c.kpiId === target.kpiId)!;
    const untouched = out.find((c) => c.kpiId !== target.kpiId)!;
    expect(updated.narrativeSource).toBe("llm");
    expect(untouched.narrativeSource).toBe("fallback");
  });
});
