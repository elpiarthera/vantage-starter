#!/usr/bin/env python3
"""
PreToolUse hook on mcp__vantage-peers__start_task:
Blocks starting a task if the previous IRP task was not completed first.
Uses /tmp/.irp-can-start flag set by irp-breadcrumb.py after each complete_task.

Exit 0 = allow
Exit 2 = block
"""
import json
import sys
from pathlib import Path

CAN_START_FLAG = Path("/tmp/.irp-can-start")

try:
    data = json.load(sys.stdin)
    tool_name = data.get("tool_name", "")

    if tool_name != "mcp__vantage-peers__start_task":
        sys.exit(0)

    # If flag exists, a complete_task was called before this start_task
    if CAN_START_FLAG.exists():
        CAN_START_FLAG.unlink(missing_ok=True)
        sys.exit(0)

    # No flag = trying to start without completing previous task
    print(
        "BLOCKED: Complete the current IRP task before starting the next one.\n"
        "IRP tasks must be completed sequentially (T0→T13).\n"
        "Run complete_task with completionNote on the current task first.",
        file=sys.stderr,
    )
    sys.exit(2)

except Exception:
    sys.exit(0)
