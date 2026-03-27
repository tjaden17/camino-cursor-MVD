/**
 * `npm run validate:kpi-spec` — validates `data/kpi-spec/kpi-spec-v1.json`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { logError, logInfo } from "../logging/logger.js";
import { getRepoRoot } from "../repo-root.js";
import { validateKpiSpec } from "./validate-kpi-spec.js";

function main(): void {
  const p = join(getRepoRoot(), "data", "kpi-spec", "kpi-spec-v1.json");
  const raw = JSON.parse(readFileSync(p, "utf8")) as unknown;
  const v = validateKpiSpec(raw);
  if (v.ok) {
    logInfo({ event: "kpi_spec_validate_ok", path: p });
  } else {
    logError({ event: "kpi_spec_validate_failed", path: p, errors: v.errors });
    process.exitCode = 1;
  }
}

main();
