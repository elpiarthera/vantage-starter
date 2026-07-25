# First run — the environment contract for a fresh fork

> Written for someone who has **never seen this repository**. Every figure below is derived from the code by a command shown next to it, never typed from memory.
> This is the preparatory half of [T7]. The one-click deploy **button** is NOT live yet — it waits on the identity-layer work (T4). What follows is the manual first-run path a forker follows today.

## What this document guarantees

A required setup value that lives in the code but not in the documentation is invisible to us — we already have it configured — and blocking for everyone else. This contract closes that gap by **reconciling two counts**:

```
# every environment variable the code READS (unique names):
grep -rhoE "process\.env\.[A-Z0-9_]+" app/ components/ convex/ lib/ middleware.ts providers/ hooks/ src/ \
  | sed 's/process\.env\.//' | sort -u
```
→ **13** variables read in code.

```
# every variable the template DOCUMENTS:
grep -oE "^[A-Z0-9_]+=" .env.example | sed 's/=$//' | sort -u
```
→ **18** variables documented in `.env.example`.

The two lists do **not** match. That mismatch is the point of this document.

## The 13 variables the code actually reads

Derived from the sweep above, classified by what a forker must do:

### Required to reach the first screen — auth + backend
A fresh fork does not render for a signed-in user without these:

| Variable | Where to obtain it |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Convex dashboard → your deployment URL (`convex dev` prints it on first run) |
| `CLERK_SECRET_KEY` | Clerk dashboard → API keys |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API keys (documented, read via the Clerk SDK) |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk dashboard → JWT templates → Convex → Issuer |
| `NEXT_PUBLIC_CLERK_DOMAIN` | Clerk dashboard → your Frontend API domain |

### Deploy/runtime-provided — a forker rarely sets these by hand
| Variable | Source |
|---|---|
| `NEXT_PUBLIC_APP_URL` | your deployment URL (Vercel provides it; local: `http://localhost:3000`) |
| `NEXT_PUBLIC_SITE_URL` | same as above; used for canonical/SEO |
| `NODE_ENV` | set by the runtime (`development`/`production`), never by the user |

### Optional features — absent, they degrade with a stated condition, never a silent break
| Variable | Feature it enables |
|---|---|
| `POLAR_PRODUCT_TIER_1` / `_TIER_2` / `_TIER_3` | Polar billing tiers; without them the paid tiers simply do not resolve |
| `FIRECRAWL_API_KEY` | the consultant/onboarding scrape feature |
| `VANTAGE_PEERS_TASK_URL` / `VANTAGE_PEERS_API_KEY` | forwarding an in-app issue report to an external task system; **un-configured, the report is validated and the response says so explicitly** (`convex/issueReports.ts:132-140`) — a fresh fork works out of the box without them |

## The two gaps this reconciliation exposes

**Gap A — read in code, NOT documented (9).** These a forker needs and cannot discover from `.env.example` today:
```
comm -23 <(code reads) <(documented)
→ FIRECRAWL_API_KEY, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SITE_URL, NODE_ENV,
  POLAR_PRODUCT_TIER_1, POLAR_PRODUCT_TIER_2, POLAR_PRODUCT_TIER_3,
  VANTAGE_PEERS_API_KEY, VANTAGE_PEERS_TASK_URL
```
`NODE_ENV` is runtime-provided (not a forker action). The remaining 8 must be added to `.env.example` with the where-to-obtain column above.

**Gap B — documented, NEVER read (14).** Noise that misleads a forker into provisioning keys the code does not use:
```
comm -13 <(code reads) <(documented)
→ BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID, CLERK_TESTING_TOKEN, CONVEX_URL,
  FAL_KEY, NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL, NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL, OPENAI_API_KEY, PLAYWRIGHT_BASE_URL, RESEND_API_KEY,
  TOGETHER_API_KEY
```
Three sub-classes, each handled differently rather than lumped:
- **Test-only** (`CLERK_TESTING_TOKEN`, `PLAYWRIGHT_BASE_URL`, `BROWSERBASE_*`): read by tests/e2e, not by the app — keep, but move under a documented "testing only" heading so a forker does not think they gate the app.
- **Read by the Clerk/Convex SDK, not by our `process.env`** (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, the four `NEXT_PUBLIC_CLERK_*_URL`): legitimately required, consumed inside the vendor SDK rather than our code — the sweep misses them by construction. Keep, and this is the one place the "code reads" count legitimately understates the contract; noted here rather than left as an apparent contradiction.
- **Stale / provider-not-wired** (`FAL_KEY` — the fal.ai residue already tracked in `k175jb1`; `OPENAI_API_KEY`, `TOGETHER_API_KEY` — providers not wired after the purge; `CONVEX_URL` — duplicate of `NEXT_PUBLIC_CONVEX_URL`; `RESEND_API_KEY` — email not wired): prune from `.env.example` or wire the feature. Traced, not silently kept.

## Tenant-residue re-sweep (re-run at first-run time, per T7)

```
grep -rn "VANTAGE_PEERS_API_KEY\|VANTAGE_PEERS_TASK_URL" app/ components/ convex/ lib/ src/
```
→ only `convex/issueReports.ts` (optional, fails soft with a stated condition). No hard tenant value is baked in. **One soft finding:** the variable *names* `VANTAGE_PEERS_*` leak the fleet's own task system to a forker who would wire their own — a naming residue, not a behavioural one. Rename to a generic `ISSUE_REPORT_WEBHOOK_URL` / `ISSUE_REPORT_WEBHOOK_KEY` is the exit, tracked rather than done here.

## What still gates a live one-click button (NOT this document)

The button ships **after** T4 (the identity layer) per the T7 constraint — a public repository serves whatever it contains verbatim, so it must not carry a local auth copy or ungated queries. This document builds the first-run *contract*; the button is the last step.

## The enforcing test (to be built)

A first-run test asserting a fresh clone with only the documented variables starts and reaches its first screen, and **fails naming which variable is missing** if an undocumented required one is read — a first-run that fails silently loses the user in the first minute. That test is the mechanism that keeps this contract true; it is dispatched separately.

---

*Orchestrator: Tau — VantageOS Team | 2026-07-25*
