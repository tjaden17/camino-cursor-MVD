import { readFileSync } from "node:fs";
import { resolveOutJsonPath } from "../../utils/resolve-out-artifact";

export default defineEventHandler(() => {
  const root = String(useRuntimeConfig().mvdRepoRoot || "");
  const resolved = resolveOutJsonPath(root, "step-1c-data-quality.json");
  if (!resolved) {
    throw createError({
      statusCode: 404,
      statusMessage:
        "step-1c-data-quality.json not found. Run pipeline v2 (writes out/ or out/test-e2e-v2/).",
    });
  }
  try {
    return JSON.parse(readFileSync(resolved.path, "utf8"));
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    throw createError({ statusCode: 500, statusMessage: detail });
  }
});
