# Prompt System Architecture

This document describes all prompts used throughout the MyShortReel guided video creation flow, including the models, parameters, and API calls for each step.

---

## **1. Step 1: Personal Story Refinement**

**Location**: `app/api/step1/refine-story/route.ts`  
**Prompt File**: `lib/ai/prompts/step1/story-refinement.prompt.ts`  
**Trigger**: User clicks "Let AI Refine It" button in Step 1

### **Model Used**
- **Primary**: OpenAI GPT-4o
- **Provider**: OpenAI API
- **Cost**: 1 credit per refinement

### **API Parameters**
```typescript
{
  model: "gpt-4o",
  prompt: string,  // Built from STORY_REFINEMENT_PROMPT
  temperature: 0.7,
  maxOutputTokens: 500
}
```

### **Prompt Structure**
**System Prompt:**
```
You are an expert storyteller specializing in emotionally resonant video narratives.

Your task is to refine and enhance a personal story while keeping its authentic voice.

Guidelines:
- Keep the refined story concise (2-3 paragraphs max)
- Preserve the original meaning and key details
- Enhance emotional depth and narrative flow
- Make it suitable for a 30-second video narration
- Match the emotional tone to the occasion and theme
- Keep the language natural and heartfelt
- Do NOT add fictional details - only enhance what's provided
- Return ONLY the refined story text, no explanations or headers
```

**User Prompt (Built with context):**
```
[System prompt above]

Context:
- Occasion: {occasion}
- Emotional Theme: {theme}
- Event: {eventTitle}
- Language: {language}

Original Personal Story:
"{personalStory}"

Please refine this story to be more emotionally resonant and suitable for a {occasion} video with a {theme} tone. Return only the refined story text.
```

### **Input Parameters**
- `personalStory`: User's raw story text
- `occasion`: Event type (wedding, birthday, etc.)
- `theme`: Emotional theme (romantic, fun, etc.)
- `eventTitle`: Event name
- `language`: Language code (EN, FR, DE, etc.)

### **Output**
- Refined story text (2-3 paragraphs)
- No JSON structure, plain text only

---

## **2. Step 1: Story Generation**

**Location**: `app/api/step1/generate-story/route.ts`  
**Prompt File**: `lib/ai/prompts/step1/story-generation.prompt.ts`  
**Trigger**: User clicks "Continue to The Story" button in Step 1

### **Model Used**
- **Primary**: OpenAI GPT-4o
- **Provider**: OpenAI API
- **Cost**: 5 credits per generation

### **API Parameters**
```typescript
{
  model: "gpt-4o",
  prompt: string,  // Built from STORY_GENERATION_PROMPT
  temperature: 0.8,
  maxOutputTokens: 1000
}
```

### **Prompt Structure**
**System Prompt:**
```
You are an expert AI Director for emotionally resonant short-form videos.

Your task is to create a compelling video story concept based on the provided event details.

The story should:
1. Be structured for a 30-second video with exactly 3 scenes (~10 seconds each)
2. Have approximately 75-90 words for narration
3. Have a clear emotional arc: opening hook → emotional core → meaningful conclusion
4. Match the occasion and emotional theme perfectly
5. Be personal and authentic, not generic
6. Include exactly 3 visual scene suggestions (no more, no less)
7. Be ready for the user to refine in the next step

Output Format:
Return a JSON object with this structure:
{
  "title": "A compelling title for the video",
  "narration": "The full narration script (75-90 words)",
  "emotionalArc": "Brief description of the emotional journey",
  "scenes": [
    {
      "number": 1,
      "description": "Visual description for this scene",
      "mood": "The emotional tone of this scene"
    }
  ],
  "musicSuggestion": "Type of music that would complement this story"
}

Important: Return ONLY valid JSON, no markdown code blocks or explanations.
```

**User Prompt (Built with context):**
```
[System prompt above]

Event Details:
Occasion: {occasion}
Emotional Theme: {theme}
Event Title: {eventTitle}
Language: {language}
[Description: {description}]  // Optional
[Date: {date}]  // Optional
[Location: {location}]  // Optional

Personal Story from the creator:
"{personalStory}"

Create a compelling video story concept for this {occasion}. The story should feel {theme} and deeply personal. Return only valid JSON.
```

### **Input Parameters**
- `occasion`: Event type
- `theme`: Emotional theme
- `eventTitle`: Event name
- `description`: Event description (optional)
- `date`: Event date (optional)
- `location`: Event location (optional)
- `personalStory`: User's personal story
- `language`: Language code

### **Output**
- JSON object with:
  - `title`: Video title
  - `narration`: 75-90 word script
  - `emotionalArc`: Emotional journey description
  - `scenes`: Array of 3 scenes (number, description, mood)
  - `musicSuggestion`: Music type recommendation

---

## **3. Step 3: Text-to-Image Generation**

**Location**: `convex/actions/imageGeneration.ts`  
**Prompt Enhancement**: `convex/actions/aiChat.ts` (enhanceImagePrompt)  
**Prompt File**: `lib/ai/prompts/image/enhancement.prompt.ts`  
**Trigger**: User generates image in "AI Generator" tab (no reference image)

### **Model Used**
- **Primary**: `fal-ai/nano-banana-pro` (Google Gemini 3 Pro Image)
- **Fallback**: `fal-ai/bytedance/seedream/v4/text-to-image`
- **Provider**: fal.ai
- **Cost**: 5 credits (Nano Banana Pro) or 1 credit (Seedream)

### **Prompt Enhancement Flow**
1. User enters description in textarea
2. Visual style appended: `"{description}, {visualStyle} visual style"`
3. Enhanced via `enhanceImagePrompt` action (optional, costs 1 credit)
4. Final prompt sent to image generation

### **Enhancement Prompt (Optional)**
**Model**: OpenAI GPT-4o-mini or Together.ai Llama 3.1 8B  
**System Prompt:**
```
You are an expert at creating detailed image generation prompts. Enhance the given prompt to be more descriptive and visually specific while keeping it under 200 words. Focus on lighting, composition, mood, and cinematic details. Do not add explanations, just return the enhanced prompt.
```

**User Prompt:**
```
Enhance this prompt for AI image generation:

{basePrompt}
```

### **Image Generation API Parameters**
**Nano Banana Pro (Primary):**
```typescript
{
  prompt: string,  // Enhanced prompt with visual style
  aspect_ratio: "16:9" | "9:16" | "1:1" | ... (default: "16:9"),
  resolution: "1K" | "2K" | "4K" (default: "1K"),
  num_images: 1
}
```

**Seedream v4 (Fallback):**
```typescript
{
  prompt: string,
  image_size: "landscape_16_9" | "portrait_9_16" | "square",
  num_inference_steps: 20,
  guidance_scale: 7.5
}
```

### **Input Parameters**
- `description`: User's image description
- `visualStyle`: From Step 2b (automatically appended)
- `aspectRatio`: Frame aspect ratio
- `resolution`: Output resolution

### **Output**
- Image URL (stored in Convex assets)

---

## **4. Step 3: Image-to-Image Transformation (AI Transform)**

**Location**: `convex/actions/imageGeneration.ts`  
**Prompt Enhancement**: `convex/actions/aiChat.ts` (enhanceImagePrompt)  
**Prompt File**: `lib/ai/prompts/image/enhancement.prompt.ts`  
**Trigger**: User selects image and clicks "AI Transform" button

### **Model Used**
- **Primary**: `fal-ai/nano-banana-pro/edit` (Google Gemini 3 Pro Image Edit)
- **Fallback**: `fal-ai/bytedance/seedream/v4/edit`
- **Provider**: fal.ai
- **Cost**: 5 credits (Nano Banana Pro Edit) or 1 credit (Seedream Edit)

### **Prompt Enhancement Flow**
1. User selects reference image
2. User enters transformation description
3. Visual style appended: `"{description}, {visualStyle} visual style"`
4. Enhanced via `enhanceImagePrompt` action (optional)
5. Final prompt + reference image sent to image-to-image generation

### **Enhancement Prompt (Optional)**
Same as text-to-image enhancement (see section 3)

### **Image-to-Image API Parameters**
**Nano Banana Pro Edit (Primary):**
```typescript
{
  prompt: string,  // Enhanced transformation prompt with visual style
  image_urls: [string],  // Array with reference image URL (REQUIRED)
  aspect_ratio: "auto" | "16:9" | "9:16" | ... (default: "auto"),
  resolution: "1K" | "2K" | "4K" (default: "1K"),
  num_images: 1
}
```

**Seedream v4 Edit (Fallback):**
```typescript
{
  prompt: string,
  image_url: string,  // Singular, not array
  image_size: "landscape_16_9" | "portrait_9_16" | "square",
  num_inference_steps: 20,
  guidance_scale: 7.5,
  strength: 0.8  // 0.0-1.0, how much to change
}
```

### **Input Parameters**
- `description`: Transformation instructions
- `referenceImageUrl`: Selected image URL (required)
- `visualStyle`: From Step 2b (automatically appended)
- `aspectRatio`: Output aspect ratio (default: "auto")

### **Output**
- Transformed image URL (stored in Convex assets)

---

## **5. Step 3: Video Scene Generation**

**Location**: `convex/actions/videoGeneration.ts`  
**Prompt File**: `lib/ai/prompts/video/generation.prompt.ts`  
**Trigger**: User clicks "Generate Video" button after selecting frames

### **Model Used**
- **Primary**: `fal-ai/kling-video/v2.5-turbo/pro/image-to-video`
- **Provider**: fal.ai
- **Cost**: 20 credits per video

### **API Parameters**
```typescript
{
  prompt: string,  // Built from VIDEO_GENERATION_PROMPT
  image_url: string,  // Start frame URL (required)
  tail_image_url?: string,  // End frame URL (optional, for transitions)
  duration: "5" | "10",  // Video duration in seconds
  cfg_scale: 0.5,  // How closely to follow prompt (0-1)
  negative_prompt: "blur, distort, and low quality"
}
```

### **Prompt Structure**
**Built dynamically from context:**

```
{sceneDescription}

[Emotional context: {emotionalStory}.]  // If provided
[This is for a {occasion} video.]  // If provided
[The overall mood is {theme}.]  // If provided
[Visual style: {visualStyle}.]  // If provided
[Smooth transition to the next scene with subtle camera movement.]  // If transition frame
[{cinematicStyles.join(", ")}.]  // If any cinematic styles provided
[Quick, dynamic pacing suitable for a 5-second clip.]  // If duration === 5
[Smooth, deliberate pacing suitable for a 10-second clip.]  // If duration === 10

High quality, professional production.
```

### **Input Parameters**
**Scene-level (from Step 3):**
- `sceneDescription`: Scene description from generated story
- `startFrameUrl`: Start frame image URL (required)
- `endFrameUrl`: End frame image URL (optional)
- `duration`: 5 or 10 seconds
- `cinematicStyles`: Array of [ambiance, cameraMovement, colorTone, visualStyle]

**Project-level (from Step 1 & Step 2b):**
- `visualStyle`: Selected in Step 2b (cinematic, vintage, etc.)
- `occasion`: Selected in Step 1 (wedding, birthday, etc.)
- `theme`: Selected in Step 1 (romantic, fun, etc.)
- `emotionalStory`: User's personal story from Step 1

### **Output**
- Video URL (stored in scene.videoUrl)
- Status tracked in scene.videoGeneration

---

## **6. Step 3b: Narration Script Generation**

**Location**: `app/api/step3b/chat/route.ts`  
**Prompt File**: `lib/ai/prompts/audio/narration-script.prompt.ts`  
**Trigger**: User interacts with narration chat interface in Step 3b

### **Model Used**
- **Primary**: OpenAI GPT-4o
- **Provider**: OpenAI API
- **Cost**: Included in chat interaction (no separate credit cost)

### **API Parameters**
```typescript
{
  model: "gpt-4o",
  messages: CoreMessage[],  // System prompt + conversation history
  temperature: 0.7
}
```

### **Prompt Structure**
**System Prompt (Built dynamically with full project context):**

```
You are writing a voiceover narration for a video invitation.

**OUTPUT FORMAT RULES (CRITICAL - FOLLOW EXACTLY)**:
- Write ONLY the spoken words - nothing else
- Do NOT use markdown formatting (no asterisks, no bold, no italic, no headers)
- Do NOT use section headers like "Opening" or "Scene 1:"
- Do NOT include timing markers like "(10 seconds)" in the output
- Do NOT add any explanation, commentary, or meta-text
- Do NOT wrap text in quotation marks
- Do NOT include stage directions or instructions
- Use natural sentence flow with pauses marked as <#X.X#> where X.X is seconds

**PAUSE MARKERS (MiniMax TTS format)**:
- <#1.0#> = 1 second pause (use between major sections)
- <#0.5#> = half second pause (use between sentences)
- <#0.3#> = short breath pause (use for emphasis)

**LANGUAGE**: Write in {language}
**OCCASION**: {occasion}
**THEME**: {theme}
**TOTAL DURATION**: {totalDuration} seconds
**TARGET WORD COUNT**: ~{targetWords} words (adjusted for {language})

**EVENT DETAILS**:
{eventTitle}
{eventDate}
{eventLocation}

**EMOTIONAL CONTEXT / PERSONAL STORY**:
{emotionalStory}

**STORY ARC**:
{emotionalArc}

**EXISTING STORY NARRATION** (use as inspiration):
{storyNarration}

**SCENES TO NARRATE**:
Scene 1 "{title}" ({duration}s, ~{words} words): {description} [Mood: {mood}]
Scene 2 "{title}" ({duration}s, ~{words} words): {description} [Mood: {mood}]
Scene 3 "{title}" ({duration}s, ~{words} words): {description} [Mood: {mood}]

**EXAMPLE OF CORRECT OUTPUT** (plain spoken text only):
Welcome to Sarah and Michael's wedding celebration! <#0.5#> Join us for a magical evening filled with love, laughter, and unforgettable memories. <#0.5#> Your presence would make our special day even more beautiful. <#0.3#> Saturday, June fifteenth, two thousand twenty-four, at four PM. <#0.5#> Sunset Gardens, one twenty-three Rose Avenue, Romantic City. <#0.5#> We can't wait to celebrate with you! <#0.3#> Please RSVP by May first. <#0.5#> Let's create beautiful memories together on our wedding day.

**EXAMPLE OF WRONG OUTPUT** (do NOT do this):
**Narration Script:** Here's your personalized wedding invitation narration.
**Opening Welcome** (10 seconds)
"Welcome to Sarah and Michael's Wedding Celebration!"
*This warm, conversational script creates an intimate connection...*

Now write the narration. Output ONLY the spoken words with pause markers:
```

### **Input Parameters**
**Event Basics:**
- `occasion`: Event type (wedding, birthday, etc.)
- `theme`: Emotional theme (romantic, fun, etc.)
- `language`: Language name (English, French, etc.)
- `languageCode`: ISO code (en, fr, de, etc.) - used for word count calculation

**Event Details (from Step 1):**
- `eventTitle`: Event name
- `eventDate`: Event date
- `eventLocation`: Event location
- `emotionalStory`: User's personal story

**Story Context (from Step 2):**
- `storyNarration`: Original narration from generated story
- `emotionalArc`: Emotional journey description

**Scenes (from Step 3):**
- `scenes`: Array of scene objects with:
  - `number`: Scene number
  - `title`: Scene title
  - `description`: Scene description
  - `duration`: Duration in seconds
  - `mood`: Emotional tone
- `totalDuration`: Sum of all scene durations

**Chat Context:**
- `userMessage`: Latest user message
- `conversationHistory`: Full conversation history

### **Language-Specific Word Count Calculation**
The prompt automatically adjusts target word count based on language:
- **English (en)**: Baseline (1.0) - ~75 words for 30s
- **Romance languages (fr, es, it)**: 0.85 coefficient - ~64 words for 30s
- **Portuguese (pt)**: 0.8 coefficient - ~60 words for 30s
- **German (de)**: 0.75 coefficient - ~56 words for 30s
- **Russian (ru)**: 0.65 coefficient - ~49 words for 30s

### **Output**
- Plain text narration script with pause markers (`<#X.X#>`)
- No markdown, no formatting, no meta-text
- Ready for TTS conversion in Step 4

---

## **7. Step 4: Narration TTS Generation**

**Location**: `convex/actions/narrationGeneration.ts`  
**Trigger**: User clicks "Generate Narration" button in Step 4 after selecting voice and settings

### **Model Used**
- **Primary**: `fal-ai/minimax/speech-2.6-hd` (MiniMax Speech 2.6 HD)
- **Fallback**: `fal-ai/minimax/speech-2.6-turbo` (if HD fails)
- **Provider**: fal.ai
- **Cost**: 5 credits (HD) or 5 credits (Turbo fallback), 10 credits if retry needed

### **Important Note**
This is **not a prompt-based AI generation**. The approved narration script from Step 3b is sent directly to the TTS API for voice synthesis. The script is cleaned (markdown removed, pause markers optionally removed) before being sent to TTS.

### **Input Processing**
1. **Script Cleaning**: The approved narration script is cleaned using `cleanNarrationScript()`:
   - Removes markdown formatting (bold, italic, headers)
   - Removes section headers and timing markers
   - Removes meta-text and explanations
   - Optionally removes pause markers (`<#X.X#>`) for TTS
   - Normalizes whitespace

2. **Voice Settings Mapping**:
   - **Speed**: Calculated from pacing slider (0-100) → `speed = pacing / 50` (range: 0.5-2.0)
   - **Pitch**: Calculated from pitch slider (0-100) → `pitch = Math.round((pitch - 50) / 4)` (range: -12 to +12)
   - **Emotion**: Mapped from project theme via `THEME_EMOTION_MAP` (e.g., "romantic" → "romantic", "joyful" → "joyful")
   - **Voice ID**: Selected from MiniMax voices list (e.g., "Emma - Warm & Friendly")

### **TTS API Parameters**
**MiniMax Speech 2.6 HD (Primary):**
```typescript
{
  prompt: string,  // Cleaned narration script (max 10,000 chars)
  output_format: "url",
  language_boost: string,  // Language code or "auto"
  voice_setting: {
    voice_id: string,  // Selected MiniMax voice ID
    speed: number,  // 0.5-2.0 (calculated from pacing slider)
    vol: 1,  // Volume (fixed at 1)
    pitch: number,  // -12 to +12 (calculated from pitch slider)
    emotion: string,  // Mapped from theme
    english_normalization: boolean  // true if language === "English"
  },
  audio_setting: {
    sample_rate: 44100,
    bitrate: 256000,
    format: "mp3",
    channel: 2  // Stereo
  },
  normalization_setting: {
    enabled: true,
    target_loudness: -18,
    target_range: 8,
    target_peak: -0.5
  }
}
```

### **Duration Optimization**
The system includes predictive speed calculation and retry logic:
- **Predictive Speed**: If word count exceeds target by >10%, initial speed is boosted by 5%
- **Duration Check**: If generated audio exceeds 32 seconds, system retries with adjusted speed (up to 15% faster)
- **Target Duration**: 30 seconds (ideal)

### **Input Parameters**
- `prompt`: Cleaned narration script (from Step 3b approved script)
- `voiceId`: Selected MiniMax voice ID
- `language`: Language name (English, French, etc.)
- `languageCode`: ISO code (en, fr, de, etc.) - for predictive speed calculation
- `speed`: Base speed factor (from pacing slider)
- `pitch`: Pitch adjustment (from pitch slider)
- `emotion`: Emotion mapped from project theme

### **Output**
- Audio URL (MP3 format, 44.1kHz, 256kbps, stereo)
- Duration in milliseconds
- Model used (HD or Turbo)
- Speed factor applied
- Retry metadata (if applicable)

---

## **8. Step 4: Music Generation**

**Location**: `convex/actions/musicGeneration.ts`  
**Prompt File**: `lib/ai/prompts/audio/music-enhancement.prompt.ts` (available but not currently used)  
**Trigger**: User clicks "Generate Music" button in Step 4 after entering music prompt

### **Model Used**
- **Primary**: `fal-ai/stable-audio-25/text-to-audio` (Stable Audio 2.5)
- **Provider**: fal.ai
- **Cost**: 5 credits per generation

### **Current Flow (Direct Prompt)**
The user's music prompt is sent **directly** to Stable Audio API without AI enhancement. The prompt is used as-is.

### **Music Enhancement Prompt (Available but Not Used)**
A music enhancement prompt exists (`MUSIC_ENHANCEMENT_PROMPT`) but is **not currently integrated** into the flow. If enabled, it would enhance the user's prompt with:
- Occasion context
- Theme context
- Visual style context
- Pacing guidance
- Instrumentation suggestions
- Negative prompt suggestions

**Enhancement Prompt Structure (if used):**
```
You are enhancing a music generation prompt for fal-ai/stable-audio-25 (text-to-audio).
Return ONLY the improved prompt text. Do not include metadata or JSON.

User prompt: {userPrompt}
Occasion: {occasion}
Theme: {theme}
Visual style: {visualStyle}
Match the pacing to a {totalDuration}s video. Keep structure coherent for this length.
Add instrumentation and mood guidance suited for the occasion and theme.
Avoid vocals unless explicitly requested. Suggest negative prompt elements like "low quality, distorted, vocals" when appropriate.
```

### **Music Generation API Parameters**
**Stable Audio 2.5:**
```typescript
{
  prompt: string,  // User's music prompt (or enhanced prompt if enhancement enabled)
  seconds_total: 30,  // Duration in seconds (max 190, default 30 for MVP)
  num_inference_steps: 8,  // Quality (4-8, higher = better quality)
  guidance_scale: 1,  // Adherence to prompt (1-25, lower = more creative)
  seed?: number  // Optional seed for reproducibility
}
```

### **Input Parameters**
- `prompt`: User's music description (e.g., "elegant and emotional romantic background music for a wedding")
- `negativePrompt`: Optional negative prompt (default: "low quality, distorted, vocals")
- `seed`: Optional seed for reproducibility

### **Smart Default Prompt**
If user hasn't entered a prompt, Step 4 generates a smart default based on project data:
```
Create an elegant and emotional {theme.toLowerCase()} background music for a {occasion.toLowerCase()}. Soft, cinematic, with gentle strings and piano.
```

### **Output**
- Audio URL (30-second music track)
- Model used (stable-audio-2.5)

### **Future Enhancement**
The `MUSIC_ENHANCEMENT_PROMPT` is available for future integration to automatically enhance user prompts with project context (occasion, theme, visual style) before sending to Stable Audio.

---

## **Summary Table**

| Step | Feature | Model | Provider | Credits | Output Format |
|------|---------|-------|----------|---------|---------------|
| Step 1 | Story Refinement | GPT-4o | OpenAI | 1 | Plain text |
| Step 1 | Story Generation | GPT-4o | OpenAI | 5 | JSON |
| Step 3 | Text-to-Image | nano-banana-pro | fal.ai | 5 | Image URL |
| Step 3 | Image Transform | nano-banana-pro/edit | fal.ai | 5 | Image URL |
| Step 3 | Video Generation | kling-video/v2.5-turbo/pro | fal.ai | 20 | Video URL |
| Step 3b | Narration Script | GPT-4o | OpenAI | 0* | Plain text with pause markers |
| Step 4 | Narration TTS | minimax-speech-2.6-hd | fal.ai | 5-10 | Audio URL |
| Step 4 | Music Generation | stable-audio-2.5 | fal.ai | 5 | Audio URL |

\* *Narration script generation is part of chat interaction, no separate credit cost*

---

## **Notes**

- **Visual Style**: Automatically appended to image generation/transformation prompts from Step 2b selection
- **Prompt Enhancement**: Optional step for images (costs 1 credit) - uses GPT-4o-mini or Llama 3.1 8B
- **Fallback Models**: All image generation has Seedream v4 fallback for cost/speed optimization
- **Context Flow**: Project-level context (occasion, theme, visualStyle) flows from Step 1/2b → Step 3 → API calls
- **Narration Script**: Generated in Step 3b via chat interface, then approved and used for TTS in Step 4
- **Language Support**: Narration script prompt adjusts word count targets based on language coefficients (English baseline, Romance languages ~15% fewer words, German/Russian ~25-35% fewer words)
- **TTS Generation**: Step 4 converts approved narration script to audio using MiniMax Speech 2.6 HD (not prompt-based, direct TTS conversion with voice settings)
- **Music Generation**: Step 4 uses user's prompt directly with Stable Audio 2.5 (music enhancement prompt available but not currently integrated)
- **Duration Optimization**: Narration TTS includes predictive speed calculation and retry logic to ensure ~30s duration
- **Voice Settings**: Narration TTS maps UI sliders (pacing, pitch) to TTS parameters and maps project theme to emotion
