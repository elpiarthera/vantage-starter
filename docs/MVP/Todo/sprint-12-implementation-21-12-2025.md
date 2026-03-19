# 🔄 MyShortReel - Sprint 12: Step Renaming (Remove 2b, 3b)

**Date**: December 21, 2025  
**Status**: 📋 PLANNING  
**Estimated Time**: 11 hours  
**Goal**: Rename guided flow steps from confusing `step-2b`, `step-3b` to sequential `step-3`, `step-5`  
**Dependencies**: None  
**Architecture**: Based on `architectural-improvements-sprint-21-12-2025.md` (Improvement #2)  
**QA Strategy**: **2-Step QA** - TypeScript (noEmit) → Biome for all files  
**Last Reviewed**: January 9, 2026 - Accuracy verified against actual codebase  

---

## 📊 Executive Summary

### Problem Statement

Current step naming is confusing with "b" suffixes:

| Current | Description | Issues |
|---------|-------------|--------|
| step-1 | Emotional Foundation | ✅ OK |
| step-2 | The Story (Chat) | ✅ OK |
| step-2b | Visual Style | ❌ Confusing URL |
| step-3 | Visual Design (Scene Editor) | ✅ OK |
| step-3b | The Narration (Chat) | ❌ Confusing URL |
| step-4 | Sound Design | ✅ OK |
| step-5 | Final Review | ✅ OK |
| step-6 | Premiere Night | ✅ OK |

Users see "Step 2b of 6" which is confusing UX.

### Solution

Rename to sequential steps (8 total):

| Current | New | Description |
|---------|-----|-------------|
| step-1 | step-1 | Emotional Foundation |
| step-2 | step-2 | The Story (Chat) |
| step-2b | **step-3** | Visual Style |
| step-3 | **step-4** | Visual Design |
| step-3b | **step-5** | The Narration |
| step-4 | **step-6** | Sound Design |
| step-5 | **step-7** | Final Review |
| step-6 | **step-8** | Premiere Night |

### ⚠️ CRITICAL: Rename in DESCENDING Order

To avoid file conflicts, rename from **LAST to FIRST**:

```bash
# Order of operations
1. step-6 → step-8  ✅ No conflict
2. step-5 → step-7  ✅ step-6 already moved
3. step-4 → step-6  ✅ step-5 already moved
4. step-3b → step-5 ✅ step-4 already moved
5. step-3 → step-4  ✅ step-3b already moved
6. step-2b → step-3 ✅ step-3 already moved
# step-1 and step-2 stay unchanged
```

---

## ⏱️ TIME TRACKING

| Task | Description | Est. Hours | Actual | Status |
|------|-------------|------------|--------|--------|
| 1 | Rename directories (descending order) | 0.5h | - | ⏳ |
| 2 | Update all internal navigation links | 2h | - | ⏳ |
| 3 | Update StepHeader component (8 steps + emojis + progress) | **1.5h** | - | ⏳ |
| 4 | Update progress bar calculations | 0.5h | - | ⏳ |
| 5 | Update i18n namespaces | 1.5h | - | ⏳ |
| 6 | Add redirects for old URLs | 1h | - | ⏳ |
| 7 | Update test files (~34 refs in navigation test) | 1h | - | ⏳ |
| 8 | Update documentation (12 files) | **1.5h** | - | ⏳ |
| 9 | Testing all navigation paths | 1h | - | ⏳ |
| 10 | QA & Deploy | 0.5h | - | ⏳ |
| **TOTAL** | | **11h** | - | ⏳ |

---

## 🔍 PRE-SPRINT CHECKLIST (5 min)

Before starting Sprint 12:

- [ ] **Verify current directory structure**:
  ```bash
  ls -la app/[locale]/guided/
  # Expected: step-1, step-2, step-2b, step-3, step-3b, step-4, step-5, step-6
  ```

- [ ] **Verify tests pass before changes**:
  ```bash
  npx vitest run __tests__/integration/
  ```

- [ ] **Backup current state** (optional but recommended):
  ```bash
  git status
  git stash  # If needed
  ```

---

## 📋 Task 1: Rename Directories (0.5 hours)

### Objective

Rename all step directories in the correct order to avoid conflicts.

### ⚠️ CRITICAL: Execute in DESCENDING Order

```bash
cd app/[locale]/guided/

# Step 1: Rename from LAST to FIRST
mv step-6/ step-8/
mv step-5/ step-7/
mv step-4/ step-6/
mv step-3b/ step-5/
mv step-3/ step-4/
mv step-2b/ step-3/

# Verify final structure
ls -la
# Expected: step-1, step-2, step-3, step-4, step-5, step-6, step-7, step-8
```

### Verification

| Order | Operation | Result |
|-------|-----------|--------|
| 1st | step-6 → step-8 | ✅ No conflict |
| 2nd | step-5 → step-7 | ✅ step-6 is now step-8 |
| 3rd | step-4 → step-6 | ✅ step-5 is now step-7 |
| 4th | step-3b → step-5 | ✅ step-4 is now step-6 |
| 5th | step-3 → step-4 | ✅ step-3b is now step-5 |
| 6th | step-2b → step-3 | ✅ step-3 is now step-4 |

### QA Checklist

- [ ] All 8 step directories exist
- [ ] No duplicate directories
- [ ] Each page.tsx file exists in each directory

---

## 📋 Task 2: Update Internal Navigation Links (2 hours)

### Objective

Update all `router.push()`, `Link href`, and navigation references.

### Files to Update

Search and replace in each file:

```bash
# Find all files with step references
grep -r "step-2b\|step-3b\|step-4\|step-5\|step-6" --include="*.tsx" --include="*.ts" app/
```

### Navigation Mapping

| Old URL | New URL | Files Affected |
|---------|---------|----------------|
| `/guided/step-2b` | `/guided/step-3` | step-2/page.tsx, step-3/page.tsx |
| `/guided/step-3` | `/guided/step-4` | step-3/page.tsx, step-2b→step-3 |
| `/guided/step-3b` | `/guided/step-5` | step-4/page.tsx, step-3→step-4 |
| `/guided/step-4` | `/guided/step-6` | step-5→step-5, step-3b→step-5 |
| `/guided/step-5` | `/guided/step-7` | step-4→step-6, step-6→step-7 |
| `/guided/step-6` | `/guided/step-8` | step-5→step-7 |

### Implementation Per File

**File**: `app/[locale]/guided/step-2/page.tsx`

```typescript
// Change: router.push(`/guided/step-2b?projectId=${projectId}`)
// To:     router.push(`/guided/step-3?projectId=${projectId}`)
```

**File**: `app/[locale]/guided/step-3/page.tsx` (was step-2b)

```typescript
// Change: router.push(`/guided/step-3?projectId=${projectId}`)
// To:     router.push(`/guided/step-4?projectId=${projectId}`)

// Change: Back link to step-2
// Keep:   router.push(`/guided/step-2?projectId=${projectId}`)
```

**File**: `app/[locale]/guided/step-4/page.tsx` (was step-3)

```typescript
// Change: router.push(`/guided/step-3b?projectId=${projectId}`)
// To:     router.push(`/guided/step-5?projectId=${projectId}`)

// Change: router.push(`/guided/step-4?projectId=${projectId}`)
// To:     router.push(`/guided/step-6?projectId=${projectId}`)

// Change: Back link
// From:   router.push(`/guided/step-2b?projectId=${projectId}`)
// To:     router.push(`/guided/step-3?projectId=${projectId}`)
```

**File**: `app/[locale]/guided/step-5/page.tsx` (was step-3b)

```typescript
// Change: router.push(`/guided/step-4?projectId=${projectId}`)
// To:     router.push(`/guided/step-6?projectId=${projectId}`)

// Change: Back link
// From:   router.push(`/guided/step-3?projectId=${projectId}`)
// To:     router.push(`/guided/step-4?projectId=${projectId}`)
```

**File**: `app/[locale]/guided/step-6/page.tsx` (was step-4)

```typescript
// Change: router.push(`/guided/step-5?projectId=${projectId}`)
// To:     router.push(`/guided/step-7?projectId=${projectId}`)

// Change: Back link
// From:   router.push(`/guided/step-3b?projectId=${projectId}`)
// To:     router.push(`/guided/step-5?projectId=${projectId}`)
```

**File**: `app/[locale]/guided/step-7/page.tsx` (was step-5)

```typescript
// Change: router.push(`/guided/step-6?projectId=${projectId}`)
// To:     router.push(`/guided/step-8?projectId=${projectId}`)

// Change: Back link
// From:   router.push(`/guided/step-4?projectId=${projectId}`)
// To:     router.push(`/guided/step-6?projectId=${projectId}`)
```

**File**: `app/[locale]/guided/step-8/page.tsx` (was step-6)

```typescript
// Change: Back link
// From:   router.push(`/guided/step-5?projectId=${projectId}`)
// To:     router.push(`/guided/step-7?projectId=${projectId}`)
```

### Complete Navigation Link Updates Summary

| Step (New) | Forward Nav | Back Nav |
|------------|-------------|----------|
| step-2 | → step-3 (was step-2b) | ← step-1 |
| step-3 | → step-4 (was step-3) | ← step-2 |
| step-4 | → step-5 OR step-6 | ← step-3 |
| step-5 | → step-6 | ← step-4 |
| step-6 | → step-7 | ← step-5 |
| step-7 | → step-8 | ← step-6 |
| step-8 | (end) | ← step-7 |

### QA Checklist

```bash
# Verify no old step references remain
grep -r "step-2b\|step-3b" --include="*.tsx" app/[locale]/guided/

# Should return empty (no matches)
```

- [ ] step-2 navigates to step-3
- [ ] step-3 navigates to step-4
- [ ] step-4 navigates to step-5 or step-6
- [ ] step-5 navigates to step-6
- [ ] step-6 navigates to step-7
- [ ] step-7 navigates to step-8
- [ ] All back links correct

---

## 📋 Task 3: Update StepHeader Component (1.5 hours)

### Objective

Update StepHeader to show 8 total steps instead of 6, including progress calculation and emoji mapping.

### Current Location

**File**: `components/shared/step-header.tsx`

### ⚠️ CRITICAL: Current Code Analysis

The StepHeader component does **NOT** have a `totalSteps` prop. It has **hardcoded values** that must be updated directly:

**Current Props Interface** (lines 16-22):
```typescript
interface StepHeaderProps {
  currentStep: number;
  title?: string;
  subtitle?: string;
  totalDuration?: string;
  backHref: string;
}
```

**Note**: No `totalSteps` prop exists - we update hardcoded values instead.

### Implementation - THREE Changes Required

#### Change 1: Progress Calculation (Line 32)

```typescript
// BEFORE (line 32):
const progressValue = (currentStep / 6) * 100;

// AFTER:
const progressValue = (currentStep / 8) * 100;
```

#### Change 2: Step Number Array (Line 58)

```typescript
// BEFORE (line 58):
{[1, 2, 3, 4, 5, 6].map((num) => (

// AFTER:
{[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
```

#### Change 3: Emoji Mapping (Lines 72-77)

**BEFORE**:
```typescript
{num === 1 && "📝"}
{num === 2 && "✍️"}
{num === 3 && "🎨"}
{num === 4 && "🎵"}
{num === 5 && "✨"}
{num === 6 && "🎬"}
```

**AFTER** (must update to match new step meanings):
```typescript
{num === 1 && "📝"}  {/* Emotional Foundation */}
{num === 2 && "✍️"}  {/* The Story */}
{num === 3 && "🎨"}  {/* Visual Style (was step-2b) */}
{num === 4 && "🖼️"}  {/* Visual Design (was step-3) */}
{num === 5 && "🎤"}  {/* Narration (was step-3b) */}
{num === 6 && "🎵"}  {/* Sound Design (was step-4) */}
{num === 7 && "✨"}  {/* Final Review (was step-5) */}
{num === 8 && "🎬"}  {/* Premiere Night (was step-6) */}
```

### Complete Updated StepHeader Section (Lines 58-80)

Replace the entire step indicator section:

```typescript
<div className="flex justify-between text-xs text-gray-400">
  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
    <span key={num} className="flex items-center gap-1">
      <div
        className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs ${
          num <= currentStep ? "text-white" : "text-gray-400"
        }`}
        style={{
          backgroundColor: num <= currentStep ? "#0d7ff2" : "#314d68",
        }}
      >
        {num}
      </div>
      {num === currentStep && (
        <span className="hidden sm:inline">
          {num === 1 && "📝"}
          {num === 2 && "✍️"}
          {num === 3 && "🎨"}
          {num === 4 && "🖼️"}
          {num === 5 && "🎤"}
          {num === 6 && "🎵"}
          {num === 7 && "✨"}
          {num === 8 && "🎬"}
        </span>
      )}
    </span>
  ))}
</div>
```

### Emoji Mapping Reference

| Step | Emoji | Description | Original Step |
|------|-------|-------------|---------------|
| 1 | 📝 | Emotional Foundation | step-1 |
| 2 | ✍️ | The Story | step-2 |
| 3 | 🎨 | Visual Style | step-2b |
| 4 | 🖼️ | Visual Design | step-3 |
| 5 | 🎤 | Narration | step-3b |
| 6 | 🎵 | Sound Design | step-4 |
| 7 | ✨ | Final Review | step-5 |
| 8 | 🎬 | Premiere Night | step-6 |

### Update Each Step Page

Each step page needs to pass the correct step number:

| File | Current | New |
|------|---------|-----|
| step-1/page.tsx | `currentStep={1}` | `currentStep={1}` |
| step-2/page.tsx | `currentStep={2}` | `currentStep={2}` |
| step-3/page.tsx | `currentStep={2}` (was 2b) | `currentStep={3}` |
| step-4/page.tsx | `currentStep={3}` | `currentStep={4}` |
| step-5/page.tsx | `currentStep={3}` (was 3b) | `currentStep={5}` |
| step-6/page.tsx | `currentStep={4}` | `currentStep={6}` |
| step-7/page.tsx | `currentStep={5}` | `currentStep={7}` |
| step-8/page.tsx | `currentStep={6}` | `currentStep={8}` |

### QA Checklist

```bash
# TypeScript check
npx tsc --noEmit components/shared/step-header.tsx

# Biome check
npx @biomejs/biome check --write components/shared/step-header.tsx
```

- [ ] Line 32: Progress calculation uses `/8` not `/6`
- [ ] Line 58: Array is `[1, 2, 3, 4, 5, 6, 7, 8]`
- [ ] Lines 72-79: All 8 emojis present with correct mapping
- [ ] StepHeader shows "Step X of 8" visually
- [ ] Each step page shows correct number
- [ ] Progress indicator accurate (step 4 = 50%)

---

## 📋 Task 4: Update Progress Bar Calculations (0.5 hours)

### Objective

Update any progress bar calculations that reference step counts.

### Search for Progress References

```bash
grep -r "progress\|totalSteps\|numSteps\|stepCount" --include="*.tsx" --include="*.ts" app/ components/
```

### Implementation

Update any hardcoded `6` to `8`:

```typescript
// Change: const progress = (currentStep / 6) * 100;
// To:     const progress = (currentStep / 8) * 100;

// Or use the constant:
const TOTAL_STEPS = 8;
const progress = (currentStep / TOTAL_STEPS) * 100;
```

### QA Checklist

- [ ] Progress bar shows correct percentage
- [ ] Step 4 shows 50% (4/8)
- [ ] Step 8 shows 100%

---

## 📋 Task 5: Update i18n Namespaces (1.5 hours)

### Objective

Rename translation namespaces to match new step numbers.

### Namespace Mapping

| Old Namespace | New Namespace |
|---------------|---------------|
| `guided_step2b` | `guided_step3` |
| `guided_step3` | `guided_step4` |
| `guided_step3b` | `guided_step5` |
| `guided_step4` | `guided_step6` |
| `guided_step5` | `guided_step7` |
| `guided_step6` | `guided_step8` |

### Implementation

**File**: `messages/en.json` (and all language files)

```json
{
  "guided_step1": { ... },
  "guided_step2": { ... },
  "guided_step3": {
    // Was guided_step2b
    "title": "Visual Style",
    // ... rest of translations
  },
  "guided_step4": {
    // Was guided_step3
    "title": "Visual Design",
    // ... rest of translations
  },
  "guided_step5": {
    // Was guided_step3b
    "title": "The Narration",
    // ... rest of translations
  },
  "guided_step6": {
    // Was guided_step4
    "title": "Sound Design",
    // ... rest of translations
  },
  "guided_step7": {
    // Was guided_step5
    "title": "Final Review",
    // ... rest of translations
  },
  "guided_step8": {
    // Was guided_step6
    "title": "Premiere Night",
    // ... rest of translations
  }
}
```

### Update useTranslations Calls

Each step page needs to use the correct namespace:

```typescript
// step-3/page.tsx (was step-2b)
// Change: const t = useTranslations("guided_step2b");
// To:     const t = useTranslations("guided_step3");
```

### Run Translation Script

```bash
pnpm translate
```

### QA Checklist

- [ ] All namespaces renamed in en.json
- [ ] Each step page uses correct namespace
- [ ] `pnpm translate` succeeds
- [ ] All languages have updated translations

---

## 📋 Task 6: Add Redirects for Old URLs (1 hour)

### Objective

Add redirects from old URLs to new URLs for:
- Active user sessions with old URLs
- Bookmarked URLs
- Shared links

### Implementation

**File**: `middleware.ts` (modify)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Step redirects for migration
const STEP_REDIRECTS: Record<string, string> = {
  "/guided/step-2b": "/guided/step-3",
  "/guided/step-3b": "/guided/step-5",
  // Note: step-3, step-4, step-5, step-6 need context-aware redirects
  // since they moved positions
};

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Check for old step URLs
  for (const [oldPath, newPath] of Object.entries(STEP_REDIRECTS)) {
    if (pathname.startsWith(oldPath)) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.replace(oldPath, newPath);
      // Preserve query params (projectId)
      return NextResponse.redirect(url, { status: 308 }); // Permanent redirect
    }
  }
  
  // ... rest of existing middleware
}

export const config = {
  matcher: ["/guided/:path*"],
};
```

### Alternative: Next.js Config Redirects (Recommended)

**File**: `next.config.mjs` (ADD new `redirects()` function - does not exist currently)

```javascript
const nextConfig = {
  // ... existing config
  
  // ADD THIS NEW FUNCTION (not modifying existing - it doesn't exist)
  async redirects() {
    return [
      {
        source: "/guided/step-2b",
        destination: "/guided/step-3",
        permanent: true,
      },
      {
        source: "/guided/step-3b",
        destination: "/guided/step-5",
        permanent: true,
      },
      {
        source: "/:locale/guided/step-2b",
        destination: "/:locale/guided/step-3",
        permanent: true,
      },
      {
        source: "/:locale/guided/step-3b",
        destination: "/:locale/guided/step-5",
        permanent: true,
      },
    ];
  },
};
```

### QA Checklist

- [ ] `/guided/step-2b?projectId=xxx` → `/guided/step-3?projectId=xxx`
- [ ] `/guided/step-3b?projectId=xxx` → `/guided/step-5?projectId=xxx`
- [ ] Query params preserved
- [ ] Locale prefix preserved (e.g., `/fr/guided/step-2b`)

---

## 📋 Task 7: Update Test Files (1 hour)

### Objective

Rename and update all test files that reference old step names.

### Test Files to Rename

| Old File | New File | Description |
|----------|----------|-------------|
| `guided-step-2b-convex.test.tsx` | `guided-step-3-convex.test.tsx` | Visual Style tests |
| `guided-step-3-convex.test.tsx` | `guided-step-4-convex.test.tsx` | Visual Design tests |
| `guided-step-3b-convex.test.tsx` | `guided-step-5-convex.test.tsx` | Narration tests |
| `guided-step-4-convex.test.tsx` | `guided-step-6-convex.test.tsx` | Sound Design tests |
| `guided-step-6-convex.test.tsx` | `guided-step-8-convex.test.tsx` | Premiere Night tests |

**Note**: Files `guided-step-1-convex.test.tsx` stays unchanged. No test files exist for step-2, step-5 (after rename: step-7).

### Test Files to Modify (Content Updates)

| File | Changes Needed |
|------|----------------|
| `navigation-projectid.test.tsx` | Update ~34 step path references |
| All renamed test files above | Update describe blocks, navigation URLs |

### Rename Commands

```bash
cd __tests__/integration/

# Rename in descending order
mv guided-step-6-convex.test.tsx guided-step-8-convex.test.tsx
mv guided-step-4-convex.test.tsx guided-step-6-convex.test.tsx
mv guided-step-3b-convex.test.tsx guided-step-5-convex.test.tsx
mv guided-step-3-convex.test.tsx guided-step-4-convex.test.tsx
mv guided-step-2b-convex.test.tsx guided-step-3-convex.test.tsx
```

### Update Test Content

Each test file needs internal updates:

**File**: `__tests__/integration/guided-step-3-convex.test.tsx` (was step-2b)

```typescript
// Update describe block
describe("Step 3: Convex Visual Style Integration (Critical Tests)", () => {
  // ...
  
  // Update navigation URLs
  it("should validate projectId is included in navigation URL", () => {
    const projectId = "proj_abc123";
    // Change: const expectedUrl = `/guided/step-3?projectId=${projectId}`;
    // To:     const expectedUrl = `/guided/step-4?projectId=${projectId}`;
    const expectedUrl = `/guided/step-4?projectId=${projectId}`;
  });
});
```

### Update navigation-projectid.test.tsx

This file has extensive step references that need updating:

```typescript
// Update all step-2b → step-3
// Update all step-3 → step-4
// Update all step-3b → step-5
// Update all step-4 → step-6
// Update all step-5 → step-7
// Update all step-6 → step-8
```

### Update E2E Test

**File**: `tests/e2e/guided-flow.ts`

Update step references in the E2E test script (only ~1 reference found).

### QA Checklist

```bash
# Run all integration tests
npx vitest run __tests__/integration/

# Verify no old step references
grep -r "step-2b\|step-3b" __tests__/
```

- [ ] All test files renamed
- [ ] Internal URLs updated
- [ ] All tests pass
- [ ] No old step references remain

---

## 📋 Task 8: Update Documentation (1.5 hours)

### Objective

Update all documentation that references step names.

### Files to Update

```bash
grep -r "step-2b\|step-3b\|Step 2b\|Step 3b" docs/
```

### ⚠️ CRITICAL: 12 Files Found (Not 3!)

Actual grep results show **12 documentation files** need updating:

### Documentation Files - HIGH Priority

| File | Updates Needed |
|------|----------------|
| `docs/Understanding/guided-flow-description.md` | Update step listing |
| `docs/Guides/translation-implementation-strategy.md` | Update namespace refs |
| `docs/Understanding/credit-system-specification.md` | Update step references |

### Documentation Files - MEDIUM Priority

| File | Updates Needed |
|------|----------------|
| `docs/Ongoing/sprint-production-ready-step-by-step.md` | Update step references |
| `docs/Ongoing/sprint-guided-flow-convex-migration.md` | Update step references |

### Documentation Files - LOW Priority (Sprint Todo Docs)

| File | Updates Needed |
|------|----------------|
| `docs/QA/typescript-errors-analysis.md` | Update step references |
| `docs/MVP/Todo/sprint-20-fix-duplicate-narration-bug.md` | Update step references |
| `docs/MVP/Todo/sprint-16-skip-to-final-video.md` | Update step references |
| `docs/MVP/Todo/sprint-18-narration-generation-fix.md` | Update step references |
| `docs/MVP/Todo/Typescript-errors-to-solve.md` | Update step references |
| `docs/MVP/Todo/architectural-improvements-sprint-21-12-2025.md` | Update step references |

### Also Check

| File | Updates Needed |
|------|----------------|
| `README.md` | Check for any step references |

### Search and Replace Commands

```bash
# Find all occurrences
grep -rn "step-2b\|step-3b" docs/

# Replace step-2b → step-3
find docs/ -type f -name "*.md" -exec sed -i 's/step-2b/step-3/g' {} \;

# Replace step-3b → step-5
find docs/ -type f -name "*.md" -exec sed -i 's/step-3b/step-5/g' {} \;

# Also update Step 2b and Step 3b text references
find docs/ -type f -name "*.md" -exec sed -i 's/Step 2b/Step 3/g' {} \;
find docs/ -type f -name "*.md" -exec sed -i 's/Step 3b/Step 5/g' {} \;
```

### QA Checklist

```bash
# Verify no old references remain
grep -rn "step-2b\|step-3b\|Step 2b\|Step 3b" docs/
# Should return empty
```

- [ ] All 12 files updated
- [ ] No "2b" or "3b" references in docs
- [ ] Step count updated to 8 where mentioned
- [ ] Flow diagrams updated (if any)
- [ ] README.md checked and updated if needed

---

## 📋 Task 9: Testing All Navigation Paths (1 hour)

### Objective

Verify all navigation paths work correctly.

### Manual Test Matrix

| From | To | Test |
|------|-----|------|
| Dashboard | Step 1 | Create new project |
| Step 1 | Step 2 | Continue button |
| Step 2 | Step 3 | Continue button |
| Step 3 | Step 4 | Continue button |
| Step 4 | Step 5 | Narration button |
| Step 4 | Step 6 | Continue button |
| Step 5 | Step 6 | Continue button |
| Step 6 | Step 7 | Continue button |
| Step 7 | Step 8 | Continue button |

### Back Navigation Test

| From | To | Test |
|------|-----|------|
| Step 3 | Step 2 | Back button |
| Step 4 | Step 3 | Back button |
| Step 5 | Step 4 | Back button |
| Step 6 | Step 5 | Back button |
| Step 7 | Step 6 | Back button |
| Step 8 | Step 7 | Back button |

### Redirect Test

| Old URL | Expected New URL |
|---------|------------------|
| `/guided/step-2b?projectId=xxx` | `/guided/step-3?projectId=xxx` |
| `/guided/step-3b?projectId=xxx` | `/guided/step-5?projectId=xxx` |

### QA Checklist

- [ ] All forward navigation works
- [ ] All back navigation works
- [ ] projectId preserved in all URLs
- [ ] Redirects work for old URLs
- [ ] No 404 errors

---

## 📋 Task 10: QA & Deploy (0.5 hours)

### Final QA Checklist

```bash
# 1. TypeScript check all modified files
npx tsc --noEmit

# 2. Biome check
npx @biomejs/biome check --write .

# 3. Run all tests
npx vitest run

# 4. Verify no old step references
grep -r "step-2b\|step-3b" --include="*.tsx" --include="*.ts" --include="*.json" .

# 5. Deploy
npx convex dev --once
```

### Deployment Checklist

- [ ] All TypeScript errors resolved
- [ ] All Biome errors resolved
- [ ] All tests pass
- [ ] No old step references remain
- [ ] Convex deployed (if any schema changes)
- [ ] Vercel preview works

---

## 🎯 Success Criteria

- ✅ All steps are sequential (1-8, no "b" suffixes)
- ✅ Navigation works forward and backward
- ✅ Progress bar shows correct X of 8
- ✅ Old URLs redirect to new URLs
- ✅ All tests pass
- ✅ i18n namespaces updated
- ✅ Documentation updated

---

## ⚠️ Risk Mitigation

### Active User Sessions

**Risk**: Users with old URLs in their session may get 404.

**Mitigation**: 
1. Permanent redirects (308) for old URLs
2. Preserve query params (projectId)
3. Grace period before removing redirects

### Bookmarked URLs

**Risk**: Users with bookmarked step-2b or step-3b URLs.

**Mitigation**: Permanent redirects will handle this transparently.

### Deployment Order

**Recommendation**: Deploy during low-traffic period.

---

## 📁 Files Created/Modified Summary

### Directories to Rename (Task 1)

| Current | New | Description |
|---------|-----|-------------|
| `app/[locale]/guided/step-2b/` | `step-3/` | Visual Style |
| `app/[locale]/guided/step-3/` | `step-4/` | Visual Design |
| `app/[locale]/guided/step-3b/` | `step-5/` | Narration |
| `app/[locale]/guided/step-4/` | `step-6/` | Sound Design |
| `app/[locale]/guided/step-5/` | `step-7/` | Final Review |
| `app/[locale]/guided/step-6/` | `step-8/` | Premiere Night |

### Files to Modify

| File | Action | Task |
|------|--------|------|
| `app/[locale]/guided/step-2/page.tsx` | Update nav links | Task 2 |
| `app/[locale]/guided/step-3/page.tsx` | Update nav links + currentStep | Tasks 2, 3 |
| `app/[locale]/guided/step-4/page.tsx` | Update nav links + currentStep | Tasks 2, 3 |
| `app/[locale]/guided/step-5/page.tsx` | Update nav links + currentStep | Tasks 2, 3 |
| `app/[locale]/guided/step-6/page.tsx` | Update nav links + currentStep | Tasks 2, 3 |
| `app/[locale]/guided/step-7/page.tsx` | Update nav links + currentStep | Tasks 2, 3 |
| `app/[locale]/guided/step-8/page.tsx` | Update nav links + currentStep | Tasks 2, 3 |
| `components/shared/step-header.tsx` | Update /6→/8, step array, emojis (3 changes) | Task 3 |
| `messages/en.json` | Rename namespaces | Task 5 |
| `messages/fr.json` | Rename namespaces | Task 5 |
| `messages/de.json` | Rename namespaces | Task 5 |
| `messages/it.json` | Rename namespaces | Task 5 |
| `messages/es.json` | Rename namespaces | Task 5 |
| `messages/pt.json` | Rename namespaces | Task 5 |
| `messages/ru.json` | Rename namespaces | Task 5 |
| `middleware.ts` OR `next.config.mjs` | Add redirects | Task 6 |
| `__tests__/integration/guided-step-*` | Rename + update content | Task 7 |
| `__tests__/integration/navigation-projectid.test.tsx` | Update ~34 step refs | Task 7 |
| `tests/e2e/guided-flow.ts` | Update step refs (~1 ref) | Task 7 |
| `docs/Understanding/guided-flow-description.md` | Update step listing | Task 8 |
| `docs/Guides/translation-implementation-strategy.md` | Update namespace refs | Task 8 |
| `docs/Understanding/credit-system-specification.md` | Update step refs | Task 8 |
| `docs/Ongoing/sprint-production-ready-step-by-step.md` | Update step refs | Task 8 |
| `docs/Ongoing/sprint-guided-flow-convex-migration.md` | Update step refs | Task 8 |
| `docs/QA/typescript-errors-analysis.md` | Update step refs | Task 8 |
| `docs/MVP/Todo/sprint-20-fix-duplicate-narration-bug.md` | Update step refs | Task 8 |
| `docs/MVP/Todo/sprint-16-skip-to-final-video.md` | Update step refs | Task 8 |
| `docs/MVP/Todo/sprint-18-narration-generation-fix.md` | Update step refs | Task 8 |
| `docs/MVP/Todo/Typescript-errors-to-solve.md` | Update step refs | Task 8 |
| `docs/MVP/Todo/architectural-improvements-sprint-21-12-2025.md` | Update step refs | Task 8 |

**Total Directories Renamed**: 6  
**Total Files Modified**: ~35+ (including 12 doc files)

### Key Implementation References

The implementation follows the patterns defined in:
- **Rename Order**: `architectural-improvements-sprint-21-12-2025.md` lines 311-331
- **i18n Namespaces**: `architectural-improvements-sprint-21-12-2025.md` lines 337-341
- **Migration Risk & Redirects**: `architectural-improvements-sprint-21-12-2025.md` lines 343-357

---

## 📝 Accuracy Review Notes (January 9, 2026)

This plan was reviewed against the actual codebase and the following corrections were made:

### Corrections Applied

1. **Task 3 - StepHeader**: Component does NOT have `totalSteps` prop. Updated to document the 3 hardcoded changes required (progress calc, array, emojis)

2. **Task 3 - Emoji Mapping**: Added complete emoji mapping for 8 steps with correct step-to-meaning associations

3. **Task 7 - Test Count**: navigation-projectid.test.tsx has ~34 references (not ~50)

4. **Task 7 - E2E Test**: Only ~1 reference in guided-flow.ts (not many)

5. **Task 8 - Documentation**: Expanded from 3 files to **12 files** that actually contain step-2b/step-3b references

6. **Time Estimates**: Updated total from 9.5h to **11h** based on accurate file counts

7. **Files Summary**: Updated from ~25+ to ~35+ files including all 12 documentation files

### Verified Accurate

- ✅ Directory structure (8 step folders confirmed)
- ✅ Rename order (descending to avoid conflicts)
- ✅ i18n namespace structure in en.json
- ✅ Test file locations
- ✅ StepHeader component location

---

**Document Version**: 1.1  
**Created**: December 21, 2025  
**Updated**: January 9, 2026 (Accuracy Review)  
**Author**: MyShortReel Development Team  
**Status**: 📋 PLANNING - Ready for Implementation (Verified Accurate)

