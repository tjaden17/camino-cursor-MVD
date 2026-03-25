# Implementation plan — explainer (PM-friendly)

Audience: non-technical product manager, theoretical shipping knowledge, below junior-dev depth.

Related doc: [`IMPLEMENTATION_PLAN.md`](../IMPLEMENTATION_PLAN.md)

---

## The implementation plan, in plain language

Think of **MVD** as: *“Can our AI kitchen produce a meal we’d actually serve?”* The plan is not the full restaurant yet—it’s **how you’ll taste-test and inspect** what the AI cooks before you invest in the dining room (the polished UI).

### Big picture (TLDR)

You want two kinds of quality checks:

1. **Numbers** — Is “24% win rate, down 8%” *actually* what the spreadsheets say? That’s like **checking the receipt against the cash drawer**: either it matches or it doesn’t.

2. **Words** — Is the “so what” *useful and believable*? That’s more like **a good editor reviewing a draft**: partly subjective, so you use a **short checklist** (rubric), not a calculator.

The plan says: **don’t lock a single “success metric” yet**—first prove you can **repeat the recipe** (replay numbers) and **review the story** (rubric) using your **real CSV ingredients** and Sam’s interview as context.

### Critical decisions (metaphors)

| Decision | Analogy |
|----------|--------|
| **Hybrid QC** | **Receipt check** for math; **editorial review** for narrative. Same product, two different inspection stations. |
| **Parallel lanes** | **Security + customs** at an airport: both matter, but one slow line shouldn’t block the other. If narratives are weak, you can still learn if numbers are solid (and vice versa). |
| **Fixtures from `data/`** | You’re not only testing with fake plastic food—you’re pulling **real exports** (onboarding, Zoho, shifts) so the test matches reality. |
| **Provenance first** | Every KPI needs a **“show your work”** slip: which file, which date range, which formula, a **photo of a few rows**. That’s how Sam (and you) can **double-check** without blind trust. |
| **Thin validation before full UI** | Build **quality control on the factory floor** (debug view / scripts) before you **paint the showroom** (Nuxt signal cards). Cheaper to fix wrong shapes early. |

### The seven steps (shipping mental model)

Picture a **stage gate** checklist—each step unlocks the next with less rework.

1. **Canonical output contract** — Agree on **the packing list**: what each “signal card,” weekly brief chunk, and “not enough data” message *must* contain. Like **defining the bill of materials** before manufacturing.

2. **Ingest model + column mapping** — Your CSVs speak different dialects; you need a **Rosetta stone** (this column = “lead source,” that one = “shift date”). Also flag **gaps** vs what Sam cares about (e.g. adoption, Zoho messiness).

3. **Golden fixtures** — Pick **one or two reference scenarios** with **expected** KPIs/deltas/badges frozen—like **golden samples** in a lab: “when we run this batch, we always expect X.”

4. **Numeric replay & diff** — Independently **re-run the math** from the same inputs and **diff** against the AI’s answer—like **two people counting the same cash**: if they disagree, something’s wrong.

5. **Narrative rubric** — A **one-page scorecard** for humans: grounded in metrics? Contradictions? Follows weekly-brief rules (e.g. no “you should do X” if the spec says that’s the exec’s job)? Optional second AI opinion = **hint only**, not the boss.

6. **Insufficient-data QC** — When data is missing, the system should **honestly list what’s missing** and **not fake numbers**—like a doctor saying “we can’t diagnose without the blood test” instead of guessing.

7. **Minimal surfaces** — A **bare-bones inspector screen or command-line view** that shows numbers + provenance. Only after that stabilizes do you **dress it up** in the full Vue/Nuxt experience.

### Progress bar (0%)

The **Overall Progress** line in the plan is your **burndown for the checklist**—update it as steps turn done. It’s manual, like updating a **RAG status** in a deck: same idea, different artifact.

### How this maps to “I ship products”

- **Contract + mapping** = **PRD + data dictionary** for the AI outputs.
- **Golden fixtures + replay** = **acceptance criteria + automated regression** for the numeric slice.
- **Rubric** = **UAT script** for the narrative slice.
- **Thin UI first** = **alpha internal tool** before **beta customer UI**—classic risk reduction.

**One sentence for stakeholders:** *We’re proving AI outputs are checkable—numbers by independent replay, stories by a short human rubric—using real customer extracts before we polish the product UI.*
