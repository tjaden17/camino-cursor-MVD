# UAT Plan: Signal Card Correctness (SIG-1.x)

Purpose: verify that signal cards are not only *visible*, but also *trustworthy* to a user reviewing Surge vs Sam (KPI meaning, recommendation quality, completeness of insufficient-data guidance, and benchmark credibility).

This UAT plan is derived from `plans/implementation/IMPLEMENTATION_PLAN_SIGNAL_CARD_RIGHTNESS.md`.

## What to test (user-visible outcomes)

1. **Source markers are clear**
   - Artifact-level source (what dataset produced the deck)
   - Card-level narrative source (`LLM` vs `Stub/Fallback`)
2. **KPI semantics are consistent with the KPI name**
   - Non-leads KPIs do not reuse the leads numeric value unless the KPI is truly leads-related
3. **Surge vs Sam are meaningfully different**
   - Recommended/selected KPI sets and narrative “why it matters” align to user context
4. **Recommended + insufficient-data cards include the right guidance**
   - Recommended: “Why it’s recommended” is present and specific
   - Insufficient data: missing fields are explicit + sourcing tips are actionable
5. **Benchmark statements are credible**
   - If a Benchmark section is shown, it includes both a citation and an applicability caveat

## Quick links

Run the QC UI and open:

- Signal preview: `http://127.0.0.1:3050/preview/signal`
- User KPI recommendations (context + requested/recommended sets): `http://127.0.0.1:3050/transparency/recommendations`
- KPI calculation dictionary (definitions + formulas + traceability): `http://127.0.0.1:3050/transparency/kpi-dictionary`

Related operator path (to generate preview data):
- `docs/AC1_OPERATOR_RUNBOOK.md`

## Preconditions (do these first)

From repo root:

```bash
npm install
npm run validate:onboarding
npm run pipeline -- --skip-llm
npm run build
npm run qc-ui:dev
```

Notes:
- `--skip-llm` makes output deterministic so UAT checks are repeatable.
- If decks are unexpectedly tiny (e.g., only one card), make sure `out/processed-signals.json` contains a full deck (otherwise the UI may prioritize it over multi-card stubs).

## Evidence capture format (per test)

For each test below, capture:
- screenshot(s)
- Pass/Fail
- 1–2 sentence “why” note (especially for any fail)
- (optional) which KPI card(s) you checked (KPI ID and whether it was Requested/Recommended, Sufficient/Insufficient)

## How to capture feedback *inside this doc*

Use this pattern for each UAT step that you run:

1. Find the test case (e.g. `UAT-3`).
2. Add a short entry under that test by copying the template below.

Copy/paste template (fill in the blanks):

```
Feedback entry:
- Date: YYYY-MM-DD
- Person: <name>
- Result: Pass | Fail | Partial
- Severity (if not Pass): Blocker | High | Medium | Low
- What you saw: <1-2 sentences>
- What you expected: <1 sentence>
- Evidence: <screenshot filename(s) or link>
- Affected user(s): surge | sam | both
- Affected KPI/case (if known): <KPI ID + Requested/Recommended + Sufficient/Insufficient>
- Suggested fix (optional): <1 sentence>
```

Tip: keep “Suggested fix” short and specific; you can write “Need clearer wording” or “Missing citation URL in Benchmark section” without proposing code.

## Test Cases (Manual UAT)

### UAT-0: Confirm source markers are visible (LLM vs Stub) + artifact source

Steps:
1. Open `http://127.0.0.1:3050/preview/signal`.
2. On the top “badges” area, find **`Narrative: LLM`** or **`Narrative: Stub/Fallback`**.
3. Use the card navigation so you see at least one expanded view (so you can check provenance too).
4. In the navigation controls, confirm the deck indicates the **artifact source** (UI shows a `Source:` label when present).

Pass criteria:
- Narrative source label is present and clearly switches between `LLM` vs `Stub/Fallback`.
- The deck indicates which artifact is driving the preview.

---

### UAT-1: Gate-aligned check — no “leads value” reuse for non-leads KPIs

Why this matters: users will lose trust if unrelated KPIs show the same numeric value as “leads total”.

Steps:
1. On `preview/signal`, switch to `surge`.
2. Identify the card where `kpiId` is `kpi.pipeline.leads_total` (you can use the KPI ID shown on the card).
3. Record the `currentValue` for `leads_total` (call this number **V_leads**).
4. Scan the other KPI cards on the deck:
   - For each card that is **not** `kpi.pipeline.leads_total`, check its `currentValue`.
   - Confirm it does *not* exactly equal **V_leads**.
5. Repeat the scan for `sam`.

Pass criteria:
- For both users, non-leads KPI cards do not reuse the exact numeric leads value.

---

### UAT-2: Gate-aligned check — Surge vs Sam are meaningfully different

Why this matters: if Surge and Sam look like the same deck, recommendations feel generic.

Steps:
1. Open `http://127.0.0.1:3050/transparency/recommendations`.
2. For each user section (Surge + Sam):
   - Confirm the **role** and **Goals** are visible.
   - Check **selection rationale** is present.
   - Review **Requested KPIs** and **Recommended KPIs** lists.
   - Confirm there are `user-specific` vs `shared` badges in the lists (not just “shared” everywhere).
3. Back on `preview/signal`:
   - Switch user `surge` → `sam`.
   - Open 1–2 recommended cards in expanded view and compare:
     - `oneLineSummary`
     - `Why it’s recommended` text (if present)

Pass criteria:
- Surge and Sam differ clearly in KPI sets and/or narrative rationale (not a near-copy).

---

### UAT-3: Gate-aligned check — Recommended quality + Insufficient data completeness

Why this matters:
- Recommended cards should explain *why now*.
- Insufficient cards must tell users what’s missing and how to get it.

Steps:
1. On `preview/signal`, pick a `Recommended` card and confirm:
   - The **`Why it’s recommended`** section is visible.
   - The text reads as specific (not purely template-like).
2. Then find a card with **`Insufficient data`**.
3. Confirm in expanded view that:
   - **`What’s missing`** is shown.
   - Under **`Missing data`**, there are at least 2 distinct items.
   - Under **`How to source it`**, there is at least 1 bullet/tip.
   - The tips are actionable (e.g., they point to expected fields/datasets or practical next steps).
4. Repeat steps (1–3) for both `surge` and `sam`.

Pass criteria:
- Every recommended card includes a clear “why now” style rationale.
- Every insufficient-data card includes explicit missing fields and at least one actionable sourcing tip.

---

### UAT-4: Gate-aligned check — Benchmark claims include citation + applicability caveat

Why this matters: benchmark comparisons must be usable and not overconfident.

Steps:
1. On `preview/signal`, open expanded view on a card.
2. If you see a **`Benchmark`** section:
   - Check that the benchmark text includes at least one **URL/citation** (starts with `http`).
   - Check that it includes an **applicability/caveat** (e.g., “illustrative”, “directional”, “not directly comparable”, etc.).
3. Repeat for both `surge` and `sam`.

Pass criteria:
- If Benchmark text exists, it includes both a citation and a clear caveat.

---

### UAT-5: Traceability — KPI dictionary “open preview” links land on the right card

Why this matters:
- the dictionary is only useful if a reviewer can jump to the exact signal card and verify consistency.

Steps:
1. Open `http://127.0.0.1:3050/transparency/kpi-dictionary`.
2. Pick 2–3 KPI entries (preferably one `replayed` and one `illustrative`).
3. For each entry, use the “open preview” link under **Cards in current deck**.
4. In the preview, confirm:
   - the displayed KPI ID matches the dictionary KPI ID, and
   - the user perspective is the one expected from the link (Surge vs Sam).
5. Repeat for both users if the dictionary provides preview links that differ by `userId`.

Pass criteria:
- Each “open preview” link opens the correct KPI card (same KPI ID).

---

### UAT-6: KPI semantics sanity check — value formatting matches dictionary unitHint

Why this matters:
- even if the number “looks right”, the KPI name implies a specific unit/type (%, days, $, ratio).

Steps:
1. On `preview/signal`, open a non-leads card for `surge`.
2. Note the KPI ID shown on the card.
3. Go to `transparency/kpi-dictionary` and find that KPI ID.
4. Read the dictionary’s **Unit** and **Formula summary**.
5. Compare against the card’s displayed value:
   - e.g., % KPIs should show %, $ KPIs should show currency-like formatting, time KPIs should show days/weeks style formatting (as applicable).
6. Repeat for at least one different KPI (still non-leads).

Pass criteria:
- Card value formatting is consistent with the dictionary unitHint (no obvious unit mismatch).

---

## Optional: run the scripted gates (quick sanity check)

This is not a replacement for UAT, but it gives an immediate pass/fail baseline that matches the gate logic in code.

Steps:
1. From repo root:
   ```bash
   npm run review:gates
   ```
2. Check `out/review-gates.json`.
3. If a gate fails, use the UAT steps above to locate which card(s) caused it.

## Definition of Done

Signal card correctness UAT is complete when:
- `UAT-0` through `UAT-6` are executed and pass for both `surge` and `sam` (where applicable),
- evidence is captured for any failures,
- and (optionally) `npm run review:gates` reports `pass: true`.

## Feedback log (fillable)

Use this section to keep an at-a-glance history of findings. Add new rows as you test.

| Test ID | User | Result | Severity | What you saw | What you expected | Evidence | Suggested fix |
|---|---|---|---|---|---|---|---|
| UAT-0 | both |  |  |  |  |  |  |
| UAT-1 | both |  |  |  |  |  |  |
| UAT-2 | both |  |  |  |  |  |  |
| UAT-3 | both |  |  |  |  |  |  |
| UAT-4 | both |  |  |  |  |  |  |
| UAT-5 |  |  |  |  |  |  |  |
| UAT-6 |  |  |  |  |  |  |  |

