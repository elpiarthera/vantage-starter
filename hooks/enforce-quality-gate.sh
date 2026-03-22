#!/usr/bin/env bash
# Pre-commit quality gate hook
# Blocks git commit unless /tmp/.quality-gate-passed marker exists.
# The marker is consumed on use (one-time pass).

set -euo pipefail

MARKER="/tmp/.quality-gate-passed"

INPUT=$(cat)

# Extract command
COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    cmd = data.get('tool_input', {}).get('command', '')
    print(cmd)
except Exception:
    print('')
" 2>/dev/null)

# Only intercept git commit (not --amend)
if echo "$COMMAND" | grep -qE 'git\s+commit' && ! echo "$COMMAND" | grep -qE 'git\s+commit\s+--amend'; then
    # Check CHANGELOG.md was staged
    CHANGELOG_STAGED=$(git diff --cached --name-only 2>/dev/null | grep -c "CHANGELOG.md" || true)
    if [ "$CHANGELOG_STAGED" = "0" ]; then
        python3 -c "
import json
print(json.dumps({'decision': 'block', 'reason': 'BLOCKED: CHANGELOG.md not staged. Update CHANGELOG.md with what changed, git add it, then retry.'}))
"
        exit 0
    fi

    if [ -f "$MARKER" ]; then
        rm -f "$MARKER"
        exit 0
    else
        python3 -c "
import json
msg = (
    'BLOCKED: Quality gate not passed. Before committing:\n'
    '1. npx biome check — 0 errors on changed files\n'
    '2. npx tsc --noEmit — 0 errors\n'
    '3. CHANGELOG.md updated with this change\n'
    '4. Feature branch (never commit directly to main)\n\n'
    'Run checks, update CHANGELOG, then: touch /tmp/.quality-gate-passed'
)
print(json.dumps({'decision': 'block', 'reason': msg}))
"
        exit 0
    fi
fi

# Not a git commit — allow
exit 0
