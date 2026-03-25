# Implementation Plan

**Overall Progress:** `100%`

## TLDR

Adopt **three delivery habits** with matching **Cursor slash commands**: commit to Git often (lightweight), run **full local CI** before push/PR, and use a **release** checklist for production-quality ships. No change to application code—only `.cursor/commands` (and an optional README pointer). Aligns with existing `npm run ci` and [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Conceptual background: [explainers/save-git-and-prod-explainer.md](../explainers/save-git-and-prod-explainer.md).

## Critical Decisions

- **Decision 1: Three commands, not one** — Keeps frequent commits friction-light (no full CI every commit) while still enforcing CI before shared work and discipline at release.
- **Decision 2: Mirror repo CI in `/pr-ready`** — Uses existing scripts (`npm run build`, `npm run qc`, `npm run build --prefix apps/qc-ui`) so local checks match GitHub Actions.
- **Decision 3: No deploy automation in this plan** — Release command documents semver, notes, smoke, and tag/deploy *steps*; your repo has no prod deploy job yet—add later without blocking these commands.

## Tasks

- [x] 🟩 **Step 1: Add `/commit` command**
  - [x] 🟩 Create [`.cursor/commands/commit.md`](../.cursor/commands/commit.md) (same pattern as [explore.md](../.cursor/commands/explore.md)): `git status`/chunking, conventional commit message, optional quick sanity only—**do not** require full `npm run ci`.

- [x] 🟩 **Step 2: Add `/pr-ready` command**
  - [x] 🟩 Create [`.cursor/commands/pr-ready.md`](../.cursor/commands/pr-ready.md): run `npm run ci` (or equivalent steps from [`package.json`](../package.json)); fix failures; draft PR title/body; flag oversized diffs; remind golden/fixtures if QC outputs change.

- [x] 🟩 **Step 3: Add `/release` command**
  - [x] 🟩 Create [`.cursor/commands/release.md`](../.cursor/commands/release.md): semver suggestion from diff since last tag, release notes draft, smoke checklist (e.g. from [`docs/testing/`](../docs/testing/)), tag/GitHub release outline—no scope beyond documenting your current process.

- [x] 🟩 **Step 4: Optional team pointer**
  - [x] 🟩 One-line note in root [README.md](../README.md) (or [`docs/testing/README.md`](../docs/testing/README.md)) linking `/commit`, `/pr-ready`, `npm run ci`, and the explainer—only if you want discoverability for new contributors.
