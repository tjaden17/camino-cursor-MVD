/**
 * Prefer `out/<name>.json`, then E2E test output `out/test-e2e-v2/<name>.json`.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

export function resolveOutJsonPath(
  repoRoot: string,
  fileName: string,
): { path: string; label: string } | null {
  const primary = join(repoRoot, "out", fileName);
  if (existsSync(primary)) return { path: primary, label: `out/${fileName}` };
  const e2e = join(repoRoot, "out", "test-e2e-v2", fileName);
  if (existsSync(e2e)) return { path: e2e, label: `out/test-e2e-v2/${fileName}` };
  return null;
}
