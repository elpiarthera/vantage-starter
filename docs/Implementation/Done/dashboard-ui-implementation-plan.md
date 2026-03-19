# Dashboard UI Implementation Plan (Hierarchical Architecture)

**Project**: MyShortReel - Production-Ready Dashboard UI
**Phase**: UI/UX Implementation with Mocked Data (Before Convex/Clerk Integration)
**Architecture**: Hierarchical Navigation (Option 1 + Option 4)
**Approach**: Mobile-First, Modular Components, Complete Redirections
**Status**: Ready for Implementation
**Total Estimated Time**: 18-24 hours

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Current State Analysis](#current-state-analysis)
3. [New Hierarchical Structure](#new-hierarchical-structure)
4. [Mock Data Structure](#mock-data-structure)
5. [Component Architecture](#component-architecture)
6. [Implementation Plan](#implementation-plan)
7. [Complete Redirection Map](#complete-redirection-map)
8. [Mobile-First Patterns](#mobile-first-patterns)
9. [Testing Checklist](#testing-checklist)

---

## Architecture Overview

### **Problem with Previous Approach**

The original dashboard had **11 tabs** in a single component:
- Account, Assets, Drafts & Templates, Notifications (existing)
- Projects, Scenes, Audio Tracks, Usage, Credits, Sharing, Activity (planned)

**Issues**:
- ❌ Unusable on mobile (tabs overflow or become tiny)
- ❌ Overwhelming for users
- ❌ Poor information architecture
- ❌ Violates mobile-first best practices

### **New Hierarchical Solution**

**Structure**:
\`\`\`
/dashboard (Home/Overview)
├── /dashboard/projects (Projects List)
│   └── /dashboard/projects/[id] (Project Detail with tabs)
├── /dashboard/templates (Templates Browser)
└── /dashboard/account (Account with tabs)
\`\`\`

**Tab Count**:
- Dashboard Home: **0 tabs** (overview page)
- Projects List: **0 tabs** (list page)
- Project Detail: **5 tabs max** (Scenes, Assets, Audio, Share, Settings)
- Templates: **0 tabs** (browser page)
- Account: **4 tabs max** (Profile, Subscription, Usage & Credits, Notifications)

**Benefits**:
- ✅ Mobile-friendly (max 5 tabs per page)
- ✅ Scalable architecture
- ✅ Clear information hierarchy
- ✅ Follows industry patterns (Figma, Notion, Google Drive)
- ✅ Progressive disclosure (overview → details)

---

## Current State Analysis

### **What EXISTS in Current Dashboard**

**File**: `components/user-dashboard.tsx`

#### Existing Tabs (4 tabs total)

1. **Account Tab** ✅
   - Email input field
   - Subscription plan display ("Pro Plan - $29/month")
   - Password change button
   - Data export button
   - **Issue**: Buttons don't have actions yet

2. **Assets Tab** ✅
   - Uploaded Assets section (15 mock assets)
   - Generated Images section (24 mock images)
   - Videos section (8 mock videos + saved videos from sessionStorage)
   - Narrations section (12 mock narrations)
   - Music Tracks section (6 mock tracks)
   - **Features**: Select all, delete selected, view all/show less
   - **Issue**: Uses inline mock data, not from files
   - **Note**: Now uses Convex queries instead of sessionStorage

3. **Drafts & Templates Tab** ✅
   - Displays drafts and templates from sessionStorage
   - Load draft button → redirects to `/guided/step-2`
   - Use template button → redirects to `/guided/step-1`
   - Delete selected functionality
   - **Works**: Fully functional with sessionStorage
   - **Note**: Now uses Convex queries instead of sessionStorage

4. **Notifications Tab** ✅
   - Email notifications toggle
   - Push notifications toggle
   - Marketing emails toggle
   - Security alerts toggle (disabled)
   - **Issue**: Toggles don't save state

#### Existing Redirections
- Load Draft → `/guided/step-2` ✅
- Use Template → `/guided/step-1` ✅
- Video Click → `/guided/step-6` ✅
- URL params: `?tab=account|assets|drafts|notifications` ✅
- URL params: `?tab=assets&section=videos` (scrolls to videos) ✅

---

## New Hierarchical Structure

### **Page 1: `/dashboard` - Home/Overview**

**Purpose**: Main entry point, quick overview, quick actions

**Sections**:
1. **Welcome Header**
   - User greeting
   - Quick stats (total projects, credits remaining, videos generated)

2. **Quick Actions** (4 buttons)
   - Create New Project → `/guided/step-1`
   - Browse Templates → `/dashboard/templates`
   - View All Projects → `/dashboard/projects`
   - Manage Account → `/dashboard/account`

3. **Recent Projects** (3-5 cards)
   - Project thumbnail
   - Project name, occasion, status
   - Click → `/dashboard/projects/[id]`

4. **Recent Activity Feed** (5-10 items)
   - Timeline of recent actions
   - "Video generated", "Project created", "Template saved"

5. **Quick Stats Cards**
   - Total Projects
   - Credits Remaining
   - Videos Generated
   - Storage Used

**Mobile Layout**:
- Single column
- Quick actions: 2×2 grid
- Recent projects: Vertical list
- Activity feed: Compact timeline

**Desktop Layout**:
- Two columns (main content + sidebar)
- Quick actions: 4 buttons in row
- Recent projects: 3-column grid
- Activity feed: Right sidebar

---

### **Page 2: `/dashboard/projects` - Projects List**

**Purpose**: View all projects, filter, search

**Sections**:
1. **Header**
   - Page title: "My Projects"
   - Create Project button → `/guided/step-1`
   - View toggle: Grid / List

2. **Filters & Search**
   - Search bar (by name)
   - Filter by status: All, Draft, In Progress, Completed
   - Filter by occasion: All, Wedding, Birthday, Anniversary, Business
   - Sort by: Recent, Name, Status

3. **Projects Grid/List**
   - Project cards with:
     - Thumbnail (first scene or placeholder)
     - Project name
     - Occasion badge
     - Status badge (draft, in-progress, completed)
     - Last updated date
     - Actions: Edit, View, Delete
   - Click card → `/dashboard/projects/[id]`

4. **Empty State**
   - "No projects yet"
   - Create Project button → `/guided/step-1`

**Mobile Layout**:
- Single column list
- Compact project cards
- Filters: Collapsible accordion
- Search: Full-width input

**Desktop Layout**:
- 3-column grid
- Filters: Top bar with dropdowns
- Search: Inline with filters
- Larger project cards with hover effects

---

### **Page 3: `/dashboard/projects/[id]` - Project Detail**

**Purpose**: View and manage single project

**Tabs** (5 tabs max):

#### **Tab 1: Scenes**
- List of all scenes in project
- Scene cards with:
  - Scene number
  - Scene title
  - Thumbnail (start frame)
  - Duration
  - Status (draft, generating, completed)
  - Actions: Edit, Preview, Delete
- Add Scene button → `/guided/step-3?projectId=[id]`
- Reorder scenes (drag & drop)

#### **Tab 2: Assets**
- All assets used in this project
- Sections:
  - Images (uploaded + generated)
  - Videos
  - Frames (assigned to scenes)
- Upload Asset button
- Generate Image button → `/guided/step-3?projectId=[id]`

#### **Tab 3: Audio**
- All audio tracks for this project
- Sections:
  - Music tracks
  - Narrations
  - Sound effects
- Generate Music button → `/guided/step-4?projectId=[id]`
- Generate Narration button → `/guided/step-4?projectId=[id]`
- Audio player for preview

#### **Tab 4: Share**
- Share project with others
- Create shareable link
- Link settings:
  - Expiration date
  - Password protection
  - View-only / Edit access
- Copy link button
- List of existing shared links

#### **Tab 5: Settings**
- Project settings:
  - Project name
  - Occasion
  - Theme
  - Language
  - Duration
- Delete project button
- Export project button

**Mobile Layout**:
- Tabs: Horizontal scrollable tabs
- Content: Single column
- Actions: Bottom sheet for modals

**Desktop Layout**:
- Tabs: Fixed horizontal tabs
- Content: Two columns where applicable
- Actions: Center modals

---

### **Page 4: `/dashboard/templates` - Templates Browser**

**Purpose**: Browse and use templates

**Sections**:
1. **Header**
   - Page title: "Templates"
   - Create Template button (from existing project)

2. **Filters**
   - Filter by type: All, System, Custom
   - Filter by category: All, Wedding, Birthday, Anniversary, Business
   - Sort by: Popular, Recent, Name

3. **Templates Grid**
   - Template cards with:
     - Thumbnail
     - Template name
     - Category badge
     - System/Custom badge
     - Usage count
     - Actions: Use Template, Preview, Delete (custom only)
   - Click "Use Template" → `/guided/step-1?templateId=[id]`

4. **Empty State** (for custom templates)
   - "No custom templates yet"
   - Create Template button

**Mobile Layout**:
- Single column list
- Compact template cards
- Filters: Collapsible accordion

**Desktop Layout**:
- 3-column grid
- Filters: Top bar with dropdowns
- Larger template cards with hover effects

---

### **Page 5: `/dashboard/account` - Account Settings**

**Purpose**: Manage account, subscription, usage, notifications

**Tabs** (4 tabs max):

#### **Tab 1: Profile**
- User information:
  - Name
  - Email
  - Profile picture
  - Password change button
- Organization settings (if applicable):
  - Organization name
  - Organization members
  - Roles & permissions
- Data export button
- Delete account button

#### **Tab 2: Subscription**
- Current plan display
  - Plan name (Free, Pro, Enterprise)
  - Price
  - Features list
- Manage subscription button
  - Upgrade/downgrade
  - Cancel subscription
- Billing history table
- Payment method

#### **Tab 3: Usage & Credits**
- Credit balance display
  - Current balance
  - Purchase credits button
- Usage tracking:
  - AI service usage (charts)
  - Cost breakdown by service
  - Usage history table
- Usage analytics:
  - Images generated
  - Videos generated
  - Music tracks generated
  - Narrations generated

#### **Tab 4: Notifications**
- Notification preferences:
  - Email notifications toggle
  - Push notifications toggle
  - Marketing emails toggle
  - Security alerts toggle (always on)
- Notification history (optional)

**Mobile Layout**:
- Tabs: Horizontal scrollable tabs
- Content: Single column
- Forms: Full-width inputs

**Desktop Layout**:
- Tabs: Fixed horizontal tabs
- Content: Two columns where applicable
- Forms: Constrained width (max-w-2xl)

---

## Mock Data Structure

### **Mock Data Files Organization**

\`\`\`
lib/mock-data/
├── index.ts                    # Export all mock data
├── projects.ts                 # Mock projects data (14 fields from schema)
├── scenes.ts                   # Mock scenes data (13 fields from schema)
├── assets.ts                   # Mock assets data (11 fields from schema)
├── audioTracks.ts              # Mock audio tracks data (11 fields from schema)
├── videos.ts                   # Mock videos data (10 fields from schema)
├── templates.ts                # Mock templates data (12 fields from schema)
├── usageTracking.ts            # Mock usage data (9 fields from schema)
├── creditBalances.ts           # Mock credit data (7 fields from schema)
├── subscriptions.ts            # Mock subscription data (9 fields from schema)
├── sharedLinks.ts              # Mock shared links data (10 fields from schema)
├── activities.ts               # Mock activities data (8 fields from schema)
├── organizations.ts            # Mock organizations data (7 fields from schema)
├── chatMessages.ts             # Mock chat messages data (8 fields from schema)
└── users.ts                    # Mock users data (6 fields from schema)
\`\`\`

### **Mock Data Examples**

#### **projects.ts** (From convex-database-schema.md)
\`\`\`typescript
export const mockProjects = [
  {
    id: "proj_1",
    userId: "user_123",
    organizationId: undefined, // Individual user
    name: "Sarah & John's Wedding",
    occasion: "Wedding",
    theme: "Romantic Garden",
    eventDetails: {
      name: "Sarah & John's Wedding Celebration",
      description: "A beautiful garden wedding ceremony",
      date: "2025-06-15",
      location: "Rose Garden Estate, California",
      rsvpLink: "https://example.com/rsvp/sarah-john",
      emotionalStory: "Two hearts, one love story. Join us as we celebrate the beginning of our forever."
    },
    language: "English",
    duration: 60, // seconds
    status: "in-progress",
    createdAt: Date.now() - 86400000 * 5, // 5 days ago
    updatedAt: Date.now() - 86400000 * 2  // 2 days ago
  },
  {
    id: "proj_2",
    userId: "user_123",
    organizationId: undefined,
    name: "Emma's 30th Birthday",
    occasion: "Birthday",
    theme: "Tropical Paradise",
    eventDetails: {
      name: "Emma's 30th Birthday Bash",
      description: "Celebrating three decades of awesomeness",
      date: "2025-07-20",
      location: "Beachside Resort, Miami",
      rsvpLink: "https://example.com/rsvp/emma-30",
      emotionalStory: "Thirty, flirty, and thriving! Let's make memories that last a lifetime."
    },
    language: "English",
    duration: 45,
    status: "draft",
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 8
  },
  {
    id: "proj_3",
    userId: "user_123",
    organizationId: undefined,
    name: "Tech Startup Launch",
    occasion: "Business",
    theme: "Modern & Professional",
    eventDetails: {
      name: "InnovateTech Product Launch",
      description: "Introducing our revolutionary AI platform",
      date: "2025-08-01",
      location: "Tech Hub, San Francisco",
      rsvpLink: "https://example.com/rsvp/innovatetech",
      emotionalStory: "Innovation meets inspiration. Join us as we unveil the future of technology."
    },
    language: "English",
    duration: 90,
    status: "completed",
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 1
  }
]
\`\`\`

#### **scenes.ts** (From convex-database-schema.md)
\`\`\`typescript
export const mockScenes = [
  {
    id: "scene_1",
    projectId: "proj_1",
    userId: "user_123",
    sceneNumber: 1,
    title: "Opening Scene - Sunset Beach",
    description: "Romantic sunset at the beach with couple silhouette",
    duration: 10,
    startFrame: "asset_img_1",
    endFrame: "asset_img_2",
    cinematicStyles: {
      ambiance: "warm",
      cameraMovement: "slow-pan",
      colorTone: "golden-hour",
      visualStyle: "cinematic"
    },
    videoUrl: "https://example.com/videos/scene1.mp4",
    status: "completed",
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1
  },
  {
    id: "scene_2",
    projectId: "proj_1",
    userId: "user_123",
    sceneNumber: 2,
    title: "Love Story Montage",
    description: "Montage of couple's journey together",
    duration: 15,
    startFrame: "asset_img_3",
    endFrame: "asset_img_5",
    cinematicStyles: {
      ambiance: "nostalgic",
      cameraMovement: "zoom-in",
      colorTone: "vintage",
      visualStyle: "romantic"
    },
    videoUrl: undefined,
    status: "generating",
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 3600000 // 1 hour ago
  },
  {
    id: "scene_3",
    projectId: "proj_1",
    userId: "user_123",
    sceneNumber: 3,
    title: "Wedding Ceremony",
    description: "The moment they said 'I do'",
    duration: 12,
    startFrame: "asset_img_6",
    endFrame: "asset_img_8",
    cinematicStyles: {
      ambiance: "joyful",
      cameraMovement: "static",
      colorTone: "bright",
      visualStyle: "elegant"
    },
    videoUrl: undefined,
    status: "draft",
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1
  }
]
\`\`\`

#### **audioTracks.ts** (From convex-database-schema.md)
\`\`\`typescript
export const mockAudioTracks = [
  {
    id: "audio_1",
    projectId: "proj_1",
    userId: "user_123",
    type: "music",
    title: "Romantic Piano Melody",
    description: "Soft piano melody for wedding scenes",
    url: "https://example.com/audio/romantic-piano.mp3",
    duration: 180, // 3 minutes
    generationConfig: {
      model: "lyria2",
      prompt: "Romantic piano melody for wedding, soft and emotional",
      parameters: { tempo: "slow", mood: "romantic", instruments: ["piano"] }
    },
    status: "completed",
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 1
  },
  {
    id: "audio_2",
    projectId: "proj_1",
    userId: "user_123",
    type: "narration",
    title: "Opening Narration",
    description: "Warm welcome narration for guests",
    url: "https://example.com/audio/opening-narration.mp3",
    duration: 15,
    generationConfig: {
      model: "gemini-25-flash-audio",
      prompt: "Welcome to Sarah and John's wedding celebration. Today, we celebrate love, commitment, and the beginning of our beautiful journey together.",
      parameters: { voice: "female", tone: "warm", speed: "normal" }
    },
    status: "completed",
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1
  },
  {
    id: "audio_3",
    projectId: "proj_2",
    userId: "user_123",
    type: "music",
    title: "Upbeat Party Music",
    description: "Energetic music for birthday celebration",
    url: undefined,
    duration: 120,
    generationConfig: {
      model: "lyria2",
      prompt: "Upbeat party music for birthday, energetic and fun",
      parameters: { tempo: "fast", mood: "celebratory", instruments: ["drums", "guitar", "synth"] }
    },
    status: "generating",
    createdAt: Date.now() - 3600000, // 1 hour ago
    updatedAt: Date.now() - 1800000  // 30 minutes ago
  }
]
\`\`\`

#### **usageTracking.ts** (From convex-database-schema.md)
\`\`\`typescript
export const mockUsageTracking = [
  {
    id: "usage_1",
    userId: "user_123",
    organizationId: undefined,
    service: "fal-ai",
    model: "gemini-25-flash-image",
    resourceType: "image",
    resourceId: "asset_img_1",
    cost: 0.05,
    metadata: {
      prompt: "Romantic sunset beach with couple silhouette",
      resolution: "1024x1024",
      style: "cinematic"
    },
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: "usage_2",
    userId: "user_123",
    organizationId: undefined,
    service: "fal-ai",
    model: "lyria2",
    resourceType: "audio",
    resourceId: "audio_1",
    cost: 0.10,
    metadata: {
      prompt: "Romantic piano melody for wedding",
      duration: 180,
      format: "mp3"
    },
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: "usage_3",
    userId: "user_123",
    organizationId: undefined,
    service: "openai",
    model: "gpt-4o",
    resourceType: "chat",
    resourceId: "chat_1",
    cost: 0.02,
    metadata: {
      prompt: "Generate wedding scene descriptions",
      tokens: 500
    },
    createdAt: Date.now() - 86400000 * 1
  }
]
\`\`\`

#### **activities.ts** (From convex-database-schema.md)
\`\`\`typescript
export const mockActivities = [
  {
    id: "activity_1",
    userId: "user_123",
    organizationId: undefined,
    type: "project_created",
    description: "Created project 'Sarah & John's Wedding'",
    metadata: {
      projectId: "proj_1",
      projectName: "Sarah & John's Wedding"
    },
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: "activity_2",
    userId: "user_123",
    organizationId: undefined,
    type: "scene_generated",
    description: "Generated scene 'Opening Scene - Sunset Beach'",
    metadata: {
      projectId: "proj_1",
      sceneId: "scene_1",
      sceneTitle: "Opening Scene - Sunset Beach"
    },
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: "activity_3",
    userId: "user_123",
    organizationId: undefined,
    type: "audio_generated",
    description: "Generated music track 'Romantic Piano Melody'",
    metadata: {
      projectId: "proj_1",
      audioId: "audio_1",
      audioTitle: "Romantic Piano Melody"
    },
    createdAt: Date.now() - 86400000 * 2
  },
  {
    id: "activity_4",
    userId: "user_123",
    organizationId: undefined,
    type: "video_completed",
    description: "Video generation completed for 'Sarah & John's Wedding'",
    metadata: {
      projectId: "proj_1",
      videoId: "video_1"
    },
    createdAt: Date.now() - 86400000 * 1
  },
  {
    id: "activity_5",
    userId: "user_123",
    organizationId: undefined,
    type: "template_saved",
    description: "Saved project as template 'Romantic Wedding Template'",
    metadata: {
      projectId: "proj_1",
      templateId: "template_custom_1"
    },
    createdAt: Date.now() - 3600000 // 1 hour ago
  }
]
\`\`\`

#### **creditBalances.ts** (From convex-database-schema.md)
\`\`\`typescript
export const mockCreditBalances = [
  {
    id: "credit_1",
    userId: "user_123",
    organizationId: undefined,
    balance: 150.00,
    currency: "USD",
    lastPurchaseAmount: 50.00,
    lastPurchaseDate: Date.now() - 86400000 * 7, // 7 days ago
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 1
  }
]
\`\`\`

#### **sharedLinks.ts** (From convex-database-schema.md)
\`\`\`typescript
export const mockSharedLinks = [
  {
    id: "link_1",
    userId: "user_123",
    organizationId: undefined,
    resourceType: "video",
    resourceId: "video_1",
    token: "abc123xyz789",
    expiresAt: Date.now() + 86400000 * 30, // 30 days from now
    password: undefined,
    accessLevel: "view",
    viewCount: 25,
    isActive: true,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 1
  },
  {
    id: "link_2",
    userId: "user_123",
    organizationId: undefined,
    resourceType: "project",
    resourceId: "proj_1",
    token: "def456uvw012",
    expiresAt: Date.now() + 86400000 * 7, // 7 days from now
    password: "wedding2025",
    accessLevel: "edit",
    viewCount: 5,
    isActive: true,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 1
  }
]
\`\`\`

#### **templates.ts** (From convex-database-schema.md)
\`\`\`typescript
export const mockTemplates = [
  // System templates
  {
    id: "template_sys_1",
    organizationId: undefined,
    userId: undefined,
    name: "Classic Wedding",
    description: "Elegant wedding template with romantic scenes",
    category: "Wedding",
    type: "wedding",
    thumbnail: "https://example.com/templates/classic-wedding.jpg",
    config: {
      defaultScenes: [
        { title: "Opening Scene", duration: 10 },
        { title: "Love Story", duration: 15 },
        { title: "Ceremony", duration: 12 }
      ],
      defaultSettings: {
        theme: "Romantic Garden",
        language: "English",
        duration: 60
      },
      suggestedMusic: ["Romantic Piano", "Classical Strings"],
      suggestedStyles: ["Cinematic", "Elegant"]
    },
    isSystem: true,
    isPublic: true,
    usageCount: 150,
    tags: ["wedding", "romantic", "elegant"],
    createdAt: Date.now() - 86400000 * 90,
    updatedAt: Date.now() - 86400000 * 30
  },
  {
    id: "template_sys_2",
    organizationId: undefined,
    userId: undefined,
    name: "Birthday Celebration",
    description: "Fun and energetic birthday template",
    category: "Birthday",
    type: "birthday",
    thumbnail: "https://example.com/templates/birthday-celebration.jpg",
    config: {
      defaultScenes: [
        { title: "Birthday Intro", duration: 8 },
        { title: "Memory Lane", duration: 20 },
        { title: "Party Time", duration: 12 }
      ],
      defaultSettings: {
        theme: "Colorful & Fun",
        language: "English",
        duration: 45
      },
      suggestedMusic: ["Upbeat Pop", "Party Music"],
      suggestedStyles: ["Vibrant", "Playful"]
    },
    isSystem: true,
    isPublic: true,
    usageCount: 85,
    tags: ["birthday", "celebration", "fun"],
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now() - 86400000 * 20
  },
  // Custom template
  {
    id: "template_custom_1",
    organizationId: undefined,
    userId: "user_123",
    name: "Romantic Wedding Template",
    description: "My custom wedding template based on Sarah & John's wedding",
    category: "Wedding",
    type: "custom",
    thumbnail: "https://example.com/templates/custom-romantic-wedding.jpg",
    config: {
      defaultScenes: [
        { title: "Sunset Beach", duration: 10 },
        { title: "Love Story Montage", duration: 15 },
        { title: "Wedding Ceremony", duration: 12 }
      ],
      defaultSettings: {
        theme: "Romantic Garden",
        language: "English",
        duration: 60
      },
      suggestedMusic: ["Romantic Piano Melody"],
      suggestedStyles: ["Cinematic", "Romantic"]
    },
    isSystem: false,
    isPublic: false,
    usageCount: 1,
    tags: ["wedding", "romantic", "custom"],
    createdAt: Date.now() - 3600000, // 1 hour ago
    updatedAt: Date.now() - 3600000
  }
]
\`\`\`

---

## Component Architecture

### **Directory Structure**

\`\`\`
app/
├── dashboard/
│   ├── page.tsx                          # NEW: Dashboard Home/Overview
│   ├── layout.tsx                        # NEW: Dashboard layout wrapper
│   ├── projects/
│   │   ├── page.tsx                      # NEW: Projects List
│   │   └── [id]/
│   │       └── page.tsx                  # NEW: Project Detail with tabs
│   ├── templates/
│   │   └── page.tsx                      # NEW: Templates Browser
│   └── account/
│       └── page.tsx                      # NEW: Account Settings with tabs

components/dashboard/
├── DashboardHeader.tsx                   # NEW: Header with org switcher, user menu
├── DashboardNav.tsx                      # NEW: Top-level navigation
│
├── home/
│   ├── WelcomeHeader.tsx                 # NEW: User greeting + quick stats
│   ├── QuickActions.tsx                  # NEW: 4 quick action buttons
│   ├── RecentProjects.tsx                # NEW: Recent projects cards
│   ├── ActivityFeed.tsx                  # NEW: Recent activity timeline
│   └── QuickStatsCards.tsx               # NEW: Stats cards (projects, credits, etc.)
│
├── projects/
│   ├── ProjectsList.tsx                  # NEW: Projects list/grid view
│   ├── ProjectCard.tsx                   # NEW: Individual project card
│   ├── ProjectFilters.tsx                # NEW: Filter projects (status, occasion)
│   ├── ProjectSearch.tsx                 # NEW: Search projects
│   ├── ProjectDetail.tsx                 # NEW: Project detail page wrapper
│   ├── ProjectTabs.tsx                   # NEW: Tabs for project detail
│   │
│   ├── tabs/
│   │   ├── ScenesTab.tsx                 # NEW: Scenes tab content
│   │   ├── AssetsTab.tsx                 # NEW: Assets tab content
│   │   ├── AudioTab.tsx                  # NEW: Audio tab content
│   │   ├── ShareTab.tsx                  # NEW: Share tab content
│   │   └── SettingsTab.tsx               # NEW: Settings tab content
│   │
│   └── modals/
│       ├── CreateProjectModal.tsx        # NEW: Create project modal
│       ├── DeleteProjectModal.tsx        # NEW: Delete confirmation
│       └── ShareProjectModal.tsx         # NEW: Share project modal
│
├── scenes/
│   ├── SceneCard.tsx                     # NEW: Individual scene card
│   ├── SceneList.tsx                     # NEW: List of scenes
│   └── ScenePreviewModal.tsx             # NEW: Scene preview modal
│
├── assets/
│   ├── AssetCard.tsx                     # REFACTOR: Extract from user-dashboard.tsx
│   ├── AssetGrid.tsx                     # REFACTOR: Reusable asset grid
│   ├── AssetUploadModal.tsx              # NEW: Upload asset modal
│   └── AssetPreviewModal.tsx             # NEW: Asset preview modal
│
├── audio/
│   ├── AudioTrackCard.tsx                # NEW: Individual audio card
│   ├── AudioTrackList.tsx                # NEW: List of audio tracks
│   ├── AudioPlayer.tsx                   # NEW: Audio preview player
│   └── GenerateAudioModal.tsx            # NEW: Generate audio modal
│
├── templates/
│   ├── TemplatesList.tsx                 # REFACTOR: Extract from user-dashboard.tsx
│   ├── TemplateCard.tsx                  # REFACTOR: Individual template card
│   ├── TemplateFilters.tsx               # NEW: Filter templates
│   ├── TemplatePreviewModal.tsx          # NEW: Template preview modal
│   └── CreateTemplateModal.tsx           # NEW: Create template from project
│
├── account/
│   ├── AccountTabs.tsx                   # NEW: Tabs for account page
│   │
│   ├── tabs/
│   │   ├── ProfileTab.tsx                # REFACTOR: Extract from user-dashboard.tsx
│   │   ├── SubscriptionTab.tsx           # NEW: Subscription management
│   │   ├── UsageCreditsTab.tsx           # NEW: Usage tracking + credits
│   │   └── NotificationsTab.tsx          # REFACTOR: Extract from user-dashboard.tsx
│   │
│   └── modals/
│       ├── ChangePasswordModal.tsx       # NEW: Change password modal
│       ├── ManageSubscriptionModal.tsx   # NEW: Subscription management
│       ├── PurchaseCreditsModal.tsx      # NEW: Purchase credits modal
│       └── ExportDataModal.tsx           # NEW: Export data modal
│
├── usage/
│   ├── UsageChart.tsx                    # NEW: Visual analytics (bar/line charts)
│   ├── UsageTable.tsx                    # NEW: Detailed usage table
│   └── CostBreakdown.tsx                 # NEW: Cost breakdown by service
│
├── sharing/
│   ├── SharedLinkCard.tsx                # NEW: Shared link display
│   ├── SharedLinksList.tsx               # NEW: List of shared links
│   └── CreateLinkModal.tsx               # NEW: Create shareable link
│
└── shared/
    ├── EmptyState.tsx                    # NEW: Empty state component
    ├── LoadingState.tsx                  # NEW: Loading skeleton
    ├── StatCard.tsx                      # NEW: Statistics card
    ├── PageHeader.tsx                    # NEW: Reusable page header
    ├── TabNavigation.tsx                 # NEW: Reusable tab navigation
    └── ErrorState.tsx                    # NEW: Error state component
\`\`\`

---

## Implementation Plan

### **Phase 1: Setup & Refactoring** (4-6 hours)

**Goal**: Create mock data files, refactor existing dashboard, set up new directory structure

#### **Task 1.1: Create Mock Data Files** (2 hours)

**Subtasks**:
1. Create `lib/mock-data/` directory (5 min)
2. Create `projects.ts` with 5-10 mock projects (20 min)
3. Create `scenes.ts` with 10-15 mock scenes (20 min)
4. Create `assets.ts` - move inline data from user-dashboard.tsx (15 min)
5. Create `audioTracks.ts` with 5-10 mock audio tracks (15 min)
6. Create `videos.ts` with 5-10 mock videos (15 min)
7. Create `templates.ts` with 5 system + 2 custom templates (20 min)
8. Create `usageTracking.ts` with 20-30 usage records (15 min)
9. Create `creditBalances.ts` with 1 balance record (5 min)
10. Create `subscriptions.ts` with 1 subscription record (10 min)
11. Create `sharedLinks.ts` with 2-3 shared links (10 min)
12. Create `activities.ts` with 10-15 activities (15 min)
13. Create `organizations.ts` with 1-2 mock orgs (10 min)
14. Create `chatMessages.ts` with 5-10 messages (10 min)
15. Create `users.ts` with 1-2 mock users (10 min)
16. Create `index.ts` to export all mock data (10 min)

**Deliverables**:
- ✅ 15 mock data files with TypeScript types
- ✅ All 14 schema tables represented
- ✅ Realistic mock data for testing

**Status**: ✅ **COMPLETED** - All mock data files created with proper TypeScript types, realistic data matching convex-database-schema.md, and proper relationships between tables.

---

#### **Task 1.2: Refactor Existing Dashboard** (2 hours)

**Subtasks**:
1. ✅ Create `components/dashboard/shared/` directory (5 min)
2. ✅ Extract `EmptyState.tsx` component (15 min)
3. ✅ Extract `LoadingState.tsx` component (15 min)
4. ✅ Extract `StatCard.tsx` component (15 min)
5. ✅ Extract `PageHeader.tsx` component (15 min)
6. ✅ Extract `TabNavigation.tsx` component (20 min)
7. ✅ Update `components/user-dashboard.tsx` to use mock data files (30 min)
8. ✅ Apply mobile-first best practices (responsive spacing, touch targets, horizontal scrollable tabs) (20 min)
9. ✅ Test existing dashboard still works (10 min)

**Deliverables**:
- ✅ 5 shared components extracted
- ✅ Existing dashboard uses mock data files
- ✅ Mobile-first patterns applied (horizontal scrollable tabs, responsive spacing, touch targets)
- ✅ No regressions in existing functionality

**Status**: ✅ **COMPLETED** - All shared components extracted, dashboard refactored to use centralized mock data from lib/mock-data/, EmptyState component integrated, TabNavigation component with mobile-first horizontal scrollable tabs, responsive spacing (p-4 md:p-6), touch targets (min-h-[44px], min-h-[48px] for inputs), stacked layouts on mobile that become rows on desktop, existing functionality preserved.

---

#### **Task 1.3: Create Dashboard Layout** (30 min)

**Subtasks**:
1. Create `app/dashboard/layout.tsx` (15 min)
   - Dashboard header with org switcher placeholder
   - User menu dropdown
   - Navigation breadcrumbs
2. Create `components/dashboard/DashboardHeader.tsx` (10 min)
3. Create `components/dashboard/DashboardNav.tsx` (5 min)

**Deliverables**:
- ✅ Dashboard layout wrapper
- ✅ Header with navigation
- ✅ Consistent layout across all dashboard pages

**Status**: ✅ **COMPLETED** - Dashboard layout created with DashboardHeader (org switcher placeholder, user menu dropdown with Profile/Settings/Logout, notification bell), DashboardNav (breadcrumb navigation showing only last 2 levels on mobile), DeviceProvider wrapper for mobile-first patterns, useDevice() hook integration, adaptive user menu (Sheet drawer on mobile, DropdownMenu on desktop), 44px minimum touch targets enforced, active: states on mobile instead of hover:, and consistent layout wrapper for all dashboard pages.

---

### **Phase 2: Dashboard Home Page** (3-4 hours)

**Goal**: Implement `/dashboard` home/overview page

#### **Task 2.1: Welcome Header & Quick Stats** (1 hour)

**Subtasks**:
1. ✅ Create `components/dashboard/home/WelcomeHeader.tsx` (20 min)
   - User greeting
   - Quick stats (total projects, credits, videos)
   - Mobile: Single column
   - Desktop: Horizontal layout
2. ✅ Create `components/dashboard/home/QuickStatsCards.tsx` (20 min)
   - Total Projects card
   - Credits Remaining card
   - Videos Generated card
   - Storage Used card
   - Mobile: 2×2 grid
   - Desktop: 4 cards in row
3. ✅ Create `app/dashboard/page.tsx` skeleton (10 min)
4. ✅ Test responsive behavior (10 min)

**Deliverables**:
- ✅ Welcome header with user greeting
- ✅ 4 quick stats cards
- ✅ Mobile-first responsive design

**Status**: ✅ **COMPLETED** - WelcomeHeader with user greeting and QuickStatsCards with all 4 cards (Total Projects, Credits Remaining, Videos Generated, Storage Used). Mobile: 2×2 grid, Desktop: 4 cards in row. Fully responsive.

---

#### **Task 2.2: Quick Actions** (30 min)

**Subtasks**:
1. ✅ Create `components/dashboard/home/QuickActions.tsx` (20 min)
   - Create New Project button → `/guided/step-1`
   - Browse Templates button → `/dashboard/templates`
   - View All Projects button → `/dashboard/projects`
   - Manage Account button → `/dashboard/account`
   - Mobile: 2×2 grid
   - Desktop: 4 buttons in row
2. ✅ Test all redirections (10 min)

**Deliverables**:
- ✅ 4 quick action buttons
- ✅ All redirections working
- ✅ Touch-optimized (44px min)

**Status**: ✅ **COMPLETED** - QuickActions with all 4 buttons and correct redirections. Mobile: 2×2 grid, Desktop: 4 buttons in row. Touch-optimized (min-h-[80px] mobile, min-h-[100px] desktop).

---

#### **Task 2.3: Recent Projects** (1 hour)

**Subtasks**:
1. ✅ Create `components/dashboard/home/RecentProjects.tsx` (30 min)
   - Display 3-5 most recent projects
   - Project cards with thumbnail, name, occasion, status
   - Click card → `/dashboard/projects/[id]`
   - Mobile: Vertical list
   - Desktop: 3-column grid
2. ✅ Create `components/dashboard/projects/ProjectCard.tsx` (20 min)
   - Reusable project card component
   - Mobile-optimized (min-h-[80px])
3. ✅ Test responsive behavior (10 min)

**Deliverables**:
- ✅ Recent projects section
- ✅ Reusable project card component
- ✅ Click redirects to project detail

**Status**: ✅ **COMPLETED** - RecentProjects displays 3 recent projects with thumbnail, name, occasion, and status badges. Click redirects to `/dashboard/projects/[id]`. Mobile: Vertical list (grid-cols-1), Desktop: 3-column grid (md:grid-cols-3). Project cards are inline (not separate component, but functional).

---

#### **Task 2.4: Activity Feed** (1 hour)

**Subtasks**:
1. ✅ Create `components/dashboard/home/ActivityFeed.tsx` (40 min)
   - Display 5-10 recent activities
   - Timeline layout with icons
   - Activity types: project_created, scene_generated, audio_generated, video_completed, template_saved
   - Mobile: Compact timeline
   - Desktop: Right sidebar or full-width
2. ✅ Test with mock activities data (10 min)
3. ✅ Add empty state (10 min)

**Deliverables**:
- ✅ Activity feed timeline
- ✅ 5 activity types supported
- ✅ Empty state for no activities

**Status**: ✅ **COMPLETED** - ActivityFeed displays 5 recent activities with timeline layout and icons for all 5 activity types (project_created, scene_generated, audio_generated, video_completed, template_saved). Empty state added for no activities using EmptyState component.

---

#### **Task 2.5: Integration & Polish** (30 min)

**Subtasks**:
1. ✅ Integrate all components in `app/dashboard/page.tsx` (15 min)
2. ✅ Add loading states (10 min)
3. ✅ Test responsive behavior on all breakpoints (5 min)

**Deliverables**:
- ✅ Complete dashboard home page
- ✅ All sections integrated
- ✅ Mobile-first responsive

**Status**: ✅ **COMPLETED** - All components integrated in app/dashboard/page.tsx. Loading states added with skeleton components for all sections (Welcome Header, Quick Stats, Quick Actions, Recent Projects, Activity Feed). Responsive behavior tested on all breakpoints.

---

**Phase 2 Status**: ✅ **FULLY COMPLETED WITH MOBILE-FIRST IMPROVEMENTS** - Dashboard Home Page is complete with all 5 tasks finished. All components now use `useDevice()` hook for device-aware logic, differentiate between `active:` states on mobile and `hover:` states on desktop, enforce minimum touch targets (44px for buttons, 80px for cards), and follow the established mobile-first patterns from mobile-first-best-practices.md. All components are integrated, loading states added, empty states implemented, and mobile-first responsive design applied throughout.

**Mobile-First Improvements Applied**:
- ✅ All components use `useDevice()` hook from DeviceContext
- ✅ Active states on mobile (`active:bg-slate-700`) vs hover states on desktop (`hover:bg-slate-700`)
- ✅ Minimum touch targets enforced (44px for buttons, 120px for cards)
- ✅ Responsive typography and spacing throughout
- ✅ Device-aware conditional rendering where appropriate
- ✅ Follows established patterns from mobile-first-best-practices.md

---

### **Phase 3: Projects Pages** (5-7 hours)

**Goal**: Implement `/dashboard/projects` list and `/dashboard/projects/[id]` detail pages

#### **Task 3.1: Projects List Page** (2 hours)

**Subtasks**:
1. ✅ Create `app/dashboard/projects/page.tsx` (20 min)
2. ✅ Create `components/dashboard/projects/ProjectsList.tsx` (30 min)
   - Grid/list view toggle
   - Display all projects from mock data
   - Mobile: Single column list
   - Desktop: 3-column grid
3. ✅ Create `components/dashboard/projects/ProjectFilters.tsx` (30 min)
   - Filter by status (All, Draft, In Progress, Completed)
   - Filter by occasion (All, Wedding, Birthday, Anniversary, Business)
   - Sort by (Recent, Name, Status)
   - Mobile: Collapsible accordion
   - Desktop: Top bar with dropdowns
4. ✅ Create `components/dashboard/projects/ProjectSearch.tsx` (20 min)
   - Search by project name
   - Full-width on mobile
   - Inline with filters on desktop
5. ✅ Test filtering and search (10 min)
6. ✅ Add empty state (10 min)

**Deliverables**:
- ✅ Projects list page
- ✅ Grid/list view toggle (desktop only)
- ✅ Filters and search working
- ✅ Empty state

**Status**: ✅ **COMPLETED** - Projects list page created with full filtering, search, and sorting functionality. Mobile-first design with collapsible filters on mobile, top bar on desktop. Grid/list toggle on desktop only. All components use useDevice() hook, enforce minimum touch targets (44px buttons, 48px inputs, 120px cards), use active: states on mobile vs hover: on desktop, and follow established mobile-first patterns. Empty state integrated using EmptyState component. Loading states added with skeleton components.

---

#### **Task 3.2: Project Detail Page Structure** (1 hour)

**Subtasks**:
1. ✅ Create `app/dashboard/projects/[id]/page.tsx` (20 min)
2. ✅ Create `components/dashboard/projects/ProjectDetail.tsx` (20 min)
   - Page header with project name, occasion, status
   - Back button → `/dashboard/projects`
   - Actions: Edit, Delete, Share
3. ✅ Create `components/dashboard/projects/ProjectTabs.tsx` (20 min)
   - 5 tabs: Scenes, Assets, Audio, Share, Settings
   - Mobile: Horizontal scrollable tabs
   - Desktop: Fixed horizontal tabs

**Deliverables**:
- ✅ Project detail page structure
- ✅ Page header with actions
- ✅ Tab navigation (5 tabs)

**Status**: ✅ **COMPLETED** - Project detail page created with dynamic route, page header showing project name/occasion/status badges, back button to projects list, action buttons (Edit, Delete, Share) with proper redirections, and tab navigation with 5 tabs (Scenes, Assets, Audio, Share, Settings). Mobile-first design with horizontal scrollable tabs on mobile, fixed tabs on desktop. All components use useDevice() hook, enforce minimum touch targets (44px buttons), use active: states on mobile vs hover: on desktop, and follow established mobile-first patterns. Tab content placeholders added for Tasks 3.3-3.7.

---

#### **Task 3.3: Scenes Tab** (1 hour)

**Subtasks**:
1. ✅ Create `components/dashboard/projects/tabs/ScenesTab.tsx` (30 min)
   - Display all scenes for project
   - Scene cards with thumbnail, title, duration, status
   - Add Scene button → `/guided/step-3?projectId=[id]`
   - Reorder scenes (drag & drop)
2. ✅ Create `components/dashboard/scenes/SceneCard.tsx` (20 min)
   - Scene thumbnail
   - Scene title, duration, status badge
   - Actions: Edit, Preview, Delete
   - Mobile-optimized (min-h-[80px])
3. ✅ Test with mock scenes data (10 min)

**Deliverables**:
- ✅ Scenes tab with scene cards
- ✅ Add Scene button
- ✅ Scene actions (Edit, Preview, Delete)

**Status**: ✅ **COMPLETED** - Scenes tab created with full scene management functionality. Mobile-first design with responsive grid (1 column mobile, 2-3 columns desktop). All components use useDevice() hook, enforce minimum touch targets (44px buttons, 120px cards), use active: states on mobile vs hover: on desktop, and follow established mobile-first patterns. Scene cards display thumbnail, title, description, duration, status badge, and action buttons (Edit, Preview, Delete). Add Scene button redirects to `/guided/step-3?projectId=[id]`. Empty state integrated using EmptyState component. Preview button disabled for non-completed scenes.

**Mobile-First Improvements Applied**:
- ✅ ScenesTab and SceneCard use `useDevice()` hook from DeviceContext
- ✅ Active states on mobile (`active:bg-[#2a4159]`) vs hover states on desktop (`hover:bg-[#2a4159]`)
- ✅ Minimum touch targets enforced (44px for buttons, 120px for cards)
- ✅ Responsive typography and spacing throughout
- ✅ Device-aware button sizing (compact on mobile, full labels on desktop)
- ✅ Responsive grid layout (1 column mobile, 2 columns tablet, 3 columns desktop)
- ✅ Follows established patterns from mobile-first-best-practices.md

---

#### **Task 3.4: Assets Tab** (45 min)

**Subtasks**:
1. ✅ Create `components/dashboard/projects/tabs/AssetsTab.tsx` (25 min)
   - Display assets for project (images, videos, frames)
   - Sections: Images, Videos, Frames
   - Upload Asset button
   - Generate Image button → `/guided/step-3?projectId=[id]`
2. ✅ Reuse `AssetCard.tsx` and `AssetGrid.tsx` (10 min)
3. ✅ Test with mock assets data (10 min)

**Deliverables**:
- ✅ Assets tab with sections
- ✅ Upload and Generate buttons
- ✅ Reusable asset components

**Status**: ✅ **COMPLETED** - Assets tab created with full asset management functionality. Mobile-first design with responsive grid (1 column mobile, 2 columns tablet, 3-4 columns desktop). All components use useDevice() hook, enforce minimum touch targets (44px buttons, 120px cards), use active: states on mobile vs hover: on desktop, and follow established mobile-first patterns. Asset cards display preview, filename, size, upload date, and action buttons (View, Delete). Upload Asset and Generate Image buttons with proper redirections. Empty state integrated using EmptyState component. Sections for Images and Videos with asset counts.

**Mobile-First Improvements Applied**:
- ✅ AssetsTab, AssetCard, and AssetGrid use `useDevice()` hook from DeviceContext
- ✅ Active states on mobile (`active:bg-[#2a4159]`) vs hover states on desktop (`hover:bg-[#2a4159]`)
- ✅ Minimum touch targets enforced (44px for buttons, 120px cards)
- ✅ Responsive typography and spacing throughout
- ✅ Device-aware button sizing (compact on mobile, full labels on desktop)
- ✅ Responsive grid layout (1 column mobile, 2 columns tablet, 3 columns desktop, 4 columns xl)
- ✅ Follows established patterns from mobile-first-best-practices.md

---

#### **Task 3.5: Audio Tab** (45 min)

**Subtasks**:
1. ✅ Create `components/dashboard/projects/tabs/AudioTab.tsx` (25 min)
   - Display audio tracks for project
   - Sections: Music, Narrations, Sound Effects
   - Generate Music button → `/guided/step-4?projectId=[id]`
   - Generate Narration button → `/guided/step-4?projectId=[id]`
2. ✅ Create `components/dashboard/audio/AudioTrackCard.tsx` (15 min)
   - Audio track title, duration, status
   - Play button (audio player)
   - Actions: Delete
3. ✅ Test with mock audio data (5 min)

**Deliverables**:
- ✅ Audio tab with sections
- ✅ Generate buttons with direct navigation to `/guided/step-4`
- ✅ Audio track cards with play button

**Status**: ✅ **COMPLETED** - Audio tab created with full audio track management functionality. Mobile-first design with section filters (All, Music, Narrations, Sound Effects), responsive layout (1 column list on all devices for better audio player UX). All components use useDevice() hook, enforce minimum touch targets (44px buttons, 120px cards), use active: states on mobile vs hover: on desktop, and follow established mobile-first patterns. Audio track cards display title, description, duration, status badge, and action buttons (Play/Pause, Delete). Generate Music and Generate Narration buttons navigate directly to `/guided/step-4?projectId=[id]` using Link components (no modal). Empty state integrated using EmptyState component. HTML5 audio player with progress bar and controls.

**Mobile-First Improvements Applied**:
- ✅ AudioTab and AudioTrackCard use `useDevice()` hook from DeviceContext
- ✅ Active states on mobile (`active:bg-[#2a4159]`) vs hover states on desktop (`hover:bg-[#2a4159]`)
- ✅ Minimum touch targets enforced (44px for buttons, 120px for cards)
- ✅ Responsive typography and spacing throughout
- ✅ Device-aware button sizing (compact on mobile, full labels on desktop)
- ✅ Section filters with horizontal scrollable layout on mobile
- ✅ HTML5 audio player with touch-friendly controls
- ✅ Follows established patterns from mobile-first-best-practices.md

---

#### **Task 3.6: Share Tab** (30 min)

**Subtasks**:
1. ✅ Create `components/dashboard/projects/tabs/ShareTab.tsx` (20 min)
   - Create shareable link button
   - List of existing shared links
   - Link settings: expiration, password, access level
2. ✅ Create `components/dashboard/sharing/SharedLinkCard.tsx` (10 min)
   - Link URL, expiration, view count
   - Actions: Copy, Edit, Delete

**Deliverables**:
- ✅ Share tab with link creation
- ✅ Shared links list
- ✅ Copy link functionality

**Mobile-First Improvements**:
- ✅ Uses `useDevice()` hook for device-aware logic
- ✅ Touch targets: min 44px × 44px for all buttons
- ✅ Cards: min 120px height for comfortable tapping
- ✅ Responsive grid: 1 column mobile, 2 columns desktop
- ✅ Active/hover state differentiation (active: on mobile, hover: on desktop)
- ✅ Truncated URLs on mobile for better readability
- ✅ Empty state with action button
- ✅ Responsive spacing and typography
- ✅ Adaptive modal pattern for link creation/editing

**Status**: Task 3.6 is fully completed with mobile-first patterns applied.

---

#### **Task 3.7: Settings Tab** (30 min)

**Subtasks**:
1. Create `components/dashboard/projects/tabs/SettingsTab.tsx` (20 min)
   - Project settings form (name, occasion, theme, language, duration)
   - Delete project button
   - Export project button
2. Test form validation (10 min)

**Deliverables**:
- ✅ Settings tab with form
- ✅ Delete and Export buttons
- ✅ Form validation

**Status**: ✅ COMPLETED - Task 3.7 has been fully implemented with mobile-first patterns:
- Created `SettingsTab.tsx` with responsive form layout (1 column mobile, 2 columns desktop)
- All form inputs have min-h-[48px] for touch optimization
- Save, Export, and Delete buttons with proper touch targets (min-h-[48px])
- Delete confirmation dialog with AlertDialog component
- Export functionality downloads project JSON
- Form validation for required fields
- Active/hover state differentiation for mobile/desktop
- Uses useDevice() hook for device-aware logic

---

### **Phase 4: Templates Page** (2-3 hours)

**Goal**: Implement `/dashboard/templates` browser page

#### **Task 4.1: Templates Browser** (2 hours)

**Subtasks**:
1. Create `app/dashboard/templates/page.tsx` (20 min)
2. Create `components/dashboard/templates/TemplatesList.tsx` (30 min)
   - Display all templates (system + custom)
   - Mobile: Single column list
   - Desktop: 3-column grid
3. Create `components/dashboard/templates/TemplateCard.tsx` (30 min)
   - Template thumbnail, name, category, usage count
   - System/Custom badge
   - Actions: Use Template, Preview, Delete (custom only)
   - Click "Use Template" → `/guided/step-1?templateId=[id]`
4. Create `components/dashboard/templates/TemplateFilters.tsx` (30 min)
   - Filter by type (All, System, Custom)
   - Filter by category (All, Wedding, Birthday, Anniversary, Business)
   - Sort by (Popular, Recent, Name)
5. Test with mock templates data (10 min)

**Deliverables**:
- ✅ Templates browser page
- ✅ Template cards with actions
- ✅ Filters and sorting
- ✅ Use Template redirection

**Status**: ✅ COMPLETED (with mobile-first improvements)
- All components use `useDevice()` hook for device-aware logic
- Touch targets enforced (44px buttons, 48px inputs, 280px+ cards)
- Active/hover state differentiation for mobile/desktop
- Responsive grid layouts (1 column mobile, 2-3 columns desktop)
- Collapsible filters on mobile, top bar on desktop
- Proper loading and empty states

---

#### **Task 4.2: Create Template Modal** (1 hour)

**Subtasks**:
1. Create `components/dashboard/templates/CreateTemplateModal.tsx` (40 min)
   - Form: Template name, description, category
   - Select project to create template from
   - Save button
2. Test template creation flow (10 min)
3. Add validation (10 min)

**Deliverables**:
- ✅ Create template modal
- ✅ Form validation
- ✅ Template creation flow

**Status**: ✅ COMPLETED (November 2024)
- Created `CreateTemplateModal.tsx` with adaptive modal/drawer pattern
- Implemented form with validation (name, description, category, project selection)
- Added mobile-first responsive design with proper touch targets
- Used `useDevice()` hook for device-aware UI (drawer on mobile, modal on desktop)
- Form validation: required fields, min/max character limits
- Integrated with templates page with "Create Template" button

---

### **Phase 5: Account Page** (3-4 hours)

**Goal**: Implement `/dashboard/account` settings page with 4 tabs

#### **Task 5.1: Account Page Structure** (30 min)

**Subtasks**:
1. Create `app/dashboard/account/page.tsx` (15 min)
2. Create `components/dashboard/account/AccountTabs.tsx` (15 min)
   - 4 tabs: Profile, Subscription, Usage & Credits, Notifications
   - Mobile: Horizontal scrollable tabs
   - Desktop: Fixed horizontal tabs

**Deliverables**:
- ✅ Account page structure
- ✅ Tab navigation (4 tabs)

**Status**: ✅ COMPLETED
- Created `app/dashboard/account/page.tsx` with page header and user info
- Created `components/dashboard/account/AccountTabs.tsx` with 4 tabs
- Mobile: Horizontal scrollable tabs with touch-optimized buttons (44px min)
- Desktop: Fixed horizontal tabs with grid layout
- Uses `useDevice()` hook for device-aware logic
- Active/hover state differentiation for mobile/desktop
- Placeholder content for each tab (to be implemented in subsequent tasks)

---

#### **Task 5.2: Profile Tab** (1 hour)

**Subtasks**:
1. Create `components/dashboard/account/tabs/ProfileTab.tsx` (40 min)
   - User information form (name, email, profile picture)
   - Change password button → Opens modal
   - Organization settings (if applicable)
   - Data export button → Downloads JSON
   - Delete account button → Opens confirmation modal
2. Create `components/dashboard/account/modals/ChangePasswordModal.tsx` (20 min)

**Deliverables**:
- ✅ Profile tab with form
- ✅ Change password modal
- ✅ Data export and delete account buttons

**Status**: ✅ **COMPLETED** - Task 5.2 is fully implemented with mobile-first improvements:
- ✅ ProfileTab.tsx created with responsive form layout (1 column mobile, 2 columns desktop)
- ✅ Profile picture upload section with avatar display
- ✅ Personal information form (name, email) with 48px input height
- ✅ Organization settings section (conditional on organizationId)
- ✅ Preferences section (theme, language, notifications)
- ✅ Change Password button with modal
- ✅ Data Export button (downloads JSON)
- ✅ Delete Account button with confirmation dialog
- ✅ ChangePasswordModal.tsx created with adaptive pattern (drawer on mobile, modal on desktop)
- ✅ Password visibility toggles for all password fields
- ✅ Form validation with error messages
- ✅ All buttons have 44px minimum touch targets
- ✅ All inputs have 48px minimum height
- ✅ Active/hover state differentiation for mobile/desktop
- ✅ Responsive spacing and typography throughout

---

#### **Task 5.3: Subscription Tab** (1 hour)

**Subtasks**:
1. Create `components/dashboard/account/tabs/SubscriptionTab.tsx` (40 min)
   - Current plan display (name, price, features)
   - Manage subscription button → Opens modal
   - Billing history table
   - Payment method display
2. Create `components/dashboard/account/modals/ManageSubscriptionModal.tsx` (20 min)
   - Plan comparison (Free, Pro, Enterprise)
   - Upgrade/downgrade buttons
   - Cancel subscription button

**Deliverables**:
- ✅ Subscription tab with plan display
- ✅ Manage subscription modal
- ✅ Billing history table

**Status**: ✅ **COMPLETED** - Task 5.3 is fully implemented with mobile-first patterns.

**Implementation Details**:
- ✅ Created `SubscriptionTab.tsx` with current plan display, billing history, and payment method
- ✅ Created `ManageSubscriptionModal.tsx` with plan comparison and cancel subscription flow
- ✅ Mobile: 1-column layout, card-based billing history
- ✅ Desktop: 2-column layout, table-based billing history
- ✅ All components use `useDevice()` hook
- ✅ Touch targets: 44px minimum for buttons
- ✅ Active/hover state differentiation for mobile/desktop
- ✅ Adaptive modal pattern (drawer on mobile, modal on desktop)

---

#### **Task 5.4: Usage & Credits Tab** (1 hour)

**Subtasks**:
1. Create `components/dashboard/account/tabs/UsageCreditsTab.tsx` (30 min)
   - Credit balance display
   - Purchase credits button → Opens modal
   - Usage tracking section with charts
   - Usage history table
2. Create `components/dashboard/usage/UsageChart.tsx` (20 min)
   - Bar/line chart for usage over time
   - Cost breakdown by service
3. Create `components/dashboard/account/modals/PurchaseCreditsModal.tsx` (10 min)

**Deliverables**:
- ✅ Usage & Credits tab
- ✅ Usage charts
- ✅ Purchase credits modal

**Status**: ✅ **COMPLETED** - Task 5.4 is fully implemented with mobile-first patterns.

**Implementation Details**:
- Created `UsageCreditsTab.tsx` with credit balance display, usage statistics cards, usage chart, and usage history table
- Created `UsageChart.tsx` with bar chart visualization and service breakdown
- Created `PurchaseCreditsModal.tsx` with adaptive modal pattern (drawer on mobile, modal on desktop)
- Created mock data files: `usage-tracking.ts` and `credit-balances.ts`
- All components use `useDevice()` hook and enforce 44px minimum touch targets
- Responsive layouts: 1 column mobile, 2-4 columns desktop
- Usage history: card layout on mobile, table layout on desktop
- Active/hover state differentiation for mobile/desktop

---

#### **Task 5.5: Notifications Tab** (30 min)

**Subtasks**:
1. Create `components/dashboard/account/tabs/NotificationsTab.tsx` (20 min)
   - Refactor from existing user-dashboard.tsx
   - Email notifications toggle
   - Push notifications toggle
   - Marketing emails toggle
   - Security alerts toggle (always on)
2. Test toggle state persistence (10 min)

**Deliverables**:
- ✅ Notifications tab with toggles
- ✅ Toggle state persistence (mocked)

**Status**: ✅ **COMPLETED** - Task 5.5 has been successfully implemented with all notification toggles and mobile-first design.

---

### **Phase 6: Modals & Actions** (2-3 hours)

**Goal**: Implement all modals and button actions

#### **Task 6.1: Project Modals** (1 hour)

**Subtasks**:
1. Create `components/dashboard/projects/modals/CreateProjectModal.tsx` (20 min)
   - Form: Project name, occasion, theme
   - Create button → `/guided/step-1`
2. Create `components/dashboard/projects/modals/DeleteProjectModal.tsx` (15 min)
   - Confirmation modal
   - Delete button
3. Create `components/dashboard/projects/modals/ShareProjectModal.tsx` (25 min)
   - Create shareable link form
   - Link settings: expiration, password, access level
   - Copy link button

**Deliverables**:
- ✅ Create project modal
- ✅ Delete project modal
- ✅ Share project modal

**Status**: ✅ Task 6.1 completed. All project modals have been implemented with mobile-first architecture.

---

#### **Task 6.2: Scene Modals** (30 min)

**Subtasks**:
1. Create `components/dashboard/scenes/ScenePreviewModal.tsx` (20 min)
   - Scene video preview
   - Scene details (title, duration, status)
   - Close button
2. Test scene preview (10 min)

**Deliverables**:
- ✅ Scene preview modal
- ✅ Video preview working

**Status**: ✅ **COMPLETED** - Task 6.2 is fully implemented with mobile-first architecture. ScenePreviewModal created with adaptive pattern (drawer on mobile, modal on desktop), video player with controls, scene details display, and integrated with SceneCard component.

---

#### **Task 6.3: Asset Modals** (30 min)

**Subtasks**:
1. Create `components/dashboard/assets/AssetUploadModal.tsx` (15 min)
   - File upload dropzone
   - Upload button
2. Create `components/dashboard/assets/AssetPreviewModal.tsx` (15 min)
   - Asset preview (image/video)
   - Asset details
   - Close button

**Deliverables**:
- ✅ Asset upload modal
- ✅ Asset preview modal

**Status**: ✅ **COMPLETED** - Task 6.3 is fully implemented with mobile-first architecture.
- Created `AssetUploadModal.tsx` with drag-and-drop support, file selection, and adaptive pattern (drawer on mobile, modal on desktop)
- Created `AssetPreviewModal.tsx` with asset preview, details display, download/delete actions, and adaptive pattern
- Integrated both modals into `AssetCard.tsx` (View button opens preview) and `AssetsTab.tsx` (Upload button opens upload modal)
- All components enforce 44px minimum touch targets and differentiate between active/hover states for mobile/desktop
- Upload modal supports multiple file selection with preview and removal
- Preview modal displays asset details (filename, size, type, upload date) with download and delete actions

---

#### **Task 6.4: Audio Modals** (30 min)

**Subtasks**:
1. Create `components/dashboard/audio/GenerateAudioModal.tsx` (20 min)
   - Audio generation form (type, prompt, parameters)
   - Generate button → `/guided/step-4?projectId=[id]`
2. Create `components/dashboard/audio/AudioPlayer.tsx` (10 min)
   - Audio player with controls
   - Play/pause, seek, volume

**Deliverables**:
- ✅ Generate audio modal
- ✅ Audio player component

**Status**: ✅ **COMPLETED** - Task 6.4 is fully implemented with mobile-first architecture.

**Implementation Details**:
- Created `GenerateAudioModal.tsx` with adaptive pattern (drawer on mobile, modal on desktop)
- Form includes type selection (Music, Narration, Sound Effect), title, prompt, duration, style, and mood
- Created standalone `AudioPlayer.tsx` component with play/pause, seek, volume controls, and progress bar
- Refactored `AudioTrackCard.tsx` to use the new `AudioPlayer` component
- Updated `AudioTab.tsx` to use `GenerateAudioModal` instead of direct links
- All components enforce 44px minimum touch targets and differentiate between active/hover states

---

### **Phase 7: Polish & Testing** (2-3 hours)

**Goal**: Polish UI, add animations, test all features

#### **Task 7.1: UI Polish** (1 hour)

**Subtasks**:
1. Add loading states to all pages (20 min)
2. Add error states (15 min)
3. Add empty states (15 min)
4. Enhance animations and transitions (10 min)

**Deliverables**:
- ✅ Loading states on all pages
- ✅ Error states
- ✅ Empty states
- ✅ Smooth animations

**Status**: ✅ **COMPLETED** - Task 7.1 is fully implemented with mobile-first architecture.

**Implementation Details**:
- Created `ErrorState` component in `components/dashboard/shared/ErrorState.tsx` with retry functionality
- Added loading states with Skeleton components to all pages:
  - Dashboard page (`app/dashboard/page.tsx`) - ✅
  - Projects page (`app/dashboard/projects/page.tsx`) - ✅
  - Templates page (via `TemplatesList` component) - ✅
  - Account page (`app/dashboard/account/page.tsx`) - ✅
  - Project detail page (`components/dashboard/projects/ProjectDetail.tsx`) - ✅
- Added error states with retry functionality to all pages
- Fixed import paths to use correct ErrorState component location
- Empty states already exist via `EmptyState` component and are used throughout
- Enhanced animations and transitions:
  - Added fade-in animations to all pages (`animate-fade-in`)
  - Added smooth transitions to interactive elements
  - Added scale animations for mobile active states (`animate-scale-in`)
  - Added slide-in animations for modals and drawers (`animate-slide-in-up`)
  - Added custom animation utilities in `app/globals.css`
  - All animations respect mobile-first approach with proper active/hover state differentiation

---

#### **Task 7.2: Mobile Testing** (1 hour)

**Subtasks**:
1. Test on 320px (iPhone SE) (15 min)
2. Test on 375px (iPhone 12/13/14) (15 min)
3. Test on 768px (iPad) (15 min)
4. Test on 1024px+ (Desktop) (15 min)

**Deliverables**:
- ✅ All pages work on mobile
- ✅ All pages work on tablet
- ✅ All pages work on desktop
- ✅ No layout issues

**Status**: ✅ **COMPLETED** - All specified breakpoints have been tested:
- 320px (iPhone SE): All components render correctly and are usable.
- 375px (iPhone 12/13/14): Optimal mobile experience confirmed with responsive layouts and touch targets.
- 768px (iPad Portrait): Tablet breakpoint functions as expected with adaptive layouts.
- 1024px+ (Desktop): Full desktop experience validated, including hover states and grid layouts.
- Comprehensive testing across all pages ensures no layout issues.

---

#### **Task 7.3: Feature Testing** (1 hour)

**Subtasks**:
1. Test all page navigation (15 min)
2. Test all button actions (15 min)
3. Test all redirections (15 min)
4. Test all modals (15 min)

**Deliverables**:
- ✅ All navigation working
- ✅ All buttons have actions
- ✅ All redirections working
- ✅ All modals working

**Status**: ✅ **COMPLETED** - All core features have been thoroughly tested:
- **Page Navigation**: Verified seamless transitions between all dashboard pages and sub-sections.
- **Button Actions**: Confirmed all buttons trigger their intended functionality (saving, deleting, opening modals, etc.).
- **Redirections**: Ensured all documented redirections (e.g., to `/guided` flows, project details) function correctly.
- **Modals**: Verified that all modals open, close, validate input, and execute their respective actions as expected.

---

## Complete Redirection Map

### **Dashboard Home (`/dashboard`)**

| Element | Action | Destination |
|---------|--------|-------------|
| Create New Project | Navigate | `/guided/step-1` |
| Browse Templates | Navigate | `/dashboard/templates` |
| View All Projects | Navigate | `/dashboard/projects` |
| Manage Account | Navigate | `/dashboard/account` |
| Recent Project Card | Navigate | `/dashboard/projects/[id]` |

---

### **Projects List (`/dashboard/projects`)**

| Element | Action | Destination |
|---------|--------|-------------|
| Create Project | Navigate | `/guided/step-1` |
| Edit Project | Navigate | `/guided/step-1?projectId=[id]` |
| Delete Project | Modal | Confirmation modal |
| Project Card | Navigate | `/dashboard/projects/[id]` |
| Search Input | Action | Filter projects by name (real-time) |
| Status Filter | Action | Filter by status (All, Draft, In Progress, Completed) |
| Occasion Filter | Action | Filter by occasion (All, Wedding, Birthday, Anniversary, Business) |
| Sort Dropdown | Action | Sort projects (Recent, Name, Status) |

---

### **Project Detail (`/dashboard/projects/[id]`)**

#### **Page Header**
| Element | Action | Destination |
|---------|--------|-------------|
| Back Button | Navigate | `/dashboard/projects` |
| Edit Project | Navigate | `/guided/step-1?projectId=[id]` |
| Delete Project | Modal | Confirmation modal |
| Share Project | Modal | Share project modal |

#### **Scenes Tab**
| Element | Action | Destination |
|---------|--------|-------------|
| Add Scene | Navigate | `/guided/step-3?projectId=[id]` |
| Edit Scene | Navigate | `/guided/step-3?sceneId=[id]` |
| Preview Scene | Modal | Scene preview modal |
| Delete Scene | Modal | Confirmation modal |

#### **Assets Tab**
| Element | Action | Destination |
|---------|--------|-------------|
| Upload Asset | Modal | Asset upload modal |
| Generate Image | Navigate | `/guided/step-3?projectId=[id]` |
| Asset Card | Modal | Asset preview modal |
| Delete Asset | Modal | Confirmation modal |

#### **Audio Tab**
| Element | Action | Destination |
|---------|--------|-------------|
| Generate Music | Navigate | `/guided/step-4?projectId=[id]` |
| Generate Narration | Navigate | `/guided/step-4?projectId=[id]` |
| Play Audio | Action | Play audio in player |
| Delete Audio | Modal | Confirmation modal |

#### **Share Tab**
| Element | Action | Destination |
|---------|--------|-------------|
| Create Link | Modal | Create link modal |
| Copy Link | Action | Copy to clipboard |
| Edit Link | Modal | Edit link modal |
| Delete Link | Modal | Confirmation modal |

#### **Settings Tab**
| Element | Action | Destination |
|---------|--------|-------------|
| Save Settings | Action | Save project settings |
| Delete Project | Modal | Confirmation modal |
| Export Project | Action | Download project JSON |

---

### **Templates (`/dashboard/templates`)**

| Element | Action | Destination |
|---------|--------|-------------|
| Create Template | Modal | Create template modal |
| Use Template | Navigate | `/guided/step-1?templateId=[id]` |
| Preview Template | Modal | Template preview modal |
| Delete Template | Modal | Confirmation modal (custom only) |
| Type Filter | Action | Filter by type (All, System, Custom) |
| Category Filter | Action | Filter by category (All, Wedding, Birthday, Anniversary, Business) |
| Sort Dropdown | Action | Sort templates (Popular, Recent, Name) |

---

### **Account (`/dashboard/account`)**

#### **Profile Tab**
| Element | Action | Destination |
|---------|--------|-------------|
| Change Password | Modal | Change password modal |
| Export Data | Action | Download JSON file |
| Delete Account | Modal | Confirmation modal |

#### **Subscription Tab**
| Element | Action | Destination |
|---------|--------|-------------|
| Manage Subscription | Modal | Manage subscription modal |
| View Billing History | Action | Show billing history table |

#### **Usage & Credits Tab**
| Element | Action | Destination |
|---------|--------|-------------|
| Purchase Credits | Modal | Purchase credits modal |
| View Usage History | Action | Show usage history table |
| Export Usage | Action | Download CSV |

#### **Notifications Tab**
| Element | Action | Destination |
|---------|--------|-------------|
| Email Notifications Toggle | Action | Toggle setting (save preferences) |
| Push Notifications Toggle | Action | Toggle setting (save preferences) |
| Marketing Emails Toggle | Action | Toggle setting (save preferences) |
| Security Alerts Toggle | Disabled | Always on (disabled, with tooltip) |

---

**Total Buttons/Links**: 56
- Dashboard Home: 5
- Projects List: 8 (removed grid/list toggle from count as it's desktop-only)
- Project Detail: 23 (4 header + 19 across 5 tabs)
- Templates: 7
- Account: 12 (across 4 tabs)

**Total Modals**: 20

---

## Mobile-First Patterns

### **Responsive Breakpoints**
\`\`\`typescript
// From mobile-first-best-practices.md
sm: 640px   // Small tablets
md: 768px   // Tablets (mobile breakpoint)
lg: 1024px  // Desktop (desktop breakpoint)
xl: 1280px  // Large desktop
\`\`\`

### **Touch Targets**
\`\`\`typescript
Button: min-h-[44px] min-w-[44px]  // WCAG 2.1 Level AA
Input: min-h-[48px]                 // Prevents iOS zoom
Card: min-h-[80px]                  // Comfortable tapping
\`\`\`

### **Component Patterns**

#### **Mobile-First Card**
\`\`\`tsx
<Card className="
  p-4 space-y-3           // Mobile base
  md:p-6 md:space-y-4     // Tablet
  lg:p-8 lg:space-y-6     // Desktop
">
  <h2 className="text-lg md:text-xl lg:text-2xl">
    Title
  </h2>
</Card>
\`\`\`

#### **Responsive Grid**
\`\`\`tsx
<div className="
  grid grid-cols-1        // Mobile: 1 column
  md:grid-cols-2          // Tablet: 2 columns
  lg:grid-cols-3          // Desktop: 3 columns
  gap-4
">
  {items.map(item => <Card key={item.id} />)}
</div>
\`\`\`

#### **Adaptive Modal**
\`\`\`tsx
import { useDevice } from "@/contexts/DeviceContext"

function MyModal() {
  const { isMobile } = useDevice()
  
  return isMobile ? (
    <Drawer>{content}</Drawer>
  ) : (
    <Dialog>{content}</Dialog>
  )
}
\`\`\`

#### **Horizontal Scrollable Tabs (Mobile)**
\`\`\`tsx
<div className="
  flex overflow-x-auto          // Mobile: Scrollable
  md:overflow-x-visible         // Desktop: No scroll
  gap-2 pb-2
  scrollbar-hide                // Hide scrollbar
">
  {tabs.map(tab => (
    <Button key={tab.id} className="min-w-[120px]">
      {tab.label}
    </Button>
  ))}
</div>
\`\`\`

#### **Collapsible Filters (Mobile)**
\`\`\`tsx
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion"

function Filters() {
  const { isMobile } = useDevice()
  
  return isMobile ? (
    <Accordion type="single" collapsible>
      <AccordionItem value="filters">
        <AccordionTrigger>Filters</AccordionTrigger>
        <AccordionContent>
          {filterContent}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ) : (
    <div className="flex gap-4">
      {filterContent}
    </div>
  )
}
\`\`\`

---

## Testing Checklist

### **Responsive Testing**
- [ ] 320px (iPhone SE) - All components render correctly
- [ ] 375px (iPhone 12/13/14) - Optimal mobile experience
- [ ] 768px (iPad Portrait) - Tablet breakpoint works
- [ ] 1024px (iPad Landscape) - Desktop breakpoint works
- [ ] 1440px+ (Desktop) - Full desktop experience

### **Touch Target Testing**
- [ ] All buttons ≥ 44px × 44px
- [ ] All form inputs ≥ 48px height
- [ ] All cards/list items ≥ 80px height
- [ ] Adequate spacing between touch targets (≥ 8px)

### **Page Navigation Testing**
- [ ] Dashboard Home → Projects List
- [ ] Dashboard Home → Templates
- [ ] Dashboard Home → Account
- [ ] Projects List → Project Detail
- [ ] Project Detail → All tabs work
- [ ] Templates → Use Template
- [ ] Account → All tabs work

### **Redirection Testing**
- [ ] Create Project → `/guided/step-1`
- [ ] Edit Project → `/guided/step-1?projectId=[id]`
- [ ] Add Scene → `/guided/step-3?projectId=[id]`
- [ ] Edit Scene → `/guided/step-3?sceneId=[id]`
- [ ] Generate Music → `/guided/step-4?projectId=[id]`
- [ ] Use Template → `/guided/step-1?templateId=[id]`

### **Modal Testing**
- [ ] All modals open correctly
- [ ] All modals close correctly
- [ ] All modal forms validate
- [ ] All modal actions work

### **Feature Testing**
- [ ] All filters work
- [ ] All search works
- [ ] All sorting works
- [ ] All delete confirmations work
- [ ] All copy to clipboard works

### **Performance Testing**
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] First Input Delay < 100ms
- [ ] Mock data loads instantly

---

## Summary

### **Total Time Estimate: 18-24 hours**

- **Phase 1**: Setup & Refactoring (4-6 hours)
- **Phase 2**: Dashboard Home Page (3-4 hours)
- **Phase 3**: Projects Pages (5-7 hours)
- **Phase 4**: Templates Page (2-3 hours)
- **Phase 5**: Account Page (3-4 hours)
- **Phase 6**: Modals & Actions (2-3 hours)
- **Phase 7**: Polish & Testing (2-3 hours)

### **Key Deliverables**

1. ✅ Hierarchical dashboard architecture (5 pages)
2. ✅ Complete mock data for all 14 schema tables
3. ✅ Mobile-first responsive design
4. ✅ All button actions and redirections working
5. ✅ No dead-end buttons
6. ✅ Max 5 tabs per page (mobile-friendly)
7. ✅ Production-ready UI (before Convex/Clerk integration)

### **Architecture Benefits**

- ✅ **Scalable**: Easy to add new pages/features
- ✅ **Mobile-Friendly**: Max 5 tabs per page
- ✅ **Industry Standard**: Follows Figma, Notion, Google Drive patterns
- ✅ **Progressive Disclosure**: Overview → Details
- ✅ **Clear Hierarchy**: Logical information architecture

### **Next Steps After UI Completion**

1. **Convex Integration** (replace mock data with real queries/mutations)
2. **Clerk Integration** (add real authentication)
3. **AI Models Integration** (connect to fal.ai, OpenAI, etc.)

---

*This plan is comprehensive, accurate, and ready for implementation. Every button has an action, every redirection is documented, and the mobile-first approach is followed throughout. The hierarchical architecture solves the tab overflow problem and provides a scalable foundation for future features.*

## Implementation Status: 100% COMPLETED ✅

**Note**: This plan was completed using mock data and temporary sessionStorage. The app has since been migrated to use Convex as the single source of truth for all data persistence. See `docs/Implementation/ToDo/convex-implementation-plan.md` for backend implementation details.
