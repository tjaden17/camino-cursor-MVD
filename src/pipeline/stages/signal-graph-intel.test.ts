import { describe, expect, it } from "vitest";
import {
  buildGraph,
  computeCentrality,
  detectThemes,
  analyseSignalGraph,
  getRelatedSignals,
  SIGNAL_GRAPH,
} from "./signal-graph-intel.js";

describe("signal-graph-intel", () => {
  describe("buildGraph", () => {
    it("creates a node for every KPI in SIGNAL_GRAPH", () => {
      const g = buildGraph();
      const allKpis = new Set<string>();
      for (const [source, targets] of Object.entries(SIGNAL_GRAPH)) {
        allKpis.add(source);
        for (const t of targets) allKpis.add(t.kpiId);
      }
      expect(g.order).toBe(allKpis.size);
    });

    it("has undirected weighted edges", () => {
      const g = buildGraph();
      expect(g.type).toBe("undirected");
      g.forEachEdge((_edge, attrs) => {
        expect(typeof attrs.weight).toBe("number");
        expect(attrs.weight).toBeGreaterThan(0);
      });
    });
  });

  describe("computeCentrality", () => {
    it("returns a ranked list with impactScore descending", () => {
      const g = buildGraph();
      const ranked = computeCentrality(g);
      expect(ranked.length).toBeGreaterThan(0);
      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i - 1].impactScore).toBeGreaterThanOrEqual(ranked[i].impactScore);
      }
    });

    it("every KPI has pagerank, betweenness, degree and impactScore", () => {
      const g = buildGraph();
      for (const kpi of computeCentrality(g)) {
        expect(kpi.pagerank).toBeGreaterThanOrEqual(0);
        expect(kpi.betweenness).toBeGreaterThanOrEqual(0);
        expect(kpi.degree).toBeGreaterThanOrEqual(0);
        expect(kpi.impactScore).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("detectThemes", () => {
    it("returns at least 2 distinct theme clusters", () => {
      const g = buildGraph();
      const centrality = computeCentrality(g);
      const themes = detectThemes(g, centrality);
      expect(themes.length).toBeGreaterThanOrEqual(2);
    });

    it("every KPI appears in exactly one cluster", () => {
      const g = buildGraph();
      const centrality = computeCentrality(g);
      const themes = detectThemes(g, centrality);
      const allKpis = themes.flatMap((t) => t.kpis.map((k) => k.kpiId));
      const unique = new Set(allKpis);
      expect(unique.size).toBe(allKpis.length);
      expect(unique.size).toBe(g.order);
    });

    it("clusters are sorted by importance descending", () => {
      const g = buildGraph();
      const centrality = computeCentrality(g);
      const themes = detectThemes(g, centrality);
      for (let i = 1; i < themes.length; i++) {
        expect(themes[i - 1].clusterImportance).toBeGreaterThanOrEqual(
          themes[i].clusterImportance,
        );
      }
    });
  });

  describe("analyseSignalGraph (one-call API)", () => {
    it("returns both rankedKpis and themes", () => {
      const result = analyseSignalGraph();
      expect(result.rankedKpis.length).toBeGreaterThan(0);
      expect(result.themes.length).toBeGreaterThan(0);
    });
  });

  describe("backward compat: getRelatedSignals", () => {
    it("win_rate returns 2 related signals", () => {
      const signals = getRelatedSignals("win_rate");
      expect(signals).toHaveLength(2);
      expect(signals[0].kpiId).toBe("pipeline_value");
    });

    it("unknown KPI returns empty array", () => {
      expect(getRelatedSignals("nope")).toEqual([]);
    });
  });
});
