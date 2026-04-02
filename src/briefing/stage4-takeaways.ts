/**
 * Stage 4: Branch takeaway synthesis + LLM quality control.
 * One LLM call per branch to synthesise analysis cards into an executive takeaway.
 * One QC call per branch to review the takeaway.
 *
 * Spec: decisions/Pipeline-Spec-Briefing-Cards-Takeaways.md — STAGE 4
 */
import { callLlm, extractJson, isLlmAvailable } from "./llm.js";
import type {
  BriefingOrgContext,
  IssueTree,
  AnalysisCard,
  BranchTakeaway,
  QcFailure,
} from "./types.js";

interface RawTakeawayResponse {
  branch: string;
  title: string;
  text: string;
  reasoning: string[];
}

interface TakeawayQcResult {
  pass: boolean;
  issues: string[];
  alternativeHeadline?: string | null;
  recommendedEdits?: string | null;
}

export async function runTakeaways(
  org: BriefingOrgContext,
  issueTree: IssueTree,
  analysisCards: AnalysisCard[],
): Promise<{ takeaways: BranchTakeaway[]; failures: QcFailure[] }> {
  const takeaways: BranchTakeaway[] = [];
  const failures: QcFailure[] = [];

  for (const branch of issueTree.branches) {
    const branchCards = analysisCards.filter((c) => c.branchId === branch.branchId);

    const takeaway = await synthesiseTakeaway(org, branch, branchCards);
    takeaways.push(takeaway);

    // QC
    if (isLlmAvailable()) {
      const qcResult = await qcTakeaway(takeaway, branchCards);
      if (qcResult && !qcResult.pass) {
        takeaway.qcStatus = "needs_review";
        failures.push({
          stage: "4b",
          layer: "llm",
          branch: branch.branchId,
          type: "takeaway",
          pass: false,
          issues: qcResult.issues,
          alternativeHeadline: qcResult.alternativeHeadline,
          recommendedEdits: qcResult.recommendedEdits,
          originalContent: { title: takeaway.title, text: takeaway.text, reasoning: takeaway.reasoning },
        });
      }
    }
  }

  return { takeaways, failures };
}

async function synthesiseTakeaway(
  org: BriefingOrgContext,
  branch: IssueTree["branches"][number],
  branchCards: AnalysisCard[],
): Promise<BranchTakeaway> {
  if (!isLlmAvailable()) {
    return stubTakeaway(branch);
  }

  const decisions = org.orgDecisions.map((d) => `[${d.source}] ${d.decision}`).join("\n");
  const cardJson = branchCards.map((c) => JSON.stringify(c)).join("\n\n");

  const result = await callLlm({
    systemPrompt: `You are Camino, a signal intelligence assistant. You synthesise data observations into executive-level takeaways.

Rules:
- Read across ALL sub-issues in the branch.
- Write a KEY TAKEAWAY that synthesises the combined picture.
- 2–4 word title a CEO would remember.
- Body is 2–3 sentences. Every number must come from analysis cards.
- State time periods where relevant.
- Highlight the most consequential finding.
- If data gaps are the main story, say so.
- Do not judge good/bad — state facts.
- Write for a CEO scanning on their phone at 7am.
- Output valid JSON only.`,
    userPrompt: `Branch: ${branch.label} — "${branch.subIssues.map((s) => s.question).join("; ")}"
Owner: ${branch.owner.displayName} (${branch.owner.role})
Company: ${org.mergedCompanyContext.company}, ${org.mergedCompanyContext.stage}
Upcoming decisions:
${decisions}

Analysis cards for this branch:
${cardJson}

Output JSON:
{
  "branch": "${branch.branchId}",
  "title": "2-4 word title",
  "text": "2-3 sentence takeaway",
  "reasoning": ["bullet 1", "bullet 2", "..."]
}`,
    maxTokens: 2048,
  });

  if (result.source === "stub") {
    return stubTakeaway(branch);
  }

  const parsed = extractJson<RawTakeawayResponse>(result.text);

  return {
    branchId: branch.branchId,
    branchIndex: branch.branchIndex,
    branchLabel: branch.label,
    owner: { ...branch.owner },
    title: parsed.title,
    text: parsed.text,
    reasoning: parsed.reasoning ?? [],
    summaryCategory: "finding",
    qcStatus: "pass",
  };
}

async function qcTakeaway(
  takeaway: BranchTakeaway,
  branchCards: AnalysisCard[],
): Promise<TakeawayQcResult | null> {
  if (!isLlmAvailable()) return null;

  const result = await callLlm({
    systemPrompt: `You are a senior reviewer (management-consulting standard). Review this branch takeaway against the analysis cards.

Tasks:
1. Defensibility: Does every number in the takeaway appear in an analysis card?
2. Synthesis: Does the takeaway reflect multiple sub-issues, not one KPI?
3. Headline: Is this the most consequential finding? If not, suggest an alternative.
4. Confidence: If any sub-issue was PARTIAL/GAP, is that reflected?
5. Tone: No unwarranted good/bad judgement; facts only.

Output JSON: { "pass": true|false, "issues": [], "alternativeHeadline": null, "recommendedEdits": null }`,
    userPrompt: `Branch takeaway:
${JSON.stringify(takeaway, null, 2)}

Analysis cards:
${branchCards.map((c) => JSON.stringify(c)).join("\n")}`,
    maxTokens: 1024,
  });

  if (result.source === "stub") return null;

  try {
    return extractJson<TakeawayQcResult>(result.text);
  } catch {
    return null;
  }
}

function stubTakeaway(branch: IssueTree["branches"][number]): BranchTakeaway {
  return {
    branchId: branch.branchId,
    branchIndex: branch.branchIndex,
    branchLabel: branch.label,
    owner: { ...branch.owner },
    title: `Stub: ${branch.label}`,
    text: `Stub takeaway for ${branch.label} — re-run with ANTHROPIC_API_KEY for real synthesis.`,
    reasoning: ["LLM was skipped or API key not set."],
    summaryCategory: "finding",
    qcStatus: "pass",
  };
}
