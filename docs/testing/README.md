# Testing guide (MVD)

This guide supports **building skill in testing** while staying aligned with this repo: quality-check tooling for AI-produced KPIs and narratives, plus a signal preview UI.

**Related docs**

- [Signal preview UAT (manual acceptance)](signal-preview-uat.md) — step-by-step checks for Surge/Sam and AC coverage.
- [Operator runbook](../runbooks/AC1_OPERATOR_RUNBOOK.md) — end-to-end data path before preview.
- [Product decisions / AC source](../decisions/) — e.g. `Instructions to build MVD v1.1 (w AC).txt`.

---

## 1. Software development testing lifecycle (framework)

Use this as a **mental model** for where different test types fit. You do not need every layer on day one; add them as risk and team size grow.

### 1.1 Typical layers (the “test pyramid”)

| Layer | What it is | What it catches | Cost / speed |
|--------|------------|-----------------|--------------|
| **Unit** | Small functions in isolation (pure logic, parsers, math). | Regressions in rules, edge cases. | Fast, cheap. |
| **Integration** | Several units + real boundaries (file I/O, DB, HTTP) without full UI. | Wiring mistakes, schema drift. | Medium. |
| **Contract / API** | Request/response shapes, backward compatibility. | Breaking changes for consumers. | Medium. |
| **End-to-end (E2E)** | Full stack, often browser automation. | User journeys, integration across services. | Slower, more brittle. |
| **Manual / UAT** | Humans follow scripts or explore. | Usefulness, trust, copy, “does this feel right?” | Human time. |

**Shift-left:** push checks earlier (unit + integration in CI) so defects are cheaper to fix.

**What belongs in automation vs humans**

- **Machines are strong at:** structure, determinism, regression (“same inputs → same outputs”), numeric correctness, schema validity.
- **Humans are strong at:** whether analysis is **useful, relevant, believable**, and whether copy matches stakeholder language — especially for LLM outputs.

### 1.2 Lifecycle phases (where testing shows up)

| Phase | Testing focus |
|--------|----------------|
| **Requirements / AC** | Define testable acceptance criteria; map AC → automated checks vs UAT scripts. |
| **Design** | Identify contracts (schemas, APIs); plan what will be golden-file vs unit-tested. |
| **Implementation** | Unit tests for logic; integration tests for pipelines; avoid testing implementation details that change often. |
| **CI (continuous integration)** | On every push/PR: build, lint, unit tests, deterministic integration/QC — **no secrets required** where possible. |
| **Pre-release** | Full `ci` locally or on main; optional staging with real keys for LLM smoke tests. |
| **UAT / exploratory** | Scripted preview checks + free exploration; capture evidence (screenshots, notes). |
| **Production / ops** (later) | Monitoring, alerts, synthetic checks — out of scope for this MVD unless you add them deliberately. |

### 1.3 TDD and this project

**Test-driven development (TDD)** means writing a failing test first, then implementing until it passes. It shines when behaviour is **known and stable**.

For **discovery work** (“can AI produce the data I need?”), it is reasonable to **spike, then lock in** critical behaviour with tests (golden fixtures, schema checks, unit tests for parsers and QC math).

---

## 2. This repository — what to run

CI is defined in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) and runs **`npm run ci`** (deterministic: no API keys, no LLM calls).

### 2.1 Command reference

| Step | Command | What it checks |
|------|---------|----------------|
| Onboarding | `npm run validate:onboarding` | Derived onboarding JSON in `data/onboarding/` and `data/user-onboarding/`. |
| Pipeline (no LLM) | `npm run pipeline -- --skip-llm` | End-to-end pipeline without Claude; writes `out/pipeline-run.json`, `out/processed-signals.json`, etc. |
| Compile | `npm run build` | TypeScript → `dist/`. |
| Unit tests | `npm run test` | Vitest: `src/**/*.test.ts`. |
| Lint | `npm run lint` | ESLint on `src/`. |
| Data QC | `npm run qc` | Golden replay/diff, JSON Schema, insufficient-data rules → `out/qc-report.json`, `out/qc-report.html`. |
| UI build | `npm run build --prefix apps/qc-ui` | Nuxt app builds. |
| **Full CI** | `npm run ci` | All of the above in one sequence. |

### 2.2 Suggested order before opening the browser (UAT)

1. **`npm run ci`** — same bar as GitHub Actions; catches regressions before manual time.
2. If you need a **faster loop** while iterating: **`npm run test`** + **`npm run qc`** + **`npm run build`** (+ Nuxt build if you touched the UI).

Running automation **first** avoids spending UAT time on broken builds or drifted golden fixtures.

### 2.3 LLM / API runs vs CI

- **CI** stays **deterministic** (pipeline with `--skip-llm`).
- **Real agent output** (Claude, etc.) is a separate step: run locally or in a **manual / scheduled** job with keys when you need to judge narrative quality or refresh `out/` artifacts.

---

## 3. UAT (browser) — where to go next

For **acceptance criteria** that require looking at the signal preview (Surge/Sam, cards, insufficient data), follow:

**[Signal preview UAT →](signal-preview-uat.md)**

---

## 4. Growing your testing practice (next iterations)

1. **Keep one command as the default bar** — e.g. `npm run ci` before merge or before demo.
2. **Expand golden/fixture coverage** when you add a new signal shape or KPI — align with `npm run qc`.
3. **Add unit tests** when you fix a bug or encode a rule (dates, thresholds, badge logic).
4. **Keep LLM runs out of default CI** unless you invest in caching, quotas, and flake control.
5. **Maintain a short UAT checklist** tied to AC (onboarding → pipeline → preview → sufficient vs insufficient cards).
6. **Optional later:** E2E tests (e.g. Playwright) for critical UI paths if manual regression becomes painful.

---

## 5. Former location

Content that lived in `docs/testing workflow.md` is now split between this README (lifecycle + automation) and [signal-preview-uat.md](signal-preview-uat.md). Use **`docs/testing/`** as the home for testing documentation going forward.
