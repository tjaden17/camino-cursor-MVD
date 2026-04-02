/**
 * Stage 5: Lens organisation.
 * Groups analysis cards into three navigation lenses:
 *   Lens 1 — Issue Tree (deterministic grouping by branch → sub-issue)
 *   Lens 2 — Decisions (LLM maps cards to org/user decisions)
 *   Lens 3 — Risks (LLM flags risk-style observations)
 *
 * Spec: decisions/Pipeline-Spec-Briefing-Cards-Takeaways.md — STAGE 5
 */
import { callLlm, extractJson, isLlmAvailable } from "./llm.js";
import type { BriefingOrgContext, AnalysisCard, Lenses } from "./types.js";

export async function organiseLenses(
  org: BriefingOrgContext,
  cards: AnalysisCard[],
): Promise<Lenses> {
  const issueTree = buildIssueTreeLens(cards);
  const decisions = await buildDecisionsLens(org, cards);
  const risks = await buildRisksLens(cards);

  return { issueTree, decisions, risks };
}

// ---------------------------------------------------------------------------
// Lens 1: Issue Tree (code only)
// ---------------------------------------------------------------------------

function buildIssueTreeLens(cards: AnalysisCard[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const card of cards) {
    const key = `${card.branchId}/${card.subIssueId}`;
    (grouped[key] ??= []).push(card.cardId);
  }
  return grouped;
}

// ---------------------------------------------------------------------------
// Lens 2: Decisions (LLM)
// ---------------------------------------------------------------------------

interface DecisionMapping {
  decision: string;
  cardIds: string[];
  rationale: string;
}

async function buildDecisionsLens(
  org: BriefingOrgContext,
  cards: AnalysisCard[],
): Promise<Record<string, { cardIds: string[]; rationale: string }>> {
  if (!isLlmAvailable()) {
    return stubDecisionsLens(org, cards);
  }

  const decisionsList = org.orgDecisions.map((d) => `[${d.source}] ${d.decision}`).join("\n");
  const cardsList = cards
    .map((c) => `${c.cardId}: ${c.subIssueName} — ${c.kpis.map((k) => k.name).join(", ")}`)
    .join("\n");

  const result = await callLlm({
    systemPrompt: `You map analysis cards to business decisions. For each decision, select the 2–4 most relevant cards and explain why in one sentence. Output JSON array.`,
    userPrompt: `Decisions:\n${decisionsList}\n\nAnalysis cards:\n${cardsList}\n\nOutput JSON:\n[{ "decision": "...", "cardIds": ["subissue-1.1"], "rationale": "..." }]`,
    maxTokens: 2048,
  });

  if (result.source === "stub") {
    return stubDecisionsLens(org, cards);
  }

  try {
    const mappings = extractJson<DecisionMapping[]>(result.text);
    const lens: Record<string, { cardIds: string[]; rationale: string }> = {};
    for (const m of mappings) {
      lens[m.decision] = { cardIds: m.cardIds, rationale: m.rationale };
    }
    return lens;
  } catch {
    return stubDecisionsLens(org, cards);
  }
}

function stubDecisionsLens(
  org: BriefingOrgContext,
  cards: AnalysisCard[],
): Record<string, { cardIds: string[]; rationale: string }> {
  const lens: Record<string, { cardIds: string[]; rationale: string }> = {};
  for (const d of org.orgDecisions) {
    lens[d.decision] = {
      cardIds: cards.slice(0, 2).map((c) => c.cardId),
      rationale: "Stub mapping — re-run with LLM for real mapping.",
    };
  }
  return lens;
}

// ---------------------------------------------------------------------------
// Lens 3: Risks (LLM)
// ---------------------------------------------------------------------------

interface RiskEntry {
  cardId: string;
  riskLabel: string;
  dataPoint: string;
}

async function buildRisksLens(
  cards: AnalysisCard[],
): Promise<RiskEntry[]> {
  if (!isLlmAvailable()) {
    return stubRisksLens(cards);
  }

  const cardsList = cards
    .map((c) => JSON.stringify({ cardId: c.cardId, kpis: c.kpis, qualityNotes: c.qualityNotes }))
    .join("\n");

  const result = await callLlm({
    systemPrompt: `You identify risk-style observations from analysis cards. Look for: concentration, staleness, data quality issues, single points of failure, operational gaps. Cite card id and data point.
Output JSON array: [{ "cardId": "...", "riskLabel": "...", "dataPoint": "..." }]`,
    userPrompt: `Analysis cards:\n${cardsList}`,
    maxTokens: 2048,
  });

  if (result.source === "stub") {
    return stubRisksLens(cards);
  }

  try {
    return extractJson<RiskEntry[]>(result.text);
  } catch {
    return stubRisksLens(cards);
  }
}

function stubRisksLens(cards: AnalysisCard[]): RiskEntry[] {
  return cards
    .filter((c) => c.qualityNotes.length > 0)
    .map((c) => ({
      cardId: c.cardId,
      riskLabel: "Data quality concern (stub)",
      dataPoint: c.qualityNotes[0]?.message ?? "unknown",
    }));
}
