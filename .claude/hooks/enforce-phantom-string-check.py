#!/usr/bin/env python3
"""Warn when a message/task/block asserts a known vendor-example (phantom) string as a live config defect.

Class of failure: an orchestrator greps a served bundle, finds a vendor-example string
(e.g. the Convex SDK example URL happy-otter-123.convex.cloud), reads it as the app's own
broken configuration, and routes a fix. The string is vendored library text present in every
app using that vendor; the grep hit proves nothing. Bipolar search (measurement-integrity.md):
finding the bad string proves nothing until the paired GOOD-value read is produced.

This hook fires at the exact failure point — right when the phantom is being cited as a defect
in an outgoing message / task / block — and demands the paired good-value read. Advisory (exit 0
with a warning on stderr): it must never hard-block a legitimate historical citation, only make
the operator produce the good-value check before acting.

Registry: .claude/config/known-phantom-strings.json (seed + extend).
Override: include `// allow-phantom-cite: <reason>` in the content for a legitimate verbatim citation.
"""
import json
import os
import re
import sys

DEFECT_SIGNALS = re.compile(
    r"\b(points?\s+to|pointe\s+sur|broken|cassé|dead|mort|404|wrong|mauvais|"
    r"fix|corrig|redeploy|redéploy|env\s+var|should\s+point|doit\s+pointer)\b",
    re.IGNORECASE,
)
GOOD_VALUE_SIGNALS = re.compile(
    r"\b(env\s+pull|envList|envGet|convex\s+status|\.env\.local|returned|retourné|"
    r"bipolar|phantom|fantôme|good[-\s]value|valeur\s+réelle)\b",
    re.IGNORECASE,
)
OVERRIDE = re.compile(r"//\s*allow-phantom-cite:\s*\S", re.IGNORECASE)


def load_phantoms(root):
    path = os.path.join(root, ".claude", "config", "known-phantom-strings.json")
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh).get("phantoms", [])
    except (OSError, ValueError):
        return []


def extract_text(tool_input):
    parts = []
    for key in ("content", "description", "reason", "completionNote", "brief"):
        val = tool_input.get(key)
        if isinstance(val, str):
            parts.append(val)
    return "\n".join(parts)


def main():
    try:
        payload = json.load(sys.stdin)
    except (ValueError, OSError):
        sys.exit(0)

    tool_input = payload.get("tool_input", {}) or {}
    text = extract_text(tool_input)
    if not text:
        sys.exit(0)

    if OVERRIDE.search(text):
        sys.exit(0)

    root = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    phantoms = load_phantoms(root)

    for ph in phantoms:
        pattern = ph.get("pattern", "")
        if not pattern:
            continue
        try:
            hit = re.search(pattern, text, re.IGNORECASE)
        except re.error:
            continue
        if not hit:
            continue
        # Only warn when the phantom is framed as a defect AND the paired good-value read is absent.
        if DEFECT_SIGNALS.search(text) and not GOOD_VALUE_SIGNALS.search(text):
            sys.stderr.write(
                "PHANTOM-STRING WARNING: your text cites '{}' as a config defect.\n"
                "This is a known {} vendor-example string ({}).\n"
                "A grep hit proves NOTHING until you produce the paired GOOD-value read: {}\n"
                "Bipolar search (measurement-integrity.md): read the value the app RETURNS, "
                "never a bundle grep. Do NOT route a fix on this alone.\n"
                "Override if this is a legitimate verbatim citation: // allow-phantom-cite: <reason>\n".format(
                    hit.group(0), ph.get("vendor", "vendor"), ph.get("why", ""), ph.get("good_value_check", "")
                )
            )
            # Advisory: exit 0 so the warning surfaces without hard-blocking a legitimate citation.
            sys.exit(0)

    sys.exit(0)


if __name__ == "__main__":
    main()
