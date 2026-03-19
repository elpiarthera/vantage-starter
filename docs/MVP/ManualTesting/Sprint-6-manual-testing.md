# 🧪 MyShortReel - Sprint 6: Manual Testing Guide

**Sprint**: Sprint 6 - AI Video Generation (Deep Dive)  
**Date Created**: November 20, 2025  
**Last Updated**: December 23, 2025  
**Audience**: Non-technical QA testers  
**Status**: Ready for Testing  
**Estimated Time**: 2-3 hours  
**Prerequisites**: Sprint 4 complete (video generation basics covered there)

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Test Setup](#test-setup)
3. [Video Generation Testing](#video-generation-testing)
4. [Real-time Progress Testing](#real-time-progress-testing)
5. [Video Regeneration Testing](#video-regeneration-testing)
6. [Cost Tracking Verification](#cost-tracking-verification)
7. [Mobile Testing](#mobile-testing)
8. [Error Handling Testing](#error-handling-testing)
9. [Performance Testing](#performance-testing)
10. [Reporting Issues](#reporting-issues)

---

## Introduction

### What You're Testing

Sprint 6 adds **AI-powered video generation** to MyShortReel. You will verify:

- **Video Generation**: Generate 5-10 second videos from your scene images
- **Real-time Progress**: Watch video generation progress in real-time
- **Video Regeneration**: Refine and improve videos with AI feedback
- **Cost Tracking**: Verify all video generation costs are tracked
- **Error Handling**: Ensure errors are handled gracefully
- **Mobile Experience**: All video features work smoothly on phones

### Why This Matters

Sprint 5 generated **images** for your scenes. Sprint 6 brings those images **to life as videos**!

**Before Sprint 6**: Static start and end frame images  
**After Sprint 6**: Smooth 5-10 second cinematic videos with motion

### What's New

**New Video Features**:
- ✅ Generate videos from start + end frame images
- ✅ Real-time progress updates (watch generation happen)
- ✅ Video player to preview generated videos
- ✅ AI-powered video regeneration (refine with AI feedback chat)
- ✅ Up to 6 total video generations per scene (1 initial + 5 regenerations)
- ✅ Credit-based cost system (20 credits per video)
- ✅ Automatic credit refund on generation failure

**AI Model Used**:
- **Kling Video v2.1 Pro** (via fal.ai): State-of-the-art image-to-video AI
- **Generation Time**: 30-120 seconds per video (be patient!)
- **Cost**: 20 credits per video generation (both 5s and 10s)
- **Regeneration Cost**: 20 credits per regeneration attempt

---

## Test Setup

### Before You Start

**You'll Need:**
1. A computer with modern web browser
2. A smartphone (iPhone or Android) for mobile testing
3. A valid user account (signed in)
4. An existing project with completed scenes from Sprint 5
5. Scenes with **both start AND end frame images** generated
6. **Patience**: Video generation takes 30-120 seconds!
7. **Good internet connection**: Videos are large files

**What to Prepare:**
- Ensure you have at least 2-3 scenes with images
- Each scene should have both start and end frames
- Make sure scenes are in Step 3 (Visual Design)
- Have at least 100+ credits available in your account

**Application URL:**
- **Production**: (URL provided by development team)
- **Staging**: (URL provided by development team)

**⚠️ CRITICAL Notes:**
- **Video generation is SLOW** (30-120 seconds is normal!)
- **Don't close the window** during generation
- **Videos cost credits** (20 credits each - test wisely)
- **Regeneration costs credits too** (20 credits per attempt)
- **Generation can fail** (timeouts, API issues are common - credits refunded on failure)
- If you see "FAL_KEY not configured", contact dev team

---

## Video Generation Testing

### Test 1: Start Video Generation

**Objective**: Verify you can start generating a video from scene images.

**Prerequisites**: 
- Have a scene with start frame AND end frame images
- Scene is in Step 3 (Scene Management)

**Steps:**

1. **Navigate to Scene**
   - Go to `/guided/step-3` (Scene Management)
   - Select a scene that has both start and end frame images
   - **Expected Result**: Scene details open

2. **Find Video Generation Section**
   - Scroll down past the "Set Your Frames" section
   - **Expected Result**: See "Video Generation" card with play icon
   - **Expected Result**: Shows "Ready to Generate Scene Video" heading
   - **Expected Result**: Shows "Create a Xs video transitioning from start to end frame" (where X is duration)
   - **Expected Result**: "Generate Scene Video" button with "20 credits" badge

3. **Check Video Settings**
   - Duration is set in the Scene Details section above (5s or 10s dropdown)
   - **Expected Result**: Duration selector shows "5 seconds" or "10 seconds"
   - **Note**: Duration must be set BEFORE generating video

4. **Start Generation**
   - Click "Generate Scene Video" button
   - **Expected Result**: Button disappears, replaced by loading spinner
   - **Expected Result**: Status shows "Generating Scene Video..."
   - **Expected Result**: Below shows "Queued for processing" or "Creating your video"
   - **Expected Result**: Progress bar appears with percentage

**✅ Success Criteria:**
- [ ] Can find video generation section
- [ ] "Generate Scene Video" button is visible
- [ ] Button is enabled (not disabled)
- [ ] Can click button to start generation
- [ ] Button state changes after click
- [ ] No immediate errors

**❌ Common Issues to Report:**
- Can't find video generation section
- Button is disabled/grayed out
- Button doesn't respond to clicks
- Error message appears immediately
- Can click button multiple times (should be prevented)
- Page crashes when clicking generate

---

### Test 2: Monitor Real-time Progress

**Objective**: Verify you can see video generation progress in real-time.

**Prerequisites**: 
- Video generation started (Test 1 completed)

**Steps:**

1. **Check Initial Progress Indicator**
   - Immediately after clicking "Generate Scene Video"
   - **Expected Result**: Progress indicator appears (e.g., progress bar, spinner, percentage)
   - **Expected Result**: Status message like "Submitting to AI model..." or "Queued for processing"

2. **Watch Progress Updates**
   - Wait and watch the progress indicator
   - **Expected Result**: Progress bar fills up with percentage displayed (e.g., "45%")
   - **Expected Result**: Status messages change:
     - "Queued for processing" (initial state)
     - "Creating your video" (during generation)
   - **Expected Result**: Pulsing animation on spinner indicates active processing

3. **Check Progress Bar**
   - **Expected Result**: Progress bar shows percentage (0% to 100%)
   - **Expected Result**: Progress increases as generation continues
   - **Note**: Progress may not be linear - AI processing has varying stages

5. **Verify Page Stays Responsive**
   - Try scrolling the page during generation
   - Try clicking other UI elements (not buttons that would interrupt)
   - **Expected Result**: Page remains responsive
   - **Expected Result**: Can interact with other parts of the page
   - **Expected Result**: Progress updates don't freeze the page

**✅ Success Criteria:**
- [ ] Loading spinner appears immediately
- [ ] Status message changes ("Queued" → "Creating")
- [ ] Progress bar appears with percentage
- [ ] Progress updates over time
- [ ] Page stays responsive during generation
- [ ] Progress reaches 100% when complete

**❌ Common Issues to Report:**
- No loading spinner appears
- Progress bar never updates (stuck at 0%)
- Status messages don't change
- Page freezes during generation
- Progress updates are very laggy (> 30s delays)
- Progress bar jumps backwards
- No visual feedback during generation

---

### Test 3: Video Generation Completion

**Objective**: Verify video generation completes successfully and video is playable.

**Prerequisites**: 
- Video generation in progress (Test 2 completed)
- Wait patiently (30-120 seconds)

**Steps:**

1. **Wait for Completion**
   - **IMPORTANT**: Be patient! Generation takes 30-120 seconds
   - **Expected Result**: Progress reaches 100%
   - **Expected Result**: Green checkmark icon appears with text "Scene Video Generated Successfully!"

2. **Check Video Player Appears**
   - After completion
   - **Expected Result**: Video player appears with controls
   - **Expected Result**: Video uses start frame as poster/thumbnail image
   - **Expected Result**: Three buttons appear below video:
     - "Refine with AI (5 left)" - outline button with "20 credits" badge
     - "Download Video" - outline button
     - "Approve Video" - blue button (enabled)

3. **Play the Generated Video**
   - Click play button on video player
   - **Expected Result**: Video starts playing
   - **Expected Result**: Video is smooth (not choppy)
   - **Expected Result**: Video transitions from start frame to end frame
   - **Expected Result**: Video matches the scene duration (5s or 10s)

4. **Check Video Quality**
   - Watch the entire video
   - **Expected Result**: Video quality is good (not pixelated)
   - **Expected Result**: Motion is smooth (not jerky)
   - **Expected Result**: Transition from start to end frame is natural
   - **Expected Result**: Video matches your scene description

5. **Test Video Controls**
   - Try pausing video
   - Try seeking (dragging the progress bar)
   - Try fullscreen mode (if available)
   - Try volume controls
   - **Expected Result**: All controls work
   - **Expected Result**: Can pause/play/seek smoothly

6. **Test Approve Video Button**
   - Click the "Approve Video" button
   - **Expected Result**: Button changes to "✓ Video Validated" (green, disabled)
   - **Expected Result**: Button cannot be clicked again

7. **Verify Video is Saved**
   - Refresh the page
   - Navigate back to this scene
   - **Expected Result**: Video is still there
   - **Expected Result**: Don't need to regenerate
   - **Expected Result**: "✓ Video Validated" button is still green and disabled

**✅ Success Criteria:**
- [ ] Generation completes within 120 seconds
- [ ] Success message appears
- [ ] Video player appears
- [ ] Can play video
- [ ] Video plays smoothly
- [ ] Video is correct duration (5s or 10s)
- [ ] Video quality is acceptable
- [ ] Transition from start to end is smooth
- [ ] All video controls work
- [ ] Approve button state changes correctly
- [ ] Video persists after page refresh

**❌ Common Issues to Report:**
- Generation never completes (stuck at 95-99%)
- Takes longer than 120 seconds
- No success message
- Video player doesn't appear
- Can't play video
- Video is choppy or laggy
- Video quality is very poor
- Transition is jarring or unnatural
- Video controls don't work
- Video disappears after refresh
- Generation times out with error

---

### Test 4: Generate Multiple Videos

**Objective**: Verify you can generate videos for multiple scenes.

**Steps:**

1. **Generate First Video**
   - Complete Test 1-3 for Scene 1
   - **Expected Result**: Scene 1 has a generated video

2. **Navigate to Second Scene**
   - Go to Scene 2 (must have start + end frames)
   - **Expected Result**: Scene 2 loads correctly

3. **Generate Second Video**
   - Click "Generate Scene Video" for Scene 2
   - Wait for completion
   - **Expected Result**: Scene 2 video generates successfully
   - **Expected Result**: Scene 2 video is DIFFERENT from Scene 1 video

4. **Verify Both Videos Exist**
   - Go back to Scene 1
   - **Expected Result**: Scene 1 video still exists
   - Go to Scene 2
   - **Expected Result**: Scene 2 video still exists

5. **Generate Third Video** (if time permits)
   - Repeat for Scene 3
   - **Expected Result**: Can generate third video
   - **Expected Result**: All three videos are unique

**✅ Success Criteria:**
- [ ] Can generate videos for multiple scenes
- [ ] Each generation works independently
- [ ] Each video is unique (reflects its scene)
- [ ] Previous videos don't disappear
- [ ] Can switch between scenes and see their videos

**❌ Common Issues to Report:**
- Can only generate one video
- Second generation fails
- Previous video disappears when generating new one
- Videos look identical despite different scenes
- Can't switch between scenes
- App becomes slow after multiple generations

---

## Video Regeneration Testing

### Test 5: Refine Video with AI Feedback

**Objective**: Verify you can regenerate videos with feedback to improve them.

**Prerequisites**: 
- Have a scene with a generated video (Test 3 completed)

**Steps:**

1. **Find Regeneration Feature**
   - On a scene with a generated video
   - Look for "Refine with AI (X left)" button below the video
   - **Expected Result**: Button is visible with "20 credits" badge
   - **Expected Result**: Initially shows "(5 left)" after first video generation

2. **Open Regeneration Chat**
   - Click "Refine with AI" button
   - **Expected Result**: Dialog opens with title "Refine Scene Video with AI"
   - **Expected Result**: Shows "Regenerations remaining: X of 4" (X decreases with each regeneration)
   - **Expected Result**: AI message appears immediately:
     - "I'll help you refine this scene. What would you like to change about the current video?"
     - "**Current Scene:** {Scene Title}"
     - Scene description shown below
     - "Please describe what you'd like to improve or change in the video generation."

3. **Provide Feedback**
   - Type feedback like: "Make it more dramatic"
   - Click submit button
   - **Expected Result**: Your message appears in chat
   - **Expected Result**: AI responds with suggestions

4. **Approve and Regenerate**
   - After AI responds, "✓ Approve this Direction" button appears
   - Click it
   - **Expected Result**: Button turns green "✓ Approved"
   - **Expected Result**: "Regenerate Scene Video ✨" button appears
   - Click "Regenerate Scene Video ✨"
   - **Expected Result**: Dialog closes
   - **Expected Result**: New video generation starts (20 credits deducted)
   - **Expected Result**: Previous video is replaced

5. **Wait for Regenerated Video**
   - Watch progress (same as Test 2)
   - **Expected Result**: Regeneration completes
   - **Expected Result**: New video appears
   - **Expected Result**: New video reflects your feedback (more dramatic, in this example)

6. **Compare with Original**
   - If you remember the original video
   - **Expected Result**: New video is noticeably different
   - **Expected Result**: Feedback was applied (e.g., more dramatic camera movement)

7. **Check Regeneration Count**
   - Look at "Refine with AI" button again
   - **Expected Result**: Count decreased by 1 (e.g., if it was "(5 left)", now shows "(4 left)")

**✅ Success Criteria:**
- [ ] Can find regeneration button
- [ ] Regeneration chat opens
- [ ] Can provide feedback
- [ ] AI acknowledges feedback
- [ ] Regeneration starts
- [ ] Regeneration completes successfully
- [ ] New video reflects feedback
- [ ] Regeneration count decreases
- [ ] Previous video is replaced (not duplicated)

**❌ Common Issues to Report:**
- Can't find regeneration button
- Button is disabled despite having attempts left
- Chat doesn't open
- AI doesn't respond to feedback
- Regeneration doesn't start
- Regeneration fails
- New video is identical to old video
- Feedback was ignored
- Regeneration count doesn't decrease
- Both old and new videos exist (should be one)

---

### Test 6: Regeneration Limits

**Objective**: Verify regeneration limits are enforced.

**Steps:**

1. **Check Initial Regeneration Count**
   - On a scene with a freshly generated video (first generation)
   - Look at "Refine with AI (X left)" button
   - **Expected Result**: Button shows "(5 left)" after initial video generation
   - **Note**: You can regenerate up to 5 times (total of 6 videos including the initial)

2. **Regenerate Multiple Times** (requires many credits - optional)
   - Regenerate with feedback: "Make it brighter"
   - Wait for completion
   - Check count: button should show "4 left"
   - Regenerate again: "Faster paced"
   - Wait for completion
   - Check count: button should show "3 left"
   - Continue until count reaches 0
   - **Expected Result**: Button count decreases each time (5 → 4 → 3 → 2 → 1 → 0)

3. **Attempt Beyond Limit**
   - After using all regenerations
   - **Expected Result**: "Refine with AI" button is disabled OR shows "(0 left)"
   - **Expected Result**: Button cannot be clicked or shows error message

4. **Verify Limit Persists**
   - Refresh page
   - Return to the scene
   - **Expected Result**: Regeneration count is still at 0
   - **Expected Result**: Cannot regenerate anymore

**✅ Success Criteria:**
- [ ] Initial count shows correctly
- [ ] Count decreases with each regeneration
- [ ] Button disabled when count reaches 0
- [ ] Limit persists after page refresh
- [ ] Cannot bypass limit

**❌ Common Issues to Report:**
- Can regenerate more than 5 times
- Count doesn't decrease
- No limit enforcement
- Count resets after page refresh
- Can bypass limit by refreshing
- No error message when limit reached
- Button still enabled after all 5 regenerations are used (should show "(0 left)" and be disabled)

---

## Cost Tracking Verification

### Test 7: Verify Credit Deduction

**Objective**: Verify credits are deducted correctly for video generation.

**Steps:**

1. **Check Credit Balance Before**
   - Note your current credit balance (visible in header or credit purchase page)
   - **Expected Result**: Credit balance is visible

2. **Generate a Video**
   - Generate a scene video
   - Wait for completion

3. **Check Credit Balance After**
   - Check credit balance after video generation completes
   - **Expected Result**: 20 credits were deducted
   - **Expected Result**: New balance = Old balance - 20

4. **Regenerate Video and Check Credits**
   - Use "Refine with AI" to regenerate
   - After regeneration completes
   - **Expected Result**: Another 20 credits were deducted
   - **Expected Result**: Balance reduced by 20 more credits

5. **Test Insufficient Credits**
   - If balance < 20 credits, try to generate a video
   - **Expected Result**: "Insufficient Credits" modal appears
   - **Expected Result**: Shows required (20) vs available credits
   - **Expected Result**: Has "Purchase Credits" button or option to close

**✅ Success Criteria:**
- [ ] Credit balance visible before/after
- [ ] 20 credits deducted per video generation
- [ ] 20 credits deducted per regeneration
- [ ] Insufficient credits handled gracefully
- [ ] Modal shows required vs available credits

**❌ Common Issues to Report:**
- Credits not deducted after video generation
- Wrong amount of credits deducted (should be 20)
- Insufficient credits modal not appearing when balance is low
- Credits deducted but video generation failed (should be refunded)
- Credit balance not updating in real-time

---

## Mobile Testing

### Test 8: Video Generation on Mobile

**Objective**: Verify video generation works smoothly on mobile devices.

**Prerequisites**: 
- Smartphone (iPhone or Android)
- Mobile browser (Safari on iOS, Chrome on Android)

**Steps:**

1. **Open App on Mobile**
   - Open mobile browser
   - Sign in to MyShortReel
   - Navigate to Step 3 (Scene Management)
   - **Expected Result**: Page loads on mobile

2. **Find Video Generation on Mobile**
   - Select a scene with images
   - Scroll to video generation section
   - **Expected Result**: "Generate Scene Video" button is visible
   - **Expected Result**: Button is large enough to tap easily (≥ 44px)

3. **Start Generation on Mobile**
   - Tap "Generate Scene Video"
   - **Expected Result**: Button responds to tap
   - **Expected Result**: Generation starts
   - **Expected Result**: Progress indicator appears

4. **Watch Progress on Mobile**
   - **Expected Result**: Progress updates are visible on small screen
   - **Expected Result**: Status messages are readable (not cut off)
   - **Expected Result**: Elapsed time is visible

5. **Wait for Completion on Mobile**
   - Keep screen on (don't let phone sleep)
   - **Expected Result**: Generation completes even if phone screen dims
   - **Expected Result**: Video player appears on mobile

6. **Play Video on Mobile**
   - Tap play button
   - **Expected Result**: Video plays on mobile
   - **Expected Result**: Video fills screen appropriately
   - **Expected Result**: Touch controls work (tap to pause/play)

7. **Test Video Fullscreen on Mobile**
   - Tap fullscreen button (if available)
   - **Expected Result**: Video goes fullscreen
   - **Expected Result**: Can exit fullscreen

8. **Test Regeneration on Mobile**
   - Tap "Refine with AI"
   - **Expected Result**: Chat opens on mobile
   - **Expected Result**: Mobile keyboard appears for typing feedback
   - **Expected Result**: Can send feedback
   - **Expected Result**: Can start regeneration from mobile

**✅ Success Criteria:**
- [ ] Video generation section visible on mobile
- [ ] Buttons are easy to tap (≥ 44px touch targets)
- [ ] Can start generation on mobile
- [ ] Progress updates visible on mobile screen
- [ ] Generation completes on mobile
- [ ] Video plays on mobile
- [ ] Touch controls work
- [ ] Fullscreen mode works
- [ ] Regeneration chat works on mobile
- [ ] Tested on iOS Safari
- [ ] Tested on Android Chrome

**❌ Common Issues to Report:**
- Video section not visible on mobile
- Buttons too small to tap
- Can't start generation on mobile
- Progress is cut off on small screen
- Generation fails on mobile only
- Video doesn't appear on mobile
- Video doesn't play on mobile
- Touch controls don't work
- Fullscreen mode doesn't work
- Regeneration chat doesn't work on mobile
- Mobile keyboard issues

---

## Error Handling Testing

### Test 9: Handle Generation Failures

**Objective**: Verify errors are handled gracefully when video generation fails.

**Steps:**

1. **Test Without Images**
   - Try to access video generation for a scene WITHOUT start/end frames
   - **Expected Result**: Video Generation section is NOT visible (only appears when both frames are set)
   - **Note**: This is handled by UI - the section only renders when both frames exist

2. **Test Network Interruption**
   - Start video generation
   - Turn off WiFi/data during generation (after first 10 seconds)
   - **Expected Result**: Error message appears
   - **Expected Result**: Message like: "Connection lost. Please try again."
   - Turn WiFi back on
   - **Expected Result**: Can retry generation

3. **Test Generation Timeout**
   - If a generation takes > 5 minutes (rare)
   - **Expected Result**: Timeout error appears
   - **Expected Result**: Message like: "Video generation timed out. The AI model might be busy."
   - **Expected Result**: Can retry

4. **Check Error State UI**
   - If generation fails
   - **Expected Result**: Red icon appears with "Video Generation Failed" text
   - **Expected Result**: Error message displayed (from AI service)
   - **Expected Result**: "Try Again" button appears with "20 credits" badge
   - **Expected Result**: Credits should have been refunded (check balance)

5. **Test Retry After Error**
   - After getting an error
   - Click "Try Again" button
   - **Expected Result**: New generation starts
   - **Expected Result**: Credits deducted again (20 credits)
   - **Expected Result**: Progress indicator appears

**✅ Success Criteria:**
- [ ] Video generation section only visible when both frames set
- [ ] Network errors handled gracefully
- [ ] Error state shows "Video Generation Failed" with error message
- [ ] "Try Again" button appears after failure
- [ ] Credits refunded on failure
- [ ] Retry works after error
- [ ] App doesn't crash on errors

**❌ Common Issues to Report:**
- Video section visible when frames are missing (should be hidden)
- No error message when generation fails
- App crashes on error
- "Try Again" button missing after failure
- Credits not refunded on failure
- Can't retry after error
- Retry doesn't work
- Page freezes on error

---

### Test 10: API Rate Limits

**Objective**: Verify app handles API rate limits properly.

**Steps:**

1. **Test Rapid Generations** (Admin only - don't do this unless instructed!)
   - Try to start 5-10 video generations very quickly (one after another)
   - **Expected Result**: Either all queue OR clear message about rate limits

2. **Check Rate Limit Messages**
   - If rate limit is hit
   - **Expected Result**: Clear message: "Too many requests. Please wait a moment."
   - **Expected Result**: Some indication of when you can try again

3. **Wait and Retry**
   - Wait 1-2 minutes after rate limit
   - Try generating again
   - **Expected Result**: Can generate after waiting
   - **Expected Result**: Rate limit is cleared

**✅ Success Criteria:**
- [ ] Rate limits handled gracefully
- [ ] Clear message if limit hit
- [ ] Can resume after waiting
- [ ] No crashes due to rate limits

**❌ Common Issues to Report:**
- App crashes when rate limited
- No message about rate limits
- Can't resume after rate limit
- Rate limit never clears

---

## Performance Testing

### Test 11: Generation Time Performance

**Objective**: Verify video generation completes within acceptable time.

**Steps:**

1. **Test 5-Second Video Generation**
   - Generate a 5-second video
   - Start a stopwatch when you click "Generate"
   - Stop when video appears
   - **Expected Result**: Completes in 30-90 seconds

2. **Test 10-Second Video Generation**
   - Generate a 10-second video
   - Time it
   - **Expected Result**: Completes in 60-120 seconds

3. **Test Multiple Generations**
   - Generate 3 videos in a row (wait for each to complete)
   - **Expected Result**: Each takes similar time
   - **Expected Result**: App doesn't get slower with each generation

**✅ Success Criteria:**
- [ ] 5s videos complete in 30-90 seconds
- [ ] 10s videos complete in 60-120 seconds
- [ ] Generation time is consistent
- [ ] App performance doesn't degrade

**❌ Common Issues to Report:**
- Videos take > 2 minutes consistently
- Generation time increases with each video
- App becomes very slow after 2-3 generations
- Browser freezes during generation

---

## Reporting Issues

### How to Report a Bug

When you find a problem, please include:

1. **Bug Title**: Short description (e.g., "Video generation fails on Scene 2")

2. **Steps to Reproduce**:
   ```
   1. Open app on iPhone 14, iOS 17, Safari
   2. Navigate to Step 3 → Scene 2
   3. Click "Generate Scene Video"
   4. Wait 5 minutes
   5. Generation times out with error
   ```

3. **Expected Behavior**: What should happen (e.g., "Video should generate in 30-120 seconds")

4. **Actual Behavior**: What actually happened (e.g., "Generation times out after 5 minutes with error: 'Request timed out'")

5. **Environment**:
   - Device: (e.g., iPhone 14 Pro, Windows PC, Samsung S21)
   - Browser: (e.g., Safari 17, Chrome 120)
   - Connection: (e.g., WiFi speed, 4G, 3G)
   - Scene: (e.g., Scene 2, "Wedding Ceremony")

6. **Video-Specific Info**:
   - Video duration: (5s or 10s)
   - Start frame: (describe or attach image)
   - End frame: (describe or attach image)
   - How long did you wait?
   - Progress percentage when it failed: (e.g., stuck at 85%)

7. **Screenshots/Screen Recording** (if possible):
   - Screenshot of error
   - Screenshot of progress stuck
   - Screen recording of generation process

### Bug Priority Guide

**🔴 Critical (Report Immediately)**:
- Video generation completely broken (never works)
- App crashes when clicking "Generate"
- Generated videos are corrupted (can't play)
- Can't use video features at all
- Costs not being tracked (financial impact)

**🟡 High (Report Soon)**:
- Video generation fails most of the time (> 50%)
- Generation takes > 5 minutes consistently
- Progress never updates (stuck at 0%)
- Regeneration doesn't work
- Videos don't match scene at all
- Major mobile issues (can't use on phone)

**🟢 Medium (Report When Convenient)**:
- Video generation sometimes fails (< 50%)
- Progress updates are laggy
- Some videos are low quality
- Regeneration limit not enforced
- Minor UI issues

**🔵 Low (Nice to Fix)**:
- Video quality could be better
- Progress messages could be clearer
- Small visual glitches
- Minor text issues

---

## Testing Checklist Summary

**Sprint 6: AI Video Generation** (11 tests)

### Video Generation (4 tests)
- [ ] Test 1: Start Video Generation
- [ ] Test 2: Monitor Real-time Progress
- [ ] Test 3: Video Generation Completion
- [ ] Test 4: Generate Multiple Videos

### Video Regeneration (2 tests)
- [ ] Test 5: Refine Video with AI Feedback
- [ ] Test 6: Regeneration Limits

### Credit Verification (1 test)
- [ ] Test 7: Verify Credit Deduction

### Mobile (1 test)
- [ ] Test 8: Video Generation on Mobile

### Error Handling (2 tests)
- [ ] Test 9: Handle Generation Failures
- [ ] Test 10: API Rate Limits

### Performance (1 test)
- [ ] Test 11: Generation Time Performance

**Total**: 11 comprehensive tests covering all Sprint 6 video features

---

## Important Notes

### What's Tested in Sprint 6
- ✅ Video generation from start/end frames (20 credits per video)
- ✅ Real-time progress tracking (spinner, progress bar, percentage)
- ✅ Video playback with controls
- ✅ Video regeneration with AI feedback chat (20 credits per regeneration)
- ✅ Regeneration limits (max 5 regenerations after initial = 6 total videos)
- ✅ Credit deduction and insufficient credits handling
- ✅ Mobile video generation experience
- ✅ Error handling and retry functionality
- ✅ Performance (30-120 seconds generation time)

### What's NOT Tested in Sprint 6
- ❌ Scene image generation (tested in Sprint 4/5)
- ❌ AI Director Chat (tested in Sprint 5)
- ❌ Final video assembly (all scenes → 1 video) - Coming in later sprint
- ❌ Audio/music for videos - Coming in sound design step
- ❌ Video editing features (trim, crop) - Post-MVP

### Credit Costs Summary
| Action | Credits |
|--------|---------|
| Video generation (per scene) | 20 |
| Video regeneration (per attempt) | 20 |
| **Recommended for full testing** | 150+ credits |

### Video Generation Behavior Notes
- **Video generation is SLOW**: 30-120 seconds is normal
- **Keep window open**: Don't close or navigate away during generation
- **Videos cost credits**: 20 credits per generation (both initial and regeneration)
- **Generation can fail**: Timeouts and API issues are common (credits refunded on failure)
- **Quality varies**: Some videos may be better than others
- **Regeneration helps**: Use AI feedback chat to improve videos (up to 5 regenerations allowed)

### Performance Expectations
- **5-second video**: 30-90 seconds to generate
- **10-second video**: 60-120 seconds to generate
- **Progress updates**: Every 2-5 seconds
- **Regeneration**: Same time as initial generation

### Critical Testing Tips
1. **Be patient**: Video generation takes time!
2. **Don't multitask**: Keep window focused during generation
3. **Good internet**: Slow connections cause failures
4. **Test wisely**: Videos cost money, so don't over-test
5. **Report failures**: Generation failures are expected sometimes - report patterns

---

## Questions or Help Needed?

If you have questions or need clarification:
1. Contact the development team
2. Refer to this guide
3. Ask for a demo walkthrough of video features
4. Check Sprint 5 guide for AI Chat testing (regeneration uses chat)

**Thank you for testing Sprint 6!** Your feedback ensures our video generation works smoothly and creates beautiful cinematic videos. 🎬✨

---

**Last Updated**: December 23, 2025  
**Version**: 2.1  
**Status**: Ready for QA Team  
**Sprint**: Sprint 6 - AI Video Generation (Image-to-Video)

