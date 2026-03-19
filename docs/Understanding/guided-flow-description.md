# 🎬 Guided Video Creation Flow - Complete User Guide

**Last Updated**: December 21, 2025  
**Version**: 2.0 (Post-Sprint 11-14)

This document provides a comprehensive description of the MyShortReel guided video creation flow, detailing every user interaction, form field, and AI operation at each step.

> **Note**: This document reflects the state after implementation of Sprints 11-14, including:
> - Sequential step numbering (8 steps, no "2b" or "3b")
> - Transition type selection in Step 7
> - Dynamic occasions/emotions from Convex
> - Voice previews with audio samples

---

## Table of Contents

1. [Flow Overview](#flow-overview)
2. [Step 1: Emotional Foundation](#step-1-emotional-foundation)
3. [Step 2: The Story (AI Chat)](#step-2-the-story-ai-chat)
4. [Step 3: Visual Style](#step-3-visual-style)
5. [Step 4: Visual Design (Scene Management)](#step-4-visual-design-scene-management)
6. [Step 5: Narration Script](#step-5-narration-script)
7. [Step 6: Sound Design](#step-6-sound-design)
8. [Step 7: Final Review & Polish](#step-7-final-review--polish)
9. [Step 8: Premiere Night](#step-8-premiere-night)
10. [Credit Costs Summary](#credit-costs-summary)
11. [Navigation & Controls](#navigation--controls)

---

## Flow Overview

The guided flow consists of **8 sequential steps** that guide users through creating a personalized video invitation:

```
Step 1: Emotional Foundation ❤️
    └─→ Continue to The Story ✨ (5 credits)
    
Step 2: The Story ✍️
    └─→ Approve Direction → Continue to Visual Style ✨
    
Step 3: Visual Style 🎨
    └─→ Continue to Scene Design

Step 4: Visual Design 🎬 (Scene Management)
    └─→ Generate Videos (20 credits/scene) → Validate → Continue to Narration

Step 5: Narration Script 🎙️
    └─→ Approve Narration → Continue to Sound Design ✨

Step 6: Sound Design 🎵
    └─→ Generate Narration + Music → Continue to Final Review

Step 7: Final Review & Polish ✨
    └─→ Select Transition Style → Assemble & Render

Step 8: Premiere Night 🎉
    └─→ Share & Save
```

### URL Structure

| Step | URL | Title |
|------|-----|-------|
| 1 | `/guided/step-1` | Emotional Foundation |
| 2 | `/guided/step-2?projectId={id}` | The Story |
| 3 | `/guided/step-3?projectId={id}` | Visual Style |
| 4 | `/guided/step-4?projectId={id}` | Visual Design |
| 5 | `/guided/step-5?projectId={id}` | Narration Script |
| 6 | `/guided/step-6?projectId={id}` | Sound Design |
| 7 | `/guided/step-7?projectId={id}` | Final Review |
| 8 | `/guided/step-8?projectId={id}` | Premiere Night |

---

## Step 1: Emotional Foundation

**URL**: `/guided/step-1`  
**Page Title**: "Step 1/8: Let's Begin Your Journey"  
**Subtitle**: "Tell us about your special moment"

### Purpose
Capture the emotional context, event details, and personal story that will drive AI-generated content throughout the video creation process.

### User Interactions

#### 1. Occasion Selection (Required)
**Section Title**: "Choose Your Occasion"

**Data Source**: Fetched dynamically from Convex `api.occasions.listActive`

| Occasion | Icon ID | Illustration | Description |
|----------|---------|--------------|-------------|
| Wedding | `heart` | Elegant rings/couple | Romantic & Warm |
| Birthday | `cake` | Birthday cake with candles | Joyful & Fun |
| Anniversary | `calendar-heart` | Heart with years | Nostalgic & Tender |
| Baby Shower | `baby` | Baby carriage | Exciting & Sweet |
| Graduation | `graduation-cap` | Cap and diploma | Proud & Motivational |
| Corporate Event | `briefcase` | Professional handshake | Professional & Energetic |
| Holiday Party | `gift` | Festive decorations | Festive & Warm |
| Engagement | `gem` | Diamond ring | Romantic & Joyful |

**Visual Display**:
- Each occasion shows an **illustration image** (realistic photo) above the icon and text
- Illustrations are stored in Convex storage and fetched dynamically
- Aspect ratio: 16:9

**Action**: Click on a card to select (visual highlight, card scales up)

---

#### 2. Emotional Theme Selection (Required)
**Section Title**: "Shape the Emotion"  
*Appears after occasion is selected*

**Data Source**: Fetched dynamically from Convex `api.emotionalThemes.listActive`

| Theme | Icon ID | Color | Description |
|-------|---------|-------|-------------|
| Joyful Celebration | `smile` | #FF6B6B | Upbeat, festive, celebratory |
| Nostalgic Memories | `clock` | #8B5A3C | Warm, reminiscent, sentimental |
| Romantic Love | `heart-pulse` | #FF6B9B | Tender, intimate, heartfelt |
| Energetic Fun | `zap` | #FFA500 | Dynamic, exciting, vibrant |
| Tender Moments | `heart` | #4ECDC4 | Gentle, soft, emotional |
| Motivational Pride | `trophy` | #4E90CD | Inspiring, proud, uplifting |

**Visual Display**:
- Each emotion shows an **icon** (from Lucide icon library) with colored background
- Icon background uses theme color at 20% opacity
- Icon color matches theme color

**Action**: Click on a card to select

---

#### 3. Project Details Form (Required)
**Section Title**: "Your Project Details"  
*Appears after emotional theme is selected*

| Field | Type | Required | Validation | Placeholder |
|-------|------|----------|------------|-------------|
| **Project Name** | Text Input | ✅ Yes | Min 3 characters | "e.g., Sarah & John's Wedding" |
| **Event Type** | Disabled Input | Auto-filled | - | Shows selected occasion |
| **Description** | Textarea (3 rows) | No | - | Context-aware based on theme |
| **Event Date** | Date Picker | No | - | - |
| **Location** | Text Input | No | - | "e.g., Grand Hotel, Paris" |
| **RSVP Link** | URL Input | No | - | "https://..." |
| **Personal Story** | Textarea (4 rows) | ✅ Yes | Min 10 characters | "Share the story behind this celebration..." |

---

#### 4. AI Story Refinement (Optional)
**Button**: "Let AI Refine It ✨" (1 credit)
- Located below Personal Story textarea
- Disabled if story < 10 characters
- Uses GPT-4o-mini to enhance the user's story
- Replaces content in Personal Story field with refined version

---

#### 5. Language Selection
**Section Title**: "Video Language"  
*Dropdown selector*

**Available Languages** (12 languages):
- English, Chinese, Spanish, French, Arabic, Russian, Portuguese, Japanese, Korean, German, Italian, Hindi

**Note**: Selected language affects all AI-generated content (narration, story, TTS)

> **Voice Preview Availability**: Voice preview samples (Sprint 14) are available for 7 languages: English, French, German, Italian, Spanish, Portuguese, Russian. For other languages, voice preview may not be available but narration generation will still work.

---

#### 6. Continue Actions

| Condition | Button Text | Credits | Action |
|-----------|-------------|---------|--------|
| Form incomplete | "Complete Required Fields" | - | Disabled |
| Form valid, no previous story | "Continue to The Story ✨" | 5 credits | Generate story, navigate to Step 2 |
| Form valid, has approved story | "Skip to Visual Style ✨" | Free | Navigate directly to Step 3 |
| Regenerate story | "Regenerate Story" | 5 credits | Generate new story, navigate to Step 2 |

---

### Loading States
- **Skeleton loaders** displayed while occasions/emotions load from Convex
- 8 skeleton cards for occasions (2×4 grid on desktop, 2×4 on mobile)
- 6 skeleton cards for emotions (3×2 grid on desktop, 2×3 on mobile)

### AI Operations

| Operation | Model | Credits | Trigger |
|-----------|-------|---------|---------|
| Story Refinement | OpenAI GPT-4o-mini | 1 | "Let AI Refine It" button |
| Story Generation | OpenAI GPT-4o-mini | 5 | "Continue to The Story" button |

---

## Step 2: The Story (AI Chat)

**URL**: `/guided/step-2?projectId={id}`  
**Page Title**: "Step 2/8: The Story ✍️"  
**Subtitle**: "Let's craft your narrative"

### Purpose
Refine and approve the AI-generated story through interactive chat with an AI Director.

### Initial State
- Displays the AI-generated story from Step 1
- Story includes: Title, Scenes (3 parts), Emotional Arc, Music Suggestion
- Format: Markdown with scene breakdowns

### User Interactions

#### 1. Chat Input
**Placeholder**: "Your feedback... (e.g., 'Make it more romantic')"

| Element | Type | Description |
|---------|------|-------------|
| Textarea | Multi-line | Enter feedback/refinements |
| Send Button | Icon Button | Blue arrow, submits message |
| Credit Badge | Badge | Shows "1 credit" per message |

---

#### 2. Start Over with a New Idea
**Button**: "Start Over with a New Idea"
- Location: Below chat input
- Cost: 1 credit
- Action: Generates completely fresh story concept

---

#### 3. Story Approval
**Button**: "✓ Approve this Direction"
- Appears below the latest AI message
- States: Default (outline) → Approved (green solid)
- Clicking toggles approval status

---

#### 4. Continue to Visual Style
**Button**: "Continue to Visual Style ✨"
- Only visible after story is approved
- Navigates to Step 3
- Cost: Free

---

### Chat Features
- **Streaming responses**: AI text appears word-by-word
- **Message history**: All conversation saved to Convex
- **Scroll-to-bottom**: Auto-scrolls on new messages
- **Loading states**: Shows loader during AI processing

### AI Operations

| Operation | Model | Credits | Trigger |
|-----------|-------|---------|---------|
| Chat Message | OpenAI GPT-4o-mini | 1 | Send message |
| Start Over | OpenAI GPT-4o-mini | 1 | "Start Over" button |

---

## Step 3: Visual Style

**URL**: `/guided/step-3?projectId={id}`  
**Page Title**: "Step 3/8: Visual Style 🎨"  
**Subtitle**: "Define your video's look"

### Purpose
Select the overall visual aesthetic that will be applied to all scenes.

### User Interactions

#### Visual Style Grid
**Section Title**: "Choose Your Style"

| Style | Icon | Description | Preview Image |
|-------|------|-------------|---------------|
| Cinematic | 🎬 | Film-like quality | cinematic-film-style.png |
| Vintage | 📼 | Vintage aesthetic | vintage-retro-style.png |
| Storyboard | 📋 | Sketch-like frames | storyboard-sketch-style.jpg |
| Low Key | 🌑 | Dark, moody lighting | low-key-dark-moody-lighting.jpg |
| Indie | 🎭 | Independent film feel | indie-film-aesthetic.jpg |
| Y2K | 💿 | Early 2000s digital | y2k-early-2000s-digital-style.jpg |
| Pop | 🎨 | Bright, vibrant colors | pop-art-bright-vibrant-colors.jpg |
| Grunge | 🎸 | Raw, textured look | grunge-raw-textured-style.jpg |
| Dreamy | ☁️ | Soft, ethereal feel | dreamy-soft-ethereal-style.jpg |
| Hand Drawn | ✏️ | Artistic sketch style | hand-drawn-artistic-sketch.jpg |
| 2D Novel | 📖 | Flat illustration style | 2d-novel-flat-illustration.jpg |
| Boost | ⚡ | High energy, dynamic | boost-high-energy-dynamic.jpg |
| Scribble | 🖊️ | Loose, sketchy lines | scribble-loose-sketchy-lines.jpg |
| Film Noir | 🕵️ | Classic black & white | film-noir-black-white-classic.jpg |
| Anime | 🌸 | Japanese animation | anime-japanese-animation-style.jpg |
| 3D Cartoon | 🎪 | Playful 3D animation | 3d-cartoon-playful-animation.jpg |
| Colored | 🌈 | Rich, saturated hues | colored-rich-saturated-hues.jpg |

**Action**: Click on a style card to select (blue border highlight, checkmark appears)

---

#### Continue Button
**Button**: "Continue to Scene Design"
- Disabled until a style is selected
- Saves selection to Convex
- Navigates to Step 4

---

### Data Saved
- `project.visualStyle`: Selected style ID (e.g., "cinematic", "vintage")
- Inherited by all scenes in Step 4

---

## Step 4: Visual Design (Scene Management)

**URL**: `/guided/step-4?projectId={id}`  
**Page Title**: "Step 4/8: Visual Design 🎨"  
**Subtitle**: "Craft your scenes — X scenes"

### Purpose
Create and customize individual scenes with start/end frames, then generate video clips.

### User Interactions

#### Scene Navigation
- **Mobile**: Accordion-style expandable sections
- **Desktop**: Tab navigation with scene list

#### Scene Count
- Default: 3 scenes (from generated story)
- Maximum: 10 scenes
- **Add Scene Button**: "+ Add Scene" (top right)

---

### Scene Editor (Per Scene)

#### 1. Scene Details Card

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Scene Title** | Text Input | ✅ | e.g., "Scene 1: Opening Welcome" |
| **Scene Description** | Textarea (3 rows) | ✅ | Describe what happens in this scene |
| **Duration** | Select Dropdown | ✅ | 5 seconds or 10 seconds |
| **Delete Scene** | Trash Icon Button | - | Removes scene (with confirmation) |

---

#### 2. Frame Assignment Card
**Title**: "Set Your Frames 🖼️"

##### Start Frame
- **Title**: "Start Frame"
- **Description**: "This is the opening visual of your scene"
- **Dropzone**: Click to open Asset Selector modal
- **States**:
  - Empty: Plus icon + "Create Your Visual"
  - Filled: Image preview + "Click to change"
  - Delete: Red X button to remove

##### End Frame
*Only visible after Start Frame is set*
- **Title**: "End Frame"  
- **Description**: "This is the closing visual of your scene"
- Same interaction pattern as Start Frame

---

#### 3. Asset Selector Modal
**Full-screen modal with 3 tabs**:

##### Tab 1: Project Assets
- Browse previously uploaded/generated images
- Two actions per asset:
  - "Use Image" (blue button) → Direct use as frame
  - "AI Transform" (purple button) → Transform with AI

##### Tab 2: Upload New
- Drag & drop zone for file upload
- Supported: JPG, PNG, GIF (max 2MB)
- After upload: Same "Use Image" / "AI Transform" options

##### Tab 3: AI Generator ✨

| Element | Description |
|---------|-------------|
| **Prompt Textarea** | Describe the image you want to create |
| **Image Count Selector** | 1-4 images (± buttons) |
| **Credit Display** | Shows cost (5 credits per image) |
| **Generate Button** | "Generate X Options" |
| **Progress Bar** | Shows during generation |

**AI Tips Displayed**:
- Be specific about colors, lighting, and mood
- Include the occasion context (wedding, birthday)
- Describe composition and framing
- Mention the visual style for consistency

##### Generated Images View
After generation completes:
- Grid of 1-4 generated images
- Per image:
  - "Select This" (green) → Use as frame
  - "Regenerate This" (purple) → Mark for regeneration
- Prompt modification input
- "Regenerate All" button (costs 5 credits × image count)
- "Back to Edit" button

---

#### 4. Video Generator Card
*Only visible when both Start and End frames are set*

**Title**: "Video Generation 🎬"

##### States:

| State | Display | Actions |
|-------|---------|---------|
| **Idle** | Play icon + "Ready to create" | "Generate Scene Video" button (20 credits) |
| **Generating** | Spinner + progress bar | Status: "Queued" → "Creating your video..." |
| **Completed** | Video player with controls | "Refine with AI" / "Download" / "Approve Video" |
| **Failed** | Error message | "Try Again" button |

##### Video Actions (when completed):

| Button | Description | Cost |
|--------|-------------|------|
| "Refine with AI (X left)" | Opens regeneration chat | 20 credits |
| "Download Video" | Downloads MP4 file | Free |
| "Approve Video" | Validates scene, enables next step | Free |

##### Regeneration Chat Modal
- Shows current video and scene description
- Chat interface to describe desired changes
- "Regenerate Video" button
- Maximum 3 regenerations per scene

---

### Bottom Action Bar (Fixed)

| Condition | Button Text | Action |
|-----------|-------------|--------|
| No frames set | "Select Frames for Scene X" | Disabled |
| Frames set, no video | "Generate Scene X Video" | Triggers generation |
| Video generated, not validated | "Validate Scene X Video" | Scrolls to scene |
| All scenes validated | "Continue to Narration" | Navigate to Step 5 |
| Narration already approved | "Continue to Sound Design ✨ (Free)" | Skip to Step 6 |

---

### AI Operations

| Operation | Model | Credits | Trigger |
|-----------|-------|---------|---------|
| Image Generation | fal-ai/nano-banana-pro | 5/image | AI Generator |
| Image Transform | fal-ai/nano-banana-pro/edit | 5/image | AI Transform |
| Video Generation | fal-ai/kling-video/v2.5-turbo/pro | 20 | "Generate Scene Video" |
| Video Regeneration | fal-ai/kling-video/v2.5-turbo/pro | 20 | "Refine with AI" |

---

## Step 5: Narration Script

**URL**: `/guided/step-5?projectId={id}`  
**Page Title**: "Step 5/8: Narration Script 🎙️"  
**Subtitle**: "Chat with your AI Director to refine the narration"

### Purpose
Refine the narration script that will be converted to speech in Step 6.

### Initial State
- Loads narration from `project.generatedStory.narration` or generates default
- Formats as scene-by-scene script with timing

### User Interactions

#### 1. Chat Interface
Same as Step 2 with:
- Context-aware prompts for narration
- Scene information included in AI context
- Project occasion/theme passed to AI

#### 2. Chat Input
**Placeholder**: "Refine the narration... (e.g., 'Make scene 2 more emotional')"

| Element | Cost | Description |
|---------|------|-------------|
| Send Message | 1 credit | Submit refinement request |
| Start Over | 1 credit | Generate fresh narration approach |

---

#### 3. Approve Narration
**Button**: "✓ Approve this Narration"
- Saves approved script to `project.approvedNarrationScript`

#### 4. Continue
**Button**: "Continue to Sound Design ✨"
- Only visible after approval
- Navigates to Step 6

---

### AI Operations

| Operation | Model | Credits | Trigger |
|-----------|-------|---------|---------|
| Chat Message | OpenAI GPT-4o-mini | 1 | Send message |
| Start Over | OpenAI GPT-4o-mini | 1 | "Start Over" button |

---

## Step 6: Sound Design

**URL**: `/guided/step-6?projectId={id}`  
**Page Title**: "Step 6/8: Sound Design 🎵"  
**Subtitle**: "Bring your video to life with voice and music"

### Purpose
Generate narration audio and background music tracks.

### User Interactions

#### Voice Selector Component
**Section Title**: "Choose Your Narrator"

**Data Source**: Fetched dynamically from Convex `api.voices.listActive`

**Voice Grid** (2 columns on mobile, 2 columns on desktop):

| Voice Key | Display Name | Gender | Style | MiniMax API Voice ID |
|-----------|--------------|--------|-------|---------------------|
| `emma_warm_friendly` | Emma | Female | Warm & Friendly | `Wise_Woman` |
| `james_professional_clear` | James | Male | Professional & Clear | `Patient_Man` |
| `sofia_elegant_sophisticated` | Sofia | Female | Elegant & Sophisticated | `Calm_Woman` |
| `marcus_deep_authoritative` | Marcus | Male | Deep & Authoritative | `Deep_Voice_Man` |
| `luna_soft_romantic` | Luna | Female | Soft & Romantic | `Calm_Woman` |
| `oliver_energetic_upbeat` | Oliver | Male | Energetic & Upbeat | `Casual_Guy` |
| `isabella_calm_soothing` | Isabella | Female | Calm & Soothing | `Lovely_Girl` |
| `noah_confident_strong` | Noah | Male | Confident & Strong | `Determined_Man` |

**Voice Card Display**:
- Gender icon (pink for female, blue for male)
- Voice name and style description
- **Preview Button** (Play/Pause) - plays audio sample in user's language

---

#### Voice Preview Feature ✨
**New in Sprint 14**

Each voice has pre-generated audio samples for **7 primary languages**:
- **Languages with previews**: English, French, German, Italian, Spanish, Portuguese, Russian
- Samples are stored in Convex `voiceSamples` table (56 total: 8 voices × 7 languages)
- Duration: ~5-8 seconds each
- Sample text: "Hello, welcome to your special day. Let me guide you through this beautiful journey of memories." (translated per language)

> **Note**: For the 5 other languages (Chinese, Arabic, Japanese, Korean, Hindi), voice preview is not available but narration generation works normally.

**VoicePreview Button States**:
| State | Icon | Behavior |
|-------|------|----------|
| Idle | Play ▶️ | Click to start playback |
| Loading | Spinner 🔄 | Audio is loading |
| Playing | Pause ⏸️ | Click to pause, blue highlight |
| No Sample | Volume (disabled) | Preview not available |

---

#### Voice Controls

| Control | Type | Range | Description |
|---------|------|-------|-------------|
| **Pacing** | Slider | 0-100 | Slower ↔ Faster |
| **Pitch** | Slider | 0-100 | Lower ↔ Higher |
| **Energy** | Slider | 0-100 | Softer ↔ Louder |

---

#### Generate Narration
**Button**: "Generate Narration ✨" (10 credits)
- Requires approved narration script
- Generates TTS audio using MiniMax Speech 2.6 HD
- Uses voice API value from Convex (e.g., "Wise_Woman" for Emma)

##### Generated Takes
- Radio button list of generated takes
- "Take 1", "Take 2", etc.
- Play button per take
- Audio player with controls
- Select to approve

---

#### Music Panel
*Only visible after narrator is validated*

##### Music Prompt
**Textarea**: "Describe the background music..."  
**Pre-filled**: Smart suggestion based on occasion and theme  
**Example**: "Create an elegant and emotional romantic celebration background music for a wedding. Soft, cinematic, with gentle strings and piano."

##### Generate Music
**Button**: "Generate Music 🎵" (10 credits)
- Uses Stable Audio 2.5

##### Generated Tracks
- Radio button list of generated tracks
- "Track 1", "Track 2", etc.
- Play button per track
- Audio player with controls
- Select to approve

---

#### Continue
**Button**: "Continue to Final Review"
- Requires: Selected narration take AND selected music track
- Navigates to Step 7

---

### AI Operations

| Operation | Model | Credits | Trigger |
|-----------|-------|---------|---------|
| Narration (TTS) | fal-ai/minimax/speech-2.6-hd | 10 | "Generate Narration" |
| Music Generation | fal-ai/stable-audio-25/text-to-audio | 10 | "Generate Music" |

---

## Step 7: Final Review & Polish

**URL**: `/guided/step-7?projectId={id}`  
**Page Title**: "Step 7/8: Final Review & Polish ✨"  
**Subtitle**: "Review your creation before rendering"

### Purpose
Review all components before final assembly, with ability to make last-minute edits and **select transition style**.

### User Interactions

#### Transition Style Card ✨
**New in Sprint 11**

**Section Title**: "Transition Style"

##### Mode Selection (Radio Group)

| Mode | Icon | Description | Duration Impact |
|------|------|-------------|-----------------|
| **Hard Cut** | ✂️ Scissors | Instant scene changes | 3 scenes × 10s = **30s** |
| **Smooth Transitions** | ✨ Sparkles | Cinematic effects between scenes | 3 scenes × 10s - 2s = **28s** |

*Duration badge shows calculated total based on scene count*

##### Xfade Effect Selector
*Only visible when "Smooth Transitions" mode is selected*

**Label**: "Transition Effect"  
**Type**: Select Dropdown

| Effect | Display Name | Description |
|--------|--------------|-------------|
| `circleopen` | Circle Open | Scene reveals from an expanding circle |
| `fade` | Fade | Smooth opacity transition between scenes |
| `dissolve` | Dissolve | Gradual blend between two scenes |
| `wipeleft` | Wipe Left | New scene wipes in from right to left |
| `slideup` | Slide Up | New scene slides up from bottom |
| `zoomin` | Zoom In | Zooming effect into next scene |
| `fadeblack` | Fade to Black | Fade out to black, then fade in |
| `fadewhite` | Fade to White | Fade out to white, then fade in |
| `wiperight` | Wipe Right | New scene wipes in from left to right |
| `slidedown` | Slide Down | New scene slides down from top |
| `slideleft` | Slide Left | New scene slides in from right |
| `slideright` | Slide Right | New scene slides in from left |
| `pixelize` | Pixelize | Pixelation effect during transition |
| `smoothleft` | Smooth Left | Smooth sliding transition to the left |
| `smoothright` | Smooth Right | Smooth sliding transition to the right |
| `circleclose` | Circle Close | Scene shrinks into a circle |

**Preview Placeholder**: Displays transition name and description (GIF previews planned for future)

---

#### Narration Script Card
**Title**: "Narration Script 📜"
- Displays approved narration with keyword highlighting
- Emotional keywords (love, joy, celebration) highlighted in blue
- **Edit Script** button → Navigates back to Step 5

---

#### Interactive Storyboard Card
**Title**: "Interactive Storyboard 🎬"

##### Per Scene Display:

| Element | Description |
|---------|-------------|
| **Drag Handle** | Grip icon for reordering scenes |
| **Scene Title** | "Scene X: {title}" |
| **Description** | Scene description text |
| **Start Frame** | Image preview (or "No Start Frame") |
| **End Frame** | Image preview (or "No End Frame") |
| **Generated Video** | Video player (or "No Video Generated") |
| **Duration Badge** | "Xs" (5 or 10 seconds) |
| **Style Tags** | Ambiance, camera movement badges |
| **Edit Scene** button | Navigates back to Step 4 |

##### Drag & Drop Reordering
- Scenes can be reordered by dragging
- Visual feedback during drag (opacity change)

---

#### Continue
**Button**: "Assemble & Render ✨"
- Navigates to Step 8
- Shows warning if no scenes

**Info Text**: "Total Duration: Xs" (sum of all scene durations, adjusted for transition mode)
- Hard Cut: Sum of scene durations
- Xfade: Sum minus (numTransitions × transitionDuration)

---

### Data Saved
- `project.transitionConfig.mode`: "hard_cut" or "xfade"
- `project.transitionConfig.xfadeType`: Selected effect (e.g., "circleopen")
- `project.transitionConfig.transitionDuration`: 1.0 seconds (default)

---

## Step 8: Premiere Night

**URL**: `/guided/step-8?projectId={id}`  
**Page Title**: "Step 8/8: Your Creation is Ready! 🎉"  
**Subtitle**: "Share your masterpiece with the world"

### Purpose
Assemble final video, preview, share, and download.

### Rendering Process (Initial Load)

#### Render Progress Animation
Displays while assembling:

| Step | Description |
|------|-------------|
| 1 | Processing video clips... |
| 2 | Merging scenes... |
| 3 | Adding audio... |
| 4 | Final polish... |

**Progress bar**: Animated, shows percentage

---

### Assembly CTA
**Card**: "Final Video Assembly"
- Shows cost: 5 credits
- Shows current balance
- **"Assemble Final Video ✨"** button
- Triggers Rendi API video assembly pipeline
- **Transition configuration** passed to assembly action:
  - Hard cut mode: Uses simple concatenation (no overlap)
  - Xfade mode: Uses xfade transitions with selected effect

### Assembly Status States:

| Status | Display |
|--------|---------|
| `preparing_assets` | "Preparing your assets..." |
| `processing_media` | "Processing media files..." |
| `finalizing_video` | "Finalizing your video..." |
| `saving_video` | "Saving your masterpiece..." |
| `completed` | Full video player + actions |
| `failed` | Error message + Retry button |

---

### Video Preview (After Render)
- Full video player with controls
- Play/Pause button
- Progress bar (clickable timeline)
- Mute/Unmute button
- Emotional timestamps (jump to key moments)

---

### Share Card
**Title**: "Share the Moment 💫"

#### Custom Message
**Textarea**: "Personalize your share message..."  
**Placeholder**: "You're invited to our special celebration!"

#### Include RSVP Checkbox
- **Checkbox**: "Include RSVP link in message"
- Auto-includes link from Step 1

#### Share Buttons

| Platform | Icon | Action |
|----------|------|--------|
| WhatsApp | 💬 | Opens WhatsApp share |
| Twitter/X | 🐦 | Opens Twitter intent |
| Facebook | 📘 | Opens Facebook sharer |
| Copy Link | 📋 | Copies URL to clipboard |

---

### Download & Save Card
**Title**: "Download & Save 💾"

| Button | Description |
|--------|-------------|
| **Download Your Film** | Downloads MP4 file |
| **Save as Template** | Opens template naming modal |

#### Save as Template Modal
- Input: "Template Name"
- Button: "Save Template" / "Cancel"
- Success toast: "Template saved!"

---

### Make a Change Modal
**Button**: "Make a Change"

Opens dialog with quick navigation:

| Option | Destination |
|--------|-------------|
| "Edit Story & Script" | Step 2 |
| "Edit Visuals & Styles" | Step 4 |
| "Edit Sound & Audio" | Step 6 |

---

### Finish
**Button**: "Finish & Save to Dashboard ✨" (green)
- Marks project as "completed" in Convex
- Navigates to Dashboard

---

### AI Operations

| Operation | API | Credits | Trigger |
|-----------|-----|---------|---------|
| Audio Mixing | Rendi API | ~1 | Auto during assembly |
| Video Merging (xfade) | Rendi API | ~1 | Auto during assembly (smooth transitions) |
| Video Concat (hard cut) | Rendi API | ~1 | Auto during assembly (hard cut mode) |
| Final Render | Rendi API | ~3 | Auto during assembly |
| **Total Assembly** | Rendi API | **5** | "Assemble Final Video" |

---

## Credit Costs Summary

| Step | Action | Credits |
|------|--------|---------|
| **Step 1** | Story Refinement | 1 |
| **Step 1** | Story Generation | 5 |
| **Step 2** | Chat Message | 1 |
| **Step 2** | Start Over | 1 |
| **Step 4** | Image Generation | 5/image |
| **Step 4** | Image Transform | 5/image |
| **Step 4** | Video Generation | 20/scene |
| **Step 4** | Video Regeneration | 20 |
| **Step 5** | Chat Message | 1 |
| **Step 5** | Start Over | 1 |
| **Step 6** | Narration (TTS) | 10 |
| **Step 6** | Music Generation | 10 |
| **Step 8** | Final Assembly | 5 |

### Typical Project Total (3 scenes):
- Story generation: 5 credits
- Story refinement: 2-3 credits
- Image generation (6 frames): 30 credits
- Video generation (3 scenes): 60 credits
- Narration: 10 credits
- Music: 10 credits
- Final assembly: 5 credits
- **Total**: ~120-125 credits

---

## Navigation & Controls

### Header Components (All Steps)

| Element | Description |
|---------|-------------|
| **Back Button** | "← Back" or "← Step Name" |
| **Progress Bar** | Visual progress indicator |
| **Step Indicators** | Numbered circles 1-8 (completed = blue, current = blue with icon, future = gray) |
| **Credit Balance** | Shows current balance (Step 1) |
| **Profile Menu** | Dashboard, Sign Out |
| **Home Button** | Returns to landing page |

### Progress Values

| Step | Progress % |
|------|------------|
| Step 1 | 12.5% (1/8) |
| Step 2 | 25% (2/8) |
| Step 3 | 37.5% (3/8) |
| Step 4 | 50% (4/8) |
| Step 5 | 62.5% (5/8) |
| Step 6 | 75% (6/8) |
| Step 7 | 87.5% (7/8) |
| Step 8 | 100% (8/8) |

---

## Convex Data Sources

### Dynamic Tables (Post-Sprint 13-14)

| Table | Used In | Description |
|-------|---------|-------------|
| `occasions` | Step 1 | 8 occasion types with icons and illustrations |
| `emotionalThemes` | Step 1 | 6 emotional themes with icons and colors |
| `voices` | Step 6 | 8 voice options with API values |
| `voiceSamples` | Step 6 | 56 audio samples (8 voices × 7 languages) |

### Queries Used

| Query | Step | Purpose |
|-------|------|---------|
| `api.occasions.listActive` | Step 1 | Fetch active occasion types |
| `api.emotionalThemes.listActive` | Step 1 | Fetch active emotional themes |
| `api.voices.listActive` | Step 6 | Fetch available voices |
| `api.voiceSamples.getByVoiceAndLanguage` | Step 6 | Get audio preview for selected voice + language |

---

## URL Redirects (Backward Compatibility)

For users with bookmarked old URLs:

| Old URL | New URL |
|---------|---------|
| `/guided/step-2b` | `/guided/step-3` |
| `/guided/step-3b` | `/guided/step-5` |

*Permanent redirects (308) configured in `next.config.mjs`*

---

## Backend Notes

### Sprint 15: Cloudflare R2 Migration

**Not user-facing** - This sprint migrates media storage (videos, images, audio) from Convex storage to Cloudflare R2 for cost optimization.

**User Impact**: None - URLs and playback remain the same. This is a transparent backend change.

**Benefits**:
- 77x cost reduction at scale (R2 egress is free)
- Faster video delivery via Cloudflare CDN
- No changes to user interface or flow

---

**Document Version**: 2.0  
**Last Updated**: December 21, 2025  
**Maintained By**: MyShortReel Development Team  
**Sprint References**: Sprint 11, 12, 13, 14, 15 (backend only)
