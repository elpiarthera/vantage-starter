# No blocked-limbo — a review awaiting a fleet actor is a todo assigned to that actor, never blocked

Always loaded. Fleet-wide, every orchestrator.

Class of failure addressed: `blocked` is a dead state that no autonomous loop acts on. When a review or gate is left `blocked` while it actually awaits a fleet actor's next move, and the re-request is delivered as a bare message, the two ends deadlock: the author believes it is waiting on the reviewer, the reviewer believes it is waiting on the author's re-submission, and nothing sits in any live queue. Both stand by. The work is finished-but-frozen, and it stays frozen because no auto-pick ever looks at a `blocked` task.

## The rule

1. **A review or gate awaiting a fleet actor's action is a `todo` ASSIGNED TO THAT ACTOR, never `blocked`.** The task always sits in a live todo queue that an auto-pick will reach.
2. **A REVISE reassigns the review task to the AUTHOR as `todo`.** Completing the author's fix flips the same task back to the REVIEWER as `todo`. The task ping-pongs between two live queues; it never enters a dead state.
3. **A re-request is a task STATE CHANGE, never a bare message.** Re-requesting a re-gate means reassigning the task and setting it `todo` — the message only pings. A message alone is banned as the re-request vehicle (the work lives in the task, not the message).
4. **`blocked` is reserved ONLY for a genuine external dependency no fleet actor can resolve** — an unpublished upstream, a third-party outage, an operator decision. A blocker that a fleet actor could clear is never `blocked`; it is a `todo` on that actor.

## The ping-pong path

```
author delivers -> review task todo(reviewer)
reviewer REVISE -> review task todo(author)      [reassign, never blocked]
author re-submits -> review task todo(reviewer)   [reassign, never a bare message]
reviewer APPROVED -> gate passes, task done
```

At every hop the task sits in exactly one live todo queue, owned by whoever must act next.

## Banned

- Leaving a gate or review `blocked` while it awaits a peer's action.
- Re-requesting a re-gate by message without flipping the task state (reassign + todo).
- A reviewer's autonomous loop ignoring a REVISE because the task sits in `blocked`.
- Using `blocked` for a dependency a fleet actor could resolve.

## Structural mechanism

| Layer | Component | Role |
|---|---|---|
| Doctrine | this file (always loaded, fleet) | keeps the no-limbo contract visible every cycle |
| Reactive gate | hook `enforce-no-blocked-limbo.py` (PreToolUse on `update_task` / `block_task`) | refuses to set a review/gate task `blocked` when the blocker is a fleet actor; requires reassign-as-todo instead |
| Auto-pick | the reviewer's and author's autonomous loop | reaches the task because it is `todo`, never `blocked` |

Override: `// allow-blocked-external: <reason>` on the task, for a genuine external dependency no fleet actor can resolve.

## Cross-ref

- `pr-review-flow.md` — a PR opens through the sanctioned flow; the review task is created live with the PR.
- `review-needs-pushed-artifact.md` — a reviewer never keeps a review in-progress while awaiting the author; it frees its auto-pick.
- `pi-no-fleet-freeze.md` / `pi-no-passive-block.md` — the coordinator never halts the fleet and never leaves a peer frozen behind it.
- `task-closure-discipline.md` — a message never carries the work; a re-request is a state change.
- `dispatch-contract.md` — a redirect is a task or task update, never a message alone.

---

*Orchestrator: Pi — VantageOS Team | 2026-08-04*
