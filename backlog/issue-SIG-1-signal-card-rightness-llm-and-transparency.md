# Issue SIG-1: Make signal cards "right" (LLM quality + KPI transparency)

## Metadata
- Type: feature
- Priority: high
- Effort: large
- Status: backlog
- Labels: `signal-card` `llm` `ux` `pipeline` `transparency`

## TL;DR
Improve signal card quality so outputs are useful and trustworthy by (1) wiring and iterating real LLM output in the pipeline, (2) making requested vs recommended KPIs transparent per user, and (3) exposing KPI calculation definitions in UI.

Reference review: `docs/signal-review-2026-03-27.md`

## Current state
- Signal cards are often perceived as wrong/generic, especially narrative quality and relevance.
- LLM prompt iteration loop is not first-class for fast tweak -> rerun -> compare.
- Requested/recommended KPI understanding is not clearly visible to reviewers in UI.
- KPI calculation logic is not clearly presented in one place for PM/UAT review.
- Critical review findings now confirmed:
  - Non-leads KPIs reuse leads value (`53`) and break KPI semantics.
  - Surge and Sam decks are effectively the same despite different onboarding contexts.
  - Recommended rationale, insufficient-data guidance, synthesis, and provenance are too generic for trust.
  - Benchmark sections are mostly illustrative with no cited references.

## Expected outcome
1. **Real LLM loop is operational and testable**
   - Prompt changes can be made quickly and evaluated in preview cards after pipeline reruns.
   - Pipeline clearly indicates whether content is LLM-generated vs fallback/stub.
2. **KPI recommendation transparency**
   - UI page shows per-user profile context and the system's requested vs recommended KPI set.
   - Output from pipeline selection stage is visible and traceable for review.
3. **KPI calculation transparency**
   - UI page lists org-level KPIs (shared org assumption for Sam + Surge).
   - Each KPI displays normalized formula description and actual replay/calculation mapping.

## In scope
- Tighten prompts and narrative wiring for signal-card quality.
- Persist and surface requested/recommended KPI selection output.
- Add two transparency pages in QC UI:
  - User/KPI recommendation context page.
  - KPI calculation dictionary page.

## Out of scope (for this issue)
- Final production-grade visual design.
- Multi-tenant auth/permissions.
- Non-essential backend persistence redesign unless needed to support transparency views.

## Acceptance criteria
- Running pipeline with LLM enabled updates preview card copy in a repeatable way.
- Reviewer can inspect requested vs recommended KPIs by user from UI.
- Reviewer can inspect KPI definitions/formulas and linked calculation source in UI.
- Signal preview shows clear source markers (LLM/fallback) to avoid confusion during UAT.
- Quality gates from review are enforced before UAT sign-off:
  - No KPI card reuses leads count unless KPI is leads-specific.
  - Sam and Surge differ in at least 40% of KPI IDs or card narratives.
  - Every recommended KPI includes a user-specific "why now" tied to a stated user goal.
  - Every insufficient card includes exact missing fields, one example row, and named owner/source.
  - Any benchmark claim includes at least one citation and applicability caveat.

## Relevant files (starting points)
- `src/pipeline/llm.ts`
- `prompts/signal-copy.md`
- `apps/qc-ui/pages/preview/signal.vue`
- `docs/signal-review-2026-03-27.md`

## Risks / notes
- Prompt quality can regress; need a simple comparison loop (before/after snapshots).
- Transparency pages must avoid exposing ambiguous formulas as "final truth" without provenance.
- Shared-org assumption must be explicit when showing KPI definitions across Sam + Surge.
