# Sprint 27: Assembly Improvement — Audio in Convex + Final Duration Fix

**Status**: ✅ Done  
**Goal**: Store narration and music in Convex (not Fal URLs); fix final video duration so it equals video length (e.g. 30s for 3×10s hard cut). Production-ready assembly.

**Related**: `docs/Post MVP Improvement/Post-MVP-Improvement.md` — section "Audio in Convex + Assembly Fix (Step 4 → Assembly)"

---

## ⚡ Quick Summary

| Area | Current | Target |
|------|---------|--------|
| **Narration URL** | Fal URL (`v3b.fal.media/...`) | Convex storage URL |
| **Music URL** | Fal URL | Convex storage URL |
| **Final duration** | min(video, mix) → often 26s when narration 26s | min(video, mix) = video length (30s) |
| **Images / scene videos / final video** | Already Convex | No change |
| **audioTracks table** | Empty (UX uses project + step4Data) | Populate when storing narration/music (this sprint) |
| **videos table** | Empty (only project.finalVideoUrl updated) | Populate on successful assembly (this sprint) |
| **Schema** | No storage IDs for audio on project | Add narrationAudioStorageId / musicAudioStorageId (this sprint) |

---

## Problem Summary

### 1. Audio stored as Fal URLs (inconsistent with images/videos)

- **Images (start/end frames):** Fal generates → we fetch and store in Convex in `imageGeneration.ts` → Convex URL saved.
- **Scene videos:** Fal/Kling generates → `videoPolling.ts` fetches and stores in Convex → `scene.videoUrl` = Convex URL.
- **Final video:** Rendi produces → `videoAssembly.ts` downloads and stores in Convex → `project.finalVideoUrl` = Convex URL.
- **Narration / music:** Fal generates → we **do not** store in Convex; we save Fal URLs on `project.narrationAudioUrl`, `project.musicAudioUrl`, and `step4Data.*Takes[].audioUrl`. Rendi fetches from Fal at assembly time.

**Issue:** Inconsistent storage policy; Fal URLs can expire or change; we want a single source of truth in Convex like images and videos.

### 2. Final video duration = 26s instead of 30s

- **Expected:** 3 scenes × 10s hard cut → video length 30s → final duration 30s.
- **Actual:** User selects 26s narration + 30s music; final video is 26s.
- **Cause:** Mixed audio length is driven by amix (effectively narration length 26s). Merge uses `-shortest` → final = min(30, 26) = 26s.
- **Fix:** Pass expected video duration into the mix step and force mix output to that length (trim/pad), so final = min(video, mix) = 30s.

### 3. Rendi "Failed downloading file" (mixed_audio.m4a)

- Already mitigated: delay after mix + retries on merge (see Changelog / videoAssembly.ts). Keep as-is.

---

## Implementation Plan

### Task 26.1: Store narration in Convex (P0)

**File:** `convex/actions/narrationGeneration.ts`

**Current:** After Fal returns, we return `audioUrl: result.audio.url` (Fal URL). All return paths (primary, retry, fallback) return `result.audio.url`.

**Change:**

1. Add a helper (or inline) after obtaining `result.audio.url`:
   - `const response = await fetch(result.audio.url);`
   - `if (!response.ok) throw new Error(\`Failed to download narration: ${response.status}\`);`
   - `const blob = await response.blob();`
   - Determine MIME from URL or Content-Type (e.g. `.mp3` → `audio/mpeg`).
   - `const storageId = await ctx.storage.store(new Blob([await blob.arrayBuffer()], { type: "audio/mpeg" }));`
   - `const url = await ctx.storage.getUrl(storageId);`
   - `if (!url) throw new Error("Failed to get Convex storage URL");`
2. Return `audioUrl: url` (Convex URL) instead of `result.audio.url` in **all** return paths (primary success, retry success, fallback success).
3. Keep returning `durationMs`, `modelUsed`, `speedFactor`, `wasRetried` etc. unchanged.

**Acceptance:**

- New narration generations result in `project.narrationAudioUrl` and `step4Data.narrationTakes[].audioUrl` being Convex storage URLs (`https://<deployment>.convex.cloud/api/storage/<id>`).
- Step 4 UI and assembly unchanged; they just receive Convex URL.
- Rendi can fetch from Convex storage URL (public GET).

---

### Task 26.2: Store music in Convex (P0)

**File:** `convex/actions/musicGeneration.ts`

**Current:** After Fal returns, we return `audioUrl: result.audio.url` (Fal URL).

**Change:**

1. After `result.audio.url`:
   - Fetch the URL → blob → `ctx.storage.store(blob)` (use MIME from response or `.wav` → `audio/wav`, or generic `audio/mpeg` if applicable).
   - `ctx.storage.getUrl(storageId)`.
2. Return `audioUrl: url` (Convex URL) instead of `result.audio.url`.

**Acceptance:**

- New music generations result in `project.musicAudioUrl` and `step4Data.musicTakes[].audioUrl` being Convex storage URLs.
- Assembly and Step 4 unchanged; Rendi fetches Convex URL.

---

### Task 26.3: Schema — storage IDs on project (required)

**Files:** `convex/schema.ts`, `convex/projects.ts`

- **Add to projects table:** `narrationAudioStorageId: v.optional(v.id("_storage"))` and `musicAudioStorageId: v.optional(v.id("_storage"))`.
- **Purpose:** Track Convex storage IDs for cleanup, quotas, and consistency with how we store final video (project has `finalVideoStorageId`). Not optional for production.
- **Set in 26.1 / 26.2:** When storing narration/music in Convex, return (or persist) the storageId; when saving selected take via `projects.update`, pass `narrationAudioStorageId` / `musicAudioStorageId` so the project document has the IDs. Generation actions must return or set them; Step 4 `update()` call must include these when saving selected narration/music (e.g. from generation result or from step4Data selected take’s stored ID if we persist it there).
- **projects.update:** Extend args to accept optional `narrationAudioStorageId`, `musicAudioStorageId`; when updating narration/music URL, set the corresponding storage ID.

---

### Task 26.4: Assembly — mix output duration = video length (P0)

**Files:** `lib/audio-processing.ts`, `convex/actions/videoAssembly.ts`

**26.4a — `lib/audio-processing.ts`**

- Add parameter `targetDurationSeconds: number` to `mixAudioWithRendi(narrationUrl, musicUrl, targetDurationSeconds)`.
- In the FFmpeg filter chain, after the amix + loudnorm output (e.g. label `[out]`), add:
  - `[out]atrim=duration=${targetDurationSeconds},apad=whole_dur=${targetDurationSeconds}[final]`
  - So: trim to at most `targetDurationSeconds`, then pad to exactly `targetDurationSeconds`.
- Map output to `[final]` and use that as the single output stream (e.g. `-map "[final]"` in the command).

**26.4b — `convex/actions/videoAssembly.ts`**

- `expectedDuration` is already computed (hard cut: `numScenes * clipDuration`; xfade: that minus `(numScenes - 1) * transitionDuration`).
- Every call to `mixAudioWithRendi(args.narrationUrl, args.musicUrl)` must pass the third argument: `mixAudioWithRendi(args.narrationUrl, args.musicUrl, expectedDuration)`.

**Acceptance:**

- For 3 scenes, hard cut, 10s per scene: `expectedDuration` = 30. Mixed audio length = 30s. Final = min(30, 30) = **30s**.
- For 3 scenes, xfade 1s: `expectedDuration` = 28. Final = **28s**.

---

### Task 26.5: Rendi + Convex URLs (verification)

- No code change required. Convex storage URLs are publicly readable via GET. Rendi’s merge job fetches inputs by URL; it already works with Fal URLs, so it will work with Convex URLs.
- **Verify:** After 26.1 and 26.2, run a full assembly with new narration + music; confirm Rendi mix and merge succeed (and final duration is correct per 26.4).

---

### Task 26.6: audioTracks table — populate (required)

- **Current:** `audioTracks.listByProject` builds the list from project + step4Data only; it does **not** read from the `audioTracks` table, so the table is always empty. `getProjectAudioCount` queries the table and returns 0.
- **Why not "later":** This is the last sprint before production. "Later" is not acceptable; the table exists in the schema and must be populated so counts, analytics, and future features (e.g. listing by audioTracks) work. Empty tables mean incomplete production readiness.
- **Required:** When we store narration or music in Convex (in 26.1 / 26.2), also insert a row into `audioTracks` so the table is the source of truth (or at least populated). Schema has required `assetId` (references assets). Options: (a) Add optional `storageId: v.optional(v.id("_storage"))` to `audioTracks` and insert with `storageId` when we have Convex storage but no asset; or (b) Create an asset row (e.g. via `files.saveFileMetadata` or a dedicated mutation) when storing audio, then insert into `audioTracks` with that `assetId`. Choose one approach and implement in this sprint.
- **Fields to set:** projectId, userId (from project), type ("narration" | "music"), title, duration, url/storageId or assetId, order, startTime (e.g. 0), volume, creditsUsed, createdAt, updatedAt. For organizationId: use a placeholder or project-based value if the app does not use orgs yet; schema requires it.
- **listByProject:** After 26.6, decide whether `audioTracks.listByProject` should read from the `audioTracks` table (and optionally merge with project/step4Data) or keep current behavior; document the decision.

---

### Task 26.7: videos table — populate on assembly (required)

- **Current:** The `videos` table exists but is **empty**. On assembly completion we only update `project.finalVideoUrl`, `project.finalVideoStorageId`, `project.assemblyStatus`, etc. We do **not** insert into `videos`.
- **Why required:** Same as 26.6 — last sprint before production; the table is part of the schema and should be populated for audit trail, listing by project, and analytics. Empty table = incomplete production readiness.
- **Required:** On **successful** assembly completion (in `buildFinalVideoHandler`, after `downloadAndStoreVideo` and `projects.updateFinalVideo`), **insert** a row into `videos` with: projectId, userId (from project), title (e.g. project.name), status: "completed", fileStorageId (finalVideoStorageId), url (finalVideoUrl), metadata (size, duration, resolution, format, fps, processingTime, sceneCount from assembly), renderConfig (sceneIds, audioTrackIds from args or project, transitions/effects from transitionConfig), creditsUsed (e.g. 5), isPublic: false, viewCount: 0, downloadCount: 0, createdAt, updatedAt, version: 1. organizationId: use placeholder or project-based value if not yet used.
- **Convex mutation:** Add a mutation (e.g. `videos.insertFromAssembly`) or call existing videos API if one exists; otherwise implement insert in the action via `ctx.runMutation(...)` with the above fields. Schema: `videos` has required fields; satisfy all (see schema.ts).

---

## Order of Work

1. **26.3** — Schema: add `narrationAudioStorageId` and `musicAudioStorageId` to projects; extend `projects.update` args.
2. **26.1** — Narration → Convex in `narrationGeneration.ts`; set and return storageId. Test: generate narration, confirm Convex URL + storageId in project/step4Data; run assembly, confirm success.
3. **26.2** — Music → Convex in `musicGeneration.ts`; set and return storageId. Test: generate music, confirm Convex URL; run assembly.
4. **26.6** — Populate audioTracks when storing narration/music (add storageId to audioTracks or create asset + insert). Ensure listByProject or getProjectAudioCount reflects data.
5. **26.4** — Assembly duration fix: `targetDurationSeconds` in `mixAudioWithRendi`, pass `expectedDuration` from `videoAssembly`. Test: 3×10s hard cut → final 30s; 3×10s xfade 1s → final 28s.
6. **26.7** — On successful assembly, insert row into `videos` (mutation + call from buildFinalVideoHandler).
7. **26.5** — Smoke test full flow with Convex audio URLs; confirm audioTracks and videos rows exist.
8. **QA** — E2E + unit test adjustments; `tsc --noEmit`; Biome on all modified/created files; Changelog.

---

## What's next (optional after done)

1. **26.5 — Smoke test** — Run full flow (generate narration → generate music → save → assemble). In Convex dashboard, confirm `audioTracks` and `videos` rows.
2. **Regression** — Confirm existing projects with Fal URLs still assemble.
3. **E2E** — (a) Keep Fal URLs (recommended). (b) Or switch to Convex URLs; optionally add atrim+apad for duration.

---

## QA: Tests and checks (required)

- **`pnpm exec tsc --noEmit`** — Run on the repo; fix any type errors in files created or modified in this sprint.
- **Biome** — Run `pnpm exec biome check <files>` (and `--write` where applicable) on every file created or modified; no lint/format errors.
- **`tests/e2e/test-full-assembly.js`** — Include in this sprint:
  - E2E test currently uses hardcoded Fal URLs (`NARRATION_URL`, `MUSIC_URL`). After 26.1/26.2, production uses Convex URLs. Either: (a) keep e2e using Fal URLs (Rendi can still fetch them) so e2e continues to validate the Rendi pipeline without Convex storage; or (b) update e2e to use Convex storage URLs (e.g. by running narration/music generation first and passing returned URLs). Document the choice in the test file or this doc. If `mixAudioWithRendi` signature changes (adds `targetDurationSeconds`), the e2e script’s local `mixAudioWithDucking` does not call Convex — it calls Rendi directly; ensure e2e still passes (e.g. expected final duration 30s or 28s) and update expected duration if needed.
- **`__tests__/convex/actions/videoAssembly.test.ts`** — Include in this sprint:
  - **Mock `mixAudioWithRendi`:** Signature becomes `(narrationUrl, musicUrl, targetDurationSeconds)`. Update the mock to accept three arguments; e.g. `mixAudioWithRendi: vi.fn().mockImplementation((_url1, _url2, _targetDuration) => Promise.resolve({ success: true, mixedAudioUrl: "...", fileId: "..." }))`.
  - **Handler tests:** Any test that invokes `buildFinalVideoHandler` must pass the new `expectedDuration` into the mix call (handler computes it internally; ensure mocks are called with the third argument if tests assert on mock calls).
  - Run `pnpm run test:convex` (or the relevant vitest target) and fix any failing tests.
- **Changelog** — Add an entry for Sprint 27 (assembly improvement: audio in Convex, duration fix, schema storage IDs, audioTracks + videos populated, QA).

---

## Acceptance Criteria (Production Ready)

- [x] Schema: projects has `narrationAudioStorageId` and `musicAudioStorageId`; `projects.update` accepts and sets them.
- [x] New narration generations store audio in Convex; `narrationAudioUrl` and selected take URLs are Convex storage URLs; project has narrationAudioStorageId when set.
- [x] New music generations store audio in Convex; `musicAudioUrl` and selected track URLs are Convex storage URLs; project has musicAudioStorageId when set.
- [x] audioTracks table is populated when narration/music is stored (or when selected); getProjectAudioCount / listByProject behavior documented and correct.
- [x] videos table has a row per successful assembly (projectId, status completed, url, metadata, renderConfig, etc.).
- [x] Assembly accepts Convex URLs; Rendi mix and merge succeed; final video duration = expected (30s hard cut, 28s xfade for 3×10s).
- [ ] Existing projects with Fal URLs still assemble; no regression (verify manually).
- [x] Unit test `videoAssembly.test.ts` updated and passing. E2E: document choice (keep Fal URLs or use Convex).
- [x] `pnpm exec tsc --noEmit` passes (after codegen + type fixes). Biome passed on all modified/created files; Changelog entry added.

---

## 🔍 Post-Implementation Investigation (Jan 29, 2026)

### Issue Report: 28s vs 30s Duration Bug

**Project Tested**: `k57aj8wzt1mn2sgh0qm9azwdgd7zxccx`

**Expected Behavior**: 3 scenes × 10s with hard cut = 30s final video  
**Actual Behavior**: Final video is 28s instead of 30s

### Root Cause Analysis

#### Project Configuration (from Convex)
```json
{
  "transitionConfig": {
    "mode": "hard_cut"
  },
  "duration": 30
}
```

#### Scene Data (from Convex)
- **Scene 1**: `duration: 10`, `outgoingTransition: { effectKey: "fade", duration: 1 }`
- **Scene 2**: `duration: 10`, `outgoingTransition: { effectKey: "dissolve", duration: 1 }`
- **Scene 3**: `duration: 10`, `outgoingTransition: undefined` (correct, last scene)

#### The Bug

In `convex/actions/videoAssembly.ts` line 227-229:

```typescript
const hasPerSceneTransitions = scenesWithTransitions.some(
    (s) => s.outgoingTransition,
);
```

**Logic Conflict**: This check evaluates to `true` because Scene 1 and Scene 2 have `outgoingTransition` defined from previous configurations, **even though the project's `transitionConfig.mode` is explicitly set to `"hard_cut"`**.

#### What Happens

1. **Project level**: User selects `transitionConfig: { mode: "hard_cut" }` → expects 30s
2. **Scene level**: Scenes still have `outgoingTransition` from earlier edits (fade, dissolve)
3. **Assembly logic**: `hasPerSceneTransitions` is `true` → uses per-scene xfade path instead of hard cut path
4. **Video merge**: Uses xfade transitions with overlaps → (3×10s) - (2×1s) = **28s video**
5. **Audio mix**: Correctly forced to 30s (as per `expectedDuration` from line 192)
6. **Final merge**: Uses `-shortest` flag → min(28s video, 30s audio) = **28s final video**

#### Why Audio is Correct but Video is Wrong

- **Audio processing** (`lib/audio-processing.ts` line 27-43): Receives `targetDurationSeconds: 30` and correctly forces mix output to 30s using `atrim` + `apad`
- **Video processing** (`convex/actions/videoAssembly.ts` line 236-267): Ignores project-level `transitionMode === "hard_cut"` and uses per-scene transitions instead

#### Code Paths

**Intended path for hard_cut** (lines 236-243):
```typescript
if (transitionMode === "hard_cut") {
    [audioResult, mergedVideoResult] = await Promise.all([
        mixAudioWithRendi(args.narrationUrl, args.musicUrl, expectedDuration), // 30s
        mergeVideosConcat(sceneUrls, { clipDuration }), // Should be 30s
    ]);
}
```

**Actual path taken** (lines 244-267):
```typescript
else if (hasPerSceneTransitions) {
    // Uses xfade with overlaps → 28s
    mergeVideosWithPerSceneXfade(sceneUrls, { transitions: [...], clipDuration });
}
```

### Impact Assessment

- **Narration generation**: ✅ Working correctly, stored in Convex
- **Music generation**: ✅ Working correctly, stored in Convex
- **Audio mixing**: ✅ Working correctly, forced to target duration (30s)
- **Video assembly**: ❌ Bug - per-scene transitions override project-level hard_cut mode
- **Final duration**: ❌ 28s instead of 30s due to xfade overlaps when hard cut was selected

### Recommended Fix

**Priority**: P0 (blocks production - duration mismatch on hard cut mode)

**Option 1 - Logic Fix (Recommended)**:  
Modify `convex/actions/videoAssembly.ts` line 227-229 to prioritize project-level `transitionMode`:

```typescript
const hasPerSceneTransitions = 
    transitionMode !== "hard_cut" && // Check project mode first
    scenesWithTransitions.some((s) => s.outgoingTransition);
```

**Option 2 - Data Cleanup**:  
When user changes to hard_cut mode in Step 3 UI, clear all `outgoingTransition` fields from scenes via mutation.

**Option 3 - Both**:  
Implement both fixes for defense in depth (UI clears data + backend validates).

### Test Case for Verification

**Given**:
- Project with `transitionConfig: { mode: "hard_cut" }`
- 3 scenes, each 10s duration
- Some scenes have leftover `outgoingTransition` from previous edits

**Expected**:
- Final video duration: 30s (3×10s, no overlaps)
- Assembly uses `mergeVideosConcat()` path
- Audio mixed to 30s

**Actual (Bug)**:
- Final video duration: 28s
- Assembly uses `mergeVideosWithPerSceneXfade()` path
- Audio mixed to 30s but trimmed to 28s by `-shortest` flag

### Files Affected
- `convex/actions/videoAssembly.ts` - Assembly logic (lines 227-267)
- `app/[locale]/guided/step-3/page.tsx` - Transition selection UI (should clear scene transitions on mode change)
- `convex/scenes.ts` - May need mutation to clear `outgoingTransition` when project mode changes

---

## 🔬 Deep Dive: Transition Configuration Architecture Analysis

### System Architecture Overview

The transition system has **two layers of configuration**:

1. **Project-level**: `projects.transitionConfig` (mode: "hard_cut" | "xfade")
2. **Scene-level**: `scenes.outgoingTransition` (per-scene effect + duration)

This dual-layer design creates a **conflict** when the layers are not synchronized.

### Current State Analysis

#### 1. UI Layer (Step 5)

**File**: `app/[locale]/guided/step-5/page.tsx`

**Lines 100-111**: Smooth Transitions are **frozen** (disabled in UI):
```typescript
// Sync transitionConfig with project data (Smooth Transitions frozen: force hard_cut)
useEffect(() => {
    if (project?.transitionConfig) {
        setTransitionConfig({
            mode: "hard_cut", // FORCED to hard_cut regardless of DB value
            xfadeType: project.transitionConfig.xfadeType ?? "circleopen",
            transitionDuration: project.transitionConfig.transitionDuration ?? 1.0,
        });
    }
}, [project?.transitionConfig]);
```

**Lines 289-303**: `handleTransitionChange` **does** update `project.transitionConfig` via mutation, BUT the UI always forces `mode: "hard_cut"` in state, so the mutation is called with hard_cut mode.

#### 2. TransitionSelector Component

**File**: `components/transitions/TransitionSelector.tsx`

**Lines 161-163**: UI **always displays hard_cut as selected**:
```typescript
// Smooth Transitions (xfade) frozen: always show hard_cut as selected in UI
const radioValue = value.mode === "xfade" ? "hard_cut" : value.mode;
const smoothTransitionsEnabled = false;
```

**Lines 265-345**: **Per-scene transition UI is completely hidden** because `smoothTransitionsEnabled = false`

#### 3. Backend Mutations (Available)

**`convex/projects.ts` lines 377-383**: ✅ Has mutation to update `transitionConfig`
```typescript
transitionConfig: v.optional(
    v.object({
        mode: v.union(v.literal("hard_cut"), v.literal("xfade")),
        xfadeType: v.optional(v.string()),
        transitionDuration: v.optional(v.number()),
    }),
),
```

**`convex/scenes.ts` lines 692-733**: ✅ Has mutation `updateTransition` for per-scene transitions

**`convex/scenes.ts` lines 739-789**: ✅ Has mutation `applyTransitionToAll` for bulk operations

#### 4. Assembly Logic Bug

**File**: `convex/actions/videoAssembly.ts`

**Lines 227-229**: The bug - checks scene-level transitions **before** project-level mode:
```typescript
const hasPerSceneTransitions = scenesWithTransitions.some(
    (s) => s.outgoingTransition,
);
```

**Lines 236-282**: Branching logic executes in this order:
1. If `transitionMode === "hard_cut"` → use `mergeVideosConcat()` (30s for 3 scenes)
2. Else if `hasPerSceneTransitions` → use `mergeVideosWithPerSceneXfade()` (28s with overlaps)
3. Else → use `mergeVideosWithXfade()` (legacy uniform transitions)

**Problem**: Step 2 executes when `hasPerSceneTransitions = true`, **ignoring** `transitionMode === "hard_cut"`

### The Root Cause: THREE Disconnected Problems

#### Problem 1: No Mutation to Clear Scene Transitions When Project Mode Changes

**What's Missing**:
- When user changes `project.transitionConfig.mode` to `"hard_cut"`, there's **no code** that clears the `outgoingTransition` fields from all scenes in that project.

**Current Flow** (how the bug manifests):
1. User creates project → scenes get created from `generatedStory.scenes`
2. Scenes may have `outgoingTransition` from:
   - Template data (if project created from `createFromTemplate`)
   - Previous edits when xfade was enabled (Sprint 11 Phase 2)
   - Testing data from Sprint 11 development
3. User goes to Step 5 → UI shows "Hard Cut" (frozen, no way to change)
4. User clicks "Assemble" → `handleContinue` passes `transitionConfig: { mode: "hard_cut" }`
5. Assembly action receives `transitionConfig.mode === "hard_cut"` **BUT**...
6. Scenes still have `outgoingTransition` defined from step 2
7. Line 227: `hasPerSceneTransitions` evaluates to `true`
8. Line 244: Assembly uses per-scene xfade path instead of hard cut path
9. Result: 28s video (with overlaps) instead of 30s

#### Problem 2: Assembly Logic Doesn't Respect Project-Level Mode Priority

**Line 227-229 Bug**:
```typescript
// Current (WRONG):
const hasPerSceneTransitions = scenesWithTransitions.some(
    (s) => s.outgoingTransition,
);

// Should be (CORRECT):
const hasPerSceneTransitions = 
    transitionMode !== "hard_cut" && // Check project mode FIRST
    scenesWithTransitions.some((s) => s.outgoingTransition);
```

**Impact**: Scene-level data overrides project-level configuration, violating the hierarchy principle.

#### Problem 3: Smooth Transitions Frozen But Data Persists

**Design Intent vs Implementation Gap**:

1. **Sprint 11 Phase 2** (implemented): Added per-scene transitions feature with full mutations
2. **Post-MVP** (implemented): Feature was **frozen** in UI via `smoothTransitionsEnabled = false`
3. **Gap** (NOT implemented):
   - Cleaning up existing scene transition data when feature was frozen
   - Preventing assembly from using per-scene transitions when mode is hard_cut
   - Adding a mutation to clear transitions when switching to hard_cut
   - Setting default `transitionConfig` on project creation

**Result**: The UI is frozen, but the backend still has the data and uses it.

### Missing Mutations Analysis

#### Missing Mutation 1: `clearProjectTransitions`

**Purpose**: Clear all scene-level transitions for a project (when switching to hard cut or on project creation with hard cut default)

```typescript
// File: convex/scenes.ts
export const clearProjectTransitions = mutation({
    args: { projectId: v.id("projects") },
    handler: async (ctx, { projectId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");
        
        // Verify project ownership
        const project = await ctx.db.get(projectId);
        if (!project) throw new Error("Project not found");
        
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
            .unique();
        
        if (!user || project.userId !== user._id) {
            throw new Error("Unauthorized - you don't own this project");
        }
        
        // Get all scenes for project
        const scenes = await ctx.db
            .query("scenes")
            .withIndex("by_project", (q) => q.eq("projectId", projectId))
            .collect();
        
        // Clear outgoingTransition from each scene
        const now = Date.now();
        let clearedCount = 0;
        for (const scene of scenes) {
            if (scene.outgoingTransition) {
                await ctx.db.patch(scene._id, {
                    outgoingTransition: undefined,
                    updatedAt: now,
                });
                clearedCount++;
            }
        }
        
        return { success: true, clearedCount };
    },
});
```

#### Missing Mutation 2: Auto-Clear in `projects.update`

**Purpose**: Automatically clear scene transitions when `transitionConfig.mode` is set to `"hard_cut"`

```typescript
// File: convex/projects.ts (in update mutation, after line 409)

// Auto-clear scene transitions when switching to hard_cut
if (updates.transitionConfig?.mode === "hard_cut") {
    const scenes = await ctx.db
        .query("scenes")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .collect();
    
    const now = Date.now();
    for (const scene of scenes) {
        if (scene.outgoingTransition) {
            await ctx.db.patch(scene._id, {
                outgoingTransition: undefined,
                updatedAt: now,
            });
        }
    }
}
```

### Default Behavior Issue

**Schema Definition**: `transitionConfig` is **optional** (`convex/schema.ts` line 234: `v.optional(...)`)

**Current Behavior** (when `project.transitionConfig` is `undefined`):
- Assembly line 179: `const transitionMode = args.transitionConfig?.mode ?? "xfade";`
- **Defaults to xfade**, which is WRONG since smooth transitions are frozen

**Should Be**:
```typescript
const transitionMode = args.transitionConfig?.mode ?? "hard_cut"; // Default to hard_cut
```

**Why This Matters**:
- Projects created before Sprint 11 have no `transitionConfig`
- Projects created from templates may not have `transitionConfig` set
- New projects created now don't explicitly set `transitionConfig` in `projects.create` mutation

### Comprehensive Fix Requirements

To make hard cut the true default and prevent this bug family:

1. **Assembly logic fix** (`convex/actions/videoAssembly.ts` line 227-229):
   ```typescript
   const hasPerSceneTransitions = 
       transitionMode !== "hard_cut" && 
       scenesWithTransitions.some((s) => s.outgoingTransition);
   ```

2. **Default mode fix** (`convex/actions/videoAssembly.ts` line 179):
   ```typescript
   const transitionMode = args.transitionConfig?.mode ?? "hard_cut";
   ```

3. **Add cleanup mutation** (`convex/scenes.ts`):
   - Add `clearProjectTransitions` mutation as shown above

4. **Auto-clear in projects.update** (`convex/projects.ts`):
   - Add scene clearing logic when mode is set to hard_cut

5. **Set default on project creation** (`convex/projects.ts` lines 46-57):
   ```typescript
   const projectId = await ctx.db.insert("projects", {
       userId: user._id,
       name: args.name,
       // ... other fields ...
       transitionConfig: { mode: "hard_cut" }, // ADD THIS
       createdAt: now,
       updatedAt: now,
   });
   ```

6. **Data migration** (one-time script or manual Convex query):
   - Set `transitionConfig: { mode: "hard_cut" }` on all existing projects without it
   - Clear all `outgoingTransition` from all scenes (since smooth transitions are frozen)

### Current Project State (Test Case k57aj8wzt1mn2sgh0qm9azwdgd7zxccx)

**Project**:
- `transitionConfig: { mode: "hard_cut" }` ✅ (set correctly)

**Scenes**:
- Scene 1: `outgoingTransition: { effectKey: "fade", duration: 1 }` ❌ (should be `undefined`)
- Scene 2: `outgoingTransition: { effectKey: "dissolve", duration: 1 }` ❌ (should be `undefined`)
- Scene 3: `outgoingTransition: undefined` ✅ (last scene, correct)

**Assembly Result**:
- Expected: 30s (3×10s hard cut)
- Actual: 28s (xfade with 2×1s overlaps)
- Reason: Lines 227-229 detect scene transitions → use xfade path

### Summary

**Root Cause Confirmed**: There's a missing mutation (or mutation logic) to clear scene-level transitions when the project-level mode is hard_cut. The current system has:

1. ✅ Mutation to update `project.transitionConfig` (exists)
2. ✅ Mutation to update `scene.outgoingTransition` (exists)
3. ❌ **MISSING**: Mutation or auto-cleanup logic to clear all scene transitions when project switches to hard_cut
4. ❌ **MISSING**: Assembly logic that respects project-level mode **over** scene-level data
5. ❌ **MISSING**: Default `transitionConfig` on project creation
6. ❌ **MISSING**: Assembly default mode set to hard_cut (currently defaults to xfade)

**Fix Priority**: P0 (blocks production - duration mismatch on all projects with orphaned scene transitions)

**Fix Scope**:
- Backend: 2 logic fixes + 1 new mutation + 1 auto-cleanup + 1 default change
- Data: Migration to set defaults and clear orphaned data
- Testing: Verify hard cut mode always produces correct duration

---

## 🎯 Senior Dev Report: Transition Effect Issues

**Date**: Jan 29, 2026  
**Reviewer**: Senior Dev  
**Status**: ✅ Analysis Complete - 4 Distinct Bugs Identified

### Summary of Issues Found

There are **FOUR distinct bugs** causing the 28s vs 30s problem and related assembly issues:

---

### Issue 1: Assembly Logic Conflict ⚠️ CRITICAL

**Location**: `convex/actions/videoAssembly.ts` lines 227-229

```typescript
const hasPerSceneTransitions = scenesWithTransitions.some(
    (s) => s.outgoingTransition,
);
```

**Problem**: This check ignores the project-level `transitionMode`. Even when `transitionConfig.mode === "hard_cut"`, if scenes have stale `outgoingTransition` data, the code takes the xfade path.

**Root Cause**: When user changes from xfade → hard_cut, there's no mutation to clear scene-level `outgoingTransition` fields.

**Impact**: All projects with orphaned scene transition data produce wrong duration (28s instead of 30s for 3×10s scenes).

---

### Issue 2: Missing Mutation to Clear Scene Transitions ⚠️ PM HYPOTHESIS CONFIRMED

**Location**: `app/[locale]/guided/step-5/page.tsx` lines 290-303

When `handleTransitionChange` is called:

```typescript
const handleTransitionChange = async (config: TransitionConfig) => {
    setTransitionConfig(config);
    if (projectId) {
        await updateProject({
            projectId,
            transitionConfig: { mode: config.mode, ... },
        });
    }
};
```

**What's missing**: When mode changes to `"hard_cut"`, this only updates the project document. It does **NOT** clear the scene-level `outgoingTransition` fields.

**Required but missing**: A call to clear all scene transitions when switching to hard_cut:

```typescript
// This mutation EXISTS in convex/scenes.ts but is NOT being called from UI
await clearSceneTransitions({ projectId }); 
// or manually set each scene's outgoingTransition: undefined
```

**PM was correct**: The mutation to properly handle mode change transition cleanup is missing from the UI flow.

---

### Issue 3: Re-assembly Path Missing transitionConfig ⚠️ CRITICAL

**Location 1**: `app/[locale]/guided/step-5/page.tsx` lines 273-278

```typescript
await buildFinalVideo({
    projectId,
    sceneIds: convexScenes.map((scene) => scene._id),
    narrationUrl: project.narrationAudioUrl,
    musicUrl: project.musicAudioUrl,
    // ❌ MISSING: transitionConfig not passed!
});
```

**Location 2**: `app/[locale]/guided/step-6/page.tsx` lines 195-202 - same issue

**Problem**: Re-assembly doesn't pass `transitionConfig`, so it defaults to `"xfade"` (line 179 in `videoAssembly.ts`).

**Impact**: When user clicks "Re-assemble" or "Retry" after assembly failure, the video is assembled with xfade transitions even though project mode is hard_cut.

**Fix**: Pass `transitionConfig` in both re-assembly paths:

```typescript
await buildFinalVideo({
    projectId,
    sceneIds: convexScenes.map((scene) => scene._id),
    narrationUrl: project.narrationAudioUrl,
    musicUrl: project.musicAudioUrl,
    transitionConfig: {  // ADD THIS
        mode: "hard_cut",
        transitionDuration: 1.0,
    },
});
```

---

### Issue 4: Forced hard_cut in UI Not Reflected in Backend Logic

**Location**: `app/[locale]/guided/step-5/page.tsx` lines 100-111

```typescript
// Sync transitionConfig with project data (Smooth Transitions frozen: force hard_cut)
useEffect(() => {
    if (project?.transitionConfig) {
        setTransitionConfig({
            mode: "hard_cut",  // ← Forced to hard_cut in UI
            ...
        });
    }
}, [project?.transitionConfig]);
```

**Problem**: UI forces `hard_cut` in local state, but:

1. This doesn't update the project in Convex (only local React state)
2. This doesn't clear scene-level `outgoingTransition` fields
3. When assembly happens, scenes still have xfade data → xfade path is taken

**Root Cause**: Frontend force-override doesn't persist to backend or trigger cleanup.

---

### Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         CURRENT STATE                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Project.transitionConfig.mode = "hard_cut" ✓                    │
│                    │                                              │
│                    ▼                                              │
│  Scene 1: outgoingTransition = { effectKey: "fade" } ✗ (stale)   │
│  Scene 2: outgoingTransition = { effectKey: "dissolve" } ✗       │
│  Scene 3: outgoingTransition = undefined ✓                        │
│                    │                                              │
│                    ▼                                              │
│  videoAssembly.ts checks:                                        │
│    1. transitionMode === "hard_cut" → TRUE → should use concat   │
│    2. BUT hasPerSceneTransitions → TRUE → uses xfade instead!    │
│                    │                                              │
│                    ▼                                              │
│  Result: 3×10s - 2×1s overlap = 28s (not 30s)                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

### Required Fixes (3-Item Checklist)

| Fix | Location | Description | Priority |
|-----|----------|-------------|----------|
| **Fix 1** | `convex/actions/videoAssembly.ts:227` | Prioritize project `transitionMode` over scene data: `transitionMode !== "hard_cut" && scenesWithTransitions.some(...)` | P0 |
| **Fix 2** | `app/[locale]/guided/step-5/page.tsx:290` | When mode changes to hard_cut, call mutation to clear all scene `outgoingTransition` fields | P0 |
| **Fix 3** | `app/[locale]/guided/step-5/page.tsx:273` & `app/[locale]/guided/step-6/page.tsx:195` | Pass `transitionConfig` in re-assembly/retry calls | P0 |

---

### Additional Recommendations

1. **Default on Project Creation**: Set `transitionConfig: { mode: "hard_cut" }` in `convex/projects.ts` create mutation
2. **Data Migration**: One-time script to:
   - Set `transitionConfig.mode = "hard_cut"` on all projects without it
   - Clear all `outgoingTransition` from all scenes (since smooth transitions are frozen)
3. **Assembly Default**: Change default in `videoAssembly.ts:179` from `"xfade"` to `"hard_cut"`
4. **Add Guard**: In `projects.update` mutation, auto-clear scene transitions when mode is set to hard_cut

---

### Verification Steps

After fixes are applied:

1. ✅ Create new project → verify `transitionConfig.mode = "hard_cut"` in DB
2. ✅ Create project → add scenes → verify no `outgoingTransition` fields on scenes
3. ✅ Assemble 3×10s scenes with hard_cut → verify final video is 30s (not 28s)
4. ✅ Click "Re-assemble" → verify final video is still 30s
5. ✅ Check existing project `k57aj8wzt1mn2sgh0qm9azwdgd7zxccx` → manually clear scene transitions → re-assemble → verify 30s

---

## 📋 Implementation Tasks (Production Ready)

### Phase 1: Backend Fixes (Critical Path)

#### Task 27.8: Fix Assembly Logic Priority (P0) ✅ Ready to Implement

**File**: `convex/actions/videoAssembly.ts`

**Change**: Line 227-229

```typescript
// Before:
const hasPerSceneTransitions = scenesWithTransitions.some(
    (s) => s.outgoingTransition,
);

// After:
const hasPerSceneTransitions = 
    transitionMode !== "hard_cut" && 
    scenesWithTransitions.some((s) => s.outgoingTransition);
```

**Rationale**: Project-level `transitionMode` must take precedence over scene-level data. When mode is hard_cut, ignore all scene transitions.

**2-Step QA**:
```bash
# Step 1: TypeScript check
pnpm exec tsc --noEmit

# Step 2: Biome lint + format
pnpm exec biome check --write convex/actions/videoAssembly.ts
```

**Acceptance**: 
- Hard cut mode (3×10s) → 30s video
- Test with project `k57aj8wzt1mn2sgh0qm9azwdgd7zxccx` (has stale scene transitions)

---

#### Task 27.9: Change Assembly Default to hard_cut (P0) ✅ Ready to Implement

**File**: `convex/actions/videoAssembly.ts`

**Change**: Line 179

```typescript
// Before:
const transitionMode = args.transitionConfig?.mode ?? "xfade";

// After:
const transitionMode = args.transitionConfig?.mode ?? "hard_cut";
```

**Rationale**: Smooth transitions are frozen in UI. Default should be hard_cut for all projects.

**2-Step QA**:
```bash
# Step 1: TypeScript check
pnpm exec tsc --noEmit

# Step 2: Biome lint + format
pnpm exec biome check --write convex/actions/videoAssembly.ts
```

**Acceptance**: 
- Projects without `transitionConfig` assemble with hard_cut (30s for 3×10s)

---

#### Task 27.10: Add clearProjectTransitions Mutation (P0) ✅ Ready to Implement

**File**: `convex/scenes.ts`

**Add at end of file** (after existing mutations):

```typescript
/**
 * Sprint 27: Clear all scene-level transitions for a project
 * Called when switching to hard_cut mode or on project creation
 */
export const clearProjectTransitions = mutation({
    args: { projectId: v.id("projects") },
    handler: async (ctx, { projectId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }
        
        // Verify project ownership
        const project = await ctx.db.get(projectId);
        if (!project) {
            throw new Error("Project not found");
        }
        
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_user_id", (q) =>
                q.eq("clerkUserId", identity.subject),
            )
            .unique();
        
        if (!user || project.userId !== user._id) {
            throw new Error("Unauthorized - you don't own this project");
        }
        
        // Get all scenes for project
        const scenes = await ctx.db
            .query("scenes")
            .withIndex("by_project", (q) => q.eq("projectId", projectId))
            .collect();
        
        // Clear outgoingTransition from each scene
        const now = Date.now();
        let clearedCount = 0;
        for (const scene of scenes) {
            if (scene.outgoingTransition) {
                await ctx.db.patch(scene._id, {
                    outgoingTransition: undefined,
                    updatedAt: now,
                });
                clearedCount++;
            }
        }
        
        return { success: true, clearedCount };
    },
});
```

**2-Step QA**:
```bash
# Step 1: TypeScript check
pnpm exec tsc --noEmit

# Step 2: Biome lint + format
pnpm exec biome check --write convex/scenes.ts
```

**Acceptance**: 
- Mutation can be called successfully
- Clears all `outgoingTransition` from scenes in a project
- Returns count of cleared scenes

---

#### Task 27.11: Auto-Clear Transitions in projects.update (P0) ✅ Ready to Implement

**File**: `convex/projects.ts`

**Change**: In `update` mutation handler, **BEFORE** line 409 (before the final `ctx.db.patch`):

```typescript
// Insert this BEFORE await ctx.db.patch(projectId, { ...updates, updatedAt: Date.now() });

// Auto-clear scene transitions when switching to hard_cut
if (updates.transitionConfig?.mode === "hard_cut") {
    const scenes = await ctx.db
        .query("scenes")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .collect();
    
    const now = Date.now();
    for (const scene of scenes) {
        if (scene.outgoingTransition) {
            await ctx.db.patch(scene._id, {
                outgoingTransition: undefined,
                updatedAt: now,
            });
        }
    }
}

// Then the existing patch call:
await ctx.db.patch(projectId, {
    ...updates,
    updatedAt: Date.now(),
});
```

**Important**: Insert this cleanup logic **BEFORE** the final `ctx.db.patch()` call, not after.

**2-Step QA**:
```bash
# Step 1: TypeScript check
pnpm exec tsc --noEmit

# Step 2: Biome lint + format
pnpm exec biome check --write convex/projects.ts
```

**Acceptance**: 
- When `transitionConfig.mode` is updated to `"hard_cut"`, all scene transitions are automatically cleared
- No orphaned transition data remains

---

#### Task 27.12: Set Default transitionConfig on Project Creation (P1) ✅ Ready to Implement

**File**: `convex/projects.ts`

**Change**: In `create` mutation, line 46-57, add `transitionConfig`:

```typescript
// Create project with full schema
const projectId = await ctx.db.insert("projects", {
    userId: user._id,
    name: args.name,
    occasion: args.occasion,
    theme: args.theme,
    eventDetails: args.eventDetails,
    language: args.language,
    status: "draft",
    duration: 0,
    transitionConfig: { mode: "hard_cut" }, // ADD THIS LINE
    createdAt: now,
    updatedAt: now,
});
```

**Same change needed in** `createFromTemplate` mutation (line 108-119).

**2-Step QA**:
```bash
# Step 1: TypeScript check
pnpm exec tsc --noEmit

# Step 2: Biome lint + format
pnpm exec biome check --write convex/projects.ts
```

**Acceptance**: 
- All new projects have `transitionConfig.mode = "hard_cut"` by default
- Templates also set hard_cut mode

---

### Phase 2: Frontend Fixes (Critical Path)

#### Task 27.13: Pass transitionConfig in Re-assembly (P0) ✅ Ready to Implement

**File 1**: `app/[locale]/guided/step-5/page.tsx`

**Change**: Line 273-278 in `handleReassemble`:

```typescript
// Before:
await buildFinalVideo({
    projectId,
    sceneIds: convexScenes.map((scene) => scene._id as Id<"scenes">),
    narrationUrl: project.narrationAudioUrl,
    musicUrl: project.musicAudioUrl as string,
});

// After:
await buildFinalVideo({
    projectId,
    sceneIds: convexScenes.map((scene) => scene._id as Id<"scenes">),
    narrationUrl: project.narrationAudioUrl,
    musicUrl: project.musicAudioUrl as string,
    transitionConfig: project.transitionConfig ?? { mode: "hard_cut" }, // ADD THIS
});
```

**File 2**: `app/[locale]/guided/step-6/page.tsx`

**Change**: Line 195-202 in retry assembly logic (same fix as above).

**2-Step QA**:
```bash
# Step 1: TypeScript check
pnpm exec tsc --noEmit

# Step 2: Biome lint + format
pnpm exec biome check --write app/[locale]/guided/step-5/page.tsx
pnpm exec biome check --write app/[locale]/guided/step-6/page.tsx
```

**Acceptance**: 
- Re-assembly uses project's `transitionConfig`
- Retry after failure uses project's `transitionConfig`
- Falls back to hard_cut if `transitionConfig` is undefined

---

#### Task 27.14: Remove Forced hard_cut Override in Step 5 UI (P1) ✅ Ready to Implement

**File**: `app/[locale]/guided/step-5/page.tsx`

**Change**: Lines 100-111, remove forced override:

```typescript
// Before (forced override):
useEffect(() => {
    if (project?.transitionConfig) {
        setTransitionConfig({
            mode: "hard_cut",  // ← Forced to hard_cut regardless of DB value
            xfadeType: project.transitionConfig.xfadeType ?? "circleopen",
            transitionDuration: project.transitionConfig.transitionDuration ?? 1.0,
        });
    }
}, [project?.transitionConfig]);

// After (sync from project, use default only if undefined):
useEffect(() => {
    if (project?.transitionConfig) {
        setTransitionConfig({
            mode: project.transitionConfig.mode ?? "hard_cut",  // ← Respect DB value, default only if undefined
            xfadeType: project.transitionConfig.xfadeType ?? "circleopen",
            transitionDuration: project.transitionConfig.transitionDuration ?? 1.0,
        });
    }
}, [project?.transitionConfig]);
```

**Rationale**: 
- The forced override was a workaround when smooth transitions were frozen
- With proper defaults (Task 27.9, 27.12) and auto-cleanup (Task 27.11), the override is no longer needed
- When smooth transitions are unfrozen in Post-MVP, the UI will correctly reflect the actual project state

**2-Step QA**:
```bash
# Step 1: TypeScript check
pnpm exec tsc --noEmit

# Step 2: Biome lint + format
pnpm exec biome check --write app/[locale]/guided/step-5/page.tsx
```

**Acceptance**: 
- UI syncs from project's actual `transitionConfig.mode` value
- Falls back to hard_cut only if undefined
- Prepares codebase for smooth transitions feature when unfrozen

---

#### Task 27.15 (OPTIONAL): Call clearProjectTransitions in UI (P2) ⚠️ Belt-and-Suspenders

**Note**: This task is **technically redundant** because Task 27.11 already auto-clears scene transitions when `projects.update` is called with `mode: "hard_cut"`. However, keeping this as an optional belt-and-suspenders approach provides explicit UI-driven cleanup.

**File**: `app/[locale]/guided/step-5/page.tsx`

**Change**: In `handleTransitionChange` (line 290-303), add explicit mutation call:

```typescript
// Before:
const handleTransitionChange = async (config: TransitionConfig) => {
    setTransitionConfig(config);
    
    if (projectId) {
        await updateProject({
            projectId,
            transitionConfig: {
                mode: config.mode,
                xfadeType: config.xfadeType,
                transitionDuration: config.transitionDuration,
            },
        });
    }
};

// After (with explicit cleanup):
const handleTransitionChange = async (config: TransitionConfig) => {
    setTransitionConfig(config);
    
    if (projectId) {
        await updateProject({
            projectId,
            transitionConfig: {
                mode: config.mode,
                xfadeType: config.xfadeType,
                transitionDuration: config.transitionDuration,
            },
        });
        
        // Explicit cleanup (redundant with Task 27.11, but explicit)
        if (config.mode === "hard_cut") {
            await clearProjectTransitions({ projectId });
        }
    }
};
```

**Add mutation import** at top of file:

```typescript
const clearProjectTransitions = useMutation(api.scenes.clearProjectTransitions);
```

**2-Step QA**:
```bash
# Step 1: TypeScript check
pnpm exec tsc --noEmit

# Step 2: Biome lint + format
pnpm exec biome check --write app/[locale]/guided/step-5/page.tsx
```

**Acceptance**: 
- Explicit UI-driven cleanup provides double-guarantee
- No harm in calling cleanup twice (idempotent operation)

**Recommendation**: **Skip this task** to avoid redundancy, OR implement as defensive programming if preferred.

---

### Phase 3: Data Migration (One-Time)

#### Task 27.16: Migrate Existing Projects (P1) ✅ Manual Script

**Purpose**: Set default `transitionConfig` on all existing projects and clear orphaned scene transitions.

**Option 1: Convex Dashboard Query** (Recommended for small datasets)

```typescript
// In Convex Dashboard → Data → projects table
// Run this query to find projects without transitionConfig:
// Filter: transitionConfig is undefined

// Then manually update each one:
// transitionConfig: { mode: "hard_cut" }
```

**Option 2: Migration Script** (for large datasets)

Create `convex/migrations/migrateTransitionConfig.ts`:

```typescript
import { internalMutation } from "./_generated/server";

export const migrateTransitionConfig = internalMutation({
    handler: async (ctx) => {
        // Get all projects without transitionConfig
        const projects = await ctx.db.query("projects").collect();
        
        let updatedProjects = 0;
        let clearedScenes = 0;
        
        for (const project of projects) {
            // Set default transitionConfig if missing
            if (!project.transitionConfig) {
                await ctx.db.patch(project._id, {
                    transitionConfig: { mode: "hard_cut" },
                    updatedAt: Date.now(),
                });
                updatedProjects++;
            }
            
            // Clear all scene transitions (since smooth transitions are frozen)
            const scenes = await ctx.db
                .query("scenes")
                .withIndex("by_project", (q) => q.eq("projectId", project._id))
                .collect();
            
            for (const scene of scenes) {
                if (scene.outgoingTransition) {
                    await ctx.db.patch(scene._id, {
                        outgoingTransition: undefined,
                        updatedAt: Date.now(),
                    });
                    clearedScenes++;
                }
            }
        }
        
        return { 
            success: true, 
            updatedProjects, 
            clearedScenes 
        };
    },
});
```

Run via:
```bash
# In Convex dashboard or locally
npx convex run migrations:migrateTransitionConfig
```

**Acceptance**: 
- All projects have `transitionConfig.mode = "hard_cut"`
- All scenes have `outgoingTransition = undefined`
- Test project `k57aj8wzt1mn2sgh0qm9azwdgd7zxccx` is cleaned up

---

### Phase 4: Testing & Verification

#### Task 27.17: Update Unit Tests (P1) ✅ Ready to Implement

**File**: `__tests__/convex/actions/videoAssembly.test.ts`

**Changes needed**:

1. **Test hard_cut priority over scene transitions**:

```typescript
it("should use hard_cut even when scenes have outgoingTransition", async () => {
    // Mock scenes with stale transition data
    mockGetScenes.mockResolvedValue([
        { 
            _id: "scene1", 
            videoUrl: "url1",
            outgoingTransition: { effectKey: "fade", duration: 1 }
        },
        { 
            _id: "scene2", 
            videoUrl: "url2",
            outgoingTransition: { effectKey: "dissolve", duration: 1 }
        },
        { 
            _id: "scene3", 
            videoUrl: "url3" 
        },
    ]);
    
    await buildFinalVideoHandler(mockCtx, {
        projectId: "proj1" as Id<"projects">,
        sceneIds: ["scene1", "scene2", "scene3"] as Id<"scenes">[],
        narrationUrl: "narration.mp3",
        musicUrl: "music.mp3",
        transitionConfig: { mode: "hard_cut" }, // Explicit hard_cut
    });
    
    // Should use concat (hard_cut), not xfade
    expect(mergeVideosConcat).toHaveBeenCalled();
    expect(mergeVideosWithPerSceneXfade).not.toHaveBeenCalled();
});
```

2. **Test default mode is hard_cut**:

```typescript
it("should default to hard_cut when transitionConfig is undefined", async () => {
    await buildFinalVideoHandler(mockCtx, {
        projectId: "proj1" as Id<"projects">,
        sceneIds: ["scene1", "scene2", "scene3"] as Id<"scenes">[],
        narrationUrl: "narration.mp3",
        musicUrl: "music.mp3",
        // No transitionConfig passed
    });
    
    // Should default to hard_cut (concat)
    expect(mergeVideosConcat).toHaveBeenCalled();
});
```

**2-Step QA**:
```bash
# Step 1: TypeScript check
pnpm exec tsc --noEmit

# Step 2: Biome lint + format
pnpm exec biome check --write __tests__/convex/actions/videoAssembly.test.ts
```

**Run tests**:
```bash
pnpm run test:convex
```

**Acceptance**: All tests pass with new logic.

---

#### Task 27.18: Manual QA on Test Project (P0) ✅ Required

**Test Project**: `k57aj8wzt1mn2sgh0qm9azwdgd7zxccx`

**Steps**:

1. **Before fixes**: Verify current state
   ```bash
   # Use Convex MCP to check:
   # - Project: transitionConfig.mode = "hard_cut" ✓
   # - Scene 1: outgoingTransition = { fade, 1s } ✗
   # - Scene 2: outgoingTransition = { dissolve, 1s } ✗
   # - Final video: 28s ✗
   ```

2. **Apply fixes**: Deploy all changes from Tasks 27.8-27.14

3. **Run migration**: Clear scene transitions (Task 27.15)

4. **Re-assemble**: Use "Re-assemble" button in Step 5

5. **Verify final state**:
   ```bash
   # Use Convex MCP to check:
   # - Scene 1: outgoingTransition = undefined ✓
   # - Scene 2: outgoingTransition = undefined ✓
   # - Final video: 30s ✓
   ```

6. **Test new project flow**:
   - Create new project
   - Verify `transitionConfig.mode = "hard_cut"` in DB
   - Generate 3 scenes
   - Verify no `outgoingTransition` on any scene
   - Assemble → verify 30s final video

**Acceptance**: 
- ✅ Test project produces 30s video
- ✅ New projects default to hard_cut
- ✅ No orphaned scene transitions

---

### Phase 5: Documentation & Changelog

#### Task 27.19: Update Changelog (P1) ✅ Ready to Implement

**File**: `Changelog.md`

**Add entry**:

```markdown
## [Sprint 27] - Jan 29, 2026

### Fixed
- **Critical**: Fixed video assembly duration bug where projects with orphaned scene transitions produced 28s videos instead of 30s for 3×10s scenes with hard_cut mode
- **Assembly Logic**: Project-level `transitionConfig.mode` now takes precedence over scene-level `outgoingTransition` data
- **Default Behavior**: Changed assembly default from xfade to hard_cut (smooth transitions are frozen in UI)
- **Re-assembly**: Fixed re-assembly and retry flows to pass `transitionConfig` to assembly action
- **Data Cleanup**: Added `clearProjectTransitions` mutation to remove orphaned scene transition data
- **Project Creation**: New projects now default to `transitionConfig: { mode: "hard_cut" }`
- **Auto-Cleanup**: `projects.update` mutation now automatically clears scene transitions when mode is set to hard_cut

### Changed
- Assembly default mode: `"xfade"` → `"hard_cut"` (aligns with frozen UI)
- Projects created without `transitionConfig` now default to hard_cut mode

### Migration
- Existing projects: Set `transitionConfig: { mode: "hard_cut" }` on all projects
- Existing scenes: Cleared all `outgoingTransition` fields (smooth transitions frozen)
```

**2-Step QA**:
```bash
# Step 1: TypeScript check (N/A for Markdown)

# Step 2: Biome lint + format
pnpm exec biome check --write Changelog.md
```

---

## 🎓 Senior Dev Review: Implementation Tasks

**Date**: Jan 29, 2026  
**Reviewer**: Senior Dev  
**Status**: ✅ Approved with Minor Adjustments

### Overall Assessment: ✅ Excellent - Ready to Implement

The task breakdown is comprehensive and well-structured. Here's my detailed review:

### ✅ Strengths

| Aspect | Assessment |
|--------|------------|
| **Root cause analysis** | All 4 issues correctly identified |
| **Task ordering** | Correct - backend first (27.8-27.12), then frontend (27.13-27.14), then migration (27.16) |
| **Code snippets** | Complete and accurate - copy-paste ready |
| **QA steps** | 2-step QA (tsc + biome) included for every task |
| **Acceptance criteria** | Clear and testable for each task |
| **Changelog** | Pre-written entry ready to add |

### ⚠️ Issues Addressed

| Issue | Location | Fix Applied |
|-------|----------|-------------|
| **Task 27.11 placement** | Line 965: "after line 409" | ✅ **FIXED** - Changed to "BEFORE line 409" (before `ctx.db.patch()`) |
| **Task 27.14 redundancy** | Original line 1090-1152 | ✅ **FIXED** - Marked as P2 optional, noted it's redundant with Task 27.11 auto-cleanup |
| **Missing: forced override** | Issue 4 not fully addressed | ✅ **FIXED** - Added Task 27.14 to remove forced hard_cut override in step-5 UI |

### 🔧 Adjustments Made

#### 1. Task 27.11: Corrected Insertion Point
- **Before**: "after line 409"
- **After**: "**BEFORE** line 409 (before the final `ctx.db.patch`)"
- **Reason**: The cleanup must happen before the project update, otherwise the patch executes first and the cleanup references stale data

#### 2. Task 27.14: NEW - Remove Forced Override
Added new task to remove the `useEffect` forced override at step-5/page.tsx:100-111:

```typescript
// From:
mode: "hard_cut",  // ← Forced override

// To:
mode: project.transitionConfig.mode ?? "hard_cut",  // ← Respect DB value
```

**Benefits**:
- Removes workaround that's no longer needed with proper defaults
- Prepares codebase for smooth transitions feature when unfrozen
- UI correctly syncs from Convex project state

#### 3. Task 27.15: Marked as OPTIONAL (P2)
- Renamed from Task 27.14 to Task 27.15
- Marked as **belt-and-suspenders** approach
- Noted it's technically redundant with Task 27.11 auto-cleanup
- Recommendation: **Skip** to avoid redundancy OR keep for defensive programming

### ✅ Final Verdict

**Ready to implement** with adjustments applied. The plan correctly addresses:

- ✅ Project-level mode taking precedence (Task 27.8)
- ✅ Default changed to hard_cut (Task 27.9)
- ✅ Auto-cleanup on mode change (Task 27.11) - **placement corrected**
- ✅ Re-assembly passing transitionConfig (Task 27.13)
- ✅ Forced override removed (Task 27.14) - **NEW**
- ✅ Data migration (Task 27.16)
- ✅ Unit tests (Task 27.17)

### Task Count Summary

| Phase | Task Count | Status |
|-------|------------|--------|
| **Phase 1: Backend Fixes** | 5 tasks (27.8-27.12) | ✅ Ready |
| **Phase 2: Frontend Fixes** | 2 tasks (27.13-27.14) + 1 optional (27.15) | ✅ Ready |
| **Phase 3: Data Migration** | 1 task (27.16) | ✅ Ready |
| **Phase 4: Testing** | 2 tasks (27.17-27.18) | ✅ Ready |
| **Phase 5: Documentation** | 1 task (27.19) | ✅ Ready |
| **Total** | **11 required + 1 optional** | ✅ Approved |

---

### Final QA Checklist

**Before merging to main**:

- [ ] All TypeScript checks pass: `pnpm exec tsc --noEmit`
- [ ] All Biome checks pass: `pnpm exec biome check --write <modified-files>`
- [ ] All unit tests pass: `pnpm run test:convex`
- [ ] Manual QA on test project `k57aj8wzt1mn2sgh0qm9azwdgd7zxccx` complete
- [ ] New project flow tested and verified (30s for 3×10s)
- [ ] Re-assembly flow tested and verified
- [ ] Data migration complete (all projects have transitionConfig, all scenes cleared)
- [ ] Changelog updated
- [ ] Code reviewed by senior dev

**Production Readiness Checklist**:

- [ ] Sprint 27 audio implementation ✅ (narration + music in Convex, audioTracks populated, videos table populated)
- [ ] Assembly duration fix ✅ (30s for 3×10s hard cut)
- [ ] Transition logic fix ✅ (project mode takes precedence)
- [ ] Default behavior fix ✅ (hard_cut is default)
- [ ] Data cleanup complete ✅ (no orphaned transitions)
- [ ] All tests passing ✅

---

## Reference: Existing Patterns

- **Images:** `convex/actions/imageGeneration.ts` — fetch Fal `result.images[0].url` → `ctx.storage.store(blob)` → `ctx.storage.getUrl(storageId)` → return URL.
- **Scene videos:** `convex/actions/videoPolling.ts` — fetch Fal video URL → `ctx.storage.store(blob)` → `scenes.update({ videoUrl: storedUrl })`.
- **Final video:** `convex/actions/videoAssembly.ts` — `downloadAndStoreVideo()` fetches Rendi URL → `ctx.storage.store` → `projects.updateFinalVideo({ finalVideoUrl: storedUrl })`.

Sprint 26 aligns narration and music with this pattern: **generate → fetch → store in Convex → save Convex URL**.
