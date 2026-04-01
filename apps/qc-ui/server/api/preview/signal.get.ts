/**
 * Preview signal endpoint — pipeline v2 RAG only (`pipeline-v2-output.json`).
 * Resolves `out/pipeline-v2-output.json`, then `out/test-e2e-v2/pipeline-v2-output.json`.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SignalPreviewPayload } from "../../../types/signal-preview";
import {
  payloadFromPipelineV2File,
  type PipelineV2File,
} from "../../utils/map-pipeline-v2-to-preview";

function readJsonFile<T>(path: string, label: string): T {
  try {
    const raw = readFileSync(path, "utf8");
    return JSON.parse(raw) as T;
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    throw createError({
      statusCode: 500,
      statusMessage: `Could not read or parse ${label}: ${detail}`,
    });
  }
}

function resolvePipelineV2Path(root: string): { path: string; label: string } | null {
  const primary = join(root, "out", "pipeline-v2-output.json");
  if (existsSync(primary)) return { path: primary, label: "out/pipeline-v2-output.json" };
  const e2e = join(root, "out", "test-e2e-v2", "pipeline-v2-output.json");
  if (existsSync(e2e)) return { path: e2e, label: "out/test-e2e-v2/pipeline-v2-output.json" };
  return null;
}

export default defineEventHandler((event): SignalPreviewPayload => {
  const config = useRuntimeConfig();
  const root = String(config.mvdRepoRoot || "");
  const q = getQuery(event);
  const userId = String(q.userId ?? "surge").toLowerCase();
  const cardIndex = Math.max(0, Number(q.card ?? 0) || 0);

  const resolved = resolvePipelineV2Path(root);
  if (!resolved) {
    throw createError({
      statusCode: 404,
      statusMessage:
        "Pipeline v2 output not found. Run: npm run test -- src/pipeline/stages/run-pipeline-v2.test.ts (writes out/test-e2e-v2/) or copy pipeline-v2-output.json to out/.",
    });
  }
  const data = readJsonFile<PipelineV2File>(resolved.path, resolved.label);
  const payload = payloadFromPipelineV2File(data, resolved.label, userId, cardIndex);
  if (payload) return payload;
  throw createError({
    statusCode: 404,
    statusMessage: `No v2 cards for user "${userId}" in ${resolved.label}.`,
  });
});
