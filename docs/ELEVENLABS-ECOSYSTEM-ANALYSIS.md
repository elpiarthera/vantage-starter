# ElevenLabs Ecosystem Analysis

**Date:** 2026-03-20
**Context:** ElevenHacks Firecrawl + ElevenAgents challenge (deadline: March 26, 2026) + VantageStarter integration + perello-elevenlabs plugin scoping
**Confidence:** High (all claims sourced from official repos and docs)

---

## 1. Repo-by-Repo Breakdown

### 1.1 `elevenlabs/skills`

**What it does:** Agent Skills spec repository — provides skill definitions for TTS, STT, Conversational Agents, Sound Effects, and Music using the ElevenLabs SDK.

**Tech stack:**
- Python 82%, Shell 17%
- `elevenlabs` Python SDK + `@elevenlabs/elevenlabs-js` npm package
- Designed for AI coding assistants, not web apps

**Key features:**
- `agents/SKILL.md` — full CLI-driven agent management (`elevenlabs agents init/add/push/pull/list`)
- Templates: `complete`, `minimal`, `voice-only`, `text-only`
- Tools definition (webhook, client, built-in system tools)
- Outbound phone calls via Twilio

**Relevance for us:**
- Direct reference for how ElevenLabs thinks about agent composition
- The SKILL.md format is a Claude Code skill spec — structurally identical to our `.claude/skills/` format
- Low direct reuse: Python-heavy, not Next.js

---

### 1.2 `elevenlabs/showcase`

**What it does:** Community showcase of projects built with ElevenLabs — live at showcase.elevenlabs.io.

**Notable projects:**
| Project | Description |
|---------|-------------|
| ElevenLabs UI | Prebuilt Agent & Audio components (this is the ui repo) |
| Gibberlink | AI-to-AI communication in a shared audio language — won the a16z hackathon |
| Jinglemaker | Converts web content (URLs) into jingle music |
| MCP Voice Agents | Full ElevenLabs platform via Claude/Cursor MCP |
| SB1 Infinite Soundboard | SFX API showcase |
| Radiai | AI music radio |

**Pattern: Jinglemaker is the closest to our challenge** — it combines web content extraction with ElevenLabs generation. No Firecrawl usage found in showcase as of March 2026.

**Relevance:** Competitive reference. None directly combine Firecrawl + ElevenAgents. The gap is open.

---

### 1.3 `elevenlabs/plugins`

**What it does:** Two Claude Code plugins — `elevenlabs-stt` (speech input for Claude Code) and `elevenlabs-tts`.

**Tech stack:** Python 100%, daemon-based, keyboard shortcuts (Ctrl+Shift+Space)

**Structure:**
```
plugins/
├── .claude-plugin/
├── stt/
├── tts/
├── CLAUDE.md
└── README.md
```

**Integration method:** `npm` marketplace add + `/plugin install elevenlabs-stt`

**Key insight:** This is the STT/TTS layer for Claude Code itself — not for app development. Two separate plugins follow the `.claude-plugin/` manifest pattern identical to ours.

**Relevance for perello-elevenlabs plugin:** Shows the marketplace structure we should follow. Our plugin will be app-dev focused (Next.js integration), not IDE voice input.

---

### 1.4 `elevenlabs/elevenlabs-agents-mcp-app`

**What it does:** MCP server that lets Claude Desktop create and manage ElevenLabs conversational agents through an interactive UI.

**Tech stack:**
- TypeScript 97.5%
- Vite + React 19 + Tailwind CSS 4
- `@modelcontextprotocol/sdk` ^1.25.2
- `@elevenlabs/elevenlabs-js` ^2.31.0
- `@elevenlabs/react` ^0.13.0
- Three.js (`@react-three/fiber`, `@react-three/drei`) — for Orb component
- `@anthropic-ai/mcpb` for bundling

**5 MCP tools exposed:**
| Tool | Description |
|------|-------------|
| `show_agent_creator` | Opens interactive visual UI |
| `create_agent` | Programmatic agent creation |
| `get_agent_config` | Fetch existing config |
| `update_agent` | Modify agent settings |
| `search_voices` | Query available voices with preview |

**Key ElevenLabs API calls:**
- `getClient().conversationalAi.createAgent()` — creates agent with LLM (defaults to `claude-haiku-4-5`), TTS config, conversation config
- `getClient().conversationalAi.getAgent()`
- `getClient().conversationalAi.updateAgent()`
- `getClient().voices.getAll()`

**Architecture pattern:**
```
Claude Desktop → MCP tools → ElevenLabs REST API → Agent config stored in ElevenLabs cloud
```

**Relevance for our Claude Code plugin:** This is the MCP integration model we should adopt. Our `perello-elevenlabs` plugin should expose similar tools but adapted for Next.js project scaffolding rather than desktop agent management.

---

### 1.5 `elevenlabs/elevenlabs-nextjs-starter`

**What it does:** Official Next.js starter demonstrating all 6 ElevenLabs audio features with a full UI.

**Tech stack:**
- Next.js 15.3.8 + React 19.1.1
- TypeScript 5.9.2
- Tailwind CSS 4.1.12
- `@elevenlabs/elevenlabs-js` ^2.10.0 — REST API client
- `@elevenlabs/react` ^0.5.0 — `useConversation` hook
- WaveSurfer.js 7.10.1 + `@wavesurfer/react` — audio visualization
- React Hook Form 7 + Zod 3 — form validation
- iron-session — server-side session management
- pnpm, shadcn/ui, Radix UI

**Route structure:**
```
app/
├── (examples)/
│   ├── conversational-ai/     ← useConversation + agent selector
│   ├── music/                 ← AI music generation
│   ├── sound-effects/         ← SFX API
│   ├── speech-to-text/        ← Transcription
│   ├── text-to-dialogue/      ← Multi-speaker dialogue
│   └── text-to-speech/        ← Voice synthesis
├── actions/                   ← Server actions (signed URL generation)
├── globals.css
├── layout.tsx
└── page.tsx
```

**Conversational AI implementation pattern:**
- `useConversationalAI()` hook — fetches agent list, manages state
- `AgentSelector` component — dropdown for switching agents
- `ConversationUI` component — full voice conversation interface
- Server action for signed URL (authenticated agents)

**Delta vs VantageStarter:**
- No Convex — uses iron-session for state
- No Clerk — no auth layer
- No Polar — no billing
- Tailwind v4 (we're on v3) — minor migration path
- WaveSurfer.js for audio waveform — not in our stack
- No AI SDK integration

**What to steal:**
- The 6-route structure maps cleanly to our feature modules
- Server action pattern for signed URL generation
- `useConversationalAI` hook abstraction
- Form + Zod validation patterns for audio configuration

---

### 1.6 `elevenlabs/ui`

**What it does:** 17 prebuilt, composable UI components for ElevenLabs Agent & Audio interfaces.

**Tech stack:**
- React + shadcn/ui + Tailwind CSS
- Three.js (Orb component uses `@react-three/fiber`)
- Install via: `npx @elevenlabs/cli@latest components add [component-name]`
- Compatible with Next.js (no version constraint documented, requires shadcn/ui + Tailwind)

**Full component inventory:**

| Component | Description | Use case |
|-----------|-------------|----------|
| `Orb` | 3D animated, audio-reactive orb (Three.js) | Agent state visualization |
| `Bar Visualizer` | Real-time audio frequency bars | Voice activity indicator |
| `Live Waveform` | Canvas-based mic waveform | Recording feedback |
| `Waveform` | Audio playback + scrubbing | Audio player |
| `Conversation` | Auto-scroll chat container | Chat history |
| `Conversation Bar` | Full voice UI: mic + text + waveform | Complete agent widget |
| `Voice Button` | Button with recording states + waveform | Minimal voice trigger |
| `Voice Picker` | Searchable voice selector + preview + Orb | Voice selection |
| `Speech Input` | Compact STT input | Search / form input |
| `Audio Player` | Full player with progress controls | Playback |
| `Scrub Bar` | Timeline scrubbing | Audio/video |
| `Transcript Viewer` | Word-by-word highlighted playback sync | Review recordings |
| `Message` | Composable chat message components | Chat UI |
| `Response` | Streaming markdown renderer | AI text output |
| `Mic Selector` | Input device management | Device config |
| `Matrix` | Retro dot-matrix display | Decorative / theme |
| `Shimmering Text` | Gradient shimmer text animation | Loading/intro |

**Critical for hackathon and VantageStarter:** `ConversationBar` and `Orb` provide production-ready UI in minutes. `Voice Button` is the minimal integration entry point.

---

## 2. ElevenLabs Conversational AI — Core API

### useConversation hook (`@elevenlabs/react`)

```typescript
import { useConversation } from '@elevenlabs/react';

const conversation = useConversation({
  onConnect: () => {},
  onDisconnect: () => {},
  onMessage: (message) => {},
  onError: (error) => {},
});

// Start session
const { conversationId } = await conversation.startSession({
  agentId: 'YOUR_AGENT_ID',        // public agent
  // OR signedUrl: '...',           // private agent
  // OR conversationToken: '...',   // WebRTC private
  connectionType: 'webrtc',        // 'webrtc' | 'websocket'
  userId: 'optional-user-id',
  clientTools: {                    // tools executed on client side
    search: async ({ query }) => {
      // call Firecrawl here, return results to agent
      const results = await firecrawl.search(query, { limit: 5 });
      return JSON.stringify(results.data);
    },
  },
});

// Returns
conversation.status        // 'connected' | 'disconnected'
conversation.isSpeaking    // boolean
conversation.endSession()  // cleanup
```

### Client tools — the bridge to Firecrawl

Client tools are functions registered in the conversation that the agent can invoke at runtime. The agent decides when to call them based on its system prompt. The tool must also be registered in the ElevenLabs dashboard with matching name + parameter schema.

**Flow:**
1. Register tool in ElevenLabs dashboard (type: Client, name: `searchWeb`, param: `query: string`)
2. Pass matching function in `clientTools` on `startSession`
3. Agent says "let me search for that" → ElevenLabs calls `clientTools.searchWeb({ query })` on the client
4. Function executes, returns data (string/JSON) back to agent
5. Agent reads result and responds conversationally

---

## 3. Hackathon Strategy — Firecrawl + ElevenAgents

**Challenge:** "Combine Firecrawl Search with ElevenAgents" — deadline March 26, 2026, prize pool $19,480.

### Fastest winning path

**App concept: Voice Research Assistant**

A conversational voice agent that can search the web on your behalf and read back synthesized summaries. You speak a query → agent uses Firecrawl to search → reads results aloud with ElevenLabs voice.

**Why this wins:**
- Directly combines both required technologies in a non-trivial way
- Demonstrable in a 30-second video (required for viral/popular votes)
- No existing showcase project does this combination
- Jinglemaker (web URL → audio) is the closest prior art, but text-not-voice

### Architecture (4-hour build)

```
User mic input
    ↓
useConversation (WebRTC)
    ↓
ElevenLabs Agent (system prompt: "You are a research assistant. When asked about a topic, use the searchWeb tool.")
    ↓
clientTools.searchWeb({ query }) — triggered by agent
    ↓
/api/search (Next.js route)
    ↓
Firecrawl.search(query, { limit: 5, scrapeOptions: { formats: ['markdown'] } })
    ↓
Return top 3 results as markdown to agent
    ↓
Agent synthesizes and speaks summary aloud
```

### File structure (Next.js 15)

```
app/
├── page.tsx                    ← ConversationBar + Orb from @elevenlabs/ui
├── api/
│   ├── search/route.ts         ← Firecrawl search endpoint
│   └── signed-url/route.ts     ← ElevenLabs signed URL
└── components/
    └── VoiceResearcher.tsx     ← useConversation + clientTools.searchWeb
```

### Key code pattern

```typescript
// components/VoiceResearcher.tsx
'use client';
import { useConversation } from '@elevenlabs/react';
import { ConversationBar, Orb } from '@elevenlabs/ui';

export function VoiceResearcher() {
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onError: console.error,
  });

  const start = async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    await conversation.startSession({
      agentId: process.env.NEXT_PUBLIC_AGENT_ID!,
      connectionType: 'webrtc',
      clientTools: {
        searchWeb: async ({ query }: { query: string }) => {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          // Return top 3 results as a readable string
          return data.results
            .slice(0, 3)
            .map((r: any) => `${r.title}: ${r.description}`)
            .join('\n\n');
        },
      },
    });
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <Orb
        state={conversation.status === 'connected' ? (conversation.isSpeaking ? 'speaking' : 'listening') : 'idle'}
      />
      <ConversationBar
        status={conversation.status}
        onStart={start}
        onStop={() => conversation.endSession()}
      />
    </div>
  );
}
```

```typescript
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') ?? '';
  try {
    const result = await firecrawl.search(query, {
      limit: 5,
      scrapeOptions: { formats: ['markdown'] },
    });
    return NextResponse.json({ results: result.data });
  } catch (e) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
```

### ElevenLabs agent system prompt

```
You are a voice-powered research assistant. When a user asks about a topic or wants information,
use the searchWeb tool to find current information.
Always summarize findings conversationally in 2-3 sentences.
Keep responses under 40 words — they will be spoken aloud.
```

### Environment variables needed

```
NEXT_PUBLIC_AGENT_ID=
ELEVENLABS_API_KEY=
FIRECRAWL_API_KEY=
```

### Build order (4 hours)

1. Create ElevenLabs agent in dashboard, add `searchWeb` client tool (30 min)
2. Scaffold Next.js 15 app with `@elevenlabs/react`, `@elevenlabs/ui`, `@mendable/firecrawl-js` (30 min)
3. Build `/api/search` route (20 min)
4. Build `VoiceResearcher.tsx` with `useConversation` + `clientTools` (45 min)
5. Wire `Orb` + `ConversationBar` from `@elevenlabs/ui` (30 min)
6. Polish: loading states, error handling, mobile layout (45 min)
7. Deploy to Vercel (15 min)
8. Record 30s demo video (30 min)

---

## 4. VantageStarter — ElevenLabs Integration Spec

### What to ship out of the box

**Tier 1 — Core integration (always included)**

- `ELEVENLABS_API_KEY` in `.env.example`
- `/app/api/elevenlabs/signed-url/route.ts` — signed URL endpoint for private agents
- `/hooks/use-conversation.ts` — wrapper around `useConversation` with VantageStarter conventions (Convex-aware user ID, error toasts)
- Feature flag: `NEXT_PUBLIC_ELEVENLABS_ENABLED=false` (opt-in, off by default)

**Tier 2 — Conversational AI module (opt-in)**

- `/app/(features)/voice-agent/page.tsx` — demo page using `ConversationBar` + `Orb`
- `/components/voice/VoiceAgent.tsx` — reusable agent component
- `/components/voice/VoiceButton.tsx` — minimal trigger (add-on anywhere)
- Convex mutation to log conversation events (audit trail, free tier)

**Tier 3 — Full agent with tools (template)**

- Template: voice agent with Firecrawl search tool
- Template: voice agent with Convex data access tool (read user's own data by voice)

### Stack compatibility check

| Requirement | VantageStarter | Compatible? |
|-------------|---------------|-------------|
| Next.js 15 | Yes | Yes (`@elevenlabs/react` 0.5+) |
| React 19 | Yes | Yes |
| shadcn/ui | Yes | Yes (`@elevenlabs/ui` built on shadcn) |
| Tailwind CSS | v3 (starter) | Minor: `@elevenlabs/ui` recommends Tailwind v4 — use CSS variables workaround |
| Convex | Yes | No native ElevenLabs-Convex SDK — bridge via server actions |
| Clerk | Yes | Pass Clerk `userId` to `startSession({ userId })` for conversation tracking |
| TypeScript | Yes | Full TypeScript support in all ElevenLabs SDKs |

**One compatibility risk:** `@elevenlabs/ui`'s `Orb` component uses `@react-three/fiber` + Three.js. This adds ~180KB gzipped. Gate behind dynamic import + `ssr: false`.

```typescript
// components/voice/Orb.tsx
import dynamic from 'next/dynamic';
const OrbComponent = dynamic(() => import('@elevenlabs/ui').then(m => m.Orb), { ssr: false });
```

---

## 5. perello-elevenlabs Plugin — Scoping Decision

### Should we build it?

**Yes.** The ElevenLabs ecosystem has a clear gap: no Claude Code plugin for Next.js app development (their existing plugin is STT for the IDE, not app scaffolding). We know the pattern from the MCP app.

### What it should contain

**Agents:**
- `elevenlabs-expert` — ElevenLabs integration specialist for Next.js apps (mirrors `convex-expert` pattern)

**Skills — Capabilities:**
- `dev-elevenlabs-conversation` — Implement `useConversation` with clientTools, signed URL, session management
- `dev-elevenlabs-tts` — TTS API integration, voice selection, streaming audio
- `dev-elevenlabs-stt` — STT transcription with timestamps
- `dev-elevenlabs-ui` — Install and configure `@elevenlabs/ui` components with dynamic imports
- `dev-elevenlabs-tools` — Define and register client tools that connect agents to external APIs

**Skills — Composites:**
- `dev-elevenlabs-voice-agent` — Full voice agent: signed URL + useConversation + ConversationBar + clientTools
- `dev-elevenlabs-firecrawl-agent` — Voice agent with Firecrawl search as client tool (hackathon template)

**Skills — Playbook:**
- `dev-elevenlabs-setup` — Full ElevenLabs integration: env vars, API route, hook, demo page, feature flag

### Plugin structure

```
plugins/perello-elevenlabs/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   └── elevenlabs-expert.md
└── skills/
    ├── capabilities/
    │   ├── dev-elevenlabs-conversation/SKILL.md
    │   ├── dev-elevenlabs-tts/SKILL.md
    │   ├── dev-elevenlabs-stt/SKILL.md
    │   ├── dev-elevenlabs-ui/SKILL.md
    │   └── dev-elevenlabs-tools/SKILL.md
    ├── composites/
    │   ├── dev-elevenlabs-voice-agent/SKILL.md
    │   └── dev-elevenlabs-firecrawl-agent/SKILL.md
    └── playbooks/
        └── dev-elevenlabs-setup/SKILL.md
```

---

## 6. Scoring Summary

### ElevenLabs ecosystem maturity

| Criterion | Score | Notes |
|-----------|-------|-------|
| API quality | 9/10 | Clean TypeScript SDK, well-typed, good DX |
| Maintenance | 9/10 | Active — MCP app deps from March 2026 |
| Community | 8/10 | 300+ hackathon submissions, active showcase |
| Bundle size | 6/10 | Three.js in `@elevenlabs/ui` adds weight — mitigable with dynamic import |
| Compatibility | 8/10 | Next.js 15 + React 19 native. Tailwind v4 minor friction |
| Documentation | 8/10 | Official quickstarts, examples repo, clear SDK docs |

**Verdict: Adopt**

### Recommended immediate actions

1. **Hackathon (this week):** Build Voice Research Assistant using the architecture above. 4-hour build. Deadline March 26.
2. **VantageStarter (post-hackathon):** Add `ELEVENLABS_API_KEY` env var + signed URL route + `use-conversation.ts` hook as Tier 1 defaults.
3. **Plugin (post-hackathon):** Bootstrap `perello-elevenlabs` from the hackathon app. Use `create-plugin` skill.

---

## Sources

- [ElevenLabs/skills](https://github.com/elevenlabs/skills) — Agent skills spec
- [ElevenLabs/showcase](https://github.com/elevenlabs/showcase) + [showcase.elevenlabs.io](https://showcase.elevenlabs.io)
- [ElevenLabs/plugins](https://github.com/elevenlabs/plugins) — Claude Code STT/TTS plugins
- [ElevenLabs/elevenlabs-agents-mcp-app](https://github.com/elevenlabs/elevenlabs-agents-mcp-app) — MCP server
- [ElevenLabs/elevenlabs-nextjs-starter](https://github.com/elevenlabs/elevenlabs-nextjs-starter) — Next.js starter
- [ElevenLabs/ui](https://github.com/elevenlabs/ui) + [ui.elevenlabs.io/docs/components](https://ui.elevenlabs.io/docs/components)
- [ElevenHacks](https://hacks.elevenlabs.io/) — Current hackathon season
- [React SDK docs](https://elevenlabs.io/docs/agents-platform/libraries/react)
- [Client tools docs](https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools)
- [Next.js quickstart](https://elevenlabs.io/docs/agents-platform/guides/quickstarts/next-js)
- [Firecrawl Search docs](https://docs.firecrawl.dev/features/search)
- [@elevenlabs/react npm](https://www.npmjs.com/package/@elevenlabs/react)
