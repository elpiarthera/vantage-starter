# Clerk + Convex Authentication Implementation Plan
**Project:** MyShortReel - Video Creation Platform  
**Date:** January 2025  
**Type:** MVP - Production Ready  
**Developer:** Solo Developer  

---

## Executive Summary

This plan outlines the implementation of Clerk authentication with Convex backend integration for MyShortReel, a guided video creation platform. The implementation follows production-ready best practices while maintaining MVP simplicity for a solo developer.

**Total Estimated Time:** 12-16 hours

---

## Prerequisites & Dependency Installation

### **Step 0: Install Dependencies** (15 min)

**Before starting any implementation, install all required packages:**

\`\`\`bash
# Install Clerk for authentication
npm install @clerk/nextjs

# Install Convex and React integration
npm install convex
npm install convex/react

# Initialize Convex project (will prompt for login)
npx convex dev
\`\`\`

**This will:**
- Add Clerk authentication to the project
- Create `convex/` folder structure
- Generate `convex.json` config
- Prompt for GitHub login to Convex
- Create development deployment
- Add environment variables to `.env.local`

**Environment variables needed:**
\`\`\`bash
# .env.local

# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev

# Convex (Backend)
CONVEX_DEPLOYMENT=dev:xxx
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
\`\`\`

---

## 🔍 Current State Analysis

### Application Architecture
- **Framework:** Next.js 15 (App Router)
- **UI Library:** shadcn/ui with Tailwind CSS
- **State Management:** Zustand stores (video-store.ts, scene-store.ts)
- **Storage:** Convex database (no client-side storage)
- **Routing Structure:**
  - `/` - Landing page (public)
  - `/guided/step-1` through `/guided/step-6` - Multi-step video creation flow
  - `/dashboard` - User dashboard
- **Current Auth:** Mock UI only (Profile dropdown with Sign Out button, no actual auth)

### Key Features Requiring Auth
1. **User Projects:** Save/load video projects per user
2. **Dashboard:** View user's created videos and projects
3. **Asset Management:** User-uploaded photos/videos
4. **Video Generation:** Track generation history per user
5. **Multi-step Flow:** Persist progress in Convex database

### Data Storage
- All data stored in Convex database
- Real-time sync across devices
- No client-side persistence

---

## Implementation Strategy

### Phase 1: Foundation Setup (3-4 hours)

#### 1.1 Install Dependencies (30 min)
**Tasks:**
- Install `@clerk/nextjs` package
- Install Convex CLI and SDK (`convex`)
- Initialize Convex project
- Set up environment variables

**Commands:**
\`\`\`bash
# Install Clerk
npm install @clerk/nextjs

# Install Convex
npm install convex

# Initialize Convex project
npx convex dev
\`\`\`

**Environment Variables:**
\`\`\`env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

CLERK_JWT_ISSUER_DOMAIN=https://[your-app].clerk.accounts.dev

# Convex
CONVEX_DEPLOYMENT=...
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
\`\`\`

**Deliverables:**
- ✅ Dependencies installed
- ✅ Environment variables configured
- ✅ Convex project initialized

---

#### 1.2 Configure Clerk JWT Template (45 min)
**Tasks:**
- Create Convex JWT template in Clerk Dashboard
- Copy issuer domain (JWT Issuer Domain)
- Map claims: `aud`, `name`, `email`, `userId`
- Test JWT generation

**Steps:**
1. Navigate to Clerk Dashboard → JWT Templates
2. Create new template → Select "Convex"
3. **IMPORTANT:** The template MUST be named `convex` (cannot be renamed)
4. Save issuer URL: `https://[your-app].clerk.accounts.dev`
5. Verify default claims are mapped:
   - `sub` → User ID
   - `aud` → `convex` (automatically set)
   - `name` → User's full name
   - `email` → User's email

**Deliverables:**
- ✅ JWT template created with name `convex`
- ✅ Issuer domain saved to `CLERK_JWT_ISSUER_DOMAIN`
- ✅ Claims properly mapped

---

#### 1.3 Configure Convex Auth (1 hour)
**Tasks:**
- Create `convex/auth.config.js` (JavaScript file, not TypeScript)
- Set up Clerk provider configuration
- Deploy auth config to Convex
- Verify authentication flow

**Files to Create:**
\`\`\`javascript
// convex/auth.config.js
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
}
\`\`\`

**Commands:**
\`\`\`bash
npx convex dev  # Auto-syncs auth config
\`\`\`

**Deliverables:**
- ✅ Auth config file created (auth.config.js)
- ✅ Convex configured with Clerk
- ✅ Auth config deployed

---

#### 1.4 Add Clerk Middleware (1 hour)
**Tasks:**
- Create `middleware.ts` in root directory
- Configure route protection
- Set up public/protected route patterns
- Test middleware behavior

**Files to Create:**
\`\`\`typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
\`\`\`

**Protected Routes:**
- `/guided/*` - All guided flow steps
- `/dashboard` - User dashboard
- `/api/*` - All API routes (future)

**Public Routes:**
- `/` - Landing page
- `/sign-in` - Sign in page
- `/sign-up` - Sign up page

**Deliverables:**
- ✅ Middleware configured
- ✅ Route protection working
- ✅ Redirects functioning

---

### Phase 2: UI Integration (3-4 hours)

#### 2.1 Update Root Layout (1 hour)
**Tasks:**
- Wrap app with `<ClerkProvider>`
- Create separate `ConvexClientProvider` client component
- Configure Convex client with Clerk auth
- Test provider hierarchy

**Files to Create:**

\`\`\`typescript
// providers/ConvexClientProvider.tsx
"use client"

import { ClerkProvider, useAuth } from "@clerk/nextjs"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ConvexReactClient } from "convex/react"
import { ReactNode } from "react"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
\`\`\`

**Files to Modify:**
\`\`\`typescript
// app/layout.tsx
import { ConvexClientProvider } from "@/providers/ConvexClientProvider"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  )
}
\`\`\`

**Deliverables:**
- ✅ ConvexClientProvider created
- ✅ Providers configured in correct order
- ✅ Convex client initialized with Clerk auth
- ✅ Auth context available throughout app

---

#### 2.2 Create Auth Pages (1.5 hours)
**Tasks:**
- Create sign-in page with Clerk component
- Create sign-up page with Clerk component
- Style auth pages to match app theme
- Configure social providers (Google, Facebook)

**Files to Create:**
\`\`\`typescript
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#101a23]">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#182634] border-[#223649]",
          }
        }}
      />
    </div>
  )
}

// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#101a23]">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#182634] border-[#223649]",
          }
        }}
      />
    </div>
  )
}
\`\`\`

**Social Providers Configuration:**
1. Enable Google OAuth in Clerk Dashboard
2. Enable Facebook OAuth in Clerk Dashboard
3. Configure redirect URLs
4. Test social sign-in flow

**Deliverables:**
- ✅ Sign-in page created
- ✅ Sign-up page created
- ✅ Pages styled to match theme
- ✅ Social providers enabled

---

#### 2.3 Update Navigation Components (30-45 min)
**Tasks:**
- Replace mock Profile dropdown with `<UserButton>`
- Update header in `app/page.tsx`
- Update headers in guided flow pages
- Add sign-in/sign-up buttons for unauthenticated users
- Use Convex auth helpers for better integration

**Files to Modify:**
- `app/page.tsx` - Landing page header
- `app/guided/step-1/page.tsx` through `step-6/page.tsx` - Step headers
- `app/dashboard/page.tsx` - Dashboard header

**Implementation:**
\`\`\`typescript
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react"
import { UserButton, SignInButton, SignUpButton } from '@clerk/nextjs'

// Replace existing dropdown with:
<Authenticated>
  <UserButton 
    appearance={{
      elements: {
        avatarBox: "h-10 w-10"
      }
    }}
  />
</Authenticated>

<Unauthenticated>
  <div className="flex gap-2">
    <SignInButton mode="modal">
      <Button>Sign In</Button>
    </SignInButton>
    <SignUpButton mode="modal">
      <Button>Sign Up</Button>
    </SignUpButton>
  </div>
</Unauthenticated>

<AuthLoading>
  <Spinner />
</AuthLoading>
\`\`\`

**Why use Convex auth helpers?**
- `Authenticated`, `Unauthenticated`, `AuthLoading` from Convex ensure the auth state is synced with Convex backend
- Prevents race conditions where Clerk shows authenticated but Convex hasn't validated the token yet
- More reliable for protecting UI that depends on Convex data

**Deliverables:**
- ✅ UserButton integrated
- ✅ All headers updated with Convex auth helpers
- ✅ Auth state properly displayed
- ✅ Loading states handled

---

### Phase 3: Convex Backend Setup (4-5 hours)

#### 3.1 Define Convex Schema (1.5 hours)
**Tasks:**
- Create database schema for user projects
- Define tables: `projects`, `scenes`, `assets`
- Set up relationships and indexes
- Deploy schema

**Files to Create:**
\`\`\`typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  projects: defineTable({
    userId: v.string(),
    name: v.string(),
    occasion: v.string(),
    theme: v.string(),
    eventDetails: v.object({
      name: v.string(),
      description: v.optional(v.string()),
      date: v.optional(v.string()),
      location: v.optional(v.string()),
      rsvpLink: v.optional(v.string()),
      emotionalStory: v.string(),
    }),
    language: v.string(),
    duration: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("in-progress"),
      v.literal("completed")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"]),

  scenes: defineTable({
    projectId: v.id("projects"),
    userId: v.string(),
    sceneNumber: v.number(),
    title: v.string(),
    description: v.string(),
    duration: v.number(),
    startFrame: v.optional(v.string()),
    endFrame: v.optional(v.string()),
    cinematicStyles: v.optional(v.object({
      ambiance: v.optional(v.string()),
      cameraMovement: v.optional(v.string()),
      colorTone: v.optional(v.string()),
      visualStyle: v.optional(v.string()),
    })),
    videoUrl: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("generating"),
      v.literal("completed")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"]),

  assets: defineTable({
    userId: v.string(),
    projectId: v.optional(v.id("projects")),
    type: v.union(v.literal("image"), v.literal("video")),
    url: v.string(),
    filename: v.string(),
    size: v.number(),
    uploadedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"]),
})
\`\`\`

**Deliverables:**
- ✅ Schema defined
- ✅ Tables created
- ✅ Indexes configured
- ✅ Schema deployed

---

#### 3.2 Create Convex Mutations (1.5 hours)
**Tasks:**
- Create project CRUD operations
- Create scene CRUD operations
- Add auth checks using `ctx.auth.getUserIdentity()` to all mutations
- Test mutations

**Files to Create:**
\`\`\`typescript
// convex/projects.ts
import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const create = mutation({
  args: {
    name: v.string(),
    occasion: v.string(),
    theme: v.string(),
    eventDetails: v.object({
      name: v.string(),
      description: v.optional(v.string()),
      date: v.optional(v.string()),
      location: v.optional(v.string()),
      rsvpLink: v.optional(v.string()),
      emotionalStory: v.string(),
    }),
    language: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthenticated")
    }

    const projectId = await ctx.db.insert("projects", {
      userId: identity.subject, // Clerk user ID from JWT
      ...args,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return projectId
  },
})

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("in-progress"),
      v.literal("completed")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthenticated")
    }

    const { id, ...updates } = args
    const project = await ctx.db.get(id)
    
    // Verify ownership
    if (!project || project.userId !== identity.subject) {
      throw new Error("Unauthorized")
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthenticated")
    }

    const project = await ctx.db.get(args.id)
    
    if (!project || project.userId !== identity.subject) {
      throw new Error("Unauthorized")
    }

    await ctx.db.delete(args.id)
  },
})

// convex/scenes.ts - Similar structure for scenes
\`\`\`

**Deliverables:**
- ✅ Project mutations created
- ✅ Scene mutations created
- ✅ Auth checks implemented
- ✅ Mutations tested

---

#### 3.3 Create Convex Queries (1-1.5 hours)
**Tasks:**
- Create queries for user projects
- Create queries for project scenes
- Add pagination support
- Test queries

**Files to Create:**
\`\`\`typescript
// convex/projects.ts (continued)
export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("in-progress"),
      v.literal("completed")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    let query = ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))

    if (args.status) {
      query = ctx.db
        .query("projects")
        .withIndex("by_user_and_status", (q) => 
          q.eq("userId", identity.subject).eq("status", args.status)
        )
    }

    return await query.order("desc").collect()
  },
})

export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const project = await ctx.db.get(args.id)
    
    if (!project || project.userId !== identity.subject) {
      return null
    }

    return project
  },
})

// convex/scenes.ts
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    // Verify user owns the project
    const project = await ctx.db.get(args.projectId)
    if (!project || project.userId !== identity.subject) {
      return []
    }

    return await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect()
  },
})
\`\`\`

**Deliverables:**
- ✅ Project queries created
- ✅ Scene queries created
- ✅ Auth checks implemented
- ✅ Queries tested

---

### Phase 4: Frontend Integration (3-4 hours)

#### 4.1 Migrate Storage to Convex (2 hours)
**Tasks:**
- Replace mock data with Convex queries
- Update Zustand stores to use Convex
- Implement auto-save functionality
- Use `useConvexAuth()` for reliable auth state
- Test data persistence

**Files to Modify:**
- `app/guided/step-1/page.tsx` - Save project on continue
- `app/guided/step-2/page.tsx` through `step-6/page.tsx` - Auto-save progress
- `stores/video-store.ts` - Integrate with Convex
- `stores/scene-store.ts` - Integrate with Convex

**Implementation Pattern:**
\`\`\`typescript
// In guided flow pages
import { useMutation, useQuery, useConvexAuth } from "convex/react"
import { api } from "@/convex/_generated/api"

const { isAuthenticated, isLoading } = useConvexAuth()
const saveProject = useMutation(api.projects.create)
const updateProject = useMutation(api.projects.update)
const currentProject = useQuery(api.projects.get, 
  isAuthenticated ? { id: projectId } : "skip"
)

// Wait for auth to load
if (isLoading) {
  return <LoadingSpinner />
}

// Auto-save on changes
useEffect(() => {
  if (isAuthenticated && projectId && hasChanges) {
    updateProject({ id: projectId, ...changes })
  }
}, [changes, isAuthenticated])
\`\`\`

**Why use `useConvexAuth()`?**
- Ensures Convex backend has validated the Clerk JWT token
- Prevents queries from running before auth is ready
- More reliable than Clerk's `useAuth()` for Convex integration
- Avoids race conditions

**Implementation Approach:**
1. Build Convex functions first
2. Test in Convex dashboard
3. Integrate with frontend components
4. Add loading states for Convex queries

**Deliverables:**
- ✅ Convex integration complete
- ✅ Auto-save implemented
- ✅ Loading states added
- ✅ Data persistence verified

---

#### 4.2 Update Dashboard (1-1.5 hours)
**Tasks:**
- Fetch user projects from Convex
- Display project list with status
- Add project actions (edit, delete, duplicate)
- Implement project filtering

**Files to Modify:**
- `components/user-dashboard.tsx`
- `app/dashboard/page.tsx`

**Implementation:**
\`\`\`typescript
// components/user-dashboard.tsx
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

export default function UserDashboard() {
  const projects = useQuery(api.projects.list)
  const deleteProject = useMutation(api.projects.remove)

  if (projects === undefined) {
    return <LoadingSpinner />
  }

  return (
    <div>
      {projects.map(project => (
        <ProjectCard 
          key={project._id}
          project={project}
          onDelete={() => deleteProject({ id: project._id })}
        />
      ))}
    </div>
  )
}
\`\`\`

**Deliverables:**
- ✅ Dashboard fetches from Convex
- ✅ Project list displayed
- ✅ Actions implemented
- ✅ Loading states added

---

#### 4.3 Add Loading & Error States (30 min)
**Tasks:**
- Create loading components
- Add error boundaries
- Implement retry logic
- Test error scenarios

**Files to Create:**
\`\`\`typescript
// components/loading-states.tsx
export function ProjectsLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  )
}

// components/error-boundary.tsx
export function ConvexErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      fallback={<ErrorDisplay />}
      onError={(error) => console.error("[Convex Error]", error)}
    >
      {children}
    </ErrorBoundary>
  )
}
\`\`\`

**Deliverables:**
- ✅ Loading components created
- ✅ Error boundaries added
- ✅ Retry logic implemented
- ✅ Error handling tested

---

### Phase 5: Testing & Polish (1-2 hours)

#### 5.1 End-to-End Testing (1 hour)
**Test Scenarios:**
1. **Sign Up Flow**
   - New user signs up with email
   - New user signs up with Google
   - New user signs up with Facebook
   - Verify redirect to home page
   - Verify user profile created

2. **Sign In Flow**
   - Existing user signs in with email
   - Existing user signs in with Google
   - Existing user signs in with Facebook
   - Verify redirect to previous page
   - Verify session persistence

3. **Protected Routes**
   - Unauthenticated user tries to access `/guided/step-1`
   - Verify redirect to sign-in
   - After sign-in, verify redirect back to intended page

4. **Project Creation**
   - Create new project in step 1
   - Verify project saved to Convex
   - Navigate through steps 2-6
   - Verify auto-save working
   - Complete project
   - Verify project appears in dashboard

5. **Project Management**
   - View projects in dashboard
   - Edit existing project
   - Delete project
   - Verify changes reflected in Convex

6. **Session Management**
   - Sign out
   - Verify redirect to home
   - Sign back in
   - Verify projects still available

**Deliverables:**
- ✅ All test scenarios passed
- ✅ Issues documented and fixed
- ✅ Edge cases handled

---

#### 5.2 Performance Optimization (30 min)
**Tasks:**
- Add query caching
- Optimize re-renders
- Implement optimistic updates
- Test performance

**Optimizations:**
\`\`\`typescript
// Optimistic updates for better UX
const updateProject = useMutation(api.projects.update)

const handleUpdate = async (updates) => {
  // Optimistically update UI
  setLocalState(updates)
  
  try {
    await updateProject({ id: projectId, ...updates })
  } catch (error) {
    // Revert on error
    setLocalState(previousState)
    toast.error("Failed to save changes")
  }
}
\`\`\`

**Deliverables:**
- ✅ Queries cached
- ✅ Re-renders optimized
- ✅ Optimistic updates added
- ✅ Performance verified

---

#### 5.3 Security Audit (30 min)
**Checklist:**
- ✅ All mutations check `ctx.auth.getUserIdentity()`
- ✅ All queries verify user ownership
- ✅ Organization permission checks (role-based access)
- ✅ No sensitive data exposed in client
- ✅ Environment variables properly secured
- ✅ CORS configured correctly
- ✅ Rate limiting considered (Clerk handles this)
- ✅ JWT tokens properly validated
- ✅ No auth bypass vulnerabilities

**Deliverables:**
- ✅ Security checklist completed
- ✅ Vulnerabilities addressed
- ✅ Best practices followed

---

### Phase 6: Organizations Support (3-4 hours)

#### 6.1 Enable Clerk Organizations (1 hour)
**Tasks:**
- Enable Organizations in Clerk Dashboard
- Configure organization settings
- Add organization switcher component
- Test organization creation

**Steps:**
1. Navigate to Clerk Dashboard → Organizations
2. Enable Organizations feature
3. Configure settings:
   - Allow users to create organizations: Yes
   - Maximum organizations per user: 5 (or unlimited)
   - Require organization membership: No (users can work solo)
   - Enable organization invitations: Yes

**Files to Modify:**
\`\`\`typescript
// app/dashboard/page.tsx
import { OrganizationSwitcher } from "@clerk/nextjs"

export default function DashboardPage() {
  return (
    <div>
      <header className="flex items-center justify-between">
        <h1>Dashboard</h1>
        <div className="flex items-center gap-4">
          <OrganizationSwitcher 
            appearance={{
              elements: {
                rootBox: "flex items-center"
              }
            }}
          />
          <UserButton />
        </div>
      </header>
      {/* ... rest of dashboard */}
    </div>
  )
}
\`\`\`

**Deliverables:**
- ✅ Organizations enabled in Clerk
- ✅ Organization switcher added
- ✅ Users can create organizations
- ✅ Organization settings configured

---

#### 6.2 Update Convex Schema for Organizations (1 hour)
**Tasks:**
- Add organization fields to schema
- Create organization-level queries
- Update mutations to support organizations
- Add organization member permissions

**Files to Modify:**
\`\`\`typescript
// convex/schema.ts
export default defineSchema({
  projects: defineTable({
    userId: v.string(),
    organizationId: v.optional(v.string()),
    name: v.string(),
    occasion: v.string(),
    theme: v.string(),
    eventDetails: v.object({
      eventTitle: v.string(), // Renamed from 'name' to 'eventTitle' for clarity
      description: v.optional(v.string()),
      date: v.optional(v.string()),
      location: v.optional(v.string()),
      rsvpLink: v.optional(v.string()),
      emotionalStory: v.string(),
    }),
    language: v.string(),
    duration: v.number(),
    status: v.union(
      v.literal('draft'),
      v.literal('in-progress'),
      v.literal('completed')
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"])
    .index("by_user_and_org", ["userId", "organizationId"]),

  organizationSettings: defineTable({
    organizationId: v.string(),
    name: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    videoCredits: v.number(),
    storageLimit: v.number(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"]),
})
\`\`\`

**Deliverables:**
- ✅ Schema updated for organizations
- ✅ Queries support organization context
- ✅ Mutations save organization ID
- ✅ Organization settings table created

---

#### 6.3 Implement Organization Permissions (1-1.5 hours)
**Tasks:**
- Add role-based access control
- Implement permission checks
- Create organization admin features
- Test permission scenarios

**Files to Create:**
\`\`\`typescript
// convex/organizations.ts
import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

async function checkOrgPermission(
  ctx: any,
  projectId: string,
  requiredRole: "admin" | "member"
) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Unauthenticated")

  const project = await ctx.db.get(projectId)
  if (!project) throw new Error("Project not found")

  // Personal project - only owner can access
  if (!project.organizationId) {
    if (project.userId !== identity.subject) {
      throw new Error("Unauthorized")
    }
    return
  }

  // Organization project - check membership
  if (project.organizationId !== identity.organizationId) {
    throw new Error("Not a member of this organization")
  }

  // Check role if admin required
  if (requiredRole === "admin") {
    const role = identity.organizationRole
    if (role !== "admin" && role !== "org:admin") {
      throw new Error("Admin access required")
    }
  }
}

// Usage in mutations
export const deleteProject = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await checkOrgPermission(ctx, args.id, "admin")
    await ctx.db.delete(args.id)
  },
})

export const updateProject = mutation({
  args: { id: v.id("projects"), name: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("in-progress"),
      v.literal("completed")
    )), },
  handler: async (ctx, args) => {
    await checkOrgPermission(ctx, args.id, "member")
    
    const { id, ...updates } = args
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})
\`\`\`

**Organization Use Cases:**
1. **Couples:** Share wedding video projects, both can edit
2. **Marketing Agencies:** Team members collaborate on client videos
3. **Clients:** Agency invites client to view/approve videos (view-only)

**Permission Levels:**
- **Admin:** Can create, edit, delete projects; manage members; manage billing
- **Member:** Can create, edit projects; view all org projects
- **Guest:** View-only access (for clients)

**Deliverables:**
- ✅ Permission helper function created
- ✅ Role-based access control implemented
- ✅ Admin features protected
- ✅ Permission scenarios tested

---

#### 6.4 Add Organization UI Components (30-45 min)
**Tasks:**
- Create organization creation flow
- Add member invitation UI
- Display organization members
- Add organization settings page

**Files to Create:**
\`\`\`typescript
// app/organization/new/page.tsx
import { OrganizationProfile } from "@clerk/nextjs"

export default function NewOrganizationPage() {
  return (
    <div className="container mx-auto py-8">
      <OrganizationProfile 
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-[#182634] border-[#223649]"
          }
        }}
      />
    </div>
  )
}

// components/organization/MemberList.tsx
"use client"

import { useOrganization } from "@clerk/nextjs"

export function MemberList() {
  const { organization, memberships } = useOrganization({
    memberships: {
      pageSize: 20,
    },
  })

  if (!organization) return null

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Team Members</h2>
      <div className="space-y-2">
        {memberships?.data?.map((membership) => (
          <div key={membership.id} className="flex items-center justify-between p-4 bg-[#182634] rounded-lg">
            <div>
              <p className="font-medium">{membership.publicUserData.firstName} {membership.publicUserData.lastName}</p>
              <p className="text-sm text-muted-foreground">{membership.publicUserData.identifier}</p>
            </div>
            <span className="text-sm text-muted-foreground">{membership.role}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
\`\`\`

**Deliverables:**
- ✅ Organization creation flow added
- ✅ Member invitation UI created
- ✅ Member list component built
- ✅ Organization settings page added

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] All environment variables set in production
- [ ] Clerk production instance configured
- [ ] Convex production deployment created
- [ ] Social OAuth apps configured for production URLs
- [ ] JWT template updated with production issuer
- [ ] Database schema deployed to production
- [ ] All tests passing

### Deployment
- [ ] Deploy Next.js app to Vercel
- [ ] Verify Clerk webhooks configured (if needed)
- [ ] Verify Convex functions deployed
- [ ] Test authentication flow in production
- [ ] Test data persistence in production
- [ ] Monitor error logs

### Post-Deployment
- [ ] Verify sign-up/sign-in working
- [ ] Verify social OAuth working
- [ ] Verify project creation/editing
- [ ] Verify dashboard loading
- [ ] Set up monitoring/alerts
- [ ] Document any issues

---

## Time Breakdown Summary

| Phase | Task | Estimated Time |
|-------|------|----------------|
| **Phase 1: Foundation** | | **3-4 hours** |
| | Install dependencies | 30 min |
| | Configure Clerk JWT | 45 min |
| | Configure Convex auth | 1 hour |
| | Add Clerk middleware | 1 hour |
| **Phase 2: UI Integration** | | **3-4 hours** |
| | Update root layout | 1 hour |
| | Create auth pages | 1.5 hours |
| | Update navigation | 45 min |
| **Phase 3: Backend Setup** | | **4-5 hours** |
| | Define Convex schema | 1.5 hours |
| | Create mutations | 1.5 hours |
| | Create queries | 1.5 hours |
| **Phase 4: Frontend Integration** | | **3-4 hours** |
| | Migrate storage to Convex | 2 hours |
| | Update dashboard | 1.5 hours |
| | Add loading/error states | 30 min |
| **Phase 5: Testing & Polish** | | **1-2 hours** |
| | End-to-end testing | 1 hour |
| | Performance optimization | 30 min |
| | Security audit | 30 min |
| **Phase 6: Organizations** | | **3-4 hours** |
| | Enable Clerk Organizations | 1 hour |
| | Update Convex schema | 1 hour |
| | Implement permissions | 1.5 hours |
| | Add organization UI | 45 min |
| **TOTAL** | | **17-23 hours** |

---

## Risk Mitigation

### Potential Issues & Solutions

1. **Issue:** Clerk JWT not recognized by Convex
   - **Solution:** Verify issuer domain matches exactly, check JWT template claims

2. **Issue:** Session not persisting across page refreshes
   - **Solution:** Verify ClerkProvider wraps entire app, check middleware config

3. **Issue:** Convex queries returning empty for authenticated users
   - **Solution:** Check `ctx.auth.getUserIdentity()` returns valid identity, verify indexes

4. **Issue:** Social OAuth redirect loops
   - **Solution:** Verify redirect URLs in Clerk Dashboard match app URLs exactly

5. **Issue:** Data migration from mock data fails
   - **Solution:** Implement gradual migration

6. **Issue:** Performance issues with large project lists
   - **Solution:** Implement pagination, add query limits, use indexes

---

## Best Practices Followed

### Security
✅ Multi-layer authentication (middleware + backend)  
✅ User ownership verification on all operations  
✅ Organization permission checks (role-based access)
✅ No client-side auth bypass possible  
✅ JWT tokens properly validated via `ctx.auth.getUserIdentity()`
✅ Environment variables secured  

### Performance
✅ Query caching enabled  
✅ Optimistic updates for better UX  
✅ Database indexes for fast queries (including organization indexes)
✅ Lazy loading for large lists  
✅ `useConvexAuth()` hook prevents race conditions

### User Experience
✅ Loading states for all async operations  
✅ Error boundaries for graceful failures  
✅ Auto-save to prevent data loss  
✅ Seamless social OAuth integration  
✅ Consistent UI styling  
✅ Organization switcher for easy context switching
✅ Member invitation flow
✅ Role-based UI (show/hide features based on permissions)

### Code Quality
✅ TypeScript for type safety  
✅ Modular code structure  
✅ Reusable components  
✅ Clear error messages  
✅ Comprehensive testing  

---

## Post-Implementation Enhancements (Future)

These are NOT part of the MVP but can be added later:

1. **Email Notifications**
   - Welcome emails
   - Project completion notifications
   - Weekly digest of projects

2. **Team Collaboration**
   - Share projects with other users
   - Collaborative editing
   - Comments and feedback

3. **Advanced Analytics**
   - Track user engagement
   - Video generation metrics
   - A/B testing for flows

4. **Webhooks**
   - Sync user data with external systems
   - Trigger actions on project completion
   - Integration with marketing tools

5. **Advanced Auth Features**
   - Multi-factor authentication
   - Passwordless authentication
   - Enterprise SSO

---

## Support Resources

### Documentation
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk + Convex Integration](https://clerk.com/docs/guides/development/integrations/databases/convex)
- [Convex + Clerk Integration](https://docs.convex.dev/auth/clerk)
- [Clerk Organizations](https://clerk.com/docs/organizations/overview)
- [Convex Documentation](https://docs.convex.dev)
- [Next.js App Router](https://nextjs.org/docs/app)

### Community
- [Clerk Discord](https://clerk.com/discord)
- [Convex Discord](https://convex.dev/community)
- [Next.js Discord](https://nextjs.org/discord)

### Troubleshooting
- Check Clerk Dashboard logs for auth issues
- Check Convex Dashboard logs for backend issues
- Use browser DevTools Network tab for API debugging
- Enable verbose logging in development

---

## Success Criteria

The implementation is considered successful when:

✅ Users can sign up with email, Google, and Facebook  
✅ Users can sign in and sign out  
✅ Protected routes redirect unauthenticated users  
✅ Projects are saved to Convex database  
✅ Projects persist across sessions  
✅ Dashboard displays user's projects  
✅ Auto-save works throughout guided flow  
✅ Users can create organizations
✅ Users can invite members to organizations
✅ Organization projects are shared with members
✅ Role-based permissions work correctly
✅ Organization switcher functions properly
✅ No authentication bypass vulnerabilities  
✅ Performance is acceptable (< 2s page loads)  
✅ Error handling is graceful  
✅ All tests pass  

---

## Notes for Solo Developer

### Time Management Tips
- Work in focused 2-hour blocks
- Complete one phase before moving to next
- Test thoroughly after each phase
- Take breaks to avoid burnout
- Don't skip the testing phase

### When to Ask for Help
- Stuck on same issue for > 30 minutes
- Security concerns or questions
- Performance issues you can't diagnose
- Deployment problems

### Shortcuts for MVP
- Use Clerk's default UI components (don't over-customize)
- Start with email auth, add social later if time permits
- Use Convex's automatic indexes (optimize later)
- Skip advanced features like webhooks for MVP
- Use mock data as fallback during development

### What NOT to Do
- Don't build custom auth (use Clerk)
- Don't over-engineer the database schema
- Don't add features not in the plan
- Don't skip security checks
- Don't deploy without testing

---

**End of Implementation Plan**

*This plan is designed to be followed step-by-step. Each phase builds on the previous one. Stick to the plan, test thoroughly, and you'll have a production-ready auth system in 12-16 hours.*
