#!/usr/bin/env python3
"""
Universal orchestrator hook — deploy to EVERY orchestrator (Pi, Tau, Phi, etc.)
PreToolUse on create_task: Enforce task quality gates.
Every task MUST include VERIFICATION: and TESTS: sections in its description.

Without both sections, the task cannot be verified or tested — it ships blind.

Exit 0 = allow
Exit 2 = block
"""
import json
import re
import sys

# A section header is present when its keyword appears followed by a colon,
# tolerating optional whitespace before the colon (FR style "VERIFICATION :").
# Matching on an optional space closes a false-negative class that blocked
# perfectly valid tasks over an espacing difference — a guard that refuses the
# legitimate gets bypassed or disabled (cf. hook-vitality-bite-probe).
REQUIRED_SECTIONS = [
    ("VERIFICATION", re.compile(r"\bverification\s*:", re.IGNORECASE)),
    ("TESTS", re.compile(r"\btests\s*:", re.IGNORECASE)),
]

try:
    data = json.load(sys.stdin)
    tool_input = data.get("tool_input", {})

    description = tool_input.get("description", "")

    if not description:
        # No description at all — block with the same quality message
        print(
            "BLOCKED: Task has no description.\n\n"
            "Every task MUST include:\n"
            "  VERIFICATION: (what will be checked to confirm the task is done)\n"
            "  TESTS: (how it will be tested — manually, automated, or by review)\n\n"
            "A task with no description cannot be delegated, verified, or closed.",
            file=sys.stderr,
        )
        sys.exit(2)

    missing = [
        label
        for label, pattern in REQUIRED_SECTIONS
        if not pattern.search(description)
    ]

    if not missing:
        sys.exit(0)

    missing_str = " and ".join(missing)
    print(
        f"BLOCKED: Task missing {missing_str} section(s).\n\n"
        f"Every task MUST include:\n"
        f"  VERIFICATION: (what will be checked to confirm the task is done)\n"
        f"  TESTS: (how it will be tested — manually, automated, or by review)\n\n"
        f"Add the missing section(s) to the description before creating the task.\n"
        f"Tasks without quality gates cannot be verified or closed with confidence.",
        file=sys.stderr,
    )
    sys.exit(2)

except Exception:
    sys.exit(0)
