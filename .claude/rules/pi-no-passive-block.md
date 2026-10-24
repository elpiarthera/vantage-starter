# Pi never leaves a peer waiting — the pending-on-me queue is pulled and resolved every cycle

Always loaded. Fleet governance rule for the coordinating orchestrator, the passive mirror of `pi-no-fleet-freeze.md`.

Class of failure addressed: the silence contract that keeps the fleet quiet on empty cron firings also hides a peer that has gone silent while waiting on a coordinator decision — a merge, an authorization token, a review it must dispatch. The coordinator's inbox reads "nothing new" while one or more peers sit frozen in an "awaiting the coordinator" state that produces no message. The coordinator concludes all is quiet and idles. It has become the invisible bottleneck: nothing is wrong in the inbox, and everything is stalled behind it. The absence of an incoming message is read as absence of demand, when it is the demand made silent by the contract.

## The rule

1. **The coordinator pulls its "pending-on-me" queue every cycle**, never inferring quiet from an empty inbox. The queue comes from the server's `pendingOnYou` signal when present, or from the degraded skill pull (Step 2.6) otherwise: blocked tasks the coordinator created that await its token/review, and fleet PRs that are OPEN + MERGEABLE + reviewer-APPROVED and await the coordinator's merge.
2. **Every item in that queue is RESOLVED or explicitly PARKED, within the cycle.** Resolved means the token issued, the merge executed, the review task created. Parked means a written reason recorded that same cycle. Silent deferral is banned — a peer sitting in "awaiting the coordinator" is a coordinator SLA breach, never a normal wait.
3. **Merge SLA — three cycles.** Any reviewer-APPROVED, mergeable PR is merged or explicitly parked with a written reason within three cron cycles. A breach past three cycles is escalated to the operator that same cycle. The waiting orchestrator is authorized and expected to emit a `[NUDGE]` to the authority at cycle three — the signal travels from both ends. Silence on a ready PR is the banned state.
4. **A peer's silence is never read as absence of demand.** The contract makes a waiting peer quiet; the coordinator's pull is what surfaces the demand the contract hid.

## What counts as a pending-on-me item

- A blocked task the coordinator created that awaits its authorization token.
- A review the coordinator must dispatch for a delivery that is ready.
- A fleet PR that is OPEN + MERGEABLE + reviewer-APPROVED and awaits the coordinator's merge.
- Any peer signal (a `[NUDGE]`, a prior message) reporting a wait on the coordinator.

## Banned

- Concluding "all quiet" from an empty inbox without pulling the pending-on-me queue.
- Leaving a token, merge, or review request unanswered past three cycles.
- Treating a peer's silence as absence of demand.
- A ready PR left waiting with no `[NUDGE]` and no recorded park reason.

## Structural mechanism

| Layer | Component | Role |
|---|---|---|
| Server signal | `pendingOnYou` + `cyclesWaiting` / `slaBreached` | canonical pending-on-me queue when present |
| Skill pull | `check-messages` Step 2.6 (degraded) | pulls the queue from task/PR state when the server signal is absent |
| Doctrine | this rule (always loaded) | keeps the class visible every cycle; survives compaction and reset |
| Autonomous nudge | the waiting orchestrator emits `[NUDGE]` at cycle three | the demand signal travels from the waiting end too |

## Override

`# operator-authorized-park: <reason>` on a park record, for an item the operator explicitly agreed to hold. Absent that, every pending-on-me item is resolved or parked with a written reason within the cycle.

## Cross-ref

- `pi-no-fleet-freeze.md` — the active mirror: the coordinator never halts the fleet; this rule is its passive twin: the coordinator never leaves a peer frozen behind it.
- `proactive-mode.md` — the coordinator advances work; a peer waiting on it is work not advanced.
- `report-on-complete.md` — closing or blocking a task notifies its creator, so a wait surfaces at once.
- `task-closure-discipline.md` — a message never carries the work; a wait is resolved by a state change, not an acknowledgement.
- `dispatch-contract.md` — a countermand names what it cancels; it never silently strands a request.

---

*Orchestrator: Pi — VantageOS Team | 2026-08-04*
