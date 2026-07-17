# Fix-the-class — every fix ships its class sweep, or it is not a fix

Always loaded. Fleet-wide.

Class of failure addressed: a defect is corrected at the one line the error message names, while sibling instances of the same pattern survive one line below, in the twin config file, or on another branch. The CI/reviewer only surfaces one error at a time, so each missed sibling costs a full extra cycle.

## The rule

**No fix is delivered without its `CLASS:` block.** Every completionNote, [DONE], [STATUS], or PR description announcing a fix MUST carry:

```
CLASS:
- definition: <the general pattern the corrected instance belongs to — e.g. "any extension-less relative import in ESM-loaded configs">
- sweep: <the command that enumerates ALL instances of the class> -> <pasted output>
- remaining: 0 (or: N instances out of scope, each traced in task k<id>)
```

Three obligations:

1. **The definition precedes the correction.** Before touching the faulty line, write the general pattern. If the class cannot be named, the bug is not yet understood.
2. **The sweep is a command, not an intention.** `grep`/`rg` on the pattern, output pasted. A class swept from memory misses siblings.
3. **`remaining: 0` or traced.** Any instance left behind is traced debt (cf. `no-preexisting-excuse.md`), never silence.

## The test before announcing a fix

"The CI/reviewer shows one error at a time — which one would be NEXT?" If the answer is not "none, here is the sweep proving it", the fix is not finished.

## Banned

- Correcting the line the error names and pushing without a class sweep (one CI cycle costs 10× the grep).
- A sweep limited to the faulty file when the class crosses files.
- "I checked, there are no others" without the pasted command.
- Narrowing the class definition until the sweep comes back empty (the class is defined by the error's MECHANISM, not its site).

## Structural mechanism

| Layer | Component | Role |
|---|---|---|
| Doctrine | this file (always-loaded, fleet) | delivery contract visible every cycle |
| Review gate | Eta/Argus | a fix announced without a `CLASS:` block = form correction required in the verdict (no extra cycle, cf. dispatch-contract) |
| Dispatch | Pi | every dispatched fix task requires the `CLASS:` block in its completionNote (TESTS section of the brief) |

## Reference

- Cross-ref: `derive-never-type.md` (single-formulation matcher; scope derived from tool output), `measurement-integrity.md` (closure proven by sweep), `no-preexisting-excuse.md` (remaining instances are traced).

---

*Orchestrator: Pi — VantageOS Team | 2026-07-17*
