# Implementation Plan — Path to Prod: Phase A (harden the repo)

**Overall Progress:** `80%`

Parent roadmap: [`IMPLEMENTATION_PLAN_PATH_TO_PROD.md`](IMPLEMENTATION_PLAN_PATH_TO_PROD.md) (Phase A = harden the repo, **no hosting yet**). CI details: [`RELEASE_SIGNOFF_AND_CI.md`](RELEASE_SIGNOFF_AND_CI.md).

## TLDR

Strengthen **repo hygiene** before any deploy work: protected `main`, **Dependabot** for npm, **onboarding JSON** validated in CI, then **lightweight** tests and **ESLint + Prettier** for maintainability—matching the order in the release doc.

## Critical Decisions

- **Decision 1: Phase A is repo-only** — No hosting, deploy workflows, or secrets in this phase (see Phase B in parent doc).
- **Decision 2: GitHub-side settings for branch protection and Dependabot** — Branch protection is **manual** in GitHub; Dependabot is configured in-repo via [`.github/dependabot.yml`](../../.github/dependabot.yml) (enable in repo settings if required).
- **Decision 3: Onboarding validation reuses existing Ajv setup** — Validate `data/onboarding/*.json` against `onboarding-profile.json` via shared validator pattern (`src/validate/ajv.ts`).
- **Decision 4: Tests start with pure functions** — `src/dates`, `src/qc`, ingest helpers first; no LLM in CI.
- **Decision 5: ESLint + Prettier after or alongside minimal tests** — Same ordering as `RELEASE_SIGNOFF_AND_CI.md`; avoid blocking Phase A on perfect coverage.

## Tasks:

- [ ] 🟥 **Step 1: Branch protection on `main`**
  - [ ] 🟥 In GitHub: require **status checks** to pass (existing CI workflow) before merge to `main`.
  - [ ] 🟥 Optionally require **one approval** for merges (team preference).

- [x] 🟩 **Step 2: Dependabot for npm**
  - [x] 🟩 Add **Dependabot** config for npm (root + `apps/qc-ui`) in `.github/dependabot.yml`.
  - [ ] 🟥 Confirm Dependabot opens PRs against `main` (enable in GitHub **Settings → Code security** if needed).

- [x] 🟩 **Step 3: Onboarding JSON validation in CI**
  - [x] 🟩 Add `src/validate-onboarding.ts` + `npm run validate:onboarding`.
  - [x] 🟩 Wired into `npm run ci` / `.github/workflows/ci.yml`.

- [x] 🟩 **Step 4: Tests for pure functions**
  - [x] 🟩 **Vitest** at repo root (`vitest.config.ts`, `npm run test`).
  - [x] 🟩 Initial tests for `src/dates`, `src/qc` (`*.test.ts`).
  - [x] 🟩 Run tests in CI (`npm run ci`).

- [x] 🟩 **Step 5: ESLint + Prettier baseline**
  - [x] 🟩 ESLint for TypeScript in `src/` (`eslint.config.js`, `npm run lint`).
  - [x] 🟩 Prettier (`.prettierrc`, `npm run format`).
  - [x] 🟩 Lint runs in CI (`npm run ci`). Vue in `apps/qc-ui` not in ESLint scope yet.

## Completion

When all steps above are 🟩, mark **Phase A complete** in [`IMPLEMENTATION_PLAN_PATH_TO_PROD.md`](IMPLEMENTATION_PLAN_PATH_TO_PROD.md) § Progress.
