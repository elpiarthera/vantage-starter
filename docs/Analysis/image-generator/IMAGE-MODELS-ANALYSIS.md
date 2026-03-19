# 🖼️ Image Generator & Editor — Models Analysis

**Date**: February 14, 2026  
**Status**: 📋 DRAFT — Models to be added one by one  
**Scope**: Text-to-image (T2I), T2I with optional image reference, Image-to-image (I2I)  
**Provider**: FAL.ai  
**Purpose**: Parameter comparison and dynamic UI schema design for **modular, zero-code model onboarding**.

---

## 🎯 Strategic Goal: Modularity as Competitive Advantage

**Objective**: Add new fal.ai image models the same day they are available — **without writing a single line of code**. The UI must render options **dynamically** from a model schema.

**Implications for this doc**:
- Identify **universal** parameters → single schema shape, one UI component set.
- Identify **model-specific** parameters → schema-driven visibility (show/hide by model).
- Map each parameter to a **visual control type** (icon-select, segmented, dropdown, toggle, slider, etc.) so the OptionsPanel can render the right widget from schema alone.

---

## 📋 Models to Analyze

*Models will be added one by one. Template section below.*

| # | Model ID | Type (T2I / I2I) | Status |
|---|----------|------------------|--------|
| 1 | `fal-ai/kling-image/v3/text-to-image` | T2I | ✅ Documented |
| 2 | `fal-ai/kling-image/v3/image-to-image` | I2I | ✅ Documented |
| 3 | `fal-ai/kling-image/o3/text-to-image` | T2I | ✅ Documented |
| 4 | `fal-ai/kling-image/o3/image-to-image` | I2I | ✅ Documented |
| 5 | `xai/grok-imagine-image` | T2I | ✅ Documented |
| 6 | `xai/grok-imagine-image/edit` | I2I | ✅ Documented |
| 7 | `fal-ai/nano-banana-pro` | T2I | ✅ Documented |
| 8 | `fal-ai/nano-banana-pro/edit` | I2I | ✅ Documented |
| 9 | `fal-ai/nano-banana-2` | T2I | ✅ Documented |

---

## 💰 Provider pricing (USD) & app credits

Provider cost per image (FAL/xAI). App credits are **not** hardcoded: they are stored in the Convex **`creditCosts`** table and referenced by **`creditActionType`** per model (see [Modifying credit cost without code changes](#modifying-credit-cost-without-code-changes) below).

| Model ID | Type | USD per image (base) | Modifiers |
|----------|------|----------------------|-----------|
| `fal-ai/kling-image/o3/text-to-image` | T2I | $0.028 | 1K/2K base; **4K = 2×** ($0.056) |
| `fal-ai/kling-image/v3/text-to-image` | T2I | $0.028 | Flat (no resolution choice in pricing) |
| `fal-ai/kling-image/v3/image-to-image` | I2I | $0.028 | Flat |
| `fal-ai/kling-image/o3/image-to-image` | I2I | $0.028 | 1K/2K base; **4K = 2×** ($0.056) |
| `xai/grok-imagine-image` | T2I | $0.02 | Flat |
| `xai/grok-imagine-image/edit` | I2I | $0.022 | $0.02 output + $0.002 input |
| `fal-ai/nano-banana-pro` | T2I | $0.15 | 1K/2K base; **4K = 2×** ($0.30); **enable_web_search +$0.015** |
| `fal-ai/nano-banana-pro/edit` | I2I | $0.15 | Same: 4K = 2×; **enable_web_search +$0.015** |
| `fal-ai/nano-banana-2` | T2I | $0.08 | **0.5K = 0.75×**; 1K base; **2K = 1.5×**, **4K = 2×**; **enable_web_search +$0.015** |

*Nano Banana Pro: “For $1.00 you can run this model 7 times” (≈ $0.143/image); doc uses $0.15 as base. 4K and web_search modifiers apply to both T2I and Edit.*

*Nano Banana 2: $0.08/image base; 12 runs per $1. 0.5K (512px) at 0.75×; 2K/4K at 1.5×/2×; web_search +$0.015.*

---

## 🔧 Modifying credit cost without code changes

To change how many **credits** an image model costs, do **not** change application code. Use the existing Convex credits system.

### How it works

1. **Convex table `creditCosts`**  
   Each row has: `actionType` (string), `credits` (number), `displayName`, `description`, `category`, `isActive`, `updatedAt`.  
   Cost is read at runtime: **deductCredits(clerkUserId, actionType)** looks up `creditCosts` by `actionType` and uses that row’s `credits` value.

2. **Model config → actionType**  
   Each image model is mapped to a **creditActionType** (e.g. in `falModels.ts` or a Convex config table). The backend receives `modelId`, looks up `creditActionType` from config, and calls `deductCredits(identity.subject, creditActionType)`. The client does **not** send actionType; it is derived from the selected model.

3. **One actionType per billing variant**  
   - If every call for a model costs the same (e.g. Grok T2I $0.02), one row is enough: e.g. `actionType: "image_generation_grok_t2i"`, `credits: 5`.  
   - If price depends on options (e.g. 4K = 2×, web_search +extra), you can either:  
     - **Option A**: One actionType per model with a **single** credit value (e.g. base rate); show a hint in the UI (“4K uses 2× credits”) and either deduct twice for 4K in a future enhancement or keep one rate for simplicity.  
     - **Option B**: One actionType **per variant** (e.g. `image_generation_kling_o3_1k2k`, `image_generation_kling_o3_4k`, `image_generation_nano_web_search`). The UI chooses the correct actionType from the selected model + resolution/options and the backend deducts that. Cost changes = update the corresponding row(s) in Convex.

### What you need to do

| Goal | Action |
|------|--------|
| **Change the credit cost for a model** | In Convex dashboard (or via mutation): open **creditCosts**, find the row with the model’s `actionType`, change **credits** and **updatedAt**. No deploy. |
| **Add a new model with its own price** | (1) Add a row to **creditCosts** with a new `actionType` (e.g. `image_generation_nano_banana`) and the desired `credits`. (2) In model config (e.g. falModels), set that model’s **creditActionType** to this `actionType`. |
| **Support 4K or web_search at a different credit amount** | Add extra rows to **creditCosts** (e.g. `image_generation_kling_o3_4k`, `image_generation_nano_web_search`) with the right `credits`. In model config and UI, map the user’s choice (resolution 4K, enable_web_search) to the appropriate **creditActionType** so the backend deducts the correct amount. |

**Summary**: All cost is in the **creditCosts** table. Code only holds the **mapping** from model (and optional variant) to **actionType**. Changing cost = edit the table; no code change.

---

## 📊 Parameter Comparison Table

*Fill as models are added. Purpose: see what is common (universal) vs model-specific, and how each param maps to a UI control.*

### Legend — Visual control types

| Type | Use for | Example |
|------|---------|--------|
| `icon-select` | Aspect ratio, shape | Square □, Portrait ▭, Landscape ▯ |
| `segmented` | Resolution, mode | [ 1K \| 2K \| 4K ] |
| `text` | Prompt, negative prompt | Textarea |
| `number` | Steps, count | Num images, series amount |
| `select` | Enum with many options | Output format, result type |
| `toggle` | Boolean | Enable ref image, private |
| `slider` | Bounded numeric | CFG scale, strength |
| `advanced` | Collapsible section | Negative prompt, seed |

### Universal vs model-specific parameters

| Parameter | Type | Universal? | Control type | Notes |
|-----------|------|------------|--------------|-------|
| `prompt` | string | ✅ | `text` | Max length may vary per model |
| `aspect_ratio` | enum | ✅ | `icon-select` | Values may differ (16:9, 9:16, 1:1, auto, …) |
| `resolution` | enum | ⚠️ | `segmented` | 1K/2K/4K or model-specific; some models no resolution |
| `result_type` | enum | ⚠️ | `select` or `segmented` | single / series |
| `num_images` / `series_amount` | number | ⚠️ | `number` or `select` | When single vs series |
| `negative_prompt` | string | ❌ | `text` (advanced) | Only some models (e.g. Kling v3) |
| `cfg_scale` | number | ❌ | `slider` | Model-specific |
| `seed` | number | ❌ | `number` (advanced) | Model-specific |
| `output_format` | enum | ⚠️ | `select` | jpeg, png, webp — optional in UI |
| `image_url` / `image_urls` | ref(s) | I2I / ref | (RefsPanel) | Single vs array; @Image1, @Image2 |
| `elements` | object[] | ❌ | (RefsPanel / dedicated) | Character/object consistency (e.g. Kling) |
| `sync_mode` | boolean | ❌ | — | FAL convention: data URI in response; default false, rarely in UI |
| *…* | *…* | *…* | *…* | *Add rows as models are documented* |

---

## 🧩 Dynamic UI Requirements (Critical for Modularity)

*What the schema must express so the UI can render correctly without code changes.*

### 1. Control type per parameter

Each parameter in the model schema must declare a **control type** so `DynamicField` / `OptionsPanel` can pick the right widget:

- **icon-select**: options with `value`, `label`, `icon` (e.g. aspect ratio).
- **segmented**: small set of options, pill toggles (e.g. resolution 1K | 2K | 4K).
- **text**: single line or textarea; optional `maxLength`, `placeholder`.
- **number**: min, max, step, default.
- **select**: dropdown; options list.
- **toggle**: boolean, default.
- **slider**: min, max, step, default.
- **advanced**: same as above but rendered inside collapsible "Advanced options".

### 2. Visibility rules

- **By capability**: e.g. show `negative_prompt` only if `capabilities.negativePrompt === true`.
- **By mode**: Generate vs Edit may expose different params (e.g. `aspect_ratio: "auto"` only in I2I).
- **By model**: resolution 4K only when model supports it; optional `maxResolution: "4K"` in schema.

### 3. Visual controls that must be schema-driven (no hardcoding)

| Control | Schema shape | Purpose |
|---------|--------------|--------|
| Aspect ratio | `aspect_ratio: { type: "icon-select", options: [{ value, label, icon }], default }` | One component for all models; options vary by model. |
| Resolution | `resolution: { type: "segmented", options: ["1K","2K","4K"] or subset, default }` | Options and visibility from schema. |
| Model selector | List of `ModelSchema` (id, name, capabilities, params, creditCost) | Modal/grid from config; no code per model. |
| Credit cost | `creditCost` or derived from model + resolution in schema | Display on Generate button. |
| Advanced section | Params with `advanced: true` | Collapsible block; content fully from schema. |

### 4. Badges (optional)

- Schema may include `badges: ("PRO" \| "FAST" \| "NEW")[]` for model cards.
- Kept for consistency with proposal; not core to modularity.

### 5. Capabilities flags (for filtering and UI)

Suggested flags to drive dynamic UI and model selector filters:

| Capability | Meaning | UI impact |
|------------|---------|-----------|
| `multiImage` | Supports multiple ref images (e.g. O3 I2I) | RefsPanel: multiple slots; prompt hint @Image1, @Image2 |
| `negativePrompt` | Supports negative prompt | Show negative prompt field (e.g. in advanced) |
| `maxResolution` | "2K" or "4K" | Limit resolution options in segmented control |
| `elements` | Character/object consistency (frontal + refs) | Show Elements UI; prompt hint @Element1, @Element2 |
| `resultTypeSeries` | Supports series result type | Show result_type + series_amount |
| `aspectAuto` | I2I supports "auto" aspect | Include "Auto (from input)" in aspect options in Edit |

### 6. Backend integration

For zero-code onboarding, the backend must send a **canonical payload** (same shape for all models) and map it to each API. Per-model config should define:

| Concern | Purpose |
|---------|---------|
| **Endpoint + type** | Already in `falModels.ts`: model id → `endpoint`, `type` (t2i/i2i). |
| **Parameter mapping** | Canonical param name → API param name when they differ (e.g. `image_urls` vs `image_url`). |
| **Value transform** | When API expects different values than UI (e.g. resolution `"1K"` → `"1"`, or aspect `"16:9"` → `"landscape"`). Prefer a **mapping table** in config (e.g. `uiToApi: { "1K": "1", "2K": "2" }`) so new models don’t require code. |
| **Response mapping** | Where to read the result (e.g. `resultPath: "images[0].url"`, or `multipleResults: true`). Ensures the generic action can persist output without model-specific code. |
| **Error handling** (optional) | Per-model or global: timeout, retry attempts, optional fallback model. Can be refined when analyzing first models. |

Without this, adding a model would still require backend code to build the request and parse the response; with it, backend stays generic and config-driven.

---

## 📱 Mobile-First Modularity

*Principle: controls must be understandable and usable with minimal reading and one-thumb interaction. Schema and control registry should support this without hardcoding per model.*

### Visual labels over raw values

Use **human-readable labels** in the UI; schema can drive them so new models stay consistent:

| Value (API/schema) | Display label | Why |
|--------------------|---------------|-----|
| `1:1` | Square | Instant recognition; no mental ratio parsing |
| `16:9` | Landscape | Same |
| `9:16` | Portrait | Same |
| `auto` | Auto (from input) | Edit mode only |

Schema shape: options include `label` (e.g. `{ value: "1:1", label: "Square", icon: "Square" }`). Components render label; API receives value.

### Control priority (mobile)

Which parameters are critical vs optional on small screens — drives placement and progressive disclosure:

| Priority | Control / param | Mobile note |
|----------|------------------|-------------|
| **Critical** | Prompt, aspect ratio (icon-select), resolution | Always visible; large touch targets (min 44px). |
| **Important** | Result type, num_images / series_amount | Use stepper (+/−) for numbers when possible instead of keyboard. |
| **Optional** | Negative prompt, seed, cfg_scale | In **advanced** section; **collapsed by default** on mobile. |

Schema can expose `priority` ("critical" | "high" | "low") and `advanced: true` so layout/collapse is data-driven.

### Optional schema hints for mobile

Keep schema minimal; add optional hints where they affect behavior:

- **Aspect / resolution**: optional `labels` map (value → display label) or per-option `label`; optional `mobileVariant` (e.g. `"large-pills"` for resolution) if registry supports it.
- **Prompt**: validation `maxLength`; optional `showCharCount: true`, `warningAt: number` for character counter and early warning (implementation can default these for `text` type).
- **Number params**: validation `min`/`max`/`step`; optional `stepper: true` to prefer +/- UI over keyboard.
- **Advanced**: `advanced: true` + optional `collapsedByDefault: true` for small screens.

Gestures (e.g. swipe to reveal advanced), haptics, and contextual keyboards are **implementation defaults** for mobile — no need to encode in schema unless we later want per-param overrides.

### Optional: Explicit mobile validation hints (0.5% enhancement)

For maximum mobile-first polish, the schema can declare explicit hints per parameter. **Optional** — components may default these behaviors for mobile; only add when you want per-param overrides.

```json
{
  "prompt": {
    "control": "text",
    "maxLength": 2500,
    "mobile": {
      "showCharCount": true,
      "warningAt": 2000,
      "expandOnFocus": true
    }
  },
  "num_images": {
    "control": "number",
    "stepper": true,
    "mobile": { "haptic": true }
  },
  "aspect_ratio": {
    "control": "icon-select",
    "labels": { "1:1": "Square", "16:9": "Landscape", "9:16": "Portrait" },
    "mobile": { "variant": "large-grid" }
  }
}
```

| Hint | Purpose |
|------|---------|
| `showCharCount` | Character counter visible while typing |
| `warningAt` | Show warning before limit (e.g. 2000 when max 2500) |
| `expandOnFocus` | Auto-expand textarea on focus |
| `stepper` | Prefer +/- buttons over keyboard |
| `haptic` | Tactile feedback at min/max (stepper) |
| `labels` | Display labels (Square, Landscape, Portrait) |
| `mobile.variant` | e.g. `large-grid` for thumb-sized icon targets |

### Phase 1 vs Phase 2 (mobile)

- **Phase 1**: Visual aspect selector (icons + labels), resolution with large tap targets and cost, prompt with resize/char count, number steppers, advanced collapsible — all schema-driven.
- **Phase 2**: Richer mobile variants (e.g. 3-icon vs 4-icon grid from viewport), gesture-based reveal, voice input — component/UX layer; schema stays stable.

---

## 📁 Per-Model Sections

---

### Model 1: Kling v3 — Text-to-Image

**Model ID**: `fal-ai/kling-image/v3/text-to-image`  
**Endpoint**: `https://fal.run/fal-ai/kling-image/v3/text-to-image`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/kling-image/v3/text-to-image) · [API Docs](https://fal.ai/models/fal-ai/kling-image/v3/text-to-image/api) · [OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/v3/text-to-image)

#### Description

Latest Kling Image v3 for text-to-image. Supports optional elements (character/object consistency via frontal + reference images), negative prompt, and 1K/2K resolution. Single-batch only (no series result type); use `num_images` (1–9) for multiple images per request.

#### Pricing

| Unit | Cost |
|------|------|
| Per image | $0.028 |

#### Capabilities

| Feature | Details |
|---------|---------|
| **Negative prompt** | ✅ Yes (optional; max 2500 chars) |
| **Resolution** | 1K, 2K (no 4K) |
| **Aspect ratios** | 16:9, 9:16, 1:1, 4:3, 3:4, 3:2, 2:3, 21:9 |
| **Result type** | Single only; `num_images` 1–9 |
| **Elements** | ✅ Yes — frontal_image_url + reference_image_urls (0–3); reference in prompt as @Element1, @Element2 |
| **Output format** | jpeg, png, webp |
| **Queue API** | Submit → poll status → get result / cancel |

#### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `prompt` | string | ✅ Yes | — | Max 2500 chars | Text prompt for image generation |
| `negative_prompt` | string | Optional | — | Max 2500 chars | What to avoid; recommend supplementing in positive prompt |
| `elements` | list&lt;ElementInput&gt; | Optional | — | See below | Face/character control; reference as @Element1, @Element2 |
| `resolution` | enum | Optional | `"1K"` | `"1K"`, `"2K"` | No 4K on v3 |
| `num_images` | integer | Optional | 1 | 1–9 | Number of images per request |
| `aspect_ratio` | enum | Optional | `"16:9"` | 16:9, 9:16, 1:1, 4:3, 3:4, 3:2, 2:3, 21:9 | |
| `output_format` | enum | Optional | `"png"` | jpeg, png, webp | |
| `sync_mode` | boolean | Optional | false | — | If true, media as data URI; rarely needed in UI |

**ElementInput** (per element):

| Parameter | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| `frontal_image_url` | string | Max 10MB, min 300×300px, aspect 0.4–2.5 | Main view of character/object |
| `reference_image_urls` | string[] | 0–3 images; same constraints | Additional angles |

#### Schema → control mapping (for dynamic UI)

| Parameter | Control type | Options / constraints |
|-----------|--------------|------------------------|
| `prompt` | `text` (textarea) | maxLength: 2500; showCharCount optional |
| `negative_prompt` | `text` (advanced) | maxLength: 2500; visible when capability negativePrompt |
| `elements` | RefsPanel / Elements | frontal + 0–3 refs; labels @Element1, @Element2 |
| `resolution` | `segmented` | ["1K", "2K"]; default "1K" |
| `num_images` | `number` (stepper) | min: 1, max: 9, default: 1 |
| `aspect_ratio` | `icon-select` | 16:9, 9:16, 1:1, 4:3, 3:4, 3:2, 2:3, 21:9; labels e.g. Square, Landscape, Portrait for common ones |
| `output_format` | `select` | jpeg, png, webp; default png; optional in UI |
| `sync_mode` | — | Omit from UI or advanced toggle |

#### Backend mapping (zero-code)

| Concern | Value |
|---------|--------|
| **Endpoint** | `fal-ai/kling-image/v3/text-to-image` |
| **Type** | t2i |
| **Parameter mapping** | Same names (no rename). Optional value transform: none required (API uses "1K"/"2K", "16:9", etc.). |
| **Response path** | `images` (array); each item has `url`, `file_name`, `content_type`, `file_size`. For single image use `images[0].url`. |

#### Output schema

- **`images`** (array, required): Each element: `url`, `file_name`, `content_type`, `file_size`; optional `width`, `height`, `file_data` (when sync_mode).

#### Use cases / When to use

- **Fast iteration** — Lower cost than O3; good for drafts and exploration.
- **Negative prompt** — When you need explicit “avoid” text.
- **Character consistency** — Elements with frontal + refs for @Element1, @Element2.
- **Batch** — Up to 9 images per call via `num_images`.

---

### Model 2: Kling v3 — Image-to-Image

**Model ID**: `fal-ai/kling-image/v3/image-to-image`  
**Endpoint**: `https://fal.run/fal-ai/kling-image/v3/image-to-image`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/kling-image/v3/image-to-image) · [API Docs](https://fal.ai/models/fal-ai/kling-image/v3/image-to-image/api) · [OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/v3/image-to-image)

#### Description

Kling Image v3 for image-to-image: one **required** reference image (`image_url`) plus prompt to transform or edit. Same resolution (1K/2K), aspect ratios, elements, and output format as v3 T2I. **No negative_prompt**; no "auto" aspect (fixed ratios only). Single-batch only; `num_images` 1–9.

#### Pricing

| Unit | Cost |
|------|------|
| Per image | $0.028 |

#### Capabilities

| Feature | Details |
|---------|---------|
| **Reference image** | ✅ Required — single `image_url` (v3 I2I is single-ref only) |
| **Negative prompt** | ❌ Not available |
| **Aspect "auto"** | ❌ Not available (use explicit ratio) |
| **Resolution** | 1K, 2K (no 4K) |
| **Aspect ratios** | 16:9, 9:16, 1:1, 4:3, 3:4, 3:2, 2:3, 21:9 |
| **Result type** | Single only; `num_images` 1–9 |
| **Elements** | ✅ Yes — same ElementInput as v3 T2I |
| **Output format** | jpeg, png, webp |
| **Queue API** | Same as v3 T2I |

#### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `prompt` | string | ✅ Yes | — | Max 2500 chars | Describe the edit/transformation |
| `image_url` | string | ✅ Yes | — | Max 10MB, min 300×300px, aspect 0.4–2.5 | Single reference image (no multi-ref on v3) |
| `elements` | list&lt;ElementInput&gt; | Optional | — | See Model 1 | Face/character control; @Element1, @Element2 |
| `resolution` | enum | Optional | `"1K"` | `"1K"`, `"2K"` | |
| `num_images` | integer | Optional | 1 | 1–9 | |
| `aspect_ratio` | enum | Optional | `"16:9"` | 16:9, 9:16, 1:1, 4:3, 3:4, 3:2, 2:3, 21:9 | No "auto" |
| `output_format` | enum | Optional | `"png"` | jpeg, png, webp | |
| `sync_mode` | boolean | Optional | false | — | Rarely in UI |

**ElementInput**: Same as Model 1 (frontal_image_url, reference_image_urls 0–3).

#### Schema → control mapping (for dynamic UI)

| Parameter | Control type | Options / constraints |
|-----------|--------------|------------------------|
| `prompt` | `text` (textarea) | maxLength: 2500; same as T2I |
| `image_url` | RefsPanel (Edit) | **Single slot** only; upload or from history; required |
| `elements` | RefsPanel / Elements | Same as v3 T2I |
| `resolution` | `segmented` | ["1K", "2K"] |
| `num_images` | `number` (stepper) | min: 1, max: 9, default: 1 |
| `aspect_ratio` | `icon-select` | Same 8 options; **no "auto"** |
| `output_format` | `select` | jpeg, png, webp; optional in UI |
| `sync_mode` | — | Omit from UI |

#### Backend mapping (zero-code)

| Concern | Value |
|---------|--------|
| **Endpoint** | `fal-ai/kling-image/v3/image-to-image` |
| **Type** | i2i |
| **Parameter mapping** | Same names. Canonical: use `image_url` for single ref (v3 I2I). No transform needed. |
| **Response path** | Same as v3 T2I: `images` array; `images[0].url` for single. |

#### Output schema

- **`images`** (array, required): Same as Model 1 — each item has `url`, `file_name`, `content_type`, `file_size`.

#### Use cases / When to use

- **Edit mode** — Transform or restyle one image from history or upload.
- **Single reference** — Only one input image; use O3 I2I for multiple refs (@Image1, @Image2).
- **Style transfer / variations** — Same resolution and aspect options as T2I; add elements for character consistency.
- **Cost-effective edit** — Same $0.028/image as v3 T2I.

---

### Model 3: Kling O3 — Text-to-Image

**Model ID**: `fal-ai/kling-image/o3/text-to-image`  
**Endpoint**: `https://fal.run/fal-ai/kling-image/o3/text-to-image`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/kling-image/o3/text-to-image) · [API Docs](https://fal.ai/models/fal-ai/kling-image/o3/text-to-image/api) · [OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/o3/text-to-image)

#### Description

Kling Omni 3 top-tier text-to-image with **4K** resolution and **result_type** (single vs series). No negative_prompt. When `result_type` is `"single"` use `num_images` (1–9); when `"series"` use `series_amount` (2–9). Same elements (frontal + refs, @Element1, @Element2) and aspect ratios as v3. Pricing: 1K/2K at base rate; **4K costs double**.

#### Pricing

| Unit | Cost |
|------|------|
| Per image (1K / 2K) | $0.028 |
| Per image (4K) | $0.056 (2×) |

#### Capabilities

| Feature | Details |
|---------|---------|
| **Negative prompt** | ❌ Not available |
| **Resolution** | 1K, 2K, **4K** (O3 only) |
| **Result type** | ✅ single \| series — drives num_images vs series_amount |
| **num_images** | 1–9 when result_type = single |
| **series_amount** | 2–9 when result_type = series |
| **Aspect ratios** | Same 8 as v3 |
| **Elements** | ✅ Yes — same ElementInput |
| **Output format** | jpeg, png, webp |
| **Queue API** | Same as v3 |

#### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `prompt` | string | ✅ Yes | — | Max 2500 chars | |
| `elements` | list&lt;ElementInput&gt; | Optional | — | See Model 1 | @Element1, @Element2 |
| `resolution` | enum | Optional | `"1K"` | `"1K"`, `"2K"`, **`"4K"`** | 4K = 2× cost |
| `result_type` | enum | Optional | `"single"` | `"single"`, `"series"` | Drives which count param is used |
| `num_images` | integer | Optional | 1 | 1–9 | Only when result_type = single |
| `series_amount` | integer | Optional | — | 2–9 | Only when result_type = series |
| `aspect_ratio` | enum | Optional | `"16:9"` | Same 8 options as v3 | |
| `output_format` | enum | Optional | `"png"` | jpeg, png, webp | |
| `sync_mode` | boolean | Optional | false | — | Rarely in UI |

**ElementInput**: Same as Model 1.

#### Schema → control mapping (for dynamic UI)

| Parameter | Control type | Options / constraints |
|-----------|--------------|------------------------|
| `prompt` | `text` (textarea) | maxLength: 2500 |
| `elements` | RefsPanel / Elements | Same as v3 T2I |
| `resolution` | `segmented` | ["1K", "2K", **"4K"**]; show cost hint for 4K (2×) |
| `result_type` | `segmented` or `select` | ["single", "series"]; **dependency**: series → show series_amount, hide num_images; single → show num_images, hide series_amount |
| `num_images` | `number` (stepper) | 1–9; visible when result_type = single |
| `series_amount` | `number` (stepper) | 2–9; visible when result_type = series |
| `aspect_ratio` | `icon-select` | Same 8 options + labels |
| `output_format` | `select` | jpeg, png, webp; optional in UI |
| `sync_mode` | — | Omit from UI |

#### Backend mapping (zero-code)

| Concern | Value |
|---------|--------|
| **Endpoint** | `fal-ai/kling-image/o3/text-to-image` |
| **Type** | t2i |
| **Parameter mapping** | Same names; no transform. Send only `num_images` when result_type=single, only `series_amount` when result_type=series (or omit the unused one). |
| **Response path** | Same: `images` array; each item has `url`, `file_name`, `content_type`, `file_size`. |

#### Output schema

- **`images`** (array, required): Same structure as v3 T2I.

#### Use cases / When to use

- **Quality / 4K** — When you need ultra high-res; accept 2× cost.
- **Series** — Generate 2–9 related images in one call via result_type=series + series_amount.
- **No negative prompt** — Prefer v3 T2I when you need negative_prompt; use O3 for top quality and series.
- **Character consistency** — Same elements as v3 for @Element1, @Element2.

---

### Model 4: Kling O3 — Image-to-Image

**Model ID**: `fal-ai/kling-image/o3/image-to-image`  
**Endpoint**: `https://fal.run/fal-ai/kling-image/o3/image-to-image`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/kling-image/o3/image-to-image) · [API Docs](https://fal.ai/models/fal-ai/kling-image/o3/image-to-image/api) · [OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/o3/image-to-image)

#### Description

Kling O3 image-to-image with **multiple reference images** (`image_urls`, 1–10), referenced in prompt as @Image1, @Image2, etc. (1-indexed). **Aspect ratio "auto"** (default) — intelligently determined from input. Same resolution (1K/2K/4K), result_type (single | series), num_images/series_amount, and elements as O3 T2I. Pricing: 1K/2K base; 4K double.

#### Pricing

| Unit | Cost |
|------|------|
| Per image (1K / 2K) | $0.028 |
| Per image (4K) | $0.056 (2×) |

#### Capabilities

| Feature | Details |
|---------|---------|
| **Reference images** | ✅ **image_urls** (array) — 1–10 images; @Image1, @Image2 … in prompt |
| **Aspect "auto"** | ✅ Yes — default; "intelligently determines based on input content" |
| **Aspect ratios** | 16:9, 9:16, 1:1, 4:3, 3:4, 3:2, 2:3, 21:9, **auto** |
| **Resolution** | 1K, 2K, 4K |
| **Result type** | single \| series; num_images 1–9 / series_amount 2–9 |
| **Elements** | ✅ Same ElementInput; @Element1, @Element2 |
| **Output format** | jpeg, png, webp |
| **Queue API** | Same as O3 T2I |

#### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `prompt` | string | ✅ Yes | — | Max 2500 chars | Reference refs as @Image1, @Image2 (or @Image if one) |
| `image_urls` | string[] | ✅ Yes | — | 1–10 URLs; each max 10MB, min 300×300, aspect 0.4–2.5 | **Multi-ref** (v3 I2I has single image_url) |
| `elements` | list&lt;ElementInput&gt; | Optional | — | See Model 1 | @Element1, @Element2 |
| `resolution` | enum | Optional | `"1K"` | `"1K"`, `"2K"`, `"4K"` | 4K = 2× cost |
| `result_type` | enum | Optional | `"single"` | `"single"`, `"series"` | |
| `num_images` | integer | Optional | 1 | 1–9 | When result_type = single |
| `series_amount` | integer | Optional | — | 2–9 | When result_type = series |
| `aspect_ratio` | enum | Optional | **`"auto"`** | 16:9, 9:16, 1:1, 4:3, 3:4, 3:2, 2:3, 21:9, **auto** | **Only O3 I2I has "auto"** |
| `output_format` | enum | Optional | `"png"` | jpeg, png, webp | |
| `sync_mode` | boolean | Optional | false | — | Rarely in UI |

**ElementInput**: Same as Model 1. Each item in `image_urls`: same file constraints as v3.

#### Schema → control mapping (for dynamic UI)

| Parameter | Control type | Options / constraints |
|-----------|--------------|------------------------|
| `prompt` | `text` (textarea) | maxLength: 2500; hint: "Use @Image1, @Image2 … for refs" |
| `image_urls` | RefsPanel (Edit) | **Multiple slots** (1–10); upload + history; required, 1+ image; labels @Image1, @Image2 … |
| `elements` | RefsPanel / Elements | Same as other Kling models |
| `resolution` | `segmented` | ["1K", "2K", "4K"]; 4K cost hint |
| `result_type` | `segmented` or `select` | single | series; same dependency as O3 T2I |
| `num_images` | `number` (stepper) | 1–9 when result_type = single |
| `series_amount` | `number` (stepper) | 2–9 when result_type = series |
| `aspect_ratio` | `icon-select` | **Include "auto"** (label e.g. "Auto (from input)"); + same 8 ratios |
| `output_format` | `select` | jpeg, png, webp; optional in UI |
| `sync_mode` | — | Omit from UI |

#### Backend mapping (zero-code)

| Concern | Value |
|---------|--------|
| **Endpoint** | `fal-ai/kling-image/o3/image-to-image` |
| **Type** | i2i |
| **Parameter mapping** | **Canonical → API**: use `image_urls` (array). v3 I2I uses `image_url` (single); backend maps canonical refs to `image_url` or `image_urls` per model. No value transform for aspect/resolution. |
| **Response path** | Same: `images` array; each item `url`, `file_name`, `content_type`, `file_size`. |

#### Output schema

- **`images`** (array, required): Same structure as v3/O3 T2I.

#### Use cases / When to use

- **Multi-reference edit** — Several input images; reference each as @Image1, @Image2 … (use v3 I2I for single ref only).
- **Aspect "auto"** — Let model choose aspect from input; or pick explicit ratio.
- **4K + series** — Same result_type/series_amount as O3 T2I for edit workflow.
- **Top-tier edit** — Same pricing as O3 T2I (1K/2K base; 4K double).

---

### Model 5: xAI Grok Imagine Image — Text-to-Image

**Model ID**: `xai/grok-imagine-image`  
**Endpoint**: `https://fal.run/xai/grok-imagine-image`  
**FAL URL**: [Playground](https://fal.ai/models/xai/grok-imagine-image) · [API Docs](https://fal.ai/models/xai/grok-imagine-image/api) · [OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=xai/grok-imagine-image)

#### Description

xAI Grok Imagine Image: text-to-image only, no I2I. **Longer prompts** (max 8000 chars). **No resolution** (no 1K/2K/4K); **no result_type/series**; **num_images** 1–4 only. **Aspect ratios** include cinematic variants (2:1, 1:2, 20:9, 19.5:9, 9:19.5, 9:20) in addition to common ones. No negative prompt, no elements, no reference images. Output includes **revised_prompt** (model-enhanced prompt used for generation).

#### Pricing

| Unit | Cost |
|------|------|
| Per image | $0.02 |

#### Capabilities

| Feature | Details |
|---------|---------|
| **Negative prompt** | ❌ Not available |
| **Resolution** | ❌ Not available (no 1K/2K/4K) |
| **Result type / series** | ❌ Not available |
| **num_images** | 1–4 only (not 1–9) |
| **Aspect ratios** | 2:1, 20:9, 19.5:9, 16:9, 4:3, 3:2, 1:1, 2:3, 3:4, 9:16, 9:19.5, 9:20, 1:2 (13 options; default 1:1) |
| **Elements / refs** | ❌ Not available |
| **Output format** | jpeg (default), png, webp |
| **revised_prompt** | ✅ In output — enhanced prompt used by model |
| **Queue API** | Same pattern (submit, poll, get, cancel) |

#### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `prompt` | string | ✅ Yes | — | **Max 8000 chars** | Longer than Kling (2500) |
| `num_images` | integer | Optional | 1 | **1–4** | Not 1–9 |
| `aspect_ratio` | enum | Optional | `"1:1"` | 13 options (see above) | Different set than Kling |
| `output_format` | enum | Optional | **`"jpeg"`** | jpeg, png, webp | Default jpeg (Kling default png) |
| `sync_mode` | boolean | Optional | false | — | Rarely in UI |

#### Schema → control mapping (for dynamic UI)

| Parameter | Control type | Options / constraints |
|-----------|--------------|------------------------|
| `prompt` | `text` (textarea) | **maxLength: 8000**; showCharCount; warningAt e.g. 7000 |
| `num_images` | `number` (stepper) | **min: 1, max: 4**, default: 1 |
| `aspect_ratio` | `icon-select` or `select` | 13 options; subset can use icons (1:1=Square, 16:9=Landscape, 9:16=Portrait); rest in dropdown or extended grid. Default 1:1. |
| `output_format` | `select` | jpeg, png, webp; **default jpeg** |
| `sync_mode` | — | Omit from UI |

**Visibility**: No resolution, no result_type/series_amount, no negative_prompt, no elements — schema drives these as absent for this model.

#### Backend mapping (zero-code)

| Concern | Value |
|---------|--------|
| **Endpoint** | `xai/grok-imagine-image` |
| **Type** | t2i |
| **Parameter mapping** | Same param names; no transform. Do not send resolution, result_type, series_amount, negative_prompt, elements. |
| **Response path** | `images` array (each item has `url`; optional file_size, width, height, file_name, content_type). **Also** `revised_prompt` (string) — persist or display if desired. |

#### Output schema

- **`images`** (array, required): Each element has at least `url`; optional file_size, width, height, file_name, content_type.
- **`revised_prompt`** (string, required): Enhanced prompt used to generate the image — **Grok-specific**.

#### Use cases / When to use

- **Long prompts** — Up to 8000 characters; good for detailed descriptions.
- **Simple T2I** — No resolution choice, no series; fast configuration.
- **Cinematic aspects** — 2:1, 20:9, 19.5:9, etc. for wide/narrow formats.
- **Lower cost** — $0.02/image vs Kling $0.028 (1K/2K).
- **Prompt enhancement** — Use revised_prompt for transparency or reuse.

---

### Model 6: xAI Grok Imagine Image Edit — Image-to-Image

**Model ID**: `xai/grok-imagine-image/edit`  
**Endpoint**: `https://fal.run/xai/grok-imagine-image/edit`  
**FAL URL**: [Playground](https://fal.ai/models/xai/grok-imagine-image/edit) · [API Docs](https://fal.ai/models/xai/grok-imagine-image/edit/api) · [OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=xai/grok-imagine-image/edit)

#### Description

xAI Grok image **edit** (I2I): one **required** reference image (`image_url`) plus prompt. Same long prompt (max 8000), num_images 1–4, output_format (default jpeg), and **revised_prompt** in output as Grok T2I. **No aspect_ratio** — output aspect follows input image or model default. No resolution, no result_type/series, no elements. Slightly higher cost than Grok T2I due to input image.

#### Pricing

| Unit | Cost |
|------|------|
| Per image | $0.022 ($0.02 output + $0.002 input) |

#### Capabilities

| Feature | Details |
|---------|---------|
| **Reference image** | ✅ Required — single `image_url` |
| **Aspect ratio** | ❌ Not available (output follows input) |
| **Resolution** | ❌ Not available |
| **Result type / series** | ❌ Not available |
| **num_images** | 1–4 |
| **Elements / multi-ref** | ❌ Not available |
| **Output format** | jpeg (default), png, webp |
| **revised_prompt** | ✅ In output |
| **Queue API** | Same pattern |

#### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `prompt` | string | ✅ Yes | — | Max 8000 chars | Describe the edit |
| `image_url` | string | ✅ Yes | — | URL of image to edit | Single ref only |
| `num_images` | integer | Optional | 1 | 1–4 | |
| `output_format` | enum | Optional | `"jpeg"` | jpeg, png, webp | |
| `sync_mode` | boolean | Optional | false | — | Rarely in UI |

#### Schema → control mapping (for dynamic UI)

| Parameter | Control type | Options / constraints |
|-----------|--------------|------------------------|
| `prompt` | `text` (textarea) | maxLength: 8000 |
| `image_url` | RefsPanel (Edit) | **Single slot**; upload or history; required |
| `num_images` | `number` (stepper) | 1–4, default 1 |
| `output_format` | `select` | jpeg, png, webp; default jpeg |
| `sync_mode` | — | Omit from UI |

**Visibility**: No aspect_ratio, no resolution, no result_type/series_amount, no elements — schema omits them for this model (Edit mode).

#### Backend mapping (zero-code)

| Concern | Value |
|---------|--------|
| **Endpoint** | `xai/grok-imagine-image/edit` |
| **Type** | i2i |
| **Parameter mapping** | Same names; `image_url` (single). Do not send aspect_ratio, resolution, result_type, series_amount, elements. |
| **Response path** | `images` array; each item `url` (+ optional metadata). **Also** `revised_prompt`. |

#### Output schema

- **`images`** (array, required): Same as Grok T2I — each item has at least `url`.
- **`revised_prompt`** (string, required): Grok-specific enhanced prompt.

#### Use cases / When to use

- **Edit mode (Grok)** — Single image in, prompt describes change; same long prompts (8000) and revised_prompt as T2I.
- **Simple I2I** — No aspect/resolution/series; one ref, prompt, num_images 1–4.
- **Cost** — $0.022/image (input + output); compare to v3 I2I $0.028, O3 I2I 1K/2K $0.028.

---

### Model 7: fal-ai/nano-banana-pro — Text-to-Image

**Model ID**: `fal-ai/nano-banana-pro`  
**Endpoint**: `https://fal.run/fal-ai/nano-banana-pro`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/nano-banana-pro) · [API Docs](https://fal.ai/models/fal-ai/nano-banana-pro/api) · [OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/nano-banana-pro)

#### Description

Nano Banana Pro (Google, a.k.a. Nano Banana 2): T2I only. **Very long prompts** (max 50 000 chars, min 3). **Aspect ratio "auto"** (model decides from prompt). Resolution 1K/2K/4K (4K = 2× cost). **safety_tolerance** (1–6) for content moderation. **enable_web_search** (optional, +$0.015). **limit_generations** (experimental). No negative prompt, no elements, no refs. Output includes **description** (model-generated description of the images). num_images 1–4. Higher base cost than Kling/Grok.

#### Pricing

| Unit | Cost |
|------|------|
| Per image (1K/2K) | $0.15 |
| Per image (4K) | $0.30 (2×) |
| enable_web_search | +$0.015 per request |

#### Capabilities

| Feature | Details |
|---------|---------|
| **Negative prompt** | ❌ Not available |
| **Resolution** | 1K, 2K, 4K (4K = 2×) |
| **Aspect ratio** | auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16 (11 options; **"auto"** included) |
| **num_images** | 1–4 |
| **Result type / series** | ❌ Not available |
| **Elements / refs** | ❌ Not available |
| **safety_tolerance** | ✅ 1–6 (content moderation; default 4) |
| **enable_web_search** | ✅ Optional; +$0.015 |
| **limit_generations** | ✅ Experimental boolean (default false) |
| **description** (output) | ✅ Model-generated description of images |
| **Queue API** | Same pattern |

#### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `prompt` | string | ✅ Yes | — | **Min 3, max 50 000** chars | Very long prompts supported |
| `num_images` | integer | Optional | 1 | 1–4 | |
| `seed` | integer \| null | Optional | — | — | For reproducibility |
| `aspect_ratio` | enum \| null | Optional | `"1:1"` | auto, 21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16 | **"auto"** = model decides from prompt |
| `output_format` | enum | Optional | `"png"` | jpeg, png, webp | |
| `safety_tolerance` | enum | Optional | `"4"` | "1"–"6" (1 strictest, 6 least) | Content moderation |
| `sync_mode` | boolean | Optional | false | — | Rarely in UI |
| `resolution` | enum | Optional | `"1K"` | 1K, 2K, 4K | 4K = 2× cost |
| `limit_generations` | boolean | Optional | false | — | Experimental; limit to 1 per round |
| `enable_web_search` | boolean | Optional | false | — | +$0.015 when true |

#### Schema → control mapping (for dynamic UI)

| Parameter | Control type | Options / constraints |
|-----------|--------------|------------------------|
| `prompt` | `text` (textarea) | **minLength: 3, maxLength: 50000**; showCharCount; warningAt e.g. 45000 |
| `num_images` | `number` (stepper) | 1–4, default 1 |
| `seed` | `number` (advanced) | Optional; integer or null |
| `aspect_ratio` | `icon-select` or `select` | 11 options including **"auto"** (label e.g. "Auto (from prompt)"); default 1:1 |
| `output_format` | `select` | jpeg, png, webp; default png |
| `safety_tolerance` | `select` or `slider` | 1–6; default 4; label e.g. "Strict" → "Permissive" or numeric |
| `resolution` | `segmented` | 1K, 2K, 4K; 4K cost hint (2×) |
| `limit_generations` | `toggle` (advanced) | Default false; experimental |
| `enable_web_search` | `toggle` | Default false; cost hint +$0.015 |
| `sync_mode` | — | Omit from UI |

**Visibility**: No negative_prompt, no result_type/series_amount, no elements — schema omits for this model.

#### Backend mapping (zero-code)

| Concern | Value |
|---------|--------|
| **Endpoint** | `fal-ai/nano-banana-pro` |
| **Type** | t2i |
| **Parameter mapping** | Same names; no transform. Do not send result_type, series_amount, negative_prompt, elements. safety_tolerance as string "1"–"6". |
| **Response path** | `images` array (each item `url` + optional metadata). **Also** `description` (string, required) — persist or display. |

#### Output schema

- **`images`** (array, required): Each item has at least `url`; optional file_name, content_type, file_size, width, height.
- **`description`** (string, required): Model-generated description of the generated images — **Nano Banana–specific**.

#### Use cases / When to use

- **Very long prompts** — Up to 50 000 characters; detailed or multi-part prompts.
- **Aspect "auto"** — Let model choose aspect from prompt (T2I).
- **Content moderation control** — safety_tolerance 1–6 for strictness.
- **Web search** — enable_web_search for up-to-date visual context (+$0.015).
- **Premium T2I** — Higher base cost ($0.15); 4K and realism/typography focus.

---

### Model 8: fal-ai/nano-banana-pro/edit — Image-to-Image

**Model ID**: `fal-ai/nano-banana-pro/edit`  
**Endpoint**: `https://fal.run/fal-ai/nano-banana-pro/edit`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/nano-banana-pro/edit) · [API Docs](https://fal.ai/models/fal-ai/nano-banana-pro/edit/api) · [OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/nano-banana-pro/edit)

#### Description

Nano Banana Pro **edit** (I2I): **image_urls** (array, required) — one or more reference images. Same long prompt (min 3, max 50 000), num_images 1–4, **aspect_ratio** (default **"auto"** in Edit), resolution 1K/2K/4K, safety_tolerance, enable_web_search, limit_generations, seed, and output **description** as T2I. No result_type/series; no negative prompt; no Kling-style elements. Same pricing as Nano Banana T2I ($0.15, 4K 2×, web search +$0.015).

#### Pricing

| Unit | Cost |
|------|------|
| Per image (1K/2K) | $0.15 |
| Per image (4K) | $0.30 (2×) |
| enable_web_search | +$0.015 per request |

#### Capabilities

| Feature | Details |
|---------|---------|
| **Reference images** | ✅ **image_urls** (array, required) — one or more URLs; multi-ref edit |
| **Aspect ratio** | Same 11 options as T2I; **default "auto"** in Edit |
| **Resolution** | 1K, 2K, 4K (4K = 2×) |
| **num_images** | 1–4 |
| **safety_tolerance** | 1–6 (default 4) |
| **enable_web_search** | Optional; +$0.015 |
| **limit_generations** | Experimental (default false) |
| **description** (output) | ✅ Model-generated description of edited images |
| **Queue API** | Same pattern |

#### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `prompt` | string | ✅ Yes | — | Min 3, max 50 000 | Edit instruction |
| `image_urls` | string[] | ✅ Yes | — | One or more URLs | Multi-ref (no fixed max in schema) |
| `num_images` | integer | Optional | 1 | 1–4 | |
| `seed` | integer \| null | Optional | — | — | |
| `aspect_ratio` | enum \| null | Optional | **`"auto"`** | Same 11 as T2I | **Default "auto" in Edit** |
| `output_format` | enum | Optional | `"png"` | jpeg, png, webp | |
| `safety_tolerance` | enum | Optional | `"4"` | "1"–"6" | |
| `sync_mode` | boolean | Optional | false | — | Rarely in UI |
| `resolution` | enum | Optional | `"1K"` | 1K, 2K, 4K | 4K = 2× cost |
| `limit_generations` | boolean | Optional | false | — | Experimental |
| `enable_web_search` | boolean | Optional | false | — | +$0.015 when true |

#### Schema → control mapping (for dynamic UI)

| Parameter | Control type | Options / constraints |
|-----------|--------------|------------------------|
| `prompt` | `text` (textarea) | minLength: 3, maxLength: 50000 |
| `image_urls` | RefsPanel (Edit) | **Multiple slots** (1+); upload + history; required; no fixed max in API |
| `num_images` | `number` (stepper) | 1–4, default 1 |
| `seed` | `number` (advanced) | Optional; integer or null |
| `aspect_ratio` | `icon-select` or `select` | 11 options; **default "auto"** in Edit; label "Auto (from prompt)" or "Auto (from input)" |
| `output_format` | `select` | jpeg, png, webp; default png |
| `safety_tolerance` | `select` or `slider` | 1–6; default 4 |
| `resolution` | `segmented` | 1K, 2K, 4K; 4K cost hint |
| `limit_generations` | `toggle` (advanced) | Default false |
| `enable_web_search` | `toggle` | Default false; cost hint +$0.015 |
| `sync_mode` | — | Omit from UI |

**Visibility**: Same as Nano Banana T2I — no negative_prompt, no result_type/series_amount, no elements.

#### Backend mapping (zero-code)

| Concern | Value |
|---------|--------|
| **Endpoint** | `fal-ai/nano-banana-pro/edit` |
| **Type** | i2i |
| **Parameter mapping** | Same names; **image_urls** (array). Canonical refs → image_urls for this model. safety_tolerance as string. Do not send result_type, series_amount, negative_prompt, elements. |
| **Response path** | `images` array; each item `url` + optional metadata. **Also** `description` (string, required). |

#### Output schema

- **`images`** (array, required): Same as Nano Banana T2I — each item has at least `url`.
- **`description`** (string, required): Model-generated description of the edited images.

#### Use cases / When to use

- **Multi-image edit** — One or more input images + prompt; same 50k prompt, safety_tolerance, web search, 4K as T2I.
- **Aspect "auto"** — Default in Edit; model decides from content.
- **Premium I2I** — Same $0.15 base and options as Nano Banana T2I; use when you need Google-quality edit with multi-ref.

---

### Model 9: fal-ai/nano-banana-2 — Text-to-Image

**Model ID**: `fal-ai/nano-banana-2`  
**Endpoint**: `https://fal.run/fal-ai/nano-banana-2`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/nano-banana-2) · [API Docs](https://fal.ai/models/fal-ai/nano-banana-2/api) · [OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/nano-banana-2)

#### Description

Nano Banana 2 is Google's state-of-the-art **fast** image generation model. **T2I only** (no I2I endpoint in API). Same long prompts (min 3, max 50 000), aspect "auto", safety_tolerance, enable_web_search, and output **description** as Nano Banana Pro. **Differences from Pro**: lower base cost ($0.08/image); **resolution** includes **0.5K** (512px, 0.75× rate) in addition to 1K/2K/4K (2K = 1.5×, 4K = 2×); **limit_generations** default is **true** (experimental: limit to 1 generation per round). num_images 1–4. No negative prompt, no elements, no refs.

#### Pricing

| Unit | Cost |
|------|------|
| Per image (1K) | $0.08 |
| Per image (0.5K) | $0.06 (0.75×) |
| Per image (2K) | $0.12 (1.5×) |
| Per image (4K) | $0.16 (2×) |
| enable_web_search | +$0.015 per request |

#### Capabilities

| Feature | Details |
|---------|---------|
| **Negative prompt** | ❌ Not available |
| **Resolution** | **0.5K**, 1K, 2K, 4K (0.5K = 0.75×; 2K = 1.5×; 4K = 2×) |
| **Aspect ratio** | Same 11 options as Nano Banana Pro (auto, 21:9, 16:9, … 9:16); default "auto" |
| **num_images** | 1–4 |
| **safety_tolerance** | ✅ 1–6 (default 4) |
| **enable_web_search** | ✅ Optional; +$0.015 |
| **limit_generations** | ✅ Experimental; **default true** (limit to 1 per round) |
| **description** (output) | ✅ Model-generated description of images |
| **Queue API** | Same pattern (queue.fal.run) |

#### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `prompt` | string | ✅ Yes | — | Min 3, max 50 000 | Same as Pro |
| `num_images` | integer | Optional | 1 | 1–4 | |
| `seed` | integer \| null | Optional | — | — | |
| `aspect_ratio` | enum \| null | Optional | **`"auto"`** | Same 11 as Pro | |
| `output_format` | enum | Optional | `"png"` | jpeg, png, webp | |
| `safety_tolerance` | enum | Optional | `"4"` | "1"–"6" | |
| `sync_mode` | boolean | Optional | false | — | Rarely in UI |
| `resolution` | enum | Optional | `"1K"` | **"0.5K"**, "1K", "2K", "4K" | **0.5K** only on NB2 |
| `limit_generations` | boolean | Optional | **true** | — | **Default true** (Pro default false) |
| `enable_web_search` | boolean | Optional | false | — | +$0.015 when true |

#### Schema → control mapping (for dynamic UI)

| Parameter | Control type | Options / constraints |
|-----------|--------------|------------------------|
| `prompt` | `text` (textarea) | minLength: 3, maxLength: 50000 |
| `num_images` | `number` (stepper) | 1–4, default 1 |
| `seed` | `number` (advanced) | Optional; integer or null |
| `aspect_ratio` | `icon-select` or `select` | 11 options including "auto"; default auto |
| `output_format` | `select` | jpeg, png, webp; default png |
| `safety_tolerance` | `select` or `slider` | 1–6; default 4 |
| `resolution` | `segmented` | **0.5K**, 1K, 2K, 4K; cost hints (0.75×, 1.5×, 2×) |
| `limit_generations` | `toggle` (advanced) | **Default true**; experimental |
| `enable_web_search` | `toggle` | Default false; cost hint +$0.015 |
| `sync_mode` | — | Omit from UI |

#### Backend mapping (zero-code)

| Concern | Value |
|---------|--------|
| **Endpoint** | `fal-ai/nano-banana-2` |
| **Type** | t2i |
| **Parameter mapping** | Same names as API; no transform. resolution includes "0.5K". limit_generations default true. |
| **Response path** | `images` array (each item `url` + optional metadata); **description** (string, required). |

#### Output schema

- **`images`** (array, required): Same as Nano Banana Pro — each item has at least `url`.
- **`description`** (string, required): Model-generated description of the generated images.

#### Use cases / When to use

- **Faster / cheaper T2I** — $0.08/image vs Pro $0.15; good for drafts or high volume.
- **0.5K resolution** — 512px at 0.75× cost for thumbnails or quick previews.
- **Same long prompts** — Up to 50k chars, aspect "auto", safety_tolerance, web search, description in output.
- **limit_generations true** — Default limits to 1 generation per round; set false for multi-round behavior (may affect quality).

---

### Model N: [Model name] — [T2I / I2I] *(template — copy and fill)*

**Model ID**: `fal-ai/…`  
**Endpoint**: `https://fal.run/fal-ai/…`  
**FAL URL**: [Playground](…) · [API Docs](…) · [llms.txt](…)

#### Description

*One short paragraph.*

#### Pricing

| Unit | Cost |
|------|------|
| *TBD* | *TBD* |

#### Capabilities

| Feature | Details |
|--------|---------|
| *TBD* | *TBD* |

#### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| *TBD* | *TBD* | *TBD* | *TBD* | *TBD* | *TBD* |

#### Schema → control mapping (for dynamic UI)

| Parameter | Control type | Options / constraints |
|-----------|--------------|------------------------|
| *TBD* | *icon-select / segmented / text / …* | *…* |

#### Output schema

*Brief.*

#### Use cases / When to use

*Short.*

---

## 📐 Summary (to be updated as models are added)

### Universal parameters (all models)

- **prompt** (string, required) — Max length varies (Kling: 2500; Grok: 8000; **Nano Banana Pro: 50 000**, min 3).
- **aspect_ratio** (enum) — Value set per model; **Nano Banana Pro** includes "auto" (T2I); 11 options (21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16, auto).
- **resolution** (enum) — Kling v3: 1K, 2K; O3 & **Nano Banana Pro**: 1K, 2K, 4K (4K = 2×). **Nano Banana 2**: 0.5K, 1K, 2K, 4K (0.5K = 0.75×; 2K = 1.5×; 4K = 2×). Grok: omit.
- **num_images** (integer) — Kling: 1–9; O3 with result_type: 1–9 or series 2–9; Grok & **Nano Banana Pro**: 1–4.
- **result_type** (enum) — O3 T2I & O3 I2I only: single | series.
- **output_format** (enum) — jpeg, png, webp; Kling/Nano Banana default png; Grok default jpeg; optional in UI.

### Model-specific parameters (from Kling v3, O3 T2I & I2I, Grok, Nano Banana Pro)

- **negative_prompt** (string) — v3 **T2I only**; show when `capabilities.negativePrompt`. Grok, Nano Banana: not available.
- **image_url** (string) — v3 **I2I** & **Grok Edit**: single required ref; RefsPanel one slot.
- **image_urls** (array) — **O3 I2I**: 1–10 refs; @Image1, @Image2 …; **Nano Banana Pro Edit**: 1+ refs (required); RefsPanel multiple slots.
- **resolution** — **Grok T2I & Grok Edit**: no resolution. **Nano Banana Pro T2I & Edit**: 1K, 2K, 4K (4K 2×).
- **aspect_ratio** — **Grok Edit**: no aspect_ratio (output follows input). **Nano Banana Pro**: "auto" in T2I; **Edit default "auto"**.
- **safety_tolerance** (enum) — **Nano Banana Pro T2I & Edit**: "1"–"6"; default "4"; advanced or dedicated control.
- **enable_web_search** (boolean) — **Nano Banana Pro T2I & Edit**: optional; +$0.015; toggle with cost hint.
- **limit_generations** (boolean) — **Nano Banana Pro T2I & Edit**: experimental; default false. **Nano Banana 2**: default **true** (limit to 1 per round).
- **seed** (integer \| null) — **Nano Banana Pro** (and others); advanced.
- **revised_prompt** (output) — **Grok T2I & Grok Edit**: enhanced prompt in response.
- **description** (output) — **Nano Banana Pro T2I & Edit**: model-generated description of images.
- **result_type** (enum) — **O3 T2I & O3 I2I**: single | series; dependency: series → show series_amount (2–9), hide num_images; single → opposite.
- **series_amount** (integer) — O3 T2I & O3 I2I when result_type = series; 2–9.
- **elements** (list) — Kling T2I & I2I: frontal_image_url + reference_image_urls (0–3); @Element1, @Element2.
- **maxResolution** — v3: 2K; O3 T2I & O3 I2I: **4K** (4K = 2× cost).
- **aspect_ratio "auto"** — **O3 I2I**: default for Edit; label "Auto (from input)". **Nano Banana Pro Edit**: default "auto"; same 11 options.
- **sync_mode** (boolean) — FAL convention; omit or advanced only.

### Schema and UI checklist for zero-code onboarding

- [ ] Every parameter has a **control type** and optional **advanced** flag.
- [ ] **Capabilities** object drives visibility (negative prompt, 4K, elements, multi-image, aspect auto).
- [ ] **Aspect ratio** options (including "auto" for I2I) come from schema.
- [ ] **Resolution** options come from schema (subset of 1K/2K/4K).
- [ ] **Backend** `falModels.ts` maps model id → endpoint + type; **parameter mapping** (and optional value transform / response path) defined per model so backend stays generic.
- [ ] No hardcoded model IDs in UI components; model list and options rendered from config/schema.

**Optional later (Phase 2):** Parameter chaining (`dependsOn` / `visibleWhen` with multiple conditions) for complex models; response validation schema (expected type, min/max images, timeout) for robust zero-code error handling.

---

## 🚀 Recommended analysis order & per-model checklist

**Order to document models** (existing implementations first, then popular FAL models):

1. Kling O3 T2I (current default)
2. Kling v3 T2I (current alternative)
3. Kling O3 I2I (edit default)
4. Kling v3 I2I (edit alternative)
5. Flux (popular FAL)
6. SDXL (popular FAL)

**For each model, document:**

- API parameters with **UI → API transformation** (names and value mapping)
- **Visual control** specs (icon-select, segmented, etc.) and options
- **Mobile** hints where relevant (steppers, char count, labels)
- **Capability flags** that drive visibility (negativePrompt, maxResolution, multiImage, elements, aspectAuto, resultTypeSeries)

---

**Document version**: 1.0  
**Last updated**: February 14, 2026
