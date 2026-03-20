# VantageStarter — Landing Page Copy (Source of Truth)

Last updated: 2026-03-20
Status: APPROVED by Laurent, ready for implementation

---

## HERO

### Headline
**Born agentic.**
**Not** ~~retrofitted~~ ~~refactored~~ ~~patched~~**.**

> The last word animates: cycles through "retrofitted", "refactored", "patched" with a strikethrough effect. 3s interval. CSS only, no Framer Motion.

### Subline
Every SaaS starter kit bolted AI on later. VantageStarter was architected for agents from commit one — speak your intent, watch agents execute. Real-time backend, voice-powered Architect, generative UI, credit billing, 36-agent plugin army included.

### CTAs
- **Primary:** Get VantageStarter
- **Secondary:** View the architecture

### Social proof line (below CTAs)
Built on Convex. Shipped with Clerk. Powered by AI SDK v6.

---

## FEATURES

### Section eyebrow
What the agentic era demands

### Section heading
The stack that assumes AI is the product

### 7 Features

1. **Voice-powered Architect**
   Speak your intent. ElevenLabs processes it in real-time via WebRTC. The Architect decomposes your words into a structured mission plan — operations, dependencies, checkpoints — and reads it back. Say "confirm" and it commits. No typing required.

2. **AI that renders, not replies**
   AI SDK v6 + Generative UI. Your agents return interactive React components — not walls of markdown the user has to parse.

3. **Real-time without the plumbing**
   Convex reactive queries. Zero config. Your data updates everywhere, the moment it changes. No polling. No websocket boilerplate.

4. **Credit billing from day one**
   AI costs money. The credit system is in the schema, not an afterthought. Metered usage, balance tracking, and gate logic — already wired. Voice sessions billed in credits too.

5. **Media generation out of the box**
   fal.ai for images and video. Firecrawl for web intelligence. Connected, typed, ready. Not a "coming soon" integration page.

6. **36 agents. Not 36 templates.**
   A Claude Code plugin army that writes, audits, deploys, scores, and ships. Vibe coders get a team, not a folder of components.

7. **7 locales from commit one**
   i18n is infrastructure, not a feature request six months in. Seven languages. Every string. Day zero.

---

## SOCIAL PROOF REPLACEMENT

### Section heading
We are building on it. Right now.

### Copy
No testimonials yet. We launched weeks ago — not years.

Instead of fabricated quotes, here is what we can show you: we are building the hackathon submission for the ElevenLabs x Firecrawl hackathon on VantageStarter itself. The voice Architect (ElevenLabs), the json-render pipeline, the Convex real-time layer, the credit system, the agent orchestration — all running in production code we are writing today.

You are not buying a product with 8,000 users and three years of accumulated debt. You are buying the architecture those 8,000 users will wish they had started with.

Early adopters do not need social proof. They need a technical edge.

### Element
Link to hackathon build log or live demo (when available)

---

## PRICING

### Section eyebrow
Simple pricing

### Section heading
One product. Two options. No per-seat nonsense.

### Tiers

#### Free — Starter
**$0**
The architecture, open. See what agentic-native looks like before you commit.

- Next.js 15 + App Router
- Convex real-time database
- Clerk authentication
- Dark/light mode + 7 color presets
- i18n (7 locales)
- Landing page + dashboard shell
- Community support (GitHub)

CTA: Clone the repo

#### Pro — Full Stack
**$99** one-time
Everything. No upsells. No "team tier". No per-seat pricing. You are a solo founder or a vibe coder — this is your entire stack.

- Everything in Starter, plus:
- AI SDK v6 + Generative UI (json-render SpecStream)
- Voice Architect (ElevenLabs Conversational AI — speak your mission, agents execute)
- Credit system (metered billing, balance, gates — voice sessions included)
- Polar.sh subscription + one-time billing
- fal.ai media generation integration
- Firecrawl web scraping integration
- Chat UI with tool indicators
- 36-agent Claude Code plugin army
- 7 color preset system (OKLCH)
- Priority updates + Discord access
- Lifetime license, unlimited projects

CTA: Get VantageStarter — $99

### Note below pricing
One-time payment. Build unlimited projects. No subscriptions. No renewals. Yours forever.

---

## FAQ

### Section heading
Questions

### Q&A

**What do I get exactly?**
A complete Next.js 15 codebase with Convex backend (13 tables), Clerk auth (SSO, MFA, orgs), Polar.sh billing (subscriptions + one-time), AI SDK v6 with Generative UI, a credit system, ElevenLabs voice Architect (Conversational AI), fal.ai integration, Firecrawl integration, i18n in 7 languages, 7 OKLCH color presets, Chat UI with tool-call rendering, and a 36-agent Claude Code plugin that helps you build on the codebase. Plus docs, a Discord community, and lifetime updates.

**What is Generative UI? Why does it matter?**
Most boilerplates give you a chat box that returns text. Generative UI means your AI returns actual React components — charts, forms, cards, tables — rendered in real-time. The user interacts with UI, not markdown. This is how ChatGPT, v0, and Claude Artifacts work. VantageStarter gives you this pattern out of the box with json-render for schema-constrained structured output.

**What is the credit system?**
Every AI call costs money. The credit system tracks usage per user, enforces limits, and integrates with billing. It is built into the Convex schema — not a wrapper you add later. When a user runs an AI action, credits debit automatically. When they run out, gates block further usage until they upgrade. Voice sessions (ElevenLabs) are also billed in credits. This is table-stakes for any AI product, and no other boilerplate ships it.

**Does it support voice?**
Yes — voice is the primary interface for the Architect feature. ElevenLabs Conversational AI handles speech-to-text, the agent processes your intent via `clientTools`, and the plan is read back aloud. The full flow: speak → Architect decomposes your intent → structured mission plan proposed → verbal confirmation → committed to database in real-time. Voice is feature-flagged (`NEXT_PUBLIC_ELEVENLABS_ENABLED`). When the flag is off, zero ElevenLabs API cost. When on, sessions are metered in credits. Bring your own ElevenLabs API key.

**What is the 36-agent plugin army?**
A Claude Code plugin with 36 specialized agents: frontend dev, Convex expert, Clerk expert, security auditor, SEO specialist, product manager, and more. When you work on VantageStarter, these agents understand the codebase, follow its conventions, and build features correctly. It is not AI-assisted coding — it is a dev team in your terminal.

**What tech stack is this built on?**
- Frontend: Next.js 15, React 19, Tailwind CSS, shadcn/ui
- Backend: Convex (real-time database + server functions)
- Auth: Clerk (SSO, MFA, organizations, webhooks)
- Billing: Polar.sh (subscriptions, one-time, webhooks)
- AI: Vercel AI SDK v6, json-render
- Voice: ElevenLabs (Conversational AI, WebRTC, TTS)
- Media: fal.ai (image/video generation)
- Scraping: Firecrawl
- i18n: next-intl (7 locales)
- Styling: OKLCH color system, 7 presets

**Why Convex instead of Supabase or Prisma?**
Convex is a reactive database. When data changes, every connected client updates instantly — no websockets to configure, no polling, no cache invalidation. For AI products where agents modify data in real-time, this is not optional. Supabase requires RLS rules and manual real-time setup. Prisma has no real-time story. Convex makes real-time the default.

**Why Polar.sh instead of Stripe?**
Polar.sh is built for developers and digital products. Simpler API, native support for license keys, usage-based billing, and GitHub integration. Stripe is powerful but complex — its webhook handling alone takes days to get right. Polar.sh gives you checkout, subscriptions, and customer portal with less code and less surface area for bugs.

**Why Clerk instead of NextAuth or Supabase Auth?**
Clerk is a complete identity platform: social SSO, MFA, organizations, RBAC, user management dashboard, webhook sync to your database. NextAuth requires building all of this yourself. Supabase Auth is good but tied to the Supabase ecosystem. Clerk works with any backend and provides the admin tools you will need at scale.

**Can I use this with Cursor, Copilot, or other AI editors?**
Yes. The 36-agent plugin is designed for Claude Code, but the codebase itself works with any AI editor. It is clean TypeScript with strict settings, consistent patterns, and extensive type safety — exactly what AI editors need to generate correct code.

**Do I need to know Convex?**
No. The 36-agent plugin includes a Convex expert that writes queries, mutations, and actions for you. The schema is documented. The patterns are consistent. If you can read TypeScript, you can work with Convex in an afternoon.

**Is this just for AI apps?**
No. The auth, billing, i18n, and UI layers work for any SaaS. The AI features (Generative UI, credits, fal.ai, Firecrawl) are there if you need them — and most apps will, sooner than you think.

**How is this different from ShipFast?**
See the full comparison: [/compare/shipfast](/compare/shipfast)

**How is this different from MakerKit?**
See the full comparison: [/compare/makerkit](/compare/makerkit)

**Can I get a refund?**
If you purchase the Pro tier and find VantageStarter does not meet your needs within 30 days, contact us for a full refund. No questions asked.

**How often is it updated?**
We ship updates continuously. The codebase tracks the latest stable versions of Next.js, Convex, Clerk, and AI SDK. You get lifetime updates — when we improve it for our own projects, you get the same update.

**Who built this?**
Laurent Perello. 25 years in tech — Web1, Web2, Web3, now Web AI. Solo founder running the entire operation with Claude Code agents. VantageStarter is the boilerplate he uses for his own products. The tool IS the product.

---

## COMPARISON PAGE: /compare/shipfast

### Page title
VantageStarter vs ShipFast

### Intro
ShipFast is the most popular Next.js boilerplate, built by Marc Lou in 2023. It helped 8,000+ indie makers ship SaaS products. But it was designed before the agentic era.

### Comparison table

| Dimension | VantageStarter | ShipFast |
|-----------|---------------|----------|
| **Era** | 2026, agentic-native | 2023, pre-agentic |
| **Database** | Convex (real-time reactive) | MongoDB or Supabase (request-response) |
| **Auth** | Clerk (SSO, MFA, orgs, RBAC) | NextAuth (basic) |
| **Billing** | Polar.sh (modern, dev-first) | Stripe or Lemon Squeezy |
| **AI** | AI SDK v6 + Generative UI (renders components) | None (add your own) |
| **Voice** | ElevenLabs (Conversational AI, voice Architect) | None |
| **Credit system** | Built into schema | None |
| **Media generation** | fal.ai out of the box | None |
| **Web scraping** | Firecrawl out of the box | None |
| **Agent support** | 36-agent Claude Code plugin | "Works with Cursor" (FAQ answer) |
| **Real-time** | Native (Convex) | Manual websocket or polling |
| **i18n** | 7 locales from day 1 | None |
| **Color system** | OKLCH with 7 presets | Tailwind defaults |
| **Price** | $99 one-time | $199-$299 one-time |
| **Community** | Discord + GitHub | Discord (5,000+ members) |
| **Social proof** | New — early adopter opportunity | 8,211 users |

### The honest take
ShipFast is battle-tested for traditional SaaS. If you need a blog, a Stripe checkout, and a login page — it works.

But if your product involves AI agents, real-time data, generative interfaces, or usage-based billing — ShipFast's architecture was not designed for this. You will spend the time you "saved" rebuilding the data layer, adding a credit system, and wiring AI SDK into a codebase that assumes request-response.

VantageStarter assumes AI is the product. ShipFast assumes AI is the developer's tool. Choose accordingly.

---

## COMPARISON PAGE: /compare/makerkit

### Page title
VantageStarter vs MakerKit

### Intro
MakerKit is the most complete Next.js SaaS starter kit, maintained full-time since 2022. 400+ pages of docs, daily updates, excellent support. It is the professional choice for B2B SaaS.

### Comparison table

| Dimension | VantageStarter | MakerKit |
|-----------|---------------|----------|
| **Era** | 2026, agentic-native | 2022, pre-agentic (AI added 2025) |
| **Database** | Convex (real-time reactive) | Supabase, Drizzle, or Prisma |
| **Auth** | Clerk | Supabase Auth or Better Auth |
| **Billing** | Polar.sh | Stripe |
| **AI** | AI SDK v6 + Generative UI | "AI Agents Rules" + MCP Server (DX tool, not product feature) |
| **Voice** | ElevenLabs (Conversational AI, voice Architect) | None |
| **Credit system** | Built into schema | None |
| **Media generation** | fal.ai out of the box | None |
| **Web scraping** | Firecrawl out of the box | None |
| **Agent support** | 36-agent plugin (builds features) | MCP Server (navigates codebase) |
| **Real-time** | Native (Convex) | Supabase Realtime (config required) |
| **i18n** | 7 locales | Yes (built-in) |
| **Multi-tenancy** | Clerk organizations | Full (orgs, invites, RBAC) |
| **Super Admin** | Not yet | Yes |
| **Blog / Docs CMS** | Not yet | Yes (Markdoc) |
| **E2E Testing** | Not yet | Playwright |
| **Price** | $99 one-time | $299-$649 one-time |
| **Docs** | Growing | 400+ pages |

### The honest take
MakerKit is more complete today. It has blog, docs CMS, super admin, E2E testing, and a Figma kit. Four years of features.

But MakerKit's AI story is developer experience, not product architecture. Its MCP server helps YOUR editor write code faster. VantageStarter's AI features ship to YOUR USERS — generative interfaces, credit billing, media generation, web intelligence.

If you are building a traditional B2B SaaS with team management and Stripe billing, MakerKit is the mature choice. If your product's value proposition involves AI agents that render UI, consume credits, generate media, or scrape the web — VantageStarter gives you the architecture. MakerKit gives you a MCP server and wishes you luck.

### What MakerKit has that we do not (yet)
- Super Admin dashboard
- Blog / Documentation CMS
- E2E testing with Playwright
- Figma UI kit
- 400+ pages of documentation
- 4 years of community feedback

We are building these. But we will not ship them half-baked just to check boxes. When they arrive, they will be agentic-native too.

---

## FOOTER

### Content
- VantageStarter logo/text
- Legal | Privacy | Contact
- Copyright 2026

---

## FOUNDER SECTION (optional, add when ready)

### Heading
Built by a solo founder with 25 years in tech

### Copy
Laurent Perello. Web1, Web2, Web3, now Web AI. VantageStarter is the boilerplate he builds his own products on. Every feature exists because he needed it. Every agent runs because he uses it daily. No venture capital. No team. Just one founder and a 36-agent army.
