# Implementation plans & product backlog

**One understanding, two views.** These must **stay in sync**—if one changes, update the other in the same change set (same PR or immediately after).


| View                     | Location                                                   | Role                                                                                                                        |
| ------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Implementation plans** | `[implementation/](implementation/)` (`*.md`)              | **Default source of truth** for what we **execute**: tasks, progress %, done/not done, technical scope.                     |
| **Product backlog**      | `[backlog/PRODUCT_BACKLOG.md](backlog/PRODUCT_BACKLOG.md)` | **Product** view: priorities, Kanban, **what shipped** from which plan, items **waiting to be batched** into a future plan. |


---

## Sync rules (required)

1. **Ship / close a milestone** in an implementation plan → **Update the backlog the same time**: move rows to **Shipped**, or out of **Backlog** / columns, and record **which plan** delivered them (`Plan:` column or footnote).
2. **Add or change backlog items** (new idea, reprioritisation) → If the item is **in scope** for an active plan, **add a pointer** in that plan (Tasks or Critical Decisions). If **not** in scope, keep it only in the backlog until you **batch** it into a named plan.
3. **Start a new implementation plan** → **Pull** backlog IDs into the new plan (list them under Tasks or “Backlog items included”). In the backlog, add a **Target plan** column or row note so nothing is ambiguous.
4. **Do not** mark a backlog item as shipped without a **implementation plan** (or release note) that states what was delivered. The plan is the proof of execution.

---

## Plan index (maintain this table)


| Document                                                                                                                   | Purpose                                                       | Notes                                                                    |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `[implementation/IMPLEMENTATION_PLAN_1.md](implementation/IMPLEMENTATION_PLAN_1.md)`                                       | Contracts, ingest, golden replay, QC CLI, rubric              | **Shipped** (see backlog); ~93%; Step 7 Nuxt alignment deferred → Plan 2 |
| `[implementation/IMPLEMENTATION_PLAN_2.md](implementation/IMPLEMENTATION_PLAN_2.md)`                                       | Nuxt qc-ui, dashboard, wireframe signal preview               | **Shipped** (see backlog); 100%                                          |
| `[implementation/IMPLEMENTATION_PLAN_3.md](implementation/IMPLEMENTATION_PLAN_3.md)`                                       | MVD pipeline, artifacts, preview, CI stub path                | Core MVD delivery                                                        |
| `[implementation/IMPLEMENTATION_PLAN_GAP_CLOSE_25_MAR.md](implementation/IMPLEMENTATION_PLAN_GAP_CLOSE_25_MAR.md)`         | Close 25 Mar AC gaps (UI, model, carousel, E13, AC1)          | Active gap work                                                          |
| `[implementation/IMPLEMENTATION_PLAN_PATH_TO_PROD.md](implementation/IMPLEMENTATION_PLAN_PATH_TO_PROD.md)`                 | Hosting, deploy, phases A–D                                   | Roadmap                                                                  |
| `[implementation/IMPLEMENTATION_PLAN_PATH_TO_PROD_PHASE_A.md](implementation/IMPLEMENTATION_PLAN_PATH_TO_PROD_PHASE_A.md)` | Phase A: branch protection, Dependabot, validate, tests, lint | Sub-plan of path-to-prod                                                 |
| `[implementation/IMPLEMENTATION_PLAN_QCX_UI_HARDENING.md](implementation/IMPLEMENTATION_PLAN_QCX_UI_HARDENING.md)` | QC UI: QCX-1…4 error handling + shared signal preview types | Backlog: QCX-1–QCX-4                                                     |
| `[../docs/architecture/MVD_ARCHITECTURE_AND_DATA_FLOW.md](../docs/architecture/MVD_ARCHITECTURE_AND_DATA_FLOW.md)`         | Architecture reference                                        | Not a delivery plan; link from plans                                     |
| `[implementation/RELEASE_SIGNOFF_AND_CI.md](implementation/RELEASE_SIGNOFF_AND_CI.md)`                                     | CI / release decisions                                        | Locked constraints                                                       |


Legacy / duplicate naming: `archive/legacy-plans/PLAN_PATH_TO_PROD.md` — prefer `[implementation/IMPLEMENTATION_PLAN_PATH_TO_PROD.md](implementation/IMPLEMENTATION_PLAN_PATH_TO_PROD.md)`.

---

## Batching backlog → new plan

1. Select backlog IDs (e.g. `DB-1`, `REL-1`).
2. Create `**IMPLEMENTATION_PLAN_<name>.md`** (or extend an existing plan) with those IDs in scope.
3. In `[PRODUCT_BACKLOG.md](backlog/PRODUCT_BACKLOG.md)`, set **Target plan** for those rows and move them out of generic Backlog when work starts.

---

## Related

- Product backlog: `[backlog/PRODUCT_BACKLOG.md](backlog/PRODUCT_BACKLOG.md)`
- Gap analysis: `[../docs/gapanalysis/GAP_ANALYSIS_25_MAR.md](../docs/gapanalysis/GAP_ANALYSIS_25_MAR.md)`

