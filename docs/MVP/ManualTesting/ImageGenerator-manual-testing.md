# 🖼️ MyShortReel — Image Generator: Manual Testing Guide

**Feature**: Image Generation (Guided Flow + Standalone Tool)  
**Date Created**: March 16, 2026  
**Audience**: Non-technical testers  
**Estimated Time**: 45–60 minutes  
**App URL**: https://my-short-reel-beta-git-sprint-06cc1d-jacques-projects-65c2bbcd.vercel.app/

---

## What You're Testing

Image generation appears in two places in MyShortReel:

**A — Inside the Guided Flow (Step 3 — Scene Management)**  
For each scene you can generate start and end frame images directly from a text prompt, or pick/upload an image and apply AI transformations to it.

**B — Standalone Image Generator Tool**  
A more advanced tool at `Tools → Image Generator` with multiple AI models, reference image uploads, and more controls.

You will test both.

---

## Before You Start

**You'll need:**
- A signed-in account with at least **60 credits**
- An existing project that has reached **Step 3** (Scene Management) — ideally with 2–3 scenes already defined
- A desktop browser (Chrome, Safari, or Firefox)
- A smartphone for the mobile section
- One image file on your device for upload tests (any photo, JPEG or PNG)

**Credit cost reminder:**
| Action | Credits |
|---|---|
| Prompt enhancement (Step 3 only) | 1 credit |
| Generate 1 image | 5 credits |
| Generate 2 images | 10 credits |
| Generate 4 images | 20 credits |
| AI Transform (per image) | 5 credits each |

---

## PART A — Guided Flow Image Generation

### Test 1 — Navigate to Step 3 (Scene Management)

**Steps:**

1. Open an existing project and navigate to **Step 3 — Scene Management**  
   URL: `/guided/step-3?projectId=YOUR_PROJECT_ID`
2. Select a scene to expand it
3. Find the **"Start Frame"** or **"End Frame"** section inside the scene

**Expected result:**
- The scene expands to show frame assignment areas
- Each frame area shows three options: **Upload**, **From Assets**, and **Generate with AI**
- Credit balance is visible somewhere on the page

**❌ Report if:**
- Step 3 does not load
- Frame sections are missing from the scene
- Credit balance is not shown

---

### Test 2 — Generate a Scene Frame with AI (FrameGenerator)

**What you're checking:** Generating a single AI image for a scene's start or end frame from a text prompt.

**Starting state:** A scene is expanded and you can see the "Start Frame" area.

**Steps:**

1. Click **"Generate with AI"** on the Start Frame
2. A text area and a **"Generate Start Frame"** button appear, with a **"6 credits"** badge
3. Note your credit balance
4. Type a short description — for example:
   > *"Golden hour beach, waves gently rolling in, soft warm light, cinematic widescreen"*
5. Click **"Generate Start Frame"**

**Expected result:**
- Button shows a loading spinner and "Generating…" text immediately
- The text area is disabled while generating
- After 10–40 seconds, the generated image appears in the frame slot
- Your credit balance decreased by **6 credits**

**Play back the result:**
6. The image should fill the frame area — verify the full subject is visible (no incorrect cropping of faces or important elements)
7. Click the image to open it in a **full-screen lightbox**
8. Press **Escape** or click outside to close the lightbox

**❌ Report if:**
- Clicking "Generate" does nothing / no spinner appears
- Generation takes more than 2 minutes with no update or error
- Image appears but only shows a cropped/zoomed-in portion when it should show the full scene (this was bug #169, which we fixed)
- Image appears stretched or distorted
- Only 5 credits were deducted (1 credit for prompt enhancement should also be deducted)
- Credits were deducted but no image was produced (refund should be automatic — check balance)
- Lightbox doesn't open on click
- Lightbox can't be closed

---

### Test 3 — Generate a Second Frame

**Steps:**

1. On the same scene, find the **"End Frame"** area
2. Click **"Generate with AI"** on the End Frame
3. Type a different description — for example:
   > *"Same beach at sunset, couple walking hand in hand, silhouette against the orange sky"*
4. Click **"Generate End Frame"**
5. Wait for completion

**Expected result:**
- End Frame generates successfully (same flow as Test 2)
- The end frame image is **visually different** from the start frame (it should reflect the different prompt)
- Both frame images are now shown in the scene — start on the left, end on the right

**❌ Report if:**
- End frame image looks identical to start frame
- One of the frames disappears when the other is generated
- Both frames aren't displayed simultaneously after both are generated

---

### Test 4 — Pick an Existing Asset (AssetSelector — Project Assets tab)

**What you're checking:** You can select a previously uploaded or generated image as a scene frame.

**Prerequisites:** Your project should have at least one existing asset (an image from a previous generation or upload).

**Steps:**

1. On a scene's frame area, click **"From Assets"** (or the asset picker icon)
2. The **Asset Selector** opens — it should default to the **"Project Assets"** tab
3. A grid of your project's images is shown
4. Click one image thumbnail to select it

**Expected result:**
- Asset Selector opens with your project's images
- Each image thumbnail is displayed with the **full image visible** — not cropped (this was bug #169, which we fixed)
- Clicking a thumbnail opens it in a full-screen lightbox
- A **"Use Image"** button (blue) and an **"AI Transform"** button (purple) are visible on each card
- Clicking **"Use Image"** closes the selector and places the image in the frame slot

**❌ Report if:**
- Asset Selector doesn't open
- Images are cropped/cut off in the thumbnails (top of faces cut off, etc.)
- "Use Image" button is missing or too small to click/tap
- Clicking "Use Image" shows an error
- No images are shown even though the project has assets

---

### Test 5 — Upload a New Image (AssetSelector — Upload tab)

**What you're checking:** Uploading a photo from your device works and the image can be used as a frame.

**Steps:**

1. Open the Asset Selector (click **"From Assets"** on a frame)
2. Switch to the **"Upload New"** tab
3. Either drag-and-drop your image file onto the upload area, or click the upload area and choose a file
4. The image uploads and appears in the asset grid
5. Click **"Use Image"** on the uploaded image

**Expected result:**
- Upload area is clearly marked and easy to interact with
- Upload progress is shown (spinner or progress indicator)
- After upload, the image appears in the grid with a full-image thumbnail (not cropped)
- "Use Image" places it in the frame slot

**❌ Report if:**
- Drag-and-drop doesn't work (try clicking instead)
- Upload gets stuck / never completes
- Uploaded image thumbnail is cropped incorrectly
- "Use Image" button is missing after upload

---

### Test 6 — AI Transform (Generate Variations from an Existing Image)

**What you're checking:** You can take an existing project image and generate AI-transformed variations from it.

**Prerequisites:** Your project has at least one image asset.

**Steps:**

1. Open the Asset Selector → **"Project Assets"** tab
2. Find a card with an image and click the **"AI Transform"** button (purple)
3. The **AI Transform Modal** opens
4. You should see:
   - The reference image on the left
   - A text prompt area on the right
   - An **image count selector** (default: 1, can go up to 4 using +/− buttons)
   - A "Transform" button with a credit cost badge (5 credits × count)
5. Type a transformation description — for example:
   > *"Same scene, but in winter — snow on the ground, frosted trees"*
6. Set image count to **2**
7. Confirm the credit badge shows **"10 credits"** (2 × 5)
8. Click **"Transform 2 images"**

**Expected result:**
- A progress bar appears during generation
- After completion, a grid of 2 transformed images appears
- Each result image is clickable (opens lightbox)
- Each result has a **red ✕ delete** button to discard it
- Each result has a **"Select this image"** button on hover/tap
- The reference image is shown correctly (not cropped/stretched) — bug #169 fix

**❌ Report if:**
- AI Transform modal doesn't open
- Reference image is cropped incorrectly in the modal preview
- Progress bar never appears
- Generation takes more than 2 minutes with no result
- Results show cropped/wrong images
- Delete button (✕) is not visible on mobile (too small to tap)
- "Select this image" button doesn't work
- 10 credits deducted but only 1 image generated

---

### Test 7 — Generate Images from Inside the Asset Selector (AI Generator tab)

**What you're checking:** The AI Generator tab inside the Asset Selector can generate multiple images at once.

**Steps:**

1. Open the Asset Selector on a scene frame
2. Switch to the **"AI Generator"** tab (✨ icon or "Generate" label)
3. Type a prompt:
   > *"Rustic wooden church interior, afternoon light through tall windows, empty pews"*
4. Set image count to **2** using the +/− buttons
5. Confirm the credit badge shows **"10 credits"**
6. Click **"Generate 2 images"**
7. Wait for completion (10–40 seconds)
8. A grid of 2 generated images appears — this is the **Generated Options view**

**In the Generated Options view:**
9. Click one image to open the lightbox — press Escape to close
10. Click **"Select this"** on one image — it should be placed in the frame slot and the selector should close

**Expected result:**
- Image count selector works (+ and − buttons)
- Credit badge updates correctly with image count
- Progress bar shown during generation
- Results grid appears after generation
- Each image can be previewed in lightbox
- "Select this" places the image correctly

**Regeneration test (optional, costs credits):**
11. Go back to the Generated Options view (or generate again)
12. Click the **"Regenerate this"** toggle on one image card to mark it
13. Modify the prompt slightly
14. Click **"Regenerate All"** — note the credit cost badge shows the cost for ALL images (not just the marked one)

**❌ Report if:**
- AI Generator tab is missing
- + / − buttons don't change the count
- Credit badge stays at "5 credits" regardless of count set
- Generation never completes
- Results grid doesn't appear
- "Select this" closes the selector but doesn't place the image in the frame

---

### Test 8 — Insufficient Credits in Image Generation

**What you're checking:** The insufficient credits modal appears correctly, with no negative values displayed.

**Steps:**

1. If your credit balance is very low (less than 5), try to generate an image
2. The **Insufficient Credits modal** should appear

**If your balance is high and you can't reproduce this naturally**, check the modal on a low-credit test account, or skip and note it as not tested.

**Expected result:**
- Modal shows:
  - **Required**: positive number (e.g. "5 credits")
  - **Your balance**: your actual current balance (not 0 unless you really have 0)
  - **Credits needed**: a positive number — **never negative** (this was bug #186, which we fixed)
- A "Purchase Credits" button is visible and working
- A "Cancel" button closes the modal

**❌ Report if:**
- "Credits needed" shows a negative number (e.g. "-3 credits")
- Modal appears even when you clearly have enough credits (this was also part of bug #186)
- Your actual balance is not shown (shows 0 when you have credits)
- "Purchase Credits" does nothing

---

## PART B — Standalone Image Generator Tool

### Test 9 — Navigate to the Image Generator Tool

**Steps:**

1. Go to **Dashboard → Tools → Image Generator**  
   URL: `/tools/image-generator`

**Expected result:**
- Page loads with a premium tab system (tabs for different features)
- A floating prompt bar is at the bottom of the screen
- One or more AI model cards are visible
- Credit balance is accessible

**❌ Report if:**
- Page is blank or shows an error
- No model cards are shown
- Prompt bar is missing

---

### Test 10 — Generate an Image with the Standalone Tool

**Steps:**

1. Select a model card from the list (any model)
2. Note the credit cost shown on the model card and on the generate button
3. Type a prompt:
   > *"Portrait of a grandmother in her kitchen, natural light, warm tones, shallow depth of field, photorealistic"*
4. Click the **Generate** button

**Expected result:**
- Button shows loading state immediately
- Generation completes in 10–60 seconds
- Result image appears in the output area
- Image is displayed in full (not cropped or distorted)
- Credit balance decreased by the amount shown on the button

**❌ Report if:**
- Generation does nothing
- Image appears but is clearly wrong (black, blank, or unrelated)
- Image appears cropped or only shows part of the subject
- Credits deducted but no image shown

---

### Test 11 — Model Switching in the Standalone Tool

**What you're checking:** Different models produce different results and credit costs update correctly.

**Steps:**

1. Note which model is currently selected and its credit cost
2. Click a **different model card**
3. Confirm the generate button's credit badge updates
4. Generate the same prompt as Test 10
5. Compare the two results

**Expected result:**
- Credit cost updates when switching models
- Two generations of the same prompt look noticeably different (different styles / quality)

**❌ Report if:**
- Credit cost badge doesn't change when switching models
- Switching model resets the prompt unexpectedly
- Both generations look identical

---

### Test 12 — Image Upload / Reference Image

**What you're checking:** You can upload a reference image and generate a variation or transformation of it.

**Steps:**

1. In the standalone tool, find the **reference image upload area** (look for an "Upload" box or a "References" panel)
2. Upload your test image
3. Type a transformation prompt:
   > *"Same composition, but in watercolor painting style"*
4. Click Generate

**Expected result:**
- Upload area accepts your image
- Uploaded image is shown as a thumbnail (full image visible, not cropped)
- Generation produces an image that relates to your reference photo
- Result is displayed correctly

**❌ Report if:**
- Reference image upload area is missing
- Uploaded image thumbnail appears cropped or stretched
- Generation ignores the reference image entirely

---

## PART C — Mobile Experience

### Test 13 — Image Generation on Mobile

**Device:** iPhone (Safari) or Android (Chrome)

**Steps:**

1. Open Step 3 (Scene Management) on your phone
2. **Frame area check**: Can you see the Start Frame and End Frame sections? Are they easy to tap?
3. **Generate with AI**: Tap "Generate with AI" on a frame — does it open correctly?
4. **Asset Selector**: Tap "From Assets" — does the selector open? Are thumbnails a good size?
5. **Thumbnails**: Check that image thumbnails show the full image (no faces cut off)
6. **Lightbox**: Tap an image thumbnail — does it open full-screen? Can you close it with the ✕ button?
7. **AI Transform Modal**: On an asset card, tap "AI Transform" — does the modal open correctly on mobile?
8. On the transform modal, is the **reference image visible** (full image, not cropped)?
9. Is the **delete button** (✕) on result images visible and tappable without needing precision (min 44px)?
10. Navigate to `/tools/image-generator` on mobile — does the standalone tool work?

**Expected result:**
- All tap targets are large enough (at least 44px)
- Thumbnails display full images without cropping
- Lightbox opens, fills screen, and can be closed via the ✕ button
- AI Transform modal is usable on mobile (not too cramped)
- Standalone tool is usable on mobile

**❌ Report if:**
- Thumbnails cut off faces or subjects
- Lightbox close button is too small to tap
- AI Transform modal is unusable on mobile (content overflows, buttons not reachable)
- Delete ✕ button on result images is invisible or too small on mobile
- Standalone tool is completely broken on mobile

---

## Final Sign-Off Checklist

| # | Test | Description | Pass / Fail | Notes |
|---|---|---|---|---|
| 1 | Navigate to Step 3 | Scene frame areas visible, credit balance shown | | |
| 2 | Generate Scene Frame | AI generates image in frame, 6 credits deducted, full image visible | | |
| 3 | Generate Second Frame | End frame generates, different from start frame | | |
| 4 | Pick Existing Asset | Asset Selector opens, thumbnails full (not cropped), "Use Image" works | | |
| 5 | Upload Image | Upload works, thumbnail correct, "Use Image" places in frame | | |
| 6 | AI Transform | Modal opens, reference image shown in full, N images generated correctly | | |
| 7 | AI Generator Tab | Multi-image generation, "Select this" works, regeneration flow works | | |
| 8 | Insufficient Credits | Modal shows positive "credits needed", correct balance | | |
| 9 | Standalone Tool loads | Page loads, models shown, prompt bar visible | | |
| 10 | Generate (Standalone) | Image generated, full image visible, correct credits deducted | | |
| 11 | Model Switching | Credit badge updates, different models produce different output | | |
| 12 | Reference Image Upload | Upload works, thumbnail not cropped, generation uses reference | | |
| 13 | Mobile Experience | Touch targets OK, thumbnails not cropped, lightbox closeable | | |

---

## Reporting Issues

For each issue, include:

1. **Which test** (number and step)
2. **What you expected** to see
3. **What actually happened**
4. **Device + browser** (e.g. iPhone 15 Pro, Safari 17 / MacBook, Chrome 124)
5. **Screenshot** if possible — especially for image cropping issues

| Severity | Meaning |
|---|---|
| 🔴 Blocker | Generation fails completely / credits deducted with no image |
| 🟠 High | Images appear but are visibly wrong (cropped, distorted, black) |
| 🟡 Medium | Feature works but UI is broken or wrong data shown (e.g. negative credits) |
| 🟢 Low | Visual glitch only, no functional impact |

---

## Credit Cost Reference

| Action | Credits | Where |
|---|---|---|
| Prompt enhancement | **1 credit** | Step 3 FrameGenerator only |
| Generate 1 image | **5 credits** | All flows |
| Generate 2 images | **10 credits** | Asset Selector AI tab, AI Transform |
| Generate 4 images | **20 credits** | Asset Selector AI tab, AI Transform |
| **Recommended balance for full testing** | **60+ credits** | |

---

**Last Updated**: March 16, 2026  
**Status**: Ready for Testing  
**Feature**: Image Generation (Sprint 38/39 — Bug #169 fix: image cropping; Bug #186 fix: negative credits)
