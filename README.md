# Camin MVD

*Can AI produce the data I want?*

Minimum Viable Data — quality-check tooling for AI-produced KPIs and narratives.

## Commands (repo root)

- `npm install` — install dependencies
- `npm run qc` — run golden replay/diff, JSON Schema checks, insufficient-data validation; writes `out/qc-report.json` and `out/qc-report.html`
- `npm run serve:debug` — serve `out/` at http://127.0.0.1:3847/ (run `npm run qc` first)
- `npm run build` — compile TypeScript to `dist/` (required before the QC UI can load shared logic)
- `npm run ci` — same checks as GitHub Actions: build, QC, Nuxt build (run before push)

**Cursor delivery commands** (see [`.cursor/commands/`](.cursor/commands/)): `/commit` — frequent commits; `/pr-ready` — run `npm run ci` before PR; `/release` — release notes and smoke pointers. Concept: [`explainers/save-git-and-prod-explainer.md`](explainers/save-git-and-prod-explainer.md).

## QC UI (Nuxt, Plan 2)

The visual dashboard and wireframe signal preview live in [`apps/qc-ui/`](apps/qc-ui/).

1. Build the shared library: `npm run build` (from repo root).
2. Install UI deps once: `npm install --prefix apps/qc-ui`
3. Start dev: `npm run qc-ui:dev` (builds root then runs Nuxt on port **3050**), or `npm run dev --prefix apps/qc-ui` if you already built.

- **Dashboard:** http://127.0.0.1:3050/ — Run QC, view golden/schema/insufficient sections; optional JSON validate.
- **Signal wireframe:** http://127.0.0.1:3050/preview/signal — reads [`fixtures/samples/signal-card-user-preview.json`](fixtures/samples/signal-card-user-preview.json).

API routes (`/api/qc/run`, `/api/qc/validate`, `/api/preview/signal`) import compiled files from `dist/` under this repo. Set **`MVD_REPO_ROOT`** to an absolute path if auto-detection fails.

See [`IMPLEMENTATION_PLAN_1.md`](IMPLEMENTATION_PLAN_1.md), [`IMPLEMENTATION_PLAN_2.md`](IMPLEMENTATION_PLAN_2.md), and [`docs/DATA_MAPPING.md`](docs/DATA_MAPPING.md).
