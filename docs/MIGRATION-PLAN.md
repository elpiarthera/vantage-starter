# VantageStarter Migration Plan

Source: vantage-studio (`/home/laurentperello/coding/vantage-studio/`)
Target: vantage-starter (`/home/laurentperello/coding/vantage-starter/`)
Created: 2026-03-24
Status: Active

---

## Already Ported

| Feature | Source File | Target File | LOC | Status |
|---------|-----------|-------------|-----|--------|
| Missions | convex/missions.ts | convex/missions.ts | 646 | Done (auth adapted, status enum changed) |
| Operations | convex/operations.ts | convex/operations.ts | 641 | Done (added dependsOn) |
| Architect Sessions | convex/architectSessions.ts | convex/architectSessions.ts | 215 | Done |
| Agents (4-Pillars) | convex/agents.ts | convex/agents.ts | 412 | Done (added token management) |
| Skills | convex/skills.ts | convex/skills.ts | 430 | Exact copy |
| Checkpoints | embedded in missions.ts | convex/checkpoints.ts | new | Extracted to own file |
| Credits/Billing | — | convex/credits.ts | 1139 | VantageStarter only |
| Missions UI | components/missions/ (19) | components/missions/ (13) | 3213 | 13/19 ported |

---

## P0 — Blocking (must port next)

### 1. Chat Sessions (`chats` table + API)

**Why blocking:** Cannot build chat list page, session management, or project scoping without this.

**Source:** `/home/laurentperello/coding/vantage-studio/convex/chats.ts` (761 LOC)

**Schema to add:**
```
chats: defineTable({
  title: v.string(),
  workspaceId: v.id("workspaces"),
  projectId: v.optional(v.id("projects")),
  createdBy: v.string(),
  visibility: v.optional(v.union(v.literal("private"), v.literal("workspace"))),
  isPinned: v.optional(v.boolean()),
  enabledToolkits: v.optional(v.array(v.string())),
  selectedModel: v.optional(v.string()),
  ...timestamps
})
.index("by_workspace", ["workspaceId"])
.index("by_project", ["projectId"])
.index("by_creator", ["createdBy"])
```

**Functions to port (11):**
- Queries: list, getByWorkspace, getById, listRecent, listByProject
- Mutations: create, update, updateSelectedModel, updateEnabledToolkits, remove

**Auth adaptation:** clerkId -> clerkUserId (same pattern as missions.ts)

**Dependencies:** None (can port independently)

### 2. Projects (`projects` table + API)

**Why blocking:** Cannot organize chats/missions into folders without this.

**Source:** `/home/laurentperello/coding/vantage-studio/convex/projects.ts`

**Schema to add:**
```
projects: defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
  color: v.optional(v.string()),
  workspaceId: v.id("workspaces"),
  createdBy: v.string(),
  settings: v.optional(v.any()),
  orderPosition: v.optional(v.number()),
  isArchived: v.optional(v.boolean()),
  taskCount: v.optional(v.number()),
  ...timestamps
})
.index("by_workspace", ["workspaceId"])
.index("by_creator", ["createdBy"])
```

**Functions to port (6):**
- Queries: list, get
- Mutations: create, update, archive, assignTask

**Auth adaptation:** Same as chats

**Dependencies:** None

---

## P1 — High Priority

### 3. Custom Roles/Personas/Frameworks CRUD

**Why needed:** Schema tables already exist in vantage-starter but no API. Agents reference these via roleId/personaId/frameworkId but users can't create/edit them.

**Source files:**
- `/home/laurentperello/coding/vantage-studio/convex/customRoles.ts` (~177 LOC)
- `/home/laurentperello/coding/vantage-studio/convex/customPersonas.ts` (~185 LOC)
- `/home/laurentperello/coding/vantage-studio/convex/customFrameworks.ts` (~183 LOC)

**Functions per file (5 each, 15 total):**
- Queries: list, get
- Mutations: create, update, remove

**Dependencies:** Schema already exists. Just create the API files.

### 4. Messages with toolCalls

**Why needed:** Current chatMessages table has no tool call tracking. AI SDK v6 generates tool calls that need to be stored.

**Source:** `/home/laurentperello/coding/vantage-studio/convex/messages.ts`

**Schema change:** Add to chatMessages or create new messages table:
```
toolCalls: v.optional(v.array(v.object({
  id: v.string(),
  toolName: v.string(),
  args: v.any(),
  result: v.optional(v.any()),
  status: v.optional(v.string())
})))
```

**Dependencies:** Depends on chats table (P0 #1)

---

## P2 — Nice to Have

### 5. Timeline/Wizard UI (6 components)

**Source components:**
- mission-timeline.tsx (600 LOC) — Gantt-like visualization
- timeline-bar.tsx (170 LOC)
- time-card.tsx (89 LOC)
- workstream-tab.tsx (235 LOC)
- backlog-card.tsx (85 LOC)
- mission-wizard.tsx + stepper.tsx + types.ts

**Dependencies:** missions system (already ported)

### 6. Artifacts + Streams

**Source tables:**
- artifacts (chatId, type, content/storageId)
- streams (chatId, for resumable streaming)
- votes (chatId, messageId, userId, isUpvoted)

**Dependencies:** Depends on chats table (P0 #1)

---

## Porting Checklist

For each feature ported:
- [ ] Read source file from vantage-studio
- [ ] Adapt auth (clerkId -> clerkUserId pattern)
- [ ] Remove projectId if projects table not yet available (or port projects first)
- [ ] Update schema.ts with new table definitions
- [ ] Run `npx convex dev` to verify schema
- [ ] Run `npx tsc --noEmit`
- [ ] Test queries/mutations locally
- [ ] Update CHANGELOG.md

---

## Notes

- vantage-studio uses `workspaceId` extensively. vantage-starter has workspaces table — use the same pattern.
- Status enums may differ (studio: brainstorm/plan/execute/validate/complete vs starter: pending/executing/awaiting_checkpoint/completed/failed). Keep starter's enum.
- No UI work until Convex backend is verified working.
