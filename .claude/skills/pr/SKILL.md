---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git push:*), Bash(gh pr create:*), Bash(gh pr view:*), Bash(gh pr checks:*), Bash(gh pr list:*), AskUserQuestion
description: Create a GitHub Pull Request using the GitHub CLI
argument-hint: "[base-branch] (default: main)"
disable-model-invocation: true
---

# Create Pull Request

**Language**: All PR titles, body content, and output must be written in **English**.

## Phase 1 - DETERMINE

**input**: `$ARGUMENTS` - optional, may contain a base branch name and/or flags (e.g., `--draft`).

**Parse `$ARGUMENTS`**:
- Extract any recognized flags (`--draft`)
- Treat remaining non-flag text as the base branch name
- Default base branch to `main` if none specified

---

## Phase 2 - VALIDATE

Check preconditions:

```bash
git branch --show-current
git status --short
git log origin/<base>..HEAD --oneline
```

| Check | Condition | Action if Failed |
|---|---|---|
| Not on base branch | Current branch ≠ base | Stop: "Switch to a feature branch first." |
| Clean working directory | No uncommitted changes | Warn: "You have uncommitted changes. Commit or stash first." |
| Has commits ahead | `git log origin/<base>..HEAD` not empty | Stop: "No commits ahead of `<base>`. Nothing to PR." |
| No existing PR | `gh pr list --head <branch> --json number` is empty | Stop: "PR already exists: #<number>. Use `gh pr view <number> --web` to open it." |

If all checks pass, proceed.

---

## Phase 3 - DISCOVER

### Pull Request

Search for PR template in order:

1. `.github/PULL_REQUEST_TEMPLATE/` directory — if exists, list files and let user choose (or use `default.md`)
2. `.github/PULL_REQUEST_TEMPLATE.md`
3. `.github/pull_request_template.md`
4. `docs/pull_request_template.md`

If found, read it and use its structure for the PR body.

---

## Phase 4 — PUSH

```bash
git push -u origin HEAD
```

If push fails due to divergence:
```bash
git fetch origin
git rebase origin/<base>
git push -u origin HEAD
```

If rebase conflicts occur, stop and inform the user.

---

## Phase 5 - CREATE

### With Template

If a PR template was found in Phase 2, fill in each section using the commit and file analysis. Preserve all template sections — leave sections as "N/A" if not applicable rather than removing them.


### Without Template

Use this default format:

#### Title 

Write a concise title (≤ 72 characters) with a bracketed prefix that reflects the dominant type of change across the commits:

- `[fix]`: fixing a problem in an existing feature
- `[hotfix]`: urgent change
- `[add]`: adding a new file or feature
- `[feat]`: adding a new feature or file
- `[update]`: modifying an existing feature that has no problem
- `[change]`: modifying an existing feature due to a specification change
- `[refactor]`: rewriting and improving code
- `[improve]`: improving code quality
- `[disable]`: temporarily disabling a feature
- `[delete]`: deleting a file or removing a feature
- `[rename]`: renaming a file
- `[move]`: moving a file
- `[upgrade]`: upgrading a version
- `[revert]`: reverting to a previous commit
- `[docs]`: modifying documentation
- `[style]`: fixing coding style
- `[perf]`: improving code performance
- `[test]`: modifying or adding test code
- `[chore]`: auto-generated files or changes that do not fit any of the above

#### Body

Follow the Markdown format below:

```markdown
## Summary

<!-- 1-2 sentence description of what this PR does and why -->

## Related Issue

<!-- include only if a related issue exists; omit this section entirely if none -->

## Type of Change
- [ ] fix: fixing a problem in an existing feature
- [ ] hotfix: urgent change
- [ ] add: adding a new file or feature
- [ ] feat: adding a new feature or file
- [ ] update: modifying an existing feature that has no problem
- [ ] change: modifying an existing feature due to a specification change
- [ ] refactor: rewriting and improving code
- [ ] improve: improving code quality
- [ ] disable: temporarily disabling a feature
- [ ] delete: deleting a file or removing a feature
- [ ] rename: renaming a file
- [ ] move: moving a file
- [ ] upgrade: upgrading a version
- [ ] revert: reverting to a previous commit
- [ ] docs: modifying documentation
- [ ] style: fixing coding style
- [ ] perf: improving code performance
- [ ] test: modifying or adding test code
- [ ] chore: auto-generated files or changes that do not fit any of the above

## What Changed

## Why This Change

## Test Plan

## Impact Scope

## Review Points
```

### Create the PR

```bash
gh pr create \
  --title "<PR title>" \
  --base <base-branch> \
  --body "<PR body>"
  # Add --draft if the --draft flag was parsed from $ARGUMENTS
```

---

## Phase 6 - VERIFY

```bash
gh pr view --json number,url,title,state,baseRefName,headRefName,additions,deletions,changedFiles
gh pr checks --json name,status,conclusion 2>/dev/null || true
```

---

## Phase 7 — OUTPUT

Report to user:

```
PR #<number>: <title>
URL: <url>
Branch: <head> → <base>
Changes: +<additions> -<deletions> across <changedFiles> files

CI Checks: <status summary or "pending" or "none configured">

Next steps:
  - gh pr view <number> --web   → open in browser
  - gh pr merge <number>        → merge when ready
```

---

## Edge Cases

- **No `gh` CLI**: Stop with: "GitHub CLI (`gh`) is required. Install: <https://cli.github.com/>"
- **Not authenticated**: Stop with: "Run `gh auth login` first."
- **Multiple PR templates**: If `.github/PULL_REQUEST_TEMPLATE/` has multiple files, list them and ask user to choose.
- **Large PR (>20 files)**: Warn about PR size. Suggest splitting if changes are logically separable.

