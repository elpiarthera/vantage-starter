#!/usr/bin/env python3
"""
SessionStart hook: scans VantageStarter project context to orient the
orchestrator at session start.

Emits a brief session context as additionalContext so the agent starts
with the right mental model before the first user message.

Silent if no actionable context found.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent

# Domain keywords mapped to VantageStarter's 7 agents
DOMAIN_KEYWORDS = {
    "frontend": ["component", "ui", "page", "responsive", "css", "tailwind", "shadcn", "layout", "modal"],
    "convex": ["convex", "schema", "mutation", "query", "action", "cron", "storage", "index"],
    "clerk": ["clerk", "auth", "signin", "signup", "organization", "rbac", "middleware", "webhook"],
    "seo": ["seo", "metadata", "canonical", "sitemap", "robots", "schema.org", "og tag"],
    "security": ["security", "owasp", "csp", "vulnerability", "xss", "injection", "headers"],
    "accessibility": ["accessibility", "rgaa", "wcag", "a11y", "contrast", "screen reader", "aria"],
}


def detect_domains(text: str) -> list:
    text_lower = text.lower()
    scores = {}
    for domain, keywords in DOMAIN_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score >= 1:
            scores[domain] = score
    return sorted(scores, key=scores.get, reverse=True)[:3]


def get_progress_context() -> str:
    progress = ROOT / "PROGRESS.md"
    if not progress.exists():
        return ""
    try:
        lines = progress.read_text().splitlines()
        return "\n".join(lines[-15:])
    except Exception:
        return ""


def get_stack_context() -> str:
    """Brief stack reminder from CLAUDE.md."""
    claude_md = ROOT / "CLAUDE.md"
    if not claude_md.exists():
        return ""
    try:
        content = claude_md.read_text()
        # Extract just the stack section
        if "## STACK" in content:
            start = content.index("## STACK")
            end = content.find("\n---", start)
            return content[start:end][:400] if end != -1 else content[start:start+400]
    except Exception:
        pass
    return ""


def main():
    progress = get_progress_context()
    domains = detect_domains(progress)

    if not domains and not progress:
        return 0  # Silent

    brief_parts = []
    if domains:
        brief_parts.append(f"Active domains: {', '.join(domains)}")

    # Stack reminder
    brief_parts.append(
        "Stack: Next.js 15 + Convex + Clerk + Polar + AI SDK v6. "
        "7 agents: frontend-dev, convex-expert, clerk-expert, seo-dev, sentinel, accessibility-audit, senior-dev."
    )

    session_brief = " | ".join(brief_parts)

    output = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": f"[Session profiler] {session_brief}"
        }
    }
    print(json.dumps(output))
    return 0


if __name__ == "__main__":
    sys.exit(main())
