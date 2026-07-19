# Complete Next.js Internationalization (i18n) Implementation Guide

> **A step-by-step guide for implementing a production-ready translation system in any Next.js application using `next-intl` and AI-powered translations.**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure Overview](#3-project-structure-overview)
4. [Step-by-Step Implementation](#4-step-by-step-implementation)
   - [Phase 1: Installation & Setup](#phase-1-installation--setup)
   - [Phase 2: Configuration Files](#phase-2-configuration-files)
   - [Phase 3: App Directory Restructuring](#phase-3-app-directory-restructuring)
   - [Phase 4: Using Translations in Components](#phase-4-using-translations-in-components)
   - [Phase 5: Language Switcher Component](#phase-5-language-switcher-component)
   - [Phase 6: AI-Powered Translation Script](#phase-6-ai-powered-translation-script)
   - [Phase 7: Verification Script](#phase-7-verification-script)
5. [Translation Keys Best Practices](#5-translation-keys-best-practices)
6. [ICU Message Format](#6-icu-message-format)
7. [Common Patterns & Examples](#7-common-patterns--examples)
8. [Testing & Verification](#8-testing--verification)
9. [Troubleshooting](#9-troubleshooting)
10. [Production Checklist](#10-production-checklist)

---

## 1. Introduction

### What is Internationalization (i18n)?

**Internationalization (i18n)** is the process of designing your application to support multiple languages and regions without requiring engineering changes. The "18" in i18n represents the 18 letters between "i" and "n" in the word "internationalization."

### Why Implement i18n?

- **Global Reach**: Access users worldwide in their native language
- **Better UX**: Users prefer interfaces in their language
- **SEO Benefits**: Localized content ranks better in regional searches
- **Legal Requirements**: Some regions require local language support
- **Competitive Advantage**: Stand out from English-only competitors

### What This Guide Covers

This guide teaches you to implement a complete i18n system with:

1. **Locale-based routing** (`/en/dashboard`, `/fr/dashboard`)
2. **Translation file management** (JSON-based)
3. **Automatic AI translation** (using GPT-4o)
4. **Translation verification** (automated checks)
5. **Language switcher UI** (user preference)

---

## 2. Technology Stack

### Core Library: `next-intl`

We use **[next-intl](https://next-intl-docs.vercel.app/)** for these reasons:

| Feature | next-intl | Alternative (next-i18next) |
|---------|-----------|---------------------------|
| App Router Support | ✅ Full native support | ⚠️ Limited |
| Server Components | ✅ `getTranslations()` | ❌ Client-only |
| Bundle Size | ~15KB | ~25KB |
| ICU Format | ✅ Full support | ✅ Full support |
| Type Safety | ✅ Excellent | ⚠️ Manual |
| Maintenance | ✅ Active | ⚠️ Less active |

### AI Translation: OpenAI GPT-4o

We use **GPT-4o** (not GPT-4o-mini) for translations because:

- **Better ICU handling**: Correctly preserves `{count, plural, ...}` syntax
- **Context awareness**: Maintains UI tone and context
- **Accuracy**: Higher quality translations than mini models
- **JSON reliability**: Consistent valid JSON output

### Supported Languages

Default setup supports 7 languages:

| Code | Language | Flag |
|------|----------|------|
| `en` | English | 🇺🇸 |
| `fr` | French | 🇫🇷 |
| `de` | German | 🇩🇪 |
| `it` | Italian | 🇮🇹 |
| `es` | Spanish | 🇪🇸 |
| `pt` | Portuguese (Brazil) | 🇵🇹🇧🇷 |
| `ru` | Russian | 🇷🇺 |

---

## 3. Project Structure Overview

After implementation, your project will have this structure:

```
your-project/
├── app/
│   └── [locale]/                    # Dynamic locale segment
│       ├── layout.tsx               # Root layout with NextIntlClientProvider
│       ├── page.tsx                 # Home page
│       ├── dashboard/
│       │   └── page.tsx
│       └── ...other-routes/
├── i18n/
│   ├── routing.ts                   # Locale definitions & navigation
│   └── request.ts                   # Server-side locale loading
├── messages/
│   ├── en.json                      # English (source of truth)
│   ├── fr.json                      # French (auto-generated)
│   ├── de.json                      # German (auto-generated)
│   ├── it.json                      # Italian (auto-generated)
│   ├── es.json                      # Spanish (auto-generated)
│   ├── pt.json                      # Portuguese (auto-generated)
│   └── ru.json                      # Russian (auto-generated)
├── scripts/
│   ├── translate.js                 # AI translation script
│   └── verify-translations.js       # Verification script
├── components/
│   └── shared/
│       └── LanguageSwitcher.tsx     # Language selection UI
├── middleware.ts                    # Locale detection & routing
├── next.config.mjs                  # Next.js config with i18n plugin
└── package.json
```

---

## 4. Step-by-Step Implementation

### Phase 1: Installation & Setup

#### 1.1 Install Dependencies

```bash
# Core i18n library
npm install next-intl

# For translation script
npm install -D openai glob dotenv
```

Or with pnpm:

```bash
pnpm add next-intl
pnpm add -D openai glob dotenv
```

#### 1.2 Create Messages Directory

```bash
mkdir -p messages
echo '{}' > messages/en.json
```

#### 1.3 Add Scripts to `package.json`

```json
{
  "scripts": {
    "translate": "node scripts/translate.js",
    "i18n:verify": "node scripts/verify-translations.js"
  }
}
```

---

### Phase 2: Configuration Files

#### 2.1 Create `i18n/routing.ts`

This file defines your supported locales and creates navigation utilities.

```typescript
import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // List all supported locales
  locales: ["en", "fr", "de", "it", "es", "pt", "ru"],
  
  // Default locale (fallback)
  defaultLocale: "en",
  
  // Only show locale prefix for non-default locales
  // "/dashboard" for English, "/fr/dashboard" for French
  localePrefix: "as-needed",
});

// Export navigation utilities for use in Client Components
// These replace next/navigation imports
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

**Key Points:**
- `locales`: Array of all supported language codes
- `defaultLocale`: The primary language (usually English)
- `localePrefix: "as-needed"`: Cleaner URLs for default locale

#### 2.2 Create `i18n/request.ts`

This file handles server-side locale loading.

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the locale from the request
  let locale = await requestLocale;

  // Validate incoming locale, fallback to default if invalid
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // Dynamically import the correct translation file
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

#### 2.3 Update `next.config.mjs`

Wrap your Next.js config with the `next-intl` plugin.

```javascript
import createNextIntlPlugin from 'next-intl/plugin';

// Point to your request config file
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing config options...
};

export default withNextIntl(nextConfig);
```

#### 2.4 Create `middleware.ts`

The middleware handles automatic locale detection and routing.

**Basic Version (without auth):**

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except static files
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
```

**Advanced Version (with Clerk auth):**

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

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

// API routes should NOT go through intl middleware
const isApiRoute = (pathname: string) => pathname.startsWith("/api");

export default clerkMiddleware(
  async (auth, request) => {
    const pathname = request.nextUrl.pathname;

    // Skip intl middleware for API routes
    if (isApiRoute(pathname)) {
      if (!isPublicRoute(request)) {
        await auth.protect();
      }
      return;
    }

    // Run i18n middleware for pages
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
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

---

### Phase 3: App Directory Restructuring

#### 3.1 Create Locale-based Route Structure

Move all your pages under `app/[locale]/`:

**Before:**
```
app/
├── layout.tsx
├── page.tsx
├── dashboard/
│   └── page.tsx
```

**After:**
```
app/
├── [locale]/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
```

#### 3.2 Update Root Layout

The root layout at `app/[locale]/layout.tsx` must wrap children with `NextIntlClientProvider`:

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";

interface RootLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function RootLayout({
  children,
  params: { locale },
}: RootLayoutProps) {
  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

// Generate static params for all locales (optional, for static generation)
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
```

---

### Phase 4: Using Translations in Components

#### 4.1 Client Components (`"use client"`)

Use the `useTranslations` hook:

```tsx
"use client";

import { useTranslations } from "next-intl";

export function MyComponent() {
  // Load translations from a specific namespace
  const t = useTranslations("dashboard");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
      <button>{t("buttons.save")}</button>
    </div>
  );
}
```

#### 4.2 Server Components

Use the `getTranslations` function (async):

```tsx
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  // Load translations (server-side)
  const t = await getTranslations("dashboard");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
    </div>
  );
}
```

#### 4.3 Multiple Namespaces

Load multiple namespaces when needed:

```tsx
"use client";

import { useTranslations } from "next-intl";

export function ProjectCard({ project }) {
  const t = useTranslations("projects");
  const tOccasions = useTranslations("occasions");
  const tThemes = useTranslations("themes");

  return (
    <div>
      <h2>{project.name}</h2>
      <span>{tOccasions(project.occasion)}</span>
      <span>{tThemes(project.theme)}</span>
      <button>{t("actions.edit")}</button>
    </div>
  );
}
```

#### 4.4 Rendering Rich Text (HTML Tags)

If your translation contains HTML tags like `<strong>` or `<br/>`, use `t.rich`:

```tsx
// en.json: "info": "Click <link>here</link> for <strong>more</strong> info"
const t = useTranslations("dashboard");

return (
  <p>
    {t.rich("info", {
      strong: (chunks) => <strong>{chunks}</strong>,
      link: (chunks) => <a href="/more">{chunks}</a>
    })}
  </p>
);
```

#### 4.5 Navigation Links

Use the `Link` component from `@/i18n/routing` instead of `next/link`:

```tsx
"use client";

// ❌ Don't use this
// import Link from "next/link";

// ✅ Use this instead
import { Link } from "@/i18n/routing";

export function Navigation() {
  return (
    <nav>
      {/* Automatically prefixes with current locale */}
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/settings">Settings</Link>
    </nav>
  );
}
```

---

### Phase 5: Language Switcher Component

Create a reusable language switcher:

```tsx
"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/routing";

// Define all supported locales with labels
const locales = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇵🇹🇧🇷" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("common");

  const currentLocale = locales.find((l) => l.code === locale) || locales[0];

  const handleChange = (newLocale: string) => {
    // Replace current path with new locale
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          aria-label={t("change_language")}
        >
          <Globe className="h-4 w-4" />
          <span>{currentLocale.flag} {currentLocale.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc.code}
            onClick={() => handleChange(loc.code)}
            className={loc.code === locale ? "bg-accent" : ""}
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

---

### Phase 6: AI-Powered Translation Script

This is the heart of the automated translation system. Create `scripts/translate.js`:

```javascript
require("dotenv").config({ path: ".env.local" });
const fs = require("node:fs");
const path = require("node:path");
const OpenAI = require("openai");

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Target languages to translate to (English is source)
const TARGET_LANGS = ["fr", "de", "it", "es", "pt", "ru"];

// Human-readable language names for the AI prompt
const LANG_NAMES = {
  fr: "French (France)",
  de: "German (Germany)",
  it: "Italian (Italy)",
  es: "Spanish (Spain)",
  pt: "Portuguese (Brazil)",
  ru: "Russian (Russia)",
};

const MESSAGES_DIR = path.join(__dirname, "../messages");

/**
 * Find keys in base that are missing in target (recursively)
 */
function getMissingKeys(base, target, prefix = "") {
  const missing = {};
  let hasMissing = false;

  for (const key in base) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (
      typeof base[key] === "object" &&
      base[key] !== null &&
      !Array.isArray(base[key])
    ) {
      // Nested object - recurse
      const nestedMissing = getMissingKeys(
        base[key],
        target?.[key] || {},
        fullKey
      );
      if (Object.keys(nestedMissing).length > 0) {
        missing[key] = nestedMissing;
        hasMissing = true;
      }
    } else if (target?.[key] === undefined) {
      // Key is missing in target
      missing[key] = base[key];
      hasMissing = true;
      console.log(`  Missing: ${fullKey}`);
    }
  }

  return hasMissing ? missing : {};
}

/**
 * Remove keys from target that don't exist in base (clean obsolete keys)
 */
function syncStructure(base, target, prefix = "") {
  const synced = {};
  let removedCount = 0;

  for (const key in base) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (
      typeof base[key] === "object" &&
      base[key] !== null &&
      !Array.isArray(base[key])
    ) {
      // Nested object - recurse
      const result = syncStructure(base[key], target?.[key] || {}, fullKey);
      synced[key] = result.synced;
      removedCount += result.removedCount;
    } else if (target?.[key] !== undefined) {
      // Key exists in both - keep target value
      synced[key] = target[key];
    }
    // Keys missing in target will be translated later
  }

  // Count and log removed keys (keys in target but not in base)
  for (const key in target) {
    if (base[key] === undefined) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      console.log(`  Removing obsolete: ${fullKey}`);
      removedCount++;
    }
  }

  return { synced, removedCount };
}

/**
 * Deep merge two objects (for adding new translations)
 */
function deepMerge(base, additions) {
  const result = { ...base };
  for (const key in additions) {
    if (
      typeof additions[key] === "object" &&
      additions[key] !== null &&
      !Array.isArray(additions[key])
    ) {
      result[key] = deepMerge(result[key] || {}, additions[key]);
    } else {
      result[key] = additions[key];
    }
  }
  return result;
}

/**
 * Count total keys in nested object (for statistics)
 */
function countKeys(obj) {
  let count = 0;
  for (const key in obj) {
    if (
      typeof obj[key] === "object" &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      count += countKeys(obj[key]);
    } else {
      count++;
    }
  }
  return count;
}

/**
 * Main translation function
 */
async function translate() {
  const enPath = path.join(MESSAGES_DIR, "en.json");

  // Verify English source file exists
  if (!fs.existsSync(enPath)) {
    console.error("❌ messages/en.json not found!");
    process.exit(1);
  }

  const enData = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const totalKeys = countKeys(enData);
  console.log(`📊 Total keys in en.json: ${totalKeys}\n`);

  // Process each target language
  for (const lang of TARGET_LANGS) {
    const targetPath = path.join(MESSAGES_DIR, `${lang}.json`);
    let existingData = {};

    // Load existing translations if file exists
    if (fs.existsSync(targetPath)) {
      try {
        const content = fs.readFileSync(targetPath, "utf8").trim();
        existingData = content && content !== "{}" ? JSON.parse(content) : {};
      } catch (_e) {
        existingData = {};
      }
    }

    console.log(`\n🔍 Checking ${lang}...`);

    // Step 1: Sync structure - remove obsolete keys
    const { synced: cleanedData, removedCount } = syncStructure(
      enData,
      existingData
    );
    if (removedCount > 0) {
      console.log(`  🧹 Removed ${removedCount} obsolete keys`);
    }

    // Step 2: Find missing keys
    const missingKeys = getMissingKeys(enData, cleanedData);
    const missingCount = countKeys(missingKeys);

    // If nothing to do, skip this language
    if (missingCount === 0 && removedCount === 0) {
      console.log(`✅ ${lang}.json is up to date.`);
      continue;
    }

    // If only removed keys (no translations needed), just save
    if (missingCount === 0) {
      fs.writeFileSync(targetPath, JSON.stringify(cleanedData, null, 2));
      console.log(`💾 Saved ${lang}.json (${countKeys(cleanedData)} total keys)`);
      continue;
    }

    console.log(`🌍 Translating ${missingCount} keys for ${lang}...`);

    try {
      // Call OpenAI API for translation
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Use gpt-4o for best ICU format handling
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the following JSON to ${LANG_NAMES[lang]}.

CRITICAL: You MUST translate to ${LANG_NAMES[lang]} - NOT French, NOT any other language!

RULES:
1. Keep all JSON keys EXACTLY as they are (do not translate keys)
2. Translate all VALUES to ${LANG_NAMES[lang]}
3. Preserve ICU message format variables like {name}, {count, plural, ...}
4. Preserve HTML tags if any (<strong>, <br/>, etc.)
5. Preserve emojis exactly as they are
6. Maintain a friendly, professional UI tone
7. Output ONLY valid JSON, no explanations

Target language: ${LANG_NAMES[lang]} (code: ${lang})`,
          },
          { role: "user", content: JSON.stringify(missingKeys, null, 2) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Low temperature for consistency
      });

      const translatedData = JSON.parse(completion.choices[0].message.content);

      // Deep merge cleaned data with new translations
      const finalData = deepMerge(cleanedData, translatedData);

      fs.writeFileSync(targetPath, JSON.stringify(finalData, null, 2));
      console.log(`💾 Saved ${lang}.json (${countKeys(finalData)} total keys)`);
    } catch (error) {
      console.error(`❌ Failed to translate ${lang}:`, error.message);
    }
  }

  console.log("\n✅ Translation complete!");
}

// Run the script
translate();
```

#### System Prompt Explained

The system prompt is critical for quality translations:

```
You are a professional translator. Translate the following JSON to ${LANG_NAMES[lang]}.

CRITICAL: You MUST translate to ${LANG_NAMES[lang]} - NOT French, NOT any other language!

RULES:
1. Keep all JSON keys EXACTLY as they are (do not translate keys)
2. Translate all VALUES to ${LANG_NAMES[lang]}
3. Preserve ICU message format variables like {name}, {count, plural, ...}
4. Preserve HTML tags if any (<strong>, <br/>, etc.)
5. Preserve emojis exactly as they are
6. Maintain a friendly, professional UI tone
7. Output ONLY valid JSON, no explanations

Target language: ${LANG_NAMES[lang]} (code: ${lang})
```

**Why these rules matter:**

| Rule | Purpose |
|------|---------|
| Rule 1 | Prevents AI from translating JSON keys like "button_save" |
| Rule 2 | Ensures values get translated |
| Rule 3 | ICU variables like `{count, plural, one {...} other {...}}` must stay intact |
| Rule 4 | HTML in translations (e.g., `<strong>`) must be preserved |
| Rule 5 | Emojis are language-neutral |
| Rule 6 | Maintains consistent tone |
| Rule 7 | Prevents explanatory text in output |

#### API Parameters Explained

```javascript
{
  model: "gpt-4o",           // Best model for ICU format handling
  response_format: { type: "json_object" },  // Force valid JSON output
  temperature: 0.3,          // Low = more consistent translations
}
```

---

### Phase 7: Verification Script

Create `scripts/verify-translations.js` to check translation consistency:

```javascript
#!/usr/bin/env node
/**
 * Translation File Verification Script
 * Checks that all translation files have the same keys as the English source.
 *
 * Usage: node scripts/verify-translations.js
 * Or:    pnpm i18n:verify
 */

const fs = require("fs");
const path = require("path");

const MESSAGES_DIR = path.join(__dirname, "../messages");
const LANGUAGES = ["en", "fr", "de", "it", "es", "pt", "ru"];

/**
 * Flatten nested object to get all keys with dot notation
 * { a: { b: "c" } } => ["a.b"]
 */
function flattenKeys(obj, prefix = "") {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (
      typeof obj[key] === "object" &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      keys = keys.concat(flattenKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function verify() {
  console.log("🔍 Translation File Verification\n");
  console.log("=".repeat(50));

  const data = {};
  const allKeys = {};

  // Load all translation files
  for (const lang of LANGUAGES) {
    const filePath = path.join(MESSAGES_DIR, `${lang}.json`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing file: messages/${lang}.json`);
      process.exit(1);
    }

    try {
      data[lang] = JSON.parse(fs.readFileSync(filePath, "utf8"));
      allKeys[lang] = new Set(flattenKeys(data[lang]));
    } catch (error) {
      console.error(`❌ Invalid JSON in messages/${lang}.json:`, error.message);
      process.exit(1);
    }
  }

  // Display key counts
  console.log("\n📊 Key counts per file:\n");
  const flags = {
    en: "🇺🇸", fr: "🇫🇷", de: "🇩🇪", it: "🇮🇹",
    es: "🇪🇸", pt: "🇧🇷", ru: "🇷🇺"
  };
  
  for (const lang of LANGUAGES) {
    console.log(`   ${flags[lang]} ${lang}.json: ${allKeys[lang].size} keys`);
  }

  // Compare all languages against English (source)
  const enKeys = allKeys["en"];
  let hasIssues = false;

  console.log("\n🔍 Checking for discrepancies (compared to en.json):\n");

  for (const lang of LANGUAGES.filter((l) => l !== "en")) {
    const missing = [...enKeys].filter((k) => !allKeys[lang].has(k));
    const extra = [...allKeys[lang]].filter((k) => !enKeys.has(k));

    if (missing.length > 0) {
      hasIssues = true;
      console.log(`❌ ${lang}.json is MISSING ${missing.length} keys:`);
      missing.slice(0, 10).forEach((k) => console.log(`     - ${k}`));
      if (missing.length > 10) {
        console.log(`     ... and ${missing.length - 10} more`);
      }
      console.log("");
    }

    if (extra.length > 0) {
      hasIssues = true;
      console.log(`⚠️  ${lang}.json has ${extra.length} EXTRA keys not in en.json:`);
      extra.slice(0, 5).forEach((k) => console.log(`     + ${k}`));
      if (extra.length > 5) {
        console.log(`     ... and ${extra.length - 5} more`);
      }
      console.log("");
    }

    if (missing.length === 0 && extra.length === 0) {
      console.log(`   ✅ ${lang}.json - Perfect match`);
    }
  }

  console.log("\n" + "=".repeat(50));

  if (hasIssues) {
    console.log("\n❌ Some translation files have discrepancies!");
    console.log('   Run "pnpm translate" to fix missing keys.\n');
    process.exit(1);
  } else {
    console.log("\n✅ All translation files are perfectly synchronized!\n");
    process.exit(0);
  }
}

verify();
```

---

## 5. Translation Keys Best Practices

### Naming Convention

Use **namespace.context.element** pattern:

```json
{
  "dashboard": {
    "header": {
      "title": "Dashboard",
      "subtitle": "Welcome back"
    },
    "sidebar": {
      "projects": "Projects",
      "settings": "Settings"
    }
  }
}
```

### Organizing by Component

Match namespaces to component structure:

| Component Path | Namespace |
|----------------|-----------|
| `components/dashboard/Header.tsx` | `dashboard.header` |
| `components/projects/ProjectCard.tsx` | `projects.card` |
| `app/[locale]/settings/page.tsx` | `settings` |

### Common Namespaces

Standard namespaces every app should have:

```json
{
  "common": {
    "close": "Close",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "loading": "Loading...",
    "error": "Error"
  },
  "errors": {
    "generic": "Something went wrong",
    "not_found": "Page not found",
    "unauthorized": "You are not authorized"
  },
  "status": {
    "pending": "Pending",
    "active": "Active",
    "completed": "Completed"
  }
}
```

### What NOT to Translate

- ❌ CSS class names (Tailwind)
- ❌ Console.log messages
- ❌ API endpoints / URLs
- ❌ Data attributes
- ❌ Internal IDs
- ❌ Technical error codes

---

## 6. ICU Message Format

### Variables

Simple variable interpolation:

```json
{
  "greeting": "Hello, {name}!"
}
```

```tsx
t("greeting", { name: "John" }) // "Hello, John!"
```

### Pluralization

ICU plural format for counts:

```json
{
  "items_count": "{count, plural, =0 {No items} one {1 item} other {# items}}"
}
```

```tsx
t("items_count", { count: 0 })  // "No items"
t("items_count", { count: 1 })  // "1 item"
t("items_count", { count: 5 })  // "5 items"
```

### Select (Gender/Category)

```json
{
  "pronoun": "{gender, select, male {He} female {She} other {They}}"
}
```

### Number Formatting

```json
{
  "price": "Price: {amount, number, ::currency/USD}"
}
```

### Date Formatting

Use `next-intl`'s `useFormatter` hook:

```tsx
import { useFormatter } from "next-intl";

function MyComponent() {
  const format = useFormatter();
  
  return (
    <span>
      {format.dateTime(new Date(), {
        year: "numeric",
        month: "long",
        day: "numeric"
      })}
    </span>
  );
}
```

---

## 7. Common Patterns & Examples

### Pattern 1: Page with Translations

```tsx
// app/[locale]/dashboard/page.tsx
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("welcome_message")}</p>
    </div>
  );
}
```

### Pattern 2: Client Component with User Data

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";

export function WelcomeMessage() {
  const t = useTranslations("dashboard");
  const { user } = useUser();

  return (
    <h1>{t("greeting", { name: user?.firstName || "Guest" })}</h1>
  );
}
```

### Pattern 3: Dynamic Translation Keys

```tsx
"use client";

import { useTranslations } from "next-intl";

type Status = "draft" | "active" | "completed";

export function StatusBadge({ status }: { status: Status }) {
  const t = useTranslations("status");

  // ✅ Dynamic key from data
  return <span>{t(status)}</span>;
}
```

### Pattern 4: Button with Multiple States

```json
{
  "submit_button": {
    "idle": "Submit",
    "loading": "Submitting...",
    "success": "Submitted!",
    "error": "Try Again"
  }
}
```

```tsx
const t = useTranslations("form.submit_button");

<button disabled={isLoading}>
  {isLoading ? t("loading") : t("idle")}
</button>
```

### Pattern 5: Lists and Iteration

```json
{
  "features": {
    "item_1": "Fast performance",
    "item_2": "Easy to use",
    "item_3": "Fully responsive"
  }
}
```

```tsx
const t = useTranslations("features");
const items = ["item_1", "item_2", "item_3"];

return (
  <ul>
    {items.map((key) => (
      <li key={key}>{t(key)}</li>
    ))}
  </ul>
);
```

---

## 8. Testing & Verification

### Manual Testing Checklist

1. **Switch to each language** and verify UI renders correctly
2. **Check pluralization** with counts 0, 1, and 5+
3. **Verify date/number formatting** matches locale expectations
4. **Test URL structure**: `/fr/dashboard` should work
5. **Check fallbacks**: Invalid locales should redirect to default

### Automated Verification

Run before every deployment:

```bash
# Verify all translations are synchronized
pnpm i18n:verify

# Expected output:
# 📊 Key counts per file:
#    🇺🇸 en.json: 987 keys
#    🇫🇷 fr.json: 987 keys
#    ...
# ✅ All translation files are perfectly synchronized!
```

### CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Verify translations
  run: pnpm i18n:verify
```

---

## 9. Troubleshooting

### Problem: "Missing message for key..."

**Cause:** Key exists in English but not in target language.

**Fix:** Run `pnpm translate`

### Problem: Translation returns key instead of value

**Cause:** Namespace mismatch or missing key.

**Check:**
1. Verify namespace in `useTranslations("correct_namespace")`
2. Check key exists in `messages/en.json`
3. Run `pnpm translate` and `pnpm i18n:verify`

### Problem: ICU format not working

**Cause:** Syntax error in ICU message.

**Fix:** Validate with online ICU validator. Common mistakes:
- Missing closing brace `}`
- Using `{count}` instead of `{count, plural, ...}`

### Problem: Locale prefix always showing

**Cause:** `localePrefix` setting.

**Fix:** Set `localePrefix: "as-needed"` in `routing.ts`

### Problem: API routes getting locale prefixed

**Cause:** Middleware not excluding `/api` routes.

**Fix:** Add `isApiRoute` check in middleware (see Phase 2.4)

---

## 10. Production Checklist

### Before Launch

- [ ] All UI strings extracted to `messages/en.json`
- [ ] Run `pnpm translate` for all languages
- [ ] Run `pnpm i18n:verify` - should show "Perfect match"
- [ ] Test each language manually in browser
- [ ] Verify language switcher works
- [ ] Check SEO: `<html lang={locale}>` is set
- [ ] Test with browser language detection

### Environment Variables

Ensure these are set:

```env
# .env.local
OPENAI_API_KEY=sk-...
```

### Recommended Scripts

```json
{
  "scripts": {
    "translate": "node scripts/translate.js",
    "i18n:verify": "node scripts/verify-translations.js",
    "prebuild": "npm run i18n:verify"
  }
}
```

---

## Quick Reference Card

### Imports Cheat Sheet

```tsx
// Client Components
import { useTranslations, useLocale, useFormatter } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/routing";

// Server Components
import { getTranslations, getLocale, getFormatter } from "next-intl/server";
```

### Common Commands

```bash
# Translate missing keys
pnpm translate

# Verify all files match
pnpm i18n:verify

# Run both
pnpm translate && pnpm i18n:verify
```

### Message Format Examples

```json
{
  "simple": "Hello World",
  "with_variable": "Hello, {name}!",
  "with_count": "{count, plural, =0 {None} one {1 item} other {# items}}",
  "with_html": "Click <strong>here</strong> to continue"
}
```

---

## Summary

This guide covered the complete implementation of a production-ready i18n system:

1. **Setup**: Install `next-intl` and create configuration files
2. **Structure**: Use `app/[locale]/` for locale-based routing
3. **Components**: Use `useTranslations()` in client components, `await getTranslations()` in server components
4. **Translation**: Use GPT-4o with the provided system prompt for quality translations
5. **Verification**: Always run verification before deployment

**Total implementation time:** ~4-6 hours for a medium-sized application.

**Result:** A scalable, maintainable i18n system that supports unlimited languages with minimal developer effort.

---

*Document version: 1.0*
*Last updated: December 2024*

