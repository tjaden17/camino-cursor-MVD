# Tech Coach Snapshot - 2026-03-25

## How today's work fits the big goal

Think of this product as an airport baggage system for KPI insights:

- onboarding files are bags coming in
- validators are security scanners
- replay rules are weight-check machines (objective, deterministic truth)
- LLM stages are labeling/summary agents
- QC is the final gate before bags board the plane
- preview UI is what operators and stakeholders see before takeoff

Your overall goal is trustworthy, operator-ready AI KPI signals.
Today's direction supports that directly by improving:

- Trust: schema checks and fabricated-number guards
- Consistency: deterministic fallback (`--skip-llm`) for CI and demos
- Traceability: provenance attached to cards
- Operability: runbook, QC dashboard, and preview flow

## Architecture in simple story form

- `src/validate-onboarding.ts` checks incoming onboarding files first (fail early).
- `src/pipeline/run-pipeline.ts` orchestrates stages: normalize -> quality -> BI replay -> LLM (optional) -> repair -> write artifacts.
- `src/kpi/rules.ts` computes reproducible numeric facts from CSVs (ground truth backbone).
- `src/pipeline/stub-cards.ts` guarantees usable cards even without API key/model calls.
- `src/qc/run-report.ts` verifies numeric replay, schema validity, and insufficient-data safety.
- `apps/qc-ui` exposes this as a practical operator interface (`/` for QC, `/preview/signal` for card UX).

## What you know well vs next growth

- You already know well: product-to-AC mapping, operator workflow thinking, and "do not ship magic without checks."
- Next to learn:
  - where truth lives at each stage (raw data vs replay vs schema vs narrative)
  - which failures should stop the run vs only warn
  - how to design tests at 3 levels (unit, contract, integration)

## Choose-your-next-lesson options (~5 min each)

Each explainer below is written so you can read it once in about five minutes and walk away with a usable mental model.

### A) How trust is enforced end-to-end (schemas + replay + QC)

**What you are learning:** Where “trust” is actually checked in this repo, not just “we hope the AI is good.”

1. JSON schemas. Files under `schemas/` (e.g. `signal-overview.json`, `insufficient-data.json`) define the shape of payloads. If the JSON is valid but wrong shape, the validator fails. That stops silent drift between what the UI expects and what the pipeline emits.

2. Golden replay. `src/kpi/rules.ts` recomputes numbers from the same CSV extracts every time. `fixtures/golden/` holds “claimed” numbers; QC compares replay to claimed within tolerance. So the **business metric** is not “whatever the model said”; it is “what we get when we run the same rule on the same file.”

3. Insufficient-data guardrails. `src/qc/insufficient.ts` checks that insufficient cards do not carry fake KPI numbers (e.g. no `currentValue` on an insufficient payload). That is a product rule: **no number without a defensible data path.**

4. QC report. `npm run qc` bundles golden replay, schema checks on samples, and insufficient checks into `out/qc-report.json`. Passing QC means those gates agreed at that moment.

Takeaway: Trust is layered: schema (structure), replay (numbers), insufficient rules (honesty when data is missing), QC (one place to see pass/fail).

---

### B) Pipeline internals (stage-by-stage, with failure scenarios)

**What you are learning:** What runs in order, what can break, and what gets written where.

Rough order (`src/pipeline/run-pipeline.ts`):

1. **Normalize / load:** Read `*-onboarding-derived.json` from the onboarding directory, validate against the onboarding schema. Bad file → run fails early.
2. **Quality:** Light checks (e.g. warnings if `gaps_and_assumptions` is missing).
3. **BI:** `buildUserKpiContexts` runs deterministic replay (e.g. leads total) once and attaches the same provenance to each user in that run. **Shared org KPIs stay consistent across users** for that slice.
4. **LLM stages (optional):** If API key and not `--skip-llm`, selection + narrative; otherwise stub cards fill the deck deterministically.
5. **Repair / validate mix:** Card counts and AC mix are checked; repair hook exists for future tightening.
6. **Write artifacts:** e.g. `agent-signals.json`, `processed-signals.json`, manifest, diagnostics.

Failure scenarios: Invalid onboarding JSON → throw before useful output. Missing CSV → replay fails. Missing key → pipeline still completes with stub path (good for CI and demos).

Takeaway: The pipeline is a **sequenced factory line**: each stage assumes the previous one left the world in a known state.

---

### C) LLM + deterministic hybrid design (why both are needed)

**What you are learning:** Why we do not “just let Claude do the KPIs.”

Deterministic layer answers: *What is the number, from which file, with which rule, and a sample of rows?* That is **auditable and repeatable**. Same inputs → same replay output (modulo intentional data updates).

LLM layer (when enabled) answers: *How do we phrase selection rationale and narrative for this user?* It merges into stub-shaped cards so structure stays fixed while wording can flex. Prompts live under `prompts/`; responses can be cached under `.cache/mvd/` to save cost and stabilize runs.

Why both: If the model were the only source of truth for numbers, you would get **variance, hallucination, and no single replay button**. If you only had spreadsheets, you would have **no personalized narrative at scale**. The hybrid keeps **numbers on rails** and **language in a bounded lane**.

Takeaway: Deterministic = truth path for metrics; LLM = assistive layer on top of a fixed card contract.

---

### D) Operator journey (from onboarding call to card preview)

**What you are learning:** The human path that matches the code path.

1. Call: Capture structured notes; align on what KPIs matter and what data exists.

2. Template: Produce `*-onboarding-derived.json` (and avoid duplicate `user_id` across `data/onboarding/` and `data/user-onboarding/`).

3. Validate: `npm run validate:onboarding` — schema + duplicate IDs.

4. Pipeline: `npm run pipeline` (often `--skip-llm` in CI) — writes `out/processed-signals.json` and related files.

5. QC: `npm run qc` — gates before you treat the run as “good.”

6. Preview: `apps/qc-ui` — `/` for QC dashboard, `/preview/signal` to flip through cards per user.

Takeaway: The operator is not “prompting ChatGPT”; they are **running a pipeline** with inputs, artifacts, and a preview that match the runbook.

---

## 5-question quiz (with answers)

Use these to check your own answers; the notes in italics reflect your draft thinking and tighten the wording.

### 1. Why both deterministic replay rules and LLM-generated narrative?

**Your angle:** So users see what they expect — KPIs look the same each time they open the app, and stay consistent between users (where the product says they should), not random every time.

**Tighten:** Replay rules **fix the numeric facts and provenance** to the same CSV + rule each run. The LLM (when used) mainly **selects and words** within that structure; with `--skip-llm`, stub cards keep the same **shape and mix** without live calls. **Same org-level facts shared across users** (e.g. one leads replay for the run) is an explicit design choice in `bi-stage.ts` so Surge and Sam do not see different numbers for the same KPI id from the same extract.

---

### 2. What risk does the insufficient-data guard prevent?

**Your angle:** If data is insufficient, the LLM might still “calculate” something and give a bad analysis.

**Tighten:** Yes — that is the risk: **fabricated or implied metrics** when the system should say “we cannot show a number.” The schema and QC checks ensure insufficient cards **do not carry numeric KPI fields** like `currentValue` on the insufficient payload. The product promises **withhold metrics** until data exists; the guard enforces that contract.

---

### 3. “Data is valid” vs “insight is trustworthy”

**Your angle:** Valid = file can be read, cleaned, normalized? Trustworthy = AI analysed it and insights can be reviewed?

Tighten:

- **Valid (in this codebase):** Usually means **passes JSON Schema** (and onboarding rules like duplicate `user_id`). It is **structural correctness**, not “this KPI is true.”
- **Trustworthy:** Stronger: **numbers tie back to replay** (or are honestly absent), **narrative fits the contract**, and **QC gates pass** where you rely on them. “The AI read it” is not enough; **reviewable provenance** (source, rule, sample rows) is what makes a metric defensible.

---

### 4. If `ANTHROPIC_API_KEY` is missing, what happens — and is “no live Claude” bad for a live product?

**Your angle:** No real live calls; we rely on stored data — not good for live product?

**Tighten:** The CLI **falls back to `--skip-llm`**: stub/deterministic cards, no API calls. That is **great for CI, demos, and offline dev** — predictable and free. For a **live product** where you want real selection and narrative, you **set the key** and run without `--skip-llm` (and use caching as needed). So: **not a limitation of the product**; it is a **deliberate mode** so you can ship checks and UX without being blocked on the API. Production config would enable the LLM path.

---

### 5. Which artifact for an auditor — `processed-signals`, `agent-signals`, or QC report?

**Your angle:** `processed-signals` — because it has the KPI log and related data.

Tighten: **Start with `processed-signals.json`** for **what the user-facing cards actually contain** — each card includes overview (and expanded or insufficient) plus **provenance** on the overview (and expanded when present). That is the best “show me the signal and the receipts” bundle.

Also know:

- **`agent-signals.json`** — selection rationale and requested vs recommended KPI ids; good for “why these KPIs,” lighter on full card proof.
- **`out/qc-report.json`** — **gate-level proof** that golden replay, schema samples, and insufficient checks passed at report time. An auditor might want **both**: QC report for “what we verified,” processed signals for “what we shipped.”

---

## Quick reference: which lesson when you are stuck

| If you are asking… | Re-read section |
|-------------------|-----------------|
| “Why can’t we trust the model alone?” | A, C |
| “What runs first if something breaks?” | B |
| “What do I tell the operator to do?” | D |
