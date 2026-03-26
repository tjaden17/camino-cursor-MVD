# Tech Coach Learnings - 26 Mar 2026

This is a short, focused note capturing what we learned today from the operator/UAT experience and our delivery process.

## How today relates to the overall goal

The product goal is: trustworthy, operator-ready KPI signal cards.

Today’s learnings strengthen that by improving:

- reliability of what the operator sees (so UAT findings are valid, not “stale build” artifacts)
- discipline around save/commit/build (so we can iterate without breaking the preview screen)
- a path to improve narrative quality via retrieval (without changing deterministic KPI math)

## A) Versioning/build misstep blocked screen interaction

**What happened (observed issue):** the preview screen controls became unresponsive; you could not reliably interact/navigate.

**What we learned:** if the browser is serving a build that does not match the code state we are editing, the operator experience can look “broken” for reasons unrelated to the feature we are trying to validate.

**Why it matters:** it undermines trust in our UAT evidence. We might otherwise think “the UI is wrong” when the real issue is “the UI build is stale or mismatched.”

## B) Process improvements for saving/versioning/git (so this does not repeat)

**What we will do differently going forward (habit):**

- Save often while editing, but treat it as local safety, not as versioning.
- Commit to Git in small, meaningful chunks so we can reproduce “what changed” quickly.
- Before interactive preview/UAT: run the repo root build, then start the QC UI, so the served UI matches the latest compiled logic.
- If the screen behaves oddly: restart the dev server and re-run the minimal pipeline/QC commands rather than guessing which layer is stale.

**Coach mindset:** make "what the operator sees" a versioned artifact, not an accidental side-effect.

## C) Lite RAG spike: how it could apply here

**What RAG is (in plain terms):** retrieval-augmented generation means we pull the most relevant background from a knowledge source first, then use that retrieved context to generate the final text.

**Where RAG fits in this KPI-signal context:**

- selection and rationale text: help the model stay consistent with KPI definitions and with the requested vs recommended set (reduces generic copy)
- insufficient-data guidance: fetch KPI-specific examples of what is missing and how it would look when available (keeps it friendly and relevant)
- provenance explanation: retrieve the relevant replay rule + formula description + sample-row summary, so narrative references the right "receipts"

**Important constraint:** RAG should not replace deterministic numeric truth. Replay/QC stays the source of numbers; RAG is used to improve wording and contextual guidance that is allowed to vary.

## Next small steps

- Turn today’s “versioning/build mismatch breaks UAT” into a lightweight checklist item before interactive preview tests.
- If you share a couple bullets from your actual RAG spike notes, I can tighten the doc to match what you tried (data source, retrieval approach, and results).

