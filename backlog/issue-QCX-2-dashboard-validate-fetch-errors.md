# Issue QCX-2: Catch `$fetch` failures on QC dashboard “Validate JSON”

## Metadata
- **Type:** bug (UX / unhandled rejection)
- **Priority:** normal
- **Effort:** small
- **Status:** backlog

## TL;DR
`runValidate` in the QC home page calls `$fetch` without `try/catch`. Network or server errors can cause unhandled promise rejections and no feedback in `validateResult`.

## Current state
- JSON parse errors are handled; API failures are not.
- User may see nothing or a console error when `/api/qc/validate` fails.

## Expected outcome
- Wrap `$fetch` in `try/catch`.
- On failure, set `validateResult` to `{ ok: false, errors: [<human-readable message>] }` (e.g. “Request failed” + optional status if available).

## Relevant files
- `apps/qc-ui/pages/index.vue`

## Risks / notes
- **None** for local dev; aligns with future error UX if the app is exposed beyond localhost.

## Labels
`qc-ui` · `vue` · `error-handling` · `dashboard`
