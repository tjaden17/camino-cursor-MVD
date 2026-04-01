/**
 * Full v2 card deck for one user and synthesis version (QC card review — scroll all cards).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SignalPreviewPayload } from "../../../types/signal-preview";
import {
  mapV2CardToPreview,
  type PipelineV2File,
} from "../../utils/map-pipeline-v2-to-preview";

function readJsonFile<T>(path: string, label: string): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
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

export default defineEventHandler((event) => {
  const config = useRuntimeConfig();
  const root = String(config.mvdRepoRoot || "");
  const q = getQuery(event);
  const userId = String(q.userId ?? "surge").toLowerCase();
  const version = String(q.version ?? "A").toUpperCase() === "B" ? "B" : "A";

  const resolved = resolvePipelineV2Path(root);
  if (!resolved) {
    throw createError({
      statusCode: 404,
      statusMessage:
        "Pipeline v2 output not found. Run the v2 pipeline test or place pipeline-v2-output.json under out/.",
    });
  }

  const data = readJsonFile<PipelineV2File & { runId?: string }>(resolved.path, resolved.label);
  const u = data.users.find((x) => x.userId.toLowerCase() === userId) ?? data.users[0];
  const rawCards = u?.cards ?? [];
  if (rawCards.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `No v2 cards for user "${userId}".`,
    });
  }

  const ordered: SignalPreviewPayload[] = [];
  for (const card of rawCards) {
    const sufficiency = String((card as { dataSufficiency?: string }).dataSufficiency ?? "");
    const cv = (card as { cardVersion?: string }).cardVersion ?? "A";
    if (sufficiency === "sufficient" && cv !== version) continue;
    ordered.push(
      mapV2CardToPreview(card as Record<string, unknown>, resolved.label, userId, 0, 0),
    );
  }
  const n = ordered.length;
  const withCount = ordered.map((p, i) => ({ ...p, cardIndex: i, cardCount: n }));

  return {
    source: resolved.label,
    userId,
    cardVersion: version,
    runId: data.runId ?? null,
    cards: withCount,
  };
});
