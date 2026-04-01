/**
 * Run summary for Pipeline Inspector home — reads `out/` artifacts (and E2E fallback paths).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveOutJsonPath } from "../../utils/resolve-out-artifact";
import type { FlagsFile } from "../../../types/pipeline-inspector";

function readOptionalJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

export default defineEventHandler(() => {
  const root = String(useRuntimeConfig().mvdRepoRoot || "");
  const v2Resolved = resolveOutJsonPath(root, "pipeline-v2-output.json");
  const step1cResolved = resolveOutJsonPath(root, "step-1c-data-quality.json");
  const flagsPrimary = join(root, "out", "flags.json");
  const flagsE2e = join(root, "out", "test-e2e-v2", "flags.json");

  const pipelineV2 = v2Resolved ? readOptionalJson<Record<string, unknown>>(v2Resolved.path) : null;
  const step1c = step1cResolved ? readOptionalJson<Record<string, unknown>>(step1cResolved.path) : null;

  let flags: FlagsFile | null = null;
  if (existsSync(flagsPrimary)) flags = readOptionalJson<FlagsFile>(flagsPrimary);
  else if (existsSync(flagsE2e)) flags = readOptionalJson<FlagsFile>(flagsE2e);

  const users = Array.isArray(pipelineV2?.users)
    ? (pipelineV2!.users as { userId: string; cards?: unknown[] }[])
    : [];

  const perUser = users.map((u) => {
    const cards = u.cards ?? [];
    const sufficient = cards.filter(
      (c) => (c as { dataSufficiency?: string }).dataSufficiency === "sufficient",
    );
    const insufficient = cards.filter(
      (c) => (c as { dataSufficiency?: string }).dataSufficiency === "insufficient",
    );
    const versionA = sufficient.filter((c) => (c as { cardVersion?: string }).cardVersion === "A");
    return {
      userId: u.userId,
      sufficientCardsA: versionA.length,
      insufficientCards: insufficient.length,
      totalCards: cards.length,
    };
  });

  const dqSummary = step1c?.summary as
    | { filesChecked?: number; passed?: number; warnings?: number; failures?: number }
    | undefined;

  return {
    repoRoot: root,
    artifactHints: {
      pipelineV2: v2Resolved?.label ?? null,
      step1c: step1cResolved?.label ?? null,
    },
    runId: typeof pipelineV2?.runId === "string" ? pipelineV2.runId : null,
    generatedAt: typeof pipelineV2?.generatedAt === "string" ? pipelineV2.generatedAt : null,
    triggerCount: Array.isArray(pipelineV2?.triggeredDecisionRecommendations)
      ? (pipelineV2!.triggeredDecisionRecommendations as unknown[]).length
      : 0,
    dataQuality: dqSummary
      ? {
          filesChecked: dqSummary.filesChecked ?? 0,
          passed: dqSummary.passed ?? 0,
          warnings: dqSummary.warnings ?? 0,
          failures: dqSummary.failures ?? 0,
        }
      : null,
    users: perUser,
    flagCount: flags?.flags?.length ?? 0,
  };
});
