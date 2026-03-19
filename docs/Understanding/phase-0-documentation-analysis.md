# Phase 0: Documentation Review & Analysis - MyShortReel

**Status**: ✅ COMPLETED  
**Duration**: 3 hours  
**Date**: October 11, 2025  
**Project**: MyShortReel - AI Video Creation Platform

---

## Executive Summary

This document captures the comprehensive analysis of Clerk Organizations, Clerk + Convex integration, Polar.sh payment system, and AI models integration for MyShortReel. The findings inform our database schema design and implementation strategy for authentication, backend, and AI services.

**Key Decisions**:
- Multi-tenancy via Clerk Organizations (couples, agencies, teams)
- Convex for real-time backend with JWT authentication
- Polar.sh for per-user subscription billing
- AI models: OpenAI GPT-4o, Runway Gen-3, Kling AI
- Organization-scoped data isolation for security

---

## 1. Clerk Organizations (Multi-Tenancy for Video Creation)

### 1.1 Core Concepts

**Organizations** enable collaborative video creation for:
- **Couples**: Create wedding/anniversary videos together
- **Marketing Agencies**: Team members collaborate on client videos
- **Event Planners**: Manage multiple client projects
- **Freelancers**: Work with different clients in separate workspaces

### 1.2 MyShortReel Use Cases

#### Use Case 1: Couple Creating Wedding Video
- **Scenario**: Sarah and John are getting married
- **Setup**: Sarah creates organization "Sarah & John's Wedding"
- **Invitation**: Sarah invites John as admin (both can edit)
- **Collaboration**: Both upload photos, edit scenes, review AI-generated videos
- **Billing**: Shared subscription, both users counted

#### Use Case 2: Marketing Agency
- **Scenario**: "Creative Studio" agency with 5 team members
- **Setup**: Agency owner creates organization "Creative Studio"
- **Roles**:
  - Owner/Admin: Manages billing, invites team members
  - Team Members: Create videos for different clients
- **Projects**: Each client gets separate video project within org
- **Billing**: Agency pays for all 5 team members

#### Use Case 3: Freelancer with Multiple Clients
- **Scenario**: Video creator works with 3 different clients
- **Setup**: Freelancer belongs to 3 organizations
  - Own organization (admin)
  - Client A organization (member)
  - Client B organization (member)
- **Switching**: Uses organization switcher to work on different projects
- **Billing**: Each organization pays separately

### 1.3 Key Features (MVP Scope)

#### Organization Structure
- **Organization ID**: Unique identifier (`org_xxxxx`)
- **Name**: Display name (e.g., "Sarah & John's Wedding", "Creative Studio")
- **Slug**: Optional URL-friendly identifier (`sarah-john-wedding`)
- **Logo**: Custom branding for agencies
- **Metadata**: Store organization preferences (default video style, brand colors)

#### Membership Management
- **Invitations**: Email-based with role assignment
  - Admin: Full access, billing management
  - Member: Create/edit videos, no billing access
- **Multiple Organizations**: Users can belong to multiple orgs
- **Active Organization**: Current workspace context
- **Organization Switcher**: UI component to switch between orgs

#### Billing Model (Polar.sh Integration)
- **Per-User Pricing**: Organization pays for each member
- **Immediate Charging**: User added = org charged immediately
- **Credit on Removal**: User removed = credit at next billing cycle
- **Admin-Only Billing**: Only admins can view/manage subscriptions

### 1.4 Roles & Permissions (MVP - Simple)

#### Default Roles
1. **Admin (`org:admin`)**
   - Create/edit/delete video projects
   - Manage scenes and assets
   - Invite/remove members
   - View and manage billing
   - Access organization settings
   - Delete organization

2. **Member (`org:member`)**
   - Create/edit video projects
   - Manage scenes and assets
   - View other members
   - **CANNOT** view billing
   - **CANNOT** manage members
   - **CANNOT** delete organization

**No custom roles for MVP** - Clerk's default admin/member is sufficient.

### 1.5 Implementation Patterns

#### Organization Context in Video Creation
\`\`\`typescript
import { useOrganization } from '@clerk/nextjs';

export default function VideoProjectPage() {
  const { organization, membership } = useOrganization();
  
  // All video projects belong to the active organization
  const projects = useQuery(api.projects.list, {
    organizationId: organization?.id
  });
  
  // Check if user can manage billing
  const canManageBilling = membership?.role === 'org:admin';
  
  return (
    <div>
      <h1>{organization?.name} - Video Projects</h1>
      {canManageBilling && <BillingButton />}
      <ProjectList projects={projects} />
    </div>
  );
}
\`\`\`

#### Organization Switching
\`\`\`typescript
import { OrganizationSwitcher } from '@clerk/nextjs';

// In navigation header
<OrganizationSwitcher 
  appearance={{
    elements: {
      rootBox: "flex items-center"
    }
  }}
/>
\`\`\`

### 1.6 Data Isolation Strategy

**Every video-related resource MUST be scoped to organization**:
- Video projects → `organizationId`
- Scenes → `organizationId`
- Assets (photos/videos) → `organizationId`
- AI generation history → `organizationId`
- Video exports → `organizationId`

**Security Rule**: Users can ONLY access resources from their current organization.

---

## 2. Clerk + Convex Integration

### 2.1 Integration Architecture

**JWT-based authentication flow**:
1. User signs in via Clerk
2. Clerk issues JWT with custom claims (user ID, org ID, role)
3. Frontend sends JWT to Convex with every request
4. Convex validates JWT and extracts auth context
5. Convex functions use `ctx.auth` to access user/org info

### 2.2 Setup Requirements

#### Step 1: Create JWT Template in Clerk
- Navigate to **JWT Templates** in Clerk Dashboard
- Select **"New template"** and choose **"Convex"** template
- **IMPORTANT**: Do NOT rename the JWT token. It MUST be called `convex`
- Copy and save the **Issuer URL** (Frontend API URL)
  - Dev: `https://verb-noun-00.clerk.accounts.dev`
  - Prod: `https://clerk.[your-domain].com`

#### Step 2: Configure Custom Claims
**Default claims** (pre-configured in Convex template):
- `aud`: "convex" (required by Convex)
- `sub`: User ID (Clerk user ID)
- `name`: User's full name (mapped to `{{user.full_name}}`)
- `email`: User's email

**Custom claims to add for Organizations**:
\`\`\`json
{
  "org_id": "{{org.id}}",
  "org_role": "{{org.role}}",
  "org_slug": "{{org.slug}}"
}
\`\`\`

#### Step 3: Configure Convex Auth
Create `convex/auth.config.js` (NOT .ts - must be .js):
\`\`\`javascript
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
  ],
};
\`\`\`

**Environment Variable Setup**:
Add to your `.env.local`:
\`\`\`bash
CLERK_JWT_ISSUER_DOMAIN=https://verb-noun-00.clerk.accounts.dev
\`\`\`

Then configure in Convex Dashboard:
1. Go to your Convex project settings
2. Add environment variable: `CLERK_JWT_ISSUER_DOMAIN`
3. Set value to your Clerk Frontend API URL

#### Step 4: Wrap App with Providers (Next.js App Router)

**Important**: `ConvexProviderWithClerk` must be in a Client Component because it uses React hooks.

Create `app/ConvexClientProvider.tsx`:
\`\`\`typescript
'use client';

import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { ReactNode } from 'react';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
\`\`\`

Then use it in `app/layout.tsx`:
\`\`\`typescript
import { ConvexClientProvider } from './ConvexClientProvider';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
\`\`\`

### 2.3 Auth in Convex Functions

#### Accessing Auth State
\`\`\`typescript
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const listProjects = query({
  handler: async (ctx) => {
    // Get authenticated user identity
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error('Unauthenticated');
    }
    
    // Access standard claims
    const userId = identity.subject; // Clerk user ID
    const userName = identity.name; // User's full name
    const userEmail = identity.email; // User's email
    
    // Access custom claims (organization info)
    const orgId = identity.org_id; // Custom claim
    const orgRole = identity.org_role; // Custom claim (org:admin or org:member)
    
    // Query with organization isolation
    return await ctx.db
      .query('projects')
      .withIndex('by_organization', (q) => q.eq('organizationId', orgId))
      .collect();
  },
});
\`\`\`

#### Using Auth State in React Components

**IMPORTANT**: Use `useConvexAuth()` instead of Clerk's `useAuth()` when checking if user is logged in.

\`\`\`typescript
'use client';

import { useConvexAuth } from 'convex/react';
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react';

export default function MyComponent() {
  // Use Convex's auth hook - ensures token is fetched and validated
  const { isLoading, isAuthenticated } = useConvexAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <Authenticated>
        <div>You are signed in!</div>
      </Authenticated>
      
      <Unauthenticated>
        <div>Please sign in</div>
      </Unauthenticated>
    </div>
  );
}
\`\`\`

**Why use `useConvexAuth()` instead of Clerk's `useAuth()`?**
- Ensures browser has fetched the auth token needed for Convex
- Confirms Convex backend has validated the token
- Prevents race conditions where UI shows as authenticated but Convex queries fail

#### Permission Checks for Video Operations
\`\`\`typescript
export const deleteProject = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');
    
    // Check organization membership
    if (project.organizationId !== identity.org_id) {
      throw new Error('Unauthorized - Project belongs to different organization');
    }
    
    // Only admins can delete projects (optional - you can allow members too)
    if (identity.org_role !== 'org:admin') {
      throw new Error('Only organization admins can delete projects');
    }
    
    // Delete project and all associated scenes
    const scenes = await ctx.db
      .query('scenes')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();
    
    for (const scene of scenes) {
      await ctx.db.delete(scene._id);
    }
    
    await ctx.db.delete(args.projectId);
  },
});
\`\`\`

### 2.4 Best Practices for MyShortReel

1. **Always validate auth**: Check `ctx.auth.getUserIdentity()` in every function
2. **Organization isolation**: Filter ALL queries by `organizationId`
3. **Index optimization**: Create indexes on `organizationId` for performance
4. **Permission checks**: Verify admin role for sensitive operations
5. **Error messages**: Return clear, user-friendly error messages
6. **Audit logging**: Log important actions (project creation, deletion, video generation)
7. **Use Convex auth helpers**: Use `Authenticated`, `Unauthenticated`, `AuthLoading` components
8. **Use `useConvexAuth()` hook**: Don't use Clerk's `useAuth()` for auth state checks

### 2.5 Configuring Dev and Prod Instances

**Best Practice**: Use environment variables for different Clerk instances

Development:
\`\`\`bash
# .env.local
CLERK_JWT_ISSUER_DOMAIN=https://verb-noun-00.clerk.accounts.dev
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
\`\`\`

Production (set in Convex Dashboard):
\`\`\`bash
CLERK_JWT_ISSUER_DOMAIN=https://clerk.yourdomain.com
\`\`\`

This allows you to use different Clerk instances for development and production without code changes.

---

## 3. Polar.sh Payment Integration

### 3.1 Overview

**Polar.sh** is a Merchant of Record (MoR) billing platform that:
- Handles global tax compliance (VAT, GST, sales tax)
- Manages subscriptions and invoicing
- Provides transparent pricing for developers
- Supports per-user pricing models

### 3.2 MyShortReel Pricing Model (MVP)

**Per-User Subscription**:
- Organization subscribes to a plan
- Price = base price + (number of users × per-user price)
- User added = org charged immediately (prorated)
- User removed = credit applied at next billing cycle

#### Example Pricing Structure
\`\`\`
Starter Plan (Couples/Small Teams):
- $19/month base
- $10/user/month
- 2 users = $19 + (2 × $10) = $39/month
- Includes: 10 video projects, 50 scenes, 100 AI generations

Pro Plan (Agencies):
- $99/month base
- $15/user/month
- 5 users = $99 + (5 × $15) = $174/month
- Includes: Unlimited projects, unlimited scenes, 500 AI generations

Enterprise Plan (Large Agencies):
- Custom pricing
- Dedicated support
- Custom branding
- API access
\`\`\`

### 3.3 Integration Architecture

#### Webhook Events (MVP Scope)
We need to handle:
- `subscription.created` - New subscription started
- `subscription.updated` - Subscription modified (user count changed, plan upgraded)
- `subscription.canceled` - Subscription ended
- `subscription.payment_failed` - Payment issue

#### Data Flow
1. **Admin clicks "Subscribe"** → Redirect to Polar Checkout
2. **Payment successful** → Polar sends webhook to `/api/webhooks/polar`
3. **Webhook handler** → Update Convex subscription record
4. **App checks subscription** → Grant/deny access based on active subscription
5. **User added to org** → Polar automatically charges for new user
6. **User removed from org** → Polar applies credit at next billing

### 3.4 Database Schema for Subscriptions

#### Subscription Schema (MVP)
\`\`\`typescript
// convex/schema.ts
subscriptions: defineTable({
  organizationId: v.string(), // Clerk org ID
  polarSubscriptionId: v.string(), // Polar subscription ID
  polarCustomerId: v.string(), // Polar customer ID
  planId: v.string(), // 'starter' | 'pro' | 'enterprise'
  status: v.union(
    v.literal('active'),
    v.literal('canceled'),
    v.literal('past_due'),
    v.literal('trialing')
  ),
  userCount: v.number(), // Number of users in org
  currentPeriodStart: v.number(),
  currentPeriodEnd: v.number(),
  cancelAtPeriodEnd: v.boolean(),
  trialEnd: v.optional(v.number()),
  benefits: v.object({
    maxProjects: v.number(), // -1 for unlimited
    maxScenes: v.number(), // -1 for unlimited
    maxAIGenerations: v.number(), // per month
    customBranding: v.boolean(),
    prioritySupport: v.boolean(),
  }),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_organization', ['organizationId'])
  .index('by_polar_subscription', ['polarSubscriptionId']),
\`\`\`

### 3.5 Implementation Strategy

#### Phase 1: Webhook Handler
\`\`\`typescript
// app/api/webhooks/polar/route.ts
import { headers } from 'next/headers';
import { api } from '@/convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export async function POST(req: Request) {
  const signature = headers().get('polar-signature');
  const payload = await req.text();
  
  // Verify webhook signature
  const isValid = verifyPolarSignature(payload, signature);
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const event = JSON.parse(payload);
  
  // Handle different event types
  switch (event.type) {
    case 'subscription.created':
      await fetchMutation(api.subscriptions.create, {
        organizationId: event.data.metadata.organizationId,
        polarSubscriptionId: event.data.id,
        polarCustomerId: event.data.customer_id,
        planId: event.data.plan_id,
        status: 'active',
        userCount: event.data.quantity,
        currentPeriodStart: event.data.current_period_start,
        currentPeriodEnd: event.data.current_period_end,
      });
      break;
      
    case 'subscription.updated':
      await fetchMutation(api.subscriptions.update, {
        polarSubscriptionId: event.data.id,
        userCount: event.data.quantity,
        status: event.data.status,
      });
      break;
      
    case 'subscription.canceled':
      await fetchMutation(api.subscriptions.cancel, {
        polarSubscriptionId: event.data.id,
      });
      break;
      
    case 'subscription.payment_failed':
      await fetchMutation(api.subscriptions.updateStatus, {
        polarSubscriptionId: event.data.id,
        status: 'past_due',
      });
      break;
  }
  
  return new Response('OK', { status: 200 });
}
\`\`\`

#### Phase 2: Entitlement Checks
\`\`\`typescript
// convex/subscriptions.ts
export const checkFeatureAccess = query({
  args: { 
    feature: v.union(
      v.literal('create_project'),
      v.literal('generate_video'),
      v.literal('custom_branding')
    )
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_organization', (q) => 
        q.eq('organizationId', identity.org_id)
      )
      .first();
    
    // No subscription = free tier (limited access)
    if (!subscription) {
      return args.feature === 'create_project'; // Only allow project creation
    }
    
    // Check subscription status
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return false;
    }
    
    // Check feature-specific limits
    switch (args.feature) {
      case 'create_project':
        const projectCount = await ctx.db
          .query('projects')
          .withIndex('by_organization', (q) => q.eq('organizationId', identity.org_id))
          .collect()
          .then(projects => projects.length);
        
        return subscription.benefits.maxProjects === -1 || 
               projectCount < subscription.benefits.maxProjects;
      
      case 'generate_video':
        // Check AI generation quota
        const generationsThisMonth = await getGenerationsThisMonth(ctx, identity.org_id);
        return generationsThisMonth < subscription.benefits.maxAIGenerations;
      
      case 'custom_branding':
        return subscription.benefits.customBranding;
      
      default:
        return false;
    }
  },
});
\`\`\`

#### Phase 3: Subscription UI
\`\`\`typescript
// app/settings/billing/page.tsx
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOrganization } from '@clerk/nextjs';

export default function BillingPage() {
  const { organization, membership } = useOrganization();
  const subscription = useQuery(api.subscriptions.getByOrganization, {
    organizationId: organization?.id
  });
  
  // Only admins can access billing
  if (membership?.role !== 'org:admin') {
    return <div>Only organization admins can manage billing</div>;
  }
  
  const handleSubscribe = async (planId: string) => {
    // Redirect to Polar checkout
    const checkoutUrl = await fetch('/api/create-checkout', {
      method: 'POST',
      body: JSON.stringify({
        planId,
        organizationId: organization?.id,
        userCount: organization?.membersCount,
      }),
    }).then(res => res.json());
    
    window.location.href = checkoutUrl;
  };
  
  return (
    <div>
      <h1>Billing & Subscription</h1>
      {subscription ? (
        <CurrentSubscription subscription={subscription} />
      ) : (
        <PricingPlans onSubscribe={handleSubscribe} />
      )}
    </div>
  );
}
\`\`\`

### 3.6 Best Practices

1. **Webhook security**: Always verify Polar signatures
2. **Idempotency**: Handle duplicate webhooks gracefully (use `polarSubscriptionId` as key)
3. **Async processing**: Process webhooks quickly, defer heavy work
4. **Audit trail**: Log all webhook events for debugging
5. **Grace periods**: Don't immediately revoke access on payment failure (7-day grace period)
6. **Clear messaging**: Show users their subscription status, limits, and usage
7. **Prorated billing**: Polar handles prorating automatically when users are added/removed

---

## 4. AI Models Integration Considerations

### 4.1 AI Services Overview

MyShortReel uses three AI services:
1. **OpenAI GPT-4o**: Scene generation, script writing, emotional storytelling
2. **Runway Gen-3 Alpha Turbo**: Text-to-video, image-to-video generation
3. **Kling AI (via Replicate)**: Alternative video generation, longer videos

### 4.2 Cost Management Strategy

#### AI Generation Costs (Estimated)
\`\`\`
OpenAI GPT-4o:
- Scene generation: ~$0.01 per scene
- Script writing: ~$0.02 per script
- Monthly cost for 100 generations: ~$3

Runway Gen-3 Alpha Turbo:
- 5-second video: $0.25
- 10-second video: $0.50
- Monthly cost for 100 videos (5s each): ~$25

Kling AI (Replicate):
- 5-second video: ~$0.15
- 10-second video: ~$0.30
- Monthly cost for 100 videos (5s each): ~$15

Total monthly AI costs for 100 generations: ~$43
\`\`\`

#### Cost Optimization Strategies
1. **Quota Management**: Limit AI generations per plan
   - Starter: 100 generations/month
   - Pro: 500 generations/month
   - Enterprise: Unlimited (with fair use policy)

2. **Caching**: Cache AI responses for similar prompts
   - Store generated scenes in database
   - Reuse similar video generations
   - Cache OpenAI responses for common queries

3. **Fallback Strategy**: Use cheaper models when possible
   - Try Kling AI first (cheaper)
   - Fallback to Runway if quality issues
   - Use GPT-4o-mini for simple tasks

4. **User Education**: Show cost per generation
   - Display remaining quota
   - Warn before expensive operations
   - Suggest optimizations (shorter videos, fewer scenes)

### 4.3 AI Service Integration Architecture

#### Convex Actions for AI Calls
\`\`\`typescript
// convex/ai/generateScene.ts
import { action } from '../_generated/server';
import { v } from 'convex/values';
import { OpenAI } from 'openai';

export const generateScene = action({
  args: {
    projectId: v.id('projects'),
    sceneNumber: v.number(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    // Check auth and quota
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    
    const hasQuota = await ctx.runQuery(api.subscriptions.checkQuota, {
      organizationId: identity.org_id,
      quotaType: 'ai_generations',
    });
    
    if (!hasQuota) {
      throw new Error('AI generation quota exceeded. Please upgrade your plan.');
    }
    
    // Call OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a creative video scene generator...',
        },
        {
          role: 'user',
          content: args.prompt,
        },
      ],
    });
    
    const sceneDescription = response.choices[0].message.content;
    
    // Save to database
    await ctx.runMutation(api.scenes.create, {
      projectId: args.projectId,
      sceneNumber: args.sceneNumber,
      description: sceneDescription,
      status: 'draft',
    });
    
    // Increment usage counter
    await ctx.runMutation(api.subscriptions.incrementUsage, {
      organizationId: identity.org_id,
      usageType: 'ai_generations',
    });
    
    return sceneDescription;
  },
});
\`\`\`

#### Video Generation with Runway
\`\`\`typescript
// convex/ai/generateVideo.ts
export const generateVideo = action({
  args: {
    sceneId: v.id('scenes'),
    prompt: v.string(),
    duration: v.number(), // 5 or 10 seconds
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    
    // Check quota
    const hasQuota = await ctx.runQuery(api.subscriptions.checkQuota, {
      organizationId: identity.org_id,
      quotaType: 'video_generations',
    });
    
    if (!hasQuota) {
      throw new Error('Video generation quota exceeded.');
    }
    
    // Update scene status
    await ctx.runMutation(api.scenes.updateStatus, {
      sceneId: args.sceneId,
      status: 'generating',
    });
    
    try {
      // Call Runway API
      const response = await fetch('https://api.runwayml.com/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gen3-alpha-turbo',
          prompt: args.prompt,
          duration: args.duration,
        }),
      });
      
      const data = await response.json();
      const taskId = data.id;
      
      // Poll for completion (or use webhooks)
      const videoUrl = await pollRunwayTask(taskId);
      
      // Update scene with video URL
      await ctx.runMutation(api.scenes.update, {
        sceneId: args.sceneId,
        videoUrl,
        status: 'completed',
      });
      
      // Increment usage
      await ctx.runMutation(api.subscriptions.incrementUsage, {
        organizationId: identity.org_id,
        usageType: 'video_generations',
      });
      
      return videoUrl;
    } catch (error) {
      // Update scene status on error
      await ctx.runMutation(api.scenes.updateStatus, {
        sceneId: args.sceneId,
        status: 'failed',
      });
      
      throw error;
    }
  },
});
\`\`\`

### 4.4 AI Integration Best Practices

1. **Error Handling**: Gracefully handle API failures
2. **Rate Limiting**: Respect AI service rate limits
3. **Retry Logic**: Implement exponential backoff for transient failures
4. **Monitoring**: Track AI usage and costs per organization
5. **Caching**: Cache responses to reduce costs
6. **Fallbacks**: Have backup AI services for critical features
7. **User Feedback**: Show progress and estimated completion time

---

## 5. Database Schema Design Principles

### 5.1 Multi-Tenancy (Organization Isolation)

**Every organization-scoped table MUST include**:
\`\`\`typescript
{
  organizationId: v.string(), // Clerk organization ID
  // ... other fields
}
\`\`\`

**Index requirement**:
\`\`\`typescript
.index('by_organization', ['organizationId'])
.index('by_organization_and_user', ['organizationId', 'userId'])
\`\`\`

### 5.2 Core Tables for MyShortReel

#### Projects Table
\`\`\`typescript
projects: defineTable({
  organizationId: v.string(),
  name: v.string(),
  occasion: v.string(), // 'wedding', 'birthday', 'anniversary', etc.
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
  duration: v.number(), // Total video duration in seconds
  status: v.union(
    v.literal('draft'),
    v.literal('in-progress'),
    v.literal('generating'),
    v.literal('completed'),
    v.literal('failed')
  ),
  createdBy: v.string(), // User ID who created the project
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_organization', ['organizationId'])
  .index('by_organization_and_status', ['organizationId', 'status'])
  .index('by_created_by', ['createdBy']),
\`\`\`

#### Scenes Table
\`\`\`typescript
scenes: defineTable({
  projectId: v.id('projects'),
  organizationId: v.string(), // Denormalized for faster queries
  sceneNumber: v.number(),
  title: v.string(),
  description: v.string(),
  duration: v.number(),
  startFrame: v.optional(v.string()), // Asset ID for start frame
  endFrame: v.optional(v.string()), // Asset ID for end frame
  cinematicStyles: v.optional(v.object({
    ambiance: v.optional(v.string()),
    cameraMovement: v.optional(v.string()),
    colorTone: v.optional(v.string()),
    visualStyle: v.optional(v.string()),
  })),
  videoUrl: v.optional(v.string()), // Generated video URL
  status: v.union(
    v.literal('draft'),
    v.literal('generating'),
    v.literal('completed'),
    v.literal('failed')
  ),
  aiProvider: v.optional(v.union(
    v.literal('runway'),
    v.literal('kling')
  )),
  generationCost: v.optional(v.number()), // Track cost per scene
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_project', ['projectId'])
  .index('by_organization', ['organizationId'])
  .index('by_status', ['status']),
\`\`\`

#### Assets Table
\`\`\`typescript
assets: defineTable({
  organizationId: v.string(),
  projectId: v.optional(v.id('projects')),
  type: v.union(v.literal('image'), v.literal('video')),
  url: v.string(), // Convex file storage URL
  storageId: v.string(), // Convex storage ID
  filename: v.string(),
  size: v.number(),
  mimeType: v.string(),
  uploadedBy: v.string(), // User ID
  uploadedAt: v.number(),
})
  .index('by_organization', ['organizationId'])
  .index('by_project', ['projectId'])
  .index('by_uploaded_by', ['uploadedBy']),
\`\`\`

#### AI Generation History Table
\`\`\`typescript
aiGenerations: defineTable({
  organizationId: v.string(),
  projectId: v.optional(v.id('projects')),
  sceneId: v.optional(v.id('scenes')),
  type: v.union(
    v.literal('scene_description'),
    v.literal('video_generation'),
    v.literal('script_writing')
  ),
  provider: v.union(
    v.literal('openai'),
    v.literal('runway'),
    v.literal('kling')
  ),
  prompt: v.string(),
  response: v.optional(v.string()),
  cost: v.number(), // Estimated cost in USD
  status: v.union(
    v.literal('pending'),
    v.literal('completed'),
    v.literal('failed')
  ),
  errorMessage: v.optional(v.string()),
  createdBy: v.string(), // User ID
  createdAt: v.number(),
})
  .index('by_organization', ['organizationId'])
  .index('by_project', ['projectId'])
  .index('by_created_at', ['createdAt']),
\`\`\`

#### Subscriptions Table
\`\`\`typescript
subscriptions: defineTable({
  organizationId: v.string(),
  polarSubscriptionId: v.string(),
  polarCustomerId: v.string(),
  planId: v.string(),
  status: v.union(
    v.literal('active'),
    v.literal('canceled'),
    v.literal('past_due'),
    v.literal('trialing')
  ),
  userCount: v.number(),
  currentPeriodStart: v.number(),
  currentPeriodEnd: v.number(),
  cancelAtPeriodEnd: v.boolean(),
  trialEnd: v.optional(v.number()),
  benefits: v.object({
    maxProjects: v.number(), // -1 for unlimited
    maxScenes: v.number(),
    maxAIGenerations: v.number(),
    maxStorageGB: v.number(),
    customBranding: v.boolean(),
    prioritySupport: v.boolean(),
  }),
  usage: v.object({
    projectsCreated: v.number(),
    aiGenerationsUsed: v.number(),
    storageUsedGB: v.number(),
    lastResetAt: v.number(), // Monthly reset
  }),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_organization', ['organizationId'])
  .index('by_polar_subscription', ['polarSubscriptionId'])
  .index('by_status', ['status']),
\`\`\`

### 5.3 Data Access Patterns

**Always filter by organization**:
\`\`\`typescript
// ✅ CORRECT - Organization isolation
const projects = await ctx.db
  .query('projects')
  .withIndex('by_organization', (q) => q.eq('organizationId', orgId))
  .collect();

// ❌ WRONG - No tenant isolation (security vulnerability)
const projects = await ctx.db
  .query('projects')
  .collect();
\`\`\`

### 5.4 Permission Checks

**Server-side validation pattern**:
\`\`\`typescript
// 1. Check authentication
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error('Unauthenticated');

// 2. Check organization membership
if (resource.organizationId !== identity.org_id) {
  throw new Error('Unauthorized - Resource belongs to different organization');
}

// 3. Check admin role (only for sensitive operations)
if (requiresAdmin && identity.org_role !== 'org:admin') {
  throw new Error('Admin access required');
}

// 4. Check subscription/quota
const hasAccess = await checkFeatureAccess(ctx, identity.org_id, 'feature_name');
if (!hasAccess) {
  throw new Error('Feature not available in your plan');
}
\`\`\`

---

## 6. Key Findings & Recommendations

### 6.1 Critical Decisions (MVP)

1. **Multi-tenancy model**: Organization-based (couples, agencies, teams)
2. **Auth provider**: Clerk with Organizations (admin/member roles)
3. **Database**: Convex with organization-scoped indexes
4. **Payments**: Polar.sh with per-user pricing
5. **AI services**: OpenAI + Runway + Kling with quota management
6. **File storage**: Convex file storage for assets

### 6.2 Custom JWT Claims Required

Add to Clerk JWT template (in the "Claims" section):
\`\`\`json
{
  "org_id": "{{org.id}}",
  "org_role": "{{org.role}}",
  "org_slug": "{{org.slug}}"
}
\`\`\`

**Note**: The default claims (`aud`, `sub`, `name`, `email`) are already configured in the Convex template.

### 6.3 Environment Variables Required

\`\`\`bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
CLERK_JWT_ISSUER_DOMAIN=https://xxx.clerk.accounts.dev  # Frontend API URL
CLERK_WEBHOOK_SECRET=whsec_xxx

# Convex
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
CONVEX_DEPLOY_KEY=xxx

# Polar.sh
POLAR_ACCESS_TOKEN=polar_xxx
POLAR_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=org_xxx

# AI Services
OPENAI_API_KEY=sk-xxx
RUNWAY_API_KEY=rw_xxx
REPLICATE_API_TOKEN=r8_xxx

# Optional
NEXT_PUBLIC_APP_URL=https://myshortreel.com
\`\`\`

**Important Notes**:
- `CLERK_JWT_ISSUER_DOMAIN` must be set in both `.env.local` AND Convex Dashboard
- `convex/auth.config.js` must be `.js` file, not `.ts`
- JWT template in Clerk MUST be named `convex` (do not rename)
- Use `useConvexAuth()` hook in React components, not Clerk's `useAuth()`

### 6.4 Implementation Order

1. **Phase 0**: ✅ Documentation review (DONE)
2. **Phase 1**: Clerk + Convex setup (auth-implementation-plan.md)
3. **Phase 2**: Database schema + core queries/mutations (convex-implementation-plan.md)
4. **Phase 3**: AI services integration (ai-models-implementation-plan.md)
5. **Phase 4**: Polar.sh billing integration
6. **Phase 5**: File storage + optimization
7. **Phase 6**: Testing + deployment

### 6.5 Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data leakage between orgs | **CRITICAL** | Mandatory `organizationId` filtering, comprehensive testing, security audit |
| Permission bypass | **HIGH** | Server-side validation, JWT claim verification, role checks |
| AI cost overruns | **HIGH** | Quota management, cost tracking, usage alerts, caching |
| Webhook replay attacks | **MEDIUM** | Signature verification, idempotency keys, event deduplication |
| Migration data loss | **HIGH** | Backup sessionStorage, gradual migration, rollback plan |
| Performance with large orgs | **MEDIUM** | Proper indexing, pagination, caching, query optimization |
| AI service downtime | **MEDIUM** | Fallback providers, retry logic, graceful degradation |
| Subscription sync issues | **MEDIUM** | Webhook retry logic, manual sync endpoint, audit logging |

---

## 7. Security Checklist

### 7.1 Authentication & Authorization
- [ ] All Convex functions check `ctx.auth.getUserIdentity()`
- [ ] All queries filter by `organizationId`
- [ ] Admin-only operations verify `org_role === 'org:admin'`
- [ ] JWT tokens properly validated by Convex
- [ ] No client-side auth bypass possible
- [ ] Session management handled by Clerk

### 7.2 Data Isolation
- [ ] Every table has `organizationId` field
- [ ] All queries use `by_organization` index
- [ ] No cross-organization data access
- [ ] User can only access their active organization's data
- [ ] Organization switching properly updates context

### 7.3 API Security
- [ ] Webhook signatures verified (Polar, Clerk)
- [ ] Rate limiting implemented (Convex handles this)
- [ ] CORS configured correctly
- [ ] Environment variables secured
- [ ] No sensitive data in client-side code
- [ ] API keys stored server-side only

### 7.4 Payment Security
- [ ] Billing only accessible to admins
- [ ] Subscription status checked before feature access
- [ ] Quota limits enforced server-side
- [ ] Payment webhooks properly authenticated
- [ ] Subscription data encrypted at rest

### 7.5 AI Security
- [ ] AI API keys stored server-side
- [ ] Quota checks before AI calls
- [ ] User input sanitized before AI prompts
- [ ] AI responses validated before storage
- [ ] Cost tracking per organization

---

## 8. Testing Strategy

### 8.1 Multi-Tenancy Testing
- [ ] Create multiple organizations
- [ ] Verify data isolation between orgs
- [ ] Test organization switching
- [ ] Verify user can't access other org's data
- [ ] Test admin vs member permissions

### 8.2 Authentication Testing
- [ ] Sign up with email
- [ ] Sign up with Google/Facebook
- [ ] Sign in with email
- [ ] Sign in with social providers
- [ ] Sign out and verify session cleared
- [ ] Test protected route redirects

### 8.3 Subscription Testing
- [ ] Subscribe to plan
- [ ] Add user to organization (verify billing update)
- [ ] Remove user from organization (verify credit)
- [ ] Upgrade/downgrade plan
- [ ] Cancel subscription
- [ ] Test quota enforcement

### 8.4 AI Integration Testing
- [ ] Generate scene description
- [ ] Generate video with Runway
- [ ] Generate video with Kling
- [ ] Test quota limits
- [ ] Test error handling
- [ ] Test cost tracking

### 8.5 End-to-End Testing
- [ ] Complete video creation flow (step 1-6)
- [ ] Invite user to organization
- [ ] Collaborate on project
- [ ] Generate multiple scenes
- [ ] Export final video
- [ ] Verify all data persisted

---

## 9. Performance Optimization

### 9.1 Database Optimization
- [ ] Create indexes on all query patterns
- [ ] Use pagination for large lists
- [ ] Implement query caching
- [ ] Denormalize data where appropriate
- [ ] Monitor query performance

### 9.2 AI Optimization
- [ ] Cache AI responses
- [ ] Batch AI requests where possible
- [ ] Use cheaper models for simple tasks
- [ ] Implement request queuing
- [ ] Monitor AI costs per organization

### 9.3 Frontend Optimization
- [ ] Implement optimistic updates
- [ ] Use React Query for caching
- [ ] Lazy load components
- [ ] Optimize image/video loading
- [ ] Implement skeleton loaders

---

## 10. Monitoring & Observability

### 10.1 Metrics to Track
- [ ] User sign-ups per day
- [ ] Active organizations
- [ ] Projects created per organization
- [ ] AI generations per organization
- [ ] AI costs per organization
- [ ] Subscription churn rate
- [ ] Average video completion time
- [ ] Error rates per feature

### 10.2 Alerts to Set Up
- [ ] AI cost exceeds threshold
- [ ] Webhook failures
- [ ] Payment failures
- [ ] High error rates
- [ ] Slow query performance
- [ ] Storage quota exceeded

---

## 11. Next Steps

### Immediate Actions (Phase 1)

1. ✅ Create Clerk account and application
2. ✅ Enable Organizations in Clerk Dashboard
3. ✅ Create JWT template with name `convex` (do NOT rename)
4. ✅ Add custom claims (`org_id`, `org_role`, `org_slug`) to JWT template
5. ✅ Copy Issuer URL (Frontend API URL)
6. ✅ Set up environment variables in `.env.local`
7. ✅ Initialize Convex project (`npx convex dev`)
8. ✅ Create `convex/auth.config.js` (must be .js, not .ts)
9. ✅ Configure `CLERK_JWT_ISSUER_DOMAIN` in Convex Dashboard
10. ✅ Create `app/ConvexClientProvider.tsx` (Client Component)
11. ✅ Update `app/layout.tsx` to use ConvexClientProvider
12. ✅ Test authentication flow with `useConvexAuth()` hook
13. ✅ Create Polar.sh account
14. ✅ Set up Polar products and pricing

### Documentation to Create

1. **Database Schema Document**: Complete table definitions with indexes
2. **API Reference**: Convex queries/mutations documentation
3. **Migration Guide**: sessionStorage → Convex migration steps
4. **Testing Plan**: Multi-tenancy and permission testing scenarios
5. **Deployment Guide**: Production deployment checklist

---

## 12. Conclusion

This documentation review has established the foundation for implementing:
- **Clerk Organizations** for multi-tenant video creation (couples, agencies, teams)
- **Convex backend** with real-time data sync and organization isolation
- **Polar.sh billing** with per-user subscription pricing
- **AI services** (OpenAI, Runway, Kling) with quota management
- **Security best practices** for multi-tenancy and data isolation

**Key Principles**:
- Organization-scoped data isolation (security first)
- Simple admin/member roles (no over-engineering)
- Per-user pricing (predictable billing)
- Quota-based AI usage (cost control)
- Real-time collaboration (Convex reactive queries)

**Status**: ✅ Phase 0 COMPLETED  
**Time Spent**: 3 hours  
**Next Phase**: Phase 1 - Clerk + Convex Setup (auth-implementation-plan.md)

---

**End of Phase 0 Documentation Analysis**

*This document serves as the foundation for all implementation phases. Refer back to this document when making architectural decisions or implementing features.*
