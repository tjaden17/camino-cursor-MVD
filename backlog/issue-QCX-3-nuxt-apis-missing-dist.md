# Issue QCX-3: Friendly errors when Nuxt QC routes load missing `dist/` modules

## Metadata
- **Type:** improvement (DX / operator clarity)
- **Priority:** normal
- **Effort:** small
- **Status:** backlog

## TL;DR
`/api/qc/run` and `/api/qc/validate` dynamically import compiled files under `dist/`. If `npm run build` was not run at the MVD repo root, `import()` throws and the client sees an unhelpful error.

## Current state
- Dynamic `import()` of `dist/qc/run-report.js` and `dist/validate/ajv.js` has no structured failure path.

## Expected outcome
- `try/catch` around dynamic imports.
- Return JSON (or HTTP 503) with a clear message: e.g. run `npm run build` at the Camino MVD repo root so `dist/` exists.
- Optional: same pattern for any future `dist/` imports from Nitro handlers.

## Relevant files
- `apps/qc-ui/server/api/qc/run.get.ts`
- `apps/qc-ui/server/api/qc/validate.post.ts`

## Risks / notes
- **Low:** Ensure error body matches what `index.vue` / `$fetch` can display (JSON vs thrown FetchError).

## Labels
`qc-ui` · `api` · `dx` · `build`
