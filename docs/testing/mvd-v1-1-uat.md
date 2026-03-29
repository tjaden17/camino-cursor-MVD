# UAT Plan: MVD v1.1

Purpose: give product owners and reviewers a **manual** checklist to validate that the MVD v1.1 experience matches the unified acceptance criteria in [`IMPLEMENTATION_PLAN_MVD_V1_1.md`](../../plans/implementation/IMPLEMENTATION_PLAN_MVD_V1_1.md).

**Artefact map (paths, owners):** [`docs/implementation/MVD_V1_1_ARTIFACTS.md`](../implementation/MVD_V1_1_ARTIFACTS.md)

**Signal trust (provenance + sufficiency):** Honest **per-KPI** provenance, **computed sufficient vs insufficient** data, and **no fabricated headline numbers** are tracked in [`IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md`](../../plans/implementation/IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md). That work **extends** v1.1 UAT and mainly affects **M-7, M-8, M-9** (and linked sub-UATs—see conditions below).

## Release bar vs this document

Per **Decision 14** in the implementation plan, **v1.1 “done”** is satisfied by **automated** verification (`npm run qc`, `npm run review:gates`, `npm run review:v11`, KPI/onboarding validation, CI). This UAT is **optional** for release: it helps you **feel** the product and catch UX/copy gaps; it is **not** a required gate unless product policy changes.

## Quick links (local QC UI, port 3050)


| What                                                                | URL                                                  |
| ------------------------------------------------------------------- | ---------------------------------------------------- |
| Signal preview (primary user UX — representative deck)              | `http://127.0.0.1:3050/preview/signal`               |
| User KPI transparency (requested/recommended, persona context)      | `http://127.0.0.1:3050/transparency/recommendations` |
| **Org context + full 12 KPIs + 6 decisions** (secondary validation) | `http://127.0.0.1:3050/transparency/org-context`     |
| KPI calculation dictionary                                          | `http://127.0.0.1:3050/transparency/kpi-dictionary`  |


**Operator path (generate `out/` before UI):** [`docs/runbooks/AC1_OPERATOR_RUNBOOK.md`](../runbooks/AC1_OPERATOR_RUNBOOK.md)

## Preconditions

Common setup (from repo root):

```bash
npm install
npm run validate:onboarding
npm run validate:kpi-spec
npm run build
```

### Pipeline: two options (pick one)


| Goal                                                                                  | Command                          | Notes                                                                                                            |
| ------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **A — Deterministic / reproducible** (matches CI, same `out/` every time, no API key) | `npm run pipeline -- --skip-llm` | Best for comparing runs, screenshots, and automated gates without drift.                                         |
| **B — Real LLM copy** (judge Claude narrative quality)                                | `npm run pipeline`               | Omit `--skip-llm`. Requires **ANTHROPIC_API_KEY** in your environment. Outputs can vary slightly between runs. |


After the pipeline finishes, start the UI:

```bash
npm run qc-ui:dev
```

**Which should I use for UAT?** Use **A** if you care about repeatability and gate stability. Use **B** if your goal is to **review real LLM signal copy** (tone, specificity, “why now”) — then open the preview and transparency pages as usual.

### Anthropic API key (for option B)

1. **Where it comes from:** Create or obtain a key from **Anthropic** — typically [Anthropic Console](https://console.anthropic.com/) (sign in → **API keys** → create a key). If your company uses Claude through IT, ask for a **project or service API key** from your admin instead of sharing personal keys.
2. **How to use it locally:** Set the environment variable the pipeline expects (name is fixed in this repo):
  ```bash
   export ANTHROPIC_API_KEY="sk-ant-api03-..."   # example shape; use your real key
   npm run pipeline    # no --skip-llm
  ```
   On macOS you can add `export ANTHROPIC_API_KEY=...` to your shell profile, or use a local `.env` **only if** your tooling loads it — **never commit** keys or paste them into the repo.
3. **Safety:** Treat the key like a password. Rotate it if it leaks. CI in this project stays **without** live LLM by design (`--skip-llm`).
4. **If you see `not_found_error` (JSON log with `type: "not_found_error"`):** the API accepted your key but **rejected the model name** the pipeline sends (default in code: `ANTHROPIC_MODEL` or `claude-3-5-sonnet-20241022`). Model IDs change over time; older strings may return 404 for new keys.
  - Open [Anthropic model docs](https://docs.anthropic.com/en/docs/about-claude/models) or your [Console](https://console.anthropic.com/) and copy an **exact** model id your account can use.
  - Run with that id, for example:
    ```bash
    export ANTHROPIC_API_KEY="…"
    export ANTHROPIC_MODEL="paste-exact-model-id-here"
    npm run pipeline
    ```
  - If you need to unblock UAT without fixing the model string, use **option A**: `npm run pipeline -- --skip-llm`.
5. **Node `punycode` deprecation warning:** harmless noise from dependencies; it does not mean the pipeline failed.

Optional sanity after `out/` exists (matches CI-style bar; run after either pipeline option):

```bash
npm run review:gates
npm run review:v11
npm run qc
```

**What these do (plain-language explainer):** [`docs/explainers/optional-npm-sanity-checks-explainer.md`](../explainers/optional-npm-sanity-checks-explainer.md)

---

## Unified AC coverage (manual UAT map)


| AC area (plan §)                                   | Covered by tests below |
| -------------------------------------------------- | ---------------------- |
| A — Product intent / defensible data               | M-10, M-11             |
| B — Onboarding & org (CSV, org file, two personas) | M-1, M-2, M-5          |
| C — Data ingestion (Zoho/custom)                   | M-3                    |
| D — Pipeline, KPI spec, strategy 12+6              | M-4, M-6               |
| E — Signal preview UI                              | M-7 (+ linked docs + per-KPI provenance plan) |
| F — Calcs, gaps, verification                      | M-8, M-10              |
| G — Signal analysis, copy, provenance              | M-9, M-11              |
| H — User/org visibility                            | M-5, M-6               |
| I — DoD (docs, phases)                             | M-12                   |


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

**Note — two different concerns**

- **Per-KPI signal honesty** (same formula/provenance for the same KPI everywhere) is covered by [`IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md`](../../plans/implementation/IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md) and **M-7**.
- **Different Surge vs Sam KPI lists** driven by **onboarding and strategy selection** is a separate product/pipeline concern. The implementation plan’s **E13** rule is: for the **same `kpiId`**, numeric facts and provenance match across users (wording may differ). If you expect **different KPI sets** per persona, validate that against **strategy / onboarding** outputs—not only the provenance plan.

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

**Implementation track:** [`IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md`](../../plans/implementation/IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md) (per-KPI provenance, honest sufficient vs insufficient, no fabricated headline values).

**Steps**

1. **Core checks (after that plan is implemented)**  
   - Open several cards (different **KPI IDs**). Expand **What we found (provenance)** on each.  
   - Confirm **provenance is not identical** across unrelated KPIs: **`ruleId`**, **`formula` / formula text**, and **`sourceId`** (or path) should match **that** KPI, not a single shared “leads” bundle.  
   - Confirm **headline numbers** appear only where the card is **sufficient** and the pipeline can **honestly** replay or compute the metric; otherwise the card should behave as **insufficient** (no made-up `%` or reused lead counts for non-leads KPIs).

2. **Linked manual scripts (conditional)**  
   - [`signal-preview-uat.md`](signal-preview-uat.md) (**TW-01 … TW-06**): navigation, requested/recommended, sufficient/insufficient, Surge/Sam, no login. **Apply only steps that match the current deck**—once sufficiency is data-driven, you may have **few or zero** “sufficient” cards; skip steps that assume a fixed 3+3 sufficient mix.  
   - [`signal-card-correctness-uat.md`](signal-card-correctness-uat.md): KPI semantics, Surge vs Sam, benchmarks, dictionary traceability. **Skip or adapt** cases that require **sufficient** non-leads cards if the current run has none.

**Pass**

- Provenance and sufficiency behave as in the per-KPI plan; linked sub-UATs are satisfied **where applicable** for the deck produced by your pipeline run.

---

### M-8: Insufficient data path educates

**Maps to:** F.

**Steps**

1. On preview, open at least one **Insufficient data** card (requested or recommended).
2. Confirm: **why it matters**, **missing data** list, **how to source** tips (wording may match UI labels).
3. Where [`IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md`](../../plans/implementation/IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md) is implemented: **missing data** and tips should be **specific to that KPI** (not the same generic list on every card unless the gap is truly identical).

**Pass**

- User can explain what to do next without engineering help; per-KPI gaps read as distinct when the implementation provides distinct content.

---

### M-9: Signal analysis & provenance (spot-check)

**Maps to:** G.

**Steps**

1. **If the deck includes at least one sufficient card:** open it and confirm **Analysis & synthesis** (expanded) shows narrative depth appropriate to the build (e.g. takeaway, root cause / chain where supported — may be stubbed or LLM).
2. **If all cards are insufficient:** there is no expanded analysis block — confirm **insufficient** sections and **provenance** still tell a coherent story (formula + source intent for what would be computed).
3. Open `http://127.0.0.1:3050/transparency/kpi-dictionary`; use **open preview** links to confirm KPI id alignment (see [`signal-card-correctness-uat.md`](signal-card-correctness-uat.md) UAT-5).
4. On **multiple** cards, expand **What we found (provenance)** and confirm **formula** (and related metadata) is **readable** and **varies by KPI** where implementation supports it.

**Pass**

- Reviewer can trace “what this number is” (or **would** be) toward dictionary + provenance; expanded narrative checked when sufficient cards exist.

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

Use the same pattern as `[signal-card-correctness-uat.md](signal-card-correctness-uat.md)`: copy the **Feedback entry** template under each test, or add rows below.


| Test ID | User / surface                                        | Result | Severity | What you saw                                                                                                                                                                                                                                                                                                                                                                                                          | What you expected                                                                                                                                               | Evidence | Suggested fix                                                                                                                                                               |
| ------- | ----------------------------------------------------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-1     | onboarding CSV → JSON                                 |        |          |                                                                                                                                                                                                                                                                                                                                                                                                                       |                                                                                                                                                                 |          |                                                                                                                                                                             |
| M-2     | `out/org-context.json`, org merge UI                  |        |          |                                                                                                                                                                                                                                                                                                                                                                                                                       |                                                                                                                                                                 |          |                                                                                                                                                                             |
| M-3     | `data/zoho/`, `data/custom/`                          |        |          |                                                                                                                                                                                                                                                                                                                                                                                                                       |                                                                                                                                                                 |          |                                                                                                                                                                             |
| M-4     | `data/kpi-spec/kpi-spec-v1.json`, `validate:kpi-spec` |        |          | Feedback: Default rule ID wrong for all of them. There needs to be some kind of vadliation, externally, where a Business Intelligence Agent verifies the calc rules.                                                                                                                                                                                                                                                  |                                                                                                                                                                 |          |                                                                                                                                                                             |
| M-5     | `transparency/recommendations`                        |        |          | 1. Sam's requested KPIs are wrong. This is what I saw- `kpi.finance.forecast`shared- `kpi.pipeline.leads_total`shared- `kpi.sales.velocity`shared- `kpi.support.sla` 2. Also, Surge's requested and recommended KPIs are the same as Sam. They should be different, based on user needs. 3. Also, where does 'shared KPIs' come from? We need to understand each user's KPIs, before we understand the shared one. | In the interview research notes with Sam, she mentioned: Zoho Desk trends, Zoho CRM trends, Shifts data and trends — signups, shifts, jobs posted, job seekers. |          | We need a human in the loop for someone (e.g. me or the user) to verify which KPIs they want, because wording can be ambiguous. We may need to help clarify what they mean. |
| M-6     | `transparency/org-context`                            |        |          | Screen is difficult to read (dense JSON).                                                                                                                                                                                                                                                                                                                                                                             | Readable org + strategy catalogue for validation.                                                                                                               |          | Clean up UI.                                                                                                                                                                |
| M-7     | preview + linked UAT docs                             |        |          | The signal provenance shows the same for all cards. this is a critical issue.                                                                                                                                                                                                                                                                                                                                         | Every signal should have a different formula.                                                                                                                   |          | [`IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md`](../../plans/implementation/IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md)                                                                                                                      |
| M-8     | preview (insufficient-data cards)                     |        |          | the 'Missing data ' is the same for all cards. they should bne different, based on what data is missing for that kpi, based on what the user actually has given us.                                                                                                                                                                                                                                                   |                                                                                                                                                                 |          |                                                                                                                                                                             |
| M-9     | preview + `transparency/kpi-dictionary`               |        |          |                                                                                                                                                                                                                                                                                                                                                                                                                       |                                                                                                                                                                 |          |                                                                                                                                                                             |
| M-10    | `review:gates`, `review:v11`, `qc`                    |        |          |                                                                                                                                                                                                                                                                                                                                                                                                                       |                                                                                                                                                                 |          |                                                                                                                                                                             |
| M-11    | preview (copy tone, Surge/Sam)                        |        |          |                                                                                                                                                                                                                                                                                                                                                                                                                       |                                                                                                                                                                 |          |                                                                                                                                                                             |
| M-12    | architecture docs + implementation plan               |        |          |                                                                                                                                                                                                                                                                                                                                                                                                                       |                                                                                                                                                                 |          |                                                                                                                                                                             |


---

## Related

- [`IMPLEMENTATION_PLAN_MVD_V1_1.md`](../../plans/implementation/IMPLEMENTATION_PLAN_MVD_V1_1.md) — unified AC and decisions
- [`IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md`](../../plans/implementation/IMPLEMENTATION_PLAN_PER_KPI_SIGNAL_PROVENANCE.md) — per-KPI provenance, honest sufficiency, no fabricated headline values
- [`signal-preview-uat.md`](signal-preview-uat.md) — preview TW-01…TW-06
- [`signal-card-correctness-uat.md`](signal-card-correctness-uat.md) — trust / semantics UAT
- [`signal-copy-compare-workflow.md`](signal-copy-compare-workflow.md) — before/after prompt comparison

