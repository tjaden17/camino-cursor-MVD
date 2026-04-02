/**
 * Type contracts for the Briefing Pipeline (Stages 0–6).
 *
 * Canonical spec: decisions/Pipeline-Spec-Briefing-Cards-Takeaways.md
 * These types define the shapes that flow between stages and ultimately
 * compose the Stage 6 output JSON that the three UI screens consume.
 */

// ---------------------------------------------------------------------------
// Stage 0 — Org file (input contract for the rest of the pipeline)
// ---------------------------------------------------------------------------

export interface DataInventoryEntry {
  sourceId: string;
  filePath: string;
  format: "csv" | "xlsx";
  idColumn: string;
  /** Required when format is "xlsx" */
  sheetName?: string;
}

export interface OrgDecision {
  userId: string;
  decision: string;
  source: "user_stated" | "rag_suggested" | "rag_suggested_supporting";
}

export interface Contributor {
  userId: string;
  displayName: string;
  role: string;
  roleRank: number;
  onboardingPath: string;
}

export interface BriefingOrgContext {
  kind: "briefing_org_context";
  version: 2;
  orgId: string;
  orgName: string;
  mergedCompanyContext: {
    company: string;
    industry: string;
    stage: string;
    businessModel: string;
    teamSize: number | null;
  };
  contributors: Contributor[];
  orgDecisions: OrgDecision[];
  dataInventory: DataInventoryEntry[];
  rootIssue: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Stage 1 — Schema detection + summary stats
// ---------------------------------------------------------------------------

export type ColumnType =
  | "date"
  | "boolean"
  | "currency"
  | "numeric"
  | "categorical"
  | "free_text";

export interface ColumnSummary {
  name: string;
  type: ColumnType;
  populated: string;
  values?: Record<string, number>;
  min?: number;
  max?: number;
  mean?: number;
  sum?: number;
}

export interface QualityNote {
  level: "warn" | "info";
  message: string;
}

export interface DataExcerpt {
  strategy: "full" | "aggregated";
  note: string;
  groupByCounts?: Record<string, Record<string, number>>;
  numericAggregates?: Record<string, { min: number; max: number; mean: number; sum: number }>;
  topRows?: Record<string, unknown>[];
  dateBuckets?: Record<string, Record<string, number>>;
}

export interface SourceSummary {
  sourceId: string;
  filePath: string;
  format: "csv" | "xlsx";
  idColumn: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnSummary[];
  dateRange: { earliest: string; latest: string } | null;
  qualityNotes: QualityNote[];
  excerpt: DataExcerpt;
}

// ---------------------------------------------------------------------------
// Stage 2 — Issue tree
// ---------------------------------------------------------------------------

export type Coverage = "measured" | "partial" | "gap";

export interface SubIssue {
  subIssueId: string;
  name: string;
  question: string;
  coverage: Coverage;
}

export interface BranchOwner {
  userId: string;
  displayName: string;
  role: string;
  ownerSuggested: boolean;
}

export interface Branch {
  branchId: string;
  branchIndex: number;
  label: string;
  owner: BranchOwner;
  subIssues: SubIssue[];
}

export interface IssueTree {
  rootIssue: string;
  summaryStats: Record<string, string>;
  formulaLabel: string;
  branches: Branch[];
}

// ---------------------------------------------------------------------------
// Stage 3 — Analysis cards
// ---------------------------------------------------------------------------

export type KpiStatus = "measured" | "partial" | "gap";

export interface Kpi {
  name: string;
  value: string;
  timePeriod: string;
  status: KpiStatus;
  context: string;
  reasoning: string[];
}

export interface Tag {
  type: "data" | "gap" | "risk";
  label: string;
}

export interface AnalysisCard {
  cardId: string;
  subIssueId: string;
  subIssueName: string;
  branchId: string;
  branchLabel: string;
  kpis: Kpi[];
  observations: string[];
  tags: Tag[];
  qualityNotes: QualityNote[];
  qcStatus: "pass" | "needs_review";
}

// ---------------------------------------------------------------------------
// Stage 4 — Branch takeaways
// ---------------------------------------------------------------------------

export interface BranchTakeaway {
  branchId: string;
  branchIndex: number;
  branchLabel: string;
  owner: BranchOwner;
  title: string;
  text: string;
  reasoning: string[];
  summaryCategory: "finding" | "risk" | "opportunity";
  qcStatus: "pass" | "needs_review";
}

// ---------------------------------------------------------------------------
// Stage 5 — Lenses
// ---------------------------------------------------------------------------

export interface Lenses {
  issueTree: Record<string, string[]>;
  decisions: Record<string, { cardIds: string[]; rationale: string }>;
  risks: Array<{ cardId: string; riskLabel: string; dataPoint: string }>;
}

// ---------------------------------------------------------------------------
// Stage 6 — Final output
// ---------------------------------------------------------------------------

export interface UserView {
  relevantBranches: string[];
  defaultLens: string;
}

export interface BriefingOutput {
  runId: string;
  generatedAt: string;
  specRef: { document: string; version: string };
  orgId: string;
  orgName: string;
  contributors: Array<{ userId: string; role: string; displayName: string }>;
  issueTree: IssueTree;
  analysisCards: AnalysisCard[];
  branchTakeaways: BranchTakeaway[];
  lenses: Lenses;
  userViews: Record<string, UserView>;
  dataQuality: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// QC
// ---------------------------------------------------------------------------

export interface QcFailure {
  stage: string;
  layer: "code" | "llm";
  branch: string;
  cardId?: string;
  type?: "takeaway";
  pass: false;
  issues: string[];
  suggestedFixes?: string[];
  alternativeHeadline?: string | null;
  recommendedEdits?: string | null;
  originalContent: Record<string, unknown>;
}

export interface QcFailureReport {
  runId: string;
  generatedAt: string;
  failures: QcFailure[];
}
