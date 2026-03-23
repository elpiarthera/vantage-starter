#!/usr/bin/env python3
"""
Universal orchestrator hook — deploy to EVERY orchestrator (Pi, Tau, Phi)
PreToolUse on Bash: Blocks git commit unless quality gates passed.

Checks:
1. Not on main/master
2. CHANGELOG.md must be staged
3. /tmp/.quality-gate-passed marker must exist

Exit 0 = allow
Exit 2 = block
"""
import json
import sys
import os
import subprocess

MARKER = "/tmp/.quality-gate-passed"

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

command = data.get("tool_input", {}).get("command", "")

# Only intercept git commit (not amend)
if "git commit" not in command or "--amend" in command:
    sys.exit(0)

# Block commits to main/master
try:
    branch = subprocess.run(
        ["git", "branch", "--show-current"],
        capture_output=True, text=True, timeout=5
    ).stdout.strip()
except Exception:
    branch = "unknown"

if branch in ("main", "master"):
    print("BLOCKED: Never commit directly to main/master. Create a feature branch first.")
    sys.exit(2)

# Check CHANGELOG.md is staged
try:
    staged = subprocess.run(
        ["git", "diff", "--cached", "--name-only"],
        capture_output=True, text=True, timeout=5
    ).stdout
except Exception:
    staged = ""

if "CHANGELOG.md" not in staged:
    print("BLOCKED: CHANGELOG.md not staged. Update CHANGELOG.md with what changed, git add it, then retry.")
    sys.exit(2)

# Check quality gate marker
if os.path.exists(MARKER):
    os.remove(MARKER)
    sys.exit(0)

print("BLOCKED: Quality gate not passed. Before committing:")
print("1. Run biome check on modified files")
print("2. Run npx tsc --noEmit")
print("3. Run npx convex dev (if backend changed)")
print("4. Update CHANGELOG.md")
print("5. Then: touch /tmp/.quality-gate-passed")
sys.exit(2)
