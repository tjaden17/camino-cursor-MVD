# Repository layout (product + engineering)

This repo separates **executable code**, **data**, **contracts**, and **planning / documentation**.

| Area | Location | Notes |
|------|----------|--------|
| TypeScript CLI, pipeline, QC | `src/` | Built to `dist/`; QC UI imports from there. |
| QC dashboard (Nuxt) | `apps/qc-ui/` | Local preview and validation UI. |
| Sample / real inputs | `data/` | CSV extracts, onboarding JSON, optional `user-onboarding/` drops. |
| JSON fixtures & golden replay | `fixtures/` | QC regression inputs. |
| JSON Schemas | `schemas/` | Contracts for artifacts and onboarding. |
| LLM / stage instructions | `prompts/` | Versioned text loaded by the pipeline. |
| **Plans (execution + backlog)** | `plans/` | [`plans/README.md`](../plans/README.md) — sync rules; detailed plans in [`plans/implementation/`](../plans/implementation/); product view in [`plans/backlog/PRODUCT_BACKLOG.md`](../plans/backlog/PRODUCT_BACKLOG.md). |
| **Documentation** | `docs/` | Architecture (`docs/architecture/`), runbooks (`docs/runbooks/`), **testing** (`docs/testing/` — lifecycle + UAT), gap analysis (`docs/gapanalysis/`), explainers (`docs/explainers/`), product decisions (`docs/decisions/`), mapping and notes at `docs/` root. |
| Legacy duplicate plan name | `archive/legacy-plans/` | Prefer the numbered plan under `plans/implementation/`. |
| Bookmarks | `implementation plans/README.md` | Stub only — content moved to `plans/`. |

Pipeline output (`out/`) is generated; not committed as source of truth for planning.
