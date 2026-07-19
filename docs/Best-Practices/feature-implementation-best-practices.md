# 🏗️ Feature Implementation Best Practices

*Comprehensive guide to proper feature implementation patterns for this template, to maintain code quality and architectural integrity*

**Last Updated**: January 11, 2025  
**Purpose**: Prevent architectural mistakes and ensure consistent, maintainable code

---

## 🚨 Critical Principles

### **1. Route-First Architecture**
**❌ WRONG**: Adding everything to existing pages
**✅ RIGHT**: Create dedicated routes for new features

**Bad Example**:
\`\`\`tsx
// DON'T: Adding a record editor and a browser to the dashboard
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
  return <RecordEditorLayout />
}

// app/library/page.tsx
export default function LibraryPage() {
  return <RecordLibraryLayout />
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
export default function RecordCreationMegaComponent() {
  // 30+ state variables for the form, its attachments, its history
  // 50+ functions for validation, persistence, uploads
  // Complex JSX with nested editors, pickers, chat
  // Multiple responsibilities mixed together
}
\`\`\`

**Good Example**:
\`\`\`tsx
// DO: Modular approach following the recommended pattern
// app/[locale]/dashboard/records/[id]/page.tsx
export default function RecordEditorPage() {
  return <RecordEditorLayout />
}

// components/record-editor/RecordEditorLayout.tsx
export function RecordEditorLayout() {
  return (
    <div className="record-editor-layout">
      <RecordEditorHeader />
      <RecordForm />
      <RecordActions />
      <AIAssistantPanel />
    </div>
  )
}

// components/record-editor/RecordForm.tsx
export function RecordForm() {
  // Single responsibility: field rendering and validation
}

// components/record-editor/AIAssistantPanel.tsx
export function AIAssistantPanel() {
  // Single responsibility: AI chat integration
}
\`\`\`

---

## 📁 File Organization Patterns

### **3. Feature-Based Directory Structure**
**✅ Recommended Pattern**:
\`\`\`
app/
└── [locale]/
    ├── dashboard/
    │   ├── page.tsx              # Dashboard home
    │   └── records/
    │       ├── page.tsx          # Record list
    │       └── [id]/
    │           └── page.tsx      # Record editor
    ├── onboarding/
    │   └── page.tsx              # Post-signup setup
    └── page.tsx                  # Landing page

components/
├── record-editor/
│   ├── RecordEditorLayout.tsx
│   ├── RecordForm.tsx
│   └── RecordActions.tsx
├── record-list/
│   ├── RecordTable.tsx
│   ├── RecordFilters.tsx
│   └── RecordCard.tsx
├── asset-management/
│   ├── AssetUploader.tsx
│   ├── AssetGallery.tsx
│   └── AssetPreview.tsx
├── ai-assistant/
│   ├── ChatInterface.tsx
│   ├── MessageThread.tsx
│   └── SuggestionPanel.tsx
└── user-dashboard.tsx

convex/
├── records.ts                    # Record queries + mutations
├── assets.ts                     # Asset metadata + storage
└── aiChat.ts                     # AI actions (external API calls)

services/
├── aiChat.ts                     # Client-side AI chat wrapper
└── assetUpload.ts                # Upload orchestration

stores/
└── record-store.ts               # Ephemeral UI state (selection, drafts)

hooks/
├── business-logic/
│   ├── useRecordWorkflow.ts      # Record workflow logic
│   └── useAssetManagement.ts     # Asset management logic
└── use-hydration.ts              # Client-side hydration
\`\`\`

### **4. Component Naming Conventions**
**✅ Recommended Patterns**:
- **Page components**: `[Feature]Page.tsx` (in app directory)
- **Layout components**: `[Feature]Layout.tsx`
- **Feature components**: `[Feature][Component].tsx`
- **Service files**: `[feature].ts` (lowercase)
- **Store files**: `[feature]-store.ts` (kebab-case)
- **Hook files**: `use[Feature].ts` (camelCase with 'use' prefix)

---

## 🎯 Implementation Workflow

### **5. Feature Implementation Steps**
**✅ Recommended Process**:

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
**✅ Recommended Separation**:

| Component Type | Responsibility | Example |
|---|---|---|
| **Page Component** | Route entry, layout composition | `app/[locale]/dashboard/records/[id]/page.tsx` |
| **Layout Component** | Structure, responsive behavior | `RecordEditorLayout.tsx` |
| **Feature Component** | Specific functionality | `RecordForm.tsx` |
| **UI Component** | Reusable interface elements | `Button.tsx`, `Card.tsx` |
| **Service** | API calls, external integrations | `assetUpload.ts` |
| **Store** | Global state management | `record-store.ts` |
| **Hook** | Business logic, side effects | `useRecordWorkflow.ts` |

---

## 🔧 Code Quality Standards

### **7. TypeScript Implementation**
**✅ Required Standards**:

\`\`\`tsx
// DO: Derive entity types from the Convex schema, never redeclare them
import type { Doc } from "@/convex/_generated/dataModel"

type Record = Doc<"records">

// DO: Declare explicit prop contracts for components
interface RecordEditorProps {
  record: Record
  onRecordUpdate: (record: Record) => void
  onAssetAdd: (asset: Doc<"assets">) => void
  isSaving?: boolean
}

export function RecordEditor({
  record,
  onRecordUpdate,
  onAssetAdd,
  isSaving = false
}: RecordEditorProps) {
  // Implementation
}

// DO: Export types for reuse
export type { Record, RecordEditorProps }
\`\`\`

### **8. State Management Patterns**
**✅ Recommended Patterns**:

\`\`\`tsx
// DO: Local state for component-specific data
const [isEditing, setIsEditing] = useState(false)
const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

// DO: Convex queries/mutations for ALL persisted data
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
const record = useQuery(api.records.get, { id: recordId })
const updateRecord = useMutation(api.records.update)

// DO: Zustand stores for ephemeral cross-component UI state only
import { useRecordStore } from '@/stores/record-store'
const { selectedId, select } = useRecordStore()

// DO: Custom hooks for complex business logic
import { useRecordWorkflow } from '@/hooks/business-logic/useRecordWorkflow'
const {
  submitRecord,
  isSubmitting,
  progress
} = useRecordWorkflow()
\`\`\`

### **9. Error Handling Standards**
**✅ Required Implementation**:

\`\`\`tsx
// DO: Comprehensive error handling around long-running operations
export function RecordSubmitComponent({ recordId }: { recordId: Id<"records"> }) {
  const t = useTranslations('records')
  const submitRecord = useMutation(api.records.submit)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      await submitRecord({ id: recordId })

      // Handle success
    } catch (err) {
      console.error('[Record Submit Error]:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')

      // Show user-friendly error message
      toast.error(t('submit_failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={handleSubmit}
        icon={<AlertCircleIcon className="text-destructive" />}
      />
    )
  }

  return (
    // Component JSX
  )
}

// DO: Server-level error handling — throw with context, let the caller surface it
export const submit = mutation({
  args: { id: v.id('records') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const record = await ctx.db.get(args.id)
    if (!record) throw new Error('Record not found')
    if (record.userId !== identity.subject) throw new Error('Unauthorized')

    await ctx.db.patch(args.id, { status: 'submitted', updatedAt: Date.now() })
  },
})
\`\`\`

---

## 🎨 Design System Integration

### **10. Consistent Styling Patterns**
**✅ Recommended Standards**:

\`\`\`tsx
// DO: Use design tokens from globals.css
<div className="bg-background text-foreground border-border">

// DO: Responsive classes for grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// DO: Semantic class names for feature elements
<div className="record-card">
<div className="asset-upload-zone">
<div className="submit-progress-bar">

// DO: Consistent spacing
<div className="p-4 md:p-6 lg:p-8">
<div className="space-y-4">
\`\`\`

### **11. Component Composition**
**✅ Recommended Patterns**:

\`\`\`tsx
// DO: Composable feature components
<RecordEditorLayout>
  <RecordEditorHeader>
    <Breadcrumbs />
    <SaveButton />
  </RecordEditorHeader>

  <RecordEditorContent>
    <RecordForm record={record} />
    <AssetPanel assets={assets} />
  </RecordEditorContent>

  <RecordEditorFooter>
    <NavigationButtons />
    <SubmitButton />
  </RecordEditorFooter>
</RecordEditorLayout>

// DON'T: Monolithic components with everything built-in
\`\`\`

---

## 📱 Mobile-First Implementation

### **12. Responsive Component Patterns**
**✅ Required Implementation**:

\`\`\`tsx
// DO: Mobile-first responsive design
export function RecordDetailComponent() {
  return (
    <div className="record-detail">
      {/* Mobile: Stack vertically */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <RecordForm />
        </div>
        <div className="w-full md:w-1/3">
          <RecordSidebar />
        </div>
      </div>
    </div>
  )
}

// DO: Conditional rendering for performance
export function RecordEditor() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (isMobile) {
    return <MobileRecordEditor />
  }

  return <DesktopRecordEditor />
}

// DO: Touch-friendly controls on mobile
<button
  className="min-h-[44px] min-w-[44px] touch-manipulation"
  onClick={handleSave}
>
  <SaveIcon />
</button>
\`\`\`

---

## 🧪 Testing Requirements

### **13. Component Testing Standards**
**✅ Required Tests for Every Feature**:

\`\`\`tsx
// DO: Test component behavior
describe('RecordList', () => {
  it('renders correctly with records', () => {
    const records = [
      { _id: '1', name: 'First record' },
      { _id: '2', name: 'Second record' }
    ]

    render(<RecordList records={records} />)

    expect(screen.getByText('First record')).toBeInTheDocument()
    expect(screen.getByText('Second record')).toBeInTheDocument()
  })

  it('handles submission', async () => {
    const onSubmit = jest.fn()
    render(<RecordList onSubmit={onSubmit} />)

    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
  })

  it('displays error state on failure', async () => {
    const errorMessage = 'Submission failed'
    render(<RecordList error={errorMessage} />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})

// DO: Test Convex functions with convex-test
describe('records.submit', () => {
  it('rejects an unauthenticated caller', async () => {
    const t = convexTest(schema)
    await expect(
      t.mutation(api.records.submit, { id: recordId })
    ).rejects.toThrow('Unauthenticated')
  })

  it('rejects a caller who does not own the record', async () => {
    const t = convexTest(schema)
    await expect(
      t.withIdentity({ subject: 'other_user' })
       .mutation(api.records.submit, { id: recordId })
    ).rejects.toThrow('Unauthorized')
  })
})
\`\`\`

---

## 🚨 Common Anti-Patterns to Avoid

### **14. What NOT to Do**

**❌ Mixing Business Logic into UI Components**:
\`\`\`tsx
// DON'T: API calls and orchestration directly in components
export default function RecordPage() {
  const handleSubmit = async () => {
    // 100+ lines of validation, persistence and side-effect logic
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify({ record })
    })
    // Complex processing logic
    // Error handling
    // State updates
  }

  return <button onClick={handleSubmit}>Submit</button>
}

// DO: Use Convex functions behind a business-logic hook
export default function RecordPage() {
  const { submitRecord, isSubmitting } = useRecordWorkflow()

  return (
    <button
      onClick={submitRecord}
      disabled={isSubmitting}
    >
      Submit
    </button>
  )
}
\`\`\`

**❌ Monolithic Page Components**:
\`\`\`tsx
// DON'T: Everything in one page component
export default function RecordPage() {
  // 50+ state variables
  // Form logic
  // Asset upload logic
  // AI chat logic
  // Preview logic
  // 1000+ lines of mixed responsibilities
}

// DO: Modular approach
export default function RecordPage() {
  return (
    <RecordEditorLayout>
      <RecordForm />
      <AssetPanel />
      <AIAssistant />
    </RecordEditorLayout>
  )
}
\`\`\`

**❌ Prop Drilling Through Multiple Levels**:
\`\`\`tsx
// DON'T: Pass props through 5+ levels
<RecordEditor
  record={record}
  onRecordUpdate={onRecordUpdate}
  assets={assets}
  onAssetAdd={onAssetAdd}
  // 20+ more props
>
  <RecordSection
    record={record}
    onRecordUpdate={onRecordUpdate}
    // Pass down again
  >
    <RecordField
      record={record}
      onRecordUpdate={onRecordUpdate}
      // Pass down again
    />
  </RecordSection>
</RecordEditor>

// DO: Read from Convex where the data is needed, or use a store for UI state
const record = useQuery(api.records.get, { id: recordId })
const updateRecord = useMutation(api.records.update)
\`\`\`

**❌ No Loading States for Async Operations**:
\`\`\`tsx
// DON'T: No feedback during a long operation
const handleSubmit = async () => {
  await submitRecord()
  // User has no idea what's happening
}

// DO: Proper loading states
const { submitRecord, isSubmitting, progress } = useRecordWorkflow()

return (
  <>
    <button onClick={submitRecord} disabled={isSubmitting}>
      {isSubmitting ? t('submitting') : t('submit')}
    </button>
    {isSubmitting && (
      <ProgressBar value={progress} max={100} />
    )}
  </>
)
\`\`\`

**❌ Inline Complex Logic**:
\`\`\`tsx
// DON'T: Complex logic in JSX
<div>
  {records.map(record => (
    <div key={record._id}>
      {record.assets.filter(a => a.type === 'image').map(asset => (
        <img
          src={asset.url || "/placeholder.svg"}
          alt={asset.filename}
          style={{
            width: calculateWidth(asset, record),
            height: calculateHeight(asset, record),
            // 20+ more inline calculations
          }}
        />
      ))}
    </div>
  ))}
</div>

// DO: Extract to components and hooks
const { processedRecords } = useRecordProcessing(records)

return (
  <div>
    {processedRecords.map(record => (
      <RecordCard key={record._id} record={record} />
    ))}
  </div>
)
\`\`\`

---

## ✅ Implementation Checklist

### **Before Starting Any Feature**:
- [ ] **Route Planning**: Does this need its own route?
- [ ] **Component Breakdown**: What components will I need?
- [ ] **Data Layer**: Which Convex queries/mutations does this need?
- [ ] **State Management**: Should this use a store or local state?
- [ ] **Mobile-First**: How does this behave on a small screen?
- [ ] **TypeScript**: Are all entity types derived from the Convex schema?
- [ ] **i18n**: Is every user-facing string going through `useTranslations()`?
- [ ] **Error Handling**: How do I handle failures of the slow path?

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
- [ ] **Testing**: Components and Convex functions are tested
- [ ] **Documentation**: Code is properly documented
- [ ] **Performance**: Queries use indexes, no N+1 patterns
- [ ] **Accessibility**: Controls are keyboard accessible
- [ ] **Integration**: Works with existing routes and navigation

---

## 🎯 Success Metrics

### **Code Quality Indicators**:
- **Component Size**: < 200 lines per component
- **File Organization**: Clear feature-based structure
- **Type Coverage**: 100% TypeScript, no `any`
- **Layer Separation**: No direct API calls in components
- **State Management**: Appropriate use of stores vs local state
- **Reusability**: Components can be used across routes

### **User Experience Indicators**:
- **Performance**: Fast first paint, responsive interactions
- **Responsiveness**: Works on all device sizes
- **Feedback**: Clear loading and error states
- **Accessibility**: Keyboard navigation and screen reader support
- **Consistency**: Follows established design patterns
- **Error Recovery**: Clear error messages and retry options

---

## 🚀 Continuous Improvement

### **Regular Reviews**:
1. **Architecture Review**: Are we following the established patterns?
2. **Performance Review**: Are queries indexed and payloads small?
3. **User Experience Review**: Is the mobile experience optimal?
4. **Code Quality Review**: Is the code maintainable?
5. **Integration Review**: Are external API calls efficient and retried?

### **Refactoring Guidelines**:
- **When to Refactor**: 
  - Component > 200 lines
  - Multiple responsibilities
  - Repeated logic across components
  - Complex prop drilling
  - Slow queries or oversized payloads
  
- **How to Refactor**: 
  - Break into smaller, focused components
  - Extract business logic to hooks
  - Move external API calls into Convex actions
  - Use stores for shared UI state
  - Add indexes rather than filtering client-side
  
- **Testing**: Ensure functionality remains intact
- **Documentation**: Update documentation after changes

---

## 📚 Reference Patterns

### **Multi-Step Flow Pattern**:
\`\`\`tsx
// For a wizard/checkout/onboarding flow, each step follows this pattern:
// 1. Page component (route entry)
app/[locale]/[flow]/step-[n]/page.tsx

// 2. Layout component (structure)
components/[flow]/Step[N]Layout.tsx

// 3. Feature components (functionality)
components/[flow]/[Feature]Component.tsx

// 4. Shared components (reusable)
components/shared/[Component].tsx
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

*This document serves as the definitive guide for feature implementation in this template. Following these patterns ensures maintainable, scalable, high-quality code across all devices.*
