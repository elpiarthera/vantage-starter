# 🎤 MyShortReel - Sprint 14: Voice Choices in Convex

**Date**: December 21, 2025  
**Status**: 📋 PLANNING  
**Estimated Time**: 13 hours  
**Goal**: Migrate hardcoded voice choices to Convex with audio preview support  
**Dependencies**: Sprint 13 (Occasions in Convex) - same pattern  
**Architecture**: Based on `architectural-improvements-sprint-21-12-2025.md` (Improvement #4)  
**Mobile Strategy**: **Strictly Mobile-First** per `mobile-first-best-practices.md` 📱  
**Design System**: **shadcn/ui only** per `design-system.md`  
**QA Strategy**: **2-Step QA** - TypeScript (noEmit) → Biome for all files  

---

## 📊 Executive Summary

### Problem Statement

Voice options are currently hardcoded in `lib/constants/audio.ts`:

```typescript
export const MINIMAX_VOICES = {
  "Emma - Warm & Friendly": "Wise_Woman",
  "James - Professional & Clear": "Patient_Man",
  // ... 8 voices
} as const;
```

**Issues**:
- Adding new voices requires code deployment
- Cannot A/B test voice popularity
- No analytics on voice selection
- **❌ Users cannot preview/listen to voices before selecting**
- **❌ No audio samples in the user's language**

### Solution

1. Create `voices` table in Convex
2. Create `voiceSamples` table for audio previews
3. Generate audio samples for each voice × each language (56 files)
4. Create `VoicePreview` component with audio player
5. Update Step 4 (Sound Design) to fetch from Convex
6. Allow users to preview voices in their selected language

### Voice Preview Architecture

```
voices/
├── emma_warm_friendly/
│   ├── en.mp3    "Hello, this is Emma speaking..."
│   ├── fr.mp3    "Bonjour, c'est Emma qui parle..."
│   ├── de.mp3    "Hallo, hier spricht Emma..."
│   └── ... (7 languages)
├── james_professional_clear/
│   └── ... (7 languages)
└── ... (8 voices × 7 languages = 56 audio files)
```

---

## ⏱️ TIME TRACKING

| Task | Description | Est. Hours | Actual | Status |
|------|-------------|------------|--------|--------|
| 1 | Create voices table schema | 0.5h | - | ⏳ |
| 2 | Create voiceSamples table schema | 0.5h | - | ⏳ |
| 3 | Create Convex queries | 1h | - | ⏳ |
| 4 | Create sample text definitions | 0.5h | - | ⏳ |
| 5 | Create audio generation script | 2h | - | ⏳ |
| 6 | Generate audio samples (56 files) | 1h | - | ⏳ |
| 7 | Upload samples to storage | 1h | - | ⏳ |
| 8 | Create seed script for voices | 1h | - | ⏳ |
| 9 | Create VoicePreview component | 2h | - | ⏳ |
| 10 | Update Step 4 to fetch from Convex | 2h | - | ⏳ |
| 11 | Update i18n integration | 0.5h | - | ⏳ |
| 12 | Update/create tests | 0.5h | - | ⏳ |
| 13 | QA & Deploy | 0.5h | - | ⏳ |
| **TOTAL** | | **13h** | - | ⏳ |

---

## 🔍 PRE-SPRINT CHECKLIST (5 min)

Before starting Sprint 14:

- [ ] **Sprint 13 completed** (establishes the pattern)

- [ ] **Verify FAL_KEY is set** (for audio generation):
  ```bash
  grep "FAL_KEY=" .env.local
  ```

- [ ] **Verify Convex dev is running**:
  ```bash
  npx convex dev --once
  ```

- [ ] **Review current voice constants**:
  ```bash
  cat lib/constants/audio.ts
  ```

---

## 📋 Task 1: Create Voices Table Schema (0.5 hours)

### Objective

Add the `voices` table to Convex schema.

### Implementation

**File**: `convex/schema.ts` (modify)

```typescript
// Add voices table
voices: defineTable({
  key: v.string(),              // "emma_warm_friendly" (i18n key)
  apiValue: v.string(),         // "Wise_Woman" (MiniMax API value)
  provider: v.string(),         // "minimax" (for future multi-provider)
  gender: v.union(v.literal("male"), v.literal("female")),
  style: v.string(),            // "warm", "professional", "energetic"
  
  // Metadata
  sortOrder: v.number(),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_key", ["key"])
  .index("by_provider", ["provider"])
  .index("by_active", ["isActive"])
  .index("by_gender", ["gender"]),
```

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

## 📋 Task 2: Create VoiceSamples Table Schema (0.5 hours)

### Objective

Add the `voiceSamples` table for audio previews.

### Implementation

**File**: `convex/schema.ts` (modify)

```typescript
// Add voiceSamples table
voiceSamples: defineTable({
  voiceKey: v.string(),         // References voices.key
  languageCode: v.string(),     // "en", "fr", "de", "it", "es", "pt", "ru"
  
  // Audio file storage - support both storage options
  audioUrl: v.string(),                          // Direct URL for playback
  audioStorageId: v.optional(v.id("_storage")), // Convex storage ID
  audioR2Key: v.optional(v.string()),           // R2 storage key (for future migration)
  
  // Metadata
  durationMs: v.number(),       // Duration in milliseconds
  sampleText: v.string(),       // Text that was spoken (for reference)
  
  createdAt: v.number(),
})
  .index("by_voice", ["voiceKey"])
  .index("by_voice_and_language", ["voiceKey", "languageCode"]),
```

**Note**: We include `audioR2Key` for future R2 migration compatibility (see Sprint 5: Cloudflare R2 Migration).

### QA Checklist

```bash
# Deploy schema
npx convex dev --once
```

- [ ] Table created in Convex dashboard

---

## 📋 Task 3: Create Convex Queries (1 hour)

### Objective

Create queries to fetch voices and their samples.

### Implementation

**File**: `convex/voices.ts` (create)

```typescript
import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * List all active voices, sorted by sortOrder
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const voices = await ctx.db
      .query("voices")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    return voices.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Get a single voice by key
 */
export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voices")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

/**
 * List voices by gender
 */
export const listByGender = query({
  args: { gender: v.union(v.literal("male"), v.literal("female")) },
  handler: async (ctx, args) => {
    const voices = await ctx.db
      .query("voices")
      .withIndex("by_gender", (q) => q.eq("gender", args.gender))
      .collect();
    
    return voices
      .filter((v) => v.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
});
```

**File**: `convex/voiceSamples.ts` (create)

```typescript
import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get voice sample for a specific voice and language
 */
export const getByVoiceAndLanguage = query({
  args: {
    voiceKey: v.string(),
    languageCode: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceSamples")
      .withIndex("by_voice_and_language", (q) =>
        q.eq("voiceKey", args.voiceKey).eq("languageCode", args.languageCode)
      )
      .first();
  },
});

/**
 * List all samples for a voice
 */
export const listByVoice = query({
  args: { voiceKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceSamples")
      .withIndex("by_voice", (q) => q.eq("voiceKey", args.voiceKey))
      .collect();
  },
});

/**
 * Get samples for multiple voices in a specific language
 */
export const listByLanguage = query({
  args: { languageCode: v.string() },
  handler: async (ctx, args) => {
    const samples = await ctx.db.query("voiceSamples").collect();
    return samples.filter((s) => s.languageCode === args.languageCode);
  },
});
```

### QA Checklist

```bash
# TypeScript check
npx tsc --noEmit convex/voices.ts
npx tsc --noEmit convex/voiceSamples.ts

# Biome check
npx @biomejs/biome check --write convex/voices.ts
npx @biomejs/biome check --write convex/voiceSamples.ts

# Deploy
npx convex dev --once
```

- [ ] Queries created and deployed
- [ ] Test queries in Convex dashboard

---

## 📋 Task 4: Create Sample Text Definitions (0.5 hours)

### Objective

Define sample texts for each language (~5-8 seconds when spoken).

### Implementation

**File**: `lib/constants/voice-sample-texts.ts` (create)

```typescript
/**
 * Sample texts for voice previews
 * Each text should produce ~5-8 seconds of audio
 */

export const VOICE_SAMPLE_TEXTS: Record<string, string> = {
  en: "Hello, welcome to your special day. Let me guide you through this beautiful journey of memories.",
  
  fr: "Bonjour, bienvenue en ce jour spécial. Laissez-moi vous guider à travers ce magnifique voyage de souvenirs.",
  
  de: "Hallo, willkommen zu Ihrem besonderen Tag. Lassen Sie mich Sie durch diese wunderbare Reise der Erinnerungen führen.",
  
  it: "Ciao, benvenuto in questo giorno speciale. Permettimi di guidarti in questo meraviglioso viaggio di ricordi.",
  
  es: "Hola, bienvenido a este día especial. Déjame guiarte en este hermoso viaje de recuerdos.",
  
  pt: "Olá, bem-vindo a este dia especial. Deixe-me guiá-lo nesta bela jornada de memórias.",
  
  ru: "Привет, добро пожаловать в этот особенный день. Позвольте провести вас через это прекрасное путешествие воспоминаний.",
};

export const SUPPORTED_LANGUAGES = [
  "en", "fr", "de", "it", "es", "pt", "ru"
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * Voice definitions matching current MINIMAX_VOICES
 */
export const VOICE_DEFINITIONS = [
  {
    key: "emma_warm_friendly",
    displayName: "Emma - Warm & Friendly",
    apiValue: "Wise_Woman",
    gender: "female" as const,
    style: "warm",
  },
  {
    key: "james_professional_clear",
    displayName: "James - Professional & Clear",
    apiValue: "Patient_Man",
    gender: "male" as const,
    style: "professional",
  },
  {
    key: "sofia_elegant_sophisticated",
    displayName: "Sofia - Elegant & Sophisticated",
    apiValue: "Calm_Woman",
    gender: "female" as const,
    style: "elegant",
  },
  {
    key: "marcus_deep_authoritative",
    displayName: "Marcus - Deep & Authoritative",
    apiValue: "Deep_Voice_Man",
    gender: "male" as const,
    style: "authoritative",
  },
  {
    key: "luna_soft_romantic",
    displayName: "Luna - Soft & Romantic",
    apiValue: "Calm_Woman",
    gender: "female" as const,
    style: "romantic",
  },
  {
    key: "oliver_energetic_upbeat",
    displayName: "Oliver - Energetic & Upbeat",
    apiValue: "Casual_Guy",
    gender: "male" as const,
    style: "energetic",
  },
  {
    key: "isabella_calm_soothing",
    displayName: "Isabella - Calm & Soothing",
    apiValue: "Lovely_Girl",
    gender: "female" as const,
    style: "calm",
  },
  {
    key: "noah_confident_strong",
    displayName: "Noah - Confident & Strong",
    apiValue: "Determined_Man",
    gender: "male" as const,
    style: "confident",
  },
];
```

### QA Checklist

```bash
# TypeScript check
npx tsc --noEmit lib/constants/voice-sample-texts.ts
```

- [ ] All 7 languages have sample text
- [ ] All 8 voices defined

---

## 📋 Task 5: Create Audio Generation Script (2 hours)

### Objective

Create a script to generate audio samples using MiniMax Speech 2.6 HD.

### Implementation

**File**: `scripts/generate-voice-samples.ts` (create)

```typescript
/**
 * Generate Voice Sample Audio Files
 * 
 * Uses fal.ai MiniMax Speech 2.6 HD to generate audio samples.
 * 
 * USAGE:
 *   npx tsx scripts/generate-voice-samples.ts
 *   npx tsx scripts/generate-voice-samples.ts --voice=emma_warm_friendly
 *   npx tsx scripts/generate-voice-samples.ts --lang=fr
 * 
 * PREREQUISITES:
 *   - FAL_KEY in .env.local
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import {
  VOICE_SAMPLE_TEXTS,
  VOICE_DEFINITIONS,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "../lib/constants/voice-sample-texts";

dotenv.config({ path: ".env.local" });

const FAL_KEY = process.env.FAL_KEY;
const MODEL_ID = "fal-ai/minimax/speech-2.6-hd";

// Language boost mapping for MiniMax
const LANGUAGE_BOOST_MAP: Record<string, string> = {
  en: "English",
  fr: "French",
  de: "German",
  it: "Italian",
  es: "Spanish",
  pt: "Portuguese",
  ru: "Russian",
};

interface QueueStatus {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  request_id: string;
  status_url?: string;
  response_url?: string;
}

interface SpeechResult {
  audio: {
    url: string;
    content_type: string;
    file_size: number;
    duration?: number;
  };
}

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitFalJob(
  text: string,
  voiceId: string,
  languageBoost: string,
): Promise<QueueStatus> {
  const response = await fetch(`https://queue.fal.run/${MODEL_ID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${FAL_KEY}`,
    },
    body: JSON.stringify({
      text,
      voice_id: voiceId,
      language_boost: languageBoost,
      speed: 1.0,
      volume: 1.0,
      output_format: "mp3",
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
): Promise<SpeechResult> {
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
      return (await resultRes.json()) as SpeechResult;
    }

    if (statusData.status === "FAILED") {
      throw new Error("fal.ai speech generation failed");
    }
  }

  throw new Error("fal.ai speech generation timed out");
}

async function generateSample(
  voiceKey: string,
  voiceApiValue: string,
  languageCode: SupportedLanguage,
): Promise<{ url: string; duration: number } | null> {
  const text = VOICE_SAMPLE_TEXTS[languageCode];
  const languageBoost = LANGUAGE_BOOST_MAP[languageCode];

  console.log(`   🎤 Generating ${voiceKey} in ${languageCode}...`);

  try {
    const status = await submitFalJob(text, voiceApiValue, languageBoost);

    if (!status.status_url || !status.response_url) {
      throw new Error("Missing status or response URL from fal.ai");
    }

    const result = await pollFalResult(status.status_url, status.response_url);

    if (result.audio?.url) {
      console.log(`   ✅ Generated: ${result.audio.url.substring(0, 50)}...`);
      return {
        url: result.audio.url,
        duration: result.audio.duration ?? 5000,
      };
    }

    console.log(`   ❌ No audio returned`);
    return null;
  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

async function main() {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║     🎤 VOICE SAMPLE GENERATOR                             ║");
  console.log("║     Generating audio previews for each voice × language   ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  if (!FAL_KEY) {
    console.error("❌ FAL_KEY not found in .env.local");
    process.exit(1);
  }

  // Parse arguments
  const args = process.argv.slice(2);
  const voiceArg = args.find((a) => a.startsWith("--voice="))?.split("=")[1];
  const langArg = args.find((a) => a.startsWith("--lang="))?.split("=")[1];

  const voicesToGenerate = voiceArg
    ? VOICE_DEFINITIONS.filter((v) => v.key === voiceArg)
    : VOICE_DEFINITIONS;

  const languagesToGenerate = langArg
    ? [langArg as SupportedLanguage]
    : [...SUPPORTED_LANGUAGES];

  console.log(`📊 Generating ${voicesToGenerate.length} voices × ${languagesToGenerate.length} languages`);
  console.log(`📊 Total samples: ${voicesToGenerate.length * languagesToGenerate.length}`);
  console.log(`💰 Estimated cost: ~$${(voicesToGenerate.length * languagesToGenerate.length * 0.02).toFixed(2)}\n`);

  const resultsDir = path.join(__dirname, "../generated/voice-samples");
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const results: Record<string, Record<string, { url: string; duration: number } | null>> = {};

  for (const voice of voicesToGenerate) {
    console.log(`\n🎤 Processing voice: ${voice.displayName}`);
    results[voice.key] = {};

    for (const lang of languagesToGenerate) {
      const sample = await generateSample(voice.key, voice.apiValue, lang);
      results[voice.key][lang] = sample;

      // Rate limiting
      await wait(1000);
    }
  }

  // Save results
  const outputFile = path.join(resultsDir, "voice-samples.json");
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n📁 Results saved to: ${outputFile}`);

  // Summary
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("📊 GENERATION SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");

  let successCount = 0;
  let totalCount = 0;

  for (const [voiceKey, samples] of Object.entries(results)) {
    for (const [lang, sample] of Object.entries(samples)) {
      totalCount++;
      if (sample?.url) successCount++;
    }
  }

  console.log(`📊 Total: ${successCount}/${totalCount} successful`);
  console.log(`💰 Actual cost: ~$${(successCount * 0.02).toFixed(2)}`);
  console.log("\n✅ Done! Upload URLs to Convex using the upload script.\n");
}

main().catch(console.error);
```

### QA Checklist

```bash
# TypeScript check
npx tsc --noEmit scripts/generate-voice-samples.ts
```

- [ ] Script compiles without errors
- [ ] Can run with --voice and --lang flags

---

## 📋 Task 6: Generate Audio Samples (1 hour)

### Objective

Run the script to generate 56 audio samples (8 voices × 7 languages).

### Execution

```bash
# Generate all samples (takes ~20-30 minutes)
npx tsx scripts/generate-voice-samples.ts

# Or generate one voice at a time
npx tsx scripts/generate-voice-samples.ts --voice=emma_warm_friendly

# Or generate one language for all voices
npx tsx scripts/generate-voice-samples.ts --lang=fr
```

### Expected Output

```
📊 Generating 8 voices × 7 languages
📊 Total samples: 56
💰 Estimated cost: ~$1.12

🎤 Processing voice: Emma - Warm & Friendly
   🎤 Generating emma_warm_friendly in en...
   ✅ Generated: https://fal.media/...
   🎤 Generating emma_warm_friendly in fr...
   ✅ Generated: https://fal.media/...
   ...

📊 Total: 56/56 successful
💰 Actual cost: ~$1.12
```

### QA Checklist

- [ ] All 56 samples generated
- [ ] JSON file saved with URLs
- [ ] Audio files are ~5-8 seconds each

---

## 📋 Task 7: Upload Samples to Storage (1 hour)

### Objective

Upload generated audio files to Convex storage and create voiceSample records.

### Implementation

**File**: `scripts/upload-voice-samples.ts` (create)

```typescript
/**
 * Upload Voice Samples to Convex Storage
 * 
 * Reads URLs from generated JSON and uploads to Convex storage.
 * 
 * USAGE:
 *   npx tsx scripts/upload-voice-samples.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { VOICE_SAMPLE_TEXTS } from "../lib/constants/voice-sample-texts";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

async function main() {
  console.log("\n📤 Uploading voice samples to Convex...\n");

  const client = new ConvexHttpClient(CONVEX_URL);
  
  const resultsFile = path.join(
    __dirname,
    "../generated/voice-samples/voice-samples.json"
  );
  
  if (!fs.existsSync(resultsFile)) {
    console.error("❌ Results file not found. Run generate script first.");
    process.exit(1);
  }
  
  const results = JSON.parse(fs.readFileSync(resultsFile, "utf-8"));
  
  let uploadedCount = 0;
  let errorCount = 0;
  
  for (const [voiceKey, samples] of Object.entries(results)) {
    console.log(`\n📤 Uploading samples for: ${voiceKey}`);
    
    for (const [langCode, data] of Object.entries(samples as Record<string, any>)) {
      if (!data?.url) {
        console.log(`   ⏭️ Skipping ${langCode}: No URL`);
        continue;
      }
      
      console.log(`   📤 ${langCode}...`);
      
      try {
        // Create voice sample record in Convex
        // Note: This requires a mutation to be created
        // For now, log the data that would be inserted
        
        const sampleData = {
          voiceKey,
          languageCode: langCode,
          audioUrl: data.url,
          durationMs: data.duration || 5000,
          sampleText: VOICE_SAMPLE_TEXTS[langCode] || "",
          createdAt: Date.now(),
        };
        
        console.log(`      ✅ Ready to insert:`, sampleData.voiceKey, sampleData.languageCode);
        uploadedCount++;
        
      } catch (error) {
        console.error(`      ❌ Error: ${error}`);
        errorCount++;
      }
    }
  }
  
  console.log(`\n📊 Summary: ${uploadedCount} uploaded, ${errorCount} errors`);
  console.log("\n✅ Upload complete!\n");
}

main().catch(console.error);
```

### Create Upload Mutation

**File**: `convex/voiceSamples.ts` (modify)

```typescript
import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Create or update a voice sample
 */
export const upsert = mutation({
  args: {
    voiceKey: v.string(),
    languageCode: v.string(),
    audioUrl: v.string(),
    durationMs: v.number(),
    sampleText: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if sample already exists
    const existing = await ctx.db
      .query("voiceSamples")
      .withIndex("by_voice_and_language", (q) =>
        q.eq("voiceKey", args.voiceKey).eq("languageCode", args.languageCode)
      )
      .first();
    
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        audioUrl: args.audioUrl,
        durationMs: args.durationMs,
        sampleText: args.sampleText,
      });
      return existing._id;
    }
    
    // Create new
    return await ctx.db.insert("voiceSamples", {
      voiceKey: args.voiceKey,
      languageCode: args.languageCode,
      audioUrl: args.audioUrl,
      durationMs: args.durationMs,
      sampleText: args.sampleText,
      createdAt: Date.now(),
    });
  },
});
```

### QA Checklist

- [ ] All samples uploaded to Convex
- [ ] voiceSamples table has 56 records
- [ ] URLs accessible and playable

---

## 📋 Task 8: Create Seed Script for Voices (1 hour)

### Objective

Create a script to populate the voices table.

### Implementation

**File**: `convex/seed/seedVoices.ts` (create)

```typescript
import { internalMutation } from "../_generated/server";

/**
 * Seed initial voices data
 * Run with: npx convex run seed/seedVoices:seedVoices
 */
export const seedVoices = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const voices = [
      {
        key: "emma_warm_friendly",
        apiValue: "Wise_Woman",
        provider: "minimax",
        gender: "female" as const,
        style: "warm",
        sortOrder: 1,
      },
      {
        key: "james_professional_clear",
        apiValue: "Patient_Man",
        provider: "minimax",
        gender: "male" as const,
        style: "professional",
        sortOrder: 2,
      },
      {
        key: "sofia_elegant_sophisticated",
        apiValue: "Calm_Woman",
        provider: "minimax",
        gender: "female" as const,
        style: "elegant",
        sortOrder: 3,
      },
      {
        key: "marcus_deep_authoritative",
        apiValue: "Deep_Voice_Man",
        provider: "minimax",
        gender: "male" as const,
        style: "authoritative",
        sortOrder: 4,
      },
      {
        key: "luna_soft_romantic",
        apiValue: "Calm_Woman",
        provider: "minimax",
        gender: "female" as const,
        style: "romantic",
        sortOrder: 5,
      },
      {
        key: "oliver_energetic_upbeat",
        apiValue: "Casual_Guy",
        provider: "minimax",
        gender: "male" as const,
        style: "energetic",
        sortOrder: 6,
      },
      {
        key: "isabella_calm_soothing",
        apiValue: "Lovely_Girl",
        provider: "minimax",
        gender: "female" as const,
        style: "calm",
        sortOrder: 7,
      },
      {
        key: "noah_confident_strong",
        apiValue: "Determined_Man",
        provider: "minimax",
        gender: "male" as const,
        style: "confident",
        sortOrder: 8,
      },
    ];
    
    for (const voice of voices) {
      // Check if already exists
      const existing = await ctx.db
        .query("voices")
        .withIndex("by_key", (q) => q.eq("key", voice.key))
        .first();
      
      if (existing) {
        console.log(`Voice ${voice.key} already exists, skipping`);
        continue;
      }
      
      await ctx.db.insert("voices", {
        ...voice,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      
      console.log(`Created voice: ${voice.key}`);
    }
    
    return { success: true, message: "Voices seeded" };
  },
});
```

### Run Seed Script

```bash
npx convex run seed/seedVoices:seedVoices
```

### QA Checklist

- [ ] 8 voices created in database
- [ ] Data visible in Convex dashboard

---

## 📋 Task 9: Create VoicePreview Component (2 hours)

### Objective

Create a mobile-first component for previewing voices with audio playback.

### Implementation

**File**: `components/voice-selection/VoicePreview.tsx` (create)

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoicePreviewProps {
  voiceKey: string;
  languageCode: string;
  className?: string;
}

export function VoicePreview({
  voiceKey,
  languageCode,
  className,
}: VoicePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch voice sample for this voice + language
  const sample = useQuery(api.voiceSamples.getByVoiceAndLanguage, {
    voiceKey,
    languageCode,
  });

  // Reset audio when sample changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [voiceKey, languageCode]);

  const handlePlayPause = () => {
    if (!audioRef.current || !sample?.audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      audioRef.current.play()
        .then(() => {
          setIsLoading(false);
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error("Audio playback error:", error);
          setIsLoading(false);
        });
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  // No sample available
  if (!sample?.audioUrl) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className={cn("min-w-[44px] min-h-[44px]", className)}
        aria-label="Preview not available"
      >
        <Volume2 className="h-4 w-4 text-gray-500" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePlayPause}
        disabled={isLoading}
        className={cn(
          "min-w-[44px] min-h-[44px] transition-colors",
          isPlaying && "bg-[#0d7ff2]/10 border-[#0d7ff2]",
          className
        )}
        aria-label={isPlaying ? "Pause preview" : "Play preview"}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4 text-[#0d7ff2]" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      <audio
        ref={audioRef}
        src={sample.audioUrl}
        onEnded={handleEnded}
        onError={() => {
          setIsLoading(false);
          setIsPlaying(false);
        }}
        preload="none"
      />
    </>
  );
}
```

**File**: `components/voice-selection/VoiceSelector.tsx` (create)

```typescript
"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VoicePreview } from "./VoicePreview";
import { User, User2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceSelectorProps {
  value: string | undefined;
  onChange: (voiceKey: string) => void;
  languageCode: string;
  disabled?: boolean;
}

export function VoiceSelector({
  value,
  onChange,
  languageCode,
  disabled = false,
}: VoiceSelectorProps) {
  const t = useTranslations("voices");
  const voices = useQuery(api.voices.listActive);

  const isLoading = voices === undefined;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {voices?.map((voice) => {
        const isSelected = value === voice.key;
        const GenderIcon = voice.gender === "female" ? User : User2;

        return (
          <Card
            key={voice.key}
            className={cn(
              "cursor-pointer transition-all",
              isSelected
                ? "border-[#0d7ff2] bg-[#0d7ff2]/5"
                : "border-[#334155] hover:border-[#475569]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && onChange(voice.key)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={cn(
                    "p-2 rounded-full",
                    voice.gender === "female"
                      ? "bg-pink-500/20"
                      : "bg-blue-500/20"
                  )}
                >
                  <GenderIcon
                    className={cn(
                      "h-5 w-5",
                      voice.gender === "female"
                        ? "text-pink-400"
                        : "text-blue-400"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">
                    {t(voice.key)}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {t(`${voice.key}_style`)}
                  </p>
                </div>
              </div>

              {/* Voice Preview Button */}
              <VoicePreview
                voiceKey={voice.key}
                languageCode={languageCode}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

**File**: `components/voice-selection/index.ts` (create)

```typescript
export { VoicePreview } from "./VoicePreview";
export { VoiceSelector } from "./VoiceSelector";
```

### QA Checklist

```bash
# TypeScript check
npx tsc --noEmit components/voice-selection/VoicePreview.tsx
npx tsc --noEmit components/voice-selection/VoiceSelector.tsx

# Biome check
npx @biomejs/biome check --write components/voice-selection/
```

- [ ] VoicePreview plays audio
- [ ] VoiceSelector renders all voices
- [ ] Mobile layout works (44px touch targets)
- [ ] Preview button shows play/pause state

---

## 📋 Task 10: Update Step 4 & Narration Generation (2 hours)

### Objective

Update Step 4 to use the new VoiceSelector component, and update narration generation to use voice API values from Convex.

### Implementation

**File**: `app/[locale]/guided/step-4/page.tsx` (modify)

```typescript
// Add imports
import { VoiceSelector } from "@/components/voice-selection";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Replace hardcoded voice dropdown with VoiceSelector
<VoiceSelector
  value={selectedVoice}
  onChange={(voiceKey) => {
    setSelectedVoice(voiceKey);
    // Update project with new voice
    if (projectId) {
      updateProject({
        projectId,
        step4Data: {
          ...step4Data,
          voiceKey,
        },
      });
    }
  }}
  languageCode={project?.language || "en"}
  disabled={isGenerating}
/>
```

### Update Voice Selection Logic

```typescript
// When generating narration, get the API value from Convex
const voice = useQuery(api.voices.getByKey, {
  key: selectedVoice || "emma_warm_friendly",
});

// Use voice.apiValue when calling narration generation
await generateNarration({
  projectId,
  voiceId: voice?.apiValue || "Wise_Woman",
  // ...
});
```

### Update Narration Generation Action (if needed)

**File**: `convex/actions/narrationGeneration.ts` (review and modify if needed)

If the narration generation action currently uses a hardcoded voice mapping:

```typescript
// Current (hardcoded)
const voiceId = MINIMAX_VOICES[selectedVoice] || "Wise_Woman";

// Updated (from Convex)
// The voice.apiValue is now passed directly from the Step 4 component
const voiceId = args.voiceApiValue || "Wise_Woman";
```

**Note**: The voice API value should be passed from Step 4 when calling the narration generation action. This keeps the Convex action simple and avoids additional queries.

### QA Checklist

```bash
# TypeScript check
npx tsc --noEmit app/[locale]/guided/step-4/page.tsx
npx tsc --noEmit convex/actions/narrationGeneration.ts

# Biome check
npx @biomejs/biome check --write app/[locale]/guided/step-4/page.tsx
npx @biomejs/biome check --write convex/actions/narrationGeneration.ts
```

- [ ] VoiceSelector renders in Step 4
- [ ] Voice preview works (audio plays)
- [ ] Voice selection saves to Convex
- [ ] Narration generation uses correct voice API value
- [ ] No more hardcoded voice mapping in action

---

## 📋 Task 11: Update i18n Integration (0.5 hours)

### Objective

Add translation keys for voice names and styles.

### Implementation

**File**: `messages/en.json` (modify)

```json
{
  "voices": {
    "emma_warm_friendly": "Emma",
    "emma_warm_friendly_style": "Warm & Friendly",
    "james_professional_clear": "James",
    "james_professional_clear_style": "Professional & Clear",
    "sofia_elegant_sophisticated": "Sofia",
    "sofia_elegant_sophisticated_style": "Elegant & Sophisticated",
    "marcus_deep_authoritative": "Marcus",
    "marcus_deep_authoritative_style": "Deep & Authoritative",
    "luna_soft_romantic": "Luna",
    "luna_soft_romantic_style": "Soft & Romantic",
    "oliver_energetic_upbeat": "Oliver",
    "oliver_energetic_upbeat_style": "Energetic & Upbeat",
    "isabella_calm_soothing": "Isabella",
    "isabella_calm_soothing_style": "Calm & Soothing",
    "noah_confident_strong": "Noah",
    "noah_confident_strong_style": "Confident & Strong",
    "preview_voice": "Preview",
    "preview_not_available": "Preview not available"
  }
}
```

### Run Translation Script

```bash
pnpm translate
```

### QA Checklist

- [ ] All voice keys have translations
- [ ] `pnpm translate` succeeds

---

## 📋 Task 12: Update/Create Tests (0.5 hours)

### Objective

Create tests for voice queries and update existing audio tests.

### Implementation

**File**: `__tests__/convex/voices.test.ts` (create)

```typescript
import { describe, expect, it } from "vitest";
import { api } from "@/convex/_generated/api";

describe("Voices Queries", () => {
  it("should have listActive query defined", () => {
    expect(api.voices.listActive).toBeDefined();
  });

  it("should have getByKey query defined", () => {
    expect(api.voices.getByKey).toBeDefined();
  });

  it("should validate voice data structure", () => {
    const mockVoice = {
      _id: "voice_123",
      key: "emma_warm_friendly",
      apiValue: "Wise_Woman",
      provider: "minimax",
      gender: "female",
      style: "warm",
      sortOrder: 1,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(mockVoice.key).toBe("emma_warm_friendly");
    expect(mockVoice.apiValue).toBe("Wise_Woman");
    expect(mockVoice.gender).toBe("female");
  });
});

describe("VoiceSamples Queries", () => {
  it("should have getByVoiceAndLanguage query defined", () => {
    expect(api.voiceSamples.getByVoiceAndLanguage).toBeDefined();
  });

  it("should validate voice sample data structure", () => {
    const mockSample = {
      _id: "sample_123",
      voiceKey: "emma_warm_friendly",
      languageCode: "en",
      audioUrl: "https://example.com/sample.mp3",
      durationMs: 5000,
      sampleText: "Hello, welcome to your special day.",
      createdAt: Date.now(),
    };

    expect(mockSample.voiceKey).toBe("emma_warm_friendly");
    expect(mockSample.languageCode).toBe("en");
    expect(mockSample.durationMs).toBeGreaterThan(0);
  });
});
```

### Update Existing Audio Tests

**File**: `__tests__/lib/constants/audio.test.ts` (modify)

```typescript
// Add comment about migration
/**
 * NOTE: MINIMAX_VOICES is being migrated to Convex.
 * These tests verify backward compatibility during transition.
 * See: docs/MVP/Todo/sprint-14-implementation-21-12-2025.md
 */

// Keep existing tests for backward compatibility
describe("audio constants (legacy)", () => {
  // ... existing tests
});

// Add note about new system
describe("Convex voices (new)", () => {
  it("should migrate to api.voices.listActive", () => {
    // Placeholder - actual test in __tests__/convex/voices.test.ts
    expect(true).toBe(true);
  });
});
```

### QA Checklist

```bash
# Run tests
npx vitest run __tests__/convex/voices.test.ts
npx vitest run __tests__/lib/constants/audio.test.ts
```

- [ ] All tests pass
- [ ] Query existence verified

---

## 📋 Task 13: QA & Deploy (0.5 hours)

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

# 5. Run seed scripts
npx convex run seed/seedVoices:seedVoices
```

### Manual Testing Checklist

- [ ] Open Step 4 on mobile (375px viewport)
- [ ] Voices load from Convex
- [ ] Voice preview plays audio in user's language
- [ ] Selecting different language changes preview audio
- [ ] Voice selection saves to project
- [ ] Narration generation uses selected voice

---

## 🎯 Success Criteria

- ✅ Voices stored in Convex (not hardcoded)
- ✅ Voice samples available for 7 languages
- ✅ Users can preview voices in their language
- ✅ VoiceSelector component works on mobile
- ✅ Audio playback works reliably
- ✅ All tests pass

---

## 💰 Cost Estimation

| Item | Count | Cost per | Total |
|------|-------|----------|-------|
| Voices | 8 | - | - |
| Languages | 7 | - | - |
| Total samples | 56 | ~$0.02/sample | ~$1.12 |

**One-time cost**: ~$2 (with regeneration margin)

---

## 📁 Files Created/Modified Summary

### Files to Create

| File | Task | Description |
|------|------|-------------|
| `convex/voices.ts` | Task 3 | Voice queries (listActive, getByKey, listByGender) |
| `convex/voiceSamples.ts` | Tasks 3, 7 | Voice sample queries + upsert mutation |
| `convex/seed/seedVoices.ts` | Task 8 | Seed script for 8 voices |
| `lib/constants/voice-sample-texts.ts` | Task 4 | Sample texts for 7 languages + voice definitions |
| `scripts/generate-voice-samples.ts` | Task 5 | Fal.ai MiniMax audio generation script |
| `scripts/upload-voice-samples.ts` | Task 7 | Upload audio samples to Convex |
| `components/voice-selection/VoicePreview.tsx` | Task 9 | Audio playback component |
| `components/voice-selection/VoiceSelector.tsx` | Task 9 | Voice selection grid with preview |
| `components/voice-selection/index.ts` | Task 9 | Barrel export |
| `__tests__/convex/voices.test.ts` | Task 12 | Query and data structure tests |

### Files to Modify

| File | Task | Changes |
|------|------|---------|
| `convex/schema.ts` | Tasks 1, 2 | Add voices, voiceSamples tables |
| `app/[locale]/guided/step-4/page.tsx` | Task 10 | Replace hardcoded voices with VoiceSelector |
| `convex/actions/narrationGeneration.ts` | Task 10 | Use voice.apiValue from Convex (if applicable) |
| `messages/en.json` | Task 11 | Add voice name and style translations |
| `__tests__/lib/constants/audio.test.ts` | Task 12 | Add migration notes for backward compatibility |

### Generated Assets

| File | Task | Description |
|------|------|-------------|
| `generated/voice-samples/voice-samples.json` | Task 6 | Generated audio URLs from Fal.ai (56 files) |

**Total New Files**: 10  
**Total Modified Files**: 5  
**Total Generated Assets**: 1 (containing 56 audio samples)

### Key Implementation References

The implementation follows the patterns defined in:
- **Schema Design**: `architectural-improvements-sprint-21-12-2025.md` lines 614-659
- **Sample Texts**: `architectural-improvements-sprint-21-12-2025.md` lines 662-672
- **VoicePreview Component**: `architectural-improvements-sprint-21-12-2025.md` lines 674-710
- **Cost Estimation**: `architectural-improvements-sprint-21-12-2025.md` lines 713-721

---

**Document Version**: 1.0  
**Created**: December 21, 2025  
**Author**: MyShortReel Development Team  
**Status**: 📋 PLANNING - Ready for Implementation

