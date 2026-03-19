#!/usr/bin/env python3
"""
PostToolUse QA hook — runs tsc + biome on TypeScript/TSX files after Write/Edit.

Fires after Write|Edit on .ts/.tsx files. Runs tsc --noEmit and
biome check on the changed file. Emits errors as additionalContext.

Silent on success. Does NOT block (exit 0 always).
"""

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent


def run_tsc() -> str:
    """Run tsc --noEmit and return error output (empty = pass)."""
    try:
        result = subprocess.run(
            ["npx", "tsc", "--noEmit"],
            capture_output=True,
            text=True,
            timeout=30,
            cwd=str(ROOT),
        )
        if result.returncode != 0:
            # Return first 20 lines of output
            lines = (result.stdout + result.stderr).strip().splitlines()
            return "\n".join(lines[:20])
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return ""


def run_biome(filepath: str) -> str:
    """Run biome check on a specific file. Return errors (empty = pass)."""
    try:
        result = subprocess.run(
            ["npx", "biome", "check", filepath],
            capture_output=True,
            text=True,
            timeout=15,
            cwd=str(ROOT),
        )
        if result.returncode != 0:
            lines = (result.stdout + result.stderr).strip().splitlines()
            # Filter to actual errors only (skip info lines)
            errors = [l for l in lines if "error" in l.lower() or "Error" in l]
            return "\n".join(errors[:10])
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return ""


def main():
    try:
        payload = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, EOFError):
        return 0

    tool_input = payload.get("tool_input", {})
    filepath = tool_input.get("file_path", "")
    if not filepath:
        return 0

    # Only run on TypeScript files
    ext = Path(filepath).suffix.lower()
    if ext not in {".ts", ".tsx"}:
        return 0

    # Skip node_modules and generated files
    if "node_modules" in filepath or ".next" in filepath:
        return 0

    errors = []

    # Run biome on the specific file (fast)
    biome_out = run_biome(filepath)
    if biome_out:
        errors.append(f"[Biome]\n{biome_out}")

    # Run tsc (slower — but it catches cross-file type errors)
    tsc_out = run_tsc()
    if tsc_out:
        errors.append(f"[tsc]\n{tsc_out}")

    if not errors:
        return 0

    context = "[QA] TypeScript errors detected:\n\n" + "\n\n".join(errors)

    # Cap context size
    if len(context.encode("utf-8")) > 4096:
        context = context[:4000] + "\n... (truncated)"

    output = {
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": context
        }
    }
    print(json.dumps(output))
    return 0


if __name__ == "__main__":
    sys.exit(main())
