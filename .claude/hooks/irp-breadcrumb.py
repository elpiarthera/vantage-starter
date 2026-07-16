#!/usr/bin/env python3
"""
PostToolUse hook on mcp__vantage-peers__* mutations:
Sets /tmp/.irp-can-start so the next start_task is allowed.

Day 133 root-fix (Tau finding, 3rd hole of the same class): terminal exits
were ENUMERATED BY TOOL NAME (complete_task, then +block_task), and the list
was wrong twice — update_task status=review, the NORMAL exit in a
PR-per-deliverable fleet, froze the queue. The unlock is now DERIVED from
the status transition carried by the payload, not from a hand-typed list of
tool names: any VP mutation that moves a task OUT of in_progress unlocks.
Name-only terminal tools (complete_task/block_task/delete_task) carry no
status field, so they unlock by construction. A mutation without a status
change (reprioritize, reassign) does NOT unlock — the guard still guards.
"""
import json
import sys
from pathlib import Path

CAN_START_FLAG = Path("/tmp/.irp-can-start")

# These mutations terminalize a task by construction (no status field in payload).
ALWAYS_TERMINAL = {
    "mcp__vantage-peers__complete_task",
    "mcp__vantage-peers__block_task",
    "mcp__vantage-peers__delete_task",
    "mcp__vantage-peers__bulk_complete_tasks",
}

# Any status value that is not in_progress means the task LEFT in_progress.
NON_RUNNING_STATUSES = {"review", "blocked", "done", "todo"}

try:
    data = json.load(sys.stdin)
    tool = data.get("tool_name", "")
    if not tool.startswith("mcp__vantage-peers__"):
        sys.exit(0)
    if tool in ALWAYS_TERMINAL:
        CAN_START_FLAG.touch()
        sys.exit(0)
    tool_input = data.get("tool_input") or {}
    status = tool_input.get("status")
    if tool_input.get("taskId") and status in NON_RUNNING_STATUSES:
        CAN_START_FLAG.touch()
    sys.exit(0)
except Exception:
    sys.exit(0)
