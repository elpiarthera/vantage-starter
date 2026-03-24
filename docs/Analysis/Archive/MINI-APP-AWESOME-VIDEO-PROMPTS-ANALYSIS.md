# 📝 Mini App #5: Prompt Generator (Video Prompt Engineering) - Implementation Analysis

**Repository**: [awesome-video-prompts](https://github.com/ilkerzg/awesome-video-prompts)  
**Also Known As**: DengeAI - Video Prompt Generator  
**Date**: January 21, 2026  
**Status**: Analysis Complete

---

## Executive Summary

Awesome-Video-Prompts is a **modular, production-ready prompt engineering platform** built with Next.js 15, React 19, TypeScript, and a comprehensive monorepo (Turborepo) structure. It's designed to help users compose, enhance, and share video generation prompts using AI.

**Architecture Quality**: Excellent (modular monorepo, published UI package)  
**Tech Stack Alignment**: ✅ **Perfect** - Identical to MyShortReel  
**Estimated Integration Time**: **16-24 hours** (lowest of all - minimal refactoring, highly modular)

> ✅ **Highest Reusability**: Not just a mini-app, the entire [@workspace/ui](https://github.com/ilkerzg/awesome-video-prompts/tree/main/packages/ui) package can be extracted and reused across MyShortReel. This is a content/template creation assistant tool with exceptional modularity.

---

## Feature Overview

### ✅ Core Capabilities
- **Interactive Prompt Composer**: Multi-select carousel UI for 20+ cinematic categories
- **AI-Powered Enhancement**: Claude/GPT-4o enhancement via FAL.ai for prompt refinement
- **Image-to-Prompt Generation**: Upload reference images, AI analyzes and generates prompts
- **Real-Time Prompt Visualization**: See composition updates instantly
- **Category Management**: 20+ structured categories (lighting, camera, mood, style, etc.)
- **Model Support**: Integration ready for all AI video models (Kling, Veo, Pixverse, etc.)
- **Contribution System**: Community-driven prompt library (PR-based)
- **JSON Prompt Editor**: Structured data manipulation and validation
- **Prompt Gallery**: Browse curated prompts by category and model

### ✅ User Experience
- **Carousel-Based Selection**: Embla Carousel for smooth category browsing
- **Color-Coded Segments**: Visual feedback for selected prompt parts
- **Thumbnail Preview**: Example imagery for each option
- **Undo Enhancement**: Restore original prompt after AI refinement
- **Copy to Clipboard**: One-click prompt sharing
- **Dark/Light Mode**: Theme support via next-themes
- **Responsive Design**: Mobile-first approach
- **Advanced Search**: Full-text search + filtering by category/model

### ❌ NOT Included
- User authentication or accounts (key-based API only)
- Database persistence (static JSON only)
- Multi-user collaboration (contribution-based, not real-time)
- Prompt history or bookmarks
- Subscription management
- Analytics dashboard
- API rate limiting

---

## Technology Stack

| Layer | Technology | MyShortReel Compatibility |
|-------|-----------|--------------------------|
| **Framework** | Next.js 15 (App Router, Turbopack) | ✅ Perfect match |
| **Language** | TypeScript 5 (strict mode) | ✅ Perfect match |
| **Styling** | Tailwind CSS 4.0 + PostCSS 4.0 | ✅ Perfect match |
| **UI Components** | Radix UI + shadcn/ui | ✅ Perfect match |
| **Icons** | HugeIcons + Tabler Icons | ✅ Compatible |
| **Animations** | Motion library + Tailwind CSS | ✅ Compatible |
| **Carousels** | Embla Carousel React | ✅ Compatible |
| **State Management** | React Hooks | ✅ Perfect match |
| **Forms** | react-hook-form + Zod | ✅ Already in use |
| **Notifications** | Sonner (toast) | ✅ Already in use |
| **Theming** | next-themes | ✅ Already in use |
| **Build System** | Turborepo + pnpm | ✅ Compatible |
| **AI Integration** | FAL.ai SDK | ✅ Already integrated |
| **Data Format** | Static JSON (public directory) | ✅ Easily adaptable |
| **Analytics** | Vercel Analytics + Speed Insights | ✅ Already in use |
| **Published Package** | [@workspace/ui](https://github.com/ilkerzg/awesome-video-prompts/tree/main/packages/ui) on npm | ⚠️ Can fork/publish custom variant |

---

## Architecture Assessment

### Strengths (Exceptional)
✅ **Monorepo Structure**: Turborepo enables code sharing, optimized builds, and modular packages  
✅ **Published UI Package**: [@workspace/ui](https://github.com/ilkerzg/awesome-video-prompts/tree/main/packages/ui) can be forked and published independently  
✅ **Perfect Tech Stack**: Identical to MyShortReel (Next.js, TypeScript, Tailwind, Radix)  
✅ **Modular Design**: Clear separation between components, hooks, and business logic  
✅ **Type Safety**: Comprehensive TypeScript interfaces for all data structures  
✅ **Static Generation Ready**: Works with `next export` (no backend required)  
✅ **Client-Side Data Caching**: Smart BuildBasedCache for efficient data loading  
✅ **AI Integration Patterns**: Reusable hooks for FAL.ai integration  
✅ **Community-Driven**: Structured contribution system for content expansion  
✅ **No Database Required**: Fully functional with static JSON data  

### Weaknesses (Minimal - Already Handled in MyShortReel)
⚠️ **No Backend Persistence**: Static JSON only → **Need to add Convex for user history**
⚠️ **No Authentication**: Key-based API only → **Already have Clerk in MyShortReel**  
⚠️ **Limited State Scope**: Each page maintains own state → **Can use existing Zustand patterns if needed**  
✅ **Monorepo Structure**: Turborepo pattern → **Already familiar (MyShortReel uses monorepo)**  
✅ **Static Data Model**: JSON structure → **Perfect for template categories (query your DB instead)**  
✅ **FAL.ai Integration**: → **Already fully integrated in MyShortReel**  

---

## Feature Coverage Map

| Feature | Type | Integration | Value to MyShortReel |
|---------|------|-----------|---------------------|
| Carousel-based category selection | UI | Direct copy | HIGH - core UX pattern |
| Multi-select prompt composer | Logic | Direct copy | HIGH - content creation |
| AI prompt enhancement | Integration | FAL.ai pattern | HIGH - content optimization |
| Image-to-prompt generation | Integration | Vision model | HIGH - reference-based creation |
| Prompt gallery | Data | Map to templates | MEDIUM - inspiration/discovery |
| Model documentation | Content | Adapt to docs | MEDIUM - educational |
| Contribution system | Workflow | Adapt for templates | MEDIUM - community feature |
| Dark/light theme | UI | Direct copy | LOW - design system |
| Responsive design | UI | Direct copy | MEDIUM - mobile support |
| JSON prompt editor | UI | Direct copy | LOW - power user feature |
| Search & filtering | Logic | Direct copy | MEDIUM - discovery |

---

## Integration Complexity Assessment

### Easy (Direct Copy)
- All Radix UI component patterns
- Embla Carousel implementation
- Theme switching (next-themes)
- Dark/light mode styling
- Icons and color system
- Search and filter logic
- Copy-to-clipboard functionality

**Effort**: ~2-3 hours

### Medium (Minor Refactoring)
- Extract hooks for custom data sources
- Adapt carousel styling to MyShortReel design
- Modify system prompts for your use cases
- Create data adapter for template database
- Extend category definitions for your content types
- Add user context integration

**Effort**: ~6-8 hours

### Complex (Backend Integration)
- Add Convex tables for user prompt history (savePrompt mutation)
- Implement saved prompts/favorites (userPromptHistory table)
- Create Convex query for saved prompts (getUserPrompts)
- Wire Clerk user context (already available)
- Add analytics tracking (existing MyShortReel patterns)

**Effort**: ~8-12 hours

---

## Time Estimation Breakdown

### Phase 1: Component & Data Extraction (4-6 hours)
**✅ Already Have**: Radix UI, Tailwind, React patterns

- Copy prompt composer components
- Adapt carousel-based UI
- Map data loading to your structure
- Create custom hooks wrapper
- Port TypeScript types
- **Deliverable**: Working prompt generator UI

### Phase 2: AI Integration & Hooks (6-8 hours)
**✅ Already Have**: FAL.ai SDK, existing AI patterns

- Wire usePromptEnhancer hook to your FAL setup
- Create useImagePromptGenerator for vision analysis
- Adapt system prompts for your content types
- Handle API key management (use existing pattern)
- Implement fallback/error handling
- **Deliverable**: AI-powered prompt enhancement

### Phase 3: Data & Templates Integration (4-6 hours)
**✅ Already Have**: Template/content structure

- Create adapter for template categories
- Map awesome-video-prompts categories to your types
- Build data loader for your template database
- Implement search/filtering for your data
- Wire up template selection callbacks
- **Deliverable**: Template-aware prompt generator

### Phase 3.5: Prompt Persistence (Integrated into Phase 3, 2-3 hours)
**✅ Already Have**: Convex mutations, credit system patterns

- Add Convex table: `userPromptHistory`
- Create mutation: `savePrompt(userId, prompt, metadata)`
- Create query: `getUserPrompts(userId)`
- Wire save button callback
- **Deliverable**: Prompts saved to user account

### Phase 4: Polish & Testing (2-4 hours)
**✅ Already Have**: i18n, testing patterns

- Mobile responsiveness check
- i18n key addition (if needed)
- Error handling edge cases
- Component testing
- **Deliverable**: Production-ready

### **TOTAL ESTIMATED TIME: 16-24 hours**

---

## Data Structure for MyShortReel Adaptation

### Current Data Format
```json
{
  "prompt_details": {
    "lighting": {
      "description": "Lighting setup",
      "values": [
        {
          "value": "soft golden-hour lighting",
          "prompt": "GEL: Golden Hour SFX",
          "video-generation-prompt": "...",
          "example": { "type": "video", "url": "..." },
          "thumbnail": { "type": "image", "url": "..." }
        }
      ]
    }
  }
}
```

### Adapted for MyShortReel Templates
```typescript
interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: string
  options: TemplateOption[]
  applicableTo: string[] // content types
  contentType: "video" | "shorts" | "reel"
}

interface TemplateOption {
  id: string
  label: string
  description: string
  shortPrompt: string
  fullPrompt: string
  thumbnail?: string
  exampleUrl?: string
  tags: string[]
  category: string
}
```

### Query Pattern
```typescript
// Load templates for content type
const templates = await getTemplatesByContentType('shorts')
// Filter by category
const lighting = templates.find(t => t.name === 'lighting')
// Get all options
const options = lighting.options
```

---

## Comparison: Build vs Port

| Metric | Build Prompt Generator | Use Awesome-Video-Prompts |
|--------|------------------------|---------------------------|
| **Time** | 60-80 hours | **16-24 hours** |
| **Components** | Write all UI | 90% copy + adapt | 
| **Data Structure** | Design schema | Proven structure |
| **AI Integration** | Implement prompting | Proven patterns |
| **Carousel UX** | Custom implementation | Battle-tested Embla |
| **Type Safety** | Build from scratch | Comprehensive types |
| **Feature Complete** | 70% MVP | **95%+** |
| **Code Quality** | Variable | **Excellent** |
| **Reusability** | Low | **Exceptional** |
| **Risk** | High | **Low** |

**Recommendation**: **Use awesome-video-prompts** - unmatched ROI on effort

---

## Mini-App Integration Options

### Option 1: Embedded Component (FASTEST)
```typescript
// Use directly in editor
import { PromptComposer } from '@awesome-video-prompts/ui'

<PromptComposer 
  categories={myTemplateCategories}
  onPromptGenerated={applyPromptToTemplate}
  compact={true}
/>
```
**Effort**: 8-10 hours  
**Best For**: Quick integration, editor enhancement

### Option 2: Drawer/Modal Mini-App (RECOMMENDED)
```typescript
// Standalone prompt generator in drawer
<SceneDrawer>
  <PromptGeneratorApp 
    contentType="shorts"
    onSelectPrompt={saveToTemplate}
  />
</SceneDrawer>
```
**Effort**: 16-24 hours  
**Best For**: Full-featured tool, user focus

### Option 3: Sidebar Assistant (MODERATE)
```typescript
// Prompt helper in editor sidebar
<EditorSidebar>
  <PromptAssistant 
    currentTemplate={template}
    onApply={updateTemplate}
  />
</EditorSidebar>
```
**Effort**: 12-16 hours  
**Best For**: Contextual help, non-intrusive

---

## Implementation Strategy

### Step 1: Extract UI Package (2-3 hours)
- Fork [@workspace/ui](https://github.com/ilkerzg/awesome-video-prompts/tree/main/packages/ui) to MyShortReel
- Add to monorepo: `packages/ui-video-prompts`
- Publish to internal npm registry (if monorepo setup)
- Update Tailwind tokens to match MyShortReel

### Step 2: Create Data Adapter (3-4 hours)
- Map your template categories to awesome-prompts structure
- Create `getTemplateCategories()` function
- Build search/filter for your data
- Adapt `client-data-loader` pattern for your DB

### Step 3: Build Mini-App Component (8-12 hours)
- Create `/tools/prompt-generator/page.tsx` route
- Wire drawer/modal wrapper
- Connect template categories
- Implement prompt application callback
- Add Clerk auth context
- Wire FAL.ai integration

### Step 4: Polish & Deploy (2-3 hours)
- Mobile testing
- i18n (if needed)
- Error handling
- Analytics

---

## Convex Schema (MVP - Required)

```typescript
// Store user's generated prompts for reference/reuse
export const userPromptHistory = defineTable({
  userId: v.string(), // Clerk user ID
  contentType: v.string(), // "shorts", "reel", "video"
  
  // Selected options
  selectedCategories: v.array(v.object({
    category: v.string(), // "lighting", "mood", etc.
    selectedOption: v.string(), // "soft golden-hour lighting"
  })),
  
  // Generated outputs
  generatedPrompt: v.string(), // Combined base prompt
  enhancedPrompt: v.optional(v.string()), // After AI enhancement
  imageReference: v.optional(v.string()), // URL of reference image if used
  
  // Metadata
  isFavorited: v.boolean(),
  title: v.optional(v.string()), // User can name this prompt
  tags: v.optional(v.array(v.string())),
  
  // Timestamps
  createdAt: v.number(),
  usedAt: v.optional(v.number()), // When applied to a template
}).index("by_user", ["userId"])
  .index("by_content_type", ["contentType"])
  .index("by_favorited", ["isFavorited"]);
```

**Mutations Needed:**
```typescript
// Save generated prompt to history
export const savePrompt = mutation({
  args: { 
    userId: v.string(),
    contentType: v.string(),
    selectedCategories: v.array(v.object({...})),
    generatedPrompt: v.string(),
    enhancedPrompt: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userPromptHistory", {
      ...args,
      isFavorited: false,
      createdAt: Date.now(),
    })
  }
})

// Toggle favorite
export const toggleFavorite = mutation({
  args: { promptId: v.id("userPromptHistory") },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.promptId)
    await ctx.db.patch(args.promptId, {
      isFavorited: !prompt.isFavorited,
    })
  }
})
```

**Queries Needed:**
```typescript
// Get user's saved prompts
export const getUserPrompts = query({
  args: { userId: v.string(), contentType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("userPromptHistory").filter(
      (q) => q.eq(q.field("userId"), args.userId)
    )
    if (args.contentType) {
      q = q.filter((q) => q.eq(q.field("contentType"), args.contentType))
    }
    return await q.order("desc").collect()
  }
})

// Get user's favorites
export const getUserFavoritePrompts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userPromptHistory")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.eq(q.field("isFavorited"), true))
      .collect()
  }
})
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Data structure mismatch | Low | Low | Clear documentation of mapping |
| FAL.ai API changes | Very Low | Low | Use fal.ai as abstraction layer |
| Carousel performance (many options) | Low | Low | Implement virtualization if needed |
| UI customization complexity | Low | Low | Component props well-documented |
| Monorepo setup unfamiliar | Medium | Low | Clear documentation, examples |
| Integration with existing editor | Low | Medium | Plan component composition early |

**Contingency**: +2-4 hours for minor adjustments

---

## Success Criteria

### MVP (16-24 hours) - ALL REQUIRED
✅ Prompt composer UI works  
✅ AI enhancement functional  
✅ Image-to-prompt generation  
✅ Template categories integrated  
✅ Copy-to-clipboard workflow  
✅ **Save prompts to user account** (Convex)  
✅ **Prompt history sidebar** (show saved prompts)  
✅ **Favorite prompts** (star/heart toggle)  
✅ Mobile responsive  
✅ **Apply saved prompt to template** (callback)  

### Phase 2 (Future/Nice-to-Have)
❓ Advanced JSON editor  
❓ Batch prompt generation  
❓ Prompt templates/presets  
❓ Sharing prompts with team  
❓ Analytics on most-used prompts  

---

## Why This is Exceptional

1. **Perfect Stack Match**: Every dependency aligns with MyShortReel
2. **Minimal Refactoring**: 90% of code is portable as-is
3. **Reusable Package**: [@workspace/ui](https://github.com/ilkerzg/awesome-video-prompts/tree/main/packages/ui) can be extracted and published
4. **AI-Native**: Proven patterns for LLM + vision model integration
5. **Community-Driven**: Extensible data structure for future enhancements
6. **Production Quality**: Battle-tested, type-safe, fully documented
7. **No External Services**: Works standalone (only FAL.ai for AI features)
8. **Fastest Integration**: Lowest effort of all five mini-apps

---

## Recommendation

### **✅ HIGHEST PRIORITY MINI-APP**

**Why:**
- Fastest implementation (16-24 hours vs 24-56 for others)
- Highest code quality and modularity
- Reusable component package for future features
- Solves real user problem (better prompts = better content)
- Aligns perfectly with MyShortReel's tech stack
- Zero architectural conflicts or trade-offs

**Next Steps:**
1. ✅ Extract [@workspace/ui](https://github.com/ilkerzg/awesome-video-prompts/tree/main/packages/ui) package
2. ✅ Adapt to MyShortReel template structure
3. ✅ Create `/prompt-generator` mini-app
4. ✅ Launch as first "content assistant" tool
5. ✅ Build upon this pattern for future AI features

---

**Document Version**: 1.0  
**Last Updated**: January 21, 2026  
**Author**: Implementation Team  
**Status**: Ready for Development Assignment
