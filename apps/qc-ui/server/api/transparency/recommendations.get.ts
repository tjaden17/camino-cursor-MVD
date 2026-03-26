import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildRecommendationTransparency } from "../../../../../src/transparency/recommendations.js";
import { readJsonOrThrow } from "../../utils/json-read.js";

interface AgentSignalsFile {
  users: Array<{
    userId: string;
    requestedKpis: string[];
    recommendedKpis: string[];
    selectionRationale: string;
  }>;
}

interface OnboardingProfile {
  user?: { user_id?: string; name?: string; role?: string };
  decision_context?: { primary_goals?: string[] };
}

export default defineEventHandler(() => {
  const config = useRuntimeConfig();
  const root = String(config.mvdRepoRoot || "");
  const agentPath = join(root, "out", "agent-signals.json");
  if (!existsSync(agentPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: "agent-signals.json not found. Run pipeline first.",
    });
  }
  const agent = readJsonOrThrow<AgentSignalsFile>(agentPath, "agent-signals.json");

  const profiles = agent.users.map((u) => {
    const p = loadProfile(root, u.userId);
    return {
      userId: u.userId,
      name: p?.user?.name ?? u.userId,
      role: p?.user?.role ?? "Unknown",
      primaryGoals: p?.decision_context?.primary_goals ?? [],
    };
  });

  return {
    source: "out/agent-signals.json + data/onboarding/*-onboarding-derived.json",
    ...buildRecommendationTransparency({ agentUsers: agent.users, profiles }),
  };
});

function loadProfile(root: string, userId: string): OnboardingProfile | null {
  const candidates = [
    join(root, "data", "onboarding", `${userId}-onboarding-derived.json`),
    join(root, "data", "user-onboarding", `${userId}-onboarding-derived.json`),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readJsonOrThrow<OnboardingProfile>(p, `${userId}-onboarding-derived.json`);
  }
  return null;
}
