/**
 * Per-user slice of the strategy catalogue for mirrors under `data/onboarding/*-strategy-mirror.json`.
 */
import type { StrategyCatalogueFile } from "./strategy-types.js";

export interface UserStrategyMirrorFile {
  kind: "user_strategy_mirror";
  version: 1;
  userId: string;
  runId: string;
  orgId: string;
  orgName: string;
  generatedAt: string;
  kpis: StrategyCatalogueFile["kpis"];
  decisions: StrategyCatalogueFile["decisions"];
  sampleCalcsRequested: StrategyCatalogueFile["sampleCalcsRequested"];
  sampleCalcsRecommended: StrategyCatalogueFile["sampleCalcsRecommended"];
}

export function buildUserStrategyMirror(
  catalogue: StrategyCatalogueFile,
  userId: string,
): UserStrategyMirrorFile {
  const uid = userId.toLowerCase();
  return {
    kind: "user_strategy_mirror",
    version: 1,
    userId: uid,
    runId: catalogue.runId,
    orgId: catalogue.orgId,
    orgName: catalogue.orgName,
    generatedAt: catalogue.generatedAt,
    kpis: catalogue.kpis.filter((k) => k.userId.toLowerCase() === uid),
    decisions: catalogue.decisions.filter((d) => d.userId.toLowerCase() === uid),
    sampleCalcsRequested: catalogue.sampleCalcsRequested,
    sampleCalcsRecommended: catalogue.sampleCalcsRecommended,
  };
}
