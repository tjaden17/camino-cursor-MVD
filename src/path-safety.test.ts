import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { getRepoRoot } from "./repo-root.js";
import { assertPathUnderRepo } from "./path-safety.js";

describe("assertPathUnderRepo", () => {
  const root = getRepoRoot();

  it("allows paths inside the repo", () => {
    expect(() =>
      assertPathUnderRepo(root, join(root, "data", "onboarding"), "--in"),
    ).not.toThrow();
  });

  it("rejects paths outside the repo", () => {
    expect(() => assertPathUnderRepo(root, join(root, "..", "..", "etc", "passwd"), "--in")).toThrow(
      /must stay under the repository root/,
    );
  });

  it("allows the repo root itself as a directory target", () => {
    expect(() => assertPathUnderRepo(root, root, "--out-dir")).not.toThrow();
  });
});
