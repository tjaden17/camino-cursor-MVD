# Data learnings from today

**Date:** 30 March 2026  
**Context:** `/data-coach` after work aligned with `plans/implementation/IMPLEMENTATION_PLAN_RAG_SIGNAL_INTELLIGENCE.md` (treated below **as if implemented** for learning narrative).

---

## Summary 1 — Overview (project + data + user value)

**What Camino is, in one sentence**  
Camino helps a founder or operator move from “I have spreadsheets and dashboards” to “I know what this number means for *my* next decision” — without them doing the data archaeology themselves.

**Metaphor: the research librarian, not the fortune teller**  
Imagine a librarian who cannot invent facts. They can only pull books off the shelf (your curated knowledge), read your file folders (your real data), and write a clear memo that ties the two together. That is the spirit of **“LLM narrates, never discovers”**: every KPI value is computed from real rows and formulas; the model’s job is to explain and connect, not to guess numbers or benchmarks.

**The data journey (high level)**  
1. **Raw inputs** — Onboarding JSON (who Surge and Sam are, what they care about) plus business CSVs (deals, tickets, shifts, etc.).  
2. **Quality gate** — Like airport security for data: bad files get stopped or flagged before they infect a card.  
3. **Deterministic KPIs** — Math runs on the files: win rate, ticket volume, utilisation. No AI involved in the arithmetic.  
4. **RAG retrieval** — Three “shelves” of markdown knowledge get chunked, embedded, and searched:  
   - **KB1** — Who is this person and company?  
   - **KB2** — What does “good” look like (benchmarks with citations)?  
   - **KB3** — How do we analyse this kind of metric step by step?  
5. **Cards** — One structured story per KPI: number, trend, freshness, provenance, analysis (with reasoning), synthesis (“so what”), related signals.  
6. **A/B synthesis** — Same analysis; two “so what” flavours: org-level vs org + personal goals — so you can learn which voice lands better with users.

**User value (why it matters)**  
- **Speed** — A small deck of cards beats hunting through five tools.  
- **Trust** — “Calculated from X rows, data as of Y” and cited benchmarks beat vague AI claims.  
- **Decisions** — Cards are wired toward forks in the road (hiring vs outsourcing, expansion, etc.), not vanity metrics.

---

## Summary 2 — Recent implementation (data lens, assumed complete)

**What changed conceptually**  
The pipeline stopped being “prompt + hope” for facts. It became **evidence-first**: compute → retrieve → narrate. Signal intelligence is **grounded**: user context, benchmarks, and analysis playbooks arrive through retrieval; the LLM assembles language around that evidence package.

**Metaphor: recipe + ingredients**  
**Ingredients** = computed KPIs, breakdowns, quality notes, and retrieved chunks (each with a source). **Recipe** = KB3 templates (“check channel, then category, then SLA”). The **chef** (Claude) must only cook what’s on the counter — not invent ingredients.

**New or upgraded moving parts (as planned)**  
- **KPI data contract** — Each KPI knows its data sources, sufficiency rules, and human-readable formula.  
- **Decision catalogue** — Links roles, time horizons, and which signals inform which decisions (draft, refined with users in Phase 1b).  
- **RAG stack** — Local ChromaDB + embeddings; markdown in `knowledge/` chunked by heading; indexer on pipeline startup.  
- **Per-card retrieval** — Targeted queries into KB1, KB2, KB3 so each card gets relevant snippets, not generic mush.  
- **Two synthesis versions** — Version A (org + benchmarks) vs B (+ personal context) for the same underlying analysis — a clean experiment design.  
- **Insufficient cards** — Honest “we can’t compute this yet” with what’s missing, how to fix it, and which decision it would inform — still backed by retrieval where possible.  
- **Observability (cross-cutting)** — Retrieval logs and checks that benchmark claims trace to retrieved text reduce silent hallucinations.

**User value from this slice**  
Users see **relevant** “so what” (personal context), **credible** comparisons (cited benchmarks), and **inspectable** reasoning (chain of thought tied to numbers and sources). That directly targets the four problems in the plan: slow access, missing “so what,” low trust, and time cost.

---

## What you might want to learn next (pick your path)

| If you want to… | You could dig into… |
|-----------------|---------------------|
| Trust the product story with investors | How **provenance** and **retrieval logs** prove a claim on a card. |
| Run better user sessions (Phase 1b) | **Decision catalogue** + how **Version A vs B** questions are framed. |
| Speak credibly with engineers | **Chunking**, **embedding**, and **top-k retrieval** trade-offs (noise vs recall). |
| Improve content quality | Curating **KB2** (citations) and **KB3** (analysis templates) as living docs. |
| Plan the roadmap | Phases 2–6: insufficient depth, recommended signals, weekly brief, data expansion. |

---

## What you likely know, don’t know yet, and should know (as a PM)

**You probably know**  
- The **job-to-be-done**: faster, trustworthy insight for decisions.  
- **Surge vs Sam** as personas and that cards are per user.  
- That **pin/save/share** are validation signals in the plan, not built features yet.

**You might not know yet (normal)**  
- Exact **chunk sizes**, **embedding model** choice, and when re-index triggers.  
- How **strictly** benchmark-in-output is validated in code vs manual QA.  
- Edge cases: sparse data, conflicting sources, stale KB1 after a user interview.

**You should know (high leverage)**  
- **Separation of duties**: numbers from code, interpretation from retrieved text + LLM.  
- **Why three KBs** — mixing user context, benchmarks, and methodology in one blob would blur accountability.  
- **Phase 1b loop**: confirmed decisions in JSON → KB1 update → re-index → better Version B — that is your **feedback flywheel** without building a prefs UI.

---

## Learning opportunities tied to this implementation

1. **Retrieval quality** — Spot-check queries vs stakeholder language (“healthy win rate” vs “are we doing okay on deals?”).  
2. **Citation discipline** — Every benchmark line in KB2 should be audit-ready; weak KB2 → weak trust.  
3. **A/B interpretation** — Version B wins only if KB1 is accurate; garbage-in still hurts the “personal” path.  
4. **Insufficient cards** — They are a **product surface** for data requests, not second-class UI.  
5. **Operator workflow** — You are the human-in-the-loop for MVD; documenting what you change after each user call scales the process.

---

## Five-question quiz (check your understanding)

Answer in your own words — no peeking at the doc until after.

1. In one sentence, what does **“LLM narrates, never discovers”** mean for a KPI number on a card?

2. Name the **three knowledge bases (KB1, KB2, KB3)** and what each is for — in plain language.

3. Why does the plan ship **two synthesis versions (A and B)** for the same analysis instead of one?

4. What is the **main purpose** of the data quality step **before** KPI computation?

5. After Phase 1b, you update a user’s profile and KB1, then re-index. **What should improve** on the next pipeline run, and which card version should benefit most?

### Answer key (for self-check after you answer)

1. The model must not invent or calculate the metric; it only describes values already computed from real data.  
2. KB1 = user/company context; KB2 = benchmarks and domain facts with sources; KB3 = how to analyse each metric type (templates/patterns).  
3. To A/B test whether org-only “so what” or org+personal “so what” resonates more with real users.  
4. To block or flag bad inputs early so cards are not built on broken or misleading data.  
5. Retrieval pulls **confirmed** personal context → synthesis should feel more relevant; **Version B** should improve most.

---

*End of data learnings from today.*
