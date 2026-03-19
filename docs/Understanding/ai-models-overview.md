# 🤖 AI Models Overview - MyShortReel

**Last Updated**: December 19, 2025

This document provides a comprehensive reference for all AI models used in MyShortReel, including official documentation links, pricing, and use cases.

---

## Table of Contents

1. [Text Generation - OpenAI GPT-4o-mini](#1-text-generation---openai-gpt-4o-mini)
2. [Image Generation - Text to Image](#2-image-generation---text-to-image)
   - [Primary: Nano Banana Pro (Google Gemini 3 Pro Image)](#21-primary-model-nano-banana-pro-google-gemini-3-pro-image)
   - [Fallback: ByteDance Seedream v4](#22-fallback-model-bytedance-seedream-v4-text-to-image)
3. [Image Editing - Image to Image](#3-image-editing---image-to-image)
   - [Primary: Nano Banana Pro Edit (Google Gemini 3 Pro Image Edit)](#31-primary-model-nano-banana-pro-edit-google-gemini-3-pro-image-edit)
   - [Fallback: ByteDance Seedream v4 Edit](#32-fallback-model-bytedance-seedream-v4-edit)
4. [Video Generation](#4-video-generation)
   - [Primary: Kling Video v2.5 Turbo Pro Image-to-Video](#41-primary-model-kling-video-v25-turbo-pro-image-to-video)
5. [Music Generation](#5-music-generation)
   - [Primary Model: Stable Audio 2.5](#51-primary-model-stable-audio-25)
   - [Fallback Model: MiniMax Music](#52-fallback-model-minimax-music)
6. [Narration (Text-to-Speech)](#6-narration-text-to-speech)
   - [Primary Model: MiniMax Speech 2.6 HD](#61-minimax-speech-26-hd)
   - [Fallback Model: MiniMax Speech 2.6 Turbo](#62-minimax-speech-26-turbo-fallback)
7. [Video Assembly & Final Render (Rendi API)](#7-video-assembly--final-render-rendi-api)
   - [7.1 Professional Audio Mixing](#71-professional-audio-mixing)
   - [7.2 Video Merging with XFADE](#72-video-merging-with-xfade)
   - [7.3 Final Render (A/V Multiplexing)](#73-final-render-av-multiplexing)
8. [fal.ai Platform Overview](#8-falai-platform-overview)
9. [Model Selection Strategy](#9-model-selection-strategy)
10. [Cost Summary](#10-cost-summary)
11. [Quick Reference](#11-quick-reference)
12. [Monthly Scaling Estimations (30s Videos)](#12-monthly-scaling-estimations-30s-videos)
13. [Rendi Plan Capacity Comparison (Processing Only)](#13-rendi-plan-capacity-comparison-processing-only)

---

## **AI Pipeline: Step-by-Step Model Usage**

| Step | Feature | Model | Purpose |
| :--- | :--- | :--- | :--- |
| **Step 1** | **Story Generation** | OpenAI GPT-4o | Generate scene descriptions and storyboard from theme/occasion |
| **Step 2a** | **Prompt Enhancement** | OpenAI GPT-5-mini | Refine user descriptions into detailed AI image prompts |
| **Step 2b** | **Image Generation** | fal-ai/nano-banana-pro | Generate high-quality start/end frames for scenes |
| **Step 2b** | **Image Generation (Fallback)** | fal-ai/bytedance/seedream/v4/text-to-image | Fallback image generation model |
| **Step 3** | **Video Generation** | fal-ai/kling-video/v2.5-turbo/pro/image-to-video | Convert start/end frames into cinematic video clips |
| **Step 4** | **Music Generation** | fal-ai/stable-audio-25/text-to-audio | Generate professional background music tracks |
| **Step 4** | **Narration (TTS)** | fal-ai/minimax/speech-2.6-hd | High-fidelity text-to-speech for scene voiceovers |
| **Step 4** | **Narration (Fallback)** | fal-ai/minimax/speech-2.6-turbo | Faster fallback for text-to-speech |
| **Step 5** | **Audio Mixing** | Rendi API | Sidechain ducking + loudness normalization (-16 LUFS) |
| **Step 5** | **Video Merging** | Rendi API | Concatenate scenes with cinematic **xfade** transitions |
| **Step 5** | **Final Render** | Rendi API | Combine merged video with mixed background audio |

---

## **1. Text Generation - OpenAI GPT-4o-mini**

**Model ID**: `openai/gpt-4o-mini`

**Purpose**: 
- Intelligent AI assistant for story and storyboard generation
- Enhance user descriptions into detailed AI image prompts
- Provide contextual suggestions for video improvements
- Fast, cost-effective reasoning for prompt engineering

**Official Documentation**:
- OpenAI Platform: https://platform.openai.com/docs
- GPT-4o-mini Overview: https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/
- API Reference: https://platform.openai.com/docs/api-reference/chat
- Pricing: https://openai.com/api/pricing/

**Pricing** (as of Dec 2025):
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens
- Average operation: ~1000 tokens = $0.0006

**Key Features**:
- High intelligence at extreme cost efficiency
- 128K context window
- Support for structured output (JSON mode)
- Near-instant response times (<1 second)

**When to Use**:
- Generating scene descriptions from project themes
- Refining image prompts for Step 2b
- All storyboarding logic in Step 1 & 2a

**Integration Method**: Direct fetch calls to OpenAI API (with Together.ai fallback)

---

## **2. Image Generation - Text to Image**

### **2.1 Primary Model: Nano Banana Pro (Google Gemini 3 Pro Image)**

**Model ID**: `fal-ai/nano-banana-pro`

**Purpose**: 
- Generate high-quality frame images from text descriptions
- Create start and end frames for video scenes
- Production-quality visuals with advanced text rendering
- Studio-quality results with semantic understanding

**Official Documentation**:
- Model Page: https://fal.ai/models/fal-ai/nano-banana-pro
- API Documentation: https://fal.ai/models/fal-ai/nano-banana-pro/api
- LLMs.txt: https://fal.ai/models/fal-ai/nano-banana-pro/llms.txt
- OpenAPI Schema: https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/nano-banana-pro

**Pricing**:
- $0.15 per image (~7 generations per $1.00)
- 4K outputs charged at double the standard rate
- Quality-first approach (prioritizes quality over speed)

**Key Features**:
- Built on Google's Gemini 3 Pro foundation
- Multimodal understanding (not just keyword matching)
- Industry-leading text rendering capabilities
- Character consistency for up to 5 people
- Multiple resolutions: 1K, 2K, 4K
- Multiple aspect ratios (21:9, 16:9, 3:2, 4:3, 5:4, 1:1, 4:5, 3:4, 2:3, 9:16)
- SynthID digital watermarking on all outputs
- Published: November 20, 2025

**Input Parameters**:
```typescript
{
  prompt: string              // Text description (max 50,000 chars)
  num_images: number          // 1-4 images per request
  aspect_ratio: string        // "21:9", "16:9", "3:2", "4:3", "5:4", "1:1", "4:5", "3:4", "2:3", "9:16"
  resolution: string          // "1K", "2K", "4K"
  output_format: string       // "jpeg", "png", "webp"
  sync_mode: boolean          // If true, returns data URI
}
```

**When to Use**:
- Primary choice for all text-to-image generation
- Marketing campaign generation
- Product visualization workflows
- Creative content requiring text accuracy
- Infographic and diagram creation

---

### **2.2 Fallback Model: ByteDance Seedream v4 Text-to-Image**

**Model ID**: `fal-ai/bytedance/seedream/v4/text-to-image`

**Purpose**: 
- Fallback when Nano Banana Pro fails or is unavailable
- Cost-effective alternative for high-volume generation
- Fast, consistent, 4K-ready image creation

**Official Documentation**:
- Model Page: https://fal.ai/models/fal-ai/bytedance/seedream/v4/text-to-image
- API Documentation: https://fal.ai/models/fal-ai/bytedance/seedream/v4/text-to-image/api
- LLMs.txt: https://fal.ai/models/fal-ai/bytedance/seedream/v4/text-to-image/llms.txt
- OpenAPI Schema: https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/bytedance/seedream/v4/text-to-image

**Pricing**:
- $0.03 per image
- Very fast generation (1-2 seconds)
- Scales to 4K for production assets

**Key Features**:
- New-generation model from ByteDance
- Integrated generation and editing in single architecture
- Produces 2K images in seconds
- Scales up to 4K resolution
- Excellent consistency across generations
- Cost-effective for high volume

**Input Parameters**:
```typescript
{
  prompt: string              // Text description
  image_size: string          // "landscape_16_9", "portrait_9_16", "square_hd", etc.
  num_inference_steps: number // 20 recommended
  guidance_scale: number      // 7.5 recommended
  num_images: number          // 1-4 images per request
  seed: number                // For reproducibility
}
```

**When to Use**:
- Nano Banana Pro fails or times out
- High-volume batch generation (cost savings)
- Non-critical images where speed > absolute quality
- 4K resolution requirements

---

## **3. Image Editing - Image to Image**

### **3.1 Primary Model: Nano Banana Pro Edit (Google Gemini 3 Pro Image Edit)**

**Model ID**: `fal-ai/nano-banana-pro/edit`

**Purpose**: 
- Edit and transform user-uploaded images
- Maintain consistency with uploaded photos
- Apply style transfers and modifications
- Refine generated images

**Official Documentation**:
- Model Page: https://fal.ai/models/fal-ai/nano-banana-pro/edit
- API Documentation: https://fal.ai/models/fal-ai/nano-banana-pro/edit/api
- LLMs.txt: https://fal.ai/models/fal-ai/nano-banana-pro/edit/llms.txt
- OpenAPI Schema: https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/nano-banana-pro/edit

**Pricing**:
- $0.15 per image
- Quality-first approach

**Key Features**:
- State-of-the-art editing from Google Gemini 3 Pro
- Multimodal understanding for complex edits
- Maintains image consistency
- Multiple editing modes (inpainting, style transfer, etc.)
- High-quality output
- Character consistency preservation

**Input Parameters**:
```typescript
{
  image_url: string           // Source image URL
  prompt: string              // Editing instructions
  aspect_ratio: string        // Output aspect ratio
  num_inference_steps: number // 4 for fast, 8 for quality
  strength: number            // 0.0-1.0, how much to change
  enable_safety_checker: boolean
}
```

**When to Use**:
- User uploads their own photos
- Editing existing generated images
- Applying style changes to uploaded images
- Refining AI-generated frames

---

### **3.2 Fallback Model: ByteDance Seedream v4 Edit**

**Model ID**: `fal-ai/bytedance/seedream/v4/edit`

**Purpose**: 
- Fallback for image editing when Nano Banana Pro Edit fails
- Cost-effective image transformation
- Integrated editing capabilities

**Official Documentation**:
- Model Page: https://fal.ai/models/fal-ai/bytedance/seedream/v4/edit
- API Documentation: https://fal.ai/models/fal-ai/bytedance/seedream/v4/edit/api
- LLMs.txt: https://fal.ai/models/fal-ai/bytedance/seedream/v4/edit/llms.txt
- OpenAPI Schema: https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/bytedance/seedream/v4/edit

**Pricing**:
- $0.03 per image
- Very fast generation (1-2 seconds)

**Key Features**:
- Single architecture for generation and editing
- Fast, consistent results
- Cost-effective
- Good quality output
- Scales to 4K

**Input Parameters**:
```typescript
{
  image_url: string           // Source image URL
  prompt: string              // Editing instructions
  image_size: string          // Output size
  num_inference_steps: number // 20 recommended
  guidance_scale: number      // 7.5 recommended
  strength: number            // 0.0-1.0, how much to change
  seed: number                // For reproducibility
}
```

**When to Use**:
- Nano Banana Pro Edit fails or times out
- High-volume batch editing (cost savings)
- Non-critical edits where speed > absolute quality

---

## **4. Video Generation**

### **4.1 Primary Model: Kling Video v2.5 Turbo Pro Image-to-Video**

**Model ID**: `fal-ai/kling-video/v2.5-turbo/pro/image-to-video`

**Purpose**: 
- Generate high-quality cinematic videos from frame images
- Create smooth transitions between start and end frames
- Professional-grade video generation with enhanced motion fluidity

**Official Documentation**:
- Model Page: https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video
- API Documentation: https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video/api
- LLMs.txt: https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video/llms.txt
- OpenAPI Schema: https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-video/v2.5-turbo/pro/image-to-video

**Pricing**:
- $0.07 per second of video
- 5-second video: $0.35
- 10-second video: $0.70

**Key Features**:
- Enhanced motion fluidity and stability
- Professional camera moves (dolly, pan, tilt, orbit)
- Start and end frame reference support (tail_image_url)
- High-resolution output (1280x768)
- Async generation with queue management

**Input Parameters**:
```typescript
{
  image_url: string           // Start frame image URL
  image_tail_url: string      // End frame image URL (optional)
  prompt: string              // Video description/guidance
  duration: string            // "5" or "10" seconds
  aspect_ratio: string        // "16:9", "9:16", "1:1"
  cfg_scale: number           // Guidance scale (1.0-10.0)
  seed: number                // For reproducibility
}
```

**When to Use**:
- Primary choice for all video generation
- User completes scene setup with start/end frames
- Generating final video output

---

## **5. Music Generation**

### **5.1 Primary Model: Stable Audio 2.5**

**Model ID**: `fal-ai/stable-audio-25/text-to-audio`

**Purpose**: 
- Generate high-quality instrumental background music
- Create custom music tracks from text descriptions
- Professional-grade audio for video soundtracks

**Official Documentation**:
- Model Page: https://fal.ai/models/fal-ai/stable-audio-25/text-to-audio
- API Documentation: https://fal.ai/models/fal-ai/stable-audio-25/text-to-audio/api
- OpenAPI Schema: https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/stable-audio-25/text-to-audio

**Pricing**:
- $0.20 per request (flat rate)
- Any duration up to 190 seconds

**Key Features**:
- High-fidelity audio output (44.1kHz stereo)
- Fast generation (8-10 seconds for a 30s track)
- Up to 190 seconds per generation
- Excellent prompt adherence
- WAV format output

**Input Parameters**:
```typescript
{
  prompt: string              // Music description
  seconds_total: number       // Duration in seconds (max 190)
  num_inference_steps: number // 4-8 steps
  guidance_scale: number      // 1-25 (adherence to prompt)
  seed: number                // For reproducibility
}
```

**When to Use**:
- Primary choice for background music generation
- User wants custom music for their video
- Need professional-grade instrumental tracks
- Specific genre or mood requirements

---

### **5.2 Fallback Model: MiniMax Music**

**Model ID**: `fal-ai/minimax-music`

**Purpose**: 
- Fallback music generation when Stable Audio 2.5 fails
- Cost-effective music generation
- Alternative music styles and quality

**Official Documentation**:
- Model Page: https://fal.ai/models/fal-ai/minimax-music
- API Documentation: https://fal.ai/models/fal-ai/minimax-music/api
- LLMs.txt: https://fal.ai/models/fal-ai/minimax-music/llms.txt

**Pricing**:
- Estimated $0.05-$0.10 per 30-second track
- Cost-effective alternative

**Key Features**:
- Good quality music generation
- Fast generation times
- Multiple genre support
- Cost-effective pricing
- Reliable fallback option

**Input Parameters**:
```typescript
{
  prompt: string              // Music description
  duration: number            // Track duration in seconds
  seed: number                // For reproducibility
}
```

**When to Use**:
- Stable Audio 2.5 fails or times out
- Budget-conscious music generation
- Non-critical background music
- High-volume batch generation

---

## **6. Narration (Text-to-Speech)**

### **6.1 MiniMax Speech 2.6 HD**

**Model ID**: `fal-ai/minimax/speech-2.6-hd`

**Purpose**: 
- Generate high-fidelity natural-sounding narration from text
- Create professional voiceovers for video scenes
- Text-to-speech for scene descriptions

**Official Documentation**:
- Model Page: https://fal.ai/models/fal-ai/minimax/speech-2.6-hd
- API Documentation: https://fal.ai/models/fal-ai/minimax/speech-2.6-hd/api

**Pricing**:
- Estimated $0.02 per 100 words
- Fast generation (1-3 seconds)

**Key Features**:
- Studio-quality audio (44.1kHz, 256kbps stereo)
- Professional voice synthesis with emotional range
- Supports multiple languages and accents
- Automatic loudness normalization (-18 LUFS)

**Input Parameters**:
```typescript
{
  prompt: string              // Text to convert to speech
  voice_setting: {
    voice_id: string          // Voice ID
    speed: number             // 0.5-2.0
    pitch: number             // -12 to 12
    emotion: string           // "neutral", "happy", "sad", etc.
  },
  audio_setting: {
    sample_rate: number       // 44100
    bitrate: number           // 256000
    format: "mp3"
    channel: 2                // Stereo
  }
}
```

**When to Use**:
- Primary choice for all narration needs
- High-quality audio requirements for final video output

---

### **6.2 MiniMax Speech 2.6 Turbo (Fallback)**

**Model ID**: `fal-ai/minimax/speech-2.6-turbo`

**Purpose**: 
- Faster fallback when HD model is unavailable or times out
- Cost-effective text-to-speech alternative

**Key Features**:
- Faster processing times
- Same high-quality stereo output settings as HD model
- Identical API schema for seamless fallback logic

---

## **7. Video Assembly & Final Render (Rendi API)**

**Service Provider**: [Rendi API](https://docs.rendi.dev)  
**Endpoint**: `https://api.rendi.dev/v1/run-ffmpeg-command`

MyShortReel uses Rendi for the entire video assembly phase because it provides full access to FFmpeg filters, enabling professional audio engineering and cinematic transitions that are not possible with simpler APIs.

---

### **7.1 Professional Audio Mixing**

**Purpose**: Combine narration and background music into a single studio-quality track.

**Key Features**:
- **Sidechain Ducking**: Background music automatically lowers its volume when the narrator speaks (`sidechaincompress` filter).
- **Loudness Normalization**: Ensures the final audio meets the **-16 LUFS** industry standard for social media (`loudnorm` filter).
- **Looped Music**: Automatically loops the background music track to match the narration's duration.

**Estimated Cost**: ~$0.03 per operation

---

### **7.2 Video Merging with XFADE**

**Purpose**: Merge the 3 individual scene videos into one continuous clip with cinematic transitions.

**Key Features**:
- **46 Supported Transitions**: Includes `circleopen`, `fade`, `dissolve`, `zoomin`, and more.
- **Precise Timing**: Frame-accurate overlap calculation for seamless scene-to-scene flow.
- **High-Quality Encoding**: Uses `libx264` for the best balance between quality and file size.

**Estimated Cost**: ~$0.05 per operation

---

### **7.3 Final Render (A/V Multiplexing)**

**Purpose**: Perform the final multiplexing step to merge the concatenated video with the mixed audio track.

**Key Features**:
- **Zero Loss**: Uses `c:v copy` to avoid re-encoding the video stream, maintaining maximum visual quality.
- **AAC Audio**: Encodes the final audio at **192k** for crisp sound.
- **Auto-Trim**: Ensures the video and audio streams end exactly at the same time.

**Estimated Cost**: ~$0.02 per operation

---

### **7.4 Video Assembly Workflow**

The assembly phase runs in a hybrid parallel workflow for maximum efficiency:

```
[Parallel Task A] 
  Input: Narration + Music 
  API: Rendi (Audio Mix)
  Process: Ducking + Normalization 
  Output: mixed-audio.mp3

[Parallel Task B] 
  Input: 3 Scene Videos (Video 1, 2, 3) 
  API: Rendi (XFADE Merge)
  Process: CircleOpen Transitions
  Output: merged-video.mp4

[Final Task] 
  Input: merged-video.mp4 + mixed-audio.mp3 
  API: Rendi (Final Render)
  Process: Stream Multiplexing 
  Output: final-video.mp4 (COMPLETE)
```

---

## **8. fal.ai Platform Overview**

**Why fal.ai?**
- ✅ State-of-the-art models (Google Gemini 3 Pro via Nano Banana Pro, ByteDance Seedream v4)
- ✅ Production-quality visuals with advanced text rendering
- ✅ Built-in queue management
- ✅ Excellent Next.js integration
- ✅ Multimodal understanding (semantic, not keyword matching)
- ✅ Automatic fallback support
- ✅ Comprehensive documentation

**Official Resources**:
- Main Documentation: https://docs.fal.ai
- Next.js Integration: https://docs.fal.ai/model-apis/integrations/nextjs
- API Reference: https://docs.fal.ai/model-apis/api-reference
- Dashboard: https://fal.ai/dashboard
- API Keys: https://fal.ai/dashboard/keys

**Client Libraries**:
- `@fal-ai/client` - Client-side SDK
- `@fal-ai/server-proxy` - Server-side proxy for Next.js

**Installation**:
```bash
npm install @fal-ai/client @fal-ai/server-proxy
```

**Environment Variables**:
```env
FAL_KEY=your_fal_key_id:your_fal_key_secret
```

---

## **9. Model Selection Strategy**

**Decision Tree**:

```
User Action
├─ Describes scene in text
│  └─ Generate Image
│     ├─ Try: fal-ai/nano-banana-pro (Primary - Gemini 3 Pro)
│     └─ Fallback: fal-ai/bytedance/seedream/v4/text-to-image
│
├─ Uploads own photo
│  └─ Edit Image
│     ├─ Try: fal-ai/nano-banana-pro/edit (Primary - Gemini 3 Pro Edit)
│     └─ Fallback: fal-ai/bytedance/seedream/v4/edit
│
├─ Asks AI for suggestions
│  └─ Chat with AI
│     └─ Use: openai/gpt-4o-mini (via direct fetch)
│
├─ Generates video with frame references
│  └─ Create Video
│     ├─ Primary: fal-ai/kling-video/v2.5-turbo/pro/image-to-video (Start+End frames)
│
├─ Needs background music
│  └─ Generate Music
│     ├─ Try: fal-ai/stable-audio-25/text-to-audio (Primary)
│     └─ Fallback: fal-ai/minimax-music
│
├─ Needs narration/voiceover
│  └─ Generate Speech
│     ├─ Try: fal-ai/minimax/speech-2.6-hd (Primary)
│     └─ Fallback: fal-ai/minimax/speech-2.6-turbo
│
└─ Assembles final video
   └─ Video Assembly
      ├─ Step 1: Rendi API (Mix Narration + Music with Ducking)
      ├─ Step 2: Rendi API (Merge 3 scenes with XFADE)
      └─ Step 3: Rendi API (Final A/V Mux)
```

**Fallback Logic**:
1. Try primary model
2. If fails (timeout, error, rate limit):
   - Log error
   - Switch to fallback model
   - Track fallback usage for monitoring
3. If both fail:
   - Return user-friendly error
   - Suggest retry or alternative approach

---

## **10. Cost Summary**

| Service | Model | Cost per Unit | Monthly (1000 users) |
| :--- | :--- | :--- | :--- |
| **Text Generation** | OpenAI GPT-4o-mini | $0.0006/op | $6 (10k ops) |
| **Image Generation** | Nano Banana Pro | $0.15/image | $240 (1600 images) |
| **Image Generation** | Seedream v4 (fallback) | $0.03/image | $12 (400 images) |
| **Video Generation** | Kling Video v2.5 Turbo Pro | $0.07/second | $700 (1000 videos) |
| **Music Generation** | Stable Audio 2.5 | $0.20/request | $200 (1000 tracks) |
| **Narration (TTS)** | MiniMax Speech 2.6 HD | $0.02/100 words | $20 (1000 narrations) |
| **Audio Mixing** | Rendi API | ~$0.03/op | $30 (1000 mixes) |
| **Video Assembly** | Rendi API (XFADE) | ~$0.05/op | $50 (1000 merges) |
| **Final Render** | Rendi API (A/V Mux) | ~$0.02/op | $20 (1000 renders) |

---

## **11. Quick Reference**

### **Environment Variables Required**

```env
# OpenAI (direct fetch)
OPENAI_API_KEY=sk-...

# Together.ai (fallback for text)
TOGETHER_API_KEY=...

# fal.ai (covers all fal.ai models)
FAL_KEY=your_key_id:your_key_secret

# Rendi API (audio mixing & video assembly)
RENDI_API_KEY=...
```

### **Installation Commands**

```bash
# fal.ai (covers all image, video, music, and TTS models)
npm install @fal-ai/client @fal-ai/server-proxy

# OpenAI & Together.ai
# (Uses direct fetch calls in actions/aiChat.ts)
```

### **Key Documentation Links**

- **fal.ai**: https://docs.fal.ai
- **Nano Banana Pro**: https://fal.ai/models/fal-ai/nano-banana-pro
- **OpenAI**: https://platform.openai.com/docs
- **Kling Video v2.5**: https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video
- **Stable Audio 2.5**: https://fal.ai/models/fal-ai/stable-audio-25/text-to-audio
- **Rendi API**: https://docs.rendi.dev

---

**Document Version**: 5.2  
**Last Updated**: December 19, 2025  
**Maintained By**: MyShortReel Development Team

---

## **12. Monthly Scaling Estimations (30s Videos)**
... (keep existing content) ...
*   **Storage**: Convex Storage and CDN costs are not included in these AI-specific projections.

---

## **13. Rendi Plan Capacity Comparison (Processing Only)**

This comparison focuses strictly on **Processed Volume** per month. Since MyShortReel stores final videos on **Cloudflare R2**, we do not utilize Rendi's storage tiers, maximizing the value of the processing bandwidth.

Estimates are based on the standard **310MB processing volume** required for one 30-second invitation video assembly.

| Rendi Tier | Monthly Cost | Monthly Bandwidth | Max Videos (30s) | Effective Cost/Assembly |
| :--- | :--- | :--- | :--- | :--- |
| **Free** | $0 | 50 GB | **~161** | $0.00 |
| **Basic** | $69 | 400 GB | **~1,290** | ~$0.05 |
| **Pro** | $169 | 2 TB | **~6,451** | ~$0.02 |
| **Ultimate** | $299 | 5 TB | **~16,129** | ~$0.01 |

**Why Processing Volume?**
*   **Task A (Audio Mix)**: Processes ~10MB.
*   **Task B (XFADE Merge)**: Processes ~150MB (Input decoding + filter chain + encoding).
*   **Task C (Final Render)**: Processes ~150MB (Multiplexing stream bandwidth).
*   **Total Efficiency**: By offloading storage to R2, we ensure that every byte of the Rendi plan is dedicated to the high-compute tasks of video assembly and FFmpeg filtering.