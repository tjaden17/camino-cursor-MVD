import { Ajv } from "ajv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getRepoRoot } from "../repo-root.js";

const SCHEMA_ID = "https://camin.local/schemas/kpi-spec-v2.json";

function loadSchema(): object {
  return JSON.parse(
    readFileSync(join(getRepoRoot(), "schemas", "kpi-spec-v2.json"), "utf8"),
  ) as object;
}

export function validateKpiSpecV2(data: unknown): { ok: boolean; errors: string[] } {
  const ajv = new Ajv({ allErrors: true, strict: false });
  ajv.addSchema(loadSchema());
  const v = ajv.getSchema(SCHEMA_ID);
  if (!v) return { ok: false, errors: ["Missing kpi-spec-v2 schema"] };
  const ok = v(data) as boolean;
  return { ok, errors: ok ? [] : [ajv.errorsText()] };
}
