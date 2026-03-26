import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getRepoRoot } from "../repo-root.js";
import type { ProcessedSignalsFile } from "../pipeline/types.js";
import { evaluateReviewGates } from "./gates.js";
import { logError, logInfo } from "../logging/logger.js";

function main(): void {
  try {
    const root = getRepoRoot();
    const outDir = join(root, "out");
    const processedPath = join(outDir, "processed-signals.json");
    if (!existsSync(processedPath)) {
      throw new Error(`Missing ${processedPath}. Run pipeline first.`);
    }
    const processed = JSON.parse(readFileSync(processedPath, "utf8")) as ProcessedSignalsFile;
    const report = {
      generatedAt: new Date().toISOString(),
      ...evaluateReviewGates(processed),
    };

    mkdirSync(outDir, { recursive: true });
    const reportPath = join(outDir, "review-gates.json");
    writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
    logInfo({ event: "review_gates_written", reportPath, pass: report.pass });
    if (!report.pass) process.exitCode = 1;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logError({ event: "review_gates_failed", error: msg });
    process.exitCode = 1;
  }
}

main();
