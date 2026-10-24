#!/usr/bin/env python3
"""
PostToolUse hook on Read|Bash|Glob|Grep — records WHICH artifacts were observed.

The previous version stamped a single mtime: it recorded THAT a verification
happened, never WHAT it covered. A message could then cite a path nobody had
looked at, as long as some unrelated command had run in the last two minutes —
and, symmetrically, a genuinely observed artifact was refused once the clock
ran out. Freshness by elapsed time is not freshness by content.

This version appends every path/URL the tool actually touched — its input and
its output — to a session ledger. The companion guard then asks a question
about the ARTIFACT ("was this one observed?") instead of a question about the
clock ("did anything happen recently?").

Ledger: one file per operating-system user (one token per line, append-only).
Fail-open: a recorder that fails must never stop a session.
"""
import json
import os
import re
import sys
from pathlib import Path

# The ledger is PER OPERATING-SYSTEM USER. A single shared path is owned by
# whichever user created it, so every other user's writes are refused and that
# station can never record a verification — the reader then refuses all of its
# claims, forever. A guard that silences a station does not protect it.
LEDGER = Path(f"/tmp/.claude-verified-tokens-{os.geteuid()}")
LEGACY_LEDGER = Path("/tmp/.claude-verified-tokens")
MAX_LEDGER_BYTES = 4_000_000

TOKEN_RES = [
    re.compile(r"https?://[^\s'\"<>)\]]+"),
    re.compile(r"/(?:root|home|tmp)/[\w./+-]+"),
    re.compile(r"\b[\w./-]+\.(?:md|ts|tsx|js|jsx|mjs|cjs|json|py|yaml|yml|toml|sh|css|html)\b"),
]


def tokens_in(text: str) -> set:
    found = set()
    if not text:
        return found
    for rx in TOKEN_RES:
        for m in rx.finditer(text):
            t = m.group(0).rstrip(".,;:)]}'\"")
            if len(t) > 3:
                found.add(t)
    return found


def main() -> int:
    raw = sys.stdin.read()
    if not raw.strip():
        return 0
    data = json.loads(raw)
    if data.get("tool_name", "") not in ("Read", "Glob", "Grep", "Bash"):
        return 0

    blob = json.dumps(data.get("tool_input", {})) + "\n" + json.dumps(data.get("tool_response", ""))
    found = tokens_in(blob)
    if not found:
        return 0

    try:
        if LEDGER.exists() and LEDGER.stat().st_size > MAX_LEDGER_BYTES:
            LEDGER.unlink()
        with LEDGER.open("a", encoding="utf-8") as f:
            for t in sorted(found):
                f.write(t + "\n")
    except Exception:
        pass
    return 0


if __name__ == "__main__" and not globals().get("_TESTING"):
    try:
        sys.exit(main())
    except Exception:
        sys.exit(0)
