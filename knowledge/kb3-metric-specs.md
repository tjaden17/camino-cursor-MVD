# KPI metric specifications

Computed KPIs from current Locumate-connected data. Each row is one KPI.

## win_rate

### Definition

**Closed Won** deals divided by **(Closed Won + Closed Lost)**. **Open** deals are **excluded**.

### Source and columns

- **Source:** Zoho CRM — **Deals** export or API.
- **Key columns:** stage (or equivalent), outcome flags used to classify Closed Won vs Closed Lost, deal identifier.

### Edge cases

- Deals with ambiguous or missing stage: **exclude** from denominator unless business rules map them explicitly.
- Zero closed outcomes in period: **avoid division by zero**; report as undefined or N/A with explanation.
- Reopened or corrected deals: align with **single source of truth** date (e.g. close date vs modified time) per product rule.

### Validation rules

- Denominator equals count of deals in **{Closed Won, Closed Lost}** only.
- Numerator ≤ denominator.
- Spot-check a sample of deals against CRM UI for the same period.

---

## support_issue_volume

### Definition

**Count of support tickets** in the chosen period, using ticket **creation time**.

### Source and columns

- **Source:** Zoho Desk — **Tickets**.
- **Key columns:** ticket id, **Created Time**, channel/category if used for breakdowns.

### Edge cases

- Merged or split tickets: follow **one ticket = one row** convention after deduplication rules.
- Timezone: align **Created Time** to reporting timezone.

### Validation rules

- COUNT(*) matches Desk filter for same date range.
- No duplicate ticket ids in the aggregate unless business rules allow.

---

## prospects

### Definition

**Count of leads** created in the period (filter on lead **creation time**).

### Source and columns

- **Source:** Zoho CRM — **Leads**.
- **Key columns:** lead id, **Created Time**, source/status for breakdowns.

### Edge cases

- Converted leads: decide whether “prospect” means **created in period** vs **active in period**; default here is **created in period**.
- Deleted or merged leads: exclude per CRM sync rules.

### Validation rules

- COUNT(*) matches CRM Leads view for the same Created Time window.

---

## pipeline_value

### Definition

**Sum of deal amount** for deals **not** in terminal stages: exclude **Closed Won** and **Closed Lost**.

### Source and columns

- **Source:** Zoho CRM — **Deals**.
- **Key columns:** **Amount**, **Stage**, deal id.

### Edge cases

- Null or zero amounts: treat null as **0** or **exclude** per policy; document choice.
- Multi-currency: convert with **locked FX** or single reporting currency.

### Validation rules

- SUM only where Stage **NOT IN** ('Closed Won', 'Closed Lost') (or mapped equivalents).
- Reconcile total to CRM pipeline report for same snapshot date.

---

## shifts

### Definition

**Count of shifts** with **Current Shift Status = Finished** in the reporting logic (often “finished in period” — align date field to product definition).

### Source and columns

- **Source:** **Shifts Data** (operational export or warehouse table).
- **Key columns:** shift id, **Current Shift Status**, end/finish date if filtering by period.

### Edge cases

- Status spelling and casing must match source values exactly.
- Cancelled or abandoned shifts: **not** Finished unless data model says otherwise.

### Validation rules

- COUNT where status equals **Finished** matches a filtered export for the same period definition.

---

## shift_utilisation

### Definition

**SUM(hours worked)** divided by **SUM(total hours expected)** for shifts meeting the scope (here: **Status = Finished**).

### Source and columns

- **Source:** **Shifts Data**.
- **Key columns:** hours worked, total hours expected, **Status** (or Current Shift Status).

### Edge cases

- Zero expected hours: **exclude** those rows from denominator or cap; never divide by zero.
- Partial shifts: ensure **worked** and **expected** are on the same grain (per shift).

### Validation rules

- Ratio between 0 and 1 (or 0–100% if scaled) unless data errors; flag outliers.
- SUM components reconcile to row-level export for a sample week.

---

## inactive_pharmacy_rate

### Definition

**Count of pharmacies with zero finished shifts in the period** divided by **count of all pharmacies** in scope (same universe for numerator and denominator).

### Source and columns

- **Source:** **Shifts Data** (and pharmacy identifier); pharmacy master if needed for “all pharmacies.”
- **Key columns:** pharmacy id, shift status, period date fields.

### Edge cases

- New pharmacies with no period activity: count as **inactive** if in denominator.
- Pharmacy list must be **frozen** for the period (active at period end vs ever-active — document rule).

### Validation rules

- Denominator > 0; rate in [0, 1].
- Manual check: pick pharmacies with 0 finished shifts and confirm in raw data.

---

## jobs_posted

### Definition

**Count of shifts created** in the period, using **Date Created** (or equivalent creation timestamp).

### Source and columns

- **Source:** **Shifts Data**.
- **Key columns:** shift id, **Date Created**.

### Edge cases

- Duplicates or imports: dedupe on shift id.
- Timezone on **Date Created** consistent with reporting.

### Validation rules

- COUNT(*) for Date Created in range matches operational report or sample query.
