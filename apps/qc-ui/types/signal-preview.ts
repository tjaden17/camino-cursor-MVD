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

export interface SignalPreviewInsufficient {
  whyItMatters: string;
  missingData: string[];
  sourcingTips?: string[];
}

/** Response body for GET `/api/preview/signal`. */
export interface SignalPreviewPayload {
  source?: string;
  userId?: string;
  cardIndex?: number;
  cardCount?: number;
  requestType?: string;
  dataSufficiency?: string;
  recommendationRationale?: string;
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
      recommendationRationale?: string;
      overview: Record<string, unknown>;
      expanded?: Record<string, unknown>;
      insufficient?: Record<string, unknown>;
    }>;
  }>;
}
