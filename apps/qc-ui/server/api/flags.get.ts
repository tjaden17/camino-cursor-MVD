import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { FlagsFile } from "../../types/pipeline-inspector";

function readFlags(path: string): FlagsFile | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as FlagsFile;
  } catch {
    return null;
  }
}

export default defineEventHandler(() => {
  const root = String(useRuntimeConfig().mvdRepoRoot || "");
  const primary = join(root, "out", "flags.json");
  const doc = readFlags(primary) ?? readFlags(join(root, "out", "test-e2e-v2", "flags.json"));
  return doc ?? { flags: [] };
});
