# A review needs a pushed artifact — and the coordinator unfreezes every wait within one cycle

Always loaded. Fleet-wide, every orchestrator and the coordinating orchestrator.

Class of failure addressed: an assignee finishes a code change on a branch that lives only on its own machine, marks the work "in review", and routes it to the reviewer. The reviewer runs on a different machine and has nothing to diff — the branch was never pushed, so no reviewable artifact exists. The review can never happen. The assignee re-pings the coordinator cycle after cycle; the coordinator treats each ping as a status line to acknowledge later rather than a freeze to break. Work sits finished-but-ungateable for many cycles while everyone believes it is "waiting on the reviewer". The defect is process, not machine state: there was never anything to review, and no one was obligated to fix that.

## The rule

1. **No review is requested or routed without a pushed, reviewable artifact.** A local-only branch is not an artifact. The precondition of asking for a review is a branch pushed to the remote and a PR opened through the sanctioned flow (`pr-review-flow`, the `open-pr` skill). "In review" on an unpushed branch is a contradiction, not a state.
2. **The reviewer refuses a review that has no pushed artifact.** A request to review a branch the reviewer cannot fetch is returned immediately with one instruction: push and open the PR. The reviewer never travels to the author's machine to review a local branch.
3. **The coordinator resolves every review-or-decision wait within the cycle it surfaces.** When any orchestrator reports it has been waiting on a review, a decision, or an unblock for one cron cycle or more, the coordinator treats it as a freeze to break THIS cycle — not a status to file. Breaking it means: create or push the missing artifact instruction, route the reviewer, or make the ruling. A peer waiting is never acknowledged and deferred.
4. **A wait is diagnosed at the artifact, not at the reviewer.** Before pushing the reviewer, the coordinator confirms a reviewable artifact exists (the PR is open, the head is pushed). If it does not, the fix is the artifact, not a nudge to the reviewer — nudging a reviewer who has nothing to review is what produces the multi-cycle freeze.
5. **A reviewer always chains and never idles while its queue holds an unblocked task.** A reviewer never keeps a review in the in-progress state while that review is waiting on the author or any third party — a review awaiting someone else is moved to blocked, freeing the reviewer's auto-pick, never left in-progress. After issuing a verdict (or blocking on the author), the reviewer immediately auto-picks the next unblocked task in its queue and executes it. Standby is legitimate only when the queue is genuinely empty of unblocked work. The failure this closes: a reviewer holds one review in-progress while awaiting the author, so its auto-pick reads "already working" and stands by, leaving every other ready review — including ready reviews of the very mechanism meant to prevent this — untouched for cycles.

## Banned

- Marking work "in review" or routing a review on a branch that is not pushed to the remote.
- A reviewer accepting a review request with no pushed PR, or reviewing a local branch on the author's machine.
- The coordinator acknowledging a "waiting N cycles" report without breaking the freeze the same cycle.
- Re-pinging a reviewer as the response to a stalled review without first confirming the artifact exists.
- Treating a peer's repeated wait as noise rather than a P1 unblock.
- A reviewer keeping a review in-progress while it awaits the author, then standing by instead of auto-picking the next unblocked task in its queue.
- Any orchestrator declaring standby while its queue still holds an unblocked task.

## Structural mechanism

| Layer | Component | Role |
|---|---|---|
| Doctrine | this file (always loaded, fleet) | keeps the artifact-first + unfreeze-in-one-cycle contract visible every cycle |
| Sanctioned flow | the `open-pr` skill + `pr-review-flow` | the pushed PR is the only review-request path; it wires the review task atomically |
| Coordinator duty | the coordinator diagnoses at the artifact and resolves every wait the cycle it surfaces | the root cause was the coordinator deferring a freeze; this is the active fix |

## Cross-ref

- `pr-review-flow.md` — a PR opens only through the `open-pr` skill; the review task and signal are created with the PR.
- `pi-creates-the-review-task.md` — every gate is dispatched under a task, never routed by message alone.
- `pi-no-fleet-freeze.md` — the coordinator never halts the fleet; its active mirror is: the coordinator never leaves a peer frozen.
- `report-on-complete.md` — closing or blocking a task notifies its creator and reviewer, so a wait surfaces at once.
- `no-blocker-without-route.md` — an obstacle ships with its route; a stalled review ships with the push that unblocks it.

---

*Orchestrator: Pi — VantageOS Team | 2026-08-04*
