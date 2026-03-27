# QC UI (Nuxt)

Local quality-check and transparency pages for MVD (signal preview, KPI dictionary, org context).

## Security

This app is intended for **local / trusted developer machines**. API routes read JSON directly from the configured repo root (`mvdRepoRoot`). **Do not expose** the built server to the public internet without authentication and path hardening.

## Development

See the repo root `package.json` scripts (`qc-ui:build`, `qc-ui:dev`).
