# Generative UI Implementation State — Audit (2026-07-16)

**Scope:** READ-ONLY. Confronts the marketing claim (messages/en.json FAQ, 7 locales) against the code that actually ships. No files modified except this report.

**Verdict up front:** The "tambo" half of the claim is **ABSENT** (not a dependency, not imported, 0 code hits — pre-verified by orchestrator, re-confirmed below). The "json-render" half is **PARTIAL**: a real, working, non-tambo pipeline exists end-to-end, but it does NOT use `@json-render/core`'s catalog/schema validation at runtime, and it is driven entirely by prompt-engineered text parsing, not by tool-calling or `defineCatalog`-backed structured generation. The catalog Zod schemas in `lib/json-render/catalog.ts` are dead code — imported, exported, never consumed.

---

## Claim-by-claim table

| claim (verbatim) | source:line | état | preuve |
|---|---|---|---|
| "AI SDK v6 + Generative UI (**tambo** + json-render)" | `messages/en.json:2654` (`pro_f2`) | **ABSENT** (tambo) | `grep -rni 'tambo' --include='*.ts' --include='*.tsx' app components lib hooks providers convex src scripts` → 0 hits (pre-verified). `grep -c 'tambo' package.json` → 0 (pre-verified). |
| "VantageStarter gives you this pattern out of the box with **tambo orchestration** and json-render for structured output" | `messages/en.json:2669` (`q2_a`) | **ABSENT** (tambo) / **PARTIEL** (json-render) | Same tambo grep as above → 0 hits. json-render: see flow trace below — real but not catalog-validated. |
| "AI: Vercel AI SDK v6, **tambo**, json-render" | `messages/en.json:2675` (`q5_a`) | **ABSENT** (tambo) | Same 0-hit grep. Note: same line also claims "shadcn/ui" which CLAUDE.md explicitly bans in favor of lit-ui — a second, unrelated copy defect in the same sentence (out of scope for this audit but flagged for completeness). |
| Generative UI decision doc: "Generative UI \| json-render (Vercel ecosystem, Zod v4, SpecStream) \| **Rejected alternatives: tambo, CopilotKit**" | `docs/ORCHESTRATION-PLAN.md:33` | N/A — this is a PLAN doc, not a client claim | `sed -n '20,40p' docs/ORCHESTRATION-PLAN.md` → table header "Locked Decisions (non-negotiable)", row: `Generative UI \| json-render... \| tambo, CopilotKit`. This is the opposite of the FAQ claim: tambo was **explicitly rejected**, dated 2026-03-20 per `docs/GENERATIVE-UI-COMPARISON.md:3`. |
| "**json-render** for structured output" — is the flow real? | `messages/en.json:2669` | **PARTIEL** | Full trace below. Real client-side rendering pipeline exists and is wired to a live Convex+Clerk+AI-SDK route. But "structured output" in the AI-SDK sense (`generateObject`/`streamObject`/tool schema) is **not used** — see finding 1 below. |

---

## 1. Is the json-render flow complete? (traced file:line, each link)

**Maillon 1 — model call.** `app/api/architect/chat/route.ts:214-218` and `app/api/consultant/onboard/route.ts:225-229`:
```
const result = streamText({ model, system: fullSystemPrompt, prompt: message });
```
Both routes call plain `streamText` from the `ai` package (AI SDK v6). No `tools`, no `experimental_output`, no `generateObject`/`streamObject`, no reference to `vantageOSCatalog` or the Zod schemas in `catalog.ts`. **Confirmed by grep**: `grep -rn "vantageOSCatalog|defineCatalog|validateSpec" app components lib convex src` → only the 2 hits inside `lib/json-render/catalog.ts` itself (its own definition + import). Zero consumers.

**Maillon 2 — how "structure" is obtained instead.** The system prompt (`lib/architect/prompts.ts:51-61`, `lib/consultant/prompts.ts` — same pattern per its own docblock line 7) instructs the model in plain English to emit **raw JSONL Patch operations** as its entire text output:
```
**CRITICAL OUTPUT FORMAT:**
Output ONLY raw JSONL (newline-delimited JSON Patch operations).
DO NOT wrap in markdown code fences. DO NOT add any text before or after the JSONL.
```
(`lib/architect/prompts.ts:51-54`, verbatim). The prompt then hand-writes the exact prop shapes for `MissionProposal`, `OperationItem`, `Checkpoint` (`lib/architect/prompts.ts:63-83`) — **duplicated by hand**, not derived from `catalog.ts`'s Zod schemas. This is prompt engineering over plain text, not schema-constrained generation.

**Maillon 3 — parsing.** Client-side, `useChatUI` (`node_modules/@json-render/react/dist/index.js:1623-1769`) reads the raw text stream and feeds it to `createMixedStreamParser` (`node_modules/@json-render/core/dist/index.js:434-472`), which line-by-line tries `parseSpecStreamLine` (`index.js:285-297`): if a line starts with `{` and parses as JSON with an `op` and `path` key, it is treated as a JSON-Patch operation (`onPatch`); otherwise it's treated as plain assistant text (`onText`). No schema/catalog validation happens in this parser — it only checks `patch.op && patch.path !== undefined` (`index.js:290`). **A malformed or hallucinated prop shape passes silently** as long as the outer patch shape (`op`/`path`) is syntactically valid; the payload `value` is applied as-is via `applySpecPatch`.

**Maillon 4 — spec application.** `onPatch` callback (`node_modules/@json-render/react/dist/index.js:1699-1701`) calls `applySpecPatch(currentSpec, patch)` and sets `messages[assistantId].spec`. This becomes `msg.spec` consumed by `chat-interface.tsx:392` / `onboarding-chat.tsx:596`.

**Maillon 5 — render.** `AssistantBubble` (`chat-interface.tsx:83-128`, `onboarding-chat.tsx:82-126`) wraps `spec` in `<JSONUIProvider registry={vantageOSRegistry}><Renderer spec={spec} registry={vantageOSRegistry} loading={isStreaming} /></JSONUIProvider>`. `vantageOSRegistry` (`lib/json-render/registry.tsx:148-611`) maps `element.type` string (e.g. `"MissionProposal"`) to a React component and destructures `element.props` directly with `as any` casts on every component signature (e.g. `registry.tsx:149`, `:218`, `:305`...). **No runtime prop validation occurs at render time either** — the registry trusts whatever shape arrived through the patch stream.

**Maillon 6 — confirm/commit.** `ConfirmPlanBar.extractProposal` (`chat-interface.tsx:148-215`) walks `spec.elements` by hand, re-typing every prop via `String(cp.x ?? "")` fallbacks, and calls the Convex mutation `api.missions.createFromProposal` (`chat-interface.tsx:218,231`). This is a real, wired, working commit path — **but it is a second, independent hand-written re-parser** of the spec tree, not the catalog-driven one.

**Conclusion on completeness:** The pipeline IS end-to-end wired (model → text → patch-parser → registry → React → Convex mutation) and is not a stub — `Renderer` is not mounted on a permanently-empty `Spec`. But it is **schema-optional at every layer that matters**: the catalog (`vantageOSCatalog`, `defineCatalog`) exists in source, exports a value, and is **never imported by any consumer** (confirmed by repo-wide grep above). The "structured output" the FAQ implies (constrained/validated generation) is actually free-text-with-a-JSONL-convention, validated nowhere at runtime.

---

## 2. Where exactly does it break, if it breaks?

It does not break in the sense of a dead render (no evidence of a `Renderer` mounted on a spec that can never populate — the patch pipeline does populate `spec` on any syntactically-valid `{"op":...,"path":...}` line). The break is **silent-validation, not silent-render**:

- `lib/json-render/catalog.ts` defines Zod schemas (`missionProposalProps`, `operationItemProps`, etc.) that are **never called** — no consumer imports `vantageOSCatalog`, `missionProposalProps`, or any catalog export outside `catalog.ts` itself (grep above, 0 external hits).
- `validateSpec` — exported by `@json-render/core` (`node_modules/@json-render/core/dist/index.js:77`) specifically for this purpose — is **never imported anywhere in the repo** (grep above, 0 hits app/components/lib/convex/src).
- Net effect: if the model deviates from the hand-written prompt instructions (wrong prop name, missing required field, wrong type), nothing in this pipeline catches it before the registry component destructures `element.props` with `as any` and renders whatever exists (fields silently `undefined` → conditionally-rendered blocks just don't show, per the `{field && (...)}` guards visible throughout `registry.tsx`). This is a **graceful degradation**, not a crash, but it is also **not the "AI cannot hallucinate outside your schema" guarantee** that `docs/GENERATIVE-UI-COMPARISON.md:23` explicitly claims for json-render's architecture ("AI cannot hallucinate outside your schema" — that guarantee requires calling `validateSpec`/the catalog, which this codebase does not do).

**Non prouvé:** whether the model in production actually stays within the hand-written prop contract reliably enough that this gap never surfaces as a visible bug. This audit did not (per ACCEPTANCE CRITERIA instruction) run `pnpm dev` or make a live AI call — no AI provider key is available in this environment. Proving this would require: (a) a valid AI Gateway/Anthropic key, (b) `pnpm dev` + a live session against `/api/architect/chat`, (c) deliberately adversarial prompts to see whether malformed patches ever reach the registry, and (d) inspecting whether `console.error`/telemetry fires on shape mismatch (none was found in the traced files — no `try/catch` around `applySpecPatch` in the vendored `useChatUI`, no error surfaced on invalid element props at render time beyond React's own prop-access `undefined` tolerance).

---

## 3. `lib/json-render/catalog.ts:88` — the `as any` cast

```
88: // Cast to any to work around Zod v4 <-> @json-render/core v0.14.1 type mismatch
89: // eslint-disable-next-line @typescript-eslint/no-explicit-any
90: export const vantageOSCatalog = defineCatalog(schema, {
```
and per-component: `props: missionProposalProps as any` (lines 95, 100, 104, 108, 112, 117, 122, 127, 132).

**What it masks:** it silences a **TypeScript compile-time** type mismatch between the Zod v4 `ZodObject` type and `@json-render/core@0.14.1`'s internal `SchemaType<"zod">` marker type (per the file's own docblock, lines 4-6). This is purely a type-level cast — it does not touch runtime code paths.

**Can it cause silent validation failure at runtime?** This audit finds the question is **moot in practice** for the current codebase, because — as established in finding 1 — **`vantageOSCatalog` is never consumed by anything that would call `validateSpec` against it.** The cast cannot cause an already-non-existent runtime validation to fail silently; there is no runtime validation call site to break. If a future change wires `vantageOSCatalog` into `validateSpec` (the only path where this cast would matter), the `as any` would suppress TypeScript's ability to catch a real prop-shape mismatch between the declared Zod schema and what `@json-render/core` expects internally — at that point it would become a genuine risk. Today: **dead code wrapping dead code**. **Non prouvé au niveau runtime** because there is no runtime call to test; proving actual runtime failure would require first wiring `vantageOSCatalog`/`validateSpec` into the pipeline, which does not exist yet.

---

## 4. Do the two docs describe a delivered state or a plan?

**`docs/GENERATIVE-UI-COMPARISON.md`** — explicitly a comparison/decision doc, not a delivery report:
- Header: `**Date:** 2026-03-20`, `**Researcher:** dev-tech-researcher`, `**Scope:** json-render vs tambo vs OpenGenerativeUI` (lines 3-5).
- TL;DR verbatim: *"json-render (rendering) + Vercel AI SDK v6 — skip tambo and OpenGenerativeUI entirely."* (line ~13). This is a recommendation to **not** use tambo, dated before this audit's date — the opposite of "ships with tambo".
- Scoring tables (json-render scored 8.3/10 with weighted criteria) are evaluation artifacts, not "here's what we shipped" language.

**`docs/ORCHESTRATION-PLAN.md`** — a locked-decisions planning doc:
- Section header `## Locked Decisions (non-negotiable)` (line 28) — the word "Locked" plus a table format is decision-record language, not "here is the shipped feature".
- Row: `Generative UI | json-render (Vercel ecosystem, Zod v4, SpecStream) | tambo, CopilotKit` (line 33) — the third column is explicitly labeled `Rejected alternatives` (line 28's own column header) — tambo is named as a **rejected alternative**, not a used component.
- The doc also lists open issues elsewhere ("Phase 8 deferred", schema fixes needed) — further plan/analysis framing, not a "done" report.

**Verdict:** both docs are plan/comparison artifacts and are internally honest — neither one claims tambo ships. The problem is isolated entirely to `messages/en.json` (and its 7 locale copies, per orchestrator's pre-verified `grep -rli 'tambo'` hit list) — client-facing marketing copy that contradicts both the internal decision record and the actual dependency tree.

---

## Summary for the requester

- **tambo**: 0 evidence anywhere in code or `package.json`. Marketing claims it in 3 places in `messages/en.json` (lines 2654, 2669, 2675) across 7 locale files. Internal docs (`GENERATIVE-UI-COMPARISON.md`, `ORCHESTRATION-PLAN.md`) explicitly record tambo as a **rejected** alternative, dated 2026-03-20. This is a marketing-copy defect, not a docs defect.
- **json-render**: real dependency (`package.json:53-54`, `^0.14.1`), real end-to-end wiring (model → prompt-engineered JSONL-patch text → `createMixedStreamParser` → `Renderer` → registry components → Convex commit mutation). Confirmed working topology by static trace; **not** confirmed working at runtime (no AI key in this environment — "non prouvé", would require a live `pnpm dev` session with a real Anthropic/Gateway key and a manual chat round-trip).
- **Gap vs the marketing claim "structured output"**: the catalog/Zod schemas (`lib/json-render/catalog.ts`) and `validateSpec` (`@json-render/core`) that would deliver actual schema-constrained "structured output" are present in `package.json`/imports but **never invoked** anywhere in the app — confirmed by repo-wide grep, 0 external consumers of `vantageOSCatalog`/`validateSpec`. The real mechanism is hand-written prompt instructions + text parsing, which is materially weaker than the "AI cannot hallucinate outside your schema" property `docs/GENERATIVE-UI-COMPARISON.md:23` attributes to json-render's architecture.

Report path: `/root/coding/vantage-starter/docs/audits/generative-ui-implementation-state-2026-07-16.md`
