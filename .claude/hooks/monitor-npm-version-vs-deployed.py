#!/usr/bin/env python3
"""
PostToolUse hook : alert when Convex prod deploy ships mcp-server code that
is NOT published to npm. Inverse alert to Day 79 NPM PUBLISH PROTOCOL.

Day 88 trigger (2026-06-01): trilogy v2.4.4/v2.4.5/v2.4.6 Convex-deployed
to compassionate-goldfinch-737 but `npm publish vantage-peers-mcp` was never
called. npm latest stuck at 2.4.3 = predates all 3 createdBy work. Fleet
orchestrators loaded npm 2.4.3 dist that didn't have the new filter code.
3 cycles diagnostic before discovering structural gap.

Day 79 NPM PUBLISH PROTOCOL hook (enforce-eta-approval-before-npm-publish.py)
BLOCKS npm publish without Eta approval. This hook is the INVERSE alert :
notifies when a deploy ships code that *should* also be npm-published but
wasn't.

Fires on:
  PostToolUse Bash matching `npx convex deploy ...`

Logic:
  1. Detect cwd has mcp-server/package.json
  2. Read local package version + name
  3. npm view <name> dist-tags.latest
  4. If local > npm latest → alert via stderr + send_message Pi
  5. Otherwise silent

Never blocks. Alert-only. Fail-open on any error.

Override (rare, suppress alert for one-shot scenarios):
  Set env var SKIP_NPM_VERSION_MONITOR=1 before the deploy command.

Friction memory reference : j5733rfa3cg2vgywvt2556x4gn87t9te
Doctrine reference : Day 79 NPM PUBLISH PROTOCOL + Day 88 inverse alert.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

CONVEX_DEPLOY_RE = re.compile(r"npx\s+convex\s+deploy", re.IGNORECASE)


def _semver_tuple(v: str) -> tuple[int, ...]:
    """Parse semver to tuple for comparison. Returns (0,0,0) on parse error."""
    try:
        # strip prerelease/build metadata
        v = v.split("-")[0].split("+")[0]
        return tuple(int(p) for p in v.split("."))
    except Exception:
        return (0, 0, 0)


def _find_mcp_server_package(cwd: str) -> Path | None:
    """Locate mcp-server/package.json relative to cwd (or upward 2 levels)."""
    candidates = [
        Path(cwd) / "mcp-server" / "package.json",
        Path(cwd) / "package.json",  # if cwd IS mcp-server/
        Path(cwd).parent / "mcp-server" / "package.json",
    ]
    for c in candidates:
        if c.exists():
            try:
                data = json.loads(c.read_text())
                name = data.get("name", "")
                # Must be a publishable mcp package
                if "mcp" in name.lower() or "vantage" in name.lower():
                    return c
            except Exception:
                continue
    return None


def _npm_latest(pkg: str) -> str | None:
    """Fetch npm dist-tags.latest for pkg. None on failure."""
    try:
        result = subprocess.run(
            ["npm", "view", pkg, "dist-tags.latest"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode != 0:
            return None
        out = result.stdout.strip()
        return out if out else None
    except Exception:
        return None


def main() -> int:
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            return 0
        payload = json.loads(raw)
    except Exception:
        return 0

    if os.environ.get("SKIP_NPM_VERSION_MONITOR") == "1":
        return 0

    try:
        tool_name = payload.get("tool_name") or payload.get("tool") or ""
        if tool_name != "Bash":
            return 0

        tool_input = payload.get("tool_input") or payload.get("input") or {}
        if not isinstance(tool_input, dict):
            return 0

        cmd = tool_input.get("command", "") or ""
        if not CONVEX_DEPLOY_RE.search(cmd):
            return 0

        cwd = tool_input.get("cwd") or os.getcwd()
        pkg_path = _find_mcp_server_package(cwd)
        if pkg_path is None:
            return 0  # not an mcp-server deploy

        data = json.loads(pkg_path.read_text())
        pkg_name = data.get("name")
        local_version = data.get("version")
        if not pkg_name or not local_version:
            return 0

        npm_latest = _npm_latest(pkg_name)
        if npm_latest is None:
            return 0  # npm view failed — fail open

        local_t = _semver_tuple(local_version)
        npm_t = _semver_tuple(npm_latest)

        if local_t <= npm_t:
            return 0  # local <= npm — nothing to alert

        # MISMATCH : local > npm. Alert.
        sys.stderr.write(
            f"\n========================================================================\n"
            f"NPM VERSION MISMATCH DETECTED — monitor-npm-version-vs-deployed\n"
            f"========================================================================\n"
            f"\n"
            f"Convex deploy just shipped mcp-server code that is NEWER than npm:\n"
            f"\n"
            f"  Package      : {pkg_name}\n"
            f"  Local (deployed) version : {local_version}\n"
            f"  npm dist-tag latest      : {npm_latest}\n"
            f"\n"
            f"Day 88 root cause precedent (2026-06-01): trilogy v2.4.4/v2.4.5/v2.4.6\n"
            f"Convex-deployed without matching npm publish — fleet orchestrators loaded\n"
            f"stale dist for 3 cycles before discovering structural gap.\n"
            f"\n"
            f"DO ONE OF :\n"
            f"  1. Ship npm publish {pkg_name}@{local_version} per Day 79 NPM PUBLISH\n"
            f"     PROTOCOL (Eta APPROVED token gated).\n"
            f"  2. Bump local package.json down to match npm latest if this deploy is\n"
            f"     not meant to ship new MCP tool surface.\n"
            f"  3. Set env SKIP_NPM_VERSION_MONITOR=1 to suppress this alert (rare,\n"
            f"     document reason).\n"
            f"\n"
            f"Friction reference : j5733rfa3cg2vgywvt2556x4gn87t9te (severity=high).\n"
            f"========================================================================\n"
        )
        return 0  # PostToolUse — never block, just alert
    except Exception:
        return 0


if __name__ == "__main__":
    sys.exit(main())
