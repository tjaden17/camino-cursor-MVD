# Implementation Plan — MVD v1.1 manual UAT readiness

**Overall Progress:** `0%`

**Source checklist:** [`docs/testing/mvd-v1-1-uat.md`](../../docs/testing/mvd-v1-1-uat.md)

## TLDR

Make the **manual UAT** in `mvd-v1-1-uat.md` **runnable and meaningful**: same preconditions (validate → pipeline → QC UI), **green** automated checks where listed (M-10), and **product-trust fixes** for signal preview (M-7–M-9) via [`IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md`](IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md). Broader v1.1 delivery remains in [`IMPLEMENTATION_PLAN_MVD_V1_1.md`](IMPLEMENTATION_PLAN_MVD_V1_1.md). **Release bar** is still automation-first (Decision 14); this plan is **readiness to execute optional UAT**, not a second release definition.

## Critical Decisions

- **Decision 1:** **Do not fork AC** — UAT steps trace to existing plans; this file only **groups** work by M-test id for execution order.
- **Decision 2:** **M-7 / M-8 / M-9** — implement **per-KPI provenance + honest sufficiency** per [`IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md`](IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md); sub-UATs [`signal-preview-uat.md`](../../docs/testing/signal-preview-uat.md) / [`signal-card-correctness-uat.md`](../../docs/testing/signal-card-correctness-uat.md) are **conditional** on deck shape (see UAT M-7).
- **Decision 3:** **M-5** (Surge vs Sam KPI lists) — **transparency/strategy** behaviour is separate from provenance fixes; track under strategy/onboarding if product requires divergent lists.
- **Decision 4:** **M-6** (dense org-context JSON) — treat as **UI/readability** polish; optional scope unless product elevates it.

## Tasks

- [ ] 🟥 **Step 1: Preconditions & operator path (M-preflight)**
  - [ ] 🟥 Confirm [`docs/runbooks/AC1_OPERATOR_RUNBOOK.md`](../../docs/runbooks/AC1_OPERATOR_RUNBOOK.md) matches UAT preconditions (`validate:onboarding`, `validate:kpi-spec`, `build`, pipeline A or B, `qc-ui:dev`).
  - [ ] 🟥 Keep [`docs/explainers/optional-npm-sanity-checks-explainer.md`](../../docs/explainers/optional-npm-sanity-checks-explainer.md) aligned with M-10 commands.

- [ ] 🟥 **Step 2: Data & onboarding (M-1, M-2, M-3)**
  - [ ] 🟥 M-1: CSV → JSON path and `npm run onboarding:csv` documented; `validate:onboarding` clean for demo files.
  - [ ] 🟥 M-2: Pipeline emits `out/org-context.json`; `/transparency/org-context` loads without 404 when `out/` exists.
  - [ ] 🟥 M-3: `data/zoho/README.md` and `data/custom/README.md` state drop-zone expectations.

- [ ] 🟥 **Step 3: KPI spec & catalogue (M-4, M-6)**
  - [ ] 🟥 M-4: `npm run validate:kpi-spec` passes; `data/kpi-spec/kpi-spec-v1.json` matches product intent.
  - [ ] 🟥 M-6: Strategy catalogue JSON present after pipeline; 12+6 structure spot-checkable (per v1.1 plan).

- [ ] 🟥 **Step 4: Signal trust — preview & dictionary (M-7, M-8, M-9)**
  - [ ] 🟥 Execute [`IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md`](IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md) (per-KPI provenance, sufficiency policy, no fabricated headline values).
  - [ ] 🟥 After Step 4: re-run UAT M-7 core checks; adapt linked TW / signal-card-correctness steps per UAT **conditional** notes.
  - [ ] 🟥 M-8: per-KPI **missing data** + tips distinct where implementation provides them.
  - [ ] 🟥 M-9: dictionary **open preview** traceability; provenance **formula** readable on multiple KPIs.

- [ ] 🟥 **Step 5: Transparency — recommendations (M-5)**
  - [ ] 🟥 Validate `/transparency/recommendations` shows role, goals, lists, shared vs user-specific badges.
  - [ ] 🟥 If product requires **different** Surge vs Sam KPI sets, schedule strategy/onboarding work (out of scope for per-KPI provenance plan only).

- [ ] 🟥 **Step 6: Automation bar (M-10)**
  - [ ] 🟥 `npm run review:gates`, `npm run review:v11`, `npm run qc` succeed on the same `out/` used for UAT (typically pipeline option A for CI parity).

- [ ] 🟥 **Step 7: Copy & trust spot-check (M-11)**
  - [ ] 🟥 With option B pipeline when needed: LLM copy passes subjective M-11; optional [`signal-copy-compare-workflow.md`](../../docs/testing/signal-copy-compare-workflow.md).

- [ ] 🟥 **Step 8: Documentation DoD (M-12)**
  - [ ] 🟥 Architecture md/svg and `IMPLEMENTATION_PLAN_MVD_V1_1.md` status match what you tell UAT reviewers.

- [ ] 🟥 **Step 9 (optional): Org-context UX (M-6 feedback)**
  - [ ] 🟥 Improve readability of `/transparency/org-context` if dense JSON blocks UAT sign-off.

## Related

- [`docs/testing/mvd-v1-1-uat.md`](../../docs/testing/mvd-v1-1-uat.md) — manual test cases M-1…M-12
- [`IMPLEMENTATION_PLAN_MVD_V1_1.md`](IMPLEMENTATION_PLAN_MVD_V1_1.md) — unified v1.1 AC
- [`IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md`](IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md) — signal provenance & sufficiency
