# Backend Agent Brief (for logic, schema, API, data tasks)

## TASK
One sentence.

## AGENT TYPE
dev-convex-expert, dev-senior-dev, dev-clerk-expert, etc.

## FILES
- `/absolute/path/to/file.ts` — what to change

## CONTEXT
Why this change is needed. What triggered it.

## EXACT CHANGES
```
FILE: /path/to/schema.ts
LINE: ~15
CURRENT: field: v.string()
CHANGE TO: field: v.optional(v.string())
WHY: Allow nullable values for migration
```

## TESTS
- Which tests to run after
- Expected behavior

## MUTATION PROOF (required whenever the task ships or relies on a guard)

A test that has never been seen failing is an intention, not a guard. Before trusting a green suite, break the thing it protects and watch it go red — then restore.

Four steps, and **step 2 is the one everyone skips**:

1. **Inject** the defect the guard exists to catch — remove the auth line, re-freeze the value, delete the `.dark` block.
2. **Assert the injection LANDED** — `grep` for it, count it, and stop if the count is 0. A probe that does not verify its own mutation is not a probe: the anchor may have moved, the script may have silently no-op'd, and the suite will show a green that proves nothing.
3. **Red for the RIGHT reason** — quote the failure. "promise resolved instead of rejecting" proves the unauthenticated call went through; a seeding or import error proves only that the test never reached the line it claims to protect.
4. **Restore and prove it** — `git diff` empty for that file, then green again.

Prefer mutating a site the test author did **not** choose. A guard re-reading the exact case its author showed it proves it can read; a guard catching a defect injected somewhere it was never pointed at proves it protects.

## ACCEPTANCE CRITERIA
- [ ] tsc 0 errors
- [ ] Tests pass
- [ ] Mutation proof pasted: injection asserted landed, red quoted, restoration proven
- [ ] No regressions
- [ ] Convex deploys clean (if applicable)
