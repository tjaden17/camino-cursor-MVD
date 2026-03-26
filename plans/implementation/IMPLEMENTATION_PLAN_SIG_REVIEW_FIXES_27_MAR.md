# Implementation Plan

**Overall Progress:** `100%`

## TLDR
Close the four post-implementation review findings for signal card rightness: strengthen personalization gate quality, replace ad-hoc CLI logging with structured logger usage, harden transparency API parse errors, and improve KPI dictionary preview traceability links.

## Critical Decisions
- Decision 1: Keep scope strictly to review findings only (no new product features) - minimizes risk and rework.
- Decision 2: Ship one small hardening pass with tests and build verification - fastest path to stable quality.
- Decision 3: Add one reusable lightweight logger utility for CLI context logging - improves maintainability without large infra changes.

## Tasks:

- [x] 🟩 **Step 1: Personalization gate robustness**
  - [x] 🟩 Add/extend tests so the gate does not pass on token-only wording changes.
  - [x] 🟩 Update gate logic to require meaningful personalization signal (goal overlap and/or stronger KPI difference).

- [x] 🟩 **Step 2: Review CLI logging hygiene**
  - [x] 🟩 Add a small structured logger utility for CLI commands.
  - [x] 🟩 Replace `console.log` usage in `src/review/cli.ts` with logger calls carrying context keys.

- [x] 🟩 **Step 3: Transparency API parse hardening**
  - [x] 🟩 Add safe JSON read/parse helper(s) with explicit `createError` messages.
  - [x] 🟩 Apply helper(s) to recommendations and KPI dictionary API endpoints.

- [x] 🟩 **Step 4: KPI traceability deep-link**
  - [x] 🟩 Return per-KPI preview index mapping in dictionary API payload.
  - [x] 🟩 Use mapping in dictionary UI so "open preview" navigates to the matching card.
