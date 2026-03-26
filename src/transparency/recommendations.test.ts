import { describe, expect, it } from "vitest";
import { buildRecommendationTransparency } from "./recommendations.js";

describe("buildRecommendationTransparency", () => {
  it("computes shared and unique KPI sets per user", () => {
    const out = buildRecommendationTransparency({
      agentUsers: [
        {
          userId: "surge",
          requestedKpis: ["a", "b"],
          recommendedKpis: ["c", "d"],
          selectionRationale: "r1",
        },
        {
          userId: "sam",
          requestedKpis: ["a", "x"],
          recommendedKpis: ["c", "y"],
          selectionRationale: "r2",
        },
      ],
      profiles: [
        { userId: "surge", name: "Surge", role: "CEO", primaryGoals: ["Grow"] },
        { userId: "sam", name: "Sam", role: "CSM", primaryGoals: ["Retain"] },
      ],
    });

    expect(out.sharedKpis).toEqual(["a", "c"]);
    expect(out.users[0]?.uniqueKpis).toEqual(["b", "d"]);
    expect(out.users[1]?.uniqueKpis).toEqual(["x", "y"]);
  });
});
