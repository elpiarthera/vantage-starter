---
name: Sprint 7 — Orchestrator infrastructure
description: Hooks, scripts, evals, tests ported from ElPi Corp for VantageStarter's 7-agent team
type: project
---

## What was built

### Hooks (hooks/)
- `session-start-profiler.py` — SessionStart: injects active domain + stack context
- `user-prompt-submit-routing.py` — UserPromptSubmit: routes prompts to correct agent via phrase matching
- `subagent-start-bootstrap.py` — SubagentStart: injects comm style + orchestration protocol + stack constraints
- `post-tool-use-validate.py` — PostToolUse: checks TS anti-patterns (any, !important, missing Convex auth)
- `post-tool-use-qa.py` — PostToolUse: runs tsc --noEmit + biome check on changed TS/TSX files

### Scripts (scripts/)
- `validate-agents.py` — checks all .claude/agents/*.md frontmatter. 7/7 PASS.
- `validate-skills.py` — checks .claude/skills/ SKILL.md files
- `build-manifest.py` — pre-compiles agent+skill manifests to generated/
- `eval-routing.py` — routing eval corpus, uses actual hook logic. 25/25 PASS (100%).
- `eval-session.py` — session behavioral scorecard (delegation ratio, routing accuracy, brief quality, leakage)

### Evals (evals/)
- `routing-eval-corpus.json` — 25 prompt→agent mappings for all 7 agents
- `routing-baseline.json` — 100% baseline saved 2026-03-19

### Tests (tests/)
- `test-hooks.py` — 23 hook integration tests. 23/23 PASS.
- `golden/dev-frontend-brief.md` — brief quality golden fixture
- `golden/dev-convex-expert-brief.md` — brief quality golden fixture

### Agent renames
All 6 prefixed agents renamed to match their `name:` field:
- `clerk-expert.md` → `dev-clerk-expert.md`
- `convex-expert.md` → `dev-convex-expert.md`
- `frontend-dev.md` → `dev-frontend.md`
- `senior-dev.md` → `dev-senior-dev.md`
- `sentinel.md` → `dev-sentinel.md`
- `seo-dev.md` → `dev-seo.md`

## settings.json — MANUAL STEP REQUIRED

`.claude/settings.json` cannot be written by Claude Code tools. User must update manually.

Replace the current content with:

```json
{
  "permissions": {
    "allow": [
      "Read(**)", "Write(**)", "Edit(**)",
      "Bash(npx tsc --noEmit)", "Bash(npx biome check *)",
      "Bash(npx biome check . --write)", "Bash(npx biome format *)",
      "Bash(git *)", "Bash(ls *)", "Bash(mkdir *)", "Bash(cat *)",
      "Bash(python3 scripts/*)", "Bash(python3 tests/*)"
    ]
  },
  "hooks": {
    "SessionStart": [{"hooks": [{"type": "command", "command": "python3 /home/laurentperello/coding/vantage-starter/hooks/session-start-profiler.py"}]}],
    "UserPromptSubmit": [{"hooks": [{"type": "command", "command": "python3 /home/laurentperello/coding/vantage-starter/hooks/user-prompt-submit-routing.py"}]}],
    "SubagentStart": [{"hooks": [{"type": "command", "command": "python3 /home/laurentperello/coding/vantage-starter/hooks/subagent-start-bootstrap.py"}]}],
    "PostToolUse": [{"matcher": "Write|Edit", "hooks": [
      {"type": "command", "command": "python3 /home/laurentperello/coding/vantage-starter/hooks/post-tool-use-validate.py"},
      {"type": "command", "command": "python3 /home/laurentperello/coding/vantage-starter/hooks/post-tool-use-qa.py"}
    ]}]
  }
}
```

**Why:** Claude Code protects its own settings file from programmatic writes. This is intentional security — changes to hooks require explicit human approval.
**How to apply:** When deploying VantageStarter or after a fresh clone, update settings.json manually before first session.
