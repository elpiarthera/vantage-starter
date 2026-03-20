# Generative UI Library Comparison

**Date:** 2026-03-20
**Researcher:** dev-tech-researcher
**Scope:** json-render vs tambo vs OpenGenerativeUI
**Use case:** VantageStarter boilerplate — Architect use case (AI proposes mission plan → renders interactive UI → human confirms → commits to DB)

---

## TL;DR

These three libraries solve **different layers** of the same problem. They can be composed. The optimal stack for VantageStarter is:

**json-render (rendering) + Vercel AI SDK v6 — skip tambo and OpenGenerativeUI entirely.**

> **Note on input modalities (added 2026-03-20):** VantageStarter supports three input modalities for the Architect: (1) text chat via the chat interface, (2) json-render visual rendering for structured plan output, and (3) voice via ElevenLabs Conversational AI (WebRTC). Voice is the primary input mechanism — it is not a layer managed by json-render or the generative UI libraries. ElevenLabs handles STT/TTS; json-render handles the structured visual output the voice agent produces.

---

## Individual Evaluations

### 1. json-render (`vercel-labs/json-render`)

**Core purpose:** Rendering layer only. Converts AI-generated JSON into React components using a predefined catalog. AI cannot hallucinate outside your schema.

**Architecture:**
- Three-step pattern: Define catalog (Zod schemas) → Register components (map schemas to React) → Render specs (`<Renderer>` component)
- Schema-constrained: AI output is validated against Zod before rendering — no arbitrary component injection
- `useUIStream` + `useChatUI` hooks for streaming JSON as it arrives from the LLM
- Separation of concerns: AI layer is completely external to the library

**AI SDK version:** None — AI SDK agnostic. The library receives JSON output from whatever AI pipeline you run. No `ai` package dependency.

**Convex compatibility:** Not explicitly addressed. Since it's AI-SDK-agnostic, you wire your own Convex actions to produce JSON → feed to renderer. Compatible in practice.

**Next.js App Router:** Yes. React 19 peer dependency. Works in Client Components. Streaming via `useUIStream` is client-side.

**Rendering approach:** Client-side component mapping. Registry maps JSON spec keys to React components. Props are streamed progressively via `SpecStream`. No iframe sandboxing — direct React render tree.

**License:** Apache 2.0 (Vercel Inc.)

**Maturity:**
- 12,800 GitHub stars
- 23 packages in monorepo (React, Vue, Svelte, Solid, React Native, PDF, Email, 3D...)
- React peer dep: `^19.2.3` (React 19 required — hard constraint)
- Zod v4 (`^4.3.6`)
- Very active — Vercel-backed

**Scoring:**

| Criterion | Weight | Score | Notes |
|-----------|--------|-------|-------|
| API quality | 25% | 9/10 | Clean 3-step API, excellent TypeScript, Zod-native |
| Maintenance | 20% | 9/10 | Vercel-backed, active monorepo |
| Community | 15% | 8/10 | 12.8k stars, broad ecosystem |
| Bundle size | 15% | 8/10 | Modular, only import what you need |
| Compatibility | 15% | 7/10 | React 19 hard req; AI-SDK agnostic (flexible) |
| Documentation | 10% | 7/10 | Good examples, but integration docs sparse |
| **Total** | | **8.3/10** | |

---

### 2. tambo (`tambo-ai/tambo`)

**Core purpose:** Full-stack generative UI toolkit. Handles AI orchestration, component registration as tool calls, streaming props, state management, and MCP integration. Think "AI SDK + rendering" in one.

**Architecture:**
- Components registered with Zod schemas → schemas become LLM tool definitions
- AI calls components like functions; tambo streams props as they're generated
- Two component types: Generative (one-shot render) and Interactable (persist + update on refinement)
- Own agent execution layer — does NOT use Vercel AI SDK `ai` package
- Backend: Tambo Cloud (hosted) or self-hosted via Docker + Supabase
- MCP built-in for external tool integration (Linear, Slack, etc.)
- `@ag-ui/core` for agent-UI communication protocol

**AI SDK version:** None — tambo has its own agent runtime. Uses `openai` SDK v6 in core, `@tambo-ai/typescript-sdk` as abstraction. Supports OpenAI, Anthropic, Gemini, Mistral, Cerebras via Tambo Cloud. No Vercel `ai` package.

**Convex compatibility:** Not addressed in docs. The self-hosted backend runs Supabase (not Convex). Using Convex as primary DB while tambo self-hosted is architecturally complex — two competing backends.

**Next.js App Router:** React 18/19 compatible. `TamboProvider` wrapper is a Client Component. Works with App Router but server-side AI generation requires their backend.

**Rendering approach:** Client-side. Components render in the React tree. Props streamed via `@ag-ui/core` protocol. `withInteractable()` HOC for persistent components.

**License:** MIT (from README reference)

**Maturity:**
- 11,100 GitHub stars
- Very active: 5,309 commits, Discord community, January 2026 activity
- Version `@tambo-ai/react` 1.2.3, `@tambo-ai/client` 0.1.0
- React 18 or 19 (flexible — better than json-render)

**Scoring:**

| Criterion | Weight | Score | Notes |
|-----------|--------|-------|-------|
| API quality | 25% | 8/10 | Clean component registration, good DX |
| Maintenance | 20% | 9/10 | Very active, 5k+ commits |
| Community | 15% | 8/10 | 11.1k stars, Discord |
| Bundle size | 15% | 6/10 | Pulls in Supabase backend if self-hosting |
| Compatibility | 15% | 5/10 | Backend conflicts with Convex; no Vercel AI SDK |
| Documentation | 10% | 7/10 | Good self-hosting docs, SELF-HOSTING.md exists |
| **Total** | | **7.3/10** | |

---

### 3. OpenGenerativeUI (`CopilotKit/OpenGenerativeUI`)

**Core purpose:** Demo/reference implementation — not a library. Shows how to use CopilotKit v2 with LangGraph (Python) to generate HTML components rendered in sandboxed iframes.

**Architecture:**
- Turborepo: Next.js 16 frontend + LangGraph Python backend
- Agent generates raw HTML → `useComponent` hook → sandboxed `<iframe>` render
- ResizeObserver auto-sizes iframes
- No component registry — AI generates arbitrary HTML (no schema constraints)

**AI SDK version:** None — uses CopilotKit v2 on frontend, LangGraph Python on backend. No Vercel `ai` package.

**Convex compatibility:** None. Python LangGraph backend is the compute layer.

**Next.js App Router:** Yes (Next.js 16 used in the demo).

**Rendering approach:** iframe sandboxing. AI generates raw HTML strings. No type safety on output. Security through sandboxing rather than schema constraints.

**License:** MIT

**Maturity:**
- 845 GitHub stars (10x fewer than the others)
- Last commit: January 20, 2026
- 61% TypeScript, 25% CSS, 11% Python
- This is a demo repo, not a published package — no npm package

**Scoring:**

| Criterion | Weight | Score | Notes |
|-----------|--------|-------|-------|
| API quality | 25% | 3/10 | No API — it's a demo template |
| Maintenance | 20% | 4/10 | Low activity, demo repo |
| Community | 15% | 3/10 | 845 stars |
| Bundle size | 15% | N/A | Not a package |
| Compatibility | 15% | 2/10 | Python backend required, no Convex |
| Documentation | 10% | 5/10 | README is clear but scope is narrow |
| **Total** | | **3.3/10** | |

**Verdict: Eliminate.** Not a library — a demo. Python backend is incompatible with our stack.

---

## Comparative Analysis

### Are they solving the same problem or different layers?

| Layer | json-render | tambo | OpenGenerativeUI |
|-------|------------|-------|-----------------|
| AI orchestration | No (bring your own) | Yes (built-in agent) | Yes (LangGraph Python) |
| Component registry | Yes (catalog + Zod) | Yes (Zod → tool defs) | No (raw HTML) |
| Streaming | Yes (SpecStream) | Yes (prop streaming) | No |
| State management | Yes (Redux/Zustand/Jotai adapters) | Yes (built-in + Interactable) | No |
| Type safety | Strong (Zod v4) | Strong (Zod) | None |
| Backend required | No | Yes (Cloud or Docker+Supabase) | Yes (Python LangGraph) |
| npm package | Yes | Yes | No |

**json-render = pure rendering layer.** You bring the AI, it renders the output.
**tambo = full-stack generative UI.** AI orchestration + rendering + state, but tied to their backend.
**OpenGenerativeUI = demo only.** Not composable.

---

### Can they be composed?

**json-render + tambo: Theoretically yes, practically redundant.**
- tambo handles AI orchestration AND component rendering
- json-render handles rendering only
- You could use tambo's agent to generate JSON specs that json-render renders — but you'd be bypassing tambo's own rendering, negating its value
- The protocols differ: tambo streams via `@ag-ui/core`, json-render expects JSON specs via `useUIStream`

**json-render + Vercel AI SDK (our stack): Clean fit.**
- Use Convex actions to call the LLM (via `@ai-sdk/anthropic`)
- Return JSON spec validated against Zod
- Feed to json-render's `<Renderer>` on the client
- Full control, no external backend dependency

**tambo + json-render + CopilotKit: No. Three competing rendering/orchestration systems. No gain.**

---

### Optimal combination for VantageStarter

**Recommended stack: json-render + Vercel AI SDK v5 (current stack) + Convex**

Architecture:
```
User input
  → Convex action (server-side)
    → @ai-sdk/anthropic generateObject() with Zod schema
    → Returns validated JSON spec
  → Stored in Convex DB (pending confirmation)
  → Client reads via useQuery()
    → json-render <Renderer> renders the spec
    → User confirms/edits
  → Mutation commits confirmed spec to DB
```

Why this beats tambo for VantageStarter:
- No external backend — Convex IS the backend
- AI SDK v5 already in the stack (or v6 migration path clear)
- json-render is schema-constrained — no hallucinated components
- React 19 requirement matches our Next.js 15 setup
- Apache 2.0 license — commercial-safe
- Vercel-backed — long-term maintenance guaranteed

**What to skip:**
- tambo: Supabase backend conflicts with Convex. Self-hosting adds operational complexity. Their rendering overlaps with json-render.
- OpenGenerativeUI: Demo, not a library. Python dependency. No type safety.

---

### Which handles the Architect use case best?

**Architect use case:** AI proposes a mission plan → renders as interactive UI → human confirms → commits to DB.

**json-render wins.** Here's why:

1. **Schema constraints match the use case exactly.** A mission plan has a defined structure (objectives, steps, resources, timeline). Define it as a Zod schema in the catalog. The AI cannot hallucinate outside it.

2. **Confirmation flow is natural.** Render the plan spec via `<Renderer>`. Attach an `emit` action to the confirm button. On confirm, write the spec to Convex via mutation. The JSON IS the data model — no serialization step.

3. **Streaming UX.** `SpecStream` progressively reveals the plan as the LLM generates it. Users see the plan build in real-time before confirming.

4. **State adapters.** json-render has Zustand adapter built-in. VantageStarter already uses Zustand for some stores — zero new dependencies.

5. **Interactability.** The `emit` function on components lets users edit individual fields of the plan before confirming — no custom interaction layer needed.

**tambo would work too** — Interactable components are designed for exactly this refinement loop. But it requires running their backend alongside Convex, which adds friction. json-render + our existing stack is cleaner.

---

## Final Recommendation

**Adopt json-render. Assess tambo for future consideration. Eliminate OpenGenerativeUI.**

| Library | Verdict | When to reconsider |
|---------|---------|-------------------|
| json-render | **Adopt** | Now — Architect use case ready |
| tambo | Assess | If we ever decouple from Convex as primary backend |
| OpenGenerativeUI | Hold | Never — demo only |

**Implementation path for VantageStarter:**
1. Install `@json-render/react` + `@json-render/shadcn`
2. Define mission plan Zod schema in catalog
3. Register shadcn components in registry (Card, List, Badge, Button)
4. Add Convex action: `generateMissionPlan` → calls LLM with structured output → stores pending spec
5. Add client page: `useQuery(pendingPlan)` → `<Renderer spec={plan} />` → confirm button → `useMutation(commitPlan)`
6. Done — full Architect loop in ~200 lines

**Risk:** React 19 peer dep is a hard constraint. Verify VantageStarter is on React 19 before installing.

---

## Sources

- github.com/vercel-labs/json-render (README, package.json files, LICENSE)
- github.com/tambo-ai/tambo (README, react-sdk/package.json, packages/core/package.json, packages/client/package.json)
- github.com/CopilotKit/OpenGenerativeUI (README)
- npm: @tambo-ai/react v1.2.3 — no Vercel AI SDK dependency confirmed
- npm: @json-render/react — React 19 peer dep, no AI SDK dep confirmed
- json-render LICENSE: Apache 2.0, Copyright 2025 Vercel Inc.
- elevenlabs.io/docs/conversational-ai — WebRTC, clientTools bridge, voice agent config
- docs/ELEVENLABS-INTEGRATION-PLAN.md — VantageStarter voice Architect integration spec
