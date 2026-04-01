export { chunkMarkdown } from "./chunker.js";
export { loadAllKnowledgeChunks } from "./load-knowledge.js";
export { indexChunks, retrieve, dropCollection, resetClient, setNamespace } from "./store.js";
export type {
  KnowledgeChunk,
  RetrievalResult,
  IndexStats,
} from "./types.js";
