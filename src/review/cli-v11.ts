/**
 * `npm run review:v11` — v1.1 artefact gates (requires successful pipeline run for out/* checks).
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getRepoRoot } from "../repo-root.js";
import { evaluateV11Gates } from "./gates-v11.js";
import { logError, logInfo } from "../logging/logger.js";

function main(): void {
  try {
    const root = getRepoRoot();
    const outDir = join(root, "out");
    const report = {
      generatedAt: new Date().toISOString(),
      ...evaluateV11Gates(root),
    };

    mkdirSync(outDir, { recursive: true });
    const reportPath = join(outDir, "review-gates-v11.json");
    writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
    logInfo({ event: "review_gates_v11_written", reportPath, pass: report.pass });
    if (!report.pass) {
      const processedPath = join(outDir, "processed-signals.json");
      if (!existsSync(processedPath)) {
        logInfo({
          event: "review_v11_hint",
          hint: "Run `npm run pipeline -- --skip-llm` to emit org-context.json and strategy-catalogue.json.",
        });
      }
      process.exitCode = 1;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logError({ event: "review_gates_v11_failed", error: msg });
    process.exitCode = 1;
  }
}

main();
