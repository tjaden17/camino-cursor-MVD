/**
 * CLI: `npm run pipeline -- [options]`
 * Options: `--out <dir>`, `--onboarding <dir>`, `--skip-llm`, `--no-cache`
 */
import { isAbsolute, join } from "node:path";
import { logError, logInfo } from "../logging/logger.js";
import { assertPathUnderRepo } from "../path-safety.js";
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
    ? isAbsolute(outDir)
      ? outDir
      : join(repoRoot, outDir)
    : join(repoRoot, "out");
  const resolvedOnboarding = onboardingDir
    ? isAbsolute(onboardingDir)
      ? onboardingDir
      : join(repoRoot, onboardingDir)
    : undefined;

  assertPathUnderRepo(repoRoot, resolvedOut, "--out");
  if (resolvedOnboarding !== undefined) {
    assertPathUnderRepo(repoRoot, resolvedOnboarding, "--onboarding");
  }

  let skip = skipLlm;
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    skip = true;
    if (!skipLlm) {
      logInfo({
        event: "pipeline_skip_llm_no_api_key",
        message: "ANTHROPIC_API_KEY not set — running with --skip-llm (deterministic stub).",
      });
    }
  }

  const result = await runPipeline({
    outDir: resolvedOut,
    onboardingDir: resolvedOnboarding,
    skipLlm: skip,
    noCache,
  });

  logInfo({
    event: "pipeline_cli_done",
    ok: result.ok,
    outDir: result.outDir,
  });
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  logError({ event: "pipeline_cli_failed", error: msg });
  process.exitCode = 1;
});
