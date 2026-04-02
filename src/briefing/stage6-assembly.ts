/**
 * Stage 6: Output assembly.
 * Merges all pipeline artifacts into the single org-level output JSON.
 * Generates observations[] and tags[] for the Issue Tree View.
 * Generates summaryCategory for branch takeaways.
 * Assigns user views from role-based defaults.
 *
 * Spec: decisions/Pipeline-Spec-Briefing-Cards-Takeaways.md — STAGE 6
 */
import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getRepoRoot } from "../repo-root.js";
import { updateCoverage } from "./stage2-issue-tree.js";
import type {
  BriefingOrgContext,
  IssueTree,
  AnalysisCard,
  BranchTakeaway,
  Lenses,
  BriefingOutput,
  Tag,
  QcFailure,
  QcFailureReport,
  SourceSummary,
} from "./types.js";

export interface AssemblyInput {
  org: BriefingOrgContext;
  issueTree: IssueTree;
  analysisCards: AnalysisCard[];
  branchTakeaways: BranchTakeaway[];
  lenses: Lenses;
  sourceSummaries: SourceSummary[];
  qcFailures: QcFailure[];
}

export function assembleOutput(input: AssemblyInput): BriefingOutput {
  const runId = generateRunId();

  // Enrich cards with observations and tags for the Issue Tree View
  const enrichedCards = input.analysisCards.map((card) => enrichCard(card));

  // Assign summaryCategory to takeaways based on Risks lens
  const riskBranches = new Set(input.lenses.risks.map((r) => {
    const card = input.analysisCards.find((c) => c.cardId === r.cardId);
    return card?.branchId;
  }));
  const enrichedTakeaways = input.branchTakeaways.map((t) => ({
    ...t,
    summaryCategory: riskBranches.has(t.branchId)
      ? ("risk" as const)
      : t.summaryCategory,
  }));

  // Update coverage on the issue tree based on actual analysis
  const analysedIds = new Set(enrichedCards.map((c) => c.subIssueId));
  const partialIds = new Set(
    enrichedCards
      .filter((c) => c.kpis.some((k) => k.status === "partial" || k.status === "gap"))
      .map((c) => c.subIssueId),
  );
  const finalTree = updateCoverage(input.issueTree, analysedIds, partialIds);

  // Compute summary stats from analysis cards
  finalTree.summaryStats = computeSummaryStats(enrichedCards);

  // User views
  const userViews = buildUserViews(input.org);

  // Spec content hash
  const specVersion = computeSpecHash();

  // Data quality summary
  const dataQuality = buildDataQualitySummary(input.sourceSummaries);

  return {
    runId,
    generatedAt: new Date().toISOString(),
    specRef: {
      document: "decisions/Pipeline-Spec-Briefing-Cards-Takeaways.md",
      version: specVersion,
    },
    orgId: input.org.orgId,
    orgName: input.org.orgName,
    contributors: input.org.contributors.map((c) => ({
      userId: c.userId,
      role: c.role,
      displayName: c.displayName,
    })),
    issueTree: finalTree,
    analysisCards: enrichedCards,
    branchTakeaways: enrichedTakeaways,
    lenses: input.lenses,
    userViews,
    dataQuality,
  };
}

/**
 * Write all run artifacts to out/briefing-runs/{runId}/.
 */
export function writeRunArtifacts(
  output: BriefingOutput,
  input: AssemblyInput,
): string {
  const repoRoot = getRepoRoot();
  const runDir = resolve(repoRoot, "out", "briefing-runs", output.runId);
  mkdirSync(runDir, { recursive: true });

  // Write a copy to a well-known path so HTML screens can load it
  const latestPath = resolve(repoRoot, "out", "briefing-latest.json");
  writeFileSync(latestPath, JSON.stringify(output, null, 2));

  // Main output
  writeFileSync(resolve(runDir, "output.json"), JSON.stringify(output, null, 2));

  // Manifest
  writeFileSync(
    resolve(runDir, "manifest.json"),
    JSON.stringify(
      {
        runId: output.runId,
        generatedAt: output.generatedAt,
        specRef: output.specRef,
        orgId: output.orgId,
      },
      null,
      2,
    ),
  );

  // Stage 1 summaries
  writeFileSync(
    resolve(runDir, "stage-1-summaries.json"),
    JSON.stringify(input.sourceSummaries, null, 2),
  );

  // Stage 2 issue tree
  writeFileSync(
    resolve(runDir, "stage-2-issue-tree.json"),
    JSON.stringify(input.issueTree, null, 2),
  );

  // Stage 3 analysis cards (one per file + combined)
  const analysisDir = resolve(runDir, "stage-3-analysis");
  mkdirSync(analysisDir, { recursive: true });
  for (const card of output.analysisCards) {
    writeFileSync(
      resolve(analysisDir, `${card.cardId}.json`),
      JSON.stringify(card, null, 2),
    );
  }

  // Stage 4 takeaways
  writeFileSync(
    resolve(runDir, "stage-4-takeaways.json"),
    JSON.stringify(output.branchTakeaways, null, 2),
  );

  // QC failures
  const qcReport: QcFailureReport = {
    runId: output.runId,
    generatedAt: output.generatedAt,
    failures: input.qcFailures,
  };
  writeFileSync(
    resolve(runDir, "qc-failures.json"),
    JSON.stringify(qcReport, null, 2),
  );

  return runDir;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function generateRunId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8);
  return `run-${date}-${rand}`;
}

/**
 * Derive observations[] and tags[] from a card's KPIs and quality notes.
 * observations: plain-language summaries (always visible in Issue Tree View).
 * tags: typed labels derived from status + quality notes (togglable overlay).
 */
function enrichCard(card: AnalysisCard): AnalysisCard {
  if (card.observations.length > 0) return card;

  const observations = card.kpis.map((kpi) => {
    const period = kpi.timePeriod !== "N/A" ? ` (${kpi.timePeriod})` : "";
    return `${kpi.name}: ${kpi.value}${period}`;
  });

  const tags: Tag[] = [];
  for (const kpi of card.kpis) {
    if (kpi.status === "measured") {
      tags.push({ type: "data", label: `${kpi.name}: ${kpi.value}` });
    } else if (kpi.status === "partial") {
      tags.push({ type: "gap", label: `${kpi.name} — partial data` });
    } else {
      tags.push({ type: "gap", label: `${kpi.name} — data gap` });
    }
  }
  for (const note of card.qualityNotes) {
    tags.push({ type: "risk", label: note.message });
  }

  return { ...card, observations, tags };
}

function computeSummaryStats(cards: AnalysisCard[]): Record<string, string> {
  const stats: Record<string, string> = {};

  // Try to extract revenue from closing/deal cards
  for (const card of cards) {
    for (const kpi of card.kpis) {
      const name = kpi.name.toLowerCase();
      if (name.includes("revenue") && name.includes("won")) {
        stats.totalRevenueWon = kpi.value;
      }
      if (name.includes("pipeline") && name.includes("open")) {
        stats.openPipeline = kpi.value;
      }
    }
  }

  return stats;
}

function computeSpecHash(): string {
  try {
    const repoRoot = getRepoRoot();
    const specPath = resolve(repoRoot, "decisions", "Pipeline-Spec-Briefing-Cards-Takeaways.md");
    const content = readFileSync(specPath, "utf-8");
    return createHash("sha256").update(content).digest("hex").slice(0, 12);
  } catch {
    return "unknown";
  }
}

function buildUserViews(
  org: BriefingOrgContext,
): Record<string, { relevantBranches: string[]; defaultLens: string }> {
  const views: Record<string, { relevantBranches: string[]; defaultLens: string }> = {};
  for (const c of org.contributors) {
    const role = c.role.toLowerCase();
    if (role.includes("ceo") || role.includes("founder") || role.includes("exec")) {
      views[c.userId] = {
        relevantBranches: ["volume", "value", "capacity"],
        defaultLens: "issueTree",
      };
    } else if (role.includes("success") || role.includes("csm") || role.includes("support")) {
      views[c.userId] = {
        relevantBranches: ["retention", "value"],
        defaultLens: "issueTree",
      };
    } else {
      views[c.userId] = {
        relevantBranches: ["volume", "value", "retention", "capacity"],
        defaultLens: "issueTree",
      };
    }
  }
  return views;
}

function buildDataQualitySummary(
  summaries: SourceSummary[],
): Record<string, unknown> {
  return {
    sources: summaries.map((s) => ({
      sourceId: s.sourceId,
      rowCount: s.rowCount,
      columnCount: s.columnCount,
      warnings: s.qualityNotes.length,
    })),
    totalWarnings: summaries.reduce((sum, s) => sum + s.qualityNotes.length, 0),
  };
}
