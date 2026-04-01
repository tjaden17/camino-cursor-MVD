import { readFileSync } from "node:fs";
import { resolveOutJsonPath } from "../../utils/resolve-out-artifact";

export default defineEventHandler(() => {
  const root = String(useRuntimeConfig().mvdRepoRoot || "");
  const resolved = resolveOutJsonPath(root, "step-4-llm-calls.json");
  if (!resolved) {
    throw createError({
      statusCode: 404,
      statusMessage: "step-4-llm-calls.json not found. Run pipeline v2 first.",
    });
  }
  try {
    return JSON.parse(readFileSync(resolved.path, "utf8"));
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    throw createError({ statusCode: 500, statusMessage: detail });
  }
});
