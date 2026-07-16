#!/usr/bin/env python3
"""
PreToolUse hook on mcp__vantage-peers__create_mission.
Blocks missions whose brief does not reference a known mission template name.

Known templates: hook-development-v1, plugin-dev-v1, infra-change-v1,
mission-generic-v1, issue-resolution-v2, site-launch-v1,
diary-perfectaiagent-v1, pricing-research-v1, chrome-extension-mission-v1,
skill-quality-pilot-template-v1, front-fix-client-facing-v1,
dashboard-mvp-fix-v1, vercel-deploy-incident-v1.

Opt-out: include `templateOptOut: <reason>` in the brief. RARE — Laurent Day 73
PM doctrine: "pas de bypass pour se confronter au même problème encore et
encore". If you need opt-out twice, FIX THE ROOT CAUSE (register the template
in this whitelist, or in VantageRegistry, or both).

Exit 0 = allow, Exit 2 = block. Fail-open on exception.

Version: 1.0.4 (2026-06-15 Day 102 — Sigma k17e7mhmd : front-fix-client-facing-v1
+ dashboard-mvp-fix-v1 + vercel-deploy-incident-v1 added)
"""
import json
import re
import sys

KNOWN_TEMPLATES = [
    "hook-development-v1",
    "plugin-dev-v1",
    "infra-change-v1",
    "mission-generic-v1",
    "chrome-extension-mission-v1",
    "issue-resolution-v2",
    "site-launch-v1",
    "diary-perfectaiagent-v1",
    "pricing-research-v1",
    "skill-quality-pilot-template-v1",
    "front-fix-client-facing-v1",
    "dashboard-mvp-fix-v1",
    "vercel-deploy-incident-v1",
]
TEMPLATE_PATTERN = re.compile(
    r"template\s*(?:utilis(?:e|\xe9)\s*)?:\s*([a-z0-9-]+-v\d+)", re.IGNORECASE
)
OPT_OUT_PATTERN = re.compile(r"templateOptOut\s*:\s*\S", re.IGNORECASE)


def _block(msg: str) -> None:
    known = "\n  - ".join(KNOWN_TEMPLATES)
    print(
        f"BLOCKED: {msg}\n\n"
        f"Every mission brief MUST reference a known template:\n"
        f'  Example: "Template utilise : hook-development-v1"\n\n'
        f"Known templates:\n  - {known}\n\n"
        f"Opt-out (rare): add `templateOptOut: <reason>` to the brief.",
        file=sys.stderr,
    )
    sys.exit(2)


try:
    data = json.load(sys.stdin)
    # TOOL_NAME_GUARD_PI_FIX Day 113 — fleet deadlock fix (matcher=null fires on every tool)
    if data.get("tool_name") != "mcp__vantage-peers__create_mission":
        sys.exit(0)
    brief = data.get("tool_input", {}).get("brief", "") or ""

    if not brief.strip():
        _block("Mission has no brief — cannot verify template reference.")

    if OPT_OUT_PATTERN.search(brief):
        sys.exit(0)

    match = TEMPLATE_PATTERN.search(brief)
    if not match:
        _block("Brief does not reference any mission template.")

    name = match.group(1).lower()
    if name not in KNOWN_TEMPLATES:
        _block(f"Template '{name}' is not a known mission template.")

    sys.exit(0)

except SystemExit:
    raise
except Exception:
    sys.exit(0)
