# Polar.sh Sandbox Setup Guide - MyShortReel

**For**: Non-technical team members  
**Time**: 20 minutes  
**Environment**: Sandbox only

---

## Step 1: Create Sandbox Account

1. Go to https://sandbox.polar.sh
2. Sign up with your email
3. Create organization: **MyShortReel Test**
4. Verify email

---

## Step 2: Create Products

You need to create **7 products total**:
- 3 subscription plans ($9.99, $29.99, $99.99/month)
- 4 one-time credit packages ($25, $50, $100, $250)

### How to Create Each Product

1. Click **"Products"** in left sidebar
2. Click **"New Product"** button
3. Fill in the form as shown below
4. Scroll to bottom and click **"Create Product"**
5. **Copy the Product ID that appears** (looks like `prod_01abc123`)

---

## Product 1: Starter Plan

**Name:**
```
Starter Plan
```

**Description:** (leave empty or add text if you want)

**Pricing:**
- Select: ⚪ One-time purchase  🔵 **Recurring subscription** ← Click this!
- Every: **1**
- Dropdown: **month**
- Dropdown below: **Fixed price**
- USD: **9.99**

**Automated Benefits:**
- Says "No benefits available"
- Leave it empty - don't click "+ Create Benefit"

**Scroll down past:**
- Metadata (ignore)
- Customer Portal (ignore)
- Checkout Page (ignore)

**Click "Create Product" button at bottom**

**📋 Copy Product ID** → Save as "Starter: e5e6c9de-b88c-47a5-883a-3823bd264707"

---

## Product 2: Pro Plan

Same steps:

**Name:** `Pro Plan`

**Pricing:**
- 🔵 **Recurring subscription**
- Every **1** **month**
- **Fixed price**
- **29.99** USD

Leave everything else empty → **Create Product** → Copy ID
Pro Plan ID: 8d8a2da2-9304-4be0-9d5b-cf57caa34746

---

## Product 3: Enterprise Plan

**Name:** `Enterprise Plan`

**Pricing:**
- 🔵 **Recurring subscription**
- Every **1** **month**
- **Fixed price**
- **99.99** USD

Leave everything else empty → **Create Product** → Copy ID
Enterprise Plan ID: c7a17f55-7b4b-4d5c-a7f1-b707656f6589
---

## Product 4: Starter Pack (One-Time)

**Name:** `25 Credits - Starter Pack`

**Pricing:**
- 🔵 **One-time purchase** ← Click this one now!
- Dropdown: **Fixed price**
- **25.00** USD

Leave everything else empty → **Create Product** → Copy ID
25 Credits - Starter Pack ID: d3b0791a-f692-4564-8690-6f85bc9d435b
---

## Product 5: Popular Pack

**Name:** `55 Credits - Popular Pack`

**Pricing:**
- 🔵 **One-time purchase**
- **Fixed price**
- **50.00** USD

**Create Product** → Copy ID
55 Credits - Popular Pack ID: 86e14b99-a194-45fe-87e3-466fca2e9bb5
---

## Product 6: Pro Pack

**Name:** `115 Credits - Pro Pack`

**Pricing:**
- 🔵 **One-time purchase**
- **Fixed price**
- **100.00** USD

**Create Product** → Copy ID
115 Credits - Pro Pack ID: 44da7533-0a4b-4a26-b641-9b45e81c2d07
---

## Product 7: Enterprise Pack

**Name:** `300 Credits - Enterprise Pack`

**Pricing:**
- 🔵 **One-time purchase**
- **Fixed price**
- **250.00** USD

**Create Product** → Copy ID
300 Credits - Enterprise Pack ID: 19c982fd-3106-45f2-833d-07b573b45c2b
---

## Step 3: Set Up Webhook

1. Click **"Settings"** in left sidebar
2. Click **"Webhooks"**
3. Click **"Add Endpoint"**
4. Fill in the form:

**URL:**
```
https://honorable-caribou-770.convex.site/polar/events
```
⚠️ This is the **Convex HTTP URL** (not the Vercel URL). Webhooks must go directly to Convex.

**Format:** Select **"Raw"** from the dropdown
- This sends JSON format (the default for custom integrations)
- Don't select Discord or Slack unless you want chat notifications

5. **Events:** Scroll down and check these 4 boxes only:
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.canceled`
   - ✅ `order.paid` ← **Important: Use "paid" not "created"!**

**Why `order.paid` and not `order.created`?**
- `order.paid` fires when payment succeeds
- This ensures credits are only added after successful payment

6. Click **"Create"** button at the bottom
7. **COPY THE SECRET** that appears (starts with `whsec_`)
   - Save it immediately - you can only see it once!
   - Write it as "Webhook Secret: whsec_xxxxx"
webhook secret: polar_whs_GC3GmyEGe1YUm0JjhUVQu7iR7okGKV32I2iWu2Q2NxK

---

## Step 4: Get Organization Access Token (OAT)

1. Click **"Settings"** in left sidebar
2. Click **"Developers"** section
3. Under "Organization access tokens", click **"Create token"** button
4. Fill in the form:
   - **Name**: `MyShortReel Sandbox`
   - **Expiration**: Select `30 days` (or your preference)
   - **Scopes**: Check ALL permission boxes shown
5. Click **"Create"** button at the bottom
6. **COPY THE TOKEN** immediately (starts with `polar_oat_`)
   - You can only see this once!
   - Save it as "API Token: polar_oat_xxxxx"

**Important**: This is an Organization Access Token. Never expose it in client-side code or public repos.
Organization access token: polar_oat_vZhSY0JCF27RBw0DQRBLanVX8liqZF356xP9R373i60

---

## Step 5: Configure Convex Environment Variables

You need to add 3 variables to Convex (backend):

1. Open your terminal in the project folder
2. Run these 3 commands:

```bash
npx convex env set POLAR_ORGANIZATION_TOKEN polar_oat_vZhSY0JCF27RBw0DQRBLanVX8liqZF356xP9R373i60

npx convex env set POLAR_WEBHOOK_SECRET polar_whs_GC3GmyEGe1YUm0JjhUVQu7iR7okGKV32I2iWu2Q2NxK

npx convex env set POLAR_SERVER sandbox
```

3. Wait for confirmation after each command

**Note**: Product IDs are NOT needed in Convex - only these 3 variables above.
Product IDs are used by Next.js (frontend) and will be set in Vercel in the next step.

---

## Step 6: Configure Vercel Environment Variables

Go to your Vercel project dashboard and add these variables:

**Environment Variables to Add:**

```
POLAR_ORGANIZATION_TOKEN=polar_oat_vZhSY0JCF27RBw0DQRBLanVX8liqZF356xP9R373i60
POLAR_WEBHOOK_SECRET=polar_whs_GC3GmyEGe1YUm0JjhUVQu7iR7okGKV32I2iWu2Q2NxK
POLAR_SERVER=sandbox

NEXT_PUBLIC_POLAR_PRODUCT_TIER_1=e5e6c9de-b88c-47a5-883a-3823bd264707
NEXT_PUBLIC_POLAR_PRODUCT_TIER_2=8d8a2da2-9304-4be0-9d5b-cf57caa34746
NEXT_PUBLIC_POLAR_PRODUCT_TIER_3=c7a17f55-7b4b-4d5c-a7f1-b707656f6589
NEXT_PUBLIC_POLAR_PRODUCT_CREDITS_STARTER=d3b0791a-f692-4564-8690-6f85bc9d435b
NEXT_PUBLIC_POLAR_PRODUCT_CREDITS_POPULAR=86e14b99-a194-45fe-87e3-466fca2e9bb5
NEXT_PUBLIC_POLAR_PRODUCT_CREDITS_PRO=44da7533-0a4b-4a26-b641-9b45e81c2d07
NEXT_PUBLIC_POLAR_PRODUCT_CREDITS_ENTERPRISE=19c982fd-3106-45f2-833d-07b573b45c2b
```

**Important**: 
- Set environment to **"Production"** (or "Preview" for testing)
- Redeploy after adding these variables

---

## Step 7: Send to Developer

Copy this template and fill in your actual IDs:

```
POLAR SANDBOX - MyShortReel
============================

API Token: polar_oat_[copy from Step 4]
Webhook Secret: whsec_[copy from Step 3]

SUBSCRIPTIONS:
- Starter Plan: prod_[copy from Product 1]
- Pro Plan: prod_[copy from Product 2]
- Enterprise Plan: prod_[copy from Product 3]

CREDIT PACKAGES:
- Starter Pack ($25): prod_[copy from Product 4]
- Popular Pack ($50): prod_[copy from Product 5]
- Pro Pack ($100): prod_[copy from Product 6]
- Enterprise Pack ($250): prod_[copy from Product 7]
```

Send this to your developer.

---

## ✅ Done!

You've completed:
- ✅ Created all 7 products in Polar sandbox
- ✅ Set up webhook endpoint
- ✅ Configured Convex environment variables
- ✅ Configured Vercel environment variables

Your developer can now test the Polar integration.

---

## Test Cards (For Later Testing)

When testing subscriptions:
```
Card: 4242 4242 4242 4242
Expiry: 12/26
CVC: 123
ZIP: 12345
```

---

**Version**: 2.0 COMPLETE  
**Last Updated**: February 25, 2026
