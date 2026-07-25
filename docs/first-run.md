# First run — the environment contract for a fresh fork

> Written for someone who has **never seen this repository**. Every figure below is derived from the code by the command shown next to it, never typed from memory (see `.claude/rules/derive-never-type.md`).
> This is the manual first-run path a forker follows today. The one-click deploy **button** is NOT live yet — it waits on the identity-layer work (T4).

## The single source of the contract

There is exactly **one** authority for "which variables a fresh fork MUST set to reach its first authenticated screen": the `# @required` markers in [`.env.example`](../.env.example). The runtime (`lib/env/requiredEnv.ts`) parses that file; the enforcing test (`__tests__/lib/first-run-env-contract.test.ts`) parses it again independently and fails if the two disagree. No second hand-typed list exists anywhere — a required set that lived in both the code and the docs would be two authorities, and one would silently drift (`.claude/rules/one-identity-layer.md`).

Derive the required set yourself — this is the command the code and the test both mirror:

```
grep -oE '^[A-Z0-9_]+=.*#[[:space:]]*@required' .env.example | grep -oE '^[A-Z0-9_]+'
```

→ **5** variables, listed below. If this command and the table disagree, the file wins — fix the table, never the file to match a stale doc.

## Required to reach the first screen — auth + backend

A fresh fork does not render for a signed-in user without these five. Each carries the `# @required` marker in `.env.example`:

| Variable | Where to obtain it |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Convex dashboard → your deployment URL (`npx convex dev` prints it on first run) |
| `CLERK_SECRET_KEY` | Clerk dashboard → API keys |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API keys (read via the Clerk SDK, not our `process.env`) |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk dashboard → JWT templates → Convex → Issuer (domain only, no `https://`) |
| `NEXT_PUBLIC_CLERK_DOMAIN` | Clerk dashboard → your Frontend API domain (leave unset on `*.clerk.accounts.dev` — always allowed) |

## How the contract is enforced

`assertRequiredEnv()` (in `lib/env/requiredEnv.ts`) is the loud-failure primitive: called with the process environment, it throws `MissingRequiredEnvError` **naming every absent required variable**, rather than letting the app crash later at some unrelated call site. A first-run that fails silently loses the forker in the first minute.

```
pnpm exec vitest run __tests__/lib/first-run-env-contract.test.ts
```

The test proves three things against real artifacts: the derived set equals an independent parse of `.env.example` (two-source agreement); the assertion names exactly the missing variable(s); and dropping one `# @required` marker removes precisely that variable from the derived set (surgical, repo file never touched).

## Deploy/runtime-provided — a forker rarely sets these by hand

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_APP_URL` | your deployment URL (Vercel provides it; local: `http://localhost:3000`) |
| `NEXT_PUBLIC_SITE_URL` | same as above; used for canonical/SEO |
| `NODE_ENV` | set by the runtime (`development`/`production`), never by the user |

## Optional features — absent, they degrade with a stated condition, never a silent break

| Variable | Feature it enables |
|---|---|
| `POLAR_PRODUCT_TIER_1` / `_TIER_2` / `_TIER_3` | Polar billing tiers; without them the paid tiers simply do not resolve |
| `FIRECRAWL_API_KEY` | the consultant/onboarding scrape feature |
| `VANTAGE_PEERS_TASK_URL` / `VANTAGE_PEERS_API_KEY` | forwarding an in-app issue report to an external task system; un-configured, the report is validated and the response says so explicitly (`convex/issueReports.ts`) — a fresh fork works out of the box without them |

## What still gates a live one-click button (NOT this document)

The button ships **after** T4 (the identity layer): a public repository serves whatever it contains verbatim, so it must not carry a local auth copy or ungated queries. This document builds the first-run *contract*; the button is the last step.

---

*Orchestrator: Tau — VantageOS Team | 2026-07-25*
