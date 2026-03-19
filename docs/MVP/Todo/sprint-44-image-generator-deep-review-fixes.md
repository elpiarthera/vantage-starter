# Sprint 44: Image Generator Deep Review Fixes

**Date**: March 13, 2026
**Branch**: `sprint-38-image-generator-responsive-fix` (current working branch)
**Status**: ✅ Complete — All 10 tasks implemented, TypeScript clean (exit 0), Biome clean, Convex deployed
**Goal**: Address all issues identified by the three-agent deep review (design-master + convex-master + mobile-first-guardian) of `components/image-generator/` and `app/[locale]/tools/image-generator/`. All fixes are production-required.
**QA Strategy**: **2-Step QA** — (1) TypeScript `npx tsc --noEmit`, (2) Biome `npx biome check --write <files>` for every task.

---

## 🔍 Review Origin

All items come from the three-agent review run on March 13, 2026:
- **design-master**: Design system compliance, semantic tokens, i18n, accessibility
- **convex-master**: Backend security, data integrity, Convex best practices
- **mobile-first-guardian**: WCAG AA compliance, touch targets, ARIA, iOS quirks

---

## 🗺️ Sprint 44 Tasks

---

### Task 44.1 — CRITICAL: Backend security — `deductCredits` / `refundCredits` are public mutations

**Priority**: P0 — SECURITY BLOCKER
**Files**: `convex/credits.ts`, `convex/actions/imageToolGeneric.ts`, all callers

**Problem**:
- `deductCredits` is a public `mutation()` that accepts `clerkUserId` as an arg — any authenticated user can call it from the browser and deduct credits from **any other user's account**.
- `refundCredits` is a public `mutation()` that accepts a `transactionId` with no ownership check — any user who knows a valid transaction ID can trigger a refund.
- `imageToolGeneric.ts` calls `api.credits.refundCredits` (public surface) from an internal action — should use `internal.credits.refundCredits`.

**Fix**:
1. Convert `deductCredits` to `internalMutation` in `convex/credits.ts`
2. Convert `refundCredits` to `internalMutation` in `convex/credits.ts`
3. Update all callers that used `api.credits.deductCredits` / `api.credits.refundCredits` to use `internal.credits.*` — check `imageToolGeneric.ts` (~9 refund calls), `imageTool.ts`, and any other action files.
4. Re-run `npx convex dev --once` to regenerate `_generated/api.ts`

**QA**: `npx tsc --noEmit` must pass. Verify a generation succeeds end-to-end in browser — credits deducted, action runs, history entry appears.

---

### Task 44.2 — CRITICAL: Backend data integrity — `deductCreditsForVideo` missing fields + `refundCredits` idempotency no-op

**Priority**: P0 — DATA INTEGRITY
**File**: `convex/credits.ts`

**Problem A — `deductCreditsForVideo` data corruption**:
The helper function patches `userCredits.balance` but never increments `totalUsed` or sets `updatedAt`. Video credit deductions are invisible in lifetime usage stats.

**Fix A** — in `deductCreditsForVideo`, update the `ctx.db.patch` call:
```diff
 await ctx.db.patch(userCredits._id, {
   balance: userCredits.balance - scaledCost,
+  totalUsed: (userCredits.totalUsed ?? 0) + scaledCost,
+  updatedAt: Date.now(),
 });
```

**Problem B — `refundCredits` idempotency is a no-op**:
The double-refund guard uses `q.field("metadata.originalTransactionId")` in a Convex filter expression. Nested dot-notation paths in `q.field()` are not supported — it always evaluates to `undefined`, making the idempotency check silently skip, allowing double-refunds on network retries.

The schema already has `originalTransactionId: v.optional(v.id("creditTransactions"))` as a top-level field on `creditTransactions`, and `refundVideoCredits` already uses it correctly. The fix is to align `refundCredits` to store and query `originalTransactionId` as a top-level field.

**Fix B**:
1. In `refundCredits`, store `originalTransactionId: transactionId` as a top-level field (not inside `metadata`) when creating the refund transaction.
2. Change the idempotency check to use the existing field properly:
```typescript
const existingRefund = await ctx.db
  .query("creditTransactions")
  .filter((q) => q.eq(q.field("originalTransactionId"), transactionId))
  .first();
if (existingRefund) return { success: true, alreadyRefunded: true };
```
3. Optionally add `.index("by_original_transaction", ["originalTransactionId"])` to `creditTransactions` in `schema.ts` for performance (the table is small so filter is acceptable for now).

**QA**: `npx tsc --noEmit`. Trigger a generation failure and verify the refund transaction appears once (not duplicated) in the `creditTransactions` table in Convex dev.

---

### Task 44.3 — WARNINGS: Backend reliability — isGenerating stuck state + getProjectImages auth + imageModels internalQuery + redundant sort + N+1

**Priority**: P1 — WARNINGS
**Files**: `components/image-generator/index.tsx`, `convex/imageToolHistory.ts`, `convex/imageModels.ts`, `convex/credits.ts`

**Problem A — `isGenerating` stuck state**:
If `generateGeneric` action fails (FAL error, timeout, refund issued), no history entry is written. The client resets `isGenerating` only when a new history entry appears. The button stays in a permanent loading state until page refresh.

**Fix A** — add a 3-minute client-side safety timeout in `index.tsx`:
```typescript
useEffect(() => {
  if (!isGenerating) return;
  const timeout = setTimeout(() => {
    setIsGenerating(false);
  }, 3 * 60 * 1000); // 3 minute safety net
  return () => clearTimeout(timeout);
}, [isGenerating]);
```

**Problem B — `getProjectImages` throws on unauthenticated**:
`convex/imageToolHistory.ts` `getProjectImages` throws `"Not authenticated"` — inconsistent with `listByUser` which returns `[]`. In reactive context, a thrown error causes an uncaught promise rejection.

**Fix B** — in `getProjectImages`, replace `throw new Error("Not authenticated")` with `return []`.

**Problem C — `imageModels.getByModelId` is public but called from internal action**:
`imageToolGeneric.ts` calls `api.imageModels.getByModelId` (public surface), exposing internal schema config to clients.

**Fix C** — add `internalQuery` export to `convex/imageModels.ts`:
```typescript
export const getByModelIdInternal = internalQuery({
  args: { modelId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("imageModelSchemas")
      .withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
      .first();
  },
});
```
Update `imageToolGeneric.ts` to call `internal.imageModels.getByModelIdInternal`.

**Problem D — Redundant JS sort after indexed query in `imageModels.ts`**:
After `.withIndex("by_type_active")` with equality on both prefix fields, Convex guarantees results are sorted by the 3rd field (`sortOrder`). The `.sort()` is dead code.

**Fix D** — remove the `.sort()` call after `.collect()` in both `listT2ISchemas` and `listI2ISchemas` in `convex/imageModels.ts`, and add a comment explaining the index guarantees order.

**Problem E — `listCreditCostsByTypes` N+1 query pattern**:
One DB query per `actionType` in a loop. For image generator that's potentially 18 sequential queries.

**Fix E** — replace the loop with a single `.collect()` + in-memory filter:
```typescript
const allCosts = await ctx.db.query("creditCosts").collect();
const typesSet = new Set(actionTypes);
return allCosts
  .filter((c) => c.isActive && typesSet.has(c.actionType))
  .map((c) => ({ actionType: c.actionType, credits: c.credits }));
```

**QA**: `npx tsc --noEmit`. Verify in Convex dev dashboard function logs — no "Not authenticated" errors from `getProjectImages`.

---

### Task 44.4 — CRITICAL: `progress-bar.tsx` — Full redesign (touch target + ARIA + semantic tokens + i18n)

**Priority**: P0 — WCAG AA violation
**File**: `components/image-generator/progress-bar.tsx`

**Problems**:
1. Cancel button `h-7` (28px) — WCAG requires ≥44px touch target
2. `bg-black/50`, `border-gray-600`, `text-white/80`, `text-white`, `bg-gray-700` — all hardcoded colors
3. `"Converting HEIC image..."`, `"Running..."`, `"Cancel"` — hardcoded English strings
4. No `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` on the track div

**Fix**:
1. Add i18n props to the `ProgressBarProps` interface: `cancelLabel`, `convertingLabel`, `runningLabel`
2. Add `role="progressbar"` + ARIA value attrs to the track `<div>`
3. Replace `h-7` → `min-h-[44px]` on the Cancel button
4. Replace all hardcoded color classes with semantic tokens:
   - `bg-black/50` → `bg-background/50`
   - `border-gray-600` → `border-border`
   - `text-white/80` → `text-foreground/80`
   - `text-white` → `text-foreground`
   - `hover:bg-gray-700` → `hover:bg-muted`
5. Replace hardcoded strings with props
6. Update `index.tsx` where `ProgressBar` is rendered (search for `<ProgressBar`) to pass the 3 translated strings via `t()`
7. Add i18n keys to `messages/en.json` under `image_generator`: `progress_running`, `progress_converting`, `progress_cancel` (if not already present)
8. Run `pnpm translate` to propagate to all locales

**QA**: `npx tsc --noEmit`, `npx biome check --write components/image-generator/progress-bar.tsx`.

---

### Task 44.5 — CRITICAL: `toast-notification.tsx` — `role="alert"` + semantic colors

**Priority**: P0 — Accessibility (toasts are silent to screen readers)
**File**: `components/image-generator/toast-notification.tsx`

**Problems**:
1. No `role="alert"` / `aria-live` — screen readers never announce success/error messages
2. `bg-black/90` — hardcoded
3. `border-green-500/50 text-green-100` / `border-gray-500/50 text-gray-100` — hardcoded brand colors
4. `text-green-400` / `text-gray-400` on icons — hardcoded
5. Icons missing `aria-hidden="true"`

**Fix**:
```tsx
// Outer wrapper — add role + aria-live:
<div
  role="alert"
  aria-live={type === "error" ? "assertive" : "polite"}
  aria-atomic="true"
  className={cn(
    "rounded-lg bg-card backdrop-blur-sm border p-4 shadow-lg max-w-sm",
    type === "success" ? "border-primary/50" : "border-destructive/50",
  )}
>
// Icons:
<CheckCircle className="w-5 h-5 text-primary flex-shrink-0" aria-hidden="true" />
<AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" aria-hidden="true" />
// Text:
<p className="text-sm font-medium text-foreground">{message}</p>
```

**QA**: `npx tsc --noEmit`, `npx biome check --write components/image-generator/toast-notification.tsx`.

---

### Task 44.6 — CRITICAL: `generation-history.tsx` — Delete buttons + colors + ARIA

**Priority**: P0 — WCAG AA (32px touch target) + hardcoded colors
**File**: `components/image-generator/generation-history.tsx`

**Problems**:
1. Both delete buttons (line 197 error-state, line 230 success-state) have `min-h-[32px] min-w-[32px]` — WCAG requires ≥44px
2. Both use `bg-black/70 hover:bg-white text-white hover:text-black` — hardcoded colors
3. Success-state delete (line 230) has `opacity-0 group-hover:opacity-100` — invisible on touch devices (no hover)
4. Loading thumbnail `text-white/90` (line 158) — hardcoded
5. Load More button `aria-label="Load more generations"` (line 282) — hardcoded English (should use `loadMoreLabel` prop)
6. Generation thumbnail `aria-label={\`Generation ${index + 1}\`}` (line 154) — non-descriptive
7. `sr-only` "Generation failed" (line 191) — hardcoded English

**Fix**:
1. Both delete buttons: use offset-positioning technique (same as `RefsPanel`'s remove button):
   ```tsx
   className="absolute top-0 right-0 flex items-center justify-center min-h-[44px] min-w-[44px] translate-x-1/4 -translate-y-1/4 rounded-bl bg-background/70 hover:bg-destructive text-foreground hover:text-destructive-foreground transition-smooth disabled:opacity-50 z-10"
   ```
   For the success-state button: add `active:opacity-100` alongside `group-hover:opacity-100` (ensures it's reachable on touch).
2. Loading `text-white/90` → `text-foreground/90`
3. Load More `aria-label` → `aria-label={loadMoreLabel}`
4. Generation thumbnail aria-label: `aria-label={`Generation ${index + 1}${gen.prompt ? `: ${gen.prompt.slice(0, 60)}` : ""}`}`
5. Add `failedLabel` prop to the component (alongside existing `cancelLabel`, `loadMoreLabel`, etc.) — pass from `index.tsx` via `t("generation_failed")` — add the i18n key if missing.

**QA**: `npx tsc --noEmit`, `npx biome check --write components/image-generator/generation-history.tsx`.

---

### Task 44.7 — CRITICAL: `image-upload-box.tsx` + `global-drop-zone.tsx` — touch targets + colors + i18n

**Priority**: P0 — WCAG AA (clear button ~20px) + i18n
**Files**: `components/image-generator/image-upload-box.tsx`, `components/image-generator/global-drop-zone.tsx`

**`image-upload-box.tsx` Problems**:
1. Clear button `p-1 sm:p-1.5` with `w-3 h-3` icon = ~20px total — WCAG violation
2. `border-gray-600 hover:border-white bg-black/30` — hardcoded outer button
3. `bg-black/90 hover:bg-white/90 text-white hover:text-black border-white/40` — hardcoded clear button
4. `text-gray-300` on empty state icon container — hardcoded
5. `"Upload Image"` / `"Second Image"` / `"(or drag & drop)"` — hardcoded English strings
6. `text-gray-500` — hardcoded

**Fix `image-upload-box.tsx`**:
1. Clear button — use offset-positioning for 44px hit area:
   ```tsx
   className="absolute top-0 right-0 z-10 flex items-center justify-center min-h-[44px] min-w-[44px] translate-x-1/4 -translate-y-1/4 rounded-bl bg-background/80 hover:bg-destructive text-foreground hover:text-destructive-foreground transition-smooth shadow-lg border border-border/40"
   ```
2. Outer button: `border-gray-600` → `border-border`, `hover:border-white` → `hover:border-primary`, `bg-black/30` → `bg-background/30`
3. `text-gray-300` → `text-muted-foreground`, `text-gray-500` → `text-muted-foreground`
4. Add `uploadLabel`, `secondImageLabel`, `dragDropLabel` props to the interface, defaulting to the current English strings. Update `index.tsx` to pass translated strings.
5. Add i18n keys to `messages/en.json` under `image_generator`: `upload_image_label`, `second_image_label`, `drag_drop_label`. Run `pnpm translate`.

**`global-drop-zone.tsx` Problems**:
1. `"Input 1"`, `"Drop here for first image"`, `"Input 2"`, `"Drop here for second image"` — 4 hardcoded English strings

**Fix `global-drop-zone.tsx`**:
Add `input1Label`, `input2Label`, `dropFirstLabel`, `dropSecondLabel` props. Update `index.tsx` to pass them via `t()`. Add keys to `messages/en.json`: `drop_zone_input1`, `drop_zone_input2`, `drop_zone_first`, `drop_zone_second`. Run `pnpm translate`.

**QA**: `npx tsc --noEmit`, `npx biome check --write components/image-generator/image-upload-box.tsx components/image-generator/global-drop-zone.tsx`.

---

### Task 44.8 — CRITICAL: Delete `how-it-works-modal.tsx` (dead code)

**Priority**: P0 — Dead code with design system violations
**File**: `components/image-generator/how-it-works-modal.tsx`

**Problem**: `HowItWorksModal` is not imported anywhere in the current codebase. It contains:
- `bg-black/95 border-white/10 text-white` throughout
- All text in hardcoded English, no i18n
- References to "Vercel AI Gateway", "AI_GATEWAY_API_KEY" — outdated architecture
- Teal brand colors (`text-teal-400`, `bg-teal-500/10`) not in the design system

**Fix**: Delete the file. Verify with a codebase grep that `HowItWorksModal` has no imports.

**QA**: `npx tsc --noEmit` after deletion.

---

### Task 44.9 — CRITICAL + WARNINGS: `fullscreen-viewer.tsx` — Focus management + semantic colors + redundant role

**Priority**: P0/P1
**File**: `components/image-generator/fullscreen-viewer.tsx`

**Problems**:
1. Dialog opens without moving keyboard focus — `tabIndex={-1}` set but `.focus()` never called. Keyboard navigation broken, screen reader doesn't announce dialog.
2. `aria-label="Fullscreen image view"` on root dialog div — hardcoded English
3. `bg-black/80 hover:bg-black/90 text-white` on all 3 buttons (close, prev, next) — hardcoded
4. Nav buttons (prev/next) missing `rounded-lg` and use `transition-all duration-200` instead of `transition-smooth`
5. Wrapper `<div>` at line 120 has `role="img" aria-label={t("fullscreen_alt")}` — redundant with the native `<img>` below that has the same `alt`

**Fix**:
1. Add `useRef` + `useEffect` for focus management:
   ```tsx
   const dialogRef = useRef<HTMLDivElement>(null);
   useEffect(() => { dialogRef.current?.focus(); }, []);
   // Add ref={dialogRef} to the outer div
   ```
2. `aria-label="Fullscreen image view"` → `aria-label={t("fullscreen_viewer_aria_label")}` — add key to `messages/en.json`
3. All 3 button `className`: `bg-black/80 hover:bg-black/90 text-white` → `bg-background/80 hover:bg-background/90 text-foreground`
4. Nav buttons: add `rounded-lg` and replace `transition-all duration-200` → `transition-smooth`
5. Remove `role="img"` and `aria-label` from the wrapper div at line 120 (keep them only on the `<img>`)

**QA**: `npx tsc --noEmit`, `npx biome check --write components/image-generator/fullscreen-viewer.tsx`.

---

### Task 44.10 — WARNINGS + NOTES: Miscellaneous UI fixes (8 files)

**Priority**: P1 / NOTES
**Files**: `components/image-generator/RefsPanel.tsx`, `components/image-generator/FloatingPromptBar.tsx`, `components/image-generator/PromptPillBar.tsx`, `components/image-generator/ModelCard.tsx`, `components/image-generator/DynamicField.tsx`, `components/image-generator/output-section.tsx`, `components/image-generator/InspirationEmptyState.tsx`, `components/image-generator/index.tsx`, `app/globals.css`

**Sub-task A — `RefsPanel.tsx` (WARN)**: Lines 91, 98 — `bg-black/70 py-0.5 text-center text-xs font-medium text-white` on label overlay and `bg-black/60 text-white hover:bg-black/80` on drag button — replace with semantic tokens:
- Label overlay: `bg-background/70 text-foreground`
- Drag button: `bg-background/60 text-foreground hover:bg-background/80`
(Remove button already correctly uses `hover:bg-destructive` — keep that)

**Sub-task B — `FloatingPromptBar.tsx` (WARN — WCAG focus visibility)**: Line 92 — `focus:ring-0` fully removes keyboard focus indicator (WCAG 2.1 SC 2.4.11 violation). Fix: remove `focus:ring-0`, add `focus:outline-none` instead. Add `focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/30` to the parent container div for visible focus state.

**Sub-task C — `PromptPillBar.tsx` (WARN)**: Line 158 — Unicode `✓` check mark is unreliable across fonts/platforms. Replace with Lucide `<Check>` icon:
```tsx
import { Check } from "lucide-react";
// ...
{String(value) === option.value && (
  <Check className="size-3 ml-auto text-primary" aria-hidden="true" />
)}
```

**Sub-task D — `ModelCard.tsx` (WARN)**: The card `<button>` has `aria-pressed` but no `aria-label`. Screen readers will read out all card content. Add: `aria-label={schema.name}` (the schema name is already the accessible name for screen readers).

**Sub-task E — `DynamicField.tsx` (WARN — iOS zoom + hardcoded English)**: 
- Lines 121–123 and equivalent increase button: replace hardcoded English fallback with `t("field_decrease", { label })` / `t("field_increase", { label })` always (both namespace branches have the same key so always use `t()`).
- Lines 258, 331 — `SelectTrigger` missing `text-base` → iOS auto-zoom on tap. Add `text-base` to the className on all `SelectTrigger` usages.

**Sub-task F — `output-section.tsx` (NOTE)**: Line 201/202 — empty state icon `<div>` missing `rounded-lg`. Add `rounded-lg`. Also remove the redundant `onKeyDown` handler from the fullscreen `<button>` at ~line 135 (native button handles Enter/Space).

**Sub-task G — `InspirationEmptyState.tsx` (NOTE)**: Decorative `<Sparkles>` icon missing `aria-hidden="true"`. Add it.

**Sub-task H — `index.tsx` (WARN/NOTE)**:
1. Remove the large dead code comment block (lines 368–383, commented-out `useEffect` for API key check).
2. Add `body.style.overflow` unmount cleanup:
   ```tsx
   useEffect(() => {
     return () => { document.body.style.overflow = "unset"; };
   }, []);
   ```

**Sub-task I — `app/globals.css` (WARN — mobile layout overlap)**: Line 42 — `--ig-prompt-bar-min-height: 60px` is too small when pill bar is visible. The actual prompt bar height when a schema is loaded is ~116px (12px top pad + 44px pill row + 8px gap + 44px textarea + 8px inner bottom). Update:
```css
--ig-prompt-bar-min-height: 116px;
```
This adjusts `--ig-mobile-button-offset` upward so floating buttons (History, Refs, Options) no longer sit behind the lower portion of the prompt bar on mobile.

**QA**: `npx tsc --noEmit`, `npx biome check --write` all edited files. After `globals.css` change, verify on mobile viewport (360px) that History/Options/Refs buttons are fully above the prompt bar.

---

## ✅ Completion Checklist

| Task | File(s) | Status |
|------|---------|--------|
| 44.1 | `convex/credits.ts`, `imageToolGeneric.ts`, `voiceTool.ts`, `voiceToolGeneric.ts`, `voiceProcessing.ts`, `videoAssembly.ts`, `imageTool.ts` | ✅ |
| 44.2 | `convex/credits.ts` | ✅ |
| 44.3 | `index.tsx`, `imageToolHistory.ts`, `imageModels.ts`, `credits.ts` | ✅ |
| 44.4 | `progress-bar.tsx`, `output-section.tsx`, `messages/*.json` | ✅ |
| 44.5 | `toast-notification.tsx` | ✅ |
| 44.6 | `generation-history.tsx`, `index.tsx`, `messages/*.json` | ✅ |
| 44.7 | `image-upload-box.tsx`, `global-drop-zone.tsx`, `input-section.tsx`, `index.tsx`, `messages/*.json` | ✅ |
| 44.8 | `how-it-works-modal.tsx` (deleted) | ✅ |
| 44.9 | `fullscreen-viewer.tsx`, `messages/*.json` | ✅ |
| 44.10 | `RefsPanel.tsx`, `FloatingPromptBar.tsx`, `PromptPillBar.tsx`, `ModelCard.tsx`, `DynamicField.tsx`, `output-section.tsx`, `InspirationEmptyState.tsx`, `index.tsx`, `globals.css` | ✅ |
| **API routes** | `app/api/chat/route.ts`, `app/api/step1/generate-story/route.ts`, `app/api/step1/refine-story/route.ts` — missing `clerkUserId`/`actionType` args | ✅ |

**Final QA Gate**: `npx tsc --noEmit` → 0 errors. `npx biome check --write .` → 0 remaining lint issues. `npx convex dev --once` → successful deploy.
