/**
 * Discover and validate onboarding-derived JSON files under a directory.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createMvdValidator } from "../validate/ajv.js";

const SUFFIX = "-onboarding-derived.json";

export interface LoadedProfile {
  path: string;
  /** Lowercase slug from file / schema */
  userId: string;
  raw: unknown;
}

export function listOnboardingFiles(onboardingDir: string): string[] {
  const names = readdirSync(onboardingDir);
  return names
    .filter((n) => n.endsWith(SUFFIX))
    .map((n) => join(onboardingDir, n))
    .sort();
}

export function loadAndValidateProfiles(onboardingDir: string): LoadedProfile[] {
  const ajv = createMvdValidator();
  const validate = ajv.getSchema("https://camin.local/schemas/onboarding-profile.json");
  if (!validate) throw new Error("Missing onboarding-profile schema in validator");

  const paths = listOnboardingFiles(onboardingDir);
  const out: LoadedProfile[] = [];
  for (const p of paths) {
    const raw = JSON.parse(readFileSync(p, "utf8")) as unknown;
    if (!validate(raw)) {
      throw new Error(`Invalid onboarding JSON ${p}: ${ajv.errorsText()}`);
    }
    const userId = extractUserId(raw, p);
    out.push({ path: p, userId, raw });
  }
  return out;
}

function extractUserId(raw: unknown, path: string): string {
  const o = raw as { user?: { user_id?: string } };
  const id = o.user?.user_id?.trim().toLowerCase();
  if (!id) throw new Error(`Missing user.user_id in ${path}`);
  return id;
}

/** Default repo-relative onboarding roots: canonical `data/onboarding` + upload drop zone `data/user-onboarding`. */
export function defaultOnboardingDirPaths(repoRoot: string): string[] {
  return [join(repoRoot, "data", "onboarding"), join(repoRoot, "data", "user-onboarding")];
}

/**
 * Load and validate `*-onboarding-derived.json` from each directory.
 * Skips directories that do not exist. Fails if the same `user.user_id` appears in more than one file (across all dirs).
 */
export function loadAndValidateProfilesFromDirs(dirs: string[]): LoadedProfile[] {
  const byUserId = new Map<string, string>();
  const out: LoadedProfile[] = [];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    const batch = loadAndValidateProfiles(dir);
    for (const p of batch) {
      const prev = byUserId.get(p.userId);
      if (prev !== undefined) {
        throw new Error(
          `Duplicate user_id "${p.userId}": ${p.path} conflicts with ${prev}. Remove or rename one file.`
        );
      }
      byUserId.set(p.userId, p.path);
      out.push(p);
    }
  }
  return out;
}
