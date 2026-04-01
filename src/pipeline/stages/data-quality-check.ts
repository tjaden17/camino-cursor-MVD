import { loadCsvRecords } from "../../ingest/csv.js";

export type QualityLevel = "pass" | "warn" | "fail";

export interface ColumnCheck {
  column: string;
  nullRate: number;
  level: QualityLevel;
}

export interface FileQualityReport {
  filePath: string;
  level: QualityLevel;
  rowCount: number;
  columnChecks: ColumnCheck[];
  duplicateIds: number;
  issues: string[];
}

export interface QualityGateResult {
  overallLevel: QualityLevel;
  reports: FileQualityReport[];
}

const NULL_STRINGS = new Set(["", "null", "NULL", "None"]);

function isNullValue(value: string | undefined): boolean {
  if (value === undefined) return true;
  return NULL_STRINGS.has(value);
}

function levelRank(level: QualityLevel): number {
  if (level === "fail") return 2;
  if (level === "warn") return 1;
  return 0;
}

function worstLevel(a: QualityLevel, b: QualityLevel): QualityLevel {
  return levelRank(a) >= levelRank(b) ? a : b;
}

function nullRateForColumn(rows: Record<string, string>[], column: string): number {
  if (rows.length === 0) return 0;
  let nulls = 0;
  for (const row of rows) {
    if (isNullValue(row[column])) nulls += 1;
  }
  return nulls / rows.length;
}

function keyColumnLevel(nullRate: number): QualityLevel {
  if (nullRate > 0.8) return "fail";
  if (nullRate > 0.4) return "warn";
  return "pass";
}

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function countDuplicateIds(rows: Record<string, string>[], idColumn: string): number {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const v = row[idColumn];
    if (isNullValue(v)) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let dup = 0;
  for (const n of counts.values()) {
    if (n > 1) dup += n - 1;
  }
  return dup;
}

/**
 * Check quality of a single data file.
 * @param filePath - absolute path to CSV
 * @param requiredColumns - columns that MUST exist (fail if missing)
 * @param keyColumns - columns where null rate > 40% = warn, > 80% = fail
 * @param idColumn - optional column to check for duplicates
 */
export function checkFileQuality(
  filePath: string,
  requiredColumns: string[],
  keyColumns: string[],
  idColumn?: string,
): FileQualityReport {
  const rows = loadCsvRecords(filePath);
  const rowCount = rows.length;
  const headerSet = rowCount > 0 ? new Set(Object.keys(rows[0]!)) : new Set<string>();

  const issues: string[] = [];
  let level: QualityLevel = "pass";

  for (const col of requiredColumns) {
    if (!headerSet.has(col)) {
      issues.push(`Missing required column: ${col}`);
      level = worstLevel(level, "fail");
    }
  }

  const columnChecks: ColumnCheck[] = [];

  for (const col of keyColumns) {
    if (!headerSet.has(col)) {
      const cc: ColumnCheck = { column: col, nullRate: 1, level: "fail" };
      columnChecks.push(cc);
      issues.push(`Missing key column: ${col}`);
      level = worstLevel(level, "fail");
      continue;
    }

    const nullRate = nullRateForColumn(rows, col);
    const colLevel = keyColumnLevel(nullRate);
    columnChecks.push({ column: col, nullRate, level: colLevel });

    if (colLevel === "fail") {
      issues.push(`High null rate on ${col}: ${formatPercent(nullRate)} (fail)`);
    } else if (colLevel === "warn") {
      issues.push(`High null rate on ${col}: ${formatPercent(nullRate)} (warn)`);
    }
    level = worstLevel(level, colLevel);
  }

  let duplicateIds = 0;
  if (idColumn !== undefined && idColumn !== "" && headerSet.has(idColumn)) {
    duplicateIds = countDuplicateIds(rows, idColumn);
    if (duplicateIds > 0) {
      issues.push(`${duplicateIds} duplicate values in ${idColumn} column`);
      level = worstLevel(level, "warn");
    }
  }

  return {
    filePath,
    level,
    rowCount,
    columnChecks,
    duplicateIds,
    issues,
  };
}
