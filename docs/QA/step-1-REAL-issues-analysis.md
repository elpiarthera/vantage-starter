# Step 1 REAL Issues Analysis

**Date**: November 28, 2025  
**Status**: 🔴 CRITICAL - Current tests are BS, don't verify production behavior

---

## The REAL Questions We Need to Answer

### 1. **Does the user stay authenticated when going BACK to Step 1?**

**Current Test**: NONE  
**Real Test Needed**:
```typescript
// User navigates: Step 1 → Step 2 → BACK to Step 1
// Is user still authenticated?
// Does Clerk session persist?
// Does useProjectData hook still work?
```

**Why Critical**: If auth breaks, Convex queries fail with "Not authenticated" error.

---

### 2. **Does useProjectData actually query Convex on page load?**

**Current Test**: Just checks `api.projects.get` exists (BS!)  
**Real Test Needed**:
```typescript
// When Step 1 loads with ?projectId=xxx in URL
// Does useQuery(api.projects.get, { projectId }) actually execute?
// Does it return real project data?
// Or does it return undefined/null?
```

**Why Critical**: If query doesn't run, form is empty even though data exists in Convex.

---

### 3. **Does auto-save ACTUALLY save to Convex (not just local state)?**

**Current Test**: Just checks debounce timing = 100ms (BS!)  
**Real Test Needed**:
```typescript
// User types in "name" field
// Wait 100ms
// Was useMutation(api.projects.update) actually called?
// Was data written to Convex database?
// Check Convex dashboard - does row exist?
```

**Why Critical**: If mutation doesn't fire, data is lost on refresh.

---

### 4. **Does projectId persist correctly on navigation?**

**Current Test**: Just checks URL string format (BS!)  
**Real Test Needed**:
```typescript
// Step 1: User creates project → projectId = "abc123"
// Step 1: User clicks Continue
// Does router.push() actually fire?
// Does URL actually change to /guided/step-2?projectId=abc123?
// Does Step 2 actually receive the projectId?
```

**Why Critical**: Missing projectId = Step 2/3 can't load data (the Step 3 loading bug!)

---

### 5. **Does the form actually load data from Convex when editing existing project?**

**Current Test**: NONE  
**Real Test Needed**:
```typescript
// User has existing project with projectId = "xyz"
// User navigates to /guided/step-1?projectId=xyz
// Does useProjectData(projectId) query Convex?
// Does the form populate with:
//   - selectedOccasion (from project.occasion)
//   - selectedTheme (from project.theme)
//   - eventDetails.name (from project.eventDetails.eventTitle)
//   - eventDetails.emotionalStory (from project.eventDetails.emotionalStory)
// Or is form empty/default state?
```

**Why Critical**: If form doesn't load, user loses all progress.

---

### 6. **Does the "continue" button actually create project in Convex?**

**Current Test**: NONE  
**Real Test Needed**:
```typescript
// User fills form
// User clicks "Continue to The Story"
// Does handleContinue() fire?
// Does create({ name, occasion, theme, eventDetails, language }) execute?
// Does Convex actually insert row in projects table?
// Does function return projectId?
// Does router.push fire with correct URL?
```

**Why Critical**: If create doesn't work, no project exists = entire flow broken.

---

### 7. **Does the component handle Convex loading states correctly?**

**Current Test**: NONE  
**Real Test Needed**:
```typescript
// When page first loads
// Is isLoading = true initially?
// Does UI show loading state?
// After Convex query completes
// Does isLoading = false?
// Does UI show form?
// What if query fails?
// Does UI show error state?
```

**Why Critical**: Bad loading states = infinite spinners or flash of wrong content.

---

### 8. **Does the useEffect sync actually work?**

**Current Test**: NONE  
**Real Test Needed**:
```typescript
// Lines 226-240 in step-1/page.tsx
useEffect(() => {
  if (project && !isLoading) {
    setSelectedOccasion(project.occasion);
    setSelectedTheme(project.theme);
    // ... etc
  }
}, [project, isLoading]);

// Does this actually run when project data arrives?
// Does it correctly populate all local state?
// What if project.eventDetails.date is undefined?
// Does it handle optional fields correctly?
```

**Why Critical**: If sync fails, form shows stale/wrong data.

---

### 9. **Does the auto-save useEffect actually trigger mutations?**

**Current Test**: NONE  
**Real Test Needed**:
```typescript
// Lines 243-278 in step-1/page.tsx
useEffect(() => {
  if (projectId && (selectedOccasion || selectedTheme || eventDetails.name || eventDetails.emotionalStory)) {
    update({ name, occasion, theme, eventDetails, language });
  }
}, [selectedOccasion, selectedTheme, eventDetails.name, ...]);

// When user changes any field:
// 1. Does this useEffect actually fire?
// 2. Does it call update() from useProjectData hook?
// 3. Does update() internally call useMutation(api.projects.update)?
// 4. Is the mutation debounced (100ms)?
// 5. Does Convex row actually update?
```

**Why Critical**: If this breaks, auto-save doesn't work = data loss.

---

## The ACTUAL Integration Test We Need

```typescript
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import GuidedStep1 from "@/app/guided/step-1/page";

vi.mock("convex/react");
vi.mock("next/navigation");
vi.mock("@clerk/nextjs");

describe("Step 1: REAL Convex Integration Test", () => {
  it("should ACTUALLY load project data from Convex", async () => {
    const mockProject = {
      _id: "proj_123",
      name: "Existing Project",
      occasion: "wedding",
      theme: "elegant",
      eventDetails: {
        eventTitle: "Existing Project",
        emotionalStory: "Existing story",
        description: "Existing desc",
      },
      language: "English",
    };
    
    const mockQuery = vi.fn().mockReturnValue(mockProject);
    (useQuery as any).mockReturnValue(mockProject);
    
    // Render with projectId in URL
    render(<GuidedStep1 searchParams={{ projectId: "proj_123" }} />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Project")).toBeInTheDocument();
    });
    
    // Verify form is populated
    expect(screen.getByDisplayValue("Existing story")).toBeInTheDocument();
    expect(screen.getByText("Wedding")).toBeInTheDocument(); // occasion card selected
    expect(screen.getByText("Elegant")).toBeInTheDocument(); // theme selected
  });
  
  it("should ACTUALLY save to Convex when user types", async () => {
    const mockUpdate = vi.fn();
    const mockCreate = vi.fn().mockResolvedValue("proj_new");
    
    (useQuery as any).mockReturnValue(undefined); // No existing project
    (useMutation as any).mockReturnValue(mockUpdate);
    
    const { projectData } = renderHook(() => useProjectData(undefined));
    projectData.create = mockCreate;
    
    render(<GuidedStep1 />);
    
    // User selects occasion
    fireEvent.click(screen.getByText("Wedding"));
    
    // User selects theme
    fireEvent.click(screen.getByText("Joyful Celebration"));
    
    // User types name
    const nameInput = screen.getByPlaceholderText(/project name/i);
    fireEvent.change(nameInput, { target: { value: "New Event" } });
    
    // User types emotional story
    const storyInput = screen.getByPlaceholderText(/your personal story/i);
    fireEvent.change(storyInput, { target: { value: "This is my story about love" } });
    
    // User clicks continue
    fireEvent.click(screen.getByText("Continue to The Story"));
    
    // Wait for mutation
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Event",
          occasion: "wedding",
          theme: "joyful",
          eventDetails: expect.objectContaining({
            emotionalStory: "This is my story about love",
          }),
        })
      );
    });
  });
  
  it("should ACTUALLY pass projectId in navigation URL", async () => {
    const mockPush = vi.fn();
    (useRouter as any).mockReturnValue({ push: mockPush });
    
    const mockCreate = vi.fn().mockResolvedValue("proj_new_123");
    
    // ... setup and fill form ...
    
    fireEvent.click(screen.getByText("Continue to The Story"));
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/guided/step-2?projectId=proj_new_123");
    });
  });
  
  it("should ACTUALLY stay authenticated when returning to Step 1", async () => {
    const mockProject = { /* existing project */ };
    const mockQuery = vi.fn().mockReturnValue(mockProject);
    
    (useQuery as any).mockReturnValue(mockProject);
    
    // First render (initial visit)
    const { rerender } = render(<GuidedStep1 searchParams={{ projectId: "proj_123" }} />);
    
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalled();
    });
    
    // Simulate navigation away and back
    rerender(<GuidedStep1 searchParams={{ projectId: "proj_123" }} />);
    
    // Verify query still works (auth not lost)
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(screen.getByDisplayValue(mockProject.name)).toBeInTheDocument();
    });
  });
});
```

---

## What We're ACTUALLY Testing Now (BS!)

| Test | What It Does | What We THINK It Does |
|------|-------------|---------------------|
| `expect(api.projects.create).toBeDefined()` | Checks function exists in API object | Tests that create mutation works |
| Mock data structure validation | Checks mock object shape | Tests real Convex data flow |
| `expect(100).toBe(100)` | Checks a number equals itself | Tests debounce actually works |
| URL string concatenation | Checks string format | Tests navigation actually happens |

**NONE of these test real Convex interactions!**

---

## Why This Matters - Production Bugs We're Missing

### Bug 1: Authentication Lost on Back Navigation
**Symptom**: User goes Step 1 → Step 2 → Back to Step 1 → "Not authenticated" error  
**Cause**: UserSyncProvider not persisting auth context  
**Current Test Coverage**: ZERO

### Bug 2: Auto-Save Not Firing
**Symptom**: User types in form, data not saved, refresh = data lost  
**Cause**: useEffect dependencies wrong, or update() not calling mutation  
**Current Test Coverage**: ZERO

### Bug 3: Form Not Loading Existing Data
**Symptom**: User edits existing project, form is empty  
**Cause**: useEffect sync not running, or project data undefined  
**Current Test Coverage**: ZERO

### Bug 4: projectId Not Passed in URL
**Symptom**: Step 2 can't load data (the Step 3 loading bug!)  
**Cause**: router.push not called, or projectId undefined  
**Current Test Coverage**: ZERO

---

## What We Need to Do

### Option 1: Write REAL Integration Tests
- Use React Testing Library with actual component rendering
- Mock Convex hooks (useQuery, useMutation) with real behavior
- Test full user flows: type → save → navigate → load
- Verify mutations actually called with correct args
- **Time**: 4-6 hours
- **Value**: HIGH - catches real bugs before production

### Option 2: Delete BS Tests, Do Manual Testing Only
- Delete current test file (it's useless)
- Create comprehensive manual test checklist
- Test on real Convex dev environment
- Verify in Convex dashboard
- **Time**: 2-3 hours
- **Value**: MEDIUM - catches bugs but slower, less repeatable

### Option 3: E2E Tests with Playwright
- Write end-to-end tests that run against real app
- Test full flow with real Convex instance
- Verify data in actual database
- **Time**: 6-8 hours
- **Value**: HIGHEST - tests real production behavior

---

## Recommendation

**IMMEDIATE (NOW)**:
1. Delete current BS tests - they give false confidence
2. Create manual test checklist (30 min)
3. Run manual tests on deployed app (1 hour)
4. Document any bugs found

**NEXT SPRINT (Production Readiness)**:
1. Write REAL integration tests (Option 1)
2. Focus on critical paths: auth, data loading, auto-save, navigation
3. Run tests before EVERY deployment
4. Add E2E tests for full flow (Option 3)

---

## The Harsh Truth

Current test status: **19/19 passing** ✅  
Real test status: **0 tests actually verify Convex works** 🔴

We're testing that our mocks work, not that our app works.

**This is why the app isn't production-ready despite "all tests passing".**

