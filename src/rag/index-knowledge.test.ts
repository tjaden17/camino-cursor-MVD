import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { loadAllKnowledgeChunks } from "./load-knowledge.js";
import { indexChunks, retrieve, dropCollection, setNamespace } from "./store.js";

describe("full index + retrieval (integration)", () => {
  beforeAll(async () => {
    setNamespace("integration-test");
    await dropCollection();
    const chunks = loadAllKnowledgeChunks();
    await indexChunks(chunks);
  });

  afterAll(async () => {
    await dropCollection();
    setNamespace("default");
  });

  it("retrieves SaaS win rate benchmarks from kb2", async () => {
    const results = await retrieve("SaaS win rate benchmark", 3, {
      kb: "kb2",
    });
    expect(results.length).toBeGreaterThan(0);
    const texts = results.map((r) => r.chunk.text.toLowerCase());
    expect(texts.some((t) => t.includes("win") || t.includes("rate"))).toBe(
      true,
    );
  });

  it("retrieves Locumate company context from kb1", async () => {
    const results = await retrieve("Locumate pharmacy staffing platform", 3, {
      kb: "kb1",
    });
    expect(results.length).toBeGreaterThan(0);
  });

  it("retrieves chain-of-thought template from kb3", async () => {
    const results = await retrieve("chain of thought analysis template", 3, {
      kb: "kb3",
    });
    expect(results.length).toBeGreaterThan(0);
  });

  it("retrieves anti-hallucination rules from kb3", async () => {
    const results = await retrieve(
      "hallucination prevention rules guardrails",
      3,
      { kb: "kb3" },
    );
    expect(results.length).toBeGreaterThan(0);
  });

  it("cross-KB query returns mixed results", async () => {
    const results = await retrieve("support ticket metrics analysis", 5);
    expect(results.length).toBeGreaterThan(0);
  });
});
