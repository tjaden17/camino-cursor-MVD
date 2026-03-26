/**
 * Read/write `out/pipeline-run.json` — single structured manifest updated after each stage.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PipelineRunFile, StageRecord } from "./types.js";

export function readManifest(path: string): PipelineRunFile | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as PipelineRunFile;
  } catch {
    return null;
  }
}

export function writeManifest(path: string, run: PipelineRunFile): void {
  writeFileSync(path, JSON.stringify(run, null, 2), "utf8");
}

export function mkdirOut(outDir: string): void {
  mkdirSync(outDir, { recursive: true });
}

export function createInitialRun(params: {
  runId: string;
  onboardingDir: string;
  onboardingFiles: string[];
  skipLlm: boolean;
  noCache: boolean;
}): PipelineRunFile {
  return {
    runId: params.runId,
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    inputs: {
      onboardingDir: params.onboardingDir,
      onboardingFiles: params.onboardingFiles,
      skipLlm: params.skipLlm,
      noCache: params.noCache,
    },
    stages: [],
  };
}

export function appendStage(run: PipelineRunFile, stage: StageRecord): void {
  run.stages.push(stage);
}

export function finalizeRun(run: PipelineRunFile, ok: boolean): void {
  run.status = ok ? "completed" : "failed";
  run.finishedAt = new Date().toISOString();
}

export function manifestPath(outDir: string): string {
  return join(outDir, "pipeline-run.json");
}
