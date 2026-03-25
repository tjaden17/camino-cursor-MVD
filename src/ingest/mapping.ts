/**
 * Column mapping from raw exports to normalized field names agents and replay rules use.
 * Paths are relative to repo root unless noted.
 */

export type DatasetId =
  | "onboarding_profile"
  | "zoho_crm_leads"
  | "zoho_crm_deals"
  | "custom_shifts";

export interface ColumnMapEntry {
  /** Column header as it appears in the CSV */
  rawColumn: string;
  /** Stable normalized name for pipelines */
  normalized: string;
  /** loose typing hint for validation */
  semantic?: "id" | "timestamp" | "email" | "money" | "category" | "text";
}

export const DATASET_PATHS: Record<DatasetId, string> = {
  onboarding_profile: "data/onboarding/User profile-Surge.csv",
  zoho_crm_leads: "data/zoho/Zoho - CRM - Leads.csv",
  zoho_crm_deals: "data/zoho/Zoho - CRM - Deals.csv",
  custom_shifts: "data/custom/Shifts Data - Shifts (Non protected).csv",
};

/** Zoho CRM Leads — first row is header */
export const ZOHO_LEADS_MAP: ColumnMapEntry[] = [
  { rawColumn: "Id", normalized: "record_id", semantic: "id" },
  { rawColumn: "Last Name", normalized: "contact_last_name", semantic: "text" },
  { rawColumn: "Company", normalized: "company_name", semantic: "text" },
  { rawColumn: "Lead Owner Name", normalized: "owner_name", semantic: "text" },
  { rawColumn: "Email", normalized: "email", semantic: "email" },
  { rawColumn: "Created Time", normalized: "created_at", semantic: "timestamp" },
  { rawColumn: "Is Converted", normalized: "is_converted", semantic: "category" },
  { rawColumn: "Full Name", normalized: "full_name", semantic: "text" },
  { rawColumn: "Modified Time", normalized: "modified_at", semantic: "timestamp" },
];

export const ZOHO_DEALS_MAP: ColumnMapEntry[] = [
  { rawColumn: "Id", normalized: "record_id", semantic: "id" },
  { rawColumn: "Deal Name", normalized: "deal_name", semantic: "text" },
  { rawColumn: "Stage", normalized: "stage", semantic: "category" },
  { rawColumn: "Amount", normalized: "amount_raw", semantic: "money" },
  { rawColumn: "Created Time", normalized: "created_at", semantic: "timestamp" },
  { rawColumn: "Closing Date", normalized: "closing_date", semantic: "timestamp" },
  { rawColumn: "Probability (%)", normalized: "probability_pct", semantic: "text" },
];

/** Operational shifts export */
export const CUSTOM_SHIFTS_MAP: ColumnMapEntry[] = [
  { rawColumn: "Shift Alias", normalized: "shift_alias", semantic: "id" },
  { rawColumn: "Shift Date", normalized: "shift_date", semantic: "timestamp" },
  { rawColumn: "Current Shift Status", normalized: "shift_status", semantic: "category" },
  { rawColumn: "Pharmacy Name", normalized: "pharmacy_name", semantic: "text" },
  { rawColumn: "Group", normalized: "group_name", semantic: "text" },
  { rawColumn: "Hours worked", normalized: "hours_worked", semantic: "text" },
  { rawColumn: "Date Created", normalized: "date_created", semantic: "timestamp" },
];
