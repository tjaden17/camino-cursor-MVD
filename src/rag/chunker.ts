import type { KnowledgeChunk } from "./types.js";

/**
 * Split a markdown file into chunks at H2 (##) boundaries.
 * H3+ content is folded into the nearest parent H2 chunk.
 * Any content before the first H2 becomes an "intro" chunk.
 */
export function chunkMarkdown(
  markdown: string,
  kb: KnowledgeChunk["kb"],
  sourcePath: string,
): KnowledgeChunk[] {
  const lines = markdown.split("\n");
  const sections: { heading: string; lines: string[] }[] = [];

  let current: { heading: string; lines: string[] } = {
    heading: "_intro",
    lines: [],
  };

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)/);
    if (h2Match) {
      sections.push(current);
      current = { heading: h2Match[1].trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  sections.push(current);

  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  return sections
    .filter((s) => s.lines.join("\n").trim().length > 0)
    .map((s) => ({
      id: `${sourcePath}#${slug(s.heading)}`,
      kb,
      sourcePath,
      heading: s.heading,
      text: s.lines.join("\n").trim(),
    }));
}
