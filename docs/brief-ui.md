# UI/Visual Agent Brief (mandatory for all frontend/design tasks)

## TASK
One sentence.

## AGENT TYPE
dev-frontend (or artistic-director, accessibility-audit)

## VISUAL REFERENCE (mandatory — hook blocks without this)
- **Reference screenshot:** `/tmp/screenshot-reference.png` or attached image
- **Current screenshot:** `/tmp/screenshot-current.png` or attached image
- **Key differences:** what's wrong vs what it should be

## FILES
- `/absolute/path/to/file.tsx` — what to change

## EXACT CHANGES
```
FILE: /path/to/file.tsx
LINE: ~42
CURRENT: <div className="p-2">
CHANGE TO: <div className="p-6 rounded-xl bg-card border border-border">
WHY: Match reference card styling
```

## DESIGN TOKENS (from docs/DESIGN-SYSTEM.md)
List which tokens apply:
- Background: var(--background)
- Card: var(--card)
- Border: var(--border)
- Radius: var(--radius)

## MUTATION PROOF (required whenever the task ships or relies on a guard)

A test that has never been seen failing is an intention, not a guard. Break the thing it protects, watch it go red, then restore.

Four steps, and **step 2 is the one everyone skips**:

1. **Inject** the defect the guard exists to catch — re-freeze a token to a hardcoded value, remove the `.dark` block, restore the old hex constant.
2. **Assert the injection LANDED** — `grep` for it, count it, stop if the count is 0. A probe that does not verify its own mutation is not a probe: the anchor may have moved and the suite will show a green that proves nothing.
3. **Red for the RIGHT reason** — quote the failure. A `waitForFunction` timeout because the computed value never changed is the proof; a selector-not-found error only shows the test never reached what it claims to protect.
4. **Restore and prove it** — `git diff` empty for that file, then green again.

Prefer mutating a site the test author did **not** choose: a guard re-reading the exact case it was shown proves it can read, not that it protects.

**Assert computed values, never presence.** `getComputedStyle` on the rendered element, not "the component is mounted" — a component can be mounted and repaint nothing. And jsdom cannot cascade an external stylesheet: anything about applied CSS needs a real browser.

## ACCEPTANCE CRITERIA
- [ ] Matches reference screenshot visually
- [ ] Functional (click, hover, expand/collapse all work)
- [ ] biome 0 errors, tsc 0 errors
- [ ] Mutation proof pasted: injection asserted landed, red quoted, restoration proven
- [ ] No regressions
