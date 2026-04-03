# Admin Portal Complete Fix & Feature Port Plan

**Date**: January 24, 2026  
**Status**: 🟢 PHASE 1-2 COMPLETE, PHASE 3 PLACEHOLDER  
**Source**: `/home/laurentperello/vertical-ai-alpha`  
**Target**: `/home/laurentperello/MyShortReel-beta`

## Implementation Status (Updated)

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Fix Wall Builder | ✅ COMPLETE | Fixed name/description display |
| Phase 2: Ads Management | ✅ COMPLETE | Schema, mutations, components, page |
| Phase 3: Refinement Flows | ⏸️ PLACEHOLDER | Schema added, pages are placeholders |
| Phase 4: i18n Keys | ✅ COMPLETE | All keys added |
| Phase 5: QA | 🔄 IN PROGRESS | TypeScript passes |

---

## Executive Summary

The admin portal was incorrectly ported from vertical-ai-alpha. This plan documents:
1. **What's broken** and why
2. **What's missing** entirely
3. **Exact fixes** needed for each component
4. **New features** to port (Ads, Refinement Flows)

---

## 🚨 Current State Analysis

### What EXISTS but is BROKEN

| Component | File | Issue | Severity |
|-----------|------|-------|----------|
| **UnifiedWallBuilder** | `components/admin/UnifiedWallBuilder.tsx` | Shows `key` and `nameTranslationKey` instead of `name` and `description` | 🔴 CRITICAL |
| **UnifiedItemPicker** | `components/admin/UnifiedItemPicker.tsx` | Same issue - raw keys instead of names | 🔴 CRITICAL |
| **SortableItem** | `components/admin/SortableItem.tsx` | Same issue - raw keys instead of names | 🔴 CRITICAL |
| **Wall Builder Page** | `app/[locale]/admin/wall-builder/page.tsx` | Works but displays broken data | 🟡 MEDIUM |

### What EXISTS and WORKS (Partially)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| **MetaCategoryList** | `components/admin/MetaCategoryList.tsx` | ✅ Works | Uses `name` field correctly |
| **MetaCategoryDialog** | `components/admin/MetaCategoryDialog.tsx` | ✅ Works | Needs minor i18n review |
| **CategoryList** | `components/admin/CategoryList.tsx` | ✅ Works | Uses `name` field correctly |
| **CategoryDialog** | `components/admin/CategoryDialog.tsx` | ✅ Works | Needs minor i18n review |
| **SubCategoryList** | `components/admin/SubCategoryList.tsx` | ✅ Works | Uses `name` field correctly |
| **SubCategoryDialog** | `components/admin/SubCategoryDialog.tsx` | ✅ Works | Needs minor i18n review |
| **ThemeList** | `components/admin/ThemeList.tsx` | ✅ Works | MyShortReel-specific (4th level) |
| **ThemeDialog** | `components/admin/ThemeDialog.tsx` | ✅ Works | MyShortReel-specific |
| **AdminHeader** | `components/admin/AdminHeader.tsx` | ✅ Works | Identical to source |
| **EmptyState** | `components/admin/EmptyState.tsx` | ✅ Works | Identical to source |
| **Admin Layout** | `app/[locale]/admin/layout.tsx` | ✅ Works | Has role gating |

### What's MISSING Entirely

| Feature | Files Needed | Backend Needed |
|---------|--------------|----------------|
| **Ads Management** | Page + 3 components | Schema + mutations |
| **Refinement Flows** | 4 pages + 6 components | Schema + mutations |
| **Category Wall Builder** | 1 page + 1 component | Uses existing mutations |

---

## 🔧 Phase 1: Fix Broken Wall Builder Components (2-3 hours)

### Root Cause

The MyShortReel data model stores both display names AND translation keys:

```typescript
// MyShortReel schema (convex/schema.ts)
tools: defineTable({
  key: v.string(),                    // "guided_flow" - Internal key
  name: v.string(),                   // "Guided Flow" - Display name ✅
  nameTranslationKey: v.string(),     // "tools.guided_flow.name" - For i18n
  description: v.string(),            // "Full 8-step..." - Display description ✅
  descriptionTranslationKey: v.string(), // For i18n
  imageUrl: v.optional(v.string()),   // Image URL
  // ...
})
```

The Wall Builder components were **incorrectly adapted** to show `key` and `nameTranslationKey` instead of `name` and `description`.

### Fix 1.1: UnifiedWallBuilder.tsx

**Current (BROKEN):**
```typescript
// Line 122-125: toItemData function
const toItemData = (item: ItemData) => ({
  ...item,
  imageUrl: item.imageUrl || "/placeholder.svg",
});
```

**Problem**: The `ItemData` interface uses wrong field names.

**Fix**: Update the interface and data mapping to use `name` and `description`:

```typescript
// BEFORE (wrong)
interface ItemData {
  _id: Id<"tools"> | ...;
  nameTranslationKey: string;      // ❌ Wrong
  descriptionTranslationKey?: string; // ❌ Wrong
  imageUrl: string;
  key: string;                     // ❌ Wrong
}

// AFTER (correct)
interface ItemData {
  _id: Id<"tools"> | ...;
  name: string;                    // ✅ Display name
  description?: string;            // ✅ Display description
  imageUrl?: string;
  key: string;                     // Keep for internal use
}
```

**Full file changes needed:**
1. Update `ItemData` interface (lines 47-53)
2. Update `toItemData` function (lines 122-125)
3. Update `getAvailableItems` function (lines 127-153)
4. Update `getBreadcrumb` function (lines 170-193) - use `name` instead of `key`
5. Update `itemsWithData` mapping (lines 243-273)

### Fix 1.2: UnifiedItemPicker.tsx

**Current (BROKEN):**
```typescript
// Line 40-43: filteredItems filter
const filteredItems = items.filter((item) =>
  item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
  item.nameTranslationKey.toLowerCase().includes(searchQuery.toLowerCase())
);

// Line 97-99: Display
<p className="font-medium text-sm truncate leading-6">{item.key}</p>
<p className="text-xs text-muted-foreground truncate leading-relaxed">
  {item.nameTranslationKey}
</p>
```

**Fix**: Use `name` and `description`:

```typescript
// Filter by name
const filteredItems = items.filter((item) =>
  item.name.toLowerCase().includes(searchQuery.toLowerCase())
);

// Display
<p className="font-medium text-sm truncate leading-6">{item.name}</p>
<p className="text-xs text-muted-foreground truncate leading-relaxed">
  {item.description || ""}
</p>
```

**Full file changes needed:**
1. Update `ItemData` interface (lines 13-19)
2. Update filter logic (lines 40-43)
3. Update display (lines 96-100)
4. Update alt text (line 91)

### Fix 1.3: SortableItem.tsx

**Current (BROKEN):**
```typescript
// Line 99-104: Display
<h4 className="font-semibold text-foreground truncate leading-6">
  {item.data.key}
</h4>
<p className="text-sm text-muted-foreground truncate leading-relaxed">
  {item.data.nameTranslationKey}
</p>
```

**Fix**: Use `name` and `description`:

```typescript
<h4 className="font-semibold text-foreground truncate leading-6">
  {item.data.name}
</h4>
<p className="text-sm text-muted-foreground truncate leading-relaxed">
  {item.data.description || ""}
</p>
```

**Full file changes needed:**
1. Update `ItemData` interface (lines 19-25)
2. Update display (lines 99-104)
3. Update alt text (line 82)

---

## 🆕 Phase 2: Port Ads Management (3-4 hours)

### 2.1 Backend: Convex Schema

Add to `convex/schema.ts`:

```typescript
/**
 * 27. Ads Table
 * Promotional ads that can be placed on walls
 */
ads: defineTable({
  title: v.string(),
  baseline: v.string(),                    // Short description
  imageUrl: v.optional(v.string()),
  image: v.optional(v.id("_storage")),
  linkUrl: v.optional(v.string()),         // Click destination
  
  // Wall targeting (which walls to show this ad on)
  targets: v.array(v.object({
    level: v.union(
      v.literal("tool"),
      v.literal("category"),
      v.literal("subcategory"),
    ),
    contextId: v.optional(v.string()),     // Parent ID (null for tool level)
  })),
  
  sortOrder: v.number(),
  isActive: v.boolean(),
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_active", ["isActive"])
  .index("by_active_and_sort", ["isActive", "sortOrder"]),
```

### 2.2 Backend: Convex Mutations

Add to `convex/tools.ts` (or create `convex/ads.ts`):

```typescript
// ============================================================
// ADS MANAGEMENT
// ============================================================

export const getAllAds = query({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const ads = await ctx.db.query("ads").collect();
    return ads.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getActiveAds = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("ads")
      .withIndex("by_active_and_sort", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const getAdsForWall = query({
  args: {
    level: v.union(v.literal("tool"), v.literal("category"), v.literal("subcategory")),
    contextId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allAds = await ctx.db
      .query("ads")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    return allAds.filter((ad) =>
      ad.targets.some(
        (target) =>
          target.level === args.level &&
          (args.level === "tool" || target.contextId === args.contextId)
      )
    );
  },
});

export const createAd = mutation({
  args: {
    title: v.string(),
    baseline: v.string(),
    imageUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    targets: v.array(v.object({
      level: v.union(v.literal("tool"), v.literal("category"), v.literal("subcategory")),
      contextId: v.optional(v.string()),
    })),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    return await ctx.db.insert("ads", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateAd = mutation({
  args: {
    adId: v.id("ads"),
    updates: v.object({
      title: v.optional(v.string()),
      baseline: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      linkUrl: v.optional(v.string()),
      targets: v.optional(v.array(v.object({
        level: v.union(v.literal("tool"), v.literal("category"), v.literal("subcategory")),
        contextId: v.optional(v.string()),
      }))),
      sortOrder: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    await ctx.db.patch(args.adId, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteAd = mutation({
  args: { adId: v.id("ads") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.adId);
  },
});
```

### 2.3 Frontend: Components to Port

| Source File | Target File | Adaptation |
|-------------|-------------|------------|
| `vertical-ai-alpha/components/admin/ad-list.tsx` | `MyShortReel-beta/components/admin/AdList.tsx` | Replace mock store with Convex, add i18n |
| `vertical-ai-alpha/components/admin/ad-dialog.tsx` | `MyShortReel-beta/components/admin/AdDialog.tsx` | Replace mock store with Convex, add i18n |
| `vertical-ai-alpha/components/admin/multi-wall-selector.tsx` | `MyShortReel-beta/components/admin/MultiWallSelector.tsx` | Replace mock store with Convex, add i18n |

### 2.4 Frontend: Page to Port

| Source File | Target File | Adaptation |
|-------------|-------------|------------|
| `vertical-ai-alpha/app/admin/ads/page.tsx` | `MyShortReel-beta/app/[locale]/admin/ads/page.tsx` | Replace mock store with Convex, add i18n, add locale |

### 2.5 Update Admin Layout

Add "Ads" to navigation in `app/[locale]/admin/layout.tsx`:

```typescript
const navigation = [
  // ... existing items
  { name: t("sidebar.ads"), href: `/${locale}/admin/ads`, icon: ImageIcon },
  // ...
];
```

---

## 🆕 Phase 3: Port Refinement Flows (4-5 hours)

### 3.1 Backend: Convex Schema

Add to `convex/schema.ts`:

```typescript
/**
 * 28. Refinement Flows Table
 * Guided question flows for user refinement
 */
refinementFlows: defineTable({
  name: v.string(),                        // Admin-facing name
  description: v.string(),
  
  // Context - where this flow applies
  triggerLevel: v.union(
    v.literal("tool"),
    v.literal("category"),
    v.literal("subcategory"),
    v.literal("vague"),                    // For vague queries
  ),
  targetId: v.string(),                    // ID of the tool/category/subcategory
  
  // Settings
  isActive: v.boolean(),
  showConsultantIntro: v.boolean(),
  consultantMessage: v.optional(v.string()),
  allowSkip: v.boolean(),
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_active", ["isActive"])
  .index("by_trigger_level", ["triggerLevel"])
  .index("by_target", ["triggerLevel", "targetId"]),

/**
 * 29. Refinement Questions Table
 * Questions within a refinement flow
 */
refinementQuestions: defineTable({
  flowId: v.id("refinementFlows"),
  
  type: v.union(
    v.literal("text-radio"),
    v.literal("text-checkbox"),
    v.literal("visual-categories"),
    v.literal("visual-subcategories"),
    v.literal("visual-ads"),
  ),
  
  question: v.string(),                    // Display text
  description: v.optional(v.string()),
  isRequired: v.boolean(),
  allowOther: v.boolean(),
  allowMultiple: v.boolean(),
  
  // For text-based questions
  options: v.optional(v.array(v.object({
    id: v.string(),
    label: v.string(),
    value: v.string(),
  }))),
  
  // For visual questions
  visualSource: v.optional(v.object({
    type: v.union(v.literal("categories"), v.literal("subcategories"), v.literal("ads")),
    categoryIds: v.optional(v.array(v.string())),
    subcategoryIds: v.optional(v.array(v.string())),
    adTargets: v.optional(v.array(v.string())),
  })),
  
  // Layout
  layout: v.optional(v.union(v.literal("grid"), v.literal("list"))),
  gridCols: v.optional(v.number()),
  
  // Conditional logic
  showIf: v.optional(v.object({
    questionId: v.string(),
    answerValue: v.union(v.string(), v.array(v.string())),
  })),
  
  defaultValue: v.optional(v.union(v.string(), v.array(v.string()))),
  
  sortOrder: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_flow", ["flowId"])
  .index("by_flow_and_order", ["flowId", "sortOrder"]),

/**
 * 30. Refinement Sessions Table
 * User sessions for refinement flows
 */
refinementSessions: defineTable({
  flowId: v.id("refinementFlows"),
  userId: v.optional(v.string()),          // Clerk user ID (if logged in)
  sessionId: v.string(),                   // Browser session ID
  
  // User's answers
  answers: v.any(),                        // Record<questionId, answer>
  
  // Navigation state
  currentQuestionIndex: v.number(),
  isComplete: v.boolean(),
  wasAbandoned: v.boolean(),
  
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  lastUpdatedAt: v.number(),
})
  .index("by_flow", ["flowId"])
  .index("by_user", ["userId"])
  .index("by_session", ["sessionId"]),
```

### 3.2 Backend: Convex Mutations

Create `convex/refinementFlows.ts`:

```typescript
// CRUD for refinement flows
export const getAllFlows = query({ ... });
export const getFlowById = query({ ... });
export const getFlowByTarget = query({ ... });
export const createFlow = mutation({ ... });
export const updateFlow = mutation({ ... });
export const deleteFlow = mutation({ ... });
export const duplicateFlow = mutation({ ... });

// CRUD for questions
export const getQuestionsForFlow = query({ ... });
export const createQuestion = mutation({ ... });
export const updateQuestion = mutation({ ... });
export const deleteQuestion = mutation({ ... });
export const reorderQuestions = mutation({ ... });

// Session management
export const createSession = mutation({ ... });
export const updateSession = mutation({ ... });
export const completeSession = mutation({ ... });
export const abandonSession = mutation({ ... });
```

### 3.3 Frontend: Components to Port

| Source File | Target File | Adaptation |
|-------------|-------------|------------|
| `refinement-flow-list.tsx` | `RefinementFlowList.tsx` | Convex + i18n |
| `refinement-flow-preview.tsx` | `RefinementFlowPreview.tsx` | Convex + i18n |
| `question-editor-dialog.tsx` | `QuestionEditorDialog.tsx` | Convex + i18n |
| `question-list.tsx` | `QuestionList.tsx` | Convex + i18n |
| `question-sortable-item.tsx` | `QuestionSortableItem.tsx` | Convex + i18n |
| `flow-settings.tsx` | `FlowSettings.tsx` | Convex + i18n |

### 3.4 Frontend: Pages to Port

| Source File | Target File | Adaptation |
|-------------|-------------|------------|
| `app/admin/refinement-flows/page.tsx` | `app/[locale]/admin/refinement-flows/page.tsx` | Convex + i18n + locale |
| `app/admin/refinement-flows/new/page.tsx` | `app/[locale]/admin/refinement-flows/new/page.tsx` | Convex + i18n + locale |
| `app/admin/refinement-flows/[id]/edit/page.tsx` | `app/[locale]/admin/refinement-flows/[id]/edit/page.tsx` | Convex + i18n + locale |
| `app/admin/refinement-flows/[id]/preview/page.tsx` | `app/[locale]/admin/refinement-flows/[id]/preview/page.tsx` | Convex + i18n + locale |

### 3.5 Update Admin Layout

Add "Refinement Flows" to navigation (already exists but verify):

```typescript
const navigation = [
  // ... existing items
  { name: t("sidebar.refinement_flows"), href: `/${locale}/admin/refinement-flows`, icon: Sparkles },
  // ...
];
```

---

## 🌐 Phase 4: i18n Translation Keys (1 hour)

### 4.1 Add Missing Translation Keys

Add to `messages/en.json`:

```json
{
  "admin": {
    "ads": {
      "title": "Ads",
      "description": "Manage promotional ads and configure which walls they appear on",
      "actions": {
        "add": "Add Ad"
      },
      "empty_title": "No ads yet",
      "empty_description": "Create promotional ads to display on your category wall",
      "confirm_delete": "Are you sure you want to delete this ad?",
      "form": {
        "title": "Ad Title",
        "baseline": "Baseline",
        "image": "Ad Image",
        "link_url": "Link URL (Optional)",
        "link_url_help": "Where should users go when they click this ad?",
        "order": "Display Order",
        "active": "Active Status",
        "active_help": "Make this ad visible in the store",
        "targets": "Wall Targeting",
        "targets_help": "Select which walls this ad should appear on"
      },
      "dialog": {
        "create_title": "Create Ad",
        "edit_title": "Edit Ad",
        "create_description": "Add a new promotional ad",
        "edit_description": "Update the ad details below"
      },
      "labels": {
        "has_link": "Has Link",
        "walls_targeted": "{count} wall(s) targeted"
      }
    },
    "refinement_flows": {
      "title": "Refinement Flows",
      "description": "Configure guided question flows for meta-categories, categories, and subcategories",
      "actions": {
        "create": "Create Flow"
      },
      "empty_title": "No refinement flows yet",
      "empty_description": "Create your first flow to guide users with targeted questions",
      "confirm_delete": "Are you sure you want to delete this refinement flow?",
      "filters": {
        "level": "Filter by Level",
        "all_levels": "All Levels",
        "meta_category": "Meta-Category",
        "category": "Category",
        "subcategory": "Subcategory",
        "vague": "Vague Query"
      },
      "labels": {
        "level": "Level",
        "target": "Target",
        "questions": "Questions",
        "not_set": "Not Set",
        "global": "Global"
      },
      "form": {
        "name": "Flow Name",
        "description": "Description",
        "level": "Level",
        "target": "Target",
        "active": "Active"
      }
    },
    "wall_builder": {
      "title": "Wall Builder",
      "subtitle": "Configure tool selection walls",
      "select_level": "Wall Level",
      "levels": {
        "meta_category": "Tool Wall",
        "category": "Category Wall",
        "subcategory": "SubCategory Wall",
        "theme": "Theme Wall"
      },
      "select_tool": "Select Tool",
      "select_category": "Select Category",
      "select_subcategory": "Select SubCategory",
      "select_parent_prompt": "Choose parent...",
      "select_parent": "Please select a parent to configure its wall",
      "current_wall": "Current Wall",
      "drag_to_reorder": "Drag items to reorder them",
      "available_items": "Available Items",
      "search_items": "Search items...",
      "no_items_available": "No items available",
      "empty_states": {
        "empty_wall_title": "No items on the wall",
        "empty_wall_description": "Add items from the picker on the right to get started"
      },
      "type_labels": {
        "tool": "Tool",
        "category": "Category",
        "subcategory": "SubCategory",
        "theme": "Theme"
      },
      "order_label": "Order: {order}",
      "aria_drag_to_reorder": "Drag to reorder",
      "aria_remove_from_wall": "Remove from wall",
      "aria_add_to_wall": "Add {item} to wall",
      "aria_already_on_wall": "Already on wall"
    }
  }
}
```

### 4.2 Run Translation Script

```bash
cd /home/laurentperello/MyShortReel-beta && pnpm translate
```

---

## ✅ Phase 5: QA & Testing (1-2 hours)

### 5.1 Code Quality Checks

```bash
# TypeScript check
npx tsc --noEmit

# Biome lint and format
npx biome check --write
```

### 5.2 Functional Testing Checklist

#### Wall Builder
- [ ] Tool Wall displays tools with correct names and images
- [ ] Category Wall displays categories with correct names and images
- [ ] SubCategory Wall displays subcategories with correct names and images
- [ ] Theme Wall displays themes with correct names and images
- [ ] Drag and drop reordering works
- [ ] Add item to wall works
- [ ] Remove item from wall works
- [ ] Search/filter works

#### Ads Management
- [ ] Ads list displays correctly
- [ ] Create new ad works
- [ ] Edit existing ad works
- [ ] Delete ad works
- [ ] Toggle active/inactive works
- [ ] Wall targeting selector works
- [ ] Ads appear on targeted walls

#### Refinement Flows
- [ ] Flow list displays correctly
- [ ] Create new flow works
- [ ] Edit flow settings works
- [ ] Add/edit/delete questions works
- [ ] Question reordering works
- [ ] Flow preview works
- [ ] Duplicate flow works
- [ ] Delete flow works

---

## 📋 Implementation Checklist

### Phase 1: Fix Broken Components (2-3 hours)
- [ ] Fix `UnifiedWallBuilder.tsx` - use `name`/`description`
- [ ] Fix `UnifiedItemPicker.tsx` - use `name`/`description`
- [ ] Fix `SortableItem.tsx` - use `name`/`description`
- [ ] Run TypeScript check
- [ ] Run Biome lint
- [ ] Test Wall Builder UI

### Phase 2: Port Ads Management (3-4 hours)
- [ ] Add `ads` table to schema
- [ ] Add ads queries/mutations to Convex
- [ ] Deploy Convex: `npx convex dev --once`
- [ ] Port `AdList.tsx` component
- [ ] Port `AdDialog.tsx` component
- [ ] Port `MultiWallSelector.tsx` component
- [ ] Port `ads/page.tsx`
- [ ] Add "Ads" to admin navigation
- [ ] Add i18n keys
- [ ] Run translation script
- [ ] Test Ads CRUD

### Phase 3: Port Refinement Flows (4-5 hours)
- [ ] Add `refinementFlows` table to schema
- [ ] Add `refinementQuestions` table to schema
- [ ] Add `refinementSessions` table to schema
- [ ] Create `convex/refinementFlows.ts` with all mutations
- [ ] Deploy Convex: `npx convex dev --once`
- [ ] Port `RefinementFlowList.tsx`
- [ ] Port `RefinementFlowPreview.tsx`
- [ ] Port `QuestionEditorDialog.tsx`
- [ ] Port `QuestionList.tsx`
- [ ] Port `QuestionSortableItem.tsx`
- [ ] Port `FlowSettings.tsx`
- [ ] Port `refinement-flows/page.tsx`
- [ ] Port `refinement-flows/new/page.tsx`
- [ ] Port `refinement-flows/[id]/edit/page.tsx`
- [ ] Port `refinement-flows/[id]/preview/page.tsx`
- [ ] Add i18n keys
- [ ] Run translation script
- [ ] Test Refinement Flows CRUD

### Phase 4: Final QA (1-2 hours)
- [ ] Run full TypeScript check
- [ ] Run full Biome lint
- [ ] Test all admin pages on desktop
- [ ] Test all admin pages on mobile
- [ ] Verify all translations display correctly
- [ ] Deploy to Vercel preview
- [ ] Smoke test on preview

---

## 📊 Time Estimation

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Fix Broken Components | 2-3 hours |
| Phase 2: Port Ads Management | 3-4 hours |
| Phase 3: Port Refinement Flows | 4-5 hours |
| Phase 4: i18n Keys | 1 hour |
| Phase 5: QA & Testing | 1-2 hours |
| **Total** | **11-15 hours** |

---

## 🚀 Deployment Plan

1. **Local Development**
   - Complete all phases locally
   - Run all QA checks

2. **Convex Dev Deployment**
   ```bash
   npx convex dev --once
   ```

3. **Vercel Preview Deployment**
   - Push to feature branch
   - Verify preview deployment

4. **Production Deployment**
   ```bash
   npx convex deploy
   ```
   - Merge to main
   - Verify production

---

**Document Version**: 1.0  
**Last Updated**: January 24, 2026  
**Author**: AI Assistant
