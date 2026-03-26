import type { ProcessedCard, ProcessedSignalsFile } from "../pipeline/types.js";

export interface GateResult {
  id: string;
  pass: boolean;
  message: string;
  detail?: string;
}

export interface ReviewGateReport {
  pass: boolean;
  gates: GateResult[];
}

export function evaluateReviewGates(processed: ProcessedSignalsFile): ReviewGateReport {
  const gates: GateResult[] = [
    gateNoLeadsReuse(processed),
    gatePersonalization(processed),
    gateRecommendedAndInsufficient(processed),
    gateBenchmarkClaims(processed),
  ];
  return { pass: gates.every((g) => g.pass), gates };
}

function gateNoLeadsReuse(processed: ProcessedSignalsFile): GateResult {
  const failures: string[] = [];
  for (const u of processed.users) {
    const leads = u.cards.find((c) => c.kpiId === "kpi.pipeline.leads_total");
    const leadsValue = leads?.overview.currentValue;
    if (!leadsValue) continue;
    for (const c of u.cards) {
      if (c.kpiId === "kpi.pipeline.leads_total") continue;
      if (c.dataSufficiency !== "sufficient") continue;
      if (c.overview.currentValue === leadsValue) failures.push(`${u.userId}:${c.kpiId}`);
    }
  }
  return {
    id: "no_leads_reuse_non_leads",
    pass: failures.length === 0,
    message: "Non-leads KPI cards must not reuse leads numeric value.",
    detail: failures.length ? failures.join(", ") : undefined,
  };
}

function gatePersonalization(processed: ProcessedSignalsFile): GateResult {
  const a = processed.users.find((u) => u.userId === "surge");
  const b = processed.users.find((u) => u.userId === "sam");
  if (!a || !b) {
    return {
      id: "surge_sam_personalization",
      pass: true,
      message: "Skipped: both surge and sam are required for comparison.",
    };
  }
  const idDiff = symmetricDiffRatio(a.cards.map((c) => c.kpiId), b.cards.map((c) => c.kpiId));
  const narrativeDiff = narrativeDifferenceRatio(a.cards, b.cards);
  const meaningfulNarrativeDiff = meaningfulNarrativeDifferenceRatio(a.cards, b.cards);
  const threshold = 0.4;
  const pass = idDiff >= threshold || meaningfulNarrativeDiff >= threshold;
  return {
    id: "surge_sam_personalization",
    pass,
    message: "Surge vs Sam must differ in KPI IDs or narrative wording.",
    detail: `kpiDiff=${idDiff.toFixed(2)}, narrativeDiff=${narrativeDiff.toFixed(2)}, meaningfulNarrativeDiff=${meaningfulNarrativeDiff.toFixed(2)}, threshold=${threshold}`,
  };
}

function gateRecommendedAndInsufficient(processed: ProcessedSignalsFile): GateResult {
  const failures: string[] = [];
  for (const u of processed.users) {
    for (const c of u.cards) {
      if (c.requestType === "recommended") {
        if (!c.recommendationRationale || c.recommendationRationale.trim().length < 20) {
          failures.push(`${u.userId}:${c.kpiId}:missing_recommendation_rationale`);
        }
      }
      if (c.dataSufficiency === "insufficient") {
        const missingData = c.insufficient?.missingData ?? [];
        const tips = c.insufficient?.sourcingTips ?? [];
        if (missingData.length < 2) failures.push(`${u.userId}:${c.kpiId}:insufficient_missingData`);
        if (tips.length < 1) failures.push(`${u.userId}:${c.kpiId}:insufficient_sourcingTips`);
      }
    }
  }
  return {
    id: "recommended_and_insufficient_quality",
    pass: failures.length === 0,
    message: "Recommended cards need rationale; insufficient cards need actionable details.",
    detail: failures.length ? failures.join(", ") : undefined,
  };
}

function gateBenchmarkClaims(processed: ProcessedSignalsFile): GateResult {
  const failures: string[] = [];
  for (const u of processed.users) {
    for (const c of u.cards) {
      const b = c.expanded?.benchmarkComparison?.trim();
      if (!b) continue;
      const hasCitation = /https?:\/\//i.test(b);
      const hasCaveat = /(illustrative|directional|caveat|not directly comparable)/i.test(b);
      if (!hasCitation || !hasCaveat) {
        failures.push(`${u.userId}:${c.kpiId}`);
      }
    }
  }
  return {
    id: "benchmark_claim_quality",
    pass: failures.length === 0,
    message: "Benchmark claims must include citation URL and caveat text when shown.",
    detail: failures.length ? failures.join(", ") : undefined,
  };
}

function symmetricDiffRatio(a: string[], b: string[]): number {
  const sa = new Set(a);
  const sb = new Set(b);
  let diff = 0;
  for (const x of sa) if (!sb.has(x)) diff += 1;
  for (const x of sb) if (!sa.has(x)) diff += 1;
  const denom = new Set([...a, ...b]).size || 1;
  return diff / denom;
}

function narrativeDifferenceRatio(aCards: ProcessedCard[], bCards: ProcessedCard[]): number {
  const byKpiB = new Map(bCards.map((c) => [c.kpiId, c]));
  let total = 0;
  let diffs = 0;
  for (const a of aCards) {
    const b = byKpiB.get(a.kpiId);
    if (!b) continue;
    total += 1;
    const sameSummary = a.overview.oneLineSummary.trim() === b.overview.oneLineSummary.trim();
    const sameExec = (a.expanded?.execSummary ?? "").trim() === (b.expanded?.execSummary ?? "").trim();
    const sameRec = (a.recommendationRationale ?? "").trim() === (b.recommendationRationale ?? "").trim();
    if (!(sameSummary && sameExec && sameRec)) diffs += 1;
  }
  return total === 0 ? 0 : diffs / total;
}

function meaningfulNarrativeDifferenceRatio(aCards: ProcessedCard[], bCards: ProcessedCard[]): number {
  const byKpiB = new Map(bCards.map((c) => [c.kpiId, c]));
  let total = 0;
  let diffs = 0;
  for (const a of aCards) {
    const b = byKpiB.get(a.kpiId);
    if (!b) continue;
    total += 1;
    const aText = normalizePersonaTokens(
      [a.overview.oneLineSummary, a.expanded?.execSummary ?? "", a.recommendationRationale ?? ""].join(" "),
    );
    const bText = normalizePersonaTokens(
      [b.overview.oneLineSummary, b.expanded?.execSummary ?? "", b.recommendationRationale ?? ""].join(" "),
    );
    if (aText !== bText) diffs += 1;
  }
  return total === 0 ? 0 : diffs / total;
}

function normalizePersonaTokens(text: string): string {
  return text
    .toLowerCase()
    .replace(/\b(surge|sam|ceo|customer success manager|csm)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
