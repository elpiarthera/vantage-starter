# Sprint 43: Voice Generator — Discussion #150 Feature Parity

**Date**: March 13, 2026
**Branch**: `sprint-43-voice-generator-discussion-150` (new branch from `sprint-38-image-generator-responsive-fix`)
**Status**: Planning — awaiting senior dev review
**Reference**: [GitHub Discussion #150 — Voice Generator Mini-App](https://github.com/jacquesdahan/MyShortReel-beta/discussions/150)
**Goal**: Close the gap between what was built (Sprints 32v/35/36) and what Discussion #150 envisions. Four concrete deliverables: voice preview clips per character, new TTS models via fal.ai, language boost completion in voiceModelSchemas, and a curated voice name alignment between the guided Step 4 and the standalone voice mini-app.
**QA Strategy**: **2-Step QA** — (1) TypeScript `npx tsc --noEmit`, (2) Biome `npx biome check --write <files>` after every task. i18n tasks add `pnpm translate` + `node scripts/verify-translations.js`. No task merges without passing its QA block.

---

## 🗺️ Context: What's already built

The Voice Generator mini-app (`/tools/voice-generator`) was completed across Sprints 32v, 35, and 36:

- ✅ **TTS generation** — schema-driven via `voiceModelSchemas` Convex table (3 active models)
- ✅ **Active models**: MiniMax Speech 2.8 HD, MiniMax Speech 2.8 Turbo, Qwen 3 TTS (12 params incl. voice cloning)
- ✅ **Voice recording** — MediaRecorder API, 88px button, real-time waveform, preview, retry
- ✅ **File upload** — MP3/WAV/M4A
- ✅ **History library** — VoiceLibrary with pagination, delete, "Use in Project"
- ✅ **Credit system** — fully dynamic from `creditCosts` table
- ✅ **i18n** — all 7 locales (2102+ keys)
- ✅ **Mobile-first** — WCAG 44px touch targets

**Gaps identified from Discussion #150:**
1. No per-voice **preview audio clips** — users cannot hear a voice before generating
2. **Chatterbox TTS** (`fal-ai/chatterbox/text-to-speech`) and **MiniMax Speech 02 HD** (`fal-ai/minimax/speech-02-hd`) not yet added — both available on fal.ai, both mentioned in Discussion #150
3. `language_boost` param in voiceModelSchemas seed has only **8 languages** — `lib/constants/audio.ts` already defines 37 languages via `LANGUAGE_BOOST_MAP` but the seed was never updated
4. **Voice names mismatch** — Step 4 (guided flow) shows curated storytelling names ("Emma - Warm & Friendly", "James - Professional & Clear") via `MINIMAX_VOICES` in `lib/constants/audio.ts`, but the voice mini-app shows raw API IDs ("Wise_Woman", "Patient_Man") — same underlying voices, completely different UX

> **Note on ElevenLabs**: Confirmed available on fal.ai at `https://fal.ai/explore/search?q=elevenlabs`. Relevant endpoints: `elevenlabs/tts/turbo-v2.5` (high-speed, matches Discussion #150's reference to `elevenlabs/tts/turbo`), `elevenlabs/tts/eleven-v3` (newest, highest quality), `elevenlabs/tts/multilingual-v2` (multilingual). These are added as **Task 43.7** below.
>
> **Note on Orpheus TTS**: Not found in fal.ai catalog as of 2026-03-13. Do NOT add until confirmed.

---

## 📋 Task List

---

### Task 43.1 — Voice preview clips per voice preset

**Priority**: P1 — High UX value, core Discussion #150 requirement
**Files**: `convex/schema.ts`, `convex/seed/seedVoiceModels.ts`, `components/voice-generator/VoiceModelGrid.tsx`, `components/voice-generator/VoiceModelCard.tsx`, `messages/en.json` + 6 locales

**Problem**: Users choose a voice model and voice ID without ever hearing what it sounds like. Discussion #150 explicitly requires: "Each voice has a preview button."

**Approach**:

Step 1 — **Verify `previewUrl` is already in Convex schema** (no schema change needed):

The `options[]` item validator in `voiceModelSchemas` already includes `previewUrl: v.optional(v.string())` in `convex/schema.ts`. Do **not** add it again — TypeScript will throw a duplicate object key error.

> Confirm with: `grep -n "previewUrl" convex/schema.ts` — should return one hit.

Step 2 — **Choose stable CDN for preview audio files** (**required pre-task decision — do not skip**):

Preview clips must be hosted on a **stable static CDN** (e.g., Cloudflare R2 public bucket, S3 public bucket, or GitHub release assets). Do **NOT** use `ctx.storage.getUrl()` — Convex storage returns signed, time-limited URLs that expire; seeding them as hardcoded strings will produce broken previews after expiry. Allocate 30min to create the bucket/folder and confirm a permanent public URL pattern before generating clips.

Step 3 — **Generate and host preview audio clips**:
- Use `fal-ai/minimax/speech-2.8-hd` to generate a 5–8 second sample clip for each of the 17 MiniMax voice IDs with a standardized cinematic text: *"Welcome to ShortReel. Your story deserves to be heard."*
- Upload to Convex storage or a CDN (e.g., public Convex file URLs via `ctx.storage.store()`)
- Same for Qwen 3 TTS — generate for each of its 9 voice presets
- Record the resulting URLs per voice ID

Step 3 — **Update `seedVoiceModels.ts`** to include `previewUrl` in each voice option:

```typescript
// Inside the voice_id select param options:
{ label: "voices.wise_woman", value: "Wise_Woman", previewUrl: "https://..." },
{ label: "voices.patient_man", value: "Patient_Man", previewUrl: "https://..." },
// ...
```

Step 4 — **Update `VoiceModelCard.tsx` and `VoiceModelGrid.tsx`** to render a preview play button per voice option when `previewUrl` is defined:
- Small inline `Play` icon button next to each voice name in the voice selector dropdown inside `FloatingOptionsPanel` / `VoiceSettingsPanel`
- Clicking plays the `previewUrl` audio inline (using `new Audio(url).play()`) — no full player UI, just a quick listen
- Button shows `Loader2` while loading and `Square` (stop) while playing

Step 5 — **i18n**: Add `voice_generator.preview_voice_aria` key for the play button aria-label.

**QA**: `npx tsc --noEmit` + `npx biome check --write` + `pnpm translate` + `node scripts/verify-translations.js`

---

### Task 43.2 — Add Chatterbox TTS model (`fal-ai/chatterbox/text-to-speech`)

**Priority**: P1 — Mentioned specifically in Discussion #150 for "dialogue style narration / casual storytelling"
**Files**: `convex/seed/seedVoiceModels.ts`, `convex/seed/seedCompleteVoiceModels.ts`, `messages/en.json` + 6 locales, `convex/credits.ts` (credit cost row)

**Context**: `fal-ai/chatterbox/text-to-speech` is live on fal.ai. From the catalog: "Whether you're working on memes, videos, games, or AI agents, Chatterbox brings your content to life." — expressive, conversational TTS.

**Steps**:

1. **Verify the fal.ai API spec** for `fal-ai/chatterbox/text-to-speech`:
   - Required params: `text` (input text), `voice` or `audio_url` (optional reference), `exaggeration`, `cfg_weight`, `temperature`
   - Output: `audio.url` (MP3)
   - Confirm via `https://fal.ai/models/fal-ai/chatterbox/text-to-speech/api`

2. **Add credit cost row inside `seedVoiceModels.ts`** — do NOT insert via `npx convex run` or the dashboard. The seed's cleanup block maintains its own list of managed `creditActionType` values; a manually inserted row will survive re-seeds and create duplicates. Add `"voice_generation_chatterbox"` to `voiceCreditActionTypes` array and add the matching `ctx.db.insert("creditCosts", {...})` call alongside the existing four entries:
   ```typescript
   // Add to voiceCreditActionTypes array:
   "voice_generation_chatterbox",
   // Add credit cost insert:
   await ctx.db.insert("creditCosts", {
     actionType: "voice_generation_chatterbox",
     credits: 3,
     isActive: true,
     description: "Chatterbox TTS voice generation",
   });
   ```

3. **Add schema to `seedVoiceModels.ts`**:
   ```typescript
   const chatterbox = {
     schemaId: "chatterbox-tts",
     modelId: "fal-ai/chatterbox/text-to-speech",
     name: "Chatterbox TTS",
     nameTranslationKey: "voice_models.chatterbox_tts",
     type: "tts",
     creditActionType: "voice_generation_chatterbox",
     isActive: true,
     sortOrder: 4,
     badges: ["EXPRESSIVE", "FAST"],
     maxPromptLength: 3000,
     capabilities: {
       emotionControl: true,
       highQualityAudio: false,
       multiLanguage: false,
       pitchControl: false,
       speedControl: false,
       voiceCloning: true,     // via reference audio URL
       voiceModification: false,
       streaming: false,
     },
     params: [
       { key: "text", control: "textarea", default: "", label: "voice_generator.prompt_label", maxLength: 3000 },
       { key: "audio_url", control: "text", advanced: true, required: false,
         label: "voice_generator.settings.reference_audio_url_label",
         hint: "voice_generator.settings.reference_audio_url_hint",
         placeholder: "voice_generator.settings.reference_audio_url_placeholder" },
       { key: "exaggeration", control: "slider", advanced: false, default: 0.5, min: 0, max: 1, step: 0.05,
         label: "voice_generator.settings.exaggeration_label",
         hint: "voice_generator.settings.exaggeration_hint" },
       { key: "cfg", control: "slider", advanced: true, default: 0.5, min: 0, max: 1, step: 0.05,
         label: "voice_generator.settings.cfg_label",
         hint: "voice_generator.settings.cfg_hint" },
       { key: "temperature", control: "slider", advanced: true, default: 0.8, min: 0, max: 1, step: 0.05,
         label: "voice_generator.settings.temperature_label",
         hint: "voice_generator.settings.temperature_hint" },
     ],
     allowedParams: ["text", "audio_url", "exaggeration", "cfg", "temperature"],
     conditionalParams: [],
   };
   ```

4. **Add Chatterbox branch to `convex/actions/voiceToolGeneric.ts`** — the action uses a hard if/else chain on `schema.modelId`. Chatterbox (`fal-ai/chatterbox/text-to-speech`) matches neither the `minimax` nor `qwen` branch — without a Chatterbox branch, `falParams` stays empty and fal.ai will reject the job with a validation error. Add:

```typescript
// In voiceToolGeneric.ts, after the Qwen branch:
} else if (schema.modelId.includes("chatterbox")) {
    // Chatterbox: flat structure, uses `text` key
    if (rawParams.text) falParams.text = rawParams.text;
    if (rawParams.audio_url) falParams.audio_url = rawParams.audio_url;
    if (rawParams.exaggeration !== undefined)
        falParams.exaggeration = rawParams.exaggeration as number;
    if (rawParams.cfg !== undefined)
        falParams.cfg = rawParams.cfg as number;
    if (rawParams.temperature !== undefined)
        falParams.temperature = rawParams.temperature as number;
}
```

Chatterbox output shape is `{ audio: { url: "..." } }` — this matches the existing `FalVoiceResult` interface, so no output extraction change is needed.

5. **i18n**: Add the following new keys to `messages/en.json` (note: `temperature_label` and `temperature_hint` already exist — do not duplicate them):
   ```json
   "voice_models": {
     "chatterbox_tts": "Chatterbox TTS",
     "chatterbox_tts_desc": "Expressive conversational voice synthesis"
   },
   "voice_generator": {
     "settings": {
       "reference_audio_url_label": "Reference Voice URL",
       "reference_audio_url_hint": "Upload an audio file URL to clone the voice style",
       "reference_audio_url_placeholder": "https://...",
       "exaggeration_label": "Expressiveness",
       "exaggeration_hint": "Higher values produce more expressive, dramatic speech (0–1)",
       "cfg_label": "Pacing Control",
       "cfg_hint": "Controls pacing adherence (0 = free, 1 = strict)"
     }
   }
   ```

6. **Re-run seed** via `npx convex run seed/seedVoiceModels:seedVoiceModels` (idempotent), verify 4 records in `voiceModelSchemas`.

**QA**: `npx tsc --noEmit` + `npx biome check --write` + `pnpm translate` + `node scripts/verify-translations.js`

---

### Task 43.3 — Add MiniMax Speech 02 HD (`fal-ai/minimax/speech-02-hd`)

**Priority**: P2 — Newer/upgraded MiniMax model available on fal.ai
**Files**: `convex/seed/seedVoiceModels.ts`, `messages/en.json` + 6 locales

**Context**: The fal.ai catalog lists `fal-ai/minimax/speech-02-hd` as a distinct endpoint from the currently seeded `fal-ai/minimax/speech-2.8-hd`. This may be a newer API version with the same capabilities. Need to verify if the param schema is compatible before adding.

**Steps**:

1. **Verify API spec** at `https://fal.ai/models/fal-ai/minimax/speech-02-hd/api` — confirm whether `voice_setting`, `audio_setting`, `normalization_setting`, and `voice_modify` param groups are identical to Speech 2.8 HD.

2. **If param schema is compatible**: Add as `schemaId: "minimax-speech-02-hd"`, `sortOrder: 5`, `badges: ["HD", "LATEST", "MULTILINGUAL"]`. Mirror all 17 params from the existing MiniMax HD seed entry, change only `modelId` and `name`/`nameTranslationKey`.

3. **If param schema differs**: Document the differences and scope to a follow-up sprint.

4. **i18n**: Add `voice_models.minimax_02_hd` key.

**QA**: `npx tsc --noEmit` + `npx biome check --write` + `pnpm translate` + `node scripts/verify-translations.js`

---

### Task 43.4 — Language boost: sync voiceModelSchemas with `LANGUAGE_BOOST_MAP`

**Priority**: P2 — Data-only fix, no UI changes
**Files**: `convex/seed/seedVoiceModels.ts`

**Problem**: The `language_boost` select param in both MiniMax HD and Turbo schemas **in Convex dev** currently has exactly **10 options** (auto, English, Chinese, Spanish, French, German, Japanese, Korean, Portuguese, Italian, Russian — confirmed via live data). The `LANGUAGE_BOOST_MAP` in `lib/constants/audio.ts` defines all **38 entries** (37 languages + auto). The `voice_generator.languages` namespace in `en.json` has **12 keys** (auto + 11). That means: **28 new options to add to the seed** and **26 new i18n keys** to add to `en.json`.

**Fix**: Update the `language_boost` param options in both MiniMax HD and Turbo entries in `seedVoiceModels.ts` to mirror `LANGUAGE_BOOST_MAP`:

```typescript
// Use the full 37-language list from lib/constants/audio.ts:
// Chinese, Chinese,Yue, English, Arabic, Russian, Spanish, French,
// Portuguese, German, Turkish, Dutch, Ukrainian, Vietnamese, Indonesian,
// Japanese, Italian, Korean, Thai, Polish, Romanian, Greek, Czech,
// Finnish, Hindi, Bulgarian, Danish, Hebrew, Malay, Slovak, Swedish,
// Croatian, Hungarian, Norwegian, Slovenian, Catalan, Nynorsk, Afrikaans, auto
```

**i18n implications**: The 26 missing `voice_generator.languages.*` keys to add to `en.json`:
`turkish, dutch, ukrainian, vietnamese, indonesian, thai, polish, romanian, greek, czech, finnish, hindi, bulgarian, danish, hebrew, malay, slovak, swedish, croatian, hungarian, norwegian, slovenian, catalan, nynorsk, afrikaans, chinese_yue` — then `pnpm translate`.

**QA**: `npx tsc --noEmit` + `npx biome check --write` + `pnpm translate` + `node scripts/verify-translations.js`

---

### Task 43.5 — Align voice names in mini-app with Step 4 curated names

**Priority**: P2 — UX consistency between guided flow and standalone tool
**Files**: `convex/seed/seedVoiceModels.ts`, `messages/en.json` + 6 locales

**Problem**: The guided Step 4 shows curated storytelling-friendly voice names from `MINIMAX_VOICES` in `lib/constants/audio.ts`:
- "Emma - Warm & Friendly" → `Wise_Woman`
- "James - Professional & Clear" → `Patient_Man`
- "Sofia - Elegant & Sophisticated" → `Calm_Woman`
- "Marcus - Deep & Authoritative" → `Deep_Voice_Man`
- "Luna - Soft & Romantic" → `Calm_Woman` (same ID — edge case, document)
- "Oliver - Energetic & Upbeat" → `Casual_Guy`
- "Isabella - Calm & Soothing" → `Lovely_Girl`
- "Noah - Confident & Strong" → `Determined_Man`

The voice mini-app shows raw API IDs ("Wise_Woman", "Patient_Man", etc.) in `voice_setting.voice_id` options.

**Fix**: Update the `label` translation keys for the 8 `MINIMAX_VOICES` entries in the seed to use the curated names. Add the remaining 9 raw-ID voices (not in `MINIMAX_VOICES`) with descriptive names.

Map in seed using **existing `en.json` key names** (these keys and values are already in `messages/en.json` — do not add new keys or change values):

```typescript
// 7 curated voices (from MINIMAX_VOICES — unique voice IDs only)
// Note: Luna maps to same Calm_Woman ID as Sofia — omitted to avoid duplicate
{ label: "voices.emma_warm_friendly",          value: "Wise_Woman" },
{ label: "voices.james_professional_clear",    value: "Patient_Man" },
{ label: "voices.sofia_elegant_sophisticated", value: "Calm_Woman" },
{ label: "voices.marcus_deep_authoritative",   value: "Deep_Voice_Man" },
{ label: "voices.oliver_energetic_upbeat",     value: "Casual_Guy" },
{ label: "voices.isabella_calm_soothing",      value: "Lovely_Girl" },
{ label: "voices.noah_confident_strong",       value: "Determined_Man" },
// 10 additional raw voices (use existing voices.* keys already in en.json)
{ label: "voices.friendly_person",   value: "Friendly_Person" },
{ label: "voices.inspirational_girl",value: "Inspirational_girl" },
{ label: "voices.lively_girl",       value: "Lively_Girl" },
{ label: "voices.young_knight",      value: "Young_Knight" },
{ label: "voices.decent_boy",        value: "Decent_Boy" },
{ label: "voices.imposing_manner",   value: "Imposing_Manner" },
{ label: "voices.elegant_man",       value: "Elegant_Man" },
{ label: "voices.abbess",            value: "Abbess" },
{ label: "voices.sweet_girl_2",      value: "Sweet_Girl_2" },
{ label: "voices.exuberant_girl",    value: "Exuberant_Girl" },
```

**i18n**: All curated voice keys already exist in `en.json`. No new keys need to be added for Task 43.5 itself. Verify the raw voice IDs (10 additional) also have matching `voices.*` entries in en.json before seeding.

> **Known asymmetry**: `MINIMAX_VOICES` maps "Luna - Soft & Romantic" to `Calm_Woman` — the same ID as Sofia. `en.json` has a `voices.luna_soft_romantic` key (line 1494) which remains orphaned in the mini-app (not seeded). This is intentional — no duplicate API IDs in the mini-app. Document in code comment.

**QA**: `npx tsc --noEmit` + `npx biome check --write` + `pnpm translate` + `node scripts/verify-translations.js`

---

### Task 43.7 — Add ElevenLabs TTS models (`elevenlabs/tts/turbo-v2.5` + `elevenlabs/tts/eleven-v3`)

**Priority**: P1 — Directly referenced in Discussion #150 as premium cinematic voice option
**Files**: `convex/actions/voiceToolGeneric.ts`, `convex/seed/seedVoiceModels.ts`, `messages/en.json` + 6 locales

**Confirmed fal.ai endpoints** (verified at `fal.ai/explore/search?q=elevenlabs`):
- `elevenlabs/tts/turbo-v2.5` — "Generate high-speed text-to-speech audio using ElevenLabs TTS Turbo v2.5" — fast, cost-effective
- `elevenlabs/tts/eleven-v3` — "Generate text-to-speech audio using Eleven-v3 from ElevenLabs" — highest quality, latest model

**Steps**:

1. **Verify API specs** for both endpoints at:
   - `https://fal.ai/models/elevenlabs/tts/turbo-v2.5/api`
   - `https://fal.ai/models/elevenlabs/tts/eleven-v3/api`
   - Key params to check: `text` key name, `voice_id` options, output shape (`audio.url` vs `audio_file.url`)

2. **Add `voiceToolGeneric.ts` branch** for ElevenLabs — the action's if/else chain needs an ElevenLabs branch (same pattern as Chatterbox in Task 43.2):

```typescript
} else if (schema.modelId.includes("elevenlabs")) {
    // ElevenLabs: flat structure, uses `text` key
    if (rawParams.text) falParams.text = rawParams.text;
    if (rawParams.voice_id) falParams.voice_id = rawParams.voice_id;
    // Add any additional ElevenLabs-specific params per API spec
}
```

3. **Add credit cost rows** in `seedVoiceModels.ts` — add to `voiceCreditActionTypes` and insert:
   ```typescript
   "voice_generation_elevenlabs_turbo",   // ~5 credits — fast/cost-effective
   "voice_generation_elevenlabs_v3",      // ~8 credits — highest quality
   ```

4. **Add schemas** for both models to `seedVoiceModels.ts` with appropriate params, badges (`["PREMIUM", "CINEMATIC"]` for Eleven v3, `["FAST", "HD"]` for Turbo), and capabilities derived from API spec.

5. **i18n keys** to add:
   ```json
   "voice_models": {
     "elevenlabs_turbo": "ElevenLabs Turbo",
     "elevenlabs_turbo_desc": "High-speed cinematic voice synthesis",
     "elevenlabs_v3": "ElevenLabs Eleven v3",
     "elevenlabs_v3_desc": "Premium quality storytelling voice"
   }
   ```
   Plus any new `voice_generator.settings.*` keys required by the ElevenLabs API params.

**QA**: `npx tsc --noEmit` + `npx biome check --write` + `pnpm translate` + `node scripts/verify-translations.js`

---

### Task 43.8 — Final QA, seed re-run, and Convex deploy

**Priority**: P0 — Gate before merge
**Files**: All modified files

```bash
npx tsc --noEmit                                          # 0 errors
npx biome check --write .                                 # 0 errors
pnpm translate                                            # regenerate all 7 locales
node scripts/verify-translations.js                      # all locales in sync
npx convex run seed/seedVoiceModels:seedVoiceModels       # re-seed (idempotent)
npx convex dev --once                                     # deploy schema changes
```

Verify via Convex MCP:
- `voiceModelSchemas` table has ≥ 4 records (MiniMax HD, Turbo, Qwen, Chatterbox + optionally MiniMax 02 HD)
- Each MiniMax model has 37 language options in `language_boost`
- Each voice option in MiniMax has the curated display name label
- `creditCosts` table has `voice_generation_chatterbox` row

---

## 📊 Out of Scope (explicitly deferred)

| Item | Reason |
|---|---|
| **ElevenLabs TTS** | ~~Deferred~~ — **now included as Task 43.7**. Confirmed at `fal.ai/explore/search?q=elevenlabs`: `elevenlabs/tts/turbo-v2.5` and `elevenlabs/tts/eleven-v3` are both live. |
| Orpheus TTS | Not found in fal.ai catalog as of 2026-03-13 — add once endpoint is confirmed |
| Step 4 guided flow integration | Architectural change, requires dedicated sprint — Step 4 has its own TTS logic that works correctly; embedding `VoiceGenerator` component would require full refactor of narration generation flow |
| Music + voice mix | Significant complexity — separate sprint |
| Voice cloning friendly UX | Qwen already has technical capability in advanced params; a dedicated UI redesign for "Clone Your Voice" is tracked for Sprint 44 |

---

## ✅ Definition of Done

- [ ] `previewUrl` field added to Convex schema + seeded for all MiniMax voices
- [ ] Play preview button visible in VoiceSettingsPanel/FloatingOptionsPanel per voice option
- [ ] Chatterbox TTS model active in `voiceModelSchemas` (4+ records)
- [ ] `voice_generation_chatterbox` credit cost row in Convex dev
- [ ] MiniMax HD and Turbo `language_boost` expanded to 37 languages
- [ ] All MiniMax voice IDs show curated storytelling names (not raw API IDs)
- [ ] MiniMax Speech 02 HD added (or explicitly documented as blocked by API spec difference)
- [ ] ElevenLabs Turbo v2.5 + Eleven v3 active in `voiceModelSchemas`
- [ ] `voice_generation_elevenlabs_turbo` + `voice_generation_elevenlabs_v3` credit cost rows in Convex dev
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npx biome check` — 0 errors
- [ ] `pnpm translate` — all 7 locales regenerated
- [ ] `node scripts/verify-translations.js` — all locales in sync
- [ ] Seed re-run confirmed via Convex MCP

---

## 🕐 Time Estimates (with buffer)

| Task | Core work | Buffer (25%) | Total |
|---|---|---|---|
| 43.1 — Voice preview clips (incl. CDN decision spike) | 4.5h | 0.5h | **5h** |
| 43.2 — Chatterbox TTS + `voiceToolGeneric.ts` branch | 3.5h | 1h | **4.5h** |
| 43.3 — MiniMax Speech 02 HD (conditional) | 2h | 0.5h | **2.5h** |
| 43.4 — Language boost (26 missing i18n keys + 37 langs) | 2.5h | 0.5h | **3h** |
| 43.5 — Curated voice names | 2h | 0.5h | **2.5h** |
| 43.7 — ElevenLabs Turbo v2.5 + Eleven v3 | 4h | 1h | **5h** |
| 43.8 — Final QA + deploy | 1h | 0.25h | **1.25h** |
| **Total** | **19.5h** | **4.25h** | **~24h** |

> Buffer rationale: Task 43.1 requires CDN setup pre-decision (30min) + generating 26 audio clips. Tasks 43.2 and 43.7 each require a concrete `voiceToolGeneric.ts` routing branch. Task 43.3 is conditional on schema compatibility. Task 43.4 has 26 missing i18n keys. Task 43.7 covers two ElevenLabs models with API spec verification.
