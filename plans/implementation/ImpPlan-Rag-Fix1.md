# Implementation Plan — ImpPlan-Rag-Fix1

**Overall Progress:** `100%`

## TLDR

Fix QC **signal preview** issues from RAG v2 testing: show **LLM vs stub** accurately, make **analysis / synthesis** readable (not wall-of-text / mono logs), surface **RAG sources** and **data-quality notes** clearly, and strengthen **recommended KPI** “why care” copy (leading indicator, lever).

## Critical Decisions

- **Decision 1:** Persist **`narrativeSource` (`llm` | `fallback`)** on each **`SignalCardV2`** in pipeline output — the preview mapper today **hardcodes** `fallback`; fixing only the UI would stay wrong for old JSON and any non-preview consumers.
- **Decision 2:** Render **analysis** and **synthesis** as separate sections with **bulleted chain-of-thought** in [`SignalCardBody.vue`](../../apps/qc-ui/components/SignalCardBody.vue) (and extend [`SignalPreviewPayload`](../../apps/qc-ui/types/signal-preview.ts) / mapper as needed) instead of flattening CoT into two `<p>` blocks.
- **Decision 3:** Keep **recommended rationale** upgrade in [`recommended-rationale.ts`](../../src/pipeline/stages/recommended-rationale.ts) + optional **kpi-spec** blurbs — structured “why” fields rather than one long concatenated string only.
- **Decision 4:** **Quality notes** on cards: human-readable list in UI first; **per-KPI filtering** of which file notes apply to which card is **out of scope** for this plan (optional follow-up).

## Tasks

- [x] 🟩 **Step 1: Narrative source on cards + preview mapping**
  - [x] 🟩 Add `narrativeSource` to [`SignalCardV2`](../../src/pipeline/stages/card-schema.ts) and set in [`run-pipeline-v2.ts`](../../src/pipeline/stages/run-pipeline-v2.ts) / [`buildSignalCard`](../../src/pipeline/stages/card-schema.ts) from `skipLlm` + API key presence.
  - [x] 🟩 [`map-pipeline-v2-to-preview.ts`](../../apps/qc-ui/server/utils/map-pipeline-v2-to-preview.ts): pass through field; stop hardcoding `fallback`.
  - [x] 🟩 Adjust [`run-pipeline-v2.test.ts`](../../src/pipeline/stages/run-pipeline-v2.test.ts) (or card tests) for stub vs LLM flag.

- [x] 🟩 **Step 2: Readable analysis & synthesis in preview**
  - [x] 🟩 Extend payload types + mapper with structured analysis/synthesis (conclusion + bullet lists).
  - [x] 🟩 Update [`SignalCardBody.vue`](../../apps/qc-ui/components/SignalCardBody.vue): two sections, `<ul>` for CoT, remove monospace “audit chain” as default reading path.

- [x] 🟩 **Step 3: Surface “what data we pulled”**
  - [x] 🟩 Short **retrieved sources** summary on card (from `retrievedSources`); cap length.
  - [x] 🟩 Muted pointer to **`out/step-4-llm-calls.json`** for full prompts / calls.

- [x] 🟩 **Step 4: Data quality in provenance**
  - [x] 🟩 Plain-language **Data quality** block when `qualityNotes` non-empty (above raw JSON in provenance `<details>`).

- [x] 🟩 **Step 5: Stronger “why recommended”**
  - [x] 🟩 Extend [`recommended-rationale.ts`](../../src/pipeline/stages/recommended-rationale.ts) (KB3 retrieval + structured “Why this KPI matters / Leading indicator / Lever” sections); wire into existing **Why it’s recommended** UI block (`white-space: pre-line`).

- [x] 🟩 **Step 6: Docs**
  - [x] 🟩 Update [`docs/testing/rag-signal-intelligence-uat.md`](../../docs/testing/rag-signal-intelligence-uat.md): badge meaning, `step-4`, narrative source, checklist.

## Related

- [`IMPLEMENTATION_PLAN_RAG_SIGNAL_INTELLIGENCE.md`](IMPLEMENTATION_PLAN_RAG_SIGNAL_INTELLIGENCE.md)
- [`IMPLEMENTATION_PLAN_QC_PIPELINE_INSPECTOR.md`](IMPLEMENTATION_PLAN_QC_PIPELINE_INSPECTOR.md)
