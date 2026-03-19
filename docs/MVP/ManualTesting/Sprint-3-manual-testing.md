# 🧪 MyShortReel - Sprint 3: Manual Testing Guide

**Sprint**: Sprint 3 - Core Data Layer (Step 1 Migration)  
**Date Created**: November 19, 2025  
**Last Updated**: December 23, 2025  
**Audience**: Non-technical QA testers  
**Status**: Ready for Testing  
**Estimated Time**: 45 minutes - 1 hour  
**Test Scope**: Step 1 - **Wedding occasion only**

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Test Setup](#test-setup)
3. [Project Creation Testing](#project-creation-testing)
4. [Data Persistence Testing](#data-persistence-testing)
5. [Mobile Testing](#mobile-testing)
6. [Cross-Device Testing](#cross-device-testing)
7. [Reporting Issues](#reporting-issues)

---

## Introduction

### What You're Testing

Sprint 3 migrated **Step 1 (Emotional Foundation)** from temporary storage to real database storage. You will verify:

- **Project Creation**: Creating new video invitation projects through the guided flow
- **Data Persistence**: Projects are saved to database when you click "Continue to The Story"
- **Form Validation**: Required fields and minimum character counts work correctly
- **AI Features**: Story refinement (1 credit) and story generation (5 credits) work
- **Real-Time Sync**: Project data syncs across browser tabs via Convex
- **Credit System**: Credits are displayed and deducted correctly

### Important: How Saving Works

**Step 1 does NOT have auto-save.** Project data is saved to the database when:
1. You click **"Continue to The Story ✨"** (creates project + saves all form data, costs 5 credits)
2. You click **"Regenerate Story"** (for existing projects, saves updated form data, costs 5 credits)

**Note about "Let AI Refine It"**: This button refines your story with AI (1 credit), but the refined text stays in the form locally. The refined story is only saved to the database when you click "Continue to The Story" or "Regenerate Story".

### What Changed

**Before Sprint 3**:
- ❌ Data lost on page refresh
- ❌ Data stored only in browser memory

**After Sprint 3**:
- ✅ Data persists forever once project is created (saved to Convex database)
- ✅ Real-time sync across tabs/devices via Convex
- ✅ Credit system integration for AI features

---

## Test Setup

### Before You Start

**You'll Need:**
1. A computer with a modern web browser
2. A smartphone (iPhone or Android) for mobile testing
3. Two different browser tabs for cross-tab testing
4. A valid user account (sign up if you don't have one)
5. Some credits (for testing AI features)

**Application URL:**
- **Production Deployment**: https://myshortreel-alpha-git-sprint-5-ai-integration-elpi-projects.vercel.app
- **Staging**: (URL provided by development team)

**Important Notes:**
- Make sure you're signed in before testing
- You'll be testing **Step 1: Emotional Foundation** page
- Check your credit balance before testing AI features
- **For this testing round, use only the "Wedding" occasion**

---

## Step 1 UI Reference

### Page Structure

When you navigate to Step 1, you should see:

**Header (fixed at top):**
- "Back to Projects" link (left)
- "Step 1: Emotional Foundation ❤️" with progress bar (center)
- "Your balance" badge (clickable - links to account page to view credits)
- Profile dropdown menu with "Dashboard" and "Sign Out" options (right)
- Home link (right)

**Main Content:**
1. **Title**: "✨ Create Your Emotionally Resonant Video"
2. **Subtitle**: "Let's establish the emotional foundation for your story"

**Section 1 - Choose Your Occasion (8 options with icons):**
- **Wedding (Heart icon) - "Romantic & Warm ❤️"** ← **USE THIS FOR TESTING**
- Birthday (Cake icon) - "Joyful & Fun 🎉"
- Anniversary (Calendar icon) - "Nostalgic & Tender 🕰️"
- Baby Shower (Baby icon) - "Exciting & Sweet 👶"
- Graduation (GraduationCap icon) - "Proud & Motivational 🎓"
- Corporate Event (Briefcase icon) - "Professional & Energetic 💼"
- Holiday Party (Gift icon) - "Festive & Warm 🎄"
- Engagement (Users icon) - "Romantic & Joyful 💍"

> ⚠️ **Testing Scope**: For this testing phase, please only test with the **Wedding** occasion.

**Section 2 - Shape the Emotion (appears after selecting occasion, 6 themes):**
- Joyful Celebration - "Evoke excitement with upbeat energy!"
- Heartfelt Nostalgia - "Create tender memories with warmth"
- Romantic Warmth - "Capture love with intimate moments"
- Energetic Fun - "Bring vibrant excitement to life"
- Tender Family - "Celebrate bonds with gentle emotion"
- Motivational Pride - "Inspire with achievement and growth"

**Section 3 - Project Details (appears after selecting theme):**
- **Project name *** (required, minimum 3 characters)
- **Event Type** (read-only, shows selected occasion)
- **Description** (optional textarea)
- **Date (Optional)** (date picker)
- **Location (Optional)** (text input)
- **RSVP Link (Optional)** (URL input)
- **Your Personal Story *** (required, minimum 10 characters)
- **"Let AI Refine It"** button (1 credit) - next to story field

**Section 4 - Language (appears after selecting theme):**
- Language dropdown (English, Chinese, Spanish, French, etc.)
- "Video duration: 30 seconds (optimized length)" hint

**Action Buttons (at bottom):**
- **"Skip to Visual Style ➜"** (green, Free) - Only shows if project has approved story
- **"Continue to The Story ✨"** or **"Regenerate Story"** (blue, 5 credits)
- Hint text if story already validated

---

## Project Creation Testing

### Recommended Test Data (Wedding)

Use these sample values throughout testing:

| Field | Sample Value |
|-------|-------------|
| Occasion | **Wedding** |
| Emotional Theme | **Romantic Warmth** |
| Project name | "Sarah & John Wedding" |
| Description | "A beautiful summer wedding celebration" |
| Date | Any future date (e.g., 2025-07-15) |
| Location | "Beach Resort, Malibu, CA" |
| RSVP Link | "https://example.com/rsvp" |
| Personal Story | "We met at a coffee shop in Paris three years ago. From that first conversation, we knew something magical was happening. Now we're getting married at sunset by the beach, surrounded by the people we love most." |

---

### Test 1: New Project Creation Flow

**Objective**: Verify you can create a new video project through the complete flow.

**Steps:**

1. **Navigate to Step 1**
   - Go to the landing page (home)
   - Click **"Begin Your Film"** button
   - OR navigate directly to `/guided/step-1`
   - **Expected Result**: Step 1 page loads with "Choose Your Occasion" section visible

2. **Select Wedding Occasion**
   - Click on the **"Wedding"** card (first card, with Heart icon)
   - **Expected Result**: 
     - Card shows blue border (selected state)
     - "Shape the Emotion" section appears below

3. **Select an Emotional Theme**
   - Click on **"Romantic Warmth"** (recommended for Wedding)
   - **Expected Result**: 
     - Card shows blue border (selected state)
     - "Project Details" form and "Language" section appear

4. **Fill in Required Fields**
   - **Project name**: Enter "Sarah & John Wedding" (or similar wedding-related name)
   - **Your Personal Story**: Enter a wedding story, e.g., "We met at a coffee shop in Paris three years ago. Now we're getting married at sunset by the beach."
   - **Expected Result**: 
     - No red error messages appear
     - "Continue to The Story ✨" button becomes enabled (blue)

5. **Test Form Validation**
   - Clear the project name, type just 2 characters
   - **Expected Result**: Red text "Name must be at least 3 characters" appears
   - Clear the story, type just 5 characters
   - **Expected Result**: Red text "Story must be at least 10 characters" appears
   - **Expected Result**: "Continue to The Story" button is disabled (gray)

6. **Create the Project**
   - Fill in valid data for required fields
   - Click **"Continue to The Story ✨"** button
   - **Expected Result**: 
     - Button shows "Generating Your Story..." with spinner
     - After processing, you're redirected to Step 2 (`/guided/step-2?projectId=...`)
     - URL contains a `projectId` parameter

**✅ Success Criteria:**
- [ ] Can navigate to Step 1 from landing page
- [ ] Occasion selection works and reveals emotion section
- [ ] Theme selection works and reveals form sections
- [ ] Form validation shows errors for invalid input
- [ ] Required fields prevent submission when invalid
- [ ] Project creation works and redirects to Step 2

**❌ Common Issues to Report:**
- Sections don't appear after selections
- Validation messages don't show
- Button stays disabled with valid input
- Error during project creation
- Not redirected to Step 2

---

### Test 2: Edit Existing Project

**Objective**: Verify you can load and edit an existing project through the Dashboard.

**Steps:**

1. **Create a Project First**
   - Complete Test 1 to create a project
   - Note the project name you used (e.g., "Sarah & John Wedding")

2. **Go to Dashboard**
   - Click on **"Profile"** dropdown in the header (top right)
   - Select **"Dashboard"** from the dropdown menu
   - **Expected Result**: Dashboard page loads with "Recent Projects" section

3. **Find Your Project**
   - Look in the **"Recent Projects"** section
   - Find your project by name (e.g., "Sarah & John Wedding")
   - It should show "Wedding" and "Draft" badges
   - **Expected Result**: Your project card is visible

4. **Open Project Details**
   - Click on the project card
   - **Expected Result**: Project detail page opens showing:
     - Project name as title
     - "Wedding" and "Draft" badges
     - "Edit Project", "Share Project", "Delete Project" buttons
     - Tabs: Scenes, Assets, Audio, Share, Settings

5. **Click Edit Project**
   - Click the blue **"Edit Project"** button
   - **Expected Result**: 
     - Step 1 page loads with all your previously saved data
     - Wedding occasion card is pre-selected (blue border)
     - Romantic Warmth theme card is pre-selected (blue border)
     - Form fields show your saved values (project name, story, etc.)

6. **Edit Project Details**
   - Change the project name (e.g., add " - Updated")
   - Change the story text
   - Add or change optional fields (date, location)
   - **Expected Result**: All fields accept input normally

7. **Update the Project**
   - Click **"Regenerate Story"** (5 credits)
   - **Expected Result**: 
     - Button shows "Generating Your Story..."
     - After processing, redirected to Step 2

**✅ Success Criteria:**
- [ ] Can navigate to Dashboard from Profile menu
- [ ] Project appears in Recent Projects
- [ ] Can open project detail page
- [ ] Edit Project button works
- [ ] Existing project data loads correctly in Step 1
- [ ] Wedding occasion is pre-selected
- [ ] Romantic Warmth theme is pre-selected
- [ ] Form fields have saved values
- [ ] Can edit any field
- [ ] Changes are saved when clicking regenerate

**❌ Common Issues to Report:**
- Dashboard doesn't show project
- Project card shows wrong information
- Edit Project button doesn't work
- Existing data doesn't load in Step 1
- Fields are empty despite having saved data
- Wrong occasion/theme selected

---

### Test 3: AI Story Refinement

**Objective**: Verify the "Let AI Refine It" feature works.

**Prerequisites**: You need at least 1 credit.

**Steps:**

1. **Navigate to Step 1**
   - Go to Step 1 (new or existing project)
   - Select **Wedding** occasion and **Romantic Warmth** theme
   - Fill in project name (e.g., "Test Wedding")

2. **Enter a Story**
   - In "Your Personal Story", enter at least 10 characters
   - (e.g., "We met at a coffee shop in Paris and it was love at first sight. Now we're planning our dream wedding.")

3. **Click "Let AI Refine It"**
   - **Expected Result**: Button shows "Refining..." with spinner
   - **Expected Result**: After processing, story text is replaced with refined version
   - **Expected Result**: 1 credit is deducted from your balance

4. **Check Credit Deduction**
   - Click the **"Your balance"** badge in header (links to account page)
   - **Expected Result**: Your credit balance decreased by 1

**✅ Success Criteria:**
- [ ] Button shows 1 credit badge
- [ ] Refinement shows loading state
- [ ] Story is replaced with refined text
- [ ] Credit is deducted

**❌ Common Issues to Report:**
- Refinement doesn't work
- Credit not deducted
- Error during refinement
- Story doesn't update

---

### Test 4: Insufficient Credits Handling

**Objective**: Verify proper handling when user lacks credits.

**Prerequisites**: A test account with 0-4 credits.

**Steps:**

1. **Test with 0 Credits**
   - Navigate to Step 1 with 0 credits
   - Fill in all required fields
   - Click "Continue to The Story ✨"
   - **Expected Result**: 
     - Modal appears: "Insufficient Credits"
     - Shows required credits (5) vs available (0)
     - Has "Purchase Credits" button

2. **Test Refinement with 0 Credits**
   - Click "Let AI Refine It"
   - **Expected Result**: Insufficient credits modal appears

**✅ Success Criteria:**
- [ ] Insufficient credits modal appears
- [ ] Shows correct credit amounts
- [ ] Purchase button is visible

**❌ Common Issues to Report:**
- Modal doesn't appear
- Wrong credit amounts shown
- Action proceeds despite insufficient credits

---

## Data Persistence Testing

### Test 5: Page Refresh (After Project Creation)

**Objective**: Verify data persists after refreshing the page.

**Steps:**

1. **Open an Existing Project in Step 1**
   - Follow Test 2 steps 2-5 to navigate to an existing project via Dashboard
   - Click "Edit Project" to open Step 1
   - **Expected Result**: Step 1 loads with your saved data

2. **Refresh the Page**
   - Press F5 (Windows) or Cmd+R (Mac) to refresh
   - **Expected Result**: Page reloads without errors

3. **Verify Data Persisted**
   - Check Wedding occasion is still selected (blue border)
   - Check Romantic Warmth theme is still selected (blue border)
   - Check all form fields have correct values (project name, story, etc.)
   - **Expected Result**: All your data is intact after refresh

**✅ Success Criteria:**
- [ ] Page refreshes without errors
- [ ] All data reappears after refresh
- [ ] Wedding occasion is still selected
- [ ] Romantic Warmth theme is still selected
- [ ] Form fields have saved values

**Note**: Before creating a project (before clicking "Continue to The Story"), data is only in local state and will be lost on refresh. This is expected behavior.

---

### Test 6: Browser Close and Reopen

**Objective**: Verify data persists after closing the browser completely.

**Steps:**

1. **Note Your Project Name**
   - Make sure you have created a project (Test 1)
   - Remember the project name (e.g., "Sarah & John Wedding")

2. **Close Browser Completely**
   - Close ALL browser windows (not just tabs)
   - Wait 10 seconds

3. **Reopen Browser and Sign In**
   - Open the browser again
   - Navigate to the application URL
   - Sign in if needed (you may need to re-authenticate)

4. **Find Your Project via Dashboard**
   - Click on **"Profile"** dropdown → **"Dashboard"**
   - Look in the **"Recent Projects"** section
   - Find your project by name
   - **Expected Result**: Your project is still there

5. **Open and Verify**
   - Click on the project card
   - Click **"Edit Project"**
   - **Expected Result**: Step 1 loads with all your saved data intact

**✅ Success Criteria:**
- [ ] Can sign back in after browser restart
- [ ] Project appears in Dashboard
- [ ] Can access project via Edit Project
- [ ] All data is intact (occasion, theme, form fields)

---

## Mobile Testing

### Test 7: Mobile Experience

**Objective**: Verify Step 1 works on mobile devices.

**Prerequisites**: iPhone or Android smartphone.

**Steps:**

1. **Open on Mobile**
   - Open mobile browser
   - Navigate to the application
   - Sign in
   - Go to Step 1

2. **Test Occasion Selection**
   - Scroll through occasion cards (2x4 grid on mobile)
   - Tap on **"Wedding"** card
   - **Expected Result**: Selection works, "Shape the Emotion" section appears

3. **Test Theme Selection**
   - Scroll through theme cards
   - Tap on **"Romantic Warmth"** card
   - **Expected Result**: Selection works, form appears

4. **Test Form Input**
   - Tap each input field
   - **Expected Result**: Mobile keyboard appears
   - Type in fields
   - **Expected Result**: Typing works smoothly

5. **Test Language Dropdown**
   - Tap the language dropdown
   - **Expected Result**: Options appear
   - Select a different language
   - **Expected Result**: Selection updates

**✅ Success Criteria:**
- [ ] Page displays correctly on mobile
- [ ] All cards are tappable
- [ ] Keyboard appears for input fields
- [ ] Dropdowns work on mobile
- [ ] Scrolling is smooth
- [ ] Tested on iOS Safari
- [ ] Tested on Android Chrome

**❌ Common Issues to Report:**
- Layout broken on mobile
- Cards not responding to taps
- Keyboard covers input fields
- Can't scroll to see all content

---

## Cross-Device Testing

### Test 8: Real-Time Sync Across Tabs

**Objective**: Verify that saved project data syncs in real-time between tabs via Convex.

**Important Note**: Step 1 form changes are LOCAL ONLY until you click "Continue to The Story" or "Regenerate Story". Real-time sync only works for data that has been saved to Convex.

**Steps:**

1. **Open a Project in Tab 1**
   - Make sure you have an existing project (from Test 1)
   - Go to Dashboard → Recent Projects → Click your project → Click "Edit Project"
   - **Expected Result**: Step 1 loads with your saved project data

2. **Copy the URL and Open in Tab 2**
   - In Tab 1, copy the current URL from the browser address bar
   - Open a new browser tab (Tab 2)
   - Paste the URL and press Enter
   - **Expected Result**: Both tabs show the same saved project data

3. **Verify Initial Sync**
   - Compare the data in both tabs
   - **Expected Result**: Project name, occasion, theme, story - all match
   - This proves both tabs are reading from the same Convex database

4. **Understand Local vs Synced Changes**
   - In Tab 1, type something new in the story field
   - Check Tab 2 (do NOT refresh)
   - **Expected Result**: Tab 2 does NOT show the new text (because it's local only)
   - This is expected behavior - changes are local until saved

5. **(Optional) Test Full Sync via Regenerate**
   - In Tab 1, click **"Regenerate Story"** (5 credits) to save changes
   - Wait for processing to complete (will redirect to Step 2)
   - In Tab 2, navigate to the project via Dashboard → Edit Project
   - **Expected Result**: Tab 2 shows the updated project data

**✅ Success Criteria:**
- [ ] Same project loads in both tabs initially
- [ ] Both tabs show identical saved data
- [ ] Local form changes do NOT sync (expected behavior)
- [ ] Saved data syncs correctly

**Note**: Real-time sync applies to saved Convex data. Step 1 form edits are local state until you click a save action button.

---

### Test 9: Cross-Device Sync

**Objective**: Verify project data is accessible from both mobile and desktop.

**Prerequisites**: Computer + smartphone, same user account.

**Steps:**

1. **Create Project on Desktop**
   - On your computer, create a new Wedding project (Test 1)
   - Remember the project name (e.g., "Sarah & John Wedding")

2. **Open Dashboard on Mobile**
   - On your smartphone, open the browser
   - Navigate to the application URL
   - Sign in with the **same account** as desktop
   - Go to Dashboard (via Profile dropdown or navigate to `/dashboard`)

3. **Find the Project on Mobile**
   - Look in the **"Recent Projects"** section
   - **Expected Result**: Your project appears with correct name, "Wedding" badge

4. **Open Project on Mobile**
   - Tap on the project card
   - Tap **"Edit Project"**
   - **Expected Result**: Step 1 loads with all the same data you entered on desktop

5. **Verify Data Matches**
   - Check Wedding occasion is selected
   - Check Romantic Warmth theme is selected
   - Check all form fields match what you entered on desktop

**✅ Success Criteria:**
- [ ] Can sign in on mobile with same account
- [ ] Project appears in Dashboard on mobile
- [ ] Can open project via Edit Project on mobile
- [ ] All data matches between desktop and mobile

---

## Reporting Issues

### How to Report a Bug

When you find a problem, please include:

1. **Bug Title**: Short description (e.g., "Wedding card not clickable on iPhone")

2. **Steps to Reproduce**:
   ```
   1. Open app on iPhone Safari
   2. Navigate to Step 1
   3. Try to tap on Wedding card
   4. Card doesn't respond
   ```

3. **Expected Behavior**: What should happen

4. **Actual Behavior**: What actually happened

5. **Environment**:
   - Device (e.g., iPhone 12, Windows PC)
   - Browser (e.g., Safari 17, Chrome 120)
   - User Account
   - Credit Balance
   - projectId (if applicable)

6. **Screenshots** (if possible)

### Bug Priority Guide

**🔴 Critical (Report Immediately)**:
- Cannot create new projects
- Project data is lost
- Application crashes
- Credit charges without service

**🟡 High (Report Soon)**:
- Form validation not working
- AI features fail
- Cannot load existing projects
- Mobile layout broken

**🟢 Medium (Report When Convenient)**:
- Minor visual glitches
- Sync delay is long (> 10 seconds)
- UI not responsive briefly

**🔵 Low (Nice to Fix)**:
- Text formatting issues
- Minor UI inconsistencies

---

## Testing Checklist Summary

**Sprint 3: Core Data Layer (Step 1)** (9 tests)

### Project Creation & Editing (4 tests)
- [ ] Test 1: New Project Creation Flow
- [ ] Test 2: Edit Existing Project
- [ ] Test 3: AI Story Refinement
- [ ] Test 4: Insufficient Credits Handling

### Data Persistence (2 tests)
- [ ] Test 5: Page Refresh
- [ ] Test 6: Browser Close and Reopen

### Mobile (1 test)
- [ ] Test 7: Mobile Experience

### Cross-Device (2 tests)
- [ ] Test 8: Real-Time Sync Across Tabs
- [ ] Test 9: Cross-Device Sync

**Total**: 9 comprehensive tests

---

## Important Notes

### What's Tested in Sprint 3
- ✅ Step 1 (Emotional Foundation) only
- ✅ **Wedding occasion only** (other occasions not in test scope)
- ✅ Project creation (when clicking "Continue to The Story")
- ✅ AI story refinement (1 credit)
- ✅ Story generation (5 credits)
- ✅ Data persistence via Convex
- ✅ Real-time sync via Convex

### What's NOT Auto-Saved
- ❌ Form changes before clicking "Continue to The Story" (local state only)
- ❌ Changing occasion/theme without creating project
- ❌ Refined story from "Let AI Refine It" (story is local until you click Continue/Regenerate)

### When Data is Saved to Convex
- ✅ When clicking "Continue to The Story ✨" (creates project + saves all form data, costs 5 credits)
- ✅ When clicking "Regenerate Story" (updates existing project, costs 5 credits)

### What "Let AI Refine It" Does
- ✅ Deducts 1 credit (saved to Convex)
- ✅ Refines your story with AI
- ❌ Does NOT save the refined story to Convex (stays in local form state)
- ℹ️ The refined story is saved when you click "Continue to The Story" or "Regenerate Story"

---

## Questions or Help Needed?

If you have questions or need clarification:
1. Contact the development team
2. Refer to this guide
3. Ask for a demo walkthrough of Step 1

**Thank you for testing Sprint 3!** 🎉

---

**Last Updated**: December 23, 2025  
**Version**: 2.0  
**Status**: Ready for QA Team  
**Sprint**: Sprint 3 - Core Data Layer (Step 1 Migration)
