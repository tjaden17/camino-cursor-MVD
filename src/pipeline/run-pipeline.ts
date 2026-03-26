/**
 * Orchestrates MVD pipeline stages and writes `out/*.json` artifacts (fail-fast).
 */
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { getRepoRoot } from "../repo-root.js";
import { emptyDiagnostics, writeDiagnostics } from "./diagnostics.js";
import { loadAndValidateProfiles } from "./load-onboarding.js";
import { buildUserKpiContexts } from "./bi-stage.js";
import { runLlmStages } from "./llm.js";
import {
  appendStage,
  createInitialRun,
  finalizeRun,
  manifestPath,
  mkdirOut,
  writeManifest,
} from "./run-manifest.js";
import { repairCardsIfNeeded, validateAcMix } from "./repair-cards.js";
import type { AgentSignalsFile, PipelineRunFile, ProcessedSignalsFile } from "./types.js";

export interface RunPipelineOptions {
  /** Default: `data/onboarding` under repo root */
  onboardingDir?: string;
  /** Default: `out` under repo root */
  outDir?: string;
  skipLlm: boolean;
  noCache: boolean;
}

export async function runPipeline(
  opts: RunPipelineOptions,
): Promise<{ ok: boolean; outDir: string }> {
  const repoRoot = getRepoRoot();
  const onboardingDir = opts.onboardingDir ?? join(repoRoot, "data", "onboarding");
  const outDir = opts.outDir ?? join(repoRoot, "out");
  mkdirOut(outDir);

  const runId = randomUUID();
  const profiles = loadAndValidateProfiles(onboardingDir);
  const onboardingFiles = profiles.map((p) => p.path);

  const run: PipelineRunFile = createInitialRun({
    runId,
    onboardingDir,
    onboardingFiles,
    skipLlm: opts.skipLlm,
    noCache: opts.noCache,
  });

  const diag = emptyDiagnostics();

  try {
    // Normalize
    diag.normalization.push({ message: `Loaded ${profiles.length} onboarding profile(s).` });
    appendStage(run, {
      id: "normalize",
      status: "ok",
      startedAt: run.startedAt,
      finishedAt: new Date().toISOString(),
    });
    writeManifest(manifestPath(outDir), run);
    writeDiagnostics(outDir, diag);

    // Quality
    for (const p of profiles) {
      const raw = p.raw as { gaps_and_assumptions?: unknown };
      if (raw.gaps_and_assumptions == null) {
        diag.quality.push({
          severity: "warn",
          message: `gaps_and_assumptions missing in ${p.path}`,
        });
      }
    }
    appendStage(run, {
      id: "quality",
      status: "ok",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    });
    writeManifest(manifestPath(outDir), run);
    writeDiagnostics(outDir, diag);

    // BI
    const displayNames = new Map(
      profiles.map((p) => [
        p.userId,
        ((p.raw as { user?: { name?: string } }).user?.name ?? p.userId) as string,
      ]),
    );
    const contexts = buildUserKpiContexts(
      profiles.map((p) => p.userId),
      displayNames,
    );
    diag.bi.push({
      message: `Replayed leads total: ${contexts[0]?.leadsTotal ?? "n/a"} (shared extract).`,
    });
    appendStage(run, {
      id: "bi",
      status: "ok",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    });
    writeManifest(manifestPath(outDir), run);
    writeDiagnostics(outDir, diag);

    const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022";
    const llm = await runLlmStages({
      repoRoot,
      profiles,
      contexts,
      skipLlm: opts.skipLlm,
      noCache: opts.noCache,
      model,
    });

    appendStage(run, {
      id: "claude_selection",
      status: "ok",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      model: opts.skipLlm || !process.env.ANTHROPIC_API_KEY ? undefined : model,
    });
    writeManifest(manifestPath(outDir), run);

    appendStage(run, {
      id: "claude_narrative",
      status: "ok",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      model: opts.skipLlm || !process.env.ANTHROPIC_API_KEY ? undefined : model,
    });
    writeManifest(manifestPath(outDir), run);

    const processedUsers = contexts.map((ctx) => {
      const cards = repairCardsIfNeeded(llm.cardsByUser.get(ctx.userId) ?? []);
      const v = validateAcMix(cards);
      if (!v.ok)
        diag.quality.push({
          severity: "warn",
          message: "AC mix validation",
          detail: v.issues.join("; "),
        });
      return { userId: ctx.userId, cards };
    });

    appendStage(run, {
      id: "repair",
      status: "ok",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    });
    writeManifest(manifestPath(outDir), run);

    const agentFile: AgentSignalsFile = {
      generatedAt: new Date().toISOString(),
      users: llm.agentUsers,
    };
    writeFileSync(join(outDir, "agent-signals.json"), JSON.stringify(agentFile, null, 2), "utf8");

    const processedFile: ProcessedSignalsFile = {
      generatedAt: new Date().toISOString(),
      users: processedUsers,
    };
    writeFileSync(
      join(outDir, "processed-signals.json"),
      JSON.stringify(processedFile, null, 2),
      "utf8",
    );

    appendStage(run, {
      id: "write_artifacts",
      status: "ok",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    });
    finalizeRun(run, true);
    writeManifest(manifestPath(outDir), run);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    appendStage(run, {
      id: "write_artifacts",
      status: "failed",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      error: msg,
    });
    finalizeRun(run, false);
    writeManifest(manifestPath(outDir), run);
    throw e;
  }

  return { ok: true, outDir };
}
