# 🎞️ Mini App #6a: Timeline Editor - Standalone Implementation Analysis

**Extracted From**: [Seq](https://github.com/headline-design/seq) - AI-Native Video Production NLE  
**Feature**: Professional Multi-Track Timeline Editor  
**Date**: January 21, 2026  
**Status**: Analysis Complete

---

## Executive Summary

The **Seq Timeline Editor** is a **production-ready, multi-track video editor** that can be extracted and integrated as a **standalone feature** into MyShortReel. It provides professional NLE capabilities (trim, split, effects, real-time playback) without requiring the full Seq storyboard/generation pipeline.

**Architecture Quality**: Excellent (hook-based, modular, 99% TypeScript)  
**Tech Stack Alignment**: ✅ **Perfect** - Next.js 16, React 19, TypeScript, Tailwind 4  
**Estimated Integration Time**: **14-18 hours** (hooks + basic UI rebuild)  
**Complexity Level**: ⭐⭐⭐ **High** - Advanced timeline logic, but well-structured  

> ✅ **Verdict: HIGHLY DOABLE** - Extract timeline hooks as reusable library, rebuild UI for MyShortReel. Fast, high-quality, zero technical blockers.

---

## What is the Timeline Editor?

The **Seq timeline editor** is a **professional-grade, browser-based NLE** (Non-Linear Editor) for multi-track video, audio, and text editing. Think **DaVinci Resolve or Premiere Pro in the browser**.

### Core Workflow
```
Load Video Assets → Create Tracks → Add Clips → Edit (trim/split/effects) 
→ Arrange Timeline → Preview → Export to MP4
```

### Who Uses It?
- Video editors (professional)
- Content creators (YouTube, TikTok, shorts)
- Anyone needing multi-track editing without desktop software

### Why Extract It?
- MyShortReel needs **post-production editing** capabilities
- Video export is a core feature
- Timeline editing unlocks advanced workflows
- Code is battle-tested, modular, reusable

---

## Feature Set (Timeline Editor Only)

### ✅ Editing Operations
- **Clip Management**
  - Add video/audio/image clips to timeline
  - Trim clips (set start/end points)
  - Split clips at any point
  - Duplicate clips
  - Delete clips (ripple or leave gap)
  - Reorder clips on tracks
  - Set clip speed (0.5x to 2.0x)

- **Multi-Track Editing**
  - Create/delete video tracks
  - Create/delete audio tracks
  - Create/delete text overlay tracks
  - Lock tracks to prevent accidental edits
  - Mute individual tracks
  - Solo individual tracks
  - Per-track volume control

- **Playback & Preview**
  - Real-time video preview
  - Audio sync with video
  - Current time scrubbing
  - Playback speed control (0.5x to 2.0x)
  - Frame-by-frame navigation
  - Full-screen preview

- **Timeline Navigation**
  - Zoom in/out on timeline
  - Scroll horizontal/vertical
  - Magnetic snapping (snap-then-overlap behavior)
  - Keyboard shortcuts (Space=play, S=split, Delete=remove, etc.)
  - Markers/chapters for organization
  - Full undo/redo history (unlimited)

- **Effects & Adjustments**
  - Per-clip brightness (-100 to +100)
  - Contrast adjustment
  - Saturation adjustment
  - Opacity (fade in/out)
  - Blur effect
  - Per-track volume mixing
  - Audio level meters (visual feedback)

- **Transitions**
  - Cross-fade (video and audio)
  - Dip-to-black
  - Wipe effects
  - Custom transition duration
  - Fade-in/fade-out per clip

- **Text Overlays (Titles, Subtitles)**
  - Add text to timeline
  - Customize font, size, color, background
  - Position on canvas (x/y percentage)
  - Text animations: fade-in, fade-out, slide-up, slide-down, typewriter
  - Multiple text tracks

- **Advanced Features**
  - Marquee selection (drag to select multiple clips)
  - Multi-select (Shift+click)
  - Clip locking to prevent edits
  - History stack with undo/redo
  - Accessibility: reduced motion support, ARIA labels
  - Mobile-safe (touch-friendly, no hover deps)

### ❌ NOT Included
- Storyboard generation (separate mini-app)
- Video synthesis (fal.ai generation)
- Automatic color correction
- 3D transforms or advanced effects
- Motion graphics templates
- Layer effects/compositing
- Multi-project support
- Collaboration/version control

---

## Technical Architecture

### Hook-Based State Management (Reusable)

The timeline editor uses **13 specialized hooks** extracted from the main component:

```typescript
// Core state management
const timelineState = useTimelineState(initialProject)
  ├── clips, tracks, media, selection, history
  └── Methods: addClip, deleteClip, updateClip, undo, redo, etc.

// Playback control
const playback = usePlayback(videoRef, audioRef)
  ├── currentTime, isPlaying, duration
  └── Methods: play, pause, seek, setSpeed

// Drag and drop
const drag = useTimelineDrag(draggingClip, constraints)
  └── Magnetic snapping, position updates

// Multi-select
const selection = useTimelineSelection(clips, tracks)
  ├── selectedClips, selectedTracks
  └── Methods: select, deselect, toggleSelect

// Keyboard shortcuts
const keyboard = useTimelineKeyboard(timelineState)
  └── Space=play, S=split, Delete=remove, Ctrl+Z=undo, etc.

// Effects processing
const effects = useClipEffects(selectedClip)
  ├── brightness, contrast, saturation, opacity
  └── Real-time canvas adjustments

// Transitions
const transitions = useTransitions(clips)
  └── Cross-fade, dip-to-black, wipe, duration

// Audio mixing
const audio = useAudioMixing(audioContext)
  ├── Per-track volume, mute, solo
  └── Live level meters

// Video/canvas rendering
const rendering = useTimelineRendering(canvas, ctx)
  ├── Composite clips frame-by-frame
  └── Apply effects, transitions, overlays

// FFmpeg export
const ffmpeg = useFFmpegExport()
  ├── Load WASM, render frames, encode MP4
  └── Progress callbacks, error handling

// Undo/redo
const history = useHistory(timelineState)
  ├── Stack-based implementation
  └── Configurable history limit (default 50 steps)

// Performance optimization
const virtualization = useVirtualizedTimeline(clips, viewportWidth)
  └── Only render visible clips
```

### Component Structure
```
TimelineEditor (orchestrator)
├── TimelineHeader
│   ├── Timeline controls (zoom, play, etc.)
│   └── Time ruler
│
├── TracksPanel
│   ├── Track header (name, mute, solo, lock)
│   ├── TimelineTrack
│   │   └── ClipItem[] (draggable, selectable)
│   └── Add track button
│
├── PreviewWindow
│   ├── Canvas element
│   ├── Video/audio rendering
│   ├── Effects display
│   └── Text overlay compositing
│
├── EffectsPanel (selected clip)
│   ├── Brightness/Contrast/Saturation sliders
│   ├── Opacity control
│   ├── Blur effect
│   └── Transition duration picker
│
└── ExportPanel
    ├── Resolution selector (720p/1080p)
    ├── Aspect ratio
    ├── Progress bar
    └── Export button
```

### Type Definitions

```typescript
interface TimelineClip {
  id: string                    // Unique ID
  mediaId: string               // Reference to source media
  trackId: string               // Which track
  start: number                 // Start time (seconds)
  duration: number              // Length of clip
  offset: number                // Trim start in source video
  endTrim?: number              // Trim end in source video
  speed: number                 // Playback speed (0.5-2.0)
  volume?: number               // Audio volume (0-100)
  
  // Effects
  effects?: {
    brightness: number          // -100 to 100
    contrast: number
    saturation: number
    opacity: number             // 0 to 100
    blur?: number               // 0 to 20
  }
  
  // Transitions to next clip
  transition?: {
    type: 'crossfade' | 'dip-to-black' | 'wipe'
    duration: number            // seconds
  }
  
  // Text overlay (if applicable)
  textOverlay?: TextOverlayStyle
  
  // Metadata
  isLocked: boolean
  tags?: string[]
  createdAt: number
}

interface Track {
  id: string
  name: string
  type: 'video' | 'audio' | 'text'
  volume?: number              // for audio
  isMuted: boolean
  isSolo: boolean
  isLocked: boolean
  backgroundColor?: string     // for text tracks
}

interface TimelineProject {
  version: string              // "1.0.0"
  name: string
  clips: TimelineClip[]
  tracks: Track[]
  aspectRatio: '16:9' | '9:16' | '1:1' | 'custom'
  fps: 30 | 60                 // Framerate
  duration: number             // Total length (seconds)
  createdAt: number
  updatedAt: number
}

interface MediaItem {
  id: string
  url: string                  // blob: or https:
  type: 'video' | 'audio' | 'image'
  duration: number             // seconds
  width?: number
  height?: number
  aspectRatio: string          // "16:9"
  thumbnail?: string           // preview image URL
  status: 'ready' | 'loading' | 'error'
}
```

---

## Integration Complexity

### 🟢 Easy (Reusable As-Is)
- All 13 hook implementations
- Type definitions
- Utility functions (time formatting, snap calculations)
- History/undo system
- Keyboard shortcut bindings
- Effects logic

**Effort**: 2-3 hours (copy-paste, no changes needed)

### 🟡 Medium (Minor Adaptation)
- Convert hooks to standalone hooks (remove component imports)
- Create API adapter for video export (FAL.ai or MyShortReel's system)
- Add test suite (hooks lack tests currently)
- Refactor state management if needed (optional)

**Effort**: 3-5 hours

### 🔴 Complex (Rebuild)
- **All UI components** (must match MyShortReel design system)
- Timeline track layout
- Clip item rendering
- Effect sliders/controls
- Preview window styling
- Export dialog

**Effort**: 8-10 hours

---

## Time Estimation

### Phase 1: Hook Extraction & Testing (3-4 hours)
- Copy timeline hooks to `lib/timeline-editor/hooks/`
- Extract types and utilities
- Remove UI dependencies
- Add unit tests for each hook
- **Deliverable**: Reusable hook library with tests

### Phase 2: Adapter Layer (2-3 hours)
- Create API adapter for video export
- Inject FFmpeg handler (or use fal.ai)
- Create Convex persistence adapter (optional)
- Handle storage (S3/Blob for temp files)
- **Deliverable**: Provider abstraction layer

### Phase 3: UI Component Rebuild (6-8 hours)
- TimelineEditor wrapper component
- Track list and header (simplified)
- Clip item (drag-drop, select, trim)
- Effects panel (sliders for brightness, etc.)
- Preview canvas (basic rendering)
- Export button
- Match MyShortReel design system
- **Deliverable**: Working timeline editor UI

### Phase 4: Integration & Testing (2-3 hours)
- Wire into MyShortReel editor
- Connect asset management
- Test with real videos
- Mobile responsiveness check
- Error handling
- **Deliverable**: Production-ready

### **TOTAL: 14-18 hours**

### Breakdown by Role
- **Backend**: 2-3 hours (FFmpeg, export API)
- **Frontend**: 10-12 hours (UI rebuild + integration)
- **QA**: 1-2 hours (testing, validation)

---

## Data Structure for MyShortReel

### Minimal Timeline Project (Persisted in Convex)

```typescript
// MyShortReel timeline project
export const timelineProjects = defineTable({
  userId: v.string(),           // Clerk user ID
  sceneId: v.optional(v.id("scenes")),  // Link to parent scene (if editing scene)
  
  name: v.string(),
  description: v.optional(v.string()),
  
  // Timeline structure (JSON serialized)
  projectData: v.object({
    version: v.string(),
    clips: v.array(v.object({
      id: v.string(),
      mediaId: v.string(),       // Asset ID
      trackId: v.string(),
      start: v.number(),         // seconds
      duration: v.number(),
      offset: v.number(),        // trim start
      speed: v.number(),
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
    
    tracks: v.array(v.object({
      id: v.string(),
      name: v.string(),
      type: v.union(v.literal("video"), v.literal("audio"), v.literal("text")),
      isMuted: v.boolean(),
    })),
    
    aspectRatio: v.string(),     // "16:9", "9:16", etc.
    duration: v.number(),        // Total length
  }),
  
  // Metadata
  thumbnail: v.optional(v.string()),  // Preview image URL
  isArchived: v.boolean(),
  
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"])
 .index("by_scene", ["sceneId"])
```

**Mutations Needed:**
```typescript
export const createTimelineProject = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    sceneId: v.optional(v.id("scenes")),
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

export const saveTimelineExport = mutation({
  args: {
    projectId: v.id("timelineProjects"),
    videoUrl: v.string(),        // Exported video URL (S3/Blob)
    duration: v.number(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    // Store export result
    await ctx.db.insert("timelineExports", {
      projectId: args.projectId,
      videoUrl: args.videoUrl,
      duration: args.duration,
      fileSize: args.fileSize,
      createdAt: Date.now(),
    })
  }
})
```

---

## Implementation Strategy

### Step 1: Extract Hook Library (3-4 hours)

```bash
# Copy timeline hooks to dedicated folder
mkdir -p lib/timeline-editor/hooks
cp seq/components/editor/hooks/*.ts lib/timeline-editor/hooks/

# Extract types
cp seq/components/editor/types.ts lib/timeline-editor/types.ts

# Extract utilities
cp seq/components/editor/utils/* lib/timeline-editor/utils/
```

**Create index exports:**
```typescript
// lib/timeline-editor/index.ts
export * from './hooks/use-timeline-state'
export * from './hooks/use-playback'
export * from './hooks/use-timeline-drag'
export * from './hooks/use-clip-effects'
export * from './types'
export * from './utils'
```

**Audit imports and remove UI dependencies:**
```typescript
// Before
import { Button } from '@/components/ui/button'  // ❌ Remove
import TimelineClip from './timeline-clip'        // ❌ Remove

// After
// No imports from UI components or React components
// Only exports logic and types
```

### Step 2: Add Test Suite (2-3 hours)

```typescript
// lib/timeline-editor/hooks/__tests__/use-timeline-state.test.ts
describe('useTimelineState', () => {
  it('should add a clip to timeline', () => {
    const { clips, addClip } = useTimelineState()
    addClip({ mediaId: '123', trackId: 'video-1', start: 0, duration: 5 })
    expect(clips).toHaveLength(1)
  })
  
  it('should delete a clip', () => {
    // ...
  })
  
  it('should undo and redo', () => {
    // ...
  })
  
  it('should trim a clip', () => {
    // ...
  })
})
```

### Step 3: Create Adapter Layer (2-3 hours)

```typescript
// lib/timeline-editor/adapters/video-export-adapter.ts
export interface VideoExportProvider {
  exportToMP4(
    canvasFrames: Blob[],
    audioWav: Blob,
    options: ExportOptions
  ): Promise<Blob>
  
  uploadToStorage(blob: Blob, filename: string): Promise<string>
}

// MyShortReel implementation
export const createMyShortReelExportAdapter = (): VideoExportProvider => ({
  exportToMP4: async (frames, audio, options) => {
    // Use FFmpeg WASM or call MyShortReel's export API
    const ffmpeg = new FFmpeg()
    // ... encoding logic
  },
  
  uploadToStorage: async (blob, filename) => {
    // Upload to S3 or Vercel Blob
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: blob,
      headers: { 'X-Filename': filename }
    })
    return response.json().url
  }
})
```

### Step 4: Rebuild UI Components (6-8 hours)

```typescript
// components/timeline-editor/TimelineEditor.tsx
import { useTimelineState, usePlayback, useClipEffects } from '@/lib/timeline-editor'

export function TimelineEditor({ projectId }: { projectId: string }) {
  const timelineState = useTimelineState()
  const playback = usePlayback(videoRef, audioRef)
  const selectedClip = timelineState.clips[timelineState.selectedClipId]
  const effects = useClipEffects(selectedClip)
  
  return (
    <div className="timeline-editor">
      <div className="timeline-header">
        <TimelineControls 
          isPlaying={playback.isPlaying}
          onPlay={playback.play}
          onPause={playback.pause}
        />
      </div>
      
      <div className="timeline-content">
        <TracksPanel 
          tracks={timelineState.tracks}
          clips={timelineState.clips}
          onClipUpdate={timelineState.updateClip}
          onDeleteClip={timelineState.deleteClip}
        />
        
        <PreviewWindow 
          videoRef={videoRef}
          audioRef={audioRef}
          currentTime={playback.currentTime}
        />
      </div>
      
      {selectedClip && (
        <EffectsPanel 
          clip={selectedClip}
          effects={effects}
          onEffectChange={effects.updateEffect}
        />
      )}
      
      <ExportPanel 
        projectId={projectId}
        duration={timelineState.duration}
      />
    </div>
  )
}
```

### Step 5: Integration (2-3 hours)

```typescript
// app/editor/timeline/page.tsx (or within existing editor)
import { TimelineEditor } from '@/components/timeline-editor'
import { useAuth } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

export default function TimelineEditorPage() {
  const { userId } = useAuth()
  const projectId = useSearchParams().get('project')
  
  // Load timeline project
  const project = useQuery(
    api.timeline.getProject,
    { projectId }
  )
  
  // Save project on changes
  const updateProject = useMutation(api.timeline.updateProject)
  
  const handleProjectSave = (projectData) => {
    updateProject({ projectId, projectData })
  }
  
  return (
    <div className="timeline-editor-page">
      <TimelineEditor 
        projectId={projectId}
        initialData={project}
        onSave={handleProjectSave}
      />
    </div>
  )
}
```

---

## Performance Considerations

### Canvas Rendering
- **Problem**: Rendering all clips at 30fps is CPU-intensive
- **Solution**: Use virtualization (only render visible clips in viewport)

```typescript
// Already implemented in Seq via use-virtualized-clips hook
const visibleClips = useVirtualizedClips(clips, viewportStart, viewportEnd)
// Only render clips within visible timeline range
```

### Memory Management
- **Problem**: Blob URLs consume memory
- **Solution**: Clean up unused blob URLs

```typescript
useEffect(() => {
  return () => {
    // Cleanup blob URLs on unmount
    clips.forEach(clip => {
      if (clip.url.startsWith('blob:')) {
        URL.revokeObjectURL(clip.url)
      }
    })
  }
}, [])
```

### Audio Sync
- **Problem**: Audio and video can drift
- **Solution**: Use RAF (requestAnimationFrame) with audio timestamp

```typescript
useEffect(() => {
  const raf = requestAnimationFrame(() => {
    if (audioRef.current && videoRef.current) {
      const diff = Math.abs(
        audioRef.current.currentTime - videoRef.current.currentTime
      )
      if (diff > 0.1) {
        // Resync
        audioRef.current.currentTime = videoRef.current.currentTime
      }
    }
  })
  return () => cancelAnimationFrame(raf)
}, [])
```

---

## Success Criteria

### MVP (14-18 hours)
✅ Hooks extract cleanly  
✅ useTimelineState fully functional (add, trim, delete clips)  
✅ usePlayback syncs with video  
✅ Clip effects (brightness, etc.) work  
✅ Undo/redo functional  
✅ Keyboard shortcuts working  
✅ UI renders without errors  
✅ Export to MP4 works (720p)  
✅ 80%+ test coverage  

### Phase 2 (Optional)
❓ Mobile responsiveness  
❓ 1080p export  
❓ Advanced transitions  
❓ Multi-project support  

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| FFmpeg WASM bundle size | Medium | Medium | Tree-shake unused code, lazy load |
| Audio sync drift | Low | Medium | RAF-based resync, tolerance threshold |
| Memory usage on long videos | Medium | Medium | Implement chunked rendering |
| Browser tab freeze during export | High | Low | Use Web Worker for FFmpeg |
| UI component conflicts | Low | Low | Isolated component scope, CSS modules |
| Performance on older devices | Medium | Medium | Profile and optimize hot paths |

**Mitigation**: Add FFmpeg Web Worker to prevent main thread blocking

---

## Comparison: Other Options

### Option A: Timeline Editor (Extract Hooks) ✅ RECOMMENDED
- **Effort**: 14-18 hours
- **ROI**: Very high (reusable, modular)
- **Risk**: Low (battle-tested code)
- **Reusability**: Can use for audio editing, subtitle timeline, effects timeline

### Option B: Use Existing Editor (If MyShortReel has one)
- **Effort**: 2-4 hours (integration only)
- **ROI**: Depends on existing implementation
- **Risk**: May not have advanced features (undo/redo, effects, etc.)

### Option C: Buy Third-Party Library
- **Effort**: 4-6 hours (licensing, setup)
- **Cost**: $$$
- **ROI**: Lower (proprietary, licensing complexity)
- **Risk**: Vendor lock-in

---

## Recommendation

### **✅ HIGHLY RECOMMENDED: Extract Timeline Editor**

**Why:**
1. **Fast**: 14-18 hours, low effort
2. **High quality**: Battle-tested in production, 99% TypeScript
3. **Reusable**: Can extract as npm package
4. **Strategic**: Foundation for advanced editing features
5. **Low risk**: Well-documented hooks, modular architecture

**Next Steps:**
1. ✅ Extract hooks to `lib/timeline-editor/`
2. ✅ Add test suite
3. ✅ Create API adapter layer
4. ✅ Rebuild UI for MyShortReel design
5. ✅ Integrate and test with real videos
6. ✅ Publish as npm package for team reuse

**Timeline**: 1 week for full extraction and integration

---

## Conclusion

The **Seq timeline editor is ideal for MyShortReel**:
- ✅ Professional-grade features (multi-track, effects, real-time playback)
- ✅ Clean, modular architecture (hooks-based)
- ✅ No external dependencies (self-contained)
- ✅ Fast integration (14-18 hours)
- ✅ Reusable for other features (audio editing, subtitles)
- ✅ Production-ready code quality

**Go for it!** Extract the hooks, rebuild the UI, and you'll have a world-class timeline editor in MyShortReel within 1-2 weeks.

---

**Document Version**: 1.0  
**Last Updated**: January 21, 2026  
**Author**: Implementation Team  
**Status**: Ready for Development
