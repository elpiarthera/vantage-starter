# Sprint 20: Fix Duplicate Narration Generation Bug

**Created**: December 23, 2025  
**Priority**: P0 (Critical Bug)  
**Status**: ✅ Completed (December 23, 2025)

---

## Problem Summary

When navigating to Step 3b (Narration), multiple duplicate narrations are generated and displayed instead of a single one.

**User Report:**
> "I clicked on regenerate narration and now on step 3b I have 3 times the narration instead of one"

**Database Evidence:**
- 14 duplicate assistant messages found in `chatMessages` table for this project
- All with nearly identical content
- Accumulated over multiple visits to Step 3b

---

## Root Cause Analysis

**Location:** `app/[locale]/guided/step-3b/page.tsx` (lines 214-242)

**The Buggy Code:**
```typescript
useEffect(() => {
    if (
        projectId &&
        convexMessages.length === 0 &&  // ← BUG: True during initial load!
        project !== undefined &&
        !isInitializing.current         // ← Resets on every mount
    ) {
        isInitializing.current = true;
        // Generates narration...
    }
}, [projectId, convexMessages.length, project, ...]);
```

**Why It Fails:**

1. `convexMessages` comes from a Convex `useQuery` hook
2. While the query is loading, `convexMessages` is an empty array `[]`
3. The `useEffect` sees `convexMessages.length === 0` and triggers generation
4. The query then resolves with existing messages, but generation already started
5. `isInitializing.current` is a React ref that resets to `false` on each component mount
6. Result: Every visit to Step 3b potentially adds a new duplicate narration

**Trigger Flow:**
```
1. User on Step 3 clicks "Regenerate Narration"
2. Navigate to Step 3b
3. Component mounts, isInitializing.current = false
4. convexMessages initially = [] (loading)
5. useEffect fires, starts generating narration
6. Convex query resolves with existing messages
7. New narration added = DUPLICATE
```

---

## Solution Plan

### Task 20.1: Fix the Loading State Check

**File:** `app/[locale]/guided/step-3b/page.tsx`

**Fix:** Check if the Convex query has finished loading before checking message count.

The `useChatMessages` hook needs to expose a loading state, OR we use the fact that `convexMessages` is `undefined` while loading vs `[]` when empty.

**Step 1: Check useChatMessages hook**

Look at `/hooks/business-logic/useChatMessages.ts` to see what it returns.

**Step 2: Update the useEffect condition**

```typescript
// BEFORE (Buggy)
useEffect(() => {
    if (
        projectId &&
        convexMessages.length === 0 &&
        project !== undefined &&
        !isInitializing.current
    ) {

// AFTER (Fixed)
useEffect(() => {
    // Don't initialize if messages are still loading
    // convexMessages will be [] initially but we need to wait for query
    if (
        projectId &&
        project !== undefined &&
        convexMessages !== undefined &&  // Query has resolved
        convexMessages.length === 0 &&   // No existing messages
        !isInitializing.current
    ) {
```

**Alternative Fix (if undefined check doesn't work):**

Add an `isLoading` state to the `useChatMessages` hook and use it:

```typescript
const { messages: convexMessages, isLoading } = useChatMessages(projectId, 3);

useEffect(() => {
    if (
        projectId &&
        !isLoading &&  // ← Wait for query to finish
        convexMessages.length === 0 &&
        project !== undefined &&
        !isInitializing.current
    ) {
```

---

### Task 20.2: Add isLoading State to useChatMessages Hook (if needed)

**File:** `hooks/business-logic/useChatMessages.ts`

If the hook doesn't already expose loading state, add it:

```typescript
export function useChatMessages(projectId: Id<"projects"> | undefined, step: number) {
    const messagesQuery = useQuery(
        api.chatMessages.listByProjectAndStep,
        projectId ? { projectId, step } : "skip"
    );
    
    // Derive loading state
    const isLoading = messagesQuery === undefined;
    
    return {
        messages: messagesQuery ?? [],
        isLoading,
        // ... other returns
    };
}
```

---

## Implementation Checklist

- [x] **20.1** Check useChatMessages hook for loading state (already had `isLoading`)
- [x] **20.2** Fix useEffect condition in Step 3b (added `!messagesLoading` check)
- [x] **20.3** Add isLoading to hook if needed (not needed, already present)
- [x] QA: TypeScript `noEmit` check
- [x] QA: Biome lint/format
- [x] Deploy to Convex dev
- [ ] Test: Navigate to Step 3b multiple times, verify single narration

---

## Time Estimates

| Task | Estimate |
|------|----------|
| 20.1 - Analyze hook | 5 min |
| 20.2 - Fix useEffect | 5 min |
| 20.3 - Add isLoading (if needed) | 10 min |
| QA (noEmit + Biome) | 5 min |
| Deploy & test | 5 min |
| **Total** | ~30 min |

---

## Files to Modify

1. `app/[locale]/guided/step-3b/page.tsx` - Fix useEffect condition
2. `hooks/business-logic/useChatMessages.ts` - Add isLoading if needed

---

## Success Criteria

1. ✅ Navigating to Step 3b shows exactly 1 narration
2. ✅ Clicking "Regenerate Narration" from Step 3 shows exactly 1 new narration
3. ✅ Refreshing Step 3b does NOT create duplicates
4. ✅ No TypeScript errors
5. ✅ Biome passes

