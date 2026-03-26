# 🎨 Mini App #6b: AI Storyboard Generator - Standalone Implementation Analysis

**Extracted From**: [Seq](https://github.com/headline-design/seq) - AI-Native Video Production NLE  
**Feature**: Text-to-Storyboard with AI-Powered Video Synthesis  
**Date**: January 21, 2026  
**Status**: Analysis Complete

---

## Executive Summary

The **Seq AI Storyboard Generator** is a **self-contained, multi-step content creation tool** that transforms text descriptions into visual storyboards and video sequences. It can be extracted and integrated as a **standalone mini-app** into MyShortReel without requiring the timeline editor.

**Architecture Quality**: Excellent (modular components, clean state management)  
**Tech Stack Alignment**: ✅ **Perfect** - Next.js 16, React 19, TypeScript, Tailwind 4, FAL.ai  
**Estimated Integration Time**: **18-24 hours** (modular workflow, existing AI integrations)  
**Complexity Level**: ⭐⭐⭐ **High** - Multi-step AI pipeline, but well-documented  

> ✅ **Verdict: HIGHLY DOABLE** - Self-contained workflow, leverages existing FAL.ai and Gemini integrations. Fast, focused feature with high user value.

---

## What is the AI Storyboard Generator?

The **Seq storyboard generator** is an **intelligent visual planning tool** that helps creators turn ideas into animated sequences. It combines:

1. **Text-to-Image** (Gemini 3 Pro) → Master storyboard image
2. **AI Panel Extraction** → Individual scene panels
3. **Prompt Enhancement** → Optimized video generation prompts
4. **Video Synthesis** (FAL.ai) → Animated panels
5. **Transition Generation** → Smooth bridging between scenes

### Real-World Workflow
```
Creator: "I want a sci-fi scene with a spaceship entering an asteroid field"
  ↓
Gemini: Generates master storyboard image showing the scene composition
  ↓
AI Panel Processor: Extracts individual panels (ship approaching, asteroid danger, etc.)
  ↓
Creator: Selects and refines panels for final sequence
  ↓
Prompt Enhancement: "spaceship scene" → "cinematic wide shot of sleek spaceship approaching..."
  ↓
FAL.ai Video Models: Animate each panel (Veo 3.1 or WAN 2.5)
  ↓
Final Result: Animated storyboard sequence ready for timeline editing
```

### Who Uses It?
- **Content creators** (YouTube, TikTok, short film makers)
- **Advertisers** (quick ad concept visualization)
- **Educators** (visual storytelling)
- **Game designers** (narrative cutscenes)

### Why Extract It?
- Solves **"blank canvas syndrome"** - creators need structure before diving into editing
- Leverages **existing MyShortReel integrations** (FAL.ai, Gemini via Gateway)
- **Standalone workflow** - doesn't require timeline editor
- High user value - reduces creative friction

---

## Feature Set (Storyboard Generator Only)

### ✅ Core Workflow

#### Step 1: Initial Concept
- **Input**: Text description of your video/scene
- **Features**:
  - Free-form text input (single or multi-paragraph)
  - Preset templates for common scenarios (promo, tutorial, music video, short film, etc.)
  - Examples/suggestions for guidance
  - Character count and complexity hints

#### Step 2: Master Image Generation
- **Input**: Creator's text description
- **AI Model**: Gemini 3 Pro Image (via Vercel AI Gateway)
- **Features**:
  - Panel count suggestion (AI recommends 3-8 panels)
  - Aspect ratio selection (16:9, 9:16, 1:1, custom)
  - Style guidance ("cinematic", "cartoon", "documentary", etc.)
  - Generation status with progress feedback
  - Regenerate option if not satisfied

- **Output**: Single master image showing full storyboard layout

#### Step 3: Panel Extraction & AI Processing
- **Input**: Master image + text description
- **AI Processing**:
  - Intelligent panel boundary detection (AI identifies individual scenes)
  - Extracts each panel as separate image
  - Analyzes each panel's motion potential
  - Generates motion description for each panel

- **Features**:
  - Visual preview of detected panels
  - Manual panel order adjustment
  - Delete unwanted panels
  - Add/remove panels in sequence
  - Panel duration selection (2-8 seconds per panel)

- **Output**: Array of panel images + motion descriptions

#### Step 4: Prompt Enhancement
- **Input**: Each panel's description
- **AI Model**: Claude 3.5/GPT-4o via FAL.ai
- **Features**:
  - Automatic prompt optimization (short text → detailed video prompt)
  - Add cinematic details (camera movement, lighting, mood)
  - Model-specific optimization (Veo vs WAN requirements)
  - Manual prompt editing
  - Prompt preview/comparison (before & after)

- **Output**: Enhanced prompts ready for video generation

#### Step 5: Transition Bridging (Optional)
- **Input**: Two consecutive panels
- **AI Processing**:
  - First-last frame generation via WAN 2.2 Turbo
  - Creates smooth visual transition between scenes
  - Bridges composition, lighting, motion

- **Features**:
  - Auto-generate transitions between all panels
  - Skip transitions for abrupt cuts
  - Preview generated transitions
  - Adjust transition duration and style

- **Output**: Bridge animation frames between panels

#### Step 6: Video Generation
- **Input**: Panel images + enhanced prompts
- **AI Models** (selectable):
  - **Veo 3.1 Fast**: Quick iterations, 4-8 second clips
  - **Veo 3.1 Standard**: Balanced quality/speed
  - **WAN 2.2**: Frame-to-frame transitions
  - **WAN 2.5**: Up to 1080p native resolution

- **Features**:
  - Model selection per panel (customize quality/speed)
  - Aspect ratio consistency
  - Quality vs speed trade-off
  - Batch generation (all panels simultaneously)
  - Individual panel regeneration
  - Progress tracking per panel

- **Output**: Animated video for each panel

#### Step 7: Final Review & Export
- **Input**: Generated videos + panels
- **Features**:
  - Full sequence preview/playback
  - Individual panel video preview
  - Timeline adjustment (reorder panels)
  - Duration adjustment per panel
  - Re-generate underperforming panels
  - Export to timeline editor (if integrated)
  - Save as storyboard project

- **Output**: Final animated storyboard sequence

### ❌ NOT Included
- Video timeline editing (separate feature)
- Advanced color correction
- Audio/music integration
- Collaboration/sharing features
- Community storyboard library
- Real-time preview (async only)

---

## Technical Architecture

### Component Structure

```
StoryboardGenerator (main orchestrator)
├── Step 1: ConceptInput
│   └── Textarea + preset templates + suggestions
│
├── Step 2: MasterImageGeneration
│   ├── GenerateButton
│   ├── ProgressIndicator
│   ├── MasterImagePreview
│   ├── PanelCountSelector
│   └── StyleSelector
│
├── Step 3: PanelExtractor
│   ├── PanelPreview[] (visual grid)
│   ├── PanelOrderAdjuster (drag-reorder)
│   ├── PanelDurationSelector
│   └── RemovePanel buttons
│
├── Step 4: PromptEnhancer
│   ├── EnhancedPromptList
│   │   ├── OriginalPrompt display
│   │   ├── EnhancedPrompt display
│   │   └── EditPrompt button
│   ├── EnhanceButton
│   └── PreviewComparison
│
├── Step 5: TransitionGenerator (optional)
│   ├── TransitionPreview[]
│   ├── GenerateTransitionsButton
│   └── SkipTransitions button
│
├── Step 6: VideoGenerator
│   ├── ModelSelector (Veo/WAN)
│   ├── QualitySelector (fast/standard/high)
│   ├── GenerateButton
│   ├── ProgressGrid[] (individual panel progress)
│   └── RegenerateButton per panel
│
└── Step 7: ReviewExport
    ├── SequencePreview (playback)
    ├── ExportButton
    ├── SaveAsProjectButton
    └── SendToTimelineButton
```

### Hook Architecture (Orchestration)

```typescript
// Main orchestration hook
const useStoryboardGenerator = () => {
  const [step, setStep] = useState<Step>(1)
  const [concept, setConcept] = useState('')
  const [masterImage, setMasterImage] = useState<string | null>(null)
  const [panels, setPanels] = useState<StoryboardPanel[]>([])
  const [enhancedPrompts, setEnhancedPrompts] = useState<string[]>([])
  const [videoUrls, setVideoUrls] = useState<string[]>([])
  
  // Hooks for each step
  const masterGen = useMasterImageGeneration(concept)
  const panelProcessor = usePanelProcessor(masterImage, concept)
  const promptEnhancer = usePromptEnhancer(panels)
  const transitionGen = useTransitionGenerator(panels)
  const videoGen = useVideoGenerator(panels, enhancedPrompts)
  
  return {
    step, setStep,
    concept, setConcept,
    masterImage, generateMaster: masterGen.generate,
    panels, extractPanels: panelProcessor.extract,
    enhancedPrompts, enhance: promptEnhancer.enhance,
    transitionVideos: transitionGen.videos,
    videoUrls, generateVideos: videoGen.generate,
  }
}

// Step-specific hooks
const useMasterImageGeneration = (concept: string) => {
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [panelCount, setPanelCount] = useState(5)
  
  const generate = async () => {
    setLoading(true)
    const response = await fetch('/api/seq/generate-image', {
      method: 'POST',
      body: JSON.stringify({
        prompt: `Create a detailed storyboard layout showing: ${concept}`,
        panelCount,
      }),
    })
    const data = await response.json()
    setImage(data.url)
    setLoading(false)
  }
  
  return { image, loading, panelCount, setPanelCount, generate }
}

const usePanelProcessor = (masterImage: string | null, concept: string) => {
  const [panels, setPanels] = useState<StoryboardPanel[]>([])
  const [loading, setLoading] = useState(false)
  
  const extract = async () => {
    setLoading(true)
    const response = await fetch('/api/seq/analyze-storyboard', {
      method: 'POST',
      body: JSON.stringify({
        imageUrl: masterImage,
        concept,
      }),
    })
    const data = await response.json()
    setPanels(data.panels)
    setLoading(false)
  }
  
  return { panels, loading, extract }
}

const usePromptEnhancer = (panels: StoryboardPanel[]) => {
  const [enhancedPrompts, setEnhancedPrompts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  const enhance = async () => {
    setLoading(true)
    const enhanced = await Promise.all(
      panels.map(panel =>
        fetch('/api/seq/enhance-prompt', {
          method: 'POST',
          body: JSON.stringify({
            prompt: panel.prompt,
            panelContext: panel.description,
          }),
        }).then(r => r.json())
      )
    )
    setEnhancedPrompts(enhanced.map(e => e.enhancedPrompt))
    setLoading(false)
  }
  
  return { enhancedPrompts, loading, enhance }
}

const useVideoGenerator = (
  panels: StoryboardPanel[],
  prompts: string[]
) => {
  const [videoUrls, setVideoUrls] = useState<string[]>([])
  const [progress, setProgress] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  
  const generate = async (model: string = 'veo3.1-fast') => {
    setLoading(true)
    setProgress(panels.map(() => 0))
    
    const videos = await Promise.all(
      panels.map((panel, i) =>
        fetch('/api/seq/generate-video', {
          method: 'POST',
          body: JSON.stringify({
            imageUrl: panel.imageUrl,
            prompt: prompts[i],
            model,
            duration: panel.duration,
          }),
        })
          .then(r => r.json())
          .then(data => {
            setProgress(p => {
              const newP = [...p]
              newP[i] = 100
              return newP
            })
            return data.url
          })
      )
    )
    
    setVideoUrls(videos)
    setLoading(false)
  }
  
  return { videoUrls, progress, loading, generate }
}
```

### Type Definitions

```typescript
interface StoryboardPanel {
  id: string
  order: number                   // Sequence order
  
  // Visual content
  imageUrl: string                // Panel image from master
  linkedImageUrl?: string         // End frame for transitions
  videoUrl?: string               // Generated video (after synthesis)
  
  // Generation metadata
  type: 'scene' | 'transition'
  prompt: string                  // Original scene description
  enhancedPrompt?: string         // Optimized for video generation
  motionDescription?: string      // AI-generated motion cues
  
  // Video generation
  duration: 5 | 8 | 4 | 3 | 2 | 6 // Seconds
  model?: 'veo3.1-fast' | 'veo3.1-standard' | 'wan2.2' | 'wan2.5'
  quality?: 'fast' | 'standard' | 'high'
  
  // Status tracking
  status: 'idle' | 'generating-image' | 'generating-video' | 'enhancing' | 'complete' | 'error'
  error?: string
  
  // Metadata
  createdAt: number
  updatedAt: number
}

interface StoryboardProject {
  id: string
  userId: string                  // Clerk user ID
  
  // Project info
  name: string
  description: string
  concept: string                 // Original text input
  
  // Content
  panels: StoryboardPanel[]
  masterImageUrl: string          // Original master image
  
  // Settings
  aspectRatio: '16:9' | '9:16' | '1:1'
  totalDuration: number           // Sum of all panels
  
  // Metadata
  createdAt: number
  updatedAt: number
  isPublished: boolean
}

interface GenerationSession {
  id: string
  step: number                    // Current workflow step (1-7)
  
  // Step data
  concept: string
  masterImage?: string
  panels?: StoryboardPanel[]
  enhancedPrompts?: string[]
  videoUrls?: string[]
  
  // Expiry
  createdAt: number
  expiresAt: number              // 24 hour expiry
}
```

---

## Integration Complexity

### 🟢 Easy (Reusable As-Is)
- Multi-step workflow UI components
- Hook orchestration patterns
- Type definitions
- Prompt templates and presets

**Effort**: 2-3 hours

### 🟡 Medium (Minor Adaptation)
- API endpoint integration (Gemini, FAL.ai)
- Session storage (browser or Convex)
- Image URL management (temporary vs. persistent)
- Error handling and retry logic

**Effort**: 4-6 hours

### 🔴 Complex (Custom Development)
- AI panel extraction algorithm (currently in Gemini/Claude)
- Custom prompt enhancement system
- Transition bridging refinement
- Project persistence (Convex integration)
- UI polish and mobile responsiveness

**Effort**: 8-12 hours

---

## Time Estimation

### Phase 1: Component Extraction & Setup (3-4 hours)
- Copy storyboard components from Seq
- Extract hooks (useMasterImageGeneration, usePanelProcessor, etc.)
- Review and adapt type definitions
- Setup API route structure
- **Deliverable**: Component scaffold with types

### Phase 2: API Integration (4-6 hours)
- Wire `/api/seq/generate-image` to Gemini (use existing pattern)
- Wire `/api/seq/analyze-storyboard` (panel detection + extraction)
- Wire `/api/seq/enhance-prompt` to Claude via FAL.ai
- Wire `/api/seq/generate-video` to FAL.ai models
- Handle API key management and env vars
- **Deliverable**: All API endpoints working

### Phase 3: State Management & Workflow (3-4 hours)
- Setup storyboard session management
- Implement step-by-step state transitions
- Add undo/back navigation
- Handle error states and recovery
- Implement progress tracking
- **Deliverable**: Full workflow orchestration

### Phase 4: UI Component Rebuild (5-8 hours)
- Rebuild components for MyShortReel design
- Step-by-step UI with progress indicators
- Preview windows for each stage
- Progress bars for API calls
- Error messages and retry buttons
- Mobile responsiveness
- **Deliverable**: Production UI

### Phase 5: Persistence & Integration (2-3 hours)
- Convex schema for storyboard projects
- Save/load project functionality
- Link to timeline editor (if available)
- Export options
- **Deliverable**: Project persistence

### Phase 6: Testing & Polish (1-2 hours)
- End-to-end workflow testing
- Error scenario testing
- Performance optimization
- Documentation
- **Deliverable**: Production-ready

### **TOTAL: 18-24 hours**

### Breakdown by Role
- **Backend**: 4-6 hours (API integration)
- **Frontend**: 10-12 hours (UI + orchestration)
- **DevOps**: 1-2 hours (env vars, API keys, storage)
- **QA**: 2-3 hours (testing, edge cases)

---

## Data Structure for MyShortReel

### Convex Schema

```typescript
// Storyboard projects
export const storyboardProjects = defineTable({
  userId: v.string(),            // Clerk user ID
  
  // Project metadata
  name: v.string(),
  description: v.optional(v.string()),
  concept: v.string(),            // Original user input
  
  // Visual content
  masterImageUrl: v.string(),     // Master storyboard image
  
  // Panels
  panels: v.array(v.object({
    id: v.string(),
    order: v.number(),
    imageUrl: v.string(),
    videoUrl: v.optional(v.string()),
    prompt: v.string(),
    enhancedPrompt: v.optional(v.string()),
    duration: v.number(),
    status: v.string(),           // 'idle', 'generating', 'complete', 'error'
  })),
  
  // Settings
  aspectRatio: v.string(),        // "16:9", "9:16", "1:1"
  totalDuration: v.number(),
  
  // Metadata
  isPublished: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"])
 .index("by_created", ["createdAt"])

// Storyboard generation sessions (temporary, expires in 24h)
export const storyboardSessions = defineTable({
  userId: v.string(),
  
  // Session progress
  currentStep: v.number(),        // 1-7
  
  // Data at each step
  concept: v.string(),
  masterImageUrl: v.optional(v.string()),
  
  panels: v.optional(v.array(v.object({
    id: v.string(),
    imageUrl: v.string(),
    prompt: v.string(),
  }))),
  
  enhancedPrompts: v.optional(v.array(v.string())),
  videoUrls: v.optional(v.array(v.string())),
  
  // Lifecycle
  createdAt: v.number(),
  expiresAt: v.number(),          // Now + 86400000 (24 hours)
}).index("by_user", ["userId"])
 .index("by_expiry", ["expiresAt"])
```

**Mutations:**
```typescript
export const createStoryboardSession = mutation({
  args: { userId: v.string(), concept: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("storyboardSessions", {
      userId: args.userId,
      currentStep: 1,
      concept: args.concept,
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000, // 24 hours
    })
  }
})

export const updateStoryboardSession = mutation({
  args: {
    sessionId: v.id("storyboardSessions"),
    updates: v.object({
      currentStep: v.optional(v.number()),
      masterImageUrl: v.optional(v.string()),
      panels: v.optional(v.array(v.object({...}))),
      enhancedPrompts: v.optional(v.array(v.string())),
      videoUrls: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      ...args.updates,
      updatedAt: Date.now(),
    })
  }
})

export const saveStoryboardProject = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    sessionId: v.id("storyboardSessions"),
  },
  handler: async (ctx, args) => {
    // Get session data
    const session = await ctx.db.get(args.sessionId)
    
    // Create project
    return await ctx.db.insert("storyboardProjects", {
      userId: args.userId,
      name: args.name,
      concept: session.concept,
      masterImageUrl: session.masterImageUrl,
      panels: session.panels,
      aspectRatio: "16:9",
      totalDuration: (session.panels || []).reduce((sum, p) => sum + p.duration, 0),
      isPublished: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  }
})
```

---

## API Endpoints Needed

### Already Exist in MyShortReel ✅
- `/api/ai/enhance-prompt` (FAL.ai)
- `/api/videos/generate` (FAL.ai video models)
- Image generation via Gemini (Vercel AI Gateway)

### Need to Create ⚠️

```typescript
// app/api/seq/generate-image/route.ts
export async function POST(request: Request) {
  const { prompt, panelCount, aspectRatio } = await request.json()
  
  // Use Gemini 3 Pro Image via Vercel AI Gateway
  const response = await generateObject({
    model: "google-generative-ai/gemini-3-pro-vision",
    schema: z.object({
      imageUrl: z.string().url(),
    }),
    prompt: `${prompt}\n\nGenerate a storyboard layout with ${panelCount} panels showing the scenes.`,
  })
  
  return Response.json(response)
}

// app/api/seq/analyze-storyboard/route.ts
export async function POST(request: Request) {
  const { imageUrl, concept } = await request.json()
  
  // Analyze image to extract panel boundaries
  // Use Gemini's vision capability
  const response = await generateObject({
    model: "google-generative-ai/gemini-3-pro-vision",
    schema: z.object({
      panels: z.array(z.object({
        description: z.string(),
        motionCues: z.string(),
      })),
    }),
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          image: imageUrl,
        },
        {
          type: "text",
          text: `Analyze this storyboard image showing "${concept}". Extract individual panels and describe what's happening in each.`,
        },
      ],
    }],
  })
  
  return Response.json(response)
}
```

---

## Implementation Strategy

### Step 1: Component Extraction (2-3 hours)

```bash
# Copy Seq storyboard components
mkdir -p components/storyboard-generator
cp seq/components/storyboard/* components/storyboard-generator/
```

### Step 2: Hook Creation (2-3 hours)

```typescript
// hooks/useStoryboardGenerator.ts
import { useState } from 'react'

export function useStoryboardGenerator() {
  const [step, setStep] = useState(1)
  const [concept, setConcept] = useState('')
  const [masterImage, setMasterImage] = useState<string | null>(null)
  const [panels, setPanels] = useState<StoryboardPanel[]>([])
  const [enhancedPrompts, setEnhancedPrompts] = useState<string[]>([])
  const [videoUrls, setVideoUrls] = useState<string[]>([])
  
  const generateMasterImage = async () => {
    const response = await fetch('/api/seq/generate-image', {
      method: 'POST',
      body: JSON.stringify({ prompt: concept }),
    })
    const { imageUrl } = await response.json()
    setMasterImage(imageUrl)
    setStep(2)
  }
  
  // ... other step functions
  
  return {
    step, setStep,
    concept, setConcept,
    masterImage, generateMasterImage,
    panels, setPanels,
    enhancedPrompts,
    videoUrls,
  }
}
```

### Step 3: UI Integration (5-8 hours)

```typescript
// app/tools/storyboard-generator/page.tsx
import { useStoryboardGenerator } from '@/hooks/useStoryboardGenerator'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function StoryboardGeneratorPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const generator = useStoryboardGenerator()
  
  const handleSaveProject = async () => {
    const response = await fetch('/api/storyboard/save', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        name: `Storyboard - ${new Date().toLocaleDateString()}`,
        panels: generator.panels,
        videoUrls: generator.videoUrls,
        masterImage: generator.masterImage,
      }),
    })
    const { projectId } = await response.json()
    router.push(`/storyboards/${projectId}`)
  }
  
  return (
    <div className="storyboard-generator">
      {generator.step === 1 && (
        <ConceptInput 
          value={generator.concept}
          onChange={generator.setConcept}
          onNext={generator.generateMasterImage}
        />
      )}
      
      {generator.step === 2 && (
        <MasterImageDisplay
          imageUrl={generator.masterImage}
          onNext={() => generator.setStep(3)}
          onBack={() => generator.setStep(1)}
        />
      )}
      
      {/* ... other steps ... */}
      
      {generator.step === 7 && (
        <ReviewExport
          panels={generator.panels}
          videoUrls={generator.videoUrls}
          onSave={handleSaveProject}
        />
      )}
    </div>
  )
}
```

---

## Performance Considerations

### Image Generation Delays
- Gemini API can take 10-30 seconds
- Provide real-time progress feedback
- Show estimated completion time

```typescript
// useImageGeneration.ts with timeout
const generateWithTimeout = (prompt: string) => {
  return Promise.race([
    fetch('/api/seq/generate-image', { body: JSON.stringify({ prompt }) }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 60000)
    ),
  ])
}
```

### Batch Video Generation
- Generate all panel videos in parallel (not sequentially)
- Use Promise.all() to speed up workflow

```typescript
const generateAllVideos = async () => {
  setLoading(true)
  const videos = await Promise.all(
    panels.map(panel =>
      fetch('/api/seq/generate-video', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl: panel.imageUrl,
          prompt: enhancedPrompts[panel.id],
        }),
      }).then(r => r.json())
    )
  )
  setVideoUrls(videos.map(v => v.url))
  setLoading(false)
}
```

### Session Expiry
- Store workflow progress in Convex (survives page reload)
- Auto-cleanup sessions older than 24 hours
- Prompt user before expiry

```typescript
// Background cleanup (Convex cron)
export const cleanupExpiredSessions = internalMutation({
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("storyboardSessions")
      .filter(q => q.lt(q.field("expiresAt"), Date.now()))
      .collect()
    
    for (const session of expired) {
      await ctx.db.delete(session._id)
    }
  },
})
```

---

## Success Criteria

### MVP (18-24 hours)
✅ Concept input working  
✅ Master image generation (Gemini)  
✅ Panel extraction UI  
✅ Prompt enhancement functional  
✅ Video generation (FAL.ai) working  
✅ Full workflow completable  
✅ Progress tracking for all steps  
✅ Error handling with retry  
✅ Save project to Convex  
✅ Mobile responsive  

### Phase 2 (Optional)
❓ Transition generation  
❓ Advanced prompt customization  
❓ Community storyboard templates  
❓ Sharing/collaboration  
❓ Analytics on usage  

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Gemini API timeout | Medium | Medium | Implement timeout + retry, fallback to default panels |
| FAL.ai video generation fails | Low | High | Implement retry with exponential backoff |
| Panel extraction inaccuracy | Medium | Medium | Allow manual adjustment of panels |
| Memory/performance issues | Low | Medium | Limit to 8 panels max, lazy load videos |
| API key exposure | Medium | High | Server-side only, validate requests |
| Prompt enhancement reduces quality | Low | Low | Show before/after, allow manual edit |
| UI too complex for users | Medium | Medium | Add guided tour, tooltips, templates |

---

## Comparison: Other Mini-Apps

| Mini-App | Tech Fit | Integration Time | Standalone | Recommendation |
|----------|----------|------------------|-----------|-----------------|
| Prompt Generator (awesome-video-prompts) | ✅ Perfect | 16-24 hours | Yes | Higher priority |
| **Storyboard Generator (Seq)** | ✅ Perfect | **18-24 hours** | **Yes** | Good feature |
| Timeline Editor (Seq) | ✅ Perfect | 14-18 hours | Yes | Modular |
| Image Generator (Nano Banana) | ✅ Perfect | 8-12 hours | Yes | Quick win |
| Ad Assets Generator | ⚠️ Okay | 40-56 hours | No | Not recommended |

---

## Recommendation

### **✅ RECOMMENDED: Extract AI Storyboard Generator**

**Why:**
1. **Self-contained**: Doesn't depend on timeline editor
2. **Fast**: 18-24 hours, moderate effort
3. **High value**: Solves real creator problem (planning before editing)
4. **Existing integrations**: Gemini + FAL.ai already in MyShortReel
5. **Strategic**: Gateway to more AI-powered features

**Next Steps:**
1. ✅ Extract storyboard components
2. ✅ Create API endpoint layer
3. ✅ Implement session management
4. ✅ Rebuild UI for MyShortReel design
5. ✅ Add persistence to Convex
6. ✅ Test end-to-end workflow

**Timeline**: 1-1.5 weeks for full integration

### Integration Priority
1. **Prompt Generator** (16-24 hours) ⭐ FIRST
2. **Storyboard Generator** (18-24 hours) ⭐ SECOND or PARALLEL
3. Timeline Editor (14-18 hours) ⭐ AFTER storyboard (or parallel)

---

## Conclusion

The **Seq storyboard generator is ideal as a standalone mini-app** for MyShortReel:
- ✅ Self-contained workflow (no dependencies)
- ✅ Leverages existing AI infrastructure (Gemini, FAL.ai)
- ✅ Clean, modular component architecture
- ✅ Fast integration (18-24 hours)
- ✅ High user value (planning tool)
- ✅ Can run parallel with other features

**Go for it!** This is a high-value feature that will significantly enhance MyShortReel's content creation capabilities.

---

**Document Version**: 1.0  
**Last Updated**: January 21, 2026  
**Author**: Implementation Team  
**Status**: Ready for Development
