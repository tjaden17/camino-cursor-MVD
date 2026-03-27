/**
 * Build v1.1 strategy catalogue (stub when `--skip-llm` / no API key).
 * Full LLM integration can replace stub text in a later iteration.
 */
import type { LoadedProfile } from "./load-onboarding.js";
import type { OrgContextFile } from "../org/types.js";
import type { StrategyCatalogueFile, StrategyHorizon } from "./strategy-types.js";

const HORIZONS: StrategyHorizon[] = ["now", "near", "far"];
/** 12 KPIs = 4 per horizon × 3 horizons, assigned round-robin to users */
const KPIS_PER_HORIZON = 4;

export function buildStubStrategyCatalogue(
  runId: string,
  org: OrgContextFile,
  profiles: LoadedProfile[],
): StrategyCatalogueFile {
  const pool = [
    "kpi.pipeline.leads_total",
    "kpi.sales.velocity",
    "kpi.support.sla",
    "kpi.finance.forecast",
    "kpi.sales.win_rate",
    "kpi.revenue.arpu",
    "kpi.product.adoption",
    "kpi.market.expansion",
    "kpi.churn.risk",
    "kpi.partners.pipeline",
  ];
  const titles: Record<string, string> = {
    "kpi.pipeline.leads_total": "Total leads",
    "kpi.sales.velocity": "Sales velocity",
    "kpi.support.sla": "Support SLA",
    "kpi.finance.forecast": "Forecast accuracy",
    "kpi.sales.win_rate": "Win rate",
    "kpi.revenue.arpu": "ARPU",
    "kpi.product.adoption": "Product adoption",
    "kpi.market.expansion": "Market expansion",
    "kpi.churn.risk": "Churn risk",
    "kpi.partners.pipeline": "Partner pipeline",
  };

  const kpis: StrategyCatalogueFile["kpis"] = [];
  let idx = 0;
  for (const h of HORIZONS) {
    for (let i = 0; i < KPIS_PER_HORIZON; i++) {
      const kpiId = pool[idx % pool.length]!;
      const userId = profiles[i % profiles.length]?.userId ?? "surge";
      kpis.push({
        kpiId,
        title: titles[kpiId] ?? kpiId,
        horizon: h,
        userId,
        rationale: `Stub strategy (${h}): align “${titles[kpiId]}” to ${org.orgName} priorities for ${userId} — replace with LLM output when enabled.`,
      });
      idx += 1;
    }
  }

  const decisions: StrategyCatalogueFile["decisions"] = [];
  let d = 0;
  for (const h of HORIZONS) {
    for (let j = 0; j < 2; j++) {
      const userId = profiles[d % profiles.length]?.userId ?? "surge";
      decisions.push({
        id: `decision.${h}.${j + 1}`,
        title: `Upcoming decision (${h}) #${j + 1}`,
        horizon: h,
        hypothesis: `Stub: hypothesis for ${userId} / ${org.orgName} — confirm with stakeholders.`,
        userId,
      });
      d += 1;
    }
  }

  const sampleDisclaimer =
    "Sample worked example only — not an official rollup; inputs and period are illustrative.";

  const sampleCalcsRequested: StrategyCatalogueFile["sampleCalcsRequested"] = [
    {
      kpiId: "kpi.pipeline.leads_total",
      kind: "sample_worked_example",
      label: "Requested sample: total leads cut",
      nonProductionDisclaimer: sampleDisclaimer,
    },
    {
      kpiId: "kpi.sales.velocity",
      kind: "sample_worked_example",
      label: "Requested sample: velocity index",
      nonProductionDisclaimer: sampleDisclaimer,
    },
    {
      kpiId: "kpi.support.sla",
      kind: "sample_worked_example",
      label: "Requested sample: SLA attainment",
      nonProductionDisclaimer: sampleDisclaimer,
    },
  ];

  const sampleCalcsRecommended: StrategyCatalogueFile["sampleCalcsRecommended"] = [
    {
      kpiId: "kpi.sales.win_rate",
      kind: "sample_worked_example",
      label: "Recommended sample: win rate",
      nonProductionDisclaimer: sampleDisclaimer,
    },
    {
      kpiId: "kpi.revenue.arpu",
      kind: "sample_worked_example",
      label: "Recommended sample: ARPU",
      nonProductionDisclaimer: sampleDisclaimer,
    },
    {
      kpiId: "kpi.product.adoption",
      kind: "sample_worked_example",
      label: "Recommended sample: adoption",
      nonProductionDisclaimer: sampleDisclaimer,
    },
  ];

  return {
    kind: "strategy_catalogue",
    version: 1,
    generatedAt: new Date().toISOString(),
    runId,
    orgId: org.orgId,
    orgName: org.orgName,
    kpis,
    decisions,
    sampleCalcsRequested,
    sampleCalcsRecommended,
  };
}
