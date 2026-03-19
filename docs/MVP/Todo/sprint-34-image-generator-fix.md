# 🔧 Sprint 34: Image Generator — Deep Fix & Full Model Parity

**Date**: March 1, 2026  
**Branch**: `sprint-34-Image-generator-improvement`  
**Status**: ✅ COMPLETE — All 10 tasks implemented + test suite green (23/23) ✅  
**Estimated Time**: ~12 hours  
**Goal**: Fix all critical, high, and medium bugs identified by the deep architectural review. Make **all 9 models** fully functional with correct credits, UI, and API calls. Leverage every model capability in the UI.  
**Dependencies**: Sprint 30/30b/30c/30d/30d.5/30e (all complete) ✅  
**Analysis**: [IMAGE-MODELS-ANALYSIS.md](../../Analysis/image-generator/IMAGE-MODELS-ANALYSIS.md) · [adding-a-new-image-model.md](../../Guides/adding-a-new-image-model.md)  
**QA Strategy**: **2-Step QA** — (1) TypeScript `npx tsc --noEmit`, (2) Biome `npx biome check --write <files>` for every task. Convex tasks add `npx convex dev --once`.

---

## 🔍 Deep Review Findings

Two parallel agent reviews (Convex Master + Frontend Explorer) identified the following issues.

---

## 🚨 CRITICAL BUGS (Ship Blockers)

### BUG C1 — Credit check uses hardcoded generic action types → ALL generations blocked or show 0c

**File**: `components/image-generator/index.tsx`, lines 164–167  
**Root Cause**: `useHasEnoughCredits("image_generation")` and `useCreditCost("image_generation")` reference the old pre-Sprint-30d.5 action types. The seed only has **per-model** action types (`image_generation_kling_v3`, `image_generation_grok_t2i`, etc.). The generic `"image_generation"` and `"image_edit"` strings **no longer exist in `creditCosts`**.  
**Consequence**:
- If legacy rows were never deleted: all models show the wrong cost (5c flat regardless of model)
- If legacy rows were deleted: `hasEnough` always `false` → every click shows "Insufficient Credits" modal; `creditCost` returns `null` → button shows `0c`
- **All 9 models are either blocked or showing wrong cost**

```typescript
// ❌ CURRENT — hardcoded stale action types
const credsT2I = useHasEnoughCredits(clerkUserId, "image_generation");
const credsI2I = useHasEnoughCredits(clerkUserId, "image_edit");
const costT2I = useCreditCost("image_generation");
const costI2I = useCreditCost("image_edit");
```

---

### BUG C2 — I2I `editRefs` NEVER passed to `startGenericGeneration` → all Edit mode models broken

**File**: `components/image-generator/index.tsx`, lines 248–252  
**Root Cause**: `onStartT2I` builds `body.image_url`/`body.image_urls` from the legacy `image1Url`/`image2Url` slots (from `useImageUpload`). The `editRefs: RefItem[]` state (line 59) — which is what `RefsPanel` writes to — is **completely disconnected** from the generation call.  
**Consequence**:
- User uploads images in Edit mode → `editRefs` is populated
- `image1Url` / `image2Url` remain empty (user never touched legacy slots)
- `body` has no `image_url` / `image_urls`
- FAL call has no input image → API rejects or produces T2I output
- **All 4 I2I models broken**: Kling v3 I2I, Kling O3 I2I, Grok I2I, Nano Banana Pro I2I

```typescript
// ❌ CURRENT — reads legacy slots, ignores editRefs
if (isI2IMode) {
    if (image1Url && !image2Url) body.image_url = image1Url;
    if (image1Url && image2Url) body.image_urls = [image1Url, image2Url];
}
// editRefs is NEVER used
```

---

## 🔴 HIGH BUGS

### BUG H1 — `type` field missing from `ModelSchema` → fragile string matching used everywhere

**File**: `components/image-generator/types/schema.ts` + `use-convex-schemas.ts`, line 62–95  
**Root Cause**: `ConvexImageModelSchema` has `type: "t2i" | "i2i"` but `toModelSchema()` drops it. `ModelSchema` interface has no `type` field.  
**Consequence**:
- `index.tsx` line 223: `isI2IMode = selectedSchema?.creditActionType?.includes("edit")` — fragile
- `index.tsx` line 1073: `schema.modelId.includes("image-to-image") || schema.modelId.includes("/edit")` for model type detection — will break for future models
- Any new I2I model not matching these string patterns would be treated as T2I

### BUG H2 — `canGenerate` ignores `editRefs` → I2I Generate button enabled with no images

**File**: `components/image-generator/index.tsx`, lines 332–336  
**Root Cause**: `canGenerate` checks `image1Url` (legacy slot) not `editRefs`. In Edit mode with an I2I schema, user can click Generate with no refs uploaded — silently generates with no input image.

### BUG H3 — `isActive` not checked in `startGenericGeneration`

**File**: `convex/imageTool.ts`, ~line 164  
**Root Cause**: Schema lookup via `by_model_id` index retrieves row regardless of `isActive`. A disabled model still deducts credits and schedules the action.

### BUG H4 — `QueueStatus` type missing `"FAILED"` → failed jobs require unsafe cast

**File**: `convex/actions/imageToolGeneric.ts`, line 21–22  
**Root Cause**: `type QueueStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED"` — missing `"FAILED"`. Line 218 uses `(statusData as { status?: string }).status === "FAILED"` to work around missing type. If refactored away, FAILED jobs silently timeout.

### BUG H5 — `seedAll` and `clearAll` are public mutations (security)

**File**: `convex/seed/seedImageModels.ts`, lines ~919 and ~989  
**Root Cause**: Both are `mutation` not `internalMutation`. Any authenticated user can call `api.seed.seedImageModels.seedAll` to overwrite all model schemas, or `clearAll` to delete them all — breaking the generator for all users.

---

## 🟡 MEDIUM ISSUES

### BUG M1 — `revised_prompt` (Grok) and `description` (Nano Banana) silently discarded

**File**: `convex/actions/imageToolGeneric.ts`, line 36–38  
**Root Cause**: `FalImageResult` interface only has `images?: ImageResult[]`. Grok models return `revised_prompt` (string); Nano Banana models return `description` (string). Neither is stored in `imageToolHistory.metadata`.  
**Consequence**: Users never see Grok's enhanced prompt or Nano Banana's image description. These are key differentiating features of these models.

### BUG M2 — `negative_prompt` not stored in history metadata

**File**: `convex/actions/imageToolGeneric.ts`, line 210–213  
**Root Cause**: `metadata` object only stores `num_images` and `series_amount`. `negative_prompt` (used for Kling v3 T2I) is not persisted.

### BUG M3 — `result_type` not in pill bar for Kling O3 models

**File**: `components/image-generator/PromptPillBar.tsx`, lines 49–53  
**Root Cause**: `PRIMARY_PARAM_KEYS = ["aspect_ratio", "resolution", "num_images"]` — `result_type` is not included. For Kling O3 T2I and O3 I2I, the core toggle between single and series output requires opening the FloatingOptionsPanel.

### BUG M4 — `enable_web_search` toggle shows no cost hint (+$0.015)

**File**: `components/image-generator/DynamicField.tsx`, toggle case  
**Root Cause**: `ParamSchema` has no `costHint` field. The toggle renders a plain label + switch with no annotation. Affects: Nano Banana Pro T2I, Nano Banana Pro I2I, Nano Banana 2 T2I.

### BUG M5 — `ModelSelector` / `ModelCard` never show per-model credit cost

**File**: `components/image-generator/index.tsx`, `ModelSelector` usage  
**Root Cause**: `ModelSelector` accepts `creditCosts?: Record<string, number>` but it is never populated and passed. `ModelCard` renders nothing for cost.

### BUG M6 — `schema_option_0_5k` i18n key may be missing

**File**: `messages/en.json` — needs verification  
**Root Cause**: `nano-banana-2-t2i` schema uses `label: "schema_option_0_5k"` for 0.5K resolution. If this key is missing from the `image_generator` namespace, the segmented control shows the raw key string.

### BUG M7 — Elements UI is a stub — Kling elements feature non-functional

**File**: `components/image-generator/RefsPanel.tsx`, ~line 342  
**Root Cause**: The Elements section only renders a 2-line text hint ("Use @Element1, @Element2 in prompt"). There are no input fields for `frontal_image_url` or `reference_image_urls`. `onStartT2I` never collects or sends `elements` state.  
**Affected models**: Kling v3 T2I, Kling v3 I2I, Kling O3 T2I, Kling O3 I2I.  
**Note**: This is a complex feature — deprioritize behind C1/C2/H series fixes.

---

## ✅ What's Working Correctly

- **9 models seeded** in `imageModelSchemas` with correct `allowedParams`, `conditionalParams`, `maxPromptLength`
- **Credit costs seeded** correctly for all 9 models in `creditCosts`
- **Backend `allowedParams` filtering** — strips invalid params before FAL call
- **Backend `conditionalParams`** — correctly handles O3 `result_type` → `num_images` / `series_amount`
- **Backend `maxPromptLength` truncation** — per-model prompt cap applied
- **Backend URL construction** — `https://queue.fal.run/{modelId}` correct for all 9 models
- **`image_url` in `grok-i2i` allowedParams** ✅
- **`image_urls` in `nano-banana-pro-i2i` allowedParams** ✅
- **Schema loading** — `useConvexSchemas` correctly fetches both T2I and I2I lists
- **`startGenericGeneration` passes `selectedSchema.modelId`** (the FAL path) — correct
- **ModelSelector shows all 9 models** — no filter/limit in ModelGrid
- **`showWhen` conditional visibility** in OptionsPanel and PromptPillBar — O3 result_type works
- **RefsPanel multi-slot count** — `MAX_MULTI_REFS = 10` for O3 I2I / Nano Banana I2I (UI correct; broken by C2)
- **Grok I2I aspect_ratio** correctly absent from schema and UI
- **Nano Banana 2 `0.5K`** resolution in schema with `RESOLUTION_0_5K_1K_2K_4K` array
- **"Use as Input"** — strips `-t2i` suffix to find matching I2I schema
- **Credit deduction before scheduling** (correct ordering in mutation)
- **Refund on ALL failure paths** (8 distinct paths covered in action)

---

## 🗺️ Sprint 34 Tasks

### ✅ Task 34.1 — Fix Credit Check (CRITICAL 1) — 30 min

**Objective**: Use per-model `creditActionType` for credit checks and cost display.

**Files**:
- `components/image-generator/index.tsx`

**Implementation**:

Replace the 4 hardcoded hooks with dynamic per-model lookups. Since React hooks can't be called conditionally, use a blank string as fallback when no schema is selected:

```typescript
// Remove lines 164–167 (4 hardcoded hooks):
// const credsT2I = useHasEnoughCredits(clerkUserId, "image_generation");
// const credsI2I = useHasEnoughCredits(clerkUserId, "image_edit");
// const costT2I = useCreditCost("image_generation");
// const costI2I = useCreditCost("image_edit");

// Add AFTER selectedSchema is derived (line ~205), BEFORE onStartT2I:
const currentCreditActionType = selectedSchema?.creditActionType ?? "";
const creditCheck = useHasEnoughCredits(clerkUserId, currentCreditActionType);
const creditCostData = useCreditCost(currentCreditActionType);
```

Then replace lines 221–227 (isI2IMode + hasEnough + required + balance + creditCost) with:
```typescript
const isI2IMode = selectedSchema?.type === "i2i"; // After Task 34.2
const hasEnough = creditCheck.hasEnough;
const required = creditCheck.required;
const balance = creditCheck.balance;
const creditCost = creditCostData.cost;
```

**Note**: This task DEPENDS on Task 34.2 (add `type` to `ModelSchema`) for the `isI2IMode` line. Do Task 34.2 first, or use the temporary `creditActionType?.includes("edit")` fallback initially and update after 34.2.

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/image-generator/index.tsx
```

---

### ✅ Task 34.2 — Add `type` to ModelSchema (HIGH 1) — 20 min

**Objective**: Add `type: "t2i" | "i2i"` to `ModelSchema` interface and populate it in `toModelSchema()`. Replace all fragile string-based type detection.

**Files**:
- `components/image-generator/types/schema.ts`
- `components/image-generator/hooks/use-convex-schemas.ts`
- `components/image-generator/index.tsx` (update `isI2IMode` and model type detection)

**Implementation**:

1. In `schema.ts`, add `type: "t2i" | "i2i"` field to `ModelSchema` interface (after `modelId`).

2. In `use-convex-schemas.ts`, `toModelSchema()` function: add `type: convex.type,` to the returned object.

3. In `index.tsx`:
   - Line 223: replace `selectedSchema?.creditActionType?.includes("edit") ?? false` with `selectedSchema?.type === "i2i" ?? false`
   - Line ~1073 (onSelectSchema): replace `schema.modelId.includes("image-to-image") || schema.modelId.includes("/edit")` with `schema.type === "i2i"`

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/image-generator/types/schema.ts components/image-generator/hooks/use-convex-schemas.ts components/image-generator/index.tsx
```

---

### ✅ Task 34.3 — Wire `editRefs` to generation (CRITICAL 2) — 45 min

**Objective**: Pass `editRefs` into `onStartT2I` / `onStartI2I` so all I2I models correctly send images to FAL.

**Files**:
- `components/image-generator/index.tsx`

**Implementation**:

Replace lines 248–252 in `onStartT2I`:

```typescript
// ❌ REMOVE:
if (isI2IMode) {
    if (image1Url && !image2Url) body.image_url = image1Url;
    if (image1Url && image2Url) body.image_urls = [image1Url, image2Url];
}

// ✅ REPLACE WITH — using editRefs (source of truth for RefsPanel):
if (isI2IMode) {
    const refUrls = editRefs.map((r) => r.url).filter(Boolean);
    if (refUrls.length === 1) {
        // Single ref models: Kling v3 I2I, Grok I2I
        body.image_url = refUrls[0];
    } else if (refUrls.length > 1) {
        // Multi-ref models: Kling O3 I2I, Nano Banana Pro I2I
        body.image_urls = refUrls;
    }
}
```

Also add `editRefs` to the `useCallback` dependency array for `onStartT2I`.

**Also fix `canGenerate` (BUG H2)** — find where `canGenerate` is defined (~line 332) and update:
```typescript
// ❌ CURRENT — ignores editRefs
const canGenerate =
    prompt.trim().length > 0 &&
    (currentMode === "text-to-image" || (useUrls ? !!image1Url : !!image1));

// ✅ FIX — check editRefs for I2I schemas
const isI2ISchema = selectedSchema?.type === "i2i";
const hasRefForI2I = !isI2ISchema || editRefs.length > 0;
const canGenerate =
    prompt.trim().length > 0 && hasRefForI2I;
```

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/image-generator/index.tsx
```

---

### ✅ Task 34.4 — Backend hardening: `isActive` check + `QueueStatus` type (HIGH 3 + 4) — 20 min

**Objective**: Prevent disabled models from being used; fix TypeScript type for FAL FAILED status.

**Files**:
- `convex/imageTool.ts`
- `convex/actions/imageToolGeneric.ts`

**Implementation**:

1. In `convex/imageTool.ts`, after schema lookup in `startGenericGeneration`, add:
```typescript
if (!schema.isActive) {
    throw new ConvexError(`Model is not available: ${args.modelId}`);
}
```

2. In `convex/actions/imageToolGeneric.ts`, line 21–22:
```typescript
// ❌ CURRENT
type QueueStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED";

// ✅ FIX
type QueueStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
```

Then line 218: remove the unsafe cast:
```typescript
// ❌ CURRENT
if ((statusData as { status?: string }).status === "FAILED") {

// ✅ FIX
if (statusData.status === "FAILED") {
```

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write convex/imageTool.ts convex/actions/imageToolGeneric.ts
npx convex dev --once
```

---

### ✅ Task 34.5 — Capture model-specific output fields (MEDIUM 1 + 2) — 30 min

**Objective**: Store `revised_prompt` (Grok), `description` (Nano Banana), and `negative_prompt` in history metadata.

**Files**:
- `convex/actions/imageToolGeneric.ts`
- `convex/imageToolHistory.ts` (if `metadata` field needs updating in schema)

**Implementation**:

1. In `convex/actions/imageToolGeneric.ts`, expand `FalImageResult` interface:
```typescript
interface FalImageResult {
    images?: ImageResult[];
    revised_prompt?: string;    // Grok T2I and Edit
    description?: string;       // Nano Banana Pro T2I/Edit and Nano Banana 2
}
```

2. Update the `insertImageToolEntry` call metadata (lines 210–213):
```typescript
metadata: {
    num_images: body.num_images,
    series_amount: body.series_amount,
    negative_prompt: body.negative_prompt ?? undefined,
    revised_prompt: result.revised_prompt ?? undefined,
    description: result.description ?? undefined,
},
```

3. Check `convex/schema.ts` — `imageToolHistory` metadata field. If it's typed as `v.optional(v.any())`, no schema change needed. If it's a specific object, add the new optional fields.

4. **UX**: In the output display (`output-section.tsx` or generation history), if history entry has `metadata.revised_prompt`, show a "Grok enhanced your prompt: ..." note. If `metadata.description`, show a collapsible "Model description" section. (Can be a simple `<p>` in the image overlay for now.)

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write convex/actions/imageToolGeneric.ts convex/imageToolHistory.ts
npx convex dev --once
```

---

### ✅ Task 34.6 — Add `result_type` pill for Kling O3 models (MEDIUM 3) — 20 min

**Objective**: Make `result_type` accessible inline in the PromptPillBar for O3 models.

**File**: `components/image-generator/PromptPillBar.tsx`

**Implementation**:

Add `"result_type"` to the `PRIMARY_PARAM_KEYS` array:
```typescript
// ❌ CURRENT
const PRIMARY_PARAM_KEYS = ["aspect_ratio", "resolution", "num_images"] as const;

// ✅ FIX
const PRIMARY_PARAM_KEYS = ["aspect_ratio", "resolution", "result_type", "num_images"] as const;
```

The `result_type` param for O3 models has control type `"segmented"` with options `[single, series]`. The PromptPillBar already handles segmented params via PillButton. The existing `isParamVisible` check ensures `num_images` correctly hides when `result_type=series` in the pill bar.

**Display hint**: When `result_type` is a pill, ensure it renders with human-readable labels ("Single" / "Series") using the same `translateLabel` function.

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/image-generator/PromptPillBar.tsx
```

---

### ✅ Task 34.7 — Pass credit costs to ModelSelector (MEDIUM 5) — 20 min

**Objective**: Show per-model credit cost on ModelCards in the model selector.

**Files**:
- `components/image-generator/index.tsx`
- `components/image-generator/ModelSelector.tsx` (verify the prop is wired to ModelGrid/ModelCard)

**Implementation**:

In `index.tsx`, before rendering `ModelSelector`, build a credit costs map from all schemas:

```typescript
// Build creditCosts map for ModelSelector
const allSchemas = useMemo(() => [...t2iSchemas, ...i2iSchemas], [t2iSchemas, i2iSchemas]);
```

Then either:
- **Option A**: Pass `allSchemas` to `ModelSelector` and compute cost per schema in `ModelCard` via `useCreditCost(schema.creditActionType)`.
- **Option B**: Query all costs client-side with a batch query (if available) and pass as `Record<string, number>`.

Recommended: Option A (simpler — ModelCard already uses hooks). Add `useCreditCost(schema.creditActionType)` directly in `ModelCard.tsx` and display the result.

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/image-generator/index.tsx components/image-generator/ModelCard.tsx
```

---

### ✅ Task 34.8 — Secure seed mutations (HIGH 5 / Security) — 15 min

**Objective**: Prevent any authenticated user from calling seedAll/clearAll.

**File**: `convex/seed/seedImageModels.ts`

**Implementation**:

Change both mutations from `mutation` to `internalMutation`:
```typescript
import { internalMutation } from "../_generated/server";

export const seedAll = internalMutation({
    args: {},
    handler: async (ctx) => { ... }
});

export const clearAll = internalMutation({
    args: {},
    handler: async (ctx) => { ... }
});
```

After this change, run with: `npx convex run --no-push seed/seedImageModels:seedAll`

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write convex/seed/seedImageModels.ts
npx convex dev --once
```

---

### ✅ Task 34.9 — Verify `schema_option_0_5k` i18n key (MEDIUM 6) — 15 min

**Objective**: Ensure Nano Banana 2's `0.5K` resolution option renders correctly.

**Files**:
- `messages/en.json`

**Implementation**:

1. Check if `schema_option_0_5k` key exists under `image_generator` namespace in `messages/en.json`.
2. If missing, add: `"schema_option_0_5k": "0.5K"` in the schema options section (near `schema_option_1k`, `schema_option_2k`, `schema_option_4k`).
3. Run `pnpm translate` to propagate to other locales.
4. Run `pnpm i18n:verify` to confirm all keys are valid.

**2-Step QA**:
```bash
pnpm translate
pnpm i18n:verify
```

---

### ✅ Task 34.10 — `enable_web_search` cost hint for Nano Banana (MEDIUM 4) — 30 min

**Objective**: Show "+$0.015" or "+X credits" hint next to the `enable_web_search` toggle for Nano Banana models.

**Files**:
- `components/image-generator/types/schema.ts`
- `convex/seed/seedImageModels.ts`
- `components/image-generator/DynamicField.tsx`

**Implementation**:

1. Add optional `costHint` field to `ParamSchema` interface in `schema.ts`:
```typescript
/** Optional cost hint string to show next to the label (e.g. "+$0.015"). */
costHint?: string;
```

2. In `seedImageModels.ts`, for `enable_web_search` param in all 3 Nano Banana models, add:
```typescript
{ key: "enable_web_search", control: "toggle", default: false, label: "schema_label_enable_web_search", costHint: "+$0.015" }
```

3. In `DynamicField.tsx` toggle case, render the hint:
```tsx
<div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2">
        <label className="text-sm font-medium">{label}</label>
        {param.costHint && (
            <span className="text-xs text-muted-foreground">{param.costHint}</span>
        )}
    </div>
    <Switch ... />
</div>
```

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/image-generator/types/schema.ts convex/seed/seedImageModels.ts components/image-generator/DynamicField.tsx
npx convex dev --once
# After deploy, run seed to update:
# npx convex run seed/seedImageModels:seedAll
```

---

## 📊 Task Priority & Status

| # | Task | Bug | Severity | Est. | Status |
|---|------|-----|----------|------|--------|
| 34.1 | Fix credit check | C1 | 🔴 CRITICAL | 30m | ✅ |
| 34.2 | Add `type` to ModelSchema | H1 | 🔴 HIGH | 20m | ✅ |
| 34.3 | Wire editRefs + canGenerate | C2+H2 | 🔴 CRITICAL | 45m | ✅ |
| 34.4 | Backend isActive + QueueStatus | H3+H4 | 🔴 HIGH | 20m | ✅ |
| 34.5 | Capture revised_prompt/description | M1+M2 | 🟡 MEDIUM | 30m | ✅ |
| 34.6 | result_type in pill bar | M3 | 🟡 MEDIUM | 20m | ✅ |
| 34.7 | Credit cost in ModelSelector | M5 | 🟡 MEDIUM | 20m | ✅ |
| 34.8 | Secure seed mutations | H5 | 🔴 HIGH (security) | 15m | ✅ |
| 34.9 | Verify 0.5K i18n key | M6 | 🟡 MEDIUM | 15m | ✅ |
| 34.10 | enable_web_search cost hint | M4 | 🟡 MEDIUM | 30m | ✅ |
| **—** | **TOTAL** | | | **~3.5h** | |

> **Elements UI** (BUG M7) is a major feature (Kling frontal_image_url + reference_image_urls per element) — deferred to Sprint 35. Tracked here for visibility.

---

## 🚀 Execution Order

Run in this order (dependencies):
1. **34.2** (adds `type` field — unblocks 34.1 and 34.3)
2. **34.1** + **34.3** simultaneously (both fix `index.tsx` — coordinate to avoid conflicts; 34.3 also fixes `canGenerate`)
3. **34.4** (Convex backend — independent)
4. **34.8** (Convex seed security — independent)
5. **34.5** (Convex action — independent)
6. **34.6**, **34.7**, **34.9**, **34.10** (UI polish — independent)

---

## ✅ FINAL SPRINT QA

```bash
# 1. Full TypeScript check
npx tsc --noEmit

# 2. Full Biome check
npx biome check --write .

# 3. Deploy to Convex dev
npx convex dev --once

# 4. i18n verification
pnpm i18n:verify

# 5. Test suite
npx vitest run __tests__/components/image-generator/
```

### Test Suite Results (2026-03-01) — **23/23 tests green** ✅

| File | Tests | Status |
|------|-------|--------|
| `schema-validation.test.ts` | 4/4 | ✅ |
| `e2e-model-matrix.test.ts` | 10/10 | ✅ |
| `schema-edge-cases.test.ts` | 3/3 | ✅ |
| `performance-metrics.test.tsx` | 2/2 | ✅ |
| `ui-integration.test.tsx` | 4/4 | ✅ |

**Test fixes applied**:
- `schema-validation.test.ts` — Updated `getT2ISchemas().toHaveLength(4)` → `toHaveLength(5)` (nano-banana-2-t2i is the 5th T2I model)
- `ui-integration.test.tsx` — Added `vi.mock("@/hooks/business-logic/useCredits")` to stub `useCreditCost` (added to `ModelCard` in task 34.7 — requires `ConvexProvider` not available in component tests)
- `ui-integration.test.tsx` — Passed `advancedOnly={false}` to `OptionsPanel` in parameter-dependency test so `num_images` (a primary pill param, excluded by default) is rendered and `showWhen` logic can be verified
- `ui-integration.test.tsx` — Updated test title from "all 8 models" → "all 9 models"

---

## 📁 Files to Modify (Summary)

| File | Tasks | Reason |
|------|-------|--------|
| `components/image-generator/index.tsx` | 34.1, 34.2, 34.3 | Credit check, type detection, editRefs wiring |
| `components/image-generator/types/schema.ts` | 34.2, 34.10 | Add `type` + `costHint` fields |
| `components/image-generator/hooks/use-convex-schemas.ts` | 34.2 | Propagate `type` from Convex |
| `components/image-generator/PromptPillBar.tsx` | 34.6 | Add `result_type` to pill bar |
| `components/image-generator/ModelCard.tsx` | 34.7 | Show credit cost |
| `components/image-generator/DynamicField.tsx` | 34.10 | Render `costHint` for toggles |
| `convex/imageTool.ts` | 34.4 | `isActive` check |
| `convex/actions/imageToolGeneric.ts` | 34.4, 34.5 | `QueueStatus` + capture output fields |
| `convex/imageToolHistory.ts` | 34.5 | Verify metadata schema |
| `convex/seed/seedImageModels.ts` | 34.8, 34.10 | Secure + add costHint |
| `messages/en.json` | 34.9 | Verify `schema_option_0_5k` |

---

## 🎯 Success Metrics

- **All 9 models generate successfully** with correct credit deduction per model
- **All 4 I2I models** send reference images to FAL correctly
- **Credit cost on Generate button** shows per-model cost (4c Grok, 5c Kling, 8c NB2, 15c Nano Banana Pro)
- **Kling O3 T2I/I2I** result_type pill accessible without opening side panel
- **Grok T2I/I2I** revised_prompt stored in history metadata
- **Nano Banana Pro/2 T2I/Edit** description stored in history metadata + enable_web_search shows cost hint
- **Nano Banana 2** 0.5K resolution renders with correct label
- **Model selector cards** display per-model credit cost
- **TypeScript** passes with no errors
- **Biome** passes with no lint/format issues
