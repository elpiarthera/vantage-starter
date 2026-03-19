# 📊 Comprehensive Mini-App Analysis Summary & Integration Roadmap

**Date**: January 21, 2026 (updated February 10, 2026)  
**Status**: Complete Analysis of 14 Mini-Apps (13 original + Cinematography Prompt Studio)  
**Team**: Implementation Team  
**Purpose**: Strategic prioritization and execution plan for MyShortReel feature expansion

---

## Executive Summary

Analyzed **14 mini-app repositories** for integration potential into MyShortReel. Analysis reveals:

✅ **7 apps ready to ship (MVP)** (~130-180 hours, 5-6 weeks)  
   - Image Tool merged (Gen + Edit): 10-14h — **Kling Image O3/v3** (unified pipeline)
   - Prompt Generator: 16-24h
   - Cinematography Prompt Studio MVP: ~20h — **unique differentiator**, no competitor has this
   - Storyboard Generator: 18-24h
   - Timeline Editor hooks: 14-18h
   - Compare Models (v0 Benchmark): 12-16h
   - Scene Generator: 32-48h (Kling 3.0 swap, pipeline rework)
⚠️ **3 reference implementations** (study patterns, extract services)  
❌ **3 apps not recommended** (too complex, low ROI, or out of scope)

> **Feb 2026 update**: Image Generator and Image Editor have been **merged** into a single Image Tool (see [MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md](./MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md)). Models swapped from Nano Banana/Gemini/Flux to **Kling Image O3/v3** (T2I + I2I) for a unified Kling pipeline (image → edit → Kling I2V video). The **Cinematography Prompt Studio** (CPE port from DirectorsConsole + Kling 3.0) has been added as a new entry.

**Recommended Priority (Updated)**:

**Week 1: Demo Quick Win** (Sprint 29)
- 🖼️ **Image Tool (Merged)** (10-14h) — Kling Image O3 T2I + v3 I2I, Convex, credits, "Use in Video"

**Weeks 2-3: Core Tools** (Parallel Tracks A & B)
- 📝 **Track A**: Prompt Generator (16-24h) + Compare Models (12-16h)
- 🎬 **Track B**: Cinematography Prompt Studio MVP (~20h) — CPE presets + Kling 3.0 formatter

**Weeks 3-4: Heavy Features** (Parallel Tracks C & D)
- 🎨 **Track C**: Storyboard Generator (18-24h) — uses patterns from Tracks A/B
- 🎞️ **Track D**: Timeline Editor hooks (14-18h)

**Weeks 5-6: Video + Polish** (Parallel + Final)
- 🎬 **Track E**: Scene Generator (32-48h) — Kling 3.0 I2V swap, pipeline rework
- Ad Assets Generator (40-56h) — optional, if time allows
- Final testing, documentation, deployment prep

**Total MVP Timeline**: 5-6 weeks with parallel tracks
**Key insight**: Image Tool merged saves ~10h vs separate apps; Cinematography Prompt Studio is a unique competitive moat; all image/video generation now on Kling pipeline (FAL.ai)

---

## 🎯 Quick Reference Table

| # | App | Type | Time | Models | Recommendation | Status |
|---|-----|------|------|--------|-----------------|--------|
| 1 | 🖼️ **Image Tool (Gen + Edit)** | Creation + Editing | **10-14h** | Kling Image O3/v3 T2I + I2I | **SHIP FIRST (Sprint 29)** | ✅ In Progress |
| 2 | 📝 Prompt Generator | Content | 16-24h | FAL.ai LLM | **SHIP (Week 2)** | Ready |
| 3 | 🎬 **Cinematography Prompt Studio** | Creation | **~20h (MVP)** | CPE + Kling 3.0 | **SHIP (Week 2-3) — Differentiator** | Ready |
| 4 | 🎨 Storyboard Generator | Creation | 18-24h | Kling Image + I2V | **PARALLEL (Weeks 3-4)** | Ready |
| 5 | 🎞️ Timeline Editor | Editing | 14-18h | — | **PARALLEL (Weeks 3-4)** | Ready |
| 6 | 📊 Compare Models (v0 Benchmark) | Comparison | 12-16h | Multi-model | **PARALLEL (Week 2)** | Ready |
| 7 | 🎬 Scene Generator | Video | 32-48h | Kling 3.0 v3/O3 I2V | **SHIP (Weeks 5-6)** | Refactor |
| 8 | 📱 Ad Assets Gen | Assets | 40-56h | Multi-model | **Optional (Weeks 5-6)** | Refactor |
| 9 | 🎨 Reve Studio | Social | 3-4w | — | **Study Only** | Reference |
| 10 | 🍌 Node Banana | Workflow | — | — | **Reference** | Reference |
| 11 | 🖼️ v0-for-Images | Editing | 88-128h | — | **Extract Patterns** | Reference |
| 12 | 🎯 AI Ads Scaling | Generator | 6-8w | — | **SKIP** | Not Ready |
| 13 | 🎬 Seq Full NLE | Editing | 6-8w | — | **Extract Hooks** | Partial |

---

# 1️⃣ PROMPT GENERATOR (awesome-video-prompts)

**Repository**: [awesome-video-prompts](https://github.com/ilkerzg/awesome-video-prompts)  
**Status**: ✅ **READY TO SHIP**

## Why This Matters for MyShortReel

**Problem Solved**: Creators struggle to write effective prompts for AI video generation. This tool provides structure for prompt composition with AI enhancement.

### User Benefit & Added Value for MyReelDream

Prompt quality is the single biggest lever on output quality in AI video generation. Most users write vague or generic prompts and get mediocre results. The Prompt Generator turns this into a guided, category-based composition flow (lighting, camera, mood, pacing, etc.) with AI enhancement — so even first-time users produce prompts that yield cinematic output. For MyReelDream, this means higher user satisfaction, lower churn, and a natural upsell into video generation (better prompt → better video → user converts).

**User Value**:
- ✅ Helps creators write better prompts
- ✅ Reduces creative friction
- ✅ Increases video quality (better prompts → better output)
- ✅ Saves time (templates vs. blank canvas)
- ✅ Educational (teaches prompt engineering)

## What to Reuse

### 1. UI Component Library (@workspace/ui) ⭐⭐⭐⭐⭐
- **What**: Published npm package with reusable components
- **Components**: Carousel (Embla), buttons, input fields, cards
- **Effort to reuse**: Fork and publish to internal registry (2-3 hours)
- **Value**: Establishes MyShortReel component library

### 2. Hook Architecture ⭐⭐⭐⭐⭐
- **What**: usePromptEnhancer, useImagePromptGenerator, usePromptComposer
- **Effort to adapt**: 2-3 hours (remove component imports)
- **Reusability**: Can be used across other features

### 3. AI Prompt Enhancement Pattern ⭐⭐⭐⭐
- **What**: Claude/GPT-4o integration via FAL.ai
- **Effort to adapt**: 1-2 hours (already using FAL.ai in MyShortReel)
- **Reusability**: Template for enhancing other types of content

### 4. Category/Template System ⭐⭐⭐⭐
- **What**: 20+ prompt categories with structured data
- **Effort to adapt**: 2-3 hours (map to Convex schema)
- **Reusability**: Can create similar systems for other tools

### 5. Type Definitions ⭐⭐⭐⭐
- **What**: PromptComposition, PromptCategory, PromptOption interfaces
- **Effort to adapt**: 1 hour (already TypeScript compatible)
- **Value**: Guidance for other prompt-based features

## Features It Brings to MyShortReel

### Core Features (MVP)
- 🎯 **Prompt Composer**: Multi-select carousel UI for 20+ cinematic categories
- 🤖 **AI Enhancement**: Claude/GPT-4o enhancement via FAL.ai
- 🖼️ **Image-to-Prompt**: Upload reference images, AI analyzes and generates prompts
- 📋 **Template Categories**: Lighting, camera, mood, style, pacing, script, voiceover, text
- ⭐ **Favorites System**: Save and favorite prompts for reuse
- 📜 **Prompt History**: Convex persistence (userPromptHistory table)
- 🔄 **Undo Enhancement**: Restore original prompt after AI refinement
- 📋 **Copy to Clipboard**: One-click prompt sharing

### Advanced Features (Phase 2)
- 🏆 **Advanced JSON Editor**: Structured data manipulation
- 📦 **Batch Generation**: Process multiple prompts
- 💾 **Prompt Templates**: Save configuration templates
- 👥 **Team Sharing**: Share prompts with collaborators
- 📊 **Analytics**: Track most-used prompts and categories

## Integration Path

### Phase 1: UI Integration (3-4 hours)
```
1. Extract carousel UI component
2. Create prompt composer modal
3. Wire category data
4. Setup copy-to-clipboard
```

### Phase 2: AI Integration (2-3 hours)
```
1. Wire usePromptEnhancer to existing FAL.ai setup
2. Create useImagePromptGenerator for vision
3. Adapt system prompts for MyShortReel context
```

### Phase 3: Persistence (2-3 hours)
```
1. Create userPromptHistory Convex table
2. Add save/load mutations
3. Wire to Clerk auth context
4. Test with existing template system
```

### Phase 4: Polish (1-2 hours)
```
1. Mobile testing
2. i18n integration
3. Error handling
4. Analytics
```

## Convex Schema Needed

```typescript
export const userPromptHistory = defineTable({
  userId: v.string(),
  contentType: v.string(),
  selectedCategories: v.array(v.object({
    category: v.string(),
    selectedOption: v.string(),
  })),
  generatedPrompt: v.string(),
  enhancedPrompt: v.optional(v.string()),
  isFavorited: v.boolean(),
  title: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  createdAt: v.number(),
  usedAt: v.optional(v.number()),
}).index("by_user", ["userId"])
  .index("by_favorited", ["isFavorited"])
```

## Success Metrics

- ✅ Prompt composer UI working
- ✅ AI enhancement functional
- ✅ Image-to-prompt generation
- ✅ Save/favorite system
- ✅ History accessible
- ✅ Mobile responsive
- ✅ 80%+ test coverage

## Time Estimate: **16-24 hours** ✅

---

# 2️⃣ STORYBOARD GENERATOR (Seq - Storyboard Module)

**Repository**: [seq](https://github.com/headline-design/seq)  
**Status**: ✅ **READY TO SHIP**

## Why This Matters for MyShortReel

**Problem Solved**: Creators need visual planning before diving into production. This tool transforms text into structured visual storyboards with AI-generated variations.

### User Benefit & Added Value for MyReelDream

Storyboarding bridges the gap between "idea" and "video." Instead of jumping straight into expensive video generation and wasting credits on misaligned output, users plan visually first — refining shot composition, sequence flow, and narrative structure with AI-generated panels. For MyReelDream, this reduces wasted generation cycles (lower cost per user), increases project completion rates, and creates a natural pipeline: storyboard panels become keyframes for Kling I2V video generation.

**User Value**:
- ✅ Reduces creative friction (plan before creating)
- ✅ Enables visual collaboration (show ideas before production)
- ✅ Integrates directly into timeline (storyboard → timeline)
- ✅ Hypothesis-driven (not random variations)
- ✅ Saves time (hours of planning → 30 minutes)

## What to Reuse

### 1. Multi-Step Workflow UI ⭐⭐⭐⭐⭐
- **What**: 7-step workflow component architecture
- **Steps**: Input → Master Image → Extract Panels → Enhance → Check Risks → Generate → Review
- **Effort to reuse**: 4-6 hours (components are modular)
- **Value**: Can be pattern for other multi-step tools

### 2. AI Orchestration Hooks ⭐⭐⭐⭐⭐
- **What**: useMasterImageGeneration, usePanelProcessor, usePromptEnhancer, useVideoGenerator
- **Effort to adapt**: 3-4 hours (adapt to MyShortReel APIs)
- **Reusability**: Core AI generation pipeline pattern

### 3. Component System ⭐⭐⭐⭐
- **What**: Modular step components (each self-contained)
- **Effort to adapt**: 2-3 hours (match MyShortReel design)
- **Pattern**: Good for other multi-step features

### 4. Progress Tracking ⭐⭐⭐⭐
- **What**: Status tracking for long-running operations
- **Effort to adapt**: 1-2 hours (use existing patterns)
- **Reusability**: Can apply to video export, batch generation

### 5. Session Management ⭐⭐⭐
- **What**: Workflow state persistence (survives page reload)
- **Effort to adapt**: 2 hours (Convex session table)
- **Value**: Can be reused for other workflows

## Features It Brings to MyShortReel

### Core Features (MVP)
- 📝 **Text-to-Storyboard**: Describe video, AI generates master image
- 🎨 **Visual Panel Extraction**: AI detects individual scenes/panels
- 📋 **Prompt Enhancement**: Optimize prompts for video generation
- 🎬 **Video Synthesis**: Animate panels with Veo 3.1 or WAN models
- 🔀 **Transitions**: Smooth bridging between panels
- 👁️ **Live Preview**: Real-time panel updates
- ✅ **Risk Assessment**: Pre-generation quality checks
- 💾 **Project Save**: Storyboards persisted to user account

### Advanced Features (Phase 2)
- 🔄 **Batch Processing**: Generate multiple storyboards
- 🎭 **Style Presets**: Cinematic, documentary, animated, etc.
- 🎵 **Music Integration**: Suggest music based on pacing
- 👥 **Team Collaboration**: Share and iterate with team
- 📊 **Analytics**: Track most successful storyboard patterns

## Integration Path

### Phase 1: Component Extraction (3-4 hours)
```
1. Extract step components
2. Remove Seq-specific dependencies
3. Adapt to MyShortReel design system
4. Create modal/drawer wrapper
```

### Phase 2: API Integration (4-5 hours)
```
1. Wire to existing Gemini/FAL.ai setup
2. Create storyboard generation API routes
3. Handle long-running async operations
4. Implement webhook callbacks for video generation
```

### Phase 3: Persistence (2-3 hours)
```
1. Create storyboardProjects Convex table
2. Add save/load mutations
3. Link to timeline editor (if available)
4. Wire to user context
```

### Phase 4: Polish (2-3 hours)
```
1. Error handling and recovery
2. Mobile responsiveness
3. Progress feedback
4. Testing
```

## Convex Schema Needed

```typescript
export const storyboardProjects = defineTable({
  userId: v.string(),
  name: v.string(),
  concept: v.string(),
  masterImageUrl: v.string(),
  panels: v.array(v.object({
    id: v.string(),
    order: v.number(),
    imageUrl: v.string(),
    videoUrl: v.optional(v.string()),
    prompt: v.string(),
    duration: v.number(),
    status: v.string(),
  })),
  aspectRatio: v.string(),
  isPublished: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"])
  .index("by_created", ["createdAt"])
```

## Success Metrics

- ✅ Text input → storyboard generation
- ✅ AI panel extraction
- ✅ Prompt enhancement
- ✅ Video generation from panels
- ✅ Risk assessment working
- ✅ Project persistence
- ✅ Timeline integration (optional)

## Time Estimate: **18-24 hours** ✅

---

# 3️⃣ TIMELINE EDITOR (Seq - Timeline Module)

**Repository**: [seq](https://github.com/headline-design/seq)  
**Status**: ✅ **READY TO SHIP (Hooks Only)**

## Why This Matters for MyShortReel

**Problem Solved**: Creators need professional multi-track editing (trim, split, effects, real-time playback) without desktop software. This is a core feature for any video creation tool.

### User Benefit & Added Value for MyReelDream

The Timeline Editor turns MyReelDream from a "generate a clip" tool into a full creative suite. Users can trim, split, reorder, add effects, and mix audio — all in-browser, no desktop software required. This is the feature that makes users stay: once they've assembled a multi-clip sequence with effects and audio, they've invested creative effort that locks them into the platform. For MyReelDream, it unlocks longer session times, higher retention, and the ability to charge for export/rendering.

**User Value**:
- ✅ Professional NLE in browser (desktop-quality)
- ✅ Real-time playback with audio sync
- ✅ Magnetic snapping for precision editing
- ✅ Unlimited undo/redo
- ✅ Multi-track support (video, audio, text)
- ✅ Effects and transitions
- ✅ Browser-based export (no server upload)

## What to Reuse

### 1. Timeline State Hooks ⭐⭐⭐⭐⭐ (CRITICAL)
- **What**: useTimelineState, usePlayback, useTimeloneDrag, useTimelineSelection (13 hooks total)
- **Effort to extract**: 2-3 hours (copy, remove UI imports)
- **Effort to integrate**: 1-2 hours (wire to component)
- **Value**: Battle-tested timeline logic, highly reusable
- **Reusability**: Can use for audio editing, subtitle timeline, effects timeline

### 2. Undo/Redo System ⭐⭐⭐⭐⭐
- **What**: Stack-based history with unlimited steps
- **Effort to use**: 0 hours (included in hooks)
- **Value**: Essential for quality UX
- **Reusability**: Can apply to other editable features

### 3. Audio/Video Rendering ⭐⭐⭐⭐
- **What**: Canvas-based clip composition, audio mixing via Web Audio API
- **Effort to adapt**: 2-3 hours (create renderer wrapper)
- **Reusability**: Can be used for other video tools

### 4. FFmpeg Export Pipeline ⭐⭐⭐⭐
- **What**: useFFmpegExport hook with WASM bundling
- **Effort to use**: 2-3 hours (integrate into export button)
- **Reusability**: Can be used for batch export, video processing

### 5. Type Definitions ⭐⭐⭐⭐
- **What**: TimelineClip, Track, TimelineProject, ClipEffects interfaces
- **Effort to adapt**: 1 hour (map to MyShortReel asset structure)
- **Value**: Guidance for UI layer

## Features It Brings to MyShortReel

### Core Features (MVP)
- 📍 **Multi-Track Editing**: Unlimited video, audio, text tracks
- ✂️ **Clip Operations**: Trim, split, duplicate, delete, reorder
- ⚙️ **Effects**: Brightness, contrast, saturation, opacity, blur
- 🎬 **Transitions**: Cross-fade, dip-to-black, wipes
- 📄 **Text Overlays**: Titles, subtitles with animations
- ▶️ **Real-Time Playback**: Audio-synced video preview
- 🎚️ **Volume Mixing**: Per-track volume control
- 🔄 **Magnetic Snapping**: Precision clip alignment
- ↩️ **Unlimited Undo/Redo**: Complete history management
- ⌨️ **Keyboard Shortcuts**: Space=play, S=split, Delete=remove

### Advanced Features (Phase 2)
- 🎨 **Color Correction**: Advanced grading tools
- 🎭 **Motion Graphics**: Animation templates
- 🎵 **Audio Editing**: Waveform display, crossfades
- 🎬 **Speed Ramping**: Variable speed within clips
- 📸 **Frame-by-Frame**: Precise navigation
- 🖼️ **Picture-in-Picture**: Overlay support
- 🔗 **Linked Sequences**: Nested timelines

## Integration Path

### Phase 1: Hook Extraction (2-3 hours)
```
1. Copy timeline hooks to lib/timeline-editor/hooks/
2. Extract types and utilities
3. Remove UI component imports
4. Create barrel exports
```

### Phase 2: Test Suite (2-3 hours)
```
1. Add unit tests for each hook
2. Add integration tests for workflow
3. Test undo/redo thoroughly
4. Create test fixtures
```

### Phase 3: UI Component Rebuild (6-8 hours)
```
1. Create TimelineEditor wrapper component
2. Build track list and header
3. Create clip item with drag/drop
4. Build effects panel
5. Create export dialog
6. Wire to MyShortReel design system
```

### Phase 4: Integration (2-3 hours)
```
1. Wire to asset management
2. Connect clip operations to Convex
3. Test with real videos
4. Mobile responsiveness
```

## Convex Schema Needed

```typescript
export const timelineProjects = defineTable({
  userId: v.string(),
  name: v.string(),
  
  projectData: v.object({
    clips: v.array(v.object({
      id: v.string(),
      mediaId: v.string(),
      trackId: v.string(),
      start: v.number(),
      duration: v.number(),
      offset: v.number(),
      effects: v.optional(v.object({
        brightness: v.number(),
        contrast: v.number(),
        saturation: v.number(),
        opacity: v.number(),
      })),
    })),
    tracks: v.array(v.object({
      id: v.string(),
      name: v.string(),
      type: v.union(v.literal("video"), v.literal("audio"), v.literal("text")),
      isMuted: v.boolean(),
    })),
    aspectRatio: v.string(),
    duration: v.number(),
  }),
  
  isArchived: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"])
```

## Success Metrics

- ✅ Hooks extract cleanly
- ✅ useTimelineState fully functional
- ✅ usePlayback syncs with video
- ✅ Trim/split/delete working
- ✅ Effects panel functional
- ✅ Undo/redo comprehensive
- ✅ Export to MP4 working
- ✅ 80%+ test coverage
- ✅ Mobile responsive

## Time Estimate: **14-18 hours** ✅

---

# 4️⃣ IMAGE TOOL — MERGED (Generator + Editor)

**Source Repositories**: [Nano Banana Pro Playground](https://github.com/elpiarthera/Nano-banana-pro-playground) (UI shell) + [EasyEdit](https://github.com/Nutlope/easyedit) (edit patterns)  
**Models**: Kling Image O3 T2I (default), v3 T2I (optional), v3 I2I (edit), O3 I2I (multi-ref edit)  
**Status**: ✅ **IN PROGRESS (Sprint 29)** — Sprint 23 UI already ported  
**Full Analysis**: [MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md](./MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md)  
**Sprint Plan**: [sprint-29-implementation.md](../MVP/Todo/sprint-29-implementation.md)

> **Feb 2026 change**: Image Generator (#4) and Image Editor (#5) have been **merged** into a single Image Tool. Models swapped from Nano Banana/Gemini/Flux to **Kling Image O3/v3** for a unified Kling pipeline.

## Why This Matters for MyShortReel

**Problem Solved**: Creators need to generate and iteratively edit images — for keyframes, thumbnails, backgrounds, concept art — before animating them into video. Two separate tools create friction; one merged tool with Generate/Edit tabs is cleaner.

### User Benefit & Added Value for MyReelDream

The Image Tool is the **entry point to the entire creation pipeline**. Users generate an image, refine it with prompt-based editing, then send it directly to Kling I2V for video — all within one ecosystem. The unified Kling pipeline (Kling Image → Kling Video) produces more visually consistent results than mixing model families. For MyReelDream, this means:
- **Lower barrier to entry**: users start creating in seconds (text → image), no learning curve.
- **Pipeline lock-in**: "Use in Video" button moves images directly to video generation — natural upsell.
- **Cost efficiency**: $0.028/image is negligible; the real revenue comes from video generation downstream.
- **Demo value**: For VCs, showing "generate → edit → animate" in one flow demonstrates a complete product, not a feature.

## Model Strategy

| Mode | Model | Pricing | Key Feature |
|------|-------|---------|-------------|
| **Generate (default)** | Kling Image O3 T2I | $0.028/img (1K/2K), 2× for 4K | Series mode (2–9 related images), 4K, elements |
| **Generate (optional)** | Kling Image v3 T2I | $0.028/img | Negative prompt |
| **Edit** | Kling Image v3 I2I | $0.028/img | Prompt + image → transformation, elements (face control) |
| **Edit (multi-ref)** | Kling Image O3 I2I | $0.028/img | 1–10 reference images, @Image1/@Image2, aspect "auto" |

## Features (Merged)

### Generate mode
- 🖼️ **Text-to-Image**: O3 T2I default (series mode, 4K); v3 T2I optional (negative prompt)
- 🎨 **Aspect Ratios**: 16:9, 9:16, 1:1, 4:3, 3:4, 3:2, 2:3, 21:9
- 📊 **Resolution**: 1K / 2K / 4K (O3); 1K / 2K (v3)
- 🧑 **Elements**: Character/object control (frontal + reference images, @Element1/@Element2)
- 🔢 **Batch**: num_images 1–9 (single) or series_amount 2–9 (related, O3)

### Edit mode
- ✏️ **Prompt-based editing**: Upload or select image → enter prompt → I2I → new version
- 🔄 **Iterative**: Same image, multiple edits; each = new version in shared history
- 📎 **Multi-ref (O3)**: Upload up to 10 reference images; reference as @Image1–@Image10
- 🧑 **Elements**: Face/object control in edit mode

### Shared
- 📜 **Version history**: Convex-backed, persisted across sessions (generate + edit in one list)
- ⬇️ **Download / Copy / "Use in Video"**: Per image; "Use in Video" passes URL to Kling I2V pipeline
- 💳 **Credits**: Deduct per generation and edit; existing credit system
- 🔐 **Auth**: Clerk; history scoped by user

## Integration Path

| Phase | Hours | Description |
|-------|-------|-------------|
| Schema + Convex actions (T2I + I2I) | 3–4h | `imageToolHistory` table, `klingT2I` and `klingI2I` actions (queue + poll) |
| Generate mode UI | 2–3h | Wire Sprint 23 UI to Kling T2I, add O3/v3 toggle, elements |
| Edit mode UI | 2–3h | Add Edit tab, upload/select refs, I2I action |
| History + "Use in Video" + polish | 2–3h | Shared history component, mobile, i18n, error handling |
| **Total** | **10–14h** | |

## Success Metrics

- ✅ Generate (O3 and v3) produces image(s) stored in history; credits deducted; elements supported
- ✅ Edit (O3 multi-ref, v3 single) with file upload for refs; result in history; credits deducted
- ✅ History list with download, copy, "Use in Video"
- ✅ Mobile-friendly and i18n-ready

## Time Estimate: **10–14 hours** ✅

---

# 6️⃣ REVE STUDIO (Reference Implementation)

**Repository**: [reve-studio](https://github.com/blendi-remade/reve-studio)  
**Status**: ⭐ **STUDY ONLY (Excellent Patterns)**

## Why This Matters for MyShortReel

**Problem Solved**: Demonstrates world-class service architecture for async AI operations and webhook handling. Not for direct integration, but patterns are invaluable.

**Learning Value**:
- ✅ Multi-provider AI abstraction pattern
- ✅ Webhook-based async processing
- ✅ Supabase + Next.js architecture
- ✅ Service-oriented design
- ✅ Real-world production code

## What to Extract & Study

### 1. FalService Pattern ⭐⭐⭐⭐⭐ (HIGHEST PRIORITY)
- **What**: Abstract provider interface for AI generation
- **Learn**: How to structure multi-provider support
- **Extract**: Service abstraction pattern
- **Apply to**: MyShortReel video generation pipeline

**Code Pattern**:
```typescript
interface AIProvider {
  submitGeneration(input: string, context: unknown): Promise<RequestId>
  handleWebhook(payload: WebhookPayload): Promise<void>
  getStatus(requestId: string): Promise<Status>
}
```

### 2. Webhook Handling ⭐⭐⭐⭐⭐
- **What**: Reliable async completion callbacks
- **Learn**: How to handle fal.ai/external service callbacks
- **Pattern**: Store request_id, match on completion, update status
- **Apply to**: Video generation completion, batch processing

### 3. Supabase Integration ⭐⭐⭐⭐
- **What**: Database + auth + real-time setup
- **Learn**: Trigger-based denormalization (likes_count)
- **Pattern**: Service role key for mutations, anon for reads
- **Apply to**: MyShortReel DB layer (already using Supabase)

### 4. Service Layer Architecture ⭐⭐⭐⭐
- **What**: CommentService, PostService separation
- **Learn**: How to organize business logic
- **Pattern**: Service classes with dependency injection
- **Apply to**: MyShortReel services

### 5. Type Safety ⭐⭐⭐⭐
- **What**: Generated types from Supabase schema
- **Learn**: End-to-end type safety from DB to frontend
- **Pattern**: DB schema → Supabase types → Components
- **Apply to**: MyShortReel type system

## Key Learnings to Apply

1. **Provider Abstraction**: Build AI service layer that's pluggable
2. **Webhook Resilience**: Implement retry logic, idempotency
3. **Status Tracking**: Maintain clear state machine for async ops
4. **Database Design**: Denormalize for performance (likes_count)
5. **Service Composition**: Keep services focused, composable

## Time to Study & Apply: **2-3 days** (for patterns, not code)

---

# 7️⃣ NODE BANANA (Reference Implementation)

**Repository**: [node-banana](https://github.com/shrimbly/node-banana)  
**Status**: ⭐ **REFERENCE ONLY (Architectural Excellence)**

## Why This Matters for MyShortReel

**Problem Solved**: Not a tool to integrate, but demonstrates world-class architecture for visual workflow editing and DAG execution.

**Learning Value**:
- ✅ Provider registry pattern
- ✅ Topological sort for DAG execution
- ✅ Multi-provider model selection
- ✅ Cost tracking abstraction
- ✅ Grid detection algorithm

## What to Learn (Don't Extract Code)

### 1. Provider Registry Pattern ⭐⭐⭐⭐⭐
- **What**: How to abstract multiple AI services
- **Learn**: Factory pattern for provider selection
- **Apply to**: Create MyShortReel provider registry

```typescript
class ProviderRegistry {
  providers: Map<string, AIProvider>
  
  register(name: string, provider: AIProvider) { ... }
  getProvider(name: string): AIProvider { ... }
  getAllModels(): Model[] { ... }
}
```

### 2. Topological Sort for DAG ⭐⭐⭐⭐
- **What**: Execute workflow nodes in dependency order
- **Learn**: O(V+E) algorithm for workflow execution
- **Apply to**: Video processing pipelines, batch operations

### 3. Cost Calculation ⭐⭐⭐⭐
- **What**: Track and estimate AI generation costs
- **Learn**: Provider pricing abstraction
- **Apply to**: MyShortReel billing system

### 4. Grid Detection Algorithm ⭐⭐⭐⭐
- **What**: Detect grid boundaries in contact sheets
- **Learn**: Edge detection, aspect ratio scoring
- **Apply to**: Batch image processing

### 5. State Management Pattern ⭐⭐⭐⭐
- **What**: Zustand with 200+ actions
- **Learn**: How to structure large state objects
- **Apply to**: Complex feature state management

## Time to Study: **1-2 days** (reference only)

---

# 8️⃣ AI ADS SCALING (NOT RECOMMENDED)

**Repository**: [ai-ads-creation](https://github.com/elpiarthera/ai-ads-creation)  
**Status**: ❌ **SKIP (Prototype Only)**

## Why NOT to Build This

### Critical Issues
1. **99% Mocked** - All AI operations are fake, hardcoded data
2. **No Video Generation** - Core feature missing
3. **6-8 Weeks to Real** - Unrealistic ROI for effort
4. **Better Alternatives Exist** - Runway, Adobe Firefly, Synthesia
5. **Low Differentiation** - Not core to MyShortReel's mission

### What's Missing
- ❌ Video analysis (intent extraction)
- ❌ Variation generation (AI models)
- ❌ Meta Ads integration
- ❌ Real project storage
- ❌ Error recovery
- ❌ Automated tests

## Alternative: Use Design Reference
- 📋 Study UI/UX patterns (hand-drawn aesthetic)
- 📐 Reference component organization
- ❌ DO NOT attempt to build feature

## Time & Recommendation: **SKIP (6-8 weeks saved)** ✅

---

# 9️⃣ SEQ FULL NLE (PARTIAL INTEGRATION)

**Repository**: [seq](https://github.com/headline-design/seq)  
**Status**: 🔄 **EXTRACT TIMELINE HOOKS ONLY (Not Full App)**

## Why Extract Only

**Full Seq Integration**:
- ❌ 6-8 weeks minimum
- ❌ Desktop-only UI (not mobile-friendly)
- ❌ Storyboard workflow different from MyShortReel
- ❌ High complexity, uncertain payoff

**Timeline Hooks Only**:
- ✅ 14-18 hours for hooks
- ✅ Proven, battle-tested code
- ✅ High reusability
- ✅ Low risk, predictable scope

## What to Extract (See Item #3)

**Already covered in Timeline Editor section above**

### Key Takeaway
- ✅ Extract timeline hooks + utilities
- ✅ Extract FFmpeg export pipeline
- ✅ Extract audio/video rendering
- ❌ DO NOT extract full Seq editor
- ❌ DO NOT use storyboard module from Seq
- ❌ BUILD storyboard as separate feature

## Time for Hook Extraction: **14-18 hours** ✅

---

# 📋 Execution Plan & Timeline

## Recommended Prioritization

### Week 1: Foundation (Parallel Development)
```
Team Size: 5 people (can work in parallel)

Sprint 1 (Days 1-4): Component Extraction
├─ Person A: Prompt Generator UI + hooks
├─ Person B: Timeline Editor hooks extraction & tests
├─ Person C: Image Generator component
├─ Person D: Storyboard UI components
└─ Person E: Seq FFmpeg export integration

Deliverables:
✅ Reusable component/hook libraries
✅ Test suite for extracted code
✅ Documentation & examples
```

### Week 2: API Integration (Parallel)
```
Sprint 2 (Days 5-10): Backend Wiring

├─ Person A: Prompt Generator APIs
├─ Person B: Timeline Editor integration with assets
├─ Person C: Image Generator FAL.ai wiring
├─ Person D: Storyboard generation APIs
└─ Person E: Export pipeline testing

Deliverables:
✅ API routes working
✅ Convex tables created
✅ End-to-end workflows functional
```

### Week 3: Persistence & Polish (Parallel)
```
Sprint 3 (Days 11-15): Convex Integration & UI Polish

├─ Person A: Prompt history table + UI
├─ Person B: Timeline project persistence
├─ Person C: Image library integration
├─ Person D: Storyboard project saving
└─ Person E: Cross-feature testing

Deliverables:
✅ All data persisted to Convex
✅ User can save/load projects
✅ Mobile responsive
```

### Week 4: Testing & Launch (Focused)
```
Sprint 4 (Days 16-20): Testing, Docs, Launch

├─ Full team: E2E testing
├─ Full team: Performance optimization
├─ Full team: Error handling
├─ Full team: Documentation
└─ Full team: Launch preparation

Deliverables:
✅ All tests passing
✅ Performance acceptable
✅ Production-ready
✅ Deployed to staging/production
```

## Total Timeline: **4 weeks** with 5-person team

## Work Allocation

```
Person 1 (Frontend): Prompt Generator + Image Generator
Person 2 (Timeline): Timeline Editor hooks + export
Person 3 (Backend): API routes + Convex mutations
Person 4 (Storyboard): Storyboard Generator + UI
Person 5 (QA/DevOps): Testing, performance, deployment
```

## Critical Path

```
Timeline Editor hooks → FFmpeg export → Convex integration
    ↓
All features → Integration testing → Performance tuning → Launch
```

---

# 💡 Architecture & Patterns to Establish

## 1. Mini-App Template Pattern

Each feature should follow:
```
features/
├── [feature-name]/
│   ├── components/      # UI components
│   ├── hooks/          # React hooks
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   ├── api/            # API routes
│   ├── tests/          # Unit + integration tests
│   └── README.md       # Feature documentation
```

## 2. Service Layer Pattern (from Reve)

```typescript
// Every feature has services
export class FeatureService {
  async createItem(input: Input): Promise<Output>
  async getItem(id: string): Promise<Output>
  async updateItem(id: string, updates: Partial<Input>): Promise<Output>
  async deleteItem(id: string): Promise<void>
}

// Services are tested independently
// Services are composable with other services
// Services abstract complexity from routes/components
```

## 3. Hooks Architecture (from Awesome Prompts & Seq)

```typescript
// Use custom hooks for complex logic
export function useFeatureLogic(id: string) {
  const [state, setState] = useState(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const action = useCallback(async (input: Input) => {
    try {
      setLoading(true)
      const result = await FeatureService.doSomething(input)
      setState(result)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [id])
  
  return { state, loading, error, action }
}

// Components are thin, mostly composition
// Logic is testable and reusable
```

## 4. Type Safety (from all projects)

```typescript
// Full TypeScript with strict mode
// Generated types from Convex schema
// Discriminated unions for status/enums
// No `any` types

type Status = 'pending' | 'processing' | 'complete' | 'failed'
type Feature = ImageGenerator | VideoEditor | Prompter

// Leverage type system for correctness
```

## 5. Error Handling (from Reve Studio)

```typescript
// Try-catch in every async function
try {
  const result = await service.doSomething()
  return success(result)
} catch (error) {
  return failure(error.message)
}

// User-friendly error messages
// Structured error logging
// Graceful degradation
```

## 6. Testing Pattern

```typescript
// Unit tests for services
// Component tests with React Testing Library
// E2E tests with Playwright
// Coverage > 80%

describe('FeatureService', () => {
  it('should create item', async () => {
    const result = await service.createItem(input)
    expect(result).toEqual(expected)
  })
})
```

---

# 📊 Tech Stack Summary

All selected features use:

| Layer | Technology | Version | Status |
|-------|-----------|---------|--------|
| Framework | Next.js | 16 | ✅ Current |
| Language | TypeScript | 5 | ✅ Strict |
| React | 19 | ✅ Latest |
| Styling | Tailwind CSS | 4 | ✅ Latest |
| UI | Radix UI | Latest | ✅ Compatible |
| State | React Hooks | - | ✅ In use |
| Backend | Convex | Cloud | ✅ In use |
| Database | Convex (reactive) | Latest | ✅ In use |
| Auth | Clerk + OAuth | Latest | ✅ In use |
| AI | FAL.ai | Latest | ✅ Integrated |
| Deployment | Vercel | Serverless | ✅ In use |

**Zero new dependencies needed** for core integration! 🎉

---

# 🎯 Success Criteria

## MVP Launch Criteria

- ✅ Image Tool (Merged): Generate + Edit working with Kling Image O3/v3, Convex persistence, credits
- ✅ Prompt Generator: Complete with history & favorites
- ✅ Cinematography Prompt Studio MVP: 5 hero presets, Kling 3.0 formatter, multi-shot builder
- ✅ Storyboard Generator: Complete workflow end-to-end
- ✅ Timeline Editor hooks: Extracted, tested, documented
- ✅ Compare Models: Multi-model benchmark functional
- ✅ All Convex tables created with proper indexes
- ✅ All actions implemented with error handling and credit refund
- ✅ Mobile responsive for all features
- ✅ Documentation complete
- ✅ Zero known critical bugs

## Performance Targets

- ✅ Page load < 2 seconds
- ✅ Feature interactions < 200ms
- ✅ Video export start < 5 seconds
- ✅ Image generation feedback < 1 second
- ✅ Convex mutations < 500ms

## User Feedback Targets

- ✅ Feature discovery obvious (not hidden)
- ✅ Error messages helpful and actionable
- ✅ Keyboard navigation supported
- ✅ Accessibility: WCAG AA standard
- ✅ Mobile experience equal to desktop

---

# 📚 Study & Learning Path

### Study Order (2 weeks)

1. **Monday-Tuesday**: Awesome Prompts (prompt engineering pattern)
2. **Wednesday**: Seq (timeline editing, workflow design)
3. **Thursday**: Node Banana (provider abstraction, DAG execution)
4. **Friday**: Reve Studio (service architecture, webhooks)
5. **Monday (Week 2)**: v0-for-images (conversation UX, version tracking, auto-save patterns)
6. **Tuesday (Week 2)**: v0 Benchmark (provider routing, cost calculation, streaming UI)

### Key Questions to Answer

- How do providers abstract different AI services?
- How is async processing handled reliably?
- How are large components kept maintainable?
- What patterns support mobile responsiveness?
- How is state managed at scale?

### Recommended Reading

1. Read each README carefully
2. Trace the happy path through code
3. Study error handling approaches
4. Review type definitions
5. Check test coverage
6. Review database schemas

---

# 🚀 Launch Readiness Checklist

### Before Week 1 Starts

- ❌ [ ] Team assigned and trained
- ❌ [ ] Repository access verified
- ❌ [ ] Development environment setup
- ❌ [ ] Figma designs for UI approved
- ❌ [ ] Convex tables planned
- ❌ [ ] API design reviewed
- ❌ [ ] Testing strategy documented

### End of Week 1

- ❌ [ ] All components extracted
- ❌ [ ] All hooks extracted
- ❌ [ ] Basic tests written
- ❌ [ ] Documentation started

### End of Week 2

- ❌ [ ] All APIs implemented
- ❌ [ ] Convex tables created
- ❌ [ ] E2E workflows functional
- ❌ [ ] Integration tests passing

### End of Week 3

- ❌ [ ] All features persist to Convex
- ❌ [ ] Mobile responsive
- ❌ [ ] Performance acceptable
- ❌ [ ] Error handling comprehensive

### End of Week 4

- ❌ [ ] All tests passing
- ❌ [ ] Documentation complete
- ❌ [ ] No critical bugs
- ❌ [ ] Performance targets met
- ❌ [ ] Ready for production launch

---

# 💰 Estimated Resource Cost

## Team & Timeline
- **Team Size**: 5 people
- **Duration**: 4 weeks
- **Cost**: 5 people × 4 weeks × 40 hours = 800 person-hours
- **Rate**: ~$100-150/hour (average developer)
- **Total**: $80,000 - $120,000

## Infrastructure Costs (Monthly)
- **Supabase**: $25-100
- **FAL.ai**: $100-500 (image/video generation)
- **Vercel**: $20-100
- **Google Cloud**: $50-200 (if using GCS)
- **Total**: $200-900/month

## Long-Term Value
- ✅ 4 production-ready features
- ✅ Reusable component library
- ✅ Service patterns for future features
- ✅ Strong foundation for scaling

---

# 🎓 Key Learnings & Principles

## 1. Prefer Extraction Over Building
- Extract proven code from other projects
- Reduces risk, speeds delivery
- Focuses effort on adaptation, not reimplementation

## 2. Service-Oriented Architecture
- Separate concerns (services, components, API)
- Easier to test, maintain, scale
- Pattern learned from Reve Studio

## 3. Type Safety First
- Full TypeScript with strict mode
- Generated types from schema
- Reduces bugs, improves DX

## 4. Async Processing Patterns
- Webhooks for long-running operations
- Polling for user feedback
- Future: WebSockets for real-time

## 5. Modularity Over Features
- Build reusable hooks/services
- Compose from building blocks
- Enables rapid feature development

## 6. Test Early, Test Often
- Unit tests for services (easy)
- Component tests for UI (medium)
- E2E tests for workflows (hard, but valuable)
- Coverage > 80% for critical paths

---

# 📞 Questions to Answer Before Launch

1. **Mobile Priority**: Are these features mobile-first or desktop-first?
2. **Performance**: What are acceptable latency targets?
3. **Monetization**: Should features be paid or free?
4. **Scaling**: How many concurrent users expected?
5. **Expansion**: Are there follow-up features planned?
6. **Support**: Who handles post-launch issues?
7. **Analytics**: What metrics matter most?
8. **User Testing**: When should we start with real users?

---

# 10️⃣ V0-FOR-IMAGES (Image Editor)

**Repository**: [v0-for-images](https://github.com/elpiarthera/v0-for-images)  
**Status**: ⚠️ **EXTRACT PATTERNS ONLY (Don't directly integrate)**

## Why This Analysis Matters

**What it is**: AI-powered iterative image editing via natural language. Chat-like interface where users upload image and iteratively refine it through prompts.

**Assessment**: Provides valuable **UI/UX patterns** (conversation-based workflows, version tracking, auto-save), but **doesn't warrant direct integration** due to feature overlap with planned Image Generator.

## What to Extract

### 1. Conversation-Based Workflow Pattern ⭐⭐⭐⭐⭐
- **What**: Grouping all interactions into isolated "conversations" with message history and artifacts
- **Value**: Excellent UX for generative tools (users understand chat paradigm)
- **Application**: Timeline Editor (projects/sequences), Storyboard Generator (boards), Prompt Generator (refinement sessions)
- **Effort to extract**: 3-5h (can be generic container component)

### 2. Version Tracking with Thumbnails ⭐⭐⭐⭐
- **What**: Every generated artifact gets unique ID, displayed in thumbnail grid allowing "time-travel" editing
- **Value**: Users understand edit history visually; can branch from any previous version
- **Application**: Timeline editor (show previous clip arrangements), Storyboard (previous layouts)
- **Effort to extract**: 2-3h (reusable grid component)

### 3. Server Route Handler Pattern ⭐⭐⭐⭐⭐
- **What**: `/api/generate-image` route that manages API credentials, calls FAL.ai, logs operations
- **Value**: Clean separation of concerns; easy provider swapping; enables credit management server-side
- **Application**: Standardize all `/api/[feature]/generate` endpoints across tools
- **Effort to extract**: 1-2h (document pattern, create template)

### 4. Auto-Save with Debounce ⭐⭐⭐⭐
- **What**: Automatically save state to persistence layer on changes with debounce
- **Value**: No explicit "Save" button; prevents data loss; reduces DB writes
- **Application**: All conversation-based features (auto-save to Convex)
- **Effort to extract**: 1-2h (custom hook: `useAutoSave()`)

### 5. UI Components Library ⭐⭐⭐
- **What**: All Radix UI + Tailwind CSS 4 components (Button, Dialog, Select, Input, Textarea)
- **Value**: Already compatible with MyShortReel (identical tech stack)
- **Application**: Direct copy (zero refactoring needed)
- **Effort to extract**: 1h (copy components directory)

## Why NOT Direct Integration

| Reason | Impact |
|--------|--------|
| **Feature Overlap** | Image Generator already planned (8-12h); v0-for-images would be redundant |
| **Integration Cost** | 88-128h to add Clerk + Convex + credits system |
| **Architectural Mismatch** | Uses IndexedDB; MyShortReel uses Convex (different persistence layer) |
| **API Key Storage** | Currently localStorage; needs migration to environment variables |
| **No Unique Value** | Doesn't offer features Image Generator won't provide |

## Pattern Extraction Timeline

**Estimated effort to extract all 5 patterns**: **8-12 hours**

### Breakdown:
- 1. Conversation component: 3-5h
- 2. Version grid component: 2-3h
- 3. Server route pattern (document): 1-2h
- 4. Auto-save hook: 1-2h
- 5. UI components: 1h

### Application to other features:
- Timeline Editor: 4-5h (implement conversation + version tracking)
- Storyboard Generator: 4-5h (same as Timeline)
- Prompt Generator: 2-3h (conversation model only)

**Total ROI**: Extract 8-12h once, apply to 3 tools = 10-13h savings per tool

## Convex Schema Pattern (for reference)

For conversation-based features:

```typescript
export const conversations = defineTable({
  userId: v.id("users"),
  title: v.string(),
  messages: v.array(v.object({
    id: v.string(),
    type: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number(),
  })),
  artifacts: v.array(v.object({
    id: v.string(),
    type: v.string(),
    versionNumber: v.number(),
    url: v.optional(v.string()),
    metadata: v.any(),
  })),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_updated", ["userId", "updatedAt"]);
```

## Files to Reference

For implementation guidance:
- Pattern docs: [MINI-APP-V0-FOR-IMAGES-ANALYSIS.md](./MINI-APP-V0-FOR-IMAGES-ANALYSIS.md)
- Server route pattern: `/api/generate-image/route.ts`
- Conversation UI: `app/page.tsx` (study state management, auto-save)
- All UI components: `components/ui/*` (copy as-is)

---

# 14️⃣ CINEMATOGRAPHY PROMPT STUDIO (DirectorsConsole CPE + Kling 3.0)

**Source Repository**: [DirectorsConsole](https://github.com/NickPittas/DirectorsConsole) (Cinema Prompt Engineering Engine)  
**Target Model**: Kling 3.0 / O3 via FAL.ai  
**Status**: ✅ **READY TO SHIP (MVP ~20h) — UNIQUE DIFFERENTIATOR**  
**Full Analysis**: [MINI-APP-CINEMATOGRAPHY-PROMPT-STUDIO-ANALYSIS.md](./MINI-APP-CINEMATOGRAPHY-PROMPT-STUDIO-ANALYSIS.md)

## Why This Matters for MyShortReel

**Problem Solved**: Users write flat, generic video prompts that produce generic output. Cinematography Prompt Studio provides structured, film-quality prompt composition using real cinematography parameters (shot size, camera movement, lens, lighting, color grade, mood) validated by physical/historical plausibility rules, formatted specifically for Kling 3.0's native cinematic understanding.

### User Benefit & Added Value for MyReelDream

This is MyReelDream's **competitive moat**. No other consumer video tool offers structured cinematography presets (Blade Runner, Ghibli, Wes Anderson, etc.) with validated camera/lens/lighting rules feeding directly into a model that natively understands cinematic language. For users, it's the difference between "a video" and "a cinematic video" — one click to get Blade Runner aesthetics, with the CPE engine preventing physically impossible combinations. For MyReelDream:
- **Unique differentiation**: No competitor has this. Defensible advantage.
- **Quality multiplier**: Structured prompts produce measurably better video output (est. >30% quality improvement over freeform).
- **Education + retention**: Users learn cinematography vocabulary as they use the tool; "disabled options with reasons" teaches why certain combinations don't work.
- **Pipeline amplifier**: CPE-generated prompts benefit every downstream tool — Storyboard Generator, Scene Generator, Ad Assets, Quick Video.
- **Premium positioning**: Justifies higher pricing tier; film-quality presets = professional positioning.

## Model Strategy

| Endpoint | Purpose | Model ID |
|----------|---------|----------|
| Kling 3.0 Pro T2V | Multi-shot text-to-video (primary) | `fal-ai/kling-video/v3/pro/text-to-video` |
| Kling 3.0 Standard I2V | Cost-effective image-to-video | `fal-ai/kling-video/v3/standard/image-to-video` |
| Kling O3 Pro T2V | Highest-quality storyboard generation | `fal-ai/kling-video/o3/pro/text-to-video` |
| Kling Image 3.0 T2I | 4K keyframe generation | `fal-ai/kling-image/v3/text-to-image` |

## Core Features (MVP)

- 🎬 **Film Preset Selector**: Curated presets (Blade Runner, Barry Lyndon, Ghibli, Spider-Verse, Wes Anderson, etc.) — one click to apply full "camera package" (lens, lighting, color grade, movement style)
- 🎥 **Structured Prompt Builder**: Step-by-step composition with real cinematography parameters (shot size, camera movement, composition, lighting, lens, color/grade, mood, pacing)
- 🎞️ **Multi-Shot Sequence Builder**: Compose up to 6 labeled shots for Kling 3.0's native multi-shot support
- 🗣️ **Character & Dialogue Direction**: Define characters with visual traits + voice binding for native audio
- ⚠️ **Validation Rules**: Warns about physically impossible combos (handheld + macro, anamorphic pre-1953, noir + pastel)
- 🎬 **One-Click Generation**: Generate with Kling 3.0 Standard/Pro/O3

## Time Estimation

| Phase | Hours |
|-------|-------|
| **MVP (5 hero presets, formatter, basic selectors, 3-shot builder)** | **~20h** |
| Full studio (all presets, validation rules, keyframe workflow, history) | 35-55h |

## Risk Assessment

- ⚠️ **CPE port**: Python/Pydantic → TypeScript/Zod. Mitigated by starting with data-only port (presets as JSON), adding rules engine later.
- ✅ **Kling 3.0 fit**: Model natively understands cinematic language — CPE output maps 1:1 to Kling's expected input format.

---

# 🏁 Final Recommendation

## Ship This (7 features, 5-6 weeks):
1. ✅ **Image Tool (Merged)** (10-14h) — Kling Image O3/v3, Sprint 29, **SHIP FIRST**
2. ✅ Prompt Generator (16-24h)
3. ✅ **Cinematography Prompt Studio MVP** (~20h) — **unique differentiator**
4. ✅ Storyboard Generator (18-24h)
5. ✅ Timeline Editor hooks (14-18h)
6. ✅ Compare Models / v0 Benchmark (12-16h)
7. ✅ Scene Generator (32-48h) — Kling 3.0 I2V swap

## Study These (1-2 weeks):
8. ⭐ Reve Studio (FalService pattern)
9. ⭐ Node Banana (provider abstraction)
10. ⭐ v0-for-images (extract patterns: conversation UI, version tracking, auto-save)

## Optional (if time allows):
11. 🔄 Ad Assets Generator (40-56h)

## Skip:
12. ❌ AI Ads Scaling (6-8 weeks, low ROI)
13. ❌ Seq full NLE (use hooks only)

---

# 📚 Detailed Analysis Documents Reference

All 14 mini-apps have comprehensive analysis documents available:

## MVP Apps (Ready to Ship)
1. **Image Tool (Merged)** → [MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md](./MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md) — Kling Image O3/v3, Sprint 29
2. **Prompt Generator** → [MINI-APP-AWESOME-VIDEO-PROMPTS-ANALYSIS.md](./MINI-APP-AWESOME-VIDEO-PROMPTS-ANALYSIS.md)
3. **Cinematography Prompt Studio** → [MINI-APP-CINEMATOGRAPHY-PROMPT-STUDIO-ANALYSIS.md](./MINI-APP-CINEMATOGRAPHY-PROMPT-STUDIO-ANALYSIS.md) — CPE + Kling 3.0
4. **Storyboard Generator** → [MINI-APP-SEQ-STORYBOARD-GENERATOR-ANALYSIS.md](./MINI-APP-SEQ-STORYBOARD-GENERATOR-ANALYSIS.md)
5. **Timeline Editor** → [MINI-APP-SEQ-TIMELINE-EDITOR-ANALYSIS.md](./MINI-APP-SEQ-TIMELINE-EDITOR-ANALYSIS.md)
6. **Compare Models (v0 Benchmark)** → [MINI-APP-V0-AI-IMAGE-GENERATION-BENCHMARK-ANALYSIS.md](./MINI-APP-V0-AI-IMAGE-GENERATION-BENCHMARK-ANALYSIS.md)
7. **Scene Generator** → [MINI-APP-SCENE-GENERATOR-ANALYSIS.md](./MINI-APP-SCENE-GENERATOR-ANALYSIS.md) — Kling 3.0 I2V swap

## Superseded (merged into Image Tool)
- ~~Image Generator~~ → [MINI-APP-IMAGE-GENERATOR-ANALYSIS.md](./MINI-APP-IMAGE-GENERATOR-ANALYSIS.md) — superseded by merged Image Tool
- ~~Image Editor~~ → [MINI-APP-IMAGE-EDITOR-ANALYSIS.md](./MINI-APP-IMAGE-EDITOR-ANALYSIS.md) — superseded by merged Image Tool

## Optional (Phase 2)
8. **Ad Assets Generator** → [MINI-APP-AD-ASSETS-GENERATOR-ANALYSIS.md](./MINI-APP-AD-ASSETS-GENERATOR-ANALYSIS.md)

## Reference Implementations
9. **Reve Studio** → [MINI-APP-REVE-STUDIO-ANALYSIS.md](./MINI-APP-REVE-STUDIO-ANALYSIS.md)
10. **Node Banana** → [MINI-APP-NODE-BANANA-ANALYSIS.md](./MINI-APP-NODE-BANANA-ANALYSIS.md)
11. **v0-for-images** → [MINI-APP-V0-FOR-IMAGES-ANALYSIS.md](./MINI-APP-V0-FOR-IMAGES-ANALYSIS.md)

## Not Recommended
12. **AI Ads Scaling (Full)** → [MINI-APP-AI-ADS-CREATION-ANALYSIS.md](./MINI-APP-AI-ADS-CREATION-ANALYSIS.md)
13. **Seq Full NLE** → [MINI-APP-SEQ-ANALYSIS.md](./MINI-APP-SEQ-ANALYSIS.md)

## Models Reference
- **Kling 3.0 Models (10 models)** → [KLING-3-MODELS-ANALYSIS.md](./KLING-3-MODELS-ANALYSIS.md)

## Quick Reference
- **Overall Summary**: [ANALYSIS-COMPLETE.md](./ANALYSIS-COMPLETE.md) - Implementation checklist
- **Timeline Extraction Details**: See Seq analysis for 13 timeline hooks
- **Pattern Library**: See Reve Studio, Node Banana, v0-for-images for reusable patterns

---

**Document Status**: Ready for Development Assignment  
**Next Step**: Review detailed analyses → Schedule team kickoff → Assign roles → Begin Week 1 planning  
**References**: All analysis documents in docs/Analysis/ folder

---

**Version**: 3.0  
**Last Updated**: February 10, 2026  
**Author**: Implementation & Analysis Team  
**Total Analysis**: 14 mini-apps, 16 documents, ~130-180 development hours planned  
**Key Changes (v3.0)**: Image Generator + Editor merged into Image Tool (Kling Image O3/v3); Cinematography Prompt Studio added as #14; models updated to Kling 3.0 pipeline; user benefit sections added to all mini-apps
