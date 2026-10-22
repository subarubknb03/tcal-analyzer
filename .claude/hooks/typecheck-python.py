"""PostToolUse hook: Type-check edited Python files with ty."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

PYTHON_SUFFIXES = (".py", ".pyi")
TY_TIMEOUT_SECONDS = 60


def run_ty(file_path: str) -> None:
    """
    Run `uvx ty check` on a single file and report failures.

    Exits with code 2 (blocking feedback to the model) when ty reports
    type errors. Exits with code 0 when the check passes or when ty
    cannot be run in this environment (uvx missing, timeout).

    Parameters
    ----------
    file_path : str
        Path to the Python file to type-check.
    """
    try:
        result = subprocess.run(
            ["uvx", "ty", "check", file_path],
            capture_output=True,
            text=True,
            timeout=TY_TIMEOUT_SECONDS,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        sys.exit(0)

    if result.returncode != 0:
        output = (result.stdout + "\n" + result.stderr).strip()
        print(
            f"ty found type errors in {file_path}:\n{output}",
            file=sys.stderr,
        )
        sys.exit(2)

    sys.exit(0)


def main() -> None:
    """
    Read the hook payload from stdin and type-check Python files.

    Non-Python files and files that no longer exist are ignored so the
    hook never interferes with edits in other languages.
    """
    payload = json.load(sys.stdin)
    file_path = payload.get("tool_input", {}).get("file_path", "")

    if not file_path.endswith(PYTHON_SUFFIXES):
        sys.exit(0)
    if not Path(file_path).is_file():
        sys.exit(0)

    run_ty(file_path)


if __name__ == "__main__":
    main()
