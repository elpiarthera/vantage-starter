#!/usr/bin/env python3
"""
PreToolUse hook on Agent: advisory warning when agent type doesn't match
file patterns detected in the prompt.

Always exits 0 (never blocks). Prints WARNING to stderr on mismatch.

Exit 0 = allow (always)
"""
import json
import re
import sys

# Agent types exempt from routing check
EXEMPT_AGENTS = [
    "Explore", "Plan", "claude-code-guide", "statusline-setup",
    "code-reviewer", "general-purpose",
]

# Routing rules: domain → patterns + expected agent
# Order matters: clerk_auth checked before convex (more specific first)
ROUTING_RULES = [
    {
        "domain": "clerk_auth",
        "patterns": ["clerk", "auth.config", "clerkmiddleware", "currentuser", "auth()"],
        "expected": "dev-clerk-expert",
    },
    {
        "domain": "convex",
        "patterns": ["convex/", "schema.ts", ".mutation(", ".query(", "ctx.db", "convex/server"],
        "expected": "dev-convex-expert",
    },
    {
        "domain": "frontend",
        "patterns": [".tsx", ".jsx", "components/", "tailwind", "classname", "shadcn", "app/("],
        "expected": "dev-frontend",
    },
    {
        "domain": "hooks_python",
        "patterns": [".claude/hooks/", "settings.json", "pretooluse", "posttooluse"],
        "expected": "dev-senior-dev",
    },
]

try:
    data = json.load(sys.stdin)
    tool_input = data.get("tool_input", {})

    agent_type = tool_input.get("subagent_type", "")
    prompt = tool_input.get("prompt", "")

    # Skip exempt agents
    if agent_type in EXEMPT_AGENTS:
        sys.exit(0)

    prompt_lower = prompt.lower()

    # Find matching domain
    for rule in ROUTING_RULES:
        matched_patterns = [p for p in rule["patterns"] if p.lower() in prompt_lower]
        if matched_patterns:
            expected = rule["expected"]
            if agent_type != expected:
                print(
                    f"WARNING: Agent routing mismatch detected.\n"
                    f"  Detected domain: {rule['domain']} (patterns: {', '.join(matched_patterns)})\n"
                    f"  Expected agent: {expected}\n"
                    f"  Actual agent: {agent_type}\n\n"
                    f"  Consider using {expected} instead of {agent_type} for this task.",
                    file=sys.stderr,
                )
            # First match wins — don't check further rules
            break

    sys.exit(0)

except Exception:
    sys.exit(0)
