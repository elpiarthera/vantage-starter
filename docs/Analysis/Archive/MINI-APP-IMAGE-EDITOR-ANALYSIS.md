# 🎨 Mini App #2: Image Editor - Implementation Analysis

**Repository**: [EasyEdit](https://github.com/Nutlope/easyedit)  
**Date**: January 21, 2026  
**Status**: Analysis Complete

---

## Executive Summary

EasyEdit is a **lightweight, AI-powered image editing application** built with Next.js 16, React 19, and TypeScript. It offers iterative prompt-based image editing via Flux.1 Kontext model. While the **core UI and logic are port-friendly**, the application **lacks database persistence and requires significant backend refactoring** to integrate with MyShortReel's infrastructure.

**Estimated Integration Time**: **12-16 hours**

> ⚠️ **Critical Note**: EasyEdit is **stateless and session-based** (loses all edits on refresh). This is a more complex integration than Image Generator, requiring Convex database design for edit history.

---

## Feature Overview

### ✅ Core Image Editing
- **Prompt-Based Editing**: Edit images using text prompts via Flux.1 Kontext
- **Iterative Workflow**: Edit the same image multiple times with different prompts
- **Version History**: All edits kept as separate versions (array-based)
- **Model Selection**: Choose between Flux.1 Dev (faster) and Pro (higher quality)
- **Image Upload**: Drag-drop, file picker, or sample images
- **Dimension Adjustment**: Auto-scales images to max 1024px, rounds to 16px multiples
- **Download**: Save edited images locally with prompt-based naming

### ✅ User Experience Features
- **AI Suggestions**: Auto-generates 3 editing suggestions per image using Llama
- **Suggestion Caching**: Client-side caching prevents duplicate LLM calls
- **Loading States**: Spinners and shimmer placeholders during processing
- **Toast Notifications**: Sonner-based error and success messages
- **Responsive Design**: Mobile-first layout with horizontal scrolling on mobile
- **Dark Theme**: OKLCH-based color palette, always dark mode
- **Image Preloading**: Optimizes image loading via Next.js Image srcSet

### ❌ NOT Included
- Native image editing tools (selection, masking, filters, adjustments)
- Undo/redo beyond version selection
- Layer support or non-destructive editing
- Local image processing (everything cloud-based)
- Session persistence (loses all edits on refresh)
- User authentication or accounts
- Credit system or usage tracking
- Sharing or collaboration features
- Cloud storage for edit history
- Batch processing or templates

---

## Technology Stack

| Layer | Technology | MyShortReel Compatibility |
|-------|-----------|--------------------------|
| **Framework** | Next.js 16, React 19, TypeScript 5 | ✅ Exact match |
| **Styling** | Tailwind CSS 4 (OKLCH theme) | ✅ Exact match |
| **UI Components** | Sonner (toast) + Custom CSS | 🟡 Replace with Radix UI |
| **Icons** | Lucide React | ✅ Already in use |
| **AI/Image Service** | Together AI + Flux.1 Kontext | 🔴 Swap to FAL.ai + Flux |
| **Image Processing** | Canvas API, dimension rounding | ✅ Native browser APIs |
| **Image Upload** | AWS S3 via next-s3-upload | ✅ Compatible service |
| **Rate Limiting** | Upstash Redis (IP-based) | 🟡 Switch to Convex |
| **State Management** | React Hooks + localStorage | 🟡 Add Convex persistence |
| **Persistence** | None (session-based) | 🔴 Need Convex database design |
| **Analytics** | Plausible Analytics | 🟡 Switch to MyShortReel's tracking |

---

## Architecture Assessment

### Strengths
✅ **Clean Component Structure**: Modular UI split across uploadable components  
✅ **Type-Safe**: Full TypeScript with Zod validation for API inputs  
✅ **Server Actions**: Modern Next.js pattern for secure API calls  
✅ **Image Dimension Handling**: Intelligent scaling preserves aspect ratio + GPU alignment  
✅ **Lightweight Codebase**: ~1,500 LOC, easy to understand  
✅ **Responsive Design**: Works well on mobile and desktop  
✅ **Client-Side Caching**: Suggestion caching prevents redundant API calls  

### Weaknesses
⚠️ **No Persistence**: Session-only architecture, all edits lost on refresh  
⚠️ **No Authentication**: No user context or session management  
⚠️ **No State Management**: All state in page.tsx component (unscalable)  
⚠️ **No Database**: No backend to track edits, history, or user activity  
⚠️ **Custom Component Library**: No Radix UI (incompatible with MyShortReel)  
⚠️ **Fixed AI Provider**: Hardcoded to Together AI (requires abstraction)  
⚠️ **Limited Error Handling**: Minimal user feedback on failures  
⚠️ **Session History Only**: Array-based version tracking, no true undo/redo  

---

## Feature Coverage Map

| Feature | Source App | Integration Effort | Value to MyShortReel |
|---------|-----------|-------------------|---------------------|
| Prompt-based editing | EasyEdit | Direct copy | HIGH - core feature |
| Image upload (files) | EasyEdit | Adapt to S3 setup | HIGH - essential |
| Image upload (samples) | EasyEdit | Refactor to Convex | MEDIUM - onboarding |
| Model selection | EasyEdit | Direct copy | MEDIUM - flexibility |
| Version history | EasyEdit | Refactor to Convex DB | HIGH - UX requirement |
| Download edited images | EasyEdit | Direct copy | HIGH - utility |
| AI suggestions | EasyEdit | Adapt for FAL.ai | MEDIUM - power user |
| Dimension optimization | EasyEdit | Direct copy | MEDIUM - performance |
| Image preloading | EasyEdit | Direct copy | LOW - polish |
| Responsive design | EasyEdit | Direct copy | HIGH - requirement |
| Responsive image history | EasyEdit | Keep component logic | MEDIUM - UX |
| Dark theme | EasyEdit | Adapt to MyShortReel palette | MEDIUM - design system |

---

## Integration Complexity Assessment

### Easy (Direct Copy)
- Image upload UI component (ImageUploader.tsx)
- Download logic and button
- Model selection UI
- Dimension optimization logic
- Image preloading utilities
- Spinner and loading state components
- Responsive design patterns
- Toast notification patterns (replace with Radix)

**Effort**: ~2-3 hours

### Medium (Refactoring Required)
- Component integration into MyShortReel layout
- Styling adaptation to MyShortReel design tokens
- Replace Sonner with Radix UI Toast
- Migrate S3 upload configuration to MyShortReel's setup
- Adapt AI suggestions for FAL.ai instead of Together AI
- Replace localStorage API key with Convex user preferences
- Add user authentication context (Clerk)

**Effort**: ~3-4 hours

### Complex (New Implementation)
- **Database Schema**: Design Convex tables for edit history, images, versions
- **Backend Mutations**: Create saveEdit, getEditHistory, deleteEdit mutations
- **Persistence Layer**: Refactor from React state → Convex queries/mutations hybrid
- **Rate Limiting**: Build user-based rate limiting in Convex (not IP-based)
- **AI Integration**: Abstract Together AI → FAL.ai Flux model
- **Credit System**: Track credits/tokens per edit, deduct from user account
- **Session Recovery**: Allow users to resume previous editing sessions
- **History Management**: Implement pagination/cleanup for large edit histories

**Effort**: ~6-8 hours

---

## Time Estimation Breakdown

### Phase 1: Component Migration (2-3 hours)
- Copy UI components from EasyEdit
- Adapt Sonner toast → Radix UI Toast
- Replace custom Tailwind theme with MyShortReel tokens
- Remove Plausible Analytics references
- Create `/tools/image-editor/page.tsx` container
- **Deliverable**: Functional UI without AI backend or persistence

### Phase 2: Backend Infrastructure (3-4 hours)
- Design Convex schema for image edits and history
- Create Convex mutations: saveEdit, getEditHistory, deleteEdit
- Build API abstraction for Together AI → FAL.ai switch
- Implement user-based rate limiting in Convex
- Integrate with MyShortReel's Clerk authentication
- Migrate S3 configuration
- **Deliverable**: Backend ready, but no frontend integration

### Phase 3: State & Persistence (4-5 hours)
- Refactor page.tsx state to hybrid (React state + Convex queries)
- Connect image history to Convex queries
- Implement edit-saving mutations on version creation
- Add session recovery (load previous edits)
- Implement credit deduction on each edit
- Add delete/clear history functionality
- **Deliverable**: Full persistence across sessions

### Phase 4: Polish & Integration (2-3 hours)
- Replace AI suggestions server action for FAL.ai compatibility
- Mobile testing across devices
- Error handling refinement
- Accessibility audit
- i18n key addition
- Performance optimization
- **Deliverable**: Production-ready mini-app

### **TOTAL ESTIMATED TIME: 12-16 hours**

---

## Per-Component Copy Assessment

| Component | Ease | Time | Adaptations Needed |
|-----------|------|------|-------------------|
| `page.tsx` (main) | Hard | 3h | Major refactor: state → Convex, auth integration |
| `ImageUploader.tsx` | Easy | 0.5h | Keep mostly as-is, verify S3 config |
| `SampleImages.tsx` | Medium | 1h | Convert to Convex-backed template list |
| `SuggestedPrompts.tsx` | Medium | 1.5h | Adapt server action for FAL.ai LLM |
| `Fieldset.tsx` | Easy | 0.25h | Direct copy, minor styling |
| `SubmitButton.tsx` | Easy | 0.25h | Direct copy |
| `Spinner.tsx` | Easy | 0.25h | Direct copy |
| `UserAPIKey.tsx` | Hard | 1h | Remove (use Convex user context instead) |
| API `/s3-upload` | Easy | 0.5h | Keep, verify MyShortReel S3 setup |
| API `/validate-key` | Hard | 1h | Remove (use Convex auth check instead) |
| Server action `generateImage()` | Hard | 2h | Major refactor: Together → FAL.ai + Convex save |
| Server action `getSuggestions()` | Medium | 1.5h | Adapt for FAL.ai or different LLM |
| Styling/Layout | Easy | 1h | Global token replacement |
| Rate limiting logic | Medium | 1.5h | Migrate from Upstash → Convex |

---

## Dependency Check

### Existing in MyShortReel ✅
- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Lucide React icons
- Zod (validation)
- clsx (class utilities)
- AWS S3 setup

### Need to Add ⚠️
- `sonner`: Toast library (50KB)
  - Alternative: Use MyShortReel's existing Radix Toast
  - **Recommendation**: Replace with Radix Toast
- `next-s3-upload`: S3 uploader (15KB)
  - MyShortReel may have similar setup
  - Check existing S3 integration before adding

### Will Replace
- Together AI SDK → Use FAL.ai (already in next.config)
- Upstash Redis → Use Convex database
- Plausible Analytics → Use MyShortReel's analytics
- localStorage API keys → Use Convex userPreferences
- React state array → Hybrid with Convex queries

**New Dependencies**: ~1 (sonner, if not using existing toast)  
**Breaking Changes**: 0

---

## Convex Schema Design (Required)

```typescript
// convex/schema.ts - NEW TABLES NEEDED

// Image edit record
export const imageEdits = defineTable({
  userId: v.id("users"),
  sessionId: v.string(), // Group edits by session
  originalImageUrl: v.string(), // S3 or user-uploaded
  editedImageUrl: v.string(), // Result from FAL.ai
  prompt: v.string(), // User's editing prompt
  model: v.union(v.literal("dev"), v.literal("pro")), // Flux variant
  version: v.number(), // 1, 2, 3... in session
  imageWidth: v.number(),
  imageHeight: v.number(),
  tokensUsed: v.number(), // For credit tracking
  createdAt: v.number(),
}).index("by_user", ["userId"]).index("by_session", ["sessionId"]);

// Edit session (groups multiple edits)
export const editSessions = defineTable({
  userId: v.id("users"),
  sessionName: v.optional(v.string()),
  originalImageUrl: v.string(),
  totalEdits: v.number(),
  totalTokensUsed: v.number(),
  createdAt: v.number(),
  lastEditedAt: v.number(),
}).index("by_user", ["userId"]);

// Suggested prompts cache (optional)
export const promptSuggestions = defineTable({
  imageUrl: v.string(),
  suggestions: v.array(v.string()),
  generatedAt: v.number(),
  expiresAt: v.number(), // TTL for cache
}).index("by_url", ["imageUrl"]);
```

---

## Integration Complexity: Detailed Breakdown

### State Management Challenge
**Current (EasyEdit):**
```typescript
const [images, setImages] = useState([{url, version, prompt}])
// State lost on refresh
```

**Required for MyShortReel:**
```typescript
// Hybrid approach
const localImages = useState([...]) // UI state (edits in progress)
const sessionEdits = useQuery(api.imageEdits.getBySession, {sessionId})
// Mutations to persist: saveEdit(), deleteEdit(), clearSession()
```

**Complexity**: Medium-High - Requires rethinking state flow

### AI Provider Swap Challenge
**Current (EasyEdit):**
- Together AI SDK with Flux.1 Kontext
- Handles image URL + prompt → returns image URL
- Rate limited by IP (Upstash Redis)

**Required (MyShortReel):**
- FAL.ai SDK with Flux model
- API signature likely different
- Rate limited by user (Convex)
- Need to test FAL.ai image editing capabilities first

**Complexity**: High - Different APIs, needs testing

### Authentication Challenge
**Current (EasyEdit):**
- No user system
- API keys provided by user (localStorage)
- Anonymous rate limiting

**Required (MyShortReel):**
- Clerk authentication (already setup)
- No user API key input (use system credentials)
- Per-user rate limiting
- Track usage per user

**Complexity**: Medium - Straightforward integration

---

## Implementation Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| FAL.ai image editing quality | Medium | High | Test early with sample images, compare with Together AI |
| Complex state refactoring | High | Medium | Start with simple hybrid approach, iterate |
| Convex schema design errors | Medium | Medium | Pair with backend lead, review schema early |
| Session recovery complexity | Medium | Low | MVPs without recovery, add in phase 2 |
| Large edit history performance | Low | Medium | Implement pagination (50 items per page) |
| S3 storage growth | Low | Low | Implement cleanup policy (30-day retention) |
| Rate limiting edge cases | Medium | Low | Test with multiple concurrent users |
| Mobile UX with persistence | Low | Medium | Test on iOS/Android early, address UX issues |

**Contingency**: +2-3 hours for unexpected issues (particularly FAL.ai integration)

---

## Deliverables & Success Criteria

### MVP Feature Set (12-14 hours)
✅ Prompt-based image editing via FAL.ai  
✅ Image upload (files)  
✅ Persistent edit history across sessions  
✅ Model selection (Dev/Pro)  
✅ Download edited images  
✅ Credit deduction tracking  
✅ User authentication integration  
✅ Mobile responsive  
✅ i18n support  

### Optional Polish (2-3 hours)
❓ Sample/template images for onboarding  
❓ AI editing suggestions  
❓ Session naming/organization  
❓ Batch editing queue  
❓ Edit history search/filter  
❓ Share edited images (via Tool Selection Wall)  

---

## Recommended Implementation Path

### Sprint Structure (4 days, 1 developer)

**Day 1** (3-4 hours)
- Copy UI components from EasyEdit
- Replace Sonner with Radix UI Toast
- Adapt styling to MyShortReel tokens
- Create page container `/tools/image-editor/page.tsx`
- **Goal**: Visual layout complete

**Day 2** (3-4 hours)
- Design Convex schema for edit history
- Create Convex mutations (saveEdit, getEditHistory, deleteEdit)
- Build Convex rate limiting logic
- Add user authentication context
- **Goal**: Backend structure ready

**Day 3** (4-5 hours)
- Replace Together AI → FAL.ai client setup (test first!)
- Refactor page.tsx state to hybrid (local + Convex queries)
- Connect edit saving to mutations
- Implement credit deduction
- Add session recovery
- **Goal**: Full persistence working

**Day 4** (2-3 hours)
- Mobile testing
- Error handling refinement
- i18n key addition
- Accessibility audit
- Polish UI details
- **Goal**: Production-ready

---

## Comparison: Build vs Port vs Hybrid

| Metric | Build from Scratch | Port from EasyEdit | Hybrid Approach |
|--------|-------------------|-------------------|-----------------|
| **Time** | 60-80 hours | **12-16 hours** | **12-16 hours** |
| **UI Copy** | Full dev | 2-3 hours | ✅ 2-3 hours |
| **Database Design** | 8-10 hours | Required | **3-4 hours** |
| **Backend Setup** | 15-20 hours | Needed | **3-4 hours** |
| **Feature Complete** | 70% | 100% (after refactor) | **90%** |
| **Risk** | High | Medium | **Medium** |
| **Code Quality** | Variable | Production | **Production** |

**Recommended**: **PORT WITH REFACTORING** - Leverage proven UI, refactor backend for MyShortReel

---

## FAL.ai Compatibility Assessment (Critical)

⚠️ **Before proceeding, verify:**
1. Does FAL.ai have image editing (not just generation)?
2. What's the API signature for image editing tasks?
3. Is Flux.1 Kontext available on FAL.ai (or equivalent)?
4. How does rate limiting/pricing work?
5. Do dimensions/format requirements differ from Together AI?

**Action**: Create a spike task to test FAL.ai image editing before committing to port

---

## Technical Debt & Future Improvements

- Implement true undo/redo beyond version selection (command pattern)
- Add image enhancement tools (upscaling, denoising) via FAL.ai
- Implement collaborative editing (multiple users on same image)
- Add advanced prompting with templates and presets
- Create analytics dashboard for edit patterns
- Implement image optimization before storage
- Add batch processing for multiple images
- Consider adding local filters/adjustments alongside AI editing

---

## Conclusion

EasyEdit offers **excellent UI patterns and AI integration fundamentals** for a prompt-based image editor. However, the **stateless architecture requires substantial backend refactoring** to meet MyShortReel's persistence and user-tracking requirements.

**Key Challenges**:
- No existing database layer (needs Convex schema design)
- Session-only state (need hybrid architecture)
- Different AI provider (FAL.ai compatibility unknown)
- No authentication (need Clerk integration)

**Recommendation**: ✅ **PROCEED WITH PORTING + REFACTORING** - BUT conduct FAL.ai compatibility spike first

**Critical Path**:
1. Verify FAL.ai image editing capability (1-2 hours)
2. If viable: Port UI + build Convex backend
3. If not viable: Evaluate alternative AI providers or build custom solution

---

**Document Version**: 1.0  
**Last Updated**: January 21, 2026  
**Author**: Implementation Team  
**Status**: Ready for FAL.ai Spike Review
