import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getRepoRoot } from "../repo-root.js";
import type { KnowledgeChunk, RetrievalResult, IndexStats } from "./types.js";

const STORE_DIR = ".cache/rag";

let activeNamespace = "default";

/**
 * Switch the active store namespace (useful for test isolation).
 * Each namespace gets its own JSON file.
 */
export function setNamespace(ns: string): void {
  activeNamespace = ns;
}

function storePath(): string {
  const dir = join(getRepoRoot(), STORE_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return join(dir, `chunks-${activeNamespace}.json`);
}

function loadStore(): KnowledgeChunk[] {
  const p = storePath();
  if (!existsSync(p)) return [];
  return JSON.parse(readFileSync(p, "utf8")) as KnowledgeChunk[];
}

function saveStore(chunks: KnowledgeChunk[]): void {
  writeFileSync(storePath(), JSON.stringify(chunks, null, 2));
}

/**
 * Index chunks into local file-based store.
 * Replaces any existing chunks with matching IDs (upsert).
 */
export async function indexChunks(
  chunks: KnowledgeChunk[],
): Promise<IndexStats> {
  const existing = loadStore();
  const newIds = new Set(chunks.map((c) => c.id));
  const kept = existing.filter((c) => !newIds.has(c.id));
  const merged = [...kept, ...chunks];
  saveStore(merged);

  const byKb: Record<string, number> = {};
  const byFile: Record<string, number> = {};
  for (const ch of chunks) {
    byKb[ch.kb] = (byKb[ch.kb] ?? 0) + 1;
    byFile[ch.sourcePath] = (byFile[ch.sourcePath] ?? 0) + 1;
  }

  return { totalChunks: chunks.length, byKb, byFile };
}

/**
 * Simple TF-IDF-style retrieval: scores each chunk by the proportion
 * of query terms that appear in the chunk text (case-insensitive).
 * Returns the top-k results sorted by relevance.
 *
 * Good enough for MVD; swap with ChromaDB embeddings later.
 */
export async function retrieve(
  query: string,
  topK = 5,
  filter?: { kb?: KnowledgeChunk["kb"] },
): Promise<RetrievalResult[]> {
  let chunks = loadStore();
  if (filter?.kb) chunks = chunks.filter((c) => c.kb === filter.kb);

  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  const scored = chunks.map((chunk) => {
    const chunkTerms = new Set(tokenize(chunk.text));
    let hits = 0;
    for (const qt of queryTerms) {
      if (chunkTerms.has(qt)) hits++;
    }
    const score = hits / queryTerms.length;
    return { chunk, distance: 1 - score };
  });

  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, topK).filter((r) => r.distance < 1);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/**
 * Delete the store file.
 */
export async function dropCollection(): Promise<void> {
  const p = storePath();
  if (existsSync(p)) {
    const { unlinkSync } = await import("node:fs");
    unlinkSync(p);
  }
}

/**
 * No-op for file-based store (API compat with ChromaDB version).
 */
export function resetClient(): void {
  // nothing to reset for file-based store
}
