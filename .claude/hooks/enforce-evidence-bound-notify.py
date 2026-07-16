#!/usr/bin/env python3
"""
PreToolUse hook: Evidence-Bound NOTIFY doctrine.

Mirrors enforce-evidence-bound-completion.py but applies to outbound peer
messages. The Day 76 doctrine says a task is not done because the note says
so; the symmetric truth is that a STATUS CLAIM in a peer message is not true
because the message says so.

Root cause this hook addresses:
  Orchestrators send "[DONE] PR merged" / "SHIPPED" / "PUBLISHED" status
  pings to other peers that are taken at face value and routed into downstream
  decisions (closing tracking tasks, triggering deploys, releasing mandate
  budget). When the claim is premature or wrong, the false positive cascades
  silently — the receiver trusted the sender because the sender said so.

Enforced on:
  - mcp__vantage-peers__send_message  (always inspected; only blocks when the
                                       body carries a verb-claim or [DONE])

A message PASSES when:
  (a) it has NO state-claim marker — pure status / question / FYI, OR
  (b) for EACH claim line it contains, there is at least one EVIDENCE LINE
      within ±5 lines whose body matches an evidence-command pattern
      (gh|git|npm|sha256sum|wc|cat|curl ...).
  (c) optional URL HEAD check is best-effort and fail-soft.

Override (rare): `// allow-no-evidence-notify: <reason>` anywhere in content.

Exit codes:
  0 = allow
  2 = block with remediation
"""
import json
import os
import re
import shutil
import subprocess
import sys

ENFORCED_TOOL = "mcp__vantage-peers__send_message"

# Markers that signal "I am asserting a finished state".
CLAIM_MARKERS = (
    re.compile(r"\[DONE\]", re.IGNORECASE),
    re.compile(r"\b(MERGED|PUBLISHED|SHIPPED|DEPLOYED|RELEASED|APPROVED)\b"),
)

# Evidence line: a command-driven artifact a peer can replay.
#   gh pr view 5 --json state -q .state → MERGED
#   git rev-parse HEAD → d8ceef5
#   npm view @vantageos/mcp-server@2.4.1 version → 2.4.1
#   sha256sum dist/server.js → <hash>
#   wc -l qa/report.md → 142
#   cat package.json | jq .version → "2.4.1"
#   curl -sI https://github.com/.../pull/5 → HTTP/2 200
EVIDENCE_LINE = re.compile(
    r"\b(gh|git|npm|sha256sum|wc|cat|curl)\b[^\n]+?(?:→|->|=>)\s*\S+",
    re.IGNORECASE,
)

# URL shapes worth opportunistically HEAD-checking.
URL_PATTERNS = (
    re.compile(r"https://github\.com/[^/\s]+/[^/\s]+/pull/\d+(?:#issuecomment-\d+)?"),
)

OPT_OUT = "allow-no-evidence-notify:"

NEAR_WINDOW = 5  # lines above/below a claim where evidence can live


def find_claim_lines(lines):
    hits = []
    for i, ln in enumerate(lines):
        for pat in CLAIM_MARKERS:
            if pat.search(ln):
                hits.append(i)
                break
    return hits


def has_evidence_near(lines, idx):
    lo = max(0, idx - NEAR_WINDOW)
    hi = min(len(lines), idx + NEAR_WINDOW + 1)
    for j in range(lo, hi):
        if EVIDENCE_LINE.search(lines[j]):
            return True
    return False


def head_check(url, timeout=3):
    """Best-effort HTTP HEAD. Returns (ok, status_or_reason). Fail-soft."""
    if not shutil.which("curl"):
        return (True, "no-curl-fail-soft")
    try:
        proc = subprocess.run(
            ["curl", "-sI", "-o", "/dev/null", "-w", "%{http_code}",
             "--max-time", str(timeout), url],
            capture_output=True, text=True, timeout=timeout + 2,
        )
        code = (proc.stdout or "").strip()
        if code.startswith("2") or code.startswith("3"):
            return (True, code)
        if code == "000":
            return (True, "network-unreachable-fail-soft")
        return (False, code or "unknown")
    except Exception as exc:
        return (True, f"exception-fail-soft:{exc}")


def main():
    try:
        data = json.load(sys.stdin)
    # TOOL_NAME_GUARD_PI_FIX Day 113 — fleet deadlock fix (matcher=* fires every tool)
    if data.get("tool_name") != "mcp__vantage-peers__send_message":
        sys.exit(0)
    except Exception:
        sys.exit(0)

    tool_name = data.get("tool_name", "") or ""
    if tool_name != ENFORCED_TOOL:
        sys.exit(0)

    tool_input = data.get("tool_input", {}) or {}
    content = tool_input.get("content")
    content = content if isinstance(content, str) else ""

    if not content.strip():
        sys.exit(0)  # empty messages handled by other hooks

    if OPT_OUT in content:
        sys.exit(0)

    lines = content.splitlines()
    claim_indices = find_claim_lines(lines)

    # No state-claim → pure FYI / question / status → always pass.
    if not claim_indices:
        sys.exit(0)

    missing = []
    for idx in claim_indices:
        if not has_evidence_near(lines, idx):
            missing.append((idx + 1, lines[idx].strip()[:120]))

    # Optional URL HEAD check — only when a claim is present, fail-soft.
    url_failures = []
    if os.environ.get("ENFORCE_NOTIFY_URL_CHECK", "0") == "1":
        for ln in lines:
            for pat in URL_PATTERNS:
                for m in pat.finditer(ln):
                    ok, info = head_check(m.group(0))
                    if not ok:
                        url_failures.append((m.group(0), info))

    if not missing and not url_failures:
        sys.exit(0)

    msg = ["BLOCKED: Evidence-Bound NOTIFY doctrine."]
    msg.append("")
    msg.append(
        "Your message asserts a finished state (e.g. [DONE], MERGED, PUBLISHED,"
    )
    msg.append(
        "SHIPPED, DEPLOYED, APPROVED) but the receiver cannot independently"
    )
    msg.append("verify it without trusting you.")
    msg.append("")
    if missing:
        msg.append("Claim lines without nearby evidence:")
        for lineno, snippet in missing:
            msg.append(f"  L{lineno}: {snippet}")
        msg.append("")
    if url_failures:
        msg.append("URLs that failed HEAD check:")
        for url, info in url_failures:
            msg.append(f"  {url} -> {info}")
        msg.append("")
    msg.append(
        "FIX: for each claim line, add (within +/-5 lines) an evidence line of"
    )
    msg.append("the form:")
    msg.append("  <gh|git|npm|sha256sum|wc|cat|curl> <args> -> <result>")
    msg.append("")
    msg.append("Examples:")
    msg.append("  gh pr view 5 --json state -q .state -> MERGED")
    msg.append("  git rev-parse HEAD -> d8ceef5")
    msg.append("  npm view @vantageos/mcp-server@2.4.1 version -> 2.4.1")
    msg.append("  curl -sI https://github.com/o/r/pull/5 -> HTTP/2 200")
    msg.append("")
    msg.append(
        "Override (rare): add `// allow-no-evidence-notify: <reason>` in the"
    )
    msg.append("message body, then fix the source so the next notify carries proof.")

    print("\n".join(msg), file=sys.stderr)
    sys.exit(2)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(
            f"[enforce-evidence-bound-notify] internal error, fail-open: {e}",
            file=sys.stderr,
        )
        sys.exit(0)
