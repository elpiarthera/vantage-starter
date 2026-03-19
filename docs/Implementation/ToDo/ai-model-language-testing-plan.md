# 🌍 AI Model Language Support Testing Plan

**Date**: December 19-20, 2025  
**Status**: ✅ TESTED - ALL LANGUAGES PASSED  
**Priority**: HIGH  
**Estimated Time**: 8-12 hours  
**Actual Time**: ~10 hours (implementation + testing)  
**Total Test Cost**: ~$3.15  
**Goal**: Verify native language support across all primary AI models  
**Dependencies**: Environment variables (FAL_KEY, OPENAI_API_KEY) configured  
**Reference**: Based on `sprint-6-implementation.md` structure

---

## 📊 Executive Summary

This implementation plan outlines the creation of dedicated test scripts to verify which languages are natively supported by the AI models used in MyShortReel. This is critical for ensuring our 7-language support (EN, FR, DE, IT, ES, PT, RU) works correctly across all AI-powered features.

### **🚀 Key Implementation: Full Pipeline Testing**

Tests run in **REAL APP FLOW ORDER**, passing actual generated data between steps:

```
Step 1: Text Generation (GPT) → Story + Scenes + Narration Script + Music Prompt
        ↓ (uses generated story & scenes)
Step 2: Image Generation (Nano Banana Pro) → Scene Images
        ↓ (uses generated images as first/last frames)
Step 3: Video Generation (Kling Video) ⚠️ CRITICAL
        ↓ (uses generated narration script)
Step 4a: Narration (MiniMax TTS) → Audio
        ↓ (uses generated music prompt)
Step 4b: Music (Stable Audio) → Background Music
```

**Each step uses REAL DATA from the previous step** - this is a true end-to-end integration test, not isolated unit tests.

### **Target Languages to Verify**

| Code | Language | Flag | ISO 639-1 |
|------|----------|------|-----------|
| `en` | English | 🇺🇸 | en |
| `fr` | French | 🇫🇷 | fr |
| `de` | German | 🇩🇪 | de |
| `it` | Italian | 🇮🇹 | it |
| `es` | Spanish | 🇪🇸 | es |
| `pt` | Portuguese | 🇧🇷 | pt |
| `ru` | Russian | 🇷🇺 | ru |

### **Models to Test (Primary Only)**

| Category | Model ID | Provider | Purpose |
|----------|----------|----------|---------|
| **Text Generation** | `gpt-4o-mini` | OpenAI | Current production model |
| **Text Generation** | `gpt-5-mini` | OpenAI | Compare quality vs cost |
| **Image Generation** | `fal-ai/nano-banana-pro` | Fal.ai (Gemini 3) | Text-to-image frames |
| **Video Generation** | `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` | Fal.ai (Kling) | Scene video clips |
| **Narration (TTS)** | `fal-ai/minimax/speech-2.6-hd` | Fal.ai (MiniMax) | Text-to-speech voiceovers |
| **Music Generation** | `fal-ai/stable-audio-25/text-to-audio` | Fal.ai (Stable Audio) | Background music |

> **Text Generation Model Comparison** (Standard pricing per 1M tokens):
> | Model | Input | Output | Notes |
> |-------|-------|--------|-------|
> | `gpt-4o-mini` | $0.15 | $0.60 | Current production, excellent multilingual |
> | `gpt-5-mini` | $0.25 | $2.00 | Newer model, potentially better quality |
> 
> Testing both to evaluate if quality improvements justify the ~1.6x input / ~3.3x output cost increase.

---

## 🎯 TEST RESULTS (December 19-20, 2025)

### **✅ All Languages Successfully Tested**

| Language | Text Gen | Image Gen | Video Gen | Narration | Music | Report |
|----------|----------|-----------|-----------|-----------|-------|--------|
| 🇫🇷 French | ✅ GPT-4o-mini + GPT-5-mini | ✅ | ✅ | ✅ | ✅ | `REPORT-FR-*.md` (x2) |
| 🇩🇪 German | ✅ GPT-4o-mini | ✅ | ✅ | ✅ | ✅ | `REPORT-DE-4om-2025-12-20.md` |
| 🇮🇹 Italian | ✅ GPT-4o-mini | ✅ | ✅ | ✅ | ✅ | `REPORT-IT-4om-2025-12-20.md` |
| 🇪🇸 Spanish | ✅ GPT-4o-mini | ✅ | ✅ | ✅ | ✅ | `REPORT-ES-4om-2025-12-20.md` |
| 🇧🇷 Portuguese | ✅ GPT-4o-mini | ✅ | ✅ | ✅ | ✅ | `REPORT-PT-4om-2025-12-20.md` |
| 🇷🇺 Russian | ✅ GPT-4o-mini | ✅ | ✅ | ✅ | ✅ | `REPORT-RU-4om-2025-12-20.md` |

### **Key Findings**

#### ✅ **Kling Video - PASSED (Critical Test)**
- **Result**: Successfully processed prompts in ALL languages including Cyrillic (Russian)
- **Finding**: Kling Video understands non-English prompts even though they bypass GPT
- **Recommendation**: No changes needed - continue using user's language directly

#### ✅ **MiniMax TTS - PASSED**
- **Result**: Correct pronunciation with `language_boost` parameter set
- **French Example**: "Laurent et Laurence" pronounced with French phonetics
- **Russian Example**: Cyrillic text handled correctly
- **Recommendation**: Always set `language_boost` to match content language

#### ✅ **GPT-4o-mini vs GPT-5-mini Comparison**
| Aspect | GPT-4o-mini | GPT-5-mini |
|--------|-------------|------------|
| **Latency** | ~7s | ~3s (faster) |
| **Output Style** | More elaborate, poetic | More concise, direct |
| **Word Count** | ~94 words | ~54 words |
| **Quality** | Excellent | Excellent |
| **Cost (1M tokens)** | $0.15 in / $0.60 out | $0.25 in / $2.00 out |
| **Recommendation** | ✅ Keep as default | Consider for speed-critical flows |

#### ✅ **Image & Music Generation - PASSED**
- Nano Banana Pro: Processed scene descriptions in all languages
- Stable Audio 2.5: Processed music prompts in all languages
- Both receive GPT-enhanced prompts, so language support was expected

### **Test Metrics**

| Language | Total Time | Est. Cost | Session ID |
|----------|------------|-----------|------------|
| 🇫🇷 French (4o-mini) | 228.6s | $0.45 | fr-1766147451476 |
| 🇫🇷 French (5-mini) | 167.8s | $0.45 | fr-5m-1766148571490 |
| 🇩🇪 German | 171.3s | $0.45 | de-4om-1766234747339 |
| 🇮🇹 Italian | 178.6s | $0.45 | it-4om-1766235159047 |
| 🇪🇸 Spanish | 176.5s | $0.45 | es-4om-1766235781503 |
| 🇧🇷 Portuguese | 187.1s | $0.45 | pt-4om-1766236560398 |
| 🇷🇺 Russian | 173.7s | $0.45 | ru-4om-1766236891504 |
| **TOTAL** | ~21 min | **~$3.15** | - |

### **Conclusion**

**🎉 ALL AI MODELS SUPPORT ALL 7 PLANNED LANGUAGES**

No blocking issues found. The MyShortReel application can confidently support:
- 🇺🇸 English (baseline)
- 🇫🇷 French
- 🇩🇪 German
- 🇮🇹 Italian
- 🇪🇸 Spanish
- 🇧🇷 Portuguese
- 🇷🇺 Russian

---

## 🔍 PROMPT FLOW ANALYSIS (Critical Findings)

Based on codebase analysis, here's how prompts flow to each AI model:

### **Prompt Flow by Model**

| Step | Feature | System Prompt | User Content | GPT Enhancement | Critical |
|------|---------|---------------|--------------|-----------------|----------|
| **Step 1** | Story Generation | EN (STORY_GENERATION_PROMPT) | User's language | ✅ Via GPT | Normal |
| **Step 2** | AI Chat Refinement | EN (AI_DIRECTOR_PROMPT) | User's language | ✅ Via GPT | Normal |
| **Step 3** | Image Generation | EN (IMAGE_ENHANCEMENT_PROMPT) | User's description | ✅ GPT enhances | Normal |
| **Step 3** | Video Generation | N/A (direct prompt) | User's sceneDescription + emotionalStory | ❌ **NO GPT** | ⚠️ **CRITICAL** |
| **Step 4** | Narration Script | EN (NARRATION_SCRIPT_PROMPT) | Output in `${language}` | ✅ Via GPT | Normal |
| **Step 4** | TTS | N/A | Script in user's language | N/A (direct text) | ⚠️ Pronunciation |
| **Step 4** | Music | EN (MUSIC_ENHANCEMENT_PROMPT) | User's musicPrompt | ✅ Via GPT | Normal |

### **⚠️ Critical Finding: Video Generation**

**Video prompts go DIRECTLY to Kling Video WITHOUT GPT enhancement!**

```
VIDEO_GENERATION_PROMPT.buildPrompt():
  sceneDescription (French) + emotionalStory (French) + occasion + theme
  → Direct prompt → fal.ai Kling Video
```

This means if a French user describes their scene in French, Kling Video receives French prompts directly. We MUST test if Kling understands non-English prompts.

### **Test Scenarios**

For each model, we test TWO scenarios to reflect real user behavior:

| Scenario | Description | Example |
|----------|-------------|---------|
| **A: Mixed Language** | EN system prompts + FR user content (current production behavior) | System: "Create a wedding video" + User: "Laurent et Laurence célèbrent leur amour" |
| **B: Full Target Language** | Everything in FR (to test if quality improves) | "Créez une vidéo de mariage romantique pour Laurent et Laurence" |

### **Real Test Case: Wedding Announcement**

All tests use a realistic wedding announcement scenario:

| Field | English | French |
|-------|---------|--------|
| **Occasion** | Wedding Announcement | Annonce de mariage |
| **Names** | Laurent & Laurence | Laurent & Laurence |
| **Emotion/Theme** | Romantic Warmth | Chaleur Romantique |
| **Visual Style** | Cinematic | Cinématique |
| **Personal Story** | "We met in Paris under the Eiffel Tower and knew it was destiny..." | "Nous nous sommes rencontrés à Paris sous la Tour Eiffel et nous savions que c'était le destin..." |

---

## 📁 IMPLEMENTED FILES

### **Directory Structure**

```
tests/ai-language-support/
├── results/                          # Generated test results & pipeline data
│   └── pipeline-{lang}.json          # Per-language pipeline state
├── common.ts                         # Shared utilities, test data, language configs
├── pipeline-data.ts                  # Pipeline state management between steps
├── run-full-pipeline.ts              # 🚀 MAIN: Full end-to-end pipeline orchestrator
├── test-text-generation.ts           # GPT-4o-mini vs GPT-5-mini comparison
├── test-image-generation.ts          # Nano Banana Pro image generation
├── test-video-generation.ts          # Kling Video generation (uses images)
├── test-narration.ts                 # MiniMax TTS pronunciation testing
└── test-music-generation.ts          # Stable Audio music generation
```

### **NPM Scripts (package.json)**

```json
{
  "scripts": {
    "test:lang:text": "tsx tests/ai-language-support/test-text-generation.ts",
    "test:lang:image": "tsx tests/ai-language-support/test-image-generation.ts",
    "test:lang:video": "tsx tests/ai-language-support/test-video-generation.ts",
    "test:lang:narration": "tsx tests/ai-language-support/test-narration.ts",
    "test:lang:music": "tsx tests/ai-language-support/test-music-generation.ts",
    "test:lang:pipeline": "tsx tests/ai-language-support/run-full-pipeline.ts"
  }
}
```

---

## ⏱️ TIME TRACKING

| Task | Estimated | Status | Notes |
|------|-----------|--------|-------|
| Task 0: Directory & Common Utils Setup | 0.5h | ✅ DONE | `common.ts` created |
| Task 1: Text Generation Test Script | 1.5h | ✅ DONE | GPT-4o-mini vs GPT-5-mini |
| Task 2: Image Generation Test Script | 1h | ✅ DONE | Saves URLs for video test |
| Task 3: Video Generation Test Script | 1.5h | ✅ DONE | Uses images from Step 2 |
| Task 4: Narration Test Script | 1.5h | ✅ DONE | Pronunciation verification |
| Task 5: Music Generation Test Script | 1h | ✅ DONE | Stable Audio 2.5 |
| Task 6: Pipeline Orchestrator | 1.5h | ✅ DONE | `run-full-pipeline.ts` |
| Task 7: Pipeline Data Management | 0.5h | ✅ DONE | `pipeline-data.ts` |
| **TOTAL** | **9h** | ✅ DONE | - |

---

## 🎯 USAGE GUIDE

### **Recommended: Full Pipeline Test**

Run the complete end-to-end test with real data flowing between steps:

```bash
# Test French with GPT-4o-mini (default)
npx tsx tests/ai-language-support/run-full-pipeline.ts --lang=fr

# Test French with GPT-5-mini (for comparison)
npx tsx tests/ai-language-support/run-full-pipeline.ts --lang=fr --model=gpt-5-mini

# Skip expensive video generation (saves ~$0.35)
npx tsx tests/ai-language-support/run-full-pipeline.ts --lang=fr --skip-video

# Test German with GPT-5-mini
npx tsx tests/ai-language-support/run-full-pipeline.ts --lang=de --model=gpt-5-mini
```

### **CLI Options**

| Flag | Description | Example |
|------|-------------|---------|
| `--lang=XX` | Target language code | `--lang=fr`, `--lang=de` |
| `--model=XX` | Text generation model | `--model=gpt-4o-mini` (default), `--model=gpt-5-mini` |
| `--skip-video` | Skip video generation (saves $0.35) | |
| `--skip-music` | Skip music generation | |
| `--only=step` | Run only specific step | `--only=text`, `--only=narration` |

### **Pipeline Features**

- **Resumable**: If interrupted, re-run the same command - it picks up from the last completed step
- **Model-Specific State**: Each model gets its own state file: `results/pipeline-{lang}-{model}.json`
- **Real Data**: Each step uses outputs from previous steps, not mock data
- **Cost Control**: Use `--skip-video` and `--skip-music` flags to reduce costs
- **Comprehensive Report**: Generates a Markdown report with all prompts, outputs, and links

### **GPT-4o-mini vs GPT-5-mini Comparison**

To compare both text generation models for the same language:

```bash
# Run French with GPT-4o-mini (default)
npx tsx tests/ai-language-support/run-full-pipeline.ts --lang=fr

# Run French with GPT-5-mini
npx tsx tests/ai-language-support/run-full-pipeline.ts --lang=fr --model=gpt-5-mini

# Compare the generated reports
cat tests/ai-language-support/results/REPORT-FR-4om-*.md | grep "Generated Story" -A 3
cat tests/ai-language-support/results/REPORT-FR-5m-*.md | grep "Generated Story" -A 3
```

**Expected Differences**:
| Aspect | GPT-4o-mini | GPT-5-mini |
|--------|-------------|------------|
| Latency | ~5-8s | ~2-4s (faster) |
| Output Style | More elaborate | More concise |
| Cost (1M tokens) | $0.15 in / $0.60 out | $0.25 in / $2.00 out |

### **Individual Tests (Optional)**

For debugging or re-running specific steps:

```bash
# Text generation only (GPT comparison)
npm run test:lang:text -- --lang=fr

# Image generation only
npm run test:lang:image -- --lang=fr

# Video generation (requires images from image test!)
npm run test:lang:video -- --lang=fr

# Narration only
npm run test:lang:narration -- --lang=fr

# Music only
npm run test:lang:music -- --lang=fr
```

⚠️ **Important**: Video generation REQUIRES images from the image generation step. Always run image generation first if testing video separately.

---

## 🔧 IMPLEMENTATION DETAILS

### **Task 0: Common Utilities (`common.ts`)**

**Purpose**: Shared utilities for all test scripts.

**Key Exports**:
- `TARGET_LANGUAGES` - Array of 7 supported languages with codes, names, flags, ISO codes
- `WEDDING_TEST_CASE` - Real test data in all 7 languages (occasion, story, scenes, narration, music)
- `getTargetLanguage()` - Parse `--lang=` CLI argument
- `getLanguagesToTest()` - Returns languages based on CLI arg
- `getTestScenarios(lang)` - Returns "mixed" and "full" scenario configs
- `getApiKeys()` - Load API keys from environment
- `validateApiKey()` - Validate API key exists
- `saveResults()` - Save test results to JSON
- `printSummary()` - Print formatted test summary
- `calculateSummary()` - Calculate aggregate statistics
- `generateRecommendation()` - Generate recommendation based on scores
- `assessLanguageQuality()` - Heuristic language detection for quality scoring
- `MINIMAX_LANGUAGE_CONFIG` - TTS language boost settings per language

**Wedding Test Case Structure** (per language):
```typescript
{
  occasion: "Wedding Announcement",
  eventTitle: "Laurent & Laurence Wedding",
  theme: "Romantic Warmth",
  visualStyle: "Cinematic",
  personalStory: "We met in Paris under the Eiffel Tower...",
  sceneDescriptions: [
    "Opening scene: Soft morning light...",
    "Main scene: Laurent and Laurence walking...",
    "Closing scene: The couple embracing..."
  ],
  narrationScript: "Five years ago, under the Parisian sky...",
  musicPrompt: "Romantic piano and strings, elegant wedding..."
}
```

---

### **Task 1: Pipeline Data Management (`pipeline-data.ts`)**

**Purpose**: Manages state and data flow between pipeline steps.

**Key Features**:
- `PipelineData` interface - Complete pipeline state
- `initPipeline()` - Start new test session
- `loadPipelineData()` - Resume existing session
- `savePipelineData()` - Persist state after each step
- `saveTextGenerationResult()` - Save Step 1 output
- `saveImageGenerationResult()` - Save Step 2 output
- `saveVideoGenerationResult()` - Save Step 3 output
- `saveNarrationResult()` - Save Step 4a output
- `saveMusicResult()` - Save Step 4b output
- `canRunStep()` - Check if step dependencies are met
- `printPipelineStatus()` - Show current pipeline state

**Pipeline Data Structure**:
```typescript
interface PipelineData {
  testSessionId: string;
  startedAt: string;
  updatedAt: string;
  language: LanguageCode;
  
  textGeneration?: {
    generatedStory: string;
    generatedScenes: string[];
    narrationScript: string;
    musicPrompt: string;
  };
  
  imageGeneration?: {
    images: Array<{ sceneIndex: number; url: string; prompt: string }>;
  };
  
  videoGeneration?: {
    videos: Array<{ url: string; firstFrameUrl: string; lastFrameUrl: string }>;
  };
  
  narration?: {
    audioUrl: string;
    script: string;
    duration: number;
  };
  
  music?: {
    audioUrl: string;
    prompt: string;
    duration: number;
  };
}
```

---

### **Task 2: Full Pipeline Orchestrator (`run-full-pipeline.ts`)**

**Purpose**: Main script that runs all tests in real app flow order.

**Execution Flow**:

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: TEXT GENERATION (GPT-4o-mini)                          │
│  Input: Wedding test case (occasion, theme, personal story)     │
│  Output: generatedStory, generatedScenes[], narrationScript,    │
│          musicPrompt                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │ uses generatedScenes
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: IMAGE GENERATION (Nano Banana Pro)                     │
│  Input: Scene descriptions from Step 1                          │
│  Output: Array of image URLs (3 images for 3 scenes)            │
└────────────────────────────┬────────────────────────────────────┘
                             │ uses image URLs as first/last frames
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: VIDEO GENERATION (Kling Video) ⚠️ CRITICAL             │
│  Input: First image URL, last image URL, scene prompt           │
│  Output: Video URL                                              │
│  ⚠️ Prompt goes DIRECTLY to Kling - no GPT enhancement!        │
└────────────────────────────┬────────────────────────────────────┘
                             │ parallel execution possible
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4a: NARRATION (MiniMax TTS)                               │
│  Input: narrationScript from Step 1, language_boost setting     │
│  Output: Audio URL                                              │
│  ⚠️ Verify French pronunciation with French phonetics!         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  STEP 4b: MUSIC GENERATION (Stable Audio 2.5)                   │
│  Input: musicPrompt from Step 1                                 │
│  Output: Audio URL (30s background music)                       │
└─────────────────────────────────────────────────────────────────┘
```

**CLI Options**:
- `--lang=fr` - Target language (default: fr)
- `--model=gpt-5-mini` - Use GPT-5-mini instead of default GPT-4o-mini
- `--skip-video` - Skip video generation (saves $0.35)
- `--skip-music` - Skip music generation
- `--only=text|image|video|narration|music` - Run only specific step

---

### **Task 3: Text Generation Test (`test-text-generation.ts`)**

**Purpose**: Compare GPT-4o-mini vs GPT-5-mini for multilingual story generation.

**Key Features**:
- Tests both models with same prompts
- Two scenarios per language: Mixed (EN system + target content) and Full (all target language)
- Quality scoring based on language detection heuristics
- Model comparison table with cost analysis
- Final recommendation based on quality vs cost

**System Prompts**: Translated into all 7 languages for "Full" scenario testing.

**Output**:
- Per-model, per-language JSON results
- Quality scores (1-10)
- Latency measurements
- Sample outputs
- Recommendations

---

### **Task 4: Image Generation Test (`test-image-generation.ts`)**

**Purpose**: Test Nano Banana Pro with scene descriptions in target languages.

**Key Features**:
- Uses scene descriptions from wedding test case
- Saves generated image URLs for video test consumption
- Two scenarios: Mixed and Full language
- Stores URLs in `results/generated-images.json`

**Integration Point**: Video test reads image URLs from this file.

---

### **Task 5: Video Generation Test (`test-video-generation.ts`)** ⚠️ CRITICAL

**Purpose**: Test Kling Video's ability to understand non-English prompts.

**Why Critical**:
- Prompts bypass GPT enhancement entirely
- User's French description goes directly to Kling
- If Kling doesn't understand French, video quality will suffer

**Key Features**:
- Reads image URLs from image generation test (required dependency)
- Falls back to placeholder image if no generated images found
- Builds prompts exactly like production code (`VIDEO_GENERATION_PROMPT.buildPrompt()`)
- Uses first image as start frame, last image as end frame
- 5-second videos to minimize cost (~$0.35 each)

**Prompt Construction** (matches production):
```typescript
let prompt = sceneDescription.trim();  // ← User's language!
prompt += ` Emotional context: ${emotionalStory}.`;  // ← User's language!
prompt += ` This is for a ${occasion} video.`;
prompt += ` The overall mood is ${theme}.`;
prompt += ` Visual style: ${visualStyle}.`;
prompt += " Quick, dynamic pacing suitable for a 5-second clip.";
prompt += " High quality, professional production.";
```

---

### **Task 6: Narration Test (`test-narration.ts`)** ⚠️ PRONUNCIATION

**Purpose**: Test MiniMax TTS pronunciation quality for non-English text.

**Why Critical**:
- French text MUST use French phonetics, not English
- "Laurent" should sound like "Loh-rahn" not "Law-rent"
- Uses `language_boost` parameter to set pronunciation rules

**Key Features**:
- Uses narration script from wedding test case
- Sets correct `language_boost` per language
- Cleans script for TTS (removes stage directions)
- Outputs audio URL for manual pronunciation verification

**Language Boost Settings**:
```typescript
{
  en: { languageBoost: "English", voiceId: "Wise_Woman" },
  fr: { languageBoost: "French", voiceId: "Wise_Woman" },
  de: { languageBoost: "German", voiceId: "Wise_Woman" },
  it: { languageBoost: "Italian", voiceId: "Wise_Woman" },
  es: { languageBoost: "Spanish", voiceId: "Wise_Woman" },
  pt: { languageBoost: "Portuguese", voiceId: "Wise_Woman" },
  ru: { languageBoost: "Russian", voiceId: "Wise_Woman" },
}
```

**Manual Verification Required**:
- Listen to generated audio
- Verify French names pronounced with French phonetics
- Check accents (é, è, ê) handled correctly
- Confirm natural speech cadence for language

---

### **Task 7: Music Generation Test (`test-music-generation.ts`)**

**Purpose**: Test Stable Audio 2.5 with music prompts in target languages.

**Key Features**:
- Uses music prompt from wedding test case
- 30-second audio generation
- Lower priority (music prompts are descriptive, less language-sensitive)

---

## 🔍 QA PROCESS

### **2-Step QA for All Scripts**

After any code changes, run:

```bash
# Step 1: TypeScript type checking
npx tsc --noEmit --skipLibCheck tests/ai-language-support/*.ts

# Step 2: Biome linting and formatting
npx biome check --apply tests/ai-language-support/
```

Both commands must pass with exit code 0.

---

## 📋 PRE-TESTING CHECKLIST

Before running tests, verify:

- [ ] **FAL_KEY is set** in `.env.local`
- [ ] **OPENAI_API_KEY is set** in `.env.local`
- [ ] **fal.ai credits balance** ≥ $10 (for image/video/audio tests)
- [ ] **OpenAI credits balance** ≥ $5 (for text generation tests)
- [ ] **tsx is installed**: `pnpm add -D tsx` (TypeScript execution)
- [ ] **dotenv is installed**: `pnpm add -D dotenv`

```bash
# Verify environment
grep "FAL_KEY=" .env.local
grep "OPENAI_API_KEY=" .env.local

# Install dependencies if needed
pnpm add -D tsx dotenv
```

---

## 💰 COST ESTIMATION

### **Per Language (Full Pipeline)**

| Step | Model | Estimated Cost |
|------|-------|----------------|
| Text Generation | GPT-4o-mini | ~$0.01 |
| Text Generation | GPT-5-mini | ~$0.02 |
| Image Generation | Nano Banana Pro (3 images) | ~$0.03 |
| Video Generation | Kling Video (5s) | ~$0.35 |
| Narration | MiniMax TTS | ~$0.02 |
| Music | Stable Audio (30s) | ~$0.05 |
| **TOTAL (with video)** | - | **~$0.48** |
| **TOTAL (skip video)** | - | **~$0.13** |

### **Full Test Suite (7 Languages)**

| Scenario | Cost |
|----------|------|
| All languages, all models | ~$3.36 |
| All languages, skip video | ~$0.91 |
| French only, all models | ~$0.48 |
| French only, skip video | ~$0.13 |

---

## 📊 EXPECTED RESULTS

Based on the models' documentation and prompt flow analysis:

| Model | GPT Pre-processing | Expected Language Support | Risk Level |
|-------|-------------------|---------------------------|------------|
| **GPT-4o-mini** | N/A (IS the processor) | ✅ Excellent - 50+ languages | Low |
| **GPT-5-mini** | N/A (IS the processor) | ✅ Excellent - Improved multilingual | Low |
| **Nano Banana Pro** | ✅ GPT enhances prompts | ✅ Good - Receives English prompts | Low |
| **Kling Video** | ❌ **NO GPT processing** | ⚠️ Unknown - Receives raw user language | **HIGH** |
| **MiniMax Speech 2.6** | ✅ GPT generates script | ✅ Good - Uses language_boost param | Medium (pronunciation) |
| **Stable Audio 2.5** | ✅ GPT enhances prompts | ⚠️ Unknown - Music prompts descriptive | Low |

### **Critical Risk: Kling Video**

Kling Video is the **highest risk** model because:
1. Prompts bypass GPT enhancement entirely
2. User's French description goes directly to Kling
3. Kling was primarily trained on English prompts
4. If Kling doesn't understand French, video quality will suffer

**Test Priority Order:**
1. 🔴 **Kling Video** (Critical - bypasses GPT)
2. 🟡 **MiniMax TTS** (Medium - pronunciation quality)
3. 🟢 **Text Generation** (Low risk - GPT is multilingual)
4. 🟢 **Image Generation** (Low risk - GPT pre-processes)
5. 🟢 **Music Generation** (Low risk - descriptive prompts)

---

## 🎯 SUCCESS CRITERIA

### **Per-Model Criteria**

| Model | Metric | Target | Acceptable | Blocking Issue |
|-------|--------|--------|------------|----------------|
| **GPT-4o-mini** | Quality Score | ≥ 8/10 | ≥ 6/10 | < 5/10 |
| **GPT-5-mini** | Quality Score | ≥ 8/10 | ≥ 6/10 | < 5/10 |
| **Kling Video** | Generation Success | 100% | ≥ 80% | < 50% → Use EN prompts only |
| **MiniMax TTS** | Pronunciation Quality | ≥ 8/10 | ≥ 6/10 | < 5/10 → Wrong lang phonetics |
| **Nano Banana Pro** | Generation Success | 100% | ≥ 90% | < 80% |
| **Stable Audio** | Generation Success | 100% | ≥ 90% | < 80% |

### **Scenario Comparison Criteria**

| Comparison | Decision |
|------------|----------|
| Full FR score > Mixed + 1.0 | Recommend translating system prompts |
| Full FR score ≈ Mixed (±0.5) | Keep current mixed approach |
| Full FR score < Mixed - 1.0 | Keep English system prompts |

### **Blocking Issues (Stop & Investigate)**

- ❌ Kling Video fails to generate any video with French prompts
- ❌ MiniMax TTS uses English pronunciation for French text
- ❌ Any model returns errors for all target language requests

---

## 📝 MANUAL VERIFICATION CHECKLIST

After running the full pipeline, manually verify:

### **Narration Pronunciation**

- [ ] **French**: 'Laurent et Laurence' pronounced with French phonetics (not English)
- [ ] **German**: Umlauts and compound words pronounced correctly  
- [ ] **Italian**: Double consonants and vowel lengths correct
- [ ] **Spanish**: R sounds and ñ pronunciation correct
- [ ] **Portuguese**: Nasal vowels and soft consonants correct
- [ ] **Russian**: Stress patterns and soft consonants correct

### **Video Quality**

- [ ] Video matches the prompt intent
- [ ] Motion is smooth and natural
- [ ] Visual style matches "Cinematic"
- [ ] Content is appropriate for wedding theme

### **Generated Content**

- [ ] Story is emotionally resonant
- [ ] Scenes match the personal story
- [ ] Music matches the romantic theme

---

## 📚 REFERENCES

- [AI Models Overview](../Understanding/ai-models-overview.md)
- [Translation Implementation Strategy](../Guides/translation-implementation-strategy.md)
- [VIDEO_GENERATION_PROMPT](../../../lib/ai/prompts/video/generation.prompt.ts)
- [NARRATION_SCRIPT_PROMPT](../../../lib/ai/prompts/audio/narration-script.prompt.ts)
- [fal.ai API Documentation](https://docs.fal.ai)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [MiniMax Speech API](https://fal.ai/models/fal-ai/minimax/speech-2.6-hd/api)

---

## 📂 OUTPUT FILES

After running the full pipeline:

```
tests/ai-language-support/results/
├── pipeline-fr-gpt-4o-mini.json              # Pipeline state for French + GPT-4o-mini
├── pipeline-fr-gpt-5-mini.json               # Pipeline state for French + GPT-5-mini
├── pipeline-de-gpt-4o-mini.json              # Pipeline state for German + GPT-4o-mini
├── REPORT-FR-4om-2025-12-19.md               # 📄 Comprehensive report (GPT-4o-mini)
├── REPORT-FR-5m-2025-12-19.md                # 📄 Comprehensive report (GPT-5-mini)
├── generated-images.json                     # Image URLs for video consumption
└── ... (individual step results)
```

### **Comprehensive Report Contents**

Each report (`REPORT-{LANG}-{MODEL}-{DATE}.md`) includes:

| Section | Contents |
|---------|----------|
| **Summary Table** | All models, status, latency, estimated costs |
| **Step 1: Text** | Full system prompt, user prompt, generated story/scenes/narration/music |
| **Step 2: Image** | Each scene prompt (in target language), image URLs, embedded previews |
| **Step 3: Video** | ⚠️ Full prompt sent to Kling (CRITICAL), video URL, first/last frames |
| **Step 4a: Narration** | TTS script, language boost setting, audio URL, pronunciation checklist |
| **Step 4b: Music** | Music prompt, audio URL (30s), review checklist |
| **Final Review** | Language support assessment checklist |

**Example Report Excerpt**:
```markdown
## 🎬 Step 3: Video Generation ⚠️ CRITICAL

**⚠️ This prompt bypasses GPT - sent directly to Kling Video!**

**Full Prompt Sent to Kling (FR)**:
> Vue panoramique de la Tour Eiffel au coucher du soleil...

**Generated Video**: [▶️ Watch Video](https://v3b.fal.media/...)
```

---

**Document Version**: 5.0  
**Created**: December 19, 2025  
**Last Updated**: December 20, 2025  
**Author**: MyShortReel Development Team

### **Changelog**
- **v5.0** (2025-12-20): ✅ **ALL TESTS COMPLETE** - Added comprehensive test results section with findings for all 7 languages, GPT model comparison results, test metrics, and final conclusion confirming full language support
- **v4.0** (2025-12-19): Added `--model` flag for GPT-4o-mini vs GPT-5-mini comparison, comprehensive Markdown report generation with all prompts/outputs/links, model-specific pipeline data files, fixed music duration (30s via `seconds_total` param), added latency and cost tracking per step
- **v3.0** (2025-12-19): Complete rewrite with full pipeline implementation, real app flow order, pipeline data management, dependency handling between steps, correct `npx` commands, 2-step QA process (noEmit + Biome)
- **v2.0** (2025-12-19): Major update with accurate prompt flow analysis, real wedding test case, two-scenario testing (Mixed/Full), critical video generation findings, and TTS pronunciation testing
- **v1.0** (2025-12-19): Initial plan with basic language testing structure
