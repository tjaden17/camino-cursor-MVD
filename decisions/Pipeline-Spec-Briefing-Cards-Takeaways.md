# Pipeline Spec: Data Briefing Cards + Issue Tree Takeaways

**Canonical product spec for the MVD Pipeline (briefing / takeaways path)**  
Date: 2 Apr 2026  
Status: Draft — product owner: Nhat  
Author: Camino product team

---

## Source of truth

This document is the **single authoritative spec** for:

- The briefing-cards + issue-tree + branch-takeaways pipeline (Stages 0–6).
- Org-level onboarding, analysis output shape, lenses, QC, and artifact expectations.

All implementation must conform to this spec. Where code or other docs conflict, **this file wins** unless this file is updated first.

**Related documents (reference only — do not contradict this spec):**

| Document | Role |
|----------|------|
| `decisions/Universal-Issue-Tree-Framework.md` | Universal tree template (branches, sub-issues); Stage 2 references it. |
| `decisions/Data-Briefing-Cards-Ideation-1Apr` | Origin rationale (observation-first vs formula-first). |
| `decisions/Data-Briefing-Cards-Prototype-1Apr.md` | Locumate worked example of card content. |
| `docs/business-context/Current-state-worfklow-and-result` | Manual workflow narrative; this spec is the automated target. |
| `docs/architecture/SIGNAL_CARD_BLOCKS_MAPPING_V2.md` | QC UI / v2 signal card layout; implementation may diverge from briefing pipeline. |
| `src/pipeline/stages/run-pipeline-v2.ts` + `kpi-compute.ts` | Legacy KPI-first pipeline; not the source of truth for briefing takeaways. |

---

## Design decisions (CDO-reviewed, 2 Apr 2026)

These decisions are final for the MVD unless this spec is revised:

| # | Decision | Resolution |
|---|----------|------------|
| 1 | File formats | CSV **and** XLSX. Stage 1 must parse both. |
| 2 | Data inventory in org file | **Required**, not optional. Lists every registered file with `sourceId`, `filePath`, and `idColumn`. |
| 3 | ID column detection | **Declared** in data inventory. No heuristic guessing. |
| 4 | Incremental data | **Full-replace per run.** No diffing, no incremental logic. |
| 5 | Large-file data excerpt strategy | Code pre-computes aggregations; LLM receives summaries + tables + sample rows. See Stage 1. |
| 6 | Code-verified counts | **Required** before LLM QC. Deterministic counts validated in code; LLM QC focuses on interpretation only. |
| 7 | Time periods | Every analysis number must state its time window. Misaligned windows across sources must be flagged. |
| 8 | Cross-source analysis | **Deferred.** Out of scope for MVD. Intent is clear (multi-dataset "aha" observations) but design is too ambiguous to spec. Revisit when intent sharpens. |
| 9 | Run-over-run deltas | **Out of scope for MVD.** Each run stands alone. No comparison to previous runs. |
| 10 | Stage 6 output shape | **Single JSON file** per org per run. No per-lens splits. |
| 11 | Artifact retention | **No retention policy.** Keep all `briefing-runs/{runId}/` folders. |
| 12 | Previous run context for QC | **No.** Each run's QC stands alone. No prior-run comparison in prompts. |

---

# OVERVIEW

This pipeline takes raw customer data exports and all onboarding profiles for an org, and produces two outputs:

1. **Analysis cards** — per-sub-issue observations with reasoning (what the Analysis screen shows).
2. **Branch takeaways** — cross-KPI synthesis per issue tree branch (what the Takeaway screen shows).

Both are organised under the universal issue tree framework (Volume, Value, Retention, Capacity).

**Scope:** One **org** per run (e.g. Locumate). Multiple users (e.g. Surge, Sam) contribute onboarding; the issue tree and analysis are org-level. Per-user **views** (which branches or lenses matter most) are filters on top of the org output.

**Data model:** Full-replace per run. No incremental logic or delta computation between runs.

**Acceptance test:** Three HTML screens must render directly from the Stage 6 JSON output:

1. `decisions/MVD-v2-Analysis.html` — per sub-issue KPI detail
2. `decisions/MVD-v2-Issue-Takeaway.html` — per branch executive takeaway
3. `decisions/Issue-Tree-Revenue-Locumate.html` — full issue tree overview with expandable sub-issues

The pipeline output is "correct" when these three screens match the quality and content of their current hardcoded versions. See the UI Output Contract section (after Stage 6) for exact JSON shapes.

---

# STAGE 0: ONBOARDING INGESTION (ORG-LEVEL, MULTI-USER)

The pipeline must not assume a single user. All customers will have multiple users; store all profiles under the org.

## Input

- One folder per org: `data/onboarding/{orgId}/`
  - `{userId}-onboarding-derived.json` per user (or raw CSVs / PDF notes to derive from)
  - All users who should receive Camino (CEO, CSM, etc.)

## What happens

1. **Per user:** Extract structured fields from free-text onboarding (CSV, interview notes, form).

2. **Org merge:** Build or refresh an **org file** at `data/org/{orgId}/org-context.json`. Lists contributors, merges company context (role-based tie-break for conflicting fields — same concept as `mergeOrgContext` in `src/org/merge-org.ts`), and aggregates decision context from all profiles.

3. **Decision augmentation (RAG):** User-stated `decision_outcomes` are often incomplete. After RAG retrieval of role/industry/stage-relevant knowledge (`knowledge/kb2-*`, `knowledge/kb1-*`), run an LLM step to propose likely decisions for the next 90 days. This covers both:
   - **Own decisions** — decisions the user directly makes.
   - **Supporting decisions** — decisions owned by others that this user must enable or align with.

   Output: a single flat list per user, each entry tagged `user_stated`, `rag_suggested`, or `rag_suggested_supporting`. All are **shipped immediately** — no approval gate blocks lens generation. The user can review and dismiss in-product later.

4. **Quality gate:** Minimum per user: `role`, link to `orgId`. Org-level: at least one contributor with `primary_goals` or merged org goals. Flag gaps.

## Output

- `data/onboarding/{orgId}/{userId}-onboarding-derived.json` (per user)
- `data/org/{orgId}/org-context.json` (org snapshot)

## Org file contents

The org file is the **required** contract between onboarding and the rest of the pipeline:

- `orgId`, `orgName`, `mergedCompanyContext` (industry, stage, model, team size — merged from profiles)
- `contributors[]`: `userId`, `displayName`, `role`, `roleRank`, path to onboarding JSON
- `orgDecisions[]`: merged from all users; each entry carries `userId`, `decision`, `source` tag (`user_stated` | `rag_suggested` | `rag_suggested_supporting`)
- **`dataInventory[]` (required):** Every registered data file for this org. Each entry:
  - `sourceId`: stable identifier (e.g. `zoho_crm_deals`)
  - `filePath`: relative path to the file (e.g. `data/zoho/Zoho - CRM - Deals.csv`)
  - `format`: `csv` | `xlsx`
  - `idColumn`: the column to use as primary key for dedup (declared, not inferred)
  - `sheetName`: required when `format` is `xlsx` (e.g. `"Tickets-Desk"`)
- Optional: `strategyCatalogue` / mirrors for parity with existing v1.1 pipeline

Reference implementation concept: `src/org/merge-org.ts` + `src/org/types.ts`.

## LLM prompts

**Per user — raw → JSON:**

```
Here is a customer onboarding questionnaire (CSV or notes). Extract into JSON:
user (user_id, name, role), company_context (industry, stage, team size,
business model), decision_context (primary goals, review cadence,
decision_outcomes), owned_metrics, data_sources, pain_points,
trust_and_validation, gaps_and_assumptions. Normalise conversational text
into clean values; note missing fields in gaps.
```

**Per user — decision augmentation (after RAG retrieve):**

```
User: {name}, role: {role}, at {company} ({industry}, {stage}).
Stated goals and decision_outcomes: {from profile}.
Retrieved context (benchmarks / role patterns): {RAG chunks}.

List 3–7 specific decisions this person is likely to face in the next 90 days.
Include both decisions they OWN and decisions they SUPPORT (owned by others
but requiring their input or alignment). Prefer concrete business decisions
over workflow wishes. Tag each: user_stated | rag_suggested |
rag_suggested_supporting. Do not invent company-specific facts.
```

---

# STAGE 1: RAW DATA INGESTION, SCHEMA DETECTION & SUMMARY STATISTICS

Schema detection, summary statistics, and data excerpt preparation are **required** deliverables, not future work.

## Input

- Data files listed in the org file's `dataInventory[]` (CSV and XLSX supported).

## What happens (all code — no LLM)

1. **File parsing** — CSV: parse with `csv-parse` (as today). XLSX: parse with a library (e.g. `xlsx` / `exceljs`), using the `sheetName` from data inventory. Both produce the same internal representation: array of row objects keyed by column header.

2. **Schema detection** — Infer per column using this priority order:
   - Try **date** parse (ISO, DD-Mon-YY, DD/MM/YYYY, etc.) → `date`
   - Try **boolean** (`true`/`false`, `yes`/`no`) → `boolean`
   - Try **currency** (matches pattern like `AUD 54,000.00`, `$1,200`, etc.) → `currency`
   - Try **numeric** (all non-blank values parse as numbers) → `numeric`
   - If fewer than 50 unique non-blank values → `categorical`
   - Otherwise → `free_text`
   - Detect likely ID columns: use the `idColumn` declared in data inventory (no heuristic guessing).

3. **Cleaning** — Duplicate removal by declared `idColumn`; trim whitespace; normalise blanks (`""`, `"null"`, `"None"` → null).

4. **Validation** — Date columns parseable; currency/numeric coercible; ID uniqueness on declared `idColumn`.

5. **Summary statistics** — Per file: row count, column count, `dateRange` (earliest/latest). Per column: `% populated`, categorical value distributions (top N + other), numeric min/max/mean, duplicate-row counts.

6. **Quality notes** — Rules (e.g. column under 20% populated → warn); optional thresholds per org.

7. **Data excerpt preparation (for large files)** — For files over 500 rows, pre-compute in code:
   - **Group-by counts** on every categorical column (e.g. Stage: Closed Won = 13, Closed - No Budget = 8, ...)
   - **Min / max / mean / sum** on every numeric and currency column
   - **Top 20 rows** sorted by the most impactful dimension (declared in data inventory or defaulting to the first currency/numeric column descending)
   - **Date-bucketed counts** on date columns (by month)

   These pre-computed tables are stored in the Stage 1 output and injected into the LLM prompt in Stage 3 alongside the schema summary. For files under 500 rows, the full cleaned CSV is sent to the LLM instead.

## Output per file

```
{
  "sourceId": "zoho_crm_deals",
  "filePath": "data/zoho/Zoho - CRM - Deals.csv",
  "format": "csv",
  "idColumn": "Id",
  "rowCount": 32,
  "columns": [
    {
      "name": "Stage",
      "type": "categorical",
      "populated": "100%",
      "values": { "Closed Won": 13, "Closed - No Budget": 8, "Qualification": 3, "Proposal": 3, "Contracts": 2, "Needs Analysis": 1, "Negotiation": 1, "Value Proposition": 1 }
    },
    {
      "name": "Amount",
      "type": "currency",
      "populated": "87.5%",
      "min": 1200,
      "max": 500000,
      "mean": 95400,
      "sum": 3052800
    },
    {
      "name": "Lead Source",
      "type": "categorical",
      "populated": "19%",
      "values": { "Customer Event": 3, "New Business": 3, "(empty)": 26 }
    }
  ],
  "dateRange": { "earliest": "2024-05-07", "latest": "2025-12-26" },
  "qualityNotes": [
    { "level": "warn", "message": "Lead Source only 19% populated" },
    { "level": "warn", "message": "4 Closed Won deals have no Amount" }
  ],
  "excerpt": {
    "strategy": "full",
    "note": "32 rows — under 500 threshold; full CSV sent to LLM"
  }
}
```

For large files (over 500 rows), the `excerpt` field would contain `"strategy": "aggregated"` and the pre-computed tables.

---

# STAGE 2: ISSUE TREE INSTANTIATION

## Framework policy: Option A — fixed template, custom framing only

- The **four branches** (Volume, Value, Retention, Capacity) and their universal sub-issues stay fixed — see `decisions/Universal-Issue-Tree-Framework.md`.
- Only the **root / parent issue label** is customised from onboarding (e.g. "How does Locumate reach its next stage of growth?"). The decomposition underneath maps to the same four branches regardless.
- Customers who want a fundamentally different tree shape or parent issue that breaks Volume × Value × Retention + Capacity is a **later product problem** — not in scope until this spec is revised.

## Input

- Universal framework doc (or encoded template)
- **All** org onboarding profiles from Stage 0 (e.g. Surge + Sam)
- Data source summaries from Stage 1

## What happens

1. Instantiate tree with org's `rootIssue` string from onboarding (exec / merged preference).
2. For each sub-issue, assess data coverage from Stage 1 → `MEASURABLE` | `PARTIAL` | `GAP`.
3. **Ownership:** Auto-assign branch/sub-issue owners from roles (e.g. CEO → Volume + Capacity; CSM → Retention). Tag as `ownerSuggested: true`. Role-based defaults only for now; admin override in a future version.
4. Merge role goals from all users for lensing prioritisation later.

## Output

- `issueTree` JSON. Owner fields carry `suggested` metadata until a future human-in-the-loop confirmation feature exists.

## LLM prompt (per data file — ambiguous column → sub-issue mapping)

```
Here is ONE data file summary from our ingestion step:
- sourceId, rowCount, dateRange
- columns: name, type, populated %, sample values or distributions

Here is the list of universal sub-issues (id + label + question) under
Volume, Value, Retention, Capacity.

Which sub-issues can this file help measure? For each match, list which
columns would be used and whether coverage is likely full, partial, or
gap-only.
Output JSON: { "matches": [ { "subIssueId", "columns", "confidence", "rationale" } ] }
```

---

# STAGE 3: DATA ANALYSIS (PER SUB-ISSUE) + RAG + QC

## Input

- Instantiated issue tree (Stage 2)
- Raw data (cleaned) + Stage 1 summaries and excerpts
- Org context: merged company profile, competitors if stated in onboarding
- RAG: retrieved chunks for benchmarks and domain context

Competitors and richer company context belong in the analysis prompt whenever present in onboarding or org KB.

## 3a — Per sub-issue analysis (LLM)

For each sub-issue marked `MEASURABLE` or `PARTIAL`:

- Inject competitor context from onboarding when present.
- Inject retrieved benchmark / interpretation chunks (with source paths); model must only cite benchmarks present in retrieved text.
- For small files (under 500 rows): inject full cleaned CSV.
- For large files (over 500 rows): inject Stage 1 summary + pre-computed group-by tables + top 20 sample rows from Stage 1 excerpt.

Core prompt structure is in the Analysis prompt section at the end of this stage.

## 3b — RAG benchmarks: staying current, comprehensive, accurate

Knowledge lives in version-controlled markdown (e.g. `knowledge/kb2-saas-sales-benchmarks.md`, domain packs).

1. **Freshness:** KB is a product artifact — scheduled quarterly review, changelog per file, "last reviewed" in file header or sidecar JSON.
2. **Comprehensiveness:** Coverage matrix (industry × stage × metric family); gaps flagged before new customer onboarding.
3. **Accuracy:** Named publishers and dated references in KB text; retrieval returns source path + heading; prompts forbid fabricated citations.
4. **Operational:** Re-embed / re-index on KB change; pin embedding model version; optional human spot-check on retrieved sets for new customers.

Process owner for KB refresh and coverage matrix should be assigned (ops or product).

## 3c — Versioned artifacts for human QC (required)

Write **immutable run artifacts** so the product owner can tweak prompts/spec and compare outputs across runs.

Path pattern: `out/briefing-runs/{runId}/`

- `manifest.json` — `runId`, `generatedAt`, git commit or spec version string, `pipelineSpecRef` (path + hash of this doc)
- `stage-1-summaries.json` — Stage 1 outputs (including excerpts)
- `stage-2-issue-tree.json`
- `stage-3-analysis/` — one file per sub-issue (e.g. `subissue-1.3.json`)
- `stage-3-prompts/` — optional: resolved prompts actually sent (for diffing when spec changes)

New runs must **not overwrite** previous run folders. Use new `runId` each time. No retention policy — keep all folders.

## 3d — Quality control (code-verified counts + LLM review, batched per branch)

QC happens in **two layers**. Both are required.

**Layer 1 — Code-verified counts (required, runs first):**

Before LLM QC, deterministic code checks every countable claim in each analysis card against the source CSV/XLSX:
- Row counts (e.g. "13 Closed Won" → verify `rows.filter(Stage === 'Closed Won').length === 13`)
- Sums (e.g. "$914K won" → verify sum of Amount where Stage = Closed Won)
- Percentages derived from counts (e.g. "41%" → verify 13/32)
- Column existence (every column name referenced must exist in the Stage 1 schema)

If a code check fails, the card is tagged `needs_review` immediately with a `codeVerificationFailed` flag and the specific discrepancy. The card still proceeds to LLM QC so interpretive issues are also caught.

**Layer 2 — LLM QC (batched per branch):**

After all analysis cards for a branch are produced, run **one QC call per branch**. The LLM focuses on **interpretive** quality, not arithmetic (which code already verified):

```
You are an independent auditor. Here are the analysis cards for the
{branch label} branch and the source data summaries they reference.

Code-verified counts have already passed for cards not flagged. Focus on:
1. Any claim not directly supported by the source data (hallucination risk).
2. Whether patterns and anomalies cited are reasonable given the data shape.
3. Whether time periods are stated for every number.
4. Whether comparisons across data sources with different time windows are
   flagged as misaligned.
5. Output JSON:
   {
     "branch": "{branch}",
     "cards": [
       {
         "cardId": "...",
         "pass": true|false,
         "issues": [],
         "suggestedFixes": []
       }
     ]
   }
```

**On failure (`pass: false` from either layer):** Tag the card as `needs_review`. Do **not** fail the run. Write to `qc-failures.json` in the run folder (see QC Failure Handling section).

## Analysis prompt (per sub-issue)

```
You are Camino, a data analyst assistant. You produce factual observations
from raw business data.

Context:
- Company: {company name}, {industry}, {stage}
- Competitors: {if available from onboarding}
- Sub-issue: {sub-issue label} (e.g. "1.3 Closing")
- Parent branch: {branch label} (e.g. "Volume — Get More Customers")
- Question: {sub-issue question}

Data provided:
{Full CSV for small files, OR pre-computed tables + sample rows for large files}

Column summary:
{From Stage 1: names, types, % populated, distributions}

Benchmarks (retrieved from knowledge base):
{RAG chunks with source paths — only if available}

Instructions:
1. Identify which KPIs can be calculated from this data for this sub-issue.
2. For each KPI, calculate the value. Show your working.
3. State the TIME PERIOD every number covers (e.g. "Sep 2025", "all-time").
4. If comparing across data sources with different time ranges, flag the
   mismatch explicitly.
5. Note patterns, anomalies, or concentrations.
6. Note data quality issues that affect the calculation.
7. Do NOT judge whether the number is good or bad — state facts.
8. Mark each KPI: MEASURED | PARTIAL | GAP.

Output JSON:
{
  "subIssueId": "1.3",
  "kpis": [
    {
      "name": "Win Rate (by count)",
      "value": "41%",
      "timePeriod": "all-time (May 2024 – Dec 2025)",
      "status": "measured",
      "context": "13 Closed Won / 32 total deals.",
      "reasoning": [
        "Source: Zoho CRM Deals (32 rows, May 2024 – Dec 2025)",
        "Filtered Stage = 'Closed Won': 13 deals",
        "13 / 32 total = 41%"
      ]
    }
  ],
  "qualityNotes": []
}
```

---

# STAGE 4: BRANCH TAKEAWAY SYNTHESIS + LLM QUALITY CONTROL

## Input

- All analysis cards for the branch (Stage 3)
- Branch definition (Stage 2)
- Org + contributor context (Stage 0)

## 4a — Takeaway (LLM)

One call per branch; synthesise across sub-issues; output JSON with `title`, `text`, `reasoning`.

```
You are Camino, a signal intelligence assistant. You synthesise data
observations into executive-level takeaways.

Branch: {branch label} — {branch question}
Owner: {owner from onboarding}
User context: {role}, {company}, {stage}.
Upcoming decisions: {decisions from Stage 0, all tags}

Analysis cards for this branch:
{All analysis card JSONs from Stage 3 for this branch}

Instructions:
1. Read across ALL sub-issues in this branch.
2. Write a KEY TAKEAWAY that synthesises the combined picture.
3. Give it a 2–4 word title a CEO would remember.
4. Body is 2–3 sentences. Every number must come from analysis cards.
5. State time periods where relevant.
6. Highlight the most consequential finding, not the most interesting.
7. If data gaps are the main story, say so.
8. Do not judge good/bad — state facts.
9. Write for a CEO scanning on their phone at 7am.

Also provide REASONING: 4–6 bullet points showing which data points you
used, how you derived combined figures, and why you chose this headline.

Output JSON:
{
  "branch": "volume",
  "title": "Low & Invisible Lead Generation",
  "text": "Only ~3 leads/month...",
  "reasoning": [ "..." ]
}
```

## 4b — LLM quality control (batched per branch)

After each branch takeaway:

```
You are a senior reviewer (management-consulting standard). Here is the
branch takeaway (title + text + reasoning) and the full set of analysis
cards for this branch.

Tasks:
1. Defensibility: Does every number in the takeaway appear in an analysis card?
2. Synthesis: Does the takeaway reflect multiple sub-issues, not one KPI?
3. Headline: Is this the most consequential finding, or is a stronger one
   supported by the same cards? If alternative, name it.
4. Confidence: If any sub-issue was PARTIAL/GAP, is that reflected?
5. Tone: No unwarranted good/bad judgement; facts only.

Output JSON:
{
  "pass": true|false,
  "issues": [],
  "alternativeHeadline": null | "string",
  "recommendedEdits": null | "string"
}
```

**On failure (`pass: false`):** Tag the takeaway `needs_review`. Write details to `qc-failures.json`. Do not fail the run.

## 4c — Versioned artifacts for human QC (required)

Under `out/briefing-runs/{runId}/`:

- `stage-4-takeaways.json` — all branch takeaways + QC pass/fail results
- `stage-4-prompts.json` — resolved system/user prompts and model ID for 4a and 4b (so prompt changes are diffable across runs)

The product owner can QC Stage 4 output by comparing this file across run IDs without reading logs.

---

# STAGE 5: LENS ORGANISATION

## Input

- All analysis cards (Stage 3)
- Branch takeaways (Stage 4)
- Org decision context + per-user goals (Stage 0)

## What happens

**Lens 1 — Issue Tree (default navigation)**

Group cards by **branch → sub-issue** (the instantiated tree). Do not use raw CSV filename as a grouping mechanism.

**Lens 2 — Upcoming Decisions** — LLM:

```
Here are {N} analysis cards. Here are org and per-user
decisions (user_stated, rag_suggested, rag_suggested_supporting): {list}.
For each decision, select the 2–4 most relevant cards and one sentence on
why. Flag cards that support multiple decisions.
```

**Lens 3 — Risks** — LLM:

```
Here are {N} cards. Flag risk-style observations (concentration, staleness,
data quality, single points of failure, operational gaps). Cite card id and
data point.
```

## Output

- `lenses.issueTree`, `lenses.decisions`, `lenses.risks`

---

# STAGE 6: OUTPUT ASSEMBLY (PER ORG, NOT PER USER)

Single JSON file per org per run, not per user. Per-user tailoring is `userViews` only. No per-lens or per-branch split files.

## Input

- Stages 0–5

## Output

One org artifact per run, plus the versioned folder at `out/briefing-runs/{runId}/` (Stages 3c, 4c).

```
{
  "runId": "run-20260401-abc123",
  "generatedAt": "2026-04-01T10:00:00Z",
  "specRef": {
    "document": "decisions/Pipeline-Spec-Briefing-Cards-Takeaways.md",
    "version": "content hash or git commit"
  },
  "orgId": "locumate",
  "orgName": "Locumate",
  "contributors": [
    { "userId": "surge", "role": "CEO", "displayName": "Surge" },
    { "userId": "sam", "role": "Customer Success Manager", "displayName": "Sam" }
  ],

  "issueTree": {
    "rootIssue": "How does Locumate reach its next stage of growth?",
    "summaryStats": {
      "totalRevenueWon": "$914K",
      "openPipeline": "$1.4M",
      "activePipeline": "~$100K"
    },
    "formulaLabel": "Revenue = Leads × Conversion Rate × Win Rate × Avg Deal Size × Expansion − Churn",
    "branches": [
      {
        "branchId": "volume",
        "branchIndex": 1,
        "label": "Volume — Get More Customers",
        "owner": { "userId": "surge", "displayName": "Surge", "role": "CEO", "ownerSuggested": true },
        "subIssues": [
          { "subIssueId": "1.1", "name": "Demand Generation", "coverage": "partial" },
          { "subIssueId": "1.2", "name": "Demand Conversion", "coverage": "measured" },
          { "subIssueId": "1.3", "name": "Closing", "coverage": "measured" }
        ]
      }
    ]
  },

  "analysisCards": [
    {
      "cardId": "subissue-1.1",
      "subIssueId": "1.1",
      "subIssueName": "Demand Generation",
      "branchId": "volume",
      "branchLabel": "Volume — Get More Customers",
      "kpis": [
        {
          "name": "Leads per Month",
          "value": "~3 / month",
          "timePeriod": "most recent month (Oct 2025)",
          "status": "partial",
          "context": "52 leads total on record. 3 added in Oct 2025.",
          "reasoning": [
            "Source: Zoho CRM Leads export (52 rows)",
            "Counted rows by Created Time field. 3 entries in Oct 2025."
          ]
        }
      ],
      "observations": [
        "Only 52 leads on record; 3 added in most recent month",
        "Lead Source field is empty for all 52 leads — no idea what channel works"
      ],
      "tags": [
        { "type": "gap", "label": "Lead Source 0% populated" }
      ],
      "qualityNotes": [],
      "qcStatus": "pass"
    }
  ],

  "branchTakeaways": [
    {
      "branchId": "volume",
      "branchIndex": 1,
      "branchLabel": "Volume — Get More Customers",
      "owner": { "userId": "surge", "displayName": "Surge", "role": "CEO" },
      "title": "Low & Invisible Lead Generation",
      "text": "Only ~3 leads/month, and Lead Source is empty for all 52...",
      "reasoning": [
        "Counted 52 leads total, 3 added in most recent month = ~3/month rate.",
        "Checked Lead Source field: 0% populated across all 52 leads."
      ],
      "summaryCategory": "finding",
      "qcStatus": "pass"
    }
  ],

  "lenses": {
    "issueTree": { },
    "decisions": { },
    "risks": { }
  },
  "userViews": {
    "surge": {
      "relevantBranches": ["volume", "value", "capacity"],
      "defaultLens": "issueTree"
    },
    "sam": {
      "relevantBranches": ["retention", "value"],
      "defaultLens": "issueTree"
    }
  },
  "dataQuality": { }
}
```

**Field notes:**

- `issueTree.summaryStats` and `formulaLabel` — derived from analysis cards during Stage 6 assembly; used by the Issue Tree View.
- `analysisCards[].observations` — plain-language bullet summaries of KPIs; used by the Issue Tree View (always visible).
- `analysisCards[].tags` — derived from KPI status + quality notes (`measured` with notable value → `data`; `partial`/`gap` → `gap`; concentration/staleness/single-point-of-failure → `risk`). Used by Issue Tree View (hidden by default, togglable). Generated in code during Stage 6 assembly.
- `branchTakeaways[].summaryCategory` — `finding` (default), `risk`, or `opportunity`. If the branch appears in Lens 3 (Risks) output, gets `risk`; otherwise `finding`. Used by Issue Tree View summary bar.

`userViews` are **role-based defaults** only for now. Admin override is a future feature.

UI reads this JSON; `userViews` drives which branches and lenses a user sees by default.

Database later: `org_runs` + child tables for cards, lenses, takeaways.

---

# UI OUTPUT CONTRACT

Three screens consume the Stage 6 JSON. Each screen's data requirements are defined here so implementation can verify completeness.

## Screen 1 — Analysis View (`MVD-v2-Analysis.html`)

Renders one card per sub-issue. Navigation: branch tabs (4 branches, color-coded), up/down carousel within each branch.

**Per card, reads from `analysisCards[]`:**

| Field | Source |
|-------|--------|
| Root issue text | `issueTree.rootIssue` |
| Branch ID + label | `branchId`, `branchLabel` on the card (denormalised from issue tree) |
| Sub-issue ID + name | `subIssueId`, `subIssueName` |
| KPIs | `kpis[]` — each with `name`, `value`, `status`, `timePeriod`, `context`, `reasoning[]` |
| QC status | `qcStatus` (`pass` / `needs_review`) |

## Screen 2 — Issue Takeaway View (`MVD-v2-Issue-Takeaway.html`)

Renders one card per branch. Navigation: horizontal swipe across 4 branches, dot indicators.

**Per card, reads from `branchTakeaways[]`:**

| Field | Source |
|-------|--------|
| Branch ID + index + label | `branchId`, `branchIndex`, `branchLabel` |
| Owner | `owner.displayName`, `owner.role` |
| Takeaway | `title`, `text` |
| Reasoning | `reasoning[]` (collapsible) |
| QC status | `qcStatus` |
| Deep link | Links to Analysis View filtered by `branchId` |

## Screen 3 — Issue Tree View (`Issue-Tree-Revenue-Locumate.html`)

Renders the full tree on a single desktop page. Branches expand to show sub-issue cards.

**Top-level, reads from `issueTree`:**

| Field | Source |
|-------|--------|
| Root node | `issueTree.rootIssue` + `issueTree.summaryStats` |
| Formula bar | `issueTree.formulaLabel` |
| Branches | `issueTree.branches[]` — each with `branchId`, `branchIndex`, `label` |
| Sub-issues per branch | `branches[].subIssues[]` — `subIssueId`, `name`, `coverage` |

**Per sub-issue card, reads from `analysisCards[]`:**

| Field | Source |
|-------|--------|
| Observations | `observations[]` — always visible bullet points |
| Tags | `tags[]` — `type` (`data` / `gap` / `risk`) + `label`. Hidden by default; togglable overlay. |

**Summary bar at bottom, reads from `branchTakeaways[]`:**

| Field | Source |
|-------|--------|
| Takeaway title + text | `title`, `text` |
| Category | `summaryCategory` (`finding` / `risk` / `opportunity`) — determines visual style |

---

# LLM CALLS SUMMARY (ILLUSTRATIVE)

| Stage | Calls (typical) | What it does |
|-------|-----------------|--------------|
| 0 | 1 per user (extract) + 1 per user (decision augmentation) | Profiles; 90-day decisions |
| 1 | 0 | Code: parse, schema, stats, excerpts, validation |
| 2 | ~1 per data file | Column → sub-issue mapping |
| 3 | 1 per sub-issue + **1 QC per branch** | Analysis + LLM audit |
| 4 | 1 per branch + **1 QC per branch** | Takeaway + review |
| 5 | 2 | Decisions, risks |

Code-verified count checks (Stage 3d Layer 1) are not LLM calls — they run in code before the LLM QC.

Totals scale with sub-issues and branches. QC is batched per branch to manage cost.

---

# QC FAILURE HANDLING

All QC failures across the run are collected in `out/briefing-runs/{runId}/qc-failures.json`:

```
{
  "runId": "...",
  "generatedAt": "...",
  "failures": [
    {
      "stage": "3d",
      "layer": "code",
      "branch": "volume",
      "cardId": "subissue-1.1",
      "pass": false,
      "issues": ["Leads count claimed 54 but code verified 52 rows in source"],
      "suggestedFixes": ["Recount from Zoho CRM Leads export"],
      "originalContent": { }
    },
    {
      "stage": "3d",
      "layer": "llm",
      "branch": "retention",
      "cardId": "subissue-3.2",
      "pass": false,
      "issues": ["Card compares Shifts (Sep 2025) to Deals (all-time) without flagging time mismatch"],
      "suggestedFixes": ["Add time-period caveat to context field"],
      "originalContent": { }
    },
    {
      "stage": "4b",
      "layer": "llm",
      "branch": "retention",
      "type": "takeaway",
      "pass": false,
      "issues": ["Takeaway only references 1 sub-issue (customer health); not a synthesis"],
      "alternativeHeadline": "Biggest Blind Spot",
      "recommendedEdits": "Include data gap count and revenue concentration",
      "originalContent": { }
    }
  ]
}
```

Cards and takeaways that fail QC are tagged `needs_review` in the main output. They still appear in the UI (visually flagged) and in the JSON. The product owner reviews `qc-failures.json` to understand what went wrong and whether to adjust the spec, prompts, or data.

---

# WHAT THIS REPLACES

The current pipeline (`run-pipeline-v2.ts`) does part of Stage 1 and formula-based KPI analysis, not org-wide briefing cards or branch takeaways with QC.

The MVD v2 screens were hand-built from the same logical content.

This spec: org-first onboarding, mandatory schema + stats + data excerpts, Option A tree, RAG with freshness discipline, code-verified counts + batched LLM QC, time-period requirements on all numbers, Issue Tree as Lens 1, single per-org JSON output with role-based `userViews`, full-replace per run, no deltas, no retention policy. Cross-source analysis is deferred (see Decision #8).

---

# QC UI (v2 signal cards) — cross-reference from `decisions/Card-Instructions-31Mar`

These apply to the existing KPI-card QC UI, not necessarily the briefing JSON. Keep in sync when the same screen shows both:

- Header one-liner should summarise header metrics only, not pull from analysis/synthesis blocks.
- "Why it matters" / why-recommended copy — shorten or remove if it causes trust issues.
- LLM analysis quality in v2 stubs was problematic; this pipeline aims for artifact + QC path instead.
