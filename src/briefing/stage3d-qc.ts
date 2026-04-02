/**
 * Stage 3d: Quality control for analysis cards.
 * Layer 1: Code-verified counts — extract numeric claims from reasoning, verify against source data.
 * Layer 2: LLM review — interpretive QC batched per branch.
 *
 * Spec: decisions/Pipeline-Spec-Briefing-Cards-Takeaways.md — STAGE 3, 3d
 */
import { callLlm, extractJson, isLlmAvailable } from "./llm.js";
import type { AnalysisCard, SourceSummary, QcFailure } from "./types.js";

interface LlmQcResult {
  pass: boolean;
  issues: string[];
  suggestedFixes?: string[];
}

/**
 * Run both QC layers on all analysis cards.
 * Returns failures; cards are mutated in-place to set qcStatus.
 */
export async function runAnalysisQc(
  cards: AnalysisCard[],
  sourceSummaries: SourceSummary[],
): Promise<QcFailure[]> {
  const failures: QcFailure[] = [];

  // Layer 1: code-verified counts
  for (const card of cards) {
    const codeIssues = verifyCountsInCode(card, sourceSummaries);
    if (codeIssues.length > 0) {
      card.qcStatus = "needs_review";
      failures.push({
        stage: "3d",
        layer: "code",
        branch: card.branchId,
        cardId: card.cardId,
        pass: false,
        issues: codeIssues,
        originalContent: { kpis: card.kpis },
      });
    }
  }

  // Layer 2: LLM review (batched per branch)
  if (isLlmAvailable()) {
    const byBranch = groupByBranch(cards);
    for (const [branchId, branchCards] of Object.entries(byBranch)) {
      const result = await llmQcBranch(branchId, branchCards);
      if (result && !result.pass) {
        for (const card of branchCards) {
          card.qcStatus = "needs_review";
        }
        failures.push({
          stage: "3d",
          layer: "llm",
          branch: branchId,
          pass: false,
          issues: result.issues,
          suggestedFixes: result.suggestedFixes,
          originalContent: { cards: branchCards.map((c) => ({ cardId: c.cardId, kpis: c.kpis })) },
        });
      }
    }
  }

  return failures;
}

/**
 * Code layer: extract row-count claims from reasoning and verify against source summaries.
 */
function verifyCountsInCode(card: AnalysisCard, summaries: SourceSummary[]): string[] {
  const issues: string[] = [];

  for (const kpi of card.kpis) {
    for (const line of kpi.reasoning) {
      // Pattern: "52 rows" or "32 rows" or "N rows"
      const rowMatch = line.match(/(\d+)\s*rows/i);
      if (rowMatch) {
        const claimed = parseInt(rowMatch[1]!, 10);
        const matchingSummary = summaries.find((s) => line.toLowerCase().includes(s.sourceId.replace(/_/g, " ")));
        if (matchingSummary && matchingSummary.rowCount !== claimed) {
          issues.push(
            `Card ${card.cardId}, KPI "${kpi.name}": claims ${claimed} rows but source has ${matchingSummary.rowCount}`,
          );
        }
      }
    }
  }

  return issues;
}

function groupByBranch(cards: AnalysisCard[]): Record<string, AnalysisCard[]> {
  const groups: Record<string, AnalysisCard[]> = {};
  for (const card of cards) {
    (groups[card.branchId] ??= []).push(card);
  }
  return groups;
}

async function llmQcBranch(
  branchId: string,
  cards: AnalysisCard[],
): Promise<LlmQcResult | null> {
  if (!isLlmAvailable()) return null;

  const cardSummaries = cards
    .map((c) => JSON.stringify({ cardId: c.cardId, kpis: c.kpis, qualityNotes: c.qualityNotes }))
    .join("\n");

  const result = await callLlm({
    systemPrompt: `You are a senior data quality reviewer (management-consulting standard).
Check the analysis cards for this branch. Focus on:
1. Are numeric claims internally consistent?
2. Are time periods stated for every number?
3. Are data quality issues noted where column population is low?
4. Is interpretation separated from fact?
Output JSON: { "pass": true|false, "issues": [], "suggestedFixes": [] }`,
    userPrompt: `Branch: ${branchId}\n\nAnalysis cards:\n${cardSummaries}`,
    maxTokens: 2048,
  });

  if (result.source === "stub") return null;

  try {
    return extractJson<LlmQcResult>(result.text);
  } catch {
    return null;
  }
}
