import { retrieve } from "../../rag/index.js";
import type { RetrievalResult } from "../../rag/index.js";
import type { ComputedKpi } from "./kpi-compute.js";

/* ================================================================== */
/*  Public types                                                       */
/* ================================================================== */

export interface RetrievedContext {
  kb1Company: string[];
  kb1User: string[];
  kb2Benchmarks: string[];
  kb3Patterns: string[];
  sources: { kb: string; heading: string; sourcePath: string }[];
}

export interface AssembledPrompt {
  kpiId: string;
  version: "A" | "B";
  systemPrompt: string;
  userPrompt: string;
  retrievedContext: RetrievedContext;
}

/* ================================================================== */
/*  System prompt (shared across A and B)                              */
/* ================================================================== */

const SYSTEM_PROMPT = `You are Camino, a signal intelligence assistant. You analyze business metrics for executives.

Rules:
- Every number you cite must come from the COMPUTED DATA section below
- Every benchmark you cite must come from the BENCHMARKS section below with its source
- If no benchmark is available, say "no benchmark available for this metric"
- Use chain-of-thought reasoning: show your analytical steps as bullet points
- Be specific: reference actual numbers, breakdowns, and sources`;

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function textsFrom(results: RetrievalResult[]): string[] {
  return results.map((r) => r.chunk.text);
}

function sourcesFrom(
  results: RetrievalResult[],
): { kb: string; heading: string; sourcePath: string }[] {
  return results.map((r) => ({
    kb: r.chunk.kb,
    heading: r.chunk.heading,
    sourcePath: r.chunk.sourcePath,
  }));
}

function formatBreakdowns(breakdowns?: Record<string, Record<string, number>>): string {
  if (!breakdowns) return "";
  const lines: string[] = [];
  for (const [label, buckets] of Object.entries(breakdowns)) {
    const entries = Object.entries(buckets)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    lines.push(`  ${label}: ${entries}`);
  }
  return lines.length > 0 ? `Breakdowns:\n${lines.join("\n")}` : "";
}

function joinSnippets(snippets: string[], fallback: string): string {
  return snippets.length > 0 ? snippets.join("\n\n") : fallback;
}

/* ================================================================== */
/*  RAG retrieval for a single KPI                                     */
/* ================================================================== */

export async function retrieveContextForKpi(
  kpiId: string,
  kpiTitle: string,
  userId: string,
): Promise<RetrievedContext> {
  const [kb1CompanyResults, kb1UserResults, kb2Results, kb3Results] =
    await Promise.all([
      retrieve(`${kpiTitle} company context`, 3, { kb: "kb1" }),
      retrieve(`${userId} goals decisions priorities ${kpiTitle}`, 3, { kb: "kb1" }),
      retrieve(`${kpiTitle} benchmark`, 3, { kb: "kb2" }),
      retrieve(`${kpiTitle} analysis template`, 3, { kb: "kb3" }),
    ]);

  const allResults = [
    ...kb1CompanyResults,
    ...kb1UserResults,
    ...kb2Results,
    ...kb3Results,
  ];

  return {
    kb1Company: textsFrom(kb1CompanyResults),
    kb1User: textsFrom(kb1UserResults),
    kb2Benchmarks: textsFrom(kb2Results),
    kb3Patterns: textsFrom(kb3Results),
    sources: sourcesFrom(allResults),
  };
}

/* ================================================================== */
/*  Prompt assembly (A/B versioning)                                   */
/* ================================================================== */

export async function assemblePrompts(
  kpi: ComputedKpi,
  userId: string,
  kpiTitle: string,
): Promise<{ versionA: AssembledPrompt; versionB: AssembledPrompt }> {
  const ctx = await retrieveContextForKpi(kpi.kpiId, kpiTitle, userId);

  const computedDataBlock = [
    `## Computed Data`,
    `KPI: ${kpiTitle} = ${kpi.displayValue}`,
    `Trend: ${kpi.trend.direction}${kpi.trend.delta != null ? ` ${kpi.trend.delta}` : ""}`,
    `Data freshness: ${kpi.dataFreshness}`,
    `Provenance: Calculated from ${kpi.provenance.rowCount} records in ${kpi.provenance.sourceId}. Formula: ${kpi.provenance.formula}`,
    formatBreakdowns(kpi.breakdowns),
  ]
    .filter(Boolean)
    .join("\n");

  const benchmarksBlock = `## Benchmarks (cite these with source name)\n${joinSnippets(ctx.kb2Benchmarks, "(no benchmarks retrieved)")}`;
  const companyBlock = `## Company Context\n${joinSnippets(ctx.kb1Company, "(no company context retrieved)")}`;
  const patternBlock = `## Analysis Pattern\n${joinSnippets(ctx.kb3Patterns, "(no analysis pattern retrieved)")}`;

  const versionAPrompt = [
    computedDataBlock,
    "",
    benchmarksBlock,
    "",
    companyBlock,
    "",
    patternBlock,
    "",
    `## Task`,
    `Write a signal card with:`,
    `1. **Analysis** (2-3 sentences: what's happening + chain of thought bullets showing analytical steps)`,
    `2. **Synthesis — Org Level** (2-3 sentences: why this matters for a company like this, citing benchmarks with source names)`,
  ].join("\n");

  const personalBlock = `## Personal Context\n${joinSnippets(ctx.kb1User, "(no personal context retrieved)")}`;

  const versionBPrompt = [
    computedDataBlock,
    "",
    benchmarksBlock,
    "",
    companyBlock,
    "",
    patternBlock,
    "",
    personalBlock,
    "",
    `## Task`,
    `Write a signal card with:`,
    `1. **Analysis** (2-3 sentences: what's happening + chain of thought bullets showing analytical steps)`,
    `2. **Synthesis — Personal** (2-3 sentences: why this matters for THIS USER specifically, connecting to their goals and decisions, plus benchmarks with source names)`,
  ].join("\n");

  const versionA: AssembledPrompt = {
    kpiId: kpi.kpiId,
    version: "A",
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: versionAPrompt,
    retrievedContext: ctx,
  };

  const versionB: AssembledPrompt = {
    kpiId: kpi.kpiId,
    version: "B",
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: versionBPrompt,
    retrievedContext: ctx,
  };

  return { versionA, versionB };
}
