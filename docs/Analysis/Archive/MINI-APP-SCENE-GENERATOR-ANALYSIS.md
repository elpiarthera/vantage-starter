# 🎬 Mini App #4: Scene Generator (Video Generation) - Implementation Analysis

**Repository**: [ai-short-video-ad-creator](https://github.com/elpiarthera/ai-short-video-ad-creator)  
**Date**: January 21, 2026  
**Status**: Analysis Complete

---

## Executive Summary

The AI Short Video Ad Creator is a **production-ready, 3-step video generation system** built with Next.js 15, React 19, TypeScript, and modern AI/ML services. It leverages Claude Sonnet 4.5 for storyboarding, Nano Banana for keyframe generation, and Google Veo 3.1 for video synthesis.

**Architecture Quality**: Monolithic but functional (1,339-line component)  
**Tech Stack Alignment**: ✅ **Perfect** - Already uses Next.js, TypeScript, Tailwind, Radix UI, fal.ai  
**Estimated Integration Time**: **32-48 hours** (lower than others - less refactoring needed, infrastructure already exists)

> ✅ **Exceptional Fit**: Perfect foundation for MyShortReel Scene Generator mini-app. Most integration is state/database wiring, not component rebuilding.

---

## Feature Overview

### ✅ Core Video Generation
- **3-Step Wizard**: Input → Storyboard → Video
- **Storyboard AI Generation**: Claude creates 3 scenes with timing (0-3s, 3-6s, 6-8s)
- **Keyframe Generation**: Nano Banana generates 3 consistent keyframes per storyboard
- **Video Synthesis**: Google Veo 3.1 creates smooth 8-second video from keyframes
- **Audio Generation**: Automatic SFX, music, voiceover (built-in to Veo)
- **Style Support**: 5 pre-defined styles (Luxury, Minimal, Retro, Cinematic, Direct-to-Camera)
- **Product Consistency**: AI enforces brand identity across all scenes
- **Image Seeding**: Sequential image generation for visual coherence (0.35-0.5 strength)

### ✅ Video Output
- **Duration**: Fixed 8-second format (TikTok/Reels optimized)
- **Resolution**: 720p, 16:9 aspect ratio
- **Format**: MP4 with embedded audio
- **Quality**: Cinematic with smooth transitions
- **Real-Time URL Access**: Immediate CDN availability (fal.ai)

### ✅ User Experience Features
- **Editable Storyboard**: Modify scene descriptions and camera movements
- **Image Upload Override**: Replace AI-generated keyframes with custom images
- **Individual Moment Regeneration**: Re-generate specific scenes without full restart
- **Progress Tracking**: Time-based estimation with visual feedback
- **Error Recovery**: Detailed error messages with retry options
- **Mesh Gradient Background**: Apple-inspired animated 3D background

### ✅ Customization Features
- **Style Selection**: 5 pre-defined visual styles via buttons
- **Prompt Editing**: Modify AI-generated prompts per moment
- **Custom Instruction**: Optional free-form product description
- **Audio Strategy**: Text field for voiceover/music preferences
- **Reference Images**: Upload reference for consistency

### ❌ NOT Included
- Database persistence (session-only)
- User authentication or accounts
- Credit system or usage tracking
- Project/workspace integration
- Generation history storage
- Batch processing or queuing
- Background job support
- Video editing or effects
- Share/export to social platforms (direct access only)
- Multi-language support (English only)

---

## Technology Stack

| Layer | Technology | MyShortReel Compatibility |
|-------|-----------|--------------------------|
| **Framework** | Next.js 15.5.4 (App Router), React 19.1.0 | ✅ Exact match |
| **Language** | TypeScript 5 (strict mode) | ✅ Exact match |
| **Styling** | Tailwind CSS 4.1.9 | ✅ Exact match |
| **UI Components** | Radix UI + shadcn/ui | ✅ Exact match |
| **Icons** | Lucide React | ✅ Already in use |
| **Animations** | Custom CSS + Framer Motion patterns | ✅ Compatible |
| **Class Utils** | class-variance-authority, clsx | ✅ Already in use |
| **LLM Service** | Anthropic Claude Sonnet 4.5 | ✅ Via Vercel `ai` lib |
| **Image Generation** | Nano Banana (fal.ai) | ✅ Compatible |
| **Video Generation** | Google Veo 3.1 (fal.ai) | ✅ Compatible |
| **File Storage** | Vercel Blob | 🟡 May need abstraction |
| **State Management** | React Hooks + localStorage | 🔴 Needs Convex |
| **Persistence** | None (session-only) | 🔴 Needs Convex DB |
| **Authentication** | None | 🔴 Needs Clerk integration |
| **Credit System** | None | 🔴 Needs credit deduction |
| **Analytics** | Vercel Analytics | ✅ Already compatible |

---

## Architecture Assessment

### Strengths
✅ **Perfect Tech Stack Match**: Identical to MyShortReel (Next.js, TypeScript, Tailwind, Radix)  
✅ **Modern AI Integration**: Latest models (Claude 4.5, Veo 3.1) via proven services  
✅ **3-Step Workflow**: Clean separation of concerns, easily embeddable in modal/drawer  
✅ **Production-Ready**: Handles errors, timeouts, retries gracefully  
✅ **Image Consistency**: Seed-based generation ensures visual coherence  
✅ **Fast Inference**: Uses optimized models (4 steps for images, instant video)  
✅ **Comprehensive Prompting**: 240+ line prompts with style guides prevent errors  
✅ **User-Editable**: Scenes can be tweaked before final generation  

### Weaknesses (Critical)
🔴 **Monolithic Component**: 1,339 lines in single `ad-creator.tsx`  
🔴 **No Persistence**: All state lost on page refresh  
🔴 **No User System**: No authentication or user tracking  
🔴 **No Credits**: No cost tracking or usage limits  
🔴 **No History**: Generations not saved anywhere  
🔴 **No Error Boundaries**: Single error crashes entire app  
🔴 **Hardcoded Services**: Claude + Nano + Veo paths not configurable  
🔴 **Fixed Video Duration**: Always 8 seconds (no flexibility)  
🔴 **Fixed Styles**: 5 hardcoded styles only  
🔴 **No i18n**: English only  

---

## Feature Coverage Map

| Feature | Source | Effort | Value to MyShortReel |
|---------|--------|--------|---------------------|
| Video generation (3-scene) | Ad Creator | Direct copy | HIGH - core feature |
| Storyboard generation (Claude) | Ad Creator | Direct copy | HIGH - time-saver |
| Keyframe generation (Nano Banana) | Ad Creator | Direct copy | HIGH - consistency |
| Video synthesis (Veo 3.1) | Ad Creator | Direct copy | HIGH - output quality |
| Style selection | Ad Creator | Direct copy | MEDIUM - flexibility |
| Editable storyboards | Ad Creator | Direct copy | MEDIUM - UX |
| Image upload override | Ad Creator | Direct copy | MEDIUM - customization |
| Progress tracking | Ad Creator | Direct copy | MEDIUM - UX feedback |
| User authentication | MyShortReel | Integrate Clerk | HIGH - required |
| Credit deduction | MyShortReel | Integrate system | HIGH - required |
| Scene persistence | MyShortReel | Convex mutations | HIGH - required |
| History storage | MyShortReel | Convex queries | MEDIUM - feature |
| i18n support | MyShortReel | Add keys | MEDIUM - localization |
| Project linking | MyShortReel | Convex relations | MEDIUM - integration |

---

## Integration Complexity Assessment

### Easy (Direct Copy)
- AI generation API routes (storyboard, images, video)
- UI components and styling
- Mesh gradient animation
- Progress estimation logic
- Error handling patterns

**Effort**: ~4-6 hours

### Medium (Component Refactoring)
- Split monolithic 1,339-line component into sub-components
  - InputStep.tsx (product description + style selector)
  - StoryboardStep.tsx (3-column moment cards)
  - VideoStep.tsx (video player + controls)
  - ProgressIndicator.tsx (timeline + status)
- Extract state management into custom hooks
  - useStoryboardGeneration
  - useImageGeneration
  - useVideoGeneration
  - useGenerationProgress
- Add error boundaries
- Improve TypeScript types

**Effort**: ~8-12 hours

### Complex (Backend Integration)
- Add Convex tables for scene storage
- Create mutations: saveScene, saveStoryboard, saveGeneration
- Create queries: getUserScenes, getScene, getGenerationHistory
- Wire Clerk authentication context
- Integrate credit deduction system
- Implement generation history queries
- Add analytics tracking
- Handle multi-user scenarios
- Implement request queuing (optional)

**Effort**: ~16-24 hours

---

## Time Estimation Breakdown

### Option A: Keep Monolithic Component (RECOMMENDED FOR SPEED)

**Phase 1: Direct Integration (Skip refactoring)**
- Import ad-creator.tsx as-is into `/tools/scene-generator/page.tsx`
- Wrap in drawer/modal component
- Wire props directly
- **Saves**: 8-10 hours of refactoring
- **Trade-off**: Harder to maintain, all state in one component
- **Risk**: Low (component is proven, no changes to core logic)

### Option B: Refactor Components (RECOMMENDED FOR MAINTAINABILITY)

**Phase 1: Component Refactoring (8-12 hours)**
**✅ Already Have**: Radix UI, error handling patterns, styling system

- Split into 4-5 smaller components
  - InputStep: Textarea for description, style buttons
  - StoryboardStep: 3-moment card grid with edit/regenerate
  - VideoStep: Player with progress + download
  - MomentCard: Individual scene editor
  - GenerationControls: Start/cancel buttons
- Extract state into 3-4 custom hooks
- Add error boundaries for step isolation
- Improve component prop interfaces
- **Deliverable**: Modular, maintainable architecture

---

## Phase 2: State & Persistence (16-24 hours)
**✅ Already Have**: Convex schema, mutations/queries patterns, user context

- Add 2-3 Convex tables:
  - sceneGenerations (stores storyboards, metadata)
  - generatedScenes (final video outputs)
  - generationHistory (user's past generations)
- Create Convex mutations:
  - saveStoryboard
  - saveScene
  - deleteGeneration
  - updateSceneMetadata
- Create Convex queries:
  - getUserGenerationHistory (paginated)
  - getScene
  - getScenesByProject
- Wire Clerk user context
- Integrate credit deduction
  - STORYBOARD_COST: 5 credits
  - IMAGE_COST: 5 credits (×3 = 15)
  - VIDEO_COST: 30 credits
  - Total: ~50 credits per generation
- Migrate localStorage → Convex
- **Deliverable**: Multi-user backend with persistence

### Phase 3: Mini-App Integration (8-12 hours)
**✅ Already Have**: Project structure, asset/scene linking patterns

- Add SceneGenerator mini-app route
- Create drawer/modal wrapper component
- Wire props interface (projectId, userId, onClose, onSceneGenerated)
- Link generated scene to project
- Add to scene library
- Implement cancel/close workflow
- Add generation result callback
- **Deliverable**: Seamless integration into MyShortReel workflow

### Phase 4: Polish & Testing (4-8 hours)
**✅ Already Have**: i18n keys, testing patterns, mobile design

- Add i18n translation keys
- Mobile responsiveness audit
- Error scenario testing
- Credit system edge cases
- Component unit tests
- **Deliverable**: Production-ready, fully localized

---

## Time Estimate Comparison

| Approach | Phase 1 | Phase 2 | Phase 3 | Phase 4 | **Total** | **Time Saved** |
|----------|---------|---------|---------|---------|-----------|----------------|
| **With Refactoring** | 8-12h | 16-24h | 8-12h | 4-8h | **32-48h** | Baseline |
| **Monolithic (Keep As-Is)** | 0h | 16-24h | 8-12h | 4-8h | **24-36h** | **8-10 hours** |

---

## **TOTAL ESTIMATED TIME**

### **Option A: Keep Monolithic** → **24-36 hours** (save 8-10 hours)
- Fastest path to production
- Use ad-creator.tsx as-is
- All state in one component
- Works great for MVP

### **Option B: Refactor Components** → **32-48 hours** (baseline)
- Better long-term maintainability
- Cleaner code architecture
- Easier to test and modify
- Better for scaling

---

## Convex Schema Design (Required)

```typescript
// convex/schema.ts - ADD TO EXISTING

// Scene generation results
export const sceneGenerations = defineTable({
  userId: v.id("users"),
  projectId: v.optional(v.id("projects")),
  
  // Generation inputs
  productDescription: v.string(),
  style: v.string(), // "luxury", "minimal", "retro", etc.
  userPrompt: v.string(),
  
  // Storyboard data
  storyboard: v.object({
    productIdentity: v.string(),
    audioStrategy: v.string(),
    musicStyle: v.string(),
    moments: v.array(v.object({
      timing: v.string(), // "[00:00-00:03]"
      title: v.string(),
      summary: v.string(),
      description: v.string(),
      cameraMovement: v.string(),
      audio: v.string(),
      imageUrl: v.string(),
    })),
  }),
  
  // Generated outputs
  videoUrl: v.string(),
  keyframeUrls: v.array(v.string()), // 3 keyframe URLs
  
  // Metadata
  creditsUsed: v.number(),
  duration: v.number(), // Always 8 seconds
  resolution: v.string(), // "720p"
  aspectRatio: v.string(), // "16:9"
  
  // Tracking
  status: v.union(v.literal("generating"), v.literal("completed"), v.literal("failed")),
  errorMessage: v.optional(v.string()),
  
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
}).index("by_user", ["userId"]).index("by_project", ["projectId"]);

// Scene history for quick access
export const sceneLibrary = defineTable({
  userId: v.id("users"),
  projectId: v.id("projects"),
  generationId: v.id("sceneGenerations"),
  
  // Quick access fields
  thumbnail: v.string(), // First keyframe URL
  title: v.string(), // Generated title or custom
  description: v.optional(v.string()),
  
  // Organization
  tags: v.optional(v.array(v.string())),
  favorited: v.boolean(),
  
  createdAt: v.number(),
}).index("by_project", ["projectId"]).index("by_user", ["userId"]);
```

---

## Component Decomposition Plan

### Current Structure
```
components/
└── ad-creator.tsx (1,339 lines)
    ├── Input step
    ├── Storyboard step
    ├── Video step
    └── Modal logic
```

### Target Structure
```
components/scene-generator/
├── SceneGenerator.tsx (150 lines)
│   └── Main orchestrator + routing between steps
├── steps/
│   ├── InputStep.tsx (200 lines)
│   │   ├── Product description textarea
│   │   └── Style selector buttons
│   ├── StoryboardStep.tsx (300 lines)
│   │   ├── 3-moment card grid
│   │   ├── Edit controls
│   │   └── Regenerate buttons
│   ├── VideoStep.tsx (200 lines)
│   │   ├── Video player
│   │   ├── Progress bar
│   │   └── Download/actions
│   └── ProgressIndicator.tsx (100 lines)
│       └── Generation timeline
├── components/
│   ├── MomentCard.tsx (150 lines)
│   │   ├── Scene preview
│   │   ├── Editable summary
│   │   └── Regenerate button
│   ├── StyleSelector.tsx (80 lines)
│   │   └── 5 style buttons
│   ├── UploadImageModal.tsx (100 lines)
│   │   └── Image replacement for keyframe
│   └── GenerationError.tsx (80 lines)
│       └── Error handling UI
├── hooks/
│   ├── useStoryboardGeneration.ts (150 lines)
│   ├── useImageGeneration.ts (120 lines)
│   ├── useVideoGeneration.ts (100 lines)
│   └── useGenerationProgress.ts (80 lines)
└── types.ts (50 lines)
    └── TypeScript interfaces
```

---

## Comparison: Build vs Port vs Monolithic

| Metric | Build from Scratch | Port (Refactored) | Port (Monolithic) |
|--------|-------------------|-------------------|-------------------|
| **Time** | 100-120 hours | 32-48 hours | **24-36 hours** |
| **Components** | Write from scratch | 90% copy + refactor | 90% copy as-is | 
| **AI Integration** | Build prompts | Proven 240+ line prompts | Proven prompts |
| **Error Handling** | Basic try-catch | Production error recovery | Production recovery |
| **Styling** | Custom theme | Already Apple-designed | Already Apple-designed |
| **Feature Complete** | 70% | **95%** | **95%** |
| **Code Quality** | Variable | **Excellent** | Good (monolithic) |
| **Maintainability** | Good | Excellent | Medium |
| **Tech Debt** | Low | Low | Medium (1,339-line component) |
| **Risk** | High | **Low** | Low (proven code) |

**Recommendation**: **Monolithic approach for MVP** (save 8-10 hours), refactor later if needed

---

## Implementation Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Component refactoring breaks workflow | Medium | Medium | Add tests during extraction, feature flags |
| Long video generation timeouts (5+ min) | Low | Medium | Implement background jobs, polling queue |
| Token limits with 240+ char prompts | Low | Low | Cache common prompts, batch processing |
| Fal.ai service rate limits | Low | Low | Implement request queuing, backoff |
| Multi-user concurrent generation | Medium | Low | Add per-user rate limiting in Convex |
| Storage abstraction complexity | Low | Low | Keep Vercel Blob for uploads, fal.ai for outputs |
| User navigation away during generation | Medium | Low | Confirm before closing, save progress |
| Video CDN availability issues | Very Low | High | Keep generation logs, allow re-download |
| Credit calculation edge cases | Medium | Medium | Thorough testing with edge cases |

**Contingency**: +8-12 hours for unexpected issues (integration complexity varies)

---

## Mini-App Integration Points

### 1. Props Interface
```typescript
interface SceneGeneratorProps {
  projectId: Id<"projects">
  userId: string
  onSceneGenerated?: (scene: GeneratedScene) => void
  onClose?: () => void
  initialStyle?: string
  initialPrompt?: string
}

interface GeneratedScene {
  generationId: Id<"sceneGenerations">
  videoUrl: string
  keyframeUrls: string[]
  storyboard: Storyboard
  metadata: {
    style: string
    creditsUsed: number
    duration: number
  }
}
```

### 2. Credit System Integration
```typescript
// Cost structure
const SCENE_GENERATION_COSTS = {
  STORYBOARD: 5,        // Claude generation
  IMAGES: 15,           // 3 × 5 per image
  VIDEO: 30,            // Veo video synthesis
  TOTAL_GENERATION: 50  // Full pipeline
}

// Pre-generation check
if (userCredits < SCENE_GENERATION_COSTS.TOTAL_GENERATION) {
  showInsufficientCreditsModal()
  return
}

// Post-generation deduction
await deductCredits({
  actionType: "scene_generation",
  projectId,
  creditsUsed: SCENE_GENERATION_COSTS.TOTAL_GENERATION
})
```

### 3. Drawer/Modal Wrapper
```typescript
// Use Drawer on mobile, Dialog on desktop (existing pattern)
import { useDevice } from "@/contexts/DeviceContext"

export function SceneGeneratorModal({ projectId, onClose }: Props) {
  const { isMobile } = useDevice()
  
  if (isMobile) {
    return (
      <Drawer open onOpenChange={onClose}>
        <DrawerContent>
          <SceneGenerator projectId={projectId} onClose={onClose} />
        </DrawerContent>
      </Drawer>
    )
  }
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <SceneGenerator projectId={projectId} onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}
```

### 4. Project Integration
```typescript
// After scene generation, add to project
const onSceneGenerated = async (scene: GeneratedScene) => {
  // Create new scene in project
  const newScene = await createScene({
    projectId,
    videoUrl: scene.videoUrl,
    startFrame: scene.keyframeUrls[0],
    endFrame: scene.keyframeUrls[2],
    metadata: scene.metadata
  })
  
  // Add to video timeline
  await updateProject({
    projectId,
    scenes: [...project.scenes, newScene.id]
  })
  
  // Notify user
  toast.success("Scene generated and added to project")
  onClose()
}
```

---

## Deliverables & Success Criteria

### MVP (32-48 hours)
✅ Scene Generator mini-app (modal/drawer)  
✅ Full 3-step generation workflow  
✅ Convex persistence for generations  
✅ Credit deduction integration  
✅ Clerk authentication wiring  
✅ Project scene linking  
✅ i18n support  
✅ Mobile responsive  
✅ Error handling + recovery  

### Optional Enhancements (post-MVP)
❓ Generation history sidebar  
❓ Batch generation (multiple scenes)  
❓ Custom style creation  
❓ Prompt templates/library  
❓ Duration flexibility (5s, 8s, 10s, 15s)  
❓ Background job support  
❓ Advanced video editing options  

---

## Recommended Implementation Path

### Sprint 1: Foundation (8-12 hours)
- [ ] Set up mini-app route and wrapper
- [ ] Extract ad-creator component into sub-components
- [ ] Create custom hooks for generation logic
- [ ] Add error boundaries
- **Result**: Modular, testable architecture

### Sprint 2: Backend Integration (16-24 hours)
- [ ] Add Convex tables for scene storage
- [ ] Create mutations and queries
- [ ] Wire Clerk user context
- [ ] Integrate credit deduction
- [ ] Implement generation history
- **Result**: Multi-user backend with persistence

### Sprint 3: Mini-App & Testing (8-12 hours)
- [ ] Create drawer/modal wrapper
- [ ] Link to projects and asset library
- [ ] Add callback handlers
- [ ] Mobile testing
- [ ] i18n keys
- **Result**: Production-ready mini-app

### Sprint 4: Polish (4-8 hours)
- [ ] Error recovery workflows
- [ ] Credit system edge cases
- [ ] Performance optimization
- [ ] Accessibility audit
- **Result**: Polished, production-ready

---

## Conclusion

The **AI Short Video Ad Creator is an exceptional foundation** for MyShortReel's Scene Generator mini-app. With its perfect tech stack alignment, modern AI integration, and production-ready architecture, the primary work is **integration and refactoring, not rebuilding**.

**Key Advantages**:
- ✅ 90% of code can be copied directly
- ✅ Proven AI pipelines (Claude → Nano Banana → Veo 3.1)
- ✅ Excellent error handling and user experience
- ✅ Modern tech stack matches MyShortReel exactly
- ✅ Relatively small scope (3-step workflow)

**Recommendation**: ✅ **PROCEED WITH INTEGRATION**

**Timeline**: 32-48 hours (5-6 developer days)  
**Complexity**: 🟡 **MEDIUM** (component refactoring + Convex integration)  
**Risk**: **LOW** (well-established codebase + infrastructure match)  
**Value**: **HIGH** (core feature for video creation)

---

**Document Version**: 1.0  
**Last Updated**: January 21, 2026  
**Author**: Implementation Team  
**Status**: Ready for Development Assignment
