# Cite the command — a count without its command and scope is not a measurement

Always loaded. Fleet-wide.

Class of failure addressed: two people measure the same repository, report different numbers, and spend cycles correcting each other — while both are right. Their patterns differed, or their path scopes differed, or their reference sets differed. The number travelled; the instrument that produced it did not. Observed at three levels in a single session: different search patterns over the same tree, different path scopes over the same pattern, and different surviving reference sets over the same history.

## The rule

Any count, ratio, or inventory figure stated in a message, task, verdict, completion note, or report MUST carry the exact command that produced it, including its pattern and its scope. Not "36 files" but `rg -l '<pattern>' src/ tests/ -> 36`.

A figure without its command is a number, not a measurement. It cannot be reproduced, so it cannot be contradicted, so it cannot be trusted — and two correct people will disagree over it.

## Corollaries

1. **Never contradict a figure without running its command.** Saying "your number does not reproduce" while running a different command is accurate and useless. Run theirs, or say nothing about theirs.
2. **A count is a property of (artifact x command x scope x instant), never of the artifact.** Deleting a branch lowers a history count; merging a cleanup raises it. Neither reading is the truth of the repository.
3. **Prefer proving an absence over citing a count.** Zero is the only value that does not depend on whose pattern ran, provided it comes with a positive control showing the pattern can match. A closure proven by absence reproduces on any reader's machine; a closure proven by a count reproduces only on the author's.
4. **A gate condition never names an expected number.** It names the property: zero occurrences, with the positive control pasted beside it, on a scope stated in the condition itself.

## Banned

- A figure in any outbound message without the command that derived it.
- Correcting someone's count with a different command, without saying the commands differ.
- Citing a count as proof of closure where an absence could be proven instead.
- Carrying a figure from one context into another — a number measured on a working tree does not describe a remote branch, and one measured before a deletion does not describe the state after it.

## Structural mechanism

| Layer | Component | Role |
|---|---|---|
| Doctrine | this file (always loaded) | keeps the contract visible every cycle |
| Message contract | every count in a peer message carries its command | the failure occurs at message boundaries, so the rule lives there |
| Review gate | reviewer | a verdict citing a figure without its command is a form correction, issued inside the verdict rather than as a new cycle |

## Cross-ref

- `derive-never-type.md` — same family: state is derived and resolved, never typed. This rule extends it to the act of REPORTING a derived value.
- `measurement-integrity.md` — an instrument answering about a scope that was never established; positive control before any zero is read.
