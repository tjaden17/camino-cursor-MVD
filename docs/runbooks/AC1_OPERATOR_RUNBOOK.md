# AC1 operator runbook — onboarding → validation → preview

**Audience:** Operators running the 25 Mar MVD demo on a laptop (no login). This is the **primary** one-page path; product explainers are optional background.

## 1. Discovery call

- Run the call using the structure in [`templates/onboarding-call-template.md`](../templates/onboarding-call-template.md).
- Capture **Surge** and **Sam** (or your pilot users) in separate notes; you will normalise into one JSON file per user.

## 2. Save and normalise

- Produce `*-onboarding-derived.json` per user (schema: [`schemas/onboarding-profile.json`](../schemas/onboarding-profile.json)).
- Keep **one `user_id` per file**; do not duplicate the same `user_id` across two folders (validation will fail).

## 3. Upload into the repo

- **Canonical location:** `data/onboarding/` (checked in with the repo for demos).
- **Optional operator drop:** [`data/user-onboarding/`](../data/user-onboarding/README.md) — same format; use when someone hands you a file to merge without touching `data/onboarding/` first.

## 4. Validate

From the **repository root**:

```bash
npm install
npm run validate:onboarding
```

Fix any schema or duplicate-`user_id` errors before running the pipeline.

## 5. Run the pipeline (deterministic demo)

```bash
npm run pipeline -- --skip-llm
```

Writes `out/processed-signals.json`, `out/agent-signals.json`, and related artifacts. Use `--skip-llm` for repeatable CI/demo runs; omit it only when `ANTHROPIC_API_KEY` is set and you want live Claude.

## 6. Build and open the preview

```bash
npm run build
npm run qc-ui:dev
```

- **Signal preview:** http://127.0.0.1:3050/preview/signal  
- Toggle **surge** / **sam** and step through cards with **Prev / Next** (or dots). No login.

## 7. Optional QC report

```bash
npm run qc
```

Opens HTML under `out/qc-report.html` after the run.

---

**Related:** [Data mapping](../DATA_MAPPING.md) · [Plans hub](../../plans/README.md)
