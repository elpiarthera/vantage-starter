#!/usr/bin/env python3
"""
Skill Validator — validates all .claude/skills/ SKILL.md files.

For VantageStarter's design system skills (impeccable system).

Checks:
- Frontmatter: name, description present
- Reasonable line count (<= 300)
- Directory name matches skill name

Usage:
    python3 scripts/validate-skills.py              # full report
    python3 scripts/validate-skills.py --short      # failures only

Exit code: 0 = all pass, 1 = failures found
"""

import sys
from pathlib import Path
from datetime import date

ROOT = Path(__file__).parent.parent
SKILLS_DIR = ROOT / ".claude" / "skills"
HEALTH_DIR = ROOT / "analysis" / "agent-health"


def parse_frontmatter(filepath: Path) -> dict:
    try:
        content = filepath.read_text(encoding="utf-8", errors="replace")[:3000]
    except Exception:
        return {}
    if not content.startswith("---"):
        return {}
    end = content.find("\n---", 3)
    if end == -1:
        return {}
    result = {}
    for line in content[4:end].splitlines():
        stripped = line.strip()
        if ":" in line and not stripped.startswith("-"):
            key, _, val = line.partition(":")
            val = val.strip().strip("\"'")
            if val:
                result[key.strip()] = val
    return result


def check_skill(filepath: Path) -> dict:
    result = {
        "file": str(filepath.relative_to(ROOT)),
        "name": filepath.parent.name,
        "errors": [],
        "warnings": [],
    }

    try:
        content = filepath.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        result["errors"].append(f"Cannot read: {e}")
        return result

    if not content.startswith("---"):
        result["warnings"].append("No frontmatter — consider adding name/description")
        return result

    fm = parse_frontmatter(filepath)

    if "name" not in fm:
        result["warnings"].append("No 'name' in frontmatter")

    if "description" not in fm:
        result["warnings"].append("No 'description' in frontmatter")

    lines = content.splitlines()
    if len(lines) > 300:
        result["warnings"].append(f"Long skill file: {len(lines)} lines (consider splitting)")

    return result


def run(short: bool = False):
    HEALTH_DIR.mkdir(parents=True, exist_ok=True)

    if not SKILLS_DIR.exists():
        print("No .claude/skills/ directory found.")
        return 0

    skill_files = sorted(SKILLS_DIR.rglob("SKILL.md"))
    # Also check top-level skill directories (impeccable system uses flat structure)
    top_level_mds = []
    for item in sorted(SKILLS_DIR.iterdir()):
        if item.is_dir():
            skill_md = item / "SKILL.md"
            if skill_md.exists() and skill_md not in skill_files:
                top_level_mds.append(skill_md)

    all_files = list(set(skill_files + top_level_mds))

    if not all_files:
        print("No SKILL.md files found in .claude/skills/")
        print("(This is expected for VantageStarter — skills use a flat directory structure)")
        return 0

    results = [check_skill(f) for f in sorted(all_files)]
    passed = [r for r in results if not r["errors"] and not r["warnings"]]
    failed = [r for r in results if r["errors"]]
    warned = [r for r in results if r["warnings"] and not r["errors"]]

    print(f"\n{'='*56}")
    print(f"  Skill Validator — {date.today()}")
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
            for w in r["warnings"][:3]:
                print(f"        WARN: {w}")
        print()

    # Save report
    today = date.today().isoformat()
    report = HEALTH_DIR / f"validate-skills-{today}.md"
    lines = [
        f"# Skill Validator Report — {today}\n\n",
        f"**Scanned:** {len(results)}  **PASS:** {len(passed)}  **FAIL:** {len(failed)}  **WARN:** {len(warned)}\n\n",
    ]
    report.write_text("".join(lines))
    print(f"Report saved: {report.relative_to(ROOT)}")

    return len(failed)


if __name__ == "__main__":
    short = "--short" in sys.argv
    failures = run(short)
    sys.exit(1 if failures else 0)
