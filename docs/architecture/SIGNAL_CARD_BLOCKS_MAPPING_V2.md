# Signal Card Blocks Mapping (v2)

## Goal (what this doc answers)
For each “Signal Spec 1” signal-card block, this doc explains:
1. **What text/data should appear** (in plain product language).
2. **Where it lives in `out/pipeline-v2-output.json`** (exact field paths).
3. **How it is created** (deterministic compute, KB/RAG retrieval, constrained LLM output, or stub/fallback).
4. **What you can tweak** (code entry points + knowledge/prompt knobs) to improve quality for that block.

This is the v2 mapping used by the QC preview UI and by the pipeline artifacts.

---

## Reference contracts (source of truth)
### Card model in code
- Sufficient-card contract: [`src/pipeline/stages/card-schema.ts`](src/pipeline/stages/card-schema.ts) (`SignalCardV2`)
- Insufficient-card contract: [`src/pipeline/stages/card-schema.ts`](src/pipeline/stages/card-schema.ts) (`InsufficientCardV2`)
- Root pipeline output contract: [`src/pipeline/stages/card-schema.ts`](src/pipeline/stages/card-schema.ts) (`PipelineOutputV2`)

### Preview payload mapping (optional but useful for “what renders”)
- [`apps/qc-ui/server/utils/map-pipeline-v2-to-preview.ts`](apps/qc-ui/server/utils/map-pipeline-v2-to-preview.ts)

---

## JSON target shape (`out/pipeline-v2-output.json`)
The pipeline output is:
- `out/pipeline-v2-output.json`
  - `users[]`
    - `userId: string`
    - `cards[]`
      - either `SignalCardV2` (*sufficient KPI*)
      - or `InsufficientCardV2` (*insufficient KPI*)
  - `triggeredDecisionRecommendations[]` (root-level decision implications; not per-card)

Notation used below:
- `pipeline.users[i].cards[j]` means “iterate over all users’ cards”
- `pipeline.users[i].cards[j].<field>` is the exact field path in JSON
- `[*]` means arrays

---

## Signal Spec 1 blocks (wishlist intent)
The current UI wiring and pipeline contract partially approximate “Signal Spec 1”.
The intended blocks are:
1. **One-line executive summary** (header headline 1-liner)
2. **Takeaway** (what should the reader conclude?)
3. **Benchmark comparison** (how the metric compares to a reference range)
4. **Root cause / chain-of-thought** (why we believe the conclusion)
5. **Relationships to other metrics** (what correlates/leads/contributes)
6. **Implications for user/org KPIs** (what should the business do next?)

Source of current “what the user sees” (wording + ordering):
- [`decisions/Card-Instructions-31Mar`](decisions/Card-Instructions-31Mar)

---

## Block-by-block mapping (sufficient cards)
This section assumes `pipeline.users[i].cards[j]` is a `SignalCardV2` (*sufficient*).

### 1) One-line executive summary
**What it should sound like (Spec 1 intent)**
A single-line narrative that summarizes the card’s headline number + the overall direction (what this implies).

**Where it comes from in JSON**
The one-line summary is rendered from one of:
- `pipeline.users[i].cards[j].analysis.conclusion`
- `pipeline.users[i].cards[j].synthesis.conclusion`
- `pipeline.users[i].cards[j].provenanceSummary` (fallback if LLM conclusions are empty)

Concretely, the preview mapper (`map-pipeline-v2-to-preview.ts`) computes:
- `overview.oneLineSummary = analysis.conclusion || synthesis.conclusion || provenanceSummary`

**How it is created**
- `analysis.conclusion` comes from:
  - **Constrained LLM output** (`callLlmForAnalysis`) when LLM is enabled
  - or **deterministic stub** (`stubAnalysis`) when `--skip-llm` or no API key
- `synthesis.conclusion` comes from:
  - **Constrained LLM output** (`callLlmForSynthesis`) when LLM is enabled
  - or **deterministic stub** (`stubSynthesis`) when `--skip-llm` or no API key
- `provenanceSummary` is **deterministic compute** derived from:
  - `pipeline.users[i].cards[j].provenance` via `buildProvenanceSummary`

**Where to tweak (knobs)**
- If you want the one-liner to be more “executive” and less generic:
  - adjust the Analysis/Synthesis task phrasing in [`src/pipeline/stages/rag-prompt-assembly.ts`](src/pipeline/stages/rag-prompt-assembly.ts)
  - adjust `SYSTEM_PROMPT` constraints in the same file
  - adjust stub templates in [`src/pipeline/stages/run-pipeline-v2.ts`](src/pipeline/stages/run-pipeline-v2.ts) (`stubAnalysis`, `stubSynthesis`)
- If you want to change selection logic (which conclusion wins):
  - `analysisConclusion || synthesisConclusion` logic lives in [`apps/qc-ui/server/utils/map-pipeline-v2-to-preview.ts`](apps/qc-ui/server/utils/map-pipeline-v2-to-preview.ts) (`oneLineSummary`)

---

### 2) Takeaway (what the reader should conclude)
**What it should sound like (Spec 1 intent)**
A crisp “so this means X” message for decision-making. In the current v2 UI, this is effectively represented by the **Synthesis conclusion** (plus chain-of-thought bullets under Synthesis).

**Where it comes from in JSON**
- Primary: `pipeline.users[i].cards[j].synthesis.conclusion`
- Secondary (for support / evidence): `pipeline.users[i].cards[j].synthesis.chainOfThought[*]`

**How it is created**
- Constrained LLM path:
  - `run-pipeline-v2.ts` calls `callLlmForSynthesis(...)`
  - the model is instructed to return JSON with:
    - `conclusion` (2-3 sentences)
    - `chainOfThought` (array of steps)
    - `citedBenchmarks` (array of `{ claim, source }`)
- Stub/fallback path:
  - `run-pipeline-v2.ts` returns `stubSynthesis(...)`
  - conclusion is one of:
    - `[Stub synthesis — Org-level] Compare against industry benchmarks. ...`
    - `[Stub synthesis — Personal] This metric connects to your specific goals. ...`

**Where to tweak (knobs)**
- **LLM style and content**:
  - edit the Synthesis task block in [`src/pipeline/stages/rag-prompt-assembly.ts`](src/pipeline/stages/rag-prompt-assembly.ts)
  - edit `SYSTEM_PROMPT` rules (especially “be specific” and “use chain-of-thought reasoning as bullet points”)
  - edit parsing expectations in [`src/pipeline/stages/run-pipeline-v2.ts`](src/pipeline/stages/run-pipeline-v2.ts) (`callLlmForSynthesis`)
- **Fallback quality**:
  - edit `stubSynthesis(...)` in [`src/pipeline/stages/run-pipeline-v2.ts`](src/pipeline/stages/run-pipeline-v2.ts)

---

### 3) Benchmark comparison
**What it should sound like (Spec 1 intent)**
The metric’s “good/bad” interpretation based on relevant benchmarks (or an explicit “no benchmark available” honesty clause).

**Where it comes from in JSON**
The pipeline stores benchmarks directly here:
- `pipeline.users[i].cards[j].synthesis.citedBenchmarks[*].claim`
- `pipeline.users[i].cards[j].synthesis.citedBenchmarks[*].source`

**How it is created**
- Constrained LLM path:
  - benchmarks are produced by the model inside `citedBenchmarks` in `callLlmForSynthesis`
  - system prompt rule: “Every benchmark you cite must come from the BENCHMARKS section below with its source”
  - BENCHMARKS content is KB2 retrieval (see “RAG path” below)
- Stub/fallback path:
  - `stubSynthesis(...)` sets:
    - `citedBenchmarks` to `[{ claim: benchmarkSnippet.slice(0,100), source: <KB2 sourcePath or 'KB2'> }]` when KB2 chunks exist
    - or `[]` when KB2 retrieval returned nothing

**RAG path (how benchmark inputs are retrieved)**
Benchmarks used in Synthesis/Analysis prompts come from:
- KB2 retrieval in [`src/pipeline/stages/rag-prompt-assembly.ts`](src/pipeline/stages/rag-prompt-assembly.ts):
  - `retrieve(`${kpiTitle} benchmark`, 3, { kb: "kb2" })`
- retrieval implementation:
  - [`src/rag/store.ts`](src/rag/store.ts) `retrieve(query, topK, {kb})`

Chunking into retrievable units:
- [`src/rag/chunker.ts`](src/rag/chunker.ts)
  - chunks at `##` headings (H2 boundaries)
  - content before first `##` becomes `_intro`

**Where to tweak (knobs)**
- Retrieval quantity / query wording:
  - change topK values and query strings in [`src/pipeline/stages/rag-prompt-assembly.ts`](src/pipeline/stages/rag-prompt-assembly.ts) (`retrieve(...)` calls inside `retrieveContextForKpi`)
- Benchmark grounding:
  - ensure KB2 markdown content under `knowledge/` is chunked as you expect (edit `knowledge/kb2-*.md`, or adjust chunking in [`src/rag/chunker.ts`](src/rag/chunker.ts))
- Output parsing:
  - constrained output is parsed in [`src/pipeline/stages/run-pipeline-v2.ts`](src/pipeline/stages/run-pipeline-v2.ts) (`callLlmForSynthesis`)

---

### 4) Root cause / chain-of-thought
**What it should sound like (Spec 1 intent)**
An ordered bullet walk-through that explains “how we got there” using computed numbers and retrieved patterns.

**Where it comes from in JSON**
Two structured arrays exist:
- Root-cause-style steps: `pipeline.users[i].cards[j].analysis.chainOfThought[*]`
- Additional reasoning/context: `pipeline.users[i].cards[j].synthesis.chainOfThought[*]`

**How it is created**
- Constrained LLM path:
  - `run-pipeline-v2.ts` calls:
    - `callLlmForAnalysis(...)` -> returns `analysis.chainOfThought`
    - `callLlmForSynthesis(...)` -> returns `synthesis.chainOfThought`
  - system prompt enforces bullet reasoning:
    - “Use chain-of-thought reasoning: show your analytical steps as bullet points”
  - output shape is constrained via “Respond in JSON: { conclusion, chainOfThought: [...] }”
- Stub/fallback path:
  - `stubAnalysis(...)` returns fixed bullets:
    - computed deterministic KPI
    - number of KB2 benchmark chunks retrieved
    - a truncated KB3 pattern snippet
  - `stubSynthesis(...)` returns fixed bullets referencing version and benchmark counts

**RAG path (what “analysis patterns” are fed to the LLM)**
The “root cause logic style” comes from KB3 patterns retrieved in:
- [`src/pipeline/stages/rag-prompt-assembly.ts`](src/pipeline/stages/rag-prompt-assembly.ts):
  - `retrieve(`${kpiTitle} analysis template`, 3, { kb: "kb3" })`

**Where to tweak (knobs)**
- Make the reasoning more evidence-linked:
  - edit `SYSTEM_PROMPT` and task blocks in [`src/pipeline/stages/rag-prompt-assembly.ts`](src/pipeline/stages/rag-prompt-assembly.ts)
  - improve KB3 content under `knowledge/kb3-*.md` (this changes `kb3Patterns` fed to the model)
- Improve fallback “stub” chain quality:
  - edit `stubAnalysis(...)` and `stubSynthesis(...)` in [`src/pipeline/stages/run-pipeline-v2.ts`](src/pipeline/stages/run-pipeline-v2.ts)

---

### 5) Relationships to other metrics
**What it should sound like (Spec 1 intent)**
The card should hint which other KPIs are likely connected (contributing factor, leading indicator, etc.).

**Where it comes from in JSON**
This is represented explicitly by a static graph:
- `pipeline.users[i].cards[j].crossSignalReferences[*].kpiId`
- `pipeline.users[i].cards[j].crossSignalReferences[*].title`
- `pipeline.users[i].cards[j].crossSignalReferences[*].relationship`
- Optional current values:
  - `pipeline.users[i].cards[j].crossSignalReferences[*].currentValue`

**How it is created**
The relationships list comes from:
- Static graph: [`src/pipeline/stages/cross-signal-ref.ts`](src/pipeline/stages/cross-signal-ref.ts) (`SIGNAL_GRAPH`)
- Population + current values:
  - `run-pipeline-v2.ts` calls `getRelatedSignals(kpi.kpiId)`
  - `card-schema.ts` `buildSignalCard(...)` maps those refs and injects:
    - `currentValue: computedValues.get(r.kpiId)`

**Where to tweak (knobs)**
- Change the relationship network:
  - edit `SIGNAL_GRAPH` in [`src/pipeline/stages/cross-signal-ref.ts`](src/pipeline/stages/cross-signal-ref.ts)
- Change what “current values” are available:
  - the set of computed KPIs comes from:
    - [`src/pipeline/stages/kpi-compute.ts`](src/pipeline/stages/kpi-compute.ts) (`computeAllForUser`)
    - which is driven by user mappings in `data/kpi-spec/kpi-spec-v2.json`

---

### 6) Implications for user/org KPIs
**What it should sound like (Spec 1 intent)**
“Here’s what you should do next” framed as implications on user goals and org-level metrics.

**Where it comes from in JSON (two different layers)**
This is split in v2 between:
1. **Per-card “why recommended”** text (for recommended KPIs):
   - `pipeline.users[i].cards[j].recommendedRationale` (optional string)
   - field wording is constructed from KB2 + KB1 + KB3 and includes:
     - “Why this KPI matters”
     - “Leading indicator”
     - “Lever / what to watch”
2. **Decision-level implications** (root-level, not per-card UI-wired):
   - `pipeline.triggeredDecisionRecommendations[*]`
     - `userId`, `decisionId`, `decision`, `matchedPattern`, `recommendation`

The UI currently renders only `recommendedRationale` (per-card), and does not render `triggeredDecisionRecommendations` in the signal card wireframe.

**How it is created**
- Recommended rationale:
  - created by `buildWhyRecommendedRationale(...)` in [`src/pipeline/stages/recommended-rationale.ts`](src/pipeline/stages/recommended-rationale.ts)
  - retrieval inputs:
    - KB2 benchmarks range/why-track content
    - KB1 user context
    - KB3 “leading indicator operational lever” templates
  - merged into synthesis chain-of-thought for traceability:
    - `run-pipeline-v2.ts` merges `Why recommended: ...` into `synthesis.chainOfThought` and `synthesis.citedBenchmarks`
- Triggered decision recommendations:
  - created by `evaluateDecisionTriggers(...)` in [`src/pipeline/stages/decision-triggers.ts`](src/pipeline/stages/decision-triggers.ts)
  - deterministic pattern matching between computed trends and catalogue trigger patterns

**Where to tweak (knobs)**
- Improve per-card “implications” copy:
  - edit `buildWhyRecommendedRationale(...)` in [`src/pipeline/stages/recommended-rationale.ts`](src/pipeline/stages/recommended-rationale.ts)
  - update KB content under `knowledge/kb3-*.md` and `knowledge/kb2-*.md`
- Improve decision triggers:
  - edit trigger patterns and recommendations in `data/decision-catalogue/decisions-v1.json`
  - edit the evaluation heuristics/patternMatches logic in [`src/pipeline/stages/decision-triggers.ts`](src/pipeline/stages/decision-triggers.ts)

---

## Block-by-block mapping (insufficient cards)
When `pipeline.users[i].cards[j].dataSufficiency === "insufficient"`, the UI and contract intentionally do **not** show analysis/synthesis blocks.

The signal-card component shows a “gap story” instead:
1. **What it would tell** (proxy narrative)
2. **What’s missing**
3. **How to provide**
4. **What it unlocks**
5. **Decision links**
6. Optional KB1/KB2 paragraphs + retrieved KB sources (when RAG enrichment succeeds)

**Fields in JSON for insufficient cards**
- `pipeline.users[i].cards[j].whatItWouldTell`
- `pipeline.users[i].cards[j].whatsNeeded`
- `pipeline.users[i].cards[j].howToProvide`
- `pipeline.users[i].cards[j].whatItUnlocks`
- `pipeline.users[i].cards[j].decisionLink`
- `pipeline.users[i].cards[j].relatedDecisionIds[*]`
- Optional RAG enrichment:
  - `pipeline.users[i].cards[j].domainContextParagraph` (KB2-backed)
  - `pipeline.users[i].cards[j].userDecisionParagraph` (KB1-backed)
  - `pipeline.users[i].cards[j].retrievedKbSources[*]`

This is created in:
- deterministic template generation: [`src/pipeline/stages/insufficient-cards.ts`](src/pipeline/stages/insufficient-cards.ts)
- optional RAG enrichment: [`src/pipeline/stages/insufficient-rag-enrichment.ts`](src/pipeline/stages/insufficient-rag-enrichment.ts)

---

## “Ability to tweak knobs” summary (by block family)
This table is a quick index to where each block family is controlled.

- **Header / one-line executive summary**:
  - LLM conclusions: `analysis.conclusion`, `synthesis.conclusion` in [`src/pipeline/stages/run-pipeline-v2.ts`](src/pipeline/stages/run-pipeline-v2.ts)
  - prompt constraints: [`src/pipeline/stages/rag-prompt-assembly.ts`](src/pipeline/stages/rag-prompt-assembly.ts)
  - fallback stub strings: [`src/pipeline/stages/run-pipeline-v2.ts`](src/pipeline/stages/run-pipeline-v2.ts)
  - preview selection logic: [`apps/qc-ui/server/utils/map-pipeline-v2-to-preview.ts`](apps/qc-ui/server/utils/map-pipeline-v2-to-preview.ts)
- **Takeaway / synthesis conclusion / benchmark comparison**:
  - LLM synthesis task + schema: [`src/pipeline/stages/rag-prompt-assembly.ts`](src/pipeline/stages/rag-prompt-assembly.ts), [`src/pipeline/stages/run-pipeline-v2.ts`](src/pipeline/stages/run-pipeline-v2.ts)
  - KB2 retrieval inputs: `retrieveContextForKpi(...)` in [`src/pipeline/stages/rag-prompt-assembly.ts`](src/pipeline/stages/rag-prompt-assembly.ts)
  - benchmark chunking: [`src/rag/chunker.ts`](src/rag/chunker.ts)
- **Root cause / chain-of-thought bullets**:
  - analysis task + KB3 pattern retrieval: [`src/pipeline/stages/rag-prompt-assembly.ts`](src/pipeline/stages/rag-prompt-assembly.ts)
  - constrained LLM parsing: [`src/pipeline/stages/run-pipeline-v2.ts`](src/pipeline/stages/run-pipeline-v2.ts)
  - fallback stub bullets: [`src/pipeline/stages/run-pipeline-v2.ts`](src/pipeline/stages/run-pipeline-v2.ts)
- **Relationships to other metrics**:
  - static relationship graph: [`src/pipeline/stages/cross-signal-ref.ts`](src/pipeline/stages/cross-signal-ref.ts)
  - current-value injection: `buildSignalCard(...)` in [`src/pipeline/stages/card-schema.ts`](src/pipeline/stages/card-schema.ts)
- **Implications**:
  - per-card “why it’s recommended”: [`src/pipeline/stages/recommended-rationale.ts`](src/pipeline/stages/recommended-rationale.ts) + KB1/KB2/KB3 content
  - decision triggers: [`src/pipeline/stages/decision-triggers.ts`](src/pipeline/stages/decision-triggers.ts) + `data/decision-catalogue/decisions-v1.json`

---

## Verification pointers (how to validate quickly)
When debugging a specific card:
1. Open `out/test-e2e-v2/pipeline-v2-output.json` (or your latest `out/pipeline-v2-output.json`)
2. Locate:
   - card: `pipeline.users[i].cards[j]` by `kpiId` and `cardVersion` (`A` vs `B`)
3. Check the fields backing each block:
   - one-liner: `analysis.conclusion` / `synthesis.conclusion` / `provenanceSummary`
   - benchmark: `synthesis.citedBenchmarks`
   - chain bullets: `analysis.chainOfThought[]` and `synthesis.chainOfThought[]`
   - relationships: `crossSignalReferences[]`
   - implications: `recommendedRationale` and root `triggeredDecisionRecommendations[]`
4. For constrained LLM traceability:
   - open `out/step-4-llm-calls.json` for the exact prompts and structured outputs used for that run
   - cross-check whether “LLM output quality” issues come from:
     - retrieval issues (wrong KB chunks)
     - prompt constraint mismatch (schema/wording)
     - parsing fallback (JSON parse fails -> plain text truncation)

Optional UI-level validation:
- inspect how preview is derived from JSON:
  - [`apps/qc-ui/server/utils/map-pipeline-v2-to-preview.ts`](apps/qc-ui/server/utils/map-pipeline-v2-to-preview.ts)

---

## Known mismatch notes (v2 vs Spec 1)
1. **Implications for org KPIs** are split:
   - per-card copy is `recommendedRationale`
   - decision implications are root-level `triggeredDecisionRecommendations` but not shown directly in the signal card wireframe
2. **Takeaway and Benchmark comparison** are not separate fields:
   - they are primarily represented as `synthesis.conclusion` + `synthesis.citedBenchmarks`
3. **Root cause** is represented by chain-of-thought arrays:
   - v2 UI shows both Analysis and Synthesis bullets; Spec 1 may expect a stricter “root cause” vs “so what” split

---

## Acceptance criteria checklist
- Clear per-block mapping to exact JSON field paths in `out/pipeline-v2-output.json`.
- Per-block trace describes compute vs RAG vs constrained LLM vs stub/fallback.
- Each block family includes actionable knob locations (code + knowledge inputs).

