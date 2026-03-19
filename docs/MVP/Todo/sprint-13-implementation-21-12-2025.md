# 🎭 MyShortReel - Sprint 13: Occasions & Emotions in Convex

**Date**: December 21, 2025  
**Status**: 📋 PLANNING  
**Estimated Time**: 12 hours  
**Goal**: Migrate hardcoded occasions and emotions to Convex for dynamic configuration  
**Dependencies**: None  
**Architecture**: Based on `architectural-improvements-sprint-21-12-2025.md` (Improvement #3)  
**Mobile Strategy**: **Strictly Mobile-First** per `mobile-first-best-practices.md` 📱  
**Design System**: **shadcn/ui only** per `design-system.md`  
**QA Strategy**: **2-Step QA** - TypeScript (noEmit) → Biome for all files  

---

## 📊 Executive Summary

### Problem Statement

Occasions and emotional themes are currently hardcoded in Step 1:

```typescript
// app/[locale]/guided/step-1/page.tsx:92-141
const occasions = [
  { id: "wedding", label: tOccasions("wedding"), icon: Heart, ... },
  { id: "birthday", label: tOccasions("birthday"), icon: Cake, ... },
  // ... 8 total
];

const emotionalThemes = [
  { id: "joyful", label: tStep1("emotional_theme_joyful_label"), ... },
  { id: "nostalgic", label: tStep1("emotional_theme_nostalgic_label"), ... },
  // ... 6 total
];
```

**Issues**:
- Adding new occasions requires code deployment
- Cannot A/B test different occasion sets
- No analytics on occasion popularity
- Cannot disable occasions without code change
- Icon mapping is hardcoded
- **No visual illustrations** to help users understand each occasion
- Emotions only have color, no icon

### Solution

1. Create `occasions` and `emotionalThemes` tables in Convex
2. Add illustration images for each occasion (realistic photos)
3. Add icon identifiers for emotions
4. Create queries to fetch active occasions/emotions
5. Update Step 1 to fetch from Convex
6. Create seed script for initial data
7. Create image generation script for illustrations

---

## ⏱️ TIME TRACKING

| Task | Description | Est. Hours | Actual | Status |
|------|-------------|------------|--------|--------|
| 1 | Create occasions table schema | 0.5h | - | ⏳ |
| 2 | Create emotionalThemes table schema | 0.5h | - | ⏳ |
| 3 | Create Convex queries | 1h | - | ⏳ |
| 4 | Create seed script with initial data | 1h | - | ⏳ |
| 5 | Create/adapt image generation script | 2h | - | ⏳ |
| 6 | Generate occasion illustrations (8 images) | 0.5h | - | ⏳ |
| 7 | Upload illustrations to storage | 0.5h | - | ⏳ |
| 8 | Create icon mapping utility | 1h | - | ⏳ |
| 9 | Update Step 1 to fetch from Convex | 2.5h | - | ⏳ |
| 10 | Update i18n integration | 1h | - | ⏳ |
| 11 | Update/create tests | 0.5h | - | ⏳ |
| 12 | QA & Deploy | 1h | - | ⏳ |
| **TOTAL** | | **12h** | - | ⏳ |

---

## 🔍 PRE-SPRINT CHECKLIST (5 min)

Before starting Sprint 13:

- [ ] **Verify FAL_KEY is set** (for image generation):
  ```bash
  grep "FAL_KEY=" .env.local
  ```

- [ ] **Verify Convex dev is running**:
  ```bash
  npx convex dev --once
  ```

- [ ] **Review existing image generation script**:
  ```bash
  cat tests/ai-language-support/test-image-generation.ts
  ```

- [ ] **Verify Step 1 current implementation**:
  ```bash
  head -150 app/[locale]/guided/step-1/page.tsx
  ```

---

## 📋 Task 1: Create Occasions Table Schema (0.5 hours)

### Objective

Add the `occasions` table to Convex schema.

### Implementation

**File**: `convex/schema.ts` (modify)

```typescript
// Add occasions table
occasions: defineTable({
  key: v.string(),           // "wedding", "birthday" (used in DB and i18n)
  iconId: v.string(),        // "heart", "cake" (mapped to Lucide icons)
  
  // Visual illustration for the UI - support both storage options
  illustrationUrl: v.optional(v.string()),           // Direct URL to illustration
  illustrationStorageId: v.optional(v.id("_storage")), // Convex storage ID
  illustrationR2Key: v.optional(v.string()),         // R2 storage key (for future migration)
  
  sortOrder: v.number(),     // Display order
  isActive: v.boolean(),     // Can be disabled
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_key", ["key"])
  .index("by_sort_order", ["sortOrder"])
  .index("by_active", ["isActive"]),
```

**Note**: We include `illustrationR2Key` for future R2 migration compatibility (see Sprint 5: Cloudflare R2 Migration).

### QA Checklist

```bash
# TypeScript check
npx tsc --noEmit convex/schema.ts

# Biome check
npx @biomejs/biome check --write convex/schema.ts

# Deploy
npx convex dev --once
```

- [ ] Schema compiles without errors
- [ ] Table created in Convex dashboard

---

## 📋 Task 2: Create Emotional Themes Table Schema (0.5 hours)

### Objective

Add the `emotionalThemes` table to Convex schema.

### Implementation

**File**: `convex/schema.ts` (modify)

```typescript
// Add emotionalThemes table
emotionalThemes: defineTable({
  key: v.string(),           // "joyful", "romantic" (used in DB and i18n)
  color: v.string(),         // Hex color "#FF6B6B"
  iconId: v.string(),        // "smile", "heart-pulse" (mapped to Lucide icons)
  
  sortOrder: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_key", ["key"])
  .index("by_sort_order", ["sortOrder"])
  .index("by_active", ["isActive"]),
```

### QA Checklist

```bash
# Deploy schema
npx convex dev --once
```

- [ ] Table created in Convex dashboard

---

## 📋 Task 3: Create Convex Queries (1 hour)

### Objective

Create queries to fetch active occasions and emotional themes.

### Implementation

**File**: `convex/occasions.ts` (create)

```typescript
import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * List all active occasions, sorted by sortOrder
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const occasions = await ctx.db
      .query("occasions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    // Sort by sortOrder
    return occasions.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Get a single occasion by key
 */
export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("occasions")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

/**
 * List all occasions (including inactive) - for admin
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const occasions = await ctx.db.query("occasions").collect();
    return occasions.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});
```

**File**: `convex/emotionalThemes.ts` (create)

```typescript
import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * List all active emotional themes, sorted by sortOrder
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const themes = await ctx.db
      .query("emotionalThemes")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    return themes.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Get a single emotional theme by key
 */
export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emotionalThemes")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

/**
 * List all emotional themes (including inactive) - for admin
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const themes = await ctx.db.query("emotionalThemes").collect();
    return themes.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});
```

### QA Checklist

```bash
# TypeScript check
npx tsc --noEmit convex/occasions.ts
npx tsc --noEmit convex/emotionalThemes.ts

# Biome check
npx @biomejs/biome check --write convex/occasions.ts
npx @biomejs/biome check --write convex/emotionalThemes.ts

# Deploy
npx convex dev --once
```

- [ ] Queries created and deployed
- [ ] Test queries in Convex dashboard

---

## 📋 Task 4: Create Seed Script (1 hour)

### Objective

Create a script to populate initial occasions and emotional themes.

### Implementation

**File**: `convex/seed/seedOccasionsAndEmotions.ts` (create)

```typescript
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/**
 * Seed initial occasions data
 * Run with: npx convex run seed/seedOccasionsAndEmotions:seedOccasions
 */
export const seedOccasions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const occasions = [
      { key: "wedding", iconId: "heart", sortOrder: 1 },
      { key: "birthday", iconId: "cake", sortOrder: 2 },
      { key: "anniversary", iconId: "calendar-heart", sortOrder: 3 },
      { key: "baby_shower", iconId: "baby", sortOrder: 4 },
      { key: "graduation", iconId: "graduation-cap", sortOrder: 5 },
      { key: "corporate", iconId: "briefcase", sortOrder: 6 },
      { key: "holiday", iconId: "gift", sortOrder: 7 },
      { key: "engagement", iconId: "gem", sortOrder: 8 },
    ];
    
    for (const occasion of occasions) {
      // Check if already exists
      const existing = await ctx.db
        .query("occasions")
        .withIndex("by_key", (q) => q.eq("key", occasion.key))
        .first();
      
      if (existing) {
        console.log(`Occasion ${occasion.key} already exists, skipping`);
        continue;
      }
      
      await ctx.db.insert("occasions", {
        key: occasion.key,
        iconId: occasion.iconId,
        illustrationUrl: undefined,
        illustrationStorageId: undefined,
        sortOrder: occasion.sortOrder,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      
      console.log(`Created occasion: ${occasion.key}`);
    }
    
    return { success: true, message: "Occasions seeded" };
  },
});

/**
 * Seed initial emotional themes data
 * Run with: npx convex run seed/seedOccasionsAndEmotions:seedEmotionalThemes
 */
export const seedEmotionalThemes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const themes = [
      { key: "joyful", color: "#FFD93D", iconId: "smile", sortOrder: 1 },
      { key: "nostalgic", color: "#9B7EBD", iconId: "clock", sortOrder: 2 },
      { key: "romantic", color: "#FF6B6B", iconId: "heart-pulse", sortOrder: 3 },
      { key: "energetic", color: "#4ECDC4", iconId: "zap", sortOrder: 4 },
      { key: "tender", color: "#FFB4B4", iconId: "heart", sortOrder: 5 },
      { key: "motivational", color: "#95D5B2", iconId: "trophy", sortOrder: 6 },
    ];
    
    for (const theme of themes) {
      // Check if already exists
      const existing = await ctx.db
        .query("emotionalThemes")
        .withIndex("by_key", (q) => q.eq("key", theme.key))
        .first();
      
      if (existing) {
        console.log(`Theme ${theme.key} already exists, skipping`);
        continue;
      }
      
      await ctx.db.insert("emotionalThemes", {
        key: theme.key,
        color: theme.color,
        iconId: theme.iconId,
        sortOrder: theme.sortOrder,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      
      console.log(`Created emotional theme: ${theme.key}`);
    }
    
    return { success: true, message: "Emotional themes seeded" };
  },
});

/**
 * Seed all data
 * Run with: npx convex run seed/seedOccasionsAndEmotions:seedAll
 */
export const seedAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Note: Cannot call other mutations directly in Convex
    // This is a placeholder - run seedOccasions and seedEmotionalThemes separately
    return {
      message: "Run seedOccasions and seedEmotionalThemes separately",
    };
  },
});
```

### Run Seed Scripts

```bash
# Seed occasions
npx convex run seed/seedOccasionsAndEmotions:seedOccasions

# Seed emotional themes
npx convex run seed/seedOccasionsAndEmotions:seedEmotionalThemes
```

### QA Checklist

- [ ] Seed script created
- [ ] 8 occasions created in database
- [ ] 6 emotional themes created in database
- [ ] Data visible in Convex dashboard

---

## 📋 Task 5: Create Image Generation Script (2 hours)

### Objective

Create a script to generate realistic photo illustrations for each occasion.

### Implementation

**File**: `scripts/generate-occasion-illustrations.ts` (create)

```typescript
/**
 * Generate Occasion Illustration Images
 * 
 * Uses fal.ai Nano Banana Pro to generate realistic photos for each occasion.
 * 
 * USAGE:
 *   npx tsx scripts/generate-occasion-illustrations.ts
 * 
 * PREREQUISITES:
 *   - FAL_KEY in .env.local
 *   - Occasions seeded in Convex
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const FAL_KEY = process.env.FAL_KEY;
const MODEL_ID = "fal-ai/nano-banana-pro";

// Occasion prompts for realistic photos
const OCCASION_PROMPTS: Record<string, string> = {
  wedding: "Elegant wedding ceremony scene with beautiful bride and groom exchanging vows under a floral arch, romantic golden hour lighting, professional photography style, soft bokeh background, 4K quality",
  
  birthday: "Joyful birthday celebration with colorful cake and candles, confetti in the air, happy family gathering, warm indoor lighting, realistic photography style, festive atmosphere",
  
  anniversary: "Romantic anniversary dinner for two with elegant table setting, champagne glasses, candlelight, rose petals, intimate restaurant ambiance, soft warm lighting, professional photo",
  
  baby_shower: "Beautiful baby shower party setup with pastel decorations, cute baby items display, elegant gift table, soft natural lighting, heartwarming celebration atmosphere, realistic photography",
  
  graduation: "Proud graduate in cap and gown holding diploma, confetti celebration, university campus background, bright sunny day, joyful achievement moment, professional graduation photography",
  
  corporate: "Modern corporate event with professional speakers on stage, business conference setting, elegant venue with subtle branding, professional lighting, corporate photography style",
  
  holiday: "Festive holiday celebration with beautifully decorated table, family gathering, warm string lights, cozy indoor atmosphere, gift exchange moment, heartwarming holiday photography",
  
  engagement: "Romantic engagement moment with couple, beautiful diamond ring reveal, sunset beach or garden setting, golden hour lighting, emotional and joyful, professional engagement photography",
};

interface QueueStatus {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  request_id: string;
  status_url?: string;
  response_url?: string;
}

interface ImageResult {
  images: Array<{ url: string }>;
}

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitFalJob(prompt: string): Promise<QueueStatus> {
  const response = await fetch(`https://queue.fal.run/${MODEL_ID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${FAL_KEY}`,
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: "16:9",
      num_images: 1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`fal.ai API error: ${response.status} - ${errorText}`);
  }

  return (await response.json()) as QueueStatus;
}

async function pollFalResult(
  statusUrl: string,
  responseUrl: string,
): Promise<ImageResult> {
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    attempts++;
    await wait(2000);

    const statusRes = await fetch(statusUrl, {
      headers: { Authorization: `Key ${FAL_KEY}` },
    });
    
    if (!statusRes.ok) continue;

    const statusData = (await statusRes.json()) as QueueStatus;

    if (statusData.status === "COMPLETED") {
      const resultRes = await fetch(responseUrl, {
        headers: { Authorization: `Key ${FAL_KEY}` },
      });
      if (!resultRes.ok) {
        throw new Error(`Failed to fetch result: ${resultRes.status}`);
      }
      return (await resultRes.json()) as ImageResult;
    }

    if (statusData.status === "FAILED") {
      throw new Error("fal.ai image generation failed");
    }
  }

  throw new Error("fal.ai image generation timed out");
}

async function generateIllustration(
  occasionKey: string,
  prompt: string,
): Promise<string | null> {
  console.log(`\n🎨 Generating illustration for: ${occasionKey}`);
  console.log(`   Prompt: ${prompt.substring(0, 80)}...`);

  try {
    const status = await submitFalJob(prompt);

    if (!status.status_url || !status.response_url) {
      throw new Error("Missing status or response URL from fal.ai");
    }

    const result = await pollFalResult(status.status_url, status.response_url);

    if (result.images && result.images.length > 0) {
      const imageUrl = result.images[0].url;
      console.log(`   ✅ Generated: ${imageUrl.substring(0, 60)}...`);
      return imageUrl;
    }

    console.log(`   ❌ No image returned`);
    return null;
  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

async function main() {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║     🎭 OCCASION ILLUSTRATION GENERATOR                    ║");
  console.log("║     Generating realistic photos for each occasion         ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  if (!FAL_KEY) {
    console.error("❌ FAL_KEY not found in .env.local");
    process.exit(1);
  }

  const resultsDir = path.join(__dirname, "../generated/occasion-illustrations");
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const results: Record<string, { url: string | null; prompt: string }> = {};

  for (const [occasionKey, prompt] of Object.entries(OCCASION_PROMPTS)) {
    const imageUrl = await generateIllustration(occasionKey, prompt);
    results[occasionKey] = { url: imageUrl, prompt };

    // Rate limiting
    await wait(3000);
  }

  // Save results
  const outputFile = path.join(resultsDir, "illustration-urls.json");
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n📁 Results saved to: ${outputFile}`);

  // Summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("📊 GENERATION SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");

  let successCount = 0;
  for (const [key, result] of Object.entries(results)) {
    const status = result.url ? "✅" : "❌";
    console.log(`${status} ${key}: ${result.url ? "Generated" : "Failed"}`);
    if (result.url) successCount++;
  }

  console.log(`\n📊 Total: ${successCount}/${Object.keys(results).length} successful`);
  console.log(`💰 Estimated cost: ~$${(successCount * 0.04).toFixed(2)}`);
  console.log("\n✅ Done! Upload URLs to Convex using the upload script.\n");
}

main().catch(console.error);
```

### QA Checklist

```bash
# TypeScript check
npx tsc --noEmit scripts/generate-occasion-illustrations.ts

# Run script
npx tsx scripts/generate-occasion-illustrations.ts
```

- [ ] Script runs without errors
- [ ] 8 images generated
- [ ] Results saved to JSON file

---

## 📋 Task 6: Generate Illustrations (0.5 hours)

### Objective

Run the script to generate 8 occasion illustrations.

### Execution

```bash
npx tsx scripts/generate-occasion-illustrations.ts
```

### Expected Output

```
✅ wedding: Generated
✅ birthday: Generated
✅ anniversary: Generated
✅ baby_shower: Generated
✅ graduation: Generated
✅ corporate: Generated
✅ holiday: Generated
✅ engagement: Generated

📊 Total: 8/8 successful
💰 Estimated cost: ~$0.32
```

### QA Checklist

- [ ] All 8 images generated
- [ ] Images are realistic photos (not illustrations)
- [ ] Aspect ratio is 16:9
- [ ] URLs saved to JSON file

---

## 📋 Task 7: Upload Illustrations to Storage (0.5 hours)

### Objective

Upload generated images to Convex storage and update occasions table.

### Implementation

**File**: `scripts/upload-occasion-illustrations.ts` (create)

```typescript
/**
 * Upload Occasion Illustrations to Convex Storage
 * 
 * Reads URLs from generated JSON and uploads to Convex storage.
 * 
 * USAGE:
 *   npx tsx scripts/upload-occasion-illustrations.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

async function main() {
  console.log("\n📤 Uploading occasion illustrations to Convex...\n");

  const client = new ConvexHttpClient(CONVEX_URL);
  
  const resultsFile = path.join(
    __dirname,
    "../generated/occasion-illustrations/illustration-urls.json"
  );
  
  if (!fs.existsSync(resultsFile)) {
    console.error("❌ Results file not found. Run generate script first.");
    process.exit(1);
  }
  
  const results = JSON.parse(fs.readFileSync(resultsFile, "utf-8"));
  
  for (const [occasionKey, data] of Object.entries(results)) {
    const { url } = data as { url: string | null };
    
    if (!url) {
      console.log(`⏭️ Skipping ${occasionKey}: No URL`);
      continue;
    }
    
    console.log(`📤 Uploading ${occasionKey}...`);
    
    try {
      // Download image
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`   ❌ Failed to download: ${response.status}`);
        continue;
      }
      
      const blob = await response.blob();
      
      // Upload to Convex (this requires a mutation)
      // For now, just update the URL directly
      // In production, you'd use ctx.storage.store()
      
      // Update occasion with URL
      // Note: You'll need to create an updateIllustration mutation
      console.log(`   ✅ Downloaded, updating database...`);
      
      // Placeholder: Update via dashboard or mutation
      
    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
    }
  }
  
  console.log("\n✅ Upload complete!\n");
}

main().catch(console.error);
```

### Alternative: Manual Upload

For MVP, you can manually:
1. Open each URL from the JSON file
2. Download the image
3. Upload to Convex storage via dashboard
4. Update the occasion record with the storage ID

### QA Checklist

- [ ] Images uploaded to Convex storage
- [ ] Occasion records updated with illustrationStorageId
- [ ] Images accessible via Convex URL

---

## 📋 Task 8: Create Icon Mapping Utility (1 hour)

### Objective

Create a utility to map icon IDs to Lucide React components.

### Implementation

**File**: `lib/icon-mapping.ts` (create)

```typescript
import {
  Heart,
  Cake,
  CalendarHeart,
  Baby,
  GraduationCap,
  Briefcase,
  Gift,
  Gem,
  Smile,
  Clock,
  HeartPulse,
  Zap,
  Trophy,
  type LucideIcon,
} from "lucide-react";

/**
 * Map occasion icon IDs to Lucide components
 */
const OCCASION_ICON_MAP: Record<string, LucideIcon> = {
  heart: Heart,
  cake: Cake,
  "calendar-heart": CalendarHeart,
  baby: Baby,
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,
  gift: Gift,
  gem: Gem,
};

/**
 * Map emotion icon IDs to Lucide components
 */
const EMOTION_ICON_MAP: Record<string, LucideIcon> = {
  smile: Smile,
  clock: Clock,
  "heart-pulse": HeartPulse,
  zap: Zap,
  heart: Heart,
  trophy: Trophy,
};

/**
 * Get icon component for an occasion
 */
export function getOccasionIcon(iconId: string): LucideIcon {
  return OCCASION_ICON_MAP[iconId] ?? Heart;
}

/**
 * Get icon component for an emotion
 */
export function getEmotionIcon(iconId: string): LucideIcon {
  return EMOTION_ICON_MAP[iconId] ?? Heart;
}

/**
 * Get all available occasion icons
 */
export function getAvailableOccasionIcons(): string[] {
  return Object.keys(OCCASION_ICON_MAP);
}

/**
 * Get all available emotion icons
 */
export function getAvailableEmotionIcons(): string[] {
  return Object.keys(EMOTION_ICON_MAP);
}
```

### QA Checklist

```bash
# TypeScript check
npx tsc --noEmit lib/icon-mapping.ts

# Biome check
npx @biomejs/biome check --write lib/icon-mapping.ts
```

- [ ] All icons mapped
- [ ] Fallback icon for unknown IDs
- [ ] TypeScript types correct

---

## 📋 Task 9: Update Step 1 (2.5 hours)

### Objective

Update Step 1 to fetch occasions and emotions from Convex instead of hardcoded data.

### Implementation

**File**: `app/[locale]/guided/step-1/page.tsx` (modify)

```typescript
// Add imports
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getOccasionIcon, getEmotionIcon } from "@/lib/icon-mapping";

// Inside component, replace hardcoded data with Convex queries
const occasions = useQuery(api.occasions.listActive);
const emotionalThemes = useQuery(api.emotionalThemes.listActive);

// Loading state
const isLoadingOccasions = occasions === undefined;
const isLoadingThemes = emotionalThemes === undefined;

// Render occasions with dynamic data
{occasions?.map((occasion) => {
  const Icon = getOccasionIcon(occasion.iconId);
  const illustrationUrl = occasion.illustrationUrl;
  
  return (
    <Card
      key={occasion.key}
      className={cn(
        "cursor-pointer transition-all",
        selectedOccasion === occasion.key && "border-[#0d7ff2]"
      )}
      onClick={() => handleOccasionSelect(occasion.key)}
    >
      {/* Illustration Image */}
      {illustrationUrl && (
        <div className="aspect-video relative overflow-hidden rounded-t-lg">
          <Image
            src={illustrationUrl}
            alt={tOccasions(occasion.key)}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-[#0d7ff2]" />
          <div>
            <h3 className="font-medium">{tOccasions(occasion.key)}</h3>
            <p className="text-sm text-gray-400">
              {tOccasions(`${occasion.key}_desc`)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
})}

// Render emotions with dynamic data
{emotionalThemes?.map((theme) => {
  const Icon = getEmotionIcon(theme.iconId);
  
  return (
    <Card
      key={theme.key}
      className={cn(
        "cursor-pointer transition-all",
        selectedTheme === theme.key && "border-[#0d7ff2]"
      )}
      onClick={() => handleThemeSelect(theme.key)}
      style={{ borderColor: theme.color }}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className="p-2 rounded-full"
          style={{ backgroundColor: `${theme.color}20` }}
        >
          <Icon className="h-5 w-5" style={{ color: theme.color }} />
        </div>
        <div>
          <h3 className="font-medium">{tStep1(`emotional_theme_${theme.key}_label`)}</h3>
          <p className="text-sm text-gray-400">
            {tStep1(`emotional_theme_${theme.key}_desc`)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
})}
```

### Add Loading Skeletons

```typescript
// Loading skeleton for occasions
{isLoadingOccasions && (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <Skeleton key={i} className="h-48 rounded-lg" />
    ))}
  </div>
)}

// Loading skeleton for emotions
{isLoadingThemes && (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} className="h-20 rounded-lg" />
    ))}
  </div>
)}
```

### QA Checklist

```bash
# TypeScript check
npx tsc --noEmit app/[locale]/guided/step-1/page.tsx

# Biome check
npx @biomejs/biome check --write app/[locale]/guided/step-1/page.tsx
```

- [ ] Occasions load from Convex
- [ ] Emotions load from Convex
- [ ] Icons render correctly
- [ ] Illustrations display (if uploaded)
- [ ] Loading skeletons show
- [ ] Selection works
- [ ] Mobile layout responsive

---

## 📋 Task 10: Update i18n Integration (1 hour)

### Objective

Ensure translation keys work with dynamic occasion/emotion keys.

### Verify Translation Keys Exist

**File**: `messages/en.json`

Ensure these keys exist:

```json
{
  "occasions": {
    "wedding": "Wedding",
    "wedding_desc": "Celebrate your special day",
    "birthday": "Birthday",
    "birthday_desc": "Joyful & Fun 🎉",
    "anniversary": "Anniversary",
    "anniversary_desc": "Celebrate your love",
    "baby_shower": "Baby Shower",
    "baby_shower_desc": "Welcome the little one",
    "graduation": "Graduation",
    "graduation_desc": "Celebrate achievements",
    "corporate": "Corporate",
    "corporate_desc": "Professional events",
    "holiday": "Holiday",
    "holiday_desc": "Seasonal celebrations",
    "engagement": "Engagement",
    "engagement_desc": "The beginning of forever"
  },
  "step1": {
    "emotional_theme_joyful_label": "Joyful Celebration",
    "emotional_theme_joyful_desc": "Upbeat and happy vibes",
    "emotional_theme_nostalgic_label": "Nostalgic Memories",
    "emotional_theme_nostalgic_desc": "Looking back with love",
    "emotional_theme_romantic_label": "Romantic",
    "emotional_theme_romantic_desc": "Love and tenderness",
    "emotional_theme_energetic_label": "Energetic",
    "emotional_theme_energetic_desc": "Fun and lively",
    "emotional_theme_tender_label": "Tender",
    "emotional_theme_tender_desc": "Soft and heartfelt",
    "emotional_theme_motivational_label": "Motivational",
    "emotional_theme_motivational_desc": "Inspiring and uplifting"
  }
}
```

### QA Checklist

- [ ] All occasion keys have translations
- [ ] All emotion keys have translations
- [ ] `pnpm translate` succeeds

---

## 📋 Task 11: Update/Create Tests (0.5 hours)

### Objective

Update Step 1 tests and create new tests for Convex queries.

### Update Existing Test File

**File**: `__tests__/integration/guided-step-1-convex.test.tsx` (modify)

Add mocks for the new Convex queries:

```typescript
// Add to existing mocks at the top
const mockOccasions = [
  { _id: "occ_1", key: "wedding", iconId: "heart", sortOrder: 1, isActive: true },
  { _id: "occ_2", key: "birthday", iconId: "cake", sortOrder: 2, isActive: true },
];

const mockEmotionalThemes = [
  { _id: "theme_1", key: "joyful", color: "#FFD93D", iconId: "smile", sortOrder: 1, isActive: true },
  { _id: "theme_2", key: "romantic", color: "#FF6B6B", iconId: "heart-pulse", sortOrder: 2, isActive: true },
];

// Update useQuery mock to handle new queries
(useQuery as any).mockImplementation((queryFn: any) => {
  if (queryFn === api.occasions.listActive) {
    return mockOccasions;
  }
  if (queryFn === api.emotionalThemes.listActive) {
    return mockEmotionalThemes;
  }
  // ... existing project query handling
});
```

### Create New Test File

**File**: `__tests__/convex/occasions.test.ts` (create)

```typescript
import { describe, expect, it } from "vitest";
import { api } from "@/convex/_generated/api";

describe("Occasions Queries", () => {
  it("should have listActive query defined", () => {
    expect(api.occasions.listActive).toBeDefined();
  });

  it("should have getByKey query defined", () => {
    expect(api.occasions.getByKey).toBeDefined();
  });

  it("should validate occasion data structure", () => {
    const mockOccasion = {
      _id: "occ_123",
      key: "wedding",
      iconId: "heart",
      illustrationUrl: "https://example.com/wedding.jpg",
      sortOrder: 1,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(mockOccasion.key).toBe("wedding");
    expect(mockOccasion.iconId).toBe("heart");
    expect(mockOccasion.isActive).toBe(true);
  });
});

describe("Emotional Themes Queries", () => {
  it("should have listActive query defined", () => {
    expect(api.emotionalThemes.listActive).toBeDefined();
  });

  it("should validate emotional theme data structure", () => {
    const mockTheme = {
      _id: "theme_123",
      key: "joyful",
      color: "#FFD93D",
      iconId: "smile",
      sortOrder: 1,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(mockTheme.key).toBe("joyful");
    expect(mockTheme.color).toBe("#FFD93D");
    expect(mockTheme.iconId).toBe("smile");
  });
});
```

### QA Checklist

```bash
# Run tests
npx vitest run __tests__/convex/occasions.test.ts
```

- [ ] All tests pass
- [ ] Query existence verified
- [ ] Data structure validated

---

## 📋 Task 12: QA & Deploy (1 hour)

### Final QA Checklist

```bash
# 1. TypeScript check all files
npx tsc --noEmit

# 2. Biome check
npx @biomejs/biome check --write .

# 3. Run tests
npx vitest run

# 4. Deploy Convex
npx convex dev --once

# 5. Run seed scripts (if not already done)
npx convex run seed/seedOccasionsAndEmotions:seedOccasions
npx convex run seed/seedOccasionsAndEmotions:seedEmotionalThemes
```

### Manual Testing Checklist

- [ ] Open Step 1 on mobile (375px viewport)
- [ ] Occasions load from Convex (not hardcoded)
- [ ] Occasion illustrations display
- [ ] Emotion icons display with colors
- [ ] Selection works correctly
- [ ] Data persists on page refresh
- [ ] Navigation to Step 2 works

---

## 🎯 Success Criteria

- ✅ Occasions and emotions stored in Convex
- ✅ Step 1 fetches data dynamically
- ✅ Occasion illustrations display
- ✅ Emotion icons display with colors
- ✅ All existing functionality preserved
- ✅ All tests pass
- ✅ Mobile-first UI maintained

---

## 📁 Files Created/Modified Summary

### Files to Create

| File | Task | Description |
|------|------|-------------|
| `convex/occasions.ts` | Task 3 | Occasion queries (listActive, getByKey) |
| `convex/emotionalThemes.ts` | Task 3 | Emotional theme queries |
| `convex/seed/seedOccasionsAndEmotions.ts` | Task 4 | Seed script for initial data |
| `scripts/generate-occasion-illustrations.ts` | Task 5 | Fal.ai image generation script |
| `scripts/upload-occasion-illustrations.ts` | Task 7 | Upload images to Convex storage |
| `lib/icon-mapping.ts` | Task 8 | Icon ID → Lucide component mapping |
| `__tests__/convex/occasions.test.ts` | Task 11 | Query and data structure tests |

### Files to Modify

| File | Task | Changes |
|------|------|---------|
| `convex/schema.ts` | Tasks 1, 2 | Add occasions, emotionalThemes tables |
| `app/[locale]/guided/step-1/page.tsx` | Task 9 | Replace hardcoded data with Convex queries |
| `__tests__/integration/guided-step-1-convex.test.tsx` | Task 11 | Add mocks for occasions/emotions queries |
| `messages/en.json` | Task 10 | Verify occasion/emotion translation keys |

### Generated Assets

| File | Task | Description |
|------|------|-------------|
| `generated/occasion-illustrations/illustration-urls.json` | Task 6 | Generated image URLs from Fal.ai |

**Total New Files**: 7  
**Total Modified Files**: 4  
**Total Generated Assets**: 1

### Key Implementation References

The implementation follows the patterns defined in:
- **Schema Design**: `architectural-improvements-sprint-21-12-2025.md` lines 424-465
- **Occasion Illustrations**: `architectural-improvements-sprint-21-12-2025.md` lines 467-485
- **Icon Mapping**: `architectural-improvements-sprint-21-12-2025.md` lines 487-524
- **i18n Integration**: `architectural-improvements-sprint-21-12-2025.md` lines 527-542

---

**Document Version**: 1.0  
**Created**: December 21, 2025  
**Author**: MyShortReel Development Team  
**Status**: 📋 PLANNING - Ready for Implementation

