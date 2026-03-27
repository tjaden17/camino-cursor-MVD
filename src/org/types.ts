import type { StrategyCatalogueFile } from "../pipeline/strategy-types.js";

/**
 * Org-level context for MVD v1.1 (merged from per-user onboarding for pipeline + strategy).
 */
export interface OrgContextFile {
  kind: "org_context";
  version: 1;
  /** Slug derived from org name, safe for filenames */
  orgId: string;
  orgName: string;
  /** Single org-level snapshot after merge (Decision 6: role-based tie-break) */
  mergedCompanyContext: Record<string, unknown>;
  /** Per-user slices retained for transparency */
  contributors: Array<{
    userId: string;
    displayName: string;
    role: string;
    roleRank: number;
  }>;
  generatedAt: string;
  /**
   * When present, mirrors `out/strategy-catalogue.json` for file-review AC (Decision 12).
   * Written under `data/org/{orgId}.json`; not duplicated in `out/org-context.json` to avoid drift.
   */
  strategyCatalogue?: StrategyCatalogueFile;
}
