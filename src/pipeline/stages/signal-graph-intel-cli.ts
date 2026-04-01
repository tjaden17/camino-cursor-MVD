#!/usr/bin/env tsx
/**
 * Quick CLI to inspect the signal graph intelligence output.
 * Run:  npx tsx src/pipeline/stages/signal-graph-intel-cli.ts
 */

import { analyseSignalGraph } from "./signal-graph-intel.js";

const { rankedKpis, themes } = analyseSignalGraph();

console.log("=".repeat(64));
console.log("  SIGNAL GRAPH INTELLIGENCE — KPI Impact Ranking");
console.log("=".repeat(64));
console.log();

console.log(
  "Rank  KPI".padEnd(40) +
    "PageRank".padStart(10) +
    "Between.".padStart(10) +
    "Degree".padStart(10) +
    "Impact".padStart(10),
);
console.log("-".repeat(80));

rankedKpis.forEach((kpi, i) => {
  console.log(
    `${String(i + 1).padStart(2)}.  ${kpi.title.padEnd(34)}` +
      `${kpi.pagerank.toFixed(3).padStart(10)}` +
      `${kpi.betweenness.toFixed(3).padStart(10)}` +
      `${kpi.degree.toFixed(3).padStart(10)}` +
      `${kpi.impactScore.toFixed(3).padStart(10)}`,
  );
});

console.log();
console.log("=".repeat(64));
console.log("  AUTO-DETECTED THEME CLUSTERS (Louvain)");
console.log("=".repeat(64));

themes.forEach((theme, i) => {
  console.log();
  console.log(
    `  Theme ${i + 1}: ${theme.label}  (avg importance: ${theme.clusterImportance.toFixed(3)})`,
  );
  console.log("  " + "-".repeat(50));
  theme.kpis.forEach((kpi) => {
    console.log(`    • ${kpi.title.padEnd(30)} impact: ${kpi.impactScore.toFixed(3)}`);
  });
});

console.log();
console.log("=".repeat(64));
console.log("  INTERPRETATION");
console.log("=".repeat(64));
console.log();
console.log("  Top KPI (most connected/influential):");
console.log(`    → ${rankedKpis[0].title} (impact ${rankedKpis[0].impactScore.toFixed(3)})`);
console.log();
console.log("  Most important theme cluster:");
console.log(`    → ${themes[0].label} (avg importance ${themes[0].clusterImportance.toFixed(3)})`);
console.log(`      Contains: ${themes[0].kpis.map((k) => k.title).join(", ")}`);
console.log();
