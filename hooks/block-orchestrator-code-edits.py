#!/usr/bin/env python3
"""
Universal orchestrator hook — deploy to EVERY orchestrator (Pi, Tau, Phi, etc.)
PreToolUse on Edit/Write: Orchestrators delegate. They never write code.

Allowed:
- .md files in context, knowledge, memory, templates, resources, diary, etc.
- ALL files in .claude/ (settings, hooks, skills, rules = infrastructure)
- /tmp
Blocked: everything else (code files, components, etc.)

Exit 0 = allow
Exit 2 = block
"""
import json
import sys
import os

# Paths where orchestrators ARE allowed to edit .md files only
ALLOWED_MD_DIRS = [
    "context/",
    "knowledge/",
    "memory/",
    "templates/",
    "resources/",
    "diary/",
    "decisions/",
    "analysis/",
    "playbooks/",
    "docs/",
]

# Paths where ALL file types are allowed (infrastructure, not code)
ALLOWED_ALL_DIRS = [
    ".claude/",
    "hooks/",
]

try:
    data = json.load(sys.stdin)
    file_path = data.get("tool_input", {}).get("file_path", "")

    if not file_path:
        sys.exit(0)

    # Always allow /tmp
    if file_path.startswith("/tmp"):
        sys.exit(0)

    # Allow when a specialist agent has set the bypass sentinel
    if os.path.exists("/tmp/specialist-agent-active"):
        sys.exit(0)

    # Allow all files in infrastructure dirs (.claude/)
    for allowed_dir in ALLOWED_ALL_DIRS:
        if ("/" + allowed_dir) in file_path:
            sys.exit(0)

    # Allow .md files in allowed directories
    if file_path.endswith(".md"):
        for allowed_dir in ALLOWED_MD_DIRS:
            if ("/" + allowed_dir) in file_path:
                sys.exit(0)

    # Block everything else
    basename = os.path.basename(file_path)
    print(
        f"BLOCKED: Orchestrators do not write code. You tried to edit: {basename}\n"
        f"Full path: {file_path}\n\n"
        f"Follow the orchestration protocol:\n"
        f"1. Read LIBRARY-INDEX.md → find the right specialized agent\n"
        f"2. Find the correct brief template (resources/templates/brief-ui.md or brief-backend.md)\n"
        f"3. Fill the template with exact file:line:change instructions\n"
        f"4. Delegate to the agent or send via claude-peers\n"
    )
    sys.exit(2)

except Exception:
    sys.exit(0)
