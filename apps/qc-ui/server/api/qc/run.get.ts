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
  try {
    const mod = await import(href);
    return mod.runQcReport();
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage:
        "QC module not available. Run npm run build at the Camino-MVD repo root so dist/ exists.",
    });
  }
});
