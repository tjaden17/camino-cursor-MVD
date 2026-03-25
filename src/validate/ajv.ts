import { Ajv } from "ajv";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getRepoRoot } from "../repo-root.js";

function load(name: string): object {
  const schemasDir = join(getRepoRoot(), "schemas");
  return JSON.parse(readFileSync(join(schemasDir, name), "utf8")) as object;
}

/** Shared Ajv instance with MVD schemas registered by $id */
export function createMvdValidator(): Ajv {
  const ajv = new Ajv({ allErrors: true, strict: false });
  ajv.addSchema(load("provenance.json"));
  ajv.addSchema(load("signal-overview.json"));
  ajv.addSchema(load("signal-expanded.json"));
  ajv.addSchema(load("weekly-brief-row.json"));
  ajv.addSchema(load("insufficient-data.json"));
  ajv.addSchema(load("onboarding-profile.json"));
  return ajv;
}
