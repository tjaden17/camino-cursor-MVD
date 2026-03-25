import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

/**
 * Load a CSV as an array of row objects (header row drives keys).
 */
export function loadCsvRecords(
  absolutePath: string,
  options?: { columns?: boolean }
): Record<string, string>[] {
  const raw = readFileSync(absolutePath, "utf8");
  const records = parse(raw, {
    columns: options?.columns !== false,
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true,
  }) as Record<string, string>[];
  return records;
}
