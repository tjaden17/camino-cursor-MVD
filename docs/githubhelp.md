# GitHub Help (MVD)

Practical Git/GitHub workflows for this repo, in two modes:

- **Mode A (now):** solo, fast, low overhead
- **Mode B (later):** prod-level / scale-up rigor

---

## 1) Mode A: Solo workflow (recommended now)

Use this when you are the main contributor and want to move quickly.

### Daily loop

1. Make changes.
2. Commit small checkpoints.
3. Push to `main`.
4. Let GitHub Actions run CI automatically.

### Commands (daily solo flow)

| Command | Explainer |
|---|---|
| `git status` | Shows what changed: unstaged, staged, and untracked files. |
| `git add <files>` | Stages selected files for the next commit. |
| `git commit -m "fix(scope): short message"` | Saves a named snapshot in local history. |
| `git push` | Uploads your local commits to GitHub (`origin/main`). |

### Optional quality check before push

| Command | Explainer |
|---|---|
| `npm run ci` | Runs the repo's full quality bar (build, onboarding validation, QC, UI build). |
| `git push` | Publishes your already-checked commits to GitHub. |

Why this works for you:

- Low ceremony, fast iteration.
- Every commit is a rollback point.
- CI still runs in GitHub on push.

---

## 2) Mode B: Prod-level / scale-up workflow (when risk grows)

Use this once changes are larger, users increase, or more people contribute.

### Branch + PR loop

1. Create a branch from `main`.
2. Commit locally.
3. Push branch.
4. Open PR.
5. Wait for CI + review.
6. Merge PR to `main`.
7. Release/tag when needed.

### Commands (branch + PR flow)

| Command | Explainer |
|---|---|
| `git checkout main` | Switches to your main integration branch. |
| `git pull` | Updates local `main` from GitHub before creating a new branch. |
| `git checkout -b feat/<short-topic>` | Creates and switches to a feature branch. |
| `git add <files>` | Stages your branch changes for commit. |
| `git commit -m "feat(scope): short message"` | Saves branch progress as a reviewable checkpoint. |
| `git push -u origin feat/<short-topic>` | Pushes branch to GitHub and sets upstream tracking. |

Then open PR in GitHub UI and merge after checks pass.

---

## 3) Core Git commands and what they do

| Command | Explainer |
|---|---|
| `git status` | Shows current file state: modified, staged, untracked. |
| `git add <file>` | Stages one file for the next commit. |
| `git add .` | Stages all current changes in this folder tree (use carefully). |
| `git commit -m "..."` | Creates a local commit snapshot with a message. |
| `git push` | Sends local commits to the remote branch on GitHub. |
| `git pull` | Fetches and merges remote changes into your current branch. |
| `git log --oneline -n 10` | Shows the recent commit history in compact form. |
| `git diff` | Shows unstaged changes. |
| `git diff --cached` | Shows staged changes (what will be committed). |
| `git restore <file>` | Discards unstaged changes in a file. |
| `git reset <file>` | Unstages a file but keeps its local edits. |

---

## 4) Rollback / recovery playbook

When a future version breaks, use one of these:

### A) Return file to last commit (local fix)

| Command | Explainer |
|---|---|
| `git restore <file>` | Throws away unstaged edits in a file and restores it to the last committed state. |

### B) Revert one bad commit safely (best for shared branches)

| Command | Explainer |
|---|---|
| `git log --oneline` | Find the commit SHA you want to undo. |
| `git revert <bad_commit_sha>` | Creates a new commit that reverses the selected bad commit. |
| `git push` | Publishes the revert commit to GitHub. |

This creates a new commit that undoes the bad one (safe, auditable).

### C) Go back to an older point temporarily (local exploration)

| Command | Explainer |
|---|---|
| `git checkout <old_commit_sha>` | Moves your working tree to an older commit in detached HEAD mode for inspection/testing. |

You are in detached HEAD mode; do not keep working there long-term unless you branch.

---

## 5) Suggested commit message style

Use short, consistent conventional messages:

- `feat(qc-ui): add signal preview fallback state`
- `fix(pipeline): guard null onboarding input`
- `docs(testing): update UAT notes for 27 Mar`
- `chore(ci): align local checks with workflow`

Format:

```text
type(scope): imperative summary
```

Common `type` values: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.

---

## 6) Recommended protection path (when you scale)

Start simple, then increase rigor:

1. Keep CI required on `main`.
2. Add branch protection (no direct pushes to `main`).
3. Require PR + green checks.
4. Require at least 1 reviewer (or self-review checklist if solo).
5. Add release tags and release notes.

---

## 7) Repo-specific quick references

- CI workflow: `.github/workflows/ci.yml`
- Main quality command: `npm run ci`
- Cursor helpers:
  - `/commit` - quick commit hygiene
  - `/pr-ready` - pre-push CI parity
  - `/release` - release notes + smoke checklist

---

## 8) One-line default policy for your current context

If in doubt: **commit small, push often, run `npm run ci` before risky pushes, and `git revert` (not history rewrite) when something breaks.**
