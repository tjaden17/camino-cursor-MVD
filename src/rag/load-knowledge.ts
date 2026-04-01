import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getRepoRoot } from "../repo-root.js";
import { chunkMarkdown } from "./chunker.js";
import type { KnowledgeChunk } from "./types.js";

/**
 * Reads all markdown files from the knowledge/ directory,
 * determines which KB they belong to from the filename prefix,
 * and returns an array of ready-to-index chunks.
 */
export function loadAllKnowledgeChunks(): KnowledgeChunk[] {
  const root = getRepoRoot();
  const dir = join(root, "knowledge");
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));

  const chunks: KnowledgeChunk[] = [];

  for (const file of files) {
    const kb = inferKb(file);
    const relPath = `knowledge/${file}`;
    const content = readFileSync(join(dir, file), "utf8");
    chunks.push(...chunkMarkdown(content, kb, relPath));
  }

  return chunks;
}

function inferKb(filename: string): KnowledgeChunk["kb"] {
  if (filename.startsWith("kb1-")) return "kb1";
  if (filename.startsWith("kb2-")) return "kb2";
  if (filename.startsWith("kb3-")) return "kb3";
  return "kb1";
}
