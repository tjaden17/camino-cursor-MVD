# V1 Hybrid AI Architecture (Auto-Metrics + Executive Synthesis)

## Purpose
Deliver the product promise:
- users get the right metrics without expert setup,
- users receive high-quality strategic synthesis without asking questions,
- outputs are grounded in their data and benchmark context.

This V1 architecture is intentionally simple and robust. It combines deterministic metric computation with a lightweight retrieval layer for context.

## Product Principles
1. **Numbers must be deterministic** (metrics engine is source of truth).
2. **Narrative must be grounded** (retrieved evidence + citations).
3. **Insights are proactive** (system decides what to analyze).
4. **Complexity stays internal** (no prompt engineering required from users).

## V1 Scope
- Input mode: user uploads files.
- File types:
  - structured data (CSV, XLSX exports),
  - unstructured data (notes, reports, docs),
  - optional benchmark reference files.
- Output mode: scheduled insight brief + on-demand executive summary.

## Core Components

### 1) Ingestion Layer
- Accept file uploads and metadata (tenant, upload time, data period, source label).
- Run validation checks:
  - schema/profile checks for structured files,
  - file type + encoding checks for unstructured files.
- Store raw files and a normalized metadata record.

### 2) Metrics Truth Engine (Deterministic)
- Parse and map structured uploads to canonical metric schema.
- Compute KPI values using versioned metric definitions.
- Persist:
  - metric values,
  - calculation provenance (formula version, input files, date windows),
  - data quality flags.

### 3) Light RAG Context Layer (Grounding)
- Index unstructured uploads and benchmark docs.
- Indexing flow:
  - chunk text,
  - generate embeddings,
  - store vectors + metadata (tenant, source, timestamp, document id).
- Retrieval flow:
  - hybrid retrieval (keyword + vector),
  - enforce strict tenant filters,
  - time-aware ranking (favor recent context unless query asks for historical).

### 4) Insight Orchestrator (Predefined AI Calls)
- No freeform user prompting required.
- Runs fixed analysis playbooks (for example):
  - KPI movement analysis,
  - trend inflection detection,
  - variance vs benchmark,
  - risk/opportunity scan.
- Each playbook calls:
  1. metrics engine for exact numbers,
  2. RAG layer for explanatory context/evidence,
  3. synthesis model for final narrative.

### 5) Synthesis and Output Layer
- Produces executive-ready outputs:
  - key findings,
  - likely drivers,
  - implications,
  - recommended next actions.
- Includes evidence links/citations to source snippets.
- Includes confidence and data-completeness indicators.

## End-to-End Runtime Flow
1. User uploads files.
2. Ingestion validates and catalogs files.
3. Structured files go to metrics truth engine.
4. Unstructured + benchmark files go to RAG indexer.
5. Scheduled or triggered playbooks run automatically.
6. Orchestrator gathers:
   - KPI truth from metrics engine,
   - context from RAG retrieval.
7. Synthesis model generates concise executive narrative.
8. Product returns brief with citations and confidence flags.

## Guardrails (Critical for Trust)
1. **Never generate KPI numbers from LLM output.**
2. **Always separate computed facts from inferred narrative.**
3. **Require citation-backed claims for contextual statements.**
4. **Show data freshness timestamp in every brief.**
5. **Expose missing-data and low-confidence warnings.**
6. **Enforce tenant isolation at every query/retrieval step.**

## Recommended V1 Data Contracts

### Metric Result Contract
- `metric_name`
- `value`
- `period_start`, `period_end`
- `formula_version`
- `input_sources[]`
- `quality_flags[]`

### Evidence Contract (RAG)
- `snippet_text`
- `document_id`
- `source_type` (note/report/benchmark/etc.)
- `source_timestamp`
- `relevance_score`

### Insight Contract (Output)
- `headline`
- `what_changed` (facts)
- `why_it_likely_changed` (inference + citations)
- `so_what` (business implication)
- `recommended_action`
- `confidence_level`

## Suggested V1 KPIs for Architecture Health
- citation coverage rate (% of narrative claims with evidence),
- numeric accuracy rate (vs deterministic metric outputs),
- insight acceptance/usefulness score (user feedback),
- freshness SLA adherence,
- low-confidence insight rate.

## Why This Is the Right V1 for Your Product
- Preserves your core value proposition: automatic, high-quality synthesis.
- Keeps KPI truth reliable and auditable.
- Uses RAG where it adds real value: context, explanation, benchmark grounding.
- Creates a clean path from upload-based onboarding to future direct integrations.
