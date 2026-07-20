"""RED-then-GREEN tests for enforce-irp-sequence.py v2.

The v2 hook reads the REAL task state through an injectable probe
(IRP_PROBE_CMD) returning the caller's in_progress tasks as JSON, and through
the real VP HTTP query path, exercised here against the canonical deployment.
It fails OPEN when the probe is missing or failing — loudly on stderr:
a sequencing guard must not freeze the fleet when it cannot know, and must
never let an unverified "no conflict" pass for a verified one.
"""
import json
import os
import pathlib
import subprocess
import sys

HOOK = pathlib.Path(__file__).resolve().parent.parent / "enforce-irp-sequence.py"
FLAG = pathlib.Path("/tmp/.irp-can-start")


def run_hook(tool_name, tool_input, probe_json=None, probe_fail=False, extra_env=None):
    payload = json.dumps({"tool_name": tool_name, "tool_input": tool_input})
    env = dict(os.environ)
    env.pop("IRP_PROBE_CMD", None)
    env.pop("VP_ORCHESTRATOR", None)
    if extra_env:
        env.update(extra_env)
    if probe_fail:
        env["IRP_PROBE_CMD"] = "false"
    elif probe_json is not None:
        env["IRP_PROBE_CMD"] = "printf %s " + json.dumps(json.dumps(probe_json))
    proc = subprocess.run(
        [sys.executable, str(HOOK)], input=payload,
        capture_output=True, text=True, timeout=10, env=env,
    )
    return proc.returncode, proc.stderr + proc.stdout


START = "mcp__vantage-peers__start_task"


def test_empty_queue_passes():
    rc, out = run_hook(START, {"taskId": "k" + "a" * 31, "callerOrchestrator": "pi"},
                       probe_json=[])
    assert rc == 0, f"empty queue must pass, rc={rc} out={out}"


def test_blocks_when_task_really_in_progress():
    rc, out = run_hook(START, {"taskId": "k" + "b" * 31, "callerOrchestrator": "pi"},
                       probe_json=[{"_id": "k17blocking0000000000000000000000", "title": "x"}])
    assert rc == 2, f"real in_progress task must block, rc={rc} out={out}"
    assert "k17blocking" in out, f"error message must name the blocking task: {out}"


def test_flag_file_has_no_effect():
    try:
        FLAG.touch()
        rc, _ = run_hook(START, {"taskId": "k" + "c" * 31, "callerOrchestrator": "pi"},
                         probe_json=[{"_id": "k17blocking0000000000000000000000", "title": "x"}])
        assert rc == 2, "a present flag must NOT unlock a real conflict"
    finally:
        FLAG.unlink(missing_ok=True)


def test_probe_failure_fails_open():
    rc, out = run_hook(START, {"taskId": "k" + "d" * 31, "callerOrchestrator": "pi"},
                       probe_fail=True)
    assert rc == 0, f"failing probe must fail open, rc={rc} out={out}"


def test_no_probe_configured_fails_open():
    rc, out = run_hook(START, {"taskId": "k" + "e" * 31, "callerOrchestrator": "pi"})
    assert rc == 0, f"missing probe must fail open, rc={rc} out={out}"


def test_other_tools_pass():
    rc, _ = run_hook("mcp__vantage-peers__list_tasks", {"assignedTo": "pi"},
                     probe_json=[{"_id": "k17blocking0000000000000000000000"}])
    assert rc == 0


def test_malformed_stdin_fails_open():
    proc = subprocess.run([sys.executable, str(HOOK)], input="not json",
                          capture_output=True, text=True, timeout=10)
    assert proc.returncode == 0


def test_self_restart_of_same_task_passes():
    tid = "k17sametask000000000000000000000"
    rc, out = run_hook(START, {"taskId": tid, "callerOrchestrator": "pi"},
                       probe_json=[{"_id": tid, "title": "same"}])
    assert rc == 0, f"restarting the same task must pass, rc={rc} out={out}"


def test_http_path_against_real_deployment():
    """The production probe path, not an injected one. Uses a real orchestrator
    known to hold in_progress tasks on the canonical deployment; a wrong Convex
    function path makes the probe return None (fail-open) and this test red."""
    rc, out = run_hook(START, {"taskId": "k" + "f" * 31, "callerOrchestrator": "eta"})
    assert rc == 2, f"real HTTP probe must see eta's in_progress tasks and block, rc={rc} out={out}"
    assert "k17" in out, f"error message must name a real blocking task id: {out}"


def test_state_fail_open_is_loud():
    rc, out = run_hook(START, {"taskId": "k" + "i" * 31, "callerOrchestrator": "pi"},
                       probe_fail=True)
    assert rc == 0
    assert "state unreadable" in out, f"state fail-open must be said on stderr: {out}"


def test_real_path_is_an_existing_export():
    """Decoupled from any orchestrator's mutable queue: asserts the Convex
    function path used by the hook answers success on the real deployment."""
    import urllib.request
    hook_src = HOOK.read_text()
    path = "tasks:list"
    assert f'"{path}"' in hook_src, "hook no longer uses the asserted path"
    req = urllib.request.Request(
        "https://compassionate-goldfinch-737.convex.cloud/api/query",
        data=json.dumps({"path": path, "format": "json",
                         "args": {"assignedTo": "pi", "status": "in_progress", "limit": 1}}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=5) as resp:
        body = json.loads(resp.read())
    assert body.get("status") == "success", f"path {path} is not a real export: {body}"


def test_unknown_identity_fails_open_and_says_so():
    rc, out = run_hook(START, {"taskId": "k" + "g" * 31},
                       probe_json=[{"_id": "k17blocking0000000000000000000000"}])
    assert rc == 0, f"unknown identity must fail open, rc={rc}"
    assert "identity unknown" in out, f"fail-open on identity must be said in stderr: {out}"


def test_env_identity_arms_the_guard():
    rc, out = run_hook(START, {"taskId": "k" + "h" * 31},
                       probe_json=[{"_id": "k17blocking0000000000000000000000"}],
                       extra_env={"VP_ORCHESTRATOR": "eta"})
    assert rc == 2, f"VP_ORCHESTRATOR identity must arm the guard, rc={rc} out={out}"


if __name__ == "__main__":
    fails = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            try:
                fn()
                print(f"PASS {name}")
            except AssertionError as e:
                fails += 1
                print(f"FAIL {name}: {e}")
            except Exception as e:
                fails += 1
                print(f"ERROR {name}: {e}")
    sys.exit(1 if fails else 0)
