/**
 * Prevent CLI path arguments from escaping the repository root (e.g. `--in ../secrets`).
 */
import { resolve, sep } from "node:path";

export function assertPathUnderRepo(repoRoot: string, candidatePath: string, label: string): void {
  const root = resolve(repoRoot);
  const target = resolve(candidatePath);
  const prefix = root.endsWith(sep) ? root : root + sep;
  if (target !== root && !target.startsWith(prefix)) {
    throw new Error(`${label} must stay under the repository root: ${root}`);
  }
}
