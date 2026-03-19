# 🎨 Tool Selection Wall Feature - PRD

**Document Status**: Product Requirements Definition  
**Created**: January 20, 2026  
**Last Updated**: January 21, 2026 (v2.2 - Revised time estimation, added implementation checklist)  
**Priority**: P1 - Core Feature  
**Audience**: Engineering Team

---

## 📋 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Architecture Overview](#3-architecture-overview)
4. [Data Model](#4-data-model)
5. [User Experience](#5-user-experience)
6. [Admin Dashboard](#6-admin-dashboard)
7. [Database Schema (Convex)](#7-database-schema-convex)
8. [Frontend Components](#8-frontend-components)
9. [Code Reuse Strategy](#9-code-reuse-strategy)
10. [Implementation Plan](#10-implementation-plan)
11. [Current State → New State Mapping](#11-current-state--new-state-mapping)
12. [Design System Integration](#12-design-system-integration)
13. [Internationalization (i18n)](#13-internationalization-i18n)
14. [Success Criteria](#14-success-criteria)
15. [Testing Plan](#15-testing-plan)
16. [Implementation Hours Estimation](#16-implementation-hours-estimation)
17. [Future Enhancements](#17-future-enhancements)
18. [Dependencies & Constraints](#18-dependencies--constraints)
19. [Appendix](#19-appendix)

---

## 1. Executive Summary

Replace the current main landing page (Step 0) with a **dynamic, admin-controlled "Tool Selection Wall"** that allows users to discover and choose between multiple video creation tools and features (mini-apps).

### Key Concept

The Tool Selection Wall is a **layer on top of existing mini-apps**. It doesn't replace any existing functionality—it provides a unified entry point that pre-populates each mini-app with the user's selections.

### What This Feature Enables

| Stakeholder | Benefit |
|-------------|---------|
| **Users** | Discover available tools via visual wall interface, make selections upfront |
| **Admins** | Manage tools, categories, subcategories, and themes via Convex database + dashboard |
| **Developers** | Easy addition of new mini-apps without code changes to the wall |

### Architecture Parallel

Identical to Vertical AI's 3-level hierarchy system, **extended to 4 levels with optional depth per tool**:

```
Meta Categories (Tools) → Categories → SubCategories → Themes
        ↓                    ↓              ↓            ↓
   Guided Flow          Birthday        Vintage       Joyful
   Image Generator      Wedding         Y2K           Nostalgic
   Music Generator      Corporate       Anime         Romantic
   Quick Video          ...             ...           ...
```

### Critical Constraints

| Constraint | Description |
|------------|-------------|
| **DO NOT modify Guided Flow** | Existing `/guided/*` routes remain unchanged |
| **Pre-populate, don't replace** | Wall selections are passed as query params to pre-fill mini-apps |
| **Flexible depth** | Each tool can have 0-4 levels configured in admin |

---

## 2. Problem Statement

### Current State

```
User lands on: /guided/step-0 (hardcoded landing page)
    ↓
Step 0: "The Guided Director" info page
    ↓
Step 1: Select Occasion (hardcoded list)
    ↓
Step 2b: Select Style (hardcoded list)
    ↓
... continues through steps 3-6
```

**Issues:**
- Single entry point - only Guided Flow is accessible
- Hardcoded occasions and styles - no admin control
- No way to add new tools/features without code changes
- Future mini-apps (Image Generator, Music Generator, etc.) have no unified entry point

### Desired State

```
User lands on: /tools (Tool Selection Wall)
    ↓
Selects a Tool (e.g., "Guided Flow")
    ↓
[Optional] Selects Category in modal (e.g., "Birthday")
    ↓
[Optional] Selects SubCategory in modal (e.g., "Vintage")
    ↓
[Optional] Selects Theme in modal (e.g., "Joyful")
    ↓
Navigates to: /guided/step-0?occasion=birthday&style=vintage&theme=joyful
    ↓
Step 0 shows pre-populated selections, user proceeds faster
```

**Benefits:**
- Unified entry point for all mini-apps
- Fully configurable via Convex database
- Admin dashboard to manage all levels
- Each tool can have 0-4 levels of depth (flexible)
- Existing Guided Flow untouched

---

## 3. Architecture Overview

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TOOL SELECTION WALL                          │
│                         /tools (main page)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │   Guided    │  │   Image     │  │   Music     │  │   Quick     ││
│  │    Flow     │  │  Generator  │  │  Generator  │  │   Video     ││
│  │   🎬        │  │   🖼️        │  │   🎵        │  │   ⚡        ││
│  │ (4 levels)  │  │ (0 levels)  │  │ (2 levels)  │  │ (3 levels)  ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│
│                                                                     │
│  Click Tool → [Modal: Categories] → [Modal: SubCategories] →       │
│               [Modal: Themes] → Navigate to mini-app with params   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         MINI-APP DESTINATIONS                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  /guided/step-0?occasion=X&style=Y&theme=Z                         │
│  /image-generator                                                   │
│  /music-generator?genre=X&mood=Y                                   │
│  /quick-video?occasion=X&style=Y&theme=Z                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Flexible Level Configuration

Each meta-category (tool) can be configured with 0-4 levels:

| Tool | Level 1 (Categories) | Level 2 (SubCategories) | Level 3 (Themes) | Destination |
|------|---------------------|------------------------|------------------|-------------|
| **Guided Flow** | ✅ Occasions | ✅ Styles | ✅ Emotional Themes | `/guided/step-0?...` |
| **Image Generator** | ❌ | ❌ | ❌ | `/image-generator` |
| **Music Generator** | ✅ Genres | ✅ Moods | ❌ | `/music-generator?...` |
| **Quick Video** | ✅ Occasions | ✅ Styles | ✅ Themes | `/quick-video?...` |
| **Image Editor** | ❌ | ❌ | ❌ | `/image-editor` |

**Admin configures this per tool in the Wall Builder.**

### 3.3 Data Flow

```
┌─────────────────┐
│  User lands on  │
│     /tools      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Convex Query:  │
│  getToolMeta    │
│  Categories()   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Render Tool    │
│  Selection Wall │
│  (Grid of Tools)│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│           User clicks a tool                 │
├─────────────────────────────────────────────┤
│                                             │
│  IF tool.hasCategories === false            │
│     → Navigate directly to tool.targetUrl  │
│                                             │
│  ELSE                                       │
│     → Open Category Modal                   │
│     → Convex Query: getCategories(toolId)  │
│     → User selects category                 │
│                                             │
│     IF tool.hasSubCategories === false      │
│        → Navigate to tool.targetUrl?cat=X  │
│                                             │
│     ELSE                                    │
│        → Open SubCategory Modal             │
│        → User selects subcategory           │
│                                             │
│        IF tool.hasThemes === false          │
│           → Navigate with cat=X&subcat=Y   │
│                                             │
│        ELSE                                 │
│           → Open Theme Modal                │
│           → User selects theme              │
│           → Navigate with all params        │
│                                             │
└─────────────────────────────────────────────┘
```

### 3.4 Routing Structure

```
app/[locale]/
├── tools/                          # NEW: Main entry point (Tool Selection Wall)
│   ├── page.tsx                    # Single page with wall + modals
│   └── layout.tsx                  # Shared layout
│
├── guided/                         # UNCHANGED: Existing guided flow
│   ├── step-0/page.tsx             # Now receives ?occasion=X&style=Y&theme=Z
│   ├── step-1/page.tsx             # Pre-populated with selections
│   ├── step-2/page.tsx
│   ├── step-2b/page.tsx
│   ├── step-3/page.tsx
│   ├── step-3b/page.tsx
│   ├── step-4/page.tsx
│   ├── step-5/page.tsx
│   └── step-6/page.tsx
│
├── image-generator/                # FUTURE: Mini-app pages
│   └── page.tsx
├── image-editor/
│   └── page.tsx
├── music-generator/
│   └── page.tsx
└── quick-video/
    └── page.tsx
```

---

## 4. Data Model

### 4.1 Four-Level Hierarchy (Flexible Depth)

```typescript
// LEVEL 1: Meta Categories (Tools/Features)
interface ToolMetaCategory {
  _id: Id<"toolMetaCategories">
  name: string                    // "Guided Flow", "Image Generator"
  description: string
  icon: string                    // Emoji or icon identifier
  slug: string                    // "guided-flow", "image-generator"
  targetUrl: string               // "/guided/step-0", "/image-generator"
  imageUrl?: string               // Featured image (Convex storage)
  color?: string                  // Accent color (hex)
  
  // Flexible depth configuration
  hasCategories: boolean          // Does this tool have Level 2?
  hasSubCategories: boolean       // Does this tool have Level 3?
  hasThemes: boolean              // Does this tool have Level 4?
  
  // Query param names (customizable per tool)
  categoryParamName?: string      // Default: "category", can be "occasion", "genre"
  subCategoryParamName?: string   // Default: "subcategory", can be "style", "mood"
  themeParamName?: string         // Default: "theme"
  
  order: number
  isActive: boolean
  createdAt: number
  updatedAt: number
}

// LEVEL 2: Categories (Occasions/Genres/Use Cases)
interface ToolCategory {
  _id: Id<"toolCategories">
  toolMetaCategoryId: Id<"toolMetaCategories">
  name: string                    // "Birthday", "Wedding", "Jazz"
  description: string
  icon?: string
  slug: string
  imageUrl?: string
  order: number
  isActive: boolean
  createdAt: number
  updatedAt: number
}

// LEVEL 3: SubCategories (Styles/Moods/Variants)
interface ToolSubCategory {
  _id: Id<"toolSubCategories">
  toolCategoryId: Id<"toolCategories">
  name: string                    // "Vintage", "Y2K", "Anime"
  description: string
  slug: string
  imageUrl: string                // Required for visual wall
  order: number
  isActive: boolean
  createdAt: number
  updatedAt: number
}

// LEVEL 4: Themes (Emotional Themes/Tones)
// NOTE: Themes are REUSABLE across subcategories via junction table
interface ToolTheme {
  _id: Id<"toolThemes">
  name: string                    // "Joyful", "Nostalgic", "Romantic"
  description: string
  slug: string
  color?: string                  // Visual color representation
  imageUrl?: string
  order: number
  isActive: boolean
  createdAt: number
  updatedAt: number
}

// Junction table for theme-subcategory relationship (many-to-many)
interface ToolSubCategoryTheme {
  _id: Id<"toolSubCategoryThemes">
  toolSubCategoryId: Id<"toolSubCategories">
  toolThemeId: Id<"toolThemes">
  order: number                   // Display order within this subcategory
  isActive: boolean
}
```

### 4.2 Wall Configuration (Ordering & Layout)

**Configuration Scope**: Global (same wall for all users)

```typescript
interface ToolWallConfig {
  _id: Id<"toolWallConfigs">
  level: "meta-category" | "category" | "subcategory" | "theme"
  contextId?: Id<"toolMetaCategories"> | Id<"toolCategories"> | Id<"toolSubCategories">
  itemIds: string[]               // Ordered array of IDs
  pinnedIds?: string[]            // Featured/pinned items
  updatedAt: number
  updatedBy: Id<"users">
}
```

**Note**: Wall configuration is **global** - all users see the same wall layout. User-specific walls are out of scope for MVP.

### 4.3 Theme Reusability

Themes (emotional tones) can be **reused across multiple subcategories** without duplication:

```
Example:
├── Birthday (occasion)
│   ├── Vintage (style)
│   │   ├── Joyful ←────────────┐
│   │   ├── Nostalgic ←─────────┤ Same themes
│   │   └── Romantic ←──────────┤ reused
│   └── Anime (style)           │
│       ├── Joyful ←────────────┤
│       ├── Energetic           │
│       └── Romantic ←──────────┘
└── Wedding (occasion)
    └── Cinematic (style)
        ├── Romantic ←──────────── Same "Romantic" theme
        ├── Tender
        └── Nostalgic ←────────── Same "Nostalgic" theme
```

**Implementation**: Junction table `toolSubCategoryThemes` connects themes to subcategories (many-to-many relationship).

### 4.3 Seed Data Example

```typescript
// Meta Categories (Tools)
const seedMetaCategories = [
  {
    name: "Guided Flow",
    description: "Full 8-step video creation with AI assistance",
    icon: "🎬",
    slug: "guided-flow",
    targetUrl: "/guided/step-0",
    hasCategories: true,
    hasSubCategories: true,
    hasThemes: true,
    categoryParamName: "occasion",
    subCategoryParamName: "style",
    themeParamName: "theme",
    order: 1,
    isActive: true,
  },
  {
    name: "Image Generator",
    description: "Create stunning images from text prompts",
    icon: "🖼️",
    slug: "image-generator",
    targetUrl: "/image-generator",
    hasCategories: false,
    hasSubCategories: false,
    hasThemes: false,
    order: 2,
    isActive: true,
  },
  {
    name: "Music Generator",
    description: "Generate custom music tracks",
    icon: "🎵",
    slug: "music-generator",
    targetUrl: "/music-generator",
    hasCategories: true,
    hasSubCategories: true,
    hasThemes: false,
    categoryParamName: "genre",
    subCategoryParamName: "mood",
    order: 3,
    isActive: true,
  },
]

// Categories for Guided Flow (Occasions)
const seedGuidedFlowCategories = [
  { name: "Wedding", slug: "wedding", icon: "💍", order: 1 },
  { name: "Birthday", slug: "birthday", icon: "🎂", order: 2 },
  { name: "Anniversary", slug: "anniversary", icon: "📅", order: 3 },
  { name: "Baby Shower", slug: "baby-shower", icon: "👶", order: 4 },
  { name: "Graduation", slug: "graduation", icon: "🎓", order: 5 },
  { name: "Corporate", slug: "corporate", icon: "💼", order: 6 },
  { name: "Holiday", slug: "holiday", icon: "🎁", order: 7 },
  { name: "Engagement", slug: "engagement", icon: "💑", order: 8 },
]

// SubCategories (Visual Styles) - same for all occasions initially
const seedStyles = [
  { name: "Cinematic", slug: "cinematic", icon: "🎬" },
  { name: "Vintage", slug: "vintage", icon: "📼" },
  { name: "Y2K", slug: "y2k", icon: "💿" },
  { name: "Anime", slug: "anime", icon: "🌸" },
  { name: "Pop", slug: "pop", icon: "🎨" },
  { name: "Dreamy", slug: "dreamy", icon: "☁️" },
  { name: "Film Noir", slug: "film-noir", icon: "🕵️" },
  { name: "3D Cartoon", slug: "3d-cartoon", icon: "🎪" },
  // ... more styles
]

// Themes (Emotional Themes) - REUSABLE across all subcategories
const seedThemes = [
  { name: "Joyful", slug: "joyful", color: "#FF6B6B" },
  { name: "Nostalgic", slug: "nostalgic", color: "#8B5A3C" },
  { name: "Romantic", slug: "romantic", color: "#FF6B9B" },
  { name: "Energetic", slug: "energetic", color: "#FFA500" },
  { name: "Tender", slug: "tender", color: "#4ECDC4" },
  { name: "Motivational", slug: "motivational", color: "#4E90CD" },
]

// Note: After creating themes, assign them to subcategories via junction table
// Each subcategory can have any combination of themes
// Example: "Birthday/Vintage" might have [Joyful, Nostalgic, Romantic]
// Example: "Wedding/Cinematic" might have [Romantic, Tender, Nostalgic]
```

---

## 5. User Experience

### 5.1 Main Tool Selection Page (`/tools`)

**Layout**: Single page with persistent wall + modal overlays

**Main Wall (Always Visible)**:
- Grid of available tools (meta-categories)
- Mobile: Single column, stacked cards
- Desktop: 2-3 column grid
- Visual cards with:
  - Tool name
  - Description
  - Icon/Image
  - Color accent
  - CTA: "Get Started" or "Explore"

### 5.2 User Flow: Guided Flow Example

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: User lands on /tools                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Guided    │  │   Image     │  │   Music     │                 │
│  │    Flow     │  │  Generator  │  │  Generator  │                 │
│  │   🎬        │  │   🖼️        │  │   🎵        │                 │
│  │ [Explore →] │  │ [Start →]   │  │ [Explore →] │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                     │
│  User clicks "Guided Flow"                                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: Category Modal Opens                                        │
│ URL: /tools?tool=guided-flow                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Select an Occasion                        │   │
│  │  ← Back                                                      │   │
│  │                                                               │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │   │
│  │  │ Wedding │ │Birthday │ │Annivers.│ │ Baby    │            │   │
│  │  │   💍    │ │   🎂    │ │   📅    │ │ Shower  │            │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  User clicks "Birthday"                                             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: SubCategory Modal Opens                                     │
│ URL: /tools?tool=guided-flow&occasion=birthday                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Choose a Style                            │   │
│  │  ← Back to Occasions                                         │   │
│  │                                                               │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │   │
│  │  │ Vintage │ │  Y2K    │ │ Anime   │ │Cinematic│            │   │
│  │  │ [image] │ │ [image] │ │ [image] │ │ [image] │            │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  User clicks "Vintage"                                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: Theme Modal Opens                                           │
│ URL: /tools?tool=guided-flow&occasion=birthday&style=vintage        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                 Select Emotional Theme                       │   │
│  │  ← Back to Styles                                            │   │
│  │                                                               │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │   │
│  │  │ Joyful  │ │Nostalgic│ │Romantic │ │Energetic│            │   │
│  │  │  ❤️🧡   │ │  🤎🖤   │ │  💗💕   │ │  🧡💛   │            │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  User clicks "Joyful"                                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5: Navigate to Guided Flow Step 0                              │
│ URL: /guided/step-0?occasion=birthday&style=vintage&theme=joyful    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Step 0 page shows:                                                 │
│  - Summary: "You've selected: Birthday • Vintage • Joyful"          │
│  - Pre-filled context for faster progression                        │
│  - User clicks "Begin Your Film" to proceed to Step 1               │
│                                                                     │
│  Step 1 automatically has:                                          │
│  - Occasion pre-selected as "Birthday"                              │
│  - Theme pre-selected as "Joyful"                                   │
│  - User can still change these if desired                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 User Flow: Image Generator Example (No Sub-levels)

```
User lands on /tools
    ↓
Clicks "Image Generator" card
    ↓
(No modals - tool has hasCategories: false)
    ↓
Navigates directly to: /image-generator
```

### 5.4 Modal Behavior

| Behavior | Desktop | Mobile |
|----------|---------|--------|
| **Modal Type** | Centered overlay (50-70% width) | Full-screen drawer (slides up) |
| **Backdrop** | Semi-transparent, click to close | Same |
| **Navigation** | Back button in modal header | Same |
| **Transition** | Smooth fade/scale | Slide up/down |
| **Browser Back** | Closes modal (via query params) | Same |

### 5.5 URL Pattern

```
/tools                                                    # Main wall
/tools?tool=guided-flow                                   # Category modal open
/tools?tool=guided-flow&occasion=birthday                 # SubCategory modal open
/tools?tool=guided-flow&occasion=birthday&style=vintage   # Theme modal open

# After final selection, navigate to destination:
/guided/step-0?occasion=birthday&style=vintage&theme=joyful
```

---

## 6. Admin Dashboard

### 6.1 Dashboard Structure

```
/admin/                             # Admin root (protected by role)
├── layout.tsx                      # Admin layout with sidebar
├── page.tsx                        # Dashboard home
└── tools/                          # Tool management section
    ├── page.tsx                    # Overview of all tools
    ├── meta-categories/
    │   ├── page.tsx                # List all tools
    │   ├── new/page.tsx            # Create new tool
    │   └── [id]/edit/page.tsx      # Edit tool
    ├── categories/
    │   ├── page.tsx                # List with tool filter
    │   ├── new/page.tsx
    │   └── [id]/edit/page.tsx
    ├── subcategories/
    │   ├── page.tsx                # List with category filter
    │   ├── new/page.tsx
    │   └── [id]/edit/page.tsx
    ├── themes/
    │   ├── page.tsx                # List with subcategory filter
    │   ├── new/page.tsx
    │   └── [id]/edit/page.tsx
    └── wall-builder/
        └── page.tsx                # Drag-drop wall builder
```

### 6.2 Admin Access Control

**Role-based access** using `role` field in users table:

```typescript
// In users table (Convex schema)
users: defineTable({
  // ... existing fields
  role: v.optional(v.string()),  // "admin" | undefined
})

// In admin layout
const user = await getUser(ctx)
if (user?.role !== "admin") {
  redirect("/")  // or show 403
}

// In navigation (show Admin link only for admins)
{user?.role === "admin" && (
  <Link href="/admin">Admin Dashboard</Link>
)}
```

### 6.3 Meta Categories Management

**Create/Edit Form Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Tool name (max 50 chars) |
| `description` | string | ✅ | Short description (max 200 chars) |
| `icon` | string | ✅ | Emoji or icon identifier |
| `slug` | string | ✅ | Auto-generated from name |
| `targetUrl` | string | ✅ | Destination URL (e.g., `/guided/step-0`) |
| `imageUrl` | file upload | ❌ | Featured image |
| `color` | color picker | ❌ | Accent color (hex) |
| `hasCategories` | boolean | ✅ | Enable Level 2? |
| `hasSubCategories` | boolean | ✅ | Enable Level 3? (only if hasCategories) |
| `hasThemes` | boolean | ✅ | Enable Level 4? (only if hasSubCategories) |
| `categoryParamName` | string | ❌ | Query param name (default: "category") |
| `subCategoryParamName` | string | ❌ | Query param name (default: "subcategory") |
| `themeParamName` | string | ❌ | Query param name (default: "theme") |
| `order` | number | ❌ | Display order (auto-increment) |
| `isActive` | boolean | ✅ | Show on wall? |

**Level Configuration Logic**:
```
hasCategories: false → hasSubCategories and hasThemes are disabled
hasSubCategories: false → hasThemes is disabled
```

### 6.4 Wall Builder Interface

**Features**:
1. **Level Selector**: Choose which wall to configure
   - Meta-Category Wall (main page)
   - Category Wall (select parent tool first)
   - SubCategory Wall (select parent category first)
   - Theme Wall (select parent subcategory first)

2. **Drag-Drop Reordering**: Drag items to reorder

3. **Item Picker**: Add items from available pool

4. **Live Preview**: See how wall looks in real-time

5. **Pin/Feature**: Mark items as featured (appear first)

---

## 7. Database Schema (Convex)

### 7.1 New Tables

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // ... existing tables

  // LEVEL 1: Tools/Features
  toolMetaCategories: defineTable({
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    slug: v.string(),
    targetUrl: v.string(),
    imageUrl: v.optional(v.string()),
    color: v.optional(v.string()),
    hasCategories: v.boolean(),
    hasSubCategories: v.boolean(),
    hasThemes: v.boolean(),
    categoryParamName: v.optional(v.string()),
    subCategoryParamName: v.optional(v.string()),
    themeParamName: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive", "order"])
    .index("by_order", ["order"]),

  // LEVEL 2: Categories
  toolCategories: defineTable({
    toolMetaCategoryId: v.id("toolMetaCategories"),
    name: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    slug: v.string(),
    imageUrl: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_meta", ["toolMetaCategoryId", "order"])
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"]),

  // LEVEL 3: SubCategories
  toolSubCategories: defineTable({
    toolCategoryId: v.id("toolCategories"),
    name: v.string(),
    description: v.string(),
    slug: v.string(),
    imageUrl: v.string(),
    order: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["toolCategoryId", "order"])
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"]),

  // LEVEL 4: Themes (reusable across subcategories)
  toolThemes: defineTable({
    name: v.string(),
    description: v.string(),
    slug: v.string(),
    color: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    order: v.number(),              // Global order for admin list
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive", "order"]),

  // Junction table: SubCategory <-> Theme (many-to-many)
  toolSubCategoryThemes: defineTable({
    toolSubCategoryId: v.id("toolSubCategories"),
    toolThemeId: v.id("toolThemes"),
    order: v.number(),              // Order within this subcategory
    isActive: v.boolean(),
  })
    .index("by_subcategory", ["toolSubCategoryId", "order"])
    .index("by_theme", ["toolThemeId"]),

  // Wall ordering/layout configuration
  toolWallConfigs: defineTable({
    level: v.string(),  // "meta-category" | "category" | "subcategory" | "theme"
    contextId: v.optional(v.string()),  // Parent ID for hierarchical walls
    itemIds: v.array(v.string()),
    pinnedIds: v.optional(v.array(v.string())),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  })
    .index("by_level_context", ["level", "contextId"]),
})
```

### 7.2 Queries

```typescript
// convex/tools/queries.ts

import { query } from "../_generated/server"
import { v } from "convex/values"

// Get all active meta-categories (tools)
export const getToolMetaCategories = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("toolMetaCategories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("asc")
      .collect()
  },
})

// Get categories for a specific tool
export const getToolCategories = query({
  args: { toolMetaCategoryId: v.id("toolMetaCategories") },
  handler: async (ctx, { toolMetaCategoryId }) => {
    return await ctx.db
      .query("toolCategories")
      .withIndex("by_meta", (q) => q.eq("toolMetaCategoryId", toolMetaCategoryId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect()
  },
})

// Get subcategories for a specific category
export const getToolSubCategories = query({
  args: { toolCategoryId: v.id("toolCategories") },
  handler: async (ctx, { toolCategoryId }) => {
    return await ctx.db
      .query("toolSubCategories")
      .withIndex("by_category", (q) => q.eq("toolCategoryId", toolCategoryId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect()
  },
})

// Get themes for a specific subcategory (via junction table)
export const getToolThemes = query({
  args: { toolSubCategoryId: v.id("toolSubCategories") },
  handler: async (ctx, { toolSubCategoryId }) => {
    // Get junction records
    const junctions = await ctx.db
      .query("toolSubCategoryThemes")
      .withIndex("by_subcategory", (q) => q.eq("toolSubCategoryId", toolSubCategoryId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("asc")
      .collect()

    // Fetch actual theme data
    const themes = await Promise.all(
      junctions.map(async (j) => {
        const theme = await ctx.db.get(j.toolThemeId)
        return theme && theme.isActive ? { ...theme, order: j.order } : null
      })
    )

    return themes.filter(Boolean)
  },
})

// Get all themes (for admin - to assign to subcategories)
export const getAllToolThemes = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("toolThemes")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("asc")
      .collect()
  },
})

// Get tool by slug (for URL parsing)
export const getToolBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("toolMetaCategories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first()
  },
})
```

### 7.3 Mutations

```typescript
// convex/tools/mutations.ts

import { mutation } from "../_generated/server"
import { v } from "convex/values"

// Create meta-category
export const createToolMetaCategory = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    targetUrl: v.string(),
    imageUrl: v.optional(v.string()),
    color: v.optional(v.string()),
    hasCategories: v.boolean(),
    hasSubCategories: v.boolean(),
    hasThemes: v.boolean(),
    categoryParamName: v.optional(v.string()),
    subCategoryParamName: v.optional(v.string()),
    themeParamName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const slug = args.name.toLowerCase().replace(/\s+/g, "-")
    const lastItem = await ctx.db
      .query("toolMetaCategories")
      .withIndex("by_order")
      .order("desc")
      .first()
    const order = (lastItem?.order ?? 0) + 1

    return await ctx.db.insert("toolMetaCategories", {
      ...args,
      slug,
      order,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

// Update meta-category
export const updateToolMetaCategory = mutation({
  args: {
    id: v.id("toolMetaCategories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    targetUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    color: v.optional(v.string()),
    hasCategories: v.optional(v.boolean()),
    hasSubCategories: v.optional(v.boolean()),
    hasThemes: v.optional(v.boolean()),
    categoryParamName: v.optional(v.string()),
    subCategoryParamName: v.optional(v.string()),
    themeParamName: v.optional(v.string()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error("Meta-category not found")

    const slug = updates.name
      ? updates.name.toLowerCase().replace(/\s+/g, "-")
      : existing.slug

    await ctx.db.patch(id, {
      ...updates,
      slug,
      updatedAt: Date.now(),
    })
  },
})

// Delete (soft delete)
export const deleteToolMetaCategory = mutation({
  args: { id: v.id("toolMetaCategories") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { isActive: false, updatedAt: Date.now() })
  },
})

// Similar mutations for categories, subcategories, and themes...
```

---

## 8. Frontend Components

### 8.1 User-Facing Components

```
components/tools/
├── ToolSelectionPage.tsx           # Main page orchestrator
├── ToolSelectionWall.tsx           # Meta-category wall (always visible)
├── ToolCard.tsx                    # Individual tool card
├── SelectionModal.tsx              # Generic modal for all levels
├── CategoryWall.tsx                # Category wall (inside modal)
├── CategoryCard.tsx                # Category card
├── SubCategoryWall.tsx             # SubCategory wall
├── SubCategoryCard.tsx             # SubCategory card
├── ThemeWall.tsx                   # Theme wall
├── ThemeCard.tsx                   # Theme card
└── hooks/
    ├── useToolNavigation.ts        # Query param management
    ├── useToolMetaCategories.ts    # Fetch tools
    ├── useToolCategories.ts        # Fetch categories
    ├── useToolSubCategories.ts     # Fetch subcategories
    └── useToolThemes.ts            # Fetch themes
```

### 8.2 Key Component: ToolSelectionPage

```typescript
// components/tools/ToolSelectionPage.tsx
"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { ToolSelectionWall } from "./ToolSelectionWall"
import { SelectionModal } from "./SelectionModal"

export function ToolSelectionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Parse query params
  const selectedToolSlug = searchParams.get("tool")
  const selectedCategorySlug = searchParams.get("category") || searchParams.get("occasion")
  const selectedSubCategorySlug = searchParams.get("subcategory") || searchParams.get("style")
  const selectedThemeSlug = searchParams.get("theme")

  // Fetch selected tool details
  const selectedTool = useQuery(
    api.tools.queries.getToolBySlug,
    selectedToolSlug ? { slug: selectedToolSlug } : "skip"
  )

  // Determine which modal to show
  const getCurrentLevel = () => {
    if (!selectedToolSlug) return null
    if (!selectedTool) return "loading"
    
    if (!selectedTool.hasCategories) {
      // No sub-levels, navigate directly
      router.push(selectedTool.targetUrl)
      return null
    }
    
    if (!selectedCategorySlug) return "category"
    if (selectedTool.hasSubCategories && !selectedSubCategorySlug) return "subcategory"
    if (selectedTool.hasThemes && !selectedThemeSlug) return "theme"
    
    // All selections made, navigate to destination
    navigateToDestination()
    return null
  }

  const navigateToDestination = () => {
    if (!selectedTool) return
    
    const params = new URLSearchParams()
    if (selectedCategorySlug) {
      params.set(selectedTool.categoryParamName || "category", selectedCategorySlug)
    }
    if (selectedSubCategorySlug) {
      params.set(selectedTool.subCategoryParamName || "subcategory", selectedSubCategorySlug)
    }
    if (selectedThemeSlug) {
      params.set(selectedTool.themeParamName || "theme", selectedThemeSlug)
    }
    
    const url = `${selectedTool.targetUrl}?${params.toString()}`
    router.push(url)
  }

  const currentLevel = getCurrentLevel()

  return (
    <>
      {/* Always visible: Main tool wall */}
      <ToolSelectionWall />

      {/* Modal overlays based on current level */}
      {currentLevel === "category" && selectedTool && (
        <SelectionModal
          level="category"
          tool={selectedTool}
          onBack={() => router.push("/tools")}
        />
      )}

      {currentLevel === "subcategory" && selectedTool && (
        <SelectionModal
          level="subcategory"
          tool={selectedTool}
          selectedCategorySlug={selectedCategorySlug}
          onBack={() => {
            const params = new URLSearchParams()
            params.set("tool", selectedToolSlug!)
            router.push(`/tools?${params.toString()}`)
          }}
        />
      )}

      {currentLevel === "theme" && selectedTool && (
        <SelectionModal
          level="theme"
          tool={selectedTool}
          selectedCategorySlug={selectedCategorySlug}
          selectedSubCategorySlug={selectedSubCategorySlug}
          onBack={() => {
            const params = new URLSearchParams()
            params.set("tool", selectedToolSlug!)
            params.set(selectedTool.categoryParamName || "category", selectedCategorySlug!)
            router.push(`/tools?${params.toString()}`)
          }}
        />
      )}
    </>
  )
}
```

### 8.3 Admin Components

```
components/admin/tools/
├── ToolMetaCategoryForm.tsx        # Create/Edit tool form
├── ToolCategoryForm.tsx            # Create/Edit category form
├── ToolSubCategoryForm.tsx         # Create/Edit subcategory form
├── ToolThemeForm.tsx               # Create/Edit theme form
├── ToolListView.tsx                # Table/card list view
├── ToolWallBuilder.tsx             # Drag-drop wall builder
├── LevelSelector.tsx               # Select which level to configure
├── ItemPicker.tsx                  # Add items to wall
├── SortableItem.tsx                # Drag-drop item component
└── WallPreview.tsx                 # Live preview
```

---

## 9. Code Reuse Strategy

### 9.1 Copy from Vertical AI

**⚠️ CRITICAL**: Do NOT build from scratch. **Copy and adapt** existing code from `/home/laurentperello/vertical-ai-alpha`.

### 9.2 Files to Copy & Adapt

| Source (Vertical AI) | Target (MyShortReel) | Adaptations |
|---------------------|---------------------|-------------|
| `components/commerce/hierarchy-wall.tsx` | `components/tools/ToolSelectionWall.tsx` | Add 4th level, use Convex queries, apply MyShortReel tokens |
| `components/admin/unified-wall-builder.tsx` | `components/admin/tools/ToolWallBuilder.tsx` | Add 4th level, Convex mutations |
| `lib/meta-categories-mock-data.ts` | Remove (use Convex) | N/A |
| `lib/unified-wall-config-store.ts` | `lib/tools/wallConfigStore.ts` | Change to Convex queries |
| `app/admin/layout.tsx` | `app/admin/layout.tsx` | Add role-based access |

### 9.3 Styling Changes

```typescript
// Vertical AI (OKLCH)
bg-gradient-to-br from-emerald-900 to-emerald-950
text-emerald-400

// ↓ Change to ↓

// MyShortReel (Tailwind tokens)
bg-card border border-border      // #182634, #223649
text-primary                      // #0d7ff2
bg-background                     // #101a23
text-foreground                   // white
text-muted-foreground             // gray-400
```

---

## 10. Implementation Plan

### Phase 1: Core Data Model & Queries (3-4 hours)

**Tasks**:
1. Add Convex schema for all 4 tables
2. Create indexes for efficient querying
3. Write queries: getToolMetaCategories, getToolCategories, getToolSubCategories, getToolThemes
4. Write mutations: CRUD for all 4 levels
5. Seed initial data (Guided Flow with occasions, styles, themes)
6. Add `role` field to users table

**Deliverable**: Functional Convex backend with seed data

### Phase 2: User-Facing Wall (4-5 hours)

**Tasks**:
1. Copy & adapt `hierarchy-wall.tsx` from Vertical AI
2. Create `/tools/page.tsx` with orchestration logic
3. Implement modal system with query param navigation
4. Add support for flexible depth (0-4 levels)
5. Handle navigation to destination URLs with params
6. Apply MyShortReel styling

**Deliverable**: Working `/tools` page with full modal flow

### Phase 3: Admin Dashboard (6-8 hours)

**Tasks**:
1. Create admin layout with role-based access
2. Copy & adapt CRUD forms from Vertical AI
3. Add meta-category form with level configuration
4. Implement list views with hierarchical filters
5. Copy & adapt wall builder for 4 levels
6. Add live preview

**Deliverable**: Fully functional admin dashboard

### Phase 4: Integration & Polish (3-4 hours)

**Tasks**:
1. Update Step 0 to read query params and show summary
2. Update Step 1 to pre-populate occasion from params
3. Mobile responsive testing
4. Error handling and edge cases

**Deliverable**: Integrated feature with guided flow

### Phase 5: Internationalization (2-3 hours)

**Tasks**:
1. Add all translation keys to `messages/en.json` (see Section 13)
2. Run `pnpm translate` to generate translations for all 7 languages
3. Run `pnpm i18n:verify` to ensure all translations are complete
4. Update components to use `useTranslations()` hooks
5. Test language switching on wall and admin pages

**Deliverable**: Fully translated feature in all 7 supported languages

---

## 11. Current State → New State Mapping

### User Journey Comparison

**BEFORE**:
```
User lands on: /guided/step-0 (hardcoded)
    ↓
Step 0: Info page ("The Guided Director")
    ↓
Step 1: Select Occasion (hardcoded list)
    ↓
Step 2b: Select Style (hardcoded list)
    ↓
Steps 3-6: Video creation
```

**AFTER**:
```
User lands on: /tools (Tool Selection Wall)
    ↓
Selects: Guided Flow
    ↓
Modal: Select Occasion (from database)
    ↓
Modal: Select Style (from database)
    ↓
Modal: Select Theme (from database)
    ↓
Navigates to: /guided/step-0?occasion=X&style=Y&theme=Z
    ↓
Step 0: Shows pre-selected context, faster flow
    ↓
Step 1: Occasion pre-selected (user can change)
    ↓
Steps 2-6: Same as before
```

### What Changes

| Component | Before | After |
|-----------|--------|-------|
| Main landing | `/guided/step-0` | `/tools` |
| Step 0 | Entry point | Receives pre-selections via params |
| Step 1 occasions | Hardcoded array | Database-driven (but still in Step 1 code) |
| Step 2b styles | Hardcoded array | Database-driven (for wall), hardcoded in guided flow |
| Emotional themes | Hardcoded in Step 1 | Database-driven (4th level in wall) |

### What Stays The Same

| Component | Status |
|-----------|--------|
| Step 0 UI | Unchanged (just reads params) |
| Step 1 UI | Unchanged (just pre-selects from params) |
| Step 2-6 | Completely unchanged |
| Video generation | Unchanged |
| All existing functionality | Unchanged |

---

## 12. Design System Integration

### Colors

```typescript
// MyShortReel color tokens
const colors = {
  background: "#101a23",        // bg-background
  card: "#182634",              // bg-card
  cardBorder: "#223649",        // border-border
  secondary: "#314d68",         // bg-secondary
  primary: "#0d7ff2",           // text-primary, bg-primary
  foreground: "#ffffff",        // text-foreground
  mutedForeground: "#9ca3af",   // text-muted-foreground (gray-400)
}
```

### Typography

```typescript
// Headings
<h1 className="text-3xl font-bold text-white">
<h2 className="text-2xl font-semibold text-white">
<h3 className="text-xl font-medium text-white">

// Body
<p className="text-base text-gray-300">
<p className="text-sm text-gray-400">
```

### Responsive Grid

```typescript
// Tool cards
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Category/Style cards (in modal)
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
```

### Touch Targets

```typescript
// Minimum 44x44px (WCAG 2.1)
className="min-h-[44px] min-w-[44px]"

// Form inputs 48px (prevents iOS zoom)
className="min-h-[48px]"
```

---

## 13. Internationalization (i18n)

All user-facing strings must be translated. Add the following keys to `messages/en.json`:

### 13.1 Tool Selection Wall Namespace

```json
{
  "tool_selection": {
    "page_title": "Choose Your Tool",
    "page_subtitle": "Select a tool to get started",
    "explore_button": "Explore",
    "start_button": "Start",
    "get_started": "Get Started",
    "back_button": "Back",
    "close_button": "Close",
    
    "category_modal": {
      "title": "Select {categoryName}",
      "subtitle": "Choose a {categoryName} for your project",
      "back_to_tools": "Back to Tools"
    },
    
    "subcategory_modal": {
      "title": "Choose a Style",
      "subtitle": "Select a visual style for your {categoryName}",
      "back_to_categories": "Back to {categoryName}"
    },
    
    "theme_modal": {
      "title": "Select Emotional Theme",
      "subtitle": "Choose the emotional tone for your video",
      "back_to_styles": "Back to Styles"
    },
    
    "selection_summary": {
      "selected": "You've selected:",
      "occasion": "Occasion",
      "style": "Style", 
      "theme": "Theme",
      "continue": "Continue with these selections"
    },
    
    "empty_state": {
      "no_tools": "No tools available",
      "no_categories": "No categories available",
      "no_subcategories": "No styles available",
      "no_themes": "No themes available"
    }
  }
}
```

### 13.2 Admin Dashboard Namespace

```json
{
  "admin": {
    "navigation": {
      "dashboard": "Dashboard",
      "tools": "Tools Management",
      "meta_categories": "Meta Categories",
      "categories": "Categories",
      "subcategories": "SubCategories",
      "themes": "Themes",
      "wall_builder": "Wall Builder"
    },
    
    "common": {
      "create": "Create",
      "edit": "Edit",
      "delete": "Delete",
      "save": "Save",
      "cancel": "Cancel",
      "search": "Search...",
      "filter_by": "Filter by",
      "no_results": "No results found",
      "loading": "Loading...",
      "success": "Success",
      "error": "Error",
      "confirm_delete": "Are you sure you want to delete this item?",
      "active": "Active",
      "inactive": "Inactive"
    },
    
    "meta_categories": {
      "title": "Tool Management",
      "subtitle": "Manage available tools and features",
      "create_button": "Create New Tool",
      "form": {
        "name": "Tool Name",
        "name_placeholder": "e.g., Guided Flow",
        "description": "Description",
        "description_placeholder": "Brief description of this tool",
        "icon": "Icon",
        "icon_placeholder": "e.g., 🎬 or icon name",
        "target_url": "Destination URL",
        "target_url_placeholder": "/guided/step-0",
        "image": "Featured Image",
        "color": "Accent Color",
        "has_categories": "Has Categories (Level 2)",
        "has_subcategories": "Has SubCategories (Level 3)",
        "has_themes": "Has Themes (Level 4)",
        "category_param_name": "Category Param Name",
        "category_param_placeholder": "e.g., occasion",
        "subcategory_param_name": "SubCategory Param Name",
        "subcategory_param_placeholder": "e.g., style",
        "theme_param_name": "Theme Param Name",
        "theme_param_placeholder": "e.g., theme",
        "is_active": "Active"
      },
      "table": {
        "name": "Name",
        "icon": "Icon",
        "levels": "Levels",
        "status": "Status",
        "actions": "Actions"
      }
    },
    
    "categories": {
      "title": "Category Management",
      "subtitle": "Manage categories for each tool",
      "create_button": "Create New Category",
      "select_tool": "Select a tool",
      "form": {
        "parent_tool": "Parent Tool",
        "name": "Category Name",
        "name_placeholder": "e.g., Birthday",
        "description": "Description",
        "icon": "Icon",
        "image": "Image",
        "is_active": "Active"
      }
    },
    
    "subcategories": {
      "title": "SubCategory Management",
      "subtitle": "Manage styles and variants",
      "create_button": "Create New SubCategory",
      "select_category": "Select a category",
      "form": {
        "parent_category": "Parent Category",
        "name": "SubCategory Name",
        "name_placeholder": "e.g., Vintage",
        "description": "Description",
        "image": "Image (Required)",
        "is_active": "Active"
      }
    },
    
    "themes": {
      "title": "Theme Management",
      "subtitle": "Manage emotional themes (reusable across styles)",
      "create_button": "Create New Theme",
      "assign_to_subcategory": "Assign to SubCategory",
      "form": {
        "name": "Theme Name",
        "name_placeholder": "e.g., Joyful",
        "description": "Description",
        "color": "Theme Color",
        "image": "Image",
        "is_active": "Active"
      },
      "assignment": {
        "title": "Assign Themes to {subcategoryName}",
        "available_themes": "Available Themes",
        "assigned_themes": "Assigned Themes",
        "add": "Add",
        "remove": "Remove"
      }
    },
    
    "wall_builder": {
      "title": "Wall Builder",
      "subtitle": "Configure the display order and layout of walls",
      "select_level": "Select Level",
      "levels": {
        "meta_category": "Main Tool Wall",
        "category": "Category Wall",
        "subcategory": "SubCategory Wall",
        "theme": "Theme Wall"
      },
      "select_context": "Select {parentType}",
      "current_wall": "Current Wall",
      "available_items": "Available Items",
      "drag_hint": "Drag items to reorder",
      "add_item": "Add to Wall",
      "remove_item": "Remove from Wall",
      "pin_item": "Pin to Top",
      "unpin_item": "Unpin",
      "empty_wall": "No items on this wall yet",
      "preview": "Preview",
      "save_order": "Save Order"
    }
  }
}
```

### 13.3 Tool Names and Descriptions (Dynamic)

Tool names from the database should also be translated. Store translations in the database:

```typescript
// Alternative: Use translation keys in database
{
  name: "guided_flow",           // Translation key
  nameTranslationKey: "tools.guided_flow.name",
  descriptionTranslationKey: "tools.guided_flow.description"
}
```

```json
{
  "tools": {
    "guided_flow": {
      "name": "Guided Flow",
      "description": "Full 8-step video creation with AI assistance"
    },
    "image_generator": {
      "name": "Image Generator",
      "description": "Create stunning images from text prompts"
    },
    "image_editor": {
      "name": "Image Editor",
      "description": "Edit and refine images iteratively"
    },
    "music_generator": {
      "name": "Music Generator",
      "description": "Generate custom music tracks"
    },
    "quick_video": {
      "name": "Quick Video",
      "description": "Create videos quickly from 3 keyframes"
    }
  }
}
```

### 13.4 Occasions (Categories for Guided Flow)

```json
{
  "occasions": {
    "wedding": "Wedding",
    "wedding_desc": "Celebrate love and commitment",
    "birthday": "Birthday",
    "birthday_desc": "Mark another year of memories",
    "anniversary": "Anniversary",
    "anniversary_desc": "Commemorate special milestones",
    "baby_shower": "Baby Shower",
    "baby_shower_desc": "Welcome a new life",
    "graduation": "Graduation",
    "graduation_desc": "Celebrate achievements",
    "corporate": "Corporate",
    "corporate_desc": "Professional events and announcements",
    "holiday": "Holiday",
    "holiday_desc": "Seasonal celebrations",
    "engagement": "Engagement",
    "engagement_desc": "Share the exciting news"
  }
}
```

### 13.5 Visual Styles (SubCategories)

```json
{
  "visual_styles": {
    "cinematic": "Cinematic",
    "cinematic_desc": "Film-like quality with dramatic lighting",
    "vintage": "Vintage",
    "vintage_desc": "Classic retro aesthetic",
    "y2k": "Y2K",
    "y2k_desc": "Early 2000s digital nostalgia",
    "anime": "Anime",
    "anime_desc": "Japanese animation style",
    "pop": "Pop",
    "pop_desc": "Bright, vibrant colors",
    "dreamy": "Dreamy",
    "dreamy_desc": "Soft, ethereal atmosphere",
    "film_noir": "Film Noir",
    "film_noir_desc": "Classic black and white drama",
    "indie": "Indie",
    "indie_desc": "Independent film aesthetic",
    "storyboard": "Storyboard",
    "storyboard_desc": "Sketch-like animation frames",
    "low_key": "Low Key",
    "low_key_desc": "Dark, moody lighting",
    "grunge": "Grunge",
    "grunge_desc": "Raw, textured look",
    "hand_drawn": "Hand Drawn",
    "hand_drawn_desc": "Artistic sketch style",
    "2d_novel": "2D Novel",
    "2d_novel_desc": "Flat illustration style",
    "boost": "Boost",
    "boost_desc": "High energy, dynamic",
    "scribble": "Scribble",
    "scribble_desc": "Loose, sketchy lines",
    "3d_cartoon": "3D Cartoon",
    "3d_cartoon_desc": "Playful 3D animation",
    "colored": "Colored",
    "colored_desc": "Rich, saturated hues"
  }
}
```

### 13.6 Emotional Themes

```json
{
  "emotional_themes": {
    "joyful": "Joyful",
    "joyful_desc": "Bright, happy, celebratory",
    "nostalgic": "Nostalgic",
    "nostalgic_desc": "Warm, reminiscent, sentimental",
    "romantic": "Romantic",
    "romantic_desc": "Loving, tender, intimate",
    "energetic": "Energetic",
    "energetic_desc": "Dynamic, exciting, vibrant",
    "tender": "Tender",
    "tender_desc": "Gentle, caring, heartfelt",
    "motivational": "Motivational",
    "motivational_desc": "Inspiring, uplifting, encouraging"
  }
}
```

### 13.7 Translation Integration

After adding keys to `en.json`, run:

```bash
# Generate translations for all languages
pnpm translate

# Verify all translations are complete
pnpm i18n:verify
```

**Estimated new keys**: ~150-200 keys across all namespaces

---

## 14. Success Criteria

| Metric | Target |
|--------|--------|
| **Wall Navigation** | All 4 levels work correctly |
| **Flexible Depth** | Tools with 0-4 levels work correctly |
| **Admin Control** | 100% database-driven (0 hardcoding in wall) |
| **Pre-population** | Selections passed to mini-apps via query params |
| **Mobile UX** | Works on < 768px devices |
| **Performance** | < 500ms page load |
| **Backward Compatibility** | Existing Guided Flow works unchanged |
| **No Regressions** | All existing features work |

---

## 15. Testing Plan

### Unit Tests

```
convex/__tests__/tools/
├── getToolMetaCategories.test.ts
├── getToolCategories.test.ts
├── getToolSubCategories.test.ts
├── getToolThemes.test.ts
├── createToolMetaCategory.test.ts
└── updateToolMetaCategory.test.ts
```

### Component Tests

```
__tests__/components/tools/
├── ToolSelectionWall.test.tsx
├── ToolCard.test.tsx
├── SelectionModal.test.tsx
├── ToolWallBuilder.test.tsx
└── LevelConfiguration.test.tsx
```

### E2E Tests

```
tests/e2e/
├── tool-selection-flow.spec.ts     # Navigate all 4 levels
├── direct-tool-navigation.spec.ts  # Tool with 0 levels
├── param-pre-population.spec.ts    # Verify params reach mini-app
└── admin-dashboard.spec.ts         # CRUD operations
```

### Manual QA Checklist

- [ ] Test on iOS Safari (< 768px)
- [ ] Test on Android Chrome (< 768px)
- [ ] Test on tablet (768px - 1024px)
- [ ] Test on desktop (> 1024px)
- [ ] Verify back button closes modals
- [ ] Verify shareable URLs work
- [ ] Verify admin role protection
- [ ] Verify all translations

---

## 16. Implementation Hours Estimation

### Total: 11-15.5 hours (Revised)

> **Key Principle**: We're porting/adapting from Vertical AI, NOT building from scratch.
> This results in ~40% time savings compared to building from scratch (18-24h).

| Phase | Hours | Description |
|-------|-------|-------------|
| **Phase 1** | 2-3h | Convex schema + queries + seed data + role field |
| **Phase 2** | 2.5-3.5h | Tool Selection Wall + modals (copy/adapt from Vertical AI) |
| **Phase 3** | 3.5-5h | Admin dashboard CRUD + wall builder (copy/adapt) |
| **Phase 4** | 2-2.5h | Integration + Step 0/1 param reading + testing |
| **Phase 5** | 1-1.5h | i18n: Add translation keys + run translation script |

**Contingency**: +1-2h if unexpected refactoring needed

### Per-Developer Capacity

| Scenario | Time | Days |
|----------|------|------|
| **1 full-time dev** | 11-15.5h | **2-2.5 days** |
| **2 devs parallel** | 6-8h each | **1-1.5 days** |
| **1 dev part-time (5h/day)** | 11-15.5h | **2-3 days** |

### Effort by Component Type

**Fastest** (Copy-paste with minor edits):
- Convex schema from PRD template: 1h
- Admin forms (copy Vertical AI): 2-2.5h

**Medium** (Copy + substantial adaptation):
- Wall builder component: 1-1.5h
- Wall display component: 1h
- Color/styling updates: 0.5h

**Slower** (New logic):
- Query param navigation logic: 1h
- Theme junction UI (many-to-many): 0.5h
- 4th level (themes) addition: 0.5h
- Testing + polish: 1h

---

## 16.1 Implementation Checklist

### Phase 1: Convex Schema (2-3h)

#### Tables
- [ ] Create `convex/schema.ts` updates for tool tables
- [ ] `toolMetaCategories` table with indexes
- [ ] `toolCategories` table with indexes
- [ ] `toolSubCategories` table with indexes
- [ ] `toolThemes` table (standalone, reusable)
- [ ] `toolSubCategoryThemes` junction table with indexes
- [ ] `toolWallConfigs` table

#### Queries
- [ ] `getToolMetaCategories` - fetch active meta-categories
- [ ] `getToolCategories` - fetch categories by meta-category
- [ ] `getToolSubCategories` - fetch subcategories by category
- [ ] `getToolThemes` - fetch themes via junction table
- [ ] `getAllToolThemes` - fetch all themes (for admin)
- [ ] `getToolWallConfig` - fetch wall configuration

#### Mutations
- [ ] CRUD for `toolMetaCategories` (create, update, delete, reorder)
- [ ] CRUD for `toolCategories`
- [ ] CRUD for `toolSubCategories`
- [ ] CRUD for `toolThemes`
- [ ] Junction mutations: `assignThemeToSubCategory`, `removeThemeFromSubCategory`
- [ ] `updateToolWallConfig` - save wall ordering

#### Seed Data
- [ ] Create `convex/seedTools.ts` with initial data
- [ ] Seed meta-categories (Guided Flow, Image Generator, etc.)
- [ ] Seed categories (occasions)
- [ ] Seed subcategories (visual styles)
- [ ] Seed themes (emotional themes)
- [ ] Seed junction table (theme-subcategory assignments)

#### Role-Based Access
- [ ] Add `role` field to `users` table schema
- [ ] Create `isAdmin` query helper

### Phase 2: User-Facing Wall (2.5-3.5h)

#### Main Wall Component
- [ ] Copy `vertical-ai-alpha/components/commerce/hierarchy-wall.tsx`
- [ ] Create `components/tools/ToolSelectionWall.tsx`
- [ ] Adapt styling to MyShortReel design tokens
- [ ] Add 4th level support (themes)
- [ ] Connect to Convex queries

#### Tool Card Component
- [ ] Create `components/tools/ToolCard.tsx`
- [ ] Handle tools with 0 levels (direct navigation)
- [ ] Handle tools with 1-4 levels (open modal)
- [ ] Display name, description, icon/image

#### Modal System
- [ ] Create `components/tools/SelectionModal.tsx`
- [ ] Implement category selection modal
- [ ] Implement subcategory selection modal
- [ ] Implement theme selection modal
- [ ] Handle back navigation between modals
- [ ] Sync modal state with URL query params

#### Query Parameter Handling
- [ ] Create `hooks/useToolSelection.ts`
- [ ] Parse `?tool=X&category=Y&subcategory=Z&theme=W`
- [ ] Update URL on selections
- [ ] Handle deep linking (shareable URLs)

#### Navigation Page
- [ ] Create `app/[locale]/tools/page.tsx`
- [ ] Integrate ToolSelectionWall component
- [ ] Handle modal rendering via query params

### Phase 3: Admin Dashboard (3.5-5h)

#### Admin Layout
- [ ] Copy `vertical-ai-alpha/app/admin/layout.tsx`
- [ ] Create `app/[locale]/admin/layout.tsx`
- [ ] Add role check (redirect if not admin)
- [ ] Add navigation sidebar with tool sections

#### Meta-Categories Management
- [ ] Create `app/[locale]/admin/tools/meta-categories/page.tsx`
- [ ] List view with edit/delete actions
- [ ] Create form: name, description, slug, icon, destinationUrl
- [ ] Level configuration: hasCategories, hasSubCategories, hasThemes
- [ ] Query param names: categoryParamName, subCategoryParamName, themeParamName

#### Categories Management
- [ ] Create `app/[locale]/admin/tools/categories/page.tsx`
- [ ] List view filtered by meta-category
- [ ] Create form: name, description, slug, icon, parentId

#### SubCategories Management
- [ ] Create `app/[locale]/admin/tools/subcategories/page.tsx`
- [ ] List view filtered by category
- [ ] Create form: name, description, slug, imageUrl, parentId

#### Themes Management
- [ ] Create `app/[locale]/admin/tools/themes/page.tsx`
- [ ] List view of all reusable themes
- [ ] Create form: name, description, slug, color
- [ ] **Theme Assignment UI**: Assign themes to subcategories (junction table)

#### Wall Builder
- [ ] Copy `vertical-ai-alpha/components/admin/unified-wall-builder.tsx`
- [ ] Create `components/admin/ToolWallBuilder.tsx`
- [ ] Level selector: meta-categories, categories, subcategories, themes
- [ ] Drag-and-drop reordering with @dnd-kit
- [ ] Save order to `toolWallConfigs`

#### Admin Components
- [ ] Copy `sortable-item.tsx` from Vertical AI
- [ ] Copy `empty-state.tsx` from Vertical AI
- [ ] Create form components with shadcn/ui

### Phase 4: Integration & Polish (2-2.5h)

#### Step 0 Integration
- [ ] Update `app/[locale]/guided/step-0/page.tsx`
- [ ] Parse incoming query params: `?occasion=X&style=Y&theme=Z`
- [ ] Display selection summary: "You've selected: X • Y • Z"
- [ ] Show "Change" link to go back to wall

#### Step 1 Integration
- [ ] Update `app/[locale]/guided/step-1/page.tsx`
- [ ] Pre-select occasion from `?occasion=X` param
- [ ] Allow user to change selection

#### Mobile Testing
- [ ] Test on iOS Safari (< 768px)
- [ ] Test on Android Chrome (< 768px)
- [ ] Verify modal behavior on mobile
- [ ] Test touch interactions for drag-drop (admin)

#### Error Handling
- [ ] Handle invalid query params gracefully
- [ ] Handle network errors with retry
- [ ] Show loading states
- [ ] Empty state when no data

### Phase 5: Internationalization (1-1.5h)

#### Translation Keys
- [ ] Add `tool_selection` namespace to `messages/en.json`
- [ ] Add `admin.tools` namespace to `messages/en.json`
- [ ] Add `tools` content namespace (tool names/descriptions)
- [ ] Add `occasions` content namespace
- [ ] Add `visual_styles` content namespace
- [ ] Add `emotional_themes` content namespace

#### Translation Generation
- [ ] Run `pnpm translate` to generate all languages
- [ ] Run `pnpm i18n:verify` to check completeness
- [ ] Manual verification of key translations

#### Component Integration
- [ ] Use `useTranslations('tool_selection')` in wall components
- [ ] Use `useTranslations('admin')` in admin components
- [ ] Dynamic content translations via database pattern

---

### Completion Criteria

| Phase | Checkpoint |
|-------|------------|
| **Phase 1 Done** | All queries return data, seed script works |
| **Phase 2 Done** | Wall displays tools, modals work, params in URL |
| **Phase 3 Done** | Admin can CRUD all entities, wall builder saves order |
| **Phase 4 Done** | Guided Flow receives params, displays summary |
| **Phase 5 Done** | All UI text translatable, `pnpm i18n:verify` passes |

---

## 17. Future Enhancements

### Potential Extensions

1. **A/B Testing**: Test different wall layouts
2. **Analytics**: Track which tools/categories are most popular
3. **Personalization**: Show recommended tools based on history
4. **Search**: Search across all tools and categories
5. **Favorites**: Save favorite tool configurations
6. **Recent**: Show recently used tool configurations
7. **Quick Actions**: Direct links for common configurations

### Mini-Apps to Add

Per `mini-apps-feasibility-analysis.md`:
- Image Generator
- Image Editor
- Quick Video
- Music Generator
- Referral System

---

## 18. Dependencies & Constraints

### External Dependencies

- ✅ Convex (already in use)
- ✅ Next.js App Router
- ✅ Tailwind CSS
- ✅ shadcn/ui components
- ✅ Framer Motion (from Vertical AI)
- ✅ @dnd-kit (from Vertical AI - for drag-drop)

### Constraints

- **DO NOT modify Guided Flow** - only read params
- **Mobile-first** requirement
- **i18n support** required for all new strings
- **Role-based admin access** via users table

### Assumptions

- Max 20 tools, 50 categories, 100 subcategories, 200 themes (Convex handles easily)
- Tool data changes infrequently (caching OK)
- Single admin role sufficient for MVP

---

## 19. Appendix

### 18.1 Component Sketches

#### Main Tool Selection Wall

```
┌─────────────────────────────────────────┐
│  MyShortReel Tools                      │
├─────────────────────────────────────────┤
│                                         │
│  Tool Grid:                             │
│  ┌───────────────┐ ┌───────────────┐   │
│  │ 🎬 Guided     │ │ 🖼️ Image      │   │
│  │    Flow       │ │   Generator   │   │
│  │ Full video    │ │ Text-to-image │   │
│  │ [Explore →]   │ │ [Start →]     │   │
│  └───────────────┘ └───────────────┘   │
│  ┌───────────────┐ ┌───────────────┐   │
│  │ 🎵 Music      │ │ ⚡ Quick      │   │
│  │   Generator   │ │   Video       │   │
│  │ Custom music  │ │ Fast creation │   │
│  │ [Explore →]   │ │ [Explore →]   │   │
│  └───────────────┘ └───────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

#### Category Modal (Occasions)

```
┌────────────────────────────────────────────┐
│ ← Back                                     │
│                                            │
│         Select an Occasion                 │
│                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 💍       │ │ 🎂       │ │ 📅       │   │
│  │ Wedding  │ │ Birthday │ │ Annivers.│   │
│  └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 👶       │ │ 🎓       │ │ 💼       │   │
│  │ Baby     │ │ Graduatn │ │ Corporate│   │
│  │ Shower   │ │          │ │          │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│                                            │
└────────────────────────────────────────────┘
```

#### SubCategory Modal (Styles)

```
┌────────────────────────────────────────────┐
│ ← Back to Occasions                        │
│                                            │
│         Choose a Style                     │
│                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ [image]  │ │ [image]  │ │ [image]  │   │
│  │ Vintage  │ │ Y2K      │ │ Anime    │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ [image]  │ │ [image]  │ │ [image]  │   │
│  │ Cinematic│ │ Pop      │ │ Dreamy   │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│                                            │
└────────────────────────────────────────────┘
```

#### Theme Modal (Emotional Themes)

```
┌────────────────────────────────────────────┐
│ ← Back to Styles                           │
│                                            │
│       Select Emotional Theme               │
│                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ ❤️ Joyful │ │ 🤎 Nost. │ │ 💗 Roman.│   │
│  │ [color]  │ │ [color]  │ │ [color]  │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 🧡 Energy│ │ 💚 Tender│ │ 💙 Motiv.│   │
│  │ [color]  │ │ [color]  │ │ [color]  │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│                                            │
└────────────────────────────────────────────┘
```

### 18.2 Reference: Guided Flow Step 0 (Current)

Current Step 0 shows "The Guided Director" info page. After this feature:
- User arrives via `/guided/step-0?occasion=birthday&style=vintage&theme=joyful`
- Step 0 displays: "You've selected: Birthday • Vintage • Joyful"
- User clicks "Begin Your Film" to proceed
- Step 1 has occasion + theme pre-selected

### 18.3 Reference: Vertical AI Files to Copy

```
vertical-ai-alpha/
├── components/
│   ├── commerce/
│   │   └── hierarchy-wall.tsx      # Main wall component
│   └── admin/
│       ├── unified-wall-builder.tsx
│       ├── sortable-item.tsx
│       ├── unified-item-picker.tsx
│       └── empty-state.tsx
├── lib/
│   ├── meta-categories-mock-data.ts  # Data structure reference
│   └── unified-wall-config-store.ts  # Store pattern reference
└── app/
    └── admin/
        └── layout.tsx               # Admin layout pattern
```

---

**End of PRD v2.2**

*Last Updated: January 21, 2026*
*For questions or feedback, reach out to the Product Team.*
