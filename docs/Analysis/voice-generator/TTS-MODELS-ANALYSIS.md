# 🎙️ TTS Models Analysis & Schema Design

**Created**: February 18, 2026  
**Version**: 1.2  
**Status**: Ready for Implementation  
**Purpose**: Define TTS model schemas for zero-code voice model onboarding

---

## 📋 Document Purpose

This document provides:
1. **Comprehensive analysis** of available TTS models via fal.ai
2. **Schema design** for `voiceModelSchemas` Convex table
3. **Backend configuration** for FAL API integration
4. **UI parameter mappings** for dynamic form rendering
5. **Credit cost calculations** per model

**Architecture Pattern**: Mirrors `IMAGE-MODELS-ANALYSIS.md` for consistency.

---

## 🎯 Schema Design Principles

### 1. Zero-Code Model Onboarding
- Add new voice model = Add row to `voiceModelSchemas` table
- No code changes required for new models
- Admin can manage via Convex dashboard or seed script

### 2. Dynamic UI Generation
- UI controls render from `params[]` array
- DynamicField component handles all control types
- Voice settings, emotions, speeds all schema-driven

### 3. Backend Parameter Filtering
- `allowedParams` whitelist prevents invalid FAL API calls
- `maxPromptLength` enforces per-model limits
- Parameter validation happens in generic action

### 4. Credit System Integration
- `creditActionType` links to `creditCosts` table
- Admin-configurable pricing per model
- No hardcoded costs in frontend or backend

---

## 🎙️ TTS Model Catalog

### Model 1: MiniMax Speech 2.8 HD

**FAL Model ID**: `fal-ai/minimax/speech-2.8-hd`  
**Category**: High-quality speech synthesis  
**Pricing**: $0.1 per 1000 characters (~5 credits)  
**Use Case**: Premium quality narration, professional content

#### Capabilities
- ✅ Emotion control (7 emotions)
- ✅ Pitch control (-12 to +12 semitones)
- ✅ Speed control (0.5x - 2.0x)
- ✅ Volume control (0.01 - 10)
- ✅ Advanced voice modification (intensity, timbre, pitch)
- ✅ Multi-language support (38+ languages)
- ✅ Custom pronunciation dictionary
- ✅ Interjection tags (laughs, sighs, coughs, etc.)
- ✅ Pause control (`<#x#>` syntax)
- ✅ Loudness normalization
- ✅ High-quality audio (up to 44.1kHz, stereo)
- ❌ Voice cloning (not available)
- ❌ Real-time streaming (not available)

#### Available Voices (17 preset voices)
1. `Wise_Woman` - Mature, knowledgeable female voice
2. `Friendly_Person` - Warm, approachable voice
3. `Inspirational_girl` - Energetic, motivating young female
4. `Deep_Voice_Man` - Rich, resonant male voice
5. `Calm_Woman` - Peaceful, soothing female voice
6. `Casual_Guy` - Relaxed, informal male voice
7. `Lively_Girl` - Animated, cheerful young female
8. `Patient_Man` - Steady, composed male voice
9. `Young_Knight` - Heroic, youthful male voice
10. `Determined_Man` - Strong-willed, resolute male voice
11. `Lovely_Girl` - Sweet, gentle young female
12. `Decent_Boy` - Polite, well-mannered young male
13. `Imposing_Manner` - Authoritative, commanding voice
14. `Elegant_Man` - Refined, sophisticated male voice
15. `Abbess` - Wise, spiritual female voice
16. `Sweet_Girl_2` - Gentle, charming young female
17. `Exuberant_Girl` - Enthusiastic, vibrant young female

#### Technical Specifications
- **Max Prompt Length**: 10,000 characters
- **Audio Formats**: MP3, PCM, FLAC
- **Sample Rates**: 8kHz, 16kHz, 22.05kHz, 24kHz, 32kHz, 44.1kHz
- **Channels**: Mono (1) or Stereo (2)
- **Bitrates**: 32kbps, 64kbps, 128kbps, 256kbps
- **Default Quality**: 32kHz, 128kbps, Mono, MP3

---

### Model 2: MiniMax Speech 2.8 Turbo

**FAL Model ID**: `fal-ai/minimax/speech-2.8-turbo`  
**Category**: Fast speech synthesis  
**Pricing**: $0.06 per 1000 characters (~3 credits)  
**Use Case**: Rapid prototyping, high-volume generation, cost-effective narration

#### Capabilities
- ✅ Emotion control (7 emotions) - **Same as HD**
- ✅ Pitch control (-12 to +12 semitones) - **Same as HD**
- ✅ Speed control (0.5x - 2.0x) - **Same as HD**
- ✅ Volume control (0.01 - 10) - **Same as HD**
- ✅ Advanced voice modification (intensity, timbre, pitch) - **Same as HD**
- ✅ Multi-language support (38+ languages) - **Same as HD**
- ✅ Custom pronunciation dictionary - **Same as HD**
- ✅ Interjection tags (laughs, sighs, coughs, etc.) - **Same as HD**
- ✅ Pause control (`<#x#>` syntax) - **Same as HD**
- ✅ Loudness normalization - **Same as HD**
- ✅ High-quality audio (up to 44.1kHz, stereo) - **Same as HD**
- ⚡ **Faster generation time** - **Key Advantage**
- 💰 **40% cheaper** - **Key Advantage**
- ❌ Voice cloning (not available)
- ❌ Real-time streaming (not available)

#### Available Voices
**Same 17 preset voices as HD model** - No difference in voice selection

#### Technical Specifications
**Identical to HD model**:
- **Max Prompt Length**: 10,000 characters
- **Audio Formats**: MP3, PCM, FLAC
- **Sample Rates**: 8kHz, 16kHz, 22.05kHz, 24kHz, 32kHz, 44.1kHz
- **Channels**: Mono (1) or Stereo (2)
- **Bitrates**: 32kbps, 64kbps, 128kbps, 256kbps
- **Default Quality**: 32kHz, 128kbps, Mono, MP3

#### HD vs Turbo Comparison

| Aspect | HD | Turbo |
|--------|----|----|
| **Quality** | Highest | High (slight quality trade-off) |
| **Speed** | Standard | **40-60% faster** ⚡ |
| **Price** | $0.10/1k chars | **$0.06/1k chars** 💰 |
| **Credits** | 5 per 1k chars | **3 per 1k chars** |
| **Features** | All features | **Same features** |
| **Voices** | 17 voices | **Same 17 voices** |
| **Max Length** | 10k chars | **Same 10k chars** |
| **Use Case** | Premium content | **Rapid iteration, high volume** |

**Recommendation**: Start with **Turbo** for drafts/testing, use **HD** for final production.

---

### Model 3: Qwen 3 TTS (1.7B)

**FAL Model ID**: `fal-ai/qwen-3-tts/text-to-speech/1.7b`  
**Category**: Text-to-speech with voice cloning  
**Pricing**: $0.09 per 1000 characters (~4.5 credits)  
**Use Case**: Custom voice cloning, multi-language synthesis, budget-friendly alternative with unique capabilities

#### Capabilities
- ✅ **Voice cloning** - **UNIQUE FEATURE** 🎯
  - Clone any voice via `fal-ai/qwen-3-tts/clone-voice` endpoint
  - Use cloned voice for synthesis with speaker embedding
- ✅ Style prompt control (e.g., "Very happy", "Serious tone")
- ❌ Emotion control (no predefined emotions like MiniMax)
- ❌ Pitch control (no direct pitch adjustment)
- ❌ Speed control (no speed parameter)
- ❌ Volume control (no volume parameter)
- ✅ Advanced sampling controls (top_k, top_p, temperature, repetition_penalty)
- ✅ Sub-talker sampling (for multi-speaker scenarios)
- ✅ Multi-language support (11 languages)
- ❌ Custom pronunciation dictionary
- ❌ Interjection tags
- ❌ Pause control
- ❌ Loudness normalization
- ✅ Standard audio quality (24kHz, mono)
- ✅ **Voice cloning** (via companion endpoint)
- ❌ Real-time streaming

#### Available Voices (9 preset voices)
1. `Vivian` - Female voice
2. `Serena` - Female voice
3. `Uncle_Fu` - Male voice (Chinese-focused)
4. `Dylan` - Male voice
5. `Eric` - Male voice
6. `Ryan` - Male voice
7. `Aiden` - Male voice
8. `Ono_Anna` - Female voice (Japanese-focused)
9. `Sohee` - Female voice (Korean-focused)

**Note**: Each voice has a primary language it supports best. See [Qwen3-TTS documentation](https://github.com/QwenLM/Qwen3-TTS) for details.

#### Technical Specifications
- **Max Prompt Length**: ~8000 characters (estimated based on max_new_tokens)
- **Max Tokens**: 1-8192 codec tokens (default 200)
- **Audio Format**: MP3 (auto-generated)
- **Sample Rate**: 24kHz (fixed)
- **Channels**: Mono (1 channel, fixed)
- **Bitrate**: Auto (typically 128kbps for MP3)
- **Default Quality**: 24kHz, Mono, MP3

#### Voice Cloning Workflow
1. **Clone Voice**: Call `fal-ai/qwen-3-tts/clone-voice` with reference audio
2. **Get Embedding**: Receive speaker embedding file URL (safetensors format)
3. **Synthesize**: Use embedding URL in `speaker_voice_embedding_file_url` parameter
4. **Optional**: Provide `reference_text` for better quality

#### Unique Features
- **Style Prompts**: Guide synthesis with text prompts (e.g., "Very happy", "Whispering")
- **Voice Cloning**: Create custom voices from audio samples
- **Advanced Sampling**: Fine-tune generation with ML sampling parameters (top_k, top_p, temperature)
- **Sub-talker Control**: Adjust multi-speaker scenarios
- **Language Auto-detection**: Automatic language recognition

#### Limitations vs MiniMax
- ❌ No direct speed/pitch/volume controls
- ❌ No emotion presets (use style prompts instead)
- ❌ No interjection tags or pause control
- ❌ Lower audio quality (24kHz vs 44.1kHz)
- ❌ Mono only (no stereo)
- ⚠️ More complex parameter tuning required
- ⚠️ Voice cloning requires 2-step process

#### Advantages vs MiniMax
- ✅ **Voice cloning capability** (unique to this model)
- ✅ Between HD and Turbo pricing ($0.09 vs $0.10/$0.06)
- ✅ Style prompt flexibility (natural language guidance)
- ✅ Advanced ML sampling controls for fine-tuning
- ✅ Good for custom brand voices
- ✅ Sub-talker sampling for complex scenarios

---

## 📊 Convex Schema: Model Configurations

### Model 1: MiniMax Speech 2.8 HD

```typescript
{
  // ─── Identifiers ───
  schemaId: "minimax-speech-28-hd",
  name: "MiniMax Speech 2.8 HD",
  nameTranslationKey: "voice_models.minimax_28_hd",
  
  // ─── FAL Config ───
  modelId: "fal-ai/minimax/speech-2.8-hd",
  type: "tts",
  
  // ─── Credit System ───
  creditActionType: "voice_generation_minimax_28_hd",
  
  // ─── UI Capabilities (drives feature visibility) ───
  capabilities: {
    emotionControl: true,
    pitchControl: true,
    speedControl: true,
    volumeControl: true,
    voiceModification: true,
    multiLanguage: true,
    customPronunciation: true,
    interjections: true,
    pauseControl: true,
    loudnessNormalization: true,
    highQualityAudio: true,
    voiceCloning: false,
    streaming: false,
  },
  
  // ─── UI Badges ───
  badges: ["HD", "PRO", "MULTILINGUAL"],
  
  // ─── UI Parameters (dynamic form) ───
  params: [
    // Primary Text Input
    {
      key: "prompt",
      control: "textarea",
      label: "voice_generator.prompt_label",
      placeholder: "voice_generator.prompt_placeholder",
      maxLength: 10000,
      minLength: 1,
      rows: 6,
      required: true,
      advanced: false,
      hint: "voice_generator.prompt_hint_minimax", // Supports <#x#> pauses and (laughs) tags
    },
    
    // Voice Selection
    {
      key: "voice_setting.voice_id",
      control: "select",
      label: "voice_generator.voice_id_label",
      placeholder: "voice_generator.voice_id_placeholder",
      default: "Wise_Woman",
      required: true,
      advanced: false,
      options: [
        { value: "Wise_Woman", label: "voices.wise_woman", previewUrl: "https://..." },
        { value: "Friendly_Person", label: "voices.friendly_person", previewUrl: "https://..." },
        { value: "Inspirational_girl", label: "voices.inspirational_girl", previewUrl: "https://..." },
        { value: "Deep_Voice_Man", label: "voices.deep_voice_man", previewUrl: "https://..." },
        { value: "Calm_Woman", label: "voices.calm_woman", previewUrl: "https://..." },
        { value: "Casual_Guy", label: "voices.casual_guy", previewUrl: "https://..." },
        { value: "Lively_Girl", label: "voices.lively_girl", previewUrl: "https://..." },
        { value: "Patient_Man", label: "voices.patient_man", previewUrl: "https://..." },
        { value: "Young_Knight", label: "voices.young_knight", previewUrl: "https://..." },
        { value: "Determined_Man", label: "voices.determined_man", previewUrl: "https://..." },
        { value: "Lovely_Girl", label: "voices.lovely_girl", previewUrl: "https://..." },
        { value: "Decent_Boy", label: "voices.decent_boy", previewUrl: "https://..." },
        { value: "Imposing_Manner", label: "voices.imposing_manner", previewUrl: "https://..." },
        { value: "Elegant_Man", label: "voices.elegant_man", previewUrl: "https://..." },
        { value: "Abbess", label: "voices.abbess", previewUrl: "https://..." },
        { value: "Sweet_Girl_2", label: "voices.sweet_girl_2", previewUrl: "https://..." },
        { value: "Exuberant_Girl", label: "voices.exuberant_girl", previewUrl: "https://..." },
      ],
    },
    
    // Speed Control
    {
      key: "voice_setting.speed",
      control: "slider",
      label: "voice_generator.settings.speed_label",
      hint: "voice_generator.settings.speed_hint",
      min: 0.5,
      max: 2.0,
      step: 0.1,
      default: 1.0,
      required: false,
      advanced: false,
      unit: "x",
    },
    
    // Pitch Control
    {
      key: "voice_setting.pitch",
      control: "slider",
      label: "voice_generator.settings.pitch_label",
      hint: "voice_generator.settings.pitch_hint",
      min: -12,
      max: 12,
      step: 1,
      default: 0,
      required: false,
      advanced: false,
      unit: "semitones",
    },
    
    // Volume Control
    {
      key: "voice_setting.vol",
      control: "slider",
      label: "voice_generator.settings.volume_label",
      hint: "voice_generator.settings.volume_hint",
      min: 0.01,
      max: 10,
      step: 0.1,
      default: 1.0,
      required: false,
      advanced: false,
    },
    
    // Emotion Control
    {
      key: "voice_setting.emotion",
      control: "select",
      label: "voice_generator.settings.emotion_label",
      hint: "voice_generator.settings.emotion_hint",
      required: false,
      advanced: false,
      options: [
        { value: "neutral", label: "voice_generator.settings.emotion_neutral" },
        { value: "happy", label: "voice_generator.settings.emotion_happy" },
        { value: "sad", label: "voice_generator.settings.emotion_sad" },
        { value: "angry", label: "voice_generator.settings.emotion_angry" },
        { value: "fearful", label: "voice_generator.settings.emotion_fearful" },
        { value: "disgusted", label: "voice_generator.settings.emotion_disgusted" },
        { value: "surprised", label: "voice_generator.settings.emotion_surprised" },
      ],
    },
    
    // ─── Advanced Settings ───
    
    // English Normalization
    {
      key: "voice_setting.english_normalization",
      control: "toggle",
      label: "voice_generator.settings.english_normalization_label",
      hint: "voice_generator.settings.english_normalization_hint",
      default: false,
      required: false,
      advanced: true,
    },
    
    // Language Boost
    {
      key: "language_boost",
      control: "select",
      label: "voice_generator.settings.language_boost_label",
      hint: "voice_generator.settings.language_boost_hint",
      default: "auto",
      required: false,
      advanced: true,
      options: [
        { value: "auto", label: "voice_generator.languages.auto" },
        { value: "English", label: "voice_generator.languages.english" },
        { value: "Chinese", label: "voice_generator.languages.chinese" },
        { value: "Spanish", label: "voice_generator.languages.spanish" },
        { value: "French", label: "voice_generator.languages.french" },
        { value: "German", label: "voice_generator.languages.german" },
        { value: "Japanese", label: "voice_generator.languages.japanese" },
        { value: "Korean", label: "voice_generator.languages.korean" },
        // ... 30+ more languages
      ],
    },
    
    // Audio Format
    {
      key: "audio_setting.format",
      control: "select",
      label: "voice_generator.settings.audio_format_label",
      default: "mp3",
      required: false,
      advanced: true,
      options: [
        { value: "mp3", label: "MP3" },
        { value: "pcm", label: "PCM" },
        { value: "flac", label: "FLAC" },
      ],
    },
    
    // Sample Rate
    {
      key: "audio_setting.sample_rate",
      control: "select",
      label: "voice_generator.settings.sample_rate_label",
      default: 32000,
      required: false,
      advanced: true,
      options: [
        { value: "8000", label: "8 kHz" },
        { value: "16000", label: "16 kHz" },
        { value: "22050", label: "22.05 kHz" },
        { value: "24000", label: "24 kHz" },
        { value: "32000", label: "32 kHz (Default)" },
        { value: "44100", label: "44.1 kHz (HD)" },
      ],
    },
    
    // Channels
    {
      key: "audio_setting.channel",
      control: "select",
      label: "voice_generator.settings.channels_label",
      default: 1,
      required: false,
      advanced: true,
      options: [
        { value: "1", label: "Mono" },
        { value: "2", label: "Stereo" },
      ],
    },
    
    // Bitrate
    {
      key: "audio_setting.bitrate",
      control: "select",
      label: "voice_generator.settings.bitrate_label",
      default: 128000,
      required: false,
      advanced: true,
      options: [
        { value: "32000", label: "32 kbps" },
        { value: "64000", label: "64 kbps" },
        { value: "128000", label: "128 kbps (Default)" },
        { value: "256000", label: "256 kbps (High Quality)" },
      ],
    },
    
    // Voice Modification - Pitch
    {
      key: "voice_modify.pitch",
      control: "slider",
      label: "voice_generator.settings.voice_modify_pitch_label",
      hint: "voice_generator.settings.voice_modify_pitch_hint",
      min: -100,
      max: 100,
      step: 1,
      default: 0,
      required: false,
      advanced: true,
    },
    
    // Voice Modification - Intensity
    {
      key: "voice_modify.intensity",
      control: "slider",
      label: "voice_generator.settings.voice_modify_intensity_label",
      hint: "voice_generator.settings.voice_modify_intensity_hint",
      min: -100,
      max: 100,
      step: 1,
      default: 0,
      required: false,
      advanced: true,
    },
    
    // Voice Modification - Timbre
    {
      key: "voice_modify.timbre",
      control: "slider",
      label: "voice_generator.settings.voice_modify_timbre_label",
      hint: "voice_generator.settings.voice_modify_timbre_hint",
      min: -100,
      max: 100,
      step: 1,
      default: 0,
      required: false,
      advanced: true,
    },
    
    // Loudness Normalization
    {
      key: "normalization_setting.enabled",
      control: "toggle",
      label: "voice_generator.settings.normalization_enabled_label",
      hint: "voice_generator.settings.normalization_enabled_hint",
      default: true,
      required: false,
      advanced: true,
    },
    
    // Target Loudness
    {
      key: "normalization_setting.target_loudness",
      control: "slider",
      label: "voice_generator.settings.target_loudness_label",
      hint: "voice_generator.settings.target_loudness_hint",
      min: -70,
      max: -10,
      step: 1,
      default: -18,
      required: false,
      advanced: true,
      showWhen: {
        param: "normalization_setting.enabled",
        value: true,
      },
    },
  ],
  
  // ─── Backend Config ───
  allowedParams: [
    "prompt",
    "voice_setting",
    "audio_setting",
    "language_boost",
    "output_format",
    "voice_modify",
    "normalization_setting",
  ],
  
  // Conditional params (only sent if conditions met)
  conditionalParams: [
    {
      param: "normalization_setting.target_loudness",
      showWhen: {
        param: "normalization_setting.enabled",
        value: true,
      },
    },
  ],
  
  maxPromptLength: 10000,
  
  // ─── Metadata ───
  sortOrder: 10,
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
```

---

### Model 2: MiniMax Speech 2.8 Turbo

**Complete schema is identical to HD model** except for:

```typescript
{
  // ─── Identifiers ─── (DIFFERENT)
  schemaId: "minimax-speech-28-turbo",
  name: "MiniMax Speech 2.8 Turbo",
  nameTranslationKey: "voice_models.minimax_28_turbo",
  
  // ─── FAL Config ─── (DIFFERENT)
  modelId: "fal-ai/minimax/speech-2.8-turbo",
  
  // ─── Credit System ─── (DIFFERENT)
  creditActionType: "voice_generation_minimax_28_turbo",
  
  // ─── UI Badges ─── (DIFFERENT)
  badges: ["FAST", "TURBO", "COST-EFFECTIVE"],
  
  // ─── Metadata ─── (DIFFERENT)
  sortOrder: 20,  // Show after HD model
  
  // ─── ALL OTHER FIELDS IDENTICAL ───
  // Same capabilities, params, voices, technical specs as HD
}
```

**Key Points**:
- **Same UI**: Turbo uses the exact same parameter configuration as HD
- **Same Voices**: All 17 voices available in both models
- **Same Features**: All advanced features (emotion, voice modify, etc.) work identically
- **Only Differences**: Model ID, credit cost, badges, sort order
- **DRY Approach**: Can extend from HD schema in seed script to avoid duplication

---

### Model 3: Qwen 3 TTS (1.7B)

**Different parameter structure** - requires separate schema:

```typescript
{
  // ─── Identifiers ───
  schemaId: "qwen-3-tts-17b",
  name: "Qwen 3 TTS",
  nameTranslationKey: "voice_models.qwen_3_tts",
  
  // ─── FAL Config ───
  modelId: "fal-ai/qwen-3-tts/text-to-speech/1.7b",
  type: "tts",
  
  // ─── Credit System ───
  creditActionType: "voice_generation_qwen_3",
  
  // ─── UI Capabilities ───
  capabilities: {
    voiceCloning: true,           // UNIQUE
    stylePrompts: true,           // UNIQUE
    emotionControl: false,
    pitchControl: false,
    speedControl: false,
    volumeControl: false,
    advancedSampling: true,       // UNIQUE
    subTalkerControl: true,       // UNIQUE
    multiLanguage: true,
    customPronunciation: false,
    interjections: false,
    pauseControl: false,
    loudnessNormalization: false,
    highQualityAudio: false,      // 24kHz vs 44.1kHz
    streaming: false,
  },
  
  // ─── UI Badges ───
  badges: ["VOICE CLONING", "CUSTOM VOICE"],
  
  // ─── UI Parameters ───
  params: [
    // Text Input
    {
      key: "text",
      control: "textarea",
      label: "voice_generator.text_label",
      placeholder: "voice_generator.text_placeholder",
      maxLength: 8000,  // Estimated
      minLength: 1,
      rows: 6,
      required: true,
      advanced: false,
    },
    
    // Style Prompt (UNIQUE)
    {
      key: "prompt",
      control: "text",
      label: "voice_generator.style_prompt_label",
      placeholder: "voice_generator.style_prompt_placeholder", // e.g., "Very happy"
      maxLength: 200,
      required: false,
      advanced: false,
      hint: "voice_generator.style_prompt_hint", // Guide synthesis style
    },
    
    // Voice Selection (9 voices)
    {
      key: "voice",
      control: "select",
      label: "voice_generator.voice_id_label",
      default: "Vivian",
      required: false,
      advanced: false,
      options: [
        { value: "Vivian", label: "voices.qwen_vivian" },
        { value: "Serena", label: "voices.qwen_serena" },
        { value: "Uncle_Fu", label: "voices.qwen_uncle_fu" },
        { value: "Dylan", label: "voices.qwen_dylan" },
        { value: "Eric", label: "voices.qwen_eric" },
        { value: "Ryan", label: "voices.qwen_ryan" },
        { value: "Aiden", label: "voices.qwen_aiden" },
        { value: "Ono_Anna", label: "voices.qwen_ono_anna" },
        { value: "Sohee", label: "voices.qwen_sohee" },
      ],
    },
    
    // Language Selection (11 languages)
    {
      key: "language",
      control: "select",
      label: "voice_generator.language_label",
      default: "Auto",
      required: false,
      advanced: false,
      options: [
        { value: "Auto", label: "voice_generator.languages.auto" },
        { value: "English", label: "voice_generator.languages.english" },
        { value: "Chinese", label: "voice_generator.languages.chinese" },
        { value: "Spanish", label: "voice_generator.languages.spanish" },
        { value: "French", label: "voice_generator.languages.french" },
        { value: "German", label: "voice_generator.languages.german" },
        { value: "Italian", label: "voice_generator.languages.italian" },
        { value: "Japanese", label: "voice_generator.languages.japanese" },
        { value: "Korean", label: "voice_generator.languages.korean" },
        { value: "Portuguese", label: "voice_generator.languages.portuguese" },
        { value: "Russian", label: "voice_generator.languages.russian" },
      ],
    },
    
    // ─── Voice Cloning (UNIQUE) ───
    {
      key: "speaker_voice_embedding_file_url",
      control: "text",
      label: "voice_generator.voice_embedding_url_label",
      placeholder: "voice_generator.voice_embedding_url_placeholder",
      required: false,
      advanced: true,
      hint: "voice_generator.voice_embedding_url_hint", // From clone-voice endpoint
    },
    
    {
      key: "reference_text",
      control: "textarea",
      label: "voice_generator.reference_text_label",
      placeholder: "voice_generator.reference_text_placeholder",
      rows: 3,
      required: false,
      advanced: true,
      hint: "voice_generator.reference_text_hint", // Improves cloned voice quality
      showWhen: {
        param: "speaker_voice_embedding_file_url",
        value: "!empty", // Show only if embedding URL is provided
      },
    },
    
    // ─── Advanced Sampling (UNIQUE) ───
    {
      key: "temperature",
      control: "slider",
      label: "voice_generator.temperature_label",
      hint: "voice_generator.temperature_hint", // Higher = more random
      min: 0,
      max: 1,
      step: 0.1,
      default: 0.9,
      required: false,
      advanced: true,
    },
    
    {
      key: "top_k",
      control: "number",
      label: "voice_generator.top_k_label",
      hint: "voice_generator.top_k_hint",
      min: 0,
      default: 50,
      required: false,
      advanced: true,
    },
    
    {
      key: "top_p",
      control: "slider",
      label: "voice_generator.top_p_label",
      hint: "voice_generator.top_p_hint",
      min: 0,
      max: 1,
      step: 0.1,
      default: 1.0,
      required: false,
      advanced: true,
    },
    
    {
      key: "repetition_penalty",
      control: "slider",
      label: "voice_generator.repetition_penalty_label",
      hint: "voice_generator.repetition_penalty_hint",
      min: 0,
      max: 2,
      step: 0.05,
      default: 1.05,
      required: false,
      advanced: true,
    },
    
    {
      key: "max_new_tokens",
      control: "number",
      label: "voice_generator.max_tokens_label",
      hint: "voice_generator.max_tokens_hint",
      min: 1,
      max: 8192,
      default: 200,
      required: false,
      advanced: true,
    },
    
    // Sub-talker controls (collapsed by default)
    {
      key: "subtalker_dosample",
      control: "toggle",
      label: "voice_generator.subtalker_enabled_label",
      default: true,
      required: false,
      advanced: true,
    },
  ],
  
  // ─── Backend Config ───
  allowedParams: [
    "text",
    "prompt",
    "voice",
    "language",
    "speaker_voice_embedding_file_url",
    "reference_text",
    "top_k",
    "top_p",
    "temperature",
    "repetition_penalty",
    "subtalker_dosample",
    "subtalker_top_k",
    "subtalker_top_p",
    "subtalker_temperature",
    "max_new_tokens",
  ],
  
  // Conditional params
  conditionalParams: [
    {
      param: "reference_text",
      showWhen: {
        param: "speaker_voice_embedding_file_url",
        value: "!empty",
      },
    },
  ],
  
  maxPromptLength: 8000,  // Estimated
  
  // ─── Metadata ───
  sortOrder: 30,  // Show after MiniMax models
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
```

**Key Differences from MiniMax**:
- **Different parameter structure** (flat params vs nested voice_setting)
- **Voice cloning parameters** (speaker_voice_embedding_file_url, reference_text)
- **Style prompts** instead of emotion presets
- **Advanced ML sampling** (temperature, top_k, top_p)
- **No speed/pitch/volume** controls
- **Fixed audio quality** (24kHz mono)

---

## 💰 Credit Cost Configuration

### MiniMax Speech 2.8 HD

**FAL Pricing**: $0.1 per 1000 characters

**Credit Cost Calculation**:
- Average word = 5 characters
- 1000 characters = ~200 words
- $0.1 = ~5 credits (assuming $0.02 per credit)

**Recommended Credit Cost**:
```typescript
{
  actionType: "voice_generation_minimax_28_hd",
  costInCredits: 5,  // Per 1000 characters
  description: "MiniMax Speech 2.8 HD (per 1000 characters)",
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
```

---

### MiniMax Speech 2.8 Turbo

**FAL Pricing**: $0.06 per 1000 characters (40% cheaper than HD)

**Credit Cost Calculation**:
- 1000 characters = ~200 words
- $0.06 = ~3 credits (assuming $0.02 per credit)

**Recommended Credit Cost**:
```typescript
{
  actionType: "voice_generation_minimax_28_turbo",
  costInCredits: 3,  // Per 1000 characters (40% cheaper)
  description: "MiniMax Speech 2.8 Turbo (per 1000 characters)",
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
```

**Pricing Comparison**:
- HD: 5 credits per 1k characters
- Turbo: 3 credits per 1k characters
- **Savings**: 2 credits per 1k characters (40% reduction)
- **Use Case**: Turbo is perfect for drafts, testing, and high-volume generation

**Alternative Pricing Strategy** (per generation):
- HD: 10 credits per generation (up to 10,000 characters)
- Turbo: 6 credits per generation (up to 10,000 characters)
- This simplifies UX (users don't need to count characters)

---

### Qwen 3 TTS (1.7B)

**FAL Pricing**: $0.09 per 1000 characters

**Credit Cost Calculation**:
- 1000 characters = ~200 words
- $0.09 = ~4.5 credits (assuming $0.02 per credit)
- **Rounded to 5 credits** (same as MiniMax HD for simplicity)

**Recommended Credit Cost**:
```typescript
{
  actionType: "voice_generation_qwen_3",
  costInCredits: 5,  // Per 1000 characters (rounded for simplicity)
  description: "Qwen 3 TTS 1.7B (per 1000 characters)",
  isActive: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
```

**Pricing Comparison (All Models)**:
- **MiniMax HD**: 5 credits per 1k chars ($0.10) - Highest quality
- **Qwen 3 TTS**: 5 credits per 1k chars ($0.09) - Voice cloning
- **MiniMax Turbo**: 3 credits per 1k chars ($0.06) - Best value

**Use Cases by Model**:
- **MiniMax HD**: Final production, premium content, highest quality audio
- **MiniMax Turbo**: Drafts, testing, high-volume, budget-conscious
- **Qwen 3 TTS**: Custom brand voices, voice cloning, unique style prompts

---

## 🔧 Backend Integration Pattern

### Generic Voice Action (voiceToolGeneric.ts)

```typescript
export const generateGenericVoice = internalAction({
  args: {
    modelId: v.string(),
    params: v.any(),
    transactionId: v.id("creditTransactions"),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get schema from Convex
    const schema = await ctx.runQuery(api.voiceModels.getByModelId, { 
      modelId: args.modelId 
    });
    
    if (!schema) {
      await ctx.runMutation(api.credits.refundCredits, {
        transactionId: args.transactionId,
        reason: `Unknown voice model: ${args.modelId}`,
      });
      throw new Error(`Unknown voice model: ${args.modelId}`);
    }
    
    // 2. Filter params via schema.allowedParams
    const rawParams = args.params as Record<string, unknown>;
    const filteredParams: Record<string, unknown> = {};
    
    for (const key of schema.allowedParams) {
      if (key in rawParams && rawParams[key] !== undefined) {
        filteredParams[key] = rawParams[key];
      }
    }
    
    // 3. Apply conditional param filtering
    if (schema.conditionalParams) {
      for (const cond of schema.conditionalParams) {
        const conditionMet = getNestedValue(filteredParams, cond.showWhen.param) === cond.showWhen.value;
        if (!conditionMet) {
          deleteNestedValue(filteredParams, cond.param);
        }
      }
    }
    
    // 4. Sanitize prompt length
    if (typeof filteredParams.prompt === "string") {
      filteredParams.prompt = filteredParams.prompt.slice(0, schema.maxPromptLength);
    }
    
    // 5. Call FAL API
    const result = await fal.subscribe(schema.modelId, {
      input: filteredParams,
    });
    
    // 6. Store audio
    const audioBlob = await downloadAudio(result.audio.url);
    const storageId = await ctx.storage.store(audioBlob);
    const audioUrl = await ctx.storage.getUrl(storageId);
    
    // 7. Save to voiceToolHistory
    await ctx.runMutation(api.voiceTool.saveGeneration, {
      userId: args.clerkUserId,
      modelId: schema.modelId,
      schemaId: schema.schemaId,
      prompt: filteredParams.prompt,
      voiceSettings: {
        voiceId: filteredParams.voice_setting?.voice_id || "Wise_Woman",
        speed: filteredParams.voice_setting?.speed || 1.0,
        pitch: filteredParams.voice_setting?.pitch || 0,
        emotion: filteredParams.voice_setting?.emotion || "neutral",
      },
      audioUrl,
      storageId,
      duration: result.duration_ms / 1000,
      mode: "generate",
    });
    
    return { 
      success: true, 
      audioUrl, 
      storageId,
      duration: result.duration_ms / 1000,
    };
  },
});
```

---

## 🎨 UI Control Mapping

### DynamicField Control Types

| Control Type | Used For | Example Param |
|--------------|----------|---------------|
| `textarea` | Long text input | `prompt` |
| `select` | Dropdown choices | `voice_id`, `emotion`, `language_boost` |
| `slider` | Numeric range | `speed`, `pitch`, `vol`, `voice_modify.*` |
| `toggle` | Boolean on/off | `english_normalization`, `normalization_setting.enabled` |
| `number` | Numeric input | N/A (use slider instead) |

### Nested Parameter Handling

**Frontend**: Flatten nested params for form state
```typescript
// Schema param key: "voice_setting.speed"
// Form state: params["voice_setting.speed"] = 1.2

// Before sending to backend:
const nestedParams = unflattenParams(params);
// Result: { voice_setting: { speed: 1.2 } }
```

**Backend**: FAL API expects nested structure
```typescript
{
  prompt: "Hello world",
  voice_setting: {
    speed: 1.2,
    pitch: 0,
    voice_id: "Wise_Woman",
    emotion: "happy"
  },
  audio_setting: {
    format: "mp3",
    sample_rate: 44100
  }
}
```

---

## 📋 i18n Keys Required

### MiniMax Voice Names (17 voices)

```json
{
  "voices": {
    "wise_woman": "Wise Woman",
    "friendly_person": "Friendly Person",
    "inspirational_girl": "Inspirational Girl",
    "deep_voice_man": "Deep Voice Man",
    "calm_woman": "Calm Woman",
    "casual_guy": "Casual Guy",
    "lively_girl": "Lively Girl",
    "patient_man": "Patient Man",
    "young_knight": "Young Knight",
    "determined_man": "Determined Man",
    "lovely_girl": "Lovely Girl",
    "decent_boy": "Decent Boy",
    "imposing_manner": "Imposing Manner",
    "elegant_man": "Elegant Man",
    "abbess": "Abbess",
    "sweet_girl_2": "Sweet Girl",
    "exuberant_girl": "Exuberant Girl"
  }
}
```

### Qwen 3 TTS Voice Names (9 voices)

```json
{
  "voices": {
    "qwen_vivian": "Vivian",
    "qwen_serena": "Serena",
    "qwen_uncle_fu": "Uncle Fu",
    "qwen_dylan": "Dylan",
    "qwen_eric": "Eric",
    "qwen_ryan": "Ryan",
    "qwen_aiden": "Aiden",
    "qwen_ono_anna": "Ono Anna",
    "qwen_sohee": "Sohee"
  }
}
```

### Emotions (7 emotions - MiniMax only)

```json
{
  "voice_generator": {
    "settings": {
      "emotion_neutral": "Neutral",
      "emotion_happy": "Happy",
      "emotion_sad": "Sad",
      "emotion_angry": "Angry",
      "emotion_fearful": "Fearful",
      "emotion_disgusted": "Disgusted",
      "emotion_surprised": "Surprised"
    }
  }
}
```

### Advanced Settings (MiniMax)

```json
{
  "voice_generator": {
    "settings": {
      "english_normalization_label": "English Normalization",
      "english_normalization_hint": "Improves number reading (slight latency increase)",
      "language_boost_label": "Language Boost",
      "language_boost_hint": "Enhance recognition of specific languages",
      "audio_format_label": "Audio Format",
      "sample_rate_label": "Sample Rate",
      "channels_label": "Channels",
      "bitrate_label": "Bitrate",
      "voice_modify_pitch_label": "Voice Pitch Modification",
      "voice_modify_pitch_hint": "Fine-tune voice pitch (-100 to 100)",
      "voice_modify_intensity_label": "Voice Intensity",
      "voice_modify_intensity_hint": "Adjust voice energy level",
      "voice_modify_timbre_label": "Voice Timbre",
      "voice_modify_timbre_hint": "Modify tonal quality",
      "normalization_enabled_label": "Enable Loudness Normalization",
      "normalization_enabled_hint": "Normalize audio loudness for consistency",
      "target_loudness_label": "Target Loudness",
      "target_loudness_hint": "Target loudness in LUFS (-70 to -10)"
    }
  }
}
```

### Qwen 3 TTS Specific Settings

```json
{
  "voice_generator": {
    "settings": {
      "style_prompt_label": "Style Prompt",
      "style_prompt_placeholder": "e.g., Very happy, Whispering, Serious tone",
      "style_prompt_hint": "Guide the style of generated speech",
      "voice_embedding_url_label": "Voice Embedding URL",
      "voice_embedding_url_placeholder": "https://storage.googleapis.com/...",
      "voice_embedding_url_hint": "Speaker embedding from clone-voice endpoint",
      "reference_text_label": "Reference Text",
      "reference_text_placeholder": "Original text used for voice cloning",
      "reference_text_hint": "Improves quality when using cloned voice",
      "temperature_label": "Temperature",
      "temperature_hint": "Higher = more random (0-1)",
      "top_k_label": "Top K",
      "top_k_hint": "Top-k sampling parameter",
      "top_p_label": "Top P",
      "top_p_hint": "Top-p sampling parameter (0-1)",
      "repetition_penalty_label": "Repetition Penalty",
      "repetition_penalty_hint": "Reduce repeated tokens/codes",
      "max_tokens_label": "Max Tokens",
      "max_tokens_hint": "Maximum codec tokens to generate (1-8192)",
      "subtalker_enabled_label": "Enable Sub-talker",
      "languages": {
        "auto": "Auto-detect",
        "english": "English",
        "chinese": "Chinese",
        "spanish": "Spanish",
        "french": "French",
        "german": "German",
        "italian": "Italian",
        "japanese": "Japanese",
        "korean": "Korean",
        "portuguese": "Portuguese",
        "russian": "Russian"
      }
    }
  },
  "voice_models": {
    "qwen_3_tts": "Qwen 3 TTS"
  }
}
```

---

## 🚀 Adding New TTS Models

### Step-by-Step Process

1. **Analyze FAL API Documentation**
   - Get OpenAPI schema
   - Identify required/optional params
   - Note max prompt length
   - Check pricing

2. **Design Schema Entry**
   - Choose `schemaId` (e.g., `"elevenlabs-tts"`)
   - Map FAL params to UI controls
   - Define capabilities flags
   - Set badges

3. **Add to Seed Script**
   ```typescript
   await ctx.db.insert("voiceModelSchemas", {
     schemaId: "elevenlabs-tts",
     modelId: "fal-ai/elevenlabs/tts",
     // ... full schema
   });
   ```

4. **Add Credit Cost**
   ```typescript
   await ctx.db.insert("creditCosts", {
     actionType: "voice_generation_elevenlabs",
     costInCredits: 10,
     // ...
   });
   ```

5. **Add i18n Keys**
   ```json
   {
     "voice_models": {
       "elevenlabs": "ElevenLabs TTS",
       "elevenlabs_desc": "Natural prosody and emotion"
     }
   }
   ```

6. **Test**
   - Model appears in UI automatically
   - Generate voice with all settings
   - Verify credit deduction
   - Check audio quality

**Zero code changes needed** ✅

---

## 📊 Model Comparison Matrix

| Feature | MiniMax 2.8 HD | MiniMax 2.8 Turbo | Qwen 3 TTS 1.7B | MiniMax 2.6 HD* | ElevenLabs* |
|---------|----------------|-------------------|-----------------|-----------------|-------------|
| **Generation Speed** | Standard | **⚡ 40-60% faster** | Standard | Standard | Fast |
| **Emotion Control** | 7 emotions | **7 emotions** | ❌ (style prompts) | ❌ | ✅ |
| **Pitch Control** | -12 to +12 | **-12 to +12** | ❌ | -12 to +12 | ❌ |
| **Speed Control** | 0.5x - 2.0x | **0.5x - 2.0x** | ❌ | 0.5x - 2.0x | ✅ |
| **Voice Modification** | ✅ (pitch, intensity, timbre) | **✅ (same)** | ❌ | ❌ | ✅ |
| **Voice Cloning** | ❌ | ❌ | **✅ Unique** 🎯 | ❌ | ✅ |
| **Custom Voices** | 17 presets | **17 presets** | 9 presets + cloning | 8 presets | 1000+ |
| **Multi-language** | 38+ languages | **38+ languages** | 11 languages + auto | ✅ | 29 languages |
| **Max Length** | 10,000 chars | **10,000 chars** | ~8,000 chars | 50,000 chars | 5,000 chars |
| **Audio Quality** | Up to 44.1kHz | **Up to 44.1kHz** | 24kHz mono | Up to 44.1kHz | Up to 44.1kHz |
| **Interjections** | ✅ | **✅** | ❌ | ❌ | ✅ |
| **Pause Control** | ✅ | **✅** | ❌ | ❌ | ✅ |
| **Advanced Sampling** | ❌ | ❌ | **✅ (top_k, top_p, temp)** | ❌ | ❌ |
| **Pricing** | $0.10/1k chars | **$0.06/1k chars** 💰 | $0.09/1k chars | $0.02/100 words | ~$0.30/1k chars |
| **Recommended Credits** | 5/1k chars | **3/1k chars** | 5/1k chars | 10/generation | 15/1k chars |
| **Quality Level** | ⭐⭐⭐⭐⭐ Highest | ⭐⭐⭐⭐ High | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Highest | ⭐⭐⭐⭐⭐ Highest |
| **Best For** | Final production | **Drafts, testing, volume** | **Custom brand voices** | Long-form | Premium voices |

*To be added in future iterations

### 🎯 Model Selection Guide

**Choose MiniMax 2.8 HD when:**
- Final production quality needed
- Professional narration for published content
- Maximum audio fidelity required
- Budget allows premium pricing

**Choose MiniMax 2.8 Turbo when:**
- Rapid prototyping and iteration
- Testing different voices/settings
- High-volume generation (100+ voices)
- Cost-effectiveness is priority
- Quality difference is acceptable (slight trade-off)

**Choose Qwen 3 TTS 1.7B when:**
- Custom brand voice needed (voice cloning)
- Unique vocal characteristics required
- Style prompt flexibility needed
- ML sampling fine-tuning desired
- Multi-speaker scenarios (sub-talker control)

**Recommendation for Voice Generator Mini App**:
- **Default**: MiniMax 2.8 Turbo (better UX with faster feedback)
- **Premium Option**: MiniMax 2.8 HD (toggle for "High Quality" mode)
- **Advanced Option**: Qwen 3 TTS (for voice cloning features)
- **Workflow**: Draft with Turbo → Finalize with HD → Clone with Qwen 3

---

## ✅ Implementation Checklist

### Phase 1: MiniMax Speech 2.8 Models (Both HD + Turbo)

**Convex Schema Setup**:
- [ ] Add MiniMax 2.8 HD schema to `voiceModelSchemas` table
- [ ] Add MiniMax 2.8 Turbo schema to `voiceModelSchemas` table (extend from HD)
- [ ] Add HD credit cost to `creditCosts` table (5 credits/1k chars)
- [ ] Add Turbo credit cost to `creditCosts` table (3 credits/1k chars)

**i18n Keys**:
- [ ] Add 17 voice name translations to `messages/en.json`
- [ ] Add 7 emotion translations
- [ ] Add advanced settings translations (15+ keys)
- [ ] Add 38 language option translations
- [ ] Add model name translations (HD + Turbo)
- [ ] Run `pnpm translate` to generate all 7 languages
- [ ] Run `pnpm i18n:verify` to confirm sync

**Testing - MiniMax 2.8 HD**:
- [ ] Test voice generation with all 17 voices
- [ ] Test emotion control (all 7 emotions)
- [ ] Test voice modification (pitch, intensity, timbre)
- [ ] Test advanced features (loudness normalization)
- [ ] Test interjection tags: (laughs), (sighs), (coughs)
- [ ] Test pause control: `<#0.5#>`, `<#1.0#>`, `<#2.0#>`
- [ ] Test multi-language support (at least 5 languages)
- [ ] Verify credit deduction (5 credits per 1k chars)
- [ ] Test audio quality settings (44.1kHz, stereo, 256kbps)

**Testing - MiniMax 2.8 Turbo**:
- [ ] Test voice generation with all 17 voices
- [ ] Compare generation speed vs HD (should be 40-60% faster)
- [ ] Compare audio quality vs HD (slight trade-off acceptable)
- [ ] Verify credit deduction (3 credits per 1k chars)
- [ ] Test all same features as HD (emotions, modifications, etc.)

**UI Validation**:
- [ ] Verify HD model shows "HD", "PRO", "MULTILINGUAL" badges
- [ ] Verify Turbo model shows "FAST", "TURBO", "COST-EFFECTIVE" badges
- [ ] Verify HD model appears first (sortOrder: 10)
- [ ] Verify Turbo model appears second (sortOrder: 20)
- [ ] Test model selector shows both models with correct pricing
- [ ] Verify credit cost display (HD: 5 credits, Turbo: 3 credits)

### Phase 2: Qwen 3 TTS 1.7B (Voice Cloning)

**Convex Schema Setup**:
- [ ] Add Qwen 3 TTS schema to `voiceModelSchemas` table
- [ ] Add credit cost to `creditCosts` table (5 credits/1k chars)
- [ ] Note: Different parameter structure vs MiniMax (flat params)

**i18n Keys**:
- [ ] Add 9 Qwen voice name translations to `messages/en.json`
- [ ] Add 11 language option translations
- [ ] Add style prompt translations
- [ ] Add voice cloning parameter translations (embedding URL, reference text)
- [ ] Add advanced sampling translations (temperature, top_k, top_p, etc.)
- [ ] Run `pnpm translate` to generate all 7 languages
- [ ] Run `pnpm i18n:verify` to confirm sync

**Testing - Qwen 3 TTS with Preset Voices**:
- [ ] Test voice generation with all 9 preset voices
- [ ] Test style prompt guidance ("Very happy", "Whispering", etc.)
- [ ] Test language auto-detection
- [ ] Test manual language selection (all 11 languages)
- [ ] Test advanced sampling controls (temperature, top_k, top_p)
- [ ] Verify credit deduction (5 credits per 1k chars)
- [ ] Test audio quality (24kHz mono MP3)

**Testing - Qwen 3 TTS Voice Cloning** (Optional Phase 2a):
- [ ] Test voice cloning workflow (`fal-ai/qwen-3-tts/clone-voice`)
- [ ] Get speaker embedding file URL from clone endpoint
- [ ] Test synthesis with speaker_voice_embedding_file_url
- [ ] Test with reference_text parameter for better quality
- [ ] Verify cloned voice quality vs preset voices
- [ ] Document voice cloning UX flow

**UI Validation**:
- [ ] Verify Qwen 3 TTS shows "VOICE CLONING", "CUSTOM VOICE" badges
- [ ] Verify model appears third (sortOrder: 30)
- [ ] Test conditional display of reference_text (only when embedding URL provided)
- [ ] Test advanced controls (collapsible by default)
- [ ] Verify credit cost display (5 credits)
- [ ] Test style prompt UI (text input with examples)

### Phase 3: Additional Models (Future)
- [ ] Add MiniMax Speech 2.6 HD (existing step-4 model) for backward compatibility
- [ ] Add ElevenLabs TTS (when available via fal.ai)
- [ ] Add OpenAI TTS
- [ ] Add additional voice cloning models

---

## 🎯 Recommended Implementation Order

1. **Start with MiniMax Turbo** - Fastest feedback loop, good quality
2. **Add MiniMax HD** - Same schema, just different modelId and credits
3. **Add Qwen 3 TTS** - Different parameter structure, voice cloning capability
4. **Default to Turbo** - Better UX with faster generation
5. **Offer HD as "High Quality" toggle** - Let users choose quality vs speed
6. **Offer Qwen 3 as "Custom Voice" option** - For advanced users

---

**Document Version**: 1.2  
**Status**: Ready for Implementation  
**Models Documented**: 3 models (MiniMax HD, MiniMax Turbo, Qwen 3 TTS 1.7B)  
**Next Steps**: Create seed script with all 3 TTS models

**Dependencies**:
- `docs/Analysis/MINI-APP-VOICE-GENERATOR-ANALYSIS.md` (v2.1)
- `docs/MVP/Todo/SPRINT-30C-POST-IMPLEMENTATION-BUGS-ANALYSIS.md` (Sprint 30d.5)

**Key Updates in v1.2**:
- ✅ Added Qwen 3 TTS 1.7B (voice cloning, style prompts)
- ✅ Added full Qwen schema configuration with advanced sampling
- ✅ Added voice cloning workflow documentation
- ✅ Updated comparison matrix (3 models)
- ✅ Added Qwen-specific i18n keys (voices, languages, parameters)
- ✅ Updated implementation checklist for Phase 2 (Qwen 3 TTS)
- ✅ Added credit costs for Qwen (5 credits/1k chars)
- ✅ Added model selection guide (voice cloning use case)

**Pricing Summary**:
- **MiniMax 2.8 HD**: $0.10/1k chars → 5 credits (highest quality)
- **MiniMax 2.8 Turbo**: $0.06/1k chars → 3 credits (best value)
- **Qwen 3 TTS**: $0.09/1k chars → 5 credits (voice cloning)

**Recommended Strategy**:
- **Default Model**: MiniMax Turbo (faster feedback, better UX)
- **Premium Option**: MiniMax HD (toggle for "High Quality" mode)
- **Advanced Option**: Qwen 3 TTS (for voice cloning features)
- **Workflow**: Draft with Turbo → Finalize with HD → Clone with Qwen 3
