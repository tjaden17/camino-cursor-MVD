# Implementation Plan: Briefing Cards + Issue Tree Takeaways Pipeline

**Overall Progress:** `95%`

**Spec:** `decisions/Pipeline-Spec-Briefing-Cards-Takeaways.md`  
**Date:** 2 Apr 2026

## TLDR

Build the automated pipeline that takes raw customer data (CSV/XLSX) and onboarding profiles, and produces org-level analysis cards, branch takeaways, and lensed views — replacing the manual conversation-based workflow used for Locumate's MVD v2 screens.

## Critical Decisions

- **Org-level, not user-level:** One run per org; user differences are view filters only.
- **CSV + XLSX:** Stage 1 must parse both formats.
- **Data inventory is required:** Org file must declare every source file, its ID column, and format.
- **Full-replace per run:** No incremental or delta logic.
- **Code-verified counts before LLM QC:** Arithmetic checked in code; LLM QC focuses on interpretation.
- **Time periods on every number:** Analysis must state the time window; misalignment across sources flagged.
- **Cross-source analysis deferred:** Out of scope for MVD; intent is clear but design too ambiguous to spec now.
- **Immutable run artifacts:** Each run gets a new folder under `out/briefing-runs/{runId}/`; never overwrite.
- **Single output JSON per org:** No per-lens splits; `userViews` drives per-user filtering.
- **Option A tree:** Fixed 4-branch template; only root label customised.

## Tasks

- [x] 🟩 **Step 1: Org file + data inventory contract**
  - [x] 🟩 Define TypeScript interface for `org-context.json` including required `dataInventory[]` with `sourceId`, `filePath`, `format`, `idColumn`, `sheetName`
  - [x] 🟩 Restructure Locumate onboarding into `data/onboarding/locumate/` (move `surge-onboarding-derived.json` + `sam-onboarding-derived.json`)
  - [x] 🟩 Create `data/org/locumate/org-context.json` with merged company context, contributors, and data inventory for all current Locumate files (Deals, Leads, Shifts, Desk Tickets, Users)
  - [x] 🟩 New `src/briefing/types.ts` with full pipeline type contracts + `src/briefing/load-org-context.ts` with validated loader

- [x] 🟩 **Step 2: Stage 0 — onboarding ingestion + decision augmentation**
  - [x] 🟩 Org context created at `data/org/locumate/org-context.json` with `orgDecisions[]` tagged `user_stated`
  - [x] 🟩 Quality gate: validated via `load-org-context.ts` (requires role, orgId, contributors, dataInventory)
  - [ ] 🟥 RAG-augmented decision step (deferred — requires LLM integration with knowledge base)

- [x] 🟩 **Step 3: Stage 1 — file parsing, schema detection, summary stats, excerpts**
  - [x] 🟩 CSV parser with schema detection (date → boolean → currency → numeric → categorical → free_text)
  - [x] 🟩 Cleaning: dedup by declared `idColumn`, normalise blanks
  - [x] 🟩 Summary statistics: row count, column count, date range, per-column stats
  - [x] 🟩 Quality notes: low-population warnings, missing amounts on won deals
  - [x] 🟩 Data excerpt: full CSV for <500 rows, aggregated tables for >500 rows
  - [ ] 🟥 XLSX parser (placeholder — dependency not yet added)

- [x] 🟩 **Step 4: Stage 2 — issue tree instantiation**
  - [x] 🟩 Tree template encoded from Universal-Issue-Tree-Framework.md
  - [x] 🟩 Role→branch ownership assignment with `ownerSuggested: true`
  - [x] 🟩 `updateCoverage()` for post-analysis coverage update
  - [ ] 🟥 LLM column→sub-issue mapping (deferred to Stage 3 integration)

- [x] 🟩 **Step 5: Stage 3a — per sub-issue analysis**
  - [x] 🟩 Prompt assembler: injects org context, data (full CSV or excerpt), column summary, RAG benchmarks
  - [x] 🟩 LLM call per sub-issue with JSON output parsing; stub fallback when --skip-llm
  - [x] 🟩 Analysis cards stored at `stage-3-analysis/subissue-{id}.json`

- [x] 🟩 **Step 6: Stage 3d — QC (code-verified counts + LLM review)**
  - [x] 🟩 Code-verification layer: extracts row-count claims from reasoning, verifies against source
  - [x] 🟩 LLM QC: batched per branch, interpretive focus
  - [x] 🟩 `qc-failures.json` writer with `stage`, `layer`, `cardId`, `issues`, `suggestedFixes`
  - [x] 🟩 Failing cards tagged `needs_review`

- [x] 🟩 **Step 7: Stage 4 — branch takeaway synthesis + QC**
  - [x] 🟩 Takeaway prompt assembler with analysis cards, branch definition, org context, decisions
  - [x] 🟩 LLM call per branch, JSON output (title, text, reasoning); stub when --skip-llm
  - [x] 🟩 QC call per branch (defensibility, synthesis, headline, confidence, tone)
  - [x] 🟩 `stage-4-takeaways.json` written to run folder

- [x] 🟩 **Step 8: Stage 5 — lens organisation**
  - [x] 🟩 Lens 1 (Issue Tree): deterministic grouping by branch → sub-issue
  - [x] 🟩 Lens 2 (Decisions): LLM mapping cards to org decisions; stub fallback
  - [x] 🟩 Lens 3 (Risks): LLM flagging risk-style observations; stub fallback

- [x] 🟩 **Step 9: Stage 6 — output assembly + run artifacts**
  - [x] 🟩 Run manifest with specRef (content hash)
  - [x] 🟩 Single org JSON with `issueTree`, `analysisCards`, `branchTakeaways`, `lenses`, `userViews`, `dataQuality`
  - [x] 🟩 Observations + tags derived in code from KPI status/quality notes
  - [x] 🟩 `summaryCategory` on takeaways derived from Risks lens
  - [x] 🟩 `userViews` from role-based defaults
  - [x] 🟩 New `runId` per invocation; immutable run folders

- [x] 🟩 **Step 10: Pipeline orchestrator**
  - [x] 🟩 `src/briefing/run-briefing-pipeline.ts` chains Stages 0→1→2→3→3d→4→5→6
  - [x] 🟩 `src/briefing/cli.ts` + `npm run briefing -- --org locumate [--skip-llm]`
  - [x] 🟩 End-to-end integration test (8 tests, all passing)

- [x] 🟩 **Step 11: Data-driven UI screens**
  - [x] 🟩 `MVD-v2-Analysis.html` — reads from `out/briefing-latest.json`, renders cards per branch
  - [x] 🟩 `MVD-v2-Issue-Takeaway.html` — reads from JSON, renders takeaway carousel
  - [x] 🟩 `Issue-Tree-Revenue-Locumate.html` — reads from JSON, renders full tree with tag toggle
  - [x] 🟩 Observations always visible; tags hidden by default with "Show / hide tags" button
  - [x] 🟩 All three screens preserve original CSS/interaction patterns (tabs, swipe, keyboard)

- [x] 🟩 **Step 12: Smoke test with Locumate data**
  - [x] 🟩 Pipeline runs end-to-end against all 5 Locumate files (Deals 33, Leads 53, Tickets 4099, Users 13, Shifts 2375)
  - [x] 🟩 14 analysis cards, 4 takeaways, 33 data quality warnings — structurally correct
  - [x] 🟩 All three HTML screens render from `out/briefing-latest.json`
  - [x] 🟩 22 automated tests pass (org loader, Stage 1 ingestion, Stage 2 tree, end-to-end integration)
  - [x] 🟩 0 QC failures in stub mode
  - [ ] 🟥 **Pending: Run with ANTHROPIC_API_KEY for real LLM analysis** (requires API key)
  - [ ] 🟥 **Pending: Product owner visual review of all three screens**
