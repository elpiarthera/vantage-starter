# AI Models Implementation Plan
## MyShortReel - Production-Ready AI Integration

**Project**: MyShortReel (AI-powered video invitation generator)  
**Current State**: ✅ IMPLEMENTED - Production AI integrations active  
**Target State**: Production-ready AI integrations with real APIs  
**Integration**: Clerk Auth + Convex Backend ✅  
**Developer**: Solo Developer  
**Approach**: MVP - Production-ready, no over-complication  
**Implementation Status**: COMPLETE  
**Last Updated**: December 2024

---

## 📋 Table of Contents

1. [AI Models Overview](#ai-models-overview)
2. [Current State Analysis](#current-state-analysis)
3. [AI Services Architecture](#ai-services-architecture)
4. [Implementation Phases](#implementation-phases)
5. [API Integration Details](#api-integration-details)
6. [Cost Analysis & Optimization](#cost-analysis--optimization)
7. [Testing & Validation](#testing--validation)
8. [Production Deployment](#production-deployment)
9. [Solo Developer Tips](#solo-developer-tips)

---

## 🤖 AI Models Overview

**Status**: ✅ IMPLEMENTED

**For comprehensive AI models documentation, specifications, pricing, and usage guidelines, see:**  
[`docs/Understanding/ai-models-overview.md`](../Understanding/ai-models-overview.md)

### Production AI Models (Implemented)

| Feature | Model | Provider | File |
|---------|-------|----------|------|
| **Video Generation** | `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` | Fal.ai (Kling) | `convex/actions/videoPolling.ts` |
| **Music Generation** | `fal-ai/stable-audio-25/text-to-audio` | Fal.ai (Stable Audio 2.5) | `convex/actions/musicGeneration.ts` |
| **Narration (TTS)** | `fal-ai/minimax/speech-2.6-hd` (primary) | Fal.ai (MiniMax) | `convex/actions/narrationGeneration.ts` |
| **Narration Fallback** | `fal-ai/minimax/speech-2.6-turbo` | Fal.ai (MiniMax) | `convex/actions/narrationGeneration.ts` |
| **Image Generation** | `fal-ai/nano-banana-pro` (primary) | Fal.ai (Google Gemini 3) | `convex/actions/imageGeneration.ts` |
| **Image Fallback** | `fal-ai/bytedance/seedream/v4/text-to-image` | Fal.ai (ByteDance) | `convex/actions/imageGeneration.ts` |
| **Video Assembly** | Rendi API (Merge + Final Render) | Rendi | `convex/actions/videoAssembly.ts` |
| **Audio Mixing** | Rendi API (sidechain + loudnorm) | Rendi | `lib/audio-processing.ts` |

### Key Implementation Details

- **Video Generation**: Kling Video v2.5 Turbo Pro for image-to-video, $0.07/second ($0.35/5s, $0.70/10s)
- **Music Generation**: Stable Audio 2.5 with max 190 seconds duration
- **Narration**: MiniMax Speech 2.6 HD (primary) with Turbo fallback, 44.1kHz 256kbps stereo MP3
- **Video Assembly**: Rendi API for professional post-production (scene merging with xfade transitions, audio mixing with sidechain ducking, and final multiplexing)

---

## 🔍 Current State Analysis

### **Existing Mock Services**

#### **1. services/aiChat.ts** - AI Chat Service
**Current Implementation**:
\`\`\`typescript
const MOCK_RESPONSES = [
  "I can help you refine this scene...",
  "Let me suggest some adjustments...",
  // ... 6 predefined responses
]

export async function generateChatResponse(input: string, sceneId: string) {
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
  return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]
}

export async function generateImagePrompt(description: string, frameType: "start" | "end") {
  await new Promise(resolve => setTimeout(resolve, 500))
  return `${description}, ${frameType} frame, high quality, cinematic`
}
\`\`\`

**Issues**:
- ❌ No real AI intelligence
- ❌ Random, non-contextual responses
- ❌ No conversation memory
- ❌ No scene-specific suggestions

**Production Needs**:
- ✅ OpenAI GPT-4o-mini for intelligent chat
- ✅ Conversation history tracking
- ✅ Scene context awareness
- ✅ Structured output for scene modifications

---

#### **2. services/videoGeneration.ts** - Video Generation Service
**Current Implementation**:
\`\`\`typescript
export async function generateVideo(options: VideoGenerationOptions) {
  const delay = Math.max(2000, duration * 200) // 2-10 seconds
  await new Promise(resolve => setTimeout(resolve, delay))
  
  return {
    success: true,
    videoUrl: MOCK_VIDEO_URL // Static "/mock.mp4"
  }
}
\`\`\`

**Issues**:
- ❌ Returns same mock video every time
- ❌ No actual video generation
- ❌ Ignores all input parameters (frames, styles, duration)
- ❌ No progress tracking

**Production Needs**:
- ✅ Kling Video v2.5 Turbo Pro
- ✅ Image-to-video conversion
- ✅ Progress polling and status updates
- ✅ Error handling and retries

---

#### **3. services/assetUpload.ts** - Asset Upload Service
**Current Implementation**:
\`\`\`typescript
export async function uploadAsset(file: File) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  const url = URL.createObjectURL(file) // Memory-only, lost on refresh
  return { success: true, url }
}
\`\`\`

**Issues**:
- ❌ Object URLs are temporary (lost on page refresh)
- ❌ No cloud storage
- ❌ No CDN for fast delivery
- ❌ No file persistence

**Production Needs**:
- ✅ Convex file storage (see convex-implementation-plan.md)
- ✅ Persistent URLs with CDN
- ✅ Image optimization and resizing
- ✅ Metadata tracking

---

### **AI SDK v5 Integration Available**

The codebase includes **Vercel AI SDK v5** examples in `user_read_only_context/integration_examples/ai_sdk/`:

**Available Patterns**:
- ✅ `generateText()` - Synchronous completions
- ✅ `streamText()` - Real-time streaming
- ✅ `generateObject()` - Structured output with Zod schemas
- ✅ `useChat()` hook - React chat UI management
- ✅ Tool calling - Multi-step AI workflows

**Supported Models** (via Vercel AI Gateway):
- OpenAI: `openai/gpt-4o`, `openai/gpt-5`
- Anthropic: `anthropic/claude-sonnet-4.5`
- Deepseek: `deepseek-r1`
- X.AI: `xai/grok-4-fast-reasoning`

---

## 🏗️ AI Services Architecture

### **Production Architecture Diagram**

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌───────────────┐  ┌───────────┐  ┌─────────────┐  ┌───────────┐ │
│  │ Chat UI       │  │ Video     │  │ Asset Upload│  │ Music Player│ │
│  │ (useChat)     │  │ Player    │  │             │  │             │ │
│  └───────┬───────┘  └─────┬─────┘  └──────┬──────┘  └─────┬───────┘ │
└──────────┼─────────────────┼───────────────┼───────────────┼─────────┘
           │ POST /api/chat  │ Convex Action │ Convex Action │ Convex Action
           ▼                 ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Convex Backend                            │
│  ┌───────────────┐  ┌─────────────┐  ┌───────────────┐  ┌───────┐ │
│  │ Chat Action   │  │ Video Action│  │ Image Action  │  │ Music │ │
│  │ (OpenAI)      │  │ (Kling)     │  │ (fal.ai)      │  │ Action│ │
│  └──────┬────────┘  └─────┬───────┘  └──────┬────────┘  └─┬─────┘ │
└─────────┼──────────────────┼──────────────────┼───────────────┼───────┘
          │ OpenAI API       │ Kling API        │ fal.ai API    │ fal.ai API
          ▼                  ▼                  ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ OpenAI GPT-4o-mini │  │ Kling Video    │  │ fal.ai          │  │ fal.ai Music    │
│  Chat API       │  │  v2.5 Turbo Pro │  │ (Gemini, Seedream)│  │ (Stable Audio 2.5)│
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
\`\`\`

### **Data Flow**

**1. AI Chat Flow**:
\`\`\`
User types message → useChat hook → POST /api/chat → Convex action
→ OpenAI API → Stream response → Update Convex DB → Real-time UI update
\`\`\`

**2. Image Generation Flow**:
\`\`\`
User prompts for frame → Convex action (generateFrameImage)
→ fal.ai API → Download Image → Upload to Convex storage → Update Scene
\`\`\`

**3. Video Generation Flow**:
\`\`\`
Scene frames ready → Convex action (generateVideoWithKling)
→ fal.ai API (Kling Video v2.5 Turbo Pro) → Poll for completion
→ Download video → Upload to Convex storage → Update Video record
→ Real-time UI update with video URL
\`\`\`

**4. Music Generation Flow**:
\`\`\`
User selects music style → Convex action (generateMusic)
→ fal.ai API (Stable Audio 2.5) → Download Audio → Upload to Convex storage → Save Music track
\`\`\`

**5. Narration Generation Flow**:
\`\`\`
User inputs text → Convex action (generateNarration)
→ fal.ai API → Download Audio → Upload to Convex storage → Save Narration track
\`\`\`

**6. Video Assembly Flow**:
\`\`\`
Scene videos, narration, music ready → Convex action (assembleFinalVideo)
→ fal.ai API (FFmpeg) → Merge videos & audio → Download final video
→ Upload to Convex storage → Update Project with final video
\`\`\`

**7. Asset Upload Flow**:
\`\`\`
User selects file → Generate upload URL → Upload to Convex storage
→ Save metadata in DB → Return CDN URL → Display in UI
\`\`\`

---

## 📝 Implementation Phases

### **Phase 1: OpenAI Chat Integration** (4-5 hours)

#### **1.1 Set Up AI SDK v5** (30 min)

**Install Dependencies**:
\`\`\`bash
npm install ai @ai-sdk/react zod
\`\`\`

**Environment Variables**:
\`\`\`env
# Option A: Direct OpenAI (requires API key)
OPENAI_API_KEY=sk-proj-...

# Option B: Vercel AI Gateway (recommended, no key needed)
# Uses Vercel's managed API keys
\`\`\`

---

#### **1.2 Create Chat API Route** (60 min)

**File**: `app/api/chat/route.ts`

\`\`\`typescript
import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
  tool,
} from 'ai'
import { z } from 'zod'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, sceneId, projectId }: { 
    messages: UIMessage[]
    sceneId?: string
    projectId: string
  } = await req.json()

  const prompt = convertToModelMessages(messages)

  const result = streamText({
    model: 'openai/gpt-4o', // Via Vercel AI Gateway
    prompt,
    system: `You are an AI assistant for MyShortReel, a video invitation generator.
    
Your role:
- Help users refine their video scenes
- Suggest improvements to descriptions, styles, and cinematography
- Provide creative ideas for wedding/event invitations
- Be concise and actionable

Current scene ID: ${sceneId || 'none'}
Project ID: ${projectId}`,
    temperature: 0.7,
    maxOutputTokens: 500,
    abortSignal: req.signal,
    
    // Tool calling for scene modifications
    tools: {
      updateSceneDescription: tool({
        description: 'Update the scene description based on user feedback',
        inputSchema: z.object({
          newDescription: z.string().describe('The improved scene description'),
          reasoning: z.string().describe('Why this description is better'),
        }),
        execute: async ({ newDescription, reasoning }) => {
          // This will be handled by the frontend
          return {
            success: true,
            newDescription,
            reasoning,
          }
        },
      }),
      suggestCinematicStyles: tool({
        description: 'Suggest cinematic styles for the scene',
        inputSchema: z.object({
          ambiance: z.string(),
          cameraMovement: z.string(),
          colorTone: z.string(),
          visualStyle: z.string(),
        }),
        execute: async (styles) => {
          return {
            success: true,
            styles,
          }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted, usage }) => {
      if (!isAborted) {
        console.log('[AI Chat] Tokens used:', usage)
      }
    },
    consumeSseStream: consumeStream,
  })
}
\`\`\`

**Key Features**:
- ✅ Streaming responses for real-time feedback
- ✅ Tool calling for structured scene updates
- ✅ Context-aware system prompt
- ✅ Proper error handling with abort signals

---

#### **1.3 Update Chat Component** (90 min)

**File**: `components/video-generation/VideoRegenerationChat.tsx`

**Replace mock service with AI SDK**:

\`\`\`typescript
'use client'

import { useChat } from '@ai-sdk/react'
import { useState } from 'react'

export function VideoRegenerationChat({ sceneId, projectId }: Props) {
  const [input, setInput] = useState('')
  
  const { messages, sendMessage, status } = useChat({
    api: '/api/chat',
    body: {
      sceneId,
      projectId,
    },
    onFinish: (message) => {
      // Handle tool calls for scene updates
      const toolCalls = message.parts.filter(part => part.type === 'tool-call')
      
      toolCalls.forEach(toolCall => {
        if (toolCall.toolName === 'updateSceneDescription') {
          // Update scene in Convex
          updateSceneDescription(sceneId, toolCall.args.newDescription)
        }
        
        if (toolCall.toolName === 'suggestCinematicStyles') {
          // Apply suggested styles
          updateSceneStyles(sceneId, toolCall.args)
        }
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage({ text: input })
      setInput('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map(message => (
          <div key={message.id} className={message.role === 'user' ? 'text-right' : 'text-left'}>
            {message.parts.map((part, i) => {
              if (part.type === 'text') {
                return <p key={i}>{part.text}</p>
              }
              if (part.type === 'tool-call') {
                return (
                  <div key={i} className="bg-blue-50 p-2 rounded">
                    <p className="text-sm font-medium">🔧 {part.toolName}</p>
                    <pre className="text-xs">{JSON.stringify(part.args, null, 2)}</pre>
                  </div>
                )
              }
              return null
            })}
          </div>
        ))}
        
        {status === 'streaming' && (
          <div className="text-left">
            <div className="animate-pulse">AI is thinking...</div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI to improve this scene..."
          disabled={status === 'streaming'}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          disabled={!input.trim() || status === 'streaming'}
          className="mt-2 w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50"
        >
          {status === 'streaming' ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
\`\`\`

**Critical Fix**: This replaces the infinite render loop issue by using AI SDK's managed state.

---

#### **1.4 Create Convex Chat Actions** (60 min)

**File**: `convex/actions/aiChat.ts`

\`\`\`typescript
"use node"

import { v } from "convex/values"
import { action } from "../_generated/server"
import { api } from "../_generated/api"

export const saveConversation = action({
  args: {
    projectId: v.id("projects"),
    sceneId: v.optional(v.id("scenes")),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    // Save conversation to database for history
    const conversationId = await ctx.runMutation(api.conversations.create, {
      projectId: args.projectId,
      sceneId: args.sceneId,
      userId: identity.subject,
      messages: args.messages,
    })

    return conversationId
  },
})

export const generateImagePromptEnhanced = action({
  args: {
    description: v.string(),
    frameType: v.union(v.literal("start"), v.literal("end")),
    cinematicStyles: v.optional(v.object({
      ambiance: v.string(),
      cameraMovement: v.string(),
      colorTone: v.string(),
      visualStyle: z.string(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    // Use AI SDK to enhance prompt
    const { generateText } = await import('ai')

    let basePrompt = `${description}, ${frameType} frame`

    if (args.cinematicStyles) {
      const { ambiance, cameraMovement, colorTone, visualStyle } = args.cinematicStyles
      if (ambiance) basePrompt += `, ${ambiance} ambiance`
      if (cameraMovement) basePrompt += `, ${cameraMovement} camera movement`
      if (colorTone) basePrompt += `, ${colorTone} color tone`
      if (visualStyle) basePrompt += `, ${visualStyle} visual style`
    }

    try {
      const { text } = await generateText({
        model: 'openai/gpt-4o',
        prompt: `Enhance this prompt for AI image generation to create a cinematic video frame. Make it detailed and visually descriptive while keeping it under 200 words:\n\n${basePrompt}`,
        temperature: 0.8,
        maxOutputTokens: 300,
      })

      return text
    } catch (error) {
      console.error('[AIChat] Prompt enhancement failed:', error)
      // Fallback to basic prompt
      return basePrompt + ', high quality, cinematic, professional, 4K'
    }
  },
})
\`\`\`

---

### **Phase 2: Image Generation with fal.ai** (3-4 hours)


**MyShortReel requires AI-generated frame images for video generation. We'll use fal.ai's state-of-the-art models with fallback support.**

#### **2.1 fal.ai Setup** (30 min)

**Install packages**:
\`\`\`bash
npm install @fal-ai/client @fal-ai/server-proxy
\`\`\`

**Environment Variables**:
\`\`\`env
FAL_KEY=your_fal_key_id:your_fal_key_secret
\`\`\`

**Setup Proxy** (`app/api/fal/proxy/route.ts`):
\`\`\`typescript
import { route } from "@fal-ai/server-proxy/nextjs"
export const { GET, POST } = route
\`\`\`

**Configure Client** (`lib/fal-client.ts`):
\`\`\`typescript
import * as fal from "@fal-ai/client"
fal.config({ proxyUrl: "/api/fal/proxy" })
export { fal }
\`\`\`

---

#### **2.2 Implement Image Generation** (2-3 hours)

**File**: `convex/actions/imageGeneration.ts`

\`\`\`typescript
"use node"

import { v } from "convex/values"
import { action } from "../_generated/server"
import { api } from "../_generated/api"

const FAL_KEY = process.env.FAL_KEY

const MODELS = {
  textToImage: {
    primary: "fal-ai/nano-banana-pro",           // Google Gemini 3 Pro Image
    fallback: "fal-ai/bytedance/seedream/v4/text-to-image",
  },
  imageToImage: {
    primary: "fal-ai/nano-banana-pro/edit",      // Google Gemini 3 Pro Image Edit
    fallback: "fal-ai/bytedance/seedream/v4/edit",
  },
}

export const generateFrameImage = action({
  args: {
    sceneId: v.id("scenes"),
    frameType: v.union(v.literal("start"), v.literal("end")),
    prompt: v.string(),
    aspectRatio: v.optional(v.string()),
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    if (!FAL_KEY) {
      throw new Error("FAL_KEY not configured")
    }

    try {
      console.log(`[ImageGen] Generating ${args.frameType} frame for scene ${args.sceneId}`)

      // Try primary model (Nano Banana Pro - Gemini 3 Pro Image)
      let result
      try {
        result = await generateWithFal(
          MODELS.textToImage.primary,
          {
            prompt: args.prompt,
            aspect_ratio: args.aspectRatio || "16:9",
            resolution: args.resolution || "1K",
            num_images: 1,
          }
        )
        console.log("[ImageGen] Generated with Nano Banana Pro (Gemini 3 Pro)")
      } catch (primaryError) {
        console.warn("[ImageGen] Primary model failed, trying fallback:", primaryError)
        
        // Fallback to Seedream v4
        result = await generateWithFal(
          MODELS.textToImage.fallback,
          {
            prompt: args.prompt,
            image_size: args.aspectRatio === "9:16" ? "portrait_9_16" : "landscape_16_9",
            num_inference_steps: 20,
            guidance_scale: 7.5,
          }
        )
        console.log("[ImageGen] Generated with Seedream v4 (fallback)")
      }

      const imageUrl = result.images[0].url

      // Download image
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`)
      }

      const imageBlob = await imageResponse.blob()
      const imageBuffer = await imageBlob.arrayBuffer()

      // Upload to Convex storage
      const storageId = await ctx.storage.store(
        new Blob([imageBuffer], { type: 'image/png' })
      )

      // Get scene to find projectId
      const scene = await ctx.runQuery(api.scenes.getById, { sceneId: args.sceneId })
      if (!scene) throw new Error("Scene not found")

      // Save asset metadata
      const assetId = await ctx.runMutation(api.assets.saveAsset, {
        storageId,
        projectId: scene.projectId,
        sceneId: args.sceneId,
        fileName: `${args.frameType}-frame-generated.png`,
        fileSize: imageBuffer.byteLength,
        fileType: 'image/png',
        assetType: 'generated',
      })

      // Update scene with frame image
      if (args.frameType === 'start') {
        await ctx.runMutation(api.scenes.updateStartFrame, {
          sceneId: args.sceneId,
          imageId: storageId,
        })
      } else {
        await ctx.runMutation(api.scenes.updateEndFrame, {
          sceneId: args.sceneId,
          imageId: storageId,
        })
      }

      console.log(`[ImageGen] Successfully generated and stored ${args.frameType} frame`)

      return {
        success: true,
        assetId,
        storageId,
        imageUrl: await ctx.storage.getUrl(storageId),
      }

    } catch (error) {
      console.error('[ImageGen] Error:', error)
      throw error
    }
  },
})

/**
 * Edit existing image (image-to-image)
 * Uses Gemini 2.5 Flash Image Edit with Seedream v4 Edit fallback
 */
export const editFrameImage = action({
  args: {
    sceneId: v.id("scenes"),
    frameType: v.union(v.literal("start"), v.literal("end")),
    imageStorageId: v.string(),
    editPrompt: v.string(),
    strength: v.optional(v.number()), // 0.0-1.0, how much to change
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    if (!FAL_KEY) {
      throw new Error("FAL_KEY not configured")
    }

    try {
      console.log(`[ImageGen] Editing ${args.frameType} frame for scene ${args.sceneId}`)

      // Get image URL from Convex storage
      const imageUrl = await ctx.storage.getUrl(args.imageStorageId)
      if (!imageUrl) throw new Error("Image not found in storage")

      // Try primary model first (Gemini 2.5 Flash Image Edit)
      let result
      try {
        result = await generateWithFal(
          MODELS.imageToImage.primary,
          {
            image_url: imageUrl,
            prompt: args.editPrompt,
            strength: args.strength || 0.75,
            num_inference_steps: 4,
            num_images: 1,
          }
        )
        console.log("[ImageGen] Edited with Gemini 2.5 Flash Image Edit")
      } catch (primaryError) {
        console.warn("[ImageGen] Primary edit model failed, trying fallback:", primaryError)
        
        // Fallback to Seedream v4 Edit
        result = await generateWithFal(
          MODELS.imageToImage.fallback,
          {
            image_url: imageUrl,
            prompt: args.editPrompt,
            strength: args.strength || 0.75,
            num_inference_steps: 20,
            guidance_scale: 7.5,
          }
        )
        console.log("[ImageGen] Edited with Seedream v4 Edit (fallback)")
      }

      const editedImageUrl = result.images[0].url

      // Download edited image
      const imageResponse = await fetch(editedImageUrl)
      const imageBlob = await imageResponse.blob()
      const imageBuffer = await imageBlob.arrayBuffer()

      // Upload to Convex storage
      const storageId = await ctx.storage.store(
        new Blob([imageBuffer], { type: 'image/png' })
      )

      // Get scene to find projectId
      const scene = await ctx.runQuery(api.scenes.getById, { sceneId: args.sceneId })
      if (!scene) throw new Error("Scene not found")

      // Save asset metadata
      const assetId = await ctx.runMutation(api.assets.saveAsset, {
        storageId,
        projectId: scene.projectId,
        sceneId: args.sceneId,
        fileName: `${args.frameType}-frame-edited.png`,
        fileSize: imageBuffer.byteLength,
        fileType: 'image/png',
        assetType: 'edited',
      })

      // Update scene with edited frame image
      if (args.frameType === 'start') {
        await ctx.runMutation(api.scenes.updateStartFrame, {
          sceneId: args.sceneId,
          imageId: storageId,
        })
      } else {
        await ctx.runMutation(api.scenes.updateEndFrame, {
          sceneId: args.sceneId,
          imageId: storageId,
        })
      }

      console.log(`[ImageGen] Successfully edited and stored ${args.frameType} frame`)

      return {
        success: true,
        assetId,
        storageId,
        imageUrl: await ctx.storage.getUrl(storageId),
      }

    } catch (error) {
      console.error('[ImageGen] Edit error:', error)
      throw error
    }
  },
})

/**
 * Helper function to call fal.ai API
 */
async function generateWithFal(modelId: string, input: any) {
  const response = await fetch(`https://queue.fal.run/${modelId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${FAL_KEY}`,
    },
    body: JSON.stringify({ input }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`fal.ai API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  
  // fal.ai uses queue system - get request_id
  const requestId = data.request_id

  // Poll for completion
  let attempts = 0
  const maxAttempts = 60 // 1 minute max
  
  while (attempts < maxAttempts) {
    attempts++
    await new Promise(resolve => setTimeout(resolve, 1000))

    const statusResponse = await fetch(`https://queue.fal.run/${modelId}/requests/${requestId}`, {
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
      },
    })

    if (!statusResponse.ok) continue

    const statusData = await statusResponse.json()

    if (statusData.status === 'COMPLETED') {
      return statusData.output
    }

    if (statusData.status === 'FAILED') {
      throw new Error(`fal.ai generation failed: ${statusData.error}`)
    }
  }

  throw new Error('fal.ai generation timed out')
}
\`\`\`

---

#### **2.3 Frontend Integration** (1 hour)

**File**: `components/scene-management/FrameGenerator.tsx`

\`\`\`typescript
"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Sparkles, Upload } from 'lucide-react'
import { Id } from "@/convex/_generated/dataModel"

interface FrameGeneratorProps {
  sceneId: Id<"scenes">
  frameType: "start" | "end"
  existingImageId?: string
  onGenerated?: (imageUrl: string) => void
}

export function FrameGenerator({ 
  sceneId, 
  frameType, 
  existingImageId,
  onGenerated 
}: FrameGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  
  const generateImage = useMutation(api.actions.imageGeneration.generateFrameImage)
  const editImage = useMutation(api.actions.imageGeneration.editFrameImage)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    try {
      const result = existingImageId
        ? await editImage({
            sceneId,
            frameType,
            imageStorageId: existingImageId,
            editPrompt: prompt,
          })
        : await generateImage({
            sceneId,
            frameType,
            prompt,
          })

      if (result.imageUrl) {
        onGenerated?.(result.imageUrl)
      }
    } catch (error) {
      console.error("Image generation failed:", error)
      alert("Failed to generate image. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">
          {existingImageId ? "Edit Image" : "Generate Image"} ({frameType} frame)
        </label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            existingImageId
              ? "Describe how to modify the image..."
              : "Describe the image you want to generate..."
          }
          rows={3}
          className="mt-2"
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : existingImageId ? (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Edit Image
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Image
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        Powered by Google Gemini 2.5 Flash Image & ByteDance Seedream v4
      </p>
    </div>
  )
}
\`\`\`

---

### **Phase 3: Video Generation** (6-8 hours)


#### **3.1 Implement Kling Video v2.5 Turbo Pro** (3-4 hours)

**File**: `convex/actions/videoGeneration.ts`

\`\`\`typescript
"use node"

import { v } from "convex/values"
import { action } from "../_generated/server"
import { api } from "../_generated/api"

const FAL_KEY = process.env.FAL_KEY

export const generateVideoWithKling = action({
  args: {
    videoId: v.id("videos"),
    sceneId: v.id("scenes"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    if (!FAL_KEY) {
      throw new Error("FAL_KEY not configured")
    }

    try {
      await ctx.runMutation(api.videos.updateStatus, {
        videoId: args.videoId,
        status: "generating",
        progress: 0,
      })

      const scene = await ctx.runQuery(api.scenes.getById, {
        sceneId: args.sceneId,
      })

      if (!scene) throw new Error("Scene not found")

      // Get image URLs from Convex storage
      const startFrameUrl = scene.startFrameImageId
        ? await ctx.storage.getUrl(scene.startFrameImageId)
        : null

      const endFrameUrl = scene.endFrameImageId
        ? await ctx.storage.getUrl(scene.endFrameImageId)
        : null

      if (!startFrameUrl || !endFrameUrl) {
        throw new Error("Missing frame images. Please upload both start and end frames.")
      }

      // Submit to Kling Video v2.5 Turbo Pro via fal.ai
      console.log('[VideoGen] Submitting job to Kling Video v2.5 Turbo Pro via fal.ai...')
      const response = await fetch('https://queue.fal.run/fal-ai/kling-video/v2.5-turbo/pro/image-to-video', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: startFrameUrl,
          tail_image_url: endFrameUrl,
          prompt: scene.description,
          duration: Math.min(scene.duration, 10).toString(), // Kling Video v2.5 Turbo Pro supports up to 10 seconds
          aspect_ratio: "16:9",
          cfg_scale: 0.5,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Kling API error: ${response.status} - ${error}`)
      }

      const data = await response.json()
      const requestId = data.request_id

      console.log('[VideoGen] Job submitted:', requestId)

      // Poll for completion
      let attempts = 0
      const maxAttempts = 60 // 5 minutes max (5s intervals)
      let videoUrl: string | null = null

      while (attempts < maxAttempts && !videoUrl) {
        attempts++
        
        // Wait 5 seconds between polls
        await new Promise(resolve => setTimeout(resolve, 5000))

        console.log(`[VideoGen] Polling attempt ${attempts}/${maxAttempts}`)

        const statusResponse = await fetch(`https://queue.fal.run/fal-ai/kling-video/v2.5-turbo/pro/image-to-video/requests/${requestId}/status`, {
          headers: {
            'Authorization': `Key ${FAL_KEY}`,
          },
        })

        if (!statusResponse.ok) {
          console.error('[VideoGen] Status check failed:', statusResponse.status)
          continue
        }

        const statusData = await statusResponse.json()
        
        // Update progress (estimate based on time)
        const progress = Math.min(10 + (attempts * 1.5), 95)
        await ctx.runMutation(api.videos.updateStatus, {
          videoId: args.videoId,
          status: "generating",
          progress: Math.floor(progress),
        })

        if (statusData.status === 'COMPLETED') {
          videoUrl = statusData.output.video.url
          console.log('[VideoGen] Video ready:', videoUrl)
          break
        }

        if (statusData.status === 'FAILED') {
          throw new Error(`Video generation failed: ${statusData.error}`)
        }
        
        console.log('[VideoGen] Current status:', statusData.status)
      }

      if (!videoUrl) {
        throw new Error('Video generation timed out after 5 minutes')
      }

      // Download video from fal.ai
      console.log('[VideoGen] Downloading video...')
      
      const videoResponse = await fetch(videoUrl)
      if (!videoResponse.ok) {
        throw new Error('Failed to download generated video')
      }

      const videoBlob = await videoResponse.blob()
      const videoBuffer = await videoBlob.arrayBuffer()

      // Upload to Convex storage
      console.log('[VideoGen] Uploading to Convex storage...')
      
      const storageId = await ctx.storage.store(new Blob([videoBuffer], { type: 'video/mp4' }))

      // Step 5: Update video record
      await ctx.runMutation(api.videos.updateWithFile, {
        videoId: args.videoId,
        videoFileId: storageId,
        status: "completed",
        progress: 100,
      })

      console.log('[VideoGen] Video generation complete!')

      return {
        success: true,
        videoFileId: storageId,
      }

    } catch (error) {
      console.error('[VideoGen] Error:', error)

      // Update status to failed
      await ctx.runMutation(api.videos.updateStatus, {
        videoId: args.videoId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })

      throw error
    }
  },
})
\`\`\`

---

### **Phase 4: Music Generation** (3-4 hours)


#### **4.1 Implement Music Generation** (2-3 hours)

**File**: `convex/actions/musicGeneration.ts`

\`\`\`typescript
"use node"

import { v } from "convex/values"
import { action } from "../_generated/server"
import { api } from "../_generated/api"

const FAL_KEY = process.env.FAL_KEY

const MUSIC_MODELS = {
  primary: "fal-ai/stable-audio-25/text-to-audio",
  fallback: "fal-ai/minimax-music",
}

export const generateMusic = action({
  args: {
    projectId: v.id("projects"),
    prompt: v.string(),
    duration: v.optional(v.number()), // Up to 190 seconds for Stable Audio 2.5
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    if (!FAL_KEY) {
      throw new Error("FAL_KEY not configured")
    }

    try {
      console.log('[MusicGen] Generating music with Stable Audio 2.5')

      // Try primary model (Stable Audio 2.5)
      let result
      try {
        result = await generateMusicWithFal(
          MUSIC_MODELS.primary,
          {
            prompt: args.prompt,
            seconds_total: args.duration || 30,
          }
        )
      } catch (primaryError) {
        console.warn('[MusicGen] Stable Audio 2.5 failed, trying MiniMax Music')
        
        // Fallback to MiniMax Music
        result = await generateMusicWithFal(
          MUSIC_MODELS.fallback,
          {
            prompt: args.prompt,
            duration: args.duration || 30,
          }
        )
      }

      const audioUrl = result.audio.url

      // Download and store
      const audioResponse = await fetch(audioUrl)
      const audioBlob = await audioResponse.blob()
      const audioBuffer = await audioBlob.arrayBuffer()

      const storageId = await ctx.storage.store(
        new Blob([audioBuffer], { type: 'audio/mpeg' })
      )

      // Save music track metadata
      const musicId = await ctx.runMutation(api.music.create, {
        projectId: args.projectId,
        storageId,
        prompt: args.prompt,
        duration: args.duration || 30,
        userId: identity.subject,
      })

      return {
        success: true,
        musicId,
        storageId,
        audioUrl: await ctx.storage.getUrl(storageId),
      }
    } catch (error) {
      console.error('[MusicGen] Error:', error)
      throw error
    }
  },
})

async function generateMusicWithFal(modelId: string, input: any) {
  const response = await fetch(`https://queue.fal.run/${modelId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`fal.ai Music API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  
  // fal.ai uses queue system - get request_id
  const requestId = data.request_id

  // Poll for completion
  let attempts = 0
  const maxAttempts = 60 // 1 minute max
  
  while (attempts < maxAttempts) {
    attempts++
    await new Promise(resolve => setTimeout(resolve, 1000))

    const statusResponse = await fetch(`https://queue.fal.run/${modelId}/requests/${requestId}`, {
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
      },
    })

    if (!statusResponse.ok) continue

    const statusData = await statusResponse.json()

    if (statusData.status === 'COMPLETED') {
      return statusData.output
    }

    if (statusData.status === 'FAILED') {
      throw new Error(`fal.ai music generation failed: ${statusData.error}`)
    }
  }

  throw new Error('fal.ai music generation timed out')
}
\`\`\`

---

### **Phase 5: Narration (Text-to-Speech)** (2-3 hours)


#### **5.1 Implement Narration Generation** (2 hours)

**File**: `convex/actions/narrationGeneration.ts`

\`\`\`typescript
"use node"

import { v } from "convex/values"
import { action } from "../_generated/server"
import { api } from "../_generated/api"

const FAL_KEY = process.env.FAL_KEY

export const generateNarration = action({
  args: {
    projectId: v.id("projects"),
    text: v.string(),
    voiceId: v.string(),
    speed: v.optional(v.number()),
    pitch: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    if (!FAL_KEY) {
      throw new Error("FAL_KEY not configured")
    }

    try {
      console.log('[NarrationGen] Generating narration with MiniMax Speech-02 Turbo')

      const response = await fetch('https://queue.fal.run/fal-ai/minimax/speech-02-turbo', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            text: args.text,
            voice_id: args.voiceId,
            speed: args.speed || 1.0,
            pitch: args.pitch || 1.0,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Narration API error: ${response.status} - ${error}`)
      }

      const result = await response.json()
      const audioUrl = result.audio.url

      // Download and store
      const audioResponse = await fetch(audioUrl)
      const audioBlob = await audioResponse.blob()
      const audioBuffer = await audioBlob.arrayBuffer()

      const storageId = await ctx.storage.store(
        new Blob([audioBuffer], { type: 'audio/mpeg' })
      )

      // Save narration metadata
      const narrationId = await ctx.runMutation(api.narration.create, {
        projectId: args.projectId,
        storageId,
        text: args.text,
        voiceId: args.voiceId,
        userId: identity.subject,
      })

      return {
        success: true,
        narrationId,
        storageId,
        audioUrl: await ctx.storage.getUrl(storageId),
      }
    } catch (error) {
      console.error('[NarrationGen] Error:', error)
      throw error
    }
  },
})
\`\`\`

---

### **Phase 6: Video Assembly & Final Render** (4-5 hours)


#### **6.1 Implement Video Assembly** (3-4 hours)

**File**: `convex/actions/videoAssembly.ts`

\`\`\`typescript
"use node"

import { v } from "convex/values"
import { action } from "../_generated/server"
import { api } from "../_generated/api"

const FAL_KEY = process.env.FAL_KEY

/**
 * Complete video assembly workflow:
 * Step 1: Merge 3 scene videos together
 * Step 2: Merge video with narration audio
 * Step 3: Merge video+narration with music audio
 */
export const assembleFinalVideo = action({
  args: {
    projectId: v.id("projects"),
    sceneVideoIds: v.array(v.id("_storage")), // 3 scene videos
    narrationId: v.id("_storage"),
    musicId: v.id("_storage"),
    narrationVolume: v.optional(v.number()),
    musicVolume: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    if (!FAL_KEY) {
      throw new Error("FAL_KEY not configured")
    }

    try {
      console.log('[VideoAssembly] Starting final video assembly')

      // Step 1: Merge 3 scene videos
      console.log('[VideoAssembly] Step 1: Merging scene videos')
      const sceneVideoUrls = await Promise.all(
        args.sceneVideoIds.map(id => ctx.storage.getUrl(id))
      )

      const mergedVideoUrl = await mergeVideos(sceneVideoUrls)

      // Step 2: Add narration
      console.log('[VideoAssembly] Step 2: Adding narration')
      const narrationUrl = await ctx.storage.getUrl(args.narrationId)
      const videoWithNarrationUrl = await mergeAudioVideo(
        mergedVideoUrl,
        narrationUrl,
        args.narrationVolume || 0.8
      )

      // Step 3: Add music
      console.log('[VideoAssembly] Step 3: Adding background music')
      const musicUrl = await ctx.storage.getUrl(args.musicId)
      const finalVideoUrl = await mergeAudioVideo(
        videoWithNarrationUrl,
        musicUrl,
        args.musicVolume || 0.3
      )

      // Download final video
      console.log('[VideoAssembly] Downloading final video...')
      const finalVideoResponse = await fetch(finalVideoUrl)
      if (!finalVideoResponse.ok) {
        throw new Error(`Failed to download final video: ${finalVideoResponse.status}`)
      }
      const finalVideoBlob = await finalVideoResponse.blob()
      const finalVideoBuffer = await finalVideoBlob.arrayBuffer()

      // Store final video
      console.log('[VideoAssembly] Storing final video...')
      const finalStorageId = await ctx.storage.store(
        new Blob([finalVideoBuffer], { type: 'video/mp4' })
      )

      // Update project with final video
      await ctx.runMutation(api.projects.updateFinalVideo, {
        projectId: args.projectId,
        finalVideoId: finalStorageId,
      })

      console.log('[VideoAssembly] Final video assembly complete!')

      return {
        success: true,
        finalVideoId: finalStorageId,
        finalVideoUrl: await ctx.storage.getUrl(finalStorageId),
      }
    } catch (error) {
      console.error('[VideoAssembly] Error:', error)
      throw error
    }
  },
})

async function mergeVideos(videoUrls: string[]): Promise<string> {
  console.log('[VideoAssembly] Calling Rendi merge-videos API')
  const response = await fetch('https://api.rendi.dev/v1/run-ffmpeg-command', {
    method: 'POST',
    headers: {
      'X-API-KEY': RENDI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ffmpeg_command: '-i {{in_scene1}} -i {{in_scene2}} -filter_complex "[0:v][1:v]xfade=transition=circleopen:duration=1:offset=9,format=yuv420p[out]" -map "[out]" -c:v libx264 -y {{out_video}}',
      input_files: { in_scene1: videoUrls[0], in_scene2: videoUrls[1] },
      output_files: { out_video: 'merged.mp4' },
      vcpu_count: 8,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Rendi merge-videos error: ${response.status} - ${error}`)
  }

  const result = await response.json()
  // ... poll status
  return result.output_files.out_video.storage_url
}

async function mergeAudioVideo(
  videoUrl: string,
  audioUrl: string
): Promise<string> {
  console.log('[VideoAssembly] Calling Rendi final-merge API')
  const response = await fetch('https://api.rendi.dev/v1/run-ffmpeg-command', {
    method: 'POST',
    headers: {
      'X-API-KEY': RENDI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ffmpeg_command: '-i {{in_video}} -i {{in_audio}} -c:v copy -c:a aac -b:a 192k -shortest {{out_final}}',
      input_files: { in_video: videoUrl, in_audio: audioUrl },
      output_files: { out_final: 'final.mp4' },
      vcpu_count: 4,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Rendi final-merge error: ${response.status} - ${error}`)
  }

  const result = await response.json()
  // ... poll status
  return result.output_files.out_final.storage_url
}
\`\`\`

---

### **Phase 7: File Storage Migration** (3-4 hours)

#### **3.1 Implement Convex File Upload** (90 min)

**File**: `convex/mutations/assets.ts`

\`\`\`typescript
import { v } from "convex/values"
import { mutation } from "../_generated/server"

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    return await ctx.storage.generateUploadUrl()
  },
})

export const saveAsset = mutation({
  args: {
    storageId: v.id("_storage"),
    projectId: v.id("projects"),
    sceneId: v.optional(v.id("scenes")),
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    assetType: v.union(v.literal("uploaded"), v.literal("generated"), v.literal("edited")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const assetId = await ctx.db.insert("assets", {
      storageId: args.storageId,
      projectId: args.projectId,
      sceneId: args.sceneId,
      userId: identity.subject,
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileType: args.fileType,
      assetType: args.assetType,
      createdAt: Date.now(),
    })

    return assetId
  },
})

export const deleteAsset = mutation({
  args: {
    assetId: v.id("assets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const asset = await ctx.db.get(args.assetId)
    if (!asset) throw new Error("Asset not found")

    // Verify ownership
    if (asset.userId !== identity.subject) {
      throw new Error("Not authorized to delete this asset")
    }

    // Delete from storage
    await ctx.storage.delete(asset.storageId)

    // Delete from database
    await ctx.db.delete(args.assetId)

    return { success: true }
  },
})
\`\`\`

---

#### **3.2 Create Upload Hook** (60 min)

**File**: `hooks/business-logic/useAssetUpload.ts`

\`\`\`typescript
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useState } from 'react'

export function useAssetUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl)
  const saveAsset = useMutation(api.assets.saveAsset)

  const uploadAsset = async (
    file: File,
    projectId: string,
    sceneId?: string,
    assetType: 'uploaded' | 'generated' | 'edited' = 'uploaded'
  ) => {
    setUploading(true)
    setProgress(0)

    try {
      // Step 1: Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are supported')
      }

      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB')
      }

      setProgress(10)

      // Step 2: Get upload URL
      const uploadUrl = await generateUploadUrl()
      setProgress(30)

      // Step 3: Upload file to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      }

      const { storageId } = await uploadResponse.json()
      setProgress(70)

      // Step 4: Save asset metadata
      const assetId = await saveAsset({
        storageId,
        projectId,
        sceneId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        assetType,
      })

      setProgress(100)

      return {
        success: true,
        assetId,
        storageId,
      }

    } catch (error) {
      console.error('[AssetUpload] Error:', error)
      throw error
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const uploadMultipleAssets = async (
    files: FileList,
    projectId: string,
    sceneId?: string,
    assetType: 'uploaded' | 'generated' | 'edited' = 'uploaded'
  ) => {
    const results = []

    for (let i = 0; i < files.length; i++) {
      const result = await uploadAsset(files[i], projectId, sceneId, assetType)
      results.push(result)
    }

    return results
  }

  return {
    uploadAsset,
    uploadMultipleAssets,
    uploading,
    progress,
  }
}
\`\`\`

---

#### **3.3 Update Upload Components** (60 min)

**File**: `components/asset-management/AssetUploader.tsx`

\`\`\`typescript
'use client'

import { useAssetUpload } from '@/hooks/business-logic/useAssetUpload'
import { useCallback } from 'react'
import { toast } from 'sonner' // Assuming you have a toast library
import { UploadIcon } from 'lucide-react' // Assuming you have lucide-react

interface AssetUploaderProps {
  projectId: string
  sceneId?: string
  assetType?: 'uploaded' | 'generated' | 'edited'
  onUploadComplete?: (assetId: string) => void
}

export function AssetUploader({ 
  projectId, 
  sceneId, 
  assetType = 'uploaded',
  onUploadComplete 
}: AssetUploaderProps) {
  const { uploadAsset, uploading, progress } = useAssetUpload()

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      const result = await uploadAsset(files[0], projectId, sceneId, assetType)
      
      toast.success('Asset uploaded successfully!')
      
      onUploadComplete?.(result.assetId)
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    }
  }, [projectId, sceneId, uploadAsset, assetType, onUploadComplete])

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        id="file-upload"
      />
      
      <label
        htmlFor="file-upload"
        className="cursor-pointer flex flex-col items-center"
      >
        {uploading ? (
          <div className="w-full">
            <p className="text-center mb-2">Uploading... {progress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <UploadIcon className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-gray-600">Click to upload image</p>
            <p className="text-sm text-gray-400 mt-1">Max 10MB</p>
          </>
        )}
      </label>
    </div>
  )
}
\`\`\`

---

### **Phase 4: Music Generation** (3-4 hours)

#### **4.1 Implement Music Generation** (2-3 hours)

**File**: `convex/actions/musicGeneration.ts`

\`\`\`typescript
"use node"

import { v } from "convex/values"
import { action } from "../_generated/server"
import { api } from "../_generated/api"

const FAL_KEY = process.env.FAL_KEY

const MUSIC_MODELS = {
  primary: "fal-ai/stable-audio-25/text-to-audio",
  fallback: "fal-ai/minimax-music",
}

export const generateMusic = action({
  args: {
    projectId: v.id("projects"),
    prompt: v.string(),
    duration: v.optional(v.number()), // Up to 190 seconds for Stable Audio 2.5
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    if (!FAL_KEY) {
      throw new Error("FAL_KEY not configured")
    }

    try {
      console.log('[MusicGen] Generating music with Stable Audio 2.5')

      // Try primary model (Stable Audio 2.5)
      let result
      try {
        result = await generateMusicWithFal(
          MUSIC_MODELS.primary,
          {
            prompt: args.prompt,
            seconds_total: args.duration || 30,
          }
        )
      } catch (primaryError) {
        console.warn('[MusicGen] Stable Audio 2.5 failed, trying MiniMax Music')
        
        // Fallback to MiniMax Music
        result = await generateMusicWithFal(
          MUSIC_MODELS.fallback,
          {
            prompt: args.prompt,
            duration: args.duration || 30,
          }
        )
      }

      const audioUrl = result.audio.url

      // Download and store
      const audioResponse = await fetch(audioUrl)
      const audioBlob = await audioResponse.blob()
      const audioBuffer = await audioBlob.arrayBuffer()

      const storageId = await ctx.storage.store(
        new Blob([audioBuffer], { type: 'audio/mpeg' })
      )

      // Save music track metadata
      const musicId = await ctx.runMutation(api.music.create, {
        projectId: args.projectId,
        storageId,
        prompt: args.prompt,
        duration: args.duration || 30,
        userId: identity.subject,
      })

      return {
        success: true,
        musicId,
        storageId,
        audioUrl: await ctx.storage.getUrl(storageId),
      }
    } catch (error) {
      console.error('[MusicGen] Error:', error)
      throw error
    }
  },
})

async function generateMusicWithFal(modelId: string, input: any) {
  const response = await fetch(`https://queue.fal.run/${modelId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`fal.ai Music API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  
  // fal.ai uses queue system - get request_id
  const requestId = data.request_id

  // Poll for completion
  let attempts = 0
  const maxAttempts = 60 // 1 minute max
  
  while (attempts < maxAttempts) {
    attempts++
    await new Promise(resolve => setTimeout(resolve, 1000))

    const statusResponse = await fetch(`https://queue.fal.run/${modelId}/requests/${requestId}`, {
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
      },
    })

    if (!statusResponse.ok) continue

    const statusData = await statusResponse.json()

    if (statusData.status === 'COMPLETED') {
      return statusData.output
    }

    if (statusData.status === 'FAILED') {
      throw new Error(`fal.ai music generation failed: ${statusData.error}`)
    }
  }

  throw new Error('fal.ai music generation timed out')
}
\`\`\`

---

### **Phase 5: Narration (Text-to-Speech)** (2-3 hours)


#### **5.1 Implement Narration Generation** (2 hours)

**File**: `convex/actions/narrationGeneration.ts`

\`\`\`typescript
"use node"

import { v } from "convex/values"
import { action } from "../_generated/server"
import { api } from "../_generated/api"

const FAL_KEY = process.env.FAL_KEY

export const generateNarration = action({
  args: {
    projectId: v.id("projects"),
    text: v.string(),
    voiceId: v.string(),
    speed: v.optional(v.number()),
    pitch: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    if (!FAL_KEY) {
      throw new Error("FAL_KEY not configured")
    }

    try {
      console.log('[NarrationGen] Generating narration with MiniMax Speech-02 Turbo')

      const response = await fetch('https://queue.fal.run/fal-ai/minimax/speech-02-turbo', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            text: args.text,
            voice_id: args.voiceId,
            speed: args.speed || 1.0,
            pitch: args.pitch || 1.0,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Narration API error: ${response.status} - ${error}`)
      }

      const result = await response.json()
      const audioUrl = result.audio.url

      // Download and store
      const audioResponse = await fetch(audioUrl)
      const audioBlob = await audioResponse.blob()
      const audioBuffer = await audioBlob.arrayBuffer()

      const storageId = await ctx.storage.store(
        new Blob([audioBuffer], { type: 'audio/mpeg' })
      )

      // Save narration metadata
      const narrationId = await ctx.runMutation(api.narration.create, {
        projectId: args.projectId,
        storageId,
        text: args.text,
        voiceId: args.voiceId,
        userId: identity.subject,
      })

      return {
        success: true,
        narrationId,
        storageId,
        audioUrl: await ctx.storage.getUrl(storageId),
      }
    } catch (error) {
      console.error('[NarrationGen] Error:', error)
      throw error
    }
  },
})
\`\`\`

---

### **Phase 6: Video Assembly & Final Render** (4-5 hours)


#### **6.1 Implement Video Assembly** (3-4 hours)

**File**: `convex/actions/videoAssembly.ts`

\`\`\`typescript
"use node"

import { v } from "convex/values"
import { action } from "../_generated/server"
import { api } from "../_generated/api"

const FAL_KEY = process.env.FAL_KEY

/**
 * Complete video assembly workflow:
 * Step 1: Merge 3 scene videos together
 * Step 2: Merge video with narration audio
 * Step 3: Merge video+narration with music audio
 */
export const assembleFinalVideo = action({
  args: {
    projectId: v.id("projects"),
    sceneVideoIds: v.array(v.id("_storage")), // 3 scene videos
    narrationId: v.id("_storage"),
    musicId: v.id("_storage"),
    narrationVolume: v.optional(v.number()),
    musicVolume: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    if (!FAL_KEY) {
      throw new Error("FAL_KEY not configured")
    }

    try {
      console.log('[VideoAssembly] Starting final video assembly')

      // Step 1: Merge 3 scene videos
      console.log('[VideoAssembly] Step 1: Merging scene videos')
      const sceneVideoUrls = await Promise.all(
        args.sceneVideoIds.map(id => ctx.storage.getUrl(id))
      )

      const mergedVideoUrl = await mergeVideos(sceneVideoUrls)

      // Step 2: Add narration
      console.log('[VideoAssembly] Step 2: Adding narration')
      const narrationUrl = await ctx.storage.getUrl(args.narrationId)
      const videoWithNarrationUrl = await mergeAudioVideo(
        mergedVideoUrl,
        narrationUrl,
        args.narrationVolume || 0.8
      )

      // Step 3: Add music
      console.log('[VideoAssembly] Step 3: Adding background music')
      const musicUrl = await ctx.storage.getUrl(args.musicId)
      const finalVideoUrl = await mergeAudioVideo(
        videoWithNarrationUrl,
        musicUrl,
        args.musicVolume || 0.3
      )

      // Download final video
      console.log('[VideoAssembly] Downloading final video...')
      const finalVideoResponse = await fetch(finalVideoUrl)
      if (!finalVideoResponse.ok) {
        throw new Error(`Failed to download final video: ${finalVideoResponse.status}`)
      }
      const finalVideoBlob = await finalVideoResponse.blob()
      const finalVideoBuffer = await finalVideoBlob.arrayBuffer()

      // Store final video
      console.log('[VideoAssembly] Storing final video...')
      const finalStorageId = await ctx.storage.store(
        new Blob([finalVideoBuffer], { type: 'video/mp4' })
      )

      // Update project with final video
      await ctx.runMutation(api.projects.updateFinalVideo, {
        projectId: args.projectId,
        finalVideoId: finalStorageId,
      })

      console.log('[VideoAssembly] Final video assembly complete!')

      return {
        success: true,
        finalVideoId: finalStorageId,
        finalVideoUrl: await ctx.storage.getUrl(finalStorageId),
      }
    } catch (error) {
      console.error('[VideoAssembly] Error:', error)
      throw error
    }
  },
})

async function mergeVideos(videoUrls: string[]): Promise<string> {
  console.log('[VideoAssembly] Calling Rendi merge-videos API')
  const response = await fetch('https://api.rendi.dev/v1/run-ffmpeg-command', {
    method: 'POST',
    headers: {
      'X-API-KEY': RENDI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ffmpeg_command: '-i {{in_scene1}} -i {{in_scene2}} -filter_complex "[0:v][1:v]xfade=transition=circleopen:duration=1:offset=9,format=yuv420p[out]" -map "[out]" -c:v libx264 -y {{out_video}}',
      input_files: { in_scene1: videoUrls[0], in_scene2: videoUrls[1] },
      output_files: { out_video: 'merged.mp4' },
      vcpu_count: 8,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Rendi merge-videos error: ${response.status} - ${error}`)
  }

  const result = await response.json()
  // ... poll status
  return result.output_files.out_video.storage_url
}

async function mergeAudioVideo(
  videoUrl: string,
  audioUrl: string
): Promise<string> {
  console.log('[VideoAssembly] Calling Rendi final-merge API')
  const response = await fetch('https://api.rendi.dev/v1/run-ffmpeg-command', {
    method: 'POST',
    headers: {
      'X-API-KEY': RENDI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ffmpeg_command: '-i {{in_video}} -i {{in_audio}} -c:v copy -c:a aac -b:a 192k -shortest {{out_final}}',
      input_files: { in_video: videoUrl, in_audio: audioUrl },
      output_files: { out_final: 'final.mp4' },
      vcpu_count: 4,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Rendi final-merge error: ${response.status} - ${error}`)
  }

  const result = await response.json()
  // ... poll status
  return result.output_files.out_final.storage_url
}
\`\`\`

---

### **Phase 7: File Storage Migration** (3-4 hours)

#### **3.1 Implement Convex File Upload** (90 min)

**File**: `convex/mutations/assets.ts`

\`\`\`typescript
import { v } from "convex/values"
import { mutation } from "../_generated/server"

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    return await ctx.storage.generateUploadUrl()
  },
})

export const saveAsset = mutation({
  args: {
    storageId: v.id("_storage"),
    projectId: v.id("projects"),
    sceneId: v.optional(v.id("scenes")),
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    assetType: v.union(v.literal("uploaded"), v.literal("generated"), v.literal("edited")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const assetId = await ctx.db.insert("assets", {
      storageId: args.storageId,
      projectId: args.projectId,
      sceneId: args.sceneId,
      userId: identity.subject,
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileType: args.fileType,
      assetType: args.assetType,
      createdAt: Date.now(),
    })

    return assetId
  },
})

export const deleteAsset = mutation({
  args: {
    assetId: v.id("assets"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const asset = await ctx.db.get(args.assetId)
    if (!asset) throw new Error("Asset not found")

    // Verify ownership
    if (asset.userId !== identity.subject) {
      throw new Error("Not authorized to delete this asset")
    }

    // Delete from storage
    await ctx.storage.delete(asset.storageId)

    // Delete from database
    await ctx.db.delete(args.assetId)

    return { success: true }
  },
})
\`\`\`

---

#### **3.2 Create Upload Hook** (60 min)

**File**: `hooks/business-logic/useAssetUpload.ts`

\`\`\`typescript
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useState } from 'react'

export function useAssetUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl)
  const saveAsset = useMutation(api.assets.saveAsset)

  const uploadAsset = async (
    file: File,
    projectId: string,
    sceneId?: string,
    assetType: 'uploaded' | 'generated' | 'edited' = 'uploaded'
  ) => {
    setUploading(true)
    setProgress(0)

    try {
      // Step 1: Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are supported')
      }

      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB')
      }

      setProgress(10)

      // Step 2: Get upload URL
      const uploadUrl = await generateUploadUrl()
      setProgress(30)

      // Step 3: Upload file to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      }

      const { storageId } = await uploadResponse.json()
      setProgress(70)

      // Step 4: Save asset metadata
      const assetId = await saveAsset({
        storageId,
        projectId,
        sceneId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        assetType,
      })

      setProgress(100)

      return {
        success: true,
        assetId,
        storageId,
      }

    } catch (error) {
      console.error('[AssetUpload] Error:', error)
      throw error
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const uploadMultipleAssets = async (
    files: FileList,
    projectId: string,
    sceneId?: string,
    assetType: 'uploaded' | 'generated' | 'edited' = 'uploaded'
  ) => {
    const results = []

    for (let i = 0; i < files.length; i++) {
      const result = await uploadAsset(files[i], projectId, sceneId, assetType)
      results.push(result)
    }

    return results
  }

  return {
    uploadAsset,
    uploadMultipleAssets,
    uploading,
    progress,
  }
}
\`\`\`

---

#### **3.3 Update Upload Components** (60 min)

**File**: `components/asset-management/AssetUploader.tsx`

\`\`\`typescript
'use client'

import { useAssetUpload } from '@/hooks/business-logic/useAssetUpload'
import { useCallback } from 'react'
import { toast } from 'sonner' // Assuming you have a toast library
import { UploadIcon } from 'lucide-react' // Assuming you have lucide-react

interface AssetUploaderProps {
  projectId: string
  sceneId?: string
  assetType?: 'uploaded' | 'generated' | 'edited'
  onUploadComplete?: (assetId: string) => void
}

export function AssetUploader({ 
  projectId, 
  sceneId, 
  assetType = 'uploaded',
  onUploadComplete 
}: AssetUploaderProps) {
  const { uploadAsset, uploading, progress } = useAssetUpload()

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      const result = await uploadAsset(files[0], projectId, sceneId, assetType)
      
      toast.success('Asset uploaded successfully!')
      
      onUploadComplete?.(result.assetId)
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    }
  }, [projectId, sceneId, uploadAsset, assetType, onUploadComplete])

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        id="file-upload"
      />
      
      <label
        htmlFor="file-upload"
        className="cursor-pointer flex flex-col items-center"
      >
        {uploading ? (
          <div className="w-full">
            <p className="text-center mb-2">Uploading... {progress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <UploadIcon className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-gray-600">Click to upload image</p>
            <p className="text-sm text-gray-400 mt-1">Max 10MB</p>
          </>
        )}
      </label>
    </div>
  )
}
\`\`\`

---

### **Phase 4: Music Generation** (3-4 hours)

#### **4.1 Implement Music Generation** (2-3 hours)

**File**: `convex/actions/musicGeneration.ts`

\`\`\`typescript
"use node"

import { v } from "convex/values"
import { action } from "../_generated/server"
import { api } from "../_generated/api"

const FAL_KEY = process.env.FAL_KEY

const MUSIC_MODELS = {
  primary: "fal-ai/stable-audio-25/text-to-audio",
  fallback: "fal-ai/minimax-music",
}

export const generateMusic = action({
  args: {
    projectId: v.id("projects"),
    prompt: v.string(),
    duration: v.optional(v.number()), // Up to 190 seconds for Stable Audio 2.5
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    if (!FAL_KEY) {
      throw new Error("FAL_KEY not configured")
    }

    try {
      console.log('[MusicGen] Generating music with Stable Audio 2.5')

      // Try primary model (Stable Audio 2.5)
      let result
      try {
        result = await generateMusicWithFal(
          MUSIC_MODELS.primary,
          {
            prompt: args.prompt,
            seconds_total: args.duration || 30,
          }
        )
      } catch (primaryError) {
        console.warn('[MusicGen] Stable Audio 2.5 failed, trying MiniMax Music')
        
        // Fallback to MiniMax Music
        result = await generateMusicWithFal(
          MUSIC_MODELS.fallback,
          {
            prompt: args.prompt,
            duration: args.duration || 30,
          }
        )
      }

      const audioUrl = result.audio.url

      // Download and store
      const audioResponse = await fetch(audioUrl)
      const audioBlob = await audioResponse.blob()
      const audioBuffer = await audioBlob.arrayBuffer()

      const storageId = await ctx.storage.store(
        new Blob([audioBuffer], { type: 'audio/mpeg' })
      )

      // Save music track metadata
      const musicId = await ctx.runMutation(api.music.create, {
        projectId: args.projectId,
        storageId,
        prompt: args.prompt,
        duration: args.duration || 30,
        userId: identity.subject,
      })

      return {
        success: true,
        musicId,
        storageId,
        audioUrl: await ctx.storage.getUrl(storageId),
      }
    } catch (error) {
      console.error('[MusicGen] Error:', error)
      throw error
    }
  },
})

async function generateMusicWithFal(modelId: string, input: any) {
  const response = await fetch(`https://queue.fal.run/${modelId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`fal.ai Music API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  
  // fal.ai uses queue system - get request_id
  const requestId = data.request_id

  // Poll for completion
  let attempts = 0
  const maxAttempts = 60 // 1 minute max
  
  while (attempts < maxAttempts) {
    attempts++
    await new Promise(resolve => setTimeout(resolve, 1000))

    const statusResponse = await fetch(`https://queue.fal.run/${modelId}/requests/${requestId}`, {
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
      },
    })

    if (!statusResponse.ok) continue

    const statusData = await statusResponse.json()

    if (statusData.status === 'COMPLETED') {
      return statusData.output
    }

    if (statusData.status === 'FAILED') {
      throw new Error(`fal.ai music generation failed: ${statusData.error}`)
    }
  }

  throw new Error('fal.ai music generation timed out')
}
\`\`\`

---

### **Phase 5: Narration (Text-to-Speech)** (2-3 hours)

#### **5.1 Implement Narration Generation** (2 hours)

**File**: `convex/actions/narrationGeneration.ts`

\`\`\`typescript
"use node"

import { v } from "convex/values"
import { action } from "../_generated/server"
import { api } from "../_generated/api"

const FAL_KEY = process.env.FAL_KEY

export const generateNarration = action({
  args: {
    projectId: v.id("projects"),
    text: v.string(),
    voiceId: v.string(),
    speed: v.optional(v.number()),
    pitch: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    if (!FAL_KEY) {
      throw new Error("FAL_KEY not configured")
    }

    try {
      console.log('[NarrationGen] Generating narration with MiniMax Speech-02 Turbo')

      const response = await fetch('https://queue.fal.run/fal-ai/minimax/speech-02-turbo', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            text: args.text,
            voice_id: args.voiceId,
            speed: args.speed || 1.0,
            pitch: args.pitch || 1.0,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Narration API error: ${response.status} - ${error}`)
      }

      const result = await response.json()
      const audioUrl = result.audio.url

      // Download and store
      const audioResponse = await fetch(audioUrl)
      const audioBlob = await audioResponse.blob()
      const audioBuffer = await audioBlob.arrayBuffer()

      const storageId = await ctx.storage.store(
        new Blob([audioBuffer], { type: 'audio/mpeg' })
      )

      // Save narration metadata
      const narrationId = await ctx.runMutation(api.narration.create, {
        projectId: args.projectId,
        storageId,
        text: args.text,
        voiceId: args.voiceId,
        userId: identity.subject,
      })

      return {
        success: true,
        narrationId,
        storageId,
        audioUrl: await ctx.storage.getUrl(storageId),
      }
    } catch (error) {
      console.error('[NarrationGen] Error:', error)
      throw error
    }
  },
})
\`\`\`

---

### **Phase 6: Video Assembly & Final Render** (4-5 hours)

#### **6.1 Implement Video Assembly** (3-4 hours)

**File**: `convex/actions/videoAssembly.ts`

\`\`\`typescript
"use node"

import { v } from "convex/values"
import { action } from "../_generated/server"
import { api } from "../_generated/api"

const FAL_KEY = process.env.FAL_KEY

/**
 * Complete video assembly workflow:
 * Step 1: Merge 3 scene videos together
 * Step 2: Merge video with narration audio
 * Step 3: Merge video+narration with music audio
 */
export const assembleFinalVideo = action({
  args: {
    projectId: v.id("projects"),
    sceneVideoIds: v.array(v.id("_storage")), // 3 scene videos
    narrationId: v.id("_storage"),
    musicId: v.id("_storage"),
    narrationVolume: v.optional(v.number()),
    musicVolume: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    if (!FAL_KEY) {
      throw new Error("FAL_KEY not configured")
    }

    try {
      console.log('[VideoAssembly] Starting final video assembly')

      // Step 1: Merge 3 scene videos
      console.log('[VideoAssembly] Step 1: Merging scene videos')
      const sceneVideoUrls = await Promise.all(
        args.sceneVideoIds.map(id => ctx.storage.getUrl(id))
      )

      const mergedVideoUrl = await mergeVideos(sceneVideoUrls)

      // Step 2: Add narration
      console.log('[VideoAssembly] Step 2: Adding narration')
      const narrationUrl = await ctx.storage.getUrl(args.narrationId)
      const videoWithNarrationUrl = await mergeAudioVideo(
        mergedVideoUrl,
        narrationUrl,
        args.narrationVolume || 0.8
      )

      // Step 3: Add music
      console.log('[VideoAssembly] Step 3: Adding background music')
      const musicUrl = await ctx.storage.getUrl(args.musicId)
      const finalVideoUrl = await mergeAudioVideo(
        videoWithNarrationUrl,
        musicUrl,
        args.musicVolume || 0.3
      )

      // Download final video
      console.log('[VideoAssembly] Downloading final video...')
      const finalVideoResponse = await fetch(finalVideoUrl)
      if (!finalVideoResponse.ok) {
        throw new Error(`Failed to download final video: ${finalVideoResponse.status}`)
      }
      const finalVideoBlob = await finalVideoResponse.blob()
      const finalVideoBuffer = await finalVideoBlob.arrayBuffer()

      // Store final video
      console.log('[VideoAssembly] Storing final video...')
      const finalStorageId = await ctx.storage.store(
        new Blob([finalVideoBuffer], { type: 'video/mp4' })
      )

      // Update project with final video
      await ctx.runMutation(api.projects.updateFinalVideo, {
        projectId: args.projectId,
        finalVideoId: finalStorageId,
      })

      console.log('[VideoAssembly] Final video assembly complete!')

      return {
        success: true,
        finalVideoId: finalStorageId,
        finalVideoUrl: await ctx.storage.getUrl(finalStorageId),
      }
    } catch (error) {
      console.error('[VideoAssembly] Error:', error)
      throw error
    }
  },
})

async function mergeVideos(videoUrls: string[]): Promise<string> {
  console.log('[VideoAssembly] Calling Rendi merge-videos API')
  const response = await fetch('https://api.rendi.dev/v1/run-ffmpeg-command', {
    method: 'POST',
    headers: {
      'X-API-KEY': RENDI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ffmpeg_command: '-i {{in_scene1}} -i {{in_scene2}} -filter_complex "[0:v][1:v]xfade=transition=circleopen:duration=1:offset=9,format=yuv420p[out]" -map "[out]" -c:v libx264 -y {{out_video}}',
      input_files: { in_scene1: videoUrls[0], in_scene2: videoUrls[1] },
      output_files: { out_video: 'merged.mp4' },
      vcpu_count: 8,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Rendi merge-videos error: ${response.status} - ${error}`)
  }

  const result = await response.json()
  // ... poll status
  return result.output_files.out_video.storage_url
}

async function mergeAudioVideo(
  videoUrl: string,
  audioUrl: string
): Promise<string> {
  console.log('[VideoAssembly] Calling Rendi final-merge API')
  const response = await fetch('https://api.rendi.dev/v1/run-ffmpeg-command', {
    method: 'POST',
    headers: {
      'X-API-KEY': RENDI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ffmpeg_command: '-i {{in_video}} -i {{in_audio}} -c:v copy -c:a aac -b:a 192k -shortest {{out_final}}',
      input_files: { in_video: videoUrl, in_audio: audioUrl },
      output_files: { out_final: 'final.mp4' },
      vcpu_count: 4,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Rendi final-merge error: ${response.status} - ${error}`)
  }

  const result = await response.json()
  // ... poll status
  return result.output_files.out_final.storage_url
}
\`\`\`

---

### **Phase 8: Error Handling & Monitoring** (2-3 hours)

#### **5.1 Add Comprehensive Error Handling** (90 min)

**File**: `lib/errors/aiErrors.ts`

\`\`\`typescript
export class AIServiceError extends Error {
  constructor(
    message: string,
    public service: 'openai' | 'runway' | 'kling' | 'dalle' | 'fal',
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'AIServiceError'
  }
}

export class RateLimitError extends AIServiceError {
  constructor(service: AIServiceError['service']) {
    super(
      `Rate limit exceeded for ${service}. Please try again later.`,
      service,
      429,
      true
    )
    this.name = 'RateLimitError'
  }
}

export class QuotaExceededError extends AIServiceError {
  constructor(service: AIServiceError['service']) {
    super(
      `API quota exceeded for ${service}. Please check your billing.`,
      service,
      402,
      false
    )
    this.name = 'QuotaExceededError'
  }
}

export function handleAIError(error: unknown, service: AIServiceError['service']) {
  if (error instanceof Response) {
    if (error.status === 429) {
      return new RateLimitError(service)
    }
    if (error.status === 402 || error.status === 403) {
      return new QuotaExceededError(service)
    }
    return new AIServiceError(
      `${service} API error: ${error.statusText}`,
      service,
      error.status,
      error.status >= 500 // Server errors are retryable
    )
  }

  if (error instanceof Error) {
    return new AIServiceError(error.message, service)
  }

  return new AIServiceError('Unknown error', service)
}
\`\`\`

---

#### **5.2 Add Retry Logic** (60 min)

**File**: `lib/utils/retry.ts`

\`\`\`typescript
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      // Don't retry if not retryable
      if (error instanceof AIServiceError && !error.retryable) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        break
      }

      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = initialDelay * Math.pow(2, attempt)
      console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}
\`\`\`

**Usage in Convex actions**:

\`\`\`typescript
import { retryWithBackoff } from '@/lib/utils/retry'
import { handleAIError } from '@/lib/errors/aiErrors'

export const generateVideo = action({
  handler: async (ctx, args) => {
    const service = 'runway' as const // Or 'kling' based on provider

    const submitResponse = await retryWithBackoff(
      async () => {
        const response = await fetch(`${RUNWAY_API_URL}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RUNWAY_API_KEY}`,
          },
          body: JSON.stringify({ /* ... */ }),
        });
        if (!response.ok) {
          throw handleAIError(response, service);
        }
        return response.json();
      },
      3, // max 3 retries
      2000 // start with 2s delay
    );

    // ... rest of code ...
  },
})
\`\`\`

---

#### **5.3 Add Monitoring & Analytics** (60 min)

**File**: `lib/monitoring/aiAnalytics.ts`

\`\`\`typescript
import { trackEvent } from './analytics' // Assuming you have a global analytics tracker

export function trackAIUsage(
  service: 'openai' | 'runway' | 'kling' | 'dalle' | 'fal',
  operation: string,
  metadata: {
    success: boolean
    duration?: number
    tokensUsed?: number
    cost?: number
    error?: string
    sceneId?: string // Add context
    projectId?: string // Add context
  }
) {
  trackEvent('ai_service_usage', {
    service,
    operation,
    ...metadata,
  })

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AI Analytics] ${service}.${operation}:`, metadata)
  }
}

export function calculateCost(
  service: 'openai' | 'runway' | 'kling' | 'dalle' | 'fal',
  usage: {
    tokensUsed?: number // For OpenAI
    videoSeconds?: number // For video generation
    imageCount?: number // For image generation
    imageSeconds?: number // For fal.ai image generation
    musicSeconds?: number // For fal.ai music generation
    narrationWords?: number // For fal.ai narration
    assemblyOperations?: number // For fal.ai video assembly
  }
): number {
  const PRICE_PER_TOKEN_KB = 0.00001 // Approx. for GPT-4o
  const PRICE_PER_VIDEO_SECOND = 0.05 // Runway Gen-3
  const PRICE_PER_MUSIC_SECOND = 0.001 // Stable Audio 2.5 approx.
  const PRICE_PER_NARRATION_100_WORDS = 0.02
  const PRICE_PER_IMAGE = 0.04 // Avg for fal.ai images
  const PRICE_PER_ASSEMBLY_OP = 0.03 // For fal.ai ffmpeg ops

  switch (service) {
    case 'openai':
      return (usage.tokensUsed || 0) * PRICE_PER_TOKEN_KB

    case 'runway':
      return (usage.videoSeconds || 0) * PRICE_PER_VIDEO_SECOND

    case 'kling':
      // Kling AI pricing varies by provider. Estimate $0.03/second.
      return (usage.videoSeconds || 0) * 0.03
      
    case 'fal':
      if (usage.imageCount) {
        return usage.imageCount * PRICE_PER_IMAGE
      }
      if (usage.musicSeconds) {
        return (usage.musicSeconds / 60) * PRICE_PER_MUSIC_SECOND * 60 // Convert seconds to match unit
      }
      if (usage.narrationWords) {
        return (usage.narrationWords / 100) * PRICE_PER_NARRATION_100_WORDS
      }
      if (usage.assemblyOperations) {
        return usage.assemblyOperations * PRICE_PER_ASSEMBLY_OP
      }
      return 0

    case 'dalle':
      // DALL-E 3 HD: $0.080 per image
      return (usage.imageCount || 0) * 0.08

    default:
      return 0
  }
}
\`\`\`

**Add to Convex actions**:

\`\`\`typescript
// Example for generateVideo with Kling
export const generateVideoWithKling = action({
  args: { videoId: v.id("videos"), sceneId: v.id("scenes") },
  handler: async (ctx, args) => {
    const startTime = Date.now()
    const service = 'kling' as const
    const scene = await ctx.runQuery(api.scenes.getById, { sceneId: args.sceneId })

    try {
      // ... video generation code ...
      const result = await ... // your Kling generation logic

      const duration = Date.now() - startTime
      const cost = calculateCost(service, { videoSeconds: scene?.duration || 0 })

      trackAIUsage(service, 'generateVideoWithKling', {
        success: true,
        duration,
        cost,
        sceneId: args.sceneId,
        projectId: scene?.projectId,
      })

      return result

    } catch (error) {
      const duration = Date.now() - startTime

      trackAIUsage(service, 'generateVideoWithKling', {
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        sceneId: args.sceneId,
        projectId: scene?.projectId,
      })

      throw error
    }
  },
})

// Example for generateFrameImage with fal.ai
export const generateFrameImage = action({
  args: { sceneId: v.id("scenes"), frameType: v.union(v.literal("start"), v.literal("end")), prompt: v.string() },
  handler: async (ctx, args) => {
    const startTime = Date.now()
    const service = "fal" as const
    const scene = await ctx.runQuery(api.scenes.getById, { sceneId: args.sceneId })

    try {
      // ... image generation code ...
      const result = await ... // your fal.ai generation logic

      const duration = Date.now() - startTime
      const cost = calculateCost(service, { imageCount: 1 }) 
      
      trackAIUsage(service, 'generateFrameImage', {
        success: true,
        duration,
        cost,
        sceneId: args.sceneId,
        projectId: scene?.projectId,
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      trackAIUsage(service, 'generateFrameImage', {
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        sceneId: args.sceneId,
        projectId: scene?.projectId,
      })

      throw error
    }
  },
})

// Example for assembleFinalVideo with fal.ai
export const assembleFinalVideo = action({
  args: { projectId: v.id("projects"), sceneVideoIds: v.array(v.id("_storage")), narrationId: v.id("_storage"), musicId: v.id("_storage") },
  handler: async (ctx, args) => {
    const startTime = Date.now()
    const service = "fal" as const

    try {
      // ... video assembly code ...
      const result = await ... // your assembly logic

      const duration = Date.now() - startTime
      const cost = calculateCost(service, { assemblyOperations: 3 }) // 3 operations: merge videos, add narration, add music

      trackAIUsage(service, 'assembleFinalVideo', {
        success: true,
        duration,
        cost,
        projectId: args.projectId,
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      trackAIUsage(service, 'assembleFinalVideo', {
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        projectId: args.projectId,
      })

      throw error
    }
  },
})
\`\`\`

---

### **Phase 9: Testing & Validation** (3-4 hours)

#### **6.1 Unit Tests for AI Services** (90 min)

**File**: `__tests__/services/aiChat.test.ts`

\`\`\`typescript
import { describe, it, expect, vi } from 'vitest'
import { generateChatResponse } from '@/services/aiChat'

describe('AI Chat Service', () => {
  it('should generate chat response', async () => {
    const response = await generateChatResponse('Hello', 'scene-1')
    
    expect(response).toBeDefined()
    expect(response.role).toBe('assistant')
    expect(response.content).toBeTruthy()
  })

  it('should handle errors gracefully', async () => {
    // Mock API failure
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API error'))

    await expect(
      generateChatResponse('Hello', 'scene-1')
    ).rejects.toThrow('API error')
  })

  it('should include scene context', async () => {
    const response = await generateChatResponse(
      'Make it more romantic',
      'scene-1',
      { sceneType: 'wedding' }
    )

    expect(response.content).toContain('romantic')
  })
})
\`\`\`

---

#### **6.2 Integration Tests** (90 min)

**File**: `__tests__/integration/videoGeneration.test.ts`

\`\`\`typescript
import { describe, it, expect } from 'vitest'
import { ConvexTestingHelper } from 'convex-test'
import { api } from '@/convex/_generated/api'

describe('Video Generation Integration', () => {
  it('should generate video end-to-end', async () => {
    const t = new ConvexTestingHelper()

    // Create test project
    const projectId = await t.mutation(api.projects.create, {
      title: 'Test Project',
    })

    // Create test scene
    const sceneId = await t.mutation(api.scenes.create, {
      projectId,
      title: 'Test Scene',
      description: 'A beautiful wedding scene',
      duration: 10,
    })

    // Upload test images
    const startFrameId = await t.uploadFile('test-start.jpg')
    const endFrameId = await t.uploadFile('test-end.jpg')

    await t.mutation(api.scenes.updateFrames, {
      sceneId,
      startFrameImageId: startFrameId,
      endFrameImageId: endFrameImageId,
    })

    // Create video record
    const videoId = await t.mutation(api.videos.create, {
      sceneId,
    })

    // Generate video (this will take 2-5 minutes in real API)
    const result = await t.action(api.videoGeneration.generateVideo, {
      videoId,
      sceneId,
    })

    expect(result.success).toBe(true)
    expect(result.videoFileId).toBeDefined()

    // Verify video record updated
    const video = await t.query(api.videos.getById, { videoId })
    expect(video.status).toBe('completed')
    expect(video.progress).toBe(100)
  }, 300000) // 5 minute timeout
})
\`\`\`

---

#### **6.3 Manual Testing Checklist**

**AI Chat**:
- [ ] Chat responds with relevant suggestions
- [ ] Tool calls update scene correctly
- [ ] Conversation history persists
- [ ] Error messages are user-friendly
- [ ] Streaming works smoothly

**Video Generation**:
- [ ] Video generates with correct frames
- [ ] Progress updates in real-time
- [ ] Generated video plays correctly
- [ ] Regeneration with feedback works
- [ ] Failed generations show error message

**File Upload**:
- [ ] Images upload successfully
- [ ] Progress bar updates correctly
- [ ] Uploaded images display immediately
- [ ] Large files (5-10MB) work
- [ ] Invalid files show error

**Image Generation**:
- [ ] Images generate with prompts
- [ ] Fallback model works
- [ ] Image editing works
- [ ] Images stored in Convex

**Music & Narration**:
- [ ] Music and narration generate successfully
- [ ] Audio plays correctly
- [ ] Fallback models work

**Video Assembly**:
- [ ] Scene videos merge correctly
- [ ] Audio layers are added with correct volumes
- [ ] Final video renders and plays correctly

**Cost Tracking**:
- [ ] AI usage logged correctly
- [ ] Cost calculations accurate
- [ ] Analytics dashboard shows data

---

### **Phase 10: Production Deployment** (2-3 hours)

#### **7.1 Environment Variables**

**Required for Production**:

\`\`\`env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev

# Convex
CONVEX_DEPLOYMENT=prod:your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Vercel AI Gateway (Recommended)
# No API key needed for OpenAI models

# Video Generation (fal.ai)
FAL_KEY=your_fal_key_id:your_fal_key_secret

# Image Generation (fal.ai)
# Uses same FAL_KEY

# Music & Narration Generation (fal.ai)
# Uses same FAL_KEY

# Video Assembly (fal.ai)
# Uses same FAL_KEY

# Optional: Monitoring
SENTRY_DSN=https://...
NEXT_PUBLIC_ANALYTICS_ID=...
\`\`\`

---

#### **7.2 Deployment Steps**

**1. Deploy Convex Backend**:

\`\`\`bash
# From project root
npx convex deploy --prod

# This will:
# - Deploy all functions to production
# - Run schema migrations
# - Set up production database
\`\`\`

**2. Configure Environment Variables**:

\`\`\`bash
# In Convex Dashboard (dashboard.convex.dev)
# Go to Settings → Environment Variables
# Add all API keys (FAL_KEY, etc.)
\`\`\`

**3. Deploy Next.js Frontend**:

\`\`\`bash
# Deploy to Vercel
vercel --prod

# Or use GitHub integration for auto-deploy
\`\`\`

**4. Test Production**:

\`\`\`bash
# Test all AI services in production
curl https://your-app.vercel.app/api/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'
\`\`\`

---

#### **7.3 Production Monitoring**

**Set up alerts for**:
- API rate limits exceeded
- Video generation failures
- High costs (>$100/day)
- Slow response times (>5s)

**Convex Dashboard**:
- Monitor function execution times
- Track database query performance
- View real-time logs

**Vercel Analytics**:
- Track page load times
- Monitor API route performance
- View user engagement metrics

---

## 💰 Cost Analysis & Optimization

### **Monthly Cost Estimates (1000 users)**

| Service | Usage | Unit Cost | Monthly Cost |
|---------|-------|-----------|--------------|
| **OpenAI GPT-4o** | 10K chats | $0.006/chat | $60 |
| **fal.ai (Images)** | 2000 images | $0.04/image (avg) | $80 |
| **fal.ai (Videos)** | 1000 videos (10s each) | $0.50/video | $500 |
| **fal.ai (Music)** | 1000 tracks | $0.20/request | $200 |
| **fal.ai (Narration)** | 1000 narrations | $0.02/100 words | $20 |
| **fal.ai (Video Assembly)** | 1000 assemblies (3 ops each) | $0.03/op | $90 |
| **Convex Storage** | 10 GB | $25/10GB | $25 |
| **Total** | | | **$975/month** |

### **Cost Optimization Strategies**

#### **1. Caching AI Responses** (Save 30-50%)

\`\`\`typescript
// Cache common prompts
export const generateChatResponse = action({
  handler: async (ctx, args) => {
    // Check cache first
    const cached = await ctx.runQuery(api.cache.getChatResponse, {
      prompt: args.userMessage,
    })

    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour
      return cached.response
    }

    // Generate new response
    const response = await generateText({ /* ... */ })

    // Save to cache
    await ctx.runMutation(api.cache.saveChatResponse, {
      prompt: args.userMessage,
      response: response.text,
    })

    return response.text
  },
})
\`\`\`

**Savings**: ~40% reduction in OpenAI costs

---

#### **2. Video Generation Queue** (Save 20-30%)

\`\`\`typescript
// Batch video generation during off-peak hours
export const queueVideoGeneration = mutation({
  args: { videoId: v.id("videos"), sceneId: v.id("scenes") },
  handler: async (ctx, args) => {
    await ctx.db.insert("videoQueue", {
      videoId: args.videoId,
      sceneId: args.sceneId,
      status: "queued",
      priority: "normal",
      createdAt: Date.now(),
    })
  },
})

// Process queue with rate limiting
export const processVideoQueue = action({
  handler: async (ctx) => {
    const queuedVideos = await ctx.runQuery(api.videoQueue.getNext, { limit: 5 })

    for (const item of queuedVideos) {
      try {
        await generateVideo(ctx, {
          videoId: item.videoId,
          sceneId: item.sceneId,
        })

        await ctx.runMutation(api.videoQueue.markComplete, { id: item._id })
      } catch (error) {
        await ctx.runMutation(api.videoQueue.markFailed, {
          id: item._id,
          error: error.message,
        })
      }

      // Rate limit: 1 video per 10 seconds
      await new Promise(resolve => setTimeout(resolve, 10000))
    }
  },
})
\`\`\`

**Savings**: Avoid rate limit charges, better resource utilization

---

#### **3. Image Compression** (Save 50% storage)

\`\`\`typescript
export const uploadAsset = async (file: File) => {
  // Compress image before upload
  const compressed = await compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
  })

  // Upload compressed version
  const uploadUrl = await generateUploadUrl()
  await fetch(uploadUrl, {
    method: 'POST',
    body: compressed,
  })
}

async function compressImage(file: File, options: CompressOptions): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      let { width, height } = img

      // Resize if needed
      if (width > options.maxWidth) {
        height = (height * options.maxWidth) / width
        width = options.maxWidth
      }
      if (height > options.maxHeight) {
        width = (width * options.maxHeight) / height
        height = options.maxHeight
      }

      canvas.width = width
      canvas.height = height

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/jpeg',
        options.quality
      )
    }
  })
}
\`\`\`

**Savings**: 50% reduction in storage costs

---

#### **4. Use Cheaper Models for Simple Tasks**

\`\`\`typescript
// Use GPT-4o-mini for simple prompts (10x cheaper)
export const generateSimpleResponse = action({
  handler: async (ctx, args) => {
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini', // $0.00015/1K tokens vs $0.005/1K
      prompt: args.prompt,
      maxOutputTokens: 200,
    })

    return text
  },
})

// Use GPT-4o only for complex tasks
export const generateComplexResponse = action({
  handler: async (ctx, args) => {
    const { text } = await generateText({
      model: 'openai/gpt-4o',
      prompt: args.prompt,
      maxOutputTokens: 1000,
    })

    return text
  },
})
\`\`\`

**Savings**: 90% reduction for simple tasks

---

### **Free Tier Limits**

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| **Convex** | 1 GB storage, 1 GB bandwidth | $25/month for 10 GB |
| **OpenAI** | $5 credit (new accounts) | Pay-as-you-go |
| **fal.ai** | $5 credit (new accounts) | Pay-as-you-go |
| **Vercel** | 100 GB bandwidth | $20/month Pro |

**MVP Strategy**: Start with free tiers, upgrade as you grow.

---

## 🧪 Testing & Validation

### **Phase 9: Testing & Validation** (3-4 hours)

#### **9.1 Unit Tests for AI Services** (90 min)

**File**: `__tests__/services/aiChat.test.ts`

\`\`\`typescript
import { describe, it, expect, vi } from 'vitest'
import { generateChatResponse } from '@/services/aiChat'

describe('AI Chat Service', () => {
  it('should generate chat response', async () => {
    const response = await generateChatResponse('Hello', 'scene-1')
    
    expect(response).toBeDefined()
    expect(response.role).toBe('assistant')
    expect(response.content).toBeTruthy()
  })

  it('should handle errors gracefully', async () => {
    // Mock API failure
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API error'))

    await expect(
      generateChatResponse('Hello', 'scene-1')
    ).rejects.toThrow('API error')
  })

  it('should include scene context', async () => {
    const response = await generateChatResponse(
      'Make it more romantic',
      'scene-1',
      { sceneType: 'wedding' }
    )

    expect(response.content).toContain('romantic')
  })
})
\`\`\`

---

#### **9.2 Integration Tests** (90 min)

**File**: `__tests__/integration/videoGeneration.test.ts`

\`\`\`typescript
import { describe, it, expect } from 'vitest'
import { ConvexTestingHelper } from 'convex-test'
import { api } from '@/convex/_generated/api'

describe('Video Generation Integration', () => {
  it('should generate video end-to-end', async () => {
    const t = new ConvexTestingHelper()

    // Create test project
    const projectId = await t.mutation(api.projects.create, {
      title: 'Test Project',
    })

    // Create test scene
    const sceneId = await t.mutation(api.scenes.create, {
      projectId,
      title: 'Test Scene',
      description: 'A beautiful wedding scene',
      duration: 10,
    })

    // Upload test images
    const startFrameId = await t.uploadFile('test-start.jpg')
    const endFrameId = await t.uploadFile('test-end.jpg')

    await t.mutation(api.scenes.updateFrames, {
      sceneId,
      startFrameImageId: startFrameId,
      endFrameImageId: endFrameImageId,
    })

    // Create video record
    const videoId = await t.mutation(api.videos.create, {
      sceneId,
    })

    // Generate video (this will take 2-5 minutes in real API)
    const result = await t.action(api.videoGeneration.generateVideo, {
      videoId,
      sceneId,
    })

    expect(result.success).toBe(true)
    expect(result.videoFileId).toBeDefined()

    // Verify video record updated
    const video = await t.query(api.videos.getById, { videoId })
    expect(video.status).toBe('completed')
    expect(video.progress).toBe(100)
  }, 300000) // 5 minute timeout
})
\`\`\`

---

#### **9.3 Manual Testing Checklist**

**AI Chat**:
- [ ] Chat responds with relevant suggestions
- [ ] Tool calls update scene correctly
- [ ] Conversation history persists
- [ ] Error messages are user-friendly
- [ ] Streaming works smoothly

**Video Generation**:
- [ ] Video generates with correct frames
- [ ] Progress updates in real-time
- [ ] Generated video plays correctly
- [ ] Regeneration with feedback works
- [ ] Failed generations show error message

**File Upload**:
- [ ] Images upload successfully
- [ ] Progress bar updates correctly
- [ ] Uploaded images display immediately
- [ ] Large files (5-10MB) work
- [ ] Invalid files show error

**Image Generation**:
- [ ] Images generate with prompts
- [ ] Fallback model works
- [ ] Image editing works
- [ ] Images stored in Convex

**Music & Narration**:
- [ ] Music and narration generate successfully
- [ ] Audio plays correctly
- [ ] Fallback models work

**Video Assembly**:
- [ ] Scene videos merge correctly
- [ ] Audio layers are added with correct volumes
- [ ] Final video renders and plays correctly

**Cost Tracking**:
- [ ] AI usage logged correctly
- [ ] Cost calculations accurate
- [ ] Analytics dashboard shows data

---

### **Phase 10: Production Deployment** (2-3 hours)

#### **7.1 Environment Variables**

**Required for Production**:

\`\`\`env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev

# Convex
CONVEX_DEPLOYMENT=prod:your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Vercel AI Gateway (Recommended)
# No API key needed for OpenAI models

# Video Generation (fal.ai)
FAL_KEY=your_fal_key_id:your_fal_key_secret

# Image Generation (fal.ai)
# Uses same FAL_KEY

# Music & Narration Generation (fal.ai)
# Uses same FAL_KEY

# Video Assembly (fal.ai)
# Uses same FAL_KEY

# Optional: Monitoring
SENTRY_DSN=https://...
NEXT_PUBLIC_ANALYTICS_ID=...
\`\`\`

---

#### **7.2 Deployment Steps**

**1. Deploy Convex Backend**:

\`\`\`bash
# From project root
npx convex deploy --prod

# This will:
# - Deploy all functions to production
# - Run schema migrations
# - Set up production database
\`\`\`

**2. Configure Environment Variables**:

\`\`\`bash
# In Convex Dashboard (dashboard.convex.dev)
# Go to Settings → Environment Variables
# Add all API keys (FAL_KEY, etc.)
\`\`\`

**3. Deploy Next.js Frontend**:

\`\`\`bash
# Deploy to Vercel
vercel --prod

# Or use GitHub integration for auto-deploy
\`\`\`

**4. Test Production**:

\`\`\`bash
# Test all AI services in production
curl https://your-app.vercel.app/api/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'
\`\`\`

---

#### **7.3 Production Monitoring**

**Set up alerts for**:
- API rate limits exceeded
- Video generation failures
- High costs (>$100/day)
- Slow response times (>5s)

**Convex Dashboard**:
- Monitor function execution times
- Track database query performance
- View real-time logs

**Vercel Analytics**:
- Track page load times
- Monitor API route performance
- View user engagement metrics

---

## 💰 Cost Analysis & Optimization

### **Monthly Cost Estimates (1000 users)**

| Service | Usage | Unit Cost | Monthly Cost |
|---------|-------|-----------|--------------|
| **OpenAI GPT-4o** | 10K chats | $0.006/chat | $60 |
| **fal.ai (Images)** | 2000 images | $0.04/image (avg) | $80 |
| **fal.ai (Videos)** | 1000 videos (10s each) | $0.50/video | $500 |
| **fal.ai (Music)** | 1000 tracks | $0.20/request | $200 |
| **fal.ai (Narration)** | 1000 narrations | $0.02/100 words | $20 |
| **fal.ai (Video Assembly)** | 1000 assemblies (3 ops each) | $0.03/op | $90 |
| **Convex Storage** | 10 GB | $25/10GB | $25 |
| **Total** | | | **$975/month** |

### **Cost Optimization Strategies**

#### **1. Caching AI Responses** (Save 30-50%)

\`\`\`typescript
// Cache common prompts
export const generateChatResponse = action({
  handler: async (ctx, args) => {
    // Check cache first
    const cached = await ctx.runQuery(api.cache.getChatResponse, {
      prompt: args.userMessage,
    })

    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour
      return cached.response
    }

    // Generate new response
    const response = await generateText({ /* ... */ })

    // Save to cache
    await ctx.runMutation(api.cache.saveChatResponse, {
      prompt: args.userMessage,
      response: response.text,
    })

    return response.text
  },
})
\`\`\`

**Savings**: ~40% reduction in OpenAI costs

---

#### **2. Video Generation Queue** (Save 20-30%)

\`\`\`typescript
// Batch video generation during off-peak hours
export const queueVideoGeneration = mutation({
  args: { videoId: v.id("videos"), sceneId: v.id("scenes") },
  handler: async (ctx, args) => {
    await ctx.db.insert("videoQueue", {
      videoId: args.videoId,
      sceneId: args.sceneId,
      status: "queued",
      priority: "normal",
      createdAt: Date.now(),
    })
  },
})

// Process queue with rate limiting
export const processVideoQueue = action({
  handler: async (ctx) => {
    const queuedVideos = await ctx.runQuery(api.videoQueue.getNext, { limit: 5 })

    for (const item of queuedVideos) {
      try {
        await generateVideo(ctx, {
          videoId: item.videoId,
          sceneId: item.sceneId,
        })

        await ctx.runMutation(api.videoQueue.markComplete, { id: item._id })
      } catch (error) {
        await ctx.runMutation(api.videoQueue.markFailed, {
          id: item._id,
          error: error.message,
        })
      }

      // Rate limit: 1 video per 10 seconds
      await new Promise(resolve => setTimeout(resolve, 10000))
    }
  },
})
\`\`\`

**Savings**: Avoid rate limit charges, better resource utilization

---

#### **3. Image Compression** (Save 50% storage)

\`\`\`typescript
export const uploadAsset = async (file: File) => {
  // Compress image before upload
  const compressed = await compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
  })

  // Upload compressed version
  const uploadUrl = await generateUploadUrl()
  await fetch(uploadUrl, {
    method: 'POST',
    body: compressed,
  })
}

async function compressImage(file: File, options: CompressOptions): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      let { width, height } = img

      // Resize if needed
      if (width > options.maxWidth) {
        height = (height * options.maxWidth) / width
        width = options.maxWidth
      }
      if (height > options.maxHeight) {
        width = (width * options.maxHeight) / height
        height = options.maxHeight
      }

      canvas.width = width
      canvas.height = height

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/jpeg',
        options.quality
      )
    }
  })
}
\`\`\`

**Savings**: 50% reduction in storage costs

---

#### **4. Use Cheaper Models for Simple Tasks**

\`\`\`typescript
// Use GPT-4o-mini for simple prompts (10x cheaper)
export const generateSimpleResponse = action({
  handler: async (ctx, args) => {
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini', // $0.00015/1K tokens vs $0.005/1K
      prompt: args.prompt,
      maxOutputTokens: 200,
    })

    return text
  },
})

// Use GPT-4o only for complex tasks
export const generateComplexResponse = action({
  handler: async (ctx, args) => {
    const { text } = await generateText({
      model: 'openai/gpt-4o',
      prompt: args.prompt,
      maxOutputTokens: 1000,
    })

    return text
  },
})
\`\`\`

**Savings**: 90% reduction for simple tasks

---

### **Free Tier Limits**

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| **Convex** | 1 GB storage, 1 GB bandwidth | $25/month for 10 GB |
| **OpenAI** | $5 credit (new accounts) | Pay-as-you-go |
| **fal.ai** | $5 credit (new accounts) | Pay-as-you-go |
| **Vercel** | 100 GB bandwidth | $20/month Pro |

**MVP Strategy**: Start with free tiers, upgrade as you grow.

---

## 👨‍💻 Solo Developer Tips

### **Time Management**

**Week 1: Foundation** (10-12 hours)
- Day 1-2: OpenAI chat integration (4-5 hours)
- Day 3-4: Image generation (fal.ai) (3-4 hours)
- Day 5: File storage migration (3-4 hours)

**Week 2: Video & Audio** (12-14 hours)
- Day 1-2: Video generation (Kling v2.5 Turbo Pro) (4-5 hours)
- Day 3: Music generation (Stable Audio 2.5) (3-4 hours)
- Day 4: Narration (MiniMax Speech) (2-3 hours)
- Day 5: Video assembly (FFmpeg) (3-4 hours)

**Week 3: Polish & Deploy** (6-8 hours)
- Day 1-2: Error handling and monitoring (3-4 hours)
- Day 3: Testing and debugging (2-3 hours)
- Day 4: Production deployment (2-3 hours)

**Total Estimated Time**: 28-34 hours (3-4 weeks part-time)

---

### **Common Pitfalls to Avoid**

1. **Don't wait for video generation to complete synchronously**
   - ❌ `await generateVideo()` in API route (will timeout)
   - ✅ Use Convex actions with polling

2. **Don't expose API keys in frontend**
   - ❌ `const OPENAI_KEY = "sk-..."`
   - ✅ Use Convex actions or API routes

3. **Don't forget to handle rate limits**
   - ❌ Retry immediately on 429 error
   - ✅ Use exponential backoff

4. **Don't skip error handling**
   - ❌ `try { await api() } catch {}`
   - ✅ Show user-friendly error messages

5. **Don't over-engineer for MVP**
   - ❌ Build complex caching system
   - ✅ Start simple, optimize later

---

### **Debugging Tips**

**AI Chat Issues**:
\`\`\`typescript
// Add debug logging
console.log('[v0] Chat request:', { messages, sceneId })
console.log('[v0] OpenAI response:', response)
\`\`\`

**Video Generation Issues**:
\`\`\`typescript
// Log each step
console.log('[v0] Step 1: Submitting job...')
console.log('[v0] Step 2: Polling status...')
console.log('[v0] Step 3: Downloading video...')
\`\`\`

**File Upload Issues**:
\`\`\`typescript
// Check file size and type
console.log('[v0] File:', {
  name: file.name,
  size: file.size,
  type: file.type,
})
\`\`\`

**Image Generation Issues**:
\`\`\`typescript
// Log fal.ai calls and responses
console.log('[v0] Fal.ai request:', { modelId, input })
console.log('[v0] Fal.ai response:', data)
\`\`\`

---

### **Quick Wins**

1. **Use Vercel AI Gateway** (saves 2 hours of API key management)
2. **Start with OpenAI and fal.ai only** (defer video generation to week 2)
3. **Use AI SDK examples** (copy from `user_read_only_context/integration_examples/ai_sdk/`)
4. **Test with mock data first** (before spending on API calls)
5. **Deploy early and often** (catch issues in production environment)

---

## 📚 Resources

### **Documentation**

- **Vercel AI SDK v5**: https://sdk.vercel.ai/docs
- **Convex**: https://docs.convex.dev
- **fal.ai**: https://docs.fal.ai
- **OpenAI API**: https://platform.openai.com/docs
- **Clerk Auth**: https://clerk.com/docs

### **Example Code**

- AI SDK examples: `user_read_only_context/integration_examples/ai_sdk/`
- Convex plan: `convex-implementation-plan.md`
- Auth plan: `auth-implementation-plan.md`

### **Support**

- Convex Discord: https://discord.gg/convex
- Vercel Discord: https://discord.gg/vercel
- Stack Overflow: Tag `convex`, `vercel-ai-sdk`

---

## ✅ Final Checklist

**Before Launch**:

- [ ] All environment variables configured
- [ ] OpenAI API key working (test with simple request)
- [ ] fal.ai API key working (test with image/video/audio generation)
- [ ] File uploads working (test with 10MB image)
- [ ] Chat streaming working (test with long response)
- [ ] Video generation working (test end-to-end)
- [ ] Image generation working (test end-to-end)
- [ ] Music & Narration generation working
- [ ] Video assembly working
- [ ] Error handling tested (test with invalid inputs)
- [ ] Cost tracking implemented
- [ ] Monitoring and alerts set up
- [ ] Production deployment successful
- [ ] All tests passing

**Post-Launch Monitoring**:

- [ ] Monitor API costs daily (first week)
- [ ] Check error rates in Convex dashboard
- [ ] Review user feedback on AI quality
- [ ] Optimize slow queries (>1s)
- [ ] Add caching for common requests

---

## 🎯 Success Metrics

**Technical**:
- ✅ AI chat response time: <2 seconds
- ✅ Video generation success rate: >95%
- ✅ Image generation success rate: >98%
- ✅ File upload success rate: >99%
- ✅ API error rate: <1%

**Business**:
- ✅ Cost per user: <$1/month
- ✅ User satisfaction: >4.5/5 stars
- ✅ Video completion rate: >80%

---

## 🚀 Next Steps After MVP

**Phase 2 Enhancements** (Post-Launch):

1. **Advanced AI Features** (2-3 weeks)
   - Multi-language support
   - Advanced scene transitions
   - Style transfer for videos

2. **Performance Optimization** (1-2 weeks)
   - Response caching
   - CDN for assets
   - Video compression
   - Lazy loading

3. **Analytics & Insights** (1 week)
   - User behavior tracking
   - A/B testing for prompts
   - Cost optimization dashboard
   - Quality metrics

---

**Total Estimated Time**: 28-34 hours (3-4 weeks part-time)

**Estimated Monthly Cost**: $925 for 1000 users

**Go-Live Timeline**: 3-4 weeks (solo developer, part-time)

---

*This plan provides a complete roadmap from mock implementations to production-ready AI services. Follow the phases sequentially, test thoroughly, and deploy incrementally to minimize risk.*
