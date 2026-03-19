# 🖼️ Mini App: Image Tool (Generator + Editor Merged) - Implementation Analysis

**Source Repositories**: [Nano Banana Pro Playground](https://github.com/elpiarthera/Nano-banana-pro-playground) + [EasyEdit](https://github.com/Nutlope/easyedit)  
**Models**: Kling Image (FAL.ai) — O3 T2I (default), v3 T2I (optional), v3 I2I + O3 I2I (edit)  
**Date**: February 10, 2026  
**API**: FAL queue OpenAPI — [O3 T2I](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/o3/text-to-image) · [O3 I2I](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/o3/image-to-image) · [v3 T2I](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/v3/text-to-image) · [v3 I2I](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/v3/image-to-image)  
**Status**: Analysis Complete  
**Related**: [sprint-23-Image-Generator-demo.md](../MVP/Todo/sprint-23-Image-Generator-demo.md) (UI copy ✅ complete)

---

## Executive Summary

The **Image Tool** is a **single merged mini-app** combining text-to-image generation and prompt-based image editing in one place. One route (`/tools/image`), two modes (Generate / Edit), shared version history and "Use in Video" flow. Built on Kling Image models (FAL.ai) for a **unified Kling pipeline** (image → edit → Kling I2V video).

**Merge rationale**: Image Editor is "Image Generator + iterative prompt-based editing with version history." Two separate apps would confuse users; one tool with two modes is cleaner.

**Architecture**: Nano Banana Pro UI shell (already ported in Sprint 23) + Edit mode tab + Kling Image Convex actions + shared Convex persistence.  
**Estimated Integration Time**: **10–14 hours** (merged scope; comparable to Generator alone, editor included).

> ✅ **Kling pipeline value**: Images from Kling T2I/I2I feed into Kling I2V with better consistency than mixing model families. Strong VC demo story: "Generate → Edit → Animate" within one ecosystem.

---

## Model Strategy

| Mode | Model | Purpose | Pricing (FAL.ai) |
|------|--------|---------|------------------|
| **Generate (default)** | Kling Image **O3 T2I** | Best quality, series mode (2–9 related images), 4K, elements | $0.028/img (1K/2K), 2× for 4K |
| **Generate (optional)** | Kling Image **v3 T2I** | "Standard" toggle — negative prompt, 1K/2K, num_images 1–9 | $0.028/img |
| **Edit (default)** | Kling Image **O3 I2I** | Multi-ref (up to 10 images), @Image1/@Image2 in prompt, series, 4K, aspect **auto** | $0.028/img (1K/2K), 2× for 4K |
| **Edit (optional)** | Kling Image **v3 I2I** | Single image_url, prompt-based transform, elements (face control) | $0.028/img |

- **O3 T2I**: `fal-ai/kling-image/o3/text-to-image` — [Queue OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/o3/text-to-image)  
- **O3 I2I**: `fal-ai/kling-image/o3/image-to-image` — [Queue OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/o3/image-to-image)  
- **v3 T2I**: `fal-ai/kling-image/v3/text-to-image` — [Queue OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/v3/text-to-image)  
- **v3 I2I**: `fal-ai/kling-image/v3/image-to-image` — [Queue OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/v3/image-to-image)

---

## Kling Image API Capabilities (Full Leverage)

Per-endpoint parameters from FAL queue OpenAPI. **Bold** = must expose in UI/action for full leverage.

### O3 Text-to-Image (`fal-ai/kling-image/o3/text-to-image`)

| Parameter | Type | Default | UI / Action |
|-----------|------|---------|-------------|
| **prompt** | string (max 2500) | required | ✅ Prompt textarea |
| **elements** | ElementInput[] | optional | ✅ "Add character/object" (frontal_image_url, reference_image_urls); reference in prompt as @Element1, @Element2 |
| **resolution** | "1K" \| "2K" \| "4K" | "1K" | ✅ Resolution selector (4K = 2× cost) |
| **result_type** | "single" \| "series" | "single" | ✅ Toggle: one image vs series of related images |
| **num_images** | 1–9 | 1 | ✅ When result_type=single: number of images |
| **series_amount** | 2–9 | — | ✅ When result_type=series: size of series |
| **aspect_ratio** | 16:9, 9:16, 1:1, 4:3, 3:4, 3:2, 2:3, 21:9 | "16:9" | ✅ Aspect dropdown |
| **output_format** | jpeg, png, webp | "png" | ✅ Format selector or default png |
| sync_mode | boolean | false | Server-only (data URI); default false |

### O3 Image-to-Image (`fal-ai/kling-image/o3/image-to-image`)

| Parameter | Type | Default | UI / Action |
|-----------|------|---------|-------------|
| **prompt** | string (max 2500) | required | ✅ Edit prompt; **reference images in prompt as @Image1, @Image2, … (1-indexed)** |
| **image_urls** | string[] (max **10** images) | required | ✅ Edit: upload/select 1–10 reference images; prompt can say e.g. "Combine @Image1 and @Image2 in a poster" |
| **elements** | ElementInput[] | optional | ✅ Face/character control; @Element1, @Element2 in prompt |
| **resolution** | "1K" \| "2K" \| "4K" | "1K" | ✅ Resolution selector |
| **result_type** | "single" \| "series" | "single" | ✅ "One result" vs "Series of variations" (2–9) |
| **num_images** | 1–9 | 1 | ✅ When result_type=single |
| **series_amount** | 2–9 | — | ✅ When result_type=series |
| **aspect_ratio** | 16:9, 9:16, 1:1, 4:3, 3:4, 3:2, 2:3, 21:9, **"auto"** | **"auto"** | ✅ **Expose "auto"** (intelligently from input); or fixed ratio |
| **output_format** | jpeg, png, webp | "png" | ✅ Format or default |

### v3 Text-to-Image (`fal-ai/kling-image/v3/text-to-image`)

| Parameter | Type | Default | UI / Action |
|-----------|------|---------|-------------|
| **prompt** | string (max 2500) | required | ✅ Prompt textarea |
| **negative_prompt** | string (max 2500) | optional | ✅ **"Standard" mode: negative prompt field** (what to avoid) |
| **elements** | ElementInput[] | optional | ✅ Same as O3 (frontal + refs, @Element1/@Element2) |
| **resolution** | "1K" \| "2K" | "1K" | ✅ 1K/2K only (no 4K) |
| **num_images** | 1–9 | 1 | ✅ Multiple independent images (no series mode) |
| **aspect_ratio** | same set as O3 | "16:9" | ✅ Aspect dropdown |
| **output_format** | jpeg, png, webp | "png" | ✅ Format or default |

### v3 Image-to-Image (`fal-ai/kling-image/v3/image-to-image`)

| Parameter | Type | Default | UI / Action |
|-----------|------|---------|-------------|
| **prompt** | string (max 2500) | required | ✅ Edit prompt |
| **image_url** | string (single image) | required | ✅ One reference image (upload or from history) |
| **elements** | ElementInput[] | optional | ✅ Face/object control |
| **resolution** | "1K" \| "2K" | "1K" | ✅ 1K/2K only |
| **num_images** | 1–9 | 1 | ✅ Multiple output images from one input |
| **aspect_ratio** | same set (no "auto") | "16:9" | ✅ Aspect dropdown |
| **output_format** | jpeg, png, webp | "png" | ✅ Format or default |

### ElementInput (all endpoints)

| Field | Type | Notes |
|-------|------|------|
| **frontal_image_url** | string | Main view of character/object; optional in schema |
| **reference_image_urls** | string[] (0–3) | Extra angles. Reference in prompt as @Element1, @Element2. |

**Image constraints (FAL):** max 10MB, min 300×300px, aspect 0.4–2.5, timeout 20s.

---

## Feature Overview

### ✅ Core Features (Merged)

#### Generate mode
- **Text-to-Image**: Prompt → image(s). Default: Kling O3 T2I; optional: v3 T2I ("Standard") with **negative prompt**.
- **O3 T2I (full leverage)**: **result_type** single | series; **num_images** 1–9 (single) or **series_amount** 2–9 (series); **resolution** 1K/2K/4K; **elements** (frontal + refs, @Element1/@Element2 in prompt); **aspect_ratio** (full set).
- **v3 T2I (full leverage)**: **negative_prompt**; num_images 1–9; resolution 1K/2K; elements; aspect_ratio.
- **Upload / URL / paste**: For switching to Edit or reusing an image.

#### Edit mode
- **Default: O3 I2I** — **image_urls** (1–10 refs); in prompt reference as **@Image1, @Image2, …**; **result_type** single | series; **series_amount** 2–9; **resolution** 1K/2K/4K; **aspect_ratio** including **"auto"** (intelligent from input); **elements** for face/object control.
- **Optional: v3 I2I** — Single **image_url**, prompt-based transform; elements; resolution 1K/2K; **num_images** 1–9 for multiple outputs.
- **Iterative workflow**: Each edit = new version in history; O3 I2I supports "edit with multiple refs" or "series of variations from this image."

#### Shared
- **Version history**: Single Convex-backed list (generations + edits), shared across modes.
- **Download / copy / open in new tab**: Per image.
- **"Use in Video"**: Callback to pass image URL into video pipeline (Kling I2V).
- **Credits**: Deduct per generation and per edit; use existing MyShortReel credit system.
- **Auth**: Clerk; history scoped by user.

### ✅ User Experience (from source apps)

- Progress indicator, toasts, responsive layout (Nano Banana + EasyEdit patterns).
- Optional: fullscreen viewer, keyboard shortcuts (Generate: Ctrl+Enter; Copy: Ctrl+C; Download: Ctrl+D).
- Mobile: Tabs for Generate / Edit; history as horizontal scroll or grid.

### ❌ Out of scope for MVP

- AI editing suggestions (EasyEdit Llama suggestions) — Phase 2.
- Native image tools (masks, brushes, filters).
- Multi-model comparison UI (O3 vs v3 is a toggle, not a benchmark page).

---

## Technology Stack

| Layer | Technology | MyShortReel Compatibility |
|-------|-----------|---------------------------|
| Framework | Next.js 16, React 19, TypeScript 5 | ✅ Match |
| Styling | Tailwind CSS 4 | ✅ Match |
| UI | Radix UI, Lucide | ✅ In use |
| Image API | FAL.ai (Kling Image O3/v3) | ✅ Replace Nano Banana/EasyEdit backends |
| Persistence | Convex (tables + actions) | ✅ In use |
| Auth / Credits | Clerk, existing credit system | ✅ In use |
| Reference UI | Nano Banana (Sprint 23 port) + EasyEdit patterns | ✅ Already copied (demo) |

---

## Architecture Assessment

### Strengths

- **Single surface**: One URL, one tool; no confusion between "generator" and "editor."
- **Unified pipeline**: Kling Image T2I/I2I → Kling I2V; same provider (FAL.ai), consistent look for demo.
- **Sprint 23 foundation**: Image Generator UI already present; add Edit tab and wire backend.
- **Shared history**: One Convex table for both "generated" and "edited" items; simple schema.

### Weaknesses / Mitigations

- Four endpoints (O3 T2I, v3 T2I, O3 I2I, v3 I2I): Two Convex actions (`klingT2I` with model param, `klingI2I` with model param) or four thin actions; UI toggles "O3 / v3" and "single / series" + optional elements.
- Version history design: One table with `mode: "generate" | "edit"`, `sourceImageId` optional for edits; parent reference for "edit chain" if needed later.

---

## Feature Coverage Map (Merged)

| Feature | Source | Effort | Value |
|---------|--------|--------|-------|
| Generate UI (prompt, aspect, resolution) | Nano Banana (Sprint 23) | Wire only | HIGH |
| O3 T2I + v3 T2I toggle | New | 1–2h | HIGH |
| Edit UI (upload 1–10 refs, prompt with @Image1/@Image2, version list) | EasyEdit + new | Copy + adapt | HIGH |
| O3 I2I + v3 I2I Convex actions (model toggle) | New | 1–2h | HIGH |
| Elements (frontal + refs, @Element1/@Element2) — Generate & Edit | New | 1h | MEDIUM (Phase 2 ok) |
| Shared version history (Convex) | New | 2–3h | HIGH |
| Credits + auth | MyShortReel | Integrate | HIGH |
| Download / copy / "Use in Video" | Both | Direct | MEDIUM |
| Mobile + i18n | Both | Polish | MEDIUM |

---

## Integration Complexity

### Easy

- Reuse Sprint 23 page and components; add tab or mode switch (Generate | Edit).
- Download, copy, open in new tab (already in Nano Banana).
- Aspect ratio and resolution selectors (map to Kling enums).

### Medium

- Convex schema for image tool history (one table; `mode`, `prompt`, `imageUrl` or `imageUrls[]`, `sourceImageUrl?` / `sourceImageUrls[]?`, `model`, `resolution`, `aspectRatio`, `resultType`, `createdAt`, `userId`).
- Convex actions: `klingT2I` (O3 or v3), `klingI2I` (O3 or v3). O3 I2I accepts `image_urls[]` and prompt with @Image1/@Image2; v3 I2I single `image_url`.
- Credit deduction for both actions; reuse existing credit hooks.
- Edit flow: upload 1–10 images (O3) or 1 (v3) → prompt (with @ImageN refs for O3) → I2I action → append to history. Expose aspect_ratio "auto" for O3 I2I.

### Complex

- Optional: "Edit chain" (link edits to parent image for version tree). Can be MVP-flat list first.

---

## Time Estimation

| Task | Hours |
|------|--------|
| Merged UI (Sprint 23 base + Edit tab, mode switch) | 3–4h |
| Kling O3 T2I Convex action (+ v3 T2I toggle, series/num_images/elements) | 1–2h |
| Kling O3 I2I + v3 I2I Convex actions (image_urls vs image_url, series, auto aspect) | 1–2h |
| Convex schema + history mutations/queries | 2–3h |
| Credits, auth, "Use in Video" callback | 2–3h |
| **Total** | **~10–14h** |

---

## Convex Schema (Unified History)

```typescript
// One table for both generate and edit; supports single or multiple result images
export const imageToolHistory = defineTable({
  userId: v.string(),
  mode: v.union(v.literal("generate"), v.literal("edit")),
  prompt: v.string(),
  imageUrl: v.optional(v.string()),        // single result (or first of many)
  imageUrls: v.optional(v.array(v.string())), // when result_type=series or num_images>1
  sourceImageUrl: v.optional(v.string()),   // v3 I2I: single input
  sourceImageUrls: v.optional(v.array(v.string())), // O3 I2I: 1-10 refs
  model: v.string(),                        // e.g. "kling-o3-t2i", "kling-o3-i2i"
  resolution: v.optional(v.string()),       // 1K, 2K, 4K
  aspectRatio: v.optional(v.string()),     // include "auto" for O3 I2I
  resultType: v.optional(v.string()),      // "single" | "series"
  metadata: v.optional(v.any()),           // elements, series_amount, num_images
  createdAt: v.number(),
}).index("by_user", ["userId"])
  .index("by_user_created", ["userId", "createdAt"]);
```

---

## Deliverables & Success Criteria

### MVP (10–14h)

- One route: e.g. `/[locale]/tools/image`.
- **Generate**: O3 T2I default, v3 T2I optional; aspect ratio, resolution 1K/2K/4K (O3), series or num_images; optional elements (Phase 2).
- **Edit**: O3 I2I default (1–10 refs, @Image1/@Image2 in prompt, series, 4K, aspect auto); v3 I2I optional (single image); new entry in history per run.
- Shared history (Convex), persisted across sessions.
- Credit deduction for each generation and edit.
- Download, copy, "Use in Video" (callback).
- Mobile-friendly, basic i18n.

### Optional (Phase 2)

- AI edit suggestions; fullscreen viewer; keyboard shortcuts; edit chains (version tree).

---

## Recommended Implementation Path

1. **Schema + actions** (2–3h): Define `imageToolHistory` (support multi-image results); implement `klingT2I` (O3/v3, series/num_images, resolution, elements) and `klingI2I` (O3: image_urls, @ImageN, series, aspect auto; v3: image_url) Convex actions.
2. **Generate mode** (2–3h): Wire Sprint 23 UI to T2I; O3/v3 toggle; result_type (single/series); resolution 1K/2K/4K; aspect ratio; credits.
3. **Edit mode** (2–3h): Edit tab; O3 I2I (1–10 refs, prompt with @Image1/@Image2, series, aspect auto) and v3 I2I (single image) toggle; append to history.
4. **History + polish** (2–3h): Shared history component, "Use in Video", mobile, i18n, error handling.

---

## References

- [MINI-APP-IMAGE-GENERATOR-ANALYSIS.md](./MINI-APP-IMAGE-GENERATOR-ANALYSIS.md) — Nano Banana source.
- [MINI-APP-IMAGE-EDITOR-ANALYSIS.md](./MINI-APP-IMAGE-EDITOR-ANALYSIS.md) — EasyEdit source.
- [sprint-23-Image-Generator-demo.md](../MVP/Todo/sprint-23-Image-Generator-demo.md) — UI copy (done).
- FAL.ai Queue OpenAPI: [O3 T2I](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/o3/text-to-image), [O3 I2I](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/o3/image-to-image), [v3 T2I](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/v3/text-to-image), [v3 I2I](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/v3/image-to-image).  
- Playgrounds: [O3 T2I](https://fal.ai/models/fal-ai/kling-image/o3/text-to-image), [O3 I2I](https://fal.ai/models/fal-ai/kling-image/o3/image-to-image), [v3 T2I](https://fal.ai/models/fal-ai/kling-image/v3/text-to-image), [v3 I2I](https://fal.ai/models/fal-ai/kling-image/v3/image-to-image).

---

## Conclusion

**Merged Image Tool** (Generator + Editor) with **Kling Image** (O3 T2I default, v3 T2I optional; O3 I2I default for edit with multi-ref + series + 4K + auto aspect, v3 I2I optional) is the recommended approach. All four endpoints are specified above so implementation fully leverages resolution, result_type/series, elements, and O3 I2I multi-image + @ImageN prompts. Single document, single route, single history, ~10–14h, with a clear "generate → edit → video" pipeline for the VC demo.

**Recommendation**: ✅ **PROCEED** — Implement Convex actions and wire merged UI from Sprint 23 base.

---

**Document Version**: 1.0  
**Last Updated**: February 10, 2026  
**Status**: Ready for Development
