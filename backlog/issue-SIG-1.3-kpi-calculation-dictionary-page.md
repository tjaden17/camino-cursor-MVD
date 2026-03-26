# Issue SIG-1.3: KPI calculation dictionary page (org-level)

## Metadata
- Type: feature
- Priority: high
- Effort: large
- Status: backlog
- Labels: `kpi` `qc-ui` `transparency` `pipeline`

## TL;DR
Add a QC UI page that explains org-level KPIs, normalized formula definitions, and the actual replay/calculation mapping so PM/UAT can verify how each KPI is computed.

Reference review: `docs/signal-review-2026-03-27.md`

## Current state
- KPI calculations are spread across code and provenance, not shown clearly in one reviewer-facing place.
- UAT feedback indicates confusion and low trust in displayed KPI values.
- Review finding: non-leads KPIs can appear with leads-derived values, and provenance semantics do not always match KPI intent.

## Expected outcome
- New page lists KPIs for the shared org context (Sam + Surge).
- Each KPI includes: business label, normalized formula summary, and current calculation mapping/source.
- Reviewer can understand "what this KPI means" and "how we calculate it" without reading code.
- Page clearly separates `replayed`, `proxy`, and `illustrative` KPI statuses.

## Acceptance criteria
- Page renders KPI catalog with normalized formula descriptions.
- Page links each KPI to its replay/calculation source and provenance-friendly notes.
- Terminology is clear enough for PM/UAT review and avoids ambiguous technical jargon.
- For each KPI, page shows:
  - expected unit/type (%, $, count, days),
  - rule id and source dataset,
  - whether current signal value is formula-faithful or illustrative.
- Reviewers can trace any KPI card to its dictionary entry and verify semantic fit.

## Relevant files
- `src/kpi/rules.ts`
- `src/types/contracts.ts`
- `apps/qc-ui/pages/` (new KPI dictionary page)
- `apps/qc-ui/server/api/preview/signal.get.ts`
- `docs/signal-review-2026-03-27.md`

## Risks / notes
- Some KPIs may still be illustrative; page must explicitly mark provisional formulas.
- Shared-org assumption should be stated in UI copy to prevent interpretation errors.
