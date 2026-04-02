# E2E Testing with Stagehand + Browserbase

This directory contains end-to-end tests using [Stagehand](https://docs.stagehand.dev/) with [Browserbase](https://www.browserbase.com/).

## 🚀 Quick Start

### Prerequisites

Ensure these environment variables are set in `.env.local`:

```bash
# Browserbase credentials (from https://www.browserbase.com/overview)
BROWSERBASE_API_KEY=bb_live_xxxxx
BROWSERBASE_PROJECT_ID=xxxxx

# OpenAI for AI actions (from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-xxxxx

# Test account credentials
TEST_EMAIL=your-test-email@gmail.com
TEST_PASSWORD=your-test-password

# Test URL (Vercel preview or production)
TEST_URL=https://your-app.vercel.app
```

### Run a Test

```bash
npx tsx tests/e2e/login-flow.ts
```

The test will:
1. Start a Browserbase browser session
2. Show a **live view URL** you can watch in real-time
3. Execute the test steps using AI
4. Prompt for verification code if needed (check your email)
5. Save a screenshot to `tests/e2e/screenshots/`

---

## 📁 Test Structure

```
tests/e2e/
├── README.md           # This file
├── login-flow.ts       # Login/auth test ✅
├── guided-flow.ts      # Guided video creation (Steps 1-6) ✅
├── dashboard.ts        # Dashboard navigation ✅
└── screenshots/        # Screenshots from test runs
```

## 🧪 Available Tests

### 1. Login Flow (`login-flow.ts`)
Tests the complete authentication flow with email verification.

```bash
npx tsx tests/e2e/login-flow.ts
```

**What it tests:**
- Navigate to sign-in page
- Enter email and password
- Handle verification code (interactive prompt)
- Verify successful login to dashboard

---

### 2. Guided Flow (`guided-flow.ts`)
Tests the guided video creation flow (Steps 1-3).

```bash
# Basic test (Step 1 only - free)
npx tsx tests/e2e/guided-flow.ts

# Full test with AI generation (costs credits!)
ENABLE_AI_GENERATION=true npx tsx tests/e2e/guided-flow.ts
```

**What it tests:**
- **Step 1**: Emotional Foundation
  - Select "Birthday" occasion
  - Select "Joyful Celebration" emotion
  - Fill "Project name" field
  - Fill "Your Personal Story" textarea
  - Click "Continue to The Story ✨" (5 credits)

- **Step 2**: The Story (AI Chat) *
  - Type feedback in chat textarea
  - Click blue Send button (1 credit)
  - Click "✓ Approve this Direction"
  - Click "Continue to Visual Style ✨"

- **Step 2b**: Visual Style *
  - Select "Cinematic" style card
  - Click "Continue to Scene Design"

- **Step 3**: Visual Design (screenshot only) *
  - Extract scene count
  - Screenshot only (video generation costs 20 credits/scene)

\* Only runs if `ENABLE_AI_GENERATION=true`

---

### 3. Dashboard (`dashboard.ts`)
Tests login and dashboard navigation.

```bash
npx tsx tests/e2e/dashboard.ts
```

**What it tests:**
- **Step 1**: Sign in (email, password, 2FA verification code)
- **Step 2**: Dashboard home page loads
- **Step 3**: Quick Stats Cards (Total Projects, Credits, Videos, Storage)
- **Step 4**: Click purple "View All Projects" → /dashboard/projects
- **Step 5**: Click green "Browse Templates" → /dashboard/templates  
- **Step 6**: Click orange "Manage Account" → /dashboard/account

---

## ✍️ Creating New Tests

### Template

Copy this template to create a new test:

```typescript
/**
 * E2E Test: [Test Name]
 * 
 * Run with: npx tsx tests/e2e/[filename].ts
 */

import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const TEST_URL = process.env.TEST_URL || "https://your-app.vercel.app";

async function runTest() {
  console.log("🚀 Starting E2E Test...\n");

  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    model: "openai/gpt-4o",
  });

  try {
    await stagehand.init();
    console.log("✅ Browser session started");
    console.log(`🔗 Live view: ${stagehand.browserbaseSessionURL}\n`);

    const page = stagehand.context.pages()[0];

    // Navigate to starting page
    await page.goto(`${TEST_URL}/your-page`);
    
    // --- YOUR TEST STEPS HERE ---
    
    // Example: Click a button
    await stagehand.act("Click the 'Get Started' button");
    
    // Example: Fill a form
    await stagehand.act("Type 'My Project' into the project name field");
    
    // Example: Extract data
    const result = await stagehand.extract(
      "What is the current credit balance?",
      z.object({ credits: z.string() })
    );
    console.log("Credits:", result.credits);
    
    // Example: Take screenshot
    await page.screenshot({ path: "tests/e2e/screenshots/result.png" });

    console.log("🎉 Test completed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    await stagehand.close();
    console.log("\n👋 Browser session closed");
  }
}

runTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
```

---

## 🧪 Test Ideas

### Guided Flow Test (`guided-flow.ts`)

```typescript
// Step 1: Choose occasion and emotion
await page.goto(`${TEST_URL}`);
await stagehand.act("Click the 'Begin Your Film' button");
// (Login will be required - handle auth first)

// Select occasion - card with "Birthday" label
await stagehand.act("Click on the card labeled 'Birthday' that shows 'Joyful & Fun'");

// Select emotion - appears after occasion selected
await stagehand.act("Click the card labeled 'Joyful Celebration' under 'Shape the Emotion' heading");

// Fill project details
await stagehand.act("Type 'E2E Test Project' into the input field labeled 'Project name'");
await stagehand.act("Type 'A joyful birthday celebration!' into the textarea labeled 'Your Personal Story'");

// Continue to Step 2 (costs 5 credits)
await stagehand.act("Click the button that says 'Continue to The Story'");

// Step 2: Refine story with chat
await sleep(8000); // Wait for AI story generation
await stagehand.act("Type 'Make it more exciting!' into the feedback textarea");
await stagehand.act("Click the blue Send button with the arrow icon"); // 1 credit
await sleep(5000); // Wait for AI response

// Approve and continue
await stagehand.act("Click the button that says 'Approve this Direction'");
await stagehand.act("Click the button that says 'Continue to Visual Style'");
```

### Dashboard Navigation Test (`dashboard.ts`)

```typescript
// IMPORTANT: Must sign in first!
await page.goto(`${TEST_URL}/sign-in`);
await stagehand.act(`Type '${TEST_EMAIL}' into the email address field`);
await stagehand.act("Click the Continue button");
await stagehand.act(`Type '${TEST_PASSWORD}' into the password field`);
await stagehand.act("Click the Continue button");
// Handle 2FA if needed...

// Now navigate to dashboard
await page.goto(`${TEST_URL}/dashboard`);

// Extract Quick Stats
const stats = await stagehand.extract(
  "What stats are shown in the cards? Look for numbers next to Total Projects, Credits Remaining, Videos Generated, Storage Used.",
  z.object({ 
    totalProjects: z.string(),
    creditsRemaining: z.string(),
    videosGenerated: z.string(),
    storageUsed: z.string()
  })
);
console.log("Credits:", stats.creditsRemaining);

// Test Quick Actions - buttons are color-coded:
// - Blue: "Create New Project"
// - Green: "Browse Templates"
// - Purple: "View All Projects"
// - Orange: "Manage Account"
await stagehand.act("Click the purple 'View All Projects' button");
// Now on /dashboard/projects

await page.goto(`${TEST_URL}/dashboard`);
await stagehand.act("Click the green 'Browse Templates' button");
// Now on /dashboard/templates
```

### Mobile Responsive Test

```typescript
// Set viewport to mobile
await page.setViewportSize({ width: 375, height: 812 });
await page.goto(`${TEST_URL}`);

// Verify mobile menu
await stagehand.act("Click the hamburger menu icon");
const menuVisible = await stagehand.extract("Is the mobile menu open?", z.object({
  isOpen: z.boolean()
}));
```

---

## 🔧 Stagehand API Reference

### Core Methods

| Method | Description | Example |
|--------|-------------|---------|
| `stagehand.act(instruction)` | Perform an action | `await stagehand.act("Click the submit button")` |
| `stagehand.extract(instruction, schema)` | Extract data | `await stagehand.extract("Get the price", z.object({ price: z.string() }))` |
| `stagehand.observe(instruction)` | Find elements | `await stagehand.observe("Find all product cards")` |
| `page.goto(url)` | Navigate to URL | `await page.goto("https://example.com")` |
| `page.screenshot({ path })` | Take screenshot | `await page.screenshot({ path: "test.png" })` |
| `page.url()` | Get current URL | `const url = page.url()` |

### Tips for Writing Actions

**Be Specific:**
```typescript
// ❌ Too vague
await stagehand.act("Click button");

// ✅ Clear and specific
await stagehand.act("Click the blue 'Continue' button at the bottom of the form");
```

**Handle Dynamic Content:**
```typescript
// Wait for content to load
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
await sleep(3000);

// Or check for expected elements
const hasLoaded = await stagehand.extract("Is there a loading spinner visible?", z.object({
  isLoading: z.boolean()
}));
```

**Handle Verification Codes:**
```typescript
import * as readline from "readline";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Use in test
const code = await prompt("Enter verification code: ");
await stagehand.act(`Type '${code}' into the verification code field`);
```

---

## 📊 Cost Estimation

| Resource | Cost |
|----------|------|
| Browserbase (Free tier) | 1 hour/month |
| Browserbase (Developer) | $20/month for 100 hours |
| OpenAI API | ~$0.02-0.05 per test |

A typical test run uses:
- ~30-60 seconds of browser time
- ~5-10 LLM calls (~$0.02-0.05)

---

## 🐛 Troubleshooting

### "Unknown file extension .ts"
Use `tsx` instead of `ts-node`:
```bash
npx tsx tests/e2e/login-flow.ts
```

### "Session timeout"
Browserbase free tier has a 15-minute session limit. For longer tests, upgrade to Developer plan.

### "Element not found"
The AI couldn't find the element. Try:
1. Be more specific in your instruction
2. Add a delay before the action (`await sleep(2000)`)
3. Check the live view URL to see what's on screen

### "Verification code required"
The script will prompt you to enter the code. Check your email and enter it in the terminal.

---

## 📚 Resources

- [Stagehand Docs](https://docs.stagehand.dev/)
- [Browserbase Docs](https://docs.browserbase.com/)
- [Zod Schema Validation](https://zod.dev/)

---

## Playwright + Clerk Testing (`auth.spec.ts`, `dashboard.spec.ts`)

These two spec files use `@playwright/test` with `@clerk/testing/playwright` for
structured, assertion-based e2e tests. They complement the Stagehand AI-driven
tests above.

### Setup

1. Install Playwright browsers (skip if using Browserbase):
   ```bash
   pnpm exec playwright install chromium
   ```
2. Start the dev server:
   ```bash
   pnpm dev
   ```
3. Run tests:
   ```bash
   pnpm test:e2e
   ```

### Clerk Testing Mode

Authenticated tests require `CLERK_TESTING_TOKEN` in your environment.
They are skipped automatically when the token is absent.

| Setting | Value |
|---------|-------|
| Test phone | `+15555550100` |
| OTP bypass code | `424242` |
| Token env var | `CLERK_TESTING_TOKEN` |

Generate a token from Clerk Dashboard → Testing → Testing tokens.

### Browserbase cloud browsers

Set `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` to run Playwright tests
on Browserbase's remote browsers instead of a local Chromium install. The
`playwright.config.ts` `connectOptions.wsEndpoint` handles the switch
automatically — no code changes needed.

### CI

See `.github/workflows/e2e.yml`. Required secrets: `CLERK_PUBLISHABLE_KEY`,
`CLERK_SECRET_KEY`, `CLERK_TESTING_TOKEN`, `NEXT_PUBLIC_CONVEX_URL`.
Optional: `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`.

