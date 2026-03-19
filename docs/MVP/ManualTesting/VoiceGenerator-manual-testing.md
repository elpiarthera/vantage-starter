# 🎙️ MyShortReel — Voice Generator: Manual Testing Guide

**Feature**: Voice Generator Mini-App  
**Date Created**: March 16, 2026  
**Audience**: Non-technical testers  
**Estimated Time**: 45–60 minutes  
**App URL**: https://my-short-reel-beta-git-sprint-06cc1d-jacques-projects-65c2bbcd.vercel.app/

---

## What You're Testing

The Voice Generator is a standalone tool that lets you create professional voiceovers in two ways:

1. **AI Voice Generation** — Type a script, pick a voice model, and generate a professional AI voiceover
2. **Voice Recording** — Record your own voice directly in the browser, with optional AI enhancement

You'll also check:
- Switching between voice models
- Listening back to generated audio
- Saving voices to a project
- Browsing your voice history
- Mobile experience on iPhone/Android

---

## Before You Start

**You'll need:**
- A signed-in account with at least **20 credits**
- A desktop browser (Chrome, Safari, or Firefox)
- A smartphone for the mobile section
- A microphone (built-in laptop mic is fine for recording tests)

**Navigate to the Voice Generator:**  
👉 Go to **Dashboard → Tools → Voice Generator**  
Or directly: `/tools/voice-generator`

---

## Test 1 — Page Loads Correctly

**What you're checking:** The voice generator opens without errors and all UI elements are visible.

**Steps:**

1. Navigate to the Voice Generator
2. The page should load with two tabs at the top: **"Voice Generation"** and **"Voice Recording"**
3. The default tab should be **Voice Generation**

**Expected result:**
- Page loads without any errors or blank sections
- Two tabs are visible and clearly labeled
- A voice model card is shown (e.g. "MiniMax — Calm & Soothing" or similar)
- A text prompt area is visible at the bottom of the screen
- A sparkle ✨ generate button with a credit cost badge is visible in the prompt bar
- Your credit balance is shown somewhere on the page

**❌ Report if:**
- Page is blank or shows an error
- Tabs are missing
- No voice model is shown
- Prompt bar is missing
- Credit cost badge shows "0 credits" or nothing

---

## Test 2 — Browse Voice Models

**What you're checking:** You can scroll through available voice models and see their details.

**Steps:**

1. On the Voice Generation tab, look at the voice model cards
2. Scroll through the list of available models
3. Click on one model to select it (it should highlight or show a selected state)
4. Look at the model card details

**Expected result:**
- Multiple voice model cards are visible (at least 3–5)
- Each card shows: model name, description, and capability badges (e.g. "HD", "Multilingual")
- Each card shows the credit cost
- Clicking a card selects it (visual highlight/border changes)
- The generate button credit badge updates to match the selected model's cost

**❌ Report if:**
- No voice models are shown ("Loading…" forever)
- Model cards show raw code keys like `voice_models.name_minimax` instead of readable names
- Badge labels show raw DB strings like `"VOICE CLONING"` in all-caps instead of readable labels
- Credit cost doesn't update when switching models
- Cannot select a model (clicking does nothing)

---

## Test 3 — Generate a Voice (AI Text-to-Speech)

**What you're checking:** Typing a script and generating an AI voiceover works end-to-end.

**Starting state:** Voice Generation tab selected, a voice model selected, sufficient credits.

**Steps:**

1. Click the text area at the bottom of the screen (the floating prompt bar)
2. Type a short script — for example:
   > *"Welcome to MyShortReel, the easiest way to create beautiful short films for your special moments."*
3. Check the credit badge on the generate button — note the number (e.g. "3 credits")
4. Note your credit balance before clicking generate
5. Click the **Generate** button (✨ sparkle icon)

**Expected result:**
- Button shows a loading spinner while generating
- Prompt bar is disabled during generation
- A toast notification may appear: "Generating…"
- After 5–30 seconds, the generated audio appears in the canvas area
- An audio player is shown with play/pause controls and a seek bar
- The audio duration is displayed (e.g. "0:04")

**Credit check:**
- After generation completes, verify your credit balance decreased by the amount shown on the button

**Play the audio:**
6. Click the **play button** on the audio player
7. Confirm the audio plays your script in the selected voice

**❌ Report if:**
- Clicking Generate does nothing
- Spinner never appears
- Generation takes more than 60 seconds with no update
- Audio player does not appear after generation
- Audio player appears but clicking play does nothing
- Audio plays but sounds completely wrong (wrong language, silence, noise)
- Credits were deducted but no audio was produced
- Credits were deducted multiple times

---

## Test 4 — Audio Player Controls

**What you're checking:** The audio player controls all work correctly.

**Starting state:** A generated audio track is visible in the player.

**Steps:**

1. **Play / Pause**
   - Click the play button → audio should start
   - Click again → audio should pause
   - Click again → audio should resume from where it paused (not restart)

2. **Seek bar**
   - While audio is playing, drag the seek bar to a different position
   - Audio should jump to that position and continue playing

3. **Volume**
   - If a volume control is visible, test muting and adjusting volume

4. **Duration display**
   - Confirm the timer shows elapsed time and total duration (e.g. "0:02 / 0:06")

**Expected result:**
- Play/pause works smoothly
- Seeking jumps to the correct position
- Duration display is accurate

**❌ Report if:**
- Play button doesn't start audio
- Pause doesn't pause audio
- Resuming after pause restarts from the beginning
- Seek bar is impossible to drag / too small to tap on mobile
- Duration shows "0:00 / 0:00"

---

## Test 5 — Switch Voice Model Mid-Use

**What you're checking:** Switching to a different voice model updates the UI correctly and a new generation uses the new model.

**Steps:**

1. With an audio already generated (Test 3 done), click a **different voice model** card
2. Look at the generate button — the credit cost should update
3. Type a new short script:
   > *"This is a test of the second voice model."*
4. Click Generate

**Expected result:**
- The credit cost badge changes when you switch models
- The new generation sounds noticeably different from the first (different voice character)
- The new audio player replaces or appears alongside the previous one

**❌ Report if:**
- Credit cost badge doesn't update when switching models
- New audio sounds identical to the previous generation (model wasn't actually switched)
- App crashes or resets prompt when switching models

---

## Test 6 — Voice Settings Panel

**What you're checking:** The settings sliders (pitch, speed, etc.) affect generation output.

**Steps:**

1. Click the **Settings** icon or panel (look for a gear icon or "Settings" label in the options)
2. Find the available sliders (e.g. Speed, Pitch, Energy/Emotion)
3. Move the **Speed** slider to the far slow end
4. Generate the same short script from Test 3
5. Play the audio — it should be noticeably slower
6. Move the **Speed** slider to the far fast end
7. Generate again — it should be noticeably faster

**Expected result:**
- Settings panel opens correctly
- Sliders are draggable (large enough to interact with on mobile too — min 44px touch target)
- Speed changes are clearly audible in the generated audio
- Settings persist when you switch back to the main view

**❌ Report if:**
- Settings panel doesn't open
- Sliders can't be moved
- Settings have no effect on generated audio
- Settings reset unexpectedly when switching tabs

---

## Test 7 — Voice Recording Tab

**What you're checking:** The Voice Recording tab opens cleanly and does not bleed through into the background.

**Steps:**

1. Click the **"Voice Recording"** tab at the top
2. Look at the full page — the voice generation canvas should be hidden / blurred behind the recording panel
3. A recording panel should slide in from the bottom or appear as an overlay

**Expected result:**
- The recording panel is the only thing visible and interactive
- The voice generation canvas is behind a scrim (dimmed/blurred background) — you should NOT be able to interact with the canvas while the recording panel is open
- A large **record button** (microphone icon) is visible
- Instructions or a timer are displayed

**❌ Report if:**
- The voice generation tab is still visible and interactive behind the recording panel (this was the bug we fixed)
- The recording panel doesn't appear
- The page layout is broken / overlapping elements

---

## Test 8 — Record Your Own Voice

**What you're checking:** Recording a voice clip works end-to-end.

**Prerequisites:** You need to allow microphone access when the browser asks.

**Steps:**

1. On the **Voice Recording** tab, click the **record button** (large circle / microphone icon)
2. Your browser will ask for microphone permission — click **Allow**
3. Speak a short sentence: *"Hello, this is a test recording."*
4. You should see a **waveform animation** while recording (bars moving up and down)
5. Click the **stop button** to stop recording
6. The recording is processed and an audio player appears

**Expected result:**
- Browser microphone permission prompt appears
- After allowing, recording starts immediately
- Waveform bars animate in sync with your voice while recording
- Clicking stop ends the recording cleanly
- An audio player appears with your recording
- Playback plays back your voice clearly

**On iPhone (iOS Safari):**
- Waveform animation should work (this was specifically fixed for iOS)
- Audio should be saved as `audio/mp4` format (not a broken `.webm` file)

**❌ Report if:**
- Microphone permission is requested but then nothing happens
- Waveform does not animate while speaking (no visual feedback)
- Clicking stop does nothing / recording doesn't stop
- No audio player appears after stopping
- Audio plays back as silence or static
- On iOS: recording saves but audio won't play back

---

## Test 9 — Save a Voice to a Project

**What you're checking:** A generated voice can be linked to a project.

**Prerequisites:** You have at least one existing project. Complete Test 3 first (have a generated audio).

**Steps:**

1. After generating audio (Test 3), look for a **"Save to Project"** or **"Use in Project"** button
2. Click it
3. A project selector modal or drawer opens
4. Select one of your existing projects from the list
5. Confirm the save

**Expected result:**
- Project selector opens correctly (as a bottom drawer on mobile, a dialog on desktop)
- Your projects are listed with their names and occasion type
- Selecting a project and confirming saves the voice
- A success toast appears: "Saved to project" or similar
- On mobile: the selector can be dismissed by swiping down

**❌ Report if:**
- No "Save to Project" button is visible
- Project selector doesn't open
- Your projects aren't listed (empty list when you have projects)
- Project names appear as raw codes (e.g. `projects.occasion.wedding` instead of "Wedding")
- Selecting a project and confirming shows an error
- On mobile: the selector can't be dismissed

---

## Test 10 — Voice History

**What you're checking:** Previously generated voices are stored and accessible.

**Steps:**

1. After generating at least 2 voice tracks (Tests 3 and 5), look for a **History** button (clock icon or "History" label)
2. Click it to open the history panel
3. Your previously generated voices should be listed

**Expected result:**
- History panel opens
- Your generated voices appear in the list, most recent first
- Each entry shows: voice model name, generation date/time (in a readable format like "Mar 16, 2026"), and duration
- Each entry has a play button to listen back
- Dates should NOT show as raw numbers (e.g. not `1742082000000`)

**❌ Report if:**
- History panel doesn't open
- History is empty even after generating several voices
- Dates show as raw Unix timestamps instead of readable dates
- Duration shows as `0s` or is missing
- Play buttons in history don't work

---

## Test 11 — Insufficient Credits

**What you're checking:** The insufficient credits modal appears correctly when balance is too low, with no negative values.

**Steps:**

1. Note your current credit balance
2. If you have fewer credits than the cost of the selected model, click Generate
3. The "Insufficient Credits" modal should appear

**If you can't reproduce this naturally** (because you have plenty of credits), skip to the Expected result section and note it as not tested.

**Expected result:**
- Modal shows three lines:
  - **Required for this action**: X credits (positive number)
  - **Your balance**: Y credits (your actual balance)
  - **Credits needed**: Z more credits — this number must **always be positive** (never negative)
- A "Purchase Credits" button is visible
- A "Cancel" button is visible
- Both buttons are large enough to tap on mobile (at least 44px tall)

**❌ Report if:**
- Modal shows a **negative number** for "Credits needed" (e.g. "-98 more credits") — this was the bug we fixed
- Modal appears when you clearly have enough credits
- "Purchase Credits" button doesn't work
- Modal can't be dismissed

---

## Test 12 — Mobile Experience

**What you're checking:** The Voice Generator works correctly on a phone.

**Device:** iPhone (Safari) or Android (Chrome)

**Steps:**

1. Open the Voice Generator on your phone
2. **Layout check**: Does everything fit on screen without horizontal scrolling?
3. **Tab bar**: Are the "Voice Generation" and "Voice Recording" tabs visible without being cut off?
4. **Voice model cards**: Can you scroll through models easily? Are they tap-friendly?
5. **Prompt bar**: Can you tap the text area and type easily? Does the keyboard not cover the generate button?
6. **Generate button**: Is it large enough to tap easily?
7. **Recording tab**: Switch to Voice Recording. Does the panel appear correctly on mobile?
8. **Record on phone**: Try recording a voice clip on your phone (Test 8 above)
9. **Landscape mode**: Rotate phone sideways — does the layout adapt? Can you still scroll if content is taller than the screen?

**Expected result:**
- All elements fit on screen
- Tab bar is always visible
- Buttons are easy to tap (minimum 44px height)
- Keyboard doesn't permanently hide the generate button
- Recording works on mobile
- Landscape mode: the recording panel should be scrollable if it doesn't fit

**On iPhone specifically:**
- Recording waveform should animate (iOS Safari fix)
- Generated voice should play back without issues

**❌ Report if:**
- Page requires horizontal scrolling
- Tabs are cut off or unreachable
- Generate button is too small to tap reliably
- Recording panel completely breaks the layout
- Keyboard covers the generate button and it stays covered
- Audio won't play on iPhone
- App freezes in landscape mode

---

## Test 13 — Translation / No Raw Keys

**What you're checking:** All text in the Voice Generator is properly translated — no raw translation codes visible.

**Steps:**

1. Go through every part of the Voice Generator:
   - Main generate tab (model cards, buttons, labels)
   - Settings panel
   - Voice Recording tab
   - History panel
   - Project selector
   - Insufficient credits modal

2. Look carefully at every piece of text

**Expected result:**
- All text is readable English (or your language if set to another locale)
- No text looks like a raw code with dots and underscores (e.g. `voice_generator.generate_button` or `voice_models.badge_hd`)
- Voice model badge labels read normally (e.g. "HD", "Multilingual", "Voice Cloning") — not ALLCAPS database values

**❌ Report if:**
- Any label, badge, button, or placeholder shows a raw translation key
- Dates or durations in the history panel show raw numbers
- Badge labels appear in ALL_CAPS_WITH_UNDERSCORES format

---

## Final Sign-Off Checklist

Check each item once testing is complete:

| # | Test | Description | Pass / Fail | Notes |
|---|---|---|---|---|
| 1 | Page Load | Page loads, tabs visible, no errors | | |
| 2 | Browse Models | Models listed, badges readable, credit cost shown | | |
| 3 | Generate Voice | AI voice generates, audio player appears, audio plays | | |
| 4 | Audio Player | Play/pause/seek all work correctly | | |
| 5 | Switch Model | Switching model updates credit cost, new voice sounds different | | |
| 6 | Settings Panel | Sliders open, affect output | | |
| 7 | Recording Tab Layout | Recording panel appears, canvas behind is dimmed/hidden | | |
| 8 | Record Voice | Microphone works, waveform animates, playback plays back correctly | | |
| 9 | Save to Project | Project selector opens, save works, toast appears | | |
| 10 | History | History lists generated voices, dates readable, playback works | | |
| 11 | Insufficient Credits | Modal shows positive "credits needed", correct values | | |
| 12 | Mobile Experience | Layout fits, touch targets large, recording works on phone | | |
| 13 | No Raw Keys | All text readable, no translation codes visible | | |

---

## Reporting Issues

For each issue, include:

1. **Which test** (number and step)
2. **What you expected** to see
3. **What actually happened**
4. **Device + browser** (e.g. iPhone 15 Pro, Safari 17 / MacBook, Chrome 124)
5. **Screenshot** if possible

| Severity | Meaning |
|---|---|
| 🔴 Blocker | Generation fails completely / audio never plays / recording broken |
| 🟠 High | Feature works but with clearly wrong behaviour (e.g. negative credits, wrong model used) |
| 🟡 Medium | Feature works but UI is broken or content is wrong |
| 🟢 Low | Visual glitch only, no functional impact |

---

## Credit Cost Reference

| Action | Approximate Credits |
|---|---|
| AI voice generation (standard model) | 3–5 credits |
| AI voice generation (HD model) | 8–12 credits |
| Voice recording processing | 1–2 credits |
| **Recommended balance for full testing** | 50+ credits |

---

**Last Updated**: March 16, 2026  
**Status**: Ready for Testing  
**Feature**: Voice Generator (Sprint 38 / Sprint 39 Post-Review)
