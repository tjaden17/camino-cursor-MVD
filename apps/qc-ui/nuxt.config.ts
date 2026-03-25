import { fileURLToPath } from "node:url";

/** Camin-MVD repo root (parent of apps/) — used so Nitro can load data/ and schemas/. */
const mvdRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  runtimeConfig: {
    /** Override with absolute path if auto-detection fails */
    mvdRepoRoot: process.env.MVD_REPO_ROOT || mvdRoot,
    public: {
      /** Shown in QC UI for orientation (local dev only) */
      mvdRepoRoot: process.env.MVD_REPO_ROOT || mvdRoot,
    },
  },
});
