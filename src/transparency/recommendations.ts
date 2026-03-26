export interface AgentUserSelection {
  userId: string;
  requestedKpis: string[];
  recommendedKpis: string[];
  selectionRationale: string;
}

export interface ProfileSummary {
  userId: string;
  name: string;
  role: string;
  primaryGoals: string[];
}

export interface RecommendationUserView {
  userId: string;
  profile: ProfileSummary;
  requestedKpis: string[];
  recommendedKpis: string[];
  selectionRationale: string;
  allKpis: string[];
  uniqueKpis: string[];
}

export interface RecommendationTransparency {
  sharedKpis: string[];
  users: RecommendationUserView[];
}

export function buildRecommendationTransparency(input: {
  agentUsers: AgentUserSelection[];
  profiles: ProfileSummary[];
}): RecommendationTransparency {
  const profileByUser = new Map(input.profiles.map((p) => [p.userId, p]));
  const userRows: RecommendationUserView[] = input.agentUsers.map((u) => {
    const allKpis = [...new Set([...u.requestedKpis, ...u.recommendedKpis])].sort();
    return {
      userId: u.userId,
      profile: profileByUser.get(u.userId) ?? {
        userId: u.userId,
        name: u.userId,
        role: "Unknown",
        primaryGoals: [],
      },
      requestedKpis: [...u.requestedKpis].sort(),
      recommendedKpis: [...u.recommendedKpis].sort(),
      selectionRationale: u.selectionRationale,
      allKpis,
      uniqueKpis: [],
    };
  });

  const allKpiSets = userRows.map((u) => new Set(u.allKpis));
  const shared = new Set<string>(userRows[0]?.allKpis ?? []);
  for (const s of allKpiSets.slice(1)) {
    for (const k of [...shared]) {
      if (!s.has(k)) shared.delete(k);
    }
  }
  const sharedKpis = [...shared].sort();

  for (const u of userRows) {
    u.uniqueKpis = u.allKpis.filter((k) => !shared.has(k));
  }

  return { sharedKpis, users: userRows };
}
