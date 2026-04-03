# Consultant Onboarding App — Implementation Plan

**Date**: 2026-03-26
**Author**: Tau (orchestrator)
**Branch**: `feat/consultant-onboarding`
**Status**: PLAN v2 — revised per Laurent's feedback (auto-scrape, competitors, pain-oriented)
**Priority**: P0

---

## Executive Summary

### What
Build a chat-based consultant onboarding app inside VantageStarter. The flow:
1. Consultant creates a project (name, client name, **website URL**, sector)
2. System **auto-scrapes the client website** with Firecrawl → generates brand kit, knowledge base, initial context
3. Consultant adds **3-5 competitors** (name + URL) → system scrapes each for positioning, pricing, offers
4. AI agent asks **pain-oriented discovery questions** ("What problems do you want to solve?") — NOT feature checklists
5. Agent maps pains → teams/agents/skills from vantage-registry
6. Consultant validates selections
7. System generates deployable `.claude/` config

### Why
VantageStarter ships with 144 agents, 314 skills, and 17 teams in the vantage-registry — but no one knows which ones to activate. A consultant needs a guided way to configure the right stack for each client based on their **actual business problems**, not browse 501 components manually.

### How
Leverage the **existing architect mode** (`app/[locale]/dashboard/architect/`) and **json-render** system already built in VantageStarter. Extend the architect's SpecStream to output a new component type: `OnboardingConfig` (instead of `MissionProposal`). Reuse the chat interface, session persistence, and confirm-to-deploy flow.

### Key Design Principles (from Laurent)
1. **Auto-scrape, don't ask** — when the consultant provides a URL, scrape it automatically. Don't make them describe their business manually.
2. **Competitor intelligence first** — scrape competitors before the discovery chat. The agent needs market context to make smart recommendations.
3. **Pain-oriented, not feature-oriented** — the agent asks "What problems are you trying to solve?" (prospecting, marketing, client retention, internal ops), NOT "Do you need email? SEO? Social?" The agent maps pains to solutions.

---

## Architecture Decision: Extend Architect, Don't Build From Scratch

**Rationale:** The architect mode already has:
- Chat UI with streaming (`chat-interface.tsx`)
- Session persistence in Convex (`architectSessions` + `architectMessages` tables)
- json-render catalog + registry for structured output
- System prompt injection with agent context
- Confirm flow (extract spec → create entity → navigate)
- Credit deduction on `/api/architect/chat`

The onboarding app IS an architect session with a different prompt and different output components.

**What changes:**
1. New json-render components: `OnboardingConfig`, `TeamSelection`, `AgentSelection`, `SkillSelection`
2. New system prompt: discovery questions → registry query → config recommendation
3. New confirm action: generate `.claude/` config files instead of creating a mission
4. New entry point: `/dashboard/consultant/onboard` (or reuse architect with mode param)

**What stays the same:**
- Chat interface component
- Session list sidebar
- Convex session/message persistence
- Streaming API route pattern
- Credit deduction

---

## Phases

### Phase 0 — Client Intelligence (Auto-Scrape + Competitors)
**Goal:** When a project is created, auto-scrape the client website and competitors to build context before the discovery chat.

| # | Task | Files | Est. |
|---|------|-------|------|
| 0.1 | Create `convex/actions/scrapeClient.ts` — Firecrawl action: takes URL, scrapes full site, extracts: brand name, tagline, colors, logo, key pages, products/services, team, tech stack. Stores as structured JSON in `consultantProjects.brandKit` | `convex/actions/scrapeClient.ts` | 3h |
| 0.2 | Create `convex/actions/scrapeCompetitor.ts` — Firecrawl action: takes URL, scrapes competitor site, extracts: positioning statement, pricing tiers, key offers, differentiators. Stores in `consultantProjects.competitors[]` | `convex/actions/scrapeCompetitor.ts` | 2h |
| 0.3 | Create `lib/consultant/brand-kit.ts` — TypeScript types for BrandKit, CompetitorProfile, and extraction logic from raw Firecrawl output | `lib/consultant/brand-kit.ts` | 1.5h |
| 0.4 | Wire auto-scrape into project creation flow — on project create with URL, trigger scrapeClient action. Show progress indicator. Allow adding 3-5 competitor URLs with individual scrape triggers | UI + Convex | 2h |

### Phase 1 — Registry Integration (Backend)
**Goal:** Query vantage-registry from within the onboarding flow.

| # | Task | Files | Est. |
|---|------|-------|------|
| 1.1 | Add vantage-registry MCP to Tau's config (if not already) | `.claude/settings.json` | 10m |
| 1.2 | Create `convex/registry.ts` — proxy queries to list teams/agents/skills by category, sector, use case | `convex/registry.ts` | 2h |
| 1.3 | Create `lib/registry/types.ts` — TypeScript types for registry components (Team, Agent, Skill, Hook) | `lib/registry/types.ts` | 30m |
| 1.4 | Seed vantage-registry with component data (if empty) | Via MCP `register_component` | 2h |

### Phase 2 — json-render Components (Catalog + Registry)
**Goal:** Define the structured output format the AI will produce.

| # | Task | Files | Est. |
|---|------|-------|------|
| 2.1 | Add `OnboardingConfig` component to json-render catalog — root container with project info + selected teams/agents/skills | `lib/json-render/catalog.ts` | 1h |
| 2.2 | Add `TeamSelection` component — team card with agents list, toggle on/off | `lib/json-render/catalog.ts` | 30m |
| 2.3 | Add `AgentSelection` component — agent card with skills, role, description | `lib/json-render/catalog.ts` | 30m |
| 2.4 | Add `SkillSelection` component — skill item with name, description, toggle | `lib/json-render/catalog.ts` | 30m |
| 2.5 | Implement React renderers for all 4 new components in registry | `lib/json-render/registry.tsx` | 2h |

### Phase 3 — Onboarding Prompt System (Pain-Oriented Discovery)
**Goal:** AI asks pain-oriented discovery questions, uses scraped context + registry to recommend config.

**CRITICAL: Pain-oriented, NOT feature-oriented.**
- WRONG: "Do you need email marketing? SEO? Social media?"
- RIGHT: "What are the biggest problems you're trying to solve? Prospecting? Marketing? Client retention? Internal operations?"
- The agent maps pains → teams/agents/skills. The consultant doesn't need to know what's available.

| # | Task | Files | Est. |
|---|------|-------|------|
| 3.1 | Create `lib/consultant/prompts.ts` — onboarding system prompt with: pain-oriented discovery framework, brand kit + competitor context injection, registry mapping logic, SpecStream output format | `lib/consultant/prompts.ts` | 3h |
| 3.2 | Define pain-oriented discovery flow: (1) "What problems are you trying to solve?" (2) "Which of these is most urgent?" (3) "What does success look like in 3 months?" (4) "What's your team size and budget tier?" — then agent silently maps pains to registry components | `lib/consultant/prompts.ts` | 1.5h |
| 3.3 | Inject scraped context into prompt — brand kit summary, competitor positioning, market gaps identified from scrape data. Agent uses this to make informed recommendations without asking redundant questions | `lib/consultant/prompts.ts` | 1.5h |
| 3.4 | Add registry context injection — available teams/agents/skills with descriptions, injected so agent can map pains to solutions | `lib/consultant/prompts.ts` | 1h |

### Phase 4 — Onboarding UI + Route
**Goal:** Entry point and flow for the consultant.

| # | Task | Files | Est. |
|---|------|-------|------|
| 4.1 | Create `app/[locale]/dashboard/consultant/onboard/page.tsx` — entry page with project creation form: name, client name, **website URL** (required), sector. On submit: create project → trigger auto-scrape → show scrape progress → then competitor input step (3-5 URLs) → then open discovery chat | New page | 2h |
| 4.2 | Create onboarding chat interface — extends architect chat-interface with onboarding-specific prompt and confirm action | Components | 2h |
| 4.3 | Create `app/api/consultant/onboard/route.ts` — streaming endpoint, injects onboarding prompt + registry context | New route | 2h |
| 4.4 | Add i18n keys for consultant onboarding (en + fr) | `messages/en.json`, `messages/fr.json` | 30m |
| 4.5 | Add sidebar nav entry for "Consultant Onboard" | Layout component | 30m |

### Phase 5 — Config Generation + Deploy
**Goal:** Turn the AI recommendation into deployable `.claude/` files.

| # | Task | Files | Est. |
|---|------|-------|------|
| 5.1 | Create `lib/consultant/config-generator.ts` — takes OnboardingConfig spec, generates: `.claude/agents/*.md`, `.claude/skills/`, `CLAUDE.md` sections, `hooks/` | New file | 3h |
| 5.2 | Create confirm action in chat UI — extract OnboardingConfig from spec, call config-generator, offer download as ZIP | Component update | 2h |
| 5.3 | Create `convex/consultantProjects.ts` — persist project + selected config for history | New Convex file | 1h |
| 5.4 | Add credit cost: `consultant_onboard` action type (5 credits) | `convex/seed/seedCreditCosts.ts` | 10m |

---

## Data Model

### New Table: `consultantProjects`
```
consultantProjects:
  workspaceId: Id<"workspaces">
  name: string                    // Project name
  clientName: string              // Client company
  clientWebsiteUrl: string        // Client website — auto-scraped on creation
  sector: string                  // Industry sector
  brandKit: object                // Auto-generated from Firecrawl scrape (name, tagline, colors, logo, products, tech stack)
  competitors: array              // 3-5 competitor profiles [{name, url, positioning, pricing, offers, differentiators}]
  knowledgeBase: object           // Extracted content from client site (key pages, services, team)
  sessionId: Id<"architectSessions">  // Link to discovery chat session
  config: object                  // Generated OnboardingConfig JSON
  status: "scraping" | "competitors" | "discovery" | "review" | "deployed"
  selectedTeams: string[]         // Team IDs from registry
  selectedAgents: string[]        // Agent IDs
  selectedSkills: string[]        // Skill IDs
  createdBy: string               // Clerk user ID
  createdAt: number
  updatedAt: number
```

### Reused Tables
- `architectSessions` — session persistence (add `type: "onboarding"` field)
- `architectMessages` — message history
- `creditCosts` — add `consultant_onboard` action type

---

## New json-render Components

### OnboardingConfig (root)
```json
{
  "type": "OnboardingConfig",
  "props": {
    "projectName": "Acme Corp Marketing Suite",
    "sector": "marketing",
    "clientName": "Acme Corp",
    "summary": "AI-powered marketing team with content, social, and analytics agents"
  },
  "children": [TeamSelection, AgentSelection, SkillSelection, ...]
}
```

### TeamSelection
```json
{
  "type": "TeamSelection",
  "props": {
    "teamId": "content-marketing",
    "name": "Content Marketing Team",
    "description": "Agents for blog, social, email content creation",
    "agentCount": 4,
    "selected": true
  }
}
```

---

## Dependency Graph

```
Phase 0 (Scraping) ──→ Phase 3 (Prompts — needs scrape context)
                                    ↓
Phase 1 (Registry) ──→ Phase 3 ──→ Phase 4 (UI + Route)
                                           ↓
Phase 2 (Components) ────────────→ Phase 5 (Config Gen)
```

Phase 0, 1, and 2 can run in parallel. Phase 3 depends on Phase 0 + 1 (needs scrape context + registry). Phases 4 and 5 depend on all previous.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Firecrawl MCP not available | Can't auto-scrape | Check if Firecrawl MCP is configured. Fallback: manual URL fetch + parse |
| Registry empty (no components seeded) | AI can't recommend anything | Phase 1.4: seed registry first. Fallback: hardcode top 10 teams |
| Competitor sites block scraping | Incomplete intel | Graceful fallback: show "scrape failed" + allow manual input |
| Pain-to-solution mapping too broad | Bad recommendations | Curate a pain→team mapping table in the prompt, test with real scenarios |

---

## Estimated Total: ~32 hours

| Phase | Hours |
|-------|-------|
| Phase 0 — Client Intelligence (Scraping) | 8.5h |
| Phase 1 — Registry Integration | 5h |
| Phase 2 — json-render Components | 4.5h |
| Phase 3 — Prompt System (Pain-Oriented) | 7h |
| Phase 4 — UI + Route | 7h |
| Phase 5 — Config Generation | 6h |
| **Total** | **~32h** |

---

## Next Steps

1. **Pi approval** of this revised plan
2. Verify Firecrawl MCP is available and configured
3. Seed vantage-registry with component data
4. Start Phase 0 + Phase 1 + Phase 2 in parallel
5. Build pain-oriented prompt system with scrape context
6. Wire up UI and config generation
