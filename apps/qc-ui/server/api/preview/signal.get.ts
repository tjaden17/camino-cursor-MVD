/**
 * Preview signal endpoint for the QC UI.
 * Prefers pipeline artifacts (`out/processed-signals.json`) when available,
 * and falls back to hand-authored fixtures for early UI testing.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface ProcessedSignalsFile {
  users: Array<{
    userId: string;
    cards: Array<{
      requestType?: string;
      dataSufficiency?: string;
      recommendationRationale?: string;
      overview: Record<string, unknown>;
      expanded?: Record<string, unknown>;
      insufficient?: Record<string, unknown>;
    }>;
  }>;
}

interface Payload {
  source: string;
  userId: string;
  cardIndex: number;
  cardCount: number;
  requestType?: string;
  dataSufficiency?: string;
  recommendationRationale?: string;
  overview: Record<string, unknown>;
  expanded?: Record<string, unknown>;
  insufficient?: Record<string, unknown>;
}

export default defineEventHandler((event): Payload => {
  const config = useRuntimeConfig();
  const root = String(config.mvdRepoRoot || "");
  const q = getQuery(event);
  const userId = String(q.userId ?? "surge").toLowerCase();
  const cardIndex = Math.max(0, Number(q.card ?? 0) || 0);

  const processedPath = join(root, "out", "processed-signals.json");
  if (existsSync(processedPath)) {
    const data = JSON.parse(readFileSync(processedPath, "utf8")) as ProcessedSignalsFile;
    const u = data.users.find((x) => x.userId === userId) ?? data.users[0];
    const cards = u?.cards ?? [];
    const idx = Math.min(cardIndex, Math.max(0, cards.length - 1));
    const card = cards[idx];

    if (card) {
      return {
        source: "processed-signals.json",
        userId,
        cardIndex: idx,
        cardCount: cards.length,
        requestType: card.requestType,
        dataSufficiency: card.dataSufficiency,
        recommendationRationale: card.recommendationRationale,
        overview: card.overview,
        expanded: card.expanded,
        insufficient: card.insufficient,
      };
    }
  }

  // Fallback: single static card (no real multi-card UI in fixture mode).
  const path = join(root, "fixtures/samples/signal-card-user-preview.json");
  const fallback = JSON.parse(readFileSync(path, "utf8")) as {
    requestType?: string;
    dataSufficiency?: string;
    recommendationRationale?: string;
    overview: Record<string, unknown>;
    expanded?: Record<string, unknown>;
    insufficient?: Record<string, unknown>;
  };

  return {
    source: "fixture",
    userId,
    cardIndex: 0,
    cardCount: 1,
    requestType: fallback.requestType ?? "requested",
    dataSufficiency: fallback.dataSufficiency ?? "sufficient",
    recommendationRationale: fallback.recommendationRationale,
    overview: fallback.overview,
    expanded: fallback.expanded,
    insufficient: fallback.insufficient,
  };
});
