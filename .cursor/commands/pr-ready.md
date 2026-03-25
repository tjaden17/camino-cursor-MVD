# pr-ready

# Branch ready to push / open PR

Your task is to ensure the branch matches **what CI runs on GitHub** and is ready for a pull request.

## Local CI (mirror of GitHub Actions)

From the **repo root**, after dependencies are installed:

1. If lockfiles changed recently, run: `npm ci` and `npm ci --prefix apps/qc-ui` (same as CI).
2. Run: **`npm run ci`** — this runs `npm run build`, `npm run qc`, and `npm run build --prefix apps/qc-ui` (see root `package.json` and `.github/workflows/ci.yml`).

If anything fails: **fix failures** or explain what blocks merge; do not suggest skipping checks.

## PR hygiene

- Draft a **PR title** and short **description** (what / why / risk / how to verify).
- If the diff is **too large** for one review, suggest splitting into follow-up PRs.
- If QC outputs or golden fixtures are part of the change, **remind** to update committed fixtures/golden under `fixtures/` when `npm run qc` expectations change.

## Do not

- Do not add steps beyond current CI (e.g. extra test scripts) unless the user asks or CI is updated—stay aligned with `npm run ci`.

This command will be available in chat with /pr-ready
