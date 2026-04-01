import { describe, expect, it } from "vitest";
import { loadAllKnowledgeChunks } from "./load-knowledge.js";

describe("loadAllKnowledgeChunks", () => {
  const chunks = loadAllKnowledgeChunks();

  it("loads chunks from all 14 knowledge files", () => {
    const files = new Set(chunks.map((c) => c.sourcePath));
    expect(files.size).toBe(14);
  });

  it("assigns kb1 label to kb1- files", () => {
    const kb1 = chunks.filter((c) => c.kb === "kb1");
    expect(kb1.length).toBeGreaterThan(0);
    for (const c of kb1) {
      expect(c.sourcePath).toContain("kb1-");
    }
  });

  it("assigns kb2 label to kb2- files", () => {
    const kb2 = chunks.filter((c) => c.kb === "kb2");
    expect(kb2.length).toBeGreaterThan(0);
    for (const c of kb2) {
      expect(c.sourcePath).toContain("kb2-");
    }
  });

  it("assigns kb3 label to kb3- files", () => {
    const kb3 = chunks.filter((c) => c.kb === "kb3");
    expect(kb3.length).toBeGreaterThan(0);
    for (const c of kb3) {
      expect(c.sourcePath).toContain("kb3-");
    }
  });

  it("produces at least 30 chunks across all files", () => {
    expect(chunks.length).toBeGreaterThanOrEqual(30);
  });

  it("every chunk has non-empty text", () => {
    for (const c of chunks) {
      expect(c.text.trim().length).toBeGreaterThan(0);
    }
  });

  it("every chunk has a unique id", () => {
    const ids = chunks.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
