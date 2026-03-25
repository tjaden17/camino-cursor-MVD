# commit-often

# Frequent Git commits (lightweight)

Your task is to help the user **commit work to Git often**, with clear messages and sensible chunking—**without** running the full CI pipeline (that belongs in `/pr-ready` before push).

## Responsibilities

- Summarize **what would be committed**: use or describe `git status` / staged vs unstaged so accidental files (secrets, `out/`, local env) are visible before commit.
- If unrelated changes are mixed, **propose splitting** into separate commits (smaller, reviewable units).
- Draft a **conventional commit** message: `type(scope): imperative subject` (e.g. `fix(qc): align golden diff`, `feat(qc-ui): preview loading state`). Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test` as appropriate.
- Optionally suggest **quick** checks only when clearly useful (e.g. `npm run build` after TS edits)—**not** a substitute for `npm run ci` before push.

## Do not

- Do **not** require `npm run ci` or full QC here—frequent commits should stay low friction.

This command will be available in chat with /commit
