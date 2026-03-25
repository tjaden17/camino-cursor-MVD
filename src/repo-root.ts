/**
 * Resolves the Camin-MVD repository root so CSV, fixtures, and schemas load
 * correctly when cwd is not the repo root (e.g. Nitro dev server in apps/qc-ui).
 *
 * Priority:
 * 1. MVD_REPO_ROOT environment variable (absolute path)
 * 2. Walk upward from this file's directory until package.json has "name": "camin-mvd"
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function readPkgName(dir: string): string | undefined {
  const p = join(dir, "package.json");
  if (!existsSync(p)) return undefined;
  try {
    const j = JSON.parse(readFileSync(p, "utf8")) as { name?: string };
    return j.name;
  } catch {
    return undefined;
  }
}

/** Walk up from startDir until a package.json with matching name is found. */
export function findRepoRootByPackageName(startDir: string, packageName: string): string {
  let dir = resolve(startDir);
  for (let i = 0; i < 20; i++) {
    if (readPkgName(dir) === packageName) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: assume src/ layout (this file lives in src/)
  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}

export function getRepoRoot(): string {
  if (process.env.MVD_REPO_ROOT) {
    return resolve(process.env.MVD_REPO_ROOT);
  }
  const here = dirname(fileURLToPath(import.meta.url));
  return findRepoRootByPackageName(here, "camin-mvd");
}
