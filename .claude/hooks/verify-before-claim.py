#!/usr/bin/env python3
"""
PreToolUse hook on mcp__vantage-peers__send_message:
Blocks messages containing file paths or URLs if no verification
tool was run recently (within 120 seconds).

Requires companion hook: verify-breadcrumb.py (PostToolUse on Read|Bash|Glob|Grep)

Exit 0 = allow
Exit 2 = block
"""
import json
import os
import re
import sys
import time

BREADCRUMB = "/tmp/.claude-last-verify"
MAX_AGE_SECONDS = 120  # 2 minutes

# Patterns that indicate a claim about file/URL state
PATH_PATTERNS = [
    re.compile(r'/root/[\w/.+-]+'),
    re.compile(r'/home/[\w/.+-]+'),
    re.compile(r'https?://\S+'),
    re.compile(r'\S+\.(md|ts|tsx|js|jsx|json|py|yaml|yml|toml|sh)\b'),
]

try:
    data = json.load(sys.stdin)
    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})

    # Only check send_message
    if tool_name != "mcp__vantage-peers__send_message":
        sys.exit(0)

    content = tool_input.get("content", "")

    # Check if content references paths/URLs
    has_paths = False
    for pattern in PATH_PATTERNS:
        if pattern.search(content):
            has_paths = True
            break

    if not has_paths:
        sys.exit(0)

    # Check breadcrumb freshness
    try:
        mtime = os.path.getmtime(BREADCRUMB)
        age = time.time() - mtime
        if age <= MAX_AGE_SECONDS:
            sys.exit(0)  # Recent verification exists
    except FileNotFoundError:
        pass  # No breadcrumb = no verification

    print(
        "BLOCKED: You referenced a path/URL without verifying it first.\n"
        "Run a verification command (Read, Bash ls/cat/stat, Glob, Grep),\n"
        "then retry your message.\n\n"
        "This prevents sending stale or incorrect path references to other orchestrators.",
        file=sys.stderr,
    )
    sys.exit(2)

except Exception:
    sys.exit(0)
