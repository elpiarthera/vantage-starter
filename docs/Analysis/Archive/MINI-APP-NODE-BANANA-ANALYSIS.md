# 🍌 Mini App #8: Visual Workflow Editor (Node Banana) - Implementation Analysis

**Repository**: [node-banana](https://github.com/shrimbly/node-banana)  
**Also Known As**: Banana - AI-Powered Node Workflow Editor  
**Date**: January 21, 2026  
**Status**: Analysis Complete

---

## Executive Summary

**Node Banana** is a **production-ready visual node editor for AI-powered image/video generation workflows**. It's a full-stack Next.js application that allows users to build generative AI pipelines by connecting typed nodes on an infinite canvas. The codebase is **excellently architected** with strong separation of concerns, comprehensive TypeScript, and reusable patterns.

**Architecture Quality**: Excellent (modular, well-documented, extensible)  
**Tech Stack Alignment**: ✅ **Perfect** - Next.js 16, React 19, TypeScript 5, Tailwind 4  
**Feature Completeness**: ✅ **Production-Ready** - MVP complete, beta features available  
**Estimated Integration Time**: **Not recommended as-is** (it's a complete editor, not a library)  
**Reusability Potential**: ⭐⭐⭐⭐⭐ **EXTREMELY HIGH** for architectural patterns  

> ✅ **Verdict: EXCELLENT REFERENCE** - Not suitable for direct integration (it's a UI editor, not a backend service), but the architecture, provider patterns, and utilities are **world-class and highly reusable**. Extract patterns for your own implementation.

---

## What is Node Banana?

**Node Banana** is a **visual IDE for building AI-powered image and video generation workflows**. Users create directed acyclic graphs (DAGs) of operations and execute them with multi-provider support.

### Core Concept
```
User drags nodes onto infinite canvas
  ├─ Image Input (load images)
  ├─ Text Prompt (write text)
  ├─ AI Generate (Gemini, Replicate, fal.ai)
  ├─ Annotate (draw on images)
  ├─ LLM Generate (text generation)
  ├─ Video Generate (external providers)
  ├─ Split Grid (detect contact sheets)
  └─ Output (view results)

Connect nodes with typed edges (image↔image, text↔text)
Execute as DAG with topological sort
```

### Real-World Use Case
```
Marketer wants to generate variations of a product image:

1. Load product image (imageInput node)
2. Add background description (prompt node)
3. Connect to AI Generate (Nano Banana model)
4. Set aspect ratio, quality
5. Execute → generates 5 variations
6. Annotate best variation (add text/shapes)
7. Export final image

Or batch process:
1. Upload contact sheet of 9 product photos
2. Connect splitGrid node → detects 3×3 grid
3. Connect each cell to different AI generator
4. Run in parallel → 9 different backgrounds applied
5. Export all at once
```

### Who Would Use It?
- **AI creative professionals** - Build complex image generation pipelines
- **Designers** - Test variations without writing code
- **Marketers** - Batch generate product variations
- **Content creators** - Create template workflows
- **Agencies** - Offer workflow templates to clients

---

## Current State: Production-Ready

### ✅ What Works
- Visual node editor (React Flow)
- 8 node types (image, text, generate, annotate, llm, video, split, output)
- Multi-provider AI integration (Gemini, Replicate, fal.ai, OpenAI)
- Typed connections (image↔image, text↔text)
- Image annotation (Konva-based drawing with shapes, text, arrows)
- Cost tracking (estimated per workflow)
- Auto-save to file system
- Model discovery and selection
- Error handling with user feedback
- Workflow history (carousel per node)

### 🟡 Beta Features
- Video generation (fal.ai, Replicate)
- Replicate model support
- Custom model parameters

### ❌ Known Limitations
- Single-user only (no cloud sync)
- No multi-user collaboration
- Large workflow lag (100+ nodes)
- Chrome preferred (edge cases on Safari/Firefox)
- No undo/redo for execution failures
- Files stored locally (no cloud backup)
- API keys in localStorage (not secure)

---

## Feature Overview

### Visual Editor
- **Infinite Canvas**: Pan, zoom, drag nodes
- **Node Palette**: 8 node types with drag-to-add
- **Typed Connections**: Image (green) connects to image; text (blue) to text
- **Node Comments**: Annotation text on each node
- **Group Locking**: Lock multiple nodes to skip during execution
- **Auto-align**: Magnetic guides (opt-in)

### AI Generation
| Node Type | Input | Output | AI Provider |
|-----------|-------|--------|-------------|
| **nanoBanana** | image, text | image | Gemini (nano/pro) |
| **generateVideo** | image, text | video | fal.ai, Replicate |
| **llmGenerate** | text, image | text | Gemini, OpenAI |
| **annotation** | image | image | Konva (client-side) |

### Image Annotation
- **Shapes**: Rectangles, circles, arrows
- **Drawing**: Freehand lines with brush control
- **Text**: Add and style text overlays
- **Colors**: RGB color picker
- **Undo/Redo**: Per-shape history
- **Full-Screen Mode**: Konva-powered interactive canvas

### Grid Splitting
- **Automatic Detection**: Analyze edge profiles to find grid boundaries
- **Regularity Scoring**: Match common photo aspect ratios (16:9, 4:3, 1:1, etc.)
- **Manual Override**: User can specify exact grid dimensions
- **Output**: Individual cells as separate images, ready for processing

### Cost Tracking
- Real-time estimation per node
- Hardcoded Gemini pricing
- Per-provider breakdown
- Workflow total accumulation
- Manual reset option

### Project Management
- **Save/Load**: Workflows as JSON files
- **File Dialogs**: Browser native file picker
- **Auto-save**: Every 90 seconds (debounced)
- **Externalize Images**: Toggle base64 embedding vs. file system storage
- **Deduplication**: MD5 hashing for image reuse

---

## Architecture

### 🎯 Core Patterns

#### 1. Provider Abstraction ⭐⭐⭐⭐⭐
```typescript
// src/lib/providers/types.ts
interface ProviderInterface {
  name: string
  apiKey?: string
  
  // Get available models
  getModels(options?: {force?: boolean}): Promise<ProviderModel[]>
  
  // Generate images
  generateImage(
    prompt: string,
    imageUrl?: string,
    options?: ModelOptions
  ): Promise<string> // base64 or URL
  
  // Generate videos
  generateVideo(
    prompt: string,
    imageUrl?: string,
    options?: ModelOptions
  ): Promise<string>
  
  // Generate text
  generateText(
    prompt: string,
    imageUrl?: string,
    options?: ModelOptions
  ): Promise<string>
}
```

**Why it's excellent:**
- Abstract provider interface allows easy addition of new services
- Model caching to avoid repeated API calls
- Consistent error handling across providers
- Can switch providers mid-workflow

**Implementations:**
- Gemini (direct API)
- Replicate (REST API, 5000+ models)
- fal.ai (REST API, 100+ curated models)
- OpenAI (text only)

#### 2. Zustand State Management
```typescript
// Single store manages:
// - Nodes (add, delete, update, copy/paste)
// - Edges (connect, disconnect)
// - Execution (topological sort, node-by-node run)
// - UI state (zoom, selection, modals)
// - Settings (API keys, defaults)
// - History (carousel per node)
```

**Strengths:**
- Minimal boilerplate vs. Redux
- Atomic updates for performance
- DevTools integration possible
- 200+ action methods

**Weakness:**
- Single store not optimized for distributed state (but fine for this app size)

#### 3. Topological Sort Execution
```typescript
executeWorkflow(startFromNodeId?: string)
  1. Sort nodes by dependencies
  2. Check pause edges (halt at specific nodes)
  3. Skip locked group nodes
  4. For each node:
     - Fetch connected inputs
     - Call API (/api/generate, /api/llm)
     - Update node data & output
     - Track costs
     - Auto-save
```

**Why it matters:**
- Enables partial execution (start from middle)
- Handles diamond dependencies correctly
- Pause edges allow step-by-step control
- Parallelizable (future optimization)

#### 4. Cost Calculator
```typescript
// Hardcoded Gemini pricing
// Per-provider cost breakdown
// Multi-image handling
// Estimation vs. actual tracking
```

**Reusable Pattern:**
- Easily adaptable to other providers
- Interface-driven pricing config
- Useful for MyShortReel's billing system

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 16 | Full-stack (frontend + API routes) |
| **Language** | TypeScript | 5.9 | Type-safe, strict mode |
| **Node Editor** | React Flow (@xyflow/react) | 12.9 | Canvas + node management |
| **Drawing** | Konva + react-konva | 10.0 | Interactive annotation canvas |
| **State** | Zustand | 5.0 | Global workflow state |
| **Styling** | Tailwind CSS | 4.1 | Utility-first CSS |
| **AI APIs** | @google/genai | latest | Gemini direct integration |
| **File Handling** | jszip | - | Workflow export/import |
| **Testing** | Vitest | 4.0 | Fast unit/integration tests |
| **HTTP Server** | Custom Node.js | 18+ | 10-minute timeout for video gen |

---

## Code Organization

```
node-banana/
├── src/
│   ├── app/
│   │   ├── layout.tsx (App Router)
│   │   ├── page.tsx (Main editor)
│   │   └── api/
│   │       ├── generate/route.ts (600s timeout)
│   │       ├── llm/route.ts (60s timeout)
│   │       ├── models/route.ts (Model discovery)
│   │       ├── workflow/route.ts (File I/O)
│   │       └── save-generation/route.ts (Image storage)
│   ├── components/
│   │   ├── WorkflowCanvas.tsx (React Flow wrapper)
│   │   ├── nodes/
│   │   │   ├── BaseNode.tsx (Shared wrapper)
│   │   │   ├── GenerateImageNode.tsx
│   │   │   ├── AnnotationNode.tsx
│   │   │   ├── PromptNode.tsx
│   │   │   └── ... (8 total)
│   │   └── modals/
│   │       ├── ModelSearch.tsx
│   │       ├── Settings.tsx
│   │       └── ProjectSetup.tsx
│   ├── store/
│   │   └── workflowStore.ts (200+ actions)
│   ├── lib/
│   │   ├── providers/
│   │   │   ├── index.ts (Registry)
│   │   │   ├── replicate.ts
│   │   │   ├── fal.ts
│   │   │   ├── types.ts (Interface)
│   │   │   └── cache.ts
│   │   └── ... (utilities)
│   ├── types/
│   │   ├── nodes.ts
│   │   ├── providers.ts
│   │   ├── models.ts
│   │   ├── annotation.ts
│   │   └── workflow.ts
│   └── utils/
│       ├── costCalculator.ts
│       ├── gridSplitter.ts
│       ├── imageStorage.ts
│       └── logger.ts
└── tests/
    ├── api.test.ts
    ├── store.test.ts
    └── utils.test.ts
```

---

## Node Types (8 Total)

### Input Nodes
1. **imageInput**: Upload/load images
2. **prompt**: Text input for prompts

### Processing Nodes
3. **nanoBanana**: AI image generation (Gemini)
4. **annotation**: Draw shapes and text on images
5. **llmGenerate**: AI text generation
6. **generateVideo**: AI video generation
7. **splitGrid**: Detect and split grid images

### Output Node
8. **output**: View/export results

### Connection Rules
```
imageInput → nanoBanana, annotation, generateVideo, splitGrid, output
prompt → nanoBanana, llmGenerate, generateVideo, output
nanoBanana → annotation, output
annotation → output
llmGenerate → output
generateVideo → output
splitGrid → nanoBanana, generateVideo (reference grid), output
```

---

## API Routes

### `/api/generate` (600s timeout)
**Handles**: Image/video generation dispatcher

```typescript
POST /api/generate
{
  provider: "gemini" | "replicate" | "fal"
  modelId: string
  prompt: string
  imageUrl?: string
  aspectRatio?: string
  options?: Record<string, unknown>
}

Response:
{
  success: boolean
  url: string // data URL or HTTP URL
  cost?: number
}
```

### `/api/llm` (60s timeout)
**Handles**: Text generation (Google, OpenAI)

### `/api/models` (Cached)
**Handles**: Model discovery with in-memory caching

### `/api/workflow`
**Handles**: Save/load workflows as JSON

### `/api/save-generation`
**Handles**: Auto-save generated images to file system

---

## Key Utilities

### gridSplitter.ts ⭐⭐⭐⭐⭐
**Purpose**: Automatically detect grid boundaries in contact sheets

**Algorithm**:
1. Test grid configurations (1×2 through 6×6)
2. Calculate aspect ratios for each cell
3. Score based on match with common photo dimensions (16:9, 4:3, 1:1)
4. Use gradient analysis (Sobel-like) to find grid lines
5. Return cells with highest confidence

**Use Case**: Upload product photo grid → automatically split into individual items

### costCalculator.ts ⭐⭐⭐⭐
**Purpose**: Track and estimate AI generation costs

**Features**:
- Hardcoded Gemini pricing (per-image)
- Per-provider breakdown
- Multi-image handling
- Workflow total accumulation

**Reusable**: Extract and adapt for MyShortReel's billing

### imageStorage.ts ⭐⭐⭐⭐
**Purpose**: Toggle between base64 embedding and file system storage

**Functions**:
- `externalizeWorkflowImages()` - Save to file system, store file paths
- `hydrateWorkflowImages()` - Load from file system, embed as base64
- MD5 hashing for deduplication

---

## Strengths (Architecture & Code Quality)

✅ **Type Safety**
- Full TypeScript with strict mode
- No `any` types observed
- Comprehensive interface definitions
- Discriminated unions for node types

✅ **Modularity**
- Clear separation: types, components, store, API, utils
- Provider registry pattern
- Reusable BaseNode component
- Independent utilities (grid splitter, cost calculator)

✅ **Error Handling**
- Try-catch blocks in all async operations
- User-friendly error messages
- Structured logging with session tracking
- Graceful fallbacks

✅ **Documentation**
- CLAUDE.md (AI instructions)
- PRD (product requirements document)
- Inline code comments
- TypeScript interfaces as documentation

✅ **Testability**
- API routes have unit tests
- Store actions testable in isolation
- Utility functions pure (no side effects)
- Vitest setup ready

✅ **Performance**
- Lazy loading of models (on-demand API calls)
- In-memory caching (avoid repeated requests)
- Topological sort optimization (O(V+E))
- Auto-save debouncing (90s intervals)

---

## Weaknesses & Limitations

⚠️ **Early Development** (Version 1.0)
- Breaking changes expected
- Not stable for mission-critical features
- Beta features (video, Replicate) need validation

⚠️ **Single-User Only**
- No cloud sync
- No multi-user collaboration
- Files stored locally (security risk)

⚠️ **Browser-Dependent**
- Canvas API limitations
- Chrome recommended
- Safari/Firefox edge cases

⚠️ **Scalability Issues**
- Performance degrades with 100+ nodes
- Large image sets cause UI lag
- Memory growth from carousel history

⚠️ **API Key Security**
- Stored in localStorage
- Not encrypted
- Client-side exposure risk

⚠️ **Limited Test Coverage**
- Core workflow tested
- Edge cases not comprehensive
- No E2E tests

⚠️ **Video Generation** (Beta)
- Queue API not implemented (file size limits)
- Latency not optimized
- Cost tracking incomplete

---

## Data Structures

### Workflow File Format
```typescript
interface WorkflowFile {
  version: 1
  id?: string
  name: string
  nodes: WorkflowNode[]        // React Flow nodes with custom data
  edges: WorkflowEdge[]        // React Flow edges with pause metadata
  edgeStyle: "angular" | "curved"
  groups?: Record<string, NodeGroup>
}

// Example node structure
interface WorkflowNode {
  id: string
  type: "nanoBanana" | "annotation" | ...
  position: { x: number; y: number }
  data: {
    prompt?: string
    selectedModel?: SelectedModel
    aspectRatio?: string
    quality?: "low" | "medium" | "high"
    outputs?: Array<{id: string; data: string}> // history carousel
    error?: string
    status: "idle" | "processing" | "complete" | "error"
    comments?: string
  }
  groupId?: string
}
```

---

## Reusability for MyShortReel

### ❌ Direct Integration: NOT SUITABLE
Node Banana is a **complete UI editor**, not a library or backend service. It's not designed to be embedded in another app.

### ✅ Extract & Adapt: EXCELLENT PATTERNS

#### 1. Provider Abstraction Pattern ⭐⭐⭐⭐⭐
**Reuse**: Adapt `ProviderInterface` for MyShortReel's multi-provider AI services

```typescript
// MyShortReel backend implementation
class MyShortReelAIProvider implements ProviderInterface {
  async generateImage(prompt, imageUrl, options) {
    // Route to optimal provider based on options
    // Track costs using node-banana's costCalculator
    // Cache results
    return imageUrl
  }
}
```

**Effort**: 1-2 days to adapt

#### 2. Cost Calculator ⭐⭐⭐⭐
**Reuse**: Use pricing interface for billing system

```typescript
// MyShortReel billing integration
import { calculateWorkflowCost } from 'node-banana/utils/costCalculator'

const totalCost = calculateWorkflowCost(workflow, selectedModels)
updateUserBillingBalance(user.id, totalCost)
```

**Effort**: 1 day to integrate

#### 3. Grid Splitter Algorithm ⭐⭐⭐⭐
**Reuse**: Port to server-side for batch processing

```typescript
// MyShortReel backend
import { detectGrid, splitGrid } from 'node-banana/utils/gridSplitter'

const imageBuffer = await fs.readFile('product-grid.jpg')
const grid = detectGrid(imageBuffer) // { rows: 3, cols: 3 }
const cells = splitGrid(imageBuffer, grid.rows, grid.cols)
// Process each cell independently
```

**Effort**: 1-2 days to port to Node.js

#### 4. Workflow Execution Logic ⭐⭐⭐⭐
**Reuse**: Adapt DAG execution for backend pipeline

```typescript
// MyShortReel backend service
class WorkflowExecutor {
  async execute(workflow: WorkflowFile) {
    const sorted = topologicalSort(workflow.nodes, workflow.edges)
    for (const nodeId of sorted) {
      const results = await this.executeNode(nodeId, workflow)
      // Save intermediate results
      // Track progress
      // Handle errors
    }
    return results
  }
}
```

**Effort**: 2-3 days to adapt for async/queue-based processing

#### 5. Zustand Store Pattern ⭐⭐⭐⭐
**Reuse**: Adapt state management for similar workflows

```typescript
// MyShortReel frontend - similar pattern
const useMyShortReelEditor = create<EditorState>((set) => ({
  nodes: [],
  edges: [],
  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node]
  })),
  // ... similar to node-banana
}))
```

**Effort**: Already familiar if following same patterns

### ⚠️ Partial Reuse: With Adaptation

#### Annotation System
**Node Banana**: Konva-based browser drawing
**For MyShortReel**: Would need server-side annotation (headless Canvas or Python PIL)

**Effort**: 3-5 days to rebuild for backend

---

## Integration Recommendation

### ❌ DO NOT
- Try to embed Node Banana in MyShortReel
- Use as-is for backend service
- Expect production stability (v1.0 beta)

### ✅ DO
- Study the architecture patterns (excellent examples)
- Extract `ProviderInterface` for multi-provider AI
- Port `gridSplitter` algorithm if batch processing needed
- Adapt `costCalculator` for billing system
- Reference `workflowStore` for state management patterns
- Use as inspiration for visual workflow editor (if needed)

### 🔄 If Building Visual Workflow Editor for MyShortReel
Use Node Banana as architectural reference:
- React Flow for canvas
- Provider abstraction for AI
- Zustand for state
- Topological sort for execution
- Cost tracking from node-banana

**Estimated effort**: 3-4 weeks to build custom MyShortReel-specific visual editor using these patterns

---

## Comparison: When to Use Each Tool

| Scenario | Solution |
|----------|----------|
| Need visual AI workflow editor NOW | ✅ Use Node Banana (with caveats) |
| Need backend AI pipeline orchestration | ✅ Extract patterns, build custom service |
| Need image batch processing | ✅ Port gridSplitter, build Node.js service |
| Need AI provider abstraction | ✅ Adapt ProviderInterface |
| Need billing/cost tracking | ✅ Use costCalculator pattern |
| Need embedded editor in SaaS app | ❌ Node Banana too heavyweight |
| Need simple image generation | ❌ Node Banana overengineered |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Node Banana v1.0 breaking changes | High | Low | Extract utilities first, don't depend on core |
| Video generation beta issues | Medium | Medium | Thoroughly test with real videos |
| API key security (localStorage) | High | High | Never use in production as-is; use server auth |
| Large workflow performance | Medium | Low | Optimize DAG execution, consider batch processing |
| Browser compatibility issues | Low | Low | Test across browsers; document Chrome requirement |
| Unfamiliar architecture | Medium | Low | Study CLAUDE.md and PRD; good documentation |

---

## Why It's NOT a Mini-App for MyShortReel

Node Banana is a **complete application**, not a feature to be embedded:
- ❌ It's a web editor, not a reusable component
- ❌ It's frontend-focused, no backend API
- ❌ It's single-purpose (visual workflow editing)
- ❌ It's not designed for embedding in other apps
- ❌ It requires browser canvas (not suitable for headless processing)

### Instead
**Extract and adapt patterns** for MyShortReel's architecture:
- Use provider abstraction for AI service routing
- Use cost calculator for billing
- Use grid splitter for batch image processing
- Use workflow execution logic for backend pipeline
- Use state management patterns for frontend

---

## Recommendation

### **⭐ EXCELLENT REFERENCE IMPLEMENTATION**

**Node Banana demonstrates world-class architecture** for multi-provider AI integration and workflow automation. **Don't integrate directly, but study extensively**.

**Action Items:**
1. ✅ Read the code (excellent patterns)
2. ✅ Extract `ProviderInterface` pattern
3. ✅ Port `gridSplitter` if needed
4. ✅ Adapt `costCalculator` for billing
5. ✅ Use as reference for any workflow UI
6. ❌ Don't try to embed as mini-app

**Time to learn & extract patterns**: 2-3 days

---

## Conclusion

**Node Banana is an outstanding engineering example** of:
- Multi-provider AI service abstraction
- DAG-based workflow execution
- Cost tracking and estimation
- Visual node editor with React Flow
- Type-safe state management with Zustand

**It's not a mini-app to integrate into MyShortReel, but rather a reference implementation to learn from and extract reusable patterns.**

**For MyShortReel**, the value is not in using Node Banana directly, but in applying its architectural lessons to build custom solutions tailored to MyShortReel's specific needs and constraints.

---

**Document Version**: 1.0  
**Last Updated**: January 21, 2026  
**Author**: Implementation Team  
**Status**: Analysis Complete - Not Recommended as Mini-App (Use as Reference)
