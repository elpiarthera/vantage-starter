#!/usr/bin/env python3
"""Block artifact-producing package-manager commands run with a manager the target repo does not declare.

Class of failure: a repo declares its package manager through its committed lockfile (and optionally a
packageManager field). Running a DIFFERENT manager's artifact-producing verb against that repo yields a
result that looks successful and is silently wrong -- most visibly a tarball missing the build output,
because the two managers do not resolve the same lifecycle scripts or workspace layout. The command exits
0, so nothing surfaces until a consumer installs the broken package.

The signal is DERIVED from the repo on disk (which lockfile exists), never typed by the caller. That is the
whole point: the operator cannot misremember which repo is which, because the operator is not asked.

Scope: only verbs that PRODUCE or MUTATE an artifact -- pack, publish, install, ci, add, remove, run.
Read-only verbs (view, info, ls, why, outdated, whoami, exec --help) never block: they cannot produce a
wrong artifact, and blocking them would train the operator to disable the guard.

Blocks only when the evidence is unambiguous: the OTHER manager's lockfile is present AND the invoked
manager's lockfile is absent. A repo with both, or with neither, is not decidable from the tree, so the
guard stays silent rather than guessing.

Override: `# allow-cross-package-manager: <reason>` on the same command line, for a deliberate
cross-manager operation (e.g. verifying a consumer installs the published tarball with the other manager).
"""
import json
import os
import re
import shlex
import sys

LOCKFILES = {
    "bun": ("bun.lock", "bun.lockb"),
    "npm": ("package-lock.json",),
    "pnpm": ("pnpm-lock.yaml",),
    "yarn": ("yarn.lock",),
}

# Verbs that produce or mutate an artifact. Anything not listed here is read-only for our purposes
# and is never blocked.
MUTATING_VERBS = {
    "pack",
    "publish",
    "install",
    "i",
    "ci",
    "add",
    "remove",
    "rm",
    "uninstall",
    "run",
    "run-script",
    "link",
    "prune",
    "dedupe",
}

MANAGERS = ("npm", "pnpm", "yarn", "bun")

OVERRIDE = re.compile(r"#\s*allow-cross-package-manager:\s*\S", re.IGNORECASE)


def declared_managers(repo_dir):
    """Return the set of managers whose lockfile is present in repo_dir. Derived, never typed."""
    found = set()
    for manager, names in LOCKFILES.items():
        for name in names:
            if os.path.isfile(os.path.join(repo_dir, name)):
                found.add(manager)
                break
    return found


def resolve_dir(command, cwd):
    """Best-effort: honour a leading `cd <dir> &&` so the guard reads the repo actually targeted."""
    match = re.match(r"\s*cd\s+(?:--\s+)?('[^']*'|\"[^\"]*\"|[^\s;&|]+)\s*(?:&&|;)", command)
    if not match:
        return cwd
    raw = match.group(1)
    try:
        target = shlex.split(raw)[0]
    except ValueError:
        return cwd
    target = os.path.expanduser(target)
    if not os.path.isabs(target):
        target = os.path.join(cwd or ".", target)
    return target if os.path.isdir(target) else cwd


def invocations(command):
    """Yield (manager, verb) pairs for package-manager calls in the command line."""
    for segment in re.split(r"&&|\|\||;|\|", command):
        try:
            tokens = shlex.split(segment)
        except ValueError:
            tokens = segment.split()
        # Skip env-var prefixes (FOO=bar npm pack) and common wrappers.
        index = 0
        while index < len(tokens) and (
            "=" in tokens[index].split("/")[-1][:40] and not tokens[index].startswith("-")
        ):
            if re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", tokens[index]):
                index += 1
            else:
                break
        if index >= len(tokens):
            continue
        head = os.path.basename(tokens[index])
        if head not in MANAGERS:
            continue
        # First non-flag token after the manager is the verb. Some managers namespace their verbs
        # behind a sub-command (`bun pm pack`, `npm pkg set`); step through those so the guard reads
        # the verb that actually acts, not the namespace that introduces it.
        namespaces = {"pm", "pkg", "cache"}
        for token in tokens[index + 1 :]:
            if token.startswith("-"):
                continue
            if token in namespaces:
                continue
            yield head, token
            break


def main():
    try:
        payload = json.load(sys.stdin)
    except (ValueError, OSError):
        sys.exit(0)

    if payload.get("tool_name") != "Bash":
        sys.exit(0)

    tool_input = payload.get("tool_input", {}) or {}
    command = tool_input.get("command", "") or ""
    if not command:
        sys.exit(0)

    if OVERRIDE.search(command):
        sys.exit(0)

    cwd = payload.get("cwd") or os.getcwd()
    repo_dir = resolve_dir(command, cwd)
    declared = declared_managers(repo_dir)
    if not declared:
        sys.exit(0)

    for manager, verb in invocations(command):
        if verb not in MUTATING_VERBS:
            continue
        if manager in declared:
            continue
        # Unambiguous only: exactly the other manager is declared here.
        others = sorted(declared)
        sys.stderr.write(
            "BLOCKED by package-manager-canonical: `{} {}` in {}\n\n".format(manager, verb, repo_dir)
            + "  This repository declares: {} (lockfile present on disk).\n".format(", ".join(others))
            + "  You invoked: {}.\n\n".format(manager)
            + "An artifact-producing verb run with a manager the repo does not declare exits 0 and\n"
            "produces a silently wrong artifact -- classically a tarball missing the build output.\n"
            "The canonical manager is DERIVED from the lockfile, so it is never a matter of recall:\n"
            "  ls {} | grep -E 'bun.lock|package-lock.json|pnpm-lock.yaml|yarn.lock'\n\n".format(repo_dir)
            + "Use: {} {}\n\n".format(others[0], verb)
            + "Override (deliberate cross-manager check, e.g. proving a consumer install):\n"
            "  # allow-cross-package-manager: <reason>\n"
        )
        sys.exit(2)

    sys.exit(0)


if __name__ == "__main__":
    main()
