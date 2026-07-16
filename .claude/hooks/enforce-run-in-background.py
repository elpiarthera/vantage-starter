#!/usr/bin/env python3
"""
PreToolUse hook — enforce run_in_background=true on all Agent tool calls.
Orchestrators must not block on subagent execution.

Exit 0 = allow
Exit 2 = block
"""
import json
import sys

# Agent types that need synchronous results — exempt from background enforcement
EXEMPT_AGENTS = [
    "Explore",
    "Plan",
    "claude-code-guide",
    "statusline-setup",
]

try:
    data = json.load(sys.stdin)
    tool_input = data.get("tool_input", {})

    agent_type = tool_input.get("subagent_type", "")
    run_in_background = tool_input.get("run_in_background", False)

    # Exempt agent types that need synchronous results
    if agent_type in EXEMPT_AGENTS:
        sys.exit(0)

    if not run_in_background:
        print(
            f"BLOCKED: Agent calls must use run_in_background=true.\n"
            f"Add run_in_background: true to the Agent call.\n"
            f"Orchestrators must not block on subagent execution.\n"
            f"Exempt types: Explore, Plan, claude-code-guide, statusline-setup",
            file=sys.stderr,
        )
        sys.exit(2)

    sys.exit(0)

except Exception:
    sys.exit(0)
