# Developer Setup Guide

This guide takes a developer from zero to a running local environment. No prior knowledge of the project assumed. Follow every step in order.

**Time estimate:** 45–60 minutes

**Stack:** Next.js 14 + Convex + Clerk + Polar

---

## Section 1 — Prerequisites

Before you start, make sure you have the following installed and accounts created.

### Software

| Tool | Minimum version | Check |
|------|----------------|-------|
| Node.js | 18.x | `node --version` |
| npm | Included with Node | `npm --version` |
| Git | Any recent | `git --version` |

If Node.js is not installed: https://nodejs.org/en/download

### Accounts to create (free tiers work)

| Service | Purpose | Sign-up URL |
|---------|---------|-------------|
| GitHub | Clone the repo | https://github.com/signup |
| Convex | Backend database + functions | https://dashboard.convex.dev |
| Clerk | Authentication | https://clerk.com/sign-up |
| Polar | Billing and subscriptions | https://polar.sh |
| Resend | Transactional email | https://resend.com/signup |

Create all four accounts before continuing. You will need them in order.

---

## Section 2 — Clone and Install

Open a terminal and run:

```bash
git clone https://github.com/elpiarthera/vantage-starter.git
cd vantage-starter
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is required. The project uses React 19 alongside some packages that have not yet declared React 19 peer dependency support. Without this flag, npm will abort.

After install completes:

```bash
cp .env.example .env.local
```

This creates your local environment file. You will fill it in during the sections below.

---

## Section 3 — Convex Setup

Convex is the backend: database, serverless functions, and file storage in one. You run a local sync process that keeps your cloud deployment in sync with your code.

### Step 3.1 — Initialize Convex

In your terminal, from the project root:

```bash
npx convex dev
```

The first time you run this, it will:

1. Open a browser and ask you to log in to Convex
2. Ask you to create a new project — select **"Create a new project"**
3. Ask for a project name — enter anything, e.g. `my-app`
4. Ask for deployment type — select **"cloud deployment"**

After setup completes, Convex will automatically write these variables to your `.env.local`:

```
CONVEX_DEPLOYMENT=dev:your-project-name
NEXT_PUBLIC_CONVEX_URL=https://your-project-name.convex.cloud
```

Verify they are present:

```bash
grep CONVEX .env.local
```

You should see both lines. If not, open `.env.local` and add them manually — the values appear in the terminal output from the previous step.

> Important: The URL must NOT have a trailing slash. `https://your-project.convex.cloud` is correct. `https://your-project.convex.cloud/` will cause WebSocket connection failures.

Keep this terminal running. Convex watches for changes and syncs automatically.

---

## Section 4 — Clerk Setup

Clerk handles authentication — sign-in, sign-up, sessions, and user management.

### Step 4.1 — Create an application

1. Go to https://dashboard.clerk.com
2. Click **"Create Application"**
3. Enter an application name, e.g. `MyApp`
4. Under authentication methods, enable **Email** and **Password** at minimum. Google OAuth is optional.
5. Click **"Create Application"**

### Step 4.2 — Copy API keys

1. In the left sidebar, click **"API Keys"**
2. You will see two keys on this screen:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — starts with `pk_test_...`
   - `CLERK_SECRET_KEY` — starts with `sk_test_...`
3. Copy each key and add them to your `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_VALUE_HERE
CLERK_SECRET_KEY=sk_test_YOUR_VALUE_HERE
```

### Step 4.3 — Create the Convex JWT template

This step links Clerk authentication to Convex. Without it, the backend cannot verify who the user is.

1. In the left sidebar, click **"Configure"**
2. In the Configure submenu, click **"JWT Templates"**
3. Click **"+ New template"** (or **"+ Add new template"** — label varies by Clerk version)
4. In the template list, select **"Convex"**
5. Clerk will pre-fill the template for you. Do not change anything.
6. Click **"Save"**

After saving, you are on the template detail page. You need two values from here:

- **Issuer** — looks like `https://your-app-name.clerk.accounts.dev`
- **JWKS Endpoint** — looks like `https://your-app-name.clerk.accounts.dev/.well-known/jwks.json` (you do not need to add this to `.env.local`, it is for reference only)

### Step 4.4 — Add the Clerk JWT issuer to your env file

From the Issuer value you copied above, take the **domain only** — strip `https://`.

Add to `.env.local`:

```
CLERK_JWT_ISSUER_DOMAIN=your-app-name.clerk.accounts.dev
```

Correct format examples:
- `your-app-name.clerk.accounts.dev` — correct
- `https://your-app-name.clerk.accounts.dev` — wrong, do not include the protocol

### Step 4.5 — Add the Clerk JWT issuer to Convex

Convex also needs this value as an environment variable on its side.

1. Go to https://dashboard.convex.dev
2. Open your project
3. In the left sidebar, click **"Settings"**
4. Click **"Environment Variables"**
5. Click **"Add variable"**
6. Name: `CLERK_JWT_ISSUER_DOMAIN`
7. Value: `your-app-name.clerk.accounts.dev` (same domain-only format, no `https://`)
8. Click **"Save"**

### Step 4.6 — Configure redirect URLs in your env file

These tell Clerk where to send users after sign-in and sign-up. They are already in `.env.example`. Verify they are in your `.env.local`:

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/guided/step-1
```

---

## Section 5 — Verify Convex + Clerk Connection

In a new terminal (leave `npx convex dev` running in the first terminal), run:

```bash
npx convex dev --once
```

This runs a single sync cycle and exits. Watch the output.

**Expected output:** The command completes with no errors and exits with code 0.

**If you see an error mentioning `CLERK_JWT_ISSUER_DOMAIN`:** Double-check Section 4.5. The variable must be set in the Convex dashboard, not just in your `.env.local`.

**If you see a schema validation error:** The `convex/auth.config.js` file reads `CLERK_JWT_ISSUER_DOMAIN` at runtime. Make sure the variable is present in both places (`.env.local` and Convex dashboard settings).

---

## Section 6 — Polar Setup

Polar handles subscription billing and credit packages.

### Step 6.1 — Get your access token

1. Go to https://polar.sh
2. Log in or create an account
3. Click your avatar in the top right → **"Settings"**
4. In the left sidebar, click **"Access Tokens"** (under Developer)
5. Click **"Generate Token"**
6. Give it a name, e.g. `vantage-starter-dev`
7. Copy the token immediately — it is shown only once

Add to `.env.local`:

```
POLAR_ACCESS_TOKEN=your_token_here
```

### Step 6.2 — Create test products (optional for initial setup)

The app has a pricing page that references Polar product IDs. You can skip this step to get the app running and return to it when you need billing to work end-to-end.

If you want billing functional from the start:

1. In Polar, go to your organization
2. Click **"Products"** → **"New Product"**
3. Create three products: `Free`, `Pro`, `Team`
4. Note each product ID from the URL or product settings
5. These IDs are referenced in `config/` — search for `productId` to find where to add them

---

## Section 7 — Resend Setup

Resend handles transactional email (welcome emails, notifications).

### Step 7.1 — Get your API key

1. Go to https://resend.com and log in
2. In the left sidebar, click **"API Keys"**
3. Click **"Create API Key"**
4. Give it a name, e.g. `vantage-starter`
5. Copy the key

Add to `.env.local`:

```
RESEND_API_KEY=re_your_key_here
```

---

## Section 8 — Start Development

You need two terminal windows running simultaneously.

**Terminal 1 — Convex backend (if not already running):**

```bash
npx convex dev
```

**Terminal 2 — Next.js frontend:**

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

> If port 3000 is in use, Next.js will automatically try 3001. The terminal output will show the actual URL.

---

## Section 9 — Verify Everything Works

Work through this checklist after both servers are running.

- [ ] **Landing page renders** — http://localhost:3000 shows the app without console errors
- [ ] **Sign-up flow works** — click Sign Up, create an account, complete the flow
- [ ] **Redirect after sign-up** — you land on `/guided/step-1` after completing sign-up
- [ ] **Dashboard accessible** — navigate to http://localhost:3000/dashboard after signing in
- [ ] **Convex dashboard shows activity** — go to https://dashboard.convex.dev → your project → "Logs". You should see function calls appearing as you interact with the app.
- [ ] **No red errors in browser console** — open DevTools (F12) → Console tab. Errors about missing env vars mean you missed a step above.

### Common issues at this stage

**Blank page with no content**
- Check the terminal running `npm run dev` for build errors
- Check browser console for JavaScript errors

**"Clerk: missing publishable key" error**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is not in `.env.local`, or you did not restart `npm run dev` after adding it

**"Could not connect to Convex" error**
- `NEXT_PUBLIC_CONVEX_URL` is missing or has a trailing slash
- Convex dev server (`npx convex dev`) is not running

**Auth works but user data does not save**
- `CLERK_JWT_ISSUER_DOMAIN` is missing from Convex dashboard environment variables (Section 4.5)

---

## Section 10 — Environment Variables Reference

Complete table of all environment variables. Add all required ones to `.env.local` before starting.

| Variable | Required | Where to get it | Example value |
|----------|----------|-----------------|---------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Required | Clerk Dashboard → API Keys | `pk_test_abc...` |
| `CLERK_SECRET_KEY` | Required | Clerk Dashboard → API Keys | `sk_test_xyz...` |
| `CLERK_JWT_ISSUER_DOMAIN` | Required | Clerk Dashboard → JWT Templates → Convex template → Issuer (domain only, no https://) | `your-app.clerk.accounts.dev` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Required | Hard-coded value | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Required | Hard-coded value | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Required | Hard-coded value | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Required | Hard-coded value | `/guided/step-1` |
| `CONVEX_DEPLOYMENT` | Required | Auto-written by `npx convex dev` | `dev:your-project-name` |
| `NEXT_PUBLIC_CONVEX_URL` | Required | Auto-written by `npx convex dev` | `https://your-project.convex.cloud` |
| `CONVEX_URL` | Required for Vercel builds | Same value as `NEXT_PUBLIC_CONVEX_URL` | `https://your-project.convex.cloud` |
| `POLAR_ACCESS_TOKEN` | Required | Polar Dashboard → Settings → Access Tokens | `polar_at_...` |
| `RESEND_API_KEY` | Required | Resend Dashboard → API Keys | `re_abc123...` |
| `OPENAI_API_KEY` | Required for AI features | https://platform.openai.com/api-keys | `sk-proj-...` |
| `FAL_KEY` | Required for AI features | https://fal.ai/dashboard/keys | `key_id:key_secret` |
| `TOGETHER_API_KEY` | Optional (fallback AI) | https://api.together.xyz/settings/api-keys | `abc123...` |

### Variables also required in Convex Dashboard

Some variables must be set in the Convex dashboard in addition to `.env.local`. Convex serverless functions run in their own environment and cannot read your local `.env.local`.

Go to: https://dashboard.convex.dev → your project → Settings → Environment Variables

| Variable | Value |
|----------|-------|
| `CLERK_JWT_ISSUER_DOMAIN` | Same domain-only value as in `.env.local` |
| `FAL_KEY` | Same value as in `.env.local` (required when AI features are used) |
| `OPENAI_API_KEY` | Same value as in `.env.local` |

---

## Next Steps

Once the local environment is running:

- See `docs/Guides/convex-database-schema.md` for the full database structure
- See `docs/Guides/polar-subscription-setup-guide.md` for billing configuration details
- See `docs/Guides/deployment-guide.md` for deploying to Vercel
- See `docs/Guides/HOW-TO-SET-ADMIN.md` to grant admin access to your account
