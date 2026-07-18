#!/usr/bin/env python3
"""Bipolar bite-probe for enforce-package-manager-canonical.py.

Two poles, both required. MUST_BLOCK: the guard refuses every known bypass shape. MUST_PASS: the guard
stays silent on every legitimate shape. A guard scoring perfectly on MUST_BLOCK alone is a guard that
blocks everything -- it gets disarmed within the week and then protects nothing.

Repos are materialised on disk (real lockfiles, real directories) rather than mocked, so the probe
exercises the derivation path the guard actually uses.
"""
import json
import os
import subprocess
import sys
import tempfile

HOOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "enforce-package-manager-canonical.py")

BLOCK_RC = 2


def run(command, cwd):
    payload = {"tool_name": "Bash", "tool_input": {"command": command}, "cwd": cwd}
    proc = subprocess.run(
        [sys.executable, HOOK],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
    )
    return proc.returncode, proc.stderr


def make_repo(root, name, lockfile):
    path = os.path.join(root, name)
    os.makedirs(path, exist_ok=True)
    if lockfile:
        open(os.path.join(path, lockfile), "w").close()
    open(os.path.join(path, "package.json"), "w").write("{}")
    return path


def main():
    failures = []
    with tempfile.TemporaryDirectory() as root:
        bun_repo = make_repo(root, "bun-canonical", "bun.lock")
        npm_repo = make_repo(root, "npm-canonical", "package-lock.json")
        bare_repo = make_repo(root, "no-lockfile", None)
        both_repo = make_repo(root, "ambiguous", "bun.lock")
        open(os.path.join(both_repo, "package-lock.json"), "w").close()

        must_block = [
            ("npm pack", bun_repo, "npm pack in a bun repo -- the incident shape"),
            ("npm publish --access public", bun_repo, "npm publish in a bun repo"),
            ("bun install", npm_repo, "bun install in an npm repo, the symmetric case"),
            ("bun pm pack", npm_repo, "bun in an npm repo via a different verb path"),
            ("cd {} && npm pack".format(bun_repo), root, "cd prefix must be honoured"),
            ("CI=1 npm ci", bun_repo, "env-var prefix must not hide the invocation"),
            ("echo hi && npm install", bun_repo, "chained after an unrelated command"),
            ("npm run build", bun_repo, "run is artifact-producing"),
        ]
        must_pass = [
            ("bun install", bun_repo, "the declared manager"),
            ("bun pm pack", bun_repo, "declared manager, packing"),
            ("npm pack", npm_repo, "declared manager, packing"),
            ("npm ci", npm_repo, "declared manager, install"),
            ("npm view some-package version", bun_repo, "read-only verb cannot produce an artifact"),
            ("npm whoami", bun_repo, "read-only"),
            ("npm outdated", bun_repo, "read-only"),
            ("npm pack", bare_repo, "no lockfile -- not decidable from the tree, stay silent"),
            ("npm pack", both_repo, "both lockfiles -- ambiguous, stay silent"),
            (
                "npm pack # allow-cross-package-manager: proving a consumer install",
                bun_repo,
                "documented override",
            ),
            ("git commit -m 'chore: npm pack notes'", bun_repo, "prose is data, never an invocation"),
            ("ls && cat package.json", bun_repo, "no package manager at all"),
        ]

        for command, cwd, why in must_block:
            rc, err = run(command, cwd)
            if rc != BLOCK_RC:
                failures.append("HOLE     rc={} (want {}) :: {} :: {}".format(rc, BLOCK_RC, command, why))
            elif "package-manager-canonical" not in err:
                failures.append("BLOCKED BUT MUTE :: {} :: {}".format(command, why))

        for command, cwd, why in must_pass:
            rc, _ = run(command, cwd)
            if rc != 0:
                failures.append("FALSE POSITIVE rc={} (want 0) :: {} :: {}".format(rc, command, why))

        total = len(must_block) + len(must_pass)

    if failures:
        print("\n".join(failures))
        print("\n{}/{} passed -- NOT propagable (0 holes AND 0 false positives required)".format(
            total - len(failures), total))
        sys.exit(1)

    print("{}/{} passed ({} must-block, {} must-pass) -- 0 holes, 0 false positives".format(
        total, total, len(must_block), len(must_pass)))


if __name__ == "__main__":
    main()
