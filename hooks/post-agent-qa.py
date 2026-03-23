#!/usr/bin/env python3
"""
Universal orchestrator hook — deploy to EVERY orchestrator (Pi, Tau, Phi)
PostToolUse on Agent: After any dev agent completes, remind orchestrator to run QA.

This is advisory (exit 0), not blocking (exit 2) — it prints a reminder
after agent work completes. The orchestrator must then run QA before committing.

Exit 0 = allow (always)
"""
import json
import sys

# Agent types that produce code changes and require QA
DEV_AGENTS = [
    "general-purpose",
    "bootstrap",
]

# Agent types that are research/content only — no QA needed
EXEMPT_AGENTS = [
    "Explore",
    "Plan",
    "claude-code-guide",
    "statusline-setup",
    "copywriter",
    "competitor-watcher",
    "data-analyst",
    "email-assistant",
    "meeting-summarizer",
    "proposal-generator",
    "strategy-researcher",
    "product-launcher",
]

try:
    data = json.load(sys.stdin)
    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})
    agent_type = tool_input.get("subagent_type", "")

    # Skip exempt agents
    if agent_type in EXEMPT_AGENTS:
        sys.exit(0)

    # For dev agents or unknown agents, print QA reminder
    print(
        "\n--- QA GATE REMINDER ---\n"
        "Agent work complete. Before committing, run:\n"
        "1. biome check on modified files\n"
        "2. tsc --noEmit\n"
        "3. convex dev (if backend changed)\n"
        "4. Update CHANGELOG.md\n"
        "5. Review agent output against spec\n"
        "------------------------\n"
    )
    sys.exit(0)

except Exception:
    sys.exit(0)
