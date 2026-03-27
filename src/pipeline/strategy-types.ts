/**
 * Canonical strategy output for MVD v1.1 (12 KPIs + 6 decisions).
 * Written to `out/strategy-catalogue.json` (Decision 12).
 */
export type StrategyHorizon = "now" | "near" | "far";

export interface StrategyKpiEntry {
  kpiId: string;
  title: string;
  horizon: StrategyHorizon;
  /** User-specific recommendation line */
  rationale: string;
  userId: string;
}

export interface StrategyDecisionEntry {
  id: string;
  title: string;
  horizon: StrategyHorizon;
  hypothesis: string;
  userId: string;
}

/** Sample calc row — must be labeled sample / worked example (Decision 8). */
export interface SampleCalcEntry {
  kpiId: string;
  kind: "sample_worked_example";
  label: string;
  /** Explicit: not an official rollup */
  nonProductionDisclaimer: string;
}

export interface StrategyCatalogueFile {
  kind: "strategy_catalogue";
  version: 1;
  generatedAt: string;
  runId: string;
  orgId: string;
  orgName: string;
  kpis: StrategyKpiEntry[];
  decisions: StrategyDecisionEntry[];
  /** PDF sample 3 requested + 3 recommended — clearly labeled */
  sampleCalcsRequested: SampleCalcEntry[];
  sampleCalcsRecommended: SampleCalcEntry[];
}
