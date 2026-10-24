#!/usr/bin/env bash
# reap-build-output.sh — removes ONE ignored build-output directory.
#
# ONE path argument. One action. Never chained: the script NAME is what goes in a permission
# allowlist, never a deletion pattern (see reap-worktree.sh and post-merge-cleanup.md).
#
# The classifier (station_hygiene_check.py --build-outputs) decides AGE. This script does not
# trust that decision for the properties that make a deletion safe: it re-reads them itself,
# so the safety does not live only upstream.
#   - the directory sits inside a registered worktree of the caller's repository
#   - its name is one of the configured build-output names
#   - it is not a symbolic link
#   - it holds no tracked file
#   - git reports it as ignored
# Nothing about a station or a repository is written here.
set -u -o pipefail

die() { echo "REFUSED: $*" >&2; exit 2; }

[ $# -eq 1 ] || die "exactly one path argument required, got $#"
target=$1
[ -n "$target" ] || die "empty path"
case $target in
  *..*) die "traversing path: $target" ;;
  /) die "refusing /" ;;
esac

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd) || die "cannot resolve this script's own directory"
CONFIG="$SCRIPT_DIR/../config/build-output-dirs.json"
[ -f "$CONFIG" ] || die "build-output config not found at $CONFIG"

own_top=$(git rev-parse --show-toplevel 2>/dev/null) || die "not run from inside a git checkout — the perimeter cannot be derived"

[ ! -L "$target" ] || die "$target is a symbolic link; never followed"
real=$(realpath -m -- "$target") || die "unresolvable path: $target"
[ -d "$real" ] || die "not a directory: $real"

name=$(basename -- "$real")
allowed=$(python3 -c 'import json,sys; print("\n".join(json.load(open(sys.argv[1]))["dirs"]))' "$CONFIG" 2>/dev/null) \
  || die "build-output config $CONFIG unreadable"
printf '%s\n' "$allowed" | grep -qxF -- "$name" || die "$name is not a configured build-output name"

# The perimeter is this repository's own worktree list. The deepest registered worktree
# containing the path is the checkout that must answer for it.
checkout=""
while IFS= read -r wt; do
  [ -n "$wt" ] || continue
  wt_real=$(realpath -m -- "$wt" 2>/dev/null) || continue
  case $real in
    "$wt_real"/?*)
      if [ ${#wt_real} -gt ${#checkout} ]; then checkout=$wt_real; fi ;;
  esac
done <<EOF
$(git -C "$own_top" worktree list --porcelain 2>/dev/null | sed -n 's/^worktree //p')
EOF
[ -n "$checkout" ] || die "outside this station's perimeter: $real is not inside a registered worktree of $(basename -- "$own_top")"

rel=${real#"$checkout"/}
tracked=$(git -C "$checkout" ls-files -- "$rel" 2>/dev/null) || die "cannot read the index of $checkout"
[ -z "$tracked" ] || die "$rel holds tracked files in $checkout — deleting it would delete source"
git -C "$checkout" check-ignore -q -- "$rel" 2>/dev/null || die "$rel is not ignored in $checkout — git would report its removal as a change"

size=$(du -sh -- "$real" 2>/dev/null | cut -f1)
command rm -rf -- "$real"
[ ! -e "$real" ] || die "still present after removal: $real"
echo "REAPED-BUILD $real (was $size)"
