#!/usr/bin/env python3
"""
Build pre-compiled manifests for agents and skills.

Parses all frontmatter, outputs:
  generated/agent-manifest.json
  generated/skill-manifest.json

Usage:
    python3 scripts/build-manifest.py           # build manifests
    python3 scripts/build-manifest.py --check   # check if manifests are stale

Exit code: 0 = success/fresh, 1 = stale (--check mode) or error
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).parent.parent
AGENTS_DIR = ROOT / ".claude" / "agents"
SKILLS_DIR = ROOT / ".claude" / "skills"
GENERATED = ROOT / "generated"
AGENT_MANIFEST = GENERATED / "agent-manifest.json"
SKILL_MANIFEST = GENERATED / "skill-manifest.json"


def parse_frontmatter(filepath: Path) -> dict:
    try:
        content = filepath.read_text(encoding="utf-8", errors="replace")[:5000]
    except Exception:
        return {}
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


def build_agent_manifest() -> dict:
    agents = {}
    for f in sorted(AGENTS_DIR.glob("*.md")):
        fm = parse_frontmatter(f)
        name = fm.get("name", f.stem)
        agents[name] = {
            "location": str(f.relative_to(ROOT)),
            "description": fm.get("description", "")[:300],
            "summary": fm.get("summary", "")[:200],
            "domain": fm.get("domain", ""),
            "tier": fm.get("tier", "specialist"),
            "tools": fm.get("tools", ""),
            "model": fm.get("model", "default"),
            "memory": fm.get("memory", ""),
        }
    return agents


def build_skill_manifest() -> dict:
    skills = {}
    if not SKILLS_DIR.exists():
        return skills
    for f in sorted(SKILLS_DIR.rglob("SKILL.md")):
        fm = parse_frontmatter(f)
        name = fm.get("name", f.parent.name)
        skills[name] = {
            "location": str(f.relative_to(ROOT)),
            "description": fm.get("description", "")[:300],
        }
    return skills


def get_newest_source_mtime() -> float:
    newest = 0
    for d in [AGENTS_DIR, SKILLS_DIR]:
        if not d.exists():
            continue
        for f in d.rglob("*.md"):
            try:
                mtime = os.path.getmtime(f)
                if mtime > newest:
                    newest = mtime
            except OSError:
                continue
    return newest


def main():
    check_mode = "--check" in sys.argv

    if check_mode:
        if not AGENT_MANIFEST.exists() or not SKILL_MANIFEST.exists():
            print("STALE: manifests don't exist")
            return 1
        source_mtime = get_newest_source_mtime()
        manifest_mtime = min(
            os.path.getmtime(AGENT_MANIFEST),
            os.path.getmtime(SKILL_MANIFEST),
        )
        if source_mtime > manifest_mtime:
            print("STALE: source files newer than manifests")
            return 1
        print("FRESH: manifests are up to date")
        return 0

    GENERATED.mkdir(parents=True, exist_ok=True)

    agents = build_agent_manifest()
    skills = build_skill_manifest()

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    agent_data = {
        "schemaVersion": 1,
        "generatedAt": now,
        "count": len(agents),
        "agents": agents,
    }

    skill_data = {
        "schemaVersion": 1,
        "generatedAt": now,
        "count": len(skills),
        "skills": skills,
    }

    with open(AGENT_MANIFEST, "w") as f:
        json.dump(agent_data, f, indent=2, ensure_ascii=False)

    with open(SKILL_MANIFEST, "w") as f:
        json.dump(skill_data, f, indent=2, ensure_ascii=False)

    print(f"Agent manifest: {len(agents)} agents → {AGENT_MANIFEST.relative_to(ROOT)}")
    print(f"Skill manifest: {len(skills)} skills → {SKILL_MANIFEST.relative_to(ROOT)}")
    print(f"Generated at: {now}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
