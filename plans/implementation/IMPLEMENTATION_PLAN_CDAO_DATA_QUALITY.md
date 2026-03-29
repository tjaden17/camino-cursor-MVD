# Implementation Plan — CDAO Data-Quality & Visibility Roadmap

**Overall Progress:** `0%`

## TLDR

Audit found **six gaps** between the Signal Card wireframe vision and what the codebase actually computes today. In short: the *shape* of the card (contracts, schemas, pipeline stages) is correct, but many numbers are **staged/illustrative**, sufficiency is **hardcoded**, trends are **not period-compared**, benchmarks and causal chains are **narrative-only**, and provenance is **reused across unrelated KPIs**. This plan prioritises fixes by **RICE score** so we tackle trust-critical items first.

## RICE scoring methodology

| Factor | How we scored it |
|--------|-----------------|
| **Reach** | % of signal cards or users affected (1–10 scale; 10 = every card for every user). |
| **Impact** | Effect per card/user on trust, correctness, or product differentiation (3 = massive, 2 = high, 1 = medium, 0.5 = low). |
| **Confidence** | How sure we are the approach works (100 / 80 / 50%). |
| **Effort** | Person-weeks to ship (lower = better RICE). |

> **RICE = (Reach × Impact × Confidence) / Effort**

## RICE priority table

| # | Issue | Reach | Impact | Confidence | Effort (pw) | **RICE** | Priority |
|---|-------|-------|--------|------------|-------------|----------|----------|
| 1 | Honest sufficiency + per-KPI provenance | 10 | 3 | 100% | 3 | **10.0** | **P0** |
| 2 | Per-KPI-run visibility (lineage log) | 8 | 2 | 100% | 1 | **16.0** | **P0** |
| 3 | Real period-over-period trends (WoW) | 10 | 2 | 80% | 3 | **5.3** | **P1** |
| 4 | KPI spec honest metadata (unique rules) | 10 | 2 | 100% | 1 | **20.0** | **P0** |
| 5 | Benchmark v0 (structured, not free-text) | 6 | 1 | 50% | 3 | **1.0** | **P2** |
| 6 | Causal / related-signal structure | 4 | 1 | 50% | 4 | **0.5** | **P3** |

**Reading the table:** Issue 4 and 2 score highest per-effort because they are low-effort, high-reach trust fixes. Issue 1 is the most impactful overall but costs more effort, still clearly P0. Issues 5–6 are P2/P3 — nice to have but require new data sources or modelling.

## Critical Decisions

- **Decision 1: Sufficiency from replay outcomes, not a hardcoded table.** A card is `sufficient` only when a replay function for that `kpiId` succeeds and the `KPI_DICTIONARY` status is `replayed`. Everything else is `insufficient`. Rationale: prevents fake numbers reaching the user.
- **Decision 2: Per-KPI provenance, never reuse the leads bundle.** Each card's `ProvenanceBundle` must come from the replay (or dictionary entry) for *that* KPI's `ruleId`, `sourceId`, and formula. Rationale: without this, "where did this number come from?" is misleading for 9 out of 10 KPIs.
- **Decision 3: Trends require two successful replays.** `changePct` / `changeLabel` are only populated when the pipeline can replay the *same* KPI for *two* consecutive periods. Otherwise the trend fields are null / "Not enough history". Rationale: directional trust.
- **Decision 4: Benchmarks need a source table + citation.** The existing `gateBenchmarkClaims` gate already demands a URL and caveat. Extend this by *providing* a benchmark table so the LLM (or stub) can cite real data. Until the table exists, `benchmarkComparison` stays empty. Rationale: no hallucinated norms.
- **Decision 5: Causal / related signals start as structured JSON edges, not a graph DB.** A lightweight `relatedKpis[]` or `driverHints[]` array on `SignalExpanded` is sufficient for v0. Graph MCP is a later accelerator. Rationale: minimal change, avoids new infra dependency.

## Tasks

### P0 — Trust foundation (do first)

- [ ] 🟥 **Step 1: KPI spec — unique `defaultRuleId` per KPI** *(RICE 20.0)*
  - [ ] 🟥 Update `data/kpi-spec/kpi-spec-v1.json`: replace blanket `RULE_LEADS_ROW_COUNT` on every entry with an honest rule id per KPI (e.g. `RULE_VELOCITY_PROXY`, `RULE_SLA_PLACEHOLDER`, etc.).
  - [ ] 🟥 Update `KPI_DICTIONARY` in `src/kpi/rules.ts`: same — unique `ruleId`, honest `sourceId`, and `formulaSummary` that matches the spec.
  - [ ] 🟥 Add a CI check (or extend `validateKpiSpec`) that fails if two KPIs share a `defaultRuleId` unless explicitly marked `alias: true`.

- [ ] 🟥 **Step 2: Per-KPI-run visibility / lineage log** *(RICE 16.0)*
  - [ ] 🟥 Add a `kpiRunLog` array to `pipeline-run.json` (or a new `out/kpi-lineage.json`). Each entry: `{ kpiId, replayStatus: "ok" | "skipped" | "failed", value?, ruleId, sourceId, reason? }`.
  - [ ] 🟥 Populate from the BI stage output so any reviewer can open one file and see: "for this run, KPI X = sufficient because … / insufficient because …".
  - [ ] 🟥 Surface in QC UI (new `/transparency/kpi-lineage` route or extend existing `/transparency/kpi-dictionary`).

- [ ] 🟥 **Step 3: Honest sufficiency + per-KPI provenance** *(RICE 10.0)*
  - [ ] 🟥 Implement `provenanceForKpi(kpiId, replayResults)` helper (e.g. `src/pipeline/provenance-for-kpi.ts`): maps each `kpiId` to the provenance from its own replay (or a dictionary-derived "pending" bundle); never copies the leads provenance to unrelated KPIs.
  - [ ] 🟥 Replace `dataSufficiency` in `stub-cards.ts` ROWS table with a resolver: `status === "replayed"` and replay succeeded → `sufficient`; otherwise → `insufficient`.
  - [ ] 🟥 Remove or guard `stubValueSpec` hardcoded values so they cannot appear as headline numbers without a backing replay.
  - [ ] 🟥 Update `buildUserKpiContexts` in `bi-stage.ts` to return a per-KPI replay map instead of only `leadsTotal` + `leadsProvenance`.
  - [ ] 🟥 Update `validateAcMix` / `repairCardsIfNeeded` in `repair-cards.ts` to accept honest sufficiency splits (the mix will shift from 3+3 to mostly-insufficient until new replays land).
  - [ ] 🟥 Update tests: `shared-kpi-across-users.test.ts` (same `kpiId` → same provenance across users), `stub-cards-ac.test.ts`, review gates.

### P1 — Real trends

- [ ] 🟥 **Step 4: Period-over-period replay** *(RICE 5.3)*
  - [ ] 🟥 Define a `ReplayPeriodPair` type: `{ current: ReplayResult, prior: ReplayResult | null }`.
  - [ ] 🟥 For KPIs with a working replay (initially `kpi.pipeline.leads_total` and `custom_shifts`), run the replay function twice: once for the "current" window, once for "prior" window (window size configurable, default 7 days or 1 month depending on data grain).
  - [ ] 🟥 Compute `changePct` and `changeLabel` from the pair; if `prior` is null → `changePct: null`, `changeLabel: "Not enough history"`.
  - [ ] 🟥 Wire into `stub-cards.ts` and `llm.ts` merge so both stub and LLM paths use real deltas.

### P2 — Benchmarks

- [ ] 🟥 **Step 5: Benchmark table v0** *(RICE 1.0)*
  - [ ] 🟥 Create `data/benchmarks/benchmarks-v0.json` with shape: `{ kpiId, segment, stage, benchmarkValue, source, sourceUrl, caveat }`.
  - [ ] 🟥 Curate a small set (even 3–5 KPIs) from public SaaS benchmarks with proper citations.
  - [ ] 🟥 Create a `benchmarkForKpi(kpiId, orgContext)` lookup that returns a benchmark string + URL, or `undefined` if no match.
  - [ ] 🟥 Wire into `SignalExpanded.benchmarkComparison` in stub and LLM paths; `gateBenchmarkClaims` gate already enforces citation + caveat.

### P3 — Causal / related signals

- [ ] 🟥 **Step 6: Structured related-signals v0** *(RICE 0.5)*
  - [ ] 🟥 Add optional `relatedKpis?: Array<{ kpiId: string; relationship: string; direction?: "leading" | "lagging" | "correlated" }>` to `SignalExpanded` schema and type.
  - [ ] 🟥 Populate from a small static map (e.g. "churn risk → NPS → revenue at risk") in `kpi-spec` or a new `data/kpi-relationships.json`.
  - [ ] 🟥 Surface in QC UI expanded view; pass to LLM prompt so narrative can reference real edges.
  - [ ] 🟥 *(Optional later)* Evaluate graph MCP or vector search for discovery across a growing KPI catalogue.

## Sequencing summary

```
Week 1–2 ──► Step 1 (spec metadata) + Step 2 (lineage log)   ← P0, low effort
Week 2–4 ──► Step 3 (honest sufficiency + provenance)         ← P0, core trust
Week 4–6 ──► Step 4 (real trends)                             ← P1
Week 6+  ──► Step 5 (benchmarks) + Step 6 (causal)            ← P2/P3, as data arrives
```

## Related docs

- [`plans/implementation/IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md`](IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md) — overlaps heavily with Step 3; treat this plan as the prioritised sequencing wrapper.
- [`docs/testing/signal-card-correctness-uat.md`](../../docs/testing/signal-card-correctness-uat.md) — UAT criteria that will need updating after Step 3.
- [`docs/implementation/MVD_V1_1_ARTIFACTS.md`](../../docs/implementation/MVD_V1_1_ARTIFACTS.md) — artifact map (add `kpi-lineage.json` after Step 2).
