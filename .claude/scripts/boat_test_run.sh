#!/usr/bin/env bash
# boat_test_run.sh — run a repository's test command at a commit inside a Boat sandbox.
#
# Usage:
#   boat_test_run.sh <repo-checkout> <sha-or-ref> [--snapshot NAME] [--type small|default|large] -- <command...>
#
# Sibling of verify_at_head.sh: same contract (one command, a commit, no copy left behind),
# but the work runs in a Boat sandbox instead of on the shared host. The commit is exported
# with `git archive` into a scratch directory (no second checkout of the repository), pushed
# to the sandbox with `boat run --push`, and the export is removed on every exit path.
#
# Exit codes:
#   0        the command passed
#   <n>      the command's own non-zero exit code (124 = Boat's --timeout), when the output
#            carries a test summary
#   3        could-not-judge: CLI missing, key missing or ambiguous, sign-in refused, Boat's
#            start budget exhausted, or a failing run that printed no test summary.
#            The reason is on stderr.
#   125      refused: bad arguments or an unresolvable repository/ref (nothing was run)
#
# Command forms: a single argument is a shell string, run verbatim (`-- 'echo a; echo b'`).
# Several arguments are an argv, each quoted so it arrives intact
# (`-- bash -c 'echo a; echo b'`, `-- printf '[%s]' 'two words'`).
#
# The key is read by NAME (BOAT_API_KEY) from the environment, else from the workspace
# .env.local (override the file with BOAT_ENV_FILE), and is fed to `boat login --key-stdin`.
# Its value is never printed. A name present twice in the file is ambiguous, not a choice.
#
# Scratch root: $CLAUDE_SCRATCHPAD when set, else ${TMPDIR:-/tmp}.
set -u -o pipefail

EXIT_JUDGE=3

# A test summary is recognised by its SHAPE, never by a bare word: tool errors ("request failed",
# "command failed", "Failed building wheel") must not read as a verdict on the tests.
#   vitest: "Test Files  1 failed | 2 passed (3)" / "Tests  2 failed | 5 passed (7)"
#   pytest: "2 failed, 5 passed in 1.23s"
SUMMARY_RE='(Test Files|Tests) +[0-9]+|[0-9]+ (passed|failed).* in [0-9.]+s'
EXIT_REFUSED=125

die() { echo "REFUSED: $*" >&2; exit "$EXIT_REFUSED"; }
cannot_judge() { echo "COULD-NOT-JUDGE: $*" >&2; exit "$EXIT_JUDGE"; }

usage="usage: boat_test_run.sh <repo-checkout> <sha-or-ref> [--snapshot NAME] [--type small|default|large] -- <command...>"
[ $# -ge 2 ] || die "$usage"
repo_arg=$1
ref=$2
shift 2

snapshot=""
type="default"
while [ $# -gt 0 ]; do
  case $1 in
    --snapshot)
      [ $# -ge 2 ] || die "--snapshot needs a name"
      snapshot=$2
      shift 2
      ;;
    --type)
      [ $# -ge 2 ] || die "--type needs a value"
      type=$2
      shift 2
      ;;
    --) break ;;
    *) die "unknown option '$1'. $usage" ;;
  esac
done
[ "${1:-}" = "--" ] || die "missing the '--' separator before the command"
shift
[ $# -ge 1 ] || die "empty command after '--'"
case $type in
  small | default | large) ;;
  *) die "--type '$type' is not one of small, default, large" ;;
esac

[ -d "$repo_arg" ] || die "not a directory: $repo_arg"
repo=$(git -C "$repo_arg" rev-parse --show-toplevel 2>/dev/null) || die "not a git checkout: $repo_arg"

sha_literal=no
[[ $ref =~ ^[0-9a-f]{40}$ ]] && sha_literal=yes
if ! git -C "$repo" fetch --quiet origin 2>/dev/null; then
  [ "$sha_literal" = yes ] || die "fetch from origin failed and '$ref' is a moving ref — the tip it names cannot be trusted"
  echo "WARN: fetch from origin failed; '$ref' is a full sha, immutable, continuing" >&2
fi
sha=$(git -C "$repo" rev-parse --verify --quiet "${ref}^{commit}") || die "cannot resolve '$ref' to a commit in $repo"

# --- the instrument: CLI and key, proven before anything is exported -----------------
boat_bin=$(command -v boat 2>/dev/null || true)
if [ -z "$boat_bin" ] && [ -x "${HOME:-/nonexistent}/.ascii/bin/boat" ]; then
  boat_bin="$HOME/.ascii/bin/boat"
fi
[ -n "$boat_bin" ] || cannot_judge "the boat CLI is on neither PATH nor ~/.ascii/bin/boat"

key="${BOAT_API_KEY:-}"
if [ -z "$key" ]; then
  script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
  envfile=${BOAT_ENV_FILE:-$script_dir/../../.env.local}
  if [ -r "$envfile" ]; then
    n=$(grep -c '^BOAT_API_KEY=' "$envfile")
    [ "$n" -le 1 ] || cannot_judge "BOAT_API_KEY appears $n times in $envfile; the value in use is ambiguous"
    if [ "$n" -eq 1 ]; then
      key=$(grep '^BOAT_API_KEY=' "$envfile" | cut -d= -f2-)
      key=${key%\"}
      key=${key#\"}
      key=${key%\'}
      key=${key#\'}
    fi
  fi
fi
[ -n "$key" ] || cannot_judge "BOAT_API_KEY is not set in the environment nor in the workspace .env.local"

scratch_root=${CLAUDE_SCRATCHPAD:-${TMPDIR:-/tmp}}
[ -d "$scratch_root" ] || die "scratch root does not exist: $scratch_root"
scratch_root=$(cd "$scratch_root" && pwd -P)
name=$(basename -- "$repo")
name=${name//[^A-Za-z0-9._-]/_}
work=$(mktemp -d "$scratch_root/boatrun-XXXXXX") || die "cannot create a scratch directory under $scratch_root"
export_dir="$work/$name"
out="$work/output.log"

cleaned=no
cleanup() {
  [ "$cleaned" = no ] || return 0
  cleaned=yes
  # Only a directory this script created, directly under the scratch root, is removable.
  case $work in
    "$scratch_root"/boatrun-?*) ;;
    *)
      echo "REFUSED to remove '$work': outside the scratch root or not a boatrun directory" >&2
      return 1
      ;;
  esac
  command rm -rf -- "$work"
  if [ -e "$work" ]; then
    echo "LEFTOVER $work — export removal did not remove it" >&2
    return 1
  fi
  echo "REMOVED $work"
}
trap 'cleanup' EXIT
trap 'cleanup; exit 130' INT
trap 'cleanup; exit 143' TERM

mkdir -p "$export_dir"
git -C "$repo" archive "$sha" | tar -x -C "$export_dir" || cannot_judge "git archive of ${sha:0:8} failed"

# Sign in: the key travels on stdin only, never on a command line, never on the terminal.
if ! printf '%s' "$key" | "$boat_bin" login --key-stdin >"$work/login.log" 2>&1; then
  cannot_judge "boat login refused the key; its output is withheld so the key cannot leak"
fi
unset key

from=()
[ -z "$snapshot" ] || from=(--from "$snapshot")
# One argument is a shell string by contract and travels verbatim. Several arguments are an argv:
# each is quoted so the remote shell receives it whole (`bash -c 'a; b'` stays one script).
if [ "$#" -eq 1 ]; then
  cmd=$1
else
  cmd=$(printf '%q ' "$@")
  cmd=${cmd% }
fi

start=$SECONDS
"$boat_bin" run "${from[@]}" --type "$type" --push "$export_dir" -e LC_ALL=C.UTF-8 -- bash -lc "$cmd" </dev/null 2>&1 | tee "$out"
rc=${PIPESTATUS[0]}
elapsed=$((SECONDS - start))

# Boat's own refusals share exit codes with the command's. They are recognised by their
# documented token, and only when the run produced no test summary.
if [ "$rc" -ne 0 ] && grep -q 'rate_limited' "$out" && ! grep -qE "$SUMMARY_RE" "$out"; then
  window=$(grep -m1 -o 'rate_limited.*' "$out")
  echo "COULD-NOT-JUDGE: Boat refused the start: $window" >&2
  cleanup
  exit "$EXIT_JUDGE"
fi

# A failing exit with no test summary is not a verdict on the tests: the command died before
# reporting (broken pipe, killed, wrong invocation). Refuse it rather than relay a bare code.
if [ "$rc" -ne 0 ] && ! grep -qE "$SUMMARY_RE" "$out"; then
  echo "COULD-NOT-JUDGE: the run produced no test summary (exit $rc)" >&2
  cleanup
  exit "$EXIT_JUDGE"
fi

echo "---- BOAT SUMMARY ${sha:0:8} type=$type${snapshot:+ snapshot=$snapshot}"
grep -E "$SUMMARY_RE" "$out" | tail -8
grep -iE '(cost|\$[0-9])' "$out" | tail -2
echo "BOAT $sha exit=$rc wall=${elapsed}s"

cleanup || exit "$EXIT_REFUSED"
exit "$rc"
