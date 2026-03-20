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
| AI | Vercel AI SDK v6, tambo, json-render (Generative UI) |
| Media | fal.ai (image/video generation) |
| Scraping | Firecrawl |
| i18n | next-intl (7 locales) |
| Styling | OKLCH color system, 7 presets |

## What's included

- **Generative UI** -- AI SDK v6 + tambo + json-render. Agents return React components, not markdown.
- **Convex real-time** -- Reactive queries. Zero config. Data updates everywhere instantly.
- **Credit system** -- Metered AI billing in the schema. Balance tracking, usage gates, transaction history.
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
```

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
