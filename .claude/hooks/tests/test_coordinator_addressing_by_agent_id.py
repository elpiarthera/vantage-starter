"""RED-then-GREEN tests: the coordinator exemption follows the AGENT ID (M1).

Context (VantagePeers Cloud, M1 expand/contract): `send_message` now takes
`recipientAgentIds=[<agentId from list_peers>]`. Two send_message hooks grant
the fleet coordinator an exemption that used to be keyed on a channel NAME
(`pi-chromebook`). The exemption must follow the coordinator's AGENT ID, read
from `.claude/config/coordinator.json` written at onboarding — never a name
resolved to an ID by the hook.

Poles pinned for each hook:
  - baseline: a peer send with the offending content is BLOCKED.
  - legacy name path (today's contract, removed at M1b): still exempt.
  - ID path: recipientAgentIds == [configured coordinator ID] -> exempt.
  - ID that is not the coordinator -> no exemption.
  - coordinator ID mixed with another ID -> no exemption.
  - missing config / example-only / malformed / name-shaped value -> no
    exemption (fail closed).

Each test runs the hook from a throwaway workspace copy, so the config file
the hook reads is exactly the one the test wrote (the hook resolves the
config relative to its own location).
"""
import json
import pathlib
import shutil
import subprocess
import sys

import pytest

HOOKS_DIR = pathlib.Path(__file__).resolve().parent.parent
TOOL = "mcp__vantage-peers__send_message"

COORDINATOR_ID = "jd7f3k2m9q8x1v4b6n0c5z7w2y8t3r1p"
OTHER_ID = "jd7a4b5c6d7e8f9g0h1j2k3m4n5p6q7r"

# (hook file, content that the hook BLOCKS when sent to an ordinary peer)
HOOK_CASES = {
    "enforce-decisive-messaging.py": "[STATUS] Two options on the table, up to you.",
    "enforce-no-task-in-message.py": (
        "Please deploy the fix to the staging deployment and run the migration, "
        "then update the docs accordingly so the board shows the new state."
    ),
}


def _workspace(tmp_path, hook_name, config=None, example=False):
    hooks = tmp_path / ".claude" / "hooks"
    hooks.mkdir(parents=True)
    shutil.copy2(HOOKS_DIR / hook_name, hooks / hook_name)
    shutil.copytree(HOOKS_DIR / "_lib", hooks / "_lib")
    cfg_dir = tmp_path / ".claude" / "config"
    cfg_dir.mkdir(parents=True)
    if example:
        (cfg_dir / "coordinator.example.json").write_text(
            json.dumps({"agentId": COORDINATOR_ID})
        )
    if config is not None:
        text = config if isinstance(config, str) else json.dumps(config)
        (cfg_dir / "coordinator.json").write_text(text)
    return hooks / hook_name


def _run(hook_path, tool_input):
    payload = json.dumps({"tool_name": TOOL, "tool_input": tool_input})
    proc = subprocess.run(
        [sys.executable, str(hook_path)],
        input=payload,
        capture_output=True,
        text=True,
        timeout=10,
    )
    return proc.returncode, proc.stderr + proc.stdout


@pytest.fixture(params=sorted(HOOK_CASES))
def hook_name(request):
    return request.param


def test_baseline_peer_send_is_blocked(tmp_path, hook_name):
    hook = _workspace(tmp_path, hook_name, config={"agentId": COORDINATOR_ID})
    rc, out = _run(hook, {"channel": "sigma", "content": HOOK_CASES[hook_name]})
    assert rc == 2, f"{hook_name}: peer send must block, rc={rc} out={out}"


def test_legacy_coordinator_channel_name_still_exempt(tmp_path, hook_name):
    hook = _workspace(tmp_path, hook_name)
    rc, out = _run(
        hook, {"channel": "pi-chromebook", "content": HOOK_CASES[hook_name]}
    )
    assert rc == 0, f"{hook_name}: name path is today's contract, rc={rc} out={out}"


def test_send_by_configured_coordinator_id_is_exempt(tmp_path, hook_name):
    hook = _workspace(tmp_path, hook_name, config={"agentId": COORDINATOR_ID})
    rc, out = _run(
        hook,
        {"recipientAgentIds": [COORDINATOR_ID], "content": HOOK_CASES[hook_name]},
    )
    assert rc == 0, f"{hook_name}: coordinator ID must be exempt, rc={rc} out={out}"


def test_send_by_non_coordinator_id_gets_no_exemption(tmp_path, hook_name):
    hook = _workspace(tmp_path, hook_name, config={"agentId": COORDINATOR_ID})
    rc, out = _run(
        hook, {"recipientAgentIds": [OTHER_ID], "content": HOOK_CASES[hook_name]}
    )
    assert rc == 2, f"{hook_name}: non-coordinator ID must block, rc={rc} out={out}"


def test_coordinator_mixed_with_peer_gets_no_exemption(tmp_path, hook_name):
    hook = _workspace(tmp_path, hook_name, config={"agentId": COORDINATOR_ID})
    rc, out = _run(
        hook,
        {
            "recipientAgentIds": [COORDINATOR_ID, OTHER_ID],
            "content": HOOK_CASES[hook_name],
        },
    )
    assert rc == 2, f"{hook_name}: a peer in the list must block, rc={rc} out={out}"


def test_missing_config_fails_closed(tmp_path, hook_name):
    hook = _workspace(tmp_path, hook_name)
    rc, out = _run(
        hook,
        {"recipientAgentIds": [COORDINATOR_ID], "content": HOOK_CASES[hook_name]},
    )
    assert rc == 2, f"{hook_name}: no config -> no exemption, rc={rc} out={out}"


def test_example_file_alone_is_not_configuration(tmp_path, hook_name):
    hook = _workspace(tmp_path, hook_name, example=True)
    rc, out = _run(
        hook,
        {"recipientAgentIds": [COORDINATOR_ID], "content": HOOK_CASES[hook_name]},
    )
    assert rc == 2, f"{hook_name}: example is not config, rc={rc} out={out}"


@pytest.mark.parametrize(
    "bad_config",
    [
        "{not json",
        {"agentId": ""},
        {"agentId": None},
        {"agentId": ["jd7f3k2m9q8x1v4b6n0c5z7w2y8t3r1p"]},
        {"name": "pi-chromebook"},
    ],
    ids=["malformed", "empty", "null", "list", "no-agentId"],
)
def test_unusable_config_fails_closed(tmp_path, hook_name, bad_config):
    hook = _workspace(tmp_path, hook_name, config=bad_config)
    rc, out = _run(
        hook,
        {"recipientAgentIds": [COORDINATOR_ID], "content": HOOK_CASES[hook_name]},
    )
    assert rc == 2, f"{hook_name}: unusable config -> no exemption, rc={rc} out={out}"


def test_name_shaped_config_value_is_not_an_agent_id(tmp_path, hook_name):
    """A name written where the ID belongs must not turn into an exemption."""
    hook = _workspace(tmp_path, hook_name, config={"agentId": "pi-chromebook"})
    rc, out = _run(
        hook,
        {"recipientAgentIds": ["pi-chromebook"], "content": HOOK_CASES[hook_name]},
    )
    assert rc == 2, f"{hook_name}: a name is not an agent ID, rc={rc} out={out}"


def test_empty_recipient_list_gets_no_exemption(tmp_path, hook_name):
    hook = _workspace(tmp_path, hook_name, config={"agentId": COORDINATOR_ID})
    rc, out = _run(
        hook, {"recipientAgentIds": [], "content": HOOK_CASES[hook_name]}
    )
    assert rc == 2, f"{hook_name}: empty list must block, rc={rc} out={out}"
