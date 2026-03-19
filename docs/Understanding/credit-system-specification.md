# Credit System Specification - MyShortReel

**Version**: 1.2  
**Created**: November 29, 2025  
**Last Updated**: November 29, 2025  
**Status**: SPECIFICATION (Pre-implementation)

---

## 1. Executive Summary

The credit system is the core monetization and usage tracking mechanism for MyShortReel. It controls access to all AI-powered features by tracking user consumption and ensuring sustainable business operations.

**Key Principles**:
- **Modular & Flexible**: ALL costs and configurations stored in Convex tables (NOTHING hardcoded)
- **User-Centric**: Credits tied to user via `clerkUserId`, with optional `organizationId` for team sharing
- **Real-Time**: Balance updates instantly via Convex subscriptions
- **Transparent**: Users always know cost before action
- **Auditable**: Complete transaction history
- **Subscription-Aware**: Supports multiple subscription tiers with different initial credit amounts

---

## 2. Business Model Context

### 2.1 Distribution Model

| Model | Description |
|-------|-------------|
| **B2C** | Individual users subscribe directly |
| **B2B2C** | Agencies/teams subscribe, manage client projects |

### 2.2 User Types

| Type | Description | Credit Scope |
|------|-------------|--------------|
| **Individual** | Single user, personal projects | Own credits |
| **Couple** | Two users sharing a project (e.g., wedding) | Shared credits (via organization) |
| **Team Member** | Part of an agency/team | Organization credits |
| **Client** | Invited to view/comment | No credit consumption |

### 2.3 Subscription Model

**⚠️ IMPORTANT: Polar.sh integration NOT implemented yet.**

**MVP State**:
- All users must subscribe to access the app (NO free tier)
- For MVP testing: users get 200 credits on first login
- Credit deduction works, but no payment/subscription validation

**Future State (with Polar.sh)**:

| Plan Type | Description | Initial Credits |
|-----------|-------------|-----------------|
| **One-time** | Single purchase, no renewal | As purchased |
| **Monthly** | Recurring monthly subscription | As per tier |
| **Yearly** | Recurring yearly subscription | As per tier (reset monthly) |

**Subscription tiers**: To be defined by client. Stored in `subscriptionTiers` table (fully dynamic):
- Tier 1 (name: "Casual", credits: 200)
- Tier 2 (name: "Regular", credits: 1000)
- Tier 3 (name: "Intensive", credits: 5000)
- More tiers can be added anytime without code changes

**When Polar is integrated**, the credit system will:
1. Receive initial credits when subscription starts (via webhook)
2. Reset credits on billing cycle (if applicable)
3. Allow additional credit purchases

---

## 3. Credit System Architecture

### 3.0 Existing Tables (Already in Convex)

**Verified via Convex MCP on Nov 29, 2025:**

| Table | Status | Notes |
|-------|--------|-------|
| `creditBalances` | ✅ EXISTS | Uses `organizationId`, not `clerkUserId` - needs extension |
| `usageTracking` | ✅ EXISTS | Already logs `creditsUsed` and `cost` per AI operation |
| `subscriptions` | ✅ EXISTS | Has `plan.monthlyCredits` field |
| `users` | ✅ EXISTS | Has `clerkUserId` index |

**Decision**: We will create NEW tables (`userCredits`, `creditTransactions`, `creditCosts`, `systemConfig`, `subscriptionTiers`) rather than modifying existing ones to avoid breaking changes.

### 3.1 Database Schema

#### Table: `userCredits` (NEW)

**Purpose**: Per-user credit balance tracking. Works alongside existing `creditBalances` (organization-level).

```typescript
userCredits: defineTable({
  clerkUserId: v.string(),           // Clerk user ID (primary identifier)
  organizationId: v.optional(v.string()), // Clerk org ID (for team sharing)
  
  // Balance
  balance: v.number(),               // Current available credits
  
  // Tracking
  totalPurchased: v.number(),        // Lifetime credits purchased
  totalUsed: v.number(),             // Lifetime credits consumed
  totalBonusReceived: v.number(),    // Lifetime bonus credits
  
  // Subscription context (references subscriptionTiers.tierKey)
  subscriptionTier: v.optional(v.string()), // e.g., "tier_1" | "tier_2" | "tier_3" | ...
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  lastResetAt: v.optional(v.number()), // For subscription resets
})
.index("by_clerk_user", ["clerkUserId"])
.index("by_organization", ["organizationId"]),
```

#### Table: `creditTransactions` (NEW - Audit Log)

```typescript
creditTransactions: defineTable({
  clerkUserId: v.string(),           // User who consumed/received credits
  organizationId: v.optional(v.string()),
  
  // Transaction details
  type: v.union(
    v.literal("initial"),            // New user bonus
    v.literal("purchase"),           // Bought credits
    v.literal("subscription_reset"), // Monthly reset
    v.literal("usage"),              // AI feature consumption
    v.literal("refund"),             // Error/refund
    v.literal("bonus"),              // Promotional bonus
  ),
  
  amount: v.number(),                // Positive = add, Negative = deduct
  balanceAfter: v.number(),          // Balance after transaction
  
  // Context
  projectId: v.optional(v.string()), // Which project (if usage)
  projectName: v.optional(v.string()), // For display
  actionType: v.optional(v.string()), // "chat", "image_generation", etc.
  resourceId: v.optional(v.string()), // Scene ID, message ID, etc.
  description: v.string(),           // Human-readable description
  
  // Metadata
  metadata: v.optional(v.any()),     // Additional data (model, tokens, etc.)
  
  timestamp: v.number(),
})
.index("by_user", ["clerkUserId"])
.index("by_user_and_timestamp", ["clerkUserId", "timestamp"])
.index("by_project", ["projectId"])
.index("by_type", ["type"]),
```

#### Table: `creditCosts` (NEW - Configurable Costs)

```typescript
creditCosts: defineTable({
  actionType: v.string(),            // Unique identifier (e.g., "step2_chat_message")
  displayName: v.string(),           // Human-readable name
  credits: v.number(),               // Cost in credits
  description: v.string(),           // What this action does
  category: v.string(),              // Flexible category (see below)
  step: v.optional(v.number()),      // Which guided flow step (1-6)
  isActive: v.boolean(),             // Can be disabled
  updatedAt: v.number(),
})
.index("by_action_type", ["actionType"])
.index("by_category", ["category"])
.index("by_step", ["step"]),
```

#### Table: `subscriptionTiers` (NEW - Dynamic Tiers)

**Purpose**: Store subscription tier definitions. Fully dynamic - add/remove/modify tiers without code changes.

```typescript
subscriptionTiers: defineTable({
  tierKey: v.string(),               // Unique key: "tier_1", "tier_2", "tier_3", etc.
  displayName: v.string(),           // Human-readable name (changeable): "Casual", "Regular", etc.
  initialCredits: v.number(),        // Credits granted on NEW subscription
  monthlyCredits: v.optional(v.number()), // Credits ADDED on monthly renewal (NOT reset, added on top)
  sortOrder: v.number(),             // Display order (1, 2, 3...)
  isActive: v.boolean(),             // Can be disabled without deletion
  description: v.optional(v.string()), // Optional description
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_tier_key", ["tierKey"])
.index("by_sort_order", ["sortOrder"]),
```

**Important**: `monthlyCredits` are ADDED to existing balance on renewal, NOT a reset. User keeps remaining credits.

**Example data** (client can change names/credits anytime):
| tierKey | displayName | initialCredits | sortOrder | isActive |
|---------|-------------|----------------|-----------|----------|
| `tier_1` | "Casual" | 200 | 1 | true |
| `tier_2` | "Regular" | 1000 | 2 | true |
| `tier_3` | "Intensive" | 5000 | 3 | true |

**Benefits**:
- Add new tier: Just insert a new row
- Rename tier: Update `displayName` field
- Change credits: Update `initialCredits` field
- Disable tier: Set `isActive = false`
- Reorder tiers: Update `sortOrder`
- **No code deployment needed for any tier change**

#### Table: `systemConfig` (NEW - System Configuration)

**Purpose**: Store global system settings - NO HARDCODING.

```typescript
systemConfig: defineTable({
  key: v.string(),                   // Unique config key
  value: v.any(),                    // Config value (flexible)
  description: v.string(),           // What this config does
  updatedAt: v.number(),
  updatedBy: v.optional(v.string()), // Who last updated
})
.index("by_key", ["key"]),
```

**MVP system config entries**:
| Key | Value | Description |
|-----|-------|-------------|
| `initial_credits_default` | 200 | Credits for new users (MVP, before Polar) |
| `monthly_reset_enabled` | false | Enable monthly credit reset (MVP: disabled) |

**Future system config entries** (when Polar is integrated):
| Key | Value | Description |
|-----|-------|-------------|
| `monthly_reset_enabled` | true | Enable monthly credit reset |
| `default_tier_key` | "tier_1" | Default tier for new subscriptions |

**Note**: Tier-specific data (names, credits) is in `subscriptionTiers` table, NOT in `systemConfig`.

### 3.2 Credit Costs (Complete List Based on Codebase Analysis)

**Analysis of actual AI API calls in the codebase:**

#### Chat/Story Actions
| Action Type | Display Name | Credits | Step | Where Called |
|-------------|--------------|---------|------|--------------|
| `step1_story_refinement` | Refine Personal Story | 1 | 1 | `app/guided/step-1/page.tsx` → "Let AI Refine It" button |
| `step1_story_generation` | Generate Video Story | 5 | 1 | `app/guided/step-1/page.tsx` → "Continue to The Story" button |
| `step2_chat_message` | AI Story Response | 1 | 2 | `app/guided/step-2/page.tsx` → `app/api/chat/route.ts` |
| `step3b_chat_message` | AI Narration Response | 1 | 3 | `app/guided/step-3b/page.tsx` |

#### Image Actions
| Action Type | Display Name | Credits | Step | Where Called |
|-------------|--------------|---------|------|--------------|
| `image_prompt_enhancement` | Enhance Image Prompt | 1 | 3 | `convex/actions/aiChat.ts` → `enhanceImagePrompt` |
| `image_generation` | Generate Frame Image | 5 | 3 | `convex/actions/imageGeneration.ts` → `generateFrameImage` |
| `image_edit` | Edit Frame Image | 5 | 3 | Future: edit existing frame |

#### Video Actions
| Action Type | Display Name | Credits | Step | Where Called |
|-------------|--------------|---------|------|--------------|
| `video_generation` | Generate Scene Video | 20 | 3 | `convex/actions/videoGeneration.ts` → `generateVideo` |
| `video_regeneration` | Regenerate Scene Video | 20 | 3 | `convex/actions/videoRegeneration.ts` → `regenerateVideo` |

#### Audio Actions
| Action Type | Display Name | Credits | Step | Where Called |
|-------------|--------------|---------|------|--------------|
| `audio_narration` | Generate Narration | 10 | 4 | `app/guided/step-4/page.tsx` (TODO: connect to real API) |
| `audio_music` | Generate Music | 10 | 4 | `app/guided/step-4/page.tsx` (TODO: connect to real API) |

#### Assembly Actions
| Action Type | Display Name | Credits | Step | Where Called |
|-------------|--------------|---------|------|--------------|
| `video_assembly` | Assemble Final Video | 5 | 6 | `app/guided/step-6/page.tsx` (TODO: implement) |

**Note**: Step 1 has two AI actions: optional story refinement ("Let AI Refine It") and mandatory story generation ("Continue to The Story"). Step 2b has NO AI calls (style selection only). Step 5 has NO AI calls (preview only).

### 3.3 Initial Credits (Per Subscription Tier)

**Stored in `subscriptionTiers` table - fully dynamic.**

**⚠️ IMPORTANT: Subscription tiers NOT YET DEFINED by client.**

For MVP development, we seed placeholder tiers. The client can change names, credits, add/remove tiers anytime via Convex dashboard - **no code deployment needed**.

| tierKey | displayName | initialCredits | Use Case |
|---------|-------------|----------------|----------|
| `tier_1` | "Casual" | 200 | Occasional video creation |
| `tier_2` | "Regular" | 1000 | Regular video creation |
| `tier_3` | "Intensive" | 5000 | Frequent/professional use |

**Flexibility examples**:
- Client wants to rename "Casual" to "Starter"? → Update `displayName` in Convex
- Client wants to add "tier_4" for agencies? → Insert new row in Convex
- Client wants to change tier_2 credits from 1000 to 1500? → Update `initialCredits` in Convex

**Notes:**
- **NO free tier** - all users must subscribe to access the app
- **NO unlimited tier** - not financially sustainable
- For MVP testing: new users get 200 credits (from `systemConfig.initial_credits_default`)
- When Polar is integrated: credits come from user's `subscriptionTier` → lookup in `subscriptionTiers` table

---

## 4. Core Functions

### 4.1 `getBalance` (Query)

**Purpose**: Get current credit balance for authenticated user

**Input**: None (uses auth)

**Output**:
```typescript
{
  balance: number,
  totalUsed: number,
  totalPurchased: number,
  subscriptionTier: string | undefined,
}
```

**Logic (MVP - without Polar integration)**:
1. Get authenticated user from Clerk
2. Look up `userCredits` by `clerkUserId`
3. If not found:
   a. Get default initial credits from `systemConfig` table (key: `initial_credits_default`, value: 200)
   b. Create new `userCredits` record with default credits
   c. Log "initial" transaction in `creditTransactions`
4. Return balance info

**Logic (Future - with Polar integration)**:
1. Get authenticated user from Clerk
2. Look up `userCredits` by `clerkUserId`
3. If not found:
   a. Look up user's subscription tier from `subscriptions` table (e.g., "tier_2")
   b. Look up `subscriptionTiers` by `tierKey` to get `initialCredits`
   c. Create new `userCredits` record with tier-appropriate credits
   d. Log "initial" transaction
4. Return balance info

**Note**: For MVP, all new users get 200 credits (configurable in `systemConfig`). Tier-based credits will be implemented when Polar is integrated.

### 4.2 `deductCredits` (Mutation)

**Purpose**: Deduct credits for AI feature usage

**Input**:
```typescript
{
  actionType: string,      // e.g., "image_generation"
  projectId?: string,      // For tracking
  projectName?: string,    // For display
  resourceId?: string,     // Scene ID, etc.
  description: string,     // Human-readable
  metadata?: any,          // Additional info
}
```

**Output**:
```typescript
{
  success: boolean,
  newBalance: number,
  creditsUsed: number,
  error?: string,
}
```

**Logic**:
1. Get authenticated user
2. Look up cost from `creditCosts` table by `actionType`
3. Check if user has sufficient balance
4. If insufficient: return `{ success: false, error: "Insufficient credits" }`
5. Deduct from `userCredits.balance`
6. Update `userCredits.totalUsed`
7. Insert record into `creditTransactions`
8. Return success with new balance

### 4.3 `addCredits` (Mutation)

**Purpose**: Add credits (purchase, bonus, subscription)

**Input**:
```typescript
{
  amount: number,
  type: "purchase" | "subscription_reset" | "bonus" | "refund",
  description: string,
}
```

**Output**:
```typescript
{
  success: boolean,
  newBalance: number,
}
```

**Logic**:
1. Get authenticated user
2. Add to `userCredits.balance`
3. Update `userCredits.totalPurchased` (if purchase)
4. Insert record into `creditTransactions`
5. Return success

### 4.4 `hasEnoughCredits` (Query)

**Purpose**: Quick check before expensive operation

**Input**:
```typescript
{
  actionType: string,
}
```

**Output**: `boolean`

**Logic**:
1. Get cost from `creditCosts` table
2. Get user balance
3. Return `balance >= cost`

### 4.5 `getCreditCost` (Query)

**Purpose**: Get cost for a specific action (for UI display)

**Input**:
```typescript
{
  actionType: string,
}
```

**Output**:
```typescript
{
  credits: number,
  displayName: string,
  description: string,
}
```

### 4.6 `getTransactionHistory` (Query)

**Purpose**: Get user's credit transaction history

**Input**:
```typescript
{
  limit?: number,          // Default 50
  projectId?: string,      // Filter by project
  type?: string,           // Filter by type
}
```

**Output**: Array of `creditTransactions` records

### 4.7 `refundCredits` (Mutation)

**Purpose**: Refund credits when AI call fails

**Input**:
```typescript
{
  transactionId: string,   // Original deduction transaction
  reason: string,          // "ai_call_failed" | "user_request" | "system_error"
}
```

**Output**:
```typescript
{
  success: boolean,
  newBalance: number,
  refundedAmount: number,
}
```

**Logic**:
1. Look up original transaction by ID
2. Verify it was a "usage" type transaction
3. Add credits back to `userCredits.balance`
4. Insert "refund" transaction in `creditTransactions` (linked to original)
5. Return success

---

## 5. Error Handling & Concurrency

### 5.1 AI Call Failure Handling

**Problem**: What if credits are deducted but the AI call fails?

**Solution**: Simple refund approach (no reservation complexity)

**Flow**:
1. Deduct credits BEFORE AI call
2. Make AI call
3. If AI call FAILS:
   - Call `refundCredits` mutation
   - Show error to user: "Generation failed. Credits refunded."
4. If AI call SUCCEEDS:
   - No action needed, credits already deducted

**Why not "reserve then confirm"?**
- More complex (2 mutations instead of 1)
- Requires cleanup for abandoned reservations
- Refund approach is simpler and handles 99% of cases

### 5.2 Concurrency Prevention

**Problem**: User triggers 2 AI actions simultaneously → could over-deduct

**Solution**: UI-level prevention (simplest approach)

**Implementation**:
1. When AI action starts → disable ALL AI action buttons
2. Show loading state on the active button
3. When AI action completes (success or fail) → re-enable buttons

**Code pattern**:
```tsx
const [isProcessing, setIsProcessing] = useState(false);

const handleGenerate = async () => {
  setIsProcessing(true);  // Disable all buttons
  try {
    const result = await deductCredits({ actionType: "image_generation", ... });
    if (!result.success) {
      // Show insufficient credits modal
      return;
    }
    await generateImage(...);
  } catch (error) {
    await refundCredits({ transactionId: result.transactionId, reason: "ai_call_failed" });
    toast.error("Generation failed. Credits refunded.");
  } finally {
    setIsProcessing(false);  // Re-enable buttons
  }
};

<Button onClick={handleGenerate} disabled={isProcessing}>
  Generate Image <Badge>5 credits</Badge>
</Button>
```

**Note**: Convex mutations are atomic, so even if somehow 2 requests arrive simultaneously, each will correctly read/update the balance.

---

## 6. UI Integration

### 6.1 Dashboard Display

**Location**: `/dashboard` - QuickStatsCards component

**Current Implementation** (to update):
- Shows "Credits Remaining" card
- Currently uses hardcoded `200 - creditsUsed` calculation

**Required Changes**:
- Use `useQuery(api.credits.getBalance)` instead
- Show real-time balance from Convex

### 6.2 Credit Usage History

**Location**: `/dashboard/account` - UsageCreditsTab component

**Current Implementation** (to update):
- Uses mock data from `lib/mock-data/credit-balances.ts`
- Uses mock data from `lib/mock-data/usage-tracking.ts`

**Required Changes**:
- Use `useQuery(api.credits.getTransactionHistory)` instead
- Show: Project Name | Action | Credits | Timestamp
- Filter by project, date range

### 6.3 Pre-Action Credit Display

**Location**: Every AI action button in guided flow

**Pattern**:
```tsx
<Button onClick={handleGenerate}>
  Generate Image
  <Badge variant="secondary">5 credits</Badge>
</Button>
```

**Implementation**:
- Use `useQuery(api.credits.getCreditCost, { actionType: "image_generation" })`
- Display cost next to action button
- Disable button if insufficient credits

### 6.4 Insufficient Credits Modal

**Trigger**: When user attempts action without enough credits

**Content**:
- Current balance
- Required credits
- "Purchase Credits" button (links to Polar)
- "Cancel" button

**Implementation**:
- Create `components/modals/InsufficientCreditsModal.tsx`
- Use existing `PurchaseCreditsModal` for purchase flow

---

## 7. Integration with Existing Systems

### 7.1 Integration with `usageTracking`

**Current State**: `usageTracking` table logs AI usage with `creditsUsed` field

**Integration Strategy**:
1. When `deductCredits` is called:
   - First deduct from `userCredits`
   - Then call `logAIUsage` to record in `usageTracking`
2. `usageTracking` remains for detailed AI usage analytics
3. `creditTransactions` is the source of truth for balance

### 7.2 Integration with Polar.sh Webhooks (FUTURE)

**⚠️ NOT IMPLEMENTED IN MVP** - Polar integration is scheduled post-MVP.

**When implemented, webhook events to handle**:

| Event | Action |
|-------|--------|
| `subscription.created` | Call `addCredits` with plan's initial credits |
| `subscription.updated` | Update user's subscription tier |
| `subscription.renewed` | Call `addCredits` for monthly reset |
| `checkout.completed` | Call `addCredits` for one-time purchase |

**Webhook Handler Location**: `app/api/webhooks/polar/route.ts` (to be created)

---

## 8. Testing Requirements

### 8.1 Unit Tests (`__tests__/convex/credits.test.ts`)

| Test | Description |
|------|-------------|
| `getBalance - new user` | Returns 200 for first-time user |
| `getBalance - existing user` | Returns correct balance |
| `deductCredits - success` | Deducts and logs transaction |
| `deductCredits - insufficient` | Returns error, no deduction |
| `addCredits - purchase` | Adds and logs transaction |
| `refundCredits - success` | Refunds credits and logs transaction |
| `refundCredits - invalid transaction` | Returns error for non-existent transaction |
| `hasEnoughCredits - true` | Returns true when sufficient |
| `hasEnoughCredits - false` | Returns false when insufficient |
| `getCreditCost` | Returns correct cost from table |

### 8.2 Integration Tests

| Test | Description |
|------|-------------|
| Full flow: Chat | Send message → Deduct 1 credit → Verify balance |
| Full flow: Image | Generate image → Deduct 5 credits → Verify balance |
| Insufficient credits | Try action → Get error → Balance unchanged |
| AI failure refund | Deduct → AI fails → Refund → Verify balance restored |
| Transaction history | Multiple actions → Verify all logged correctly |

---

## 9. Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| User identification | `clerkUserId` + optional `organizationId` | Supports both individual and team use |
| Initial credits storage | `subscriptionTiers` table | Fully dynamic, no hardcoding |
| Credit costs storage | `creditCosts` table | Client can change costs without deployment |
| Credits depleted | Show purchase modal | Best UX, no blocking |
| Admin features (MVP) | Direct Convex table editing | Simple, no extra UI needed |
| Transaction logging | Full audit in `creditTransactions` | Complete history for debugging/support |
| Integration with `usageTracking` | Both tables updated | Analytics + balance tracking |
| Real-time updates | Convex subscriptions | Instant balance refresh |
| Monthly renewal | Credits ADDED (not reset) | User keeps remaining credits |
| Concurrency | Disable button during action | Prevent double-deduction |
| AI failure handling | Refund credits | Simple approach, no reservation complexity |
| Table seeding (MVP) | Convex MCP tool | Quick win, no extra code |

---

## 10. Implementation Checklist

### MVP Implementation (Required Now)

- [ ] **Schema**: Add 5 new tables: `userCredits`, `creditTransactions`, `creditCosts`, `systemConfig`, `subscriptionTiers`
- [ ] **Seed tables via Convex MCP** (quick win - no extra code needed):
  - `systemConfig`: Add `initial_credits_default` = 200, `monthly_reset_enabled` = false
  - `subscriptionTiers`: Add placeholder tiers (tier_1, tier_2, tier_3) with default values
  - `creditCosts`: Populate with all action types and costs from section 3.2
- [ ] **Functions**: Create `convex/credits.ts` with 7 functions (including `refundCredits`)
- [ ] **Tests**: Create `__tests__/convex/credits.test.ts`
- [ ] **Hook**: Create `hooks/business-logic/useCredits.ts`
- [ ] **Dashboard**: Update `QuickStatsCards` to use real balance
- [ ] **History**: Update `UsageCreditsTab` to use real data
- [ ] **Pre-action**: Add credit cost display to AI buttons
- [ ] **Modal**: Create insufficient credits modal
- [ ] **Integration**: Connect to first AI action (Step 2 chat)

### Future Implementation (When Polar is integrated)

- [ ] **Polar Webhooks**: Handle `subscription.created`, `subscription.renewed`, `checkout.completed`
- [ ] **Tier-based credits**: Update `getBalance` to lookup `subscriptionTiers` table
- [ ] **Update subscriptionTiers**: Client defines final tier names and credit amounts
- [ ] **Monthly reset**: Implement credit reset on subscription renewal

---

## 11. FUTURE: Polar.sh & Subscription Implementation

**Status**: NOT IN MVP SCOPE - To be implemented after MVP is production-ready.

This section documents what must be done to integrate Polar.sh for real subscription management.

### 11.1 Prerequisites

Before starting Polar integration:
- [ ] MVP credit system fully working (Task 0 complete)
- [ ] All guided steps working with credit deduction
- [ ] Client has defined final subscription tiers and pricing
- [ ] Polar.sh account created and configured

### 11.2 Polar.sh Setup

1. **Create Polar.sh Account**
   - Sign up at [polar.sh](https://polar.sh)
   - Create organization for MyShortReel

2. **Create Products/Plans**
   - Create 3 subscription products matching tiers:
     - Casual (monthly/yearly)
     - Regular (monthly/yearly)
     - Intensive (monthly/yearly)
   - Set pricing per client's requirements

3. **Get API Credentials**
   - Generate API key
   - Add to environment variables: `POLAR_API_KEY`
   - Add webhook secret: `POLAR_WEBHOOK_SECRET`

### 11.3 Implementation Tasks

#### Task P.1: Create Webhook Handler (2h)

**File**: `app/api/webhooks/polar/route.ts` (NEW)

**Events to handle**:
| Event | Action |
|-------|--------|
| `subscription.created` | Create `userCredits` with tier-appropriate credits |
| `subscription.updated` | Update `userCredits.subscriptionTier` |
| `subscription.renewed` | Reset credits (if monthly reset enabled) |
| `subscription.canceled` | Mark subscription as canceled |
| `checkout.completed` | Add purchased credits to balance |

**Security**:
- Verify webhook signature using `POLAR_WEBHOOK_SECRET`
- Log all webhook events for debugging

#### Task P.2: Update getBalance Logic (1h)

**File**: `convex/credits.ts`

**Changes**:
1. When creating new `userCredits` record:
   - Look up user's subscription from `subscriptions` table
   - Get `tierKey` from subscription (e.g., "tier_2")
   - Look up `subscriptionTiers` by `tierKey` to get `initialCredits`
   - Create `userCredits` with tier-appropriate credits
2. If no subscription found → redirect to subscription page (no free tier)

#### Task P.3: Create Subscription Check Middleware (1h)

**Purpose**: Block access to app if user has no active subscription

**Implementation options**:
- A) Middleware that checks subscription status on protected routes
- B) Component wrapper that checks subscription and shows "Subscribe" modal

#### Task P.4: Update subscriptionTiers Table (30m)

**Seed with client-defined tiers**:
```
| tierKey | displayName | initialCredits | monthlyCredits | sortOrder | isActive |
|---------|-------------|----------------|----------------|-----------|----------|
| tier_1  | (TBD)       | (TBD)          | (TBD)          | 1         | true     |
| tier_2  | (TBD)       | (TBD)          | (TBD)          | 2         | true     |
| tier_3  | (TBD)       | (TBD)          | (TBD)          | 3         | true     |
```

**Update systemConfig**:
```
monthly_reset_enabled: true
default_tier_key: "tier_1"
```

#### Task P.5: Monthly Credit Addition (1h)

**Implementation**:
- Triggered by `subscription.renewed` webhook
- Look up tier's `monthlyCredits` from `subscriptionTiers`
- ADD credits to existing `userCredits.balance` (NOT reset)
- Log "subscription_reset" transaction with amount added

**Important**: Credits are ADDED on top of remaining balance, NOT reset to initial amount.

#### Task P.6: UI Updates (2h)

1. **Subscription Page** (`/subscribe`)
   - Display available plans from Polar
   - Redirect to Polar checkout

2. **Account Page** (`/dashboard/account`)
   - Show current subscription tier
   - Show renewal date
   - "Manage Subscription" button → Polar customer portal

3. **Credit Purchase**
   - Update `PurchaseCreditsModal` to use Polar checkout
   - Handle `checkout.completed` webhook to add credits

### 11.4 Testing Checklist

- [ ] New user without subscription → redirected to subscribe
- [ ] User subscribes (tier_1) → gets credits from `subscriptionTiers.initialCredits`
- [ ] User upgrades (tier_2) → tier updated, credits adjusted
- [ ] User's subscription renews → credits reset
- [ ] User purchases additional credits → balance increases
- [ ] User cancels → access blocked at period end
- [ ] Webhook signature validation works
- [ ] All transactions logged correctly

### 11.5 Estimated Time

| Task | Time |
|------|------|
| P.1: Webhook Handler | 2h |
| P.2: Update getBalance | 1h |
| P.3: Subscription Check | 1h |
| P.4: systemConfig | 30m |
| P.5: Monthly Reset | 1h |
| P.6: UI Updates | 2h |
| **Total** | **7.5h** |

---

## 12. References

- [AI Models Overview](./ai-models-overview.md) - Cost calculations
- [Phase 0 Documentation](./phase-0-documentation-analysis.md) - Polar.sh integration details
- [Convex Schema](../../convex/schema.ts) - Existing tables
- [Usage Tracking](../../convex/usageTracking.ts) - Existing logging
- [Polar.sh Documentation](https://docs.polar.sh) - Official docs

---

*Document maintained by: Development Team*  
*Last updated: November 29, 2025*

