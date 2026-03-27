/**
 * Automated v1.1 release gates: strategy catalogue shape, org context, KPI spec (Decision 14).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateKpiSpec } from "../kpi-spec/validate-kpi-spec.js";
import type { GateResult, ReviewGateReport } from "./gates.js";
import type { StrategyCatalogueFile } from "../pipeline/strategy-types.js";
import type { OrgContextFile } from "../org/types.js";

export function evaluateV11Gates(repoRoot: string): ReviewGateReport {
  const outDir = join(repoRoot, "out");
  const gates: GateResult[] = [
    gateKpiSpecFile(repoRoot),
    gateOrgContext(outDir),
    gateStrategyCatalogue(outDir),
  ];
  return { pass: gates.every((g) => g.pass), gates };
}

function gateKpiSpecFile(repoRoot: string): GateResult {
  const p = join(repoRoot, "data", "kpi-spec", "kpi-spec-v1.json");
  if (!existsSync(p)) {
    return {
      id: "v11_kpi_spec_file",
      pass: false,
      message: "KPI spec JSON must exist under data/kpi-spec/kpi-spec-v1.json",
      detail: `Missing ${p}`,
    };
  }
  try {
    const raw = JSON.parse(readFileSync(p, "utf8")) as unknown;
    const v = validateKpiSpec(raw);
    return {
      id: "v11_kpi_spec_file",
      pass: v.ok,
      message: "KPI spec validates against kpi-spec-v1 schema",
      detail: v.ok ? undefined : v.errors.join("; "),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      id: "v11_kpi_spec_file",
      pass: false,
      message: "KPI spec JSON must be readable and valid",
      detail: msg,
    };
  }
}

function gateOrgContext(outDir: string): GateResult {
  const p = join(outDir, "org-context.json");
  if (!existsSync(p)) {
    return {
      id: "v11_org_context",
      pass: false,
      message: "Pipeline must emit out/org-context.json",
      detail: `Missing ${p}`,
    };
  }
  try {
    const raw = JSON.parse(readFileSync(p, "utf8")) as OrgContextFile;
    const ok =
      raw.kind === "org_context" &&
      raw.version === 1 &&
      typeof raw.orgId === "string" &&
      typeof raw.orgName === "string" &&
      raw.mergedCompanyContext != null;
    return {
      id: "v11_org_context",
      pass: ok,
      message: "org-context.json must be a valid org_context snapshot",
      detail: ok ? undefined : "Unexpected shape",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      id: "v11_org_context",
      pass: false,
      message: "org-context.json must parse",
      detail: msg,
    };
  }
}

function gateStrategyCatalogue(outDir: string): GateResult {
  const p = join(outDir, "strategy-catalogue.json");
  if (!existsSync(p)) {
    return {
      id: "v11_strategy_catalogue",
      pass: false,
      message: "Pipeline must emit out/strategy-catalogue.json",
      detail: `Missing ${p}`,
    };
  }
  try {
    const raw = JSON.parse(readFileSync(p, "utf8")) as StrategyCatalogueFile;
    const kpisOk = raw.kpis?.length === 12;
    const decOk = raw.decisions?.length === 6;
    const samplesOk =
      (raw.sampleCalcsRequested?.length ?? 0) === 3 &&
      (raw.sampleCalcsRecommended?.length ?? 0) === 3;
    const ok =
      raw.kind === "strategy_catalogue" &&
      raw.version === 1 &&
      kpisOk &&
      decOk &&
      samplesOk;
    return {
      id: "v11_strategy_catalogue",
      pass: ok,
      message: "strategy-catalogue.json must have 12 KPIs, 6 decisions, 3+3 sample calcs",
      detail: ok
        ? undefined
        : `kind/version/kpis(${raw.kpis?.length})/decisions(${raw.decisions?.length})/samples`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      id: "v11_strategy_catalogue",
      pass: false,
      message: "strategy-catalogue.json must parse",
      detail: msg,
    };
  }
}
