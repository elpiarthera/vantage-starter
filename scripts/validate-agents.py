#!/usr/bin/env python3
"""
Agent Validator — checks all .claude/agents/*.md frontmatter for VantageStarter.

Checks:
- name field present and matches filename
- description field present and non-empty
- tools field present
- ## ORCHESTRATION section present in body
- Optional: summary, memory, domain, tier fields

Usage:
    python3 scripts/validate-agents.py              # full report
    python3 scripts/validate-agents.py --short      # failures only

Exit code: 0 = all pass, 1 = failures found
"""

import re
import sys
from pathlib import Path
from datetime import date

ROOT = Path(__file__).parent.parent
AGENTS_DIR = ROOT / ".claude" / "agents"
HEALTH_DIR = ROOT / "analysis" / "agent-health"

VALID_DOMAINS = {
    "dev", "seo", "security", "accessibility", "marketing",
    "sales", "delivery", "ops", ""
}


def parse_frontmatter(content: str) -> dict:
    """Parse YAML frontmatter (handles inline and list values)."""
    if not content.startswith("---"):
        return {}
    end = content.find("\n---", 3)
    if end == -1:
        return {}
    result = {}
    current_key = None
    current_list = []

    for line in content[4:end].splitlines():
        stripped = line.strip()
        if stripped.startswith("- ") and current_key:
            current_list.append(stripped[2:].strip().strip("\"'"))
            continue
        if current_key and current_list:
            result[current_key] = current_list
            current_key = None
            current_list = []
        elif current_key:
            current_key = None

        if ":" in line and not stripped.startswith("-"):
            key, _, val = line.partition(":")
            key = key.strip()
            val = val.strip().strip("\"'")
            if key == "allowed-tools":
                key = "tools"
            if val:
                result[key] = val
            else:
                current_key = key
                current_list = []

    if current_key and current_list:
        result[current_key] = current_list
    return result


def get_body(content: str) -> str:
    if not content.startswith("---"):
        return content
    end = content.find("\n---", 3)
    if end == -1:
        return content
    return content[end + 4:]


def check_agent(path: Path) -> dict:
    result = {
        "file": path.name,
        "name": path.stem,
        "errors": [],
        "warnings": [],
    }

    try:
        content = path.read_text()
    except Exception as e:
        result["errors"].append(f"Cannot read: {e}")
        return result

    fm = parse_frontmatter(content)
    body = get_body(content)
    name = fm.get("name", path.stem)
    result["name"] = name

    # --- Required fields ---
    if "name" not in fm:
        result["errors"].append("Missing 'name' in frontmatter")
    elif fm["name"] != path.stem:
        result["errors"].append(f"name '{fm['name']}' != filename '{path.stem}'")

    if not fm.get("description"):
        result["errors"].append("Missing 'description'")

    if "tools" not in fm:
        result["warnings"].append("No 'tools' field")

    # --- Required body sections ---
    has_orch = "## orchestration" in body.lower()
    if not has_orch:
        result["errors"].append("Missing ## ORCHESTRATION section in body")

    # --- Optional fields (warnings only) ---
    if not fm.get("summary"):
        result["warnings"].append("No 'summary' field")

    if not fm.get("memory"):
        result["warnings"].append("No 'memory' field")

    domain = fm.get("domain", "")
    if domain and domain not in VALID_DOMAINS:
        result["warnings"].append(f"Invalid domain: '{domain}'")

    # Body length sanity check
    word_count = len(body.split())
    if word_count > 800:
        result["warnings"].append(f"Body large ({word_count} words) — keep agents lean")

    return result


def run(short: bool = False):
    HEALTH_DIR.mkdir(parents=True, exist_ok=True)

    agents = sorted(AGENTS_DIR.glob("*.md"))
    if not agents:
        print("No agent files found in .claude/agents/")
        return 1

    results = [check_agent(a) for a in agents]
    passed = [r for r in results if not r["errors"]]
    failed = [r for r in results if r["errors"]]
    warned = [r for r in results if r["warnings"] and not r["errors"]]

    print(f"\n{'='*56}")
    print(f"  Agent Validator — {date.today()}")
    print(f"{'='*56}")
    print(f"  Scanned : {len(results)}")
    print(f"  PASS    : {len(passed)}")
    print(f"  FAIL    : {len(failed)}")
    print(f"  WARN    : {len(warned)}")
    print(f"{'='*56}\n")

    if failed:
        print("FAILURES")
        print("-" * 40)
        for r in failed:
            print(f"  FAIL  {r['name']}")
            for e in r["errors"]:
                print(f"        ERROR: {e}")
        print()

    if warned and not short:
        print("WARNINGS")
        print("-" * 40)
        for r in warned:
            print(f"  WARN  {r['name']}")
            for w in r["warnings"]:
                print(f"        WARN: {w}")
        print()

    if not failed:
        print("  All agents passed validation.")

    # Save report
    today = date.today().isoformat()
    report_path = HEALTH_DIR / f"validate-agents-{today}.md"
    lines = [
        f"# Agent Validator Report — {today}\n\n",
        f"**Scanned:** {len(results)}  **PASS:** {len(passed)}  **FAIL:** {len(failed)}  **WARN:** {len(warned)}\n\n",
    ]
    if failed:
        lines.append("## Failures\n\n| Agent | Errors |\n|-------|--------|\n")
        for r in failed:
            lines.append(f"| {r['name']} | {'; '.join(r['errors'])} |\n")
    report_path.write_text("".join(lines))
    print(f"\nReport saved: {report_path.relative_to(ROOT)}")

    return len(failed)


if __name__ == "__main__":
    short = "--short" in sys.argv
    failures = run(short)
    sys.exit(1 if failures else 0)
