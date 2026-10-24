#!/usr/bin/env python3
"""
PreToolUse hook on mcp__vantage-peers__send_message — a path or URL sent to a
peer must have been OBSERVED, not remembered.

What it replaces, and why. The previous version asked one question: "did any
verification tool run in the last 120 seconds?" That is freshness by elapsed
TIME, and it fails in both directions. It passed a message citing a path
nobody had ever looked at, provided some unrelated command had just run. And
it refused a message citing a URL that had been published and read minutes
earlier, because composing the message took longer than the window. The second
failure is the expensive one: on an autonomous queue a refusal stops the run
with nobody at the screen, and a guard that refuses legitimate work gets
disabled — after which it guards nothing.

The question is now about the ARTIFACT: were the paths and URLs in this
message seen by a tool in this session? The companion recorder
(verify-breadcrumb.py) writes every token a Read/Bash/Glob/Grep touched into a
session ledger; this guard reads it.

Three states, never two:
  exit 0 — every cited token, or at least one of them, was observed
  exit 2 — BLOCK: the message cites tokens and NOT ONE of them was observed
           (the "written from memory" case the guard exists for), naming them
  exit 2 — REFUSING TO JUDGE: the ledger cannot be read, naming what is missing

The blocking condition is deliberately "none observed" rather than "all
observed". A review message legitimately quotes a peer's evidence — paths this
session never opened — beside its own measurements. Demanding that every token
be observed would refuse exactly the messages this fleet is built to send.
"""
import json
import os
import re
import sys
from pathlib import Path

# Writes go to a per-user ledger (see verify-breadcrumb); reads take the union
# of this user's ledger and the legacy shared one, so a station that already
# holds tokens under the old path keeps them.
LEDGER = Path(f"/tmp/.claude-verified-tokens-{os.geteuid()}")
LEGACY_LEDGER = Path("/tmp/.claude-verified-tokens")

TOKEN_RES = [
    re.compile(r"https?://[^\s'\"<>)\]]+"),
    re.compile(r"/(?:root|home|tmp)/[\w./+-]+"),
    re.compile(r"\b[\w./-]+\.(?:md|ts|tsx|js|jsx|mjs|cjs|json|py|yaml|yml|toml|sh|css|html)\b"),
]


def tokens_in(text: str) -> list:
    found = []
    seen = set()
    if not text:
        return found
    for rx in TOKEN_RES:
        for m in rx.finditer(text):
            t = m.group(0).rstrip(".,;:)]}'\"")
            if len(t) > 3 and t not in seen:
                seen.add(t)
                found.append(t)
    return found


def observed(token: str, ledger: set) -> bool:
    """A token counts as observed when it was recorded, or when a recorded
    token contains it (a directory listing covers the files it printed, a
    comment URL covers its own issue page)."""
    if token in ledger:
        return True
    for rec in ledger:
        if token in rec or rec in token:
            return True
    return False


def run_hook(content: str, ledger_text, ledger_readable: bool) -> int:
    cited = tokens_in(content)
    if not cited:
        return 0

    if not ledger_readable:
        print(
            "REFUSING TO JUDGE: the observation ledger could not be read "
            f"({LEDGER}).\n"
            '"I could not check" and "this is clean" are different answers.\n'
            "Run any Read/Bash/Glob/Grep first — the companion recorder "
            "(verify-breadcrumb.py) rebuilds the ledger on the next tool call.",
            file=sys.stderr,
        )
        return 2

    ledger = {line.strip() for line in ledger_text.splitlines() if line.strip()}
    hits = [t for t in cited if observed(t, ledger)]
    if hits:
        return 0

    shown = ", ".join(cited[:5]) + (" …" if len(cited) > 5 else "")
    print(
        "BLOCKED: this message cites paths/URLs and NOT ONE of them was observed "
        "by a tool in this session.\n"
        f"  cited, none observed: {shown}\n\n"
        "Pull the artifact before you describe it — read the file, curl the URL, "
        "run the command — then retry.\n"
        "This is a claim written from memory, which is the one thing a peer "
        "cannot re-derive.",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__" and not globals().get("_TESTING"):
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            sys.exit(0)
        data = json.loads(raw)
        if data.get("tool_name", "") != "mcp__vantage-peers__send_message":
            sys.exit(0)
        content = data.get("tool_input", {}).get("content", "")
        text, readable = "", False
        for path in (LEDGER, LEGACY_LEDGER):
            try:
                text += path.read_text(encoding="utf-8", errors="replace")
                readable = True
            except Exception:
                continue
        sys.exit(run_hook(content, text, readable))
    except Exception as e:
        print(f"[hook warning] verify-before-claim: {e}", file=sys.stderr)
        sys.exit(0)
