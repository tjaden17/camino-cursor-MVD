/**
 * Stage 3a: Per sub-issue analysis via LLM.
 * For each measurable/partial sub-issue, builds a prompt from org context,
 * Stage 1 summaries, and RAG benchmarks, then calls the LLM.
 * Falls back to stub cards when --skip-llm is active.
 *
 * Spec: decisions/Pipeline-Spec-Briefing-Cards-Takeaways.md — STAGE 3
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getRepoRoot } from "../repo-root.js";
import { callLlm, extractJson, isLlmAvailable } from "./llm.js";
import type {
  BriefingOrgContext,
  SourceSummary,
  IssueTree,
  AnalysisCard,
  Kpi,
  QualityNote,
} from "./types.js";

interface RawAnalysisResponse {
  subIssueId: string;
  kpis: Kpi[];
  qualityNotes?: QualityNote[];
}

export async function runAnalysis(
  org: BriefingOrgContext,
  sourceSummaries: SourceSummary[],
  issueTree: IssueTree,
): Promise<AnalysisCard[]> {
  const cards: AnalysisCard[] = [];

  for (const branch of issueTree.branches) {
    for (const subIssue of branch.subIssues) {
      const card = await analyseSubIssue(
        org,
        sourceSummaries,
        branch.branchId,
        branch.label,
        subIssue.subIssueId,
        subIssue.name,
        subIssue.question,
      );
      cards.push(card);
    }
  }

  return cards;
}

async function analyseSubIssue(
  org: BriefingOrgContext,
  sourceSummaries: SourceSummary[],
  branchId: string,
  branchLabel: string,
  subIssueId: string,
  subIssueName: string,
  question: string,
): Promise<AnalysisCard> {
  if (!isLlmAvailable()) {
    return stubCard(branchId, branchLabel, subIssueId, subIssueName);
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(org, sourceSummaries, branchLabel, subIssueId, subIssueName, question);

  const maxTokens = Number(process.env.BRIEFING_MAX_TOKENS_ANALYSIS ?? "8192");
  const result = await callLlm({ systemPrompt, userPrompt, maxTokens });

  if (result.source === "stub") {
    return stubCard(branchId, branchLabel, subIssueId, subIssueName);
  }

  try {
    const parsed = extractJson<RawAnalysisResponse>(result.text);
    return {
      cardId: `subissue-${subIssueId}`,
      subIssueId,
      subIssueName,
      branchId,
      branchLabel,
      kpis: parsed.kpis ?? [],
      observations: [],
      tags: [],
      qualityNotes: parsed.qualityNotes ?? [],
      qcStatus: "pass",
    };
  } catch (err) {
    console.warn(
      `[briefing] Stage 3a: invalid JSON for ${subIssueId} ${subIssueName} —`,
      err instanceof Error ? err.message : err,
    );
    return parseFailureCard(branchId, branchLabel, subIssueId, subIssueName, err);
  }
}

function buildSystemPrompt(): string {
  return `You are Camino, a data analyst assistant. You produce factual observations from raw business data.

Rules:
- Every number must state the TIME PERIOD it covers.
- If comparing across data sources with different time ranges, flag the mismatch.
- Note patterns, anomalies, or concentrations.
- Note data quality issues that affect calculations.
- Do NOT judge whether numbers are good or bad — state facts.
- Mark each KPI: measured | partial | gap.
- Output valid JSON only: one object, double-quoted strings, no trailing commas, escape line breaks inside strings as \\n.
- Keep the response compact so it fits in one message (prefer fewer KPIs with clear reasoning over very long arrays).`;
}

function buildUserPrompt(
  org: BriefingOrgContext,
  sourceSummaries: SourceSummary[],
  branchLabel: string,
  subIssueId: string,
  subIssueName: string,
  question: string,
): string {
  const ctx = org.mergedCompanyContext;
  const dataSections = sourceSummaries
    .map((s) => formatSourceForPrompt(s))
    .join("\n\n---\n\n");

  const benchmarks = loadBenchmarks();

  return `Context:
- Company: ${ctx.company}, ${ctx.industry}, ${ctx.stage}
- Sub-issue: ${subIssueId} ${subIssueName}
- Parent branch: ${branchLabel}
- Question: ${question}

Data provided:
${dataSections}

${benchmarks ? `Benchmarks (from knowledge base):\n${benchmarks}\n\n` : ""}Instructions:
1. Identify which KPIs can be calculated from this data for this sub-issue.
2. For each KPI, calculate the value. Show your working.
3. State the TIME PERIOD every number covers.
4. If comparing across data sources with different time ranges, flag the mismatch explicitly.
5. Note patterns, anomalies, or concentrations.
6. Note data quality issues that affect the calculation.
7. Do NOT judge whether the number is good or bad — state facts.
8. Mark each KPI: measured | partial | gap.

Output JSON:
{
  "subIssueId": "${subIssueId}",
  "kpis": [
    {
      "name": "KPI Name",
      "value": "calculated value",
      "timePeriod": "time period",
      "status": "measured|partial|gap",
      "context": "brief context",
      "reasoning": ["step 1", "step 2"]
    }
  ],
  "qualityNotes": []
}`;
}

function formatSourceForPrompt(summary: SourceSummary): string {
  const header = `## ${summary.sourceId} (${summary.rowCount} rows, ${summary.columnCount} columns)`;
  const colInfo = summary.columns
    .map((c) => `  - ${c.name}: ${c.type}, ${c.populated} populated${c.values ? ` [${Object.keys(c.values).length} unique values]` : ""}${c.min !== undefined ? ` (min=${c.min}, max=${c.max}, mean=${c.mean})` : ""}`)
    .join("\n");

  let dataSection: string;
  if (summary.excerpt.strategy === "full") {
    try {
      const repoRoot = getRepoRoot();
      const raw = readFileSync(resolve(repoRoot, summary.filePath), "utf-8");
      dataSection = `Full CSV:\n${raw}`;
    } catch {
      dataSection = `(Could not read file: ${summary.filePath})`;
    }
  } else {
    const parts: string[] = [];
    if (summary.excerpt.groupByCounts) {
      parts.push(`Group-by counts:\n${JSON.stringify(summary.excerpt.groupByCounts, null, 2)}`);
    }
    if (summary.excerpt.numericAggregates) {
      parts.push(`Numeric aggregates:\n${JSON.stringify(summary.excerpt.numericAggregates, null, 2)}`);
    }
    if (summary.excerpt.topRows) {
      parts.push(`Top ${summary.excerpt.topRows.length} rows:\n${JSON.stringify(summary.excerpt.topRows, null, 2)}`);
    }
    if (summary.excerpt.dateBuckets) {
      parts.push(`Date buckets (by month):\n${JSON.stringify(summary.excerpt.dateBuckets, null, 2)}`);
    }
    dataSection = parts.join("\n\n");
  }

  const qualityWarnings = summary.qualityNotes.length > 0
    ? `\nQuality warnings:\n${summary.qualityNotes.map((n) => `  ⚠ ${n.message}`).join("\n")}`
    : "";

  return `${header}\nDate range: ${summary.dateRange ? `${summary.dateRange.earliest} to ${summary.dateRange.latest}` : "N/A"}\nColumns:\n${colInfo}${qualityWarnings}\n\n${dataSection}`;
}

function loadBenchmarks(): string {
  try {
    const repoRoot = getRepoRoot();
    const benchmarkPath = resolve(repoRoot, "knowledge", "kb2-saas-sales-benchmarks.md");
    return readFileSync(benchmarkPath, "utf-8").slice(0, 3000);
  } catch {
    return "";
  }
}

function parseFailureCard(
  branchId: string,
  branchLabel: string,
  subIssueId: string,
  subIssueName: string,
  err: unknown,
): AnalysisCard {
  const msg = err instanceof Error ? err.message : String(err);
  return {
    cardId: `subissue-${subIssueId}`,
    subIssueId,
    subIssueName,
    branchId,
    branchLabel,
    kpis: [
      {
        name: "Analysis unavailable (parse error)",
        value: "N/A",
        timePeriod: "N/A",
        status: "gap",
        context: "The model returned text that could not be parsed as JSON. Try re-running or increase BRIEFING_MAX_TOKENS_ANALYSIS.",
        reasoning: [msg.slice(0, 500)],
      },
    ],
    observations: [`Could not parse LLM output for ${subIssueName}`],
    tags: [],
    qualityNotes: [{ level: "warn", message: `Invalid JSON from LLM: ${msg.slice(0, 200)}` }],
    qcStatus: "needs_review",
  };
}

function stubCard(
  branchId: string,
  branchLabel: string,
  subIssueId: string,
  subIssueName: string,
): AnalysisCard {
  return {
    cardId: `subissue-${subIssueId}`,
    subIssueId,
    subIssueName,
    branchId,
    branchLabel,
    kpis: [
      {
        name: `Stub KPI for ${subIssueName}`,
        value: "N/A (LLM skipped)",
        timePeriod: "N/A",
        status: "gap",
        context: "Stub card — re-run with ANTHROPIC_API_KEY to get real analysis.",
        reasoning: ["LLM was skipped or API key not set."],
      },
    ],
    observations: [`Stub: no analysis available for ${subIssueName} (LLM skipped)`],
    tags: [],
    qualityNotes: [],
    qcStatus: "pass",
  };
}
