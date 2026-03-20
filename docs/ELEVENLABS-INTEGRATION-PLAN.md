# ElevenLabs Integration Plan — VantageStarter Core Boilerplate

**Date:** 2026-03-20
**Status:** Authoritative — supersedes ELEVENLABS-ECOSYSTEM-ANALYSIS.md hackathon section
**Scope:** VantageStarter as the hackathon submission AND the boilerplate product

---

## Context

The previous analysis framed ElevenLabs as a bolt-on hackathon feature. That framing is wrong.

The correct frame: **voice IS the Architect interface**. Every buyer of VantageStarter gets a voice-powered mission planner out of the box. ElevenLabs is not a feature — it is the primary input mechanism for the flagship feature.

The hackathon submission is VantageStarter itself, running live, demonstrating voice-powered orchestration with Firecrawl web research. One product, two audiences: hackathon judges and boilerplate buyers.

---

## Q1 — Architect + Voice: Exact Flow

### What it does

User speaks their intent. ElevenLabs transcribes + processes in real-time (WebRTC). The voice agent calls a `clientTools.decomposeIntent` function. That function calls the Architect API (`/api/architect/chat`). The Architect returns a structured mission proposal (json-render SpecStream). The voice agent reads back the plan summary. User confirms verbally or clicks.

### Full flow, step by step

```
1. User opens Architect page
2. Clicks VoiceButton (from @elevenlabs/ui)
3. useConversation.startSession({
     agentId: ARCHITECT_AGENT_ID,
     connectionType: 'webrtc',
     userId: clerkUserId,
     clientTools: {
       decomposeIntent,   // speaks intent → Architect API → structured plan
       confirmPlan,       // verbal confirm → commitPlan mutation
       searchContext,     // optional: Firecrawl web lookup for mission research
     }
   })
4. User speaks: "I need a content marketing mission — 3 blog posts, competitor research, final review"
5. ElevenLabs STT processes speech
6. Agent calls clientTools.decomposeIntent({ intent: "...", workspaceId })
7. Client function POSTs to /api/architect/chat with the spoken intent as message
8. Architect API (AI SDK streamText) returns SpecStream mission-proposal JSON
9. Client parses SpecStream, stores proposedPlan in state
10. clientTools.decomposeIntent returns a human-readable summary string to agent
11. Agent speaks back: "I've designed a 5-operation mission. Competitor research first,
     then 3 parallel writing ops, final review gate. Confirm to commit?"
12. User says "confirm" → agent calls clientTools.confirmPlan({ sessionId, plan })
13. commitPlan mutation fires → mission + ops + checkpoints written atomically
14. Agent speaks: "Mission created. Your agents are ready."
15. User sees Mission Board updated in real-time via Convex useQuery
```

### Component mapping

| Layer | Technology | Role |
|-------|-----------|------|
| Voice input/output | `@elevenlabs/react` `useConversation` | WebRTC session, clientTools bridge |
| Visual feedback | `@elevenlabs/ui` `Orb` + `VoiceButton` | Listening/speaking state |
| Intent decomposition | `clientTools.decomposeIntent` | Calls `/api/architect/chat` |
| Plan generation | AI SDK `streamText` + json-render SpecStream | Structured mission proposal |
| Plan confirmation | `clientTools.confirmPlan` → `commitPlan` | Atomic DB write |
| Real-time feedback | Convex `useQuery` on missions | Board updates without refresh |

### ElevenLabs agent system prompt (Architect voice persona)

```
You are the Architect — a strategic AI operations planner.
Your job: listen to the user's intent, decompose it into a mission plan,
and present it clearly.

When the user describes what they want:
1. Call decomposeIntent with their exact words
2. Wait for the result
3. Read back the plan in plain language: mission name, operation count,
   dependencies, and any checkpoints
4. Ask for confirmation

Keep responses under 50 words. They are spoken aloud.
Do not explain how you work. Just plan and confirm.
```

### Signed URL endpoint (required for private agent)

```typescript
// app/api/elevenlabs/signed-url/route.ts
import { auth } from "@clerk/nextjs/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! });

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { signedUrl } = await client.conversationalAi.getSignedUrl({
    agentId: process.env.ELEVENLABS_ARCHITECT_AGENT_ID!,
  });
  return Response.json({ signedUrl });
}
```

---

## Q2 — Credit System Mapping

### The problem

ElevenLabs bills by character (TTS) and by minute (Conversational AI). VantageStarter bills in credits. These are different units. The mapping must be opinionated and simple — buyers cannot manage two billing systems.

### Recommended mapping

| ElevenLabs unit | Conversion | VantageStarter credits |
|----------------|-----------|----------------------|
| 1 Conversational AI minute | × 10 | 10 credits/min |
| 1,000 TTS characters | × 1 | 1 credit per 1k chars |
| 1 STT minute (transcription) | × 5 | 5 credits/min |

### Rationale

At $0.10/min for Conversational AI (ElevenLabs pricing), 10 credits = $0.01 per credit maps correctly if credits are valued at $0.001 each — consistent with the existing AI SDK cost metering in `usageTracking`.

### Implementation

The credit deduction fires AFTER the session ends via an ElevenLabs webhook (`conversation.completed` event):

```
POST /api/webhooks/elevenlabs
  → validate signature
  → read event.conversation_duration_secs
  → calculate credits = Math.ceil(secs / 60) * 10
  → Convex mutation: deductCredits(userId, credits, "voice_session")
  → log to creditTransactions + usageTracking
```

The existing `creditCosts` table gets a new row:

```typescript
{
  actionType: "voice_session_minute",
  displayName: "Voice Architect (per minute)",
  credits: 10,
  category: "voice",
  isActive: true,
}
```

### Credit gate

Before starting a session, check balance:

```typescript
const start = async () => {
  const balance = await fetchQuery(api.credits.getBalance, { clerkUserId });
  if (balance < 10) {
    toast.error("Insufficient credits. Minimum 10 credits required to start a voice session.");
    return;
  }
  await navigator.mediaDevices.getUserMedia({ audio: true });
  await conversation.startSession({ ... });
};
```

---

## Q3 — Operations + Voice Status Announcements

### Flow

Convex `useQuery` subscriptions push real-time operation status to the client. When a status changes, the change triggers a TTS announcement via ElevenLabs TTS API (not Conversational AI — cheaper, no WebRTC session needed).

```
Operation completes → Convex useQuery fires → React effect detects status change
  → POST /api/elevenlabs/tts { text: "Research complete. Writing ops are now unblocked." }
  → Play audio in browser
```

### Implementation

```typescript
// hooks/use-operation-announcements.ts
'use client';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef } from "react";

export function useOperationAnnouncements(missionId: Id<"missions">) {
  const operations = useQuery(api.operations.listByMission, { missionId });
  const prevStatusRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!operations) return;
    for (const op of operations) {
      const prev = prevStatusRef.current[op._id];
      if (prev && prev !== op.status) {
        const message = buildAnnouncementText(op);
        if (message) announceViaElevenLabs(message);
      }
      prevStatusRef.current[op._id] = op.status;
    }
  }, [operations]);
}

function buildAnnouncementText(op: Operation): string | null {
  switch (op.status) {
    case "completed": return `${op.name} is complete.`;
    case "in_progress": return `${op.name} is now running.`;
    case "awaiting_checkpoint": return `${op.name} is ready for your review.`;
    case "failed": return `${op.name} failed. Check the mission board.`;
    default: return null;
  }
}

async function announceViaElevenLabs(text: string) {
  const res = await fetch("/api/elevenlabs/speak", {
    method: "POST",
    body: JSON.stringify({ text }),
    headers: { "Content-Type": "application/json" },
  });
  const audioBlob = await res.blob();
  const audio = new Audio(URL.createObjectURL(audioBlob));
  audio.play();
}
```

```typescript
// app/api/elevenlabs/speak/route.ts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! });

export async function POST(req: Request) {
  const { text } = await req.json();
  const stream = await client.textToSpeech.convert(
    process.env.ELEVENLABS_NARRATOR_VOICE_ID!,
    { text, model_id: "eleven_turbo_v2" }
  );
  // stream is async iterable — collect chunks
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  return new Response(buffer, {
    headers: { "Content-Type": "audio/mpeg" }
  });
}
```

**TTS cost:** `eleven_turbo_v2` is the cheapest model (~$0.015/1k chars). A "Research complete" message is ~15 chars = negligible. Gate behind user preference (opt-in, default off).

---

## Q4 — clientTools → Convex Operations

### Tool definitions (registered in ElevenLabs dashboard + passed in startSession)

| clientTool | ElevenLabs dashboard config | Client implementation | Convex target |
|------------|---------------------------|----------------------|---------------|
| `decomposeIntent` | Type: Client, params: `{ intent: string, workspaceId: string }` | POST `/api/architect/chat` | `architectSessions.addMessage` + `streamText` |
| `confirmPlan` | Type: Client, params: `{ sessionId: string, plan: object }` | `useMutation(api.architect.commitPlan)` | `commitPlan` atomic mutation |
| `searchContext` | Type: Client, params: `{ query: string }` | GET `/api/search?q=...` → Firecrawl | No Convex — external |
| `getMissionStatus` | Type: Client, params: `{ missionId: string }` | `fetchQuery(api.missions.getWithOperations)` | `missions.getWithOperations` query |
| `getAgents` | Type: Client, params: `{ workspaceId: string }` | `fetchQuery(api.agents.listByWorkspace)` | `agents.listByWorkspace` query |

### Full clientTools implementation

```typescript
// components/voice/architect-client-tools.ts
import { fetchQuery, fetchMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function buildArchitectClientTools(workspaceId: string, sessionId: string) {
  return {
    decomposeIntent: async ({ intent }: { intent: string }) => {
      // 1. Log message in Architect session
      await fetchMutation(api.architect.addMessage, {
        sessionId,
        role: "user",
        content: intent,
      });
      // 2. Call Architect API (streaming — collect full response)
      const res = await fetch("/api/architect/chat", {
        method: "POST",
        body: JSON.stringify({ sessionId, message: intent, workspaceId }),
        headers: { "Content-Type": "application/json" },
      });
      const { summary, proposalJson } = await res.json();
      // 3. Store proposal in session state (via window.dispatchEvent for React)
      window.dispatchEvent(new CustomEvent("architect:proposal", {
        detail: { proposalJson }
      }));
      // 4. Return human-readable summary to agent (it will speak this)
      return summary; // e.g. "5-operation mission: research, 3 writing ops, review gate"
    },

    confirmPlan: async ({ plan }: { plan: object }) => {
      const missionId = await fetchMutation(api.architect.commitPlan, {
        sessionId,
        missionProposal: plan,
      });
      return `Mission created. ID: ${missionId}`;
    },

    searchContext: async ({ query }: { query: string }) => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const { results } = await res.json();
      return results
        .slice(0, 3)
        .map((r: { title: string; description: string }) =>
          `${r.title}: ${r.description}`
        )
        .join("\n\n");
    },

    getMissionStatus: async ({ missionId }: { missionId: string }) => {
      const mission = await fetchQuery(api.missions.getWithOperations, { missionId });
      if (!mission) return "Mission not found.";
      const opSummary = mission.operations
        .map(op => `${op.name}: ${op.status}`)
        .join(", ");
      return `Mission "${mission.name}" (${mission.status}). Operations: ${opSummary}`;
    },

    getAgents: async () => {
      const agents = await fetchQuery(api.agents.listByWorkspace, { workspaceId });
      return agents
        .map(a => `${a.name} (${a.roleName})`)
        .join(", ");
    },
  };
}
```

---

## Q5 — 4-Pillars Voice Agent Composition

### Does the composition work?

Yes. The 4-Pillars model maps cleanly to ElevenLabs agent configuration:

| 4-Pillars Pillar | ElevenLabs equivalent | How it maps |
|-----------------|----------------------|-------------|
| Role | `first_message` + core of `system_prompt` | "You are the Architect — a strategic AI operations planner." |
| Persona | Speaking style directives in `system_prompt` | "Speak concisely. Responses under 50 words." |
| Framework | Conversation flow rules in `system_prompt` | "Always: listen → search if needed → decompose → confirm." |
| Skills | `clientTools` definitions | `decomposeIntent`, `confirmPlan`, `searchContext`, `getMissionStatus`, `getAgents` |

### Agent configuration in ElevenLabs dashboard

```json
{
  "name": "Architect",
  "llm": {
    "model": "claude-haiku-4-5",
    "system_prompt": "[ROLE]\nYou are the Architect — a strategic AI operations planner...\n\n[PERSONA]\nDirect. No padding. Responses spoken aloud — max 50 words.\n\n[FRAMEWORK]\nListen → clarify once if needed → call decomposeIntent → read back plan → confirm.\n\n[SKILLS]\nYou have access to: decomposeIntent (plan a mission), confirmPlan (commit it), searchContext (web lookup), getMissionStatus (check progress), getAgents (list available agents).",
    "temperature": 0.3
  },
  "tts": {
    "voice_id": "[ARCHITECT_VOICE_ID]",
    "model": "eleven_turbo_v2"
  },
  "client_tools": [
    { "name": "decomposeIntent", "type": "client", "parameters": { "intent": "string", "workspaceId": "string" } },
    { "name": "confirmPlan", "type": "client", "parameters": { "plan": "object", "sessionId": "string" } },
    { "name": "searchContext", "type": "client", "parameters": { "query": "string" } },
    { "name": "getMissionStatus", "type": "client", "parameters": { "missionId": "string" } },
    { "name": "getAgents", "type": "client", "parameters": {} }
  ]
}
```

### Implication for VantageStarter buyers

Buyers who extend VantageStarter for their own domain just edit the system prompt + swap clientTools. The 4-Pillars structure already teaches them the composition model because the Architect voice agent IS a 4-Pillars-composed agent — documented and visible.

---

## Q6 — Free Tier vs PRO Tier

### Decision criteria

- FREE: everything needed to demonstrate the product, nothing that runs up ElevenLabs API costs at scale
- PRO: the features that justify upgrading, tied to the credit system

### Free tier (shipped for all buyers, zero ElevenLabs API cost on idle)

| Feature | Why free |
|---------|---------|
| `ELEVENLABS_API_KEY` env var slot + docs | Just configuration |
| `/api/elevenlabs/signed-url/route.ts` | Infrastructure, no cost until called |
| `hooks/use-conversation.ts` wrapper | Code, zero cost |
| Orb + VoiceButton components (via `@elevenlabs/ui`) | Client-side, zero cost |
| Feature flag `NEXT_PUBLIC_ELEVENLABS_ENABLED` | Off by default |
| Agent system prompt template (Architect persona) | Just text |
| `clientTools` schema + bridge pattern | Code template |
| ElevenLabs webhook handler scaffold | No cost until called |
| Credit cost config row (`voice_session_minute`) | Just data |

### PRO tier (enabled when ELEVENLABS_ENABLED=true + credits available)

| Feature | Credit cost | Why PRO |
|---------|------------|---------|
| Voice Architect sessions | 10 credits/min | Actual ElevenLabs API cost |
| Operation status announcements (TTS) | 1 credit/announcement | Optional, but costs per call |
| `searchContext` tool (Firecrawl inside voice session) | 5 credits/search | Firecrawl API cost |

### Implementation: feature flag + credit gate

```typescript
// components/voice/VoiceArchitectButton.tsx
const isEnabled = process.env.NEXT_PUBLIC_ELEVENLABS_ENABLED === "true";
const hasCredits = userBalance >= 10;

if (!isEnabled) return null; // Hidden entirely when disabled
if (!hasCredits) return <UpgradePrompt reason="Need 10 credits to start a voice session" />;
return <VoiceButton onStart={startSession} />;
```

---

## Q7 — The Hackathon App IS VantageStarter

### Why this is right

- The challenge requires: Firecrawl Search + ElevenAgents combined in a non-trivial way
- VantageStarter + voice Architect does exactly this: voice input → ElevenLabs agent → `searchContext` clientTool → Firecrawl → mission planning result spoken back
- Building a separate app wastes the 6-day window and produces nothing sellable
- Submitting VantageStarter as the hackathon app makes the boilerplate itself the demo

### What needs to be built for this to work as one product

These are the exact additions needed on top of the ORCHESTRATION-PLAN.md phases already planned:

| ID | What to build | Where | Depends on |
|----|--------------|-------|------------|
| EL-1 | `ELEVENLABS_API_KEY` + `ELEVENLABS_ARCHITECT_AGENT_ID` + `ELEVENLABS_NARRATOR_VOICE_ID` in `.env.example` | `.env.example` | Nothing |
| EL-2 | Signed URL endpoint | `app/api/elevenlabs/signed-url/route.ts` | Clerk auth |
| EL-3 | TTS speak endpoint | `app/api/elevenlabs/speak/route.ts` | Nothing |
| EL-4 | Firecrawl search endpoint | `app/api/search/route.ts` | Firecrawl key |
| EL-5 | ElevenLabs webhook handler | `app/api/webhooks/elevenlabs/route.ts` | Credit system |
| EL-6 | `clientTools` bridge | `components/voice/architect-client-tools.ts` | Phases 2+6 |
| EL-7 | `use-conversation.ts` hook wrapper | `hooks/use-conversation.ts` | EL-2 |
| EL-8 | `useOperationAnnouncements` hook | `hooks/use-operation-announcements.ts` | Phase 6.5 |
| EL-9 | Architect voice agent config in ElevenLabs dashboard | Dashboard (manual) | EL-6 |
| EL-10 | `VoiceArchitectButton` component | `components/voice/VoiceArchitectButton.tsx` | EL-7 |
| EL-11 | Wire VoiceArchitectButton into Architect page | `app/(dashboard)/architect/page.tsx` | Phase 6, EL-10 |
| EL-12 | Credit cost config row in seed data | `convex/seed.ts` | Phase 3 |

### Build order for hackathon (parallel with orchestration phases)

These are all small. None blocks the core orchestration build.

**Day 1 (alongside Phase 0-2):**
- EL-1, EL-2, EL-4 — env + endpoints (1h total)

**Day 2 (after Phase 4):**
- EL-6, EL-7, EL-9 — clientTools + hook + agent dashboard config (2h)

**Day 3 (after Phase 6):**
- EL-10, EL-11 — button + wire into Architect page (1h)

**Day 4 (after Phase 6.5):**
- EL-3, EL-8 — TTS speak endpoint + operation announcements (1h)
- EL-5, EL-12 — webhook handler + seed credit config (1h)

**Total ElevenLabs work: ~6 hours** on top of the existing orchestration plan.

### Hackathon submission demo script (30 seconds)

```
0:00 → Open VantageStarter dashboard, click Architect
0:03 → Click VoiceButton. Orb activates.
0:05 → Speak: "I need a competitive research mission for a SaaS product launch"
0:10 → Orb shows agent processing
0:12 → Agent calls searchContext("SaaS product launch competitive research")
       → Firecrawl searches, returns top results
0:15 → Agent reads back: "I found 3 research sources and designed a 4-operation mission:
       web research, competitive analysis, positioning draft, and a review checkpoint.
       Shall I create it?"
0:22 → Speak "yes"
0:23 → Agent calls confirmPlan → commitPlan fires
0:25 → Mission Board updates in real-time. 4 operations visible.
0:28 → "Mission created. Your agents are ready." spoken aloud.
0:30 → End.
```

This is a 30-second demo that proves: voice input, Firecrawl web research inside the session, structured plan generation, and real-time database update. All via ElevenLabs + VantageStarter.

---

## File Map — ElevenLabs Additions

```
app/
  api/
    elevenlabs/
      signed-url/route.ts     EL-2 — auth gate + ElevenLabs signed URL
      speak/route.ts          EL-3 — TTS endpoint for operation announcements
    search/route.ts           EL-4 — Firecrawl search (used by searchContext tool)
    webhooks/
      elevenlabs/route.ts     EL-5 — conversation.completed → deduct credits

components/
  voice/
    VoiceArchitectButton.tsx  EL-10 — feature flag + credit gate + VoiceButton
    architect-client-tools.ts EL-6 — all 5 clientTools implementations

hooks/
  use-conversation.ts         EL-7 — useConversation wrapper (Clerk userId, error toasts)
  use-operation-announcements.ts  EL-8 — Convex useQuery → TTS on status change
```

---

## Environment Variables

```bash
# .env.example additions
ELEVENLABS_API_KEY=
ELEVENLABS_ARCHITECT_AGENT_ID=    # Agent ID from ElevenLabs dashboard
ELEVENLABS_NARRATOR_VOICE_ID=     # Voice for operation status announcements
NEXT_PUBLIC_ELEVENLABS_ENABLED=false  # Set true to activate voice features
FIRECRAWL_API_KEY=
```

---

## Dependency Additions

```bash
pnpm add @elevenlabs/react @elevenlabs/elevenlabs-js
npx @elevenlabs/cli@latest components add orb voice-button conversation-bar
```

`@elevenlabs/ui` components are installed via CLI into your project (shadcn/ui style — they land in `components/ui/`). The Three.js Orb requires:

```typescript
// components/voice/Orb.tsx — dynamic import to avoid SSR Three.js crash
import dynamic from 'next/dynamic';
export const Orb = dynamic(() => import('@/components/ui/orb'), { ssr: false });
```

---

## What Is NOT in Scope

- ElevenLabs TTS for chat responses (overkill — text streaming is fine)
- ElevenLabs STT as a standalone feature page (not part of the Architect flow)
- Music generation, sound effects (unrelated to VantageStarter)
- Outbound phone calls via Twilio (enterprise only, post-launch)
- Multi-voice dialogue (post-MVP feature for multi-agent conversation playback)
