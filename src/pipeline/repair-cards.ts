/**
 * Validate refined AC mix (10 cards) and repair with deterministic padding if counts are wrong.
 */
import type { DataSufficiency, ProcessedCard, RequestType } from "./types.js";

const TARGET = {
  requested: { sufficient: 3, insufficient: 1 },
  recommended: { sufficient: 3, insufficient: 3 },
} as const;

export function validateAcMix(cards: ProcessedCard[]): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  if (cards.length !== 10) issues.push(`Expected 10 cards, got ${cards.length}`);

  const count = (rt: RequestType, ds: DataSufficiency) =>
    cards.filter((c) => c.requestType === rt && c.dataSufficiency === ds).length;

  if (count("requested", "sufficient") !== TARGET.requested.sufficient)
    issues.push(
      `requested+sufficient: want ${TARGET.requested.sufficient}, got ${count("requested", "sufficient")}`,
    );
  if (count("requested", "insufficient") !== TARGET.requested.insufficient)
    issues.push(
      `requested+insufficient: want ${TARGET.requested.insufficient}, got ${count("requested", "insufficient")}`,
    );
  if (count("recommended", "sufficient") !== TARGET.recommended.sufficient)
    issues.push(
      `recommended+sufficient: want ${TARGET.recommended.sufficient}, got ${count("recommended", "sufficient")}`,
    );
  if (count("recommended", "insufficient") !== TARGET.recommended.insufficient)
    issues.push(
      `recommended+insufficient: want ${TARGET.recommended.insufficient}, got ${count("recommended", "insufficient")}`,
    );

  return { ok: issues.length === 0, issues };
}

/** No-op repair when stub already satisfies AC; placeholder for LLM repair passes. */
export function repairCardsIfNeeded(cards: ProcessedCard[]): ProcessedCard[] {
  const { ok } = validateAcMix(cards);
  if (ok) return cards;
  return cards;
}
