/**
 * Shared QC report builder: golden replay/diff, JSON Schema checks, insufficient-data validation.
 * Used by the CLI and by the Nuxt QC app (set MVD_REPO_ROOT or rely on package walk).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createMvdValidator } from "../validate/ajv.js";
import {
  replayLeadsTotalCount,
  replayShiftsFinishedSeptember2025,
  type ReplayResult,
} from "../kpi/rules.js";
import { diffNumeric } from "./numeric-diff.js";
import { validateInsufficientDataCard } from "./insufficient.js";
import { getRepoRoot } from "../repo-root.js";

export interface QcReportPayload {
  golden: Array<Record<string, unknown>>;
  schemaChecks: Array<Record<string, unknown>>;
  insufficient: Array<Record<string, unknown>>;
  generatedAt: string;
}

interface GoldenFixture {
  scenarioId: string;
  description?: string;
  ruleId: string;
  claimedNumeric: number;
  tolerance?: number;
  replayFn: string;
}

function repoRoot(): string {
  return getRepoRoot();
}

function runReplay(name: string): ReplayResult {
  if (name === "replayLeadsTotalCount") return replayLeadsTotalCount();
  if (name === "replayShiftsFinishedSeptember2025") return replayShiftsFinishedSeptember2025();
  throw new Error(`Unknown replayFn: ${name}`);
}

function loadGolden(path: string): GoldenFixture {
  return JSON.parse(readFileSync(path, "utf8")) as GoldenFixture;
}

function validateJsonSchema(
  ajv: ReturnType<typeof createMvdValidator>,
  id: string,
  data: unknown
): { ok: boolean; errorText?: string } {
  const v = ajv.getSchema(id);
  if (!v) throw new Error(`Missing schema ${id}`);
  const ok = v(data) as boolean;
  return { ok, errorText: ok ? undefined : ajv.errorsText() };
}

/** Build the same payload written to out/qc-report.json */
export function runQcReport(): QcReportPayload {
  const root = repoRoot();
  const ajv = createMvdValidator();

  const report: QcReportPayload = {
    golden: [],
    schemaChecks: [],
    insufficient: [],
    generatedAt: new Date().toISOString(),
  };

  const goldenFiles = [
    join(root, "fixtures/golden/leads-total.json"),
    join(root, "fixtures/golden/shifts-finished-sep-2025.json"),
  ];

  for (const gf of goldenFiles) {
    const spec = loadGolden(gf);
    const replay = runReplay(spec.replayFn);
    const diff = diffNumeric(replay.value, spec.claimedNumeric, {
      tolerance: spec.tolerance ?? 0,
      isInteger: true,
    });
    report.golden.push({
      scenarioId: spec.scenarioId,
      ruleId: spec.ruleId,
      pass: diff.pass,
      diff,
      replay: {
        ruleId: replay.ruleId,
        value: replay.value,
        sourceId: replay.sourceId,
        sourcePath: replay.sourcePath,
      },
    });
  }

  const signalOverview = JSON.parse(
    readFileSync(join(root, "fixtures/samples/signal-overview-valid.json"), "utf8")
  );
  const so = validateJsonSchema(
    ajv,
    "https://camin.local/schemas/signal-overview.json",
    signalOverview
  );
  report.schemaChecks.push({
    file: "fixtures/samples/signal-overview-valid.json",
    schema: "signal-overview",
    pass: so.ok,
    errors: so.errorText ? [so.errorText] : [],
  });

  const insValid = JSON.parse(
    readFileSync(join(root, "fixtures/samples/insufficient-data-valid.json"), "utf8")
  );
  const insValidResult = validateInsufficientDataCard(insValid);
  report.insufficient.push({
    file: "fixtures/samples/insufficient-data-valid.json",
    ...insValidResult,
  });

  const insBad = JSON.parse(
    readFileSync(join(root, "fixtures/samples/insufficient-data-invalid-fabricated.json"), "utf8")
  );
  const insBadResult = validateInsufficientDataCard(insBad);
  report.insufficient.push({
    file: "fixtures/samples/insufficient-data-invalid-fabricated.json",
    ...insBadResult,
  });

  return report;
}

export function buildReportHtml(report: QcReportPayload): string {
  const payload = JSON.stringify(report, null, 2);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>MVD QC report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1.5rem; max-width: 960px; }
    pre { background: #f4f4f5; padding: 1rem; overflow: auto; border-radius: 8px; }
    h1 { font-size: 1.25rem; }
    .ok { color: #15803d; }
    .fail { color: #b91c1c; }
  </style>
</head>
<body>
  <h1>MVD quality check (debug)</h1>
  <p>Generated <code>${report.generatedAt}</code></p>
  <p>Open <code>out/qc-report.json</code> for machine-readable output. Narrative rubric: <code>rubric/narrative-rubric.md</code>.</p>
  <pre id="out">${escapeHtml(payload)}</pre>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Exit code 1 if any gate fails (matches previous CLI behaviour). */
export function qcReportFailed(report: QcReportPayload): boolean {
  const goldenPass = report.golden.every((g) => g.pass === true);
  const schemaPass = report.schemaChecks.every((s) => s.pass === true);
  const insValidRow = report.insufficient.find((i) => String(i.file).includes("insufficient-data-valid"));
  const insInvalidRow = report.insufficient.find((i) => String(i.file).includes("invalid-fabricated"));
  const insufficientPass = insValidRow?.ok === true && insInvalidRow?.ok === false;
  return !(goldenPass && schemaPass && insufficientPass);
}
