/**
 * Canonical MVD output shapes (aligned with Instructions to build MVD v1).
 * JSON Schemas in /schemas mirror these for validation of AI or hand-authored payloads.
 */

/** ISO 8601 date or date-time; period labels for human display */
export interface TimeRange {
  /** Inclusive start (ISO date or datetime) */
  start: string;
  /** Exclusive or inclusive end per ruleId; document in provenance */
  end: string;
  /** e.g. "2025-W38", "Sep 2025" */
  label?: string;
}

/**
 * Provenance bundle for "Signal — What we found" QC:
 * every numeric claim should be traceable to source + rule + sample rows.
 */
export interface ProvenanceBundle {
  /** Stable id for the upstream file or table, e.g. zoho_crm_leads */
  sourceId: string;
  /** Human path or URI for the extract used */
  sourcePath: string;
  timeRange: TimeRange;
  /** Identifier of the replay rule / SQL template, e.g. RULE_LEADS_COUNT */
  ruleId: string;
  /** Plain-language or SQL fragment describing the calculation */
  formulaDescription: string;
  /** Small sample of contributing rows (column names + values) */
  sampleRows: Array<Record<string, string | number | null>>;
  /** Max rows to show in UI; full set may be larger */
  sampleRowCount?: number;
}

export type StatusBadge = "improving" | "stable" | "watch" | "alert";

/** Signal overview (scroll view card) */
export interface SignalOverview {
  kind: "signal_overview";
  kpiId: string;
  title: string;
  /** Display string, e.g. "24%" or "1,240" */
  currentValue: string;
  /** Delta vs prior period; null if not applicable */
  changePct: number | null;
  changeLabel: string;
  oneLineSummary: string;
  recommended?: boolean;
  provenance: ProvenanceBundle;
}

/** Weekly brief row (Section 1 style from MVD doc) */
export interface WeeklyBriefSignalRow {
  kpiName: string;
  currentValueAbsolute: string;
  deltaFromLastPeriod: number | null;
  deltaDisplay: string;
  statusBadge: StatusBadge;
}

/** Expanded signal — narrative + structured sections (subset; extend as needed) */
export interface SignalExpanded {
  kind: "signal_expanded";
  kpiId: string;
  execSummary: string;
  takeawayBreakdown: {
    directionGoodOrBad: string;
    expectedOrUnexpected: string;
  };
  benchmarkComparison?: string;
  rootCauseAnalysis?: string;
  /** Chain-of-thought / steps for audit (not end-user marketing copy) */
  rootCauseRationale?: string;
  provenance: ProvenanceBundle;
}

/** Insufficient data card — must not invent KPI numbers */
export interface SignalInsufficientData {
  kind: "insufficient_data";
  kpiId: string;
  title: string;
  /** Fields or datasets still required */
  missingData: string[];
  whyItMatters: string;
  /** Explicitly no fabricated metrics */
  metricsWithheld: true;
}

export type MvdCard =
  | SignalOverview
  | SignalExpanded
  | SignalInsufficientData;
