/**
 * Preview signal endpoint for the QC UI.
 * Prefers pipeline artifacts (`out/processed-signals.json`) when available,
 * then multi-card stub (`fixtures/samples/signal-preview-stub-users.json`) so
 * Prev/Next works without running the pipeline, then a single static fixture.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  ProcessedSignalsFile,
  SignalPreviewPayload,
} from "../../../types/signal-preview";

function payloadFromUsersFile(
  data: ProcessedSignalsFile,
  sourceLabel: string,
  userId: string,
  cardIndex: number,
): SignalPreviewPayload | null {
  const u = data.users.find((x) => x.userId === userId) ?? data.users[0];
  const cards = u?.cards ?? [];
  if (cards.length === 0) return null;
  const idx = Math.min(cardIndex, Math.max(0, cards.length - 1));
  const card = cards[idx];
  if (!card) return null;
  return {
    source: sourceLabel,
    userId,
    cardIndex: idx,
    cardCount: cards.length,
    requestType: card.requestType,
    dataSufficiency: card.dataSufficiency,
    narrativeSource: card.narrativeSource,
    recommendationRationale: card.recommendationRationale,
    overview: card.overview as SignalPreviewPayload["overview"],
    expanded: card.expanded as SignalPreviewPayload["expanded"],
    insufficient: card.insufficient as SignalPreviewPayload["insufficient"],
  };
}

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

export default defineEventHandler((event): SignalPreviewPayload => {
  const config = useRuntimeConfig();
  const root = String(config.mvdRepoRoot || "");
  const q = getQuery(event);
  const userId = String(q.userId ?? "surge").toLowerCase();
  const cardIndex = Math.max(0, Number(q.card ?? 0) || 0);

  const processedPath = join(root, "out", "processed-signals.json");
  if (existsSync(processedPath)) {
    const data = readJsonFile<ProcessedSignalsFile>(processedPath, "processed-signals.json");
    const payload = payloadFromUsersFile(data, "processed-signals.json", userId, cardIndex);
    if (payload) return payload;
  }

  const stubUsersPath = join(root, "fixtures", "samples", "signal-preview-stub-users.json");
  if (existsSync(stubUsersPath)) {
    const data = readJsonFile<ProcessedSignalsFile>(stubUsersPath, "signal-preview-stub-users.json");
    const payload = payloadFromUsersFile(
      data,
      "signal-preview-stub-users.json",
      userId,
      cardIndex,
    );
    if (payload) return payload;
  }

  const fallbackPath = join(root, "fixtures/samples/signal-card-user-preview.json");
  if (!existsSync(fallbackPath)) {
    throw createError({
      statusCode: 404,
      statusMessage:
        "Signal preview fixture not found. Expected fixtures/samples/signal-card-user-preview.json under the MVD repo root.",
    });
  }

  const fallback = readJsonFile<{
    requestType?: string;
    dataSufficiency?: string;
    recommendationRationale?: string;
    overview: SignalPreviewPayload["overview"];
    expanded?: SignalPreviewPayload["expanded"];
    insufficient?: SignalPreviewPayload["insufficient"];
  }>(fallbackPath, "signal-card-user-preview.json");

  return {
    source: "fixture (single card — add signal-preview-stub-users.json or run pipeline)",
    userId,
    cardIndex: 0,
    cardCount: 1,
    requestType: fallback.requestType ?? "requested",
    dataSufficiency: fallback.dataSufficiency ?? "sufficient",
    narrativeSource: fallback.narrativeSource ?? "fallback",
    recommendationRationale: fallback.recommendationRationale,
    overview: fallback.overview,
    expanded: fallback.expanded,
    insufficient: fallback.insufficient,
  };
});
