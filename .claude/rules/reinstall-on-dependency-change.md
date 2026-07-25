# A merged dependency change is inactive until reinstalled — check installed against the lockfile before running

Always loaded. Fleet-wide.

Class of failure addressed: a change bumps a dependency (a version, a lockfile entry), it merges, and the code that requires the new version keeps failing on the OLD one because the local install (`node_modules` or equivalent) was never reinstalled. The runtime imports a symbol the installed version does not export; the error names the symbol, never the cause. A process that fell back to a degraded path presents itself as running. This is verification-is-not-activation at the dependency layer: the merge verified the change, nothing activated it in the running tree. It recurs because the install lives outside version control, so a checkout that carries the new lockfile still carries the old modules.

## The rule

1. A merged dependency or lockfile change is INACTIVE in any running process until that process's dependencies are reinstalled from the committed lockfile. The merge is the verification; the reinstall is the activation. "The version was bumped" is never "the version is running."
2. Before any long-lived process starts (an MCP server, a service, a worker) and before any deploy, the installed dependency tree is checked against the committed lockfile. A divergence is a loud, explicit failure that names the reinstall command — never a silent start on the stale tree.
3. The remedy for a stale tree is a reinstall (`bun install` / `pnpm install --frozen-lockfile` / `npm ci`), never a deletion of the thing that failed to start. Deleting an identity-bearing process to escape a stale dependency removes a capability to avoid a reinstall — a cut where a correction was owed.
4. A process that cannot honour its identity or contract because of a stale dependency FAILS LOUD — it states it is degraded and how to restore itself — and never falls back silently to a lesser identity or a degraded path presented as healthy.

## Banned

- Starting a process on a dependency tree that diverges from the committed lockfile without a loud, named failure.
- Deleting a failing process instead of reinstalling its dependencies.
- Reading an import/export error as a code bug when the installed version simply predates the merged change.
- A silent fallback that looks connected or healthy while running the stale version.

## Structural mechanism

| Layer | Component | Role |
|---|---|---|
| Doctrine | this file (always loaded) | keeps the class visible every cycle |
| Reactive gate | a guard on process startup and on deploy that compares the installed tree to the committed lockfile and fails loud on divergence, naming the reinstall command | the biting enforcement — a stale tree cannot start silently |
| Runbook | startup and deploy runbooks run the lockfile reinstall as their first step | the reinstall is not optional |

## Cross-ref

- `measurement-integrity.md` — a silent fallback, an absence of signal, is an event, never a rest.
- `derive-never-type.md` — published is not delivered; a "running" state must reflect the real installed version, not the merged intent.
- `deploy-target-explicit.md` — sibling class: verification is not activation.
- `package-manager-canonical.md` — the manager and lockfile are derived from the repo.

---

*Orchestrator: Pi — VantageOS Team | 2026-07-25*
