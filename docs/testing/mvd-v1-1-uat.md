# UAT Plan: MVD v1.1

Purpose: give product owners and reviewers a **manual** checklist to validate that the MVD v1.1 experience matches the unified acceptance criteria in `plans/implementation/IMPLEMENTATION_PLAN_MVD_V1_1.md`.

**Artefact map (paths, owners):** [`docs/implementation/MVD_V1_1_ARTIFACTS.md`](../implementation/MVD_V1_1_ARTIFACTS.md)

## Release bar vs this document

Per **Decision 14** in the implementation plan, **v1.1 “done”** is satisfied by **automated** verification (`npm run qc`, `npm run review:gates`, `npm run review:v11`, KPI/onboarding validation, CI). This UAT is **optional** for release: it helps you **feel** the product and catch UX/copy gaps; it is **not** a required gate unless product policy changes.

## Quick links (local QC UI, port 3050)

| What | URL |
|------|-----|
| Signal preview (primary user UX — representative deck) | `http://127.0.0.1:3050/preview/signal` |
| User KPI transparency (requested/recommended, persona context) | `http://127.0.0.1:3050/transparency/recommendations` |
| **Org context + full 12 KPIs + 6 decisions** (secondary validation) | `http://127.0.0.1:3050/transparency/org-context` |
| KPI calculation dictionary | `http://127.0.0.1:3050/transparency/kpi-dictionary` |

**Operator path (generate `out/` before UI):** [`docs/runbooks/AC1_OPERATOR_RUNBOOK.md`](../runbooks/AC1_OPERATOR_RUNBOOK.md)

## Preconditions

From repo root (typical demo / UAT prep):

```bash
npm install
npm run validate:onboarding
npm run validate:kpi-spec
npm run pipeline -- --skip-llm
npm run build
npm run qc-ui:dev
```

Optional sanity (matches CI-style bar):

```bash
npm run review:gates
npm run review:v11
npm run qc
```

---

## Unified AC coverage (manual UAT map)

| AC area (plan §) | Covered by tests below |
|------------------|-------------------------|
| A — Product intent / defensible data | M-10, M-11 |
| B — Onboarding & org (CSV, org file, two personas) | M-1, M-2, M-5 |
| C — Data ingestion (Zoho/custom) | M-3 |
| D — Pipeline, KPI spec, strategy 12+6 | M-4, M-6 |
| E — Signal preview UI | M-7 (+ linked docs) |
| F — Calcs, gaps, verification | M-8, M-10 |
| G — Signal analysis, copy, provenance | M-9, M-11 |
| H — User/org visibility | M-5, M-6 |
| I — DoD (docs, phases) | M-12 |

---

## Test cases

### M-1: Onboarding CSV → standardised JSON

**Maps to:** B (CSV path), PDF onboarding bullets.

**Steps**

1. Confirm CSV drop / conversion path is documented: `data/onboarding/*.csv` → derived JSON (see `MVD_V1_1_ARTIFACTS.md`).
2. If you have a sample CSV, run (adjust paths as needed):
   ```bash
   npm run onboarding:csv -- --in data/onboarding/<file>.csv --out-dir data/onboarding
   ```
3. Run `npm run validate:onboarding` and confirm **no errors** for derived JSON.

**Pass**

- Conversion completes; schema validation passes.

**Evidence:** command output or screenshot; note any failures.

---

### M-2: Org file & merged org snapshot

**Maps to:** B (org file, both users), Phase 1 artefacts.

**Steps**

1. After pipeline, confirm `out/org-context.json` exists and opens (JSON viewer or `cat`).
2. On `http://127.0.0.1:3050/transparency/org-context`, confirm the **Org merge** section shows JSON (not empty error).
3. Skim for **both personas** represented in merged org context (per product expectations).

**Pass**

- Org merge is present in `out/` and visible in UI without blocking errors.

---

### M-3: Data ingestion drop zones (Zoho / custom)

**Maps to:** C.

**Steps**

1. Read `data/zoho/README.md` and `data/custom/README.md`.
2. Confirm paths `/data/zoho` and `/data/custom` are the agreed drop zones for extracts.

**Pass**

- Expectations for what goes where are clear to a human operator.

---

### M-4: KPI spec contract present and valid

**Maps to:** D (KPI spec contract).

**Steps**

1. Run `npm run validate:kpi-spec`.
2. Confirm `data/kpi-spec/kpi-spec-v1.json` exists and aligns with product intent (spot-check a few KPI ids).

**Pass**

- Validation exits successfully.

---

### M-5: User-facing file review — user context screen

**Maps to:** H (see user file fields), E (personas).

**Steps**

1. Open `http://127.0.0.1:3050/transparency/recommendations`.
2. For **Surge** and **Sam** sections, confirm:
   - role / goals / selection rationale visible;
   - requested vs recommended KPI lists visible;
   - **shared** vs **user-specific** indicators make sense.

**Pass**

- A reviewer can understand per-user KPI intent without opening raw JSON first.

---

### M-6: Secondary surface — full 12 KPIs + 6 decisions (Org context)

**Maps to:** D, E (hybrid UX — Decision 4), H.

**Steps**

1. Open `http://127.0.0.1:3050/transparency/org-context`.
2. Read the intro copy: it should state this is the **secondary** surface for the **full catalogue**, not the preview deck.
3. Confirm **Strategy catalogue** JSON is present (or an explicit empty state if pipeline not run).
4. In the JSON, spot-check:
   - structure suggests **12 KPI** slots and **6 decision** slots (now / near / far as designed);
   - sample **3+3** calc labelling if present in artefact (per Decision 8 — clearly distinguish sample vs production rollup).

**Pass**

- Full 12+6 is inspectable here; preview is not expected to show all 12 cards.

---

### M-7: Signal preview — baseline + “correctness” deep-dive

**Maps to:** E (preview deck), F/G (trust).

**Steps**

- Run the **TW-01 … TW-06** script: [`signal-preview-uat.md`](signal-preview-uat.md) (requested/recommended, sufficient/insufficient, Surge/Sam, no login).
- For **signal-card correctness** (KPI semantics, Surge vs Sam, benchmarks, dictionary traceability): [`signal-card-correctness-uat.md`](signal-card-correctness-uat.md).

**Pass**

- Both documents’ definition-of-done satisfied for your test cycle.

---

### M-8: Insufficient data path educates

**Maps to:** F.

**Steps**

1. On preview, open at least one **Insufficient data** card (requested or recommended).
2. Confirm: **why it matters**, **missing data** list, **how to source** tips (wording may match UI labels).

**Pass**

- User can explain what to do next without engineering help.

---

### M-9: Signal analysis & provenance (spot-check)

**Maps to:** G.

**Steps**

1. On preview, open an **expanded** card with analysis (not only insufficient stub).
2. Confirm presence of narrative depth appropriate to build (e.g. takeaway, root cause / chain fields where data supports — may be stubbed).
3. Open `http://127.0.0.1:3050/transparency/kpi-dictionary`; use **open preview** links to confirm KPI id alignment (see `signal-card-correctness-uat.md` UAT-5).
4. Expand **What we found (provenance)** on a card and confirm **formula/source** style metadata is readable.

**Pass**

- Reviewer can trace “what this number is” toward dictionary + provenance.

---

### M-10: Automated verification (operator checklist — not “manual UAT” but same session)

**Maps to:** F (Decision 14).

**Steps**

1. `npm run review:gates` → check `out/review-gates.json` for `pass: true`.
2. `npm run review:v11` → check `out/review-gates-v11.json` (or equivalent output from `cli-v11`) for v1.1 structure expectations.
3. `npm run qc` → open `out/qc-report.html` if you want a human-readable summary.

**Pass**

- Commands succeed; failures are understood before calling v1.1 “green”.

---

### M-11: Tone & trust (subjective, short)

**Maps to:** A, G.

**Steps**

- Read 2–3 cards for Surge and 2–3 for Sam: copy should feel **business-like**, **educational**, and avoid “fake precision” where data is missing.

**Pass**

- Stakeholder comfortable demoing to a non-technical audience.

---

### M-12: Definition of done — documentation exists

**Maps to:** I.

**Steps**

1. Confirm `docs/architecture/MVD_ARCHITECTURE_AND_DATA_FLOW.md` and `docs/architecture/mvd-data-flow.svg` are present and updated for v1.1 (spot-check dates/sections).
2. Confirm `plans/implementation/IMPLEMENTATION_PLAN_MVD_V1_1.md` reflects **100%** or current phase status as your source of truth.

**Pass**

- New joiners can follow architecture + plan without tribal knowledge only.

---

## Feedback capture

Use the same pattern as [`signal-card-correctness-uat.md`](signal-card-correctness-uat.md): copy the **Feedback entry** template under each test, or add rows:

| Test ID | User / surface | Result | Severity | What you saw | What you expected | Evidence | Suggested fix |
|---------|----------------|--------|----------|--------------|-------------------|----------|---------------|
| M-1 |  |  |  |  |  |  |  |
| … |  |  |  |  |  |  |  |

---

## Related

- [`plans/implementation/IMPLEMENTATION_PLAN_MVD_V1_1.md`](../../plans/implementation/IMPLEMENTATION_PLAN_MVD_V1_1.md) — unified AC and decisions
- [`signal-preview-uat.md`](signal-preview-uat.md) — preview TW-01…TW-06
- [`signal-card-correctness-uat.md`](signal-card-correctness-uat.md) — trust / semantics UAT
- [`docs/testing/signal-copy-compare-workflow.md`](signal-copy-compare-workflow.md) — before/after prompt comparison
