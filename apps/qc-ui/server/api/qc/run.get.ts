/**
 * Runs the same QC report as `npm run qc` at the repo root (via shared `runQcReport`).
 * Imports compiled `dist/qc/run-report.js` — run `npm run build` at the Camin-MVD repo root first.
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const root = String(config.mvdRepoRoot || "");
  process.env.MVD_REPO_ROOT = root;
  const href = pathToFileURL(join(root, "dist/qc/run-report.js")).href;
  const mod = await import(href);
  return mod.runQcReport();
});
