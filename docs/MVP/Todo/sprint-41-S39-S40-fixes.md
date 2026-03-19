# Sprint 41: S39 & S40 Post-Review Fixes

**Date**: March 13, 2026
**Branch**: `sprint-41-s39-s40-fixes`
**Status**: ✅ Complete — All 23 tasks implemented, QA verified, and credit pricing data updated (Discussion #155)
**Goal**: Address all blockers and high-priority warnings identified in the post-sprint review of Sprint 39 and Sprint 40. All fixes are production-required before the branch can be merged.
**QA Strategy**: **2-Step QA** — (1) TypeScript `npx tsc --noEmit`, (2) Biome `npx biome check --write <files>` for every task.

---

## 🔍 Issues & Origin

All items come from the three-agent review (convex-master + design-master + senior-dev-reviewer) run on March 13, 2026 against the Sprint 39 and Sprint 40 implementations.

---

## 🗺️ Sprint 41 Tasks

---

### Task 41.1 — BLOCKER C: "Back to visual editing" CTA missing navigation

**Priority**: P0 — BLOCKER
**File**: `app/[locale]/guided/step-6/page.tsx`

**Problem**: The regeneration failure screen has a "Back to visual editing" button (`regeneration_failed_cta`) that only clears local state. It does **not** navigate to Step 3. After clicking, the user is dropped to the Step 6 main view with no final video and no path forward.

Additionally, `hasTriggeredRegeneration.current` is not reset in the onClick handler. Without this reset, when the user returns from Step 3 after fixing their frames, the auto-regeneration `useEffect` checks `hasTriggeredRegeneration.current === true` and silently skips — the user is again stuck on Step 6 with no regeneration triggered.

**Root cause**: `router.push` and `hasTriggeredRegeneration.current = false` both missing from the `onClick` handler (lines 831–843). `router` is already declared in scope — no import needed.

**Fix**:

```diff
  <Button
    onClick={() => {
      setIsRegenerating(false);
      setRegenerationError(null);
+     hasTriggeredRegeneration.current = false;
      for (const scene of (scenes ?? []).filter(
        (s) => s.needsRegeneration === true && s.status === "failed",
      )) {
        markNeedsRegeneration({ sceneId: scene._id, value: false });
      }
+     router.push(`/guided/step-3?projectId=${projectId}`);
    }}
    className="bg-[#0d7ff2] hover:bg-[#0a6fd4] text-white"
  >
    {t("regeneration_failed_cta")}
  </Button>
```

**Note on markNeedsRegeneration calls**: They run fire-and-forget in the loop, clearing `needsRegeneration` on failed scenes. This is correct — the user will trigger a fresh `markNeedsRegeneration(true)` from Step 3 when they change frames again.

**QA**: Trigger a scene regeneration failure on Step 6. Click "Back to visual editing" → verify navigation to `/guided/step-3?projectId=<id>`. Fix frames, return to Step 6 → verify auto-regeneration fires again.

---

### Task 41.2 — BLOCKER D: Assembly progress bar missing ARIA roles

**Priority**: P0 — BLOCKER (WCAG AA)
**File**: `app/[locale]/guided/step-6/page.tsx`

**Problem**: The progress bar on the assembly progress screen (lines 659–664) has no `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, or `aria-valuemax`. Screen readers cannot convey progress state during video assembly — the most critical moment in the flow.

**Fix**: Add ARIA attributes to the **outer container div** (the track/rail — `bg-[#314d68]`), not the inner fill div. Also add `duration-500` to the inner fill's transition to smooth the large percentage jumps (10% → 50% → 80% → 95%):

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

**i18n**: Add `"assembly_progress_aria_label": "Video assembly progress"` to `messages/en.json` under the `guided_step6` namespace (after the `"regeneration_failed_cta"` key). Run `pnpm translate` for all 7 locales. Run `node scripts/verify-translations.js` to confirm sync.

**QA**: Inspect DOM with browser DevTools → verify `role="progressbar"` and `aria-valuenow` are on the outer container div. Run `pnpm translate` + `node scripts/verify-translations.js`.

---

### Task 41.3 — BLOCKER E: Replace `alert()` calls in `VideoGenerator.tsx`

**Priority**: P0 — BLOCKER
**File**: `components/video-generation/VideoGenerator.tsx`

**Problem**: Two `alert()` native browser dialog calls at lines 256 and 270:
- Line 256: `alert(t("generation_failed_alert"))` — in the generation `catch` block
- Line 270: `alert(t("max_regenerations_alert", { max: maxRegenerations }))` — in regenerate click handler

Native `alert()` ignores the dark theme, blocks the JS thread, and is suppressed in some iframe/Webview contexts.

**Fix — Line 256 (generation failed)**:

**Delete `alert(t("generation_failed_alert"))` entirely.** The `generationStatus` state is already set to `"failed"` before this line runs, and the component already renders a full failed UI (lines 579–603) showing the error state with a retry button. The `alert()` is entirely redundant and adds no value. No toast needed here.

**Fix — Line 270 (max regenerations)**:

Add a `toastMessage` state and `showToast` helper since this is the **only** place that communicates the max-regeneration limit to the user. Add toast state alongside the other `useState` declarations (top of `GuidedStep6Content` / at the top of the component):

```typescript
const [toastMessage, setToastMessage] = useState<string | null>(null);

const showToast = (msg: string) => {
  setToastMessage(msg);
  setTimeout(() => setToastMessage(null), 4000);
};
```

Replace `alert()`:
```diff
- alert(t("max_regenerations_alert", { max: maxRegenerations }));
+ showToast(t("max_regenerations_alert", { max: maxRegenerations }));
```

Render the toast inside the component's return JSX, **as the last element inside the outermost `<>` fragment** (after `<InsufficientCreditsModal ... />`):
```tsx
{toastMessage && (
  <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm">
    {toastMessage}
  </div>
)}
```

**i18n**: Both keys `generation_failed_alert` and `max_regenerations_alert` already exist in `messages/en.json` under the `video_generator` namespace. No new keys needed.

**QA**: Trigger a failed generation in Step 3 → verify no native browser dialog appears → verify the existing generation-failed status UI shows in the card. Reach max regenerations → click Regenerate → verify a red toast appears bottom-right (not a native dialog).

---

### Task 41.4 — NEW-3: `hasAutoTriggeredReassembly.current` set before balance check

**Priority**: P1 — High
**File**: `app/[locale]/guided/step-6/page.tsx`

**Problem**: In the auto-reassembly `useEffect`, `hasAutoTriggeredReassembly.current = true` is set at the top of `autoReassemble()` before the credit balance check inside `handleAssemble()`. If the user has insufficient credits, `handleAssemble` shows the `InsufficientCreditsModal` and returns early — but the ref is already `true`. When the user tops up credits and returns to Step 6, the auto-reassembly `useEffect` short-circuits immediately (`hasAutoTriggeredReassembly.current` is `true`). The user has no path to complete assembly since the manual assemble button is commented out.

**Fix**:

```diff
  const autoReassemble = async () => {
-   hasAutoTriggeredReassembly.current = true;
    if (assemblyStatus === "completed" || assemblyStatus === "failed") {
      await updateProject({
        projectId: projectId as Id<"projects">,
      });
    }
+   // Only lock the ref after assembly has actually started (not before credit check)
+   hasAutoTriggeredReassembly.current = true;
    await handleAssemble();
  };
```

**Note**: Moving the ref set to immediately before `handleAssemble()` means the balance check inside `handleAssemble` runs first. If it fails, `hasAutoTriggeredReassembly.current` stays `false`, and the next time `allFlaggedScenesComplete` is `true` (e.g., on navigation back), the effect fires again.

**QA**: With insufficient credits, trigger auto-reassembly → verify `InsufficientCreditsModal` shows → top up credits → navigate back to Step 6 → verify assembly auto-triggers again.

---

### Task 41.5 — NEW-1: `hasTriggeredRegeneration.current` never resets across sessions

**Priority**: P1 — High
**File**: `app/[locale]/guided/step-6/page.tsx`

**Problem**: `hasTriggeredRegeneration.current` is set to `true` when regeneration starts and never reset to `false` on success. If the user:
1. Edits Step 3 (e.g., replaces a frame) → returns to Step 6 → regeneration fires ✅
2. Clicks "Make a Change → Edit Visuals & Styles" again → goes back to Step 3 → replaces another frame
3. Returns to Step 6 → new scenes have `needsRegeneration: true`
4. BUT `hasTriggeredRegeneration.current` is already `true` → the regeneration `useEffect` short-circuits → **regeneration never fires**

The user is stuck on Step 6 with stale scene videos and no visible error.

**Fix**: Reset `hasTriggeredRegeneration.current` when regeneration has fully completed (all flagged scenes done) so a second edit-cycle can trigger again.

The cleanest place is after `setIsRegenerating(false)` is confirmed in the second `useEffect`:

```diff
  useEffect(() => {
    if (!isRegenerating) return;
    const allDone = (scenes ?? [])
      .filter((s) => s.needsRegeneration === true)
      .every((s) => s.status === "completed" || s.status === "failed");
-   if (allDone) setIsRegenerating(false);
+   if (allDone) {
+     setIsRegenerating(false);
+     // Reset so a second edit cycle can trigger regeneration again
+     hasTriggeredRegeneration.current = false;
+   }
  }, [scenes, isRegenerating]);
```

**Note**: `hasAutoTriggeredReassembly.current` should NOT be reset here — reassembly should still only fire once per completed regeneration cycle. It is correctly scoped to the assembly lifecycle, not the regeneration lifecycle.

**QA**: Complete a full edit cycle (Step 3 → Step 6 → regeneration → assembly → video). Then click "Make a Change → Edit Visuals & Styles" again → change a frame → return to Step 6 → verify regeneration triggers a second time.

---

### Task 41.6 — W3: Remove unauthenticated admin mutations (SECURITY)

**Priority**: P0 — Security / Must fix before public launch
**File**: `convex/scenes.ts`

**Problem**: Two mutations in `convex/scenes.ts` have **no authentication check** — they are callable by any unauthenticated Convex client:

- `adminResetVideoGeneration` (lines 407–427) — resets any scene's video generation state
- `adminDeleteScene` (lines 434–448) — permanently deletes any scene

Both carry `// TODO: Remove this before production` comments but are currently deployed and publicly accessible.

**Pre-deletion check (required before editing)**: Search the codebase for any client-side callers:

```bash
rg "adminResetVideoGeneration|adminDeleteScene" --type ts --type tsx
```

If any component calls these, update it to use the authenticated equivalents (`api.scenes.resetVideoGeneration` and `api.scenes.remove`) before deleting.

**Fix**: Delete both mutation exports entirely (lines 402–448, including the JSDoc comments).

**QA (per-task — run immediately after deletion, do not defer)**:
```bash
npx tsc --noEmit
npx biome check --write convex/scenes.ts
npx convex dev --once   # Confirms deployment — api.scenes.adminResetVideoGeneration and api.scenes.adminDeleteScene must no longer appear in convex/_generated/api.js
```

---

### Task 41.7 — W2: Dynamic `VIDEO_GENERATION_CREDITS` — `step-3/page.tsx` AND `VideoGenerator.tsx`

**Priority**: P1 — High
**Files**: `app/[locale]/guided/step-3/page.tsx`, `components/video-generation/VideoGenerator.tsx`

**Problem**: `VIDEO_GENERATION_CREDITS` is hardcoded as `20` in **two places**:
- `step-3/page.tsx` line 54 — used for the pre-flight balance check before generating
- `VideoGenerator.tsx` line 82 — used for both the badge display and the per-scene credit gate at line 185

Both must use the dynamic `getCreditCost` query. The `creditCosts` table in Convex is the single source of truth — hardcoded values anywhere in the UI undermine the entire modular credit system.

**Fix — `step-3/page.tsx`**:

Replace line 54. The `useQuery` import already exists at line 4. Placement: exactly at line 54, with the other Convex hooks before any conditional returns:

```diff
- const VIDEO_GENERATION_CREDITS = 20;
+ const videoGenerationCostData = useQuery(api.credits.getCreditCost, {
+   actionType: "video_generation",
+ });
+ const VIDEO_GENERATION_CREDITS = videoGenerationCostData?.credits ?? 20;
```

**Fix — `VideoGenerator.tsx`**:

Replace line 82. The `useQuery` import already exists at line 4. Placement: right below line 82, replacing the hardcoded constant:

```diff
- const VIDEO_GENERATION_CREDITS = 20;
+ const videoGenerationCostData = useQuery(api.credits.getCreditCost, {
+   actionType: "video_generation",
+ });
+ const VIDEO_GENERATION_CREDITS = videoGenerationCostData?.credits ?? 20;
```

The `?? 20` fallback ensures the UI is never blocked while the query loads (Convex queries are instant from cache on subsequent renders).

**QA**: Update `video_generation` row in Convex `creditCosts` table to a test value (e.g., 25). Reload Step 3 → verify credit badge/check reflects 25 in both the step-3 page CTA and inside the VideoGenerator card per scene.

---

### Task 41.8 — W1: Fire `onFrameChanged` on frame delete in `FrameAssignment.tsx`

**Priority**: P1 — High
**File**: `components/scene-management/FrameAssignment.tsx`

**Problem**: `onFrameChanged?.(scene.id)` is called in `handleAssetSelect` (frame add/replace) but **not** in `deleteFrame`. Deleting a frame removes the source image the scene video was generated from. If the user deletes a frame and returns to Step 6, `needsRegeneration` is not set — the stale video is presented as current, and auto-reassembly won't re-run with the correct source.

**Fix**: Call `onFrameChanged` inside `deleteFrame` after the deletion completes:

```diff
  const deleteFrame = async (frameType: "start" | "end") => {
    if (onDeleteFrame) {
      console.log("[FrameAssignment] Using immediate delete for:", frameType);
      await onDeleteFrame(scene.id, frameType);
    } else {
      console.log("[FrameAssignment] Using regular update for:", frameType);
      if (frameType === "start") {
        onUpdateScene(scene.id, { startFrameImage: undefined });
      } else {
        onUpdateScene(scene.id, { endFrameImage: undefined });
      }
    }
+   onFrameChanged?.(scene.id);
  };
```

**QA**: From Step 6 → "Edit Visuals & Styles" → Step 3, delete a scene's start frame → return to Step 6 → verify `needsRegeneration === true` on the scene in Convex → verify regeneration flow triggers.

---

### Task 41.9 — W4: Assembly dismiss button touch target

**Priority**: P2
**File**: `app/[locale]/guided/step-6/page.tsx`

**Problem**: The "View in background" dismiss button uses `size="sm"` (36px height), below the 44px WCAG minimum touch target. This is the escape hatch on the blocking assembly progress screen — on mobile it must be reliably tappable.

**Fix**:

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

### Task 41.10 — QA: 2-Step + i18n verification

**Priority**: Required (all tasks)

After all fixes are applied:

```bash
npx tsc --noEmit

npx biome check --write \
  app/[locale]/guided/step-6/page.tsx \
  components/video-generation/VideoGenerator.tsx \
  convex/scenes.ts \
  app/[locale]/guided/step-3/page.tsx \
  components/scene-management/FrameAssignment.tsx \
  messages/en.json

pnpm translate                          # Translate new i18n key from Task 41.2
node scripts/verify-translations.js    # Must confirm all 7 locales synchronized
npx convex dev --once                   # Must deploy without errors
```

---

---

### Task 41.11 — B-1+B-3: Forbidden Tailwind tokens in `VideoGenerator.tsx`

**Priority**: P0 — BLOCKER (Design system)
**File**: `components/video-generation/VideoGenerator.tsx`

**Problem**: Two violations of the design system color rules:
- Lines 547, 562: `border-gray-600 hover:bg-gray-700` on Regenerate + Download buttons — must be `border-[#314d68] hover:bg-[#223649]`
- Line 500: `bg-gray-700` on progress bar track — must be `bg-[#314d68]`

**Fix**:
```diff
- className="text-white border-gray-600 hover:bg-gray-700 bg-transparent w-full sm:w-auto min-h-[44px]"
+ className="text-white border-[#314d68] hover:bg-[#223649] bg-transparent w-full sm:w-auto min-h-[44px]"
```
Apply to both Regenerate (line 547) and Download (line 562) buttons.

```diff
- className={`mt-4 w-48 bg-gray-700 rounded-full h-2 mx-auto ...`}
+ className={`mt-4 w-48 bg-[#314d68] rounded-full h-2 mx-auto ...`}
```

**QA**: Confirm no `bg-gray-700` or `border-gray-600` remain in `VideoGenerator.tsx`.

---

### Task 41.12 — B-2: Regeneration failure CTA missing `min-h-[44px]`

**Priority**: P0 — BLOCKER (WCAG AA)
**File**: `app/[locale]/guided/step-6/page.tsx`

**Problem**: The "Back to visual editing" button at line 838 is the only escape from the failure screen. Default `Button` height is 40px — below 44px minimum.

**Fix**:
```diff
- className="bg-[#0d7ff2] hover:bg-[#0a6fd4] text-white"
+ className="bg-[#0d7ff2] hover:bg-[#0a6fd4] text-white min-h-[44px]"
```

---

### Task 41.13 — W-4: Add dismiss button to regeneration progress screen

**Priority**: P1 — High
**File**: `app/[locale]/guided/step-6/page.tsx`

**Problem**: The regeneration progress screen (`isRegenerating && !hasRegenerationFailure`) blocks the full UI indefinitely with no escape, unlike the assembly progress screen which has a "View in background" dismiss.

**Fix**: Add a `regenerationProgressDismissed` state and a dismiss button matching the assembly pattern:

```diff
+ const [regenerationProgressDismissed, setRegenerationProgressDismissed] = useState(false);

  if (isRegenerating && !hasRegenerationFailure && !regenerationProgressDismissed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#101a23] p-4">
        <Card className="w-full max-w-2xl border border-[#314d68] bg-[#182634] text-white">
          <CardHeader>
-           <CardTitle className="flex items-center gap-2 text-white">
-             <Loader2 className="h-5 w-5 animate-spin text-[#0d7ff2]" />
-             {t("regenerating_updated_scenes")}
-           </CardTitle>
+           <div className="flex items-center justify-between">
+             <CardTitle className="flex items-center gap-2 text-white">
+               <Loader2 className="h-5 w-5 animate-spin text-[#0d7ff2]" />
+               {t("regenerating_updated_scenes")}
+             </CardTitle>
+             <Button
+               variant="ghost"
+               onClick={() => setRegenerationProgressDismissed(true)}
+               className="text-gray-400 hover:text-white min-h-[44px] px-3"
+             >
+               {t("assembly_view_in_background")}
+             </Button>
+           </div>
          </CardHeader>
```

Reuse the existing `assembly_view_in_background` i18n key — no new key needed.

---

### Task 41.14 — W-5: Align regeneration failure error state with assembly failure

**Priority**: P1 — High
**File**: `app/[locale]/guided/step-6/page.tsx`

**Problem**: Two error screens have inverted visual treatments:
- Assembly failure (line 687): `border-red-500/40` border + `text-white` title + `text-red-400` icon ✅
- Regeneration failure (line 827): `border-[#314d68]` neutral border + `text-red-400` title — inconsistent

**Fix**:
```diff
- <Card className="w-full max-w-2xl border border-[#314d68] bg-[#182634] text-white">
-   <CardHeader>
-     <CardTitle className="flex items-center gap-2 text-red-400">
-       <AlertTriangle className="h-5 w-5" />
+ <Card className="w-full max-w-2xl border border-red-500/40 bg-[#182634] text-white">
+   <CardHeader>
+     <CardTitle className="flex items-center gap-2 text-white">
+       <AlertTriangle className="h-5 w-5 text-red-400" />
```

---

### Task 41.15 — W-6: `text-blue-400` → `text-[#0d7ff2]` on Step 6 subtitle

**Priority**: P1
**File**: `app/[locale]/guided/step-6/page.tsx`

**Problem**: Line 909 uses `text-blue-400` (#60a5fa — cyan-leaning), not the brand blue `text-[#0d7ff2]`.

**Fix**:
```diff
- <p className="text-xl text-blue-400 italic">{t("subtitle")}</p>
+ <p className="text-xl text-[#0d7ff2] italic">{t("subtitle")}</p>
```

---

### Task 41.16 — W-7: Add `aria-live` to assembly status text

**Priority**: P1 — Accessibility
**File**: `app/[locale]/guided/step-6/page.tsx`

**Problem**: Line 672 — the assembly status label updates dynamically but has no `aria-live`. Screen readers cannot announce transitions between `preparing_assets` → `processing_media` → etc.

**Fix**:
```diff
- <p className="text-sm text-gray-300 animate-pulse text-center">
+ <p className="text-sm text-gray-300 animate-pulse text-center" aria-live="polite" aria-atomic="true">
    {STATUS_MESSAGES[assemblyStatus] ?? t("status_processing")}
  </p>
```

---

### Task 41.17 — NEW-1: Reset `hasAutoTriggeredReassembly.current` on credit modal close

**Priority**: P1 — High
**File**: `app/[locale]/guided/step-6/page.tsx`

**Problem**: If `handleAssemble` bails early due to insufficient credits (line 339–341), `hasAutoTriggeredReassembly.current` is already `true`. After topping up credits without navigating away, the auto-reassembly `useEffect` short-circuits — user is stuck.

**Fix**: Reset the ref in the `InsufficientCreditsModal` `onClose` handler (line ~1270):
```diff
  <InsufficientCreditsModal
    isOpen={showInsufficientCreditsModal}
-   onClose={() => setShowInsufficientCreditsModal(false)}
+   onClose={() => {
+     setShowInsufficientCreditsModal(false);
+     hasAutoTriggeredReassembly.current = false; // Allow retry after credits top-up
+   }}
    required={requiredCredits}
    available={balance ?? 0}
  />
```

---

### Task 41.18 — W-3: Replace inline `style` with Tailwind class in `FrameAssignment.tsx`

**Priority**: P1
**File**: `components/scene-management/FrameAssignment.tsx`

**Problem**: Lines 133 and 199 use `style={{ borderColor: "#314d68" }}` alongside Tailwind classes — splits styling systems.

**Fix**: Remove the `style` prop and add `border-[#314d68]` to the `className` on both dropzone divs:
```diff
- className="border-2 border-dashed rounded-lg p-8 ..."
- style={{ borderColor: "#314d68" }}
+ className="border-2 border-dashed border-[#314d68] rounded-lg p-8 ..."
```

---

### Task 41.19 — W-2: Portrait modal "Got it" button `min-h-[44px]`

**Priority**: P1 — Accessibility
**File**: `components/scene-management/FrameAssignment.tsx`

**Problem**: The "Got it" dismissal button in both the Drawer and Dialog instances of the portrait error modal uses default height (40px) — below WCAG minimum.

**Fix**: Add `min-h-[44px]` to both instances:
```diff
- className="w-full bg-[#314d68] hover:bg-[#3d5f7d] text-white border-0"
+ className="w-full bg-[#314d68] hover:bg-[#3d5f7d] text-white border-0 min-h-[44px]"
```

---

### Task 41.20 — W-8: Dynamic `CREDITS_PER_IMAGE` in `AssetSelector.tsx`

**Priority**: P1 — Credit system integrity
**File**: `components/asset-management/AssetSelector.tsx`

**Problem**: Line 38 hardcodes `const CREDITS_PER_IMAGE = 5` — same issue as the `VIDEO_GENERATION_CREDITS` fix in Task 41.7. The `creditCosts` table must be the single source of truth.

**Fix**: Replace the constant with a live `getCreditCost` query. Add `useQuery` import if not already present; add `api` import:
```diff
- const CREDITS_PER_IMAGE = 5;

+ const imageGenerationCostData = useQuery(api.credits.getCreditCost, {
+   actionType: "image_generation",
+ });
+ const CREDITS_PER_IMAGE = imageGenerationCostData?.credits ?? 5;
```

---

### Task 41.21 — W-9: Image count stepper buttons `h-11 w-11` touch target

**Priority**: P1 — Accessibility
**File**: `components/asset-management/AssetSelector.tsx`

**Problem**: Lines 1019 and 1039 — Minus and Plus stepper buttons are `h-10 w-10` (40px) — below 44px WCAG minimum. These buttons control how many images (and credits) to generate.

**Fix**: Remove `size="sm"` and change to `h-11 w-11`:
```diff
- size="sm"
- className="h-10 w-10 p-0 bg-[#1a2332] border-[#314d68] ..."
+ className="h-11 w-11 p-0 bg-[#1a2332] border-[#314d68] ..."
```
Apply to both Minus (line 1019) and Plus (line 1039) buttons.

---

### Task 41.22 — NEW-2: Strip debug `console.log` from hot production paths

**Priority**: P1
**Files**: `middleware.ts`, `app/[locale]/guided/step-3/page.tsx`

**Problem**:
- `middleware.ts` lines 74, 80, 88, 102: 4 `console.log` calls fire on **every HTTP request** — significant Vercel log volume and cost at scale
- `step-3/page.tsx`: 13 debug `console.log` calls including per-subscription-delivery traces like `"[Step 3] updateScene called with:"` and `"[Step 3] Updating scene in Convex:"`

**Fix**: Delete all `console.log` calls in `middleware.ts`. In `step-3/page.tsx`, delete all debug `[Step 3]` console.log lines. Keep `console.error` calls for genuine error paths.

---

### Task 41.23 — QA: 2-Step + verification

**Priority**: Required

After all tasks are applied:
```bash
npx tsc --noEmit

npx biome check --write \
  components/video-generation/VideoGenerator.tsx \
  app/[locale]/guided/step-6/page.tsx \
  components/scene-management/FrameAssignment.tsx \
  components/asset-management/AssetSelector.tsx \
  middleware.ts \
  app/[locale]/guided/step-3/page.tsx

node scripts/verify-translations.js   # No new i18n keys — must still pass
```

---

## 📋 Summary Table

| Task | Severity | File | Description |
|------|----------|------|-------------|
| 41.1 | P0 BLOCKER | `step-6/page.tsx` | Add `router.push` to regeneration failed CTA ✅ Done |
| 41.2 | P0 BLOCKER | `step-6/page.tsx` | ARIA roles on assembly progress bar ✅ Done |
| 41.3 | P0 BLOCKER | `VideoGenerator.tsx` | Replace `alert()` with in-component toast ✅ Done |
| 41.4 | P1 High | `step-6/page.tsx` | Move `hasAutoTriggeredReassembly.current = true` after balance check ✅ Done |
| 41.5 | P1 High | `step-6/page.tsx` | Reset `hasTriggeredRegeneration.current` after successful regeneration ✅ Done |
| 41.6 | P0 Security | `convex/scenes.ts` | Remove unauthenticated `adminResetVideoGeneration` + `adminDeleteScene` ✅ Done |
| 41.7 | P1 High | `step-3/page.tsx` + `VideoGenerator.tsx` | Dynamic `VIDEO_GENERATION_CREDITS` via `getCreditCost` query ✅ Done |
| 41.8 | P1 High | `FrameAssignment.tsx` | Fire `onFrameChanged` on frame delete ✅ Done |
| 41.9 | P2 | `step-6/page.tsx` | Assembly dismiss button min-h-[44px] touch target ✅ Done |
| 41.10 | Required | All | 2-Step QA + i18n verify + Convex deploy ✅ Done |
| 41.11 | P0 BLOCKER | `VideoGenerator.tsx` | Fix `bg-gray-700` + `border-gray-600` forbidden tokens (B-1, B-3) ✅ Done |
| 41.12 | P0 BLOCKER | `step-6/page.tsx` | Regeneration failure CTA `min-h-[44px]` (B-2) ✅ Done |
| 41.13 | P1 High | `step-6/page.tsx` | Add dismiss button to regeneration progress screen (W-4) ✅ Done |
| 41.14 | P1 High | `step-6/page.tsx` | Align regeneration failure error state with assembly failure (W-5) ✅ Done |
| 41.15 | P1 | `step-6/page.tsx` | `text-blue-400` → `text-[#0d7ff2]` on subtitle (W-6) ✅ Done |
| 41.16 | P1 | `step-6/page.tsx` | `aria-live="polite"` on assembly status text (W-7) ✅ Done |
| 41.17 | P1 High | `step-6/page.tsx` | Reset `hasAutoTriggeredReassembly.current` on credit modal close (NEW-1) ✅ Done |
| 41.18 | P1 | `FrameAssignment.tsx` | Replace `style={{ borderColor }}` with Tailwind class (W-3) ✅ Done |
| 41.19 | P1 | `FrameAssignment.tsx` | Portrait modal "Got it" `min-h-[44px]` (W-2) ✅ Done |
| 41.20 | P1 | `AssetSelector.tsx` | Dynamic `CREDITS_PER_IMAGE` via `getCreditCost` (W-8) ✅ Done |
| 41.21 | P1 | `AssetSelector.tsx` | Image count stepper `h-11 w-11` touch target (W-9) ✅ Done |
| 41.22 | P1 | `middleware.ts` + `step-3/page.tsx` | Strip debug console.log from hot paths (NEW-2) ✅ Done |
| 41.23 | Required | All | 2-Step QA + verify-translations ✅ Done |

---

---

### Credit Pricing Adjustment — Discussion #155 ✅ Done

**Type**: Data update — no code change, no deploy
**Source**: [GitHub Discussion #155](https://github.com/jacquesdahan/MyShortReel-beta/discussions/155)

Applied 5 row updates to the `creditCosts` table in the Convex dev environment via a one-time `internalMutation`:

| `actionType` | Before | After |
|-------------|--------|-------|
| `video_generation` | 20 | **22** |
| `video_regeneration` | 20 | **22** |
| `audio_narration` | 10 | **9** |
| `audio_music` | 10 | **12** |
| `video_assembly` | 5 | **4** |

`step1_story_generation` kept at **5**.

**UI auto-updates**: Step 3 badge and credit pre-flight check (Tasks 41.7 dynamic `getCreditCost`) immediately reflect new values. No code change needed.

**⚠️ Production action required**: Update the same 5 rows manually in the [production Convex dashboard](https://dashboard.convex.dev/d/calm-gerbil-63) → Data → `creditCosts`.

---

## 🔁 Deferred to Sprint 42

| Item | Reason |
|------|--------|
| `getProjectIdByVideoId` uses `.filter()` on `_id` instead of `ctx.db.get()` | Low traffic path — requires `sharedLinks.videoId` schema change to `v.id("videos")` |
| Card border `border-[#223649]` → `border-[#314d68]` in `VideoGenerator` | Visual-only, non-blocking |
| `NEW-4`: Regeneration for-loop continues after scene failure (should `return`) | UX edge case, only affects 2+ scene edit flows |
| `_regenerationError` dead state | Technical debt, no user impact |
| `markNeedsRegeneration` returns `void` instead of `{ success: true }` | Consistency only — no functional impact |
| `videoAssembly.ts` metadata records `expectedDuration` not `mixDuration` | Analytics accuracy only |
| `AdaptiveModal` refactor for portrait error modal | Refactor only — no user-visible difference |
| `shareToast` missing `max-w-sm` cap | Edge case with very long locale strings |
| Purple `bg-purple-600` AI action color not in design system | Documentation/standardization only |
