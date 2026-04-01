/**
 * Shared contract for `/api/preview/signal` and the signal preview page.
 * Aligns with JSON schemas under repo `schemas/` and `src/types/contracts.ts`.
 */

export interface SignalPreviewOverview {
  kpiId: string;
  title: string;
  currentValue: string;
  changePct: number | null;
  changeLabel: string;
  oneLineSummary: string;
  provenance: Record<string, unknown>;
}

export interface SignalPreviewExpanded {
  execSummary: string;
  takeawayBreakdown: { directionGoodOrBad: string; expectedOrUnexpected: string };
  benchmarkComparison?: string;
  rootCauseAnalysis?: string;
  rootCauseRationale?: string;
  provenance: Record<string, unknown>;
}

/** Pipeline v2 — structured analysis for readable preview (preferred over flat expanded). */
export interface SignalPreviewAnalysisSection {
  conclusion: string;
  chainOfThought: string[];
}

/** Pipeline v2 — structured synthesis for readable preview. */
export interface SignalPreviewSynthesisSection {
  conclusion: string;
  chainOfThought: string[];
  /** Pre-rendered benchmark lines for display. */
  citedBenchmarksDisplay?: string;
}

export interface SignalPreviewInsufficient {
  whyItMatters: string;
  missingData: string[];
  sourcingTips?: string[];
}

export interface SignalPreviewQualityNote {
  level: string;
  message: string;
}

export interface SignalPreviewRetrievedSourceRow {
  kb: string;
  heading: string;
  sourcePath: string;
}

/** Response body for GET `/api/preview/signal`. */
export interface SignalPreviewPayload {
  source?: string;
  userId?: string;
  cardIndex?: number;
  cardCount?: number;
  requestType?: string;
  dataSufficiency?: string;
  narrativeSource?: "llm" | "fallback";
  recommendationRationale?: string;
  /** Pipeline v2 A/B synthesis variant when present. */
  cardVersion?: "A" | "B";
  /** Pipeline v2 “Data as of …” line when present. */
  dataFreshnessLine?: string;
  /** When set, UI renders Analysis / Synthesis sections with bullets instead of legacy expanded block. */
  analysisSection?: SignalPreviewAnalysisSection;
  synthesisSection?: SignalPreviewSynthesisSection;
  /** Capped list of RAG sources for this card (readability). */
  retrievedSourcesPreview?: SignalPreviewRetrievedSourceRow[];
  /** Hint for operators to inspect full prompts (written next to out/ by pipeline v2). */
  llmCallsArtifactHint?: string;
  /** Human-readable data quality messages (same notes as in raw JSON). */
  qualityNotesForUi?: SignalPreviewQualityNote[];
  overview: SignalPreviewOverview;
  expanded?: SignalPreviewExpanded;
  insufficient?: SignalPreviewInsufficient;
}

/** Shape of `out/processed-signals.json` and multi-user stub fixtures. */
export interface ProcessedSignalsFile {
  users: Array<{
    userId: string;
    cards: Array<{
      requestType?: string;
      dataSufficiency?: string;
      narrativeSource?: "llm" | "fallback";
      recommendationRationale?: string;
      overview: Record<string, unknown>;
      expanded?: Record<string, unknown>;
      insufficient?: Record<string, unknown>;
    }>;
  }>;
}
