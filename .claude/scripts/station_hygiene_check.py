#!/usr/bin/env python3
"""Station hygiene gate: a station with a dirty perimeter starts no new work.

The class this closes: every cleanup rule exists and nothing enforces it at the moment a
station starts new work, so uncommitted files, worktrees of landed pull requests, stalled
pull requests, stale build output and piles of local branches accumulate until a host
runs out of disk or a review runs on stale code.

Scope is DERIVED from the station root, never typed: the root's own checkout, the
repository that owns it, and every worktree registered in that repository. All of them
share one worktree list, so one `git worktree list` answers the whole perimeter.

Findings (one line each; exit 1 when any exists):
  DIRTY            a checkout carries more uncommitted files than the config allows. A
                   registered worktree nested inside a checkout is not a file of it: it is
                   judged as its own checkout.
  DEAD-WORKTREE    a registered worktree whose branch has a MERGED or CLOSED pull request
                   whose head commit IS the worktree's tip, and no open one. A worktree whose
                   tip moved after the merge carries work and is not flagged.
  PRUNABLE-WORKTREE  a registration whose directory is gone.
  STALLED-PR       an open pull request whose head is a local branch of this perimeter and
                   which `wip_limit_check.judge_pr` calls STALLED. The threshold is read from
                   the wip-limit config, never restated here.
  EXTRA-BRANCHES   local branches beyond the default branch, the heads of open pull
                   requests and the branch checked out in the station root (work in
                   flight), above the configured maximum.
  STALE-BUILD      an ignored build-output directory with nothing newer than the configured
                   age. Tracked or recently touched directories are kept, never flagged.

COULD-NOT-JUDGE (exit 2 when nothing was flagged): a root that is not a git checkout, an
unreadable config, an unreadable platform answer, a detached worktree that cannot be tied
to a pull request. Not-looked-at never reads as clean.

Usage:
  station_hygiene_check.py <station-root> [--report] [--config FILE] [--now ISO-8601]
  station_hygiene_check.py --build-outputs <checkout> [--config FILE] [--now ISO-8601]

`--report` additionally prints the scope the check looked at (SCOPE lines) and the kept
build outputs. `--build-outputs` is the single classifier of build-output directories; it
prints `STALE <path> — ...` or `KEEP  <path> — <reason>` per directory and is what the
station reaper calls, so classification has one authority.

Exit codes: 0 nothing flagged, 1 something flagged, 2 something could not be judged (and
nothing was flagged).
"""

from __future__ import annotations

import importlib.util
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORKSPACE = HERE.parent.parent
DEFAULT_CONFIG = WORKSPACE / ".claude" / "config" / "station-hygiene.json"

GITHUB_URL_RE = re.compile(
    r"^(?:git@github\.com:|ssh://git@github\.com/|https://(?:[^@/]+@)?github\.com/)"
    r"([^/]+/[^/]+?)(?:\.git)?$"
)
OPEN_LIMIT = 1000
HEAD_LIMIT = 100
LIST_LIMIT = 10  # names printed for a long list; the count is always the full one


class Unreadable(Exception):
    """An input this check cannot read. Always surfaces as COULD-NOT-JUDGE."""


@dataclass
class Result:
    findings: list = field(default_factory=list)
    could_not_judge: list = field(default_factory=list)
    scope: list = field(default_factory=list)
    kept: list = field(default_factory=list)


def _wip():
    """The work-in-progress check, loaded lazily: only the pull-request questions need it."""
    name = "_wip_limit_check"
    if name in sys.modules:
        return sys.modules[name]
    path = HERE / "wip_limit_check.py"
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise Unreadable(f"{path} cannot be loaded")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module  # dataclasses resolve their own module through sys.modules
    try:
        spec.loader.exec_module(module)
    except Exception as exc:  # noqa: BLE001 - any failure to load is could-not-judge
        sys.modules.pop(name, None)
        raise Unreadable(f"{path} cannot be loaded: {exc}") from exc
    return module


def parse_time(text: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError as exc:
        raise Unreadable(f"timestamp unreadable: {text!r}") from exc
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _json(path: Path, what: str):
    try:
        return json.loads(path.read_text())
    except (OSError, ValueError) as exc:
        raise Unreadable(f"{what} {path} unreadable: {exc}") from exc


def _natural(value, name: str, path: Path) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise Unreadable(f"config {path} carries no non-negative integer {name}")
    return value


def _resolve(raw, base: Path, name: str, config_path: Path) -> Path:
    if not isinstance(raw, str) or not raw:
        raise Unreadable(f"config {config_path} carries no {name}")
    candidate = Path(raw)
    return candidate if candidate.is_absolute() else WORKSPACE / candidate


def load_config(path: Path) -> dict:
    data = _json(path, "config")
    if not isinstance(data, dict):
        raise Unreadable(f"config {path} is not an object")
    ignored = data.get("ignored_local_paths")
    if not isinstance(ignored, list) or not all(isinstance(p, str) and p for p in ignored):
        raise Unreadable(f"config {path} carries no ignored_local_paths list of non-empty strings")
    return {
        "ignored_local_paths": {os.path.normpath(p) for p in ignored},
        "max_porcelain": _natural(data.get("maxPorcelainFiles"), "maxPorcelainFiles", path),
        "max_extra_branches": _natural(data.get("maxExtraBranches"), "maxExtraBranches", path),
        "wip_config": _resolve(data.get("wipLimitConfig"), WORKSPACE, "wipLimitConfig", path),
        "build_config": _resolve(data.get("buildOutputConfig"), WORKSPACE, "buildOutputConfig", path),
    }


def load_build_config(path: Path) -> tuple:
    data = _json(path, "build-output config")
    dirs = data.get("dirs") if isinstance(data, dict) else None
    days = data.get("minAgeDays") if isinstance(data, dict) else None
    if not isinstance(dirs, list) or not dirs or not all(isinstance(d, str) and d for d in dirs):
        raise Unreadable(f"build-output config {path} carries no non-empty dirs list")
    if isinstance(days, bool) or not isinstance(days, (int, float)) or days <= 0:
        raise Unreadable(f"build-output config {path} carries no positive minAgeDays")
    return set(dirs), float(days)


def git(args: list, cwd: Path, check: bool = True) -> subprocess.CompletedProcess:
    try:
        done = subprocess.run(
            ["git", "-C", str(cwd), *args], capture_output=True, text=True, check=False, timeout=120
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise Unreadable(f"git {' '.join(args)} in {cwd} could not run: {exc}") from exc
    if check and done.returncode != 0:
        raise Unreadable(f"git {' '.join(args)} in {cwd} failed: {done.stderr.strip()}")
    return done


@dataclass(frozen=True)
class Checkout:
    path: Path
    head: str
    branch: str  # "" when detached or bare
    prunable: bool


def list_checkouts(root: Path) -> list:
    """Every checkout registered in the repository `root` belongs to (the main one first)."""
    out = git(["worktree", "list", "--porcelain"], root).stdout
    checkouts: list = []
    block: dict = {}

    def flush():
        if "worktree" in block:
            branch = block.get("branch", "")
            checkouts.append(
                Checkout(
                    path=Path(block["worktree"]),
                    head=block.get("HEAD", ""),
                    branch=branch.removeprefix("refs/heads/"),
                    prunable="prunable" in block,
                )
            )

    for line in out.splitlines():
        if not line.strip():
            flush()
            block = {}
            continue
        key, _, value = line.partition(" ")
        block[key] = value
    flush()
    if not checkouts:
        raise Unreadable(f"git worktree list in {root} returned no checkout")
    return checkouts


def github_slug(main: Path) -> tuple:
    """(slug, reason). slug None with reason "" means: no remote, so no pull request can exist."""
    done = git(["config", "--get", "remote.origin.url"], main, check=False)
    url = done.stdout.strip()
    if not url:
        return None, ""
    match = GITHUB_URL_RE.match(url)
    if not match:
        return None, f"remote 'origin' is not a GitHub repository ({url}); pull requests cannot be read"
    return match.group(1), ""


def local_branches(main: Path) -> list:
    out = git(["for-each-ref", "--format=%(refname:short)", "refs/heads"], main).stdout
    return [line for line in out.splitlines() if line]


def default_branch(main: Path, branches: list) -> str:
    done = git(["symbolic-ref", "-q", "--short", "refs/remotes/origin/HEAD"], main, check=False)
    name = done.stdout.strip().removeprefix("origin/")
    if name:
        return name
    for candidate in ("main", "master"):
        if candidate in branches:
            return candidate
    return ""


def uncommitted(checkout: Path, nested: list, ignored_local: set = frozenset()) -> list:
    """Uncommitted paths of one checkout, minus registered worktrees nested inside it and
    minus the per-station local files the config lists (relative to the checkout, exact)."""
    out = git(["status", "--porcelain=v1", "-z", "-uall"], checkout).stdout
    tokens = out.split("\0")
    paths: list = []
    i = 0
    while i < len(tokens):
        entry = tokens[i]
        i += 1
        if len(entry) < 4:
            continue
        status, rel = entry[:2], entry[3:]
        if "R" in status or "C" in status:
            i += 1  # the origin path of a rename or copy is a second field
        if os.path.normpath(rel) in ignored_local:
            continue
        absolute = os.path.normpath(str(checkout / rel))
        if any(absolute == n or absolute.startswith(n + os.sep) for n in nested):
            continue
        paths.append(rel)
    return paths


# --------------------------------------------------------------------- build outputs


# Directory names that hold installed packages, and the file marking a Python virtual
# environment. Both are properties of package managers, not of any station or client.
INSTALLED_PACKAGE_TREES = frozenset({"node_modules", "site-packages", "dist-packages"})
VENV_MARKER = "pyvenv.cfg"


def _newest_mtime(directory: Path) -> float:
    newest = directory.lstat().st_mtime
    for base, dirs, files in os.walk(directory, followlinks=False):
        for name in dirs + files:
            try:
                newest = max(newest, os.lstat(os.path.join(base, name)).st_mtime)
            except OSError as exc:
                raise Unreadable(f"{os.path.join(base, name)} cannot be dated: {exc}") from exc
    return newest


def _find_build_dirs(checkout: Path, names: set) -> list:
    """Directories whose name is a build-output name, inside this checkout only.

    Never descends into `.git`, a matched directory, or a directory that is itself a
    checkout (it carries its own `.git`): another checkout is judged on its own.

    Never descends into an installed package tree either: a `node_modules`,
    `site-packages` or `dist-packages` directory, or a Python virtual environment (a
    directory holding `pyvenv.cfg`). A directory named like a build output there is an
    installed source package (pip ships a module named `build`), never a build output.
    The decision reads the artifact's nature, never a list of specific paths.
    """
    found: list = []
    for base, dirs, _files in os.walk(checkout, followlinks=False):
        keep = []
        for name in dirs:
            full = Path(base) / name
            if name == ".git" or name in INSTALLED_PACKAGE_TREES:
                continue
            if (full / VENV_MARKER).is_file():
                continue
            if name in names:
                found.append(full)
                continue
            if (full / ".git").exists():
                continue
            keep.append(name)
        dirs[:] = keep
    return sorted(found)


def classify_build_outputs(checkout: Path, names: set, min_age_days: float, now: datetime) -> list:
    """[(path, "STALE"|"KEEP", reason)] for every build-output directory of one checkout."""
    results: list = []
    cutoff = (now - timedelta(days=min_age_days)).timestamp()
    for path in _find_build_dirs(checkout, names):
        rel = os.path.relpath(path, checkout)
        if path.is_symlink():
            results.append((path, "KEEP", "a symbolic link, never followed"))
            continue
        tracked = git(["ls-files", "--", rel], checkout).stdout.strip()
        if tracked:
            results.append((path, "KEEP", "tracked: it holds files under version control"))
            continue
        ignored = git(["check-ignore", "-q", "--", rel], checkout, check=False)
        if ignored.returncode == 1:
            results.append((path, "KEEP", "not ignored: git would report it as uncommitted work"))
            continue
        if ignored.returncode != 0:
            raise Unreadable(f"git check-ignore on {path} failed (exit {ignored.returncode}): {ignored.stderr.strip()}")
        newest = _newest_mtime(path)
        age_days = (now.timestamp() - newest) / 86400
        if newest > cutoff:
            results.append((path, "KEEP", f"ignored but newer than {min_age_days:g} days (newest entry {age_days:.1f} days old)"))
        else:
            results.append((path, "STALE", f"ignored, nothing newer than {min_age_days:g} days (newest entry {age_days:.1f} days old)"))
    return results


# --------------------------------------------------------------------- the checks


def _gh_json(wip, args: list):
    try:
        return json.loads(wip._gh(args))
    except wip.Unreadable as exc:  # the reused check's own refusal type, re-raised as ours
        raise Unreadable(str(exc)) from exc
    except ValueError as exc:
        raise Unreadable(f"`gh {' '.join(args)}` answer unreadable: {exc}") from exc


def check(root: Path, config: dict, now: datetime) -> Result:
    result = Result()
    names, min_days = load_build_config(config["build_config"])

    top = git(["rev-parse", "--show-toplevel"], root).stdout.strip()
    own = Path(os.path.realpath(top))
    checkouts = list_checkouts(own)
    main = checkouts[0].path
    nested = [os.path.normpath(str(c.path)) for c in checkouts]
    slug, slug_reason = github_slug(main)
    branches = local_branches(main)
    default = default_branch(main, branches)

    result.scope.append(f"SCOPE repository {main} ({slug or slug_reason or 'no remote'}); {len(branches)} local branch(es)")

    def judged(label: str, action):
        try:
            return action()
        except Unreadable as exc:
            result.could_not_judge.append(f"{label} — {exc}")
            return None

    # Uncommitted files and build output, per checkout.
    for checkout in checkouts:
        role = "station root" if os.path.realpath(checkout.path) == str(own) else (
            "main checkout" if checkout is checkouts[0] else "worktree")
        result.scope.append(f"SCOPE checkout {checkout.path} ({role}{', prunable' if checkout.prunable else ''})")
        if checkout.prunable:
            result.findings.append(
                f"PRUNABLE-WORKTREE {checkout.path} — registered but the directory is gone: git worktree prune"
            )
            continue
        others = [n for n in nested if n != os.path.normpath(str(checkout.path))]
        files = judged(f"DIRTY {checkout.path}", lambda c=checkout, o=others: uncommitted(c.path, o, config["ignored_local_paths"]))
        if files is not None and len(files) > config["max_porcelain"]:
            shown = ", ".join(files[:LIST_LIMIT]) + (" …" if len(files) > LIST_LIMIT else "")
            result.findings.append(
                f"DIRTY {checkout.path} — {len(files)} uncommitted file(s) (max {config['max_porcelain']}): {shown}"
            )
        outputs = judged(
            f"STALE-BUILD {checkout.path}",
            lambda c=checkout: classify_build_outputs(c.path, names, min_days, now),
        )
        for path, verdict, reason in outputs or []:
            if verdict == "STALE":
                result.findings.append(f"STALE-BUILD {path} — {reason}")
            else:
                result.kept.append(f"KEEP  {path} — {reason}")

    # Pull-request questions need a readable platform.
    if slug is None and slug_reason:
        result.could_not_judge.append(f"pull requests {main} — {slug_reason}")
        open_heads: set | None = None
    elif slug is None:
        open_heads = set()  # no remote: no pull request can exist
    else:
        open_heads = judged("open pull requests", lambda: _open_heads(slug))

    # Extra local branches.
    if open_heads is not None:
        # The branch checked out in the station root is work in flight (the day branch a station
        # opens each morning), not a leftover: counting it would refuse every task of the day.
        # Only that one branch is exempt; its siblings and every other worktree's branch count.
        in_flight = {c.branch for c in checkouts if c.branch and os.path.realpath(c.path) == str(own)}
        extra = sorted(
            b for b in branches
            if b != default and b not in in_flight and b not in {h for h, _ in open_heads}
        )
        if len(extra) > config["max_extra_branches"]:
            shown = ", ".join(extra[:LIST_LIMIT]) + (" …" if len(extra) > LIST_LIMIT else "")
            result.findings.append(
                f"EXTRA-BRANCHES {main} — {len(extra)} local branch(es) beyond {default or 'the default branch'} "
                f"and open-PR heads (max {config['max_extra_branches']}): {shown}"
            )

    # Dead worktrees.
    for checkout in checkouts[1:]:
        if checkout.prunable or os.path.realpath(checkout.path) == str(own):
            continue
        if slug is None:
            continue  # no remote: nothing can have merged; an unreadable remote is already reported
        if not checkout.branch:
            result.could_not_judge.append(
                f"DEAD-WORKTREE {checkout.path} — detached HEAD: no branch to tie to a pull request"
            )
            continue
        verdict = judged(
            f"DEAD-WORKTREE {checkout.path}", lambda c=checkout: _dead_reason(slug, c, open_heads)
        )
        if verdict:
            result.findings.append(f"DEAD-WORKTREE {checkout.path} — {verdict}")

    # Stalled pull requests of this perimeter.
    if open_heads:
        local = set(branches)
        mine = sorted((n, h) for h, n in open_heads if h in local)
        if mine:
            judged("STALLED-PR", lambda: _stalled(slug, mine, config["wip_config"], now, result))
    return result


def _open_heads(slug: str) -> set:
    wip = _wip()
    data = _gh_json(wip, ["pr", "list", "-R", slug, "--state", "open", "--limit", str(OPEN_LIMIT),
                          "--json", "number,headRefName"])
    if not isinstance(data, list):
        raise Unreadable("open pull request list is not a list")
    if len(data) >= OPEN_LIMIT:
        raise Unreadable(f"{slug} has at least {OPEN_LIMIT} open pull requests: the list may be truncated")
    try:
        return {(str(item["headRefName"]), int(item["number"])) for item in data}
    except (KeyError, TypeError, ValueError) as exc:
        raise Unreadable(f"open pull request list unreadable: {exc}") from exc


def _dead_reason(slug: str, checkout: Checkout, open_heads: set) -> str:
    if any(head == checkout.branch for head, _ in open_heads):
        return ""
    wip = _wip()
    data = _gh_json(wip, ["pr", "list", "-R", slug, "--state", "all", "--head", checkout.branch,
                          "--limit", str(HEAD_LIMIT), "--json", "number,state,headRefOid"])
    if not isinstance(data, list):
        raise Unreadable(f"pull request list for {checkout.branch} is not a list")
    try:
        for item in data:
            if str(item["state"]) in ("MERGED", "CLOSED") and str(item["headRefOid"]) == checkout.head:
                state = str(item["state"]).lower()
                return f"branch {checkout.branch}: PR #{item['number']} is {state} and its head is this worktree's tip"
    except (KeyError, TypeError) as exc:
        raise Unreadable(f"pull request list for {checkout.branch} unreadable: {exc}") from exc
    return ""


def _stalled(slug: str, mine: list, wip_config: Path, now: datetime, result: Result) -> None:
    wip = _wip()
    try:
        hours = float(wip.load_config(wip_config)["thresholdHours"])
    except wip.Unreadable as exc:
        raise Unreadable(str(exc)) from exc
    threshold = timedelta(hours=hours)
    for number, head in mine:
        ref = wip.Ref(repo=slug, number=number)
        try:
            outcome = wip.judge_pr(wip.read_settled_facts(ref), now, threshold)
        except wip.Unreadable as exc:
            result.could_not_judge.append(f"STALLED-PR {ref} — {exc}")
            continue
        if outcome.status == wip.STALLED:
            result.findings.append(f"STALLED-PR {ref} ({head}) — {outcome.reason}")


# --------------------------------------------------------------------- command line


def parse_args(argv: list) -> dict:
    opts = {"root": None, "report": False, "config": None, "now": None, "build_outputs": None}
    rest = list(argv[1:])
    while rest:
        token = rest.pop(0)
        if token == "--report":
            opts["report"] = True
        elif token in ("--config", "--now", "--build-outputs"):
            if not rest:
                raise Unreadable(f"`{token}` carries no value")
            opts[token[2:].replace("-", "_")] = rest.pop(0)
        elif token.startswith("-"):
            raise Unreadable(f"argument unreadable: {token}")
        elif opts["root"] is None:
            opts["root"] = token
        else:
            raise Unreadable("expected exactly one station root")
    if (opts["root"] is None) == (opts["build_outputs"] is None):
        raise Unreadable("give exactly one of <station-root> or --build-outputs <checkout>")
    return opts


def main(argv: list) -> int:
    try:
        opts = parse_args(argv)
        config = load_config(Path(opts["config"]) if opts["config"] else DEFAULT_CONFIG)
        now = parse_time(opts["now"]) if opts["now"] else datetime.now(timezone.utc)
        if opts["build_outputs"]:
            names, days = load_build_config(config["build_config"])
            checkout = Path(os.path.realpath(opts["build_outputs"]))
            if not checkout.is_dir():
                raise Unreadable(f"{checkout} is not a directory")
            for path, verdict, reason in classify_build_outputs(checkout, names, days, now):
                label = "STALE" if verdict == "STALE" else "KEEP "
                print(f"{label} {path} — {reason}")
            return 0
        root = Path(opts["root"])
        if not root.is_dir():
            raise Unreadable(f"{root} is not a directory")
        result = check(root, config, now)
    except Unreadable as exc:
        print(f"COULD-NOT-JUDGE input — {exc}")
        print(
            "usage: station_hygiene_check.py <station-root> [--report] [--config FILE] [--now ISO] "
            "| --build-outputs <checkout>"
        )
        return 2

    if opts["report"]:
        for line in result.scope:
            print(line)
        for line in result.kept:
            print(line)
    for line in result.findings:
        print(line)
    for line in result.could_not_judge:
        print(f"COULD-NOT-JUDGE {line}")
    print(
        f"findings: {len(result.findings)}  could-not-judge: {len(result.could_not_judge)}  "
        f"kept build outputs: {len(result.kept)}  root: {root}"
    )
    if result.findings:
        return 1
    if result.could_not_judge:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
