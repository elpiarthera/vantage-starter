#!/usr/bin/env python3
"""Work-in-progress limit: a station with a stalled pull request opens no new one.

The class this closes: a station keeps opening pull requests while its own earlier
ones sit stalled, so review capacity goes to new work and nothing merges. Every fleet
pull request is authored by one GitHub account, so the author cannot say which station
owns a pull request. The owner is a CALLER INPUT: either `--prs` (a list the station
supplies) or a ledger file mapping station -> pull requests, whose path is read from
the config. This script does not read the task server.

STALLED means the pull request is OPEN and, for longer than the configured threshold,
one of these holds:
  (a) its mergeStateStatus is DIRTY. The platform exposes no "dirty since" instant, so
      the age is the time since the head's last commit: nothing was pushed to answer
      the conflict. This is an upper bound on how long it has been waiting, stated here
      rather than hidden.
  (b) its last verdict comment (a body starting `### <Name> — <WORD>`) says REVISE and
      no commit is newer than that comment.

The threshold lives in `.claude/config/wip-limit.json`, never in this file.

Three outcomes per pull request, never two: STALLED, OK, COULD-NOT-JUDGE. An unreadable
config, ledger, reference or platform answer is COULD-NOT-JUDGE, never a pass.

The station is NEVER read from a value shared across stations, and `ORCHESTRATOR_ROLE` is
ignored entirely: one shell profile exports a single value for every station on a host, so
it carries no station information. `--root DIR` derives the station from two sources, both
read from the root:
  (a) the first `You are <Name>` header in the first 60 lines of `DIR/CLAUDE.md`;
  (b) the VantagePeers identity configured for the root: the `ROLE = "<name>"` line of the
      headers helper named by the `vantage-peers` server in `DIR/.mcp.json`, and
      `env.VP_ORCHESTRATOR` in `DIR/.claude/settings.json` / `settings.local.json`.
Names only: nothing else of a helper or a settings file is read into the output.
Names are lower-cased and accent-free. One source is enough; when several are present they
must agree. No source, or sources that disagree, is COULD-NOT-JUDGE.

A station absent from the ledger is COULD-NOT-JUDGE, never an empty list: an empty list
is a station registered as holding none (`--seed <station> --none`).

Usage:
  wip_limit_check.py <station> [--prs REF[,REF...]] [--prs-file LEDGER]
  wip_limit_check.py --root DIR [--prs-file LEDGER]
  wip_limit_check.py (<station> | --root DIR | --report) --from-github [--prs-file LEDGER]
  wip_limit_check.py --report [--prs REF[,REF...]] [--prs-file LEDGER]
  wip_limit_check.py --print-station [--source] --root DIR
  wip_limit_check.py --seed <station> (--prs REF[,REF...] | --none) [--prs-file LEDGER]
  options: --config FILE  --now ISO-8601

`--from-github` derives the station's pull requests from GitHub (a branch named
`<station>/...`) instead of requiring a ledger; the ledger is merged in when it exists and
never required. A pull request no station can be attributed to is UNATTRIBUTED: reported,
counted against nobody. Only an unreadable GitHub is COULD-NOT-JUDGE. See docs/wip-limit.md.

`--seed` adds the given pull requests to the station's ledger entry (union, nothing is
removed, no other station is touched). It records only what the caller supplies.

REF is `owner/name#N`; a bare `#N` inherits the previous entry's repository.
Ledger shape: {"<station>": ["owner/name#N", ...], ...}

Exit codes: 0 nothing stalled, 1 something stalled, 2 something could not be judged
(and nothing was stalled).
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORKSPACE = HERE.parent.parent
CONFIG_NAME = "wip-limit.json"
# The config is found from this file's own location, never from the caller's directory, so the
# check works from a station root (<root>/.claude/scripts) and from a plugin directory
# (<plugin>/scripts beside <plugin>/config), where there is no `.claude/` tree at all.
CONFIG_CANDIDATES = (
    WORKSPACE / ".claude" / "config" / CONFIG_NAME,
    HERE.parent / "config" / CONFIG_NAME,
    HERE / CONFIG_NAME,
)


def default_config() -> Path:
    """The first existing candidate. Raises Unreadable naming every place looked at."""
    for candidate in CONFIG_CANDIDATES:
        if candidate.exists():
            return candidate
    raise Unreadable(
        f"config {CONFIG_NAME} not found; looked in: " + ", ".join(str(c) for c in CONFIG_CANDIDATES)
    )

REF_RE = re.compile(r"^(?:(?P<repo>[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+))?#(?P<number>[0-9]+)$")
VERDICT_RE = re.compile(r"^###[ \t]+\S.*?[ \t]+—[ \t]+(?P<word>[A-Z][A-Z-]*)\b", re.MULTILINE)
HEADER_LINES = 60
ROLE_RE = re.compile(r"""^[ \t]*ROLE[ \t]*=[ \t]*["']([^"'\n]+)["']""", re.MULTILINE)
HEADER_RE = re.compile(r"\bYou are\s+\**\s*([^\W\d_]+)")
GH_FIELDS = "state,mergeStateStatus,comments,reviews,commits"
UNSETTLED = ("", "UNKNOWN")  # the platform computes mergeStateStatus lazily
SETTLE_ATTEMPTS = 3

STALLED = "STALLED"
OK = "OK"
COULD_NOT_JUDGE = "COULD-NOT-JUDGE"


class Unreadable(Exception):
    """An input this check cannot read. Always surfaces as COULD-NOT-JUDGE."""


@dataclass(frozen=True)
class Ref:
    repo: str
    number: int

    def __str__(self) -> str:
        return f"{self.repo}#{self.number}"


@dataclass(frozen=True)
class Facts:
    state: str
    merge_state: str
    commit_dates: list = field(default_factory=list)
    verdicts: list = field(default_factory=list)  # [(when, word)]


@dataclass(frozen=True)
class Outcome:
    status: str
    reason: str


def normalize_station(name: str) -> str:
    """Lower-case, accent-free station key, so `Th\u00e9mis` and `themis` are one station."""
    decomposed = unicodedata.normalize("NFKD", str(name))
    return "".join(c for c in decomposed if not unicodedata.combining(c)).strip().lower()


def header_name(path: Path) -> str:
    """The first `You are <Name>` header of a CLAUDE.md, or "" when it carries none."""
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()[:HEADER_LINES]
    except OSError as exc:
        raise Unreadable(f"{path} unreadable: {exc}") from exc
    for line in lines:
        for match in HEADER_RE.finditer(line):
            if match.group(1)[0].isupper():
                return normalize_station(match.group(1))
    return ""


def vp_identities(root: Path) -> tuple:
    """The VantagePeers identities configured for a root: ([(source, name)], [unreadable])."""
    found: list = []
    unreadable: list = []

    mcp = root / ".mcp.json"
    if mcp.exists():
        try:
            server = (json.loads(mcp.read_text()).get("mcpServers") or {}).get("vantage-peers") or {}
            helper = server.get("headersHelper")
            if helper:
                helper_path = Path(helper) if os.path.isabs(helper) else root / helper
                try:
                    match = ROLE_RE.search(helper_path.read_text(errors="replace"))
                except OSError as exc:
                    unreadable.append(f"{helper_path} unreadable: {exc}")
                else:
                    if match:
                        found.append(("mcp-headersHelper", normalize_station(match.group(1))))
        except (OSError, ValueError, AttributeError) as exc:
            unreadable.append(f"{mcp} unreadable: {exc}")

    for name in ("settings.json", "settings.local.json"):
        settings = root / ".claude" / name
        if not settings.exists():
            continue
        try:
            value = (json.loads(settings.read_text()).get("env") or {}).get("VP_ORCHESTRATOR")
        except (OSError, ValueError, AttributeError) as exc:
            unreadable.append(f"{settings} unreadable: {exc}")
            continue
        if isinstance(value, str) and value.strip():
            found.append(("settings-env", normalize_station(value)))
    return found, unreadable


def derive_station(root: Path) -> tuple:
    """Name the station owning a session root. Returns (name, source label)."""
    root = Path(root)
    claude_md = root / "CLAUDE.md"
    header = header_name(claude_md)
    identities, unreadable = vp_identities(root)

    named = ([("header", header)] if header else []) + identities
    names = {name for _, name in named}
    if len(names) > 1:
        detail = ", ".join(f"{source}={name}" for source, name in named)
        raise Unreadable(f"identity sources for {root} disagree: {detail}")
    if not names:
        why = f"; also {'; '.join(unreadable)}" if unreadable else ""
        raise Unreadable(
            f"{claude_md} has no `You are <Name>` header in its first {HEADER_LINES} lines and "
            f"no VantagePeers identity in the root's MCP configuration, so it names no station{why}"
        )
    labels = []
    for source, _ in named:
        if source not in labels:
            labels.append(source)
    return names.pop(), "+".join(labels)


def parse_time(text) -> datetime:
    if not isinstance(text, str) or not text:
        raise Unreadable(f"timestamp absent or not text: {text!r}")
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError as exc:
        raise Unreadable(f"timestamp unreadable: {text!r}") from exc
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def parse_refs(text: str) -> list:
    """Parse `owner/name#N,#M,...`; a bare `#N` inherits the previous repository."""
    refs: list = []
    repo = None
    for token in (part.strip() for part in text.split(",")):
        if not token:
            continue
        match = REF_RE.match(token)
        if not match:
            raise Unreadable(f"pull request reference unreadable: {token!r}")
        repo = match.group("repo") or repo
        if repo is None:
            raise Unreadable(f"pull request reference names no repository: {token!r}")
        refs.append(Ref(repo=repo, number=int(match.group("number"))))
    if not refs:
        raise Unreadable("no pull request reference supplied")
    return refs


def load_config(path: Path) -> dict:
    try:
        config = json.loads(path.read_text())
    except (OSError, ValueError) as exc:
        raise Unreadable(f"config {path} unreadable: {exc}") from exc
    hours = config.get("thresholdHours") if isinstance(config, dict) else None
    if isinstance(hours, bool) or not isinstance(hours, (int, float)) or hours <= 0:
        raise Unreadable(f"config {path} carries no positive thresholdHours")
    if not isinstance(config.get("prsFile"), str) or not config["prsFile"]:
        raise Unreadable(f"config {path} carries no prsFile")
    return config


def load_ledger(path: Path) -> dict:
    try:
        ledger = json.loads(path.read_text())
    except (OSError, ValueError) as exc:
        raise Unreadable(f"ledger {path} unreadable: {exc}") from exc
    if not isinstance(ledger, dict):
        raise Unreadable(f"ledger {path} is not a station -> pull requests mapping")
    result: dict = {}
    for station, entries in ledger.items():
        if not isinstance(entries, list) or not all(isinstance(e, str) for e in entries):
            raise Unreadable(f"ledger {path}: station {station!r} is not a list of references")
        key = normalize_station(station)
        result.setdefault(key, [])
        result[key] += parse_refs(",".join(entries)) if entries else []
    return result


def judge_pr(facts: Facts, now: datetime, threshold: timedelta) -> Outcome:
    """Pure verdict for one pull request."""
    if facts.state != "OPEN":
        return Outcome(OK, f"not open ({facts.state})")
    if not facts.commit_dates:
        raise Unreadable("pull request carries no commit to date it from")
    if facts.merge_state in UNSETTLED:
        raise Unreadable(
            f"merge state is {facts.merge_state or 'absent'}: the platform has not computed it, "
            "so DIRTY cannot be ruled out"
        )

    last_commit = max(facts.commit_dates)
    hours = threshold.total_seconds() / 3600
    reasons: list = []

    if facts.merge_state == "DIRTY" and now - last_commit > threshold:
        age = (now - last_commit).total_seconds() / 3600
        reasons.append(f"DIRTY, head untouched for {age:.1f}h (threshold {hours:g}h): rebase")

    if facts.verdicts:
        when, word = max(facts.verdicts, key=lambda item: item[0])
        if word == "REVISE" and now - when > threshold and not any(c > when for c in facts.commit_dates):
            age = (now - when).total_seconds() / 3600
            reasons.append(
                f"REVISE unanswered for {age:.1f}h, no commit since (threshold {hours:g}h): answer it"
            )

    if reasons:
        return Outcome(STALLED, "; ".join(reasons))
    return Outcome(OK, f"no stall condition at threshold {hours:g}h")


def _gh(args: list) -> str:
    try:
        done = subprocess.run(["gh", *args], capture_output=True, text=True, check=False, timeout=60)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise Unreadable(f"could not run `gh {' '.join(args)}`: {exc}") from exc
    if done.returncode != 0:
        raise Unreadable(
            f"could not read `gh {' '.join(args)}` (exit {done.returncode}): "
            f"{(done.stderr or done.stdout).strip()}"
        )
    return done.stdout


def read_facts(ref: Ref) -> Facts:
    raw = _gh(["pr", "view", str(ref.number), "-R", ref.repo, "--json", GH_FIELDS])
    try:
        data = json.loads(raw)
        verdicts = []
        for item in list(data.get("comments") or []) + list(data.get("reviews") or []):
            match = VERDICT_RE.search(item.get("body") or "")
            if match:
                when = parse_time(item.get("createdAt") or item.get("submittedAt"))
                verdicts.append((when, match.group("word")))
        return Facts(
            state=str(data["state"]),
            merge_state=str(data.get("mergeStateStatus") or ""),
            commit_dates=[parse_time(c.get("committedDate")) for c in data.get("commits") or []],
            verdicts=verdicts,
        )
    except (ValueError, KeyError, TypeError, AttributeError) as exc:
        raise Unreadable(f"`gh pr view` answer for {ref} unreadable: {exc}") from exc


def read_settled_facts(ref: Ref) -> Facts:
    """Read the facts, re-reading while the platform has not computed the merge state.

    A cold read answers UNKNOWN; reading it as "not dirty" passes a conflicted pull
    request. After SETTLE_ATTEMPTS the UNKNOWN is returned and judge_pr refuses it.
    """
    pause = float(os.environ.get("WIP_LIMIT_RETRY_SLEEP", "3"))
    facts = read_facts(ref)
    for _ in range(SETTLE_ATTEMPTS - 1):
        if facts.state != "OPEN" or facts.merge_state not in UNSETTLED:
            break
        time.sleep(pause)
        facts = read_facts(ref)
    return facts


def parse_args(argv: list) -> dict:
    opts = {
        "station": None, "report": False, "prs": None, "prs_file": None, "config": None,
        "now": None, "root": None, "seed": None, "none": False, "print_station": False,
        "source": False, "from_github": False,
    }
    rest = list(argv[1:])
    value_flags = {
        "--prs": "prs", "--prs-file": "prs_file", "--config": "config", "--now": "now",
        "--root": "root", "--seed": "seed",
    }
    while rest:
        token = rest.pop(0)
        if token == "--report":
            opts["report"] = True
        elif token == "--none":
            opts["none"] = True
        elif token == "--print-station":
            opts["print_station"] = True
        elif token == "--source":
            opts["source"] = True
        elif token == "--from-github":
            opts["from_github"] = True
        elif token in value_flags:
            if not rest:
                raise Unreadable(f"`{token}` carries no value")
            opts[value_flags[token]] = rest.pop(0)
        elif token.startswith("-"):
            raise Unreadable(f"argument unreadable: {token}")
        elif opts["station"] is None:
            opts["station"] = normalize_station(token)
        else:
            raise Unreadable("expected exactly one station")
    if opts["seed"] is not None:
        opts["seed"] = normalize_station(opts["seed"])
        if opts["station"] or opts["report"] or opts["root"] or opts["print_station"]:
            raise Unreadable("--seed takes no station, --report, --root or --print-station")
        if bool(opts["prs"]) == opts["none"]:
            raise Unreadable(
                "--seed needs exactly one of --prs REF[,REF...] or --none "
                "(a station registered as holding no pull request)"
            )
        return opts
    if opts["print_station"]:
        if not opts["root"] or opts["station"] or opts["report"]:
            raise Unreadable("--print-station takes --root DIR and nothing else")
        return opts
    modes = [opts["report"], opts["station"] is not None, opts["root"] is not None]
    if sum(modes) != 1:
        raise Unreadable("give exactly one of a station, --root DIR or --report")
    if opts["from_github"] and opts["prs"]:
        raise Unreadable("--from-github derives the pull requests itself; it takes no --prs")
    return opts


def github_settings(config: dict) -> tuple:
    """(owners, search limit, non-station prefixes) from the config. Raises Unreadable."""
    owners = config.get("githubOwners")
    if not isinstance(owners, list) or not owners or not all(isinstance(o, str) and o for o in owners):
        raise Unreadable("config carries no githubOwners (a non-empty list of GitHub owners to read)")
    limit = config.get("githubSearchLimit")
    if isinstance(limit, bool) or not isinstance(limit, int) or limit <= 0:
        raise Unreadable("config carries no positive githubSearchLimit")
    prefixes = config.get("nonStationPrefixes")
    if not isinstance(prefixes, list) or not all(isinstance(p, str) for p in prefixes):
        raise Unreadable("config carries no nonStationPrefixes list (branch prefixes that name no station)")
    return owners, limit, {normalize_station(p) for p in prefixes}


LIST_LIMIT = 500


def read_open_prs(config: dict) -> list:
    """Every open pull request of the configured owners, as [(Ref, head branch)].

    The search names the repositories and numbers; the branch comes from a per-repository
    list, because the search cannot return it. A result that fills its limit may be
    truncated, and a truncated list proves nothing about what it left out: refused.
    """
    owners, limit, _ = github_settings(config)
    args = ["search", "prs"]
    for owner in owners:
        args += ["--owner", owner]
    args += ["--state", "open", "--limit", str(limit), "--json", "repository,number"]
    try:
        rows = json.loads(_gh(args))
        if not isinstance(rows, list):
            raise ValueError("not a list")
        found: dict = {}
        for row in rows:
            found.setdefault(row["repository"]["nameWithOwner"], set()).add(int(row["number"]))
    except (ValueError, KeyError, TypeError) as exc:
        raise Unreadable(f"`gh search prs` answer unreadable: {exc}") from exc
    if len(rows) >= limit:
        raise Unreadable(
            f"`gh search prs` returned {len(rows)} results, its limit: the list may be truncated, "
            "so a station's pull request could be missing from it"
        )

    result: list = []
    for repo in sorted(found):
        try:
            listing = json.loads(
                _gh(["pr", "list", "-R", repo, "--state", "open", "--limit", str(LIST_LIMIT),
                     "--json", "number,headRefName"])
            )
            branches = {int(item["number"]): str(item.get("headRefName") or "") for item in listing}
        except (ValueError, KeyError, TypeError) as exc:
            raise Unreadable(f"`gh pr list` answer for {repo} unreadable: {exc}") from exc
        if len(listing) >= LIST_LIMIT:
            raise Unreadable(f"`gh pr list` for {repo} returned {len(listing)} results, its limit: may be truncated")
        for number in sorted(found[repo]):
            if number in branches:  # absent = no longer open between the two reads
                result.append((Ref(repo=repo, number=number), branches[number]))
    return result


def owner_maps(config: dict) -> tuple:
    """(repoOwners, prOwners) from the config, both optional. Raises Unreadable on a bad shape.

    repoOwners: {"<repo name>": "<station>"}, the fallback for a branch with no station prefix.
    prOwners:   {"<repo name>#<number>": "<station>"}, exact, wins over everything.
    Both are operator-supplied data; no repository or station is named in this script.
    """
    result = []
    for key in ("repoOwners", "prOwners"):
        raw = config.get(key, {})
        if not isinstance(raw, dict) or not all(
            isinstance(k, str) and k and isinstance(v, str) and v for k, v in raw.items()
        ):
            raise Unreadable(f"config {key} is not a mapping of non-empty text to a station name")
        result.append({k: normalize_station(v) for k, v in raw.items()})
    return result[0], result[1]


def attribute(ref: Ref, branch: str, config: dict) -> str:
    """The station a pull request belongs to, or "" when nobody can be named.

    Order: prOwners (exact `repo#N`), then a branch prefix naming a station (any prefix that
    is not in nonStationPrefixes), then repoOwners, then "" (UNATTRIBUTED).
    """
    _, _, non_station = github_settings(config)
    repo_owners, pr_owners = owner_maps(config)
    name = ref.repo.split("/", 1)[-1]
    if f"{name}#{ref.number}" in pr_owners:
        return pr_owners[f"{name}#{ref.number}"]
    prefix = normalize_station(branch.split("/", 1)[0]) if "/" in branch else ""
    if prefix and prefix not in non_station:
        return prefix
    return repo_owners.get(name, "")


def collect_from_github(opts: dict, config: dict) -> tuple:
    """Return ([(station, Ref)], source note, [report lines]). Raises Unreadable.

    With a station: that station's pull requests (attributed to it by `attribute`, or listed
    under it in the optional ledger). Without one (--report): every attributed pull request.
    One that no station can be named for is UNATTRIBUTED: named in the report, counted
    against nobody. Unreadable GitHub is the only reason to refuse; an absent ledger is not one.
    """
    station = opts["station"]
    owner_maps(config)  # a malformed map is refused before GitHub is read, whatever it returns
    ledger_path = Path(opts["prs_file"]) if opts["prs_file"] else WORKSPACE / config["prsFile"]
    ledger: dict = load_ledger(ledger_path) if ledger_path.exists() else {}
    ledger_owner = {ref: name for name, refs in ledger.items() for ref in refs}

    attributed: list = []
    lines: list = []
    open_prs = read_open_prs(config)
    for ref, branch in open_prs:
        owner = ledger_owner.get(ref) or attribute(ref, branch, config)
        if owner:
            attributed.append((owner, ref))
        else:
            lines.append(
                f"UNATTRIBUTED    {ref} (branch {branch or '?'}) — no prOwners entry, no station "
                "prefix, no repoOwners entry, no ledger entry; counts against no station"
            )
    unattributed = len(lines)
    listed = {ref for _, ref in attributed}
    for name, refs in ledger.items():  # ledger entries are read whether open or not
        attributed += [(name, ref) for ref in refs if ref not in listed]

    if station:
        pairs = [(owner, ref) for owner, ref in attributed if owner == station]
        summary = (
            f"read {len(open_prs)} open pull request(s): {len(pairs)} attributed to {station}, "
            f"{len(attributed) - len(pairs)} to other stations, {unattributed} unattributed"
        )
    else:
        pairs = sorted(attributed, key=lambda item: (item[0], str(item[1])))
        summary = (
            f"read {len(open_prs)} open pull request(s): {len(pairs)} attributed to "
            f"{len({o for o, _ in pairs})} station(s), {unattributed} unattributed"
        )
    lines.append(summary)
    source = "github" + (f" + ledger {ledger_path}" if ledger_path.exists() else " (no ledger)")
    return pairs, source, lines




def collect(opts: dict, config: dict) -> tuple:
    """Return ([(station, Ref)], source note). Raises Unreadable."""
    pairs: list = []
    notes: list = []
    ledger_path = Path(opts["prs_file"]) if opts["prs_file"] else WORKSPACE / config["prsFile"]
    ledger_needed = bool(opts["prs_file"]) or not opts["prs"]

    if opts["prs"]:
        label = opts["station"] or "unattributed"
        pairs += [(label, ref) for ref in parse_refs(opts["prs"])]
        notes.append("--prs")
    if ledger_needed:
        ledger = load_ledger(ledger_path)
        notes.append(f"ledger {ledger_path} ({len(ledger)} stations)")
        if opts["report"]:
            pairs += [(station, ref) for station, refs in ledger.items() for ref in refs]
        elif not opts["prs"]:
            if opts["station"] not in ledger:
                raise Unreadable(
                    f"station has no ledger entry (station {opts['station']}; ledger {ledger_path} "
                    f"carries: {', '.join(sorted(ledger)) or 'no station'}); an absent entry is not "
                    "an empty list. Seed it with `--seed <station> --prs ...` or `--seed <station> --none`"
                )
            pairs += [(opts["station"], ref) for ref in ledger[opts["station"]]]
    return pairs, " + ".join(notes)


def seed(opts: dict, config: dict) -> int:
    """Add the caller's pull requests to one station's ledger entry. Writes only on success."""
    path = Path(opts["prs_file"]) if opts["prs_file"] else WORKSPACE / config["prsFile"]
    ledger = load_ledger(path) if path.exists() else {}
    added = parse_refs(opts["prs"]) if opts["prs"] else []
    entry = list(ledger.get(opts["seed"], []))
    for ref in added:
        if ref not in entry:
            entry.append(ref)
    ledger[opts["seed"]] = entry
    payload = {k: [str(r) for r in v] for k, v in ledger.items()}
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    try:
        tmp.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
        os.replace(tmp, path)
    except OSError as exc:
        raise Unreadable(f"ledger {path} not writable: {exc}") from exc
    print(f"seeded {opts['seed']}: {len(entry)} pull request(s) in {path} (added {len(added)})")
    return 0


def main(argv: list) -> int:
    try:
        opts = parse_args(argv)
        config = load_config(Path(opts["config"]) if opts["config"] else default_config())
        if opts["print_station"]:
            name, source = derive_station(Path(opts["root"]))
            print(f"{name} {source}" if opts["source"] else name)
            return 0
        if opts["seed"] is not None:
            return seed(opts, config)
        if opts["root"]:
            opts["station"], _ = derive_station(Path(opts["root"]))
        now = parse_time(opts["now"]) if opts["now"] else datetime.now(timezone.utc)
        report_lines: list = []
        if opts["from_github"]:
            pairs, source, report_lines = collect_from_github(opts, config)
        else:
            pairs, source = collect(opts, config)
    except Unreadable as exc:
        print(f"{COULD_NOT_JUDGE}  input — {exc}")
        print(
            "usage: wip_limit_check.py <station>|--root DIR|--report [--prs REF[,REF...]] "
            "[--prs-file LEDGER] | --print-station --root DIR | --seed <station> (--prs ...|--none)"
        )
        return 2

    threshold = timedelta(hours=float(config["thresholdHours"]))
    counts = {STALLED: 0, OK: 0, COULD_NOT_JUDGE: 0}

    for line in report_lines:
        print(line)
    if not pairs:
        print(f"{opts['station']}: no pull request recorded for this station (source: {source})")
    for station, ref in pairs:
        try:
            outcome = judge_pr(read_settled_facts(ref), now, threshold)
        except Unreadable as exc:
            outcome = Outcome(COULD_NOT_JUDGE, str(exc))
        counts[outcome.status] += 1
        print(f"{outcome.status:<15} {ref} ({station}) — {outcome.reason}")

    print(
        f"read: {len(pairs)}  stalled: {counts[STALLED]}  ok: {counts[OK]}  "
        f"could-not-judge: {counts[COULD_NOT_JUDGE]}  threshold: {config['thresholdHours']:g}h  "
        f"source: {source}"
    )
    if counts[STALLED]:
        return 1
    if counts[COULD_NOT_JUDGE]:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
