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

GitHub Actions workflow `.github/workflows/ci.yml` runs **`npm run ci`** at the repo root:

1. `npm ci` (root + `apps/qc-ui`, separate steps)
2. `npm run validate:onboarding` — Ajv validation of `*-onboarding-derived.json` in `data/onboarding/` and `data/user-onboarding/` (duplicate `user_id` rejected)
3. `npm run pipeline -- --skip-llm` — deterministic pipeline (no Claude); writes `out/*.json` artifacts used by preview
4. `npm run build` — TypeScript compile (`dist/`)
5. `npm run test` — Vitest
6. `npm run lint` — ESLint on `src/`
7. `npm run qc` — golden replay, schema checks, insufficient-data checks → `out/qc-report.*`
8. `npm run build --prefix apps/qc-ui` — Nuxt production build

**Explicitly not in CI:** Real Claude / any external AI (pipeline uses `--skip-llm`; no API keys on PRs).

**Local one-liner:** `npm run ci`

## Gaps vs “prod quality” (honest)

| Gap | Risk | Suggested next step |
|-----|------|---------------------|
| ~~No automated **unit** tests~~ | — | **Vitest** added (`npm run test`); expand coverage over time. |
| **ESLint** for Vue / `apps/qc-ui` | Inconsistent UI code | **optional** — add `eslint-plugin-vue` when the UI grows. |
| ~~No **onboarding JSON validation** in CI~~ | — | **Done:** `npm run validate:onboarding` in `npm run ci`. |
| No **JSON Schemas** for `processed-signals.json` / `agent-signals.json` yet | Preview and pipeline drift | Add schemas + golden fixture (`IMPLEMENTATION_PLAN_3.md` follow-up). |
| **Branch protection** | `main` can receive broken pushes | In GitHub: require CI pass before merge; optional 1 review. |
| **Dependabot** enabled in UI | Stale / vulnerable deps | `.github/dependabot.yml` is present; confirm Dependabot is **on** in repo settings. |
| **Secrets / deploy** | N/A for static CI | When deploying: store `ANTHROPIC_API_KEY` in GitHub **Environments**, not in repo. Weekly job = separate **scheduled workflow** with secrets, not PR CI. |
| Repo may not be **git-initialized** locally | Cannot push | `git init`, remote, first push to GitHub. |

## Recommended order (efficient path)

1. **Now:** Confirm **CI turns green** on `main`. Turn on **branch protection** + confirm **Dependabot** in GitHub settings.
2. **Next:** JSON Schemas for pipeline artifacts; optional ESLint for Vue.
3. **When deploying LLM in prod:** Scheduled **weekly** job (or manual `workflow_dispatch`) with API key — **not** on every PR.

## Weekly product vs CI

- **CI on every push:** fast, deterministic, free of API keys — protects **code quality**.
- **Weekly analysis for users:** product behaviour — implement as **scheduled pipeline** + deployment of artifacts, separate from PR checks.
