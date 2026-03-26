# Implementation Plan — Path to Prod: Phase A (harden the repo)

**Overall Progress:** `85%`

Parent roadmap: [`IMPLEMENTATION_PLAN_PATH_TO_PROD.md`](IMPLEMENTATION_PLAN_PATH_TO_PROD.md) (Phase A = harden the repo, **no hosting yet**). CI details: [`RELEASE_SIGNOFF_AND_CI.md`](RELEASE_SIGNOFF_AND_CI.md).

## TLDR

Strengthen **repo hygiene** before any deploy work: GitHub branch protection (manual), **Dependabot** for npm, **onboarding JSON validation** available via local `npm run ci`, then **lightweight** tests and **ESLint + Prettier** baseline for maintainability—matching the order in the release doc.

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
  - [ ] 🟥 Wait for the first scheduled Dependabot PRs (this repo config runs monthly per `.github/dependabot.yml`; the first PR may take some time).

- [x] 🟩 **Step 3: Onboarding JSON validation in CI**
  - [x] 🟩 Add `src/validate-onboarding.ts` + `npm run validate:onboarding`.
  - [x] 🟩 Wired into CI by having GitHub Actions run `npm run ci` (local `npm run ci` quality bar now includes onboarding validation).

- [x] 🟩 **Step 4: Tests for pure functions**
  - [x] 🟩 **Vitest** at repo root (`vitest.config.ts`, `npm run test`).
  - [x] 🟩 Initial tests for `src/dates`, `src/qc` (`*.test.ts`).
  - [x] 🟩 Wired into CI (via `npm run ci`, which now runs `npm run test`).

- [x] 🟩 **Step 5: ESLint + Prettier baseline**
  - [x] 🟩 Add ESLint baseline config (`eslint.config.js`) for TypeScript in `src/` (tooling baseline).
  - [x] 🟩 Add Prettier config (`.prettierrc`) (formatting baseline).
  - [x] 🟩 Added `npm run lint` and kept formatting as an optional local baseline. CI enforces `eslint` (but does not fail PRs on full-repo Prettier diffs yet).

## Completion

When the repo has: (1) branch protection enabled on GitHub, (2) the GitHub Actions workflow enforces the same quality bar as local `npm run ci` (including onboarding validation and unit tests), and (3) lint/format enforcement policy is decided, mark **Phase A complete** in [`IMPLEMENTATION_PLAN_PATH_TO_PROD.md`](IMPLEMENTATION_PLAN_PATH_TO_PROD.md) § Progress.
