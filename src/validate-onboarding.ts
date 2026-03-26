/**
 * CLI: `npm run validate:onboarding`
 * Validates `*-onboarding-derived.json` under `data/onboarding/` and `data/user-onboarding/`
 * (schema + duplicate `user.user_id` across folders). See `load-onboarding.ts`.
 */
import { getRepoRoot } from "./repo-root.js";
import {
  defaultOnboardingDirPaths,
  loadAndValidateProfilesFromDirs,
} from "./pipeline/load-onboarding.js";

function main(): void {
  const root = getRepoRoot();
  const dirs = defaultOnboardingDirPaths(root);
  const profiles = loadAndValidateProfilesFromDirs(dirs);
  if (profiles.length === 0) {
    console.warn(
      "validate:onboarding: no *-onboarding-derived.json files found under data/onboarding or data/user-onboarding.",
    );
    return;
  }
  console.log(`validate:onboarding OK — ${profiles.length} profile(s).`);
}

try {
  main();
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
}
