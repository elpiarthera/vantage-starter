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
    # Staleness is derived from the TREE, never from a typed time window.
    # A `pnpm exec playwright test --reporter=list` run REPLACES the config's
    # reporter list entirely, so e2e/quality-gate-reporter.ts never fires —
    # it can neither create NOR clean the marker for that run. That leaves a
    # stale marker from an earlier good run able to silently survive a run
    # that would have failed. The marker is not untrustworthy because it is
    # OLD (a marker from an hour ago on an untouched tree is still true); it
    # is untrustworthy the moment the tree it vouched for changes underneath
    # it. So the check compares the marker's own timestamp against the
    # newest mtime among every git-tracked file (`git ls-files` — this
    # includes anything currently staged, since `git add` indexes it) — a
    # signal read straight from the repository, not chosen by a human.
    if [ -f "$MARKER" ]; then
        MARKER_TIMESTAMP=$(cat "$MARKER" 2>/dev/null)
        MARKER_EPOCH=$(date -d "$MARKER_TIMESTAMP" +%s 2>/dev/null)
        if [ -z "$MARKER_EPOCH" ]; then
            rm -f "$MARKER"
            echo "BLOCKED: Quality gate marker is unreadable/not a valid timestamp — treating as untrusted."
            echo "Re-run: pnpm test:e2e (full suite, no --reporter override) then retry commit."
            exit 2
        fi

        NEWEST_TRACKED_EPOCH=$(git ls-files -z 2>/dev/null \
            | xargs -0 -I{} stat -c '%Y' "{}" 2>/dev/null \
            | sort -rn | head -1)

        if [ -z "$NEWEST_TRACKED_EPOCH" ]; then
            rm -f "$MARKER"
            echo "BLOCKED: Could not derive the newest tracked-file mtime (git ls-files/stat failed) —"
            echo "cannot prove the marker still matches the tree. Treating as untrusted rather than guessing."
            echo "Re-run: pnpm test:e2e (full suite, no --reporter override) then retry commit."
            exit 2
        fi

        if [ "$NEWEST_TRACKED_EPOCH" -gt "$MARKER_EPOCH" ]; then
            rm -f "$MARKER"
            echo "BLOCKED: Quality gate marker is stale — a tracked file's mtime ($NEWEST_TRACKED_EPOCH) is newer"
            echo "than the marker's own timestamp ($MARKER_EPOCH). The tree changed after the suite ran, most"
            echo "commonly because --reporter=list bypassed e2e/quality-gate-reporter.ts on a later, failing run."
            echo "Re-run: pnpm test:e2e (full suite, no --reporter override) then retry commit."
            exit 2
        fi

        rm -f "$MARKER"
        exit 0
    else
        echo "BLOCKED: Quality gate not passed. Before committing:"
        echo "1. Run biome check on modified files (git diff --name-only | xargs pnpm exec biome check)"
        echo "2. Run pnpm exec tsc --noEmit"
        echo "3. Run pnpm exec convex dev (if backend changed)"
        echo "4. Update CHANGELOG.md"
        echo "5. Then: pnpm test:e2e (full suite — this is what creates the marker, never hand-write it)"
        exit 2
    fi
fi

# Not a git commit — allow
exit 0
