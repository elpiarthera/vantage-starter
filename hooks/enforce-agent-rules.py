#!/usr/bin/env python3
"""
Hook: PreToolUse on Agent
Purpose: Enforce two non-negotiable rules:
1. All agents MUST run in background (run_in_background: true)
2. NEVER use general-purpose — always use a specialist agent type

Replaces enforce-background-agents.sh with stricter Python-based checks.
"""

import json
import sys

ALLOWED_AGENT_TYPES = {
    "dev-frontend", "dev-convex-expert", "dev-clerk-expert", "dev-fal-expert",
    "dev-polar-expert", "dev-senior-dev", "dev-sentinel", "dev-seo",
    "dev-product-manager", "dev-tech-researcher", "dev-qa",
    "copywriter", "blog-writer", "blog-reviewer", "blog-researcher", "blog-seo",
    "seo-technical", "seo-content", "seo-schema", "seo-sitemap", "seo-performance", "seo-visual",
    "market-strategy", "market-competitive", "market-content", "market-conversion", "market-technical",
    "email-assistant", "email-compliance", "email-content", "email-deliverability", "email-inbox",
    "data-analyst", "strategy-researcher", "prospect-researcher", "proposal-generator",
    "meeting-summarizer", "brand-kit-extractor", "competitor-watcher", "opportunity-tracker",
    "plugin-reviewer", "product-launcher", "repo-analyzer",
    "video-transcriber", "video-analyzer", "video-analyst", "video-editor", "shorts-creator",
    "youtube-creator", "youtube-optimizer", "youtube-strategist",
    "translator", "translation-reviewer",
    "chapter-writer", "editor-reviewer", "complaint-researcher", "structure-architect", "topic-aggregator",
    "lead-scorer", "lead-enricher", "company-scorer", "job-monitor",
    "call-briefer", "proposal-personalizer", "onboarding-kit-builder",
    "delivery-manager", "deliverable-reviewer", "delivery-packager",
    "ads-creator", "artistic-director", "image-designer",
    "accessibility-audit",
    "Explore", "Plan",
    "convex-advisor", "convex-reviewer",
    "audit-budget", "audit-compliance", "audit-creative", "audit-google", "audit-meta", "audit-tracking",
    "onboarding", "senior-dev", "sentinel", "qa",
    "statusline-setup", "claude-code-guide",
}

def main():
    try:
        raw = sys.stdin.read()
        data = json.loads(raw)
        tool_input = data.get("tool_input", {})
    except (json.JSONDecodeError, AttributeError):
        # Can't parse — allow and let Claude handle it
        print(json.dumps({"decision": "allow"}))
        return 0

    # Rule 1: Must run in background
    run_in_bg = tool_input.get("run_in_background", False)
    if not run_in_bg:
        print(json.dumps({
            "decision": "block",
            "reason": "BLOCKED: All agents MUST run in background (run_in_background: true). Foreground agents block the user."
        }))
        return 0

    # Rule 2: Must use a specialist agent type
    agent_type = tool_input.get("subagent_type", "general-purpose")
    if agent_type == "general-purpose" or agent_type not in ALLOWED_AGENT_TYPES:
        print(json.dumps({
            "decision": "block",
            "reason": f"BLOCKED: general-purpose agent is FORBIDDEN. You used '{agent_type}'. Use a specialist: dev-frontend, Explore, Plan, dev-convex-expert, etc. Check CLAUDE.md routing table."
        }))
        return 0

    # Rule 3: Brief must contain file paths (no vague instructions)
    prompt = tool_input.get("prompt", "")
    has_file_path = ("/" in prompt and ("." in prompt.split("/")[-1] if "/" in prompt else False)) or \
                    (".tsx" in prompt or ".ts" in prompt or ".css" in prompt or ".py" in prompt or ".md" in prompt)
    non_code_agents = {"Explore", "Plan", "copywriter", "strategy-researcher",
                       "blog-writer", "email-assistant", "translator",
                       "meeting-summarizer", "proposal-generator", "statusline-setup",
                       "claude-code-guide"}
    if not has_file_path and agent_type not in non_code_agents:
        print(json.dumps({
            "decision": "block",
            "reason": "BLOCKED: Agent brief has NO file paths. Dev agents need specific files to edit. "
                      "Include: exact file path, what to change, and expected result. "
                      "Example: 'FILE: /path/to/file.tsx — change X to Y on line Z'"
        }))
        return 0

    # Rule 4: UI/frontend tasks MUST include screenshot references
    ui_agents = {"dev-frontend", "artistic-director", "image-designer", "accessibility-audit",
                 "seo-visual", "onboarding"}
    ui_keywords = {"css", "style", "layout", "sidebar", "card", "button", "nav", "header",
                   "footer", "modal", "dialog", "theme", "color", "font", "spacing", "design",
                   "ui", "ux", "visual", "align", "responsive", "mobile"}
    prompt_lower = prompt.lower()
    is_ui_task = agent_type in ui_agents or any(kw in prompt_lower for kw in ui_keywords)
    has_screenshot_ref = any(marker in prompt_lower for marker in {
        "screenshot", "reference image", "see attached", "visual reference",
        "compare with", "match this", ".png", ".jpg", ".jpeg", ".webp",
        "/tmp/", "screenshot_", "firecrawl"
    })
    if is_ui_task and not has_screenshot_ref and agent_type not in non_code_agents:
        print(json.dumps({
            "decision": "block",
            "reason": "BLOCKED: UI/visual task detected but NO screenshot reference in brief. "
                      "Every visual task MUST include: "
                      "(1) screenshot of REFERENCE (what it should look like), "
                      "(2) screenshot of CURRENT state (what's wrong). "
                      "Attach images or provide file paths to screenshots. "
                      "Text descriptions of visual layout ALWAYS fail."
        }))
        return 0

    # All rules pass
    print(json.dumps({"decision": "allow"}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
