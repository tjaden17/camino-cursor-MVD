# Implementation Plan

**Overall Progress:** `18%`

## TLDR
Build the full upstream MVD agent pipeline (Claude-first, real LLM calls) so signal-card data is generated from real processed inputs, written to `out/*.json`, and then consumed by preview/QC. Keep run mode CLI-first so input files can be swapped easily between runs. **Data flow & modular instructions:** see `MVD_ARCHITECTURE_AND_DATA_FLOW.md`. **Call notes → JSON:** see `templates/onboarding-call-template.md`.

## Critical Decisions
- Decision 1: Claude first (real provider calls) - fastest path to real agent behavior while keeping future adapter hooks.
- Decision 2: CLI-first pipeline execution - easiest way to swap input files and compare output changes quickly.
- Decision 3: Artifact-driven integration - preview/QC read from `out/processed-signals.json` and `out/agent-signals.json` as source of truth.
- Decision 4: Use this language everywhere: each card is **requested** or **recommended**, and **sufficient** or **insufficient** (data). Per user **10 signal cards** for 25 Mar: 3 requested + sufficient, 3 recommended + sufficient, 3 recommended + insufficient, 1 requested + insufficient. See `release acceptance criteria/Refined AC for 25 Mar`.
- Decision 7: Architecture and data flow are documented in `implementation plans/MVD_ARCHITECTURE_AND_DATA_FLOW.md` (includes diagram).
- Decision 5: Reproducibility policy - enforce reproducibility via caching for LLM stage outputs.
- Decision 6: Failure mode - fail-fast (stop immediately if a stage fails).

## Tasks:

- [ ] 🟥 **Step 1: Pipeline Entrypoint and Run Manifest**
  - [ ] 🟥 Add pipeline CLI runner that accepts input/output path arguments.
  - [ ] 🟥 Write run metadata to `out/pipeline-run.json` (timestamps, inputs, stage status, model).

- [ ] 🟥 **Step 2: Data Engineer Stage (Normalization)**
  - [ ] 🟥 Normalize raw onboarding + company CSV fields into canonical internal structures.
  - [ ] 🟥 Persist normalization decisions and field mapping notes to `out/processing-diagnostics.json`.
  - [x] 🟩 Add normalized onboarding JSON schema (`schemas/onboarding-profile.json`) and register in validator (`src/validate/ajv.ts`).
  - [x] 🟩 Create Sam onboarding JSON derived from interview notes (`data/onboarding/sam-onboarding-derived.json`) and validate against schema.
  - [x] 🟩 Convert remaining onboarding source to normalized JSON (`data/onboarding/surge-onboarding-derived.json`) and validate both user files against onboarding schema.

- [ ] 🟥 **Step 3: Data Analyst Stage (Quality Checks)**
  - [ ] 🟥 Run data quality checks (missing fields, duplicates, parse/type issues, anomalies).
  - [ ] 🟥 Append quality findings to `out/processing-diagnostics.json`.

- [ ] 🟥 **Step 4: BI Stage (KPI Computation + Formula Validation)**
  - [ ] 🟥 Compute KPI values from normalized data with explicit formula/rule provenance.
  - [ ] 🟥 Validate formulas/assumptions and carry provenance fields needed by signal cards.

- [ ] 🟥 **Step 5: Strategy + Management Consultant Stages (Claude)**
  - [ ] 🟥 Generate per-user requested/recommended KPI selections and rationale.
  - [ ] 🟥 Generate synthesis for expanded signal-card content per KPI.

- [ ] 🟥 **Step 6: Write Output Artifacts for Downstream Consumers**
  - [ ] 🟥 Write `out/agent-signals.json` with user-level requested/recommended sets.
  - [ ] 🟥 Write `out/processed-signals.json` with per-user card payloads (`overview` + `expanded`) and category tags.

- [ ] 🟥 **Step 7: Preview + QC Integration Contract**
  - [ ] 🟥 Ensure preview reads generated artifacts (not hand-authored fixture) with `Surge`/`Sam` perspective support.
  - [ ] 🟥 Enforce acceptance constraints: per user exactly **10** cards per refined AC (3 requested+sufficient, 3 recommended+sufficient, 3 recommended+insufficient, 1 requested+insufficient), with correct expanded copy per category.

- [ ] 🟥 **Step 8: Rerun Workflow for Input Changes**
  - [ ] 🟥 Document repeatable run commands for swapping input files and regenerating artifacts.
  - [ ] 🟥 Confirm that reruns update `out/*.json` deterministically for side-by-side comparisons.

## Sign-off & CI

Release decisions (timeline, demo bundle, weekly cadence, CI scope) and prod-quality roadmap: `implementation plans/RELEASE_SIGNOFF_AND_CI.md`.

## Implementation Notes (latest update)
- Sam interview PDF is qualitative context, not a structured onboarding export. A normalized derived onboarding JSON was created for pipeline input bootstrap.
- New schema `onboarding-profile.json` is now part of shared Ajv validation, enabling contract checks before pipeline execution.
- `sam-onboarding-derived.json` was validated successfully against the new schema (build and validation checks passed).
- `surge-onboarding-derived.json` was created from `User profile-Surge.csv`; both Sam and Surge normalized onboarding JSON files validate against `onboarding-profile.json`.
