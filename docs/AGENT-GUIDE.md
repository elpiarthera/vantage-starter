# Agent Guide — Using the Bundled AI Development Team

VantageStarter ships with a pre-configured team of specialist agents in `.claude/agents/`. When you open this project in Claude Code, these agents are available immediately. No setup required.

---

## What agents are bundled

| Agent file | Name | Specialty |
|-----------|------|-----------|
| `frontend-dev.md` | `dev-frontend` | UI components, pages, Tailwind CSS, responsive design, lit-ui |
| `convex-expert.md` | `dev-convex-expert` | Schema design, queries, mutations, actions, cron jobs, file storage |
| `clerk-expert.md` | `dev-clerk-expert` | Auth setup, middleware, organizations, RBAC, custom sign-in flows |
| `seo-dev.md` | `dev-seo` | Metadata, canonical URLs, schema.org, sitemap.ts, robots.ts |
| `sentinel.md` | `dev-sentinel` | Security audits, OWASP Top 10, dependency vulnerabilities, CSP headers |
| `senior-dev.md` | `dev-senior-dev` | Architecture decisions, code review, PR review, refactoring |
| `accessibility-audit.md` | `accessibility-audit` | RGAA/WCAG compliance, contrast, keyboard navigation, screen readers |

---

## How to invoke agents in Claude Code

### Inline delegation (recommended)
When you describe your task, Claude Code will automatically route to the right agent based on the routing table in `CLAUDE.md`. Just describe what you want:

```
"Add a subscription pricing page with Polar checkout"
→ routes to dev-polar-expert for billing logic, dev-frontend for UI

"Review the auth middleware for security issues"
→ routes to dev-sentinel + dev-clerk-expert
```

### Explicit subagent invocation
You can explicitly invoke an agent by name:

```
Use dev-frontend to build a dashboard sidebar with collapsible navigation
```

```
Use dev-convex-expert to add a messages table with full-text search
```

---

## Design system skills (Impeccable)

The `.claude/skills/` directory contains 21 design critique and improvement skills. These are invoked contextually when working on UI:

| Skill | What it does |
|-------|-------------|
| `critique` | Identifies design anti-patterns in a component |
| `polish` | Refines spacing, typography, and visual hierarchy |
| `typeset` | Fixes font choices, line-height, and text rhythm |
| `colorize` | Applies the OKLCH hue 44° palette consistently |
| `animate` | Adds purposeful micro-interactions |
| `harden` | Checks accessibility and contrast |
| `distill` | Strips complexity, improves signal/noise ratio |
| `optimize` | Performance — lazy loading, image optimization, bundle |
| `normalize` | Aligns to lit-ui conventions |
| `frontend-design` | Umbrella skill for full component review |

Invoke explicitly: `Use the polish skill on this component`

---

## Quality gate

Every file change triggers a TypeScript check automatically (configured in `.claude/settings.json`). Before committing:

```bash
npx tsc --noEmit    # catches type errors (build ignores these)
npx biome check .   # linting + formatting
```

Both must pass. No exceptions.

---

## Adding custom agents for your domain

If you build a SaaS in a specific domain (e.g., healthcare, e-commerce, legal), add domain-specific agents:

1. Create `.claude/agents/your-agent.md`
2. Required frontmatter:

```yaml
---
name: your-agent-name
description: One-line description of what this agent handles. Include trigger keywords.
tools: Read, Write, Edit, Bash, Grep, Glob
---
```

3. Add a routing entry in `CLAUDE.md` under the orchestration table.

**Example agents to add:**
- `stripe-expert.md` — if you switch billing from Polar to Stripe
- `email-expert.md` — if you add transactional email (Resend, Postmark)
- `analytics-expert.md` — if you add PostHog or Mixpanel

---

## How the quality gate works

`.claude/settings.json` configures a `PostToolUse` hook: every time an agent writes or edits a file, `tsc --noEmit` runs automatically and the output is shown inline. This catches type regressions before they accumulate.

For production deployments, the CI pipeline (GitHub Actions) runs both `tsc --noEmit` and `biome check` as hard gates.
