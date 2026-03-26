# 🎬 Mini App #6: AI-Native Video Production Studio (Seq) - Implementation Analysis

**Repository**: [seq](https://github.com/headline-design/seq)  
**Also Known As**: Seq Studio - AI-Native Video NLE  
**Date**: January 21, 2026  
**Status**: Analysis Complete

---

## Executive Summary

Seq is an **ambitious, production-ready AI-native Non-Linear Editor (NLE)** built with Next.js 16, React 19, TypeScript, and featuring advanced timeline editing, storyboard generation, and browser-based video export via FFmpeg WASM. It's a fully-featured video production studio designed for creators.

**Architecture Quality**: Excellent (modular, hook-based, well-documented)  
**Tech Stack Alignment**: ✅ **Perfect** - Identical to MyShortReel (Next.js 16, React 19, TypeScript, Tailwind 4)  
**Estimated Integration Time**: **32-48 hours MINIMUM** (core engine only, requires significant refactoring and UI rebuild)  
**Complexity Level**: ⭐⭐⭐⭐⭐ **HIGHEST** - Full NLE is massive undertaking

> ⚠️ **Key Finding**: While Seq's architecture is excellent, integrating the **full NLE is not recommended** for MyShortReel's scope. However, the **timeline editor hooks (~2,500 LOC) and video export pipeline (FFmpeg integration) are highly reusable**. Consider extracting these as standalone libraries for future features.

---

## Feature Overview

### ✅ Core Capabilities

#### 1. AI Storyboard Generator
- **Text-to-Storyboard**: Describe your video in natural language
- **Master Image Generation**: Gemini 3 Pro creates a visual "master" image
- **Panel Extraction**: AI intelligently extracts individual panels from master
- **Prompt Enhancement**: Claude/GPT via FAL.ai optimizes prompts for video generation
- **Manual Panel Selection**: Users curate final sequence and duration
- **Transition Generation**: AI creates smooth bridging frames between panels (WAN 2.2/2.5)

**Workflow:**
```
User Input → Gemini Master Image → Panel Processor (AI extraction)
  → Enhanced Prompts → Video Generation (Veo 3.1/WAN) → Timeline Integration
```

#### 2. Multi-Model Video Synthesis
- **Veo 3.1 Fast**: Quick iterations, 4-8 second clips
- **Veo 3.1 Standard**: Balanced quality/speed
- **WAN 2.2 Turbo**: First-to-last frame smooth transitions
- **WAN 2.5**: Up to 1080p native resolution
- **Minimax**: Alternative fast text-to-video

**Capabilities:**
- Text-to-video generation
- Image-to-video animation
- First-last-frame bridging
- Aspect ratio flexibility (16:9, 9:16, 1:1, 4:3, 21:9, custom)

#### 3. Professional Timeline Editor (Core NLE)
**Editing Features:**
- Multi-track editing (video, audio, text)
- Clip operations: trim, split, duplicate, ripple delete
- Transitions: cross-dissolve, dip-to-black, wipes
- Effects: brightness, contrast, saturation, blur, opacity, volume
- Text overlays with animations (fade, slide, typewriter)
- Magnetic snapping with drag-then-overlap behavior
- Real-time playback with audio sync
- Markers/chapters for timeline organization
- Undo/redo history stack (unlimited)
- Keyboard shortcuts (Space=play, S=split, Delete, etc.)
- Virtualized rendering for performance

**Advanced Timeline Features:**
- Audio waveform visualization
- Frame-by-frame scrubbing
- Playback speed control
- Multi-select and marquee selection
- Magnetic snapping with configurable threshold
- Ripple editing (delete one clip, shift others)
- Clip locking for protection
- Track muting/soloing
- Accessibility: reduced motion support, ARIA labels

#### 4. Browser-Based Export
**Pipeline:**
- **Audio rendering**: Offline AudioContext mixing to WAV
- **Video rendering**: Canvas-based frame composition (30fps)
- **Encoding**: FFmpeg WASM final MP4 encoding
- **Download**: Client-side only (no server upload)

**Export Options:**
- 720p (1280×720) - Default
- 1080p (1920×1080) - Higher quality
- 30fps fixed framerate
- 8Mbps bitrate
- MP4 H.264 codec

#### 5. Media Management
- Image upload and processing
- Video import from files
- Audio track import
- Media library management
- Thumbnail generation
- Aspect ratio detection
- Format conversion (HEIC → JPEG via heic-to)

### ❌ NOT Included

- Multi-user collaboration (single-user only)
- Cloud project storage (browser localStorage only, 50MB limit)
- User authentication or accounts (no session management)
- Mobile editing (explicitly blocked, desktop-only)
- Subscription/payment management
- Real-time collaboration/syncing
- Advanced color correction/grading
- 3D effects or transforms
- Motion graphics templates
- Asset library management
- Team/organization features

---

## Technology Stack

| Layer | Technology | MyShortReel Compatibility |
|-------|-----------|--------------------------|
| **Framework** | Next.js 16 (App Router) | ✅ Perfect match (version ahead) |
| **Language** | TypeScript 5 (strict, 99% type coverage) | ✅ Perfect match |
| **Styling** | Tailwind CSS 4.0 + PostCSS 4.0 | ✅ Perfect match |
| **UI Components** | shadcn/ui (24+ components) | ✅ Compatible |
| **Icons** | Lucide React | ✅ Compatible |
| **State Management** | React Hooks + Context | ✅ Perfect match |
| **Theming** | CSS variables, light/dark mode | ✅ Compatible |
| **Notifications** | Sonner (toast) | ✅ Already in use |
| **Forms** | React Hook Form + Zod | ✅ Already in use |
| **AI Integration** | Vercel AI SDK, AI Gateway | ✅ Already integrated |
| **Video Models** | FAL.ai SDK | ✅ Already integrated |
| **Image Processing** | Canvas API, FFmpeg WASM | ✅ New requirement |
| **Storage** | Vercel Blob (optional) | ⚠️ Can use MyShortReel S3 |
| **Deployment** | Vercel (optional) | ⚠️ Custom deployment needed |
| **Build System** | Next.js built-in (no Turborepo) | ✅ Compatible |

---

## Architecture Assessment

### Strengths (Exceptional)

✅ **Modular Feature Architecture**: Each feature (editor, storyboard) self-contained  
✅ **Hook-Based State Management**: 13+ specialized hooks for timeline logic  
✅ **99%+ TypeScript Coverage**: No `any` types, strict mode enabled  
✅ **Separated Concerns**: UI, logic, and utilities clearly partitioned  
✅ **Editor Refactored Well**: Reduced from 3,000+ lines to ~1,500 via hooks  
✅ **Performance Optimizations**: React.memo, virtualization, RAF throttling  
✅ **Professional NLE Features**: Real-time playback, magnetic snapping, undo/redo  
✅ **Browser-Based Export**: No server required, client-side processing  
✅ **Type-Safe API Integration**: Full interfaces for all data shapes  
✅ **Clear Data Models**: Discriminated unions, proper enums for statuses  

### Weaknesses (Critical for MyShortReel Integration)

⚠️ **NO TEST SUITE** → Need to add Jest/Vitest (must-have before integration)  
⚠️ **Browser-Only Rendering** → CPU-intensive, slow on older machines  
⚠️ **FFmpeg WASM** → Large bundle (~80MB), slower than native FFmpeg  
⚠️ **Mobile Incompatible** → Explicitly blocked, no responsive UI  
⚠️ **No Cloud Storage** → Projects only in localStorage (50MB limit)  
⚠️ **Tight API Integration** → Hardcoded fal.ai/Gemini keys, no abstraction layer  
⚠️ **Vercel-Specific** → Uses Vercel Blob, AI Gateway (not portable)  
⚠️ **Single-User Only** → No authentication, no multi-user support  
⚠️ **Heavy UI Dependencies** → 24+ shadcn components, Radix UI, would conflict  
⚠️ **No Error Recovery** → Failed exports must restart from scratch  
⚠️ **No Progress Reporting** → Long-running operations have no feedback  
⚠️ **Legacy Naming** → Session storage keys reference "nano-banana" (old project)  

---

## Feature Coverage Map

| Feature | Type | Integration | Value to MyShortReel | Effort |
|---------|------|-----------|---------------------|--------|
| Timeline editor core | Logic | Reusable hooks | CRITICAL - multi-track editing | 2-3 days |
| Magnetic snapping | Logic | Direct copy | HIGH - UX polish | 1 day |
| Undo/redo history | Logic | Direct copy | HIGH - editor stability | 4 hours |
| Audio/video playback | Logic | Direct copy | HIGH - preview essential | 2-3 days |
| Clip trim/split/delete | Logic | Direct copy | HIGH - editing operations | 1 day |
| Text overlay system | UI/Logic | Partial rebuild | MEDIUM - captions/graphics | 2-3 days |
| Effects (brightness, etc.) | Logic | Direct copy | MEDIUM - post-processing | 1 day |
| FFmpeg export pipeline | Integration | Reusable | HIGH - video export | 2 days |
| Storyboard generation | Integration | Adapt | MEDIUM - content creation | 3-5 days |
| Video synthesis (fal.ai) | Integration | Direct copy | HIGH - already integrated | 1 day |
| UI components (editor) | UI | REBUILD REQUIRED | HIGH - must match MyShortReel | 2-3 weeks |
| Storyboard UI | UI | REBUILD REQUIRED | MEDIUM | 1-2 weeks |
| Dark/light theme | UI | Direct copy | LOW - design system | 2 hours |
| Mobile responsiveness | UI | NOT SUPPORTED | MEDIUM - critical for mobile-first | 2-3 weeks |
| Project persistence | Infrastructure | Needs refactor | HIGH - use Convex instead | 2-3 days |

---

## Integration Complexity Assessment

### 🟢 Easy - Direct Copy (Reusable)
- Hook contracts (use-timeline-state, use-playback, use-media-generation)
- Type definitions and interfaces
- Utility functions (time formatting, clip calculations)
- API proxy patterns
- Keyboard shortcut handling
- Undo/redo stack implementation
- FAL.ai integration patterns

**Effort**: ~3-4 days

### 🟡 Medium - Minor Refactoring
- Extract editor hooks into standalone library
- Create API abstraction layer (inject providers)
- Adapt storyboard workflow to MyShortReel context
- Convert localStorage to Convex persistence
- Add test suite (critical before integration)
- Refactor session storage (remove legacy naming)

**Effort**: ~1-2 weeks

### 🔴 Complex - Complete Rebuild
- **All UI components** - Match MyShortReel design system, not Seq's aesthetic
- **Mobile version** - Seq is desktop-only, MyShortReel is mobile-first
- **API integration layer** - Adapt Vercel-specific code to MyShortReel backend
- **Project storage** - Use Convex instead of localStorage
- **Authentication** - Wire Clerk integration
- **Error recovery** - Add resumable exports, progress reporting
- **Performance tuning** - FFmpeg WASM is slow, may need native alternative

**Effort**: ~3-4 weeks minimum

### ❌ NOT Recommended
- Direct copy-paste integration (incompatible UI, missing features)
- Monolithic inclusion (too large, too different from MyShortReel)
- Timeline editor as-is (need to rebuild UI, customize for mobile)

---

## Time Estimation Breakdown

### 🚀 Quick Integration (Just Timeline Hooks) - 8-12 hours
If you **ONLY want the timeline state management** without the full NLE:

- Extract use-timeline-state hook (~2 hours)
- Adapt to MyShortReel clip structure (~2 hours)
- Test integration with existing components (~2 hours)
- Documentation (~1 hour)
- **Deliverable**: Reusable timeline state management

### 📦 Modular Integration (Core + Export) - 2-3 weeks
Extract timeline editor and export pipeline as reusable library:

**Phase 1: Hook Extraction (3-4 days)**
- Isolate all timeline hooks
- Create adapter layer for API providers
- Add test suite
- Document hook contracts
- **Deliverable**: `@myshorteel/timeline-editor` package

**Phase 2: Export Pipeline (2-3 days)**
- Extract FFmpeg WASM integration
- Create upload/progress interface
- Adapt to MyShortReel video formats
- Test export on various files
- **Deliverable**: Reusable export pipeline

**Phase 3: UI Adaptation (1-2 weeks)**
- Rebuild timeline UI for MyShortReel design
- Mobile responsiveness
- Keyboard shortcuts customization
- Accessibility audit
- **Deliverable**: Production timeline editor UI

### 🎯 Full NLE Integration - 6-8 weeks MINIMUM
Including storyboard generator, all features, mobile support:

**Phase 1: Refactoring & Testing (1-2 weeks)**
- Extract core engine from UI
- Add comprehensive test suite
- Create API abstraction layer
- Document architecture
- **Deliverable**: Testable core engine

**Phase 2: Backend Integration (1-2 weeks)**
- Project storage via Convex (not localStorage)
- Authentication with Clerk
- Video file storage (S3/Blob)
- Credit system integration (if applicable)
- **Deliverable**: Production backend

**Phase 3: UI Rebuild (2-3 weeks)**
- Timeline editor UI (match MyShortReel)
- Storyboard UI (match MyShortReel)
- Mobile version (critical)
- Accessibility improvements
- **Deliverable**: Full NLE UI

**Phase 4: Advanced Features & Optimization (1-2 weeks)**
- Native FFmpeg (if needed)
- Progress reporting for long operations
- Resumable exports
- Error recovery
- Caching optimization
- **Deliverable**: Production-ready NLE

### ⚠️ NOT RECOMMENDED - Full Integration Timeline
**Why?** 
- Seq is designed as standalone app, not component library
- MyShortReel is mobile-first, Seq is desktop-only
- UI aesthetic completely different
- Would require 2+ months for production-quality integration
- High risk of scope creep
- Better ROI: extract timeline hooks + export pipeline only

---

## Data Structure for MyShortReel Adaptation

### Current Seq Timeline Format
```typescript
interface TimelineClip {
  id: string                  // Instance ID
  mediaId: string             // Source media reference
  trackId: string             // Target track
  start: number               // Start time (seconds)
  duration: number            // Length
  offset: number              // Trim point in source
  speed: number               // Playback speed
  volume?: number
  transition?: {
    type: string
    duration: number
  }
  effects?: ClipEffects
  textOverlay?: TextOverlayStyle
  fadeIn?: number
  fadeOut?: number
  isLocked?: boolean
}

interface Track {
  id: string
  name: string
  type: "video" | "audio" | "text"
  volume?: number
  isMuted?: boolean
  isLocked?: boolean
}

interface MediaItem {
  id: string
  url: string                 // blob: or https:
  prompt?: string             // Generation prompt
  duration: number
  aspectRatio: string
  type: "video" | "audio" | "image"
  status: "generating" | "ready" | "error"
  thumbnailUrl?: string
}
```

### Adapted for MyShortReel
```typescript
interface MyShortReelTimelineClip {
  id: string
  mediaId: string              // Reference to Asset
  trackId: string
  start: number                // Seconds
  duration: number
  offset: number               // Trim start in source
  endTrim?: number             // Trim end in source
  speed: number                // 0.5 to 2.0
  
  // MyShortReel additions
  assetId: string              // Link to Asset document
  sceneId: string              // Parent scene
  
  // Effects using MyShortReel patterns
  effects?: {
    brightness: number         // -100 to 100
    contrast: number
    saturation: number
    opacity: number            // 0 to 100
    blur?: number
  }
  
  // Audio
  audioTracks?: {
    trackId: string
    volume: number
    isMuted: boolean
  }[]
  
  // Text overlay (if captions)
  textOverlay?: {
    text: string
    startTime: number
    duration: number
    style: TextOverlayStyle
  }
  
  // Transitions to next clip
  transition?: {
    type: "crossfade" | "dip-to-black" | "wipe" | "fade"
    duration: number
  }
  
  // Metadata
  isLocked: boolean
  tags?: string[]
  notes?: string
  createdAt: number
  updatedAt: number
}
```

### Convex Schema Needed

```typescript
// Timeline projects (if persisting)
export const timelineProjects = defineTable({
  userId: v.string(),           // Clerk user ID
  name: v.string(),
  description: v.optional(v.string()),
  
  // Timeline structure
  tracks: v.array(v.object({
    id: v.string(),
    name: v.string(),
    type: v.union(v.literal("video"), v.literal("audio"), v.literal("text")),
    isMuted: v.boolean(),
  })),
  
  clips: v.array(v.object({
    id: v.string(),
    mediaId: v.id("assets"),     // Link to asset
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
    transition: v.optional(v.object({
      type: v.string(),
      duration: v.number(),
    })),
  })),
  
  // Metadata
  aspectRatio: v.union(v.literal("16:9"), v.literal("9:16"), v.literal("1:1")),
  duration: v.number(),          // Total length
  
  createdAt: v.number(),
  updatedAt: v.number(),
  isArchived: v.boolean(),
}).index("by_user", ["userId"])
 .index("by_created", ["createdAt"])
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| FFmpeg WASM bundle too large | High | Medium | Evaluate native FFmpeg alternative, use service worker |
| Mobile UI rebuild incompleteness | High | High | Start mobile-first, iterate with real devices |
| API integration key management | Medium | High | Create abstraction layer early, use env vars |
| Browser limitations (memory, CPU) | Medium | Medium | Implement chunked processing, fallback paths |
| Test coverage gaps | High | Medium | Add comprehensive test suite before main integration |
| Performance bottlenecks | Medium | Medium | Profile early, optimize hot paths |
| Storage limits (localStorage 50MB) | Low | High | Use Convex for persistence immediately |
| Storyboard workflow too rigid | Medium | Low | Extract into configurable hooks early |
| UI component conflicts | High | Medium | Audit all shadcn components vs MyShortReel |
| Vercel-specific code (Blob, Gateway) | High | Medium | Create adapter layer, test with alternative providers |

**Contingency**: +2-3 weeks for unexpected refactoring

---

## Integration Options

### Option 1: Timeline Hooks Only (RECOMMENDED)
Extract **just the timeline state management** without the full NLE.

```typescript
// What you get:
import { useTimelineState } from '@seq/hooks'
import { usePlayback } from '@seq/hooks'
import { useFFmpegExport } from '@seq/hooks'

const { clips, tracks, addClip, deleteClip, updateClip } = useTimelineState()
const { isPlaying, currentTime, play, pause } = usePlayback()
const { exportVideo, progress } = useFFmpegExport()
```

**Effort**: 8-12 hours  
**Best For**: Incrementally enhance existing editor with Seq's battle-tested state management  
**ROI**: Very high - reuse 90% of logic, rebuild 10% of UI  

### Option 2: Full Timeline Editor (MODERATE)
Timeline state + UI rebuild for MyShortReel design.

```typescript
// Complete editor component
import { TimelineEditor } from '@seq/editor'

<TimelineEditor
  clips={clips}
  tracks={tracks}
  onClipUpdate={updateClip}
  onExport={exportVideo}
  aspectRatio="16:9"
/>
```

**Effort**: 2-3 weeks  
**Best For**: Multi-track editing in MyShortReel (pro editor, desktop)  
**ROI**: High - core NLE functionality, reusable across features  

### Option 3: Full NLE (NOT RECOMMENDED)
Complete Seq integration including storyboard generator.

```typescript
// Full studio
import { SeqStudio } from '@seq/studio'

<SeqStudio 
  userId={userId}
  onProjectSave={saveToMyShortReel}
  aspectRatio="16:9"
/>
```

**Effort**: 6-8 weeks  
**Best For**: Standalone video production tool (separate from MyShortReel)  
**ROI**: Lower - overlaps with MyShortReel's existing features, requires 2+ months  
**Risk**: High scope creep, architectural mismatch  

---

## Specific Integration Challenges

### 1. **UI Component Conflicts**
Seq includes 24+ shadcn/ui components. MyShortReel may have different versions.

```bash
# Audit required
grep -r "from '@/components/ui'" seq/
# Then verify all are compatible with MyShortReel's shadcn setup
```

**Mitigation**: Extract components to isolated npm package, use named imports carefully

### 2. **Mobile Incompatibility**
Seq explicitly blocks mobile with:
```typescript
// seq/components/editor/mobile-editor-notice.tsx
if (useIsMobile()) {
  return <MobileNotice />  // "Not supported on mobile"
}
```

**Mitigation**: Rewrite UI components for touch/mobile, test extensively

### 3. **Browser Memory Limits**
FFmpeg WASM renders all frames in memory. 10-minute video @ 1080p = 2GB+ RAM.

**Mitigation**: 
- Implement streaming/chunked export
- Add memory profiling
- Provide fallback (limit to 5-minute exports)

### 4. **Vercel-Specific Code**
Seq uses Vercel AI Gateway and Blob storage. MyShortReel uses custom backend.

**Mitigation**: Create provider abstraction layer
```typescript
// seq/lib/api-providers.ts
interface ApiProvider {
  generateImage(prompt: string): Promise<string>
  generateVideo(prompt: string): Promise<string>
  uploadBlob(blob: Blob): Promise<string>
}

// Inject provider at runtime
<EditorContext.Provider value={{ provider: myCustomProvider }}>
```

### 5. **State Persistence**
Seq uses localStorage. MyShortReel needs Convex + Clerk integration.

**Mitigation**: 
```typescript
// seq/services/project-service.ts (adapted)
const saveProject = async (data: ProjectData) => {
  // Instead of localStorage
  await api.mutations.timeline.saveProject({
    userId: user.id,
    projectData: data,
  })
}
```

### 6. **API Key Management**
Seq has hardcoded FAL_KEY and AI_GATEWAY_API_KEY checks.

**Mitigation**: Move to environment variables, validate server-side

```typescript
// Before: Direct key usage
const response = await fal.run('model-name', { ... })

// After: Server-side proxy
const response = await fetch('/api/timeline/generate-video', { ... })
```

---

## Implementation Strategy

### If Extracting Timeline Hooks Only (8-12 hours)

**Step 1: Hook Isolation (2 hours)**
- Copy hooks from `seq/components/editor/hooks/`
- Remove UI dependencies
- Audit imports
- Create standalone folder: `lib/timeline-editor/`

**Step 2: Type Definitions (1 hour)**
- Extract `seq/components/editor/types.ts`
- Adapt to MyShortReel clip structure
- Document all interfaces

**Step 3: Adapter Layer (2 hours)**
- Create `lib/timeline-editor/api-adapter.ts`
- Inject FAL.ai, Gemini, FFmpeg handlers
- Add fallback implementations

**Step 4: Testing (2 hours)**
- Unit tests for `useTimelineState`
- Integration tests with MyShortReel components
- Verify undo/redo works

**Step 5: Integration (1 hour)**
- Wire into existing editor (if exists)
- Connect to asset management
- Test end-to-end

### If Rebuilding Full Timeline Editor (2-3 weeks)

**Phase 1: Hooks + Types (3-4 days)**
- Extract timeline hooks
- Audit and document
- Add test suite

**Phase 2: UI Components (1 week)**
- Rebuild timeline scrubber
- Track headers + controls
- Clip item component
- Effects panel
- Match MyShortReel design system

**Phase 3: Integration (3-5 days)**
- Wire Clerk authentication
- Connect to Convex persistence
- Link asset management
- Test mobile responsiveness

**Phase 4: Polish (2-3 days)**
- Keyboard shortcuts
- Accessibility audit
- Performance optimization
- Documentation

---

## Convex Schema (If Persisting Timeline Projects)

```typescript
// Timeline projects
export const timelineProjects = defineTable({
  userId: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  
  // Serialized project state
  projectData: v.object({
    version: v.string(),
    tracks: v.array(v.object({
      id: v.string(),
      name: v.string(),
      type: v.union(v.literal("video"), v.literal("audio"), v.literal("text")),
      isMuted: v.boolean(),
      isLocked: v.optional(v.boolean()),
    })),
    clips: v.array(v.object({
      id: v.string(),
      mediaId: v.string(),
      trackId: v.string(),
      start: v.number(),
      duration: v.number(),
      offset: v.number(),
      speed: v.number(),
      effects: v.optional(v.object({
        brightness: v.number(),
        contrast: v.number(),
        saturation: v.number(),
        opacity: v.number(),
      })),
    })),
    aspectRatio: v.string(),
    duration: v.number(),
  }),
  
  // Metadata
  thumbnail: v.optional(v.string()),      // Preview image URL
  duration: v.number(),                   // Total length
  isArchived: v.boolean(),
  
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"])
```

**Mutations:**
```typescript
export const saveTimelineProject = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    projectData: v.object({...}),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("timelineProjects", {
      ...args,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }
})

export const updateTimelineProject = mutation({
  args: {
    projectId: v.id("timelineProjects"),
    projectData: v.object({...}),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      projectData: args.projectData,
      updatedAt: Date.now(),
    })
  }
})
```

---

## Success Criteria

### MVP (Timeline Hooks Only - 8-12 hours)
✅ Hooks extract cleanly without UI dependencies  
✅ `useTimelineState` fully functional (add, delete, update clips)  
✅ `usePlayback` syncs with video element  
✅ `useFFmpegExport` exports to MP4  
✅ Undo/redo working correctly  
✅ Type safety maintained  
✅ 80%+ test coverage  

### Phase 2 (Full Editor - 2-3 weeks)
✅ Timeline UI matches MyShortReel design  
✅ Mobile responsive (touch controls)  
✅ Keyboard shortcuts working  
✅ Effects panel functional  
✅ Trim/split/delete operations smooth  
✅ Export progress reporting  
✅ 90%+ test coverage  

### Phase 3 (Advanced - Optional)
❓ Storyboard generator integration  
❓ Multi-video project support  
❓ Advanced color correction  
❓ Transitions library  

---

## Why NOT to Integrate Full Seq

### ❌ Architectural Misalignment
- Seq is **desktop-first**, MyShortReel is **mobile-first**
- Seq is **standalone app**, MyShortReel is **component-based**
- Seq uses **Vercel-specific** services, MyShortReel is backend-agnostic

### ❌ Scope & Timeline
- Full integration = 6-8 weeks (vs. 16-24 hours for prompt generator)
- Storyboard workflow = 3-5 days, but overlaps with MyShortReel's content creation
- Browser-based export = slow on consumer hardware

### ❌ Better Alternatives
- **Just extract timeline hooks** (8-12 hours, high ROI)
- **Use native FFmpeg** (if needed) instead of WASM
- **Build custom storyboard** integration (faster, more aligned with MyShortReel)

---

## Why Extract Timeline Hooks INSTEAD

### ✅ High Reusability
- 2,500 LOC of battle-tested timeline logic
- Proven patterns for multi-track editing
- Excellent separation of concerns

### ✅ Fast Integration
- 8-12 hours for core functionality
- Can incrementally enhance existing editor
- Low risk of breaking changes

### ✅ Strategic Value
- Reusable across MyShortReel features (audio editing, subtitle timeline, etc.)
- Can publish as npm package (`@myshorteel/timeline-editor`)
- Future-proof for advanced editing features

### ✅ Better ROI
- 2 weeks work vs. 6-8 weeks full integration
- Higher quality (reuse proven code, rebuild only UI)
- Lower maintenance burden

---

## Recommendation

### **❌ DO NOT** Integrate Full Seq
- Too large, too different in architecture/UI
- Overlaps with MyShortReel's existing features
- 6-8 weeks for uncertain payoff
- Mobile compatibility a major blocker

### **✅ RECOMMENDED: Extract Timeline Hooks Library** (8-12 hours)

**Why:**
1. **Fastest**: 8-12 hours for core engine
2. **Highest quality**: Reuse 90% of battle-tested code
3. **Lower risk**: Incremental integration possible
4. **Strategic**: Reusable for other editing features
5. **Maintenance**: Less code to maintain long-term

**Implementation Path:**
```
Week 1: Extract hooks, add tests, create adapter layer
Week 2: Integrate into MyShortReel, rebuild UI components as needed
Week 3: Polish, optimize, document for team
```

**Next Steps:**
1. ✅ Isolate timeline hooks into standalone folder
2. ✅ Create test suite (Jest)
3. ✅ Document hook contracts
4. ✅ Build API adapter layer
5. ✅ Integrate into MyShortReel incrementally

---

## Comparison: All 6 Mini-Apps

| Mini-App | Tech Fit | Integration Time | Complexity | Recommendation |
|----------|----------|------------------|-----------|-----------------|
| Image Generator (Nano Banana Pro) | ✅ Perfect | 8-12 hours | Low | Quick win |
| Image Editor (easyedit) | ✅ Perfect | 12-16 hours | Medium | Good value |
| Ad Assets Generator | ⚠️ Okay | 40-56 hours | Very High | Not recommended |
| Scene Generator | ✅ Perfect | 24-36 hours | High | Excellent feature |
| Prompt Generator | ✅ Perfect | 16-24 hours | Low | Highest priority |
| **Seq (NLE)** | ✅ Perfect | **6-8 weeks (full)** or **8-12 hours (hooks)** | **Highest** | **Extract hooks only** |

---

## Risk Assessment Summary

### Technical Risks
- **FFmpeg WASM bundle size** (80MB) → Evaluate alternatives
- **Mobile incompatibility** → Would require complete UI rebuild
- **Browser memory limits** → Chunked processing needed for large videos
- **API key management** → Create abstraction layer immediately

### Business Risks
- **Scope creep** → Easy to expand to full features
- **Maintenance burden** → 15,000+ LOC of complex timeline code
- **Performance issues** → Browser rendering is slow vs. native
- **Feature duplication** → Overlaps with MyShortReel's existing editor

### Timeline Risks
- **Underestimation** → Full integration could easily be 10+ weeks
- **Dependencies** → FFmpeg WASM, Radix UI component versions
- **Testing gaps** → Seq has no test suite (must be added)

**Mitigation**: Extract hooks only, validate with team before committing to full integration

---

## Conclusion

**Seq is an architecturally excellent NLE**, but **full integration is NOT recommended** for MyShortReel given the scope and timeline. However, **the timeline editor hooks are extremely valuable** and should be extracted as a standalone library.

**Recommended Action**: 
- Extract timeline hooks + export pipeline (8-12 hours)
- Publish as reusable npm package
- Integrate incrementally
- Keep Seq as reference for future advanced editing features

**Timeline**: 1-2 weeks for full extraction and initial integration, vs. 6-8 weeks for attempting full NLE port.

---

**Document Version**: 1.0  
**Last Updated**: January 21, 2026  
**Author**: Implementation Team  
**Status**: Ready for Architecture Review
