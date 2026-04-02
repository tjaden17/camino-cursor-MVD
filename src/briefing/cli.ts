#!/usr/bin/env node
/**
 * CLI entrypoint for the briefing pipeline.
 * Usage: npx tsx src/briefing/cli.ts --org locumate [--skip-llm]
 */
import { runBriefingPipeline } from "./run-briefing-pipeline.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const orgIndex = args.indexOf("--org");
  const orgId = orgIndex >= 0 ? args[orgIndex + 1] : undefined;
  const skipLlm = args.includes("--skip-llm");

  if (!orgId) {
    console.error("Usage: npx tsx src/briefing/cli.ts --org <orgId> [--skip-llm]");
    process.exit(1);
  }

  if (!skipLlm && !process.env.ANTHROPIC_API_KEY?.trim()) {
    console.error(
      "Error: ANTHROPIC_API_KEY not set. Pass --skip-llm for stub mode, or set the env var.",
    );
    process.exit(1);
  }

  try {
    await runBriefingPipeline({ orgId, skipLlm });
  } catch (err) {
    console.error("Pipeline failed:", err);
    process.exit(1);
  }
}

main();
