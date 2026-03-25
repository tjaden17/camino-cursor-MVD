# Implementation Plan

**Overall Progress:** `93%`

## TLDR

Build **MVD (Minimum Viable Data)** so you can **quality-check AI-produced outputs**: KPIs/calcs/deltas/badges (objective lane) and narrative/synthesis (subjective lane), aligned with [Instructions to build MVD v1](file:///Users/nhattran/Library/Application%20Support/Cursor/User/workspaceStorage/975aa641bf03acce7ef7927a6746c0b0/pdfs/7a7e1a0b-08a4-4952-a94d-65236e51ea5e/Instructions%20to%20build%20MVD%20v1.pdf). Use real extracts under `data/` and domain context from [Interview & Research Notes (Locumate-Sam)](file:///Users/nhattran/Library/Application%20Support/Cursor/User/workspaceStorage/975aa641bf03acce7ef7927a6746c0b0/pdfs/b3b4c1ae-2e87-4c88-9b34-bbbde2b96d9f/Interview%20%26%20Research%20Notes%20(Locumate-Sam).pdf). **Success metrics stay open** until first AI runs; focus on **process**: replayable numbers + reviewable narratives + provenance.

## Critical Decisions

- **Hybrid QC** — Deterministic **replay/diff** for numbers; **human rubric** (optional LLM hint, not gate) for narrative. Rationale: correctness vs usefulness are different problems.
- **Parallel lanes** — Pass/fail **numeric** and **narrative** lanes separately so one does not block learning.
- **Fixtures from `data/`** — Map real columns from onboarding, Zoho, and custom CSVs into a normalized model; add edge-case subsets as needed.
- **Provenance first** — “Signal–What we found” style: source, calc, sample rows—supports both **trust** and **QC**.
- **Thin validation before full UI** — Lock **JSON/contracts + debug/replay tooling** before investing in Vue/Nuxt signal cards (per MVD “least complexity”).
- **Stack (from your doc)** — Vue/Nuxt front, Node back, DB TBD (Postgres is a sensible default when you persist), AI provider TBD (Gemini / OpenAI / Claude).

## Tasks

- [x] 🟩 **Step 1: Canonical output contract**

  - [x] 🟩 Define JSON/schema for signal overview, expanded signal, weekly brief slice, insufficient-data card (per MVD doc). (`schemas/*.json`, `src/types/contracts.ts`)
  - [x] 🟩 Document required provenance fields (source id, time range, formula/SQL or rule id, sample row refs). (`ProvenanceBundle` in `src/types/contracts.ts`)

- [x] 🟩 **Step 2: Ingest model + column mapping**

  - [x] 🟩 Map `data/onboarding/User profile-Surge.csv`, `data/zoho/*.csv`, `data/custom/*.csv` to normalized entities/fields agents can use. (`src/ingest/mapping.ts`)
  - [x] 🟩 Note gaps vs interview priorities (signups, shifts, jobs, seekers, adoption, Zoho hygiene caveats). (`docs/DATA_MAPPING.md`)

- [x] 🟩 **Step 3: Golden fixtures & expected behavior**

  - [x] 🟩 From workspace CSVs (and/or small synthetic cuts), define expected KPIs/deltas/badges for at least one scenario; include nulls / period-boundary / duplicate edge cases where relevant. (`fixtures/golden/*.json` — leads total, shifts Sep 2025)
  - [x] 🟩 Freeze “expected” outputs for replay comparison (tolerances for rounding documented). (`tolerance: 0` in golden fixtures; `src/qc/numeric-diff.ts`)

- [x] 🟩 **Step 4: Numeric lane — replay & diff**

  - [x] 🟩 Recompute KPIs/deltas/badges from stored inputs (rules or SQL agreed for MVD). (`src/kpi/rules.ts`)
  - [x] 🟩 Diff AI/stored output vs replay; pass/fail with clear tolerance rules. (`src/qc/numeric-diff.ts`, `npm run qc`)

- [x] 🟩 **Step 5: Narrative lane — rubric**

  - [x] 🟩 Short human rubric: grounded in metrics? internal contradictions? weekly-brief rules (e.g. no action prescriptions if spec says exec decides)? (`rubric/narrative-rubric.md`)
  - [x] 🟩 Optional: LLM critique as hint only, not acceptance. (Documented in rubric; no automated LLM call in repo)

- [x] 🟩 **Step 6: Insufficient-data QC**

  - [x] 🟩 Validate schema: lists missing data, explains why, does not invent numbers. (`src/qc/insufficient.ts`, `fixtures/samples/insufficient-data-*.json`)

- [x] 🟨 **Step 7: Minimal surfaces**

  - [x] 🟩 Thin debug/provenance UI or CLI that shows numbers + provenance bundle (before full Nuxt signal scrolling). (`npm run qc` → `out/qc-report.html`; `npm run serve:debug`)
  - [ ] 🟥 After shapes stabilize, align with Vue/Nuxt signal cards per MVD. *(Deferred — next phase.)*

---

**Progress note:** Subtasks under Step 7.2 remain for a future Nuxt build; QC pipeline and contracts are in place.
