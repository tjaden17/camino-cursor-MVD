/**
 * Append-only structured diagnostics for `out/processing-diagnostics.json`.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

export interface ProcessingDiagnostics {
  generatedAt: string;
  normalization: Array<{ message: string; detail?: string }>;
  quality: Array<{ severity: "info" | "warn"; message: string; detail?: string }>;
  bi: Array<{ message: string; detail?: string }>;
}

export function emptyDiagnostics(): ProcessingDiagnostics {
  return {
    generatedAt: new Date().toISOString(),
    normalization: [],
    quality: [],
    bi: [],
  };
}

export function writeDiagnostics(outDir: string, d: ProcessingDiagnostics): void {
  d.generatedAt = new Date().toISOString();
  writeFileSync(join(outDir, "processing-diagnostics.json"), JSON.stringify(d, null, 2), "utf8");
}
