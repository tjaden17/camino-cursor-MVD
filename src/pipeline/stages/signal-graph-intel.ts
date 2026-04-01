/**
 * Signal-graph intelligence layer.
 *
 * Builds a graphology graph from the static SIGNAL_GRAPH and computes:
 *   - centrality scores  (PageRank, betweenness, degree)
 *   - auto-detected theme clusters  (Louvain community detection)
 *   - a composite "impact rank" for each KPI
 *
 * The module is intentionally stateless — every call rebuilds from the
 * current SIGNAL_GRAPH so it stays in sync if new KPIs are added.
 */

import { UndirectedGraph } from "graphology";
import * as graphologyMetrics from "graphology-metrics";
import louvainFn from "graphology-communities-louvain";

const pagerank = graphologyMetrics.centrality.pagerank;
const betweennessCentrality = graphologyMetrics.centrality.betweenness;
const louvain = louvainFn as unknown as (
  graph: UndirectedGraph,
  options?: { resolution?: number },
) => Record<string, number>;

// ── Source data (re-exported from cross-signal-ref) ─────────────────

export interface RelatedSignal {
  kpiId: string;
  title: string;
  relationship: string;
}

/**
 * Canonical KPI titles used for display and graph node labels.
 * Any KPI that appears in SIGNAL_GRAPH should have an entry here.
 */
const KPI_TITLES: Record<string, string> = {
  win_rate: "Win Rate",
  pipeline_value: "Pipeline Value",
  avg_deal_size: "Average Deal Size",
  prospects: "Prospects",
  support_issue_volume: "Support Issue Volume",
  resolution_time: "Avg Resolution Time",
  sla_compliance: "SLA Compliance",
  fcr_rate: "First Call Resolution",
  ticket_reopen_rate: "Ticket Reopen Rate",
  csat: "Customer Satisfaction",
  sentiment_trend: "Sentiment Trend",
  shifts: "Shifts Completed",
  shift_utilisation: "Shift Utilisation",
  inactive_pharmacy_rate: "Inactive Pharmacy Rate",
  jobs_posted: "Jobs Posted",
};

/**
 * Static adjacency list — the hand-curated relationship map.
 * Each entry says: "this KPI has directed edges to these neighbours."
 */
export const SIGNAL_GRAPH: Record<string, RelatedSignal[]> = {
  win_rate: [
    { kpiId: "pipeline_value", title: "Pipeline Value", relationship: "Contributing factor" },
    { kpiId: "avg_deal_size", title: "Average Deal Size", relationship: "Downstream impact" },
  ],
  support_issue_volume: [
    { kpiId: "resolution_time", title: "Avg Resolution Time", relationship: "Downstream impact" },
    { kpiId: "sla_compliance", title: "SLA Compliance", relationship: "Downstream impact" },
  ],
  prospects: [
    { kpiId: "win_rate", title: "Win Rate", relationship: "Downstream impact" },
    { kpiId: "pipeline_value", title: "Pipeline Value", relationship: "Downstream impact" },
  ],
  pipeline_value: [
    { kpiId: "win_rate", title: "Win Rate", relationship: "Contributing factor" },
    { kpiId: "avg_deal_size", title: "Average Deal Size", relationship: "Contributing factor" },
  ],
  shifts: [
    { kpiId: "shift_utilisation", title: "Shift Utilisation", relationship: "Related metric" },
    { kpiId: "inactive_pharmacy_rate", title: "Inactive Pharmacy Rate", relationship: "Inverse indicator" },
  ],
  shift_utilisation: [
    { kpiId: "shifts", title: "Shifts Completed", relationship: "Contributing factor" },
    { kpiId: "inactive_pharmacy_rate", title: "Inactive Pharmacy Rate", relationship: "Inverse indicator" },
  ],
  inactive_pharmacy_rate: [
    { kpiId: "shifts", title: "Shifts Completed", relationship: "Inverse indicator" },
    { kpiId: "jobs_posted", title: "Jobs Posted", relationship: "Leading indicator" },
  ],
  jobs_posted: [
    { kpiId: "shifts", title: "Shifts Completed", relationship: "Downstream impact" },
    { kpiId: "inactive_pharmacy_rate", title: "Inactive Pharmacy Rate", relationship: "Leading indicator" },
  ],
  resolution_time: [
    { kpiId: "support_issue_volume", title: "Support Issue Volume", relationship: "Contributing factor" },
    { kpiId: "sla_compliance", title: "SLA Compliance", relationship: "Downstream impact" },
  ],
  sla_compliance: [
    { kpiId: "resolution_time", title: "Avg Resolution Time", relationship: "Contributing factor" },
    { kpiId: "csat", title: "Customer Satisfaction", relationship: "Downstream impact" },
  ],
  fcr_rate: [
    { kpiId: "resolution_time", title: "Avg Resolution Time", relationship: "Downstream impact" },
    { kpiId: "ticket_reopen_rate", title: "Ticket Reopen Rate", relationship: "Inverse indicator" },
  ],
  ticket_reopen_rate: [
    { kpiId: "fcr_rate", title: "First Call Resolution", relationship: "Inverse indicator" },
    { kpiId: "support_issue_volume", title: "Support Issue Volume", relationship: "Contributing factor" },
  ],
  csat: [
    { kpiId: "sla_compliance", title: "SLA Compliance", relationship: "Contributing factor" },
    { kpiId: "fcr_rate", title: "First Call Resolution", relationship: "Contributing factor" },
  ],
  sentiment_trend: [
    { kpiId: "csat", title: "Customer Satisfaction", relationship: "Related metric" },
    { kpiId: "support_issue_volume", title: "Support Issue Volume", relationship: "Contributing factor" },
  ],
  avg_deal_size: [
    { kpiId: "win_rate", title: "Win Rate", relationship: "Contributing factor" },
    { kpiId: "pipeline_value", title: "Pipeline Value", relationship: "Contributing factor" },
  ],
};

// ── Graph construction ──────────────────────────────────────────────

const RELATIONSHIP_WEIGHTS: Record<string, number> = {
  "Contributing factor": 1.0,
  "Downstream impact": 0.9,
  "Leading indicator": 0.85,
  "Inverse indicator": 0.7,
  "Related metric": 0.5,
};

function edgeWeight(relationship: string): number {
  return RELATIONSHIP_WEIGHTS[relationship] ?? 0.5;
}

/**
 * Builds an undirected, weighted graphology Graph from SIGNAL_GRAPH.
 * Undirected because centrality and community detection work best when
 * edges represent mutual influence (A affects B ⟺ B is affected by A).
 */
export function buildGraph(): UndirectedGraph {
  const g = new UndirectedGraph();

  for (const sourceId of Object.keys(SIGNAL_GRAPH)) {
    if (!g.hasNode(sourceId)) {
      g.addNode(sourceId, { title: KPI_TITLES[sourceId] ?? sourceId });
    }
    for (const edge of SIGNAL_GRAPH[sourceId]) {
      if (!g.hasNode(edge.kpiId)) {
        g.addNode(edge.kpiId, { title: KPI_TITLES[edge.kpiId] ?? edge.kpiId });
      }
      if (!g.hasEdge(sourceId, edge.kpiId)) {
        g.addEdge(sourceId, edge.kpiId, {
          weight: edgeWeight(edge.relationship),
          relationship: edge.relationship,
        });
      }
    }
  }

  return g;
}

// ── Centrality ──────────────────────────────────────────────────────

export interface KpiCentrality {
  kpiId: string;
  title: string;
  pagerank: number;
  betweenness: number;
  degree: number;
  /** Weighted composite: 50% pagerank + 30% betweenness + 20% degree (all normalised 0-1). */
  impactScore: number;
}

function normalise(scores: Record<string, number>): Record<string, number> {
  const vals = Object.values(scores);
  const max = Math.max(...vals);
  if (max === 0) return scores;
  return Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, v / max]));
}

export function computeCentrality(g: UndirectedGraph): KpiCentrality[] {
  const pr = normalise(pagerank(g));
  const bw = normalise(betweennessCentrality(g));
  const deg: Record<string, number> = {};
  g.forEachNode((node: string) => {
    deg[node] = g.degree(node);
  });
  const normDeg = normalise(deg);

  const results: KpiCentrality[] = [];
  g.forEachNode((node: string) => {
    results.push({
      kpiId: node,
      title: (g.getNodeAttribute(node, "title") as string) ?? node,
      pagerank: pr[node] ?? 0,
      betweenness: bw[node] ?? 0,
      degree: normDeg[node] ?? 0,
      impactScore: 0.5 * (pr[node] ?? 0) + 0.3 * (bw[node] ?? 0) + 0.2 * (normDeg[node] ?? 0),
    });
  });

  results.sort((a, b) => b.impactScore - a.impactScore);
  return results;
}

// ── Theme clusters (Louvain community detection) ────────────────────

export interface ThemeCluster {
  themeId: number;
  label: string;
  kpis: Array<{ kpiId: string; title: string; impactScore: number }>;
  /** Average impact score of the KPIs in this cluster. */
  clusterImportance: number;
}

const THEME_LABELS: Record<string, string> = {
  "win_rate,pipeline_value,avg_deal_size,prospects": "Revenue & Sales",
  "shifts,shift_utilisation,inactive_pharmacy_rate,jobs_posted": "Operations & Workforce",
  "support_issue_volume,resolution_time,sla_compliance,fcr_rate,ticket_reopen_rate,csat,sentiment_trend":
    "Support & Customer Quality",
};

function inferThemeLabel(kpiIds: string[]): string {
  const sorted = [...kpiIds].sort().join(",");
  for (const [pattern, label] of Object.entries(THEME_LABELS)) {
    const patternIds = pattern.split(",").sort().join(",");
    if (sorted === patternIds) return label;
  }

  const titles = kpiIds.map((id) => KPI_TITLES[id] ?? id);
  if (titles.some((t) => /deal|pipeline|win|prospect/i.test(t))) return "Revenue & Sales";
  if (titles.some((t) => /shift|pharmacy|job/i.test(t))) return "Operations & Workforce";
  if (titles.some((t) => /support|resolution|sla|csat|ticket|sentiment/i.test(t)))
    return "Support & Customer Quality";
  return `Theme ${kpiIds[0]}`;
}

export function detectThemes(g: UndirectedGraph, centralityMap: KpiCentrality[]): ThemeCluster[] {
  const communities: Record<string, number> = louvain(g, { resolution: 1.0 });

  const impactLookup = new Map(centralityMap.map((c) => [c.kpiId, c.impactScore]));

  const grouped = new Map<number, Array<{ kpiId: string; title: string; impactScore: number }>>();
  for (const [node, community] of Object.entries(communities)) {
    if (!grouped.has(community)) grouped.set(community, []);
    grouped.get(community)!.push({
      kpiId: node,
      title: (g.getNodeAttribute(node, "title") as string) ?? node,
      impactScore: impactLookup.get(node) ?? 0,
    });
  }

  const themes: ThemeCluster[] = [];
  for (const [themeId, kpis] of grouped.entries()) {
    kpis.sort((a, b) => b.impactScore - a.impactScore);
    const avgImpact = kpis.reduce((sum, k) => sum + k.impactScore, 0) / kpis.length;
    themes.push({
      themeId,
      label: inferThemeLabel(kpis.map((k) => k.kpiId)),
      kpis,
      clusterImportance: avgImpact,
    });
  }

  themes.sort((a, b) => b.clusterImportance - a.clusterImportance);
  return themes;
}

// ── High-level API ──────────────────────────────────────────────────

export interface SignalIntelligence {
  rankedKpis: KpiCentrality[];
  themes: ThemeCluster[];
}

/**
 * One-call entry point: builds the graph, computes centrality, detects themes.
 */
export function analyseSignalGraph(): SignalIntelligence {
  const g = buildGraph();
  const rankedKpis = computeCentrality(g);
  const themes = detectThemes(g, rankedKpis);
  return { rankedKpis, themes };
}

// ── Backward-compatible helper (drop-in for cross-signal-ref) ───────

export function getRelatedSignals(kpiId: string): RelatedSignal[] {
  return SIGNAL_GRAPH[kpiId] ?? [];
}
