---
allowed-tools: Bash(git commit:*), AskUserQuestion
description: Create a git commit
disable-model-invocation: true
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your task

1. Analyze the diff content to understand the nature and purpose of the changes
2. Decide what to commit and stage it with git add
   - Default: stage all changes that belong to a single logical unit of work.
   - If there are other related changes not yet staged, ask the User whether to `git add` them.
   - If already-staged changes do not belong to this commit, unstage them with `git restore --staged`.
3. Generate 3 commit message candidates based on the changes
   - Each candidate should be concise, clear, and capture the essence of the changes
   - Use bracketed prefix format (e.g. `[fix] correct login validation`). Choose the prefix based on these rules:
     - `[fix]`: Use when fixing a problem in an existing feature
     - `[hotfix]`: Use when adding an urgent change
     - `[add]`: Use when adding a new file or feature
     - `[feat]`: Use when adding a new feature or file
     - `[update]`: Use when modifying an existing feature that has no problem
     - `[change]`: Use when modifying an existing feature due to a specification change
     - `[refactor]`: Use when rewriting and improving code
     - `[improve]`: Use when improving code quality
     - `[disable]`: Use when temporarily disabling a feature
     - `[delete]`: Use when deleting a file or removing a feature
     - `[rename]`: Use when renaming a file
     - `[move]`: Use when moving a file
     - `[upgrade]`: Use when upgrading a version
     - `[revert]`: Use when reverting to a previous commit
     - `[docs]`: Use when modifying documentation
     - `[style]`: Use when fixing coding style
     - `[perf]`: Use when improving code performance
     - `[test]`: Use when modifying or adding test code
     - `[chore]`: Use for auto-generated files from build tools or libraries, or changes that do not fit any of the above prefixes
4. Select the most appropriate commit message from the 3 candidates and explain the reasoning for your choice
5. Execute git commit using the selected commit message

## Constraints

- DO NOT add Claude co-authorship footer to commits
