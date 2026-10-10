# Tool usage — claim → official tool + read the schema before calling (Day 110)

Always loaded. Covers correct caller-side use of MCP / CLI / Bash tools (read the schema, pick the right tool, never invent arguments). NOT about communication style — see `communication-style.md` for that.

Day 110 trigger: recurring frictions (Gmail instead of VantageCRM for Anthony Pujol, "Epsilon = UC1" claimed without `list_bus`, `list_missions status="execute,plan"` invalid_union instead of array). Memory `j570t51y`.

---

## Rule 1 — One official tool per claim type

For every claim type, the official tool MUST be called FIRST. If the tool was not run, do not assert (the "no assertion without proof" principle lives in `communication-style.md` — here we document WHICH tool for WHICH claim).

| To assert... | Run first... |
|---|---|
| "Anthony / Florian / a human contact's email" | `mcp__vantage-crm__search_contacts` |
| "Who owns UC1 / the vantage-immo BU / this orchestrator" | `mcp__vantage-peers__list_bus` or `get_bu` |
| "This decision was made on day D" | `mcp__vantage-peers__recall query="<topic>" namespace="project/<bu>"` |
| "Orchestrator N has not sent a message" | `mcp__vantage-peers__list_messages from=<N> recipient=pi limit=5` |
| "The repo for BU B lives at <path>" | `mcp__vantage-peers__list_repo_mappings` |
| "This VP task exists / is done" | `mcp__vantage-peers__get_task taskId=k<id>` |
| "This VP mission is in execute / plan" | `mcp__vantage-peers__get_mission missionId=k<id>` |
| "Hook X is blocking" | `cat .claude/hooks/<X>.py` + `cat .claude/settings.json` |
| "PR #X is merged" | `gh pr view <X> --json state,mergeCommit -R <owner>/<repo>` |
| "Vercel deploy is green" | `curl -sI <prod-url> \| head -1` |
| "Commit SHA Y is on main" | `gh api repos/<owner>/<repo>/commits/Y --jq .sha` |
| "Package npm v<n> exists" | `npm view <pkg> version` |
| "No SSH access to X" | `ssh -o ConnectTimeout=5 root@<host> 'echo OK'` |
| "Workspace Y does not exist" | `ssh root@code.vantageos.agency 'ls /root/coding/ \| grep <Y>'` |
| "The `.env.local` for Z lacks variable W" | `ssh root@code.vantageos.agency 'grep -c ^W= /root/coding/<Z>/.env.local'` |

**If the table does not cover the claim** → "I don't know how to verify that". Not a confident sentence.

**Session-memory special case**: before saying "I cannot X", search the current session for prior success on X. If found, re-run the same command.

---

## Rule 2 — Read the schema BEFORE every MCP call

**Before any MCP call**: read the schema loaded via `ToolSearch` or the function definition in the current context. Never invent arguments from memory.

The schema is in the current context — opening it costs 2 seconds; missing it costs a user-visible error.

### Recurring per-tool errors

| Tool | Recurring error | Correct usage |
|---|---|---|
| `mcp__vantage-peers__list_missions` | `status="execute,plan"` (CSV string) → invalid_union | `status=["execute","plan"]` (array) OR `status="active"` (alias) |
| `mcp__vantage-peers__list_tasks` | Same — CSV string instead of array OR alias | `status=["todo","in_progress"]` OR `status="open"` |
| `mcp__vantage-peers__check_messages` | Missing `recipientInstanceId` → messages lost | Always pass `recipient` + `recipientInstanceId` |
| `mcp__vantage-peers__mark_as_read` | Passing `messageIds` instead of `receiptIds` | `receiptIds` (returned by `check_messages`) |
| `mcp__vantage-registry__upsert_runbook` | Content too large in placeholder + retry | Send full content on first call |
| `mcp__vantage-peers__create_task` | Missing `VERIFICATION:` / `TESTS:` blocks | Use skill `dispatch-task-create` which injects them |
| `mcp__vantage-peers__send_message` | Free narrative paragraph instead of grid | Use skill `dispatch-message` v2 (`evidence/finding/action/next` grid) |
| `mcp__vantage-peers__send_message` | Specific agent addressed by name (`channel="pi-chromebook"`) | `recipientAgentIds=[<agentId from list_peers>]`; `channel` only for `broadcast` (Rule 5) |
| `mcp__vantage-peers__start_task` | Stale `in_progress` not clean → IRP block | Use skill `dispatch-task-start` which sweeps first |

### General pattern: enum union values

When a field accepts an enum union (`status`, `priority`, `type`, `namespace`), three valid shapes exist per schema:
- **Single enum value**: `"todo"` (most restrictive)
- **Array of enum values**: `["todo", "in_progress"]` (intersection)
- **Alias macro**: `"open"`, `"active"`, `"all"` (shorthand)

NEVER a CSV string `"todo,in_progress"` — no MCP server parses it.

---

## Rule 3 — Pull the artifact, not the report

This rule lives in `communication-style.md` (communication principle). The concrete application uses the tools above:

- Orchestrator claims "shipped" → `gh pr view <N> --json state,mergeCommit -R <repo>`
- Claims "deployed" → `curl -sI <prod-url> | head -1`
- Claims "Eta APPROVED" → `gh pr comment <N> -R <repo>` (read the verbatim)
- Claims "tests green" → `gh pr checks <N>` or read the ratio in the PR description

If the artifact cannot be pulled, tell Laurent "claim not verified" — never "DONE".

---

## Structural hook (to wire in T2.C follow-up)

`enforce-mcp-args-canonical.py` PreToolUse(mcp__vantage-peers__*, mcp__vantage-registry__*):
- Detects `status="<X>,<Y>"` (comma inside enum value) → BLOCK with array suggestion
- Detects `recipient` without `recipientInstanceId` on `check_messages` → WARN
- Override: `// allow-csv-enum: <reason>` (rare, never in practice).

Until this hook exists, this rule remains TEXT — relapse possible.

---

## Reference

- Day 110 friction memory: `j570t51y` (list_missions invalid_union).
- Doctrine RULE #8: "VantageRegistry = discoverable catalog, NOT RAG" — list_* + get_* + text_search BM25.
- Doctrine RULE #11: "Default to short replies" — use the tool, don't paraphrase.
- Canonical skills: `dispatch-task-create`, `dispatch-message`, `dispatch-task-start`, `dispatch-task-complete`, `check-messages`, `pre-compact`.

---

## Rule 4 — Typed-params first, never raw JSON when a schema exists (Day 113)

### Bad pattern (banned)

Composing `__unparsedToolInput` by hand to call an MCP tool that has a defined schema.

**Symptom**: `InputValidationError` surfaced to the operator. Day 113 — four `add_task_dependency` calls produced this error because `dependsOn` was written as a bare token instead of a string array.

**Why it happens**: Pi (or any orchestrator) writes `{"taskId": X, "dependsOn": Y}` as a raw string, forgets the quotes, or writes a string where the schema wants an array.

**Friction source**: memory `j5735jvgwyh5gb2frm21ct5wxh89ezpt` (audit/friction Day 113).

### Good pattern (recipe)

1. **BEFORE any non-trivial MCP call**, load the tool schema:

   ```
   ToolSearch query="select:<tool_name_1>,<tool_name_2>,..."
   ```

   Concrete example:

   ```
   ToolSearch query="select:mcp__vantage-peers__add_task_dependency,mcp__vantage-peers__update_mission_status,mcp__vantage-peers__send_message"
   ```

2. **Read the returned schema** (params, types, required).

3. **Invoke the tool via the structured-params form** (each param named, typed). NEVER via `__unparsedToolInput` when a schema exists.

### Typed example for `add_task_dependency`

Schema says: `taskId: string`, `dependsOn: array<string>`. Correct call:

```json
{
  "taskId": "k17xxx...",
  "dependsOn": ["k17yyy..."]
}
```

`dependsOn` is a **string array**, EVEN for a single predecessor. Wrap in `[...]`. Bare string or unquoted token = immediate `InputValidationError`.

### When raw JSON is acceptable (rare)

Only when a tool truly exposes no JSON schema (mostly experimental MCP servers). In that case, validate the string against an inline-documented contract before sending, and explicitly flag the technical debt.

### Canonical skill applying this recipe

`mission-bootstrap` v1.3.1 — VR canonical (`mcp__vantage-registry__get_skill_content name=mission-bootstrap`) — PRINCIPLE 6 + Step 0 pre-flight + Step 4 typed shape. Any orchestrator invoking this skill inherits the recipe automatically.

### Cross-ref

- Friction: memory `j5735jvgwyh5gb2frm21ct5wxh89ezpt` (audit/friction Day 113)
- Canonical skill: `mission-bootstrap` v1.3.1 (PRINCIPLE 6)
- Improvement task: `k174snqtcdfy9qwyv3f880kq9s89e3ag`
- Fleet-shared rule (this file): always loaded

---

## Rule 5 — `send_message` addresses a specific agent by `recipientAgentIds`; `channel=` is only for `broadcast` (Day 114, rewritten for M1)

### Bad patterns (banned)

- Addressing a specific agent — the fleet coordinator or a peer — by NAME: `channel="pi-chromebook"`, `channel="sigma"`, `channel="tau,phi"`. Identity is the unique agent ID, never a name. Channel names to specific agents stop being routed at backend M1b.
- Guessing, typing, or deriving an agent ID from a name. The ID is READ from `list_peers` output, nowhere else.
- Passing both `recipientAgentIds` and `channel` in one call (the backend refuses: `INVALID_RECIPIENTS`).
- Passing `recipient=<role>`, `recipientInstanceId=<host>`, or `broadcast=true` — the OLD signature retired on Day 111 (`MCP error -32602`). Day 114 — Pi typed `recipient=omega` after 110+ days of doctrine; friction memory `j57er0j2wr53x42qcfrqd74q6989eeg1`.

### Good pattern (recipe)

1. **BEFORE the first `send_message` of a session**, load the schema:

   ```
   ToolSearch query="select:mcp__vantage-peers__send_message"
   ```

2. **Resolve the recipient's agent ID from `list_peers`**: call `mcp__vantage-peers__list_peers`; each row carries `agentId` (`null` = not addressable). Take the `agentId` of the intended recipient's row exactly as printed. No row, or `agentId: null` → stop and report it; never fall back to a name.

3. **Invoke typed-params** (PRINCIPLE 6 + Rule 4) with exactly:

   ```json
   {
     "from": "<your role>",
     "fromInstanceId": "<your instance>",
     "recipientAgentIds": ["<agentId from list_peers>"],
     "content": "<grid>"
   }
   ```

### Target value shape

| Target | Parameter |
|---|---|
| One specific agent (coordinator or peer) | `recipientAgentIds: ["<agentId>"]` |
| Several specific agents | `recipientAgentIds: ["<agentId-a>", "<agentId-b>"]` (1-50) |
| The fleet coordinator | `recipientAgentIds: ["<coordinator agentId>"]` — recorded at onboarding in `.claude/config/coordinator.json` (copy it from the coordinator's `list_peers` row) |
| Fleet-wide | `channel: "broadcast"` (a name by design — the ONLY use of `channel`) |

### Coordinator ID at onboarding

Copy `.claude/config/coordinator.example.json` to `.claude/config/coordinator.json` and set `agentId` to the `agentId` of the coordinator's row in `list_peers` output. The `send_message` hooks (`enforce-decisive-messaging`, `enforce-no-task-in-message`) grant the coordinator its exemption by THIS ID only; with the file absent, empty or not ID-shaped, no exemption is granted by ID (fail closed).

### Transition (M1a → M1b)

Backend M1a accepts `recipientAgentIds` beside the legacy name path; M1b removes the name path for specific agents. Until M1b a name in `channel=` is still routed and the hooks still honour the legacy coordinator names — do not write new sends that way.

### Canonical skill applying this recipe

`dispatch-message` (Step 2 + Step 5): `list_peers` → `agentId` → `recipientAgentIds`; `channel=broadcast` only for fleet-wide.

### Cross-ref

- Friction: memory `j57er0j2wr53x42qcfrqd74q6989eeg1` (Day 114)
- Canonical skills: `dispatch-message` + `mission-bootstrap` v1.3.1 (PRINCIPLE 6 typed-params)
- Schema source of truth: `ToolSearch query="select:mcp__vantage-peers__send_message"` at every session start
- Fleet-shared rule (this file): always loaded

---

## Rule 6 — `create_mission` requires `agents` + `createdBy` + `project` (Day 114)

### Bad pattern (banned)

Calling `mcp__vantage-peers__create_mission` with only `name`, `pilot`, `objective`, `brief`, `priority`. Three more fields are mandatory per the live Zod schema:

- `agents`: array of strings OR single string (orchestrators/specialists involved)
- `createdBy`: string (your role)
- `project`: string (e.g. `elpi-corp`, `vantage-peers`, `pujol`)

**Symptom**: `MCP error -32602 Input validation error: invalid_union agents expected array or string received undefined / createdBy expected string received undefined`. Visible to Laurent. Day 114 friction (memory `j57dxrz7jq7q1j22f9cmkrgnz989ep9y`).

**Why it happens**: schema additions over time. Mission creation form expanded but skill docs and muscle memory lag.

### Good pattern (recipe)

1. **BEFORE the first `create_mission` of a session**, load the schema:

   ```
   ToolSearch query="select:mcp__vantage-peers__create_mission"
   ```

2. **Read the required params**: `name`, `pilot`, `objective`, `brief`, `priority`, `project`, `bu`, `agents`, `createdBy`. None of these are optional in current schema (Day 114).

3. **Invoke typed-params** with exactly:

   ```json
   {
     "name": "<slug-mission-v1>",
     "pilot": "<your role or assignee role>",
     "project": "<bu-slug>",
     "bu": "<bu-slug>",
     "priority": "urgent|high|medium|low",
     "createdBy": "<your role>",
     "agents": ["<role1>", "<role2>", "..."],
     "objective": "<one-paragraph done-state>",
     "brief": "<full brief with required markers>"
   }
   ```

### Brief required markers (RULES #25, #26, #27)

- `Template utilisé: <template-name-vN>` (RULE 26 mission-doctrine)
- `VR-CHECKED: <component>` or `// vr-checked: <reason>` (RULE 26)
- `T0-DOCS-READ: <docs list>` (RULE 25)
- `PREREQUISITES:` section (RULE 27)

### Canonical skill applying this recipe

`mission-bootstrap` v1.3.1+ (VR canonical) — PRINCIPLE 5 (project + agents + createdBy required by Zod) + Step 2 typed-params shape. Any orchestrator invoking the skill inherits the recipe and never hits the validation error.

### Cross-ref

- Friction: memory `j57dxrz7jq7q1j22f9cmkrgnz989ep9y` (Day 114 — Pi raw create_mission validation error)
- Canonical skill: `mission-bootstrap` v1.3.1 (PRINCIPLE 5 + Step 2)
- Schema source of truth: `ToolSearch query="select:mcp__vantage-peers__create_mission"` at every session start
- Fleet-shared rule (this file): always loaded

---

## Rule 7 — `create_task` batch ops require delegation triplet (Day 114)

### Bad pattern (banned)

Calling `mcp__vantage-peers__create_task` on a BATCH operation (audit N items, fix N hooks, sweep N workspaces, mass-edit, loop over list, etc.) without the delegation triplet in the description.

**Symptom**: `enforce-pi-task-doctrine.py BLOCKED: Task description missing delegation specs: subagent_type + run_in_background + model_sonnet`. Visible to Laurent. Day 114 friction.

**Why it happens**: orchestrators reflex to tag `[META]` thinking it bypasses delegation. The hook explicitly detects BATCH operations even with `[META]` tag and requires the triplet.

### Good pattern (recipe)

Batch operation definition: any task whose description contains "every X", "for each", "batch", "audit N", "fix N", "all hooks", "all workspaces", "loop", "sweep", "mass", "scan all" — OR sets out a per-item action over ≥ 3 items.

For batch ops, the description MUST include exactly these three literal lines (in this order):

```
Délègue à : subagent_type="<specialist>"
Mode : run_in_background=true
Model : model="sonnet"
```

Pick `<specialist>` per work type:
- Code mass-edit / refactor: `dev-senior-dev`
- Research / audit / mapping: `dev-tech-researcher`
- Backend Convex: `dev-convex-expert`
- Auth / Clerk: `dev-clerk-expert`
- UI / frontend: `dev-frontend`
- QA / tests: `dev-qa`
- Content / copy: `agency-copywriter`

Never default to `general-purpose` for batch tasks.

### Pure-orchestration exception

If the task is genuinely a SINGLE side-effect (e.g. PR merge authorization token, mission status update, briefing note creation) — non-batch by definition — tag the description with `[META]`, `[ADMIN]`, or `[MESSAGING]` at the very top. The hook recognizes these tags for non-batch ops.

Batch ops CANNOT bypass via `[META]` tag — the hook detects mass keywords.

### Canonical skill applying this recipe

`dispatch-task-create` v1.0.6+ (VR canonical) — Step 2.5 batch detection + Step 3 delegation triplet injection. Any orchestrator invoking the skill inherits the recipe and never hits the hook block.

### Cross-ref

- Friction: memory `j57dxrz7jq7q1j22f9cmkrgnz989ep9y` (Day 114 — Pi raw create_task batch ops)
- Hook canonical: `enforce-pi-task-doctrine` (memory j57ehd9psbx4z721sb7hggqse987fhtk + j5757xkcgeqd07mr9zjx1p5cn585p9wy)
- Canonical skill: `dispatch-task-create` v1.0.6 (Step 2.5 + Step 3)
- Fleet-shared rule (this file): always loaded

---

## Rule 8 — Multi-task batch dispatch requires `// allow-no-notify` marker per task + ONE consolidated `send_message` at end (Day 114)

### Bad pattern (banned)

Calling `create_task` multiple times in the same skill invocation targeting the SAME `(missionId, assignedTo)` tuple with `urgent` or `high` priority, without injecting the `// allow-no-notify` marker on the 2nd+ task.

**Symptom**: `enforce-create-task-notify-followup.py BLOCKED: previous create_task(s) urgent/high assigned to [<assignee>] still missing send_message follow-up`. Visible to Laurent. Recurrent Day 114 friction.

**Why it happens**: RULE #21 doctrine (memory `j57f7wn5qwhb7nynjp7r57tnsx88ktt5`) requires same-turn `send_message` after every urgent/high dispatch, so the assignee picks up immediately (cron is backstop, not primary channel). Pinging the assignee N times for a batch of N tasks is noise — the canonical pattern is ONE consolidated message after the batch.

**Friction source**: memory `j57dxrz7jq7q1j22f9cmkrgnz989ep9y` (audit/friction Day 114 — Pi raw batch dispatch).

### Good pattern (recipe)

For multi-task batch dispatch to the same assignee in the same skill invocation:

1. **First task**: no marker required. The skill skips the marker on task 1 because a single dispatch could legitimately stand alone.

2. **2nd+ task targeting same `(missionId, assignedTo)`**: inject literal line in `description` (placed right after the `[META]` tag for readability):

   ```
   // allow-no-notify: batch dispatch T<N> mission <missionId> assignee <assignee>, consolidated send_message after batch end
   ```

   The `: <reason>` part is required by the hook regex. "batch dispatch ..." is the canonical reason — descriptive, not bypass.

3. **AFTER the last task of the batch**: emit ONE `send_message` to the assignee summarizing the batch. Subject `[STATUS] mission <missionId> <mission-name> batch dispatched`. Grid: `evidence:` = list of taskIds + titles, `finding:` = "N tasks dispatched, dependsOn chain T0→T<N>", `action:` = "start T0 when prerequisites green", `next:` = "<emitter> attend [DONE] T0 puis chain".

### When to use single-dispatch pattern

If you create EXACTLY ONE urgent/high task to an assignee in a turn, use the normal pattern: no marker + a same-turn `send_message` ping. The marker is for batch only.

### Canonical skill applying this recipe

`dispatch-task-create` v1.0.6+ (VR canonical, contentHash `10d389375c9f...`) — Step 1 tracks per-`(missionId, assignedTo)` task count in skill session, Step 2.7 auto-injects marker on 2nd+ task, Step 5 emits consolidated send_message at batch end. Any orchestrator invoking the skill inherits the recipe.

### Cross-ref

- Friction: memory `j57dxrz7jq7q1j22f9cmkrgnz989ep9y` (Day 114 — recurring create_task notify-followup blocks)
- Hook canonical: `enforce-create-task-notify-followup` (RULE #21 Day 100 doctrine, memory j57f7wn5qwhb7nynjp7r57tnsx88ktt5)
- Canonical skill: `dispatch-task-create` v1.0.6 (Step 1 + 2.7 + 5)
- Fleet-shared rule (this file): always loaded
