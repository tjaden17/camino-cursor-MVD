import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getRepoRoot } from "../../repo-root.js";

export interface KpiCandidate {
  kpiId: string;
  title: string;
  unitHint: string;
  formula: string;
  status: "sufficient" | "insufficient";
  type: "requested" | "recommended";
  sourceIds: string[];
  sourcePaths: string[];
  breakdowns?: string[];
}

interface KpiSpecDataSource {
  sourceId: string;
  status: string;
  filePath: string;
}

interface KpiSpecKpi {
  kpiId: string;
  title: string;
  unitHint: string;
  formula: string;
  sourceIds: string[];
  breakdowns?: string[];
}

interface KpiSpecUserMapping {
  userId: string;
  sufficientKpis: string[];
  insufficientKpis: string[];
  /** Subset of sufficientKpis shown as system-recommended (Phase 3). */
  recommendedWithinSufficientKpis?: string[];
  /** Extra KPIs to compute from org-wide data, shown as recommended (e.g. Sam + CRM). */
  recommendedOrgWideKpis?: string[];
}

interface KpiSpecV2 {
  dataSources: KpiSpecDataSource[];
  kpis: KpiSpecKpi[];
  userMappings: KpiSpecUserMapping[];
}

function loadKpiSpecV2(): KpiSpecV2 {
  const root = getRepoRoot();
  const path = join(root, "data/kpi-spec/kpi-spec-v2.json");
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw) as KpiSpecV2;
}

function resolveSourcePaths(
  repoRoot: string,
  sourceIds: string[],
  sourceById: Map<string, KpiSpecDataSource>,
): string[] {
  return sourceIds.map((id) => {
    const ds = sourceById.get(id);
    const fp = ds?.filePath?.trim();
    if (!fp) return "";
    return join(repoRoot, fp);
  });
}

function buildCandidate(
  kpi: KpiSpecKpi,
  status: "sufficient" | "insufficient",
  type: "requested" | "recommended",
  repoRoot: string,
  sourceById: Map<string, KpiSpecDataSource>,
): KpiCandidate {
  const sourcePaths = resolveSourcePaths(repoRoot, kpi.sourceIds, sourceById);
  const candidate: KpiCandidate = {
    kpiId: kpi.kpiId,
    title: kpi.title,
    unitHint: kpi.unitHint,
    formula: kpi.formula,
    status,
    type,
    sourceIds: [...kpi.sourceIds],
    sourcePaths,
  };
  if (kpi.breakdowns !== undefined && kpi.breakdowns.length > 0) {
    candidate.breakdowns = [...kpi.breakdowns];
  }
  return candidate;
}

/**
 * Loads KPI spec v2 and returns KPI candidates for the user: sufficient KPIs
 * as requested, insufficient as recommended, with sources cross-referenced to
 * resolved repo paths.
 */
export function generateCandidates(userId: string): KpiCandidate[] {
  const spec = loadKpiSpecV2();
  const key = userId.trim().toLowerCase();
  const mapping = spec.userMappings.find((m) => m.userId.toLowerCase() === key);
  if (!mapping) return [];

  const kpiById = new Map(spec.kpis.map((k) => [k.kpiId, k]));
  const sourceById = new Map(spec.dataSources.map((d) => [d.sourceId, d]));
  const repoRoot = getRepoRoot();

  const out: KpiCandidate[] = [];
  const recommendedWithin = new Set(mapping.recommendedWithinSufficientKpis ?? []);

  for (const kpiId of mapping.sufficientKpis) {
    const kpi = kpiById.get(kpiId);
    if (!kpi) continue;
    const ctype: "requested" | "recommended" = recommendedWithin.has(kpiId)
      ? "recommended"
      : "requested";
    out.push(buildCandidate(kpi, "sufficient", ctype, repoRoot, sourceById));
  }

  for (const kpiId of mapping.recommendedOrgWideKpis ?? []) {
    if (mapping.sufficientKpis.includes(kpiId)) continue;
    const kpi = kpiById.get(kpiId);
    if (!kpi) continue;
    out.push(buildCandidate(kpi, "sufficient", "recommended", repoRoot, sourceById));
  }

  for (const kpiId of mapping.insufficientKpis) {
    const kpi = kpiById.get(kpiId);
    if (!kpi) continue;
    out.push(buildCandidate(kpi, "insufficient", "recommended", repoRoot, sourceById));
  }

  return out;
}
