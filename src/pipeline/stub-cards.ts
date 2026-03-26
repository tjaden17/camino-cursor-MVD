/**
 * Deterministic signal cards for pipeline runs without LLM (CI / `--skip-llm`).
 * Satisfies refined AC: 3+3+3+1 category mix per user.
 */
import type { SignalExpanded, SignalInsufficientData, SignalOverview } from "../types/contracts.js";
import type { ProcessedCard, UserKpiContext } from "./types.js";

type RowSpec = {
  kpiId: string;
  title: string;
  requestType: "requested" | "recommended";
  dataSufficiency: "sufficient" | "insufficient";
};

/** Fixed ordering encodes the AC mix. */
const ROWS: RowSpec[] = [
  {
    kpiId: "kpi.pipeline.leads_total",
    title: "Total leads",
    requestType: "requested",
    dataSufficiency: "sufficient",
  },
  {
    kpiId: "kpi.sales.velocity",
    title: "Sales velocity",
    requestType: "requested",
    dataSufficiency: "sufficient",
  },
  {
    kpiId: "kpi.support.sla",
    title: "Support SLA",
    requestType: "requested",
    dataSufficiency: "sufficient",
  },
  {
    kpiId: "kpi.finance.forecast",
    title: "Forecast accuracy",
    requestType: "requested",
    dataSufficiency: "insufficient",
  },
  {
    kpiId: "kpi.sales.win_rate",
    title: "Win rate",
    requestType: "recommended",
    dataSufficiency: "sufficient",
  },
  {
    kpiId: "kpi.revenue.arpu",
    title: "ARPU",
    requestType: "recommended",
    dataSufficiency: "sufficient",
  },
  {
    kpiId: "kpi.product.adoption",
    title: "Product adoption",
    requestType: "recommended",
    dataSufficiency: "sufficient",
  },
  {
    kpiId: "kpi.market.expansion",
    title: "Market expansion",
    requestType: "recommended",
    dataSufficiency: "insufficient",
  },
  {
    kpiId: "kpi.churn.risk",
    title: "Churn risk",
    requestType: "recommended",
    dataSufficiency: "insufficient",
  },
  {
    kpiId: "kpi.partners.pipeline",
    title: "Partner pipeline",
    requestType: "recommended",
    dataSufficiency: "insufficient",
  },
];

export function buildStubCards(ctx: UserKpiContext): ProcessedCard[] {
  return ROWS.map((row) => buildOneCard(ctx, row));
}

function buildOneCard(ctx: UserKpiContext, row: RowSpec): ProcessedCard {
  const prov = ctx.leadsProvenance;
  const recommended = row.requestType === "recommended";

  const overview: SignalOverview = {
    kind: "signal_overview",
    kpiId: row.kpiId,
    title: row.title,
    currentValue: row.dataSufficiency === "sufficient" ? String(ctx.leadsTotal) : "—",
    changePct: row.dataSufficiency === "sufficient" ? 0 : null,
    changeLabel:
      row.dataSufficiency === "sufficient"
        ? "Vs prior period (illustrative)"
        : "Insufficient data for a numeric delta",
    oneLineSummary:
      row.dataSufficiency === "sufficient"
        ? `${row.title} for ${ctx.displayName} aligns with current CRM extract (${ctx.leadsTotal} leads in sample period).`
        : `${row.title} needs additional datasets before we publish a number — see expanded.`,
    recommended,
    provenance: prov,
  };

  if (row.dataSufficiency === "insufficient") {
    const whyItMatters = `Leadership uses ${row.title} to prioritize weekly decisions for ${ctx.displayName}.`;
    const insufficient: SignalInsufficientData = {
      kind: "insufficient_data",
      kpiId: row.kpiId,
      title: row.title,
      missingData: [
        "CRM opportunity stage history for the last 90 days",
        "Finance forecast workbook or board-approved targets",
      ],
      whyItMatters,
      sourcingTips: sourcingTipsFor(row.kpiId),
      metricsWithheld: true,
    };
    const recommendationRationale =
      row.requestType === "recommended"
        ? recommendationRationaleInsufficientRecommended(row.title, ctx.displayName, whyItMatters)
        : undefined;
    return {
      kpiId: row.kpiId,
      requestType: row.requestType,
      dataSufficiency: "insufficient",
      recommendationRationale,
      overview,
      insufficient,
    };
  }

  const expanded: SignalExpanded = {
    kind: "signal_expanded",
    kpiId: row.kpiId,
    execSummary: `${row.title} is stable this period; use alongside pipeline and support signals for a full picture.`,
    takeawayBreakdown: {
      directionGoodOrBad: "Directionally neutral — no red flag from the sample extract.",
      expectedOrUnexpected: "Consistent with a seed-stage B2B operating rhythm.",
    },
    benchmarkComparison: "Illustrative benchmark — compare to your board plan, not a public index.",
    rootCauseAnalysis:
      "Volume and timing effects from the current CRM slice; validate with your RevOps owner.",
    rootCauseRationale:
      "1) Confirm extract date range. 2) Segment enterprise vs SMB. 3) Spot-check five deals.",
    provenance: prov,
  };

  const recommendationRationale =
    row.requestType === "recommended"
      ? recommendationRationaleSufficient(row.title, ctx.displayName)
      : undefined;

  return {
    kpiId: row.kpiId,
    requestType: row.requestType,
    dataSufficiency: "sufficient",
    recommendationRationale,
    overview,
    expanded,
  };
}

/** Deterministic sourcing tips per KPI id (insufficient cards only). */
function sourcingTipsFor(kpiId: string): string[] {
  const tips: Record<string, string[]> = {
    "kpi.finance.forecast": [
      "Export closed-won and pipeline snapshots from CRM for the same date range as finance uses.",
      "Ask finance for the board-approved forecast workbook or a read-only link to the planning model.",
    ],
    "kpi.market.expansion": [
      "Pull a territories or segments report from CRM and align it to your internal market taxonomy.",
      "Work with RevOps to tag accounts by region so expansion counts are reproducible next week.",
    ],
    "kpi.churn.risk": [
      "Request a subscription or contract export that includes renewal dates and product SKU.",
      "Pair CRM health scores with support ticket volume for the same account list.",
    ],
    "kpi.partners.pipeline": [
      "Ask partnerships for their pipeline spreadsheet or PRM export with stage and owner.",
      "Define a single partner deal ID that links CRM opportunities to partner-sourced leads.",
    ],
  };
  return tips[kpiId] ?? [
    "Identify the owner system for this metric and request a weekly CSV extract with a stable key.",
    "Document the date range and filters so the same cut can be replayed in QC.",
  ];
}

function recommendationRationaleSufficient(title: string, displayName: string): string {
  return (
    `Camino recommends “${title}” for ${displayName} because it balances your requested KPIs with ` +
    `a forward-looking lens—use it alongside pipeline and support signals when prioritising the week.`
  );
}

/**
 * For recommended + insufficient: must read differently from `whyItMatters` (CTO review 25 Mar).
 */
function recommendationRationaleInsufficientRecommended(
  title: string,
  displayName: string,
  whyItMatters: string,
): string {
  const r =
    `We highlighted “${title}” as a recommended signal for ${displayName} to round out the set you asked for—` +
    `even before the underlying data is wired—so you can see where Camino will add value once sources connect.`;
  // Guard against accidental copy collision in tests / QC.
  if (r.trim() === whyItMatters.trim()) {
    throw new Error(`recommendationRationale must differ from whyItMatters for ${title}`);
  }
  return r;
}

export function stubSelectionFromCards(userId: string, cards: ProcessedCard[]) {
  const requested = [
    ...new Set(cards.filter((c) => c.requestType === "requested").map((c) => c.kpiId)),
  ];
  const recommended = [
    ...new Set(cards.filter((c) => c.requestType === "recommended").map((c) => c.kpiId)),
  ];
  return {
    userId,
    requestedKpis: requested,
    recommendedKpis: recommended,
    selectionRationale:
      "Deterministic stub selection: KPIs split to satisfy requested vs recommended mix for demo (no LLM).",
  };
}
