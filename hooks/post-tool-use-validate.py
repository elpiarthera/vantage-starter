#!/usr/bin/env python3
"""
PostToolUse validation hook — lightweight quality gate after Write/Edit.

For VantageStarter: checks TypeScript files for common anti-patterns
and markdown files for doc quality. Silent on success.

Fires after Write|Edit tool calls.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent

# Rules: (pattern_to_detect, message, severity, applies_to_extensions)
# Pattern match = violation (anti-pattern present in file)
ANTI_PATTERN_RULES = [
    # TypeScript anti-patterns
    {
        "pattern": r": any\b",
        "message": "Found `any` type — use proper TypeScript types. No `any` in strict mode.",
        "severity": "error",
        "extensions": [".ts", ".tsx"],
    },
    {
        "pattern": r"as any\b",
        "message": "Found `as any` cast — unjustified type cast. Add a comment explaining why.",
        "severity": "error",
        "extensions": [".ts", ".tsx"],
    },
    {
        "pattern": r'"use client"',
        "message": "Client component detected — verify this cannot be a Server Component.",
        "severity": "warn",
        "extensions": [".tsx"],
    },
    # Convex anti-patterns
    {
        "pattern": r"ctx\.db\.query\([^)]+\)(?!\.withIndex)",
        "message": "Convex query without index — check if .withIndex() is needed for performance.",
        "severity": "warn",
        "extensions": [".ts"],
    },
    # CSS anti-patterns
    {
        "pattern": r"!important",
        "message": "Found `!important` — avoid CSS overrides. Refactor the specificity chain.",
        "severity": "error",
        "extensions": [".css", ".tsx", ".ts"],
    },
    {
        "pattern": r"style=\{",
        "message": "Inline style detected — use Tailwind classes instead.",
        "severity": "warn",
        "extensions": [".tsx"],
    },
]

# Presence rules: pattern must EXIST in file (if absent = violation)
REQUIRED_PATTERN_RULES = [
    # Convex mutations must have auth
    {
        "required_pattern": r"ctx\.auth\.getUserIdentity\(\)",
        "trigger_pattern": r"export const .+ = mutation\(",
        "message": "Convex mutation without auth check — add ctx.auth.getUserIdentity().",
        "severity": "error",
        "extensions": [".ts"],
        "path_contains": "convex/",
    },
]


def check_file(filepath: str, content: str) -> list:
    violations = []
    path = Path(filepath)
    ext = path.suffix.lower()
    fp_lower = filepath.lower()

    # Anti-pattern rules (pattern present = bad)
    for rule in ANTI_PATTERN_RULES:
        if ext not in rule["extensions"]:
            continue
        try:
            if re.search(rule["pattern"], content, re.MULTILINE):
                violations.append({
                    "message": rule["message"],
                    "severity": rule["severity"],
                })
        except re.error:
            continue

    # Required rules (pattern absent = bad, but only when trigger present)
    for rule in REQUIRED_PATTERN_RULES:
        if ext not in rule["extensions"]:
            continue
        if "path_contains" in rule and rule["path_contains"] not in fp_lower:
            continue
        try:
            # Only check if trigger pattern is present
            if re.search(rule["trigger_pattern"], content, re.MULTILINE):
                if not re.search(rule["required_pattern"], content, re.MULTILINE):
                    violations.append({
                        "message": rule["message"],
                        "severity": rule["severity"],
                    })
        except re.error:
            continue

    return violations


def main():
    try:
        payload = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, EOFError):
        return 0

    tool_input = payload.get("tool_input", {})
    filepath = tool_input.get("file_path", "")
    if not filepath:
        return 0

    # Only check relevant file types
    ext = Path(filepath).suffix.lower()
    if ext not in {".ts", ".tsx", ".css"}:
        return 0

    try:
        content = Path(filepath).read_text(encoding="utf-8", errors="replace")
    except Exception:
        return 0

    violations = check_file(filepath, content)
    if not violations:
        return 0

    errors = [v for v in violations if v["severity"] == "error"]
    warnings = [v for v in violations if v["severity"] == "warn"]

    if not errors:
        return 0  # Warnings only — silent (don't interrupt flow)

    parts = [f"[VALIDATE] Issues in {Path(filepath).name}:"]
    for v in errors:
        parts.append(f"  ERROR: {v['message']}")
    for v in warnings:
        parts.append(f"  WARN: {v['message']}")
    parts.append("Fix these before committing.")

    output = {
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": "\n".join(parts)
        }
    }
    print(json.dumps(output))
    return 0


if __name__ == "__main__":
    sys.exit(main())
