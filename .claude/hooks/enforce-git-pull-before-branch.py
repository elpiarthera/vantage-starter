#!/usr/bin/env python3
"""
PreToolUse hook — block branch creation when current branch is behind its remote.

Triggers on:
  git checkout -b <branch>
  git switch -c <branch>
  git branch <branch> (bare branch creation without switching)

Behaviour:
  1. Run git fetch (silent) to refresh remote refs.
  2. Compare HEAD vs @{u} (upstream tracking ref).
  3. If local is behind by N commits → block with exit 2.
  4. If no upstream tracking branch (new repo, detached HEAD) → allow.
  5. Any other command → allow.

Exit 0 = allow
Exit 2 = block
"""
import json
import re
import subprocess
import sys

TIMEOUT = 5  # seconds for every subprocess call

BRANCH_CREATION_PATTERNS = [
    re.compile(r"\bgit\s+checkout\s+.*-b\b"),
    re.compile(r"\bgit\s+switch\s+.*-c\b"),
    re.compile(r"\bgit\s+branch\s+\S"),
]


def run(args: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(
        args,
        capture_output=True,
        text=True,
        timeout=TIMEOUT,
    )


def is_branch_creation(command: str) -> bool:
    return any(p.search(command) for p in BRANCH_CREATION_PATTERNS)


def commits_behind() -> int:
    """Return number of commits local HEAD is behind upstream. -1 if no upstream."""
    # Confirm upstream exists
    upstream = run(["git", "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])
    if upstream.returncode != 0:
        # No upstream tracking branch — nothing to enforce
        return -1

    behind = run(["git", "rev-list", "--count", "HEAD..@{u}"])
    if behind.returncode != 0:
        return -1

    try:
        return int(behind.stdout.strip())
    except ValueError:
        return -1


try:
    data = json.load(sys.stdin)
    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})

    if tool_name != "Bash":
        sys.exit(0)

    command = tool_input.get("command", "")

    if not is_branch_creation(command):
        sys.exit(0)

    # Refresh remote refs silently before comparing
    run(["git", "fetch"])

    n = commits_behind()

    if n > 0:
        print(
            f"BLOCKED: Current branch is {n} commit{'s' if n != 1 else ''} behind remote.\n"
            f"Run `git pull` before creating a new branch.\n"
            f"This prevents working on stale code.",
            file=sys.stderr,
        )
        sys.exit(2)

    # n == 0  → up to date
    # n == -1 → no upstream tracking branch (new repo, detached HEAD, etc.)
    sys.exit(0)

except Exception:
    sys.exit(0)
