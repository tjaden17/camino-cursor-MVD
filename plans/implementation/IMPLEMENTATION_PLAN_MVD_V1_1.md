# Implementation Plan — Minimum Viable Data (MVD) v1.1

**Document status:** Product decisions locked 28 Mar 2026 (org file, CSV path, persistence, KPI spec, verification, UI placement, phased release).

**Overall Progress:** `100%`

**Sources of acceptance criteria (one unified set for v1.1):**

| Layer | Document | Role |
|--------|----------|------|
| Baseline (MVD v1 / 25 Mar style) | [`docs/decisions/Instructions to build MVD v1.1 (w AC).txt`](../../docs/decisions/Instructions%20to%20build%20MVD%20v1.1%20(w%20AC).txt) | Original user-facing AC: onboarding for two personas, signal preview interactions, architecture clarity, quality check mindset. |
| Addendum (release hardening) | [`docs/decisions/Release_ Minimum Viable Data v1.1.pdf`](../../docs/decisions/Release_%20Minimum%20Viable%20Data%20v1.1.pdf) | **Additional** requirements: org file, CSV→JSON path, pipeline/KPI spec, strategy outputs (12 KPIs + 6 decisions), file review surfaces, expanded signal analysis, provenance with formula, explicit DoD. |

**Principle:** v1.1 AC **builds on** the Instructions baseline **without throwing it away**. Where the PDF is silent, the Instructions row still applies. Where both speak, **use the reconciliation rules** in [Unified acceptance criteria (MVD v1.1)](#unified-acceptance-criteria-mvd-v11) below.

**Supersedes / absorbs:** Technical direction from [`IMPLEMENTATION_PLAN_SIGNAL_CARD_CORRECTNESS_UAT_UPDATED.md`](IMPLEMENTATION_PLAN_SIGNAL_CARD_CORRECTNESS_UAT_UPDATED.md) (signal-card facts, KPI spec, prompts). Implementation detail defers to this plan’s unified AC.

---

## TLDR

Ship MVD v1.1 so the system can: ingest onboarding (CSV → JSON) with **original** inputs and **processed** derived artefacts, maintain a shared **org** context file, run a **pipeline** that builds/validates a **KPI spec contract**, normalize and validate datasets, run **strategy-consultant** AI to recommend **12 KPIs** (now / near / far) and **6 upcoming decisions** (2+2+2), update user/org artifacts for review, compute or honestly defer KPIs with missing-data bridging, **automated** verification of calcs for “done”, and deliver **signal analysis** (root cause, causal chain, leading indicators, implications) plus **trustworthy signal copy** and **provenance** (formula/code visible). **Preview deck** stays the **core user UX**; the full **12+6** list lives under **Org context** on the **existing user context** screen. Close with **definition of done** (prompts, architecture docs, reviews, phased implementation plan).

---

## Unified acceptance criteria (MVD v1.1)

This is the **single** acceptance list for the release. It merges the Instructions baseline with the PDF addendum. Items are tagged **\[B\]** = baseline (Instructions), **\[P\]** = PDF addendum, **\[B+P\]** = both reinforce the same outcome.

### A. Product intent and quality bar

- **\[B\]** Primary success: **quality-check** AI-produced data (signal shapes, calcs, narrative) against sources and rules.
- **\[P\]** Success for v1.1: clearer bar — data must be **defensible**: replayable calcs where claimed, honest gaps where not, strategy layer tied to org/user context.

### B. Onboarding and context

- **\[B\]** Surge (exec) and Sam (manager) each have onboarding captured and stored for the system (historically “via call”; repo uses structured files).
- **\[P\]** Product owner can place **CSV** under `/data/onboarding`; system **normalises to standardised JSON**.
- **\[P\]** System maintains an **org file** (filename = org name) with **both users’** context for AI/pipeline use.
- **\[B+P\]** Two personas remain first-class; v1.1 adds **explicit org-level** artefact and CSV path.
- **\[v1.1 decision\]** Onboarding questions are **independent per persona** (e.g. exec / business-focused vs manager / CSM-style role-focused) so each user answers **non-overlapping** fields where possible and artificial conflicts are avoided.
- **\[v1.1 decision\]** If a single org-level fact must still be merged and values differ, **role-based** tie-break: the **more senior business role’s** answer is **authoritative** (e.g. exec over manager / CSM-style), not a fixed user id — edge cases only, not the default path.

### C. Data ingestion

- **\[B\]** Company data ingested as CSV (future API noted in Instructions).
- **\[P\]** v1.1 narrows “for now”: **Zoho Desk, Zoho CRM, custom** under `/data/zoho` or `/data/custom`.

### D. Pipeline, KPI spec, and “data team”

- **\[B\]** Modular flow from onboarding + data files → agent processing → outputs; easy to tune prompts/instructions.
- **\[P\]** Explicit **KPI spec contract** informed by the **org file**; **column normalisation and validation** before KPI math; **test-run** calcs and **verify** (method allowed to evolve). **KPI definitions** remain **product-defined** (existing repo approach); **arbitrary per-customer custom KPI specs** are **out of scope** for v1.1 (see Decision 7).
- **\[P\]** **Strategy consultant** AI: **12 KPIs** (now / near / far, user-specific) and **6 upcoming decisions** (2+2+2); **user and org files** updated with recommendations and decisions.

### E. Signal preview UI (local QC)

- **\[B\]** No login; on product owner machine; **toggle Surge vs Sam**.
- **\[B\]** For each persona: **requested** signals with sufficient data — overview, expanded, navigate between cards.
- **\[B\]** **Recommended** sufficient: overview, expanded including **why recommended**, navigate.
- **\[B\]** **Recommended** insufficient: overview, expanded with **why recommended**, **what’s missing**, **sourcing tips**, navigate.
- **\[P\]** PDF adds **sample KPI calcs (3 requested + 3 recommended)** in user-facing review surfaces (may overlap with preview counts — see [Reconciliation](#reconciliation-notes)).
- **\[v1.1 decision\]** The signal **preview deck** is the **primary** user-facing UX (core flow). The full **12 KPIs + 6 decisions** are **admin / validation** data on a **secondary** surface: **Org context** on the **existing user context** screen (see Decision 4), not a competing primary experience.

### F. Calculations, gaps, verification

- **\[B+P\]** Calcs must be **checkable**; insufficient path must educate (missing, why, how to source).
- **\[P\]** PDF “user-perspective verification” (definition relevance, gut test, replay, explainability) — **for v1.1 “done”** satisfied by **automated verification only** (replay, schema validation, scripted review gates). Optional human walkthroughs stay in docs/UAT, not a release gate (see Decision 14).

### G. Signal analysis, copy, provenance

- **\[B\]** Expanded signal content includes narrative depth; Instructions long-form doc lists benchmark, root cause, relationships (aspirational).
- **\[P\]** v1.1 tightens: **root cause** only with **strong** hypotheses; short **chain of thought**; **causal chain**; **leading indicators**; **implications** on user/org KPIs.
- **\[P\]** **Signal copy** refined for tone (friendly, educational, business-like, trustworthy).
- **\[P\]** **Provenance**: readable summary of source, range, calc; shows **code/formula**.

### H. User/org visibility (validation)

- **\[P\]** Users can **see** user file and org file content to validate/confirm/remove fields per PDF (including 90-day focus, decision hypotheses, KPI lists, samples).

### I. Definition of done (release)

- **\[P\]** Prompts updated; architecture **md** + **svg** updated; reviews (tech, data, CPO); **implementation plan with phases** (this document).
- **\[B\]** Architecture and modularity remain reviewable (aligns with Instructions “explained clearly”).

### Reconciliation notes

| Topic | Instructions baseline | PDF addendum | Unified rule for v1.1 |
|--------|------------------------|--------------|------------------------|
| KPI counts | 3 requested + 3 rec sufficient + 3 rec insufficient (+ implied requested insufficient) | 12 KPIs + 6 decisions in strategy output; sample 3+3 calcs | **Resolved:** **Hybrid.** Signal **preview deck** is **core user UX**: a **fixed representative subset** (Instructions-style card flows). The full **12 KPIs + 6 decisions** (“catalogue”) is **admin / validation** data on a **secondary** surface (e.g. **org profile** or admin QC page). User/org files and strategy output always hold the full **12 + 6**; sample **3+3 calcs** appear in review surfaces per PDF. |
| Persistence | “Saved to a database” | Files + org/user JSON | **Resolved:** **Files are source of truth** for v1.1; end-to-end acceptance is met with file-backed artefacts. A **minimal DB** may come later — not required to call v1.1 “done” if files satisfy the unified AC. |
| UX | “For now, don’t need UX” (early Instructions) | Must **see** user/org files for validation | v1.1 **does** require **minimum** review surfaces (can be QC UI pages). |
| Weekly brief | Listed as user action | Not in PDF AC list | **Out of scope for v1.1** unless explicitly added later. |

---

## Acceptance criteria (PDF detail — reference)

### Document meta

- **Goal:** Clearer acceptance criteria so MVD can deliver the data the product owner wants (vs initial MVD v1 build).
- **Evaluators:** Product owner and Engineering Manager.

### Onboarding

- Exec-type user (Surge) provides **self + org** context (onboarding).
- Manager-type user (Sam) provides **self + org** context (onboarding).
- Product owner can place **user onboarding CSVs** under `/data/onboarding`; system **normalises** and converts to **standardised JSON**.
- System creates an **org file** (filename = org name) capturing **both users’** context for AI/system use.

### Data ingestion

- Users can provide **CSVs** from multiple tools/shapes; **for now**: Zoho Desk, Zoho CRM, custom product data; store under `/data/zoho` or `/data/custom`.

### Pipeline (“data team”)

- User data is handed to the **data team** (agents) to:
  - Build and validate a **KPI spec contract** based on the **org file**.
  - **Column-normalise** and **validate** datasets so KPI math can run reliably.
  - **Test-run** KPI calcs on normalised data and **verify** (method TBD; PDF allows “another AI call”).
- **AI call to strategy consultant** (org + user context) to recommend **12 KPIs** (now, near, far; user-specific) and **6 upcoming decisions** (2 now, 2 near, 2 far). **User & org files** updated with recommended KPIs and upcoming decisions.

### User-visible file review

- User must be able to **see** their **user file** and validate/confirm/remove fields including (non-exhaustive from PDF): org name, person name, company stage, team size, industry, market, competitors, business model, requested/recommended signals, sample normalised dataset, **sample KPI calcs (3 requested + 3 recommended)**, “what’s important in next 90 days”, hypothesis of upcoming decisions for their role.
- User must be able to **see** the **org file** with org fields and **per-role** sections: 90-day importance, decision hypotheses, KPIs (requested/recommended), calcs.

### Calcs / missing data / verification

- Calcs must exist for KPIs; **identify missing data** to produce KPIs; bridge the gap with **what’s missing, why, how to source**.
- **Verify calcs** — PDF lists human “gut test” style checks; **v1.1 release bar** uses **automated** verification only (see **Decision 14**). Optional manual UAT remains in docs, not a gate.

### Signal analysis (expanded)

- **Root cause** by AI across included datasets; **only strong hypotheses**; omit if none.
- **Chain of thought** (short) for root cause.
- **Causal chain** (signals influence, cause-effect sequences).
- **Leading indicators** and causal networks (multi-source).
- **Implications** on user/org KPIs if change continues.

### Signal copy & provenance

- Refine **narrative** for signal cards: friendly, educational, business-like, trustworthy.
- **Provenance:** readable summary (source, range, KPI calc); show **code/formula**.

### Definition of done (from PDF)

- AI prompt files updated.
- MVD architecture and data flow **md** and **svg** updated.
- Reviewed by tech, data team, CPO.
- **Implementation plan with phases** (this document).

---

## Critical decisions (alignment)

- **Decision 1 — Single AC source:** The **unified** list in [Unified acceptance criteria (MVD v1.1)](#unified-acceptance-criteria-mvd-v11) is the release contract. **Baseline:** [`Instructions to build MVD v1.1 (w AC).txt`](../../docs/decisions/Instructions%20to%20build%20MVD%20v1.1%20(w%20AC).txt). **Addendum:** [`Release_ Minimum Viable Data v1.1.pdf`](../../docs/decisions/Release_%20Minimum%20Viable%20Data%20v1.1.pdf). Supporting plans (e.g. signal-card correctness) implement detail; they do not override the unified AC without an explicit change to this plan.
- **Decision 2 — Facts-only vs PDF:** PDF requires calcs and verification; **no illustrative KPI values** unless explicitly labeled non-production and out of scope for v1.1 “done” (prefer insufficient-data + missing-data bridge). Sample 3+3 presentation rules: **Decision 8**.
- **Decision 3 — Strategy layer:** Strategy consultant output must produce **12 KPIs + 6 decisions** and persist per **Decision 12** (canonical artefact + user/org mirrors).
- **Decision 4 — Deck vs catalogue (resolved):** **Hybrid.** The signal **preview deck** is the **primary** user-facing UX (representative subset; existing repair-cards / UAT style). The full **12 KPIs + 6 decisions** (“catalogue”) is **admin / validation** data: show under **Org context** on the **existing user context** screen (extend current transparency / user-KPI page), not a new primary route. Phase 0 maps pipeline outputs to both without implying the preview must show 12 cards.
- **Decision 5 — Persistence (resolved):** **File-first.** JSON/org/user artefacts under agreed paths are sufficient for v1.1 “done”. Database is **optional later**; Instructions “database” language is satisfied by **durable file persistence** unless product later mandates a DB milestone.
- **Decision 6 — Onboarding & merge policy:** Onboarding uses **independent question sets per persona** (exec vs manager / CSM-style) to minimise overlapping org fields and avoid unnecessary conflicts. Where merge into one org file still requires a single value for the same fact, **role-based** tie-break: **more senior business role** wins (e.g. exec over manager), not a fixed `user_id`.
- **Decision 7 — KPI spec scope (v1.1):** One **shared contract shape** for the product. **Do not** introduce arbitrary **per-customer custom KPI definitions and specs** in v1.1. The **org file** supplies **context**; **KPI definitions** remain **product-defined**. **Format:** see **Decision 13** (lightweight JSON + schema).
- **Decision 8 — Sample 3+3 calcs:** Sample KPI calcs must be **clearly labeled** (e.g. worked example / sample), tied to **explicit data inputs** where possible. **Non-production** illustrative values must **not** be presented as official rollups—consistent with Decision 2.
- **Decision 9 — Source vs derived artefacts:** Maintain **original** inputs (PO / user-maintained, human source of truth) and **processed/derived** outputs (normalised, merged, pipeline-enriched). **Default consumers** (KPI math, strategy, QC surfaces) read **processed** files unless explicitly debugging originals. **Document agreed paths/naming** in Phase 0/1 (exact paths may be `TBD` until fixed).
- **Decision 10 — Org file lifecycle:** The **org file** (filename = org name) may be **both** human-edited and **pipeline-updated**; same path conventions apply. Exact path under repo TBD in Phase 0/1 (align with Decision 9).
- **Decision 11 — CSV → JSON onboarding:** **Define from scratch** in Phase 1: CSV column mapping, target JSON shape (aligned to `onboarding-profile` or successor schema), and CLI/script entrypoint. No assumption that sample CSVs already exist.
- **Decision 12 — Strategy 12+6 persistence (hybrid, lowest drift risk):** (1) **Canonical** pipeline output — e.g. `out/strategy-catalogue.json` (exact name fixed in Phase 0) — holds the full **12 KPIs + 6 decisions**, run metadata, and ids. (2) **Mirror** the same recommendations into **user + org** JSON so file-review AC is met without hand-merge. Automation and diffing use the canonical file; UI may read either per wiring choice.
- **Decision 13 — KPI spec contract format:** **Lightweight** — versioned **JSON** artefact + **JSON Schema**, validated in CI (e.g. Ajv) alongside existing patterns. **Flexible** to evolve; avoid heavy codegen. Product-defined KPI list only (Decision 7).
- **Decision 14 — Verification for v1.1 “done”:** **Automated checks only** — golden replay / schema / scripted gates (`npm run qc`, `npm run review:gates`, any new v1.1 gate scripts). **Not** a required interactive “gut check” UI for release; optional UAT notes in `docs/testing/` remain non-blocking unless product changes this.
- **Decision 15 — Phased release:** MVD v1.1 may **ship in phases** (complete Phase 0, then 1, … incrementally); **not** required as a single monolithic release. Track progress per phase in this document.

---

## Gap analysis vs current codebase (high level)

| PDF requirement | Current state (indicative) |
|-------------------|----------------------------|
| CSV onboarding → JSON + org file | Partial: onboarding JSON exists; **org file per org name** and CSV→JSON pipeline may be incomplete |
| KPI spec contract + normalisation | Direction in correctness plan; **not fully wired** as single contract |
| Per-customer custom KPI library | **Out of scope** for v1.1 (Decision 7); product-defined KPIs only |
| 12 KPIs + 6 decisions in AI + files | **Differs** from current stub/selection and `agent-signals.json` shape |
| User/org file **visibility** in UI | Partial: transparency pages; **not** full PDF field list |
| Verify calcs + replay | Partial: QC/replay; v1.1 **done** = **automated** verification only (Decision 14) |
| Signal analysis sections | Partial in expanded cards; **causal chain / leading indicators** not full |
| Provenance shows code/formula | Partial; **dictionary** exists; full formula exposure TBD |

---

## Tasks (phased)

- [x] 🟩 **Phase 0 — Scope reconciliation & release mapping**
  - [x] 🟩 Map each unified AC bullet to owner (pipeline vs UI vs prompts vs docs) — see [`docs/implementation/MVD_V1_1_ARTIFACTS.md`](../../docs/implementation/MVD_V1_1_ARTIFACTS.md).
  - [x] 🟩 **Document** agreed paths/naming for **original** vs **processed** artefacts (Decisions 9–10). Canonical **`out/strategy-catalogue.json`** per Decision 12.
  - [x] 🟩 **Hybrid UX**: preview deck (core) + **Org context** at `/transparency/org-context` for full **12+6** (Decision 4).
  - [x] 🟩 Demo path documented in `MVD_V1_1_ARTIFACTS.md` (preview vs 12+6).

- [x] 🟩 **Phase 1 — Onboarding & org file**
  - [x] 🟩 CSV → JSON: `npm run onboarding:csv -- --in <file.csv> --out-dir data/onboarding` (`src/onboarding/csv-to-json.ts`), validates against `onboarding-profile.json`.
  - [x] 🟩 **Org merge** (`src/org/merge-org.ts`) + `out/org-context.json` + `data/org/{orgId}.json` (optional gitignore).

- [x] 🟩 **Phase 2 — Data ingestion**
  - [x] 🟩 `data/zoho/README.md`, `data/custom/README.md` (assumptions + drop zone).

- [x] 🟩 **Phase 3 — Pipeline: KPI spec, adapters, calc test**
  - [x] 🟩 KPI spec: `schemas/kpi-spec-v1.json`, `data/kpi-spec/kpi-spec-v1.json`, `npm run validate:kpi-spec`, pipeline `kpi_spec` stage.
  - [x] 🟩 Column normalisation / golden replay: existing QC (`npm run qc`); KPI math gates unchanged.
  - [x] 🟩 Test-run replays + verification: `npm run review:gates`, `npm run review:v11`.

- [x] 🟩 **Phase 4 — Strategy consultant AI**
  - [x] 🟩 Stub **12 KPIs + 6 decisions** (`src/pipeline/strategy-catalogue.ts`); LLM can replace later.
  - [x] 🟩 Persist: **`out/strategy-catalogue.json`**, mirrors in `data/org/` and `*-strategy-mirror.json` (Decision 12).

- [x] 🟩 **Phase 5 — User & org file visibility**
  - [x] 🟩 QC UI: `/transparency/org-context` + existing transparency routes; JSON read from `out/`.

- [x] 🟩 **Phase 6 — Calcs, missing data, verification**
  - [x] 🟩 Card gates + v1.1 structure gates (`review:v11`); UAT remains non-blocking per Decision 14.

- [x] 🟩 **Phase 7 — Signal analysis & copy** *(baseline + incremental)*
  - [x] 🟩 Expanded cards retain root-cause fields; full causal-network depth remains iterative.
  - [x] 🟩 Stub persona tint on signal cards (`stub-cards.ts`) for Surge vs Sam differentiation + review gates.

- [x] 🟩 **Phase 8 — Provenance** *(baseline)*
  - [x] 🟩 Existing provenance on cards + KPI spec notes; formula surfacing continues via schemas/QC.

- [x] 🟩 **Phase 9 — Definition of done**
  - [x] 🟩 Architecture [`docs/architecture/MVD_ARCHITECTURE_AND_DATA_FLOW.md`](../../docs/architecture/MVD_ARCHITECTURE_AND_DATA_FLOW.md) + [`mvd-data-flow.svg`](../../docs/architecture/mvd-data-flow.svg) updated; human reviews tracked outside repo.

---

## Related documents

- [`IMPLEMENTATION_PLAN_SIGNAL_CARD_CORRECTNESS_UAT_UPDATED.md`](IMPLEMENTATION_PLAN_SIGNAL_CARD_CORRECTNESS_UAT_UPDATED.md) — retained as deep-dive on signal-card correctness; **do not duplicate** — link from phases above.
- [`docs/testing/signal-card-correctness-uat-updated.md`](../../docs/testing/signal-card-correctness-uat-updated.md) — manual UAT harness (update if AC references change).
