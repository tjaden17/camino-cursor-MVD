/**
 * Pipeline orchestrator: chains Stages 0→1→2→3→3d→4→5→6.
 * Accepts an orgId, loads the org context, runs every stage, and writes output.
 *
 * Spec: decisions/Pipeline-Spec-Briefing-Cards-Takeaways.md
 */
import { loadBriefingOrgContext } from "./load-org-context.js";
import { ingestAllSources } from "./stage1-ingest.js";
import { instantiateIssueTree } from "./stage2-issue-tree.js";
import { runAnalysis } from "./stage3-analysis.js";
import { runAnalysisQc } from "./stage3d-qc.js";
import { runTakeaways } from "./stage4-takeaways.js";
import { organiseLenses } from "./stage5-lenses.js";
import { assembleOutput, writeRunArtifacts } from "./stage6-assembly.js";
import { getBriefingThrottleMs, setSkipLlm } from "./llm.js";
import type { QcFailure } from "./types.js";

export interface PipelineOptions {
  orgId: string;
  skipLlm?: boolean;
}

export interface PipelineResult {
  runId: string;
  runDir: string;
  cardCount: number;
  takeawayCount: number;
  qcFailureCount: number;
}

export async function runBriefingPipeline(opts: PipelineOptions): Promise<PipelineResult> {
  if (opts.skipLlm) {
    setSkipLlm(true);
  }

  if (!opts.skipLlm && getBriefingThrottleMs() > 0) {
    console.log(
      `[briefing] LLM throttle: ${getBriefingThrottleMs()}ms between API calls (BRIEFING_THROTTLE_MS)`,
    );
  }

  console.log(`\n[briefing] Loading org context for "${opts.orgId}"...`);
  const org = loadBriefingOrgContext(opts.orgId);
  console.log(`[briefing] Org: ${org.orgName}, ${org.contributors.length} contributors, ${org.dataInventory.length} data sources`);

  // Stage 1: File parsing + schema detection
  console.log(`[briefing] Stage 1: Ingesting ${org.dataInventory.length} data files...`);
  const sourceSummaries = ingestAllSources(org.dataInventory);
  for (const s of sourceSummaries) {
    console.log(`  → ${s.sourceId}: ${s.rowCount} rows, ${s.columnCount} cols, ${s.qualityNotes.length} warnings`);
  }

  // Stage 2: Issue tree instantiation
  console.log(`[briefing] Stage 2: Instantiating issue tree...`);
  const issueTree = instantiateIssueTree(org, sourceSummaries);
  const subIssueCount = issueTree.branches.reduce((n, b) => n + b.subIssues.length, 0);
  console.log(`  → ${issueTree.branches.length} branches, ${subIssueCount} sub-issues`);

  // Stage 3a: Per sub-issue analysis
  console.log(`[briefing] Stage 3a: Analysing ${subIssueCount} sub-issues...`);
  const analysisCards = await runAnalysis(org, sourceSummaries, issueTree);
  console.log(`  → ${analysisCards.length} analysis cards produced`);

  // Stage 3d: QC
  console.log(`[briefing] Stage 3d: Running QC on analysis cards...`);
  const analysisQcFailures = await runAnalysisQc(analysisCards, sourceSummaries);
  console.log(`  → ${analysisQcFailures.length} QC failures`);

  // Stage 4: Branch takeaways
  console.log(`[briefing] Stage 4: Synthesising branch takeaways...`);
  const { takeaways, failures: takeawayFailures } = await runTakeaways(org, issueTree, analysisCards);
  console.log(`  → ${takeaways.length} takeaways, ${takeawayFailures.length} QC failures`);

  // Stage 5: Lens organisation
  console.log(`[briefing] Stage 5: Organising lenses...`);
  const lenses = await organiseLenses(org, analysisCards);
  console.log(`  → Issue Tree: ${Object.keys(lenses.issueTree).length} groups, Decisions: ${Object.keys(lenses.decisions).length}, Risks: ${lenses.risks.length}`);

  // Stage 6: Assembly + artifacts
  console.log(`[briefing] Stage 6: Assembling output...`);
  const allQcFailures: QcFailure[] = [...analysisQcFailures, ...takeawayFailures];
  const output = assembleOutput({
    org,
    issueTree,
    analysisCards,
    branchTakeaways: takeaways,
    lenses,
    sourceSummaries,
    qcFailures: allQcFailures,
  });

  const runDir = writeRunArtifacts(output, {
    org,
    issueTree,
    analysisCards,
    branchTakeaways: takeaways,
    lenses,
    sourceSummaries,
    qcFailures: allQcFailures,
  });

  console.log(`\n[briefing] ✓ Pipeline complete`);
  console.log(`  Run ID:    ${output.runId}`);
  console.log(`  Output:    ${runDir}/output.json`);
  console.log(`  Cards:     ${output.analysisCards.length}`);
  console.log(`  Takeaways: ${output.branchTakeaways.length}`);
  console.log(`  QC issues: ${allQcFailures.length}\n`);

  return {
    runId: output.runId,
    runDir,
    cardCount: output.analysisCards.length,
    takeawayCount: output.branchTakeaways.length,
    qcFailureCount: allQcFailures.length,
  };
}
