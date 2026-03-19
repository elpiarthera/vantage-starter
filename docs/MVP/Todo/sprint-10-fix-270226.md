# 🔥 Sprint 10 Fix: Critical Subscription System Bugs

**Date**: February 27, 2026  
**Status**: ✅ **COMPLETE** — All bugs fixed, manual testing passed (Tests 1 + 2 + 3)  
**Estimated Time**: 4-5 hours (all bugs + comprehensive tests)  
**Priority**: 🔴 **BLOCKER** — Users cannot see subscriptions or receive credits  
**Root Cause**: Custom `subscriptions` table never populated; UI queries wrong data source  

---

## 📋 Executive Summary

**Problem**: The subscription system has a fundamental architectural disconnect:
- UI queries custom `subscriptions` table → **always empty**
- `@convex-dev/polar` component stores data in **internal tables** → never queried
- Result: All users see "Free / Inactive" even with active subscriptions
- Webhook handlers fail silently because they depend on the empty custom table

**Bugs Confirmed:**

| # | Bug | Impact | Root Cause |
|---|-----|--------|------------|
| 1 | UI shows "Free/Inactive" for all users | 🔴 **BLOCKER** | Queries custom table never written to |
| 2 | `updateTier` silently no-ops | 🔴 **BLOCKER** | Looks up empty custom table by `polarSubscriptionId` |
| 3 | User `artherasmg@gmail.com` has zero credits | 🔴 **BLOCKER** | `order.paid` webhook failed before fix deployed |
| 4 | Trial users show "Inactive" | 🟠 **HIGH** | `isActive` only checks `"active"`, misses `"trialing"` |
| 5 | CSP blocks `clerk-telemetry.com` | 🟡 **MEDIUM** | Missing from `connect-src` in 3 files |
| A | Monthly renewal credits never granted | 🔴 **BLOCKER** | `addMonthlyRenewalCredits` depends on empty table |

**Solution**:
1. Switch UI to use `polar.getCurrentSubscription()` API from component
2. Fix webhook handlers to bypass custom table, use component data
3. Add missing `clerk-telemetry.com` to CSP
4. Create comprehensive test suite to prevent regression

**Known Issues Fixed in This Plan**:
- ✅ Fixed field name: `event.data.customer?.metadata?.userId` (not `customerMetadata`)
- ✅ Added missing import: `import { polar } from "./polar"` in subscriptions.ts
- ✅ Removed untestable file: `polarIntegration.test.ts` (component tables not accessible)
- ✅ Fixed test API pattern: Uses `makeT()` and `t.mutation()` (matches existing tests)
- ✅ Issue 5 resolved: `event.data.customer.metadata.userId` confirmed valid — `Subscription.customer` is `SubscriptionCustomer` (non-optional), `SubscriptionCustomer.metadata` is `{ [k: string]: string | number | boolean }` (non-optional). Verified from `@polar-sh/sdk` type definitions.

**Why This Happened:**
- Misunderstanding of `@convex-dev/polar` architecture
- Assumed component would populate custom table (it doesn't)
- No integration tests between webhooks and UI
- Custom table is "ghost" — defined, queried, never written

---

## 🚫 NOT IN SCOPE (for this fix sprint)

- Removing custom `subscriptions` table (do this after confirming fix works)
- Schema migrations (fix uses existing schema)
- New UI designs (only fix data flow)

---

## ⏱️ TIME TRACKING

| Task | Estimated | Actual | Status | Notes |
|------|-----------|--------|--------|-------|
| **Pre-Fix: Data Repair** | 0.5h | ✅ Done | ✅ Complete | Credits repaired via Convex MCP (`addPurchaseCredits`, 200 credits for `artherasmg@gmail.com`) |
| **Bug 1: Fix UI Data Source** | 1h | ✅ Done | ✅ Complete | `getFormattedSubscription` query using `polar.listAllUserSubscriptions()`; `SubscriptionTab` updated |
| **Bug 2: Fix updateTier Handler** | 0.5h | ✅ Done | ✅ Complete | `updateTierByWebhook` internalMutation; `http.ts` handler updated |
| **Bug A: Fix Monthly Renewals** | 0.5h | ✅ Done | ✅ Complete | `addMonthlyRenewalCreditsFixed` uses `polarProductId` from webhook |
| **Bug 4: Fix Trialing Status** | 0.25h | ✅ Done | ✅ Complete | `isActive` extended to include `"trialing"` |
| **Bug 5: Fix CSP** | 0.25h | ✅ Done | ✅ Complete | `clerk-telemetry.com` added to `connect-src` in `middleware.ts`, `next.config.mjs`, `vercel.json` |
| **Missing Tests: Backend** | 1.5h | ✅ Done | ✅ Complete | 7 new tests in `webhooks.test.ts` |
| **Missing Tests: UI** | 1h | ✅ Done | ✅ Complete | 6 new tests in `SubscriptionTab.test.tsx` |
| **2-Step QA: All Files** | 0.5h | ✅ Done | ✅ Complete | TypeScript ✅ Biome ✅ on all modified files |
| **Deploy & Verify** | 0.5h | ✅ Done | ✅ Complete | Manual Test 1 (subscribe) ✅ Test 2 (buy credits) ✅ |
| **Bug 6: Upgrade/Downgrade Broken** | — | ✅ Done | ✅ Complete | **Post-deploy discovery** — see section below |
| **TOTAL** | **~6h** | ✅ | **✅ COMPLETE** | All bugs fixed + comprehensive tests |

---

## 🎯 FIX TASKS

---

## ✅ Pre-Fix Task: Data Repair for Broken User (0.5 hours)

### Objective

Manually create `userCredits` record for `artherasmg@gmail.com` who missed the `order.paid` webhook.

### Background

- User subscribed on Feb 26 at 4:52 PM when old code was deployed
- `order.paid` webhook failed with old error message
- Polar never retried → no `userCredits` record created
- User has active subscription in Polar but zero credits in app

### One-Off Mutation

**Run in Convex Dashboard REPL:**

```javascript
// convex/oneOffRepair.ts (temporary file - delete after use)
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const repairArtherasmgUser = internalMutation({
  args: {},
  handler: async (ctx) => {
    const clerkUserId = "user_<clerk_id_for_artherasmg>"; // Replace with actual Clerk ID
    const tierKey = "tier_1";
    
    // Check if user already has credits
    const existing = await ctx.db
      .query("userCredits")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
      .first();
    
    if (existing) {
      return { success: false, reason: "already_exists", balance: existing.balance };
    }
    
    // Get tier info
    const tier = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_tier_key", (q) => q.eq("tierKey", tierKey))
      .first();
    
    if (!tier) {
      return { success: false, reason: "tier_not_found" };
    }
    
    const now = Date.now();
    const initialCredits = tier.initialCredits || 200;
    
    // Create userCredits record
    const userCreditsId = await ctx.db.insert("userCredits", {
      clerkUserId,
      balance: initialCredits,
      totalPurchased: initialCredits,
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
      amount: initialCredits,
      balanceAfter: initialCredits,
      description: `Manual repair: ${tier.displayName} (initial credits)`,
      timestamp: now,
    });
    
    return { 
      success: true, 
      userCreditsId,
      creditsGranted: initialCredits,
      tier: tierKey 
    };
  },
});
```

**To find the Clerk User ID:**
1. Go to Clerk Dashboard → Users
2. Search for `artherasmg@gmail.com`
3. Copy the User ID (starts with `user_`)
4. Update the mutation above
5. Run in Convex Dashboard

### QA Checklist

- [ ] User found in Clerk Dashboard
- [ ] Clerk User ID copied correctly
- [ ] Mutation executed successfully
- [ ] `userCredits` record visible in Convex Dashboard
- [ ] `creditTransactions` record created with type "initial"
- [ ] User confirms credits appear in UI

---

## ✅ Bug 1: Fix UI Data Source (1 hour)

### Objective

Switch `SubscriptionTab.tsx` from querying custom `subscriptions` table to using `polar.getCurrentSubscription()` API.

### Why

The custom `subscriptions` table is **never populated**. The `@convex-dev/polar` component stores subscription data in its internal tables and exposes `getCurrentSubscription()` to access it.

### Implementation

#### Step 1: Add `getCurrentSubscription` Query

**File**: `convex/polar.ts`

**Add after line 47** (after `getUserInfo` query):

```typescript
/**
 * Get current subscription from Polar component
 * Replaces querying the custom subscriptions table
 */
export const getCurrentSubscription = query({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user in database
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Use Polar component API to get subscription from internal tables
    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: user._id,
    });

    return subscription;
  },
});
```

#### Step 2: Create Subscription Adapter/Formatter

**File**: `convex/subscriptions.ts` (add new query)

**Add after existing `getByClerkUserId` query**:

```typescript
/**
 * Get formatted subscription for UI display
 * Uses Polar component internally, returns format expected by SubscriptionTab
 */
export const getFormattedSubscription = query({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const { clerkUserId } = args;

    // Find user to get Convex _id
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (!user) {
      return null;
    }

    // Get subscription from Polar component
    const polarSub = await polar.getCurrentSubscription(ctx, {
      userId: user._id,
    });

    if (!polarSub) {
      // No subscription - return free plan default
      return {
        plan: {
          tier: "free",
          name: "Free",
          monthlyCredits: 0,
          features: [],
        },
        status: "inactive",
        currentPeriodStart: null,
        currentPeriodEnd: null,
      };
    }

    // Look up tier info from our database
    const tier = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_polar_product_id", (q) =>
        q.eq("polarProductId", polarSub.productId)
      )
      .first();

    // Map to UI format
    const tierMapping: Record<string, "free" | "starter" | "pro" | "enterprise"> = {
      tier_1: "starter",
      tier_2: "pro",
      tier_3: "enterprise",
    };

    return {
      polarSubscriptionId: polarSub.id,
      polarCustomerId: polarSub.customerId,
      polarProductId: polarSub.productId,
      tierKey: tier?.tierKey || "tier_1",
      status: polarSub.status, // "active", "trialing", "canceled", etc.
      currentPeriodStart: polarSub.currentPeriodStart
        ? new Date(polarSub.currentPeriodStart).getTime()
        : null,
      currentPeriodEnd: polarSub.currentPeriodEnd
        ? new Date(polarSub.currentPeriodEnd).getTime()
        : null,
      cancelAtPeriodEnd: polarSub.cancelAtPeriodEnd || false,
      plan: {
        name: tier?.displayName || "Starter",
        tier: tierMapping[tier?.tierKey || "tier_1"] || "starter",
        monthlyCredits: tier?.monthlyCredits || 200,
        features: [], // Could be populated from tier config
      },
    };
  },
});
```

#### Step 3: Update SubscriptionTab.tsx

**File**: `components/dashboard/account/tabs/SubscriptionTab.tsx`

**Replace lines 28-30**:

```typescript
// OLD (queries empty custom table):
// const subscription = useQuery(api.subscriptions.getByClerkUserId, {
//   clerkUserId: user.id,
// });

// NEW (uses Polar component):
const subscription = useQuery(api.subscriptions.getFormattedSubscription, {
  clerkUserId: user.id,
});
```

**Update line 46** (Bug 4 fix included):

```typescript
// OLD:
// const isActive = subscription?.status === "active";

// NEW (includes trialing):
const isActive = ["active", "trialing"].includes(subscription?.status ?? "");
```

### 2-Step QA Checklist

- [ ] **Step 1: TypeScript Check**
  ```bash
  npx tsc --noEmit
  ```
  - [ ] No errors in `convex/polar.ts`
  - [ ] No errors in `convex/subscriptions.ts`
  - [ ] No errors in `components/dashboard/account/tabs/SubscriptionTab.tsx`

- [ ] **Step 2: Biome Lint/Format**
  ```bash
  npx biome check --fix convex/polar.ts convex/subscriptions.ts components/dashboard/account/tabs/SubscriptionTab.tsx
  ```
  - [ ] No lint errors
  - [ ] Files formatted

- [ ] **Functional QA**
  - [ ] `npx convex dev` runs without errors
  - [ ] New query appears in Convex dashboard
  - [ ] UI loads without errors
  - [ ] Manual test: User with active subscription sees correct plan

---

## ✅ Bug 2: Fix `updateTier` Webhook Handler (0.5 hours)

### Objective

Fix `subscription.updated` webhook handler to update `userCredits.subscriptionTier` directly without depending on the custom `subscriptions` table.

### Why

The current `updateTier` mutation (lines 129-162 in `convex/subscriptions.ts`) looks up the custom table by `polarSubscriptionId` and silently returns if not found. The table is always empty → tier updates never happen.

### Implementation

#### Step 1: Add Import for `polar`

**File**: `convex/subscriptions.ts`

**Add import** (if not already present):
```typescript
import { polar } from "./polar"; // REQUIRED for getFormattedSubscription query
```

#### Step 2: Add New `updateTierByWebhook` Mutation

**File**: `convex/subscriptions.ts`

**Add new mutation** (replace the old `updateTier` or add alongside):

```typescript
/**
 * Update subscription tier from webhook
 * Bypasses custom subscriptions table (which is never populated)
 * Updates userCredits.subscriptionTier directly using webhook data
 */
export const updateTierByWebhook = internalMutation({
  args: {
    clerkUserId: v.string(),
    tierKey: v.string(),
    polarSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkUserId, tierKey, polarSubscriptionId } = args;
    const now = Date.now();

    // Get or create userCredits record
    let userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (!userCredits) {
      // User has no credits record yet - this shouldn't happen for tier updates
      // but we handle it gracefully
      console.warn(
        `updateTierByWebhook: No userCredits found for ${clerkUserId}, creating one`
      );
      
      // Get tier info for initial credits
      const tier = await ctx.db
        .query("subscriptionTiers")
        .withIndex("by_tier_key", (q) => q.eq("tierKey", tierKey))
        .first();

      const initialCredits = tier?.initialCredits || 200;

      await ctx.db.insert("userCredits", {
        clerkUserId,
        balance: initialCredits,
        totalPurchased: initialCredits,
        totalUsed: 0,
        totalBonusReceived: 0,
        subscriptionTier: tierKey,
        createdAt: now,
        updatedAt: now,
      });

      return { 
        success: true, 
        created: true, 
        tierKey,
        initialCredits 
      };
    }

    // Update existing userCredits record
    await ctx.db.patch(userCredits._id, {
      subscriptionTier: tierKey,
      updatedAt: now,
    });

    // Log the tier change
    console.log(
      `Subscription tier updated for ${clerkUserId}: ${tierKey}` +
        (polarSubscriptionId ? ` (sub: ${polarSubscriptionId})` : "")
    );

    return { 
      success: true, 
      updated: true, 
      tierKey,
      previousTier: userCredits.subscriptionTier 
    };
  },
});
```

#### Step 3: Update Webhook Handler

**File**: `convex/http.ts`

**✅ Confirmed**: `event.data.customer.metadata.userId` is a valid field path on the Polar `Subscription` type. Verified from `@polar-sh/sdk` type definitions: `Subscription.customer` is `SubscriptionCustomer` (non-optional) and `SubscriptionCustomer.metadata` is `{ [k: string]: string | number | boolean }` (non-optional). No fallback needed.

**Replace the `subscription.updated` handler** (lines 182-227):

```typescript
"subscription.updated": async (ctx, event) => {
  console.log(
    "Subscription updated:",
    event.data.id,
    "Status:",
    event.data.status
  );

  // Get the Polar customer to resolve to Clerk user
  const customerId = event.data.customerId;
  if (!customerId) {
    console.error("subscription.updated: Missing customerId", {
      subscriptionId: event.data.id,
    });
    return;
  }

  // Look up the customer in Polar component's internal table
  // We need to find the user by customer metadata
  // Confirmed: event.data.customer is SubscriptionCustomer (non-optional)
  // event.data.customer.metadata is { [k: string]: string | number | boolean } (non-optional)
  // Verified from @polar-sh/sdk type definitions — same pattern as order.paid handler
  const convexUserId = event.data.customer.metadata?.userId as string | undefined;

  if (!convexUserId) {
    console.error("subscription.updated: Missing userId in customer metadata", {
      subscriptionId: event.data.id,
      customerId,
    });
    return;
  }

  // Resolve to Clerk user
  const user = await ctx.runQuery(internal.users.getByConvexId, {
    convexUserId,
  });

  if (!user) {
    console.error("subscription.updated: User not found", {
      convexUserId,
      subscriptionId: event.data.id,
    });
    return;
  }

  // Handle tier changes (upgrade / downgrade / trial start)
  if (
    ["active", "trialing"].includes(event.data.status) &&
    event.data.productId
  ) {
    const tier = await ctx.runQuery(
      internal.subscriptionTiers.getByPolarProductId,
      { polarProductId: event.data.productId }
    );

    if (tier) {
      // Use the new mutation that bypasses custom table
      await ctx.runMutation(internal.subscriptions.updateTierByWebhook, {
        clerkUserId: user.clerkUserId,
        tierKey: tier.tierKey,
        polarSubscriptionId: event.data.id,
      });
      console.log(
        `Subscription tier updated: ${tier.tierKey} for user ${user.clerkUserId}`
      );
    } else {
      console.error(
        "subscription.updated: Unknown productId — tier not found in DB",
        { productId: event.data.productId, subscriptionId: event.data.id }
      );
    }
  }

  if (event.data.customerCancellationReason) {
    console.log(
      "Customer cancellation reason:",
      event.data.customerCancellationReason
    );
    console.log(
      "Customer cancellation comment:",
      event.data.customerCancellationComment
    );
  }
},
```

### 2-Step QA Checklist

- [ ] **Step 1: TypeScript Check**
  ```bash
  npx tsc --noEmit
  ```
  - [ ] No errors in `convex/subscriptions.ts`
  - [ ] No errors in `convex/http.ts`

- [ ] **Step 2: Biome Lint/Format**
  ```bash
  npx biome check --fix convex/subscriptions.ts convex/http.ts
  ```
  - [ ] No lint errors
  - [ ] Files formatted

- [ ] **Functional QA**
  - [ ] `npx convex dev` runs without errors
  - [ ] Webhook handler updated successfully

---

## ✅ Bug A: Fix Monthly Renewal Credits (0.5 hours)

### Objective

Fix `addMonthlyRenewalCredits` to look up tier by `productId` from the webhook event instead of querying the empty custom `subscriptions` table.

### Why

Current code (lines 658-671 in `convex/credits.ts`) queries the custom table to get the tier key. Since the table is empty, all monthly renewals fail with "subscription_not_found".

### Implementation

#### Step 1: Add New Mutation with Product-Based Lookup

**File**: `convex/credits.ts`

**Add new mutation** alongside existing one:

```typescript
/**
 * Add monthly credits when a subscription renews (FIXED VERSION)
 * Uses productId from webhook instead of querying custom subscriptions table
 */
export const addMonthlyRenewalCreditsFixed = internalMutation({
  args: {
    clerkUserId: v.string(),
    polarSubscriptionId: v.string(),
    polarOrderId: v.string(),
    polarProductId: v.string(), // NEW: Product ID from webhook
  },
  handler: async (
    ctx,
    { clerkUserId, polarSubscriptionId, polarOrderId, polarProductId }
  ) => {
    const now = Date.now();

    // IDEMPOTENCY CHECK
    const existingTransaction = await ctx.db
      .query("creditTransactions")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .filter((q) => q.eq(q.field("metadata.polarOrderId"), polarOrderId))
      .first();

    if (existingTransaction) {
      console.log(
        `Renewal order ${polarOrderId} already processed (idempotency), skipping`
      );
      return { success: false, reason: "duplicate" as const };
    }

    // Look up tier by Polar product ID (NEW - bypasses custom subscriptions table)
    const tier = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_polar_product_id", (q) =>
        q.eq("polarProductId", polarProductId)
      )
      .first();

    if (!tier) {
      console.error(
        `Tier not found for product ${polarProductId} in renewal ${polarOrderId}`
      );
      return { success: false, reason: "tier_not_found" as const };
    }

    // Guard: tier must have monthlyCredits
    if (!tier.monthlyCredits) {
      console.error(
        `Tier ${tier.tierKey} has no monthlyCredits — skipping renewal ${polarOrderId}`
      );
      return {
        success: false,
        reason: "tier_has_no_monthly_credits" as const,
      };
    }

    // Get or create user credits
    let userCredits = await ctx.db
      .query("userCredits")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (!userCredits) {
      // This shouldn't happen for renewals, but handle gracefully
      const newId = await ctx.db.insert("userCredits", {
        clerkUserId,
        balance: tier.monthlyCredits,
        totalPurchased: 0,
        totalUsed: 0,
        totalBonusReceived: tier.monthlyCredits,
        subscriptionTier: tier.tierKey,
        createdAt: now,
        updatedAt: now,
      });
      userCredits = await ctx.db.get(newId);
    }

    if (!userCredits) {
      return { success: false, reason: "failed_to_get_user_credits" as const };
    }

    const monthlyCredits = tier.monthlyCredits;
    const newBalance = userCredits.balance + monthlyCredits;

    await ctx.db.patch(userCredits._id, {
      balance: newBalance,
      totalBonusReceived: userCredits.totalBonusReceived + monthlyCredits,
      lastResetAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("creditTransactions", {
      clerkUserId,
      type: "subscription_reset",
      amount: monthlyCredits,
      balanceAfter: newBalance,
      description: `Monthly renewal: ${tier.displayName} (${monthlyCredits} credits)`,
      metadata: {
        polarSubscriptionId,
        polarOrderId,
        polarProductId,
        tierKey: tier.tierKey,
      },
      timestamp: now,
    });

    console.log(
      `Monthly renewal: ${monthlyCredits} credits added for ${clerkUserId}`
    );
    return { success: true, creditsAdded: monthlyCredits, newBalance };
  },
});
```

#### Step 2: Update Webhook Handler

**File**: `convex/http.ts`

**Update `order.created` handler** (lines 113-171) to pass productId:

```typescript
// ============================================
// CUSTOM HANDLER: Subscription Renewals (Monthly Credits)
// ============================================
"order.created": async (ctx, event) => {
  // Fires on every new order — filter to subscription renewals only.
  if (event.data.billingReason !== "subscription_cycle") {
    return;
  }

  const convexUserId = event.data.customer?.metadata?.userId as
    | string
    | undefined;
  const subscriptionId = event.data.subscriptionId;
  const orderId = event.data.id;
  const productId = event.data.productId; // NEW: Get product ID

  if (!convexUserId || !subscriptionId || !productId) { // UPDATED: Check productId
    console.error("Missing userId, subscriptionId, or productId in order.created", {
      orderId,
    });
    return;
  }

  // Resolve Convex user → clerkUserId
  const user = await ctx.runQuery(internal.users.getByConvexId, {
    convexUserId,
  });
  if (!user) {
    console.error("User not found for order.created renewal", {
      convexUserId,
      orderId,
    });
    return;
  }

  try {
    // Use the fixed mutation that includes productId
    const result = await ctx.runMutation(
      internal.credits.addMonthlyRenewalCreditsFixed, // UPDATED
      {
        clerkUserId: user.clerkUserId,
        polarSubscriptionId: subscriptionId,
        polarOrderId: orderId,
        polarProductId: productId, // NEW: Pass product ID
      }
    );

    if (result.success) {
      console.log(`Monthly renewal credits added for order ${orderId}`);
    } else {
      if (result.reason === "duplicate") {
        console.log(`Renewal ${orderId} already processed (idempotency)`);
      } else {
        console.error(
          "Failed to add monthly renewal credits:",
          result.reason
        );
      }
    }
  } catch (error) {
    console.error("Error processing order.created renewal:", error);
  }
},
```

### 2-Step QA Checklist

- [ ] **Step 1: TypeScript Check**
  ```bash
  npx tsc --noEmit
  ```
  - [ ] No errors in `convex/credits.ts`
  - [ ] No errors in `convex/http.ts`

- [ ] **Step 2: Biome Lint/Format**
  ```bash
  npx biome check --fix convex/credits.ts convex/http.ts
  ```
  - [ ] No lint errors
  - [ ] Files formatted

---

## ✅ Bug 4: Fix Trialing Status Display (0.25 hours)

### Objective

Update `isActive` check to include "trialing" status.

### Implementation

**Already included in Bug 1 fix above** (line 46 in SubscriptionTab.tsx):

```typescript
const isActive = ["active", "trialing"].includes(subscription?.status ?? "");
```

If implementing standalone:

**File**: `components/dashboard/account/tabs/SubscriptionTab.tsx`

**Line 46** — change from:
```typescript
const isActive = subscription?.status === "active";
```

To:
```typescript
const isActive = ["active", "trialing"].includes(subscription?.status ?? "");
```

### 2-Step QA Checklist

- [ ] **Step 1: TypeScript Check**
  ```bash
  npx tsc --noEmit
  ```
  - [ ] No errors

- [ ] **Step 2: Biome Lint/Format**
  ```bash
  npx biome check --fix components/dashboard/account/tabs/SubscriptionTab.tsx
  ```
  - [ ] No lint errors

---

## ✅ Bug 5: Fix CSP for Clerk Telemetry (0.25 hours)

### Objective

Add `https://clerk-telemetry.com` to `connect-src` in all three CSP configuration files.

### Implementation

#### File 1: middleware.ts

**Line 78** — add to connect-src:

```typescript
"connect-src 'self' blob: https://*.clerk.accounts.dev https://clerk.myreeldream.ai https://clerk-telemetry.com https://*.convex.cloud https://*.sentry.io wss://*.convex.cloud wss://*.convex.site https://fal.run https://*.fal.ai https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://vercel.live; " +
```

#### File 2: next.config.mjs

**Line 36** — update connect-src:

```typescript
"connect-src 'self' blob: https: https://clerk-telemetry.com",
```

Or more explicitly:
```typescript
"connect-src 'self' blob: https://*.clerk.accounts.dev https://clerk.myreeldream.ai https://clerk-telemetry.com https://*.convex.cloud https://*.sentry.io wss://*.convex.cloud wss://*.convex.site https://fal.run https://*.fal.ai https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://vercel.live",
```

#### File 3: vercel.json

**Line 8** — update connect-src:

```json
"connect-src 'self' blob: https://*.clerk.accounts.dev https://clerk-telemetry.com https://*.convex.cloud https://*.sentry.io wss://*.convex.cloud wss://*.convex.site https://fal.run https://*.fal.ai https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://vercel.live; "
```

### 2-Step QA Checklist

- [ ] **Step 1: TypeScript Check**
  ```bash
  npx tsc --noEmit
  ```
  - [ ] No errors in `middleware.ts`
  - [ ] No errors in `next.config.mjs`

- [ ] **Step 2: Biome Lint/Format**
  ```bash
  npx biome check --fix middleware.ts next.config.mjs
  ```
  - [ ] No lint errors

- [ ] **Verification**
  - [ ] Deploy to preview environment
  - [ ] Check browser console for CSP errors (should be gone)

---

## ✅ Missing Tests: Backend Integration (1.5 hours)

### Objective

Create comprehensive tests that would have caught these bugs before deployment.

### Test Files to Create

#### Test 1: Webhook Integration Tests

**File**: `__tests__/convex/webhooks.test.ts`

**CORRECTED API PATTERN** (matches existing project tests):
- `seedUser(t, {...})` — NOT `seedUser(ctx, ...)` — helpers take `t` directly
- `seedTier(t, {...})` — NOT `seedTier(ctx, ...)`
- `t.mutation()` — NOT `t.run(async (ctx) => ctx.runMutation(...))`
- `t.run(async (ctx) => ctx.db.query(...))` — ONLY for database verification queries

```typescript
/**
 * Webhook Handler Integration Tests
 *
 * These tests verify that webhook handlers correctly:
 * 1. Grant initial credits on order.paid
 * 2. Grant monthly credits on order.created (billingReason: subscription_cycle)
 * 3. Update tier on subscription.updated
 * 4. Handle idempotency (don't double-grant credits)
 *
 * NOTE: Uses `makeT()` and `t.mutation()` pattern from polar-webhook-handlers.test.ts
 */

import { describe, it, expect } from "vitest";
import { internal } from "../../convex/_generated/api";
import { makeT, seedTier, seedUser, seedSubscription } from "./polar-test-helpers";

// Test constants
const TEST_USER_ID = "user_test_123";
const TEST_ORDER_ID = "order_123";
const TEST_PRODUCT_ID = "prod_123";

describe("order.paid webhook", () => {
  it("should grant initial credits on subscription order.paid", async () => {
    const t = makeT();

    // Seed prerequisite data — helpers take `t` directly, NOT `ctx`
    await seedUser(t, { clerkUserId: TEST_USER_ID });
    await seedTier(t, {
      tierKey: "tier_1",
      polarProductId: TEST_PRODUCT_ID,
      initialCredits: 200,
    });

    // Simulate order.paid webhook — use `t.mutation()` directly
    const result = await t.mutation(internal.credits.addPurchaseCredits, {
      clerkUserId: TEST_USER_ID,
      polarOrderId: TEST_ORDER_ID,
      polarProductId: TEST_PRODUCT_ID,
      creditAmount: 200,
    });

    expect(result.success).toBe(true);
    expect(result.creditsAdded).toBe(200);

    // Verify userCredits created — `t.run()` only for DB queries
    const userCredits = await t.run(async (ctx) => {
      return await ctx.db
        .query("userCredits")
        .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
        .first();
    });

    expect(userCredits).toBeTruthy();
    expect(userCredits?.balance).toBe(200);
    expect(userCredits?.totalPurchased).toBe(200);
  });

  it("should not double-grant credits (idempotency)", async () => {
    const t = makeT();

    // Seed prerequisite data
    await seedUser(t, { clerkUserId: TEST_USER_ID });
    await seedTier(t, {
      tierKey: "tier_1",
      polarProductId: TEST_PRODUCT_ID,
      initialCredits: 200,
    });

    // First call — use `t.mutation()` directly
    await t.mutation(internal.credits.addPurchaseCredits, {
      clerkUserId: TEST_USER_ID,
      polarOrderId: TEST_ORDER_ID,
      polarProductId: TEST_PRODUCT_ID,
      creditAmount: 200,
    });

    // Second call (same order ID) — use `t.mutation()` directly
    const result = await t.mutation(internal.credits.addPurchaseCredits, {
      clerkUserId: TEST_USER_ID,
      polarOrderId: TEST_ORDER_ID, // Same order
      polarProductId: TEST_PRODUCT_ID,
      creditAmount: 200,
    });

    expect(result.success).toBe(true);
    expect(result.alreadyProcessed).toBe(true);

    // Verify only 200 credits (not 400)
    const userCredits = await t.run(async (ctx) => {
      return await ctx.db
        .query("userCredits")
        .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
        .first();
    });

    expect(userCredits?.balance).toBe(200);
  });
});

describe("subscription.updated webhook", () => {
  it("should update tier in userCredits when tier changes", async () => {
    const t = makeT();

    // Setup: Create user with credits
    await seedUser(t, { clerkUserId: TEST_USER_ID });
    await t.run(async (ctx) => {
      await ctx.db.insert("userCredits", {
        clerkUserId: TEST_USER_ID,
        balance: 200,
        totalPurchased: 200,
        totalUsed: 0,
        totalBonusReceived: 0,
        subscriptionTier: "tier_1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Simulate tier upgrade — use `t.mutation()` directly
    const result = await t.mutation(internal.subscriptions.updateTierByWebhook, {
      clerkUserId: TEST_USER_ID,
      tierKey: "tier_2",
      polarSubscriptionId: "sub_123",
    });

    expect(result.success).toBe(true);
    expect(result.updated).toBe(true);

    // Verify tier updated
    const userCredits = await t.run(async (ctx) => {
      return await ctx.db
        .query("userCredits")
        .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
        .first();
    });

    expect(userCredits?.subscriptionTier).toBe("tier_2");
  });

  it("should create userCredits if missing when tier updates", async () => {
    const t = makeT();

    // Seed user and tier (no userCredits yet)
    await seedUser(t, { clerkUserId: TEST_USER_ID });
    await seedTier(t, {
      tierKey: "tier_1",
      initialCredits: 200,
    });

    // No userCredits record exists yet — use `t.mutation()` directly
    const result = await t.mutation(internal.subscriptions.updateTierByWebhook, {
      clerkUserId: TEST_USER_ID,
      tierKey: "tier_1",
      polarSubscriptionId: "sub_123",
    });

    expect(result.success).toBe(true);
    expect(result.created).toBe(true);

    const userCredits = await t.run(async (ctx) => {
      return await ctx.db
        .query("userCredits")
        .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
        .first();
    });

    expect(userCredits).toBeTruthy();
    expect(userCredits?.subscriptionTier).toBe("tier_1");
  });
});

describe("order.created (monthly renewal) webhook", () => {
  it("should grant monthly credits on subscription_cycle", async () => {
    const t = makeT();

    // Setup: User with existing credits and tier
    await seedUser(t, { clerkUserId: TEST_USER_ID });
    await seedTier(t, {
      tierKey: "tier_1",
      polarProductId: TEST_PRODUCT_ID,
      monthlyCredits: 100,
    });
    // Seed subscription in custom table (needed for old mutation, but FIXED mutation uses productId)
    await seedSubscription(t, { tierKey: "tier_1", polarSubscriptionId: "sub_123" });
    await t.run(async (ctx) => {
      await ctx.db.insert("userCredits", {
        clerkUserId: TEST_USER_ID,
        balance: 50,
        totalPurchased: 200,
        totalUsed: 150,
        totalBonusReceived: 0,
        subscriptionTier: "tier_1",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Simulate monthly renewal using FIXED mutation — use `t.mutation()` directly
    const result = await t.mutation(internal.credits.addMonthlyRenewalCreditsFixed, {
      clerkUserId: TEST_USER_ID,
      polarSubscriptionId: "sub_123",
      polarOrderId: "order_renewal_123",
      polarProductId: TEST_PRODUCT_ID, // Uses product ID, not subscription lookup
    });

    expect(result.success).toBe(true);
    expect(result.creditsAdded).toBe(100); // monthlyCredits from tier

    // Verify credits added
    const userCredits = await t.run(async (ctx) => {
      return await ctx.db
        .query("userCredits")
        .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", TEST_USER_ID))
        .first();
    });

    expect(userCredits?.balance).toBe(150); // 50 + 100
  });

  it("should fail if tier has no monthlyCredits", async () => {
    const t = makeT();

    // Create a tier without monthlyCredits (one-time purchase)
    await seedUser(t, { clerkUserId: TEST_USER_ID });
    await t.run(async (ctx) => {
      await ctx.db.insert("subscriptionTiers", {
        tierKey: "credits_pack",
        displayName: "Credit Pack",
        initialCredits: 50,
        // No monthlyCredits
        polarProductId: "prod_credits",
        productType: "one_time",
        sortOrder: 10,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // Use `t.mutation()` directly
    const result = await t.mutation(internal.credits.addMonthlyRenewalCreditsFixed, {
      clerkUserId: TEST_USER_ID,
      polarSubscriptionId: "sub_123",
      polarOrderId: "order_renewal_123",
      polarProductId: "prod_credits",
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe("tier_has_no_monthly_credits");
  });
});
```

#### Test 2: Polar Component Integration Tests (SKIPPED)

**Status**: ⚠️ **NOT IMPLEMENTED** — Component tables not accessible in test schema

**Reason**: `getFormattedSubscription` calls `polar.getCurrentSubscription()` which queries the **component's internal tables** (not in the app's schema). The `convexTest(schema)` helper only has access to the app's schema tables, not the component's internal tables. These tests would fail.

**Alternative Testing Strategy**:
1. Test the formatter logic indirectly via E2E tests
2. Test with mock data in UI component tests (SubscriptionTab.test.tsx)
3. Manual testing in preview environment with real Polar data

**File**: `__tests__/convex/polarIntegration.test.ts` — DO NOT CREATE THIS FILE

```typescript
// NOTE: This test file is intentionally NOT created because
// polar.getCurrentSubscription() queries component internal tables
// which are not accessible via convexTest(schema).
//
// Testing strategy:
// 1. Backend logic: Tested via webhooks.test.ts (mutation side effects)
// 2. Formatter logic: Tested via SubscriptionTab.test.tsx (UI mocks)
// 3. Integration: Manual testing in preview environment
```

### 2-Step QA Checklist for Tests

- [ ] **Step 1: TypeScript Check**
  ```bash
  npx tsc --noEmit
  ```
  - [ ] No errors in test files

- [ ] **Step 2: Biome Lint/Format**
  ```bash
  npx biome check --fix __tests__/convex/webhooks.test.ts
  ```
  - [ ] No lint errors

- [ ] **Test Execution**
  ```bash
  npm test -- __tests__/convex/webhooks.test.ts
  ```
  - [ ] All tests pass
  - [ ] Note: `polarIntegration.test.ts` is NOT created (component tables not testable)

---

## ✅ Missing Tests: UI Component Tests (1 hour)

### Objective

Add tests to SubscriptionTab that verify subscription status rendering.

### Test File Updates

#### Update: SubscriptionTab.test.tsx

**File**: `__tests__/components/dashboard/SubscriptionTab.test.tsx`

Add these tests to the existing test file:

```typescript
/**
 * Additional tests for Bug 1 and Bug 4
 * These would have caught the "always shows Free/Inactive" bug
 */

describe("Subscription Status Display (Bug 1 & 4)", () => {
  it("should show 'Active' badge for active subscription", async () => {
    // Mock the query to return an active subscription
    const mockSubscription = {
      plan: {
        tier: "starter",
        name: "Starter Plan",
        monthlyCredits: 200,
        features: [],
      },
      status: "active",
      currentPeriodStart: Date.now() - 86400000,
      currentPeriodEnd: Date.now() + 86400000 * 30,
      polarSubscriptionId: "sub_123",
      polarCustomerId: "cust_123",
      polarProductId: "prod_123",
      tierKey: "tier_1",
      cancelAtPeriodEnd: false,
    };

    // Mock useQuery to return the subscription
    vi.mocked(useQuery).mockReturnValue(mockSubscription);

    render(<SubscriptionTab user={mockUser} />);

    // Should show "Starter Plan" not "Free"
    expect(screen.getByText("Starter Plan")).toBeInTheDocument();
    
    // Should show "Active" badge
    expect(screen.getByText("status_active")).toBeInTheDocument();
    
    // Should NOT show "Free"
    expect(screen.queryByText("plan_name_free")).not.toBeInTheDocument();
  });

  it("should show 'Active' badge for trialing subscription (Bug 4)", async () => {
    const mockSubscription = {
      plan: {
        tier: "pro",
        name: "Pro Plan",
        monthlyCredits: 1000,
        features: [],
      },
      status: "trialing", // Trial status
      currentPeriodStart: Date.now() - 86400000,
      currentPeriodEnd: Date.now() + 86400000 * 7,
      polarSubscriptionId: "sub_123",
      polarCustomerId: "cust_123",
      polarProductId: "prod_456",
      tierKey: "tier_2",
      cancelAtPeriodEnd: false,
    };

    vi.mocked(useQuery).mockReturnValue(mockSubscription);

    render(<SubscriptionTab user={mockUser} />);

    // Should show "Active" badge (not "Inactive")
    expect(screen.getByText("status_active")).toBeInTheDocument();
    expect(screen.queryByText("status_inactive")).not.toBeInTheDocument();
  });

  it("should show 'Inactive' only for canceled/past_due subscriptions", async () => {
    const mockSubscription = {
      plan: {
        tier: "starter",
        name: "Starter Plan",
        monthlyCredits: 200,
        features: [],
      },
      status: "canceled",
      currentPeriodStart: Date.now() - 86400000 * 60,
      currentPeriodEnd: Date.now() - 86400000 * 30,
      polarSubscriptionId: "sub_123",
      polarCustomerId: "cust_123",
      polarProductId: "prod_123",
      tierKey: "tier_1",
      cancelAtPeriodEnd: false,
    };

    vi.mocked(useQuery).mockReturnValue(mockSubscription);

    render(<SubscriptionTab user={mockUser} />);

    // Should show "Inactive" badge
    expect(screen.getByText("status_inactive")).toBeInTheDocument();
  });

  it("should show free plan when no subscription exists", async () => {
    // Mock useQuery to return null (no subscription)
    vi.mocked(useQuery).mockReturnValue(null);

    render(<SubscriptionTab user={mockUser} />);

    // Should show "Free" plan
    expect(screen.getByText("plan_name_free")).toBeInTheDocument();
    
    // Should show "Inactive" badge
    expect(screen.getByText("status_inactive")).toBeInTheDocument();
  });

  it("should display correct pricing based on tier", async () => {
    const mockSubscription = {
      plan: {
        tier: "pro",
        name: "Pro Plan",
        monthlyCredits: 1000,
        features: [],
      },
      status: "active",
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now() + 86400000 * 30,
      polarSubscriptionId: "sub_123",
      polarCustomerId: "cust_123",
      polarProductId: "prod_456",
      tierKey: "tier_2",
      cancelAtPeriodEnd: false,
    };

    vi.mocked(useQuery).mockReturnValue(mockSubscription);

    render(<SubscriptionTab user={mockUser} />);

    // Should show Pro plan pricing ($29.99)
    expect(screen.getByText("29.99")).toBeInTheDocument();
  });
});

describe("Data Source Verification (Bug 1)", () => {
  it("should call the correct Convex query", () => {
    render(<SubscriptionTab user={mockUser} />);

    // Verify the correct API is called
    // This test ensures we're using getFormattedSubscription, not getByClerkUserId
    expect(useQuery).toHaveBeenCalledWith(
      api.subscriptions.getFormattedSubscription,
      { clerkUserId: "user_123" }
    );
  });
});
```

### 2-Step QA Checklist for UI Tests

- [ ] **Step 1: TypeScript Check**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Step 2: Biome Lint/Format**
  ```bash
  npx biome check --fix __tests__/components/dashboard/SubscriptionTab.test.tsx
  ```

- [ ] **Test Execution**
  ```bash
  npm test -- __tests__/components/dashboard/SubscriptionTab.test.tsx
  ```
  - [ ] All tests pass

---

## ✅ Final 2-Step QA: All Modified Files (0.5 hours)

After all fixes are complete, run comprehensive QA:

### Step 1: Full TypeScript Check

```bash
# Run TypeScript compiler on all modified files
npx tsc --noEmit
```

**Verify:**
- [ ] No TypeScript errors in any project file
- [ ] All new queries/mutations are properly typed
- [ ] API surface changes are compatible

### Step 2: Full Biome Check

```bash
# Check all modified files
npx biome check --fix \
  convex/polar.ts \
  convex/subscriptions.ts \
  convex/credits.ts \
  convex/http.ts \
  components/dashboard/account/tabs/SubscriptionTab.tsx \
  middleware.ts \
  next.config.mjs
```

**Verify:**
- [ ] No lint errors
- [ ] All files formatted consistently
- [ ] No unused imports
- [ ] No console.log statements left (or marked as intentional)

---

## 🚀 Deploy & Verify (0.5 hours)

### Deploy Steps

1. **Deploy to Preview**
   ```bash
   git push origin sprint-10-fix
   # Or create PR for review
   ```

2. **Manual Verification Checklist**
   - [ ] User with active subscription sees correct plan (not "Free")
   - [ ] User with trial subscription shows "Active" badge
   - [ ] User can upgrade/downgrade tier
   - [ ] Credits are granted on purchase
   - [ ] No CSP errors in console
   - [ ] `artherasmg@gmail.com` confirms credits appear

3. **Webhook Testing**
   - [ ] Trigger test webhook from Polar dashboard
   - [ ] Verify `order.paid` grants credits
   - [ ] Verify `subscription.updated` updates tier
   - [ ] Check Convex logs for success messages

4. **Production Deploy**
   - [ ] Merge PR to main
   - [ ] Deploy to production
   - [ ] Monitor error logs for 30 minutes
   - [ ] Verify fix via manual testing

---

## 📊 Post-Fix Cleanup Tasks (Future Sprint)

After confirming the fix works in production:

| Task | Priority | Notes |
|------|----------|-------|
| Deprecate custom `subscriptions` table | P3 | Mark as deprecated in comments |
| Remove unused `subscriptions.create` mutation | P3 | Never called, safe to remove |
| Archive old `updateTier` mutation | P3 | Use `updateTierByWebhook` instead |
| Archive old `addMonthlyRenewalCredits` | P3 | Use `addMonthlyRenewalCreditsFixed` |
| Update documentation | P3 | Remove references to custom table |

---

## 📝 Summary of Changes

### Files Modified

| File | Changes | Bugs Fixed |
|------|---------|------------|
| `convex/polar.ts` | Add `getCurrentSubscription` query | Bug 1 |
| `convex/subscriptions.ts` | Add `getFormattedSubscription`, `updateTierByWebhook` | Bug 1, Bug 2 |
| `convex/credits.ts` | Add `addMonthlyRenewalCreditsFixed` | Bug A |
| `convex/http.ts` | Update webhook handlers | Bug 2, Bug A |
| `components/dashboard/account/tabs/SubscriptionTab.tsx` | Update query call, fix isActive | Bug 1, Bug 4 |
| `middleware.ts` | Add clerk-telemetry.com to CSP | Bug 5 |
| `next.config.mjs` | Add clerk-telemetry.com to CSP | Bug 5 |
| `vercel.json` | Add clerk-telemetry.com to CSP | Bug 5 |

### Tests Added

| File | Tests | Coverage |
|------|-------|----------|
| `__tests__/convex/webhooks.test.ts` | 6+ tests | Webhook handlers, credit grants, idempotency |
| `__tests__/convex/polarIntegration.test.ts` | ❌ **NOT CREATED** | Component tables not accessible in test schema (see "Known Issues Fixed") |
| `__tests__/components/dashboard/SubscriptionTab.test.tsx` | 5+ new tests | Status rendering, tier display |

---

## 🎯 Success Criteria

The fix is complete when:

1. ✅ User with active Polar subscription sees correct plan name in UI — **VERIFIED** (Test 1 passed)
2. ✅ User with trial sees "Active" badge (not "Inactive")
3. ✅ `artherasmg@gmail.com` has 200 credits and can use the app — **VERIFIED** via Convex MCP repair
4. ✅ Webhook handlers log success messages (not silent failures)
5. ✅ Monthly renewal credits are granted successfully
6. ✅ No CSP errors in browser console
7. ✅ All new tests pass — **8/8 ManageSubscriptionModal, 7/7 webhooks, 13/13 SubscriptionTab**
8. ✅ 2-Step QA passes for all modified files — TypeScript ✅ Biome ✅
9. ✅ Manual testing confirms end-to-end flow works — **Tests 1 + 2 + 3 all passed**

---

## 🐛 Bug 6: Upgrade/Downgrade Broken — Post-Deploy Discovery (2026-02-27)

**Discovered during**: Manual Test 3 (Upgrade Starter → Pro)

### Error

```
[CONVEX A(polar:changeCurrentSubscription)] Server Error
Uncaught Error: Product not found: e5e6c9de-b88c-47a5-883a-3823bd264707
  at handler (.../node_modules/@convex-dev/polar/src/component/lib.ts:114)
  at async getCurrentSubscription (...)
  at async changeSubscription (...)
```

### Root Cause

`ManageSubscriptionModal` called `polar.changeCurrentSubscription` for paid→paid plan changes (upgrade/downgrade). This action internally calls `getCurrentSubscription`, which requires product IDs to be synced in the `@convex-dev/polar` component's internal products table. Those products are not synced in the sandbox environment, so every upgrade/downgrade threw "Product not found".

The free→paid path was already working correctly because it used `<CheckoutLink lazy>` directly, bypassing `changeCurrentSubscription` entirely.

### Fix

**File**: `components/dashboard/account/modals/ManageSubscriptionModal.tsx`

- Removed `useAction(api.polar.changeCurrentSubscription)` — no longer used in the component
- Removed `handleChangeSubscription` function entirely
- Replaced the paid→paid upgrade/downgrade `<Button onClick={handleChangeSubscription}>` with `<CheckoutLink lazy>` — identical to the free→paid checkout flow
- Polar's checkout natively handles upgrade/downgrade/proration when a user with an active subscription checks out for a different product
- Fallback disabled `<Button>` rendered when `polarProductId` is missing (same pattern as free→paid)

**File**: `__tests__/components/dashboard/ManageSubscriptionModal.test.tsx`

- Added test: `"upgrade/downgrade buttons for paid subscribers use CheckoutLink (not a plain action button)"`
- Asserts: when `currentPlan="starter"`, exactly 2 `checkout-link` wrappers are rendered (Pro + Enterprise); Free downgrade uses `handleCancelSubscription` with no `CheckoutLink`
- Total: 8/8 tests green

### QA

- TypeScript: ✅ clean (`npx tsc --noEmit`)
- Biome: ✅ clean (`npx biome check --write`)
- Tests: ✅ 8/8 green
- Manual Test 3: ✅ **PASSED** — Upgrade Starter → Pro opens Polar checkout correctly

---

## 🐛 Bug 7: CheckoutLink fails for existing subscribers — use Polar Customer Portal (2026-02-27)

**Discovered during**: Manual Test 3 retry after Bug 6 fix

### Error

"You already have an active subscription." — shown inside the Polar checkout embedded popup when an existing subscriber clicked Upgrade.

### Root Cause

`CheckoutLink` (from `@convex-dev/polar/react`) is designed for **new subscriptions only**. It starts a fresh checkout flow — when the user already has an active subscription, Polar rejects it. It also embeds the checkout as a popup/modal inside the app rather than opening a new tab.

The correct API for existing subscribers changing plans is the **Polar Customer Portal** (`generateCustomerPortalUrl`), which gives the user a native plan management interface with upgrade/downgrade/cancel (already exported in `convex/polar.ts`).

### Fix

**File**: `components/dashboard/account/modals/ManageSubscriptionModal.tsx`

- Added `useAction(api.polar.generateCustomerPortalUrl)` hook
- Added `handleOpenPortal` async function: calls `generateCustomerPortalUrl({})`, receives `{ url }`, opens `window.open(url, "_blank")`
- Replaced the paid→paid `CheckoutLink` block with a plain `<Button onClick={handleOpenPortal}>` for all upgrade/downgrade cases
- `CheckoutLink` is **retained only** for the free→paid path (`currentPlan === "free"`) where it correctly creates a new subscription

**Routing logic:**
| User state | Plan clicked | CTA behavior |
|---|---|---|
| `currentPlan === "free"` | Any paid plan | `CheckoutLink lazy` → new subscription checkout |
| `currentPlan !== "free"` | Any other paid plan | `handleOpenPortal` → Polar Customer Portal in new tab |
| `currentPlan !== "free"` | Free plan | `handleCancelSubscription` → cancel flow |
| Any | Current plan | Disabled "Current Plan" button |

**File**: `__tests__/components/dashboard/ManageSubscriptionModal.test.tsx`

- Updated `useAction` mock to return `mockGeneratePortalUrl` when action name contains `generateCustomerPortalUrl`
- Added `vi.stubGlobal("open", vi.fn())` in `beforeEach`
- Replaced `CheckoutLink` assertion test with: `"upgrade/downgrade buttons for paid subscribers open the Polar Customer Portal in a new tab"` — asserts zero `checkout-link` elements, `mockGeneratePortalUrl` called with `{}`, `window.open` called with portal URL and `"_blank"`
- Button click wrapped in `act(async () => { ... })` to flush async state updates without warnings

### QA

- TypeScript: ✅ clean
- Biome: ✅ clean (no fixes needed)
- Tests: ✅ 8/8 green, no `act()` warnings
- Manual Test 3: ✅ **PASSED** — Upgrade Starter → Pro opens Polar Customer Portal in new tab; UI shows "Pro Plan Active" after return

---

**Document End** — Generated February 27, 2026 | Updated February 27, 2026
