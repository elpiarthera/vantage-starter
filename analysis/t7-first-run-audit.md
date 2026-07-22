# T7 — First-run contract audit

Branch: `tau/t7-first-run` (cut from `main`, not committed/pushed — orchestrator instruction).

Goal: make `.env.example` the true, complete contract for a stranger's first run, with an enforced test (`scripts/check-env-contract.mjs` + `scripts/__tests__/check-env-contract.test.js`).

## Method (lower bound, stated explicitly)

`git grep -hoE "process\.env\.[A-Z0-9_]+" -- app components convex lib hooks providers middleware.ts scripts src i18n` derives every name this repo's OWN source reads directly. This is a **lower bound, not the truth**: a vendor SDK can read `process.env.X` inside its own compiled code, invisible to a grep of our source tree. Two such cases were found and are called out individually below, each traced to the exact SDK file that proves the read (`@clerk/nextjs`'s `mergeNextClerkPropsWithEnv.js`, and `resend` + `@convex-dev/resend`'s `client/index.js`) — never classified by pattern-matching the variable name.

## Verdicts — the 9 undocumented (read, absent from `.env.example`)

| Name | Verdict | Evidence |
|---|---|---|
| `CHECK_TRANSLATIONS_ROOT` | Tooling-only | Sole reader: `scripts/check-translations.js:84` (`ROOT = process.env.CHECK_TRANSLATIONS_ROOT \|\| path.join(__dirname, "..")`). A test-harness override for scratch-root isolation (`scripts/__tests__/check-translations.test.js`), never a user value. Correctly absent from `.env.example`. |
| `FIRECRAWL_API_KEY` | Optional, with-default (named failure, not silent) | `convex/lib/firecrawl.ts:75` reads it; absence throws a named `FirecrawlKeyMissingError` (line 32) surfaced as `configMissing: true` on the affected feature (brand kit / competitor scraping), never a silent fallback. Added to `.env.example` as optional. |
| `NEXT_PUBLIC_APP_URL` | Optional, with hardcoded default | `convex/http/orchestration.ts:39` — `process.env.NEXT_PUBLIC_APP_URL ?? "https://vantagestarter.com"`, used to restrict CORS on Convex HTTP actions. Works out of the box for a fork; must be overridden once deployed to your own domain. Added to `.env.example` as optional. |
| `NEXT_PUBLIC_SITE_URL` | Optional, with hardcoded default | Read in `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/[locale]/layout.tsx`, and the accessibility pages — all fall back to `"https://vantagestarter.ai"` (our own domain). Cosmetic-but-real: a fork that never sets this ships SEO metadata pointing at our domain. Added to `.env.example` as optional. |
| `NODE_ENV` | Tooling/framework-managed | Read in `hooks/responsive/useBreakpoint.ts`, `hooks/responsive/useOrientation.ts`, `hooks/responsive/useViewport.ts`, `lib/monitoring/analytics.ts`, `lib/monitoring/errorBoundary.tsx`, `scripts/build-litui.mjs` — all reading a value the Node/Next.js toolchain itself sets based on which script is invoked (`next dev` vs `next build`). Never hand-typed by a user in `.env.local`. Excluded from the contract by design (`TOOLING_ONLY` in `scripts/check-env-contract.mjs`). |
| `POLAR_PRODUCT_TIER_1` / `_2` / `_3` | Optional, with-default | `convex/polar.ts:56-58` — each falls back to `""`, which disables that pricing tier rather than crashing. Required only once you configure real Polar products and want that tier purchasable. Added to `.env.example` as optional (commented, matching the file's existing convention for optional-but-inactive vars). |
| `RENDI_API_KEY` | **Dead / residue — reported, not fixed (out of scope, see below)** | `lib/audio-processing.ts:1,32-33,56,98,168,173` and `lib/rendi-video-processing.ts` (8+ call sites) read it, all gated behind `if (!RENDI_API_KEY) return {success:false,...}`. No route/action in this fork calls these functions — confirmed by `git grep` for their exported function names outside their own file and test doubles. Video-product residue from the fork origin. NOT added to `.env.example` — a public repo should not advertise a paid-vendor key surface for dead code. |

Two additional names surfaced by the `git grep` scope that were not in the orchestrator's original two lists, worth carrying forward because they belong to the same class (SDK-internal-read, invisible to a source grep): `POLAR_ORGANIZATION_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_SERVER` are read inside `node_modules/@convex-dev/polar`'s compiled client (`dist/client/index.js`), configured only via `npx convex env set` per the comment at `convex/polar.ts:70-73`, and are documented in `docs/SETUP.md` Section 11's Convex Dashboard table — never in `.env.example`, since Convex dashboard variables are backend-only and the app's own `.env.local` cannot reach them.

## Verdicts — the 11 documented-but-unread (never a `process.env` hit in our source)

| Name | Verdict | Evidence |
|---|---|---|
| `CLERK_TESTING_TOKEN` | Tooling-only | Sole references: `playwright.config.ts:8,17` (comments describing the skip condition; Playwright/Clerk's own testing-token mechanism reads it, not this repo's code). e2e-only, correctly kept in the E2E section of `.env.example`. |
| `CONVEX_URL` (bare) | **Dead** | Zero `process.env.CONVEX_URL` reads anywhere in `app/components/convex/lib/hooks/providers/middleware.ts/scripts/src/i18n`. Only `NEXT_PUBLIC_CONVEX_URL` is read (`providers/ConvexClientProvider.tsx:10`). `next.config.mjs` has no Convex reference at all. `docs/SETUP.md`'s prior claim ("Required for Vercel builds") was stale documentation — removed from both `.env.example` and `docs/SETUP.md`. |
| `FAL_KEY` | **Dead / residue** | Zero `process.env.FAL_KEY` reads in `app/convex/lib` — the only hits are in `docs/`, `.claude/agents/dev-convex-expert.md` (an example snippet), and `.env.example` itself. `@fal-ai/client` is not even a `package.json` dependency. Video-product residue. Removed from `.env.example` and `docs/SETUP.md`'s tables (was previously marked "Required for AI features", which was false). |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | **Dead** | Zero reads anywhere. `app/ClientProviders.tsx:70` hardcodes `signInFallbackRedirectUrl="/dashboard"`. Clerk's SDK internals were checked (`grep -rl` across `node_modules/@clerk`) — no match either. Removed. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | **Dead** | Same evidence class — `app/ClientProviders.tsx:71` hardcodes `signUpFallbackRedirectUrl="/dashboard"`. Removed. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Required — SDK-internal read** | Never a `process.env` hit in our own source, but confirmed read inside `@clerk/nextjs`'s compiled `mergeNextClerkPropsWithEnv.js` (both `dist/cjs` and `dist/esm`), which `ClerkProvider` (`app/ClientProviders.tsx`) calls internally to resolve its publishable key when no explicit prop is passed. This is the textbook case the brief warned about: a genuinely required variable invisible to a naive grep. Kept in `.env.example`, and the enforced test's `SDK_INTERNAL_REQUIRED` list carries it explicitly rather than silently. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | **Dead** | `app/[locale]/sign-in/[[...sign-in]]/page.tsx:15` (`localizedAuthPath()`) hardcodes the path per-locale; no env read anywhere, including inside `node_modules/@clerk`. Removed from `.env.example` and corrected in `docs/SETUP.md` Section 4.6/4.7/12. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | **Dead** | Same evidence class, `app/[locale]/sign-up/[[...sign-up]]/page.tsx:10`. Removed. |
| `PLAYWRIGHT_BASE_URL` | Tooling-only | Sole reader: `playwright.config.ts:29` — `baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"`. e2e-only. Correctly kept in the E2E section of `.env.example` (documented, not required for `pnpm dev`). |
| `RESEND_API_KEY` | **Required (SDK-internal), degrades gracefully** | Confirmed read inside `node_modules/.pnpm/resend@6.9.4/.../resend/dist/index.{mjs,cjs}` (`this.key = process.env.RESEND_API_KEY`) and `@convex-dev/resend`'s client (`apiKey: process.env.RESEND_API_KEY ?? ""`). Absence does not block signup: `convex/email.ts`'s callers (Clerk webhook handlers) wrap the send in `try { … } catch (error) { … }`, so a missing key degrades to "no email sent" rather than crashing the first-run flow. Classified OPTIONAL in `.env.example` and the SDK_INTERNAL_REQUIRED list (`optional: true`) for exactly this reason — required for a feature (email), not for the first screen. |
| `TOGETHER_API_KEY` | **Dead** | Zero `process.env.TOGETHER_API_KEY` reads anywhere; no Together AI SDK/provider package in `package.json`; `git grep -n "together\|Together"` across `app/lib/convex/src` returns only unrelated string literals (`convex/schema.ts`'s `service: v.string() // 'openai', 'together', 'fal'` comment, prose containing the word "together"). Removed from `.env.example` and `docs/SETUP.md`. |

## Reconciliation (derived, not typed — re-run any time via `node scripts/check-env-contract.mjs`)

- Source-derived names (repro of the orchestrator's sweep, same scan dirs): **16**
- SDK-internal-required names, traced individually: **2** (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` required, `RESEND_API_KEY` optional)
- Documented names in the fixed `.env.example`: **16**
- Missing: **0** — `node scripts/check-env-contract.mjs` exits 0.
- The count is a **lower bound**: any vendor SDK reading an env var neither traced above nor caught by this scan remains a blind spot by construction. The script states this caveat in its own passing output, not just in this file.

## Fleet-wide residue reported, not fixed (explicitly out of T7 scope)

`lib/audio-processing.ts`, `lib/rendi-video-processing.ts`, and `scripts/bb-create-context.ts` read `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`, and `RENDI_API_KEY` — residue from the video product this repository was forked from. Browserbase is banned fleet-wide. These remain on disk; removing them is a decision for the repo owner, stated plainly here (and in `docs/SETUP.md` Section 11) rather than silently inherited or silently fixed.
