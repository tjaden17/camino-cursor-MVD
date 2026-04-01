import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RetrievalResult } from "../../rag/types.js";
import type { InsufficientCard } from "./insufficient-cards.js";

vi.mock("../../rag/index.js", () => ({
  retrieve: vi.fn(),
}));

import { retrieve } from "../../rag/index.js";
import { enrichInsufficientCardWithRag } from "./insufficient-rag-enrichment.js";

const MOCK_CARD: InsufficientCard = {
  kpiId: "calls_per_week",
  title: "Calls Per Week",
  type: "recommended",
  status: "insufficient",
  whatItWouldTell: "Call volume",
  whatsNeeded: "CRM activities",
  howToProvide: "Export CSV",
  whatItUnlocks: "Rep activity",
  decisionLink: "Expansion",
  relatedDecisionIds: ["d-1"],
};

function makeResult(text: string, kb: "kb1" | "kb2", path: string, heading: string): RetrievalResult {
  return {
    chunk: {
      id: "c1",
      kb,
      sourcePath: path,
      heading,
      text,
    },
    distance: 0.2,
  };
}

describe("enrichInsufficientCardWithRag", () => {
  beforeEach(() => {
    vi.mocked(retrieve).mockReset();
  });

  it("merges KB2 and KB1 excerpts and records source snippets", async () => {
    vi.mocked(retrieve)
      .mockResolvedValueOnce([makeResult("Benchmarks for call activity matter.", "kb2", "knowledge/kb2.md", "Bench")])
      .mockResolvedValueOnce([makeResult("Surge focuses on GTM scaling.", "kb1", "knowledge/kb1.md", "User")]);

    const out = await enrichInsufficientCardWithRag(MOCK_CARD, "Surge");

    expect(out.domainContextParagraph).toContain("Benchmarks");
    expect(out.userDecisionParagraph).toContain("Surge");
    expect(out.retrievedKbSources?.length).toBeGreaterThanOrEqual(2);
    expect(out.kpiId).toBe("calls_per_week");
    expect(out.whatsNeeded).toBe(MOCK_CARD.whatsNeeded);
  });

  it("uses deterministic fallback copy when retrieval is empty", async () => {
    vi.mocked(retrieve).mockResolvedValue([]);
    const out = await enrichInsufficientCardWithRag(MOCK_CARD, "sam");
    expect(out.kpiId).toBe("calls_per_week");
    expect(out.domainContextParagraph).toContain("could not be retrieved");
    expect(out.retrievedKbSources?.length ?? 0).toBe(0);
  });
});
