"""The fleet coordinator's identity for send_message hooks: an AGENT ID.

ONE authority. The coordinator is identified by the unique `agentId` that
`list_peers` returns for it, written ONCE at onboarding into
`.claude/config/coordinator.json`:

    {"agentId": "<the coordinator's agentId, copied from list_peers output>"}

This module only READS that file. It never resolves a name to an ID, never
calls the backend, and never guesses: a hook that wants to exempt the
coordinator compares the `recipientAgentIds` of a send against this one value.

FAIL CLOSED. Any of the following yields "no coordinator configured" (None),
which means NO exemption is granted by ID:
  - the file is absent (only `coordinator.example.json` shipped / not onboarded);
  - the file is not valid JSON, or not a JSON object;
  - `agentId` is missing, not a string, or does not have the shape of an ID
    (lowercase letters and digits only, 16-64 characters). A channel name such
    as `pi-chromebook` written where the ID belongs is rejected by shape, so a
    name can never become an exemption key by being pasted into this file.

The config path is resolved relative to this file (`.claude/hooks/_lib/` ->
`.claude/config/`), so each workspace reads its own onboarding config.
"""
import json
import re
from pathlib import Path

CONFIG_PATH = Path(__file__).resolve().parent.parent.parent / "config" / "coordinator.json"

_AGENT_ID_SHAPE = re.compile(r"^[a-z0-9]{16,64}$")


def coordinator_agent_id(config_path=None):
    """Return the configured coordinator agentId, or None (fail closed)."""
    path = Path(config_path) if config_path is not None else CONFIG_PATH
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    if not isinstance(data, dict):
        return None
    agent_id = data.get("agentId")
    if not isinstance(agent_id, str) or not _AGENT_ID_SHAPE.match(agent_id):
        return None
    return agent_id


def addressed_only_to_coordinator(recipient_agent_ids, config_path=None):
    """True iff the send targets the coordinator's agentId and nobody else.

    An empty list, a non-list, a non-string entry, any recipient that is not
    the configured coordinator, or an unconfigured coordinator -> False.
    """
    coordinator = coordinator_agent_id(config_path)
    if coordinator is None:
        return False
    if not isinstance(recipient_agent_ids, list) or not recipient_agent_ids:
        return False
    return all(rid == coordinator for rid in recipient_agent_ids)
