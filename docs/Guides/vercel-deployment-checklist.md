# Vercel Deployment Environment Variables Checklist

**Last Updated**: November 17, 2025  
**Status**: ✅ Production-Ready  
**Related**: Sprint 4 - Vercel Deployment Fix

---

## 🎯 Quick Reference

You need **7 required** environment variables for Vercel deployment (Sprint 6+).

💡 **Pro Tip**: Use `.env.example` as your reference template!

### ✅ **All Variables Must Be Set For All Environments**

When adding each variable in Vercel:
- ✅ Check **Production**
- ✅ Check **Preview**
- ✅ Check **Development**

⚠️ **CRITICAL**: Clerk redirect URLs (`signInFallbackRedirectUrl`, `signUpFallbackRedirectUrl`, `afterSignOutUrl`) are now configured directly in `app/ClientProviders.tsx` as props on the `<ClerkProvider>` component. **No environment variables are needed for redirect URLs.**

⚠️ **ALSO CRITICAL**: Both `CONVEX_URL` and `CONVEX_DEPLOY_KEY` are required for the prebuild script. Without them, deployment will fail with:
```
error: option '--url <url>' argument missing
OR
401 Unauthorized: MissingAccessToken
```

---

## 📋 Required Environment Variables (7)

### 1️⃣ Convex Variables (3)

#### `CONVEX_URL`
```
Name: CONVEX_URL
Value: https://YOUR-PROJECT.convex.cloud
Environments: ✅ Production, ✅ Preview, ✅ Development
Purpose: Prebuild script for code generation
```

✅ **Include `https://`** - Used by build script

🔥 **CRITICAL**: This variable is required for `prebuild` script (`convex codegen --url ${CONVEX_URL}`).
If missing, Vercel deployment will fail immediately with "argument missing" error.

**How to Get**:
```bash
# In your local terminal
npx convex dev
# Copy the URL shown (e.g., https://happy-animal-123.convex.cloud)
```

**Or from Convex Dashboard**:
1. Go to https://dashboard.convex.dev
2. Select your project
3. Copy the deployment URL from the dashboard

---

#### `NEXT_PUBLIC_CONVEX_URL`
```
Name: NEXT_PUBLIC_CONVEX_URL
Value: https://YOUR-PROJECT.convex.cloud
Environments: ✅ Production, ✅ Preview, ✅ Development
Purpose: Client-side Convex connection
```

✅ **Include `https://`** - Same value as `CONVEX_URL`

⚠️ **Critical**: Both `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL` must have the **exact same value**.

---

#### `CONVEX_DEPLOY_KEY`
```
Name: CONVEX_DEPLOY_KEY
Value: prod:trustworthy-sparrow-452|xxxxxxxxxxxxxxxxxx
Environments: ✅ Production, ✅ Preview, ✅ Development
Purpose: Authentication for Convex codegen during build
```

🔥 **CRITICAL**: This key is required for `convex codegen` to authenticate with Convex API.
Without it, build will fail with `401 Unauthorized: MissingAccessToken`.

**How to Get**:

**Option 1: From Convex Dashboard** (Recommended)
1. Go to https://dashboard.convex.dev
2. Select your project (`trustworthy-sparrow-452`)
3. Go to **Settings** → **Deploy Keys**
4. Click **"Generate Deploy Key"**
5. Copy the entire key (format: `prod:deployment-name|long-token-string`)

**Option 2: From Local Terminal**
```bash
# This will show your deploy key
npx convex deploy --cmd 'echo' --preview-create
# Look for the CONVEX_DEPLOY_KEY in the output
```

**Important Notes**:
- The key starts with `prod:` for production deployments
- Keep this key secret (don't commit to git)
- Each Convex project has its own unique deploy key
- If you lose the key, you can generate a new one from the dashboard

---

### 2️⃣ Clerk Authentication Variables (3)

#### `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
```
Name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_test_xxxxxxxxxxxxx  (or pk_live_ for production)
Environments: ✅ Production, ✅ Preview, ✅ Development
Purpose: Client-side Clerk authentication
```

**How to Get**:
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **API Keys**
4. Copy the **Publishable Key**

**Formats**:
- Testing: `pk_test_xxxxxxxxxxxxx`
- Production: `pk_live_xxxxxxxxxxxxx`

---

#### `CLERK_SECRET_KEY`
```
Name: CLERK_SECRET_KEY
Value: sk_test_xxxxxxxxxxxxx  (or sk_live_ for production)
Environments: ✅ Production, ✅ Preview, ✅ Development
Purpose: Server-side Clerk authentication
```

**How to Get**:
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **API Keys**
4. Copy the **Secret Key**

⚠️ **Security**: Never expose this in client code. Keep it secret.

**Formats**:
- Testing: `sk_test_xxxxxxxxxxxxx`
- Production: `sk_live_xxxxxxxxxxxxx`

---

#### `CLERK_JWT_ISSUER_DOMAIN`
```
Name: CLERK_JWT_ISSUER_DOMAIN
Value: your-app.clerk.accounts.dev
Environments: ✅ Production, ✅ Preview, ✅ Development
Purpose: Convex JWT validation
```

❌ **DO NOT include `https://`** - Domain only!

✅ **Correct**: `your-app.clerk.accounts.dev`  
❌ **Wrong**: `https://your-app.clerk.accounts.dev`

**How to Get**:
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **JWT Templates**
4. Select the **"convex"** template
5. Copy the **Issuer** domain (remove `https://` if present)

**Example**:
- Development: `your-app-dev.clerk.accounts.dev`
- Production: `your-app.clerk.accounts.dev`

**ℹ️ NOTE**: Clerk redirect URLs (`signInFallbackRedirectUrl`, `signUpFallbackRedirectUrl`, `afterSignOutUrl`) are configured in `app/ClientProviders.tsx`. See the `<ClerkProvider>` component for these settings:
```tsx
<ClerkProvider
  afterSignOutUrl="/sign-in"
  signInFallbackRedirectUrl="/dashboard"
  signUpFallbackRedirectUrl="/guided/step-1"
  appearance={{ ... }}
>
```

---

### 3️⃣ AI Services (1)

#### `FAL_KEY`
```
Name: FAL_KEY
Value: your_key_id:your_key_secret
Environments: ✅ Production, ✅ Preview, ✅ Development
Purpose: AI image/video/music generation
```

🔥 **REQUIRED for Sprint 6+**: Video generation with Kling Video v2.1 Pro requires this key.

**How to Get**:
1. Go to [fal.ai Dashboard](https://fal.ai/dashboard/keys)
2. Sign up or login
3. Navigate to **API Keys**
4. Create new key
5. Copy the full key (format: `key_id:key_secret`)

**Format**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Cost Note**: fal.ai is pay-as-you-go. Kling Video v2.1 Pro costs **$0.05 per second** of generated video (5s = $0.25, 10s = $0.50). Estimate $50-500/month depending on usage.

---

## 🎨 Optional Variables (0)

_All variables above are required for Sprint 6+ (AI Video Generation)._

---

## 🚀 Step-by-Step Setup

### Step 1: Gather All Values

- [ ] Get Convex URL from `npx convex dev`
- [ ] Get Convex Deploy Key from Convex Dashboard → Settings → Deploy Keys
- [ ] Get Clerk Publishable Key from Clerk Dashboard
- [ ] Get Clerk Secret Key from Clerk Dashboard
- [ ] Get Clerk JWT Issuer Domain from Clerk JWT Templates (NO `https://`)
- [ ] Get fal.ai API Key from fal.ai Dashboard → API Keys **(REQUIRED for Sprint 6+)**

💡 **Tip**: See `.env.example` in the project root for reference format!

💡 **Redirect URLs**: Configured in `app/ClientProviders.tsx`, not as environment variables.

### Step 2: Add to Vercel

1. Go to: https://vercel.com/YOUR-USERNAME/YOUR-PROJECT/settings/environment-variables

2. **Add each variable**:
   - Click "Add New"
   - Enter **Name** (exactly as shown above)
   - Enter **Value**
   - ✅ Check all 3 environments: Production, Preview, Development
   - Click "Save"

3. **Repeat for all 7 variables** (all required for Sprint 6+)

### Step 3: Verify Setup

After adding all variables:

- [ ] Total variables added: 7 (all required)
- [ ] All have checkmarks for all 3 environments
- [ ] `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL` are identical
- [ ] `CLERK_JWT_ISSUER_DOMAIN` does NOT have `https://`
- [ ] All Clerk keys match (test vs live mode)
- [ ] `FAL_KEY` format is correct (`key_id:key_secret`)
- [ ] Redirect URLs configured in `app/ClientProviders.tsx` (not env vars)

### Step 4: Trigger Deployment

```bash
# Push to trigger Vercel deployment
git push origin sprint-4-file-storage
```

### Step 5: Monitor Build

1. Go to Vercel Dashboard → Deployments
2. Watch the build logs
3. Look for:
   ```
   ✓ Running "convex codegen --url $CONVEX_URL"
   ✓ Generated convex/_generated/api.ts
   ✓ Running "next build"
   ✓ Compiled successfully
   ```

---

## 🔍 Common Mistakes & Fixes

### ❌ Mistake 1: Missing `CONVEX_URL` variable

**Error in Build Logs**:
```
> convex codegen --url ${CONVEX_URL}
error: option '--url <url>' argument missing
 ELIFECYCLE  Command failed with exit code 1.
```

**Wrong**: Only adding `NEXT_PUBLIC_CONVEX_URL`  
**Right**: Must add BOTH `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL`

**Why**: 
- `CONVEX_URL` is used by the **prebuild script** (server-side, runs during build)
- `NEXT_PUBLIC_CONVEX_URL` is used by the **client code** (browser-side, runtime)

**Fix**: Add `CONVEX_URL` to Vercel environment variables with the same value as `NEXT_PUBLIC_CONVEX_URL`.

---

### ❌ Mistake 2: Including `https://` in `CLERK_JWT_ISSUER_DOMAIN`

**Wrong**: `https://your-app.clerk.accounts.dev`  
**Right**: `your-app.clerk.accounts.dev`

**Why**: Convex's `auth.config.js` expects just the domain, not the full URL.

**Fix**: Remove `https://` from the value in Vercel.

---

### ❌ Mistake 3: Different values for `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL`

**Wrong**:
- `CONVEX_URL`: `https://dev-123.convex.cloud`
- `NEXT_PUBLIC_CONVEX_URL`: `https://prod-456.convex.cloud`

**Right**: Both must be **identical**

**Fix**: Copy-paste the same URL for both variables.

---

### ❌ Mistake 4: Missing environment checkboxes

**Wrong**: Only "Production" checked  
**Right**: All 3 environments checked

**Why**: Preview deployments (PRs) and development builds also need these variables.

**Fix**: Edit each variable and check all 3 boxes.

---

### ❌ Mistake 5: Using `pk_test_` keys in production

**Wrong**: Production deployment with `pk_test_` keys  
**Right**: Production uses `pk_live_` keys

**Why**: Test mode has limitations and different data isolation.

**Fix**: 
1. Switch to live mode in Clerk Dashboard
2. Copy `pk_live_` and `sk_live_` keys
3. Update Vercel variables

---

### ❌ Mistake 6: Forgetting to redeploy

**Wrong**: Adding variables but not triggering a new build  
**Right**: Push or manually redeploy after adding variables

**Why**: Vercel doesn't automatically rebuild when variables change.

**Fix**: Either:
```bash
git push  # Triggers automatic deployment
```
Or: Vercel Dashboard → Deployments → ... → Redeploy

---

## 📊 Environment Variables Summary Table

| Variable | Include `https://`? | Format | Where to Get |
|----------|---------------------|--------|--------------|
| `CONVEX_URL` | ✅ Yes | `https://xxx.convex.cloud` | `npx convex dev` |
| `CONVEX_DEPLOY_KEY` | N/A | `prod:xxx\|token` | Convex Dashboard → Settings → Deploy Keys |
| `NEXT_PUBLIC_CONVEX_URL` | ✅ Yes | `https://xxx.convex.cloud` | Same as `CONVEX_URL` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | N/A | `pk_test_xxx` or `pk_live_xxx` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | N/A | `sk_test_xxx` or `sk_live_xxx` | Clerk Dashboard → API Keys |
| `CLERK_JWT_ISSUER_DOMAIN` | ❌ **NO** | `xxx.clerk.accounts.dev` | Clerk Dashboard → JWT Templates |
| `FAL_KEY` | N/A | `key_id:key_secret` | fal.ai Dashboard → API Keys |

💡 **Reference**: All variables are documented in `.env.example` in the project root.

ℹ️ **Redirect URLs**: Configured in `app/ClientProviders.tsx`:
- `afterSignOutUrl="/sign-in"`
- `signInFallbackRedirectUrl="/dashboard"`
- `signUpFallbackRedirectUrl="/guided/step-1"`

---

## ✅ Final Checklist

Before deployment:

- [ ] All 7 required variables added to Vercel
- [ ] All variables set for Production, Preview, Development
- [ ] `CLERK_JWT_ISSUER_DOMAIN` verified WITHOUT `https://`
- [ ] `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL` are identical
- [ ] `CONVEX_DEPLOY_KEY` starts with `prod:`
- [ ] `FAL_KEY` format is `key_id:key_secret`
- [ ] Clerk keys match environment (test vs live)
- [ ] Redirect URLs configured in `app/ClientProviders.tsx`
- [ ] Code pushed to trigger deployment
- [ ] Build logs show successful Convex codegen
- [ ] Deployment successful
- [ ] Sign-in/sign-up work with custom styling
- [ ] AI video generation works (Sprint 6+)

✅ **Quick Verification**: Compare your Vercel settings with `.env.example` in the project root.

---

## 🆘 Troubleshooting

### Build fails with "error: option '--url <url>' argument missing"

**Cause**: `CONVEX_URL` environment variable not set in Vercel

**Error**:
```
> convex codegen --url ${CONVEX_URL}
error: option '--url <url>' argument missing
```

**Fix**:
1. Go to Vercel → Project Settings → Environment Variables
2. Add `CONVEX_URL` = `https://your-project.convex.cloud`
3. Check all 3 environments (Production, Preview, Development)
4. Redeploy

**Test locally**:
```bash
CONVEX_URL=https://xxx.convex.cloud pnpm run prebuild
```

---

### Build fails with "401 Unauthorized: MissingAccessToken"

**Cause**: `CONVEX_DEPLOY_KEY` environment variable not set in Vercel

**Error**:
```
✖ Error fetching GET https://api.convex.dev/api/deployment/xxx/team_and_project 
401 Unauthorized: MissingAccessToken: An access token is required for this command.
Authenticate with `npx convex dev`
 ELIFECYCLE  Command failed with exit code 1.
```

**Fix**:
1. Go to Convex Dashboard → Settings → Deploy Keys
2. Click "Generate Deploy Key"
3. Copy the key (format: `prod:deployment-name|token`)
4. Go to Vercel → Project Settings → Environment Variables
5. Add `CONVEX_DEPLOY_KEY` with the copied value
6. Check all 3 environments (Production, Preview, Development)
7. Redeploy

**Test locally**:
```bash
CONVEX_DEPLOY_KEY="prod:xxx|token" CONVEX_URL=https://xxx.convex.cloud pnpm run prebuild
```

---

### Build fails with "Module not found: @/convex/_generated/api"

**Cause**: Prebuild script didn't run or failed

**Fix**:
1. Verify `CONVEX_URL` exists in Vercel
2. Verify `CONVEX_DEPLOY_KEY` exists in Vercel
3. Check both include correct values
4. Check Vercel build logs for prebuild errors
5. Test locally: `CONVEX_DEPLOY_KEY="prod:xxx|token" CONVEX_URL=https://xxx.convex.cloud pnpm run build`

---

### "Clerk not configured" error in deployed app

**Cause**: Missing or incorrect Clerk keys

**Fix**:
1. Check all 4 Clerk variables are set
2. Verify keys are for correct environment (test vs live)
3. Check browser console for specific error

---

### "Auth integration failed" or JWT errors

**Cause**: Incorrect `CLERK_JWT_ISSUER_DOMAIN` format

**Fix**:
1. Remove `https://` from the domain
2. Verify it matches Clerk's JWT template issuer
3. Check no trailing slashes or spaces
4. Reference `.env.example` for correct format

---

### Build succeeds but app doesn't connect to Convex

**Cause**: `NEXT_PUBLIC_CONVEX_URL` missing or different from `CONVEX_URL`

**Fix**:
1. Ensure `NEXT_PUBLIC_CONVEX_URL` is set
2. Verify it's identical to `CONVEX_URL`
3. Check browser network tab for connection attempts

---

## 📚 Related Documentation

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Convex + Clerk Setup](https://docs.convex.dev/auth/clerk)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [Convex Dashboard](https://dashboard.convex.dev)
- [fal.ai Dashboard](https://fal.ai/dashboard)

---

**Document Version**: 1.0  
**Last Verified**: November 17, 2025  
**Next Review**: Before production launch  
**Maintained By**: MyShortReel Development Team

