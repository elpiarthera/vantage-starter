# i18n Implementation Strategy

The implementation plan for internationalizing an app built on this template.

It uses **next-intl** for the App Router, composes it with **Clerk middleware**, and handles a
largely **Client Component** architecture.

**Outcome:** production-ready i18n for as many locales as you configure.
**Stack:** Next.js App Router + React + Clerk Auth + Convex

Work through the phases in order. Each phase is independently verifiable; do not start the next
one until `pnpm exec tsc --noEmit` is clean.

---

## Project Architecture Overview

Before implementation, take inventory of your own codebase. Each row below is something you must
measure — do not assume the numbers, derive them.

| Aspect | How to measure it |
|--------|-------------------|
| **Directory Structure** | Root-level or `src/`? Determines where `app/[locale]/` goes |
| **Path Alias** | Read `tsconfig.json` `paths` |
| **Client Components** | `grep -rl '"use client"' app components \| wc -l` |
| **Server Components** | The remainder — these use `getTranslations`, not `useTranslations` |
| **Middleware** | Clerk authentication (`middleware.ts`) — must be composed, not replaced |
| **Date Formatting** | `grep -rn 'toLocaleDateString\|toLocaleTimeString' app components lib` |
| **AI Prompts** | Any prompt files you ship (**DO NOT TRANSLATE** — see below) |
| **Hidden Strings** | Constants files with user-facing text (`lib/constants/`, `config/`) |

---

## ⚠️ CRITICAL: Protected Files (DO NOT TRANSLATE)

### AI Prompts & API Routes

**Any file holding AI instruction prompts MUST remain in English.** In this template that means
everything under your prompt directory (e.g. `lib/ai/prompts/`) and any API route that embeds a
system prompt inline.

**Why?** Translating a system prompt like "You are a helpful assistant..." into German will **break the AI's persona and instruction adherence**. The AI models are trained primarily on English instructions.

The same protection applies to any string the machine reads rather than the user: enum values
persisted to Convex, model identifiers, API parameter names, `console.log` output, and Tailwind
class names.

### Hidden Strings in Constants

**Constants files are where automated extraction misses things.** A constants file often mixes two
different kinds of string: an **ID** the database and the API depend on, and a **label** the user
reads. Only the label is translatable, and splitting them is the whole job.

Find them with:

```bash
grep -rn '"[A-Z][a-z].* [a-z]' lib/constants/ config/
```

**Pattern for constants with translatable labels — keep the ID, translate the label:**

```typescript
// BEFORE — the label IS the key, so it cannot be translated without breaking the mapping
export const PRIORITY_LEVELS = {
  "Urgent - needs attention today": "urgent",
  "Normal - handle this week": "normal",
};

// AFTER — stable IDs in the constant, labels move to messages/en.json
export const PRIORITY_LEVELS = [
  { id: "urgent", apiValue: "urgent" },
  { id: "normal", apiValue: "normal" },
] as const;

// In the component, resolve the label through next-intl:
const label = t(`priority.${level.id}`); // "Urgent - needs attention today"
```

```json
{
  "priority": {
    "urgent": "Urgent - needs attention today",
    "normal": "Normal - handle this week"
  }
}
```

---

## Phase 1: Safety & Foundation (Hour 1)

### 1.1 Create a Safety Branch

    ```bash
    git checkout -b feature/i18n-implementation
    ```

### 1.2 Install Runtime Dependencies

    ```bash
pnpm add next-intl lodash.merge
    ```

### 1.3 Install Dev/Tooling Dependencies

    ```bash
pnpm add -D openai glob eslint-plugin-i18n-json
    ```

> Note: `dotenv` is already installed in devDependencies.

### 1.4 Initialize Message Structure

    ```bash
    mkdir -p messages
echo '{}' > messages/en.json
echo '{}' > messages/fr.json
echo '{}' > messages/de.json
echo '{}' > messages/it.json
echo '{}' > messages/es.json
    ```

---

## Phase 2: Next.js 14 Configuration (Hours 2-3)

### 2.1 Create `i18n/request.ts`

> ⚠️ This project uses **root-level structure** (no `src/` folder).

```typescript
// i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
 
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
 
  // Validate incoming locale
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
 
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
```

### 2.2 Create `i18n/routing.ts`

```typescript
// i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
 
export const routing = defineRouting({
  locales: ['en', 'fr', 'de', 'it', 'es', 'pt', 'ru'],
  defaultLocale: 'en',
  localePrefix: 'as-needed' // Only show prefix for non-default locales
});
 
// Export navigation utilities for use in Client Components
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

### 2.3 Update `middleware.ts` (Compose Clerk + next-intl)

This is **critical** — the existing Clerk middleware must be composed with next-intl:

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

// Create the intl middleware
const intlMiddleware = createIntlMiddleware(routing);

// Define public routes (include locale prefixes)
const isPublicRoute = createRouteMatcher([
  "/",
  "/:locale",
  "/sign-in(.*)",
  "/:locale/sign-in(.*)",
  "/sign-up(.*)",
  "/:locale/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(
  async (auth, request) => {
    // Run i18n middleware for locale detection and routing
    const response = intlMiddleware(request);

    // Protect non-public routes
    if (!isPublicRoute(request)) {
      await auth.protect();
    }

    return response;
  },
  {
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
  }
);
 
export const config = {
  matcher: [
    // Skip internal paths and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

### 2.4 Update `next.config.mjs`

```javascript
// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
 
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
        },
      };
    }
    return config;
  },
};

// Bundle analyzer setup
const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? require("@next/bundle-analyzer")({ enabled: true })
    : (config) => config;

export default withBundleAnalyzer(withNextIntl(nextConfig));
```

---

## Phase 3: App Directory Restructuring (Hour 4)

### 3.1 New Directory Structure

The App Router requires a `[locale]` segment for dynamic locale handling:

```
app/
├── [locale]/                    ← NEW: Dynamic locale segment
│   ├── layout.tsx               ← NEW: Locale-aware layout
│   ├── page.tsx                 ← MOVE: Landing page
│   ├── dashboard/               ← MOVE: All dashboard routes
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── account/
│   │   ├── projects/
│   │   └── templates/
│   ├── onboarding/              ← MOVE: Any multi-step flow routes
│   │   ├── layout.tsx
│   │   ├── step-1/
│   │   └── step-2/
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   └── sign-up/
│       └── [[...sign-up]]/
├── layout.tsx                   ← KEEP: Minimal root layout
├── globals.css                  ← KEEP
├── ClientProviders.tsx          ← KEEP
├── api/                         ← KEEP: API routes (no locale)
└── not-found.tsx                ← ADD: 404 page
```

### 3.2 Update Root Layout (`app/layout.tsx`)

The root layout becomes minimal — just fonts and global styles:

```tsx
// app/layout.tsx
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import type React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Your App",
  description: "Your app description",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

// Required for next-intl to work with non-locale routes
export function generateStaticParams() {
  return [];
}
```

### 3.3 Create Locale Layout (`app/[locale]/layout.tsx`)

```tsx
// app/[locale]/layout.tsx
import { Analytics } from "@vercel/analytics/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type React from "react";
import { UserSyncProvider } from "@/components/UserSyncProvider";
import { ClientProviders } from "../ClientProviders";
import { routing } from '@/i18n/routing';

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: Props) {
  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Load messages for the current locale
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <ClientProviders>
            <UserSyncProvider>{children}</UserSyncProvider>
          </ClientProviders>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
```

### 3.4 Create 404 Page (`app/not-found.tsx`)

```tsx
// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#101a23] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">404</h1>
          <p className="text-gray-400 mb-8">Page not found</p>
          <Link
            href="/"
            className="bg-[#0d7ff2] text-white px-6 py-3 rounded-md hover:bg-[#0b6dd1]"
          >
            Go Home
          </Link>
        </div>
      </body>
    </html>
  );
}
```

---

## Phase 4: Cursor Rules Setup (Hour 5)

Cursor's `.cursorrules` file is deprecated. We will now use the recommended `.cursor/rules/*.mdc` structure for defining rules. This ensures Cursor acts as a senior engineer who understands your specific i18n architecture.

### 4.1 Create `.cursor/rules` Directory

```bash
mkdir -p .cursor/rules
```

### 4.2 Create i18n Rule File (`.cursor/rules/i18n-rules.mdc`)

Move the content of the old `.cursorrules` into this new file:

**File: `.cursor/rules/i18n-rules.mdc`**

```markdown
# i18n Refactoring Rules (Next.js 14 + next-intl)

We are refactoring this codebase to use `next-intl`. Follow these strict rules:

## 1. CRITICAL EXCLUSIONS (DO NOT TRANSLATE)

**NEVER modify or translate these directories:**
- `app/api/**/*` - API routes with AI logic
- `lib/ai/**/*` - AI prompts and instructions
- `convex/**/*` - Backend functions

**NEVER translate these patterns:**
- `className="..."` - Tailwind CSS classes
- `console.log(...)` - Debug messages
- Database keys/IDs (e.g., `"billing"`, `"urgent"` in selection logic)
- API endpoints, URLs
- Environment variables
- Import paths

## 2. TARGET DIRECTORIES

**Translate ONLY these directories:**
- `app/[locale]/**/*.tsx` - Page components
- `components/**/*.tsx` - UI components
- `lib/constants/*` - Display labels only (keep IDs)
- `config/constants.ts` - Display labels only (keep IDs)

## 3. Project Structure
- This project uses **root-level structure** (NO `src/` folder)
- Path alias: `@/*` maps to `./*`
- i18n files are in `i18n/` folder (not `src/i18n/`)

## 4. Imports & Component Types
- **Check Directive:** Look for `"use client"` at the top of the file.
- **Client Components:**
  - Import: `import { useTranslations } from 'next-intl';`
  - Usage: `const t = useTranslations('namespace');` inside the component.
- **Server Components (rare - only layout.tsx files):**
  - Import: `import { getTranslations } from 'next-intl/server';`
  - Usage: `const t = await getTranslations('namespace');` inside the async component.

## 5. Navigation Links
- Replace `import Link from 'next/link'` with `import { Link } from '@/i18n/routing';`
- Replace `import { useRouter } from 'next/navigation'` with `import { useRouter } from '@/i18n/routing';`
- Replace `import { usePathname } from 'next/navigation'` with `import { usePathname } from '@/i18n/routing';`

## 6. String Extraction Rules
- **Target:** Extract ONLY visible UI text (headers, labels, buttons, placeholders, toasts, error messages).
- **Ignore:** 
  - CSS class names (Tailwind strings)
  - URLs, API endpoints, console.log messages
  - IDs, data-attributes, aria-labels (unless user-visible)
  - Icon names, component names
- **Dynamic Values:**
  - If text is "Welcome {user}", use: `t('welcome', { user: userName })`
- **Plurals (ICU Format):**
  - For counts, use ICU: `"{count, plural, =0 {No credits} one {1 credit} other {# credits}}"`
  - Example usage: `t('credits_remaining', { count: balance })`

## 7. Date & Number Formatting
- Replace `date.toLocaleDateString("en-US", ...)` with next-intl's formatter:
  ```tsx
  import { useFormatter } from 'next-intl';
  const format = useFormatter();
  format.dateTime(date, { dateStyle: 'medium' });
  ```
- For relative time: `format.relativeTime(date)`
- For numbers: `format.number(value, { style: 'currency', currency: 'USD' })`

## 8. JSON Key Management
- **Naming:** Use nested keys mirroring the file structure:
  - File: `components/dashboard/RecordCard.tsx` → Namespace: `dashboard.record_card`
  - File: `app/[locale]/onboarding/step-1/page.tsx` → Namespace: `onboarding.step1`
- **Action:** 
  - Read `messages/en.json` first
  - Append new keys to existing structure
  - **NEVER** delete existing keys from JSON

## 9. Clerk Components
- Do NOT translate Clerk's built-in SignIn/SignUp components
- Clerk has its own localization system (handled separately)
- Only translate wrapper text around Clerk components

## 10. Constants with Labels Pattern

For any array whose items carry a user-visible label:

```tsx
// Keep IDs as strings for database logic
const categories = [
  { id: "billing", icon: CreditCard },  // "billing" stays English (DB key)
  { id: "security", icon: Lock },
  // ...
];

// In JSX, use translations:
<h3>{t(`categories.${category.id}`)}</h3>
<p>{t(`categories.${category.id}_desc`)}</p>
```

## 11. Common Patterns in This Codebase
- Status labels: `statusLabels[record.status]` → `t(\`status.\${record.status}\`)`
- Any option array: `t(\`<namespace>.\${item.id}\`)`
- Counts and quantities: ICU plurals, never string concatenation

## 12. Output Format
- Return the modified TSX code
- Return the specific JSON object additions for `messages/en.json`
- Group related keys under logical namespaces
```

### 4.3 Delete Deprecated `.cursorrules` File

```bash
rm .cursorrules
```

---

## Phase 5: Batch Extraction via Cursor Composer (Hours 6-10)

### 5.1 Extraction Strategy

Work from low risk to high risk, so that the shared vocabulary (`common.*`) is settled before you
reach the screens that consume it. Verify after every batch — never batch two directories at once.

| Order | Files | Risk | Why this rank |
|-------|-------|------|---------------|
| 1 | `components/ui/` | Low | Simple, reusable primitives; few strings |
| 2 | `components/shared/` | Low | EmptyState, headers — establishes `common.*` keys |
| 3 | `components/dashboard/shared/` | Low | EmptyState, ErrorState, TabNavigation |
| 4 | `components/dashboard/*/` | Medium | Feature areas; one directory per batch |
| 5 | `app/[locale]/page.tsx` | Medium | Landing page — also fix `Link` imports here |
| 6 | Your multi-step or wizard routes | High | Deep string density, shared step chrome |
| 7 | Feature component directories | High | Highest string count, most cross-references |
| 8 | `lib/constants/`, `config/` | Medium | Hidden labels — apply the ID/label split above |

**A recurring trap worth its own pass:** every file you touch must import `Link` and the navigation
helpers from `@/i18n/routing`, not from `next/link`. A `next/link` import silently drops the locale
prefix and the user falls back to the default language mid-navigation. Sweep for it:

```bash
grep -rn "from ['\"]next/link['\"]" app components
# expected: 0 results after extraction
```

### ⚠️ SKIP THESE DIRECTORIES (DO NOT PROCESS)

```
❌ app/api/           - API routes with AI logic
❌ lib/ai/            - AI prompts (MUST stay English)
❌ convex/            - Backend Convex functions
❌ services/          - Service layer (no UI)
❌ stores/            - Zustand stores (no UI)
```

### 5.2 The Workflow

1. Open **Cursor Composer** (`Cmd+I` / `Ctrl+I`)
2. Drag in the target folder
3. **Prompt:**
   ```
   Refactor these files for i18n following .cursorrules. 
   Update messages/en.json with the extracted strings.
   Be careful not to translate Tailwind classes or console.log messages.
   ```
4. **Review:** Scan the diffs carefully
5. **Verify:** Run `npx tsc --noEmit` after every batch

### 5.3 High-Risk Areas Checklist

These are the categories automated extraction gets wrong. Check each one by hand:

- [ ] **Option arrays rendered as cards or dropdowns** — apply the ID/label split; the `id` stays
      English because it is persisted, only the label is translated
- [ ] **Values sent to an API** — locale lists, model names, enum values. Keep as data, NEVER translate
- [ ] **Status labels** (`draft`, `in_progress`, `completed`) — translated for display, unchanged in Convex
- [ ] **Counts and quantities** — must use ICU plurals, not string concatenation
- [ ] **Form validation messages** — including the ones thrown from Zod schemas
- [ ] **Toast messages** — success and error notifications are user-facing text
- [ ] **`aria-label` and `alt` attributes** — invisible on screen, read aloud by screen readers
- [ ] **Text inside `title`/`placeholder`** — routinely missed because it is an attribute, not a child

### 5.4 The ID/label split, applied

Every item in the first checklist row reduces to one pattern, already given in *Hidden Strings in
Constants* above: the identifier is data and stays put; the label is content and moves to
`messages/en.json`, keyed by that identifier.

```tsx
// BEFORE — label is hardcoded next to the data
const categories = [
  { id: "billing", label: "Billing", description: "Invoices and payment methods", icon: CreditCard },
  { id: "security", label: "Security", description: "Passwords and sessions", icon: Lock },
];

// AFTER — the array carries only what the machine needs
const categories = [
  { id: "billing", icon: CreditCard },
  { id: "security", icon: Lock },
];

// The label is resolved at render time
<h3>{t(`categories.${category.id}`)}</h3>
<p>{t(`categories.${category.id}_desc`)}</p>
```

```json
{
  "categories": {
    "billing": "Billing",
    "billing_desc": "Invoices and payment methods",
    "security": "Security",
    "security_desc": "Passwords and sessions"
  }
}
```

Note what did **not** change: `category.id` is still `"billing"`, so every row already written to
Convex keeps resolving. Translating an ID is a data migration disguised as a copy change.

---

## Phase 6: Safe Translation Script (Hour 11)

| Task | Description |
|------|-------------|
| 6.1 | Create `scripts/translate.js` with obsolete key removal |
| 6.2 | Add the `translate` script to `package.json` |
| 6.3 | Run it for every locale you configured in `i18n/routing.ts` |

### 6.1 Create Translation Script

**File: `scripts/translate.js`**

```javascript
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const merge = require('lodash.merge');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TARGET_LANGS = ['fr', 'de', 'it', 'es', 'pt', 'ru'];
const MESSAGES_DIR = path.join(__dirname, '../messages');

// Find keys in base that are missing in target
function getMissingKeys(base, target, prefix = '') {
  const missing = {};
  let hasMissing = false;

  for (const key in base) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof base[key] === 'object' && base[key] !== null && !Array.isArray(base[key])) {
      const nestedMissing = getMissingKeys(base[key], target?.[key] || {}, fullKey);
      if (Object.keys(nestedMissing).length > 0) {
        missing[key] = nestedMissing;
        hasMissing = true;
      }
    } else if (target?.[key] === undefined) {
      missing[key] = base[key];
      hasMissing = true;
      console.log(`  Missing: ${fullKey}`);
    }
  }
  
  return hasMissing ? missing : {};
}

// Flatten nested object for counting
function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

async function translate() {
  const enPath = path.join(MESSAGES_DIR, 'en.json');
  
  if (!fs.existsSync(enPath)) {
    console.error('❌ messages/en.json not found!');
    process.exit(1);
  }
  
  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const totalKeys = countKeys(enData);
  console.log(`📊 Total keys in en.json: ${totalKeys}\n`);

  for (const lang of TARGET_LANGS) {
    const targetPath = path.join(MESSAGES_DIR, `${lang}.json`);
    let existingData = {};
    
    if (fs.existsSync(targetPath)) {
      existingData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    }

    console.log(`\n🔍 Checking ${lang}...`);
    const missingKeys = getMissingKeys(enData, existingData);
    const missingCount = countKeys(missingKeys);

    if (missingCount === 0) {
      console.log(`✅ ${lang}.json is up to date.`);
      continue;
    }

    console.log(`🌍 Translating ${missingCount} keys for ${lang}...`);

    try {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Use GPT-4o for accurate ICU format handling
      messages: [
        {
          role: "system",
            content: `You are a professional translator. Translate the following JSON to ${lang}.

RULES:
1. Keep all JSON keys EXACTLY as they are (do not translate keys)
2. Preserve ICU message format variables like {name}, {count, plural, ...}
3. Preserve HTML tags if any (<strong>, <br/>, etc.)
4. Maintain a friendly, professional UI tone
5. Output ONLY valid JSON, no explanations

Language codes:
- fr = French (France)
- de = German (Germany)
- it = Italian (Italy)
- es = Spanish (Spain)`
          },
          { role: "user", content: JSON.stringify(missingKeys, null, 2) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3 // Lower temperature for consistency
    });

    const translatedData = JSON.parse(completion.choices[0].message.content);
    
      // Deep merge to preserve existing translations
    const finalData = merge({}, existingData, translatedData);
    
    fs.writeFileSync(targetPath, JSON.stringify(finalData, null, 2));
      console.log(`💾 Saved ${lang}.json (${countKeys(finalData)} total keys)`);
      
    } catch (error) {
      console.error(`❌ Failed to translate ${lang}:`, error.message);
  }
  }
  
  console.log('\n✅ Translation complete!');
}

translate();
```

### 6.2 Add Script to package.json

```json
{
  "scripts": {
    "translate": "node scripts/translate.js",
    "lint:i18n": "eslint --plugin i18n-json messages/*.json"
  }
}
```

---

## Phase 7: Language Switcher Component (Hour 12)

| Task | Description |
|------|-------------|
| 7.1 | Create `components/shared/LanguageSwitcher.tsx` |
| 7.2 | Add it to `DashboardHeader.tsx` |
| 7.3 | Add it to the landing page header |
| 7.4 | Add it to any standalone flow that renders its own header |

### 7.1 Create Shared Language Switcher

**File: `components/shared/LanguageSwitcher.tsx`**

```tsx
'use client';

import { Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const locales = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('common');

  const currentLocale = locales.find((l) => l.code === locale) || locales[0];

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 min-h-[44px] text-sm"
          aria-label={t('change_language')}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLocale.flag} {currentLocale.code.toUpperCase()}</span>
          <span className="sm:hidden">{currentLocale.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#182634] border-[#223649]">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc.code}
            onClick={() => handleChange(loc.code)}
            className={`cursor-pointer ${
              loc.code === locale 
                ? 'bg-[#223649] text-white' 
                : 'text-gray-300 hover:bg-[#223649] hover:text-white'
            }`}
          >
            <span className="mr-2">{loc.flag}</span>
            {loc.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 7.2 Add to Dashboard Header

Update `components/dashboard/DashboardHeader.tsx`:

```tsx
// Add import
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';

// Add in the header, before notifications:
<div className="flex items-center gap-2 md:gap-4">
  <LanguageSwitcher />
  {/* Notifications button */}
  {/* User Menu */}
</div>
```

### 7.3 Add to Landing Page Header

Place the LanguageSwitcher in the landing page header (`app/[locale]/page.tsx`), alongside the
sign-in button. A visitor who cannot read the page must still be able to find the switcher, so keep
it above the fold and label it with an icon plus the current locale code.

### 7.4 Add to Standalone Flow Headers

Any route group that renders its own header instead of the dashboard shell (onboarding, checkout,
public share pages) needs the switcher added separately. Sweep for layouts that render a header but
never import it:

```bash
grep -rL 'LanguageSwitcher' $(grep -rl '<header' app --include='layout.tsx')
```


---

## Phase 8: Clerk Localization (Hour 13)

| Task | Description |
|------|-------------|
| 8.1 | Create `i18n/clerk-localization.ts` |
| 8.2 | Update `ClientProviders.tsx` with `useLocale` and the `localization` prop |

### 8.1 Create Clerk Localization Files

**File: `i18n/clerk-localization.ts`**

```typescript
// i18n/clerk-localization.ts
import type { LocalizationResource } from '@clerk/types';

export const clerkLocalizations: Record<string, Partial<LocalizationResource>> = {
  en: {}, // Use Clerk's default English
  fr: {
    signIn: {
      start: {
        title: 'Connexion',
        subtitle: 'Connectez-vous pour continuer',
        actionText: 'Pas encore de compte ?',
        actionLink: "S'inscrire",
      },
    },
    signUp: {
      start: {
        title: 'Créer un compte',
        subtitle: 'Inscrivez-vous pour commencer',
        actionText: 'Déjà un compte ?',
        actionLink: 'Se connecter',
      },
    },
    userButton: {
      action__signOut: 'Déconnexion',
      action__manageAccount: 'Gérer le compte',
    },
  },
  de: {
    signIn: {
      start: {
        title: 'Anmelden',
        subtitle: 'Melden Sie sich an, um fortzufahren',
        actionText: 'Noch kein Konto?',
        actionLink: 'Registrieren',
      },
    },
    // ... add more German translations
  },
  it: {
    signIn: {
      start: {
        title: 'Accedi',
        subtitle: 'Accedi per continuare',
        actionText: 'Non hai un account?',
        actionLink: 'Registrati',
      },
    },
    // ... add more Italian translations
  },
  es: {
    signIn: {
      start: {
        title: 'Iniciar sesión',
        subtitle: 'Inicia sesión para continuar',
        actionText: '¿No tienes cuenta?',
        actionLink: 'Regístrate',
      },
    },
    // ... add more Spanish translations
  },
};
```

### 8.2 Update ClientProviders

**File: `app/ClientProviders.tsx`**

```tsx
"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useLocale } from 'next-intl';
import type { ReactNode } from "react";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";
import { clerkLocalizations } from '@/i18n/clerk-localization';

export function ClientProviders({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const localization = clerkLocalizations[locale] || {};

  return (
    <ClerkProvider
      afterSignOutUrl="/sign-in"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      localization={localization}
      appearance={{
        baseTheme: dark,
        variables: {
          // ... existing variables
        },
        elements: {
          // ... existing elements
        },
      }}
    >
      <ConvexClientProvider>{children}</ConvexClientProvider>
    </ClerkProvider>
  );
}
```

---

## Phase 9: Date Formatting Migration (Hour 14)

| Task | Description |
|------|-------------|
| 9.1 | Create `hooks/useDateFormatter.ts` |
| 9.2 | Migrate every hardcoded `toLocaleDateString` call site (see 9.3) |

### 9.1 Create Date Formatting Hook

**File: `hooks/useDateFormatter.ts`** ✅ CREATED

```typescript
// hooks/useDateFormatter.ts
import { useFormatter, useLocale } from 'next-intl';

export function useDateFormatter() {
  const format = useFormatter();
  const locale = useLocale();

  return {
    // Short date: "Dec 16, 2025"
    formatShort: (date: Date | number) => {
      const d = typeof date === 'number' ? new Date(date) : date;
      return format.dateTime(d, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    },

    // Long date: "December 16, 2025"
    formatLong: (date: Date | number) => {
      const d = typeof date === 'number' ? new Date(date) : date;
      return format.dateTime(d, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    },

    // Relative: "2 days ago", "in 3 hours"
    formatRelative: (date: Date | number) => {
      const d = typeof date === 'number' ? new Date(date) : date;
      return format.relativeTime(d);
    },

    // Time: "3:45 PM"
    formatTime: (date: Date | number) => {
      const d = typeof date === 'number' ? new Date(date) : date;
      return format.dateTime(d, {
        hour: 'numeric',
        minute: '2-digit',
      });
    },

    locale,
  };
}
```

### 9.2 Migration Pattern

Replace all instances of:

```tsx
// BEFORE
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
```

With:

```tsx
// AFTER
import { useDateFormatter } from '@/hooks/useDateFormatter';

function MyComponent() {
  const { formatShort } = useDateFormatter();
  
  return <span>{formatShort(project.updatedAt)}</span>;
}
```

### 9.3 Files to Update

Do not work from a list written by hand — derive it, then work the list to zero:

```bash
grep -rn 'toLocaleDateString\|toLocaleTimeString\|toLocaleString' app components lib
# every hit is a call site to migrate; re-run until it returns nothing
```

Card components, list rows, detail headers and any tab showing a billing period are the usual
offenders, because a date rendered there is the one users notice is in the wrong format.

---

## Phase 10: Verification & QA (Final Hours)

| Task | Description |
|------|-------------|
| 10.1 | TypeScript check (`pnpm exec tsc --noEmit`) |
| 10.2 | Build test (`pnpm build`) |
| 10.3 | i18n lint check |
| 10.4 | Manual testing checklist |
| 10.5 | AI prompts verification |
| 10.6 | Edge cases testing |

### 10.1 TypeScript Check

```bash
pnpm exec tsc --noEmit
```

### 10.2 Build Test

```bash
pnpm build
```

### 10.3 i18n Lint Check

Add ESLint config for i18n:

**File: `.eslintrc.json` (add)**

```json
{
  "plugins": ["i18n-json"],
  "rules": {
    "i18n-json/valid-json": 2,
    "i18n-json/sorted-keys": 1,
    "i18n-json/identical-keys": [2, {
      "filePath": "./messages/en.json"
    }]
  }
}
```

Run lint:

```bash
pnpm lint:i18n
```

### 10.4 Manual Testing Checklist

- [ ] Visit `/` - Landing page in English
- [ ] Visit `/fr` - Landing page in French
- [ ] Visit a deep route under a non-default locale (`/fr/dashboard/...`)
- [ ] Switch language via dropdown - URL updates correctly and stays on the same page
- [ ] Check date formatting shows locale-appropriate format
- [ ] Sign in page shows localized text (Clerk)
- [ ] Dashboard shows localized content
- [ ] All buttons and labels are translated
- [ ] ICU plurals work (test with 0, 1, 5)
- [ ] Every option array label translates (dropdowns, category cards, filters)
- [ ] Status badges ("Draft", "In Progress") translate

### 10.5 ⚠️ CRITICAL: AI Prompts Verification

**These MUST remain in English after implementation:**

```bash
# Run this grep to verify no translations leaked into AI prompts
grep -r "You are" lib/ai/prompts/
grep -r "Your role" lib/ai/prompts/
grep -r "Your task" lib/ai/prompts/
```

**Manual verification:**
- [ ] Open each file under your prompt directory - every system prompt is still English
- [ ] Exercise each AI-backed route and compare output quality against a pre-migration sample
- [ ] Confirm the assistant's persona and instruction adherence are unchanged

**Why this matters:** If a system prompt gets translated into German instead of staying in English, the AI's instruction adherence will break completely.

### 10.6 Edge Cases to Test

- [ ] Direct URL access with locale (`/de/dashboard`)
- [ ] Browser language detection (clear cookies, check auto-detect)
- [ ] Missing translation fallback (should show English)
- [ ] RTL support readiness (for future Arabic/Hebrew)
- [ ] Mixed-language content (user input in German, UI in French) renders without layout breakage
- [ ] Dynamic routes with IDs (`/en/dashboard/records/123`) load correctly

---

## Sample `messages/en.json` Structure

```json
{
  "common": {
    "change_language": "Change language",
    "loading": "Loading...",
    "error": "An error occurred",
    "retry": "Retry",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "share": "Share",
    "back": "Back",
    "next": "Next",
    "home": "Home",
    "profile": "Profile",
    "settings": "Settings",
    "sign_out": "Sign Out",
    "dashboard": "Dashboard",
    "help": "Help"
  },
  "landing": {
    "hero_title": "Ship your product, not your boilerplate.",
    "hero_subtitle": "Auth, billing, database and AI, wired together on day one.",
    "cta_primary": "Get started",
    "cta_secondary": "Read the docs"
  },
  "onboarding": {
    "step_indicator": "Step {current} of {total}",
    "step1": {
      "header": "Tell us about your workspace",
      "name": "Workspace name",
      "name_placeholder": "e.g. Acme Inc.",
      "continue_button": "Continue",
      "validation": {
        "name_min": "Name must be at least 3 characters"
      }
    }
  },
  "categories": {
    "billing": "Billing",
    "billing_desc": "Invoices and payment methods",
    "security": "Security",
    "security_desc": "Passwords and sessions",
    "team": "Team",
    "team_desc": "Members, roles and invitations"
  },
  "status": {
    "draft": "Draft",
    "in_progress": "In Progress",
    "completed": "Completed"
  },
  "credits": {
    "balance": "{count, plural, =0 {No credits} one {1 credit} other {# credits}}",
    "required": "{count, plural, one {1 credit required} other {# credits required}}",
    "cost_badge": "{count, plural, one {1 credit} other {# credits}}",
    "free": "Free"
  },
  "dashboard": {
    "welcome": "Welcome back, {name}!",
    "subtitle": "Here's what's happening with your workspace",
    "quick_stats": {
      "records": "Total Records",
      "credits": "Credits Remaining",
      "members": "Team Members",
      "storage": "Storage Used"
    },
    "quick_actions": {
      "title": "Quick Actions",
      "create_record": "Create New Record",
      "invite_member": "Invite a Member",
      "view_records": "View All Records",
      "manage_account": "Manage Account"
    },
    "recent_records": {
      "title": "Recent Records",
      "view_all": "View All",
      "empty": "No records yet",
      "empty_description": "Create your first record to get started."
    }
  },
  "record_card": {
    "edit": "Edit Record",
    "share": "Share Record",
    "delete": "Delete Record"
  },
  "empty_states": {
    "no_records": "No records yet",
    "no_records_description": "Create your first record to get started.",
    "no_assets": "No files uploaded",
    "no_assets_description": "Upload a file to attach it to this record.",
    "no_activity": "No recent activity",
    "no_activity_description": "Your activity will appear here once you start working."
  },
  "errors": {
    "load_failed": "Failed to load",
    "try_again": "Please try again",
    "insufficient_credits": "Insufficient Credits",
    "insufficient_credits_description": "You need {required} credits but only have {available} credits available."
  }
}
```

---

## Summary: Architecture-Specific Decisions

| Codebase feature | Solution applied |
|------------------|------------------|
| **Mostly Client Components** | Use the `useTranslations` hook; `getTranslations` in Server Components |
| **Root-level app dir** | Move routes to `app/[locale]/`, no `src/` folder |
| **Clerk Auth + Custom Middleware** | Compose `intlMiddleware` inside `clerkMiddleware` |
| **AI prompts** | Explicit extraction exclusions plus manual QA |
| **Hidden strings in constants** | Pattern: keep IDs, translate labels via `t()` |
| **High string count** | Batch extraction per directory + lodash.merge |
| **Date formatting** | Custom `useDateFormatter` hook with next-intl |
| **Convex + Streaming** | No translation needed (backend logic) |

---

## Post-Implementation Maintenance

### Adding New Strings

1. Add English strings to `messages/en.json`
2. Run `pnpm translate` to generate other languages
3. Review translations for accuracy

### Adding New Languages

1. Add locale code to `i18n/routing.ts`
2. Create empty `messages/XX.json`
3. Run `pnpm translate`
4. Add Clerk localization in `i18n/clerk-localization.ts`
5. Add to language switcher dropdown

### CI/CD Integration

```yaml
# .github/workflows/i18n-check.yml
name: i18n Check
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm lint:i18n
      - run: pnpm build
```
