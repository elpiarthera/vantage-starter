# Vercel Deployment Failure - Missing Convex Generated Files

**Date**: 2025-01-17 (Original) → 2025-11-19 (Recurring Issue)  
**Branch**: `sprint-4-file-storage` (Original) → `main` (Current)  
**Commit**: `fc3752b` (original error) → `410ffd4` (fix applied)  
**Status**: ⚠️ RECURRING - User Missing `CONVEX_URL` Environment Variable

---

## ⚠️ RECURRING ISSUE - 2025-11-19

**Current Error**: Same issue recurring - `CONVEX_URL` not set in Vercel

**Build Logs** (2025-11-19 11:24):
```
11:24:12.364 > my-v0-project@0.1.0 prebuild /vercel/path0
11:24:12.364 > convex codegen --url ${CONVEX_URL}
11:24:12.364 
11:24:13.018 error: option '--url <url>' argument missing
11:24:13.040  ELIFECYCLE  Command failed with exit code 1.
11:24:13.058 Error: Command "pnpm run build" exited with 1
```

**Root Cause**: User added `NEXT_PUBLIC_CONVEX_URL` but forgot to add `CONVEX_URL` (without `NEXT_PUBLIC_` prefix).

---

## ✅ RESOLUTION APPLIED (ORIGINAL - 2025-01-17)

**Fix Implemented**: 2025-01-17 12:30 EST  
**Method**: Option 1 - Prebuild Script (Recommended)  
**Code Changes**: `package.json` updated with `prebuild` script

### What Was Done:

1. ✅ **Added prebuild script to package.json:**
   ```json
   "scripts": {
     "prebuild": "convex codegen --url ${CONVEX_URL}",
     "build": "next build"
   }
   ```

2. **Current Steps Required (2025-11-19):**
   - [ ] Add `CONVEX_URL` environment variable in Vercel (CRITICAL)
   - [ ] Ensure all 3 environments are checked (Production, Preview, Development)
   - [ ] Redeploy (automatic after adding variable)
   - [ ] Verify build succeeds
   - [ ] Test deployed application

---

## 🚨 Error Summary

**Build Failed**: `Module not found: Can't resolve '@/convex/_generated/api'`

### Failed at:
- Build time: 12:06:47
- Build location: Washington, D.C. (iad1)
- Next.js version: 14.2.25
- Node environment: Production build

---

## 📋 Error Details

### Primary Error:
```
./hooks/business-logic/useAssetManagement.ts
Module not found: Can't resolve '@/convex/_generated/api'
```

### Affected Files (Import Chain):
1. `hooks/business-logic/useAssetManagement.ts` → Missing Convex API
2. `hooks/business-logic/useProjectData.ts` → Missing Convex API
3. `hooks/useFileUpload.ts` → Missing Convex API

### Import Trace:
```
./hooks/business-logic/useAssetManagement.ts
  ↓ imported by
./components/asset-management/AssetSelector.tsx
  ↓ imported by
./components/scene-management/FrameAssignment.tsx
  ↓ imported by
./components/scene-management/SceneEditor.tsx
  ↓ imported by
./components/scene-management/SceneManager.tsx
  ↓ imported by
./app/guided/step-3/page.tsx
```

---

## 🔍 Root Cause Analysis

### Issue: Convex Generated Files Not Available in Vercel Build

**What's happening:**
1. **Local Development**: `convex/_generated/` folder is created when you run `npx convex dev`
2. **Git**: `convex/_generated/` is gitignored (as it should be)
3. **Vercel Build**: No Convex codegen step runs before `next build`
4. **Result**: Build fails because TypeScript can't find `@/convex/_generated/api`

### Why This Happens:

Convex generates TypeScript files (`api.ts`, `dataModel.ts`, etc.) during development via:
```bash
npx convex dev  # Creates convex/_generated/*
```

These files are **NOT checked into git** because they're generated, but they're **REQUIRED** for TypeScript compilation.

Vercel's build process:
```
1. Clone repo (no _generated files)
2. Install dependencies (pnpm install)
3. Run "next build" ❌ FAILS HERE - missing _generated files
```

---

## ✅ Solution

### Option 1: Add Convex Codegen to Build Script (RECOMMENDED)

**Add prebuild script to generate Convex types before build:**

1. **Update `package.json`:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "prebuild": "convex codegen --url $CONVEX_URL",
    "start": "next start",
    "lint": "next lint"
  }
}
```

2. **Add Environment Variable in Vercel:**
   - Go to Vercel Project Settings → Environment Variables
   - Add: `CONVEX_URL` = `https://your-deployment-name.convex.cloud`
   - Add: `CONVEX_DEPLOY_KEY` (if needed for production)

**How it works:**
- `prebuild` runs automatically before `build`
- `convex codegen` generates the TypeScript files
- `next build` finds the files and succeeds ✅

---

### Option 2: Use Convex Build Hook (ALTERNATIVE)

**Configure Vercel to run Convex deploy:**

1. **Update `package.json`:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "convex deploy --prod --cmd 'next build'",
    "start": "next start",
    "lint": "next lint"
  }
}
```

2. **Add to Vercel:**
   - `CONVEX_DEPLOY_KEY` environment variable

**How it works:**
- `convex deploy --prod` deploys Convex functions
- `--cmd 'next build'` runs Next.js build after Convex is ready
- Codegen happens automatically during deployment

---

### Option 3: Manual Codegen in Build Command (SIMPLE)

**Change Vercel build command:**

1. **In Vercel Project Settings → Build & Development Settings:**
   - Build Command: `npx convex codegen --url $CONVEX_URL && pnpm run build`

2. **Add Environment Variable:**
   - `CONVEX_URL` = `https://your-deployment-name.convex.cloud`

---

## 🎯 Recommended Fix (Step by Step)

### Step 1: Get Your Convex Deployment URL

```bash
# In your local project
npx convex dev

# Output will show:
# Deploying to: https://xxxx.convex.cloud
# Copy this URL
```

### Step 2: Update package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "prebuild": "convex codegen --url ${CONVEX_URL:-https://your-default.convex.cloud}",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest"
  }
}
```

**Note**: Replace `your-default.convex.cloud` with your actual Convex URL.

### Step 3: Add Environment Variable to Vercel

1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add variable:
   - **Name**: `CONVEX_URL`
   - **Value**: `https://your-deployment.convex.cloud`
   - **Environments**: Production, Preview, Development (all)
3. Save

### Step 4: Redeploy

```bash
# Push changes
git add package.json
git commit -m "fix: Add Convex codegen to prebuild script"
git push origin sprint-4-file-storage

# Or trigger redeploy in Vercel dashboard
```

---

## 🔒 Security Considerations

### Environment Variables Needed:

| Variable | Purpose | Required |
|----------|---------|----------|
| `CONVEX_URL` | Public deployment URL | ✅ Yes |
| `CONVEX_DEPLOY_KEY` | Deploy key for CI/CD | ⚠️ For auto-deploy |
| `CLERK_SECRET_KEY` | Clerk backend auth | ✅ Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend | ✅ Yes |
| `NEXT_PUBLIC_CONVEX_URL` | Convex frontend | ✅ Yes |

**Note**: `CONVEX_URL` (without `NEXT_PUBLIC_`) is for build-time codegen only.

---

## 📝 Verification Steps

After implementing the fix:

1. **Check Vercel Build Logs:**
   ```
   ✓ Running "convex codegen"
   ✓ Generated convex/_generated/api.ts
   ✓ Generated convex/_generated/dataModel.ts
   ✓ Running "next build"
   ✓ Compiled successfully
   ```

2. **Test Locally:**
   ```bash
   # Clean generated files
   rm -rf convex/_generated
   
   # Test prebuild script
   CONVEX_URL=https://your-deployment.convex.cloud pnpm run prebuild
   
   # Verify files created
   ls convex/_generated/
   # Should show: api.d.ts, api.js, dataModel.d.ts, server.d.ts, etc.
   
   # Test build
   pnpm run build
   ```

3. **Test Deployment:**
   - Push to branch
   - Verify Vercel preview deployment succeeds
   - Check production deployment

---

## 📚 Related Documentation

- [Convex Production Deployment](https://docs.convex.dev/production/hosting)
- [Convex Codegen CLI](https://docs.convex.dev/cli#codegen)
- [Vercel Build Configuration](https://vercel.com/docs/concepts/deployments/configure-a-build)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

## ✅ Resolution Checklist

- [x] Add `prebuild` script to `package.json` ✅ DONE (commit 410ffd4)
- [ ] Add `CONVEX_URL` to Vercel environment variables (USER ACTION REQUIRED)
- [ ] Commit and push changes ✅ DONE
- [ ] Verify build succeeds in Vercel (PENDING)
- [ ] Test deployed application (PENDING)
- [ ] Update this document with resolution date (PENDING VERIFICATION)

---

## 🎯 Expected Outcome

After fix:
```
✓ Dependencies installed
✓ Convex codegen completed  ← prebuild script runs here
✓ TypeScript compilation successful
✓ Next.js build successful
✓ Deployment successful
```

---

**Status**: ⚠️ RECURRING ISSUE - User Action Required  
**Assigned To**: User (Must add `CONVEX_URL` to Vercel)  
**Priority**: 🔥 CRITICAL (Blocks all deployments)  
**Estimated Remaining Time**: 2 minutes (add env var → auto-redeploy)

---

## 🎯 IMMEDIATE ACTION REQUIRED

### Step 1: Go to Vercel
```
https://vercel.com/your-project/settings/environment-variables
```

### Step 2: Add Variable
```
Name: CONVEX_URL
Value: https://trustworthy-sparrow-452.convex.cloud
Environments: ✅ Production, ✅ Preview, ✅ Development
```

### Step 3: Save & Redeploy
- Click "Save"
- Vercel will automatically trigger a new deployment
- Build should succeed in ~2 minutes

---

**Last Updated**: 2025-11-19  
**Issue Recurrence**: Confirmed  
**Root Cause**: Missing `CONVEX_URL` environment variable in Vercel  
**Solution**: Add the variable (same value as `NEXT_PUBLIC_CONVEX_URL`)  
**Next Step**: User adds `CONVEX_URL` to Vercel → Auto-redeploy → Success ✅

