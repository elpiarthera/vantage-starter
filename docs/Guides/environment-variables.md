# Environment Variables Reference

Complete reference for all environment variables this template needs.

**Last Updated**: November 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Clerk Authentication](#clerk-authentication)
3. [Convex Database](#convex-database)
4. [AI Services](#ai-services)
5. [Development vs Production](#development-vs-production)
6. [Setup Instructions](#setup-instructions)
7. [Validation](#validation)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Environment File Structure

\`\`\`
.env.local              # Local development (NOT committed)
.env.production         # Production variables (Vercel dashboard)
\`\`\`

### Required vs Optional

| Variable | Required | Phase | Purpose |
|----------|----------|-------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ Required | Phase 1 | Clerk public key |
| `CLERK_SECRET_KEY` | ✅ Required | Phase 1 | Clerk secret key |
| `CLERK_JWT_ISSUER_DOMAIN` | ✅ Required | Phase 1 | Clerk JWT issuer |
| `CLERK_WEBHOOK_SECRET` | ✅ Required | Phase 1 | Clerk webhook validation |
| `NEXT_PUBLIC_CONVEX_URL` | ✅ Required | Phase 2 | Convex deployment URL |
| `CONVEX_DEPLOYMENT` | ⚠️ Production | Phase 2 | Convex deployment name |
| `FAL_KEY` | ✅ Required | Phase 3 | fal.ai API key |
| `RENDI_API_KEY` | ✅ Required | Phase 3 | Rendi API key (Video Assembly) |
| `OPENAI_API_KEY` | ⚠️ Optional | Phase 3 | OpenAI (via AI Gateway) |

---

## Clerk Authentication

### Required Variables

\`\`\`env
# Clerk Public Key (exposed to browser)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Clerk Secret Key (server-side only)
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Clerk JWT Issuer Domain (for Convex integration)
CLERK_JWT_ISSUER_DOMAIN=your-app.clerk.accounts.dev

# Clerk Webhook Secret (for webhook validation)
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
\`\`\`

### Optional Clerk Variables

\`\`\`env
# Clerk URL Configuration (auto-configured, can override)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
\`\`\`

### Where to Get Clerk Keys

1. **Publishable Key & Secret Key**:
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Select your application
   - Navigate to **API Keys**
   - Copy both keys

2. **JWT Issuer Domain**:
   - Go to **JWT Templates**
   - Select the "convex" template you created
   - Copy the **Issuer URL** (without `https://`)
   - Example: `your-app.clerk.accounts.dev`

3. **Webhook Secret**:
   - Go to **Webhooks**
   - Create or select your webhook endpoint
   - Copy the **Signing Secret**

### Validation

\`\`\`typescript
// All Clerk keys should follow these patterns:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: /^pk_(test|live)_/
CLERK_SECRET_KEY: /^sk_(test|live)_/
CLERK_JWT_ISSUER_DOMAIN: /^[a-z0-9-]+\.clerk\.accounts\.dev$/
CLERK_WEBHOOK_SECRET: /^whsec_/
\`\`\`

---

## Convex Database

### Required Variables

\`\`\`env
# Convex Deployment URL (exposed to browser)
NEXT_PUBLIC_CONVEX_URL=https://your-project-name.convex.cloud

# Convex Deployment Name (production only, server-side)
CONVEX_DEPLOYMENT=prod:your-deployment-name
\`\`\`

### Where to Get Convex Variables

1. **Deployment URL**:
   - Run `npx convex dev` in your terminal
   - Copy the deployment URL shown
   - Example: `https://happy-animal-123.convex.cloud`
   - OR: Go to [Convex Dashboard](https://dashboard.convex.dev) > Your Project > Settings

2. **Deployment Name** (Production only):
   - Go to Convex Dashboard
   - Select your project
   - Navigate to **Settings** > **Deployments**
   - Copy the production deployment name

### Validation

\`\`\`typescript
// Convex URL pattern:
NEXT_PUBLIC_CONVEX_URL: /^https:\/\/[a-z0-9-]+\.convex\.cloud$/

// Deployment name pattern:
CONVEX_DEPLOYMENT: /^(dev|prod):[a-z0-9-]+$/
\`\`\`

---

## AI Services

### fal.ai (Required for Image, Video, Music, Narration)

```env
# fal.ai API Key (covers all fal.ai models)
FAL_KEY=your_key_id:your_key_secret
```

**Where to Get**:
1. Go to [fal.ai Dashboard](https://fal.ai/dashboard)
2. Sign up or login
3. Navigate to **API Keys**
4. Create new key
5. Copy the full key (format: `key_id:key_secret`)

**Validation**:
```typescript
FAL_KEY: /^[a-f0-9-]+:[a-zA-Z0-9]+$/
```

**Used For**:
- Image generation (Nano Banana Pro / Gemini 3 Pro, Seedream v4)
- Image editing
- Video generation (Kling Video v2.5 Turbo Pro)
- Music generation (Stable Audio 2.5, MiniMax Music)
- Narration (MiniMax Speech 2.6 HD / Turbo)

### Rendi (Required for Video Assembly)

```env
# Rendi API Key
RENDI_API_KEY=your_rendi_key
```

**Where to Get**:
1. Go to [Rendi Dashboard](https://rendi.dev)
2. Navigate to **API Keys**
3. Copy your key

**Used For**:
- Video assembly (Scene merging with XFADE)
- Professional audio mixing (Sidechain ducking)
- Final A/V multiplexing (Final render)

### OpenAI (Optional - Auto-configured via Vercel AI Gateway)

\`\`\`env
# OpenAI API Key (optional, AI Gateway provides default)
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
\`\`\`

**Where to Get**:
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or login
3. Navigate to **API Keys**
4. Create new key
5. Copy the secret key

**Note**: The Vercel AI Gateway provides OpenAI access by default. Only set this if you want to use your own OpenAI account for billing.

**Validation**:
\`\`\`typescript
OPENAI_API_KEY: /^sk-[a-zA-Z0-9]+$/
\`\`\`

---

## Development vs Production

### Development (.env.local)

\`\`\`env
# Clerk (test mode)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
CLERK_JWT_ISSUER_DOMAIN=your-app-dev.clerk.accounts.dev
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Convex (development deployment)
NEXT_PUBLIC_CONVEX_URL=https://happy-animal-123.convex.cloud

# AI Services (same keys for dev/prod)
FAL_KEY=your_key_id:your_key_secret
RENDI_API_KEY=your_rendi_key
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
\`\`\`

### Production (Vercel Environment Variables)

\`\`\`env
# Clerk (live mode)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
CLERK_JWT_ISSUER_DOMAIN=your-app.clerk.accounts.dev
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Convex (production deployment)
NEXT_PUBLIC_CONVEX_URL=https://your-prod-project.convex.cloud
CONVEX_DEPLOYMENT=prod:your-deployment-name

# AI Services (production keys recommended)
FAL_KEY=your_prod_key_id:your_prod_key_secret
RENDI_API_KEY=your_prod_rendi_key
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
\`\`\`

### Key Differences

| Variable | Development | Production |
|----------|-------------|------------|
| Clerk Keys | `pk_test_`, `sk_test_` | `pk_live_`, `sk_live_` |
| Convex URL | Dev deployment | Prod deployment |
| Convex Deployment | Not needed | `prod:name` required |
| Webhook URL | localhost or ngrok | Production domain |

---

## Setup Instructions

### Step 1: Create .env.local

\`\`\`bash
# Copy template
cp .env.example .env.local

# Or create manually
touch .env.local
\`\`\`

### Step 2: Add Variables

Follow the sections above to add each variable.

### Step 3: Verify Setup

Create `lib/env-check.ts`:

\`\`\`typescript
export function checkEnvVariables() {
  const required = {
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY,
    'CLERK_JWT_ISSUER_DOMAIN': process.env.CLERK_JWT_ISSUER_DOMAIN,
    'NEXT_PUBLIC_CONVEX_URL': process.env.NEXT_PUBLIC_CONVEX_URL,
    'FAL_KEY': process.env.FAL_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }

  console.log('✅ All required environment variables are set');
}
\`\`\`

Run check in `app/layout.tsx`:

\`\`\`typescript
if (process.env.NODE_ENV === 'development') {
  checkEnvVariables();
}
\`\`\`

---

## Validation

### Format Validation

Create `lib/validate-env.ts`:

\`\`\`typescript
const patterns = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: /^pk_(test|live)_/,
  CLERK_SECRET_KEY: /^sk_(test|live)_/,
  CLERK_JWT_ISSUER_DOMAIN: /^[a-z0-9-]+\.clerk\.accounts\.dev$/,
  CLERK_WEBHOOK_SECRET: /^whsec_/,
  NEXT_PUBLIC_CONVEX_URL: /^https:\/\/[a-z0-9-]+\.convex\.cloud$/,
  FAL_KEY: /^[a-f0-9-]+:[a-zA-Z0-9]+$/,
  OPENAI_API_KEY: /^sk-[a-zA-Z0-9]+$/,
};

export function validateEnv() {
  const errors: string[] = [];

  Object.entries(patterns).forEach(([key, pattern]) => {
    const value = process.env[key];
    if (value && !pattern.test(value)) {
      errors.push(`${key} has invalid format`);
    }
  });

  if (errors.length > 0) {
    console.error('Environment variable validation errors:', errors);
    throw new Error(errors.join('\n'));
  }
}
\`\`\`

---

## Troubleshooting

### Common Issues

#### "Clerk not configured"

**Cause**: Missing or invalid `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

**Solution**:
1. Verify key is in `.env.local`
2. Ensure key starts with `pk_test_` or `pk_live_`
3. Restart dev server after adding env vars

#### "Failed to fetch from Convex"

**Cause**: Invalid `NEXT_PUBLIC_CONVEX_URL`

**Solution**:
1. Run `npx convex dev` to get correct URL
2. Verify URL format: `https://[name].convex.cloud`
3. Check Convex deployment is active

#### "fal.ai authentication failed"

**Cause**: Invalid `FAL_KEY` format or expired key

**Solution**:
1. Verify format: `key_id:key_secret`
2. Regenerate key in fal.ai dashboard
3. Ensure no extra spaces or quotes in .env.local

#### "Webhook signature verification failed"

**Cause**: Incorrect `CLERK_WEBHOOK_SECRET`

**Solution**:
1. Copy exact secret from Clerk webhook settings
2. Ensure no trailing spaces
3. Verify webhook URL matches your deployment

### Debug Commands

\`\`\`bash
# Check if env vars are loaded
node -e "console.log(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)"

# Verify .env.local is being read
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Restart Next.js dev server (required after env changes)
npm run dev
\`\`\`

---

## .env.local Template

Copy this template to get started:

\`\`\`env
# ==================================================
# Environment Variables
# ==================================================

# --------------------------------------------------
# Clerk Authentication (Phase 1)
# Get from: https://dashboard.clerk.com
# --------------------------------------------------
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
CLERK_JWT_ISSUER_DOMAIN=your-app.clerk.accounts.dev
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# --------------------------------------------------
# Convex Database (Phase 2)
# Get from: https://dashboard.convex.dev
# --------------------------------------------------
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
# CONVEX_DEPLOYMENT=prod:your-deployment  # Production only

# --------------------------------------------------
# AI Services (Phase 3)
# --------------------------------------------------

# fal.ai - Required for images, video, music, narration
# Get from: https://fal.ai/dashboard/keys
FAL_KEY=your_key_id:your_key_secret

# OpenAI - Optional (AI Gateway provides default access)
# Get from: https://platform.openai.com/api-keys
# OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# --------------------------------------------------
# Optional Configuration
# --------------------------------------------------

# Node environment (auto-set by Next.js)
# NODE_ENV=development

# Enable debug logging
# DEBUG=true
\`\`\`

---

**Last Updated**: December 19, 2025  
**Version**: 1.1
