# v0-for-images Repository Analysis

**Repository**: https://github.com/elpiarthera/v0-for-images  
**Analysis Date**: January 21, 2026  
**Analyzer**: MyShortReel Integration Team  

---

## Executive Summary

**v0-for-images** is a Next.js 15+ AI-powered **iterative image editing application** using natural language prompts to modify images. It's essentially a "chat interface for image editing" where users can iteratively refine images through conversational prompts.

| Aspect | Assessment |
|--------|-----------|
| **Primary Value** | Conversation-based workflow UI pattern + version tracking approach |
| **FAL.ai Integration** | Well-architected with clean server-side credential management |
| **Reusable Components** | High (all UI components, query hooks, auto-save pattern) |
| **Integration Effort** | 2-3 weeks (medium) - Requires Clerk + Convex migration from IndexedDB |
| **Architectural Patterns** | Excellent: conversation model, version tracking, server route bridge |
| **Recommendation** | **Extract patterns, not direct integration** - Conversation UI pattern valuable for Timeline/Storyboard tools |

---

## 1. Core Functionality & User Workflows

### **Primary Feature: Iterative Image Editing via Natural Language**

Users upload an image and iteratively edit it using English prompts, similar to ChatGPT but for image editing.

### **User Workflows**

**Workflow 1: Start New Project**
```
1. User clicks file picker or drags image onto canvas
2. System creates conversation entry with metadata
3. Image stored as "v0" (original/base version)
4. Ready for prompt input
```

**Workflow 2: Iterative Editing**
```
1. User types natural language prompt (e.g., "add sunset colors", "remove the person")
2. Clicks "Generate" button
3. Prompt sent to FAL.ai with current image
4. Generated image appears below with version number (v1, v2, etc.)
5. Each version shown in right sidebar thumbnail grid
6. User can select any previous version to continue editing from
```

**Workflow 3: Conversation Management**
```
1. Left sidebar shows all conversations with thumbnail previews
2. Each conversation shows: conversation name, image preview, last edit time
3. Click conversation to load all its history and versions
4. Single-click delete to remove conversation
```

**Workflow 4: Settings & Configuration**
```
1. Click gear icon to open settings dialog
2. Enter FAL API key (currently stored in localStorage)
3. Select image generation model from dropdown (4 options available)
4. Settings auto-persist to localStorage
```

### **Key UI Elements**

- **Left Panel**: Conversation history with thumbnails and metadata
- **Center Panel**: Large canvas showing current/selected image with version badge
- **Right Panel**: Thumbnail grid of all versions with hover details (prompt, model used)
- **Bottom**: Text input for prompts, generate button
- **Top**: Settings gear icon, notification sound toggle

---

## 2. FAL.ai Integration Architecture

### **Integration Flow Diagram**

```
┌─────────────────────────────────────────────────┐
│ Frontend (app/page.tsx)                         │
│                                                 │
│ handleGenerateImage():                          │
│ 1. Validate falKey & prompt                     │
│ 2. Get current image (uploaded or generated)    │
│ 3. Call useGenerateImage mutation               │
└────────────────┬────────────────────────────────┘
                 │ POST /api/generate-image
                 │ { falKey, prompt, imageUrl, model }
                 ▼
┌─────────────────────────────────────────────────┐
│ Backend API Route (app/api/generate-image)     │
│                                                 │
│ 1. Extract falKey, prompt, imageUrl, model      │
│ 2. fal.config({ credentials: falKey })          │
│ 3. Map model name → FAL endpoint                │
│ 4. fal.subscribe({                              │
│      endpoint: fal_endpoint,                    │
│      input: { image_url, prompt, ...params }    │
│    })                                           │
└────────────────┬────────────────────────────────┘
                 │ API Call to FAL.ai
                 ▼
┌─────────────────────────────────────────────────┐
│ FAL.ai Service                                  │
│                                                 │
│ Returns: { data: { images: [{ url: ... }] } }  │
└────────────────┬────────────────────────────────┘
                 │ Generated image URL
                 ▼
┌─────────────────────────────────────────────────┐
│ Frontend (useGenerateImage)                     │
│                                                 │
│ 1. Receive generated image URL                  │
│ 2. Create GeneratedImage object                 │
│ 3. Add to localGeneratedImages state            │
│ 4. Create assistant message in conversation     │
│ 5. Trigger auto-save to IndexedDB               │
│ 6. Play notification sound                      │
└─────────────────────────────────────────────────┘
```

### **Supported Models & Parameters**

| Model | FAL Endpoint | Strength | Steps | Guidance | Use Case |
|-------|------------|----------|-------|----------|----------|
| **Qwen Edit** | `fal-ai/qwen-image-edit` | 0.8 | 28 | 3.5 | General editing |
| **Seededit** | `fal-ai/bytedance/seededit/v3/edit-image` | 0.75 | 20 | — | Fast editing |
| **Kontext Pro** | `fal-ai/flux-pro/kontext` | 0.85 | 30 | 4.0 | High quality |
| **Nano Banana** | `fal-ai/nano-banana/edit` | — | — | — | Lightweight |

### **Code Implementation**

**Backend Route Handler** (`app/api/generate-image/route.ts`):
```typescript
export async function POST(request: Request) {
  const { falKey, prompt, imageUrl, model } = await request.json();

  // Configure FAL client with user's API key
  fal.config({ credentials: falKey });

  // Map model to endpoint
  const endpoint = getEndpointForModel(model);

  // Call FAL with image editing parameters
  const result = await fal.subscribe(endpoint, {
    input: {
      image_url: imageUrl,
      prompt: prompt,
      strength: getStrengthForModel(model),
      num_inference_steps: getStepsForModel(model),
      guidance_scale: getGuidanceForModel(model),
    },
    logs: true, // Enable detailed logs
    onQueueUpdate: (update) => console.log(`[v0] Queue update:`, update),
  });

  return Response.json({
    imageUrl: result.data.images[0].url,
  });
}
```

**Frontend Integration** (`app/page.tsx`):
```typescript
async function handleGenerateImage() {
  // Get current image (either uploaded or previously generated)
  const currentImageUrl = selectedVersion
    ? generatedImages.find(img => img.id === selectedVersion)?.url
    : uploadedImage?.url;

  // Call mutation with FAL credentials and settings
  useGenerateImage.mutate({
    falKey: settings.falKey,
    prompt,
    imageUrl: currentImageUrl,
    model: settings.selectedModel,
  });

  // After response:
  // 1. Add new GeneratedImage to state
  // 2. Create assistant message with image
  // 3. Trigger auto-save to IndexedDB
  // 4. Play notification sound
}
```

### **API Key Management**

⚠️ **Security Note**: Current implementation stores FAL API key in **localStorage** on client side.
- Key is sent with each request
- No server-side secret validation
- **Integration Impact**: Must move to environment variables + Convex for MyShortReel

---

## 3. Reusable Components & Hooks

### **Custom Hooks** (all from `lib/queries.ts`)

#### **High Reusability** (Can extract as-is)

| Hook | Purpose | Integration Path |
|------|---------|------------------|
| `useGenerateImage()` | POST to `/api/generate-image` with TanStack Query | Extract to `hooks/useImageGeneration.ts`, adapt for Convex credits |
| `useSettings()` | Read user settings from localStorage | Extract as pattern, migrate to Convex preferences table |
| `useUpdateSettings()` | Persist settings mutations | Extract pattern, adapt for Convex mutations |

#### **Medium Reusability** (Requires adaptation)

| Hook | Purpose | Adaptation |
|-------|---------|-----------|
| `useConversations()` | Fetch all conversations from IndexedDB | Replace with Convex query: `useQuery(api.conversations.list)` |
| `useCurrentConversation()` | Fetch single conversation | Replace with Convex query: `useQuery(api.conversations.get)` |
| `useSaveConversation()` | Persist to IndexedDB | Replace with Convex mutation: `useMutation(api.conversations.save)` |
| `useDeleteConversation()` | Delete from IndexedDB | Replace with Convex mutation: `useMutation(api.conversations.delete)` |

### **UI Components** (All from `components/ui/`)

**All components use Radix UI + Tailwind CSS 4** - directly compatible with MyShortReel.

```typescript
// Already compatible, zero changes needed:
- Button (variants: default, destructive, outline, ghost, link)
- Input (text input with labels)
- Textarea (multi-line input)
- Label (form labels)
- Dialog (modal dialog with trigger/content/header)
- Select (dropdown select with groups)
- ScrollArea (scrollable container)
```

### **Provider Architecture**

**Current**: TanStack React Query provider in `components/providers.tsx`
```typescript
export function Providers({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**For MyShortReel**: Convex provider already in place, TanStack Query can coexist for server state management.

---

## 4. State Management Strategy

### **Multi-Layer State Architecture**

```
┌─────────────────────────────────────────────┐
│ Component Local State (React.useState)      │
│ • UI state: showHistory, showSettings       │
│ • Editor state: prompt, selectedVersion     │
│ • Temporary: tempFalKey, tempModel         │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ TanStack React Query (Server State Cache)   │
│ • useConversations: All conversations       │
│ • useCurrentConversation: Active conversat. │
│ • useSettings: User settings                │
│ • Query invalidation on mutations           │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ Browser Storage (Persistence)               │
│ • localStorage: falKey, selectedModel       │
│ • IndexedDB: Full conversation history      │
│   (messages, images, metadata)              │
└─────────────────────────────────────────────┘
```

### **Auto-Save Pattern** (Core Pattern to Extract)

```typescript
// Auto-save hook triggered on any state change
useEffect(() => {
  if (currentConversationId && (localMessages.length > 0 || localGeneratedImages.length > 0)) {
    // Debounced save to IndexedDB
    const timer = setTimeout(() => {
      saveConversation.mutate({
        id: currentConversationId,
        messages: localMessages,
        images: localGeneratedImages,
        updatedAt: new Date(),
      });
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }
}, [localMessages, localGeneratedImages, currentConversationId]);
```

**Adaptation for MyShortReel**: Replace IndexedDB with Convex mutations with debounce/throttle.

### **Data Flow for Image Generation**

```
User clicks "Generate"
     ↓
State: setLocalMessages([...messages, userMessage])
       setLocalGeneratedImages([...images, placeholderImage])
     ↓
Mutation triggered: useGenerateImage.mutate(params)
     ↓
API Response: { imageUrl: "..." }
     ↓
State: setLocalGeneratedImages([...images, newGeneratedImage])
       setLocalMessages([...messages, assistantMessage])
     ↓
Auto-save triggered: saveConversation.mutate(...)
     ↓
IndexedDB updated (in MyShortReel: Convex updated)
     ↓
UI renders: New image visible in canvas + sidebar thumbnails
     ↓
Sound notification plays
```

---

## 5. Architectural Patterns Worth Extracting

### **Pattern 1: Conversation-Based Workflow Container** ⭐⭐⭐

**What it is**: Grouping all user interactions into isolated "conversations" with their own message history and generated artifacts.

**Why valuable**: 
- Excellent UX for generative tools (chat-like paradigm users understand)
- Enables experimentation and comparison (run multiple conversations in parallel)
- Natural persistence model (conversations = archivable projects)

**Application to other MyShortReel tools**:
- **Timeline Editor**: "Projects" or "Sequences" with clip history + transitions
- **Storyboard Generator**: "Boards" with multiple scenes + prompt refinement history
- **Prompt Generator**: "Refinement sessions" tracking prompt evolution

**Implementation Pattern**:
```typescript
interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: Message[];        // User + assistant messages
  artifacts: GeneratedImage[]; // Or: clips, boards, prompts
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}
```

### **Pattern 2: Version Tracking with Thumbnails** ⭐⭐

**What it is**: Every generated artifact (image, clip, prompt) gets unique ID with metadata, displayed in thumbnail grid allowing "time-travel" editing.

**Current Implementation**:
```typescript
interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  timestamp: Date;
  versionNumber: number; // Calculated: totalImages - 1 - index
}

// Sidebar shows all images with:
// <img src={image.url} title={image.prompt} alt={`v${image.versionNumber}`} />
```

**Why valuable**: 
- Users understand their edit history visually
- Can branch from any previous version (A/B testing)
- No "undo" needed - version grid IS the undo stack

**Application**:
- Timeline Editor: Show previous clip arrangements
- Storyboard Generator: Show previous board layouts
- Prompt Generator: Show previous prompt versions

### **Pattern 3: Server Route Handler for API Credential Management** ⭐⭐⭐

**Current Pattern**:
```
Client sends: { falKey, prompt, imageUrl, model }
     ↓
Server Route Handler (/api/generate-image)
  ├─ Validates request
  ├─ Configures FAL client with user's falKey
  ├─ Calls FAL.ai API
  └─ Returns result
     ↓
Client receives: { imageUrl }
```

**Why valuable**:
- Hides implementation details from client
- Enables logging and monitoring
- Easy to swap providers (FAL → Stability.ai → OpenAI DALL-E)
- Can add rate limiting / quota management server-side
- Security: Can validate user has credits before calling expensive API

**Generalized Pattern for MyShortReel**:
```typescript
// /api/image-editor/generate
// /api/timeline-editor/generate-transition
// /api/storyboard-generator/generate-board

// All follow pattern:
// POST /api/[feature]/[action]
// Request: { userCredentials, params }
// Response: { result, creditsUsed }
// Handles: Rate limiting, credit deduction, provider selection
```

### **Pattern 4: Auto-Save with Debounce** ⭐⭐

**What it is**: Save conversation state to persistence layer (IndexedDB or Convex) automatically on state changes with debounce.

**Benefits**:
- No explicit "Save" button needed (feels natural)
- Prevents data loss during experimentation
- Reduces database writes via debounce (500-1000ms)

**Adaptation for MyShortReel**: 
```typescript
const saveConversationDebounced = useDeferredValue(
  useMutation(api.conversations.save)
);

useEffect(() => {
  if (conversationChanged) {
    saveConversationDebounced.mutate(conversation);
  }
}, [conversation]);
```

### **Pattern 5: Graceful Degradation & User Guidance** ⭐

**Current Implementation**:
- Sound notification wrapped in try-catch (AudioContext may fail)
- Settings dialog with helpful link to FAL dashboard for getting API key
- Pulsing orange button when API key missing (visual CTA)
- Console logging with `[v0]` prefix for debugging

**For MyShortReel**: Apply to all generative features:
- Show helpful messages when credits insufficient
- Link to billing/payment when out of credits
- Show model-specific error messages from FAL

---

## 6. Integration Assessment for MyShortReel

### **Tech Stack Compatibility**

| Component | v0-for-images | MyShortReel | Compatibility |
|-----------|---------------|-----------|---|
| **Framework** | Next.js 15+ | Next.js 15+ | ✅ Perfect |
| **UI Library** | Radix UI + Tailwind 4 | Radix UI + Tailwind 4 | ✅ Perfect |
| **State Management** | React Query + localStorage | Convex + Clerk | ⚠️ Needs adaptation |
| **Auth** | None | Clerk (fully integrated) | ⚠️ Needs adding |
| **Database** | IndexedDB (client) | Convex (server) | ⚠️ Migration needed |
| **Credit System** | None | Exists + integrated | ⚠️ Needs adding |
| **FAL Integration** | Direct (client-side key) | Already integrated | ⚠️ Needs consistency |

### **Integration Approach: Extract Patterns, Not Direct Code**

**Recommendation**: **Don't directly integrate v0-for-images as a feature**. Instead:

1. ✅ Extract **Conversation-based UI pattern** for use in Timeline Editor & Storyboard Generator
2. ✅ Extract **Version tracking pattern** for timeline clip history
3. ✅ Extract **Server route handler pattern** for all generative features
4. ✅ Extract **Auto-save pattern** with Convex mutations
5. ✅ Reuse **all UI components** directly (Button, Dialog, Select, etc.)
6. ✅ Reuse **TanStack Query mutation pattern** with Convex adaptation

**Why not direct integration**:
- Feature already planned: **Image Generator** (8-12h) in priority list
- v0-for-images is iterative editing (requires previous image as input each time)
- MyShortReel Image Generator likely needs: upload → generate → refine cycle
- v0-for-images would be redundant if Image Generator exists

### **Integration Effort Estimation** (If direct integration chosen)

**Complexity**: MEDIUM (88-128h, single developer)

**Effort Breakdown**:

| Phase | Effort | Details |
|-------|--------|---------|
| **1. Architecture & Convex** | 24-32h | Create Convex tables: conversations, messages, generatedImages; Replace IndexedDB queries |
| **2. Auth & Security** | 16-24h | Add Clerk auth wrapper; Remove localStorage API key storage; Move to env vars |
| **3. Credit System** | 24-32h | Check credits before generation; Deduct on success; Toast notifications |
| **4. File Upload** | 8-16h | Replace native FileReader with `useFileUpload` hook |
| **5. Testing & Polish** | 16-24h | E2E testing, error scenarios, performance |
| **TOTAL** | **88-128h** | ~2-3 weeks (11-16 days @ 8h/day) |

### **Required Convex Tables**

```typescript
// convex/imageEditor.ts

export const conversations = defineTable({
  userId: v.id("users"),
  title: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_created", ["userId", "createdAt"]);

export const messages = defineTable({
  conversationId: v.id("conversations"),
  type: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
  imageUrl: v.optional(v.string()),
  generatedImageId: v.optional(v.id("generatedImages")),
  timestamp: v.number(),
})
  .index("by_conversation", ["conversationId"])
  .index("by_timestamp", ["conversationId", "timestamp"]);

export const generatedImages = defineTable({
  conversationId: v.id("conversations"),
  userId: v.id("users"),
  url: v.string(),
  prompt: v.string(),
  model: v.string(),
  creditsUsed: v.number(),
  timestamp: v.number(),
})
  .index("by_conversation", ["conversationId"])
  .index("by_user", ["userId"]);
```

---

## 7. Comparison: v0-for-images vs Already-Planned Tools

### **Feature Overlap Analysis**

| Feature | v0-for-images | Image Generator | Timeline Editor | Storyboard Gen | Prompt Gen |
|---------|--------------|-----------------|-----------------|----------------|-----------|
| **Image Generation** | ✅ Iterative | ✅ Planned | — | ✅ Planned | — |
| **Conversation UI** | ✅ Built-in | — | ⚠️ Could use pattern | ⚠️ Could use pattern | ⚠️ Could use pattern |
| **Version Tracking** | ✅ Built-in | — | ✅ Could use pattern | ⚠️ Could use pattern | — |
| **Prompt Refinement** | Implicit | — | — | — | ✅ Planned |

### **Value Proposition**

**v0-for-images provides**:
1. ✅ **Conversation-based UX pattern** (valuable for other tools)
2. ✅ **Version tracking with thumbnails** (useful for timeline/storyboard)
3. ✅ **Auto-save pattern** (generalizable across all features)
4. ✅ **Model selection dropdown** (can reuse for other generative tools)
5. ⚠️ **Image generation implementation** (but Image Generator already planned)

**Recommendation**: Extract **Patterns #1-4**, skip direct feature integration.

---

## 8. High-Value Code Extracts

### **Extract 1: Conversation UI Shell**

```typescript
// components/ConversationEditor.tsx
// Generic conversation-based UI container
// Accepts: renderContent, onSave, messages, artifacts

interface ConversationEditorProps {
  conversation: Conversation;
  renderArtifact: (artifact: any) => ReactNode;
  onMessageSend: (message: string) => Promise<void>;
  showVersionHistory?: boolean;
}

export function ConversationEditor({
  conversation,
  renderArtifact,
  onMessageSend,
  showVersionHistory = true,
}: ConversationEditorProps) {
  return (
    <div className="flex h-full">
      {/* Left: Message history */}
      <div className="flex-1 overflow-y-auto">
        {conversation.messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Center: Current artifact */}
      <div className="flex-[2]">
        {renderArtifact(conversation.artifacts[0])}
      </div>

      {/* Right: Version grid */}
      {showVersionHistory && (
        <div className="w-48 border-l">
          <VersionGrid artifacts={conversation.artifacts} />
        </div>
      )}
    </div>
  );
}
```

### **Extract 2: Auto-Save Hook with Debounce**

```typescript
// hooks/useAutoSave.ts
import { useDeferredValue, useEffect } from 'react';

export function useAutoSave<T>(
  data: T,
  save: (data: T) => Promise<void>,
  debounceMs: number = 500
) {
  const deferredData = useDeferredValue(data);

  useEffect(() => {
    const timer = setTimeout(() => {
      save(deferredData).catch(error => {
        console.error('[useAutoSave] Save failed:', error);
        // Could trigger toast error here
      });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [deferredData, save, debounceMs]);
}

// Usage:
useAutoSave(conversation, async (data) => {
  await saveConversation.mutateAsync(data);
}, 500);
```

### **Extract 3: Server Route Provider Pattern**

```typescript
// app/api/[feature]/[action]/route.ts

export async function POST(request: Request) {
  const { userId, creditsNeeded, params } = await request.json();

  // 1. Verify authentication (Clerk)
  const user = auth().userId;
  if (!user) return new Response('Unauthorized', { status: 401 });

  // 2. Check credits
  const credits = await getCredits(user);
  if (credits < creditsNeeded) {
    return Response.json({ error: 'Insufficient credits' }, { status: 402 });
  }

  // 3. Call AI provider (FAL, Stability, OpenAI, etc.)
  const result = await provider.generate(params);

  // 4. Deduct credits
  await deductCredits(user, creditsNeeded);

  // 5. Return result
  return Response.json({
    result,
    creditsUsed: creditsNeeded,
    creditsRemaining: credits - creditsNeeded,
  });
}
```

### **Extract 4: Version Tracking Component**

```typescript
// components/VersionGrid.tsx

interface VersionGridProps {
  artifacts: Artifact[];
  onSelect: (artifactId: string) => void;
  selectedId?: string;
}

export function VersionGrid({ artifacts, onSelect, selectedId }: VersionGridProps) {
  return (
    <div className="grid grid-cols-1 gap-2 p-4">
      {artifacts.map((artifact, index) => (
        <button
          key={artifact.id}
          onClick={() => onSelect(artifact.id)}
          className={cn(
            'relative overflow-hidden rounded-lg border-2',
            selectedId === artifact.id ? 'border-blue-500' : 'border-gray-200'
          )}
        >
          <img src={artifact.preview} alt={`v${index}`} />
          <div className="absolute bottom-1 right-1 rounded bg-black/80 px-2 py-1 text-xs text-white">
            v{index}
          </div>
        </button>
      ))}
    </div>
  );
}
```

---

## 9. Recommendation & Next Steps

### **Decision Matrix**

| Option | Effort | Value | Recommendation |
|--------|--------|-------|---|
| **Direct Integration** | 2-3 weeks | Medium (feature duplication) | ❌ Skip |
| **Pattern Extraction** | 3-5 days | High (applies to 3+ tools) | ✅ **Do This** |
| **Component Reuse** | 1 day | Medium (UI components) | ✅ **Do This** |

### **Recommended Action Plan**

**Phase 1: Extract Patterns** (2-3 days)
- [ ] Create `hooks/useAutoSave.ts` (debounced save hook)
- [ ] Create `components/ConversationEditor.tsx` (generic conversation UI)
- [ ] Create `components/VersionGrid.tsx` (version tracking with thumbnails)
- [ ] Document server route pattern for generative features
- [ ] Extract model selection dropdown as reusable component

**Phase 2: Apply to Timeline Editor** (4-5 days)
- [ ] Wrap timeline in ConversationEditor for session management
- [ ] Use VersionGrid to show previous clip arrangements
- [ ] Apply auto-save pattern with Convex mutations

**Phase 3: Apply to Storyboard Generator** (4-5 days)
- [ ] Same as Timeline Editor application

**Phase 4: Ensure Consistency Across All Tools** (1-2 days)
- [ ] Standard server route pattern for all `/api/[feature]/generate`
- [ ] Standard credit deduction flow
- [ ] Standard toast/error notification pattern

### **Files to Archive from v0-for-images**

```
EXTRACT & REUSE:
✅ app/api/generate-image/route.ts → Adapt pattern for each feature
✅ components/ui/* → Direct copy to MyShortReel
✅ lib/queries.ts → Extract hooks, adapt to Convex
✅ hooks/useImageGeneration → Adapt to generic useGenerateArtifact

REFERENCE & LEARN:
📖 app/page.tsx → Study conversation workflow, state management
📖 lib/auto-save.ts → Understand debounce pattern
📖 types/ → Model conversation/message/artifact interfaces
```

---

## Summary Table

| Aspect | Assessment |
|--------|-----------|
| **Core Feature** | Iterative image editing via natural language |
| **Tech Stack Match** | ✅ Perfect (Next.js 15, React 19, Tailwind 4, Radix UI) |
| **FAL.ai Integration** | ✅ Clean server-side bridge pattern |
| **Reusable Code** | ✅ High (UI components, hooks, patterns) |
| **Direct Integration Fit** | ❌ Medium (feature overlap with planned Image Generator) |
| **Pattern Value** | ✅⭐ Conversation UI, Version tracking, Auto-save |
| **Recommendation** | **Extract patterns, not feature** |
| **Estimated Pattern Extraction** | 2-3 days |
| **Time to apply to 3 tools** | 2-3 weeks total |
| **ROI** | High (standardizes 3+ features) |

---

## Appendix: Conversation Model Reference

For implementing conversation-based features across MyShortReel:

```typescript
interface Conversation {
  id: string;
  userId: string;
  title: string;
  description?: string;
  
  // Core arrays
  messages: ConversationMessage[];
  artifacts: ArtifactBase[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
  
  // Settings
  settings: Record<string, unknown>; // Tool-specific settings
  tags?: string[];
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  artifactId?: string; // Reference to associated artifact
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface ArtifactBase {
  id: string;
  type: 'image' | 'clip' | 'board' | 'prompt'; // Discriminated union
  versionNumber: number;
  createdAt: Date;
  metadata: Record<string, unknown>;
  // + type-specific fields (url, duration, content, etc.)
}
```

This model can be reused across all MyShortReel tools with minor type extensions per feature.
