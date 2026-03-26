#!/usr/bin/env python3
"""
Hook: PostToolUse on Agent
Purpose: After any agent completes, auto-verify that changes match instructions.

How it works:
1. Reads the agent's original prompt (instructions) from tool_input
2. Reads the agent's result from tool_result
3. Gets the git diff of what changed
4. Emits a warning if:
   - Agent reported success but no files were changed
   - Agent was asked to edit specific files but those files aren't in the diff
   - Agent created NEW files when it should have edited existing ones

This is a safety net — it doesn't block, it warns.
"""

import json
import subprocess
import sys


def get_git_diff_files():
    """Get list of files changed since last commit."""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "HEAD"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            return [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]
    except Exception:
        pass
    return []


def get_staged_files():
    """Get list of staged files."""
    try:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            return [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]
    except Exception:
        pass
    return []


def extract_file_paths(text):
    """Extract file paths mentioned in the prompt."""
    paths = set()
    for word in text.split():
        word = word.strip("'\"`,;:()")
        if "/" in word and "." in word.split("/")[-1]:
            # Remove leading absolute path prefix for comparison
            clean = word.split("/coding/vantage-starter/")[-1] if "/coding/vantage-starter/" in word else word
            clean = clean.lstrip("/")
            paths.add(clean)
    return paths


def main():
    try:
        raw = sys.stdin.read()
        data = json.loads(raw)
        tool_input = data.get("tool_input", {})
        tool_result = data.get("tool_result", "")
    except (json.JSONDecodeError, AttributeError):
        return 0

    prompt = tool_input.get("prompt", "")
    agent_type = tool_input.get("subagent_type", "")

    # Only check dev agents that edit code
    dev_agents = {"dev-frontend", "dev-convex-expert", "dev-clerk-expert", "dev-fal-expert",
                  "dev-polar-expert", "dev-senior-dev", "dev-sentinel", "dev-seo", "dev-qa",
                  "senior-dev", "sentinel", "qa"}

    if agent_type not in dev_agents:
        return 0

    # Get expected files from prompt
    expected_files = extract_file_paths(prompt)

    # Get actually changed files
    changed_files = set(get_git_diff_files() + get_staged_files())

    warnings = []

    # Check 1: Agent was asked to edit files but nothing changed
    if expected_files and not changed_files:
        warnings.append(
            f"REVIEW WARNING: Agent was asked to edit {len(expected_files)} files but NO files were changed. "
            f"Expected: {', '.join(sorted(expected_files)[:5])}"
        )

    # Check 2: Specific expected files not in diff
    if expected_files and changed_files:
        missing = []
        for expected in expected_files:
            found = any(expected in changed or changed.endswith(expected.split("/")[-1]) for changed in changed_files)
            if not found:
                missing.append(expected)
        if missing:
            warnings.append(
                f"REVIEW WARNING: These files were in the brief but NOT changed: {', '.join(missing[:5])}"
            )

    # Check 3: New files created (potential Write-over-Edit violation)
    try:
        result = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            new_files = [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]
            code_new = [f for f in new_files if f.endswith((".tsx", ".ts", ".css", ".py"))]
            if code_new:
                warnings.append(
                    f"REVIEW WARNING: {len(code_new)} NEW code files created (should be Edit not Write): "
                    f"{', '.join(code_new[:5])}"
                )
    except Exception:
        pass

    if warnings:
        msg = "\n".join(warnings)
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": f"[Post-agent review] {msg}"
            }
        }))

    return 0


if __name__ == "__main__":
    sys.exit(main())
