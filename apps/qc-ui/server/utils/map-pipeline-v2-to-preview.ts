/**
 * Maps RAG pipeline v2 JSON (`PipelineOutputV2`) into the QC signal preview payload shape.
 * Keeps the preview page working without a full v2-specific layout.
 */
import type { SignalPreviewPayload } from "../../types/signal-preview";

type JsonRecord = Record<string, unknown>;

const MAX_RETRIEVED_PREVIEW = 8;
const LLM_CALLS_HINT =
  "Full prompts and per-call analysis/synthesis: open out/step-4-llm-calls.json at the repo root (same run as this JSON).";

function isRecord(x: unknown): x is JsonRecord {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function trendLabel(t: JsonRecord): string {
  const dir = String(t.direction ?? "flat");
  const delta = t.delta;
  const pct = t.deltaPct;
  const parts = [dir];
  if (delta !== null && delta !== undefined && delta !== "") parts.push(`Δ ${delta}`);
  if (pct !== null && pct !== undefined && pct !== "") parts.push(`${pct}%`);
  return parts.join(" · ");
}

function narrativeFromCard(card: JsonRecord): "llm" | "fallback" {
  return String(card.narrativeSource ?? "") === "llm" ? "llm" : "fallback";
}

function retrievedSourcesPreviewFrom(card: JsonRecord): SignalPreviewPayload["retrievedSourcesPreview"] {
  const raw = card.retrievedSources;
  if (!Array.isArray(raw)) return undefined;
  const rows: NonNullable<SignalPreviewPayload["retrievedSourcesPreview"]> = [];
  for (const item of raw.slice(0, MAX_RETRIEVED_PREVIEW)) {
    if (!isRecord(item)) continue;
    rows.push({
      kb: String(item.kb ?? ""),
      heading: String(item.heading ?? ""),
      sourcePath: String(item.sourcePath ?? ""),
    });
  }
  return rows.length ? rows : undefined;
}

function qualityNotesFromCard(card: JsonRecord): SignalPreviewPayload["qualityNotesForUi"] {
  const raw = card.qualityNotes;
  if (!Array.isArray(raw)) return undefined;
  const out: NonNullable<SignalPreviewPayload["qualityNotesForUi"]> = [];
  for (const q of raw) {
    if (!isRecord(q)) continue;
    out.push({
      level: String(q.level ?? "warn"),
      message: String(q.message ?? ""),
    });
  }
  return out.length ? out : undefined;
}

export function mapV2CardToPreview(
  card: JsonRecord,
  sourceLabel: string,
  userId: string,
  cardIndex: number,
  cardCount: number,
): SignalPreviewPayload {
  const sufficiency = String(card.dataSufficiency ?? "");

  if (sufficiency === "insufficient") {
    const whatsNeeded = String(card.whatsNeeded ?? "");
    const howToProvide = String(card.howToProvide ?? "");
    const whatItUnlocks = String(card.whatItUnlocks ?? "");
    const decisionLink = String(card.decisionLink ?? "");
    const tips = [howToProvide, whatItUnlocks, decisionLink ? `Decision link: ${decisionLink}` : ""].filter(
      Boolean,
    );
    const domainCtx = String(card.domainContextParagraph ?? "").trim();
    const userCtx = String(card.userDecisionParagraph ?? "").trim();
    const ragHint = [domainCtx, userCtx].filter(Boolean).join("\n\n");
    const sourcingTipsList = [...tips, ...(ragHint ? [`Context (RAG): ${ragHint}`] : [])];

    return {
      source: sourceLabel,
      userId,
      cardIndex,
      cardCount,
      requestType: "recommended",
      dataSufficiency: "insufficient",
      narrativeSource: "fallback",
      cardVersion: (card.cardVersion as "A" | "B") ?? "A",
      overview: {
        kpiId: String(card.kpiId ?? ""),
        title: String(card.title ?? ""),
        currentValue: "—",
        changePct: null,
        changeLabel: "",
        oneLineSummary: String(card.whatItWouldTell ?? ""),
        provenance: {
          pipelineV2: true,
          insufficient: true,
          relatedDecisionIds: card.relatedDecisionIds,
        },
      },
      insufficient: {
        whyItMatters: String(card.whatItWouldTell ?? ""),
        missingData: whatsNeeded ? [whatsNeeded] : [],
        sourcingTips: sourcingTipsList.length ? sourcingTipsList : undefined,
      },
    };
  }

  const trend = isRecord(card.trend) ? card.trend : {};
  const analysis = isRecord(card.analysis) ? card.analysis : {};
  const synthesis = isRecord(card.synthesis) ? card.synthesis : {};
  const analysisConclusion = String(analysis.conclusion ?? "");
  const synthesisConclusion = String(synthesis.conclusion ?? "");
  const cotA = Array.isArray(analysis.chainOfThought)
    ? (analysis.chainOfThought as unknown[]).map(String)
    : [];
  const cotS = Array.isArray(synthesis.chainOfThought)
    ? (synthesis.chainOfThought as unknown[]).map(String)
    : [];
  const benchmarks = Array.isArray(synthesis.citedBenchmarks)
    ? (synthesis.citedBenchmarks as JsonRecord[])
    : [];
  const benchmarkText = benchmarks
    .map((b) => {
      const claim = String(b.claim ?? "");
      const source = String(b.source ?? "");
      return claim && source ? `${claim} (${source})` : claim || source;
    })
    .filter(Boolean)
    .join("\n");

  const deltaPct =
    trend.deltaPct !== null && trend.deltaPct !== undefined && Number.isFinite(Number(trend.deltaPct))
      ? Number(trend.deltaPct)
      : null;

  return {
    source: sourceLabel,
    userId,
    cardIndex,
    cardCount,
    requestType: (card.requestType as SignalPreviewPayload["requestType"]) ?? "requested",
    dataSufficiency: "sufficient",
    narrativeSource: narrativeFromCard(card),
    recommendationRationale: (() => {
      const r = String(card.recommendedRationale ?? "").trim();
      return r || undefined;
    })(),
    cardVersion: (card.cardVersion as "A" | "B") ?? "A",
    dataFreshnessLine: String(card.dataFreshness ?? ""),
    analysisSection: {
      conclusion: analysisConclusion,
      chainOfThought: cotA,
    },
    synthesisSection: {
      conclusion: synthesisConclusion,
      chainOfThought: cotS,
      citedBenchmarksDisplay: benchmarkText || undefined,
    },
    retrievedSourcesPreview: retrievedSourcesPreviewFrom(card),
    llmCallsArtifactHint: LLM_CALLS_HINT,
    qualityNotesForUi: qualityNotesFromCard(card),
    overview: {
      kpiId: String(card.kpiId ?? ""),
      title: String(card.title ?? ""),
      currentValue: String(card.currentValue ?? ""),
      changePct: deltaPct,
      changeLabel: trendLabel(trend),
      oneLineSummary:
        analysisConclusion ||
        synthesisConclusion ||
        String(card.provenanceSummary ?? ""),
      provenance: {
        pipelineV2: true,
        provenanceSummary: card.provenanceSummary,
        dataFreshness: card.dataFreshness,
        formulaProvenance: card.provenance,
        crossSignalReferences: card.crossSignalReferences,
        qualityNotes: card.qualityNotes,
        retrievedSources: card.retrievedSources,
        breakdowns: card.breakdowns,
      },
    },
    expanded: {
      execSummary: analysisConclusion || synthesisConclusion,
      takeawayBreakdown: {
        directionGoodOrBad: `Trend: ${String(trend.direction ?? "flat")}`,
        expectedOrUnexpected:
          synthesisConclusion || "See structured analysis and synthesis sections above.",
      },
      benchmarkComparison: benchmarkText || undefined,
      rootCauseAnalysis: cotA.length ? cotA.join("\n") : undefined,
      rootCauseRationale: cotS.length ? cotS.join("\n") : undefined,
      provenance: {
        pipelineV2: true,
        citedBenchmarksRaw: synthesis.citedBenchmarks,
      },
    },
  };
}

export interface PipelineV2File {
  users: Array<{
    userId: string;
    cards: JsonRecord[];
  }>;
}

export function payloadFromPipelineV2File(
  data: PipelineV2File,
  sourceLabel: string,
  userId: string,
  cardIndex: number,
): SignalPreviewPayload | null {
  const u = data.users.find((x) => x.userId.toLowerCase() === userId.toLowerCase()) ?? data.users[0];
  const cards = u?.cards ?? [];
  if (cards.length === 0) return null;
  const idx = Math.min(cardIndex, Math.max(0, cards.length - 1));
  const card = cards[idx];
  if (!card || !isRecord(card)) return null;
  return mapV2CardToPreview(card, sourceLabel, userId, idx, cards.length);
}
