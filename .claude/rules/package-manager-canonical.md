# Package manager is derived from the repo, never recalled

Always loaded. Fleet-wide.

Class of failure addressed: a repository declares its package manager through its committed lockfile.
Running a different manager's artifact-producing verb against that repository exits 0 and produces a
silently wrong artifact — most visibly a published tarball missing the build output, because the two
managers do not resolve the same lifecycle scripts or workspace layout. Nothing surfaces until a consumer
installs the broken package. The operator's recollection of "which repo uses which manager" is the weak
link, and it fails precisely when several repos are in flight at once.

## The rule

1. **The canonical manager is read from the tree, never from memory.** Before any `pack`, `publish`,
   `install`, `ci`, `add`, `remove`, or `run` in a repository, the manager is the one whose lockfile is
   committed there. One command settles it:
   `ls <repo> | grep -E 'bun.lock|package-lock.json|pnpm-lock.yaml|yarn.lock'`.
2. **A cross-manager invocation is a defect even when it exits 0.** Exit status proves the command ran,
   never that it produced the right artifact. The proof of a correct pack is the tarball contents
   (`tar tzf <tarball> | grep dist/`), not the pack command's success.
3. **Ambiguity is not a licence to guess.** A repo with two lockfiles, or none, is not decidable from the
   tree: establish the manager explicitly and commit the lockfile, rather than picking one and proceeding.
4. **A rehearsal proves the procedure, never the result.** A dry run on a throwaway clone establishes that
   the steps are correct and ordered. Every reading that constitutes the proof is retaken in full after the
   real pass, on fresh material — a rehearsal's readings are never carried forward as evidence.

## Banned

- Naming a repo's package manager from recall, a peer's message, or another repo's convention.
- Citing a successful `pack`/`publish` as proof of a correct artifact without reading the artifact.
- Carrying a rehearsal's measurements into the real operation's proof.
- Adding a second lockfile to "make both work".

## Structural mechanism

| Layer | Component | Role |
|---|---|---|
| Doctrine | this file (always loaded) | keeps the derivation contract visible every cycle |
| Reactive gate | `.claude/hooks/enforce-package-manager-canonical.py` (PreToolUse on Bash) | refuses an artifact-producing verb invoked with a manager the repo does not declare; silent on read-only verbs and on undecidable trees |
| Proof | `.claude/hooks/tests/test_enforce_package_manager_canonical.py` | bipolar probe on materialised repos: 0 holes and 0 false positives required before propagation |

Override: `# allow-cross-package-manager: <reason>` on the command line, for a deliberate cross-manager
operation such as proving a consumer can install the published tarball with the other manager.

## Cross-ref

- `derive-never-type.md` — parent rule: any value a tool can read is derived, never typed.
- `measurement-integrity.md` — an exit code states that a command ran, never what it covered.
- `npm-publish-dist-tag-proof.md` — sibling: publication is proven at the registry, never by the publish command.
- `hook-vitality-bite-probe.md` — the bipolar probe standard this guard is held to.
