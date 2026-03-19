# Sprint 40: Edit Visuals & Styles — Full Re-generation Chain

**Date**: March 13, 2026
**Branch**: `sprint-40-edit-visuals-regeneration`
**Status**: Planning — Reviewed & Ready for Implementation
**Goal**: Make "Edit Visuals & Styles" from Step 6 fully functional — production-ready, no temporary workarounds. Full chain: frame change → scene video regeneration → final video re-assembly → return to Step 6.
**Dependencies**: Sprint 39 (all tasks complete) ✅
**QA Strategy**: **2-Step QA** — (1) TypeScript `npx tsc --noEmit`, (2) Biome `npx biome check --write <files>` for every task.

---

## 🔍 Problem Summary

**Issue #143** — From Step 6 (Premiere Night), the user can click "Make a Change → Edit Visuals & Styles" which navigates them to Step 3. However, editing a frame there has no effect on the final video because:

1. The scene video was already generated from the original frame — it is baked into the final assembly.
2. Replacing a frame image only changes the source asset. It does **not** re-generate the scene video.
3. The final assembly is not re-triggered after the user returns to Step 6.

The full production-ready chain required is:

```
Step 6
  └─ "Edit Visuals & Styles" clicked
       └─ Navigate to Step 3 (returnTo=step-6 ✅ already done in Sprint 39)
            └─ User replaces/removes/uploads/generates new frame
                 └─ Scene marked as needs_regeneration
                      └─ Scene video regenerated (with credit deduction)
                           └─ User returned to Step 6
                                └─ Final assembly re-triggered automatically
                                     └─ Step 6 shows new final video
```

Sprint 39 already added `returnTo=step-6` navigation (Task 39.4). This sprint completes the remaining steps — fully, without any intermediate disabled state or "coming soon" placeholder.

---

## 🗺️ Sprint 40 Tasks

---

### Task 40.1 — Add `needs_regeneration` flag to scene schema + mutation

**Status**: 📝 Pending

**Objective**: When a user changes a frame in Step 3 while navigating from Step 6 (`returnTo=step-6`), mark the affected scene so Step 6 knows to re-trigger generation before re-assembly.

**Files**:

| File | Action |
|------|--------|
| `convex/schema.ts` | Add `needsRegeneration?: boolean` to scenes table |
| `convex/scenes.ts` | Add `markNeedsRegeneration` mutation |
| `components/scene-management/FrameAssignment.tsx` | Add optional `onFrameChanged?: (sceneId: string) => void` prop — call it in `handleAssetSelect` after portrait check passes |
| `app/[locale]/guided/step-3/page.tsx` | When `returnTo === "step-6"`, pass `onFrameChanged` callback that calls `markNeedsRegeneration` |

**Implementation**:

**Step 1 — Schema** (`convex/schema.ts`):
```typescript
// Inside scenes table definition (alongside existing validated: v.optional(v.boolean())):
needsRegeneration: v.optional(v.boolean()),
```

**Step 2 — Mutation** (`convex/scenes.ts`):
```typescript
export const markNeedsRegeneration = mutation({
  args: { sceneId: v.id("scenes"), value: v.boolean() },
  handler: async (ctx, { sceneId, value }) => {
    await ctx.db.patch(sceneId, { needsRegeneration: value });
  },
});
```

**Step 3 — `FrameAssignment.tsx`**:

Add the optional prop to the interface:
```typescript
interface FrameAssignmentProps {
  // ... existing props ...
  onFrameChanged?: (sceneId: string) => void;
}
```

In `handleAssetSelect`, call it after the portrait check passes (and before `setIsModalOpen(false)`):
```typescript
const handleAssetSelect = async (assetUrl: string) => {
  const isLandscape = await checkImageOrientation(assetUrl);
  if (!isLandscape) {
    setShowPortraitError(true);
    setIsModalOpen(false);
    return;
  }
  // ... existing update logic ...
  onFrameChanged?.(scene.id); // notify parent a frame was changed
  setIsModalOpen(false);
};
```

> **Important**: `FrameAssignment` does NOT call the Convex mutation directly — it only calls the callback. The parent is responsible for the mutation call and the `Id<"scenes">` cast.

**Step 4 — `step-3/page.tsx`**:

```typescript
const markNeedsRegeneration = useMutation(api.scenes.markNeedsRegeneration);
const returnTo = searchParams.get("returnTo");

// Callback passed to FrameAssignment only when coming from step-6
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
<FrameAssignment
  // ... existing props ...
  onFrameChanged={returnTo === "step-6" ? handleFrameChanged : undefined}
/>
```

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write convex/schema.ts convex/scenes.ts components/scene-management/FrameAssignment.tsx "app/[locale]/guided/step-3/page.tsx"
npx convex dev --once
```

---

### Task 40.2 — Auto-trigger scene video regeneration on return to Step 6

**Status**: 📝 Pending

**Objective**: When the user returns to Step 6 after editing visuals, detect scenes with `needsRegeneration: true`, deduct credits, trigger `generateVideo` for each, then clear the flag on completion.

**File**: `app/[locale]/guided/step-6/page.tsx`

**Implementation**:

**Step 1 — Imports and action setup** (at the top of the component, alongside `buildFinalVideo`):
```typescript
const generateVideoAction = useAction(api.actions.videoGeneration.generateVideo);
const deductCredits = useMutation(api.credits.deductCredits);
const refundCredits = useMutation(api.credits.refundCredits);
const markNeedsRegeneration = useMutation(api.scenes.markNeedsRegeneration);
const VIDEO_GENERATION_CREDITS = 20; // same constant as step-3
```

**Step 2 — Detect flagged scenes**:

Only scenes that are `needsRegeneration: true` AND not already `"generating"` are candidates (guards against duplicate triggers on remount):
```typescript
const scenesNeedingRegeneration = useMemo(
  () =>
    (scenes ?? []).filter(
      (s) => s.needsRegeneration === true && s.status !== "generating",
    ),
  [scenes],
);
const hasScenesToRegenerate = scenesNeedingRegeneration.length > 0;
```

**Step 3 — Show "Re-generating scenes" progress screen**:

Add a `isRegenerating` state:
```typescript
const [isRegenerating, setIsRegenerating] = useState(false);
const [regenerationError, setRegenerationError] = useState<string | null>(null);
```

Check for partial failure (any flagged scene with `status === "failed"`):
```typescript
const hasRegenerationFailure = (scenes ?? []).some(
  (s) => s.needsRegeneration === true && s.status === "failed",
);
```

Render the progress/error screen before the main return (early return pattern):
```tsx
if (isRegenerating && !hasRegenerationFailure) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#101a23] p-4">
      <Card className="w-full max-w-2xl border border-[#314d68] bg-[#182634] text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Loader2 className="h-5 w-5 animate-spin text-[#0d7ff2]" />
            {t("regenerating_updated_scenes")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-300">
            {t("regenerating_scenes_description", {
              count: scenesNeedingRegeneration.length,
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

if (hasRegenerationFailure) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#101a23] p-4">
      <Card className="w-full max-w-2xl border border-[#314d68] bg-[#182634] text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            {t("regeneration_failed_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-300">{t("regeneration_failed_description")}</p>
          <Button
            onClick={() => {
              setIsRegenerating(false);
              setRegenerationError(null);
              // Clear needsRegeneration on failed scenes so user can retry manually
              for (const scene of (scenes ?? []).filter(
                (s) => s.needsRegeneration === true && s.status === "failed",
              )) {
                markNeedsRegeneration({ sceneId: scene._id, value: false });
              }
            }}
            className="bg-[#0d7ff2] hover:bg-[#0a6fd4] text-white"
          >
            {t("regeneration_failed_cta")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 4 — Trigger regeneration via `useEffect`**:

Use a `useRef` guard to prevent re-firing across re-renders. Mirrors the credit deduction + refund pattern from `step-3/page.tsx`:
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
      // Resolve frame URLs — same priority order as step-3/handleGenerateVideoClick
      const startFrameUrl =
        scene.videoGeneration?.startFrameUrl ??
        scene.startFrameImageUrl ??
        (typeof scene.startFrame === "string" ? scene.startFrame : "");
      const endFrameUrl =
        scene.videoGeneration?.endFrameUrl ??
        scene.endFrameImageUrl ??
        (typeof scene.endFrame === "string" ? scene.endFrame : undefined);

      if (!startFrameUrl) {
        console.error(`[Step 6] Scene ${scene._id} missing start frame — skipping`);
        await markNeedsRegeneration({ sceneId: scene._id, value: false });
        continue;
      }

      // Credit check
      if ((balance ?? 0) < VIDEO_GENERATION_CREDITS) {
        setShowInsufficientCreditsModal(true);
        setIsRegenerating(false);
        hasTriggeredRegeneration.current = false;
        return;
      }

      let transactionId: Id<"creditTransactions"> | undefined;

      try {
        const deductResult = await deductCredits({
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

        const cinematicStylesArray = scene.cinematicStyles
          ? [
              scene.cinematicStyles.ambiance,
              scene.cinematicStyles.cameraMovement,
              scene.cinematicStyles.colorTone,
              scene.cinematicStyles.visualStyle,
            ].filter((s): s is string => Boolean(s))
          : undefined;

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

        // Clear flag on success
        await markNeedsRegeneration({ sceneId: scene._id, value: false });
      } catch (error) {
        console.error(`[Step 6] Regeneration failed for scene ${scene._id}:`, error);
        if (transactionId) {
          try {
            await refundCredits({ transactionId, reason: "regeneration_failed" });
          } catch (refundError) {
            console.error("[Step 6] Refund failed:", refundError);
          }
        }
        // Leave needsRegeneration: true + status "failed" → triggers error UI above
      }
    }
  };

  triggerRegeneration().catch(console.error);
}, [hasScenesToRegenerate]); // useRef guard prevents re-firing; dep is stable boolean
```

**Step 5 — Clear `isRegenerating` when all scenes are done**:
```typescript
useEffect(() => {
  if (!isRegenerating) return;
  const allDone = (scenes ?? [])
    .filter((s) => s.needsRegeneration === true)
    .every((s) => s.status === "completed" || s.status === "failed");
  if (allDone) setIsRegenerating(false);
}, [scenes, isRegenerating]);
```

Add to `messages/en.json` (under `guided_step6` namespace):
```json
"regenerating_updated_scenes": "Re-generating updated scenes…",
"regenerating_scenes_description": "Applying your visual changes to {count} scene(s). This may take a few minutes.",
"regeneration_failed_title": "Scene regeneration failed",
"regeneration_failed_description": "One or more scenes could not be regenerated. Please return to Step 3 and try again.",
"regeneration_failed_cta": "Back to visual editing"
```

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write "app/[locale]/guided/step-6/page.tsx" messages/en.json
npx convex dev --once
```

---

### Task 40.3 — Auto-trigger final re-assembly after regeneration completes

**Status**: 📝 Pending

**Objective**: Once all `needsRegeneration` scenes are regenerated (`"completed"`) and `isRegenerating` is `false`, automatically reset `assemblyStatus` and re-trigger `handleAssemble` so Step 6 shows the new final video.

**File**: `app/[locale]/guided/step-6/page.tsx`

**Implementation**:

**Step 1 — Watch for regeneration completion**:
```typescript
const allFlaggedScenesComplete =
  !hasScenesToRegenerate &&
  !isRegenerating &&
  (scenes ?? []).every((s) => s.needsRegeneration !== true);
```

**Step 2 — Reset `assemblyStatus` before re-assembly**:

The `assemblyStatus` schema has no `"pending"` literal. To allow `handleAssemble` to re-run, clear the field by omitting it from the `updateProject` call. The `api.projects.update` mutation accepts `assemblyStatus` as optional — passing it without the field clears it:

```typescript
await updateProject({
  projectId: projectId as Id<"projects">,
  // assemblyStatus intentionally omitted → clears the field to undefined
});
```

> Only reset if `assemblyStatus` is `"completed"` or `"failed"` — i.e., a prior run has concluded. Never reset if it's already in-progress (`"preparing_assets"`, `"processing_media"`, etc.).

**Step 3 — Auto-trigger `handleAssemble`**:
```typescript
const hasAutoTriggeredReassembly = useRef(false);

useEffect(() => {
  if (!allFlaggedScenesComplete) return;
  if (hasAutoTriggeredReassembly.current) return;
  if (!projectId || !project?.narrationAudioUrl) return;
  // Only auto-reassemble if prior assembly has concluded
  if (
    assemblyStatus !== "completed" &&
    assemblyStatus !== "failed" &&
    assemblyStatus !== undefined
  ) return;

  const autoReassemble = async () => {
    hasAutoTriggeredReassembly.current = true;

    // Reset assemblyStatus so handleAssemble's progress screen renders correctly
    if (assemblyStatus === "completed" || assemblyStatus === "failed") {
      await updateProject({
        projectId: projectId as Id<"projects">,
        // assemblyStatus omitted → clears to undefined
      });
    }

    await handleAssemble();
  };

  autoReassemble().catch(console.error);
}, [allFlaggedScenesComplete, assemblyStatus, projectId, project?.narrationAudioUrl]);
```

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write "app/[locale]/guided/step-6/page.tsx"
npx convex dev --once
```

---

### Task 40.4 — i18n + Final Sprint QA

**Status**: 📝 Pending

**Objective**: Ensure all new strings are translated across all 7 locales and the full sprint passes TypeScript + Biome checks.

```bash
# 1. Full TypeScript check
npx tsc --noEmit

# 2. Full Biome check
npx biome check --write .

# 3. Deploy to Convex dev
npx convex dev --once

# 4. Generate + verify translations
pnpm translate
node scripts/verify-translations.js
```

**Manual test checklist**:
- [ ] Step 6 → Make a Change → "Edit Visuals & Styles" is fully clickable (no disabled state, no "coming soon")
- [ ] Edit Visuals → Step 3 → Replace frame → Continue → lands on Step 6
- [ ] Step 6 shows "Re-generating updated scenes…" progress screen
- [ ] Credits are deducted before each scene regeneration
- [ ] On credit failure, `InsufficientCreditsModal` opens
- [ ] On regeneration failure, error screen shows with "Back to visual editing" CTA
- [ ] After all scenes regenerated, Step 6 automatically triggers re-assembly
- [ ] Final video reflects the new frame
- [ ] Navigate away mid-regeneration → return → no duplicate generation triggered (scene already `"generating"`)
- [ ] All 5 new i18n strings translated across all 7 locales (en, fr, de, it, es, pt, ru)

---

## 📊 Task Priority & Status Table

| # | Task | Status |
|---|------|--------|
| 40.1 | `needs_regeneration` flag in schema + mutation + FrameAssignment callback | 📝 Pending |
| 40.2 | Auto-trigger scene regeneration on Step 6 return (with credits + error handling) | 📝 Pending |
| 40.3 | Auto-trigger re-assembly after regeneration completes | 📝 Pending |
| 40.4 | i18n + Final Sprint QA | 📝 Pending |

## 🚀 Execution Order

1. **40.1** — Convex schema foundation needed by all other tasks; deploy schema first
2. **40.2** — depends on 40.1 (scene flag + mutation must exist)
3. **40.3** — depends on 40.2 (scenes must be flagged and regenerated before re-assembly)
4. **40.4** — final gate: translations + full QA pass

## ⚠️ Pre-Work Confirmations (Verified Against Codebase)

| Item | Status |
|------|--------|
| `handleAssemble` (not `handleAssembleVideo`) is the correct function name in `step-6/page.tsx` line 170 | ✅ Verified |
| `generateVideo` requires `sceneDescription: v.string()` and `startFrameUrl: v.string()` (non-optional). No `projectId` arg. | ✅ Verified |
| `api.projects.update` accepts `assemblyStatus` as optional — omitting it clears the field to `undefined`. No `"pending"` literal in schema. | ✅ Verified |
| `balance` from `useCredits` is available in `step-6/page.tsx` (line 108) | ✅ Verified |
| `updateProject` is already declared in `step-6/page.tsx` via `useMutation(api.projects.update)` (line 111) | ✅ Verified |
| Frame URL resolution priority: `videoGeneration?.startFrameUrl` → `startFrameImageUrl` → `startFrame` | ✅ Verified (mirrors step-3 lines 396–407) |
| Credit deduction pattern: `deductCredits` → `generateVideo` → `refundCredits` on failure | ✅ Verified (mirrors step-3 lines 424–480) |
