import type { ComputedKpi } from "./kpi-compute.js";
import type { RelatedSignal } from "./cross-signal-ref.js";
import type { InsufficientCard, RagSourceSnippet } from "./insufficient-cards.js";
import type { RetrievedContext } from "./rag-prompt-assembly.js";
import type { TriggeredDecisionRecommendation } from "./decision-triggers.js";

export type CardVersion = "A" | "B";

export interface CrossSignalRef {
  kpiId: string;
  title: string;
  relationship: string;
  currentValue?: string;
}

export interface AnalysisSection {
  conclusion: string;
  chainOfThought: string[];
}

export interface SynthesisSection {
  conclusion: string;
  chainOfThought: string[];
  citedBenchmarks: { claim: string; source: string }[];
}

export interface QualityNote {
  level: "pass" | "warn" | "fail";
  message: string;
}

/** A fully assembled signal card (sufficient KPI). */
export interface SignalCardV2 {
  kpiId: string;
  title: string;
  unitHint: string;
  cardVersion: CardVersion;
  requestType: "requested" | "recommended";
  dataSufficiency: "sufficient";

  currentValue: string;
  numericValue: number;
  previousValue: number | null;
  trend: { direction: "up" | "down" | "flat"; delta: number | null; deltaPct: number | null };

  dataFreshness: string;
  provenanceSummary: string;
  provenance: ComputedKpi["provenance"];

  analysis: AnalysisSection;
  synthesis: SynthesisSection;

  crossSignalReferences: CrossSignalRef[];
  qualityNotes: QualityNote[];
  retrievedSources: RetrievedContext["sources"];

  breakdowns?: Record<string, Record<string, number>>;
  /** Phase 3 — plain-language “why we’re recommending this KPI” (RAG-backed when present). */
  recommendedRationale?: string;
  /** Whether analysis/synthesis text came from Anthropic or deterministic stubs. */
  narrativeSource: "llm" | "fallback";
}

/** An insufficient data card. */
export interface InsufficientCardV2 {
  kpiId: string;
  title: string;
  cardVersion: CardVersion;
  requestType: "recommended";
  dataSufficiency: "insufficient";

  whatItWouldTell: string;
  whatsNeeded: string;
  howToProvide: string;
  whatItUnlocks: string;
  decisionLink: string;
  relatedDecisionIds: string[];
  domainContextParagraph?: string;
  userDecisionParagraph?: string;
  retrievedKbSources?: RagSourceSnippet[];
}

export type AnyCardV2 = SignalCardV2 | InsufficientCardV2;

export interface UserCardDeck {
  userId: string;
  generatedAt: string;
  cards: AnyCardV2[];
}

export interface PipelineOutputV2 {
  /** Correlates inspector JSON files (`step-*.json`) with this run. */
  runId: string;
  generatedAt: string;
  pipelineVersion: "2.0";
  users: UserCardDeck[];
  /** Heuristic matches against the decision catalogue (Phase 3). */
  triggeredDecisionRecommendations: TriggeredDecisionRecommendation[];
}

export function buildProvenanceSummary(kpi: ComputedKpi): string {
  const { provenance, dataFreshness } = kpi;
  const parts = [
    `Calculated from ${provenance.rowCount} ${provenance.sourceId} records`,
  ];
  if (provenance.timeRange?.label) {
    parts.push(provenance.timeRange.label);
  }
  parts.push(`Formula: ${provenance.formula}`);
  parts.push(`Data as of ${dataFreshness}`);
  return parts.join(". ");
}

export function buildSignalCard(
  kpi: ComputedKpi,
  kpiTitle: string,
  unitHint: string,
  version: CardVersion,
  requestType: "requested" | "recommended",
  analysis: AnalysisSection,
  synthesis: SynthesisSection,
  crossRefs: RelatedSignal[],
  computedValues: Map<string, string>,
  retrievedSources: RetrievedContext["sources"],
  qualityNotes: QualityNote[],
  narrativeSource: "llm" | "fallback",
  recommendedRationale?: string,
): SignalCardV2 {
  return {
    kpiId: kpi.kpiId,
    title: kpiTitle,
    unitHint,
    cardVersion: version,
    requestType,
    dataSufficiency: "sufficient",
    currentValue: kpi.displayValue,
    numericValue: kpi.value,
    previousValue: kpi.previousValue,
    trend: kpi.trend,
    dataFreshness: kpi.dataFreshness,
    provenanceSummary: buildProvenanceSummary(kpi),
    provenance: kpi.provenance,
    analysis,
    synthesis,
    crossSignalReferences: crossRefs.map((r) => ({
      kpiId: r.kpiId,
      title: r.title,
      relationship: r.relationship,
      currentValue: computedValues.get(r.kpiId),
    })),
    qualityNotes,
    retrievedSources,
    breakdowns: kpi.breakdowns,
    narrativeSource,
    recommendedRationale,
  };
}

export function buildInsufficientCardV2(
  card: InsufficientCard,
  version: CardVersion,
): InsufficientCardV2 {
  return {
    kpiId: card.kpiId,
    title: card.title,
    cardVersion: version,
    requestType: "recommended",
    dataSufficiency: "insufficient",
    whatItWouldTell: card.whatItWouldTell,
    whatsNeeded: card.whatsNeeded,
    howToProvide: card.howToProvide,
    whatItUnlocks: card.whatItUnlocks,
    decisionLink: card.decisionLink,
    relatedDecisionIds: card.relatedDecisionIds,
    domainContextParagraph: card.domainContextParagraph,
    userDecisionParagraph: card.userDecisionParagraph,
    retrievedKbSources: card.retrievedKbSources,
  };
}
