/**
 * CLI: `npm run pipeline -- [options]`
 * Options: `--out <dir>`, `--onboarding <dir>`, `--skip-llm`, `--no-cache`
 */
import { join } from "node:path";
import { getRepoRoot } from "../repo-root.js";
import { runPipeline } from "./run-pipeline.js";

function parseArgs(argv: string[]): {
  outDir?: string;
  onboardingDir?: string;
  skipLlm: boolean;
  noCache: boolean;
} {
  let outDir: string | undefined;
  let onboardingDir: string | undefined;
  let skipLlm = false;
  let noCache = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out" && argv[i + 1]) {
      outDir = argv[++i];
    } else if (a === "--onboarding" && argv[i + 1]) {
      onboardingDir = argv[++i];
    } else if (a === "--skip-llm") {
      skipLlm = true;
    } else if (a === "--no-cache") {
      noCache = true;
    }
  }
  return { outDir, onboardingDir, skipLlm, noCache };
}

async function main(): Promise<void> {
  const repoRoot = getRepoRoot();
  const { outDir, onboardingDir, skipLlm, noCache } = parseArgs(process.argv.slice(2));

  const resolvedOut = outDir
    ? outDir.startsWith("/")
      ? outDir
      : join(repoRoot, outDir)
    : join(repoRoot, "out");
  const resolvedOnboarding = onboardingDir
    ? onboardingDir.startsWith("/")
      ? onboardingDir
      : join(repoRoot, onboardingDir)
    : undefined;

  let skip = skipLlm;
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    skip = true;
    if (!skipLlm) {
      console.warn("ANTHROPIC_API_KEY not set — running with --skip-llm (deterministic stub).");
    }
  }

  const result = await runPipeline({
    outDir: resolvedOut,
    onboardingDir: resolvedOnboarding,
    skipLlm: skip,
    noCache,
  });

  console.log(`Pipeline ${result.ok ? "completed" : "failed"}. Artifacts under ${result.outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
