# Signal preview UAT (manual acceptance)

Product/operator-focused checks for acceptance criteria using the signal preview screen.

**See also:** [Testing guide (lifecycle + automation)](README.md) · [Operator runbook](../runbooks/AC1_OPERATOR_RUNBOOK.md)

## Goal

Prove that Surge and Sam can:

- see requested and recommended signals,
- switch between users,
- open card details (expanded view),
- and handle both sufficient and insufficient data cases.

## Quick links

- Signal preview screen: [http://127.0.0.1:3050/preview/signal](http://127.0.0.1:3050/preview/signal)
- Operator runbook (full end-to-end path): `docs/runbooks/AC1_OPERATOR_RUNBOOK.md`
- Acceptance criteria source: `release acceptance criteria/Refined AC for 25 Mar`

## One-time setup (before user testing)

Run these commands from repo root:

```bash
npm install
npm run validate:onboarding
npm run pipeline -- --skip-llm
npm run build
npm run qc-ui:dev
```

When the server is running, open:

- [http://127.0.0.1:3050/preview/signal](http://127.0.0.1:3050/preview/signal)

## What to capture as evidence

For each test below, capture:

- a screenshot,
- a pass/fail decision,
- short note if fail ("what was expected vs what happened").

Use a simple table in your notes:

- Test ID
- User (Surge/Sam)
- Result (Pass/Fail)
- Screenshot name
- Notes

## User-facing test workflow

### TW-01: Screen loads with no login (AC #2)

Steps:

1. Open [http://127.0.0.1:3050/preview/signal](http://127.0.0.1:3050/preview/signal) in a browser.
2. Confirm the page loads without any auth/login prompt.
3. Confirm a signal card is visible.

Pass criteria:

- Preview opens directly.
- At least one signal card is shown.

---

### TW-02: Toggle between Surge and Sam (AC #3)

Steps:

1. In the user dropdown, select `surge`.
2. Note the card title/KPI.
3. Change dropdown to `sam`.
4. Confirm card content changes for Sam.

Pass criteria:

- User selector works.
- Content reflects selected user.

---

### TW-03: Requested signal interactions (AC #2 and #7)

Steps:

1. Select user `surge`.
2. Find a card with badge `Requested`.
3. Validate 3 interactions:
  - Overview is visible (title/value/summary).
  - Expanded details section is visible (analysis block OR insufficient-data details).
  - Move to another card using `Next`/`Prev` or dot controls.
4. For at least one requested card with insufficient data, confirm expanded content includes:
  - why it matters,
  - what data is missing,
  - practical sourcing tips.

Pass criteria:

- Requested cards can be viewed and navigated.
- Expanded details are present.
- Insufficient-data requested card includes all 3 detail types above.

---

### TW-04: Recommended signal interactions (sufficient data) (AC #4)

Steps:

1. For `surge`, navigate until you find `Recommended` + `Sufficient data`.
2. Verify:
  - Overview content visible.
  - "Why it’s recommended" section is visible.
  - Expanded analysis content visible.
3. Move to a different recommended card.

Pass criteria:

- At least 3 recommended signals can be browsed per user context as expected.
- Recommended rationale is shown.
- Navigation between different cards works.

---

### TW-05: Recommended signal interactions (insufficient data) (AC #5)

Steps:

1. Navigate to `Recommended` + `Insufficient data`.
2. Verify expanded insufficient-data content includes:
  - why it’s recommended/important,
  - what data is missing,
  - tips for sourcing missing data.
3. Move to another card and back, confirming consistent behavior.

Pass criteria:

- Recommended insufficient-data cards show complete guidance.
- Navigation remains stable.

---

### TW-06: Repeat key checks for second user (Surge/Sam parity) (AC #2, #3, #4, #5, #7)

Steps:

1. Repeat TW-03, TW-04, TW-05 for the other user.
2. Ensure both users can complete the same interactions.

Pass criteria:

- Both users support the same core preview interactions.

## Acceptance criteria coverage map

- AC #2 → TW-01, TW-03, TW-06
- AC #3 → TW-02, TW-06
- AC #4 → TW-04, TW-06
- AC #5 → TW-05, TW-06
- AC #7 → TW-03, TW-06

Related but outside direct preview interaction:

- AC #1 and AC #6 are validated through the full operator/data-flow runbook path in `docs/runbooks/AC1_OPERATOR_RUNBOOK.md` plus architecture docs.

## Definition of done (for this testing cycle)

You can mark preview acceptance testing complete when:

- all tests TW-01 to TW-06 are executed,
- each test has evidence (screenshot + note),
- all mapped ACs (#2, #3, #4, #5, #7) are Pass,
- any Fail has a logged issue with reproduction steps.

## Optional fast regression (after code changes)

Run this mini-check in under 5 minutes:

1. Open preview URL.
2. Switch Surge → Sam → Surge.
3. Open one requested card and one recommended card.
4. Confirm one insufficient-data card still shows missing data + tips.
5. Confirm Next/Prev and dot navigation still work.

