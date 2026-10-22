---
allowed-tools: Skill, Read, AskUserQuestion
description: Multi-agent pipeline - run ma-plan, ma-implement, ma-review in sequence
argument-hint: <task description>
disable-model-invocation: true
---

# Multi-Agent Coding (MAC)

**Roles**: mac is a thin orchestrator: it runs `/ma-plan`, `/ma-implement`, and `/ma-review` once each, in that order, via the Skill tool. All phase logic (Codex plan review, plan approval, Grok implementation, scope verification, type checking, code review verdicts) belongs to the sub-skills - mac never re-implements it.

**Execution model**: a Skill invocation loads the sub-skill's instructions into the current Claude context and Claude executes them itself - there is no separate process and no mechanical return value. The plan-file path and each phase's results stay available in-context; mac only defines which sub-skill runs, with which argument, in which order, and when to stop.

**Language**: sub-skills define the language of prompts sent to external agents (English). Report to the user in Japanese, conclusion first, no preamble, per CLAUDE.md.

## Continuation rule

A sub-skill's final report is an **intermediate handoff to mac, not the end of mac's output**. This rule governs every phase transition and overrides the natural pull to stop after a detailed report:

- As soon as a sub-skill emits its `MA_*_STATUS:` line, invoke the next phase's sub-skill with the Skill tool **in the same turn**. Do not end the turn, do not wait for user input, do not ask a "continue?" confirmation, and do not re-summarize the previous phase's result at the boundary.
- The only points where mac's turn may end are: the Phase 4 report, or a stop/abort status that forbids the next phase.
- The only permitted mid-pipeline pauses are the `AskUserQuestion` prompts defined inside the sub-skills themselves and the `ExitPlanMode` approval inside ma-plan (Phase 1).
- At each transition, emit a single marker line naming the next sub-skill before invoking it, e.g. `MAC_PHASE: implement done -> next ma-review`. If the conversation is compacted mid-pipeline, use `<plan-file>` plus the most recent `MA_*_STATUS` line to determine the resume point and continue the pipeline - never treat a compacted-away pipeline as finished.

**Input**: `$ARGUMENTS` - the development task to perform.

If `$ARGUMENTS` is empty, ask the user for the task description with AskUserQuestion before proceeding. The task input used below, referred to as `<task>`, is `$ARGUMENTS` when non-empty, otherwise the user's answer.

## Phase 1 - PLAN (via /ma-plan)

Invoke the `ma-plan` skill with the Skill tool, passing `<task>` as the argument. ma-plan handles entering plan mode, the Codex plan review loop, and the whole approval/revision loop via `ExitPlanMode` - mac never revises the plan itself.

- **Status handoff**: ma-plan ends with a `MA_PLAN_STATUS:` line. Proceed to Phase 2 only on the post-approval pair `MA_PLAN_STATUS: APPROVED` immediately followed by `PLAN_FILE: <absolute path>` - that path is `<plan-file>` (under `~/.claude/plans/`). On `NOT_APPROVED` or `ABORTED` (codex failure, plan mode could not be entered, etc.), or if the status pair is missing, abort mac entirely and report.
- Before starting Phase 2, confirm with Read that `<plan-file>` exists and is readable; if it cannot be read, abort and report instead of starting the next phase.

## Phase 2 - IMPLEMENT (via /ma-implement)

After plan approval, Claude does NOT start implementing directly - this overrides the normal "implement after approval" plan-mode flow, and is the core of this skill. Symmetrically, mac does NOT stop when ma-implement's report appears: that report is a handoff, not mac's final output, and Phase 3 follows it in the same turn per the Continuation rule. Instead, invoke the `ma-implement` skill with the Skill tool, passing the absolute path of `<plan-file>` as the argument (plan-file mode). Invoke it explicitly in **chained mode**: state in the invocation that `<plan-file>` is the plan just approved via `ExitPlanMode` in this session - that statement plus the matching path is ma-implement's condition for skipping its standalone plan-confirmation question.

- **Status handoff**: ma-implement ends with a `MA_IMPLEMENT_STATUS:` line. On `COMPLETED`, **immediately invoke `ma-review` (Phase 3) with the Skill tool in the same turn** - do not stop to summarize the implementation, do not mention `/commit`, do not wait for the user. On `NO_CHANGES_NEEDED` (a justified "already satisfied" result - a successful outcome, not a failure), skip Phase 3 - there is nothing to review - and go to Phase 4, reporting the pipeline outcome as "no changes needed, review skipped". On `STOPPED` or `ABORTED` (commit detected, unimplemented without justification, authentication error, user chose abort after a partial run, etc.), or if the status line is missing, mac stops with that report and does not run the next phase.

## Phase 3 - REVIEW (via /ma-review)

Invoke the `ma-review` skill with the Skill tool, passing the absolute path of `<plan-file>` as the argument (plan-file mode). Plan-alignment verification, the review itself, and finding reporting (severities, in/out scope, output-contract violations) all follow ma-review's definition.

- **Status handoff**: ma-review ends with a `MA_REVIEW_STATUS:` line. On `COMPLETED`, proceed to Phase 4 in the same turn. On `INVALID_OUTPUT`, proceed to Phase 4 in the same turn but report that no valid review verdict was obtained - never summarize as if a verified verdict existed. On `NOTHING_TO_REVIEW` or `ABORTED` (codex failure, etc.), or if the status line is missing, mac stops with that report.

## Phase 4 - REPORT

No fix loop: mac runs each sub-skill once and never re-judges ma-review's results (verdict / plan-alignment / findings) - present them as reported. The sub-skills have already shown their detailed reports; consolidate without repeating them verbatim. Report the summary to the user in Japanese, conclusion first:

- Start with the overall pipeline outcome: whether all three phases completed, where the pipeline stopped, or that review was skipped because of `NO_CHANGES_NEEDED`
- The `<plan-file>` path, the implementation summary (from ma-implement's report), and the review result (from ma-review's report: verdict, plan-alignment, each finding; on `INVALID_OUTPUT`, state that no valid verdict was obtained instead)
- Next steps: fix findings via `/ma-implement` (passing the findings as the task description) or manually; re-review with `/ma-review <plan-file>` if needed; commit via `/commit` (same guidance as ma-review's report)
- **Verification-scope caveat (explicit regression vs the old mac)**: no baseline comparison is performed, so out-of-scope changes, staging, and pushes are not mechanically detected; ma-implement's verification covers only the scope-list files plus the HEAD/branch comparison. State "no commit" strictly as "no HEAD change was detected across the run", nothing stronger.

## Constraints

- mac itself NEVER edits repository files; implementation belongs to ma-implement (Grok) and review to ma-review (Codex).
- NEVER commit, push, or stage (`git add`) - each sub-skill's constraints apply as-is.
- If a sub-skill reports a stop or abort, mac does not proceed to any later phase.
- No automatic fix cycles of any kind; fixes happen only when the user explicitly re-runs `/ma-implement`.
