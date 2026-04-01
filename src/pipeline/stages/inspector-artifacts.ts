/**
 * JSON contracts for the QC Pipeline Inspector (`IMPLEMENTATION_PLAN_QC_PIPELINE_INSPECTOR.md`).
 * Written under `out/` alongside `pipeline-v2-output.json`.
 */
import { basename, relative } from "node:path";
import type { FileQualityReport } from "./data-quality-check.js";
import type { ComputedKpi } from "./kpi-compute.js";
import type { AssembledPrompt } from "./rag-prompt-assembly.js";
import type { AnalysisSection, SynthesisSection } from "./card-schema.js";

export interface Step1cDataQualityFile {
  generatedAt: string;
  runId: string;
  summary: {
    filesChecked: number;
    passed: number;
    warnings: number;
    failures: number;
  };
  files: Array<{
    fileName: string;
    filePath: string;
    status: "pass" | "warn" | "fail";
    recordCount: number;
    issues: Array<{
      severity: "warn" | "fail";
      check: string;
      column?: string;
      detail: string;
      impact: string;
    }>;
  }>;
}

export function buildStep1cDataQualityJson(
  repoRoot: string,
  runId: string,
  reports: FileQualityReport[],
): Step1cDataQualityFile {
  let passed = 0;
  let warnings = 0;
  let failures = 0;
  const files = reports.map((r) => {
    if (r.level === "pass") passed += 1;
    else if (r.level === "warn") warnings += 1;
    else failures += 1;
    const rel = relative(repoRoot, r.filePath);
    return {
      fileName: basename(r.filePath),
      filePath: rel.startsWith("..") ? r.filePath : rel,
      status: r.level,
      recordCount: r.rowCount,
      issues: r.issues.map((detail) => ({
        severity: r.level === "fail" ? ("fail" as const) : ("warn" as const),
        check: "data_quality_gate",
        detail,
        impact: "May affect KPI accuracy or breakdowns; see diagnostics.",
      })),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    runId,
    summary: {
      filesChecked: reports.length,
      passed,
      warnings,
      failures,
    },
    files,
  };
}

export interface Step23ComputedFile {
  generatedAt: string;
  runId: string;
  users: Array<{
    userId: string;
    kpis: Array<{
      kpiId: string;
      title: string;
      status: "sufficient";
      formula: {
        description: string;
        expression: string;
      };
      result: {
        currentValue: string;
        trend: string;
        delta: string;
      };
      source: {
        file: string;
        rowsUsed: number;
        freshness: string;
      };
    }>;
  }>;
}

export function buildStep23ComputedJson(
  repoRoot: string,
  runId: string,
  users: Array<{ userId: string; kpis: ComputedKpi[]; titles: Map<string, string> }>,
): Step23ComputedFile {
  const outUsers = users.map(({ userId, kpis, titles }) => ({
    userId,
    kpis: kpis.map((k) => {
      const rel = relative(repoRoot, k.provenance.sourcePath);
      return {
        kpiId: k.kpiId,
        title: titles.get(k.kpiId) ?? k.kpiId,
        status: "sufficient" as const,
        formula: {
          description: k.provenance.formula,
          expression: k.provenance.formula,
        },
        result: {
          currentValue: k.displayValue,
          trend: k.trend.direction,
          delta:
            k.trend.deltaPct != null
              ? `${k.trend.deltaPct > 0 ? "+" : ""}${k.trend.deltaPct.toFixed(1)}%`
              : "n/a",
        },
        source: {
          file: rel.startsWith("..") ? k.provenance.sourcePath : rel,
          rowsUsed: k.provenance.rowCount,
          freshness: k.dataFreshness,
        },
      };
    }),
  }));

  return {
    generatedAt: new Date().toISOString(),
    runId,
    users: outUsers,
  };
}

export interface Step4LlmCallsFile {
  generatedAt: string;
  runId: string;
  cards: Array<{
    userId: string;
    kpiId: string;
    requestType: "requested" | "recommended";
    input: {
      deterministic: Record<string, string | number>;
      retrievedSummary: string;
      systemPromptChars: number;
      userPromptChars: number;
    };
    output: {
      versionA: { analysis: AnalysisSection; synthesis: SynthesisSection };
      versionB: { analysis: AnalysisSection; synthesis: SynthesisSection };
      stubbed: boolean;
    };
  }>;
}

export function buildStep4LlmCallsJson(
  runId: string,
  entries: Array<{
    userId: string;
    kpiId: string;
    requestType: "requested" | "recommended";
    promptA: AssembledPrompt;
    analysisA: AnalysisSection;
    synthesisA: SynthesisSection;
    synthesisB: SynthesisSection;
    skipLlm: boolean;
  }>,
): Step4LlmCallsFile {
  return {
    generatedAt: new Date().toISOString(),
    runId,
    cards: entries.map((e) => ({
      userId: e.userId,
      kpiId: e.kpiId,
      requestType: e.requestType,
      input: {
        deterministic: {
          kpiId: e.kpiId,
          kb2Snippets: e.promptA.retrievedContext.kb2Benchmarks.length,
          kb1UserSnippets: e.promptA.retrievedContext.kb1User.length,
        },
        retrievedSummary: [
          ...e.promptA.retrievedContext.kb2Benchmarks.slice(0, 1),
          ...e.promptA.retrievedContext.kb1User.slice(0, 1),
        ].join(" | "),
        systemPromptChars: e.promptA.systemPrompt.length,
        userPromptChars: e.promptA.userPrompt.length,
      },
      output: {
        versionA: { analysis: e.analysisA, synthesis: e.synthesisA },
        versionB: { analysis: e.analysisA, synthesis: e.synthesisB },
        stubbed: e.skipLlm,
      },
    })),
  };
}
