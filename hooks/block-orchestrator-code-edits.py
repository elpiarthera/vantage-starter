#!/usr/bin/env python3
"""
PreToolUse hook: block orchestrator from editing application code.

Orchestrator CAN edit: .claude/, CLAUDE.md, AGENTS.md, hooks/, scripts/, docs/, config files,
CHANGELOG.md, project-context.md, *.json (root configs), *.mjs (root configs).

Orchestrator CANNOT edit: app/, components/, convex/, lib/, hooks/*.ts, hooks/*.tsx,
providers/, src/, stores/, contexts/, services/, types/, middleware.ts.
"""
import json, os, sys
from pathlib import Path

try:
    input_data = json.loads(sys.stdin.read())
except Exception:
    sys.exit(0)

# Specialist agents (dev-convex-expert, dev-frontend, etc.) set this sentinel
# so the orchestrator block hook does not fire against them.
if Path("/tmp/.specialist-mode").exists():
    sys.exit(0)

tool_name = input_data.get("tool_name", "")
tool_input = input_data.get("tool_input", {})

file_path = tool_input.get("file_path", "")
if not file_path:
    sys.exit(0)

# Normalize to relative path from project root
cwd = os.getcwd()
if file_path.startswith(cwd):
    rel = file_path[len(cwd):].lstrip("/")
else:
    rel = file_path

# Allowed paths (orchestrator infrastructure)
ALLOWED_PREFIXES = (
    ".claude/", "hooks/", "scripts/", "docs/", "messages/",
)
ALLOWED_FILES = (
    "CLAUDE.md", "AGENTS.md", "CHANGELOG.md", "project-context.md",
    "biome.json", "tsconfig.json", "package.json", "next.config.mjs",
    "postcss.config.mjs", "tailwind.config.ts", "lit-ui.config.json",
    "vercel.json", "vitest.config.ts", "jest.config.ts",
)

# Allow hook .py files but block hook .ts/.tsx (those are app code)
if rel.startswith("hooks/") and rel.endswith(".py"):
    sys.exit(0)

for prefix in ALLOWED_PREFIXES:
    if rel.startswith(prefix):
        if rel.startswith("hooks/") and (rel.endswith(".ts") or rel.endswith(".tsx")):
            break
        sys.exit(0)

for f in ALLOWED_FILES:
    if rel == f:
        sys.exit(0)

# Block everything else
print(json.dumps({
    "decision": "block",
    "reason": f"Orchestrator cannot edit application code: {rel}. Delegate to a specialist agent."
}))
sys.exit(0)
