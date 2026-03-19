# 🧪 MyShortReel — Sprint 10: Subscription & Credits — Manual Testing Guide

**Sprint**: Sprint 10 — Subscription & Credit Purchases  
**Date Created**: February 25, 2026  
**Audience**: Non-technical testers  
**Estimated Time**: 1.5–2 hours  
**What you need**: A browser, a test account, a second fresh account

---

## What You're Testing

This sprint adds real subscription plans and credit purchases.  
You will check that:

- Subscribing to a plan works and credits appear in your account
- Buying credit packs works correctly
- Upgrading, downgrading, and cancelling a subscription works via the Polar Customer Portal
- Deleting an account cancels the subscription and removes all data

---

## Before You Start

**You'll need:**
- The app URL (provided by the dev team)
- Test credit card: `4242 4242 4242 4242` — expiry `12/29` — CVC `123`
- A second email address you haven't used before (for Test 10)

**Important:**
- After completing a payment, **wait 5 seconds** before checking your account. The system needs a moment to update.
- All payments use **sandbox mode** — no real money is charged.

---

## Test 1 — Subscribe to Starter Plan

**What you're checking:** A new user can subscribe to the Starter plan and receives credits.

**Starting state:** Sign in with an account that has no active subscription. The Subscription tab should show "Free / Inactive".

**Steps:**

1. Go to **Account → Subscription tab** https://my-short-reel-beta-git-sprint-191500-jacques-projects-65c2bbcd.vercel.app/dashboard/account
2. Confirm you see plan **"Free"** with status **"Inactive"**
3. Click **"Manage Subscription"**
4. The modal opens showing Free, Starter, Pro, and Enterprise plans
5. Click **"Upgrade"** on **Starter Plan**
6. The Polar checkout opens — enter the test card details
7. Click **Subscribe / Pay**
8. Wait for the redirect back to the app
9. Wait 5 seconds, then refresh the page

**Expected result:**
- Subscription tab now shows **"Starter"** with status **"Active"**
- Your credit balance increased to **200 credits**

**❌ Report if:**
- Checkout page doesn't open, shows a blank page, or shows an error
- After returning to the app, plan still shows "Free"
- Credit balance is still 0 or unchanged after 10 seconds
- An error message appears in the checkout saying "customer already exists"

---

## Test 2 — Buy a Credit Pack

**What you're checking:** Buying a one-time credit pack adds the correct number of credits.

**Starting state:** Any account (with or without subscription). Note your current credit balance.

**Steps:**

1. Go to **Account → Usage & Credits tab**
2. Click **"Purchase Credits"**
3. The modal shows 4 credit packages — check they show these amounts:
   - **25 Credits — Starter Pack** — $25 — 25 credits
   - **55 Credits — Popular Pack** — $50 — 55 credits (50 + 5 bonus)
   - **115 Credits — Pro Pack** — $100 — 115 credits (100 + 15 bonus)
   - **300 Credits — Enterprise Pack** — $250 — 300 credits (250 + 50 bonus)
4. Click the **"25 Credits — Starter Pack"** card to select it
5. Click **"Purchase Credits"**
6. Complete checkout with the test card
7. Wait for redirect, then wait 5 seconds

**Expected result:**
- Credit balance increased by exactly **25**

8. **Repeat** steps 2–7 with the **"55 Credits — Popular Pack ($50)"**

**Expected result:**
- Credit balance increased by exactly **55** (not 50 — the 5 bonus credits must be included)

**❌ Report if:**
- Credit packages show different amounts or names than listed above
- Credit balance only increased by the base amount (e.g. 50 instead of 55 for Popular Pack)
- Credit balance didn't change after 10 seconds
- Checkout never opened

---

## Test 3 — Upgrade Plan (Starter → Pro)

**What you're checking:** A subscriber can upgrade to a higher plan via the Polar Customer Portal.

**Starting state:** Active Starter subscription (from Test 1).

**Steps:**

1. Go to **Account → Subscription tab** → click **"Manage Subscription"**
2. Starter should be highlighted as your current plan
3. Click **"Upgrade"** on **Pro Plan**
4. The Polar Customer Portal opens in a new tab
5. In the portal, select the Pro plan and confirm the upgrade
6. Return to the app tab, wait 5 seconds, then refresh

**Expected result:**
- The modal now shows **Pro** as your current plan
- Subscription tab shows **"Pro"** plan

**Note:** Your credit balance should **not change** when upgrading.

**❌ Report if:**
- "Upgrade" button doesn't open the portal
- Modal still shows Starter as the current plan after refresh
- Credit balance changed

---

## Test 4 — Upgrade Plan (Pro → Enterprise)

**What you're checking:** Upgrading to the highest tier works via the Polar Customer Portal.

**Starting state:** Active Pro subscription (from Test 3).

**Steps:**

1. Go to **Account → Subscription tab** → click **"Manage Subscription"**
2. Pro is the current plan
3. Click **"Upgrade"** on **Enterprise Plan**
4. The Polar Customer Portal opens in a new tab
5. In the portal, select the Enterprise plan and confirm
6. Return to the app tab, wait 5 seconds, then refresh

**Expected result:**
- Modal shows **Enterprise** as current plan

---

## Test 5 — Downgrade Plan (Enterprise → Starter)

**What you're checking:** Downgrading works via the Polar Customer Portal and does NOT remove existing credits.

**Starting state:** Active Enterprise subscription (from Test 4). Note your current credit balance.

**Steps:**

1. Go to **Account → Subscription tab** → click **"Manage Subscription"**
2. Enterprise is the current plan
3. Click **"Downgrade"** on **Starter Plan**
4. The Polar Customer Portal opens in a new tab
5. In the portal, select the Starter plan and confirm
6. Return to the app tab, wait 5 seconds, then refresh

**Expected result:**
- Modal shows **Starter** as current plan
- Your credit balance is **identical** to what it was before downgrading — credits are never removed on downgrade

**❌ Report if:**
- "Downgrade" button doesn't open the portal
- Plan still shows Enterprise
- Credit balance decreased after downgrading

---

## Test 6 — Cancel Subscription (via Polar Customer Portal)

**What you're checking:** A subscriber can cancel their plan via the Polar Customer Portal. Credits are kept after cancellation.

**Starting state:** Any active paid subscription. Note your current credit balance.

**Steps:**

1. Go to **Account → Subscription tab** → click **"Manage Subscription"**
2. Scroll to the bottom of the modal
3. Click the **"Manage in Portal"** button
4. The Polar Customer Portal opens in a new tab
5. In the portal, click **"Cancel Subscription"** and confirm
6. Return to the app tab, wait 5 seconds, then refresh

**Expected result:**
- Subscription tab shows the plan as cancelled or returns to "Free"
- Your credit balance is **identical** to before cancellation — credits are never removed when you cancel

**❌ Report if:**
- "Manage in Portal" button doesn't open the portal
- Subscription still shows "Active" after 10 seconds (may take time for Polar webhook)
- Credit balance decreased after cancellation

---

## Test 7 — Customer Portal (Update Payment)

**What you're checking:** The billing portal link opens correctly.

**Starting state:** Account that has had at least one subscription.

**Steps:**

1. Go to **Account → Subscription tab**
2. Scroll to the **"Payment Method"** section
3. Click **"Update Payment"**
4. A Polar customer portal page opens

**Expected result:**
- Portal page loads and shows your subscription details
- You can see the billing history and payment method

**❌ Report if:**
- Clicking the button does nothing
- The page opens blank or shows an error
- The browser shows a security/CSP error

---

## Test 8 — Delete Account: User with No Subscription

**What you're checking:** A free user can delete their account. After deletion they cannot log back in.

**Starting state:** An account with **no active subscription** and some credits.

**Steps:**

1. Go to **Account → Profile tab**
2. Scroll to the bottom — find **"Delete Account"**
3. Click **"Delete Account"**
4. A warning dialog appears
5. Check: if you have credits, the dialog should say **"Your X credits will be permanently lost"**
6. Click **"Delete Account"** / **"Confirm"** to proceed
7. You are signed out

**Expected result:**
- You are redirected to the home/sign-in page
- Try to sign in again with the same email → **cannot sign in** (account no longer exists)

**❌ Report if:**
- The credits warning does not appear when you had credits
- After deletion, you can still sign in with the same account
- An error appears during the deletion process

---

## Test 9 — Delete Account: Active Subscriber

**What you're checking:** When a paying subscriber deletes their account, the subscription is cancelled and the dialog warns them.

**Starting state:** An account with an **active paid subscription** and some credits.

**Steps:**

1. Go to **Account → Profile tab** → click **"Delete Account"**
2. A warning dialog appears
3. Check: the dialog shows **both** of these warnings:
   - **"Your [Plan Name] subscription will be cancelled immediately"** (with an orange warning icon)
   - **"Your [X] credits will be permanently lost"** (with a yellow warning icon)
4. Click **"Confirm"**
5. You are signed out

**Expected result:**
- Both warnings were displayed before you confirmed
- After deletion, you **cannot sign back in** with the same account — the sign-in page should show an error or not recognise the email

**❌ Report if:**
- The subscription warning does not appear (it should for any active subscriber)
- Wrong plan name is shown in the warning
- Wrong credit amount is shown in the warning
- After deletion, you can still sign in with the same credentials

---

## Test 10 — New User Subscribes (First-Time Account)

**What you're checking:** A brand new account (never used before) can subscribe and receives credits correctly.

**Starting state:** Sign up with a fresh email address that has **never been used** in this app before.

**Steps:**

1. Sign up with a new email address
2. Complete sign-up and arrive at the dashboard
3. Go to **Account → Subscription tab** — confirm it shows "Free / Inactive"
4. Click **"Manage Subscription"** → click **"Upgrade"** on **Starter Plan**
5. Complete checkout with the test card
6. Wait for redirect, then wait 5 seconds

**Expected result:**
- Subscription tab shows **"Starter"** plan with status **"Active"**
- Credit balance shows **200 credits**
- No error messages in the UI

**❌ Report if:**
- Checkout fails or shows an error
- After subscribing, plan still shows "Free"
- Credit balance is 0 or unchanged

---

## Test 11 — Page Shows Correct Labels (No Raw Keys)

**What you're checking:** All subscription and credit pages display readable text — no broken translation codes.

**Steps:**

1. Go to **Account → Subscription tab**
2. Look carefully at all text: plan name, status badge, button labels, billing section headers
3. Click **"Manage Subscription"** — look at all text in the modal (plan names, buttons, cancel confirmation)
4. Close the modal
5. Go to **Account → Usage & Credits tab**
6. Click **"Purchase Credits"** — look at all text in the modal (package names, credits, prices, buttons)

**Expected result:**
- All text is readable English (or your language)
- No text that looks like a code with dots and underscores (e.g. `subscription_tab.plan_name_free` or `manage_subscription_modal.upgrade_button`)

**❌ Report if:**
- Any label, badge, or button shows text that looks like a code (contains dots and underscores)
- Any section shows blank text where a label should appear

---

## Final Sign-Off Checklist

Check each item once testing is complete:

| Test | Description | Pass / Fail | Notes |
|---|---|---|---|
| 1 | Free → Starter subscription, 200 credits granted | | |
| 2a | Buy Starter Pack ($25) → +25 credits | | |
| 2b | Buy Popular Pack ($50) → +55 credits (bonus included) | | |
| 3 | Upgrade Starter → Pro via portal | | |
| 4 | Upgrade Pro → Enterprise via portal | | |
| 5 | Downgrade Enterprise → Starter via portal, credits unchanged | | |
| 6 | Cancel subscription via portal, credits unchanged | | |
| 7 | Customer portal opens correctly | | |
| 8 | Delete free account — cannot re-login | | |
| 9 | Delete active subscriber — both warnings shown, subscription cancelled in Polar | | |
| 10 | New user subscribes — 200 credits granted | | |
| 11 | No raw translation keys visible anywhere | | |

---

## Reporting Issues

For each issue, include:

1. **Which test** (number and step)
2. **What you expected** to see
3. **What actually happened**
4. **A screenshot** if possible

| Severity | Meaning |
|---|---|
| 🔴 Blocker | Payment went through but no credits / account not deleted |
| 🟠 High | Feature does not work at all |
| 🟡 Medium | Feature works but shows wrong data |
| 🟢 Low | Visual issue only |
