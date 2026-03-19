#!/usr/bin/env python3
"""
Hook Integration Tests — tests each VantageStarter hook via stdin/stdout contract.

Spawns each hook as a subprocess, sends JSON payload on stdin,
parses JSON output from stdout, asserts on shape and content.

Usage:
    python3 tests/test-hooks.py                           # all tests
    python3 tests/test-hooks.py --hook routing            # routing hook only
    python3 tests/test-hooks.py --hook subagent           # subagent hook only
    python3 tests/test-hooks.py --hook validate           # validate hook only

Exit code: 0 = all pass, 1 = any failures
"""

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
HOOKS_DIR = ROOT / "hooks"

results = {"pass": 0, "fail": 0, "tests": []}


def run_hook(script: str, payload: dict, timeout: int = 15) -> dict:
    script_path = HOOKS_DIR / script
    if not script_path.exists():
        return {"error": f"Script not found: {script}", "stdout": "", "stderr": "", "code": -1}
    try:
        proc = subprocess.run(
            ["python3", str(script_path)],
            input=json.dumps(payload),
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=str(ROOT),
        )
        stdout = proc.stdout.strip()
        parsed = json.loads(stdout) if stdout else {}
        return {"output": parsed, "stdout": stdout, "stderr": proc.stderr, "code": proc.returncode}
    except subprocess.TimeoutExpired:
        return {"error": "Timeout", "stdout": "", "stderr": "", "code": -1}
    except json.JSONDecodeError:
        return {"output": {}, "stdout": proc.stdout if 'proc' in dir() else "", "stderr": "", "code": 0}
    except Exception as e:
        return {"error": str(e), "stdout": "", "stderr": "", "code": -1}


def ok(name: str, cond: bool, detail: str = ""):
    status = "PASS" if cond else "FAIL"
    results["tests"].append({"name": name, "status": status, "detail": detail})
    if cond:
        results["pass"] += 1
        print(f"  PASS  {name}")
    else:
        results["fail"] += 1
        print(f"  FAIL  {name}" + (f" — {detail}" if detail else ""))


def test_routing_hook():
    print("\n--- UserPromptSubmit Routing Hook ---")

    # Frontend prompts
    r = run_hook("user-prompt-submit-routing.py", {"prompt": "build a new dashboard page with stats cards"})
    ctx = r.get("output", {}).get("hookSpecificOutput", {}).get("additionalContext", "")
    ok("Dashboard page routes to dev-frontend", "dev-frontend" in ctx, f"got: {ctx[:80]}")

    r = run_hook("user-prompt-submit-routing.py", {"prompt": "add a responsive sidebar component"})
    ctx = r.get("output", {}).get("hookSpecificOutput", {}).get("additionalContext", "")
    ok("Responsive component routes to dev-frontend", "dev-frontend" in ctx, f"got: {ctx[:80]}")

    # Convex prompts
    r = run_hook("user-prompt-submit-routing.py", {"prompt": "write a Convex mutation to create a project"})
    ctx = r.get("output", {}).get("hookSpecificOutput", {}).get("additionalContext", "")
    ok("Convex mutation routes to dev-convex-expert", "dev-convex-expert" in ctx, f"got: {ctx[:80]}")

    r = run_hook("user-prompt-submit-routing.py", {"prompt": "add indexes to the Convex schema"})
    ctx = r.get("output", {}).get("hookSpecificOutput", {}).get("additionalContext", "")
    ok("Convex schema routes to dev-convex-expert", "dev-convex-expert" in ctx, f"got: {ctx[:80]}")

    # Clerk prompts
    r = run_hook("user-prompt-submit-routing.py", {"prompt": "set up Clerk organizations with RBAC"})
    ctx = r.get("output", {}).get("hookSpecificOutput", {}).get("additionalContext", "")
    ok("Clerk RBAC routes to clerk-expert", "clerk-expert" in ctx, f"got: {ctx[:80]}")

    # SEO prompts
    r = run_hook("user-prompt-submit-routing.py", {"prompt": "add generateMetadata to the product page"})
    ctx = r.get("output", {}).get("hookSpecificOutput", {}).get("additionalContext", "")
    ok("generateMetadata routes to dev-seo", "dev-seo" in ctx, f"got: {ctx[:80]}")

    # Security prompts
    r = run_hook("user-prompt-submit-routing.py", {"prompt": "run a security audit before deployment"})
    ctx = r.get("output", {}).get("hookSpecificOutput", {}).get("additionalContext", "")
    ok("Security audit routes to dev-sentinel", "dev-sentinel" in ctx, f"got: {ctx[:80]}")

    # Accessibility prompts
    r = run_hook("user-prompt-submit-routing.py", {"prompt": "check the site for WCAG contrast failures"})
    ctx = r.get("output", {}).get("hookSpecificOutput", {}).get("additionalContext", "")
    ok("WCAG check routes to accessibility-audit", "accessibility-audit" in ctx, f"got: {ctx[:80]}")

    # Architecture prompts
    r = run_hook("user-prompt-submit-routing.py", {"prompt": "review the architecture before adding payments"})
    ctx = r.get("output", {}).get("hookSpecificOutput", {}).get("additionalContext", "")
    ok("Architecture review routes to dev-senior-dev", "dev-senior-dev" in ctx, f"got: {ctx[:80]}")

    # Ambiguous → silent
    r = run_hook("user-prompt-submit-routing.py", {"prompt": "hello"})
    ok("Ambiguous prompt is silent", r.get("stdout", "") == "", f"got: {r.get('stdout', '')[:60]}")

    # Empty → silent
    r = run_hook("user-prompt-submit-routing.py", {"prompt": ""})
    ok("Empty prompt is silent", r.get("stdout", "") == "")

    # Valid JSON output shape
    r = run_hook("user-prompt-submit-routing.py", {"prompt": "build a UI component"})
    output = r.get("output", {})
    ok("Output has hookSpecificOutput shape", "hookSpecificOutput" in output)


def test_subagent_hook():
    print("\n--- SubagentStart Bootstrap Hook ---")

    r = run_hook("subagent-start-bootstrap.py", {"agent_type": "dev-frontend"})
    ctx = r.get("output", {}).get("hookSpecificOutput", {}).get("additionalContext", "")

    ok("SubagentStart returns context", bool(ctx), f"got empty context")
    ok("Context includes communication style", "communication" in ctx.lower() or "Communication" in ctx, f"got: {ctx[:80]}")
    ok("Context includes orchestration reminder", "orchestrat" in ctx.lower() or "registry" in ctx.lower(), f"got: {ctx[:80]}")
    ok("Context includes stack constraints", "Next.js" in ctx or "Convex" in ctx, f"got: {ctx[:80]}")
    ok("Context under 4KB", len(ctx.encode()) <= 4096, f"size: {len(ctx.encode())} bytes")


def test_session_profiler():
    print("\n--- SessionStart Profiler Hook ---")

    r = run_hook("session-start-profiler.py", {})
    ok("Profiler exits without error", r.get("code", -1) == 0, f"stderr: {r.get('stderr', '')[:80]}")
    # Profiler is allowed to be silent (no active domains) — just check it runs
    ok("Profiler is valid JSON or silent", r.get("stdout", "") == "" or "hookSpecificOutput" in r.get("output", {}))


def test_validate_hook():
    print("\n--- PostToolUse Validate Hook ---")

    import tempfile, os

    # TypeScript with `any` type — should flag error
    with tempfile.NamedTemporaryFile(mode="w", suffix=".tsx", delete=False, dir="/tmp") as f:
        f.write("const handler = (data: any) => { return data; }\n")
        bad_ts = f.name

    r = run_hook("post-tool-use-validate.py", {"tool_input": {"file_path": bad_ts}})
    ctx = r.get("output", {}).get("hookSpecificOutput", {}).get("additionalContext", "")
    ok("TypeScript `any` type triggers error", "any" in ctx.lower() or "VALIDATE" in ctx, f"got: {ctx[:100]}")

    # Good TypeScript — should be silent
    with tempfile.NamedTemporaryFile(mode="w", suffix=".tsx", delete=False, dir="/tmp") as f:
        f.write("const handler = (data: string): string => { return data; }\n")
        good_ts = f.name

    r = run_hook("post-tool-use-validate.py", {"tool_input": {"file_path": good_ts}})
    ok("Good TypeScript is silent", r.get("stdout", "") == "", f"got: {r.get('stdout', '')[:80]}")

    # Non-TypeScript file — silent
    with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False, dir="/tmp") as f:
        f.write("# Some markdown\nContent here\n")
        md_file = f.name

    r = run_hook("post-tool-use-validate.py", {"tool_input": {"file_path": md_file}})
    ok("Markdown file is silent (not applicable)", r.get("stdout", "") == "")

    # Missing file — silent
    r = run_hook("post-tool-use-validate.py", {"tool_input": {"file_path": "/tmp/nonexistent-1234.ts"}})
    ok("Missing file is silent", r.get("stdout", "") == "")

    # Cleanup
    for f in [bad_ts, good_ts, md_file]:
        Path(f).unlink(missing_ok=True)


def main():
    hook_filter = None
    if "--hook" in sys.argv:
        idx = sys.argv.index("--hook")
        if idx + 1 < len(sys.argv):
            hook_filter = sys.argv[idx + 1]

    print(f"\n{'='*56}")
    print(f"  VantageStarter Hook Integration Tests")
    print(f"{'='*56}")

    if not hook_filter or "routing" in hook_filter:
        test_routing_hook()
    if not hook_filter or "subagent" in hook_filter:
        test_subagent_hook()
    if not hook_filter or "session" in hook_filter or "profiler" in hook_filter:
        test_session_profiler()
    if not hook_filter or "validate" in hook_filter:
        test_validate_hook()

    total = results["pass"] + results["fail"]
    print(f"\n{'='*56}")
    print(f"  Results: {results['pass']}/{total} PASS  {results['fail']}/{total} FAIL")
    print(f"{'='*56}\n")

    return 1 if results["fail"] > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
