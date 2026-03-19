# 🎬 MyShortReel — Sprint 37: Storyboard Generator → Production

**Created**: March 1, 2026  
**Status**: ✅ IMPLEMENTED — March 1, 2026  
**Goal**: Migrate the Storyboard Generator from demo (Sprint 24) to full production with 5 video models, modular schema-driven architecture, Convex backend, credit system, and canvas-first UI aligned with image/voice generators.  
**Architecture Pattern**: Mirrors `sprint-34-image-generator-fix.md` + `sprint-35/36-voice-generator` exactly.  
**Source Specs**: `docs/Analysis/video-generator/VIDEO-MODELS-ANALYSIS.md`  
**QA Strategy**: TypeScript (noEmit) → Biome → `pnpm i18n:verify` → `npx convex dev --once` + seed → browser test

---

## 📊 Executive Summary

### Current State (Sprint 24 Demo)

| Concern | Status |
|---------|--------|
| UI architecture | ❌ Split-panel wizard, not canvas-first |
| Video models | ❌ Hardcoded `"veo3.1-fast"`, `"wan-2.5"` — non-existent models |
| Backend | ❌ All generation calls commented out |
| Convex integration | ❌ None — no `videoModelSchemas` table |
| Credit system | ❌ Not wired |
| i18n | ❌ Missing all video/storyboard keys |
| Design system | ❌ 7 violations (custom tokens, hardcoded colors, below-44px targets) |
| Mobile | ❌ No mobile-first, no AdaptiveModal, no touch targets |

### Target State (Sprint 37)

| Concern | Target |
|---------|--------|
| UI architecture | ✅ Canvas-first, glassmorphism, z-index layers |
| Video models | ✅ 5 Kling Pro models via `videoModelSchemas` Convex table |
| Backend | ✅ Generic action + scheduler-chained polling (30–120s safe) |
| Convex integration | ✅ `videoModelSchemas`, `videoModels.ts`, `videoTool.ts`, `videoToolGeneric.ts` |
| Credit system | ✅ Duration-scaled deduction, 11 credit action types |
| i18n | ✅ ~74 new keys, all 7 locales via `pnpm translate` |
| Design system | ✅ All violations fixed |
| Mobile | ✅ Scroll-snap timeline, AdaptiveModal, touch-compliant |

### 5 Video Models to Support

| # | Schema ID | FAL Model ID | Type | Key Constraint |
|---|-----------|-------------|------|----------------|
| 1 | `kling-v3-pro-i2v` | `fal-ai/kling-video/v3/pro/image-to-video` | I2V | `start_image_url` required |
| 2 | `kling-o3-pro-i2v` | `fal-ai/kling-video/o3/pro/image-to-video` | I2V | `image_url` required ⚠️ |
| 3 | `kling-o3-pro-r2v` | `fal-ai/kling-video/o3/pro/reference-to-video` | R2V | Nothing required |
| 4 | `kling-o3-pro-v2v-edit` | `fal-ai/kling-video/o3/pro/video-to-video/edit` | V2V | `prompt`+`video_url` required, no duration |
| 5 | `kling-o3-pro-v2v-reference` | `fal-ai/kling-video/o3/pro/video-to-video/reference` | V2V | `prompt`+`video_url` required, `"auto"` aspect ratio |

---

## ⏱️ Time Estimates

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| A | Schema + Convex foundation | 3h |
| B | Backend generic action + polling | 3h |
| C | Seed + credit costs | 1.5h |
| D | i18n keys | 45min |
| E | UI — Canvas layout + new components | 9h |
| F | UI — Schema-driven `SceneInputArea` (single component, no type branching) | 1.5h |
| G | Wire Convex → UI | 2.5h |
| H | Design system corrections + `DynamicField` `textarea` control | 2h |
| I | QA (TypeScript + Biome + i18n + browser) | 1.5h |
| J | Create `adding-a-new-video-model.md` guide | 30min |
| **Total** | | **~25h** |

> **Phase E revised**: 12 new components with complex state, responsive layouts, `useDevice` + `AdaptiveModal` integration = ~45min avg per component (was: 20min). Recommend splitting across 2 sub-sprints if needed.

---

## 📋 Phase A — Convex Schema Foundation

### A1 — Add `videoModelSchemas` Table to `convex/schema.ts`

**File**: `convex/schema.ts`  
**Action**: Append new table after `voiceModelSchemas`

```typescript
videoModelSchemas: defineTable({
  // ─── Identifiers ───
  schemaId: v.string(),
  name: v.string(),
  nameTranslationKey: v.optional(v.string()),

  // ─── FAL Config ───
  modelId: v.string(),
  // "type" is metadata only — used for VideoModelCard badge display
  // Never used for branching in SceneInputArea or backend action
  type: v.union(v.literal("i2v"), v.literal("r2v"), v.literal("v2v")),

  // ─── Start image / video param name mapping ───
  // v3 Pro I2V uses "start_image_url", O3 Pro I2V uses "image_url" — stored here, never hardcoded
  startImageParam: v.optional(v.string()),  // undefined for V2V
  videoInputParam: v.optional(v.string()),  // "video_url" for V2V, undefined for I2V/R2V

  // ─── Required Params (drives generate button + pre-flight validation) ───
  requiredParams: v.array(v.string()),      // e.g. ["start_image_url"] | ["video_url","prompt"] | []

  // ─── Credit System ───
  creditBaseDuration: v.number(),           // always 5 (5s baseline for all Kling)
  supportsDurationScaling: v.boolean(),     // false for V2V Edit (fixed cost by input duration)
  creditTiers: v.array(v.object({
    tier: v.string(),                        // "no_audio" | "audio" | "voice" | "standard"
    actionType: v.string(),
    labelKey: v.string(),                    // i18n key for UI display (CreditTierSelector)
  })),

  // ─── UI Capabilities — ALL flags SceneInputArea reads to decide what to render ───
  // RULE: No UI component may branch on `schema.type`. Use these flags only.
  capabilities: v.object({
    // Input requirements
    requiresStartImage:  v.optional(v.boolean()),  // show start frame upload (required)
    requiresVideoInput:  v.optional(v.boolean()),  // show video upload (required)
    requiresTextPrompt:  v.optional(v.boolean()),  // mark prompt field as required
    supportsEndImage:    v.optional(v.boolean()),  // show end frame upload (optional)
    supportsStyleImages: v.optional(v.boolean()),  // show image_urls style ref strip
    supportsElements:    v.optional(v.boolean()),  // show elements panel
    // Settings
    supportsDuration:    v.optional(v.boolean()),  // show duration selector
    // Aspect ratios — options array drives the selector; empty/absent = hide control entirely
    // Include "auto" in array if model supports it (no separate flag needed)
    aspectRatios:        v.optional(v.array(v.string())),  // e.g. ["auto","16:9","9:16","1:1"]
    // Audio
    audioGeneration:     v.optional(v.boolean()),  // show generate_audio toggle
    keepAudio:           v.optional(v.boolean()),  // show keep_audio toggle (V2V)
    voiceIds:            v.optional(v.boolean()),  // show voice IDs panel
    // Advanced
    negativePrompt:      v.optional(v.boolean()),
    cfgScale:            v.optional(v.boolean()),
    multiShot:           v.optional(v.boolean()),
  }),

  // ─── UI Badges (VideoModelCard display only) ───
  badges: v.optional(v.array(v.string())),

  // ─── UI Parameters (dynamic form — the single source of truth for all controls) ───
  // ALL visual controls come from this array, rendered via DynamicField or SceneInputArea.
  // RULE: If a param is absent from this array, its control does not render. No boolean flags needed.
  params: v.array(v.object({
    key: v.string(),
    control: v.string(),   // "textarea"|"select"|"slider"|"toggle"|"number"|"image"|"aspectratio"
    label: v.string(),     // i18n key
    hint: v.optional(v.string()),         // i18n key — stored here so UI never hardcodes per model
    placeholder: v.optional(v.string()), // i18n key — stored here so UI never hardcodes per model
    required: v.optional(v.boolean()),
    options: v.optional(v.array(v.object({
      value: v.union(v.string(), v.number(), v.boolean()),
      label: v.string(),
    }))),
    default: v.optional(v.union(v.string(), v.number(), v.boolean())),
    min: v.optional(v.number()),
    max: v.optional(v.number()),
    step: v.optional(v.number()),
    maxLength: v.optional(v.number()),
    rows: v.optional(v.number()),
    advanced: v.optional(v.boolean()),
    // "global" = FloatingVideoSettingsPanel, "scene" = SceneCard/SceneDetailModal
    scope: v.optional(v.union(v.literal("global"), v.literal("scene"))),
    showWhen: v.optional(v.object({
      param: v.string(),
      value: v.union(v.string(), v.boolean()),
    })),
  })),

  // ─── Backend Config ───
  allowedParams: v.array(v.string()),   // whitelist for FAL API call — no extras sent
  maxPromptLength: v.number(),

  // ─── Metadata ───
  sortOrder: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_schema_id", ["schemaId"])
  .index("by_model_id", ["modelId"])
  .index("by_type_active", ["type", "isActive", "sortOrder"])
  .index("by_active_sort", ["isActive", "sortOrder"])  // Required by getActiveModels in B1
```

### A2 — Patch `scenes` Table: `videoGeneration` Nested Object

**File**: `convex/schema.ts`  
**Action**: Locate the `videoGeneration` nested object inside `scenes` and apply these 5 targeted changes:

1. `startFrameUrl: v.string()` → `v.optional(v.string())` — V2V has no start frame
2. `prompt: v.string()` → `v.optional(v.string())` — R2V has no required prompt
3. Add `schemaId: v.optional(v.string())` — traceability to `videoModelSchemas`
4. Add `creditTransactionId: v.optional(v.id("creditTransactions"))` — required for refund-on-failure
5. Add `videoInputUrl: v.optional(v.string())` — V2V source video URL

### A3 — Add `"failed"` to `scenes.update` Status Validator

**File**: `convex/scenes.ts`  
**Action**: Find the `status` validator in the `update` mutation — add `v.literal("failed")`. Currently missing despite the schema having it.

### A4 — Add `deductCreditsForVideo` helper to `convex/credits.ts`

**File**: `convex/credits.ts`  
**Action**: Add as an **exported async helper function** — NOT a registered `mutation({...})`.

> **Critical Convex rule**: A registered mutation cannot call another registered mutation. `deductCreditsForVideo` must be a plain TypeScript function so `startGenericVideoGeneration` (Phase B3) can call it directly with `ctx`. It also cannot call `deductCredits(ctx, {...})` by passing `credits` — `deductCredits` has no `credits` parameter (it reads cost from `creditCosts`). The helper must inline the balance check and deduction logic.

```typescript
// convex/credits.ts — exported helper function (not a registered mutation)
export async function deductCreditsForVideo(
  ctx: MutationCtx,
  args: {
    clerkUserId: string;
    actionType: string;
    durationSeconds: number;
    baseDurationSeconds: number;  // always 5 (creditBaseDuration)
  },
): Promise<{ success: boolean; transactionId?: Id<"creditTransactions"> }> {
  // 1. Lookup base credit cost
  const costRow = await ctx.db.query("creditCosts")
    .withIndex("by_action_type", (q) => q.eq("actionType", args.actionType))
    .unique();
  if (!costRow) throw new Error(`Unknown actionType: ${args.actionType}`);

  // 2. Scale by duration ratio
  const scaledCost = Math.ceil(
    costRow.credits * args.durationSeconds / args.baseDurationSeconds,
  );

  // 3. Check + deduct balance (inline — mirrors the core logic from deductCredits handler)
  const userCredits = await ctx.db.query("userCredits")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
    .unique();
  if (!userCredits || userCredits.balance < scaledCost) {
    return { success: false };
  }

  await ctx.db.patch(userCredits._id, { balance: userCredits.balance - scaledCost });

  // 4. Record transaction for refund-on-failure traceability
  // balanceAfter is computed before the patch for atomicity in the transaction insert
  // Field names MUST match creditTransactions schema exactly (schema.ts lines 750-781):
  // type, amount, balanceAfter, description, timestamp are all required fields.
  const newBalance = userCredits.balance - scaledCost;
  const transactionId = await ctx.db.insert("creditTransactions", {
    clerkUserId: args.clerkUserId,
    type: "usage",
    amount: -scaledCost,
    balanceAfter: newBalance,
    actionType: args.actionType,
    description: `Video generation: ${args.actionType}`,
    timestamp: Date.now(),
  });

  return { success: true, transactionId };
}
```

The `by_active_sort` index is already specified in the A1 schema code block above — no additional action needed here.

Also add `refundVideoCredits` as an **internal mutation** in `convex/credits.ts` — called by `pollVideoGeneration` on failure. This is a separate addition from `deductCreditsForVideo` (they can live in the same file):

```typescript
// convex/credits.ts — add alongside deductCreditsForVideo
export const refundVideoCredits = internalMutation({
  args: {
    creditTransactionId: v.id("creditTransactions"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, { creditTransactionId, clerkUserId }) => {
    const original = await ctx.db.get(creditTransactionId);
    if (!original) return; // already refunded or missing — safe no-op

    const refundAmount = Math.abs(original.amount);
    const userCredits = await ctx.db.query("userCredits")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
    if (!userCredits) return;

    await ctx.db.patch(userCredits._id, { balance: userCredits.balance + refundAmount });
    await ctx.db.insert("creditTransactions", {
      clerkUserId,
      type: "refund",
      amount: refundAmount,
      balanceAfter: userCredits.balance + refundAmount,
      description: "Video generation failed — credits refunded",
      originalTransactionId: creditTransactionId,
      timestamp: Date.now(),
    });
  },
});
```

B2 must call: `ctx.runMutation(internal.credits.refundVideoCredits, { creditTransactionId, clerkUserId })`

---

## 📋 Phase B — Backend Generic Action

### B1 — Create `convex/videoModels.ts`

**New file** — mirror `convex/voiceModels.ts` exactly, substituting `videoModelSchemas`.

> **Index note**: `by_type_active` requires `type` as the first prefix — it cannot query "all active regardless of type". Use a JS-filter pattern for `getActiveModels`, or add `by_active_sort` index in Phase A1.

```typescript
// Add to Phase A1 schema — second index needed for getActiveModels:
// .index("by_active_sort", ["isActive", "sortOrder"])

export const getActiveModels = query({
  handler: async (ctx) => {
    // Use the by_active_sort index (all active, sorted):
    return ctx.db.query("videoModelSchemas")
      .withIndex("by_active_sort", (q) => q.eq("isActive", true))
      .order("asc")
      .collect();
  },
});

export const getByModelId = query({
  args: { modelId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db.query("videoModelSchemas")
      .withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
      .unique();
  },
});

export const getBySchemaId = query({
  args: { schemaId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db.query("videoModelSchemas")
      .withIndex("by_schema_id", (q) => q.eq("schemaId", args.schemaId))
      .unique();
  },
});
```

### B2 — Create `convex/actions/videoToolGeneric.ts`

**New file** with 2 internalActions: `generateGenericVideo` and `pollVideoGeneration`.

**Critical implementation details**:

```
generateGenericVideo (internalAction):
  args: { sceneId, modelId, filteredParams, startImageUrl?, inputVideoUrl?,
          clerkUserId, creditTransactionId, pollCount: 0 }
  1. Load schema from videoModelSchemas via getByModelId (internalQuery)
  2. Filter params via schema.allowedParams
  3. Inject start image / video input — all driven by schema fields, no type branching:
     - if (schema.startImageParam && startImageUrl) → filteredParams[schema.startImageParam] = startImageUrl
     - if (schema.videoInputParam && inputVideoUrl) → filteredParams[schema.videoInputParam] = inputVideoUrl
  4. Handle "auto" aspect ratio:
     if (filteredParams.aspect_ratio === "auto") delete filteredParams.aspect_ratio
  5. Convert voice_ids textarea string → string[] (split on "\n", trim, slice 0..2)
  6. POST to https://queue.fal.run/{modelId}
  7. On HTTP error: call internal.scenes.updateVideoGenerationStatus (failed) + refund via internalMutation, throw
  8. Save requestId → ctx.runMutation(internal.scenes.updateVideoGenerationStatus, { sceneId, status: "generating", requestId })
  9. ctx.scheduler.runAfter(15_000, internal.actions.videoToolGeneric.pollVideoGeneration,
       { sceneId, requestId, modelId, clerkUserId, creditTransactionId, pollCount: 0 })

pollVideoGeneration (internalAction):
  args: { sceneId, requestId, modelId, clerkUserId, creditTransactionId, pollCount }
  - Checks FAL queue status endpoint
  - COMPLETED → ctx.runMutation(internal.scenes.updateVideoGenerationStatus, { status: "completed", videoUrl })
  - FAILED → ctx.runMutation(internal.credits.refundVideoCredits, { creditTransactionId, clerkUserId })
             + ctx.runMutation(internal.scenes.updateVideoGenerationStatus, { sceneId, status: "failed", error })
  - pollCount >= 18 (3 min timeout) → same refund + updateVideoGenerationStatus "failed" with reason "timeout"
  - Otherwise → ctx.scheduler.runAfter(10_000, internal.actions.videoToolGeneric.pollVideoGeneration,
                  { ..., pollCount: pollCount + 1 })
```

> **Why `creditTransactionId` is passed as a scheduler arg**: Scheduled actions have no user auth context (`ctx.auth.getUserIdentity()` returns null). Reading it from the scene document requires an `internalQuery`; passing it directly in the args chain is simpler and more reliable.

**IMPORTANT — Do NOT use in-action polling loop** (sleep/interval approach used in voice tool). Video takes 30–120s. Use scheduler-chained pattern above to avoid blocking action threads.

### B3 — Create `convex/videoTool.ts`

**New file** — public mutation `startGenericVideoGeneration`:

> **Critical Convex rules applied here**:
> - A mutation cannot call another registered mutation — `deductCreditsForVideo` must be an exported async helper function, NOT a registered `mutation({...})`.
> - Duration-scaling guard: check `schema.supportsDurationScaling` before computing effective duration.

```typescript
// convex/videoTool.ts
import { deductCreditsForVideo } from "./credits";   // helper function, not a mutation

export const startGenericVideoGeneration = mutation({
  args: {
    sceneId: v.id("scenes"),
    schemaId: v.string(),
    startImageUrl: v.optional(v.string()),
    inputVideoUrl: v.optional(v.string()),
    durationSeconds: v.number(),
    params: v.any(),
    selectedTier: v.string(),  // "no_audio" | "audio" | "voice" | "standard"
  },
  handler: async (ctx, args) => {
    // 1. Auth + ownership check (same pattern as voiceTool.ts)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const clerkUserId = identity.subject;

    // 2. Load schema (internalQuery), validate requiredParams are present in args
    const schema = await ctx.runQuery(internal.videoModels.getBySchemaId, { schemaId: args.schemaId });
    if (!schema) throw new Error(`Unknown schema: ${args.schemaId}`);

    // 3. Get tierConfig from schema.creditTiers
    const tierConfig = schema.creditTiers.find(t => t.tier === args.selectedTier);
    if (!tierConfig) throw new Error(`Unknown tier: ${args.selectedTier}`);

    // 4. Duration-scaling guard — V2V Edit has supportsDurationScaling: false (flat rate)
    const effectiveDuration = schema.supportsDurationScaling
      ? args.durationSeconds
      : schema.creditBaseDuration;   // use base (5) → scaling ratio = 1 → flat cost

    // 5. Deduct credits via helper function (NOT a registered mutation call)
    const deductResult = await deductCreditsForVideo(ctx, {
      clerkUserId,
      actionType: tierConfig.actionType,
      durationSeconds: effectiveDuration,
      baseDurationSeconds: schema.creditBaseDuration,
    });
    if (!deductResult.success) throw new Error("Insufficient credits");

    // 6. Patch scene to pending
    await ctx.runMutation(internal.scenes.updateVideoGenerationStatus, {
      sceneId: args.sceneId, status: "pending",
    });

    // 7. Schedule action — pass creditTransactionId so polling action can refund without auth
    await ctx.scheduler.runAfter(0, internal.actions.videoToolGeneric.generateGenericVideo, {
      sceneId: args.sceneId,
      modelId: schema.modelId,
      filteredParams: args.params,
      startImageUrl: args.startImageUrl,
      inputVideoUrl: args.inputVideoUrl,
      clerkUserId,
      creditTransactionId: deductResult.transactionId,
      pollCount: 0,
    });
  },
});
```

### B4 — Add `updateVideoGenerationStatus` Internal Mutation to `convex/scenes.ts`

> **Name**: Use `updateVideoGenerationStatus` (NOT `updateVideoGeneration` — that name already exists in `scenes.ts`, causing a duplicate identifier TypeScript error).

```typescript
// convex/scenes.ts — new export (name is updateVideoGenerationStatus, not updateVideoGeneration)
export const updateVideoGenerationStatus = internalMutation({
  args: {
    sceneId: v.id("scenes"),
    status: v.union(v.literal("pending"), v.literal("generating"), v.literal("completed"), v.literal("failed")),
    requestId: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sceneId, {
      "videoGeneration.status": args.status,
      ...(args.requestId && { "videoGeneration.requestId": args.requestId }),
      ...(args.videoUrl  && { "videoGeneration.videoUrl": args.videoUrl }),
      ...(args.error     && { "videoGeneration.error": args.error }),
    });
  },
});
```

All references in Phase B2 action use `internal.scenes.updateVideoGenerationStatus`.

> **`refundVideoCredits` note**: B2's `pollVideoGeneration` calls `internal.credits.refundVideoCredits` — this is the `internalMutation` defined in Phase A4. It is NOT the public `refundCredits` mutation. Do not confuse the two.

---

## 📋 Phase C — Seed + Credit Costs

### C1 — Create `convex/seed/seedVideoModels.ts`

**New file** — idempotent (deletes existing records before inserting new ones, same pattern as `seedVoiceModels.ts`).

Seeds 5 `videoModelSchemas` rows and **11 `creditCosts` rows**:

**Credit Costs — 11 rows** (base = 5s):

| `actionType` | Base Credits | Model | Tier | $/5s |
|---|---|---|---|---|
| `video_i2v_kling_v3_no_audio` | 56 | Kling v3 Pro | Audio off | $1.12 |
| `video_i2v_kling_v3_audio` | 84 | Kling v3 Pro | Audio on | $1.68 |
| `video_i2v_kling_v3_voice` | 98 | Kling v3 Pro | Audio + Voice ctrl | $1.96 |
| `video_i2v_kling_o3_no_audio` | 56 | Kling O3 Pro I2V | Audio off | $1.12 |
| `video_i2v_kling_o3_audio` | 70 | Kling O3 Pro I2V | Audio on | $1.40 |
| `video_r2v_kling_o3_no_audio` | 56 | Kling O3 R2V | Audio off | $1.12 |
| `video_r2v_kling_o3_audio` | 70 | Kling O3 R2V | Audio on | $1.40 |
| `video_v2v_kling_o3_edit_no_audio` | 56 | Kling O3 V2V Edit | Audio off — flat rate | $1.12 |
| `video_v2v_kling_o3_edit_audio` | 84 | Kling O3 V2V Edit | Audio on — flat rate | $1.68 |
| `video_v2v_kling_o3_ref_no_audio` | 56 | Kling O3 V2V Ref | Audio off | $1.12 |
| `video_v2v_kling_o3_ref_audio` | 70 | Kling O3 V2V Ref | Audio on | $1.40 |

*Assumes 1 credit = $0.02. Scaling formula: `Math.ceil(baseCredits × requestedDuration / 5)`*  
*V2V Edit: `supportsDurationScaling: false` — flat cost based on tier only (input video duration not controllable).*

> **Seed rule — prompt placeholder/hint**: The `prompt` param entry in each schema must set `placeholder` and `hint` to the per-model i18n key (e.g. `placeholder: "video_generator.prompt_placeholder_r2v"`). The UI reads these from the schema, never selecting a key by type branching in component code. Example:
> ```typescript
> // In seedVideoModels.ts — R2V schema params array:
> { key: "prompt", control: "textarea", label: "video_generator.prompt_label",
>   placeholder: "video_generator.prompt_placeholder_r2v",
>   hint: "video_generator.prompt_hint_r2v", required: false, maxLength: 2500, scope: "scene" }
> ```

### C2 — Run Convex Deploy + Seed

```bash
npx convex dev --once
# then run seed mutation via Convex dashboard or MCP
```

Verify via Convex MCP:
- `videoModelSchemas` has exactly 5 records
- `creditCosts` has exactly 11 video entries (no duplicates)

---

## 📋 Phase D — i18n Keys

### D1 — Add Keys to `messages/en.json`

**~74 new keys total** across 3 namespaces (58 original + 16 additions from final review):

**1. New namespace `video_models`** (20 keys — after `voice_models`):

```json
"video_models": {
  "kling_v3_pro": "Kling v3 Pro",
  "kling_v3_pro_desc": "Cinematic quality with native audio, voice control, and character consistency",
  "kling_o3_pro": "Kling O3 Pro",
  "kling_o3_pro_desc": "Smooth frame-to-frame transitions with optional audio generation",
  "kling_o3_pro_r2v": "Kling O3 Pro Reference",
  "kling_o3_pro_r2v_desc": "Character and object consistency across scenes with style reference images",
  "kling_o3_pro_v2v_edit": "Kling O3 Pro Edit",
  "kling_o3_pro_v2v_edit_desc": "Edit existing videos with text prompts, preserving original motion and timing",
  "kling_o3_pro_v2v_reference": "Kling O3 Pro Style Reference",
  "kling_o3_pro_v2v_reference_desc": "Generate new shots guided by a reference video's cinematography and style",
  "group_i2v": "Image to Video",
  "group_r2v": "Reference to Video",
  "group_v2v": "Video to Video",
  "chip_audio": "Audio",
  "chip_voice_ctrl": "Voice Control",
  "chip_end_frame": "End Frame",
  "chip_style_refs": "Style Refs",
  "chip_elements": "Elements",
  "chip_multi_shot": "Multi-Shot",
  "chip_duration_range": "Duration Range"
}
```

**2. Append to existing `video_generator`** (29 keys):

```json
"prompt_label": "Motion Description",
"prompt_placeholder": "Describe the motion, action, and atmosphere...",
"prompt_hint_kling": "Reference elements with @Element1, voices with <<<voice_1>>>",
"prompt_placeholder_r2v": "@Element1 walks into the frame. @Image1 defines the visual style...",
"prompt_hint_r2v": "Reference elements as @Element1, @Element2, style images as @Image1, @Image2",
"prompt_placeholder_v2v": "Change environment to snow as @Image1. Replace character with @Element1",
"prompt_placeholder_v2v_ref": "Integrate @Element1 in the scene. Style following watercolor @Image1",
"prompt_hint_v2v": "Reference source video as @Video1, style images as @Image1, elements as @Element1",
"aspect_ratio_label": "Aspect Ratio",
"aspect_ratio_auto": "Auto",
"duration_label": "Duration",
"duration_hint": "Longer videos cost more credits",
"generate_audio_label": "Generate Audio",
"generate_audio_hint": "Adds native audio to the video. Increases credit cost.",
"end_image_label": "End Frame (optional)",
"end_image_hint": "Set a specific last frame for transition control",
"negative_prompt_label": "Negative Prompt",
"cfg_scale_label": "Prompt Strength (CFG)",
"cfg_scale_hint": "Higher values follow the prompt more strictly (0–1)",
"voice_ids_label": "Voice IDs",
"voice_ids_hint": "Up to 2 voice IDs, one per line. Reference in prompt as <<<voice_1>>>",
"voice_ids_placeholder": "voice_id_1\nvoice_id_2",
"keep_audio_label": "Keep Original Audio",
"keep_audio_hint": "Preserve the audio track from the source video",
"audio_mode_label": "Audio Mode",
"tier_no_audio": "No Audio",
"tier_audio": "With Audio",
"tier_voice": "Audio + Voice"
```

> **Note on `tier_*` keys**: The seed stores `labelKey: "video_generator.tier_no_audio"` in `schema.creditTiers[].labelKey`. The `CreditTierSelector` component resolves these via `t(tier.labelKey.replace("video_generator.", ""))`. Ensure the strip prefix in the component matches the actual key structure.

**3. New namespace `storyboard`** (26 keys — after `video_models`):

```json
"storyboard": {
  "add_scene": "Add Scene",
  "remove_scene": "Remove Scene",
  "scene_label": "Scene {number}",
  "scenes_count": "{count, plural, =0 {No scenes} one {1 scene} other {# scenes}}",
  "generating": "Generating...",
  "queued": "Queued",
  "complete": "Complete",
  "error": "Error",
  "idle": "Ready",
  "generate_all": "Generate All Scenes",
  "generate_scene": "Generate Scene",
  "retry": "Retry",
  "clear_scene": "Clear Scene",
  "global_settings": "Global Settings",
  "scene_settings": "Scene Settings",
  "model_selector": "Video Model",
  "upload_start_image": "Upload Start Frame",
  "upload_end_image": "Upload End Frame",
  "upload_video": "Upload Video",
  "upload_video_hint": "MP4/MOV, 3–10s, max 200MB",
  "end_image_hint": "Set a specific last frame for transition control",
  "drag_drop_hint": "Drag & drop or click to upload",
  "scene_generating_n": "Generating scene {number}...",
  "n_of_n_complete": "{done} of {total} scenes complete",
  "export_video": "Export Video",
  "export_sequence": "Export Sequence"
}
```

> **ICU note**: `n_of_n_complete` uses `{done}` and `{total}` — `FloatingGenerateBar` must pass `{ done, total }` (not `{ done, N }`).

### D2 — Run Translation + Verification

```bash
pnpm translate        # regenerate all 7 locale files
pnpm i18n:verify      # confirm all locales complete
```

---

## 📋 Phase E — UI Architecture (Canvas-First)

### E1 — New `components/storyboard-generator/index.tsx`

**Replaces** `app/[locale]/tools/storyboard-generator/page.tsx` as the main component (page.tsx becomes a thin wrapper: `export default function StoryboardPage() { return <StoryboardGenerator />; }`).

Mirrors `components/voice-generator/index.tsx` exactly:

```tsx
// Z-index layer stack:
<div className="relative w-full min-h-[calc(100vh-64px)] bg-background select-none">
  {/* z-0: full-screen canvas */}
  <div className="absolute inset-0 z-0">
    <SceneTimeline scenes={scenes} ... />
  </div>

  {/* z-40: top bar + bottom generate bar */}
  <StoryboardTopBar selectedModel={selectedSchema} onModelOpen={...} />
  <FloatingGenerateBar scenes={scenes} onGenerateAll={...} totalCredits={...} />

  {/* z-30: settings panel trigger */}
  <FloatingVideoSettingsPanel schema={selectedSchema} params={globalParams} ... />
  <FloatingHistoryTrigger onOpen={...} />

  {/* z-50: model selector + history */}
  <VideoModelSelector open={modelSelectorOpen} onSelect={...} schemas={schemas} creditCosts={...} />
  <StoryboardLibrary open={historyOpen} ... />

  {/* z-[60]: modals */}
  <InsufficientCreditsModal open={insufficientCredits} ... />
  <ProjectSelector open={projectSelectorOpen} ... />
</div>
```

**Global state** managed in index.tsx:
- `selectedSchemaId` — active video model
- `selectedSchema` — resolved from `useConvexVideoSchemas()`
- `scenes: SceneData[]` — all scene states
- `globalParams` — shared settings (aspect ratio, audio)
- `isGeneratingAll` — bulk generation flag

### E2 — New `components/storyboard-generator/SceneTimeline.tsx`

The canvas layer (`z-0`). Horizontal scroll with scroll-snap on mobile:

```tsx
<ScrollArea className="absolute inset-0">
  <div className={cn(
    "flex gap-4 px-4 pb-24",
    "snap-x snap-mandatory",
    "md:snap-none md:flex-wrap md:gap-6 md:px-6",
  )}>
    {scenes.map((scene) => (
      <div key={scene.id} className="snap-start shrink-0 w-[85vw] max-w-sm md:w-[280px]">
        {/* Pass full schema object — SceneCard reads capabilities flags, never schema.type */}
        <SceneCard scene={scene} schema={selectedSchema} onUpdate={...} onGenerate={...} />
      </div>
    ))}
    <AddSceneButton onClick={handleAddScene} />
  </div>
  <ScrollBar orientation="horizontal" className="md:hidden" />
</ScrollArea>
```

**Empty state** (no scenes): centered illustration + "Add your first scene" CTA.

### E3 — New `components/storyboard-generator/SceneCard.tsx`

**Replaces** `StoryboardPanel` entirely. Per-scene card:

- Header: Scene number pill (top-left) + `SceneStatusBadge` (top-right) + delete button
- Input area: `<SceneInputArea schema={schema} ... />` — single component, adapts from `schema.capabilities` (see Phase F)
- Prompt textarea: driven by `schema.params.find(p => p.key === "prompt")` — `maxLength`, `placeholder` (i18n key), `hint` (i18n key), `required` all from the schema param entry (never hardcoded per model)
- Per-scene `scope === "scene"` params (e.g. `negative_prompt`, `cfg_scale`) — rendered below `SceneInputArea` via `DynamicField`:

```tsx
{/* Per-scene params — scope: "scene", excluding "prompt" (rendered separately above) */}
{schema.params
  .filter((p) => p.scope === "scene" && p.key !== "prompt")
  .map((p) => shouldShowParam(p, scene.params ?? {}) && (
    <DynamicField key={p.key} param={p}
      value={scene.params?.[p.key]}
      onChange={(v) => onUpdate({ params: { ...scene.params, [p.key]: v } })}
      translationNamespace="video_generator" />
  ))}
```

- Per-scene generate button (`variant="outline"`, `min-h-[44px]`, disabled state from `useCanGenerateScene(scene, schema)`)
- Video preview (shown when `status === "complete"`, replaces input area)
- On mobile: "expand" icon button → opens `SceneDetailModal`

```typescript
// Hook to determine if the generate button should be enabled — zero model-specific branching
// Add to Phase E11 hooks file
// IMPORTANT: SceneData uses mediaInputs: Record<string, string | string[]>
// There is NO scene.imageUrl or scene.inputVideoUrl — read from scene.mediaInputs[param]
function useCanGenerateScene(scene: SceneData, schema: VideoModelSchema | undefined): boolean {
  if (!schema) return false;
  return schema.requiredParams.every((param) => {
    if (param === "prompt") return scene.prompt.trim().length > 0;
    // All media inputs live in mediaInputs keyed by FAL param name
    // This handles "start_image_url", "image_url", "video_url", and any future param
    return !!(scene.mediaInputs[param] ?? scene.params?.[param]);
  });
  // R2V: requiredParams=[] → every() on empty array = true → button always enabled when credits ok
}
```

**Design token fixes** (from design agent):

```tsx
// ❌ current violations in StoryboardPanel → fix in SceneCard:
// bg-[var(--surface-2)]    → bg-background
// bg-black/60              → bg-background/70 backdrop-blur-[2px]
// bg-black/70 badge        → bg-background/80 text-foreground
// h-6 w-6 button           → size="icon" (min 44px)
// bg-green-600             → variant="default"
```

### E4 — New `components/storyboard-generator/StoryboardTopBar.tsx`

Glass pill fixed to top-center (z-40). Contains:
- Storyboard icon + "Storyboard" label + scene count pill
- Model trigger button (shows selected model name)

```tsx
// Required glassmorphism — use .glass-panel utility (globals.css already defines it)
<div className="fixed left-1/2 top-16 z-40 -translate-x-1/2 glass-panel px-4 py-2 flex items-center gap-3">
  {/* icon + label + count pill + model trigger */}
</div>
// .glass-panel = backdrop-blur-md bg-background/60 border border-border/50 shadow-lg rounded-xl
```

### E5 — New `components/storyboard-generator/FloatingGenerateBar.tsx`

Glass pill fixed to bottom (z-40). Contains:
- Progress indicator: "{done} of {N} scenes complete"
- Generate All button (`min-h-[44px]`)
- Total credit cost estimate
- Mobile: scene dot navigation indicators above the pill

```tsx
// Full glassmorphism class — required per design system (matches FloatingOptionsPanel pattern)
className="fixed bottom-6 left-1/2 z-40 w-[90%] max-w-3xl -translate-x-1/2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md bg-background/60 border border-border/50 shadow-lg rounded-xl px-4 py-3"
```

### E6 — New `components/storyboard-generator/VideoModelCard.tsx`

Mirrors `VoiceModelCard.tsx` exactly — same `className` structure. Key differentiator: model type badge (I2V / R2V / V2V).

```tsx
<button type="button" onClick={onSelect}
  className={cn(
    // Exact VoiceModelCard className — do not remove any class
    "flex flex-col rounded-lg border bg-card text-left transition-smooth",
    "hover:bg-muted/50 active:scale-95",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",  // WCAG AA — required
    "min-h-[44px]",  // touch target — required
    selected && "border-primary ring-2 ring-primary/20",
  )}
  aria-pressed={selected ?? false}
>
  {/* Thumbnail — responsive like VoiceModelCard */}
  <div className="flex aspect-[3/2] md:aspect-video w-full items-center justify-center rounded-t-lg bg-muted/60">
    <Film className="size-8 md:size-10 text-muted-foreground" aria-hidden="true" />
  </div>
  <div className="flex flex-1 flex-col gap-2 p-3 md:p-4">
    {/* Type badge (I2V / R2V / V2V) + quality badges from schema.badges */}
    {/* Model name via schema.nameTranslationKey */}
    {/* Credit cost (base 5s, default tier) */}
    {/* Capability chips — rendered dynamically from schema.capabilities, max 4 visible + "+N more"
        (4 visible — matches VoiceModelCard.tsx .slice(0, 4) pattern)
        Chips driven by: audioGeneration, voiceIds, supportsEndImage, supportsStyleImages,
        supportsElements, multiShot, supportsDuration — NEVER hardcoded labels */}
  </div>
</button>
```

### E7 — New `components/storyboard-generator/VideoModelSelector.tsx`

`AdaptiveModal` wrapping a grid of `VideoModelCard`:
- Mobile: bottom sheet, 2-column grid (`useDevice` → `isMobile` → `grid-cols-2`)
- Desktop: centered dialog (max-w-3xl), 3-column grid (`grid-cols-3`)
- Grouped dynamically: derive unique `type` values from loaded schemas at runtime → render group header per type
  - Group header label: derive from `schema.type` via i18n key (e.g. `video_models.group_i2v`, `video_models.group_r2v`, `video_models.group_v2v`)
  - Adding a new type in the seed automatically creates a new group — zero code change needed

### E8 — New `components/storyboard-generator/SceneStatusBadge.tsx`

```tsx
// Design system tokens — shorthand notation (matches existing bg-primary/10, bg-destructive/10 pattern)
// Requires --success + --warning added to tailwind.config.ts theme.extend.colors AND globals.css :root
// (See Phase H3 for both additions)
const STATUS_CONFIG = {
  idle:       { label: null, icon: null, className: "" },
  queued:     { label: "storyboard.queued",     icon: Clock,        className: "bg-warning/10 text-warning border-warning/30" },
  generating: { label: "storyboard.generating", icon: Loader2,      className: "bg-primary/10 text-primary border-primary/30", spin: true },
  complete:   { label: "storyboard.complete",   icon: CheckCircle2, className: "bg-success/10 text-success border-success/30" },
  error:      { label: "storyboard.error",      icon: AlertCircle,  className: "bg-destructive/10 text-destructive border-destructive/30" },
};
```

Card border color also reflects status (same `className` drives the card's border).

### E9 — New `components/storyboard-generator/FloatingVideoSettingsPanel.tsx`

Mirrors `FloatingOptionsPanel` from voice-generator **exactly**. Use `const { isMobile, orientation } = useDevice()` — NOT CSS-only breakpoints — to gate mobile vs desktop rendering (prevents AdaptiveModal mounting on desktop):

```tsx
// Same pattern as FloatingOptionsPanel.tsx
const { isMobile, orientation } = useDevice();
const globalParams = schema.params.filter(p => p.scope === "global");

if (isMobile) {
  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-30 size-11 glass-panel">
        <SlidersHorizontal className="size-5" />
      </Button>
      <AdaptiveModal isOpen={open} onClose={() => setOpen(false)} title={t("storyboard.global_settings")}>
        <div className={`${orientation === "landscape" ? "max-h-[80vh]" : "max-h-[60vh]"} overflow-y-auto px-1`}>
          <CreditTierSelector tiers={schema.creditTiers} ... />
          {globalParams.map(p => shouldShowParam(p, params) && (
            <DynamicField key={p.key} param={p} value={params[p.key]} onChange={...}
              translationNamespace="video_generator" />
          ))}
        </div>
      </AdaptiveModal>
    </>
  );
}

// Desktop: collapsible side panel (same structure as FloatingOptionsPanel desktop)
return (
  <div className="fixed right-6 top-24 z-30 hidden w-80 md:block">
    <Collapsible open={!collapsed} onOpenChange={(open) => setCollapsed(!open)}>
      <div className="overflow-hidden rounded-xl border border-border/50 bg-background/60 shadow-lg backdrop-blur-md">
        {/* header + CollapsibleTrigger */}
        <CollapsibleContent>
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4 space-y-4">
            <CreditTierSelector tiers={schema.creditTiers} ... />
            {globalParams.map(p => shouldShowParam(p, params) && (
              <DynamicField key={p.key} param={p} value={params[p.key]} onChange={...}
                translationNamespace="video_generator" />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  </div>
);
```

**`shouldShowParam` is required** — same function as `VoiceSettingsPanel.tsx` lines 68–78. Params with `showWhen: { param: "generate_audio", value: true }` (e.g. `voice_ids`) must only render when the referenced param has the specified value. Without this, all params render unconditionally.

Global settings rendered: `CreditTierSelector` (from `schema.creditTiers[]`) + all `scope === "global"` params via `DynamicField`:
- Aspect ratio: `schema.params` where `key === "aspect_ratio"` — options array includes `"auto"` only if model supports it. `DynamicField` renders what it gets.
- If `aspect_ratio` absent from `schema.params[]` → control does not render (absence = no aspect ratio control)

Mobile: `SlidersHorizontal` icon button → `AdaptiveModal` drawer.

```tsx
// CreditTierSelector — schema-driven, auto-hides for single-tier models
// NEVER hardcodes "audio off / audio on / voice" labels — reads from schema.creditTiers[].labelKey
function CreditTierSelector({ tiers, selectedTier, onSelect }) {
  if (tiers.length <= 1) return null;  // auto-select + hide if no choice
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-muted-foreground">
        {t("video_generator.audio_mode_label")}
      </span>
      <div className="flex gap-2">
        {tiers.map((tier) => (
          <button key={tier.tier} type="button" onClick={() => onSelect(tier.tier)}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-sm min-h-[44px] transition-smooth",
              selectedTier === tier.tier
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-transparent text-muted-foreground hover:bg-muted/50",
            )}
          >
            {t(tier.labelKey.replace("video_generator.", "") as never)}
          </button>
        ))}
      </div>
    </div>
  );
}
```

Add `"audio_mode_label"` to Phase D1 i18n keys.

### E10 — New `components/storyboard-generator/SceneDetailModal.tsx`

Mobile-only per-scene expansion. `AdaptiveModal` bottom drawer:
- Full prompt textarea (schema-driven: `maxLength`, `placeholder`, `hint` from `schema.params` prompt entry)
- Per-scene duration override (only if `schema.capabilities.supportsDuration === true`)
- `<SceneInputArea schema={schema} ... />` — same component as SceneCard, never branches by type
- Per-scene `scope === "scene"` params (same rendering as SceneCard):

```tsx
{/* Per-scene params — scope: "scene", excluding "prompt" */}
{schema.params
  .filter((p) => p.scope === "scene" && p.key !== "prompt")
  .map((p) => shouldShowParam(p, scene.params ?? {}) && (
    <DynamicField key={p.key} param={p}
      value={scene.params?.[p.key]}
      onChange={(v) => onUpdate({ params: { ...scene.params, [p.key]: v } })}
      translationNamespace="video_generator" />
  ))}
```

- Generate button prominently at bottom of drawer (disabled from `useCanGenerateScene`)

### E11 — New `components/storyboard-generator/hooks/use-convex-video-schemas.ts`

Mirrors `use-convex-voice-schemas.ts`:

```typescript
export function useConvexVideoSchemas() {
  const schemas = useQuery(api.videoModels.getActiveModels);
  return {
    schemas: schemas ?? [],
    isLoading: schemas === undefined,
    getSchemaById: (id: string) => schemas?.find((s) => s.schemaId === id),
    getDefaultSchema: () => schemas?.[0],
    // Returns { paramKey: defaultValue } for all schema params that have a default
    // Used by index.tsx to initialize globalParams when a new model is selected
    getDefaultParamsFromSchema: (schema: VideoModelSchema): Record<string, string | number | boolean> =>
      Object.fromEntries(
        schema.params
          .filter((p) => p.default !== undefined)
          .map((p) => [p.key, p.default!])
      ),
    // Returns initial SceneData with durationSeconds from the "duration" param default (or 5s)
    createDefaultScene: (schema: VideoModelSchema): SceneData => ({
      id: crypto.randomUUID(),
      mediaInputs: {},
      prompt: "",
      durationSeconds: (schema.params.find((p) => p.key === "duration")?.default as number) ?? 5,
      params: {},
      status: "idle",
    }),
  };
}
```

### E12 — Rewrite `components/storyboard-generator/types.ts` → `types/schema.ts`

Replace hardcoded `VideoModel` type with:

```typescript
export type VideoModelType = "i2v" | "r2v" | "v2v";
export type SceneStatus = "idle" | "queued" | "generating" | "complete" | "error";

export interface SceneData {
  id: string;
  // Media inputs — keyed by FAL param name from schema (e.g. "start_image_url", "image_url",
  // "video_url", "image_urls"). Adding a new model with a new media input param requires zero
  // change here — the new param key is just used as a new map entry.
  mediaInputs: Record<string, string | string[]>;
  prompt: string;
  // Duration is a top-level field (not in params) because it's used for credit scaling by
  // startGenericVideoGeneration. It is populated from the "duration" schema param's default
  // value when a scene is created (see useConvexVideoSchemas.getDefaultParamsFromSchema).
  // SceneCard renders a duration selector only when schema.capabilities.supportsDuration === true,
  // reading options from schema.params where key === "duration".
  durationSeconds: number;
  // Per-scene settings params (negative_prompt, cfg_scale overrides — scope: "scene" params)
  params?: Record<string, string | number | boolean>;
  status: SceneStatus;
  error?: string;
  generatedVideoUrl?: string;
  jobRequestId?: string;
  convexSceneId?: string;     // maps to Convex scenes._id — undefined until scene is saved
}
// mediaInputs usage examples:
//   I2V v3:     { "start_image_url": "https://...", "end_image_url": "https://..." }
//   I2V O3:     { "image_url": "https://..." }
//   R2V:        { "start_image_url": "https://...", "image_urls": ["https://...","https://..."] }
//   V2V Edit:   { "video_url": "https://..." }
```

---

## 📋 Phase F — Schema-Driven `SceneInputArea` (Single Component)

> **Golden Rule**: There is ONE `SceneInputArea` component. It reads `schema.capabilities` flags to decide what to render. No type branching (`schema.type`), no model-name checks. Adding a 6th model with any combination of capabilities requires zero code changes.

### F1 — `SceneInputArea.tsx` (replaces I2VInputArea + R2VInputArea + V2VInputArea)

**New file**: `components/storyboard-generator/SceneInputArea.tsx`

```tsx
interface SceneInputAreaProps {
  schema: VideoModelSchema;
  scene: SceneData;
  onUpdate: (patch: Partial<SceneData>) => void;
  disabled?: boolean;
}

export function SceneInputArea({ schema, scene, onUpdate, disabled }: SceneInputAreaProps) {
  const t = useTranslations("storyboard");
  const startImageParamKey = schema.startImageParam ?? "start_image_url";
  const videoParamKey = schema.videoInputParam ?? "video_url";

  return (
    <div className="flex flex-col gap-3">
      {/* Video input — only when requiresVideoInput */}
      {schema.capabilities.requiresVideoInput && (
        <VideoUploadZone
          value={scene.mediaInputs[videoParamKey] as string | undefined}
          onChange={(url) => onUpdate({ mediaInputs: { ...scene.mediaInputs, [videoParamKey]: url } })}
          required label={t("upload_video")} hint={t("upload_video_hint")} disabled={disabled}
        />
      )}

      {/* Keep audio — only when capabilities.keepAudio (V2V models) */}
      {schema.capabilities.keepAudio && (
        <DynamicField
          param={schema.params.find((p) => p.key === "keep_audio")!}
          value={scene.params?.keep_audio ?? false}
          onChange={(v) => onUpdate({ params: { ...scene.params, keep_audio: v } })}
          translationNamespace="video_generator"
        />
      )}

      {/* Start image — shown for I2V (required) and R2V (optional) */}
      {!schema.capabilities.requiresVideoInput && (
        <ImageUploadZone
          value={scene.mediaInputs[startImageParamKey] as string | undefined}
          onChange={(url) => onUpdate({ mediaInputs: { ...scene.mediaInputs, [startImageParamKey]: url } })}
          required={schema.capabilities.requiresStartImage ?? false}
          label={t("upload_start_image")} disabled={disabled}
        />
      )}

      {/* End frame — only when capabilities.supportsEndImage */}
      {schema.capabilities.supportsEndImage && (
        <ImageUploadZone
          value={scene.mediaInputs["end_image_url"] as string | undefined}
          onChange={(url) => onUpdate({ mediaInputs: { ...scene.mediaInputs, "end_image_url": url } })}
          required={false} label={t("upload_end_image")} hint={t("end_image_hint")} disabled={disabled}
        />
      )}

      {/* Style reference strip — only when capabilities.supportsStyleImages */}
      {schema.capabilities.supportsStyleImages && (
        <StyleRefStrip
          urls={(scene.mediaInputs["image_urls"] as string[]) ?? []}
          onChange={(urls) => onUpdate({ mediaInputs: { ...scene.mediaInputs, image_urls: urls } })}
          max={4} disabled={disabled}
        />
      )}

      {/* Elements panel — only when capabilities.supportsElements */}
      {schema.capabilities.supportsElements && (
        <ElementsPanel scene={scene} onUpdate={onUpdate} disabled={disabled} />
      )}

      {/* Multi-shot — only when capabilities.multiShot */}
      {schema.capabilities.multiShot && (
        <MultiShotPanel scene={scene} onUpdate={onUpdate} disabled={disabled} />
      )}
    </div>
  );
}
```

**Capability → render mapping reference** (for seed authors — no UI code needed):

| `schema.capabilities` flag | What renders |
|---|---|
| `requiresVideoInput: true` | Video upload slot (required) |
| `keepAudio: true` | Keep original audio toggle |
| `requiresStartImage: true` | Start image upload (required indicator) |
| `requiresStartImage: false` + no `requiresVideoInput` | Start image upload (optional) |
| `supportsEndImage: true` | End frame upload (optional) |
| `supportsStyleImages: true` | Multi-image style reference strip |
| `supportsElements: true` | Elements panel |
| `multiShot: true` | Multi-shot section |
| *(flag absent or false)* | That section does not render |

---

## 📋 Phase G — Wire Convex → UI

### G1 — Scene-to-Convex Mapping

Each `SceneData.id` maps to a Convex `scenes._id`. Scenes are created/managed under a user's `project`:

- On "Add Scene": call `api.scenes.create` → store returned `scenes._id` alongside `SceneData.id`
- On generate: call `api.videoTool.startGenericVideoGeneration({ sceneId, schemaId, params, selectedTier })`
- Poll scene status: `useQuery(api.scenes.get, { sceneId })` — real-time updates via Convex reactivity

### G2 — Real-Time Status Updates

Convex reactivity handles live status without polling from the client:

```typescript
// SceneCard.tsx — subscribes to real-time scene status
const sceneData = useQuery(api.scenes.get, { sceneId: scene.convexSceneId });

// Status automatically updates: "generating" → "complete" when polling action finishes
```

### G3 — Credit Display

- Load `creditCosts` for all video action types
- Display cost per scene in `VideoModelCard` based on default duration (5s) + default tier
- Update `FloatingGenerateBar` total when scenes count changes or tier selection changes

### G4 — `useHasEnoughCredits` Integration

Wire same hook used in voice/image generators. Block "Generate All" button if user has insufficient credits for all pending scenes.

### G5 — `storageId` → URL Resolution

Video output from FAL API is a direct URL. Store in `scenes.videoGeneration.videoUrl`. No Convex storage needed for video output — use the FAL CDN URL directly.

---

## 📋 Phase H — Design System Corrections

**All violations found by design-master in current storyboard files:**

| File | Line | Violation | Fix |
|------|------|-----------|-----|
| `storyboard-panel.tsx` | ~302 | `bg-[var(--surface-2)]` | `bg-background` |
| `storyboard-panel.tsx` | ~106 | `h-6 w-6` delete button | `size="icon"` (min 44px) |
| `storyboard-container.tsx` | ~431 | `bg-green-600 text-white` | `variant="default"` |
| `storyboard-panel.tsx` | ~213 | `bg-black/60` loading overlay | `bg-background/70 backdrop-blur-[2px]` |
| `page.tsx` | ~192 | `min-h-screen` root | `relative w-full min-h-[calc(100vh-64px)]` |
| `storyboard-panel.tsx` | ~182 | `bg-black/70` label | `bg-background/80 text-foreground` |
| `storyboard-container.tsx` | ~286 | `style={{ width: ... }}` inline | Tailwind responsive classes |

All violations are fixed in the new components — the old files (`storyboard-panel.tsx`, `storyboard-container.tsx`, `page.tsx`) are either replaced or stripped down to thin wrappers.

### H2 — Add `textarea` Control to `DynamicField` + Extend `ParamSchema` Type

**Files**: `components/image-generator/DynamicField.tsx` and `components/image-generator/types/schema.ts`

**Part A — `ParamSchema` type** (`components/image-generator/types/schema.ts`):  
The video schema's `params[]` objects include a `showWhen` field. `DynamicField` accepts `ParamSchema` — this type must be extended to accept `showWhen`, otherwise TypeScript errors when passing video schema params to `DynamicField`. Add to the `ParamSchema` interface:

```typescript
// components/image-generator/types/schema.ts — add to ParamSchema interface
showWhen?: { param: string; value: string | boolean };
```

This is a purely additive change — image and voice generators that don't use `showWhen` are unaffected. No `convertToParamSchema` adapter is needed since the video schema's `params` format is designed to match `ParamSchema` directly.

**Part B — `textarea` control** (`components/image-generator/DynamicField.tsx`):  
**Why**: `voice_ids` param uses `control: "textarea"` in the seed. Without this, the control silently renders nothing.

Add before the final `return null` fallback:

```tsx
if (param.control === "textarea") {
  return (
    <div className="space-y-1">
      <label htmlFor={`param-${param.key}`}
        className="block text-sm font-medium tracking-tight text-muted-foreground">
        {label}
      </label>
      <textarea
        id={`param-${param.key}`}
        value={(effectiveValue as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        maxLength={param.maxLength}
        placeholder={param.placeholder ? translateLabel(param.placeholder) : undefined}
        rows={param.rows ?? 3}
        disabled={disabled}
        className="min-h-[44px] w-full rounded-lg border border-border/30 bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"
        aria-label={ariaLabel ?? label}
      />
      {param.hint && (
        <p className="text-xs text-muted-foreground leading-relaxed">{translateLabel(param.hint)}</p>
      )}
    </div>
  );
}
```

### H3 — Add `success` / `warning` Theme Colors

Two changes required to enable the `bg-success/10 text-success` shorthand Tailwind notation:

**Step 1 — `tailwind.config.ts`**: Add to `theme.extend.colors` (mirrors how `destructive`, `primary` are defined as CSS variable references):

```typescript
// tailwind.config.ts — theme.extend.colors
success: "hsl(var(--success) / <alpha-value>)",
warning: "hsl(var(--warning) / <alpha-value>)",
```

**Step 2 — `app/globals.css`**: Add to `:root` only (this project has NO `.dark` block — it is a dark-only design):

```css
/* app/globals.css — :root block only (no .dark block exists in this project) */
--success: 142 71% 45%;
--warning: 38 92% 50%;
```

Without both changes, `bg-success/10` will be treated as an unknown class and render nothing.

---

## 📋 Phase I — QA

> Per project standards: TypeScript + Biome check run after **every phase that modifies code**.

### Per-Phase QA Checkpoints

**After Phase A** (schema changes — run before writing any backend code):
```bash
npx tsc --noEmit
npx biome check --write convex/schema.ts convex/scenes.ts convex/credits.ts
npx convex dev --once
```

**After Phase B** (new Convex files — verify actions compile and deploy):
```bash
npx tsc --noEmit
npx biome check --write convex/videoModels.ts convex/videoTool.ts convex/actions/videoToolGeneric.ts
npx convex dev --once
```

**After Phase C** (seed — verify rows in DB):
```bash
npx convex dev --once
# Via Convex MCP: verify videoModelSchemas has 5 records, creditCosts has 11 video entries
```

**After Phase D** (i18n):
```bash
npx tsc --noEmit
pnpm translate
pnpm i18n:verify
```

**After Phase H** (DynamicField + tailwind + globals):
```bash
npx tsc --noEmit
npx biome check --write components/image-generator/types/schema.ts components/image-generator/DynamicField.tsx tailwind.config.ts app/globals.css
```

### Final QA (Phase I — all files)

```bash
npx tsc --noEmit
npx biome check --write .
pnpm i18n:verify
npx convex dev --once
```

### Convex Deployment Verification (via Convex MCP after final deploy)
1. `videoModelSchemas` has exactly 5 records
2. `creditCosts` has exactly 11 new video entries
3. No existing tables broken (check `scenes.ts` mutation validators)

### Browser Tests

- [ ] Canvas-first layout renders on desktop (1440px)
- [ ] Scroll-snap timeline works on mobile (375px)
- [ ] Model selector opens as drawer on mobile, dialog on desktop
- [ ] Selecting Kling v3 Pro I2V: start image upload appears, no end frame, audio+voice tier selector
- [ ] Selecting Kling O3 Pro I2V: start image upload (uses `image_url` internally — transparent to user)
- [ ] Selecting O3 Pro R2V: optional start image + style refs + elements shown; no required uploads
- [ ] Selecting O3 Pro V2V Edit: video upload shown, duration selector hidden; `keep_audio` toggle visible
- [ ] Selecting O3 Pro V2V Ref: video upload shown, duration selector shown, "Auto" in aspect ratio
- [ ] `voice_ids` field only appears when `generate_audio` is toggled ON (`showWhen` gating)
- [ ] `CreditTierSelector` shows correct tiers per model; auto-hides for single-tier models
- [ ] "Generate All" button blocked when insufficient credits
- [ ] Scene status badge cycles: idle → queued → generating → complete
- [ ] Per-scene generate button disabled until required inputs are uploaded
- [ ] Per-scene generate button works in isolation
- [ ] On mobile: "expand" icon → drawer with full scene settings
- [ ] All text rendered via i18n (no hardcoded English strings in new components)
- [ ] Deprecated files (`storyboard-panel.tsx`, `storyboard-container.tsx`, `types.ts`) have zero import references

---

## 🔴 Critical Risks & Gotchas

> Surfaced by convex-master agent review:

1. **`startFrameUrl: v.string()` breaks V2V insertions** — Must be patched to `v.optional` in Phase A2 before any V2V generation code is written. Hard Convex validation error if missed.

2. **`scenes.update` missing `"failed"` status** — Use `internal.scenes.updateVideoGenerationStatus` (not `updateVideoGeneration` — that name already exists, causing a duplicate identifier error). Never use the public `update` mutation from actions.

3. **`aspect_ratio: "auto"` must be omitted from FAL payload** — Sending the string `"auto"` to the FAL API causes a validation error. The action must `delete filteredParams.aspect_ratio` when value is `"auto"`. Check `filteredParams.aspect_ratio === "auto"` — the `aspectRatioHasAuto` flag is removed from the schema; the `"auto"` option in the `params` options array is the source of truth.

4. **Do NOT use in-action polling loop for video** — Video takes 30–120s. The sleep-based loop from `voiceToolGeneric.ts` would block a Convex action for 2 minutes. Always use scheduler-chained polling (`scheduler.runAfter(10_000, ...)` per Phase B).

5. **`startImageParam` varies per I2V model** — v3 Pro uses `start_image_url`, O3 Pro uses `image_url`. The schema's `startImageParam` field resolves this without any `if` branching. Never hardcode param names in the action.

6. **Duration scaling for credit deduction** — `deductCreditsForVideo` must scale by `Math.ceil(base × duration / 5)`. V2V Edit has `supportsDurationScaling: false` (flat cost). R2V and I2V scale with selected duration.

7. **V2V Edit has no duration control** — `schema.capabilities.supportsDuration` is absent/false. UI hides the duration selector when `schema.capabilities.supportsDuration !== true`. Never check `schema.type === "v2v"` — the flag value is the gate.

8. **R2V has no required params** — `requiredParams: []`. The `startGenericVideoGeneration` mutation must NOT throw if no start image is provided for R2V. The `useCanGenerateScene` hook evaluates `schema.requiredParams.every(...)` — empty array satisfies it automatically.

---

## 📁 File Map

### New Files to Create

```
convex/
  videoModels.ts                    # Phase B1
  videoTool.ts                      # Phase B3
  actions/
    videoToolGeneric.ts             # Phase B2
  seed/
    seedVideoModels.ts              # Phase C1

components/storyboard-generator/
  index.tsx                         # Phase E1 (replaces page.tsx logic)
  SceneTimeline.tsx                 # Phase E2
  SceneCard.tsx                     # Phase E3
  StoryboardTopBar.tsx              # Phase E4
  FloatingGenerateBar.tsx           # Phase E5
  VideoModelCard.tsx                # Phase E6
  VideoModelSelector.tsx            # Phase E7
  SceneStatusBadge.tsx              # Phase E8
  FloatingVideoSettingsPanel.tsx    # Phase E9 (includes CreditTierSelector)
  SceneDetailModal.tsx              # Phase E10
  SceneInputArea.tsx                # Phase F1 (SINGLE component — no I2V/R2V/V2V variants)
  VideoUploadZone.tsx               # Phase F1 (NEW — simple dropzone for MP4/MOV, reuse Radix primitives)
  ImageUploadZone.tsx               # Phase F1 (NEW — single image upload, mirrors image-generator UploadZone)
  StyleRefStrip.tsx                 # Phase F1 (NEW — horizontal strip of up to 4 style ref images)
  ElementsPanel.tsx                 # Phase F1 (NEW — expandable panel for elements param, max 4 image+text pairs)
  MultiShotPanel.tsx                # Phase F1 (NEW — expandable panel for multi_shot param, max 5 shots)
  hooks/
    use-convex-video-schemas.ts     # Phase E11 (includes useCanGenerateScene)
  types/
    schema.ts                       # Phase E12

docs/Guides/
  adding-a-new-video-model.md       # Phase J
```

### Existing Files to Modify

```
convex/schema.ts                                   # Phase A1, A2
convex/scenes.ts                                   # Phase A3, B4
convex/credits.ts                                  # Phase A4 (deductCreditsForVideo + refundVideoCredits)
messages/en.json                                   # Phase D1
app/[locale]/tools/storyboard-generator/page.tsx  # Phase E1 (thin wrapper)
components/image-generator/types/schema.ts         # Phase H2 (add showWhen to ParamSchema interface)
components/image-generator/DynamicField.tsx        # Phase H2 (add textarea control)
tailwind.config.ts                                 # Phase H3 (add success/warning theme colors)
app/globals.css                                    # Phase H3 (add --success/--warning CSS variables)
```

### Files to Deprecate (keep but no longer import)

```
components/storyboard-generator/storyboard-container.tsx    # replaced by SceneTimeline + index.tsx
components/storyboard-generator/storyboard-panel.tsx        # replaced by SceneCard
components/storyboard-generator/types.ts                    # replaced by types/schema.ts
components/storyboard-generator/automator/                  # legacy demo automators — keep but unused
```

---

## 📋 Phase J — Create `adding-a-new-video-model.md` Guide

**New file**: `docs/Guides/adding-a-new-video-model.md`

Mirror `adding-a-new-image-model.md` exactly, adapted for video:

| Order | What | Where |
|-------|------|--------|
| 1 | Document model (params, pricing, control mapping, capabilities flags) | `docs/Analysis/video-generator/VIDEO-MODELS-ANALYSIS.md` |
| 2 | Add schema entry + credit cost(s) to seed | `convex/seed/seedVideoModels.ts` → `VIDEO_MODEL_SCHEMAS`, `ALL_CREDIT_COSTS` |
| 3 | Deploy Convex, run seed | `npx convex dev --once`, then seed mutation |
| 4 | English i18n (model name + any new option labels) | `messages/en.json` only; other locales via `pnpm translate` |

Closing statement (to make the zero-code property explicit for future developers):

> "No changes are required in `convex/videoTool.ts`, `convex/actions/videoToolGeneric.ts`, or the storyboard-generator UI components — they all read from Convex and the schema."

---

## ✅ Definition of Done

**Modularity**
- [ ] 5 video models available in VideoModelSelector — loaded from Convex, not hardcoded
- [ ] `SceneInputArea` renders correctly for each model via `schema.capabilities` flags only — no type branching
- [ ] Adding a hypothetical 6th model requires only: seed entry + i18n key + no code changes
- [ ] Deprecated files (`storyboard-panel.tsx`, `storyboard-container.tsx`, `types.ts`) have zero import references

**Schema-driven UI**
- [ ] V2V Edit: duration selector hidden (`schema.capabilities.supportsDuration` absent); V2V Ref: shown
- [ ] Aspect ratio "auto" option appears for V2V Ref only (comes from `params` options array in seed)
- [ ] `CreditTierSelector` renders from `schema.creditTiers[]` — auto-hidden for single-tier models
- [ ] Per-scene generate button disabled state driven by `useCanGenerateScene(scene, schema)` (reads `mediaInputs`)
- [ ] Prompt textarea `maxLength`, `placeholder`, `hint` come from `schema.params.find(p.key === "prompt")`
- [ ] `voice_ids` field only appears when `generate_audio` is ON (`showWhen` gating via `shouldShowParam`)
- [ ] `scope: "global"` params render in `FloatingVideoSettingsPanel`; `scope: "scene"` in `SceneCard`/`SceneDetailModal`

**Backend**
- [ ] Per-scene generation calls `startGenericVideoGeneration` with correct `schemaId` and tier
- [ ] Polling action updates scene status in real-time via Convex reactivity
- [ ] Credit deduction scales by duration for I2V/R2V; flat for V2V Edit (`supportsDurationScaling`)
- [ ] Credits block "Generate All" when insufficient
- [ ] Credit refund on generation failure (via `creditTransactionId` in scheduler args chain)

**Design & i18n**
- [ ] All UI text uses i18n keys — no hardcoded English strings in new components
- [ ] 7 design system violations from Sprint 24 fixed; `bg-success/10`/`bg-warning/10` semantic tokens used
- [ ] `success`/`warning` tokens added to `tailwind.config.ts` AND `globals.css :root`
- [ ] `DynamicField` supports `textarea` control type (needed for `voice_ids`)
- [ ] All floating panels use `.glass-panel` utility or explicit glassmorphism classes
- [ ] `VideoModelCard` has `focus:ring-2 focus:ring-ring` (WCAG AA) and `min-h-[44px]`
- [ ] Mobile: scroll-snap timeline, AdaptiveModal drawers, all touch targets ≥ 44px
- [ ] `useDevice` used in `FloatingVideoSettingsPanel` (not CSS breakpoints only)

**QA**
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npx biome check` — 0 errors
- [ ] `pnpm i18n:verify` — all 7 locales complete (~74 new keys)
- [ ] `videoModelSchemas`: 5 records in Convex dev
- [ ] `creditCosts`: 11 new video entries in Convex dev
- [ ] `adding-a-new-video-model.md` guide created in `docs/Guides/`

---

## 🔗 References

- `docs/Analysis/video-generator/VIDEO-MODELS-ANALYSIS.md` — full model specs, schema configs, credit pricing
- `docs/MVP/Todo/sprint-24-Storyboard-Generator-demo.md` — demo code baseline
- `docs/MVP/Todo/sprint-34-image-generator-fix.md` — architecture pattern (image)
- `docs/MVP/Todo/sprint-35-voice-generator-fix.md` — architecture pattern (voice)
- `docs/MVP/Todo/sprint-36-voice-generator-spec-parity.md` — schema parity pattern
- `docs/Guides/adding-a-new-image-model.md` — modular onboarding guide (video mirrors this exactly)
- `docs/Guides/adding-a-new-video-model.md` — video-specific guide (Phase J output)
- Agent reviews round 1: convex-master, design-master, i18n-master (March 1, 2026) — initial plan creation
- Agent reviews round 2: senior-dev-reviewer, design-master (March 1, 2026) — hardcoding audit (SceneInputArea unification, schema redesign)
- Agent reviews round 3: convex-master, design-master, i18n-master, senior-dev-reviewer (March 1, 2026) — final alignment review (Convex patterns, VideoModelCard parity, 16 missing i18n keys, useCanGenerateScene type fix, shouldShowParam, time estimates)
- Agent reviews round 4: convex-master, design-master, i18n-master, senior-dev-reviewer (March 1, 2026) — implementation-ready final check: fixed by_active_sort in A1 code block, creditTransactions field names, refundVideoCredits internalMutation, upload_video_hint hardcoded string, scope=scene DynamicField rendering in E3+E10, showWhen in ParamSchema type, file map completeness (tailwind.config.ts + F1 sub-components). Design-master: PASS.
