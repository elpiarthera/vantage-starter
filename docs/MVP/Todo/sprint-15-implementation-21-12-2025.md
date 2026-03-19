# ☁️ MyShortReel - Sprint 15: Cloudflare R2 Migration

**Date**: December 21, 2025  
**Status**: 📋 PLANNING  
**Estimated Time**: 24 hours (comprehensive: videos, images, audio, AND user uploads)  
**Goal**: Migrate ALL media storage (videos, images, audio) from Convex to Cloudflare R2  
**Dependencies**: None (can run in parallel with other sprints)  
**Architecture**: Based on `architectural-improvements-sprint-21-12-2025.md` (Improvement #5)  
**Reference**: `docs/Guides/video-storage-convex-vs-cloudflare-r2.md`  
**QA Strategy**: **2-Step QA** - TypeScript (noEmit) → Biome for all files  

---

## 📊 Executive Summary

### Problem Statement

Video storage in Convex **exceeds free tier limits**:

| Resource | Current Usage | Free Tier Limit | Status |
|----------|---------------|-----------------|--------|
| File Bandwidth | **6.11 GB** | 1 GB | ❌ **611% over limit** |
| File Storage | 142.76 MB | 1 GB | ✅ OK (14%) |

**Cost at Scale**:

| Users | Convex (Pro) | Cloudflare R2 | Savings |
|-------|--------------|---------------|---------|
| 100 | $25/mo | $0/mo | 100% |
| 1,000 | $160/mo | $1.85/mo | 99% |
| 10,000 | $1,537/mo | $19.85/mo | 99% |

**R2 is 77x cheaper at 10,000 users** because egress (bandwidth) is **$0.00**.

### Solution

1. Set up Cloudflare R2 bucket and credentials
2. Install `@convex-dev/r2` component
3. Create R2 storage API in Convex
4. Update video generation actions to store in R2
5. Update frontend to use R2 URLs
6. Migrate existing files from Convex storage
7. Clean up legacy storage code

---

## ⏱️ TIME TRACKING

| Phase | Task | Description | Est. Hours | Actual | Status |
|-------|------|-------------|------------|--------|--------|
| **1** | | **Initial Setup** | **5h** | - | ⏳ |
| 1 | 1.1 | Create Cloudflare account & R2 bucket | 0.5h | - | ⏳ |
| 1 | 1.2 | Configure API tokens & permissions | 0.5h | - | ⏳ |
| 1 | 1.3 | Set up CORS policy | 0.5h | - | ⏳ |
| 1 | 1.4 | Install @convex-dev/r2 component | 0.5h | - | ⏳ |
| 1 | 1.5 | Set Convex environment variables | 0.5h | - | ⏳ |
| 1 | 1.6 | Create convex.config.ts | 0.5h | - | ⏳ |
| 1 | 1.7 | Create r2Storage.ts base functions | 2h | - | ⏳ |
| **2** | | **Integration** | **12h** | - | ⏳ |
| 2 | 2.1 | Update schema with R2 key fields (13 fields) | 1h | - | ⏳ |
| 2 | 2.2 | Update videoAssembly action (final video) | 1.5h | - | ⏳ |
| 2 | 2.3 | Update narration & music generation (audio) | 1.5h | - | ⏳ |
| 2 | 2.4 | Update scene video generation | 1h | - | ⏳ |
| 2 | 2.5 | **Update user upload flow (files.ts)** | 1.5h | - | ⏳ |
| 2 | 2.6 | Update image generation actions | 1h | - | ⏳ |
| 2 | 2.7 | Create URL retrieval queries (all types) | 1.5h | - | ⏳ |
| 2 | 2.8 | Update frontend components | 2h | - | ⏳ |
| 2 | 2.9 | End-to-end testing | 1h | - | ⏳ |
| **3** | | **Data Migration** | **5h** | - | ⏳ |
| 3 | 3.1 | Create migration script (all file types) | 2.5h | - | ⏳ |
| 3 | 3.2 | Run migration on dev | 1.5h | - | ⏳ |
| 3 | 3.3 | Verify all files accessible | 1h | - | ⏳ |
| **4** | | **Cleanup** | **2h** | - | ⏳ |
| 4 | 4.1 | Remove legacy storage code | 1h | - | ⏳ |
| 4 | 4.2 | Delete old Convex storage files | 0.5h | - | ⏳ |
| 4 | 4.3 | Final verification & documentation | 0.5h | - | ⏳ |
| | **TOTAL** | | **24h** | - | ⏳ |

### File Types Covered

| File Type | Actions to Update | Schema Fields | Priority |
|-----------|-------------------|---------------|----------|
| **Videos** | videoAssembly, videoGeneration | 4 R2 keys | 🔴 High |
| **Audio** | narrationGeneration, musicGeneration | 2 R2 keys | 🔴 High |
| **Images** | imageGeneration | 5 R2 keys | 🟡 Medium |
| **User Uploads** | files.ts (user photos/videos) | 2 R2 keys | 🔴 High |

---

## 🔍 PRE-SPRINT CHECKLIST (10 min)

Before starting Sprint 15:

- [ ] **Verify Cloudflare account exists** (or create one at cloudflare.com)

- [ ] **Check current Convex storage usage**:
  ```bash
  # View in Convex dashboard
  open https://dashboard.convex.dev
  ```

- [ ] **Verify Convex dev is running**:
  ```bash
  npx convex dev --once
  ```

- [ ] **Review current storage schema**:
  ```bash
  grep -r "StorageId\|_storage" convex/schema.ts
  ```

---

## 📋 Phase 1: Initial Setup (5 hours)

### Task 1.1: Create Cloudflare Account & R2 Bucket (0.5 hours)

#### Objective

Set up Cloudflare R2 bucket for video storage.

#### Steps

1. **Go to** [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Sign up** or log in
3. Navigate to **R2 Object Storage** in sidebar
4. Click **Create bucket**
5. Configure:
   - **Bucket name**: `myshortreel-assets` (or your preferred name)
   - **Location hint**: Choose closest to your users (e.g., `WEUR` for Western Europe)
6. Click **Create bucket**

#### QA Checklist

- [ ] Cloudflare account created
- [ ] R2 bucket created
- [ ] Bucket name noted for environment variables

---

### Task 1.2: Configure API Tokens & Permissions (0.5 hours)

#### Objective

Generate API credentials for R2 access.

#### Steps

1. In Cloudflare Dashboard, go to **R2 > Overview**
2. Click **Manage R2 API Tokens**
3. Click **Create API Token**
4. Configure:
   - **Token name**: `myshortreel-convex`
   - **Permissions**: 
     - Object Read: ✅
     - Object Write: ✅
   - **Bucket**: Select your bucket or "Apply to all buckets"
   - **TTL**: No expiration (or set appropriate duration)
5. Click **Create API Token**
6. **IMPORTANT**: Copy and save these values immediately:
   - Access Key ID
   - Secret Access Key
   - Endpoint URL (format: `https://<account-id>.r2.cloudflarestorage.com`)

#### QA Checklist

- [ ] API token created
- [ ] Access Key ID saved
- [ ] Secret Access Key saved (shown only once!)
- [ ] Endpoint URL noted

---

### Task 1.3: Set Up CORS Policy (0.5 hours)

#### Objective

Configure CORS to allow uploads from your domains.

#### Steps

1. In R2 bucket settings, go to **Settings** tab
2. Find **CORS Policy** section
3. Click **Edit CORS Policy**
4. Add the following JSON:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://*.vercel.app",
      "https://myshortreel.ai",
      "https://*.myshortreel.ai"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

5. Click **Save**

#### QA Checklist

- [ ] CORS policy saved
- [ ] Localhost origins included
- [ ] Production domains included

---

### Task 1.4: Install @convex-dev/r2 Component (0.5 hours)

#### Objective

Install the official Convex R2 component.

#### Implementation

```bash
# Install the R2 component
npm install @convex-dev/r2
```

#### QA Checklist

```bash
# Verify installation
grep "@convex-dev/r2" package.json
```

- [ ] Package installed
- [ ] No peer dependency warnings

---

### Task 1.5: Set Convex Environment Variables (0.5 hours)

#### Objective

Configure R2 credentials in Convex.

#### Implementation

```bash
# Set environment variables in Convex
npx convex env set R2_ACCESS_KEY_ID "<your-access-key-id>"
npx convex env set R2_SECRET_ACCESS_KEY "<your-secret-access-key>"
npx convex env set R2_ENDPOINT "https://<account-id>.r2.cloudflarestorage.com"
npx convex env set R2_BUCKET "myshortreel-videos"
```

#### For Local Development

Add to `.env.local`:

```bash
# R2 Configuration (for reference only - Convex uses its own env vars)
R2_ACCESS_KEY_ID=<your-access-key-id>
R2_SECRET_ACCESS_KEY=<your-secret-access-key>
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET=myshortreel-videos
```

#### QA Checklist

```bash
# Verify env vars set
npx convex env list
```

- [ ] R2_ACCESS_KEY_ID set
- [ ] R2_SECRET_ACCESS_KEY set
- [ ] R2_ENDPOINT set
- [ ] R2_BUCKET set

---

### Task 1.6: Create convex.config.ts (0.5 hours)

#### Objective

Configure Convex to use the R2 component.

#### Implementation

**File**: `convex/convex.config.ts` (create or modify)

```typescript
import { defineApp } from "convex/server";
import r2 from "@convex-dev/r2/convex.config.js";

const app = defineApp();

// Add R2 component
app.use(r2);

export default app;
```

#### QA Checklist

```bash
# TypeScript check
npx tsc --noEmit convex/convex.config.ts

# Deploy to verify component loads
npx convex dev --once
```

- [ ] Config file created
- [ ] Convex deployment successful

---

### Task 1.7: Create r2Storage.ts Base Functions (2 hours)

#### Objective

Create the R2 storage API with all necessary functions.

#### Implementation

**File**: `convex/r2Storage.ts` (create)

```typescript
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { mutation, query, internalAction } from "./_generated/server";
import { v } from "convex/values";

// Initialize R2 client
export const r2 = new R2(components.r2);

/**
 * Client API for direct uploads from browser
 * Usage: const uploadFile = useUploadFile(api.r2Storage);
 */
export const { generateUploadUrl, syncMetadata } = r2.clientApi({
  checkUpload: async (ctx, bucket) => {
    // Validate user has permission to upload
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Must be logged in to upload files");
    }
    // Optional: Add rate limiting, file size checks, etc.
  },
  onUpload: async (ctx, bucket, key) => {
    // Log upload for monitoring
    console.log(`[R2] File uploaded: ${key} by user`);
  },
});

/**
 * Get a signed URL for a file (valid for 24 hours)
 */
export const getUrl = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    if (!args.key) return null;
    
    try {
      return await r2.getUrl(args.key, {
        expiresIn: 60 * 60 * 24, // 24 hours
      });
    } catch (error) {
      console.error(`[R2] Error getting URL for ${args.key}:`, error);
      return null;
    }
  },
});

/**
 * Get multiple signed URLs at once
 */
export const getUrls = query({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, args) => {
    const urls: Record<string, string | null> = {};
    
    for (const key of args.keys) {
      if (!key) {
        urls[key] = null;
        continue;
      }
      
      try {
        urls[key] = await r2.getUrl(key, {
          expiresIn: 60 * 60 * 24,
        });
      } catch (error) {
        console.error(`[R2] Error getting URL for ${key}:`, error);
        urls[key] = null;
      }
    }
    
    return urls;
  },
});

/**
 * Delete a file from R2
 */
export const deleteFile = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    if (!args.key) return { success: false, error: "No key provided" };
    
    try {
      await r2.deleteObject(ctx, args.key);
      console.log(`[R2] File deleted: ${args.key}`);
      return { success: true };
    } catch (error) {
      console.error(`[R2] Error deleting ${args.key}:`, error);
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Store a file from a URL (used by server-side actions)
 * Returns the R2 key
 */
export const storeFromUrl = internalAction({
  args: {
    url: v.string(),
    key: v.string(),
    contentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log(`[R2] Storing from URL: ${args.url.substring(0, 50)}...`);
    
    try {
      // Fetch the file
      const response = await fetch(args.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Store in R2
      const key = await r2.store(ctx, blob, {
        key: args.key,
        type: args.contentType || blob.type || "application/octet-stream",
      });
      
      console.log(`[R2] Stored: ${key} (${blob.size} bytes)`);
      return { success: true, key };
    } catch (error) {
      console.error(`[R2] Error storing from URL:`, error);
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Store video file from generation service
 */
export const storeVideo = internalAction({
  args: {
    videoUrl: v.string(),
    projectId: v.id("projects"),
    sceneId: v.optional(v.id("scenes")),
    type: v.union(v.literal("scene"), v.literal("final")),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const prefix = args.type === "final" ? "final" : "scenes";
    const key = `projects/${args.projectId}/${prefix}/${args.sceneId || timestamp}.mp4`;
    
    return await ctx.runAction(internal.r2Storage.storeFromUrl, {
      url: args.videoUrl,
      key,
      contentType: "video/mp4",
    });
  },
});

/**
 * Store image file from generation service
 */
export const storeImage = internalAction({
  args: {
    imageUrl: v.string(),
    projectId: v.id("projects"),
    sceneId: v.optional(v.id("scenes")),
    type: v.union(v.literal("scene"), v.literal("thumbnail"), v.literal("asset")),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const key = `projects/${args.projectId}/images/${args.type}_${args.sceneId || timestamp}.jpg`;
    
    return await ctx.runAction(internal.r2Storage.storeFromUrl, {
      url: args.imageUrl,
      key,
      contentType: "image/jpeg",
    });
  },
});

/**
 * Store audio file (narration, music)
 */
export const storeAudio = internalAction({
  args: {
    audioUrl: v.string(),
    projectId: v.id("projects"),
    type: v.union(v.literal("narration"), v.literal("music")),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const key = `projects/${args.projectId}/audio/${args.type}_${timestamp}.mp3`;
    
    return await ctx.runAction(internal.r2Storage.storeFromUrl, {
      url: args.audioUrl,
      key,
      contentType: "audio/mpeg",
    });
  },
});

// Import internal reference
import { internal } from "./_generated/api";
```

#### QA Checklist

```bash
# TypeScript check
npx tsc --noEmit convex/r2Storage.ts

# Biome check
npx @biomejs/biome check --write convex/r2Storage.ts

# Deploy
npx convex dev --once
```

- [ ] File compiles without errors
- [ ] Functions deployed to Convex
- [ ] Test `getUrl` in Convex dashboard

---

## 📋 Phase 2: Integration (7 hours)

### Task 2.1: Update Schema with R2 Key Fields (0.5 hours)

#### Objective

Add R2 key fields alongside existing storage ID fields.

#### Implementation

**File**: `convex/schema.ts` (modify)

### Complete R2 Key Fields to Add

```typescript
// ═══════════════════════════════════════════════════════════════
// PROJECTS TABLE - Add R2 keys for all stored media
// ═══════════════════════════════════════════════════════════════
// Final assembled video
finalVideoR2Key: v.optional(v.string()),

// Audio files (narration & music)
narrationR2Key: v.optional(v.string()),      // Generated narration audio
musicR2Key: v.optional(v.string()),          // Generated background music

// ═══════════════════════════════════════════════════════════════
// SCENES TABLE - Add R2 keys for scene media
// ═══════════════════════════════════════════════════════════════
// Scene images
imageR2Key: v.optional(v.string()),          // Generated scene image
startFrameR2Key: v.optional(v.string()),     // Start frame for video gen
endFrameR2Key: v.optional(v.string()),       // End frame (if used)

// Scene videos
videoR2Key: v.optional(v.string()),          // Generated scene video
thumbnailR2Key: v.optional(v.string()),      // Video thumbnail

// ═══════════════════════════════════════════════════════════════
// VIDEOS TABLE - Add R2 keys for final videos
// ═══════════════════════════════════════════════════════════════
fileR2Key: v.optional(v.string()),           // Final video file
thumbnailR2Key: v.optional(v.string()),      // Video thumbnail

// ═══════════════════════════════════════════════════════════════
// AUDIO TRACKS TABLE - Add R2 keys for audio
// ═══════════════════════════════════════════════════════════════
fileR2Key: v.optional(v.string()),           // Audio file

// ═══════════════════════════════════════════════════════════════
// ASSETS TABLE - Add R2 keys for user uploads AND AI-generated files
// ═══════════════════════════════════════════════════════════════
r2Key: v.optional(v.string()),               // R2 storage key
storageId: v.optional(v.string()),           // Keep Convex storage ID for migration tracking
```

**Note**: The `assets` table is used for:
- **User uploads**: Photos/videos users upload from their devices
- **AI-generated images**: Scene frames created by Fal.ai

Both need R2 migration!

### Summary of R2 Keys

| Table | R2 Key Field | Original URL Field | Description |
|-------|--------------|-------------------|-------------|
| projects | `finalVideoR2Key` | `finalVideoUrl` | Final assembled video |
| projects | `narrationR2Key` | `narrationAudioUrl` | Generated narration |
| projects | `musicR2Key` | `musicAudioUrl` | Generated music |
| scenes | `imageR2Key` | (in generation) | Scene image |
| scenes | `startFrameR2Key` | `startFrameUrl` | Video generation start frame |
| scenes | `endFrameR2Key` | `endFrameUrl` | Video generation end frame |
| scenes | `videoR2Key` | `videoUrl` | Generated scene video |
| scenes | `thumbnailR2Key` | - | Scene video thumbnail |
| videos | `fileR2Key` | `fileStorageId` | Final video file |
| videos | `thumbnailR2Key` | `thumbnailStorageId` | Video thumbnail |
| audioTracks | `fileR2Key` | - | Audio track file |

**Total R2 Key Fields**: 11

#### QA Checklist

```bash
# Deploy schema
npx convex dev --once
```

- [ ] Schema updated
- [ ] No breaking changes
- [ ] Tables updated in dashboard

---

### Task 2.2: Update videoAssembly Action (2 hours)

#### Objective

Update the video assembly action to store final video, narration audio, and music audio in R2.

#### Implementation

**File**: `convex/actions/videoAssembly.ts` (modify)

Add R2 storage after video generation:

```typescript
// At the top, add import
import { internal } from "../_generated/api";

// After merging video and audio, store to R2
const finalVideoUrl = mergedResult.videoUrl;

// Store in R2
const r2Result = await ctx.runAction(internal.r2Storage.storeFromUrl, {
  url: finalVideoUrl,
  key: `projects/${args.projectId}/final/video_${Date.now()}.mp4`,
  contentType: "video/mp4",
});

if (!r2Result.success) {
  console.error("[VideoAssembly] Failed to store in R2:", r2Result.error);
  // Fallback to original URL
}

// Update project with R2 key
await ctx.runMutation(internal.projects.updateR2Keys, {
  projectId: args.projectId,
  finalVideoR2Key: r2Result.success ? r2Result.key : undefined,
  finalVideoUrl: finalVideoUrl, // Keep original URL as backup
});
```

#### Create Helper Mutation

**File**: `convex/projects.ts` (modify)

```typescript
/**
 * Update project with R2 keys
 */
export const updateR2Keys = internalMutation({
  args: {
    projectId: v.id("projects"),
    finalVideoR2Key: v.optional(v.string()),
    finalVideoUrl: v.optional(v.string()),
    narrationR2Key: v.optional(v.string()),
    musicR2Key: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { projectId, ...updates } = args;
    
    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(projectId, {
        ...cleanUpdates,
        updatedAt: Date.now(),
      });
    }
  },
});
```

#### QA Checklist

```bash
# TypeScript check
npx tsc --noEmit convex/actions/videoAssembly.ts
npx tsc --noEmit convex/projects.ts

# Biome check
npx @biomejs/biome check --write convex/actions/videoAssembly.ts
npx @biomejs/biome check --write convex/projects.ts

# Deploy
npx convex dev --once
```

- [ ] Video assembly stores to R2
- [ ] R2 key saved to project
- [ ] Fallback URL preserved

---

### Task 2.3: Update Narration & Music Generation Actions (1.5 hours)

#### Objective

Update audio generation actions to store narration and music in R2.

#### Implementation

**File**: `convex/actions/narrationGeneration.ts` (modify)

```typescript
// After generating narration audio
const narrationUrl = generatedAudioResult.url;

// Store in R2
const r2Result = await ctx.runAction(internal.r2Storage.storeAudio, {
  audioUrl: narrationUrl,
  projectId: args.projectId,
  type: "narration",
});

// Update project with R2 key
if (r2Result.success) {
  await ctx.runMutation(internal.projects.updateR2Keys, {
    projectId: args.projectId,
    narrationR2Key: r2Result.key,
    narrationAudioUrl: narrationUrl, // Keep original as backup
  });
}
```

**File**: `convex/actions/musicGeneration.ts` (if exists, modify)

```typescript
// After generating music audio
const musicUrl = generatedMusicResult.url;

// Store in R2
const r2Result = await ctx.runAction(internal.r2Storage.storeAudio, {
  audioUrl: musicUrl,
  projectId: args.projectId,
  type: "music",
});

// Update project with R2 key
if (r2Result.success) {
  await ctx.runMutation(internal.projects.updateR2Keys, {
    projectId: args.projectId,
    musicR2Key: r2Result.key,
    musicAudioUrl: musicUrl, // Keep original as backup
  });
}
```

#### QA Checklist

- [ ] Narration audio stored in R2
- [ ] Music audio stored in R2
- [ ] R2 keys saved to project
- [ ] Audio playback works

---

### Task 2.4: Update Scene Video Generation Actions (1 hour)

#### Objective

Update scene video generation to store scene videos in R2.

#### Implementation

**File**: `convex/actions/videoGeneration.ts` (modify)

```typescript
// After generating scene video
const sceneVideoUrl = generatedVideoResult.url;

// Store in R2
const r2Result = await ctx.runAction(internal.r2Storage.storeVideo, {
  videoUrl: sceneVideoUrl,
  projectId: args.projectId,
  sceneId: args.sceneId,
  type: "scene",
});

// Update scene with R2 key
if (r2Result.success) {
  await ctx.runMutation(internal.scenes.updateR2Key, {
    sceneId: args.sceneId,
    videoR2Key: r2Result.key,
  });
}
```

#### QA Checklist

- [ ] Scene videos stored in R2
- [ ] Scene updated with R2 key
- [ ] Scene video playback works

---

### Task 2.5: Update User Upload Flow (1.5 hours)

#### Objective

Update user file uploads to store in R2 instead of Convex storage.

#### Current Flow

```
User selects file → convex/files.ts → ctx.storage.store() → Convex Storage → URL in assets table
```

#### New Flow

```
User selects file → convex/r2Storage.ts → R2 → URL in assets table
```

#### Implementation

**File**: `convex/files.ts` (modify to use R2)

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { r2 } from "./r2Storage";
import { internal } from "./_generated/api";

/**
 * Generate upload URL for client-side file upload to R2
 */
export const generateUploadUrl = mutation({
  args: {
    filename: v.string(),
    contentType: v.string(),
    assetType: v.union(v.literal("image"), v.literal("video"), v.literal("audio")),
    projectId: v.optional(v.id("projects")),
    sceneId: v.optional(v.id("scenes")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Generate R2 key
    const timestamp = Date.now();
    const safeFilename = args.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = args.projectId
      ? `users/${identity.subject}/projects/${args.projectId}/${args.assetType}s/${timestamp}_${safeFilename}`
      : `users/${identity.subject}/${args.assetType}s/${timestamp}_${safeFilename}`;

    // Generate presigned upload URL
    const uploadUrl = await r2.generateUploadUrl(ctx, key, {
      contentType: args.contentType,
      expiresIn: 60 * 60, // 1 hour
    });

    return { uploadUrl, key };
  },
});

/**
 * Save file metadata after successful R2 upload
 */
export const saveFileMetadata = mutation({
  args: {
    r2Key: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    assetType: v.union(v.literal("image"), v.literal("video"), v.literal("audio")),
    projectId: v.optional(v.id("projects")),
    sceneId: v.optional(v.id("scenes")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get R2 URL
    const url = await r2.getUrl(args.r2Key, { expiresIn: 60 * 60 * 24 * 7 }); // 7 days
    if (!url) {
      throw new Error("Failed to get file URL from R2");
    }

    // Save asset metadata
    const assetId = await ctx.db.insert("assets", {
      userId: identity.subject,
      projectId: args.projectId as string | undefined,
      sceneId: args.sceneId as string | undefined,
      type: args.assetType,
      url, // R2 URL
      r2Key: args.r2Key, // Store R2 key for future URL regeneration
      filename: args.fileName,
      size: args.fileSize,
      uploadedAt: Date.now(),
    });

    return { assetId, url };
  },
});
```

**File**: Frontend upload component (update)

```typescript
// Old way (Convex storage)
// const uploadUrl = await generateUploadUrl();
// await fetch(uploadUrl, { method: "POST", body: file });
// await saveFileMetadata({ storageId, ... });

// New way (R2)
const { uploadUrl, key } = await generateUploadUrl({
  filename: file.name,
  contentType: file.type,
  assetType: "image",
  projectId,
});

await fetch(uploadUrl, { 
  method: "PUT", 
  body: file,
  headers: { "Content-Type": file.type },
});

await saveFileMetadata({ r2Key: key, ... });
```

#### QA Checklist

- [ ] User can upload images
- [ ] User can upload videos  
- [ ] User can upload audio
- [ ] Files stored in R2 (check R2 dashboard)
- [ ] Asset metadata saved with r2Key
- [ ] Files accessible via R2 URL

---

### Task 2.6: Update Image Generation Actions (1 hour)

#### Objective

Update scene image generation to store in R2.

#### Implementation

**File**: `convex/actions/imageGeneration.ts` (modify)

```typescript
// After generating image, store to R2
const r2Result = await ctx.runAction(internal.r2Storage.storeImage, {
  imageUrl: generatedImageUrl,
  projectId: args.projectId,
  sceneId: args.sceneId,
  type: "scene",
});

// Update scene with R2 key
if (r2Result.success) {
  await ctx.runMutation(internal.scenes.updateR2Key, {
    sceneId: args.sceneId,
    imageR2Key: r2Result.key,
  });
}
```

**File**: `convex/scenes.ts` (modify)

```typescript
/**
 * Update scene with R2 key
 */
export const updateR2Key = internalMutation({
  args: {
    sceneId: v.id("scenes"),
    imageR2Key: v.optional(v.string()),
    videoR2Key: v.optional(v.string()),
    thumbnailR2Key: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sceneId, ...updates } = args;
    
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(sceneId, {
        ...cleanUpdates,
        updatedAt: Date.now(),
      });
    }
  },
});
```

#### QA Checklist

- [ ] Image generation stores to R2
- [ ] Scene updated with R2 key
- [ ] Fallback to original URL works

---

### Task 2.4: Create URL Retrieval Queries (1 hour)

#### Objective

Create queries to get R2 URLs for videos and images.

#### Implementation

**File**: `convex/projects.ts` (modify)

```typescript
/**
 * Get project with resolved R2 URLs
 */
export const getWithUrls = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    
    // Get R2 URL if available
    let finalVideoUrl = project.finalVideoUrl;
    if (project.finalVideoR2Key) {
      const r2Url = await r2.getUrl(project.finalVideoR2Key, {
        expiresIn: 60 * 60 * 24,
      });
      if (r2Url) finalVideoUrl = r2Url;
    }
    
    return {
      ...project,
      finalVideoUrl,
    };
  },
});
```

**File**: `convex/scenes.ts` (modify)

```typescript
import { r2 } from "./r2Storage";

/**
 * Get scene with resolved R2 URLs
 */
export const getWithUrls = query({
  args: { sceneId: v.id("scenes") },
  handler: async (ctx, args) => {
    const scene = await ctx.db.get(args.sceneId);
    if (!scene) return null;
    
    // Resolve R2 URLs
    let imageUrl = scene.imageUrl;
    let videoUrl = scene.videoUrl;
    
    if (scene.imageR2Key) {
      const r2Url = await r2.getUrl(scene.imageR2Key, { expiresIn: 60 * 60 * 24 });
      if (r2Url) imageUrl = r2Url;
    }
    
    if (scene.videoR2Key) {
      const r2Url = await r2.getUrl(scene.videoR2Key, { expiresIn: 60 * 60 * 24 });
      if (r2Url) videoUrl = r2Url;
    }
    
    return {
      ...scene,
      imageUrl,
      videoUrl,
    };
  },
});
```

#### QA Checklist

- [ ] URL queries return R2 URLs when available
- [ ] Fallback to original URLs works
- [ ] URLs are signed and valid

---

### Task 2.5: Update Frontend Video Components (1.5 hours)

#### Objective

Update frontend components to use the new URL queries.

#### Implementation

**File**: `app/[locale]/guided/step-6/page.tsx` (modify)

```typescript
// Use the new query that resolves R2 URLs
const project = useQuery(api.projects.getWithUrls, {
  projectId: projectId ? (projectId as Id<"projects">) : skipToken,
});

// Video player already uses project.finalVideoUrl - no change needed
// The query now returns the R2 URL instead of Convex storage URL
```

**File**: Components using scene images/videos

```typescript
// Use scene.getWithUrls instead of direct scene query
const scene = useQuery(api.scenes.getWithUrls, {
  sceneId: sceneId ? (sceneId as Id<"scenes">) : skipToken,
});
```

#### QA Checklist

- [ ] Video playback works with R2 URLs
- [ ] Images display correctly
- [ ] No console errors

---

### Task 2.6: End-to-End Testing (0.5 hours)

#### Objective

Test the complete flow from generation to playback.

#### Test Cases

1. **Create new project** → Generate scenes → Images stored in R2
2. **Generate narration** → Audio stored in R2 (if implemented)
3. **Assemble video** → Final video stored in R2
4. **View video** → Playback from R2 URL
5. **Refresh page** → Video still accessible

#### QA Checklist

- [ ] New uploads go to R2
- [ ] Existing files still accessible
- [ ] Video playback smooth
- [ ] No CORS errors

---

## 📋 Phase 3: Data Migration (4 hours)

### Task 3.1: Create Migration Script (2.5 hours)

#### Objective

Create scripts to migrate ALL existing files from Convex storage to R2 (videos, images, and audio).

#### Implementation

**File**: `convex/migrations/migrateToR2.ts` (create)

```typescript
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

// ═══════════════════════════════════════════════════════════════
// MIGRATE FINAL VIDEOS (projects.finalVideoStorageId)
// ═══════════════════════════════════════════════════════════════

export const migrateProjectVideos = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("[Migration] Starting project VIDEOS migration...");
    
    const projects = await ctx.runQuery(internal.migrations.getProjectsWithVideos);
    let migrated = 0, failed = 0;
    
    for (const project of projects) {
      try {
        if (project.finalVideoStorageId && !project.finalVideoR2Key) {
          const storageUrl = await ctx.storage.getUrl(project.finalVideoStorageId);
          
          if (storageUrl) {
            const result = await ctx.runAction(internal.r2Storage.storeFromUrl, {
              url: storageUrl,
              key: `projects/${project._id}/final/video_migrated.mp4`,
              contentType: "video/mp4",
            });
            
            if (result.success) {
              await ctx.runMutation(internal.migrations.updateProjectR2Key, {
                projectId: project._id,
                field: "finalVideoR2Key",
                value: result.key,
              });
              migrated++;
              console.log(`[Migration] Video: ${project._id}`);
            } else { failed++; }
          }
        }
      } catch (error) {
        failed++;
        console.error(`[Migration] Error: ${project._id}`, error);
      }
    }
    
    console.log(`[Migration] Videos complete. Migrated: ${migrated}, Failed: ${failed}`);
    return { type: "videos", migrated, failed };
  },
});

// ═══════════════════════════════════════════════════════════════
// MIGRATE NARRATION AUDIO (projects.narrationAudioUrl)
// ═══════════════════════════════════════════════════════════════

export const migrateProjectAudio = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("[Migration] Starting project AUDIO migration...");
    
    const projects = await ctx.runQuery(internal.migrations.getProjectsWithAudio);
    let migratedNarration = 0, migratedMusic = 0, failed = 0;
    
    for (const project of projects) {
      try {
        // Migrate narration
        if (project.narrationAudioUrl && !project.narrationR2Key) {
          const result = await ctx.runAction(internal.r2Storage.storeFromUrl, {
            url: project.narrationAudioUrl,
            key: `projects/${project._id}/audio/narration_migrated.mp3`,
            contentType: "audio/mpeg",
          });
          
          if (result.success) {
            await ctx.runMutation(internal.migrations.updateProjectR2Key, {
              projectId: project._id,
              field: "narrationR2Key",
              value: result.key,
            });
            migratedNarration++;
          } else { failed++; }
        }
        
        // Migrate music
        if (project.musicAudioUrl && !project.musicR2Key) {
          const result = await ctx.runAction(internal.r2Storage.storeFromUrl, {
            url: project.musicAudioUrl,
            key: `projects/${project._id}/audio/music_migrated.mp3`,
            contentType: "audio/mpeg",
          });
          
          if (result.success) {
            await ctx.runMutation(internal.migrations.updateProjectR2Key, {
              projectId: project._id,
              field: "musicR2Key",
              value: result.key,
            });
            migratedMusic++;
          } else { failed++; }
        }
      } catch (error) {
        failed++;
        console.error(`[Migration] Error: ${project._id}`, error);
      }
    }
    
    console.log(`[Migration] Audio complete. Narration: ${migratedNarration}, Music: ${migratedMusic}, Failed: ${failed}`);
    return { type: "audio", migratedNarration, migratedMusic, failed };
  },
});

// ═══════════════════════════════════════════════════════════════
// MIGRATE SCENE VIDEOS & IMAGES
// ═══════════════════════════════════════════════════════════════

export const migrateSceneMedia = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("[Migration] Starting SCENES migration...");
    
    const scenes = await ctx.runQuery(internal.migrations.getScenesWithMedia);
    let migratedVideos = 0, migratedImages = 0, failed = 0;
    
    for (const scene of scenes) {
      try {
        // Migrate scene video
        if (scene.videoUrl && !scene.videoR2Key) {
          const result = await ctx.runAction(internal.r2Storage.storeFromUrl, {
            url: scene.videoUrl,
            key: `projects/${scene.projectId}/scenes/${scene._id}/video.mp4`,
            contentType: "video/mp4",
          });
          
          if (result.success) {
            await ctx.runMutation(internal.migrations.updateSceneR2Key, {
              sceneId: scene._id,
              field: "videoR2Key",
              value: result.key,
            });
            migratedVideos++;
          } else { failed++; }
        }
        
        // Migrate scene image (from generation.startFrameUrl)
        const startFrameUrl = scene.generation?.startFrameUrl;
        if (startFrameUrl && !scene.imageR2Key) {
          const result = await ctx.runAction(internal.r2Storage.storeFromUrl, {
            url: startFrameUrl,
            key: `projects/${scene.projectId}/scenes/${scene._id}/image.jpg`,
            contentType: "image/jpeg",
          });
          
          if (result.success) {
            await ctx.runMutation(internal.migrations.updateSceneR2Key, {
              sceneId: scene._id,
              field: "imageR2Key",
              value: result.key,
            });
            migratedImages++;
          } else { failed++; }
        }
      } catch (error) {
        failed++;
        console.error(`[Migration] Scene error: ${scene._id}`, error);
      }
    }
    
    console.log(`[Migration] Scenes complete. Videos: ${migratedVideos}, Images: ${migratedImages}, Failed: ${failed}`);
    return { type: "scenes", migratedVideos, migratedImages, failed };
  },
});

// ═══════════════════════════════════════════════════════════════
// MIGRATE USER-UPLOADED ASSETS
// ═══════════════════════════════════════════════════════════════

export const migrateAssets = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("[Migration] Starting ASSETS migration (user uploads)...");
    
    const assets = await ctx.runQuery(internal.migrations.getAssetsToMigrate);
    let migrated = 0, failed = 0;
    
    for (const asset of assets) {
      try {
        // Asset URL is from Convex storage - migrate to R2
        if (asset.url && !asset.r2Key) {
          // Determine content type and extension
          const contentType = asset.type === "image" ? "image/jpeg" 
            : asset.type === "video" ? "video/mp4" 
            : "audio/mpeg";
          const ext = asset.type === "image" ? ".jpg" 
            : asset.type === "video" ? ".mp4" 
            : ".mp3";
          
          const result = await ctx.runAction(internal.r2Storage.storeFromUrl, {
            url: asset.url,
            key: `users/${asset.userId}/assets/${asset._id}${ext}`,
            contentType,
          });
          
          if (result.success) {
            await ctx.runMutation(internal.migrations.updateAssetR2Key, {
              assetId: asset._id,
              r2Key: result.key,
            });
            migrated++;
          } else { failed++; }
        }
      } catch (error) {
        failed++;
        console.error(`[Migration] Asset error: ${asset._id}`, error);
      }
    }
    
    console.log(`[Migration] Assets complete. Migrated: ${migrated}, Failed: ${failed}`);
    return { type: "assets", migrated, failed };
  },
});

// ═══════════════════════════════════════════════════════════════
// MIGRATION ALL (orchestrator)
// ═══════════════════════════════════════════════════════════════

export const migrateAll = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("[Migration] === STARTING FULL MIGRATION ===");
    
    const videoResult = await ctx.runAction(internal.migrations.migrateProjectVideos);
    const audioResult = await ctx.runAction(internal.migrations.migrateProjectAudio);
    const sceneResult = await ctx.runAction(internal.migrations.migrateSceneMedia);
    const assetResult = await ctx.runAction(internal.migrations.migrateAssets);
    
    console.log("[Migration] === FULL MIGRATION COMPLETE ===");
    console.log(`Final Videos: ${videoResult.migrated} migrated`);
    console.log(`Narration: ${audioResult.migratedNarration}, Music: ${audioResult.migratedMusic}`);
    console.log(`Scene Videos: ${sceneResult.migratedVideos}, Scene Images: ${sceneResult.migratedImages}`);
    console.log(`User Assets: ${assetResult.migrated} migrated`);
    
    return { videoResult, audioResult, sceneResult, assetResult };
  },
});

// ═══════════════════════════════════════════════════════════════
// HELPER QUERIES & MUTATIONS
// ═══════════════════════════════════════════════════════════════

export const getProjectsWithVideos = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("projects")
      .filter((q) => q.neq(q.field("finalVideoStorageId"), undefined))
      .collect();
  },
});

export const getProjectsWithAudio = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("projects")
      .filter((q) => 
        q.or(
          q.neq(q.field("narrationAudioUrl"), undefined),
          q.neq(q.field("musicAudioUrl"), undefined)
        )
      )
      .collect();
  },
});

export const getScenesWithMedia = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("scenes")
      .filter((q) => 
        q.or(
          q.neq(q.field("videoUrl"), undefined),
          q.neq(q.field("generation"), undefined)
        )
      )
      .collect();
  },
});

export const getAssetsToMigrate = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("assets")
      .filter((q) => 
        q.and(
          q.neq(q.field("url"), undefined),
          q.eq(q.field("r2Key"), undefined)
        )
      )
      .collect();
  },
});

export const updateProjectR2Key = internalMutation({
  args: {
    projectId: v.id("projects"),
    field: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      [args.field]: args.value,
      updatedAt: Date.now(),
    });
  },
});

export const updateSceneR2Key = internalMutation({
  args: {
    sceneId: v.id("scenes"),
    field: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sceneId, {
      [args.field]: args.value,
      updatedAt: Date.now(),
    });
  },
});

export const updateAssetR2Key = internalMutation({
  args: {
    assetId: v.id("assets"),
    r2Key: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.assetId, {
      r2Key: args.r2Key,
    });
  },
});
```

### Run Migration

```bash
# Deploy migration functions
npx convex dev --once

# Run full migration (all file types)
npx convex run migrations/migrateToR2:migrateAll

# Or run individually:
npx convex run migrations/migrateToR2:migrateProjectVideos
npx convex run migrations/migrateToR2:migrateProjectAudio
npx convex run migrations/migrateToR2:migrateSceneMedia
```

#### QA Checklist

- [ ] Migration script compiles
- [ ] Query finds projects to migrate

---

### Task 3.2: Run Migration on Dev (1 hour)

#### Objective

Execute migration on development environment.

#### Execution

```bash
# Deploy migration functions
npx convex dev --once

# Run migration
npx convex run migrations/migrateToR2:migrateProjects
```

#### Monitor Progress

- Watch Convex logs in terminal
- Check R2 dashboard for new files

#### QA Checklist

- [ ] Migration completes without errors
- [ ] Files visible in R2 dashboard
- [ ] Database updated with R2 keys

---

### Task 3.3: Verify All Files Accessible (1 hour)

#### Objective

Verify all migrated files are accessible.

#### Verification Steps

1. **In Convex Dashboard**: Query projects with R2 keys
2. **In R2 Dashboard**: Verify file count matches
3. **In App**: Open several projects and verify video playback
4. **Check URLs**: Ensure signed URLs work

#### Verification Script

**File**: `convex/migrations/verifyMigration.ts` (create)

```typescript
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { r2 } from "../r2Storage";

export const verify = internalAction({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.runQuery(internal.migrations.getMigratedProjects);
    
    let verified = 0;
    let failed = 0;
    
    for (const project of projects) {
      if (project.finalVideoR2Key) {
        try {
          const url = await r2.getUrl(project.finalVideoR2Key, { expiresIn: 60 });
          if (url) {
            verified++;
          } else {
            failed++;
            console.error(`[Verify] No URL for: ${project._id}`);
          }
        } catch (error) {
          failed++;
          console.error(`[Verify] Error: ${project._id}`, error);
        }
      }
    }
    
    console.log(`[Verify] Complete. Verified: ${verified}, Failed: ${failed}`);
    return { verified, failed };
  },
});

export const getMigratedProjects = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("projects")
      .filter((q) => q.neq(q.field("finalVideoR2Key"), undefined))
      .collect();
  },
});

import { internalQuery } from "../_generated/server";
```

#### QA Checklist

- [ ] All migrated files accessible
- [ ] Video playback works
- [ ] No 404 or access errors

---

## 📋 Phase 4: Cleanup (2 hours)

### Task 4.1: Remove Legacy Storage Code (1 hour)

#### Objective

Remove code that directly uses Convex storage for videos.

#### Files to Clean Up

1. **Remove direct storage uploads** - Use R2 instead
2. **Update queries** - Remove `ctx.storage.getUrl()` calls
3. **Update components** - Ensure using new URL queries

#### Keep for Now

- Schema fields (`finalVideoStorageId`) - Keep for backward compatibility
- Convex storage functionality - May be used for non-video files

#### QA Checklist

- [ ] No new uploads to Convex storage
- [ ] All video URLs come from R2
- [ ] Legacy code commented/removed

---

### Task 4.2: Delete Old Convex Storage Files (0.5 hours)

#### Objective

Free up Convex storage by deleting migrated files.

⚠️ **WARNING**: Only do this AFTER verifying all migrations are successful!

#### Implementation

```typescript
// convex/migrations/cleanupConvexStorage.ts
export const deleteOldStorageFiles = internalAction({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.runQuery(internal.migrations.getMigratedProjects);
    
    for (const project of projects) {
      if (project.finalVideoStorageId && project.finalVideoR2Key) {
        try {
          await ctx.storage.delete(project.finalVideoStorageId);
          console.log(`[Cleanup] Deleted storage for: ${project._id}`);
        } catch (error) {
          console.error(`[Cleanup] Error deleting: ${project._id}`, error);
        }
      }
    }
  },
});
```

#### QA Checklist

- [ ] Old files deleted
- [ ] Convex storage usage reduced
- [ ] App still works correctly

---

### Task 4.3: Final Verification & Documentation (0.5 hours)

#### Objective

Final checks and update documentation.

#### Final QA

```bash
# 1. TypeScript check all modified files
npx tsc --noEmit

# 2. Biome check
npx @biomejs/biome check --write .

# 3. Run tests
npx vitest run

# 4. Deploy
npx convex dev --once
```

#### Documentation Updates

- [ ] Update README if needed
- [ ] Document R2 setup in deployment guide
- [ ] Note environment variables required

---

## 🎯 Success Criteria

### Videos ✅
- [ ] All new final videos stored in R2
- [ ] All new scene videos stored in R2
- [ ] All existing videos migrated to R2
- [ ] Video playback works with R2 URLs

### Images ✅
- [ ] All new scene images stored in R2
- [ ] Start/end frames stored in R2
- [ ] Thumbnails stored in R2
- [ ] Image display works with R2 URLs

### Audio ✅
- [ ] All new narration audio stored in R2
- [ ] All new music audio stored in R2
- [ ] All existing audio migrated to R2
- [ ] Audio playback works with R2 URLs

### User Uploads ✅
- [ ] All new user-uploaded images stored in R2
- [ ] All new user-uploaded videos stored in R2
- [ ] All existing user assets migrated to R2
- [ ] User upload flow works with R2

### System ✅
- [ ] Convex storage bandwidth reduced to near zero
- [ ] No CORS or access errors
- [ ] All tests pass
- [ ] Production deployment successful
- [ ] 13 R2 key fields added to schema (updated from 11)

---

## 💰 Expected Cost Savings

After migration:

| Metric | Before (Convex) | After (R2) |
|--------|-----------------|------------|
| Current bandwidth overage | $1.70/mo | $0/mo |
| At 1,000 users | $160/mo | $1.85/mo |
| At 10,000 users | $1,537/mo | $19.85/mo |

**Immediate savings**: ~$150/mo at 1,000 users
**Future savings**: ~$1,500/mo at 10,000 users

---

## 📁 Files Created/Modified Summary

### Files to Create

| File | Task | Description |
|------|------|-------------|
| `convex/convex.config.ts` | 1.6 | R2 component configuration |
| `convex/r2Storage.ts` | 1.7 | R2 client API with video/image/audio functions |
| `convex/migrations/migrateToR2.ts` | 3.1 | Migration scripts for all file types |
| `convex/migrations/verifyMigration.ts` | 3.3 | Migration verification for all file types |
| `convex/migrations/cleanupConvexStorage.ts` | 4.2 | Storage cleanup script |

### Files to Modify

| File | Task | Changes | File Types |
|------|------|---------|------------|
| `convex/schema.ts` | 2.1 | Add 11 R2 key fields | All |
| `convex/projects.ts` | 2.2, 2.6 | R2 key updates, URL queries | Video, Audio |
| `convex/scenes.ts` | 2.4, 2.5, 2.6 | R2 key updates, URL queries | Video, Image |
| `convex/actions/videoAssembly.ts` | 2.2 | Store final video in R2 | Video |
| `convex/actions/narrationGeneration.ts` | 2.3 | Store narration audio in R2 | Audio |
| `convex/actions/musicGeneration.ts` | 2.3 | Store music audio in R2 | Audio |
| `convex/actions/videoGeneration.ts` | 2.4 | Store scene videos in R2 | Video |
| `convex/files.ts` | 2.5 | User uploads to R2 | User Uploads |
| `convex/actions/imageGeneration.ts` | 2.6 | Store scene images in R2 | Image |
| `app/[locale]/guided/step-4/page.tsx` | 2.8 | Audio playback from R2 | Audio |
| `app/[locale]/guided/step-5/page.tsx` | 2.7 | Scene preview from R2 | Video, Image |
| `app/[locale]/guided/step-6/page.tsx` | 2.7 | Final video from R2 | Video |

**Total New Files**: 5  
**Total Modified Files**: 12  
**Total R2 Key Fields**: 13

### R2 Key Fields by Table

| Table | New Fields | Count |
|-------|------------|-------|
| projects | `finalVideoR2Key`, `narrationR2Key`, `musicR2Key` | 3 |
| scenes | `imageR2Key`, `startFrameR2Key`, `endFrameR2Key`, `videoR2Key`, `thumbnailR2Key` | 5 |
| videos | `fileR2Key`, `thumbnailR2Key` | 2 |
| audioTracks | `fileR2Key` | 1 |
| **assets** | `r2Key`, `storageId` (add for tracking) | 2 |
| **Total** | | **13** |

### ⚠️ Important: Assets Table

The `assets` table contains **BOTH**:
1. **User-uploaded images** (photos from user's device)
2. **AI-generated images** (scene frames)

Both currently use Convex storage and need R2 migration!

### Key Implementation References

The implementation follows the patterns defined in:
- **Architecture**: `architectural-improvements-sprint-21-12-2025.md` lines 725-779
- **Detailed Guide**: `docs/Guides/video-storage-convex-vs-cloudflare-r2.md`
- **@convex-dev/r2 Docs**: https://www.convex.dev/components/cloudflare-r2

---

## ⚠️ Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CORS errors | Medium | High | Test thoroughly, proper CORS config |
| Migration data loss | Low | Critical | Full backup before migration |
| Credential exposure | Low | Critical | Use Convex env vars, never commit |
| Signed URL expiry | Low | Medium | 24h expiry, refresh on access |
| R2 service outage | Very Low | High | Keep fallback URLs in database |

---

**Document Version**: 1.0  
**Created**: December 21, 2025  
**Author**: MyShortReel Development Team  
**Status**: 📋 PLANNING - Ready for Implementation

