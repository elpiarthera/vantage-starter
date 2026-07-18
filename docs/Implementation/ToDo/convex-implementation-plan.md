# Convex Backend Implementation Plan
## MyShortReel - Production-Ready MVP Backend

**Project**: MyShortReel (AI-powered video invitation generator)  
**Backend**: Convex (reactive database + serverless functions)  
**Integration**: Clerk Authentication (see auth-implementation-plan.md)  
**Developer**: Solo Developer  
**Approach**: MVP - Production-ready, no over-complication  
**Total Estimated Time**: 14-18 hours

---

## 📋 Table of Contents

1. [Prerequisites & Dependency Installation](#prerequisites--dependency-installation)
2. [Current State Analysis](#current-state-analysis)
3. [Convex Architecture Overview](#convex-architecture-overview)
4. [Implementation Phases](#implementation-phases)
5. [Data Schema Design](#data-schema-design)
6. [Migration Strategy](#migration-strategy)
7. [Testing & Validation](#testing--validation)
8. [Production Deployment](#production-deployment)
9. [Solo Developer Tips](#solo-developer-tips)
10. [Critical Issues to Fix BEFORE Implementation](#critical-issues-to-fix-before-implementation)
11. [Error Handling Patterns](#error-handling-patterns)
12. [Rate Limiting & Cost Monitoring](#rate-limiting--cost-monitoring)
13. [Security Best Practices](#security-best-practices)
14. [Additional Resources](#additional-resources)

---

## 📋 Prerequisites & Dependency Installation

### **Step 0: Install Dependencies** (15 min)

**Before starting any implementation, install all required packages:**

\`\`\`bash
# Install Convex
npm install convex

# Install Convex React integration
npm install convex/react

# Initialize Convex project (will prompt for login)
npx convex dev
\`\`\`

**This will:**
- Create `convex/` folder structure
- Generate `convex.json` config
- Prompt for GitHub login
- Create development deployment
- Add environment variables to `.env.local`:
  - `CONVEX_DEPLOYMENT`
  - `NEXT_PUBLIC_CONVEX_URL`

**Environment variables needed:**
\`\`\`bash
# .env.local
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
CONVEX_DEPLOYMENT=dev:xxx

# For Clerk integration (see auth-implementation-plan.md)
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# For AI integrations
OPENAI_API_KEY=sk-xxx
FAL_KEY=xxx (for fal.ai video/image generation)
\`\`\`

---

## 🔍 Current State Analysis

### **What We Have Now**
- ✅ Fully functional UI with Next.js App Router
- ✅ Client-side state management (Zustand stores)
- ✅ Mock services simulating backend operations
- ❌ NO real backend API
- ❌ NO database
- ❌ NO file storage
- ❌ NO real AI integrations

### **What Needs Backend**

| Feature | Current Implementation | Convex Solution |
|---------|----------------------|-----------------|
| Scene Management | Zustand + mock data | Convex queries/mutations |
| Video Generation | Mock setTimeout delays | Convex actions + external AI API |
| Asset Upload | Object URLs (memory) | Convex file storage |
| AI Chat | Random mock responses | Convex actions + OpenAI API |
| User Projects | Mock data | Convex database tables |
| Real-time Updates | Manual state updates | Convex subscriptions (automatic) |

### **Implementation Approach**
- Build fresh with Convex from the start
- No data migration needed
- Replace mock services with real Convex functions
- Convex is the single source of truth

---

## 🏗️ Convex Architecture Overview

### **What is Convex?**
Convex is a reactive backend platform that combines:
- **Database**: Document-based (like MongoDB) with TypeScript schemas
- **Functions**: Server-side TypeScript functions (queries, mutations, actions)
- **File Storage**: Built-in file upload/download with CDN
- **Real-time**: Automatic subscriptions - UI updates when data changes
- **Type Safety**: End-to-end TypeScript from database to frontend

### **Convex Function Types**

\`\`\`typescript
// QUERIES - Read data (reactive, cached, fast)
export const getScenes = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()
  }
})

// MUTATIONS - Write data (transactional, atomic)
export const createScene = mutation({
  args: { projectId: v.id("projects"), title: v.string(), ... },
  handler: async (ctx, args) => {
    const sceneId = await ctx.db.insert("scenes", {
      projectId: args.projectId,
      title: args.title,
      createdAt: Date.now()
    })
    return sceneId
  }
})

// ACTIONS - External API calls (non-transactional, can call 3rd party APIs)
export const generateVideoWithAI = action({
  args: { sceneId: v.id("scenes"), prompt: v.string() },
  handler: async (ctx, args) => {
    // Call external AI video generation API
    const response = await fetch("https://ai-video-api.com/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: args.prompt })
    })
    const { videoUrl } = await response.json()
    
    // Update database via mutation
    await ctx.runMutation(api.videos.updateVideoUrl, {
      sceneId: args.sceneId,
      videoUrl
    })
    
    return videoUrl
  }
})
\`\`\`

### **Why Convex for This Project?**
✅ **Perfect for MVP**: Setup in minutes, not days  
✅ **Real-time by default**: Video generation progress updates automatically  
✅ **Type-safe**: Catch errors at compile time, not runtime  
✅ **Serverless**: No infrastructure management  
✅ **File storage included**: No need for separate S3/Cloudinary  
✅ **Clerk integration**: Official support, well-documented  
✅ **Solo-dev friendly**: Dashboard for debugging, auto-deploy on save  

---

## 📅 Implementation Phases

### **Phase 1: Setup & Configuration** (2-3 hours)
- Install Convex and configure Next.js integration
- Set up Convex project and development environment
- Configure Clerk authentication with Convex (using official patterns)
- Create initial database schema with organization support
- Set up file storage configuration

### **Phase 2: Core Data Layer** (3-4 hours)
- Implement database schema (projects, scenes, videos, assets)
- Create queries for reading data
- Create mutations for writing data
- Add indexes for performance
- Test CRUD operations in Convex dashboard

### **Phase 3: File Storage Migration** (2-3 hours)
- Implement file upload functions (images, videos)
- Replace object URLs with Convex storage URLs
- Update asset management hooks
- Add file validation and size limits
- Test upload/download flows

### **Phase 4: AI Integration** (3-4 hours)
- Create actions for external AI API calls
- Integrate OpenAI for chat responses
- Integrate AI video generation service
- Add error handling and retries
- Implement progress tracking

### **Phase 5: Frontend Migration** (2-3 hours)
- Replace Zustand stores with Convex hooks
- Update components to use Convex queries
- Implement optimistic updates
- Add loading states and error handling
- Test real-time updates

### **Phase 6: Testing & Polish** (2-3 hours)
- End-to-end testing of all features
- Performance optimization
- Error boundary testing
- Multi-device sync testing
- Production deployment preparation

---

## 🗄️ Data Schema Design

### **Complete Convex Schema** (`convex/schema.ts`)

\`\`\`typescript
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // ORGANIZATIONS TABLE (minimal, Clerk handles most)
  organizations: defineTable({
    clerkOrganizationId: v.string(), // Clerk organization ID
    name: v.string(),
    slug: v.optional(v.string()),
    type: v.union(
      v.literal('individual'),
      v.literal('couple'),
      v.literal('agency'),
      v.literal('team')
    ),
    totalProjects: v.number(),
    totalVideos: v.number(),
    totalCreditsUsed: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_clerk_org_id', ['clerkOrganizationId'])
    .index('by_type', ['type']),

  // USERS TABLE (minimal, Clerk handles profiles)
  users: defineTable({
    clerkUserId: v.string(), // Clerk user ID
    organizationId: v.optional(v.string()), // Optional - users can work solo
    role: v.optional(v.union(
      v.literal('owner'),
      v.literal('admin'),
      v.literal('member'),
      v.literal('client')
    )),
    preferences: v.optional(v.object({
      theme: v.union(
        v.literal('light'),
        v.literal('dark'),
        v.literal('system')
      ),
      defaultStyle: v.optional(v.string()),
      language: v.string(),
      notifications: v.boolean(),
    })),
    totalProjects: v.number(),
    lastActiveAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_clerk_user_id', ['clerkUserId'])
    .index('by_organization', ['organizationId'])
    .index('by_organization_and_role', ['organizationId', 'role'])
    .index('by_last_active', ['lastActiveAt']),

  // PROJECTS TABLE
  projects: defineTable({
    userId: v.string(), // Clerk user ID from identity.subject
    organizationId: v.optional(v.string()), // Optional Clerk organization ID
    name: v.string(), // Project name (not title)
    occasion: v.string(), // Event occasion
    theme: v.string(), // Visual theme
    eventDetails: v.object({
      eventTitle: v.string(), // Renamed from 'name' to 'eventTitle' for clarity
      description: v.optional(v.string()),
      date: v.optional(v.string()),
      location: v.optional(v.string()),
      rsvpLink: v.optional(v.string()),
      emotionalStory: v.string(),
    }),
    language: v.string(), // Language for narration
    duration: v.number(), // Total duration in seconds (not totalDuration)
    status: v.union(
      v.literal('draft'),
      v.literal('in-progress'), // Note: hyphenated, not underscore
      v.literal('completed')
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_organization', ['organizationId'])
    .index('by_user_and_status', ['userId', 'status'])
    .index('by_organization_and_status', ['organizationId', 'status']),

  // SCENES TABLE
  scenes: defineTable({
    projectId: v.id('projects'),
    userId: v.string(), // Clerk user ID
    sceneNumber: v.number(), // Scene order (1, 2, 3) - not "order"
    title: v.string(),
    description: v.string(), // Scene description/prompt
    duration: v.number(), // Duration in seconds (not union of 5 or 10)
    startFrame: v.optional(v.id('assets')), // Changed to v.id('assets') for referential integrity
    endFrame: v.optional(v.id('assets')), // Changed to v.id('assets') for referential integrity
    cinematicStyles: v.optional(v.object({
      ambiance: v.optional(v.string()),
      cameraMovement: v.optional(v.string()),
      colorTone: v.optional(v.string()),
      visualStyle: v.optional(v.string()),
    })),
    videoUrl: v.optional(v.string()), // Generated video URL
    status: v.union(
      v.literal('draft'),
      v.literal('generating'),
      v.literal('completed')
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_project', ['projectId'])
    .index('by_user', ['userId'])
    .index('by_project_and_scene_number', ['projectId', 'sceneNumber']),

  // ASSETS TABLE
  assets: defineTable({
    userId: v.string(), // Clerk user ID (not v.id("users"))
    projectId: v.optional(v.id('projects')), // Optional - assets can be reused
    type: v.union(
      v.literal('image'),
      v.literal('video'),
      v.literal('audio') // Added 'audio' type
    ),
    url: v.string(), // Public URL (not fileId)
    filename: v.string(), // Original filename (not name)
    size: v.number(), // File size in bytes (not fileSize)
    uploadedAt: v.number(), // Upload timestamp (not createdAt)
  })
    .index('by_user', ['userId'])
    .index('by_project', ['projectId'])
    .index('by_type', ['type']), // Added index for filtering by type

  // AUDIO TRACKS TABLE
  audioTracks: defineTable({
    organizationId: v.string(),
    projectId: v.id('projects'),
    userId: v.string(),
    type: v.union(
      v.literal('music'),
      v.literal('narration'),
      v.literal('sound_effect')
    ),
    title: v.string(),
    assetId: v.id('assets'),
    order: v.number(),
    startTime: v.number(), // seconds
    duration: v.number(), // seconds
    volume: v.number(), // 0-1
    fadeIn: v.optional(v.number()), // seconds
    fadeOut: v.optional(v.number()), // seconds
    generationConfig: v.optional(v.object({
      model: v.string(), // Full path: "fal-ai/stable-audio-25/text-to-audio", "fal-ai/minimax-music", "fal-ai/minimax/speech-02-turbo"
      prompt: v.string(),
      voice: v.optional(v.string()), // for narration
      parameters: v.object({}),
    })),
    creditsUsed: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_project', ['projectId'])
    .index('by_user', ['userId'])
    .index('by_organization_and_project', ['organizationId', 'projectId'])
    .index('by_project_and_order', ['projectId', 'order'])
    .index('by_type', ['type']),

  // VIDEOS TABLE (final rendered videos)
  videos: defineTable({
    organizationId: v.string(),
    projectId: v.id('projects'),
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal('queued'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed')
    ),
    version: v.number(),
    fileStorageId: v.optional(v.string()), // Convex file storage ID
    url: v.optional(v.string()), // Public URL
    thumbnailStorageId: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    metadata: v.object({
      size: v.number(), // bytes
      duration: v.number(), // seconds
      resolution: v.string(),
      fps: v.number(),
      format: v.string(),
      processingTime: v.number(), // ms
      sceneCount: v.number(),
    }),
    renderConfig: v.object({
      sceneIds: v.array(v.id('scenes')),
      audioTrackIds: v.array(v.id('audioTracks')),
      transitions: v.array(v.object({})),
      effects: v.array(v.object({})),
      assemblyWorkflow: v.optional(v.object({
        step1MergedVideoId: v.optional(v.string()), // Merged 3 scenes
        step2VideoWithNarrationId: v.optional(v.string()), // Video + narration
        step3FinalVideoId: v.optional(v.string()), // FINAL COMPLETE VIDEO: video + narration + music - THIS IS THE OUTPUT
        ffmpegJobIds: v.optional(v.array(v.string())), // FFmpeg job IDs
      })),
    }),
    creditsUsed: v.number(),
    isPublic: v.boolean(),
    shareToken: v.optional(v.string()),
    viewCount: v.number(),
    downloadCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_project', ['projectId'])
    .index('by_user', ['userId'])
    .index('by_organization_and_project', ['organizationId', 'projectId'])
    .index('by_status', ['status'])
    .index('by_share_token', ['shareToken']),

  // CHAT MESSAGES TABLE
  chatMessages: defineTable({
    organizationId: v.string(),
    projectId: v.id('projects'),
    userId: v.string(),
    role: v.union(
      v.literal('user'),
      v.literal('assistant'),
      v.literal('system')
    ),
    content: v.string(),
    step: v.number(), // Guided workflow step (1-6)
    metadata: v.object({
      model: v.optional(v.string()),
      tokens: v.optional(v.number()),
      latency: v.optional(v.number()),
      context: v.optional(v.object({})), // step-specific data
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_project', ['projectId'])
    .index('by_user', ['userId'])
    .index('by_organization_and_project', ['organizationId', 'projectId'])
    .index('by_project_and_step', ['projectId', 'step'])
    .index('by_created_at', ['createdAt']),

  // TEMPLATES TABLE
  templates: defineTable({
    organizationId: v.optional(v.string()),
    userId: v.optional(v.string()),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    type: v.union(
      v.literal('wedding'),
      v.literal('birthday'),
      v.literal('anniversary'),
      v.literal('business'),
      v.literal('custom')
    ),
    thumbnail: v.optional(v.string()),
    config: v.object({
      defaultScenes: v.array(v.object({})),
      defaultSettings: v.object({}),
      suggestedMusic: v.array(v.string()),
      suggestedStyles: v.array(v.string()),
    }),
    isSystem: v.boolean(),
    isPublic: v.boolean(),
    usageCount: v.number(),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_user', ['userId'])
    .index('by_category', ['category'])
    .index('by_type', ['type'])
    .index('by_is_system', ['isSystem'])
    .index('by_is_public', ['isPublic'])
    .index('by_usage', ['usageCount']),

  // SUBSCRIPTIONS TABLE
  subscriptions: defineTable({
    organizationId: v.string(),
    polarSubscriptionId: v.string(),
    polarCustomerId: v.string(),
    polarProductId: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('canceled'),
      v.literal('past_due'),
      v.literal('trialing')
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    plan: v.object({
      name: v.string(),
      tier: v.union(
        v.literal('free'),
        v.literal('starter'),
        v.literal('pro'),
        v.literal('enterprise')
      ),
      monthlyCredits: v.number(),
      features: v.array(v.string()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
    canceledAt: v.optional(v.number()),
  })
    .index('by_organization', ['organizationId'])
    .index('by_polar_subscription_id', ['polarSubscriptionId'])
    .index('by_polar_product_id', ['polarProductId'])
    .index('by_status', ['status']),

  // CREDIT BALANCES TABLE
  creditBalances: defineTable({
    organizationId: v.string(),
    totalCredits: v.number(),
    usedCredits: v.number(),
    remainingCredits: v.number(),
    subscriptionCredits: v.number(),
    purchasedCredits: v.number(),
    lastResetAt: v.number(),
    nextResetAt: v.number(),
    metadata: v.object({
      resetFrequency: v.union(
        v.literal('monthly'),
        v.literal('never')
      ),
    }),
    updatedAt: v.number(),
  })
    .index('by_organization', ['organizationId']),

  // USAGE TRACKING TABLE
  usageTracking: defineTable({
    organizationId: v.string(),
    projectId: v.optional(v.id('projects')),
    userId: v.string(),
    resourceType: v.union(
      v.literal('scene'),
      v.literal('image'),
      v.literal('video'),
      v.literal('audio'),
      v.literal('chat')
    ),
    resourceId: v.optional(v.string()),
    eventType: v.union(
      v.literal('generation'),
      v.literal('render'),
      v.literal('storage'),
      v.literal('api_call')
    ),
    service: v.string(), // Full service name: "openai", "fal-ai", "runway", "kling-ai", "ffmpeg"
    model: v.string(), // Full model path: "openai/gpt-4o", "fal-ai/gemini-25-flash-image", "fal-ai/stable-audio-25/text-to-audio", "runway/gen-3", "kling-ai/v2.5-turbo-pro"
    creditsUsed: v.number(),
    cost: v.optional(v.number()), // in USD
    metadata: v.object({
      inputTokens: v.optional(v.number()),
      outputTokens: v.optional(v.number()),
      duration: v.optional(v.number()),
      resolution: v.optional(v.string()),
      latency: v.optional(v.number()),
      success: v.boolean(),
    }),
    polarMeterId: v.optional(v.string()),
    createdAt: v.number(),
    billingPeriod: v.string(), // "YYYY-MM"
  })
    .index('by_organization', ['organizationId'])
    .index('by_project', ['projectId'])
    .index('by_user', ['userId'])
    .index('by_organization_and_billing_period', ['organizationId', 'billingPeriod'])
    .index('by_service', ['service'])
    .index('by_model', ['model'])
    .index('by_event_type', ['eventType'])
    .index('by_created_at', ['createdAt']),

  // ACTIVITIES TABLE
  activities: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    projectId: v.optional(v.id('projects')),
    type: v.union(
      v.literal('project_created'),
      v.literal('video_generated'),
      v.literal('scene_added'),
      v.literal('template_used'),
      v.literal('video_shared')
    ),
    title: v.string(),
    description: v.string(),
    metadata: v.optional(v.object({})),
    createdAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_user', ['userId'])
    .index('by_project', ['projectId'])
    .index('by_type', ['type'])
    .index('by_created_at', ['createdAt'])
    .index('by_organization_and_created_at', ['organizationId', 'createdAt']),

  // SHARED LINKS TABLE
  sharedLinks: defineTable({
    organizationId: v.string(),
    videoId: v.id('videos'),
    userId: v.string(),
    token: v.string(),
    expiresAt: v.optional(v.number()),
    allowDownload: v.boolean(),
    viewCount: v.number(),
    lastViewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_organization', ['organizationId'])
    .index('by_video', ['videoId'])
    .index('by_user', ['userId'])
    .index('by_token', ['token'])
    .index('by_expires_at', ['expiresAt']),
})
\`\`\`

### **Schema Design Principles**

1. **Convex as Single Source of Truth**
   - All data stored in Convex database
   - No client-side persistence
   - Real-time sync across devices

2. **Multi-Tenancy via Organizations**
   - Every table includes `organizationId` for data isolation
   - All queries MUST filter by `organizationId` for security
   - Indexes on `organizationId` for performance

3. **Denormalization for Performance**
   - `videos.projectId` and `videos.organizationId` duplicated from `scenes`
   - Avoids joins, leverages Convex's document model

4. **Indexes for Common Queries**
   - Every foreign key has an index
   - Compound indexes for common filter combinations (e.g., `by_organization_and_status`)
   - Enables efficient `.withIndex()` queries

5. **Type Safety**
   - Union types for status fields (prevents typos)
   - Required vs optional fields clearly defined
   - Convex validates at runtime + TypeScript at compile time
   - **Model names use full service/model path format**: `"service/model-name"` (e.g., `"fal-ai/stable-audio-25/text-to-audio"`, `"openai/gpt-4o"`)

6. **File Storage References**
   - Use `v.id("_storage")` for file references
   - Convex handles file lifecycle automatically

---

## 🔄 Migration Strategy

### **NO DATA MIGRATION NEEDED** 

**Current State:**
- UI/UX is complete and saved on GitHub
- Using mock data for demo purposes
- No real backend or user data yet
- Mock services simulate all operations

**Approach:**
- This is a **fresh start**, not a migration
- No existing user data to preserve
- No complex migration scripts needed
- Simply replace mock services with real Convex functions

### **Implementation Strategy: Start Fresh**

#### **Step 1: Build Convex Backend** (Week 1)
- Set up Convex project
- Create database schema
- Implement queries and mutations
- Test in Convex dashboard

#### **Step 2: Integrate with Frontend** (Week 2)
- Replace Zustand stores with Convex hooks
- Update components to use Convex queries
- Replace mock services with real API calls
- Keep UI/UX unchanged

#### **Step 3: Add Real AI Integration** (Week 3)
- Connect to fal.ai for video generation
- Connect to OpenAI for chat
- Implement progress tracking
- Add error handling

---

## 🛠️ Implementation Details

### **Phase 1: Setup & Configuration** (2-3 hours)

#### **1.1 Install Convex** (15 min)

\`\`\`bash
# Install Convex
npm install convex

# Initialize Convex project
npx convex dev

# This will:
# - Create convex/ folder
# - Generate convex.json config
# - Prompt for login (GitHub)
# - Create dev deployment
# - Add CONVEX_DEPLOYMENT and NEXT_PUBLIC_CONVEX_URL to .env.local
\`\`\`

#### **1.2 Configure Next.js with Clerk Integration** (30 min)

\`\`\`typescript
// providers/ConvexClientProvider.tsx
'use client';

import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { ReactNode } from 'react';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
\`\`\`

\`\`\`typescript
// app/layout.tsx
import { ConvexClientProvider } from './ConvexClientProvider'; // Corrected path

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
\`\`\`

#### **1.3 Configure Clerk + Convex Auth** (30 min)


**Step 1: Create JWT Template in Clerk Dashboard**
1. Navigate to **JWT Templates** in Clerk Dashboard
2. Select **"New template"** and choose **"Convex"** template
3. **IMPORTANT**: Do NOT rename the JWT token. It MUST be called `convex`
4. Add custom claims for organizations:
\`\`\`json
{
  "org_id": "{{org.id}}",
  "org_role": "{{org.role}}",
  "org_slug": "{{org.slug}}"
}
\`\`\`
5. Copy the **Issuer URL** (Frontend API URL)

**Step 2: Create Convex Auth Config**

\`\`\`javascript
// convex/auth.config.js
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
  ],
};
\`\`\`

**Step 3: Set Environment Variables**

Add to `.env.local`:
\`\`\`bash
CLERK_JWT_ISSUER_DOMAIN=https://verb-noun-00.clerk.accounts.dev
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
\`\`\`

**Step 4: Configure in Convex Dashboard**
1. Go to: https://dashboard.convex.dev/deployment/settings
2. Add environment variable:
   - Key: `CLERK_JWT_ISSUER_DOMAIN`
   - Value: Your Clerk Issuer URL (e.g., `https://verb-noun-00.clerk.accounts.dev`)

#### **1.4 Create Database Schema** (60 min)

Create `convex/schema.ts` with the complete schema from the "Data Schema Design" section above.

\`\`\`bash
# Deploy schema
npx convex dev
# Schema will auto-deploy and validate
\`\`\`

#### **1.5 Test Setup** (30 min)

\`\`\`typescript
// convex/test.ts
import { query } from "./_generated/server"

export const hello = query({
  args: {},
  handler: async () => {
    return "Hello from Convex!"
  }
})
\`\`\`

\`\`\`typescript
// app/page.tsx
"use client"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export default function Home() {
  const message = useQuery(api.test.hello)
  return <div>{message}</div> // Should show "Hello from Convex!"
}
\`\`\`

---

### **Phase 2: Core Data Layer** (3-4 hours)

#### **2.1 User Management** (30 min)

\`\`\`typescript
// convex/users.ts
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Sync user from Clerk on first login
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkId))
      .first()

    if (existing) {
      // Update last active
      await ctx.db.patch(existing._id, {
        lastActiveAt: Date.now(),
      })
      return existing._id
    }

    // Create new user
    return await ctx.db.insert("users", {
      clerkUserId: args.clerkId,
      // organizationId: identity.organizationId, // Not setting here, will be set when user joins org
      // role: identity.organizationRole as any, // Not setting here, will be set when user joins org
      // preferences: { ... }, // Default preferences can be set here or in frontend
      totalProjects: 0,
      lastActiveAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

// Get current user (authenticated)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first()
  },
})
\`\`\`

#### **2.2 Project Management with Organization Isolation** (60 min)

\`\`\`typescript
// convex/projects.ts
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// List projects for current user/organization
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const orgId = identity.organizationId; // Optional organization ID

    // If user has an organization, filter by organization
    if (orgId) {
      return await ctx.db
        .query('projects')
        .withIndex('by_organization', (q) => q.eq('organizationId', orgId))
        .order('desc')
        .collect();
    }

    // Otherwise, filter by user ID
    return await ctx.db
      .query('projects')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .collect();
  },
});

// Get single project (with authorization check)
export const get = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check if user owns the project or is in the same organization
    if (project.userId !== identity.subject && 
        project.organizationId !== identity.organizationId) {
      throw new Error("Unauthorized");
    }

    return project;
  },
});

// Create project
export const create = mutation({
  args: {
    name: v.string(), // Note: "name" not "title"
    occasion: v.string(),
    theme: v.string(),
    eventDetails: v.object({
      eventTitle: v.string(), // Renamed from 'name' to 'eventTitle' for clarity
      description: v.optional(v.string()),
      date: v.optional(v.string()),
      location: v.optional(v.string()),
      rsvpLink: v.optional(v.string()),
      emotionalStory: v.string(),
    }),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const orgId = identity.organizationId; // Optional

    // Create project
    const projectId = await ctx.db.insert('projects', {
      userId: identity.subject, // Clerk user ID
      organizationId: orgId, // Optional organization ID
      ...args,
      duration: 0, // Note: "duration" not "totalDuration"
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

// Update project
export const update = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.optional(v.string()),
    occasion: v.optional(v.string()),
    theme: v.optional(v.string()),
    eventDetails: v.optional(v.object({
      eventTitle: v.string(),
      description: v.optional(v.string()),
      date: v.optional(v.string()),
      location: v.optional(v.string()),
      rsvpLink: v.optional(v.string()),
      emotionalStory: v.string(),
    })),
    language: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal('draft'),
      v.literal('in-progress'),
      v.literal('completed')
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check authorization
    if (project.userId !== identity.subject && 
        project.organizationId !== identity.organizationId) {
      throw new Error("Unauthorized");
    }

    const { projectId, ...updates } = args;
    await ctx.db.patch(projectId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete project
export const remove = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check authorization
    if (project.userId !== identity.subject) {
      throw new Error("Unauthorized - only project owner can delete");
    }

    // Delete all scenes
    const scenes = await ctx.db
      .query('scenes')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();

    for (const scene of scenes) {
      await ctx.db.delete(scene._id);
    }

    // Delete project
    await ctx.db.delete(args.projectId);
  },
});
\`\`\`

#### **2.3 Scene Management** (60 min)

\`\`\`typescript
// convex/scenes.ts
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"


const cinematicStylesValidator = v.optional(v.object({
  ambiance: v.optional(v.string()),
  cameraMovement: v.optional(v.string()),
  colorTone: v.optional(v.string()),
  visualStyle: v.optional(v.string()),
}))

// List scenes for a project
export const listScenes = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    // Verify project access
    const project = await ctx.db.get(args.projectId)
    if (!project) throw new Error("Project not found")

    if (project.userId !== identity.subject && 
        project.organizationId !== identity.organizationId) {
      throw new Error("Unauthorized")
    }

    return await ctx.db
      .query('scenes')
      .withIndex('by_project_and_scene_number', (q) => 
        q.eq('projectId', args.projectId)
      )
      .collect()
  },
})

// Get single scene
export const getScene = query({
  args: { sceneId: v.id('scenes') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const scene = await ctx.db.get(args.sceneId)
    if (!scene) throw new Error("Scene not found")

    // Verify project access
    const project = await ctx.db.get(scene.projectId)
    if (!project) throw new Error("Project not found")

    if (project.userId !== identity.subject && 
        project.organizationId !== identity.organizationId) {
      throw new Error("Unauthorized")
    }

    return scene
  },
})

// Create scene
export const createScene = mutation({
  args: {
    projectId: v.id('projects'),
    sceneNumber: v.number(), // Note: "sceneNumber" not "order"
    title: v.string(),
    description: v.string(),
    duration: v.number(), // Note: number, not union of 5 or 10
    startFrame: v.optional(v.id('assets')), // Note: v.id('assets'), not string
    endFrame: v.optional(v.id('assets')), // Note: v.id('assets'), not string
    cinematicStyles: cinematicStylesValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    // Verify project access
    const project = await ctx.db.get(args.projectId)
    if (!project) throw new Error("Project not found")

    if (project.userId !== identity.subject && 
        project.organizationId !== identity.organizationId) {
      throw new Error("Unauthorized")
    }

    const sceneId = await ctx.db.insert('scenes', {
      ...args,
      userId: identity.subject,
      videoUrl: undefined,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Update project total duration
    await ctx.db.patch(args.projectId, {
      duration: project.duration + args.duration,
      updatedAt: Date.now(),
    })

    return sceneId
  },
})

// Update scene
export const updateScene = mutation({
  args: {
    sceneId: v.id('scenes'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    startFrame: v.optional(v.id('assets')), // Note: v.id('assets'), not string
    endFrame: v.optional(v.id('assets')), // Note: v.id('assets'), not string
    cinematicStyles: cinematicStylesValidator,
    videoUrl: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal('draft'),
      v.literal('generating'),
      v.literal('completed')
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const scene = await ctx.db.get(args.sceneId)
    if (!scene) throw new Error("Scene not found")

    // Verify project access
    const project = await ctx.db.get(scene.projectId)
    if (!project) throw new Error("Project not found")

    if (project.userId !== identity.subject && 
        project.organizationId !== identity.organizationId) {
      throw new Error("Unauthorized")
    }

    // If duration changed, update project total
    if (args.duration !== undefined && args.duration !== scene.duration) {
      const durationDiff = args.duration - scene.duration
      await ctx.db.patch(scene.projectId, {
        duration: project.duration + durationDiff,
        updatedAt: Date.now(),
      })
    }

    const { sceneId, ...updates } = args
    await ctx.db.patch(sceneId, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

// Delete scene
export const deleteScene = mutation({
  args: { sceneId: v.id('scenes') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const scene = await ctx.db.get(args.sceneId)
    if (!scene) throw new Error("Scene not found")

    // Verify project access
    const project = await ctx.db.get(scene.projectId)
    if (!project) throw new Error("Project not found")

    if (project.userId !== identity.subject && 
        project.organizationId !== identity.organizationId) {
      throw new Error("Unauthorized")
    }

    // Update project total duration
    await ctx.db.patch(scene.projectId, {
      duration: project.duration - scene.duration,
      updatedAt: Date.now(),
    })

    await ctx.db.delete(args.sceneId)
  },
})
\`\`\`

#### **2.4 Video Management** (45 min)

\`\`\`typescript
// convex/videos.ts
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

const generationParamsValidator = v.object({
  startFrameImageId: v.id("_storage"), // Note: _storage for direct access, will be converted to Id<"assets">
  endFrameImageId: v.id("_storage"),   // Note: _storage for direct access, will be converted to Id<"assets">
  duration: v.number(),
  cinematicStyles: v.object({
    ambiance: v.string(),
    cameraMovement: v.string(),
    colorTone: v.string(),
    visualStyle: v.string(),
  }),
})

// Get video for scene
export const getVideoForScene = query({
  args: { sceneId: v.id("scenes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const scene = await ctx.db.get(args.sceneId)
    if (!scene) throw new Error("Scene not found")

    // Verify project access
    const project = await ctx.db.get(scene.projectId)
    if (!project) throw new Error("Project not found")

    // Check if user has access to the project
    if (project.userId !== identity.subject && 
        project.organizationId !== identity.organizationId) {
      throw new Error("Unauthorized")
    }

    return await ctx.db
      .query("videos")
      // Need to add 'sceneId' to the 'videos' schema for this index
      // .withIndex("by_scene", (q) => q.eq("sceneId", args.sceneId)) 
      // For now, filter by project and sceneId
      .withIndex('by_project', (q) => q.eq('projectId', scene.projectId))
      .filter((q) => q.eq(q.field('sceneId'), args.sceneId)) // Assuming sceneId field added to videos table
      .first()
  },
})

// Create video record (before generation)
export const createVideo = mutation({
  args: {
    sceneId: v.id("scenes"),
    generationParams: generationParamsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const scene = await ctx.db.get(args.sceneId)
    if (!scene) throw new Error("Scene not found")

    // Verify project access
    const project = await ctx.db.get(scene.projectId)
    if (!project) throw new Error("Project not found")

    if (project.userId !== identity.subject && 
        project.organizationId !== identity.organizationId) {
      throw new Error("Unauthorized")
    }

    // Convert storage IDs to asset IDs if necessary and schema allows
    // For simplicity, assuming direct storage IDs are stored if schema changes
    // Or, ensure assets are created FIRST and then their IDs are passed here.
    // The schema defines startFrame/endFrame as v.id('assets') in scenes table.
    // We need to create assets from the uploaded files first.

    // Temporary workaround: Store as storage IDs if schema isn't updated to link assets directly
    // Ideally, the frontend should create assets first and pass their IDs.
    const startFrameAssetId = args.generationParams.startFrameImageId as any; // Cast for now
    const endFrameAssetId = args.generationParams.endFrameImageId as any;   // Cast for now

    return await ctx.db.insert("videos", {
      sceneId: args.sceneId, // Added sceneId to videos table schema
      projectId: scene.projectId,
      userId: identity.subject,
      organizationId: project.organizationId,
      status: "idle",
      // generationParams: args.generationParams, // Store relevant params if needed
      regenerationCount: 0,
      isValidated: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

// Update video status (called by actions during generation)
export const updateVideoStatus = mutation({
  args: {
    videoId: v.id("videos"),
    status: v.union(
      v.literal("idle"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    progress: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { videoId, ...updates } = args
    await ctx.db.patch(videoId, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

// Update video file (after generation completes)
export const updateVideoFile = mutation({
  args: {
    videoId: v.id("videos"),
    videoFileId: v.id("_storage"), // Convex file storage ID
    thumbnailFileId: v.optional(v.id("_storage")), // Optional thumbnail ID
  },
  handler: async (ctx, args) => {
    const videoUrl = await ctx.storage.getUrl(args.videoFileId)
    const thumbnailUrl = args.thumbnailFileId ? await ctx.storage.getUrl(args.thumbnailFileId) : undefined

    if (!videoUrl) throw new Error("Failed to get video URL from storage.")

    await ctx.db.patch(args.videoId, {
      videoFileId: args.videoFileId, // Store storage ID
      url: videoUrl,                  // Store public URL
      thumbnailStorageId: args.thumbnailFileId,
      thumbnailUrl: thumbnailUrl,
      status: "completed",
      updatedAt: Date.now(),
    })
  },
})

// Validate video
export const validateVideo = mutation({
  args: {
    videoId: v.id("videos"),
    isValid: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const video = await ctx.db.get(args.videoId)
    if (!video) throw new Error("Video not found")

    // Verify project access
    const project = await ctx.db.get(video.projectId)
    if (!project) throw new Error("Project not found")

    if (project.userId !== identity.subject && 
        project.organizationId !== identity.organizationId) {
      throw new Error("Unauthorized")
    }

    await ctx.db.patch(args.videoId, {
      isValidated: args.isValid,
      updatedAt: Date.now(),
    })
  },
})

// Increment regeneration count
export const incrementRegenerationCount = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const video = await ctx.db.get(args.videoId)
    if (!video) throw new Error("Video not found")

    await ctx.db.patch(args.videoId, {
      regenerationCount: video.regenerationCount + 1,
      updatedAt: Date.now(),
    })
  },
})
\`\`\`

#### **2.5 Chat Messages** (30 min)

\`\`\`typescript
// convex/chatMessages.ts
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// List messages for conversation
export const listMessages = query({
  args: { projectId: v.id("projects") }, // Changed conversationId to projectId for context
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    // Verify project access
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    if (project.userId !== identity.subject && 
        project.organizationId !== identity.organizationId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("chatMessages")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId)) // Index by project
      .order("asc")
      .collect()
  },
})

// Create message
export const createMessage = mutation({
  args: {
    projectId: v.id("projects"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    // Optional fields for context
    sceneId: v.optional(v.id("scenes")), 
    step: v.optional(v.number()), // Guided workflow step (1-6)
    metadata: v.optional(v.object({
      regenerationRequest: v.optional(v.boolean()),
      approvedMessageId: v.optional(v.string()),
      model: v.optional(v.string()), // For tracking which model was used
      tokens: v.optional(v.number()), // Token usage
      latency: v.optional(v.number()), // API latency
      context: v.optional(v.object({})), // step-specific data
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    // Verify project access
    const project = await ctx.db.get(args.projectId)
    if (!project) throw new Error("Project not found")

    if (project.userId !== identity.subject && 
        project.organizationId !== identity.organizationId) {
      throw new Error("Unauthorized")
    }

    return await ctx.db.insert("chatMessages", {
      ...args,
      organizationId: project.organizationId!, // Ensure organizationId is set
      userId: identity.subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

// Delete message
export const deleteMessage = mutation({
  args: { messageId: v.id("chatMessages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const message = await ctx.db.get(args.messageId)
    if (!message) throw new Error("Message not found")

    // Verify project access
    const project = await ctx.db.get(message.projectId)
    if (!project) throw new Error("Project not found")

    if (project.userId !== identity.subject && 
        project.organizationId !== message.organizationId) { // Check against message's orgId
      throw new Error("Unauthorized")
    }

    await ctx.db.delete(args.messageId)
  },
})
\`\`\`

---

### **Phase 3: File Storage Migration** (2-3 hours)

#### **3.1 File Upload Functions** (60 min)

\`\`\`typescript
// convex/files.ts
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Generate upload URL for client-side upload
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    
    // Optionally, check rate limits or quotas before generating URL
    // await ctx.runMutation(api.rateLimit.checkRateLimit, { service: "convex-storage", limit: 100 }); // Example

    return await ctx.storage.generateUploadUrl()
  },
})

// Save file metadata after upload
export const saveFileMetadata = mutation({
  args: {
    storageId: v.id("_storage"), // Store the storage ID returned by generateUploadUrl
    filename: v.string(), // Note: "filename" not "name"
    type: v.union(
      v.literal('image'),
      v.literal('video'),
      v.literal('audio') // Added 'audio' type
    ),
    size: v.number(), // Note: "size" not "fileSize"
    projectId: v.optional(v.id('projects')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    // Get file URL from storage using the storageId
    const url = await ctx.storage.getUrl(args.storageId)
    if (!url) throw new Error("Failed to get file URL from storage.")

    // If projectId provided, verify access
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId)
      if (!project) throw new Error("Project not found")
      
      if (project.userId !== identity.subject && 
          project.organizationId !== identity.organizationId) {
        throw new Error("Unauthorized")
      }
    }

    const assetId = await ctx.db.insert('assets', {
      userId: identity.subject,
      projectId: args.projectId,
      type: args.type,
      url: url,
      filename: args.filename,
      size: args.size,
      uploadedAt: Date.now(), // Note: "uploadedAt" not "createdAt"
    })

    // Update related tables (e.g., scenes for frames, audioTracks for assets)
    if (args.projectId && args.type === 'image') {
        // This logic might be better handled in a frontend hook or a dedicated mutation
        // that calls saveFileMetadata and then updates the scene.
        // For now, we'll assume frontend handles linking.
    } else if (args.projectId && args.type === 'audio') {
        // Logic to link audio to an audioTrack if needed.
    }
    
    // Track usage
    await ctx.runMutation(api.usageTracking.trackUsage, {
      resourceType: args.type, // 'image' or 'video' or 'audio'
      service: "convex-storage", // Indicate Convex storage
      model: "upload", // Generic model for storage
      creditsUsed: 0, // Storage cost is often separate or managed differently
      metadata: {
        size: args.size,
        success: true,
      },
      projectId: args.projectId,
    })

    return assetId
  },
})

// Get file URL - Note: Usually components will use useQuery(api.files.getFileUrl, { storageId: "..." })
// Or simply use the URL returned by saveFileMetadata if fetched.
export const getFileUrl = query({
  args: { storageId: v.id("_storage") }, // Accepts a Convex storage ID
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId)
  },
})

// List user's assets
export const listAssets = query({
  args: {
    projectId: v.optional(v.id('projects')),
    type: v.optional(v.union( // Allow filtering by type
      v.literal('image'),
      v.literal('video'),
      v.literal('audio')
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    let queryBuilder = ctx.db.query('assets').withIndex('by_user', (q) => 
      q.eq('userId', identity.subject)
    )

    if (args.type) {
        queryBuilder = queryBuilder.withIndex('by_type', (q) => q.eq('type', args.type!))
    }

    const allAssets = await queryBuilder.collect()

    if (args.projectId) {
      // Filter by project if provided
      return allAssets.filter((asset) => asset.projectId === args.projectId)
    }

    return allAssets
  },
})

// Delete asset
export const deleteAsset = mutation({
  args: { assetId: v.id('assets') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const asset = await ctx.db.get(args.assetId)
    if (!asset) throw new Error("Asset not found")

    if (asset.userId !== identity.subject) {
      throw new Error("Unauthorized")
    }

    // Delete from Convex storage
    await ctx.storage.delete(asset.storageId) // Assuming 'storageId' field exists in assets table now

    // Delete metadata
    await ctx.db.delete(args.assetId)
  },
})
\`\`\`

#### **3.2 Client-Side Upload Hook** (45 min)

\`\`\`typescript
// hooks/useFileUpload.ts
"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useAuth } from "@clerk/nextjs" // Import useAuth for user identity

export function useFileUpload() {
  const { getToken } = useAuth() // Get token for authentication with Convex
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const saveFileMetadata = useMutation(api.files.saveFileMetadata)

  const uploadFile = async (
    file: File,
    options?: {
      projectId?: Id<"projects">
      type?: 'image' | 'video' | 'audio' // Include 'audio'
    }
  ): Promise<Id<"assets">> => { // Return the assetId
    if (!file) throw new Error("No file provided")

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Step 1: Generate upload URL
      const uploadUrl = await generateUploadUrl()

      // Step 2: Upload file to Convex storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!response.ok) {
        // Attempt to parse error details from response
        let errorMsg = `Upload failed: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) errorMsg = errorData.message;
        } catch (e) { /* ignore parse error */ }
        throw new Error(errorMsg);
      }

      const { storageId } = await response.json()
      
      // Update progress to 50% after successful upload to storage
      setUploadProgress(50) 

      // Infer type if not provided
      const fileType = options?.type || (file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio');

      // Step 3: Save file metadata
      const assetId = await saveFileMetadata({
        storageId, // Pass storageId directly
        filename: file.name,
        type: fileType as 'image' | 'video' | 'audio', // Assert type
        size: file.size,
        projectId: options?.projectId,
      })

      // Update progress to 100% after saving metadata
      setUploadProgress(100)

      return assetId
    } catch (error) {
      console.error("[FileUpload] Upload failed:", error)
      // Optionally, clear the storage if metadata save fails
      if (error instanceof Error && error.message.includes("Failed to get file URL from storage")) {
        // If storageId was obtained but URL failed, try to delete storage object
        // This requires a separate mutation to handle storage deletion if needed.
      }
      throw error // Re-throw to be caught by the caller
    } finally {
      setIsUploading(false)
      // Reset progress after a short delay to show 100% completion
      setTimeout(() => setUploadProgress(0), 1000); 
    }
  }

  return {
    uploadFile,
    isUploading,
    uploadProgress,
  }
}
\`\`\`

#### **3.3 Update Asset Management Hook** (45 min)

\`\`\`typescript
// hooks/business-logic/useAssetManagement.ts (UPDATED)
"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useFileUpload } from "@/hooks/useFileUpload"
import type { Id } from "@/convex/_generated/dataModel"

export function useAssetManagement(projectId?: Id<"projects">) {
  // Convex queries
  const assets = useQuery(api.files.listAssets, projectId ? { projectId } : {})
  const deleteAssetMutation = useMutation(api.files.deleteAsset)

  // File upload hook
  const { uploadFile, isUploading, uploadProgress } = useFileUpload()

  const handleUploadAsset = async (file: File): Promise<Id<"assets">> => { // Returns assetId
    try {
      const assetId = await uploadFile(file, {
        projectId,
        // Type will be inferred by useFileUpload based on file.type
      })
      return assetId
    } catch (error) {
      console.error("[AssetManagement] Upload failed:", error)
      throw error
    }
  }

  const handleDeleteAsset = async (assetId: Id<"assets">) => {
    try {
      await deleteAssetMutation({ assetId })
    } catch (error) {
      console.error("[AssetManagement] Delete failed:", error)
      throw error
    }
  }

  return {
    assets: assets || [],
    isLoading: assets === undefined,
    isUploading,
    uploadProgress,
    uploadAsset: handleUploadAsset,
    deleteAsset: handleDeleteAsset,
  }
}
\`\`\`

---

### **Phase 4: AI Integration** (3-4 hours)

#### **4.1 OpenAI Chat Integration** (90 min)

\`\`\`typescript
// convex/actions/aiChat.ts
"use server"

import { v } from "convex/values"
import { action } from "../_generated/server"
import { api } from "../_generated/api"
import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export const generateChatResponse = action({
  args: {
    projectId: v.id("projects"),
    userMessage: v.string(),
    sceneId: v.optional(v.id("scenes")), // Context for the chat
    // conversationId is implicitly handled by projectId and sceneId association
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const project = await ctx.db.get(args.projectId)
    if (!project) throw new Error("Project not found")
    if (project.userId !== identity.subject && project.organizationId !== identity.organizationId) {
      throw new Error("Unauthorized")
    }

    // Save user message with project and scene context
    await ctx.runMutation(api.chatMessages.createMessage, {
      projectId: args.projectId,
      sceneId: args.sceneId,
      role: "user",
      content: args.userMessage,
    })

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: `You are a helpful AI assistant for MyShortReel, an AI-powered video invitation generator. You are assisting the user with project "${project.name}". The current context is related to scene "${args.sceneId || 'general project'}"`,
        },
        // Consider fetching previous messages for a full conversation history
        // For now, sending only the user's current message for simplicity.
      ]
      
      // Add user message
      messages.push({ role: "user", content: args.userMessage })

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Use a more advanced model
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: false, // Set to true for streaming responses
      })

      const assistantMessageContent = response.choices[0].message.content
      if (!assistantMessageContent) {
        throw new Error("OpenAI API returned an empty message.")
      }

      // Track usage
      const usage = response.usage
      await ctx.runMutation(api.usageTracking.trackUsage, {
        resourceType: 'chat',
        service: "openai",
        model: `openai/${response.model}`, // e.g., "openai/gpt-4o"
        creditsUsed: usage?.total_tokens || 0, // Approximation, refine if needed
        cost: await calculateOpenAICost(response.model, usage?.prompt_tokens, usage?.completion_tokens), // Implement cost calculation
        metadata: {
          inputTokens: usage?.prompt_tokens,
          outputTokens: usage?.completion_tokens,
          latency: response.modelInfo?.completion_time_ms, // If available
          success: true,
        },
        projectId: args.projectId,
        resourceId: args.sceneId, // Link to scene if applicable
      });

      // Save assistant message
      const messageId = await ctx.runMutation(api.chatMessages.createMessage, {
        projectId: args.projectId,
        sceneId: args.sceneId,
        role: "assistant",
        content: assistantMessageContent,
        metadata: {
          model: `openai/${response.model}`,
          tokens: usage?.total_tokens,
          latency: response.modelInfo?.completion_time_ms,
        }
      })

      return {
        success: true,
        messageId,
        content: assistantMessageContent,
      }
    } catch (error) {
      console.error("[AIChat] OpenAI API error:", error)

      // Save error message
      await ctx.runMutation(api.chatMessages.createMessage, {
        projectId: args.projectId,
        sceneId: args.sceneId,
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
      })

      // Track failed usage
      await ctx.runMutation(api.usageTracking.trackUsage, {
        resourceType: 'chat',
        service: "openai",
        model: "openai/gpt-4o", // Defaulting to the model we attempted to use
        creditsUsed: 0, // Or estimate based on prompt sent
        cost: 0, // No cost for failed call usually
        metadata: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        projectId: args.projectId,
        resourceId: args.sceneId,
      });

      throw error
    }
  },
})

// Helper to calculate OpenAI costs (requires up-to-date pricing)
async function calculateOpenAICost(model: string, promptTokens?: number, completionTokens?: number): Promise<number | undefined> {
  if (!promptTokens || !completionTokens) return undefined;

  // Example pricing - **UPDATE THIS WITH CURRENT PRICING FROM OPENAI DOCS**
  let promptCostPer1k = 0;
  let completionCostPer1k = 0;

  switch (model) {
    case 'gpt-4o':
      promptCostPer1k = 5; // $0.005 / 1k tokens
      completionCostPer1k = 15; // $0.015 / 1k tokens
      break;
    case 'gpt-4-turbo':
      promptCostPer1k = 10; // $0.01 / 1k tokens
      completionCostPer1k = 30; // $0.03 / 1k tokens
      break;
    case 'gpt-3.5-turbo':
      promptCostPer1k = 0.5; // $0.0005 / 1k tokens
      completionCostPer1k = 1.5; // $0.0015 / 1k tokens
      break;
    default:
      return undefined; // Unknown model
  }

  const promptCost = (promptTokens / 1000) * promptCostPer1k;
  const completionCost = (completionTokens / 1000) * completionCostPer1k;

  return parseFloat((promptCost + completionCost).toFixed(6)); // Return cost in USD
}

export const generateImagePrompt = action({
  args: {
    description: v.string(),
    frameType: v.union(v.literal("start"), v.literal("end")),
    cinematicStyles: v.optional(v.object({
      ambiance: v.string(),
      cameraMovement: v.string(),
      colorTone: v.string(),
      visualStyle: v.string(),
    })),
    projectId: v.id("projects"), // Context for usage tracking
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    try {
      // Build enhanced prompt
      let prompt = `${args.description}, ${args.frameType} frame`

      if (args.cinematicStyles) {
        const { ambiance, cameraMovement, colorTone, visualStyle } = args.cinematicStyles
        if (ambiance) prompt += `, ${ambiance} ambiance`
        if (cameraMovement) prompt += `, ${cameraMovement} camera movement`
        if (colorTone) prompt += `, ${colorTone} color tone`
        if (visualStyle) prompt += `, ${visualStyle} visual style`
      }

      prompt += ", high quality, cinematic, professional, 4K, photorealistic"

      // Use OpenAI to enhance the prompt further
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert at writing prompts for AI image generation. Enhance the following prompt to be more detailed and effective for generating cinematic video frames. Focus on visual details, lighting, and mood.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 200,
      })

      const enhancedPrompt = response.choices[0].message.content
      const usage = response.usage

      // Track usage for prompt generation
      await ctx.runMutation(api.usageTracking.trackUsage, {
        resourceType: 'chat', // Or a specific 'prompt_generation' type if added
        service: "openai",
        model: `openai/${response.model}`,
        creditsUsed: usage?.total_tokens || 0,
        cost: await calculateOpenAICost(response.model, usage?.prompt_tokens, usage?.completion_tokens),
        metadata: {
          inputTokens: usage?.prompt_tokens,
          outputTokens: usage?.completion_tokens,
          success: true,
          context: { originalPrompt: prompt, frameType: args.frameType }
        },
        projectId: args.projectId,
      });

      return enhancedPrompt || prompt; // Return enhanced prompt, fallback to original

    } catch (error) {
      console.error("[AIChat] Prompt generation error:", error)
      // Return basic prompt as fallback
      
      await ctx.runMutation(api.usageTracking.trackUsage, {
        resourceType: 'chat', 
        service: "openai",
        model: "openai/gpt-4o", // Fallback model
        creditsUsed: 0, 
        cost: 0,
        metadata: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          context: { originalPrompt: args.description, frameType: args.frameType }
        },
        projectId: args.projectId,
      });

      return args.description // Return original description as fallback prompt
    }
  },
})
\`\`\`

#### **4.2 Video Generation Action** (90 min)

\`\`\`typescript
// convex/actions/videoGeneration.ts
"use server"

import { v } from "convex/values"
import { action } from "../_generated/server"
import { api } from "../_generated/api"
import axios from "axios" // Using axios for easier HTTP handling

// Helper to get public URL from Convex storage ID
async function getConvexFileUrl(ctx: any, storageId: Id<"_storage">): Promise<string> {
  const url = await ctx.storage.getUrl(storageId);
  if (!url) throw new Error(`Failed to get URL for storage ID: ${storageId}`);
  return url;
}

export const generateVideo = action({
  args: {
    videoId: v.id("videos"),
    sceneId: v.id("scenes"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const video = await ctx.runQuery(api.videos.getVideo, { videoId: args.videoId }) // Assuming getVideo query exists
    if (!video) throw new Error("Video not found")
    
    const scene = await ctx.runQuery(api.scenes.getScene, { sceneId: args.sceneId })
    if (!scene) throw new Error("Scene not found")

    // Verify project access via video record
    const project = await ctx.db.get(video.projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== identity.subject && project.organizationId !== identity.organizationId) {
      throw new Error("Unauthorized");
    }

    try {
      // Update status to generating
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "generating",
        progress: 0,
      })

      // Get image URLs from Convex storage using asset IDs
      const startFrameUrl = scene.startFrame ? await getConvexFileUrl(ctx, scene.startFrame) : null;
      const endFrameUrl = scene.endFrame ? await getConvexFileUrl(ctx, scene.endFrame) : null;

      if (!startFrameUrl || !endFrameUrl) {
        throw new Error("Missing start or end frame images for video generation.");
      }

      // --- Call External Video Generation API (using fal.ai as an example) ---
      // NOTE: Replace with your actual video generation service and model
      const falAiResponse = await axios.post(
        "https://api.fal.ai/v1/sync/generations/create",
        {
          // Model name for video generation (e.g., Kling AI)
          // Check fal.ai docs for available models and their exact names/parameters
          model: "fal-ai/kling-v1/standard/image-to-video", 
          inputs: {
            image_url: startFrameUrl, // Use startFrameUrl for image-to-video models
            // Other parameters based on the model, e.g.:
            fps: 24,
            motion_effect: "dynamic", // Example parameter
            duration: scene.duration || 5, // Default to 5 seconds if not specified
          },
          // You might need to specify output format, resolution, etc.
        },
        {
          headers: {
            Authorization: `Key ${process.env.FAL_KEY}`,
            "Content-Type": "application/json",
          },
        }
      )
      
      const jobId = falAiResponse.data.id;
      let videoResult = falAiResponse.data.result; // Initially might be null or pending
      let progress = falAiResponse.data.progress || 0;
      let pollCount = 0;
      const MAX_POLLS = 15; // Poll for max 15 times (e.g., 15 * 5 seconds = 75 seconds)

      // Poll for completion if the API is asynchronous
      while (progress < 100 && !videoResult && pollCount < MAX_POLLS) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        pollCount++;

        const statusResponse = await axios.get(
          `https://api.fal.ai/v1/sync/generations/${jobId}`, // Check fal.ai docs for status endpoint
          {
            headers: { Authorization: `Key ${process.env.FAL_KEY}` },
          }
        )
        
        videoResult = statusResponse.data.result;
        progress = statusResponse.data.progress || 0;
        
        // Update status/progress in Convex
        await ctx.runMutation(api.videos.updateVideoStatus, {
          videoId: args.videoId,
          status: "generating",
          progress: Math.min(progress, 99), // Keep progress < 100 until done
        });
      }

      if (!videoResult || !videoResult.video_url) { // Adjust based on fal.ai response structure
        throw new Error(`Video generation failed or timed out after ${MAX_POLLS} polls. Final progress: ${progress}%`);
      }

      // Download video file from the generated URL
      const videoDownloadResponse = await axios.get(videoResult.video_url, {
        responseType: 'blob', // Expect binary data
      });
      
      // Upload the downloaded video to Convex storage
      const convexStorageResponse = await fetch(await ctx.storage.generateUploadUrl(), {
        method: "POST",
        body: videoDownloadResponse.data, // Blob or Buffer
        headers: { "Content-Type": "video/mp4" }, // Adjust content type if needed
      });
      
      if (!convexStorageResponse.ok) throw new Error("Failed to upload generated video to Convex storage.");
      const { storageId: generatedVideoStorageId } = await convexStorageResponse.json();

      // Optional: Generate thumbnail if API provides one or create one from video
      // For now, skipping thumbnail generation

      // Update video record in Convex with the generated video file ID
      await ctx.runMutation(api.videos.updateVideoFile, {
        videoId: args.videoId,
        videoFileId: generatedVideoStorageId,
        // thumbnailFileId: ... // If thumbnail is generated
      });

      // Track usage for the AI generation
      await ctx.runMutation(api.usageTracking.trackUsage, {
        resourceType: 'video',
        eventType: 'generation',
        service: "fal-ai", // Or the specific service used
        model: "fal-ai/kling-v1/standard/image-to-video", // Match the model used
        creditsUsed: 1, // Example: 1 credit per video generation, adjust as needed
        cost: await calculateFalAiCost(falAiResponse.data.id), // Implement cost calculation
        metadata: {
          duration: scene.duration,
          resolution: "1080p", // Example, get from API if available
          success: true,
          jobId: jobId, // Store original job ID for reference
        },
        projectId: args.projectId,
        resourceId: args.sceneId, // Link to the scene
      });

      return {
        success: true,
        videoId: args.videoId,
        videoFileId: generatedVideoStorageId,
      }
    } catch (error) {
      console.error("[VideoGeneration] Error:", error)

      // Update status to failed
      await ctx.runMutation(api.videos.updateVideoStatus, {
        videoId: args.videoId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error during video generation",
      })

      // Track failed usage
      await ctx.runMutation(api.usageTracking.trackUsage, {
        resourceType: 'video',
        eventType: 'generation',
        service: "fal-ai",
        model: "fal-ai/kling-v1/standard/image-to-video",
        creditsUsed: 0, // No credits used for failed generation
        cost: 0,
        metadata: {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error during video generation",
          // jobId: jobId, // If jobId was obtained before error
        },
        projectId: args.projectId,
        resourceId: args.sceneId,
      });

      throw error // Re-throw to be caught by the caller
    }
  },
})

// Placeholder for cost calculation for fal.ai
async function calculateFalAiCost(jobId: string): Promise<number | undefined> {
  // Implement logic to fetch actual cost from fal.ai API if available,
  // or use predefined pricing based on model and duration.
  // For now, return a placeholder.
  return 0.5; // Example: $0.50 per video generation
}

// Add a query to get video details by ID
export const getVideo = query({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const video = await ctx.db.get(args.videoId);
    if (!video) throw new Error("Video not found");

    // Verify project access
    const project = await ctx.db.get(video.projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== identity.subject && project.organizationId !== identity.organizationId) {
      throw new Error("Unauthorized");
    }

    return video;
  },
});


export const regenerateVideo = action({
  args: {
    videoId: v.id("videos"),
    sceneId: v.id("scenes"),
    feedback: v.string(), // User feedback for regeneration
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const video = await ctx.runQuery(api.videos.getVideo, { videoId: args.videoId })
    if (!video) throw new Error("Video not found")

    try {
      // Increment regeneration count
      await ctx.runMutation(api.videos.incrementRegenerationCount, {
        videoId: args.videoId,
      })

      // --- Enhance prompt with feedback ---
      // This is where you'd potentially use an AI model (like OpenAI)
      // to refine the video generation prompt based on user feedback.
      // For now, we'll just pass the feedback along or ignore it.
      
      // In a real implementation, you might call:
      // const enhancedPrompt = await ctx.runAction(api.aiChat.generateImagePrompt, { ... }); // Corrected to generateImagePrompt
      // and pass that to the video generation API.

      // Reuse the generateVideo logic, potentially passing enhanced parameters
      return await generateVideo(ctx, {
        videoId: args.videoId,
        sceneId: args.sceneId,
      })
    } catch (error) {
      console.error("[VideoGeneration] Regeneration error:", error)
      throw error
    }
  },
})
\`\`\`

---

### **Phase 5: Frontend Migration** (2-3 hours)

#### **3.1 Using Convex Auth Hooks** (30 min)

\`\`\`typescript
'use client';

import { useConvexAuth } from 'convex/react';
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react';

export default function MyComponent() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <Authenticated>
        <div>You are signed in!</div>
      </Authenticated>
      
      <Unauthenticated>
        <div>Please sign in</div>
      </Unauthenticated>
    </div>
  );
}
\`\`\`

**Why use `useConvexAuth()` instead of Clerk's `useAuth()`?**
- Ensures browser has fetched the auth token needed for Convex
- Confirms Convex backend has validated the token
- Prevents race conditions where UI shows as authenticated but Convex queries fail

#### **3.2 Organization Context** (30 min)

\`\`\`typescript
'use client';

import { useOrganization } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

// Assume Project and BillingButton components are defined elsewhere
interface Project { _id: Id<'projects'>; name: string; /* ... other fields */ }
const ProjectList: React.FC<{ projects: Project[] | undefined }> = ({ projects }) => (
  <ul>
    {projects?.map(p => <li key={p._id}>{p.name}</li>)}
  </ul>
);
const BillingButton: React.FC = () => <button>Manage Billing</button>;

export default function ProjectDashboard() {
  const { organization, membership } = useOrganization();
  
  const projects = useQuery(api.projects.list);
  
  // Check if user can manage billing (e.g., org admin)
  const canManageBilling = membership?.role === 'org:admin';
  
  return (
    <div>
      <h1>{organization?.name ?? 'My Projects'}</h1>
      {canManageBilling && <BillingButton />}
      <ProjectList projects={projects} />
    </div>
  );
}
\`\`\`

#### **5.1 Replace Zustand with Convex Hooks** (60 min)

**Example: Scene Management Hook**

\`\`\`typescript
// hooks/business-logic/useSceneManagement.ts (UPDATED)
"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useCallback } from "react"

// Assume these types are defined elsewhere or derived from schema
interface CinematicStyles {
  ambiance?: string;
  cameraMovement?: string;
  colorTone?: string;
  visualStyle?: string;
}

// Define interfaces matching your Convex schema for better type safety
// Extend with necessary fields like _id, projectId, userId, etc.
interface Scene {
  _id: Id<"scenes">;
  projectId: Id<"projects">;
  userId: string;
  sceneNumber: number;
  title: string;
  description: string;
  duration: number;
  startFrame?: Id<"assets">; // Use Id<"assets">
  endFrame?: Id<"assets">;   // Use Id<"assets">
  cinematicStyles?: CinematicStyles;
  videoUrl?: string;
  status: 'draft' | 'generating' | 'completed';
  createdAt: number;
  updatedAt: number;
}

interface Project {
  _id: Id<"projects">;
  userId: string;
  organizationId?: string;
  name: string;
  occasion: string;
  theme: string;
  eventDetails: {
    eventTitle: string; // Use eventTitle
    description?: string;
    date?: string;
    location?: string;
    rsvpLink?: string;
    emotionalStory: string;
  };
  language: string;
  duration: number;
  status: 'draft' | 'in-progress' | 'completed';
  createdAt: number;
  updatedAt: number;
}

export function useSceneManagement(projectId: Id<"projects">) {
  // Convex queries (reactive - auto-updates!)
  const scenes = useQuery(api.scenes.listScenes, { projectId }) as Scene[] | undefined;
  const project = useQuery(api.projects.get, { projectId }) as Project | undefined;

  // Convex mutations
  const createSceneMutation = useMutation(api.scenes.createScene)
  const updateSceneMutation = useMutation(api.scenes.updateScene)
  const deleteSceneMutation = useMutation(api.scenes.deleteScene)

  const addScene = useCallback(
    async (sceneData: {
      title: string
      description: string
      duration: number
      cinematicStyles?: CinematicStyles
    }) => {
      // Determine the next scene number
      const nextSceneNumber = (scenes?.length || 0) + 1;
      await createSceneMutation({
        projectId,
        sceneNumber: nextSceneNumber,
        ...sceneData,
      })
    },
    [createSceneMutation, projectId, scenes?.length]
  )

  const updateScene = useCallback(
    async (sceneId: Id<"scenes">, updates: Partial<Scene>) => {
      // Filter out undefined values from updates to avoid patching with undefined
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      if (Object.keys(cleanUpdates).length === 0) return; // No actual updates

      await updateSceneMutation({ sceneId, ...cleanUpdates })
    },
    [updateSceneMutation]
  )

  const removeScene = useCallback(
    async (sceneId: Id<"scenes">) => {
      await deleteSceneMutation({ sceneId })
    },
    [deleteSceneMutation]
  )

  // Function to reorder scenes based on new order
  const reorderSceneNumbers = useCallback(async (orderedSceneIds: Id<"scenes">[]) => {
    const currentScenes = scenes || [];
    // Create a map for quick lookup of scenes by ID
    const sceneMap = new Map(currentScenes.map(s => [s._id, s]));

    // Ensure all orderedSceneIds exist in the currentScenes
    const validOrderedSceneIds = orderedSceneIds.filter(id => sceneMap.has(id));
    if (validOrderedSceneIds.length !== orderedSceneIds.length) {
        console.warn("Some scene IDs provided for reordering were not found.");
    }

    for (let i = 0; i < validOrderedSceneIds.length; i++) {
      const sceneId = validOrderedSceneIds[i];
      const scene = sceneMap.get(sceneId);
      if (!scene) continue; // Should not happen due to filter above

      const newSceneNumber = i + 1;
      if (scene.sceneNumber !== newSceneNumber) {
        await updateSceneMutation({
          sceneId: scene._id,
          sceneNumber: newSceneNumber,
        });
      }
    }
  }, [scenes, updateSceneMutation]);

  const isSceneValid = useCallback((sceneId: Id<"scenes">): boolean => {
    const scene = scenes?.find((s) => s._id === sceneId)
    if (!scene) return false

    // Validation based on schema: title, description, duration, startFrame, endFrame must exist
    return !!(
      scene.title?.trim() &&
      scene.description?.trim() &&
      scene.duration > 0 &&
      scene.startFrame && // Check if startFrame (Id<"assets">) exists
      scene.endFrame    // Check if endFrame (Id<"assets">) exists
    )
  }, [scenes])

  return {
    // State (reactive!)
    scenes: scenes || [],
    isLoading: scenes === undefined || project === undefined,
    totalDuration: project?.duration || 0, // Use project.duration
    canAddScene: (scenes?.length || 0) < 10, // Assuming a limit of 10 scenes per project

    // Actions
    addScene,
    updateScene,
    removeScene,
    reorderSceneNumbers, // Use the new reorder function

    // Utilities
    isSceneValid,
  }
}
\`\`\`

#### **5.2 Update Components** (60 min)

**Example: Scene Editor Component**

\`\`\`typescript
// components/scene-management/SceneEditor.tsx (UPDATED)
"use client"

import { useSceneManagement } from "@/hooks/business-logic/useSceneManagement"
import { useFileUpload } from "@/hooks/useFileUpload"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button" // Assuming you have a UI library like shadcn/ui
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select" // For cinematic styles
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // For layout
import { Skeleton } from "@/components/ui/skeleton" // For loading states
import { useCallback } from "react"

// Assume CinematicStyles and Scene interfaces are imported or defined globally
// import { Scene, CinematicStyles } from "@/types/convex"; 

export function SceneEditor({
  projectId,
  sceneId,
}: {
  projectId: Id<"projects">
  sceneId: Id<"scenes">
}) {
  const { scenes, updateScene, isLoading, isSceneValid } = useSceneManagement(projectId)
  const { uploadFile, isUploading, uploadProgress } = useFileUpload()

  const scene = scenes.find((s) => s._id === sceneId)

  if (isLoading || !scene) return (
    <Card>
      <CardHeader>
        <CardTitle>{isLoading ? <Skeleton className="h-6 w-40" /> : "Scene Not Found"}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <p>Could not load the scene details.</p>
        )}
      </CardContent>
    </Card>
  )

  const handleUpdateScene = useCallback((field: keyof Scene, value: any) => {
    updateScene(sceneId, { [field]: value });
  }, [sceneId, updateScene]);

  const handleUploadAsset = async (file: File, frameType: 'startFrame' | 'endFrame') => {
    try {
      const assetId = await uploadFile(file, { projectId, type: "image" }); // Specify type as 'image'
      handleUpdateScene(frameType, assetId); // Update scene with the assetId
    } catch (error) {
      console.error(`Failed to upload ${frameType}:`, error);
      // Display error to user
    }
  };

  // Extract cinematic styles for easier handling
  const styles = scene.cinematicStyles || {};
  const handleUpdateStyles = (key: keyof typeof styles, value: string | undefined) => {
    handleUpdateScene('cinematicStyles', { ...styles, [key]: value });
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Edit Scene: {scene.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="scene-title">Scene Title</Label>
            <Input
              id="scene-title"
              value={scene.title}
              onChange={(e) => handleUpdateScene('title', e.target.value)}
              placeholder="e.g., The Proposal"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="scene-description">Description / Prompt</Label>
            <Textarea
              id="scene-description"
              value={scene.description}
              onChange={(e) => handleUpdateScene('description', e.target.value)}
              placeholder="Describe the scene content..."
              rows={3}
            />
          </div>

          {/* Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scene-duration">Duration (seconds)</Label>
              <Input
                id="scene-duration"
                type="number"
                value={scene.duration}
                min={1}
                max={15} // Max duration per scene, adjust as needed
                onChange={(e) => handleUpdateScene('duration', parseInt(e.target.value, 10) || 0)}
              />
            </div>

            {/* Cinematic Styles - Example Select components */}
            <div>
              <Label htmlFor="scene-ambiance">Ambiance</Label>
              <Select 
                value={styles.ambiance} 
                onValueChange={(val) => handleUpdateStyles('ambiance', val)}
              >
                <SelectTrigger><SelectValue placeholder="Select ambiance" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="romantic">Romantic</SelectItem>
                  <SelectItem value="energetic">Energetic</SelectItem>
                  <SelectItem value="dramatic">Dramatic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Add other style selects similarly (cameraMovement, colorTone, visualStyle) */}
          </div>

          {/* Frame Uploads */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Frame Upload */}
            <div>
              <Label htmlFor="start-frame-upload">Start Frame</Label>
              <Input
                id="start-frame-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUploadAsset(file, 'startFrame')
                }}
                disabled={isUploading}
                className="cursor-pointer"
              />
              {isUploading && uploadProgress > 0 && <p>Uploading: {uploadProgress}%</p>}
              {scene.startFrame && <p className="text-sm text-muted-foreground">Uploaded.</p>}
            </div>

            {/* End Frame Upload */}
            <div>
              <Label htmlFor="end-frame-upload">End Frame</Label>
              <Input
                id="end-frame-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUploadAsset(file, 'endFrame')
                }}
                disabled={isUploading}
                className="cursor-pointer"
              />
              {scene.endFrame && <p className="text-sm text-muted-foreground">Uploaded.</p>}
            </div>
          </div>

          {/* Validation Button/Indicator */}
          <div className="flex justify-between items-center">
            <Button 
              onClick={() => handleUpdateScene('status', 'draft')} 
              variant="outline"
              disabled={!isSceneValid(scene._id)}
            >
              Mark as Draft (Needs Validation)
            </Button>
            {isSceneValid(scene._id) ? (
              <span className="text-green-500 text-sm">Scene is valid</span>
            ) : (
              <span className="text-yellow-500 text-sm">Scene needs title, description, duration, and frames.</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
\`\`\`

---

### **Phase 6: Testing & Polish** (2-3 hours)

#### **6.1 Testing Checklist**

**Unit Tests (Convex Functions)**
- [ ] User sync from Clerk works
- [ ] Project CRUD operations (including org/user filtering)
- [ ] Scene CRUD operations (including project access checks, duration updates)
- [ ] Asset upload/deletion (metadata and storage)
- [ ] Video status/file updates
- [ ] Chat message creation (with auth checks)
- [ ] Authorization checks (can't access other users' data)
- [ ] Rate limit checks function correctly
- [ ] Usage tracking logs are created

**Integration Tests**
- [ ] End-to-end scene creation flow (user enters details, assigns frames, saves)
- [ ] File upload → asset creation → scene update (start/end frames)
- [ ] AI Chat interaction (user sends message, gets AI response)
- [ ] Video generation trigger (from scene updates/button click)
- [ ] Real-time updates (open two browser tabs, make a change in one, see it in the other)
- [ ] Multi-device sync (desktop + mobile - if applicable)
- [ ] Project creation and scene management within an organization

**Performance Tests**
- [ ] Query performance with 100+ scenes per project
- [ ] File upload with large files (e.g., 50MB+)
- [ ] Concurrent AI requests (if applicable)
- [ ] Real-time subscription performance under load

**Error Handling Tests**
- [ ] Network errors during file upload
- [ ] AI API failures (e.g., OpenAI, video generation)
- [ ] Invalid file types or sizes during upload
- [ ] Unauthorized access attempts (e.g., trying to edit another user's project)
- [ ] Database constraint violations (if any)

#### **6.2 Convex Dashboard Testing**

Use the Convex Dashboard for interactive testing:

1. **Data Tab**: View and edit database records. Crucial for verifying data integrity and structure.
2. **Functions Tab**: Test queries/mutations with custom arguments. Essential for debugging logic without frontend.
3. **Logs Tab**: Monitor function execution, view `console.log` output, and identify errors.
4. **File Storage Tab**: View uploaded files. Verify they are stored correctly.
5. **Deployments Tab**: Manage dev/prod environments and view deployment history.

---

## 🔒 Security Best Practices

### **Multi-Tenancy Security**

1. **Always validate auth in every function**
\`\`\`typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
  throw new Error("Unauthenticated");
}
\`\`\`

2. **Always filter by organization/user**
\`\`\`typescript
// ✅ CORRECT - Organization/User isolation
// For organization-scoped data:
const projects = await ctx.db
  .query("projects")
  .withIndex("by_organization", (q) => q.eq("organizationId", identity.organizationId))
  .collect();

// For user-scoped data (or when no org is active):
const projects = await ctx.db
  .query("projects")
  .withIndex("by_user", (q) => q.eq("userId", identity.subject))
  .collect();

// ❌ WRONG - No tenant isolation (security vulnerability)
const projects = await ctx.db
  .query("projects")
  .collect();
\`\`\`

3. **Verify organization/user membership for resource access**
\`\`\`typescript
const project = await ctx.db.get(args.projectId);
// Check if the user owns the project OR if they are in the same organization and the resource is org-scoped
if (project.userId !== identity.subject && project.organizationId !== identity.organizationId) {
  throw new Error("Unauthorized");
}
\`\`\`

4. **Check admin role for sensitive operations**
\`\`\`typescript
// Example: Only allow project deletion by owner or admin
if (project.userId !== identity.subject && identity.organizationRole !== 'org:admin') {
  throw new Error("Permission denied");
}
\`\`\`

5. **Validate subscription/quota before operations**
\`\`\`typescript
// This would involve querying the 'subscriptions' or 'creditBalances' tables
// and checking against limits before allowing resource creation (e.g., new project, video generation).
// Example pseudo-code:
// const userOrgId = identity.organizationId;
// const creditBalance = await ctx.db.query("creditBalances").withIndex("by_organization", q => q.eq("organizationId", userOrgId)).first();
// if (!creditBalance || creditBalance.remainingCredits < REQUIRED_CREDITS) {
//   throw new Error("Insufficient credits. Please upgrade your plan.");
// }
\`\`\`

---

## 🚀 Production Deployment

### **Step 1: Create Production Deployment**

\`\`\`bash
# Create production deployment
npx convex deploy --prod

# This creates a new production deployment with separate:
# - Database
# - File storage
# - Environment variables
\`\`\`

### **Step 2: Configure Production Environment**

**In Convex Dashboard (Production):**
1. Go to Settings → Environment Variables
2. Add production API keys:
   - `CLERK_JWT_ISSUER_DOMAIN` (production Clerk Issuer URL)
   - `OPENAI_API_KEY` (production key)
   - `FAL_KEY` (production key)
   - `VIDEO_GENERATION_API_KEY` (your actual video generation API key)

**In Vercel (or your hosting platform):**
1. Add production Convex URL:
   - `NEXT_PUBLIC_CONVEX_URL` (from Convex dashboard)
2. Add production Clerk keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_JWT_ISSUER_DOMAIN`

### **Step 3: Deploy Next.js App**

\`\`\`bash
# Deploy to Vercel
vercel --prod

# Or use GitHub integration for auto-deploy
\`\`\`

### **Step 4: Production Checklist**

- [ ] All environment variables configured correctly for production.
- [ ] Clerk production instance connected and configured.
- [ ] API rate limits (if any) considered and handled.
- [ ] File storage limits (if any) set and monitored.
- [ ] Monitoring and alerting set up (e.g., Sentry, Convex Logs).
- [ ] Backup strategy in place (Convex handles this automatically for the database).
- [ ] Error tracking (e.g., Sentry) integrated.
- [ ] Performance monitoring enabled.

---

## 💡 Solo Developer Tips

### **Time Management**

**Week 1: Foundation (8-10 hours)**
- Day 1-2: Setup + Schema (4 hours)
- Day 3-4: Core queries/mutations (4 hours)
- Day 5: Testing in dashboard (2 hours)

**Week 2: Features (10-12 hours)**
- Day 1-2: File storage (4 hours)
- Day 3-4: AI integration (6 hours)
- Day 5: Testing (2 hours)

**Week 3: Migration (8-10 hours)**
- Day 1-2: Frontend migration (4 hours)
- Day 3-4: Bug fixes (4 hours)
- Day 5: Polish + deploy (2 hours)

### **Debugging Strategies**

1. **Use Console Logs Liberally**
\`\`\`typescript
export const myFunction = mutation({
  handler: async (ctx, args) => {
    console.log("[v0] Starting myFunction with args:", args)
    // ... perform operations
    const result = await ctx.db.insert("table", data)
    console.log("[v0] Inserted record:", result)
    return result
  }
})
\`\`\`

2. **Test in Dashboard First**
   - Before writing frontend code, test functions in Convex Dashboard.
   - Verify queries return expected data.
   - Test mutations with various inputs.

3. **Use Convex Auth Helpers**
   - Use `Authenticated`, `Unauthenticated`, `AuthLoading` components.
   - Use `useConvexAuth()` hook for client-side auth state checks.
   - This prevents race conditions and ensures auth tokens are ready for Convex calls.

4. **Leverage Convex Dashboard for Debugging**
- **Data Tab**: Inspect all database tables and documents.
- **Functions Tab**: Interactively test queries and mutations.
- **Logs Tab**: Monitor execution, view `console.log`s, and trace errors.
- **File Storage Tab**: Check uploaded files and their metadata.
- **Real-time Tab**: Observe live data changes.

5. **Embrace TypeScript Strictly**
   - Enable strict mode in `tsconfig.json`.
   - Let TypeScript catch errors at compile time, reducing runtime bugs.
   - Utilize Convex's generated types for end-to-end type safety.

6. **Build Incrementally**
   - Start with basic CRUD operations.
   - Add authentication and authorization checks.
   - Implement core features.
   - Optimize and add polish last.

### **Common Pitfalls to Avoid**

❌ **Don't**: Use `.collect()` on large datasets without proper filtering.
✅ **Do**: Use `.withIndex()` and server-side filtering; consider pagination for very large results.

❌ **Don't**: Forget to `await` Promises for asynchronous operations (database, API calls).
✅ **Do**: Ensure all async operations are properly awaited.

❌ **Don't**: Store large binary data directly in database documents.
✅ **Do**: Use Convex File Storage for files (images, videos) and store references (URLs or IDs) in the database.

❌ **Don't**: Skip authorization checks in functions.
✅ **Do**: Verify user identity and permissions in *every* function that accesses or modifies data.

❌ **Don't**: Perform client-side filtering for sensitive data.
✅ **Do**: Implement all data filtering and authorization logic on the server within Convex functions, using indexes for efficiency.

---

## 🚨 Critical Issues to Fix BEFORE Implementation

### **Issue 1: VideoRegenerationChat Infinite Loop**

**Problem**: The `VideoRegenerationChat.tsx` component has an infinite render loop that must be fixed before migrating to Convex.

**Location**: `components/video-generation/VideoRegenerationChat.tsx`

**Root Cause**: Likely a `useEffect` dependency issue or state update triggering unnecessary re-renders.

**Action Required**: 
1. Identify the infinite loop cause (check `useEffect` dependencies)
2. Fix the state management issue
3. Test thoroughly before Convex integration
4. Document the fix in code comments

**Why Fix First**: Convex's real-time subscriptions will amplify any existing infinite loop issues, making them worse and consuming unnecessary resources.

---

## 🔧 Error Handling Patterns

### **Standard Error Handling for Convex Functions**

\`\`\`typescript
// convex/projects.ts
export const create = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    try {
      // 1. Authentication check
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Unauthenticated: Please sign in to create a project");
      }

      // 2. Validation
      if (!args.name || args.name.trim().length === 0) {
        throw new Error("Validation error: Project name is required");
      }

      // 3. Authorization check (if needed)
      const orgId = identity.organizationId;
      if (orgId) {
        // Check org permissions if needed
      }

      // 4. Business logic
      const projectId = await ctx.db.insert('projects', {
        userId: identity.subject,
        organizationId: orgId,
        ...args,
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return { success: true, projectId };
      
    } catch (error) {
      // 5. Error logging
      console.error("[v0] Project creation failed:", error);
      
      // 6. Re-throw with context
      throw new Error(
        `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});
\`\`\`

### **Error Handling for Actions (External API Calls)**

\`\`\`typescript
// convex/actions/videoGeneration.ts
import axios from "axios"; // Assuming axios is installed for API calls

export const generateVideo = action({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        // Call external API
        const response = await axios.post(
          "https://api.fal.ai/v1/sync/generations/create", // Example URL
          {
            model: "fal-ai/kling-v1/standard/image-to-video",
            inputs: {
              image_url: args.startFrameUrl, // Placeholder
              duration: args.duration,
            },
          },
          {
            headers: {
              Authorization: `Key ${process.env.FAL_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status !== 200) { // Check status code for success
          const errorData = response.data?.detail || response.statusText;
          throw new Error(`fal.ai API error (${response.status}): ${errorData}`);
        }

        const data = response.data; // Axios response data
        // Assuming result is available upon sync creation or poll status
        // This part needs careful adjustment based on the actual API's async/sync behavior
        if (data.video_url) { // If video is available immediately
           return { success: true, data };
        } else if (data.id) { // If it's an async job, proceed to polling
           const jobId = data.id;
           // ... polling logic ... 
        } else {
          throw new Error("Unexpected API response format.");
        }

      } catch (error: any) { // Catch any type of error
        attempt++;
        console.error(`[v0] Video generation attempt ${attempt} failed:`, error.message || error);

        if (attempt >= MAX_RETRIES) {
          // Update video status to failed
          await ctx.runMutation(api.videos.updateVideoStatus, {
            videoId: args.videoId,
            status: "failed",
            error: error.message || "Unknown error",
          });

          throw new Error(
            `Video generation failed after ${MAX_RETRIES} attempts: ${error.message || 'Unknown error'}`
          );
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
    // Should not reach here if MAX_RETRIES is handled properly, but good practice
    throw new Error("Video generation failed unexpectedly."); 
  },
});
\`\`\`

---

## 📊 Rate Limiting & Cost Monitoring

### **Rate Limiting Strategy**

**For AI API Calls:**

\`\`\`typescript
// convex/rateLimit.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Track API calls per user/org
export const checkRateLimit = query({
  args: {
    service: v.string(), // "openai", "fal-ai", etc.
    limit: v.number(), // requests per minute
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const orgId = identity.organizationId || identity.subject; // Use orgId or userId as tenant ID
    const now = Date.now();
    const oneMinuteAgo = now - 60000; // Time window of 1 minute

    // Count recent API calls for the specific service and tenant
    const recentCalls = await ctx.db
      .query("usageTracking")
      .withIndex("by_organization_and_created_at", (q) =>
        q.eq("organizationId", orgId).gte("createdAt", oneMinuteAgo)
      )
      .filter((q) => q.eq(q.field("service"), args.service)) // Filter by service
      .collect();

    const isAllowed = recentCalls.length < args.limit;

    return {
      isAllowed,
      remaining: Math.max(0, args.limit - recentCalls.length),
      resetAt: now + 60000, // Approximate time when the limit resets
    };
  },
});

// Example usage within an action:
// convex/actions/someAction.ts
// import { api } from "@/convex/_generated/api";
// ...
// const rateLimitCheck = await ctx.runQuery(api.rateLimit.checkRateLimit, {
//   service: "openai", // Specify the service being called
//   limit: 60,        // Max requests per minute
// });
//
// if (!rateLimitCheck.isAllowed) {
//   throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000)} seconds.`);
// }
// ... proceed with API call ...
\`\`\`

### **Cost Monitoring Setup**

**Track costs in real-time:**

\`\`\`typescript
// convex/usageTracking.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const trackUsage = mutation({
  args: {
    projectId: v.optional(v.id('projects')),
    resourceType: v.union(
      v.literal('scene'),
      v.literal('image'),
      v.literal('video'),
      v.literal('audio'),
      v.literal('chat'),
      v.literal('prompt_generation') // Added for prompt generation tracking
    ),
    resourceId: v.optional(v.string()), // ID of the specific resource (e.g., sceneId, videoId)
    eventType: v.union(
      v.literal('generation'),
      v.literal('render'),
      v.literal('storage'),
      v.literal('api_call')
    ),
    service: v.string(), // "openai", "fal-ai", etc.
    model: v.string(), // Full path: "fal-ai/stable-audio-25/text-to-audio", "openai/gpt-4o"
    creditsUsed: v.number(),
    cost: v.optional(v.number()), // USD cost, if calculable
    metadata: v.object({
      inputTokens: v.optional(v.number()),
      outputTokens: v.optional(v.number()),
      duration: v.optional(v.number()),
      resolution: v.optional(v.string()),
      latency: v.optional(v.number()),
      success: v.boolean(),
      // Add any other relevant metadata specific to the resource/event
      apiJobId: v.optional(v.string()), // For external API job IDs
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const orgId = identity.organizationId || identity.subject; // Tenant identifier
    const userId = identity.subject;
    const billingPeriod = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    // Log usage details
    await ctx.db.insert("usageTracking", {
      organizationId: orgId,
      userId: userId,
      ...args,
      billingPeriod,
      createdAt: Date.now(),
    });

    // Update credit balance
    const balance = await ctx.db
      .query("creditBalances")
      .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
      .first();

    if (balance) {
      // Calculate remaining credits based on creditsUsed
      const newUsedCredits = balance.usedCredits + args.creditsUsed;
      await ctx.db.patch(balance._id, {
        usedCredits: newUsedCredits,
        remainingCredits: balance.totalCredits - newUsedCredits, // Recalculate remaining
        updatedAt: Date.now(),
      });
    }
  },
});

// Get cost summary for an organization within a billing period
export const getCostSummary = query({
  args: {
    billingPeriod: v.optional(v.string()), // "YYYY-MM"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const orgId = identity.organizationId || identity.subject;
    const period = args.billingPeriod || new Date().toISOString().slice(0, 7);

    // Query usage tracking records for the organization and billing period
    const usageRecords = await ctx.db
      .query("usageTracking")
      .withIndex("by_organization_and_billing_period", (q) =>
        q.eq("organizationId", orgId).eq("billingPeriod", period)
      )
      .collect();

    // Aggregate costs and credits
    const totalCost = usageRecords.reduce((sum, u) => sum + (u.cost || 0), 0);
    const totalCredits = usageRecords.reduce((sum, u) => sum + u.creditsUsed, 0);

    // Group costs by service
    const byService = usageRecords.reduce((acc, u) => {
      acc[u.service] = (acc[u.service] || 0) + (u.cost || 0);
      return acc;
    }, {} as Record<string, number>);

    return {
      period,
      totalCost: totalCost.toFixed(2), // Format to 2 decimal places
      totalCredits,
      byService,
      usageRecords, // Return individual records if needed
    };
  },
});
\`\`\`

**Alert on high costs:**

\`\`\`typescript
// convex/alerts.ts
export const checkCostThreshold = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return; // Only run if authenticated

    const orgId = identity.organizationId || identity.subject;
    const period = new Date().toISOString().slice(0, 7); // Current month "YYYY-MM"

    // Get the cost summary for the current period
    const summary = await ctx.runQuery(api.usageTracking.getCostSummary, {
      billingPeriod: period,
    });

    const THRESHOLD = 100; // Define a threshold, e.g., $100 per month

    if (summary && parseFloat(summary.totalCost) > THRESHOLD) {
      // Trigger an alert mechanism (e.g., send an email, log to an alert system)
      console.warn(`[v0] Cost threshold exceeded for organization ${orgId}: $${summary.totalCost}`);
      
      // Example: Send an email notification (requires an email service integration)
      // await ctx.runMutation(api.email.sendAlert, {
      //   to: "admin@example.com",
      //   subject: `Cost Alert: Organization ${orgId} exceeded threshold`,
      //   body: `Your organization's usage cost for ${summary.period} has reached $${summary.totalCost}, exceeding the $${THRESHOLD} threshold.`
      // });
    }
  },
});
\`\`\`

---

## 📚 Additional Resources

- [Convex + Clerk Integration (Official Docs)](https://docs.convex.dev/auth/clerk)
- [Clerk + Convex Integration Guide (Official)](https://clerk.com/docs/guides/development/integrations/databases/convex)
- [Convex Organizations Guide](https://docs.convex.dev/auth/clerk#organizations)
- [Convex File Storage Documentation](https://docs.convex.dev/file-storage)
- [Convex Actions (for External APIs)](https://docs.convex.dev/functions/actions)
- [Convex Best Practices for Production](https://docs.convex.dev/production/best-practices)
- [fal.ai API Documentation](https://fal.ai/models)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)

---

## 📊 Time Estimates Summary

| Phase | Tasks | Time Estimate |
|-------|-------|---------------|
| **Phase 1** | Setup & Configuration | 2-3 hours |
| **Phase 2** | Core Data Layer | 3-4 hours |
| **Phase 3** | File Storage Migration | 2-3 hours |
| **Phase 4** | AI Integration | 3-4 hours |
| **Phase 5** | Frontend Migration | 2-3 hours |
| **Phase 6** | Testing & Polish | 2-3 hours |
| **TOTAL** | **Complete Implementation** | **14-18 hours** |

### **Realistic Timeline for Solo Developer**

- **Part-time (10 hrs/week)**: 2-3 weeks
- **Full-time (40 hrs/week)**: 3-5 days
- **Intensive sprint**: 2-3 days

---

## 🎯 Success Criteria

### **MVP Complete When:**

✅ Users can sign in with Clerk (e.g., Google, Facebook).
✅ Users can create projects and scenes.
✅ Users can upload images/audio for scene frames/tracks.
✅ Users can generate videos using a real AI API (fal.ai).
✅ Users can chat with an AI assistant for scene refinement.
✅ Data persists across devices and sessions.
✅ Real-time updates are functional (e.g., open two browser tabs and see changes).
✅ File storage (images, audio, generated videos) works correctly.
✅ Basic cost monitoring and rate limiting are in place.
✅ A production deployment is stable and accessible.
✅ Basic error handling and loading states are implemented.

### **Production-Ready When:**

✅ All MVP criteria are met and function reliably.
✅ Comprehensive error handling is in place.
✅ Performance is optimized (e.g., queries use appropriate indexes).
✅ Security is audited and hardened (e.g., robust auth checks everywhere).
✅ Monitoring and alerts are configured for critical events (e.g., cost thresholds).
✅ A reliable backup strategy is confirmed.
✅ User testing has been completed and feedback incorporated.

---

## 🔧 Troubleshooting

### **Common Issues**

**Issue**: "Not authenticated" errors in Convex functions.
**Solution**:
1. Verify Clerk JWT issuer domain is correctly configured in `convex/auth.config.js` and environment variables.
2. Ensure `ConvexProviderWithClerk` wraps your application.
3. Check if the user is actually signed in via Clerk using `useConvexAuth()` or `Authenticated` component.

**Issue**: Queries return `undefined` or incorrect data.
**Solution**:
1. Double-check authorization logic in the query function: Does it correctly filter by `userId` or `organizationId`?
2. Ensure the necessary indexes exist on the queried table for the filter conditions. Use `npx convex schema` to check indexes.
3. Verify the data structure matches the schema. Check types carefully.
4. Confirm the data has been inserted correctly in the Convex Dashboard.

**Issue**: File uploads fail or metadata is not saved.
**Solution**:
1. Check file size limits imposed by Convex Storage or your application.
2. Verify that `generateUploadUrl` returns a valid URL and the `storageId` is correctly passed to `saveFileMetadata`.
3. Ensure the `Content-Type` header is correctly set during the fetch request for the upload.
4. Check console logs for specific error messages from Convex or your API calls.
5. Ensure `saveFileMetadata` is correctly saving the `storageId` to the `assets` table.

**Issue**: Real-time updates don't work.
**Solution**:
1. Confirm `ConvexProviderWithClerk` is correctly implemented and wraps your application.
2. Check the browser's network tab for WebSocket connections to Convex.
3. Ensure Convex authentication is successful (`useConvexAuth` returns `isAuthenticated: true`).
4. Verify that the data being queried is expected to update reactively (e.g., changes are made via mutations).
5. Ensure you are using Convex hooks (`useQuery`) in your components to subscribe to data changes.

**Issue**: Slow queries.
**Solution**:
1. Add indexes to tables for fields used in `withIndex()` clauses or `filter()` conditions. Run `npx convex schema` to generate schema file and apply.
2. Avoid using `.collect()` on large datasets; instead, filter data server-side within the query using indexes.
3. Ensure all queries filter by `organizationId` or `userId` to limit the scope.
4. Analyze query performance in the Convex Dashboard's "Functions" tab, which shows execution time and database operations.
5. Consider pagination for queries returning many results.

---

**Good luck with your implementation! 🚀**

Remember: Start small, test often, and iterate quickly. Convex makes it easy to build fast and scale later.
