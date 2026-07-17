<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:vantagestarter-rules -->

# VantageStarter: Project Rules

## Read before any work
- `CLAUDE.md` — orchestrator rules, agent routing, stack, conventions
- `project-context.md` — product identity, design, tech stack (if it exists)

## Component layers
- Primary: shadcn/ui (`components/ui/`) with lucide-react icons
- Secondary: lit-ui web components (`src/components/ui/`, `lui-*` tags, `ui-button` alias) on landing/dashboard surfaces
- Match the layer already used in the file you edit

## Stack
- Next.js 15+ App Router
- Convex (backend, real-time)
- Clerk (auth, RBAC)
- Polar.sh (billing)
- Vercel AI SDK v6 (multi-provider)
- shadcn/ui (primary UI) + lit-ui web components (secondary, specific surfaces)
- Tailwind CSS with OKLCH tokens

## Conventions
- OKLCH colors only (no hex, no HSL, no Tailwind gray-*)
- i18n mandatory (next-intl, never hardcode strings)
- Server Components by default
- TypeScript strict (no `any`)
- Biome for linting/formatting

<!-- END:vantagestarter-rules -->

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
