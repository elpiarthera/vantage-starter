#!/usr/bin/env python3
"""
PostToolUse hook on mcp__vantage-peers__complete_task:
Touches /tmp/.qa-passed ONLY on an explicit structured QA attestation line.

Day 133 fix (Tau finding, Pi patch): the old version substring-matched
prose ("tests", "qa") — so "Tests failing, do NOT deploy" AUTHORIZED a
deploy while an honest note not mentioning QA did not. A guard deciding on
incidental prose is inverted by construction (derive-never-type).

New contract: the breadcrumb is set only when the completionNote carries a
line matching exactly:
    QA-PASSED: <evidence>   (evidence >= 8 chars, e.g. "1242/1242 EXIT 0")
This is a deliberate, structured claim in a structured field — never a word
that can appear by accident inside a sentence.
"""
import json
import re
import sys
from pathlib import Path

BREADCRUMB = Path("/tmp/.qa-passed")
QA_LINE = re.compile(r"^\s*QA-PASSED:\s*(.{8,})\s*$", re.MULTILINE)

try:
    data = json.load(sys.stdin)
    if data.get("tool_name", "") != "mcp__vantage-peers__complete_task":
        sys.exit(0)
    note = data.get("tool_input", {}).get("completionNote", "")
    if QA_LINE.search(note):
        BREADCRUMB.touch()
    sys.exit(0)
except Exception:
    sys.exit(0)
