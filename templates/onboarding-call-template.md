# Onboarding call — notes template → normalized profile

Use this during or after a call. Fill what you can; copy bullets freely. When ready, translate into `data/onboarding/<user>-onboarding-derived.json` so it matches `schemas/onboarding-profile.json` (run validation in the repo before committing).

**Source metadata (for the JSON `source` block)**  
- Call date: _______________  
- Document / recording label: _______________  
- Derived by: _______________

---

## Person

- **user_id** (short id, e.g. `sam`, `surge`): _______________  
- **name**: _______________  
- **role**: _______________  
- **experience summary** (1–3 sentences):  

---

## Company

- **company**: _______________  
- **industry**: _______________  
- **business model** (or “unknown”): _______________  
- **stage** (e.g. seed, growth — or null): _______________  
- **team size** (number or null): _______________

---

## What they need to decide

- **Primary goals** (bullets):  
  -  
  -  
- **When they review numbers** (e.g. morning, weekly):  
  -  
- **Outcomes they want from data** (bullets):  
  -  
  -  

---

## Metrics they own or care about

- **Top metrics today** (bullets):  
  -  
  -  
- **Extra metrics they’d like to watch**:  
  -  

---

## Data & systems

- **Systems / sources they use** (CRM, warehouse, spreadsheets, etc.):  
  -  
- **Known constraints** (access, quality, latency):  
  -  

---

## Pain points

- (Short bullets — what’s frustrating today)  
  -  
  -  

---

## Trust & AI

- **Attitude to AI-assisted insights**: _______________  
- **What must be transparent** (e.g. formulas, sources):  
  -  

---

## Signals (for the product)

- **Requested signal candidates** (KPIs or questions they explicitly want — at least one):  
  1.  
  2.  
  3.  
- **Recommended signal candidates** (things we might suggest — at least one):  
  1.  
  2.  
  3.  

---

## Glossary (optional)

| Term they use | What it means here |
|---------------|--------------------|
|               |                    |

---

## Gaps & assumptions

- **Structured fields we still don’t have**:  
  -  
- **One-line note** (what we assumed to fill gaps):  

---

## After the call

1. Save validated JSON under `data/onboarding/` (e.g. `surge-onboarding-derived.json`).  
2. Ensure `source.derived_at` reflects the date you produced the file.  
3. Run the project’s schema validation so the file is contract-safe for the pipeline.
