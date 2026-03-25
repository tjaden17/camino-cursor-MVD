/**
 * MVD QC CLI: golden replay/diff, JSON Schema validation, insufficient-data checks.
 * Usage: npm run qc
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getRepoRoot } from "./repo-root.js";
import { buildReportHtml, qcReportFailed, runQcReport } from "./qc/run-report.js";

function main(): void {
  const repoRoot = getRepoRoot();
  mkdirSync(join(repoRoot, "out"), { recursive: true });

  const report = runQcReport();

  const jsonPath = join(repoRoot, "out/qc-report.json");
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");

  const html = buildReportHtml(report);
  writeFileSync(join(repoRoot, "out/qc-report.html"), html, "utf8");

  console.log("MVD QC report written to out/qc-report.json and out/qc-report.html");
  console.log(JSON.stringify(report, null, 2));

  if (qcReportFailed(report)) process.exitCode = 1;
}

main();
