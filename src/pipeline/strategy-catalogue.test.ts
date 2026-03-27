import { describe, expect, it } from "vitest";
import { buildStubStrategyCatalogue } from "./strategy-catalogue.js";
import type { OrgContextFile } from "../org/types.js";

describe("buildStubStrategyCatalogue", () => {
  it("produces 12 KPIs and 6 decisions", () => {
    const org: OrgContextFile = {
      kind: "org_context",
      version: 1,
      orgId: "acme",
      orgName: "Acme",
      mergedCompanyContext: { company: "Acme" },
      contributors: [],
      generatedAt: new Date().toISOString(),
    };
    const profiles = [
      {
        userId: "surge",
        path: "/a.json",
        raw: { user: { user_id: "surge", name: "S", role: "CEO" } },
      },
      {
        userId: "sam",
        path: "/b.json",
        raw: { user: { user_id: "sam", name: "M", role: "CSM" } },
      },
    ];
    const cat = buildStubStrategyCatalogue("run-1", org, profiles);
    expect(cat.kpis).toHaveLength(12);
    expect(cat.decisions).toHaveLength(6);
    expect(cat.sampleCalcsRequested).toHaveLength(3);
    expect(cat.sampleCalcsRecommended).toHaveLength(3);
  });
});
