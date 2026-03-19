# Memory Index — dev-senior-dev (VantageStarter)

## Sprint 7 — Orchestrator infrastructure port (2026-03-19)
Built hooks, scripts, evals, tests for VantageStarter's 7-agent team.
-> [project_sprint7_infrastructure.md](project_sprint7_infrastructure.md)

## Agent naming convention
Agent filename must match the `name:` field in frontmatter exactly.
VantageStarter agents use `dev-` prefix: `dev-frontend`, `dev-convex-expert`, `dev-clerk-expert`, `dev-seo`, `dev-sentinel`, `dev-senior-dev`. `accessibility-audit` has no prefix.
Files were renamed in Sprint 7 (was `frontend-dev.md` etc — now `dev-frontend.md`).

## settings.json is write-protected
`.claude/settings.json` cannot be modified by Write/Edit tools — Claude Code security model. To register hooks, user must edit manually. See project_sprint7_infrastructure.md for the exact JSON.
