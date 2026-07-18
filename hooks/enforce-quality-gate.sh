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
    # Freshness window: a `pnpm exec playwright test --reporter=list` run
    # REPLACES the config's reporter list entirely, so
    # e2e/quality-gate-reporter.ts never fires — it can neither create NOR
    # clean the marker for that run. A stale marker from an earlier good run
    # would otherwise silently survive a run that would have failed. The
    # reporter cannot defend against this from inside itself (it never runs);
    # this hook is the one place that CAN still catch it, by refusing to
    # trust a marker older than a full suite run plausibly takes. 30 minutes
    # is generous headroom over the observed ~2-3 minute full-suite runtime.
    MAX_MARKER_AGE_SECONDS=1800
    if [ -f "$MARKER" ]; then
        MARKER_TIMESTAMP=$(cat "$MARKER" 2>/dev/null)
        MARKER_EPOCH=$(date -d "$MARKER_TIMESTAMP" +%s 2>/dev/null)
        NOW_EPOCH=$(date +%s)
        if [ -z "$MARKER_EPOCH" ]; then
            rm -f "$MARKER"
            echo "BLOCKED: Quality gate marker is unreadable/not a valid timestamp — treating as untrusted."
            echo "Re-run: pnpm test:e2e (full suite, no --reporter override) then retry commit."
            exit 2
        fi
        MARKER_AGE=$((NOW_EPOCH - MARKER_EPOCH))
        if [ "$MARKER_AGE" -gt "$MAX_MARKER_AGE_SECONDS" ] || [ "$MARKER_AGE" -lt 0 ]; then
            rm -f "$MARKER"
            echo "BLOCKED: Quality gate marker is stale (${MARKER_AGE}s old, max ${MAX_MARKER_AGE_SECONDS}s)."
            echo "A run with --reporter=list (or similar) bypasses e2e/quality-gate-reporter.ts entirely and"
            echo "cannot refresh or clear this marker — it must not be trusted past its freshness window."
            echo "Re-run: pnpm test:e2e (full suite, no --reporter override) then retry commit."
            exit 2
        fi
        rm -f "$MARKER"
        exit 0
    else
        echo "BLOCKED: Quality gate not passed. Before committing:"
        echo "1. Run biome check on modified files (git diff --name-only | xargs npx biome check)"
        echo "2. Run npx tsc --noEmit"
        echo "3. Run npx convex dev (if backend changed)"
        echo "4. Update CHANGELOG.md"
        echo "5. Then: pnpm test:e2e (full suite — this is what creates the marker, never hand-write it)"
        exit 2
    fi
fi

# Not a git commit — allow
exit 0
