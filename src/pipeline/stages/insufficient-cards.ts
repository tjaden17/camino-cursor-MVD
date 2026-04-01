import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getRepoRoot } from "../../repo-root.js";

/* ================================================================== */
/*  Public types                                                       */
/* ================================================================== */

/** Optional RAG enrichments (Phase 2 — KB2 domain + KB1 decision context). */
export interface RagSourceSnippet {
  kb: "kb1" | "kb2" | "kb3";
  sourcePath: string;
  heading: string;
  excerpt: string;
  relevanceScore: number;
}

export interface InsufficientCard {
  kpiId: string;
  title: string;
  type: "recommended";
  status: "insufficient";
  whatItWouldTell: string;
  whatsNeeded: string;
  howToProvide: string;
  whatItUnlocks: string;
  decisionLink: string;
  relatedDecisionIds: string[];
  /** KB2-backed paragraph with citation when retrieval succeeds */
  domainContextParagraph?: string;
  /** KB1-backed paragraph tying the data gap to the user's decisions */
  userDecisionParagraph?: string;
  retrievedKbSources?: RagSourceSnippet[];
}

/* ================================================================== */
/*  Data-file types                                                    */
/* ================================================================== */

export interface KpiSpecEntry {
  kpiId: string;
  title: string;
  unitHint?: string;
  formula: string;
  sourceIds: string[];
  sufficiencyThreshold?: string;
  notes?: string;
  breakdowns?: string[];
}

interface DataSource {
  sourceId: string;
  label: string;
  status: string;
  filePath: string;
  notes?: string;
}

interface UserMapping {
  userId: string;
  sufficientKpis: string[];
  insufficientKpis: string[];
}

interface UnlockEntry {
  priority: number;
  sourceId: string;
  unlocksKpis: string[];
  strengthensDecisions: string;
  notes?: string;
}

interface KpiSpecFile {
  dataSources: DataSource[];
  kpis: KpiSpecEntry[];
  userMappings: UserMapping[];
  unlockTable: UnlockEntry[];
}

export interface Decision {
  decisionId: string;
  role: string;
  userId?: string;
  decision: string;
  timeframe: string;
  informingSignals: string[];
  status?: string;
}

interface DecisionCatalogueFile {
  decisions: Decision[];
}

/* ================================================================== */
/*  Data loaders (cached)                                              */
/* ================================================================== */

let _specCache: KpiSpecFile | null = null;
let _decisionCache: Decision[] | null = null;

function loadSpec(): KpiSpecFile {
  if (_specCache) return _specCache;
  const p = join(getRepoRoot(), "data/kpi-spec/kpi-spec-v2.json");
  _specCache = JSON.parse(readFileSync(p, "utf8")) as KpiSpecFile;
  return _specCache;
}

function loadDecisions(): Decision[] {
  if (_decisionCache) return _decisionCache;
  const p = join(getRepoRoot(), "data/decision-catalogue/decisions-v1.json");
  const file = JSON.parse(readFileSync(p, "utf8")) as DecisionCatalogueFile;
  _decisionCache = file.decisions;
  return _decisionCache;
}

/* ================================================================== */
/*  Field builders                                                     */
/* ================================================================== */

const SOURCE_INSTRUCTIONS: Record<string, string> = {
  zoho_crm_activities:
    "Export from Zoho CRM → Activities → All Activities → Export to CSV, including Activity Type, Date, Status, and Contact/Lead ID columns.",
  admin_cp_signups:
    "Export from the Locumate Admin CP → Signup Report → Export to CSV. Include signup date, user type (pharmacy/locum), and segment.",
  product_telemetry:
    "Set up product telemetry integration (e.g. Mixpanel, Amplitude, or PostHog) and export feature-usage events as CSV.",
  bug_tracker:
    "Export from your bug tracking tool (e.g. Jira, Linear, or GitHub Issues) → Export to CSV with severity, status, and created date.",
};

function buildWhatItWouldTell(kpi: KpiSpecEntry): string {
  return `${kpi.title} measures: ${kpi.formula}. Tracking this helps you understand performance trends and make informed decisions.`;
}

function buildWhatsNeeded(kpi: KpiSpecEntry, dataSources: DataSource[]): string {
  const sourceLabels = kpi.sourceIds
    .map((id) => {
      const ds = dataSources.find((d) => d.sourceId === id);
      return ds ? ds.label : id;
    });
  const base = `Missing data source${sourceLabels.length > 1 ? "s" : ""}: ${sourceLabels.join(", ")}.`;
  return kpi.notes ? `${base} ${kpi.notes.replace(/^INSUFFICIENT\s*[-—–]\s*/i, "")}` : base;
}

function buildHowToProvide(kpi: KpiSpecEntry): string {
  const instructions = kpi.sourceIds
    .map((id) => SOURCE_INSTRUCTIONS[id])
    .filter(Boolean);
  if (instructions.length > 0) return instructions.join(" ");
  return `Connect the required data source (${kpi.sourceIds.join(", ")}) and re-run the pipeline.`;
}

function buildWhatItUnlocks(kpi: KpiSpecEntry, unlockTable: UnlockEntry[]): string {
  const entries = unlockTable.filter((e) => e.unlocksKpis.includes(kpi.kpiId));
  if (entries.length === 0) return "Enables this KPI to appear on your dashboard with full signal analysis.";

  const parts: string[] = [];
  for (const entry of entries) {
    const otherKpis = entry.unlocksKpis.filter((id) => id !== kpi.kpiId);
    if (otherKpis.length > 0) {
      parts.push(`Also unlocks: ${otherKpis.join(", ")}.`);
    }
    parts.push(`Strengthens decisions: ${entry.strengthensDecisions}.`);
    if (entry.notes) parts.push(entry.notes);
  }
  return parts.join(" ");
}

function buildDecisionLink(kpi: KpiSpecEntry, decisions: Decision[]): string {
  const related = decisions.filter((d) => d.informingSignals.includes(kpi.kpiId));
  if (related.length === 0) return "No linked decisions yet.";
  const names = related.map((d) => `"${d.decision}" (${d.role})`);
  return `Informs: ${names.join(", ")}.`;
}

function findRelatedDecisionIds(kpiId: string, decisions: Decision[]): string[] {
  return decisions
    .filter((d) => d.informingSignals.includes(kpiId))
    .map((d) => d.decisionId);
}

/* ================================================================== */
/*  Public API                                                         */
/* ================================================================== */

export function generateInsufficientCard(
  kpiId: string,
  kpiSpec: KpiSpecEntry,
  decisionCatalogue: Decision[],
): InsufficientCard {
  const spec = loadSpec();

  return {
    kpiId,
    title: kpiSpec.title,
    type: "recommended",
    status: "insufficient",
    whatItWouldTell: buildWhatItWouldTell(kpiSpec),
    whatsNeeded: buildWhatsNeeded(kpiSpec, spec.dataSources),
    howToProvide: buildHowToProvide(kpiSpec),
    whatItUnlocks: buildWhatItUnlocks(kpiSpec, spec.unlockTable),
    decisionLink: buildDecisionLink(kpiSpec, decisionCatalogue),
    relatedDecisionIds: findRelatedDecisionIds(kpiId, decisionCatalogue),
  };
}

export function generateAllInsufficientCards(userId: string): InsufficientCard[] {
  const spec = loadSpec();
  const decisions = loadDecisions();
  const mapping = spec.userMappings.find((m) => m.userId === userId);
  if (!mapping) return [];

  return mapping.insufficientKpis.map((kpiId) => {
    const kpiSpec = spec.kpis.find((k) => k.kpiId === kpiId);
    if (!kpiSpec) throw new Error(`KPI ${kpiId} not found in kpi-spec-v2`);
    return generateInsufficientCard(kpiId, kpiSpec, decisions);
  });
}
