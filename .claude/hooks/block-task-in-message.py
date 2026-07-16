#!/usr/bin/env python3
"""
PreToolUse hook on mcp__vantage-peers__send_message:
Blocks messages containing task instructions (imperative verbs, numbered steps,
spec-like sections) unless they reference a missionId/taskId.

Status reports (containing "COMPLETE", "done", etc.) are always allowed.

Exit 0 = allow
Exit 2 = block
"""
import json
import re
import sys

# Imperative verbs that indicate task instructions
IMPERATIVE_VERBS = [
    "implemente", "deploie", "configure", "cree", "fix", "test",
    "ajoute", "supprime", "verifie", "lance", "run", "create",
    "deploy", "add", "remove", "check", "build", "write", "update",
    "delete", "implement", "setup", "install", "migrate", "refactor",
    "merge", "push", "pull", "commit", "revert",
]

# Spec-like section headers
SPEC_HEADERS = [
    "## TASK", "## FILES", "## ACCEPTANCE", "## EXACT CHANGES",
    "## DESIGN TOKENS", "## SCHEMA", "SPEC:", "BRIEF:",
    "DELIVERABLES:", "## REGISTRY CHECK",
]

# Status report markers — exempt from blocking
STATUS_MARKERS = [
    "complete", "done", "terminé", "fini", "moving to", "passe à",
    "fait", "deployed", "déployé", "verified", "vérifié",
    "t1 done", "t2 done", "tasks marked", "moving to o",
]

# Mission/task reference patterns
MISSION_TASK_PATTERNS = [
    re.compile(r"\bmissionId\b", re.IGNORECASE),
    re.compile(r"\bmission\s*:", re.IGNORECASE),
    re.compile(r"\bO\d+\b"),  # O1, O2, etc.
    re.compile(r"\bmission\s+k5\w+"),
    re.compile(r"\btaskId\b", re.IGNORECASE),
    re.compile(r"\btask\s*:", re.IGNORECASE),
    re.compile(r"\bT\d+\b"),  # T1, T2, etc.
    re.compile(r"\btask\s+k1\w+"),
]

try:
    data = json.load(sys.stdin)
    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})

    if tool_name != "mcp__vantage-peers__send_message":
        sys.exit(0)

    content = tool_input.get("content", "")
    content_lower = content.lower()

    # Check for status report markers — always allow
    for marker in STATUS_MARKERS:
        if marker in content_lower:
            sys.exit(0)

    # Detect task-like patterns
    patterns_found = []

    # 1. Count imperative verb line starters
    lines = content.split("\n")
    imperative_count = 0
    for line in lines:
        stripped = line.strip().lower()
        # Remove leading markers (-, *, numbers)
        stripped = re.sub(r"^[-*•]\s*", "", stripped)
        stripped = re.sub(r"^\d+[.)]\s*", "", stripped)
        for verb in IMPERATIVE_VERBS:
            if stripped.startswith(verb):
                imperative_count += 1
                break
    if imperative_count >= 3:
        patterns_found.append(f"{imperative_count} imperative verbs")

    # 2. Count numbered steps
    numbered_steps = len(re.findall(r"^\s*\d+[.)]\s+\S", content, re.MULTILINE))
    if numbered_steps >= 3:
        patterns_found.append(f"{numbered_steps} numbered steps")

    # 3. Check for spec-like headers
    for header in SPEC_HEADERS:
        if header.lower() in content_lower:
            patterns_found.append(f"spec header: {header}")
            break

    # If no task patterns detected — allow
    if not patterns_found:
        sys.exit(0)

    # Check for mission/task references — allow if present
    for pattern in MISSION_TASK_PATTERNS:
        if pattern.search(content):
            sys.exit(0)

    # Block — task instructions without mission/task reference
    print(
        f"BLOCKED: Message contains task instructions without a mission/task reference.\n"
        f"Use create_task with a missionId instead of embedding instructions in messages.\n"
        f"Task-like patterns detected: {', '.join(patterns_found)}\n\n"
        f"If this is a status report, include 'COMPLETE' or 'done' in the message.",
        file=sys.stderr,
    )
    sys.exit(2)

except Exception:
    sys.exit(0)
