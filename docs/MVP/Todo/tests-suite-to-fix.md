# Test Suite Fixes Required

**Status**: 📋 TODO  
**Priority**: Low (Pre-existing issues, not blocking Sprint 6)  
**Created**: 2025-11-19  
**Last Updated**: 2025-11-19

---

## Overview

There are **4 pre-existing test files** that fail due to using **Jest syntax** in a **Vitest project**. These tests were written before the project standardized on Vitest and have never been updated.

**Current Test Status**:
- ✅ **137 tests passing** (including 23 new prompts tests from Sprint 6)
- ❌ **4 test files failing** (all due to `jest.mock()` syntax)
- 📊 **Total**: 14 passing test files, 4 failing test files

---

## Failing Test Files

### 1. `__tests__/integration/auth-middleware.test.ts`

**Error**: `ReferenceError: jest is not defined`

**Issue**: Uses `jest.mock()` for mocking modules

**Fix Required**:
- Replace `jest.mock()` with Vitest's `vi.mock()`
- Update mock syntax from `jest.fn()` to `vi.fn()`
- Replace `jest.spyOn()` with `vi.spyOn()`
- Add `import { vi } from 'vitest'` at top of file

---

### 2. `__tests__/integration/auth-pages.test.tsx`

**Error**: `ReferenceError: jest is not defined`

**Issue**: Uses `jest.mock()` for mocking Clerk components

**Fix Required**:
- Replace `jest.mock('@clerk/nextjs')` with `vi.mock('@clerk/nextjs')`
- Update mock functions from `jest.fn()` to `vi.fn()`
- Add `import { vi } from 'vitest'` at top of file

---

### 3. `__tests__/components/dashboard/DashboardHeader.test.tsx`

**Error**: `ReferenceError: jest is not defined`

**Issue**: Uses `jest.mock()` for mocking Clerk hooks

**Fix Required**:
- Replace `jest.mock('@clerk/nextjs')` with `vi.mock('@clerk/nextjs')`
- Update all `jest.fn()` to `vi.fn()`
- Update mock implementations to use Vitest syntax
- Add `import { vi } from 'vitest'` at top of file

---

### 4. `__tests__/components/dashboard/WelcomeHeader.test.tsx`

**Error**: `ReferenceError: jest is not defined`

**Issue**: Uses `jest.mock()` for mocking `@clerk/nextjs`

**Current Code** (example):
```typescript
// Mock Clerk
jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn(),
}));
```

**Fix Required**:
```typescript
import { vi } from 'vitest'

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn(),
}));
```

---

## Complete Migration Guide

### Step-by-Step Fix Process

**For each test file:**

1. **Add Vitest import**:
   ```typescript
   import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
   ```

2. **Replace all `jest.mock()` with `vi.mock()`**:
   ```typescript
   // Before
   jest.mock('@clerk/nextjs', () => ({ ... }))
   
   // After
   vi.mock('@clerk/nextjs', () => ({ ... }))
   ```

3. **Replace all `jest.fn()` with `vi.fn()`**:
   ```typescript
   // Before
   useUser: jest.fn()
   
   // After
   useUser: vi.fn()
   ```

4. **Replace all `jest.spyOn()` with `vi.spyOn()`**:
   ```typescript
   // Before
   jest.spyOn(console, 'error')
   
   // After
   vi.spyOn(console, 'error')
   ```

5. **Update mock assertions**:
   ```typescript
   // Before
   expect(mockFn).toHaveBeenCalledWith(...)
   
   // After (Vitest syntax is the same, just need vi.fn())
   expect(mockFn).toHaveBeenCalledWith(...)
   ```

6. **Update beforeEach/afterEach** (if using mocks):
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks()
   })
   
   afterEach(() => {
     vi.restoreAllMocks()
   })
   ```

---

## Vitest vs Jest Cheat Sheet

| Jest | Vitest |
|------|--------|
| `jest.mock()` | `vi.mock()` |
| `jest.fn()` | `vi.fn()` |
| `jest.spyOn()` | `vi.spyOn()` |
| `jest.clearAllMocks()` | `vi.clearAllMocks()` |
| `jest.restoreAllMocks()` | `vi.restoreAllMocks()` |
| `jest.useFakeTimers()` | `vi.useFakeTimers()` |
| `jest.advanceTimersByTime()` | `vi.advanceTimersByTime()` |

---

## Why This Isn't Blocking Sprint 6

1. **Pre-existing issue**: These tests failed before Sprint 6 started
2. **No impact on new features**: Sprint 6 video generation is unaffected
3. **All new tests pass**: 23 new prompts tests pass (100% success rate)
4. **Core functionality works**: The actual Clerk auth integration works perfectly in the app

---

## Estimated Time to Fix

- **Per file**: 10-15 minutes
- **Total**: ~1 hour for all 4 files
- **Complexity**: Low (simple find-and-replace)

---

## Recommendation

**Fix after Sprint 6 is complete** to maintain focus on video generation features. These are isolated test infrastructure issues that don't affect Sprint 6 deliverables.

---

## Verification After Fix

Run the full test suite:
```bash
npx vitest run
```

Expected outcome:
- ✅ All test files should pass
- ✅ Test count should increase by the number of tests in these 4 files
- ✅ No more `ReferenceError: jest is not defined` errors

---

**Status**: 📋 Documented, Ready for Future Fix  
**Blocker for Sprint 6**: ❌ No  
**Blocker for Production**: ❌ No (tests don't affect runtime)

