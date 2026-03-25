# Narrative QC rubric (human)

Use for **Signal–So what**, weekly brief **Section 2** paragraphs, and similar AI text. **LLM critique is optional hint only**—not a pass/fail gate.

## Grounding

- [ ] Every quantitative claim ties to a **metric id** or **period** that exists in provenance or the brief spec.
- [ ] No invented percentages or counts—if data is missing, card should be **insufficient_data**, not a guess.

## Internal consistency

- [ ] No contradictions between paragraphs (e.g. “up vs last week” vs a chart showing down).
- [ ] Terminology matches the dataset (e.g. “leads” vs “signups” only if defined).

## Weekly brief rules (MVD doc)

- [ ] Section 2: max ~5 sentences per issue; references **trend**, not only the latest point.
- [ ] Includes one **forward-looking** “watch whether …” style line.
- [ ] Does **not** prescribe executive actions if the product spec reserves that for the exec.

## Usefulness (subjective)

- [ ] Would Sam/CEO leave with a clearer **priority** than raw numbers alone?
- [ ] Avoids generic consulting filler that could apply to any company.

**Scoring (optional):** 1–5 per block; overall pass is team judgment, not a formula.
