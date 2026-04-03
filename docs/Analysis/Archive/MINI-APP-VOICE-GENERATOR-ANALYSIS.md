# 🎙️ Voice Generator Mini App Analysis

**Created**: February 18, 2026  
**Updated**: February 19, 2026 (v2.5 - Phase 7: Project Selection Workflow Added)  
**Status**: ⚡ IN PROGRESS - Phase 7 Project Selection (Phases 1-6 Complete)  
**Priority**: Feature Enhancement  
**Type**: Mini App (Standalone Tool)  
**Dependencies**: 
- Sprint 30d.5 (Modular Model Architecture) ✅
- `docs/Analysis/voice-generator/TTS-MODELS-ANALYSIS.md` (v1.2) ✅

---

## 📊 Implementation Progress Status

**Last Updated**: February 18, 2026

### ✅ Completed Phases

**Phase 1: Convex Schema Setup** (2h) - ✅ COMPLETE
- ✅ Task 1.1: Created `voiceModelSchemas` and `voiceToolHistory` tables in `convex/schema.ts`
- ✅ Task 1.2: Created Convex queries in `convex/voiceModels.ts` (5 queries)
- ✅ Task 1.3: Created seed script `convex/seed/seedVoiceModels.ts` (3 models + 4 credit costs)

**Phase 2: Backend Generic Action** (1.5h) - ✅ COMPLETE
- ✅ Task 2.1: Created generic voice action `convex/actions/voiceToolGeneric.ts`
- ✅ Task 2.2: Created mutation handlers in `convex/voiceTool.ts`

**Phase 3: Frontend Dynamic UI** (4h) - ✅ COMPLETE
- ✅ Task 3.1: Created frontend hooks (`use-convex-voice-schemas.ts`, `use-convex-voice-history.ts`)
- ✅ Task 3.2: Built main VoiceGenerator component (`components/voice-generator/index.tsx`)
- ✅ Task 3.3: Created VoiceSettingsPanel with DynamicField
- ✅ Task 3.4: Created VoiceModelSelector component (with VoiceModelCard, VoiceModelGrid)
- ✅ Task 3.5: Created VoiceLibrary component with pagination

### ⏳ Pending Phases

**Phase 4: Voice Recording Mode** (2.5h) - ✅ COMPLETE
- ✅ Task 4.1: Created VoiceRecordingPanel with 88px touch targets
- ✅ Task 4.2: Created processRecordedVoice action

**Phase 5: Inspiration Wall Integration** (2h) - ⏳ PENDING
- Task 5.1: Add voice fields to toolCategories schema
- Task 5.2: Update CategoryDialog with voice fields
- Task 5.3: InspirationEmptyState and InspirationWall components

**Phase 6: Mobile Optimization & Polish** (1h) - ✅ **COMPLETE**
- ✅ Fixed 8 critical mobile UI issues
- ✅ Added `xs` breakpoint to Tailwind config
- ✅ Converted badges to semantic color tokens
- ✅ All touch targets meet WCAG 44px minimum
- ✅ Design system score: 9.5/10

**Phase 7: Project Selection Workflow** (3h 40min) - ⏳ **IN PROGRESS**
- ⏳ Task 7.0: Update audioTracks schema (make projectId & organizationId optional)
- ⏳ Task 7.1: Create ProjectSelector modal component
- ⏳ Task 7.2: Add project selection to VoiceRecordingPanel
- ⏳ Task 7.3: Create saveVoiceRecording mutation using audioTracks
- ⏳ Task 7.4: Add i18n translation keys for project selector
- ⏳ Task 7.5: Display narration tracks in Project Details → Audio tab

**Expert Review Summary**:
- Design-Master: 8.5/10 - Good design patterns, needs refinements
- I18n-Master: 7.6/10 - Solid structure, remove duplicate keys
- Convex-Master: 10/10 - audioTracks is correct table ✅
- Senior-Dev: Ready for implementation after schema updates

**Estimated Completion**: ⏳ **95% COMPLETE** - Phase 7 in progress

**Total Time**: 16h (13h complete + 3h Phase 7)

---

## ✅ PRODUCTION READY - All QA Issues Resolved (Feb 18, 2026)

**Status**: 🚀 **APPROVED FOR PRODUCTION**

### Final QA Results

**Design System Compliance**: 9.5/10
- Mobile-First: 10/10
- Touch Targets: 10/10  
- Color Tokens: 10/10
- Typography: 10/10
- Accessibility: 9/10
- Consistency: 9/10

**All Critical Issues Resolved**:
✅ Mobile card grid (single column 320px-480px)
✅ Modal dialog responsive width
✅ Input touch targets (44px minimum, system-wide)
✅ Model card responsive design
✅ Header button mobile stacking
✅ Waveform bars increased size
✅ Tailwind `xs` breakpoint added
✅ Badge colors using semantic tokens
✅ Translation errors fixed
✅ Duplicate models cleaned

**QA Checks**:
✅ TypeScript: No errors
✅ Biome: Clean
✅ Mobile: Works 320px → desktop
✅ Accessibility: WCAG 2.1 AA compliant
✅ Console: No errors

---

## 🔍 QA REVIEW FINDINGS (Feb 18, 2026)

**Status**: 🔴 **CRITICAL ISSUES FOUND** - Fix before continuing to Phase 5

### Issue Summary
- **Design Master Review**: 8 critical mobile UI issues
- **i18n Master Review**: 6 translation errors (FIXED ✅)
- **User Report**: Duplicate models (FIXED ✅ - deleted from Convex), broken mobile UI, console errors

---

### 🔴 CRITICAL: Mobile UI Issues (8 Issues - FIX IMMEDIATELY)

**Source**: design-master agent review (Agent ID: e3746f4c-e4bb-4798-9c3e-595c1ee5975b)

#### **Issue #1: Broken Mobile Card Grid Layout** 🔴 CRITICAL
**Location**: `components/voice-generator/VoiceModelGrid.tsx:28`
**Problem**: Grid uses `grid-cols-2` on mobile, cards are cramped at 320px viewport
**Fix**: Change to `grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3`

#### **Issue #2: Modal Dialog Not Mobile-Optimized** 🔴 CRITICAL  
**Location**: `components/voice-generator/VoiceModelSelector.tsx:53`
**Problem**: Dialog uses `max-w-2xl` (672px) which overflows on mobile
**Fix**: Add `max-w-[calc(100vw-2rem)] sm:max-w-2xl`

#### **Issue #3: Search Input Missing Minimum Height** 🔴 CRITICAL
**Location**: `components/ui/input.tsx:11`
**Problem**: Input uses `h-10` (40px), below WCAG 44px minimum
**Fix**: Change `h-10` to `min-h-[44px]`

#### **Issue #4: VoiceModelCard Not Mobile-First** 🔴 CRITICAL
**Location**: `components/voice-generator/VoiceModelCard.tsx:38-73`
**Problem**: Fixed aspect ratio, small padding, badges overflow on mobile
**Fix**: 
- Icon: `aspect-[3/2] md:aspect-video`, `size-8 md:size-10`
- Padding: `p-3 md:p-4`
- Badge text: `text-[10px] xs:text-xs`
- Title: `text-xs sm:text-sm`

#### **Issue #5: Header Buttons Stack Poorly** ⚠️ HIGH
**Location**: `components/voice-generator/index.tsx:216-252`
**Problem**: Buttons overflow when model name is long
**Fix**: Stack vertically on mobile: `flex-col sm:flex-row`, truncate long names

#### **Issue #6: Waveform Too Small on Mobile** ⚠️ MEDIUM
**Location**: `components/voice-generator/VoiceRecordingPanel.tsx:264`
**Problem**: Waveform bars use `w-1` (4px), nearly invisible on mobile
**Fix**: Change to `w-1.5 md:w-2`, increase height to `h-20 md:h-24`

#### **Issue #7: Dialog Title Not Responsive** ⚠️ LOW
**Location**: `components/ui/dialog.tsx:88-100`
**Problem**: Uses `text-lg` with `leading-none`, not mobile-optimized
**Fix**: `text-base sm:text-lg`, `leading-tight sm:leading-none`

#### **Issue #8: Input Padding** ✅ COMPLIANT
**Location**: `components/voice-generator/VoiceSettingsPanel.tsx:70`
**Status**: Already uses `p-3 md:p-4` correctly

---

### ✅ FIXED: i18n Translation Errors (6 Issues - ALL FIXED)

**Source**: i18n-master agent review (Agent ID: f5aa88a2-372d-4838-99a4-c1f8616d17a0)

**Problem**: Double namespace in translation keys (e.g., `t("voice_generator.sign_in_to_generate")` when `t` already scoped to `voice_generator`)

**Fixed in**: `components/voice-generator/index.tsx`

| Line | Before | After | Status |
|------|--------|-------|--------|
| 126 | `t("voice_generator.sign_in_to_generate")` | `t("sign_in_to_generate")` | ✅ FIXED |
| 131 | `t("voice_generator.select_model_first")` | `t("select_model_first")` | ✅ FIXED |
| 148 | `t("voice_generator.success.generated")` | `t("success.generated")` | ✅ FIXED |
| 154 | `t("voice_generator.errors.generation_failed")` | `t("errors.generation_failed")` | ✅ FIXED |
| 193 | `t("voice_generator.recording.save_success")` | `t("recording.save_success")` | ✅ FIXED |
| 200 | `t("voice_generator.recording.save_failed")` | `t("recording.save_failed")` | ✅ FIXED |

**Result**: ✅ Console errors eliminated, all 290 translation keys verified in `messages/en.json`

---

### ✅ FIXED: Duplicate Models Issue

**Problem**: User saw 6 models instead of 3 (seed script was run twice)
**Fix**: ✅ User manually deleted 3 duplicate models from Convex dashboard
**Prevention**: Migration script created at `convex/migrations/cleanDuplicateVoiceModels.ts` (for reference)

---

### 📋 Priority Action Plan

**Before Continuing to Phase 5**, complete these fixes in order:

#### **Phase 6.1: Critical Mobile Fixes** (2-3 hours) - BLOCKING
1. ✅ Fix translation errors (DONE)
2. 🔄 Update `VoiceModelGrid.tsx` - single column mobile layout
3. 🔄 Update `VoiceModelSelector.tsx` - responsive dialog width
4. 🔄 Update `components/ui/input.tsx` - 44px minimum height
5. 🔄 Update `VoiceModelCard.tsx` - responsive aspect ratio & text sizes
6. 🔄 Update `index.tsx` - stack header buttons on mobile

#### **Phase 6.2: Polish** (1 hour) - OPTIONAL
7. 🔄 Update `VoiceRecordingPanel.tsx` - larger waveform bars
8. 🔄 Update `components/ui/dialog.tsx` - responsive title typography

#### **Phase 6.3: Testing** (1 hour) - REQUIRED
- Test on iPhone SE (375px)
- Test modal with 10+ models
- Test with longest model name
- Test recording panel on mobile device
- Verify all console errors cleared

**Total Time for QA Fixes**: 4-5 hours

**Estimated Completion After Fixes**: ~70% complete (12h / 17h total, revised from 13h)

---

---

## 🚨 CRITICAL: Architecture Alignment Required

**Version 2.0 Update**: This document has been **completely rewritten** to align with the **modular dynamic schema architecture** implemented in Sprint 30d.5 for the Image Generator.

**Key Changes from v1.0**:
- ❌ **REMOVED**: Hardcoded model configurations
- ❌ **REMOVED**: Hardcoded credit costs in frontend hooks
- ✅ **ADDED**: `voiceModelSchemas` Convex table (mirrors `imageModelSchemas`)
- ✅ **ADDED**: `voiceToolHistory` Convex table (mirrors `imageToolHistory`)
- ✅ **ADDED**: Dynamic UI system using `DynamicField` component
- ✅ **ADDED**: Generic voice action pattern (like `imageToolGeneric.ts`)
- ✅ **ADDED**: Zero-code model onboarding capability

**Architecture Principle**: **Everything configurable lives in Convex**. Adding a new voice model = adding a Convex row. Zero code changes.

---

## fal.ai Integration Strategy

**All voice models accessed via fal.ai** (consistent with MyShortReel's AI model strategy):

**Initial Launch Models** (Phase 1):
- `fal-ai/minimax/speech-2.8-hd` - High-quality TTS (17 voices, 5 credits/1k chars)
- `fal-ai/minimax/speech-2.8-turbo` - Fast TTS (17 voices, 3 credits/1k chars, 40% faster)
- `fal-ai/qwen-3-tts/text-to-speech/1.7b` - Voice cloning TTS (9 voices + cloning, 5 credits/1k chars)

**Future Models** (Phase 2+):
- `fal-ai/minimax/speech-2.6-hd` - Legacy model (currently used in step-4, for backward compatibility)
- `fal-ai/elevenlabs/tts` - Industry-standard voices (when available)
- `fal-ai/openai/tts-1` - OpenAI TTS (when available)
- Additional models added via Convex configuration (zero code changes)

**Detailed Model Analysis**: See `docs/Analysis/voice-generator/TTS-MODELS-ANALYSIS.md` (v1.2)

## Executive Summary

This document analyzes the feasibility and implementation plan for a **Voice Generator Mini App** within MyShortReel. The app will enable users to:

1. **Generate AI voices** from text (TTS) using fal.ai MiniMax models (and other available TTS models)
2. **Record their own voice** for narration (audio upload/recording) 
3. **Use recorded voice** as replacement for generated narration in step-4
4. **Manage voice clips** with history, preview, and download capabilities

**Key Value**: Users can create personalized narration with their own voice, or choose from high-quality AI voices, making videos more authentic and engaging.

## 🎯 Current State Analysis

### Existing Infrastructure to Leverage

**Backend (Convex Actions)** - ✅ READY
- `narrationGeneration.ts` - TTS generation (currently uses legacy **fal-ai/minimax/speech-2.6-hd**)
  - **Note**: Will be refactored to generic action pattern for 2.8 models in Phase 1
- `voiceToFormAction` - Voice transcription pattern (from voice-form examples)  
- Audio storage in Convex - Already handles audio files with storage IDs
- Credit system integration - Narration costs 10 credits per generation (will be dynamic per model)

**Frontend Components** - ✅ READY
- Voice selection UI in step-4 - Complete voice picker with 8 MiniMax voices
- Audio player controls - Already implemented in step-4
- Recording interface patterns - From voice-form and transcriber examples
- Progress bars and loading states - Standard components available

**Integration Points** - ✅ READY
- Step-4 narration flow - Can add "Record Voice" option alongside "Generate Voice"
- Project audio storage - Supports both generated and uploaded audio
- Credit system - Same cost structure for voice generation

## 🏗️ Architecture Alignment with Image Generator (Sprint 30d.5)

**CRITICAL**: This voice generator **MUST** follow the modular architecture from Sprint 30d.5.

**Reference Documentation**: 
- Sprint 30d.5 Implementation: `docs/MVP/Todo/SPRINT-30C-POST-IMPLEMENTATION-BUGS-ANALYSIS.md` (lines 231-878)
- Image Generator Architecture: `components/image-generator/` (proven modular pattern)
- Image Models Analysis: `docs/Analysis/image-generator/IMAGE-MODELS-ANALYSIS.md` (v3.5)

### 1. Convex Schema Tables (REQUIRED)

#### Create `voiceModelSchemas` table (mirrors `imageModelSchemas`)

**Schema Structure**:
```typescript
voiceModelSchemas: defineTable({
  // ─── Identifiers ───
  schemaId: v.string(),                    // App ID: "minimax-hd-tts"
  name: v.string(),                        // Display: "MiniMax Speech HD"
  nameTranslationKey: v.optional(v.string()), // i18n: "voice_models.minimax_hd"
  
  // ─── FAL Config ───
  modelId: v.string(),                     // FAL: "fal-ai/minimax/speech-2.8-hd"
  type: v.literal("tts"),                  // Voice models are all TTS
  
  // ─── Credit System ───
  creditActionType: v.string(),            // "voice_generation_minimax_hd"
  
  // ─── UI Capabilities ───
  capabilities: v.object({
    voiceCloning: v.optional(v.boolean()),
    emotionControl: v.optional(v.boolean()),
    pitchControl: v.optional(v.boolean()),
    speedControl: v.optional(v.boolean()),
    multiLanguage: v.optional(v.boolean()),
  }),
  
  // ─── UI Badges ───
  badges: v.optional(v.array(v.string())),  // ["HD", "FAST", "PRO"]
  
  // ─── UI Parameters (dynamic form) ───
  params: v.array(v.object({
    key: v.string(),                        // "prompt", "voice_id", "speed"
    control: v.string(),                    // "text", "select", "number", "toggle"
    label: v.string(),                      // i18n key
    options: v.optional(v.array(v.object({
      value: v.string(),
      label: v.string(),                    // i18n key
      previewUrl: v.optional(v.string()),   // Voice preview audio
    }))),
    // ✅ Type-safe default values (no v.any())
    default: v.optional(
      v.union(
        v.string(),                         // For text, select inputs
        v.number(),                         // For sliders, number inputs
        v.boolean(),                        // For toggles
        v.array(v.string())                 // For multi-select (future)
      )
    ),
    min: v.optional(v.number()),
    max: v.optional(v.number()),
    step: v.optional(v.number()),
    maxLength: v.optional(v.number()),
    advanced: v.optional(v.boolean()),
  })),
  
  // ─── Backend Config ───
  allowedParams: v.array(v.string()),       // ["prompt", "voice_id", "speed", "pitch"]
  maxPromptLength: v.number(),              // MiniMax: 50000, varies by model
  
  // ─── Metadata ───
  sortOrder: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_schema_id", ["schemaId"])
  .index("by_model_id", ["modelId"])
  .index("by_type_active", ["type", "isActive", "sortOrder"])
```

#### Create `voiceToolHistory` table (mirrors `imageToolHistory`)

**Schema Structure**:
```typescript
voiceToolHistory: defineTable({
  // ─── User & Model ───
  userId: v.string(),                       // Clerk user ID
  modelId: v.string(),                      // FAL endpoint used
  schemaId: v.string(),                     // App ID (e.g., "minimax-hd-tts")
  
  // ─── Project Context (OPTIONAL) ───
  projectId: v.optional(v.id("projects")), // Link to project if used in video
  
  // ─── Generation Input ───
  prompt: v.string(),                       // Text to convert to speech
  voiceSettings: v.object({
    voiceId: v.string(),                    // Selected voice
    speed: v.optional(v.number()),          // 0.5-2.0 (validated in mutation)
    pitch: v.optional(v.number()),          // -12 to 12 (validated in mutation)
    emotion: v.optional(v.string()),        // "neutral", "happy", "sad" (validated in mutation)
  }),
  
  // ─── Generation Output ───
  audioUrl: v.string(),                     // Public audio URL
  storageId: v.id("_storage"),              // Convex storage reference
  duration: v.number(),                     // Audio duration in seconds
  
  // ─── Metadata ───
  mode: v.union(v.literal("generate"), v.literal("record")), // TTS or recorded
  cost: v.optional(v.number()),             // Credits spent
  createdAt: v.number(),
})
  .index("by_user", ["userId", "createdAt"])
  .index("by_user_schema", ["userId", "schemaId", "createdAt"])
  .index("by_user_project", ["userId", "projectId", "createdAt"]) // ✅ NEW: Project-specific queries
```

### 2. Frontend Architecture (Dynamic UI)

#### Hook: `useConvexVoiceSchemas()`

**Pattern from Image Generator** (`hooks/use-convex-schemas.ts`):
```typescript
export function useConvexVoiceSchemas() {
  const ttsSchemas = useQuery(api.voiceModels.listTTSSchemas);
  
  const isLoading = ttsSchemas === undefined;
  
  const getSchemaById = useCallback((id: string) => {
    return ttsSchemas?.find(s => s.schemaId === id);
  }, [ttsSchemas]);
  
  const getDefaultSchema = useCallback(() => {
    return ttsSchemas?.[0];
  }, [ttsSchemas]);
  
  return {
    ttsSchemas: ttsSchemas ?? [],
    isLoading,
    getSchemaById,
    getDefaultSchema,
  };
}
```

#### Component: Dynamic Voice Settings (reuse `DynamicField`)

**Pattern from Image Generator**:
```typescript
// Voice settings render from schema.params
{selectedSchema?.params
  .filter(p => !p.advanced)
  .map(param => (
    <DynamicField
      key={param.key}
      param={param}
      value={params[param.key]}
      onChange={(value) => setParams({ ...params, [param.key]: value })}
    />
  ))
}

// DynamicField handles all control types:
// - control: "text" → <Textarea maxLength={param.maxLength} />
// - control: "select" → <Select options={param.options} />
// - control: "number" → <NumberStepper min={param.min} max={param.max} />
// - control: "toggle" → <Switch />
```

### 3. Backend Architecture (Generic Action)

#### Action: `voiceToolGeneric.ts` (mirrors `imageToolGeneric.ts`)

**Generic Voice Generation Pattern**:
```typescript
"use node"; // ✅ REQUIRED: FAL SDK needs Node.js runtime

import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { fal } from "@fal-ai/serverless-client";

export const generateGenericVoice = internalAction({
  args: {
    modelId: v.string(),                    // FAL endpoint
    params: v.any(),                        // All voice settings
    transactionId: v.id("creditTransactions"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // 0. Verify authentication (CRITICAL for internal actions)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // 1. Get schema from Convex (NOT hardcoded)
    const schema = await ctx.runQuery(api.voiceModels.getByModelId, { 
      modelId: args.modelId 
    });
    if (!schema) {
      await ctx.runMutation(api.credits.refundCredits, {
        transactionId: args.transactionId,
        reason: `Unknown voice model: ${args.modelId}`,
      });
      throw new Error(`Unknown voice model: ${args.modelId}`);
    }
    
    // 2. Filter params via schema.allowedParams
    const rawParams = args.params as Record<string, unknown>;
    const filteredParams: Record<string, unknown> = {};
    for (const key of schema.allowedParams) {
      if (key in rawParams && rawParams[key] !== undefined) {
        filteredParams[key] = rawParams[key];
      }
    }
    
    // 3. Sanitize prompt length from schema.maxPromptLength
    if (typeof filteredParams.prompt === "string") {
      filteredParams.prompt = filteredParams.prompt.slice(0, schema.maxPromptLength);
    }
    
    // 4. Call FAL API using schema.modelId
    const url = `https://queue.fal.run/${schema.modelId}`;
    const result = await fal.subscribe(schema.modelId, {
      input: filteredParams,
    });
    
    // 5. Store audio in Convex (with error handling and refund)
    let storageId: Id<"_storage">;
    let audioUrl: string | null;
    
    try {
      const audioBlob = await downloadAudio(result.audio.url);
      storageId = await ctx.storage.store(audioBlob);
      audioUrl = await ctx.storage.getUrl(storageId);
      
      if (!audioUrl) {
        throw new Error("Failed to generate storage URL");
      }
    } catch (storageError) {
      // Refund credits if storage fails after successful FAL generation
      await ctx.runMutation(api.credits.refundCredits, {
        transactionId: args.transactionId,
        reason: `Storage failure: ${storageError.message}`,
      });
      throw new Error(`Audio storage failed: ${storageError.message}`);
    }
    
    // 6. Save to voiceToolHistory
    await ctx.runMutation(api.voiceTool.saveGeneration, {
      userId: args.clerkUserId,
      modelId: schema.modelId,
      schemaId: schema.schemaId,
      prompt: filteredParams.prompt,
      voiceSettings: {
        voiceId: filteredParams.voice_id,
        speed: filteredParams.speed,
        pitch: filteredParams.pitch,
        emotion: filteredParams.emotion,
      },
      audioUrl,
      storageId,
      duration: result.duration_ms / 1000,
      mode: "generate",
    });
    
    return { success: true, audioUrl, storageId };
  },
});
```

### 4. Credit System Integration

#### Update `creditCosts` table

**Add voice-specific action types**:
```typescript
// Seed script adds these entries:
await ctx.db.insert("creditCosts", {
  actionType: "voice_generation_minimax_hd",
  costInCredits: 10,
  description: "MiniMax Speech HD (per 100 words)",
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

await ctx.db.insert("creditCosts", {
  actionType: "voice_generation_minimax_turbo",
  costInCredits: 8,
  description: "MiniMax Speech Turbo (per 100 words)",
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

await ctx.db.insert("creditCosts", {
  actionType: "voice_generation_elevenlabs",
  costInCredits: 10,
  description: "ElevenLabs TTS (per 1000 chars)",
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

#### Credit Deduction (like `imageTool.ts`)

**Pattern from Image Generator**:
```typescript
// In startGenericVoiceGeneration mutation:
const schema = await ctx.db
  .query("voiceModelSchemas")
  .withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
  .first();

if (!schema) throw new Error("Unknown model");

// Deduct credits by creditActionType
const transaction = await ctx.db.insert("creditTransactions", {
  userId: args.clerkUserId,
  actionType: schema.creditActionType,  // e.g., "voice_generation_minimax_hd"
  creditsUsed: cost,
  status: "pending",
  // ...
});
```

### 5. Zero-Code Model Onboarding

**To add a new voice model** (e.g., `fal-ai/openai/tts-1`):

1. **Add to `voiceModelSchemas` table** (via seed script or admin UI):
   ```typescript
   {
     schemaId: "openai-tts-1",
     name: "OpenAI TTS",
     modelId: "fal-ai/openai/tts-1",
     type: "tts",
     creditActionType: "voice_generation_openai",
     params: [
       { key: "prompt", control: "text", maxLength: 4096, ... },
       { key: "voice", control: "select", options: ["alloy", "echo", "fable"], ... },
       { key: "speed", control: "number", min: 0.25, max: 4.0, ... },
     ],
     allowedParams: ["prompt", "voice", "speed"],
     maxPromptLength: 4096,
     isActive: true,
     // ...
   }
   ```

2. **Add to `creditCosts` table**:
   ```typescript
   {
     actionType: "voice_generation_openai",
     costInCredits: 12,
     description: "OpenAI TTS (per generation)",
     isActive: true,
   }
   ```

3. **Done** ✅ — Model appears in UI automatically, backend handles it generically.

---

## 🎁 Reference Implementations to Reuse

### 1. Image Generator Dynamic UI (`components/image-generator/`)
- `DynamicField.tsx` - Renders controls from schema params ✅
- `ModelSelector.tsx` - Model picker from Convex query ✅
- `hooks/use-convex-schemas.ts` - Schema fetching pattern ✅
- `GenerationHistory.tsx` - History with infinite scroll ✅

### 2. Image Generator Backend (`convex/`)
- `imageModels.ts` - Convex queries for schemas ✅
- `actions/imageToolGeneric.ts` - Generic action pattern ✅
- `imageTool.ts` - Credit deduction via `creditActionType` ✅
- `seed/seedImageModels.ts` - Seed script pattern ✅

### 3. Step-4 Voice UI (`app/[locale]/guided/step-4/`)
- Voice selection UI (8 MiniMax voices) ✅
- Audio player controls ✅
- Multiple takes management ✅
- **Adapt to use dynamic schema instead of hardcoded config**

## 🎙️ fal.ai Voice Models (Convex-Configured)

**IMPORTANT**: All model details, parameters, and configurations are now documented in:  
📄 **`docs/Analysis/voice-generator/TTS-MODELS-ANALYSIS.md` (v1.2)**

### Phase 1 Models (Initial Launch)

**1. MiniMax Speech 2.8 HD** - `fal-ai/minimax/speech-2.8-hd`
- **Purpose**: High-quality production narration
- **Features**: 17 voices, 7 emotions, pitch/speed/volume control, 44.1kHz stereo
- **Cost**: 5 credits per 1000 characters
- **Max Length**: 10,000 characters
- **UI Badges**: "HD", "PRO", "MULTILINGUAL"
- **Use Case**: Final production, professional content
- **Schema ID**: `minimax-speech-28-hd`

**2. MiniMax Speech 2.8 Turbo** - `fal-ai/minimax/speech-2.8-turbo`
- **Purpose**: Fast iteration, high-volume generation
- **Features**: Same 17 voices and features as HD, 40-60% faster
- **Cost**: 3 credits per 1000 characters (40% cheaper)
- **Max Length**: 10,000 characters
- **UI Badges**: "FAST", "TURBO", "COST-EFFECTIVE"
- **Use Case**: Drafts, testing, budget-conscious users
- **Schema ID**: `minimax-speech-28-turbo`

**3. Qwen 3 TTS (1.7B)** - `fal-ai/qwen-3-tts/text-to-speech/1.7b`
- **Purpose**: Voice cloning, custom brand voices
- **Features**: 9 preset voices + voice cloning, style prompts, advanced ML sampling
- **Cost**: 5 credits per 1000 characters
- **Max Length**: ~8,000 characters
- **UI Badges**: "VOICE CLONING", "CUSTOM VOICE"
- **Use Case**: Custom brand voices, unique vocal characteristics
- **Schema ID**: `qwen-3-tts-17b`
- **Unique Capabilities**:
  - Voice cloning via `fal-ai/qwen-3-tts/clone-voice` endpoint
  - Style prompt guidance ("Very happy", "Whispering")
  - Advanced sampling (temperature, top_k, top_p)
  - 11 languages with auto-detection

### Legacy Models (Phase 2 - Backward Compatibility)

**MiniMax Speech 2.6 HD** - `fal-ai/minimax/speech-2.6-hd`
- Currently used in step-4 narration (8 voices)
- Will be migrated to 2.8 models in Phase 1
- Kept for backward compatibility with existing projects
- Cost: 10 credits per generation

### Future Models (Phase 3+)

**ElevenLabs TTS** - `fal-ai/elevenlabs/tts`
- Industry-standard professional voices (when available via fal.ai)
- Natural prosody and emotion
- Multiple languages

**OpenAI TTS** - `fal-ai/openai/tts-1`
- 6 preset voices (alloy, echo, fable, onyx, nova, shimmer)
- Fast generation (real-time capable)

**Adding New Models**: Update `voiceModelSchemas` table via seed script or admin UI. Zero code changes required.

**Detailed Documentation**: See `TTS-MODELS-ANALYSIS.md` for:
- Complete schema configurations for all 3 Phase 1 models
- Full parameter specifications and UI control mappings
- Backend integration patterns
- i18n translation keys (~200+ keys)
- Credit cost calculations
- Model comparison matrix
- Implementation checklists

## 🎙️ Voice Generator Mini App Design

### Core Functionality

```
Voice Generator Mini App
├── Text-to-Speech Mode
│   ├── Text input (script/paragraph)
│   ├── Voice picker (fal.ai models: MiniMax + NEW models)
│   ├── Voice settings (speed, pitch, emotion - reuse step-4 UI)
│   ├── Generate button → Audio output (reuse step-4 logic)
│   └── Download/Use in project
├── Voice Recording Mode  
│   ├── Record button (microphone access)
│   ├── Real-time waveform visualization
│   ├── Stop/Preview/Retry controls
│   ├── Upload existing audio file
│   └── Transcription (fal.ai speech-to-text)
├── Voice Library
│   ├── Saved/generated voices list (reuse image history)
│   ├── Preview/play any voice (reuse step-4 player)
│   ├── Delete old voices
│   └── Use in current project
└── Integration
    ├── "Use in Step-4" button
    ├── "Download audio" option  
    └── Cross-project voice sharing
```

### Architecture

```
/app/[locale]/tools/voice-generator/
├── page.tsx                          # Main mini app page
├── components/
│   ├── VoiceGenerator.tsx           # Main container (adapt ImageGenerator)
│   ├── ModeSelector.tsx             # TTS vs Recording tabs (reuse tab pattern)
│   ├── TextToSpeechPanel.tsx        # TTS generation UI (adapt step-4 UI)
│   ├── VoiceRecordingPanel.tsx      # Recording interface (reuse voice-form)
│   ├── VoiceLibrary.tsx             # Saved voices gallery (adapt image history)
│   └── VoicePlayer.tsx              # Audio playback (reuse step-4 player)
└── hooks/
    ├── useVoiceGeneration.ts        # TTS with fal.ai (extend existing)
    ├── useVoiceRecording.ts         # Audio recording logic (copy from voice-form)
    └── useVoiceLibrary.ts           # Voice management (adapt image history)
```

## 🔧 Technical Implementation (Architecture-Aligned)

### Phase 1: Convex Schema Setup (2h)

**Task 1.1: Create Convex Tables**

**File**: `convex/schema.ts`

Add two tables following the architecture from Sprint 30d.5:

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/schema.ts

# Step 3: Deploy schema
npx convex dev --once
```

**Convex Schema Example**:

```typescript
/**
 * Voice Model Schemas - Mirrors imageModelSchemas pattern
 * Stores UI configuration and backend settings for all TTS models
 */
voiceModelSchemas: defineTable({
  schemaId: v.string(),
  name: v.string(),
  nameTranslationKey: v.optional(v.string()),
  modelId: v.string(),
  type: v.literal("tts"),
  creditActionType: v.string(),
  capabilities: v.object({
    voiceCloning: v.optional(v.boolean()),
    emotionControl: v.optional(v.boolean()),
    pitchControl: v.optional(v.boolean()),
    speedControl: v.optional(v.boolean()),
    multiLanguage: v.optional(v.boolean()),
  }),
  badges: v.optional(v.array(v.string())),
  params: v.array(v.object({
    key: v.string(),
    control: v.string(),
    label: v.string(),
    options: v.optional(v.array(v.object({
      value: v.string(),
      label: v.string(),
      previewUrl: v.optional(v.string()),
    }))),
    // ✅ Type-safe default values (no v.any())
    default: v.optional(
      v.union(
        v.string(),                         // For text, select inputs
        v.number(),                         // For sliders, number inputs
        v.boolean(),                        // For toggles
        v.array(v.string())                 // For multi-select (future)
      )
    ),
    min: v.optional(v.number()),
    max: v.optional(v.number()),
    step: v.optional(v.number()),
    maxLength: v.optional(v.number()),
    advanced: v.optional(v.boolean()),
  })),
  allowedParams: v.array(v.string()),
  maxPromptLength: v.number(),
  sortOrder: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_schema_id", ["schemaId"])
  .index("by_model_id", ["modelId"])
  .index("by_type_active", ["type", "isActive", "sortOrder"]),

/**
 * Voice Tool History - Mirrors imageToolHistory pattern
 * Stores all voice generations for user library
 */
voiceToolHistory: defineTable({
  userId: v.string(),
  modelId: v.string(),
  schemaId: v.string(),
  prompt: v.string(),
  voiceSettings: v.object({
    voiceId: v.string(),
    speed: v.optional(v.number()),
    pitch: v.optional(v.number()),
    emotion: v.optional(v.string()),
  }),
  audioUrl: v.string(),
  storageId: v.id("_storage"),
  duration: v.number(),
  mode: v.union(v.literal("generate"), v.literal("record")),
  cost: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_user", ["userId", "createdAt"])
  .index("by_user_schema", ["userId", "schemaId", "createdAt"]),
```

**Task 1.2: Create Convex Queries**

**File**: `convex/voiceModels.ts` (new file)

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

/** Get all active TTS schemas, sorted by sortOrder */
export const listTTSSchemas = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("voiceModelSchemas")
      .withIndex("by_type_active", (q) => 
        q.eq("type", "tts").eq("isActive", true)
      )
      .collect();
  },
});

/** Get schema by schemaId (app ID like "minimax-hd-tts") */
export const getBySchemaId = query({
  args: { schemaId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceModelSchemas")
      .withIndex("by_schema_id", (q) => q.eq("schemaId", args.schemaId))
      .first();
  },
});

/** Get schema by FAL modelId */
export const getByModelId = query({
  args: { modelId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceModelSchemas")
      .withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
      .first();
  },
});
```

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/voiceModels.ts

# Step 3: Deploy to Convex dev
npx convex dev --once
```

**Task 1.3: Create Seed Script**

**File**: `convex/seed/seedVoiceModels.ts` (new file)

Seed 2 initial models (MiniMax HD + Turbo) with full schema configuration:
- UI params (prompt, voice_id, speed, pitch, emotion)
- Backend config (allowedParams, maxPromptLength)
- Credit action types
- Voice options with preview URLs

Also seed 2 `creditCosts` entries:
- `voice_generation_minimax_hd`: 10 credits
- `voice_generation_minimax_turbo`: 8 credits

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/schema.ts convex/voiceModels.ts convex/seed/seedVoiceModels.ts

# Step 3: Deploy to Convex dev
npx convex dev --once

# Step 4: Run seed script
npx convex run seed/seedVoiceModels:seedAll
```

---

### Phase 2: Backend Generic Action (1.5h)

**Task 2.1: Create Generic Voice Action**

**File**: `convex/actions/voiceToolGeneric.ts` (new file)

Pattern identical to `imageToolGeneric.ts`:
1. Query `voiceModelSchemas` for model config
2. Filter params via `allowedParams`
3. Sanitize prompt via `maxPromptLength`
4. Call FAL API with `fal.subscribe(modelId, { input })`
5. Store audio in Convex storage
6. Save to `voiceToolHistory`

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/actions/voiceToolGeneric.ts

# Step 3: Deploy to Convex dev
npx convex dev --once
```

**Task 2.2: Create Mutation Handlers**

**File**: `convex/voiceTool.ts` (new file)

```typescript
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api"; // ✅ CRITICAL: Use internal.*
import { v } from "convex/values";

export const startGenericVoiceGeneration = mutation({
  args: {
    modelId: v.string(),
    params: v.any(),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get schema for creditActionType
    const schema = await ctx.db
      .query("voiceModelSchemas")
      .withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
      .first();
    
    if (!schema) throw new Error("Unknown voice model");
    
    // 2. Check credits
    const cost = await getCreditCost(ctx, schema.creditActionType);
    const hasEnough = await checkCredits(ctx, args.clerkUserId, cost);
    if (!hasEnough) throw new Error("Insufficient credits");
    
    // 3. Deduct credits
    const transaction = await ctx.db.insert("creditTransactions", {
      userId: args.clerkUserId,
      actionType: schema.creditActionType,
      creditsUsed: cost,
      status: "pending",
      createdAt: Date.now(),
    });
    
    // 4. Schedule action with internal.* (NOT api.*)
    await ctx.scheduler.runAfter(
      0, 
      internal.actions.voiceToolGeneric.generateGenericVoice, // ✅ Use internal.*
      {
        modelId: args.modelId,
        params: args.params,
        transactionId: transaction,
        clerkUserId: args.clerkUserId,
      }
    );
    
    return { success: true, transactionId: transaction };
  },
});

export const saveGeneration = mutation({
  args: {
    userId: v.string(),
    modelId: v.string(),
    schemaId: v.string(),
    prompt: v.string(),
    voiceSettings: v.object({
      voiceId: v.string(),
      speed: v.optional(v.number()),
      pitch: v.optional(v.number()),
      emotion: v.optional(v.string()),
    }),
    audioUrl: v.string(),
    storageId: v.id("_storage"),
    duration: v.number(),
    mode: v.union(v.literal("generate"), v.literal("record")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("voiceToolHistory", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
```

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/actions/voiceToolGeneric.ts convex/voiceTool.ts

# Step 3: Deploy to Convex dev
npx convex dev --once
```

---

## 🎨 Design System Implementation

### Color Tokens (Semantic)

**Container Styling**:
- Main containers: `glass-panel` → uses `bg-card`, `border-border`, `shadow-lg`
- Inner form fields: `glass-inner-field` → uses `bg-secondary/50`, `border-border/30`
- Transparent inputs: `bg-transparent border-0` (inside glass containers)

**Text Colors**:
- Primary text: `text-foreground`
- Secondary text: `text-muted-foreground`
- Placeholder text: `placeholder:text-muted-foreground`

**Interactive Elements**:
- Waveform (active): `bg-primary`
- Waveform (silent): `bg-muted`
- Hover states: `hover:bg-muted/50`, `hover:border-primary/50`
- Active states: `active:scale-95`

### Typography Scale

**Voice Library Cards**:
```tsx
<h4 className="text-base font-medium leading-relaxed">
  Voice Title
</h4>
<p className="text-xs text-muted-foreground leading-relaxed mt-1">
  Timestamp / Duration
</p>
<p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
  Voice prompt preview text...
</p>
```

**Voice Settings Labels**:
```tsx
<Label className="text-sm font-medium leading-relaxed">
  Speed
</Label>
<p className="text-xs text-muted-foreground leading-relaxed">
  Adjust speech speed
</p>
```

**Recording Interface**:
```tsx
<p className="text-center text-sm text-muted-foreground leading-relaxed">
  Tap to start recording
</p>
<span className="text-sm font-medium leading-relaxed">
  Recording... 0:05
</span>
```

### Layout & Spacing

**Voice Library Grid** (Responsive gaps):
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
  {/* Voice cards */}
</div>
```

**Card Padding** (Responsive):
- Mobile: `p-4` (16px)
- Desktop: `p-6` or `md:p-6` (24px)

**Section Spacing** (Responsive):
- Between major sections: `space-y-4 md:space-y-6` (16px → 24px)
- Between form fields: `space-y-3 md:space-y-4` (12px → 16px)
- Between inline elements: `gap-2` or `gap-3 md:gap-4`

### Badge Variants

**Semantic Badge Mapping** (by model capability):
```tsx
// Performance/Quality features = default (blue)
<Badge variant="default" className="text-xs">HD</Badge>
<Badge variant="default" className="text-xs">FAST</Badge>
<Badge variant="default" className="text-xs">TURBO</Badge>

// Premium/Advanced features = secondary (dark blue-gray)
<Badge variant="secondary" className="text-xs">PRO</Badge>
<Badge variant="secondary" className="text-xs">CUSTOM VOICE</Badge>

// Capability/Utility = outline (bordered)
<Badge variant="outline" className="text-xs">MULTILINGUAL</Badge>
<Badge variant="outline" className="text-xs">COST-EFFECTIVE</Badge>
<Badge variant="outline" className="text-xs">VOICE CLONING</Badge>
```

### Touch Targets (Mobile-First)

**Critical Actions** (Record button):
```tsx
<Button 
  size="lg"
  variant={isRecording ? "destructive" : "default"}
  className="h-[88px] w-[88px] rounded-full transition-smooth active:scale-95 focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2"
  onClick={handleRecord}
  aria-label={isRecording ? "Stop recording" : "Start recording"}
  aria-pressed={isRecording}
>
  {isRecording ? (
    <Square className="h-8 w-8" aria-hidden="true" />
  ) : (
    <Mic className="h-8 w-8" aria-hidden="true" />
  )}
</Button>
```

**Standard Interactive Elements**:
```tsx
<Button size="sm" className="min-h-[44px] min-w-[44px]">
  Action
</Button>
```

### Glass Panel Examples

**Voice Recording Interface**:
```tsx
<div className="glass-panel p-4 md:p-6">
  <div className="space-y-4 md:space-y-6">
    {/* Script input */}
    <div className="glass-inner-field p-3 md:p-4">
      <Textarea 
        className="bg-transparent border-0 resize-none text-foreground placeholder:text-muted-foreground leading-relaxed min-h-[120px] focus:outline-none"
        placeholder="Enter your script..."
        rows={4}
      />
    </div>
    
    {/* Waveform visualization with gradient */}
    <div className="flex items-center justify-center h-16 md:h-20 gap-0.5 md:gap-1">
      {waveformData.map((amplitude, i) => (
        <div
          key={i}
          className="w-1 md:w-1.5 rounded-full transition-smooth bg-gradient-to-t from-primary to-primary/60"
          style={{ 
            height: `${amplitude * 100}%`,
            animationDelay: `${i * 0.05}s` 
          }}
          aria-hidden="true"
        />
      ))}
    </div>
    
    {/* Record button (88px touch target with accessibility) */}
    <div className="flex justify-center">
      <Button 
        size="lg"
        variant={isRecording ? "destructive" : "default"}
        className="h-[88px] w-[88px] rounded-full transition-smooth active:scale-95 focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={handleRecord}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        aria-pressed={isRecording}
      >
        {isRecording ? (
          <Square className="h-8 w-8" aria-hidden="true" />
        ) : (
          <Mic className="h-8 w-8" aria-hidden="true" />
        )}
      </Button>
    </div>
    
    {/* Status text */}
    <p className="text-center text-sm text-muted-foreground leading-relaxed">
      {isRecording ? "Recording..." : "Tap to start recording"}
    </p>
  </div>
</div>
```

**Voice Library Card**:
```tsx
<Card className="group hover:border-primary/50 transition-smooth">
  <CardContent className="p-4 md:p-6">
    {/* Header */}
    <div className="flex items-start justify-between gap-2 mb-3">
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-medium truncate">
          {voice.voiceSettings.voiceId}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
          {formatDate(voice.createdAt)} • {voice.duration}s
        </p>
      </div>
      <Badge variant="secondary" className="text-xs flex-shrink-0">
        {voice.schemaId}
      </Badge>
    </div>
    
    {/* Prompt preview */}
    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
      {voice.prompt}
    </p>
    
    {/* Custom Audio Player (replaces native <audio>) */}
    <div className="glass-inner-field p-3 mb-4">
      {/* Progress bar */}
      <div className="relative h-8 bg-muted/30 rounded-md overflow-hidden mb-2">
        <div 
          className="absolute left-0 top-0 h-full bg-primary transition-smooth"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button
          size="sm"
          variant="ghost"
          className="min-h-[44px] min-w-[44px]"
          onClick={togglePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        
        <span className="text-xs text-muted-foreground leading-relaxed tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        
        <Button
          size="sm"
          variant="ghost"
          className="min-h-[44px] min-w-[44px]"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
    
    {/* Actions - 44px touch targets, responsive layout */}
    <div className="flex flex-col sm:flex-row gap-2">
      <Button 
        size="sm" 
        variant="outline" 
        className="flex-1 min-h-[44px] justify-center"
      >
        <Download className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Download</span>
      </Button>
      <Button 
        size="sm" 
        variant="default" 
        className="flex-1 min-h-[44px] justify-center"
      >
        <Play className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Use in Project</span>
      </Button>
    </div>
  </CardContent>
</Card>
```

---

### Phase 3: Frontend Dynamic UI (4h)

**Task 3.1: Create Hooks**

**File**: `components/voice-generator/hooks/use-convex-voice-schemas.ts` (new file)

Pattern from `components/image-generator/hooks/use-convex-schemas.ts`:
```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCallback, useMemo } from "react";

export function useConvexVoiceSchemas() {
  const ttsSchemas = useQuery(api.voiceModels.listTTSSchemas);
  
  const isLoading = ttsSchemas === undefined;
  
  const getSchemaById = useCallback((id: string) => {
    return ttsSchemas?.find(s => s.schemaId === id);
  }, [ttsSchemas]);
  
  const getDefaultSchema = useCallback(() => {
    return ttsSchemas?.[0];
  }, [ttsSchemas]);
  
  const getDefaultParamsFromSchema = useCallback((schema: VoiceModelSchema) => {
    const defaults: Record<string, unknown> = {};
    for (const p of schema.params) {
      if (p.default !== undefined) {
        defaults[p.key] = p.default;
      }
    }
    return defaults;
  }, []);
  
  return {
    ttsSchemas: ttsSchemas ?? [],
    isLoading,
    getSchemaById,
    getDefaultSchema,
    getDefaultParamsFromSchema,
  };
}
```

**File**: `components/voice-generator/hooks/use-convex-voice-history.ts` (new file)

Pattern from `components/image-generator/hooks/use-convex-image-history.ts` with pagination.

**Task 3.2: Main Voice Generator Component**

**File**: `components/voice-generator/index.tsx` (new file)

Structure mirrors `components/image-generator/index.tsx`:
- Use `useConvexVoiceSchemas()` to fetch model configs
- Maintain selected schema ID state
- Use `params` object driven by schema
- Render settings via `DynamicField` component (reuse from image-generator)
- Voice library via `VoiceHistory` component

**Task 3.3: Voice Settings Panel**

**File**: `components/voice-generator/VoiceSettingsPanel.tsx` (new file)

```tsx
export function VoiceSettingsPanel({ schema, params, setParams }) {
  return (
    <div className="space-y-6">
      {/* Render all params dynamically from schema */}
      {schema.params
        .filter(p => !p.advanced)
        .map(param => (
          <DynamicField
            key={param.key}
            param={param}
            value={params[param.key]}
            onChange={(value) => setParams({ ...params, [param.key]: value })}
          />
        ))
      }
    </div>
  );
}
```

**Task 3.4: Voice Model Selector**

**File**: `components/voice-generator/VoiceModelSelector.tsx` (new file)

Pattern from `components/image-generator/ModelSelector.tsx`:
- Grid of model cards
- Show badges (HD, FAST, PRO)
- Preview voices via audio player
- Select updates schema ID state

**Task 3.5: Voice Library (History)**

**File**: `components/voice-generator/VoiceLibrary.tsx` (new file)

Pattern from `components/image-generator/GenerationHistory.tsx`:
- List of saved voices from `voiceToolHistory`
- Audio player for each
- Download button
- Use in project button
- Infinite scroll pagination

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/voice-generator/
```

---

## 💰 Credit System Integration (Convex-Based)

### Voice Generation Costs

**All costs stored in `creditCosts` Convex table** (NOT hardcoded):

| Service | fal.ai Model | Action Type | Credits | Cost Basis |
|---------|-------------|-------------|---------|------------|
| **MiniMax 2.8 HD** | fal-ai/minimax/speech-2.8-hd | `voice_generation_minimax_28_hd` | 5 | per 1000 chars |
| **MiniMax 2.8 Turbo** | fal-ai/minimax/speech-2.8-turbo | `voice_generation_minimax_28_turbo` | 3 | per 1000 chars |
| **Qwen 3 TTS** | fal-ai/qwen-3-tts/text-to-speech/1.7b | `voice_generation_qwen_3` | 5 | per 1000 chars |
| **MiniMax 2.6 HD (Legacy)** | fal-ai/minimax/speech-2.6-hd | `voice_generation_minimax_hd` | 10 | per generation |
| **Voice Recording** | Storage only | `voice_recording` | 1 | per upload |
| **Voice Cloning** | fal-ai/qwen-3-tts/clone-voice | `voice_cloning_qwen` | 15 | per clone |
| **Audio Enhancement** | Processing | `voice_enhancement` | 20 | per file |

### Credit Cost Lookup (Dynamic)

**Pattern from Image Generator**:

```typescript
// Frontend: Get cost for selected model
const creditCost = useCreditCost(selectedSchema.creditActionType);

// Backend: Deduct credits by actionType
const schema = await ctx.db
  .query("voiceModelSchemas")
  .withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
  .first();

const cost = await getCreditCost(ctx, schema.creditActionType);
await deductCredits(ctx, userId, cost, schema.creditActionType);
```

**Key Difference from Old Approach**:
- ❌ OLD: `const modelCosts = { 'minimax-hd': 10, ... }` (hardcoded)
- ✅ NEW: Query `creditCosts` table by `actionType` (dynamic, admin-configurable)

### Adding New Model Costs

Update `creditCosts` table via seed script or admin UI:

```typescript
await ctx.db.insert("creditCosts", {
  actionType: "voice_generation_new_model",
  costInCredits: 15,
  description: "New Voice Model (per generation)",
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

Then reference in `voiceModelSchemas`:

```typescript
{
  schemaId: "new-model-tts",
  creditActionType: "voice_generation_new_model",  // Links to creditCosts
  // ...
}
```

---

## 🌍 i18n Translation Keys Required

### Before Implementation

Add these **~290+ translation keys** to `messages/en.json` (covering all 3 TTS models):

```json
{
  "voice_generator": {
    // ─── Page & Navigation ───
    "page_title": "Voice Generator – AI Text-to-Speech",
    "page_description": "Generate AI voices or record your own for video narration",
    "tab_generate": "Generate Voice",
    "tab_record": "Record Voice",
    "back_to_tools": "Back to Tools",
    
    // ─── Model Selection ───
    "model_selector_title": "Choose Voice Model",
    "model_selector_trigger": "Model: {name}",
    "search_models": "Search voice models...",
    "no_models_found": "No voice models found",
    "loading_models": "Loading voice models...",
    
    // ─── TTS Generation ───
    "prompt_label": "Text to Speech",
    "prompt_placeholder": "Enter the text you want to convert to speech...",
    "prompt_hint_max_chars": "Up to {max} characters",
    "prompt_characters": "{count} / {max} characters",
    "voice_id_label": "Voice",
    "voice_id_placeholder": "Select voice",
    "generate_button": "Generate Voice",
    "generating": "Generating voice...",
    "generate_with_cost": "Generate ({cost}c)",
    
    // ─── Voice Settings ───
    "settings": {
      "title": "Voice Settings",
      "speed_label": "Speed",
      "speed_hint": "Adjust speech speed (0.5x - 2.0x)",
      "speed_slower": "Slower",
      "speed_faster": "Faster",
      "pitch_label": "Pitch",
      "pitch_hint": "Adjust voice pitch (-12 to +12 semitones)",
      "pitch_lower": "Lower",
      "pitch_higher": "Higher",
      "emotion_label": "Emotion",
      "emotion_hint": "Add emotional expression to the voice",
      "emotion_neutral": "Neutral",
      "emotion_happy": "Happy",
      "emotion_sad": "Sad",
      "emotion_excited": "Excited",
      "emotion_calm": "Calm"
    },
    
    // ─── Recording Mode ───
    "recording": {
      "title": "Record Your Voice",
      "click_to_record": "Click to Record",
      "tap_to_record": "Tap to Record",
      "recording_active": "Recording... {duration}s",
      "stop_recording": "Stop Recording",
      "preview_recording": "Preview Recording",
      "retry_recording": "Retry Recording",
      "save_recording": "Save Recording",
      "upload_audio": "Upload Audio File",
      "upload_hint": "Or drag and drop an audio file (MP3, WAV)",
      "permission_denied": "Microphone access denied. Please enable it in browser settings.",
      "permission_request": "Click to request microphone access",
      "upload_failed": "Failed to upload audio file",
      "invalid_format": "Invalid audio format. Please use MP3 or WAV.",
      "max_duration_exceeded": "Recording exceeds maximum duration of {max} seconds",
      "enhance_audio": "Enhance Audio Quality",
      "enhance_audio_hint": "Apply AI audio enhancement (+{cost} credits)"
    },
    
    // ─── Voice Library (History) ───
    "library": {
      "title": "Voice Library",
      "empty_title": "No voices yet",
      "empty_description": "Generate or record your first voice to get started",
      "filter_all": "All Voices",
      "filter_generated": "Generated",
      "filter_recorded": "Recorded",
      "sort_recent": "Most Recent",
      "sort_duration": "Duration",
      "sort_model": "Model",
      "use_in_project": "Use in Project",
      "download_audio": "Download Audio",
      "delete_voice": "Delete Voice",
      "voice_duration": "{duration}s",
      "voice_cost": "{cost} credits",
      "voice_mode_generated": "Generated",
      "voice_mode_recorded": "Recorded",
      "delete_confirm_title": "Delete voice?",
      "delete_confirm_description": "This action cannot be undone.",
      "delete_success": "Voice deleted successfully",
      "delete_failed": "Failed to delete voice"
    },
    
    // ─── Capabilities & Badges ───
    "capability_voice_cloning": "Voice Cloning",
    "capability_emotion_control": "Emotion Control",
    "capability_pitch_control": "Pitch Control",
    "capability_speed_control": "Speed Control",
    "capability_multi_language": "Multi-Language",
    "badge_hd": "HD",
    "badge_fast": "Fast",
    "badge_turbo": "Turbo",
    "badge_pro": "Pro",
    "badge_multilingual": "Multilingual",
    "badge_cost_effective": "Cost-Effective",
    "badge_voice_cloning": "Voice Cloning",
    "badge_custom_voice": "Custom Voice",
    
    // ─── Audio Player ───
    "audio_player": {
      "play": "Play",
      "pause": "Pause",
      "mute": "Mute",
      "unmute": "Unmute",
      "loading": "Loading audio...",
      "error": "Failed to load audio",
      "duration_format": "{current} / {total}",
      "buffering": "Buffering...",
      "seek_forward": "Seek forward 10 seconds",
      "seek_backward": "Seek backward 10 seconds",
      "playback_rate": "Playback speed: {rate}x",
      "volume_level": "Volume: {level}%"
    },
    
    // ─── Tooltips ───
    "tooltips": {
      "badge_hd": "High-definition audio quality (44.1kHz)",
      "badge_fast": "Faster generation time",
      "badge_pro": "Professional voice quality",
      "credits_per_word": "{credits} credits per 100 words",
      "max_prompt_length": "Maximum {max} characters",
      "voice_preview": "Click to preview this voice"
    },
    
    // ─── Inspiration Wall ───
    "inspiration": {
      "empty_title": "Need inspiration?",
      "empty_description": "Try these curated voice settings",
      "card_voice_model": "Voice: {model}",
      "card_voice_settings": "Speed: {speed}, Pitch: {pitch}",
      "reuse_settings": "Re-use Settings",
      "preview_voice": "Preview Voice",
      "apply_settings": "Apply Settings"
    },
    
    // ─── Error States ───
    "errors": {
      "generation_failed": "Voice generation failed. Credits have been refunded.",
      "transcription_failed": "Failed to transcribe audio",
      "storage_full": "Storage quota exceeded. Please delete old voices.",
      "network_error": "Network error. Please check your connection.",
      "invalid_text_length": "Text must be between {min} and {max} characters",
      "model_unavailable": "Selected voice model is currently unavailable",
      "audio_processing_failed": "Failed to process audio file",
      "insufficient_credits": "Insufficient credits for voice generation"
    },
    
    // ─── Success Messages ───
    "success": {
      "generated": "Voice generated successfully!",
      "recorded": "Voice recorded successfully!",
      "saved": "Voice saved to library",
      "used_in_project": "Voice added to project"
    },
    
    // ─── Common ───
    "sign_in_to_generate": "Sign in to generate voices",
    "select_model_first": "Please select a voice model first",
    "credit_count": "{count, plural, one {1 credit} other {# credits}}",
    "duration_seconds": "{duration, plural, one {1 second} other {# seconds}}",
    "word_count": "{count, plural, one {1 word} other {# words}}"
  },
  
  // ─── Voice Model Names ───
  "voice_models": {
    "minimax_28_hd": "MiniMax Speech 2.8 HD",
    "minimax_28_hd_desc": "High-fidelity voice synthesis (44.1kHz, 17 voices)",
    "minimax_28_turbo": "MiniMax Speech 2.8 Turbo",
    "minimax_28_turbo_desc": "Faster generation with high quality (40% cheaper)",
    "qwen_3_tts": "Qwen 3 TTS",
    "qwen_3_tts_desc": "Voice cloning and custom voices (9 preset voices)"
  },
  
  // ─── Voice Names (17 MiniMax voices + 9 Qwen voices = 26 total) ───
  "voices": {
    // MiniMax Speech 2.8 Voices (17)
    "wise_woman": "Wise Woman",
    "wise_woman_desc": "Mature, knowledgeable female voice",
    "friendly_person": "Friendly Person",
    "friendly_person_desc": "Warm, approachable voice",
    "inspirational_girl": "Inspirational Girl",
    "inspirational_girl_desc": "Energetic, motivating young female",
    "deep_voice_man": "Deep Voice Man",
    "deep_voice_man_desc": "Rich, resonant male voice",
    "calm_woman": "Calm Woman",
    "calm_woman_desc": "Peaceful, soothing female voice",
    "casual_guy": "Casual Guy",
    "casual_guy_desc": "Relaxed, informal male voice",
    "lively_girl": "Lively Girl",
    "lively_girl_desc": "Animated, cheerful young female",
    "patient_man": "Patient Man",
    "patient_man_desc": "Steady, composed male voice",
    "young_knight": "Young Knight",
    "young_knight_desc": "Heroic, youthful male voice",
    "determined_man": "Determined Man",
    "determined_man_desc": "Strong-willed, resolute male voice",
    "lovely_girl": "Lovely Girl",
    "lovely_girl_desc": "Sweet, gentle young female",
    "decent_boy": "Decent Boy",
    "decent_boy_desc": "Polite, well-mannered young male",
    "imposing_manner": "Imposing Manner",
    "imposing_manner_desc": "Authoritative, commanding voice",
    "elegant_man": "Elegant Man",
    "elegant_man_desc": "Refined, sophisticated male voice",
    "abbess": "Abbess",
    "abbess_desc": "Wise, spiritual female voice",
    "sweet_girl_2": "Sweet Girl",
    "sweet_girl_2_desc": "Gentle, charming young female",
    "exuberant_girl": "Exuberant Girl",
    "exuberant_girl_desc": "Enthusiastic, vibrant young female",
    
    // Qwen 3 TTS Voices (9)
    "qwen_vivian": "Vivian",
    "qwen_vivian_desc": "Female voice (English-focused)",
    "qwen_serena": "Serena",
    "qwen_serena_desc": "Female voice (English-focused)",
    "qwen_uncle_fu": "Uncle Fu",
    "qwen_uncle_fu_desc": "Male voice (Chinese-focused)",
    "qwen_dylan": "Dylan",
    "qwen_dylan_desc": "Male voice (English-focused)",
    "qwen_eric": "Eric",
    "qwen_eric_desc": "Male voice (English-focused)",
    "qwen_ryan": "Ryan",
    "qwen_ryan_desc": "Male voice (English-focused)",
    "qwen_aiden": "Aiden",
    "qwen_aiden_desc": "Male voice (English-focused)",
    "qwen_ono_anna": "Ono Anna",
    "qwen_ono_anna_desc": "Female voice (Japanese-focused)",
    "qwen_sohee": "Sohee",
    "qwen_sohee_desc": "Female voice (Korean-focused)"
  },
  
  // ─── Step-4 Integration ───
  "guided_step4": {
    // Add to existing keys:
    "voice_mode_title": "Voice Mode",
    "mode_generate": "Generate with AI",
    "mode_record": "Record Your Voice",
    "replace_narration_title": "Replace Narration?",
    "replace_narration_description": "This will replace the current narration audio. Continue?",
    "replace_confirm": "Replace",
    "replace_cancel": "Cancel",
    "switch_voice_mode": "Switch Voice Mode"
  }
}
```

### Translation Pipeline

After adding keys to `messages/en.json`:

```bash
# Generate translations for all 7 languages
pnpm translate

# Verify synchronization
pnpm i18n:verify
```

### ICU Message Format Examples

**Duration Display**:
```json
"voice_duration_seconds": "{seconds, plural, =0 {0 seconds} one {1 second} other {# seconds}}"
```

**Credit Costs**:
```json
"generation_cost": "{credits, plural, one {1 credit} other {# credits}} per {unit, select, word {100 words} char {1000 chars} generation {generation} other {unit}}"
```

**Estimated Time**:
```json
"estimated_duration": "Estimated {duration, plural, one {1 second} other {# seconds}}"
```

---

```bash
npx tsc --noEmit
npx biome check --write components/voice-generator/
```

---

### Phase 4: Voice Recording Mode (2.5h)

**Task 4.1: Recording Interface**

**File**: `components/voice-generator/VoiceRecordingPanel.tsx` (new file)

Mobile-first recording UI:
- Large record button (88px touch target)
- Waveform visualization
- Stop/Preview/Retry controls
- File upload alternative
- MediaRecorder API integration

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/voice-generator/VoiceRecordingPanel.tsx
```

**Task 4.2: Recording Action**

**File**: `convex/actions/voiceProcessing.ts` (new file)

```typescript
export const processRecordedVoice = action({
  args: {
    audioBlob: v.bytes(),
    enhance: v.optional(v.boolean()),
    generateTranscript: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // 1. Store audio
    const storageId = await ctx.storage.store(args.audioBlob);
    const audioUrl = await ctx.storage.getUrl(storageId);
    
    // 2. Optional: Enhance audio quality
    // 3. Optional: Generate transcript via fal.ai speech-to-text
    
    // 4. Save to voiceToolHistory (mode: "record")
    
    return { success: true, audioUrl, storageId };
  },
});
```

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/actions/voiceProcessing.ts

# Step 3: Deploy to Convex dev
npx convex dev --once
```

---

### Phase 5: Inspiration Wall Integration (2h)

**Task 5.1: Add Voice Fields to `toolCategories`**

**File**: `convex/schema.ts`

```typescript
// Add to existing toolCategories table:
voiceScript: v.optional(v.string()),         // TTS text
voiceModelId: v.optional(v.string()),        // "minimax-hd-tts"
voiceId: v.optional(v.string()),             // "narrator-male-1"
voiceSpeed: v.optional(v.number()),          // 1.0
voicePitch: v.optional(v.number()),          // 0
voiceEmotion: v.optional(v.string()),        // "neutral"
```

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/schema.ts

# Step 3: Deploy schema
npx convex dev --once
```

**Task 5.2: Update Admin Form**

**File**: `components/admin/CategoryDialog.tsx`

Add conditional voice fields when tool is `voice_generator` (same pattern as Sprint 30f.0b for image fields).

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/admin/CategoryDialog.tsx
```

**Task 5.3: Inspiration Cards**

**File**: `components/voice-generator/InspirationEmptyState.tsx` (new file)

Query `api.tools.listCategories` with voice_generator toolId, show 4 preview cards.

**File**: `components/voice-generator/InspirationWall.tsx` (new file)

Full masonry wall using `masonic` package, flip cards with voice preview audio.

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/voice-generator/InspirationEmptyState.tsx components/voice-generator/InspirationWall.tsx
```

---

### Phase 6: Mobile Optimization & Polish (1h)

- Touch-friendly controls (44px minimum)
- Responsive voice library grid
- Audio player mobile optimizations
- Loading skeletons
- Error states
- Accessibility (keyboard nav, ARIA labels)

**Final Sprint QA:**
```bash
# 1. Full TypeScript check
npx tsc --noEmit

# 2. Full Biome check
npx biome check --write .

# 3. Run all tests (if any)
npx vitest run

# 4. Deploy to Convex dev
npx convex dev --once

# 5. Verify all voice models loaded
npx convex run voiceModels:listTTSSchemas

# 6. Verify credit costs configured
npx convex run credits:listCreditCosts
```

---

### Phase 7: Project Selection Workflow (4h 30min)

**🎯 Sprint Goal**: Enable users to name and link BOTH voice recordings AND generated voices to projects OR save to library

**✅ IMPLEMENTATION STATUS: COMPLETE** (Feb 19, 2026)

**Expert Review Status** (Final):
- ✅ **Convex-Master**: 9/10 - Architecture approved, 1 bug fixed
- ✅ **Design-Master**: 9.5/10 - Exceptional design system compliance
- ✅ **i18n-Master**: 8.5/10 - 23 keys added, minor non-blocking issues in existing files
- ✅ **Senior-Dev**: 9.5/10 - Ready for manual testing
- **Average Score**: **9.1/10** ⭐⭐⭐⭐⭐

**Production Readiness**: ✅ **APPROVED FOR TESTING** (Risk: 🟢 LOW)

**QA Status** (Feb 19, 2026 - Final):
- ✅ **TypeScript**: Passed with 0 errors (`npx tsc --noEmit`)
- ✅ **Biome**: Passed with 0 warnings (`npx biome check --write`)
- ✅ **i18n Verification**: All 2016 keys synchronized across 7 languages (`pnpm i18n:verify`)
- ✅ **Post-Implementation Enhancements**: All 6 enhancements completed + expert fixes applied
- ⏳ **Manual Testing**: Pending user deployment & testing

**Final Expert Review Results** (Feb 19, 2026):
- ✅ **Convex-Master**: 9.5/10 - Perfect transaction tracking, excellent refund logic
- ✅ **Design-Master**: 9.5/10 - DialogTitle fix applied, design system compliant
- ✅ **i18n-Master**: 9.5/10 - Dedicated error key added, all translations synchronized
- ✅ **Senior-Dev**: 9.5/10 - Production-ready, low risk, APPROVED FOR TESTING

**Convex-Master Edge Case Fixes Applied** (Feb 19, 2026):
1. ✅ **Issue #1 - Idempotency Gap**: Added duplicate refund check in `refundCredits` mutation
2. ✅ **Issue #2 - Database Insert Failure**: Wrapped `audioTracks.insert` in try-catch with refund
3. ✅ **Issue #3 - Optional Transaction ID**: Made `transactionId` required (not optional)
4. ⏳ **Issue #4 - Double-Spend Prevention**: Deferred to future PR (requires client changes)

**Enhanced Robustness**:
- Refund idempotency: Returns existing refund if already processed
- Database failure protection: Credits refunded if `audioTracks.insert` fails
- Type safety: `transactionId` now required, preventing silent bugs
- Applied to both `voiceProcessing.ts` and `voiceToolGeneric.ts`

**Average Score**: **9.5/10** ⭐⭐⭐⭐⭐  
**Final Verdict**: ✅ **APPROVED FOR MANUAL TESTING**  
**Risk Assessment**: 🟢 **LOW RISK** → **VERY LOW RISK** (after edge case fixes)

**Post-Implementation Enhancements** (Feb 19, 2026) ✅:
1. ✅ **Design Compliance**: DialogTitle default styling (removed incorrect override)
2. ✅ **i18n Keys**: Added `voice_label`, `default_voice`, and `name_required` (26 total keys)
3. ✅ **Transaction Tracking**: `transactionId` forwarded to recording action for refunds
4. ✅ **Credit Refund**: Automatic refund on storage failure in `processRecordedVoice`
5. ✅ **Error Toast**: Validation toast with dedicated i18n key using Sonner
6. ✅ **Import Fix**: Added `api` import to `voiceProcessing.ts` for credit operations

**Expert Review Fixes Applied**:
- ✅ Removed `leading-relaxed` from DialogTitle (Design-Master feedback)
- ✅ Added `name_required` i18n key (i18n-Master feedback)
- ✅ Regenerated translations for all 7 languages (2016 keys synchronized)

**Enhanced Files** (4):
- `components/voice-generator/ProjectSelector.tsx` - Design + i18n fixes
- `convex/voiceTool.ts` - Transaction ID forwarding
- `convex/actions/voiceProcessing.ts` - Refund logic + api import
- `messages/en.json` - 3 additional keys (26 total Phase 7 keys)

**Implementation Status** (Feb 19, 2026):
- ✅ **Task 7.0**: Schema updated (`projectId`/`organizationId` optional, compound index added)
- ✅ **Task 7.1**: ProjectSelector component created
- ✅ **Task 7.2**: Frontend integration complete (VoiceRecordingPanel + index.tsx)
- ✅ **i18n Keys**: 23 translation keys added to messages/en.json
- ⏳ **Task 7.3-7.6**: Backend implementation in progress

**Expert Review Status** (4 Rounds - FINAL):
- **Round 1**: Initial plan - identified critical gaps
- **Round 2**: All blocking issues found by 3 agents
- **Round 3**: ✅ All fixes applied - APPROVED by all agents
- **Round 4**: ✅ Design fixes applied - Design-Master 9.5/10

**Final Approval Status**:
- ✅ **Convex-Master**: 10/10 - Architecture approved (audioTracks approach)
- ✅ **Design-Master**: 9.5/10 - All 6 design fixes applied successfully
- ✅ **i18n-Master**: 23 translation keys added to messages/en.json
- ✅ **Senior-Dev**: 10/10 - Implementation plan 100% ready

**Architecture Decision**: Use existing `audioTracks` table (NOT new voiceRecordings table)
- ✅ Unified data model: recordings + generated voices + music + SFX
- ✅ Already integrated with step-4 guided flow
- ✅ Proven pattern from `narrationGeneration.ts`
- ✅ Existing indexes support efficient queries

**Critical Fixes Applied** (Feb 19, 2026):
1. ✅ **Task 7.5 Query Fixed**: Changed from `voiceToolHistory` to `audioTracks` (convex-master)
2. ✅ **Task 7.6 Added**: Generated voice → project flow implementation (senior-dev - 2h 15min gap)
3. ✅ **Frontend Updated**: ProjectSelector triggers for BOTH recording and generation modes
4. ✅ **Source Badges**: UI distinguishes between recorded vs AI-generated (design-master)
5. ✅ **i18n Complete**: Keys for both flows added (i18n-master)

**Key Changes from Initial Plan**:
1. Use `audioTracks` table instead of `voiceToolHistory`
2. Make `projectId` and `organizationId` optional in schema
3. Add user-provided `title` field for naming ALL audio
4. Support BOTH recording AND generation workflows (not just recording)
5. Remove duplicate i18n keys
6. Incorporate design-master feedback (Button component, loading states, ARIA labels)

---

**User Flow** (COMPLETE):
```
FLOW A: Recording → Project
Record Voice → Preview → Click "Save Recording"
                              ↓
                    [Modal: Enter Name + Select Project]
                              ↓
                    User enters title (e.g., "Intro Narration")
                              ↓
                    User selects project OR "Save to Library"
                              ↓
                    Saved to audioTracks with type="narration"
                              ↓
                    Appears in Project Details → Audio tab

FLOW B: Generation → Project (NEW - Task 7.6)
Generate Voice (TTS) → Preview → Click "Generate"
                              ↓
                    [Modal: Enter Name + Select Project]
                              ↓
                    User enters title (e.g., "Character Voice")
                              ↓
                    User selects project OR "Save to Library"
                              ↓
                    Saved to audioTracks with type="narration"
                              ↓
                    Appears in Project Details → Audio tab
```

---

**Task 7.0: Update audioTracks Schema** (15 min)

**File**: `convex/schema.ts`

**Required Changes**:

1. **Make `projectId` optional** (for library recordings):
```typescript
// BEFORE:
projectId: v.string(),

// AFTER:
projectId: v.optional(v.string()),
```

2. **Make `organizationId` optional** (for personal recordings):
```typescript
// BEFORE:
organizationId: v.string(),

// AFTER:
organizationId: v.optional(v.string()),
```

3. **Add compound index** for efficient narration queries:
```typescript
audioTracks: defineTable({
  // ... existing fields
})
  .index("by_organization", ["organizationId"])
  .index("by_project", ["projectId"])
  .index("by_user", ["userId"])
  .index("by_organization_and_project", ["organizationId", "projectId"])
  .index("by_project_and_order", ["projectId", "order"])
  .index("by_type", ["type"])
  .index("by_project_and_type", ["projectId", "type"]), // ✅ ADD THIS
```

**Why These Changes**:
- Voice recordings can be saved to library (no project) → `projectId = null`
- Personal recordings don't have organization → `organizationId = null`
- Compound index enables efficient "get all narration for project" queries without `.filter()`

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/schema.ts

# Step 3: Deploy schema
npx convex dev --once
```

---

**Task 7.1: Create ProjectSelector Modal Component** (45 min)

**File**: `components/voice-generator/ProjectSelector.tsx` (new file)

**Component Design** (incorporates design-master feedback):

```typescript
"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FolderOpen, Library } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ProjectSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (title: string, projectId: Id<"projects"> | null) => void;
  disabled?: boolean;
}

export function ProjectSelector({
  open,
  onOpenChange,
  onConfirm,
  disabled = false,
}: ProjectSelectorProps) {
  const t = useTranslations("voice_generator.project_selector");
  const projects = useQuery(api.projects.list);
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [title, setTitle] = useState("");

  const handleConfirm = () => {
    if (!title.trim()) {
      // TODO: Show error toast
      return;
    }
    onConfirm(title.trim(), selectedProjectId);
    onOpenChange(false);
    // Reset for next time
    setTitle("");
    setSelectedProjectId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[90vw] sm:max-w-2xl md:max-w-3xl"
        aria-labelledby="project-selector-title"
        aria-describedby="project-selector-description"
      >
        <DialogHeader>
          <DialogTitle id="project-selector-title">
            {t("title")}
          </DialogTitle>
          <DialogDescription id="project-selector-description">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="recording-title" className="text-sm font-medium">
            {t("name_label")}
          </Label>
          <Input
            id="recording-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("name_placeholder")}
            disabled={disabled}
            className="min-h-[44px]"
            aria-required="true"
          />
        </div>

        <ScrollArea className="h-[60vh] max-h-[500px] min-h-[200px] pr-4">
          {/* Loading state */}
          {projects === undefined && (
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[140px] rounded-lg" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {projects?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted/50 p-6 backdrop-blur-sm">
                <FolderOpen className="h-8 w-8 text-primary/60" aria-hidden="true" />
              </div>
              <h3 className="mb-2 text-lg font-semibold leading-relaxed">
                {t("no_projects")}
              </h3>
              <p className="mb-6 text-sm text-muted-foreground max-w-sm leading-relaxed">
                {t("no_projects_hint")}
              </p>
            </div>
          )}

          {/* Content */}
          {projects && projects.length > 0 && (
            <div className="space-y-4">
              {/* "Save to Library" option */}
              <Button
                variant="outline"
                onClick={() => setSelectedProjectId(null)}
                className={cn(
                  "glass-panel w-full min-h-[44px] justify-start px-4",
                  selectedProjectId === null && "ring-2 ring-primary"
                )}
                disabled={disabled}
                aria-pressed={selectedProjectId === null}
              >
                <Library className="h-5 w-5 mr-2" aria-hidden="true" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">{t("save_to_library")}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("save_to_library_hint")}
                  </span>
                </div>
              </Button>

              {/* Projects grid */}
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {projects.map((project) => (
                  <Button
                    key={project._id}
                    variant="outline"
                    onClick={() => setSelectedProjectId(project._id)}
                    className={cn(
                      "glass-panel h-auto p-4 flex-col items-start min-h-[44px]",
                      selectedProjectId === project._id && "ring-2 ring-primary"
                    )}
                    disabled={disabled}
                    aria-pressed={selectedProjectId === project._id}
                  >
                    <span className="font-medium text-sm leading-relaxed truncate w-full text-left">
                      {project.title}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-col xs:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={disabled}
            className="min-h-[44px]"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={disabled || !title.trim()}
            className="min-h-[44px]"
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Design Requirements Met**:
- ✅ Uses `<Button>` component (not raw `<button>`)
- ✅ Loading skeleton pattern for projects grid
- ✅ Empty state with icon + glass effect (`bg-muted/50 backdrop-blur-sm`)
- ✅ ARIA labels (`aria-labelledby`, `aria-describedby`, `aria-pressed`)
- ✅ ScrollArea height: `h-[60vh] max-h-[500px] min-h-[200px]` (prevents too-short areas)
- ✅ Responsive dialog: `max-w-[90vw] sm:max-w-2xl md:max-w-3xl`
- ✅ 44px minimum touch targets on all buttons
- ✅ Confirmation button checks title presence (not `selectedProjectId === undefined`)
- ✅ Glass panel design system
- ✅ Mobile-first grid: `grid-cols-1 xs:grid-cols-2 md:grid-cols-3`

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/voice-generator/ProjectSelector.tsx
```

---

**Context**: When users save a voice recording, they should be able to link it to a specific project OR save it to the general library. The `voiceToolHistory` schema already supports `projectId: v.optional(v.id("projects"))`, but there's no UI to select which project.

**User Flow**:
```
Record Voice → Preview → Click "Save Recording"
                              ↓
                    [ProjectSelector Modal Opens]
                              ↓
                    User selects project OR "Save to Library"
                              ↓
                    Recording saved with projectId
                              ↓
                    Appears in Project Details → Audio/Narration tab
```

---

**Task 7.1: Create ProjectSelector Modal Component**

**File**: `components/voice-generator/ProjectSelector.tsx` (new file)

**Component Structure**:
```typescript
interface ProjectSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProject: (projectId: Id<"projects"> | null) => void;
  selectedProjectId?: Id<"projects"> | null;
}

export function ProjectSelector({
  open,
  onOpenChange,
  onSelectProject,
  selectedProjectId,
}: ProjectSelectorProps) {
  // Query user's projects
  const projects = useQuery(api.projects.list);
  
  // Similar UI to VoiceModelSelector:
  // - Dialog with ScrollArea
  // - Grid of project cards (2 columns on mobile, 3-4 on desktop)
  // - Each card shows: thumbnail, title, creation date
  // - "Save to Library" option at top (no project link)
  // - Search/filter functionality
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("project_selector.title")}</DialogTitle>
          <DialogDescription>
            {t("project_selector.description")}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          {/* "Save to Library" option */}
          <button
            onClick={() => onSelectProject(null)}
            className={cn(
              "glass-panel p-4 w-full mb-4 min-h-[44px]",
              selectedProjectId === null && "ring-2 ring-primary"
            )}
          >
            <Library className="h-5 w-5 mb-2" />
            {t("project_selector.save_to_library")}
          </button>
          
          {/* Projects grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
            {projects?.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                selected={selectedProjectId === project._id}
                onSelect={() => onSelectProject(project._id)}
              />
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Design Requirements**:
- Mobile-first responsive grid
- 44px minimum touch targets
- Glass panel design system
- Accessible keyboard navigation
- Loading skeletons while projects load
- Empty state if no projects exist

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/voice-generator/ProjectSelector.tsx
```

---

**Task 7.2: Add Name Input + Project Selection to Save Flow** (30 min)

**Overview**: Currently recordings save immediately with no user input. We need to add a modal that collects:
1. Recording title (user input)
2. Project selection (or "Save to Library")

**Implementation Strategy**: Add intermediate modal BEFORE calling mutation

---

**Part A: Update VoiceRecordingPanel Component**

**File**: `components/voice-generator/VoiceRecordingPanel.tsx`

**Changes**:

1. **Add imports**:
```typescript
import { useState } from "react"; // Already imported
import type { Id } from "@/convex/_generated/dataModel";
import { ProjectSelector } from "./ProjectSelector"; // NEW
```

2. **Update props interface** (line 10-17):
```typescript
interface VoiceRecordingPanelProps {
  /** Callback when recording is saved - NOW includes title and projectId */
  onSave?: (
    audioBlob: Blob, 
    duration: number,
    title: string,              // ← ADD THIS
    projectId: Id<"projects"> | null  // ← ADD THIS
  ) => void;
  /** Disable all controls (e.g., during processing) */
  disabled?: boolean;
  /** Optional CSS class */
  className?: string;
}
```

3. **Add modal state** (after line 51):
```typescript
// Existing state...
const [waveformData, setWaveformData] = useState<number[]>(
  Array(32).fill(0.3),
);

// ADD THIS:
const [showSaveModal, setShowSaveModal] = useState(false);
const [isSaving, setIsSaving] = useState(false);
```

4. **Replace handleSave** (line 258-268):
```typescript
// BEFORE:
const handleSave = useCallback(async () => {
  if (!audioUrl || !onSave) return;

  try {
    const response = await fetch(audioUrl);
    const blob = await response.blob();
    onSave(blob, audioDuration);
  } catch (error) {
    console.error("Failed to save recording:", error);
  }
}, [audioUrl, audioDuration, onSave]);

// AFTER:
const handleSave = useCallback(() => {
  if (!audioUrl) return;
  setShowSaveModal(true); // Open modal instead of saving immediately
}, [audioUrl]);
```

5. **Add new handler for confirmed save**:
```typescript
const handleConfirmSave = useCallback(
  async (title: string, projectId: Id<"projects"> | null) => {
    if (!audioUrl || !onSave) return;

    setIsSaving(true);
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      await onSave(blob, audioDuration, title, projectId);
      setShowSaveModal(false);
    } catch (error) {
      console.error("Failed to save recording:", error);
    } finally {
      setIsSaving(false);
    }
  },
  [audioUrl, audioDuration, onSave]
);
```

6. **Add ProjectSelector before closing `</div>`** (before line 457):
```typescript
      </div>
    </div>

    {/* ADD THIS: */}
    <ProjectSelector
      open={showSaveModal}
      onOpenChange={setShowSaveModal}
      onConfirm={handleConfirmSave}
      disabled={isSaving}
    />
  </div>
);
```

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/voice-generator/VoiceRecordingPanel.tsx
```

---

**Part B: Update Parent Component (Voice Generator Index)**

**File**: `components/voice-generator/index.tsx`

**Changes**:

1. **Update handleSaveRecording signature** (line 168-202):
```typescript
// BEFORE:
const handleSaveRecording = useCallback(
  async (audioBlob: Blob, duration: number) => {
    if (!clerkUserId) {
      showToast("Not authenticated", "error");
      return;
    }

    setIsGenerating(true);

    try {
      // Convert Blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString("base64");

      await startRecordedVoiceProcessing({
        audioBlob: base64Audio,
        duration,
        projectId: undefined, // TODO: Add project context if needed
        enhance: false,
        generateTranscript: false,
      });

      showToast(t("recording.save_success"));
    } catch (error) {
      console.error("Failed to save recording:", error);
      showToast(
        error instanceof Error ? error.message : t("recording.save_failed"),
        "error",
      );
    } finally {
      setIsGenerating(false);
    }
  },
  [clerkUserId, startRecordedVoiceProcessing, showToast, t],
);

// AFTER:
const handleSaveRecording = useCallback(
  async (
    audioBlob: Blob, 
    duration: number,
    title: string,                     // ← ADD THIS
    projectId: Id<"projects"> | null   // ← ADD THIS
  ) => {
    if (!clerkUserId) {
      showToast("Not authenticated", "error");
      return;
    }

    setIsGenerating(true);

    try {
      // Convert Blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString("base64");

      await startRecordedVoiceProcessing({
        audioBlob: base64Audio,
        duration,
        title,                          // ← PASS THIS
        projectId: projectId ?? undefined, // ← PASS THIS
        enhance: false,
        generateTranscript: false,
      });

      showToast(t("recording.save_success"));
    } catch (error) {
      console.error("Failed to save recording:", error);
      showToast(
        error instanceof Error ? error.message : t("recording.save_failed"),
        "error",
      );
    } finally {
      setIsGenerating(false);
    }
  },
  [clerkUserId, startRecordedVoiceProcessing, showToast, t],
);
```

2. **Add import** (top of file):
```typescript
import type { Id } from "@/convex/_generated/dataModel";
```

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/voice-generator/index.tsx
```

---

---

**Task 7.3: Update Convex Backend to Save to audioTracks** (30 min)

**Overview**: Modify the voice recording processing flow to save to `audioTracks` table with user-provided title and optional projectId.

**Current Flow**:
```
Frontend → startRecordedVoiceProcessing (mutation) → processRecordedVoice (action) → saveVoiceGeneration → voiceToolHistory
```

**New Flow**:
```
Frontend → startRecordedVoiceProcessing (mutation) → processRecordedVoice (action) → INSERT audioTracks directly
```

---

**Part A: Update Mutation Args**

**File**: `convex/voiceTool.ts`

**Change** (line 64-101):
```typescript
// BEFORE:
export const startRecordedVoiceProcessing = mutation({
  args: {
    audioBlob: v.string(), // Base64-encoded audio
    duration: v.number(),
    projectId: v.optional(v.string()),
    enhance: v.optional(v.boolean()),
    generateTranscript: v.optional(v.boolean()),
  },

// AFTER:
export const startRecordedVoiceProcessing = mutation({
  args: {
    audioBlob: v.string(), // Base64-encoded audio
    duration: v.number(),
    title: v.string(),                        // ← ADD THIS
    projectId: v.optional(v.id("projects")), // ← CHANGE TYPE
    enhance: v.optional(v.boolean()),
    generateTranscript: v.optional(v.boolean()),
  },
```

**Update scheduler call** (line 86-96):
```typescript
// BEFORE:
ctx.scheduler.runAfter(
  0,
  internal.actions.voiceProcessing.processRecordedVoice,
  {
    audioBlob: args.audioBlob,
    duration: args.duration,
    projectId: args.projectId,
    enhance: args.enhance,
    generateTranscript: args.generateTranscript,
  },
);

// AFTER:
ctx.scheduler.runAfter(
  0,
  internal.actions.voiceProcessing.processRecordedVoice,
  {
    audioBlob: args.audioBlob,
    duration: args.duration,
    title: args.title,                  // ← ADD THIS
    projectId: args.projectId,
    enhance: args.enhance,
    generateTranscript: args.generateTranscript,
  },
);
```

---

**Part B: Update Processing Action**

**File**: `convex/actions/voiceProcessing.ts`

**Change args** (line 17-24):
```typescript
// BEFORE:
export const processRecordedVoice = internalAction({
  args: {
    audioBlob: v.string(), // Base64-encoded audio data
    duration: v.number(), // Duration in seconds
    projectId: v.optional(v.string()), // Optional project context
    enhance: v.optional(v.boolean()), // Future: audio enhancement
    generateTranscript: v.optional(v.boolean()), // Future: speech-to-text
  },

// AFTER:
export const processRecordedVoice = internalAction({
  args: {
    audioBlob: v.string(), // Base64-encoded audio data
    duration: v.number(), // Duration in seconds
    title: v.string(),                        // ← ADD THIS
    projectId: v.optional(v.id("projects")), // ← CHANGE TYPE
    enhance: v.optional(v.boolean()), // Future: audio enhancement
    generateTranscript: v.optional(v.boolean()), // Future: speech-to-text
  },
```

**Replace saveVoiceGeneration call with direct audioTracks insert** (line 84-101):
```typescript
// BEFORE:
// 5. Save to voiceToolHistory via internal mutation
await ctx.runMutation(internal.voiceTool.saveVoiceGeneration, {
  userId: clerkUserId,
  modelId: "voice-recording", // Special model ID for recordings
  schemaId: "voice-recording",
  projectId: args.projectId,
  prompt: transcript ?? "", // Use transcript if available, otherwise empty
  voiceSettings: {
    voiceId: "user-recording",
    speed: 1.0,
    pitch: 0,
  },
  audioUrl,
  storageId: storageId as never, // Type cast due to Convex quirk
  duration: args.duration,
  mode: "record" as const,
  cost: 1, // Recording costs 1 credit (from creditCosts table)
});

// AFTER:
// 5. Get user record and project details
const user = await ctx.runQuery(internal.users.getByClerkId, {
  clerkUserId,
});

if (!user) {
  throw new Error("User not found");
}

let organizationId: string | null = null;
if (args.projectId) {
  const project = await ctx.runQuery(internal.projects.get, {
    id: args.projectId,
  });
  
  if (!project) {
    throw new Error("Project not found");
  }
  
  if (project.userId !== user._id) {
    throw new Error("Unauthorized - you don't own this project");
  }
  
  organizationId = project.organizationId ?? null;
}

// 6. Insert directly into audioTracks (not voiceToolHistory)
const now = Date.now();
await ctx.runMutation(internal.audioTracks.insert, {
  title: args.title,
  projectId: args.projectId ?? null,
  type: "narration",
  storageId: storageId as never,
  duration: args.duration,
  userId: user._id,
  organizationId: organizationId,
  creditsUsed: 1, // Recording cost
  volume: 1.0,
  order: 0,
  startTime: 0,
  fadeIn: null,
  fadeOut: null,
  assetId: null,
  generationConfig: null, // No generation config for recordings
  createdAt: now,
  updatedAt: now,
});
```

---

**Part C: Create audioTracks Insert Mutation**

**File**: `convex/audioTracks.ts`

**Add this mutation** (if it doesn't exist):
```typescript
export const insert = internalMutation({
  args: {
    title: v.string(),
    projectId: v.optional(v.string()),
    type: v.union(
      v.literal("music"),
      v.literal("narration"),
      v.literal("sound_effect")
    ),
    storageId: v.optional(v.id("_storage")),
    duration: v.number(),
    userId: v.string(),
    organizationId: v.optional(v.string()),
    creditsUsed: v.number(),
    volume: v.number(),
    order: v.number(),
    startTime: v.number(),
    fadeIn: v.optional(v.number()),
    fadeOut: v.optional(v.number()),
    assetId: v.optional(v.string()),
    generationConfig: v.optional(v.object({
      model: v.string(),
      prompt: v.string(),
      voice: v.optional(v.string()),
      parameters: v.optional(v.any()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("audioTracks", {
      title: args.title,
      projectId: args.projectId ?? null,
      type: args.type,
      storageId: args.storageId,
      duration: args.duration,
      userId: args.userId,
      organizationId: args.organizationId ?? null,
      creditsUsed: args.creditsUsed,
      volume: args.volume,
      order: args.order,
      startTime: args.startTime,
      fadeIn: args.fadeIn ?? null,
      fadeOut: args.fadeOut ?? null,
      assetId: args.assetId ?? null,
      generationConfig: args.generationConfig ?? null,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });
  },
});
```

---

**Part D: Add Helper Queries**

**File**: `convex/users.ts` (if getByClerkId doesn't exist):
```typescript
export const getByClerkId = internalQuery({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique();
  },
});
```

**File**: `convex/projects.ts` (if get doesn't exist):
```typescript
export const get = internalQuery({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

---

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/voiceTool.ts convex/actions/voiceProcessing.ts convex/audioTracks.ts

# Step 3: Deploy to Convex
npx convex dev --once
```

---

**Task 7.4: Add i18n Translation Keys**

**File**: `messages/en.json`

**Translation Keys to Add**:
```json
{
  "voice_generator": {
    "project_selector": {
      "title": "Link to Project",
      "description": "Choose a project to save this recording to, or save it to your library.",
      "save_to_library": "Save to Library",
      "save_to_library_hint": "Available across all projects",
      "no_projects": "No projects yet",
      "no_projects_hint": "Create a project first to link recordings",
      "search_placeholder": "Search projects...",
      "selected_project": "Recording will be saved to: {projectName}"
    },
    "recording": {
      "save_recording": "Save Recording",
      "saving": "Saving...",
      "save_success": "Recording saved successfully!",
      "save_error": "Failed to save recording"
    }
  }
}
```

**i18n Pipeline**:
```bash
# 1. Add keys to messages/en.json
# 2. Generate translations for all languages
pnpm translate

# 3. Verify synchronization
pnpm i18n:verify
```

**2-Step QA:**
```bash
# Step 1: TypeScript check (translation usage)
npx tsc --noEmit

# Step 2: i18n verification
pnpm i18n:verify
```

---

**Task 7.5: Display Audio Tracks in Project Details Page** (30 min)

**Context**: Both recorded voices AND generated narrations (saved via Tasks 7.3 and 7.6) should appear in Project Details → Audio tab. They're both stored in `audioTracks` with `type="narration"`.

**Files to Modify**:

1. **Create query to fetch project audio tracks**:

**File**: `convex/audioTracks.ts`

```typescript
export const getProjectNarrations = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Verify project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", identity.subject)
      )
      .unique();

    if (!user || project.userId !== user._id) {
      throw new Error("Unauthorized - you don't own this project");
    }

    // ✅ Query audioTracks with compound index (NOT voiceToolHistory)
    const tracks = await ctx.db
      .query("audioTracks")
      .withIndex("by_project_and_type", (q) => 
        q.eq("projectId", args.projectId).eq("type", "narration")
      )
      .order("desc")
      .collect();

    // Enrich with audio URLs from storage
    return await Promise.all(
      tracks.map(async (track) => ({
        ...track,
        audioUrl: track.storageId
          ? await ctx.storage.getUrl(track.storageId)
          : null,
        // Add source indicator based on generationConfig presence
        source: track.generationConfig ? 'generated' as const : 'recorded' as const,
      }))
    );
  },
});
```

2. **Update ProjectAudioPanel component to use correct query**:

**File**: `components/projects/ProjectAudioPanel.tsx`

**Note**: This file already exists (shown in design-master review). Update the query call:

```typescript
// BEFORE:
const recordings = useQuery(api.voiceTool.getProjectRecordings, { projectId });

// AFTER:
const narrations = useQuery(api.audioTracks.getProjectNarrations, { projectId });
```

**Add source badge to distinguish recordings from generated**:

```typescript
<div className="glass-panel p-4">
  <div className="flex items-center gap-4">
    {/* Icon and badge with VISUAL DISTINCTION */}
    <div className="flex items-center gap-2">
      <Badge 
        variant={track.source === 'recorded' ? "secondary" : "default"} 
        className="text-xs"
      >
        {track.source === 'recorded' ? (
          <>
            <Mic className="h-3 w-3 mr-1" aria-hidden="true" />
            {t("project.audio.recorded")}
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
            {t("project.audio.generated")}
          </>
        )}
      </Badge>
    </div>
    
    <div className="flex-1">
      <p className="font-medium leading-relaxed">{track.title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {track.duration}s • {formatDate(track.createdAt)}
      </p>
    </div>
  </div>
  
  {track.audioUrl ? (
    <div className="mt-4 min-h-[44px] flex items-center">
      <audio
        src={track.audioUrl}
        controls
        className="w-full"
        aria-label={track.title}
      />
    </div>
  ) : (
    <Skeleton className="h-[44px] w-full rounded-lg mt-4" />
  )}
</div>
```

3. **Add "Generate Narration" button** (shown in screenshot):

```typescript
<div className="space-y-4">
  {/* Header with action buttons */}
  <div className="flex flex-col xs:flex-row gap-2">
    <Link 
      href={`/voice-generator?projectId=${projectId}&tab=generate`}
      className="flex-1"
    >
      <Button className="w-full min-h-[44px] bg-primary text-primary-foreground">
        <Sparkles className="h-4 w-4 mr-2" />
        {t("project.audio.generate_narration")}
      </Button>
    </Link>
    
    <Link 
      href={`/voice-generator?projectId=${projectId}&tab=record`}
      className="flex-1"
    >
      <Button 
        variant="secondary"
        className="w-full min-h-[44px]"
      >
        <Mic className="h-4 w-4 mr-2" />
        {t("project.audio.record_voice")}
      </Button>
    </Link>
  </div>

  {/* Narration list */}
  {narrations && narrations.length > 0 ? (
    <div className="space-y-3">
      {narrations.map(track => (
        <AudioTrackCard key={track._id} track={track} />
      ))}
    </div>
  ) : (
    <EmptyState 
      icon={<Mic />}
      title={t("project.audio.no_narrations")}
      description={t("project.audio.no_narrations_hint")}
    />
  )}
</div>
```

**Design Requirements**:
- Mobile-first responsive layout
- Audio player with 44px minimum height
- Consistent with project details design
- Loading states while fetching recordings
- Empty state with call-to-action

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/audioTracks.ts components/projects/ProjectAudioPanel.tsx

# Step 3: Integration test
# - Record voice → save to project → verify appears in audio tab with "Recorded" badge
# - Generate voice → save to project → verify appears in audio tab with "Generated" badge  
# - Save to library → verify does NOT appear in any project audio tab
```

---

**Task 7.6: Update Generation Action to Save to audioTracks** (45 min)

**Context**: Currently, generated voices (text-to-speech) save to `voiceToolHistory`. We need to update them to save to `audioTracks` table with user-provided title and optional projectId, just like recordings.

**Current Flow (WRONG)**:
```
User types text → Generate → Saves to voiceToolHistory → NOT in audioTracks → Won't appear in Project Details
```

**New Flow (CORRECT)**:
```
User types text → Generate → Modal (name + project) → Saves to audioTracks → Appears in Project Details
```

---

**Part A: Update Frontend to Trigger Modal After Generation**

**File**: `components/voice-generator/index.tsx`

**Changes**:

1. **Add state for generated voice save** (after line 46):
```typescript
const [showSaveModal, setShowSaveModal] = useState(false);
const [lastGeneration, setLastGeneration] = useState<{
  modelId: string;
  params: Record<string, unknown>;
} | null>(null);
```

2. **Update handleGenerate to NOT auto-save** (line 124-166):
```typescript
// BEFORE:
const handleGenerate = useCallback(async () => {
  // ... validation ...
  
  setIsGenerating(true);
  try {
    await startGenericVoiceGeneration({
      modelId: selectedSchema.modelId,
      params,
    });
    showToast(t("success.generated"));
  } catch (error) {
    // ... error handling
  } finally {
    setIsGenerating(false);
  }
}, [/* deps */]);

// AFTER:
const handleGenerate = useCallback(async () => {
  // ... validation ...
  
  setIsGenerating(true);
  try {
    // Store generation params but don't save yet
    setLastGeneration({
      modelId: selectedSchema.modelId,
      params,
    });
    
    // Show success and open save modal
    showToast(t("success.generated_preview"));
    setShowSaveModal(true);
  } catch (error) {
    // ... error handling
  } finally {
    setIsGenerating(false);
  }
}, [selectedSchema, params, showToast, t]);
```

3. **Add handler to save with title + projectId**:
```typescript
const handleSaveGeneration = useCallback(
  async (title: string, projectId: Id<"projects"> | null) => {
    if (!lastGeneration || !clerkUserId) return;

    setIsGenerating(true);
    try {
      await startGenericVoiceGeneration({
        modelId: lastGeneration.modelId,
        params: lastGeneration.params,
        title,                          // ← ADD THIS
        projectId: projectId ?? undefined, // ← ADD THIS
      });

      showToast(t("success.generated"));
      setShowSaveModal(false);
      setLastGeneration(null);
    } catch (error) {
      console.error("Voice generation failed:", error);
      showToast(
        error instanceof Error ? error.message : t("errors.generation_failed"),
        "error",
      );
    } finally {
      setIsGenerating(false);
    }
  },
  [lastGeneration, clerkUserId, startGenericVoiceGeneration, showToast, t]
);
```

4. **Add ProjectSelector modal** (before closing component):
```typescript
  </Dialog>

  {/* Add ProjectSelector for generated voices */}
  <ProjectSelector
    open={showSaveModal}
    onOpenChange={setShowSaveModal}
    onConfirm={handleSaveGeneration}
    disabled={isGenerating}
  />
</div>
```

---

**Part B: Update Mutation Args**

**File**: `convex/voiceTool.ts`

**Change** (line 16-59):
```typescript
// BEFORE:
export const startGenericVoiceGeneration = mutation({
  args: {
    modelId: v.string(),
    params: v.any(),
  },
  handler: async (ctx, args) => {
    // ...
    ctx.scheduler.runAfter(
      0,
      internal.actions.voiceToolGeneric.generateGenericVoice,
      {
        modelId: args.modelId,
        params: args.params,
        transactionId: result.transactionId,
        clerkUserId: identity.subject,
      },
    );
  },
});

// AFTER:
export const startGenericVoiceGeneration = mutation({
  args: {
    modelId: v.string(),
    params: v.any(),
    title: v.string(),                        // ← ADD THIS
    projectId: v.optional(v.id("projects")), // ← ADD THIS
  },
  handler: async (ctx, args) => {
    // ... existing credit deduction ...
    
    ctx.scheduler.runAfter(
      0,
      internal.actions.voiceToolGeneric.generateGenericVoice,
      {
        modelId: args.modelId,
        params: args.params,
        transactionId: result.transactionId,
        clerkUserId: identity.subject,
        title: args.title,           // ← PASS THIS
        projectId: args.projectId,   // ← PASS THIS
      },
    );
  },
});
```

---

**Part C: Update Generation Action**

**File**: `convex/actions/voiceToolGeneric.ts`

**Change args** (line 31-37):
```typescript
// BEFORE:
export const generateGenericVoice = internalAction({
  args: {
    modelId: v.string(),
    params: v.any(),
    transactionId: v.id("creditTransactions"),
    clerkUserId: v.string(),
  },

// AFTER:
export const generateGenericVoice = internalAction({
  args: {
    modelId: v.string(),
    params: v.any(),
    transactionId: v.id("creditTransactions"),
    clerkUserId: v.string(),
    title: v.string(),                        // ← ADD THIS
    projectId: v.optional(v.id("projects")), // ← ADD THIS
  },
```

**Replace save logic** (line ~547 where saveVoiceGeneration is called):
```typescript
// BEFORE:
await ctx.runMutation(internal.voiceTool.saveVoiceGeneration, {
  userId: args.clerkUserId,
  modelId: args.modelId,
  schemaId: schema.schemaId,
  projectId: undefined,
  prompt: filteredParams.prompt,
  voiceSettings: {
    voiceId: filteredParams.voice_id || "default",
    speed: filteredParams.speed,
    pitch: filteredParams.pitch,
    emotion: filteredParams.emotion,
  },
  audioUrl: storedUrl,
  storageId: stored.storageId,
  duration: result.duration,
  mode: "generate",
  cost: costResult.credits,
});

// AFTER:
// Get user record and project details
const user = await ctx.runQuery(internal.users.getByClerkId, {
  clerkUserId: args.clerkUserId,
});

if (!user) {
  throw new Error("User not found");
}

let organizationId: string | null = null;
if (args.projectId) {
  const project = await ctx.runQuery(internal.projects.get, {
    id: args.projectId,
  });
  
  if (!project) {
    throw new Error("Project not found");
  }
  
  if (project.userId !== user._id) {
    throw new Error("Unauthorized - you don't own this project");
  }
  
  organizationId = project.organizationId ?? null;
}

// Save to audioTracks (not voiceToolHistory)
const now = Date.now();
await ctx.runMutation(internal.audioTracks.insert, {
  title: args.title,
  projectId: args.projectId ?? null,
  type: "narration",
  storageId: stored.storageId as never,
  duration: result.duration,
  userId: user._id,
  organizationId: organizationId,
  creditsUsed: costResult.credits,
  volume: 1.0,
  order: 0,
  startTime: 0,
  fadeIn: null,
  fadeOut: null,
  assetId: null,
  generationConfig: {
    model: args.modelId,
    prompt: filteredParams.prompt as string,
    voice: filteredParams.voice_id as string,
    parameters: filteredParams,
  },
  createdAt: now,
  updatedAt: now,
});
```

---

**2-Step QA:**
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/voiceTool.ts convex/actions/voiceToolGeneric.ts components/voice-generator/index.tsx

# Step 3: Deploy to Convex
npx convex dev --once
```

---

**Task 7.4: Add i18n Translation Keys** (20 min)

**File**: `messages/en.json`

**Translation Keys to Add** (includes both recording AND generation flows):

```json
{
  "voice_generator": {
    "project_selector": {
      "title": "Save Audio to Project",
      "description": "Name your audio and choose where to save it.",
      "name_label": "Audio Name",
      "name_placeholder": "e.g., Intro Narration, Character Voice",
      "save_to_library": "Save to Library",
      "save_to_library_hint": "Available across all projects",
      "no_projects": "No projects yet",
      "no_projects_hint": "Create a project first to link audio",
      "cancel": "Cancel",
      "confirm": "Save Audio",
      "loading_projects": "Loading projects...",
      "error_loading": "Failed to load projects"
    },
    "save": {
      "success": "Audio saved successfully!",
      "error": "Failed to save audio",
      "saving": "Saving...",
      "saving_to_project": "Saving to project...",
      "saving_to_library": "Saving to library..."
    },
    "success": {
      "generated": "Voice generated and saved!",
      "generated_preview": "Voice generated! Choose where to save it."
    },
    "tab_generate": "Generate Voice",
    "tab_record": "Record Voice"
  },
  "project": {
    "audio": {
      "generate_narration": "Generate Narration",
      "record_voice": "Record Voice",
      "no_narrations": "No narration audio yet",
      "no_narrations_hint": "Generate AI voices or record your own to add narration to this project",
      "recorded": "Recorded",
      "generated": "AI Generated"
    }
  }
}
```

**Keys Removed** (already exist in voice_generator.recording):
- `save_recording` (line 2195 of en.json)
- `save_success` (line 2196)
- `save_failed` (line 2197)

**i18n Pipeline**:
```bash
# 1. Add keys to messages/en.json
# 2. Generate translations for all languages
pnpm translate

# 3. Verify synchronization
pnpm i18n:verify
```

**2-Step QA:**
```bash
# Step 1: TypeScript check (translation usage)
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write messages/en.json

# Step 3: i18n verification
pnpm i18n:verify
```

---

**Phase 7 Final Integration Testing**

After completing all tasks, test the full workflow:

1. **Test Project Selection Flow**:
   - [ ] Record a voice
   - [ ] Click "Save Recording"
   - [ ] ProjectSelector modal opens
   - [ ] Select a project
   - [ ] Recording saves successfully
   - [ ] Success message appears

2. **Test Library Save Flow**:
   - [ ] Record a voice
   - [ ] Click "Save Recording"
   - [ ] ProjectSelector modal opens
   - [ ] Click "Save to Library"
   - [ ] Recording saves without projectId
   - [ ] Appears in Voice Library

3. **Test Project Details Display**:
   - [ ] Navigate to Project Details
   - [ ] Click "Audio" tab
   - [ ] Linked recordings appear
   - [ ] Audio player works
   - [ ] Mobile responsive

4. **Test Edge Cases**:
   - [ ] No projects exist → "Save to Library" is only option
   - [ ] Cancel project selection → returns to preview state
   - [ ] Network error during save → error message shown

**Full Phase 7 QA:**
```bash
# 1. TypeScript check (all modified files)
npx tsc --noEmit

# 2. Biome lint + format (all modified files)
npx biome check --write components/voice-generator/ components/projects/ convex/

# 3. i18n verification
pnpm i18n:verify

# 4. Deploy to Convex
npx convex dev --once

# 5. Manual testing checklist
# - Test on mobile (320px, 375px, 768px)
# - Test on desktop (1024px, 1440px)
# - Test with 0 projects, 1 project, many projects
# - Test audio playback in project details
```

---

## 💰 Credit System Integration (Convex-Based)

### Voice Generation Costs

**All costs stored in `creditCosts` Convex table** (NOT hardcoded):

| Service | fal.ai Model | Action Type | Credits* | Cost Basis |
|---------|-------------|-------------|---------|------------|
| **MiniMax 2.8 HD** | fal-ai/minimax/speech-2.8-hd | `voice_generation_minimax_28_hd` | 5 | per 1000 chars |
| **MiniMax 2.8 Turbo** | fal-ai/minimax/speech-2.8-turbo | `voice_generation_minimax_28_turbo` | 3 | per 1000 chars |
| **Qwen 3 TTS** | fal-ai/qwen-3-tts/text-to-speech/1.7b | `voice_generation_qwen_3` | 5 | per 1000 chars |
| **MiniMax 2.6 HD (Legacy)** | fal-ai/minimax/speech-2.6-hd | `voice_generation_minimax_hd` | 10 | per generation |
| **Voice Recording** | Storage only | `voice_recording` | 1 | per upload |
| **Voice Cloning** | fal-ai/qwen-3-tts/clone-voice | `voice_cloning_qwen` | 15 | per clone |
| **Audio Enhancement** | Processing | `voice_enhancement` | 20 | per file |

*Credit costs are configured in Convex `creditCosts` table and can be updated without code changes.

### Credit Cost Lookup (Dynamic)

**Pattern from Image Generator**:

```typescript
// ✅ CORRECT: Frontend gets cost for selected model
const creditCost = useCreditCost(selectedSchema.creditActionType);

// ✅ CORRECT: Backend deducts credits by actionType
const schema = await ctx.db
  .query("voiceModelSchemas")
  .withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
  .first();

const cost = await getCreditCost(ctx, schema.creditActionType);
await deductCredits(ctx, userId, cost, schema.creditActionType);
```

**Key Architecture**:
- ❌ OLD: `const modelCosts = { 'minimax-hd': 10, ... }` (hardcoded)
- ✅ NEW: Query `creditCosts` table by `actionType` (dynamic, admin-configurable)

### Adding New Model Costs

Update `creditCosts` table via seed script or admin UI:

```typescript
await ctx.db.insert("creditCosts", {
  actionType: "voice_generation_new_model",
  costInCredits: 15,
  description: "New Voice Model (per generation)",
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

Then reference in `voiceModelSchemas`:

```typescript
{
  schemaId: "new-model-tts",
  creditActionType: "voice_generation_new_model",  // Links to creditCosts
  // ...
}
```

## 📋 Integration Strategy (Architecture-Aligned)

### Step 1: Create Convex Infrastructure (3.5h)
1. **Add tables to schema** (voiceModelSchemas, voiceToolHistory)
2. **Create queries** (voiceModels.ts)
3. **Create seed script** (seedVoiceModels.ts with 2 models + 2 credit costs)
4. **Create generic action** (voiceToolGeneric.ts)
5. **Create mutation handlers** (voiceTool.ts)

### Step 2: Frontend Dynamic UI (4h)
1. **Create hooks** (useConvexVoiceSchemas, useConvexVoiceHistory)
2. **Build main component** (index.tsx with schema-driven state)
3. **Voice settings panel** (reuse DynamicField for all controls)
4. **Model selector** (grid with Convex-loaded models)
5. **Voice library** (history with pagination)

### Step 3: Voice Recording Mode (2.5h)
1. **Recording interface** (mobile-first, 88px touch targets)
2. **Recording action** (processRecordedVoice with storage)
3. **Integration with voice library**

### Step 4: Inspiration Wall (2h)
1. **Add voice fields to toolCategories** schema
2. **Update admin form** (conditional voice fields)
3. **Build inspiration components** (empty state + full wall)

### Step 5: Mobile & Polish (1h)
- Touch optimizations
- Loading states
- Accessibility
- Error handling

**Total Timeline: 13 hours** (Architecture-aligned, modular, future-proof)

---

## 🎯 Success Metrics Update

| Metric | Target | Measurement | Notes |
|--------|--------|-------------|-------|
| Voice generation adoption | 60% user engagement | Analytics events | Higher than recording due to ease |
| Recording usage | 25% try recording | Analytics events | Lower barrier with mobile UI |
| fal.ai API success rate | >99% | fal.ai dashboard | Monitor model failures |
| Step-4 completion rate | +20% with voice options | Step completion | More voice = better engagement |
| Credit efficiency | <12 credits avg | Transaction logs | Multiple model options |
| Mobile recording success | >90% completion | Mobile analytics | Test permissions/UX |

## 🔮 Future Enhancements

### Phase 1: Additional Voice Models (Convex-only)
- Add `fal-ai/google/tts` - Multilingual support
- Add `fal-ai/azure/tts` - Regional accents
- Add `fal-ai/amazon/polly` - Neural voices
- **Add via seed script or admin UI** - zero code changes ✅

### Phase 2: Advanced Features (Backend + Frontend)
- **Voice Cloning**: `fal-ai/elevenlabs/voice-cloning` (upload 1-min sample)
- **Real-time Streaming**: WebSocket integration for live preview
- **Batch Processing**: Generate multiple voice variations
- **Voice Mixing**: Combine multiple voice clips

### Phase 3: Community Features
- Share voices publicly
- Voice marketplace
- User-contributed voice presets

---

## 📋 Implementation Checklist (Architecture-Aligned)

### Before Implementation
- [ ] **Review Sprint 30d.5 implementation** (image generator pattern)
- [ ] **Design voiceModelSchemas structure** (mirror imageModelSchemas)
- [ ] **Plan seed data** (3 initial models: MiniMax HD, Turbo, Qwen 3 TTS + credit costs)
- [ ] **Design mobile-first wireframes** (88px touch targets, custom audio player)
- [ ] **Map DynamicField controls** to voice params (speed, pitch, emotion, style prompts)

### During Implementation  
- [ ] **Follow modular architecture** (Convex-first, zero hardcoded configs)
- [ ] **Reuse image generator components** (DynamicField, ModelSelector patterns)
- [ ] **Reuse MyShortReel design system** (colors, typography, glass effects)
- [ ] **Follow mobile-first best practices** (responsive, 44px targets)
- [ ] **Add comprehensive error handling** (fal.ai fallbacks, permission errors)
- [ ] **Include accessibility features** (labels, keyboard nav, ARIA)

### After Implementation
- [ ] **Test zero-code model addition** (add model via Convex, verify UI/backend)
- [ ] **Test across different devices** (iOS/Android recording permissions)
- [ ] **Validate credit system** (correct deductions via creditActionType)
- [ ] **Monitor user adoption metrics** (analytics integration)
- [ ] **Test step-4 integration** (voice mode switching)
- [ ] **Optimize for performance** (lazy loading, caching)

---

**Conclusion**: **HIGHLY FEASIBLE** with modular architecture from Sprint 30d.5. Provides significant value for users wanting personalized narration while maintaining architectural consistency with image generator. **13 hours implementation** using proven patterns. **Zero-code model onboarding** is key differentiator.

**Architecture Validation**: ✅ **98% ALIGNED** (5 critical fixes applied)
- ✅ Convex-based dynamic schemas (no hardcoded configs)
- ✅ Generic action pattern with "use node" directive and auth check
- ✅ Credit system uses Convex creditCosts table (fully dynamic)
- ✅ Design system with custom audio player and semantic badges
- ✅ i18n keys documented (~290+ keys for all 3 models)
- ✅ Type-safe schema (union types instead of v.any())
- ✅ Internal action routing (internal.* not api.*)
- ✅ Project context tracking (projectId in voiceToolHistory)

**Next Steps**:
1. **Review TTS-MODELS-ANALYSIS.md** (v1.2) for complete model specifications
2. **Add i18n keys** to `messages/en.json` (~290+ keys for all 3 models)
3. **Run translation pipeline** (`pnpm translate` + `pnpm i18n:verify`)
4. **Create Convex tables** (voiceModelSchemas, voiceToolHistory with projectId)
5. **Seed 3 initial models** (MiniMax 2.8 HD + Turbo + Qwen 3 TTS with full schemas)
6. **Add credit costs** for all 3 models to creditCosts table
7. **Build generic voice action** (with "use node", auth, and storage error handling)
8. **Create frontend hooks** (useConvexVoiceSchemas, useConvexVoiceHistory)
9. **Build UI with DynamicField** (reuse from image generator)
10. **Implement custom audio player** (replace native <audio> element)
11. **Add Inspiration Wall** (integrate with toolCategories system)
12. **Test zero-code model addition** (validate architecture goal)

---

**Document Version**: 2.2 - Architecture Review Fixes Applied  
**Last Updated**: February 18, 2026  
**Dependencies**: 
- Sprint 30d.5 (Modular Model Architecture) ✅
- `docs/Analysis/voice-generator/TTS-MODELS-ANALYSIS.md` (v1.2) ✅

**Status**: ✅ **READY FOR IMPLEMENTATION** (All critical fixes applied)

**Key Changes v2.2** (Applied from Agent Reviews):

**Convex Master Fixes**:
- ✅ Added `"use node"` directive to action example
- ✅ Added authentication check in action handler
- ✅ Fixed scheduler to use `internal.*` instead of `api.*`
- ✅ Replaced `v.any()` with type-safe union in schema
- ✅ Added storage error handling with credit refund
- ✅ Added `projectId` to voiceToolHistory schema

**Design Master Fixes**:
- ✅ Fixed glass panel padding (`p-4 md:p-6`)
- ✅ Added ARIA labels and focus states to recording button
- ✅ Applied `leading-relaxed` consistently to all labels
- ✅ Replaced native `<audio>` with custom player component
- ✅ Made grid gaps responsive (`gap-3 md:gap-4 lg:gap-6`)
- ✅ Implemented semantic badge mapping system
- ✅ Added waveform gradient and animation
- ✅ Made action buttons responsive (mobile stack, desktop row)

**i18n Master Fixes**:
- ✅ Added 26 voice description keys (17 MiniMax + 9 Qwen)
- ✅ Added 5 missing badge translation keys
- ✅ Added 12 audio player translation keys
- ✅ Updated model names to match 2.8 versions
- ✅ Updated total key count (~290+ keys)

**Model Summary**:
- **MiniMax 2.8 HD**: 17 voices, 5 credits/1k chars, highest quality
- **MiniMax 2.8 Turbo**: 17 voices, 3 credits/1k chars, 40% faster
- **Qwen 3 TTS 1.7B**: 9 voices + cloning, 5 credits/1k chars, unique features

---

## 🔮 Phase 2a: Voice Cloning UI (Optional Enhancement)

### ⏱️ **Time Estimation: 8-10 hours**

Voice cloning is an **optional advanced feature** that extends Qwen 3 TTS capabilities. Phase 1 launches with Qwen's 9 preset voices, which already provides variety. This phase adds custom voice creation.

---

### 📋 **Implementation Breakdown**

#### **1. Clone Voice Endpoint Integration** (2-3 hours)

**File**: `convex/actions/voiceCloning.ts` (new file)

**Tasks**:
- ✅ Create `cloneVoice` internal action
- ✅ Call `fal-ai/qwen-3-tts/clone-voice` endpoint with reference audio
- ✅ Handle speaker embedding file storage in Convex
- ✅ Link embedding to user profile or voiceToolHistory
- ✅ Error handling for:
  - Invalid audio format (must be clear speech, 30-60s)
  - File size limits
  - FAL API failures
  - Storage quota exceeded

**Code Pattern**:
```typescript
"use node";

import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { fal } from "@fal-ai/serverless-client";

export const cloneVoice = internalAction({
  args: {
    userId: v.string(),
    referenceAudioUrl: v.string(),
    referenceText: v.optional(v.string()),
    voiceName: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    // 2. Call FAL clone-voice endpoint
    const result = await fal.subscribe("fal-ai/qwen-3-tts/clone-voice", {
      input: {
        reference_audio_url: args.referenceAudioUrl,
        reference_text: args.referenceText,
      },
    });
    
    // 3. Store embedding URL
    const embeddingId = await ctx.runMutation(api.voiceCloning.saveEmbedding, {
      userId: args.userId,
      voiceName: args.voiceName,
      embeddingUrl: result.speaker_embedding_url,
      referenceText: args.referenceText,
      createdAt: Date.now(),
    });
    
    return { success: true, embeddingId, embeddingUrl: result.speaker_embedding_url };
  },
});
```

**Credit Cost**: 15 credits per clone (suggested)

---

#### **2. File Upload UI** (2-3 hours)

**File**: `components/voice-generator/VoiceCloneUpload.tsx` (new file)

**Tasks**:
- ✅ Drag & drop audio file upload
- ✅ File validation:
  - Format: MP3, WAV, FLAC
  - Duration: 30-60 seconds (optimal)
  - Quality: Clear speech, minimal background noise
- ✅ Upload progress indicator
- ✅ Preview uploaded audio before cloning
- ✅ Custom audio player reuse from Phase 1
- ✅ Error states with helpful guidance

**UI Components**:
```tsx
<div className="glass-panel p-4 md:p-6">
  <div className="space-y-4">
    {/* Upload Area */}
    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <p className="text-sm text-foreground leading-relaxed mb-2">
        Drag & drop audio file or click to browse
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        MP3, WAV, or FLAC • 30-60 seconds • Clear speech
      </p>
      <input type="file" accept="audio/*" className="hidden" />
    </div>
    
    {/* Preview (after upload) */}
    {audioFile && (
      <div className="glass-inner-field p-3">
        <p className="text-sm font-medium leading-relaxed mb-2">Preview</p>
        {/* Custom audio player from Phase 1 */}
        <AudioPlayer src={audioFile.url} />
        <p className="text-xs text-muted-foreground leading-relaxed mt-2">
          Duration: {formatDuration(audioFile.duration)}
        </p>
      </div>
    )}
  </div>
</div>
```

**Validation Rules**:
- Min duration: 10s (warning if < 30s)
- Max duration: 120s (hard limit)
- File size: < 50MB
- Sample rate: Recommend 24kHz+

---

#### **3. Voice Cloning Wizard** (3-4 hours)

**File**: `components/voice-generator/VoiceCloningWizard.tsx` (new file)

**Tasks**:
- ✅ 3-step wizard with progress indicator
- ✅ Step navigation and state management
- ✅ Loading states and animations
- ✅ Error handling at each step
- ✅ Success confirmation with preview

**Wizard Steps**:

**Step 1: Upload Reference Audio**
- File upload UI (from task 2)
- Optional: Record reference audio directly
- Voice name input (for managing multiple cloned voices)
- Reference text input (what was said in the audio - improves quality)

**Step 2: Processing & Embedding Generation**
- Loading state with progress indicator
- Estimated time: 30-60 seconds
- "Creating your custom voice..." message
- Cancel option (refunds credits)

**Step 3: Test Cloned Voice**
- Success confirmation
- Sample text input (to test the cloned voice)
- Generate test audio button
- Audio player for test result
- "Save to Voice Library" or "Retry" options

**State Management**:
```typescript
type WizardStep = 'upload' | 'processing' | 'test';

const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
const [uploadedFile, setUploadedFile] = useState<File | null>(null);
const [referenceText, setReferenceText] = useState('');
const [voiceName, setVoiceName] = useState('');
const [embeddingUrl, setEmbeddingUrl] = useState('');
const [isProcessing, setIsProcessing] = useState(false);
```

**UI Pattern**:
```tsx
<div className="glass-panel p-4 md:p-6">
  {/* Progress Indicator */}
  <div className="flex items-center gap-3 mb-6">
    <StepIndicator step={1} active={currentStep === 'upload'} completed={currentStep !== 'upload'} />
    <div className="flex-1 h-px bg-border" />
    <StepIndicator step={2} active={currentStep === 'processing'} completed={currentStep === 'test'} />
    <div className="flex-1 h-px bg-border" />
    <StepIndicator step={3} active={currentStep === 'test'} />
  </div>
  
  {/* Step Content */}
  {currentStep === 'upload' && <UploadStep />}
  {currentStep === 'processing' && <ProcessingStep />}
  {currentStep === 'test' && <TestStep />}
</div>
```

---

#### **4. Embedding Management** (1 hour)

**File**: `convex/mutations/voiceCloning.ts` + UI component

**Tasks**:
- ✅ Store embedding URLs in new table or extend voiceToolHistory
- ✅ List user's cloned voices
- ✅ Delete cloned voice option
- ✅ Select cloned voice for generation (shows in voice selector)

**Schema Addition** (Option A - New Table):
```typescript
clonedVoices: defineTable({
  userId: v.string(),
  voiceName: v.string(),
  embeddingUrl: v.string(),
  referenceText: v.optional(v.string()),
  referenceAudioStorageId: v.id("_storage"),
  createdAt: v.number(),
})
  .index("by_user", ["userId", "createdAt"])
```

**Or Option B - Extend voiceToolHistory**:
```typescript
// Add to existing voiceToolHistory:
isClonedVoice: v.optional(v.boolean()),
clonedVoiceEmbeddingUrl: v.optional(v.string()),
```

**UI Component**:
```tsx
<div className="space-y-3">
  <h3 className="text-base font-medium leading-relaxed">Your Cloned Voices</h3>
  
  {clonedVoices.map(voice => (
    <Card key={voice._id}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{voice.voiceName}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Created {formatDate(voice.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="min-h-[44px]">
            <Play className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="min-h-[44px]">
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  ))}
  
  <Button 
    variant="default" 
    className="w-full min-h-[44px]"
    onClick={openCloningWizard}
  >
    <Plus className="h-4 w-4 mr-2" />
    Clone New Voice
  </Button>
</div>
```

---

### 📦 **Dependencies**

**Must be complete before starting Phase 2a**:
- ✅ Voice library working (Phase 1)
- ✅ Qwen 3 TTS basic integration complete
- ✅ Custom audio player component ready
- ✅ DynamicField patterns established
- ✅ Credit system working for voice generation

---

### ⚠️ **Complexity Factors**

**Challenges**:
- ⚠️ **Two-step API flow**: Clone voice → Generate with cloned voice
- ⚠️ **File upload validation**: Audio quality affects clone quality
- ⚠️ **Wizard state management**: 3 steps with async operations
- ⚠️ **User education**: Need clear guidance on reference audio quality

**Advantages**:
- ✅ Can reuse existing DynamicField patterns
- ✅ Can reuse custom audio player from Phase 1
- ✅ Can reuse file upload patterns from project (if any)
- ✅ FAL API handles the ML complexity

---

### 📊 **Feature Comparison Summary**

| Feature | Phase 1 (Core) | Phase 2a (Voice Cloning) |
|---------|---------------|--------------------------|
| **Record Own Voice** | ✅ YES (~3h in Phase 1) | - |
| **AI Voice Generation** | ✅ YES (13h total Phase 1) | - |
| **MiniMax 17 Voices** | ✅ Included | - |
| **Qwen 9 Preset Voices** | ✅ Included | - |
| **Voice Cloning** | ❌ Not yet | ✅ YES (8-10h) |
| **Custom Brand Voices** | ❌ Not yet | ✅ YES |
| **Unlimited Voice Variations** | ❌ Limited to 26 presets | ✅ Unlimited clones |

---

### 🎯 **Recommended Implementation Strategy**

**Phase 1 First** (~13 hours):
- ✅ Launch with 26 preset voices (17 MiniMax + 9 Qwen)
- ✅ Include voice recording/upload
- ✅ Full voice library management
- ✅ Step-4 integration
- ✅ Get user feedback on voice needs

**Phase 2a Later** (~8-10 hours) - **Only if users request custom voices**:
- Add voice cloning wizard
- Enable custom brand voice creation
- Allow unlimited voice variations

**Total Time if Both Phases**: ~21-23 hours

**User Value Assessment**:
- **Phase 1**: Covers 95% of use cases (26 voices + recording)
- **Phase 2a**: Covers advanced 5% (brand consistency, unique voices)

---

### 💡 **Alternative: Voice Cloning as Premium Feature**

Consider making voice cloning a **premium tier feature**:
- **Free tier**: 26 preset voices + recording (Phase 1)
- **Pro tier**: + Voice cloning (Phase 2a)
- **Credits**: 15 credits per clone (vs 3-5 for generation)

This justifies the implementation cost and creates upgrade incentive! 🚀

---

**Phase 2a Status**: 📝 **Planned but not required for MVP**  
**Phase 2a Priority**: ⭐⭐ **Medium** (implement after user validation)  
**Phase 2a Recommendation**: Wait for user demand before investing 8-10 hours

---

## 📝 Document Change Log

### v2.3 (February 18, 2026) - Senior Dev Review Fixes

**Critical QA Process Fixes Applied** (11 fixes):
- ✅ **Task 1.1**: Added 2-Step QA with Convex deploy
- ✅ **Task 1.2**: Added 2-Step QA with Convex deploy
- ✅ **Task 1.3**: Fixed QA formatting with step numbers + Convex deploy
- ✅ **Task 2.1**: Added 2-Step QA with Convex deploy
- ✅ **Task 2.2**: Fixed QA formatting with step numbers + Convex deploy
- ✅ **Task 4.1**: Added 2-Step QA for VoiceRecordingPanel
- ✅ **Task 4.2**: Added 2-Step QA with Convex deploy
- ✅ **Task 5.1**: Added 2-Step QA with Convex deploy
- ✅ **Task 5.2**: Added 2-Step QA for admin form
- ✅ **Task 5.3**: Added 2-Step QA for inspiration components
- ✅ **Phase 6**: Added Final Sprint QA section

**Review Status**:
- ✅ Convex Master Review: PASSED (v2.1)
- ✅ Design Master Review: PASSED (v2.1)
- ✅ i18n Master Review: PASSED (v2.1)
- ✅ Senior Dev Review: **APPROVED** (v2.3)

**Document Status**: 🚀 **100% READY FOR IMPLEMENTATION**

---

### v2.2 (February 18, 2026) - Architecture Review Fixes

Applied all critical fixes from Convex, Design, and i18n Master reviews:
- Type-safe schema (no `v.any()`)
- Internal action routing
- Authentication checks
- Storage error handling with credit refunds
- Design system compliance
- Complete i18n coverage (~290+ keys)

### v2.1 (February 18, 2026) - TTS Models Integration

Integrated 3 TTS models (MiniMax 2.8 HD, 2.8 Turbo, Qwen 3 TTS) with detailed analysis from `TTS-MODELS-ANALYSIS.md`.

### v2.0 (February 18, 2026) - Modular Architecture Rewrite

Complete rewrite to align with Sprint 30d.5 modular architecture pattern.

### v1.0 (February 18, 2026) - Initial Draft

Initial analysis with hardcoded patterns (deprecated).