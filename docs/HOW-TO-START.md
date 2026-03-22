# How to Start — VantageStarter

Two paths to get started. Pick yours.

---

## Path 1 — AI-First (recommended)

Open the project in Claude Code. The system does the rest.

```bash
git clone https://github.com/vantage-starter/vantage-starter.git my-saas
cd my-saas
```

Open in Claude Code (VS Code extension or CLI). The session-start hook detects that `project-context.md` doesn't exist and prompts onboarding.

Say: **"Set up my project"**

The onboarding agent walks you through:
1. **Product identity** — name, description, target user, problem, differentiator (5 questions)
2. **Design** — brand color preset or custom, logo, dark/light theme
3. **Tech stack** — which services to enable (Convex, Clerk, Polar, AI SDK, fal.ai, ElevenLabs, Resend, Firecrawl)
4. **Environment** — generates `.env.local` with only your needed keys, guides you through each one
5. **Configuration** — writes `project-context.md` (every agent reads this), applies your color preset
6. **Landing page** — optionally updates copy with your product info

After onboarding: `npm run dev` and you have a running SaaS.

### What you get

- `project-context.md` — your product identity, design choices, tech stack. Every agent reads this.
- `.env.local` — configured for your stack
- Color preset applied to your brand
- 8 specialist agents that know your project:
  - `dev-frontend` — UI with lit-ui components
  - `dev-convex-expert` — backend, schema, real-time
  - `dev-clerk-expert` — auth, RBAC, organizations
  - `dev-senior-dev` — architecture, code review
  - `dev-seo` — SEO infrastructure
  - `dev-sentinel` — security audit
  - `accessibility-audit` — RGAA/WCAG compliance
  - `onboarding` — this setup (runs once)

### Working with the agents

Just describe what you want. The orchestrator routes to the right agent:

- "Add a pricing page" → `dev-frontend`
- "Set up Clerk organizations" → `dev-clerk-expert`
- "Add a users table with roles" → `dev-convex-expert`
- "Is this secure?" → `dev-sentinel`
- "Review this code" → `dev-senior-dev`

---

## Path 2 — Manual Setup

Follow `docs/SETUP.md` for step-by-step manual configuration. Same result, more control, more time.

---

## After Setup

### Daily workflow

1. Open Claude Code
2. Describe what you want to build
3. The orchestrator delegates to the right agent
4. Review the result
5. Commit when satisfied

### Key files

| File | Purpose |
|------|---------|
| `project-context.md` | Your product identity — agents read this |
| `CLAUDE.md` | Orchestrator rules and agent routing |
| `.claude/agents/` | 8 specialist agents |
| `.claude/skills/lit-ui/` | 33 component skills |
| `.claude/skills/` | 18 design skills (impeccable) |
| `docs/SETUP.md` | Manual setup guide |
| `docs/CUSTOMIZING.md` | How to adapt for your SaaS |
| `docs/AGENT-GUIDE.md` | How to use the bundled agents |
