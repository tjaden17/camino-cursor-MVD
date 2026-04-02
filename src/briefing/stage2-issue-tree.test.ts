import { describe, it, expect } from "vitest";
import { instantiateIssueTree } from "./stage2-issue-tree.js";
import { loadBriefingOrgContext } from "./load-org-context.js";
import { ingestAllSources } from "./stage1-ingest.js";

describe("stage2-issue-tree", () => {
  const org = loadBriefingOrgContext("locumate");
  const summaries = ingestAllSources(org.dataInventory);

  it("creates a tree with 4 branches", () => {
    const tree = instantiateIssueTree(org, summaries);
    expect(tree.branches.length).toBe(4);
    expect(tree.branches.map((b) => b.branchId)).toEqual([
      "volume",
      "value",
      "retention",
      "capacity",
    ]);
  });

  it("sets the root issue from org context", () => {
    const tree = instantiateIssueTree(org, summaries);
    expect(tree.rootIssue).toBe("How does Locumate reach its next stage of growth?");
  });

  it("assigns ownership — CEO to volume, CSM to retention", () => {
    const tree = instantiateIssueTree(org, summaries);

    const volume = tree.branches.find((b) => b.branchId === "volume")!;
    expect(volume.owner.role).toBe("CEO");
    expect(volume.owner.ownerSuggested).toBe(true);

    const retention = tree.branches.find((b) => b.branchId === "retention")!;
    expect(retention.owner.role).toBe("Customer Success Manager");
  });

  it("includes sub-issues with questions", () => {
    const tree = instantiateIssueTree(org, summaries);
    const volume = tree.branches.find((b) => b.branchId === "volume")!;
    expect(volume.subIssues.length).toBe(3);
    expect(volume.subIssues[0]!.subIssueId).toBe("1.1");
    expect(volume.subIssues[0]!.name).toBe("Demand Generation");
    expect(volume.subIssues[0]!.question).toBeTruthy();
  });

  it("has a formula label", () => {
    const tree = instantiateIssueTree(org, summaries);
    expect(tree.formulaLabel).toContain("Revenue");
  });
});
