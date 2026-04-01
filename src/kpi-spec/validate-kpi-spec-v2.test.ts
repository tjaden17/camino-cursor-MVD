import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getRepoRoot } from "../repo-root.js";
import { validateKpiSpecV2 } from "./validate-kpi-spec-v2.js";

describe("validateKpiSpecV2", () => {
  it("validates bundled kpi-spec-v2.json", () => {
    const root = getRepoRoot();
    const p = join(root, "data", "kpi-spec", "kpi-spec-v2.json");
    const raw = JSON.parse(readFileSync(p, "utf8")) as unknown;
    const r = validateKpiSpecV2(raw);
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it("rejects spec missing formula field", () => {
    const r = validateKpiSpecV2({
      version: 2,
      dataSources: [{ sourceId: "x", label: "X", status: "connected", filePath: "x.csv" }],
      kpis: [{ kpiId: "test", title: "Test", unitHint: "count", sourceIds: ["x"], sufficiencyThreshold: "1 row" }],
      userMappings: [{ userId: "u", sufficientKpis: ["test"], insufficientKpis: [] }],
    });
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("rejects spec with version 1", () => {
    const r = validateKpiSpecV2({ version: 1, kpis: [], dataSources: [], userMappings: [] });
    expect(r.ok).toBe(false);
  });

  it("rejects spec missing dataSources", () => {
    const r = validateKpiSpecV2({
      version: 2,
      kpis: [{ kpiId: "t", title: "T", unitHint: "%", formula: "x", sourceIds: ["s"], sufficiencyThreshold: "1" }],
      userMappings: [{ userId: "u", sufficientKpis: [], insufficientKpis: [] }],
    });
    expect(r.ok).toBe(false);
  });

  it("rejects spec missing userMappings", () => {
    const r = validateKpiSpecV2({
      version: 2,
      dataSources: [{ sourceId: "x", label: "X", status: "connected", filePath: "x.csv" }],
      kpis: [{ kpiId: "t", title: "T", unitHint: "%", formula: "x", sourceIds: ["x"], sufficiencyThreshold: "1" }],
    });
    expect(r.ok).toBe(false);
  });

  it("bundled spec has 24 KPIs", () => {
    const root = getRepoRoot();
    const p = join(root, "data", "kpi-spec", "kpi-spec-v2.json");
    const raw = JSON.parse(readFileSync(p, "utf8")) as { kpis: unknown[] };
    expect(raw.kpis.length).toBe(24);
  });

  it("every KPI has a non-empty formula", () => {
    const root = getRepoRoot();
    const p = join(root, "data", "kpi-spec", "kpi-spec-v2.json");
    const raw = JSON.parse(readFileSync(p, "utf8")) as {
      kpis: Array<{ kpiId: string; formula: string }>;
    };
    for (const kpi of raw.kpis) {
      expect(kpi.formula, `${kpi.kpiId} missing formula`).toBeTruthy();
      expect(kpi.formula.length, `${kpi.kpiId} formula too short`).toBeGreaterThan(5);
    }
  });

  it("bundled spec has 9 data sources (5 connected + 4 expected/wishlist)", () => {
    const root = getRepoRoot();
    const p = join(root, "data", "kpi-spec", "kpi-spec-v2.json");
    const raw = JSON.parse(readFileSync(p, "utf8")) as {
      dataSources: Array<{ status: string }>;
    };
    expect(raw.dataSources.length).toBe(9);
    const connected = raw.dataSources.filter((s) => s.status === "connected");
    expect(connected.length).toBe(5);
  });

  it("user mappings exist for surge and sam", () => {
    const root = getRepoRoot();
    const p = join(root, "data", "kpi-spec", "kpi-spec-v2.json");
    const raw = JSON.parse(readFileSync(p, "utf8")) as {
      userMappings: Array<{ userId: string; sufficientKpis: string[]; insufficientKpis: string[] }>;
    };
    const surge = raw.userMappings.find((m) => m.userId === "surge");
    const sam = raw.userMappings.find((m) => m.userId === "sam");
    expect(surge).toBeDefined();
    expect(sam).toBeDefined();
    expect(surge!.sufficientKpis.length).toBeGreaterThanOrEqual(4);
    expect(sam!.sufficientKpis.length).toBeGreaterThanOrEqual(4);
  });
});
