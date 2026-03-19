# 🔧 Pre-Sprint 10 Setup: Polar.sh Sandbox Configuration

**Date**: February 17, 2026  
**Status**: ⏳ IN PROGRESS  
**Time Required**: ~45 minutes  
**Environment**: **SANDBOX ONLY** (Testing before production)

---

## ✅ Prerequisites

- [x] Polar.sh account created
- [ ] Products configured in Polar dashboard
- [ ] Webhook endpoint configured
- [ ] Environment variables added
- [ ] Test checkout flow working

---

## 📋 Setup Checklist

### **🎯 Important: Polar's Built-in Credits System**

Polar has a **Credits Benefit** feature that automatically credits customers' Usage Meter balance:

✅ **For Subscriptions**: Credits added at beginning of each billing cycle (monthly renewal)  
✅ **For One-Time Products**: Credits added once at purchase  
✅ **Rollover**: Can enable unused credits to carry over to next period  
✅ **Automatic**: No manual credit management needed  

**How it works with MyShortReel:**
1. **Polar Credits Benefits** handle **monthly recurring credits** automatically
2. **Our webhook** handles **initial signup credits** (1000 for tier_2, 5000 for tier_3)
3. **Our Convex system** tracks usage and deductions
4. **Hybrid system**: Polar manages allocation, we manage consumption

**References:**
- [Polar Credits Benefit Docs](https://polar.sh/docs/features/benefits/credits.md)
- [Polar Products Guide](https://polar.sh/docs/features/products.md)
- [Polar Benefits Overview](https://polar.sh/docs/features/benefits/introduction)

---

### **Step 1: Create Sandbox Products** (20 min)

Navigate to: [https://sandbox.polar.sh/dashboard/products](https://sandbox.polar.sh/dashboard/products)

**Important Notes:**
- Polar uses **Benefits** to automatically credit customers
- We'll attach a **Credits Benefit** to each product
- Credits are added automatically when subscription starts/renews or product is purchased
- All product details below are copy-paste ready! 📋

---

#### **A. Subscription Products** (3 tiers)

For each tier below, follow these steps:

**Steps:**
1. Click **Create Product**
2. Copy-paste the **Name** and **Description** from tables below
3. Set **Pricing**:
   - Billing cycle: **Monthly**
   - Pricing type: **Fixed price**
   - Price: See table below
4. **Create the product** (don't add benefits yet)
5. **Copy the Product ID** (format: `prod_xxxxxxxxxxxxx`)
6. Save Product ID to `.env.local`

---

##### **Tier 1: Casual Plan**

**Copy-Paste Details:**

```
Name: 
Casual Plan - Monthly

Description:
Perfect for getting started with MyShortReel.

**What you get:**
- 200 credits on signup
- 200 credits added every month
- Access to all AI features
- Video generation
- Image generation
- Music & narration
- Priority support

Ideal for casual creators making 1-2 videos per month.
```

**Pricing:**
- Billing cycle: **Monthly**
- Pricing type: **Fixed price**
- Price: **$19.00** (adjust as needed)

**After creating, add Credits Benefit:**
1. Click on the product
2. Scroll to **Benefits** section
3. Click **Add Benefit** → **Credits**
4. Configure:
   - Name: `Monthly Credits - Casual`
   - Amount: **200** units
   - ✅ Check "Rollover unused credits"
5. Save

**Product ID:** `prod_xxxxx` ← Save this!

---

##### **Tier 2: Regular Plan**

**Copy-Paste Details:**

```
Name:
Regular Plan - Monthly

Description:
Great for regular creators.

**What you get:**
- 1,000 credits on signup
- 500 credits added every month
- Access to all AI features
- Video generation
- Image generation
- Music & narration
- Priority support
- Early access to new features

Ideal for creators making 3-5 videos per month.
```

**Pricing:**
- Billing cycle: **Monthly**
- Pricing type: **Fixed price**
- Price: **$49.00** (adjust as needed)

**After creating, add Credits Benefit:**
1. Click on the product
2. Scroll to **Benefits** section
3. Click **Add Benefit** → **Credits**
4. Configure:
   - Name: `Monthly Credits - Regular`
   - Amount: **500** units
   - ✅ Check "Rollover unused credits"
5. Save

**Note:** Initial credits (1,000) will be handled via webhook in our code.

**Product ID:** `prod_yyyyy` ← Save this!

---

##### **Tier 3: Pro Plan**

**Copy-Paste Details:**

```
Name:
Pro Plan - Monthly

Description:
For power users and professional creators.

**What you get:**
- 5,000 credits on signup
- 2,000 credits added every month
- Access to all AI features
- Video generation
- Image generation
- Music & narration
- Priority support
- Early access to new features
- Dedicated account manager

Ideal for professional creators and agencies making 10+ videos per month.
```

**Pricing:**
- Billing cycle: **Monthly**
- Pricing type: **Fixed price**
- Price: **$99.00** (adjust as needed)

**After creating, add Credits Benefit:**
1. Click on the product
2. Scroll to **Benefits** section
3. Click **Add Benefit** → **Credits**
4. Configure:
   - Name: `Monthly Credits - Pro`
   - Amount: **2000** units
   - ✅ Check "Rollover unused credits"
5. Save

**Note:** Initial credits (5,000) will be handled via webhook in our code.

**Product ID:** `prod_zzzzz` ← Save this!

---

#### **B. One-Time Credit Packages** (4 packages)

For each package below, follow these steps:

**Steps:**
1. Click **Create Product**
2. Copy-paste the **Name** and **Description** from tables below
3. Set **Pricing**:
   - Billing cycle: **One-time purchase**
   - Pricing type: **Fixed price**
   - Price: See table below
4. **Create the product** (don't add benefits yet)
5. **Copy the Product ID**
6. Save Product ID to `.env.local`

---

##### **Package 1: Starter Pack**

**Copy-Paste Details:**

```
Name:
Starter Credit Pack

Description:
Quick credit top-up for occasional projects.

**What you get:**
- 25 credits added immediately
- Never expires
- Use across all AI features

Perfect for trying out the platform or topping up between subscriptions.
```

**Pricing:**
- Billing cycle: **One-time purchase**
- Pricing type: **Fixed price**
- Price: **$25.00**

**After creating, add Credits Benefit:**
1. Click on the product
2. Scroll to **Benefits** section
3. Click **Add Benefit** → **Credits**
4. Configure:
   - Name: `Starter Pack Credits`
   - Amount: **25** units
   - ⬜ Uncheck "Rollover unused credits" (not applicable for one-time)
5. Save

**Product ID:** `prod_credits_starter` ← Save this!

---

##### **Package 2: Popular Pack** (BEST VALUE)

**Copy-Paste Details:**

```
Name:
Popular Credit Pack ⭐ BEST VALUE

Description:
Most popular credit package with bonus credits!

**What you get:**
- 50 base credits
- +5 bonus credits (FREE!)
- Total: 55 credits
- Never expires
- Use across all AI features

🎁 10% more credits compared to Starter Pack!
```

**Pricing:**
- Billing cycle: **One-time purchase**
- Pricing type: **Fixed price**
- Price: **$50.00**

**After creating, add Credits Benefit:**
1. Click on the product
2. Scroll to **Benefits** section
3. Click **Add Benefit** → **Credits**
4. Configure:
   - Name: `Popular Pack Credits`
   - Amount: **55** units (includes 5 bonus)
   - ⬜ Uncheck "Rollover unused credits" (not applicable for one-time)
5. Save

**Product ID:** `prod_credits_popular` ← Save this!

---

##### **Package 3: Pro Pack**

**Copy-Paste Details:**

```
Name:
Pro Credit Pack

Description:
Serious credit pack for power users with bonus credits!

**What you get:**
- 100 base credits
- +15 bonus credits (FREE!)
- Total: 115 credits
- Never expires
- Use across all AI features

🎁 15% more credits compared to smaller packs!
```

**Pricing:**
- Billing cycle: **One-time purchase**
- Pricing type: **Fixed price**
- Price: **$100.00**

**After creating, add Credits Benefit:**
1. Click on the product
2. Scroll to **Benefits** section
3. Click **Add Benefit** → **Credits**
4. Configure:
   - Name: `Pro Pack Credits`
   - Amount: **115** units (includes 15 bonus)
   - ⬜ Uncheck "Rollover unused credits" (not applicable for one-time)
5. Save

**Product ID:** `prod_credits_pro` ← Save this!

---

##### **Package 4: Enterprise Pack**

**Copy-Paste Details:**

```
Name:
Enterprise Credit Pack

Description:
Maximum credit pack for agencies and heavy users with huge bonus!

**What you get:**
- 250 base credits
- +50 bonus credits (FREE!)
- Total: 300 credits
- Never expires
- Use across all AI features
- Priority processing

🎁 20% more credits compared to smaller packs!
```

**Pricing:**
- Billing cycle: **One-time purchase**
- Pricing type: **Fixed price**
- Price: **$250.00**

**After creating, add Credits Benefit:**
1. Click on the product
2. Scroll to **Benefits** section
3. Click **Add Benefit** → **Credits**
4. Configure:
   - Name: `Enterprise Pack Credits`
   - Amount: **300** units (includes 50 bonus)
   - ⬜ Uncheck "Rollover unused credits" (not applicable for one-time)
5. Save

**Product ID:** `prod_credits_enterprise` ← Save this!

---

#### **C. Product Summary**

After creating all products, you should have:

| # | Product Name | Type | Price | Credits | Product ID |
|---|--------------|------|-------|---------|------------|
| 1 | Casual Plan - Monthly | Subscription | $19 | 200 initial, 200/mo | `prod_xxxxx` |
| 2 | Regular Plan - Monthly | Subscription | $49 | 1000 initial, 500/mo | `prod_yyyyy` |
| 3 | Pro Plan - Monthly | Subscription | $99 | 5000 initial, 2000/mo | `prod_zzzzz` |
| 4 | Starter Credit Pack | One-time | $25 | 25 | `prod_credits_starter` |
| 5 | Popular Credit Pack | One-time | $50 | 55 | `prod_credits_popular` |
| 6 | Pro Credit Pack | One-time | $100 | 115 | `prod_credits_pro` |
| 7 | Enterprise Credit Pack | One-time | $250 | 300 | `prod_credits_enterprise` |

**✅ All 7 products created with Credits Benefits attached!**

---

### **Step 2: Configure Webhook** (5 min)

1. Go to **Webhooks** → **Add Endpoint**
2. **URL**: `https://your-dev-url.vercel.app/api/webhooks/polar`
   - For local testing: Use [ngrok](https://ngrok.com) to expose localhost
   - Run: `ngrok http 3000`
   - Use ngrok URL: `https://xxxxx.ngrok.io/api/webhooks/polar`

3. **Subscribe to events**:
   - [x] `subscription.created`
   - [x] `subscription.updated`
   - [x] `subscription.canceled`
   - [x] `order.created`
   - [x] `benefit.grant.created` (NEW - for Credits Benefit)
   - [x] `benefit.grant.revoked` (NEW - for Credits Benefit)

4. **Save webhook secret** (shown once!)

**Why these events:**
- `subscription.created` - Initialize user with initial credits
- `subscription.updated` - Handle plan changes
- `subscription.canceled` - Mark subscription as inactive
- `order.created` - Handle one-time credit purchases
- `benefit.grant.created` - Polar automatically grants credits via Benefits
- `benefit.grant.revoked` - Handle benefit removal (if subscription cancelled)

---

### **Step 3: Get API Credentials** (2 min)

1. Go to **Settings** → **API**
2. Create **Organization Access Token (OAT)**
   - Name: `MyShortReel Sandbox`
   - Scopes: `checkouts:write`, `products:read`
3. **Copy and save token** (shown once!)

---

### **Step 4: Configure Environment Variables** (5 min)

Add to `.env.local`:

```bash
# ============================================
# POLAR.SH SANDBOX CONFIGURATION
# ============================================

# Environment (use sandbox for testing)
POLAR_ENVIRONMENT=sandbox

# Sandbox API Credentials
POLAR_ACCESS_TOKEN=polar_oat_sandbox_xxxxxxxxxxxxx
POLAR_WEBHOOK_SECRET=whsec_sandbox_xxxxxxxxxxxxx

# Subscription Product IDs (from Step 1A)
POLAR_PRODUCT_TIER_1=prod_xxxxx
POLAR_PRODUCT_TIER_2=prod_yyyyy
POLAR_PRODUCT_TIER_3=prod_zzzzz

# Credit Package Product IDs (from Step 1B)
POLAR_PRODUCT_CREDITS_STARTER=prod_credits_starter
POLAR_PRODUCT_CREDITS_POPULAR=prod_credits_popular
POLAR_PRODUCT_CREDITS_PRO=prod_credits_pro
POLAR_PRODUCT_CREDITS_ENTERPRISE=prod_credits_enterprise
```

**⚠️ Important**: 
- Restart dev server after adding env vars
- Never commit `.env.local` to git
- Keep these credentials secret

---

### **Step 5: Seed Subscription Tiers in Convex** (5 min)

Run via Convex dashboard or create seed script:

**Option A: Via Convex Dashboard**

Navigate to Convex Dashboard → Data → `subscriptionTiers` → Insert 3 documents:

```json
// Tier 1
{
  "tierKey": "tier_1",
  "displayName": "Casual",
  "initialCredits": 200,
  "monthlyCredits": 200,
  "sortOrder": 1,
  "isActive": true,
  "description": "Perfect for getting started",
  "createdAt": [current timestamp],
  "updatedAt": [current timestamp]
}

// Tier 2
{
  "tierKey": "tier_2",
  "displayName": "Regular",
  "initialCredits": 1000,
  "monthlyCredits": 500,
  "sortOrder": 2,
  "isActive": true,
  "description": "Great for regular users",
  "createdAt": [current timestamp],
  "updatedAt": [current timestamp]
}

// Tier 3
{
  "tierKey": "tier_3",
  "displayName": "Pro",
  "initialCredits": 5000,
  "monthlyCredits": 2000,
  "sortOrder": 3,
  "isActive": true,
  "description": "For power users",
  "createdAt": [current timestamp],
  "updatedAt": [current timestamp]
}
```

**Option B: Create seed script** (see sprint-10-implementation.md Task 6)

---

### **Step 6: Test Polar Dashboard Access** (3 min)

Verify you can access:

1. **Products**: [https://sandbox.polar.sh/dashboard/products](https://sandbox.polar.sh/dashboard/products)
   - [ ] See all 7 products (3 subscriptions + 4 credit packages)
   - [ ] Each product shows Credits Benefit attached
   - [ ] All products are "Active" (not archived)

2. **Benefits**: [https://sandbox.polar.sh/dashboard/benefits](https://sandbox.polar.sh/dashboard/benefits)
   - [ ] See 7 Credits Benefits created
   - [ ] Each benefit shows correct credit amount
   - [ ] Subscription benefits show "Rollover: Yes"
   - [ ] One-time benefits show correct amounts

3. **Webhooks**: [https://sandbox.polar.sh/dashboard/webhooks](https://sandbox.polar.sh/dashboard/webhooks)
   - [ ] See your webhook endpoint
   - [ ] Status: Active
   - [ ] 6 events subscribed

4. **API Keys**: [https://sandbox.polar.sh/dashboard/settings/api](https://sandbox.polar.sh/dashboard/settings/api)
   - [ ] See your OAT token (name only, not full token)

---

## 🧪 Quick Test (Before Sprint 10)

### **Verify Setup is Complete**

Run these checks:

```bash
# 1. Check environment variables are loaded
echo $POLAR_ENVIRONMENT
# Should output: sandbox

# 2. Verify Convex dev is running
npx convex dev
# Should show: ✓ Convex functions ready

# 3. Check subscription tiers exist
# In Convex dashboard → Data → subscriptionTiers
# Should see: 3 documents (tier_1, tier_2, tier_3)
```

### **Test Polar API Connection** (Optional)

Create a quick test file:

```bash
# test-polar-connection.sh
curl https://sandbox-api.polar.sh/v1/products \
  -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  -H "Accept: application/json"

# Should return: JSON array of your 7 products
```

---

## ✅ Setup Complete Checklist

Before starting Sprint 10, verify:

- [ ] **Sandbox account accessible** (login works)
- [ ] **7 products created** (3 subscriptions + 4 credit packages)
- [ ] **All product IDs saved** (copy-pasted to `.env.local`)
- [ ] **Webhook configured** (endpoint + secret saved)
- [ ] **OAT created and saved** (in `.env.local`)
- [ ] **Environment variables added** (all 8 variables)
- [ ] **Dev server restarted** (env vars loaded)
- [ ] **3 tiers seeded in Convex** (visible in dashboard)
- [ ] **Polar dashboard accessible** (can view products/webhooks)

---

## 📝 Notes & Troubleshooting

### **Common Issues**

**"Product ID not found"**
- Make sure you copied the FULL product ID from Polar dashboard
- Format: `prod_xxxxxxxxxxxxxxxxxx` (starts with `prod_`)

**"Invalid webhook signature"**
- Verify webhook secret is correct in `.env.local`
- Check for extra spaces or quotes in env var

**"Environment variables not loading"**
- Restart Next.js dev server after adding vars
- Run: `npm run dev` or `pnpm dev`

**"Can't access Polar dashboard"**
- Make sure you're using sandbox URL: `https://sandbox.polar.sh/dashboard`
- Not production URL: `https://polar.sh/dashboard`

### **Local Testing with ngrok**

```bash
# 1. Install ngrok (if not installed)
brew install ngrok  # macOS
# or: npm install -g ngrok

# 2. Start your dev server
npm run dev

# 3. In another terminal, start ngrok
ngrok http 3000

# 4. Copy the HTTPS URL (e.g., https://xxxxx.ngrok.io)
# 5. Update Polar webhook endpoint to: https://xxxxx.ngrok.io/api/webhooks/polar

# 6. Test webhook delivery in Polar dashboard
```

---

## 🚀 Next Steps

Once this setup is complete:

1. ✅ **Proceed to Sprint 10** → Task 2 (Create Convex Actions)
2. 🧪 **Test in sandbox** thoroughly before production
3. 🔄 **Repeat setup for production** when ready to launch

---

**Setup Time Tracking**:
- Start: ___________
- Complete: ___________
- Total: ~45 minutes

**Status**: ⏳ Ready to proceed with Sprint 10 implementation
