# Camino MVD Pipeline — Data Flow & Explainer

> **Audience:** Non-technical product manager.
> **Purpose:** Understand what happens when you run `npm run pipeline`, step by step.

---

## The big picture (30-second version)

The pipeline takes **raw data** (onboarding questionnaires, CRM exports, shift logs) and turns it into **Signal Cards** — the cards users see on their phone/screen. Along the way it validates data, crunches numbers, optionally asks an AI to write narrative copy, and checks quality. Everything is logged so you can trace any number back to its source.

---

## Visual flow

```
 ┌─────────────────────────────────────────────────────────────┐
 │                        INPUT FILES                          │
 │                                                             │
 │  data/onboarding/              data/zoho/                   │
 │  ├─ surge-onboarding-          ├─ Zoho - CRM - Leads.csv   │
 │  │  derived.json               └─ Zoho - CRM - Deals.csv   │
 │  └─ sam-onboarding-                                         │
 │     derived.json               data/custom/                 │
 │                                └─ Shifts Data.csv           │
 │  data/kpi-spec/                                             │
 │  └─ kpi-spec-v1.json                                        │
 └──────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 ┃  STAGE 1 ─ NORMALIZE                                        ┃
 ┃  Load onboarding JSONs, validate against schema.            ┃
 ┃  Output: validated user profiles in memory.                 ┃
 ┗━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                     │
                     ▼
 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 ┃  STAGE 2 ─ KPI SPEC CONTRACT                                ┃
 ┃  Read kpi-spec-v1.json; validate it passes its own schema.  ┃
 ┃  This is the "menu" of allowed KPIs.                        ┃
 ┗━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                     │
                     ▼
 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 ┃  STAGE 3 ─ ORG + STRATEGY                                   ┃
 ┃  Merge all users' company info into one "org snapshot".     ┃
 ┃  Build the strategy catalogue (12 KPIs, 6 decisions).       ┃
 ┃  Write per-user "strategy mirrors".                         ┃
 ┃  Outputs: org-context.json, strategy-catalogue.json,        ┃
 ┃           {userId}-strategy-mirror.json                     ┃
 ┗━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                     │
                     ▼
 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 ┃  STAGE 4 ─ QUALITY CHECK                                    ┃
 ┃  Scan each profile for missing fields (e.g. gaps &          ┃
 ┃  assumptions). Logs warnings, doesn't block the run.        ┃
 ┗━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                     │
                     ▼
 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 ┃  STAGE 5 ─ BI (Business Intelligence)                       ┃
 ┃  Run deterministic "replay" calculations on the raw CSVs.   ┃
 ┃  Currently: count all rows in Zoho Leads → "Total leads".   ┃
 ┃  Records the value, formula used, and sample rows (for      ┃
 ┃  provenance — so you can trace where the number came from). ┃
 ┃  Output: UserKpiContext per user (same facts for everyone).  ┃
 ┗━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                     │
              ┌──────┴──────┐
              │ --skip-llm? │
              └──┬───────┬──┘
          YES    │       │   NO (+ API key set)
                 │       │
                 ▼       ▼
 ┌──────────────────┐  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 │ Build 10 "stub"  │  ┃  STAGE 6a ─ CLAUDE SELECTION          ┃
 │ cards per user    │  ┃  Send onboarding + KPI pool to Claude ┃
 │ with placeholder  │  ┃  → AI picks which KPIs to show each  ┃
 │ text (no AI).     │  ┃  user (requested vs recommended).     ┃
 │ Good for CI and   │  ┃  Cached so repeat runs are free.      ┃
 │ local testing.    │  ┗━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━┛
 └────────┬─────────┘                  │
          │                            ▼
          │          ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
          │          ┃  STAGE 6b ─ CLAUDE NARRATIVE              ┃
          │          ┃  Send stub cards + user context to Claude ┃
          │          ┃  → AI writes exec summary, root cause,   ┃
          │          ┃  takeaway, benchmark text, sourcing tips. ┃
          │          ┃  Merged back onto the stub cards.         ┃
          │          ┃  Also cached.                             ┃
          │          ┗━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━┛
          │                         │
          └────────┬────────────────┘
                   │
                   ▼
 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 ┃  STAGE 7 ─ REPAIR                                            ┃
 ┃  Check the "acceptance criteria mix" — does each user have   ┃
 ┃  the right split of card types?                              ┃
 ┃  Target: 4 requested (3 sufficient + 1 insufficient),        ┃
 ┃          6 recommended (3 sufficient + 3 insufficient).      ┃
 ┃  If counts are wrong, log a warning.                         ┃
 ┗━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                     │
                     ▼
 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 ┃  STAGE 8 ─ WRITE ARTIFACTS                                   ┃
 ┃  Write everything to the out/ folder as JSON files.          ┃
 ┗━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                     │
                     ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                     OUTPUT FILES (out/)                      │
 │                                                             │
 │  pipeline-run.json ......... Stage-by-stage run log         │
 │  processing-diagnostics.json Warnings & info from each stage│
 │  org-context.json .......... Merged company snapshot        │
 │  strategy-catalogue.json ... 12 KPIs + 6 decisions          │
 │  agent-signals.json ........ Which KPIs the AI picked       │
 │  processed-signals.json .... The actual Signal Cards ◀━━━━  │
 │  review-gates.json ......... Quality gate pass/fail         │
 └──────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                     QC UI (Nuxt app)                        │
 │                                                             │
 │  /preview/signal ........... See cards as user would        │
 │  /transparency/org-context . Inspect org + strategy         │
 │  /transparency/recommendations Per-user KPI rationale       │
 │  /transparency/kpi-dictionary  KPI definitions + status     │
 └─────────────────────────────────────────────────────────────┘
```

---

## Step-by-step explainer

### Stage 1 — Normalize

**What happens:** The pipeline finds all `*-onboarding-derived.json` files in `data/onboarding/` (and optionally `data/user-onboarding/`). These are the questionnaires each user filled in — their name, role, company info, goals, gaps, and assumptions. Each file is checked against a JSON Schema to make sure nothing is missing or malformed. If a duplicate `user_id` is found across files, the run fails immediately.

**Think of it as:** Opening each application form and making sure all the required fields are filled in before proceeding.

**Key files:** `src/pipeline/load-onboarding.ts`, `schemas/onboarding-profile.json`

---

### Stage 2 — KPI Spec Contract

**What happens:** The pipeline reads `data/kpi-spec/kpi-spec-v1.json` — a "menu" of all KPIs the product supports (Total Leads, Sales Velocity, Win Rate, etc.). It validates that this menu file itself is well-formed. If it is missing or invalid, the run stops.

**Think of it as:** Checking that the restaurant menu exists and is legible before taking orders.

**Key files:** `data/kpi-spec/kpi-spec-v1.json`, `src/kpi-spec/validate-kpi-spec.ts`

**Current state:** All 10 KPIs in the spec point to the same underlying rule (`RULE_LEADS_ROW_COUNT`). This is an acknowledged gap — each KPI should have its own formula.

---

### Stage 3 — Org + Strategy

**What happens:** Company information from all users' profiles is merged into a single "org snapshot". When two users say conflicting things (e.g. different company sizes), the **higher-ranking person's answer wins** (CEO beats CSM). Then a "strategy catalogue" is built — a structured set of 12 KPIs mapped to strategic horizons (now / near / far), plus 6 upcoming decisions. Per-user "strategy mirrors" (slices of the catalogue relevant to each user) are also written.

**Think of it as:** Combining everyone's notes from a strategy offsite into one agreed-upon company profile, then giving each person their personal action list.

**Key files:** `src/org/merge-org.ts`, `src/pipeline/strategy-catalogue.ts`, `src/pipeline/strategy-mirror.ts`

**Outputs:**
- `out/org-context.json` — the merged company profile
- `out/strategy-catalogue.json` — 12 KPIs + 6 decisions
- `data/onboarding/{userId}-strategy-mirror.json` — each user's slice

---

### Stage 4 — Quality Check

**What happens:** A quick scan of each profile for missing optional-but-important fields (e.g. `gaps_and_assumptions`). This stage logs warnings but never blocks the pipeline — it is informational only.

**Think of it as:** A spell-check pass. It flags things but lets you keep writing.

**Key files:** `src/pipeline/run-pipeline.ts` (inline), `src/pipeline/diagnostics.ts`

---

### Stage 5 — BI (Business Intelligence)

**What happens:** This is where **actual numbers are computed from real data files**. The pipeline reads the Zoho CRM Leads CSV, counts rows, and records the result along with **provenance** (which file, which formula, which sample rows — so anyone can trace the number back to source).

**Think of it as:** Running a spreadsheet formula on the raw export and writing down exactly which cells you used, so someone can double-check you.

**Key files:** `src/pipeline/bi-stage.ts`, `src/kpi/rules.ts`, `src/ingest/csv.ts`

**Current state:** Only one "replay" (Total Leads = row count) is fully implemented. Other KPIs (velocity, SLA, win rate, ARPU, etc.) use **placeholder values** — they are not computed from any real data. The pipeline also has a `replayShiftsFinishedSeptember2025` and `replayLeadsCreatedInRange` in the rules file, but these are not wired into the card flow yet.

---

### Stage 6a — Claude Selection (LLM call 1)

**What happens (full mode only):** The user's onboarding profile and the pool of available KPIs are sent to Claude (Anthropic's AI model). Claude decides which KPIs to show as **"requested"** (things the user asked about) vs **"recommended"** (things Camino thinks they should also see). The response is cached so re-runs don't cost money.

**Think of it as:** Asking a smart advisor: "Given what this person told us about their business, which of these 10 metrics should we show them, and which ones should we *suggest* they look at?"

**Skip-LLM path:** When running with `--skip-llm` (or no API key), the pipeline uses a fixed/deterministic split instead — always the same 4 requested + 6 recommended.

---

### Stage 6b — Claude Narrative (LLM call 2)

**What happens (full mode only):** The stub cards (with their numbers and basic labels) plus the user's context are sent to Claude. Claude writes the narrative copy: executive summary, root-cause analysis, takeaway ("good or bad?", "expected or not?"), optional benchmark comparison, and sourcing tips for insufficient cards. These are merged back onto the cards.

**Think of it as:** Handing a data analyst a table of numbers and asking them to write the commentary for each slide in a board deck.

**Skip-LLM path:** Cards keep their fallback placeholder text (generic but structurally correct).

---

### Stage 7 — Repair

**What happens:** The pipeline checks that each user has the right "mix" of card types:
- **4 requested** cards (3 with data, 1 without)
- **6 recommended** cards (3 with data, 3 without)
- **= 10 cards total**

If the mix is wrong (e.g. the AI recommended too many), a warning is logged. The repair function is a placeholder for future auto-fix logic.

**Think of it as:** Checking the buffet has the right number of dishes before guests arrive.

**Key files:** `src/pipeline/repair-cards.ts`

---

### Stage 8 — Write Artifacts

**What happens:** All results are written as JSON files to the `out/` folder:

| File | What it contains |
|------|-----------------|
| `pipeline-run.json` | A stage-by-stage log — which stages ran, when, pass/fail, which model was used. |
| `processing-diagnostics.json` | Warnings and info messages from every stage. |
| `org-context.json` | The merged company profile. |
| `strategy-catalogue.json` | The 12 KPIs + 6 decisions + sample calcs. |
| `agent-signals.json` | Which KPIs were selected for each user and why. |
| `processed-signals.json` | **The actual Signal Cards** — this is what the UI reads. |

---

### Post-pipeline — Review Gates

**What happens (separate command):** After the pipeline finishes, you can run review gates (`npm run review` / `npm run review:v11`). These are automated quality checks:

- **No leads reuse** — Non-leads KPIs must not copy the leads number as their own value.
- **Personalization** — Surge and Sam's cards must be meaningfully different (not just name-swapped).
- **Recommended quality** — Every recommended card must have a rationale explaining *why* it was suggested.
- **Insufficient quality** — Every insufficient card must list at least 2 missing datasets and 1 sourcing tip.
- **Benchmark claims** — If a card mentions a benchmark, it must include a citation URL and a caveat.
- **v1.1 structure gates** — KPI spec file exists and validates, org-context and strategy-catalogue have the right shape.

**Think of it as:** A QA checklist that runs before you ship, catching issues a human reviewer might miss.

---

### QC UI (inspection tool)

**What it is:** A small web app (Nuxt/Vue) that reads the `out/` files and lets you browse them visually — preview signal cards as a user would see them, inspect the org context, see the KPI dictionary, and check recommendation transparency.

**How it connects:** The UI reads `out/processed-signals.json` (or falls back to fixture files). It does not run the pipeline itself — it just displays whatever the last pipeline run produced.

---

## Where does each data file flow?

| Input file | Used in stage | Purpose |
|------------|--------------|---------|
| `*-onboarding-derived.json` | 1 (Normalize), 3 (Org), 6a/6b (LLM) | User profile, company context, goals |
| `kpi-spec-v1.json` | 2 (KPI Spec) | Defines which KPIs are allowed |
| `Zoho - CRM - Leads.csv` | 5 (BI) | Source data for "Total Leads" replay |
| `Zoho - CRM - Deals.csv` | *(mapped but not yet wired)* | Future: deal-stage KPIs |
| `Shifts Data.csv` | *(replay exists, not wired to cards)* | Future: operational shift KPIs |
| `prompts/kpi-selection.md` | 6a (Claude Selection) | Instructions to the AI for KPI picking |
| `prompts/signal-copy.md` | 6b (Claude Narrative) | Instructions to the AI for writing copy |
