/**
 * BI stage: deterministic KPI replays + provenance for downstream cards.
 *
 * E13 (shared org): replays are computed once per pipeline run and reused for every user.
 * The same `kpiId` must not show different numeric facts or provenance between Surge and Sam;
 * onboarding-driven copy may still differ by `displayName` in narrative fields.
 */
import {
  replayLeadsTotalCount,
} from "../kpi/rules.js";
import type { ProvenanceBundle } from "../types/contracts.js";
import type { UserKpiContext } from "./types.js";

export function buildUserKpiContexts(
  userIds: string[],
  displayNames: Map<string, string>,
): UserKpiContext[] {
  const replay = replayLeadsTotalCount();
  const prov = toProvenance(replay);
  return userIds.map((userId) => ({
    userId,
    displayName: displayNames.get(userId) ?? userId,
    leadsTotal: replay.value,
    leadsProvenance: prov,
  }));
}

function toProvenance(replay: ReturnType<typeof replayLeadsTotalCount>): ProvenanceBundle {
  const tr = { start: "2025-09-01", end: "2025-09-30", label: "Sep 2025" };
  return {
    sourceId: replay.sourceId,
    sourcePath: replay.sourcePath,
    timeRange: tr,
    ruleId: replay.ruleId,
    formulaDescription: replay.formulaDescription,
    sampleRows: replay.sampleRows,
  };
}
