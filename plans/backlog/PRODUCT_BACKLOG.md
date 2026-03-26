# Product backlog — Camino MVD → sellable service

**This file is the product-facing view.** Execution detail lives in **[`plans/`](../README.md)** — implementation plans under **`plans/implementation/`** are the **default source of truth** for what gets built. **Keep them aligned:** when you change one, update the other (see [`../README.md`](../README.md) sync rules).

---

## How this works with implementation plans

| Question | Answer |
|----------|--------|
| Where is “what we’re building **now**”? | The **active implementation plan(s)** in `plans/implementation/` (tasks + %). |
| Where do future ideas and priorities live? | **Here** — Backlog columns + **Target plan** when batched. |
| Where is “what already shipped”? | **Shipped** section below — each row points to the **plan** that delivered it. |
| I only update the backlog | Also update or create the **implementation plan** the item belongs to, or note **Target plan: TBD**. |
| I only update an implementation plan | Also update **Shipped** or backlog rows when something completes or changes scope. |

---

## Shipped (from implementation plans)

*Move rows here when a plan ships; never delete without archiving the plan reference. **Chronological order** (older plans first).*

| When (approx) | Backlog ID | Delivered (summary) | Plan / proof |
|---------------|------------|---------------------|--------------|
| *(earlier phase)* | — | **QC foundation:** JSON schemas + `contracts.ts`, ingest mapping (`data/` CSVs), golden fixtures + numeric replay/diff, insufficient-data QC, narrative rubric, `npm run qc` → `out/qc-report.*`, `serve:debug`. *Plan 1 Step 7 “full Nuxt signal cards” was deferred; superseded by Plan 2 + later plans.* | [`IMPLEMENTATION_PLAN_1.md`](../implementation/IMPLEMENTATION_PLAN_1.md) (~93% — remaining item deferred) |
| *(earlier phase)* | — | **Local Nuxt QC UI:** shared `runQcReport()`, `getRepoRoot()` / `MVD_REPO_ROOT`, `apps/qc-ui` dashboard + validate API, wireframe signal preview + fixture + `/api/preview/signal`. | [`IMPLEMENTATION_PLAN_2.md`](../implementation/IMPLEMENTATION_PLAN_2.md) (100%) |
| 2026-03 | — | MVD pipeline, `out/*.json`, preview + `userId`, CI `pipeline --skip-llm`, validate onboarding | [`IMPLEMENTATION_PLAN_3.md`](../implementation/IMPLEMENTATION_PLAN_3.md) |
| 2026-03 | — | `data/user-onboarding/`, dual-dir `validate:onboarding`, duplicate `user_id` guard | [`IMPLEMENTATION_PLAN_GAP_CLOSE_25_MAR.md`](../implementation/IMPLEMENTATION_PLAN_GAP_CLOSE_25_MAR.md) Step 0 (partial) |
| 2026-03 | — | Gap-close 25 Mar: `recommendationRationale` + `sourcingTips`, E13 tests, preview badges/carousel, [`docs/runbooks/AC1_OPERATOR_RUNBOOK.md`](../../docs/runbooks/AC1_OPERATOR_RUNBOOK.md), [`docs/gapanalysis/DEMO_CHECKLIST_25_MAR.md`](../../docs/gapanalysis/DEMO_CHECKLIST_25_MAR.md) | [`IMPLEMENTATION_PLAN_GAP_CLOSE_25_MAR.md`](../implementation/IMPLEMENTATION_PLAN_GAP_CLOSE_25_MAR.md) Steps 1–6 |
| 2026-03 | QCX-1…QCX-4 | **QC UI hardening:** preview API safe reads/parse + `createError`; dashboard validate wraps `$fetch`; `run`/`validate` APIs handle missing `dist/`; shared [`types/signal-preview.ts`](../../apps/qc-ui/types/signal-preview.ts) | [`IMPLEMENTATION_PLAN_QCX_UI_HARDENING.md`](../implementation/IMPLEMENTATION_PLAN_QCX_UI_HARDENING.md) |

*Backlog IDs above are “—” when delivery was plan-driven only (no prior backlog row). When `DB-1` ships, add a row here with `DB-1` and the plan name.*

---

## Kanban columns

| Column | Meaning |
|--------|---------|
| **Backlog** | Not started; idea or future release. May include **Target plan** for batching. |
| **In progress** | Actively building — should mirror an **In progress** section in a named implementation plan. |
| **Ready for PM review** | Demoable; needs product acceptance. |
| **Ready for full testing** | PM-approved; regression / integration. |
| **Ready for prod** | Approved to ship when the window allows. |

---

## Backlog

| ID | Item | Notes | Target plan |
|----|------|-------|-------------|
| DB-1 | **Database persistence** for processed signals and related entities | Minimum sellable service; beyond git files. | TBD — e.g. `IMPLEMENTATION_PLAN_*` when scoped |
| MSS-1 | **Weekly brief** product slice + delivery mechanism | Out of scope for 25 Mar MVD. | TBD |
| DATA-1 | **Public / benchmark data** ingestion | Future enrichment. | TBD |
| REL-1 | **MVD 1.1** — demo + recording with **real Claude API** | CI strategy separate from PRs. | TBD — suggest `IMPLEMENTATION_PLAN_MVD_1_1.md` when started |
| QC-1 | **AC ↔ card index** mapping in QC report or dashboard | Full sign-off tooling; lightweight demo checklist shipped in [`docs/gapanalysis/DEMO_CHECKLIST_25_MAR.md`](../../docs/gapanalysis/DEMO_CHECKLIST_25_MAR.md). | TBD |
| SIG-1 | **Signal card "rightness" uplift (umbrella)** | Parent issue: [`backlog/issue-SIG-1-signal-card-rightness-llm-and-transparency.md`](../../backlog/issue-SIG-1-signal-card-rightness-llm-and-transparency.md). Tracked by child issues SIG-1.1/SIG-1.2/SIG-1.3 below. Review-updated 2026-03-27 using [`docs/signal-review-2026-03-27.md`](../../docs/signal-review-2026-03-27.md). | TBD — suggest `IMPLEMENTATION_PLAN_SIGNAL_CARD_RIGHTNESS.md` |
| SIG-1.1 | **LLM prompt iteration loop for signal quality** | Child issue: [`backlog/issue-SIG-1.1-llm-prompt-iteration-loop.md`](../../backlog/issue-SIG-1.1-llm-prompt-iteration-loop.md). Fast tweak -> rerun -> compare workflow. Review-updated 2026-03-27. | TBD |
| SIG-1.2 | **User KPI recommendation transparency page** | Child issue: [`backlog/issue-SIG-1.2-user-kpi-recommendation-transparency-page.md`](../../backlog/issue-SIG-1.2-user-kpi-recommendation-transparency-page.md). Show requested vs recommended KPI sets per user. Review-updated 2026-03-27. | TBD |
| SIG-1.3 | **KPI calculation dictionary page (org-level)** | Child issue: [`backlog/issue-SIG-1.3-kpi-calculation-dictionary-page.md`](../../backlog/issue-SIG-1.3-kpi-calculation-dictionary-page.md). Show normalized formulas + replay mapping. Review-updated 2026-03-27. | TBD |
| SIG-1.4 | **Post-review hardening follow-ups (27 Mar)** | Address review findings: stronger personalization gate semantics, structured CLI logging, safer transparency API parse errors, KPI deep-link traceability from dictionary to preview, and add `/preview/signal` tab navigation to `transparency/recommendations` and `transparency/kpi-dictionary`. | [`IMPLEMENTATION_PLAN_SIG_REVIEW_FIXES_27_MAR.md`](../implementation/IMPLEMENTATION_PLAN_SIG_REVIEW_FIXES_27_MAR.md) |

---

## In progress

| ID | Item | Owner / note | Plan |
|----|------|--------------|------|
| — | *(none)* | | |

*When work starts, duplicate the row from Backlog here and add the **Plan** link.*

---

## Ready for PM review

| ID | Item | Owner / note |
|----|------|--------------|
| — | *(none)* | |

---

## Ready for full testing

| ID | Item | Owner / note |
|----|------|--------------|
| — | *(none)* | |

---

## Ready for prod

| ID | Item | Owner / note |
|----|------|--------------|
| — | *(none)* | |

---

## Related docs

- **Planning hub (sync rules):** [`../README.md`](../README.md)
- **Shipped plans (archive):** [`../implementation/IMPLEMENTATION_PLAN_1.md`](../implementation/IMPLEMENTATION_PLAN_1.md) · [`../implementation/IMPLEMENTATION_PLAN_2.md`](../implementation/IMPLEMENTATION_PLAN_2.md)
- Gap analysis: [`../../docs/gapanalysis/GAP_ANALYSIS_25_MAR.md`](../../docs/gapanalysis/GAP_ANALYSIS_25_MAR.md)
- MVD implementation: [`../implementation/IMPLEMENTATION_PLAN_3.md`](../implementation/IMPLEMENTATION_PLAN_3.md)
- Gap-close plan: [`../implementation/IMPLEMENTATION_PLAN_GAP_CLOSE_25_MAR.md`](../implementation/IMPLEMENTATION_PLAN_GAP_CLOSE_25_MAR.md)
- Path to prod: [`../implementation/IMPLEMENTATION_PLAN_PATH_TO_PROD.md`](../implementation/IMPLEMENTATION_PLAN_PATH_TO_PROD.md)
