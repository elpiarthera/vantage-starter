# 🏗️ Feature Implementation Best Practices

*Comprehensive guide to proper feature implementation patterns for MyShortReel to maintain code quality and architectural integrity*

**Last Updated**: January 11, 2025  
**Purpose**: Prevent architectural mistakes and ensure consistent, maintainable code for video generation features

---

## 🚨 Critical Principles

### **1. Route-First Architecture**
**❌ WRONG**: Adding everything to existing pages
**✅ RIGHT**: Create dedicated routes for new features

**Bad Example**:
\`\`\`tsx
// DON'T: Adding video editor to dashboard
export default function DashboardPage() {
  const [showEditor, setShowEditor] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  
  return (
    <div>
      {showEditor ? (
        <div>
          {/* 500+ lines of editor code mixed in */}
        </div>
      ) : showGallery ? (
        <div>
          {/* 400+ lines of gallery code */}
        </div>
      ) : (
        <div>
          {/* Dashboard content */}
        </div>
      )}
    </div>
  )
}
\`\`\`

**Good Example**:
\`\`\`tsx
// DO: Create dedicated routes
// app/editor/page.tsx
export default function EditorPage() {
  return <VideoEditorLayout />
}

// app/gallery/page.tsx
export default function GalleryPage() {
  return <VideoGalleryLayout />
}

// app/dashboard/page.tsx (stays focused)
export default function DashboardPage() {
  return <UserDashboard />
}
\`\`\`

### **2. Component Modularity**
**❌ WRONG**: Monolithic components with everything in one file
**✅ RIGHT**: Modular components with single responsibilities

**Bad Example**:
\`\`\`tsx
// DON'T: 1000+ line component with everything
export default function VideoCreationMegaComponent() {
  // 30+ state variables for scenes, assets, videos
  // 50+ functions for AI, video generation, uploads
  // Complex JSX with nested video players, editors, chat
  // Multiple responsibilities mixed together
}
\`\`\`

**Good Example**:
\`\`\`tsx
// DO: Modular approach following MyShortReel's pattern
// app/guided/step-3/page.tsx
export default function SceneCreationPage() {
  return <SceneCreationLayout />
}

// components/scene-creation/SceneCreationLayout.tsx
export function SceneCreationLayout() {
  return (
    <div className="scene-creation-layout">
      <SceneCreationHeader />
      <SceneCanvas />
      <SceneControls />
      <AIAssistantPanel />
    </div>
  )
}

// components/scene-creation/SceneCanvas.tsx
export function SceneCanvas() {
  // Single responsibility: scene visualization
}

// components/scene-creation/AIAssistantPanel.tsx
export function AIAssistantPanel() {
  // Single responsibility: AI chat integration
}
\`\`\`

---

## 📁 File Organization Patterns

### **3. Feature-Based Directory Structure**
**✅ MyShortReel Pattern**:
\`\`\`
app/
├── guided/
│   ├── step-1/
│   │   └── page.tsx              # Event type selection
│   ├── step-2/
│   │   └── page.tsx              # Event details input
│   ├── step-3/
│   │   └── page.tsx              # Scene creation
│   ├── step-4/
│   │   └── page.tsx              # Asset management
│   ├── step-5/
│   │   └── page.tsx              # Video preview
│   └── step-6/
│       └── page.tsx              # Video generation
├── dashboard/
│   └── page.tsx                  # User dashboard
└── page.tsx                      # Landing page

components/
├── video-creation/
│   ├── EventTypeSelector.tsx     # Step 1 component
│   ├── EventDetailsForm.tsx      # Step 2 component
│   └── VideoPreview.tsx          # Step 5 component
├── scene-management/
│   ├── SceneCanvas.tsx
│   ├── SceneEditor.tsx
│   └── SceneTimeline.tsx
├── asset-management/
│   ├── AssetUploader.tsx
│   ├── AssetGallery.tsx
│   └── AssetPreview.tsx
├── ai-assistant/
│   ├── ChatInterface.tsx
│   ├── MessageThread.tsx
│   └── SuggestionPanel.tsx
└── user-dashboard.tsx

services/
├── aiChat.ts                     # AI chat integration
├── videoGeneration.ts            # Video generation API
├── assetUpload.ts                # Asset upload handling
└── storage.ts                    # Local storage management

stores/
├── video-store.ts                # Video state management
└── scene-store.ts                # Scene state management

hooks/
├── business-logic/
│   ├── useVideoWorkflow.ts       # Video workflow logic
│   ├── useSceneManagement.ts     # Scene management logic
│   └── useAssetManagement.ts     # Asset management logic
└── use-hydration.ts              # Client-side hydration
\`\`\`

### **4. Component Naming Conventions**
**✅ MyShortReel Patterns**:
- **Page components**: `[Feature]Page.tsx` (in app directory)
- **Layout components**: `[Feature]Layout.tsx`
- **Feature components**: `[Feature][Component].tsx`
- **Service files**: `[feature].ts` (lowercase)
- **Store files**: `[feature]-store.ts` (kebab-case)
- **Hook files**: `use[Feature].ts` (camelCase with 'use' prefix)

---

## 🎯 Implementation Workflow

### **5. Feature Implementation Steps**
**✅ MyShortReel Process**:

1. **Create Route Structure**:
   \`\`\`bash
   # Create the route first
   app/[feature]/page.tsx
   \`\`\`

2. **Create Layout Component**:
   \`\`\`bash
   # Create the main layout
   components/[feature]/[Feature]Layout.tsx
   \`\`\`

3. **Break Down into Modules**:
   \`\`\`bash
   # Create individual components
   components/[feature]/[Feature]Header.tsx
   components/[feature]/[Feature]Canvas.tsx
   components/[feature]/[Feature]Controls.tsx
   \`\`\`

4. **Add Service Layer** (if needed):
   \`\`\`bash
   # Create service for API interactions
   services/[feature].ts
   \`\`\`

5. **Add State Management** (if needed):
   \`\`\`bash
   # Create store for complex state
   stores/[feature]-store.ts
   \`\`\`

6. **Create Custom Hooks** (if needed):
   \`\`\`bash
   # Create business logic hooks
   hooks/business-logic/use[Feature].ts
   \`\`\`

7. **Implement Mobile-First**:
   \`\`\`tsx
   // Use responsive design patterns
   return (
     <div className="layout">
       <div className="hidden md:block">
         <DesktopSidebar />
       </div>
       <MainContent />
       <div className="md:hidden">
         <MobileControls />
       </div>
     </div>
   )
   \`\`\`

### **6. Component Responsibility Matrix**
**✅ MyShortReel Separation**:

| Component Type | Responsibility | Example |
|---|---|---|
| **Page Component** | Route entry, layout composition | `app/guided/step-3/page.tsx` |
| **Layout Component** | Structure, responsive behavior | `SceneCreationLayout.tsx` |
| **Feature Component** | Specific functionality | `SceneCanvas.tsx` |
| **UI Component** | Reusable interface elements | `Button.tsx`, `Card.tsx` |
| **Service** | API calls, external integrations | `videoGeneration.ts` |
| **Store** | Global state management | `video-store.ts` |
| **Hook** | Business logic, side effects | `useVideoWorkflow.ts` |

---

## 🔧 Code Quality Standards

### **7. TypeScript Implementation**
**✅ Required Standards**:

\`\`\`tsx
// DO: Proper TypeScript interfaces for video features
interface VideoScene {
  id: string
  title: string
  description: string
  duration: number
  assets: Asset[]
  transitions: Transition[]
}

interface SceneEditorProps {
  scene: VideoScene
  onSceneUpdate: (scene: VideoScene) => void
  onAssetAdd: (asset: Asset) => void
  isGenerating?: boolean
}

export function SceneEditor({ 
  scene, 
  onSceneUpdate, 
  onAssetAdd,
  isGenerating = false 
}: SceneEditorProps) {
  // Implementation
}

// DO: Export types for reuse
export type { VideoScene, SceneEditorProps }
\`\`\`

### **8. State Management Patterns**
**✅ MyShortReel Patterns**:

\`\`\`tsx
// DO: Local state for component-specific data
const [isEditing, setIsEditing] = useState(false)
const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

// DO: Zustand stores for global state
import { useVideoStore } from '@/stores/video-store'
const { currentVideo, updateVideo, addScene } = useVideoStore()

// DO: Custom hooks for complex business logic
import { useVideoWorkflow } from '@/hooks/business-logic/useVideoWorkflow'
const { 
  generateVideo, 
  isGenerating, 
  progress 
} = useVideoWorkflow()

// DO: Service layer for API calls
import { generateVideoFromScenes } from '@/services/videoGeneration'
const result = await generateVideoFromScenes(scenes)
\`\`\`

### **9. Error Handling Standards**
**✅ Required Implementation**:

\`\`\`tsx
// DO: Comprehensive error handling for video operations
export function VideoGenerationComponent() {
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      
      const result = await generateVideoFromScenes(scenes)
      
      if (!result.success) {
        throw new Error(result.error || 'Video generation failed')
      }
      
      // Handle success
    } catch (err) {
      console.error('[Video Generation Error]:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Show user-friendly error message
      toast.error('Failed to generate video. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={handleGenerate}
        icon={<VideoIcon className="text-destructive" />}
      />
    )
  }

  return (
    // Component JSX
  )
}

// DO: Service-level error handling
export async function generateVideoFromScenes(scenes: VideoScene[]) {
  try {
    const response = await fetch('/api/video/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenes })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[Video Generation Service Error]:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
\`\`\`

---

## 🎨 Design System Integration

### **10. Consistent Styling Patterns**
**✅ MyShortReel Standards**:

\`\`\`tsx
// DO: Use design tokens from globals.css
<div className="bg-background text-foreground border-border">

// DO: Responsive classes for video layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// DO: Semantic class names for video features
<div className="video-scene-card">
<div className="asset-upload-zone">
<div className="generation-progress-bar">

// DO: Consistent spacing
<div className="p-4 md:p-6 lg:p-8">
<div className="space-y-4">
\`\`\`

### **11. Component Composition**
**✅ MyShortReel Patterns**:

\`\`\`tsx
// DO: Composable video creation components
<VideoCreationLayout>
  <VideoCreationHeader>
    <ProgressIndicator currentStep={3} totalSteps={6} />
    <SaveButton />
  </VideoCreationHeader>
  
  <VideoCreationContent>
    <SceneTimeline scenes={scenes} />
    <SceneEditor activeScene={activeScene} />
    <AssetPanel assets={assets} />
  </VideoCreationContent>
  
  <VideoCreationFooter>
    <NavigationButtons />
    <GenerateButton />
  </VideoCreationFooter>
</VideoCreationLayout>

// DON'T: Monolithic components with everything built-in
\`\`\`

---

## 📱 Mobile-First Implementation

### **12. Responsive Video Component Patterns**
**✅ Required Implementation**:

\`\`\`tsx
// DO: Mobile-first responsive design for video features
export function VideoPreviewComponent() {
  return (
    <div className="video-preview">
      {/* Mobile: Stack vertically */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <VideoPlayer />
        </div>
        <div className="w-full md:w-1/3">
          <VideoControls />
        </div>
      </div>
    </div>
  )
}

// DO: Conditional rendering for performance
export function SceneEditor() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  if (isMobile) {
    return <MobileSceneEditor />
  }
  
  return <DesktopSceneEditor />
}

// DO: Touch-friendly controls on mobile
<button 
  className="min-h-[44px] min-w-[44px] touch-manipulation"
  onClick={handlePlay}
>
  <PlayIcon />
</button>
\`\`\`

---

## 🧪 Testing Requirements

### **13. Component Testing Standards**
**✅ Required Tests for Video Features**:

\`\`\`tsx
// DO: Test video component behavior
describe('VideoGenerationComponent', () => {
  it('renders correctly with scenes', () => {
    const scenes = [
      { id: '1', title: 'Scene 1', duration: 5 },
      { id: '2', title: 'Scene 2', duration: 3 }
    ]
    
    render(<VideoGenerationComponent scenes={scenes} />)
    
    expect(screen.getByText('Scene 1')).toBeInTheDocument()
    expect(screen.getByText('Scene 2')).toBeInTheDocument()
  })
  
  it('handles video generation', async () => {
    const onGenerate = jest.fn()
    render(<VideoGenerationComponent onGenerate={onGenerate} />)
    
    const generateButton = screen.getByRole('button', { name: /generate/i })
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(onGenerate).toHaveBeenCalled()
    })
  })
  
  it('displays error state on failure', async () => {
    const errorMessage = 'Video generation failed'
    render(<VideoGenerationComponent error={errorMessage} />)
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})

// DO: Test service layer
describe('videoGeneration service', () => {
  it('generates video from scenes', async () => {
    const scenes = [{ id: '1', title: 'Test Scene' }]
    const result = await generateVideoFromScenes(scenes)
    
    expect(result.success).toBe(true)
    expect(result.videoUrl).toBeDefined()
  })
  
  it('handles API errors gracefully', async () => {
    // Mock API failure
    global.fetch = jest.fn(() => 
      Promise.reject(new Error('API Error'))
    )
    
    const result = await generateVideoFromScenes([])
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
\`\`\`

---

## 🚨 Common Anti-Patterns to Avoid

### **14. What NOT to Do in MyShortReel**

**❌ Mixing Video Generation Logic in UI Components**:
\`\`\`tsx
// DON'T: API calls directly in components
export default function VideoPage() {
  const handleGenerate = async () => {
    // 100+ lines of video generation logic
    const response = await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ scenes })
    })
    // Complex processing logic
    // Error handling
    // State updates
  }
  
  return <button onClick={handleGenerate}>Generate</button>
}

// DO: Use service layer and hooks
export default function VideoPage() {
  const { generateVideo, isGenerating } = useVideoWorkflow()
  
  return (
    <button 
      onClick={generateVideo} 
      disabled={isGenerating}
    >
      Generate
    </button>
  )
}
\`\`\`

**❌ Monolithic Step Components**:
\`\`\`tsx
// DON'T: Everything in one step component
export default function Step3Page() {
  // 50+ state variables
  // Scene management logic
  // Asset upload logic
  // AI chat logic
  // Video preview logic
  // 1000+ lines of mixed responsibilities
}

// DO: Modular approach
export default function Step3Page() {
  return (
    <SceneCreationLayout>
      <SceneEditor />
      <AssetPanel />
      <AIAssistant />
    </SceneCreationLayout>
  )
}
\`\`\`

**❌ Prop Drilling Through Multiple Levels**:
\`\`\`tsx
// DON'T: Pass props through 5+ levels
<VideoCreation 
  scenes={scenes}
  onSceneUpdate={onSceneUpdate}
  assets={assets}
  onAssetAdd={onAssetAdd}
  // 20+ more props
>
  <SceneEditor 
    scenes={scenes}
    onSceneUpdate={onSceneUpdate}
    // Pass down again
  >
    <SceneCanvas 
      scenes={scenes}
      onSceneUpdate={onSceneUpdate}
      // Pass down again
    />
  </SceneEditor>
</VideoCreation>

// DO: Use stores or context
const { scenes, updateScene } = useVideoStore()
const { assets, addAsset } = useAssetStore()
\`\`\`

**❌ No Loading States for Async Operations**:
\`\`\`tsx
// DON'T: No feedback during video generation
const handleGenerate = async () => {
  await generateVideo()
  // User has no idea what's happening
}

// DO: Proper loading states
const { generateVideo, isGenerating, progress } = useVideoWorkflow()

return (
  <>
    <button onClick={generateVideo} disabled={isGenerating}>
      {isGenerating ? 'Generating...' : 'Generate Video'}
    </button>
    {isGenerating && (
      <ProgressBar value={progress} max={100} />
    )}
  </>
)
\`\`\`

**❌ Inline Complex Logic**:
\`\`\`tsx
// DON'T: Complex logic in JSX
<div>
  {scenes.map(scene => (
    <div key={scene.id}>
      {scene.assets.filter(a => a.type === 'image').map(asset => (
        <img 
          src={asset.url || "/placeholder.svg"} 
          alt={asset.name}
          style={{
            width: calculateWidth(asset, scene),
            height: calculateHeight(asset, scene),
            transform: `rotate(${calculateRotation(asset)})`,
            // 20+ more inline calculations
          }}
        />
      ))}
    </div>
  ))}
</div>

// DO: Extract to components and hooks
const { processedScenes } = useSceneProcessing(scenes)

return (
  <div>
    {processedScenes.map(scene => (
      <SceneCard key={scene.id} scene={scene} />
    ))}
  </div>
)
\`\`\`

---

## ✅ Implementation Checklist

### **Before Starting Any Video Feature**:
- [ ] **Route Planning**: Does this need its own route in the guided flow?
- [ ] **Component Breakdown**: What components will I need?
- [ ] **Service Layer**: Do I need API integration?
- [ ] **State Management**: Should this use a store or local state?
- [ ] **Mobile-First**: How will video playback work on mobile?
- [ ] **TypeScript**: Are all video/scene/asset types defined?
- [ ] **Error Handling**: How do I handle generation failures?

### **During Implementation**:
- [ ] **Single Responsibility**: Each component has one clear purpose
- [ ] **Modular Structure**: Components are properly separated
- [ ] **Service Layer**: API calls are in service files, not components
- [ ] **State Management**: Using appropriate pattern (local/store/hook)
- [ ] **Responsive Design**: Mobile-first implementation
- [ ] **Loading States**: Proper feedback for async operations
- [ ] **Error Handling**: Proper error boundaries and states
- [ ] **Type Safety**: Full TypeScript coverage

### **After Implementation**:
- [ ] **Testing**: Components and services are tested
- [ ] **Documentation**: Code is properly documented
- [ ] **Performance**: Video operations are optimized
- [ ] **Accessibility**: Video controls are keyboard accessible
- [ ] **Integration**: Works with existing guided flow

---

## 🎯 Success Metrics

### **Code Quality Indicators**:
- **Component Size**: < 200 lines per component
- **File Organization**: Clear feature-based structure
- **Type Coverage**: 100% TypeScript
- **Service Separation**: No API calls in components
- **State Management**: Appropriate use of stores vs local state
- **Reusability**: Components can be used across steps

### **User Experience Indicators**:
- **Performance**: Fast video preview and generation
- **Responsiveness**: Works on all device sizes
- **Feedback**: Clear loading and error states
- **Accessibility**: Keyboard navigation and screen reader support
- **Consistency**: Follows established design patterns

### **Video Feature Specific**:
- **Generation Success Rate**: > 95%
- **Error Recovery**: Clear error messages and retry options
- **Asset Upload**: Smooth upload experience with progress
- **Preview Quality**: Fast preview rendering
- **Mobile Experience**: Touch-friendly video controls

---

## 🚀 Continuous Improvement

### **Regular Reviews**:
1. **Architecture Review**: Are we following the established patterns?
2. **Performance Review**: Are video operations optimized?
3. **User Experience Review**: Is the mobile video experience optimal?
4. **Code Quality Review**: Is the code maintainable?
5. **Service Integration Review**: Are API calls efficient?

### **Refactoring Guidelines**:
- **When to Refactor**: 
  - Component > 200 lines
  - Multiple responsibilities
  - Repeated logic across components
  - Complex prop drilling
  - Slow video operations
  
- **How to Refactor**: 
  - Break into smaller, focused components
  - Extract business logic to hooks
  - Move API calls to services
  - Use stores for shared state
  - Optimize video processing
  
- **Testing**: Ensure functionality remains intact
- **Documentation**: Update documentation after changes

---

## 📚 MyShortReel Specific Patterns

### **Guided Flow Pattern**:
\`\`\`tsx
// Each step follows this pattern:
// 1. Page component (route entry)
app/guided/step-[n]/page.tsx

// 2. Layout component (structure)
components/step-[n]/Step[N]Layout.tsx

// 3. Feature components (functionality)
components/step-[n]/[Feature]Component.tsx

// 4. Shared components (reusable)
components/shared/[Component].tsx
\`\`\`

### **Video Workflow Pattern**:
\`\`\`tsx
// 1. User input (Steps 1-2)
Event Type → Event Details

// 2. Content creation (Steps 3-4)
Scene Creation → Asset Management

// 3. Preview and generation (Steps 5-6)
Video Preview → Video Generation

// Each step should be independent but connected through stores
\`\`\`

### **State Flow Pattern**:
\`\`\`tsx
// 1. User action in component
<button onClick={handleAction}>Action</button>

// 2. Hook processes business logic
const { handleAction } = useFeatureLogic()

// 3. Service makes API call
await featureService.performAction()

// 4. Store updates global state
useFeatureStore.setState({ data: newData })

// 5. Components react to state changes
const data = useFeatureStore(state => state.data)
\`\`\`

---

*This document serves as the definitive guide for feature implementation in MyShortReel. Following these patterns ensures maintainable, scalable, and high-quality code that provides an excellent video creation experience across all devices.*
