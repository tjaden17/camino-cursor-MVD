# Implementation Plan — QC UI hardening (QCX-1 … QCX-4)

**Overall Progress:** `100%`

**Backlog items included:** [QCX-1](../../backlog/issue-QCX-1-preview-signal-api-errors.md) · [QCX-2](../../backlog/issue-QCX-2-dashboard-validate-fetch-errors.md) · [QCX-3](../../backlog/issue-QCX-3-nuxt-apis-missing-dist.md) · [QCX-4](../../backlog/issue-QCX-4-shared-signal-payload-types.md)

Parent context: code review of `apps/qc-ui` (local operator tooling; not public production traffic).

---

## TL;DR

Improve **reliability and clarity** of the Nuxt QC app: catch client `$fetch` failures, return **actionable messages** when compiled `dist/` is missing, harden the **signal preview** API against bad/missing files and JSON, then **share TypeScript types** between the preview page and server so contracts don’t drift.

---

## Critical decisions

1. **Execution order** — Do **QCX-2** and **QCX-3** first (small, independent, immediate UX/DX wins), then **QCX-1** (preview API), then **QCX-4** (refactor; touches the same surface as QCX-1).
2. **Error shape** — Prefer **consistent JSON** where the UI already expects `{ ok, errors[] }` (validate flow). For Nitro `createError`, use **short** `statusMessage` text suitable for operators; avoid leaking stack traces to the client.
3. **QCX-4 scope** — **Types only** (and imports); no runtime validation library required unless you later choose Zod/io-ts. Align names with existing JSON shapes / `schemas/` as a reference, not a full schema migration.

---

## Tasks

- [x] 🟩 **Step 1 — QCX-2: Validate JSON — catch `$fetch` failures** ([`apps/qc-ui/pages/index.vue`](../../apps/qc-ui/pages/index.vue))
  - [x] 🟩 Wrap the `$fetch` to `/api/qc/validate` in `runValidate` with `try/catch`.
  - [x] 🟩 On failure, set `validateResult` to `{ ok: false, errors: [human-readable message] }` (include status code in the message if available from the error object).

- [x] 🟩 **Step 2 — QCX-3: QC APIs — missing `dist/` modules** ([`run.get.ts`](../../apps/qc-ui/server/api/qc/run.get.ts), [`validate.post.ts`](../../apps/qc-ui/server/api/qc/validate.post.ts))
  - [x] 🟩 `try/catch` around dynamic `import()` of `dist/qc/run-report.js` and `dist/validate/ajv.js`.
  - [x] 🟩 On failure, return a **503** (or structured JSON with `ok: false` where the route already returns that shape) and a message that says to run **`npm run build`** at the **Camin-MVD repo root** so `dist/` exists.
  - [x] 🟩 Confirm the dashboard still shows something useful when `run.get` fails (e.g. `useFetch` error path or response body).

- [x] 🟩 **Step 3 — QCX-1: Preview signal API — fs / JSON resilience** ([`signal.get.ts`](../../apps/qc-ui/server/api/preview/signal.get.ts))
  - [x] 🟩 Guard or `try/catch` each `readFileSync` + `JSON.parse` path (`out/processed-signals.json`, stub users file, single-card fallback fixture).
  - [x] 🟩 Use Nitro **`createError`** (or equivalent) with appropriate **404/500** and a concise message when data is missing or JSON is invalid.
  - [x] 🟩 **Do not** change the **happy-path** JSON payload shape used by `/preview/signal` UAT.

- [x] 🟩 **Step 4 — QCX-4: Shared preview payload types** ([`signal.vue`](../../apps/qc-ui/pages/preview/signal.vue), [`signal.get.ts`](../../apps/qc-ui/server/api/preview/signal.get.ts))
  - [x] 🟩 Add a small module under `apps/qc-ui/` (e.g. `types/signal-preview.ts`) with shared interfaces for the preview API response.
  - [x] 🟩 Import those types in the page and handler; narrow `Record<string, unknown>` where it improves safety without a large rewrite.
  - [x] 🟩 Optional: cross-check field names against [`src/types/contracts.ts`](../../src/types/contracts.ts) / `schemas/` for alignment notes in comments only if helpful.

---

## Verification (manual)

After implementation:

1. From repo root: `npm run build` then `npm run qc-ui:dev` (or `npm run dev --prefix apps/qc-ui` after root build if your workflow requires it).
2. **Dashboard** (`/`): Run QC; use Validate JSON with valid and invalid payloads; confirm failed network (optional: stop server briefly) shows an **inline** error, not a silent failure.
3. **Missing `dist/`** (optional): Temporarily rename `dist/` and hit `/api/qc/run` / validate — message should mention building the repo.
4. **Signal preview** (`/preview/signal`): Normal path unchanged; with a **corrupt** `out/processed-signals.json` (backup first), expect a **controlled** error instead of an opaque 500.
5. `npm run build --prefix apps/qc-ui` succeeds.

---

## Completion

Delivered **2026-03-26**. QCX-1…QCX-4 recorded in **Shipped** in [`PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md).
