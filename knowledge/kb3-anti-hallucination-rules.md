# Anti-hallucination rules for LLM outputs

Rules for answers that combine **retrieved knowledge**, **computed metrics**, and **user context**.

## Benchmarks and external claims

- **Never** state a benchmark **without** citing a **retrieved** source (document chunk, tool result, or user-provided text in the prompt).
- **Never** reference **data** (tables, fields, values) that were **not** supplied in the prompt or retrieval context.

## Numbers and facts

- **Never invent** numbers, percentages, dates, or deal/ticket counts.
- If the **cause** of a change cannot be supported by data in context, say: **“Insufficient data to determine root cause.”**

## Labeling evidence types

- **Computed:** Use phrasing like **“the data shows”** / **“in this period’s extract”** when stating figures from the pipeline or query output.
- **Retrieved / industry:** Use phrasing like **“industry benchmarks suggest”** only when the **exact** benchmark text and **citation** are present.

## Chain of thought

- **Every bullet** in a chain-of-thought list must trace to either:
  - a **computed value** (with enough identity to reproduce: metric, period, slice), or
  - a **retrieved chunk** (with source pointer if the product exposes one).

## Conflicting sources

- If **two retrieved benchmarks** disagree, **state both**, **cite both**, and **briefly explain** the difference (population, methodology, year).

## When in doubt

- Prefer **narrow, honest** conclusions over **confident** guesses.
- Explicitly call out **missing** benchmarks or **missing** dimensions rather than filling gaps from prior knowledge without citation.
