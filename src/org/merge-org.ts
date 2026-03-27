/**
 * Merge company_context from multiple onboarding profiles into one org snapshot.
 * Tie-break: higher roleRank wins (exec > manager/CSM) — Decision 6.
 */
import type { LoadedProfile } from "../pipeline/load-onboarding.js";
import type { OrgContextFile } from "./types.js";

export function roleRank(role: string): number {
  const r = role.toLowerCase();
  if (/\bceo\b|chief exec|founder|president|exec/i.test(r)) return 100;
  if (/manager|director|head of|vp|csm|customer success/i.test(r)) return 60;
  return 30;
}

function slugOrgName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "org";
}

/** Highest role rank wins; tie-break by userId (Decision 6 — same as field conflicts). */
function pickLeaderProfile(profiles: LoadedProfile[]): LoadedProfile {
  return [...profiles].sort((a, b) => {
    const ra = roleRank(String((a.raw as { user?: { role?: string } }).user?.role ?? ""));
    const rb = roleRank(String((b.raw as { user?: { role?: string } }).user?.role ?? ""));
    if (rb !== ra) return rb - ra;
    return a.userId.localeCompare(b.userId);
  })[0]!;
}

export function mergeOrgContext(profiles: LoadedProfile[]): OrgContextFile {
  if (profiles.length === 0) {
    throw new Error("mergeOrgContext: no profiles");
  }
  const leader = pickLeaderProfile(profiles);
  const leaderRaw = leader.raw as {
    company_context?: { company?: string | null };
  };
  const orgName =
    String(leaderRaw.company_context?.company ?? "unknown-org").trim() || "unknown-org";
  const orgId = slugOrgName(orgName);

  const contributors = profiles.map((p) => {
    const raw = p.raw as { user?: { name?: string; role?: string } };
    const role = String(raw.user?.role ?? "");
    return {
      userId: p.userId,
      displayName: String(raw.user?.name ?? p.userId),
      role,
      roleRank: roleRank(role),
    };
  });

  const keys = new Set<string>();
  for (const p of profiles) {
    const cc = (p.raw as { company_context?: Record<string, unknown> }).company_context;
    if (!cc) continue;
    for (const k of Object.keys(cc)) {
      if (k === "company") continue;
      keys.add(k);
    }
  }

  const merged: Record<string, unknown> = { company: orgName };
  for (const key of keys) {
    const candidates: Array<{ value: unknown; rank: number; userId: string }> = [];
    for (const p of profiles) {
      const cc = (p.raw as { company_context?: Record<string, unknown> }).company_context;
      const v = cc?.[key];
      if (v === undefined || v === null || v === "") continue;
      const raw = p.raw as { user?: { role?: string } };
      const rank = roleRank(String(raw.user?.role ?? ""));
      candidates.push({ value: v, rank, userId: p.userId });
    }
    if (candidates.length === 0) continue;
    candidates.sort((a, b) => b.rank - a.rank);
    merged[key] = candidates[0]!.value;
  }

  return {
    kind: "org_context",
    version: 1,
    orgId,
    orgName,
    mergedCompanyContext: merged,
    contributors,
    generatedAt: new Date().toISOString(),
  };
}
