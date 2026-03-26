# Gap analysis — 25 Mar acceptance criteria vs current codebase

**Date:** 2026-03-25 (updated with product responses 2026-03-25)  
**Role:** CTO/CPO view — user needs first, then technical implications.

## Sources reviewed

- Acceptance criteria: [`release acceptance criteria/Refined AC for 25 Mar`](../release%20acceptance%20criteria/Refined%20AC%20for%2025%20Mar)
- Release / product intent: [`decisions/Instructions to build MVD v1.1 (w AC).txt`](../decisions/Instructions%20to%20build%20MVD%20v1.1%20(w%20AC).txt) (excerpt + checklist themes)
- Architecture: [`docs/architecture/MVD_ARCHITECTURE_AND_DATA_FLOW.md`](../architecture/MVD_ARCHITECTURE_AND_DATA_FLOW.md)
- Implementation snapshot: pipeline (`src/pipeline/`), preview (`apps/qc-ui/pages/preview/signal.vue`, `server/api/preview/signal.get.ts`), contracts/schemas (`src/types/contracts.ts`, `schemas/insufficient-data.json`)

---

## Product responses (decisions on gaps)

| Ref | Gap summary | Decision |
|-----|-------------|----------|
| **A1** | No explicit UI labels for requested/recommended, sufficient/insufficient | **Create explicit UI labels** in preview. |
| **A2** | “Why recommended” not a dedicated block | **Create a new section** in the UI (and backing fields). |
| **A3** | No sourcing tips field | **Extend the model** (schema, pipeline, stub/LLM, UI) — full vertical slice. |
| **A4** | (Same theme as A2 for insufficient **recommended** cards) | Covered by **A2 + A3** (recommendation rationale on insufficient recommended rows). |
| **A5** | Scroll metaphor vs numeric index | **Carousel** for MVD preview. |
| **A6** | Separate guided overview/expanded mode | **Accept as-is** — single page with sections is fine. |
| **B7** | AC1 operator path | Operator saves files (template preferred), uploads to **`data/user-onboarding/`** (folder created; wiring/docs in [`IMPLEMENTATION_PLAN_GAP_CLOSE_25_MAR.md`](../../plans/implementation/IMPLEMENTATION_PLAN_GAP_CLOSE_25_MAR.md)). |
| **B8** | Persistence beyond git | **Out of MVD** — **database** targeted for **minimum sellable service**; tracked in [`plans/backlog/PRODUCT_BACKLOG.md`](../../plans/backlog/PRODUCT_BACKLOG.md) **DB-1**. |
| **C9** | Weekly brief + DB from full Instructions | **Not in scope for MVD** — **backlog** (**MSS-1**). |
| **C10** | Public / benchmark data ingestion | **Backlog** (**DATA-1**). |
| **D11** | QC: AC ↔ card mapping in report | Lightweight **demo checklist** in MVD (gap-close plan Step 6); **full QC report** → backlog **QC-1**. |
| **D12** | Live Claude for demo | **MVD:** avoiding Claude / stub demo **OK**; **MVD 1.1** includes demo with **real API** — **backlog** (**REL-1**). |
| **E13** | Surge vs Sam differentiation | **Same org, same CSVs:** signal **numbers and provenance** for a given KPI must **match** across users when the KPI is shared. **Same KPI allowed for both** if relevant. **No** same `kpiId` with **different** underlying data between users. Copy may differ via onboarding context. |

**Earlier clarifications (also locked in [`IMPLEMENTATION_PLAN_3.md`](../../plans/implementation/IMPLEMENTATION_PLAN_3.md)):** 25 Mar demo may use **deterministic stub**; **file-based** storage for this release.

---

## What is already in good shape (context, not gaps)

- **Two users (`surge` / `sam`):** Onboarding-derived JSON + pipeline can emit per-user `processed-signals.json`.
- **Ten cards per user with the intended category mix** (3 requested+sufficient, 3 recommended+sufficient, 3 recommended+insufficient, 1 requested+insufficient) in deterministic stub order (`src/pipeline/stub-cards.ts`).
- **Preview without login, local:** Nuxt qc-ui; API prefers `out/processed-signals.json` when present.
- **User toggle + card index:** Surge/Sam selector and numeric card index to step through cards.
- **Architecture story for builders:** Data flow doc, SVG, `prompts/` for instruction tuning.
- **Quality tooling:** QC CLI, golden replay, schema checks; CI runs deterministic pipeline (`--skip-llm`).

---

## Full gap list (what could still block or weaken sign-off)

### A. User-visible experience vs AC2–AC7

1. **No explicit UI labels** for **requested vs recommended** or **sufficient vs insufficient** — reviewers must infer from copy or `kpiId`/title. → **Response: A1**
2. **AC4 — “Why it’s recommended”:** Expanded narrative does not have a **dedicated** section or field. → **Response: A2**
3. **AC5 & AC7 — “Tips for practically sourcing the data”:** No first-class sourcing tips. → **Response: A3**
4. **AC5 — “Why it’s recommended” on insufficient recommended cards:** Same as (2) for insufficient branch. → **Response: A2 + A3**
5. **Interaction model vs “scroll” metaphor:** Preview uses numeric index. → **Response: A5 (carousel)**
6. **“Expanded” vs separate views:** Single page. → **Response: A6 (OK)**

### B. AC1 — Onboarding lifecycle (process + evidence)

7. **Call → saved → normalised → stored** operator story. → **Response: B7** (`data/user-onboarding/` + gap-close plan)
8. **Persistence beyond git / DB** vs Instructions. → **Response: B8** (backlog **DB-1**)

### C. MVD Instructions (broader than 25 Mar AC)

9. **Weekly brief** and **database-backed** processed data. → **Response: C9** (backlog **MSS-1**)
10. **Public / benchmark data** ingestion. → **Response: C10** (backlog **DATA-1**)

### D. Quality check / sign-off rigour

11. **AC mix / index mapping** for reviewers. → **Response: D11** (checklist + backlog **QC-1**)
12. **Live Claude demo path.** → **Response: D12** (MVD stub OK; **REL-1**)

### E. Differentiation and realism

13. **Surge vs Sam** content rules for shared org. → **Response: E13**

---

## Top 3 gaps (prioritised) — still valid as themes

1. **Card content + UI (A1–A4, A3)** — labels, why recommended, sourcing tips.  
2. **Navigation (A5)** — carousel + demo checklist (D11 light).  
3. **AC1 path (B7)** + **shared metrics rule (E13)** — upload folder, runbook, pipeline refactor.

Execution order and tasks: [`IMPLEMENTATION_PLAN_GAP_CLOSE_25_MAR.md`](../../plans/implementation/IMPLEMENTATION_PLAN_GAP_CLOSE_25_MAR.md).

---

## Suggested order of work (updated)

1. **E13 + model extensions** (shared KPI data; add schema fields).  
2. **Pipeline / stub / prompts** populate new copy.  
3. **Preview:** labels, sections, carousel.  
4. **B7** finish wiring + runbook.  
5. **Demo checklist** + backlog grooming for DB / MVD 1.1 / weekly brief.

---

## Clarifications — resolved

| Question | Answer |
|----------|--------|
| Stub-only demo for 25 Mar? | **Yes** (see `IMPLEMENTATION_PLAN_3` Decision 8). |
| File-based storage for this release? | **Yes** (Decision 9); DB later. |
