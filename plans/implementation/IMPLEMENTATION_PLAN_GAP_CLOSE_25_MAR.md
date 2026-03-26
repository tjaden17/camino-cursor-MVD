# Implementation Plan — Close 25 Mar AC gaps

**Document status:** Reviewed by CTO on 25 March 2026.

**Overall Progress:** `100%`

Parent context: [`docs/gapanalysis/GAP_ANALYSIS_25_MAR.md`](../../docs/gapanalysis/GAP_ANALYSIS_25_MAR.md) (gaps + **product responses**). MVD core pipeline: [`IMPLEMENTATION_PLAN_3.md`](IMPLEMENTATION_PLAN_3.md). **Planning & backlog sync:** [`../README.md`](../README.md) · [`../backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md).

## TLDR

Close remaining **acceptance-criteria gaps** for 25 Mar: **explicit preview labels**, **dedicated “why recommended” and sourcing-tips content**, **carousel navigation**, **shared org signal data across Surge/Sam**, and **user-upload onboarding path** under `data/user-onboarding/`. Items explicitly deferred (DB, weekly brief, public data, MVD 1.1 real-API demo, rich QC dashboard) live in the **product backlog**.

## CTO review (25 Mar 2026)

- **Recommendation rationale:** Include **“why recommended”** for **recommended** cards in both **sufficient** and **insufficient** cases. For **recommended + insufficient**, rationale must be **distinct from** `whyItMatters`. Property name is flexible (`recommendationRationale` or equivalent).
- **`sourcingTips`:** **`string[]` on insufficient-data cards only** — do not add sourcing tips on sufficient cards.
- **Preview navigation:** **In-page** carousel / stepper (prev–next, optional dots) is enough for this milestone; **no** URL/query deep-linking to card index **for now**.
- **Shared org metrics (E13):** BI already replays **one** shared extract for all users for the current KPIs; Step 3 focuses on **keeping that invariant** as the pipeline grows — **tests and/or prompts** so the same `kpiId` does not diverge per user on numbers/provenance, with **copy** still varying by persona where intended.
- **AC1 runbook:** Publish the one-page operator path under **`docs/runbooks/`** (primary); **not** dependent on **explainers** for operators. Link from root **`README.md`** when appropriate.
- **Demo checklist:** **`docs/gapanalysis/DEMO_CHECKLIST_25_MAR.md`** must **quote the real AC IDs** from [`Refined AC for 25 Mar`](../../release%20acceptance%20criteria/Refined%20AC%20for%2025%20Mar) (not only informal “AC2–AC7” labels).
- **Step 0:** `data/user-onboarding/README.md` — **accepted** as-is on review.

## Critical Decisions (from product responses)

- **Decision 1:** **UI** — Add explicit **requested / recommended** and **sufficient / insufficient** labels; add a **new section** for **why recommended**; extend model for **sourcing tips** (schema + pipeline + preview).
- **Decision 2:** **Navigation** — **Carousel** (or equivalent horizontal stepper) for MVD preview instead of only a numeric index. *(CTO: in-page only for 25 Mar; URL state deferred.)*
- **Decision 3:** **Overview + expanded on one page** — Accept current single-page layout (no separate “guided mode” required).
- **Decision 4:** **AC1 uploads** — Operators save onboarding JSON (template preferred), upload to **`data/user-onboarding/`** (folder created; wiring + docs in tasks below).
- **Decision 5:** **Multi-user, same org** — **Sam and Surge share the same CSV-backed metrics** for the same KPI (no conflicting numbers per user). Cards may repeat the same KPI for both users when relevant; **differentiation** is via **onboarding/context copy**, not different replay values for the same `kpiId`.
- **Decision 6:** **MVD demo** — Deterministic **stub** remains acceptable for recording; **real Claude demo** = **MVD 1.1** backlog item. **Persistence beyond git** = backlog (**minimum sellable service**).

## Tasks:

- [x] 🟩 **Step 0: User onboarding upload folder**
  - [x] 🟩 Add `data/user-onboarding/` with README describing upload + validation/pipeline entry.
  - [x] 🟩 `validate:onboarding` validates **`data/onboarding/`** and **`data/user-onboarding/`** (duplicate `user_id` across folders rejected). See `src/validate-onboarding.ts` + `defaultOnboardingDirPaths` in `load-onboarding.ts`.

- [x] 🟩 **Step 1: Extend contracts + schemas for AC copy**
  - [x] 🟩 Add optional **`recommendationRationale`** (or equivalent) for **recommended** cards (sufficient + insufficient).
  - [x] 🟩 Add **`sourcingTips`** (`string[]`) to **insufficient-data** shape only; update `schemas/insufficient-data.json` and `src/types/contracts.ts`.
  - [x] 🟩 Extend **`ProcessedCard`** / pipeline serialization so preview API can render new fields.

- [x] 🟩 **Step 2: Pipeline + stub + prompts**
  - [x] 🟩 Populate new fields in **`stub-cards.ts`** with deterministic demo copy (tips + why recommended).
  - [x] 🟩 Update **`prompts/signal-copy.md`** / **`kpi-selection.md`** so live Claude runs (when used) emit the same contract.
  - [x] 🟩 Ensure **insufficient recommended** cards carry **recommendation rationale** distinct from **why it matters**.

- [x] 🟩 **Step 3: Shared org metrics for Surge & Sam (E13)**
  - [x] 🟩 Ensure card generation keeps **KPI facts and provenance** for a given `kpiId` **shared** across users (BI already shares current replay; refactor if needed when adding KPIs); only **persona/context strings** vary by `userId` where needed.
  - [x] 🟩 Add a short **comment or unit check** (and tighten **LLM prompts** if needed) so regressions (per-user different numbers for same KPI) fail tests or QC.

- [x] 🟩 **Step 4: Preview UI — labels + sections + carousel**
  - [x] 🟩 Render **badges** (or labels) for requested/recommended and sufficient/insufficient.
  - [x] 🟩 Add **“Why recommended”** section when applicable.
  - [x] 🟩 Add **“Tips to source data”** (or equivalent) for insufficient cards.
  - [x] 🟩 Replace or augment numeric index with **in-page** **carousel** (prev/next + dots/slides) over the current user’s cards (no URL card index for this milestone).

- [x] 🟩 **Step 5: AC1 operator path**
  - [x] 🟩 One-page **runbook** under **`docs/`**: call → template → `data/user-onboarding/` → validate → pipeline → preview (operators should not rely on **explainers** for this path).
  - [x] 🟩 Link from root **`README.md`** if appropriate.

- [x] 🟩 **Step 6: Demo checklist (lightweight MVD)**
  - [x] 🟩 Add **`docs/gapanalysis/DEMO_CHECKLIST_25_MAR.md`**: **quote AC IDs** from Refined AC, map to **card indices** and **what to click** (Surge vs Sam, in-page carousel).
  - [x] 🟩 *(Full QC report / dashboard → see backlog **QC-1**.)*

## Sign-off

When Steps 0–6 are 🟩, re-run demo against [`release acceptance criteria/Refined AC for 25 Mar`](../../release%20acceptance%20criteria/Refined%20AC%20for%2025%20Mar) and tick **`IMPLEMENTATION_PLAN_3.md`** Step 7 optional QC if implemented. **Update** [`../backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) **Shipped** (and backlog rows) in the same change set — see [`../README.md`](../README.md).

## Deferred (see `backlog/PRODUCT_BACKLOG.md`)

- Database persistence (**DB-1**)
- Weekly brief slice (**MSS-1**)
- Public benchmark ingestion (**DATA-1**)
- MVD 1.1 real-API demo (**REL-1**)
- Rich AC/QC reporting (**QC-1**)
