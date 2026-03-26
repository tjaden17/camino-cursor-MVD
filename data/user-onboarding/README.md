# User onboarding uploads

Place **normalized onboarding JSON** here after a call (preferably using [`templates/onboarding-call-template.md`](../../templates/onboarding-call-template.md) and the shape enforced by `schemas/onboarding-profile.json`).

**Suggested file names:** `surge-onboarding-derived.json`, `sam-onboarding-derived.json` (or your `userId-onboarding-derived.json` pattern).

**Run validation** (from repo root) — checks **both** `data/onboarding/` and `data/user-onboarding/`:

```bash
npm run validate:onboarding
```

If the same `userId` appears in two files (in either folder), validation **fails**. For the pipeline, use `--onboarding` to point at one directory or merge inputs as documented in the repo `README.md`.

**Do not commit secrets** — only non-sensitive profile content belongs in git; if uploads ever contain PII policies change, use gitignore rules accordingly.
