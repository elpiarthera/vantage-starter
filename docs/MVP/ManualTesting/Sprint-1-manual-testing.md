# 🧪 MyShortReel - Sprint 1: Manual Testing Guide

**Sprint**: Sprint 1 - Authentication & Convex Foundation  
**Date Created**: November 19, 2025  
**Audience**: Non-technical QA testers  
**Status**: Ready for Testing  
**Estimated Time**: 1.5-2 hours

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Test Setup](#test-setup)
3. [Authentication Testing](#authentication-testing)
4. [Route Protection Testing](#route-protection-testing)
5. [Mobile Testing](#mobile-testing)
6. [Accessibility Testing](#accessibility-testing)
7. [Error Handling Testing](#error-handling-testing)
8. [Reporting Issues](#reporting-issues)

---

## Introduction

### What You're Testing

Sprint 1 implemented user authentication and backend database foundation. You will verify:
- **User Sign-Up**: Creating new accounts with email/password
- **User Sign-In**: Logging in with email or social providers (Google, Facebook)
- **Route Protection**: Ensuring protected pages require login
- **Session Management**: Verifying login sessions persist correctly
- **Backend Integration**: Confirming Convex database connects with authentication

### Why This Matters

Authentication is the foundation of the entire application. If users can't sign up, sign in, or access protected pages reliably, nothing else will work.

---

## Test Setup

### Before You Start

**You'll Need:**
1. A computer with a modern web browser (Chrome, Firefox, Safari, or Edge)
2. A smartphone (iPhone or Android) for mobile testing
3. A valid email address (or a test email like `tester+yourname@example.com`)
4. **A Google account** (required for OAuth testing)
5. **A Facebook account** (required for OAuth testing)

**Application URL:**
- **Production Deployment**: https://myshortreel-alpha-git-sprint-5-ai-integration-elpi-projects.vercel.app

**Test Accounts:**
- Create a new account during testing with email/password
- Use your own Google account for Google OAuth testing
- Use your own Facebook account for Facebook OAuth testing

---

## Authentication Testing

### Test 1: New User Sign-Up (Email & Password)

**Objective**: Verify new users can create an account using email and password.

**Steps:**

1. **Navigate to Sign-Up Page**
   - Open your web browser
   - Go to the application URL
   - Click the blue "Begin Your Film" button
   - **Expected Result**: You should be redirected to the sign-in/sign-up page

2. **Fill Out the Sign-Up Form**
   - Enter a valid email address (e.g., `yourname+test@gmail.com`)
   - Create a password (minimum 8 characters, include numbers/symbols)
   - Click "Sign Up" or "Create Account" button
   - **Expected Result**: Form submits without errors

3. **Verify Your Email**
   - Check your email inbox (and spam/junk folder)
   - Look for verification email from MyShortReel or Clerk
   - **Expected Result**: Email arrives within 2 minutes
   - Click the verification link in the email
   - **Expected Result**: Browser opens and you're redirected to the application

4. **Check Redirect After Sign-Up**
   - After clicking verification link, you should be automatically logged in
   - **Expected Result**: You land on `/guided/step-1` (Guided Director page)
   - **Expected Result**: You see your profile icon/button in the top-right corner

5. **Verify Profile Button**
   - Look for a circular profile icon in the top-right corner
   - Click on it
   - **Expected Result**: A dropdown menu appears with your email and "Sign Out" option

**✅ Success Criteria:**
- [ ] Sign-up form loads without errors
- [ ] Email and password fields work correctly
- [ ] Form validation works (e.g., password too short shows error)
- [ ] Verification email arrives within 2 minutes
- [ ] Verification link works (no 404 error)
- [ ] Automatic redirect to `/guided/step-1` after verification
- [ ] Profile button appears in top-right corner
- [ ] Clicking profile button shows dropdown with email and "Sign Out"

**❌ Common Issues to Report:**
- "Clerk publishable key missing" error on page
- Verification email not received after 5 minutes
- Verification link returns 404 or error page
- No redirect after verification (stays on verification success page)
- Profile button doesn't appear after sign-up

---

### Test 2: Existing User Sign-In (Email & Password)

**Objective**: Verify existing users can log in with email and password.

**Steps:**

1. **Sign Out First** (if you're currently signed in)
   - Click your profile icon in the top-right corner
   - Click "Sign Out"
   - **Expected Result**: You're logged out and redirected to the homepage

2. **Navigate to Sign-In Page**
   - Click the blue "Begin Your Film" button on the homepage
   - **Expected Result**: Sign-in page appears

3. **Enter Your Credentials**
   - Enter the email address you used in Test 1
   - Enter your password
   - Click "Sign In" button
   - **Expected Result**: Form submits successfully

4. **Check Redirect After Sign-In**
   - **Expected Result**: You're redirected to `/dashboard` page
   - **Expected Result**: Your profile button appears in the top-right corner
   - **Expected Result**: Dashboard displays with a welcome message

5. **Test Session Persistence**
   - Refresh the page (press F5 or Cmd+R on Mac)
   - **Expected Result**: You stay logged in (no redirect to sign-in)
   - **Expected Result**: Dashboard stays loaded with your data

6. **Test Session Across Browser Restart**
   - Close the browser completely
   - Reopen the browser
   - Navigate back to the application URL
   - **Expected Result**: You're still logged in (if "Remember me" was checked during sign-in)

**✅ Success Criteria:**
- [ ] Sign-in form loads correctly
- [ ] Correct email/password combination logs you in
- [ ] Redirect to `/dashboard` works after sign-in
- [ ] Session persists after page refresh
- [ ] Session persists after closing and reopening browser (if "Remember me" enabled)
- [ ] Profile button shows your email in dropdown

**❌ Common Issues to Report:**
- "Invalid credentials" error with correct password
- No redirect after sign-in (stays on sign-in page)
- Session lost after page refresh (forced to log in again)
- Profile button doesn't appear after sign-in

---

### Test 3: Google OAuth Sign-In

**Objective**: Verify users can sign in using their Google account.

**Prerequisites**: You need a Google account.

**Steps:**

1. **Sign Out** (if currently signed in)
   - Click profile icon → "Sign Out"

2. **Start Google OAuth Flow**
   - Go to the sign-in page (`/sign-in`)
   - Click the "Continue with Google" button
   - **Expected Result**: Google sign-in popup or redirect appears

3. **Authenticate with Google**
   - Select your Google account (or enter credentials if not logged into Google)
   - Click "Allow" or "Continue" to grant permissions
   - **Expected Result**: Google authenticates you successfully

4. **Check Redirect Back to Application**
   - **Expected Result**: You're redirected back to MyShortReel
   - **Expected Result**: You land on `/dashboard` page
   - **Expected Result**: Your Google profile picture appears in the profile button (if you have one set in Google)

5. **Verify Account Info**
   - Click your profile icon
   - **Expected Result**: Dropdown shows your Google name and email
   - **Expected Result**: "Sign Out" option is available

**✅ Success Criteria:**
- [ ] "Continue with Google" button is visible and clickable
- [ ] Google OAuth popup or redirect works
- [ ] Google authentication completes successfully
- [ ] Redirect back to application works
- [ ] User lands on `/dashboard` after OAuth
- [ ] Profile shows Google account info (name, email, picture)

**❌ Common Issues to Report:**
- "Continue with Google" button doesn't respond when clicked
- OAuth popup is blocked by browser (check if popup blocker enabled)
- "Callback error" or "Invalid redirect URI" error message
- Lands on wrong page after authentication (e.g., stays on sign-in)
- Profile doesn't show Google account info

---

### Test 4: Facebook OAuth Sign-In

**Objective**: Verify users can sign in using their Facebook account.

**Prerequisites**: You need a Facebook account.

**Steps:**

1. **Sign Out** (if currently signed in)
   - Click profile icon → "Sign Out"

2. **Start Facebook OAuth Flow**
   - Go to the sign-in page (`/sign-in`)
   - Click the "Continue with Facebook" button
   - **Expected Result**: Facebook sign-in popup or redirect appears

3. **Authenticate with Facebook**
   - Enter Facebook credentials (if not already logged into Facebook)
   - Click "Continue" or "Allow" to grant permissions
   - **Expected Result**: Facebook authenticates you successfully

4. **Check Redirect Back to Application**
   - **Expected Result**: You're redirected back to MyShortReel
   - **Expected Result**: You land on `/dashboard` page
   - **Expected Result**: Your Facebook profile picture appears (if you have one)

5. **Verify Account Info**
   - Click your profile icon
   - **Expected Result**: Dropdown shows your Facebook name and email
   - **Expected Result**: "Sign Out" option is available

**✅ Success Criteria:**
- [ ] "Continue with Facebook" button is visible and clickable
- [ ] Facebook OAuth popup or redirect works
- [ ] Facebook authentication completes successfully
- [ ] Redirect back to application works
- [ ] User lands on `/dashboard` after OAuth
- [ ] Profile shows Facebook account info

**❌ Common Issues to Report:**
- Facebook button doesn't work when clicked
- OAuth popup is blocked by browser
- "Callback error" message appears
- Lands on wrong page after authentication
- Profile doesn't show Facebook account info

---

### Test 5: Sign-Out Functionality

**Objective**: Verify users can sign out successfully and session is cleared.

**Steps:**

1. **Ensure You're Signed In**
   - Sign in using any method (email, Google, or Facebook)
   - **Expected Result**: You see your profile icon in the top-right corner

2. **Open Profile Menu**
   - Click your profile icon/button
   - **Expected Result**: Dropdown menu appears

3. **Click Sign Out**
   - Click the "Sign Out" option in the dropdown
   - **Expected Result**: Menu closes and sign-out process starts

4. **Check Redirect After Sign-Out**
   - **Expected Result**: You're redirected to the homepage (`/`)
   - **Expected Result**: Homepage now shows the "Begin Your Film" button
   - **Expected Result**: Profile icon is gone (no longer visible)

5. **Verify Session is Cleared**
   - Try to navigate directly to `/dashboard` (type in address bar)
   - **Expected Result**: You're automatically redirected to `/sign-in` page
   - This confirms your session is truly cleared

**✅ Success Criteria:**
- [ ] Profile menu opens when clicked
- [ ] "Sign Out" option is visible in the menu
- [ ] Sign-out completes without errors
- [ ] Redirected to homepage after sign-out
- [ ] Homepage shows "Begin Your Film" button (not profile icon)
- [ ] Session is fully cleared (cannot access `/dashboard` without logging in again)

**❌ Common Issues to Report:**
- Profile menu doesn't open when clicked
- "Sign Out" option not visible in menu
- Still logged in after clicking sign-out
- Not redirected after sign-out
- Can still access `/dashboard` after sign-out (security issue!)

---

## Route Protection Testing

### Test 6: Protected Routes (Unauthenticated Access)

**Objective**: Verify that protected pages redirect to sign-in when user is not logged in.

**Steps:**

1. **Ensure You're Signed Out**
   - If signed in, click profile icon → "Sign Out"
   - **Expected Result**: Homepage shows the "Begin Your Film" button

2. **Try to Access Dashboard (Unauthenticated)**
   - In your browser's address bar, type `/dashboard` after the base URL
   - Press Enter
   - **Expected Result**: You're automatically redirected to `/sign-in` page
   - **Expected Result**: URL may show `?redirect_url=/dashboard` (preserving intended destination)

3. **Try to Access Guided Flow (Unauthenticated)**
   - In the address bar, type `/guided/step-1`
   - Press Enter
   - **Expected Result**: You're automatically redirected to `/sign-in` page
   - **Expected Result**: URL may show `?redirect_url=/guided/step-1`

4. **Sign In and Check Redirect**
   - Sign in from the sign-in page
   - **Expected Result**: After successful sign-in, you're automatically redirected to the page you originally tried to access
   - (If you tried `/dashboard` first, you should land on `/dashboard` after sign-in)

5. **Verify Public Pages Work Without Auth**
   - Sign out again
   - Navigate to homepage (`/`)
   - **Expected Result**: Homepage loads normally without redirect to sign-in
   - Navigate to `/sign-in` page
   - **Expected Result**: Sign-in page loads (no infinite redirect loop)

**✅ Success Criteria:**
- [ ] Cannot access `/dashboard` when logged out (redirects to sign-in)
- [ ] Cannot access `/guided/step-1` when logged out (redirects to sign-in)
- [ ] Redirect URL is preserved in the query parameter
- [ ] After signing in, user is redirected to the page they originally tried to access
- [ ] Homepage (`/`) is accessible without authentication
- [ ] Sign-in and sign-up pages are accessible without authentication
- [ ] No infinite redirect loops

**❌ Common Issues to Report:**
- Can access `/dashboard` without logging in (SECURITY ISSUE!)
- No redirect to sign-in when accessing protected pages
- Redirect URL not preserved (lands on wrong page after sign-in)
- Infinite redirect loop (page keeps reloading)

---

## Mobile Testing

### Test 7: Mobile Authentication Flow

**Objective**: Verify authentication works smoothly on mobile devices.

**Devices to Test:**
1. iPhone (any model) with Safari browser
2. Android phone (any model) with Chrome browser

**Steps for Each Device:**

1. **Test Sign-Up on Mobile**
   - Open mobile browser (Safari on iPhone, Chrome on Android)
   - Navigate to the application URL
   - Tap the blue "Begin Your Film" button
   - **Expected Result**: You're taken to sign-in/sign-up page
   - **Expected Result**: Form is readable (text not too small)
   - **Expected Result**: Input fields are large enough to tap easily (min 44px height)
   - Enter email and password
   - **Expected Result**: Mobile keyboard appears for text input
   - **Expected Result**: Password field shows secure keyboard (dots/asterisks)
   - Submit the form
   - **Expected Result**: Form submits successfully

2. **Test Touch Targets**
   - Try tapping all buttons (Sign Up, Sign In, OAuth buttons)
   - **Expected Result**: All buttons respond to tap without missing
   - **Expected Result**: Buttons are finger-friendly (at least 44px tall)
   - **Expected Result**: No accidental taps on nearby elements

3. **Test Sign-In on Mobile**
   - Sign out if needed
   - Navigate to sign-in page
   - Tap input fields and enter credentials
   - **Expected Result**: Keyboard appears for each field
   - **Expected Result**: Form fields are not cut off or hidden
   - Submit the form
   - **Expected Result**: Sign-in works correctly

4. **Test Profile Button on Mobile**
   - After signing in, tap the profile icon
   - **Expected Result**: Dropdown menu appears
   - **Expected Result**: Menu items are tappable (not too small)
   - **Expected Result**: Menu doesn't get cut off the screen
   - Tap "Sign Out"
   - **Expected Result**: Sign-out works correctly

5. **Test Page Scrolling**
   - Navigate to various pages (dashboard, guided flow)
   - Scroll up and down
   - **Expected Result**: Smooth scrolling (no lag or stuttering)
   - **Expected Result**: No horizontal scroll (all content fits screen width)

6. **Test Landscape Mode**
   - Rotate your phone to landscape orientation
   - **Expected Result**: Layout adapts to landscape mode
   - **Expected Result**: All content is still accessible
   - **Expected Result**: No visual glitches or overlapping elements

**✅ Success Criteria:**
- [ ] All forms work on mobile (can input text)
- [ ] Mobile keyboard appears correctly for each field type
- [ ] Buttons are finger-friendly (minimum 44px tap target)
- [ ] No missed taps (all interactive elements respond)
- [ ] Text is readable on mobile (not too small)
- [ ] No horizontal scrolling on any page
- [ ] Profile button dropdown works on mobile
- [ ] Sign-out works on mobile
- [ ] Both portrait and landscape orientations work
- [ ] Tested on iOS Safari
- [ ] Tested on Android Chrome

**❌ Common Issues to Report:**
- Text too small to read comfortably on mobile
- Buttons too small to tap accurately
- Input fields don't trigger mobile keyboard
- Horizontal scroll appears (page extends beyond screen)
- Dropdown menus get cut off or don't appear
- Layout breaks in landscape mode
- Sign-out doesn't work on mobile
- OAuth redirects fail on mobile browsers

---

## Accessibility Testing

### Test 8: Keyboard Navigation

**Objective**: Verify the application can be fully navigated using only a keyboard (no mouse).

**Steps:**

1. **Navigate Landing Page with Keyboard**
   - Open the homepage
   - Press the `Tab` key repeatedly
   - **Expected Result**: Focus moves through all interactive elements in logical order
   - **Expected Result**: A visible focus indicator (outline) appears around each focused element
   - **Expected Result**: Can reach: logo, "Begin Your Film" button

2. **Navigate Sign-In Form with Keyboard**
   - Navigate to the sign-in page
   - Press `Tab` to move to the email field
   - **Expected Result**: Email field gets focus (visible outline)
   - Type your email
   - Press `Tab` to move to the password field
   - **Expected Result**: Password field gets focus
   - Type your password
   - Press `Tab` to move to the "Sign In" button
   - **Expected Result**: Button gets focus
   - Press `Enter` key
   - **Expected Result**: Form submits (same as clicking the button)

3. **Test Profile Button with Keyboard**
   - After signing in, press `Tab` until the profile icon is focused
   - **Expected Result**: Profile icon has visible focus outline
   - Press `Enter` or `Spacebar`
   - **Expected Result**: Dropdown menu opens
   - Press `Tab` or `Arrow Down` key
   - **Expected Result**: Focus moves to menu items
   - Press `Enter` on "Sign Out"
   - **Expected Result**: Sign-out happens

4. **Test Modals/Dialogs with Keyboard**
   - If any modals appear (e.g., sign-in modal), test them:
   - Press `Tab` to move through modal elements
   - **Expected Result**: Focus stays inside the modal (doesn't escape to background)
   - Press `Escape` key
   - **Expected Result**: Modal closes

5. **Check Focus Order**
   - Throughout testing, verify focus moves in a logical order
   - **Expected Result**: Focus moves left-to-right, top-to-bottom
   - **Expected Result**: No focus traps (can always move forward with Tab or backward with Shift+Tab)

**✅ Success Criteria:**
- [ ] All interactive elements can be reached with `Tab` key
- [ ] Focus indicator is clearly visible on all focused elements
- [ ] Tab order is logical (matches visual layout)
- [ ] Forms can be filled using only keyboard
- [ ] Forms can be submitted with `Enter` key
- [ ] Dropdown menus can be opened with `Enter` or `Spacebar`
- [ ] Dropdown items can be navigated with `Tab` or `Arrow` keys
- [ ] Modals can be closed with `Escape` key
- [ ] No focus traps (can always tab forward or backward)

**❌ Common Issues to Report:**
- Some elements cannot be reached with `Tab` key
- Focus indicator not visible (can't see what's focused)
- Tab order is illogical (jumps around randomly)
- Cannot submit form with `Enter` key (requires mouse click)
- Dropdown doesn't open with keyboard
- `Escape` key doesn't close modals
- Focus gets trapped inside modal (cannot tab out)

---

## Error Handling Testing

### Test 9: Network Error Handling

**Objective**: Verify the application handles network errors gracefully.

**Steps:**

1. **Simulate Network Disruption**
   - Open browser developer tools (F12 or right-click → Inspect)
   - Go to the "Network" tab
   - Find an option to go "Offline" or disable network
   - Enable "Offline" mode

2. **Try to Sign In While Offline**
   - Attempt to sign in with your credentials
   - **Expected Result**: Application shows a user-friendly error message
   - **Expected Result**: Error message mentions network/connection issue
   - **Expected Result**: Application doesn't crash or show generic error

3. **Re-Enable Network and Retry**
   - Disable "Offline" mode in DevTools
   - Try signing in again
   - **Expected Result**: Sign-in works successfully now

**✅ Success Criteria:**
- [ ] Network errors display user-friendly messages
- [ ] Error messages are clear (mention connection issue)
- [ ] Application doesn't crash when offline
- [ ] No generic browser error pages
- [ ] Functionality resumes when network is restored

**❌ Common Issues to Report:**
- No error message when offline (silent failure)
- Generic error message that doesn't mention network
- Application crashes or freezes when offline
- Browser error page appears instead of app error message

---

## Reporting Issues

### How to Report a Bug

When you find a problem, please include:

1. **Bug Title**: Short description (e.g., "Sign-in button doesn't work on mobile")

2. **Steps to Reproduce**:
   ```
   1. Go to sign-in page on iPhone
   2. Enter email and password
   3. Tap "Sign In" button
   4. Nothing happens
   ```

3. **Expected Behavior**: What should happen (e.g., "Should sign me in and redirect to dashboard")

4. **Actual Behavior**: What actually happened (e.g., "Button doesn't respond, stays on sign-in page")

5. **Environment**:
   - Device: (e.g., iPhone 12, Windows 10 PC, MacBook Pro)
   - Browser: (e.g., Safari 17, Chrome 120, Firefox 115)
   - Account: (e.g., email used for testing)

6. **Screenshots/Video** (if possible):
   - Take a screenshot or screen recording showing the issue

7. **Console Errors** (if you know how):
   - Open DevTools (F12)
   - Go to Console tab
   - Copy any red error messages

### Bug Priority Guide

**🔴 Critical (Report Immediately)**:
- Cannot sign up or sign in at all
- Application crashes or freezes
- Can access protected pages without login (security issue)
- Data loss or corruption

**🟡 High (Report Soon)**:
- OAuth providers don't work
- Session doesn't persist (forced to log in repeatedly)
- Major UI broken on mobile

**🟢 Medium (Report When Convenient)**:
- Minor visual glitches
- Text too small on some screens
- Missing hover effects

**🔵 Low (Nice to Fix)**:
- Typos or wording suggestions
- Color/design preferences
- Small layout tweaks

---

## Testing Checklist Summary

**Sprint 1: Authentication & Foundation** (9 tests)

- [ ] Test 1: New User Sign-Up (Email & Password)
- [ ] Test 2: Existing User Sign-In (Email & Password)
- [ ] Test 3: Google OAuth Sign-In
- [ ] Test 4: Facebook OAuth Sign-In
- [ ] Test 5: Sign-Out Functionality
- [ ] Test 6: Protected Routes (Unauthenticated Access)
- [ ] Test 7: Mobile Authentication Flow
- [ ] Test 8: Keyboard Navigation
- [ ] Test 9: Network Error Handling

**Total**: 9 comprehensive tests covering all Sprint 1 features

**Note**: Convex integration is tested implicitly through successful sign-ins and data persistence. No separate test page is needed.

---

## Questions or Help Needed?

If you have questions or need clarification:
1. Contact the development team
2. Refer to this guide
3. Ask for a walkthrough or demo

**Thank you for testing Sprint 1!** Your feedback ensures a solid foundation for the entire application. 🎉

---

**Last Updated**: November 19, 2025  
**Version**: 1.0  
**Status**: Ready for QA Team  
**Sprint**: Sprint 1 - Authentication & Convex Foundation

