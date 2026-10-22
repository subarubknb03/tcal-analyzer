"""PreToolUse hook: Block reading secrets from .env files."""

from __future__ import annotations

import json
import re
import sys

ENV_FILE_PATTERN = re.compile(r"(^|/)\.env($|\.)")
BASH_READ_PATTERN = re.compile(r"(cat|head|tail|sed|awk|grep)\s+.*[/\\]?\.env($|\.)")
BASH_REDIRECT_PATTERN = re.compile(r"<\s*\.env($|\.)")


def block(reason: str) -> None:
    """
    Print a block message to stderr and exit with code 2.

    Parameters
    ----------
    reason : str
        Description of the blocked tool call.
    """
    print(
        f"BLOCKED: Reading secrets from .env files is not allowed ({reason})",
        file=sys.stderr,
    )
    sys.exit(2)


def is_env_file_path(file_path: str) -> bool:
    """
    Check whether a file path points to a .env file.

    Backslashes are normalized to forward slashes so that Windows-style
    paths are matched as well.

    Parameters
    ----------
    file_path : str
        The file path to check.

    Returns
    -------
    bool
        True if the path refers to a .env file, False otherwise.
    """
    return ENV_FILE_PATTERN.search(file_path.replace("\\", "/")) is not None


def main() -> None:
    """
    Read the hook payload from stdin and block .env access.

    Exits with code 2 when the tool call reads a .env file, otherwise
    exits with code 0.
    """
    payload = json.load(sys.stdin)
    tool_name = payload.get("tool_name", "")
    tool_input = payload.get("tool_input", {})

    if tool_name == "Read":
        file_path = tool_input.get("file_path", "")
        if is_env_file_path(file_path):
            block(f"Read: {file_path}")

    elif tool_name == "Bash":
        command = tool_input.get("command", "")
        if BASH_READ_PATTERN.search(command) or BASH_REDIRECT_PATTERN.search(command):
            block(f"Bash: {command}")

    sys.exit(0)


if __name__ == "__main__":
    main()
