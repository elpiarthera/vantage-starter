#!/usr/bin/env python3
"""
PostToolUse hook on Read|Bash|Glob|Grep:
Touches /tmp/.claude-last-verify as a breadcrumb to track
that a verification was performed recently.

Companion to verify-before-claim.py (PreToolUse on send_message).
"""
import json
import sys
from pathlib import Path

BREADCRUMB = Path("/tmp/.claude-last-verify")

try:
    data = json.load(sys.stdin)
    tool_name = data.get("tool_name", "")

    # Only stamp for verification-capable tools
    if tool_name in ("Read", "Glob", "Grep", "Bash"):
        BREADCRUMB.touch()

    sys.exit(0)

except Exception:
    sys.exit(0)
