# 🧪 MyShortReel - Sprint 5: Manual Testing Guide

**Sprint**: Sprint 5 - AI Integration (Chat + Prompts + Images)  
**Date Created**: November 19, 2025  
**Audience**: Non-technical QA testers  
**Status**: Ready for Testing  
**Estimated Time**: 2-2.5 hours

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Test Setup](#test-setup)
3. [AI Chat Testing (Step 2)](#ai-chat-testing-step-2)
4. [Prompt Enhancement Testing](#prompt-enhancement-testing)
5. [AI Image Generation Testing](#ai-image-generation-testing)
6. [Video Refinement Chat Testing](#video-refinement-chat-testing)
7. [Mobile Testing](#mobile-testing)
8. [Error Handling Testing](#error-handling-testing)
9. [Reporting Issues](#reporting-issues)

---

## Introduction

### What You're Testing

Sprint 5 added **AI-powered features** to MyShortReel. You will verify:

- **AI Director Chat** (Step 2): Chat with an AI that helps you create your story
- **Prompt Enhancement**: AI improves your image descriptions automatically
- **AI Image Generation**: Generate scene images from text descriptions
- **Video Refinement Chat**: Chat with AI to refine video scenes
- **Mobile AI Experience**: All AI features work smoothly on phones

### Why This Matters

Before Sprint 5, you had to write everything manually. Sprint 5 adds an **AI Director** that:
- Asks questions about your event
- Helps you write scene descriptions
- Makes your image descriptions better
- Generates images from your descriptions
- Helps refine your videos

### What's New

**New AI Features**:
- ✅ Chat with AI Director in Step 2 to refine your story
- ✅ Start Over with a New Idea button for fresh story generation
- ✅ AI-generated story includes scene breakdowns
- ✅ Automatic prompt enhancement when generating images
- ✅ AI generates multiple images (1-4 options) for scene frames
- ✅ Video refinement chat for regenerating scene videos

**AI Models Used**:
- **OpenAI GPT-4o**: For conversations and story refinement
- **OpenAI GPT-4o-mini**: For quick tasks (prompt enhancement)
- **fal.ai Flux Schnell**: For image generation

---

## Test Setup

### Before You Start

**You'll Need:**
1. A computer with a modern web browser
2. A smartphone (iPhone or Android) for mobile testing
3. A valid user account (sign in first)
4. An existing project (created in Step 1)
5. Patience (AI responses take 1-5 seconds)

**What to Prepare:**
- Think of an event (wedding, birthday, graduation)
- Have a story in mind (even a simple one)
- Think of some scene ideas (beach sunset, party celebration, etc.)

**Application URL:**
- **Production Deployment**: https://myshortreel-alpha-git-sprint-5-ai-integration-elpi-projects.vercel.app
- **Staging**: (URL provided by development team)

**Important Notes:**
- AI responses take time (be patient!)
- AI responses vary (they won't be identical each time)
- Some features cost money to use (AI services)
- If you see "API key" errors, contact the dev team

---

## AI Chat Testing (Step 2)

### Test 1: Start AI Conversation

**Objective**: Verify Step 2 loads with the AI-generated story from Step 1.

**Steps:**

1. **Navigate to Step 2**
   - Sign in and complete Step 1 (create a project with "Continue to The Story")
   - You'll be automatically redirected to Step 2
   - OR navigate to `/guided/step-2?projectId=[your-project-id]`
   - **Expected Result**: Page loads with title "Step 2/5: The Story ✍️"

2. **Read Initial AI Story**
   - **Expected Result**: AI-generated story appears as an assistant message
   - **Expected Result**: Story includes:
     - Title (bold heading)
     - Narration text
     - Emotional Arc description
     - Scene breakdown (Scene 1, Scene 2, Scene 3 with descriptions and moods)
   - **Expected Result**: If you skipped Step 1, a default 3-scene template appears

3. **Check Chat Interface**
   - **Expected Result**: Text input box at bottom with placeholder "Your feedback... (e.g., 'Make it more romantic')"
   - **Expected Result**: Toolbar below input with:
     - "Start Over with a New Idea" button (outline style)
     - "1 credit/message" badge (gray)
   - **Expected Result**: Submit button on the right (arrow icon)
   - **Expected Result**: Interface looks clean and professional

**✅ Success Criteria:**
- [ ] Page loads with title "Step 2/5: The Story ✍️"
- [ ] AI-generated story appears as assistant message
- [ ] Chat input box is visible with placeholder text
- [ ] Submit button (arrow icon) is visible
- [ ] "Start Over with a New Idea" button is visible in toolbar
- [ ] "1 credit/message" badge is visible in toolbar

**❌ Common Issues to Report:**
- No AI story appears
- Chat interface is broken or missing
- Can't see input box
- Page shows error message
- Interface looks broken

---

### Test 2: Send Message to AI

**Objective**: Verify you can chat with the AI Director to refine your story.

**Steps:**

1. **Type a Message**
   - In the chat input, type: "Make the story more romantic"
   - **Expected Result**: Text appears in the input box

2. **Send the Message**
   - Click the submit button (arrow icon) or press Enter
   - **Expected Result**: Your message appears in the chat conversation
   - **Expected Result**: Your message has distinct styling from AI messages

3. **Wait for AI Response**
   - **Expected Result**: Loading indicator appears (spinner/dots)
   - **Expected Result**: AI response streams in within 5 seconds
   - **Expected Result**: AI response provides a revised story based on your feedback
   - **Expected Result**: 1 credit is deducted from your balance

4. **Check Message Display**
   - **Expected Result**: User and AI messages are visually distinct
   - **Expected Result**: Response is contextual to your project details

**✅ Success Criteria:**
- [ ] Can type message
- [ ] Submit button works
- [ ] Your message appears in chat
- [ ] Loading indicator shows AI is thinking
- [ ] AI response streams in progressively
- [ ] Response is relevant to your story
- [ ] Messages are clearly distinguished (yours vs AI)
- [ ] Credit is deducted after message

**❌ Common Issues to Report:**
- Submit button doesn't work
- Message doesn't appear after sending
- No loading indicator
- AI response never appears
- AI response is nonsense/irrelevant
- Can't tell your messages from AI messages
- Response takes > 30 seconds
- Credit not deducted

---

### Test 3: Multi-Turn Conversation

**Objective**: Verify you can have a back-and-forth conversation with AI to refine your story.

**Steps:**

1. **Start a Conversation**
   - Type feedback: "Make the tone more playful and fun"
   - Send message
   - **Expected Result**: AI responds with a revised story

2. **Send Follow-up Messages**
   - Type: "I like it, but can you add a scene with the guests dancing?"
   - Send message
   - **Expected Result**: AI responds with updated story
   - Continue for 2-3 more exchanges
   - **Expected Result**: Each response builds on previous context

3. **Scroll Through Chat**
   - Scroll up to see earlier messages
   - Scroll down to see latest messages
   - **Expected Result**: All messages are visible
   - **Expected Result**: Scrolling is smooth
   - **Expected Result**: Auto-scroll to newest message works

4. **Check Conversation History Persists**
   - Refresh the page (F5 or Cmd+R)
   - **Expected Result**: All messages are still there
   - **Expected Result**: Chat history persists (saved to Convex)

5. **Use "Start Over with a New Idea"**
   - Look for the "Start Over with a New Idea" button in the input toolbar
   - Click the button
   - **Expected Result**: Loading indicator shows (status = "submitted" then "streaming")
   - **Expected Result**: AI generates a completely fresh story concept
   - **Expected Result**: New AI response streams in and gets added to conversation
   - **Expected Result**: Previous messages remain visible above
   - **Expected Result**: 1 credit is deducted for this AI call

**✅ Success Criteria:**
- [ ] AI responds to multiple messages
- [ ] AI maintains context across messages
- [ ] Can scroll through chat history
- [ ] History persists after page refresh
- [ ] No messages are lost
- [ ] "Start Over" generates fresh content

**❌ Common Issues to Report:**
- AI stops responding after 2-3 messages
- AI loses context (doesn't remember previous messages)
- Can't scroll through chat
- Messages disappear after refresh
- Chat history is lost
- "Start Over" doesn't work

---

### Test 4: AI Story with Scene Breakdown

**Objective**: Verify the AI-generated story includes scene descriptions.

**Steps:**

1. **Review Initial Story**
   - In Step 2, examine the AI-generated story displayed
   - **Expected Result**: Story includes multiple scene breakdowns
   - **Expected Result**: Each scene has a number, description, and mood

2. **Ask AI to Refine Scenes**
   - Type: "Can you add more scenes?" or "Restructure the scenes for a 5-scene story"
   - Send message
   - **Expected Result**: AI responds with an updated story structure
   - **Expected Result**: New scene breakdown is provided

3. **Check Scene Quality**
   - Read the scene descriptions in the AI response
   - **Expected Result**: Scenes are relevant to your event
   - **Expected Result**: Descriptions are detailed (timing, mood, visuals)
   - **Expected Result**: Scenes flow logically

4. **Approve the Direction**
   - After the last AI message, look for approval buttons below the chat
   - Click "✓ Approve this Direction" button
   - **Expected Result**: Button turns green and shows "✓ Approved"
   - **Expected Result**: New button appears: "Continue to Visual Style ✨" (blue)
   - Click "Continue to Visual Style ✨"
   - **Expected Result**: Navigates to Step 2b (Visual Style)

5. **Continue to Step 3 to See Scenes**
   - Complete Step 2b (Visual Style) and proceed to Step 3
   - **Expected Result**: In Step 3, scenes based on the story are created
   - **Expected Result**: Scene titles and descriptions match the story

**✅ Success Criteria:**
- [ ] Story includes scene breakdown
- [ ] AI can refine scene structure when asked
- [ ] Scene descriptions are detailed
- [ ] Scenes are relevant to your event
- [ ] Can approve and continue to next step
- [ ] Scenes appear in Step 3

**❌ Common Issues to Report:**
- Story has no scene breakdown
- AI doesn't understand scene-related requests
- Scene descriptions are too vague
- Can't approve the direction
- Scenes don't appear in Step 3

---

## Prompt Enhancement Testing

### Test 5: Automatic Prompt Enhancement (During Image Generation)

**Objective**: Verify AI automatically enhances your image prompts when generating.

**Important Note**: There is NO separate "Enhance" button. Prompt enhancement happens **automatically** when you generate an image. The AI enhances your prompt behind the scenes before generating.

**Steps:**

1. **Navigate to Scene Frame Selection**
   - Go to Step 3 (Visual Design)
   - Click on a scene to expand it
   - Click on the Start Frame area (shows "Create Visual")
   - **Expected Result**: Modal opens with title "Select Start Frame"
   - **Expected Result**: Subtitle: "Choose from your assets, upload a new image, or generate one with AI"
   - **Expected Result**: Three tabs visible: "Project Assets", "Upload New", "AI Generator"

2. **Go to AI Generator Tab**
   - Click on the **"AI Generator"** tab
   - **Expected Result**: See form with:
     - Title: "AI Image Generator"
     - Subtitle: "Create completely new images from your imagination"
     - "Describe the image you want to create *" text area
     - Image count selector (1-4 images) with +/- buttons
     - "5 credits per image" text
     - Total credits badge (e.g., "20 credits" for 4 images)
     - "Your balance:" showing current credits
     - "Generate X AI Images" button (purple)

3. **Enter a Simple Prompt**
   - In the prompt field, type something simple: "sunset beach wedding"
   - **Expected Result**: Text appears in the field

4. **Generate Images**
   - Click "Generate X AI Images" button
   - **Expected Result**: Button changes to "Creating X Options..." state
   - **Expected Result**: Loading overlay may appear with "Generating images... This may take a few minutes"
   - Wait for generation (10-60 seconds)
   - **Expected Result**: Generated images appear in a selection grid

5. **Verify Enhancement Happened**
   - Look at the generated images
   - **Expected Result**: Images should be high quality with:
     - Proper composition and lighting
     - Cinematic or artistic style
     - Details matching your prompt
   - (The AI enhanced your "sunset beach wedding" prompt to include camera angles, lighting, style, etc. behind the scenes)

**✅ Success Criteria:**
- [ ] Can find AI Generator tab
- [ ] Can enter image prompt
- [ ] Generate button works
- [ ] Loading indicator shows during generation
- [ ] Generated images appear (within 60 seconds)
- [ ] Images are high quality (enhancement worked behind the scenes)
- [ ] Images match the prompt description

**❌ Common Issues to Report:**
- Can't find AI Generator tab
- Generate button doesn't work
- No loading indicator
- Generation never completes (> 2 minutes)
- Generated images are poor quality
- Images don't match prompt at all
- Error messages appear

---

## AI Image Generation Testing

### Test 6: Generate Images from Text

**Objective**: Verify AI can create multiple images from your descriptions.

**Steps:**

1. **Navigate to AI Generator** (continue from Test 5)
   - Open the AssetSelector → AI Generator tab
   - **Expected Result**: Form is ready for input

2. **Set Image Count**
   - Use the number selector to choose how many images to generate (1-4)
   - **Expected Result**: Credit cost updates (e.g., "5 credits per image" shown, total badge shows "20 credits" for 4 images)

3. **Enter Your Prompt**
   - Type: "A beautiful sunset on a tropical beach with palm trees, golden hour lighting"
   - **Expected Result**: Text appears in the prompt field

4. **Start Image Generation**
   - Click "Generate X AI Images" button
   - **Expected Result**: Button shows loading state ("Generating images...")
   - **Expected Result**: Loading overlay appears

5. **Wait for Generation**
   - Wait patiently (AI image generation takes 10-60 seconds)
   - **Expected Result**: Progress indicator visible

6. **Check Generated Images**
   - After waiting, multiple images should appear in a grid
   - **Expected Result**: Images match your prompt description
   - **Expected Result**: Image quality is good (not blurry)
   - **Expected Result**: Images are appropriate (no weird artifacts)
   - **Expected Result**: Each image is slightly different (AI variation)

7. **Select an Image**
   - Click "Select This Image" button on your preferred image
   - **Expected Result**: Modal closes
   - **Expected Result**: Selected image appears as the frame for your scene

**✅ Success Criteria:**
- [ ] Can select number of images (1-4)
- [ ] Credit cost displays correctly
- [ ] Generate button works
- [ ] Loading indicators appear
- [ ] Multiple images appear after generation
- [ ] Images match prompt description
- [ ] Image quality is acceptable
- [ ] Can select and use an image with "Select This Image"

**❌ Common Issues to Report:**
- Generate button doesn't work
- No loading indicator
- Generation takes > 2 minutes
- Generation fails with error
- Images don't match prompt at all
- Image quality is very poor
- Images have weird artifacts or glitches
- Can't select/use the generated image

---

### Test 7: Generate Images for Multiple Scenes

**Objective**: Verify you can generate images for different scenes.

**Steps:**

1. **Generate Images for Scene 1**
   - Expand Scene 1 in Step 3
   - Click "Select start frame"
   - Go to AI Generator tab
   - Enter prompt: "sunrise on a peaceful beach"
   - Generate images and select one
   - Repeat for end frame
   - **Expected Result**: Scene 1 has both frames set

2. **Generate Images for Scene 2**
   - Expand Scene 2
   - Click "Select start frame"
   - Enter a different prompt: "elegant wedding ceremony outdoors"
   - Generate and select an image
   - **Expected Result**: Image is different from Scene 1 images

3. **Generate Images for Scene 3**
   - Repeat process for Scene 3 with prompt: "joyful reception party"
   - **Expected Result**: Can generate for third scene
   - **Expected Result**: Previous scenes' images still saved

4. **Verify All Images Persist**
   - Collapse and expand each scene
   - **Expected Result**: All selected images are still there
   - Refresh the page
   - **Expected Result**: All images persist after refresh

**✅ Success Criteria:**
- [ ] Can generate images for multiple scenes
- [ ] Each scene can have unique images
- [ ] Images are all different per scene
- [ ] All images are saved
- [ ] Images persist after page refresh

**❌ Common Issues to Report:**
- Can only generate for one scene
- Second scene generation fails
- Images look identical despite different prompts
- Previous scenes' images disappear
- Images lost after refresh

---

### Test 8: Image Generation Error Handling

**Objective**: Verify errors are handled gracefully.

**Steps:**

1. **Test with Empty Prompt**
   - In AI Generator tab, leave prompt field empty
   - Try to click "Generate X AI Images" button
   - **Expected Result**: Button is disabled when prompt is empty
   - **Expected Result**: Cannot start generation

2. **Test with Insufficient Credits**
   - If your credit balance is low (< required credits)
   - Try to generate images
   - **Expected Result**: "Insufficient Credits" modal appears
   - **Expected Result**: Shows required vs available credits
   - **Expected Result**: Clear call-to-action to get more credits

3. **Test with Very Long Prompt**
   - Enter a very long prompt (500+ characters)
   - Try to generate image
   - **Expected Result**: Either works OR clear error about prompt length
   - **Expected Result**: No app crash

4. **Test Generation Failure Recovery**
   - If generation fails (network error, API timeout)
   - **Expected Result**: Error message appears
   - **Expected Result**: Credits are refunded
   - **Expected Result**: Can retry generation

**✅ Success Criteria:**
- [ ] Empty prompt prevents generation (button disabled)
- [ ] Insufficient credits shows modal with clear message
- [ ] Very long prompts handled (work or clear error)
- [ ] Failed generations show error message
- [ ] Credits refunded on failure
- [ ] App doesn't crash on edge cases

**❌ Common Issues to Report:**
- Empty prompt allows generation to start
- Insufficient credits not handled properly
- Long prompts crash the app
- No error messages for failed generation
- Credits not refunded on failure
- App crashes on error cases

---

## Video Refinement Chat Testing

### Test 9: Chat to Refine Video Scene

**Objective**: Verify you can chat with AI to refine and regenerate video scenes.

**Prerequisites**: 
- You must have a scene with a **generated video** (completed, not just frames)
- The video must have regenerations remaining

**Steps:**

1. **Generate a Video First**
   - In Step 3, ensure a scene has both start and end frames selected
   - Click "Generate Scene Video" button
   - Wait for video generation to complete (may take 1-2 minutes)
   - **Expected Result**: Video preview appears with playback controls

2. **Open Video Refinement Chat**
   - Look for the "Refine with AI (X left)" button below the video
   - Click it
   - **Expected Result**: Dialog/modal opens with title "Refine Scene Video with AI"
   - **Expected Result**: Shows "Regenerations remaining: X of Y"

3. **Read Initial Message**
   - **Expected Result**: AI greeting appears immediately (no need to send a message first):
     - "I'll help you refine this scene. What would you like to change about the current video?"
     - Shows "**Current Scene:** {Scene Title}" with description below
     - Ends with "Please describe what you'd like to improve or change in the video generation."
   - **Expected Result**: Text input with placeholder "Describe what you'd like to change..."

4. **Request a Change**
   - Type: "Make it more dramatic with faster camera movement"
   - Click submit button
   - **Expected Result**: Your message appears in chat
   - **Expected Result**: Loading indicator shows
   - **Expected Result**: AI responds with suggestions

5. **Approve and Regenerate**
   - After AI responds, approval buttons appear at the bottom
   - Click "✓ Approve this Direction" button
   - **Expected Result**: Button turns green and shows "✓ Approved"
   - **Expected Result**: New button appears: "Regenerate Scene Video ✨"
   - Click "Regenerate Scene Video ✨" button
   - **Expected Result**: Dialog closes
   - **Expected Result**: Video regeneration starts (20 credits deducted)

**✅ Success Criteria:**
- [ ] "Refine with AI" button appears after video is generated
- [ ] Chat dialog opens correctly
- [ ] Shows regeneration count remaining
- [ ] AI sends contextual initial message
- [ ] Can send refinement requests
- [ ] AI responds with relevant suggestions
- [ ] Can approve and trigger regeneration

**❌ Common Issues to Report:**
- Can't find "Refine with AI" button
- Chat dialog doesn't open
- AI doesn't respond
- AI responses are generic (not about the scene)
- Approve button doesn't work
- Regeneration doesn't start after approval

---

## Mobile Testing

### Test 10: AI Chat on Mobile

**Objective**: Verify AI chat works smoothly on mobile devices.

**Prerequisites**: You need a smartphone (iPhone or Android).

**Steps:**

1. **Open App on Mobile**
   - Open mobile browser (Safari on iPhone, Chrome on Android)
   - Sign in
   - Navigate to Step 2 (AI Director)

2. **Test Chat Interface**
   - **Expected Result**: Chat interface fits mobile screen
   - **Expected Result**: No horizontal scrolling needed
   - **Expected Result**: Input box visible without scrolling

3. **Type on Mobile**
   - Tap in the chat input
   - **Expected Result**: Mobile keyboard appears
   - Type a message
   - **Expected Result**: Typing is smooth, no lag

4. **Send Message on Mobile**
   - Send your message
   - **Expected Result**: Message sends correctly
   - **Expected Result**: AI responds normally
   - **Expected Result**: Response is readable on mobile

5. **Scroll Chat on Mobile**
   - Scroll through chat history
   - **Expected Result**: Scrolling is smooth
   - **Expected Result**: Touch scrolling works naturally

6. **Test Mobile Keyboard Behavior**
   - Type in input, then tap outside
   - **Expected Result**: Keyboard dismisses
   - **Expected Result**: Chat remains accessible

**✅ Success Criteria:**
- [ ] Chat interface fits mobile screen
- [ ] Can type messages on mobile
- [ ] Mobile keyboard works properly
- [ ] Send button is easy to tap
- [ ] AI responses appear on mobile
- [ ] Scrolling works smoothly
- [ ] Tested on iOS Safari
- [ ] Tested on Android Chrome

**❌ Common Issues to Report:**
- Chat interface is cut off on mobile
- Horizontal scrolling required
- Can't tap in input field
- Mobile keyboard doesn't appear
- Keyboard covers important content
- Send button too small to tap
- Scrolling is janky or broken
- AI responses don't appear on mobile

---

### Test 11: Image Generation on Mobile

**Objective**: Verify image generation works on mobile.

**Steps:**

1. **Navigate on Mobile**
   - On mobile device, go to Step 3
   - Tap on a scene to expand it
   - Tap "Select start frame" button
   - **Expected Result**: AssetSelector modal opens

2. **Access AI Generator Tab**
   - Tap on "AI Generator" tab
   - **Expected Result**: AI Generator form appears
   - **Expected Result**: All elements fit on mobile screen

3. **Enter Prompt on Mobile**
   - Tap in the prompt field
   - **Expected Result**: Mobile keyboard appears
   - Type a prompt (e.g., "sunset beach wedding")
   - **Expected Result**: Typing works smoothly

4. **Select Image Count**
   - Tap to change image count (1-4)
   - **Expected Result**: Buttons are easy to tap (≥ 44px)
   - **Expected Result**: Credit cost updates correctly

5. **Generate Images on Mobile**
   - Tap "Generate X AI Images" button
   - **Expected Result**: Generation starts
   - **Expected Result**: Loading indicator visible on mobile
   - **Expected Result**: Button text shows progress

6. **View Generated Images on Mobile**
   - After generation completes
   - **Expected Result**: Image grid appears on mobile
   - **Expected Result**: Images are sized correctly for mobile
   - **Expected Result**: "Select This Image" buttons are easy to tap

7. **Select an Image**
   - Tap "Select This Image" on preferred option
   - **Expected Result**: Modal closes
   - **Expected Result**: Selected image appears in scene

**✅ Success Criteria:**
- [ ] Can access AI Generator tab on mobile
- [ ] Prompt input works on mobile
- [ ] Image count selector works
- [ ] Buttons are easy to tap (≥ 44px)
- [ ] Generation works on mobile
- [ ] Loading indicators visible
- [ ] Generated images display in grid
- [ ] Can select and use an image
- [ ] Image quality good on mobile screen

**❌ Common Issues to Report:**
- Can't find AI Generator tab on mobile
- Buttons too small to tap
- Mobile keyboard issues
- Generation fails on mobile only
- Images don't appear on mobile
- Image grid doesn't fit screen
- Can't select images on mobile
- Image quality poor on mobile

---

## Error Handling Testing

### Test 12: AI Service Errors

**Objective**: Verify errors are handled gracefully when AI services fail.

**Steps:**

1. **Test Network Interruption**
   - Start chatting with AI
   - Turn off WiFi during AI response
   - **Expected Result**: Error message appears
   - **Expected Result**: Message like: "Connection lost. Please try again."
   - Turn WiFi back on
   - Try sending message again
   - **Expected Result**: Works after reconnection

2. **Test Slow Response**
   - Send a message to AI
   - If response takes > 10 seconds
   - **Expected Result**: Some indicator that request is still processing
   - **Expected Result**: Doesn't fail silently

3. **Check Error Messages**
   - When errors occur
   - **Expected Result**: Error messages are clear
   - **Expected Result**: No technical jargon (no "API error 500")
   - **Expected Result**: Tells you what to do (e.g., "Try again" button)

**✅ Success Criteria:**
- [ ] Network errors handled gracefully
- [ ] Error messages appear
- [ ] Error messages are clear and non-technical
- [ ] Can recover from errors (retry works)
- [ ] App doesn't crash on AI errors

**❌ Common Issues to Report:**
- No error message when AI fails
- App crashes on error
- Error messages are technical/confusing
- Can't retry after error
- Errors don't recover after fixing connection

---

### Test 13: API Limits and Rate Limits

**Objective**: Verify app handles API limits properly.

**Steps:**

1. **Test Rapid Requests** (Optional - only if instructed)
   - Send many messages very quickly (5-10 in a row)
   - **Expected Result**: Either all process OR clear message about rate limits

2. **Check Limit Messages**
   - If rate limit is hit
   - **Expected Result**: Clear message: "Too many requests. Please wait a moment."
   - **Expected Result**: Some indication of when you can try again

**✅ Success Criteria:**
- [ ] Rate limits handled gracefully
- [ ] Clear message if limit hit
- [ ] Can resume after waiting
- [ ] No crashes due to rate limits

**❌ Common Issues to Report:**
- App crashes when sending many requests
- No message about rate limits
- Can't resume after rate limit
- Rate limit message is confusing

---

## Reporting Issues

### How to Report a Bug

When you find a problem, please include:

1. **Bug Title**: Short description (e.g., "AI doesn't respond on mobile")

2. **Steps to Reproduce**:
   ```
   1. Open app on iPhone 14, iOS 17, Safari
   2. Navigate to Step 2 (AI Director)
   3. Type message: "Help me with my wedding"
   4. Tap Send
   5. AI doesn't respond (loading forever)
   ```

3. **Expected Behavior**: What should happen (e.g., "AI should respond within 5 seconds")

4. **Actual Behavior**: What actually happened (e.g., "Loading indicator shows forever, no AI response")

5. **Environment**:
   - Device: (e.g., iPhone 14 Pro, Windows PC, Samsung S21)
   - Browser: (e.g., Safari 17, Chrome 120)
   - Connection: (e.g., WiFi, 4G, 3G)
   - Feature: (e.g., AI Chat, Image Generation)

6. **AI-Specific Info**:
   - What was your prompt/message?
   - How long did you wait?
   - Did you get any error message?

7. **Screenshots** (if possible):
   - Screenshot of error
   - Screenshot of AI response (if weird)
   - Screenshot of chat interface

### Bug Priority Guide

**🔴 Critical (Report Immediately)**:
- AI chat completely broken (no responses)
- App crashes when using AI features
- Image generation always fails
- Can't use AI features at all

**🟡 High (Report Soon)**:
- AI responses take > 30 seconds
- AI responses are irrelevant/nonsense
- Image generation fails most of the time
- AI doesn't work on mobile
- Chat history is lost

**🟢 Medium (Report When Convenient)**:
- AI responses are slow but work
- Some AI responses are poor quality
- Image generation is slow
- Minor UI issues in chat

**🔵 Low (Nice to Fix)**:
- AI could be smarter
- Image quality could be better
- Minor visual glitches
- Small text issues

---

## Testing Checklist Summary

**Sprint 5: AI Integration** (13 tests)

### AI Chat - Step 2 (4 tests)
- [ ] Test 1: Start AI Conversation (Story Display)
- [ ] Test 2: Send Message to AI (Story Refinement)
- [ ] Test 3: Multi-Turn Conversation (with "Start Over")
- [ ] Test 4: AI Story with Scene Breakdown (Approve & Continue)

### AI Image Generation (4 tests)
- [ ] Test 5: Automatic Prompt Enhancement (During Generation)
- [ ] Test 6: Generate Images from Text (AI Generator Tab)
- [ ] Test 7: Generate Images for Multiple Scenes
- [ ] Test 8: Image Generation Error Handling

### Video Refinement (1 test)
- [ ] Test 9: Chat to Refine Video Scene (Regeneration)

### Mobile (2 tests)
- [ ] Test 10: AI Chat on Mobile
- [ ] Test 11: Image Generation on Mobile

### Error Handling (2 tests)
- [ ] Test 12: AI Service Errors
- [ ] Test 13: API Limits and Rate Limits

**Total**: 13 comprehensive tests covering all Sprint 5 AI features

---

## Important Notes

### What's Tested in Sprint 5
- ✅ AI Director chat (Step 2) - Story refinement with streaming responses
- ✅ "Start Over with a New Idea" feature (1 credit per use)
- ✅ Story includes scene breakdown from AI
- ✅ Approval flow ("✓ Approve this Direction" → "Continue to Visual Style ✨")
- ✅ Automatic prompt enhancement (integrated into image generation)
- ✅ AI image generation (1-4 images, 5 credits per image)
- ✅ Video refinement chat (after video is generated in Step 3)
- ✅ Mobile AI experience (chat + image generation)
- ✅ Error handling and insufficient credits flow

### What's NOT Tested in Sprint 5
- ❌ AI video generation (tested in Sprint 4)
- ❌ AI video regeneration (tested in Sprint 4)
- ❌ AI image transform (tested in Sprint 4)
- ❌ Step 3b Narration (tested separately)
- ❌ Step 4 Sound Design (tested separately)

### AI Behavior Notes
- **AI responses vary**: The AI won't give the same answer twice
- **Streaming responses**: In Step 2, you'll see text appear progressively (not all at once)
- **AI has limits**: Too many requests may be rate-limited
- **Credits are required**: Each AI operation costs credits:
  - Chat message (Step 2): 1 credit
  - Image generation: 5 credits per image
  - Video generation: 20 credits (tested in Sprint 6)
- **AI can make mistakes**: Sometimes responses might not be perfect
- **Prompt enhancement is automatic**: No separate button - happens during generation

### Performance Expectations
- **Chat response (Step 2)**: Streaming starts < 3 seconds, completes within 10 seconds
- **Image generation**: 10-60 seconds (normal for AI image generation)
- **Multiple images**: May take longer when generating 4 images
- **Video regeneration**: 1-2 minutes (involves AI processing)
- **Loading indicators**: Should always be visible during any AI operation

---

## Questions or Help Needed?

If you have questions or need clarification:
1. Contact the development team
2. Refer to this guide
3. Ask for a demo walkthrough of AI features

**Thank you for testing Sprint 5!** Your feedback ensures our AI features work intelligently and reliably. 🤖✨

---

**Last Updated**: December 23, 2025  
**Version**: 1.2  
**Status**: Ready for QA Team  
**Sprint**: Sprint 5 - AI Integration (Step 2 Chat + Image Generation)

