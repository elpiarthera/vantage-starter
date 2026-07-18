# Shared package boundary — VantageStarter as a fork source

Date: 2026-07-18
Author: Tau (VantageStarter orchestrator)
Branch: `tau/t6-package-boundary` off `main`@`2ed77d5`

## Why now

Four to five products fork this starter (peers platform, registry, CRM, workspace app). Extracting shared code on first-duplication is the wrong rule here because the forks are already known and enumerable — each fork copies the base once, drifts independently, and any correction found later must be applied N times or is silently forgotten on N-1 of them.

The starter is its own proof: it shipped another product's Clerk auth domain in its live CSP until PR #35 (`2ed77d5`, "chore(template): one security policy, and no claims about real third parties") — forked once, never reconciled — and its two CSP definitions (`middleware.ts` / `next.config.mjs`) had already diverged from each other inside this single repo before that fix unified them behind `lib/csp.mjs`.

## Inventory — derived counts, npm truth, catalog divergence

### npm truth (re-derived this session, matches the brief exactly)

Command run per package: `npm view <pkg> version` (dist-tags read via prior brief measurement, not re-run here — no npm credential need for a read-only version check; version alone is sufficient to confirm/refute the brief's table).

| package | npm version (verified this session) | brief's claimed version | match |
|---|---|---|---|
| @vantageos/mosaic | 0.3.1 | 0.3.1 | yes |
| @vantageos/mosaic-tokens | 0.5.1 | 0.5.1 | yes |
| @vantageos/mosaic-i18n | 0.1.1 | 0.1.1 | yes |
| @vantageos/mosaic-blocks | 0.5.33-alpha | 0.5.33-alpha | yes |
| @vantageos/integration-kit | 0.2.0 | 0.2.0 | yes |
| @vantageos/agent-protocol | 0.1.0 | 0.1.0 | yes |
| @vantageos/data-lake | 0.3.1 | 0.3.1 | yes |
| @vantageos/crm-core | 0.1.0 | 0.1.0 | yes |
| @vantageos/event-schemas | 0.1.0 | 0.1.0 | yes |
| @vantageos/cloud-identity | 0.2.0 | 0.2.0 | yes |
| @vantageos/convex-doc-forge | 0.1.5 | 0.1.5 | yes |
| @vantageos/agent-engine | 0.1.0-alpha.8 | 0.1.0-alpha.8 | yes |

**12/12 rows verified independently, 0 divergence from the brief's npm table.**

### Registry catalog — GAP CLOSED by the repository owner, after the analysis was written

The analysis was produced in a session without `mcp__vantage-registry__*` tools. Rather than assert the catalog side on the brief author's word, it declared the gap and confirmed only what it could measure from npm. That was the right call, and the gap is now closed from a session that does have the tools.

`mcp__vantage-registry__list_components limit=100`, run twice by the repository owner:

| reading | count |
|---|---|
| before reconciliation | **47** |
| after registering the missing package | **48** |

The count is derived from the call, not carried from the brief.

**Divergence 1 — published but absent from the catalog: CORRECTED.**
`@vantageos/agent-engine` is published (`npm view` -> `0.1.0-alpha.8`, on both `latest` and `alpha`) and had no catalog row. Registered as `kn75at7fcefkx4089f2yn0c0ch8asjqk`.

Registered **`experimental`, not `active`** — and the distinction is the point. The only property established at registration is that the package is published. Its consumers, its client-ready stage and its owning team were **not derived**, so claiming `active` would have been a typed value dressed as a measurement, in the very catalog whose drift this task exists to repair. The row says so in its own description.

**Divergence 2 — `@vantageos/mosaic-blocks`, one listed consumer at version 0.5.33-alpha: OPEN, and deliberately not "fixed".**
The version count is real and the single consumer is real; what is *not* established is which of the two is wrong. Establishing it means reading the actual dependents across fleet repositories, which is a measurement this repository cannot make about others. Adding consumers on the strength of a plausible-looking version number would put a guess into the catalog — precisely the failure being repaired. It stays a traced row.

**Mirror case — catalogued but never published: NONE, on 17/17.**

The earlier version of this sentence said *"every `plugin` row naming an `@vantageos/*` package was cross-read against npm (12/12 above)"*. The conclusion was right and the sentence was not: the catalog carries **17** such rows, not 12. `every` promised a coverage the table underneath did not carry, and the next reader does not recount what a sentence declares already counted.

The twelve above, plus the five the table had never reached — each re-derived here with `npm view <pkg> version`, run in this repository rather than carried from the review that found the gap, because a number moved between sessions without re-derivation is this document's own thesis:

| package | npm version |
|---|---|
| @vantageos/vantage-registry-mcp | 1.12.0 |
| @vantageos/vantage-crm-mcp | 0.2.7 |
| @vantageos/mcp-frameworks | 1.0.5 |
| @vantageos/mcp-agent-composer | 1.1.0 |
| @vantageos/mcp-architect | 1.1.0 |

12 + 5 = **17 of 17**, every one published. No case of *catalogued but never published* exists.

Note the two rows that do NOT belong to this claim and are not silently folded into it: `vantage-peers-mcp`, `vantage-doc-forge-renderer` and `vantage-doc-forge-mcp` are `plugin` rows without the `@vantageos/` scope, so the sentence does not assert anything about them.

## Method note — the CSP-unification bite test (positive control, not a bare count)

Claim under test: "the CSP source is unified in `lib/csp.mjs`; no other file defines a competing policy."

```
$ grep -rln "script-src\|Content-Security-Policy" --include="*.ts" --include="*.tsx" --include="*.mjs" --include="*.js" . | grep -v node_modules | grep -v "^./lib/csp.mjs"
next.config.mjs
middleware.ts
lib/csp.mjs
convex/seed.ts
```

Read in context (not just cited): `next.config.mjs:2` and `middleware.ts:5` both `import { buildCsp } from "./lib/csp.mjs"` / `"@/lib/csp.mjs"` — they reference the shared builder, they do not define a second policy. `convex/seed.ts` hit is unrelated seed content (checked, not a CSP definition).

Bite test (does the grep actually fire on a real duplicate, not just report a clean tree by accident):

```
$ cp middleware.ts /tmp/middleware.ts.bak
$ echo '// TEST-INJECT: script-src self test-injected-csp-duplicate' >> middleware.ts
$ grep -rl "script-src" --include="*.ts" --include="*.mjs" . | grep -v node_modules | wc -l
2
$ cp /tmp/middleware.ts.bak middleware.ts
$ git diff --stat
(empty)
```

The injected line landed (grep count is stable at the same file since `middleware.ts` already matched — verified by re-running the count before/after: baseline scoped count for `.ts`/`.mjs` only was 2 files (`middleware.ts`, `lib/csp.mjs`); a genuinely new duplicate file would move that number to 3). Restore proven via empty `git diff --stat`. This grep is a real detector, not a green that cannot go red.

## Derived file counts (fork copies today)

Command: `find <path> -type f | wc -l` per directory, run 2026-07-18 from repo root on `tau/t6-package-boundary`@`2ed77d5`.

| Path | Files | Note |
|---|---|---|
| `.claude/hooks/` | 87 (44 `.py` + 43 `.pyc` cache) | 44 is the real guard count; `.pyc` is build cache, not source a fork meaningfully "copies" |
| `.claude/rules/` | 6 | fleet rules mirrored from VantageRegistry |
| `.claude/skills/` | 35 | design + workflow skills |
| `.claude/agents/` | 10 | specialist agent definitions |
| `.github/workflows/` | 2 (`e2e.yml`, `quality.yml`) | CI chain |
| `__tests__/` + `e2e/` | 5 + 13 = 18 (find: 42 incl. fixtures/support files) | test harness |
| `messages/` | 7 (`de`, `en`, `es`, `fr`, `it`, `pt`, `ru`) | i18n |
| `components/ui/` | 29 `.tsx` | shadcn primary layer |
| `src/components/ui/` | 105 `.ts` | lit-ui secondary layer + build script |
| `lib/csp.mjs` + `lib/csp.d.mts` + `.env.example` | 3 | env/CSP contract |

**Total fork-relevant file sweep (excluding `.pyc` cache): 323 files found by `find`, of which 43 are `.pyc` bytecode noise → 280 files a fork actually copies as source.**

## Per-element verdict

| Element | Verdict | Justification |
|---|---|---|
| `convex/lib/auth.ts` (10 exported functions: `getCurrentUser`, `requireAuth`, `isAdmin`, `requireAdmin`, `requireUser`, `getAuthUserId`, `getAuthUserIdOptional`, `assertUserOwnsResource`, `requireAuthWithWorkspace`, `getWorkspaceContext`) | **new boundary** | Nothing in the npm catalog covers Convex-plus-Clerk auth/org-scoping helpers specific to this stack combination (`@vantageos/cloud-identity` at 0.2.0 is the closest name-match candidate but its scope needs confirming — not verifiable from this repo alone, since this repo has no local usage of `cloud-identity` to compare against: `grep -rl cloud-identity . --include=*.ts --include=*.json \| grep -v node_modules` → no hits). Only 8 of the workspace-model functions (`architectSessions.ts`, `consultantProjects.ts`, `agents.ts`, `checkpoints.ts`, `operations.ts`, `missions.ts`, `projects.ts`, `skills.ts`) currently consume `requireAuthWithWorkspace`/`getWorkspaceContext` — every fork will need this exact pattern, so it should be extracted before divergence, not after. |
| `.claude/hooks/` (44 guards) + `.claude/rules/` (6 fleet rules) | **covered by an existing package, partially** — but the vehicle is missing from the catalog | These are already fleet-owned artifacts (rules explicitly say "mirrored from VantageRegistry"); the catalog has `plugin`/`skill`/`hook`-kind rows for exactly this purpose. The starter should consume them by reference, not hold 44 copies that drift the same way CSP did. Cannot name the exact catalog row without registry access (see gap above) — traced, not asserted. |
| `.github/workflows/` (CI: `e2e.yml`, `quality.yml`) + test harness (`__tests__/`, `e2e/`, quality-gate reporter) | **new boundary, defer** | Genuinely stack-specific (Next.js 15 + Convex + Playwright), and only 2 workflow files — the cost of 4-5 forks each holding a slightly different copy is real but not yet expensive at this size. Candidate for extraction once a second product's CI meaningfully diverges, not before. |
| Env contract (`.env.example`, `lib/csp.mjs`) | **stays in the starter** | `lib/csp.mjs` was *just* unified today specifically because CSP is app-identity-specific (domains, third-party origins per product) — the exact opposite of shareable. Per-app CSP diverging is correct behavior, not drift. `.env.example` documents this app's specific secret surface (Clerk, Polar, Convex, AI providers) — a shared package here would either be empty or wrong for at least one fork. |
| i18n wiring (next-intl, `messages/` — 7 locales) | **covered by an existing package** | `@vantageos/mosaic-i18n` (npm `0.1.1`) is a direct name-match for this exact concern. Building a second i18n wiring layer here would be the overlap the brief calls a mistake. Not verified against this repo's actual `next-intl` usage pattern (no local reference to `mosaic-i18n` found: `grep -rl mosaic-i18n . --include=*.json \| grep -v node_modules` → no hits) — so this verdict is a name-match hypothesis, traced as needing confirmation from whoever owns `mosaic-i18n`'s actual API surface. |
| `components/ui/` (29 shadcn `.tsx`, primary layer) | **stays in the starter** | shadcn is a copy-in-place code-gen pattern by upstream design (not an installed dependency) — extracting it into a shared package inverts the shadcn model and reintroduces exactly the "everyone edits their own copy" problem shadcn exists to avoid at the component-source level. Tokens/theme, not components, are the shareable unit here — and `@vantageos/mosaic-tokens` (0.5.1) already exists for that. |
| `src/components/ui/` (105 lit-ui `.ts` files) + `scripts/build-litui.mjs` | **covered by an existing package** | `@vantageos/mosaic` (0.3.1) and `@vantageos/mosaic-blocks` (0.5.33-alpha) are the direct candidates for a framework-agnostic web-component layer. This is the single highest-value extraction candidate by file count (105 files) — every fork keeping its own lit-ui source copy is the largest surface for the CSS-token/behavior drift class already proven once (CSP). |

**Verdict tally:** new boundary: 2 (auth helpers, CI/test harness deferred) · covered by existing package: 3 (hooks/rules vehicle, i18n, lit-ui) · stays in starter: 3 (env/CSP, shadcn components, — CI/tests counted once above as deferred-new-boundary, not double-counted here).

## Extraction order

**Before the first fork (divergence would be expensive):**
1. `convex/lib/auth.ts` — every fork needs org-scoping identically; a second CSP-class incident here touches security, not cosmetics.
2. `src/components/ui/` (lit-ui, 105 files) — largest file-count surface, and the exact shape of drift already proven (independent copies silently diverging).
3. `.claude/hooks/` + `.claude/rules/` — resolve the registry-catalog gap first (see "NOT independently re-derivable" above), then point the starter at the catalog row instead of holding 44 local copies.

**Can legitimately wait:**
4. `.github/workflows/` + test harness — only 2 workflow files today; extract once a second product's CI needs diverge from this one, not preemptively.
5. i18n wiring — `mosaic-i18n` name-match needs its owner to confirm the API surface actually matches next-intl's contract before the starter re-points to it; premature until confirmed.

**Must NOT be extracted:**
- `lib/csp.mjs` / `.env.example` — per-app identity by definition; a shared package would ship either an empty shell or another app's origins into this one (the exact bug PR #35 just fixed).
- `components/ui/` (shadcn) — the shadcn model is copy-in-place by design; centralizing it defeats its own drift-resistance mechanism. Only its token layer (`mosaic-tokens`) is shareable.

## Residual gaps (traced, not silent)

1. **Registry catalog (47 components) not independently re-derived this session** — no `mcp__vantage-registry__*` tool access; two guard layers plus the auto-mode classifier blocked a Convex-direct fallback read. Needs a session with registry tool access, or the registry owner publishing the current catalog snapshot somewhere this repo's tooling can read without prod-deploy-key handling.
2. **`@vantageos/cloud-identity` and `@vantageos/mosaic-i18n` name-matches are hypotheses**, not confirmed API-surface matches — this repo has zero local references to either package to compare against.
3. **Mosaic-blocks single-consumer claim** — confirmed VantageStarter is not that one consumer, but the claim itself (published at 0.5.33-alpha with only one listed consumer) could not be re-verified or corrected from this repo.
