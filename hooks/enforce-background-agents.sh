#!/bin/bash
# Hook: PreToolUse on Agent
# Purpose: Block foreground agent launches. All agents must run in background.
# Why: Foreground agents block the orchestrator for minutes and the user loses contact.

# Read tool input from stdin
INPUT=$(cat)

# Check if run_in_background is set to true
if echo "$INPUT" | grep -q '"run_in_background":\s*true'; then
  echo '{"decision":"allow"}'
  exit 0
fi

echo '{"decision":"block","reason":"BLOCKED: All agents MUST run in background (run_in_background: true). Foreground agents block the user. Set run_in_background: true and retry."}'
exit 0
