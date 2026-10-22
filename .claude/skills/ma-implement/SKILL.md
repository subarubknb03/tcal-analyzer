---
allowed-tools: Bash(cursor-agent:*), Bash(git status:*), Bash(git diff:*), Bash(git rev-parse:*), Bash(git branch:*), Bash(mktemp:*), Bash(cp:*), Bash(uvx ty check:*), Read, Glob, Grep, Write, AskUserQuestion
description: Multi-agent implement - Grok implements from a user instruction or an existing plan file
argument-hint: <task description | plan file path>
---

# Multi-Agent Implement (ma-implement)

**Roles**: Claude interprets the input and orchestrates. Grok (cursor-agent, `grok-4.7-high`) implements. No Codex review here - run `/ma-review` afterwards for that.

**Language**: All prompts sent to Grok must be written in **English**. Report to the user in Japanese per project instructions.

## Context

- Current branch: !`git branch --show-current`
- HEAD: !`git rev-parse HEAD`
- Working tree status: !`git status --short`

**Input**: `$ARGUMENTS` - either a development task description or a path to an existing plan file (e.g. one produced by `/ma-plan` under `~/.claude/plans/`).

If `$ARGUMENTS` is empty, ask the user for the task description or plan file path with AskUserQuestion before proceeding. The input used below, referred to as `<input>`, is `$ARGUMENTS` when non-empty, otherwise the user's answer.

## Phase 1 - SETUP & INPUT MODE (Claude)

1. Verify prerequisites with `cursor-agent --version`. If it fails, stop and report.
2. Create a dedicated working directory **outside the repository** with `mktemp -d "${TMPDIR:-/tmp}/ma-implement.XXXXXX"` (explicit template so it works on both BSD and GNU mktemp; prefers `$TMPDIR` over the shared `/tmp` root), referred to as `<workdir>` below. All temp files for this run (brief or plan copy, findings) live there.
3. Determine the input mode from `<input>`: if `<input>` is a path to an existing readable file (verify with Read), it is **plan-file mode** and Phase 2B applies; otherwise it is **instruction mode** and Phase 2A applies. "Looks like a file path" is defined as: `<input>` contains a path separator (`/`), starts with `~`, or ends with a file extension such as `.md`. If `<input>` looks like a file path by that definition but is not a readable existing file, do not silently fall back to instruction mode - ask the user with AskUserQuestion (treat it as a task description / abort so they can re-run with the correct path).

## Phase 2A - BRIEF (instruction mode only)

1. Investigate the codebase (Read / Glob / Grep) to understand the code relevant to the instruction. Do not modify any repository file before the user approves the brief.
2. Write an English implementation brief to `<workdir>/brief.md` (this is `<plan-file>` for Phase 3). It must contain:
   - The task goal and acceptance criteria
   - Files to create or modify, with the intended changes (the edit scope)
   - Project conventions to follow. **Only if the task involves Python files**, include the `.claude/rules/python.md` conventions (type annotations on all functions, NumPy-style docstrings; Python code must pass `uvx ty check`). For tasks in other languages, do not include Python conventions.
   - Explicit instruction: do NOT commit, do NOT push, do NOT stage (`git add`), do NOT touch files outside the listed scope
3. Present the brief summary to the user in Japanese and get approval with AskUserQuestion (options: approve / request changes / abort). Do NOT proceed to Phase 3 until the user approves. "Request changes" is allowed at most twice; if the user still does not approve after the second revision, end the skill with `MA_IMPLEMENT_STATUS: ABORTED` - no further approval attempts. Nothing in the repository may be modified before approval.

The brief's file list is the **scope list**: the set of files whose implementation is verified in Phase 3 and type-checked in Phase 4.

## Phase 2B - PLAN FILE (plan-file mode only)

1. Resolve the user-supplied path to a single absolute path (expand `~`, resolve relative paths against the cwd) and validate with Read that it is a readable regular file.
2. Copy it byte-for-byte into the workdir: `cp -- "<resolved absolute path>" "<workdir>/plan.md"` (always with `--` and quoted, so paths containing spaces or a leading `-` are safe). The copy keeps the pass-as-is requirement - the content is untouched - while keeping user-supplied path fragments off the cursor-agent command line and avoiding `--add-dir ~/.claude/plans`, which would expose unrelated plan files to Grok. `<plan-file>` for Phase 3 is `<workdir>/plan.md`.
3. Do NOT rewrite or summarize the plan. Approval: skip the approval question ONLY when both hold: (a) this skill was invoked by an orchestrator (e.g. `/mac`) that explicitly states it is passing the just-approved plan (chained mode), and (b) the argument path is the same path as the plan approved by the most recent `ExitPlanMode` approval in this session. In every other case - standalone invocation, a different path, or no `ExitPlanMode` approval in this session - do NOT assume the file was ever approved: present a short summary of the plan in Japanese and confirm once with AskUserQuestion (proceed / abort) before implementing.
4. **Scope extraction (read-only)**: read the plan and extract the list of files it intends to create or modify (e.g. a "Files to create or modify" section). This is the **scope list** - the set of files whose implementation is verified in Phase 3 and type-checked in Phase 4. Resolve each extracted path against the repository root; if any path lies outside the repository working tree or inside `.git/`, do not follow it: ask the user with AskUserQuestion - continue with those paths removed from scope / abort. If no explicit file list can be extracted, do NOT silently invent one: ask the user with AskUserQuestion - proceed without a scope list (Phase 3 verification and Phase 4 type checking are skipped, and the final report must state that) / abort so the plan can be fixed. Extraction never modifies the plan content passed to Grok.

## Phase 3 - IMPLEMENT (Grok)

Run Grok with the brief/plan file. In both modes `<plan-file>` lives inside `<workdir>` - a Claude-generated `mktemp` path, so no user-supplied strings appear on the command line:

```bash
cursor-agent -p --sandbox enabled --trust --model grok-4.7-high --output-format text --add-dir "<workdir>" "Read the implementation plan at <plan-file> and implement it exactly. Follow the conventions listed in the plan. Do not commit or push. Do not stage files (no git add). Do not modify files outside the plan's scope."
```

Never pass `--force` / `--yolo`: it overrides `--sandbox enabled` and runs shell commands unsandboxed. With the sandbox, Grok's shell commands cannot write outside the workspace and `--add-dir` paths, and have no network access. The no-commit/no-push/no-stage/no-out-of-scope constraint is still **best-effort**: git operations inside the workspace are not blocked by the sandbox, the prompt is the only preventive control for them, and the Claude hooks in `.claude/settings.json` do not apply to the cursor-agent process. This skill does NOT detect out-of-scope changes, staging, or pushes - the post-run checks only verify the implementation result in the scope-list files plus a cheap commit/branch check. Edits by the user that land in scope-list files during the run are indistinguishable from Grok's and are accepted as part of the result.

After it finishes, run the post-run checks **in this order** - classify the process result first, and only verify the implementation when the process succeeded:

1. **Process result first**: if the output indicates an authentication error, stop and ask the user to run `cursor-agent login`. If cursor-agent exits non-zero or times out, partial changes may remain: show the current `git status --short`, list what changed in the scope-list files, and ask the user with AskUserQuestion: retry / keep the partial changes and proceed / abort. Do NOT interpret a failed run's unchanged tree as "nothing implemented" - that judgment belongs to step 4 and applies only to successful runs.
2. Compare `git rev-parse HEAD` and `git branch --show-current` with the Context snapshot above. If HEAD changed, Grok committed; if the branch changed, Grok switched branches. Either way: stop immediately and report to the user (do not rewrite history yourself).
3. **Scope verification**: for each file in the scope list, inspect it with `git diff -- <path>` (quoted, after `--`) and Read, and confirm the planned change was actually implemented. Use the Context snapshot's `git status --short` as the baseline: a scope-list file that was already dirty before the run does not by itself prove Grok implemented anything - judge the diff content against the plan. Report any scope-list file left unimplemented or clearly diverging from the plan. If Phase 2B proceeded without a scope list, skip this verification and flag it in the Phase 5 report.
4. If nothing was implemented (no scope-list file changed relative to the Context snapshot and no scope-list file was created), check Grok's output first: if it gives a reasoned explanation that the task is already satisfied and no change is needed, report that conclusion to the user (a short Phase 5-style report ending with `MA_IMPLEMENT_STATUS: NO_CHANGES_NEEDED`) and finish. Only when there is no such justification, treat it as a failure: report Grok's output to the user and stop.

## Phase 4 - TYPE CHECK (Python only, max 1 fix iteration)

If the scope list contains any `.py` / `.pyi` files that exist on disk, run `uvx ty check` on them (files planned for deletion or not yet created cannot be checked - skip those paths). Pass the paths quoted after `--`, so paths with spaces or a leading `-` are safe. User edits mixed into these files are checked as-is - that is accepted.

- **Errors reported** → classify each error first:
  - **In scope**: the error is caused by the planned change, or its fix is contained within the scope-list files → write an English fix prompt listing ONLY these errors to `<workdir>/findings.md` (passing findings via a file avoids shell-quoting breakage from quotes/backticks in error text) and send it to Grok **once**:

    ```bash
    cursor-agent -p --sandbox enabled --trust --model grok-4.7-high --output-format text --add-dir "<workdir>" "Fix the type errors listed in the file at <workdir>/findings.md in the current working tree. Read the implementation plan at <plan-file> for context. Fix ONLY the listed findings. Do not modify files outside the plan's scope. Do not commit or push. Do not stage files (no git add)."
    ```

    The Phase 3 error handling applies to this fix run as well, in the same order - process result first (authentication error → stop and ask for `cursor-agent login`; non-zero exit or timeout → show `git status --short` and ask with AskUserQuestion: retry / keep the partial changes and proceed / abort). After a successful fix run, repeat the Phase 3 post-run checks (HEAD/branch comparison and scope verification), then re-run `uvx ty check`. If errors still remain, report them in Phase 5 - do NOT iterate further.
  - **Out of scope**: the error is unrelated to the plan (pre-existing, caused by the user's own edits, or fixable only by touching files outside the scope list) → do NOT have Grok fix it; report it to the user in Phase 5 instead.
- If `uvx ty check` itself fails to run (e.g. `uv` missing, network error), that is an environment problem, not a finding: report it and ask the user with AskUserQuestion whether to skip type checking or abort.
- Skip this phase entirely when the scope list has no Python files - it must not affect work in other languages.

## Phase 5 - REPORT

Report to the user in Japanese:

- Changed files: output of `git status --short --untracked-files=all` (covers staged, unstaged, and untracked) plus `git diff --stat` for tracked-change sizes
- Implementation summary (what Grok did), including the result of the scope verification
- Input mode used: instruction mode (with the approved brief) or plan-file mode (with the plan path)
- Type check result: fixed errors, unresolved in-scope errors, and out-of-scope errors reported but deliberately not fixed - or a note that it was skipped and why
- Standing caveat: **verification covered the scope-list files only** - out-of-scope changes by Grok and user edits mixed into the working tree were not checked (if Phase 2B proceeded without a scope list, state that even scope verification and type checking were skipped)
- Path of `<workdir>` and the files it contains (brief or plan copy / findings); it is left in place for inspection
- Reminder that no HEAD change was detected across the run (nothing stronger - staging and pushes are not verified) - use `/commit` to commit. Omit this reminder in orchestrated mode (see below).
- Next step: recommend reviewing the implementation with `/ma-review <original plan path>` in plan-file mode, or `/ma-review <workdir>/brief.md` in instruction mode (the approved brief contains the scope list, enabling a scoped review). Omit this recommendation in orchestrated mode - mac runs ma-review itself.
- **Orchestrated mode**: when this skill was invoked by an orchestrator such as `/mac`, the report is an **intermediate handoff, not the end of the turn**. Keep it short, omit both the `/commit` reminder and the `/ma-review` recommendation above, emit the status line, and return control to the caller so it runs the next phase immediately - do NOT end the turn and do NOT ask the user anything.
- End the report with a single status line as the very last line: `MA_IMPLEMENT_STATUS: COMPLETED` (implementation ran and was verified), `NO_CHANGES_NEEDED` (justified no-op per Phase 3 step 4), `STOPPED` (commit/branch change detected, unimplemented without justification, or a failed run the user did not continue), or `ABORTED` (user chose abort, or brief approval was exhausted). Callers such as `/mac` branch on this line - every exit path of this skill must emit it.

## Constraints

- NEVER commit, push, or stage (`git add`); create no new staging (staged changes that existed before the run are out of scope and left as-is).
- NEVER run destructive git commands (reset, rebase, restore, force push).
- Claude never edits repository files in this skill - implementation belongs to Grok, including type-error fixes.
- Keep `<workdir>` and every temp file (brief/plan copy, findings) out of the repository working tree.
