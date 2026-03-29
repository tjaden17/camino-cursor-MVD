# Camino — Signal Intelligence Roadmap (with RAG)

**Date:** 29 March 2026
**Status:** Draft — replaces Expert-uplift-29Mar.md
**Context:** Locumate (Surge + Sam) as first customer

---

## The mental model

Camino exists because leaders need to make decisions — and the quality and speed of those decisions depends on the quality and speed of the information they receive.

1. **Destination** — The user has a business goal, a KPI target, a hurdle to overcome.
2. **Decisions** — Along the way, there are forks in the road. Each decision moves the user closer to or further from their goal.
3. **Information** — To decide well, the user needs the right information, fast. Faster + better quality information → faster + better quality decisions.
4. **Data-based confidence** — Camino helps the user be data-based when making decisions. Not gut-feel vs. data — both, reinforced.

The product has two main outputs:
- **Signal Cards** — Per-KPI intelligence cards showing what's happening, why, and what it means.
- **Weekly Brief** — A Monday morning exec summary that connects signals to decisions.

Both outputs serve the same purpose: **get the user to a better decision, faster.**

---

## Why RAG

The signal card analysis and synthesis depend on the LLM having the right context. Without RAG, we hand-assemble each LLM prompt — manually deciding what context to include for each card. This has three problems:

1. **Domain knowledge gap** — The LLM doesn't know what "good" looks like for pharmacy workforce metrics, or what typical SaaS support benchmarks are. It guesses from training data, which means benchmark claims and "so what" conclusions may be generic or hallucinated.

2. **Personalisation ceiling** — The user's full context (interview notes, onboarding details, business docs) is richer than what fits in a single prompt. Without retrieval, we include the same onboarding JSON in every card — missing the specific context that matters for *this* KPI.

3. **Scalability** — Hand-assembling prompts works for 5 cards. It doesn't work for 20 cards across multiple users, each needing different domain context, benchmarks, and analysis patterns.

RAG addresses all three by dynamically retrieving the most relevant context from knowledge bases at analysis time.

---

## Data flow — how it all connects

For a visual diagram, see `docs/roadmaps-draft/Expert+RAG-data-flow-29Mar.md`.

### The big picture (30-second version)

Raw data files (CRM exports, shift logs, support tickets) + user context (onboarding profiles, interview notes) + curated knowledge (benchmarks, domain guides, analysis patterns) flow through a pipeline that:

1. **Indexes** knowledge into a local vector store (one-time, refreshed when content changes)
2. **Generates** a candidate KPI list from available data + user context
3. **Waits** for a human to review and lock the list
4. **Computes** real values and dimensional breakdowns deterministically from CSVs
5. **Retrieves** the most relevant context from knowledge bases for each card
6. **Generates** analysis and synthesis via one LLM call per card, grounded in retrieved context
7. **Outputs** signal cards (sufficient + insufficient) for the UI and weekly brief

### Step-by-step data flow

```
INPUT LAYER
├── Data files (CSVs, XLSX)
│   ├── Zoho CRM Leads ─────────────────────────────────────┐
│   ├── Zoho CRM Deals ─────────────────────────────────────┤
│   ├── Zoho Desk (Tickets, Accounts, Agents) ──────────────┤
│   ├── Shifts Data ─────────────────────────────────────────┤
│   └── Zoho Users ─────────────────────────────────────────┤
│                                                            │
├── Onboarding profiles                                      │
│   ├── surge-onboarding-derived.json ──┐                    │
│   └── sam-onboarding-derived.json ────┤                    │
│                                       │                    │
├── Knowledge files (knowledge/)        │                    │
│   ├── KB1: Company context docs ──────┤                    │
│   ├── KB2: Benchmarks + domain ───────┤                    │
│   └── KB3: Analysis patterns ─────────┤                    │
│                                       │                    │
│                                       ▼                    │
│                              ┌─────────────────┐           │
│                              │  INDEXER         │           │
│                              │  Chunk → Embed   │           │
│                              │  → ChromaDB      │           │
│                              └────────┬────────┘           │
│                                       │                    │
│                                       ▼                    │
│                              ┌─────────────────┐           │
│                              │  VECTOR STORE    │           │
│                              │  (ChromaDB,      │           │
│                              │   local)         │           │
│                              └────────┬────────┘           │
│                                       │                    │
PIPELINE                                │                    │
│                                       │                    │
│  Step 1a: GENERATE CANDIDATES ◄───────┤────────────────────┤
│  Scan data sources + retrieve         │                    │
│  user context from KB1                │                    │
│  → candidate KPI list                 │                    │
│           │                           │                    │
│           ▼                           │                    │
│  Step 1b: HUMAN CHECKPOINT            │                    │
│  Review, approve, reject,             │                    │
│  reprioritise KPIs                    │                    │
│  → locked KPI list                    │                    │
│           │                           │                    │
│           ▼                           │                    │
│  Step 1c: DATA QUALITY CHECK ◄────────┼────────────────────┤
│  Per file: missing cols, nulls,       │         (reads data files)
│  date gaps, dupes, outliers           │                    │
│  → pass / warn / fail per file        │                    │
│  → quality notes attached to cards    │                    │
│           │                           │                    │
│           ▼                           │                    │
│  Step 2: COMPUTE VALUES ◄─────────────┼────────────────────┘
│  Deterministic formulas on CSVs       │         (reads data files)
│  → value + trend + provenance         │
│  + data freshness timestamp           │
│           │                           │
│           ▼                           │
│  Step 3: COMPUTE BREAKDOWNS ◄─────────┼────────────────────┐
│  Dimensional analysis on CSVs         │         (reads data files)
│  → evidence package per KPI           │
│           │                           │
│           ▼                           │
│  Step 4: RAG-ENHANCED LLM CALL        │
│  Per card:                            │
│  ├── Deterministic: value + trend     │
│  │   + breakdowns (from Steps 2-3)    │
│  ├── RETRIEVE from KB1 ◄─────────────┤ (user context for this KPI)
│  ├── RETRIEVE from KB2 ◄─────────────┤ (benchmarks for this KPI type)
│  ├── RETRIEVE from KB3 ◄─────────────┘ (analysis pattern for this KPI)
│  └── → LLM CALL (Claude)
│       → Analysis (conclusion + chain of thought)
│       → Synthesis (conclusion + chain of thought)
│           │
│           ▼
│  Step 5: INSUFFICIENT CARDS
│  For KPIs with no data:
│  ├── RETRIEVE from KB2 (why this metric matters)
│  ├── RETRIEVE from KB1 (which decision it informs)
│  └── → Templated card content
│           │
│           ▼
OUTPUT LAYER
├── Signal Cards (sufficient) ──────────────────────► UI / Preview
│   Each: value, trend, data freshness,
│   provenance summary, quality notes,
│   analysis w/ CoT, synthesis w/ CoT,
│   cross-signal reference
│
├── Signal Cards (insufficient) ────────────────────► UI / Preview
│   Each: what's missing, how to provide,
│   what it unlocks, which decision it helps
│
├── Data Quality Report ───────────────────────────► Operator
│   Per file: pass/warn/fail + issue details
│
├── Provenance log ─────────────────────────────────► QA / Audit
│   Per card: formula, source rows,
│   retrieved chunks, retrieval sources
│
└── Weekly Brief (Phase 5) ─────────────────────────► Email
    Headline + scorecard + focus signal
    + decision pulse
```

### What's deterministic vs. what's AI-generated

| Step | Type | What it does | Can it hallucinate? |
|---|---|---|---|
| Step 1a (Candidate list) | Deterministic + AI-assisted | Scans data sources, suggests KPIs | Low risk — output is reviewed by human |
| Step 1b (Human checkpoint) | Human | Reviews and locks list | No — human decision |
| Step 1c (Data quality check) | Deterministic | Checks files for missing cols, nulls, dupes, date gaps, outliers | No — rule-based checks on raw files |
| Step 2 (Compute values) | Deterministic | Formulas on CSVs + freshness timestamp | No — math on real data |
| Step 3 (Breakdowns) | Deterministic | Grouping/aggregation on CSVs | No — math on real data |
| Step 4 (Analysis + synthesis) | AI-generated with RAG | LLM writes narrative | **Managed risk** — grounded in retrieved context, chain of thought makes claims auditable |
| Step 5 (Insufficient cards) | Template + AI-assisted | Describes what's missing | Low risk — mostly templated |

### Key principle: the LLM narrates, it doesn't discover

The LLM never touches raw data directly. Every number it references was computed in Steps 2-3. Every benchmark it cites was retrieved from KB2. Every user context it references was retrieved from KB1. The LLM's job is to **narrate and synthesise** information it's been given — not to discover new information from raw data.

This separation is what makes the output auditable. If a card says "tickets are up 14%", you can trace that to Step 2. If it says "typical agent capacity is 20-35/week", you can trace that to a chunk in KB2. If it says "you're considering hiring", you can trace that to a chunk in KB1.

---

## Current state: what data do we have?

### Connected data sources

| Source | File | Key columns |
|---|---|---|
| Zoho CRM Leads | `data/zoho/Zoho - CRM - Leads.csv` | Lead ID, Created Time, Is Converted, Lead Status |
| Zoho CRM Deals | `data/zoho/Zoho - CRM - Deals.csv` | Deal ID, Stage, Amount, Created Time, Closing Date, Sales Cycle Duration |
| Shifts Data | `data/custom/Shifts Data - Shifts (Non protected).csv` | Shift Date, Status, Pharmacy Name, Group, Hours Worked, Hours Expected, Locum Name, Rate |
| Zoho Desk | `data/zoho/Zoho - Desk - XLS.xlsx` | 3 sheets: **Tickets-Desk** (4,645 rows), **Accounts-Desk** (3,135 customer accounts), **Agents-Desk** (agent roster). Ticket columns include: Status, Created Time, Priority, Channel, Category, Sub Category, Classifications, Resolution Time in Business Hours, First Response Time in Business Hours, Is First Call Resolution, Number of Reopen, Happiness Rating, SLA Violation Type, Sentiment |
| Zoho Users | `data/zoho/Zoho-Users.csv` | 14 team members with Role (CEO, COO, CS, Marketing, Product, Sales), Status (active/disabled) |

### What users asked for vs. what we can compute

**Surge (CEO) — ~5 sufficient, ~5 insufficient:**

| Signal | Type | Computable? | What's missing? |
|---|---|---|---|
| prospects | Requested | Yes — Zoho Leads | — |
| win_rate | Requested | Yes — Zoho Deals | — |
| calls_per_week | Requested | No | Zoho CRM Activities export |
| support_issue_volume | Requested | Yes — Zoho Desk | — |
| churn_leading_indicator | Requested | Partial (2/3 sources) | Product telemetry |
| bug_impact | Requested | No | Bug tracker export |
| agency_usage_risk | Recommended | Borderline — Shifts Data | Needs "agency" flag definition |
| pipeline_value | Recommended | Yes — Zoho Deals | — |
| onboarding_quality | Recommended | No | Admin CP export |
| feature_adoption_trend | Recommended | No | Product telemetry |

Additional Desk-derived KPIs available: resolution_time, first_response_time, sla_compliance, fcr_rate, ticket_reopen_rate, csat, sentiment_trend.

**Sam (CSM) — ~6 sufficient, ~4 insufficient:**

| Signal | Type | Computable? | What's missing? |
|---|---|---|---|
| shifts | Requested | Yes — Shifts Data | — |
| jobs_posted | Requested | Yes — Shifts Data | — |
| shift_utilisation | Requested | Yes — Shifts Data | — |
| job_seekers | Requested | Borderline | Admin CP locum signup data |
| signups | Requested | No | Admin CP signup report |
| adoption_by_segment | Requested | Partial | Needs segment definition + signup data |
| inactive_pharmacy_rate | Recommended | Yes — Shifts Data | — |
| unsubscribed_pharmacy_rate | Recommended | No | Admin CP subscription status |
| prospect_opportunity_size | Recommended | Yes — Zoho Deals | — |
| avg_deal_size | Recommended | Yes — Zoho Deals | — |

### What decisions are users facing?

**Surge:** Prioritize product roadmap (90 days), hiring vs outsourcing (90 days), market expansion (6 months)
**Sam:** Account health actions (ongoing), renewal & upsell strategy (before renewals), meeting preparation (before each meeting)

---

## Phase 0 — Data Contract + Decision Catalogue + RAG Foundation

**Goal:** Three deliverables that everything else depends on:
1. The KPI Data Contract (what can we compute, from what data)
2. The Decision Catalogue (what decisions users face, which signals inform them)
3. The RAG knowledge bases (indexed and ready for retrieval)

### Part A: KPI Data Contract

(Same structure as before — see Layer 1: Data Source Registry, Layer 2: KPI Definitions, Layer 3: User-KPI Mapping, Unlock Table in the previous roadmap version for full tables.)

Key outputs:
- Data Source Registry with 5 connected + 4 expected/wishlist sources
- 24 KPI definitions with formulas, source dependencies, and sufficiency thresholds
- Per-user deck mapping showing sufficient/insufficient status
- Unlock table prioritising which data sources to request from Locumate

### Part B: Decision Catalogue

(Same structure as before — starter catalogue of role-based decisions, onboarding questions, signal-pattern-to-decision triggers.)

Key outputs:
- Starter catalogue: ~14 role-decision entries linked to signals
- 4 new onboarding questions to capture active decisions
- 5-10 signal-pattern-to-decision pairs for Locumate

### Part C: RAG Knowledge Bases

Three knowledge bases, built in priority order. All stored as local files, indexed into a local vector store.

#### Infrastructure

| Component | Choice | Why |
|---|---|---|
| Vector store | **ChromaDB** (runs in-process, no server) | Simplest local option. Stores embeddings in a local directory. Python API. No cloud dependency. |
| Embeddings | **Local model via Ollama** (e.g. `nomic-embed-text`) or **Anthropic/OpenAI embeddings API** | Local = no cost, works offline. API = better quality, small cost per call. Either works. |
| Document format | Markdown files in a `knowledge/` folder in the repo | Easy to read, edit, version with git. Each file is a "document" that gets chunked and indexed. |
| Chunking | Split by heading (H2/H3) or paragraph. ~200-500 tokens per chunk. | Small enough for relevant retrieval, large enough for useful context. |

The knowledge bases live in the repo as plain files. At pipeline startup, the indexer reads all files from `knowledge/`, chunks them, embeds them, and stores them in ChromaDB. Re-indexing happens when files change.

#### KB1: Company + User Context (priority: 2nd)

**What goes in:**

| Document | Source | What it provides |
|---|---|---|
| Surge's onboarding profile | `data/onboarding/surge-onboarding-derived.json` | Goals, pain points, metrics he cares about, trust requirements |
| Sam's onboarding profile | `data/onboarding/sam-onboarding-derived.json` | Goals, pain points, metrics she cares about |
| Surge's strategy mirror | `data/onboarding/surge-strategy-mirror.json` | His slice of the strategy catalogue |
| Sam's strategy mirror | `data/onboarding/sam-strategy-mirror.json` | Her slice of the strategy catalogue |
| Company context | Derived from onboarding + interview notes | Locumate's industry, stage, team size, business model, competitive context |
| Glossary | From onboarding profiles | Domain-specific terms: "shift", "locum", "agency usage", "groups" |
| Interview notes | Original interview/research docs | Rich qualitative context that didn't make it into the structured profile |
| Weekly reviews | `docs/reviews/` | What the product owner observed, priorities, context about data quality |

**What retrieval provides per card:**
When writing the Support Issue Volume card for Surge, retrieval finds: "Surge flagged customer support issues as a key metric", "he's considering hiring vs outsourcing for support", "Locumate has 14 people, 3 in Customer Service." These specific snippets are more useful than dumping the whole onboarding JSON.

#### KB2: Domain Knowledge + Benchmarks (priority: 1st — build this first)

**What goes in:**

| Document | Content | Why it matters |
|---|---|---|
| SaaS support benchmarks | Typical resolution times, SLA targets, FCR rates, ticket volumes by company size/stage | Grounds "so what" claims: "6.2hrs resolution is within healthy range for a seed-stage company" |
| SaaS sales benchmarks | Typical win rates, deal velocities, pipeline coverage ratios by stage | Grounds claims like "38% win rate is healthy for seed-stage B2B SaaS" |
| Pharmacy workforce context | Industry specifics: shift patterns, locum market dynamics, pharmacy group structures, typical utilisation rates | The LLM doesn't know this domain — retrieval fills the gap |
| Customer success benchmarks | Typical churn rates, NPS ranges, health score frameworks | Grounds Sam's card synthesis |
| Metric interpretation guides | "What does a rising ticket volume mean?", "What does declining shift utilisation signal?" — analytical frameworks per KPI type | Helps the LLM reason about patterns, not just describe numbers |
| Benchmark sources + citations | For every benchmark: the source, year, methodology, caveats | Every benchmark claim on a card must have a traceable citation |

**How to source this content:**
- Public benchmark reports: OpenView SaaS Benchmarks, Bessemer Cloud Index, ChartMogul SaaS reports, Zendesk Customer Experience Trends
- Industry sources: Pharmacy Guild of Australia workforce data, healthcare staffing reports
- Curate into markdown files with clear source attribution
- This is a one-time research effort (a few hours) that benefits every card and every future customer

**What retrieval provides per card:**
When writing the synthesis for Win Rate, retrieval finds: "Typical win rate for seed-stage B2B SaaS: 25-40% (source: OpenView 2025). Above 40% suggests strong product-market fit in current segment." The LLM can now make a grounded comparison instead of guessing.

#### KB3: Metric Definitions + Analysis Patterns (priority: 3rd)

**What goes in:**

| Document | Content | Why it matters |
|---|---|---|
| Metric specs | From `docs/data-specs/metric-specs-v1` — formulas, edge cases, validation rules | Ensures the LLM understands exactly how each number was computed |
| Chain-of-thought templates | Example analyses per KPI type — "when analyzing support volume, always check: channel breakdown, category breakdown, resolution time trend, SLA compliance" | Ensures consistent, thorough analysis structure |
| Signal card requirements | What each section should contain, quality bars, what to avoid | Keeps output on-spec |
| Good vs bad examples | Examples of strong analyses vs. weak/generic ones | Calibrates quality |
| Anti-hallucination rules | "Never claim a benchmark without a source", "Never reference data not provided in the prompt", "If you can't explain why, say so" | Reduces hallucination risk |

**What retrieval provides per card:**
When writing any support-related card, retrieval finds the chain-of-thought template: "Check channel breakdown, category breakdown, resolution time, SLA compliance, then synthesise." This ensures consistent analytical depth across all cards.

---

## Phase 1 — Signal cards with RAG-enhanced analysis

**Goal:** A small number of signal cards per user with real numbers, real provenance, and RAG-enhanced analysis — including the "aha" moment. The analysis is grounded in domain knowledge and benchmarks, not just the LLM's training data.

### Step 1a — Generate candidate KPI list

The system scans connected data sources + the user's onboarding profile (retrieved from KB1) and generates a list of all computable KPIs.

Each candidate shows:
- KPI name and 1-sentence description
- Computable today? (sufficient / insufficient / borderline)
- Suggested type (requested / recommended)
- Which data source feeds it

**Full candidate pool:** (24 KPIs — see previous roadmap version for complete table, unchanged.)

### Step 1b — Human curates and locks the list

You review the candidate list and approve, reject, or reprioritise. The AI does not decide unilaterally.

**Suggested starting deck for Surge (CEO):**

| KPI | Type | Status | Why this one |
|---|---|---|---|
| win_rate | Requested | Sufficient | He asked for it, Deals data supports it |
| support_issue_volume | Requested | Sufficient | He asked for it, Desk data is richest source |
| prospects | Requested | Sufficient | He asked for it, Leads data supports it |
| pipeline_value | Recommended | Sufficient | Directly relevant to market expansion thinking |
| calls_per_week | Requested | Insufficient | He asked for it — good insufficient card example |

**Suggested starting deck for Sam (CSM):**

| KPI | Type | Status | Why this one |
|---|---|---|---|
| shifts | Requested | Sufficient | She asked for it, Shifts data supports it |
| shift_utilisation | Requested | Sufficient | She asked for it, Shifts data supports it |
| inactive_pharmacy_rate | Recommended | Sufficient | Directly relevant to her retention work |
| jobs_posted | Requested | Sufficient | She asked for it, Shifts data supports it |
| signups | Requested | Insufficient | She asked for it — good insufficient card example |

### Step 1c — Input data quality / hygiene check (deterministic, no RAG)

Before any computation, run a quality check on every input data file. This catches problems at the front door — before bad data flows into KPIs and cards.

**Checks per file:**

| Check | What it looks for | Example |
|---|---|---|
| Missing columns | Expected columns absent from the file | Deals CSV missing `Amount` column |
| Empty / null rate | % of rows where key fields are blank | 40% of tickets have no `Category` |
| Date range sanity | Oldest and newest record dates; gaps longer than expected | Shifts data stops at Feb 2026 — stale export? |
| Duplicate detection | Rows with identical IDs or identical key-field combinations | 12 duplicate ticket IDs in Desk export |
| Value range outliers | Numeric fields outside plausible range | Deal amount of $0 or $99,999,999 |
| Format consistency | Dates in expected format, no mixed formats | `Created Time` has both DD/MM/YYYY and MM/DD/YYYY |

**Outputs:**
- **Pass / warn / fail** status per file. A "fail" blocks that file from entering computation (the operator is notified and can fix or override). A "warn" lets data through but flags the issue on any card that uses it.
- **Data quality summary** — a short report listing issues found, available to the operator and referenced in provenance if relevant (e.g. "Note: 12% of tickets had no Category assigned — category breakdown may undercount").
- **Card-level quality note** — if a card uses data from a file with warnings, the card shows a brief note so the user knows (e.g. "Some source records had missing fields — see quality report for details").

This step is lightweight and deterministic — it runs in seconds and prevents the most common data problems from silently poisoning the output.

### Step 2 — Compute real values per KPI (deterministic, no RAG)

For each approved sufficient KPI, run the actual formula against the actual data file.

Each KPI produces:
- Current period value + previous period value
- Trend (up/down/flat + delta)
- Provenance (which file, which rows, which formula)
- **Data freshness timestamp** — the most recent record date found in the source data for this KPI (e.g. "Data as of 27 Mar 2026"). Displayed on the card so the user always knows how current the numbers are.

**Pipeline run cadence:**
- **MVD / demo:** On-demand — the operator triggers the pipeline manually before a review or demo.
- **Future:** Automatic daily or weekly runs, with a scheduled cadence per customer. The freshness timestamp on each card always reflects when the underlying data was last processed, regardless of cadence.

### Step 3 — Compute dimensional breakdowns per KPI (deterministic, no RAG)

For each sufficient KPI, compute 2-3 breakdowns:

| KPI | Breakdowns | Source columns |
|---|---|---|
| support_issue_volume | By Channel, by Category/Classifications, by Priority | Desk |
| win_rate | By deal size tier, by sales cycle length | Deals |
| prospects | By month, by converted vs not | Leads |
| pipeline_value | By stage, by deal owner | Deals |
| shifts | By pharmacy group, by state | Shifts |
| shift_utilisation | By pharmacy group, by month | Shifts |
| inactive_pharmacy_rate | Inactive pharmacy list, by group | Shifts |
| jobs_posted | By month, by pharmacy group | Shifts |

### Step 4 — RAG-enhanced LLM call per card

This is where RAG makes the difference. Each card gets a single LLM call with a prompt assembled from:

**Deterministic inputs (from Steps 2-3):**
- KPI value + trend + provenance
- Dimensional breakdowns

**Retrieved inputs (from RAG):**
- From **KB1** (Company Context): The 3-5 most relevant snippets about this user's goals, pain points, and stated priorities — specific to *this KPI*, not the full profile
- From **KB2** (Domain Knowledge + Benchmarks): Relevant benchmarks for this KPI type + industry context + what "good" looks like. Including source citations.
- From **KB3** (Analysis Patterns): The chain-of-thought template for this KPI type — which breakdowns to check, in what order, what patterns to look for

**The LLM is instructed to produce two sections, each with conclusion + chain of thought:**

#### Analysis section structure

**Conclusion** (2-3 sentences): What's happening with this number and what's driving it.

**Chain of thought** (bullet-point walkthrough): The data steps that led to the conclusion — breakdown by breakdown, showing which dimensions moved and which didn't.

#### Synthesis / "So What" section structure

**Conclusion** (2-3 sentences): Why this matters, what to watch, what it implies.

**Chain of thought** (bullet-point walkthrough): How the conclusion connects to the user's context, relevant benchmarks (with citations), and what the trajectory suggests.

#### Example — Support Issue Volume (Surge), RAG-enhanced

> **Analysis**
>
> Ticket volume reached 84 this week, up 14% from 72 last week. This is the third consecutive weekly increase, driven primarily by Phone-channel Invoice Queries.
>
> **How we got here:**
> - Broke down by channel: Phone tickets up 30% (34 → 44), Email flat (38 → 40). Phone is the primary driver.
> - Broke down by category: Invoice Queries are the largest category (28 tickets, up 47% from 19). Shift Issues and App Bugs are stable.
> - Checked resolution time: 6.2 hours average, unchanged. The team is absorbing the extra volume.
> - Checked SLA compliance: 85% not violated, stable.
>
> **Conclusion:** Volume increase is concentrated in Phone-channel Invoice Queries. The rest of the support landscape is stable.

> **So What**
>
> At 84 tickets/week with 3 CS staff, your team is handling ~28 tickets per person per week. This is within the typical range for early-stage SaaS (20-35 per agent/week, per Zendesk 2025 benchmarks), but at the upper end. If volume crosses 100/week, you'll be above the benchmark threshold.
>
> **How we got here:**
> - Compared volume to team capacity: 84 tickets / 3 CS staff = 28 per agent. [Retrieved: Zendesk 2025 CX Trends — typical agent capacity is 20-35 tickets/week for SaaS companies.]
> - Projected trajectory: 3 weeks of +14% growth → projected to cross 100/week by mid-April, which would push per-agent load above 33.
> - Checked resolution time as leading indicator: flat at 6.2hrs. [Retrieved: resolution time typically lags volume by 2-3 weeks — stability now doesn't guarantee stability next month.]
> - Matched to user context: [Retrieved: Surge flagged "customer support issues" as a key metric and is considering "internal hiring vs external development".]
>
> **Conclusion:** No action this week. Watch resolution time — if it rises above 7hrs or volume crosses 100/week, the case for expanding the support team strengthens.

**Cross-signal reference (simple, from Phase 1):**

Each card includes a short "Related signals" line that names 1-2 other signals the user should look at alongside this one. These are derived from the causal graph — no extra LLM call needed, just a lookup.

> **Related signals:** Resolution Time (stable at 6.2hrs) · SLA Compliance (85% met)

This gives the user a breadcrumb to start connecting the dots between cards, without waiting for the full cross-signal narrative in Phase 4. It's lightweight — just signal name + current value — and it costs nothing to produce because the values already exist from Step 2.

**The difference RAG makes:**
- The benchmark ("20-35 tickets per agent per week, Zendesk 2025") comes from KB2, not the LLM's memory — it's citable and verifiable
- The user context ("Surge is considering hiring vs outsourcing") comes from KB1, specifically retrieved for this card
- The analytical pattern ("check resolution time as a lagging indicator") comes from KB3
- Every retrieved piece of context is tagged with its source, making the card fully auditable

### Step 5 — Insufficient cards

For each insufficient KPI, produce a card with:
- KPI name and what it would tell the user (enriched by KB2 retrieval — domain context about why this metric matters)
- What data is missing and how to provide it
- What it would unlock
- Which of the user's decisions it informs (enriched by KB1 retrieval — the user's stated decisions)

### End state for Phase 1

**Per user: 4 sufficient cards + 1 insufficient card.**

Each sufficient card has:
- Real KPI value from real data + provenance
- Real trend (this period vs. last period)
- **Data freshness** — "Data as of [date]" shown on the card so the user knows how current the numbers are
- **User-facing provenance summary** — a short, plain-language line on the card showing where the number came from (e.g. "Calculated from 4,645 Zoho Desk tickets, Jan–Mar 2026, using formula: COUNT(*)"). The user can verify the number without opening a QA log. For benchmarks, the source is cited inline (e.g. "Zendesk CX Trends 2025").
- RAG-enhanced analysis with chain of thought — grounded in domain knowledge, not generic
- RAG-enhanced synthesis with chain of thought — benchmarks with citations, personalised to user context
- **Cross-signal reference** — 1-2 related signals with their current value, giving the user a breadcrumb to connect the dots
- Every claim traceable to either computed data or a retrieved source

---

## Phase 2 — Insufficient cards that drive action

**Goal:** Every insufficient KPI gets a card that tells the user what's missing, how to fix it, and which decision it helps — enriched by RAG.

**RAG enhancement:**
- KB2 retrieval provides domain context for *why* each missing metric matters ("Ticket volume monitoring is considered a leading indicator of customer health in SaaS — companies that track it report 23% lower churn, per Gainsight 2025 CS Benchmarks")
- KB1 retrieval connects the gap to the user's specific decision ("This directly informs your hiring vs outsourcing decision")

**Example — Surge's "Calls Per Week" insufficient card:**

> **Calls Per Week** — Data needed
>
> This signal would track your team's weekly outbound call volume and flag when activity drops below the level needed to sustain your pipeline. [Retrieved: For seed-stage B2B SaaS, call activity is typically the highest-leverage leading indicator of pipeline health — Bessemer Cloud Index 2025.]
>
> **Relevant to:** Your market expansion decision — call activity data would show whether your team has capacity to pursue new segments while maintaining current pipeline.
>
> **What's missing:** Zoho CRM Activities export
> **What we need:** CSV with columns: Activity Type, Date, Status, Contact/Lead ID
> **How to export:** Zoho CRM > Activities > All Activities > Export to CSV
> **What it unlocks:** This signal + contributes to Lead Activity Score

---

## Phase 3 — Recommended signals + recommended decisions

**Goal:** Proactively surface KPIs and decisions the user should be thinking about, grounded in their data patterns and enriched by RAG.

### Recommended KPIs

Same approach as before — causal graph + signal-to-decision links. RAG enhancement:

- KB2 retrieval makes the "why it's recommended" explanation credible: "SLA compliance is tracked by 89% of SaaS companies with >50 tickets/week (source: Zendesk 2025). At your current volume, this is a metric worth watching."
- KB1 retrieval personalises the recommendation: "This is relevant to your hiring decision because..."

### Recommended decisions

Signal patterns trigger decision recommendations. RAG enhancement:

- KB2 retrieval provides the analytical framework: "Rising ticket volume with stable resolution time is a well-documented pattern — resolution typically lags volume by 2-3 weeks (source: Support Driven benchmarks)"
- KB1 retrieval ensures the recommendation connects to what the user already cares about

### Causal graph

```
shifts_completed ← shift_utilisation → inactive_pharmacy_rate → churn_risk
prospects → pipeline_value → win_rate → avg_deal_size
calls_per_week → lead_activity_score → lead_conversion
support_issue_volume → resolution_time → sla_compliance → churn_risk
ticket_reopen_rate → resolution_time → csat
sentiment_trend → churn_risk
first_response_time → csat → churn_risk
```

---

## Phase 4 — Enhanced analysis: decision framing, benchmarks, causal chains

**Goal:** Upgrade signal cards with decision-level framing and cross-signal causal chain narratives.

By this phase, RAG is already providing benchmarks and domain context (from Phase 1). Phase 4 adds:

### 4a — Decision-framed synthesis

Each card's synthesis explicitly references the user's active decisions. KB1 retrieval ensures the right decision is connected to the right signal.

### 4b — Benchmark comparisons (richer)

KB2 has been growing since Phase 0 — more benchmarks, more sources, more nuance. Cards now include multi-dimensional comparisons: "Your win rate is healthy for seed-stage SaaS (25-40%, OpenView 2025), but below average for healthcare B2B specifically (42%, Bain Healthcare 2025). This may reflect longer sales cycles typical in the pharmacy sector."

### 4c — Causal chain narratives

Cross-signal analysis using the causal graph + RAG:
- KB2 retrieval provides domain knowledge about which causal links are well-established vs. speculative
- KB3 retrieval provides the analytical framework for narrating multi-signal chains
- Actual computed values for each node in the chain prove each link

---

## Phase 5 — Weekly Brief

**Goal:** Monday morning email connecting signals to decisions.

**Sections:**

| Section | What it needs | RAG enhancement |
|---|---|---|
| Headline | Cross-signal synthesis | KB1: user's priorities. KB2: what's most important for their stage. |
| Scorecard | KPI + Value + Trend | None needed — deterministic |
| Focus Signal | Highest-urgency signal as paragraph | Full RAG-enhanced analysis from Phase 1 |
| Decision Pulse | What signals say about each active decision | KB1: user's decisions. KB2: decision frameworks. |
| Open Item | Manually flagged | None — operator layer |

**Three versions:**
- v1 (after Phase 1): Scorecard + headline + focus signal with RAG-enhanced analysis
- v2 (after Phase 3): Adds Decision Pulse section
- v3 (after Phase 4): Full brief with causal chains and richer benchmarks

---

## Phase 6 — Data expansion (ongoing)

**Goal:** New data sources from Locumate unlock new KPIs. The RAG knowledge bases grow with each customer.

**Process when new data arrives:**
1. New file added to `data/`
2. Data Source Registry updated
3. New KPI formulas built
4. Insufficient cards flip to sufficient
5. KB1 updated with new data source context
6. Re-index → all cards benefit from richer context

**Data source priority for Locumate:**

| Priority | Source | Signals unlocked | Decisions it strengthens |
|---|---|---|---|
| ~~1~~ | ~~Zoho Desk~~ | — | **Done — 29 Mar 2026** |
| 1 | Admin CP Signup Report | 3-5 signals (Sam) | Retention & renewal |
| 2 | Zoho CRM Activities | 1 signal (Surge) | Market expansion |
| 3 | Product telemetry | 1-2 signals, completes churn score | Product roadmap |
| 4 | Bug tracker export | 1 signal | Product roadmap |

**RAG growth over time:**
- Each new customer adds domain context to KB2 (their industry, their norms)
- Each new KPI type adds analysis patterns to KB3
- The knowledge bases compound — future customers get richer context from day one

---

## RAG maintenance and quality

### How to know if RAG is helping

For each card, log:
- Which chunks were retrieved from each KB
- Which retrieved chunks were actually used in the LLM output (did the benchmark appear in the synthesis?)
- Whether the chain of thought references retrieved vs. non-retrieved information

This creates a feedback loop: if retrieval is returning irrelevant chunks, improve the chunking or add better content. If the LLM is ignoring retrieved benchmarks, improve the prompt.

### Keeping knowledge bases current

| KB | Update frequency | Who updates |
|---|---|---|
| KB1 (Company Context) | When onboarding data changes or new user context arrives | Automated from onboarding pipeline |
| KB2 (Benchmarks) | Quarterly — refresh benchmark reports | Manual curation |
| KB3 (Analysis Patterns) | When new KPI types are added or analysis quality issues are found | Manual curation |

### Anti-hallucination safeguards

- Every benchmark claim must cite a retrieved source — if the LLM can't cite one, it must say "no benchmark available for this metric"
- The chain of thought must reference only data provided in the prompt or retrieved from a KB — claims from "general knowledge" are flagged
- QA step: compare the chain of thought against the evidence package — every bullet should trace to a number or a retrieved chunk

---

## Summary

| Phase | Delivers | RAG role | User sees |
|---|---|---|---|
| **0 — Foundation** | Data Contract + Decision Catalogue + 3 Knowledge Bases indexed | Build and index KB1, KB2, KB3 | — (internal) |
| **1 — Signal cards** | 4 sufficient + 1 insufficient per user, RAG-enhanced analysis, data freshness, provenance summary, quality notes, cross-signal references | Data quality gate on input files. Retrieval per card: user context, benchmarks, analysis patterns | "Here's what's happening, here's how we know, here's why it matters — with citations, data date, source, and related signals" |
| **2 — Insufficient cards** | Actionable gap cards with domain context | KB2 enriches "why this matters", KB1 connects to decisions | "Here's what to connect, why it matters in your industry, and which decision it helps" |
| **3 — Recommended signals + decisions** | Proactive advisor | KB2 grounds recommendations, KB1 personalises them | "You should watch SLA compliance — 89% of SaaS companies at your volume track this" |
| **4 — Enhanced analysis** | Decision framing + richer benchmarks + causal chains | KB2 provides multi-dimensional benchmarks, KB3 provides causal frameworks | Cross-signal narratives with deep domain grounding |
| **5 — Weekly Brief** | Monday morning email with Decision Pulse | Full RAG on headline + focus signal + decision pulse | 90-second decision-ready summary |
| **6 — Data expansion** | More signals + growing KBs | KBs compound with each customer | Richer, more credible analysis over time |

**Phase 0 is the foundation.** It takes longer than the non-RAG version (knowledge base curation + indexing setup) but everything built on top of it is higher quality.

**Phase 1 is the first ship.** Cards include real data + RAG-enhanced analysis with visible chain of thought + cited benchmarks. This is the "aha" moment, done right from the start.

**The knowledge bases compound.** Every benchmark sourced, every analysis pattern documented, every customer context indexed — it all makes the next card, the next customer, the next signal better. RAG is the engine that makes Camino smarter over time.
