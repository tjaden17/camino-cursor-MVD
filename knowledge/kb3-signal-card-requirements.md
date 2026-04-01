# Signal card content requirements

Sections below apply to **analysis** and **synthesis** blocks on signal cards.

## Analysis section

### Required content

- **Conclusion:** **Two to three sentences** stating what the data shows and the main driver or pattern.
- **Chain of thought:** **Bullets** walking through the **breakdowns** you applied (e.g. channel, segment, trend), in order.

### Quality bar

- Tie claims to **computed** values from the run (period, filters, metric definition).
- Avoid vague language; name **dimensions** and **direction** (up/down, which segment).

---

## Synthesis section

### Required content

- **Conclusion:** **Two to three sentences** linking findings to **benchmarks** (if any) and **user context** (role, goals).
- **Chain of thought:** Bullets that **connect** metrics to benchmarks and to **what the user cares about** (e.g. retention, roadmap, load).

### Benchmarks

- **Every benchmark** must **cite source** (report name, publisher, **year**).
- If **no** retrieved benchmark exists: write **“No benchmark available for this metric.”**

### Numbers

- **Every number** must **trace** to **computed data** from the prompt or tool output (not memory).

### Specificity

- Prefer **specific** statements (magnitudes, segments, channels) over **generic** platitudes.

---

## Cross-cutting rules

- Do not imply external data was used unless it was **retrieved and cited**.
- When mixing **facts from data** and **external context**, label which is which (see anti-hallucination rules).
