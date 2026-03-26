/**
 * Pipeline run manifest and artifact shapes (serializable JSON).
 */
import type {
  ProvenanceBundle,
  SignalExpanded,
  SignalInsufficientData,
  SignalOverview,
} from "../types/contracts.js";

export type StageId =
  | "normalize"
  | "quality"
  | "bi"
  | "claude_selection"
  | "claude_narrative"
  | "repair"
  | "write_artifacts";

export interface StageRecord {
  id: StageId;
  status: "ok" | "failed";
  startedAt: string;
  finishedAt: string;
  /** Present for LLM stages */
  model?: string;
  error?: string;
}

export interface PipelineRunFile {
  runId: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  finishedAt: string | null;
  inputs: {
    onboardingDir: string;
    onboardingFiles: string[];
    skipLlm: boolean;
    noCache: boolean;
  };
  stages: StageRecord[];
}

export type RequestType = "requested" | "recommended";
export type DataSufficiency = "sufficient" | "insufficient";

/** One signal card for the preview (overview + either expanded narrative or insufficient-data body). */
export interface ProcessedCard {
  kpiId: string;
  requestType: RequestType;
  dataSufficiency: DataSufficiency;
  /**
   * When `requestType` is `recommended`, explains why Camino surfaced this KPI.
   * For insufficient recommended cards, must be clearly distinct from `insufficient.whyItMatters`.
   */
  recommendationRationale?: string;
  overview: SignalOverview;
  expanded?: SignalExpanded;
  insufficient?: SignalInsufficientData;
}

export interface ProcessedUser {
  userId: string;
  cards: ProcessedCard[];
}

export interface ProcessedSignalsFile {
  generatedAt: string;
  users: ProcessedUser[];
}

export interface AgentSignalsUser {
  userId: string;
  requestedKpis: string[];
  recommendedKpis: string[];
  selectionRationale: string;
}

export interface AgentSignalsFile {
  generatedAt: string;
  users: AgentSignalsUser[];
}

export interface SelectionCallResult {
  users: AgentSignalsUser[];
}

/** Intermediate: KPI context shared across BI and LLM stages. */
export interface UserKpiContext {
  userId: string;
  displayName: string;
  leadsTotal: number;
  leadsProvenance: ProvenanceBundle;
}
