# A workaround never enters a delivery

Always loaded. Fleet-wide.

Class of failure addressed: a proper path is unavailable — a package is unpublished, an interface is missing, a credential is absent — so the delivery reaches around it: a pinned clone instead of an install, a copied file instead of a dependency, a hardcoded value instead of a resolution, a test alias resolving what production cannot. The delivery works, is reviewed, and merges. The workaround is now load-bearing, and every later consumer inherits it. The person who introduced it declares it honestly and considers the debt discharged; it is not, because a declaration is not a removal.

The compounding form is worse: a workaround inside a PROOF. A test that clones what a customer installs, or resolves through an alias production does not have, measures a path nobody will take. It reports green about a world that does not exist.

## The rule

1. **A workaround is not a delivery option.** When the proper path is unavailable, the delivery either builds that path first, or it does not ship. There is no third choice presented as pragmatism.
2. **If the proper path belongs to someone else**, the delivery stops and the dependency is dispatched to its owner. Waiting for an owner is a normal state; reaching around an owner is not.
3. **A workaround that has already shipped is a defect**, not a decision. It is removed in the delivery that brings its replacement — never left beside it, because two paths for one thing means one silently wins.
4. **Proofs are held to a stricter bar than product code.** A test may never acquire, resolve, or configure anything by a path a real consumer cannot use. A proof that exercises a different path than the claim is about proves nothing about the claim.
5. **Naming a workaround does not license it.** Honest declaration is required and insufficient. The only acceptable outcomes are: built properly, or not shipped.

## Banned

- "Shortest correct path for now" as a reason to merge.
- A pinned clone, vendored copy, or path dependency standing in for a published package.
- A test alias, mock, or fixture resolving something the runtime cannot.
- Keeping the workaround "as a fallback" after the replacement lands.
- Presenting a workaround to the operator as a decision taken, rather than a blocker with an owner.

## Structural mechanism

| Layer | Component | Role |
|---|---|---|
| Doctrine | this file (always loaded) | the bar is visible before the dispatch, not after the merge |
| Dispatch filter | the dispatcher refuses to brief work whose plan contains a reach-around | the root cause is the brief that accepted it |
| Review gate | reviewer | a delivery containing a workaround is refused on substance, and the missing proper path is named with its owner |

## Cross-ref

- `derive-never-type.md` — two authorities for one thing; one silently wins.
- `measurement-integrity.md` — an instrument pointed at a path nobody takes measures nothing.
- `no-preexisting-excuse.md` — declared debt is still debt; the counter never rises.
- `no-blocker-without-route.md` — an obstacle ships with its route; the route is built, not routed around.

---

*Orchestrator: Pi — VantageOS Team | 2026-07-24*
