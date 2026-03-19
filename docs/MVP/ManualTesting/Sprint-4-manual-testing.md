# 🧪 MyShortReel - Sprint 4: Manual Testing Guide

**Sprint**: Sprint 4 - Step 3 Visual Design (Images + Videos)  
**Date Created**: November 19, 2025  
**Last Updated**: December 23, 2025  
**Audience**: Non-technical QA testers  
**Status**: Ready for Testing  
**Estimated Time**: 2.5-3 hours

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Test Setup](#test-setup)
3. [Scene Management Testing](#scene-management-testing)
4. [AI Image Generation Testing](#ai-image-generation-testing)
5. [AI Image Transform Testing](#ai-image-transform-testing)
6. [Video Generation Testing](#video-generation-testing)
7. [Video Regeneration Testing](#video-regeneration-testing)
8. [Complete Workflow Testing](#complete-workflow-testing)
9. [Mobile Testing](#mobile-testing)
10. [Error Handling Testing](#error-handling-testing)
11. [Reporting Issues](#reporting-issues)

---

## Introduction

### What You're Testing

Sprint 4 covers **Step 3: Visual Design** - the complete scene creation workflow. You will verify:

- **Scene Management**: View, edit, and manage 3 auto-generated scenes
- **AI Image Generation**: Generate images from text descriptions
- **AI Image Transform**: Modify existing images with AI
- **Video Generation**: Generate scene videos from start/end frames
- **Video Regeneration**: Refine and regenerate videos with AI chat
- **Complete Workflow**: Create all 3 scenes and proceed to the next step

### Why This Matters

Step 3 is where users bring their story to life visually:
- Each scene needs a start frame and end frame
- AI generates scene videos that transition between frames
- Users can regenerate videos if not satisfied
- All 3 scenes must be validated before proceeding

### Page Title & Layout

**Step 3 Header:**
- Title: **"Step 3/5: Visual Design 🎨"**
- Subtitle: *"Design your scenes with start and end frames — Create visuals for each scene (3 scenes)"*

**Key UI Elements:**
- Scene tabs/navigation at top (Scene 1, Scene 2, Scene 3)
  - Each shows duration badge (5s or 10s)
  - Green checkmark when both frames are set
- Scene Details card (Title, Description, Duration dropdown)
- Set Your Frames card (Start Frame, then End Frame after Start is set)
- Video Generator section (appears after both frames are set)
- Bottom action bar with dynamic button:
  - "Select frames for Scene X" (disabled) → "Generate Scene X Video" → "Validate Scene X Video" → "Continue to Narration"

---

## Test Setup

### Before You Start

**You'll Need:**
1. A computer with a modern web browser
2. A smartphone (iPhone or Android) for mobile testing
3. A valid user account (sign in first)
4. **Sufficient credits** (at least 100 credits recommended)
5. A project that has completed Step 1, Step 2, and Step 2b

**Credit Requirements:**
- Image generation: **5 credits per image** (generating 4 options = 20 credits)
- Video generation: **20 credits per scene**
- Video regeneration: **20 credits per regeneration**
- Total for 3 scenes (minimum): ~120 credits

**Application URL:**
- **Production Deployment**: https://myshortreel-alpha-git-sprint-5-ai-integration-elpi-projects.vercel.app
- **Staging**: (URL provided by development team)

**How to Reach Step 3:**
1. Sign in to the application
2. Complete Step 1 (Event Details) → Click "Continue to The Story"
3. Complete Step 2 (Story) → Click "Approve this Direction" → "Continue to Visual Style ✨"
4. Complete Step 2b (Visual Style) → Select a style → "Continue to Visual Design"
5. You should now be on Step 3

**Important Notes:**
- Step 3 automatically creates 3 scenes from your story (Step 2)
- Each scene tab shows duration badge (e.g., "10s" or "5s")
- Green checkmarks in scene tabs indicate BOTH frames are set (not video validation)
- Video validation status is shown on the "Approve Video" button

---

## Scene Management Testing

### Test 1: View Auto-Generated Scenes

**Objective**: Verify 3 scenes are automatically created from your story.

**Steps:**

1. **Navigate to Step 3**
   - Complete Steps 1, 2, and 2b for a project
   - Click "Continue to Visual Design" from Step 2b
   - **Expected Result**: Page loads with title "Step 3/5: Visual Design 🎨"

2. **Check Scene Tabs**
   - Look at the scene selector at the top
   - **Expected Result**: 3 scene tabs visible (Scene 1, Scene 2, Scene 3)
   - **Expected Result**: Each tab shows duration (e.g., "10s")
   - **Expected Result**: Scene 1 is selected by default

3. **Verify Scene Content**
   - Look at the "Scene Details" card
   - **Expected Result**: Scene Title field shows scene name
   - **Expected Result**: Scene Description field has auto-generated text from your story
   - **Expected Result**: Duration dropdown shows "10 seconds" or "5 seconds"

4. **Switch Between Scenes**
   - Click on Scene 2 tab
   - **Expected Result**: Content changes to Scene 2's details
   - **Expected Result**: Different description from Scene 1
   - Click on Scene 3 tab
   - **Expected Result**: Scene 3 content appears

**✅ Success Criteria:**
- [ ] Page loads with correct title
- [ ] 3 scene tabs are visible
- [ ] Each scene has unique content
- [ ] Can switch between scenes
- [ ] Scene titles are descriptive

**❌ Common Issues to Report:**
- Less than 3 scenes appear
- Scenes have no descriptions
- All scenes have identical content
- Can't switch between scenes
- Page shows loading forever

---

### Test 2: Edit Scene Details

**Objective**: Verify you can modify scene information.

**Steps:**

1. **Edit Scene Title**
   - Select Scene 1
   - Click in the "Scene Title" field
   - Change the title to "My Custom Scene Title"
   - Click elsewhere (blur the field)
   - **Expected Result**: Title updates in the scene tab

2. **Edit Scene Description**
   - Click in the "Scene Description" field
   - Modify the description text
   - **Expected Result**: Changes are accepted

3. **Change Duration**
   - Click on the Duration dropdown
   - **Expected Result**: Options "5 seconds" and "10 seconds" appear
   - Select a different duration
   - **Expected Result**: Duration updates in the scene tab

4. **Verify Changes Persist**
   - Refresh the page (F5 or Cmd+R)
   - **Expected Result**: All your changes are still there
   - **Expected Result**: Title, description, and duration saved

**✅ Success Criteria:**
- [ ] Can edit scene title
- [ ] Can edit scene description
- [ ] Can change duration (5s or 10s)
- [ ] Changes persist after refresh

**❌ Common Issues to Report:**
- Can't edit fields
- Changes don't save
- Changes lost after refresh
- Duration options missing

---

## AI Image Generation Testing

### Test 3: Open Frame Selection Modal

**Objective**: Verify you can open the frame selection interface.

**Steps:**

1. **Locate Frame Section**
   - Select Scene 1
   - Scroll down to "Set Your Frames" card
   - **Expected Result**: See "Start Frame" and "End Frame" sections

2. **Open Start Frame Selector**
   - Click on the Start Frame area (shows "Create Visual" and "Click to select start frame")
   - **Expected Result**: Modal opens with title "Select Start Frame"
   - **Expected Result**: Subtitle: "Choose from your assets, upload a new image, or generate one with AI"

3. **Check Modal Tabs**
   - **Expected Result**: 3 tabs visible:
     - "Project Assets" (default selected)
     - "Upload New"
     - "AI Generator"

**✅ Success Criteria:**
- [ ] "Set Your Frames" section visible
- [ ] Can click to open frame selector
- [ ] Modal opens with correct title
- [ ] 3 tabs are visible

**❌ Common Issues to Report:**
- Can't find frame section
- Button doesn't respond
- Modal doesn't open
- Tabs missing

---

### Test 4: Generate AI Images

**Objective**: Verify AI image generation works correctly.

**Steps:**

1. **Navigate to AI Generator Tab**
   - Open frame selector modal
   - Click "AI Generator" tab
   - **Expected Result**: Form appears with:
     - Title: "AI Image Generator"
     - Subtitle: "Create completely new images from your imagination"
     - Prompt text area: "Describe the image you want to create *"

2. **Check Credit Display**
   - Look for image count selector
   - **Expected Result**: Shows "Number of images to generate" with + and - buttons
   - **Expected Result**: Default is 4 images (count displayed between +/- buttons)
   - **Expected Result**: Shows "{count} credits per image" below the count
   - **Expected Result**: Shows total credits badge (e.g., "20 credits") next to the label
   - **Expected Result**: Shows "Your balance:" followed by credit count below

3. **Adjust Image Count**
   - Click - button to reduce to 1 image
   - **Expected Result**: Count changes to 1
   - **Expected Result**: Total credits shows "5 credits"
   - Click + button to increase back to 4
   - **Expected Result**: Count changes to 4

4. **Enter a Prompt**
   - Type: "A romantic sunset beach wedding with couple silhouettes"
   - **Expected Result**: Text appears in prompt field

5. **Generate Images**
   - Click "Generate 4 AI Images" button
   - **Expected Result**: Button shows loading state "Creating 4 Options..."
   - Wait 30-60 seconds
   - **Expected Result**: 4 generated images appear in a grid

6. **Review Generated Images**
   - Look at the 4 options
   - **Expected Result**: Images are different variations
   - **Expected Result**: Images match your prompt description
   - **Expected Result**: Quality is good (not blurry)

7. **Select an Image**
   - Click "Select This Image" on your preferred option
   - **Expected Result**: Modal closes
   - **Expected Result**: Selected image appears in the Start Frame area

**✅ Success Criteria:**
- [ ] AI Generator tab accessible
- [ ] Credit display is accurate
- [ ] Can adjust image count (1-4)
- [ ] Can enter prompt text
- [ ] Generate button works
- [ ] Loading indicator visible
- [ ] 4 images generated
- [ ] Can select an image
- [ ] Image appears in frame

**❌ Common Issues to Report:**
- AI Generator tab not visible
- Credit display incorrect
- Generation fails
- No images appear
- Images are poor quality
- Can't select generated image

---

### Test 5: Image Generation with Different Counts

**Objective**: Verify different image count options work.

**Steps:**

1. **Generate 1 Image**
   - Open frame selector for End Frame
   - Go to AI Generator tab
   - Set count to 1
   - Enter prompt: "Elegant wedding reception party"
   - Click "Generate 1 AI Image"
   - **Expected Result**: 1 image generated

2. **Generate 2 Images**
   - Open frame selector for Scene 2 Start Frame
   - Set count to 2
   - Enter prompt: "Bride getting ready with flowers"
   - Generate
   - **Expected Result**: 2 images generated

3. **Verify Credit Deduction**
   - Check your credit balance after each generation
   - **Expected Result**: 5 credits deducted per image generated

**✅ Success Criteria:**
- [ ] Can generate 1, 2, 3, or 4 images
- [ ] Correct number of images appear
- [ ] Credits deducted correctly

**❌ Common Issues to Report:**
- Wrong number of images generated
- Credits not deducted
- Generation fails for lower counts

---

## AI Image Transform Testing

### Test 6: Transform Project Asset

**Objective**: Verify you can use AI to transform existing images.

**Steps:**

1. **Open Frame Selector**
   - Open frame selector for any scene
   - Stay on "Project Assets" tab
   - **Expected Result**: Your previously generated images appear

2. **Locate Transform Section**
   - Look at the right side of the modal (or below on mobile)
   - **Expected Result**: See "AI Transform Selected Image" section
   - **Expected Result**: Empty state shows wand icon with: "Click 'AI Transform' on any image above to start"

3. **Select Image for Transform**
   - On a project asset, click "AI Transform" button
   - **Expected Result**: Image appears in the transform section
   - **Expected Result**: Prompt field appears

4. **Enter Transform Prompt**
   - Type: "Make it more vintage with sepia tones"
   - **Expected Result**: Text appears in prompt field

5. **Generate Transform Options**
   - **Expected Result**: "Images to generate:" selector with +/- buttons appears
   - Adjust image count if desired (1-4 images)
   - Click purple "Transform (X images)" button (shows credits badge)
   - **Expected Result**: Button changes to "Transforming X images..."
   - Wait for generation (30-60 seconds)
   - **Expected Result**: New variations appear based on original + your prompt

6. **Select Transformed Image**
   - Choose a transformed version
   - **Expected Result**: Transformed image is selected as frame

**✅ Success Criteria:**
- [ ] Can see project assets
- [ ] AI Transform section visible
- [ ] Can select image for transform
- [ ] Can enter transform prompt
- [ ] Transform generates variations
- [ ] Can use transformed image

**❌ Common Issues to Report:**
- No assets visible
- Transform section missing
- Transform fails
- Results don't match prompt

---

### Test 7: Upload and Transform

**Objective**: Verify you can upload images and transform them with AI.

**Steps:**

1. **Go to Upload Tab**
   - Open frame selector
   - Click "Upload New" tab
   - **Expected Result**: Upload interface appears

2. **Check Upload Options**
   - **Expected Result**: See "Upload and use your images:" info section
   - **Expected Result**: Shows two workflow options:
     - "Upload & Use" - Upload images to use directly
     - "Upload & Transform" - Upload, then AI transform
   - **Expected Result**: Below shows "Upload Images" dropzone
   - **Expected Result**: Dropzone text: "Click to select files or drag and drop"
   - **Expected Result**: Blue "Choose Files" button

3. **Upload an Image**
   - Click "Choose Files" or drag an image
   - **Expected Result**: Image uploads
   - **Expected Result**: Progress indicator shows

4. **Transform Uploaded Image**
   - After upload, click "AI Transform"
   - Enter prompt: "Add romantic lighting"
   - Generate
   - **Expected Result**: Transformed variations appear

**✅ Success Criteria:**
- [ ] Upload tab accessible
- [ ] Can upload images
- [ ] Upload progress visible
- [ ] Can transform uploaded images
- [ ] Transform works correctly

**❌ Common Issues to Report:**
- Upload fails
- Can't transform after upload
- Transform doesn't use original image

---

## Video Generation Testing

### Test 8: Set Both Frames for a Scene

**Objective**: Verify you can set both start and end frames for video generation.

**Steps:**

1. **Set Start Frame**
   - Select Scene 1
   - In "Set Your Frames" section, look for Start Frame area
   - **Expected Result**: Start Frame shows "Create Visual" with "Click to select start frame"
   - **Expected Result**: End Frame section is NOT yet visible (appears only after start frame is set)
   - Click on the Start Frame area
   - Generate or select an image
   - **Expected Result**: Start Frame shows the selected image
   - **Expected Result**: "Start Frame Created" text appears
   - **Expected Result**: "Click to change start frame" appears below
   - **Expected Result**: Red X delete button appears in top-right corner

2. **Set End Frame** (Now Visible)
   - **Expected Result**: End Frame section now appears below Start Frame
   - **Expected Result**: Shows "End Frame" title with description
   - Click on the End Frame area (shows "Create Visual")
   - Generate or select a different image
   - **Expected Result**: End Frame shows the selected image

3. **Verify Both Frames Set**
   - **Expected Result**: Both frames show images (not placeholder)
   - **Expected Result**: Images are clearly different (start vs end)
   - **Expected Result**: Video generator section becomes visible

**✅ Success Criteria:**
- [ ] Can set start frame
- [ ] Can set end frame
- [ ] Both frames display correctly
- [ ] Frames are different images
- [ ] Video generator section appears

**❌ Common Issues to Report:**
- Can't set frames
- Frames show same image
- Video generator doesn't appear
- Images don't save

---

### Test 9: Generate Scene Video

**Objective**: Verify AI video generation works correctly.

**Steps:**

1. **Locate Video Generator**
   - After setting both frames, scroll down
   - **Expected Result**: See "Video Generation" card with play icon
   - **Expected Result**: Shows "Ready to Generate Scene Video" heading
   - **Expected Result**: Shows "Create a {duration}s video transitioning from start to end frame"
   - **Expected Result**: Generate button shows "Generate Scene Video" with "20 credits" badge

2. **Check Prerequisites**
   - **Expected Result**: Start Frame image shown
   - **Expected Result**: End Frame image shown
   - **Expected Result**: "Generate Scene Video" button is enabled

3. **Start Video Generation**
   - Click "Generate Scene Video" button
   - **Expected Result**: Loading spinner with pulsing ring appears
   - **Expected Result**: Status shows "Generating Scene Video..."
   - **Expected Result**: Below that shows "Queued for processing" or "Creating your video"
   - **Expected Result**: Progress bar appears below (showing percentage)

4. **Wait for Generation**
   - Video generation takes 1-2 minutes
   - **Expected Result**: Progress bar fills up with percentage displayed
   - **Expected Result**: Status message updates from "Queued" to "Creating your video"
   - **Expected Result**: On completion, shows "Scene Video Generated Successfully!" with green checkmark

5. **Review Generated Video**
   - **Expected Result**: Video player with controls appears (aspect ratio matches video)
   - **Expected Result**: Video uses start frame as poster image
   - **Expected Result**: Can click play button to watch the video
   - **Expected Result**: Video transitions smoothly from start to end frame
   - **Expected Result**: Three buttons appear below video:
     - "Refine with AI (X left)" - outline button with credits badge
     - "Download Video" - outline button
     - "Approve Video" - blue button

6. **Verify Credit Deduction**
   - Check your credit balance
   - **Expected Result**: 20 credits deducted

**✅ Success Criteria:**
- [ ] Video generator section visible
- [ ] Generate button works
- [ ] Loading/progress indicator shows
- [ ] Video completes within 2 minutes
- [ ] Video preview appears
- [ ] Can play the video
- [ ] Video transitions correctly
- [ ] Credits deducted

**❌ Common Issues to Report:**
- Generate button doesn't work
- No progress indicator
- Generation times out (> 5 minutes)
- Video doesn't appear
- Video won't play
- Video quality is poor
- Credits not deducted or double-charged

---

### Test 10: Approve Scene Video

**Objective**: Verify you can approve/validate a generated video.

**Steps:**

1. **Find Approval Button**
   - After video generation completes
   - Look for "Approve Video" button
   - **Expected Result**: Button is visible and enabled

2. **Approve the Video**
   - Click "Approve Video" (blue button)
   - **Expected Result**: Button changes to "✓ Video Validated" (green background)
   - **Expected Result**: Button becomes disabled (can't click again)
   - **Note**: Scene tab checkmark indicates frames are set (not video validated)
   - **Note**: Video validation is tracked internally and enables the Continue button when all scenes are done

3. **Verify Approval Persists**
   - Refresh the page
   - **Expected Result**: Video still shows as validated
   - **Expected Result**: Green checkmark still visible

**✅ Success Criteria:**
- [ ] Approve button visible
- [ ] Can click to approve
- [ ] Status changes to validated
- [ ] Scene tab shows checkmark
- [ ] Approval persists after refresh

**❌ Common Issues to Report:**
- Approve button missing after video generation
- Button doesn't respond when clicked
- Button text doesn't change to "✓ Video Validated"
- Validation status lost after page refresh
- Can still click button after validation (should be disabled)

---

## Video Regeneration Testing

### Test 11: Open Regeneration Chat

**Objective**: Verify you can access the video regeneration feature.

**Steps:**

1. **Find Regenerate Option**
   - On a scene with a generated video (before or after approval)
   - Look for "Refine with AI (X left)" button
   - **Expected Result**: Button shows regeneration count (e.g., "2 left")

2. **Open Regeneration Chat**
   - Click "Refine with AI" button
   - **Expected Result**: Dialog/modal opens
   - **Expected Result**: Title: "Refine Scene Video with AI"
   - **Expected Result**: Shows "Regenerations remaining: X of Y"

3. **Read Initial Message**
   - **Expected Result**: AI message appears immediately (no need to send message first)
   - **Expected Result**: Message starts with: "I'll help you refine this scene. What would you like to change about the current video?"
   - **Expected Result**: Shows "**Current Scene:** {Scene Title}" followed by scene description
   - **Expected Result**: Ends with: "Please describe what you'd like to improve or change in the video generation."

**✅ Success Criteria:**
- [ ] "Refine with AI" button visible
- [ ] Shows regeneration count
- [ ] Chat dialog opens
- [ ] AI greeting appears
- [ ] Scene context shown

**❌ Common Issues to Report:**
- Button not visible
- Wrong regeneration count
- Dialog doesn't open
- No AI message

---

### Test 12: Request Video Changes

**Objective**: Verify you can chat with AI to refine video.

**Steps:**

1. **Send Refinement Request**
   - In the chat, type: "Make the camera movement slower and more dramatic"
   - Click submit button
   - **Expected Result**: Your message appears in chat
   - **Expected Result**: Loading indicator shows
   - **Expected Result**: AI responds with suggestions

2. **Approve and Regenerate**
   - After AI response, look for approval buttons at the bottom
   - Click "✓ Approve this Direction" button
   - **Expected Result**: Button turns green and shows "✓ Approved"
   - **Expected Result**: New button appears: "Regenerate Scene Video ✨"
   - Click "Regenerate Scene Video ✨"
   - **Expected Result**: Dialog closes
   - **Expected Result**: Video regeneration starts (shows generating state)

3. **Wait for Regeneration**
   - Wait 1-2 minutes
   - **Expected Result**: New video appears
   - **Expected Result**: Regeneration count decreases by 1

4. **Verify Credit Deduction**
   - **Expected Result**: 20 credits deducted for regeneration

**✅ Success Criteria:**
- [ ] Can send chat messages
- [ ] AI responds contextually
- [ ] Can approve direction
- [ ] Regeneration starts
- [ ] New video appears
- [ ] Count decreases
- [ ] Credits deducted

**❌ Common Issues to Report:**
- Chat doesn't work
- AI doesn't respond
- Can't approve
- Regeneration fails
- Count doesn't update

---

### Test 13: Maximum Regenerations

**Objective**: Verify regeneration limit is enforced.

**Steps:**

1. **Check Regeneration Limit**
   - Look at "Refine with AI (X left)" button
   - **Expected Result**: Shows current remaining count (typically 2-3)

2. **Use All Regenerations** (optional - uses many credits)
   - Regenerate until count reaches 0
   - **Expected Result**: Each regeneration decreases count

3. **Verify Limit Reached**
   - When count is 0
   - **Expected Result**: Button disabled or shows different text
   - **Expected Result**: Cannot regenerate anymore

**✅ Success Criteria:**
- [ ] Regeneration count accurate
- [ ] Count decreases correctly
- [ ] Limit is enforced

**❌ Common Issues to Report:**
- Wrong count shown
- Can regenerate past limit
- Limit not enforced

---

## Complete Workflow Testing

### Test 14: Complete Scene 1 Workflow

**Objective**: Verify the complete workflow for one scene.

**Steps:**

1. **Start with Scene 1**
   - Navigate to Step 3
   - Select Scene 1
   - **Expected Result**: Scene details and frames visible

2. **Generate Start Frame**
   - Click "Select start frame"
   - Go to AI Generator tab
   - Enter prompt describing your opening visual
   - Generate 4 images
   - Select the best one
   - **Expected Result**: Start frame set

3. **Generate End Frame**
   - Click "Select end frame"
   - Enter prompt describing your closing visual
   - Generate and select an image
   - **Expected Result**: End frame set

4. **Generate Video**
   - Click "Generate Scene Video"
   - Wait for completion
   - **Expected Result**: Video preview appears

5. **Approve Video**
   - Watch the video
   - Click "Approve Video"
   - **Expected Result**: Button changes to "✓ Video Validated" (green)
   - **Note**: Scene tab already shows checkmark (from when frames were set)

**✅ Success Criteria:**
- [ ] Can generate start frame
- [ ] Can generate end frame  
- [ ] Scene tab shows checkmark after both frames set
- [ ] Can generate video
- [ ] Can approve video (button turns green)

**❌ Common Issues to Report:**
- Workflow breaks at any step
- Can't proceed to next action
- Data lost between steps

---

### Test 15: Complete All 3 Scenes

**Objective**: Verify all 3 scenes can be completed and validated.

**Steps:**

1. **Complete Scene 1** (if not already done)
   - Generate frames → Generate video → Approve

2. **Complete Scene 2**
   - Switch to Scene 2 tab
   - Repeat: Generate start frame → Generate end frame → Generate video → Approve
   - **Expected Result**: Scene 2 shows green checkmark

3. **Complete Scene 3**
   - Switch to Scene 3 tab
   - Repeat workflow
   - **Expected Result**: Scene 3 shows green checkmark

4. **Verify All Scenes Ready**
   - Look at all 3 scene tabs
   - **Expected Result**: All 3 show green checkmarks (indicates frames are set)
   - **Expected Result**: Each scene has "✓ Video Validated" button visible
   - **Expected Result**: Bottom action bar button changes to "Continue to Narration" (blue)
   - **Note**: If narration was previously approved, button shows "Continue to Sound Design (Free)" (green)

**✅ Success Criteria:**
- [ ] Scene 1: frames set, video generated, video validated
- [ ] Scene 2: frames set, video generated, video validated
- [ ] Scene 3: frames set, video generated, video validated
- [ ] All scene tabs show checkmarks (frames set)
- [ ] All Approve Video buttons show "✓ Video Validated"
- [ ] Continue button is enabled and clickable

**❌ Common Issues to Report:**
- Can't complete all scenes
- Checkmarks don't appear
- Continue button disabled
- Scenes reset when switching

---

### Test 16: Navigate to Next Step

**Objective**: Verify you can proceed after completing all scenes.

**Steps:**

1. **Ensure All Scenes Validated**
   - All 3 scenes should have green checkmarks

2. **Check Button State**
   - Look at bottom action bar
   - **Expected Result**: If all scenes validated → "Continue to Narration" (blue button)
   - **Expected Result**: If narration previously approved → "Continue to Sound Design (Free)" (green button)
   - **Note**: If narration was approved, you'll also see "Regenerate Narration" button

3. **Click Continue Button**
   - Click the main Continue button

4. **Verify Navigation**
   - **Expected Result**: Navigates to Step 3b (Narration) if narration not yet approved
   - **Expected Result**: OR navigates to Step 4 (Sound Design) if narration was previously approved
   - **Expected Result**: No errors during transition
   - **Expected Result**: Your scene data is preserved (can navigate back to verify)

4. **Return to Step 3** (optional)
   - Click Back button
   - **Expected Result**: All your scenes still validated
   - **Expected Result**: Videos still available

**✅ Success Criteria:**
- [ ] Continue button visible when all validated
- [ ] Button text is appropriate
- [ ] Navigation works
- [ ] No errors
- [ ] Data preserved after navigation

**❌ Common Issues to Report:**
- Button not visible
- Button disabled incorrectly
- Navigation fails
- Data lost after navigating
- Can't return to Step 3

---

## Mobile Testing

### Test 17: Mobile Scene Management

**Objective**: Verify Step 3 works on mobile devices.

**Prerequisites**: iPhone or Android phone

**Steps:**

1. **Open Step 3 on Mobile**
   - Open Safari (iPhone) or Chrome (Android)
   - Sign in and navigate to Step 3
   - **Expected Result**: Page loads correctly
   - **Expected Result**: Scene tabs visible

2. **Switch Between Scenes**
   - Tap on different scene tabs
   - **Expected Result**: Content switches correctly
   - **Expected Result**: Tabs are easy to tap (not too small)

3. **Edit Scene Details**
   - Tap on scene title field
   - **Expected Result**: Keyboard appears
   - **Expected Result**: Can type and edit

4. **Verify Mobile Layout**
   - **Expected Result**: Content fits screen
   - **Expected Result**: No horizontal scrolling needed
   - **Expected Result**: Buttons are large enough to tap

**✅ Success Criteria:**
- [ ] Page loads on mobile
- [ ] Scene tabs accessible
- [ ] Can switch scenes
- [ ] Can edit fields
- [ ] Layout is mobile-friendly

**❌ Common Issues to Report:**
- Page doesn't load
- Elements too small
- Can't tap buttons
- Horizontal scrolling required

---

### Test 18: Mobile AI Image Generation

**Objective**: Verify image generation works on mobile.

**Steps:**

1. **Open Frame Selector on Mobile**
   - Tap "Select start frame"
   - **Expected Result**: Modal opens

2. **Navigate to AI Generator**
   - Tap "AI Generator" tab
   - **Expected Result**: Generator form appears
   - **Expected Result**: All elements visible and accessible

3. **Generate Images on Mobile**
   - Enter a prompt
   - Adjust image count
   - Tap generate button
   - **Expected Result**: Generation starts
   - **Expected Result**: Loading indicator visible
   - Wait for completion
   - **Expected Result**: Images appear in grid

4. **Select Image on Mobile**
   - Tap "Select This Image"
   - **Expected Result**: Image selected
   - **Expected Result**: Modal closes

**✅ Success Criteria:**
- [ ] Frame selector opens on mobile
- [ ] AI Generator accessible
- [ ] Can enter prompt
- [ ] Generation works
- [ ] Can select generated image

**❌ Common Issues to Report:**
- Modal doesn't open
- Form elements too small
- Generation fails on mobile
- Can't select images

---

### Test 19: Mobile Video Generation

**Objective**: Verify video generation works on mobile.

**Steps:**

1. **Set Up Frames on Mobile**
   - Complete start and end frame selection

2. **Generate Video on Mobile**
   - Scroll to video generator section
   - Tap "Generate Scene Video"
   - **Expected Result**: Generation starts
   - Wait for completion

3. **Preview Video on Mobile**
   - **Expected Result**: Video preview appears
   - Tap play button
   - **Expected Result**: Video plays on mobile
   - **Expected Result**: Good quality on mobile screen

4. **Approve Video on Mobile**
   - Tap "Approve Video"
   - **Expected Result**: Status changes
   - **Expected Result**: Checkmark visible

**✅ Success Criteria:**
- [ ] Video generation works on mobile
- [ ] Video preview visible
- [ ] Video plays correctly
- [ ] Can approve on mobile

**❌ Common Issues to Report:**
- Generation fails on mobile
- Video doesn't display
- Video won't play
- Approve button doesn't work

---

### Test 20: Mobile Upload (Photo Library)

**Objective**: Verify you can upload photos from phone library.

**Steps:**

1. **Open Upload Tab**
   - Open frame selector
   - Tap "Upload New" tab

2. **Choose Photo**
   - Tap "Choose Files" or upload area
   - **Expected Result**: Photo library opens
   - Select a photo
   - **Expected Result**: Photo uploads

3. **Use Uploaded Photo**
   - After upload, photo appears in the grid
   - Click blue "Use Image" button on uploaded photo
   - **Expected Result**: Modal closes
   - **Expected Result**: Photo appears as the selected frame

**✅ Success Criteria:**
- [ ] Photo library opens
- [ ] Can select photos
- [ ] Upload completes
- [ ] Photo usable as frame

**❌ Common Issues to Report:**
- Library doesn't open
- Upload fails
- Photo not usable

---

## Error Handling Testing

### Test 21: Insufficient Credits

**Objective**: Verify insufficient credits are handled gracefully.

**Steps:**

1. **Check Current Balance**
   - Note your credit balance

2. **Try Generation with Low Credits**
   - If balance < 20 credits, try to generate a video
   - **Expected Result**: "Insufficient Credits" modal appears
   - **Expected Result**: Shows required vs available credits
   - **Expected Result**: Clear call-to-action (Buy Credits / Close)

3. **Try Image Generation with Low Credits**
   - If balance < 5 credits, try to generate images
   - **Expected Result**: Similar insufficient credits handling

**✅ Success Criteria:**
- [ ] Insufficient credits modal appears
- [ ] Shows accurate credit amounts
- [ ] Clear messaging
- [ ] Can close and continue

**❌ Common Issues to Report:**
- No warning for low credits
- Wrong credit amounts shown
- App crashes
- Generation starts anyway

---

### Test 22: Video Generation Failure

**Objective**: Verify failed generation is handled gracefully.

**Steps:**

1. **Start Video Generation**
   - Begin generating a scene video

2. **If Generation Fails** (may need to simulate)
   - **Expected Result**: Error message appears
   - **Expected Result**: Message is user-friendly
   - **Expected Result**: Credits should be refunded

3. **Verify Recovery**
   - **Expected Result**: Can try again
   - **Expected Result**: "Try Again" button available
   - **Expected Result**: Page doesn't freeze

**✅ Success Criteria:**
- [ ] Error message appears on failure
- [ ] Message is clear
- [ ] Credits refunded
- [ ] Can retry generation

**❌ Common Issues to Report:**
- No error message
- Credits not refunded
- Page crashes
- Can't retry

---

### Test 23: Empty Prompt Validation

**Objective**: Verify empty prompts are prevented.

**Steps:**

1. **Try Empty Image Prompt**
   - Open AI Generator
   - Leave prompt field empty
   - Try to click generate button
   - **Expected Result**: Button is disabled
   - **Expected Result**: Can't generate without prompt

2. **Try Whitespace-Only Prompt**
   - Enter only spaces
   - **Expected Result**: Button remains disabled

**✅ Success Criteria:**
- [ ] Generate button disabled when empty
- [ ] Whitespace-only rejected
- [ ] Clear indication prompt is required

**❌ Common Issues to Report:**
- Can generate with empty prompt
- No validation
- Unclear error message

---

### Test 24: Frame Selection Required

**Objective**: Verify video can't be generated without both frames.

**Steps:**

1. **Set Only Start Frame**
   - Set start frame, leave end frame empty
   - Scroll down to look for video generator section
   - **Expected Result**: Video Generator section is NOT visible
   - **Expected Result**: Only "Set Your Frames" section visible with End Frame area
   - **Expected Result**: Bottom action button shows "Select frames for Scene X" (disabled)

2. **Delete Start Frame After Setting End**
   - Set both frames first
   - Click the red X button on start frame to delete it
   - **Expected Result**: Start frame is removed
   - **Expected Result**: End Frame section disappears (only shows when start is set)
   - **Expected Result**: Video Generator section disappears

3. **Set Both Frames**
   - Set both frames
   - **Expected Result**: Generate button enabled

**✅ Success Criteria:**
- [ ] Can't generate video without both frames
- [ ] Clear indication of what's missing
- [ ] Button enabled when both set

**❌ Common Issues to Report:**
- Can generate without frames
- No indication of missing frame
- Button state doesn't update

---

## Reporting Issues

### How to Report a Bug

When you find a problem, please include:

1. **Bug Title**: Short description (e.g., "Video generation fails on Scene 2")

2. **Steps to Reproduce**:
   ```
   1. Open Step 3 on Chrome, Windows PC
   2. Complete Scene 1 successfully
   3. Switch to Scene 2
   4. Set start and end frames
   5. Click "Generate Scene Video"
   6. Generation starts but fails at 50%
   ```

3. **Expected Behavior**: What should happen (e.g., "Video should generate successfully")

4. **Actual Behavior**: What actually happened (e.g., "Error message appears, no video")

5. **Environment**:
   - Device: (e.g., iPhone 14 Pro, Windows PC, Samsung S21)
   - Browser: (e.g., Safari 17, Chrome 120)
   - Connection: (e.g., WiFi, 4G)
   - Credit balance: (e.g., "Had 50 credits before test")

6. **Screenshots/Screen Recording** (if possible):
   - Screenshot of error
   - Screenshot of broken UI
   - Screen recording of the issue

7. **Credit Impact** (if applicable):
   - Were credits deducted incorrectly?
   - Were credits refunded after failure?

### Bug Priority Guide

**🔴 Critical (Report Immediately)**:
- Video generation always fails
- App crashes during generation
- Credits deducted but no result
- Can't complete any scene
- All data lost

**🟡 High (Report Soon)**:
- Image generation fails frequently
- Video quality very poor
- Credits not refunded on failure
- Can't approve videos
- Mobile completely broken

**🟢 Medium (Report When Convenient)**:
- Generation is slow (but works)
- UI elements misaligned
- Error messages unclear
- Minor visual glitches

**🔵 Low (Nice to Fix)**:
- Image quality could be better
- Minor UI inconsistencies
- Small text issues
- Animation smoothness

---

## Testing Checklist Summary

**Sprint 4: Step 3 Visual Design** (24 tests)

### Scene Management (2 tests)
- [ ] Test 1: View Auto-Generated Scenes
- [ ] Test 2: Edit Scene Details

### AI Image Generation (5 tests)
- [ ] Test 3: Open Frame Selection Modal
- [ ] Test 4: Generate AI Images
- [ ] Test 5: Image Generation with Different Counts
- [ ] Test 6: Transform Project Asset
- [ ] Test 7: Upload and Transform

### Video Generation (3 tests)
- [ ] Test 8: Set Both Frames for a Scene
- [ ] Test 9: Generate Scene Video
- [ ] Test 10: Approve Scene Video

### Video Regeneration (3 tests)
- [ ] Test 11: Open Regeneration Chat
- [ ] Test 12: Request Video Changes
- [ ] Test 13: Maximum Regenerations

### Complete Workflow (3 tests)
- [ ] Test 14: Complete Scene 1 Workflow
- [ ] Test 15: Complete All 3 Scenes
- [ ] Test 16: Navigate to Next Step

### Mobile (4 tests)
- [ ] Test 17: Mobile Scene Management
- [ ] Test 18: Mobile AI Image Generation
- [ ] Test 19: Mobile Video Generation
- [ ] Test 20: Mobile Upload (Photo Library)

### Error Handling (4 tests)
- [ ] Test 21: Insufficient Credits
- [ ] Test 22: Video Generation Failure
- [ ] Test 23: Empty Prompt Validation
- [ ] Test 24: Frame Selection Required

**Total**: 24 comprehensive tests covering Step 3 Visual Design

---

## Important Notes

### What's Tested in Sprint 4
- ✅ Scene management (view, edit, switch between 3 scenes)
- ✅ AI image generation (1-4 images from text)
- ✅ AI image transform (modify existing images)
- ✅ Video generation (from start/end frames)
- ✅ Video regeneration (with AI chat)
- ✅ Complete workflow (all 3 scenes → next step)
- ✅ Mobile experience
- ✅ Error handling and credit management

### What's NOT Tested in Sprint 4
- ❌ Step 3b Narration (tested in Sprint 5)
- ❌ Step 4 Sound Design (tested in Sprint 6)
- ❌ Sharing and export (tested later)

### Credit Requirements Summary
| Action | Credits |
|--------|---------|
| Image generation (per image) | 5 |
| Video generation (per scene) | 20 |
| Video regeneration (per scene) | 20 |

**Recommended**: Start with at least 150 credits for complete testing.

### Performance Expectations
- **Image generation**: 30-60 seconds for 4 images
- **Video generation**: 1-2 minutes per scene
- **Video regeneration**: 1-2 minutes

### Key UI Behaviors to Remember
- **End Frame only visible after Start Frame is set** - Sequential workflow
- **Video Generator only visible after BOTH frames are set**
- **Scene tab checkmarks = frames set** (not video validated)
- **Video validated status = button shows "✓ Video Validated"**
- **Bottom action button is dynamic** - Changes based on current scene progress

---

## Questions or Help Needed?

If you have questions or need clarification:
1. Contact the development team
2. Refer to this guide
3. Ask for a demo walkthrough of Step 3

**Thank you for testing Sprint 4!** Your feedback ensures our visual design and video generation features work perfectly. 🎨✨

---

**Last Updated**: December 23, 2025  
**Version**: 2.0  
**Status**: Ready for QA Team  
**Sprint**: Sprint 4 - Step 3 Visual Design (Images + Videos)

