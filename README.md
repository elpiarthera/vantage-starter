# VantageStarter

Born agentic. Not retrofitted.

The Next.js boilerplate for the agentic era. AI renders components, not text. Real-time by default. Credit billing built in.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui |
| Backend | Convex (real-time database + server functions) |
| Auth | Clerk (SSO, MFA, organizations, RBAC) |
| Billing | Polar.sh (subscriptions, one-time, webhooks) |
| AI | Vercel AI SDK v6, json-render (Generative UI) |
| Voice | ElevenLabs (Conversational AI, WebRTC, TTS) |
| Media | fal.ai (image/video generation) |
| Scraping | Firecrawl |
| i18n | next-intl (7 locales) |
| Styling | OKLCH color system, 7 presets |

## What's included

- **Voice Architect** -- ElevenLabs Conversational AI. Speak your mission intent, the Architect decomposes it into a structured plan, reads it back, and commits on confirmation. Feature-flagged, zero cost when off.
- **Generative UI** -- AI SDK v6 + json-render. Agents return React components, not markdown.
- **Convex real-time** -- Reactive queries. Zero config. Data updates everywhere instantly.
- **Credit system** -- Metered AI billing in the schema. Balance tracking, usage gates, transaction history. Voice sessions billed in credits.
- **fal.ai integration** -- Image and video generation wired and ready.
- **Firecrawl integration** -- Web scraping and search out of the box.
- **Clerk auth** -- SSO, MFA, organizations, webhook sync to Convex.
- **Polar.sh billing** -- Subscriptions, one-time purchases, customer portal.
- **Chat UI** -- Streaming chat with tool-call indicators and component rendering.
- **i18n** -- 7 locales (EN, FR, DE, ES, IT, PT, RU) from day one.
- **7 color presets** -- OKLCH-based theming with dark/light mode.
- **36-agent Claude Code plugin** -- Frontend dev, Convex expert, security auditor, and more.
- **Landing page** -- Marketing page with hero, features, pricing.
- **Dashboard shell** -- Sidebar nav, responsive layout, loading states.

## Getting started

```bash
git clone https://github.com/elpiarthera/vantage-starter.git
cd vantage-starter
pnpm install
cp .env.example .env.local
# Fill in Clerk, Convex, Polar, fal.ai keys
npx convex dev
pnpm dev
```

## Environment variables

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
FAL_KEY=...
FIRECRAWL_API_KEY=...
POLAR_ACCESS_TOKEN=...
# ElevenLabs voice (optional — set NEXT_PUBLIC_ELEVENLABS_ENABLED=true to activate)
ELEVENLABS_API_KEY=
ELEVENLABS_ARCHITECT_AGENT_ID=
ELEVENLABS_NARRATOR_VOICE_ID=
NEXT_PUBLIC_ELEVENLABS_ENABLED=false
```

## Translation QA

```bash
node scripts/check-translations.js
```

Runs three controls against the whole `app/` + `components/` surface and every locale in `i18n/routing.ts` — never a hand-typed subset:

1. **Hardcoded literal scan** — generic TypeScript-AST pass flagging English JSX text, `aria-label`/`placeholder`/`title`/`alt` string attributes, and hardcoded locale tags (`toLocaleDateString("en-US", ...)`) anywhere in the derived file inventory.
2. **Key parity across all 7 locales** — every key in every `messages/<locale>.json` must exist in all 7 locale files. Locales are parsed out of `i18n/routing.ts`, not retyped, so a namespace that only ships in `en`/`fr` (and silently ships nowhere else) cannot hide behind an en/fr-only check.
3. **fr === en byte-identical** — flags any key whose French value is a byte-for-byte copy of the English value (forgotten translation or copy-paste). Legitimate exceptions (proper nouns, product names) are declared explicitly in `FR_EN_IDENTICAL_ALLOW` inside the script — never silently skipped.

Exit 0 only when all three controls pass. Wired into CI (`.github/workflows/quality.yml`) and covered by a bipolar probe (`scripts/__tests__/check-translations.test.js`).

## Project structure

```
vantage-starter/
  app/[locale]/          # Pages (landing, dashboard, auth, chat)
  components/
    landing/             # Marketing page sections
    ui/                  # shadcn/ui primitives
    shared/              # Language switcher, theme toggle
  convex/
    schema.ts            # 13-table database schema
    *.ts                 # Queries, mutations, actions
  messages/              # Translation JSON (7 locales)
  styles/presets/        # OKLCH color presets
  docs/                  # Design system, copy, specs
  plugins/               # Claude Code agent plugin
```

## License

Proprietary. All rights reserved.

---

Built by Laurent Perello. 25 years in tech. Web1, Web2, Web3, Web AI.
