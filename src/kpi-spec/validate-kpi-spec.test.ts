import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getRepoRoot } from "../repo-root.js";
import { validateKpiSpec } from "./validate-kpi-spec.js";

describe("validateKpiSpec", () => {
  it("validates bundled kpi-spec-v1.json", () => {
    const root = getRepoRoot();
    const p = join(root, "data", "kpi-spec", "kpi-spec-v1.json");
    const raw = JSON.parse(readFileSync(p, "utf8")) as unknown;
    const r = validateKpiSpec(raw);
    expect(r.ok).toBe(true);
  });
});
