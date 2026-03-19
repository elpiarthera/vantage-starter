# 🎯 Mini Apps Feasibility Analysis

**Created**: December 19, 2025  
**Status**: Analysis Document  
**Priority**: Feature Enhancement

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| `docs/Guides/design-system.md` | Color tokens, typography, spacing |
| `docs/Best-Practices/mobile-first-best-practices.md` | Device detection, adaptive components |
| `docs/example/Nano Banana Pro Playground code example.md` | **Reference implementation to copy from** |
| `docs/example/AI Image Generation Benchmark.md` | **Multi-model benchmark (for comparison feature)** |
| `docs/example/AI Ad Creator.md` | **Full video ad pipeline (seed chaining pattern)** |
| `docs/example/EasyEdit example.txt` | **Iterative image editing with version history** |
| `docs/example/v0 Theme Song Generator.txt` | **Music generation UI patterns** |
| `docs/example/magic referral.txt` | **Referral system with visual invites** |
| `docs/Understanding/ai-models-overview.md` | AI model pricing and usage |

---

## Executive Summary

This document analyzes the feasibility and implementation effort for creating **4 standalone mini apps + 1 growth feature** within MyShortReel:

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | **Image Generator** | Mini App | Text-to-image (one-shot generation) |
| 2 | **Image Editor** | Mini App | Iterative editing with version history (v0→v1→v2...) |
| 3 | **Quick Video** | Mini App | 3 keyframes → ONE 10s video (with occasion selector) |
| 4 | **Music Generator** | Mini App | Text-to-music (background music/songs) |
| 5 | **Referral System** | Growth Feature | Share link, earn credits, tier progression |

**User Journey**: Generate Image → Edit Image → Create Video → Add Custom Music → **Share & Earn**

**Key Finding**: We have **production-ready reference implementations** to copy from:
- `Nano Banana Pro Playground` → Image Generator
- `EasyEdit` → Image Editor (iterative editing with versions)
- `AI Ad Creator` → Quick Video (3 keyframes → 1 video pattern)
- `v0 Theme Song Generator` → Music Generator (UI patterns)
- `magic referral` → Referral System (share links, tiers, visual invites)

### Quick Estimates

| Feature | Time | Priority |
|---------|------|----------|
| **Image Generator** (text-to-image) | 3-4 hours | ⭐ P1 - Build first |
| **Image Editor** (iterative with versions) | 5-8 hours | ⭐ P2 - Edit generated images |
| **Quick Video** (with occasion selector) | 10-12 hours | ⭐ P3 - Use images for video |
| **Music Generator** (text-to-music) | 7-9 hours | ⭐ P4 - Custom audio for video |
| **Referral System** (growth feature) | 15-18 hours | ⭐ P5 - Virality after core features |
| **Shared Infrastructure** | 2-3 hours | ⭐ P1 |
| **TOTAL** | **42-54 hours** | ~5-7 days |

> **User Journey**: Generate Image → Edit Image → Create Video from Images

---

## Table of Contents

1. [Design System & Mobile-First Requirements](#design-system--mobile-first-requirements)
2. [Current Infrastructure Analysis](#current-infrastructure-analysis)
3. [Mini App 1: Image Generator](#mini-app-1-image-generator-text-to-image)
4. [Mini App 2: Image Editor](#mini-app-2-image-editor-image-to-image)
5. [Mini App 3: Scene Generator](#mini-app-3-scene-generator-video-generation)
6. [Mini App 4: Music Generator](#mini-app-4-music-generator-text-to-music)
7. [Growth Feature: Referral System](#growth-feature-referral-system)
8. [Bonus Analysis: AI Image Benchmark](#bonus-analysis-ai-image-generation-benchmark)
9. [Bonus Analysis: AI Ad Creator](#bonus-analysis-ai-ad-creator)
10. [Shared Requirements](#shared-requirements)
11. [Time Estimation Summary](#time-estimation-summary)
12. [Implementation Approach](#implementation-approach)
13. [Recommended Priority Order](#recommended-priority-order)

---

## Design System & Mobile-First Requirements

### ⚠️ IMPORTANT: Style Adaptation Required

The Nano Banana Pro Playground uses an **all-black theme** that differs from MyShortReel's design system. When adapting components:

#### Color Token Mapping (Playground → MyShortReel)

| Playground (Black) | MyShortReel Token | Tailwind Class |
|--------------------|-------------------|----------------|
| `#000000` (background) | `--background` | `bg-background` (#101a23) |
| `#111111` (secondary) | `--secondary` | `bg-secondary` (#223649) |
| `#1a1a1a` (accent) | `--card` | `bg-card` (#182634) |
| `#333333` (border) | `--border` | `border-border` (#223649) |
| `#ffffff` (text) | `--foreground` | `text-foreground` |
| `#999999` (muted) | `--muted-foreground` | `text-muted-foreground` |

**Reference**: `docs/Guides/design-system.md`

#### Mobile-First Patterns to Apply

From `docs/Best-Practices/mobile-first-best-practices.md`:

```tsx
// ✅ Use DeviceContext for device detection
import { useDevice } from "@/contexts/DeviceContext"
const { isMobile, isDesktop } = useDevice()

// ✅ Use Tailwind mobile-first classes
className="p-4 md:p-6 lg:p-8"

// ✅ Touch targets: 44px minimum (WCAG 2.1)
className="min-h-[44px] min-w-[44px]"

// ✅ Form inputs: 48px minimum (prevents iOS zoom)
className="min-h-[48px]"

// ✅ Adaptive components for modals
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal"
```

#### Typography (from Design System)

```tsx
// Headings
<h1 className="text-3xl font-bold md:text-4xl">
<h2 className="text-2xl font-semibold">
<h3 className="text-xl font-medium">

// Body text with proper line height
<p className="text-base leading-relaxed">
<p className="text-sm text-muted-foreground">
```

---

## Current Infrastructure Analysis

### ✅ Backend (Convex Actions) - READY

| Action File | Functionality | Reusable? |
|-------------|--------------|-----------|
| `imageGeneration.ts` | Text-to-image with Nano Banana Pro + Seedream fallback | ✅ Direct reuse |
| `videoGeneration.ts` | Image-to-video with Kling v2.5 (start + optional end frame) | ✅ Direct reuse |
| `videoRegeneration.ts` | Regenerate with feedback | ✅ Can adapt |
| `videoPolling.ts` | Async video status polling | ✅ Direct reuse |
| `narrationGeneration.ts` | TTS generation | 🔶 Not needed for mini apps |
| `musicGeneration.ts` | Music generation | 🔶 Not needed for mini apps |

### ✅ Frontend Components - READY

| Component | Location | Reusable? |
|-----------|----------|-----------|
| `AssetSelector` | `components/asset-management/` | ✅ Contains full image gen UI |
| `VideoGenerator` | `components/video-generation/` | ✅ Complete video workflow |
| `InsufficientCreditsModal` | `components/credits/` | ✅ Direct reuse |
| All UI components | `components/ui/` | ✅ Direct reuse |

### ✅ Hooks - READY

| Hook | Location | Reusable? |
|------|----------|-----------|
| `useAssetManagement` | `hooks/business-logic/` | ✅ Image gen + upload |
| `useCredits` | `hooks/business-logic/` | ✅ Credit management |
| `useVideoStatus` | `hooks/business-logic/` | ✅ Video status polling |
| `useVideoRegeneration` | `hooks/business-logic/` | ✅ Regeneration handling |
| `useFileUpload` | `hooks/` | ✅ File upload handling |

---

## Mini App 1: Image Generator (Text-to-Image)

### Purpose
Standalone page where users can generate images from text prompts without creating a full video project.

### 🎁 Reference Implementation: Nano Banana Pro Playground

**File Location**: `docs/example/Nano Banana Pro Playground code example.md`

We have a **complete, production-ready reference implementation** that includes:

```
Complete Playground Features:
├── Text-to-Image mode (prompt + aspect ratio)
├── Image-to-Image mode (upload/URL + prompt)
├── Multiple aspect ratios with selector
├── Progress bar during generation
├── Output section with image preview
├── Actions: Download, Copy, Open in new tab, Use as Input
├── Generation history with persistence
├── Fullscreen viewer for generated images
├── Toast notifications
├── API route (/api/generate-image) with both modes
├── Mobile responsive design
└── Global drag & drop zone
```

### Implementation Strategy: **Copy-Paste + Adapt**

| Source | Target | Adaptation Required |
|--------|--------|---------------------|
| `components/image-combiner/index.tsx` | `components/tools/ImageGenerator.tsx` | Remove shader background, add credits |
| `components/image-combiner/input-section.tsx` | Reuse directly | Minor styling tweaks |
| `components/image-combiner/output-section.tsx` | Reuse directly | Add credit display |
| `hooks/use-image-generation.ts` | Adapt | Switch to Convex action |
| `app/api/generate-image/route.ts` | Already have in Convex | Use existing `imageGeneration.ts` |

### What We Already Have (No New Code)

1. ✅ **Backend** - `convex/actions/imageGeneration.ts` (Nano Banana Pro + fallback)
2. ✅ **Credit system** - `useCredits` hook + `InsufficientCreditsModal`
3. ✅ **UI components** - All from `components/ui/`
4. ✅ **File upload** - `useFileUpload` hook

### Minimal New Code Required

| Task | Effort | Description |
|------|--------|-------------|
| Copy & adapt `ImageCombiner` | 1 hour | Rename, remove auth, add credits |
| Page route | 15 min | `app/[locale]/tools/image-generator/page.tsx` |
| Swap API to Convex action | 30 min | Replace fetch with `useAction` |
| Style integration | 30 min | Match MyShortReel theme |
| Translation keys | 15 min | Add essential keys |

### Total Estimate: **2-3 hours** ⚡

### Complexity: 🟢 VERY LOW (Copy-paste with adaptation)

---

## Mini App 2: Image Editor (Iterative Editing)

### Purpose
Standalone page where users can **iteratively edit** an image step-by-step, building up changes with version history.

### 🎁 Reference Implementation: EasyEdit

**File Location**: `docs/example/EasyEdit example.txt`

EasyEdit provides a **different approach** than simple image transformation:

```
Upload Image → Edit with prompt → v1 → Edit again → v2 → Edit again → v3...
```

### Key Features from EasyEdit

| Feature | Description |
|---------|-------------|
| **Image upload** | Drag & drop or select from samples |
| **AI suggestions** | AI analyzes image, suggests 3 edits |
| **Prompt input** | "Remove background", "Add sunset", etc. |
| **Version history** | v0 → v1 → v2... with thumbnail sidebar |
| **Go back to any version** | Click any version to make it active |
| **Download any version** | Download button per version |
| **Model selection** | FLUX Kontext Dev or Pro |
| **Iterative building** | Each edit builds on the previous |

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Upload or Select Image                                  │
├─────────────────────────────────────────────────────────────────┤
│ • Drag & drop image                                             │
│ • Or select from sample images                                  │
│ → Image becomes v0 (original)                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Edit with AI                                            │
├─────────────────────────────────────────────────────────────────┤
│ • See AI-suggested edits (3 options)                            │
│ • Or type your own edit prompt                                  │
│ • Click submit → AI generates edited image                      │
│ → New version added (v1)                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Continue Editing (Repeat)                               │
├─────────────────────────────────────────────────────────────────┤
│ • v1 is now active                                              │
│ • Enter another edit prompt                                     │
│ • AI edits v1 → creates v2                                      │
│ • Continue: v2 → v3 → v4...                                     │
│ • Click any version in sidebar to go back                       │
└─────────────────────────────────────────────────────────────────┘
```

### Version History Sidebar

```
┌──────────┐
│ v3 ← Active (highlighted)
├──────────┤
│ v2       │ ← Click to switch
├──────────┤
│ v1       │ ← Click to switch
├──────────┤
│ v0       │ ← Original image
└──────────┘
```

### AI Suggestions Feature

When an image is uploaded, AI analyzes it and suggests 3 practical edits:

```typescript
// AI generates suggestions based on the image
const suggestions = await getSuggestions(imageUrl);
// Returns: ["Add dramatic sunset lighting", "Remove background", "Make it vintage sepia"]
```

User can click any suggestion or type their own prompt.

### Architecture

```
/tools/image-editor/
├── page.tsx                     ← Image Editor mini app
├── components/
│   ├── ImageUploader.tsx        ← Drag & drop upload
│   ├── SampleImages.tsx         ← Pre-loaded sample images
│   ├── VersionHistory.tsx       ← Sidebar with version thumbnails
│   ├── EditPromptInput.tsx      ← Prompt input + submit
│   ├── SuggestedEdits.tsx       ← AI-suggested edits (3 buttons)
│   └── ImagePreview.tsx         ← Current image with overlay
└── hooks/
    └── useImageEditor.ts        ← State management for versions
```

### Implementation Strategy

| Source | Target | Adaptation |
|--------|--------|------------|
| `EasyEdit/page.tsx` | `components/tools/ImageEditor.tsx` | Apply design system |
| `EasyEdit/ImageUploader.tsx` | Reuse directly | Minor styling |
| `EasyEdit/SuggestedPrompts.tsx` | `components/tools/SuggestedEdits.tsx` | Use our AI |
| `EasyEdit/actions.ts` | Use Convex action | Switch to `imageGeneration.ts` |
| Version sidebar | New component | Simple thumbnail list |

### Backend: Convex Action Update

```typescript
// Update imageGeneration.ts to support editing mode
export const editImage = action({
  args: {
    sourceImageUrl: v.string(),  // The image to edit
    prompt: v.string(),          // Edit instruction
    aspectRatio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Use Nano Banana Pro with image reference
    const result = await generateWithFal(MODELS.textToImage.primary, {
      prompt: args.prompt,
      image_url: args.sourceImageUrl,  // Reference image for editing
      // ...
    });
    return { success: true, imageUrl: result.images[0].url };
  },
});
```

### Time Estimate

| Component | Hours |
|-----------|-------|
| Copy EasyEdit UI structure | 2h |
| Version history sidebar | 1.5h |
| Image upload (reuse existing) | 0.5h |
| Edit prompt input + submit | 1h |
| AI suggestions (optional) | 2h |
| Adapt to Convex actions | 1h |
| Credits integration | 0.5h |
| Design system styling | 1h |
| **TOTAL** | **5-8h** |

### Complexity: 🟡 MEDIUM

### Comparison: Image Generator vs Image Editor

| Aspect | Image Generator | Image Editor |
|--------|-----------------|--------------|
| Input | Text prompt (+ optional image) | **Must have source image** |
| Output | New image | Edited version of input |
| History | Single output | **v0 → v1 → v2...** |
| Workflow | One-shot | **Iterative** |
| Use case | Create from scratch | Refine existing image |

---

## Mini App 3: Scene Generator (Video Generation)

### Purpose
Standalone page where users can generate a single video scene with optional first/last frame support.

### Existing Components to Reuse

```
VideoGenerator.tsx (complete workflow)
├── Idle state (ready to generate)
├── Generating state (progress + polling)
├── Completed state (video player + actions)
├── Failed state (error + retry)
├── Download button
└── Regeneration chat modal

Step-3 Page Logic
├── Frame assignment (start + end)
├── Duration selector (5s or 10s)
├── Video generation trigger
├── Credit deduction & refund
└── Status polling via useVideoStatus
```

### What Already Works

1. **Video generation** - Full `generateVideo` action
2. **Status polling** - `pollVideoStatus` action + `useVideoStatus` hook
3. **Video player** - HTML5 video with controls
4. **Download** - Blob-based download for cross-origin URLs
5. **Regeneration** - Full chat-based regeneration flow
6. **Credit system** - 20 credits per video

### New Code Required

| Task | Effort | Description |
|------|--------|-------------|
| Page route | 15 min | `app/[locale]/tools/scene-generator/page.tsx` |
| Simplified scene state | 1 hour | Local state for start/end frames without DB |
| Frame assignment UI | 2 hours | Reuse AssetSelector in modal |
| Duration selector | 30 min | Simple 5s/10s toggle |
| Prompt input option | 1 hour | Optional text-to-video mode |
| Page layout/header | 30 min | Navigation, back button, credits |
| Translation keys | 30 min | Add to locale files |

### API Modifications

| Task | Effort | Description |
|------|--------|-------------|
| Optional scene creation | 2 hours | Support standalone video without project |
| Temporary scene storage | 1 hour | Store in session or temp collection |

### Modes to Support

1. **Image-to-Video (basic)**
   - Upload/generate start frame only
   - Generate video from single image

2. **Image-to-Video (advanced)**
   - Upload/generate start + end frames
   - Generate transition video

3. **Text-to-Video (optional future)**
   - Enter prompt only
   - Generate start frame → then video
   - More complex, could be Phase 2

### Total Estimate: **8-10 hours**

### Complexity: 🟡 MEDIUM

---

## Growth Feature: Referral System

### Purpose

A **viral growth mechanism** where users earn credits by inviting friends. Includes a unique "Magic Card" feature that uses AI to generate personalized visual invites.

### 🎁 Reference Implementation: Magic Referral

**File Location**: `docs/example/magic referral.txt`

Complete referral system with:

```
Referral Hub (3-Card Layout)
├── ReferralLinkCard
│   ├── Unique referral link display
│   ├── Copy to clipboard
│   └── Share buttons (X, WhatsApp, Email)
├── MagicCardGenerator
│   ├── Template carousel
│   ├── Personal message input
│   ├── AI image generation (reuses existing!)
│   └── Preview & download
└── ReferralStatsCard
    ├── Current tier display
    ├── Progress bar to next tier
    ├── Motivational text
    └── Referral history table
```

### The 3 Components

#### 1. ReferralLinkCard - Share Your Link

| Feature | Description |
|---------|-------------|
| **Unique Link** | `https://app.myshortreel.com/ref/ABC123` |
| **Copy Button** | One-click copy with toast feedback |
| **Share X** | Pre-filled tweet with link |
| **Share WhatsApp** | Pre-filled message with link |
| **Share Email** | Pre-filled email with subject/body |

#### 2. MagicCardGenerator - AI Visual Invites 🌟

This is the **unique differentiator** - users create personalized visual invites:

```typescript
// Reuses existing imageGeneration.ts!
const prompt = `Elegant invitation card design:
  "You're invited to create amazing videos with MyShortReel!"
  Personal message: "${userMessage}"
  Style: modern gradient, professional, celebration`;

const result = await generateImage({ prompt, aspectRatio: "16:9" });
```

| Feature | Description |
|---------|-------------|
| **Template Picker** | 4 pre-designed card styles |
| **Personal Message** | Textarea for custom message |
| **AI Generation** | Creates unique invite card |
| **Preview** | Shows generated image |
| **Download/Share** | Save or share the card |

#### 3. ReferralStatsCard - Track Progress

| Feature | Description |
|---------|-------------|
| **Current Tier** | Badge showing tier (Apprentice, Wizard, etc.) |
| **Progress Bar** | Visual progress to next tier |
| **Motivational Text** | "Just 3 more referrals to become a Wizard!" |
| **History Table** | Friend name, status, date, credits earned |

### Reward System

| Event | Credits | Description |
|-------|---------|-------------|
| Friend **signs up** | +20 | When they create an account |
| Friend **subscribes** | +100 | When they become paying customer |

### Tier System (Gamification)

| Tier | Referrals | Benefits |
|------|-----------|----------|
| **Starter** | 0 | Base access |
| **Apprentice** | 1-4 | Basic rewards |
| **Wizard** | 5-9 | Bonus credit multiplier |
| **Archmage** | 10-24 | Exclusive features |
| **Legend** | 25+ | VIP status + early access |

### Architecture

```
/dashboard/referrals/
├── page.tsx                     ← Referral Hub page
├── components/
│   ├── ReferralHub.tsx          ← Main container
│   ├── ReferralLinkCard.tsx     ← Share link component
│   ├── MagicCardGenerator.tsx   ← AI visual invites
│   └── ReferralStatsCard.tsx    ← Stats & history
└── hooks/
    └── useReferralData.ts       ← Convex query hook
```

### Backend: Convex Schema

```typescript
// convex/schema.ts - Add to existing schema

referrals: defineTable({
  userId: v.id("users"),
  referralCode: v.string(),              // Unique code "ABC123"
  referredBy: v.optional(v.id("users")), // Who referred this user
  referralCount: v.number(),             // Total successful referrals
  creditsEarned: v.number(),             // Lifetime credits from referrals
  currentTier: v.string(),               // "Apprentice", "Wizard", etc.
})
  .index("by_code", ["referralCode"])
  .index("by_user", ["userId"]),

referralHistory: defineTable({
  referrerId: v.id("users"),             // Who made the referral
  referredUserId: v.id("users"),         // Who signed up
  referredUserName: v.string(),          // Display name
  status: v.union(v.literal("signed_up"), v.literal("subscribed")),
  creditsAwarded: v.number(),
  createdAt: v.number(),
})
  .index("by_referrer", ["referrerId"]),
```

### Backend: Convex Functions

```typescript
// convex/referrals.ts

// Get user's referral data
export const getReferralData = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const referral = await ctx.db.query("referrals")
      .withIndex("by_user", q => q.eq("userId", userId))
      .first();
    
    const history = await ctx.db.query("referralHistory")
      .withIndex("by_referrer", q => q.eq("referrerId", userId))
      .collect();
    
    return {
      magicLink: `https://app.myshortreel.com/ref/${referral.referralCode}`,
      referralCode: referral.referralCode,
      referralHistory: history,
      currentTier: referral.currentTier,
      progressToNextTier: referral.referralCount,
      nextTierGoal: getNextTierGoal(referral.currentTier),
      motivationalText: getMotivationalText(referral),
    };
  },
});

// Track when someone signs up via referral
export const trackReferralSignup = mutation({
  args: { referralCode: v.string() },
  handler: async (ctx, { referralCode }) => {
    // Find referrer, create history entry, award credits
    // ...
  },
});

// Track when referred user subscribes
export const trackReferralSubscription = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Find if user was referred, upgrade status, award bonus credits
    // ...
  },
});
```

### Integration Points

| Integration | Description |
|-------------|-------------|
| **Clerk Sign-up** | Capture `?ref=CODE` from URL, store in user metadata |
| **Post-signup mutation** | Call `trackReferralSignup` with referral code |
| **Stripe Webhook** | On subscription, call `trackReferralSubscription` |
| **Dashboard Navigation** | Add "Referrals" link to sidebar |
| **Image Generation** | Reuse `imageGeneration.ts` for Magic Cards |

### What We Already Have

| Component | Status | Notes |
|-----------|--------|-------|
| **Credit System** | ✅ Ready | Just add credits on referral |
| **Image Generation** | ✅ Ready | Reuse for Magic Cards |
| **UI Components** | ✅ Ready | Card, Button, Input, Progress, Badge, Tabs |
| **Clerk Auth** | ✅ Ready | Add referral code handling |
| **User Schema** | 🔶 Extend | Add referralCode field |

### Time Estimate

| Component | Hours | Description |
|-----------|-------|-------------|
| **Backend: Referral schema** | 3-4h | Tables, indexes, queries, mutations |
| **Backend: Referral tracking** | 2-3h | Sign-up tracking, subscription upgrade |
| **Backend: Tier calculation** | 1h | Calculate tier from count |
| **Frontend: ReferralLinkCard** | 1h | Copy, share buttons |
| **Frontend: MagicCardGenerator** | 2h | Template picker, AI generation |
| **Frontend: ReferralStatsCard** | 2h | Tabs, progress, history table |
| **Frontend: Referral Hub page** | 1h | Layout + routing |
| **Clerk integration** | 2h | Handle referral code on sign-up |
| **Design system styling** | 1h | Apply MyShortReel theme |
| **TOTAL** | **15-18h** | (~2-2.5 days) |

### Complexity: 🟡 MEDIUM

### Why This Is HIGH VALUE

| Benefit | Impact |
|---------|--------|
| **Cheap Acquisition** | Credits cost less than paid ads |
| **Viral Loop** | Users share to earn, creating organic growth |
| **Retention** | Tier progression keeps users engaged |
| **Network Effects** | More users = more content = more value |
| **Natural Fit** | Integrates with existing credit system |

### Priority: ⭐ **P5 - After Core Features**

**Why P5?**
- Users need to experience value before sharing
- Core mini-apps (Image Generator, Editor, Video) must work first
- Referral system amplifies existing value, doesn't create it

**When to build:**
- After Quick Video is complete
- When you're ready to focus on growth

---

## Bonus Analysis: AI Image Generation Benchmark

### What Is It?

**File Location**: `docs/example/AI Image Generation Benchmark.md`

A complete benchmark application that generates images from the **same prompt across 11 different AI models simultaneously**, comparing:
- Generation speed
- Cost per image
- Visual quality (side-by-side comparison)

### The 11 Models Included

| Model | Provider | Cost/Image |
|-------|----------|------------|
| Nano Banana | Fal AI | $0.039 |
| FLUX Schnell | Fal AI | $0.003 |
| FLUX Dev | Fal AI | $0.025 |
| FLUX Pro v1.1 | Fal AI | $0.040 |
| Stable Diffusion 3.5 Medium | Fal AI | $0.065 |
| Flux Fast Schnell | Prodia | $0.002 |
| Flux Fast Dev | Prodia | $0.020 |
| Flux Pro 1.1 | Prodia | $0.040 |
| Flux Dev | Prodia | $0.020 |
| Stable Diffusion 1.5 | Prodia | $0.0025 |
| Grok 2 Image | xAI | $0.070 |

### Key Features of the Benchmark

```
Complete Benchmark Application
├── Single prompt → 11 parallel generations
├── Real-time progress (shows images as they complete)
├── Performance ranking (sorted by speed)
├── Historical chart (track across multiple tests)
├── Stats header (avg duration, total cost, fastest model)
├── Image grid with click-to-expand
├── Grid column selector (2-5 columns)
├── Collapsible sidebar for analytics
├── User auth (with Vercel/OAuth)
├── Usage limits (IP tracking for guests)
├── Supabase integration for tracking
└── Full responsive design
```

### UI Components We Could Reuse

| Component | What It Does | Reusability |
|-----------|-------------|-------------|
| `ImageGrid` | Grid of images with loading/error states, metadata overlay | ✅ Direct reuse |
| `ImageModal` | Fullscreen image viewer with ESC to close | ✅ Direct reuse |
| `PerformanceRanking` | Speed comparison bar chart | ✅ Useful for analytics |
| `StatsHeader` | Avg duration, total cost, fastest model | ✅ Nice stats display |
| `HistoricalChart` | Track performance over time | 🔶 Nice-to-have |
| `SignInModal` | Auth prompt with OAuth | 🔶 We use Clerk |
| `LimitReachedModal` | Usage limit warning | ✅ Adapt for credits |
| `UserMenu` | Avatar dropdown with logout | 🔶 We have our own |

---

### 🚀 Can We Reuse This for a Mini App?

### **Yes! Here's Why:**

#### 1. **Model Comparison Feature** (New Value-Add)

This enables a **unique feature we don't currently have**: letting users compare which model works best for their prompt before committing credits.

```tsx
// Potential "Model Comparison" mode
<ModelComparisonTool 
  models={["nano-banana", "flux-schnell", "seedream"]} 
  prompt="A cyberpunk city at night"
/>
// → Shows 3 images side-by-side, user picks favorite
```

#### 2. **Quality/Speed/Cost Tradeoff Selector**

Users could choose based on:
- **Fastest**: FLUX Schnell / SD 1.5 (< 3s)
- **Cheapest**: SD 1.5 / Flux Schnell ($0.002-0.003)
- **Best Quality**: FLUX Pro / Grok 2 ($0.04-0.07)

#### 3. **Parallel Generation Pattern**

The benchmark shows how to fire multiple generations in parallel and handle progressive completion:

```typescript
// Fire all at once, handle as each completes
const promises = MODELS.map(async (model) => {
  const result = await fetch("/api/generate-single", {
    body: JSON.stringify({ prompt, model }),
  })
  return { result, completionTime: performance.now() }
})

// Progressive UI update as each completes
for (const promise of promises) {
  promise.then((data) => {
    setGenerations(prev => [...prev, data])
    setCompletedCount(count => count + 1)
  })
}

await Promise.all(promises)
```

---

### 🎯 How We Could Use This

#### Option A: Full Benchmark Mini App (8-10 hours)

Create a "Model Comparison" tool for power users:

| Feature | Effort |
|---------|--------|
| Copy benchmark UI (ImageGrid, StatsHeader) | 2 hours |
| Adapt to use Convex actions | 2 hours |
| Add 3 models (Nano Banana, Seedream, FLUX) | 2 hours |
| Credit system integration | 1 hour |
| Analytics (optional) | 2 hours |

**Why**: Users can test which model works best before committing to full video generation.

#### Option B: "Compare Models" Mode in Image Generator (3-4 hours)

Add a toggle to the Image Generator:
- **Single model**: Generate 1 image (default)
- **Compare 3 models**: Generate 3 images, pick favorite

| Feature | Effort |
|---------|--------|
| Add model selector/toggle | 1 hour |
| Parallel generation logic | 1 hour |
| Side-by-side comparison UI | 1.5 hours |
| Credit multiplier (3x) | 0.5 hour |

**Why**: Low effort, high value. Users see quality differences instantly.

#### Option C: Extract UI Components Only (1-2 hours)

Just take the useful parts without building a full benchmark:

| Component | Use Case |
|-----------|----------|
| `ImageGrid` | Better image gallery display |
| `ImageModal` | Consistent fullscreen viewer |
| `StatsHeader` | Show generation stats |
| `PerformanceRanking` | If we want analytics |

---

### 📊 Benefits Summary

| Benefit | Impact |
|---------|--------|
| **User trust** | See model differences before paying for video |
| **Model discovery** | Help users find best model for their style |
| **Power user appeal** | Advanced users love comparison tools |
| **Differentiation** | Unique feature vs competitors |
| **Educational** | Shows AI model capabilities |

### ⚠️ Considerations

| Consideration | Mitigation |
|---------------|------------|
| Higher credit cost (3x per comparison) | Clear pricing warning, make it opt-in |
| New API providers (Prodia, xAI) | Start with just Fal AI models we already have |
| Backend complexity | Already have multi-model support pattern in `imageGeneration.ts` |
| Mobile UX for grid | ImageGrid component is already responsive |

---

### 🏆 Recommendation

**Priority: Nice-to-Have (Future Enhancement)**

| Now | Later |
|-----|-------|
| Focus on Image Generator + Scene Generator first | Add "Compare Models" mode once basics work |
| Keep benchmark code as reference | Extract specific components as needed |

**If building comparison mode:**
- Start with Option B (3-4 hours) - Compare toggle in Image Generator
- Use only models we already have (Nano Banana, Seedream)
- Skip the analytics/history features initially

### Time Estimate

| Approach | Hours |
|----------|-------|
| Full Benchmark App | 8-10h |
| Compare Mode Toggle | 3-4h |
| Extract Components Only | 1-2h |

### Complexity: 🟡 MEDIUM

---

## Bonus Analysis: AI Ad Creator

### What Is It?

**File Location**: `docs/example/AI Ad Creator.md`

A complete **video ad creation pipeline** that generates professional 8-second video ads in 4 steps:

1. **User Input**: Describe product + select visual style
2. **AI Storyboard**: Claude Sonnet generates 3-scene narrative with timing, camera, audio
3. **Keyframe Generation**: Nano Banana creates 3 consistent reference images
4. **Video Generation**: Veo 3.1 produces final 8-second video with audio

### Complete Feature Set

```
AI Ad Creator (Complete Pipeline)
├── Input Step
│   ├── Product description textarea
│   ├── Visual style selector (Luxury, Minimal, Retro, Cinematic, Direct-to-Camera)
│   └── Generate button
├── Storyboard Step
│   ├── 3-scene storyboard with timing ([00:00-00:03], [00:03-00:06], [00:06-00:08])
│   ├── Editable scene descriptions
│   ├── Per-scene keyframe images (Nano Banana)
│   ├── Regenerate individual keyframes
│   ├── Upload custom keyframe images
│   ├── Brand consistency via seed image propagation
│   └── Progress bar with status messages
├── Video Step
│   ├── Video generation with Veo 3.1
│   ├── Progress bar (estimated 2 min)
│   ├── Video player with playback controls
│   └── Download/share options
└── Technical Features
    ├── Apple-inspired dark UI design
    ├── Fully responsive (mobile + desktop)
    ├── Skeleton loading states
    ├── Error handling with retry
    └── Demo mode with preloaded content
```

### Models Used

| Model | Purpose | Cost |
|-------|---------|------|
| **Claude Sonnet 4.5** | Storyboard generation | ~$0.01 |
| **Nano Banana** | Keyframe images (3x) | ~$0.12 |
| **Veo 3.1** | 8-second video | ~$0.50-1.00 |
| **Total** | Per video ad | **~$0.63-1.13** |

---

### 🚀 Can We Reuse This for a Mini App?

### **YES! This is the Most Valuable Example** ✅

#### Why This Is Extremely Relevant:

| Reason | Description |
|--------|-------------|
| **Same workflow as MyShortReel** | Storyboard → Images → Video is exactly our pattern |
| **Complete end-to-end pipeline** | From prompt to final video in one flow |
| **Keyframe chaining pattern** | Uses first image as seed for subsequent images (consistency) |
| **Scene-based architecture** | Same as our scenes with start/end frames |
| **Regeneration support** | Edit and regenerate individual keyframes |
| **Custom upload support** | Upload your own images as keyframes |
| **Professional prompting** | Detailed prompt engineering for Claude storyboard |

---

### 🎯 Implementation Options

#### Option A: "Quick Ad" Mini App (10-12 hours)

A **simplified version** of our guided flow for quick video creation:

| Feature | Source | Adaptation |
|---------|--------|------------|
| Product description + style | Ad Creator input step | Simplify to prompt + optional style |
| 3-scene storyboard | Claude prompt engineering | Use our existing prompt patterns |
| Keyframe generation | `imageGeneration.ts` | Already have |
| Video generation | `videoGeneration.ts` | Already have |
| UI Components | Ad Creator components | Adapt to our design system |

**Benefit**: Quick 8-second ads without full project setup.

#### Option B: Extract Key Patterns (6-8 hours)

Take the most valuable patterns to **enhance Scene Generator**:

| Pattern | Value | Effort |
|---------|-------|--------|
| **Seed image propagation** | Consistent keyframes | 2 hours |
| **Storyboard prompting** | Better scene descriptions | 2 hours |
| **Editable scene descriptions** | User control | 1 hour |
| **Progress bar with stages** | Better UX | 1 hour |
| **Upload custom keyframes** | Already have | 0.5 hours |
| **Demo mode** | Onboarding | 1 hour |

#### Option C: UI Components Only (2-3 hours)

Extract reusable UI patterns:

| Component | Description |
|-----------|-------------|
| Step-based wizard UI | Input → Storyboard → Video |
| Style selector cards | Visual style selection |
| Keyframe editor card | Image + description + actions |
| Progress with stages | Storyboard phase → Image phase → Video phase |

---

### 🔗 How It Maps to Our Existing Code

| Ad Creator Feature | MyShortReel Equivalent | Status |
|--------------------|------------------------|--------|
| Product description | Scene/project description | ✅ Have |
| Style selector | Scene mood/style | 🔶 Could add |
| Claude storyboard | GPT-4 scene expansion | ✅ Have |
| Nano Banana keyframes | `imageGeneration.ts` | ✅ Have |
| Seed image chaining | Not implemented | 🔶 **New value** |
| Custom keyframe upload | Asset upload flow | ✅ Have |
| Veo 3.1 video | Kling v2.5 video | ✅ Have (different model) |
| Video player | VideoGenerator component | ✅ Have |

### Key New Value: **Seed Image Chaining**

The Ad Creator uses a **brand consistency pattern** we don't currently implement:

```typescript
// Scene 1: Generate without seed (creates brand identity)
const openingHookImage = await generateImage(scene1.prompt)
setSeedImageUrl(openingHookImage)

// Scene 2: Use Scene 1 as seed (maintains consistency)
const productShowcaseImage = await generateImage(scene2.prompt, { seedImage: openingHookImage })

// Scene 3: Use Scene 2 as seed (continues consistency)
const closingImage = await generateImage(scene3.prompt, { seedImage: productShowcaseImage })
```

**Result**: All 3 keyframes maintain consistent colors, lighting, style, and product appearance.

---

### 📊 Benefits Summary

| Benefit | Impact | Priority |
|---------|--------|----------|
| **Seed image chaining** | Much better visual consistency in videos | ⭐ HIGH |
| **Quick video creation** | Lower barrier to entry | ⭐ HIGH |
| **Professional storyboard prompts** | Better scene descriptions | MEDIUM |
| **Step-based wizard UI** | Cleaner user journey | MEDIUM |
| **Style presets** | Easier creative direction | LOW |

---

### 🏆 Recommendations

#### For Scene Generator Enhancement (Priority)

Add **seed image chaining** to improve video consistency:

```typescript
// In videoGeneration action, pass previous frame as reference
const generateWithConsistency = async (scenes: Scene[]) => {
  let previousFrame = null
  for (const scene of scenes) {
    const frame = await generateImage(scene.prompt, { seedImage: previousFrame })
    previousFrame = frame
    scene.startFrame = frame
  }
}
```

**Effort**: 2-3 hours | **Impact**: HIGH

#### For Future Mini App

Consider building "Quick Video" mode using Ad Creator patterns:

| Phase | Description | Hours |
|-------|-------------|-------|
| Phase 1 | Single-scene video generator | 4-5h |
| Phase 2 | Add multi-scene with chaining | 3-4h |
| Phase 3 | Add style presets | 2-3h |
| **Total** | Full Quick Ad Mini App | 10-12h |

---

### Time Estimates

| Approach | Hours | Recommended? |
|----------|-------|--------------|
| Full "Quick Ad" Mini App | 10-12h | 🔶 Future |
| Scene Generator Enhancement (seed chaining) | 2-3h | ⭐ **YES** |
| Extract UI Components Only | 2-3h | Optional |
| Style Presets Feature | 2-3h | Nice-to-have |

### Complexity: 🟡 MEDIUM

---

## 🎯 Quick Video Mini App (MUST HAVE)

### Vision

Create a **simplified video creation pipeline** in ONE mini app:
- User selects occasion within the app (no separate pages)
- 3-step wizard: Input → Review Keyframes → Video Ready
- Output: ONE continuous 10-second video

### How It Works: 3 Keyframes → ONE Video

```
3 Reference Images → Kling v2.5 → ONE 10-second Video

| Keyframe 1 (0-3s)  |
| Keyframe 2 (3-6s)  | → ONE continuous 10s video with smooth transitions
| Keyframe 3 (6-10s) |
```

The 3 keyframes are **visual references** that guide the AI video model. The output is ONE seamless video.

### Architecture: Single Page App

```
/tools/quick-video/
├── page.tsx                     ← Quick Video mini app
├── components/
│   ├── QuickVideoWizard.tsx    ← Main 3-step wizard
│   ├── OccasionSelector.tsx    ← Step 1: Select occasion
│   ├── DetailsForm.tsx         ← Step 1: Event details
│   ├── KeyframeEditor.tsx      ← Step 2: View/edit 3 keyframes
│   └── VideoResult.tsx         ← Step 3: Final video player
└── hooks/
    └── useQuickVideo.ts        ← Orchestrates the pipeline
```

**Optional deep links for marketing**: `/tools/quick-video?occasion=wedding`

### Quick Video Wizard Flow (3 Steps)

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Tell Us About It                                        │
├─────────────────────────────────────────────────────────────────┤
│ • Select Occasion (Wedding, Birthday, Anniversary, etc.)        │
│ • Brief description (event name + key details)                  │
│ • Optional: Event date, location                                │
│ → Click "Generate" → AI creates storyboard + 3 keyframes        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Review 3 Keyframes                                      │
├─────────────────────────────────────────────────────────────────┤
│ • See 3 keyframes (generated with seed chaining for consistency)│
│ • Each keyframe shows: Image + Timing + Description             │
│ • Actions per keyframe:                                         │
│   - 🔄 Regenerate                                               │
│   - ✏️ Edit prompt                                              │
│   - 📤 Upload custom image                                      │
│ → Click "Generate Video"                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Your Video is Ready!                                    │
├─────────────────────────────────────────────────────────────────┤
│ • Video player with ONE 10-second video                         │
│ • Download button                                               │
│ • Share options                                                 │
│ • "Create Another" button                                       │
└─────────────────────────────────────────────────────────────────┘
```

### The 8 Occasions (Built-in Selector)

| Occasion | Theme Preset | Use Case |
|----------|--------------|----------|
| **Wedding** | Romantic + Cinematic | Save the Date |
| **Birthday** | Joyful + Colorful | Party Invite |
| **Anniversary** | Nostalgic + Warm | Celebration |
| **Baby Shower** | Tender + Soft | Announcement |
| **Graduation** | Motivational + Inspirational | Achievement |
| **Corporate** | Professional + Modern | Event Promo |
| **Holiday** | Festive + Seasonal | Greeting Card |
| **Engagement** | Romantic + Elegant | Announcement |

### Comparison: Guided Flow vs Quick Video

| Aspect | Guided Flow (Current) | Quick Video Mini App |
|--------|----------------------|---------------------|
| Steps | 6 main + 2 sub-steps | **3 steps** |
| Time to create | 15-30 minutes | **2-5 minutes** |
| Customization | Very detailed | Simplified |
| Narration | Full TTS + script | None (music only) |
| Music | Custom selection | Auto-selected |
| Target user | Want full control | Want fast results |
| Credit cost | 45-65+ credits | ~25-30 credits |

### Seed Image Chaining (Built-In)

Each keyframe uses the previous one as reference for visual consistency:

```typescript
const generateKeyframes = async (storyboard: Storyboard) => {
  // Frame 1: No seed (establishes visual style)
  const frame1 = await generateImage({ prompt: scene1.prompt });
  
  // Frame 2: Uses Frame 1 as seed (maintains consistency)
  const frame2 = await generateImage({ 
    prompt: scene2.prompt, 
    seedImage: frame1.url 
  });
  
  // Frame 3: Uses Frame 2 as seed (continues consistency)
  const frame3 = await generateImage({ 
    prompt: scene3.prompt, 
    seedImage: frame2.url 
  });
  
  return [frame1, frame2, frame3];
};
```

**Result**: All 3 keyframes have consistent colors, style, and lighting!

### Time Estimate

| Component | Hours |
|-----------|-------|
| 3-step wizard UI | 4-5h |
| Occasion selector + presets | 2h |
| Keyframe editor (view/edit/regenerate/upload) | 3-4h |
| Seed image chaining | 1-2h |
| Video result + download | 1h |
| **TOTAL** | **10-12h** |

### Priority: ⭐ **P1 - MUST HAVE**

---

## Mini App 4: Music Generator (Text-to-Music)

### Purpose
Standalone page where users can generate custom background music or songs from text descriptions without creating a full video project.

### 🎁 Reference Implementation: v0 Theme Song Generator

**File Location**: `docs/example/v0 Theme Song Generator.txt`

This provides a **complete music generation UI** using ElevenLabs, but we'll adapt it to use **fal.ai's text-to-audio models** (already integrated!).

### fal.ai Text-to-Audio Models (Ready to Use)

From [fal.ai/explore/search?categories=text-to-audio](https://fal.ai/explore/search?categories=text-to-audio):

| Model | Endpoint | Use Case | Recommended |
|-------|----------|----------|-------------|
| **MiniMax Music 2.0** | `minimax-music/v2` | High-quality music from prompts | ⭐ Primary |
| **Sonauto v2** | `sonauto/v2/text-to-music` | Full songs in any style | ⭐ Alternative |
| **Google Lyria 2** | `lyria2` | Google's latest music model | 🔶 Premium |
| **Beatoven Music** | `beatoven/music-generation` | Royalty-free instrumental | 🔶 Budget |
| **Stable Audio 2.5** | `stable-audio-25/text-to-audio` | Music + SFX | ✅ Already integrated |
| **ACE-Step** | `ace-step/prompt-to-audio` | Simple prompt-to-music | 🔶 Simple |

### Key Features from Theme Song Generator

| Feature | Description | Reusability |
|---------|-------------|-------------|
| **Genre selector** | 13 genres (electro-pop, synthwave, house, jazz, etc.) | ✅ Copy directly |
| **Mood tags** | Add/remove mood badges (confident, energetic, dreamy...) | ✅ Copy directly |
| **BPM slider** | 60-180 BPM control | ✅ Copy directly |
| **Duration slider** | 10-300 seconds | ✅ Copy directly |
| **Key signature** | C major, A minor, etc. | 🔶 Optional |
| **Vocals toggle** | Instrumental only or with vocals | 🔶 Model-dependent |
| **Production notes** | Extra style instructions | ✅ Copy directly |
| **Audio player** | Play, pause, seek, volume | ✅ Copy directly |
| **Session history** | Multiple tracks in one session | ✅ Copy directly |
| **Download button** | Download MP3 | ✅ Copy directly |
| **"Surprise Me"** | Random preset generator | ✅ Copy directly |

### Architecture

```
/tools/music-generator/
├── page.tsx                     ← Music Generator mini app
├── components/
│   ├── MusicGenerator.tsx       ← Main component
│   ├── GenreSelector.tsx        ← Genre dropdown
│   ├── MoodTags.tsx             ← Add/remove mood badges
│   ├── MusicControls.tsx        ← BPM, duration, key sliders
│   ├── AudioPlayer.tsx          ← Play/pause/seek/volume
│   └── SessionHistory.tsx       ← Track history sidebar
└── hooks/
    └── useMusicGeneration.ts    ← Convex action integration
```

### Implementation Strategy

| Source | Target | Adaptation |
|--------|--------|------------|
| `ThemeSongGenerator.tsx` | `components/tools/MusicGenerator.tsx` | Apply design system, Convex integration |
| Genre/Mood selection | Reuse directly | Apply color tokens |
| Audio player controls | Reuse directly | Minor styling |
| `app/api/music/compose/route.ts` | **Not needed** | Use Convex action with fal.ai |

### Backend: New Convex Action

```typescript
// convex/actions/musicGeneration.ts
export const generateMusic = action({
  args: {
    prompt: v.string(),           // "upbeat electro-pop song, energetic, 120 BPM"
    duration: v.optional(v.number()), // In seconds (default 30)
    model: v.optional(v.string()),    // Default: "minimax-music/v2"
  },
  handler: async (ctx, args) => {
    const { prompt, duration = 30, model = "fal-ai/minimax-music/v2" } = args;
    
    const result = await fal.subscribe(model, {
      input: {
        prompt,
        duration_seconds: duration,
      },
    });
    
    // Upload to Convex storage
    const audioBlob = await downloadAudio(result.audio.url);
    const storageId = await ctx.storage.store(audioBlob);
    const url = await ctx.storage.getUrl(storageId);
    
    return { success: true, audioUrl: url, storageId };
  },
});
```

### Credit Cost Estimation

| Model | Estimated Cost | Credits |
|-------|----------------|---------|
| MiniMax Music v2 | ~$0.05-0.10/30s | 5-10 credits |
| Sonauto v2 | ~$0.03-0.05/30s | 3-5 credits |
| Stable Audio 2.5 | ~$0.02-0.03/30s | 2-3 credits |

### What We Already Have

1. ✅ **fal.ai integration** - Already set up in `convex/actions/`
2. ✅ **Credit system** - `useCredits` hook + `InsufficientCreditsModal`
3. ✅ **File storage** - Convex storage for audio files
4. ✅ **UI components** - All from `components/ui/`

### New Code Required

| Task | Effort | Description |
|------|--------|-------------|
| Convex action for music | 2h | New `musicGeneration.ts` with fal.ai models |
| Copy & adapt UI from Theme Song Generator | 3h | Genre, mood, controls, player |
| Page route | 15 min | `app/[locale]/tools/music-generator/page.tsx` |
| Audio player component | 1.5h | Play/pause/seek/volume (from example) |
| Session history | 1h | Track multiple generations |
| Style integration | 1h | Apply MyShortReel design system |
| Credits integration | 0.5h | Add credit check and display |

### Time Estimate

| Component | Hours |
|-----------|-------|
| Convex action (new model endpoints) | 2h |
| Copy & adapt Theme Song Generator UI | 3-4h |
| Audio player component | 1.5h |
| Session history sidebar | 1h |
| Credits integration | 0.5h |
| Design system styling | 1h |
| **TOTAL** | **7-9h** |

### Complexity: 🟡 MEDIUM

### Comparison to Existing Music Generation

| Aspect | Current (Guided Flow) | Music Generator Mini App |
|--------|----------------------|--------------------------|
| **Access** | Part of video project | Standalone tool |
| **Control** | Limited presets | Full control (genre, mood, BPM) |
| **Output** | Background music only | Downloadable audio file |
| **Models** | Stable Audio 2.5 only | Multiple models (MiniMax, Sonauto, etc.) |
| **Use case** | Video background | Any: video, podcast, personal |

### Potential Enhancements (Future)

| Feature | Effort | Description |
|---------|--------|-------------|
| **Lyrics input** | 2h | Some models support lyrics (Sonauto) |
| **Reference audio** | 2h | Upload audio to match style |
| **Section editor** | 3h | Intro → Verse → Chorus structure |
| **Model comparison** | 2h | Compare 2-3 models side-by-side |

### Priority: ⭐ **P4 - Nice to Have**

Why P4? 
- Users can create videos with auto-selected music already
- Custom music adds value but isn't blocking the core workflow
- Can be added after the main 3 mini apps are complete

---

## Shared Requirements

### 🔄 REVISED (Simplified Approach)

With the playground example, we get mobile responsiveness and error handling for free.

| Task | Effort | Description |
|------|--------|-------------|
| Tools landing page | 45 min | `/tools` with cards linking to each app |
| Credits header component | 30 min | Reuse from guided flow |
| Page layout wrapper | 30 min | Simple shared layout |
| Standalone Convex action | 1 hour | Make `imageGeneration.ts` work without sceneId |
| Basic routing | 15 min | Add pages under `/tools/` |

### Shared Total: **3-4 hours** ⚡

### Design System & Mobile-First Checklist

Before completing any mini app, verify:

#### Design System (`docs/Guides/design-system.md`)
- [ ] Uses semantic color tokens (`bg-card`, not `bg-gray-800`)
- [ ] Text is readable (proper contrast with background)
- [ ] Typography uses `leading-relaxed` for body text
- [ ] Uses `rounded-lg` for cards (--radius: 0.75rem)
- [ ] Buttons use proper variants (`variant="default"`, `variant="secondary"`)

#### Mobile-First (`docs/Best-Practices/mobile-first-best-practices.md`)
- [ ] Wrapped in `DeviceProvider` (from guided layout)
- [ ] Touch targets ≥ 44x44px (`min-h-[44px]`)
- [ ] Form inputs ≥ 48px height (`min-h-[48px]`)
- [ ] Mobile-first responsive classes (`p-4 md:p-6 lg:p-8`)
- [ ] Uses `AdaptiveModal` for overlays
- [ ] Works at 320px, 375px, 768px, 1024px+

### Optional Enhancements (Future Sprint):

| Task | Effort | Description |
|------|--------|-------------|
| "My Gallery" page | 2 hours | View/manage generated images |
| Standalone asset storage | 1 hour | Assets without projectId |
| Generation history | 1 hour | Persist across sessions (already in playground) |

---

## Time Estimation Summary

### 🔄 REVISED ESTIMATES (with Playground Example)

| Mini App | Original | Revised | Notes |
|----------|----------|---------|-------|
| **Image Generator** | 4-5h | **2-3h** ⚡ | Copy-paste from playground |
| **Image Editor** | 6-7h | **+1-2h** ⚡ | Same component, different mode |
| **Combined Image Tool** | 10-12h | **3-4h** ⚡ | Both modes in one |
| **Scene Generator** | 8-10h | **6-8h** | Reuse existing VideoGenerator |
| **Shared Infrastructure** | 6-7h | **3-4h** | Less work, simpler approach |

### Grand Total: **20-25 hours** (for all four mini apps)

**Savings: ~50% reduction** thanks to the reference examples!

### Optional Future Enhancement

| Feature | Hours | Notes |
|---------|-------|-------|
| **Model Comparison Mode** | 3-4h | Compare 2-3 models side-by-side |
| **Full Benchmark App** | 8-10h | Multi-model comparison tool |

*(See [Bonus Analysis: AI Image Benchmark](#bonus-analysis-ai-image-generation-benchmark) for details)*

### Fastest Path (Recommended):

| Approach | Hours |
|----------|-------|
| **Combined Image Tool (Gen + Edit)** | 3-4h |
| **Scene Generator** | 6-8h |
| **Shared (tools page, credits header)** | 2-3h |
| **TOTAL** | **11-15h** |

### Per-App Standalone:

| If Building Only | Hours |
|-----------------|-------|
| Image Generator alone | 4-5h (including shared) |
| Combined Image Tool | 5-6h (including shared) |
| Scene Generator alone | 8-10h (including shared) |

---

## Implementation Approach

### Recommended Strategy: Copy + Adapt from Playground

**Source File**: `docs/example/Nano Banana Pro Playground code example.md`

#### Phase 1: Setup (1 hour)

```
1. Create /tools route structure
2. Add ToolsLayout with credits header (reuse from guided flow)
3. Create tools landing page with cards
4. Wrap in DeviceProvider for mobile detection
```

#### Phase 2: Combined Image Tool (3-4 hours)

```
1. Copy from playground:
   - components/image-combiner/index.tsx → components/tools/ImageTool.tsx
   - components/image-combiner/input-section.tsx → components/tools/ImageInputSection.tsx
   - components/image-combiner/output-section.tsx → components/tools/ImageOutputSection.tsx
   - hooks/use-image-generation.ts → hooks/tools/useImageGeneration.ts
   - hooks/use-aspect-ratio.ts → hooks/tools/useAspectRatio.ts
   - types.ts, constants.tsx → Copy directly

2. Apply MyShortReel Design System:
   - Replace #000000 → bg-background (#101a23)
   - Replace #111111 → bg-secondary (#223649)
   - Replace #333333 borders → border-border
   - Use text-foreground, text-muted-foreground
   - Add rounded-lg (--radius: 0.75rem)

3. Apply Mobile-First Patterns:
   - Wrap in DeviceProvider
   - Use min-h-[44px] for all buttons
   - Use min-h-[48px] for inputs
   - Add responsive padding: p-4 md:p-6 lg:p-8
   - Use AdaptiveModal for fullscreen viewer on mobile

4. Integrate with Convex:
   - Replace fetch('/api/generate-image') → useAction(api.actions.imageGeneration)
   - Add useCredits hook for credit management
   - Add InsufficientCreditsModal
```

#### Phase 3: Scene Generator (6-8 hours)

```
1. Extract VideoGenerator core logic
2. Add standalone frame selection (reuse AssetSelector)
3. Connect to existing video generation action
4. Apply same design system and mobile-first patterns
```

### File Structure

```
app/[locale]/tools/
├── page.tsx                    # Tools landing page with cards
├── layout.tsx                  # Shared layout with credits header
├── image/
│   └── page.tsx               # Combined text-to-image + image-editing
└── video/
    └── page.tsx               # Video/scene generation

components/tools/
├── ToolsLayout.tsx            # Credits header + navigation
├── ImageTool.tsx              # Adapted from playground ImageCombiner
├── ImageInputSection.tsx      # From playground input-section
├── ImageOutputSection.tsx     # From playground output-section
└── VideoTool.tsx              # Adapted from VideoGenerator
```

### Key Files to Copy from Playground

**Source**: `docs/example/Nano Banana Pro Playground code example.md`

This file contains a complete directory structure with all code embedded. Extract the following:

| Playground Path | Target Path | Adaptation |
|-----------------|-------------|------------|
| `components/image-combiner/index.tsx` | `components/tools/ImageTool.tsx` | Remove Dithering shader, apply design system |
| `components/image-combiner/input-section.tsx` | `components/tools/ImageInputSection.tsx` | Apply design tokens |
| `components/image-combiner/output-section.tsx` | `components/tools/ImageOutputSection.tsx` | Apply design tokens |
| `components/image-combiner/progress-bar.tsx` | `components/tools/ProgressBar.tsx` | Use existing Progress from ui/ |
| `components/image-combiner/fullscreen-viewer.tsx` | Use `AdaptiveModal` | Mobile-first approach |
| `components/image-combiner/types.ts` | `components/tools/types.ts` | Copy directly |
| `components/image-combiner/constants.tsx` | `components/tools/constants.tsx` | Copy directly |
| `hooks/use-image-generation.ts` | `hooks/tools/useImageGeneration.ts` | Replace fetch with Convex useAction |
| `hooks/use-aspect-ratio.ts` | `hooks/tools/useAspectRatio.ts` | Copy directly |
| `hooks/use-image-upload.ts` | `hooks/tools/useImageUpload.ts` | Use existing useFileUpload |
| `app/api/generate-image/route.ts` | **Not needed** | Use existing `convex/actions/imageGeneration.ts` |

### Playground API → Convex Action Mapping

```tsx
// Playground uses Next.js API route:
const response = await fetch('/api/generate-image', {
  method: 'POST',
  body: formData
})

// MyShortReel uses Convex action:
import { useAction } from "convex/react"
import { api } from "@/convex/_generated/api"

const generateImage = useAction(api.actions.imageGeneration.generateFrameImage)
const result = await generateImage({
  prompt: prompt,
  aspectRatio: aspectRatio,
  // referenceImageUrl for image-editing mode
})
```

---

## Recommended Priority Order

### User Journey: Generate → Edit → Video

```
1. Image Generator  →  User creates images from text
2. Image Editor     →  User refines/edits generated images
3. Quick Video      →  User creates video from their images
```

---

### Priority 1: Image Generator ⚡ (Build First)
- **Why**: Foundation - users need images before they can edit or use for video
- **Effort**: 3-4 hours
- **Value**: HIGH - enables the entire pipeline
- **Risk**: Very low - just adaptation work
- **Strategy**: Copy `ImageCombiner` → swap API to Convex action → add credits
- **Source**: `docs/example/Nano Banana Pro Playground code example.md`

### Priority 2: Image Editor 🎨
- **Why**: Users can edit images they generated (or upload their own)
- **Effort**: 5-8 hours
- **Value**: HIGH - iterative refinement adds value
- **Risk**: Low - clear reference implementation
- **Strategy**: Copy EasyEdit pattern → add version sidebar → Convex integration
- **Source**: `docs/example/EasyEdit example.txt`
- **Connection**: "Use in Editor" button from Image Generator

### Priority 3: Quick Video 🎬
- **Why**: Users can create videos from images they generated/edited
- **Effort**: 10-12 hours
- **Value**: **VERY HIGH** - video is the final deliverable
- **Risk**: Low (reuse existing video generation actions)
- **Strategy**: Build 3-step wizard with occasion selector + seed image chaining
- **Source**: `docs/example/AI Ad Creator.md`
- **Connection**: "Use in Video" button from Image Generator/Editor

### Priority 4: Music Generator 🎵
- **Why**: Custom audio adds final polish to videos
- **Effort**: 7-9 hours
- **Value**: MEDIUM - nice-to-have, auto music works for most users
- **Risk**: Low - fal.ai already integrated
- **Strategy**: Copy Theme Song Generator UI → adapt to fal.ai models
- **Source**: `docs/example/v0 Theme Song Generator.txt`
- **Connection**: "Use in Video" to add custom music track

### Priority 5: Referral System 🎁
- **Why**: Viral growth loop, users share to earn credits
- **Effort**: 15-18 hours
- **Value**: **HIGH** - cheapest acquisition channel
- **Risk**: Low - well-documented pattern, reuses existing components
- **Strategy**: Build after core mini-apps work, integrate with Clerk sign-up
- **Source**: `docs/example/magic referral.txt`
- **Key Feature**: Magic Card Generator reuses existing image generation!

### Priority 6: Model Comparison Mode (Future) 🔮
- **Why**: Unique differentiator, power user appeal
- **Effort**: 3-4 hours (as toggle in Image Generator)
- **Value**: Medium - helps users pick best model
- **Risk**: Very low - only adds to existing tool
- **Strategy**: Add after Image Generator works, use AI Image Benchmark patterns
- **Source**: `docs/example/AI Image Generation Benchmark.md`

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Credit abuse on standalone tools | Same credit system, same limits |
| Storage bloat from standalone assets | Add expiration for non-project assets |
| Video polling complexity | Reuse existing hooks directly |
| Mobile UX for video tools | Test thoroughly on mobile |
| Translation completeness | Add keys incrementally |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to first mini app (Image Tool) | **< 4 hours** ⚡ |
| Both mini apps complete | **< 12 hours** ⚡ |
| Code reuse percentage | > 85% |
| New lines of code | < 500 |
| New Convex actions | 0 (modify existing) |

---

## Conclusion

**Feasibility: ✅ EXTREMELY FEASIBLE**

### Final Feature List (User Journey Order)

| # | Feature | Type | Description | Enables |
|---|---------|------|-------------|---------|
| 1 | **Image Generator** | Mini App | Text → Image | Creates images to edit or use in video |
| 2 | **Image Editor** | Mini App | Image → v1 → v2 → v3... | Refines images for video |
| 3 | **Quick Video** | Mini App | 3 keyframes → ONE 10s video | Final deliverable |
| 4 | **Music Generator** | Mini App | Text → Music | Custom audio for videos |
| 5 | **Referral System** | Growth | Share → Earn credits | Viral growth loop |

### User Journey Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Image Generator │ ──→ │  Image Editor   │ ──→ │   Quick Video   │ ──→ │ Music Generator │ ──→ │ Referral System │
│   (Create)      │     │    (Refine)     │     │   (Animate)     │     │   (Audio)       │     │   (Share)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
     Text → Image         Image → v1 → v2        3 images → Video        Text → Music          Invite → Credits
```

### Why This Is a ~5-7 Day Project

1. **Complete Reference Examples**:
   - `Nano Banana Pro Playground` → Image Generator
   - `EasyEdit` → Image Editor (iterative editing with versions)
   - `AI Ad Creator` → Quick Video (3 keyframes → 1 video pattern)
   - `v0 Theme Song Generator` → Music Generator (UI patterns)
   - `magic referral` → Referral System (share links, tiers, visual invites)

2. **Existing Backend** - Minimal new actions needed:
   - `imageGeneration.ts` already uses Nano Banana Pro
   - `videoGeneration.ts` already uses Kling v2.5
   - fal.ai already integrated (add new music model endpoints)
   - Credit system ready for referral rewards
   - Just add seed image parameter for editing/chaining

3. **Reuse + Adapt Strategy**:
   - Copy playground/easyedit/ad-creator/themesong/referral components
   - Swap `fetch` → `useAction` (Convex)
   - Add credit system integration
   - Apply our design system

### Final Total Estimates

| Deliverable | Hours | Priority |
|-------------|-------|----------|
| **Image Generator** | 3-4h | ⭐ P1 - Build first |
| **Image Editor** | 5-8h | ⭐ P2 - Edit generated images |
| **Quick Video** | 10-12h | ⭐ P3 - Use images for video |
| **Music Generator** | 7-9h | ⭐ P4 - Custom audio for video |
| **Referral System** | 15-18h | ⭐ P5 - Viral growth after core |
| **Shared Infrastructure** | 2-3h | P1 |
| **GRAND TOTAL** | **42-54h** | (~5-7 days) |

### Implementation Order

```
Day 1:   Image Generator (Foundation)
         ├── Copy from Nano Banana Playground
         ├── Text-to-image generation
         └── "Use in Editor" / "Use in Video" buttons

Day 2:   Image Editor
         ├── Copy EasyEdit pattern
         ├── Version history sidebar (v0 → v1 → v2...)
         ├── AI suggestions (optional)
         └── "Use in Video" button

Day 3-4: Quick Video Mini App
         ├── 3-step wizard
         ├── Occasion selector (8 options)
         ├── Import from Image Generator/Editor
         ├── Keyframe editor (view/edit/regenerate/upload)
         └── Seed image chaining for consistency

Day 5:   Music Generator (Optional Enhancement)
         ├── Copy from Theme Song Generator
         ├── Genre, mood, BPM controls
         ├── Audio player with session history
         └── Multiple fal.ai model support

Day 6-7: Referral System (Growth Feature)
         ├── Backend: Referral schema + tracking
         ├── Frontend: ReferralLinkCard + MagicCardGenerator
         ├── Frontend: ReferralStatsCard + tier progress
         ├── Clerk integration for sign-up tracking
         └── Dashboard navigation integration
```

### The 4 Mini Apps + 1 Growth Feature

| Feature | Type | Key Feature | Reference | Output |
|---------|------|-------------|-----------|--------|
| **Image Generator** | Mini App | Text → Image | Nano Banana Playground | Image file |
| **Image Editor** | Mini App | v0 → v1 → v2... | EasyEdit | Refined image |
| **Quick Video** | Mini App | 3 images → Video | AI Ad Creator | 10s video |
| **Music Generator** | Mini App | Text → Music | v0 Theme Song Generator | Audio file |
| **Referral System** | Growth | Share → Earn | magic referral | Credits + virality |

---

**Document Version**: 10.0  
**Last Updated**: December 20, 2025  
**Revision History**:
- v10.0: Added Referral System as growth feature (viral loop, Magic Cards, tiers)
- v9.0: Added Music Generator as 4th mini app (fal.ai text-to-audio models)
- v8.0: Reordered priorities based on user journey (Generate → Edit → Video)
- v7.0: Added Image Editor mini app (iterative editing from EasyEdit)
- v6.0: Simplified to 2 mini apps with built-in occasion selector
- v5.0: Added Quick Video Mini App + Occasion Templates
- v4.0: Added AI Ad Creator analysis (seed image chaining)
- v3.0: Added AI Image Generation Benchmark analysis
- v2.0: Added Nano Banana Pro Playground analysis
- v1.0: Initial feasibility analysis
  
**Author**: MyShortReel Development Team


