/**
 * Stage 2: Issue tree instantiation.
 * Takes the universal template, assigns ownership from org context,
 * and assesses data coverage from Stage 1 summaries.
 *
 * The LLM column→sub-issue mapping call is deferred (TODO: Step 5).
 * For now, coverage is set to "gap" by default and will be populated
 * once analysis cards are generated.
 *
 * Spec: decisions/Pipeline-Spec-Briefing-Cards-Takeaways.md — STAGE 2
 */
import { TREE_TEMPLATE, DEFAULT_OWNERSHIP, FORMULA_LABEL } from "./tree-template.js";
import type {
  BriefingOrgContext,
  SourceSummary,
  IssueTree,
  Branch,
  BranchOwner,
  Coverage,
} from "./types.js";

export function instantiateIssueTree(
  org: BriefingOrgContext,
  _sourceSummaries: SourceSummary[],
): IssueTree {
  const branches: Branch[] = TREE_TEMPLATE.map((tmpl) => ({
    branchId: tmpl.branchId,
    branchIndex: tmpl.branchIndex,
    label: tmpl.label,
    owner: assignOwner(tmpl.branchId, org),
    subIssues: tmpl.subIssues.map((si) => ({
      subIssueId: si.subIssueId,
      name: si.name,
      question: si.question,
      coverage: "gap" as Coverage,
    })),
  }));

  return {
    rootIssue: org.rootIssue,
    summaryStats: {},
    formulaLabel: FORMULA_LABEL,
    branches,
  };
}

/**
 * Assign branch owner from org contributors using DEFAULT_OWNERSHIP role matching.
 * Falls back to the highest-ranked contributor if no role match.
 */
function assignOwner(branchId: string, org: BriefingOrgContext): BranchOwner {
  const rolePatterns = DEFAULT_OWNERSHIP[branchId] ?? [];

  for (const pattern of rolePatterns) {
    const match = org.contributors.find(
      (c) => c.role.toLowerCase().includes(pattern.toLowerCase()),
    );
    if (match) {
      return {
        userId: match.userId,
        displayName: match.displayName,
        role: match.role,
        ownerSuggested: true,
      };
    }
  }

  // Fallback: highest roleRank
  const fallback = [...org.contributors].sort((a, b) => b.roleRank - a.roleRank)[0]!;
  return {
    userId: fallback.userId,
    displayName: fallback.displayName,
    role: fallback.role,
    ownerSuggested: true,
  };
}

/**
 * After Stage 3 analysis cards are produced, update coverage on the tree.
 * Called during Stage 6 assembly.
 */
export function updateCoverage(
  tree: IssueTree,
  analysedSubIssueIds: Set<string>,
  partialSubIssueIds: Set<string>,
): IssueTree {
  return {
    ...tree,
    branches: tree.branches.map((b) => ({
      ...b,
      subIssues: b.subIssues.map((si) => ({
        ...si,
        coverage: analysedSubIssueIds.has(si.subIssueId)
          ? partialSubIssueIds.has(si.subIssueId)
            ? "partial"
            : "measured"
          : "gap",
      })),
    })),
  };
}
