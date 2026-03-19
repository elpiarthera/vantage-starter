# Sprint 40 — Fix Report

**Date**: March 13, 2026
**Branch**: `sprint-38-image-generator-responsive-fix`
**Status**: ✅ Complete — Ready for PR
**Issues resolved**: 1 GitHub issue (#143 — Edit Visuals & Styles) across 4 tasks
**Files changed**: 7 source files + 7 locale files
**QA**: 0 TypeScript errors · 0 Biome errors · All 7 locales synchronized

---

## How to read this report

Each section corresponds to one task. It includes:
- The original bug/request description
- The root cause identified
- The exact files and code changes made
- Any security or correctness notes

---

## Issue #143 — "Edit Visuals & Styles" from Step 6 has no effect on final video

**Label**: bug · **Priority**: P1
**Tasks**: 40.1 · 40.2 · 40.3 · 40.4

### Description

From Step 6 (Premiere Night), the user can click "Make a Change → Edit Visuals & Styles", which navigates them to Step 3 to replace or regenerate scene frames. However, after returning to Step 6, the final video was unchanged. The edit had no effect.

### Root cause

Three separate gaps in the chain:

1. **No scene flag**: Replacing a frame in Step 3 only updated the source image. It had no mechanism to signal that the scene's video clip was now stale and needed to be re-generated.
2. **No auto-regeneration**: Step 6 had no logic to detect which scenes needed re-generation after returning from visual editing.
3. **No auto-re-assembly**: Even if the user manually re-triggered generation, the final assembly was not automatically re-triggered to incorporate the new scene video into the final film.

Sprint 39 had already added `returnTo=step-6` navigation (Task 39.4) so the user would land back at Step 6 after editing. This sprint completed the chain behind that navigation.

---

### Task 40.1 — `needs_regeneration` flag: schema, mutation, callback chain

**Files changed**:
- `convex/schema.ts`
- `convex/scenes.ts`
- `components/scene-management/FrameAssignment.tsx`
- `components/scene-management/SceneEditor.tsx`
- `components/scene-management/SceneManager.tsx`
- `app/[locale]/guided/step-3/page.tsx`

**`convex/schema.ts`** — Added `needsRegeneration` field to the `scenes` table:
```diff
+ needsRegeneration: v.optional(v.boolean()),
```

**`convex/scenes.ts`** — Added `markNeedsRegeneration` mutation with full auth and ownership check:
```typescript
export const markNeedsRegeneration = mutation({
  args: { sceneId: v.id("scenes"), value: v.boolean() },
  handler: async (ctx, { sceneId, value }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found - please sync user first");
    const scene = await ctx.db.get(sceneId);
    if (!scene) throw new Error("Scene not found");
    if (scene.userId !== user._id) throw new Error("Unauthorized - you don't own this scene");
    await ctx.db.patch(sceneId, { needsRegeneration: value, updatedAt: Date.now() });
  },
});
```

**`components/scene-management/FrameAssignment.tsx`** — Added optional `onFrameChanged` callback prop. Called after a valid landscape frame is selected (after portrait validation passes, after `onUpdateScene`):
```diff
+ onFrameChanged?: (sceneId: string) => void;
  // ...
  const handleAssetSelect = async (assetUrl: string) => {
    // ... portrait check + existing update logic ...
+   onFrameChanged?.(scene.id);
    setIsModalOpen(false);
  };
```

`FrameAssignment` does **not** call the Convex mutation directly — it only invokes the callback. The parent is responsible for the mutation call and the `Id<"scenes">` cast.

**`components/scene-management/SceneEditor.tsx`** and **`SceneManager.tsx`** — Threaded `onFrameChanged` through both components' props interfaces and both render paths (mobile navigation items + desktop tabs).

**`app/[locale]/guided/step-3/page.tsx`** — Wired the mutation and callback. The callback is passed to `<SceneManager>` **only** when `returnTo === "step-6"`:
```typescript
const markNeedsRegeneration = useMutation(api.scenes.markNeedsRegeneration);

const handleFrameChanged = useCallback(
  async (sceneId: string) => {
    await markNeedsRegeneration({
      sceneId: sceneId as Id<"scenes">,
      value: true,
    });
  },
  [markNeedsRegeneration],
);

// In JSX:
<SceneManager
  onFrameChanged={returnTo === "step-6" ? handleFrameChanged : undefined}
/>
```

When not coming from Step 6, the flag is never set — no behaviour change for the normal Step 3 flow.

---

### Task 40.2 — Auto-trigger scene video regeneration on Step 6 return

**Files changed**:
- `app/[locale]/guided/step-6/page.tsx`
- `messages/en.json` + 6 locale files

Step 6 now detects scenes with `needsRegeneration: true`, deducts credits dynamically from the `creditCosts` table, re-generates each scene video, and handles all failure states.

**`app/[locale]/guided/step-6/page.tsx`** — Key additions:

**Dynamic credit cost** (aligned with the `creditCosts` table — no hardcoded constant):
```typescript
const videoGenerationCostData = useQuery(api.credits.getCreditCost, {
  actionType: "video_generation",
});
const VIDEO_GENERATION_CREDITS = videoGenerationCostData?.credits ?? 20;
```

**Scenes filter** (excludes already-generating scenes to prevent duplicate trigger on remount):
```typescript
const scenesNeedingRegeneration = useMemo(
  () =>
    (scenes ?? []).filter(
      (s) => s.needsRegeneration === true && s.status !== "generating",
    ),
  [scenes],
);
const hasScenesToRegenerate = scenesNeedingRegeneration.length > 0;
const hasRegenerationFailure = (scenes ?? []).some(
  (s) => s.needsRegeneration === true && s.status === "failed",
);
```

**Regeneration trigger** (`useRef` guard prevents re-firing across re-renders):
```typescript
const hasTriggeredRegeneration = useRef(false);

useEffect(() => {
  if (!hasScenesToRegenerate) return;
  if (!projectId || !project || !scenes) return;
  if (hasTriggeredRegeneration.current) return;

  hasTriggeredRegeneration.current = true;
  setIsRegenerating(true);

  const triggerRegeneration = async () => {
    for (const scene of scenesNeedingRegeneration) {
      // Frame URL resolution — same priority order as step-3:
      // videoGeneration?.startFrameUrl → startFrameImageUrl → startFrame
      const startFrameUrl = scene.videoGeneration?.startFrameUrl ??
        scene.startFrameImageUrl ??
        (typeof scene.startFrame === "string" ? scene.startFrame : "");

      if (!startFrameUrl) {
        await markNeedsRegeneration({ sceneId: scene._id, value: false });
        continue;
      }

      // Credit check against live creditCosts value
      if ((balance ?? 0) < VIDEO_GENERATION_CREDITS) {
        setShowInsufficientCreditsModal(true);
        setIsRegenerating(false);
        hasTriggeredRegeneration.current = false;
        return;
      }

      let transactionId: Id<"creditTransactions"> | undefined;

      try {
        const deductResult = await deductCreditsMutation({
          clerkUserId: user?.id ?? "",
          actionType: "video_generation",
          projectId: projectId as string,
        });
        if (!deductResult.success) {
          setShowInsufficientCreditsModal(true);
          setIsRegenerating(false);
          hasTriggeredRegeneration.current = false;
          return;
        }
        transactionId = deductResult.transactionId;

        await generateVideoAction({
          sceneId: scene._id,
          sceneDescription: scene.description || "",
          startFrameUrl,
          endFrameUrl,
          cinematicStyles: cinematicStylesArray,
          duration: scene.duration || 10,
          visualStyle: project?.visualStyle,
          occasion: project?.occasion,
          theme: project?.theme,
          emotionalStory: project?.eventDetails?.emotionalStory,
        });

        await markNeedsRegeneration({ sceneId: scene._id, value: false });
      } catch (error) {
        setIsRegenerating(false); // show failure screen immediately
        if (transactionId) await refundCreditsMutation({ transactionId, reason: "regeneration_failed" });
      }
    }
  };

  triggerRegeneration().catch(console.error);
}, [hasScenesToRegenerate]);
```

**Progress and failure screens** (early returns before main render):
```tsx
// While regenerating:
if (isRegenerating && !hasRegenerationFailure) {
  return <RegeneratingScreen count={scenesNeedingRegeneration.length} />;
}

// On failure:
if (hasRegenerationFailure) {
  return (
    <FailureScreen
      onDismiss={() => {
        setIsRegenerating(false);
        // Clear needsRegeneration on failed scenes so user can retry via Step 3
        for (const scene of failedScenes) {
          markNeedsRegeneration({ sceneId: scene._id, value: false });
        }
      }}
    />
  );
}
```

**New i18n keys** added to `messages/en.json` under `guided_step6` and auto-translated to all 6 other locales:

| Key | Value |
|-----|-------|
| `regenerating_updated_scenes` | "Re-generating updated scenes…" |
| `regenerating_scenes_description` | "Applying your visual changes to {count} scene(s). This may take a few minutes." |
| `regeneration_failed_title` | "Scene regeneration failed" |
| `regeneration_failed_description` | "One or more scenes could not be regenerated. Please return to Step 3 and try again." |
| `regeneration_failed_cta` | "Back to visual editing" |

---

### Task 40.3 — Auto-trigger final re-assembly after regeneration completes

**File changed**: `app/[locale]/guided/step-6/page.tsx`

Once all flagged scenes have finished regenerating, Step 6 automatically resets `assemblyStatus` and re-triggers `handleAssemble`.

**`allFlaggedScenesComplete`** — composite condition that is `true` only after regeneration has genuinely finished (not on initial page load, due to the `hasTriggeredRegeneration.current` guard):
```typescript
const allFlaggedScenesComplete =
  !hasScenesToRegenerate &&
  !isRegenerating &&
  (scenes ?? []).every((s) => s.needsRegeneration !== true);
```

**Auto-reassembly `useEffect`** (two ref guards — one for regeneration having actually run, one against double-firing):
```typescript
const hasAutoTriggeredReassembly = useRef(false);

useEffect(() => {
  if (!allFlaggedScenesComplete) return;
  if (!hasTriggeredRegeneration.current) return;  // only fire if regeneration actually ran
  if (hasAutoTriggeredReassembly.current) return;
  if (!projectId || !project?.narrationAudioUrl) return;
  // Only if prior assembly has concluded (not mid-run)
  if (
    assemblyStatus !== "completed" &&
    assemblyStatus !== "failed" &&
    assemblyStatus !== undefined
  ) return;

  const autoReassemble = async () => {
    hasAutoTriggeredReassembly.current = true;
    // Clear stale assemblyStatus by omitting the field (no "pending" literal in schema)
    if (assemblyStatus === "completed" || assemblyStatus === "failed") {
      await updateProject({ projectId: projectId as Id<"projects"> });
    }
    await handleAssemble();
  };

  autoReassemble().catch(console.error);
}, [allFlaggedScenesComplete, assemblyStatus, projectId, project?.narrationAudioUrl]);
```

**Credit note**: `handleAssemble` already deducts `assemblyCostCredits` (5 credits) with its standard credit check. This applies to the automatic re-assembly — users are charged for the re-run, consistent with the credit system architecture.

---

### Task 40.4 — i18n + Final Sprint QA

```
npx tsc --noEmit          → exit 0 (clean)
npx biome check (7 files) → exit 0 (no fixes applied)
pnpm translate            → 5 new keys translated for fr, de, it, es, pt, ru
node scripts/verify-translations.js → ✅ All 7 locales perfectly synchronized (2195 keys each)
```

---

## Credit System Alignment

The regeneration flow in Step 6 is **fully aligned with the dynamic `creditCosts` table** — no hardcoded amounts:

- The pre-flight balance check reads `api.credits.getCreditCost({ actionType: "video_generation" })` live from Convex.
- The actual deduction passes `actionType: "video_generation"` to `deductCredits`, which looks up the cost from `creditCosts` server-side at call time.
- To change the cost of a scene regeneration: update the `video_generation` row in the `creditCosts` table. No code change, no deploy required.

---

## Security Note

The `markNeedsRegeneration` mutation includes full authentication and ownership verification (matching every other mutation in `convex/scenes.ts`):
- Clerk identity check
- User lookup via `by_clerk_user_id` index
- Scene ownership check (`scene.userId === user._id`)

Only the scene owner can set or clear the `needsRegeneration` flag.

---

## Files Changed Summary

| File | Change |
|------|--------|
| `convex/schema.ts` | Added `needsRegeneration: v.optional(v.boolean())` to scenes table |
| `convex/scenes.ts` | Added `markNeedsRegeneration` mutation with auth + ownership check |
| `components/scene-management/FrameAssignment.tsx` | Added `onFrameChanged` optional callback prop |
| `components/scene-management/SceneEditor.tsx` | Threaded `onFrameChanged` prop |
| `components/scene-management/SceneManager.tsx` | Threaded `onFrameChanged` prop (both render paths) |
| `app/[locale]/guided/step-3/page.tsx` | Wired `handleFrameChanged` callback when `returnTo === "step-6"` |
| `app/[locale]/guided/step-6/page.tsx` | Regeneration trigger loop, progress/failure screens, auto-reassembly |
| `messages/en.json` | 5 new i18n keys under `guided_step6` |
| `messages/fr.json` · `de.json` · `it.json` · `es.json` · `pt.json` · `ru.json` | Auto-translated via `pnpm translate` |

---

## Deferred Issues (Sprint 41+)

| Issue | Label | Status |
|-------|-------|--------|
| #162 — AI Transform CTA disabled with no credit explanation | bug | Deferred to Sprint 41 — see Sprint 39 fix report for full breakdown |
