---
name: close-day
description: >
  End-of-day routine: update tasks, write diary, harvest friction, store session summary.
  Use this skill whenever the user says "close day", "end of day", "fin de journée",
  "bonne nuit", "wrap up", "call it a day", "close session", "daily close",
  or mentions ending their work session -- even if they don't say "close-day" explicitly.
allowed-tools: Read Write Bash Glob Grep
metadata:
  version: "1.1.0"
  user-invocable: true
license: Proprietary
---

You are the end-of-day routine. You run once at session end to close out the day cleanly.

---

## WHAT YOU DO

Five steps, in order:
1. **Update tasks** — review and update all task statuses in VantagePeers
2. **Write diary** — store the day's diary entry in VantagePeers
3. **Friction harvest** — surface 3 sub-optimalities observed today (RULE #15 — mandatory)
4. **Store session summary** — save a memory summarizing the session
5. **Close** — set summary to "session closed"

---

## WORKFLOW

**Step 1 — Detect identity (silent)**

Determine who you are:
- Read the workspace CLAUDE.md to find the orchestrator role (pi/tau/phi)
- Determine instanceId from hostname: VPS = `{role}-vps`, Chromebook = `{role}-chromebook`
- Run `date` to get current date in ISO format (YYYY-MM-DD) and day number

**Step 2 — Update tasks**

Fetch tasks:
- `mcp__vantage-peers__list_tasks` assignedTo={role}, status="in_progress"
- `mcp__vantage-peers__list_tasks` assignedTo={role}, status="todo"

For each in_progress task:
- If completed today → `mcp__vantage-peers__complete_task`
- If partially done → leave as in_progress
- If blocked → `mcp__vantage-peers__update_task` status="blocked"
- If needs review → `mcp__vantage-peers__update_task` status="review"

Show the user a summary:
```
TASK STATUS UPDATE:
- Completed: X tasks
- In progress: X tasks (carrying to tomorrow)
- Blocked: X tasks
- Review: X tasks
- Todo: X tasks remaining
```

**Step 3 — Write diary (autonomous — do NOT ask the user)**

Write the diary entry from YOUR OWN perspective. You know what you did today — your tasks, completions, messages sent/received, blockers, observations. Do NOT ask the user "Key moments?" or any other question. The diary is YOUR report.

To build context, recall:
- `mcp__vantage-peers__list_tasks` assignedTo={role}, status="done" — what you completed today
- `mcp__vantage-peers__list_messages` — messages exchanged today
- Your own session memory — what you worked on, what surprised you, what failed

Then write:
- `mcp__vantage-peers__write_diary` with date={today}, orchestrator={role}
- Content: what was done, decisions made, blockers encountered, lessons learned — from YOUR perspective
- highlights: list of key achievements
- blockers: list of blockers (if any)

**Step 4 — Friction harvest (RULE #15 — non-negotiable)**

You MUST surface 3 sub-optimalities observed today. RULE #15 (AUTO-AMÉLIORATION) doctrine: orchestrators have executive function (do tasks) but lacked meta-cognitive function (improve the system). When you encounter friction, you flag it and propose the fix — you never silently work around. This step is the daily forcing function.

Reflect on the day across these axes (non-exhaustive prompts):
- Tools that misbehaved (CronCreate ignoring durable flag, MCP schema gaps, CLI noisy warnings)
- Hooks that triggered false positives (you used `// allow-...` override marker — that's a friction signal)
- Skills/runbooks/agents with workarounds documented but root cause unfixed
- VantagePeers ergonomic gaps (missing field, payload too heavy, status alias missing)
- CLAUDE.md doctrine ambiguity that cost you a re-run
- Subagent dispatch friction (wrong specialist matched, brief gap, model mismatch)
- Documentation drift (skill says X, behavior says Y)

Produce exactly 3 entries. For each entry classify it:

- **Has a clear fix** (you know what to change + where) → auto-create improvement task in VantagePeers:
  - `mcp__vantage-peers__create_task` with:
    - `title="improvement: <area>"` (e.g. `improvement: CronCreate durable flag silent ignore`)
    - `assignedTo=<relevant orchestrator>` — derive from area: hook bug → pi (fleet doctrine) | VP MCP gap → sigma | VR catalog gap → omega | extension layer → chi/athena/hermes/demeter | gws CLI → pi | other → pi (triage)
    - `priority="medium"`
    - `createdBy={role}`
    - `description` MUST include:
      - `[META]` opt-out tag (no subagent dispatch required — improvement tasks are orchestrator-owned scoping work) OR proper subagent triplet if fix is implementation-ready
      - Free-text reflection: what failed, what root cause looks like, what fix to ship
      - `VERIFICATION:` section (how to know it's fixed)
      - `TESTS:` section (what gates must pass)
      - Reference to RULE #15 in description footer

- **No clear fix yet** (you only know it hurts, not how to fix) → log as friction event:
  - `mcp__vantage-peers__store_memory` with:
    - `namespace="audit/friction"`
    - `type="reference"`
    - `createdBy={role}`
    - `content`: structured note `friction: <area> | observed: <what happened> | impact: <cost> | hypothesis: <best guess if any> | day: <N>`
    - Tag with date + orchestrator role for weekly digest aggregation

Show the user the harvest summary:
```
FRICTION HARVEST (3 observed):
1. <area> — [task k<id>] or [memory j<id>]
2. <area> — [task k<id>] or [memory j<id>]
3. <area> — [task k<id>] or [memory j<id>]
```

**Step 4.5 — Pi fleet aggregate (Pi orchestrator ONLY — skip if {role} != pi)**

If you are Pi, after harvesting your own 3 frictions you ALSO aggregate fleet-wide friction events:

- `mcp__vantage-peers__list_memories` namespace="audit/friction" — filter to past 7 days client-side
- Group by area / orchestrator / recurrence count
- Surface top 3 most frequent or highest-impact frictions across fleet
- If a clear batched fix emerges (≥2 BUs hit same friction, OR single-BU friction with cross-fleet relevance) → propose batched improvement mission:
  - `mcp__vantage-peers__create_mission` with:
    - `name="pi-friction-batch-fix-<weeklabel>"`
    - `pilot="pi"`
    - `brief`: cites template `mission-generic-v1`, lists top 3 fleet frictions, proposes the batched fix scope, references RULE #15 + this skill
    - `status="plan"` (Laurent reviews before execute)
    - `createdBy="pi"`
- Else (no clean batch) → log Pi-level aggregate memory `namespace="audit/friction"` `type="reference"` with the weekly top-3 snapshot for next week's aggregation

Show Pi-specific summary:
```
FLEET FRICTION AGGREGATE (past 7 days):
- Top 3: <area1> (Nx), <area2> (Nx), <area3> (Nx)
- Batched mission: [k<id>] OR [no batch this week — snapshot stored j<id>]
```

**Step 5 — Store session summary**

Store a project memory summarizing the session:
- `mcp__vantage-peers__store_memory` namespace="orchestrator/{role}", type="project"
- Content: 3-5 sentence summary of what happened, what's pending, what's next
- Include: count of improvement tasks created today + friction memories logged

**Step 6 — Close**

Set summary to closed:
- `mcp__vantage-peers__set_summary` orchestratorId={role}, instanceId={instanceId}, summary="Session closed — {date}"

Say: "Day closed. {X} tasks updated, diary written, {Y} improvement tasks + {Z} friction memories harvested, summary stored."

---

## RULES

- Never skip task update. Every in_progress task must be accounted for.
- Diary is mandatory. Even if it's short. "Nothing notable" is not acceptable — something always happened.
- NEVER ask the user for diary input. Write autonomously from your own context.
- **Friction harvest is non-negotiable (RULE #15).** Exactly 3 frictions per close-day. "Nothing sub-optimal today" is BANNED — there is always friction, you just stopped noticing. If you genuinely cannot surface 3, that itself is friction (perception drift) and counts as one of the 3.
- **Don't gold-plate the fix.** Improvement task description = scope + verification + tests. Do NOT solve the friction inside the close-day skill — that's a separate task.
- **Pi aggregate runs once per week minimum.** If past 7-day window has been aggregated already (check last `pi-friction-batch-fix-*` mission), Pi may skip the batched mission proposal but MUST still log the weekly snapshot memory.
- The session summary must be useful for the NEXT session startup — include what's pending and what to start with.
- This skill works for any orchestrator (Pi, Tau, Phi, and all fleet BUs). It auto-detects identity from the workspace.
- Commit all uncommitted changes before closing. New branch if not already on one. Push to remote. This is part of the close-day routine — no dirty state overnight.

---

## SELLABLE AS

`perello-daily-planner` — part of `perello-executive` plugin. The close-day counterpart to daily-start.

---

## Changelog

- **v1.1.0 — Day 89 (2026-05-31)** — Added mandatory Step 4 "Friction harvest" enforcing RULE #15 (AUTO-AMÉLIORATION). Orchestrator surfaces 3 sub-optimalities per close-day; clear-fix entries become VP improvement tasks (`title="improvement: <area>"`), no-fix entries become VP friction memories (`namespace="audit/friction"` `type="reference"`). Pi orchestrator gains Step 4.5 fleet aggregate over past 7 days, surfacing top 3 fleet frictions and proposing batched improvement mission when ≥2 BUs hit same friction. Step numbering shifted (Store session summary → Step 5, Close → Step 6).
- **v1.0.0** — Initial release. Four-step close routine: update tasks, write diary, store session summary, close.
