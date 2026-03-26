# Issue SIG-1.2: User KPI recommendation transparency page

## Metadata
- Type: feature
- Priority: high
- Effort: medium
- Status: backlog
- Labels: `signal-card` `qc-ui` `transparency` `ux`

## TL;DR
Add a QC UI page that shows each user's profile context and the requested vs recommended KPI sets produced by the pipeline so reviewers can validate "why these KPIs for this user".

Reference review: `docs/signal-review-2026-03-27.md`

## Current state
- Requested/recommended KPI selection exists in pipeline artifacts but is not clearly visible in UI.
- UAT reviewers cannot easily verify system understanding per user.
- Review finding: Surge and Sam currently appear nearly identical in deck composition and rationale, reducing trust in personalization.

## Expected outcome
- New UI page displays user context + requested/recommended KPIs for each user.
- Data is sourced from pipeline artifacts (with safe fallback if missing).
- Reviewer can compare Surge vs Sam and understand rationale at a glance.
- Page makes overlap vs differences explicit, so reviewers can see where personalization is real vs shared-org common KPIs.

## Acceptance criteria
- Page renders user profile summary for each user in scope.
- Page renders requested and recommended KPI lists per user from pipeline output.
- Selection rationale is visible and tied to user identity.
- UI highlights:
  - KPIs shared by both users.
  - KPIs unique to each user.
- Reviewer can explain "why this KPI for this user now" from page content without reading code.

## Relevant files
- `out/agent-signals.json` (artifact contract reference)
- `apps/qc-ui/server/api/` (new/extended endpoint for selection data)
- `apps/qc-ui/pages/` (new transparency page)
- `data/onboarding/*-onboarding-derived.json`
- `docs/signal-review-2026-03-27.md`

## Risks / notes
- Must keep labels understandable for non-technical review.
- Need clear empty/error states when artifacts are missing.
