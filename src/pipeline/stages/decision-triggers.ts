/**
 * Phase 3 — Match computed signal trends to Decision Catalogue trigger patterns
 * and surface decision recommendations (deterministic heuristics; pattern text in JSON is human-readable).
 */
import type { ComputedKpi } from "./kpi-compute.js";

export interface CatalogueTriggerPattern {
  pattern: string;
  recommendation: string;
}

export interface CatalogueDecisionRow {
  decisionId: string;
  role: string;
  userId?: string;
  decision: string;
  timeframe: string;
  informingSignals: string[];
  status?: string;
  triggerPatterns?: CatalogueTriggerPattern[];
}

/** When a heuristic matches a catalogue pattern for this user. */
export interface TriggeredDecisionRecommendation {
  userId: string;
  decisionId: string;
  decision: string;
  matchedPattern: string;
  recommendation: string;
}

function supportRisingResolutionStable(computed: Map<string, ComputedKpi>): boolean {
  const vol = computed.get("support_issue_volume");
  const res = computed.get("resolution_time");
  if (!vol || !res) return false;
  const volUp = vol.trend.direction === "up";
  const resStable = res.trend.direction === "flat" || res.trend.direction === "down";
  return volUp && resStable;
}

function slaDownWhileVolumeHigh(computed: Map<string, ComputedKpi>): boolean {
  const sla = computed.get("sla_compliance");
  const vol = computed.get("support_issue_volume");
  if (!sla || !vol) return false;
  const slaDown = sla.trend.direction === "down";
  const volHigh = vol.trend.direction === "up" || vol.trend.direction === "flat";
  return slaDown && volHigh;
}

function pipelineGrowingProspectsFlat(computed: Map<string, ComputedKpi>): boolean {
  const pipe = computed.get("pipeline_value");
  const prospects = computed.get("prospects");
  if (!pipe || !prospects) return false;
  const pipeUp = pipe.trend.direction === "up";
  const prospectsFlat = prospects.trend.direction === "flat" || prospects.trend.direction === "down";
  return pipeUp && prospectsFlat;
}

/** Sam catalogue: jobs_posted spike with uneven shift_utilisation */
function jobsSpikeUtilUneven(computed: Map<string, ComputedKpi>): boolean {
  const jobs = computed.get("jobs_posted");
  const util = computed.get("shift_utilisation");
  if (!jobs || !util) return false;
  const spike = jobs.trend.direction === "up";
  const uneven = util.trend.direction === "flat" || util.trend.direction === "down";
  return spike && uneven;
}

/**
 * Returns true when the catalogue pattern string is one we can evaluate with current heuristics.
 */
function patternMatches(pattern: string, computed: Map<string, ComputedKpi>): boolean {
  const p = pattern.toLowerCase();
  if (
    p.includes("support_issue_volume") &&
    p.includes("rising") &&
    p.includes("resolution_time") &&
    p.includes("stable")
  ) {
    return supportRisingResolutionStable(computed);
  }
  if (
    p.includes("sla_compliance") &&
    p.includes("trending down") &&
    p.includes("support_issue_volume") &&
    p.includes("high")
  ) {
    return slaDownWhileVolumeHigh(computed);
  }
  if (
    p.includes("pipeline_value") &&
    p.includes("growing") &&
    p.includes("prospects") &&
    p.includes("pace")
  ) {
    return pipelineGrowingProspectsFlat(computed);
  }
  if (
    p.includes("jobs_posted") &&
    p.includes("spike") &&
    p.includes("shift_utilisation")
  ) {
    return jobsSpikeUtilUneven(computed);
  }
  return false;
}

export function evaluateDecisionTriggers(
  userId: string,
  computedKpis: ComputedKpi[],
  decisions: CatalogueDecisionRow[],
): TriggeredDecisionRecommendation[] {
  const uid = userId.trim().toLowerCase();
  const computed = new Map(computedKpis.map((k) => [k.kpiId, k]));
  const out: TriggeredDecisionRecommendation[] = [];

  for (const d of decisions) {
    if (d.userId && d.userId.toLowerCase() !== uid) continue;
    const patterns = d.triggerPatterns ?? [];
    for (const tp of patterns) {
      if (patternMatches(tp.pattern, computed)) {
        out.push({
          userId: uid,
          decisionId: d.decisionId,
          decision: d.decision,
          matchedPattern: tp.pattern,
          recommendation: tp.recommendation,
        });
      }
    }
  }
  return out;
}
