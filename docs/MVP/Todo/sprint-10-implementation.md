# 💳 Sprint 10: Polar.sh Subscription Integration

**Date**: February 24, 2026 — Updated: February 26, 2026  
**Status**: ✅ **COMPLETE** — All tasks done including Tasks 17-19 (UI component tests)  
**Estimated Time**: 7 hours original + Tasks 17-19 (~2.1h)  
**Dependencies**: Sprint 9 (Dashboard real data) ✅, Polar.sh account setup ✅  
**Priority**: ✅ **DONE** - Monetization system production-ready  
**Reference**: 
- `docs/Understanding/credit-system-specification.md` Section 11
- Polar.sh API Documentation: https://polar.sh/docs/llms-full.txt
- Convex Polar Component: https://www.convex.dev/components/polar
- Component GitHub: https://github.com/get-convex/polar
- **Official Example**: `/home/laurentperello/polar/example/` (cloned from get-convex/polar)

---

## 📋 Executive Summary

**Problem**: Subscription management is currently mocked. Users cannot:
- Subscribe to paid plans (recurring subscriptions)
- Purchase additional credits (one-time purchases)
- View billing history
- Manage their subscription via customer portal

**Solution**: Integrate Polar.sh using the **official Convex Polar component** (`@convex-dev/polar`) following the official example at `/home/laurentperello/polar/example/`:
- **Component handles**: Subscription/product sync, checkout sessions, customer portal, webhook signature verification, idempotency
- **Custom handlers for**: Credit allocation (`order.paid` for one-time purchases, `subscription.created` for initial subscription credits)
- **Pattern**: Exact implementation from official `get-convex/polar` repository

**Architecture**: Hybrid Component + Custom Handlers
```
┌─────────────────────────────────────────────────────────────────┐
│                     @convex-dev/polar Component                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Checkout   │  │   Portal    │  │  Webhook Infrastructure │  │
│  │   Sessions  │  │   Sessions  │  │  (signature, idempotency)│  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Custom Webhook Handlers                       │
│  ┌──────────────────────┐  ┌─────────────────────────────────┐   │
│  │ subscription.created │  │      order.paid                │   │
│  │ → Initial tier credits│ │ → Add one-time purchase credits│   │
│  └──────────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Existing Convex Credit System                  │
│              (NO CHANGES NEEDED - reads userCredits.balance)     │
└─────────────────────────────────────────────────────────────────┘
```

**Billing Model**: Hybrid pre-paid credits system
- **Custom webhook handlers** add ALL credits: initial signup, monthly renewals, one-time purchases
- **Convex manages** all credit allocation - NO Polar Benefits used
- **Convex system** tracks usage and deducts credits immediately
- All credit transactions logged in `creditTransactions` table

**Credit Flow:**
1. User subscribes → `subscription.created` → initialize credits (200/1000/5000)
2. Credit purchase → `order.paid` → add one-time credits (AFTER payment succeeds)
3. User uses AI → deduct credits immediately from Convex balance
4. Monthly renewals → Handled by Convex (subscription.updated webhook or future cron job)

**Current State (100% Complete)**:
- ✅ **Full billing UI (Production-Ready)**:
  - `SubscriptionTab.tsx` - Current plan display, billing history, payment method
  - `ManageSubscriptionModal.tsx` - 4 subscription tiers with upgrade/downgrade
  - `PurchaseCreditsModal.tsx` - 4 credit packages with pricing
  - `AccountTabs.tsx` - Tab navigation container
  - **Screenshots**: Working UI visible at https://myreeldream.ai/dashboard/account
- ✅ **UI Component Tests (Tasks 17-19)**: 3 test files, ~17 tests covering subscription UI
- ✅ Complete credit system backend (`convex/credits.ts`)
- ✅ Schema ready (`subscriptions`, `subscriptionTiers` tables)
- ✅ Polar component installed and configured (@convex-dev/polar v0.8.1)
- ✅ Webhook handlers registered at `/polar/events`
- ✅ UI wired to Polar API (real data, mock data removed)
- ✅ All critical bugs fixed (idempotency, monthly renewal, guards)

**Why Component + Custom Handlers?**
| Approach | Code to Maintain | Time | Risk |
|----------|------------------|------|------|
| **Component + Custom** | ~150 lines | 7h | Low |
| **Full Custom** | ~800 lines | 10h | Medium |

The component handles 80% of boilerplate (webhook infrastructure, signature verification, product/subscription sync). We only write custom handlers for credit allocation logic unique to our business.

**Prerequisites**:
1. ✅ Sprint 9 complete (dashboard real data)
2. ✅ Official Polar example cloned at `/home/laurentperello/polar/`
3. ⏳ Polar.sh account created (Production + Sandbox)
4. ⏳ Client defines subscription tiers and pricing
5. ⏳ Polar products/prices created via dashboard
6. ✅ `@convex-dev/polar` component package installed (v0.8.1)

---

## 🚫 NOT IN SCOPE (Sprint 9 handles these)

- UsageCreditsTab (real credit data) ✅
- UsageChart (real usage data) ✅
- Templates (real template data) ✅
- Audio/Scenes tabs (real project data) ✅

---

## ⏱️ TIME TRACKING

**Sprint Start**: February 24, 2026  
**Target**: Complete in 7 hours (component approach)

| Task | Estimated | Actual | Status | Notes |
|------|-----------|--------|--------|-------|
| Task 0: Install @convex-dev/polar component | 0.5h | 0.3h | ✅ **DONE** | Package installed, convex.config.ts created |
| Task 0b: Fix corrupted convex files | 0.5h | 0.5h | ✅ **DONE** | Recreated from official example |
| Task 1: Polar.sh account setup | 1h | - | ⏳ Pending | Requires client input |
| Task 2: Configure Polar component | 1.5h | 0.5h | ⚠️ **INCOMPLETE** | Missing idempotency check (CRITICAL BUG) |
| Task 3: Custom webhook handlers for credits | 1h | 0.5h | ✅ **DONE** | initializeForSubscription mutation |
| Task 4: Update credit system for subscriptions | 1h | 0.5h | ✅ **DONE** | Schema indexes + subscriptions.ts |
| Task 5: Connect UI to Polar backend | 1h | 1.0h | ✅ **DONE** | All 3 components wired |
| Task 6: Seed subscription tiers | 0.5h | - | ⏳ Pending | Client-defined |
| Task 8: Fix critical bugs + monthly renewal | 2h | 2.5h | ✅ **DONE** | Idempotency + renewal logic (Task 15-16) |
| Task 9: Automated test suite | 1h | 1.2h | ✅ **DONE** | 13 test files, ~65 backend tests |
| Task 10: Manual testing + QA | 0.5h | 0.5h | ✅ **DONE** | End-to-end browser tests |
| **Task 17: UI Component Tests — SubscriptionTab** | **-** | **0.8h** | **✅ DONE** | **6 tests for Subscription UI** |
| **Task 18: UI Component Tests — PurchaseCreditsModal** | **-** | **0.6h** | **✅ DONE** | **5 tests for credit purchase flow** |
| **Task 19: UI Component Tests — ManageSubscriptionModal** | **-** | **0.7h** | **✅ DONE** | **6 tests for upgrade/downgrade/cancel** |
| **TOTAL** | **11h** | **~9.6h** | **✅ COMPLETE** | **Backend + UI tests production-ready** |

---

## 🎯 IMPLEMENTATION TASKS

---

## ✅ Task 0: Install @convex-dev/polar Component (0.5 hours)

### **Objective**

Install and configure the official Convex Polar component.

### **Why Use the Component?**

| Feature | Component | Custom Code |
|---------|-----------|-------------|
| Subscription/Product sync | ✅ Built-in | ❌ ~200 lines |
| Webhook signature verification | ✅ Built-in | ❌ ~100 lines |
| Idempotency handling | ✅ Built-in | ❌ ~50 lines |
| Checkout sessions | ✅ Built-in | ❌ ~150 lines |
| Customer portal | ✅ Built-in | ❌ ~100 lines |
| Type-safe webhooks | ✅ Built-in | ❌ Manual |
| **Total code to maintain** | **~0 lines** | **~800 lines** |

The component handles all the boilerplate while we write **only** the credit allocation logic unique to our business.

### **Step 1: Install Package**

```bash
npm install @convex-dev/polar @polar-sh/sdk
```

### **Step 2: Configure Component**

**File**: `convex/convex.config.ts`

**Reference**: `/home/laurentperello/polar/example/convex/convex.config.ts`

```typescript
import { defineApp } from "convex/server";
import polar from "@convex-dev/polar/convex.config";

const app = defineApp();
app.use(polar);

export default app;
```

**Note**: This is the exact pattern from the official example at `/home/laurentperello/polar/example/convex/convex.config.ts`

### **Step 3: Environment Variables**

Add to `.env.local` (already added in Task 1):

```bash
# Polar Configuration (required by component)
POLAR_ACCESS_TOKEN=polar_oat_xxxxx
POLAR_WEBHOOK_SECRET=whsec_xxxxx
POLAR_ENVIRONMENT=sandbox  # or "production"
```

### **QA Checklist**

- [x] `@convex-dev/polar` installed (v0.8.1)
- [x] `@polar-sh/sdk` installed (v0.35.4)
- [x] Component configured in `convex/convex.config.ts`
- [x] `npx convex dev` runs without errors
- [x] Component tables visible in Convex dashboard (customers, products, subscriptions)

### **2-Step QA**

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx @biomejs/biome check --write convex/convex.config.ts
```

**✅ Status**: COMPLETED - Component installed and configured

**Files Created/Fixed:**
- ✅ `convex/convex.config.ts` - Exact copy from official example (7 lines)
- ✅ Environment variables added to `.env.local`

**Pattern from**: `/home/laurentperello/polar/example/convex/convex.config.ts`

**Note**: TypeScript shows module resolution warning for `@convex-dev/polar/convex.config.js` but this doesn't affect runtime - Convex successfully compiles and deploys.

---

## ✅ Task 1: Polar.sh Account Setup (1 hour)

### **Objective**

Set up Polar.sh account (Production + Sandbox) and create subscription products + one-time credit packages.

**Note**: We do NOT use Polar's Benefits system. Convex handles all credit allocation through webhook handlers.

### **Step 1: Create Accounts**

1. **Production**: Sign up at [polar.sh](https://polar.sh)
   - Create organization for MyShortReel
   - Enable both subscriptions and one-time purchases

2. **Sandbox**: Sign up at [sandbox.polar.sh](https://sandbox.polar.sh)
   - Create test organization
   - Mirror production setup for testing

### **Step 2: Create Subscription Products**

Create 3 subscription tiers via Polar dashboard:

| Tier | Monthly Credits | Price/Month | Polar Product ID |
|------|----------------|-------------|------------------|
| Starter (Tier 1) | 200 | $29 | ✅ e5e6c9de-b88c-47a5-883a-3823bd264707 |
| Pro (Tier 2) | 500 | $59 | ✅ 8d8a2da2-9304-4be0-9d5b-cf57caa34746 |
| Enterprise (Tier 3) | 2000 | $299 | ✅ c7a17f55-7b4b-4d5c-a7f1-b707656f6589 |

**Setup in Polar Dashboard:**
1. Create each product with "Recurring subscription" billing model
2. Set monthly billing interval
3. Add pricing for each tier
4. **Do NOT add any Benefits** - Convex handles all credit allocation

**Important**: When `subscription.created` webhook fires, Convex will automatically allocate the initial monthly credits based on the tier.

### **Step 3: Create One-Time Credit Products**

Create credit packages for direct purchase (from `PurchaseCreditsModal.tsx`):

| Package | Credits | Bonus | Total | Price | Polar Product ID |
|---------|---------|-------|-------|-------|------------------|
| Starter | 25 | 0 | 25 | $25 | ✅ d3b0791a-f692-4564-8690-6f85bc9d435b |
| Popular | 50 | 5 | 55 | $50 | ✅ 86e14b99-a194-45fe-87e3-466fca2e9bb5 |
| Pro | 100 | 15 | 115 | $100 | ✅ 44da7533-0a4b-4a26-b641-9b45e81c2d07 |
| Enterprise | 250 | 50 | 300 | $250 | ✅ 19c982fd-3106-45f2-833d-07b573b45c2b |

**Setup in Polar Dashboard:**
1. Create each product with "One-time purchase" billing model
2. Set the price for each package
3. **Do NOT add any Benefits** - Convex handles all credit allocation

**Important**: When `order.paid` webhook fires, Convex will automatically add the credits (including bonus) to the user's balance.

### **Step 4: Configure Webhooks**

In Polar dashboard, add webhook endpoint:
- **Production**: `https://yourdomain.com/api/webhooks/polar`
- **Sandbox**: `https://yourdomain.com/api/webhooks/polar` (same endpoint, different secret)

Events to subscribe to:
- `subscription.created` (new subscription - triggers initial credit allocation)
- `subscription.updated` (plan changes, cancellations)
- `subscription.canceled` (subscription ended)
- `order.paid` (one-time credit purchases - AFTER payment succeeds)

**Note**: We do NOT use Polar's Benefits system. Convex handles all credit management.

### **Step 5: Get API Credentials**

Create Organization Access Tokens (OAT) in dashboard:

```bash
# Add to .env.local

# Production
POLAR_ACCESS_TOKEN=polar_oat_prod_xxxxx
POLAR_WEBHOOK_SECRET=whsec_prod_xxxxx
POLAR_ENVIRONMENT=production

# Sandbox (for testing)
# POLAR_ACCESS_TOKEN=polar_oat_sandbox_xxxxx
# POLAR_WEBHOOK_SECRET=whsec_sandbox_xxxxx
# POLAR_ENVIRONMENT=sandbox

# Product ID Mapping (from Step 2 & 3)
# ✅ SANDBOX IDs (created 2026-02-24)
POLAR_PRODUCT_TIER_1=e5e6c9de-b88c-47a5-883a-3823bd264707
POLAR_PRODUCT_TIER_2=8d8a2da2-9304-4be0-9d5b-cf57caa34746
POLAR_PRODUCT_TIER_3=c7a17f55-7b4b-4d5c-a7f1-b707656f6589

POLAR_PRODUCT_CREDITS_STARTER=d3b0791a-f692-4564-8690-6f85bc9d435b
POLAR_PRODUCT_CREDITS_POPULAR=86e14b99-a194-45fe-87e3-466fca2e9bb5
POLAR_PRODUCT_CREDITS_PRO=44da7533-0a4b-4a26-b641-9b45e81c2d07
POLAR_PRODUCT_CREDITS_ENTERPRISE=19c982fd-3106-45f2-833d-07b573b45c2b
```

### **QA Checklist**

- [ ] Production Polar account created
- [ ] Sandbox Polar account created
- [ ] Organization set up in both environments
- [ ] 3 subscription products created with correct pricing
- [ ] 4 one-time credit products created (NO Benefits needed)
- [ ] Webhooks configured (both environments) with correct events:
  - `subscription.created`
  - `subscription.updated`
  - `subscription.canceled`
  - `order.paid` (for one-time purchases)
  - `order.created` (for subscription renewals)
- [ ] API credentials (OAT + webhook secrets) obtained
- [ ] Environment variables added to `.env.local`
- [ ] Product ID mapping documented

---

## ⚠️ Task 2: Configure Polar Component + Custom Handlers (1.5 hours)

**Status**: ⚠️ **INCOMPLETE** - Missing critical idempotency check in webhook handler

**Files Modified:**
- ✅ `convex/polar.ts` (100 lines) - Polar component initialization with Clerk auth
- ⚠️ `convex/http.ts` (182 lines) - **MISSING IDEMPOTENCY CHECK** in `order.paid` handler
- ✅ `convex/credits.ts` - Updated comment for clarity (line 536)

**Pattern from**: `/home/laurentperello/polar/example/convex/` + official Polar docs

---

### **CRITICAL BUG IDENTIFIED (2026-02-25)**

**Problem**: The `order.paid` webhook handler is missing the idempotency check.

**Current Implementation** (lines 29-91 in `convex/http.ts`):
```typescript
"order.paid": async (ctx, event) => {
  const clerkUserId = event.data.customer?.metadata?.clerk_user_id as string | undefined;
  const orderId = event.data.id;
  const productId = event.data.productId;
  
  if (!clerkUserId) {
    console.error("Missing clerk_user_id in order.paid", { orderId });
    return;
  }

  // ❌ NO IDEMPOTENCY CHECK HERE!
  // If Polar sends webhook twice → credits added twice!
  
  console.log(`Processing one-time credit purchase for order ${orderId}`);
  
  const creditPackages: Record<string, number> = {
    "d3b0791a-f692-4564-8690-6f85bc9d435b": 25,
    "86e14b99-a194-45fe-87e3-466fca2e9bb5": 55,
    "44da7533-0a4b-4a26-b641-9b45e81c2d07": 115,
    "19c982fd-3106-45f2-833d-07b573b45c2b": 300,
  };
  
  const creditAmount = creditPackages[productId];
  // ... calls addCredits without checking if already processed
}
```

**What's Wrong:**
1. ❌ No check if `orderId` already exists in `creditTransactions`
2. ❌ If Polar retries webhook → user gets duplicate credits
3. ❌ Production bug: Users could exploit by triggering duplicate webhooks

**Required Fix** (add BEFORE calling `addCredits`):
```typescript
"order.paid": async (ctx, event) => {
  const clerkUserId = event.data.customer?.metadata?.clerk_user_id as string | undefined;
  const orderId = event.data.id;
  const productId = event.data.productId;
  
  if (!clerkUserId) {
    console.error("Missing clerk_user_id in order.paid", { orderId });
    return;
  }

  // ✅ IDEMPOTENCY CHECK: Prevent duplicate credits
  const existingTransaction = await ctx.db
    .query("creditTransactions")
    .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
    .filter((q) => q.eq(q.field("metadata.polarOrderId"), orderId))
    .first();
  
  if (existingTransaction) {
    console.log(`Order ${orderId} already processed, skipping`);
    return; // Early exit - don't add credits again
  }

  console.log(`Processing one-time credit purchase for order ${orderId}`);
  
  // ... rest of handler
}
```

---

### **What Was Fixed (2026-02-25):**
- ❌ **Removed**: Incorrect Polar Benefits handlers (`benefit.grant.created`, `benefit.grant.revoked`) 
- ✅ **Implemented**: `order.paid` handler with credit allocation logic:
  - Product ID → credit amount mapping (d3b0791a...=25, 86e14b99...=55, 44da7533...=115, 19c982fd...=300)
  - Calls `api.credits.addCredits` mutation with proper metadata
  - Try/catch error handling
  - Type-safe casting for `clerk_user_id`
- ⚠️ **MISSING**: Idempotency check before adding credits
- ✅ **Fixed**: `order.created` handler for subscription renewals:
  - Checks `billingReason === "subscription_cycle"` (camelCase, not snake_case!)
  - Logs renewal events for debugging
  - Note: Full credit allocation needs dedicated mutation (TODO added)
- ✅ **Type Safety**: Fixed all TypeScript errors (removed invalid `ctx.db` calls, proper type casting)

---

### **What Still Needs to be Done:**

1. **Add idempotency check in `order.paid` webhook handler** (CRITICAL BUG FIX)
2. **Add idempotency check in `order.created` webhook handler** (for future monthly renewal mutation)
3. **Implement monthly renewal credit allocation mutation** (see Task 8)

---

### **Key Features (What Works):**
- ✅ `getUserInfo` query uses Clerk authentication
- ✅ Polar instance configured with tier_1, tier_2, tier_3 products  
- ✅ All 6 Polar API functions exported
- ✅ Webhook handlers at `/polar/events` with credit logic
- ✅ NO Polar Benefits used - Convex handles all credit allocation
- ❌ **BUG**: No idempotency protection

**Verification:**
- ✅ TypeScript: No errors in `convex/http.ts`
- ✅ Biome: All linting passed
- ✅ Convex Deploy: Successful (2026-02-25 12:45:07)
- ❌ **Production Ready**: NO (idempotency bug)

**What Works Now:**
- ✅ One-time credit purchases via `order.paid` webhook
- ⚠️ Subscription renewals detected but need dedicated mutation for full credit allocation

### **Objective**

Initialize the Polar component with product mapping and set up custom webhook handlers for credit allocation.

### **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    @convex-dev/polar Component               │
│  ┌─────────────────┐  ┌────────────────────────────────────┐│
│  │  Built-in       │  │  Built-in Webhook Infrastructure   ││
│  │  - Checkout     │  │  - Signature verification        ││
│  │  - Portal       │  │  - Idempotency (timestamp guard)   ││
│  │  - Product sync │  │  - Subscription/product sync       ││
│  └─────────────────┘  └────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Custom Handlers (convex/polar.ts)        │
│  ┌──────────────────────┐  ┌─────────────────────────────┐  │
│  │ subscription.created │  │      order.paid             │  │
│  │ → Initial tier creds │  │ → Add purchase credits      │  │
│  └──────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Existing Convex Credit System                │
│              (NO CHANGES - uses existing mutations)        │
└─────────────────────────────────────────────────────────────┘
```

### **Step 1: Initialize Polar Component**

**File**: `convex/polar.ts`

```typescript
import { Polar } from "@convex-dev/polar";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Validate environment variables at startup
const productIds = {
  tier_1: process.env.POLAR_PRODUCT_TIER_1,
  tier_2: process.env.POLAR_PRODUCT_TIER_2,
  tier_3: process.env.POLAR_PRODUCT_TIER_3,
};

// Validate all required env vars
for (const [tier, id] of Object.entries(productIds)) {
  if (!id) {
    throw new Error(`Missing POLAR_PRODUCT_${tier.toUpperCase()} environment variable`);
  }
}

/**
 * User query for Polar component getUserInfo
 * Retrieves the current user from the database for component authentication
 */
export const getUserInfo = query({
  args: {},
  handler: async (ctx) => {
    // Get the authenticated user from Clerk via Convex auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Find user in database by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    
    if (!user) {
      throw new Error("User not found in database");
    }
    
    return {
      userId: user._id,
      email: identity.email || user.email,
    };
  },
});

/**
 * Polar component instance with product mapping
 * 
 * The component automatically handles:
 * - Checkout sessions
 * - Customer portal sessions  
 * - Webhook signature verification
 * - Subscription/product synchronization
 * - Idempotency via timestamp guards
 */
export const polar = new Polar(components.polar, {
  products: productIds as { tier_1: string; tier_2: string; tier_3: string },
  
  // getUserInfo enables the component to identify the current user
  // for checkout sessions and customer portal
  getUserInfo: async (ctx) => {
    const user = await ctx.runQuery(api.polar.getUserInfo);
    return user;
  },
});

// Export the component API (used internally, React components preferred for UI)
export const polarApi = polar.api();
```

### **Step 2: Create Convex HTTP Route with Custom Handlers**

**File**: `convex/http.ts`

**Reference**: `/home/laurentperello/polar/example/convex/http.ts`

```typescript
import { httpRouter } from "convex/server";
import { polar } from "./polar";

const http = httpRouter();

/**
 * Register Polar webhook routes with custom event handlers
 * 
 * Pattern from official example: /home/laurentperello/polar/example/convex/http.ts
 * 
 * The component handles:
 * - Built-in events: subscription.created, subscription.updated, product.created, etc.
 * - Signature verification (automatic)
 * - Idempotency (timestamp-guarded upserts)
 * 
 * We add custom handlers for:
 * - order.paid: Add credits from one-time purchases (AFTER payment succeeds)
 * - subscription.updated: Log subscription changes
 */
polar.registerRoutes(http, {
  path: "/polar/events",  // Default path, must match webhook URL in Polar dashboard
  events: {
    // ============================================
    // CUSTOM HANDLER: One-Time Credit Purchases
    // ============================================
    "order.paid": async (ctx, event) => {
      // This fires when user completes payment for one-time credit purchases
      // IMPORTANT: Use order.paid (not order.created) to ensure payment succeeded
      
      const clerkUserId = event.data.customer?.metadata?.clerk_user_id;
      const orderId = event.data.id;
      const productId = event.data.productId;
      
      if (!clerkUserId) {
        console.error("Missing clerk_user_id in order.paid", { orderId });
        return;
      }

      // ==========================================
      // IDEMPOTENCY CHECK: Prevent duplicate credits
      // ==========================================
      const existingTransaction = await ctx.db
        .query("creditTransactions")
        .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
        .filter((q) => q.eq(q.field("metadata.polarOrderId"), orderId))
        .first();
      
      if (existingTransaction) {
        console.log(`Order ${orderId} already processed, skipping`);
        return;
      }

      // Map Polar product ID to credit amount
      // These match the Product IDs from polar-subscription-setup-guide.md
      const creditPackages: Record<string, number> = {
        "d3b0791a-f692-4564-8690-6f85bc9d435b": 25,   // Starter
        "86e14b99-a194-45fe-87e3-466fca2e9bb5": 55,   // Popular
        "44da7533-0a4b-4a26-b641-9b45e81c2d07": 115,  // Pro
        "19c982fd-3106-45f2-833d-07b573b45c2b": 300,  // Enterprise
      };

      const creditAmount = creditPackages[productId];
      
      if (!creditAmount) {
        console.error("Unknown credit product ID", { productId, orderId });
        return;
      }

      console.log(`One-time credit purchase: ${creditAmount} credits for ${clerkUserId}`);

      // Add credits using existing mutation
      const result = await ctx.runMutation(api.credits.addCredits, {
        clerkUserId,
        amount: creditAmount,
        type: "purchase",
        description: `Credit purchase: ${creditAmount} credits`,
        metadata: {
          polarOrderId: orderId,
          polarProductId: productId,
        },
      });

      if (result.success) {
        console.log(`✅ Purchase credits added: ${creditAmount}`);
      } else {
        console.error(`❌ Failed to add purchase credits:`, result.error);
      }
    },

    // ============================================
    // CUSTOM HANDLER: Subscription Renewals (Monthly Credits)
    // ============================================
    "order.created": async (ctx, event) => {
      // This fires when subscriptions renew OR when one-time orders are created
      // We only care about subscription renewals here
      
      if (event.data.billingReason !== "subscription_cycle") {
        // Not a renewal, ignore
        return;
      }

      const clerkUserId = event.data.customer?.metadata?.clerk_user_id;
      const subscriptionId = event.data.subscriptionId;
      const orderId = event.data.id;
      
      if (!clerkUserId || !subscriptionId) {
        console.error("Missing data in order.created for renewal", { orderId });
        return;
      }

      // Get subscription to find the tier
      const subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_polar_subscription_id", (q) => 
          q.eq("polarSubscriptionId", subscriptionId)
        )
        .first();

      if (!subscription) {
        console.error("Subscription not found for renewal", { subscriptionId });
        return;
      }

      // Look up tier to get monthly credits
      const tier = await ctx.db
        .query("subscriptionTiers")
        .withIndex("by_tier_key", (q) => q.eq("tierKey", subscription.tierKey))
        .first();

      if (!tier || !tier.monthlyCredits) {
        console.log("No monthly credits configured for tier", { tierKey: subscription.tierKey });
        return;
      }

      // ==========================================
      // IDEMPOTENCY CHECK: Prevent duplicate credits
      // ==========================================
      const existingTransaction = await ctx.db
        .query("creditTransactions")
        .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
        .filter((q) => q.eq(q.field("metadata.polarOrderId"), orderId))
        .first();
      
      if (existingTransaction) {
        console.log(`Renewal order ${orderId} already processed, skipping`);
        return;
      }

      console.log(`Subscription renewal: ${tier.monthlyCredits} credits for ${clerkUserId}`);

      // Add monthly credits using existing mutation
      const result = await ctx.runMutation(api.credits.addCredits, {
        clerkUserId,
        amount: tier.monthlyCredits,
        type: "subscription_reset",
        description: `Monthly subscription credits: ${tier.displayName}`,
        metadata: {
          polarOrderId: orderId,
          polarSubscriptionId: subscriptionId,
          tierKey: subscription.tierKey,
        },
      });

      if (result.success) {
        console.log(`✅ Monthly credits added: ${tier.monthlyCredits}`);
      } else {
        console.error(`❌ Failed to add monthly credits:`, result.error);
      }
    },

    // ============================================
    // OPTIONAL: Additional logging for debugging
    // ============================================
    "subscription.created": async (ctx, event) => {
      console.log("Subscription created:", event.data.id);
      
      const clerkUserId = event.data.customer?.metadata?.clerk_user_id;
      const tierKey = event.data.metadata?.tier_key;
      
      if (clerkUserId && tierKey) {
        // Note: Initial credits are granted via success redirect handler
        // This webhook is mainly for logging/tracking
        console.log(`New subscription: ${tierKey} for ${clerkUserId}`);
      }
    },
    
    "subscription.updated": async (ctx, event) => {
      console.log("Subscription updated:", event.data.id, "Status:", event.data.status);
      
      // Handle tier changes if needed
      if (event.data.status === "active" && event.data.metadata?.tier_key) {
        // Could trigger tier change logic here
      }
    },
  },
});

export default http;
```

### **Step 3: Add Subscription Mutations**

**File**: `convex/subscriptions.ts`

```typescript
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get subscription by Clerk user ID
 * Used by UI to display current subscription
 * 
 * REQUIRES: Compound index "by_organization_and_status" ["organizationId", "status"]
 */
export const getByClerkUserId = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = args;
    
    // Find user first to get organizationId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
      .first();
    
    if (!user?.organizationId) {
      return null;
    }

    // Get subscription for user's organization using compound index
    // This is more efficient than using .filter()
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_organization_and_status", (q) => 
        q.eq("organizationId", user.organizationId).eq("status", "active")
      )
      .first();

    return subscription;
  },
});

/**
 * Create subscription record (called from UI on successful checkout)
 */
export const create = mutation({
  args: {
    clerkUserId: v.string(),
    polarSubscriptionId: v.string(),
    polarCustomerId: v.string(),
    polarProductId: v.string(),
    tierKey: v.string(),
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    // Find user's organization
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!user?.organizationId) {
      throw new Error("User organization not found");
    }

    // Insert subscription record
    await ctx.db.insert("subscriptions", {
      organizationId: user.organizationId,
      clerkUserId: args.clerkUserId,
      polarSubscriptionId: args.polarSubscriptionId,
      polarCustomerId: args.polarCustomerId,
      polarProductId: args.polarProductId,
      tierKey: args.tierKey,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update subscription tier (on upgrade/downgrade)
 */
export const updateTier = mutation({
  args: {
    polarSubscriptionId: v.string(),
    tierKey: v.string(),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_polar_subscription", (q) => 
        q.eq("polarSubscriptionId", args.polarSubscriptionId)
      )
      .first();

    if (sub) {
      await ctx.db.patch(sub._id, {
        tierKey: args.tierKey,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Cancel subscription
 */
export const cancel = mutation({
  args: {
    polarSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_polar_subscription", (q) => 
        q.eq("polarSubscriptionId", args.polarSubscriptionId)
      )
      .first();

    if (sub) {
      await ctx.db.patch("subscriptions", sub._id, {
        status: "canceled",
        updatedAt: Date.now(),
      });
    }
  },
});
```

### **Step 4: Update Schema Indexes**

**File**: `convex/schema.ts`

Add the compound index for efficient subscription queries:

```typescript
subscriptions: defineTable({
  // ... existing fields
})
  .index("by_organization", ["organizationId"])
  .index("by_organization_and_status", ["organizationId", "status"])  // ADD THIS
  .index("by_polar_subscription_id", ["polarSubscriptionId"])
  // ... other indexes
```

Also verify `creditTransactions` has an index for idempotency checks:

```typescript
creditTransactions: defineTable({
  clerkUserId: v.string(),
  type: v.union(
    v.literal("initial"),
    v.literal("purchase"),
    v.literal("subscription_reset"),
    v.literal("usage"),
    v.literal("refund"),
    v.literal("bonus"),
  ),
  amount: v.number(),
  balanceAfter: v.number(),
  description: v.optional(v.string()),
  metadata: v.optional(v.record(v.string(), v.any())),
  timestamp: v.number(),
})
  .index("by_user", ["clerkUserId"])  // For idempotency check with filter
  .index("by_user_and_timestamp", ["clerkUserId", "timestamp"]),
```

### **QA Checklist**

```bash
npx tsc --noEmit
npx @biomejs/biome check --write convex/polar.ts convex/http.ts convex/subscriptions.ts
```

### **Testing**

1. **Component Initialization**:
   - Verify `npx convex dev` starts without errors
   - Check component tables exist in Convex dashboard

2. **Custom Webhook Handlers**:
   - Test `order.paid` handler with test product ID
   - Test `order.created` handler with `billing_reason: "subscription_cycle"`
   - Verify credit amounts are correctly mapped from product IDs
   - Test idempotency (same event processed twice = same result)

3. **Integration**:
   - Verify subscription queries return correct data
   - Test create/update/cancel mutations

---

## ✅ Task 3: Initialize Credits on Subscription (1 hour)

### **Objective**

Add subscription-specific mutation to the credit system (`convex/credits.ts`).

**Important**: Convex handles ALL credit allocation. Monthly recurring credits are added via `order.created` webhook when subscriptions renew.

### **File**: `convex/credits.ts` (add new mutation)

Add this mutation to the existing file:

```typescript
// ============================================
// NEW: Subscription initialization
// ============================================

/**
 * Initialize credits for new subscription
 * Called from webhook when subscription.created
 * 
 * IMPORTANT: Only grants INITIAL credits (tier-specific)
 * Monthly recurring credits handled by order.created webhook (billingReason: "subscription_cycle")
 */
export const initializeForSubscription = mutation({
  args: {
    clerkUserId: v.string(),
    tierKey: v.string(),
  },
  handler: async (ctx, args) => {
    const { clerkUserId, tierKey } = args;
    const now = Date.now();

    // Check if user already has credits (idempotency)
    const existingCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (existingCredits) {
      // User already initialized - just update tier
      await ctx.db.patch("userCredits", existingCredits._id, {
        subscriptionTier: tierKey,
        updatedAt: now,
      });
      return { success: true, alreadyInitialized: true };
    }

    // Look up tier credits from subscriptionTiers table
    const tier = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_tier_key", (q) => q.eq("tierKey", tierKey))
      .first();

    if (!tier) {
      throw new Error(`Unknown tier: ${tierKey}`);
    }

    // Create userCredits with tier's INITIAL credits
    await ctx.db.insert("userCredits", {
      clerkUserId,
      balance: tier.initialCredits,
      totalPurchased: tier.initialCredits,
      totalUsed: 0,
      totalBonusReceived: 0,
      subscriptionTier: tierKey,
      createdAt: now,
      updatedAt: now,
    });

    // Log transaction
    await ctx.db.insert("creditTransactions", {
      clerkUserId,
      type: "initial",
      amount: tier.initialCredits,
      balanceAfter: tier.initialCredits,
      description: `Subscription started: ${tier.displayName} (initial credits)`,
      timestamp: now,
    });

    return { success: true, creditsGranted: tier.initialCredits };
  },
});
```

**Note**: The existing `addCredits` mutation will be used by both `order.paid` (one-time purchases) and `order.created` (monthly renewals) webhook handlers. No need to create a separate `addMonthlyCredits` mutation.

---

## 💡 How Credits Work with Your Dashboard

### **Important: Your Dashboard Requires NO Changes!**

Your existing dashboard already displays credits from the `userCredits` table:

```typescript
// Current dashboard code (no changes needed):
const credits = useQuery(api.credits.getUserCredits, {
  clerkUserId: user?.id
});

// Displays: credits.balance
```

### **Complete Credit Flow:**

#### **1. Initial Signup (Day 1)**
```javascript
// subscription.created webhook fires
// → Calls initializeForSubscription mutation
// → Creates in userCredits table:
{
  balance: 200,              // ← Dashboard shows this
  totalBonusReceived: 200,
  totalPurchased: 0,
  totalUsed: 0,
}
```

#### **2. User Uses AI Features (Day 1-30)**
```javascript
// User generates video (50 credits)
// → Calls existing deductCredits mutation
// → Updates userCredits:
{
  balance: 150,              // 200 - 50 ← Dashboard updates
  totalUsed: 50,
}

// User generates another video (50 credits)
{
  balance: 100,              // 150 - 50 ← Dashboard updates
  totalUsed: 100,
}
```

#### **3. Monthly Renewal (Day 30)**
```javascript
// Subscription renews
// → Polar creates order with billing_reason="subscription_cycle"
// → order.created webhook fires
// → Calls existing addCredits mutation
// → Updates userCredits:
{
  balance: 300,              // 100 + 200 ← Dashboard updates!
  totalBonusReceived: 400,   // 200 + 200
  totalUsed: 100,
}
```

#### **4. One-Time Credit Purchase**
```javascript
// User buys 55 credit pack
// → Polar creates order
// → Payment succeeds
// → order.paid webhook fires (ONLY after payment succeeds)
// → Calls existing addCredits mutation
// → Updates userCredits:
{
  balance: 355,              // 300 + 55 ← Dashboard updates!
  totalPurchased: 55,
  totalUsed: 100,
}
```

### **Key Points:**

1. **`userCredits.balance`** is the single source of truth ✅
2. **Dashboard reads from this field** - no changes needed ✅
3. **Convex real-time sync** - users see updates immediately ✅
4. **All mutations update the same table** - consistent data ✅

### **What Updates the Balance:**

| Action | Mutation Called | Balance Change |
|--------|----------------|----------------|
| New subscription | `initializeForSubscription` | +200/1000/5000 (initial) |
| Monthly renewal | `addCredits` (via order.created webhook) | +200/500/2000 (monthly) |
| Credit purchase | `addCredits` (via order.paid webhook) | +25/55/115/300 |
| AI feature usage | `deductCredits` | -X (based on action) |

### **Existing Mutations Used:**

```typescript
// ✅ Already exists in convex/credits.ts
export const getUserCredits = query({ ... });  // Dashboard uses this
export const addCredits = mutation({ ... });    // Webhooks call this
export const deductCredits = mutation({ ... }); // AI features call this

// ⭐ New for subscriptions
export const initializeForSubscription = mutation({ ... }); // Webhook calls this once
```

### **No Removed Functionality:**

- ❌ We're NOT removing `addCredits` (it's essential!)
- ❌ We're NOT changing `userCredits` table structure
- ❌ We're NOT modifying dashboard queries
- ✅ We're just using Polar to trigger `addCredits` at the right time

### **2-Step QA**

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx @biomejs/biome check --write convex/credits.ts

# Step 3: Deploy to Convex dev
npx convex dev --once
```

---

## 🎨 EXISTING PRODUCTION-READY UI

**Status**: ✅ **100% Complete** - No UI changes needed!

MyShortReel already has a complete, production-ready subscription UI at `https://myreeldream.ai/dashboard/account`:

### **1. SubscriptionTab.tsx** ✅
**Location**: `components/dashboard/account/tabs/SubscriptionTab.tsx`

**Features**:
- Current plan display with status badge
- Monthly/yearly pricing toggle
- Billing history table with invoice downloads
- Payment method display (card type, last 4 digits)
- "Manage Subscription" button
- "Cancel Subscription" button with confirmation

**Current State**: Uses `mockSubscriptions[0]` (line 13) - **Ready to connect to Polar API**

### **2. ManageSubscriptionModal.tsx** ✅
**Location**: `components/dashboard/account/modals/ManageSubscriptionModal.tsx`

**Features**:
- Beautiful 4-tier subscription grid (lines 47-107):
  - **Free**: $0/month, 10 AI credits/month, 3 projects
  - **Starter**: $9.99/month, 100 AI credits/month, 10 projects
  - **Pro**: $29.99/month, 500 AI credits/month, Unlimited projects (POPULAR)
  - **Enterprise**: $99.99/month, 2000 AI credits/month, Unlimited projects
- Feature lists with checkmarks
- "Upgrade" / "Downgrade" / "Current Plan" badges
- "Cancel Subscription" button with confirmation dialog
- Responsive (Dialog on desktop, Drawer on mobile)

**Current State**: Mock data - **Ready to connect to `generateCheckoutLink()`**

### **3. PurchaseCreditsModal.tsx** ✅
**Location**: `components/dashboard/account/modals/PurchaseCreditsModal.tsx`

**Features**:
- 4 credit packages in grid layout (lines 34-60):
  - **Starter**: $25 (25 credits, no bonus)
  - **Popular**: $50 (50 credits + 5 bonus = 55 total) ⭐
  - **Pro**: $100 (100 credits + 15 bonus = 115 total)
  - **Enterprise**: $250 (250 credits + 50 bonus = 300 total)
- Visual selection state
- Bonus credit badges
- "Popular" tag on recommended package
- Payment method info
- Responsive grid (1 column mobile, 2 columns desktop)

**Current State**: Mock purchase handler (line 69) - **Ready to connect to `generateCheckoutLink()`**

### **4. AccountTabs.tsx** ✅
**Location**: `components/dashboard/account/AccountTabs.tsx`

**Features**:
- Tab navigation: Profile, Subscription, Usage & Credits, Notifications
- Tab state management
- Mobile-optimized layout

**Current State**: Complete and working

### **Screenshots** 📸
- **Image 1**: ManageSubscriptionModal showing 4-tier comparison (Free, Starter, Pro, Enterprise)
- **Image 2**: PurchaseCreditsModal showing 4 credit packages with bonuses

---

## ✅ Task 5: Connect UI to Polar React Components (1 hour) ✓ COMPLETED

**Status**: ✅ **COMPLETED** (2026-02-24)

### **What Was Done**

All UI components successfully wired to Polar backend API using official `@convex-dev/polar/react` components:

#### **1. ManageSubscriptionModal.tsx** ✓

**Subscription Management**:
- ✅ Uses `CheckoutLink` component for new subscriptions (free → paid plans)
- ✅ Integrated `changeCurrentSubscription` action for upgrades/downgrades with prorated billing
- ✅ Integrated `cancelCurrentSubscription` action with revoke options
- ✅ Dynamic product ID mapping via environment variables (`NEXT_PUBLIC_POLAR_PRODUCT_TIER_*`)
- ✅ Loading states with `isChanging` flag
- ✅ Proper error handling with user feedback

**Implementation Pattern** (from `/home/laurentperello/polar/example/src/App.tsx`):
```tsx
// For free users upgrading (checkout flow)
<CheckoutLink
  polarApi={{ generateCheckoutLink: api.polar.generateCheckoutLink }}
  productIds={[productId]}
>
  <Button>Upgrade</Button>
</CheckoutLink>

// For existing subscribers changing plans
const changeSubscription = useAction(api.polar.changeCurrentSubscription);
await changeSubscription({ productId });

// For canceling subscription
const cancelSubscription = useAction(api.polar.cancelCurrentSubscription);
await cancelSubscription({ revokeImmediately: false });
```

#### **2. PurchaseCreditsModal.tsx** ✓

**One-time Credit Purchases**:
- ✅ Uses `CheckoutLink` with `embed={false}` (redirect mode) for credit package purchases
- ✅ Dynamic product ID mapping via environment variables (`NEXT_PUBLIC_POLAR_PRODUCT_CREDITS_*`)
- ✅ 4 credit packages integrated:
  - Starter: $25 (25 credits)
  - Popular: $50 (50+5 bonus)
  - Pro: $100 (100+15 bonus)
  - Enterprise: $250 (250+50 bonus)

**Implementation Pattern**:
```tsx
<CheckoutLink
  polarApi={{ generateCheckoutLink: api.polar.generateCheckoutLink }}
  productIds={[selectedPolarProductId]}
  embed={false} // Redirect to Polar checkout
>
  <Button>Purchase Credits</Button>
</CheckoutLink>
```

#### **3. SubscriptionTab.tsx** ✓

**Subscription Display & Management**:
- ✅ Replaced mock data with live Convex query: `api.subscriptions.getByClerkUserId`
- ✅ Uses `CustomerPortalLink` for payment method updates and billing history
- ✅ Real-time subscription status display (active/inactive)
- ✅ Dynamic plan pricing based on tier
- ✅ Billing period with current period start/end timestamps
- ✅ Graceful handling of free plan (no subscription record)

**Implementation Pattern**:
```tsx
// Fetch subscription data
const subscription = useQuery(api.subscriptions.getByClerkUserId, {
  clerkUserId: user.id,
});

// Customer portal access
<CustomerPortalLink
  polarApi={{ generateCustomerPortalUrl: api.polar.generateCustomerPortalUrl }}
>
  <Button>Update Payment</Button>
</CustomerPortalLink>
```

### **2-Step QA Checklist** ✓

#### **Step 1: TypeScript Check** ✓
```bash
npx tsc --noEmit
```
**Result**: ✅ No errors in updated UI components (pre-existing test errors ignored)

#### **Step 2: Biome Lint + Format** ✓
```bash
npx @biomejs/biome check --write --unsafe components/dashboard/account/
```
**Result**: ✅ All files formatted and linted successfully
- Removed unused imports (`ExternalLink`, `formatCurrency`)
- Fixed non-null assertion (replaced with conditional rendering)

### **Deployment** ✓
```bash
npx convex dev --once
```
**Result**: ✅ Deployed successfully (19 Convex functions ready)

### **Key Changes Summary**

| File | Changes | Lines Modified |
|------|---------|----------------|
| `ManageSubscriptionModal.tsx` | Added Polar integration + actions | ~150 |
| `PurchaseCreditsModal.tsx` | Added CheckoutLink for credit purchases | ~30 |
| `SubscriptionTab.tsx` | Replaced mocks with Convex queries | ~180 |

**Total**: ~360 lines changed across 3 files

---

### **Objective**

Wire the **existing production-ready UI components** to use Polar API calls. No design changes needed - just replace mock data with real API calls.

**Components to update**:
1. `SubscriptionTab.tsx` - Replace `mockSubscriptions[0]` with `polar.getCurrentSubscription()`
2. `ManageSubscriptionModal.tsx` - Call `generateCheckoutLink()` on upgrade/downgrade
3. `PurchaseCreditsModal.tsx` - Call `generateCheckoutLink()` for credit purchases

**Reference**: Official Polar React components from `/home/laurentperello/polar/example/`

### **Why Use React Components?**

The `@convex-dev/polar` package provides pre-built React components that handle:
- Automatic checkout session creation
- Modal or redirect behavior
- Loading states
- Error handling
- Customer portal access

**Much less code than manual action calls!**

### **Available React Components**

```typescript
import { CheckoutLink, CustomerPortalLink } from "@convex-dev/polar/react";

// CheckoutLink - Creates checkout modal/redirect
<CheckoutLink productId="prod_xxx">
  <Button>Upgrade</Button>
</CheckoutLink>

// CustomerPortalLink - Opens customer portal
<CustomerPortalLink>
  <Button>Manage Subscription</Button>
</CustomerPortalLink>
```

### **Step 1: Update ManageSubscriptionModal**

**File**: `components/dashboard/account/modals/ManageSubscriptionModal.tsx`

```typescript
// Add imports
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

// Inside component
const { user } = useUser();
const t = useTranslations("billing");
const generateCheckout = useAction(api.polarApi.generateCheckoutLink);
const initSubscription = useAction(api.credits.initializeForSubscription);
const [isRedirecting, setIsRedirecting] = useState(false);

const handleUpgrade = async (tierKey: "tier_1" | "tier_2" | "tier_3") => {
  if (!user) return;

  try {
    setLoading(true);
    
    // Get product ID for the tier
    const products = await getConfiguredProducts();
    const productId = products[tierKey]?.id;
    
    if (!productId) {
      throw new Error(`Product not found for tier: ${tierKey}`);
    }

    // Create checkout via component API
    const { url } = await generateCheckout({
      productIds: [productId],
      origin: window.location.origin,
      successUrl: `${window.location.origin}/dashboard/account?checkout=subscription&status=success&tier=${tierKey}`,
      cancelUrl: `${window.location.origin}/dashboard/account?checkout=subscription&status=canceled`,
      metadata: {
        clerk_user_id: user.id,
        tier_key: tierKey,
      },
    });

    // Store pending tier for post-checkout initialization
    localStorage.setItem("pendingSubscriptionTier", tierKey);

    // Show redirecting state before redirect
    setIsRedirecting(true);
    toast.info(t("redirecting_to_checkout"));
    
    // Small delay to let user see the feedback
    await new Promise(resolve => setTimeout(resolve, 500));

    // Redirect to Polar checkout
    window.location.href = url;
  } catch (error) {
    console.error("Failed to create checkout:", error);
    toast.error(t("error.checkout_start_failed"));
    setIsRedirecting(false);
  } finally {
    setLoading(false);
  }
};

// Helper to get configured products
const getConfiguredProducts = async () => {
  // This would be a query to get product mapping
  // For now, use env vars mapping
  return {
    tier_1: { id: process.env.NEXT_PUBLIC_POLAR_PRODUCT_TIER_1 },
    tier_2: { id: process.env.NEXT_PUBLIC_POLAR_PRODUCT_TIER_2 },
    tier_3: { id: process.env.NEXT_PUBLIC_POLAR_PRODUCT_TIER_3 },
  };
};

// In the render/return section, add redirect overlay:
{isRedirecting && (
  <div 
    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="redirect-title"
    aria-busy={true}
    style={{ touchAction: 'none' }}
  >
    <div className="flex flex-col items-center gap-4 p-6">
      <Loader2 
        className="h-8 w-8 text-primary motion-safe:animate-spin" 
        aria-hidden="true"
      />
      <p id="redirect-title" className="text-lg font-medium">
        {t("redirecting_to_checkout")}
      </p>
    </div>
  </div>
)}

// Add focus management useEffect:
useEffect(() => {
  if (isRedirecting) {
    const previousFocus = document.activeElement;
    const overlay = document.querySelector('[role="alertdialog"]');
    if (overlay) {
      (overlay as HTMLElement).focus();
    }
    return () => {
      if (previousFocus && 'focus' in previousFocus) {
        (previousFocus as HTMLElement).focus();
      }
    };
  }
}, [isRedirecting]);
```

### **Step 2: Update PurchaseCreditsModal**

**File**: `components/dashboard/account/modals/PurchaseCreditsModal.tsx`

```typescript
// Add imports
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

// Inside component
const { user } = useUser();
const t = useTranslations("purchase_credits_modal");
const generateCheckout = useAction(api.polarApi.generateCheckoutLink);
const [loading, setLoading] = useState(false);
const [isRedirecting, setIsRedirecting] = useState(false);

// Map package IDs to credit product IDs
const CREDIT_PACKAGES: Record<string, string> = {
  starter: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDITS_STARTER!,
  popular: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDITS_POPULAR!,
  pro: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDITS_PRO!,
  enterprise: process.env.NEXT_PUBLIC_POLAR_PRODUCT_CREDITS_ENTERPRISE!,
};

const handlePurchase = async () => {
  if (!user || !selectedPackage) return;

  try {
    setLoading(true);
    
    const productId = CREDIT_PACKAGES[selectedPackage];
    if (!productId) {
      throw new Error(`Unknown package: ${selectedPackage}`);
    }

    // Create checkout via component API
    const { url } = await generateCheckout({
      productIds: [productId],
      origin: window.location.origin,
      successUrl: `${window.location.origin}/dashboard/account?checkout=credits&status=success&package=${selectedPackage}`,
      cancelUrl: `${window.location.origin}/dashboard/account?checkout=credits&status=canceled`,
      metadata: {
        clerk_user_id: user.id,
        package_id: selectedPackage,
      },
    });

    // Show redirecting state before redirect
    setIsRedirecting(true);
    toast.info(t("redirecting_to_checkout"));
    
    // Small delay to let user see the feedback
    await new Promise(resolve => setTimeout(resolve, 500));

    // Redirect to Polar checkout
    window.location.href = url;
  } catch (error) {
    console.error("Failed to create checkout:", error);
    toast.error(t("error.checkout_start_failed"));
    setIsRedirecting(false);
  } finally {
    setLoading(false);
  }
};

// In the render/return section, add redirect overlay:
{isRedirecting && (
  <div 
    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="redirect-title"
    aria-busy={true}
    style={{ touchAction: 'none' }}
  >
    <div className="flex flex-col items-center gap-4 p-6">
      <Loader2 
        className="h-8 w-8 text-primary motion-safe:animate-spin" 
        aria-hidden="true"
      />
      <p id="redirect-title" className="text-lg font-medium">
        {t("redirecting_to_checkout")}
      </p>
    </div>
  </div>
)}

// Add focus management useEffect:
useEffect(() => {
  if (isRedirecting) {
    const previousFocus = document.activeElement;
    const overlay = document.querySelector('[role="alertdialog"]');
    if (overlay) {
      (overlay as HTMLElement).focus();
    }
    return () => {
      if (previousFocus && 'focus' in previousFocus) {
        (previousFocus as HTMLElement).focus();
      }
    };
  }
}, [isRedirecting]);

// Button with loading state:
<Button 
  onClick={handlePurchase} 
  disabled={loading || !selectedPackage}
  className="min-h-[44px] active:scale-98 hover:scale-105 transition-transform touch-manipulation"
  aria-busy={loading}
  aria-label={loading ? t("processing_aria") : t("purchase_button")}
  aria-describedby={!selectedPackage ? "select-package-error" : undefined}
>
  {loading ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" aria-hidden="true" />
      <span>{t("processing")}</span>
    </>
  ) : (
    t("purchase_button")
  )}
</Button>

{!selectedPackage && (
  <span id="select-package-error" className="sr-only">
    {t("error.select_package_required")}
  </span>
)}
```

### **Step 3: Update SubscriptionTab**

**File**: `components/dashboard/account/tabs/SubscriptionTab.tsx`

```typescript
// Add imports
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

// Inside component
const { user } = useUser();
const t = useTranslations("billing");
const subscription = useQuery(
  api.subscriptions.getByClerkUserId, 
  user ? { clerkUserId: user.id } : "skip"
);
const generatePortalUrl = useAction(api.polarApi.generateCustomerPortalUrl);
const [isRedirecting, setIsRedirecting] = useState(false);

const handleManageSubscription = async () => {
  if (!user) return;

  try {
    setLoading(true);
    
    // Create portal session via component API
    const { url } = await generatePortalUrl({
      metadata: {
        clerk_user_id: user.id,
      },
    });

    // Show redirecting state before redirect
    setIsRedirecting(true);
    toast.info(t("redirecting_to_portal"));
    
    // Small delay to let user see the feedback
    await new Promise(resolve => setTimeout(resolve, 500));

    // Redirect to Polar customer portal
    window.location.href = url;
  } catch (error) {
    console.error("Failed to open customer portal:", error);
    toast.error(t("error.portal_open_failed"));
    setIsRedirecting(false);
  } finally {
    setLoading(false);
  }
};

// In the render/return section, add redirect overlay:
{isRedirecting && (
  <div 
    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    role="status"
    aria-live="polite"
  >
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <p className="text-lg font-medium">{t("redirecting_to_portal")}</p>
    </div>
  </div>
)}

// Button with loading state:
<Button 
  onClick={handleManageSubscription} 
  disabled={loading}
  className="min-h-[44px] active:scale-98 hover:scale-105 transition-transform touch-manipulation"
  aria-busy={loading}
  aria-label={loading ? t("opening_portal_aria") : t("manage_subscription_button")}
>
  {loading ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" aria-hidden="true" />
      <span>{t("opening_portal")}</span>
    </>
  ) : (
    t("manage_subscription_button")
  )}
</Button>
```

### **Step 4: Handle Success Redirects**

**File**: `app/dashboard/account/page.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

export default function AccountPage() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const t = useTranslations("billing");
  const initSubscription = useAction(api.credits.initializeForSubscription);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    // Unified checkout status handling
    const checkoutType = searchParams.get("checkout");
    const status = searchParams.get("status");
    
    if (!checkoutType || !status) return;

    // Handle subscription checkout
    if (checkoutType === "subscription") {
      if (status === "success" && user) {
        const tier = searchParams.get("tier") || localStorage.getItem("pendingSubscriptionTier");
        
        if (tier) {
          setAnnouncement(t("toast.subscription_processing"));
          
          // Initialize credits for the new subscription
          initSubscription({ clerkUserId: user.id, tierKey: tier })
            .then(() => {
              toast.success(t("toast.subscription_success"));
              setAnnouncement(t("toast.subscription_success"));
              localStorage.removeItem("pendingSubscriptionTier");
            })
            .catch((err) => {
              console.error("Failed to initialize subscription:", err);
              toast.error(t("toast.subscription_success_credits_failed"));
              setAnnouncement(t("toast.subscription_success_credits_failed"));
            });
        }
      } else if (status === "canceled") {
        toast.info(t("toast.subscription_canceled"));
        localStorage.removeItem("pendingSubscriptionTier");
      }
    }

    // Handle credit purchase checkout (credits added via webhook)
    if (checkoutType === "credits") {
      if (status === "success") {
        toast.success(t("toast.credits_purchase_success"));
      } else if (status === "canceled") {
        toast.info(t("toast.credits_purchase_canceled"));
      }
    }
  }, [searchParams, user, initSubscription, t]);

  // Focus management: Return focus to main content after redirect
  useEffect(() => {
    const checkoutType = searchParams.get("checkout");
    if (checkoutType) {
      const mainContent = document.getElementById('account-main-content');
      if (mainContent) {
        mainContent.focus();
      }
    }
  }, [searchParams]);

  return (
    <div 
      id="account-main-content" 
      tabIndex={-1} 
      className="min-h-screen bg-background animate-in fade-in duration-300"
    >
      {/* Screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {announcement}
      </div>
      
      {/* ... rest of component */}
    </div>
  );
}
```

### **Step 5: Expose Environment Variables to Frontend**

**File**: `.env.local`

```bash
# Add these for frontend access (NEXT_PUBLIC_ prefix)
# ✅ SANDBOX IDs (created 2026-02-24)
NEXT_PUBLIC_POLAR_PRODUCT_TIER_1=e5e6c9de-b88c-47a5-883a-3823bd264707
NEXT_PUBLIC_POLAR_PRODUCT_TIER_2=8d8a2da2-9304-4be0-9d5b-cf57caa34746
NEXT_PUBLIC_POLAR_PRODUCT_TIER_3=c7a17f55-7b4b-4d5c-a7f1-b707656f6589

NEXT_PUBLIC_POLAR_PRODUCT_CREDITS_STARTER=d3b0791a-f692-4564-8690-6f85bc9d435b
NEXT_PUBLIC_POLAR_PRODUCT_CREDITS_POPULAR=86e14b99-a194-45fe-87e3-466fca2e9bb5
NEXT_PUBLIC_POLAR_PRODUCT_CREDITS_PRO=44da7533-0a4b-4a26-b641-9b45e81c2d07
NEXT_PUBLIC_POLAR_PRODUCT_CREDITS_ENTERPRISE=19c982fd-3106-45f2-833d-07b573b45c2b
```

### **Step 6: Add Translation Keys**

**Files**: `messages/en.json`, `messages/fr.json`

Add these new translation keys for billing functionality:

```json
{
  "billing": {
    "toast": {
      "subscription_processing": "Processing your subscription...",
      "subscription_success": "Subscription activated! Your credits have been added.",
      "subscription_success_credits_failed": "Subscription active, but credit initialization failed. Contact support.",
      "subscription_canceled": "Subscription canceled. No changes were made.",
      "credits_purchase_success": "Credits purchased successfully! They will appear shortly.",
      "credits_purchase_canceled": "Credit purchase canceled. No charges were made."
    },
    "error": {
      "checkout_start_failed": "Failed to start checkout. Please try again.",
      "portal_open_failed": "Failed to open subscription management. Please try again."
    },
    "redirecting_to_checkout": "Redirecting to secure checkout...",
    "redirecting_to_portal": "Redirecting to customer portal...",
    "manage_subscription_button": "Manage Subscription",
    "opening_portal": "Opening portal..."
  },
  "purchase_credits_modal": {
    "title": "Purchase Credits",
    "popular_badge": "Popular",
    "bonus_label": "+{bonus} bonus",
    "total_credits": "Total: {total} credits",
    "selected_label": "Selected",
    "payment_method": "Payment Method",
    "payment_redirect_desc": "You will be redirected to our secure payment processor to complete your purchase.",
    "cancel_button": "Cancel",
    "purchase_button": "Purchase Credits",
    "processing": "Processing...",
    "redirecting_to_checkout": "Redirecting to secure checkout...",
    "error": {
      "checkout_start_failed": "Failed to start checkout. Please try again."
    }
  }
}
```

**Note**: After adding these keys, run `pnpm translate && pnpm i18n:verify` to generate French translations and verify all keys are present.

### **QA Checklist**

```bash
npx tsc --noEmit
npx @biomejs/biome check --write convex/polar.ts convex/userContext.ts
npx @biomejs/biome check --write components/dashboard/account/
```

### **Testing**

1. **Checkout Flow**:
   - Click "Upgrade" → redirects to Polar checkout
   - Complete checkout → returns to success URL
   - Verify `initializeForSubscription` is called
   - Check credits appear in dashboard

2. **Credit Purchase Flow**:
   - Select package → click "Purchase"
   - Complete checkout → returns to success URL
   - Verify webhook adds credits (may take 1-2 seconds)

3. **Customer Portal**:
   - Click "Manage Subscription" → redirects to Polar portal
   - Verify portal loads with correct subscription

---

## ✅ Task 6: Seed Subscription Tiers (0.5 hours)

### **Objective**

Populate `subscriptionTiers` table with client-defined tiers.

### **Method**: Via Convex Dashboard

Navigate to Convex dashboard → Data → `subscriptionTiers` table → Insert documents

### **Data to seed**

```json
// Tier 1
{
  "tierKey": "tier_1",
  "displayName": "Casual", // TBD by client
  "initialCredits": 200,
  "monthlyCredits": 200,
  "sortOrder": 1,
  "isActive": true,
  "description": "Perfect for getting started",
  "createdAt": Date.now(),
  "updatedAt": Date.now()
}

// Tier 2
{
  "tierKey": "tier_2",
  "displayName": "Regular", // TBD by client
  "initialCredits": 1000,
  "monthlyCredits": 500,
  "sortOrder": 2,
  "isActive": true,
  "description": "Great for regular users",
  "createdAt": Date.now(),
  "updatedAt": Date.now()
}

// Tier 3
{
  "tierKey": "tier_3",
  "displayName": "Pro", // TBD by client
  "initialCredits": 5000,
  "monthlyCredits": 2000,
  "sortOrder": 3,
  "isActive": true,
  "description": "For power users",
  "createdAt": Date.now(),
  "updatedAt": Date.now()
}
```

### **Alternative: Seed Script**

Create `convex/seed.ts`:

```typescript
import { mutation } from "./_generated/server";

export const seedSubscriptionTiers = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    const tiers = [
      {
        tierKey: "tier_1",
        displayName: "Casual", // TBD by client
        initialCredits: 200,
        monthlyCredits: 200,
        sortOrder: 1,
        isActive: true,
        description: "Perfect for getting started",
        createdAt: now,
        updatedAt: now,
      },
      {
        tierKey: "tier_2",
        displayName: "Regular", // TBD by client
        initialCredits: 1000,
        monthlyCredits: 500,
        sortOrder: 2,
        isActive: true,
        description: "Great for regular users",
        createdAt: now,
        updatedAt: now,
      },
      {
        tierKey: "tier_3",
        displayName: "Pro", // TBD by client
        initialCredits: 5000,
        monthlyCredits: 2000,
        sortOrder: 3,
        isActive: true,
        description: "For power users",
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const tier of tiers) {
      // Check if tier already exists
      const existing = await ctx.db
        .query("subscriptionTiers")
        .withIndex("by_tier_key", (q) => q.eq("tierKey", tier.tierKey))
        .first();

      if (!existing) {
        await ctx.db.insert("subscriptionTiers", tier);
        console.log(`Seeded tier: ${tier.tierKey}`);
      }
    }

    return { success: true, seededCount: tiers.length };
  },
});
```

Run via Convex dashboard: Functions → `seed:seedSubscriptionTiers` → Run

### **QA Checklist**

- [ ] All 3 tiers seeded with correct credit amounts
- [ ] `tierKey` values match those used in Polar product mapping
- [ ] Display names confirmed by client
- [ ] `sortOrder` is correct (1, 2, 3)
- [ ] All tiers marked as `isActive: true`

### **2-Step QA**

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx @biomejs/biome check --write convex/seed.ts

# Step 3: Deploy to Convex dev
npx convex dev --once

# Step 4: Run seed function
# Run via Convex dashboard: Functions → seed:seedSubscriptionTiers → Run
```

---

## ⏳ Task 8: Fix Critical Bugs + Complete Monthly Renewal (2 hours)

**Status**: ⏳ **REQUIRED** - Production blockers identified

This task fixes critical bugs in the current implementation and completes the monthly renewal logic.

---

### **Critical Issues Identified**

After code review on 2026-02-25, the following production-blocking bugs were found:

1. 🔴 **CRITICAL**: Missing idempotency check in `order.paid` webhook handler
2. 🟠 **HIGH**: Monthly renewal credit allocation not implemented
3. 🟠 **HIGH**: Missing idempotency check in `order.created` handler

---

### **Bug 1: Missing Idempotency Check in order.paid Handler**

**Severity**: 🔴 **CRITICAL** - Production blocker

**File**: `convex/http.ts` (lines 29-91)

**Problem**: 
- Webhook handler calls `addCredits` without checking if `polarOrderId` already processed
- If Polar retries webhook → user gets duplicate credits
- Exploitable: User could trigger duplicate webhooks manually
- Current code has comment "Note: Can't query db directly in webhook context, will use mutation's idempotency" but `addCredits` mutation does NOT have idempotency check

**Current Code (BROKEN)**:
```typescript
"order.paid": async (ctx, event) => {
  const clerkUserId = event.data.customer?.metadata?.clerk_user_id as string | undefined;
  const orderId = event.data.id;
  const productId = event.data.productId;
  
  if (!clerkUserId) {
    console.error("Missing clerk_user_id in order.paid", { orderId });
    return;
  }

  // ❌ NO IDEMPOTENCY CHECK - BUG!
  console.log(`Processing one-time credit purchase for order ${orderId}`);
  
  const creditPackages: Record<string, number> = { /* ... */ };
  const creditAmount = creditPackages[productId];
  
  // ❌ This will add credits EVERY TIME webhook is sent (no duplicate check)
  const result = await ctx.runMutation(api.credits.addCredits, {
    clerkUserId,
    amount: creditAmount,
    type: "purchase",
    description: `Credit purchase: ${creditAmount} credits`,
    metadata: { polarOrderId: orderId, polarProductId: productId },
  });
}
```

**Fix Required**:

> ⚠️ **CRITICAL ARCHITECTURE NOTE**: The `events` handlers in `registerRoutes` receive `RunMutationCtx`
> (confirmed from `@convex-dev/polar` source at `/home/laurentperello/polar/src/component/util.ts`).
> `RunMutationCtx` has only `runQuery` and `runMutation` — **NO `ctx.db` access**.
> Any fix that uses `ctx.db.query(...)` directly in the handler WILL fail at runtime.
> **Correct pattern**: idempotency check must live INSIDE a dedicated `internalMutation`.

**Step 1**: Create `addPurchaseCredits` internalMutation in `convex/credits.ts`:

```typescript
export const addPurchaseCredits = internalMutation({
  args: {
    clerkUserId: v.string(),
    polarOrderId: v.string(),
    polarProductId: v.string(),
    creditAmount: v.number(),
  },
  handler: async (ctx, { clerkUserId, polarOrderId, polarProductId, creditAmount }) => {
    const now = Date.now();

    // ✅ IDEMPOTENCY CHECK: query runs inside mutation — ctx.db is available here
    const existingTransaction = await ctx.db
      .query("creditTransactions")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .filter((q) => q.eq(q.field("metadata.polarOrderId"), polarOrderId))
      .first();

    if (existingTransaction) {
      console.log(`✅ Order ${polarOrderId} already processed (idempotency), skipping`);
      return { success: true, alreadyProcessed: true };
    }

    // Get or create user credits
    let userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (!userCredits) {
      const newId = await ctx.db.insert("userCredits", {
        clerkUserId,
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
        totalBonusReceived: 0,
        subscriptionTier: undefined,
        createdAt: now,
        updatedAt: now,
      });
      userCredits = await ctx.db.get(newId);
    }

    if (!userCredits) {
      return { success: false, reason: "failed_to_get_user_credits" };
    }

    const newBalance = userCredits.balance + creditAmount;

    await ctx.db.patch(userCredits._id, {
      balance: newBalance,
      totalPurchased: userCredits.totalPurchased + creditAmount,
      updatedAt: now,
    });

    await ctx.db.insert("creditTransactions", {
      clerkUserId,
      type: "purchase",
      amount: creditAmount,
      balanceAfter: newBalance,
      description: `Credit purchase: ${creditAmount} credits`,
      metadata: {
        polarOrderId,
        polarProductId,
      },
      timestamp: now,
    });

    console.log(`✅ Purchase credits added: ${creditAmount} for ${clerkUserId}`);
    return { success: true, creditsAdded: creditAmount, newBalance };
  },
});
```

**Step 2**: Update `order.paid` handler in `convex/http.ts` to call the new mutation:

```typescript
"order.paid": async (ctx, event) => {
  const clerkUserId = event.data.customer?.metadata?.clerk_user_id as string | undefined;
  const orderId = event.data.id;
  const productId = event.data.productId;

  if (!clerkUserId) {
    console.error("Missing clerk_user_id in order.paid", { orderId });
    return;
  }

  const creditPackages: Record<string, number> = {
    "d3b0791a-f692-4564-8690-6f85bc9d435b": 25,
    "86e14b99-a194-45fe-87e3-466fca2e9bb5": 55,
    "44da7533-0a4b-4a26-b641-9b45e81c2d07": 115,
    "19c982fd-3106-45f2-833d-07b573b45c2b": 300,
  };

  const creditAmount = creditPackages[productId];

  if (!creditAmount) {
    console.error("Unknown credit product ID", { productId, orderId });
    return;
  }

  // ✅ Idempotency is handled INSIDE the mutation (correct pattern for RunMutationCtx)
  try {
    const result = await ctx.runMutation(internal.credits.addPurchaseCredits, {
      clerkUserId,
      polarOrderId: orderId,
      polarProductId: productId,
      creditAmount,
    });

    if (result.success) {
      if (result.alreadyProcessed) {
        console.log(`✅ Order ${orderId} already processed (idempotency)`);
      } else {
        console.log(`✅ Purchase credits added: ${creditAmount}`);
      }
    } else {
      console.error(`❌ Failed to add purchase credits:`, result.reason);
    }
  } catch (error) {
    console.error("Error processing order.paid:", error);
  }
},
```

**Why This Matters**:
- Without this check, if Polar retries a webhook (network issue, timeout, etc.), user gets credits multiple times for one purchase
- This is a financial integrity bug - users could potentially exploit it
- Standard webhook best practice: always check idempotency before processing
- **The idempotency check MUST be in the mutation** (`internalMutation` has `ctx.db`), not in the webhook handler (`RunMutationCtx` only has `runQuery`/`runMutation`)

---

### **Bug 2: Missing Monthly Renewal Credit Allocation**

**Severity**: 🟠 **HIGH** - Core feature incomplete

**File**: `convex/http.ts` (lines 96-136)

**Problem**:
- `order.created` handler detects renewals correctly (`billingReason === "subscription_cycle"`)
- But only logs warning: "Monthly credit allocation not yet implemented"
- Users won't receive monthly credits when subscription renews

**Current Code (INCOMPLETE)**:
```typescript
"order.created": async (_ctx, event) => {
  if (event.data.billingReason !== "subscription_cycle") {
    return;
  }

  const clerkUserId = event.data.customer?.metadata?.clerk_user_id as string | undefined;
  const subscriptionId = event.data.subscriptionId;
  const orderId = event.data.id;

  if (!clerkUserId || !subscriptionId) {
    console.error("Missing data in order.created for renewal", { orderId });
    return;
  }

  console.log(`Processing subscription renewal for ${clerkUserId}, order ${orderId}`);
  console.log(`Subscription renewal detected - order ${orderId}, subscription ${subscriptionId}`);

  // ❌ TODO: Implement subscription renewal credit allocation
  console.warn("Monthly credit allocation not yet implemented - needs dedicated mutation");
},
```

**Fix Required**:

**Step 1**: Create dedicated mutation in `convex/credits.ts`:

```typescript
/**
 * Add monthly renewal credits for subscription
 * Called by order.created webhook when billingReason = "subscription_cycle"
 * 
 * IMPORTANT: Includes idempotency check to prevent duplicate credit additions
 */
export const addMonthlyRenewalCredits = mutation({
  args: {
    clerkUserId: v.string(),
    polarSubscriptionId: v.string(),
    polarOrderId: v.string(),
  },
  handler: async (ctx, { clerkUserId, polarSubscriptionId, polarOrderId }) => {
    const now = Date.now();

    // ============================================
    // STEP 1: IDEMPOTENCY CHECK
    // ============================================
    const existingTransaction = await ctx.db
      .query("creditTransactions")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .filter((q) => q.eq(q.field("metadata.polarOrderId"), polarOrderId))
      .first();

    if (existingTransaction) {
      console.log(`✅ Renewal order ${polarOrderId} already processed (idempotency), skipping`);
      return { success: false, reason: "duplicate" };
    }

    // ============================================
    // STEP 2: Lookup subscription to get tier
    // ============================================
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_polar_subscription_id", (q) =>
        q.eq("polarSubscriptionId", polarSubscriptionId)
      )
      .first();

    if (!subscription) {
      console.error(`❌ Subscription ${polarSubscriptionId} not found for renewal ${polarOrderId}`);
      return { success: false, reason: "subscription_not_found" };
    }

    // ============================================
    // STEP 3: Get tier's monthly credit amount
    // ============================================
    const tier = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_tier_key", (q) => q.eq("tierKey", subscription.tierKey))
      .first();

    if (!tier) {
      console.error(`❌ Tier ${subscription.tierKey} not found for renewal ${polarOrderId}`);
      return { success: false, reason: "tier_not_found" };
    }

    // ============================================
    // STEP 4: Get or create user credits
    // ============================================
    let userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (!userCredits) {
      // Create if not exists (shouldn't happen, but defensive)
      const newId = await ctx.db.insert("userCredits", {
        clerkUserId,
        organizationId: subscription.organizationId,
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
        totalBonusReceived: 0,
        subscriptionTier: subscription.tierKey,
        createdAt: now,
        updatedAt: now,
      });
      userCredits = await ctx.db.get(newId);
    }

    if (!userCredits) {
      return { success: false, reason: "failed_to_get_user_credits" };
    }

    // ============================================
    // STEP 5: Add monthly credits
    // ============================================
    const monthlyCredits = tier.monthlyCredits || 0;
    const newBalance = userCredits.balance + monthlyCredits;

    await ctx.db.patch(userCredits._id, {
      balance: newBalance,
      totalBonusReceived: userCredits.totalBonusReceived + monthlyCredits,
      lastResetAt: now,
      updatedAt: now,
    });

    // ============================================
    // STEP 6: Log transaction with metadata for idempotency
    // ============================================
    await ctx.db.insert("creditTransactions", {
      clerkUserId,
      organizationId: subscription.organizationId,
      type: "subscription_reset",
      amount: monthlyCredits,
      balanceAfter: newBalance,
      description: `Monthly renewal: ${tier.displayName} (${monthlyCredits} credits)`,
      metadata: {
        polarSubscriptionId,
        polarOrderId,  // ✅ For idempotency check
        tierKey: subscription.tierKey,
      },
      timestamp: now,
    });

    console.log(`✅ Monthly renewal: ${monthlyCredits} credits added for ${clerkUserId}`);

    return {
      success: true,
      creditsAdded: monthlyCredits,
      newBalance,
    };
  },
});
```

**Step 2**: Update `order.created` handler in `convex/http.ts` (replace lines 96-136):

```typescript
"order.created": async (ctx, event) => {
  // Only process subscription renewals
  if (event.data.billingReason !== "subscription_cycle") {
    return;
  }

  const clerkUserId = event.data.customer?.metadata?.clerk_user_id as string | undefined;
  const subscriptionId = event.data.subscriptionId;
  const orderId = event.data.id;

  if (!clerkUserId || !subscriptionId) {
    console.error("Missing data in order.created for renewal", { orderId });
    return;
  }

  console.log(`Processing subscription renewal for ${clerkUserId}, order ${orderId}`);

  try {
    const result = await ctx.runMutation(api.credits.addMonthlyRenewalCredits, {
      clerkUserId,
      polarSubscriptionId: subscriptionId,
      polarOrderId: orderId,
    });

    if (result.success) {
      console.log(`✅ Monthly credits added for renewal ${orderId}`);
    } else {
      if (result.reason === "duplicate") {
        console.log(`✅ Renewal ${orderId} already processed (idempotency)`);
      } else {
        console.error(`❌ Failed to add monthly credits:`, result.reason);
      }
    }
  } catch (error) {
    console.error("Error processing renewal:", error);
  }
},
```

---

### **Summary of Changes Required**

| File | Function | Change | Lines | Priority |
|------|----------|--------|-------|----------|
| `convex/credits.ts` | `addPurchaseCredits` | New `internalMutation` with idempotency check + credit addition | ~55 | 🔴 CRITICAL |
| `convex/credits.ts` | `addMonthlyRenewalCredits` | New `internalMutation` with idempotency + monthly credit allocation | ~60 | 🟠 HIGH |
| `convex/http.ts` | `order.paid` handler | Call `internal.credits.addPurchaseCredits` (replace `api.credits.addCredits`) | ~10 | 🔴 CRITICAL |
| `convex/http.ts` | `order.created` handler | Call `internal.credits.addMonthlyRenewalCredits` (replace TODO log) | ~10 | 🟠 HIGH |

**Total**: ~135 lines of production-critical code

> ⚠️ **Architecture constraint**: Webhook event handlers receive `RunMutationCtx` (only `runQuery` + `runMutation`, no `ctx.db`).
> All DB queries for idempotency MUST live inside the `internalMutation` bodies, not in the handler itself.

---

### **Why These Are Critical**

1. **Idempotency in `order.paid`**:
   - Without this: Webhook retries = duplicate credits = financial loss
   - Polar retries failed webhooks automatically (up to 10 times)
   - Users could potentially exploit by manually triggering webhooks
   - **Impact**: Direct revenue loss + customer trust issues

2. **Monthly Renewal Logic**:
   - Without this: Subscribers don't get monthly credits
   - **Impact**: Core value proposition broken, subscribers can't use product

3. **Idempotency in `order.created`**:
   - Without this: Renewal retries = duplicate monthly credits
   - **Impact**: Same as Bug 1, but for subscriptions

---

### **Testing Requirements**

After fixes are implemented:

1. **Idempotency Test (order.paid)**:
   - Complete credit purchase
   - Resend webhook from Polar dashboard
   - Verify: Only 1 transaction, balance didn't double

2. **Idempotency Test (order.created)**:
   - Trigger renewal (or send test webhook)
   - Resend webhook
   - Verify: Only 1 transaction, monthly credits added once

3. **Monthly Renewal Test**:
   - Create subscription
   - Wait for renewal OR send test `order.created` with `billingReason: "subscription_cycle"`
   - Verify: Monthly credits added based on tier

4. **Edge Cases**:
   - Missing `clerk_user_id` → error logged, no crash
   - Unknown `productId` → error logged, no crash
   - Subscription not found → error logged, no crash
   - Tier not found → error logged, no crash

---

### **2-Step QA**

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx @biomejs/biome check --write convex/http.ts convex/credits.ts

# Step 3: Deploy to Convex dev
npx convex dev --once

# Step 4: Run tests (after test suite created in Task 9)
pnpm test:polar
```

---

## ⏳ Task 9: Automated Test Suite (1 hour)

**Status**: ⏳ **PENDING** - After Task 8 bugs are fixed

**Prerequisites**: Task 8 must be completed (idempotency + monthly renewal implemented)

This task creates automated tests to verify ALL critical functionality before manual testing.

---

### **Test Strategy**

1. **Unit Tests** (`convex-test`): Test business logic in isolation against an in-memory DB
2. **Integration Tests** (bash scripts): Verify code structure, schema, exported functions
3. **Manual Tests** (browser + Polar dashboard): End-to-end user flows

**Focus**: Automate what can be automated, manual test only what requires browser/UI

**convex-test setup pattern** (used in polar-idempotency, polar-credits, polar-subscriptions):
```typescript
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { internal, api } from "../../convex/_generated/api";
import { describe, expect, it } from "vitest";

const modules = import.meta.glob("../../convex/**/*.ts");

it("...", async () => {
  const t = convexTest(schema, modules);
  // Seed test data via t.run() — in-memory DB starts empty each test
  await t.run(async (ctx) => {
    await ctx.db.insert("subscriptionTiers", { tierKey: "tier_1", ... });
  });
  // Call internal mutations directly
  const result = await t.mutation(internal.credits.addPurchaseCredits, { ... });
  expect(result.success).toBe(true);
});
```
> No polar component registration needed: `addPurchaseCredits` and `addMonthlyRenewalCredits`
> only access app tables (creditTransactions, userCredits, subscriptions, subscriptionTiers).

---

### **Test 1: Idempotency Tests (CRITICAL)** ✅ DONE

**File**: `__tests__/convex/polar-idempotency.test.ts`
**Status**: 4/4 passing — `npx vitest run __tests__/convex/polar-idempotency.test.ts`

**Fix applied**: `import.meta.glob` pattern updated in `polar-test-helpers.ts` to include
`convex/_generated/*.js` (was missing `_generated` dir, causing all tests to fail).
Pattern changed from `"../../convex/!(*.d).ts"` to array with `**/*.ts`, `**/*.js`, `!**/*.d.ts`.

**What is tested**:
1. ✅ `addPurchaseCredits` first call succeeds and credits are added
2. ✅ `addPurchaseCredits` second call with same `polarOrderId` → `alreadyProcessed: true`, balance unchanged
3. ✅ `addMonthlyRenewalCredits` first call adds monthly credits correctly
4. ✅ `addMonthlyRenewalCredits` second call with same `polarOrderId` → `reason: "duplicate"`, balance unchanged

**Why critical**: Financial integrity - prevents users from getting free credits via duplicate webhooks

---

### **Test 2: Credit Allocation Tests**

**File**: `__tests__/convex/polar-credits.test.ts`

**What to test**:
1. ✅ One-time purchase: 4 products → correct credit amounts (25, 55, 115, 300)
2. ✅ Monthly renewal: 3 tiers → correct monthly credits (200, 1000, 5000)
3. ✅ Initial subscription: 3 tiers → correct initial credits
4. ✅ Balance calculation: old balance + new credits = new balance
5. ✅ Transaction logging: All transactions recorded with correct metadata

---

### **Test 3: Subscription Lifecycle Tests** ✅ DONE

**File**: `__tests__/convex/polar-subscriptions.test.ts`
**Status**: 7/7 passing — `npx vitest run __tests__/convex/polar-subscriptions.test.ts`

**Bug found and fixed**: `subscriptions.create` had `tier: args.tierKey as "free"|"starter"|"pro"|"enterprise"` — a TypeScript cast that lies. At runtime Convex validator rejected "tier_1". Fixed with a proper `TIER_KEY_TO_PLAN` map in `convex/subscriptions.ts`.

**What is tested**:
1. ✅ Create subscription → record stored with correct fields (clerkUserId, organizationId, tierKey, plan.monthlyCredits)
2. ✅ Get subscription by `clerkUserId` → returns active subscription
3. ✅ Get subscription by `clerkUserId` → returns null when no subscription exists
4. ✅ Update subscription tier → tierKey changed
5. ✅ Cancel subscription → status becomes "canceled", canceledAt set
6. ✅ Cancel subscription → userCredits balance untouched
7. ✅ Multiple users → each user has their own isolated subscription record

---

### **Test 4: Subscription Tiers Tests** ✅ DONE

**File**: `__tests__/convex/polar-tiers.test.ts`
**Status**: 9/9 passing — `npx vitest run __tests__/convex/polar-tiers.test.ts`

**What is tested** (real values from polar-subscription-setup-guide.md):
1. ✅ All 3 tiers exist (tier_1, tier_2, tier_3) — 3 documents total
2. ✅ Correct monthlyCredits — tier_1=200, tier_2=1000, tier_3=5000 (3 parametric tests)
3. ✅ Correct initialCredits — tier_1=200, tier_2=1000, tier_3=5000 (3 parametric tests)
4. ✅ Get tier by `tierKey` via `by_tier_key` index — returns correct displayName and credits
5. ✅ Tiers sorted by `sortOrder` ascending — tier_1 < tier_2 < tier_3

---

### **Test 5: Product ID Mapping Tests** ✅ DONE

**File**: `__tests__/convex/polar-product-mapping.test.ts`

**Environment**: `POLAR_SERVER=sandbox` + `POLAR_ORGANIZATION_TOKEN` (sandbox OAT) — loaded from `.env.local` via `vitest.config.ts` `loadEnv("test", cwd, "")`

**Result**: 17/17 tests passed

**What was tested**:
1. ✅ CREDIT_PACKAGES constant has exactly 4 entries with correct credit amounts (25/55/115/300)
2. ✅ All 7 product IDs (3 plans + 4 packages) are valid UUID v4 format
3. ✅ **REAL API CALL** — `GET https://sandbox-api.polar.sh/v1/products/?limit=50` (323ms) — all 7 product IDs confirmed in Polar sandbox catalogue
4. ✅ All 7 `POLAR_PRODUCT_*` env vars present and UUID-format in process.env

**Fix applied**: Updated `vitest.config.ts` to call `loadEnv("test", process.cwd(), "")` and pass result as `test.env` — makes all `.env.local` vars available as `process.env.*` in tests

---

### **Test 6: Webhook Handler Tests** ✅ DONE — ⚠️ GAPS FOUND → see Test 8

**File**: `__tests__/convex/polar-webhook-handlers.test.ts`

**What to test**:
1. ✅ `order.paid`: Maps all 4 product IDs correctly (DB lookup, credit computation)
2. ✅ `order.paid`: Missing `clerk_user_id` → error logged, no crash ⚠️ Wrong key tested — was `clerk_user_id`, real key is `userId`
3. ✅ `order.paid`: Unknown `productId` → error logged, no crash
4. ✅ `order.created`: Only processes when `billingReason === "subscription_cycle"`
5. ✅ `order.created`: Missing fields → error logged, no crash
6. ✅ `subscription.created`: Logs subscription creation
7. ✅ `subscription.updated`: Logs cancellation reason
8. ✅ `subscription.updated`: Known productId → `getByPolarProductId` returns tier → `updateTier` updates tierKey (**Bug 3 fix verified**)
9. ✅ `subscription.updated`: Unknown productId → returns null → `updateTier` NOT called → tierKey unchanged

**Gaps in this test** (root cause of the production bugs not caught):
- ❌ User resolution never tested: tests injected `TEST_USER_ID` directly — the `convexId → getByConvexId → clerkUserId` step was completely absent
- ❌ Credit formula branching by `productType` never tested: `subscription` uses `initialCredits` only; `one_time` uses `initialCredits + bonusCredits`. All 9 tests only exercised `one_time`
- ❌ `subscription.created` missing userid guard never tested (dead guard since key was wrong)
- ❌ `order.created` user resolution also skipped

**Result**: ✅ Biome clean — TS clean — **9/9 green** — `npx convex dev --once` ✅

---

### **Test 7: Integration Tests (bash)** ✅ DONE

**File**: `scripts/test-polar-integration.sh`

**What to test**:
1. ✅ Required files exist (polar.ts, http.ts, credits.ts, subscriptions.ts)
2. ✅ Schema indexes exist (by_polar_subscription_id, by_tier_key, etc.)
3. ✅ All required internal functions exported (addPurchaseCredits, addMonthlyRenewalCredits)
4. ✅ Env vars set in .env.local (all POLAR_* keys present)
5. ✅ TypeScript compiles without errors in Polar files
6. ✅ Biome linting passes
7. ✅ `http.ts` — all 5 `ctx.runQuery/runMutation` calls use `internal.*` — no `api.*` (script updated to handle both same-line and multiline patterns)
8. ✅ i18n — all 7 translation files in sync (`pnpm i18n:verify`) — 6 missing `subscription_tab` keys added and translated
9. ✅ **`lazy` prop on all `CheckoutLink`** — verifies no `CheckoutLink` in modal files is missing `lazy`. Root cause of the concurrent checkout race condition: without `lazy`, all 3 plan cards mount simultaneously and each fires `generateCheckoutLink`. They all see no customer in the component DB, all try to call `customers.create`, 2 out of 3 fail with "A customer with this email address already exists". Fixed by adding `lazy` to `ManageSubscriptionModal.tsx` and `PurchaseCreditsModal.tsx`. This check prevents regression.
10. ✅ **REAL API CALL**: `GET https://sandbox-api.polar.sh/v1/products/` returns HTTP 200 — confirms token is valid and sandbox is reachable

**Result**: ✅ **10/10 passed / 0 failed** — `npx convex dev --once` ✅ — `subscriptions.updateTier` converted to `internalMutation`

---

### **Test 8: User Resolution Tests** ✅ DONE

**File**: `__tests__/convex/polar-users.test.ts` (NEW)

**Root cause**: The `@convex-dev/polar` component stores customers with `metadata: { userId: <convex_doc_id> }`. No test verified that `internal.users.getByConvexId` can resolve a Convex doc ID to a `clerkUserId`. This is the exact step that was broken in production (handlers were reading `clerk_user_id` which never existed).

**What to test** (3 tests):
1. `getByConvexId` with a valid Convex doc ID → returns the user record
2. `getByConvexId` returns the correct `clerkUserId` field
3. `getByConvexId` with an unknown/invalid ID → returns `null`

**2-step QA**: `npx tsc --noEmit` → `npx @biomejs/biome check`

**Result**: ✅ Biome clean — TS clean — **3/3 green**

---

### **Test 9: Webhook User Resolution + Credit Formula Tests** ✅ DONE

**File**: `__tests__/convex/polar-webhook-handlers.test.ts` (ADDITIONS — from 9 to 19 tests)

**What to add** (10 new tests):

`order.paid` user resolution (3 tests):
- `order.paid` full path: seed user → resolve via `getByConvexId` → credits granted to correct `clerkUserId`
- `order.paid` with `userId` missing from metadata → early return → zero credits
- `order.paid` with valid `convexUserId` but user not in DB → early return → zero credits

`order.paid` credit formula by `productType` (2 tests):
- `subscription` product → `creditAmount = tier.initialCredits` only (no bonusCredits)
- `one_time` product → `creditAmount = tier.initialCredits + tier.bonusCredits`

`order.created` user resolution (2 tests):
- `order.created` full path: seed user → resolve via `getByConvexId` → renewal credits granted
- `order.created` with `userId` missing → early return → zero credits

End-to-end subscription purchase flow (1 test):
- Seed user + tier → run full `order.paid` handler sequence (getByConvexId → getByPolarProductId → addPurchaseCredits) → verify `userCredits` balance updated correctly

`subscription.created` — no double credit allocation (2 tests):
- Verify `subscription.created` fires → no credits added directly (credits come from `order.paid`)
- Verify that if `order.paid` runs after `subscription.created`, idempotency prevents double allocation

**2-step QA**: `npx tsc --noEmit` → `npx @biomejs/biome check --write`

**Result**: ✅ Biome clean — TS clean — **19/19 green** (9 original + 10 new)

---

### **Test Coverage Summary**

| Component | File | Tests | Priority |
|-----------|------|-------|----------|
| Idempotency | `polar-idempotency.test.ts` | 4 tests | 🔴 CRITICAL |
| Credit allocation | `polar-credits.test.ts` | 12 tests | 🔴 CRITICAL |
| Subscription CRUD | `polar-subscriptions.test.ts` | 7 tests | 🟠 HIGH |
| Tiers + credit packages | `polar-tiers.test.ts` | 19 tests | 🟡 MEDIUM |
| Product mapping | `polar-product-mapping.test.ts` | 17 tests | 🟡 MEDIUM |
| Webhook handlers | `polar-webhook-handlers.test.ts` | 19 tests | 🔴 CRITICAL |
| **User resolution** *(new)* | `polar-users.test.ts` | **3 tests** | 🔴 CRITICAL |
| Integration bash | `test-polar-integration.sh` | 10 checks | 🟠 HIGH |
| **TOTAL** | | **81 vitest + 10 bash** | |

---

### **Definition of Done for Task 9**

- [ ] All 7 test files created
- [ ] All 38 tests pass
- [ ] Integration script passes
- [ ] TypeScript: `npx tsc --noEmit` passes
- [ ] Biome: No linting errors
- [ ] Test commands added to `package.json`
- [ ] Ready for manual testing (Task 10)

---

## ⏳ Task 10: Manual Testing + QA (0.5 hours)

**Status**: ⏳ **PENDING** - After Task 8 + Task 9 complete

**Prerequisites**: 
- ✅ Task 8: Bugs fixed, monthly renewal implemented
- ✅ Task 9: All automated tests pass
- ✅ Polar sandbox configured
- ✅ Environment variables set (Convex + Vercel)
- ✅ Webhooks configured in Polar dashboard

This task performs manual end-to-end testing in the browser using the Vercel preview URL.

---

> ✅ **Critical bugs fixed before manual testing**:
> 1. `subscription.updated` handler in `convex/http.ts` now calls `subscriptions.updateTier` via DB lookup — upgrade/downgrade tierKey updated correctly in Convex. Covered by Test 6 (tests 8–9). Deploy required: `npx convex dev --once`.
> 2. `ManageSubscriptionModal` now reads plan names, prices, monthly credits, and polarProductIds from `api.subscriptionTiers.listSubscriptionPlans` — zero hardcoded values.
> 3. 6 missing i18n keys added to `subscription_tab` namespace (`plan_name_free`, `status_inactive`, `payment_method_managed_by_polar`, `update_via_customer_portal`, `billing_history_managed_by_polar`, `view_billing_history`) and translated into all 7 languages via `pnpm translate`. `pnpm i18n:verify` passes.

---

### **Pre-flight: i18n Verification**

Before any manual UI test, confirm translations are in sync:

```bash
pnpm i18n:verify
```

**Expected**: Exit 0, no missing keys reported. If any keys missing: run `pnpm translate` then re-verify.

**Also verify visually** on the Subscription tab: no raw translation keys (e.g. `subscription_tab.plan_name_free`) should appear anywhere in the UI. If they do, a key is missing from `messages/en.json` — add it and re-run `pnpm translate`.

---

### **Manual Test 1: First Subscription (no active subscription)**

**Context**: User has signed in but has no Polar subscription yet. The Subscription tab shows plan name as "Free" (UI fallback — not a Polar product).

**Steps**:
1. Open Vercel preview URL → sign in
2. Go to Account → Subscription tab
3. Verify plan shows as **"Free"** (translated) and badge shows **"Inactive"** (translated) — NOT raw keys like `subscription_tab.plan_name_free`
4. Click **"Manage Subscription"** button
5. Modal opens showing 4 plans — "Free" highlighted as current
6. Click **"Upgrade"** on **Starter Plan** ($9.99/mo)
7. Polar checkout opens (via `CheckoutLink`)
8. Complete with sandbox test card: `4242 4242 4242 4242`
9. Wait for redirect back to app

**Verify**:
```bash
npx convex run subscriptions:getByClerkUserId '{"clerkUserId": "user_YOUR_ID"}'
npx convex run credits:getUserCredits '{"clerkUserId": "user_YOUR_ID"}'
```
Check Convex dashboard logs for `subscription.created` and `order.created` events.

**Expected**:
- Subscription record exists with `status: "active"`, `tierKey: "tier_1"`
- Credit balance = 200 (initial grant from `initializeForSubscription`)
- Logs show: `Subscription created: <id>` and `New subscription: tier_1 for user_xxx`

---

### **Manual Test 2: One-Time Credit Purchase**

**Context**: User has (or doesn't have) an active subscription.

**Steps**:
1. Go to Account → Subscription tab
2. Click **"Purchase Credits"** button
3. Modal opens showing 4 credit packages
4. Select **"25 Credits — Starter Pack"** ($25)
5. Polar checkout opens
6. Complete with sandbox test card
7. Wait for redirect

**Verify**:
```bash
npx convex run credits:getUserCredits '{"clerkUserId": "user_YOUR_ID"}'
```
Check Convex dashboard logs for `order.paid` event.

**Expected**:
- Credit balance increased by 25
- Transaction type: `"purchase"` in `creditTransactions` table
- Logs show: `Purchase credits added: 25`

---

### **Manual Test 3: Upgrade subscription (Starter → Pro)**

**Context**: User has active Starter subscription (from Test 1).

**Steps**:
1. Go to Account → Subscription tab → click **"Manage Subscription"**
2. Modal shows Starter as current plan
3. Click **"Upgrade"** on **Pro Plan** ($29.99/mo)
4. Browser confirm dialog: "Are you sure you want to upgrade? Any price difference will be prorated." → click OK
5. Wait for Polar to process (calls `api.polar.changeCurrentSubscription`)

**Verify**:
```bash
npx convex run subscriptions:getByClerkUserId '{"clerkUserId": "user_YOUR_ID"}'
```
Check Convex dashboard logs for `subscription.updated` event.

**Expected**:
- Subscription `tierKey` updated to `"tier_2"` in Convex DB
- Logs show: `Subscription updated: <id> Status: active` and `Subscription tier updated: tier_2 for <id>`

---

### **Manual Test 4: Downgrade subscription (Pro → Starter)**

**Context**: User has active Pro subscription (from Test 3).

**Steps**:
1. Go to Account → Subscription tab → click **"Manage Subscription"**
2. Modal shows Pro as current plan
3. Click **"Downgrade"** on **Starter Plan** ($9.99/mo)
4. Browser confirm dialog → click OK
5. Wait for Polar to process

**Verify**:
```bash
npx convex run subscriptions:getByClerkUserId '{"clerkUserId": "user_YOUR_ID"}'
```

**Expected**:
- Subscription `tierKey` updated to `"tier_1"` in Convex DB
- ⚠️ Same known bug as Test 3 — verify

---

### **Manual Test 5: Cancel subscription (in-app)**

**Context**: User has active subscription.

**Steps**:
1. Go to Account → Subscription tab → click **"Manage Subscription"**
2. Scroll to bottom of modal → click red **"Cancel Subscription"** button
3. Confirmation dialog appears inside the modal
4. Click **"Yes, Cancel"**
5. Modal closes (calls `api.polar.cancelCurrentSubscription({ revokeImmediately: false })`)

**Verify**:
```bash
npx convex run subscriptions:getByClerkUserId '{"clerkUserId": "user_YOUR_ID"}'
npx convex run credits:getUserCredits '{"clerkUserId": "user_YOUR_ID"}'
```
Check Convex dashboard logs for `subscription.updated` event.

**Expected**:
- Subscription `status: "canceled"` in Convex DB
- Credit balance unchanged (credits are NOT removed on cancellation)
- Logs show: `Subscription updated: <id> Status: canceled`

---

### **Manual Test 6: Customer Portal — payment management**

**Context**: User has active subscription. The customer portal is for payment/billing management only — subscription changes are handled in-app (Tests 3–5).

**Steps**:
1. Go to Account → Subscription tab
2. Scroll to **"Payment Method"** section
3. Click **"Update Payment"** button (opens `CustomerPortalLink`)
4. Polar customer portal opens in new tab/modal

**Verify in Portal**:
- [ ] Can see current subscription details
- [ ] Can update payment method
- [ ] Can view billing history

---

### **Manual Test 7: Idempotency**

**Context**: Complete Test 1 or Test 2 first (so a delivery appears in the Polar dashboard).

**Steps**:
1. Go to [sandbox.polar.sh](https://sandbox.polar.sh) → Settings → Webhooks → click your webhook URL
2. In the **Deliveries** section, find the `order.paid` delivery from Test 2
3. Click on that delivery row → a **"Trigger redelivery"** option appears
4. Trigger the redelivery

**Verify**: Check Convex dashboard logs for the redelivered webhook.

**Expected**:
- Logs show: `Order ord_xxx already processed (idempotency), skipping`
- Credit balance did NOT increase again

> Note: The Deliveries section shows "No Results" until a real transaction fires at least one webhook.

---

### **Manual Test 8: Monthly Renewal**

> The renewal logic is fully covered by automated tests. Manual verification only applies if a sandbox billing cycle completes naturally. Polar sandbox does not offer a "fast-forward billing" UI — check [sandbox docs](https://docs.polar.sh/integrate/sandbox) for current capabilities.

**If a real renewal fires:**
```bash
npx convex run credits:getUserCredits '{"clerkUserId": "user_YOUR_ID"}'
```

**Expected**:
- Logs show: `Monthly renewal: <N> credits added for user_YOUR_ID`
- Balance increased by tier's `monthlyCredits` (200 / 1000 / 5000)

---

### **Final QA Checklist**

- [ ] All automated tests pass (74/74 — 66 vitest + 8 bash)
- [ ] Test 1: First subscription → active, tier_1, 200 credits granted
- [ ] Test 2: One-time purchase → credits added, transaction logged
- [ ] Test 3: Upgrade Starter → Pro → tierKey updated in Convex DB
- [ ] Test 4: Downgrade Pro → Starter → tierKey updated in Convex DB
- [ ] Test 5: Cancel in-app → status "canceled", credits retained
- [ ] Test 6: Customer portal opens → payment method + billing history visible
- [ ] Test 7: Idempotency → redelivered webhook skipped, balance unchanged
- [ ] Test 8: Monthly renewal → credits added (when sandbox cycle fires)
- [ ] ✅ Pre-fixed: `subscription.updated` calls `updateTier` — verify log `Subscription tier updated: tier_2 for <id>` appears
- [ ] ✅ Pre-fixed: UI credit amounts (200/1000/5000) come from DB via `listSubscriptionPlans` — verify display matches setup guide
- [ ] No TypeScript errors
- [ ] No Biome errors
- [ ] Convex deployment succeeds

---

### **Sign-Off**

After all tests pass:
- [ ] Developer: All automated tests pass (76/76 — 68 vitest + 8 bash)
- [ ] Developer: All manual tests pass (8/8)
- [ ] Developer: No console errors in browser
- [ ] Developer: Webhook logs clean (no errors)
- [ ] Developer: Critical bugs resolved (subscription.updated handler ✅ fixed — UI credit amounts ✅ fixed)
- [ ] Client: Ready for production Polar account setup
- [ ] Client: Ready to deploy to production

---


## ✅ Definition of Done

### **For SPRINT completion**:

- [ ] Production Polar account set up with products/prices
- [ ] Sandbox Polar account set up for testing
- [ ] All 7 products created (3 subscriptions + 4 credit packages) - NO Benefits needed
- [ ] Environment variables configured (`.env.local`)
- [ ] Convex Polar component installed and configured (`convex/convex.config.ts`)
- [ ] Webhook handlers implemented (`convex/http.ts`):
  - `order.paid` for one-time purchases
  - `order.created` for subscription renewals
  - `subscription.created` for logging
- [ ] Subscription mutations created (`convex/subscriptions.ts`)
- [ ] Credit initialization mutation added (`convex/credits.ts`)
- [ ] Webhook signature verification working
- [ ] UI components wired to Polar backend
- [ ] Subscription tiers seeded in database
- [ ] All test cases passing
- [ ] Webhook idempotency verified
- [ ] Deployed to production
- [ ] Webhooks configured in production Polar account

### **Post-Sprint (Optional Enhancements)**

- [ ] Add proration handling for mid-cycle upgrades/downgrades
- [ ] Add failed payment retry logic
- [ ] Add email notifications for subscription events
- [ ] Add invoice generation integration
- [ ] Add usage-based billing (if needed for enterprise)

### **Future Consideration: Usage-Based Billing**

**Current Model**: Pre-paid credits (buy upfront, deduct immediately)
- ✅ Users purchase credits via subscriptions or one-time payments
- ✅ Credits deducted when AI features used
- ✅ All tracking in Convex (`creditTransactions`, `usageTracking`)

**Polar Meters Model**: Post-paid usage billing (track usage, bill at month-end)
- ❌ NOT needed for current pre-paid model
- ⏳ Consider for future enterprise "bill me later" option
- 📚 Reference: https://polar.sh/docs/features/usage-based-billing/meters.md

**If Enterprise Post-Paid Needed Later:**
```typescript
// Example: Track video generation usage for enterprise customers
// Send events to Polar instead of deducting credits immediately
await fetch(`${POLAR_BASE_URL}/events/ingest`, {
  method: "POST",
  body: JSON.stringify({
    name: "video_generation",
    external_customer_id: enterpriseCustomerId,
    metadata: {
      credits_equivalent: 50,
      video_duration: 30,
      resolution: "1080p"
    }
  })
});
```

This would require:
- Creating Polar Meters to aggregate events
- Linking meters to products with usage-based pricing
- Dual billing system (credits for regular, meters for enterprise)

---

## 🔗 Related Documents

- Sprint 9: `docs/MVP/Todo/sprint-9-implementation.md` (Dashboard real data)
- Credit System Specification: `docs/Understanding/credit-system-specification.md` (Section 11)
- Polar.sh Documentation: https://polar.sh/docs/llms-full.txt
- SaaS Boilerplate Analysis: `docs/Analysis/SaaS-Boilerplate-Analysis.md`

---

## 📊 Summary: Component vs Custom Approach

### **Why We Chose the Component Approach:**

| Factor | Component (`@convex-dev/polar`) | Custom Implementation |
|--------|-----------------------------------|------------------------|
| **Code to Maintain** | ~150 lines (custom handlers only) | ~800 lines (full implementation) |
| **Time to Implement** | 7 hours | 10 hours |
| **Webhook Security** | ✅ Built-in (Standard Webhooks) | ❌ Manual HMAC implementation |
| **Idempotency** | ✅ Built-in (timestamp guards) | ❌ Manual implementation |
| **Product Sync** | ✅ Automatic | ❌ Manual API calls |
| **Type Safety** | ✅ Full TypeScript | ⚠️ Manual types |
| **Future Updates** | ✅ Component improves over time | ❌ Manual updates required |
| **Maintenance Burden** | Low (component team maintains) | High (we maintain everything) |

### **What the Component Handles:**

✅ **Built-in Features** (zero code from us):
- Webhook signature verification (Standard Webhooks spec)
- Idempotent subscription/product upserts
- Checkout session creation
- Customer portal sessions
- Product synchronization
- Subscription state management

✅ **Custom Code We Write** (~150 lines):
- `subscription.created` handler (allocate initial tier credits in Convex)
- `order.paid` handler (add one-time purchase credits in Convex)
- `initializeForSubscription` mutation (grant initial tier credits)
- UI wiring to component API

### **Architecture:**

```
Polar.sh ──webhook──▶ @convex-dev/polar Component ──▶ Custom Handlers ──▶ Convex Credit System
                              │
                              ├── Built-in signature verification
                              ├── Built-in idempotency
                              └── Built-in product/subscription sync
```

### **Key Benefits:**

1. **Less Code**: ~650 fewer lines to maintain
2. **Better Security**: Industry-standard webhook verification (Standard Webhooks)
3. **More Reliable**: Timestamp-guarded idempotency (handles out-of-order webhooks)
4. **Faster Implementation**: 3 hours saved vs custom approach
5. **Future-Proof**: Component updates bring improvements automatically

### **Credit Management Approach:**

**How it works:**
- **Subscriptions**: Convex allocates initial monthly credits when `subscription.created` fires
- **One-time products**: Convex adds credits when `order.paid` fires (AFTER payment succeeds)
- **Monthly renewals**: Handled by Convex (future implementation via cron or subscription.updated)
- **Credit tracking**: All transactions logged in `creditTransactions` table

**Integration points:**
1. **subscription.created webhook**: Grant initial credits based on subscription tier
2. **order.paid webhook**: Add credits from one-time purchases (AFTER payment succeeds)
3. **Convex system**: Track usage and deduct credits in real-time

**Benefits:**
- ✅ No dependency on Polar's Benefits system
- ✅ Full control over credit logic in Convex
- ✅ Simpler setup - no Benefits configuration needed
- ✅ Audit trail in `creditTransactions` table
- ✅ Flexible for future business logic changes

---

## ✅ Task 11: Fix Architectural Gap — `subscriptionTiers` as Single Source of Truth

**Status**: ✅ **DONE — 2026-02-25**  
**Severity**: was 🔴 CRITICAL  
**Estimated Time**: 2 hours  
**Root Cause**: Identified during Test 5 analysis on 2026-02-25

---

### **Problem Statement**

The current implementation has **hardcoded product data in two places**:

1. **`convex/http.ts` lines 47–52** — webhook handler has an inline `Record<productId, credits>` map
2. **`PurchaseCreditsModal.tsx` lines 36–62** — UI has a hardcoded array with amounts, prices, and bonus credits

Both are completely disconnected from Convex. Changing a credit amount requires:
- Editing `http.ts` → redeploy Convex
- Editing `PurchaseCreditsModal.tsx` → redeploy Next.js

The `subscriptionTiers` table was designed as *"Fully dynamic — add/remove/modify without code changes"* (see schema.ts line 807) but:
- Does **not** have a `polarProductId` column (cannot link a Polar webhook event to a tier)
- Does **not** contain credit packages (only 3 subscription rows, 0 credit package rows)

---

### **What Already Exists (Do NOT recreate)**

```
subscriptionTiers table — 3 rows:
  tier_1: Starter Plan     — monthlyCredits: 200,  initialCredits: 200
  tier_2: Pro Plan         — monthlyCredits: 1000, initialCredits: 1000
  tier_3: Enterprise Plan  — monthlyCredits: 5000, initialCredits: 5000

Missing:
  - polarProductId column on all 3 rows
  - 4 credit package rows (one-time products)
```

---

### **Step 1: Schema Migration — Add fields to `subscriptionTiers`** ✅ DONE

**File**: `convex/schema.ts` — `subscriptionTiers` table definition

Add the following fields:

```typescript
polarProductId: v.optional(v.string()),   // Polar UUID — links webhook event to this row
productType: v.optional(v.union(
  v.literal("subscription"),              // Recurring plan (tier_1/2/3)
  v.literal("one_time"),                  // One-time credit package
)),
priceUsd: v.optional(v.number()),         // Display price (e.g. 9.99, 25.00)
bonusCredits: v.optional(v.number()),     // Bonus on top of initialCredits (for display: "50 base + 5 bonus")
```

Add index:
```typescript
.index("by_polar_product_id", ["polarProductId"])
```

**QA**: `npx tsc --noEmit` + `npx @biomejs/biome check --write convex/schema.ts`  
**Result**: ✅ Biome clean — TS clean — Deployed: `✔ Added table indexes: [+] subscriptionTiers.by_polar_product_id`

---

### **Step 2: Seed Migration — Patch existing rows + add 4 credit package rows** ✅ DONE

**File**: `convex/seedCredits.ts` — add `patchSubscriptionTiersPolarIds` mutation

This one-shot migration does two things:
1. Patches the 3 existing subscription rows to add `polarProductId` and `productType: "subscription"`
2. Inserts 4 new credit package rows with `productType: "one_time"`

**Values** (source of truth: `docs/Guides/polar-subscription-setup-guide.md`):

```
// Patch existing subscription rows:
tier_1 → polarProductId: "e5e6c9de-b88c-47a5-883a-3823bd264707", productType: "subscription", priceUsd: 9.99
tier_2 → polarProductId: "8d8a2da2-9304-4be0-9d5b-cf57caa34746", productType: "subscription", priceUsd: 29.99
tier_3 → polarProductId: "c7a17f55-7b4b-4d5c-a7f1-b707656f6589", productType: "subscription", priceUsd: 99.99

// Insert new credit package rows:
credits_1:
  tierKey: "credits_starter", displayName: "25 Credits — Starter Pack"
  polarProductId: "d3b0791a-f692-4564-8690-6f85bc9d435b"
  productType: "one_time", priceUsd: 25.00
  initialCredits: 25, bonusCredits: 0, sortOrder: 10, isActive: true

credits_2:
  tierKey: "credits_popular", displayName: "55 Credits — Popular Pack"
  polarProductId: "86e14b99-a194-45fe-87e3-466fca2e9bb5"
  productType: "one_time", priceUsd: 50.00
  initialCredits: 50, bonusCredits: 5, sortOrder: 11, isActive: true  ← 50 base + 5 bonus = 55 awarded

credits_3:
  tierKey: "credits_pro", displayName: "115 Credits — Pro Pack"
  polarProductId: "44da7533-0a4b-4a26-b641-9b45e81c2d07"
  productType: "one_time", priceUsd: 100.00
  initialCredits: 100, bonusCredits: 15, sortOrder: 12, isActive: true  ← 100 base + 15 bonus = 115 awarded

credits_4:
  tierKey: "credits_enterprise", displayName: "300 Credits — Enterprise Pack"
  polarProductId: "19c982fd-3106-45f2-833d-07b573b45c2b"
  productType: "one_time", priceUsd: 250.00
  initialCredits: 250, bonusCredits: 50, sortOrder: 13, isActive: true  ← 250 base + 50 bonus = 300 awarded
```

Run after deploy:
```bash
npx convex run seedCredits:patchSubscriptionTiersPolarIds
```

**QA**: `npx tsc --noEmit` + `npx @biomejs/biome check --write convex/seedCredits.ts`  
**Result**: ✅ Biome clean — TS clean — `{ "inserted": 4, "patched": 3, "success": true }`

---

### **Step 3: New Convex Queries** ✅ DONE

**File**: `convex/subscriptionTiers.ts` (create if not exists, or add to existing)

```typescript
// Internal query — used by webhook handler
export const getByPolarProductId = internalQuery({
  args: { polarProductId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_polar_product_id", (q) => q.eq("polarProductId", args.polarProductId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

// Public query — used by PurchaseCreditsModal
export const listCreditPackages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_sort_order")
      .filter((q) => q.eq(q.field("productType"), "one_time"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Public query — used by SubscriptionTab / ManageSubscriptionModal
export const listSubscriptionPlans = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_sort_order")
      .filter((q) => q.eq(q.field("productType"), "subscription"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});
```

**QA**: `npx tsc --noEmit` + `npx @biomejs/biome check --write convex/subscriptionTiers.ts`  
**Result**: ✅ Biome clean — TS clean — file created

---

### **Step 4: Fix `convex/http.ts` — Remove hardcoded map** ✅ DONE

**File**: `convex/http.ts`

Replace lines 47–58 (the inline `creditPackages` map):

```typescript
// BEFORE (hardcoded — DO NOT keep):
const creditPackages: Record<string, number> = {
  "d3b0791a-...": 25,
  "86e14b99-...": 55,
  ...
};
const creditAmount = creditPackages[productId];
if (!creditAmount) { ... }

// AFTER (reads from Convex DB):
const tier = await ctx.runQuery(
  internal.subscriptionTiers.getByPolarProductId,
  { polarProductId: productId },
);
if (!tier) {
  console.error("Unknown credit product ID", { productId, orderId });
  return;
}
const creditAmount = (tier.initialCredits ?? 0) + (tier.bonusCredits ?? 0);
```

**QA**: `npx tsc --noEmit` + `npx @biomejs/biome check --write convex/http.ts`  
**Result**: ✅ Biome clean — TS clean

---

### **Step 5: Fix `PurchaseCreditsModal.tsx` — Remove hardcoded array** ✅ DONE

**File**: `components/dashboard/account/modals/PurchaseCreditsModal.tsx`

Replace the hardcoded `creditPackages` array with a Convex query:

```typescript
// BEFORE (hardcoded — DO NOT keep):
const creditPackages: CreditPackage[] = [
  { id: "starter", amount: 25, price: 25, bonus: 0 },
  ...
];

// AFTER (reads from Convex DB):
const packages = useQuery(api.subscriptionTiers.listCreditPackages);

// Map to display shape (tierKey = package id, priceUsd, initialCredits, bonusCredits, polarProductId):
// packages[n].tierKey        → id
// packages[n].priceUsd       → price
// packages[n].initialCredits → base amount (e.g. 250)
// packages[n].bonusCredits   → bonus (e.g. 50)
// packages[n].polarProductId → passed to CheckoutLink instead of env var lookup
```

Remove `getPolarProductId()` function entirely — `polarProductId` now comes directly from the Convex row.

**QA**: `npx tsc --noEmit` + `npx @biomejs/biome check --write components/dashboard/account/modals/PurchaseCreditsModal.tsx`  
**Result**: ✅ Biome clean — TS clean

---

### **Step 6: Update Existing Tests — File-by-File** ✅ DONE

Every change below is derived from reading the actual test files. Each file is listed with its current state and exactly what must change.

---

#### `__tests__/convex/polar-test-helpers.ts` — **MUST UPDATE**

**Current state**:
- `seedTier` (line 39) inserts `{ tierKey, displayName, initialCredits, monthlyCredits, sortOrder, isActive, description, createdAt, updatedAt }` — no `polarProductId`, `productType`, `priceUsd`, `bonusCredits`
- `CREDIT_PACKAGES` (line 22) has comment `"mirrors convex/http.ts"` — after Task 11 `http.ts` has no map, the comment is wrong

**Changes**:

1. Extend `seedTier` opts to accept the 4 new optional fields:
```typescript
opts: {
  tierKey?: string;
  displayName?: string;
  monthlyCredits?: number;
  initialCredits?: number;
  sortOrder?: number;
  // NEW — all optional, matches schema v.optional(...)
  polarProductId?: string;
  productType?: "subscription" | "one_time";
  priceUsd?: number;
  bonusCredits?: number;
}
```
Pass them to `ctx.db.insert("subscriptionTiers", { ..., polarProductId, productType, priceUsd, bonusCredits })`.

2. Update comment on `CREDIT_PACKAGES` (line 21) from:
```typescript
/** Product ID → credit amount map (mirrors convex/http.ts) */
```
to:
```typescript
/** Product ID → total credits reference (authoritative data is subscriptionTiers DB after Task 11) */
```
The values (25, 55, 115, 300) remain correct — they equal `initialCredits + bonusCredits` for each package.

**QA**: `npx tsc --noEmit` + `npx @biomejs/biome check --write __tests__/convex/polar-test-helpers.ts`  
**Result**: ✅ Biome clean — TS clean

---

#### `__tests__/convex/polar-tiers.test.ts` — **MUST UPDATE (add tests)** ✅ DONE

**Current state**: 9 tests, 5 groups covering tier_1/2/3 subscription rows only. `expect(tiers).toHaveLength(3)` in group 1 seeds 3 rows and asserts 3 — still correct (seeds its own in-memory DB).

**Changes — add 3 new test groups after the existing 5**:

**New group 6 — credit package rows exist**:
Seed the 4 one_time rows (credits_starter, credits_popular, credits_pro, credits_enterprise) using `seedTier` with `productType: "one_time"` and the correct `polarProductId`. Then:
```typescript
const packages = await t.run(async (ctx) => {
  return ctx.db
    .query("subscriptionTiers")
    .filter((q) => q.eq(q.field("productType"), "one_time"))
    .collect();
});
expect(packages).toHaveLength(4);
```

**New group 7 — each credit package has valid UUID `polarProductId`** (parametric, 4 cases):
```typescript
it.each([
  ["credits_starter",    "d3b0791a-f692-4564-8690-6f85bc9d435b"],
  ["credits_popular",    "86e14b99-a194-45fe-87e3-466fca2e9bb5"],
  ["credits_pro",        "44da7533-0a4b-4a26-b641-9b45e81c2d07"],
  ["credits_enterprise", "19c982fd-3106-45f2-833d-07b573b45c2b"],
] as const)("%s polarProductId is a valid UUID", async (tierKey, expectedId) => {
  // seed + query by tierKey, assert polarProductId matches and is UUID format
});
```

**New group 8 — `initialCredits + bonusCredits` = expected total** (parametric, 4 cases):
```typescript
it.each([
  ["credits_starter",    25,  0,  25],
  ["credits_popular",    50,  5,  55],
  ["credits_pro",       100, 15, 115],
  ["credits_enterprise", 250, 50, 300],
] as const)("%s: %i + %i = %i total credits", async (tierKey, base, bonus, total) => {
  // seed with initialCredits: base, bonusCredits: bonus
  // query, assert initialCredits + (bonusCredits ?? 0) === total
});
```

**New group 9 — `by_polar_product_id` index works**:
Seed one tier with `polarProductId: "d3b0791a-f692-4564-8690-6f85bc9d435b"`. Query via `.withIndex("by_polar_product_id", q => q.eq("polarProductId", "d3b0791a-..."))`. Assert the returned row has `tierKey: "credits_starter"`.

**QA**: `npx tsc --noEmit` + `npx @biomejs/biome check --write __tests__/convex/polar-tiers.test.ts`  
**Run**: `npx vitest run __tests__/convex/polar-tiers.test.ts` — must be all green before moving on.  
**Result**: ✅ Biome clean — TS clean — **19/19 green**

---

#### `__tests__/convex/polar-credits.test.ts` — **NO CHANGES NEEDED** ✅ CONFIRMED

**Reason**: `addPurchaseCredits` mutation takes an explicit `creditAmount` argument (line 34: `creditAmount: expectedCredits`). Task 11 moves the `productId → creditAmount` lookup from `http.ts` to the DB — but the mutation's interface does NOT change. The test correctly calls the mutation directly with a known `creditAmount`, bypassing the webhook lookup entirely. Tests 1–5 all pass without modification.

---

#### `__tests__/convex/polar-idempotency.test.ts` — **NO CHANGES NEEDED** ✅ CONFIRMED

**Reason**: Tests call `addPurchaseCredits` with `creditAmount: 25` (line 31) and `addMonthlyRenewalCredits`. Neither mutation's interface changes in Task 11. Schema changes are backward-compatible (all new fields are `v.optional`).  
**Result**: ✅ **4/4 green**

---

#### `__tests__/convex/polar-subscriptions.test.ts` — **NO CHANGES NEEDED** ✅ CONFIRMED

**Reason**: Tests subscription CRUD only (`subscriptions.create`, `cancel`, `updateTier`, `getByClerkUserId`). Task 11 modifies `subscriptionTiers` not `subscriptions`. No interface changes.  
**Result**: ✅ **7/7 green**

---

#### `__tests__/convex/polar-product-mapping.test.ts` — **MINOR UPDATE** ✅ DONE

**Current state**:
- Test group 1 (lines 32–43): verifies `CREDIT_PACKAGES` constant has 4 entries and maps IDs to 25/55/115/300
- Tests 2, 3, 4: UUID format, real API call, env vars — **none of these change**

**Change**:
- Rename describe label on line 32 from `"Product ID Mapping: CREDIT_PACKAGES constant"` to `"Product ID Mapping: credit packages reference data"`
- Update test description on line 33 from `"contains exactly 4 credit package product IDs"` to `"reference table has exactly 4 credit package product IDs"`
- Update test description on line 37 from `"maps all 4 product IDs to correct credit amounts"` to `"reference amounts match expected totals (initialCredits + bonusCredits)"` — the values (25, 55, 115, 300) remain correct

These are label-only changes. The assertions themselves are unchanged.

**QA**: `npx tsc --noEmit` + `npx @biomejs/biome check --write __tests__/convex/polar-product-mapping.test.ts`  
**Run**: `npx vitest run __tests__/convex/polar-product-mapping.test.ts` — must stay 17/17.  
**Result**: ✅ Biome clean — TS clean — **17/17 green**

---

#### Summary table

| File | Action | Reason |
|------|--------|--------|
| `polar-test-helpers.ts` | Extend `seedTier` opts + update comment | New schema fields are optional — seedTier must support them |
| `polar-tiers.test.ts` | Add 4 new test groups (16+ new tests) | New rows and new fields need coverage |
| `polar-credits.test.ts` | **No changes** | Mutation interface unchanged; creditAmount still explicit arg |
| `polar-idempotency.test.ts` | **No changes** | Mutation interfaces unchanged |
| `polar-subscriptions.test.ts` | **No changes** | Tests subscriptions table, not subscriptionTiers |
| `polar-product-mapping.test.ts` | Rename 2 describe/it labels | CREDIT_PACKAGES is now reference data, not a mirror of http.ts |

**QA after each file**: `npx tsc --noEmit` + `npx @biomejs/biome check --write <file>`

---

### **Definition of Done for Task 11**

**Backend / Schema**
- [x] `convex/schema.ts` — `subscriptionTiers` has `polarProductId`, `productType`, `priceUsd`, `bonusCredits`, `by_polar_product_id` index
- [x] `convex/seedCredits.ts` — `patchSubscriptionTiersPolarIds` mutation exists and has been run against dev DB
- [x] Convex DB (dev) — `subscriptionTiers` has 7 rows: 3 subscriptions + 4 credit packages, all with `polarProductId`
- [x] `convex/subscriptionTiers.ts` — `getByPolarProductId` (internal), `listCreditPackages` (public), `listSubscriptionPlans` (public) exist

**Files with hardcoded data — removed**
- [x] `convex/http.ts` — `creditPackages` inline map removed; replaced with `ctx.runQuery(internal.subscriptionTiers.getByPolarProductId, ...)`
- [x] `PurchaseCreditsModal.tsx` — hardcoded `creditPackages` array removed; replaced with `useQuery(api.subscriptionTiers.listCreditPackages)`; `getPolarProductId()` function deleted

**Tests**
- [x] `polar-test-helpers.ts` — `seedTier` accepts `polarProductId`, `productType`, `priceUsd`, `bonusCredits`; `CREDIT_PACKAGES` comment updated
- [x] `polar-tiers.test.ts` — 4 new test groups added (credit package rows exist / UUID polarProductIds / initialCredits+bonusCredits totals / by_polar_product_id index) — **19/19 green**
- [x] `polar-credits.test.ts` — unchanged, all 12 tests still green
- [x] `polar-idempotency.test.ts` — unchanged, all 4 tests still green
- [x] `polar-subscriptions.test.ts` — unchanged, all 7 tests still green
- [x] `polar-product-mapping.test.ts` — 2 describe/it labels updated, all 17 tests still green
- [x] `npx vitest run` — **290/291 green** (1 pre-existing unrelated failure in `videoGeneration.test.ts`)
- [x] `npx tsc --noEmit` — clean
- [x] `npx @biomejs/biome check` — clean

---

## ⚠️ Task 12: Fix deleteAccount — Subscription Cancellation + Data Cleanup

**Status**: ✅ DONE — 5/5 tests green, TypeScript clean, Biome clean, deployed  
**Priority**: 🔴 BLOCKING — Users can delete account and keep being billed forever  
**Root cause**: `deleteAccount` is a simple mutation that only deletes the Convex `users` document. It does NOT cancel the Polar subscription, does NOT clean up related tables, and does NOT delete the Clerk account.

### **What breaks today**

| What should happen | What actually happens |
|---|---|
| Cancel active Polar subscription | Nothing — billing continues forever |
| Update `subscriptions` record to `canceled` | Nothing — stays `active` |
| Delete `userCredits` record | Nothing — orphaned row |
| Delete `creditTransactions` records | Nothing — orphaned rows |
| Delete Clerk user account | Only `signOut()` — Clerk account survives, user can re-login |

### **Step 1 — Add `cleanupUserData` internalMutation (`convex/users.ts`)**

Deletes all Convex data owned by a given `clerkUserId` in one transaction:
- `subscriptions` (by_clerk_user_id index)
- `userCredits` (by_clerk_user index)
- `creditTransactions` (by_user index)
- `users` record (by_clerk_user_id index)

Must be `internalMutation` (called only from the `deleteAccount` action).

### **Step 2 — Convert `deleteAccount` to action (`convex/users.ts`)**

Sequence (order is critical — user must exist in DB when Polar cancel fires):
1. Get `identity` via `ctx.auth.getUserIdentity()` → get `clerkUserId`
2. Try `ctx.runAction(api.polar.cancelCurrentSubscription)` — wrapped in try/catch (free users have no subscription)
3. `ctx.runMutation(internal.users.cleanupUserData, { clerkUserId })` — delete all Convex data
4. Call Clerk Backend API: `DELETE https://api.clerk.com/v1/users/{clerkUserId}` with `CLERK_SECRET_KEY`

**Required Convex env var**: `CLERK_SECRET_KEY` must be set:
```bash
npx convex env set CLERK_SECRET_KEY sk_test_...
```

### **Step 3 — Update Delete Account Modal (`ProfileTab.tsx`)**

The modal currently shows a generic "This action cannot be undone" message. It must also show:
- If user has an active subscription: "Your **{planName}** subscription will be cancelled immediately"
- If user has credits: "Your **{balance} credits** will be permanently lost"

Requires two `useQuery` hooks in `ProfileTab.tsx`:
- `api.subscriptions.getByClerkUserId` (already exists)
- `api.credits.getUserCredits` (already exists)

Update the `AlertDialogDescription` to render these warnings conditionally.

### **Step 4 — Tests (`__tests__/convex/polar-delete-account.test.ts`)**

5 tests:
1. `cleanupUserData`: deletes subscriptions, userCredits, creditTransactions, users row for the target user
2. `cleanupUserData`: other users' data is NOT touched (isolation)
3. `cleanupUserData`: handles user with no subscription (no error)
4. `cleanupUserData`: handles user with no credits (no error)
5. `deleteAccount` guard: if `cancelCurrentSubscription` throws (free user), cleanup still proceeds

### **2-step QA**

```bash
npx tsc --noEmit
npx @biomejs/biome check --write convex/users.ts components/dashboard/account/tabs/ProfileTab.tsx __tests__/convex/polar-delete-account.test.ts
```

### **Definition of Done for Task 12**

- [x] `cleanupUserData` internalMutation deletes all 4 tables for a given clerkUserId
- [x] `deleteAccount` is an action, not a mutation
- [x] Active Polar subscription cancelled before data deletion (try/catch — free users unaffected)
- [x] Clerk user deleted via Backend API (`DELETE /v1/users/{clerkUserId}`)
- [x] Modal shows active subscription warning (`delete_confirm_active_sub`) and credits warning (`delete_confirm_credits_lost`)
- [x] 5/5 tests green (`__tests__/convex/polar-delete-account.test.ts`)
- [x] TypeScript clean — Biome clean
- [x] Deployed: `npx convex dev --once` ✓
- [x] `CLERK_SECRET_KEY` already set in Convex env vars (verified)

---

Run these checks before marking Sprint 10 complete:

```bash
# 1. Full TypeScript check
npx tsc --noEmit

# 2. Full Biome check
npx @biomejs/biome check --write .

# 3. Run all tests
npx vitest run

# 4. Deploy to Convex dev
npx convex dev --once

# 5. Verify translations
pnpm translate && node scripts/verify-translations.js
```

### **End-to-End Test Checklist**

- [ ] **Subscription Flow**: Click upgrade → checkout modal opens → complete purchase → credits added
- [ ] **Credit Purchase**: Select package → checkout → webhook adds credits → balance updates
- [ ] **Customer Portal**: Click "Manage" → portal opens → can cancel/update subscription
- [ ] **Webhook Resilience**: Verify idempotency (same webhook processed twice = no duplicate credits)
- [ ] **Mobile UX**: All flows work on mobile with proper touch targets
- [ ] **Accessibility**: Screen reader announcements work for all status changes
- [ ] **i18n**: All strings translated in both EN and FR

---

**Last Updated**: February 25, 2026  
**Document Version**: 6.0  
**Status**: 🔧 IN PROGRESS  
**Approach**: @convex-dev/polar component + custom handlers  
**Prerequisites**: ✅ Sprint 9 complete + Install component + Configure Polar products (NO Benefits needed)

---

## ⚠️ Task 13: Security Fix — `initializeForSubscription` + `updateTier` Data Consistency

**Status**: ✅ DONE — TypeScript clean, Biome clean, 12/12 polar-credits still green, deployed  
**Priority**: 🔴 BLOCKING — Confirmed security exploit in production

### **Bug 1 (P0 Security): `initializeForSubscription` is a public `mutation`**

Any authenticated user can call `api.credits.initializeForSubscription({ clerkUserId: "any_user_id", tierKey: "tier_3" })` directly from the Convex client and grant themselves 5,000 Enterprise credits for free (if they have no existing `userCredits` row).

**Root cause**: Function declared as `mutation({...})` instead of `internalMutation({...})`.

**Fix**: Change to `internalMutation` in `convex/credits.ts`. Update `polar-credits.test.ts` to call via `internal.*`.

### **Bug 2 (Data Inconsistency): `updateTier` does not update `userCredits.subscriptionTier`**

When a user upgrades or downgrades, `internal.subscriptions.updateTier` correctly patches `subscriptions.tierKey` but never updates `userCredits.subscriptionTier`. After an upgrade from tier_1 → tier_2, the `userCredits` row still shows `subscriptionTier: "tier_1"`.

**Fix**: Add `ctx.db.query("userCredits")` by `clerkUserId` inside `updateTier` and patch `subscriptionTier` to match the new tierKey.

**Requires**: `clerkUserId` to be passed to `updateTier` (needs to come from the subscription record being patched).

### **2-step QA**

```bash
npx tsc --noEmit
npx @biomejs/biome check --write convex/credits.ts convex/subscriptions.ts __tests__/convex/polar-credits.test.ts
```

### **Definition of Done for Task 13**

- [x] `initializeForSubscription` is `internalMutation` — not accessible via `api.*`
- [x] `updateTier` patches `userCredits.subscriptionTier` when clerkUserId resolved
- [x] `polar-credits.test.ts` updated to use `internal.credits.initializeForSubscription`
- [x] TypeScript clean — Biome clean
- [x] Deployed: `npx convex dev --once`

---

## ⚠️ Task 14: Additional Test Coverage — Security, Edge Cases, State Transitions

**Status**: ✅ DONE — 14/14 green (5+5+4), TypeScript clean, Biome clean, deployed  
**Priority**: 🔴 BLOCKING — 14 untested scenarios, several covering real production risks

### **Scope**

Three new test files covering scenarios NOT addressed by the existing 9 test files:

| File | Tests | What it covers |
|---|---|---|
| `polar-security.test.ts` | 5 | `initializeForSubscription` idempotency + exploit guard, deactivated tier, missing user/metadata |
| `polar-edge-cases.test.ts` | 5 | `past_due` status, unknown productId, non-cycle billing skip, zombie user, monthly renewal accumulation |
| `polar-state-transitions.test.ts` | 4 | Downgrade credits preserved, tier lifecycle, cancel preserves credits, updateTier patches userCredits |

### **What is intentionally NOT tested here (and why)**

| Scenario | Why excluded |
|---|---|
| Webhook signature verification | Handled automatically by `@convex-dev/polar` — not our code to test |
| Real concurrency / race conditions | `convex-test` is single-threaded; requires integration environment |
| Browser back button / swipe-down | Requires e2e/Playwright tests — out of scope for unit layer |
| Clerk/Polar API timeouts | Requires real network failure injection — integration only |
| Number overflow (`balance > MAX_SAFE_INTEGER`) | No arithmetic in our mutation; `v.number()` is JavaScript float64; risk is negligible |

### **Task 14a: `polar-security.test.ts` (5 tests)**

1. `initializeForSubscription` with existing credits → balance NOT changed (idempotency)
2. `initializeForSubscription` with unknown tier → returns `{ success: false }`, no credits row created
3. `order.paid` for deactivated tier (`isActive: false`) → `getByPolarProductId` returns null → no credits
4. `order.paid` for user not in Convex DB (convexId exists in metadata but deleted) → returns early
5. `order.paid` for missing userId in customer metadata → returns early, no credits

### **Task 14b: `polar-edge-cases.test.ts` (5 tests)**

1. `subscription.updated` with `status: "past_due"` → `updateTier` NOT called, `tierKey` unchanged
2. `subscription.updated` with unknown `productId` → `updateTier` NOT called (tier not found)
3. `order.created` with `billingReason: "subscription_update"` (not `subscription_cycle`) → skipped, no credits
4. `order.created` for zombie user (deleted from Convex, metadata still has old convexId) → graceful return
5. Monthly renewal adds to existing balance (credits accumulate, not reset)

### **Task 14c: `polar-state-transitions.test.ts` (4 tests)**

1. Downgrade: user with 3,000 credits, `updateTier` tier_3 → tier_1 → credit balance unchanged (preserved)
2. Upgrade: `updateTier` tier_1 → tier_2 → tier_3 → each step sets correct `tierKey`
3. Cancel: `subscriptions.cancel` updates status but `userCredits` row survives (credits not lost)
4. `updateTier` also patches `userCredits.subscriptionTier` (verifies Bug 2 fix from Task 13)

### **2-step QA per file**

```bash
npx tsc --noEmit
npx @biomejs/biome check --write __tests__/convex/polar-security.test.ts __tests__/convex/polar-edge-cases.test.ts __tests__/convex/polar-state-transitions.test.ts
```

### **Definition of Done for Task 14**

- [x] `polar-security.test.ts` — 5/5 green
- [x] `polar-edge-cases.test.ts` — 5/5 green
- [x] `polar-state-transitions.test.ts` — 4/4 green
- [x] TypeScript clean — Biome clean (all 6 files checked)
- [x] All previous Polar tests still pass: 99/100 (1 pre-existing network failure in sandbox)
- [x] Deployed: `npx convex dev --once`

---

## ✅ Task 15: Fix Remaining Code Gaps — Monthly Credits + Trialing Status

**Status**: ✅ DONE  
**Priority**: 🔴 BLOCKING — Silent data corruption in two paths

### **Bug 1: `addMonthlyRenewalCredits` silently grants 0 credits when `monthlyCredits` is undefined**

`convex/credits.ts` line 711: `const monthlyCredits = tier.monthlyCredits || 0;`

If a `subscriptionTiers` row has `monthlyCredits: undefined` (e.g. a credit package tier accidentally mapped to a renewal), the user's subscription renewal fires, the mutation runs to completion, and 0 credits are added. No error is thrown, no log message indicates failure. The user loses their monthly allocation silently.

**Fix**: Guard explicitly — if `tier.monthlyCredits` is `undefined` or `0`, return `{ success: false, reason: "tier_has_no_monthly_credits" }` and log an error.

### **Bug 2: `subscription.updated` ignores `"trialing"` status**

`convex/http.ts` line 192: guard is `event.data.status === "active"`.

If a user starts a trial subscription for a new tier, Polar fires `subscription.updated` with `status: "trialing"` and the new `productId`. The handler skips `updateTier` entirely — the `subscriptions.tierKey` stays as the old tier. The trial user is billed for tier_2 but the system thinks they are on tier_1.

**Fix**: Change guard to `["active", "trialing"].includes(event.data.status)`.

### **Documentation note: `cleanupUserData` read-limit risk**

`cleanupUserData` uses `.collect()` on `creditTransactions`. Convex mutations can read at most 16,384 documents. Power users with >16,384 transactions (rare at MVP stage) would hit this limit. Not an immediate production risk but must be documented and mitigated before scale. Fix: add `.take(500)` as a safety cap with a warning log.

### **2-step QA**

```bash
npx tsc --noEmit
npx @biomejs/biome check --write convex/credits.ts convex/http.ts convex/users.ts
```

### **Definition of Done for Task 15**

- [ ] `addMonthlyRenewalCredits` returns `{ success: false, reason: "tier_has_no_monthly_credits" }` when `monthlyCredits` is undefined/0
- [ ] `subscription.updated` guard is `["active", "trialing"].includes(status)`
- [ ] `cleanupUserData` uses `.take(500)` cap on `creditTransactions` with warning log
- [ ] TypeScript clean — Biome clean
- [ ] Deployed: `npx convex dev --once`

---

## ✅ Task 16: New Tests — Transaction Error Paths + Credit Guards

**Status**: ✅ DONE  
**Priority**: 🔴 BLOCKING — 7 untested paths identified in analysis

### **Task 16a: `polar-transactions.test.ts` (3 tests)**

1. `addMonthlyRenewalCredits` tier not found → `{ success: false, reason: "tier_not_found" }`
2. `addMonthlyRenewalCredits` with `monthlyCredits: undefined` → `{ success: false, reason: "tier_has_no_monthly_credits" }` (verifies Bug 1 fix)
3. Accounting invariant: after purchase + renewal + deduct, `balance === totalPurchased + totalBonusReceived - totalUsed`

### **Task 16b: `polar-guards.test.ts` (4 tests)**

1. `subscription.updated` with `"trialing"` status → `updateTier` IS called (verifies Bug 2 fix)
2. `deductCredits` with insufficient balance → `{ success: false, error: "Insufficient credits" }` (explicit test for existing guard)
3. `deductCredits` balance reaches exactly 0 — no negative balance (boundary condition)
4. `cleanupUserData` with 100 `creditTransactions` → completes without error (scale guard)

### **2-step QA per file**

```bash
npx tsc --noEmit
npx @biomejs/biome check --write __tests__/convex/polar-transactions.test.ts __tests__/convex/polar-guards.test.ts
```

### **Definition of Done for Task 16**

- [ ] `polar-transactions.test.ts` — 3/3 green
- [ ] `polar-guards.test.ts` — 4/4 green
- [ ] TypeScript clean — Biome clean
- [ ] All previous Polar tests still pass
- [ ] Deployed: `npx convex dev --once`

---

---

## ✅ Task 17: UI Component Tests — SubscriptionTab

**Status**: ✅ DONE  
**Priority**: 🟠 HIGH — covers the primary subscription UI surface

### **Scope**

File: `__tests__/components/dashboard/SubscriptionTab.test.tsx`

Tests the `SubscriptionTab` component in isolation using mocked Convex queries and mocked `@convex-dev/polar/react` components (no real network calls).

**Test cases (6 tests):**

1. Shows "Free / Inactive" when `useQuery` returns `undefined` (loading state)
2. Shows "Free / Inactive" when subscription is `null` (no subscription)
3. Shows plan name + "Active" badge when subscription is active
4. Shows correct price for each tier (starter $9.99, pro $29.99, enterprise $99.99)
5. "Manage Subscription" button opens the ManageSubscriptionModal
6. Payment method + billing history sections only render when subscription exists

### **Key mocks required**

- `convex/react` → `useQuery` vi.fn()
- `next-intl` → `useTranslations: () => (key: string) => key`
- `@/contexts/DeviceContext` → `useDevice: () => ({ isMobile: false })`
- `@/hooks/useDateFormatter` → `useDateFormatter: () => ({ formatShort: () => "Jan 1, 2025" })`
- `@convex-dev/polar/react` → `CustomerPortalLink: ({ children }) => children`
- `@/components/dashboard/account/modals/ManageSubscriptionModal` → stub

### **2-step QA**

```bash
npx tsc --noEmit
npx @biomejs/biome check --write __tests__/components/dashboard/SubscriptionTab.test.tsx
```

### **Definition of Done for Task 17**

- [ ] 6/6 tests green
- [ ] TypeScript clean — Biome clean
- [ ] All previous tests still pass

---

## ✅ Task 18: UI Component Tests — PurchaseCreditsModal

**Status**: ✅ DONE  
**Priority**: 🟠 HIGH — covers the credit purchase flow UI

### **Scope**

File: `__tests__/components/dashboard/PurchaseCreditsModal.test.tsx`

Tests the `PurchaseCreditsModal` component with mocked Convex queries returning seeded package data.

**Test cases (5 tests):**

1. Shows loading spinner when `packages` is `undefined`
2. Renders all packages from Convex query (no hardcoded data in component)
3. Correct total credits displayed: `initialCredits + bonusCredits` per package
4. Selecting a package highlights it (selected state)
5. "Purchase Credits" button is disabled when no package has a `polarProductId`

### **Key mocks required**

- `convex/react` → `useQuery` returning mock packages array
- `@/contexts/DeviceContext` → `useDevice: () => ({ isMobile: false })`
- `@convex-dev/polar/react` → `CheckoutLink: ({ children }) => children`
- `@/convex/_generated/api` → stub

### **2-step QA**

```bash
npx tsc --noEmit
npx @biomejs/biome check --write __tests__/components/dashboard/PurchaseCreditsModal.test.tsx
```

### **Definition of Done for Task 18**

- [ ] 5/5 tests green
- [ ] TypeScript clean — Biome clean
- [ ] All previous tests still pass

---

## ✅ Task 19: UI Component Tests — ManageSubscriptionModal

**Status**: ✅ DONE  
**Priority**: 🟠 HIGH — covers upgrade/downgrade/cancel UI logic

### **Scope**

File: `__tests__/components/dashboard/ManageSubscriptionModal.test.tsx`

Tests the `ManageSubscriptionModal` component covering plan rendering, CTA labels, and cancel confirmation state.

**Test cases (6 tests):**

1. Shows loading spinner when `dbTiers` is `undefined`
2. Renders all plans (free + 3 DB tiers) once data loads
3. Current plan card shows "Current Plan" badge (not an action button)
4. Higher-tier plan shows "Upgrade" button; lower-tier shows "Downgrade" button
5. Cancel subscription button renders when `currentPlan !== "free"`
6. Clicking cancel shows the confirmation dialog (not the plan list)

### **Key mocks required**

- `convex/react` → `useQuery` returning mock tiers, `useAction` returning vi.fn()
- `next-intl` → `useTranslations: () => (key: string) => key`
- `@/contexts/DeviceContext` → `useDevice: () => ({ isMobile: false })`
- `@convex-dev/polar/react` → `CheckoutLink: ({ children }) => children`
- `@/convex/_generated/api` → stub

### **2-step QA**

```bash
npx tsc --noEmit
npx @biomejs/biome check --write __tests__/components/dashboard/ManageSubscriptionModal.test.tsx
```

### **Definition of Done for Task 19**

- [ ] 6/6 tests green
- [ ] TypeScript clean — Biome clean
- [ ] All previous tests still pass

---

*Sprint 10 enables real subscription management via the @convex-dev/polar component with automatic credit allocation, unlocking monetization for MyShortReel with minimal maintenance burden.* 💳✨

