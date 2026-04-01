/**
 * CLI script: load all knowledge files, chunk them, and push into ChromaDB.
 *
 * Usage: npx tsx src/rag/index-knowledge.cli.ts
 *
 * Requires ChromaDB running on http://localhost:8000.
 */
import { loadAllKnowledgeChunks } from "./load-knowledge.js";
import { indexChunks, dropCollection } from "./store.js";

async function main() {
  console.log("Loading knowledge chunks...");
  const chunks = loadAllKnowledgeChunks();
  console.log(`Loaded ${chunks.length} chunks from ${new Set(chunks.map((c) => c.sourcePath)).size} files`);

  console.log("Dropping existing collection (clean re-index)...");
  await dropCollection();

  console.log("Indexing into ChromaDB...");
  const stats = await indexChunks(chunks);

  console.log("\n--- Index Stats ---");
  console.log(`Total chunks: ${stats.totalChunks}`);
  console.log("By KB:", stats.byKb);
  console.log("By file:", stats.byFile);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Indexing failed:", err);
  process.exit(1);
});
