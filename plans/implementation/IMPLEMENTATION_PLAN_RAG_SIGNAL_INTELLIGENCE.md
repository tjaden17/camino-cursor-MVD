# Implementation Plan — RAG-Enhanced Signal Intelligence

**Overall Progress:** `0%`

**Source roadmap:** `docs/roadmaps-draft/Expert+RAG-uplift-29Mar.md`
**Codebase:** TypeScript / Node 20+ / Vitest / Anthropic SDK
**Existing pipeline:** `src/pipeline/run-pipeline.ts` (normalize → kpi_spec → org_strategy → quality → bi → claude_selection → claude_narrative → repair → write_artifacts)

---

## TLDR

Build the RAG-enhanced signal intelligence pipeline described in the roadmap. The goal is signal cards with real KPI values, data freshness, provenance, quality gates, RAG-grounded analysis (benchmarks + chain of thought), cross-signal references, and insufficient cards that drive action. The pipeline already runs end-to-end in TypeScript — this plan upgrades it phase by phase.

---

## Critical Decisions

- **RAG stack:** ChromaDB (local, in-process) + Ollama local embeddings (or Anthropic API embeddings as fallback) — no cloud vector DB, no extra servers
- **Knowledge base format:** Markdown files in a `knowledge/` repo folder, chunked by heading, indexed at pipeline startup
- **Language:** Stay in TypeScript for all pipeline code. ChromaDB has a JS/TS client (`chromadb` npm package) — no Python needed
- **LLM narrates, never discovers:** Every number comes from deterministic Steps 2-3; the LLM only narrates and synthesises retrieved context
- **Human-in-the-loop:** KPI candidate list must be reviewed and locked before any computation runs
- **Data quality gate:** New Step 1c runs rule-based checks on every input file before it enters computation; fail = blocked, warn = flagged on card
- **Pipeline run cadence:** On-demand for MVD demo; automatic (daily/weekly) in future — freshness timestamp always shown on card

---

## Testing Strategy

**TDD (write tests first) for deterministic code:**
- KPI formulas — the single highest-value place for TDD. Write the expected output first ("win_rate for this snapshot = 38%"), then build the formula. If it breaks later, tests catch it immediately.
- Data quality checks — feed a file with known problems, assert the checker catches each one.
- Schema validation — expected pass/fail for valid and invalid KPI specs, decision catalogues, card output.

**Acceptance-test style for non-deterministic code:**
- RAG retrieval — "does the right chunk come back?" Verified by retrieval spot-checks, not strict TDD.
- LLM output — non-deterministic by nature. Use golden snapshot reviews (save a known-good output, compare future runs visually) + the acceptance criteria below.

**Acceptance criteria for every phase** are listed below each phase heading. A phase is not done until all its acceptance criteria pass.

---

## Tasks

### Phase 0 — Foundation

**Acceptance criteria — Phase 0 is done when:**
1. `npm run validate:kpi-spec` passes with all 24 KPIs having real formulas, data source dependencies, and sufficiency thresholds
2. Every KPI in the spec has a `formula` field that a human can read and say "yes, that's the right calculation"
3. Each user (Surge, Sam) has a mapping showing which KPIs are sufficient vs. insufficient, and the mapping matches the roadmap tables
4. The Decision Catalogue exists as valid JSON with ~14 entries, each linking a role + decision + timeframe + informing signals
5. `knowledge/` folder contains at least 12 markdown files across KB1, KB2, KB3
6. Every benchmark in KB2 has a source citation (report name, year, publisher)
7. ChromaDB indexer runs without error and reports chunk counts per KB
8. Three retrieval spot-checks pass:
   - Query "healthy win rate for seed-stage SaaS" → returns KB2 chunk with OpenView or similar source
   - Query "what does Surge care about" → returns KB1 chunk mentioning his goals or pain points
   - Query "how to analyse support volume" → returns KB3 chunk with the chain-of-thought template

- [ ] 🟥 **Step 1: Upgrade KPI Data Contract (`data/kpi-spec/kpi-spec-v1.json`)** 🧪 TDD
  - [ ] 🟥 Write validation tests first: valid spec passes, spec missing `formula` fails, spec with unknown data source fails
  - [ ] 🟥 Replace generic `RULE_LEADS_ROW_COUNT` with real per-KPI formulas for all 24 KPIs
  - [ ] 🟥 Add `dataSources`, `sufficiencyThreshold`, and `formula` fields per KPI to the JSON schema (`schemas/kpi-spec-v1.json`)
  - [ ] 🟥 Update `src/kpi-spec/validate-kpi-spec.ts` to enforce new required fields
  - [ ] 🟥 Build Data Source Registry: list of 5 connected + 4 expected/wishlist sources (new section in kpi-spec or separate file)
  - [ ] 🟥 Build per-user KPI mapping (Surge: 5 sufficient / 5 insufficient; Sam: 6 sufficient / 4 insufficient)
  - [ ] 🟥 Build Unlock Table: prioritised list of data sources to request, with which KPIs they unlock

- [ ] 🟥 **Step 2: Build Decision Catalogue**
  - [ ] 🟥 Create `data/decision-catalogue/decisions-v1.json` with ~14 role-decision entries, each linked to signals and timeframes
  - [ ] 🟥 Create JSON schema for decision catalogue (`schemas/decision-catalogue-v1.json`)
  - [ ] 🟥 Define 5-10 signal-pattern-to-decision trigger pairs for Locumate (e.g. "support volume rising + resolution time stable → consider support team expansion")
  - [ ] 🟥 Add 4 new onboarding questions to capture active decisions (update onboarding schema)

- [ ] 🟥 **Step 3: Set up RAG infrastructure** 🧪 TDD
  - [ ] 🟥 Add `chromadb` (JS/TS client) to `package.json`
  - [ ] 🟥 Add embedding dependency — either Ollama local model (`nomic-embed-text`) or Anthropic embeddings via existing SDK
  - [ ] 🟥 Write chunking tests first: "a markdown file with 3 H2 sections produces 3 chunks", "chunks are within 200-500 token range"
  - [ ] 🟥 Create `src/rag/` module with: `indexer.ts` (chunk + embed + store), `retriever.ts` (query + return top-k chunks), `types.ts`
  - [ ] 🟥 Implement heading-based chunking (~200-500 tokens per chunk) for markdown files
  - [ ] 🟥 Implement re-index-on-change detection (hash comparison or file mtime)
  - [ ] 🟥 Write integration tests for indexer and retriever (`src/rag/__tests__/`)

- [ ] 🟥 **Step 4: Curate Knowledge Base 2 — Domain Knowledge + Benchmarks (first priority)**
  - [ ] 🟥 Create `knowledge/` directory in repo root
  - [ ] 🟥 Write `knowledge/kb2-saas-support-benchmarks.md` — resolution times, SLA targets, FCR rates, ticket volumes by company size/stage (with sources + citations)
  - [ ] 🟥 Write `knowledge/kb2-saas-sales-benchmarks.md` — win rates, deal velocities, pipeline coverage by stage (with sources)
  - [ ] 🟥 Write `knowledge/kb2-pharmacy-workforce-context.md` — shift patterns, locum market, pharmacy group structures, utilisation rates
  - [ ] 🟥 Write `knowledge/kb2-customer-success-benchmarks.md` — churn rates, NPS, health score frameworks
  - [ ] 🟥 Write `knowledge/kb2-metric-interpretation-guides.md` — what rising/falling values mean per KPI type

- [ ] 🟥 **Step 5: Curate Knowledge Base 1 — Company + User Context (second priority)**
  - [ ] 🟥 Write `knowledge/kb1-locumate-company-context.md` — industry, stage, team size, business model, derived from onboarding
  - [ ] 🟥 Write `knowledge/kb1-locumate-glossary.md` — domain terms: "shift", "locum", "agency usage", "groups"
  - [ ] 🟥 Convert onboarding profiles + strategy mirrors into indexable markdown format in `knowledge/`
  - [ ] 🟥 Add interview notes and weekly reviews as indexable docs

- [ ] 🟥 **Step 6: Curate Knowledge Base 3 — Metric Definitions + Analysis Patterns (third priority)**
  - [ ] 🟥 Write `knowledge/kb3-metric-specs.md` — formulas and edge cases per KPI, derived from `docs/data-specs/metric-specs-v1`
  - [ ] 🟥 Write `knowledge/kb3-chain-of-thought-templates.md` — per KPI type: which breakdowns to check, in what order, what patterns to look for
  - [ ] 🟥 Write `knowledge/kb3-signal-card-requirements.md` — what each card section must contain, quality bars
  - [ ] 🟥 Write `knowledge/kb3-good-vs-bad-examples.md` — strong vs weak/generic analysis examples
  - [ ] 🟥 Write `knowledge/kb3-anti-hallucination-rules.md` — "never claim a benchmark without a source", etc.

- [ ] 🟥 **Step 7: Index all knowledge bases into ChromaDB**
  - [ ] 🟥 Run indexer against `knowledge/` folder; verify chunk count and embedding quality
  - [ ] 🟥 Test retrieval: query "what is a healthy win rate for seed-stage SaaS?" and confirm KB2 chunks return
  - [ ] 🟥 Test retrieval: query "what does Surge care about?" and confirm KB1 chunks return
  - [ ] 🟥 Test retrieval: query "how to analyse support volume" and confirm KB3 chunks return

---

### Phase 1 — Signal Cards with RAG-Enhanced Analysis

**Acceptance criteria — Phase 1 is done when:**
1. Pipeline runs end-to-end against Locumate data without error
2. Surge sees exactly 4 sufficient cards (win_rate, support_issue_volume, prospects, pipeline_value) + 1 insufficient card (calls_per_week)
3. Sam sees exactly 4 sufficient cards (shifts, shift_utilisation, inactive_pharmacy_rate, jobs_posted) + 1 insufficient card (signups)
4. Every sufficient card displays: a real number (not a placeholder), a trend with direction + delta, a "Data as of [date]" freshness line, and a provenance summary (e.g. "Calculated from 245 Zoho Deals, Jan–Mar 2026")
5. Every sufficient card's **analysis** has a conclusion (2-3 sentences) + chain of thought (bullet-point walkthrough referencing specific breakdowns)
6. Every sufficient card's **synthesis** has a conclusion (2-3 sentences) + chain of thought with at least one cited benchmark (report name + year)
7. No benchmark claim appears without a source citation — if the LLM can't cite one, the card says "no benchmark available"
8. Every sufficient card has a "Related signals" line naming 1-2 other signals with their current value
9. The insufficient card explains: what's missing, how to provide it, what it unlocks, and which user decision it informs
10. Data quality check runs before computation: at least one test file with a known issue (e.g. nulls) produces a "warn" status, and the resulting card shows a quality note
11. KPI formula tests (Vitest) pass for all sufficient KPIs — each test asserts expected output against a known data snapshot
12. Provenance log exists per card: traces value to formula + source rows, and traces benchmark claims to retrieved KB2 chunks

- [ ] 🟥 **Step 8: Build KPI candidate generation (Step 1a)**
  - [ ] 🟥 Create `src/pipeline/stages/generate-candidates.ts` — scan connected data sources + retrieve user context from KB1 → produce candidate KPI list
  - [ ] 🟥 Each candidate outputs: KPI name, description, computable status (sufficient / insufficient / borderline), suggested type (requested / recommended), source data file
  - [ ] 🟥 Wire into pipeline as new stage before `bi`

- [ ] 🟥 **Step 9: Build human checkpoint (Step 1b)**
  - [ ] 🟥 Create `src/pipeline/stages/human-checkpoint.ts` — reads candidate list, outputs locked KPI list
  - [ ] 🟥 For MVD: locked list is a JSON file (`data/kpi-spec/locked-kpis.json`) that the operator edits manually between runs
  - [ ] 🟥 Pipeline halts if locked list doesn't exist or is stale vs. candidate list

- [ ] 🟥 **Step 10: Build input data quality check (Step 1c)** 🧪 TDD
  - [ ] 🟥 Write tests first: file with 40% null Category → warn; file missing expected column → fail; clean file → pass; file with duplicate IDs → warn
  - [ ] 🟥 Create `src/pipeline/stages/data-quality-check.ts` — per input file, run: missing columns, null rate on key fields, date range sanity, duplicate detection, value range outliers, format consistency
  - [ ] 🟥 Output pass / warn / fail per file; fail blocks file from entering computation
  - [ ] 🟥 Generate Data Quality Report (JSON) for operator
  - [ ] 🟥 Attach quality notes to pipeline context so cards can reference them
  - [ ] 🟥 Wire into pipeline between human checkpoint and compute stages

- [ ] 🟥 **Step 11: Upgrade deterministic compute (Steps 2-3)** 🧪 TDD — highest-value tests in the plan
  - [ ] 🟥 Write formula tests first for every sufficient KPI against a known data snapshot (e.g. "win_rate for fixtures/deals-snapshot.csv = 38%", "support_issue_volume for fixtures/tickets-snapshot.csv = 84")
  - [ ] 🟥 Write breakdown tests first (e.g. "support_issue_volume by channel = {Phone: 44, Email: 40}")
  - [ ] 🟥 Rewrite `src/pipeline/kpi/rules.ts` — replace generic replay with real per-KPI formulas from the upgraded kpi-spec
  - [ ] 🟥 Each KPI output now includes: current value, previous value, trend (up/down/flat + delta), provenance (file, rows, formula), **data freshness timestamp** (most recent record date in source)
  - [ ] 🟥 Add dimensional breakdowns per KPI (e.g. support_issue_volume by channel, by category, by priority) as a new computation layer after value computation
  - [ ] 🟥 All formula + breakdown tests pass green

- [ ] 🟥 **Step 12: Build RAG-enhanced LLM prompt assembly (Step 4)**
  - [ ] 🟥 Create `src/pipeline/stages/rag-prompt-assembly.ts` — per card: combine deterministic inputs (value + trend + breakdowns + provenance) with retrieved context (KB1 user snippets, KB2 benchmarks, KB3 analysis pattern)
  - [ ] 🟥 Retrieval queries per card: 1 query to KB1 (user context for this KPI), 1 to KB2 (benchmarks for this KPI type), 1 to KB3 (analysis pattern)
  - [ ] 🟥 Assembled prompt instructs LLM to produce: Analysis (conclusion + chain of thought) + Synthesis (conclusion + chain of thought), citing all sources
  - [ ] 🟥 Update existing `src/pipeline/llm.ts` Claude call to use the assembled prompt instead of the current hand-built one

- [ ] 🟥 **Step 13: Add cross-signal reference to cards**
  - [ ] 🟥 Define causal graph as a data structure (adjacency list in `data/` or `src/pipeline/`)
  - [ ] 🟥 Per card: look up 1-2 related signals from the causal graph, include their current value from Step 2
  - [ ] 🟥 Append "Related signals" line to card output

- [ ] 🟥 **Step 14: Build insufficient card generation (Step 5)**
  - [ ] 🟥 For each insufficient KPI: retrieve from KB2 (why this metric matters) + KB1 (which decision it informs)
  - [ ] 🟥 Generate templated card: KPI name, what it would tell the user, what's missing, how to provide it, what it unlocks, decision link
  - [ ] 🟥 Wire into pipeline alongside sufficient card generation

- [ ] 🟥 **Step 15: Update card output schema + UI preview** 🧪 TDD
  - [ ] 🟥 Write schema validation tests first: card missing `dataFreshness` fails, card with all new fields passes
  - [ ] 🟥 Update signal card JSON schema to include new fields: `dataFreshness`, `provenanceSummary`, `qualityNotes`, `crossSignalReferences`, `analysisChainOfThought`, `synthesisChainOfThought`, `retrievedSources`
  - [ ] 🟥 Update `apps/qc-ui/` (Nuxt) to render new fields on the signal preview
  - [ ] 🟥 Update `write_artifacts` stage to include new fields in output JSON

- [ ] 🟥 **Step 16: End-to-end test — Phase 1 complete**
  - [ ] 🟥 Run full pipeline against Locumate data
  - [ ] 🟥 Verify: Surge gets 4 sufficient + 1 insufficient card; Sam gets 4 sufficient + 1 insufficient card
  - [ ] 🟥 Verify each sufficient card has: real value, trend, freshness date, provenance summary, quality notes (if applicable), analysis with CoT, synthesis with CoT, cross-signal reference, cited sources
  - [ ] 🟥 Verify provenance log traces every claim to computed data or retrieved chunk
  - [ ] 🟥 Review output quality: are benchmarks cited? Is chain of thought specific, not generic? Does synthesis connect to user context?

---

### Phase 2 — Insufficient Cards That Drive Action

**Acceptance criteria — Phase 2 is done when:**
1. Every insufficient KPI across both users has a card (not just 1 per user — all insufficient KPIs from the mapping)
2. Each insufficient card includes a domain-context paragraph explaining why the metric matters, with a cited benchmark (from KB2)
3. Each insufficient card names the specific user decision it informs (from KB1 / Decision Catalogue)
4. Each insufficient card has concrete export instructions (tool name, navigation path, expected file format)
5. A non-technical person reading the card can answer: "What am I missing?", "Why should I care?", "How do I fix it?"

- [ ] 🟥 **Step 17: Enrich insufficient cards with RAG**
  - [ ] 🟥 KB2 retrieval: add domain context for why each missing metric matters (with citations)
  - [ ] 🟥 KB1 retrieval: connect each gap to the user's specific active decision
  - [ ] 🟥 Include export instructions per missing data source (e.g. "Zoho CRM > Activities > Export to CSV")

---

### Phase 3 — Recommended Signals + Recommended Decisions

**Acceptance criteria — Phase 3 is done when:**
1. At least 2 recommended KPIs surface per user that the user didn't ask for, each with a "why it's recommended" explanation citing a benchmark
2. Each recommended KPI is personalised — it connects to the user's context, not generic advice
3. At least 1 decision recommendation triggers from a signal pattern (e.g. "support volume rising 3 weeks → consider support team expansion")
4. The user can distinguish between "I asked for this" (requested), "you think I should watch this" (recommended), and "I can't compute this yet" (insufficient)

- [ ] 🟥 **Step 18: Build recommended KPI engine**
  - [ ] 🟥 Use causal graph + signal-to-decision links to suggest KPIs the user isn't tracking but should be
  - [ ] 🟥 KB2 retrieval grounds the "why it's recommended" explanation
  - [ ] 🟥 KB1 retrieval personalises to user's context

- [ ] 🟥 **Step 19: Build recommended decision triggers**
  - [ ] 🟥 Implement signal-pattern-to-decision matching from the Decision Catalogue
  - [ ] 🟥 When a pattern matches (e.g. "support volume rising 3 consecutive weeks"), surface the relevant decision recommendation on the card

---

### Phase 4 — Enhanced Analysis

**Acceptance criteria — Phase 4 is done when:**
1. Every card's synthesis names a specific user decision it informs (not generic — "your hiring vs outsourcing decision", not "a staffing decision")
2. At least 3 cards include multi-dimensional benchmark comparisons (e.g. "healthy for SaaS, but below average for healthcare B2B specifically")
3. At least 2 causal chain narratives exist — connecting 3+ signals in sequence with computed values proving each link (e.g. "support volume → resolution time → SLA compliance")
4. Causal chain narratives distinguish well-established links from speculative ones

- [ ] 🟥 **Step 20: Decision-framed synthesis**
  - [ ] 🟥 Each card's synthesis explicitly names the user's active decision it informs

- [ ] 🟥 **Step 21: Richer benchmark comparisons**
  - [ ] 🟥 Multi-dimensional benchmarks from expanded KB2 (e.g. "healthy for SaaS, but below average for healthcare B2B specifically")

- [ ] 🟥 **Step 22: Causal chain narratives**
  - [ ] 🟥 Cross-signal analysis using causal graph + computed values for each node in the chain
  - [ ] 🟥 KB2 distinguishes well-established causal links from speculative ones

---

### Phase 5 — Weekly Brief

**Acceptance criteria — Phase 5 is done when:**
1. A Weekly Brief can be generated for Surge and Sam separately
2. The brief contains: a headline (1-2 sentence cross-signal summary), a scorecard (all KPIs with value + trend), and a focus signal (the most urgent card's full analysis)
3. v2 adds a Decision Pulse section — at least 1 decision per user with a signal-based recommendation
4. The brief can be read in under 90 seconds and a non-technical person can answer: "What should I pay attention to this week?"
5. Output is in a format ready for email (HTML or clean markdown)

- [ ] 🟥 **Step 23: Build Weekly Brief generator**
  - [ ] 🟥 v1: Scorecard (KPI + value + trend) + headline (cross-signal synthesis via RAG) + focus signal (highest-urgency card's analysis)
  - [ ] 🟥 v2: Add Decision Pulse section (what signals say about each active decision)
  - [ ] 🟥 v3: Full brief with causal chains and richer benchmarks
  - [ ] 🟥 Output as formatted email-ready HTML/markdown

---

### Phase 6 — Data Expansion (Ongoing)

**Acceptance criteria — Phase 6 is done when:**
1. A documented, repeatable process exists for adding a new data source (checklist, not tribal knowledge)
2. Adding a new CSV to `data/` and following the process results in: new KPIs appearing in the candidate list, previously-insufficient cards flipping to sufficient, and KB1 re-indexed with new source context
3. The first expansion (Admin CP Signup Report) has been completed end-to-end using the documented process

- [ ] 🟥 **Step 24: New data source onboarding process**
  - [ ] 🟥 Documented process: add file to `data/`, update registry, build KPI formulas, re-index KBs
  - [ ] 🟥 Priority order: Admin CP Signup Report → Zoho CRM Activities → Product telemetry → Bug tracker

---

### Cross-cutting — RAG Maintenance + Quality

**Acceptance criteria — Cross-cutting is done when:**
1. Every pipeline run produces a retrieval log: per card, which chunks were retrieved from each KB, with relevance scores
2. A QA check can be run that compares each chain-of-thought bullet to the evidence package — flagging any bullet that doesn't trace to a computed value or a retrieved chunk
3. Any card where the LLM cites a benchmark not found in retrieved chunks is automatically flagged (not silently published)

- [ ] 🟥 **Step 25: RAG observability and feedback loop**
  - [ ] 🟥 Log per card: which chunks retrieved from each KB, which were used in output, retrieval scores
  - [ ] 🟥 QA step: compare chain of thought against evidence package — every bullet should trace to a number or a retrieved chunk
  - [ ] 🟥 Anti-hallucination enforcement: reject cards where LLM cites benchmarks not found in retrieved chunks
