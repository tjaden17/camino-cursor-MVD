import { existsSync } from "node:fs";
import { join } from "node:path";
import type { OrgContextFile } from "../../../../../src/org/types.js";
import type { StrategyCatalogueFile } from "../../../../../src/pipeline/strategy-types.js";
import { readJsonOrThrow } from "../../utils/json-read.js";

export default defineEventHandler(() => {
  const config = useRuntimeConfig();
  const root = String(config.mvdRepoRoot || "");
  const orgPath = join(root, "out", "org-context.json");
  const strategyPath = join(root, "out", "strategy-catalogue.json");
  if (!existsSync(orgPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: "org-context.json not found. Run `npm run pipeline -- --skip-llm` at repo root.",
    });
  }
  const org = readJsonOrThrow<OrgContextFile>(orgPath, "org-context.json");
  const strategyCatalogue = existsSync(strategyPath)
    ? readJsonOrThrow<StrategyCatalogueFile>(strategyPath, "strategy-catalogue.json")
    : null;
  return {
    source: "out/org-context.json (+ out/strategy-catalogue.json when present)",
    org,
    strategyCatalogue,
  };
});
