# Implementation Plan — QC Pipeline Inspector (Dashboard Upgrade)

**Overall Progress:** `55%`

**Parent plan:** [`IMPLEMENTATION_PLAN_RAG_SIGNAL_INTELLIGENCE.md`](./IMPLEMENTATION_PLAN_RAG_SIGNAL_INTELLIGENCE.md)
**Existing app:** `apps/qc-ui/` (Nuxt 3)
**Primary user:** Non-technical PM verifying pipeline data correctness

---

## Why this exists

The current QC dashboard answers: "Did the code produce valid JSON?" (pass/fail schema checks, golden replays). It does **not** answer: "Is the data **right**?"

Previous pipeline builds produced wrong KPIs, wrong formulas, wrong analysis, wrong synthesis. The PM had no way to catch these before showing cards to users. This upgrade turns the QC dashboard into a **Pipeline Inspector** — a step-by-step view of the data at each checkpoint, in plain English, with the ability to flag issues.

---

## Design Principles

1. **Plain English first.** Every number, formula, and decision shown in words a PM can understand. Raw JSON available via expandable sections, never the default.
2. **One question per page.** Each page answers one question: "What KPIs?" / "Is data clean?" / "Are numbers right?" / "What was the AI told?" / "Are cards good?"
3. **Flag, don't fix.** The dashboard lets you flag issues with a note. The developer fixes them. You re-run and re-check.
4. **File-based, no database.** Everything reads from JSON files in `out/`. Simple, debuggable, no infrastructure.
5. **Grows with the pipeline.** Dashboard pages are built alongside their corresponding pipeline stages, not after.

---

## How It Works

Each pipeline stage writes intermediate output to JSON files in `out/`. The dashboard reads these files and shows them in human-readable format. Flags are stored in a separate JSON file.

```
Pipeline Run                          Dashboard
──────────────                        ─────────
Step 1a: Generate Candidates          ──► Page 1: KPI Selection
   writes: agent-signals.json              "What are we measuring?"
   writes: strategy-catalogue.json

Step 1c: Data Quality Check           ──► Page 2: Data Quality
   writes: step-1c-data-quality.json       "Is the input data clean?"

Steps 2-3: Compute + Breakdowns       ──► Page 3: Computed Numbers
   writes: step-2-3-computed.json          "Show me the math"

Step 4: RAG + LLM Call                ──► Page 4: LLM Input/Output
   writes: step-4-llm-calls.json          "What was the AI told?"

Step 5: Final Cards                   ──► Page 5: Card Review
   writes: processed-signals.json          "The final product"

All pages                             ──► Page 6: Flagged Issues
   reads/writes: flags.json                "What needs fixing"

pipeline-run.json                     ──► Page 0: Run Summary
processing-diagnostics.json                "Is this run healthy?"
```

---

## Navigation Structure

```
QC Dashboard (upgraded)
├── Run Summary              (home — replaces current index.vue)
├── KPI Selection            (what are we measuring?)
├── Data Quality             (is the input clean?)
├── Computed Numbers         (show me the math)
├── LLM Input / Output       (what was the AI told + said?)
├── Card Review              (the final product — upgrades signal preview)
├── Flagged Issues           (what needs fixing)
├── Dev Checks               (old pass/fail checks — moved, not deleted)
└── Transparency             (existing pages, kept as-is)
    ├── User KPI Recommendations
    ├── Org Context
    └── KPI Dictionary
```

---

## Page Wireframes

### Page 0: Run Summary (home page — replaces `apps/qc-ui/pages/index.vue`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Pipeline Inspector                                    [Re-run ▶]   │
│                                                                      │
│  Last run: 30 Mar 2026, 14:32  ·  Run ID: run-2026-03-30-1432       │
│  Duration: 12s  ·  Status: Completed with warnings                   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  PIPELINE STEPS                                              │    │
│  │                                                              │    │
│  │  ● KPI Selection ········ 🟢 OK (Surge: 5 KPIs, Sam: 5)   │    │
│  │  ● Data Quality ·········· 🟡 2 warnings                    │    │
│  │  ● Compute Numbers ······ 🟢 OK (9 KPIs computed)          │    │
│  │  ● LLM Analysis ········· 🟢 OK (8 cards generated)        │    │
│  │  ● Final Cards ··········· 🟢 OK                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐                 │
│  │  SURGE                │  │  SAM                  │                 │
│  │  4 sufficient cards   │  │  4 sufficient cards   │                 │
│  │  1 insufficient card  │  │  1 insufficient card  │                 │
│  │  [View cards →]       │  │  [View cards →]       │                 │
│  └──────────────────────┘  └──────────────────────┘                 │
│                                                                      │
│  🚩 3 flagged issues                                 [View flags →] │
└──────────────────────────────────────────────────────────────────────┘
```

**Data sources:** `out/pipeline-run.json` (stages, status, timestamps), `out/agent-signals.json` (per-user card counts), `out/flags.json` (flag count)

---

### Page 1: KPI Selection ("What are we measuring?")

```
┌──────────────────────────────────────────────────────────────────────┐
│  KPI Selection                                                       │
│  "What KPIs did the system pick for each user, and why?"             │
│                                                                      │
│  User: [Surge ▼]                                                     │
│                                                                      │
│  SUFFICIENT KPIs (will produce full signal cards)                    │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  Win Rate                                              [🚩]│     │
│  │  Status: ✅ Sufficient                                      │     │
│  │  Data source: Zoho CRM Deals (245 records, Jan-Mar 2026)   │     │
│  │  Why selected: Requested by user during onboarding.         │     │
│  │  Formula: Closed Won / Total Deals with Stage value         │     │
│  │  ▸ Show raw data                                            │     │
│  └────────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  Support Issue Volume                                  [🚩]│     │
│  │  Status: ✅ Sufficient                                      │     │
│  │  Data source: Zoho Desk (4,645 tickets)                     │     │
│  │  Why selected: Flagged as key metric in onboarding.         │     │
│  │  Formula: Count of tickets in current period                │     │
│  │  ▸ Show raw data                                            │     │
│  └────────────────────────────────────────────────────────────┘     │
│  ... (more KPIs)                                                     │
│                                                                      │
│  INSUFFICIENT KPIs (missing data — will produce gap cards)           │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  Calls Per Week                                        [🚩]│     │
│  │  Status: ❌ Insufficient                                    │     │
│  │  What's missing: Zoho CRM Activities export                 │     │
│  │  What it would tell you: Call volume trends, rep activity   │     │
│  │  Which decision it helps: Market expansion timing           │     │
│  └────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

**Data sources:** `out/agent-signals.json` (KPI selections per user), `out/strategy-catalogue.json` (selection rationale), `data/kpi-spec/kpi-spec-v1.json` (formula descriptions)

---

### Page 2: Data Quality ("Is the input data clean?")

```
┌──────────────────────────────────────────────────────────────────────┐
│  Data Quality                                                        │
│  "Did the input files pass our quality checks?"                      │
│                                                                      │
│  SUMMARY: 5 files checked · 3 passed · 2 warnings · 0 failures      │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  Zoho Desk Tickets (zoho-desk-export.xlsx)             [🚩]│     │
│  │  Status: 🟡 Warning                                        │     │
│  │  Records: 4,645  ·  Date range: Oct 2024 – Mar 2026        │     │
│  │                                                              │     │
│  │  Issues found:                                               │     │
│  │  ⚠ Category column: 42% of values are blank.                │     │
│  │    Impact: Breakdown by category may be incomplete.          │     │
│  │  ⚠ 12 duplicate ticket IDs found.                           │     │
│  │    Impact: Volume counts may be slightly inflated.           │     │
│  │                                                              │     │
│  │  ▸ Show raw quality report                                   │     │
│  └────────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  Zoho CRM Deals (deals-export.csv)                     [🚩]│     │
│  │  Status: 🟢 Pass                                            │     │
│  │  Records: 245  ·  Date range: Jan 2025 – Mar 2026           │     │
│  │  No issues found.                                            │     │
│  └────────────────────────────────────────────────────────────┘     │
│  ... (more files)                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

**Data sources:** `out/step-1c-data-quality.json` (new — produced by data-quality-check stage)

---

### Page 3: Computed Numbers ("Show me the math")

```
┌──────────────────────────────────────────────────────────────────────┐
│  Computed Numbers                                                    │
│  "What did the formulas produce? Are the numbers right?"             │
│                                                                      │
│  User: [Surge ▼]                                                     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  Win Rate                                              [🚩]│     │
│  │                                                              │     │
│  │  RESULT                                                      │     │
│  │  Current: 38%  ·  Previous: 32%  ·  Trend: ↑ +6 points      │     │
│  │  Data as of: 27 Mar 2026                                     │     │
│  │                                                              │     │
│  │  FORMULA                                                     │     │
│  │  Closed Won deals ÷ Total deals with a Stage value           │     │
│  │  = 93 won ÷ 245 total = 38%                                  │     │
│  │                                                              │     │
│  │  SOURCE                                                      │     │
│  │  File: data/zoho-crm/deals-export.csv                        │     │
│  │  Rows used: 245 (all)  ·  Period: Jan 2025 – Mar 2026        │     │
│  │                                                              │     │
│  │  BREAKDOWNS                                                  │     │
│  │  ┌─────────────────────────────────────────────────┐        │     │
│  │  │  By Deal Stage      │ Count │ Win Rate          │        │     │
│  │  │  Qualification       │   82  │  29%              │        │     │
│  │  │  Proposal            │   64  │  42%              │        │     │
│  │  │  Negotiation         │   52  │  54%              │        │     │
│  │  │  Closed Won          │   93  │  —                │        │     │
│  │  └─────────────────────────────────────────────────┘        │     │
│  │                                                              │     │
│  │  ▸ Show raw computed data                                    │     │
│  └────────────────────────────────────────────────────────────┘     │
│  ... (more KPIs)                                                     │
└──────────────────────────────────────────────────────────────────────┘
```

**Data sources:** `out/step-2-3-computed.json` (new — produced by compute-values + compute-breakdowns stages)

---

### Page 4: LLM Input / Output ("What was the AI told, and what did it say?")

```
┌──────────────────────────────────────────────────────────────────────┐
│  LLM Input / Output                                                  │
│  "What context did the AI receive, and what did it produce?"         │
│                                                                      │
│  User: [Surge ▼]  ·  Card: [Win Rate ▼]                             │
│                                                                      │
│  ┌─── WHAT THE AI WAS GIVEN ──────────────────────────────────┐     │
│  │                                                              │     │
│  │  DETERMINISTIC DATA (from Computed Numbers)                  │     │
│  │  Value: 38%  ·  Trend: ↑ +6pt  ·  245 deals                │     │
│  │  Breakdowns: by stage (4 groups), by source (3 groups)      │     │
│  │                                                              │     │
│  │  RETRIEVED: User Context (KB1)                           [🚩]│     │
│  │  "Surge is Head of Sales at Locumate. Key concern:           │     │
│  │   scaling the sales team without sacrificing win rate.        │     │
│  │   Active decision: hire 2 more reps vs. invest in            │     │
│  │   sales enablement tooling."                                 │     │
│  │  Source: kb1-locumate-user-surge.md (chunk 3, score: 0.87)   │     │
│  │                                                              │     │
│  │  RETRIEVED: Benchmarks (KB2)                             [🚩]│     │
│  │  "Healthy win rate for seed-stage SaaS: 25-35%.              │     │
│  │   Top quartile: 40%+. Source: OpenView SaaS Benchmarks       │     │
│  │   2025, p.14."                                               │     │
│  │  Source: kb2-saas-sales-benchmarks.md (chunk 7, score: 0.91) │     │
│  │                                                              │     │
│  │  RETRIEVED: Analysis Pattern (KB3)                       [🚩]│     │
│  │  "When analysing win rate: 1) Check by deal stage,           │     │
│  │   2) Check by lead source, 3) Check time trend,              │     │
│  │   4) Compare to benchmark, 5) Link to pipeline health."      │     │
│  │  Source: kb3-chain-of-thought-templates.md (chunk 2)         │     │
│  │                                                              │     │
│  │  ▸ Show full assembled prompt                                │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌─── WHAT THE AI PRODUCED ───────────────────────────────────┐     │
│  │                                                              │     │
│  │  ANALYSIS                                                [🚩]│     │
│  │  Conclusion: "Win rate improved 6 points to 38%, driven      │     │
│  │  primarily by stronger conversion at the Proposal stage..."  │     │
│  │  Chain of thought:                                           │     │
│  │   • Checked by stage: Proposal conversion up from 35%→42%   │     │
│  │   • Checked by source: Referral leads win at 52% vs 31%     │     │
│  │   • Time trend: steady improvement over 3 months            │     │
│  │   • Benchmark: 38% is above median (25-35%) for stage       │     │
│  │                                                              │     │
│  │  SYNTHESIS — Version A (Org-level)                       [🚩]│     │
│  │  "At 38%, Locumate's win rate sits above the seed-stage      │     │
│  │   SaaS median of 25-35% (OpenView 2025)..."                 │     │
│  │                                                              │     │
│  │  SYNTHESIS — Version B (Personal)                        [🚩]│     │
│  │  "At 38%, your win rate is strong — but the real question    │     │
│  │   for your hiring-vs-tooling decision is whether adding      │     │
│  │   reps will maintain this rate..."                           │     │
│  │                                                              │     │
│  │  ▸ Show raw LLM response                                    │     │
│  └──────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

**Data sources:** `out/step-4-llm-calls.json` (new — produced by rag-prompt-assembly + LLM call)

---

### Page 5: Card Review ("The final product")

Upgrades the existing `apps/qc-ui/pages/preview/signal.vue`.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Card Review                                                         │
│  "Would the user say 'yes, this is right' if they saw this?"        │
│                                                                      │
│  User: [Surge ▼]  ·  Version: [A: Org-level ▼]                      │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  [Requested] [Sufficient] [Narrative: LLM]             [🚩]│     │
│  │                                                              │     │
│  │  kpi.win_rate                                                │     │
│  │  Win Rate                                                    │     │
│  │  38%                                                         │     │
│  │  ↑ +6 points  ·  Data as of 27 Mar 2026                     │     │
│  │  Calculated from 245 Zoho CRM Deals                          │     │
│  │                                                              │     │
│  │  ── Analysis ──────────────────────────────────────────────  │     │
│  │  Win rate improved 6 points to 38%...                        │     │
│  │  [🚩 Flag analysis]                                          │     │
│  │                                                              │     │
│  │  ── So What ───────────────────────────────────────────────  │     │
│  │  At 38%, Locumate's win rate sits above...                   │     │
│  │  [🚩 Flag synthesis]                                         │     │
│  │                                                              │     │
│  │  Related signals: Pipeline Value (+12%), Prospects (flat)    │     │
│  │                                                              │     │
│  │  ▸ Provenance details                                        │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  (next card...)                                              │     │
│  └────────────────────────────────────────────────────────────┘     │
│  ... (all cards on one scrollable page)                              │
└──────────────────────────────────────────────────────────────────────┘
```

**Key differences from current signal preview:**
- All cards visible on one page (not one-at-a-time with Prev/Next)
- Version A / B toggle at the top (switches all cards)
- Flag buttons per section (analysis, synthesis, number, KPI selection)
- Data freshness + provenance always visible (not hidden in expandable)

**Data sources:** `out/processed-signals.json` (existing — already produced by write_artifacts stage)

---

### Page 6: Flagged Issues ("What needs fixing")

```
┌──────────────────────────────────────────────────────────────────────┐
│  Flagged Issues                                                      │
│  3 issues flagged on this run                       [Copy all 📋]   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  🚩 Page: Computed Numbers · KPI: Win Rate                  │     │
│  │  Note: "Formula should exclude cancelled deals — they're    │     │
│  │         inflating the denominator"                           │     │
│  │  Flagged: 30 Mar 2026, 15:04                    [Remove ✕]  │     │
│  └────────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  🚩 Page: LLM Input · Card: Support Volume · KB2 retrieval  │     │
│  │  Note: "Wrong benchmark pulled — this is for enterprise,    │     │
│  │         not seed-stage"                                      │     │
│  │  Flagged: 30 Mar 2026, 15:12                    [Remove ✕]  │     │
│  └────────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  🚩 Page: Card Review · Card: Prospects · Section: Synth.   │     │
│  │  Note: (no note)                                             │     │
│  │  Flagged: 30 Mar 2026, 15:18                    [Remove ✕]  │     │
│  └────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

**Data sources:** `out/flags.json` (new — written by the dashboard itself)

---

## JSON Contracts (Pipeline to Dashboard)

These are the intermediate output files the pipeline must produce for the dashboard to read. Each file is the **contract** between the pipeline stage and the dashboard page.

### Existing files (already produced — dashboard reads as-is or with minor additions)

**`out/pipeline-run.json`** — already produced by `src/pipeline/run-manifest.ts`
- Used by: Page 0 (Run Summary)
- Contains: `runId`, `status`, `startedAt`, `finishedAt`, `stages[]` with per-stage status and timestamps
- No changes needed

**`out/agent-signals.json`** — already produced by write_artifacts stage
- Used by: Page 0 (Run Summary), Page 1 (KPI Selection)
- Contains: per-user `requestedKpis`, `recommendedKpis`, `selectionRationale`
- Minor addition needed: add `dataSources` and `sufficiencyReason` per KPI

**`out/strategy-catalogue.json`** — already produced by org_strategy stage
- Used by: Page 1 (KPI Selection — selection rationale)
- Contains: `kpis[]` with `kpiId`, `title`, `horizon`, `userId`, `rationale`
- No changes needed

**`out/processed-signals.json`** — already produced by write_artifacts stage
- Used by: Page 5 (Card Review)
- Contains: per-user `cards[]` with overview, expanded, insufficient sections
- Additions needed for RAG upgrade: `dataFreshness`, `provenanceSummary`, `qualityNotes`, `crossSignalReferences`, `cardVersion` (A/B)

### New files (must be produced by new pipeline stages)

**`out/step-1c-data-quality.json`** — produced by data-quality-check stage (Step 10 in RAG plan)
- Used by: Page 0 (Run Summary — warnings count), Page 2 (Data Quality)

```json
{
  "generatedAt": "2026-03-30T14:32:00Z",
  "runId": "run-2026-03-30-1432",
  "summary": {
    "filesChecked": 5,
    "passed": 3,
    "warnings": 2,
    "failures": 0
  },
  "files": [
    {
      "fileName": "zoho-desk-export.xlsx",
      "filePath": "data/zoho-desk/zoho-desk-export.xlsx",
      "status": "warn",
      "recordCount": 4645,
      "dateRange": { "start": "2024-10-01", "end": "2026-03-27" },
      "issues": [
        {
          "severity": "warn",
          "check": "null_rate",
          "column": "Category",
          "detail": "42% of Category values are blank.",
          "impact": "Breakdown by category may be incomplete."
        },
        {
          "severity": "warn",
          "check": "duplicates",
          "column": "TicketId",
          "detail": "12 duplicate ticket IDs found.",
          "impact": "Volume counts may be slightly inflated."
        }
      ]
    }
  ]
}
```

**`out/step-2-3-computed.json`** — produced by compute-values + compute-breakdowns stages (Step 11 in RAG plan)
- Used by: Page 3 (Computed Numbers)

```json
{
  "generatedAt": "2026-03-30T14:32:05Z",
  "runId": "run-2026-03-30-1432",
  "users": [
    {
      "userId": "surge",
      "kpis": [
        {
          "kpiId": "kpi.win_rate",
          "title": "Win Rate",
          "status": "sufficient",
          "formula": {
            "description": "Closed Won deals / Total deals with a Stage value",
            "expression": "count(Stage='Closed Won') / count(Stage IS NOT NULL)",
            "numerator": 93,
            "denominator": 245
          },
          "result": {
            "currentValue": "38%",
            "currentRaw": 0.3796,
            "previousValue": "32%",
            "previousRaw": 0.3200,
            "trend": "up",
            "delta": "+6 points"
          },
          "source": {
            "file": "data/zoho-crm/deals-export.csv",
            "rowsUsed": 245,
            "dateRange": { "start": "2025-01-01", "end": "2026-03-27" },
            "freshness": "2026-03-27"
          },
          "breakdowns": [
            {
              "dimension": "Deal Stage",
              "rows": [
                { "label": "Qualification", "count": 82, "metric": "29%" },
                { "label": "Proposal", "count": 64, "metric": "42%" },
                { "label": "Negotiation", "count": 52, "metric": "54%" },
                { "label": "Closed Won", "count": 93, "metric": "—" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**`out/step-4-llm-calls.json`** — produced by rag-prompt-assembly + LLM call (Step 12 in RAG plan)
- Used by: Page 4 (LLM Input/Output)

```json
{
  "generatedAt": "2026-03-30T14:32:10Z",
  "runId": "run-2026-03-30-1432",
  "cards": [
    {
      "userId": "surge",
      "kpiId": "kpi.win_rate",
      "input": {
        "deterministic": {
          "value": "38%",
          "trend": "up +6pt",
          "breakdownCount": 2,
          "breakdownSummary": "by stage (4 groups), by source (3 groups)"
        },
        "retrieved": {
          "kb1_user_context": {
            "text": "Surge is Head of Sales at Locumate. Key concern: scaling the sales team without sacrificing win rate...",
            "source": "kb1-locumate-user-surge.md",
            "chunkId": "chunk-3",
            "relevanceScore": 0.87
          },
          "kb2_benchmarks": {
            "text": "Healthy win rate for seed-stage SaaS: 25-35%. Top quartile: 40%+. Source: OpenView SaaS Benchmarks 2025, p.14.",
            "source": "kb2-saas-sales-benchmarks.md",
            "chunkId": "chunk-7",
            "relevanceScore": 0.91
          },
          "kb3_analysis_pattern": {
            "text": "When analysing win rate: 1) Check by deal stage, 2) Check by lead source, 3) Check time trend...",
            "source": "kb3-chain-of-thought-templates.md",
            "chunkId": "chunk-2",
            "relevanceScore": 0.84
          }
        },
        "assembledPromptTokenCount": 1842
      },
      "output": {
        "versionA": {
          "analysis": "Win rate improved 6 points to 38%, driven primarily by stronger conversion at the Proposal stage...",
          "analysisChainOfThought": [
            "Checked by stage: Proposal conversion up from 35% to 42%",
            "Checked by source: Referral leads win at 52% vs 31% average",
            "Time trend: steady improvement over 3 months",
            "Benchmark: 38% is above median (25-35%) for seed-stage SaaS"
          ],
          "synthesis": "At 38%, Locumate's win rate sits above the seed-stage SaaS median of 25-35% (OpenView 2025)...",
          "synthesisChainOfThought": [
            "Compared to benchmark range (25-35%) from OpenView 2025",
            "Company context: 14-person team, 3 CS staff"
          ],
          "citedBenchmarks": [
            { "claim": "seed-stage SaaS median: 25-35%", "source": "OpenView SaaS Benchmarks 2025, p.14" }
          ]
        },
        "versionB": {
          "analysis": "(same as Version A)",
          "synthesis": "At 38%, your win rate is strong — but the real question for your hiring-vs-tooling decision is whether adding reps will maintain this rate...",
          "synthesisChainOfThought": [
            "Same benchmarks as Version A",
            "Connected to Surge's active decision: hire 2 reps vs invest in tooling",
            "Risk: adding reps without enablement could dilute win rate"
          ],
          "citedBenchmarks": [
            { "claim": "seed-stage SaaS median: 25-35%", "source": "OpenView SaaS Benchmarks 2025, p.14" }
          ]
        },
        "modelUsed": "claude-sonnet-4-20250514",
        "inputTokens": 1842,
        "outputTokens": 624,
        "latencyMs": 3200
      }
    }
  ]
}
```

**`out/flags.json`** — written by the dashboard (not the pipeline)
- Used by: Page 0 (flag count badge), Page 6 (Flagged Issues)

```json
{
  "runId": "run-2026-03-30-1432",
  "flags": [
    {
      "id": "flag-001",
      "page": "computed-numbers",
      "itemId": "kpi.win_rate",
      "section": null,
      "note": "Formula should exclude cancelled deals — inflating the denominator",
      "createdAt": "2026-03-30T15:04:00Z"
    },
    {
      "id": "flag-002",
      "page": "llm-input-output",
      "itemId": "kpi.support_issue_volume",
      "section": "kb2_benchmarks",
      "note": "Wrong benchmark pulled — this is for enterprise, not seed-stage",
      "createdAt": "2026-03-30T15:12:00Z"
    }
  ]
}
```

---

## Build Sequence (synced with RAG pipeline phases)

The dashboard pages are built **alongside** the pipeline stages they inspect. Each batch below corresponds to a phase in the parent plan.

### Batch A — Build with Phase 0 (Foundation)

- [x] ✅ **A1: New navigation + layout** — `app.vue` top nav (inspector, signal preview, dev checks, transparency).
- [x] ✅ **A2: Run Summary page** — `pages/index.vue` + `/api/inspect/summary` reads `pipeline-v2-output.json`, step-1c summary, flag count (uses `out/` or `out/test-e2e-v2/` for v2 artifacts).
- [ ] 🟥 **A3: KPI Selection page** — Not built yet (`agent-signals.json` / strategy catalogue view).
- [x] ✅ **A4: Flagging system (MVD)** — `GET/POST /api/flags` + `pages/inspect/flags.vue` (file `out/flags.json`). Per-card flag buttons not added.
- [x] ✅ **A5: Move old checks** — `pages/dev-checks.vue` holds former home content; `/` is Run Summary.

### Batch B — Build with Phase 1, Steps 10-11 (Data Quality + Compute)

- [x] ✅ **B1: Data Quality page** — `pages/inspect/data-quality.vue` + `/api/inspect/data-quality`.
- [x] ✅ **B2: Computed Numbers page** — `pages/inspect/computed.vue` + `/api/inspect/computed` (breakdowns in JSON; UI shows core fields).

### Batch C — Build with Phase 1, Steps 12-15 (RAG + Cards)

- [x] ✅ **C1: LLM Input/Output page** — `pages/inspect/llm.vue` + `/api/inspect/llm` (summary + expandable analysis/synthesis).
- [x] ✅ **C2: Upgrade Card Review page (partial)** — v2: “All cards” scroll + A/B version via `/api/preview/signal-deck` + `SignalCardBody.vue`. Per-section flag buttons still TODO.

### Batch D — Polish (after Phase 1 is running)

- [ ] **D1: Run Summary enhancements** — Add timing per stage, warning summaries, direct links to the page/item with issues.
- [ ] **D2: "Copy all flags" export** — One-click copy of all flagged issues as markdown, for pasting into a chat or doc.
- [ ] **D3: Show full assembled prompt** — Expandable section on the LLM page showing the exact prompt sent to Claude (for debugging retrieval/prompt issues).

---

## What We Keep, Replace, and Add

- **Keep as-is:** Transparency pages (org-context, recommendations, kpi-dictionary), server API patterns, Nuxt app structure
- **Replace:** `index.vue` home page (becomes Run Summary)
- **Upgrade:** `preview/signal.vue` (becomes Card Review with all-cards view + flagging)
- **Add:** 5 new pages (KPI Selection, Data Quality, Computed Numbers, LLM Input/Output, Flagged Issues)
- **Move:** Old pass/fail checks to `/dev-checks` route (for developer use)

---

## Files Changed / Created

**Existing files modified:**
- `apps/qc-ui/app.vue` — new navigation structure
- `apps/qc-ui/pages/index.vue` — replaced with Run Summary content
- `apps/qc-ui/pages/preview/signal.vue` — upgraded to Card Review (all cards, A/B toggle, flagging)

**New page files:**
- `apps/qc-ui/pages/inspect/kpi-selection.vue` — Page 1
- `apps/qc-ui/pages/inspect/data-quality.vue` — Page 2
- `apps/qc-ui/pages/inspect/computed-numbers.vue` — Page 3
- `apps/qc-ui/pages/inspect/llm-io.vue` — Page 4
- `apps/qc-ui/pages/inspect/flags.vue` — Page 6
- `apps/qc-ui/pages/dev-checks.vue` — old pass/fail checks moved here

**New API files:**
- `apps/qc-ui/server/api/inspect/run-summary.get.ts` — reads pipeline-run.json + agent-signals.json
- `apps/qc-ui/server/api/inspect/kpi-selection.get.ts` — reads agent-signals + strategy-catalogue + kpi-spec
- `apps/qc-ui/server/api/inspect/data-quality.get.ts` — reads step-1c-data-quality.json
- `apps/qc-ui/server/api/inspect/computed-numbers.get.ts` — reads step-2-3-computed.json
- `apps/qc-ui/server/api/inspect/llm-io.get.ts` — reads step-4-llm-calls.json
- `apps/qc-ui/server/api/flags/index.get.ts` — reads flags.json
- `apps/qc-ui/server/api/flags/index.post.ts` — writes to flags.json
- `apps/qc-ui/server/api/flags/[id].delete.ts` — removes a flag

**New type files:**
- `apps/qc-ui/types/inspect.ts` — shared types for inspect API responses
- `apps/qc-ui/types/flags.ts` — flag data types

**Pipeline additions (in parent plan, noted here for reference):**
- Pipeline stages must write `out/step-1c-data-quality.json`, `out/step-2-3-computed.json`, `out/step-4-llm-calls.json` as defined in the JSON contracts above
