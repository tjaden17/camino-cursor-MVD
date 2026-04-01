/** A chunk of text from a knowledge base file, ready for embedding. */
export interface KnowledgeChunk {
  /** Unique ID for this chunk (file path + heading slug) */
  id: string;
  /** Which knowledge base: kb1, kb2, or kb3 */
  kb: "kb1" | "kb2" | "kb3";
  /** Source file path relative to repo root */
  sourcePath: string;
  /** The heading this chunk falls under */
  heading: string;
  /** The text content of the chunk */
  text: string;
}

/** Result from a retrieval query. */
export interface RetrievalResult {
  chunk: KnowledgeChunk;
  /** Similarity score (lower distance = more relevant for ChromaDB L2) */
  distance: number;
}

export interface IndexStats {
  totalChunks: number;
  byKb: Record<string, number>;
  byFile: Record<string, number>;
}
