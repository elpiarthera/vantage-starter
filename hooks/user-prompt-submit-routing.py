#!/usr/bin/env python3
"""
UserPromptSubmit hook: intercepts user prompts and injects routing context.

For VantageStarter's 7-agent team. Scores the prompt against known
task patterns and injects the best-matching agent as additionalContext.

Silent on no match (no output = no context noise).
Context budget: max 8KB.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent

# Task patterns mapped to agents.
# Each entry: (phrases_to_match, agent_name, note)
# Score: 1 point per matched phrase. Fire if score >= threshold.
ROUTING_TABLE = [
    # dev-frontend — UI, pages, components, CSS
    {
        "agent": "dev-frontend",
        "threshold": 1,
        "phrases": [
            "component", "ui ", "page ", "layout", "tailwind", "shadcn",
            "responsive", "mobile", "dark mode", "animation", "css ",
            "style ", "button", "form ", "modal", "toast", "card ",
            "navbar", "sidebar", "landing page", "hero ", "design ",
        ],
        "noneOf": ["convex", "schema ", "mutation", "query ", "auth "],
    },
    # dev-convex-expert — backend, data layer
    {
        "agent": "dev-convex-expert",
        "threshold": 1,
        "phrases": [
            "convex", "schema ", "mutation", "query ", "action ", "cron",
            "file storage", "real-time", "realtime", "index ", "indexes",
            "database", "table ", "backend", "webhook ", "http action",
        ],
        "noneOf": [],
    },
    # clerk-expert — auth
    {
        "agent": "clerk-expert",
        "threshold": 1,
        "phrases": [
            "clerk", "auth", "sign in", "sign up", "signin", "signup",
            "organization", "rbac", "role ", "permission", "middleware",
            "session ", "jwt ", "oauth", "sso ", "user management",
        ],
        "noneOf": [],
    },
    # dev-seo — SEO infrastructure
    {
        "agent": "dev-seo",
        "threshold": 1,
        "phrases": [
            "seo", "metadata", "canonical", "sitemap", "robots.txt",
            "schema.org", "json-ld", "og tag", "open graph", "twitter card",
            "generatemetadata", "hreflang", "structured data",
        ],
        "noneOf": [],
    },
    # dev-sentinel — security
    {
        "agent": "dev-sentinel",
        "threshold": 1,
        "phrases": [
            "security", "owasp", "vulnerability", "csp ", "content security",
            "xss ", "injection", "csrf ", "secret ", "audit security",
            "scan ", "penetration", "headers ", "exploit",
        ],
        "noneOf": [],
    },
    # accessibility-audit — a11y
    {
        "agent": "accessibility-audit",
        "threshold": 1,
        "phrases": [
            "accessibility", "a11y", "rgaa", "wcag", "contrast", "aria ",
            "alt text", "screen reader", "keyboard nav", "focus ", "tab order",
        ],
        "noneOf": [],
    },
    # dev-senior-dev — architecture, review
    {
        "agent": "dev-senior-dev",
        "threshold": 1,
        "phrases": [
            "architecture", "code review", "refactor", "pr review",
            "technical decision", "design decision", "trade-off",
            "system design", "patterns", "best practice", "technical debt",
        ],
        "noneOf": [],
    },
]

AGENT_DESCRIPTIONS = {
    "dev-frontend": "Frontend: components, UI, pages, CSS, responsive design",
    "dev-convex-expert": "Backend: Convex schema, queries, mutations, actions, cron, storage",
    "clerk-expert": "Auth: Clerk middleware, sign-in/up, organizations, RBAC",
    "dev-seo": "SEO: metadata, canonical, schema.org, sitemap, robots",
    "dev-sentinel": "Security: OWASP, vulnerabilities, CSP headers, secrets",
    "accessibility-audit": "Accessibility: RGAA/WCAG, contrast, ARIA, keyboard nav",
    "dev-senior-dev": "Architecture: code review, tech decisions, refactoring",
}


def score_prompt(prompt: str) -> list:
    prompt_lower = prompt.lower()
    matches = []

    for entry in ROUTING_TABLE:
        # Check noneOf — hard suppress
        suppressed = any(phrase in prompt_lower for phrase in entry.get("noneOf", []))
        if suppressed:
            continue

        # Score phrases
        score = sum(1 for phrase in entry["phrases"] if phrase in prompt_lower)
        if score >= entry["threshold"]:
            matches.append({
                "agent": entry["agent"],
                "score": score,
            })

    return sorted(matches, key=lambda m: m["score"], reverse=True)


def main():
    try:
        payload = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, EOFError):
        return 0

    prompt = payload.get("prompt", payload.get("message", ""))
    if not prompt or len(prompt.strip()) < 5:
        return 0

    matches = score_prompt(prompt)
    if not matches:
        return 0

    top = matches[0]
    agent = top["agent"]

    context_parts = [
        f"[Routing signal] Task matches agent: `{agent}` — {AGENT_DESCRIPTIONS.get(agent, '')}",
        f"Delegate to `{agent}` with a short brief (3-5 sentences). Do not do this work yourself.",
    ]

    # Show alternatives if close match
    if len(matches) > 1 and matches[1]["score"] >= top["score"] - 1:
        alts = [f"`{m['agent']}`" for m in matches[1:3]]
        context_parts.append(f"Close alternatives: {', '.join(alts)}")

    context = "\n".join(context_parts)

    # Cap at 8KB
    if len(context.encode("utf-8")) > 8192:
        context = context[:8000]

    output = {
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": context
        }
    }
    print(json.dumps(output))
    return 0


if __name__ == "__main__":
    sys.exit(main())
