/**
 * Returns the wireframe signal card fixture (overview + expanded) from the repo.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export default defineEventHandler(() => {
  const config = useRuntimeConfig();
  const root = String(config.mvdRepoRoot || "");
  const path = join(root, "fixtures/samples/signal-card-user-preview.json");
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
});
