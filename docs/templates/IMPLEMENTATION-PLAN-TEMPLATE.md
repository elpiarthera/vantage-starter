# [FEATURE NAME] — Implementation Plan

**Date**: [YYYY-MM-DD]
**Author**: [Name / Agent]
**Branch**: `[branch-name]`
**Status**: Planning | In Progress | Complete
**Priority**: P0 Critical | P1 High | P2 Normal | P3 Low
**Estimated Effort**: [X hours]
**Dependencies**: [Sprint N / Feature X] [status emoji]

> **Template size guidance**
> - **S (1–3 tasks, <4h)**: Keep Executive Summary, Prerequisites, tasks, Time Tracking, QA Protocol, Success Metrics. Skip Architecture, Port vs Build Map, Testing Strategy tables, Rollback Plan, Risk Assessment, Design System Compliance unless relevant.
> - **M (4–10 tasks, 4–16h)**: Use all sections. Omit Port vs Build Map if greenfield.
> - **L (10+ tasks, >16h)**: Use all sections. Add sub-phases as needed.
> Delete this callout before committing the plan.

---

## Executive Summary

### What
[One paragraph: what is being built or changed. Be concrete — name the files, tables, and routes involved.]

### Why
[One paragraph: the business or technical reason. What breaks or stays sub-optimal without this?]

### Impact
- **Users**: [what changes from their perspective]
- **Revenue**: [if applicable]
- **Architecture**: [what technical debt is resolved or introduced]

### Feasibility: [HIGH / MEDIUM / LOW]
[One sentence justification — why this rating.]

---

## Prerequisites

Before writing any new code, the following must be true:

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | [Dependency or blocker] | [Done / Pending] | [How to resolve if pending] |
| 2 | [Environment variable / API key] | [Done / Pending] | [Where to get it] |
| 3 | [Schema migration / seed data] | [Done / Pending] | [Command to run] |

**Pre-build blockers** — fix before starting Phase 1:

| # | Issue | Fix |
|---|-------|-----|
| 1 | [Specific bug or incorrect pattern that will cause silent failure] | [Exact fix — function name, line change] |
| 2 | [Missing index / wrong validator type] | [Exact fix] |

---

## Out of Scope

Explicitly excluded from this plan. Do not implement unless the scope changes:

- [Feature A] — deferred to [Sprint N / post-MVP]
- [Feature B] — handled by [other plan or sprint]

---

## Architecture

### Current State

[Describe what exists today — file paths, patterns, known problems.]

```typescript
// [current-file.ts] — example of the pattern being replaced
[code snippet showing the problem]
```

**Observations**:
1. [Observation with judgment: good / bad / missing]
2. [Observation]

### Proposed Architecture

[Describe the target state. Show data flow, component hierarchy, or sequence.]

```
[Diagram or pseudocode showing the new structure]
```

### Key Decisions

| Decision | Choice | Rejected alternatives |
|----------|--------|----------------------|
| [Decision area] | [Chosen approach] | [Alt A], [Alt B] |
| [Decision area] | [Chosen approach] | [Alt A] |

---

## Locked Decisions (non-negotiable)

[List choices that are already made and must not be re-litigated during implementation. Prevents agents from introducing alternatives mid-task.]

| Decision | Choice | Rejected alternatives |
|----------|--------|----------------------|
| [Decision area] | [Locked approach] | [Alt A] — rejected because [reason] |

---

## Port vs Build Map

[Use when porting from another codebase — skip if greenfield.]

| Component | Source Status | Action |
|-----------|---------------|--------|
| `[file.ts]` | EXISTS in [source] | PORT as-is |
| `[file.ts]` | EXISTS — missing [field] | PORT + add [field] |
| `[file.ts]` | MISSING | BUILD |

---

## Implementation Phases

> **Briefing discipline**: Write each task's Problem, Fix, and Acceptance Criteria in full before delegating. Do not patch iteratively — a comprehensive brief sent once beats three rounds of back-and-forth corrections.

---

### Phase 1 — [Phase Name] (Complexity: S / M / L)

**Goal**: [One sentence — what this phase proves or delivers.]
**Prerequisite**: [Which previous phase or external state must be complete.]

#### Tasks

---

##### Task 1.1 — [Task Name]

**Priority**: P0 / P1 / P2
**Files**: `[path/to/file.ts]`, `[path/to/other.ts]`
**Estimated**: [X hours]

**Problem / Context**:
[What is wrong or missing. Be specific — function name, line behavior, test failure.]

**Fix / Implementation**:
[Exact steps. Include code snippets where the text alone is ambiguous.]

```typescript
// [path/to/file.ts]
[code snippet — only if the exact text is load-bearing]
```

**Acceptance criteria**:
- [ ] [Specific, testable outcome — e.g., "npx tsc --noEmit exits 0"]
- [ ] [Functional outcome — e.g., "User can complete checkout and see credits deducted"]
- [ ] [Data outcome — e.g., "creditTransactions row appears with correct originalTransactionId"]

**Visual verification**:
[What to check in browser or Convex dashboard. E.g., "Open /dashboard/account — subscription tab shows plan name and credit balance. No console errors." Leave blank for backend-only tasks.]

**QA**:
```bash
npx tsc --noEmit
npx biome check --write [path/to/file.ts]
```

---

##### Task 1.2 — [Task Name]

**Priority**: P1
**Files**: `[path/to/file.ts]`
**Estimated**: [X hours]
**Depends on**: Task 1.1

**Problem / Context**:
[Description]

**Fix / Implementation**:
[Steps]

**Acceptance criteria**:
- [ ] [Outcome]

**Visual verification**:
[What to check in browser or Convex dashboard. Leave blank for backend-only tasks.]

---

#### Phase 1 — Files Summary

| Action | File | Lines changed (est.) |
|--------|------|----------------------|
| CREATE | `[path/to/new-file.ts]` | ~[N] |
| MODIFY | `[path/to/existing.ts]` | +[N] lines |
| MODIFY | `convex/schema.ts` | +[N] lines |

---

### Phase 2 — [Phase Name] (Complexity: S / M / L)

**Goal**: [One sentence.]
**Prerequisite**: Phase 1 complete.

#### Tasks

---

##### Task 2.1 — [Task Name]

**Priority**: P1
**Files**: `[path/to/file.ts]`
**Estimated**: [X hours]

**Problem / Context**:
[Description]

**Fix / Implementation**:
[Steps]

**Acceptance criteria**:
- [ ] [Outcome]

**Visual verification**:
[What to check in browser or Convex dashboard. Leave blank for backend-only tasks.]

---

#### Phase 2 — Files Summary

| Action | File | Lines changed (est.) |
|--------|------|----------------------|
| CREATE | `[path]` | ~[N] |
| MODIFY | `[path]` | +[N] |

---

### Phase 3 — [Phase Name] (Complexity: S / M / L)

**Goal**: [One sentence.]
**Prerequisite**: Phase 2 complete.

#### Tasks

---

##### Task 3.1 — [Task Name]

**Priority**: P1
**Files**: `[path/to/file.ts]`
**Estimated**: [X hours]
**Depends on**: Task 2.1

**Problem / Context**:
[Description]

**Fix / Implementation**:
[Steps]

**Acceptance criteria**:
- [ ] [Outcome]

**Visual verification**:
[What to check in browser or Convex dashboard. Leave blank for backend-only tasks.]

---

#### Phase 3 — Files Summary

| Action | File | Lines changed (est.) |
|--------|------|----------------------|
| CREATE | `[path]` | ~[N] |
| MODIFY | `[path]` | +[N] |

---

## Time Tracking

| Task | Estimated | Actual | Status | Notes |
|------|-----------|--------|--------|-------|
| Task 1.1: [Name] | [X]h | — | Pending | |
| Task 1.2: [Name] | [X]h | — | Pending | |
| Task 2.1: [Name] | [X]h | — | Pending | |
| **TOTAL** | **[X]h** | **—** | Pending | |

---

## Testing Strategy

### Unit Tests

| File | What to test | Framework |
|------|-------------|-----------|
| `__tests__/convex/[file].test.ts` | [Mutations / queries behavior] | Vitest |
| `__tests__/components/[Component].test.tsx` | [Rendering + interaction] | Jest + Testing Library |

### Integration Tests

| Scenario | Steps | Expected outcome |
|----------|-------|-----------------|
| [Happy path] | [1. Do X, 2. Do Y] | [Z happens] |
| [Error path] | [1. Do X with bad input] | [Error handled gracefully] |

### E2E Tests

| Flow | Route | Tool |
|------|-------|------|
| [User flow name] | `[/locale/path]` | Playwright |

### Manual Browser Checklist

- [ ] Feature works on desktop (1280px+)
- [ ] Feature works on mobile (375px)
- [ ] No console errors in browser devtools
- [ ] Auth-gated routes redirect unauthenticated users
- [ ] Touch targets meet 44px minimum (mobile)
- [ ] Focus states visible for keyboard navigation

---

## QA Protocol

Run after every task, before marking done:

```bash
# Step 1: TypeScript strict check
npx tsc --noEmit

# Step 2: Linting + formatting
npx biome check --write [list of changed files]

# Step 3: Convex (when schema or functions changed)
npx convex dev --once

# Step 4: i18n (when translation keys changed)
pnpm translate
pnpm i18n:verify
```

---

## Rollback Plan

If the feature causes regressions in production:

1. **Schema changes**: Convex schema changes are non-destructive (fields are optional). Rollback by reverting the application code — existing data remains intact.
2. **Feature flag**: [If applicable] set `[ENV_VAR]=false` in Vercel environment to disable the feature without a deploy.
3. **Git revert**: `git revert [commit-hash]` — identify the exact commit from the phase completion notes below.
4. **Data cleanup**: [If new tables were seeded] run `[cleanup script or Convex dashboard action]`.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| [External API unavailability] | Low / Medium / High | Low / Medium / High | [Fallback strategy] |
| [Schema migration breaks existing data] | Low | High | [Test on staging first] |
| [Performance regression from N+1 queries] | Medium | Medium | [Add index, verify in Convex dashboard] |
| [Auth bypass if internal mutation exposed as public] | Low | Critical | [Code review checklist includes mutation visibility] |

---

## Success Metrics

The implementation is complete when:

- [ ] All acceptance criteria in every task are checked
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check` exits 0 on all changed files
- [ ] [Feature-specific metric — e.g., "Checkout flow completes end-to-end in staging"]
- [ ] [Feature-specific metric — e.g., "Credit balance updates in real-time after purchase"]
- [ ] [Feature-specific metric — e.g., "No Convex function errors in dashboard logs for 24h"]

---

## Design System Compliance

[For UI phases — remove if backend-only.]

### Token Mapping

| Replace (hardcoded) | With (semantic token) |
|--------------------|-----------------------|
| `text-white` | `text-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `bg-gray-900` | `bg-primary` |
| `bg-gray-100` | `bg-muted` |
| `border-gray-200` | `border-border` |

### Mobile-First Checklist

- [ ] Layout works at 320px minimum width
- [ ] Interactive elements have `min-h-[44px]` touch targets
- [ ] Uses `px-4 md:px-6 lg:px-8` for page padding
- [ ] Stack panels: `flex-col md:flex-row`

### Anti-Patterns (never ship)

- [ ] No `shadcn/ui` or Radix imports — use lit-ui (`lui-*`)
- [ ] No `lucide-react` — inline SVGs only
- [ ] No hardcoded hex / HSL / gray-* colors — OKLCH tokens only
- [ ] No `dark:` prefix — OKLCH tokens handle dark mode automatically
- [ ] No `!important` overrides

---

## Phase Completion Notes

Fill in as each phase ships:

### Phase 1 — [Phase Name]

**Completed**: [YYYY-MM-DD]
**Actual hours**: [X]h (vs [Y]h estimated)
**Commit**: `[hash]`
**QA result**: TypeScript [pass/fail], Biome [pass/fail]
**Files created**: [list]
**Files modified**: [list]
**Deferred items**: [anything pushed to next phase with reason]
**Expert review scores**: [agent name]: [grade] — [summary]

### Phase 2 — [Phase Name]

**Completed**: [YYYY-MM-DD]
**Actual hours**: [X]h
**Commit**: `[hash]`
**QA result**: TypeScript [pass/fail], Biome [pass/fail]
**Files created**: [list]
**Files modified**: [list]

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| [YYYY-MM-DD] | Plan created | [Author] |
| [YYYY-MM-DD] | Phase 1 complete | [Author] |
| [YYYY-MM-DD] | [Amendment or scope change] | [Author] |
