import { existsSync } from "node:fs";
import { join } from "node:path";
import { KPI_DICTIONARY } from "../../../../../src/kpi/rules.js";
import type { ProcessedSignalsFile } from "../../../../../src/pipeline/types.js";
import { readJsonOrThrow } from "../../utils/json-read.js";

export default defineEventHandler(() => {
  const config = useRuntimeConfig();
  const root = String(config.mvdRepoRoot || "");
  const processedPath = join(root, "out", "processed-signals.json");
  if (!existsSync(processedPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: "processed-signals.json not found. Run pipeline first.",
    });
  }
  const processed = readJsonOrThrow<ProcessedSignalsFile>(processedPath, "processed-signals.json");
  const inDeck = new Set(processed.users.flatMap((u) => u.cards.map((c) => c.kpiId)));
  const cardCountByKpi = new Map<string, number>();
  for (const u of processed.users) {
    for (const c of u.cards) {
      cardCountByKpi.set(c.kpiId, (cardCountByKpi.get(c.kpiId) ?? 0) + 1);
    }
  }

  const previewIndexByKpi = new Map<string, number>();
  const surge = processed.users.find((u) => u.userId === "surge") ?? processed.users[0];
  for (let i = 0; i < (surge?.cards.length ?? 0); i += 1) {
    const k = surge?.cards[i]?.kpiId;
    if (!k) continue;
    if (!previewIndexByKpi.has(k)) previewIndexByKpi.set(k, i);
  }

  return {
    source: "src/kpi/rules.ts + out/processed-signals.json",
    sharedOrgAssumption: true,
    entries: KPI_DICTIONARY.filter((e) => inDeck.has(e.kpiId)).map((e) => ({
      ...e,
      traceability: {
        kpiId: e.kpiId,
        cardCountInDeck: cardCountByKpi.get(e.kpiId) ?? 0,
        previewPath: `/preview/signal`,
        previewUserId: surge?.userId ?? "surge",
        previewCardIndex: previewIndexByKpi.get(e.kpiId) ?? 0,
      },
    })),
  };
});
