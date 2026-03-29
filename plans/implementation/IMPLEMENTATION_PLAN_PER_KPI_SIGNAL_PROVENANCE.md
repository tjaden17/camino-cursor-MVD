# Implementation Plan — Per-KPI signal provenance & honest sufficiency

**Overall Progress:** `0%`

## TLDR

Signal cards today reuse **one** leads provenance for every KPI in [`stub-cards.ts`](../../src/pipeline/stub-cards.ts) and use **fabricated** headline values for many KPIs. Fix by: **(1)** **per-`kpiId` provenance** (distinct `ruleId`, **formula**, honest `sourceId` / path); **(2)** **correctly classify** each card as **sufficient** vs **insufficient** from **real pipeline rules** (replay success, required datasets, [`KPI_DICTIONARY`](../../src/kpi/rules.ts) `status`); **(3)** **never show a made-up headline number** — only values backed by an agreed replay or honest insufficient path. **E13** unchanged: same `kpiId` → same facts and provenance for Surge vs Sam.

## Product intent (user-confirmed)

- Trust: numbers match definitions where shown; provenance backs claims.
- **Sufficiency is computed**, not hardcoded for the whole deck: each KPI is **sufficient** only when data + rules support the metric; otherwise **insufficient** with actionable gaps.
- **No invented KPI values** per card (no generic `%`, no reusing leads count for non-leads KPIs).
- Formula visible in provenance; hybrid “why recommended” + onboarding where applicable.

## Decisions locked (implementation)

| Topic | Decision |
|--------|------------|
| **Sufficiency** | **`dataSufficiency`** per card comes from **pipeline logic** (e.g. replay available + `status === "replayed"` → sufficient with real value; missing inputs / no replay / illustrative-only → **insufficient**). **Not** a blanket “all sufficient” or “all insufficient” stub deck. |
| **Headline values** | **`currentValue`** (and change fields) only when the card is **sufficient** and the value is produced by the **defined replay or validated calc** for that `kpiId`. Otherwise **"—"** / withheld per insufficient contract. |
| **Provenance** | **Distinct** per `kpiId`: **`ruleId`**, **`formulaDescription`**, **`sourceId`** / path from replay result or dictionary — **never** copy the leads bundle onto unrelated KPIs. |
| **Leads KPI** | If Zoho leads extract replays cleanly, **`kpi.pipeline.leads_total`** may be **sufficient** with real count + leads provenance samples; **other** KPIs stay insufficient until their replays exist. |
| **AC mix validation** | [`validateAcMix`](../../src/pipeline/repair-cards.ts) today assumes a **fixed** mix (3+1 requested, 3+3 recommended by sufficiency). **Update** validation to match **honest** outputs: e.g. **flexible counts**, **ranges**, or **manifest-driven** expectations — avoid failing CI when the real sufficiency split changes. |
| **Shifts / proxy** | Optional later: separate **`kpiId`** + replay + labelling if product defines a proxy metric. |

## Critical Decisions (technical)

- **Decision 1:** **`provenanceForKpi(kpiId, leadsReplay, …)`** — single builder: map `kpiId` → replay-backed bundle when a replay runs for that KPI; else dictionary + resolved path + formula text; **sampleRows** only from the replay that produced the card’s value.
- **Decision 2:** **`KPI_DICTIONARY`** — unique **`ruleId`**, honest **`sourceId`** / **`formulaSummary`** / **`status`**; drives sufficiency policy and transparency UI.
- **Decision 3:** **`UserKpiContext`** — **`leadsReplay`** (and optional per-replay results map as you add replays); **remove** `leadsProvenance` as the one-size-fits-all for all cards.
- **Decision 4:** **[`stub-cards.ts`](../../src/pipeline/stub-cards.ts)** — replace hardcoded **`dataSufficiency`** in **`ROWS`** and **`stubValueSpec`** fiction with a **resolver** (or pipeline stage output) that sets sufficiency + values from **rules + replay outcomes**.
- **Decision 5:** **[`gateNoLeadsReuse`](../../src/review/gates.ts)** — remains relevant whenever **sufficient** cards exist; ensures non-leads sufficient cards don’t reuse the leads numeric value.

## Tasks

- [ ] 🟥 **Step 1: Sufficiency + value policy**
  - [ ] 🟥 Define per-`kpiId` rules: which **`replay*`** (if any) must succeed for **sufficient**; map **`KPI_DICTIONARY`** `status` (`replayed` / `proxy` / `illustrative`) to **sufficient vs insufficient** behaviour (no fake sufficient for illustrative-only).
  - [ ] 🟥 Remove or gate **`stubValueSpec`** hardcoded literals so they **cannot** appear as headline values without a replay.

- [ ] 🟥 **Step 2: Dictionary metadata**
  - [ ] 🟥 Unique **`ruleId`** per entry; honest **`sourceId`** / **`formulaSummary`** (no blanket `RULE_LEADS_ROW_COUNT` for every KPI).

- [ ] 🟥 **Step 3: `provenanceForKpi` helper**
  - [ ] 🟥 Implement e.g. [`src/pipeline/provenance-for-kpi.ts`](../../src/pipeline/provenance-for-kpi.ts): per `kpiId`, build **`ProvenanceBundle`** from the **same** replay/dictionary entry that backs the card; **no** shared leads provenance for unrelated KPIs.

- [ ] 🟥 **Step 4: Stub / card builder**
  - [ ] 🟥 Build each card from **resolver output**: branch **sufficient** (overview + expanded + real provenance) vs **insufficient** (overview + insufficient body + honest provenance for “what would be needed”).
  - [ ] 🟥 Wire **`provenanceForKpi`** on **overview**; **expanded** provenance when expanded exists.

- [ ] 🟥 **Step 5: Context + BI**
  - [ ] 🟥 Extend **`UserKpiContext`** / BI stage with **`leadsReplay`** and any additional replay results needed for sufficiency.

- [ ] 🟥 **Step 6: AC mix + `repair-cards`**
  - [ ] 🟥 Change **`validateAcMix`** / **`repairCardsIfNeeded`** to accept **honest** sufficiency splits (document expected behaviour in code comments).
  - [ ] 🟥 Update UAT / docs that assumed fixed **3+3** sufficient splits.

- [ ] 🟥 **Step 7: Recommended rationale + onboarding (hybrid)**
  - [ ] 🟥 Thread onboarding goals into **stub** and **LLM** `recommendationRationale` where applicable.

- [ ] 🟥 **Step 8: Tests + gates**
  - [ ] 🟥 [`shared-kpi-across-users.test.ts`](../../src/pipeline/shared-kpi-across-users.test.ts): same `kpiId` → same value + provenance across users.
  - [ ] 🟥 Provenance differs across **different** `kpiId`s.
  - [ ] 🟥 [`stub-cards-ac.test.ts`](../../src/pipeline/stub-cards-ac.test.ts) and **review gates** / **CI** updated for new behaviour.

- [ ] 🟥 **Step 9: UI spot-check**
  - [ ] 🟥 Preview: **sufficient** cards show numbers only where replay-backed; **insufficient** cards show gaps + formula in provenance; **no** duplicate leads provenance on every card.

- [ ] 🟥 **Step 10 (optional): Additional replays / proxy**
  - [ ] 🟥 New `replay*` functions and KPIs as data becomes available.

## Related

- M-7 / signal correctness.
- [`docs/testing/signal-card-correctness-uat.md`](../../docs/testing/signal-card-correctness-uat.md).
