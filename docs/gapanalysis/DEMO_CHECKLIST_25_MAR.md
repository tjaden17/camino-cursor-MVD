# MVD demo checklist — 25 Mar (lightweight)

Maps **Refined AC** items from [`release acceptance criteria/Refined AC for 25 Mar`](../release%20acceptance%20criteria/Refined%20AC%20for%2025%20Mar) to **what to click** in the local signal preview. Assumes `npm run pipeline -- --skip-llm` and `npm run qc-ui:dev` (see [`docs/runbooks/AC1_OPERATOR_RUNBOOK.md`](../runbooks/AC1_OPERATOR_RUNBOOK.md)).

| AC # | Criterion (short) | In preview |
|------|-------------------|------------|
| **AC1** | Onboarding saved / normalised / stored | Show `data/onboarding/` (and optionally `data/user-onboarding/`) files + `npm run validate:onboarding` in terminal — not a preview button. |
| **AC2** | 3 **requested** signals, sufficient data — overview, expanded, different card | User **surge** or **sam** → cards **0, 1, 2** (indices). Use **Next** / dots. Expand: **Analysis & synthesis** + **Takeaway**. |
| **AC3** | Toggle Surge & Sam | Top **user** dropdown: **surge** ↔ **sam**. |
| **AC4** | 3 **recommended** signals, sufficient — overview, expanded, **why recommended**, different card | Cards **4, 5, 6**. Check badges **Recommended** + **Sufficient data**; section **Why it’s recommended**; then expanded body. |
| **AC5** | 3 **recommended** signals, **insufficient** — overview, expanded content incl. **why recommended**, missing data, **sourcing tips**, different card | Cards **7, 8, 9**. Badges **Recommended** + **Insufficient data**; **Why it’s recommended**; **Insufficient data** + **Tips to source data**. |
| **AC6** | Architecture / modular instructions | Point to [`docs/architecture/MVD_ARCHITECTURE_AND_DATA_FLOW.md`](../architecture/MVD_ARCHITECTURE_AND_DATA_FLOW.md) and `prompts/` — not in preview UI. |
| **AC7** | 1 **requested** signal, **insufficient** | Card **3** (index **3**). Badges **Requested** + **Insufficient data**; **Tips to source data**; no fabricated KPI value in overview. |

**Card index reference (stub order, both users):**

| Index | request × sufficiency | Notes |
|-------|------------------------|--------|
| 0–2 | requested + sufficient | AC2 |
| 3 | requested + insufficient | AC7 |
| 4–6 | recommended + sufficient | AC4 |
| 7–9 | recommended + insufficient | AC5 |

**E13 (shared org):** For the same **card index** on **surge** vs **sam**, KPI **values** and **provenance** match; copy may differ where the stub uses the person’s name.

Full QC dashboard / AC↔card report in CI output → backlog **QC-1**.
