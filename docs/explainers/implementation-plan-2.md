# Implementation Plan 2 — explainer (PM-friendly)

Audience: non-technical product manager, theoretical shipping knowledge, below junior-dev depth.

Related doc: [`IMPLEMENTATION_PLAN_2.md`](../IMPLEMENTATION_PLAN_2.md)

---

## The plan in plain language

Think of Plan 2 as turning your QC engine from a back-office spreadsheet into a shop-floor control panel.

You already had the engine (CLI checks). Plan 2 builds the screen a user can actually read.

### Metaphor: kitchen + pass station

- Before Plan 2: chefs are cooking in the kitchen, but output is raw prep notes.
- After Plan 2: you now have a pass station where dishes are plated in order so someone can judge quality quickly.

### What each step means

1. **Extract shared runner (`runQcReport`)**  
   One master recipe card for both kitchen and pass station.
   - CLI and UI now use the same logic, so they cannot drift.

2. **Repo-root resolution (`MVD_REPO_ROOT`)**  
   Add reliable GPS so the app always finds ingredients (`data/`, `schemas/`) no matter where it starts.
   - Prevents "works in one terminal, breaks in another" path issues.

3. **Nuxt app scaffold (`apps/qc-ui`)**  
   Build the room where people look at results.
   - Not polished decor yet, but functional and navigable.

4. **QC dashboard page**  
   Convert machine output into sections people can scan:
   - Golden numeric checks
   - Schema checks
   - Insufficient-data checks
   with clear pass/fail states.

5. **Signal card wireframe preview**  
   Simulate the user feeling of reading a signal card without full design polish:
   - KPI name
   - current value
   - one-line summary
   - analysis/synthesis
   - provenance details tucked under `<details>`

6. **Optional validator + docs**  
   Add a "bring your own payload" spot-check lane and clear runbook docs.

### Why this plan is strong

- **Single source of truth**: one QC brain, two interfaces.
- **Low-risk progression**: wireframe first, polish later.
- **User sensation tested early**: validate "does this feel useful?" before heavy UI investment.
- **Trust loop preserved**: provenance remains visible for verification.

### One-line summary for stakeholders

We keep one QC engine, then add a simple Nuxt control panel so teams can quickly read pass/fail and experience a realistic signal-card view before investing in polished UX.
