import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadCsvRecords } from "../../ingest/csv.js";
import { getRepoRoot } from "../../repo-root.js";

/* ================================================================== */
/*  Public types                                                       */
/* ================================================================== */

export interface ComputedKpi {
  kpiId: string;
  value: number;
  displayValue: string;
  previousValue: number | null;
  trend: { direction: "up" | "down" | "flat"; delta: number | null; deltaPct: number | null };
  provenance: {
    sourceId: string;
    sourcePath: string;
    formula: string;
    rowCount: number;
    sampleRows: Record<string, string | number | null>[];
    timeRange?: { start: string; end: string; label: string };
  };
  dataFreshness: string;
  breakdowns?: Record<string, Record<string, number>>;
}

/* ================================================================== */
/*  KPI-spec loader (cached)                                           */
/* ================================================================== */

interface KpiSpec {
  kpiId: string;
  title: string;
  unitHint: string;
  formula: string;
  sourceIds: string[];
  breakdowns?: string[];
}
interface DataSource {
  sourceId: string;
  label: string;
  filePath: string;
}
interface UserMapping {
  userId: string;
  sufficientKpis: string[];
  recommendedOrgWideKpis?: string[];
}
interface KpiSpecFile {
  dataSources: DataSource[];
  kpis: KpiSpec[];
  userMappings: UserMapping[];
}

let _specCache: KpiSpecFile | null = null;

function loadSpec(): KpiSpecFile {
  if (_specCache) return _specCache;
  const p = join(getRepoRoot(), "data/kpi-spec/kpi-spec-v2.json");
  _specCache = JSON.parse(readFileSync(p, "utf8")) as KpiSpecFile;
  return _specCache;
}

/* ================================================================== */
/*  CSV loader helpers (cached per source)                             */
/* ================================================================== */

const _csvCache = new Map<string, Record<string, string>[]>();

const CSV_PATH_OVERRIDES: Record<string, string> = {
  zoho_desk_tickets: "data/zoho/Zoho-Desk-Tickets.csv",
};

function loadSource(sourceId: string): { rows: Record<string, string>[]; sourcePath: string } {
  const spec = loadSpec();
  const ds = spec.dataSources.find((d) => d.sourceId === sourceId);
  if (!ds) throw new Error(`No data source for ${sourceId}`);
  const sourcePath = CSV_PATH_OVERRIDES[sourceId] ?? ds.filePath;
  if (!sourcePath) throw new Error(`No file path for ${sourceId}`);
  const abs = join(getRepoRoot(), sourcePath);
  if (!_csvCache.has(abs)) {
    _csvCache.set(abs, loadCsvRecords(abs));
  }
  return { rows: _csvCache.get(abs)!, sourcePath };
}

/* ================================================================== */
/*  Tiny helpers                                                       */
/* ================================================================== */

const EMPTY = new Set(["", "null", "NULL", "None", "none", "undefined", "NaN"]);

function isBlank(v: string | undefined | null): boolean {
  if (v === undefined || v === null) return true;
  return EMPTY.has(v.trim());
}

function num(v: string | undefined | null): number {
  if (isBlank(v)) return NaN;
  const stripped = v!.replace(/^[A-Z]{3}\s*/i, "").replace(/,/g, "").trim();
  return parseFloat(stripped);
}

function sampleRows(rows: Record<string, string>[], n = 3): Record<string, string | number | null>[] {
  return rows.slice(0, n).map((r) => ({ ...r }));
}

function maxDate(rows: Record<string, string>[], col: string): string {
  let best = "";
  for (const r of rows) {
    const v = r[col];
    if (!isBlank(v) && v > best) best = v;
  }
  if (!best) return new Date().toISOString();
  const d = new Date(best);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function flatTrend() {
  return { direction: "flat" as const, delta: null, deltaPct: null };
}

function buildResult(
  kpiId: string,
  value: number,
  displayValue: string,
  sourceId: string,
  sourcePath: string,
  formula: string,
  rowCount: number,
  rows: Record<string, string>[],
  freshCol: string,
  breakdowns?: Record<string, Record<string, number>>,
): ComputedKpi {
  return {
    kpiId,
    value: round2(value),
    displayValue,
    previousValue: null,
    trend: flatTrend(),
    provenance: {
      sourceId,
      sourcePath,
      formula,
      rowCount,
      sampleRows: sampleRows(rows),
    },
    dataFreshness: maxDate(rows, freshCol),
    ...(breakdowns ? { breakdowns } : {}),
  };
}

function countBy(rows: Record<string, string>[], col: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const key = isBlank(r[col]) ? "(empty)" : r[col].trim();
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

/* ================================================================== */
/*  Individual KPI formulas                                            */
/* ================================================================== */

function isClosed(stage: string): boolean {
  return stage.toLowerCase().startsWith("closed");
}

function winRate(): ComputedKpi | null {
  const spec = loadSpec().kpis.find((k) => k.kpiId === "win_rate")!;
  const { rows, sourcePath } = loadSource("zoho_crm_deals");
  const closed = rows.filter((r) => isClosed(r["Stage"] ?? ""));
  const won = closed.filter((r) => r["Stage"] === "Closed Won").length;
  if (closed.length === 0) return null;
  const value = (won / closed.length) * 100;
  return buildResult(
    "win_rate", value, `${round2(value)}%`,
    "zoho_crm_deals", sourcePath, spec.formula, rows.length, rows, "Created Time",
  );
}

function supportIssueVolume(): ComputedKpi | null {
  const spec = loadSpec().kpis.find((k) => k.kpiId === "support_issue_volume")!;
  const { rows, sourcePath } = loadSource("zoho_desk_tickets");
  const value = rows.length;
  return buildResult(
    "support_issue_volume", value, `${value}`,
    "zoho_desk_tickets", sourcePath, spec.formula, rows.length, rows, "Created Time",
    {
      by_channel: countBy(rows, "Channel"),
      by_category: countBy(rows, "Category"),
      by_priority: countBy(rows, "Priority"),
    },
  );
}

function prospects(): ComputedKpi | null {
  const spec = loadSpec().kpis.find((k) => k.kpiId === "prospects")!;
  const { rows, sourcePath } = loadSource("zoho_crm_leads");
  const value = rows.length;
  const converted = rows.filter((r) => r["Is Converted"]?.toLowerCase() === "true").length;
  return buildResult(
    "prospects", value, `${value}`,
    "zoho_crm_leads", sourcePath, spec.formula, rows.length, rows, "Created Time",
    { by_converted: { converted, not_converted: value - converted } },
  );
}

function pipelineValue(): ComputedKpi | null {
  const spec = loadSpec().kpis.find((k) => k.kpiId === "pipeline_value")!;
  const { rows, sourcePath } = loadSource("zoho_crm_deals");
  const open = rows.filter((r) => !isClosed(r["Stage"] ?? ""));
  let total = 0;
  for (const r of open) {
    const a = num(r["Amount"]);
    if (!isNaN(a)) total += a;
  }
  if (total === 0) return null;
  return buildResult(
    "pipeline_value", total, `$${round2(total).toLocaleString()}`,
    "zoho_crm_deals", sourcePath, spec.formula, rows.length, rows, "Created Time",
    { by_stage: countBy(open, "Stage") },
  );
}

function resolutionTime(): ComputedKpi | null {
  const spec = loadSpec().kpis.find((k) => k.kpiId === "resolution_time")!;
  const { rows, sourcePath } = loadSource("zoho_desk_tickets");
  const valid: number[] = [];
  for (const r of rows) {
    const v = num(r["Resolution Time in Business Hours"]);
    if (!isNaN(v) && v > 0) valid.push(v);
  }
  if (valid.length === 0) return null;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return buildResult(
    "resolution_time", avg, `${round2(avg)} hrs`,
    "zoho_desk_tickets", sourcePath, spec.formula, rows.length, rows, "Created Time",
  );
}

function slaCompliance(): ComputedKpi | null {
  const spec = loadSpec().kpis.find((k) => k.kpiId === "sla_compliance")!;
  const { rows, sourcePath } = loadSource("zoho_desk_tickets");
  if (rows.length === 0) return null;
  const noViolation = rows.filter((r) => isBlank(r["SLA Violation Type"])).length;
  const value = (noViolation / rows.length) * 100;
  return buildResult(
    "sla_compliance", value, `${round2(value)}%`,
    "zoho_desk_tickets", sourcePath, spec.formula, rows.length, rows, "Created Time",
  );
}

function fcrRate(): ComputedKpi | null {
  const spec = loadSpec().kpis.find((k) => k.kpiId === "fcr_rate")!;
  const { rows, sourcePath } = loadSource("zoho_desk_tickets");
  if (rows.length === 0) return null;
  const fcr = rows.filter((r) => r["Is First Call Resolution"]?.toLowerCase() === "true").length;
  const value = (fcr / rows.length) * 100;
  return buildResult(
    "fcr_rate", value, `${round2(value)}%`,
    "zoho_desk_tickets", sourcePath, spec.formula, rows.length, rows, "Created Time",
  );
}

function ticketReopenRate(): ComputedKpi | null {
  const spec = loadSpec().kpis.find((k) => k.kpiId === "ticket_reopen_rate")!;
  const { rows, sourcePath } = loadSource("zoho_desk_tickets");
  if (rows.length === 0) return null;
  const reopened = rows.filter((r) => {
    const n = num(r["Number of Reopen"]);
    return !isNaN(n) && n > 0;
  }).length;
  const value = (reopened / rows.length) * 100;
  return buildResult(
    "ticket_reopen_rate", value, `${round2(value)}%`,
    "zoho_desk_tickets", sourcePath, spec.formula, rows.length, rows, "Created Time",
  );
}

function csat(): ComputedKpi | null {
  const spec = loadSpec().kpis.find((k) => k.kpiId === "csat")!;
  const { rows, sourcePath } = loadSource("zoho_desk_tickets");
  const valid: number[] = [];
  for (const r of rows) {
    const v = num(r["Happiness Rating"]);
    if (!isNaN(v)) valid.push(v);
  }
  if (valid.length > 0) {
    const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
    return buildResult(
      "csat", avg, `${round2(avg)}`,
      "zoho_desk_tickets", sourcePath, spec.formula, valid.length, rows, "Created Time",
    );
  }
  // Proxy: derive from resolution completion rate on a 1-5 scale
  const closed = rows.filter((r) => (r["Status"] ?? "").toLowerCase() === "closed").length;
  if (rows.length === 0) return null;
  const completionRate = closed / rows.length;
  const proxyCsat = round2(1 + completionRate * 4); // maps 0-100% → 1-5
  return buildResult(
    "csat", proxyCsat, `${proxyCsat} (proxy)`,
    "zoho_desk_tickets", sourcePath,
    spec.formula + " [proxy: resolution completion rate → 1-5 scale]",
    rows.length, rows, "Created Time",
  );
}

const NEGATIVE_CLASSIFICATIONS = new Set([
  "Technical Issue", "Shift Cancellation", "Invoice Query", "Block",
]);
const POSITIVE_CLASSIFICATIONS = new Set([
  "Feedback", "Feature request",
]);

function deriveSentiment(classification: string): "Positive" | "Negative" | "Neutral" {
  if (POSITIVE_CLASSIFICATIONS.has(classification)) return "Positive";
  if (NEGATIVE_CLASSIFICATIONS.has(classification)) return "Negative";
  return "Neutral";
}

function sentimentTrend(): ComputedKpi | null {
  const spec = loadSpec().kpis.find((k) => k.kpiId === "sentiment_trend")!;
  const { rows, sourcePath } = loadSource("zoho_desk_tickets");

  const withSentiment = rows.filter((r) => !isBlank(r["Sentiment"]));
  if (withSentiment.length > 0) {
    const dist = countBy(withSentiment, "Sentiment");
    const positive = dist["Positive"] ?? 0;
    const total = withSentiment.length;
    const pctPositive = (positive / total) * 100;
    return buildResult(
      "sentiment_trend", pctPositive, `${round2(pctPositive)}% positive`,
      "zoho_desk_tickets", sourcePath, spec.formula, rows.length, rows, "Created Time",
      { by_sentiment: dist },
    );
  }

  // Proxy: derive from Classifications field
  const dist: Record<string, number> = { Positive: 0, Negative: 0, Neutral: 0 };
  for (const r of rows) {
    const cls = (r["Classifications"] ?? "").trim();
    dist[deriveSentiment(cls)]++;
  }
  const total = rows.length || 1;
  const pctPositive = (dist["Positive"] / total) * 100;
  return buildResult(
    "sentiment_trend", pctPositive, `${round2(pctPositive)}% positive (proxy)`,
    "zoho_desk_tickets", sourcePath,
    spec.formula + " [proxy: derived from Classifications]",
    rows.length, rows, "Created Time",
    { by_sentiment: dist },
  );
}

function shifts(): ComputedKpi | null {
  const spec = loadSpec().kpis.find((k) => k.kpiId === "shifts")!;
  const { rows, sourcePath } = loadSource("custom_shifts");
  const finished = rows.filter((r) => r["Current Shift Status"] === "Finished");
  if (finished.length === 0) return null;
  return buildResult(
    "shifts", finished.length, `${finished.length}`,
    "custom_shifts", sourcePath, spec.formula, rows.length, rows, "Date Created",
  );
}

function shiftUtilisation(): ComputedKpi | null {
  const spec = loadSpec().kpis.find((k) => k.kpiId === "shift_utilisation")!;
  const { rows, sourcePath } = loadSource("custom_shifts");
  const finished = rows.filter((r) => r["Current Shift Status"] === "Finished");
  let totalWorked = 0;
  let totalExpected = 0;
  for (const r of finished) {
    const worked = num(r["Hours worked"]);
    const expected = num(r["Total Hours Expected"]);
    if (!isNaN(worked) && !isNaN(expected) && expected > 0) {
      totalWorked += worked;
      totalExpected += expected;
    }
  }
  if (totalExpected === 0) return null;
  const value = (totalWorked / totalExpected) * 100;
  return buildResult(
    "shift_utilisation", value, `${round2(value)}%`,
    "custom_shifts", sourcePath, spec.formula, rows.length, rows, "Date Created",
  );
}

function inactivePharmacyRate(): ComputedKpi | null {
  const spec = loadSpec().kpis.find((k) => k.kpiId === "inactive_pharmacy_rate")!;
  const { rows, sourcePath } = loadSource("custom_shifts");
  const allPharmacies = new Set<string>();
  const activePharmacies = new Set<string>();
  for (const r of rows) {
    const name = r["Pharmacy Name"]?.trim();
    if (!name) continue;
    allPharmacies.add(name);
    if (r["Current Shift Status"] === "Finished") {
      activePharmacies.add(name);
    }
  }
  if (allPharmacies.size === 0) return null;
  const inactive = allPharmacies.size - activePharmacies.size;
  const value = (inactive / allPharmacies.size) * 100;
  return buildResult(
    "inactive_pharmacy_rate", value, `${round2(value)}%`,
    "custom_shifts", sourcePath, spec.formula, rows.length, rows, "Date Created",
  );
}

function jobsPosted(): ComputedKpi | null {
  const spec = loadSpec().kpis.find((k) => k.kpiId === "jobs_posted")!;
  const { rows, sourcePath } = loadSource("custom_shifts");
  const value = rows.length;
  return buildResult(
    "jobs_posted", value, `${value}`,
    "custom_shifts", sourcePath, spec.formula, rows.length, rows, "Date Created",
  );
}

function avgDealSize(): ComputedKpi | null {
  const spec = loadSpec().kpis.find((k) => k.kpiId === "avg_deal_size")!;
  const { rows, sourcePath } = loadSource("zoho_crm_deals");
  const won = rows.filter((r) => r["Stage"] === "Closed Won");
  const amounts: number[] = [];
  for (const r of won) {
    const a = num(r["Amount"]);
    if (!isNaN(a)) amounts.push(a);
  }
  if (amounts.length === 0) return null;
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  return buildResult(
    "avg_deal_size", avg, `$${round2(avg).toLocaleString()}`,
    "zoho_crm_deals", sourcePath, spec.formula, rows.length, rows, "Created Time",
  );
}

/* ================================================================== */
/*  Dispatch table                                                     */
/* ================================================================== */

const FORMULAS: Record<string, () => ComputedKpi | null> = {
  win_rate: winRate,
  support_issue_volume: supportIssueVolume,
  prospects,
  pipeline_value: pipelineValue,
  resolution_time: resolutionTime,
  sla_compliance: slaCompliance,
  fcr_rate: fcrRate,
  ticket_reopen_rate: ticketReopenRate,
  csat,
  sentiment_trend: sentimentTrend,
  shifts,
  shift_utilisation: shiftUtilisation,
  inactive_pharmacy_rate: inactivePharmacyRate,
  jobs_posted: jobsPosted,
  avg_deal_size: avgDealSize,
};

/* ================================================================== */
/*  Public API                                                         */
/* ================================================================== */

export function computeKpi(kpiId: string, _sourcePath?: string): ComputedKpi | null {
  const fn = FORMULAS[kpiId];
  if (!fn) return null;
  return fn();
}

export function computeAllForUser(userId: string): ComputedKpi[] {
  const spec = loadSpec();
  const mapping = spec.userMappings.find((m) => m.userId === userId);
  if (!mapping) return [];
  const ids = [
    ...new Set([
      ...mapping.sufficientKpis,
      ...(mapping.recommendedOrgWideKpis ?? []),
    ]),
  ];
  const results: ComputedKpi[] = [];
  for (const kpiId of ids) {
    const result = computeKpi(kpiId);
    if (result) results.push(result);
  }
  return results;
}
