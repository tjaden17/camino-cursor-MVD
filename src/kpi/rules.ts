import { join } from "node:path";
import { loadCsvRecords } from "../ingest/csv.js";
import { DATASET_PATHS, type DatasetId } from "../ingest/mapping.js";
import { inRangeInclusive, parseAuSlashDateTime, parseShiftDate } from "../dates/parse.js";
import { getRepoRoot } from "../repo-root.js";

export function resolveDataPath(relativeFromRepoRoot: string): string {
  return join(getRepoRoot(), relativeFromRepoRoot);
}

export interface ReplayContext {
  /** Absolute path override for tests */
  datasetPath?: string;
}

export interface ReplayResult {
  ruleId: string;
  /** Primary numeric result for diffing */
  value: number;
  /** Human display string for signal card */
  displayValue: string;
  /** Rows contributing to the metric (for provenance sample) */
  sampleRows: Array<Record<string, string | number | null>>;
  formulaDescription: string;
  sourceId: DatasetId;
  sourcePath: string;
}

/** Count all lead rows in the Zoho leads export (MVD baseline). */
export function replayLeadsTotalCount(ctx: ReplayContext = {}): ReplayResult {
  const sourcePath = ctx.datasetPath ?? resolveDataPath(DATASET_PATHS.zoho_crm_leads);
  const rows = loadCsvRecords(sourcePath);
  const value = rows.length;
  const sample = rows.slice(0, 3).map((r) => ({
    Id: r["Id"] ?? "",
    "Created Time": r["Created Time"] ?? "",
    Company: r["Company"] ?? "",
  }));
  return {
    ruleId: "RULE_LEADS_ROW_COUNT",
    value,
    displayValue: String(value),
    sampleRows: sample,
    formulaDescription:
      "COUNT(*) over all rows in Zoho CRM Leads export after CSV parse (one row per lead).",
    sourceId: "zoho_crm_leads",
    sourcePath,
  };
}

/** Leads created on or after start and before end (date compared in UTC from AU slash date). */
export function replayLeadsCreatedInRange(
  start: Date,
  end: Date,
  ctx: ReplayContext = {}
): ReplayResult {
  const sourcePath = ctx.datasetPath ?? resolveDataPath(DATASET_PATHS.zoho_crm_leads);
  const rows = loadCsvRecords(sourcePath);
  const filtered = rows.filter((r) => {
    const ct = r["Created Time"];
    if (!ct) return false;
    const d = parseAuSlashDateTime(ct);
    if (!d) return false;
    return inRangeInclusive(d, start, end);
  });
  const value = filtered.length;
  const sample = filtered.slice(0, 3).map((r) => ({
    Id: r["Id"] ?? "",
    "Created Time": r["Created Time"] ?? "",
    Company: r["Company"] ?? "",
  }));
  return {
    ruleId: "RULE_LEADS_CREATED_IN_RANGE",
    value,
    displayValue: String(value),
    sampleRows: sample,
    formulaDescription: `COUNT leads where Created Time ∈ [${start.toISOString()}, ${end.toISOString()}] (AU date parsed to UTC midnight).`,
    sourceId: "zoho_crm_leads",
    sourcePath,
  };
}

/** Shifts with status Finished and shift date in September 2025 (fixture window). */
export function replayShiftsFinishedSeptember2025(ctx: ReplayContext = {}): ReplayResult {
  const sourcePath = ctx.datasetPath ?? resolveDataPath(DATASET_PATHS.custom_shifts);
  const rows = loadCsvRecords(sourcePath);
  const start = new Date(2025, 8, 1);
  const end = new Date(2025, 8, 30, 23, 59, 59, 999);
  const filtered = rows.filter((r) => {
    if ((r["Current Shift Status"] ?? "").trim() !== "Finished") return false;
    const sd = r["Shift Date"];
    if (!sd) return false;
    const d = parseShiftDate(sd);
    if (!d) return false;
    return inRangeInclusive(d, start, end);
  });
  const value = filtered.length;
  const sample = filtered.slice(0, 3).map((r) => ({
    "Shift Alias": r["Shift Alias"] ?? "",
    "Shift Date": r["Shift Date"] ?? "",
    "Pharmacy Name": r["Pharmacy Name"] ?? "",
  }));
  return {
    ruleId: "RULE_SHIFTS_FINISHED_SEP_2025",
    value,
    displayValue: String(value),
    sampleRows: sample,
    formulaDescription:
      "COUNT rows where Current Shift Status = Finished AND Shift Date in Sep 2025.",
    sourceId: "custom_shifts",
    sourcePath,
  };
}
