# Sprint 41 — Fix Report

**Date**: March 13, 2026
**Branch**: `sprint-38-image-generator-responsive-fix`
**Status**: ✅ Complete — Ready for PR
**Issues resolved**: 10 post-review findings from Sprint 39 & Sprint 40 (3 blockers, 1 security fix, 4 high-priority warnings, 1 WCAG fix, 1 i18n key) + 13 extended tasks (design, accessibility, credit system) + 1 credit pricing data update (Discussion #155)
**Files changed**: 6 source files + 7 locale files
**QA**: 0 TypeScript errors · 0 Biome errors · All 7 locales synchronized (2196 keys each)

---

## How to read this report

Each section corresponds to one Sprint 41 task. It includes:
- The original problem identified in the post-review
- The root cause
- The exact code changes made

---

## Task 41.1 — BLOCKER C: "Back to visual editing" CTA had no navigation

**Severity**: P0 — BLOCKER
**File**: `app/[locale]/guided/step-6/page.tsx`

### Problem
The regeneration failure screen showed a "Back to visual editing" button whose `onClick` only cleared local state (`setIsRegenerating(false)`, `setRegenerationError(null)`) and fire-and-forgot `markNeedsRegeneration` calls. It never navigated to Step 3. The user was dropped back to the Step 6 main view with no final video and no path to fix anything.

A secondary issue: `hasTriggeredRegeneration.current` was not reset in the handler. If the user had navigated to Step 3, fixed their frames, and returned to Step 6, the auto-regeneration `useEffect` would check `hasTriggeredRegeneration.current === true` and short-circuit — regeneration would never fire on the second attempt.

### Root cause
`router.push` and `hasTriggeredRegeneration.current = false` were both missing from the CTA's `onClick`.

### Fix

```diff
  onClick={() => {
    setIsRegenerating(false);
    setRegenerationError(null);
+   hasTriggeredRegeneration.current = false;
    for (const scene of (scenes ?? []).filter(
      (s) => s.needsRegeneration === true && s.status === "failed",
    )) {
      markNeedsRegeneration({ sceneId: scene._id, value: false });
    }
+   router.push(`/guided/step-3?projectId=${projectId}`);
  }}
```

The `markNeedsRegeneration({ value: false })` fire-and-forget calls are correct — the user will trigger fresh `markNeedsRegeneration(true)` flags when they change frames in Step 3.

---

## Task 41.2 — BLOCKER D: Assembly progress bar missing ARIA roles

**Severity**: P0 — BLOCKER (WCAG AA)
**File**: `app/[locale]/guided/step-6/page.tsx`
**i18n**: `messages/en.json` + 6 locale files

### Problem
The progress bar in the assembly progress screen had no `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, or `aria-valuemax`. Screen readers could not convey progress state during video assembly — the most critical moment in the flow. The inner fill div also lacked a `duration-*` transition, making the large jumps (10% → 50% → 80% → 95%) appear as snaps.

### Root cause
ARIA attributes were never added when the assembly progress screen was built in Sprint 39.

### Fix

```diff
- <div className="w-full bg-[#314d68] rounded-full h-3">
-   <div
-     className="bg-[#0d7ff2] h-3 rounded-full transition-all"
-     style={{ width: `${progressValue}%` }}
-   />
- </div>
+ <div
+   role="progressbar"
+   aria-valuenow={progressValue}
+   aria-valuemin={0}
+   aria-valuemax={100}
+   aria-label={t("assembly_progress_aria_label")}
+   className="w-full bg-[#314d68] rounded-full h-3"
+ >
+   <div
+     className="bg-[#0d7ff2] h-3 rounded-full transition-all duration-500"
+     style={{ width: `${progressValue}%` }}
+   />
+ </div>
```

**`messages/en.json`** — New key added under `guided_step6`:
```json
"assembly_progress_aria_label": "Video assembly progress"
```

Translated to all 6 other locales via `pnpm translate`.

---

## Task 41.3 — BLOCKER E: `alert()` calls in `VideoGenerator.tsx`

**Severity**: P0 — BLOCKER
**File**: `components/video-generation/VideoGenerator.tsx`

### Problem
Two native `alert()` calls existed in the component:
1. **Line 256** (generation catch block): `alert(t("generation_failed_alert"))` — fires after generation fails.
2. **Line 270** (max regenerations reached): `alert(t("max_regenerations_alert", { max: maxRegenerations }))` — fires when the user has used all regeneration attempts.

Native `alert()` blocks the JavaScript thread, ignores the app's dark theme, and is suppressed in some iframe and Webview contexts (common on mobile). In suppressed environments, the max-regeneration case was completely silent — the user clicked Regenerate and nothing happened.

### Root cause
Alert calls were left from early development and never replaced with the design system's notification pattern.

### Fix — Line 256 (deleted)
The generation-failed catch block already sets `generationStatus` to `"failed"` before the `alert()` ran. The component renders a full failed-state UI (status card with error and retry button) based on that state. The `alert()` was entirely redundant — **deleted**.

### Fix — Line 270 (replaced with toast)
Added `toastMessage` state and `showToast` helper:

```typescript
const [toastMessage, setToastMessage] = useState<string | null>(null);
const showToast = (msg: string) => {
  setToastMessage(msg);
  setTimeout(() => setToastMessage(null), 4000);
};
```

```diff
- alert(t("max_regenerations_alert", { max: maxRegenerations }));
+ showToast(t("max_regenerations_alert", { max: maxRegenerations }));
```

Toast rendered at the bottom of the component JSX, after `<InsufficientCreditsModal />`:
```tsx
{toastMessage && (
  <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm">
    {toastMessage}
  </div>
)}
```

No new i18n keys — both `generation_failed_alert` and `max_regenerations_alert` already existed in the `video_generator` namespace.

---

## Task 41.4 — NEW-3: `hasAutoTriggeredReassembly.current` set before balance check

**Severity**: P1 — High
**File**: `app/[locale]/guided/step-6/page.tsx`

### Problem
In the auto-reassembly `useEffect`, `hasAutoTriggeredReassembly.current = true` was set at the very top of the `autoReassemble` async function — before `handleAssemble()` was called. `handleAssemble()` contains the credit balance check: if the user had insufficient credits, it showed `InsufficientCreditsModal` and returned early. But the ref was already `true`, permanently locking out any future auto-reassembly attempt. The user had no path to complete assembly since the manual assemble button is commented out.

### Root cause
The ref guard was placed too early in the execution flow.

### Fix

```diff
  const autoReassemble = async () => {
-   hasAutoTriggeredReassembly.current = true;
    if (assemblyStatus === "completed" || assemblyStatus === "failed") {
      await updateProject({
        projectId: projectId as Id<"projects">,
      });
    }
+   hasAutoTriggeredReassembly.current = true;
    await handleAssemble();
  };
```

If `updateProject` throws (transient network error), the ref stays `false` and a retry is possible — correct behaviour.

---

## Task 41.5 — NEW-1: `hasTriggeredRegeneration.current` never resets after success

**Severity**: P1 — High
**File**: `app/[locale]/guided/step-6/page.tsx`

### Problem
`hasTriggeredRegeneration.current` was set to `true` when regeneration started and never reset on success. This meant that if a user completed a full edit cycle (Step 3 → Step 6 → regeneration → assembly), then clicked "Make a Change → Edit Visuals & Styles" a second time, changed more frames, and returned to Step 6 — the regeneration `useEffect` would check `hasTriggeredRegeneration.current === true` and silently skip. The user was left on Step 6 with stale scene videos and no error message.

### Root cause
The ref was only reset in the CTA failure path (now fixed in Task 41.1) but not in the happy path after successful completion.

### Fix

```diff
  useEffect(() => {
    if (!isRegenerating) return;
    const allDone = (scenes ?? [])
      .filter((s) => s.needsRegeneration === true)
      .every((s) => s.status === "completed" || s.status === "failed");
-   if (allDone) setIsRegenerating(false);
+   if (allDone) {
+     setIsRegenerating(false);
+     hasTriggeredRegeneration.current = false;
+   }
  }, [scenes, isRegenerating]);
```

`hasAutoTriggeredReassembly.current` is intentionally NOT reset here — reassembly should only fire once per regeneration cycle.

---

## Task 41.6 — W3: Remove unauthenticated admin mutations (SECURITY)

**Severity**: P0 — Security
**File**: `convex/scenes.ts`

### Problem
Two public `mutation()` exports had **zero authentication checks** — any unauthenticated caller could invoke them via `api.scenes.*`:

- `adminResetVideoGeneration` — reset any scene's video generation state to `"draft"`, clearing `videoGeneration` and `videoUrl`
- `adminDeleteScene` — permanently delete any scene by ID

Both carried `// TODO: Remove this before production` comments but were deployed and live. Any user who discovered these endpoints via browser DevTools could destroy other users' data.

### Pre-deletion check
Grep confirmed **zero client-side callers** of either mutation across the entire codebase — both were pure debugging utilities never wired to any UI.

### Fix
Both mutations deleted in full (including JSDoc comments, ~46 lines removed). `npx convex dev --once` confirmed clean redeployment — neither endpoint appears in the generated `convex/_generated/api.js`.

If admin-level reset/delete functionality is ever needed again, it must be implemented as an `internalMutation` (server-side only, not callable via `api.*`) with full Clerk identity verification and admin role check.

---

## Task 41.7 — W2: Dynamic `VIDEO_GENERATION_CREDITS` — all hardcoded `20` values eliminated

**Severity**: P1 — High
**Files**: `app/[locale]/guided/step-3/page.tsx`, `components/video-generation/VideoGenerator.tsx`

### Problem
The `creditCosts` Convex table is the single source of truth for credit costs — updating it requires no code change and no deploy. However, `VIDEO_GENERATION_CREDITS` was hardcoded as `20` in **two** places:

1. `step-3/page.tsx` line 54 — pre-flight balance check before generating
2. `VideoGenerator.tsx` line 82 — badge display and per-scene credit gate

If `video_generation` cost changed in the database, both files would show the wrong cost to users and the pre-flight check would use a stale threshold — users could be told they have enough credits but then fail the server-side deduction.

### Root cause
These constants predated the dynamic `getCreditCost` query and were never updated when the modular credit system was established.

### Fix — both files

```diff
- const VIDEO_GENERATION_CREDITS = 20;
+ const videoGenerationCostData = useQuery(api.credits.getCreditCost, {
+   actionType: "video_generation",
+ });
+ const VIDEO_GENERATION_CREDITS = videoGenerationCostData?.credits ?? 20;
```

The `?? 20` fallback ensures no UI breakage during the initial query load (Convex queries are served from cache instantly on subsequent renders). Applied at the top of each component with the other Convex hooks, before any conditional returns.

Step 6 already had this pattern from Sprint 40. All three pages in the generation flow (Step 3, Step 6, VideoGenerator) are now fully aligned with the dynamic credit system.

---

## Task 41.8 — W1: `onFrameChanged` now fires on frame delete

**Severity**: P1 — High
**File**: `components/scene-management/FrameAssignment.tsx`

### Problem
`onFrameChanged?.(scene.id)` was called in `handleAssetSelect` (frame add/replace) but not in `deleteFrame`. Deleting a frame removes the source image the scene video was generated from — the scene video is now stale. Without the `onFrameChanged` callback firing, `markNeedsRegeneration` was never called on delete, so returning to Step 6 after deleting a frame presented the stale video without triggering regeneration.

### Root cause
`deleteFrame` was added before the `onFrameChanged` callback mechanism was designed, and was never updated when Sprint 40 introduced the callback.

### Fix

```diff
  const deleteFrame = async (frameType: "start" | "end") => {
    if (onDeleteFrame) {
      await onDeleteFrame(scene.id, frameType);
    } else {
      if (frameType === "start") {
        onUpdateScene(scene.id, { startFrameImage: undefined });
      } else {
        onUpdateScene(scene.id, { endFrameImage: undefined });
      }
    }
+   onFrameChanged?.(scene.id);
  };
```

Uses the same optional-chaining call pattern as the existing `onFrameChanged?.(scene.id)` in `handleAssetSelect` (line 89). No prop interface changes — `onFrameChanged` was already declared optional.

---

## Task 41.9 — W4: Assembly dismiss button touch target

**Severity**: P2
**File**: `app/[locale]/guided/step-6/page.tsx`

### Problem
The "View in background" dismiss button on the assembly progress screen used `size="sm"` (approximately 36px height), below the 44px WCAG minimum touch target. This is the only escape hatch on the blocking full-screen assembly overlay — on mobile it must be reliably tappable.

### Fix

```diff
  <Button
    variant="ghost"
-   size="sm"
    onClick={() => setAssemblyProgressDismissed(true)}
-   className="text-gray-400 hover:text-white"
+   className="text-gray-400 hover:text-white min-h-[44px] px-3"
  >
    {t("assembly_view_in_background")}
  </Button>
```

---

## Task 41.10 — Final QA

```
npx tsc --noEmit                     → exit 0 (0 errors)
npx biome check --write (6 files)    → exit 0 (no fixes applied)
pnpm translate                       → 1 key translated for fr, de, it, es, pt, ru
node scripts/verify-translations.js → ✅ All 7 locales perfectly synchronized (2196 keys each)
npx convex dev --once                → ✅ Convex functions ready (confirmed during Task 41.6)
```

---

## Credit System Alignment

Every hardcoded credit value in the generation flow has been eliminated. All three pages that trigger video generation now read dynamically from the `creditCosts` Convex table:

| Location | Before | After |
|----------|--------|-------|
| `step-3/page.tsx` | `const VIDEO_GENERATION_CREDITS = 20` | `useQuery(api.credits.getCreditCost, { actionType: "video_generation" })` |
| `VideoGenerator.tsx` | `const VIDEO_GENERATION_CREDITS = 20` | `useQuery(api.credits.getCreditCost, { actionType: "video_generation" })` |
| `step-6/page.tsx` | Already dynamic (Sprint 40) | ✅ Unchanged |

To change the cost of scene video generation: update the `video_generation` row in the `creditCosts` table in Convex. No code change. No deploy.

---

## Security Note

The two unauthenticated admin mutations (`adminResetVideoGeneration`, `adminDeleteScene`) that were deployed in production with zero auth checks have been permanently removed. Pre-deletion grep confirmed no client-side code ever called them. Convex redeployed cleanly.

---

## Files Changed Summary

| File | Change |
|------|--------|
| `app/[locale]/guided/step-6/page.tsx` | Tasks 41.1, 41.2, 41.4, 41.5, 41.9 — failure CTA navigation, ARIA progress bar, ref guard fixes, touch target |
| `components/video-generation/VideoGenerator.tsx` | Tasks 41.3, 41.7 — remove `alert()`, dynamic credit cost |
| `convex/scenes.ts` | Task 41.6 — delete `adminResetVideoGeneration` + `adminDeleteScene` |
| `app/[locale]/guided/step-3/page.tsx` | Task 41.7 — dynamic credit cost |
| `components/scene-management/FrameAssignment.tsx` | Task 41.8 — `onFrameChanged` on delete |
| `messages/en.json` | Task 41.2 — `assembly_progress_aria_label` key |
| `messages/fr.json` · `de.json` · `it.json` · `es.json` · `pt.json` · `ru.json` | Task 41.2 — auto-translated via `pnpm translate` |

---

---

## Credit Pricing Adjustment — Discussion #155

**Type**: Data update (no code change, no deploy)
**Source**: [GitHub Discussion #155 — ShortReel Credit Pricing Model (pre-launch adjustment)](https://github.com/jacquesdahan/MyShortReel-beta/discussions/155)

### Problem
Jacques requested a pre-launch review of credit values to ensure the pricing hierarchy is intuitive and reflects actual compute cost differences between steps:

> Text operations < Image transformations < Audio/Music generation < Video generation

### Changes applied

The following 5 rows in the `creditCosts` Convex table were updated directly — no code change, no deployment required:

| `actionType` | `displayName` | Before | After |
|-------------|--------------|--------|-------|
| `video_generation` | Generate Scene Video | 20 | **22** |
| `video_regeneration` | Regenerate Scene Video | 20 | **22** |
| `audio_narration` | Generate Narration | 10 | **9** |
| `audio_music` | Generate Music | 10 | **12** |
| `video_assembly` | Assemble Final Video | 5 | **4** |

`step1_story_generation` (Story Generation — Step 1) kept at **5** as confirmed.

### How it was applied
A one-time `internalMutation` (`migrations/updateCreditCosts.ts`) was written, deployed, and run via `npx convex run migrations/updateCreditCosts:applyPricingAdjustments --no-push`. The migration file was deleted and Convex redeployed cleanly after execution. All 5 rows verified live in the dev `creditCosts` table.

### UI impact
Because `VIDEO_GENERATION_CREDITS` was migrated from a hardcoded constant to a dynamic `getCreditCost` query (Task 41.7), the Step 3 badge, Step 3 pre-flight credit check, and Step 6 auto-regeneration pre-flight all immediately reflect the new value of **22** with zero code changes.

### ⚠️ Production action required
The dev `creditCosts` table has been updated. The **production** environment (`calm-gerbil-63`) must be updated manually:

1. Go to [dashboard.convex.dev/d/calm-gerbil-63](https://dashboard.convex.dev/d/calm-gerbil-63)
2. Navigate to **Data → `creditCosts`**
3. Update these 5 rows:
   - `video_generation` → **22**
   - `video_regeneration` → **22**
   - `audio_narration` → **9**
   - `audio_music` → **12**
   - `video_assembly` → **4**

---

## Deferred Issues (Sprint 42+)

| Issue | Label | Status |
|-------|-------|--------|
| `getProjectIdByVideoId` uses `.filter()` on `_id` instead of `ctx.db.get()` | performance | Low-traffic shared-link resolution path — safe to defer |
| `bg-gray-700` / `border-gray-600` in `VideoGenerator.tsx` | design | Visual-only, non-blocking |
| Card border `border-[#223649]` in `VideoGenerator` + `FrameAssignment` | design | Visual-only, non-blocking |
| Regeneration for-loop continues to next scene after a failure | edge case | Happy path unaffected |
| `_regenerationError` dead state in `step-6/page.tsx` | tech debt | No user impact |
| Step progress indicator all same colour | pre-existing | Not introduced in S39/S40/S41 |
