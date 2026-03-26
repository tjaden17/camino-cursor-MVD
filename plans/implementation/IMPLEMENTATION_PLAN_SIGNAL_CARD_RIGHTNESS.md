# Implementation Plan

**Document status:** CTO review decisions incorporated on 27 Mar 2026.

**Overall Progress:** `100%`

## TLDR
Improve signal-card trust and usefulness by: (1) tightening the LLM prompt loop and context wiring, (2) adding a page that makes requested vs recommended KPIs visible per user, and (3) adding a KPI calculation dictionary page so reviewers can verify definitions, formulas, and sources.

## Critical Decisions
Key architectural/implementation choices made during exploration:
- Decision 1: Reuse existing pipeline artifacts (`out/processed-signals.json`, `out/agent-signals.json`) as primary UI data source - keeps implementation aligned with current flow and avoids parallel data paths.
- Decision 2: Pass structured onboarding context into narrative generation in `src/pipeline/llm.ts` - needed to make card copy user-specific (role/goals/pain points/trust).
- Decision 3: Explicitly label KPI calculation status (`replayed`, `proxy`, `illustrative`) in the dictionary page - prevents overstating confidence and improves PM/UAT trust.
- Decision 4: For this delivery, this file is the implementation source of truth; reconcile to one long-term source later.
- Decision 5: Review gates are **scripted**, not manual-only.
- Decision 6: KPI status ownership (`replayed` / `proxy` / `illustrative`) lives in `src/kpi/rules.ts` metadata.
- Decision 7: Execute as one delivery sequence (no split shipment).

## Clarification: "generation source markers" in preview
- "Source marker" means the reviewer can clearly tell where card content came from.
- Minimum acceptable signal:
  - Artifact source label already shown (e.g., `processed-signals.json` vs fixture/stub file).
  - Card-level marker for narrative provenance:
    - `llm` = narrative fields came from Claude output.
    - `fallback` = narrative fell back to stub/default text.
- If benchmark text lacks citation+caveat, hide benchmark section rather than inventing.

## Tasks:

- [x] 🟩 **Step 1: SIG-1.1 LLM prompt iteration loop**
  - [x] 🟩 Update `src/pipeline/llm.ts` narrative call to include richer user context from onboarding (`profile.raw`) in addition to current stub metadata.
  - [x] 🟩 Update `prompts/signal-copy.md` so output enforces KPI-semantic correctness, user-specific "why now", assumptions/confidence, and no fabricated claims.
  - [x] 🟩 Add a repeatable compare workflow (before/after pipeline runs) for key copy fields per user/card.
  - [x] 🟩 Ensure preview shows generation source markers at both artifact level and card narrative level (`llm` vs `fallback`).

- [x] 🟩 **Step 2: SIG-1.2 User KPI recommendation transparency page**
  - [x] 🟩 Add API support to expose per-user selection data from artifacts (requested KPIs, recommended KPIs, rationale, profile summary fields).
  - [x] 🟩 Create a new QC UI page showing each user's context and KPI sets.
  - [x] 🟩 Add clear "shared across users" vs "user-specific" indicators for KPI lists.
  - [x] 🟩 Add empty/error states when artifacts are missing or incomplete.

- [x] 🟩 **Step 3: SIG-1.3 KPI calculation dictionary page**
  - [x] 🟩 Add a data model/API response that lists KPI definition, formula summary, source dataset, rule id, and status (`replayed`/`proxy`/`illustrative`) sourced from `src/kpi/rules.ts` metadata.
  - [x] 🟩 Create a new QC UI dictionary page for org-level KPI explainability (shared-org assumption).
  - [x] 🟩 Add links/mapping from signal-card KPIs to dictionary entries for traceability.
  - [x] 🟩 Ensure terminology is PM/UAT-friendly and flags provisional formulas explicitly.

- [x] 🟩 **Step 4: Review gates and validation**
  - [x] 🟩 Implement scripted gate command (single run target) that outputs pass/fail plus per-gate details.
  - [x] 🟩 Validate no non-leads KPI reuses leads-only value semantics.
  - [x] 🟩 Validate Surge vs Sam differ meaningfully in KPI selection or narrative (per review gate threshold).
  - [x] 🟩 Validate recommended rationale is user-goal specific and insufficient cards include actionable missing-data details.
  - [x] 🟩 Validate benchmark statements include citation + applicability caveat when shown; otherwise benchmark block is omitted.
