# Release sign-off (CTO review) + CI / prod-quality roadmap

## Decisions (locked for implementation)

| Topic | Decision |
|--------|-----------|
| Timeline | **Soft** — scope can flex; demo quality over calendar panic. |
| Demo fallback | **Checked-in `out/` bundle acceptable** — commit known-good JSON so preview works without running the full pipeline or APIs. |
| Live product cadence | **Weekly runs** are the expected real-world pattern — users see an **updated weekly analysis** once the product is live. |
| Demo / MVD quality bar | **Semantically same** outputs are acceptable for now (stable structure and copy quality; not byte-identical LLM text every run). |
| LLM steps | **Split** (separate calls / prompts per concern) for debuggability and tuning. |
| CI | **Yes** — push to automated checks; move toward **prod-quality** habits. |

## What CI runs today

GitHub Actions workflow `.github/workflows/ci.yml`:

1. `npm ci` (root + `apps/qc-ui`)
2. `npm run build` — TypeScript compile (`dist/`)
3. `npm run qc` — golden replay, schema checks, insufficient-data checks → `out/qc-report.*`
4. `npm run build --prefix apps/qc-ui` — Nuxt production build

**Explicitly not in CI:** Claude / any external AI (no secrets required on every PR).

**Local one-liner (same as CI core):** `npm run ci`

## Gaps vs “prod quality” (honest)

| Gap | Risk | Suggested next step |
|-----|------|---------------------|
| No automated **unit / integration tests** | Regressions slip in | Add **Vitest** (or Node test runner), start with `src/dates`, `src/qc`, ingest helpers. |
| No **ESLint** / **Prettier** | Inconsistent style, easy mistakes | Add ESLint for TS + Vue; Prettier; optional **lint-staged** on commit. |
| No **onboarding JSON validation** in CI | Invalid profiles only caught manually | Small script: validate `data/onboarding/*.json` against `onboarding-profile.json` (reuse Ajv). |
| No **JSON Schemas** for `processed-signals.json` / `agent-signals.json` yet | Preview and pipeline drift | Add schemas + golden fixture when pipeline lands (Plan 3 Step 6). |
| **Branch protection** not described | `main` can receive broken pushes | In GitHub: require CI pass before merge; optional 1 review. |
| **Dependabot** | Stale / vulnerable deps | Enable Dependabot for npm (GitHub → Insights → Dependency graph → Dependabot). |
| **Secrets / deploy** | N/A for static CI | When deploying: store `ANTHROPIC_API_KEY` in GitHub **Environments**, not in repo. Weekly job = separate **scheduled workflow** with secrets, not PR CI. |
| Repo may not be **git-initialized** locally | Cannot push | `git init`, remote, first push to GitHub. |

## Recommended order (efficient path)

1. **This week:** Ensure repo on GitHub; confirm **CI turns green** on `main`. Turn on **branch protection** + Dependabot.
2. **Next:** Onboarding validation script + wire into `npm run ci`.
3. **Parallel to pipeline work:** Vitest for pure functions; ESLint + Prettier baseline.
4. **When LLM pipeline exists:** Scheduled **weekly** job (or manual `workflow_dispatch`) with API key — **not** on every PR.

## Weekly product vs CI

- **CI on every push:** fast, deterministic, free of API keys — protects **code quality**.
- **Weekly analysis for users:** product behaviour — implement as **scheduled pipeline** + deployment of artifacts, separate from PR checks.
