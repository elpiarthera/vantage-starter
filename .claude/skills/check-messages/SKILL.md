---
description: Check and respond to peer messages from other orchestrators (Pi, Tau, Phi). Use this skill whenever the user says "check messages", "read messages", "any messages", "peers", or "inbox" -- even if they don't say "claude-peers" explicitly.
user_invocable: true
---

Check for new messages from other Claude Code instances using claude-peers MCP.

1. Call `mcp__claude-peers__check_messages`
2. If messages exist, summarize each one briefly
3. If action is needed, propose next steps
4. If no messages, say "No new messages."
