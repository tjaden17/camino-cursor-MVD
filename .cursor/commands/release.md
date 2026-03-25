# release

# Production-style release checklist

Your task is to help the user prepare a **release** (version, notes, smoke checks, tagging)—not to implement deploy automation (this repo has no prod deploy job in CI yet).

## Versioning

- From **git history** since the **last tag** (if any), infer a **semver** bump: patch (fixes), minor (additive behavior), major (breaking). If **no tags** exist, treat this as **first release** (often `0.1.0` or `1.0.0` per team convention) and say so explicitly.
- Suggest a **tag name** (e.g. `v0.2.0`) consistent with `package.json` `version` if applicable.

## Release notes

- Draft **short release notes**: user-facing bullets + technical notes (migrations, fixture changes, API/env vars).

## Smoke / UAT pointers

- Point to manual checks under [`docs/testing/`](../../docs/testing/) (e.g. [`signal-preview-uat.md`](../../docs/testing/signal-preview-uat.md)) and QC UI URLs from [`README.md`](../../README.md) (dashboard and `/preview/signal` on port 3050 when running locally).

## GitHub release (outline)

- Outline steps: create annotated tag (`git tag -a vX.Y.Z -m "..."`), push tag, create **GitHub Release** with the drafted notes—or match whatever process the team uses.

## Scope

- Document **current** process only; do not add CI deploy jobs unless the user asks.

This command will be available in chat with /release
