import { describe, expect, it } from "vitest";
import { rowToOnboardingProfile } from "./csv-to-json.js";

describe("rowToOnboardingProfile", () => {
  it("builds a minimal valid-shaped profile", () => {
    const profile = rowToOnboardingProfile(
      {
        user_id: "testuser",
        name: "Test",
        role: "CEO",
        company: "Co",
        industry: "SaaS",
        business_model: "B2B",
        stage: "Seed",
        team_size: "10",
        primary_goals: "Grow|Scale",
        review_moments: "Weekly",
        decision_outcomes: "Hire",
        current_top_metrics: "m1|m2",
        uses_data_sources: "CRM",
        requested_signal_candidates: "kpi.pipeline.leads_total",
        recommended_signal_candidates: "kpi.sales.win_rate",
        gaps_note: "ok",
      },
      { derivedBy: "test", document: "x.csv", derivedAt: "2026-03-28" },
    );
    const o = profile as { user: { user_id: string }; signal_preferences: { requested_signal_candidates: string[] } };
    expect(o.user.user_id).toBe("testuser");
    expect(o.signal_preferences.requested_signal_candidates.length).toBeGreaterThan(0);
  });
});
