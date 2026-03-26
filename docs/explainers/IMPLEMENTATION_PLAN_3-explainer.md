# Implementation Plan 3 — what we actually built (explained for PMs)

**What this doc is:** A plain-language recap of **`plans/implementation/IMPLEMENTATION_PLAN_3.md`** — what the team **executed** (not just planned). It uses **metaphors** so you can talk about it with stakeholders without diving into code.

**Headline:** The **upstream “factory line”** is in place: raw inputs → cleaned data → KPI math → (optional) Claude for wording → **JSON files in `out/`** that the **preview** reads. CI runs the line **without** calling Claude (stub mode). One **optional** polish item remains: a **dedicated automated QC report** for the exact 10-card mix.

---

## One metaphor for the whole thing

Think of **two kitchens**:

1. **Prep kitchen (deterministic):** Same recipe every time — normalize spreadsheets and onboarding JSON, run quality checks, compute KPIs with traceable formulas. If something is wrong, the line **stops** (*fail-fast*). No “serve a broken plate and hope nobody notices.”

2. **Writing kitchen (Claude):** Two **separate** orders to the AI — first “**which signals and why**” (strategy), then “**write the card copy**” using that answer (narrative). That way the story doesn’t contradict the plan. If there’s **no API key** (e.g. in CI), the line still finishes using **stub text** so builds stay green.

**Takeaway:** The product’s “menu” for Surge and Sam is **whatever lands in the JSON files** after a run — not hand-edited demo fiction.

---

## What we executed (mapped to the plan)

### Step 1 — Runner + run logbook

**Metaphor:** A **batch sheet** stapled to every production run.

- There is a **CLI command** (`npm run pipeline`) you can run like pressing **Start** on the assembly line.
- After **each stage**, the system updates **one structured file**: `out/pipeline-run.json` — what ran, when, status, inputs, and (when used) **which model** powered the AI step.

### Step 2 — Normalize (“data engineer”)

**Metaphor:** Turning **shopping bags of different shapes** into **same-size containers** before cooking.

- Onboarding for **Sam** and **Surge** lives as **validated JSON** aligned to a shared **contract** (`schemas/onboarding-profile.json`).
- Normalization notes and mapping context go to **`out/processing-diagnostics.json`** so you can audit “why this field became that.”

### Step 3 — Quality checks (“data analyst”)

**Metaphor:** **Incoming inspection** at a warehouse — reject or flag bad rows before they become KPIs.

- Findings are **merged into** the same diagnostics file (one trail of “what we noticed about the data”).

### Step 4 — KPIs (“BI”)

**Metaphor:** **Recipes with citations** — every important number should be traceable to rules and source data, not someone’s gut.

- KPIs are computed from the normalized inputs; provenance is carried forward for the signal cards.

### Step 5 — Two Claude calls (when enabled)

**Metaphor:** **Brief the strategist, then brief the copywriter** — and make the copywriter **read the strategist’s memo** so they don’t improvise a different plan.

- **Call 1:** Requested vs recommended KPIs + short rationale (structured).
- **Call 2:** Expanded card text per KPI, **fed by Call 1**.
- Prompts live as **versioned files** under `prompts/` so tuning one doesn’t scramble the other.
- **`--skip-llm`:** Skip real API calls (CI uses this).
- **`--no-cache`:** Force fresh AI output when you’re iterating on prompts (cache avoids redoing unchanged work).

### Step 6 — Ship the “plates” (artifacts)

**Metaphor:** **Seal the takeaway containers** — these are the files every downstream tool is allowed to trust.

- **`out/agent-signals.json`:** Per **userId** (`surge`, `sam`) — **selection layer**: what was requested vs recommended, plus rationale.
- **`out/processed-signals.json`:** Per **userId** — **UI layer**: full card payloads (overview + expanded) with tags for requested/recommended and sufficient/insufficient.

### Step 7 — Preview reads the real output

**Metaphor:** The **dining room only serves what’s on tonight’s printed menu** — not a parallel handwritten menu.

- The QC UI preview loads **generated artifacts** and switches **Surge vs Sam** using the same **`userId`** everywhere.

**Still open (optional):** The pipeline can **validate** the refined **10-card mix** (`validateAcMix`); wiring a **dedicated QC report** in the automated QC flow is marked **not done** in the plan — nice-to-have, not blocking the core pipeline.

### Step 8 — Rerun workflow

**Metaphor:** **New ingredients → rerun the batch** — documented so anyone can swap CSVs or onboarding JSON and regenerate.

- **`README.md`** documents how to run, use **`--no-cache`** when tuning prompts, and how CI behaves.
- **Non-AI** stages are **deterministic**; **AI** stages aim for **semantic consistency** with **repeatable** behavior when **cache hits** (per release doc alignment).

---

## Decisions you can repeat in a meeting

| Decision | One-liner |
|----------|-----------|
| Claude first | Real AI behavior now; room to swap providers later. |
| CLI-first | Fast iteration: swap files, diff outputs, no heavy UI yet. |
| Artifact-driven | Preview and QC **read files** in `out/` — single source of truth. |
| Two AI calls | Strategy first, then copy — avoids the model “changing its mind” in prose. |
| Fail-fast | Stop on error; manifest shows how far you got. |
| Caching | Same inputs + same prompts → reuse last good AI output (cheaper, steadier reruns). |
| userId slugs | **`surge`** / **`sam`** — same string in onboarding, JSON, and preview toggle. |

---

## The 10-card mix (product language)

**Metaphor:** A **fixed tasting menu** — not “some KPIs.”

Per user, refined acceptance criteria target **10 cards**: mixes of **requested** vs **recommended**, and **sufficient** vs **insufficient** data. The pipeline can **repair** outputs if the model returns the wrong category mix; **live MVP** expectation is **weekly** runs so cards stay stable between runs.

---

## Where things stand (~88% in the plan)

**Executed:** End-to-end pipeline from CLI through artifacts; preview wired to **`out/`**; onboarding validated; CI runs **pipeline without Claude**; documentation for reruns and caching.

**Not executed (optional):** Dedicated automated QC report for the exact **10-card** acceptance mix (validation logic exists in the pipeline; “wire dedicated QC report later”).

---

## Related docs

- **`docs/architecture/MVD_ARCHITECTURE_AND_DATA_FLOW.md`** — Diagram of how data moves.
- **`templates/onboarding-call-template.md`** — How call notes become onboarding JSON.
- **`release acceptance criteria/Refined AC for 25 Mar`** — What “done” looks like for the release from a user’s point of view.
- **`plans/implementation/RELEASE_SIGNOFF_AND_CI.md`** — CI and sign-off scope.

---

*Explains what was **executed** per `plans/implementation/IMPLEMENTATION_PLAN_3.md` (updated to match plan checklist and implementation notes).*
