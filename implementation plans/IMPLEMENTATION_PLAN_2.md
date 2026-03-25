# Implementation Plan 2

**Overall Progress:** `100%`

## TLDR

Add a **local Nuxt 3 app** so you can **see** QC results and **read AI signal content** like an end user would—without polished marketing UI. Phase 1 ([`IMPLEMENTATION_PLAN_1.md`](IMPLEMENTATION_PLAN_1.md)) already ships CLI replay, schemas, golden fixtures, and `out/qc-report.*`. Plan 2 delivers: **shared `runQcReport()`**, **repo-root resolution** for Nitro, a **QC dashboard** (pass/fail, sections), and a **wireframe signal card page** (KPI title, value, change, one-line summary, expanded synthesis + provenance in `<details>`).

## Critical Decisions

- **Nuxt for the visual layer** — Matches your MVD stack direction; Nitro exposes `/api/qc/*` without a separate backend repo.
- **One brain, two surfaces** — Report building lives in [`src/qc/run-report.ts`](src/qc/run-report.ts); CLI and Nuxt call the same logic.
- **`MVD_REPO_ROOT` / `getRepoRoot()`** — [`src/repo-root.ts`](src/repo-root.ts) walks up to `package.json` `name: camin-mvd` so CSV/schema paths resolve when cwd differs.
- **Nuxt loads compiled `dist/`** — Server routes use `pathToFileURL` + dynamic `import()` of `dist/qc/run-report.js` (run `npm run build` at repo root before QC UI).
- **Wireframe signal preview** — Composite fixture [`fixtures/samples/signal-card-user-preview.json`](fixtures/samples/signal-card-user-preview.json); page [`apps/qc-ui/pages/preview/signal.vue`](apps/qc-ui/pages/preview/signal.vue).

## Tasks

- [x] 🟩 **Step 1: Extract shared QC report runner**

  - [x] 🟩 Move report assembly into [`src/qc/run-report.ts`](src/qc/run-report.ts) exporting `runQcReport()` and `buildReportHtml()`.
  - [x] 🟩 Slim [`src/cli.ts`](src/cli.ts) to call `runQcReport()` and write `out/*`.

- [x] 🟩 **Step 2: Repo root resolution**

  - [x] 🟩 [`src/repo-root.ts`](src/repo-root.ts) with `getRepoRoot()` + `MVD_REPO_ROOT` override; used by [`src/kpi/rules.ts`](src/kpi/rules.ts) and [`src/validate/ajv.ts`](src/validate/ajv.ts).

- [x] 🟩 **Step 3: Scaffold Nuxt app**

  - [x] 🟩 [`apps/qc-ui/`](apps/qc-ui/) Nuxt 3 + [`nuxt.config.ts`](apps/qc-ui/nuxt.config.ts) (`runtimeConfig.mvdRepoRoot`).
  - [x] 🟩 Server routes import parent `dist/*.js` after root `tsc` build.

- [x] 🟩 **Step 4: QC dashboard API + page**

  - [x] 🟩 [`apps/qc-ui/server/api/qc/run.get.ts`](apps/qc-ui/server/api/qc/run.get.ts)
  - [x] 🟩 [`apps/qc-ui/pages/index.vue`](apps/qc-ui/pages/index.vue)

- [x] 🟩 **Step 5: Wireframe signal card preview**

  - [x] 🟩 [`fixtures/samples/signal-card-user-preview.json`](fixtures/samples/signal-card-user-preview.json)
  - [x] 🟩 [`apps/qc-ui/pages/preview/signal.vue`](apps/qc-ui/pages/preview/signal.vue) + [`server/api/preview/signal.get.ts`](apps/qc-ui/server/api/preview/signal.get.ts)

- [x] 🟩 **Step 6: Optional validate API + docs**

  - [x] 🟩 [`apps/qc-ui/server/api/qc/validate.post.ts`](apps/qc-ui/server/api/qc/validate.post.ts) + validate section on index page.
  - [x] 🟩 [`README.md`](README.md) (`qc-ui:dev`, `MVD_REPO_ROOT`).

---

**Progress note:** Plan 2 complete. Production QC UI server: `npm run build && cd apps/qc-ui && node .output/server/index.mjs` (after `nuxt build`).
