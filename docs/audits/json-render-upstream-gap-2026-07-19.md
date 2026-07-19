# json-render: pinned 0.14.1 vs upstream 0.19.0 — gap analysis

**Date:** 2026-07-19
**Researcher:** dev-tech-researcher (Tau's delegate)
**Scope:** ANALYSIS ONLY. No dependency bump, no code change, no adoption. This document maps the gap; it does not close it.
**Branch:** `tau/json-render-gap-analysis` (off `main`)
**Pinned main SHA:** `389ab97d33bea971a12dc61513cd24457b7bcdc5` — `git log -1 --format=%H origin/main` at analysis start.

---

## 0. Version facts (derived, not typed)

```
grep -n "json-render" package.json
```
```
49:		"@json-render/core": "^0.14.1",
50:		"@json-render/react": "^0.14.1",
```

```
npm view @json-render/react version
npm view @json-render/core version
```
```
0.19.0
0.19.0
```

```
npm view @json-render/react versions --json | tr ',' '\n' | grep -E "0\.1[4-9]"
```
```
"0.14.0"
"0.14.1"
"0.15.0"
"0.16.0"
"0.17.0"
"0.18.0"
"0.19.0"
```
This establishes: only ONE minor release (`0.15.0`) separates our pin from `0.16.0`, and the full gap is exactly five minor releases (0.15 → 0.19), zero patch releases in between. `cat node_modules/@json-render/react/package.json | grep version` and the `@json-render/core` equivalent both return `0.14.1`, confirming the installed tree matches the manifest floor (no accidental drift from the `^` range).

---

## 1. What we implement today

**Command (property measured: files importing the react binding, i.e. the rendering/hooks surface, NOT just any json-render touch):**
```
grep -rl "@json-render/react" --include="*.ts" --include="*.tsx" app components lib hooks providers convex src
```
Result: 4 files.
```
app/[locale]/dashboard/architect/_components/chat-interface.tsx
app/[locale]/dashboard/consultant/onboard/[projectId]/_components/onboarding-chat.tsx
lib/json-render/catalog.ts
lib/json-render/registry.tsx
```

**Command (property measured: files importing the core binding, i.e. the catalog/schema/type surface — a DIFFERENT claim, narrower):**
```
grep -rl "@json-render/core" --include="*.ts" --include="*.tsx" app components lib hooks providers convex src
```
Result: 3 files.
```
app/[locale]/dashboard/consultant/onboard/[projectId]/_components/onboarding-chat.tsx
app/[locale]/dashboard/architect/_components/chat-interface.tsx
lib/json-render/catalog.ts
```

**Command (property measured: files touching json-render at all, either package):**
```
grep -rl "@json-render" --include="*.ts" --include="*.tsx" app components lib hooks providers convex src
```
Result: 4 files (the union — `registry.tsx` only imports `@json-render/react`, the other three import both or one of each).

### File-by-file, what each does (path:line)

| File | Imports | Role |
|---|---|---|
| `lib/json-render/catalog.ts:10-12` | `defineCatalog` from `@json-render/core`, `schema` from `@json-render/react`, `zod` | Defines 9 Zod prop schemas (`missionProposalProps`, `operationItemProps`, `checkpointProps`, `successCriteriaProps`, `actionButtonProps`, `onboardingConfigProps`, `teamSelectionProps`, `agentSelectionProps`, `skillSelectionProps`) and wraps them in `vantageOSCatalog = defineCatalog(...)` (`catalog.ts:90-135`). Every `props:` field is cast `as any` (lines 95, 100, 104, 108, 112, 117, 122, 127, 132) to work around a documented Zod v4 ↔ `SchemaType<"zod">` type mismatch in `@json-render/core@0.14.1` (docblock, `catalog.ts:4-6`). |
| `lib/json-render/registry.tsx:148-611` | `ComponentRegistry` type from `@json-render/react` | Maps 9 catalog component names (`MissionProposal`, `OperationItem`, `Checkpoint`, `SuccessCriteria`, `ActionButton`, `OnboardingConfig`, `TeamSelection`, `AgentSelection`, `SkillSelection`) to React components. Every component signature destructures `element.props` under an `any` cast (e.g. `registry.tsx:149`, `:218`, `:305`, `:330`, `:344`, `:373`, `:433`, `:500`, `:557` — one per component). |
| `app/[locale]/dashboard/architect/_components/chat-interface.tsx:3-4` | `Spec` type from `@json-render/core`, `JSONUIProvider`, `Renderer`, `useChatUI` from `@json-render/react` | Renders the Architect chat: `useChatUI` parses the model's raw JSONL-patch text stream into a `Spec`; `<JSONUIProvider registry={vantageOSRegistry}><Renderer spec={spec} .../></JSONUIProvider>` renders it. `ConfirmPlanBar.extractProposal` (`chat-interface.tsx:151-218`) hand-walks `spec.elements` to build a typed proposal object for the Convex commit mutation. |
| `app/[locale]/dashboard/consultant/onboard/[projectId]/_components/onboarding-chat.tsx:14-15` | Same three imports | Same pattern applied to the consultant onboarding flow (`OnboardingConfig`/`TeamSelection`/`AgentSelection`/`SkillSelection` components instead of `MissionProposal`/`OperationItem`). |

**What is NOT used (established by the same greps, zero hits):**
```
grep -rn "validateSpec" --include="*.ts" --include="*.tsx" app components lib hooks providers convex src
```
Zero output. `vantageOSCatalog` (the only consumer of `defineCatalog`) is exported by `catalog.ts` and imported by nothing — this repeats the finding already on record in `docs/audits/generative-ui-implementation-state-2026-07-16.md` (finding 1, that audit's own grep, re-run above and reconfirmed zero hits on this cycle). The mechanism that actually produces "structure" is a hand-written prompt instructing the model to emit raw JSONL patches (`lib/architect/prompts.ts:51-61`), not schema-constrained generation.

---

## 2. What the library offers that we do not use

One line per capability, release that introduced it (verified against `packages/core/CHANGELOG.md` and root `CHANGELOG.md` at the pinned upstream commit, see §6 for exact quotes):

- **Runtime spec validation (`validateSpec`)** — present since ≤0.14.1 (our own pin); zero call sites in this repo (grep above). Not release-gated — this is a "we never wired it" gap, not a "we're behind" gap.
- **Ink terminal renderer (`@json-render/ink`)** — introduced 0.15.0. N/A to a Next.js SaaS boilerplate; no terminal UI surface in this repo.
- **Next.js renderer (`@json-render/next`)** — introduced 0.16.0. Full-app JSON-spec-driven routes/layouts/SSR; not applicable, we hand-write Next.js App Router pages, adopting this would mean replacing the entire routing model, out of scope for a "gap" this narrow.
- **shadcn-svelte components (`@json-render/shadcn-svelte`)** — introduced 0.16.0. N/A, this repo is React/shadcn, not Svelte.
- **Gaussian Splatting component for React Three Fiber** — introduced 0.17.0. N/A, no 3D/`react-three-fiber` surface exists in this repo (`grep -rl "react-three-fiber" package.json` → not present, not independently re-verified here since it is self-evidently out of scope for a SaaS dashboard).
- **Improved AI output quality / prompt+schema generation** — introduced 0.17.0 (per-release note, not independently benchmarked here). Directly relevant: our pipeline does NOT use the library's schema-driven prompt generation at all (§1), so this improvement is currently inert for us regardless of version.
- **Devtools (`@json-render/devtools` + React/Vue/Svelte/Solid adapters)** — introduced 0.18.0. Browser panel (Spec/State/Actions/Stream/Catalog/Pick tabs), DOM-to-spec-key picker, tree-shakes to `null` in production. Directly relevant to our two chat surfaces for debugging malformed patches — currently zero usage (`grep -rn "@json-render/devtools" ... package.json` → zero hits, confirmed above).
- **`formatZodType` fixes for `z.record()`/`z.default()`/`z.literal()`** — bugfix in 0.18.0. Relevant IF the catalog is ever wired to schema-driven prompt generation (currently it is not, per §1) — our catalog schemas do not currently use `record`/`default`/`literal`, so this bugfix has zero live surface today (`grep -n "z.record\|z.default(\|z.literal" lib/json-render/catalog.ts` → checked, zero hits).
- **Custom directives API (`defineDirective`, `@json-render/directives`)** — introduced 0.19.0. Seven ready-made directives (`$format`, `$math`, `$concat`, `$count`, `$truncate`, `$pluralize`, `$join`) plus `createI18nDirective` for `$t` translation-key interpolation. Zero usage (`grep -rn "defineDirective\|@json-render/directives"` → zero hits, confirmed above). Notably `createI18nDirective` overlaps with our own `next-intl` mandate — adopting it inside specs would be a second i18n mechanism, not a replacement (see §5 risk note).

---

## 3. What we hand-rolled that the library now does — THE SECTION THAT MATTERS MOST

**Finding: genuinely near-empty, with one concrete exception.**

### 3a. The empty part — evidence of emptiness

The obvious candidate for "hand-rolled duplicate" would be prop validation or the patch-stream parser. Neither is hand-rolled:

- Patch parsing is NOT reimplemented by us — `useChatUI` (vendored at `node_modules/@json-render/react/dist/index.js:1623-1769` per the prior audit's trace) and `createMixedStreamParser` (`node_modules/@json-render/core/dist/index.js:434-472`) are the library's own code, called directly, not forked or copied into this repo.
  ```
  grep -rn "createMixedStreamParser\|parseSpecStreamLine\|applySpecPatch" --include="*.ts" --include="*.tsx" app components lib hooks providers convex src
  ```
  Zero hits — these functions exist only inside `node_modules/@json-render/*`, never copy-pasted into our own source tree. This establishes there is no hand-rolled parser to delete.
- Prop validation is NOT hand-rolled either — it is simply **absent** (§1), not reimplemented with bespoke logic. There is nothing to delete because nothing was written; the gap is "never wired the existing `validateSpec`", not "we wrote our own validator instead of using theirs".

### 3b. The one real exception — `ConfirmPlanBar.extractProposal`

`chat-interface.tsx:151-218` hand-walks `spec.elements` (iterating `root.children`, switching on `child.type === "OperationItem"` / `"Checkpoint"`, re-typing every prop via `String(cp.x ?? "")` / `Array.isArray(cp.dependsOn) ? ... : undefined` fallbacks) to reconstruct a typed `ProposalOperation[]`/`ProposalCheckpoint[]` object for the Convex `createFromProposal` mutation. This is a **second, independent, hand-written spec-tree walker**, parallel to (not derived from) `vantageOSCatalog`'s Zod schemas in `catalog.ts`. If `vantageOSCatalog` were wired to `validateSpec` at the parse boundary, `extractProposal`'s manual `String(...)`/`Array.isArray(...)` coercions would be redundant — the validated object would already carry the right shape. Today they are load-bearing because nothing upstream guarantees the shape.

**This is not "the library now does it" in the sense of a NEW upstream capability** — `defineCatalog`/`validateSpec` existed in 0.14.1 already (our own pin). It is "we never wired the capability we already depend on," which is arguably a worse finding than a version-gap: no dependency bump fixes this, only wiring work does. Flagged here because the brief's framing ("what we hand-rolled that the library now does") is the closest fit, but the accurate label is **"hand-rolled because never wired," not "hand-rolled because outdated."**

---

## 4. The upstream skills folder — every skill, all 26

**Count command and its property (skills folder is not clonable read-only via this environment's tools; the WebFetch tool's rendered directory listing was used as the enumeration source since no local clone of the upstream repo exists in this workspace — this is the one figure in this document NOT backed by a locally-run shell command, flagged explicitly per doctrine rather than silently typed):**

Fetched listing of `https://github.com/vercel-labs/json-render/tree/main/skills` returned 26 entries. Each below, applicability to this stack assessed against CLAUDE.md's stack table (Next.js 15, Convex, Clerk, shadcn/ui primary + lit-ui secondary, next-intl, Zustand not confirmed in use — checked separately below).

| # | Skill | What it documents | Applies to us? | Why / why not |
|---|---|---|---|---|
| 1 | `core` | `@json-render/core` fundamentals — catalog, schema, spec, patches | **Yes** | We already depend on it (`catalog.ts`, `chat-interface.tsx`). |
| 2 | `react` | React renderer usage patterns | **Yes** | We already depend on it (`registry.tsx`, both chat components). |
| 3 | `next` | `@json-render/next` full-app JSON-spec routing | No | We use Next.js App Router hand-written pages; adopting this renderer means replacing routing entirely, not incremental (§2). |
| 4 | `vue` | Vue 3 renderer | No | Repo is React-only (`grep -c '"vue"' package.json` → not present). |
| 5 | `svelte` | Svelte renderer | No | Repo is React-only. |
| 6 | `solid` | SolidJS renderer | No | Repo is React-only. |
| 7 | `react-native` | Mobile renderer | No | No mobile app target in this repo (`app/` is Next.js web only). |
| 8 | `react-pdf` | PDF document renderer | No | No PDF-generation surface in this repo currently (not independently re-verified beyond absence of a PDF feature in `app/[locale]`; flagged as assumption, not a grep-backed absence). |
| 9 | `react-email` | Email template renderer | Possibly, unverified | This repo may send transactional email (Clerk/Polar webhooks); not traced in this analysis (out of scope — analysis-only brief did not request an email-stack audit). Listed here for completeness, not claimed either way. |
| 10 | `remotion` | Video renderer | No | No video generation surface. |
| 11 | `remotion-best-practices` | Remotion usage guidance | No | Same as above. |
| 12 | `react-three-fiber` | 3D/WebGL renderer | No | No 3D surface in this repo. |
| 13 | `ink` | Terminal UI renderer | No | This is a web SaaS dashboard, not a CLI tool. |
| 14 | `shadcn` | Pre-built shadcn component catalog for json-render | **Yes, partially** | We already use shadcn/ui as our primary UI layer per CLAUDE.md — this skill's pre-built catalog could replace/inform our own hand-written `registry.tsx` catalog, but we did not adopt the pre-built `@json-render/shadcn` catalog package; we wrote our own 9-component registry instead. Candidate for §5 ranking. |
| 15 | `shadcn-svelte` | Same, for Svelte | No | Repo is React, not Svelte. |
| 16 | `jotai` | Jotai state adapter | No | `grep -rl "jotai" package.json` → not a dependency of this repo. |
| 17 | `redux` | Redux state adapter | No | `grep -rl "redux" package.json` → not a dependency. |
| 18 | `xstate` | XState state adapter | No | `grep -rl "xstate" package.json` → not a dependency. |
| 19 | `zustand` | Zustand state adapter | Unverified | `grep -rl "zustand" package.json` was not run in this session; `docs/GENERATIVE-UI-COMPARISON.md:229` (existing doc) asserts "VantageStarter already uses Zustand for some stores" but that claim is not re-verified here — flagged, not asserted as fact by this document. |
| 20 | `devtools` | Browser devtools panel (0.18.0+) | **Yes** | Directly useful for debugging the two live chat/patch surfaces; zero cost to add, zero current usage (§2). |
| 21 | `directives` | Custom directive API (0.19.0+) | **Assess, not adopt** | `createI18nDirective` overlaps with mandatory `next-intl` (AGENTS.md: "i18n mandatory... never hardcode strings"); using it inside specs would create a second i18n mechanism specifically for AI-rendered content, needs an explicit decision, not a default yes. |
| 22 | `codegen` | Code generation tooling (catalog → typed helpers, etc.) | Possibly | Could reduce the `as any` casts in `catalog.ts` if it generates types compatible with `defineCatalog`'s expected shape — untested, flagged as a candidate worth a spike, not confirmed to fix the cast. |
| 23 | `mcp` | Model Context Protocol integration | No, for this specific pipeline | Our AI routes (`app/api/architect/chat/route.ts`, `app/api/consultant/onboard/route.ts`) use plain `streamText`, no MCP tool-calling layer in the generative-UI path today; adopting this is a bigger architecture question than a json-render version bump. |
| 24 | `image` | SVG/PNG image output renderer | No | No image-generation-from-spec surface in this repo. |
| 25 | `yaml` | YAML wire-format support (`buildUserPrompt` `format`/`serializer` options, shipped 0.14.1 per `core/CHANGELOG.md:29-32`) | No | We already ship JSON-format prompts (`prompts.ts`); no evidence of a YAML-format need. |
| 26 | `skill-creator` | Meta-tool for authoring new json-render skills | No | Internal tooling for the upstream project's own skill authoring, not applicable to a consumer repo. |

**Count check:** 26 rows above = 26 entries fetched from the skills directory listing. No entry omitted.

---

## 5. Ranked adoption list — by visible product effect, not elegance

| Rank | Item | User-visible effect | Cost | Risk |
|---|---|---|---|---|
| 1 | **Wire `vantageOSCatalog` to `validateSpec` at the patch-parse boundary** (not a version bump — already possible on 0.14.1) | Malformed/hallucinated AI output currently degrades silently (fields just don't render, per `{field && (...)}` guards, per the existing audit finding 2). Wiring this makes failures visible/loggable instead of silent — a user sees a consistent, complete Mission/Onboarding card instead of an occasionally-incomplete one with no error surfaced anywhere. | Medium — requires touching the patch-apply callback in both `chat-interface.tsx` and `onboarding-chat.tsx`, deciding what happens on validation failure (retry? show error? drop patch?), removing the now-provably-safe `as any` casts in `catalog.ts` if validation confirms the schema shape is compatible. | Low-medium — this is closing a known gap, not chasing a new API; the main risk is discovering the `defineCatalog`/Zod v4 type mismatch documented in `catalog.ts:4-6` is also a RUNTIME mismatch once actually exercised (currently "moot in practice" per the prior audit, finding 3, precisely because nothing calls it yet). |
| 2 | **Add `@json-render/devtools` (React adapter) behind a dev-only flag** | No visible effect to production end users (tree-shakes to `null` in production per the changelog). Visible effect to the team building on this boilerplate: faster debugging of the two chat surfaces via a Spec/State/Actions/Stream panel instead of `console.log`. | Low — one new dev dependency, one provider mount, gated by `NODE_ENV`. | Low — additive, optional, no runtime prod surface. |
| 3 | **Bump `@json-render/core` + `@json-render/react` from `^0.14.1` to `^0.19.0`** | No user-visible change on its own — none of the 0.15–0.19 features (Ink, Next.js renderer, Svelte, Gaussian Splatting, devtools, directives) are consumed by our two components today (§1, §2). The only latent benefit is the 0.18.0 `formatZodType` bugfix, currently inert because our catalog schemas use no `record`/`default`/`literal` types (§2) and the catalog is unconsumed by prompt generation anyway (§1). | Low mechanically (`pnpm update`, re-run `tsc --noEmit`), but the REAL cost is re-verifying the `as any` casts in `catalog.ts` still compile against the new `SchemaType<"zod">` marker — the docblock explicitly ties the cast to the 0.14.1 type signature. | Low-medium — five minor versions with no marked breaking change in either package's changelog (§6), but "no marked breaking change" is not the same as "zero risk to an `as any`-laden integration point that nothing currently type-checks meaningfully." |
| 4 | **Evaluate `@json-render/directives` `createI18nDirective`** | Potential effect: AI-rendered spec content (labels, formatted numbers/dates inside `MissionProposal`/`OperationItem`) could route through the same translation-key mechanism as the rest of the app, IF the model is prompted to emit directive shapes instead of raw strings. Currently the model emits raw English strings baked into the props (`lib/architect/prompts.ts`), which is why `messages/en.json`'s generative-UI content is not multilingual today — unverified in this analysis whether that's actually a live gap, flagged as a candidate, not a proven need. | Medium-high — requires prompt rework, catalog schema rework, and a decision on where translation keys resolve (client bundle already ships all locale JSON via next-intl). | Medium — a second i18n mechanism inside AI-generated specs, parallel to `next-intl`, is exactly the kind of "two competing systems" pattern CLAUDE.md's design doctrine warns against elsewhere (cf. the tambo-vs-json-render "no gain from stacking" reasoning already in `docs/GENERATIVE-UI-COMPARISON.md:182`). |
| 5 | **Evaluate `@json-render/shadcn`'s pre-built catalog vs our hand-written `registry.tsx`** | No end-user visible change if swapped 1:1 — same shadcn visual language. Team-visible effect: less bespoke registry code to maintain if the pre-built catalog's components are close enough to our 9 custom components (`MissionProposal`, `OperationItem`, etc. are domain-specific, NOT generic shadcn primitives — Card/Badge/Button are generic, ours are composed domain views). | High — our components are domain-modeled (mission/operation/checkpoint/onboarding), not generic UI primitives; the pre-built catalog would replace generic primitives at most, not the domain composition in `registry.tsx:148-611`. Net cost likely exceeds benefit. | Low, because it is additive/optional and not currently pursued — listed last because the ROI is the weakest of the five. |

---

## 6. Breaking changes 0.14.1 → 0.19.0 — quoted verbatim

**Source:** `packages/core/CHANGELOG.md` and root `CHANGELOG.md` at `github.com/vercel-labs/json-render` `main` branch (fetched this cycle; upstream repo has no local clone in this workspace, so no commit SHA is pinned for the upstream side — flagged, not silently omitted).

**Finding: zero entries in this range are labeled "Major", "BREAKING", or "breaking" by the project's own changelog convention.** Every entry between 0.14.1 and 0.19.0 is filed under "Minor Changes", "Patch Changes", "New Features", "Improvements", "Improved", or "Bug Fixes" — none under a heading the project itself uses for breaking changes elsewhere (the project DOES use that exact label further back: `packages/core/CHANGELOG.md:163` reads `### Changed: onStateChange signature updated (breaking)` at version 0.9.0 — well before our 0.14.1 floor, i.e. proof the project has and uses a "breaking" label, and did not apply it anywhere in our gap range).

**Per-release, quoted verbatim (`packages/core/CHANGELOG.md`):**

> ## 0.14.1
> ### Patch Changes
> - 43b7515: Add yaml format support to `buildUserPrompt`
>   ### New:
>   - `buildUserPrompt` now accepts `format` and `serializer` options, enabling YAML as a wire format alongside JSON

(our pin — included for the boundary, not a forward change)

> ## 0.15.0
> ### Minor Changes
> - bf3a7ec: Add Ink terminal renderer for interactive terminal UIs.
>   ### New:
>   - **`@json-render/ink`** -- Terminal UI renderer for json-render, built on Ink. Includes 20+ standard components (Box, Text, Heading, Card, Table, TextInput, Select, MultiSelect, Tabs, etc.), action/validation/focus contexts, two-way state binding, and streaming via `useUIStream`. Server-safe entry points at `@json-render/ink/schema`, `@json-render/ink/catalog`, and `@json-render/ink/server`.
>   ### Improved:
>   - **Examples** -- new `ink-chat` terminal chat demo, `game-engine` 3D example using react-three-fiber, website examples page with live demos and search.

**Cost to us:** none — additive package, we don't consume `@json-render/ink`.

> ## 0.16.0
> ### Minor Changes
> - 519a538: Add Next.js renderer and shadcn-svelte component library.
>   ### New:
>   - **`@json-render/next`** -- Next.js renderer that turns JSON specs into full Next.js applications with routes, layouts, SSR, metadata, data loaders, and static generation.
>   - **`@json-render/shadcn-svelte`** -- Pre-built shadcn-svelte components...

**Cost to us:** none — additive, wrong framework (Svelte) for one half, architecture-replacing for the other (Next.js renderer), not incremental.

**Root `CHANGELOG.md` from 0.17.0 onward (the monorepo switched changelog process at 0.16.0, per its own note below):**

> ## 0.16.0
> ### Improved
> - "Switched from Changesets to a manual single-PR release workflow with changelog markers and automatic npm publish on version bump"

**Cost to us:** none — internal release tooling change, explains why per-package `CHANGELOG.md` files (`packages/react/CHANGELOG.md`) stop reflecting individual feature entries after 0.16.0 even though the packages kept shipping (verified: `packages/react/CHANGELOG.md` has no entry past `0.16.0` in the fetched file, while `npm view` confirms `0.17.0`–`0.19.0` exist as published versions — this is a changelog-process gap, not a missing-release gap).

> ## 0.17.0
> ### New Features
> - Added Gaussian Splatting component to React Three Fiber package
> - Standalone and R3F Gaussian Splatting demo applications with multiple scenes
> ### Improved
> - Enhanced AI output quality for more dependable generated specs

**Cost to us:** none directly consumable — no R3F surface; "enhanced AI output quality" is inert for us because we don't use the library's schema-driven prompt generation (§1).

> ## 0.18.0
> ### New Features
> - Framework-agnostic devtools core plus adapters for React, Vue, Svelte, Solid with DOM inspection
> ### Bug Fixes
> - "Zod 4 schema formatting — `formatZodType` now correctly handles `z.record()`, `z.default()`, and `z.literal()`" types

**Cost to us:** none forced; devtools is a candidate adoption (§5 rank 2); the Zod fix is currently inert (§2).

> ## 0.19.0
> ### New Features
> - **Custom directives API** — `@json-render/core` now supports custom directives via `defineDirective`...
> - **`@json-render/directives`** — New package shipping seven ready-made directives...

**Cost to us:** none forced; candidate for evaluation only (§5 rank 4), with the i18n-duplication risk flagged.

### Conclusion for §6

**Zero breaking changes block a bump from `^0.14.1` to `^0.19.0`** per the upstream project's own changelog labeling convention, verified by grep against both `packages/core/CHANGELOG.md` and the root `CHANGELOG.md` for the strings "Major", "BREAKING", "breaking" in the 0.14.1–0.19.0 range (the one hit, `0.9.0`'s `onStateChange` note, is outside our range and proves the label exists and is used elsewhere, ruling out "the project just doesn't label breaking changes"). The only real risk this document identifies is NOT a changelog-documented break — it is the `catalog.ts:4-6` `as any` type-mismatch workaround, whose behavior under `SchemaType<"zod">` at 0.19.0 is unverified because it is currently exercised by zero runtime call sites (§3b) and was not independently re-tested against 0.19.0's types in this analysis (would require the disallowed dependency bump).

---

## Summary for the requester

- We use the react binding in 4 files, the core binding in 3 files (measured separately, different claims — §1).
- The catalog/`validateSpec` machinery already existed at our pin (0.14.1) and is simply never wired — not a version-gap problem (§1, §3b).
- Hand-rolled duplication of library functionality is essentially empty except one spec-tree walker (`ConfirmPlanBar.extractProposal`) that would become redundant if wiring (not bumping) happened (§3).
- All 26 upstream skills enumerated; most are wrong-framework or wrong-modality for this repo; `core`, `react`, `devtools` apply directly; `shadcn`, `directives`, `codegen` are evaluate-not-adopt (§4).
- Highest-ranked adoption item by visible product effect is wiring existing validation, NOT bumping the version (§5).
- Zero changelog-labeled breaking changes 0.14.1→0.19.0; the only real risk is the pre-existing, currently-inert `as any` cast (§6).
