#!/usr/bin/env python3
"""
PreToolUse hook on mcp__vantage-peers__send_message.
Blocks inter-orchestrator messages that contain ambiguous arbitration language
("à toi de trancher", "up to you", "pas urgent"...) unless paired with a decision
marker ("SKIP", "reporté à YYYY-MM-DD", "Execute", "DECISION:"...).

Skip rules (priority order):
  1. tool_name does not contain "send_message"         -> allow
  2. addressed to the fleet coordinator               -> allow (Laurent arbitrates)
       a. recipientAgentIds given: allow iff EVERY id equals the coordinator
          agentId read from .claude/config/coordinator.json (written at
          onboarding from list_peers). Missing/unusable config -> no allow
          (fail closed). The hook never resolves a name to an ID.
       b. channel given (no recipientAgentIds): channel contains
          "pi-chromebook". LEGACY name path, today's contract during the M1a
          transition; it is REMOVED at M1b, when the backend stops routing
          channel names to coordinators.
  3. content empty / non-string                        -> allow
  4. no ambiguous pattern matches                      -> allow
  5. decision marker present                           -> allow
  6. otherwise                                         -> block (exit 2)

Fail-open: any unexpected exception -> sys.exit(0).

Spec: analysis/decisive-messaging-hook-spec-2026-04-24.md
Version: 1.1.0 (1.1.0: coordinator addressed by agent ID, M1a)
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    from _lib.coordinator import addressed_only_to_coordinator  # noqa: E402
except Exception:  # module unavailable -> no ID exemption (fail closed)
    def addressed_only_to_coordinator(recipient_agent_ids, config_path=None):
        return False

AMBIGUOUS_PATTERNS = re.compile(
    r"\b(?:"
    r"à\s+toi\s+de\s+trancher|tu\s+d[ée]cides|si\s+tu\s+veux|"
    r"(?:à|peux|dois?)\s*arbitrer|choisir\s+si|pas\s+urgent|"
    r"optionnel(?:le)?|au\s+choix|non[-\s]critique|pas\s+bloquant|"
    r"à\s+ta\s+convenance|comme\s+tu\s+veux|à\s+voir|"
    r"you\s+decide|up\s+to\s+you|your\s+call|if\s+you\s+want|"
    r"not\s+urgent|optional|non[-\s]critical|your\s+choice|"
    r"whenever\s+you\s+(?:want|prefer|can)"
    r")\b",
    re.IGNORECASE,
)

DECISION_MARKERS = re.compile(
    r"\bSKIP\b"
    r"|\brepor(?:ted?|té)\s+(?:à|to)\s+\d{4}-\d{2}-\d{2}\b"
    r"|\b(?:pas\s+)?fait\b"
    r"|\b(?:not\s+)?done\b"
    r"|\b(?:fermé|closed)\b"
    r"|\b(?:Execute|Ignore|Drop|Exécute|Abandonne)\b"
    r"|\b(?:DECISION|DÉCISION|VERDICT)\s*:"
)

STDERR_MSG = (
    "BLOCKED: message to orchestrator contains ambiguous arbitration language.\n\n"
    "Reformulate as a binary decision. Accepted patterns:\n"
    "  - SKIP\n"
    "  - reporté à YYYY-MM-DD / reported to YYYY-MM-DD\n"
    "  - fait / pas fait / done / not done\n"
    "  - fermé / closed\n"
    "  - Execute / Ignore / Drop (title-case)\n"
    "  - DECISION: <verdict> / DÉCISION: <verdict> / VERDICT: <verdict>\n\n"
    "Inter-orchestrator messages are not a brainstorm channel. If you need the recipient\n"
    "to arbitrate, route it to the fleet coordinator instead (Laurent handles his own queue):\n"
    "send_message recipientAgentIds=[<coordinator agentId from list_peers>]."
)

try:
    data = json.load(sys.stdin)
    tool_name = data.get("tool_name", "")
    if "send_message" not in tool_name:
        sys.exit(0)

    tool_input = data.get("tool_input", {})
    channel = tool_input.get("channel", "")
    recipient_agent_ids = tool_input.get("recipientAgentIds")
    content = tool_input.get("content", "")

    if recipient_agent_ids is not None:
        if addressed_only_to_coordinator(recipient_agent_ids):
            sys.exit(0)
    elif isinstance(channel, str) and "pi-chromebook" in channel:
        # LEGACY name path (M1a transition). Removed at M1b.
        sys.exit(0)
    if not isinstance(content, str) or not content.strip():
        sys.exit(0)

    if AMBIGUOUS_PATTERNS.search(content) and not DECISION_MARKERS.search(content):
        print(STDERR_MSG, file=sys.stderr)
        sys.exit(2)

    sys.exit(0)

except SystemExit:
    raise
except Exception:
    sys.exit(0)
