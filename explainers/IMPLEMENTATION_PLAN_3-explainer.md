# Implementation Plan 3 — explained for PMs

**What this doc is:** A build plan for turning **raw customer context + numbers** into **signal cards** (the little KPI “cards” Surge and Sam see in the preview), using an automated **pipeline** and an AI assistant (**Claude**) for the “thinking in words” steps.

Think of the whole thing as a **restaurant that serves two kinds of output:**  
1) **Back-kitchen prep** — clean ingredients, check quality, cook numbers.  
2) **Front-of-house plates** — JSON files the web preview reads, like a fixed **set menu** printed for each diner (each user: Surge or Sam).

---

## The big picture (one metaphor)

**Pipeline = an assembly line with quality gates.**

- **Ingredients** go in one end: onboarding notes turned into structured JSON, plus spreadsheets/CSVs with metrics.  
- **Stations** along the line each do one job: tidy the data, check it, compute KPIs, then **AI** writes the narrative and picks which signals matter.  
- **Finished plates** come out the other end as files in an `out/` folder — like a **packaged takeaway** the preview app opens. No one hand-types the final cards for the demo if this works as designed.

If something is wrong at a station, the line **stops** (*fail-fast*). You fix upstream rather than serving a half-wrong meal.

---

## Why “CLI-first” (Decision 2)

**Metaphor: a single “Run batch” button with swappable recipe cards.**

The team runs the pipeline from a **command line** (text instructions) instead of only from a pretty admin UI. That’s a **shipping trade-off:** less polished for operators, but **fast to iterate** — swap input files, run again, diff the outputs. For an MVD, that’s like testing a factory on **small batches** before you invest in a big control panel.

---

## Why “artifact-driven” (Decision 3)

**Metaphor: the menu is printed once; the dining room only reads the menu.**

The preview and quality-check tools **do not guess** business logic. They read **agreed JSON files** (`processed-signals.json`, `agent-signals.json`) as the **single source of truth**.  

That’s like **one printed menu** for the evening: the kitchen and the floor staff stay in sync. If marketing wants new copy, you **re-run the kitchen** (regenerate files), not **hand-edit** what the waiter says off-script.

---

## Claude first (Decision 1)

**Metaphor: hiring a sharp consultant who drafts memos.**

**Claude** is the AI provider used first for the stages that need **language and judgment** (which KPIs to recommend, why, expanded explanations). The plan leaves **hooks** to swap or add other providers later — like standardising on one law firm first, knowing you could brief another firm using the same case file format.

---

## Caching (Decision 5)

**Metaphor: saving last week’s approved draft so you don’t re-brief from zero.**

LLM calls cost time and money and can vary slightly. **Caching** means: if inputs to a stage didn’t change, **reuse the last good output** so runs are **repeatable** and cheaper. It’s not about hiding mistakes — it’s about **controlled reruns** when you’re tuning prompts or data.

---

## Fail-fast (Decision 6)

**Metaphor: metal detector at airport security.**

If step 3 fails, **don’t** quietly continue and bake errors into step 7. Stop, surface the error, fix upstream. Better a **clear stop** than a **wrong dashboard** nobody trusts.

---

## The 10 signal cards (Decision 4)

**Metaphor: a tasting menu with four sections.**

For each user (Surge, Sam), the product isn’t “some KPIs” — it’s a **fixed structure** for the release:

| Section | Count | Plain English |
|--------:|------|----------------|
| Requested, data OK | 3 | “You asked for these; we could fill them.” |
| Recommended, data OK | 3 | “We suggest these; here’s **why**.” |
| Recommended, data thin | 3 | “We suggest these, but data is missing — here’s **what’s missing** and **how to get it**.” |
| Requested, data thin | 1 | “You asked for this one, but we’re short on data — same honest story.” |

That’s **10 cards per person** — like **10 courses** where the *type* of course tells you what kind of conversation the product supports.

---

## The eight steps (story form)

1. **Entry + manifest** — Press “go”; write a **logbook** (what ran, when, with which files). Like a **batch record** in manufacturing.  
2. **Normalize** — Turn messy inputs into **one clean internal shape** (partly done: onboarding JSON exists). Like **prep**: chop vegetables the same way every time.  
3. **Quality checks** — **Spot bad rows**, duplicates, weird types. Like **QC** on incoming produce.  
4. **BI / KPIs** — **Compute numbers** with traceable formulas. Like **recipes with citations** (“this margin used revenue from column X”).  
5. **Strategy + narrative (Claude)** — Pick and explain signals in **words**. Like **head chef + writer** plating the story.  
6. **Write artifacts** — Save the **official JSON** for the app. Like **sealing the takeaway containers**.  
7. **Preview + QC wiring** — The web UI reads those files; **Surge/Sam toggle**; enforce **10 cards** with correct text per category. Like **training waitstaff** to serve only what’s on the menu.  
8. **Rerun workflow** — Document how to **swap inputs and regenerate**. Like **rerunning the batch** when the supplier sends a new CSV.

---

## Where things stand (~18%)

**Metaphor: you’ve standardised the recipe card format and bought two sample ingredient packs (Sam + Surge onboarding JSON). The kitchen line and the automated cooker are still mostly on the blueprint.**

Done: **schemas**, **validated onboarding files** for both users.  
Not done: **full pipeline run**, **Claude stages**, **generated `out/` files** as the live source for preview, **10-card enforcement** in the UI.

---

## Related docs (if you want to go deeper)

- **`MVD_ARCHITECTURE_AND_DATA_FLOW.md`** — Picture of how files move through stages (with a diagram).  
- **`templates/onboarding-call-template.md`** — How to capture a call in a way that becomes onboarding JSON.  
- **`release acceptance criteria/Refined AC for 25 Mar`** — What “done” looks like for the release from a user’s point of view.

---

*Generated to explain `implementation plans/IMPLEMENTATION_PLAN_3.md` in plain language.*
