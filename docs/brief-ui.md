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

## ACCEPTANCE CRITERIA
- [ ] Matches reference screenshot visually
- [ ] Functional (click, hover, expand/collapse all work)
- [ ] biome 0 errors, tsc 0 errors
- [ ] No regressions
