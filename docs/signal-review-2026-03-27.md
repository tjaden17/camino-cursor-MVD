# Signal Review — 2026-03-27

## Scope reviewed
- URL: `http://127.0.0.1:3050/preview/signal`
- Users: `surge`, `sam`
- Cards reviewed: all cards returned by `/api/preview/signal` for both users (`cardCount=10` each from `processed-signals.json`)
- Related backlog issues:
  - `backlog/issue-SIG-1.1-llm-prompt-iteration-loop.md`
  - `backlog/issue-SIG-1.2-user-kpi-recommendation-transparency-page.md`
  - `backlog/issue-SIG-1.3-kpi-calculation-dictionary-page.md`

## Findings (highest impact first)

### 1) KPI values are not right for KPI meaning (critical)
- `kpi.sales.velocity`, `kpi.support.sla`, `kpi.sales.win_rate`, `kpi.revenue.arpu`, `kpi.product.adoption` all show value `53` (same as leads count).
- This is not credible from a user perspective. A KPI name implies a specific unit/formula (%, days, $, ratio), but current values are reused leads totals.
- Impact: immediate trust loss. Users will treat the whole signal system as unreliable.

### 2) Surge and Sam decks are effectively the same (critical)
- Same 10 KPIs, same ordering, near-identical wording, same missing-data lists.
- Only minor token replacement differs (`for Surge` vs `for Sam`).
- This conflicts with onboarding context: Sam and Surge have different roles, goals, and metric priorities.
- Impact: recommendations feel generic and not context-aware.

### 3) Requested vs recommended rationale is weak (high)
- "Why it's recommended" text is template-like and does not explicitly connect KPI -> user goal -> likely decision.
- It does not answer "why should I care now?" in the user's context.
- Impact: recommended KPIs feel arbitrary.

### 4) Insufficient-data cards are not educational enough (high)
- Missing data and sourcing tips are generic and repeated.
- Tips do not include concrete examples of expected fields or where exactly to get them.
- Impact: users cannot forward clear action items to operators/data owners.

### 5) Expanded synthesis and root-cause logic are generic (high)
- `execSummary`, "good or bad", "expected/unexpected", and root-cause language are boilerplate and repeated across KPIs.
- No KPI-specific chain of reasoning, no "5 whys", no confidence/assumption framing.
- Impact: narrative sounds polished but not trustworthy.

### 6) Provenance section is structurally present but semantically weak for most KPIs (medium-high)
- Provenance appears, but non-leads KPIs still inherit leads-oriented framing.
- For a user validating KPI correctness, `sourceId/rule/formula` must match KPI semantics; currently many do not.
- Impact: deep reviewers cannot verify logic.

### 7) Benchmark comparison is too vague (medium)
- Benchmark text is mostly "illustrative".
- No cited source/range/context (segment, stage, channel).
- Impact: "compared to market" claims are not usable for decision-making.

## User-perspective assessment

### Surge (exec / CEO context)
- Should prioritize decision KPIs tied to growth, revenue quality, pipeline health, retention risk, and support quality as business leverage.
- Current deck does not show role-specific tradeoffs or implications on org KPIs (e.g., effect on revenue forecast, hiring, expansion risk).
- Recommendation fit: low.

### Sam (CSM / operations/customer value context)
- Should emphasize adoption, shifts/job-seeker flow, retention risk, account health, support quality by segment, and customer outcomes.
- Current deck remains sales/executive-heavy and mostly mirrors Surge's set.
- Recommendation fit: low.

## "Be right" benchmark references (for future card calibration)
Note: references below are directional examples to seed calibration; ranges must still be adapted to your segment and data definitions.

- B2B SaaS win-rate directional ranges by deal size (SMB to enterprise): [Optifai benchmark explainer](https://optif.ai/learn/questions/b2b-saas-win-rate-by-deal-size/)
- Support first-response expectations and SLA targets by channel/tier: [Lorikeet benchmark article](https://www.lorikeetcx.ai/articles/first-response-time-benchmark-customer-service)
- Additional SLA framing patterns: [Corebee SLA best practices](https://corebee.ai/blog/customer-support-sla-best-practices)

## Recommendations based on current codebase

### A) `SIG-1.1` — real LLM loop + prompt iteration
1. In `src/pipeline/llm.ts`, pass richer user context into narrative prompt:
   - role, goals, requested/recommended candidates, pain points, trust constraints.
2. Expand `prompts/signal-copy.md` to enforce:
   - KPI-specific units/formula consistency,
   - explicit "why this matters now",
   - assumptions + confidence level,
   - no fabricated numeric claims.
3. Add a simple compare workflow:
   - run pipeline before/after prompt change,
   - diff key fields (`oneLineSummary`, `recommendationRationale`, `execSummary`) per user/card.
4. Keep source markers visible in preview (`processed-signals.json` vs stub/fallback).

### B) `SIG-1.2` — recommendation transparency page
1. Build a dedicated UI page showing:
   - user profile summary (role, goals, key pains),
   - requested KPI list,
   - recommended KPI list,
   - rationale text from pipeline.
2. Read from `out/agent-signals.json` + onboarding-derived JSON.
3. Show "same KPI for both users" and "user-specific KPI" tags to make differences explicit.

### C) `SIG-1.3` — KPI calculation dictionary page
1. Create a KPI dictionary view listing each KPI with:
   - business definition,
   - formula (normalized column names),
   - source dataset + rule id,
   - current status: `replayed`, `proxy`, or `illustrative`.
2. Start from `src/kpi/rules.ts` + provenance fields in contracts.
3. For each KPI card, link back to dictionary entry for explainability.

## Immediate quality gates (before next UAT)
- Gate 1: No KPI card can reuse leads count unless KPI is explicitly leads-related.
- Gate 2: Sam and Surge must differ in at least 40% of KPI IDs or card narratives.
- Gate 3: Every recommended KPI must include a user-specific "why now" sentence tied to a stated goal.
- Gate 4: Every insufficient card must include:
  - exact missing fields,
  - one concrete example row,
  - named system owner/source location.
- Gate 5: Any benchmark claim must include at least one citation link and applicability caveat.

## Bottom line
The current implementation is technically functional (cards render, navigation works) but semantically not "right" yet. The major gap is not UI mechanics; it is KPI semantics, user-context relevance, and explainability. Prioritizing `SIG-1.1` -> `SIG-1.2` -> `SIG-1.3` is the right path to move from "visible cards" to "trusted decisions."
