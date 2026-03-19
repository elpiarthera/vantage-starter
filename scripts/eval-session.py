#!/usr/bin/env python3
"""
eval-session.py — Orchestrator behavioral scorecard for Claude Code JSONL sessions.

Measures 4 metrics:
  1. Delegation ratio — Agent calls vs direct file-touching tools
  2. Routing accuracy — specialist vs general-purpose agent usage
  3. Brief quality — Agent prompt length in the sweet-spot range
  4. Orchestrator leakage — direct file ops that should have been delegated

Adapted for VantageStarter's 7-agent team.

Usage:
  python3 scripts/eval-session.py <path-to-session.jsonl>
  python3 scripts/eval-session.py --latest
"""

import json
import os
import sys
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent

# VantageStarter project session path
SESSIONS_DIR = Path.home() / ".claude/projects/-home-laurentperello-coding-vantage-starter"
OUTPUT_DIR = ROOT / "analysis" / "session-evals"

# VantageStarter's 7 specialist agents
SPECIALIST_AGENTS = {
    "dev-frontend",
    "dev-convex-expert",
    "clerk-expert",
    "dev-seo",
    "dev-sentinel",
    "accessibility-audit",
    "dev-senior-dev",
}

BUILTIN_AGENTS = {"Explore", "MCP", "Browser"}

DIRECT_TOOLS = {"Read", "Write", "Edit", "Bash", "Grep", "Glob"}

PROCESS_FILE_PATTERNS = [
    r"PROGRESS\.md$",
    r"CHANGELOG\.md$",
    r"settings\.json$",
    r"registry\.json$",
    r"CLAUDE\.md$",
    r"\.git/",
    r"analysis/",
    r"generated/",
]

PROCESS_BASH_PATTERNS = [
    r"^\s*git\s",
    r"^\s*date\b",
    r"^\s*mkdir\s",
    r"^\s*ls\b",
    r"^\s*pwd\b",
    r"^\s*cd\s",
    r"^\s*npx\s",
    r"^\s*npm\s",
    r"^\s*pnpm\s",
    r"^\s*python3 scripts/",
]

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


def parse_session(path: Path) -> dict:
    agent_calls = []
    direct_tool_uses = []
    session_id = path.stem
    session_start = None
    git_branch = None

    with open(path, encoding="utf-8", errors="replace") as f:
        for raw_line in f:
            raw_line = raw_line.strip()
            if not raw_line:
                continue
            try:
                obj = json.loads(raw_line)
            except json.JSONDecodeError:
                continue

            if session_start is None and obj.get("timestamp"):
                session_start = obj.get("timestamp")
            if git_branch is None and obj.get("gitBranch"):
                git_branch = obj.get("gitBranch")

            if obj.get("type") != "assistant":
                continue

            content = obj.get("message", {}).get("content", [])
            if not isinstance(content, list):
                continue

            for block in content:
                if not isinstance(block, dict) or block.get("type") != "tool_use":
                    continue

                tool_name = block.get("name", "")
                inp = block.get("input", {}) or {}

                if tool_name == "Agent":
                    subagent = inp.get("subagent_type", "unknown")
                    prompt = inp.get("prompt", "")
                    agent_calls.append({
                        "subagent_type": subagent,
                        "prompt_len": len(prompt),
                        "prompt_preview": prompt[:120],
                        "description": inp.get("description", "")[:100],
                    })
                elif tool_name in DIRECT_TOOLS:
                    path_or_cmd = (
                        inp.get("file_path") or inp.get("command") or
                        inp.get("pattern") or inp.get("path") or ""
                    )
                    direct_tool_uses.append({
                        "tool": tool_name,
                        "target": str(path_or_cmd)[:120],
                    })

    return {
        "session_id": session_id,
        "session_file": str(path),
        "session_start": session_start,
        "git_branch": git_branch,
        "agent_calls": agent_calls,
        "direct_tool_uses": direct_tool_uses,
    }


def is_process_tool_use(entry: dict) -> bool:
    tool = entry["tool"]
    target = entry["target"]

    for pattern in PROCESS_FILE_PATTERNS:
        if re.search(pattern, target, re.IGNORECASE):
            return True

    if tool == "Bash":
        return any(re.match(p, target, re.IGNORECASE) for p in PROCESS_BASH_PATTERNS)

    if tool in ("Read", "Glob", "Grep"):
        return True  # Context gathering is always legitimate

    if tool in ("Write", "Edit"):
        process_write_patterns = [
            r"PROGRESS\.md$", r"CHANGELOG\.md$", r"analysis/",
            r"generated/", r"docs/", r"\.claude/agent-memory/",
        ]
        return any(re.search(p, target, re.IGNORECASE) for p in process_write_patterns)

    return False


def classify_agent(name: str) -> str:
    if name in SPECIALIST_AGENTS:
        return "specialist"
    if name in BUILTIN_AGENTS:
        return "builtin"
    return "general-purpose"


def classify_brief_length(length: int) -> str:
    if length < 50:
        return "too-vague"
    if length < 150:
        return "borderline-short"
    if length <= 3000:
        return "sweet-spot"
    if length <= 5000:
        return "borderline-long"
    return "micromanagement"


def compute_scores(data: dict) -> dict:
    agent_calls = data["agent_calls"]
    direct_tool_uses = data["direct_tool_uses"]

    deliverable_agent_calls = [a for a in agent_calls if classify_agent(a["subagent_type"]) != "builtin"]
    leakage_candidates = [t for t in direct_tool_uses if not is_process_tool_use(t)]

    total_deliverable_ops = len(deliverable_agent_calls) + len(leakage_candidates)
    delegation_ratio = (
        len(deliverable_agent_calls) / total_deliverable_ops * 100
        if total_deliverable_ops > 0 else 100.0
    )

    non_builtin = [a for a in agent_calls if classify_agent(a["subagent_type"]) != "builtin"]
    specialist_calls = [a for a in non_builtin if classify_agent(a["subagent_type"]) == "specialist"]
    gp_calls = [a for a in non_builtin if classify_agent(a["subagent_type"]) == "general-purpose"]
    routing_accuracy = (
        len(specialist_calls) / len(non_builtin) * 100 if non_builtin else 100.0
    )

    brief_classes = {"too-vague": [], "borderline-short": [], "sweet-spot": [], "borderline-long": [], "micromanagement": []}
    for a in agent_calls:
        brief_classes[classify_brief_length(a["prompt_len"])].append(a)
    n_acceptable = len(brief_classes["sweet-spot"]) + len(brief_classes["borderline-long"])
    brief_quality = n_acceptable / len(agent_calls) * 100 if agent_calls else 100.0

    return {
        "agent_calls": agent_calls,
        "direct_tool_uses": direct_tool_uses,
        "leakage_candidates": leakage_candidates,
        "non_builtin_calls": non_builtin,
        "specialist_calls": specialist_calls,
        "general_purpose_calls": gp_calls,
        "brief_classifications": brief_classes,
        "delegation_ratio": round(delegation_ratio, 1),
        "routing_accuracy": round(routing_accuracy, 1),
        "brief_quality": round(brief_quality, 1),
        "n_leakage": len(leakage_candidates),
        "n_agent_calls": len(agent_calls),
        "n_direct_tools": len(direct_tool_uses),
        "n_process_tools": len(direct_tool_uses) - len(leakage_candidates),
    }


def sc(score, hi=80, lo=60):
    return GREEN if score >= hi else (YELLOW if score >= lo else RED)


def print_scorecard(data: dict, scores: dict):
    sid = data["session_id"][:16]
    branch = data.get("git_branch") or "unknown"

    print(f"\n{BOLD}{CYAN}{'─' * 64}{RESET}")
    print(f"{BOLD}  SESSION SCORECARD — VantageStarter{RESET}")
    print(f"{BOLD}{CYAN}{'─' * 64}{RESET}")
    print(f"  Session : {CYAN}{sid}...{RESET}")
    print(f"  Branch  : {branch}")
    print(f"{BOLD}{CYAN}{'─' * 64}{RESET}")

    dr = scores["delegation_ratio"]
    print(f"\n  {BOLD}1. DELEGATION{RESET}  {sc(dr)}{dr}%{RESET}  {'PASS' if dr >= 80 else 'FAIL'}")
    print(f"     {len(scores['specialist_calls'])} specialist calls, {len(scores['general_purpose_calls'])} general-purpose, {scores['n_leakage']} leakage")

    ra = scores["routing_accuracy"]
    print(f"\n  {BOLD}2. ROUTING{RESET}    {sc(ra, 90, 70)}{ra}%{RESET}  {'PASS' if ra >= 90 else 'FAIL'}")
    if scores["general_purpose_calls"]:
        for a in scores["general_purpose_calls"]:
            print(f"     {RED}GP: {a['subagent_type']} — {a['description'][:60]}{RESET}")

    bq = scores["brief_quality"]
    print(f"\n  {BOLD}3. BRIEFS{RESET}     {sc(bq, 70, 50)}{bq}%{RESET} acceptable")

    grade = (
        scores["delegation_ratio"] * 0.35 + scores["routing_accuracy"] * 0.35 +
        scores["brief_quality"] * 0.20 + max(0, 100 - scores["n_leakage"] * 10) * 0.10
    )
    print(f"\n{BOLD}{CYAN}{'─' * 64}{RESET}")
    print(f"  {BOLD}GRADE{RESET}  {sc(grade)}{grade:.0f}/100{RESET}")
    print(f"{BOLD}{CYAN}{'─' * 64}{RESET}\n")


def main():
    args = sys.argv[1:]
    if not args:
        print("Usage: python3 scripts/eval-session.py <session.jsonl> | --latest")
        return 0

    if args[0] == "--latest":
        if not SESSIONS_DIR.exists():
            print(f"Sessions directory not found: {SESSIONS_DIR}")
            return 1
        files = sorted(SESSIONS_DIR.glob("*.jsonl"), key=lambda f: f.stat().st_mtime)
        if not files:
            print("No session files found.")
            return 1
        session_path = files[-1]
        print(f"{DIM}Latest session: {session_path.name}{RESET}")
    else:
        session_path = Path(args[0])

    if not session_path.exists():
        print(f"Session not found: {session_path}")
        return 1

    data = parse_session(session_path)
    scores = compute_scores(data)
    print_scorecard(data, scores)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    date_str = datetime.now().strftime("%Y-%m-%d")
    out_path = OUTPUT_DIR / f"eval-{date_str}-{data['session_id'][:8]}.md"
    grade = (
        scores["delegation_ratio"] * 0.35 + scores["routing_accuracy"] * 0.35 +
        scores["brief_quality"] * 0.20 + max(0, 100 - scores["n_leakage"] * 10) * 0.10
    )
    out_path.write_text(
        f"# Session Eval — {data['session_id'][:16]}\n\n"
        f"**Grade:** {grade:.0f}/100\n\n"
        f"| Metric | Score |\n|--------|-------|\n"
        f"| Delegation | {scores['delegation_ratio']}% |\n"
        f"| Routing accuracy | {scores['routing_accuracy']}% |\n"
        f"| Brief quality | {scores['brief_quality']}% |\n"
        f"| Leakage | {scores['n_leakage']} ops |\n"
    )
    print(f"Report: {out_path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
