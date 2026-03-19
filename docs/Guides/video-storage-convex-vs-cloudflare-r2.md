# Video Storage: Convex vs Cloudflare R2 Comparison

**Last Updated**: December 2025  
**Status**: Critical Decision - Free Tier Limits Exceeded

---

## Executive Summary

⚠️ **Current Problem**: MyShortReel has exceeded Convex's free tier limits for File Bandwidth (6.11 GB used vs 1 GB allowed) before even launching. This document analyzes whether migrating video storage to **Cloudflare R2** is the right decision.

**TL;DR**: For a video generation app like MyShortReel, **Cloudflare R2 is the recommended choice** due to:
1. **Zero egress fees** - The biggest cost driver (bandwidth) is free
2. **22x cheaper at scale** - $149 vs $3,307 for 10,000 users
3. **Native Convex integration** - Official `@convex-dev/r2` component available
4. **Better scalability** - No bandwidth limits to worry about

---

## Table of Contents

1. [Current Usage Analysis](#current-usage-analysis)
2. [Pricing Deep Dive](#pricing-deep-dive)
3. [Cost Projections by Scale](#cost-projections-by-scale)
4. [Benefits & Trade-offs](#benefits--trade-offs)
5. [Implementation Guide](#implementation-guide)
6. [Migration Strategy](#migration-strategy)
7. [Recommendations](#recommendations)

---

## Current Usage Analysis

### Convex Dashboard Snapshot (December 2025)

| Resource | Current Usage | Free Tier Limit | Status |
|----------|---------------|-----------------|--------|
| Function Calls | 111K | 1M | ✅ OK (11%) |
| Action Compute | 0.49 GB-hours | 20 GB-hours | ✅ OK (2.5%) |
| Database Storage | 6.21 MB | 512 MB | ✅ OK (1.2%) |
| Database Bandwidth | 449.39 MB | 1 GB | ⚠️ Warning (44%) |
| **File Storage** | 142.76 MB | 1 GB | ✅ OK (14%) |
| **File Bandwidth** | **6.11 GB** | **1 GB** | ❌ **EXCEEDED (611%)** |

### Root Cause

The **File Bandwidth** is 6x over the limit because:
- Video files are large (typically 5-50 MB each)
- Each preview, playback, and download consumes bandwidth
- Development testing multiplies bandwidth usage
- Video editing workflow requires multiple file accesses

---

## Pricing Deep Dive

### Cloudflare R2 Pricing

| Resource | Free Tier | Standard Storage | Infrequent Access |
|----------|-----------|------------------|-------------------|
| **Storage** | 10 GB-months | $0.015/GB-month | $0.01/GB-month |
| **Class A Operations** (writes, lists) | 1M/month | $4.50/million | $9.00/million |
| **Class B Operations** (reads) | 10M/month | $0.36/million | $0.90/million |
| **Data Retrieval** | N/A | $0.00 | $0.01/GB |
| **Egress (Bandwidth)** | ∞ Unlimited | **$0.00** 🎉 | **$0.00** 🎉 |
| **Min Storage Duration** | N/A | None | 30 days |

> **Key Insight**: R2 has **zero egress fees**. This is the killer feature for video applications.

> ⚠️ **Important Notes**:
> - **Free tier only applies to Standard storage**, not Infrequent Access
> - **Billable unit rounding**: Cloudflare rounds up to the next billing unit (e.g., 1.1 GB → 2 GB)
> - **Infrequent Access**: 30-day minimum storage duration charge applies even if deleted early

### Convex File Storage Pricing

| Plan | File Storage | File Bandwidth | Overage Storage | Overage Bandwidth |
|------|--------------|----------------|-----------------|-------------------|
| **Free** | 1 GB | 1 GB/month | $0.03/GB-month | $0.33/GB |
| **Pro** ($25/dev/mo) | 100 GB | 50 GB/month | $0.03/GB-month | $0.30/GB |

> **Key Issue**: Convex charges **$0.30-0.33/GB for bandwidth** - this is 30-33x more expensive than cloud storage providers.

### Direct Rate Comparison

| Metric | Convex Free | Convex Pro | Cloudflare R2 |
|--------|-------------|------------|---------------|
| Storage ($/GB/mo) | $0.03 | $0.03 | $0.015 |
| Bandwidth ($/GB) | $0.33 | $0.30 | **$0.00** |
| Free Storage | 1 GB | 100 GB | 10 GB |
| Free Bandwidth | 1 GB | 50 GB | **Unlimited** |

---

## Cost Projections by Scale

### Assumptions

- Average video size: **50 MB** (short-form video)
- Each user: **creates 2 videos/month**
- Each video: **viewed/downloaded 5 times** (preview, editing, share views)
- Total bandwidth per user: 2 videos × 50 MB × 5 views = **500 MB/month**
- Storage per user: 2 videos × 50 MB = **100 MB/month** (cumulative)

### 100 Users

| Cost Item | Convex (Pro) | Cloudflare R2 |
|-----------|--------------|---------------|
| Base subscription | $25.00 | $0.00 |
| Storage (10 GB) | Included | $0.00 (free tier) |
| Bandwidth (50 GB) | Included | **$0.00** |
| **Monthly Total** | **$25.00** | **$0.00** |

### 1,000 Users

| Cost Item | Convex (Pro) | Cloudflare R2 |
|-----------|--------------|---------------|
| Base subscription | $25.00 | $0.00 |
| Storage (100 GB) | Included | $1.35 (90 GB × $0.015) |
| Bandwidth (500 GB) | $135.00 (450 GB × $0.30) | **$0.00** |
| Operations | Included | ~$0.50 |
| **Monthly Total** | **$160.00** | **$1.85** |

> **R2 is 86x cheaper at 1,000 users**

### 10,000 Users

| Cost Item | Convex (Pro) | Cloudflare R2 |
|-----------|--------------|---------------|
| Base subscription | $25.00 | $0.00 |
| Storage (1,000 GB = 1 TB) | $27.00 (900 GB × $0.03) | $14.85 |
| Bandwidth (5,000 GB = 5 TB) | **$1,485.00** (4,950 GB × $0.30) | **$0.00** |
| Operations | Included | ~$5.00 |
| **Monthly Total** | **$1,537.00** | **$19.85** |

> **R2 is 77x cheaper at 10,000 users**

### 100,000 Users (Future Scale)

| Cost Item | Convex (Pro) | Cloudflare R2 |
|-----------|--------------|---------------|
| Base subscription | $25.00 | $0.00 |
| Storage (10 TB) | $300.00 | $150.00 |
| Bandwidth (50 TB) | **$15,000.00** | **$0.00** |
| Operations | Included | ~$50.00 |
| **Monthly Total** | **$15,325.00** | **$200.00** |

> **R2 is 76x cheaper at 100,000 users**

### Visual Comparison

```
Monthly Cost by User Count

                      Convex Pro    R2
100 users              $25          $0      
1,000 users           $160         $1.85    
10,000 users        $1,537        $19.85   
100,000 users      $15,325       $200      

Bandwidth is the cost killer for video apps!
```

---

## Benefits & Trade-offs

### Cloudflare R2

#### ✅ Pros
| Benefit | Description |
|---------|-------------|
| **Zero Egress Fees** | No bandwidth charges - critical for video streaming |
| **S3-Compatible** | Works with existing S3 tools and libraries |
| **Global CDN** | Cloudflare's edge network for fast delivery |
| **Generous Free Tier** | 10 GB storage + 1M Class A + 10M Class B ops/month |
| **Native Convex Support** | Official `@convex-dev/r2` component |
| **Predictable Costs** | Only pay for storage, not usage patterns |
| **Infrequent Access Tier** | Even cheaper for archived content |

#### ❌ Cons
| Limitation | Description |
|------------|-------------|
| **Setup Complexity** | Requires Cloudflare account, API keys, CORS config |
| **Additional Service** | One more service to manage and monitor |
| **Metadata in Convex** | Still need Convex for file metadata/references |
| **Learning Curve** | New concepts (buckets, signed URLs) |

### Convex File Storage

#### ✅ Pros
| Benefit | Description |
|---------|-------------|
| **Zero Setup** | Works out of the box with Convex |
| **Unified Stack** | One service for everything |
| **Reactivity** | Real-time updates on file changes |
| **Simpler Code** | Direct integration with Convex queries/mutations |
| **No CORS Issues** | Same-origin with your Convex backend |

#### ❌ Cons
| Limitation | Description |
|------------|-------------|
| **Expensive Bandwidth** | $0.30-0.33/GB is 20-30x market rate |
| **Low Free Tier** | 1 GB bandwidth insufficient for video apps |
| **No CDN** | Single region, no edge distribution |
| **Scaling Concerns** | Costs become prohibitive at scale |

---

## Implementation Guide

### Prerequisites

1. **Cloudflare Account** - [Sign up at cloudflare.com](https://cloudflare.com)
2. **R2 Bucket** - Create in Cloudflare dashboard
3. **API Token** - Generate with R2 read/write permissions

### Step 1: Install the Convex R2 Component

```bash
npm install @convex-dev/r2
```

### Step 2: Configure convex.config.ts

Create or update `convex/convex.config.ts`:

```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import r2 from "@convex-dev/r2/convex.config.js";

const app = defineApp();
app.use(r2);

export default app;
```

### Step 3: Set Environment Variables

```bash
# In Convex Dashboard or via CLI
npx convex env set R2_TOKEN <your-token>
npx convex env set R2_ACCESS_KEY_ID <your-access-key>
npx convex env set R2_SECRET_ACCESS_KEY <your-secret-key>
npx convex env set R2_ENDPOINT <your-endpoint-url>
npx convex env set R2_BUCKET <your-bucket-name>
```

### Step 4: Create R2 Client

```typescript
// convex/r2Storage.ts
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const r2 = new R2(components.r2);

// Client API for uploads
export const { generateUploadUrl, syncMetadata } = r2.clientApi({
  checkUpload: async (ctx, bucket) => {
    // Validate user has permission to upload
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
  },
  onUpload: async (ctx, bucket, key) => {
    // Optional: Track upload in your database
    console.log(`File uploaded: ${key}`);
  },
});

// Get URL for a stored file
export const getVideoUrl = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await r2.getUrl(args.key, {
      expiresIn: 60 * 60 * 24, // 24 hours
    });
  },
});

// Delete a file
export const deleteVideo = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await r2.deleteObject(ctx, args.key);
  },
});
```

### Step 5: Upload from React

```typescript
// components/VideoUploader.tsx
import { useUploadFile } from "@convex-dev/r2/react";
import { api } from "../convex/_generated/api";

export function VideoUploader() {
  const uploadFile = useUploadFile(api.r2Storage);
  
  async function handleUpload(file: File) {
    const key = await uploadFile(file);
    // key is the R2 object key - store this in your database
    return key;
  }
  
  return (
    <input 
      type="file" 
      accept="video/*" 
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
      }} 
    />
  );
}
```

### Step 6: Store from Actions (Server-side)

```typescript
// convex/actions/storeVideo.ts
import { internalAction } from "../_generated/server";
import { r2 } from "../r2Storage";

export const storeGeneratedVideo = internalAction({
  args: { videoUrl: v.string(), projectId: v.string() },
  handler: async (ctx, args) => {
    // Fetch video from external service (e.g., fal.ai)
    const response = await fetch(args.videoUrl);
    const blob = await response.blob();
    
    // Store in R2
    const key = await r2.store(ctx, blob, {
      key: `projects/${args.projectId}/${crypto.randomUUID()}.mp4`,
      type: "video/mp4",
    });
    
    // Update project with video key
    await ctx.runMutation(internal.projects.setVideoKey, {
      projectId: args.projectId,
      videoKey: key,
    });
    
    return key;
  },
});
```

---

## Migration Strategy

### Phase 1: Initial Setup (~4-6 hours)

| Task | Estimated Time |
|------|----------------|
| Create Cloudflare account & R2 bucket | 30 min |
| Configure API tokens & CORS policy | 30 min |
| Install `@convex-dev/r2` component | 15 min |
| Set environment variables in Convex | 15 min |
| Create R2 storage functions (`r2Storage.ts`) | 2-3 hours |
| Test upload/download flow locally | 1-2 hours |

### Phase 2: Integration (~6-8 hours)

| Task | Estimated Time |
|------|----------------|
| Update video generation actions to store in R2 | 2-3 hours |
| Update video retrieval queries to use R2 URLs | 2-3 hours |
| Add feature flag: `USE_R2_STORAGE` | 30 min |
| Update frontend components for R2 URLs | 1-2 hours |
| End-to-end testing | 1 hour |

### Phase 3: Data Migration (~3-4 hours)

| Task | Estimated Time |
|------|----------------|
| Create migration action to copy existing videos to R2 | 1-2 hours |
| Update database references (storage IDs → R2 keys) | 1 hour |
| Verify all videos accessible via R2 | 30 min |
| Run migration script on dev deployment | 30 min |

### Phase 4: Cleanup (~2-3 hours)

| Task | Estimated Time |
|------|----------------|
| Remove feature flag (R2 becomes default) | 15 min |
| Delete old Convex storage files | 30 min |
| Remove legacy storage code | 1-2 hours |
| Final verification & documentation | 30 min |

### Total Estimated Implementation Time

| Phase | Hours |
|-------|-------|
| Phase 1: Initial Setup | 4-6 hours |
| Phase 2: Integration | 6-8 hours |
| Phase 3: Data Migration | 3-4 hours |
| Phase 4: Cleanup | 2-3 hours |
| **Total** | **15-21 hours** |

> **Note**: Times assume familiarity with Convex and basic cloud storage concepts. Add 2-4 hours for learning curve if new to R2/S3-compatible storage.

### Schema Changes

Current schema fields using Convex storage:

```typescript
// projects table
finalVideoStorageId: v.optional(v.id("_storage")),

// videos table
fileStorageId: v.optional(v.string()),
thumbnailStorageId: v.optional(v.string()),
```

Add new R2 fields:

```typescript
// projects table - add
finalVideoR2Key: v.optional(v.string()),

// videos table - add
fileR2Key: v.optional(v.string()),
thumbnailR2Key: v.optional(v.string()),
```

---

## Recommendations

### Priority 1: Initial Setup (~4-6 hours)

1. **Create Cloudflare Account** and set up R2 bucket
2. **Install `@convex-dev/r2`** component
3. **Configure environment variables** (R2 credentials in Convex)
4. **Set up CORS** for localhost and production domains

### Priority 2: Integration (~6-8 hours)

1. **Route new video uploads to R2**
2. **Update all video retrieval** to use R2 URLs
3. **Implement signed URLs** with appropriate expiry (24 hours recommended)
4. **Test end-to-end flow** (upload → store → retrieve → play)

### Priority 3: Migration & Cleanup (~5-7 hours)

1. **Migrate existing videos** from Convex storage to R2
2. **Update database references** (storage IDs → R2 keys)
3. **Remove legacy Convex storage code**
4. **Verify all videos accessible**

### Future Optimizations

1. **Use Infrequent Access** tier for archived/old videos (> 30 days)
2. **Implement lifecycle rules** for automatic archival
3. **Set up usage monitoring** in Cloudflare dashboard
4. **Consider Cloudflare Images** for thumbnail optimization

---

## Reference Links

- [Convex R2 Component Documentation](https://www.convex.dev/components/cloudflare-r2)
- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [Convex Pricing](https://www.convex.dev/pricing)
- [Example App: Video to Markdown](https://github.com/mikecann/video-to-markdown)
- [Video Tutorial: Convex + R2 Integration](https://www.youtube.com/watch?v=KQVRDdmrIo4)

---

## Conclusion

For MyShortReel, **Cloudflare R2 is the clear choice** for video storage:

| Factor | Winner |
|--------|--------|
| Cost at Scale | R2 (77x cheaper at 10K users) |
| Bandwidth Costs | R2 ($0 vs $0.30/GB) |
| Integration Effort | Convex (native) vs R2 (minimal via component) |
| Free Tier | R2 (10GB storage, unlimited bandwidth) |
| CDN/Performance | R2 (global edge network) |

The `@convex-dev/r2` component makes integration straightforward while keeping Convex as the source of truth for metadata and application logic. This is the **best of both worlds**: Convex's excellent developer experience combined with R2's cost-effective storage.

**Bottom Line**: The current 6 GB bandwidth overage would cost ~$2/month on R2 (operations only) vs ~$1.70/month on Convex overage. But at 10,000 users, R2 saves **$1,517/month**. Start with R2 now to avoid migration complexity later.

---

**Maintained By**: MyShortReel Development Team  
**Last Updated**: December 2025  
**Version**: 1.0

