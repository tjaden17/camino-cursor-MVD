# Issue QCX-1: Harden `/api/preview/signal` — file read & JSON parse errors

## Metadata
- **Type:** improvement (reliability)
- **Priority:** normal
- **Effort:** small
- **Status:** backlog

## TL;DR
The preview signal API can throw on missing files, corrupt JSON, or I/O errors. Users see opaque 500s. Return clear HTTP errors and safe messages instead.

## Current state
- `readFileSync` / `JSON.parse` in `signal.get.ts` are unchecked.
- A missing `fixtures/samples/signal-card-user-preview.json` or bad `out/processed-signals.json` can crash the handler.

## Expected outcome
- Wrap reads and parses in `try/catch` (or guard with `existsSync` where appropriate).
- Use Nitro `createError` (or equivalent) with `statusCode` 404/500 and a short, non-leaky `statusMessage` for operators.
- Log server-side detail only if a logger exists; avoid exposing stack traces to the client in production builds.

## Relevant files
- `apps/qc-ui/server/api/preview/signal.get.ts`

## Risks / notes
- **Low:** Must not change happy-path payload shape for UAT.
- Keep fixture path contract documented if error messages mention filenames.

## Labels
`qc-ui` · `api` · `error-handling` · `signal-preview`
