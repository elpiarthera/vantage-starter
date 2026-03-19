# 🎬 Video Generator — Models Analysis & Schema Design

**Created**: March 1, 2026  
**Version**: 1.0  
**Status**: 🔄 IN PROGRESS — Models added as specs are shared  
**Purpose**: Define video model schemas for zero-code video model onboarding  
**Architecture Pattern**: Mirrors `IMAGE-MODELS-ANALYSIS.md` and `TTS-MODELS-ANALYSIS.md` for consistency.

**Related raw API analysis**: `docs/Analysis/KLING-3-MODELS-ANALYSIS.md` (10 Kling models, raw API reference)

---

## 📋 Document Purpose

This document provides:
1. **Comprehensive analysis** of available video generation models via fal.ai
2. **Schema design** for `videoModelSchemas` Convex table
3. **Backend configuration** for FAL API integration
4. **UI parameter mappings** for dynamic form rendering
5. **Credit cost calculations** per model and per configuration

**Architecture Pattern**: Mirrors `IMAGE-MODELS-ANALYSIS.md` and `TTS-MODELS-ANALYSIS.md` for consistency.

---

## 🎯 Schema Design Principles

### 1. Zero-Code Model Onboarding
- Add new video model = Add row to `videoModelSchemas` table
- No code changes required for new models
- Admin can manage via Convex dashboard or seed script

### 2. Dynamic UI Generation
- UI controls render from `params[]` array
- `DynamicField` component handles all standard control types
- Duration, aspect ratio, audio toggle — all schema-driven

### 3. Model Type System
Video models are categorized by their required inputs:

| Type | Key | Description | Required Inputs |
|------|-----|-------------|-----------------|
| Image-to-Video | `i2v` | Animates a start image | `start_image_url` |
| Text-to-Video | `t2v` | Generates from text only | `prompt` |
| Video-to-Video | `v2v` | Transforms existing video | `video_url` |
| Reference-to-Video | `r2v` | Consistent characters across shots | Reference images |

### 4. Backend Parameter Filtering
- `allowedParams` whitelist prevents invalid FAL API calls
- `maxPromptLength` enforces per-model limits
- `requiredParams` defines what must be provided before generation starts
- Parameter validation happens in generic action

### 5. Credit System Integration
- `creditActionType` links to `creditCosts` table
- Video pricing is **per second** (unlike image = per generation)
- Multiple `creditActionType` variants for audio on/off configurations
- No hardcoded costs in frontend or backend

---

## 🎬 Video Model Catalog

*Models added as specs are shared.*

| # | Model ID | Type | Tier | Status |
|---|----------|------|------|--------|
| 1 | `fal-ai/kling-video/v3/pro/image-to-video` | I2V | Pro | ✅ Documented |
| 2 | `fal-ai/kling-video/o3/pro/image-to-video` | I2V | Pro | ✅ Documented |
| 3 | `fal-ai/kling-video/o3/pro/reference-to-video` | R2V | Pro | ✅ Documented |
| 4 | `fal-ai/kling-video/o3/pro/video-to-video/edit` | V2V-Edit | Pro | ✅ Documented |
| 5 | `fal-ai/kling-video/o3/pro/video-to-video/reference` | V2V-Ref | Pro | ✅ Documented |

---

### Model 1: Kling Video v3 Pro — Image to Video

**FAL Model ID**: `fal-ai/kling-video/v3/pro/image-to-video`  
**Category**: Image-to-Video (`i2v`)  
**Tier**: Pro  
**Description**: Top-tier image-to-video with cinematic visuals, fluid motion, and native audio generation. Supports character/object consistency elements, multi-shot sequences, voice control, and start/end frame conditioning.

#### Capabilities

| Feature | Supported | Notes |
|---------|-----------|-------|
| Start frame image | ✅ Required | `start_image_url` — max 10MB, min 300×300px |
| End frame image | ✅ Optional | `end_image_url` — locks last frame for transition control |
| Text prompt | ✅ Optional | Max 2500 chars; either `prompt` or `multi_prompt`, not both |
| Duration control | ✅ 3–15s | Per-second pricing model |
| Aspect ratio | ✅ 3 options | 16:9, 9:16, 1:1 |
| Native audio generation | ✅ Yes (default on) | Chinese & English; others auto-translated |
| Voice control | ✅ Optional | Up to 2 custom voice IDs, `<<<voice_1>>>` syntax in prompt |
| Multi-shot | ✅ Optional | `multi_prompt` array divides video into labeled shots (up to 6) |
| Element consistency | ✅ Optional | Characters/objects via frontal + reference images or video |
| Negative prompt | ✅ Optional | Default: "blur, distort, and low quality" |
| CFG Scale | ✅ Optional | 0–1, controls prompt adherence |

#### Pricing

| Mode | Per second | 5s | 10s | 15s |
|------|-----------|-----|-----|-----|
| Audio **off** | $0.224 | $1.12 | $2.24 | $3.36 |
| Audio **on** | $0.336 | $1.68 | $3.36 | $5.04 |
| Audio **on** + Voice control | $0.392 | $1.96 | $3.92 | $5.88 |

#### Credit Cost Recommendations

**Verified example from FAL docs**: 5s + audio on + voice control = $0.392 × 5 = **$1.96** ✅

Assuming 1 credit = $0.02:

| Credit Action Type | Mode | $/sec | 5s cost | 5s credits | 10s cost | 10s credits |
|-------------------|------|-------|---------|------------|----------|-------------|
| `video_generation_kling_v3_pro_no_audio` | Audio off | $0.224 | $1.12 | **56** | $2.24 | **112** |
| `video_generation_kling_v3_pro_audio` | Audio on | $0.336 | $1.68 | **84** | $3.36 | **168** |
| `video_generation_kling_v3_pro_voice` | Audio + Voice control | $0.392 | $1.96 | **98** | $3.92 | **196** |

> **Recommended simplification**: Charge a flat rate per generation (not per second) for better UX. For example, 5s = 84 credits (audio on, default). Users don't need to count seconds.

#### Technical Specifications

- **Output format**: MP4 (`video/mp4`)
- **Max prompt length**: 2500 characters
- **Element images**: Max 10MB, min 300×300px, aspect ratio 0.4–2.5
- **Element video**: Max 200MB, 720–2160px, 3–10.05s, 24–60 FPS, max 1 video element per request
- **Voice IDs**: Max 2 per request, obtain from `fal-ai/kling-video/create-voice` endpoint
- **Multi-shot**: Each shot requires `prompt` (required) + `duration` (3–15s, default "5")

---

## 📊 Convex Schema: `videoModelSchemas` Table

### Table Definition

```typescript
videoModelSchemas: defineTable({
  // ─── Identifiers ───
  schemaId: v.string(),                    // e.g., "kling-v3-pro-i2v"
  name: v.string(),                        // e.g., "Kling v3 Pro"
  nameTranslationKey: v.optional(v.string()), // i18n key for model name
  description: v.optional(v.string()),

  // ─── FAL Config ───
  modelId: v.string(),                     // e.g., "fal-ai/kling-video/v3/pro/image-to-video"
  type: v.union(
    v.literal("i2v"),   // image-to-video
    v.literal("t2v"),   // text-to-video
    v.literal("v2v"),   // video-to-video
    v.literal("r2v"),   // reference-to-video
  ),

  // ─── Credit System ───
  creditActionType: v.string(),            // Links to creditCosts table
  creditActionTypeAudio: v.optional(v.string()), // Separate cost when audio enabled
  creditActionTypeVoice: v.optional(v.string()), // Separate cost when voice control used

  // ─── UI Capabilities (drives feature visibility in UI) ───
  capabilities: v.object({
    // Input types
    requiresStartImage: v.optional(v.boolean()),  // I2V: must upload start frame
    supportsEndImage: v.optional(v.boolean()),     // Optional end frame
    supportsTextPrompt: v.optional(v.boolean()),   // Text prompt support
    supportsNegativePrompt: v.optional(v.boolean()),
    // Duration
    supportsDuration: v.optional(v.boolean()),
    minDuration: v.optional(v.number()),
    maxDuration: v.optional(v.number()),
    // Audio
    supportsAudio: v.optional(v.boolean()),        // Native audio generation
    supportsVoiceControl: v.optional(v.boolean()), // Custom voice IDs
    // Advanced
    supportsMultiShot: v.optional(v.boolean()),    // multi_prompt feature
    supportsElements: v.optional(v.boolean()),     // Character/object consistency
    supportsCfgScale: v.optional(v.boolean()),
    // Aspect ratio
    aspectRatios: v.optional(v.array(v.string())), // ["16:9", "9:16", "1:1"]
  }),

  // ─── UI Badges ───
  badges: v.optional(v.array(v.string())),         // ["PRO", "CINEMATIC", "AUDIO"]

  // ─── UI Parameters (dynamic form) ───
  params: v.array(v.object({
    key: v.string(),
    control: v.string(),       // "textarea" | "select" | "slider" | "toggle" | "number" | "image" | "aspectratio"
    label: v.string(),         // i18n key
    hint: v.optional(v.string()),         // i18n key for tooltip
    placeholder: v.optional(v.string()),
    default: v.optional(v.any()),
    options: v.optional(v.array(v.object({
      value: v.union(v.string(), v.number(), v.boolean()),
      label: v.string(),
    }))),
    min: v.optional(v.number()),
    max: v.optional(v.number()),
    step: v.optional(v.number()),
    maxLength: v.optional(v.number()),
    required: v.optional(v.boolean()),
    advanced: v.optional(v.boolean()),
    unit: v.optional(v.string()),
    showWhen: v.optional(v.object({
      param: v.string(),
      value: v.union(v.string(), v.boolean()),
    })),
  })),

  // ─── Backend Config ───
  allowedParams: v.array(v.string()),
  requiredParams: v.optional(v.array(v.string())),  // Must be non-empty before generation
  maxPromptLength: v.optional(v.number()),

  // ─── Metadata ───
  sortOrder: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_schema_id", ["schemaId"])
  .index("by_model_id", ["modelId"])
  .index("by_type", ["type"])
  .index("by_active", ["isActive"])
```

---

### Model 1: Kling Video v3 Pro I2V — Full Schema Config

```typescript
{
  // ─── Identifiers ───
  schemaId: "kling-v3-pro-i2v",
  name: "Kling v3 Pro",
  nameTranslationKey: "video_models.kling_v3_pro",

  // ─── FAL Config ───
  modelId: "fal-ai/kling-video/v3/pro/image-to-video",
  type: "i2v",

  // ─── Credit System ───
  creditActionType: "video_generation_kling_v3_pro_no_audio",        // audio: false
  creditActionTypeAudio: "video_generation_kling_v3_pro_audio",      // audio: true
  creditActionTypeVoice: "video_generation_kling_v3_pro_voice",      // audio + voice IDs

  // ─── UI Capabilities ───
  capabilities: {
    requiresStartImage: true,
    supportsEndImage: true,
    supportsTextPrompt: true,
    supportsNegativePrompt: true,
    supportsDuration: true,
    minDuration: 3,
    maxDuration: 15,
    supportsAudio: true,
    supportsVoiceControl: true,
    supportsMultiShot: true,
    supportsElements: true,
    supportsCfgScale: true,
    aspectRatios: ["16:9", "9:16", "1:1"],
  },

  // ─── UI Badges ───
  badges: ["PRO", "CINEMATIC", "AUDIO"],

  // ─── UI Parameters ───
  params: [
    // ── Primary: Text Prompt ──
    {
      key: "prompt",
      control: "textarea",
      label: "video_generator.prompt_label",
      placeholder: "video_generator.prompt_placeholder",
      hint: "video_generator.prompt_hint_kling",   // "Supports @Element1 refs, <<<voice_1>>> for voice"
      maxLength: 2500,
      rows: 4,
      required: false,
      advanced: false,
    },

    // ── Aspect Ratio (visual button group) ──
    {
      key: "aspect_ratio",
      control: "aspectratio",                       // Special visual control: 16:9 / 9:16 / 1:1 buttons
      label: "video_generator.aspect_ratio_label",
      default: "16:9",
      required: false,
      advanced: false,
      options: [
        { value: "16:9", label: "16:9" },
        { value: "9:16", label: "9:16" },
        { value: "1:1", label: "1:1" },
      ],
    },

    // ── Duration (segmented select) ──
    {
      key: "duration",
      control: "select",
      label: "video_generator.duration_label",
      hint: "video_generator.duration_hint",       // "Longer = higher credit cost"
      default: "5",
      required: false,
      advanced: false,
      unit: "s",
      options: [
        { value: "3", label: "3s" },
        { value: "5", label: "5s" },
        { value: "8", label: "8s" },
        { value: "10", label: "10s" },
        { value: "12", label: "12s" },
        { value: "15", label: "15s" },
      ],
    },

    // ── Generate Audio (toggle) ──
    {
      key: "generate_audio",
      control: "toggle",
      label: "video_generator.generate_audio_label",
      hint: "video_generator.generate_audio_hint",  // "Adds native voice/sound. Increases cost."
      default: true,
      required: false,
      advanced: false,
    },

    // ── Advanced Settings ──

    // End Image URL
    {
      key: "end_image_url",
      control: "image",                            // Image upload control
      label: "video_generator.end_image_label",
      hint: "video_generator.end_image_hint",      // "Lock the last frame for transition control"
      required: false,
      advanced: true,
    },

    // Negative Prompt
    {
      key: "negative_prompt",
      control: "textarea",
      label: "video_generator.negative_prompt_label",
      default: "blur, distort, and low quality",
      maxLength: 2500,
      rows: 2,
      required: false,
      advanced: true,
    },

    // CFG Scale
    {
      key: "cfg_scale",
      control: "slider",
      label: "video_generator.cfg_scale_label",
      hint: "video_generator.cfg_scale_hint",      // "Higher = follow prompt more strictly"
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
      required: false,
      advanced: true,
    },

    // Voice IDs (shown only when generate_audio is true)
    {
      key: "voice_ids",
      control: "textarea",
      label: "video_generator.voice_ids_label",
      hint: "video_generator.voice_ids_hint",      // "Up to 2 IDs, one per line. Reference as <<<voice_1>>>"
      placeholder: "video_generator.voice_ids_placeholder",
      rows: 2,
      required: false,
      advanced: true,
      showWhen: { param: "generate_audio", value: true },
    },
  ],

  // ─── Backend Config ───
  allowedParams: [
    "prompt",
    "start_image_url",   // always injected from UI canvas, not from params[]
    "end_image_url",
    "duration",
    "generate_audio",
    "aspect_ratio",
    "negative_prompt",
    "cfg_scale",
    "voice_ids",
    "elements",          // handled by dedicated Elements UI (future)
    "multi_prompt",      // handled by multi-shot editor (future)
    "shot_type",         // always "customize" when multi_prompt is set
  ],
  requiredParams: ["start_image_url"],
  maxPromptLength: 2500,

  // ─── Metadata ───
  sortOrder: 10,
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
```

---

### Model 2: Kling Video O3 Pro — Image to Video (Transition)

**FAL Model ID**: `fal-ai/kling-video/o3/pro/image-to-video`  
**Category**: Image-to-Video (`i2v`)  
**Tier**: Pro  
**Description**: Generates a video by animating the transition between a start frame and an optional end frame, following text-driven style and scene guidance. Simpler and cheaper than v3 Pro — no voice control, no elements, no aspect ratio selection, no negative prompt.

> **Key distinction**: This is the "transition" model. Best used when you want to animate between two specific frames with precise control over the start and end state.

> ⚠️ **API difference from v3 Pro**: Start image param is `image_url` (NOT `start_image_url`). The backend `allowedParams` + param injection must account for this.

#### Capabilities

| Feature | Supported | Notes |
|---------|-----------|-------|
| Start frame image | ✅ Required | `image_url` — max 10MB, min 300×300px (**different param name from v3 Pro**) |
| End frame image | ✅ Optional | `end_image_url` — lock last frame for transition control |
| Text prompt | ✅ Optional | Max 2500 chars |
| Duration control | ✅ 3–15s | Per-second pricing |
| Aspect ratio | ❌ Not available | No aspect ratio param — inherits from input image |
| Native audio generation | ✅ Optional | Default **off** (unlike v3 Pro which defaults to on) |
| Voice control | ❌ Not available | No voice IDs |
| Multi-shot | ✅ Optional | `multi_prompt` array |
| Element consistency | ❌ Not available | No elements support |
| Negative prompt | ❌ Not available | Not in API |
| CFG Scale | ❌ Not available | Not in API |

#### Pricing

**Verified example**: 5s + audio on = $0.28 × 5 = **$1.40** ✅

| Mode | $/sec | 5s cost | 5s credits | 10s cost | 10s credits |
|------|-------|---------|------------|----------|-------------|
| Audio **off** | $0.224 | $1.12 | **56** | $2.24 | **112** |
| Audio **on** | $0.280 | $1.40 | **70** | $2.80 | **140** |

*Note: No voice control tier for this model. Audio on is cheaper than v3 Pro ($0.28 vs $0.336/sec).*

---

### Model 2: Kling O3 Pro I2V — Full Schema Config

```typescript
{
  // ─── Identifiers ───
  schemaId: "kling-o3-pro-i2v",
  name: "Kling O3 Pro",
  nameTranslationKey: "video_models.kling_o3_pro",

  // ─── FAL Config ───
  modelId: "fal-ai/kling-video/o3/pro/image-to-video",
  type: "i2v",

  // ─── Credit System ───
  // Note: no voice tier — only 2 actionTypes
  creditActionType: "video_generation_kling_o3_pro_no_audio",    // audio: false
  creditActionTypeAudio: "video_generation_kling_o3_pro_audio",  // audio: true

  // ─── UI Capabilities ───
  capabilities: {
    requiresStartImage: true,
    supportsEndImage: true,
    supportsTextPrompt: true,
    supportsNegativePrompt: false,
    supportsDuration: true,
    minDuration: 3,
    maxDuration: 15,
    supportsAudio: true,
    supportsVoiceControl: false,
    supportsMultiShot: true,
    supportsElements: false,
    supportsCfgScale: false,
    aspectRatios: [],             // No aspect ratio — inherits from image
  },

  // ─── UI Badges ───
  badges: ["PRO", "TRANSITION"],

  // ─── UI Parameters ───
  params: [
    // ── Primary: Text Prompt ──
    {
      key: "prompt",
      control: "textarea",
      label: "video_generator.prompt_label",
      placeholder: "video_generator.prompt_placeholder",
      maxLength: 2500,
      rows: 4,
      required: false,
      advanced: false,
    },

    // ── Duration (segmented select) ──
    {
      key: "duration",
      control: "select",
      label: "video_generator.duration_label",
      hint: "video_generator.duration_hint",
      default: "5",
      required: false,
      advanced: false,
      unit: "s",
      options: [
        { value: "3", label: "3s" },
        { value: "5", label: "5s" },
        { value: "8", label: "8s" },
        { value: "10", label: "10s" },
        { value: "12", label: "12s" },
        { value: "15", label: "15s" },
      ],
    },

    // ── Generate Audio (toggle) — default OFF unlike v3 Pro ──
    {
      key: "generate_audio",
      control: "toggle",
      label: "video_generator.generate_audio_label",
      hint: "video_generator.generate_audio_hint",
      default: false,        // ⚠️ Default OFF — different from v3 Pro
      required: false,
      advanced: false,
    },

    // ── Advanced Settings ──

    // End Image URL
    {
      key: "end_image_url",
      control: "image",
      label: "video_generator.end_image_label",
      hint: "video_generator.end_image_hint",
      required: false,
      advanced: true,
    },
  ],

  // ─── Backend Config ───
  // ⚠️ IMPORTANT: start image param name is "image_url" (NOT "start_image_url")
  // The backend must inject the start image under key "image_url" for this model
  allowedParams: [
    "prompt",
    "image_url",       // ⚠️ Different from v3 Pro's "start_image_url"
    "end_image_url",
    "duration",
    "generate_audio",
    "multi_prompt",
    "shot_type",
  ],
  requiredParams: ["image_url"],
  maxPromptLength: 2500,

  // ─── Metadata ───
  sortOrder: 20,
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
```

---

### Model 3: Kling Video O3 Pro — Reference to Video

**FAL Model ID**: `fal-ai/kling-video/o3/pro/reference-to-video`  
**Category**: Reference-to-Video (`r2v`)  
**Tier**: Pro  
**Description**: Transform reference images, elements, and text into consistent, high-quality video scenes. Ensures stable character identity, object details, and environments across the generation. Unique in that **no parameters are strictly required** — can generate from elements alone, from start frame alone, from reference images alone, or any combination.

> **Key distinction**: This is the "character/style consistency" model. Best used when you have reference images of characters or objects that need to appear consistently in the video. Unlike the I2V models, start image is optional — you can generate purely from element references.

> ⚠️ **New param**: `image_urls` — reference images for style/appearance (up to 4 total with elements). Referenced in prompt as `@Image1`, `@Image2`. Different from `elements` (which define characters via frontal + side views).

#### Capabilities

| Feature | Supported | Notes |
|---------|-----------|-------|
| Start frame image | ✅ Optional | `start_image_url` — max 10MB, min 300×300px |
| End frame image | ✅ Optional | `end_image_url` — lock last frame |
| Text prompt | ✅ Optional | Max 2500 chars. Use `@Element1`, `@Image1` refs |
| Duration control | ✅ 3–15s | Per-second pricing |
| Aspect ratio | ✅ 3 options | 16:9, 9:16, 1:1 (restored vs O3 Pro I2V) |
| Native audio generation | ✅ Optional | Default **off** |
| Voice control | ❌ Not available | — |
| Multi-shot | ✅ Optional | `multi_prompt` array |
| Element consistency | ✅ Optional | Characters/objects via frontal + reference images (`elements`) |
| Style reference images | ✅ Optional | `image_urls` — up to 4 total (refs + elements). `@Image1`, `@Image2` in prompt |
| Negative prompt | ❌ Not available | — |
| CFG Scale | ❌ Not available | — |
| **Required params** | **None** | `{}` is a valid request ⚠️ |

#### Pricing

Same as O3 Pro I2V:  
**Verified example**: 5s + audio on = $0.28 × 5 = **$1.40** ✅

| Mode | $/sec | 5s cost | 5s credits | 10s cost | 10s credits |
|------|-------|---------|------------|----------|-------------|
| Audio **off** | $0.224 | $1.12 | **56** | $2.24 | **112** |
| Audio **on** | $0.280 | $1.40 | **70** | $2.80 | **140** |

---

### Model 3: Kling O3 Pro R2V — Full Schema Config

```typescript
{
  // ─── Identifiers ───
  schemaId: "kling-o3-pro-r2v",
  name: "Kling O3 Pro Reference",
  nameTranslationKey: "video_models.kling_o3_pro_r2v",

  // ─── FAL Config ───
  modelId: "fal-ai/kling-video/o3/pro/reference-to-video",
  type: "r2v",

  // ─── Credit System ───
  creditActionType: "video_generation_kling_o3_pro_r2v_no_audio",
  creditActionTypeAudio: "video_generation_kling_o3_pro_r2v_audio",

  // ─── UI Capabilities ───
  capabilities: {
    requiresStartImage: false,       // ⚠️ Optional — unique among I2V/R2V models
    supportsEndImage: true,
    supportsTextPrompt: true,
    supportsNegativePrompt: false,
    supportsDuration: true,
    minDuration: 3,
    maxDuration: 15,
    supportsAudio: true,
    supportsVoiceControl: false,
    supportsMultiShot: true,
    supportsElements: true,          // character/object consistency
    supportsStyleImages: true,       // NEW: image_urls for style reference
    supportsCfgScale: false,
    aspectRatios: ["16:9", "9:16", "1:1"],
  },

  // ─── UI Badges ───
  badges: ["PRO", "REFERENCE", "ELEMENTS"],

  // ─── UI Parameters ───
  params: [
    // ── Primary: Text Prompt ──
    {
      key: "prompt",
      control: "textarea",
      label: "video_generator.prompt_label",
      placeholder: "video_generator.prompt_placeholder_r2v",  // "@Element1 enters the scene..."
      hint: "video_generator.prompt_hint_r2v",   // "Reference elements as @Element1, @Element2, style images as @Image1, @Image2"
      maxLength: 2500,
      rows: 4,
      required: false,
      advanced: false,
    },

    // ── Aspect Ratio ──
    {
      key: "aspect_ratio",
      control: "aspectratio",
      label: "video_generator.aspect_ratio_label",
      default: "16:9",
      required: false,
      advanced: false,
      options: [
        { value: "16:9", label: "16:9" },
        { value: "9:16", label: "9:16" },
        { value: "1:1", label: "1:1" },
      ],
    },

    // ── Duration ──
    {
      key: "duration",
      control: "select",
      label: "video_generator.duration_label",
      hint: "video_generator.duration_hint",
      default: "5",
      required: false,
      advanced: false,
      unit: "s",
      options: [
        { value: "3", label: "3s" },
        { value: "5", label: "5s" },
        { value: "8", label: "8s" },
        { value: "10", label: "10s" },
        { value: "12", label: "12s" },
        { value: "15", label: "15s" },
      ],
    },

    // ── Generate Audio — default OFF ──
    {
      key: "generate_audio",
      control: "toggle",
      label: "video_generator.generate_audio_label",
      hint: "video_generator.generate_audio_hint",
      default: false,
      required: false,
      advanced: false,
    },

    // ── Advanced Settings ──

    // End Image URL
    {
      key: "end_image_url",
      control: "image",
      label: "video_generator.end_image_label",
      hint: "video_generator.end_image_hint",
      required: false,
      advanced: true,
    },
  ],

  // ─── Backend Config ───
  // Note: no required params — start_image_url and image_urls handled by dedicated UI panels
  allowedParams: [
    "prompt",
    "start_image_url",
    "end_image_url",
    "image_urls",          // NEW: style reference images array
    "elements",            // character/object consistency panels
    "duration",
    "generate_audio",
    "aspect_ratio",
    "multi_prompt",
    "shot_type",
  ],
  requiredParams: [],      // ⚠️ Nothing required — generation can start from elements alone
  maxPromptLength: 2500,

  // ─── Metadata ───
  sortOrder: 30,
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
```

---

### Model 4: Kling Video O3 Pro — Video to Video Edit

**FAL Model ID**: `fal-ai/kling-video/o3/pro/video-to-video/edit`  
**Category**: Video-to-Video (`v2v`)  
**Tier**: Pro  
**Description**: Edit an existing video using text prompts and reference images/elements. Transforms environment, replaces characters, changes style — while preserving motion and timing from the source video.

> **Key distinction**: First V2V model. Takes an existing video as input and edits it. Output duration = input video duration (no duration control). Prompt is **required** — you must describe what to change.

> ⚠️ **Pricing is different**: Single flat rate of **$0.336/sec** — no audio/no-audio tier. The `keep_audio` param (default: true) keeps the original video's audio; no native AI audio generation.

> ⚠️ **No `multi_prompt`** — V2V edit operates on the full video at once.

#### Capabilities

| Feature | Supported | Notes |
|---------|-----------|-------|
| Input video | ✅ **Required** | `video_url` — .mp4/.mov, 3–10s, 720–2160px, max 200MB, 24–60 FPS |
| Text prompt | ✅ **Required** | Max 2500 chars. Reference video as `@Video1`, styles as `@Image1`, elements as `@Element1` |
| Duration control | ❌ Not available | Output duration = input video duration |
| Aspect ratio | ❌ Not available | Inherits from input video |
| Keep original audio | ✅ Yes (default on) | `keep_audio: true` — replaces `generate_audio` concept |
| AI audio generation | ❌ Not available | No native audio; only keep/discard original |
| Voice control | ❌ Not available | — |
| Multi-shot | ❌ Not available | No `multi_prompt` |
| Element consistency | ✅ Optional | `elements` (image-only, no video elements in this model) |
| Style reference images | ✅ Optional | `image_urls` — up to 4 total (refs + elements). `@Image1` in prompt |
| Negative prompt | ❌ Not available | — |
| CFG Scale | ❌ Not available | — |
| Start/End Frame | ❌ Not available | V2V operates on the full video |

#### Pricing

**Single pricing tier — no audio/no-audio split**  
**Verified example**: 5s = $0.336 × 5 = **$1.68** ✅

| Duration | Cost | Credits |
|----------|------|---------|
| 3s | $1.01 | **50** |
| 5s | $1.68 | **84** |
| 8s | $2.69 | **134** |
| 10s | $3.36 | **168** |

*Assumes 1 credit = $0.02. Output duration = input duration (3–10s max).*

---

### Model 4: Kling O3 Pro V2V Edit — Full Schema Config

```typescript
{
  // ─── Identifiers ───
  schemaId: "kling-o3-pro-v2v-edit",
  name: "Kling O3 Pro Edit",
  nameTranslationKey: "video_models.kling_o3_pro_v2v_edit",

  // ─── FAL Config ───
  modelId: "fal-ai/kling-video/o3/pro/video-to-video/edit",
  type: "v2v",

  // ─── Credit System ───
  // Single rate — no audio tier split for V2V
  creditActionType: "video_generation_kling_o3_pro_v2v_edit",

  // ─── UI Capabilities ───
  capabilities: {
    requiresStartImage: false,
    requiresVideoInput: true,           // NEW: V2V requires video upload
    supportsEndImage: false,
    supportsTextPrompt: true,
    requiresTextPrompt: true,           // NEW: prompt is REQUIRED for V2V edit
    supportsNegativePrompt: false,
    supportsDuration: false,            // Output duration = input duration
    supportsAudio: false,               // No AI audio generation
    supportsKeepAudio: true,            // NEW: keep/discard original video audio
    supportsVoiceControl: false,
    supportsMultiShot: false,           // No multi_prompt for V2V edit
    supportsElements: true,             // Image-only elements
    supportsStyleImages: true,          // image_urls for style reference
    supportsCfgScale: false,
    aspectRatios: [],                   // Inherits from input video
  },

  // ─── UI Badges ───
  badges: ["PRO", "EDIT", "V2V"],

  // ─── UI Parameters ───
  params: [
    // ── Primary: Text Prompt (REQUIRED for this model) ──
    {
      key: "prompt",
      control: "textarea",
      label: "video_generator.prompt_label",
      placeholder: "video_generator.prompt_placeholder_v2v",  // "Change environment to snow as @Image1. Replace character with @Element1"
      hint: "video_generator.prompt_hint_v2v",                // "Reference source video as @Video1, style images as @Image1, elements as @Element1"
      maxLength: 2500,
      rows: 4,
      required: true,      // ⚠️ Required for V2V edit
      advanced: false,
    },

    // ── Keep Audio (toggle — semantics different from generate_audio) ──
    {
      key: "keep_audio",
      control: "toggle",
      label: "video_generator.keep_audio_label",              // "Keep Original Audio"
      hint: "video_generator.keep_audio_hint",                // "Preserve the audio track from the source video"
      default: true,
      required: false,
      advanced: false,
    },
  ],

  // ─── Backend Config ───
  // ⚠️ video_url is required — must be uploaded/provided by UI, injected by backend
  allowedParams: [
    "prompt",
    "video_url",           // Always injected from the V2V canvas input
    "image_urls",          // Style reference images
    "elements",            // Character/object consistency panels
    "keep_audio",
    "shot_type",
  ],
  requiredParams: ["prompt", "video_url"],
  maxPromptLength: 2500,

  // ─── Metadata ───
  sortOrder: 40,
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
```

---

### Model 5: Kling Video O3 Pro — Video to Video Reference

**FAL Model ID**: `fal-ai/kling-video/o3/pro/video-to-video/reference`  
**Category**: Video-to-Video Reference (`v2v`)  
**Tier**: Pro  
**Description**: Generates **new shots** guided by an input reference video, preserving cinematic language such as motion, camera style, and scene continuity. Unlike V2V Edit (which modifies the reference), this model uses the reference as a cinematic guide to produce a new video — with full duration and aspect ratio control.

> **Key distinction vs V2V Edit**: This generates a *new* video *inspired by* the reference. V2V Edit *modifies* the reference. Same pricing, but V2V Reference restores duration and aspect ratio control.

> ⚠️ **New `aspect_ratio` value**: `"auto"` (default) — lets the model decide based on the reference video. Not present in any previous model. The `aspectratio` UI control must support an `"auto"` option.

#### Capabilities

| Feature | Supported | Notes |
|---------|-----------|-------|
| Input video | ✅ **Required** | `video_url` — .mp4/.mov, 3–10s, 720–2160px, max 200MB, 24–60 FPS |
| Text prompt | ✅ **Required** | Max 2500 chars. Reference as `@Video1`, `@Image1`, `@Element1` |
| Duration control | ✅ 3–15s | **Restored** vs V2V Edit — can output longer than the reference |
| Aspect ratio | ✅ `"auto"` default | **New value**: `"auto"`, `"16:9"`, `"9:16"`, `"1:1"` |
| Native audio generation | ❌ Not available | — |
| Keep original audio | ✅ Yes (default on) | `keep_audio: true` |
| Voice control | ❌ Not available | — |
| Multi-shot | ❌ Not available | No `multi_prompt` |
| Element consistency | ✅ Optional | Image-only elements (`KlingV3ImageElementInput`) |
| Style reference images | ✅ Optional | `image_urls` — up to 4 total (refs + elements) |
| Negative prompt | ❌ Not available | — |
| CFG Scale | ❌ Not available | — |

#### Pricing

Same as V2V Edit — flat rate, no audio tier split:  
**Verified example**: 5s = $0.336 × 5 = **$1.68** ✅

| Duration | Cost | Credits |
|----------|------|---------|
| 3s | $1.01 | **50** |
| 5s | $1.68 | **84** |
| 8s | $2.69 | **134** |
| 10s | $3.36 | **168** |
| 15s | $5.04 | **252** |

---

### Model 5: Kling O3 Pro V2V Reference — Full Schema Config

```typescript
{
  // ─── Identifiers ───
  schemaId: "kling-o3-pro-v2v-reference",
  name: "Kling O3 Pro Reference",
  nameTranslationKey: "video_models.kling_o3_pro_v2v_reference",

  // ─── FAL Config ───
  modelId: "fal-ai/kling-video/o3/pro/video-to-video/reference",
  type: "v2v",

  // ─── Credit System ───
  creditActionType: "video_generation_kling_o3_pro_v2v_reference",

  // ─── UI Capabilities ───
  capabilities: {
    requiresStartImage: false,
    requiresVideoInput: true,
    supportsEndImage: false,
    supportsTextPrompt: true,
    requiresTextPrompt: true,
    supportsNegativePrompt: false,
    supportsDuration: true,           // ✅ Restored vs V2V Edit
    minDuration: 3,
    maxDuration: 15,
    supportsAudio: false,
    supportsKeepAudio: true,
    supportsVoiceControl: false,
    supportsMultiShot: false,
    supportsElements: true,
    supportsStyleImages: true,
    supportsCfgScale: false,
    aspectRatios: ["auto", "16:9", "9:16", "1:1"],  // ⚠️ "auto" is new
  },

  // ─── UI Badges ───
  badges: ["PRO", "STYLE", "V2V"],

  // ─── UI Parameters ───
  params: [
    // ── Primary: Text Prompt (REQUIRED) ──
    {
      key: "prompt",
      control: "textarea",
      label: "video_generator.prompt_label",
      placeholder: "video_generator.prompt_placeholder_v2v_ref",  // "Integrate @Element1. Style as @Image1 watercolor"
      hint: "video_generator.prompt_hint_v2v",
      maxLength: 2500,
      rows: 4,
      required: true,
      advanced: false,
    },

    // ── Aspect Ratio — includes "auto" ──
    {
      key: "aspect_ratio",
      control: "aspectratio",
      label: "video_generator.aspect_ratio_label",
      default: "auto",              // ⚠️ Default is "auto" — model decides from reference
      required: false,
      advanced: false,
      options: [
        { value: "auto", label: "video_generator.aspect_ratio_auto" },  // "Auto"
        { value: "16:9", label: "16:9" },
        { value: "9:16", label: "9:16" },
        { value: "1:1", label: "1:1" },
      ],
    },

    // ── Duration (3-15s — restored vs V2V Edit) ──
    {
      key: "duration",
      control: "select",
      label: "video_generator.duration_label",
      hint: "video_generator.duration_hint",
      default: "5",
      required: false,
      advanced: false,
      unit: "s",
      options: [
        { value: "3", label: "3s" },
        { value: "5", label: "5s" },
        { value: "8", label: "8s" },
        { value: "10", label: "10s" },
        { value: "12", label: "12s" },
        { value: "15", label: "15s" },
      ],
    },

    // ── Keep Audio (default on) ──
    {
      key: "keep_audio",
      control: "toggle",
      label: "video_generator.keep_audio_label",
      hint: "video_generator.keep_audio_hint",
      default: true,
      required: false,
      advanced: false,
    },
  ],

  // ─── Backend Config ───
  allowedParams: [
    "prompt",
    "video_url",       // Injected from V2V canvas input
    "image_urls",
    "elements",
    "keep_audio",
    "duration",
    "aspect_ratio",
    "shot_type",
  ],
  requiredParams: ["prompt", "video_url"],
  maxPromptLength: 2500,

  // ─── Metadata ───
  sortOrder: 50,
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
```

---

## 💰 Credit Cost Configuration

### Kling v3 Pro I2V

**FAL Pricing**: Per second of generated video  
**Verified example**: 5s + audio on + voice control = $0.392 × 5 = **$1.96** ✅

| Mode | $/sec | 5s cost | 5s credits | 10s cost | 10s credits |
|------|-------|---------|------------|----------|-------------|
| Audio off | $0.224 | $1.12 | **56** | $2.24 | **112** |
| Audio on | $0.336 | $1.68 | **84** | $3.36 | **168** |
| Audio on + Voice control | $0.392 | $1.96 | **98** | $3.92 | **196** |

*Assumes 1 credit = $0.02. Credits are approximate — round up.*

**Recommended approach — 3 actionTypes, backend selects based on params**:

```typescript
{ actionType: "video_generation_kling_v3_pro_no_audio", credits: 56 }  // audio: false (5s baseline)
{ actionType: "video_generation_kling_v3_pro_audio",    credits: 84 }  // audio: true (5s baseline)
{ actionType: "video_generation_kling_v3_pro_voice",    credits: 98 }  // audio: true + voice_ids set (5s baseline)
```

Backend logic: pick actionType from `generate_audio` + `voice_ids` non-empty. For durations ≠ 5s, scale: `Math.ceil(baseCredits * durationSeconds / 5)`.

**MVP Simplified approach** — Single flat rate, most common case (5s, audio on):

```typescript
{
  actionType: "video_generation_kling_v3_pro",
  costInCredits: 84,
  description: "Kling v3 Pro — 5s video with audio (default)",
  category: "video",
  isActive: true,
}
```

> Start with the MVP flat rate for v1. Evolve to 3-tier + duration scaling in a follow-up sprint.

---

### Kling O3 Pro I2V

**FAL Pricing**: Per second of generated video  
**Verified example**: 5s + audio on = $0.28 × 5 = **$1.40** ✅  
**Note**: No voice control tier. Audio-on price is cheaper than v3 Pro ($0.28 vs $0.336/sec).

| Mode | $/sec | 5s cost | 5s credits | 10s cost | 10s credits |
|------|-------|---------|------------|----------|-------------|
| Audio off | $0.224 | $1.12 | **56** | $2.24 | **112** |
| Audio on | $0.280 | $1.40 | **70** | $2.80 | **140** |

*Assumes 1 credit = $0.02.*

**2 actionTypes (backend picks based on `generate_audio`)**:

```typescript
{ actionType: "video_generation_kling_o3_pro_no_audio", credits: 56 }  // audio: false (5s baseline)
{ actionType: "video_generation_kling_o3_pro_audio",    credits: 70 }  // audio: true (5s baseline)
```

**MVP flat rate** (5s, audio off — note default is false for this model):

```typescript
{
  actionType: "video_generation_kling_o3_pro",
  costInCredits: 56,
  description: "Kling O3 Pro — 5s video, audio off (default)",
  category: "video",
  isActive: true,
}
```

---

### Kling O3 Pro R2V

**FAL Pricing**: Identical to O3 Pro I2V — same per-second rates  
**Verified example**: 5s + audio on = $0.28 × 5 = **$1.40** ✅

| Mode | $/sec | 5s cost | 5s credits | 10s cost | 10s credits |
|------|-------|---------|------------|----------|-------------|
| Audio off | $0.224 | $1.12 | **56** | $2.24 | **112** |
| Audio on | $0.280 | $1.40 | **70** | $2.80 | **140** |

*Assumes 1 credit = $0.02.*

```typescript
{ actionType: "video_generation_kling_o3_pro_r2v_no_audio", credits: 56 }
{ actionType: "video_generation_kling_o3_pro_r2v_audio",    credits: 70 }
```

**MVP flat rate** (5s, audio off):

```typescript
{
  actionType: "video_generation_kling_o3_pro_r2v",
  costInCredits: 56,
  description: "Kling O3 Pro Reference — 5s video, audio off (default)",
  category: "video",
  isActive: true,
}
```

---

### Kling O3 Pro V2V Edit

**FAL Pricing**: Single flat rate — **no audio/no-audio tier split**  
**Verified example**: 5s = $0.336 × 5 = **$1.68** ✅  
**Note**: `keep_audio` controls existing audio preservation only; no AI audio generation.

| Duration | $/sec | Cost | Credits |
|----------|-------|------|---------|
| 3s | $0.336 | $1.01 | **50** |
| 5s | $0.336 | $1.68 | **84** |
| 8s | $0.336 | $2.69 | **134** |
| 10s | $0.336 | $3.36 | **168** |

*Assumes 1 credit = $0.02. Output duration = input video duration.*

**Single actionType** (no audio tier variants):

```typescript
{ actionType: "video_generation_kling_o3_pro_v2v_edit", credits: 84 }  // 5s baseline
```

Backend scales credits by actual input video duration: `Math.ceil(84 * inputDurationSeconds / 5)`.

**MVP flat rate** (5s baseline):

```typescript
{
  actionType: "video_generation_kling_o3_pro_v2v_edit",
  costInCredits: 84,
  description: "Kling O3 Pro V2V Edit — per 5s of input video",
  category: "video",
  isActive: true,
}
```

---

### Kling O3 Pro V2V Reference

**FAL Pricing**: Identical to V2V Edit — flat $0.336/sec, no audio tier  
**Verified example**: 5s = $0.336 × 5 = **$1.68** ✅  
**Note**: Duration is now freely selectable (3–15s), unlike V2V Edit which is fixed by input duration.

| Duration | Cost | Credits |
|----------|------|---------|
| 3s | $1.01 | **50** |
| 5s | $1.68 | **84** |
| 10s | $3.36 | **168** |
| 15s | $5.04 | **252** |

*Backend scales: `Math.ceil(84 * selectedDuration / 5)`*

```typescript
{ actionType: "video_generation_kling_o3_pro_v2v_reference", credits: 84 }  // 5s baseline
```

```typescript
{
  actionType: "video_generation_kling_o3_pro_v2v_reference",
  costInCredits: 84,
  description: "Kling O3 Pro V2V Reference — 5s baseline",
  category: "video",
  isActive: true,
}
```

---

## 🔧 Backend Integration Pattern

### Generic Video Action (`videoToolGeneric.ts`)

The storyboard generator backend should mirror the image/voice modular pattern:

```typescript
export const generateGenericVideo = internalAction({
  args: {
    modelId: v.string(),
    startImageUrl: v.optional(v.string()),  // Required for I2V; absent for V2V/R2V
    inputVideoUrl: v.optional(v.string()),  // Required for V2V; absent for I2V/R2V
    params: v.any(),                        // All other params from schema
    transactionId: v.id("creditTransactions"),
    clerkUserId: v.string(),
    projectId: v.optional(v.id("projects")),
    sceneId: v.optional(v.id("scenes")),
  },
  handler: async (ctx, args) => {
    // 1. Get schema from Convex
    const schema = await ctx.runQuery(internal.videoModels.getByModelId, {
      modelId: args.modelId,
    });
    if (!schema) {
      await ctx.runMutation(internal.credits.refundCredits, { transactionId: args.transactionId });
      throw new Error(`Unknown video model: ${args.modelId}`);
    }

    // 2. Filter params via schema.allowedParams
    const rawParams = args.params as Record<string, unknown>;
    const filteredParams: Record<string, unknown> = {};
    for (const key of schema.allowedParams) {
      if (key in rawParams && rawParams[key] !== undefined) {
        filteredParams[key] = rawParams[key];
      }
    }

    // 3. Inject canvas inputs based on model type
    if (schema.type === "i2v" && args.startImageUrl) {
      // ⚠️ Different I2V models use different param names:
      //   - v3 Pro: "start_image_url"
      //   - O3 Pro I2V: "image_url"
      // Derive the correct key from schema.requiredParams.
      const startImageKey = schema.requiredParams?.find(
        (p) => p === "start_image_url" || p === "image_url",
      ) ?? "start_image_url";
      filteredParams[startImageKey] = args.startImageUrl;
    }

    if (schema.type === "v2v" && args.inputVideoUrl) {
      // V2V edit: inject source video URL under "video_url"
      filteredParams.video_url = args.inputVideoUrl;
    }

    // R2V: start_image_url is optional — only inject if provided by UI
    if (schema.type === "r2v" && args.startImageUrl) {
      filteredParams.start_image_url = args.startImageUrl;
    }

    // 4. Apply conditional param filtering (showWhen)
    if (schema.conditionalParams) {
      for (const cond of schema.conditionalParams) {
        const conditionMet = filteredParams[cond.showWhen.param] === cond.showWhen.value;
        if (!conditionMet) {
          delete filteredParams[cond.param];
        }
      }
    }

    // 5. Handle voice_ids — convert textarea newline-separated to array
    if (typeof filteredParams.voice_ids === "string") {
      filteredParams.voice_ids = (filteredParams.voice_ids as string)
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 2);  // Max 2 voice IDs
    }

    // 6. Sanitize prompt length
    if (typeof filteredParams.prompt === "string" && schema.maxPromptLength) {
      filteredParams.prompt = filteredParams.prompt.slice(0, schema.maxPromptLength);
    }

    // 7. Call FAL API (queue-based, long-running)
    const result = await fal.subscribe(schema.modelId, {
      input: filteredParams,
      logs: true,
    });

    // 8. Store video reference
    const videoUrl = result.video?.url;
    if (!videoUrl) throw new Error("No video URL in FAL response");

    // 9. Save to scenes table (updates scene.videoUrl)
    if (args.sceneId) {
      await ctx.runMutation(internal.scenes.updateVideoUrl, {
        sceneId: args.sceneId,
        videoUrl,
        modelId: schema.modelId,
        schemaId: schema.schemaId,
        generationParams: filteredParams,
      });
    }

    return {
      success: true,
      videoUrl,
      modelId: schema.modelId,
    };
  },
});
```

---

## 🎨 UI Control Mapping

### Control Types for Video Generator

| Control Type | Used For | Example Param |
|-------------|----------|---------------|
| `textarea` | Long text input | `prompt`, `negative_prompt` |
| `aspectratio` | Visual 3-button group | `aspect_ratio` |
| `select` | Dropdown / segmented | `duration` |
| `toggle` | Boolean on/off | `generate_audio` |
| `slider` | Numeric range | `cfg_scale` |
| `image` | Image upload | `end_image_url`, `start_image_url` |
| `number` | Integer input | (future use) |

### Special UI Components (Future)

| Feature | Component | Notes |
|---------|-----------|-------|
| Start image | `VideoCanvasSection` | Always visible in I2V mode — image drag & drop |
| Elements editor | `ElementsPanel` | Add characters/objects with frontal + reference images |
| Multi-shot editor | `MultiShotEditor` | Per-shot prompt + duration strips |
| Voice ID manager | `VoiceIdPanel` | Create and assign custom voice IDs |

---

## 📋 i18n Keys Required

### Model Names

```json
{
  "video_models": {
    "kling_v3_pro": "Kling v3 Pro",
    "kling_v3_pro_desc": "Cinematic quality with native audio and character consistency"
  }
}
```

### Core Video Generator Keys

```json
{
  "video_generator": {
    "prompt_label": "Motion Description",
    "prompt_placeholder": "Describe the motion, action, and atmosphere...",
    "prompt_hint_kling": "Reference elements with @Element1, voices with <<<voice_1>>>",
    "aspect_ratio_label": "Aspect Ratio",
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
    "voice_ids_hint": "Up to 2 voice IDs (one per line). Reference in prompt as <<<voice_1>>>",
    "voice_ids_placeholder": "voice_id_1\nvoice_id_2",
    "aspect_ratio_auto": "Auto",
    "keep_audio_label": "Keep Original Audio",
    "keep_audio_hint": "Preserve the audio track from the source video",
    "prompt_placeholder_v2v": "Change environment to snow as @Image1. Replace character with @Element1",
    "prompt_placeholder_v2v_ref": "Integrate @Element1 in the scene. Style following watercolor @Image1",
    "prompt_hint_v2v": "Reference source video as @Video1, style images as @Image1, elements as @Element1"
  }
}
```

---

## 🏗️ Architecture — Storyboard Generator → Production

### Current State (Sprint 24 — Demo)

The storyboard generator was copied from `seq` repo as a UI-only demo with:
- Hardcoded `VideoModel` type (`"veo3.1-fast"`, `"wan-2.5"`, `"wan-2.2-transition"`)
- No Convex integration
- Backend calls commented out
- No credit system
- No modular model schemas

### Target State (Production)

Mirror the **Image Generator** + **Voice Generator** architecture:

```
videoModelSchemas (Convex)
    │
    ├── videoToolGeneric.ts (internalAction)
    │       └── calls fal.subscribe(schema.modelId, filteredParams)
    │
    ├── videoTool.ts (mutations — client-facing)
    │       ├── startGenericVideoGeneration(schemaId, startImageUrl, params)
    │       └── schedules internal.videoToolGeneric.generateGenericVideo
    │
    └── StoryboardGenerator UI (components/storyboard-generator/)
            ├── index.tsx — canvas-first layout
            ├── VideoCanvasSection.tsx — start image upload + video preview
            ├── FloatingPromptBar.tsx — motion description input
            ├── PremiumTabSystem.tsx — model selector
            ├── FloatingOptionsPanel.tsx — duration, audio, aspect ratio
            └── StoryboardPanel.tsx — per-scene generation card
```

### Key Differences vs. Image/Voice Generators

1. **Per-scene generation**: Each storyboard panel generates its own video (not a single output)
2. **Start image required (I2V)**: Must upload or select an image for each scene
3. **Long generation time**: Video generation takes 30–120s — polling/status UI critical
4. **Output stored in scenes table**: Videos linked to `scenes._id`, not a standalone `videoTracks` table
5. **Duration affects cost**: Per-second pricing requires dynamic credit calculation

---

## 🚀 Adding New Video Models

### Step-by-Step Process

1. **Analyze FAL API Documentation**
   - Get OpenAPI schema
   - Identify model type (i2v/t2v/v2v/r2v)
   - Map required vs optional params
   - Note pricing per second
   - Check capabilities (audio, elements, multi-shot, etc.)

2. **Design Schema Entry**
   - Choose `schemaId` (e.g., `"kling-v3-standard-i2v"`)
   - Map FAL params to UI controls
   - Define capabilities flags
   - Set badges and sortOrder

3. **Add to Seed Script** (`convex/seed/seedVideoModels.ts`)
   ```typescript
   await ctx.db.insert("videoModelSchemas", { /* full schema */ });
   await ctx.db.insert("creditCosts", { actionType: "...", credits: N });
   ```

4. **Add i18n Keys** — model name + any new param labels

5. **Test**
   - Model appears in video model selector automatically
   - Generate video with default settings
   - Verify credit deduction
   - Check video output

**Zero code changes needed** ✅ (after initial infrastructure is built)

---

## 📊 Model Comparison Matrix

*Grows as models are added.*

| Feature | v3 Pro I2V | O3 Pro I2V | O3 Pro R2V | O3 Pro V2V Edit | O3 Pro V2V Ref |
|---------|-----------|-----------|-----------|----------------|----------------|
| **Type** | I2V | I2V | R2V | V2V-Edit | V2V-Ref |
| **Primary input** | `start_image_url` | `image_url` ⚠️ | `start_image_url` (opt.) | `video_url` | `video_url` |
| **Required params** | `start_image_url` | `image_url` | **None** | `prompt`+`video_url` | `prompt`+`video_url` |
| **Prompt required** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Max output duration** | 15s | 15s | 15s | = input (≤10s) | **15s** ✅ |
| **Duration control** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Aspect ratio** | 16:9/9:16/1:1 | ❌ | 16:9/9:16/1:1 | ❌ | **auto**/16:9/9:16/1:1 ⚠️ |
| **AI Audio gen** | ✅ (default on) | ✅ (default off) | ✅ (default off) | ❌ | ❌ |
| **Keep input audio** | ❌ | ❌ | ❌ | ✅ (default on) | ✅ (default on) |
| **Voice Control** | ✅ 2 voices | ❌ | ❌ | ❌ | ❌ |
| **Multi-Shot** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Element Consistency** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Style Ref Images** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Start/End Frame** | ✅ Both | ✅ Both | ✅ Both | ❌ | ❌ |
| **Negative Prompt** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **CFG Scale** | ✅ 0–1 | ❌ | ❌ | ❌ | ❌ |
| **Pricing tiers** | 3 (off/on/voice) | 2 (off/on) | 2 (off/on) | 1 flat | 1 flat |
| **Price/5s** | $1.12–$1.96 | $1.12–$1.40 | $1.12–$1.40 | $1.68 | $1.68 |
| **Price/10s** | $2.24–$3.92 | $2.24–$2.80 | $2.24–$2.80 | $3.36 | $3.36 |
| **Price/15s** | $3.36–$5.88 | N/A | $3.36–$4.20 | N/A (max 10s input) | **$5.04** |
| **Best For** | Premium, dialogue | Frame transitions | Character refs | Editing footage | Style-guided new shots |

> ⚠️ **Schema note — `"auto"` aspect ratio**: The `aspectratio` UI control must support an `"auto"` option (Model 5 only). Treat it as `undefined` when building the FAL API request — omit the `aspect_ratio` param and the model decides from the reference video.

---

## ✅ Implementation Checklist

### Phase 1: `videoModelSchemas` Convex Table (Foundation)

- [ ] Add `videoModelSchemas` table to `convex/schema.ts`
- [ ] Create `convex/seed/seedVideoModels.ts` with Kling v3 Pro I2V schema
- [ ] Add credit costs (flat rate: 17 credits / 5s generation with audio)
- [ ] Create `convex/videoModels.ts` — queries: `getActiveModels`, `getByModelId`, `getBySchemaId`

### Phase 2: Backend Generic Action

- [ ] Create `convex/actions/videoToolGeneric.ts` — `generateGenericVideo` internal action
- [ ] Create `convex/videoTool.ts` — `startGenericVideoGeneration` mutation + scheduler
- [ ] Handle long-running queue polling (FAL queue API pattern)
- [ ] Wire credit deduction + refund on failure
- [ ] Update `convex/scenes.ts` — `updateVideoUrl` internal mutation

### Phase 3: Frontend Migration (Storyboard Generator)

- [ ] Replace hardcoded `VideoModel` type in `components/storyboard-generator/types.ts` with schema-driven approach
- [ ] Create `hooks/use-convex-video-schemas.ts` — load schemas from Convex
- [ ] Update `StoryboardPanel.tsx` to use schema params (duration, aspect_ratio, generate_audio from schema)
- [ ] Wire `startGenericVideoGeneration` mutation from each panel
- [ ] Add generation status polling (IN_QUEUE → IN_PROGRESS → COMPLETED states)
- [ ] Add credit cost display per panel based on duration + audio settings

### Phase 4: i18n

- [ ] Add `video_generator` and `video_models` keys to `messages/en.json`
- [ ] Run `pnpm translate` + `pnpm i18n:verify`

### Phase 5: QA

- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npx biome check --write .` — 0 errors
- [ ] `pnpm i18n:verify` — all locales in sync
- [ ] `npx convex dev --once` + seed run

---

**Document Version**: 2.0  
**Status**: ✅ Complete for initial 5 Pro models — ready for Standard tier models  
**Models Documented**: 5
- Model 1: Kling v3 Pro I2V (`fal-ai/kling-video/v3/pro/image-to-video`)
- Model 2: Kling O3 Pro I2V (`fal-ai/kling-video/o3/pro/image-to-video`)
- Model 3: Kling O3 Pro R2V (`fal-ai/kling-video/o3/pro/reference-to-video`)
- Model 4: Kling O3 Pro V2V Edit (`fal-ai/kling-video/o3/pro/video-to-video/edit`)
- Model 5: Kling O3 Pro V2V Reference (`fal-ai/kling-video/o3/pro/video-to-video/reference`)

**Next Steps**: Standard tier models to be added as specs are shared (Kling v3 Standard, O3 Standard I2V, O3 Standard R2V, O3 Standard V2V Edit, O3 Standard V2V Reference)

**Dependencies**:
- `docs/Analysis/KLING-3-MODELS-ANALYSIS.md` — raw API reference for all 10 Kling video models
- `docs/Analysis/image-generator/IMAGE-MODELS-ANALYSIS.md` — architecture pattern reference
- `docs/Analysis/voice-generator/TTS-MODELS-ANALYSIS.md` — schema design pattern reference
- `docs/MVP/Todo/sprint-24-Storyboard-Generator-demo.md` — current demo implementation
