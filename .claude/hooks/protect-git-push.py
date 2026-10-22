"""PreToolUse hook: Block force pushes and direct pushes to main."""

from __future__ import annotations

import json
import re
import sys

COMMAND_SEPARATOR_PATTERN = re.compile(r"&&|\|\||;|\|")
GIT_PUSH_PATTERN = re.compile(r"\bgit\s+push\b")
FORCE_FLAG_PATTERN = re.compile(r"(^|\s)(--force(-with-lease|-if-includes)?(=\S+)?|-f)(\s|$)")
MAIN_TARGET_PATTERN = re.compile(r"(^|\s)(\S+:)?main(\s|$)")


def block(reason: str) -> None:
    """
    Print a block message to stderr and exit with code 2.

    Parameters
    ----------
    reason : str
        Description of the blocked tool call.
    """
    print(
        f"BLOCKED: Force pushes and pushes to main are not allowed ({reason})",
        file=sys.stderr,
    )
    sys.exit(2)


def is_forbidden_push(subcommand: str) -> bool:
    """
    Check whether a subcommand is a force push or a push targeting main.

    Parameters
    ----------
    subcommand : str
        A single shell subcommand (already split on shell separators).

    Returns
    -------
    bool
        True if the subcommand is a `git push` with a force flag in any
        position, or with `main` as the destination (including refspec
        forms such as `HEAD:main`), False otherwise.
    """
    match = GIT_PUSH_PATTERN.search(subcommand)
    if match is None:
        return False
    args = subcommand[match.end():]
    return (
        FORCE_FLAG_PATTERN.search(args) is not None
        or MAIN_TARGET_PATTERN.search(args) is not None
    )


def main() -> None:
    """
    Read the hook payload from stdin and block forbidden git pushes.

    Exits with code 2 when the Bash command contains a force push or a
    push to main, otherwise exits with code 0.
    """
    payload = json.load(sys.stdin)
    tool_name = payload.get("tool_name", "")
    tool_input = payload.get("tool_input", {})

    if tool_name == "Bash":
        command = tool_input.get("command", "")
        for subcommand in COMMAND_SEPARATOR_PATTERN.split(command):
            if is_forbidden_push(subcommand):
                block(f"Bash: {command}")

    sys.exit(0)


if __name__ == "__main__":
    main()
