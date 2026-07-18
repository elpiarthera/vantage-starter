#!/usr/bin/env python3
"""
SubagentStart hook — injects communication rules and orchestration protocol
into every spawned subagent.

Ensures subagents inherit:
1. Communication style (concise, direct, no emojis)
2. Orchestration protocol (check registry before doing work)
3. Stack context (VantageStarter's tech stack constraints)

Silent if no context to inject.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent

COMM_STYLE = """## Communication Style
- Bullets by default. Lead with the answer. Reasoning after.
- Short sentences. No padding. No emojis. No flattery.
- Never over-explain. Never add disclaimers.
- Terse, provable, pragmatic."""

STACK_CONSTRAINTS = """## Stack (non-negotiable)
- Next.js 15 App Router — Server Components by default, justify every "use client"
- Convex for all data — no REST, no SQL, real-time by default
- Clerk middleware for auth — protect at middleware level, not component level
- TypeScript strict — no `any`, no `as` casts without comment
- Biome for linting, tsc --noEmit for type checking"""


def main():
    try:
        payload = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, EOFError):
        return 0

    context_parts = [COMM_STYLE]

    # Orchestration reminder
    context_parts.append(
        "[Orchestration] Before executing any task, consult `/registry.json`. "
        "If a specialist agent exists for this work, delegate. "
        "Never do specialist work yourself. "
        "VantageStarter agents: dev-frontend, dev-convex-expert, clerk-expert, "
        "dev-seo, dev-sentinel, accessibility-audit, dev-senior-dev."
    )

    context_parts.append(STACK_CONSTRAINTS)

    context = "\n\n".join(context_parts)

    # Cap at 4KB for subagent context budget
    if len(context.encode("utf-8")) > 4096:
        context = context[:4000]

    output = {
        "hookSpecificOutput": {
            "hookEventName": "SubagentStart",
            "additionalContext": context
        }
    }
    print(json.dumps(output))
    return 0


if __name__ == "__main__":
    sys.exit(main())
