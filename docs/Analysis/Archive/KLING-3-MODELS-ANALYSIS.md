# 🎬 Kling 3.0 Image-to-Video Models Analysis

**Date**: February 10, 2026  
**Status**: In Progress (adding models as evaluated)  
**Scope**: Image-to-Video endpoints only  
**Provider**: FAL.ai (exclusive)

---

## Models Evaluated

| # | Model | Tier | Status |
|---|-------|------|--------|
| 1 | Kling v3 Pro I2V | Pro | ✅ Documented |
| 2 | Kling v3 Standard I2V | Standard | ✅ Documented |
| 3 | Kling O3 Pro I2V | Pro | ✅ Documented |
| 4 | Kling O3 Pro Ref2V | Pro | ✅ Documented |
| 5 | Kling O3 Pro V2V Edit | Pro | ✅ Documented |
| 6 | Kling O3 Pro V2V Reference | Pro | ✅ Documented |
| 7 | Kling O3 Standard I2V | Standard | ✅ Documented |
| 8 | Kling O3 Standard Ref2V | Standard | ✅ Documented |
| 9 | Kling O3 Standard V2V Edit | Standard | ✅ Documented |
| 10 | Kling O3 Standard V2V Reference | Standard | ✅ Documented |

---

## 1. Kling v3 Pro — Image-to-Video

**Model ID**: `fal-ai/kling-video/v3/pro/image-to-video`  
**Endpoint**: `https://fal.run/fal-ai/kling-video/v3/pro/image-to-video`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video) · [API Docs](https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video/api) · [llms.txt](https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video/llms.txt)

### Description

Top-tier image-to-video generation with cinematic visuals, fluid motion, and native audio generation. Supports custom elements (characters/objects) for consistency across generations, multi-shot prompting (up to 6 shots), voice control with custom voice IDs, and start/end frame conditioning.

### Pricing

| Mode | Cost per second | 5s cost | 10s cost | 15s cost |
|------|----------------|---------|----------|----------|
| **Audio off** | $0.224 | $1.12 | $2.24 | $3.36 |
| **Audio on** | $0.336 | $1.68 | $3.36 | $5.04 |
| **Audio + Voice control** | $0.392 | $1.96 | $3.92 | $5.88 |

### Capabilities

| Feature | Details |
|---------|---------|
| **Duration** | 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 seconds |
| **Aspect Ratios** | 16:9, 9:16, 1:1 |
| **Negative Prompt** | ✅ Yes (default: "blur, distort, and low quality") |
| **CFG Scale** | 0 to 1 (default: 0.5) |
| **Start Image** | ✅ Required (`start_image_url`) |
| **End Image** | ✅ Optional (`end_image_url`) |
| **Native Audio** | ✅ Yes (default: on) — Chinese & English voice output |
| **Voice Control** | ✅ Yes — up to 2 custom voice IDs per task via `<<<voice_1>>>` / `<<<voice_2>>>` |
| **Multi-Shot** | ✅ Yes — `multi_prompt` divides video into multiple labeled shots |
| **Elements (Consistency)** | ✅ Yes — characters/objects via frontal + reference images or video. Reference as `@Element1`, `@Element2` |
| **Output Format** | MP4 (`video/mp4`) |

### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `start_image_url` | string | ✅ Yes | — | Max 10MB, min 300×300px, aspect ratio 0.4–2.5 | URL of start frame image |
| `prompt` | string | Optional | — | Max 2500 chars | Either `prompt` or `multi_prompt`, not both |
| `multi_prompt` | `KlingV3MultiPromptElement[]` | Optional | — | Each element: `prompt` (required) + `duration` (3-15s, default "5") | Multi-shot labeled sequences |
| `duration` | enum string | Optional | "5" | "3"–"15" | Total video duration in seconds |
| `generate_audio` | boolean | Optional | true | — | Native audio (Chinese & English; others auto-translated to English) |
| `end_image_url` | string | Optional | — | Max 10MB, min 300×300px, aspect ratio 0.4–2.5 | End frame for transition control |
| `voice_ids` | string[] | Optional | — | Max 2 IDs | Reference in prompt as `<<<voice_1>>>` / `<<<voice_2>>>`. Create via `/create-voice` endpoint |
| `elements` | `KlingV3ComboElementInput[]` | Optional | — | See below | Character/object consistency elements. Reference as `@Element1`, `@Element2` |
| `shot_type` | enum string | Optional | "customize" | Only "customize" | Required when `multi_prompt` is provided |
| `aspect_ratio` | enum string | Optional | "16:9" | "16:9", "9:16", "1:1" | Video frame ratio |
| `negative_prompt` | string | Optional | "blur, distort, and low quality" | Max 2500 chars | What to avoid |
| `cfg_scale` | float | Optional | 0.5 | 0.0–1.0 | Prompt adherence strength |

### Element Input Schema (`KlingV3ComboElementInput`)

Each element can be **image-based** OR **video-based** (not both). Max 1 video element per request.

| Parameter | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| `frontal_image_url` | string | Max 10MB, min 300×300px, aspect ratio 0.4–2.5 | Main view of character/object |
| `reference_image_urls` | string[] | 1-3 images, same constraints as frontal | Additional angles for consistency |
| `video_url` | string | Max 200MB, 720–2160px, 3–10.05s, 24–60 FPS | Video element (max 1 per request) |

### Multi-Prompt Element Schema (`KlingV3MultiPromptElement`)

| Parameter | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| `prompt` | string | ✅ Yes | — | Prompt for this specific shot |
| `duration` | enum string | Optional | "5" | "3"–"15" seconds for this shot |

### Queue API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/fal-ai/kling-video/v3/pro/image-to-video` | Submit generation request |
| GET | `.../requests/{request_id}/status` | Poll status (`IN_QUEUE`, `IN_PROGRESS`, `COMPLETED`) |
| GET | `.../requests/{request_id}` | Retrieve completed result |
| PUT | `.../requests/{request_id}/cancel` | Cancel queued request |

**Queue Base URL**: `https://queue.fal.run`  
**Auth**: `Authorization: Key $FAL_KEY`

### Output Schema

| Field | Type | Description |
|-------|------|-------------|
| `video.url` | string | CDN URL to download generated MP4 |
| `video.file_name` | string | Filename (e.g., "out.mp4") |
| `video.file_size` | integer | Size in bytes |
| `video.content_type` | string | Always "video/mp4" |

### Use Cases

- **Cinematic storytelling** — multi-shot sequences with character consistency and dialogue
- **Premium ad content** — highest quality for branded video with voice control
- **Film-style shorts** — start/end frame conditioning for precise narrative control
- **Character-driven scenes** — element consistency keeps characters stable across shots
- **Demo/pitch videos** — maximum visual impact for presentations

### When to Use

Use **v3 Pro** when quality is paramount and budget allows. Best for final renders, client-facing output, demo reels, and any content where cinematic fidelity matters. The voice control feature makes it ideal for dialogue-heavy scenes.

---

## 2. Kling v3 Standard — Image-to-Video

**Model ID**: `fal-ai/kling-video/v3/standard/image-to-video`  
**Endpoint**: `https://fal.run/fal-ai/kling-video/v3/standard/image-to-video`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/kling-video/v3/standard/image-to-video) · [API Docs](https://fal.ai/models/fal-ai/kling-video/v3/standard/image-to-video/api) · [llms.txt](https://fal.ai/models/fal-ai/kling-video/v3/standard/image-to-video/llms.txt)

### Description

Same feature set as v3 Pro (multi-shot, native audio, voice control, elements, start/end frames) at a lower price point. Slightly reduced visual fidelity compared to Pro, but still top-tier quality suitable for most production use cases.

### Pricing

| Mode | Cost per second | 5s cost | 10s cost | 15s cost |
|------|----------------|---------|----------|----------|
| **Audio off** | $0.168 | $0.84 | $1.68 | $2.52 |
| **Audio on** | $0.252 | $1.26 | $2.52 | $3.78 |
| **Audio + Voice control** | $0.308 | $1.54 | $3.08 | $4.62 |

### Capabilities

| Feature | Details |
|---------|---------|
| **Duration** | 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 seconds |
| **Aspect Ratios** | 16:9, 9:16, 1:1 |
| **Negative Prompt** | ✅ Yes (default: "blur, distort, and low quality") |
| **CFG Scale** | 0 to 1 (default: 0.5) |
| **Start Image** | ✅ Required (`start_image_url`) |
| **End Image** | ✅ Optional (`end_image_url`) |
| **Native Audio** | ✅ Yes (default: on) — Chinese & English voice output |
| **Voice Control** | ✅ Yes — up to 2 custom voice IDs per task |
| **Multi-Shot** | ✅ Yes — `multi_prompt` for labeled multi-shot sequences |
| **Elements (Consistency)** | ✅ Yes — characters/objects via frontal + reference images or video |
| **Output Format** | MP4 (`video/mp4`) |

### Input Parameters

Identical schema to v3 Pro — same parameters, same defaults, same constraints (prompt max 2500 chars, image min 300×300px max 10MB, aspect ratio 0.4–2.5, elements, multi_prompt, voice_ids). See v3 Pro section for full schema details.

### Queue API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/fal-ai/kling-video/v3/standard/image-to-video` | Submit generation request |
| GET | `.../requests/{request_id}/status` | Poll status (`IN_QUEUE`, `IN_PROGRESS`, `COMPLETED`) |
| GET | `.../requests/{request_id}` | Retrieve completed result |
| PUT | `.../requests/{request_id}/cancel` | Cancel queued request |

**Queue Base URL**: `https://queue.fal.run`  
**Auth**: `Authorization: Key $FAL_KEY`

### Output Schema

Identical to v3 Pro — `video.url` (MP4 CDN URL), `video.file_name`, `video.file_size`, `video.content_type`.

### Use Cases

- **Iteration & exploration** — try multiple variations before committing to Pro render
- **Social media content** — quality is more than sufficient for TikTok/Reels/Shorts
- **Batch generation** — lower cost enables more variations per budget
- **Draft previews** — quick previews before final Pro render
- **Training/educational content** — good quality at accessible cost

### When to Use

Use **v3 Standard** as the default for most generations. Switch to Pro only for final renders or when maximum quality is needed. At ~25% cheaper, it's the right choice for exploration, iteration, and volume.

---

## 3. Kling O3 Pro — Image-to-Video

**Model ID**: `fal-ai/kling-video/o3/pro/image-to-video`  
**Endpoint**: `https://fal.run/fal-ai/kling-video/o3/pro/image-to-video`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/kling-video/o3/pro/image-to-video) · [API Docs](https://fal.ai/models/fal-ai/kling-video/o3/pro/image-to-video/api) · [llms.txt](https://fal.ai/models/fal-ai/kling-video/o3/pro/image-to-video/llms.txt)

### Description

The most advanced tier of the Kling omni-video lineup. Designed for higher-end customization and storyboard-first creation. Animates the transition between a start frame and optional end frame while following text-driven style and scene guidance. **Leaner API surface** than v3 — no elements, no voice control, no negative prompt, no CFG scale.

### Pricing

| Mode | Cost per second | 5s cost | 10s cost | 15s cost |
|------|----------------|---------|----------|----------|
| **Audio off** | $0.224 | $1.12 | $2.24 | $3.36 |
| **Audio on** | $0.280 | $1.40 | $2.80 | $4.20 |

> Note: Same per-second cost as v3 Pro (audio off), but **cheaper audio** ($0.28 vs $0.336). No voice control option.

### Capabilities

| Feature | Details |
|---------|---------|
| **Duration** | 3–15 seconds |
| **Aspect Ratios** | ❌ Not configurable (inherits from input image) |
| **Negative Prompt** | ❌ Not available |
| **CFG Scale** | ❌ Not available |
| **Start Image** | ✅ Required (`image_url` — note: different param name than v3) |
| **End Image** | ✅ Optional (`end_image_url`) |
| **Native Audio** | ✅ Yes (default: **off**) |
| **Voice Control** | ❌ Not available |
| **Multi-Shot** | ✅ Yes — `multi_prompt` for labeled multi-shot sequences |
| **Elements (Consistency)** | ❌ Not available |
| **Output Format** | MP4 (`video/mp4`) |

### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `image_url` | string | ✅ Yes | — | Max 10MB, min 300×300px, aspect ratio 0.4–2.5 | ⚠️ Param name is `image_url` (not `start_image_url`) |
| `prompt` | string | Optional | — | Max 2500 chars | Either `prompt` or `multi_prompt`, not both |
| `multi_prompt` | `KlingV3MultiPromptElement[]` | Optional | — | Each: `prompt` (required) + `duration` (3-15s) | Multi-shot sequences |
| `duration` | enum string | Optional | "5" | "3"–"15" | Video duration in seconds |
| `generate_audio` | boolean | Optional | **false** | — | ⚠️ Default is OFF (unlike v3 where it's ON) |
| `end_image_url` | string | Optional | — | Max 10MB, min 300×300px, aspect ratio 0.4–2.5 | End frame for transition |
| `shot_type` | enum string | Optional | "customize" | Only "customize" | Required when `multi_prompt` is provided |

### Queue API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/fal-ai/kling-video/o3/pro/image-to-video` | Submit generation request |
| GET | `.../requests/{request_id}/status` | Poll status |
| GET | `.../requests/{request_id}` | Retrieve completed result |
| PUT | `.../requests/{request_id}/cancel` | Cancel queued request |

**Queue Base URL**: `https://queue.fal.run`  
**Auth**: `Authorization: Key $FAL_KEY`

### Output Schema

Identical structure — `video.url` (MP4 CDN URL), `video.file_name`, `video.file_size`, `video.content_type`.

### Use Cases

- **Storyboard-first creation** — designed for structured multi-shot narratives
- **Start/end frame animation** — precise control over scene transitions
- **Cost-effective audio** — cheaper audio than v3 Pro ($0.28 vs $0.336/s)
- **Simple API integration** — fewer parameters, less complexity
- **Cinematic sequences** — focus on visual storytelling without element/voice overhead

### When to Use

Use **O3 Pro I2V** when you want the highest-quality storyboard-first generation with start/end frame control, and you don't need elements (character consistency via reference images) or voice control. The simpler API surface makes it easier to integrate. Use v3 Pro instead when you need elements, voice IDs, negative prompts, or aspect ratio control.

### ⚠️ Key Differences from v3 Pro

| Feature | v3 Pro | O3 Pro I2V |
|---------|--------|------------|
| Start image param | `start_image_url` | `image_url` |
| Audio default | ON (true) | **OFF (false)** |
| Audio cost/s | $0.336 | **$0.280** |
| Voice control | ✅ Yes ($0.392/s) | ❌ No |
| Elements | ✅ Yes | ❌ No |
| Negative prompt | ✅ Yes | ❌ No |
| CFG scale | ✅ Yes | ❌ No |
| Aspect ratio | ✅ Yes (16:9, 9:16, 1:1) | ❌ No |

---

## 4. Kling O3 Pro — Reference-to-Video

**Model ID**: `fal-ai/kling-video/o3/pro/reference-to-video`  
**Endpoint**: `https://fal.run/fal-ai/kling-video/o3/pro/reference-to-video`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/kling-video/o3/pro/reference-to-video) · [API Docs](https://fal.ai/models/fal-ai/kling-video/o3/pro/reference-to-video/api) · [llms.txt](https://fal.ai/models/fal-ai/kling-video/o3/pro/reference-to-video/llms.txt)

### Description

Transforms images, elements, and text into consistent, high-quality video scenes, ensuring stable character identity, object details, and environments. **Unique feature**: accepts **reference images** (`image_urls`) for style/appearance guidance, referenced in prompt as `@Image1`, `@Image2`. Also supports elements like v3. This is the **most feature-rich O3 endpoint**.

### Pricing

| Mode | Cost per second | 5s cost | 10s cost | 15s cost |
|------|----------------|---------|----------|----------|
| **Audio off** | $0.224 | $1.12 | $2.24 | $3.36 |
| **Audio on** | $0.280 | $1.40 | $2.80 | $4.20 |

> Same pricing as O3 Pro I2V.

### Capabilities

| Feature | Details |
|---------|---------|
| **Duration** | 3–15 seconds |
| **Aspect Ratios** | ✅ 16:9, 9:16, 1:1 |
| **Negative Prompt** | ❌ Not available |
| **CFG Scale** | ❌ Not available |
| **Start Image** | ✅ Optional (`start_image_url`) — not required |
| **End Image** | ✅ Optional (`end_image_url`) |
| **Reference Images** | ✅ Yes (`image_urls`) — style/appearance refs, `@Image1`, `@Image2` etc. Max 4 total (elements + refs) when using video |
| **Native Audio** | ✅ Yes (default: **off**) |
| **Voice Control** | ❌ Not available |
| **Multi-Shot** | ✅ Yes — `multi_prompt` for labeled multi-shot sequences |
| **Elements (Consistency)** | ✅ Yes — characters/objects via frontal + reference images or video. Reference as `@Element1`, `@Element2` |
| **Output Format** | MP4 (`video/mp4`) |

### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `prompt` | string | Optional | — | Max 2500 chars | Either `prompt` or `multi_prompt`, not both |
| `multi_prompt` | `KlingV3MultiPromptElement[]` | Optional | — | Each: `prompt` (required) + `duration` (3-15s) | Multi-shot sequences |
| `start_image_url` | string | Optional | — | Max 10MB, min 300×300px, aspect ratio 0.4–2.5 | ⚠️ Optional (not required like I2V models) |
| `end_image_url` | string | Optional | — | Max 10MB, min 300×300px, aspect ratio 0.4–2.5 | End frame |
| `image_urls` | string[] | Optional | — | Max 10MB each, min 300×300px, aspect ratio 0.4–2.5 | **Unique to Ref2V** — reference images for style. `@Image1`, `@Image2` in prompt. Max 4 total with elements when video used |
| `elements` | `KlingV3ComboElementInput[]` | Optional | — | See v3 Pro element schema | Characters/objects. `@Element1`, `@Element2` in prompt |
| `generate_audio` | boolean | Optional | **false** | — | Default OFF |
| `duration` | enum string | Optional | "5" | "3"–"15" | Video duration |
| `shot_type` | enum string | Optional | "customize" | Only "customize" | For multi-shot |
| `aspect_ratio` | enum string | Optional | "16:9" | "16:9", "9:16", "1:1" | Video frame ratio |

### Element Input Schema (`KlingV3ComboElementInput`)

Same as v3 Pro — image-based (frontal + 1-3 reference angles) OR video-based (max 1 video, 200MB, 720-2160px, 3-10s, 24-60 FPS).

### Queue API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/fal-ai/kling-video/o3/pro/reference-to-video` | Submit generation request |
| GET | `.../requests/{request_id}/status` | Poll status |
| GET | `.../requests/{request_id}` | Retrieve completed result |
| PUT | `.../requests/{request_id}/cancel` | Cancel queued request |

**Queue Base URL**: `https://queue.fal.run`  
**Auth**: `Authorization: Key $FAL_KEY`

### Output Schema

Identical structure — `video.url` (MP4 CDN URL), `video.file_name`, `video.file_size`, `video.content_type`.

### Use Cases

- **Style-guided video generation** — provide reference images for consistent look/feel across videos
- **Character consistency** — elements keep characters stable + references guide overall style
- **Brand video campaigns** — reference brand assets as style guides
- **Visual continuity** — start image optional; can generate purely from references + elements + prompt
- **Ad variations** — same character elements with different style references

### When to Use

Use **O3 Pro Ref2V** when you need to **guide the video's visual style with reference images** — not just control character consistency (elements), but also overall aesthetic, mood, or brand appearance. This is the only model that accepts `image_urls` for style guidance. It's also the only I2V-category model where `start_image_url` is optional — you can generate video purely from references, elements, and prompts.

### ⚠️ Key Differences from O3 Pro I2V

| Feature | O3 Pro I2V | O3 Pro Ref2V |
|---------|------------|--------------|
| Start image | ✅ Required (`image_url`) | Optional (`start_image_url`) |
| Reference images | ❌ No | ✅ `image_urls` (`@Image1`, `@Image2`) |
| Elements | ❌ No | ✅ Yes (`@Element1`, `@Element2`) |
| Aspect ratio | ❌ No | ✅ 16:9, 9:16, 1:1 |
| Audio default | OFF | OFF |
| Pricing | Same | Same |

---

## 5. Kling O3 Pro — Video-to-Video Edit

**Model ID**: `fal-ai/kling-video/o3/pro/video-to-video/edit`  
**Endpoint**: `https://fal.run/fal-ai/kling-video/o3/pro/video-to-video/edit`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/kling-video/o3/pro/video-to-video/edit) · [API Docs](https://fal.ai/models/fal-ai/kling-video/o3/pro/video-to-video/edit/api) · [llms.txt](https://fal.ai/models/fal-ai/kling-video/o3/pro/video-to-video/edit/llms.txt)

### Description

**Destructive video editor** — takes an existing video and modifies it according to prompt instructions. Change backgrounds, swap subjects, modify clothing, insert/remove elements while preserving the original video structure and motion. Can keep original audio. Uses image-only elements (no video elements).

### Pricing

| Mode | Cost per second | 5s cost | 10s cost |
|------|----------------|---------|----------|
| **Flat rate** | $0.336 | $1.68 | $3.36 |

> No audio on/off pricing — single flat rate. Most expensive per-second of all models.

### Capabilities

| Feature | Details |
|---------|---------|
| **Input Video** | ✅ Required — .mp4/.mov, 3-10s, 720-2160px, 24-60 FPS, max 200MB |
| **Duration** | ❌ Not configurable (output matches input video duration) |
| **Aspect Ratios** | ❌ Not configurable (matches input video) |
| **Negative Prompt** | ❌ Not available |
| **CFG Scale** | ❌ Not available |
| **Reference Images** | ✅ Yes (`image_urls`) — `@Image1`, `@Image2`. Max 4 total (elements + refs) |
| **Elements (Consistency)** | ✅ Yes — image-only (`KlingV3ImageElementInput`, no video elements). `@Element1`, `@Element2` |
| **Keep Audio** | ✅ Yes (default: true) — preserve original video audio |
| **Native Audio Gen** | ❌ Not available (keep or discard original only) |
| **Multi-Shot** | ❌ Not available |
| **Output Format** | MP4 (`video/mp4`) |

### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `prompt` | string | ✅ Yes | — | Max 2500 chars | Describe edits. Reference video as `@Video1` |
| `video_url` | string | ✅ Yes | — | .mp4/.mov, 3-10.05s, 720-2160px, 24-60 FPS, max 200MB | Source video to edit |
| `image_urls` | string[] | Optional | — | Max 10MB each, min 300×300px, aspect ratio 0.4–2.5. Max 4 total with elements | Style/appearance refs. `@Image1`, `@Image2` |
| `elements` | `KlingV3ImageElementInput[]` | Optional | — | Image-only (frontal + 1-3 reference angles) | Characters/objects to insert. `@Element1`, `@Element2` |
| `keep_audio` | boolean | Optional | true | — | Keep original video's audio track |
| `shot_type` | enum string | Optional | "customize" | Only "customize" | — |

### Element Input Schema (`KlingV3ImageElementInput`)

**Image-only** — no video elements allowed (unlike v3/O3 I2V `KlingV3ComboElementInput`).

| Parameter | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| `frontal_image_url` | string | Max 10MB, min 300×300px, aspect ratio 0.4–2.5 | Main view |
| `reference_image_urls` | string[] | 1-3 images, same constraints | Additional angles |

### Queue API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/fal-ai/kling-video/o3/pro/video-to-video/edit` | Submit edit request |
| GET | `.../requests/{request_id}/status` | Poll status |
| GET | `.../requests/{request_id}` | Retrieve result |
| PUT | `.../requests/{request_id}/cancel` | Cancel request |

**Queue Base URL**: `https://queue.fal.run` · **Auth**: `Authorization: Key $FAL_KEY`

### Output Schema

`video.url` (MP4 CDN URL), `video.file_name`, `video.file_size`, `video.content_type`.

### Use Cases

- **Background replacement** — "Change environment to be fully snow as @Image1"
- **Subject swap** — "Replace animal with @Element1"
- **Clothing/appearance changes** — modify character outfits while keeping motion
- **Scene modification** — add/remove objects, change lighting, alter environment
- **Post-production cleanup** — fix or modify generated video after initial render
- **Brand adaptation** — take existing video and restyle for different brands

### When to Use

Use **O3 Pro V2V Edit** as a **post-generation refinement step**. Generate a video with any I2V model first, then use this to make targeted edits without regenerating from scratch. Ideal for "change the background" or "swap this character" workflows where you want to preserve the original motion and timing.

---

## 6. Kling O3 Pro — Video-to-Video Reference

**Model ID**: `fal-ai/kling-video/o3/pro/video-to-video/reference`  
**Endpoint**: `https://fal.run/fal-ai/kling-video/o3/pro/video-to-video/reference`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/kling-video/o3/pro/video-to-video/reference) · [API Docs](https://fal.ai/models/fal-ai/kling-video/o3/pro/video-to-video/reference/api) · [llms.txt](https://fal.ai/models/fal-ai/kling-video/o3/pro/video-to-video/reference/llms.txt)

### Description

**Style transfer + element injection** — takes an existing video and transforms it using reference images for style guidance and elements for character/object insertion. Unlike V2V Edit (which makes targeted modifications), this **re-renders the entire video** in a new style while maintaining motion structure. Supports aspect ratio override and duration control.

### Pricing

| Mode | Cost per second | 5s cost | 10s cost |
|------|----------------|---------|----------|
| **Flat rate** | $0.336 | $1.68 | $3.36 |

> Same pricing as V2V Edit.

### Capabilities

| Feature | Details |
|---------|---------|
| **Input Video** | ✅ Required — .mp4/.mov, 3-10s, 720-2160px, 24-60 FPS, max 200MB |
| **Duration** | ✅ Configurable, 3-15s (can extend beyond input video length) |
| **Aspect Ratios** | ✅ "auto", 16:9, 9:16, 1:1 (includes "auto" — unique to this model) |
| **Negative Prompt** | ❌ Not available |
| **CFG Scale** | ❌ Not available |
| **Reference Images** | ✅ Yes (`image_urls`) — `@Image1`, `@Image2`. Max 4 total (elements + refs) |
| **Elements (Consistency)** | ✅ Yes — image-only (`KlingV3ImageElementInput`). `@Element1`, `@Element2` |
| **Keep Audio** | ✅ Yes (default: true) — preserve original video audio |
| **Native Audio Gen** | ❌ Not available |
| **Multi-Shot** | ❌ Not available |
| **Output Format** | MP4 (`video/mp4`) |

### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `prompt` | string | ✅ Yes | — | Max 2500 chars | Describe transformation. `@Video1`, `@Image1`, `@Element1` |
| `video_url` | string | ✅ Yes | — | .mp4/.mov, 3-10.05s, 720-2160px, 24-60 FPS, max 200MB | Source video |
| `image_urls` | string[] | Optional | — | Max 10MB each, min 300×300px, aspect ratio 0.4–2.5. Max 4 total with elements | Style refs. "watercolor style of @Image1" |
| `elements` | `KlingV3ImageElementInput[]` | Optional | — | Image-only (frontal + 1-3 refs) | Characters/objects. `@Element1` |
| `keep_audio` | boolean | Optional | true | — | Keep original audio |
| `aspect_ratio` | enum string | Optional | "auto" | **"auto"**, "16:9", "9:16", "1:1" | ⚠️ Includes "auto" (unique to this model) |
| `duration` | enum string | Optional | — | "3"–"15" | ⚠️ No default — inferred from input if omitted. Can extend beyond input length |
| `shot_type` | enum string | Optional | "customize" | Only "customize" | — |

### Element Input Schema

Same as V2V Edit — `KlingV3ImageElementInput` (image-only, no video elements).

### Queue API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/fal-ai/kling-video/o3/pro/video-to-video/reference` | Submit request |
| GET | `.../requests/{request_id}/status` | Poll status |
| GET | `.../requests/{request_id}` | Retrieve result |
| PUT | `.../requests/{request_id}/cancel` | Cancel request |

**Queue Base URL**: `https://queue.fal.run` · **Auth**: `Authorization: Key $FAL_KEY`

### Output Schema

`video.url` (MP4 CDN URL), `video.file_name`, `video.file_size`, `video.content_type`.

### Use Cases

- **Style transfer** — "Style video following watercolor style of @Image1"
- **Character injection** — "Integrate @Element1 in the scene"
- **Artistic remixing** — transform realistic video into anime/cartoon/oil painting style
- **Brand restyling** — take one video, restyle to match different brand aesthetics
- **Aspect ratio conversion** — re-render a 16:9 video as 9:16 for vertical social
- **Duration extension** — stretch a 5s video to 10s with generated continuation

### When to Use

Use **O3 Pro V2V Reference** when you want to **restyle an entire video** — not just make targeted edits (use V2V Edit for that), but transform the whole visual language. Best for artistic style transfer, brand restyling, and format adaptation (aspect ratio changes).

### ⚠️ Key Differences: V2V Edit vs V2V Reference

| Feature | V2V Edit | V2V Reference |
|---------|----------|---------------|
| **Purpose** | Targeted modifications | Full style transformation |
| **Duration** | ❌ Matches input | ✅ Configurable (3-15s, can extend) |
| **Aspect Ratio** | ❌ Matches input | ✅ auto, 16:9, 9:16, 1:1 |
| **Typical prompt** | "Change background to snow" | "Style as watercolor of @Image1" |
| **Pricing** | $0.336/s | $0.336/s |
| **Elements** | ✅ Image-only | ✅ Image-only |
| **Reference images** | ✅ | ✅ |
| **Keep audio** | ✅ (default ON) | ✅ (default ON) |

---

## 7. Kling O3 Standard — Image-to-Video

**Model ID**: `fal-ai/kling-video/o3/standard/image-to-video`  
**Endpoint**: `https://fal.run/fal-ai/kling-video/o3/standard/image-to-video`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/kling-video/o3/standard/image-to-video) · [API Docs](https://fal.ai/models/fal-ai/kling-video/o3/standard/image-to-video/api) · [llms.txt](https://fal.ai/models/fal-ai/kling-video/o3/standard/image-to-video/llms.txt)

### Description

Standard-tier version of O3 Pro I2V. Animates the transition between a start frame and optional end frame while following text-driven style and scene guidance. Same lean API surface as O3 Pro I2V — no elements, no voice control, no negative prompt, no CFG scale, no aspect ratio — but at ~25% lower cost (audio off). Supports multi-shot prompting and native audio generation.

### Pricing

| Mode | Cost per second | 5s cost | 10s cost | 15s cost |
|------|----------------|---------|----------|----------|
| **Audio off** | $0.168 | $0.84 | $1.68 | $2.52 |
| **Audio on** | $0.224 | $1.12 | $2.24 | $3.36 |

> Same per-second cost as v3 Standard (audio off). Audio is cheaper than O3 Pro ($0.224 vs $0.280). No voice control option.

### Capabilities

| Feature | Details |
|---------|---------|
| **Duration** | 3–15 seconds |
| **Aspect Ratios** | ❌ Not configurable (inherits from input image) |
| **Negative Prompt** | ❌ Not available |
| **CFG Scale** | ❌ Not available |
| **Start Image** | ✅ Required (`image_url` — note: different param name than v3) |
| **End Image** | ✅ Optional (`end_image_url`) |
| **Native Audio** | ✅ Yes (default: **off**) |
| **Voice Control** | ❌ Not available |
| **Multi-Shot** | ✅ Yes — `multi_prompt` for labeled multi-shot sequences |
| **Elements (Consistency)** | ❌ Not available |
| **Output Format** | MP4 (`video/mp4`) |

### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `image_url` | string | ✅ Yes | — | Max 10MB, min 300×300px, aspect ratio 0.4–2.5 | ⚠️ Param name is `image_url` (not `start_image_url`) |
| `prompt` | string | Optional | — | Max 2500 chars | Either `prompt` or `multi_prompt`, not both |
| `multi_prompt` | `KlingV3MultiPromptElement[]` | Optional | — | Each: `prompt` (required) + `duration` (3-15s) | Multi-shot sequences |
| `duration` | enum string | Optional | "5" | "3"–"15" | Video duration in seconds |
| `generate_audio` | boolean | Optional | **false** | — | ⚠️ Default is OFF (same as O3 Pro I2V) |
| `end_image_url` | string | Optional | — | Max 10MB, min 300×300px, aspect ratio 0.4–2.5 | End frame for transition |
| `shot_type` | enum string | Optional | "customize" | Only "customize" | Required when `multi_prompt` is provided |

### Queue API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/fal-ai/kling-video/o3/standard/image-to-video` | Submit generation request |
| GET | `.../requests/{request_id}/status` | Poll status |
| GET | `.../requests/{request_id}` | Retrieve completed result |
| PUT | `.../requests/{request_id}/cancel` | Cancel queued request |

**Queue Base URL**: `https://queue.fal.run`  
**Auth**: `Authorization: Key $FAL_KEY`

### Output Schema

Identical structure — `video.url` (MP4 CDN URL), `video.file_name`, `video.file_size`, `video.content_type`.

### Use Cases

- **Budget storyboard-first creation** — structured multi-shot narratives at Standard pricing
- **Start/end frame animation** — same precise control as O3 Pro I2V at lower cost
- **Cost-effective audio** — cheapest O3 audio at $0.224/s (vs O3 Pro $0.280/s)
- **Simple API integration** — fewer parameters, less complexity
- **Iterative exploration** — try many variations before committing to Pro render

### When to Use

Use **O3 Standard I2V** when you want storyboard-first generation with start/end frame control at the lowest O3 price point, and you don't need elements, voice control, or reference images. Identical API surface to O3 Pro I2V — switch between them by changing only the endpoint path. Choose O3 Pro I2V for maximum quality, O3 Standard I2V for volume/iteration.

### ⚠️ Key Differences from O3 Pro I2V

| Feature | O3 Pro I2V | O3 Standard I2V |
|---------|------------|-----------------|
| Cost/s (audio off) | $0.224 | **$0.168** (25% cheaper) |
| Cost/s (audio on) | $0.280 | **$0.224** (20% cheaper) |
| 5s cost (audio on) | $1.40 | **$1.12** |
| Quality tier | Pro | Standard |
| API surface | Identical | Identical |
| Param names | `image_url` | `image_url` |
| Audio default | OFF | OFF |
| Elements | ❌ No | ❌ No |
| Aspect ratio | ❌ No | ❌ No |

---

## 8. Kling O3 Standard — Reference-to-Video

**Model ID**: `fal-ai/kling-video/o3/standard/reference-to-video`  
**Endpoint**: `https://fal.run/fal-ai/kling-video/o3/standard/reference-to-video`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/kling-video/o3/standard/reference-to-video) · [API Docs](https://fal.ai/models/fal-ai/kling-video/o3/standard/reference-to-video/api) · [llms.txt](https://fal.ai/models/fal-ai/kling-video/o3/standard/reference-to-video/llms.txt)

### Description

Standard-tier version of O3 Pro Ref2V. Transforms images, elements, and text into consistent, high-quality video scenes, ensuring stable character identity, object details, and environments. Accepts **reference images** (`image_urls`) for style/appearance guidance, supports elements with `KlingV3ComboElementInput` (image + video), and offers aspect ratio control. Start image is optional — can generate purely from references, elements, and prompts. Same feature set as O3 Pro Ref2V at ~25% lower cost.

### Pricing

| Mode | Cost per second | 5s cost | 10s cost | 15s cost |
|------|----------------|---------|----------|----------|
| **Audio off** | $0.168 | $0.84 | $1.68 | $2.52 |
| **Audio on** | $0.224 | $1.12 | $2.24 | $3.36 |

> Same pricing as O3 Standard I2V. ~25% cheaper than O3 Pro Ref2V (audio off).

### Capabilities

| Feature | Details |
|---------|---------|
| **Duration** | 3–15 seconds |
| **Aspect Ratios** | ✅ 16:9, 9:16, 1:1 |
| **Negative Prompt** | ❌ Not available |
| **CFG Scale** | ❌ Not available |
| **Start Image** | ✅ Optional (`start_image_url`) — not required |
| **End Image** | ✅ Optional (`end_image_url`) |
| **Reference Images** | ✅ Yes (`image_urls`) — style/appearance refs, `@Image1`, `@Image2` etc. Max 4 total (elements + refs) when using video |
| **Native Audio** | ✅ Yes (default: **off**) |
| **Voice Control** | ❌ Not available |
| **Multi-Shot** | ✅ Yes — `multi_prompt` for labeled multi-shot sequences |
| **Elements (Consistency)** | ✅ Yes — characters/objects via frontal + reference images or video. Reference as `@Element1`, `@Element2` |
| **Output Format** | MP4 (`video/mp4`) |

### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `prompt` | string | Optional | — | Max 2500 chars | Either `prompt` or `multi_prompt`, not both |
| `multi_prompt` | `KlingV3MultiPromptElement[]` | Optional | — | Each: `prompt` (required) + `duration` (3-15s) | Multi-shot sequences |
| `start_image_url` | string | Optional | — | Max 10MB, min 300×300px, aspect ratio 0.4–2.5 | ⚠️ Optional (not required like I2V models) |
| `end_image_url` | string | Optional | — | Max 10MB, min 300×300px, aspect ratio 0.4–2.5 | End frame |
| `image_urls` | string[] | Optional | — | Max 10MB each, min 300×300px, aspect ratio 0.4–2.5 | Reference images for style. `@Image1`, `@Image2` in prompt. Max 4 total with elements when video used |
| `elements` | `KlingV3ComboElementInput[]` | Optional | — | See v3 Pro element schema | Characters/objects. `@Element1`, `@Element2` in prompt |
| `generate_audio` | boolean | Optional | **false** | — | Default OFF |
| `duration` | enum string | Optional | "5" | "3"–"15" | Video duration |
| `shot_type` | enum string | Optional | "customize" | Only "customize" | For multi-shot |
| `aspect_ratio` | enum string | Optional | "16:9" | "16:9", "9:16", "1:1" | Video frame ratio |

### Element Input Schema (`KlingV3ComboElementInput`)

Same as O3 Pro Ref2V / v3 Pro — image-based (frontal + 1-3 reference angles) OR video-based (max 1 video, 200MB, 720-2160px, 3-10s, 24-60 FPS).

### Queue API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/fal-ai/kling-video/o3/standard/reference-to-video` | Submit generation request |
| GET | `.../requests/{request_id}/status` | Poll status |
| GET | `.../requests/{request_id}` | Retrieve completed result |
| PUT | `.../requests/{request_id}/cancel` | Cancel queued request |

**Queue Base URL**: `https://queue.fal.run`  
**Auth**: `Authorization: Key $FAL_KEY`

### Output Schema

Identical structure — `video.url` (MP4 CDN URL), `video.file_name`, `video.file_size`, `video.content_type`.

### Use Cases

- **Budget style-guided generation** — reference images for consistent look/feel at Standard pricing
- **Character consistency at scale** — elements keep characters stable across many variations
- **Brand campaigns (volume)** — same brand references, more output per budget
- **Visual continuity** — start image optional; generate purely from references + elements + prompt
- **Exploration before Pro** — test style/element combos before committing to Pro render

### When to Use

Use **O3 Standard Ref2V** when you need reference-image style guidance and/or element consistency at the lowest O3 price point. Identical feature set to O3 Pro Ref2V — same reference images, same elements, same aspect ratio control, same optional start image. Choose O3 Pro Ref2V for maximum quality, O3 Standard Ref2V for volume, iteration, and budget-conscious production.

### ⚠️ Key Differences from O3 Pro Ref2V

| Feature | O3 Pro Ref2V | O3 Standard Ref2V |
|---------|--------------|-------------------|
| Cost/s (audio off) | $0.224 | **$0.168** (25% cheaper) |
| Cost/s (audio on) | $0.280 | **$0.224** (20% cheaper) |
| 5s cost (audio on) | $1.40 | **$1.12** |
| Quality tier | Pro | Standard |
| API surface | Identical | Identical |
| Start image | Optional | Optional |
| Reference images | ✅ | ✅ |
| Elements | ✅ img+vid | ✅ img+vid |
| Aspect ratio | ✅ 16:9, 9:16, 1:1 | ✅ 16:9, 9:16, 1:1 |
| Audio default | OFF | OFF |

---

## 9. Kling O3 Standard — Video-to-Video Edit

**Model ID**: `fal-ai/kling-video/o3/standard/video-to-video/edit`  
**Endpoint**: `https://fal.run/fal-ai/kling-video/o3/standard/video-to-video/edit`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/kling-video/o3/standard/video-to-video/edit) · [API Docs](https://fal.ai/models/fal-ai/kling-video/o3/standard/video-to-video/edit/api) · [llms.txt](https://fal.ai/models/fal-ai/kling-video/o3/standard/video-to-video/edit/llms.txt)

### Description

Standard-tier version of O3 Pro V2V Edit. Takes an existing video and modifies it according to prompt instructions — change backgrounds, swap subjects, modify clothing, insert/remove elements while preserving original video structure and motion. Can keep original audio. Uses image-only elements (`KlingV3ImageElementInput`). Same API surface as O3 Pro V2V Edit at ~25% lower cost.

### Pricing

| Mode | Cost per second | 5s cost | 10s cost |
|------|----------------|---------|----------|
| **Flat rate** | $0.252 | $1.26 | $2.52 |

> 25% cheaper than O3 Pro V2V Edit ($0.336/s). Single flat rate — no audio on/off pricing.

### Capabilities

| Feature | Details |
|---------|---------|
| **Input Video** | ✅ Required — .mp4/.mov, 3-10s, 720-2160px, 24-60 FPS, max 200MB |
| **Duration** | ❌ Not configurable (output matches input video duration) |
| **Aspect Ratios** | ❌ Not configurable (matches input video) |
| **Negative Prompt** | ❌ Not available |
| **CFG Scale** | ❌ Not available |
| **Reference Images** | ✅ Yes (`image_urls`) — `@Image1`, `@Image2`. Max 4 total (elements + refs) |
| **Elements (Consistency)** | ✅ Yes — image-only (`KlingV3ImageElementInput`, no video elements). `@Element1`, `@Element2` |
| **Keep Audio** | ✅ Yes (default: true) — preserve original video audio |
| **Native Audio Gen** | ❌ Not available (keep or discard original only) |
| **Multi-Shot** | ❌ Not available |
| **Output Format** | MP4 (`video/mp4`) |

### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `prompt` | string | ✅ Yes | — | Max 2500 chars | Describe edits. Reference video as `@Video1` |
| `video_url` | string | ✅ Yes | — | .mp4/.mov, 3-10.05s, 720-2160px, 24-60 FPS, max 200MB | Source video to edit |
| `image_urls` | string[] | Optional | — | Max 10MB each, min 300×300px, aspect ratio 0.4–2.5. Max 4 total with elements | Style/appearance refs. `@Image1`, `@Image2` |
| `elements` | `KlingV3ImageElementInput[]` | Optional | — | Image-only (frontal + 1-3 reference angles) | Characters/objects to insert. `@Element1`, `@Element2` |
| `keep_audio` | boolean | Optional | true | — | Keep original video's audio track |
| `shot_type` | enum string | Optional | "customize" | Only "customize" | — |

### Element Input Schema (`KlingV3ImageElementInput`)

Same as O3 Pro V2V Edit — **image-only**, no video elements allowed.

| Parameter | Type | Constraints | Notes |
|-----------|------|-------------|-------|
| `frontal_image_url` | string | Max 10MB, min 300×300px, aspect ratio 0.4–2.5 | Main view |
| `reference_image_urls` | string[] | 1-3 images, same constraints | Additional angles |

### Queue API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/fal-ai/kling-video/o3/standard/video-to-video/edit` | Submit edit request |
| GET | `.../requests/{request_id}/status` | Poll status |
| GET | `.../requests/{request_id}` | Retrieve result |
| PUT | `.../requests/{request_id}/cancel` | Cancel request |

**Queue Base URL**: `https://queue.fal.run` · **Auth**: `Authorization: Key $FAL_KEY`

### Output Schema

`video.url` (MP4 CDN URL), `video.file_name`, `video.file_size`, `video.content_type`.

### Use Cases

- **Budget background replacement** — "Change environment to snow as @Image1" at Standard pricing
- **Subject swap (volume)** — swap characters across many clips without Pro cost
- **Iterative editing** — try multiple edit variations before committing to Pro
- **Post-production cleanup** — fix or modify generated video at lower cost
- **Brand adaptation (batch)** — restyle existing videos for different brands at scale

### When to Use

Use **O3 Standard V2V Edit** as a **budget post-generation refinement step**. Same targeted editing capabilities as O3 Pro V2V Edit — swap backgrounds, characters, objects — but at 25% lower cost. Ideal for iteration and batch workflows where you'll make multiple edit passes.

### ⚠️ Key Differences from O3 Pro V2V Edit

| Feature | O3 Pro V2V Edit | O3 Standard V2V Edit |
|---------|-----------------|----------------------|
| Cost/s | $0.336 | **$0.252** (25% cheaper) |
| 5s cost | $1.68 | **$1.26** |
| Quality tier | Pro | Standard |
| API surface | Identical | Identical |
| Elements | ✅ img-only | ✅ img-only |
| Reference images | ✅ | ✅ |
| Keep audio | ✅ (default ON) | ✅ (default ON) |
| Duration | ❌ Matches input | ❌ Matches input |
| Aspect ratio | ❌ Matches input | ❌ Matches input |

---

## 10. Kling O3 Standard — Video-to-Video Reference

**Model ID**: `fal-ai/kling-video/o3/standard/video-to-video/reference`  
**Endpoint**: `https://fal.run/fal-ai/kling-video/o3/standard/video-to-video/reference`  
**FAL URL**: [Playground](https://fal.ai/models/fal-ai/kling-video/o3/standard/video-to-video/reference) · [API Docs](https://fal.ai/models/fal-ai/kling-video/o3/standard/video-to-video/reference/api) · [llms.txt](https://fal.ai/models/fal-ai/kling-video/o3/standard/video-to-video/reference/llms.txt)

### Description

Standard-tier version of O3 Pro V2V Reference. Generates new shots guided by an input reference video, preserving cinematic language such as motion and camera style to produce seamless scene continuity. Re-renders the entire video in a new style while maintaining motion structure. Supports aspect ratio override (including "auto"), duration control, reference images for style, and image-only elements. Same feature set as O3 Pro V2V Reference at ~25% lower cost.

### Pricing

| Mode | Cost per second | 5s cost | 10s cost |
|------|----------------|---------|----------|
| **Flat rate** | $0.252 | $1.26 | $2.52 |

> 25% cheaper than O3 Pro V2V Reference ($0.336/s). Same pricing as O3 Standard V2V Edit.

### Capabilities

| Feature | Details |
|---------|---------|
| **Input Video** | ✅ Required — .mp4/.mov, 3-10s, 720-2160px, 24-60 FPS, max 200MB |
| **Duration** | ✅ Configurable, 3-15s (can extend beyond input video length) |
| **Aspect Ratios** | ✅ "auto", 16:9, 9:16, 1:1 (includes "auto" — same as Pro) |
| **Negative Prompt** | ❌ Not available |
| **CFG Scale** | ❌ Not available |
| **Reference Images** | ✅ Yes (`image_urls`) — `@Image1`, `@Image2`. Max 4 total (elements + refs) |
| **Elements (Consistency)** | ✅ Yes — image-only (`KlingV3ImageElementInput`). `@Element1`, `@Element2` |
| **Keep Audio** | ✅ Yes (default: true) — preserve original video audio |
| **Native Audio Gen** | ❌ Not available |
| **Multi-Shot** | ❌ Not available |
| **Output Format** | MP4 (`video/mp4`) |

### Input Parameters

| Parameter | Type | Required | Default | Constraints | Notes |
|-----------|------|----------|---------|-------------|-------|
| `prompt` | string | ✅ Yes | — | Max 2500 chars | Describe transformation. `@Video1`, `@Image1`, `@Element1` |
| `video_url` | string | ✅ Yes | — | .mp4/.mov, 3-10.05s, 720-2160px, 24-60 FPS, max 200MB | Source video |
| `image_urls` | string[] | Optional | — | Max 10MB each, min 300×300px, aspect ratio 0.4–2.5. Max 4 total with elements | Style refs. "watercolor style of @Image1" |
| `elements` | `KlingV3ImageElementInput[]` | Optional | — | Image-only (frontal + 1-3 refs) | Characters/objects. `@Element1` |
| `keep_audio` | boolean | Optional | true | — | Keep original audio |
| `aspect_ratio` | enum string | Optional | "auto" | **"auto"**, "16:9", "9:16", "1:1" | ⚠️ Includes "auto" (same as Pro V2V Ref) |
| `duration` | enum string | Optional | — | "3"–"15" | ⚠️ No default — inferred from input if omitted. Can extend beyond input length |
| `shot_type` | enum string | Optional | "customize" | Only "customize" | — |

### Element Input Schema

Same as O3 Pro V2V Reference — `KlingV3ImageElementInput` (image-only, no video elements).

### Queue API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/fal-ai/kling-video/o3/standard/video-to-video/reference` | Submit request |
| GET | `.../requests/{request_id}/status` | Poll status |
| GET | `.../requests/{request_id}` | Retrieve result |
| PUT | `.../requests/{request_id}/cancel` | Cancel request |

**Queue Base URL**: `https://queue.fal.run` · **Auth**: `Authorization: Key $FAL_KEY`

### Output Schema

`video.url` (MP4 CDN URL), `video.file_name`, `video.file_size`, `video.content_type`.

### Use Cases

- **Budget style transfer** — transform realistic video into anime/cartoon/oil painting at Standard pricing
- **Character injection (volume)** — swap characters across many clips at lower cost
- **Artistic remixing at scale** — batch-restyle videos for different brand aesthetics
- **Aspect ratio conversion (budget)** — re-render 16:9 → 9:16 for vertical social at Standard cost
- **Duration extension (budget)** — stretch a 5s video to 10s with generated continuation

### When to Use

Use **O3 Standard V2V Reference** when you want to **restyle an entire video** at the lowest V2V price point. Same capabilities as O3 Pro V2V Reference — style transfer, character injection, aspect ratio conversion, duration extension — but at 25% lower cost. Ideal for batch operations, iteration, and budget-conscious post-production.

### ⚠️ Key Differences from O3 Pro V2V Reference

| Feature | O3 Pro V2V Ref | O3 Standard V2V Ref |
|---------|----------------|---------------------|
| Cost/s | $0.336 | **$0.252** (25% cheaper) |
| 5s cost | $1.68 | **$1.26** |
| Quality tier | Pro | Standard |
| API surface | Identical | Identical |
| Duration | ✅ 3-15s | ✅ 3-15s |
| Aspect ratio | auto, 16:9, 9:16, 1:1 | auto, 16:9, 9:16, 1:1 |
| Elements | ✅ img-only | ✅ img-only |
| Reference images | ✅ | ✅ |
| Keep audio | ✅ (default ON) | ✅ (default ON) |

### ⚠️ Key Differences: V2V Edit vs V2V Reference (Standard)

| Feature | Std V2V Edit | Std V2V Reference |
|---------|--------------|-------------------|
| **Purpose** | Targeted modifications | Full style transformation |
| **Duration** | ❌ Matches input | ✅ Configurable (3-15s, can extend) |
| **Aspect Ratio** | ❌ Matches input | ✅ auto, 16:9, 9:16, 1:1 |
| **Typical prompt** | "Change background to snow" | "Style as watercolor of @Image1" |
| **Pricing** | $0.252/s | $0.252/s |
| **Elements** | ✅ Image-only | ✅ Image-only |
| **Reference images** | ✅ | ✅ |
| **Keep audio** | ✅ (default ON) | ✅ (default ON) |

---

## Comparison: All 10 Models

| Feature | v3 Pro | v3 Std | O3 Pro I2V | O3 Pro Ref2V | O3 Std I2V | O3 Std Ref2V | O3 Pro V2V Edit | O3 Pro V2V Ref | O3 Std V2V Edit | O3 Std V2V Ref |
|---------|--------|--------|------------|--------------|------------|--------------|-----------------|----------------|-----------------|----------------|
| **Type** | Image→Video | Image→Video | Image→Video | Image→Video | Image→Video | Image→Video | Video→Video | Video→Video | Video→Video | Video→Video |
| **5s cost (audio off)** | $1.12 | $0.84 | $1.12 | $1.12 | $0.84 | $0.84 | $1.68 (flat) | $1.68 (flat) | $1.26 (flat) | $1.26 (flat) |
| **5s cost (audio on)** | $1.68 | $1.26 | $1.40 | $1.40 | $1.12 | $1.12 | — | — | — | — |
| **5s cost (voice ctrl)** | $1.96 | $1.54 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Input** | Image (req) | Image (req) | Image (req) | Image (opt) | Image (req) | Image (opt) | Video (req) | Video (req) | Video (req) | Video (req) |
| **Duration** | 3-15s | 3-15s | 3-15s | 3-15s | 3-15s | 3-15s | ❌ Matches input | ✅ 3-15s | ❌ Matches input | ✅ 3-15s |
| **Aspect Ratios** | 16:9, 9:16, 1:1 | 16:9, 9:16, 1:1 | ❌ | 16:9, 9:16, 1:1 | ❌ | 16:9, 9:16, 1:1 | ❌ | auto, 16:9, 9:16, 1:1 | ❌ | auto, 16:9, 9:16, 1:1 |
| **Multi-Shot** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Native Audio** | ✅ (ON) | ✅ (ON) | ✅ (OFF) | ✅ (OFF) | ✅ (OFF) | ✅ (OFF) | ❌ | ❌ | ❌ | ❌ |
| **Keep Audio** | — | — | — | — | — | — | ✅ (ON) | ✅ (ON) | ✅ (ON) | ✅ (ON) |
| **Voice Control** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Elements** | ✅ img+vid | ✅ img+vid | ❌ | ✅ img+vid | ❌ | ✅ img+vid | ✅ img-only | ✅ img-only | ✅ img-only | ✅ img-only |
| **Reference Images** | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **End Image** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| **Negative Prompt** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **CFG Scale** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Recommendation for MyShortReel

| Scenario | Model | Why |
|----------|-------|-----|
| **Default generation** | v3 Standard | Cheapest, full feature set |
| **User upgrades / "HD" toggle** | v3 Pro | Highest quality + all features |
| **Demo / VC presentations** | v3 Pro | Maximum visual impact |
| **Batch variations / exploration** | v3 Standard | ~25% cheaper for volume |
| **Dialogue scenes / voice acting** | v3 Pro or v3 Standard | Only models with voice control |
| **Storyboard-first (no elements needed)** | O3 Pro I2V | Simpler API, cheaper audio |
| **Storyboard-first (budget)** | O3 Standard I2V | Same API as O3 Pro I2V, 25% cheaper |
| **Style-guided / brand campaigns** | O3 Pro Ref2V | Reference images for style consistency |
| **Style-guided (volume / iteration)** | O3 Standard Ref2V | Same features as O3 Pro Ref2V, 25% cheaper |
| **Character consistency + style refs** | O3 Pro Ref2V | Elements + reference images combined |
| **Character consistency (budget)** | O3 Standard Ref2V | Elements + refs at Standard pricing |
| **No start image (prompt-only + refs)** | O3 Std/Pro Ref2V | Only models where start image is optional |
| **Post-gen edits (premium)** | O3 Pro V2V Edit | Targeted modifications, highest V2V quality |
| **Post-gen edits (budget/batch)** | O3 Std V2V Edit | Same edit capabilities, 25% cheaper |
| **Style transfer (premium)** | O3 Pro V2V Reference | Re-renders entire video in new style |
| **Style transfer (budget/batch)** | O3 Std V2V Reference | Same style transfer, 25% cheaper |
| **Aspect ratio conversion (16:9→9:16)** | O3 Std/Pro V2V Ref | Only V2V models with aspect ratio control |
| **Extend video duration** | O3 Std/Pro V2V Ref | Can output longer than input (up to 15s) |

---

## Prompting Guide & Best Practices

> Source: [Kling 3.0 Prompting Guide](https://blog.fal.ai/kling-3-0-prompting-guide/) · [Kling 3.0 Announcement](https://blog.fal.ai/kling-3-0-is-now-available-on-fal/) (FAL.ai Blog, Feb 4-5, 2026)

### Core Principle

Kling 3.0 is designed to understand **cinematic intent**, not just visual descriptions. Prompts should read like **directions to a scene** rather than a list of objects. Clear structure, explicit motion, and intentional shot language produce noticeably better results.

### 1. Think in Shots, Not Clips

Multi-shot generation supports up to **6 shots** in a single output. Prompts should:

- **Label shots explicitly** — describe each shot's framing, subject, and motion separately
- Use **cinematic language** — profile shots, macro close-ups, tracking shots, POV, shot-reverse-shot
- Let the model vary camera angles automatically while maintaining narrative continuity

**Example (multi-shot prompt structure):**
```
Master Prompt: Joker begins his iconic dance descent down the stairs.

Multi shot Prompt 1: Man in red suit starts dancing at top of stairs, 
taking first exaggerated steps down, arms spreading wide, head tilting 
back in ecstasy, cigarette smoke trailing (Duration: 5 seconds)

Multi shot Prompt 2: Continuing wild dance down concrete steps, spinning 
and kicking, coat flapping dramatically, pure liberation and madness, 
reaching the bottom with triumphant pose (Duration: 5 seconds)
```

### 2. Anchor Subjects Early for Consistency

Define core subjects **clearly at the beginning** of the prompt. Keep descriptions consistent across shots.

- Once established, elements remain stable even as the camera moves or scenes evolve
- Critical for multi-character and multi-shot narratives
- Works with text alone, reference images, or image-to-video

### 3. Describe Motion Explicitly

Instead of vague phrasing, describe **how the camera behaves over time**:

- Tracking, following, freezing, panning, or moving in sync with subject
- Long takes work best when the camera's relationship to the subject is clearly defined
- Explicit motion descriptions → fewer artifacts, smoother pacing, more realistic progression

### 4. Use Native Audio Intentionally

When audio is enabled, prompts should explicitly indicate **who is speaking and when**:

- **Structured naming** — `[Character A: Black-suited Agent]` not `[Agent]`
- **Visual anchoring** — describe the action first, then the dialogue
- **Audio details** — assign unique tone/emotion labels: `[Agent, raspy deep voice]`
- **Temporal control** — use linking words: "Immediately," "Pause." to control rhythm

**Multi-Character Dialogue Rules:**

| Principle | Guideline | Correct | Incorrect |
|-----------|-----------|---------|-----------|
| **Structured Naming** | Labels must be unique and consistent | `[Character A: Lead Detective]` | `[Agent] says... Then, he says...` |
| **Visual Anchoring** | Bind dialogue to actions; describe action first | _Agent slams table._ `[Agent, angrily]:` "Where?" | `[Agent]:` "Where?" _(no action context)_ |
| **Audio Details** | Unique tone/emotion per character | `[Agent, raspy deep voice]` | `[Man] says...` _(too vague)_ |
| **Temporal Control** | Linking words control sequence | `"Why?" Immediately, [Assistant]:` "Because..." | Two lines with no transition _(may merge speech)_ |

**Example (dialogue scene):**
```
A sleek interrogation room with cold LED lighting.
Low atmospheric suspense music hums with deep bass drones.

A detective in a navy suit leans forward slowly.
[Character A: Lead Detective, controlled serious voice]: "Let's stop pretending."

Immediately, the suspect shifts in their chair, tense.
[Character B: Prime Suspect, sharp defensive voice]: "I already told you everything."

The detective slides a folder across the table. Paper scraping sound.
[Lead Detective, calm but threatening tone]: "Then explain why your fingerprints are here."
```

### 5. Take Advantage of Longer Durations (up to 15s)

- Describe **progression over time** — how actions unfold, how the camera reacts, how scenes transition
- Enables continuous storytelling rather than fragmented assembly
- Long takes, multi-beat performances, and evolving scenes all work in a single generation

### 6. Image-to-Video: Lock First, Then Move

When using I2V, treat the input image as an **anchor**:

- Focus prompts on how the scene **evolves from** the image
- Describe subtle movements, camera motion, or environmental changes
- The model preserves text, signage, and visual details from the source image
- Particularly effective for advertising, branded content, and realistic scene extensions

### Model Quality Improvements (v3 / O3 vs Previous Generations)

| Area | Improvement |
|------|-------------|
| **Realistic Acting** | Natural facial motion, better-timed dialogue pacing, convincing gestures, smoother body language |
| **Voice Control** | Consistent voice-to-subject matching, improved tonality, natural dialogue speed |
| **Motion Control** | Cleaner fast-paced motion, fewer warping artifacts during rapid movement/camera shifts |
| **Video Editing** | Stronger reference video support for changing backgrounds, modifying clothing, inserting/removing subjects |
| **Image Generation** | Sharper outputs up to 4K, stronger prompt adherence, improved face consistency |

### Implications for MyShortReel's Cinematography Prompt Studio

These prompting principles directly inform the **Cinema Prompt Engineering** engine design:

1. **Shot-based prompt architecture** — the Prompt Studio should generate multi-shot `multi_prompt` arrays, not single monolithic prompts
2. **Character registry** — anchor characters with consistent labels and descriptions across shots; map to `elements` for visual consistency
3. **Cinematic vocabulary** — the prompt engine should inject camera/motion language (tracking, dolly, POV) based on user's selected shot type
4. **Audio-aware prompting** — when `generate_audio: true`, the engine must format dialogue with structured character labels, tone descriptors, and temporal linking words
5. **Duration-aware pacing** — longer durations (10-15s) should trigger more detailed progression descriptions; shorter durations (3-5s) should be tighter and more focused
6. **I2V prompt specialization** — when a start image is provided, prompts should describe motion/evolution from the image rather than re-describing what's already visible

---

**Document Status**: Complete — all 10 models documented  
**Models covered**: v3 Pro I2V, v3 Standard I2V, O3 Pro I2V, O3 Pro Ref2V, O3 Pro V2V Edit, O3 Pro V2V Reference, O3 Standard I2V, O3 Standard Ref2V, O3 Standard V2V Edit, O3 Standard V2V Reference

---

**Version**: 1.0  
**Last Updated**: February 10, 2026
