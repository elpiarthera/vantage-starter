# Sprint 42 — Post-Launch Cleanup & Technical Debt

**Date**: March 13, 2026
**Branch**: TBD (`sprint-42-post-launch-cleanup`)
**Status**: Planning
**Goal**: Address all items deferred from Sprints 39, 40, and 41. None are launch blockers — all are technical debt, edge-case UX improvements, or analytics/consistency fixes.
**QA Strategy**: **2-Step QA** — (1) TypeScript `npx tsc --noEmit`, (2) Biome `npx biome check --write <files>` for every task.

---

## 🗺️ Sprint 42 Tasks

---

### Task 42.1 — Fix `getProjectIdByVideoId` to use `ctx.db.get()` instead of `.filter()`

**Priority**: P1 — Performance
**Files**: `convex/videos.ts`, `convex/schema.ts` (shared links)

**Problem**: `getProjectIdByVideoId` performs a full table scan of the `videos` table by using `.filter(q => q.eq(q.field("_id"), args.videoId))` instead of the O(1) `ctx.db.get(videoId)`. At low traffic this is acceptable, but as the `videos` table grows (one row per final assembly), performance degrades linearly. The `v.string()` arg also skips Convex's ID format validation.

**Root cause**: The arg was typed as `v.string()` to match how `sharedLinks.videoId` stores the ID (as a string). Fixing this requires coordinating the schema change in `sharedLinks`.

**Fix**:

Step 1 — Update `convex/schema.ts`: Change `sharedLinks.videoId` from `v.string()` to `v.id("videos")`.

Step 2 — Update `convex/videos.ts`:
```diff
  export const getProjectIdByVideoId = query({
-   args: { videoId: v.string() },
-   handler: async (ctx, args) => {
-     const video = await ctx.db
-       .query("videos")
-       .filter((q) => q.eq(q.field("_id"), args.videoId))
-       .first();
+   args: { videoId: v.id("videos") },
+   handler: async (ctx, { videoId }) => {
+     const video = await ctx.db.get(videoId);
      if (!video) return null;
      return { projectId: video.projectId };
  });
```

Step 3 — Update `app/[locale]/shared/[token]/page.tsx` call site to pass the correct `Id<"videos">` type.

**QA**: Run `npx tsc --noEmit` — no type errors. Test shared link flow end-to-end.

---

### Task 42.2 — Fix `NEW-4`: Regeneration for-loop `return` after first scene failure

**Priority**: P1 — UX edge case
**File**: `app/[locale]/guided/step-6/page.tsx`

**Problem**: In `triggerRegeneration()`, when the `catch` block fires for a scene, `setIsRegenerating(false)` is called and the failure UI renders — but the `for` loop continues to the next scene. With 2+ scenes to regenerate, the second scene's credit deduction and `generateVideoAction` fire while the failure screen is showing. This is a race condition that doesn't break the 1-scene happy path (the typical case) but is incorrect behavior.

**Fix**: Add `return;` at the end of the `catch` block to stop loop iteration on first failure:
```diff
      } catch (error) {
        setIsRegenerating(false);
        if (transactionId) await refundCreditsMutation({ transactionId, reason: "regeneration_failed" });
+       return; // Stop processing further scenes after a failure
      }
```

**QA**: With 2 scenes marked `needsRegeneration: true`, mock the first scene's `generateVideoAction` to throw. Verify the second scene does NOT get a credit deduction or generation attempt.

---

### Task 42.3 — Remove `_regenerationError` dead state variable

**Priority**: P3 — Technical debt
**File**: `app/[locale]/guided/step-6/page.tsx`

**Problem**: `const [_regenerationError, setRegenerationError] = useState<string | null>(null)` — `setRegenerationError(null)` is called in the failure CTA's `onClick` but `_regenerationError` is never read. The `_` prefix documents the dead read, but the state itself serves no purpose.

**Fix**: Remove the `useState` declaration and the `setRegenerationError(null)` call in the failure CTA `onClick`.

**QA**: `npx tsc --noEmit` — no errors. `npx biome check --write step-6/page.tsx` — no issues.

---

### Task 42.4 — `markNeedsRegeneration` return value consistency

**Priority**: P3 — Consistency
**File**: `convex/scenes.ts`

**Problem**: Every other mutation in `convex/scenes.ts` returns `{ success: true }`. `markNeedsRegeneration` returns `void` (implicitly). No functional impact — call sites don't use the return value — but inconsistent.

**Fix**: Add `return { success: true };` at the end of the `markNeedsRegeneration` handler, and update the return type annotation.

**QA**: `npx tsc --noEmit`.

---

### Task 42.5 — Fix `videoAssembly.ts` metadata duration recording

**Priority**: P2 — Analytics accuracy
**File**: `convex/actions/videoAssembly.ts`

**Problem**: Line 362 records `duration: expectedDuration` in `videos.metadata`. Since Sprint 39's fix, `mixDuration` (narration-extended) is the actual audio length — but the stored metadata still shows the raw video clip duration. Misleads any analytics queries on `videos.metadata.duration`.

**Fix**:
```diff
- duration: expectedDuration,
+ duration: mixDuration,
```

**QA**: Generate a video where narration is longer than video clips. Verify `videos` document has the correct `metadata.duration` (narration length, not clip length).

---

### Task 42.6 — Refactor portrait error modal to use `AdaptiveModal`

**Priority**: P3 — Consistency
**File**: `components/scene-management/FrameAssignment.tsx`

**Problem**: The portrait image error modal (lines 281–335) manually implements `{isMobile ? <Drawer> : <Dialog>}` — the exact pattern `AdaptiveModal` was built to replace. The adjacent asset-selection modal uses `AdaptiveModal` correctly.

**Fix**: Replace both `Drawer` and `Dialog` blocks with a single `<AdaptiveModal>`:
```tsx
<AdaptiveModal
  isOpen={showPortraitError}
  onClose={() => setShowPortraitError(false)}
  title={t("portrait_image_title")}
  description={t("portrait_image_description")}
>
  <div className="flex flex-col items-center gap-6 pb-4">
    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
      <AlertTriangle className="w-8 h-8 text-amber-500" />
    </div>
    <Button
      onClick={() => setShowPortraitError(false)}
      className="w-full bg-[#314d68] hover:bg-[#3d5f7d] text-white border-0 min-h-[44px]"
    >
      {t("portrait_image_cta")}
    </Button>
  </div>
</AdaptiveModal>
```

Remove the `isMobile` check in this component (only used for the portrait modal). Remove `Drawer`, `DrawerContent`, etc. imports if no longer needed.

**QA**: Test portrait rejection modal on mobile (Drawer) and desktop (Dialog). Verify dark theme, touch target, and close behavior all work.

---

### Task 42.7 — Document AI action purple color as design system token

**Priority**: P3 — Design system
**File**: `app/globals.css` or design system documentation

**Problem**: `bg-purple-600`/`bg-purple-700` appear on AI-specific action buttons throughout `AssetSelector` (Generate, Transform, Regenerate AI) as a visual distinction from primary blue CTAs. This pattern is intentional but undocumented.

**Fix**: Add a CSS custom property to `globals.css`:
```css
:root {
  --ai-action: #9333ea;        /* purple-600 */
  --ai-action-hover: #7e22ce;  /* purple-700 */
}
```

Update `AssetSelector.tsx` AI buttons to use `bg-[--ai-action] hover:bg-[--ai-action-hover]`.

**QA**: Visual check that AI action buttons remain purple after token change.

---

### Task 42.8 — Add `max-w-sm` cap to `shareToast` in `step-6/page.tsx`

**Priority**: P3 — Edge case
**File**: `app/[locale]/guided/step-6/page.tsx`

**Problem**: The `VideoGenerator` toast (line 638) has `max-w-sm` to prevent overflow on long messages. The Step 6 `shareToast` does not. Long locale translations could overflow.

**Fix**:
```diff
- <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
+ <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm">
```

---

## 📋 Summary Table

| Task | Severity | File | Description |
|------|----------|------|-------------|
| 42.1 | P1 Performance | `convex/videos.ts` + `schema.ts` | `getProjectIdByVideoId` → `ctx.db.get()` + `v.id("videos")` |
| 42.2 | P1 UX edge case | `step-6/page.tsx` | Regeneration for-loop: `return` after first scene failure |
| 42.3 | P3 Tech debt | `step-6/page.tsx` | Remove `_regenerationError` dead state |
| 42.4 | P3 Consistency | `convex/scenes.ts` | `markNeedsRegeneration` return `{ success: true }` |
| 42.5 | P2 Analytics | `videoAssembly.ts` | Record `mixDuration` not `expectedDuration` in metadata |
| 42.6 | P3 Consistency | `FrameAssignment.tsx` | Refactor portrait modal to use `AdaptiveModal` |
| 42.7 | P3 Design | `globals.css` | Document AI purple as `--ai-action` CSS token |
| 42.8 | P3 Edge case | `step-6/page.tsx` | `shareToast` `max-w-sm` cap |
