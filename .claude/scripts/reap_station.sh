#!/usr/bin/env bash
# reap_station.sh — the station-level reap, so nobody writes the procedure by hand again.
#
# WHY THIS EXISTS. The procedure was dictated in prose, per station, per evening, and
# every retelling drifted: one telling asked for the HOST disk reading as the station's
# result, which is a figure about a shared machine attributed to one station's work; one
# telling did not say that a live worktree keeps its dependencies, which invites deleting
# what a review reinstalls minutes later. A procedure retyped is a procedure that varies.
# This script is the procedure, so the instruction becomes its NAME.
#
# WHAT IT DOES NOT DO. It never deletes anything itself. Every removal is delegated to
# reap-worktree.sh, which owns the perimeter refusal and the one-path-one-action form.
# This script CLASSIFIES and MEASURES; that division is deliberate, because a tool that
# both decides and destroys has no moment at which a human can read the decision.
#
# DRY RUN BY DEFAULT. Without --apply it prints the plan and removes nothing.
#
# TWO ROOTS. A station may hold its scripts in one repository (a configuration tree,
# often with no remote) and its work in others (product trees with a remote and no
# reaper). So the reaper is resolved from THIS SCRIPT'S OWN LOCATION, never from the
# repository being reaped, and the repository being reaped is named explicitly — or
# taken from the current directory. A repository with no GitHub remote cannot be asked
# about its pull requests: the items that depend on that answer are reported
# COULD-NOT-JUDGE and kept, and the rest of the pass still runs.
#
# WHO READS A PATH. A worktree is listed CANDIDATE only after consumers_of_path.py
# (beside this script) found no reader outside it: a settings file naming it, a link
# resolving into it, a file naming it literally. A reader makes it KEEP, with the reader
# named. Content proof (nothing unpushed) answers what would be LOST; this answers who
# would BREAK. See a-deletion-proves-who-reads-the-path.md.
#
# Usage:  reap_station.sh [--apply] [--repo <path>] [--slug <owner>/<name>]
#                         [--consumer-root <dir>]...
#   --repo  the checkout to reap (default: the checkout containing the current directory)
#   --slug  the GitHub repository, when it cannot be derived from the remote
#   --consumer-root  an extra directory scanned for readers of a worktree, repeatable.
#           Always scanned: the target checkout and the directory holding each worktree.
#
# Exit states, three and never two:
#   0  the pass completed and every candidate was handled
#   1  something is KEPT that needs a human decision, named in the report — including
#      items marked COULD-NOT-JUDGE because the pull-request question had no answer
#   2  could-not-judge: a measurement the whole pass rests on failed, so no conclusion
#      is offered

set -u -o pipefail

APPLY=0
REPO_PATH=""
SLUG=""
EXTRA_ROOTS=()
while [ $# -gt 0 ]; do
  case $1 in
    --apply) APPLY=1 ;;
    --repo)
      shift; REPO_PATH=${1:-}
      [ -n "$REPO_PATH" ] || { echo "REFUSED: --repo needs a path" >&2; exit 2; } ;;
    --slug)
      shift; SLUG=${1:-}
      [ -n "$SLUG" ] || { echo "REFUSED: --slug needs <owner>/<name>" >&2; exit 2; } ;;
    --consumer-root)
      shift
      [ -n "${1:-}" ] || { echo "REFUSED: --consumer-root needs a directory" >&2; exit 2; }
      EXTRA_ROOTS+=("$1") ;;
    *) echo "REFUSED: unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done

cnj() { echo "COULD-NOT-JUDGE: $*" >&2; exit 2; }

# The reaper sits beside this script. Looking for it in the target repository is what
# failed on a two-root station: the product tree holds no reaper, by design.
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd) \
  || cnj "cannot resolve this script's own directory — the reaper cannot be located"
REAPER="$SCRIPT_DIR/reap-worktree.sh"
[ -x "$REAPER" ] || cnj "reap-worktree.sh not found or not executable at $REAPER — this script never deletes on its own. Pull it from the catalogue: mcp__vantage-registry__get_runbook name=reap-station (never copy it from another station or a clone)"
# The consumer scanner sits beside this script for the same reason. Without it no worktree
# can be proven unread, so the pass does not run and does not fall back to listing candidates.
CONSUMERS="$SCRIPT_DIR/consumers_of_path.py"
[ -f "$CONSUMERS" ] || cnj "consumers_of_path.py not found at $CONSUMERS — without it no worktree can be proven unread, so none is proposed. Pull it from the catalogue: mcp__vantage-registry__get_runbook name=reap-station"
command -v python3 >/dev/null 2>&1 || cnj "python3 not found — consumers_of_path.py cannot run, so no worktree can be proven unread"

# The perimeter is the target checkout, derived by git — never a typed path taken as is.
OWN_ROOT=$(git -C "${REPO_PATH:-.}" rev-parse --show-toplevel 2>/dev/null) \
  || cnj "${REPO_PATH:-the current directory} is not inside a git checkout — the perimeter cannot be derived, and a typed one is how a reap reaches another station"

# The GitHub slug is derived only from a GitHub remote. Any other remote, or none, leaves
# it empty, and the pull-request questions become COULD-NOT-JUDGE instead of an abort.
NO_SLUG_REASON=""
if [ -z "$SLUG" ]; then
  origin_url=$(git -C "$OWN_ROOT" config --get remote.origin.url 2>/dev/null || true)
  SLUG=$(printf '%s\n' "$origin_url" \
    | sed -nE 's#^(git@github\.com:|ssh://git@github\.com/|https://([^@/]+@)?github\.com/)([^/]+/[^/]+)$#\3#p' \
    | sed 's#\.git$##')
  if [ -z "$SLUG" ]; then
    if [ -z "$origin_url" ]; then
      NO_SLUG_REASON="no remote 'origin'"
    else
      NO_SLUG_REASON="remote 'origin' is not a GitHub repository ($origin_url)"
    fi
    NO_SLUG_REASON="$NO_SLUG_REASON; pull requests cannot be read (pass --slug <owner>/<name> if one exists)"
  fi
fi

# FETCH BEFORE CLASSIFYING. Every remote-branch and upstream question below reads the LOCAL
# remote-tracking refs, while the branch list comes from the live remote. Without a fetch, a
# branch a peer pushed since the last fetch has no local ref, and a count taken against a
# missing ref prints 0 -- the same output as "nothing to lose". A failed fetch makes the
# whole repository COULD-NOT-JUDGE: classifying on stale refs is how unmerged work is
# proposed for deletion. A repository with no remote has nothing to fetch and nothing to
# delete remotely; its remote-branch half is already COULD-NOT-JUDGE below.
if [ -n "$(git -C "$OWN_ROOT" config --get remote.origin.url 2>/dev/null)" ]; then
  GIT_TERMINAL_PROMPT=0 git -C "$OWN_ROOT" fetch --prune origin >/dev/null 2>&1 \
    || cnj "git fetch --prune origin failed in $OWN_ROOT -- the remote-tracking refs cannot be trusted, so no branch or worktree is classified"
fi

# merged_reading <branch> <tip>: is this branch's CURRENT TIP the head of a merged pull request?
# A merged PR for the NAME proves nothing about commits pushed to the same name afterwards.
# Sets MERGED_KIND (landed = tip is a merged PR's head | moved = merged PRs exist, tip is none
# of their heads | none) and MERGED_PR. Returns 1 when the platform read failed: an unreadable
# list is never "no pull request".
merged_reading() {
  local b=$1 tip=$2 out n s first=""
  MERGED_KIND=none; MERGED_PR=""
  out=$(gh pr list -R "$SLUG" --state merged --head "$b" --limit 100 --json number,headRefOid \
        --jq '.[] | "\(.number) \(.headRefOid)"' 2>/dev/null) || return 1
  while read -r n s; do
    [ -n "$n" ] || continue
    [ -n "$first" ] || first=$n
    if [ "$s" = "$tip" ]; then MERGED_KIND=landed; MERGED_PR=$n; return 0; fi
  done <<EOF
$out
EOF
  if [ -n "$first" ]; then MERGED_KIND=moved; MERGED_PR=$first; fi
  return 0
}

own_size() { du -sh "$OWN_ROOT" 2>/dev/null | cut -f1; }

echo "=== PERIMETER (derived, never typed)"
echo "own root : $OWN_ROOT"
echo "reaper   : $REAPER"
echo "readers  : $CONSUMERS"
echo "repository: ${SLUG:-COULD-NOT-JUDGE — $NO_SLUG_REASON}"
echo "mode     : $([ "$APPLY" = 1 ] && echo APPLY || echo 'DRY RUN — nothing will be removed')"
echo

# ---------------------------------------------------------------------------
# THE MEASUREMENT. `du -sh` on the own root is the station's result.
# `df -h /` is HOST context and is labelled as such: the volume is shared by every
# station working at once, so its delta answers a question about the machine and not
# about this pass. Reporting it as the result is a true number carrying a false meaning.
# ---------------------------------------------------------------------------
BEFORE=$(own_size) || cnj "du on the own root failed — without a before-figure there is no delta to derive"
HOST_BEFORE=$(df -h / | tail -1)
echo "=== BEFORE"
echo "own root  : $BEFORE        <- THIS is the station's figure"
echo "host (ctx): $HOST_BEFORE   <- shared machine, NOT this pass's result"
echo

# ---------------------------------------------------------------------------
# CLASSIFY WORKTREES. Two reads per worktree, and a third question the earlier
# prose telling left out: does it back an OPEN pull request?
# ---------------------------------------------------------------------------
echo "=== WORKTREES"
KEPT=0
CNJ=0
CANDIDATES=()
OPEN_HEADS=""
if [ -n "$SLUG" ]; then
  # gh returns only the first 30 results unless told otherwise; a truncated open list hides
  # open pull requests, and a branch heading one would be proposed for deletion (closing it).
  OPEN_LIMIT=1000
  OPEN_HEADS=$(gh pr list -R "$SLUG" --state open --limit "$OPEN_LIMIT" --json headRefName --jq '.[].headRefName' 2>/dev/null) \
    || cnj "could not read open pull requests for $SLUG — an unreadable list and an empty list are different facts, and only one of them permits a deletion"
  # A list that fills the limit may be truncated again: refuse rather than assume it is complete.
  if [ "$(printf '%s\n' "$OPEN_HEADS" | grep -c .)" -ge "$OPEN_LIMIT" ]; then
    cnj "$SLUG has at least $OPEN_LIMIT open pull requests — the list may be truncated, so open heads cannot be ruled out"
  fi
fi

while IFS= read -r rec; do
  [ -n "$rec" ] || continue
  lock_flag=${rec%% *}
  wt=${rec#* }
  [ -n "$wt" ] || continue
  [ "$wt" = "$OWN_ROOT" ] && { echo "KEEP    $wt — the station's own checkout"; KEPT=$((KEPT+1)); continue; }
  # `git worktree lock` is the owner's explicit "live work" marker. A locked tree on a
  # pushed branch with no pull request yet passes every check below, and the reaper falls
  # back to rm -rf when git refuses to remove a locked tree, so the lock is read here.
  if [ "$lock_flag" = L ]; then
    echo "KEEP    $wt — locked by its owner (git worktree lock): live work"
    KEPT=$((KEPT+1)); continue
  fi
  branch=$(git -C "$wt" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "<detached>")
  # No upstream is "cannot prove pushed", never "0 unpushed". `git log @{u}..HEAD` fails
  # without an upstream, and a failed read piped into `wc -l` prints 0 — the same output
  # as a fully pushed branch. A local-only branch's commits exist nowhere else.
  if ! git -C "$wt" rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
    echo "KEEP    $wt — no upstream on $branch; its commits cannot be proven pushed"
    KEPT=$((KEPT+1)); continue
  fi
  if ! unpushed_log=$(git -C "$wt" log --oneline '@{u}..HEAD' 2>/dev/null); then
    echo "KEEP    $wt — could not read unpushed commits on $branch; nothing proven, nothing proposed"
    KEPT=$((KEPT+1)); continue
  fi
  unpushed=$(printf '%s' "$unpushed_log" | grep -c . || true)
  if [ "${unpushed:-0}" -gt 0 ]; then
    echo "KEEP    $wt — $unpushed unpushed commit(s) on $branch; content exists nowhere else"
    KEPT=$((KEPT+1)); continue
  fi
  if [ -z "$SLUG" ]; then
    echo "COULD-NOT-JUDGE $wt — branch $branch; $NO_SLUG_REASON. Kept."
    CNJ=$((CNJ+1)); continue
  fi
  if printf '%s\n' "$OPEN_HEADS" | grep -qxF "$branch"; then
    echo "KEEP    $wt — backs OPEN pull request on $branch; its dependencies stay installed too,"
    echo "        because a review that returns would reinstall them within minutes"
    KEPT=$((KEPT+1)); continue
  fi
  # The same reading as a remote branch: judged on the upstream TIP, never on the name. A
  # worktree whose branch received commits after its PR merged passed "no unpushed commits"
  # only because the remote copy existed -- and the branch half of this pass used to delete it.
  if [ "$branch" != "<detached>" ]; then
    wt_tip=$(git -C "$wt" rev-parse '@{u}' 2>/dev/null) || wt_tip=""
    if [ -z "$wt_tip" ]; then
      echo "COULD-NOT-JUDGE $wt — cannot read the upstream tip of $branch. Kept."
      CNJ=$((CNJ+1)); continue
    fi
    if ! merged_reading "$branch" "$wt_tip"; then
      echo "COULD-NOT-JUDGE $wt — the merged pull request read for $branch failed; an unreadable list is not 'no pull request'. Kept."
      CNJ=$((CNJ+1)); continue
    fi
    if [ "$MERGED_KIND" = moved ]; then
      echo "KEEP    $wt — commits pushed after PR #$MERGED_PR merged on $branch"
      KEPT=$((KEPT+1)); continue
    fi
  fi
  # Who reads this path? A tree that every station hook runs from has no unpushed commit
  # and no open pull request, and is still not garbage. Scan roots: the target checkout,
  # the directory holding the worktree, and any --consumer-root.
  scan_roots=("$OWN_ROOT" "$(dirname -- "$wt")")
  [ "${#EXTRA_ROOTS[@]}" -gt 0 ] && scan_roots+=("${EXTRA_ROOTS[@]}")
  consumers_out=$(python3 "$CONSUMERS" "$wt" "${scan_roots[@]}" </dev/null 2>&1)
  consumers_rc=$?
  case $consumers_rc in
    0) ;;
    1)
      first_reader=$(printf '%s\n' "$consumers_out" | sed -nE 's/^(LINK|CONFIG|TEXT) +//p' | head -1)
      reader_count=$(printf '%s\n' "$consumers_out" | sed -n 's/^consumers: \([0-9]*\).*/\1/p' | head -1)
      echo "KEEP    $wt — read by $first_reader (${reader_count:-?} reader(s) in all); repoint them, then re-run"
      KEPT=$((KEPT+1)); continue ;;
    *)
      echo "COULD-NOT-JUDGE $wt — who reads it could not be established ($(printf '%s\n' "$consumers_out" | head -1)). Kept."
      CNJ=$((CNJ+1)); continue ;;
  esac
  echo "CANDIDATE $wt — branch $branch, no unpushed commits, no open pull request, no reader"
  CANDIDATES+=("$wt")
# The porcelain field is taken WHOLE, never split on whitespace. A checkout path may
# contain a space — this station's does — and `awk '{print $2}'` truncated it at the
# space, so the station's own root stopped matching OWN_ROOT and was classified as a
# deletion CANDIDATE. The downstream reaper refuses the own checkout and would have
# caught it, but a classifier that proposes deleting the caller's own tree is wrong
# where it stands: the safety belonged to the decision, not only to the last gate.
# Each porcelain block becomes one record "<L|U> <path>": L when the block carries a
# `locked` line (with or without a reason), U otherwise. The path is still taken whole.
done < <(git -C "$OWN_ROOT" worktree list --porcelain 2>/dev/null \
  | awk '/^worktree /{ if (p != "") print f " " p; p = substr($0, 10); f = "U"; next }
         /^locked( |$)/{ f = "L" }
         END { if (p != "") print f " " p }')
echo

# ---------------------------------------------------------------------------
# CLASSIFY BRANCHES. Never on a name. Two predicates, and the weaker one is stated
# as weaker: `git branch -d` refusing "not fully merged" is what a squash always looks
# like and proves nothing in either direction.
# ---------------------------------------------------------------------------
echo "=== BRANCHES (remote)"
BR_KEPT=0
BR_CAND=()
if [ -z "$SLUG" ]; then
  echo "COULD-NOT-JUDGE remote branches — $NO_SLUG_REASON. None proposed."
  CNJ=$((CNJ+1))
elif [ -z "$(git -C "$OWN_ROOT" config --get remote.origin.url 2>/dev/null)" ]; then
  # A slug can come from --slug on a checkout with no 'origin' at all. There is no list to
  # read, so the remote-branch half is skipped with a printed reason, never in silence; the
  # worktree half above has already run.
  echo "COULD-NOT-JUDGE remote branches — cannot list the heads of 'origin' in $OWN_ROOT (no such remote). None proposed."
  CNJ=$((CNJ+1))
else
  # An unreadable branch list is a refusal, never an empty list. With an 'origin' the fetch
  # above just succeeded, so a failed listing is inconsistent and the whole pass refuses.
  HEADS=$(git -C "$OWN_ROOT" ls-remote --heads origin 2>/dev/null | sed 's#.*refs/heads/##') \
    || cnj "ls-remote --heads origin failed -- an unreadable branch list and an empty one are different facts"
  # The default branch is the reference for "adds nothing"; unreadable means that predicate is unavailable.
  MAIN_OK=1
  git -C "$OWN_ROOT" rev-parse --verify -q 'origin/main^{commit}' >/dev/null 2>&1 || MAIN_OK=0
  while read -r b; do
    [ -n "$b" ] || continue
    [ "$b" = "main" ] && continue
    # The tip is read from a ref that must RESOLVE. A missing ref is COULD-NOT-JUDGE, never
    # a count of zero -- `log ... 2>/dev/null | wc -l` turned exactly that into "adds nothing".
    if ! tip=$(git -C "$OWN_ROOT" rev-parse --verify -q "origin/$b^{commit}" 2>/dev/null); then
      echo "COULD-NOT-JUDGE $b — origin/$b does not resolve locally after the fetch; kept"
      CNJ=$((CNJ+1)); continue
    fi
    if printf '%s\n' "$OPEN_HEADS" | grep -qxF "$b"; then
      echo "KEEP    $b — heads an OPEN pull request; deleting the branch would close it"
      BR_KEPT=$((BR_KEPT+1)); continue
    fi
    if ! merged_reading "$b" "$tip"; then
      echo "COULD-NOT-JUDGE $b — the merged pull request read failed; an unreadable list is not 'no pull request'; kept"
      CNJ=$((CNJ+1)); continue
    fi
    case $MERGED_KIND in
      landed)
        echo "CANDIDATE $b — its tip is the head of merged pull request #$MERGED_PR"
        BR_CAND+=("$b") ;;
      moved)
        echo "KEEP    $b — commits pushed after PR #$MERGED_PR merged; the tip is not the merged head"
        BR_KEPT=$((BR_KEPT+1)) ;;
      *)
        if [ "$MAIN_OK" = 0 ]; then
          echo "COULD-NOT-JUDGE $b — no merged pull request and origin/main does not resolve, so 'adds nothing' cannot be tested; kept"
          CNJ=$((CNJ+1)); continue
        fi
        if ! ahead=$(git -C "$OWN_ROOT" rev-list --count "origin/main..origin/$b" 2>/dev/null); then
          echo "COULD-NOT-JUDGE $b — the ahead count against origin/main failed; kept"
          CNJ=$((CNJ+1)); continue
        fi
        if [ "$ahead" = "0" ]; then
          echo "CANDIDATE $b — 0 commits ahead of main, adds nothing"
          BR_CAND+=("$b")
        else
          echo "KEEP    $b — $ahead commit(s) that exist nowhere else, and no merged pull request"
          BR_KEPT=$((BR_KEPT+1))
        fi ;;
    esac
  done <<EOF
$HEADS
EOF
fi
echo

# ---------------------------------------------------------------------------
# CLASSIFY BUILD OUTPUT. Directories named in build-output-dirs.json, inside the checkout and
# every registered worktree, are removed only when git reports them ignored AND nothing inside
# is newer than the configured age. Tracked or recently touched ones are KEPT with the reason.
# The classifier is station_hygiene_check.py --build-outputs: one authority for the question,
# shared with the hygiene gate, so the two can never disagree about what is stale. A worktree
# that is itself a candidate goes whole and is not walked here.
# ---------------------------------------------------------------------------
echo "=== BUILD OUTPUT"
BUILD_KEPT=0
BUILD_CAND=()
BUILD_REAPER="$SCRIPT_DIR/reap-build-output.sh"
HYGIENE="$SCRIPT_DIR/station_hygiene_check.py"
BUILD_CONFIG="$SCRIPT_DIR/../config/build-output-dirs.json"
if [ ! -f "$HYGIENE" ] || [ ! -f "$BUILD_CONFIG" ] || [ ! -x "$BUILD_REAPER" ]; then
  echo "COULD-NOT-JUDGE build output — classifier, config or deleter not found beside this script. None proposed."
  CNJ=$((CNJ+1))
else
  while read -r wt; do
    [ -n "$wt" ] || continue
    [ -d "$wt" ] || continue
    skip=0
    for c in ${CANDIDATES+"${CANDIDATES[@]}"}; do [ "$c" = "$wt" ] && skip=1; done
    [ "$skip" = 0 ] || continue
    if ! classified=$(python3 "$HYGIENE" --build-outputs "$wt" 2>&1); then
      echo "COULD-NOT-JUDGE build output in $wt — $classified"
      CNJ=$((CNJ+1)); continue
    fi
    while IFS= read -r line; do
      [ -n "$line" ] || continue
      case $line in
        "STALE "*)
          rest=${line#STALE }
          echo "CANDIDATE-BUILD ${rest}"
          BUILD_CAND+=("${rest%% — *}") ;;
        "KEEP "*)
          rest=${line#KEEP }
          rest=${rest# }
          echo "KEEP-BUILD ${rest}"
          BUILD_KEPT=$((BUILD_KEPT+1)) ;;
      esac
    done <<EOF
$classified
EOF
  done < <(git -C "$OWN_ROOT" worktree list --porcelain 2>/dev/null | sed -n 's/^worktree //p')
fi
echo

# ---------------------------------------------------------------------------
# ACT, or print the plan.
# ---------------------------------------------------------------------------
if [ "$APPLY" = 1 ]; then
  for wt in ${CANDIDATES+"${CANDIDATES[@]}"}; do
    echo "--- reaping $wt"
    # The reaper derives its perimeter from the checkout it runs in, so it runs in the
    # TARGET checkout — the one whose worktree list holds the candidate.
    (cd -- "$OWN_ROOT" && "$REAPER" "$wt") || echo "    refused by reap-worktree.sh, kept"
  done
  for b in ${BR_CAND+"${BR_CAND[@]}"}; do
    echo "--- deleting remote branch $b"
    git -C "$OWN_ROOT" push origin --delete "$b" || echo "    refused, kept"
  done
  for d in ${BUILD_CAND+"${BUILD_CAND[@]}"}; do
    echo "--- reaping build output $d"
    (cd -- "$OWN_ROOT" && "$BUILD_REAPER" "$d") || echo "    refused by reap-build-output.sh, kept"
  done
else
  echo "DRY RUN — re-run with --apply to act on the candidates above."
fi
echo

AFTER=$(own_size) || cnj "du on the own root failed after the pass — the delta cannot be derived, so none is claimed"
HOST_AFTER=$(df -h / | tail -1)
echo "=== AFTER"
echo "own root  : $BEFORE -> $AFTER   <- THIS is what this pass did"
echo "host (ctx): $HOST_AFTER         <- shared machine; its delta is NOT attributable to this pass"
echo
echo "=== SUMMARY"
echo "worktrees kept: $KEPT   worktree candidates: ${#CANDIDATES[@]}"
echo "branches kept : $BR_KEPT   branch candidates  : ${#BR_CAND[@]}"
echo "build outputs kept: $BUILD_KEPT   build candidates: ${#BUILD_CAND[@]}"
echo "could-not-judge: $CNJ   (kept; the pull-request question had no answer)"

# A pass that kept nothing was indiscriminate, not careful. A pass that kept something
# needing a decision says so with exit 1 rather than reporting a clean 0.
if [ "$KEPT" -gt 0 ] || [ "$BR_KEPT" -gt 0 ] || [ "$CNJ" -gt 0 ]; then
  echo "exit 1 — items were KEPT or COULD-NOT-JUDGE, and each is named above with its reason"
  exit 1
fi
exit 0
