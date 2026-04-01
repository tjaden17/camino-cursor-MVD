# Implementation Plan — RAG-Enhanced Signal Intelligence

**Overall Progress:** `78%`

**Source roadmap:** `docs/roadmaps-draft/Expert+RAG-uplift-29Mar.md`
**Codebase:** TypeScript / Node 20+ / Vitest / Anthropic SDK
**Existing pipeline:** `src/pipeline/run-pipeline.ts` (normalize → kpi_spec → org_strategy → quality → bi → claude_selection → claude_narrative → repair → write_artifacts)

---

## Goal — What success looks like by end of week

We show Surge and Sam their signal cards. Three things need to happen:

1. **KPIs are relevant and correct.** The user looks at their cards and says "yes, these are my numbers, and they're right." Evidenced by: they want to **pin** the KPIs they'd like to see every week.

2. **Analysis is useful.** The user reads the analysis (what's happening, what's driving it) and learns something they didn't already know. Evidenced by: they want to **save** the analysis for reference.

3. **Synthesis is useful.** The user reads the "so what" (why it matters, what to watch) and finds it valuable enough to share. Evidenced by: they want to **show it to someone else** — a co-founder, a team lead, a board member.

We won't build pin/save/share features yet. We'll ask the users directly whether they'd do those things. The answers tell us whether the core value is landing.

---

## How we get there — one-page explainer

### The product narrative

Camino's value chain works like this:

```
DESTINATION          DECISIONS            INFORMATION          CONFIDENCE
───────────          ─────────            ───────────          ──────────
The user has a       Along the way,       To decide well,      Camino helps
business goal,       there are forks      the user needs       the user be
a KPI target,        in the road.         the right info,      data-based
a hurdle to          Each decision        fast. Better info    when making
overcome.            moves them closer    → better decisions   decisions.
                     or further away.     → faster progress.
```

**Signal cards are the core delivery mechanism.** Each card takes one KPI and turns raw data into a story: here's the number, here's what's driving it, here's why it matters to *you*, here's what to watch. When the cards work, the user gets to a better decision, faster.

### What we're building

We're upgrading the existing pipeline so that signal cards are grounded in real data and real domain knowledge — not generic LLM guesses.

**The pipeline in plain English:**

1. **Check the data** — Before we touch anything, we run the input files through a quality gate. Missing columns, duplicates, stale data — caught before it poisons a card.

2. **Pick the right KPIs** — The system scans the user's data + their onboarding profile and determines which KPIs we can compute. For the MVD, the KPI list is set by us based on the onboarding data — no manual checkpoint needed. (Human-in-the-loop curation is a future addition.)

3. **Compute real numbers** — For each KPI, we run the actual formula against the actual data. Win rate = closed-won / total deals. No LLM involved. Every number traces back to a file, a set of rows, and a formula. We also compute breakdowns (e.g. support tickets by channel, by category) to give the analysis something specific to talk about.

4. **Retrieve relevant context** — This is where RAG comes in. For each card, we pull the most relevant pieces from three knowledge bases:
   - **Who is this user?** Their goals, pain points, the decisions they're facing. So the card speaks to *them*, not a generic audience. *(Produced from: onboarding profiles, interview notes, strategy mirrors — content we already have.)*
   - **What does "good" look like?** Industry benchmarks, domain knowledge, interpretation guides. So the card can say "your win rate is healthy for seed-stage SaaS" with a source citation, not a hallucinated number. *(Produced by: us, as a one-time research task. We read public benchmark reports — OpenView SaaS Benchmarks, Zendesk CX Trends, Pharmacy Guild workforce data, etc. — and curate the key numbers into markdown files with source citations. A few hours of work that benefits every card and every future customer.)*
   - **How should we analyse this?** Templates and patterns for each KPI type. So the analysis is consistent and thorough, not random. *(Produced by: us, writing analysis playbooks — "when analysing support volume, check channel breakdown, then category, then resolution time, then SLA." One file per KPI type.)*

5. **Write the card** — One LLM call per card, with everything above assembled into the prompt. The LLM narrates — it never discovers. Every number it references was computed in step 3. Every benchmark it cites was retrieved in step 4. We produce **two versions of each card** so we can A/B test which synthesis resonates more:

   Both versions share the same **Analysis** section:
   - **Analysis:** What's happening + chain of thought showing how we got there

   The **Synthesis ("So What")** differs:
   - **Version A — Org-level:** "So what" in relation to the company's context (industry, stage, benchmarks). Identical for all users in the same org. Answers: "How does this compare to what's normal for a company like ours?"
   - **Version B — Personal:** Everything in Version A, *plus* "so what" in relation to *this user's* goals, decisions, and priorities. Personalised per user. Answers: "What does this mean for *me* and *my* decisions?"

6. **Show the user** — Each card displays: the KPI value, trend, data freshness ("Data as of 27 Mar"), provenance ("Calculated from 4,645 Zoho Desk tickets"), analysis with reasoning, synthesis with cited benchmarks, and a pointer to 1-2 related signals.

### Why it should work

The four validated user problems and how this addresses them:

| User problem | How the card solves it |
|---|---|
| **Slow, difficult access to data** | One card per KPI, refreshed on demand. No digging through dashboards or exports. |
| **No "so what"** | The synthesis section — grounded in benchmarks and personalised to their context — tells the user why this number matters and what to watch. |
| **Low trust / confidence** | Every number traces to source data. Every benchmark cites a report. Chain of thought shows the reasoning. The user can verify any claim. |
| **Time cost** | A deck of 4-5 cards per user, each readable in 30 seconds. Total time: 2-3 minutes for a full picture. |

### Phase roadmap — the build sequence

```
Phase 0                Phase 1                 Phase 1b              Phase 2
FOUNDATION             SIGNAL CARDS            USER REFINEMENT       INSUFFICIENT
─────────              ────────────            ───────────────       CARDS
KPI data contract      4-5 cards per user      Show users cards,     Every missing KPI
+ Decision catalogue   with real numbers,      capture feedback,     gets a card: why
  (draft)              RAG analysis,           update profiles       it matters, how
+ 3 Knowledge bases    A/B synthesis,          + decisions,          to fix it, which
  curated + indexed    quality gate,           re-run pipeline       decision it helps
                       provenance              → better cards
       │                      │                       │                    │
       ▼                      ▼                       ▼                    ▼
Phase 3                Phase 4                 Phase 5              Phase 6
RECOMMENDED            ENHANCED ANALYSIS       WEEKLY BRIEF         DATA EXPANSION
SIGNALS                ─────────────────       ────────────         ──────────────
Proactive KPI +        Decision-framed         Monday morning       New data sources
decision recs          synthesis, richer       email: scorecard,    → new KPIs.
based on data          benchmarks, causal      headline, focus      Knowledge bases
patterns + causal      chain narratives        signal, decision     compound over time
graph                                          pulse
```

**This week: Phases 0 → 1 → 1b.** Everything else builds on top.

### What we're NOT building this week

- Pin / save / share features (we ask users verbally instead)
- Self-service KPI reordering or requesting (operator-mediated for MVD; self-service in a future version)
- Weekly Brief email (Phase 5)
- Recommended signals or decision triggers (Phase 3)
- Causal chain narratives across cards (Phase 4)
- Automatic pipeline scheduling (on-demand only for now)

---

## Addendum Plans

- **QC Pipeline Inspector (Dashboard Upgrade):** [`IMPLEMENTATION_PLAN_QC_PIPELINE_INSPECTOR.md`](./IMPLEMENTATION_PLAN_QC_PIPELINE_INSPECTOR.md) — Upgrades the QC dashboard into a step-by-step pipeline inspector for verifying data correctness at each stage. Includes JSON contracts for intermediate output files, page wireframes, and a build sequence synced with the phases below. Pipeline stages must write intermediate output files as defined in that plan's JSON Contracts section.

---

## Critical Decisions

- **RAG stack:** ChromaDB (local, in-process) + Ollama local embeddings (or Anthropic API embeddings as fallback) — no cloud vector DB, no extra servers
- **Knowledge base format:** Markdown files in a `knowledge/` repo folder, chunked by heading, indexed at pipeline startup
- **Language:** Stay in TypeScript for all pipeline code. ChromaDB has a JS/TS client (`chromadb` npm package) — no Python needed
- **LLM narrates, never discovers:** Every number comes from deterministic Steps 2-3; the LLM only narrates and synthesises retrieved context
- **KPI selection (MVD):** System-generated from onboarding data — no human checkpoint for MVD. Human-in-the-loop curation added in a future version.
- **A/B card versions:** Two synthesis variants per card — Version A (org-level "so what") and Version B (org + personal "so what") — to test which resonates with users
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
4. The Decision Catalogue exists as valid JSON with ~14 entries, each linking a role + decision + timeframe + informing signals. This is a draft — best-guess from onboarding data. Users confirm and correct in Phase 1b.
5. `knowledge/` folder contains at least 12 markdown files across KB1, KB2, KB3
6. Every benchmark in KB2 has a source citation (report name, year, publisher)
7. ChromaDB indexer runs without error and reports chunk counts per KB
8. Three retrieval spot-checks pass:
   - Query "healthy win rate for seed-stage SaaS" → returns KB2 chunk with OpenView or similar source
   - Query "what does Surge care about" → returns KB1 chunk mentioning his goals or pain points
   - Query "how to analyse support volume" → returns KB3 chunk with the chain-of-thought template

- [x] ✅ **Step 1: Upgrade KPI Data Contract (`data/kpi-spec/kpi-spec-v2.json`)** 🧪 TDD
  - [x] ✅ Write validation tests first: valid spec passes, spec missing `formula` fails, spec with unknown data source fails — `src/kpi-spec/validate-kpi-spec-v2.test.ts` (9 tests)
  - [x] ✅ Replace generic `RULE_LEADS_ROW_COUNT` with real per-KPI formulas for all 24 KPIs — `data/kpi-spec/kpi-spec-v2.json`
  - [x] ✅ Add `dataSources`, `sufficiencyThreshold`, and `formula` fields per KPI to the JSON schema — `schemas/kpi-spec-v2.json`
  - [x] ✅ Create `src/kpi-spec/validate-kpi-spec-v2.ts` to enforce new required fields
  - [x] ✅ Build Data Source Registry: 5 connected + 4 expected/wishlist sources in `kpi-spec-v2.json`
  - [x] ✅ Build per-user KPI mapping (Surge: 10 sufficient / 5 insufficient; Sam: 5 sufficient / 3 insufficient)
  - [x] ✅ Build Unlock Table: 4 prioritised data source requests in `kpi-spec-v2.json`

- [x] ✅ **Step 2: Build Decision Catalogue (draft — refined in Phase 1b)**
  - [x] ✅ Create `data/decision-catalogue/decisions-v1.json` with 14 role-decision entries
  - [x] ✅ Create JSON schema `schemas/decision-catalogue-v1.json`
  - [x] ✅ Define signal-pattern-to-decision trigger pairs (1-2 per decision)
  - [ ] 🟡 Add 4 new onboarding questions to capture active decisions — deferred to Phase 1b

- [x] ✅ **Step 3: Set up RAG infrastructure** 🧪 TDD
  - [x] ✅ Added `chromadb` to `package.json` + built lightweight file-based store (no server needed for MVD)
  - [x] ✅ Created `src/rag/` module: `types.ts`, `chunker.ts`, `store.ts`, `load-knowledge.ts`, `index.ts`
  - [x] ✅ Heading-based chunking at H2 boundaries — 8 chunker tests pass
  - [x] ✅ File-based store with TF-IDF retrieval — 6 store tests pass
  - [x] ✅ Knowledge loader reads all 14 files, assigns KB labels — 7 tests pass
  - [x] ✅ Integration tests: index all KBs + retrieve with cross-KB queries — 5 tests pass

- [x] ✅ **Step 4: Curate Knowledge Base 2 — Domain Knowledge + Benchmarks (first priority)**
  - [x] ✅ Created `knowledge/` directory — 14 markdown files total
  - [x] ✅ `knowledge/kb2-saas-support-benchmarks.md` — FRT, resolution time, SLA, FCR, CSAT, capacity, channels, reopens
  - [x] ✅ `knowledge/kb2-saas-sales-benchmarks.md` — win rates, velocity, pipeline coverage, ACV
  - [x] ✅ `knowledge/kb2-pharmacy-workforce-context.md` — shifts, locums, groups, utilisation, AU market
  - [x] ✅ `knowledge/kb2-customer-success-benchmarks.md` — churn, NPS, health scores, renewals, expansion
  - [x] ✅ `knowledge/kb2-metric-interpretation-guides.md` — pattern FAQs, leading/lagging, rate vs volume

- [x] ✅ **Step 5: Curate Knowledge Base 1 — Company + User Context (second priority)**
  - [x] ✅ `knowledge/kb1-locumate-company-context.md` — B2B SaaS, seed, ~17 people, Zoho stack
  - [x] ✅ `knowledge/kb1-locumate-glossary.md` — shift, locum, agency usage, groups, fill rate
  - [x] ✅ `knowledge/kb1-surge-context.md` — CEO goals, decisions, metrics, pain points
  - [x] ✅ `knowledge/kb1-sam-context.md` — CSM goals, decisions, metrics, pain points

- [x] ✅ **Step 6: Curate Knowledge Base 3 — Metric Definitions + Analysis Patterns (third priority)**
  - [x] ✅ `knowledge/kb3-metric-specs.md` — 8 KPI specs with formula, source, edge cases, validation
  - [x] ✅ `knowledge/kb3-chain-of-thought-templates.md` — per KPI type checklist
  - [x] ✅ `knowledge/kb3-signal-card-requirements.md` — card section requirements, traceability
  - [x] ✅ `knowledge/kb3-good-vs-bad-examples.md` — strong vs weak analysis/synthesis examples
  - [x] ✅ `knowledge/kb3-anti-hallucination-rules.md` — benchmark citation rules, data scope rules

- [x] ✅ **Step 7: Index all knowledge bases into ChromaDB**
  - [x] ✅ Indexer loads 14 files → 60+ chunks, verified in integration test
  - [x] ✅ Retrieval: "SaaS win rate benchmark" → KB2 chunks with sales benchmarks ✓
  - [x] ✅ Retrieval: "Locumate pharmacy staffing platform" → KB1 chunks ✓
  - [x] ✅ Retrieval: "chain of thought analysis template" → KB3 chunks ✓

---

### Phase 1 — Signal Cards with RAG-Enhanced Analysis

**Acceptance criteria — Phase 1 is done when:**
1. Pipeline runs end-to-end against Locumate data without error
2. Surge sees exactly 4 sufficient cards (win_rate, support_issue_volume, prospects, pipeline_value) + 1 insufficient card (calls_per_week)
3. Sam sees exactly 4 sufficient cards (shifts, shift_utilisation, inactive_pharmacy_rate, jobs_posted) + 1 insufficient card (signups)
4. KPI list is system-generated from onboarding data — no manual checkpoint required
5. Every sufficient card displays: a real number (not a placeholder), a trend with direction + delta, a "Data as of [date]" freshness line, and a provenance summary (e.g. "Calculated from 245 Zoho Deals, Jan–Mar 2026")
6. Every sufficient card's **analysis** has a conclusion (2-3 sentences) + chain of thought (bullet-point walkthrough referencing specific breakdowns)
7. Every sufficient card exists in **two versions:**
   - **Version A** — synthesis uses org context + benchmarks only (identical for Surge and Sam on the same KPI)
   - **Version B** — synthesis uses org context + benchmarks + the individual user's goals and decisions (personalised)
8. Every synthesis (both versions) includes at least one cited benchmark (report name + year)
9. No benchmark claim appears without a source citation — if the LLM can't cite one, the card says "no benchmark available"
10. Every sufficient card has a "Related signals" line naming 1-2 other signals with their current value
11. The insufficient card explains: what's missing, how to provide it, what it unlocks, and which user decision it informs
12. Data quality check runs before computation: at least one test file with a known issue (e.g. nulls) produces a "warn" status, and the resulting card shows a quality note
13. KPI formula tests (Vitest) pass for all sufficient KPIs — each test asserts expected output against a known data snapshot
14. Provenance log exists per card: traces value to formula + source rows, and traces benchmark claims to retrieved KB2 chunks

- [x] ✅ **Step 8: Build KPI candidate generation (Step 1a)**
  - [x] ✅ Created `src/pipeline/stages/generate-candidates.ts` — reads kpi-spec-v2 + user mappings → candidate list
  - [x] ✅ Each candidate: kpiId, title, formula, status, type, sourceIds, sourcePaths, breakdowns — 7 tests pass
  - [x] ✅ Surge: 10 sufficient + 5 insufficient; Sam: 5 sufficient + 3 insufficient

- [ ] ⬜ ~~**Step 9: Build human checkpoint (Step 1b)**~~ — *Deferred. Not needed for MVD. System-generated KPI list is used directly. Will add in a future version.*

- [x] ✅ **Step 10: Build input data quality check (Step 1c)** 🧪 TDD
  - [x] ✅ Tests first: clean → pass, missing column → fail, 40% null → warn, 80% null → fail, duplicates → warn — 7 tests pass
  - [x] ✅ Created `src/pipeline/stages/data-quality-check.ts` — per file: required columns, null rate, duplicate ID detection
  - [x] ✅ Output pass/warn/fail per file; fail blocks file from computation
  - [x] ✅ Quality report written to `data-quality-report.json`; notes attached to pipeline context and cards

- [x] ✅ **Step 11: Upgrade deterministic compute (Steps 2-3)** 🧪 TDD — highest-value tests in the plan
  - [x] ✅ Created `src/pipeline/stages/kpi-compute.ts` with 15 real KPI formulas — 19 tests pass
  - [x] ✅ Formulas: win_rate, support_issue_volume (4645 tickets), prospects (53 leads), pipeline_value, shifts, shift_utilisation, inactive_pharmacy_rate, jobs_posted, avg_deal_size, resolution_time, sla_compliance, fcr_rate, ticket_reopen_rate, csat, sentiment_trend
  - [x] ✅ Each KPI output: value, displayValue, trend, provenance (file + rows + formula), dataFreshness, breakdowns
  - [x] ✅ Dimensional breakdowns per KPI (e.g. support by channel, by category; shifts by group)
  - [x] ✅ `computeAllForUser("surge")` → 10 KPIs; `computeAllForUser("sam")` → 5 KPIs

- [x] ✅ **Step 12: Build RAG-enhanced LLM prompt assembly (Step 4) — with A/B synthesis**
  - [x] ✅ Created `src/pipeline/stages/rag-prompt-assembly.ts` — 9 tests pass
  - [x] ✅ Per card: 4 RAG queries (KB1 company, KB1 user, KB2 benchmarks, KB3 patterns)
  - [x] ✅ Version A: org context + benchmarks only (no personal goals)
  - [x] ✅ Version B: org context + benchmarks + personal goals/decisions
  - [x] ✅ Anti-hallucination rules in system prompt; pipeline produces both versions per card

- [x] ✅ **Step 13: Add cross-signal reference to cards**
  - [x] ✅ Created `src/pipeline/stages/cross-signal-ref.ts` — 15-KPI causal graph, 5 tests pass
  - [x] ✅ Per card: 1-2 related signals with relationship labels + current values from computation
  - [x] ✅ Wired into card output as `crossSignalReferences` array

- [x] ✅ **Step 14: Build insufficient card generation (Step 5)**
  - [x] ✅ Created `src/pipeline/stages/insufficient-cards.ts` — 7 tests pass
  - [x] ✅ Per insufficient KPI: whatItWouldTell, whatsNeeded, howToProvide, whatItUnlocks, decisionLink
  - [x] ✅ Links to decision catalogue; Surge: 5 cards, Sam: 3 cards

- [x] ✅ **Step 15: Update card output schema + UI preview** 🧪 TDD
  - [x] ✅ Created `src/pipeline/stages/card-schema.ts` — `SignalCardV2`, `InsufficientCardV2`, `PipelineOutputV2` types — 13 tests pass
  - [x] ✅ New fields: `dataFreshness`, `provenanceSummary`, `qualityNotes`, `crossSignalReferences`, `analysis.chainOfThought`, `synthesis.chainOfThought`, `synthesis.citedBenchmarks`, `retrievedSources`, `cardVersion` (A/B)
  - [x] ✅ Pipeline writes `pipeline-v2-output.json` and `data-quality-report.json`
  - [ ] 🟡 UI update for A/B comparison — deferred to QC Pipeline Inspector plan

- [x] ✅ **Step 16: End-to-end test — Phase 1 complete**
  - [x] ✅ Created `src/pipeline/stages/run-pipeline-v2.ts` — full pipeline: quality gate → candidates → compute → RAG → prompt → cards — 21 E2E tests pass
  - [x] ✅ Surge: 10 sufficient KPIs × 2 versions (A+B) + 5 insufficient = 25 cards
  - [x] ✅ Sam: 5 sufficient KPIs × 2 versions (A+B) + 3 insufficient = 13 cards
  - [x] ✅ Every sufficient card: real value, trend, freshness, provenance, analysis with CoT, synthesis with CoT, cross-signal refs, retrieved sources
  - [x] ✅ A/B versions have different synthesis (org-level vs personal)
  - [x] ✅ All data files pass quality gate; reports written to JSON

---

### Phase 1b — User Refinement (human-in-the-loop, operator-mediated)

**What this is:** You show Surge and Sam their Phase 1 cards. You sit with them (or talk through the cards together). They react. You capture their feedback and update their profile files. You re-run the pipeline. Their cards get better.

**This is not a self-service UI.** You're the operator. The user talks, you listen and update. The focus is producing the right data, not building a preferences screen.

**Acceptance criteria — Phase 1b is done when:**
1. You've shown Phase 1 cards to both Surge and Sam and captured their feedback
2. Each user's profile JSON has been updated with confirmed preferences (see below)
3. Pipeline has been re-run with updated profiles
4. Updated cards show noticeably more relevant synthesis — referencing the user's actual confirmed decisions and priorities, not our assumptions
5. The A/B test question is answered: does Version A (org-only) or Version B (org + personal) resonate more? Version B should become stronger after this step, because the personal context is now confirmed, not assumed.
6. Decision catalogue has been updated with any new decisions the users raised

**What you capture from each user:**

| What | Before (assumed) | After (confirmed by user) | Where it's saved |
|---|---|---|---|
| **KPI relevance** | We guessed from onboarding which KPIs matter | User confirms: "yes these are right" or "I actually care more about X" | User's onboarding profile JSON → `confirmedKpis` section |
| **Decisions — confirm** | We assumed from onboarding (e.g. "hiring vs outsourcing") | User says "yes, that's on my mind" or "no, that's resolved" | User's onboarding profile JSON → `confirmedDecisions` section |
| **Decisions — add new** | We didn't know about these | User says "I'm also thinking about pricing changes" | Added to user profile + decision catalogue |
| **Decisions — timeframes** | We guessed (e.g. "90 days") | User corrects: "that's a 30-day decision" | User's onboarding profile JSON → `confirmedDecisions` with updated timeframes |
| **Context corrections** | Anything we got wrong or missed | User says "we actually have 4 CS staff, not 3" or "we're also looking at expanding to NZ" | User's onboarding profile JSON or company context in KB1 |

**How it flows back into cards:**
1. You update the user's JSON profile with confirmed preferences
2. You update the decision catalogue with any new/corrected decisions
3. KB1 knowledge files are updated (company context, user context) and re-indexed into ChromaDB
4. Pipeline re-runs → retrieval now pulls confirmed context instead of assumed context → synthesis is more relevant
5. Show user the improved cards in a follow-up session

- [ ] 🟥 **Step 16b: Show Phase 1 cards to Surge, capture feedback**
  - [ ] 🟥 Walk through each card with Surge. Note reactions: which KPIs resonate, which feel irrelevant, which analysis surprised him, which synthesis he'd share
  - [ ] 🟥 Ask about A/B: does Version A or B feel more useful? Why?
  - [ ] 🟥 Ask about decisions: are the assumed decisions correct? Any new ones? Timeframe adjustments?
  - [ ] 🟥 Ask about context: anything we got wrong or missed about the company or his role?

- [ ] 🟥 **Step 16c: Show Phase 1 cards to Sam, capture feedback**
  - [ ] 🟥 Same process as Surge — walk through cards, capture reactions, A/B preference, decision corrections, context updates

- [ ] 🟥 **Step 16d: Update user profiles + decision catalogue + KB1**
  - [ ] 🟥 Update `data/onboarding/surge-onboarding-derived.json` with `confirmedKpis` and `confirmedDecisions` sections
  - [ ] 🟥 Update `data/onboarding/sam-onboarding-derived.json` with `confirmedKpis` and `confirmedDecisions` sections
  - [ ] 🟥 Update `data/decision-catalogue/decisions-v1.json` with any new or corrected decisions
  - [ ] 🟥 Update KB1 knowledge files with any context corrections (team size, expansion plans, etc.)
  - [ ] 🟥 Re-index KB1 into ChromaDB

- [ ] 🟥 **Step 16e: Re-run pipeline + verify improvement**
  - [ ] 🟥 Run full pipeline with updated profiles
  - [ ] 🟥 Compare updated cards to Phase 1 originals — synthesis should reference confirmed decisions and priorities, not assumed ones
  - [ ] 🟥 Show updated cards to users in follow-up session and confirm improvement

---

### Phase 2 — Insufficient Cards That Drive Action

**Acceptance criteria — Phase 2 is done when:**
1. Every insufficient KPI across both users has a card (not just 1 per user — all insufficient KPIs from the mapping)
2. Each insufficient card includes a domain-context paragraph explaining why the metric matters, with a cited benchmark (from KB2)
3. Each insufficient card names the specific user decision it informs (from KB1 / Decision Catalogue)
4. Each insufficient card has concrete export instructions (tool name, navigation path, expected file format)
5. A non-technical person reading the card can answer: "What am I missing?", "Why should I care?", "How do I fix it?"

- [x] ✅ **Step 17: Enrich insufficient cards with RAG**
  - [x] ✅ KB2 retrieval: add domain context for why each missing metric matters (with citations) — `insufficient-rag-enrichment.ts`, wired in `run-pipeline-v2.ts`
  - [x] ✅ KB1 retrieval: connect each gap to the user's specific active decision — same module + `retrievedKbSources` on cards
  - [x] ✅ Include export instructions per missing data source — still from `insufficient-cards.ts`; RAG layer does not replace export copy

---

### Phase 3 — Recommended Signals + Recommended Decisions

**Acceptance criteria — Phase 3 is done when:**
1. At least 2 recommended KPIs surface per user that the user didn't ask for, each with a "why it's recommended" explanation citing a benchmark
2. Each recommended KPI is personalised — it connects to the user's context, not generic advice
3. At least 1 decision recommendation triggers from a signal pattern (e.g. "support volume rising 3 weeks → consider support team expansion")
4. The user can distinguish between "I asked for this" (requested), "you think I should watch this" (recommended), and "I can't compute this yet" (insufficient)

- [x] ✅ **Step 18: Build recommended KPI engine**
  - [x] ✅ Suggest extra KPIs — `recommendedWithinSufficientKpis` + `recommendedOrgWideKpis` in `kpi-spec-v2.json`; `generate-candidates.ts` + `kpi-compute.ts` union org-wide IDs
  - [x] ✅ KB2 + KB1 ground the "why it's recommended" copy — `recommended-rationale.ts` → `recommendedRationale` + merged synthesis on `SignalCardV2`
  - [ ] 🟥 Full causal-graph-driven suggestions (beyond spec lists) — future

- [x] ✅ **Step 19: Build recommended decision triggers**
  - [x] ✅ Signal-pattern matching vs catalogue — `decision-triggers.ts` + `evaluateDecisionTriggers` on `decisions-v1.json`
  - [x] ✅ Matches attached to pipeline output — `triggeredDecisionRecommendations` on `PipelineOutputV2` (not yet rendered on individual cards; JSON + downstream consumers)

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
