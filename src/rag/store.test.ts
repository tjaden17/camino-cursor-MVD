import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { indexChunks, retrieve, dropCollection, setNamespace } from "./store.js";
import type { KnowledgeChunk } from "./types.js";

const TEST_CHUNKS: KnowledgeChunk[] = [
  {
    id: "test-1",
    kb: "kb2",
    sourcePath: "knowledge/kb2-test.md",
    heading: "Sales Benchmarks",
    text: "Average SaaS win rate is 20-25%. Pipeline coverage ratio should be 3-4x. Close rates for enterprise deals typically range 15-20%.",
  },
  {
    id: "test-2",
    kb: "kb2",
    sourcePath: "knowledge/kb2-test.md",
    heading: "Support Benchmarks",
    text: "First response time for support tickets should be under 4 hours. Resolution time benchmark is 24 hours for standard issues.",
  },
  {
    id: "test-3",
    kb: "kb1",
    sourcePath: "knowledge/kb1-test.md",
    heading: "Company Context",
    text: "Locumate is a pharmacy locum staffing platform operating in Australia and UK markets.",
  },
  {
    id: "test-4",
    kb: "kb3",
    sourcePath: "knowledge/kb3-test.md",
    heading: "Metric Formulas",
    text: "Win rate formula: won_deals / total_closed_deals * 100. Pipeline coverage: open_pipeline_value / quota.",
  },
];

describe("store — index and retrieve", () => {
  beforeAll(async () => {
    setNamespace("store-unit-test");
    await dropCollection();
    await indexChunks(TEST_CHUNKS);
  });

  afterAll(async () => {
    await dropCollection();
    setNamespace("default");
  });

  it("indexes correct number of chunks", async () => {
    const stats = await indexChunks(TEST_CHUNKS);
    expect(stats.totalChunks).toBe(4);
  });

  it("retrieves relevant chunks for sales query", async () => {
    const results = await retrieve("win rate pipeline sales");
    expect(results.length).toBeGreaterThan(0);
    const ids = results.map((r) => r.chunk.id);
    expect(ids).toContain("test-1");
  });

  it("retrieves relevant chunks for support query", async () => {
    const results = await retrieve("support ticket response time");
    expect(results.length).toBeGreaterThan(0);
    const ids = results.map((r) => r.chunk.id);
    expect(ids).toContain("test-2");
  });

  it("filters by kb", async () => {
    const results = await retrieve("pharmacy platform market", 5, {
      kb: "kb1",
    });
    for (const r of results) {
      expect(r.chunk.kb).toBe("kb1");
    }
  });

  it("returns results sorted by relevance (lowest distance first)", async () => {
    const results = await retrieve("win rate formula close rate");
    if (results.length > 1) {
      for (let i = 1; i < results.length; i++) {
        expect(results[i].distance).toBeGreaterThanOrEqual(
          results[i - 1].distance,
        );
      }
    }
  });

  it("respects topK limit", async () => {
    const results = await retrieve("rate", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});
