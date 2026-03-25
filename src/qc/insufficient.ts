import { createMvdValidator } from "../validate/ajv.js";

/**
 * Schema validation for insufficient-data cards + guardrails:
 * no stray numeric KPI fields on the payload (fabrication check).
 */
export function validateInsufficientDataCard(payload: unknown): {
  ok: boolean;
  errors: string[];
} {
  const ajv = createMvdValidator();
  const validate = ajv.getSchema("https://camin.local/schemas/insufficient-data.json");
  if (!validate) {
    return { ok: false, errors: ["Schema insufficient-data not registered"] };
  }
  const ok = validate(payload) as boolean;
  const errors: string[] = [];
  if (!ok && validate.errors) {
    for (const e of validate.errors) {
      errors.push(`${e.instancePath || "/"} ${e.message}`);
    }
  }
  if (ok && payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    if ("currentValue" in o || "changePct" in o) {
      errors.push("Insufficient-data card must not include KPI numeric fields like currentValue.");
      return { ok: false, errors };
    }
  }
  return { ok: errors.length === 0, errors };
}
