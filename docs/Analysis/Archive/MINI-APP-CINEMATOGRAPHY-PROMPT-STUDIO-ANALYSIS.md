# 🎬 Mini App: Cinematography Prompt Studio + Kling 3.0 - Implementation Analysis

**Source Repository**: [DirectorsConsole](https://github.com/NickPittas/DirectorsConsole) (Cinema Prompt Engineering Engine)  
**Target Model**: [Kling 3.0](https://fal.ai/models/fal-ai/kling-video/v3/pro/text-to-video) via FAL.ai  
**Date**: February 10, 2026  
**Status**: Analysis Complete

---

## Executive Summary

The **Cinematography Prompt Studio** is a new mini-app that combines DirectorsConsole's **Cinema Prompt Engineering (CPE) engine** with **Kling 3.0's native cinematic understanding** to create a structured, film-quality video generation tool.

**Architecture Quality**: DirectorsConsole CPE is Python/Pydantic (needs TS port); patterns are excellent  
**Tech Stack Alignment**: ⚠️ **Requires Port** - Python → TypeScript, FastAPI → Convex actions, local → cloud  
**Estimated Integration Time**: **35-55 hours** (CPE port + Kling 3.0 integration + UI)  
**Complexity Level**: ⭐⭐⭐⭐ **High** - Rules engine port + multi-shot orchestration + new FAL endpoints

> ✅ **Strategic Differentiator**: No other consumer video tool offers structured cinematography presets with validated camera/lens/lighting rules feeding directly into a model that natively understands cinematic language. This is a unique competitive advantage.

---

## Why This Combination Works

### The Perfect Match

Kling 3.0 is explicitly designed to understand **cinematic intent** — shot language, camera movements, multi-shot sequences, character consistency, and dialogue direction. DirectorsConsole's CPE engine generates exactly this kind of structured cinematography prompt.

| DirectorsConsole CPE Provides | Kling 3.0 Understands Natively |
|------|------|
| Shot size (close-up, wide, profile, macro) | ✅ Multi-shot with labeled shots (up to 6 per generation) |
| Camera movement (tracking, pan, dolly, crane) | ✅ Explicit motion instructions with smooth execution |
| Lens/composition rules (focal length, DOF) | ✅ Framing and composition intent |
| Film presets (Blade Runner, Ghibli, Barry Lyndon) | ✅ Style/mood/tone direction |
| Character definitions with traits | ✅ Element consistency across shots |
| Dialogue direction + tone labels | ✅ Native audio with voice binding |
| Lighting setups (3-point, noir, golden hour) | ✅ Scene atmosphere and mood |
| Era-accurate constraints (vintage gear, period lighting) | ✅ Historical/stylistic coherence |

### Kling 3.0 Key Capabilities (from FAL.ai)

| Feature | Specification | Impact on Mini-App |
|---------|---------------|-------------------|
| **Multi-Shot Generation** | Up to 6 shots per generation | Maps 1:1 to CPE storyboard panels |
| **Duration** | 3-15 seconds per clip | Flexible scene timing |
| **Native Audio** | Dialogue, SFX, ambient sound | Character voice binding from CPE |
| **Character Consistency** | Elements reusable across shots | CPE character definitions persist |
| **Image-to-Video** | Anchor from reference image | Use generated keyframes as anchors |
| **Video Editing** | Background swap, subject modification | Post-generation refinement |
| **4K Image Generation** | Kling Image 3.0 | High-quality keyframe generation |
| **Motion Control** | Clean fast-paced motion | CPE camera movements execute cleanly |

### FAL.ai Endpoints Required

| Endpoint | Purpose | Model ID |
|----------|---------|----------|
| **Kling 3.0 Pro T2V** | Multi-shot text-to-video (primary) | `fal-ai/kling-video/v3/pro/text-to-video` |
| **Kling 3.0 Pro I2V** | Image-anchored video generation | `fal-ai/kling-video/v3/pro/image-to-video` |
| **Kling 3.0 Standard T2V** | Cost-effective text-to-video | `fal-ai/kling-video/v3/standard/text-to-video` |
| **Kling 3.0 Standard I2V** | Cost-effective image-to-video | `fal-ai/kling-video/v3/standard/image-to-video` |
| **Kling O3 Pro T2V** | Highest-quality storyboard generation | `fal-ai/kling-video/o3/pro/text-to-video` |
| **Kling O3 Pro Ref2V** | Reference-conditioned video | `fal-ai/kling-video/o3/pro/reference-to-video` |
| **Kling O3 V2V Edit** | Post-generation video editing | `fal-ai/kling-video/o3/pro/video-to-video/edit` |
| **Kling Image 3.0 T2I** | 4K keyframe generation | `fal-ai/kling-image/v3/text-to-image` |
| **Kling Image 3.0 I2I** | Keyframe editing/refinement | `fal-ai/kling-image/v3/image-to-image` |

---

## Feature Overview

### ✅ Core Features (MVP)

#### 1. Film Preset Selector
- **What**: Curated cinematography presets inspired by iconic films and animation styles
- **Source**: DirectorsConsole CPE `presets/` directory (Python → TS port)
- **Examples**: Blade Runner (neon noir), Barry Lyndon (natural light), Ghibli (hand-painted), Spider-Verse (mixed media), Wes Anderson (symmetry), Christopher Nolan (IMAX), Terrence Malick (golden hour)
- **Each preset defines**: camera body, lens family, aspect ratio, lighting philosophy, color grade, movement style, mood palette, era constraints
- **User experience**: Visual cards with film stills, one-click to apply full "camera package"

#### 2. Structured Cinematography Prompt Builder
- **What**: Step-by-step prompt composition using real cinematography parameters
- **Source**: DirectorsConsole CPE `PromptGenerator` + validation rules
- **Parameters**:
  - **Shot Size**: Extreme wide, wide, medium, close-up, extreme close-up, macro
  - **Camera Movement**: Static, pan, tilt, dolly, crane, Steadicam, handheld, tracking, zoom
  - **Composition**: Rule of thirds, symmetrical, Dutch angle, over-the-shoulder, POV
  - **Lighting**: Three-point, Rembrandt, noir, silhouette, golden hour, practical, motivated
  - **Lens**: Wide-angle, normal, telephoto, anamorphic, macro (with focal length guidance)
  - **Color/Grade**: Warm, cool, desaturated, high-contrast, pastel, monochrome
  - **Mood/Tone**: Dramatic, serene, tense, joyful, melancholic, mysterious, epic
  - **Pacing**: Slow motion, real-time, time-lapse, freeze frame
- **Validation**: CPE rules engine warns about physically impossible combos (e.g., "handheld + macro" → unstable, "anamorphic + extreme close-up" → lens limits)

#### 3. Multi-Shot Sequence Builder
- **What**: Compose up to 6 labeled shots as a storyboard sequence
- **Source**: New — leverages Kling 3.0's native multi-shot support
- **Per shot**: framing, subject, motion, duration (3-15s), dialogue (optional)
- **Output format**: Structured prompt with `Shot 1:`, `Shot 2:`, etc. that Kling 3.0 natively parses
- **Continuity**: Character definitions anchored at prompt start, consistent across shots

#### 4. Character & Dialogue Direction
- **What**: Define characters with visual traits + voice binding for native audio
- **Source**: Kling 3.0 prompting guide patterns
- **Format**: `[Character A: Lead Detective, controlled serious voice]: "Let's stop pretending."`
- **Features**: Tone labels (whispering, shouting, trembling), action anchoring, temporal control between speakers

#### 5. One-Click Generation with Kling 3.0
- **What**: Generate cinematic video directly from the structured prompt
- **Model selection**: Standard (fast/cheap) or Pro (highest quality) or O3 (storyboard-first)
- **Modes**: Text-to-video, Image-to-video (anchor from keyframe), Reference-to-video
- **Progress**: Non-intrusive progress sidebar (pattern from DirectorsConsole)

#### 6. Prompt History & Favorites
- **What**: Save, favorite, and reuse cinematography configurations
- **Persistence**: Convex table with full prompt structure + preset references
- **Features**: Search by preset, filter by mood/style, "Use Again" button

### ✅ Advanced Features (Phase 2)

#### 7. Video Editing Pass
- **What**: Post-generation editing using Kling O3 video-to-video
- **Operations**: Background swap, clothing change, subject insertion/removal, scene reshaping
- **Source**: Kling 3.0 V2V Edit endpoint

#### 8. Keyframe-First Workflow
- **What**: Generate 4K keyframes with Kling Image 3.0, then animate with Kling 3.0 I2V
- **Flow**: CPE preset → Kling Image 3.0 T2I → review/edit keyframes → Kling 3.0 I2V
- **Benefit**: More control over composition before committing to video generation credits

#### 9. Parallel Variations Board
- **What**: Generate N variations (different seeds/presets) and rate/select winners
- **Source**: DirectorsConsole parallel job groups pattern
- **Features**: Star ratings, markdown notes, "promote to final" workflow

#### 10. Style Bible / Continuity Manager
- **What**: Save a project-level "camera package" that enforces consistency across shots
- **Source**: DirectorsConsole CPE preset + validation architecture
- **Features**: Warn when a shot deviates from the style bible, lock camera/lens/grade

### ❌ NOT Included (Out of Scope)
- ComfyUI workflow parsing (local-only, not relevant to FAL.ai)
- Orchestrator/render farm management (local network feature)
- Infinite storyboard canvas (see Storyboard Generator mini-app instead)
- File system project management (replaced by Convex persistence)
- Local credential storage (replaced by Clerk + server-side secrets)

---

## Technology Stack

| Layer | DirectorsConsole (Source) | MyShortReel (Target) | Adaptation |
|-------|--------------------------|----------------------|------------|
| **Prompt Engine** | Python 3.11 + Pydantic | TypeScript + Zod | Full port required |
| **API Layer** | FastAPI | Convex actions | Replace HTTP with Convex |
| **Database** | SQLite (local encrypted) | Convex tables | Cloud-native, multi-tenant |
| **Auth** | None (local desktop app) | Clerk | Add user scoping |
| **AI Generation** | ComfyUI (local GPU) | FAL.ai (Kling 3.0) | Replace backend entirely |
| **Frontend** | React + Vite + Emotion | Next.js + Tailwind + Radix UI | Rebuild UI components |
| **State** | React Context + localStorage | Convex reactive queries + React hooks | Cloud persistence |
| **Video Models** | ComfyUI workflows (SDXL, Wan, etc.) | Kling 3.0/O3 via FAL.ai | Model-specific formatting |

---

## Architecture Assessment

### What to Port from DirectorsConsole

#### 1. Cinema Prompt Engineering (CPE) Core ⭐⭐⭐⭐⭐
- **What**: Structured config → validated prompt → model-specific formatting
- **Source files**: `cpe/prompt_generator.py`, `cpe/presets/`, `cpe/rules/`, `cpe/formatters/`
- **Port effort**: 15-25 hours
- **Port strategy**: 
  - Convert Pydantic models → Zod schemas + TypeScript interfaces
  - Convert preset data → Convex seed data (or static JSON initially)
  - Convert `_format_for_model()` → `formatPromptForKling3()` TypeScript function
  - Convert validation rules → client-side Zod validation + server-side Convex validation

#### 2. Film Presets Library ⭐⭐⭐⭐⭐
- **What**: 20+ curated film/animation presets with camera packages
- **Source files**: `cpe/presets/*.py` (Blade Runner, Barry Lyndon, Ghibli, Spider-Verse, etc.)
- **Port effort**: 5-8 hours (data conversion, not logic)
- **Port strategy**: Convert Python dataclasses → TypeScript objects or Convex documents
- **Value**: Instant "wow factor" for users — one click to get Blade Runner aesthetics

#### 3. Validation Rules Engine ⭐⭐⭐⭐
- **What**: Physical/historical plausibility checks on cinematography configurations
- **Source files**: `cpe/rules/validation.py`
- **Examples**:
  - "Anamorphic lens not available before 1953" (era constraint)
  - "Handheld + macro = extremely unstable" (physics constraint)
  - "This camera body doesn't support this lens mount" (gear constraint)
  - "Noir lighting contradicts pastel color grade" (aesthetic constraint)
- **Port effort**: 8-12 hours (subset for MVP, expand later)
- **Port strategy**: TypeScript rule functions returning `{ valid: boolean, warnings: string[], errors: string[] }`
- **UX**: "Disabled options with reasons" — user sees why a combo is invalid, learns cinematography

#### 4. Model-Specific Prompt Formatting ⭐⭐⭐⭐⭐
- **What**: Transform structured config into Kling 3.0 optimal prompt format
- **Source files**: `cpe/formatters/` (has Midjourney, FLUX, Wan, Runway formatters)
- **Port effort**: 4-6 hours (write new Kling 3.0 formatter using prompting guide)
- **Key Kling 3.0 formatting rules**:
  - Think in shots, not clips (labeled shot structure)
  - Anchor subjects early for consistency
  - Describe motion explicitly (camera behavior over time)
  - Native audio: `[Character A: Name, tone]: "Dialogue"`
  - Temporal control: "Immediately," linking words between speakers
  - Duration allocation per shot (3-15s)

#### 5. Progress Sidebar UX Pattern ⭐⭐⭐⭐
- **What**: Non-intrusive generation progress tracking
- **Source**: DirectorsConsole frontend progress sidebar
- **Port effort**: 6-10 hours
- **Port strategy**: Right sidebar listing active generations with stage tracking, adapts to FAL.ai polling states

### What NOT to Port

| Component | Reason |
|-----------|--------|
| ComfyUI WorkflowParser | Not relevant — we use FAL.ai, not local ComfyUI |
| Orchestrator (render farm) | Local network feature, not applicable to cloud |
| Infinite canvas | Too heavy (45-85h); Storyboard Generator handles this |
| File browser dialog | Local filesystem, not relevant in cloud app |
| SQLite credential storage | Replaced by Clerk + Convex server-side secrets |
| 13+ LLM provider abstraction | Overkill — use existing FAL.ai + AI SDK setup |

---

## Strengths (from DirectorsConsole)

✅ **Production-Grade Cinematography Knowledge**: Real camera/lens/lighting rules, not just prompt keywords  
✅ **Film Presets with Historical Accuracy**: Era-appropriate constraints (e.g., no digital looks in 1970s preset)  
✅ **Validation Engine**: Catches physically impossible or aesthetically contradictory configurations  
✅ **Model-Aware Formatting**: Different prompt structures for different generation models  
✅ **Modular Architecture**: CPE engine is cleanly separated from UI and orchestration  
✅ **"Disabled Options with Reasons"**: Excellent UX pattern — educational + prevents bad prompts  

### Weaknesses (Requires Adaptation)

⚠️ **Python → TypeScript Port**: CPE is entirely Python/Pydantic, needs full rewrite  
⚠️ **Local-First Architecture**: No auth, no multi-tenant, no cloud persistence  
⚠️ **ComfyUI-Centric**: Workflow parsing and node management not applicable  
⚠️ **No Kling 3.0 Formatter**: Existing formatters cover Midjourney/FLUX/Wan/Runway — need to write Kling 3.0 specific formatter  
⚠️ **Desktop UI (Emotion CSS)**: Frontend needs complete rebuild with Radix + Tailwind  

---

## Integration Path

### Phase 1: CPE Core + Kling 3.0 Formatter (15-20 hours)

```
1. Port CPE data models (Python → TypeScript/Zod)              4-6h
   - Shot sizes, camera movements, compositions, lighting types
   - Character definition schema
   - Preset data structure
   
2. Port 10-15 "hero" film presets                               3-5h
   - Blade Runner, Ghibli, Wes Anderson, Nolan, Barry Lyndon
   - Spider-Verse, Malick, Kubrick, Spielberg, Fincher
   - Store as static TypeScript objects (or Convex seed data)

3. Write Kling 3.0 prompt formatter                             4-6h
   - formatPromptForKling3(config) → structured multi-shot prompt
   - Character anchoring at prompt start
   - Shot labeling with duration
   - Dialogue formatting with tone labels
   - Camera movement → Kling motion instructions
   
4. Basic validation rules (subset)                              4-6h
   - Physically impossible combos (hard errors)
   - Aesthetic contradictions (warnings)
   - "Disabled with reason" logic for UI selectors
```

### Phase 2: UI + Convex Integration (12-18 hours)

```
5. Prompt Builder UI (Radix + Tailwind)                         6-8h
   - Film preset selector (visual cards with film stills)
   - Cinematography parameter selectors with validation feedback
   - Multi-shot sequence builder (up to 6 shots)
   - Character definition panel
   - Dialogue direction editor
   - Live prompt preview panel

6. Convex schema + actions                                      3-5h
   - cinematographyPresets table (or static)
   - promptHistory table (user's saved configurations)
   - Kling 3.0 video generation action (new Convex action)
   - Credit deduction integration

7. Page route + layout                                          1-2h
   - app/[locale]/tools/cinematography-studio/page.tsx
   - Integrate with ToolsLayout, credits header, DeviceProvider
   
8. Generation flow + results                                    3-5h
   - Connect to Kling 3.0 FAL.ai endpoints
   - Progress tracking (adapt existing videoPolling pattern)
   - Result display with inline video playback
   - Download + "Use in Project" actions
```

### Phase 3: Polish + Advanced Features (8-15 hours)

```
9.  Prompt history + favorites                                  2-3h
10. Keyframe-first workflow (Kling Image 3.0 → I2V)            3-5h
11. Progress sidebar (DirectorsConsole pattern)                 3-5h
12. Mobile optimization                                         2-3h
13. i18n integration                                            1-2h
```

---

## Convex Schema

### New Tables

```typescript
// Cinematography prompt configurations saved by users
export const cinematographyPrompts = defineTable({
  userId: v.string(),
  title: v.string(),
  
  // Film preset reference
  presetId: v.optional(v.string()),
  presetName: v.optional(v.string()),
  
  // Cinematography configuration
  config: v.object({
    shotSize: v.string(),
    cameraMovement: v.string(),
    composition: v.string(),
    lighting: v.string(),
    lens: v.optional(v.string()),
    focalLength: v.optional(v.string()),
    colorGrade: v.string(),
    mood: v.string(),
    pacing: v.optional(v.string()),
    era: v.optional(v.string()),
  }),
  
  // Characters (for multi-shot with dialogue)
  characters: v.optional(v.array(v.object({
    id: v.string(),
    name: v.string(),
    description: v.string(),
    voiceTone: v.optional(v.string()),
  }))),
  
  // Multi-shot sequence
  shots: v.array(v.object({
    index: v.number(),
    description: v.string(),
    duration: v.number(), // 3-15 seconds
    cameraDirection: v.optional(v.string()),
    dialogue: v.optional(v.array(v.object({
      characterId: v.string(),
      line: v.string(),
      tone: v.string(),
    }))),
  })),
  
  // Generated prompt output
  generatedPrompt: v.string(),
  
  // Generation settings
  modelTier: v.union(v.literal("standard"), v.literal("pro"), v.literal("o3")),
  totalDuration: v.number(),
  
  // Metadata
  isFavorited: v.boolean(),
  tags: v.optional(v.array(v.string())),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_favorited", ["userId", "isFavorited"])
  .index("by_preset", ["presetId"]);

// Generation results from Kling 3.0
export const cinematographyGenerations = defineTable({
  userId: v.string(),
  promptId: v.id("cinematographyPrompts"),
  
  // FAL.ai job tracking
  requestId: v.string(),
  modelId: v.string(),
  status: v.union(
    v.literal("queued"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed")
  ),
  
  // Output
  videoUrl: v.optional(v.string()),
  videoStorageId: v.optional(v.string()),
  thumbnailUrl: v.optional(v.string()),
  duration: v.optional(v.number()),
  
  // Rating / notes (from DirectorsConsole pattern)
  starRating: v.optional(v.number()), // 1-5
  notes: v.optional(v.string()),
  isSelected: v.optional(v.boolean()), // "promoted to final"
  
  // Cost tracking
  creditsUsed: v.number(),
  
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_prompt", ["promptId"])
  .index("by_status", ["status"]);
```

### New Convex Action

```typescript
// convex/actions/cinematographyGeneration.ts
export const generateCinematicVideo = action({
  args: {
    promptId: v.id("cinematographyPrompts"),
    formattedPrompt: v.string(),
    modelTier: v.union(v.literal("standard"), v.literal("pro"), v.literal("o3")),
    duration: v.number(),
    // Optional: image-to-video mode
    anchorImageUrl: v.optional(v.string()),
    // Optional: reference-to-video mode (O3 only)
    referenceVideoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Auth check (Clerk)
    // 2. Credit check (useCredits pattern)
    // 3. Select FAL endpoint based on modelTier + mode
    // 4. Submit to FAL.ai Queue API
    // 5. Store requestId in cinematographyGenerations
    // 6. Deduct credits
    // 7. Return requestId for polling
  },
});
```

---

## New File Structure

```
app/[locale]/tools/
├── cinematography-studio/
│   └── page.tsx                          # Main studio page

components/tools/cinematography/
├── CinematographyStudio.tsx              # Main orchestrator component
├── PresetSelector.tsx                    # Film preset cards (Blade Runner, Ghibli...)
├── ParameterBuilder.tsx                  # Shot size, camera, lighting selectors
├── ShotSequenceBuilder.tsx               # Multi-shot composer (up to 6 shots)
├── CharacterDirector.tsx                 # Character definition + dialogue direction
├── PromptPreview.tsx                     # Live formatted prompt preview
├── GenerationResults.tsx                 # Video playback + rating/notes
├── ProgressSidebar.tsx                   # Non-intrusive generation progress
└── types.ts                              # All TypeScript interfaces

lib/cinematography/
├── presets/
│   ├── index.ts                          # Preset registry
│   ├── blade-runner.ts                   # Individual preset definitions
│   ├── ghibli.ts
│   ├── wes-anderson.ts
│   ├── nolan.ts
│   ├── barry-lyndon.ts
│   └── ...
├── formatter.ts                          # formatPromptForKling3()
├── validator.ts                          # Validation rules engine
├── types.ts                              # CinematographyConfig, Preset, Shot interfaces
└── constants.ts                          # Shot sizes, movements, lighting types

convex/actions/
├── cinematographyGeneration.ts           # Kling 3.0 FAL.ai integration

hooks/tools/
├── useCinematographyBuilder.ts           # Prompt composition state
├── useCinematographyGeneration.ts        # Generation + polling
├── usePresets.ts                         # Preset loading + filtering
└── usePromptValidation.ts               # Real-time validation feedback
```

---

## Kling 3.0 Prompt Formatting Rules

### Key Formatting Principles (from FAL.ai Prompting Guide)

```typescript
// lib/cinematography/formatter.ts

interface KlingPromptConfig {
  characters: Character[];
  shots: Shot[];
  preset: CinematographyPreset;
  params: CinematographyParams;
}

function formatPromptForKling3(config: KlingPromptConfig): string {
  const sections: string[] = [];

  // 1. SCENE SETUP: Establish environment + atmosphere
  // Kling 3.0 reads scene-level context first
  sections.push(formatSceneSetup(config.preset, config.params));

  // 2. CHARACTER ANCHORING: Define subjects early for consistency
  // "Anchor Your Subjects Early" — Kling 3.0 locks in traits
  for (const char of config.characters) {
    sections.push(
      `[Character ${char.id}: ${char.name}, ${char.voiceTone}]`
    );
  }

  // 3. MULTI-SHOT SEQUENCE: Label each shot with duration
  // "Think in Shots, Not Clips" — up to 6 shots
  for (const shot of config.shots) {
    sections.push(formatShot(shot, config.params));
  }

  return sections.join("\n\n");
}

function formatShot(shot: Shot, params: CinematographyParams): string {
  const parts: string[] = [];

  // Shot label
  parts.push(`Multi shot Prompt ${shot.index}:`);

  // Camera direction (from CPE params)
  parts.push(formatCameraDirection(params));

  // Scene description with motion
  parts.push(shot.description);

  // Dialogue with character binding + temporal control
  if (shot.dialogue) {
    for (const line of shot.dialogue) {
      parts.push(
        `[${line.characterName}, ${line.tone}]: "${line.text}"`
      );
      // Add "Immediately," for quick exchanges
    }
  }

  // Duration
  parts.push(`(Duration: ${shot.duration} seconds)`);

  return parts.join("\n");
}
```

### Example: CPE Preset → Kling 3.0 Prompt

**User selects**: Blade Runner preset + 2 characters + 3 shots

**Generated Kling 3.0 prompt**:

```
A rain-soaked neon-lit cityscape at night. Towering holographic 
advertisements reflect off wet streets. Anamorphic lens flares streak 
across the frame. Deep shadows with cyan and amber accent lighting.
Low atmospheric synthesizer hum with rain ambience.

[Character A: Replicant Hunter, weary gravelly voice]
[Character B: Fugitive Replicant, calm defiant voice]

Multi shot Prompt 1: Wide establishing shot slowly pushing in 
through rain. Neon signs illuminate the hunter walking alone down 
a narrow alley, coat collar turned up, cigarette smoke trailing. 
Camera tracks at waist height. (Duration: 5 seconds)

Multi shot Prompt 2: Medium close-up, shallow depth of field. 
The hunter stops. Ahead, the replicant stands still in the rain.
[Replicant Hunter, weary gravelly voice]: "I've been looking for you."
Immediately, the replicant tilts their head.
[Fugitive Replicant, calm defiant voice]: "I know."
(Duration: 5 seconds)

Multi shot Prompt 3: Over-the-shoulder shot from behind the 
replicant. The hunter's hand moves toward holster. Rain intensifies.
Camera slowly pushes in. Neon reflections shimmer on wet ground.
Music tightens with a rising pulse.
(Duration: 5 seconds)
```

---

## Impact on Existing Planned Mini-Apps

### Direct Upgrades

| Existing Mini-App | How Cinematography Studio Enhances It |
|-------------------|---------------------------------------|
| **Prompt Generator** | Replaces generic prompt building with structured cinematography composition; CPE presets become "premium templates" |
| **Storyboard Generator** | CPE panels map 1:1 to Kling 3.0 multi-shot prompts; per-shot camera packages; continuity enforcement |
| **Scene Generator** | Replaces freeform prompting with validated cinematic direction; "occasion selector" becomes "film style selector" |
| **Quick Video** | Film presets give instant professional quality; users pick "Ghibli style" instead of writing prompts |
| **Ad Assets Generator** | Style Bible enforces brand consistency across all ad variations; validated "camera package" per brand |
| **Model Comparison/Benchmark** | CPE generates standardized prompts per model, enabling fair A/B comparisons |
| **Image Generator** | Kling Image 3.0 (4K) becomes a keyframe source with cinematography-accurate composition |

### New User Journeys Enabled

```
Journey 1: "Film Director Mode"
Pick preset (Blade Runner) → Define characters → Build 3-shot sequence 
→ Generate with Kling 3.0 Pro → Rate/select → Use in project

Journey 2: "Quick Cinematic"  
Pick preset (Ghibli) → Describe scene in plain text → Auto-structure 
into shots → Generate → Download

Journey 3: "Keyframe-First"
Pick preset → Generate 4K keyframes (Kling Image 3.0) → Review/edit 
→ Animate selected keyframes (Kling 3.0 I2V) → Compose sequence

Journey 4: "Ad Campaign"
Set Style Bible (camera + grade + mood) → Generate N variations with 
different seeds → Rate/select winners → Export for campaign
```

---

## Credit Cost Estimation

| Operation | Model | Est. Cost (FAL.ai) | Credits |
|-----------|-------|---------------------|---------|
| 4K keyframe (image) | Kling Image 3.0 | ~$0.02-0.05 | 1 credit |
| 5s video (standard) | Kling 3.0 Standard | ~$0.10-0.20 | 2-3 credits |
| 5s video (pro) | Kling 3.0 Pro | ~$0.20-0.40 | 4-6 credits |
| 15s multi-shot (pro) | Kling 3.0 Pro | ~$0.50-1.00 | 8-12 credits |
| 15s multi-shot (O3) | Kling O3 Pro | ~$0.80-1.50 | 12-18 credits |
| Video edit pass | Kling O3 V2V Edit | ~$0.30-0.60 | 5-8 credits |

> Note: Verify exact pricing from FAL.ai dashboard. Costs may vary.

---

## Time Estimation Summary

| Phase | Hours | Description |
|-------|-------|-------------|
| **Phase 1: CPE Core Port** | 15-20h | Data models, presets, formatter, validation |
| **Phase 2: UI + Convex** | 12-18h | Builder UI, schema, actions, generation flow |
| **Phase 3: Polish** | 8-15h | History, keyframe workflow, progress sidebar, mobile, i18n |
| **TOTAL** | **35-55h** | Full Cinematography Prompt Studio |

### Fastest Path (MVP Only)

| Component | Hours |
|-----------|-------|
| 5 hero presets (data only, no full rules engine) | 3h |
| Kling 3.0 prompt formatter | 4h |
| Basic parameter selectors (no validation) | 4h |
| Multi-shot builder (max 3 shots) | 3h |
| Convex action + polling | 3h |
| Page route + basic UI | 3h |
| **MVP TOTAL** | **~20h** |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Python → TS port complexity | Medium | Start with data-only port (presets), add rules later |
| Kling 3.0 prompt format changes | Low | FAL.ai guide is stable; wrap formatter for easy updates |
| Credit costs higher than expected | Medium | Default to Standard tier; Pro/O3 as explicit upgrade |
| Multi-shot coherence issues | Medium | Kling 3.0 designed for this; test with hero presets |
| Validation rules too restrictive | Low | Start with warnings only, no hard blocks |
| Mobile UX complexity | Medium | Progressive disclosure; mobile shows simplified builder |
| FAL.ai rate limits | Low | Use existing queue pattern from videoGeneration.ts |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| MVP functional (preset → prompt → video) | < 20 hours |
| Full studio with validation + history | < 55 hours |
| User can generate cinematic video in < 2 min | Yes |
| Preset-to-video requires < 3 clicks | Yes |
| Generated prompts score higher than freeform (A/B test) | > 30% quality improvement |
| Mobile-responsive | Yes |
| Code reuse from existing infrastructure | > 60% |

---

## Recommended Priority

### Within existing mini-app roadmap:

| Priority | Mini-App | Hours | Rationale |
|----------|----------|-------|-----------|
| P1 | Image Generator | 8-12h | Foundation — users need images first |
| P2 | **Cinematography Prompt Studio (MVP)** | **~20h** | **Differentiator — no competitor has this** |
| P3 | Prompt Generator | 16-24h | Enhanced by CPE patterns (shared formatter) |
| P4 | Storyboard Generator | 18-24h | Uses CPE multi-shot structure |
| P5 | Scene Generator | 32-48h | Upgraded with film presets + Kling 3.0 |

**Rationale for P2**: The Cinematography Prompt Studio is a **unique differentiator** that no other consumer video tool offers. Combined with Kling 3.0's native cinematic understanding, it creates a moat. It also provides the prompt formatting infrastructure that benefits Prompt Generator (P3), Storyboard Generator (P4), and Scene Generator (P5).

---

## Files to Reference

| Document | Purpose |
|----------|---------|
| [DirectorsConsole README](https://github.com/NickPittas/DirectorsConsole) | CPE architecture, preset system, validation rules |
| [Kling 3.0 Prompting Guide](https://blog.fal.ai/kling-3-0-prompting-guide/) | Multi-shot format, character anchoring, dialogue direction |
| [Kling 3.0 on FAL.ai](https://blog.fal.ai/kling-3-0-is-now-available-on-fal/) | Endpoints, capabilities, model tiers |
| [MINI-APP-AWESOME-VIDEO-PROMPTS-ANALYSIS.md](./MINI-APP-AWESOME-VIDEO-PROMPTS-ANALYSIS.md) | Prompt Generator patterns (shared infrastructure) |
| [MINI-APP-SEQ-STORYBOARD-GENERATOR-ANALYSIS.md](./MINI-APP-SEQ-STORYBOARD-GENERATOR-ANALYSIS.md) | Storyboard patterns (multi-shot integration) |
| [MINI-APP-SCENE-GENERATOR-ANALYSIS.md](./MINI-APP-SCENE-GENERATOR-ANALYSIS.md) | Video generation patterns (Convex action structure) |
| `convex/actions/videoGeneration.ts` | Existing FAL.ai queue pattern to replicate |
| `convex/actions/imageGeneration.ts` | Existing image generation with model fallback |

---

**Document Status**: Ready for Development Planning  
**Next Step**: Review → Approve priority placement → Port 5 hero presets → Write Kling 3.0 formatter → Build MVP UI  
**Key Dependency**: FAL.ai Kling 3.0 API access (available now, discount code: "falkling3")

---

**Version**: 1.0  
**Last Updated**: February 10, 2026  
**Author**: Implementation & Analysis Team  
**Source Analysis**: DirectorsConsole CPE Engine + Kling 3.0 FAL.ai Documentation
