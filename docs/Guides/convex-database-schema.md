# Convex Database Schema Documentation

**Project**: MyShortReel  
**Version**: 2.0  
**Last Updated**: December 19, 2025  
**Status**: Implemented  
**Database**: Convex (Real-time, serverless)

---

## 📊 Database Schema Tree

```
MyShortReel Database (Convex)
│
├── 🏢 organizations
│   ├── _id: Id<"organizations">
│   ├── clerkOrganizationId: string (unique, indexed)
│   ├── name: string
│   ├── slug: string (optional)
│   ├── type: "individual" | "couple" | "agency" | "team"
│   ├── totalProjects: number
│   ├── totalVideos: number
│   ├── totalCreditsUsed: number
│   ├── createdAt: number
│   └── updatedAt: number
│   │
│   ├──< 👤 users (1:N)
│   │   ├── _id: Id<"users">
│   │   ├── clerkUserId: string (unique, indexed)
│   │   ├── organizationId: string (optional, indexed) → organizations.clerkOrganizationId
│   │   ├── role: "owner" | "admin" | "member" | "client" (optional)
│   │   ├── preferences: object (optional)
│   │   │   ├── theme: "light" | "dark" | "system"
│   │   │   ├── defaultStyle: string (optional)
│   │   │   ├── language: string
│   │   │   └── notifications: boolean
│   │   ├── totalProjects: number
│   │   ├── lastActiveAt: number
│   │   ├── createdAt: number
│   │   └── updatedAt: number
│   │
│   ├──< 🎬 projects (1:N)
│   │   ├── _id: Id<"projects">
│   │   ├── userId: string (indexed) → Clerk user ID
│   │   ├── organizationId: string (optional, indexed) → organizations.clerkOrganizationId
│   │   ├── name: string
│   │   ├── occasion: string
│   │   ├── theme: string
│   │   ├── eventDetails: object
│   │   │   ├── eventTitle: string (e.g., "Sarah & John's Wedding Celebration")
│   │   │   ├── description: string (optional)
│   │   │   ├── date: string (optional)
│   │   │   ├── location: string (optional)
│   │   │   ├── rsvpLink: string (optional)
│   │   │   └── emotionalStory: string
│   │   ├── language: string
│   │   ├── duration: number (seconds)
│   │   ├── status: "draft" | "in-progress" | "completed"
│   │   ├── createdAt: number
│   │   └── updatedAt: number
│   │   │
│   │   ├──< 🎞️ scenes (1:N)
│   │   │   ├── _id: Id<"scenes">
│   │   │   ├── projectId: string (indexed) → projects._id
│   │   │   ├── userId: string (indexed) → Clerk user ID
│   │   │   ├── sceneNumber: number (1, 2, 3)
│   │   │   ├── title: string
│   │   │   ├── description: string (prompt)
│   │   │   ├── duration: number (seconds)
│   │   │   ├── startFrame: Id<"assets"> (optional, Reference to start frame image asset)
│   │   │   ├── endFrame: Id<"assets"> (optional, Reference to end frame image asset)
│   │   │   ├── cinematicStyles: object (optional)
│   │   │   │   ├── ambiance: string (optional)
│   │   │   │   ├── cameraMovement: string (optional)
│   │   │   │   ├── colorTone: string (optional)
│   │   │   │   └── visualStyle: string (optional)
│   │   │   ├── videoUrl: string (optional)
│   │   │   ├── status: "draft" | "generating" | "completed"
│   │   │   ├── createdAt: number
│   │   │   └── updatedAt: number
│   │   │
│   │   ├──< 📦 assets (1:N)
│   │   │   ├── _id: Id<"assets">
│   │   │   ├── userId: string (indexed) → Clerk user ID
│   │   │   ├── projectId: string (optional, indexed) → projects._id
│   │   │   ├── type: "image" | "video" | "audio"
│   │   │   ├── url: string
│   │   │   ├── filename: string
│   │   │   ├── size: number (bytes)
│   │   │   └── uploadedAt: number
│   │   │
│   │   ├──< 🎵 audioTracks (1:N)
│   │   │   ├── _id: Id<"audioTracks">
│   │   │   ├── organizationId: string (indexed) → organizations.clerkOrganizationId
│   │   │   ├── projectId: string (indexed) → projects._id
│   │   │   ├── userId: string (indexed) → users.clerkUserId
│   │   │   ├── type: "music" | "narration" | "sound_effect"
│   │   │   ├── title: string
│   │   │   ├── assetId: Id<"assets"> → assets._id
│   │   │   ├── order: number
│   │   │   ├── startTime: number (seconds)
│   │   │   ├── duration: number (seconds)
│   │   │   ├── volume: number (0-1)
│   │   │   ├── fadeIn: number (seconds, optional)
│   │   │   ├── fadeOut: number (seconds, optional)
│   │   │   ├── generationConfig: object (optional, for AI-generated)
│   │   │   │   ├── model: string (e.g., "fal-ai/stable-audio-25/text-to-audio", "fal-ai/minimax/speech-2.6-hd")
│   │   │   │   ├── prompt: string
│   │   │   │   ├── voice: string (optional, for narration)
│   │   │   │   └── parameters: object
│   │   │   ├── creditsUsed: number
│   │   │   ├── createdAt: number
│   │   │   └── updatedAt: number
│   │   │
│   │   ├──< 🎥 videos (1:N)
│   │   │   ├── _id: Id<"videos">
│   │   │   ├── organizationId: string (indexed) → organizations.clerkOrganizationId
│   │   │   ├── projectId: string (indexed) → projects._id
│   │   │   ├── userId: string (indexed) → users.clerkUserId
│   │   │   ├── title: string
│   │   │   ├── description: string (optional)
│   │   │   ├── status: "queued" | "processing" | "completed" | "failed"
│   │   │   ├── version: number
│   │   │   ├── fileStorageId: string (optional) → Convex file storage
│   │   │   ├── url: string (optional, public URL)
│   │   │   ├── thumbnailStorageId: string (optional) → Convex file storage
│   │   │   ├── thumbnailUrl: string (optional)
│   │   │   ├── metadata: object
│   │   │   │   ├── size: number (bytes)
│   │   │   │   ├── duration: number (seconds)
│   │   │   │   ├── resolution: string
│   │   │   │   ├── fps: number
│   │   │   │   ├── format: string
│   │   │   │   ├── processingTime: number (ms)
│   │   │   │   └── sceneCount: number
│   │   │   ├── renderConfig: object
│   │   │   │   ├── sceneIds: string[] → scenes._id
│   │   │   │   ├── audioTrackIds: string[] → audioTracks._id
│   │   │   │   ├── transitions: object[]
│   │   │   │   └── effects: object[]
│   │   │   │   └── assemblyWorkflow: object (optional)
│   │   │   │       ├── step1MergedVideoId: string (optional) // Step 1: Merged 3 scenes
│   │   │   │       ├── step2VideoWithNarrationId: string (optional) // Step 2: Video + narration
│   │   │   │       ├── step3FinalVideoId: string (optional) // Step 3: FINAL VIDEO (video + narration + music) - THIS IS THE COMPLETE VIDEO
│   │   │   │       └── ffmpegJobIds: string[] (optional) // FFmpeg job tracking
│   │   │   ├── creditsUsed: number
│   │   │   ├── isPublic: boolean
│   │   │   ├── shareToken: string (optional, for sharing)
│   │   │   ├── viewCount: number
│   │   │   ├── downloadCount: number
│   │   │   ├── createdAt: number
│   │   │   └── updatedAt: number
│   │   │
│   │   └──< 💬 chatMessages (1:N)
│   │       ├── _id: Id<"chatMessages">
│   │       ├── organizationId: string (indexed) → organizations.clerkOrganizationId
│   │       ├── projectId: string (indexed) → projects._id
│   │       ├── userId: string (indexed) → users.clerkUserId
│   │       ├── role: "user" | "assistant" | "system"
│   │       ├── content: string
│   │       ├── step: number (1-6, which guided step)
│   │       ├── metadata: object
│   │       │   ├── model: string (optional)
│   │       │   ├── tokens: number (optional)
│   │       │   ├── latency: number (optional)
│   │       │   └── context: object (optional, step-specific data)
│   │       ├── createdAt: number
│   │       └── updatedAt: number
│   │
│   ├──< 📋 templates (1:N)
│   │   ├── _id: Id<"templates">
│   │   ├── organizationId: string (optional, indexed) → organizations.clerkOrganizationId
│   │   ├── userId: string (optional, indexed) → users.clerkUserId
│   │   ├── name: string
│   │   ├── description: string
│   │   ├── category: string (e.g., "Wedding", "Birthday", "Business")
│   │   ├── type: "wedding" | "birthday" | "anniversary" | "business" | "custom"
│   │   ├── thumbnail: string (optional, URL)
│   │   ├── config: object
│   │   │   ├── defaultScenes: object[]
│   │   │   ├── defaultSettings: object
│   │   │   ├── suggestedMusic: string[]
│   │   │   └── suggestedStyles: string[]
│   │   ├── isSystem: boolean (true for built-in templates)
│   │   ├── isPublic: boolean
│   │   ├── usageCount: number
│   │   ├── tags: string[]
│   │   ├── createdAt: number
│   │   └── updatedAt: number
│   │
│   ├──< 💳 subscriptions (1:1)
│   │   ├── _id: Id<"subscriptions">
│   │   ├── organizationId: string (unique, indexed) → organizations.clerkOrganizationId
│   │   ├── polarSubscriptionId: string (unique, indexed)
│   │   ├── polarCustomerId: string (indexed)
│   │   ├── polarProductId: string (indexed)
│   │   ├── status: "active" | "canceled" | "past_due" | "trialing"
│   │   ├── currentPeriodStart: number
│   │   ├── currentPeriodEnd: number
│   │   ├── cancelAtPeriodEnd: boolean
│   │   ├── plan: object
│   │   │   ├── name: string
│   │   │   ├── tier: "free" | "starter" | "pro" | "enterprise"
│   │   │   ├── monthlyCredits: number
│   │   │   └── features: string[]
│   │   ├── createdAt: number
│   │   ├── updatedAt: number
│   │   └── canceledAt: number (optional)
│   │
│   ├──< 💰 creditBalances (1:1)
│   │   ├── _id: Id<"creditBalances">
│   │   ├── organizationId: string (unique, indexed) → organizations.clerkOrganizationId
│   │   ├── totalCredits: number
│   │   ├── usedCredits: number
│   │   ├── remainingCredits: number
│   │   ├── subscriptionCredits: number (monthly allocation)
│   │   ├── purchasedCredits: number (one-time purchases)
│   │   ├── lastResetAt: number
│   │   ├── nextResetAt: number
│   │   ├── metadata: object
│   │   │   └── resetFrequency: "monthly" | "never"
│   │   └── updatedAt: number
│   │
│   ├──< 📊 usageTracking (1:N)
│   │   ├── _id: Id<"usageTracking">
│   │   ├── organizationId: string (indexed) → organizations.clerkOrganizationId
│   │   ├── projectId: string (optional, indexed) → projects._id
│   │   ├── userId: string (indexed) → users.clerkUserId
│   │   ├── resourceType: "scene" | "image" | "video" | "audio" | "chat"
│   │   ├── resourceId: string (optional)
│   │   ├── eventType: "generation" | "render" | "storage" | "api_call"
│   │   ├── service: string (standardized format: "service-name", e.g., "openai", "fal-ai", "runway", "kling-ai", "ffmpeg")
│   │   ├── model: string (standardized format: "service/model-name", e.g., "openai/gpt-4o-mini", "fal-ai/nano-banana-pro", "fal-ai/kling-video/v2.5-turbo/pro/image-to-video", "fal-ai/stable-audio-25/text-to-audio", "fal-ai/minimax/speech-2.6-hd")
│   │   ├── creditsUsed: number
│   │   ├── cost: number (optional, in USD)
│   │   ├── metadata: object
│   │   │   ├── inputTokens: number (optional)
│   │   │   ├── outputTokens: number (optional)
│   │   │   ├── duration: number (optional, for video/audio)
│   │   │   ├── resolution: string (optional)
│   │   │   ├── latency: number (optional, in ms)
│   │   │   └── success: boolean
│   │   ├── polarMeterId: string (optional)
│   │   ├── createdAt: number (indexed for time-series queries)
│   │   └── billingPeriod: string (indexed, format: "YYYY-MM")
│   │
│   └──< 🎯 activities (1:N)
│       ├── _id: Id<"activities">
│       ├── organizationId: string (indexed) → organizations.clerkOrganizationId
│       ├── userId: string (indexed) → users.clerkUserId
│       ├── projectId: string (optional, indexed) → projects._id
│       ├── type: "project_created" | "video_generated" | "scene_added" | "template_used" | "video_shared"
│       ├── title: string
│       ├── description: string
│       ├── metadata: object (optional, additional context)
│       └── createdAt: number
│
└── 🔗 sharedLinks (1:N)
    ├── _id: Id<"sharedLinks">
    ├── organizationId: string (indexed) → organizations.clerkOrganizationId
    ├── videoId: string (indexed) → videos._id
    ├── userId: string (indexed) → users.clerkUserId
    ├── token: string (unique, indexed)
    ├── expiresAt: number (optional)
    ├── password: string (optional, hashed)
    ├── allowDownload: boolean
    ├── viewCount: number
    ├── lastViewedAt: number (optional)
    ├── createdAt: number
    ├── updatedAt: number
```

### Legend
- 🏢 Organization-level data (multi-tenancy root)
- 👤 User data (minimal, Clerk handles auth)
- 🎬 Project data (video projects)
- 🎞️ Scene data (individual video scenes)
- 📦 Asset data (images, videos, audio files)
- 🎵 Audio track data (music, narration, sound effects)
- 🎥 Video data (final rendered videos)
- 💬 Chat message data (AI assistant conversations)
- 📋 Template data (project templates)
- 💳 Subscription data (Polar integration)
- 💰 Credit balance data (billing)
- 📊 Usage tracking data (API usage, credits)
- 🎯 Activity data (user activity log)
- 🔗 Shared link data (video sharing)

---

## Table of Contents

1. [Overview](#overview)
2. [Schema Principles](#schema-principles)
3. [Table Definitions](#table-definitions)
4. [Relationships](#relationships)
5. [Index Strategy](#index-strategy)
6. [Multi-Tenancy Implementation](#multi-tenancy-implementation)
7. [AI Model Integration](#ai-model-integration)

---

## Overview

This document defines the complete Convex database schema for MyShortReel. The schema supports:

- **Multi-tenancy**: Organization-based data isolation using Clerk Organizations
- **Organization types**: Individual, Couple, Agency, Team
- **Video projects**: Complete project lifecycle from creation to final render
- **Guided workflow**: 6-step video creation process
- **Scene management**: Individual video scenes with AI generation
- **Asset management**: Images, videos, audio files
- **AI integrations**: OpenAI, fal.ai, Rendi
- **Real-time collaboration**: Convex's built-in real-time subscriptions
- **Usage-based billing**: Credit tracking with Polar integration
- **File storage**: Convex file storage for all media assets
- **Video sharing**: Secure link sharing with optional password protection

---

## AI Model Integration

The schema supports detailed tracking and configuration for the following production models:

**1. Text Generation**:
   - `"openai/gpt-4o-mini"` - Primary chat assistant, scene refinement
   - `"openai/gpt-4o"` - Fallback high-intelligence chat

**2. Image Generation**:
   - `"fal-ai/nano-banana-pro"` - Primary high-quality text-to-image (Gemini 3 Pro)
   - `"fal-ai/bytedance/seedream/v4/text-to-image"` - Fallback text-to-image

**3. Image Editing**:
   - `"fal-ai/nano-banana-pro/edit"` - Primary image-to-image editing

**4. Video Generation**:
   - `"fal-ai/kling-video/v2.5-turbo/pro/image-to-video"` - Primary image-to-video

**5. Music Generation**:
   - `"fal-ai/stable-audio-25/text-to-audio"` - Primary music generation (44.1kHz stereo)
   - `"fal-ai/minimax-music"` - Fallback music generation

**6. Narration (TTS)**:
   - `"fal-ai/minimax/speech-2.6-hd"` - Primary high-fidelity narration
   - `"fal-ai/minimax/speech-2.6-turbo"` - Fallback faster narration

**7. Video Assembly (Rendi API)**:
   - `"rendi-api"` - Professional audio mixing (sidechain ducking + loudnorm)
   - `"rendi-api"` - Merge scenes with cinematic xfade transitions
   - `"rendi-api"` - Final render (A/V stream multiplexing)

---

**Document Version**: 2.0  
**Last Updated**: December 19, 2025  
**Maintained By**: MyShortReel Development Team
