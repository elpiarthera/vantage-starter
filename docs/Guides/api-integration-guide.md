# API Integration Guide

Complete guide for integrating AI services (fal.ai, OpenAI, Rendi) and handling API calls in VantageStarter.

**Last Updated**: December 20, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [fal.ai Integration](#falai-integration)
3. [Rendi FFmpeg API Integration](#rendi-ffmpeg-api-integration)
4. [OpenAI Integration](#openai-integration)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Cost Monitoring](#cost-monitoring)
8. [Best Practices](#best-practices)

---

## Overview

### Service Architecture

```
VantageStarter
├── fal.ai (Primary AI Provider)
│   ├── Image Generation (Nano Banana Pro / Gemini 3 Pro, Seedream v4)
│   ├── Image Editing (Nano Banana Pro Edit)
│   ├── Video Generation (Kling Video v2.5 Turbo Pro)
│   ├── Music Generation (Stable Audio 2.5, MiniMax Music)
│   └── Narration (MiniMax Speech 2.6 HD / Turbo)
│
├── Rendi (Hosted FFmpeg API)
│   ├── Video Assembly (Merge scenes with XFADE transitions)
│   ├── Audio Mixing (Sidechain Ducking, Loudness Normalization)
│   └── Final Render (A/V Multiplexing)
│
└── OpenAI (Chat & Story Generation)
    └── GPT-4o-mini (Primary), GPT-4o (Fallback)
```

### Why Solely Rendi for Assembly?

Previously, we used a hybrid approach with fal.ai FFmpeg for video merging. We have migrated entirely to **Rendi** for the assembly phase to achieve professional-grade results:

| Feature | Rendi Capability | Benefit |
| --- | --- | --- |
| **Transitions** | Full `xfade` filter support (46+ types) | Cinematic scene transitions (circleopen, fade, etc.) |
| **Audio Engineering** | `sidechaincompress` & `loudnorm` | Professional ducking and loudness compliance (-16 LUFS) |
| **Pipeline Efficiency** | Parallel task execution | Merge videos and mix audio simultaneously for speed |
| **Code Simplicity** | Unified assembly logic | One API provider for the entire post-production pipeline |

### API Call Flow

```
User Action → Client Component → Server Action/Route Handler
→ AI API Call (via Convex Action) → Response → Update Convex → Update UI
```

---

## fal.ai Integration

### Installation

```bash
npm install @fal-ai/client @fal-ai/server-proxy
```

### Setup

#### 1. Server Proxy (Next.js App Router)

Create `app/api/fal/proxy/route.ts`:

```typescript
import { createRouteHandler } from "@fal-ai/server-proxy";

export const { GET, POST } = createRouteHandler({
  proxyUrl: "https://fal.run/proxy",
});
```

#### 2. Client Configuration

Create `lib/fal/client.ts`:

```typescript
import { fal } from "@fal-ai/client";

// Configure proxy for client-side calls
fal.config({
  proxyUrl: "/api/fal/proxy",
});

export { fal };
```

### Image Generation

#### Text-to-Image (Nano Banana Pro)

```typescript
import { fal } from "@/lib/fal/client";

export async function generateImage(prompt: string) {
  try {
    const result = await fal.subscribe("fal-ai/nano-banana-pro", {
      input: {
        prompt,
        aspect_ratio: "16:9",
        resolution: "1K",
        num_images: 1,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("[v0] Image generation progress:", update.logs);
        }
      },
    });

    return {
      success: true,
      imageUrl: result.data.images[0].url,
    };
  } catch (error) {
    console.error("[v0] Image generation failed:", error);
    // Try fallback model
    return generateImageFallback(prompt);
  }
}

async function generateImageFallback(prompt: string) {
  const result = await fal.subscribe("fal-ai/bytedance/seedream/v4/text-to-image", {
    input: {
      prompt,
      image_size: "landscape_16_9",
      num_inference_steps: 20,
      guidance_scale: 7.5,
    },
  });

  return {
    success: true,
    imageUrl: result.data.images[0].url,
    fallback: true,
  };
}
```

#### Image-to-Image (Editing)

```typescript
export async function editImage(imageUrl: string, prompt: string, strength: number = 0.8) {
  const result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
    input: {
      image_url: imageUrl,
      prompt,
      strength, // 0.0-1.0: how much to change the image
    },
  });

  return {
    success: true,
    imageUrl: result.data.images[0].url,
  };
}
```

### Video Generation (Kling v2.5)

```typescript
export async function generateVideo(
  startImageUrl: string,
  endImageUrl: string,
  prompt: string
) {
  const result = await fal.subscribe("fal-ai/kling-video/v2.5-turbo/pro/image-to-video", {
    input: {
      image_url: startImageUrl,
      image_tail_url: endImageUrl,
      prompt,
      duration: "10", // 5 or 10 seconds
      aspect_ratio: "16:9",
      cfg_scale: 0.5,
    },
    logs: true,
  });

  return {
    success: true,
    videoUrl: result.data.video.url,
  };
}
```

### Music Generation (Stable Audio 2.5)

```typescript
export async function generateMusic(prompt: string, duration: number = 30) {
  try {
    const result = await fal.subscribe("fal-ai/stable-audio-25/text-to-audio", {
      input: {
        prompt,
        seconds_total: Math.min(Math.max(duration, 1), 190),
        num_inference_steps: 8,
        guidance_scale: 1,
      },
    });

    return {
      success: true,
      audioUrl: result.data.audio.url,
    };
  } catch (error) {
    // Fallback to MiniMax Music
    return generateMusicFallback(prompt, duration);
  }
}
```

### Narration Generation (MiniMax 2.6 HD)

```typescript
export async function generateNarration(text: string, voiceId: string = "default") {
  const result = await fal.subscribe("fal-ai/minimax/speech-2.6-hd", {
    input: {
      prompt: text,
      voice_setting: {
        voice_id: voiceId,
      },
      audio_setting: {
        sample_rate: 44100,
        bitrate: 256000,
        format: "mp3",
        channel: 2,
      },
    },
  });

  return {
    success: true,
    audioUrl: result.data.audio.url,
  };
}
```

---

## Rendi FFmpeg API Integration

Rendi is used for the entire video assembly phase, providing professional audio mixing and cinematic video transitions.

### Setup

Add `RENDI_API_KEY` to your environment variables.

### 1. Professional Audio Mixing

Mixes narration and music with sidechain ducking and loudness normalization.

```typescript
// lib/audio-processing.ts
export async function mixAudioWithRendi(narrationUrl: string, musicUrl: string) {
  const filterComplex = `
    [0:a]asplit=2[sc][narr];
    [1:a]volume=0.4[music];
    [music][sc]sidechaincompress=threshold=0.03:ratio=9:attack=10:release=200:makeup=1[ducked];
    [narr][ducked]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-16:TP=-1.5:LRA=11
  `.replace(/\s+/g, '');

  const command = `-i {{in_narration}} -stream_loop -1 -i {{in_music}} -filter_complex "${filterComplex}" -c:a aac -b:a 192k {{out_mixed}}`;

  const response = await fetch('https://api.rendi.dev/v1/run-ffmpeg-command', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.RENDI_API_KEY!,
    },
    body: JSON.stringify({
      ffmpeg_command: command,
      input_files: { in_narration: narrationUrl, in_music: musicUrl },
      output_files: { out_mixed: 'mixed_audio.m4a' },
      vcpu_count: 2,
    }),
  });
  // ... poll /v1/commands/{id} for SUCCESS status
}
```

### 2. Video Merging with XFADE

Merges scene clips with cinematic transitions (e.g., `circleopen`).

```typescript
// lib/rendi-video-processing.ts
export async function mergeVideosWithXfade(sceneUrls: string[]) {
  // Example for 3 scenes of 10s with 1s transitions
  const filterComplex = "[0:v][1:v]xfade=transition=circleopen:duration=1:offset=9[v1];[v1][2:v]xfade=transition=circleopen:duration=1:offset=18,format=yuv420p[out]";
  
  const command = `-i {{in_scene1}} -i {{in_scene2}} -i {{in_scene3}} -filter_complex "${filterComplex}" -map "[out]" -c:v libx264 -y {{out_video}}`;

  const response = await fetch('https://api.rendi.dev/v1/run-ffmpeg-command', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.RENDI_API_KEY!,
    },
    body: JSON.stringify({
      ffmpeg_command: command,
      input_files: { 
        in_scene1: sceneUrls[0], 
        in_scene2: sceneUrls[1], 
        in_scene3: sceneUrls[2] 
      },
      output_files: { out_video: 'merged_scenes.mp4' },
      vcpu_count: 8,
    }),
  });
  // ... poll status
}
```

---

## OpenAI Integration

We use **GPT-4o-mini** for cost-effective storyboarding and prompt enhancement.

```typescript
import { IMAGE_ENHANCEMENT_PROMPT } from "../../lib/ai/prompts";

async function enhanceWithOpenAI(apiKey: string, basePrompt: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: IMAGE_ENHANCEMENT_PROMPT.system },
        { role: "user", content: IMAGE_ENHANCEMENT_PROMPT.buildUserPrompt(basePrompt) },
      ],
    }),
  });
  // ...
}
```

---

## Cost Monitoring

### Pricing Table (as of Dec 2025)

| Component | Service | Model / Operation | Estimated Cost |
| :--- | :--- | :--- | :--- |
| **Images** | fal.ai | Nano Banana Pro | $0.15 / image |
| **Video** | fal.ai | Kling v2.5 Turbo | $0.07 / second |
| **Music** | fal.ai | Stable Audio 2.5 | $0.20 / request |
| **Narration** | fal.ai | MiniMax 2.6 HD | $0.02 / 100 words |
| **Audio Mix** | Rendi | Sidechain + Loudnorm | ~$0.03 / mix |
| **Video Merge**| Rendi | XFADE Transitions | ~$0.05 / merge |
| **Final Render**| Rendi | A/V Multiplexing | ~$0.02 / render |

---

**Maintained By**: VantageStarter Development Team  
**Last Updated**: December 20, 2025  
**Version**: 3.0
