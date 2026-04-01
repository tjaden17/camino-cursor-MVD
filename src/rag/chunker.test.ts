import { describe, expect, it } from "vitest";
import { chunkMarkdown } from "./chunker.js";

const SAMPLE_MD = `# Main Title

Intro paragraph.

## Section One

Content for section one. This is a normal paragraph with some detail
about SaaS support benchmarks.

## Section Two

Content for section two. More detail here about
sales benchmarks and pipeline coverage.

### Subsection 2a

Nested content under subsection 2a.

## Section Three

Final section content.
`;

describe("chunkMarkdown", () => {
  it("splits by H2 headings", () => {
    const chunks = chunkMarkdown(SAMPLE_MD, "kb2", "knowledge/test.md");
    const headings = chunks.map((c) => c.heading);
    expect(headings).toContain("Section One");
    expect(headings).toContain("Section Two");
    expect(headings).toContain("Section Three");
  });

  it("includes intro content as first chunk", () => {
    const chunks = chunkMarkdown(SAMPLE_MD, "kb2", "knowledge/test.md");
    expect(chunks[0].text).toContain("Intro paragraph");
  });

  it("assigns correct kb label", () => {
    const chunks = chunkMarkdown(SAMPLE_MD, "kb2", "knowledge/test.md");
    for (const c of chunks) {
      expect(c.kb).toBe("kb2");
    }
  });

  it("assigns correct sourcePath", () => {
    const chunks = chunkMarkdown(SAMPLE_MD, "kb1", "knowledge/kb1-context.md");
    for (const c of chunks) {
      expect(c.sourcePath).toBe("knowledge/kb1-context.md");
    }
  });

  it("generates unique IDs per chunk", () => {
    const chunks = chunkMarkdown(SAMPLE_MD, "kb2", "knowledge/test.md");
    const ids = chunks.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("includes subsection content in parent H2 chunk", () => {
    const chunks = chunkMarkdown(SAMPLE_MD, "kb2", "knowledge/test.md");
    const s2 = chunks.find((c) => c.heading === "Section Two");
    expect(s2).toBeDefined();
    expect(s2!.text).toContain("Nested content under subsection 2a");
  });

  it("handles file with no H2 headings as single chunk", () => {
    const plain = "Just some text\nwith multiple lines\nbut no headings.";
    const chunks = chunkMarkdown(plain, "kb3", "knowledge/plain.md");
    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toContain("Just some text");
  });

  it("produces non-empty text for each chunk", () => {
    const chunks = chunkMarkdown(SAMPLE_MD, "kb2", "knowledge/test.md");
    for (const c of chunks) {
      expect(c.text.trim().length).toBeGreaterThan(0);
    }
  });
});
