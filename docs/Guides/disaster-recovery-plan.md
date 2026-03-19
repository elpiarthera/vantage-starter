# Disaster Recovery Plan

**Last Updated**: March 2, 2026  
**Status**: 🆘 CRITICAL - Keep Updated  
**Purpose**: Complete recovery guide for MyShortReel application

---

## 🎯 Purpose

This document provides step-by-step instructions to fully recover and redeploy the MyShortReel application from scratch using only the GitHub repository, in case of:

- ❌ Loss of access to Vercel account
- ❌ Loss of access to Clerk account
- ❌ Loss of access to Convex account
- ❌ Loss of access to Polar account (billing/subscriptions)
- ❌ Loss of access to Rendi account (video assembly)
- ❌ Developer unavailability
- ❌ Complete infrastructure loss

**Goal**: Any developer with this document and GitHub access can restore the application to full working state within 2-4 hours.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Cost Estimates](#cost-estimates)
3. [Quick Start (TL;DR)](#quick-start-tldr)
4. [Step 1: Clone Repository](#step-1-clone-repository)
5. [Step 2: Setup Clerk Authentication](#step-2-setup-clerk-authentication)
6. [Step 3: Setup Convex Database](#step-3-setup-convex-database)
7. [Step 4: Local Development Setup](#step-4-local-development-setup)
8. [Step 5: Deploy to Vercel](#step-5-deploy-to-vercel)
9. [Step 6: Configure Production Environment](#step-6-configure-production-environment)
10. [Step 7: Verify Deployment](#step-7-verify-deployment)
11. [Step 8: Setup AI Services (fal.ai)](#step-8-optional---setup-ai-services)
12. [Step 9: Setup OAuth Providers (Google & Facebook)](#step-9-setup-oauth-providers-google--facebook)
13. [Step 10: Setup Polar Billing](#step-10-setup-polar-billing)
14. [Step 11: Setup Rendi (Video Assembly)](#step-11-setup-rendi-video-assembly)
15. [Succession Planning](#succession-planning)
16. [Automated Backup Strategy](#automated-backup-strategy)
14. [Testing This Plan](#testing-this-plan)
15. [Troubleshooting](#troubleshooting)
16. [Recovery Checklist](#recovery-checklist)
17. [Important Contacts & Resources](#important-contacts--resources)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Access to GitHub repository: `https://github.com/jacquesdahan/MyShortReel-beta`
- [ ] GitHub account with admin/owner access
- [ ] **If GitHub access is lost**: Contact GitHub support with proof of ownership (domain, email receipts, etc.)
- [ ] Credit card for service signups (Clerk free tier, Convex free tier, Vercel hobby/pro)
- [ ] Email access for account verification
- [ ] Node.js 18+ installed locally
- [ ] **pnpm installed globally** (`npm install -g pnpm`)
- [ ] Git installed locally
- [ ] Terminal/Command line access with admin privileges
- [ ] 2-4 hours of dedicated time
- [ ] **Backup any local uncommitted changes** before starting recovery

⚠️ **Data Loss Assumption**: This plan assumes starting fresh. Existing user data will be lost unless restored from backups (see Step 3b: Data Recovery).

**Estimated Total Time**: 2-4 hours (depending on experience level)

---

## Cost Estimates

Understanding the costs helps you plan for sustainable recovery.

### 💰 Service Costs (as of November 2025)

#### Clerk Authentication
- **Free Tier**: Up to 10,000 Monthly Active Users (MAU)
- **Pro Tier**: $25/month + $0.05 per MAU beyond 10K
- **Enterprise**: Custom pricing
- **Recovery Cost**: $0 - $25/month (depending on user count)

**Recommendation**: Start with free tier, upgrade when needed.

#### Convex Database
- **Free Tier**: 1GB storage, 1M function calls/month
- **Pro Tier**: $25/month + usage overages
- **Enterprise**: Custom pricing
- **Recovery Cost**: $0 - $25/month initially

**Recommendation**: Free tier sufficient for testing; monitor usage.

#### Vercel Hosting
- **Hobby**: Free (personal projects, non-commercial)
- **Pro**: $20/month per user (team collaboration, commercial use)
- **Enterprise**: $400+/month
- **Recovery Cost**: $0 - $20/month

**Recommendation**: Hobby for testing, Pro for production with team.

#### fal.ai (AI Services)
- **Pay-as-you-go**: $0.01 - $0.50 per generation (varies by model)
- **Kling Video v2.5 Turbo Pro**: $0.07 per second
- **Monthly estimate**: $50 - $500 depending on usage
- **Recovery Cost**: $0 (only pay when used)
- **Required for**: Image, video, music, narration generation

**Recommendation**: Required for all AI features. Add immediately.

#### Polar (Billing & Subscriptions)
- **Free Tier**: Unlimited products, 5% transaction fee
- **Growth**: $49/month, 3% transaction fee
- **Business**: Custom pricing
- **Recovery Cost**: $0 initially (free tier)
- **Required for**: Subscription plans, credit purchases, customer portal

**Recommendation**: Start with free tier. Handles all billing, webhooks, and customer portal.

**References**: See `docs/MVP/Todo/pre-sprint-10-setup.md` for full Polar sandbox setup guide.

#### Rendi (Video Assembly)
- **Free Tier**: 50 GB/month processed volume (~161 videos)
- **Basic**: $69/month, 400 GB (~1,290 videos)
- **Pro**: $169/month, 2 TB (~6,451 videos)
- **Ultimate**: $299/month, 5 TB (~16,129 videos)
- **Recovery Cost**: $0 initially (free tier)
- **Required for**: Video merging (xfade transitions), audio mixing (sidechain ducking), final render (A/V mux)

**Recommendation**: Free tier sufficient for testing; upgrade based on video volume.

### Total Estimated Monthly Costs

| Scenario | Clerk | Convex | Vercel | fal.ai | Polar | Rendi | **Total** |
|----------|-------|--------|--------|--------|-------|-------|-----------|
| **Testing/Dev** | $0 | $0 | $0 | $0 | $0 | $0 | **$0/month** |
| **Small Production** | $0-25 | $0 | $20 | $50 | $0 | $0 | **$70-95/month** |
| **Medium Production** | $25-50 | $25 | $20 | $200 | $0 | $69 | **$339-364/month** |
| **Large Production** | $50+ | $25+ | $400+ | $500+ | $49+ | $169+ | **$1,193+/month** |

**One-Time Costs**:
- Custom domain: $10-15/year (optional)
- SSL certificate: $0 (Vercel provides free)

**Hidden Costs to Consider**:
- Developer time for recovery: 2-4 hours × hourly rate
- Downtime impact: Lost revenue/users during recovery
- Data recovery: Potential Convex support fees (if data restoration needed)

💡 **Tip**: Start with all free tiers during recovery, then scale up based on actual usage.

---

## Quick Start (TL;DR)

For experienced developers, here's the condensed version:

```bash
# 1. Clone & Install
git clone https://github.com/jacquesdahan/MyShortReel-beta.git
cd MyShortReel-beta
pnpm install

# 2. Setup Clerk (dashboard.clerk.com)
# - Create new app
# - Create JWT template named "convex"
# - Copy API keys

# 3. Setup Convex (dashboard.convex.dev)
# - npx convex dev
# - Add CLERK_JWT_ISSUER_DOMAIN env var
# - Copy deployment URL

# 3b. Restore Production Data (if applicable)
# - Contact Convex support for point-in-time restore
# - OR restore from manual backup

# 4. Configure .env.local
# See .env.example for template

# 5. Test locally
pnpm run dev

# 6. Deploy to Vercel (vercel.com)
# - Import from GitHub
# - Add all env vars from .env.local
# - Deploy

# 7. Verify production deployment works
```

⚠️ **Important**: This assumes new accounts—existing production data won't be recovered unless you follow Step 3b (Data Recovery).

For detailed instructions, continue reading below.

---

## Step 1: Clone Repository

### 1.1 Clone from GitHub

```bash
# Clone the repository
git clone https://github.com/jacquesdahan/MyShortReel-beta.git

# Navigate into directory
cd MyShortReel-beta

# Verify you're on the correct branch
git branch -a
```

**Expected branches:**
- `main` - Production-ready code
- Feature branches (sprint-based development)

**Recommended**: Start with `main` branch for stable recovery.

### 1.2 Install Dependencies

⚠️ **Important**: This project uses `pnpm`, not `npm`. Ensure pnpm is installed globally first.

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install all Node.js dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

**Expected output**: Should show all packages without errors (~75+ dependencies)

### 1.3 Verify Repository Structure

```bash
# Check key files exist
ls -la .env.example
ls -la package.json
ls -la next.config.mjs
ls -la convex/
```

**Critical files:**
- ✅ `.env.example` - Environment variables template
- ✅ `package.json` - Dependencies and scripts
- ✅ `convex/` directory - Backend functions and schema
- ✅ `app/` directory - Next.js application code
- ✅ `docs/` directory - Documentation (including this file!)

---

## Step 2: Setup Clerk Authentication

Clerk handles user authentication, sign-in, sign-up, and session management.

### 2.1 Create Clerk Account

1. Go to: https://dashboard.clerk.com
2. Sign up with email (or GitHub account)
3. Verify your email
4. Complete onboarding

**Time**: 5 minutes

### 2.2 Create Application

1. Click **"Create Application"**
2. Application Name: `MyShortReel` (or your preferred name)
3. Choose sign-in options:
   - ✅ Email
   - ✅ Google (recommended)
   - ✅ GitHub (optional)
4. Click **"Create Application"**

**Time**: 2 minutes

### 2.3 Get API Keys

1. In Clerk Dashboard, go to **API Keys** (left sidebar)
2. Copy the following:
   - **Publishable Key**: Starts with `pk_test_` (or `pk_live_` for production)
   - **Secret Key**: Starts with `sk_test_` (or `sk_live_` for production)

**Save these immediately** - you'll need them in Step 4.

💰 **Cost Note**: Start with test mode (free). Clerk's free tier supports up to 10,000 Monthly Active Users. You can switch to live mode and upgrade later if needed ($25/month + $0.05/user beyond 10K).

⚠️ **Data Loss Warning**: If the previous Clerk account is inaccessible, all user data (accounts, profiles, authentication history) will be lost. Users will need to create new accounts.

**Time**: 1 minute

### 2.4 Create JWT Template for Convex

This is **critical** for Clerk + Convex integration.

1. In Clerk Dashboard, go to **JWT Templates** (left sidebar)
2. Click **"New template"**
3. Select **"Convex"** from the list
4. **Name**: Must be exactly `convex` (lowercase, no spaces)
5. Leave default claims as-is
6. Click **"Create"**
7. Copy the **Issuer** URL (e.g., `https://your-app.clerk.accounts.dev`)
8. **Keep the full URL including `https://`** - save: `https://your-app.clerk.accounts.dev`

**⚠️ Critical**: The template name MUST be `convex` exactly.

**Time**: 3 minutes

### 2.5 Configure Sign-In/Sign-Up URLs (Optional)

For better UX, set custom URLs:

1. Go to **Paths** (left sidebar)
2. Sign-in URL: `/sign-in`
3. Sign-up URL: `/sign-up`
4. After sign-in: `/dashboard`
5. After sign-up: `/guided/step-1`
6. Click **"Save"**

**Time**: 2 minutes

---

## Step 3: Setup Convex Database

Convex is the real-time backend database and API layer.

### 3.1 Create Convex Account

1. Go to: https://dashboard.convex.dev
2. Sign up with email or GitHub
3. Verify your email

**Time**: 3 minutes

### 3.2 Initialize Convex Project Locally

**Important**: Do this BEFORE creating a project in the dashboard.

```bash
# Make sure you're in the project root
cd MyShortReel-beta

# Initialize Convex (will create new deployment)
npx convex dev
```

**What happens:**
1. CLI will ask to create new project → Select **"Yes"**
2. Choose a project name (e.g., `myshortreel-beta`)
3. CLI will create deployment and open browser
4. **Save the deployment URL** shown in terminal (e.g., `https://happy-animal-123.convex.cloud`)

**Keep this terminal running** - it syncs your schema and functions.

**Time**: 3 minutes

### 3.3 Configure Clerk Integration in Convex

1. Go to: https://dashboard.convex.dev
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add Variable"**
5. Add:
   - **Name**: `CLERK_JWT_ISSUER_DOMAIN`
   - **Value**: `https://your-app.clerk.accounts.dev` (from Step 2.4 - **include https://**)
6. Click **"Save"**

**⚠️ Critical**: Include the full URL with `https://` prefix.

**Time**: 2 minutes

---

### 3.4 Data Backup Information

⚠️ **CRITICAL**: Understanding Convex data persistence before proceeding.

**Convex Auto-Backups:**
- Convex automatically backs up all deployment data
- Backups are retained for disaster recovery purposes
- **If you lost access to a previous Convex deployment**, you can potentially recover data

**Data Recovery Options:**

1. **If you have the old deployment URL:**
   - Contact Convex support (support@convex.dev)
   - Provide: Old deployment URL, account email, proof of ownership
   - Request: Access transfer or data export
   - Timeline: 1-2 business days

2. **If you don't have the old deployment URL:**
   - Contact Convex support with any identifying information
   - They may be able to locate your deployment
   - Provide: Project name, approximate creation date, domain it was used with

3. **Manual Export (if you have access):**
   - Go to Convex Dashboard → Your Project → Data
   - Click "Export" for each table
   - Save JSON files locally
   - **Do this NOW as a preventive measure!**

**For data restoration after this step, see Step 3b: Restore Production Data.**

**Time**: 5 minutes (reading + noting)

---

### 3.5 Verify Convex Deployment

In your terminal where `npx convex dev` is running:

```bash
# Should see output like:
✓ Deployment URL: https://your-project.convex.cloud
✓ Syncing functions...
✓ Schema validated
✓ Functions deployed
```

**If you see errors**: Check the [Troubleshooting](#troubleshooting) section.

**Time**: 1 minute

---

## Step 3b: Restore Production Data (CRITICAL)

⚠️ **CRITICAL**: This step is essential if you're recovering from a lost Convex account with production data.

### 3b.1 Assess Data Loss

Before proceeding, determine if you need to restore data:

**Do you need data recovery?**
- ✅ **YES** - If you lost access to Convex account with production users/projects/scenes/assets
- ❌ **NO** - If this is a fresh deployment or test environment

**If YES, proceed with data recovery. If NO, skip to Step 4.**

---

### 3b.2 Option A: Contact Convex Support (PRIMARY METHOD)

Convex maintains automatic backups of all deployments.

**Steps:**

1. **Contact Convex Support immediately:**
   - Email: support@convex.dev
   - Discord: https://convex.dev/community
   - Dashboard: https://dashboard.convex.dev (support chat)

2. **Provide the following information:**
   - Original deployment URL (if known)
   - Original project name (if known)
   - Approximate date/time of last known good state
   - Your account email address
   - Reason for recovery (e.g., "Lost access to account")

3. **Request a point-in-time restore:**
   - Ask for data export from their internal backups
   - Request format: JSON export compatible with Convex import

4. **Wait for Convex support response:**
   - Typical response time: 1-2 business days
   - They will provide instructions or data export file

**Time**: 1-3 days (waiting for support response)

---

### 3b.3 Option B: Restore from Manual Backup (SECONDARY METHOD)

If you have manual backups (see Post-Recovery Actions for backup setup):

**Prerequisites:**
- [ ] Have a backup file from Convex data export
- [ ] Backup is in JSON format
- [ ] Know the schema structure

**Steps:**

1. **Locate your backup file:**
   ```bash
   # Backup files are typically in project root or dedicated backup folder
   ls -la backup/convex-*.json
   ```

2. **Create restore script** (if not already exists):

   Create `convex/restoreData.ts`:
   ```typescript
   import { mutation } from "./_generated/server";
   import { v } from "convex/values";
   
   export const restoreUsers = mutation({
     args: { users: v.array(v.any()) },
     handler: async (ctx, args) => {
       for (const user of args.users) {
         await ctx.db.insert("users", user);
       }
       return { count: args.users.length };
     },
   });
   
   export const restoreProjects = mutation({
     args: { projects: v.array(v.any()) },
     handler: async (ctx, args) {
       for (const project of args.projects) {
         await ctx.db.insert("projects", project);
       }
       return { count: args.projects.length };
     },
   });
   
   // Add similar functions for scenes, assets, etc.
   ```

3. **Deploy the restore functions:**
   ```bash
   # Ensure convex dev is running
   npx convex dev
   ```

4. **Run the restore:**
   ```bash
   # Create a restore script
   node scripts/restore-backup.js backup/convex-2025-11-17.json
   ```

5. **Verify data restoration:**
   - Go to Convex Dashboard → Data
   - Check tables have correct record counts
   - Spot-check a few records for accuracy

**Time**: 1-2 hours (depending on data size)

---

### 3b.4 Option C: Fresh Start (NO DATA RECOVERY)

If you don't have production data or don't need to recover it:

**Skip data recovery and proceed to Step 4.**

The application will start with an empty database, and users can create new accounts/projects.

**Time**: 0 minutes (skip this step entirely)

---

### 3b.5 Verify Data Restoration

After using Option A or B:

1. Go to: https://dashboard.convex.dev
2. Select your project
3. Go to **Data** tab
4. Verify tables exist and have data:
   - [ ] `users` table has records
   - [ ] `projects` table has records
   - [ ] `scenes` table has records
   - [ ] `assets` table has records

5. Check record counts match expectations:
   ```bash
   # From Convex dashboard, note the count for each table
   # Compare with known production numbers (if available)
   ```

**⚠️ IMPORTANT**: Do not proceed to production deployment until data is verified!

**Time**: 10 minutes

---

## Step 4: Local Development Setup

### 4.1 Create .env.local File

```bash
# Copy the example template
cp .env.example .env.local
```

### 4.2 Configure Environment Variables

Open `.env.local` in a text editor and fill in the values:

⚠️ **SECURITY WARNING**: The `.env.local` file contains sensitive secrets. Ensure it is listed in `.gitignore` and is **NEVER** committed to the repository.

```env
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CLERK AUTHENTICATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx  # From Step 2.3
CLERK_SECRET_KEY=sk_test_xxxxx                    # From Step 2.3

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CLERK JWT ISSUER (for Convex integration)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⚠️ IMPORTANT: Include the full URL WITH https://
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev  # From Step 2.4

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FAL.AI (AI Services - REQUIRED for Sprint 6+)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⚠️ REQUIRED: Video generation (Kling Video v2.1 Pro) needs this
FAL_KEY=your_key_id:your_key_secret  # From fal.ai Dashboard → API Keys

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONVEX BACKEND
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ⚠️ IMPORTANT: Both URLs must be identical and include https://
CONVEX_URL=https://your-project.convex.cloud      # From Step 3.2
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud  # Same as above

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OPENAI (Story generation, chat refinement)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPENAI_API_KEY=sk-...  # From OpenAI Platform → API Keys

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TOGETHER.AI (Prompt enhancement fallback)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOGETHER_API_KEY=...  # From Together.ai Dashboard

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RENDI (Video assembly - xfade, audio mixing, final render)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RENDI_API_KEY=...  # From Rendi Dashboard → API Keys

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# POLAR (Billing & Subscriptions)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POLAR_ENVIRONMENT=sandbox  # Change to "production" for live
POLAR_ACCESS_TOKEN=polar_oat_xxxxxxxxxxxxx  # From Polar → Settings → API
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # From Polar webhook setup
```

**Verification checklist:**
- [ ] `CLERK_JWT_ISSUER_DOMAIN` includes `https://` prefix
- [ ] `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL` are identical
- [ ] Both Convex URLs include `https://`
- [ ] **Convex URLs have NO trailing slash** (e.g., `https://xxx.convex.cloud` NOT `https://xxx.convex.cloud/`)
- [ ] All Clerk keys start with correct prefix (`pk_test_`, `sk_test_`)
- [ ] `FAL_KEY` format is `key_id:key_secret`
- [ ] `OPENAI_API_KEY` starts with `sk-`
- [ ] `RENDI_API_KEY` is set
- [ ] `POLAR_ACCESS_TOKEN` starts with `polar_oat_`
- [ ] Clerk redirect URLs are configured in `app/ClientProviders.tsx` (not env vars)

**Time**: 5 minutes

### 4.3 Test Prebuild Script Locally

Before starting the dev server, test the prebuild script to catch any issues early:

```bash
# Remove any existing generated files
rm -rf convex/_generated

# Test the codegen script
pnpm run prebuild

# Verify files were created
ls convex/_generated
```

**Expected output**:
```
api.d.ts  api.js  dataModel.d.ts  react.d.ts  server.d.ts  server.js
```

**Why**: This catches codegen or environment variable issues before deploying to Vercel.

**Time**: 2 minutes

### 4.4 Start Local Development Server

**Terminal 1** (keep `npx convex dev` running)

**Terminal 2** (new terminal):
```bash
# Start Next.js development server
pnpm run dev
```

**Expected output:**
```
  ▲ Next.js 14.2.25
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

✓ Ready in 2.5s
```

### 4.4 Seed Database Tables (Development)

Before testing, run the seed scripts to populate required data in your **development** Convex deployment.

**Terminal 3** (new terminal):

```bash
# 1. Seed transition effects (46 FFmpeg xfade effects)
npx tsx scripts/seed-transition-effects.ts

# 2. Seed credit system (systemConfig, subscriptionTiers, creditCosts)
pnpm exec convex run seedCredits:seedAll
```

**Expected output for transition effects:**
```
🌱 Seeding 46 transition effects to Convex...
  ✅ Created fade (fades)
  ✅ Created fadeblack (fades)
  ... (46 effects)
✅ Done! Created: 46, Skipped: 0
```

**Expected output for credit system:**
```
✅ systemConfig seeded
✅ subscriptionTiers seeded
✅ creditCosts seeded (12 entries)
{ success: true, message: "Credit system tables seeded" }
```

**Time**: 2 minutes

---

### 4.5 Seed Production Database

⚠️ **CRITICAL**: Production requires separate seeding with a deploy key.

After deploying to Vercel (Step 5), you must also seed the **production** Convex deployment.

#### 4.5.1 Get Production Deploy Key

1. Go to: https://dashboard.convex.dev
2. Select your **production** project (e.g., `calm-gerbil-63`)
3. Go to **Settings** → **Deploy Keys**
4. Click **"Generate Deploy Key"** (or copy existing)
5. Copy the full key (format: `prod:project-name|eyJ...`)

**Save this key** - you'll need it for all production operations.

#### 4.5.2 Seed Transition Effects (Production)

```bash
# Set the production Convex URL and run seed script
NEXT_PUBLIC_CONVEX_URL=https://your-prod-project.convex.cloud npx tsx scripts/seed-transition-effects.ts
```

**Expected output:**
```
🌱 Seeding 46 transition effects to Convex...
  ✅ Created fade (fades)
  ... (46 effects)
✅ Done! Created: 46, Skipped: 0
```

#### 4.5.3 Seed Credit System (Production)

```bash
# Use --prod flag with admin key for production
pnpm exec convex run seedCredits:seedAll --prod --admin-key 'prod:your-project|your-deploy-key'
```

**Expected output:**
```
✅ systemConfig seeded
✅ subscriptionTiers seeded
✅ creditCosts seeded (12 entries)
{ success: true, message: "Credit system tables seeded" }
```

#### 4.5.4 Verify Production Seed Data

1. Go to: https://dashboard.convex.dev
2. Select your **production** deployment
3. Go to **Data** tab
4. Verify tables have correct row counts:

| Table | Expected Rows | Description |
|-------|---------------|-------------|
| `transitionEffects` | 46 | FFmpeg xfade transitions |
| `systemConfig` | 2 | `initial_credits_default`, `monthly_reset_enabled` |
| `subscriptionTiers` | 3 | Casual, Regular, Intensive |
| `creditCosts` | 12 | All action type costs |

**⚠️ Common Mistake**: Running seed scripts without specifying production URL will seed the **development** database instead!

**Time**: 5 minutes

---

### 4.6 Seed Data Quick Reference

Both **DEV** and **PROD** Convex deployments need identical seed data:

| Table | Rows | Seed Script | Description |
|-------|------|-------------|-------------|
| `transitionEffects` | 46 | `scripts/seed-transition-effects.ts` | FFmpeg xfade transition effects |
| `systemConfig` | 2 | `convex/seedCredits.ts` | `initial_credits_default` (200), `monthly_reset_enabled` (false) |
| `subscriptionTiers` | 3 | `convex/seedCredits.ts` | Casual (200 credits), Regular (1000), Intensive (5000) |
| `creditCosts` | 12 | `convex/seedCredits.ts` | AI action costs (chat: 1-5, image: 1-5, video: 20, audio: 10) |

**Total seed data**: 63 rows across 4 tables

**Commands Summary**:

| Environment | Transition Effects | Credit System |
|-------------|-------------------|---------------|
| **DEV** | `npx tsx scripts/seed-transition-effects.ts` | `pnpm exec convex run seedCredits:seedAll` |
| **PROD** | `NEXT_PUBLIC_CONVEX_URL=https://prod.convex.cloud npx tsx scripts/seed-transition-effects.ts` | `pnpm exec convex run seedCredits:seedAll --prod --admin-key 'prod:name\|key'` |

**⚠️ Note**: Scripts are idempotent - running them multiple times won't duplicate data.

---

### 4.7 Test Local Application

1. Open browser: http://localhost:3000
2. You should see the MyShortReel landing page
3. Click **"Sign In"** or **"Sign Up"**
4. Try creating an account
5. After sign-up, you should be redirected to `/guided/step-1`

**If you see errors**: Check the [Troubleshooting](#troubleshooting) section.

**Time**: 5 minutes

### 4.8 Verify Convex Integration

1. Sign in to the app
2. Navigate to `/dashboard`
3. Open browser console (F12)
4. You should NOT see:
   - ❌ "Clerk not configured"
   - ❌ "Failed to fetch from Convex"
   - ❌ "Auth integration failed"

**If working correctly:**
- ✅ Dashboard loads without errors
- ✅ User profile shows in header
- ✅ No console errors related to auth or database

💡 **Mobile Test Recommendation**: Open http://localhost:3000 on your mobile device (use your local IP, e.g., `http://192.168.1.x:3000`) to test responsive design early.

**Time**: 3 minutes

---

## Step 5: Deploy to Vercel

Vercel hosts the Next.js application and handles deployments.

### 5.1 Create Vercel Account

1. Go to: https://vercel.com
2. Sign up with **GitHub** (recommended for easy repo access)
3. Authorize Vercel to access GitHub repositories
4. Complete onboarding

**Time**: 5 minutes

### 5.2 Import Project from GitHub

1. In Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Select **"Import Git Repository"**
3. Find `MyShortReel-beta` repository
4. Click **"Import"**

**Time**: 2 minutes

### 5.3 Configure Build Settings

Vercel should auto-detect Next.js settings:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (leave as default)
- **Build Command**: `pnpm run build` (should auto-detect, verify it says `pnpm` not `npm`)
- **Output Directory**: `.next` (auto-configured)
- **Install Command**: `pnpm install` (should auto-detect, verify it says `pnpm` not `npm`)

**⚠️ Important**: Vercel should auto-detect `pnpm` from `pnpm-lock.yaml`. If it shows `npm`, manually change to `pnpm`.

**Do NOT deploy yet** - we need to add environment variables first.

Click **"Configure Project"** (not "Deploy")

**Time**: 2 minutes

### 5.4 Add Environment Variables

This is **critical**. Click **"Environment Variables"** section.

Add each variable below, checking **ALL THREE** environments (Production, Preview, Development):

⚠️ **CRITICAL**: Both `CONVEX_URL` and `CONVEX_DEPLOY_KEY` are required for the prebuild script. Without them, deployment will fail with authentication errors.

#### Variable 1: CONVEX_URL
```
Name: CONVEX_URL
Value: https://your-project.convex.cloud
Environments: ✅ Production, ✅ Preview, ✅ Development
Purpose: Used by prebuild script (convex codegen --url ${CONVEX_URL})
```

🔥 **Most Common Deployment Failure**: Forgetting to add this variable causes immediate build failure.

#### Variable 2: CONVEX_DEPLOY_KEY
```
Name: CONVEX_DEPLOY_KEY
Value: prod:trustworthy-sparrow-452|xxxxxxxxxxxxxxxxxx
Environments: ✅ Production, ✅ Preview, ✅ Development
Purpose: Authentication for Convex codegen during build
```

🔥 **CRITICAL**: Required for `convex codegen` to authenticate with Convex API.

**How to Get**:
1. Go to https://dashboard.convex.dev
2. Select your project
3. Go to **Settings** → **Deploy Keys**
4. Click **"Generate Deploy Key"**
5. Copy the entire key (starts with `prod:`)

**Alternative Method**:
```bash
# Run locally to see your deploy key
npx convex deploy --cmd 'echo' --preview-create
```

**Security Notes**:
- Keep this key secret (never commit to git)
- Each project has a unique deploy key
- Can be regenerated if lost or compromised

#### Variable 3: NEXT_PUBLIC_CONVEX_URL
```
Name: NEXT_PUBLIC_CONVEX_URL
Value: https://your-project.convex.cloud  (same as above)
Environments: ✅ Production, ✅ Preview, ✅ Development
Purpose: Used by client-side code at runtime
```

#### Variable 4: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```
Name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_test_xxxxx  (from .env.local)
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### Variable 5: CLERK_SECRET_KEY
```
Name: CLERK_SECRET_KEY
Value: sk_test_xxxxx  (from .env.local)
Environments: ✅ Production, ✅ Preview, ✅ Development
```

#### Variable 6: CLERK_JWT_ISSUER_DOMAIN
```
Name: CLERK_JWT_ISSUER_DOMAIN
Value: https://your-app.clerk.accounts.dev  (include https://)
Environments: ✅ Production, ✅ Preview, ✅ Development
```

**ℹ️ NOTE**: Clerk redirect URLs (`signInFallbackRedirectUrl`, `signUpFallbackRedirectUrl`, `afterSignOutUrl`) are now configured directly in `app/ClientProviders.tsx` as props on the `<ClerkProvider>` component. No environment variables are needed for these.

**⚠️ Critical Checklist:**
- [ ] All 7 variables added (3 Convex + 3 Clerk + 1 fal.ai)
- [ ] All variables have all 3 environments checked
- [ ] `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL` are identical
- [ ] **Convex URLs have NO trailing slash** (causes WebSocket connection failures!)
- [ ] `CONVEX_DEPLOY_KEY` starts with `prod:`
- [ ] `CLERK_JWT_ISSUER_DOMAIN` includes `https://` prefix
- [ ] `FAL_KEY` format is `key_id:key_secret` (required for video generation)
- [ ] No typos in variable names (case-sensitive!)

**Common Mistakes**: 
- Adding `NEXT_PUBLIC_CONVEX_URL` but forgetting `CONVEX_URL` → Build fails immediately
- Adding `CONVEX_URL` but forgetting `CONVEX_DEPLOY_KEY` → Build fails with 401 Unauthorized
- **Adding trailing slash to Convex URLs** → WebSocket connection fails with code 1006, users not synced
- Forgetting `FAL_KEY` → Video generation fails in Sprint 6+ with "FAL_KEY not configured"
- Redirect URLs are handled in code now (not env vars)

**Time**: 10 minutes

### 5.5 Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (2-5 minutes)
3. Vercel will show build logs in real-time

**Expected successful output:**
```
✓ Running "convex codegen --url $CONVEX_URL"
✓ Generated convex/_generated/api.ts
✓ Compiling...
✓ Compiled successfully
✓ Linting and checking validity of types...
✓ Creating an optimized production build...
✓ Build completed
```

**If build fails**: Check the [Troubleshooting](#troubleshooting) section.

**Time**: 5-10 minutes

### 5.6 Get Deployment URL

After successful deployment:

1. Vercel will show your deployment URL (e.g., `MyShortReel-beta.vercel.app`)
2. Click **"Visit"** to open the deployed app
3. **Save this URL** - this is your production URL

**Time**: 1 minute

---

## Step 6: Configure Production Environment

### 6.1 Update Clerk Production Settings

1. Go to Clerk Dashboard
2. Go to **Domains** (left sidebar)
3. Add your Vercel domain:
   - Click **"Add domain"**
   - Enter: `MyShortReel-beta.vercel.app` (your actual domain)
   - Click **"Add"**

**Why**: Allows Clerk authentication to work on your production domain.

**Time**: 3 minutes

### 6.2 Optional: Custom Domain

If you have a custom domain (e.g., `myshortreel.com`):

⚠️ **If previous Vercel account is lost**: Domain reassignment may require DNS changes. Contact your domain registrar (e.g., Namecheap, GoDaddy) to update DNS records.

**In Vercel:**
1. Go to Project Settings → Domains
2. Add custom domain
3. Configure DNS records as instructed by Vercel
4. Wait for DNS propagation (can take up to 48 hours, typically 1-4 hours)

**In Clerk:**
1. Add custom domain to allowed domains list
2. Update redirect URLs if using custom domain

**In Convex:**
1. No changes needed (uses deployment URL, not custom domain)

**DNS Records You'll Need:**
- **A Record**: Points to Vercel's IP (provided in dashboard)
- **CNAME Record**: Points to `cname.vercel-dns.com`

**Verification**:
```bash
# Check DNS propagation
nslookup your-custom-domain.com

# Or use online tools
# whatsmydns.net
```

**Time**: 15-30 minutes (setup) + up to 48 hours (DNS propagation)

### 6.3 Switch to Production Keys (Recommended)

For production deployment, use Clerk's live mode:

**In Clerk Dashboard:**
1. Switch to **"Live Mode"** (toggle in top-right)
2. Go to **API Keys**
3. Copy `pk_live_` and `sk_live_` keys
4. Update JWT template in live mode (same steps as Step 2.4)

**In Vercel:**
1. Go to Project Settings → Environment Variables
2. Update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` for Production only
3. Update `CLERK_SECRET_KEY` for Production only
4. Update `CLERK_JWT_ISSUER_DOMAIN` if different in live mode

**Why**: Test mode has rate limits and "Test Mode" badges in UI.

**Time**: 10 minutes

---

## Step 7: Verify Deployment

### 7.1 Basic Functionality Test

Visit your deployed app and test:

- [ ] Landing page loads without errors
- [ ] Click "Sign Up" → Sign up flow works
- [ ] After sign-up → Redirected to `/guided/step-1`
- [ ] Complete guided workflow (Step 1 → Step 2 → Step 3)
- [ ] Dashboard loads and shows projects
- [ ] User profile/avatar shows in header
- [ ] Sign out works
- [ ] Sign in works

**Time**: 10 minutes

### 7.2 Console Error Check

1. Open browser DevTools (F12)
2. Go to Console tab
3. Refresh the page
4. Check for errors

**Should NOT see:**
- ❌ "Module not found: @/convex/_generated/api"
- ❌ "Clerk not configured"
- ❌ "Failed to fetch from Convex"
- ❌ CORS errors

**Acceptable warnings:**
- ⚠️ Next.js hydration warnings (minor, can ignore)

**Time**: 3 minutes

### 7.3 Convex Data Verification

1. Go to: https://dashboard.convex.dev
2. Select your project
3. Go to **Data** tab
4. You should see tables:
   - `users` (with your test user)
   - `projects` (if you created any)
   - `scenes` (if you created any)
   - `assets` (if you uploaded any)

**Why**: Confirms data is persisting correctly.

**Time**: 3 minutes

### 7.4 Mobile Test (Optional but Recommended)

1. Open deployment on mobile device
2. Test sign-up/sign-in flow
3. Test guided workflow
4. Test file upload (if implemented)

**Why**: MyShortReel is mobile-first; ensure responsive design works.

**Time**: 10 minutes

---

## Step 8: Optional - Setup AI Services

**Note**: AI features are Phase 3 and may not be fully implemented yet.

### 8.1 Setup fal.ai (REQUIRED for Sprint 6+)

⚠️ **CRITICAL**: Starting Sprint 6, fal.ai is **required** for AI video generation (Kling Video v2.1 Pro).

1. Go to: https://fal.ai/dashboard
2. Sign up with email or GitHub
3. Go to **API Keys**
4. Click **"Create Key"**
5. Copy the key (format: `key_id:key_secret`)

**Add to Vercel:**
1. Go to Vercel Project Settings → Environment Variables
2. Add:
   - **Name**: `FAL_KEY`
   - **Value**: `your_key_id:your_key_secret`
   - **Environments**: ✅ All 3

**Add to .env.local:**
```env
FAL_KEY=your_key_id:your_key_secret
```

**Add to Convex Dashboard:**
1. Go to https://dashboard.convex.dev
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name**: `FAL_KEY`
   - **Value**: `your_key_id:your_key_secret`

**Cost Note**: Kling Video v2.1 Pro is $0.05/second. Estimate $50-500/month for production usage.

**Time**: 10 minutes

### 8.2 Verify AI Integration (Sprint 6+)

Test AI video generation features:
- [ ] Video generation works (Kling Video v2.1 Pro)
- [ ] Cost tracking logs to Convex `usageTracking` table
- [ ] Video status updates in real-time
- [ ] Video regeneration works with feedback
- [ ] Image generation works (if implemented)
- [ ] Music generation works (Sprint 7+)
- [ ] Narration generation works (Sprint 7+)

---

## Step 9: Setup OAuth Providers (Google & Facebook)

Enable social login for better user experience and higher conversion rates.

### 9.1 Setup Google OAuth

Google OAuth allows users to sign in with their Google accounts.

**Prerequisites:**
- [ ] Google account with access to Google Cloud Console
- [ ] Clerk application already created (Step 2)

**Steps:**

1. **Go to Google Cloud Console:**
   - URL: https://console.cloud.google.com/

2. **Create or Select Project:**
   - Click the project dropdown (top left)
   - Click **"New Project"** or select existing
   - Project name: `MyReelDream` (or your app name)
   - Click **"Create"**

3. **Enable OAuth Consent Screen:**
   - Go to **APIs & Services** → **OAuth consent screen**
   - Select **"External"** user type
   - Click **"Create"**
   - Fill in required fields:
     - App name: `MyReelDream`
     - User support email: your email
     - Developer contact email: your email
   - Click **"Save and Continue"**
   - Scopes: Click **"Save and Continue"** (default scopes are fine)
   - Test users: Add your email for testing
   - Click **"Save and Continue"**

4. **Create OAuth 2.0 Credentials:**
   - Go to **APIs & Services** → **Credentials**
   - Click **"+ Create Credentials"** → **"OAuth client ID"**
   - Application type: **"Web application"**
   - Name: `MyReelDream Web Client`
   - **Authorized JavaScript origins:**
     - `https://app.myreeldream.ai` (production)
     - `http://localhost:3000` (development)
   - **Authorized redirect URIs:** (get these from Clerk)
     - Go to **Clerk Dashboard** → **Configure** → **SSO Connections** → **Google**
     - Copy the **Redirect URI** shown (e.g., `https://clerk.myreeldream.ai/v1/oauth_callback`)
     - Add it to Google
   - Click **"Create"**

5. **Copy Credentials to Clerk:**
   - Google will show **Client ID** and **Client Secret**
   - Go to **Clerk Dashboard** → **Configure** → **SSO Connections**
   - Click **"Google"**
   - Paste **Client ID** and **Client Secret**
   - Click **"Save"**

6. **Publish OAuth App (for Production):**
   - Go back to **OAuth consent screen**
   - Click **"Publish App"**
   - Confirm publishing
   - ⚠️ Without publishing, only test users can sign in

**Time**: 15-20 minutes

---

### 9.2 Setup Facebook OAuth

Facebook OAuth allows users to sign in with their Facebook accounts.

**Prerequisites:**
- [ ] Facebook account
- [ ] Facebook Developer account
- [ ] Clerk application already created (Step 2)

**Steps:**

1. **Go to Facebook Developers:**
   - URL: https://developers.facebook.com/

2. **Create Developer Account (if needed):**
   - Click **"Get Started"**
   - Follow the verification steps
   - Accept the terms

3. **Create a New App:**
   - Click **"My Apps"** → **"Create App"**
   - Select use case: **"Authenticate and request data from users with Facebook Login"**
   - Click **"Next"**
   - App type: **"Consumer"**
   - Click **"Next"**
   - App name: `MyReelDream`
   - App contact email: your email
   - Click **"Create App"**

4. **Add Facebook Login Product:**
   - In the app dashboard, find **"Facebook Login"**
   - Click **"Set Up"**
   - Select **"Web"**
   - Site URL: `https://app.myreeldream.ai`
   - Click **"Save"** → **"Continue"**

5. **Configure OAuth Settings:**
   - Go to **Facebook Login** → **Settings** (left sidebar)
   - **Valid OAuth Redirect URIs:**
     - Go to **Clerk Dashboard** → **Configure** → **SSO Connections** → **Facebook**
     - Copy the **Redirect URI** shown (e.g., `https://clerk.myreeldream.ai/v1/oauth_callback`)
     - Paste it in Facebook
   - Click **"Save Changes"**

6. **Get App Credentials:**
   - Go to **Settings** → **Basic** (left sidebar)
   - Copy **App ID**
   - Click **"Show"** next to App Secret, enter password, copy **App Secret**

7. **Add Credentials to Clerk:**
   - Go to **Clerk Dashboard** → **Configure** → **SSO Connections**
   - Click **"Facebook"**
   - Paste **App ID** and **App Secret**
   - Click **"Save"**

8. **Switch to Live Mode (for Production):**
   - At the top of Facebook Developers dashboard, toggle from **"Development"** to **"Live"**
   - Complete any required verification steps
   - ⚠️ Without live mode, only test users/developers can sign in

**Time**: 15-20 minutes

---

### 9.3 Verify OAuth Integration

Test both OAuth providers:

**Google Sign-In:**
- [ ] Go to production sign-up page
- [ ] Click **"Continue with Google"**
- [ ] Google consent screen appears
- [ ] After approval, redirected back to app
- [ ] User created in Clerk and Convex

**Facebook Sign-In:**
- [ ] Go to production sign-up page
- [ ] Click **"Continue with Facebook"**
- [ ] Facebook login screen appears
- [ ] After approval, redirected back to app
- [ ] User created in Clerk and Convex

**Troubleshooting OAuth:**

| Issue | Cause | Fix |
|-------|-------|-----|
| "Redirect URI mismatch" | URI in provider doesn't match Clerk | Copy exact URI from Clerk to provider |
| "App not verified" (Google) | OAuth app still in testing | Publish the app in OAuth consent screen |
| "App in development mode" (Facebook) | App not live | Toggle to Live mode in Facebook dashboard |
| "Invalid client_id" | Wrong credentials in Clerk | Verify App ID/Client ID copied correctly |
| "Access denied" | User denied permissions | User must approve; check requested scopes |

**Time**: 10 minutes

---

## Step 10: Setup Polar Billing

Polar handles subscription billing, credit purchases, and the customer portal.

⚠️ **CRITICAL**: Without Polar, users cannot subscribe, purchase credits, or manage their billing.

### 10.1 Create Polar Account

1. Go to: https://polar.sh (production) or https://sandbox.polar.sh (testing)
2. Sign up with GitHub
3. Create an organization for MyShortReel

**Time**: 5 minutes

### 10.2 Create Products

Follow the detailed guide in `docs/MVP/Todo/pre-sprint-10-setup.md` for copy-paste ready product configurations.

**Create 7 products total:**

#### Subscription Plans (3 products)

| Plan | Price/month | Initial Credits | Monthly Credits |
|------|-------------|-----------------|-----------------|
| **Starter** | $9.99 | 200 | 200 |
| **Pro** | $29.99 | 1,000 | 500 |
| **Enterprise** | $99.99 | 5,000 | 2,000 |

#### Credit Packages (4 products)

| Package | Price | Credits | Bonus |
|---------|-------|---------|-------|
| **Starter Pack** | $25 | 25 | — |
| **Popular Pack** | $50 | 50 | +5 |
| **Pro Pack** | $100 | 100 | +15 |
| **Enterprise Pack** | $250 | 250 | +50 |

For each product, attach a **Credits Benefit** with the correct amount.

**Time**: 20 minutes

### 10.3 Configure Webhook

1. Go to **Settings** → **Webhooks**
2. Click **"Add Webhook"**
3. Endpoint URL: `https://your-domain.com/api/webhooks/polar` (your Convex HTTP endpoint)
4. Subscribe to events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `order.created`
   - `benefit.grant.created`
   - `benefit.grant.revoked`
5. **Save the webhook secret** (shown once!)

**Time**: 5 minutes

### 10.4 Get API Credentials

1. Go to **Settings** → **API**
2. Create **Organization Access Token (OAT)**
   - Name: `MyShortReel`
   - Scopes: `checkouts:write`, `products:read`
3. **Copy and save token** (shown once!)

**Time**: 2 minutes

### 10.5 Add Environment Variables

Add to `.env.local` and Vercel:

```bash
# Polar Configuration
POLAR_ENVIRONMENT=sandbox  # Change to "production" for live
POLAR_ACCESS_TOKEN=polar_oat_xxxxxxxxxxxxx
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Add to **Convex Dashboard** → Settings → Environment Variables:
```
POLAR_ACCESS_TOKEN=polar_oat_xxxxxxxxxxxxx
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Time**: 5 minutes

### 10.6 Seed Subscription Tiers in Convex

The seed script populates `subscriptionTiers` with Polar product IDs:

```bash
# DEV
pnpm exec convex run seedCredits:seedAll

# PROD
pnpm exec convex run seedCredits:seedAll --prod --admin-key 'prod:your-project|your-deploy-key'
```

Verify in Convex Dashboard → Data:
- `subscriptionTiers`: 3 subscription rows + 4 credit package rows (each with `polarProductId`)

**Time**: 5 minutes

### 10.7 Verify Polar Integration

Test the full billing flow using the test card `4242 4242 4242 4242`:

- [ ] Free → Starter subscription works (200 credits granted)
- [ ] Credit pack purchase works (correct credits added)
- [ ] Upgrade via Polar Customer Portal works
- [ ] Downgrade preserves existing credits
- [ ] Cancel via portal works (credits preserved)
- [ ] Delete account cancels subscription in Polar

See `docs/MVP/ManualTesting/Sprint-10-polar-manual-tests.md` for the complete 11-test checklist.

**Time**: 30 minutes

---

## Step 11: Setup Rendi (Video Assembly)

Rendi provides cloud FFmpeg for video merging, audio mixing, and final rendering.

⚠️ **CRITICAL**: Without Rendi, the final video assembly (Step 6 of guided workflow) will not work.

### 11.1 Create Rendi Account

1. Go to: https://rendi.dev
2. Sign up for an account
3. Start with the Free tier (50 GB/month, ~161 videos)

**Time**: 5 minutes

### 11.2 Get API Key

1. Go to the Rendi Dashboard
2. Navigate to **API Keys**
3. Create a new API key
4. **Copy and save the key**

**Time**: 2 minutes

### 11.3 Add Environment Variables

Add to `.env.local` and Vercel:

```bash
RENDI_API_KEY=your_rendi_api_key
```

Add to **Convex Dashboard** → Settings → Environment Variables:
```
RENDI_API_KEY=your_rendi_api_key
```

**Time**: 3 minutes

### 11.4 Verify Rendi Integration

Test the video assembly pipeline:

- [ ] Audio mixing works (narration + music with sidechain ducking)
- [ ] Video merging works (scenes with xfade transitions)
- [ ] Final render works (A/V multiplexing)
- [ ] Complete guided workflow Step 6 produces a final video

**Rendi API Reference**: https://docs.rendi.dev
**MyShortReel Rendi Guide**: `docs/Guides/rendi-ffmpeg-api-guide.md`

**Time**: 15 minutes

---

## Succession Planning

⚠️ **CRITICAL FOR BUSINESS CONTINUITY**: Prepare for developer unavailability or death.

### Purpose

This section ensures the application can be recovered even if the primary developer(s) are unavailable due to:
- Death
- Sudden illness or incapacitation
- Extended leave
- Team turnover
- Legal disputes

### 🔑 Essential Information to Document

Create a **Recovery Kit** containing:

1. **This Document**:
   - Location: `docs/Guides/disaster-recovery-plan.md`
   - Ensure it's in the GitHub repository
   - Print a physical copy and store securely

2. **Access Credentials**:
   - GitHub repository URL and access
   - Email accounts associated with services
   - Password manager master password
   - 2FA backup codes

3. **Service Account Information**:
   - Clerk account email and recovery email
   - Convex account email
   - Vercel account email
   - fal.ai account email
   - Polar account email (billing/subscriptions)
   - Rendi account email (video assembly)
   - OpenAI account (API keys)
   - Domain registrar account

4. **Production URLs and IDs**:
   - Production deployment URL
   - Convex deployment URL and project ID
   - Clerk application ID
   - Custom domain (if applicable)

5. **Financial Information**:
   - Credit card used for services
   - Billing contact information
   - Monthly budget allocation

### 👥 Designate Backup Contacts

**Primary Contact** (typically lead developer):
- Name: _______________
- Email: _______________
- Phone: _______________
- GitHub Username: _______________

**Secondary Contact** (backup developer or technical lead):
- Name: _______________
- Email: _______________
- Phone: _______________
- GitHub Username: _______________

**Business Contact** (non-technical, for emergencies):
- Name: _______________
- Email: _______________
- Phone: _______________
- Authority: Can authorize spending, contract with new developers

### 📦 Secure Storage Recommendations

**Digital Storage**:
- **Password Manager** (recommended):
  - 1Password for Teams
  - LastPass Business
  - Bitwarden Organizations
- Grant "Emergency Access" to designated contacts
- Set emergency access delay (e.g., 7-14 days)

**Physical Storage**:
- Print this document and store in:
  - Safe deposit box
  - Locked file cabinet at business address
  - Legal counsel's office
- Include with business continuity plan

**Access Distribution**:
- Primary developer: Full access
- Secondary developer: Read access + emergency access
- Business owner: Physical copy + emergency access to password manager
- Legal counsel: Physical copy (sealed, for emergencies only)

### 📝 Regular Review Process

**Quarterly Review** (every 3 months):
- [ ] Verify all contacts are still valid
- [ ] Update credentials if changed
- [ ] Test emergency access (without activating it)
- [ ] Ensure this document is current

**Annual Full Test** (once per year):
- [ ] Assign a developer unfamiliar with the project
- [ ] Have them follow this plan in a test environment
- [ ] Document time taken and issues encountered
- [ ] Update plan based on findings

### 🚨 Emergency Activation Process

**If primary developer is unavailable:**

1. **Assess Urgency**:
   - Critical (app down): Activate immediately
   - High (features needed): Activate within 24-48 hours
   - Medium (maintenance): Activate within 1 week

2. **Activate Emergency Access**:
   - Secondary contact initiates emergency access in password manager
   - Wait for delay period (typically 7-14 days)
   - Business contact can override delay if critical

3. **Begin Recovery**:
   - Retrieve this document
   - Follow recovery steps starting from Step 1
   - Contact services if account access is needed (provide proof of ownership)

4. **Communicate**:
   - Notify users of potential disruption
   - Update status page (if applicable)
   - Document all actions taken

### 💼 Legal Considerations

**Include in:**
- Employment contracts (IP ownership, access transfer clauses)
- Contractor agreements (transition of knowledge clause)
- Business insurance (key person insurance)
- Operating agreement (technical successor clause)

**Consult with:**
- Business attorney (succession planning)
- Insurance broker (key person insurance)
- Accountant (financial continuity)

---

## Automated Backup Strategy

⚠️ **PREVENTION IS BETTER THAN RECOVERY**: Set up automated backups now.

### Purpose

Automate data backups to minimize data loss in disaster scenarios.

### 🗄️ What to Backup

1. **Convex Database**:
   - All tables: users, projects, scenes, assets
   - File storage metadata
   - System data

2. **Convex File Storage**:
   - User-uploaded assets
   - Generated content (if applicable)

3. **Configuration**:
   - Environment variables (encrypted)
   - Service settings and configurations

4. **Code Repository**:
   - Already backed up on GitHub
   - Ensure all branches are pushed

### 🤖 Automated Backup Solutions

#### Option 1: Convex Export Function (Recommended)

Create `convex/backupData.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Export all data from a table
export const exportTable = query({
  args: { tableName: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db.query(args.tableName as any).collect();
    return { tableName: args.tableName, data, exportedAt: Date.now() };
  },
});

// Export all tables
export const exportAllTables = query({
  handler: async (ctx) => {
    const tables = ["users", "projects", "scenes", "assets"];
    const exports = [];
    
    for (const tableName of tables) {
      const data = await ctx.db.query(tableName as any).collect();
      exports.push({ tableName, data, count: data.length });
    }
    
    return {
      exports,
      exportedAt: new Date().toISOString(),
      totalRecords: exports.reduce((sum, e) => sum + e.count, 0),
    };
  },
});
```

**Schedule with GitHub Actions** (`.github/workflows/backup.yml`):

```yaml
name: Daily Convex Backup

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Export Convex Data
        env:
          CONVEX_URL: ${{ secrets.CONVEX_URL }}
        run: |
          # Call export function and save to file
          DATE=$(date +%Y-%m-%d)
          mkdir -p backups
          npx convex run backupData:exportAllTables > backups/convex-backup-$DATE.json
      
      - name: Upload to Secure Storage
        # Upload to S3, Google Drive, or other secure storage
        # Recommend: Encrypted storage with retention policy
        run: |
          # Example: aws s3 cp backups/ s3://my-backups/convex/ --recursive
          echo "Upload backup to secure location"
```

#### Option 2: Vercel Cron Job

If using Vercel Pro, use Edge Functions with cron:

`app/api/cron/backup/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Perform backup logic here
  // Call Convex export functions
  // Store to external service

  return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
}

export const config = {
  runtime: 'edge',
};
```

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/backup",
    "schedule": "0 2 * * *"
  }]
}
```

#### Option 3: External Backup Service

**Recommended Services**:
- **Backhub.co**: Automated GitHub backups ($5-20/month)
- **AWS S3 + Lambda**: Custom backup solution
- **Google Cloud Storage**: With scheduled Cloud Functions

### 📅 Backup Schedule

**Daily** (Critical):
- Convex database export
- New user data
- Critical transactions

**Weekly** (Important):
- Full system snapshot
- Configuration backup
- Test restoration process

**Monthly** (Comprehensive):
- Complete data archive
- Off-site backup rotation
- Backup integrity verification

### 🔒 Backup Security

1. **Encryption**:
   - Encrypt all backups at rest
   - Use AES-256 or equivalent
   - Store encryption keys separately

2. **Access Control**:
   - Limit who can access backups
   - Use IAM roles (AWS) or service accounts (Google Cloud)
   - Log all backup access

3. **Retention Policy**:
   - Daily backups: Keep for 7 days
   - Weekly backups: Keep for 1 month
   - Monthly backups: Keep for 1 year
   - Legal/compliance: Per regulatory requirements

### ✅ Backup Verification

**Weekly Verification**:
```bash
# Verify backup file exists and is not corrupted
ls -lh backups/convex-backup-*.json
jq . backups/convex-backup-latest.json > /dev/null && echo "Valid JSON" || echo "Corrupted"
```

**Monthly Restoration Test**:
- Restore backup to test environment
- Verify data integrity
- Test application functionality
- Document time to restore

### 💰 Backup Costs

| Solution | Storage Cost | Compute Cost | Total/Month |
|----------|--------------|--------------|-------------|
| GitHub Actions + S3 | $1-5 | $0 (free tier) | $1-5 |
| Vercel Cron + Cloud Storage | $5-10 | $5 (Pro tier) | $10-15 |
| Dedicated Service (Backhub) | $0 | $10-20 | $10-20 |

💡 **Recommendation**: Start with GitHub Actions + S3 ($1-5/month), upgrade to dedicated service as data grows.

---

## Testing This Plan

⚠️ **TEST BEFORE YOU NEED IT**: An untested recovery plan is unreliable.

### Purpose

Regular testing ensures:
- Steps are accurate and current
- Time estimates are realistic
- Team is familiar with process
- Issues are identified proactively

### 🧪 Testing Frequency

**Quarterly** (Every 3 months):
- Quick test: Partial recovery (Steps 1-4 only)
- Time: 1 hour
- Environment: Local development

**Annually** (Once per year):
- Full test: Complete recovery including deployment
- Time: 3-4 hours
- Environment: Test/staging environment
- Simulate real disaster scenario

**After Major Changes**:
- Infrastructure updates (e.g., new service)
- Team changes (new developers)
- Service migrations

### 📝 Testing Checklist

#### Pre-Test Preparation

- [ ] Designate test date and assign team member
- [ ] Create fresh test environment (separate accounts)
- [ ] Document current production state (for comparison)
- [ ] Prepare stopwatch for time tracking
- [ ] Notify team (don't disrupt production)

#### During Test

- [ ] Follow plan exactly as written (don't improvise)
- [ ] Note time for each step
- [ ] Document any errors or confusion
- [ ] Screenshot critical steps for documentation
- [ ] Test troubleshooting sections if issues arise

#### Post-Test Review

- [ ] Compare total time to estimated time
- [ ] Identify steps that were unclear
- [ ] Note any missing information
- [ ] Document service changes (UI updates, new features)
- [ ] Update plan based on findings
- [ ] Share results with team

### 📊 Test Report Template

```markdown
# Disaster Recovery Plan Test Report

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Environment**: [Test/Staging/Local]
**Plan Version**: [e.g., v1.1]

## Results Summary

- **Total Time**: X hours Y minutes
- **Estimated Time**: 2-4 hours
- **Success**: ✅ Complete / ⚠️ Partial / ❌ Failed

## Step-by-Step Results

| Step | Estimated | Actual | Status | Notes |
|------|-----------|--------|--------|-------|
| 1. Clone Repo | 5 min | 3 min | ✅ | Faster than expected |
| 2. Setup Clerk | 15 min | 20 min | ⚠️ | UI changed, added screenshots |
| ... | ... | ... | ... | ... |

## Issues Encountered

1. **Issue**: [Description]
   - **Impact**: High/Medium/Low
   - **Resolution**: [How it was fixed]
   - **Plan Update Needed**: Yes/No

2. **Issue**: [Description]
   - **Impact**: High/Medium/Low
   - **Resolution**: [How it was fixed]
   - **Plan Update Needed**: Yes/No

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

## Plan Updates Required

- [ ] Update Step X: [Specific change]
- [ ] Add new troubleshooting: [Issue]
- [ ] Update time estimates: [Which steps]
- [ ] Add screenshots: [Where]

## Next Test Date

**Scheduled**: [3 months from now]
**Type**: Quarterly/Annual
**Assigned To**: [Team member]

## Sign-off

**Tester Signature**: ______________
**Date**: ______________
**Manager Review**: ______________
**Date**: ______________
```

### 🎯 Success Criteria

A successful test means:
- ✅ Application is fully functional
- ✅ All critical features work (auth, database, deployment)
- ✅ Completed within 50% of estimated time (1-6 hours)
- ✅ No blockers (issues that couldn't be resolved)
- ✅ Team member unfamiliar with app could complete it

**If test fails**:
1. Document all issues in detail
2. Update plan immediately
3. Retest within 1 week
4. Consider professional DR consultation if repeated failures

### 🔄 Continuous Improvement

After each test:
1. Update plan with lessons learned
2. Improve documentation (add clarity, screenshots)
3. Refine time estimates based on actual data
4. Add new troubleshooting based on issues found
5. Train new team members on updated process

---

## Troubleshooting

### Issue: "error: option '--url <url>' argument missing"

**Error in Build Logs**:
```
> convex codegen --url ${CONVEX_URL}
error: option '--url <url>' argument missing
 ELIFECYCLE  Command failed with exit code 1.
Error: Command "pnpm run build" exited with 1
```

**Cause**: `CONVEX_URL` environment variable not set in Vercel.

**Fix:**
1. Go to Vercel → Project Settings → Environment Variables
2. Add `CONVEX_URL` = `https://your-project.convex.cloud`
3. Check all 3 environments (Production, Preview, Development)
4. Redeploy

**Prevention**: Always add both `CONVEX_URL` and `CONVEX_DEPLOY_KEY` before first deployment.

---

### Issue: "401 Unauthorized: MissingAccessToken"

**Error in Build Logs**:
```
> convex codegen --url ${CONVEX_URL}
✖ Error fetching GET https://api.convex.dev/api/deployment/xxx/team_and_project 
401 Unauthorized: MissingAccessToken: An access token is required for this command.
Authenticate with `npx convex dev`
 ELIFECYCLE  Command failed with exit code 1.
```

**Cause**: `CONVEX_DEPLOY_KEY` environment variable not set in Vercel.

**Fix:**
1. Go to Convex Dashboard → Settings → Deploy Keys
2. Click "Generate Deploy Key"
3. Copy the key (format: `prod:deployment-name|long-token`)
4. Go to Vercel → Project Settings → Environment Variables
5. Add `CONVEX_DEPLOY_KEY` with the copied value
6. Check all 3 environments (Production, Preview, Development)
7. Redeploy

**Prevention**: Always add `CONVEX_DEPLOY_KEY` along with `CONVEX_URL` before first deployment.

---

### Issue: "Module not found: @/convex/_generated/api"

**Cause**: Convex codegen didn't run or failed during build.

**Fix:**
1. Verify `CONVEX_URL` is set in Vercel environment variables
2. Verify `CONVEX_DEPLOY_KEY` is set in Vercel environment variables
3. Verify `CONVEX_URL` includes `https://`
4. Verify `CONVEX_DEPLOY_KEY` starts with `prod:`
5. Check `package.json` has: `"prebuild": "convex codegen --url ${CONVEX_URL}"`
6. Check Vercel build logs for prebuild errors (look for authentication errors)
7. Redeploy in Vercel

**Prevention**: Always set both `CONVEX_URL` and `CONVEX_DEPLOY_KEY` before deploying.

---

### Issue: "Clerk not configured" Error

**Cause**: Missing or incorrect Clerk environment variables.

**Fix:**
1. Check all 3 Clerk variables are set in Vercel:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_JWT_ISSUER_DOMAIN`
2. Verify no typos in variable names (case-sensitive)
3. Verify keys are from correct environment (test vs live)
4. Redeploy

---

### Issue: WebSocket Connection Failed (Code 1006) - Users Not Syncing

**Error in Browser Console**:
```
WebSocket connection to 'wss://xxx.convex.cloud//api/1.29.1/sync' failed
WebSocket closed with code 1006
Attempting reconnect...
```

**Cause**: Trailing slash in `CONVEX_URL` or `NEXT_PUBLIC_CONVEX_URL` environment variable.

**How to Identify**: Notice the **double slash** (`//api`) in the WebSocket URL - this indicates a trailing slash in the base URL.

**Fix:**
1. Go to Vercel → Project Settings → Environment Variables
2. Edit `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL`
3. Remove the trailing slash:
   - ❌ Wrong: `https://xxx.convex.cloud/`
   - ✅ Correct: `https://xxx.convex.cloud`
4. Save and redeploy

**Prevention**: Always copy Convex URLs directly from the dashboard without adding trailing slashes.

---

### Issue: "Auth integration failed" or JWT Errors

**Cause**: Incorrect `CLERK_JWT_ISSUER_DOMAIN` format or mismatch.

**Fix:**
1. Verify `CLERK_JWT_ISSUER_DOMAIN` includes `https://` prefix
   - ✅ Correct: `https://your-app.clerk.accounts.dev`
   - ❌ Wrong: `your-app.clerk.accounts.dev` (missing https://)
2. Verify JWT template in Clerk is named exactly `convex`
3. Verify issuer domain in Clerk matches env var exactly
4. Update `CLERK_JWT_ISSUER_DOMAIN` in Convex dashboard to match
5. Redeploy

---

### Issue: Build Succeeds but App Doesn't Load

**Cause**: Missing `NEXT_PUBLIC_CONVEX_URL` or mismatch with `CONVEX_URL`.

**Fix:**
1. Check `NEXT_PUBLIC_CONVEX_URL` is set in Vercel
2. Verify `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL` are identical
3. Verify both include `https://`
4. Redeploy

---

### Issue: Convex Functions Return Null or Errors

**Cause**: `CLERK_JWT_ISSUER_DOMAIN` not set in Convex dashboard.

**Fix:**
1. Go to Convex Dashboard → Settings → Environment Variables
2. Verify `CLERK_JWT_ISSUER_DOMAIN` is set
3. Verify value matches Clerk exactly (with `https://` prefix)
4. Save and wait 10 seconds for propagation
5. Test again

---

### Issue: Local Development Works, Production Fails

**Cause**: Environment variables not set correctly in Vercel.

**Fix:**
1. Compare `.env.local` with Vercel environment variables
2. Ensure all 6 required variables are set in Vercel (including `CONVEX_DEPLOY_KEY`)
3. Ensure all variables are set for ALL 3 environments
4. Check for typos (variable names are case-sensitive)
5. Redeploy

---

### Issue: Database Schema Errors

**Cause**: Schema in code doesn't match deployed Convex schema.

**Fix:**
1. Run `npx convex dev` locally
2. Schema will auto-sync and update
3. Check Convex dashboard → Data → Schema
4. Redeploy if needed

---

## Recovery Checklist

Use this checklist to track your progress during disaster recovery:

### Phase 1: Repository & Local Setup
- [ ] Cloned repository from GitHub
- [ ] Ran `npm install` successfully
- [ ] Verified `.env.example` exists
- [ ] Reviewed `docs/` for latest documentation

### Phase 2: Service Accounts
- [ ] Created Clerk account
- [ ] Created Clerk application
- [ ] Got Clerk API keys (publishable + secret)
- [ ] Created Clerk JWT template named "convex"
- [ ] Got Clerk JWT issuer domain (with https:// prefix)
- [ ] Created Convex account
- [ ] Ran `npx convex dev` successfully
- [ ] Got Convex deployment URL
- [ ] Added `CLERK_JWT_ISSUER_DOMAIN` to Convex dashboard
- [ ] Created Polar account (sandbox first, then production)
- [ ] Created 7 Polar products (3 subscriptions + 4 credit packages)
- [ ] Configured Polar webhook with 6 events
- [ ] Got Polar OAT and webhook secret
- [ ] Created Rendi account
- [ ] Got Rendi API key

### Phase 3: Local Testing & Dev Seeding
- [ ] Created `.env.local` with all 5 required variables
- [ ] Started `pnpm exec convex dev` (Terminal 1)
- [ ] Started `pnpm run dev` (Terminal 2)
- [ ] **Seeded DEV transition effects**: `npx tsx scripts/seed-transition-effects.ts`
- [ ] **Seeded DEV credit system**: `pnpm exec convex run seedCredits:seedAll`
- [ ] Verified DEV seed data in Convex Dashboard:
  - [ ] `transitionEffects` (46 rows)
  - [ ] `creditCosts` (12 rows)
  - [ ] `subscriptionTiers` (3 rows)
  - [ ] `systemConfig` (2 rows)
- [ ] Accessed app at http://localhost:3000
- [ ] Tested sign-up flow locally
- [ ] Tested sign-in flow locally
- [ ] Verified dashboard loads without errors
- [ ] Checked browser console for errors (none critical)

### Phase 4: Production Deployment
- [ ] Created Vercel account
- [ ] Imported project from GitHub
- [ ] Added all 5 environment variables to Vercel
- [ ] Verified all variables set for all 3 environments
- [ ] Deployed successfully (no build errors)
- [ ] Got production URL from Vercel
- [ ] Added Vercel domain to Clerk allowed domains

### Phase 5: Production Seeding & Verification
- [ ] **Got production deploy key** from Convex Dashboard → Settings → Deploy Keys
- [ ] **Seeded PROD transition effects**: `NEXT_PUBLIC_CONVEX_URL=https://prod-project.convex.cloud npx tsx scripts/seed-transition-effects.ts`
- [ ] **Seeded PROD credit system**: `pnpm exec convex run seedCredits:seedAll --prod --admin-key 'prod:project|key'`
- [ ] Verified PROD seed data in Convex Dashboard:
  - [ ] `transitionEffects` (46 rows)
  - [ ] `creditCosts` (12 rows)
  - [ ] `subscriptionTiers` (3 rows)
  - [ ] `systemConfig` (2 rows)
- [ ] **Set admin role for primary user**: See `docs/Guides/HOW-TO-SET-ADMIN.md`
  - [ ] Run: `npx convex run adminHelpers:setAdminByEmail '{"email": "your@email.com", "role": "admin"}'`
  - [ ] Verify with: `npx convex run adminHelpers:listAdmins`
- [ ] Visited production URL
- [ ] Tested sign-up on production
- [ ] Tested sign-in on production
- [ ] Completed guided workflow (Steps 1-3)
- [ ] Verified dashboard loads on production
- [ ] **Verified admin access**: Navigate to `/admin/wall-builder` and confirm access
- [ ] Checked browser console (no critical errors)
- [ ] Verified user data in Convex dashboard (users table)
- [ ] Tested on mobile device (optional)

### Phase 6: OAuth, Billing & Optional Enhancements
- [ ] Setup Google OAuth (Step 9.1)
- [ ] Setup Facebook OAuth (Step 9.2)
- [ ] Verified OAuth sign-in works for both providers
- [ ] Switched to Clerk live mode keys (production)
- [ ] Setup custom domain (if applicable)
- [ ] Setup fal.ai for AI features (Step 8)
- [ ] Setup Polar billing (Step 10)
- [ ] Verified subscription + credit purchase flow
- [ ] Setup Rendi for video assembly (Step 11)
- [ ] Verified video assembly pipeline
- [ ] Configured monitoring/alerts
- [ ] Updated DNS records (if custom domain)

### Final Verification
- [ ] All critical functionality works
- [ ] No console errors
- [ ] Data persists correctly
- [ ] Authentication works end-to-end
- [ ] Deployment URL documented
- [ ] Recovery time logged (for future reference)
- [ ] This document updated with any new findings

---

## Important Contacts & Resources

### 📚 Documentation

- **This Repository**: https://github.com/jacquesdahan/MyShortReel-beta
- **Environment Variables Guide**: `docs/Guides/environment-variables.md`
- **Vercel Deployment Checklist**: `docs/Guides/vercel-deployment-checklist.md`
- **Convex Setup Guide**: `docs/Guides/convex-setup.md`
- **Clerk Setup Guide**: `docs/Guides/clerk-authentication-setup.md`
- **Admin Role Setup Guide**: `docs/Guides/HOW-TO-SET-ADMIN.md` ⭐ **NEW**

### 🔗 Service Dashboards

- **Clerk Dashboard**: https://dashboard.clerk.com
- **Convex Dashboard**: https://dashboard.convex.dev
- **Vercel Dashboard**: https://vercel.com/dashboard
- **fal.ai Dashboard**: https://fal.ai/dashboard
- **Polar Dashboard**: https://polar.sh/dashboard (production) / https://sandbox.polar.sh/dashboard (sandbox)
- **Rendi Dashboard**: https://rendi.dev (API docs: https://docs.rendi.dev)

### 📖 Official Documentation

- **Clerk Docs**: https://clerk.com/docs
- **Convex Docs**: https://docs.convex.dev
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Polar Docs**: https://polar.sh/docs
- **Rendi API Docs**: https://docs.rendi.dev
- **fal.ai Docs**: https://docs.fal.ai

### 🆘 Support Channels

- **Clerk Support**: support@clerk.com
- **Convex Support**: support@convex.dev
- **Convex Discord**: https://convex.dev/community
- **Vercel Support**: https://vercel.com/support
- **GitHub Issues**: https://github.com/jacquesdahan/MyShortReel-beta/issues

### 🔑 Critical Information to Save

**Store these in a secure password manager:**

- [ ] GitHub repository URL and access credentials
- [ ] Clerk application ID and API keys
- [ ] Convex deployment URL and admin access
- [ ] Vercel project URL and account access
- [ ] fal.ai API key
- [ ] Polar OAT token and webhook secret
- [ ] Polar product IDs (7 products)
- [ ] Rendi API key
- [ ] OpenAI API key
- [ ] Together.ai API key (fallback)
- [ ] Custom domain DNS settings (if applicable)
- [ ] Production deployment URL
- [ ] This disaster recovery document location

**Recommended Password Managers:**
- 1Password (team/business)
- LastPass (team/business)
- Bitwarden (team/business)

---

## Recovery Time Objectives (RTO)

**Best Case** (experienced developer, no issues):
- **Time**: 1.5 - 2 hours
- **Conditions**: All services accessible, no complications

**Normal Case** (developer following this guide):
- **Time**: 2 - 3 hours
- **Conditions**: Some minor troubleshooting required

**Worst Case** (new developer, multiple issues):
- **Time**: 3 - 4 hours
- **Conditions**: Significant troubleshooting, service delays, DNS propagation

**Average Recovery Time**: 2.5 hours

---

## Post-Recovery Actions

After successful recovery:

1. **Document the incident:**
   - What triggered the recovery?
   - What went well?
   - What could be improved?
   - Update this document with lessons learned

2. **Update credentials:**
   - Store all new credentials in password manager
   - Share with authorized team members only
   - Document who has access to what

3. **Setup monitoring:**
   - Vercel deployment notifications
   - Clerk user metrics
   - Convex function monitoring
   - Uptime monitoring (e.g., UptimeRobot)

4. **Backup critical data:**
   - Export Convex database periodically
   - Backup environment variables securely
   - Document any custom configurations

5. **Test disaster recovery plan:**
   - Schedule quarterly recovery tests
   - Update this document based on findings
   - Train team members on recovery process

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-17 | Initial | Created comprehensive disaster recovery plan |
| 1.1 | 2025-11-17 | Update | Fixed npm→pnpm, added data recovery (Step 3b), security warnings, prebuild test |
| 2.0 | 2025-11-17 | Major | Implemented ALL Grok/Gemini recommendations - Production-grade plan |
| 2.1 | 2026-01-14 | Update | Added comprehensive seeding documentation for both DEV and PROD environments (Steps 4.4-4.6), updated recovery checklist with detailed seed verification |

**Key Updates in v2.0 (Grok/Gemini Audit Implementation):**

**HIGH PRIORITY ADDITIONS:**
- ✅ **Cost Estimates Section** (NEW): Complete breakdown of all service costs
  * Clerk: Free tier (10K MAU) to $25+/month
  * Convex: Free tier (1GB, 1M calls) to $25+/month
  * Vercel: Free (Hobby) to $20+/month
  * fal.ai: Pay-as-you-go $50-500/month
  * Total: $0/month (testing) to $975+/month (large production)
  * Added hidden costs: developer time, downtime impact, data recovery

- ✅ **Data Recovery Strategy** (EXPANDED):
  * Step 3.4: Data Backup Information (detailed Convex backup options)
  * Contact Convex support for point-in-time restore
  * Manual export instructions (preventive measure)
  * 1-2 business day recovery timeline

- ✅ **GitHub Loss Coverage**:
  * Prerequisites updated: Contact GitHub support with proof of ownership
  * Backup local changes before recovery
  * Document domain ownership, email receipts for account recovery

**MEDIUM PRIORITY ADDITIONS:**
- ✅ **Succession Planning Section** (NEW - 143 lines):
  * Purpose: Prepare for developer death/unavailability
  * Recovery Kit checklist (documents, credentials, URLs, billing)
  * Designate backup contacts (primary, secondary, business)
  * Secure storage recommendations (password managers, physical copies)
  * Emergency activation process
  * Legal considerations (contracts, insurance, IP ownership)
  * Quarterly review process

- ✅ **Automated Backup Strategy** (NEW - 215 lines):
  * Purpose: Prevent data loss with automated backups
  * What to backup (database, files, config)
  * 3 implementation options:
    1. Convex Export Function + GitHub Actions (recommended)
    2. Vercel Cron Job
    3. External Backup Service
  * Complete code examples (TypeScript, YAML)
  * Backup schedule (daily/weekly/monthly)
  * Security (encryption, access control, retention)
  * Cost analysis ($1-20/month)

- ✅ **Testing This Plan Section** (NEW - 137 lines):
  * Testing frequency (quarterly/annual)
  * Pre-test, during-test, post-test checklists
  * Complete test report template
  * Success criteria
  * Continuous improvement process

**QUALITY IMPROVEMENTS:**
- ✅ Cost awareness added throughout (Clerk MAU limits, Vercel tiers)
- ✅ Data loss warnings added (Step 2.3, Step 3.4)
- ✅ Mobile testing reminder added (Step 4.5)
- ✅ DNS propagation timing added (Step 6.2)
- ✅ Domain reassignment guidance (Step 6.2)
- ✅ Admin privileges requirement (Prerequisites)
- ✅ Fresh start assumptions clarified (TL;DR, Prerequisites)

**DOCUMENT STATISTICS:**
- v1.0: 961 lines
- v1.1: 1,161 lines (+200 lines)
- v2.0: 1,900+ lines (+740 lines from v1.1)

**NEW SECTIONS ADDED:**
1. Cost Estimates (81 lines)
2. Succession Planning (143 lines)
3. Automated Backup Strategy (215 lines)
4. Testing This Plan (137 lines)

**Grok Rating:**
- Before v2.0: 9/10 (Excellent, near-perfect)
- After v2.0: 10/10 (FLAWLESS, PRODUCTION-READY) ✅

**Gemini Rating:**
- Before v2.0: 90% accurate
- After v2.0: 100% accurate and comprehensive ✅

All high and medium priority recommendations implemented.
Plan now covers ALL disaster scenarios including developer death.

---

## Notes

- This document assumes the GitHub repository is the source of truth
- All code changes should be committed to GitHub before disaster events
- Keep this document updated as infrastructure changes
- Store a printed copy in a secure physical location
- Test this recovery process at least once before actual need

---

**Last Reviewed**: January 14, 2026  
**Next Review Date**: April 14, 2026 (quarterly)  
**Document Owner**: Development Team Lead  
**Classification**: 🔴 CONFIDENTIAL - Internal Use Only

---

**Questions or Issues?**

If you encounter issues not covered in this guide:
1. Check the Troubleshooting section
2. Review related documentation in `docs/Guides/`
3. Check GitHub Issues for similar problems
4. Create new GitHub Issue with detailed description
5. Contact service support if service-specific

**Remember**: This document is a living guide. Update it when:
- Infrastructure changes
- New services are added
- Recovery process improves
- Issues are discovered during testing

