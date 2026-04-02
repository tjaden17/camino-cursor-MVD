/**
 * Stage 1: Raw data ingestion, schema detection, summary statistics, and excerpt preparation.
 * All code — no LLM calls. Produces one SourceSummary per data file.
 *
 * Spec: decisions/Pipeline-Spec-Briefing-Cards-Takeaways.md — STAGE 1
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { getRepoRoot } from "../repo-root.js";
import type {
  DataInventoryEntry,
  SourceSummary,
  ColumnSummary,
  ColumnType,
  QualityNote,
  DataExcerpt,
} from "./types.js";

const LARGE_FILE_THRESHOLD = 500;
const LOW_POPULATION_WARN = 0.2;
const CATEGORICAL_UNIQUE_LIMIT = 50;
const TOP_ROWS_LIMIT = 20;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function ingestSource(entry: DataInventoryEntry): SourceSummary {
  const rows = parseFile(entry);
  const deduped = dedup(rows, entry.idColumn);
  const cleaned = cleanRows(deduped);

  const columns = detectSchema(cleaned);
  const qualityNotes = generateQualityNotes(columns, cleaned, entry);
  const dateRange = extractDateRange(columns, cleaned);
  const excerpt = prepareExcerpt(cleaned, columns, entry);

  return {
    sourceId: entry.sourceId,
    filePath: entry.filePath,
    format: entry.format,
    idColumn: entry.idColumn,
    rowCount: cleaned.length,
    columnCount: columns.length,
    columns,
    dateRange,
    qualityNotes,
    excerpt,
  };
}

export function ingestAllSources(inventory: DataInventoryEntry[]): SourceSummary[] {
  return inventory.map((entry) => ingestSource(entry));
}

// ---------------------------------------------------------------------------
// File parsing
// ---------------------------------------------------------------------------

function parseFile(entry: DataInventoryEntry): Record<string, string>[] {
  const repoRoot = getRepoRoot();
  const fullPath = resolve(repoRoot, entry.filePath);
  const raw = readFileSync(fullPath, "utf-8");

  if (entry.format === "csv") {
    return parse(raw, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  }

  // XLSX support placeholder — to be wired when xlsx/exceljs dependency is added
  throw new Error(`XLSX parsing not yet implemented for ${entry.sourceId}`);
}

// ---------------------------------------------------------------------------
// Cleaning
// ---------------------------------------------------------------------------

function dedup(rows: Record<string, string>[], idColumn: string): Record<string, string>[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const id = row[idColumn];
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function cleanRows(rows: Record<string, string>[]): Record<string, string>[] {
  const blanks = new Set(["", "null", "None", "N/A", "n/a", "undefined"]);
  return rows.map((row) => {
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      const trimmed = (v ?? "").trim();
      cleaned[k] = blanks.has(trimmed) ? "" : trimmed;
    }
    return cleaned;
  });
}

// ---------------------------------------------------------------------------
// Schema detection — priority: date → boolean → currency → numeric → categorical → free_text
// ---------------------------------------------------------------------------

const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}/, // ISO
  /^\d{2}[-/]\w{3}[-/]\d{2,4}/, // DD-Mon-YY
  /^\d{2}\/\d{2}\/\d{4}/, // DD/MM/YYYY
  /^\w{3}\s+\d{1,2},?\s+\d{4}/, // Mon DD, YYYY
];

const CURRENCY_PATTERN = /^[A-Z]{0,3}\s*[$£€¥]?\s*[\d,]+\.?\d*$/;

function isDate(value: string): boolean {
  return DATE_PATTERNS.some((p) => p.test(value));
}

function isBoolean(value: string): boolean {
  return /^(true|false|yes|no|0|1)$/i.test(value);
}

function isCurrency(value: string): boolean {
  return CURRENCY_PATTERN.test(value) && value.replace(/[^0-9.]/g, "").length > 0;
}

function isNumeric(value: string): boolean {
  if (value === "") return false;
  return !isNaN(Number(value.replace(/,/g, "")));
}

function inferColumnType(values: string[]): ColumnType {
  const nonBlank = values.filter((v) => v !== "");
  if (nonBlank.length === 0) return "free_text";

  if (nonBlank.every(isDate)) return "date";
  if (nonBlank.every(isBoolean)) return "boolean";
  if (nonBlank.every(isCurrency)) return "currency";
  if (nonBlank.every(isNumeric)) return "numeric";

  const uniqueCount = new Set(nonBlank).size;
  if (uniqueCount < CATEGORICAL_UNIQUE_LIMIT) return "categorical";

  return "free_text";
}

function toNumber(value: string): number {
  return Number(value.replace(/[^0-9.-]/g, ""));
}

function detectSchema(rows: Record<string, string>[]): ColumnSummary[] {
  if (rows.length === 0) return [];

  const colNames = Object.keys(rows[0]!);
  return colNames.map((name) => {
    const values = rows.map((r) => r[name] ?? "");
    const nonBlank = values.filter((v) => v !== "");
    const type = inferColumnType(values);
    const populated = rows.length > 0 ? `${Math.round((nonBlank.length / rows.length) * 100)}%` : "0%";

    const summary: ColumnSummary = { name, type, populated };

    if (type === "categorical") {
      const dist: Record<string, number> = {};
      for (const v of values) {
        const key = v === "" ? "(empty)" : v;
        dist[key] = (dist[key] ?? 0) + 1;
      }
      summary.values = dist;
    }

    if (type === "numeric" || type === "currency") {
      const nums = nonBlank.map(toNumber).filter((n) => !isNaN(n));
      if (nums.length > 0) {
        summary.min = Math.min(...nums);
        summary.max = Math.max(...nums);
        summary.mean = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
        summary.sum = Math.round(nums.reduce((a, b) => a + b, 0));
      }
    }

    return summary;
  });
}

// ---------------------------------------------------------------------------
// Date range
// ---------------------------------------------------------------------------

function extractDateRange(
  columns: ColumnSummary[],
  rows: Record<string, string>[],
): { earliest: string; latest: string } | null {
  const dateCols = columns.filter((c) => c.type === "date");
  if (dateCols.length === 0) return null;

  let earliest = Infinity;
  let latest = -Infinity;

  for (const col of dateCols) {
    for (const row of rows) {
      const val = row[col.name];
      if (!val) continue;
      const ts = new Date(val).getTime();
      if (isNaN(ts)) continue;
      if (ts < earliest) earliest = ts;
      if (ts > latest) latest = ts;
    }
  }

  if (earliest === Infinity) return null;

  return {
    earliest: new Date(earliest).toISOString().slice(0, 10),
    latest: new Date(latest).toISOString().slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Quality notes
// ---------------------------------------------------------------------------

function generateQualityNotes(
  columns: ColumnSummary[],
  rows: Record<string, string>[],
  entry: DataInventoryEntry,
): QualityNote[] {
  const notes: QualityNote[] = [];

  for (const col of columns) {
    const pct = parseInt(col.populated, 10) / 100;
    if (pct < LOW_POPULATION_WARN && col.name !== entry.idColumn) {
      notes.push({
        level: "warn",
        message: `${col.name} only ${col.populated} populated`,
      });
    }
  }

  // Check for missing amounts on won deals (Deals-specific heuristic)
  const stageCol = columns.find((c) => c.name === "Stage");
  const amountCol = columns.find((c) => c.name === "Amount");
  if (stageCol && amountCol) {
    const wonNoAmount = rows.filter(
      (r) => r["Stage"] === "Closed Won" && !r["Amount"],
    ).length;
    if (wonNoAmount > 0) {
      notes.push({
        level: "warn",
        message: `${wonNoAmount} Closed Won deals have no Amount`,
      });
    }
  }

  return notes;
}

// ---------------------------------------------------------------------------
// Data excerpt (for LLM prompt injection in Stage 3)
// ---------------------------------------------------------------------------

function prepareExcerpt(
  rows: Record<string, string>[],
  columns: ColumnSummary[],
  _entry: DataInventoryEntry,
): DataExcerpt {
  if (rows.length <= LARGE_FILE_THRESHOLD) {
    return {
      strategy: "full",
      note: `${rows.length} rows — under ${LARGE_FILE_THRESHOLD} threshold; full CSV sent to LLM`,
    };
  }

  const categoricalCols = columns.filter((c) => c.type === "categorical");
  const numericCols = columns.filter((c) => c.type === "numeric" || c.type === "currency");
  const dateCols = columns.filter((c) => c.type === "date");

  // Group-by counts on every categorical column
  const groupByCounts: Record<string, Record<string, number>> = {};
  for (const col of categoricalCols) {
    const dist: Record<string, number> = {};
    for (const row of rows) {
      const v = row[col.name] || "(empty)";
      dist[v] = (dist[v] ?? 0) + 1;
    }
    groupByCounts[col.name] = dist;
  }

  // Numeric aggregates
  const numericAggregates: Record<string, { min: number; max: number; mean: number; sum: number }> = {};
  for (const col of numericCols) {
    const nums = rows.map((r) => toNumber(r[col.name] ?? "")).filter((n) => !isNaN(n));
    if (nums.length > 0) {
      numericAggregates[col.name] = {
        min: Math.min(...nums),
        max: Math.max(...nums),
        mean: Math.round(nums.reduce((a, b) => a + b, 0) / nums.length),
        sum: Math.round(nums.reduce((a, b) => a + b, 0)),
      };
    }
  }

  // Top 20 rows by first numeric/currency column descending
  const sortCol = numericCols[0];
  let topRows: Record<string, string>[];
  if (sortCol) {
    topRows = [...rows]
      .sort((a, b) => toNumber(b[sortCol.name] ?? "0") - toNumber(a[sortCol.name] ?? "0"))
      .slice(0, TOP_ROWS_LIMIT);
  } else {
    topRows = rows.slice(0, TOP_ROWS_LIMIT);
  }

  // Date-bucketed counts (by month)
  const dateBuckets: Record<string, Record<string, number>> = {};
  for (const col of dateCols) {
    const buckets: Record<string, number> = {};
    for (const row of rows) {
      const val = row[col.name];
      if (!val) continue;
      const d = new Date(val);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = (buckets[key] ?? 0) + 1;
    }
    if (Object.keys(buckets).length > 0) {
      dateBuckets[col.name] = buckets;
    }
  }

  return {
    strategy: "aggregated",
    note: `${rows.length} rows — over ${LARGE_FILE_THRESHOLD} threshold; pre-computed aggregations sent to LLM`,
    groupByCounts,
    numericAggregates,
    topRows: topRows as unknown as Record<string, unknown>[],
    dateBuckets: Object.keys(dateBuckets).length > 0 ? dateBuckets : undefined,
  };
}
