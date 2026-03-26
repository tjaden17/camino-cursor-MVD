# Issue QCX-4: Align signal preview types between server and client

## Metadata
- **Type:** improvement (maintainability)
- **Priority:** low
- **Effort:** medium
- **Status:** backlog

## TL;DR
`signal.vue` defines rich `Payload` / `Overview` interfaces while `signal.get.ts` uses `Record<string, unknown>` for nested objects. Types can drift and hide contract breaks.

## Current state
- Duplicated / mismatched typing between page and API.
- No single import shared across Nuxt server and Vue SFC.

## Expected outcome
- Extract shared types (or Zod/io-ts schema) in a small module under `apps/qc-ui/` (e.g. `types/signal-preview.ts`) imported by both the handler and the page.
- Optionally narrow `Record<string, unknown>` to the JSON-schema-aligned shapes from `schemas/` or `src/types/contracts.ts` when stable.

## Relevant files
- `apps/qc-ui/pages/preview/signal.vue`
- `apps/qc-ui/server/api/preview/signal.get.ts`
- `src/types/contracts.ts` (reference)

## Risks / notes
- **Low:** Refactor-only; run UAT smoke on `/preview/signal` after changes.

## Labels
`qc-ui` · `typescript` · `maintainability` · `signal-preview`
