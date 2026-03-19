# 🎨 Multi-Model Tier Implementation Plan

**Created**: December 19, 2025
**Status**: Planning
**Priority**: High
**Estimated Effort**: 60-80 hours

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Proposed Architecture](#proposed-architecture)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Model Selection Matrix](#model-selection-matrix)
7. [Credit Cost Structure](#credit-cost-structure)
8. [Implementation Phases](#implementation-phases)
9. [Effort Estimation](#effort-estimation)
10. [Risk Assessment](#risk-assessment)
11. [Success Criteria](#success-criteria)

---

## Executive Summary

### Goal
Implement a multi-tier AI model system that allows users to choose between **Low Cost**, **Standard**, and **Premium** quality tiers for:
- **Image Generation** (Text-to-Image)
- **Image Editing** (Image-to-Image)
- **Video Generation** (Image-to-Video)

### Business Value
- **User Choice**: Let users balance quality vs. cost based on their needs
- **Revenue Optimization**: Premium users pay more for higher quality
- **Cost Efficiency**: Budget-conscious users can complete projects affordably
- **Competitive Advantage**: Differentiated offering in the market

### Feasibility Rating: ✅ **HIGH**
The current architecture supports this change with moderate refactoring. The main work is:
- Backend: Model abstraction layer + tier configuration (~40% effort)
- Frontend: Tier selector UI + dynamic credit display (~40% effort)
- Testing & QA: Ensuring all tiers work correctly (~20% effort)

---

## Current State Analysis

### Backend Architecture (convex/actions/)

#### Current Model Handling Pattern

```typescript
// imageGeneration.ts - Uses primary/fallback pattern
const MODELS = {
  textToImage: {
    primary: "fal-ai/nano-banana-pro",
    fallback: "fal-ai/bytedance/seedream/v4/text-to-image",
  },
  imageToImage: {
    primary: "fal-ai/nano-banana-pro/edit",
    fallback: "fal-ai/bytedance/seedream/v4/edit",
  },
};

// videoGeneration.ts - Single hardcoded model
const KLING_MODEL_ID = "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";
```

**Observations**:
1. ✅ Image generation already has a two-model pattern (primary/fallback)
2. ❌ Video generation uses single hardcoded model
3. ❌ No tier concept exists
4. ❌ Credit costs are defined per action, not per tier

#### Current Credit System

```typescript
// Credits are deducted by action type (from creditCosts table)
const VIDEO_GENERATION_CREDITS = 20;  // Hardcoded in frontend
const IMAGE_GENERATION_CREDITS = 5;   // Hardcoded in frontend

// creditCosts table structure:
{
  actionType: "video_generation",  // Single type, no tier
  credits: 20,
  displayName: "Video Generation",
  category: "video",
}
```

**Observations**:
1. ❌ Credits are hardcoded in multiple frontend files
2. ❌ No tier differentiation in credit costs
3. ✅ Credit system is flexible enough to add new action types

### Frontend Architecture (Step 3)

#### Current Implementation

```typescript
// app/[locale]/guided/step-3/page.tsx
const VIDEO_GENERATION_CREDITS = 20;  // Hardcoded

// VideoGenerator.tsx
const VIDEO_GENERATION_CREDITS = 20;  // Duplicated hardcode

// FrameGenerator.tsx
const IMAGE_GENERATION_CREDITS = 5;   // Hardcoded
```

**Observations**:
1. ❌ Credit costs duplicated across 3+ files
2. ❌ No model selection UI
3. ❌ No tier preference storage
4. ✅ Components are well-structured for extension

---

## Proposed Architecture

### 1. Model Configuration Layer

Create a centralized model configuration system:

```typescript
// lib/ai/models/config.ts
export const AI_MODEL_TIERS = {
  image_generation: {
    low: {
      modelId: "fal-ai/bytedance/seedream/v4/text-to-image",
      name: "Seedream v4",
      description: "Fast, cost-effective generation",
      creditCost: 2,
      estimatedTime: "2-5 seconds",
      quality: "Good",
    },
    standard: {
      modelId: "fal-ai/nano-banana-pro",
      name: "Nano Banana Pro",
      description: "High-quality with excellent text rendering",
      creditCost: 5,
      estimatedTime: "8-15 seconds",
      quality: "Excellent",
    },
    premium: {
      modelId: "fal-ai/flux/dev",
      name: "FLUX.1 Dev",
      description: "State-of-the-art photorealistic images",
      creditCost: 10,
      estimatedTime: "15-30 seconds",
      quality: "Premium",
    },
  },
  image_editing: {
    low: {
      modelId: "fal-ai/bytedance/seedream/v4/edit",
      name: "Seedream v4 Edit",
      creditCost: 2,
    },
    standard: {
      modelId: "fal-ai/nano-banana-pro/edit",
      name: "Nano Banana Pro Edit",
      creditCost: 5,
    },
    premium: {
      modelId: "fal-ai/gemini-3-pro/edit", // Placeholder
      name: "Gemini 3 Pro Edit",
      creditCost: 10,
    },
  },
  video_generation: {
    low: {
      modelId: "fal-ai/minimax-video/image-to-video",
      name: "MiniMax Video",
      description: "Fast, budget-friendly video generation",
      creditCost: 10,
      estimatedTime: "30-60 seconds",
      quality: "Good",
    },
    standard: {
      modelId: "fal-ai/kling-video/v2.5-turbo/image-to-video",
      name: "Kling v2.5 Turbo",
      description: "Balanced quality and speed",
      creditCost: 20,
      estimatedTime: "60-120 seconds",
      quality: "Excellent",
    },
    premium: {
      modelId: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
      name: "Kling v2.5 Turbo Pro",
      description: "Highest quality cinematic videos",
      creditCost: 35,
      estimatedTime: "90-180 seconds",
      quality: "Premium",
    },
  },
} as const;

export type ModelCategory = keyof typeof AI_MODEL_TIERS;
export type ModelTier = "low" | "standard" | "premium";
```

### 2. Backend Action Refactoring

#### Option A: Single Action File with Tier Parameter (RECOMMENDED)

```typescript
// convex/actions/imageGeneration.ts
export const generateFrameImage = action({
  args: {
    sceneId: v.id("scenes"),
    frameType: v.union(v.literal("start"), v.literal("end")),
    prompt: v.string(),
    modelTier: v.optional(v.union(
      v.literal("low"),
      v.literal("standard"),
      v.literal("premium")
    )), // Defaults to "standard"
    // ... other args
  },
  handler: async (ctx, args) => {
    const tier = args.modelTier || "standard";
    const modelConfig = getModelConfig("image_generation", tier);
    
    // Use modelConfig.modelId for API call
    const result = await generateWithFal(modelConfig.modelId, params);
    
    // Track with tier-specific credits
    await ctx.runMutation(api.usageTracking.logAIUsage, {
      model: modelConfig.name,
      creditsUsed: modelConfig.creditCost,
      // ...
    });
  },
});
```

**Pros**:
- Less code duplication
- Single point of maintenance
- Easier to add new tiers

**Cons**:
- Slightly more complex action logic
- All tiers share same fallback behavior

#### Option B: Separate Action Files per Model

```
convex/actions/
├── imageGeneration/
│   ├── index.ts           # Re-exports all
│   ├── seedreamV4.ts      # Low tier
│   ├── nanaBananaPro.ts   # Standard tier  
│   └── fluxDev.ts         # Premium tier
├── videoGeneration/
│   ├── index.ts
│   ├── minimaxVideo.ts    # Low tier
│   ├── klingTurbo.ts      # Standard tier
│   └── klingPro.ts        # Premium tier
```

**Pros**:
- Clear separation of concerns
- Model-specific optimizations
- Easier testing per model

**Cons**:
- More files to maintain
- Code duplication
- More complex imports

### Recommendation: **Option A** (Single action with tier parameter)

---

## Backend Implementation

### Phase 1: Model Configuration System

#### 1.1 Create Model Config Types

```typescript
// lib/ai/models/types.ts
export interface ModelConfig {
  modelId: string;
  name: string;
  description: string;
  creditCost: number;
  estimatedTime: string;
  quality: "Good" | "Excellent" | "Premium";
  fallback?: string; // Fallback model ID if primary fails
  parameters?: Record<string, unknown>; // Model-specific defaults
}

export interface ModelCategory {
  low: ModelConfig;
  standard: ModelConfig;
  premium: ModelConfig;
}

export type AIFeature = "image_generation" | "image_editing" | "video_generation";
export type ModelTier = "low" | "standard" | "premium";
```

#### 1.2 Create Model Registry

```typescript
// lib/ai/models/registry.ts
import { AI_MODEL_TIERS, type AIFeature, type ModelTier, type ModelConfig } from "./config";

export function getModelConfig(feature: AIFeature, tier: ModelTier): ModelConfig {
  const config = AI_MODEL_TIERS[feature]?.[tier];
  if (!config) {
    throw new Error(`Unknown model configuration: ${feature}/${tier}`);
  }
  return config;
}

export function getAvailableTiers(feature: AIFeature): ModelTier[] {
  return Object.keys(AI_MODEL_TIERS[feature]) as ModelTier[];
}

export function getCreditCost(feature: AIFeature, tier: ModelTier): number {
  return getModelConfig(feature, tier).creditCost;
}
```

### Phase 2: Update Action Files

#### 2.1 Image Generation Refactor

```typescript
// convex/actions/imageGeneration.ts
import { getModelConfig } from "../../lib/ai/models/registry";

export const generateFrameImage = action({
  args: {
    sceneId: v.id("scenes"),
    frameType: v.union(v.literal("start"), v.literal("end")),
    prompt: v.string(),
    modelTier: v.optional(v.union(
      v.literal("low"),
      v.literal("standard"),
      v.literal("premium")
    )),
    aspectRatio: v.optional(v.string()),
    resolution: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const tier = args.modelTier || "standard";
    const modelConfig = getModelConfig("image_generation", tier);
    
    let result: { images: Array<{ url: string }> };
    let modelUsed = modelConfig.name;
    
    try {
      result = await generateWithFalByTier(tier, {
        prompt: args.prompt,
        aspectRatio: args.aspectRatio || "16:9",
        resolution: args.resolution || "1K",
      });
    } catch (primaryError) {
      // Try fallback if available
      if (modelConfig.fallback) {
        result = await generateWithFal(modelConfig.fallback, { ... });
        modelUsed = `${modelConfig.name} (fallback)`;
      } else {
        throw primaryError;
      }
    }
    
    // ... rest of handler
    return {
      success: true,
      assetId,
      storageId,
      imageUrl: url,
      modelUsed,
      tier,
      creditsUsed: modelConfig.creditCost,
    };
  },
});

// Helper function for tier-specific generation
async function generateWithFalByTier(
  tier: ModelTier,
  params: ImageGenParams
): Promise<FalImageResult> {
  const config = getModelConfig("image_generation", tier);
  
  // Different models have different parameter formats
  switch (tier) {
    case "low": // Seedream v4
      return generateWithFal(config.modelId, {
        prompt: params.prompt,
        image_size: mapAspectRatioToSeedream(params.aspectRatio),
        num_inference_steps: 20,
        guidance_scale: 7.5,
      });
    case "standard": // Nano Banana Pro
      return generateWithFal(config.modelId, {
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio,
        resolution: params.resolution,
        num_images: 1,
      });
    case "premium": // FLUX.1 Dev
      return generateWithFal(config.modelId, {
        prompt: params.prompt,
        image_size: mapAspectRatioToFlux(params.aspectRatio),
        num_inference_steps: 28,
        guidance_scale: 3.5,
      });
    default:
      throw new Error(`Unknown tier: ${tier}`);
  }
}
```

#### 2.2 Video Generation Refactor

```typescript
// convex/actions/videoGeneration.ts
export const generateVideo = action({
  args: {
    sceneId: v.id("scenes"),
    sceneDescription: v.string(),
    startFrameUrl: v.string(),
    endFrameUrl: v.optional(v.string()),
    modelTier: v.optional(v.union(
      v.literal("low"),
      v.literal("standard"),
      v.literal("premium")
    )),
    duration: v.optional(v.number()),
    // ... other args
  },
  handler: async (ctx, args) => {
    const tier = args.modelTier || "standard";
    const modelConfig = getModelConfig("video_generation", tier);
    
    // Build request based on tier/model
    const falInput = buildVideoRequest(tier, {
      prompt: videoPrompt,
      imageUrl: args.startFrameUrl,
      tailImageUrl: args.endFrameUrl,
      duration: args.duration,
    });
    
    // Submit to appropriate model
    const response = await fetch(`https://queue.fal.run/${modelConfig.modelId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${FAL_KEY}`,
      },
      body: JSON.stringify(falInput),
    });
    
    // Update scene with tier info
    await ctx.runMutation(api.scenes.updateVideoGeneration, {
      sceneId: args.sceneId,
      videoGeneration: {
        requestId,
        provider: "fal-ai",
        model: modelConfig.modelId,
        tier, // NEW: Track which tier was used
        // ...
      },
      status: "generating",
    });
    
    return {
      success: true,
      requestId,
      tier,
      creditsUsed: modelConfig.creditCost,
    };
  },
});

function buildVideoRequest(tier: ModelTier, params: VideoGenParams) {
  const config = getModelConfig("video_generation", tier);
  
  switch (tier) {
    case "low": // MiniMax Video
      return {
        prompt: params.prompt,
        image_url: params.imageUrl,
        // MiniMax specific params
      };
    case "standard": // Kling Turbo
      return {
        prompt: params.prompt,
        image_url: params.imageUrl,
        tail_image_url: params.tailImageUrl,
        duration: params.duration === 10 ? "10" : "5",
        cfg_scale: 0.5,
      };
    case "premium": // Kling Turbo Pro
      return {
        prompt: params.prompt,
        image_url: params.imageUrl,
        tail_image_url: params.tailImageUrl,
        duration: params.duration === 10 ? "10" : "5",
        cfg_scale: 0.5,
        // Pro-specific quality settings
      };
  }
}
```

### Phase 3: Credit System Updates

#### 3.1 Update creditCosts Table

Add tier-specific action types:

```typescript
// Seed script or migration
const CREDIT_COSTS = [
  // Image Generation
  { actionType: "image_generation_low", credits: 2, displayName: "Image (Economy)", category: "image" },
  { actionType: "image_generation_standard", credits: 5, displayName: "Image (Standard)", category: "image" },
  { actionType: "image_generation_premium", credits: 10, displayName: "Image (Premium)", category: "image" },
  
  // Image Editing
  { actionType: "image_editing_low", credits: 2, displayName: "Edit (Economy)", category: "image" },
  { actionType: "image_editing_standard", credits: 5, displayName: "Edit (Standard)", category: "image" },
  { actionType: "image_editing_premium", credits: 10, displayName: "Edit (Premium)", category: "image" },
  
  // Video Generation
  { actionType: "video_generation_low", credits: 10, displayName: "Video (Economy)", category: "video" },
  { actionType: "video_generation_standard", credits: 20, displayName: "Video (Standard)", category: "video" },
  { actionType: "video_generation_premium", credits: 35, displayName: "Video (Premium)", category: "video" },
];
```

#### 3.2 Update Credit Deduction

```typescript
// When deducting credits
const actionType = `${feature}_${tier}`; // e.g., "video_generation_premium"

const deductResult = await deductCredits({
  clerkUserId: user.id,
  actionType, // Now tier-specific
  projectId: projectId as string,
});
```

### Phase 4: Schema Updates

#### 4.1 Update Scenes Table

```typescript
// convex/schema.ts - Add tier tracking to videoGeneration
videoGeneration: v.optional(
  v.object({
    // Existing fields...
    requestId: v.optional(v.string()),
    provider: v.string(),
    model: v.string(),
    
    // NEW: Tier tracking
    tier: v.optional(v.union(
      v.literal("low"),
      v.literal("standard"),
      v.literal("premium")
    )),
    
    // ... rest of fields
  }),
),
```

#### 4.2 Add User Preference Table (Optional)

```typescript
// Track user's default tier preferences
userPreferences: defineTable({
  clerkUserId: v.string(),
  defaultImageTier: v.optional(v.union(v.literal("low"), v.literal("standard"), v.literal("premium"))),
  defaultVideoTier: v.optional(v.union(v.literal("low"), v.literal("standard"), v.literal("premium"))),
  updatedAt: v.number(),
}).index("by_clerk_user", ["clerkUserId"]),
```

---

## Frontend Implementation

### Phase 1: Tier Selector Component

#### 1.1 Create TierSelector Component

```typescript
// components/ai-elements/TierSelector.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { Sparkles, Zap, Crown } from "lucide-react";

export type ModelTier = "low" | "standard" | "premium";

interface TierSelectorProps {
  feature: "image_generation" | "image_editing" | "video_generation";
  selectedTier: ModelTier;
  onTierChange: (tier: ModelTier) => void;
  disabled?: boolean;
}

const TIER_CONFIG = {
  low: {
    icon: Zap,
    label: "Economy",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  standard: {
    icon: Sparkles,
    label: "Standard",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  premium: {
    icon: Crown,
    label: "Premium",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
};

export function TierSelector({
  feature,
  selectedTier,
  onTierChange,
  disabled,
}: TierSelectorProps) {
  const t = useTranslations("tier_selector");
  
  // Get credit costs from config
  const tiers = AI_MODEL_TIERS[feature];
  
  return (
    <RadioGroup
      value={selectedTier}
      onValueChange={(value) => onTierChange(value as ModelTier)}
      disabled={disabled}
      className="grid grid-cols-3 gap-3"
    >
      {(["low", "standard", "premium"] as const).map((tier) => {
        const config = TIER_CONFIG[tier];
        const modelInfo = tiers[tier];
        const Icon = config.icon;
        
        return (
          <div key={tier} className="relative">
            <RadioGroupItem
              value={tier}
              id={`tier-${tier}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`tier-${tier}`}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer
                transition-all duration-200
                ${config.bgColor} ${config.borderColor}
                peer-data-[state=checked]:border-[${config.color.replace('text-', '')}]
                peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-offset-2
                hover:opacity-80
              `}
            >
              <Icon className={`h-6 w-6 ${config.color}`} />
              <span className={`font-medium ${config.color}`}>
                {config.label}
              </span>
              <span className="text-sm text-gray-400">
                {modelInfo.name}
              </span>
              <Badge variant="secondary" className="mt-1">
                {modelInfo.creditCost} {t("credits")}
              </Badge>
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
```

### Phase 2: Update Step 3 Components

#### 2.1 Update VideoGenerator

```typescript
// components/video-generation/VideoGenerator.tsx
import { TierSelector, type ModelTier } from "@/components/ai-elements/TierSelector";
import { getCreditCost } from "@/lib/ai/models/registry";

export function VideoGenerator({ ... }) {
  // Add tier state
  const [selectedTier, setSelectedTier] = useState<ModelTier>("standard");
  
  // Get dynamic credit cost
  const creditCost = getCreditCost("video_generation", selectedTier);
  
  // Update generation call
  const handleGenerateVideo = async () => {
    // Check credits for selected tier
    if (currentCredits < creditCost) {
      setShowInsufficientCreditsModal(true);
      return;
    }
    
    // Deduct with tier-specific action
    const deductResult = await deductCredits({
      clerkUserId: user.id,
      actionType: `video_generation_${selectedTier}`,
      projectId,
    });
    
    // Generate with tier
    await generateVideoAction({
      sceneId: sceneId as Id<"scenes">,
      modelTier: selectedTier, // NEW
      sceneDescription,
      startFrameUrl: startFrameImage,
      endFrameUrl: endFrameImage,
      // ...
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tier Selector - Only show before generation */}
        {!isGenerating && !isCompleted && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">{t("select_quality")}</h4>
            <TierSelector
              feature="video_generation"
              selectedTier={selectedTier}
              onTierChange={setSelectedTier}
            />
          </div>
        )}
        
        {/* Generate Button with Dynamic Credits */}
        <Button onClick={handleGenerateVideo}>
          {t("generate_scene_video")}
          <Badge variant="secondary" className="ml-2">
            {creditCost} {t("credits")}
          </Badge>
        </Button>
        
        {/* ... rest of component */}
      </CardContent>
    </Card>
  );
}
```

#### 2.2 Update FrameGenerator

```typescript
// components/scene-management/FrameGenerator.tsx
export function FrameGenerator({ ... }) {
  const [selectedTier, setSelectedTier] = useState<ModelTier>("standard");
  const creditCost = getCreditCost("image_generation", selectedTier);
  
  // Pass tier to generation action
  const result = await generateImage({
    sceneId,
    frameType,
    prompt: enhanced,
    projectId,
    modelTier: selectedTier, // NEW
  });
  
  // ...
}
```

### Phase 3: User Preferences

#### 3.1 Save Tier Preferences

```typescript
// hooks/business-logic/useModelPreferences.ts
export function useModelPreferences(userId: string) {
  const preferences = useQuery(api.users.getPreferences, { clerkUserId: userId });
  const savePreferences = useMutation(api.users.savePreferences);
  
  const defaultImageTier = preferences?.defaultImageTier || "standard";
  const defaultVideoTier = preferences?.defaultVideoTier || "standard";
  
  const setDefaultImageTier = async (tier: ModelTier) => {
    await savePreferences({ defaultImageTier: tier });
  };
  
  const setDefaultVideoTier = async (tier: ModelTier) => {
    await savePreferences({ defaultVideoTier: tier });
  };
  
  return {
    defaultImageTier,
    defaultVideoTier,
    setDefaultImageTier,
    setDefaultVideoTier,
  };
}
```

---

## Model Selection Matrix

### Image Generation (Text-to-Image)

| Tier | Model | Price/Image | Credits | Quality | Speed | Best For |
|------|-------|-------------|---------|---------|-------|----------|
| **Low** | Seedream v4 | $0.03 | 2 | Good | 2-5s | Drafts, iterations |
| **Standard** | Nano Banana Pro | $0.15 | 5 | Excellent | 8-15s | Most projects |
| **Premium** | FLUX.1 Dev | $0.25 | 10 | Premium | 15-30s | Final frames, marketing |

### Image Editing (Image-to-Image)

| Tier | Model | Price/Image | Credits | Quality | Speed | Best For |
|------|-------|-------------|---------|---------|-------|----------|
| **Low** | Seedream v4 Edit | $0.03 | 2 | Good | 2-5s | Quick edits |
| **Standard** | Nano Banana Pro Edit | $0.15 | 5 | Excellent | 8-15s | Most edits |
| **Premium** | Gemini 3 Pro Edit | $0.20 | 10 | Premium | 10-20s | Complex edits |

### Video Generation (Image-to-Video)

| Tier | Model | Price/5s | Credits | Quality | Speed | Best For |
|------|-------|----------|---------|---------|-------|----------|
| **Low** | MiniMax Video | $0.20 | 10 | Good | 30-60s | Drafts, previews |
| **Standard** | Kling v2.5 Turbo | $0.35 | 20 | Excellent | 60-120s | Most projects |
| **Premium** | Kling v2.5 Pro | $0.50 | 35 | Premium | 90-180s | Final videos, showcases |

---

## Credit Cost Structure

### Proposed Credit Pricing

| Feature | Low | Standard | Premium |
|---------|-----|----------|---------|
| Image Generation | 2 | 5 | 10 |
| Image Editing | 2 | 5 | 10 |
| Video Generation | 10 | 20 | 35 |
| Video Regeneration | 10 | 20 | 35 |

### Typical Project Costs (3 scenes)

| Quality | Images (6) | Videos (3) | Other | Total |
|---------|------------|------------|-------|-------|
| **All Low** | 12 | 30 | 30 | ~72 credits |
| **All Standard** | 30 | 60 | 30 | ~120 credits |
| **All Premium** | 60 | 105 | 30 | ~195 credits |
| **Mixed (Std Images, Premium Video)** | 30 | 105 | 30 | ~165 credits |

---

## Implementation Phases

### Phase 1: Backend Foundation
**Effort: 12-16 hours**

- [ ] Create model configuration types and registry (2h)
- [ ] Add tier parameter to imageGeneration action (3h)
- [ ] Add tier parameter to videoGeneration action (3h)
- [ ] Add tier parameter to videoRegeneration action (2h)
- [ ] Update schema with tier tracking (1h)
- [ ] Add tier-specific action types to creditCosts seed (1h)
- [ ] Unit tests for model registry (2h)

### Phase 2: Backend Integration
**Effort: 8-12 hours**

- [ ] Update credit deduction logic for tier actions (2h)
- [ ] Update video polling with tier info (2h)
- [ ] Add fallback logic per tier (3h)
- [ ] Update usage tracking with tier data (1h)
- [ ] Integration tests (3h)

### Phase 3: Frontend Components
**Effort: 12-16 hours**

- [ ] Create TierSelector component (4h)
- [ ] Add i18n strings for tier UI (1h)
- [ ] Update VideoGenerator with tier selector (3h)
- [ ] Update FrameGenerator with tier selector (2h)
- [ ] Dynamic credit display based on tier (2h)
- [ ] Component tests (3h)

### Phase 4: Frontend Integration
**Effort: 8-12 hours**

- [ ] Update Step 3 page with tier state (3h)
- [ ] Implement user preference storage (2h)
- [ ] Add tier display to video status (1h)
- [ ] Update transaction history display (2h)
- [ ] E2E tests (3h)

### Phase 5: Polish & QA
**Effort: 8-10 hours**

- [ ] Visual polish and animations (2h)
- [ ] Accessibility review (WCAG 2.1 AA) (2h)
- [ ] Mobile responsiveness testing (2h)
- [ ] Performance testing (bundle size) (1h)
- [ ] Documentation updates (2h)

---

## Effort Estimation

### Backend Work

| Task | Complexity | Hours | Developer |
|------|------------|-------|-----------|
| Model config system | Medium | 2-3h | Backend |
| Update imageGeneration.ts | Medium | 3-4h | Backend |
| Update videoGeneration.ts | Medium | 3-4h | Backend |
| Update videoRegeneration.ts | Low | 2h | Backend |
| Credit system updates | Medium | 2-3h | Backend |
| Schema migrations | Low | 1h | Backend |
| Unit/integration tests | Medium | 4-5h | Backend |
| **Backend Total** | | **18-22h** | |

### Frontend Work

| Task | Complexity | Hours | Developer |
|------|------------|-------|-----------|
| TierSelector component | Medium | 4h | Frontend |
| Update VideoGenerator | Medium | 3h | Frontend |
| Update FrameGenerator | Medium | 2-3h | Frontend |
| Update Step 3 page | Medium | 3h | Frontend |
| User preferences hook | Low | 2h | Frontend |
| i18n translations | Low | 1h | Frontend |
| Component tests | Medium | 3h | Frontend |
| E2E tests | Medium | 3h | Frontend |
| **Frontend Total** | | **21-25h** | |

### Total Effort

| Phase | Hours | Notes |
|-------|-------|-------|
| Backend Foundation | 12-16h | Model config, action refactoring |
| Backend Integration | 8-12h | Credits, polling, tests |
| Frontend Components | 12-16h | TierSelector, updates |
| Frontend Integration | 8-12h | Step 3, preferences, tests |
| QA & Polish | 8-10h | Accessibility, mobile |
| **Total** | **48-66h** | **~60-80 hours** |

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Model API differences cause bugs | Medium | High | Thorough testing per model, abstraction layer |
| Credit cost confusion for users | Low | Medium | Clear UI, tooltips, confirmation dialogs |
| Performance impact from config lookups | Low | Low | Cache model configs, static imports |
| Breaking existing projects | Medium | High | Backward compatible schema, default to "standard" |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users always choose "low" tier | Medium | Medium | Educate on quality differences, show samples |
| Increased support requests | Medium | Low | Clear documentation, FAQ |
| Model deprecation by fal.ai | Low | High | Monitor announcements, fallback strategy |

---

## Success Criteria

### Functional

- [ ] Users can select tier for image generation
- [ ] Users can select tier for video generation
- [ ] Credit costs reflect tier selection
- [ ] All tiers produce expected quality output
- [ ] Tier preferences persist across sessions

### Non-Functional

- [ ] Tier selection adds < 100ms to generation flow
- [ ] Bundle size increase < 5KB
- [ ] 100% backward compatible (existing projects work)
- [ ] Accessibility: Tier selector is keyboard navigable

### Business

- [ ] 30% of users try non-standard tier within first month
- [ ] Average project cost remains stable (users balance tiers)
- [ ] No increase in generation error rate

---

## Appendix: API Reference

### fal.ai Video Models

| Model ID | Type | Pricing |
|----------|------|---------|
| `fal-ai/minimax-video/image-to-video` | Low | ~$0.04/sec |
| `fal-ai/luma-dream-machine/image-to-video` | Low/Mid | ~$0.05/sec |
| `fal-ai/kling-video/v2.5-turbo/image-to-video` | Standard | ~$0.07/sec |
| `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` | Premium | ~$0.10/sec |

### fal.ai Image Models

| Model ID | Type | Pricing |
|----------|------|---------|
| `fal-ai/bytedance/seedream/v4/text-to-image` | Low | $0.03/image |
| `fal-ai/nano-banana-pro` | Standard | $0.15/image |
| `fal-ai/flux/dev` | Premium | $0.05/image |
| `fal-ai/recraft-v3` | Premium | ~$0.08/image |

---

**Document Version**: 1.0  
**Created By**: AI Assistant  
**Last Updated**: December 19, 2025  
**Review Status**: Pending Technical Review

