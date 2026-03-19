# Convex Setup Guide

Complete step-by-step guide for setting up Convex database before implementation.

## Prerequisites

- Next.js 14+ project
- Node.js 18+
- Clerk authentication setup completed
- npm or pnpm package manager

## Phase 1: Convex Account & Project Setup (10 minutes)

### Step 1: Create Convex Account

1. Go to [convex.dev](https://convex.dev)
2. Click **"Sign Up"** or **"Log In"**
3. Sign in with GitHub (recommended) or email

### Step 2: Install Convex CLI

\`\`\`bash
npm install convex
# or
pnpm add convex
\`\`\`

### Step 3: Initialize Convex Project

\`\`\`bash
pnpm exec convex dev
\`\`\`

> ⚠️ **Important**: Always use `pnpm exec convex dev` instead of `npx convex dev` to avoid version conflicts. Using `npx` may install a different Convex version than what's in your `package.json`, causing configuration errors.

This will:
- Create `convex/` folder in your project
- Generate `convex.json` configuration
- Prompt you to create a new project

Follow the prompts:
\`\`\`
? Create a new project? Yes
? Project name: myshortreel (or your app name)
? Choose a region: us-east-1 (or closest to your users)
\`\`\`

### Step 4: Get Deployment URL

After initialization, you'll see:
\`\`\`
Deployment URL: https://your-project-name.convex.cloud
\`\`\`

Save this URL for environment variables.

## Phase 2: Clerk + Convex Integration (15 minutes)

### Step 5: Configure Clerk Authentication in Convex

1. In Convex Dashboard, go to **Settings** > **Authentication**
2. Click **"Add Provider"**
3. Select **"Clerk"**
4. Enter Clerk configuration:
   - **Issuer URL**: `https://your-app.clerk.accounts.dev` (from Clerk JWT template)
   - **Application ID**: Your Clerk app ID

5. Click **"Save"**

### Step 6: Create Auth Configuration File

Create `convex/auth.config.ts`:

\`\`\`typescript
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
}
\`\`\`

## Phase 3: Database Schema Implementation (20 minutes)

### Step 7: Create Schema File

Create `convex/schema.ts` and copy the schema from `docs/Guides/convex-database-schema.md`:

\`\`\`typescript
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    organizationId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_email', ['email'])
    .index('by_organization', ['organizationId']),

  // ... Copy remaining tables from convex-database-schema.md
})
\`\`\`

### Step 8: Verify Schema

\`\`\`bash
pnpm exec convex dev
\`\`\`

Check terminal for schema validation. Fix any errors.

## Phase 4: Basic Convex Functions (20 minutes)

### Step 9: Create User Management Functions

Create `convex/users.ts`:

\`\`\`typescript
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// Get current user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()
  },
})

// Create or update user
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first()

    const now = Date.now()

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      })
      return existing._id
    } else {
      return await ctx.db.insert('users', {
        ...args,
        createdAt: now,
        updatedAt: now,
      })
    }
  },
})
\`\`\`

### Step 10: Create Project Management Functions

Create `convex/projects.ts`:

\`\`\`typescript
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// List user projects
export const listProjects = query({
  args: {
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) throw new Error('User not found')

    let query = ctx.db.query('projects')

    if (args.organizationId) {
      query = query.withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId)
      )
    } else {
      query = query.withIndex('by_user', (q) => q.eq('userId', user._id))
    }

    return await query.order('desc').take(100)
  },
})

// Create project
export const createProject = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) throw new Error('User not found')

    const now = Date.now()

    return await ctx.db.insert('projects', {
      userId: user._id,
      organizationId: args.organizationId,
      name: args.name,
      category: args.category,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })
  },
})
\`\`\`

## Phase 5: Storage Configuration (10 minutes)

### Step 11: Configure File Storage

Convex has built-in file storage. No additional configuration needed.

Create `convex/storage.ts`:

\`\`\`typescript
import { v } from 'convex/values'
import { mutation } from './_generated/server'

// Generate upload URL for assets
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    return await ctx.storage.generateUploadUrl()
  },
})

// Save asset metadata after upload
export const saveAsset = mutation({
  args: {
    storageId: v.string(),
    name: v.string(),
    type: v.union(v.literal('image'), v.literal('video'), v.literal('audio')),
    size: v.number(),
    mimeType: v.string(),
    projectId: v.optional(v.id('projects')),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first()

    if (!user) throw new Error('User not found')

    const now = Date.now()

    return await ctx.db.insert('assets', {
      userId: user._id,
      organizationId: args.organizationId,
      projectId: args.projectId,
      name: args.name,
      type: args.type,
      url: args.storageId, // Convex storage ID
      size: args.size,
      mimeType: args.mimeType,
      uploadedAt: now,
    })
  },
})
\`\`\`

## Phase 6: Environment Variables (5 minutes)

### Step 12: Configure Environment Variables

Add to `.env.local`:

\`\`\`bash
# Convex
CONVEX_DEPLOYMENT=dev:your-project-name
NEXT_PUBLIC_CONVEX_URL=https://your-project-name.convex.cloud

# Clerk JWT for Convex (already set from Clerk setup)
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev

# fal.ai (REQUIRED for Sprint 6+ - AI Video Generation)
FAL_KEY=your_key_id:your_key_secret
\`\`\`

> ⚠️ **CRITICAL**: Convex URLs must NOT have a trailing slash! 
> - ✅ Correct: `https://your-project.convex.cloud`
> - ❌ Wrong: `https://your-project.convex.cloud/`
> 
> A trailing slash causes WebSocket connection failures (error code 1006) and prevents user sync.

**How to Get FAL_KEY** (Required for Sprint 6+):
1. Go to [fal.ai Dashboard](https://fal.ai/dashboard/keys)
2. Sign up with email or GitHub
3. Navigate to **API Keys**
4. Click **"Create Key"**
5. Copy the full key (format: `key_id:key_secret`)

**Cost Note**: Kling Video v2.1 Pro costs $0.05/second ($0.25 for 5s, $0.50 for 10s video).

### Step 13: Add to Vercel

1. Go to Vercel Dashboard > Project > Settings > Environment Variables
2. Add:
   - `CONVEX_DEPLOYMENT` (production value)
   - `NEXT_PUBLIC_CONVEX_URL` (production value)
   - `FAL_KEY` (same for all environments) **← REQUIRED for Sprint 6+**

### Step 14: Add to Convex Dashboard

⚠️ **CRITICAL for Sprint 6+**: Convex actions need access to `FAL_KEY` for video generation.

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add Variable"**
5. Add:
   - **Name**: `FAL_KEY`
   - **Value**: `your_key_id:your_key_secret`
6. Click **"Save"**

## Phase 7: Frontend Integration (15 minutes)

### Step 15: Install Convex React Package

\`\`\`bash
npm install convex @convex-dev/react
# or
pnpm add convex @convex-dev/react
\`\`\`

### Step 16: Create Convex Provider

Create `providers/convex-clerk-provider.tsx`:

\`\`\`typescript
'use client'

import { ClerkProvider, useAuth } from '@clerk/nextjs'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import { ReactNode } from 'react'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function ConvexClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
\`\`\`

### Step 17: Update Root Layout

Update `app/layout.tsx`:

\`\`\`typescript
import { ConvexClerkProvider } from '@/providers/convex-clerk-provider'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConvexClerkProvider>
          {children}
        </ConvexClerkProvider>
      </body>
    </html>
  )
}
\`\`\`

## Phase 8: Seed Database (5 minutes)

### Step 18: Seed Required Data

Before testing, populate the database with required seed data:

\`\`\`bash
# 1. Seed transition effects (46 FFmpeg xfade effects for video transitions)
npx tsx scripts/seed-transition-effects.ts

# 2. Seed credit system (pricing, tiers, and system config)
pnpm exec convex run seedCredits:seedAll
\`\`\`

**What gets seeded:**
- **transitionEffects** (46 records): All FFmpeg xfade transitions (fade, wipe, slide, etc.)
- **systemConfig** (2 records): Initial credits (200) and monthly reset settings
- **subscriptionTiers** (3 records): Casual, Regular, Intensive tiers
- **creditCosts** (12 records): Cost for each action (chat, image, video, audio, assembly)

> ⚠️ **Important**: These scripts are idempotent - running them multiple times is safe (existing records are skipped).

## Phase 9: Testing (15 minutes)

### Step 20: Test Database Connection

Create test page `app/test-convex/page.tsx`:

\`\`\`typescript
'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

export default function TestConvexPage() {
  const user = useQuery(api.users.getCurrentUser)
  const createProject = useMutation(api.projects.createProject)

  const handleCreateProject = async () => {
    await createProject({
      name: 'Test Project',
      category: 'business',
    })
  }

  return (
    <div className="p-8">
      <h1>Convex Test Page</h1>
      <div>User: {user?.email || 'Not logged in'}</div>
      <button onClick={handleCreateProject}>Create Test Project</button>
    </div>
  )
}
\`\`\`

### Step 21: Verify in Convex Dashboard

1. Go to Convex Dashboard
2. Click **"Data"**
3. Check that tables are created
4. Verify seed data exists (transitionEffects, creditCosts, subscriptionTiers, systemConfig)
5. Verify test data appears after testing

## Common Issues & Solutions

### Issue: "Deployment not found"
**Solution**: Run `pnpm exec convex dev` to ensure deployment is active

### Issue: "Auth identity is null"
**Solution**: Verify Clerk JWT issuer domain matches in both Clerk and Convex settings

### Issue: "Schema validation failed"
**Solution**: Check `convex/schema.ts` for syntax errors. Run `pnpm exec convex dev` to see detailed errors

### Issue: "Storage upload fails"
**Solution**: Ensure `generateUploadUrl` mutation is properly authenticated

## Production Deployment

### Step 22: Deploy to Production

\`\`\`bash
# Deploy Convex functions
pnpm exec convex deploy

# This will create a production deployment URL
\`\`\`

Update Vercel environment variables with production Convex URL.

## Security Checklist

- [ ] Convex deployment URL is in environment variables
- [ ] Clerk JWT issuer is configured in Convex
- [ ] All mutations check authentication
- [ ] Organization isolation is enforced in queries
- [ ] Storage uploads are authenticated
- [ ] Production deployment is separate from development
- [ ] `FAL_KEY` is set in Convex dashboard (required for Sprint 6+)
- [ ] `FAL_KEY` is set in Vercel (required for Sprint 6+)

## Next Steps

After completing this setup:
1. Implement remaining Convex functions per convex-implementation-plan.md
2. Test Clerk + Convex integration thoroughly
3. Migrate mock data to Convex queries

## Time Estimate

Total setup time: **115 minutes** (~2 hours)

- Account & project setup: 10 min
- Clerk integration: 15 min
- Schema implementation: 20 min
- Basic functions: 20 min
- Storage configuration: 10 min
- Environment variables: 5 min
- Frontend integration: 15 min
- **Seed database: 5 min**
- Testing: 15 min

## Support Resources

- [Convex Documentation](https://docs.convex.dev)
- [Convex + Clerk Guide](https://docs.convex.dev/auth/clerk)
- [Convex File Storage](https://docs.convex.dev/file-storage)
- [Convex React Integration](https://docs.convex.dev/client/react)
