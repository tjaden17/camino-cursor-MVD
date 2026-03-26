# Signal copy compare workflow (before/after)

Purpose: make prompt iteration repeatable for SIG-1.1.

## Steps

1. Run pipeline baseline:
   - `npm run pipeline -- --skip-llm`
   - Copy `out/processed-signals.json` to `out/processed-signals.baseline.json`.
2. Run pipeline with LLM:
   - Ensure `ANTHROPIC_API_KEY` is set.
   - `npm run pipeline`
3. Compare key fields:
   - `oneLineSummary`
   - `recommendationRationale`
   - `expanded.execSummary`
   - `narrativeSource`
4. Run scripted review gates:
   - `npm run review:gates`
5. Pass criteria:
   - `out/review-gates.json` has `"pass": true`
   - No benchmark block without citation+caveat.
