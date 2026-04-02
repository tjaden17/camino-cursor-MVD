import { describe, it, expect } from "vitest";
import { loadBriefingOrgContext } from "./load-org-context.js";

describe("loadBriefingOrgContext", () => {
  it("loads and validates the Locumate org context", () => {
    const org = loadBriefingOrgContext("locumate");
    expect(org.kind).toBe("briefing_org_context");
    expect(org.version).toBe(2);
    expect(org.orgId).toBe("locumate");
    expect(org.orgName).toBe("Locumate");
    expect(org.contributors.length).toBeGreaterThanOrEqual(2);
    expect(org.dataInventory.length).toBeGreaterThanOrEqual(4);
    expect(org.rootIssue).toBeTruthy();
  });

  it("validates required fields", () => {
    const org = loadBriefingOrgContext("locumate");
    for (const entry of org.dataInventory) {
      expect(entry.sourceId).toBeTruthy();
      expect(entry.filePath).toBeTruthy();
      expect(["csv", "xlsx"]).toContain(entry.format);
      expect(entry.idColumn).toBeTruthy();
    }
    for (const c of org.contributors) {
      expect(c.userId).toBeTruthy();
      expect(c.role).toBeTruthy();
      expect(c.onboardingPath).toBeTruthy();
    }
  });

  it("throws for unknown org", () => {
    expect(() => loadBriefingOrgContext("nonexistent")).toThrow();
  });
});
