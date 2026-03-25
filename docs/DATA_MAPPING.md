# Data mapping and gaps (MVD)

Source: workspace CSVs under `data/` and interview priorities (Locumate–Sam).

## Normalized datasets

| Dataset ID | File | Purpose |
|------------|------|---------|
| `onboarding_profile` | `data/onboarding/User profile-Surge.csv` | Role, company, goals, top metrics (wide form; not rectangular) |
| `zoho_crm_leads` | `data/zoho/Zoho - CRM - Leads.csv` | Pipeline / prospect volume |
| `zoho_crm_deals` | `data/zoho/Zoho - CRM - Deals.csv` | Deal stages, amounts |
| `custom_shifts` | `data/custom/Shifts Data - Shifts (Non protected).csv` | Shift operations, utilization proxies |

Column maps live in `src/ingest/mapping.ts`.

## Interview alignment (Sam)

| Priority | Available in extracts? | Notes |
|----------|------------------------|--------|
| Signups / prospects | Partial | Leads CSV approximates new leads; not full product signups |
| Shifts | Yes | `custom_shifts` |
| Jobs posted | Gap | Not in current files as a dedicated jobs board export |
| Job seekers | Gap | Not present as a distinct dataset here |
| Adoption / segments | Partial | Derive from shifts/pharmacy group; no app-usage table in repo |
| Zoho Desk trends | Gap | No Desk export in `data/` yet |
| Zoho CRM hygiene | Caveat | Many optional columns empty in sample; strategy agent should flag |

When KPIs need missing sources, emit `insufficient_data` cards (see schema) instead of inventing numbers.
