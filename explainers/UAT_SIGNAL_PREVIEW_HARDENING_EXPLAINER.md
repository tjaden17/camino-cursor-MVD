# UAT Signal Preview Hardening - PM Explainer

## The short version

We are fixing a trust gap: the preview sometimes looks complete, but parts of the content are not yet reliable or personalized enough for operator confidence.

## Mental model: kitchen vs menu

- The **KPI replay layer** is the kitchen measurement system (scales, timers, ingredient weights).
- The **LLM narrative layer** is the menu wording and plating.
- The **QC layer** is food safety checks.
- The **preview screen** is what the customer sees at the table.

If kitchen measurements are placeholders, even great plating will not make the meal trustworthy.

## What hardening means in practice

1. **Fix "53 everywhere" behavior**
   - Move from one shared placeholder value to KPI-specific values/provenance.
   - If a KPI is still illustrative, label it honestly.

2. **Make wording user-context aware**
   - "Why recommended" should explain why this user (Surge or Sam) should care.
   - Insufficient-data cards should clearly explain what is missing and what to source next.

3. **Show different decks for different users**
   - Surge and Sam should not get the same default cards.
   - But the same KPI id should still keep consistent facts if shared across users.

4. **Reduce UX confusion**
   - Keep one perspective-switch control pattern, not duplicates.

5. **Update UAT expectations**
   - Clarify what is deterministic replay vs illustrative.
   - Clarify what differences are expected between users.

## Why this matters for product outcomes

- Better operator trust
- Clearer UAT pass/fail evidence
- Faster feedback loops
- Lower risk of shipping polished-but-misleading output

