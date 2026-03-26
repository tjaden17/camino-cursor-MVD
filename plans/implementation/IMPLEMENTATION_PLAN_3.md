# Implementation Plan

**Overall Progress:** `88%`

## TLDR
Build the full upstream MVD agent pipeline (Claude-first, real LLM calls) so signal-card data is generated from real processed inputs, written to `out/*.json`, and then consumed by preview/QC. Keep run mode CLI-first so input files can be swapped easily between runs. **Data flow & modular instructions:** see `docs/architecture/MVD_ARCHITECTURE_AND_DATA_FLOW.md`. **Call notes → JSON:** see `templates/onboarding-call-template.md`.

## Critical Decisions
- Decision 1: Claude first (real provider calls) - fastest path to real agent behavior while keeping future adapter hooks.
- Decision 2: CLI-first pipeline execution - easiest way to swap input files and compare output changes quickly.
- Decision 3: Artifact-driven integration - preview/QC read from `out/processed-signals.json` and `out/agent-signals.json` as source of truth.
- Decision 4: Use this language everywhere: each card is **requested** or **recommended**, and **sufficient** or **insufficient** (data). Per user **10 signal cards** for 25 Mar: 3 requested + sufficient, 3 recommended + sufficient, 3 recommended + insufficient, 1 requested + insufficient. See `release acceptance criteria/Refined AC for 25 Mar`.
- Decision 7: Architecture and data flow are documented in `docs/architecture/MVD_ARCHITECTURE_AND_DATA_FLOW.md` (includes diagram).
- Decision 5: Reproducibility policy - enforce reproducibility via caching for LLM stage outputs.
- Decision 6: Failure mode - fail-fast (stop immediately if a stage fails).
- Decision 8: **25 Mar demo recording** — use **deterministic stub** data (e.g. `npm run pipeline -- --skip-llm`); live Claude **not** required for the demo video. **Next release (“minimum sellable service”)** — plan for **live runs**: CSV extracts, onboarding, and Claude/prompts will **change** over time; pipeline and ops must assume **mutable inputs** and repeatable regeneration.
- Decision 9: **Persistence for this release** — **file-based** only (`data/`, `out/*.json`) is in scope and sufficient. **Next big release (“minimum sellable service”)** — move toward **database** persistence for processed outputs and related entities (aligned with broader MVD / product direction).

## Locked decisions (detail)

The following lock in **interfaces and behaviour** for implementation; they refine Critical Decisions above.

### Run manifest (`out/pipeline-run.json`)
- The **runner** merges updates into **one structured JSON file** after each stage (not a raw text append). Each stage records at least: stage id, status, timestamps, input paths or hashes, and **model id** where an LLM is used.
- **Fail-fast:** if a stage fails, the run stops; the manifest shows **how far** the run progressed. Avoid writing downstream primary artifacts as “complete” when upstream failed.

### Claude: two separate API calls
- **Call 1 — KPI selection / strategy:** requested vs recommended KPIs and short rationale (feeds structured output forward).
- **Call 2 — narrative / signal copy:** expanded card content per KPI; **takes structured output from call 1** so copy does not re-derive selection independently.
- Prompts are **versioned files** (e.g. under `prompts/`) loaded per call so each can be tuned without merging unrelated concerns in one prompt blob.

### Artifact roles (`out/agent-signals.json` vs `out/processed-signals.json`)
- **`agent-signals.json`:** per-**userId** **selection layer** — requested/recommended lists, rationale (planning / agent view).
- **`processed-signals.json`:** per-**userId** **UI layer** — full card payloads (`overview` + `expanded`), tags for requested/recommended and sufficient/insufficient, **10 cards** per user for refined AC. Add JSON Schemas when formats stabilize (see `RELEASE_SIGNOFF_AND_CI.md`).

### User identity (preview toggle)
- Stable **`userId`** strings as lowercase slugs (e.g. **`surge`**, **`sam`**) — same value in onboarding-derived data, both JSON artifacts, and the preview Surge/Sam toggle.

### 10-card mix and reruns
- The pipeline **may repair** outputs (e.g. validation + bounded follow-up pass or slot-fill) if the model returns the wrong category mix.
- **Live MVP:** expect **weekly** runs so users see stable cards until the next run.
- **Demo / development:** re-run often; pair with **caching** so unchanged steps stay cheap.

### Caching (LLM stages)
- **Cache key** from relevant **inputs** plus **hashes or versions of prompt files** used for that call.
- Store parsed outputs under a **gitignored** cache path; expose **`--no-cache`** (or equivalent) to force refresh when tuning prompts.

### Onboarding for new users
- **One templated JSON** per user aligned to `schemas/onboarding-profile.json`, validated (e.g. in CI) before pipeline runs.

### 25 Mar MVD vs next release (minimum sellable service)

| Topic | This release (25 Mar MVD) | Next release: minimum sellable service (intent) |
|--------|---------------------------|--------------------------------------------------|
| **Demo recording** | **Deterministic stub** acceptable — stable, reviewable cards without live Claude. | N/A (past demo); product runs assume **live** pipeline execution as inputs evolve. |
| **Live runs** | Optional for development (`ANTHROPIC_API_KEY`, no `--skip-llm`); CI stays stub-only. | **Required** operationally: **CSVs change**, **onboarding** updates, **prompts / Claude instructions** change — design for refresh, caching keys, and repair paths. |
| **Storage** | **File-based** — onboarding and company data on disk; pipeline artifacts under `out/`. | **Database** for processed data (and related persistence); file-based remains plausible for extracts/ETL, but “system of record” shifts toward DB. |

## Tasks:

- [x] 🟩 **Step 1: Pipeline Entrypoint and Run Manifest**
  - [x] 🟩 Add pipeline CLI runner that accepts input/output path arguments (`npm run pipeline`, `src/pipeline/cli.ts`).
  - [x] 🟩 Merge run metadata into `out/pipeline-run.json` after each stage (timestamps, inputs, stage status, model).

- [x] 🟩 **Step 2: Data Engineer Stage (Normalization)**
  - [x] 🟩 Normalize raw onboarding + company CSV fields into canonical internal structures (load + validate `*-onboarding-derived.json` via Ajv).
  - [x] 🟩 Persist normalization decisions and field mapping notes to `out/processing-diagnostics.json`.
  - [x] 🟩 Add normalized onboarding JSON schema (`schemas/onboarding-profile.json`) and register in validator (`src/validate/ajv.ts`).
  - [x] 🟩 Create Sam onboarding JSON derived from interview notes (`data/onboarding/sam-onboarding-derived.json`) and validate against schema.
  - [x] 🟩 Convert remaining onboarding source to normalized JSON (`data/onboarding/surge-onboarding-derived.json`) and validate both user files against onboarding schema.

- [x] 🟩 **Step 3: Data Analyst Stage (Quality Checks)**
  - [x] 🟩 Run data quality checks (missing fields, duplicates, parse/type issues, anomalies).
  - [x] 🟩 Append quality findings to `out/processing-diagnostics.json`.

- [x] 🟩 **Step 4: BI Stage (KPI Computation + Formula Validation)**
  - [x] 🟩 Compute KPI values from normalized data with explicit formula/rule provenance (leads total replay shared across users).
  - [x] 🟩 Validate formulas/assumptions and carry provenance fields needed by signal cards.

- [x] 🟩 **Step 5: Claude stages (two calls)**
  - [x] 🟩 **Call 1:** per-user requested/recommended KPI selections and rationale → structured output for call 2 (`src/pipeline/llm.ts`; skipped when no API key / `--skip-llm`).
  - [x] 🟩 **Call 2:** expanded signal-card copy per KPI using call 1 output (merge narratives into stub cards).

- [x] 🟩 **Step 6: Write Output Artifacts for Downstream Consumers**
  - [x] 🟩 Write `out/agent-signals.json` with per-`userId` requested/recommended sets and rationale (selection layer).
  - [x] 🟩 Write `out/processed-signals.json` with per-`userId` card payloads (`overview` + `expanded`) and category tags (UI layer).

- [x] 🟨 **Step 7: Preview + QC Integration Contract**
  - [x] 🟩 Ensure preview reads generated artifacts (not hand-authored fixture) with Surge/Sam perspective via **`userId`** (`surge` / `sam`) (`apps/qc-ui/server/api/preview/signal.get.ts`).
  - [ ] 🟥 Enforce acceptance constraints in automated QC (optional): per user exactly **10** cards per refined AC — `validateAcMix` runs in pipeline; wire dedicated QC report later.

- [x] 🟩 **Step 8: Rerun Workflow for Input Changes**
  - [x] 🟩 Document repeatable run commands for swapping input files and regenerating artifacts (include **`--no-cache`** when prompt-tuning) — see `README.md`.
  - [x] 🟩 Confirm deterministic behaviour for **non-LLM** stages; for LLM stages, align with release doc (**semantically same**, cache hits repeatable).

## Sign-off & CI

Release decisions (timeline, demo bundle, weekly cadence, CI scope) and prod-quality roadmap: `plans/implementation/RELEASE_SIGNOFF_AND_CI.md`. **Path to production** (hosting, deploy, secrets, phases): `plans/implementation/IMPLEMENTATION_PLAN_PATH_TO_PROD.md`.

## Planning & backlog (same truth, two views)

This plan is the **execution source of truth** for MVD pipeline work. The **product backlog** (priorities, shipped history, batching) lives in [`../backlog/PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md). **How they stay in sync:** [`../README.md`](../README.md).

## Implementation Notes (latest update)
- Sam interview PDF is qualitative context, not a structured onboarding export. A normalized derived onboarding JSON was created for pipeline input bootstrap.
- New schema `onboarding-profile.json` is now part of shared Ajv validation, enabling contract checks before pipeline execution.
- `sam-onboarding-derived.json` was validated successfully against the new schema (build and validation checks passed).
- `surge-onboarding-derived.json` was created from `User profile-Surge.csv`; both Sam and Surge normalized onboarding JSON files validate against `onboarding-profile.json`.
- **Locked decisions** (two Claude calls, manifest merge per stage, artifact roles, `userId` slugs, repair + caching, templated onboarding): see **Locked decisions (detail)** above (updated 2025-03).
- **Pipeline shipped:** `npm run pipeline` writes `out/pipeline-run.json`, `processing-diagnostics.json`, `agent-signals.json`, `processed-signals.json`. CI runs `pipeline -- --skip-llm` (no API key). Real Claude: set `ANTHROPIC_API_KEY`, omit `--skip-llm`, optional `--no-cache`.
- **Demo vs sellable:** **25 Mar demo** may use **stub-only** recording; **minimum sellable service** targets **live runs** as CSVs, onboarding, and prompts change. **Persistence:** **files** for this release; **database** planned for the next big release (see **Decision 8–9** and table under **Locked decisions**).
