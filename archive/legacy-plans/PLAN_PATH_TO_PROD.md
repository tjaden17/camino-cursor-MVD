# Implementation plan — path to production

> **Legacy copy.** The maintained document is [`plans/implementation/IMPLEMENTATION_PLAN_PATH_TO_PROD.md`](../../plans/implementation/IMPLEMENTATION_PLAN_PATH_TO_PROD.md). This file was kept under a duplicate filename for history only.

This document is the **production-readiness roadmap** for Camino MVD: what sits **after** “CI passes on GitHub.” It complements feature work (e.g. `IMPLEMENTATION_PLAN_3.md`) and the **CI / quality bar** details in [`RELEASE_SIGNOFF_AND_CI.md`](RELEASE_SIGNOFF_AND_CI.md). Update this file as decisions are made; avoid duplicating the CI workflow list—link back to the release doc instead.

---

## Purpose

- **CI (continuous integration):** automatically verify that merges are safe to ship (build, QC, no secrets in PR runs).
- **Path to prod:** choose **where** the app runs, **how** approved code gets there, **where** secrets live, and **how** you know it failed—without blocking demo milestones on a full production design on day one.

---

## Current state (baseline)

| Area | Status |
|------|--------|
| PR CI | GitHub Actions: install → TypeScript build → QC → Nuxt build (see `RELEASE_SIGNOFF_AND_CI.md`). |
| LLM in CI | **Not** part of CI (no API keys on every push). |
| Hosting | Not locked. |
| Automated deploy | Not defined. |
| Production secrets | Not in repo; strategy described at a high level in release doc. |

---

## Target state (what “prod ready” means here)

Minimum bar before calling something **production**:

1. **Hosting:** A chosen environment (e.g. static hosting for the preview app, or a small Node host if required) with a **stable URL** and **HTTPS**.
2. **Deploy:** A repeatable way to put **a known commit** live (script or GitHub Action), ideally with **staging** first, then **production**.
3. **Secrets:** API keys (e.g. Anthropic) only in **host or GitHub Environments**, never committed; **weekly** or **manual** pipeline jobs that call LLMs stay **separate** from PR CI.
4. **Rollback:** A documented way to revert to a previous deploy or artifact bundle when something breaks.
5. **Observability (lightweight):** At least **build/deploy failure visibility** (CI + host logs); add **error tracking** when real users depend on uptime.

“Prod” for the **weekly analysis product** may also include: **scheduled** pipeline runs, **artifact** storage, and **data** handling—add those sections when scope is fixed.

---

## What is intentionally out of scope for early milestones

- **Full** observability, multi-region, or compliance programs before there is a customer-facing URL.
- Running **Claude on every PR**—cost, flakiness, and secret exposure argue against it; align with `RELEASE_SIGNOFF_AND_CI.md`.

---

## Recommended workstreams (ordered)

### Phase A — Harden the repo (no hosting yet)

**Detailed task plan:** [`IMPLEMENTATION_PLAN_PATH_TO_PROD_PHASE_A.md`](IMPLEMENTATION_PLAN_PATH_TO_PROD_PHASE_A.md).

1. **Branch protection** on `main`: require CI green before merge; optional review.
2. **Dependabot** for npm (GitHub dependency settings).
3. **Onboarding JSON validation** in CI (`data/onboarding/*.json` vs `onboarding-profile.json`)—see release doc.
4. **Tests** for pure functions (`src/dates`, `src/qc`, ingest helpers) and **ESLint + Prettier** when the team feels pain—same order as release doc.

### Phase B — First deploy path (demo / internal)

1. **Choose host** for `apps/qc-ui` production build output (static export or server—match Nuxt deployment model).
2. **Add a deploy workflow** (e.g. on `main` merge or **manual `workflow_dispatch`**) that builds and uploads artifacts; document the **URL**.
3. **Secrets:** none required if the deployed app only reads **checked-in** or **build-time** fixtures; keep it that way until the pipeline is live.

### Phase C — Pipeline + LLM in a controlled environment

1. Store **`ANTHROPIC_API_KEY`** (or equivalent) in **GitHub Environments** (or the host’s secret store)—not in the repository.
2. **Scheduled** or **manual** workflow for the full agent pipeline: **not** tied to every PR (see release doc).
3. **Artifacts:** define where generated `out/*.json` (or successors) are written for preview—S3, GitHub Artifacts, or deploy bundle—when you need more than a laptop.

### Phase D — Production operations

1. **Monitoring:** errors and “did the weekly job succeed?” (dashboard or email).
2. **Data & access:** if storing real user data, document retention, access, and backups.
3. **Rollback:** document **redeploy previous commit** and/or **restore previous artifact bundle**.

---

## Related documents

| Document | Role |
|----------|------|
| [`RELEASE_SIGNOFF_AND_CI.md`](RELEASE_SIGNOFF_AND_CI.md) | Locked release decisions, what CI runs, gaps, weekly vs PR CI. |
| [`IMPLEMENTATION_PLAN_3.md`](IMPLEMENTATION_PLAN_3.md) | MVD pipeline and preview feature work. |
| [`MVD_ARCHITECTURE_AND_DATA_FLOW.md`](MVD_ARCHITECTURE_AND_DATA_FLOW.md) | Data flow and artifacts. |

---

## Open decisions (fill in as you go)

| Topic | Decision | Date |
|-------|----------|------|
| Hosting provider | TBD | |
| Staging URL | TBD | |
| Production URL | TBD | |
| Deploy trigger (merge vs manual) | TBD | |
| Where pipeline artifacts live in prod | TBD | |

---

## Progress

Track completion of phases A–D in your usual planning tool or by checking boxes here when you adopt this doc.

- [ ] Phase A complete
- [ ] Phase B complete
- [ ] Phase C complete
- [ ] Phase D complete (as applicable)
