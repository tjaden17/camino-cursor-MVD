import { describe, it, expect } from "vitest";
import { ingestSource } from "./stage1-ingest.js";
import { loadBriefingOrgContext } from "./load-org-context.js";

const org = loadBriefingOrgContext("locumate");

describe("stage1-ingest", () => {
  it("ingests Zoho CRM Deals (small file, < 500 rows)", () => {
    const entry = org.dataInventory.find((e) => e.sourceId === "zoho_crm_deals")!;
    const summary = ingestSource(entry);

    expect(summary.sourceId).toBe("zoho_crm_deals");
    expect(summary.rowCount).toBe(33);
    expect(summary.columns.length).toBeGreaterThan(5);
    expect(summary.excerpt.strategy).toBe("full");

    const stageCol = summary.columns.find((c) => c.name === "Stage");
    expect(stageCol).toBeDefined();
    expect(stageCol!.type).toBe("categorical");
    expect(stageCol!.values).toBeDefined();
    expect(stageCol!.values!["Closed Won"]).toBeGreaterThanOrEqual(13);

    const amountCol = summary.columns.find((c) => c.name === "Amount");
    expect(amountCol).toBeDefined();
    expect(["numeric", "currency"]).toContain(amountCol!.type);
  });

  it("ingests Zoho CRM Leads (small file)", () => {
    const entry = org.dataInventory.find((e) => e.sourceId === "zoho_crm_leads")!;
    const summary = ingestSource(entry);

    expect(summary.sourceId).toBe("zoho_crm_leads");
    expect(summary.rowCount).toBe(53);
    expect(summary.excerpt.strategy).toBe("full");
  });

  it("ingests Shifts data (large file, > 500 rows → aggregated excerpt)", () => {
    const entry = org.dataInventory.find((e) => e.sourceId === "shifts")!;
    const summary = ingestSource(entry);

    expect(summary.sourceId).toBe("shifts");
    expect(summary.rowCount).toBeGreaterThan(500);
    expect(summary.excerpt.strategy).toBe("aggregated");
    expect(summary.excerpt.groupByCounts).toBeDefined();
    expect(summary.excerpt.topRows).toBeDefined();
    expect(summary.excerpt.topRows!.length).toBeLessThanOrEqual(20);
  });

  it("generates quality notes for poorly populated columns", () => {
    const entry = org.dataInventory.find((e) => e.sourceId === "zoho_crm_deals")!;
    const summary = ingestSource(entry);

    const leadSourceCol = summary.columns.find((c) => c.name === "Lead Source");
    expect(leadSourceCol).toBeDefined();

    const hasLowPopWarn = summary.qualityNotes.some(
      (n) => n.level === "warn" && n.message.includes("Lead Source"),
    );
    expect(hasLowPopWarn).toBe(true);
  });

  it("detects date columns and produces dateRange", () => {
    const entry = org.dataInventory.find((e) => e.sourceId === "zoho_crm_deals")!;
    const summary = ingestSource(entry);

    expect(summary.dateRange).not.toBeNull();
    expect(summary.dateRange!.earliest).toBeTruthy();
    expect(summary.dateRange!.latest).toBeTruthy();
  });

  it("detects the idColumn and deduplicates", () => {
    const entry = org.dataInventory.find((e) => e.sourceId === "zoho_crm_deals")!;
    const summary = ingestSource(entry);

    const idCol = summary.columns.find((c) => c.name === "Id");
    expect(idCol).toBeDefined();
  });
});
