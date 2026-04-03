#!/usr/bin/env bash
# Universal orchestrator hook — deploy to EVERY orchestrator (Pi, Tau, Phi)
# PreToolUse on Bash: Blocks git commit unless quality gates passed.
#
# Checks:
# 1. CHANGELOG.md must be staged
# 2. /tmp/.quality-gate-passed marker must exist (set after biome + tsc pass)
# 3. Must be on a feature branch (not main/master)
#
# Exit 0 = allow
# Exit 2 = block

INPUT=$(cat 2>/dev/null || echo "{}")

# Extract command from hook input
COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    cmd = data.get('tool_input', {}).get('command', '')
    print(cmd)
except Exception:
    print('')
" 2>/dev/null)

# Only intercept git commit (not amend)
if echo "$COMMAND" | grep -qE 'git\s+commit' && ! echo "$COMMAND" | grep -qE -- '--amend'; then

    # Block commits to main/master
    BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
        echo "BLOCKED: Never commit directly to main/master. Create a feature branch first."
        exit 2
    fi

    # Check CHANGELOG.md is staged
    CHANGELOG_STAGED=$(git diff --cached --name-only 2>/dev/null | grep -c "CHANGELOG.md" || true)
    if [ "$CHANGELOG_STAGED" = "0" ]; then
        echo "BLOCKED: CHANGELOG.md not staged. Update CHANGELOG.md with what changed, git add it, then retry."
        exit 2
    fi

    # Check quality gate marker
    MARKER="/tmp/.quality-gate-passed"
    if [ -f "$MARKER" ]; then
        rm -f "$MARKER"
        exit 0
    else
        echo "BLOCKED: Quality gate not passed. Before committing:"
        echo "1. Run biome check on modified files (git diff --name-only | xargs npx biome check)"
        echo "2. Run npx tsc --noEmit"
        echo "3. Run npx convex dev (if backend changed)"
        echo "4. Update CHANGELOG.md"
        echo "5. Then: touch /tmp/.quality-gate-passed"
        exit 2
    fi
fi

# Not a git commit — allow
exit 0
