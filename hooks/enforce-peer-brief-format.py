#!/usr/bin/env python3
"""
Pi-specific hook.
PreToolUse on mcp__claude-peers__send_message: Peer messages must follow brief template.

When Pi delegates to Tau/Phi, the message must be a structured brief,
not free-form prose. Enforces the same template markers as enforce-brief-template.py.

Exit 0 = allow
Exit 2 = block
"""
import json
import sys

TEMPLATE_MARKERS = [
    "## TASK",
    "## FILES",
    "## EXACT CHANGES",
    "## ACCEPTANCE CRITERIA",
    "brief-ui.md",
    "brief-backend.md",
    "agent-brief-template.md",
]

try:
    data = json.load(sys.stdin)
    message = data.get("tool_input", {}).get("message", "")

    # Short/operational messages are fine (< 500 chars = not a work brief)
    if len(message) < 500:
        sys.exit(0)

    # Check if any template marker is present
    message_lower = message.lower()
    for marker in TEMPLATE_MARKERS:
        if marker.lower() in message_lower:
            sys.exit(0)

    print(
        f"BLOCKED: Peer message is not a structured brief.\n\n"
        f"When delegating work to another orchestrator:\n"
        f"1. Load the correct brief template (brief-ui.md or brief-backend.md)\n"
        f"2. Fill it with: TASK, FILES, EXACT CHANGES, ACCEPTANCE CRITERIA\n"
        f"3. Include exact file:line:change instructions\n"
        f"4. THEN send the message\n"
    )
    sys.exit(2)

except Exception:
    sys.exit(0)
