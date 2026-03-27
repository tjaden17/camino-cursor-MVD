import { describe, expect, it } from "vitest";
import { mergeOrgContext } from "./merge-org.js";

describe("mergeOrgContext", () => {
  it("merges org fields and uses higher role rank on conflict", () => {
    const out = mergeOrgContext([
      {
        userId: "sam",
        path: "/x/sam.json",
        raw: {
          user: { user_id: "sam", name: "Sam", role: "Customer Success Manager" },
          company_context: { company: "Acme", industry: "Health", stage: "Seed" },
        },
      },
      {
        userId: "surge",
        path: "/x/surge.json",
        raw: {
          user: { user_id: "surge", name: "Surge", role: "CEO" },
          company_context: { company: "Acme", industry: "SaaS", stage: "Series A" },
        },
      },
    ]);
    expect(out.orgName).toBe("Acme");
    expect(out.mergedCompanyContext.industry).toBe("SaaS");
    expect(out.mergedCompanyContext.stage).toBe("Series A");
  });

  it("uses the senior role's company name when profiles disagree", () => {
    const out = mergeOrgContext([
      {
        userId: "sam",
        path: "/x/sam.json",
        raw: {
          user: { user_id: "sam", name: "Sam", role: "Customer Success Manager" },
          company_context: { company: "OtherCo", industry: "Health", stage: "Seed" },
        },
      },
      {
        userId: "surge",
        path: "/x/surge.json",
        raw: {
          user: { user_id: "surge", name: "Surge", role: "CEO" },
          company_context: { company: "Locumate", industry: "SaaS", stage: "Series A" },
        },
      },
    ]);
    expect(out.orgName).toBe("Locumate");
    expect(out.mergedCompanyContext.company).toBe("Locumate");
  });
});
