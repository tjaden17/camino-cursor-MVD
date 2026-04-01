# UAT: Pipeline v2 in Chrome (RAG signal cards)

Short manual pass for **pipeline v2** output reviewed in the **QC UI**, ideally with **real Claude** copy. Full build spec: [`IMPLEMENTATION_PLAN_RAG_SIGNAL_INTELLIGENCE.md`](../../plans/implementation/IMPLEMENTATION_PLAN_RAG_SIGNAL_INTELLIGENCE.md).

## What you’re validating

- Numbers and provenance still look **grounded** (not invented).
- **Analysis / synthesis** read like useful product copy when using **real LLM** (not repetitive stubs).
- **Synthesis A vs B** (org-level vs personal) feels meaningfully different where you expect it.
- **Insufficient** cards still explain gap + how to fix; optional deep checks in raw JSON (`domainContextParagraph`, `triggeredDecisionRecommendations`, etc.) if you need them.

Automated coverage stays in **Vitest**; this doc is the **human** pass in the browser.

---

## One-time setup

From the **repo root** (`package.json` here):

```bash
cd /path/to/Camino-cursor-MVD
npm install
npm run build
```

**Real Claude:** set an API key (and a valid model id if your account requires it — see [`mvd-v1-1-uat.md`](mvd-v1-1-uat.md) **Anthropic**):

```bash
export ANTHROPIC_API_KEY="sk-ant-…"
# optional if you hit model 404:
# export ANTHROPIC_MODEL="…"
```

**Data:** demo CSVs under `data/zoho/` and `data/custom/` as expected by v2 (see `run-pipeline-v2.ts`). Missing files reduce cards or skip checks.

---

## Run v2 pipeline

**Real LLM (recommended for this UAT):**

```bash
npm run pipeline:v2
```

Writes **`out/pipeline-v2-output.json`** (and related v2 artefacts). The signal preview **prefers this file**.

**Deterministic stubs (no key, CI-style narrative):**

```bash
npm run pipeline:v2 -- --skip-llm
```

**Useful flags:**

| Flag | Meaning |
| ---- | ------- |
| `--out out/test-e2e-v2` | Same layout as Vitest E2E |
| `--users surge,sam` | Default users if omitted |
| `--skip-llm` | Stubs only |

**Quick refresh without full CLI:** `npm run test -- src/pipeline/stages/run-pipeline-v2.test.ts` → **`out/test-e2e-v2/pipeline-v2-output.json`** (always stubs).

---

## Open the UI

**Terminal 1** — leave running:

```bash
npm run qc-ui:dev
```

**Chrome:** `http://127.0.0.1:3050/preview/signal`

The page loads **`out/pipeline-v2-output.json`** if it exists; otherwise **`out/test-e2e-v2/pipeline-v2-output.json`**. Run **`pipeline:v2`** first so **`out/`** wins and you’re not looking at stale E2E output.

**Controls:**

- **User:** Surge / Sam  
- **Layout:** one card (Prev/Next) or **All cards** (scroll)  
- **All cards:** pick **Synthesis A** or **B** for the deck  

**Direct links:** `?userId=surge&card=0` — add `view=all&version=B` when you want the full-deck layout.

---

## Checklist (in Chrome)

Do this after **`npm run pipeline:v2`** (real LLM), unless you’re only smoke-testing the UI (**`--skip-llm`**).

1. **Surge and Sam** — switch user; cards load, count looks sane (no empty deck).
2. **Narrative badge** — **LLM** vs **Stub/Fallback** comes from each card’s `narrativeSource` in `pipeline-v2-output.json` (set when you run **`pipeline:v2`** with a real key). Vitest E2E output is always **stub** — use **`out/`** from the CLI for a true LLM pass.
3. **Headline value + trend** — believable; open **What we found (provenance)** for formula/source JSON; expand **Data quality** in that block if the gate reported warnings.
4. **Analysis / Synthesis** — UI shows separate sections with bullet chains; **Sources used for this card** lists RAG chunks. Copy should feel **specific** to the KPI; benchmarks honest. Full prompts / LLM calls: **`out/step-4-llm-calls.json`** (same run as `pipeline-v2-output.json`).
5. **A vs B** — compare **Synthesis A** and **B** on the same KPI (single-card: advance to same `kpiId`; or **All cards** + version). Personal (B) should lean on user context where implemented.
6. **Insufficient** cards — clear missing data + how to provide; badges show **Insufficient data**.
7. **Optional (JSON)** — `out/pipeline-v2-output.json`: **`triggeredDecisionRecommendations`**, **`recommendedRationale`**, insufficient **`domainContextParagraph`** — not everything is in the wireframe.

**Pass:** you’d be comfortable showing the deck to a stakeholder; **fail:** log which `kpiId`, user, and what looked wrong.

---

## Troubleshooting

| Symptom | What to do |
| ------- | ---------- |
| `ERR_CONNECTION_REFUSED` on :3050 | Start **`npm run qc-ui:dev`**; keep terminal open. |
| 404 / “Pipeline v2 output not found” | Run **`pipeline:v2`** or E2E test so one of the two JSON paths exists. |
| `pipeline:v2` exits: no API key | Export **`ANTHROPIC_API_KEY`**, or use **`--skip-llm`**. |
| `not_found_error` / model 404 (log shows `"model": "…"`) | Your **`ANTHROPIC_MODEL`** is not a valid id for this API key. Run **`unset ANTHROPIC_MODEL`** to use the repo default, or set an **exact** id from Anthropic’s docs/console — [`mvd-v1-1-uat.md`](mvd-v1-1-uat.md). |
| Broken JS / 500 on assets | `npm run qc-ui:build` then **`qc-ui:dev`** again. |

---

## Related

- [`IMPLEMENTATION_PLAN_RAG_SIGNAL_INTELLIGENCE.md`](../../plans/implementation/IMPLEMENTATION_PLAN_RAG_SIGNAL_INTELLIGENCE.md)  
- [`IMPLEMENTATION_PLAN_QC_PIPELINE_INSPECTOR.md`](../../plans/implementation/IMPLEMENTATION_PLAN_QC_PIPELINE_INSPECTOR.md) — richer step-by-step inspection later  
- [`mvd-v1-1-uat.md`](mvd-v1-1-uat.md) — Anthropic setup; other QC pages (recommendations, org context) still mostly **v1** artefacts  
