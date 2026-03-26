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

## ACCEPTANCE CRITERIA
- [ ] tsc 0 errors
- [ ] Tests pass
- [ ] No regressions
- [ ] Convex deploys clean (if applicable)
