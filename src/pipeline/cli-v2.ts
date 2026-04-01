/**
 * CLI: `npm run pipeline:v2 -- [options]`
 *
 * Runs RAG pipeline v2 (compute + RAG + optional Claude analysis/synthesis).
 * Default: real Anthropic calls when ANTHROPIC_API_KEY is set.
 *
 * Options:
 *   --out <dir>     Output directory (default: out). Use out/test-e2e-v2 to match Vitest layout.
 *   --users <list>  Comma-separated user ids (default: surge,sam)
 *   --skip-llm      Deterministic stubs only (no API key required; same as E2E test)
 */
import { isAbsolute, join } from "node:path";
import { logError, logInfo } from "../logging/logger.js";
import { assertPathUnderRepo } from "../path-safety.js";
import { getRepoRoot } from "../repo-root.js";
import { runPipelineV2 } from "./stages/run-pipeline-v2.js";

function parseArgs(argv: string[]): {
  outDir?: string;
  userIds: string[];
  skipLlm: boolean;
} {
  let outDir: string | undefined;
  let userIds: string[] = ["surge", "sam"];
  let skipLlm = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out" && argv[i + 1]) {
      outDir = argv[++i];
    } else if (a === "--users" && argv[i + 1]) {
      userIds = argv[++i]
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    } else if (a === "--skip-llm") {
      skipLlm = true;
    }
  }
  return { outDir, userIds, skipLlm };
}

async function main(): Promise<void> {
  const repoRoot = getRepoRoot();
  const { outDir, userIds, skipLlm } = parseArgs(process.argv.slice(2));

  const resolvedOut = outDir
    ? isAbsolute(outDir)
      ? outDir
      : join(repoRoot, outDir)
    : join(repoRoot, "out");

  assertPathUnderRepo(repoRoot, resolvedOut, "--out");

  if (!skipLlm && !process.env.ANTHROPIC_API_KEY?.trim()) {
    logError({
      event: "pipeline_v2_cli_no_api_key",
      message:
        "ANTHROPIC_API_KEY is not set. Export it for real Claude output, or pass --skip-llm for deterministic stubs.",
    });
    process.exitCode = 1;
    return;
  }

  logInfo({
    event: "pipeline_v2_cli_start",
    outDir: resolvedOut,
    userIds,
    skipLlm,
    llmMode: skipLlm ? "stub" : "anthropic",
  });

  const result = await runPipelineV2({
    userIds,
    outDir: resolvedOut,
    skipLlm,
  });

  logInfo({
    event: "pipeline_v2_cli_done",
    ok: result.ok,
    outDir: result.outDir,
    runId: result.output.runId,
  });
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  logError({ event: "pipeline_v2_cli_failed", error: msg });
  process.exitCode = 1;
});
