# Implementation Plan

> **Superseded for release scope:** Product acceptance for **MVD v1.1** is defined in [`IMPLEMENTATION_PLAN_MVD_V1_1.md`](IMPLEMENTATION_PLAN_MVD_V1_1.md) (source: `docs/decisions/Release_ Minimum Viable Data v1.1.pdf`). This document remains useful as a **technical deep-dive** on signal-card correctness (facts-only KPIs, prompts, transparency).

**Overall Progress:** `0%`

## TLDR
Uplift replay rules so KPI cards show real, data-backed facts only (no proxy/illustrative values), and update AI recommendation calls to use an explicit "strategy consultant" lens for recommended KPIs tied to user context and business outcomes.

## Critical Decisions
Key architectural/implementation choices made during exploration:
- Decision 1: Introduce a KPI spec contract (definition, numerator, denominator, time window, required fields, status) as the source of truth - keeps cards, replay rules, and dictionary aligned.
- Decision 2: Facts-only policy - if a KPI cannot be computed from available data with formula fidelity, show insufficient-data (no numeric value) plus confidence on incompleteness.
- Decision 3: Build a dataset adapter layer (column normalization + validation) before KPI math - allows future data-shape changes without rewriting KPI logic.
- Decision 4: Recommended KPI selection must run with an explicit strategy-consultant rubric in AI calls (weekly relevance, decision linkage, context fit, vanity-metric filtering, outcome-driven thinking).
- Decision 5: Release gate is fail-fast - do not ship signal-card correctness changes unless UAT-0 to UAT-6 pass for both users (or approved exception is explicitly documented).

## Tasks:

- [ ] 🟥 **Step 1: Define KPI replay contract for current and future scope**
  - [ ] 🟥 Add KPI-by-KPI spec entries with exact formula, numerator, denominator, time window, unit, and required fields.
  - [ ] 🟥 Encode `status` (`replayed` | `insufficient_data`) with explicit reason and confidence rating when incomplete.
  - [ ] 🟥 Ensure spec is user-agnostic (KPI logic independent of specific user IDs like Surge/Sam).
  - [ ] 🟥 Define KPI spec governance: file location, schema version field, and change-owner/review rule.

- [ ] 🟥 **Step 2: Implement accurate replay rules for data-supported KPIs**
  - [ ] 🟥 Implement `kpi.sales.win_rate` from deals with explicit closed-stage filters and date window handling.
  - [ ] 🟥 Implement `kpi.sales.velocity` from deals (`won count`, `amount`, `sales cycle duration`) with null/zero safeguards.
  - [ ] 🟥 For unsupported KPIs (`support.sla`, `revenue.arpu`, `product.adoption`), render insufficient-data cards only (no numeric output), with confidence + missing fields.
  - [ ] 🟥 Add facts-only runtime gate: if required fields/quality checks fail, force `insufficient_data` and block numeric output.

- [ ] 🟥 **Step 3: Add strategy-consultant recommendation logic to AI calls**
  - [ ] 🟥 Update KPI-selection prompt/invocation so recommendations explicitly follow: weekly metrics, decision linkage, industry/stage/team-size fit, vanity filtering, and outcome orientation.
  - [ ] 🟥 Require recommendation output to state: why this KPI now, which decision it informs, and expected business-outcome linkage.
  - [ ] 🟥 Ensure recommended KPI rationale differs by user context (Surge vs Sam) while preserving shared facts for the same `kpiId`.
  - [ ] 🟥 Add recommendation QA rubric fields in output: `decision`, `weekly_action`, `expected_outcome`, `why_not_vanity`.

- [ ] 🟥 **Step 4: Add reusable data-shape adapter and validation layer**
  - [ ] 🟥 Normalize raw columns per dataset (deals, leads, shifts, future sources) into stable semantic fields.
  - [ ] 🟥 Add validation checks for required fields, parse failures, duplicate keys, and date/currency coercion.
  - [ ] 🟥 Emit rule-level quality flags so cards/dictionary can show data confidence and caveats.
  - [ ] 🟥 Standardize confidence scoring components (completeness, freshness, parse validity, sample adequacy) used for incomplete-calculation confidence.

- [ ] 🟥 **Step 5: Align transparency output with replay truth**
  - [ ] 🟥 Update KPI dictionary entries to show exact rule/source/formula from the new KPI spec.
  - [ ] 🟥 Show numerator/denominator/time window and incompleteness confidence directly in transparency views.
  - [ ] 🟥 Ensure card value formatting strictly follows KPI unit definitions.

- [ ] 🟥 **Step 6: Verify correctness now and future extensibility**
  - [ ] 🟥 Add deterministic tests for formula correctness, date-window boundaries, null handling, and duplicates.
  - [ ] 🟥 Add fixture-based tests for “new user + new KPI + new data shape” onboarding path.
  - [ ] 🟥 Re-run UAT checks focused on formula trust: no leads-value reuse, KPI-specific provenance, accurate units, and confidence visibility for incomplete calcs.
  - [ ] 🟥 Enforce release gate: UAT-0..UAT-6 must pass for both `surge` and `sam`, unless exception is documented and approved.
