/**
 * POST body: { "schemaId": "signal_overview" | "insufficient_data" | ..., "payload": <json> }
 * Requires `npm run build` at Camin-MVD root so `dist/validate/ajv.js` exists.
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const schemaUri: Record<string, string> = {
  signal_overview: "https://camin.local/schemas/signal-overview.json",
  signal_expanded: "https://camin.local/schemas/signal-expanded.json",
  insufficient_data: "https://camin.local/schemas/insufficient-data.json",
  weekly_brief_row: "https://camin.local/schemas/weekly-brief-row.json",
};

export default defineEventHandler(async (event) => {
  const body = await readBody<{ schemaId?: string; payload?: unknown }>(event);
  const schemaId = body?.schemaId;
  const payload = body?.payload;
  if (!schemaId || !schemaUri[schemaId]) {
    return {
      ok: false,
      errors: [`Unknown schemaId. Use one of: ${Object.keys(schemaUri).join(", ")}`],
    };
  }
  if (payload === undefined) {
    return { ok: false, errors: ["Missing payload"] };
  }

  const config = useRuntimeConfig();
  const root = String(config.mvdRepoRoot || "");
  process.env.MVD_REPO_ROOT = root;

  const href = pathToFileURL(join(root, "dist/validate/ajv.js")).href;
  let mod: {
    createMvdValidator: () => {
      getSchema: (id: string) => ((data: unknown) => boolean) | undefined;
      errorsText: () => string;
    };
  };
  try {
    mod = await import(href);
  } catch {
    return {
      ok: false,
      errors: [
        "Validator module not available. Run npm run build at the Camino-MVD repo root so dist/ exists.",
      ],
    };
  }
  const ajv = mod.createMvdValidator();
  const v = ajv.getSchema(schemaUri[schemaId]);
  if (!v) {
    return { ok: false, errors: ["Schema not registered"] };
  }
  const ok = v(payload) as boolean;
  return {
    ok,
    errors: ok ? [] : [ajv.errorsText()],
  };
});
