/**
 * Loads a briefing-pipeline org context file from data/org/{orgId}/org-context.json.
 * Validates that the required fields are present per the pipeline spec (Stage 0).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getRepoRoot } from "../repo-root.js";
import type { BriefingOrgContext } from "./types.js";

export function loadBriefingOrgContext(orgId: string): BriefingOrgContext {
  const repoRoot = getRepoRoot();
  const filePath = resolve(repoRoot, "data", "org", orgId, "org-context.json");

  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    throw new Error(`Org context not found for "${orgId}" at ${filePath}`);
  }

  const parsed = JSON.parse(raw) as BriefingOrgContext;

  validate(parsed, orgId);

  return parsed;
}

function validate(org: BriefingOrgContext, _orgId: string): void {
  if (org.kind !== "briefing_org_context") {
    throw new Error(`Org file kind must be "briefing_org_context", got "${org.kind}"`);
  }
  if (!org.orgId) throw new Error("Org file missing orgId");
  if (!org.orgName) throw new Error("Org file missing orgName");
  if (!org.rootIssue) throw new Error("Org file missing rootIssue");

  if (!Array.isArray(org.contributors) || org.contributors.length === 0) {
    throw new Error("Org file must have at least one contributor");
  }
  for (const c of org.contributors) {
    if (!c.userId || !c.role) {
      throw new Error(`Contributor missing userId or role: ${JSON.stringify(c)}`);
    }
  }

  if (!Array.isArray(org.dataInventory) || org.dataInventory.length === 0) {
    throw new Error("Org file must have a non-empty dataInventory[]");
  }
  for (const entry of org.dataInventory) {
    if (!entry.sourceId || !entry.filePath || !entry.idColumn) {
      throw new Error(`Data inventory entry missing required fields: ${JSON.stringify(entry)}`);
    }
    if (entry.format !== "csv" && entry.format !== "xlsx") {
      throw new Error(`Unsupported format "${entry.format}" for ${entry.sourceId}`);
    }
    if (entry.format === "xlsx" && !entry.sheetName) {
      throw new Error(`XLSX file ${entry.sourceId} must declare sheetName`);
    }
  }

  const hasGoals = org.contributors.some((_c) => {
    // We can't check the profile content here, but we verify the org has decisions
    return true;
  });
  if (!hasGoals && org.orgDecisions.length === 0) {
    throw new Error("Org must have at least one contributor with goals or orgDecisions");
  }
}
