---
name: onboard-project
description: >-
  First-run project setup for VantageStarter. Interactive interview that configures
  the boilerplate for the buyer's specific SaaS: identity, design, tech stack, env vars.
  Produces project-context.md that all agents read. Use this skill whenever someone says
  'set up my project', 'configure this for my SaaS', 'onboard', 'get started', 'initialize',
  or when project-context.md doesn't exist -- even if they don't say 'onboard' explicitly.
---

# Onboard Project

## TL;DR

First-run setup. 7 phases. One question at a time. Produces `project-context.md` — the file every agent reads to understand what this SaaS is about.

## Decision Tree

```
project-context.md exists?
  YES → "Already configured. Edit project-context.md or delete to re-run."
  NO  → Run full onboarding (7 phases)
```

## Workflow

### Phase 1 — Project Identity
5 questions, one at a time:
1. Product name
2. One-line description
3. Target user (role, industry, size)
4. Problem solved (pain point)
5. Differentiator

### Phase 2 — Design
3 questions:
6. Brand color — preset (Dark Electric Blue 232°, Warm Amber 44°, Forest Green 145°, Royal Purple 300°, Coral Red 25°) or custom hex
7. Logo — SVG file or text-only?
8. Default theme — dark or light?

### Phase 3 — Tech Stack
Present full table, buyer confirms which to enable:

| Service | Purpose | Default | Key |
|---------|---------|---------|-----|
| Convex | Backend, DB, real-time | Required | CONVEX_DEPLOYMENT, NEXT_PUBLIC_CONVEX_URL |
| Clerk | Auth, users, orgs, RBAC | Required | NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET |
| Polar.sh | Billing, subscriptions | Default ON | POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET |
| Vercel AI SDK | AI features (multi-provider) | Default ON | AI_GATEWAY_URL |
| fal.ai | Image/video generation | OFF | FAL_KEY |
| ElevenLabs | Voice synthesis, voice agent | OFF | ELEVENLABS_API_KEY |
| Resend | Transactional email | OFF | RESEND_API_KEY |
| Firecrawl | Web scraping, crawling | OFF | FIRECRAWL_API_KEY |

### Phase 4 — Environment
Generate `.env.local` with only needed keys. Guide buyer through filling each one.
Verify: `npm install && npx convex dev`

### Phase 5 — Write project-context.md
Compile all answers into structured file at repo root. This is what agents read.

### Phase 6 — Apply Design
Apply chosen color preset or generate custom OKLCH preset file.

### Phase 7 — Landing Page Content (optional)
Update i18n files with product identity if buyer wants.

## When Things Go Wrong

- Buyer says "skip" → respect it, mark as "pending" in project-context.md
- API key doesn't work → note it, don't block. Mark as "pending" in env section.
- `npx convex dev` fails → check if CONVEX_DEPLOYMENT is set. Guide buyer to Convex dashboard.

## Rules

- ONE question at a time. Never bundle.
- Never skip required phases (1-5). Phases 6-7 are optional.
- project-context.md is written ONCE at the end, not incrementally.
- If project-context.md already exists, refuse to overwrite.

## Sellable As

Part of VantageStarter boilerplate — the "open Claude Code, answer 10 questions, your SaaS is configured" experience.
