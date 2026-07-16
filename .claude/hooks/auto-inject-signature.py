#!/usr/bin/env python3
"""
auto-inject-signature.py v2.1.0
PreToolUse hook on Bash: auto-inject orchestrator signature into GitHub PR/comment bodies.

Instead of blocking, this hook detects missing signatures and auto-appends them.
Falls back to blocking ONLY when the workspace CLAUDE.md cannot resolve the orchestrator role.

Signature format: Orchestrator: {Role} — {Team} | YYYY-MM-DD

Exit 0 = allow (with optional modifiedToolInput to inject signature)
Exit 2 = block (only when role is undetectable)
"""

import json
import os
import re
import sys
import hashlib
import tempfile
from datetime import datetime, timezone
from pathlib import Path

# ── Version ───────────────────────────────────────────────────────────────────
VERSION = "2.1.0"

# ── Env-var inline prefix regex (v2.0.1 — Day 82 doctrine fix) ────────────────
# Matches `CLAUDE_ORCHESTRATOR_ROLE=<role> <command>` from the COMMAND STRING.
# Hooks run in their own process — they cannot see env vars set in the Bash
# subshell via inline prefix. Parse them from the command instead. Same pattern
# fixed in enforce-pi-authorization v1.0.2 + enforce-eta-approval v1.1.0.
ENV_PREFIX_RE = re.compile(
    r"^(?:[A-Z_]+=\S+\s+)*CLAUDE_ORCHESTRATOR_ROLE=([A-Za-z][A-Za-z0-9_-]*)\s+"
)
TEAM_ENV_PREFIX_RE = re.compile(
    r"""^(?:[A-Z_]+=\S+\s+)*CLAUDE_ORCHESTRATOR_TEAM=(?:"([^"]+)"|'([^']+)'|(\S+))\s+"""
)

# ── Signature detection regex ─────────────────────────────────────────────────
# Matches: Orchestrator: <Role> — <Team> | YYYY-MM-DD
# Accepts em-dash (—) or ASCII hyphen with spaces ( - ) as separator
SIGNATURE_RE = re.compile(
    r"^Orchestrator:\s+\S.+(?:—| - )\s*\S.+\|\s*\d{4}-\d{2}-\d{2}\s*$",
    re.MULTILINE | re.IGNORECASE,
)

# ── Commands in scope ─────────────────────────────────────────────────────────
GH_PR_COMMANDS = [
    "gh pr create",
    "gh pr comment",
    "gh pr review",
]

# ── Audit log ─────────────────────────────────────────────────────────────────
AUDIT_LOG = "/tmp/auto-inject-signature.log"


def _log(action: str, command_summary: str, role: str, team: str) -> None:
    """Append a JSON audit line."""
    try:
        entry = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "command_summary": command_summary,
            "action": action,
            "role": role,
            "team": team,
            "version": VERSION,
        }
        with open(AUDIT_LOG, "a") as fh:
            fh.write(json.dumps(entry) + "\n")
    except Exception:
        pass  # audit failure must never block dev work


# ── Role / team detection ─────────────────────────────────────────────────────

def _read_first_lines(path: str, n: int) -> list[str]:
    try:
        with open(path) as fh:
            return [fh.readline() for _ in range(n)]
    except Exception:
        return []


_ROLE_RE = re.compile(
    # v2.1.0 — Day 84 cleanup: match plain, markdown-bold, italic, and
    # greek-symbol-paren variants. Case-sensitive: role must start with an
    # uppercase letter — this is the false-positive guard (e.g. `xixi tactical`
    # must NOT match).
    #
    # Accepted shapes:
    #   "You are Pi, …"                        → Pi
    #   "You are **Xi (ξ)**, the orchestrator" → Xi
    #   "You are *Xi*, …"                      → Xi
    #   "You are **Omega**"                    → Omega
    #   "You are Tau, an AI…"                  → Tau
    #
    # Rejected:
    #   "xixi tactical"                        → None (no `You are ` prefix)
    #   "you are xi"                           → None (lowercase role)
    r"You are \*{0,2}_?(?P<role>[A-Z][a-zA-Z]+)_?\*{0,2}(?:\s*\([^)]*\))?"
)

_ROLE_NOISE = {"A", "An", "The", "Claude", "Now"}


def _detect_role(lines_20: list[str]) -> str | None:
    for line in lines_20:
        m = _ROLE_RE.search(line)
        if m:
            word = m.group("role")
            if word not in _ROLE_NOISE:
                return word
    return None


def _detect_team(lines_50: list[str]) -> str:
    for line in lines_50:
        m = re.search(
            r"(VantageOS Team|Perello Consulting|[A-Z][A-Za-z]+ (?:Team|Corp|Consulting))",
            line,
        )
        if m:
            return m.group(1)
    return "VantageOS Team"


def get_role_and_team(command: str = "") -> tuple[str | None, str]:
    # v2.0.1 — 1a. Command-string inline env-var prefix (Bash subshell form)
    # `CLAUDE_ORCHESTRATOR_ROLE=sigma gh pr create ...` doesn't propagate to
    # this hook process — parse it from the command itself. Strip surrounding
    # quotes if any (e.g. `CLAUDE_ORCHESTRATOR_ROLE="sigma" cmd`).
    role: str | None = None
    team = ""
    if command:
        m = ENV_PREFIX_RE.match(command)
        if m:
            role = m.group(1)
        m2 = TEAM_ENV_PREFIX_RE.match(command)
        if m2:
            # Groups: 1=double-quoted, 2=single-quoted, 3=unquoted
            team = m2.group(1) or m2.group(2) or m2.group(3) or ""

    # 1b. Environment overrides (exported in shell rc or parent process)
    if not role:
        role = os.environ.get("CLAUDE_ORCHESTRATOR_ROLE")
    if not team:
        team = os.environ.get("CLAUDE_ORCHESTRATOR_TEAM", "")

    # 2. CLAUDE.md discovery
    candidates = []
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", "")
    if project_dir:
        candidates.append(os.path.join(project_dir, "CLAUDE.md"))
    candidates.append(os.path.join(os.getcwd(), "CLAUDE.md"))

    all_lines: list[str] = []
    for path in candidates:
        lines = _read_first_lines(path, 50)
        if lines:
            all_lines = lines
            break

    if not role:
        role = _detect_role(all_lines[:20])

    if not team:
        team = _detect_team(all_lines) or "VantageOS Team"

    return role, team


# ── Body parsing helpers ──────────────────────────────────────────────────────

def _strip_quotes(s: str) -> str:
    """Remove surrounding single or double quotes from a string."""
    if len(s) >= 2 and s[0] == s[-1] and s[0] in ('"', "'"):
        return s[1:-1]
    return s


def extract_body_from_command(command: str) -> tuple[str | None, str]:
    """
    Returns (body_content, mode) where mode is 'inline' or 'file' or 'none'.
    For mode='file', body_content is the file path.
    """
    # --body-file first (takes precedence)
    m = re.search(r'--body-file\s+([^\s]+)', command)
    if m:
        return m.group(1).strip("'\""), "file"

    # --body "..." or --body '...'  (quoted string, possibly multiline via $'...')
    m = re.search(r'--body\s+"((?:[^"\\]|\\.)*)"', command)
    if m:
        return m.group(1), "inline"
    m = re.search(r"--body\s+'((?:[^'\\]|\\.)*)'", command)
    if m:
        return m.group(1), "inline"

    # HEREDOC body inside --body "$(cat <<'EOF' ... EOF )"
    m = re.search(r"--body\s+\"\$\(cat\s+<<'?EOF'?\n?(.*?)EOF\s*\)\"", command, re.DOTALL)
    if m:
        return m.group(1), "inline"

    return None, "none"


def has_signature(body: str) -> bool:
    return bool(SIGNATURE_RE.search(body))


def build_signature(role: str, team: str) -> str:
    date = datetime.now(timezone.utc).date().isoformat()
    return f"Orchestrator: {role} — {team} | {date}"


# ── Command rewriting ─────────────────────────────────────────────────────────

def rewrite_command_body_file(command: str, body_file_path: str) -> str:
    """Replace the --body-file <old> with --body-file <new_tmp>."""
    # We've already rewritten the file in place; no command change needed
    return command


def rewrite_command_inline_body(command: str, old_body: str, new_body: str) -> str:
    """
    Replace the --body "<old>" with --body-file /tmp/<hash>.body
    to avoid shell quoting complexity.
    """
    # Write to a deterministic temp path
    h = hashlib.sha256(new_body.encode()).hexdigest()[:12]
    tmp_path = f"/tmp/.gh-auto-signature-{h}.body"
    with open(tmp_path, "w") as fh:
        fh.write(new_body)

    # Remove the original --body "..." fragment
    # Try double-quote
    new_cmd = re.sub(r'--body\s+"(?:[^"\\]|\\.)*"', f"--body-file {tmp_path}", command)
    if new_cmd == command:
        # Try single-quote
        new_cmd = re.sub(r"--body\s+'(?:[^'\\]|\\.)*'", f"--body-file {tmp_path}", command)
    if new_cmd == command:
        # Try HEREDOC form
        new_cmd = re.sub(
            r'--body\s+"\$\(cat\s+<<\'?EOF\'?\n?.*?EOF\s*\)"',
            f"--body-file {tmp_path}",
            command,
            flags=re.DOTALL,
        )
    return new_cmd


# ── Self-test ─────────────────────────────────────────────────────────────────

def run_self_test() -> None:
    import tempfile

    PASS = "PASS"
    FAIL = "FAIL"
    results = []

    def check(name: str, condition: bool) -> None:
        status = PASS if condition else FAIL
        results.append((name, status))
        print(f"  {status}: {name}")

    # Force-set role/team for deterministic tests
    os.environ["CLAUDE_ORCHESTRATOR_ROLE"] = "Omega"
    os.environ["CLAUDE_ORCHESTRATOR_TEAM"] = "VantageOS Team"

    sig_line = f"Orchestrator: Omega — VantageOS Team | {datetime.now(timezone.utc).date().isoformat()}"

    # T1: gh pr create --body "Test PR" (no signature) → injected
    cmd = 'gh pr create --title "My PR" --body "Test PR"'
    body, mode = extract_body_from_command(cmd)
    check("T1: no-sig inline body → injected", body == "Test PR" and mode == "inline" and not has_signature(body))

    # T2: gh pr create --body with existing signature → passthrough
    signed_body = f"Test\n\n{sig_line}"
    cmd2 = f'gh pr create --title "My PR" --body "{signed_body}"'
    body2, mode2 = extract_body_from_command(cmd2)
    check("T2: signed inline body → passthrough", has_signature(body2 or ""))

    # T3: gh pr create --body-file (file has no signature) → file rewritten
    with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as tf:
        tf.write("Test PR body without signature.\n")
        tf_path = tf.name
    cmd3 = f"gh pr create --title 'Test' --body-file {tf_path}"
    body3, mode3 = extract_body_from_command(cmd3)
    check("T3: no-sig file body → file mode detected", mode3 == "file" and body3 == tf_path)
    file_content = open(tf_path).read()
    check("T3b: file has no sig initially", not has_signature(file_content))
    # Simulate injection
    new_content = file_content.rstrip("\n") + "\n\n" + sig_line + "\n"
    with open(tf_path, "w") as fh:
        fh.write(new_content)
    check("T3c: file rewritten with sig", has_signature(open(tf_path).read()))
    os.unlink(tf_path)

    # T4: gh pr create --body-file (file already signed) → passthrough
    with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as tf:
        tf.write(f"Test PR body.\n\n{sig_line}\n")
        tf4_path = tf.name
    cmd4 = f"gh pr create --title 'Test' --body-file {tf4_path}"
    body4, mode4 = extract_body_from_command(cmd4)
    file4_content = open(tf4_path).read()
    check("T4: signed file → passthrough", has_signature(file4_content))
    os.unlink(tf4_path)

    # T5: gh pr comment --body "Comment" → injected
    cmd5 = 'gh pr comment 42 --body "Comment"'
    body5, mode5 = extract_body_from_command(cmd5)
    check("T5: pr comment no-sig → injected", body5 == "Comment" and not has_signature("Comment"))

    # T6: gh pr review --body "LGTM" → injected
    cmd6 = 'gh pr review 42 --approve --body "LGTM"'
    body6, mode6 = extract_body_from_command(cmd6)
    check("T6: pr review no-sig → injected", body6 == "LGTM" and not has_signature("LGTM"))

    # T7: gh issue create --title X --body Y → passthrough (out of scope)
    cmd7 = 'gh issue create --title "Bug" --body "Description"'
    is_in_scope = any(gc in cmd7 for gc in GH_PR_COMMANDS)
    check("T7: gh issue create → out of scope passthrough", not is_in_scope)

    # T8: No CLAUDE.md role → blocked
    del os.environ["CLAUDE_ORCHESTRATOR_ROLE"]
    del os.environ["CLAUDE_ORCHESTRATOR_TEAM"]
    # Temporarily ensure no CLAUDE.md in cwd
    saved_cwd = os.getcwd()
    with tempfile.TemporaryDirectory() as tmpdir:
        os.chdir(tmpdir)
        saved_dir = os.environ.pop("CLAUDE_PROJECT_DIR", None)
        role_test, team_test = get_role_and_team()
        if saved_dir:
            os.environ["CLAUDE_PROJECT_DIR"] = saved_dir
        os.chdir(saved_cwd)
    check("T8: no CLAUDE.md → role undetectable", role_test is None)

    # T9: npm install → passthrough (not gh)
    cmd9 = "npm install"
    is_gh = any(gc in cmd9 for gc in GH_PR_COMMANDS)
    check("T9: npm install → passthrough", not is_gh)

    # ── v2.0.1 — Day 82 doctrine fix: command-string env-var prefix parsing ──
    # T10: CLAUDE_ORCHESTRATOR_ROLE=sigma <command> → role extracted from command string
    os.environ.pop("CLAUDE_ORCHESTRATOR_ROLE", None)
    os.environ.pop("CLAUDE_ORCHESTRATOR_TEAM", None)
    saved_cwd = os.getcwd()
    with tempfile.TemporaryDirectory() as tmpdir:
        os.chdir(tmpdir)
        saved_dir = os.environ.pop("CLAUDE_PROJECT_DIR", None)
        cmd10 = 'CLAUDE_ORCHESTRATOR_ROLE=sigma gh pr create --title T --body Test'
        r10, _ = get_role_and_team(cmd10)
        check("T10: env-prefix role=sigma extracted from command", r10 == "sigma")

        # T11: ROLE + TEAM env-prefix combined
        cmd11 = 'CLAUDE_ORCHESTRATOR_ROLE=tau CLAUDE_ORCHESTRATOR_TEAM="VantageOS Team" gh pr comment 42 --body X'
        r11, t11 = get_role_and_team(cmd11)
        check("T11: env-prefix role=tau extracted", r11 == "tau")
        check("T11b: env-prefix team extracted (quoted-stripped)", t11 == "VantageOS Team")

        # T12: env-prefix with other vars BEFORE CLAUDE_ORCHESTRATOR_ROLE
        cmd12 = 'FOO=bar BAZ=qux CLAUDE_ORCHESTRATOR_ROLE=eta gh pr review 42 --approve --body Y'
        r12, _ = get_role_and_team(cmd12)
        check("T12: env-prefix role=eta extracted past other vars", r12 == "eta")

        # T13: no env-prefix in command → falls back to os.environ
        cmd13 = "gh pr comment 42 --body Z"
        os.environ["CLAUDE_ORCHESTRATOR_ROLE"] = "Omega"
        r13, _ = get_role_and_team(cmd13)
        check("T13: no env-prefix → falls back to os.environ", r13 == "Omega")
        os.environ.pop("CLAUDE_ORCHESTRATOR_ROLE", None)

        # T14: invalid env-prefix (no value) → no role extracted (regex no match)
        cmd14 = "CLAUDE_ORCHESTRATOR_ROLE= gh pr create --title T --body X"
        r14, _ = get_role_and_team(cmd14)
        check("T14: malformed env-prefix → no role from command", r14 is None)

        if saved_dir:
            os.environ["CLAUDE_PROJECT_DIR"] = saved_dir
        os.chdir(saved_cwd)

    # Restore env for safety
    os.environ["CLAUDE_ORCHESTRATOR_ROLE"] = "Omega"
    os.environ["CLAUDE_ORCHESTRATOR_TEAM"] = "VantageOS Team"

    passed = sum(1 for _, s in results if s == PASS)
    total = len(results)
    print(f"\n{passed}/{total} PASS")
    sys.exit(0 if passed == total else 1)


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    if "--self-test" in sys.argv:
        run_self_test()
        return

    try:
        _main_impl()
    except Exception:
        # Fail-open: never block dev work on an internal hook bug
        _log("fail-open", "exception in main", "", "")
        sys.exit(0)


def _main_impl() -> None:
    try:
        data = json.loads(sys.stdin.read())
    except Exception:
        sys.exit(0)

    tool_name = data.get("tool_name", "")
    if tool_name != "Bash":
        sys.exit(0)

    command = data.get("tool_input", {}).get("command", "")
    if not command:
        sys.exit(0)

    # Check if this is a targeted gh pr/comment/review command
    if not any(gc in command for gc in GH_PR_COMMANDS):
        sys.exit(0)

    # Extract body
    body, mode = extract_body_from_command(command)

    if mode == "none":
        # Interactive or no body flag — pass through; signature is added at composition time
        _log("passthrough", command[:80], "", "")
        sys.exit(0)

    # Check if signature already present
    body_text = ""
    if mode == "file":
        try:
            with open(body, "r") as fh:
                body_text = fh.read()
        except Exception:
            # Can't read file — pass through, don't block
            _log("passthrough", command[:80], "", "")
            sys.exit(0)
    else:
        body_text = body or ""

    if has_signature(body_text):
        _log("passthrough", command[:80], "", "")
        sys.exit(0)

    # Need to inject — detect role/team first
    # v2.0.1: pass command for inline env-prefix parsing (Day 82 doctrine fix)
    role, team = get_role_and_team(command)

    if role is None:
        # BLOCK: role undetectable
        msg = (
            "BLOCKED: Missing orchestrator signature AND cannot detect role.\n"
            "Workspace CLAUDE.md is missing a 'You are <Role>' declaration.\n"
            "Add it or set env var CLAUDE_ORCHESTRATOR_ROLE.\n"
            "Every PR and comment must end with:\n"
            "  Orchestrator: <Role> — <Team> | YYYY-MM-DD"
        )
        print(json.dumps({"decision": "block", "reason": msg}))
        _log("blocked", command[:80], "unknown", team)
        sys.exit(0)

    sig = build_signature(role, team)

    if mode == "file":
        # Rewrite the file in-place
        new_content = body_text.rstrip("\n") + "\n\n" + sig + "\n"
        try:
            with open(body, "w") as fh:
                fh.write(new_content)
        except Exception:
            # Can't write — fail-open
            _log("fail-open", command[:80], role, team)
            sys.exit(0)
        _log("injected", command[:80], role, team)
        # Return allow with no modification — file was already rewritten
        print(json.dumps({"decision": "allow"}))
        sys.exit(0)

    else:  # inline
        new_body = body_text.rstrip("\n") + "\n\n" + sig
        new_command = rewrite_command_inline_body(command, body_text, new_body)
        _log("injected", command[:80], role, team)
        print(json.dumps({
            "decision": "allow",
            "modifiedToolInput": {"command": new_command},
        }))
        sys.exit(0)


if __name__ == "__main__":
    main()
