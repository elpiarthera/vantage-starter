---
name: next-browser
description: >-
  Terminal-based browser inspection for Next.js apps via @vercel/next-browser.
  Gives agents access to screenshots, React component trees, network requests,
  console logs, PPR shell analysis, and dev overlay errors — all as structured text.
  Use this skill whenever the agent needs to inspect the running app, debug visual issues,
  check component props/state, analyze PPR shells, or capture screenshots — even if
  they don't say 'next-browser' explicitly.
---

# next-browser

## TL;DR

CLI that lets agents inspect a running Next.js app from the terminal. Screenshots, React DevTools, network, console, PPR analysis — all as structured text an LLM can parse.

## Install

```bash
npx skills add vercel-labs/next-browser
```

Or invoke with `/next-browser` in Claude Code.

## Requirements

- Next.js dev server must be running (`npm run dev`)
- Chromium is managed automatically by next-browser

## Commands

### Screenshots and visuals
```bash
next-browser screenshot                    # Capture current page
next-browser screenshot --full             # Full page screenshot
next-browser filmstrip <url>               # Loading filmstrip (sequence of screenshots)
```

### React DevTools
```bash
next-browser tree                          # View React component tree
next-browser tree --depth 3                # Limit tree depth
next-browser inspect <componentName>       # View props, hooks, state, source location
```

### Navigation
```bash
next-browser goto <url>                    # Navigate to URL
next-browser goto /dashboard               # Relative URL
```

### PPR (Partial Prerendering) Analysis
```bash
next-browser ppr lock                      # Enter PPR mode — show only static shell
next-browser ppr unlock                    # Exit PPR mode — show full analysis with blockers
```

PPR analysis output shows:
- Which components are static vs dynamic
- What blocks Suspense boundaries
- Exact file:line of the blocking fetch/action
- Recommended fix (e.g., "Push the fetch into a smaller Suspense leaf")

### Network
```bash
next-browser network                       # Show requests since last navigation
next-browser network --filter fetch        # Filter by type
```

### Console and errors
```bash
next-browser console                       # Show console output
next-browser errors                        # Show dev overlay errors
```

## When to Use

- **Visual debugging** — agent can't see the browser, but `screenshot` gives it eyes
- **Component inspection** — check if props are correct, hooks have right values
- **PPR optimization** — grow the static shell by finding dynamic blockers
- **Network debugging** — check if API calls are firing correctly
- **Error diagnosis** — read dev overlay errors from terminal

## Integration with dev-frontend agent

The dev-frontend agent should use next-browser when:
1. A visual bug is reported — `screenshot` first, then `tree` to inspect
2. Layout doesn't match spec — `screenshot` + compare
3. PPR performance work — `ppr lock` / `ppr unlock` cycle
4. After making UI changes — `screenshot` to verify

## Notes

- Each command is a one-shot request against a persistent browser session
- No browser state management needed — next-browser handles it
- Experimental feature — evolving rapidly
- Requires Next.js 16.2+ for full PPR analysis (currently on 15.3.9 — upgrade planned)
