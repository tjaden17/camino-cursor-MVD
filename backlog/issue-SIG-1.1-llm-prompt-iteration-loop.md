# Issue SIG-1.1: LLM prompt iteration loop for signal card quality

## Metadata
- Type: feature
- Priority: high
- Effort: medium
- Status: backlog
- Labels: `signal-card` `llm` `prompts` `pipeline`

## TL;DR
Make LLM-based signal card copy easy to improve via fast prompt tweak -> rerun pipeline -> compare output, with clear source labeling to avoid confusion with fallback/stub content.

Reference review: `docs/signal-review-2026-03-27.md`

## Current state
- Signal card copy quality is inconsistent and often feels generic/wrong.
- Prompt tuning workflow is not explicit for repeatable testing.
- It is hard to quickly tell when preview content is LLM-generated vs fallback.
- Narrative call currently receives limited user context (mainly display name + leads sample), so output often lacks role/goal/pain-point specificity.
- Synthesis content is often template-like (generic good/bad, expected/unexpected, root-cause phrasing).

## Expected outcome
- PM/dev can tweak prompt files, rerun pipeline with LLM, and immediately validate card quality in preview.
- Output includes clear indicators of generation source.
- Regression risk is reduced with a repeatable review loop.
- Narrative generation receives structured user context (role, goals, pain points, trust constraints, requested/recommended preferences).
- Generated copy explicitly answers "why this matters now" for that user.

## Acceptance criteria
- Prompt edits in `prompts/` flow through to `out/processed-signals.json` when LLM is enabled.
- Preview UI shows source context clearly (LLM vs fallback/stub).
- A simple test loop is documented for "before vs after" comparison.
- LLM narrative input includes onboarding context from `profile.raw` (not just name/leads).
- Per card, output includes KPI-specific wording and unit/formula-consistent claims (no leads-value reuse for non-leads KPIs).
- Recommended cards include user-specific rationale tied to user goals.
- Benchmark text is either omitted or includes at least one citation with applicability caveat.

## Relevant files
- `src/pipeline/llm.ts`
- `prompts/signal-copy.md`
- `apps/qc-ui/pages/preview/signal.vue`
- `data/onboarding/*-onboarding-derived.json`
- `docs/signal-review-2026-03-27.md`

## Risks / notes
- Prompt changes can improve one KPI and degrade another; require lightweight side-by-side checks.
- Must avoid implying LLM text is validated fact when provenance does not support it.
