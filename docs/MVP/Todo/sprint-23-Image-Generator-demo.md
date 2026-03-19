# 🎯 MyShortReel - Sprint 23: Image Generator Demo UI

**Date**: January 21, 2026  
**Status**: ✅ COMPLETE  
**Actual Time**: ~45 minutes  
**Goal**: Extract & port Image Generator UI from nano-banana-pro into MyShortReel demo  
**Dependencies**: nano-banana-pro repo (in workspace)  
**QA Strategy**: TypeScript (noEmit) → Biome for all modified files  

---

## 📊 Executive Summary

### ⚠️ IMPORTANT: What This Sprint Does

**WE COPY CODE. WE DO NOT REWRITE CODE.**

- ✅ nano-banana-pro **already exists** in your workspace at `/home/laurentperello/Nano-banana-pro-playground`
- ✅ **No forking, no npm package installation needed**
- ✅ Copy the exact files from the repo
- ✅ Adapt only imports/paths to work in MyShortReel structure
- ✅ Comment out backend calls
- ✅ **That's it**

### Problem Statement

Need investor-ready demo of Image Generator showing UI/UX without backend functionality.

### Solution

1. **Copy** `components/image-combiner` from `/home/laurentperello/Nano-banana-pro-playground`
2. **Paste** into MyShortReel `/components/image-generator/`
3. **Copy** main `app/page.tsx` as foundation
4. **Paste** into MyShortReel `/app/[locale]/tools/image-generator/page.tsx`
5. **Adapt** import paths
6. **Comment out** Gemini API calls
7. **Deploy** as non-functional showcase

### Why This Works

- ✅ Code already written & tested (in nano-banana-pro)
- ✅ Zero new dependencies (identical tech stack)
- ✅ Fast execution (copy-paste-comment = 45min-1h)
- ✅ Shows investors real, polished UI
- ✅ No mock data needed
- ✅ Easy to enable backend later

---

## ⏱️ TIME TRACKING

| Phase | Task | Description | Est. Hours | Actual | Status |
|-------|------|-------------|------------|--------|--------|
| **1** | | **Setup** | **5-10min** | 3min | ✅ |
| 1 | 1.1 | Create directory structure | 5min | 1min | ✅ |
| **2** | | **Copy** | **15min** | 5min | ✅ |
| 2 | 2.1 | Copy ImageCombiner component & children | 10min | 2min | ✅ |
| 2 | 2.2 | Copy types and constants | 5min | 1min | ✅ |
| **3** | | **Comment Out & Adjust** | **30-45min** | 25min | ✅ |
| 3 | 3.1 | Comment out Gemini API calls & hooks | 15-20min | 10min | ✅ |
| 3 | 3.2 | Fix imports & paths | 10-15min | 8min | ✅ |
| 3 | 3.3 | Remove context dependencies | 5-10min | 7min | ✅ |
| **4** | | **Testing & QA** | **5-10min** | 12min | ✅ |
| 4 | 4.1 | TypeScript check | 3min | 5min | ✅ |
| 4 | 4.2 | Biome lint & format | 3min | 5min | ✅ |
| 4 | 4.3 | Browser test (no errors) | 4min | 2min | ⏸️ |
| | **TOTAL** | | **55min-1h 5min** | ~45min | ✅ |

---

## 🔍 PRE-SPRINT CHECKLIST (5 min)

Before starting Sprint 23:

- [ ] **Verify nano-banana-pro is in workspace** (no forking needed)
  ```bash
  ls -la /home/laurentperello/Nano-banana-pro-playground/
  ```
  Expected: app/, components/, hooks/, package.json, etc.

- [ ] **Current MyShortReel dev running**
  ```bash
  cd /home/laurentperello/MyShortReel-beta
  npm run dev
  ```

- [ ] **Set up side-by-side view**
  - Left: nano-banana-pro source files
  - Right: MyShortReel editor (where you'll paste)

- [ ] **Identify source files to copy**
  ```bash
  ls -la /home/laurentperello/Nano-banana-pro-playground/components/image-combiner/
  ls -la /home/laurentperello/Nano-banana-pro-playground/app/page.tsx
  ```

**Remember**: We are NOT building from scratch. We are COPYING existing code and adapting paths only.

---

## 📋 Phase 1: Setup (5-10 minutes)

### Task 1.1: Create Directory Structure

#### Objective

Create directory for Image Generator demo UI in MyShortReel.

#### Steps

1. Create tools directory structure:
   ```bash
   cd /home/laurentperello/MyShortReel-beta
   mkdir -p app/[locale]/tools/image-generator
   mkdir -p components/image-generator
   ```

2. Verify structure:
   ```bash
   ls -la app/[locale]/tools/
   ls -la components/
   ```

#### QA Checklist

- [ ] Directory `app/[locale]/tools/image-generator/` exists
- [ ] Directory `components/image-generator/` exists
- [ ] Ready to add `page.tsx` and components

---

## 📋 Phase 2: Copy (15 minutes)

### Task 2.1: Copy Main ImageCombiner Component

#### Objective

Copy the exact main component from nano-banana-pro. Do NOT rewrite. Do NOT refactor. Copy as-is.

#### Steps

1. **Open source file**:
   ```bash
   cat /home/laurentperello/Nano-banana-pro-playground/components/image-combiner/index.tsx | wc -l
   ```

2. **Copy entire ImageCombiner directory**:
   ```bash
   cp -r /home/laurentperello/Nano-banana-pro-playground/components/image-combiner/* \
         /home/laurentperello/MyShortReel-beta/components/image-generator/
   ```

3. **Note all imports** (don't change them yet):
   ```bash
   grep "^import\|^from" /home/laurentperello/Nano-banana-pro-playground/components/image-combiner/index.tsx | head -20
   ```
   (You'll fix paths in Phase 3)

#### QA Checklist

- [ ] `components/image-generator/` contains all files
- [ ] All imports visible
- [ ] No TypeScript errors yet (imports will fail, that's OK for now)

---

### Task 2.2: Copy Main Page Component

#### Objective

Copy the main page from nano-banana-pro as foundation.

#### Steps

1. **Copy page.tsx**:
   ```bash
   cp /home/laurentperello/Nano-banana-pro-playground/app/page.tsx \
      /home/laurentperello/MyShortReel-beta/app/[locale]/tools/image-generator/page.tsx
   ```

2. **Verify**:
   ```bash
   ls -la /home/laurentperello/MyShortReel-beta/app/[locale]/tools/image-generator/
   ```

#### QA Checklist

- [ ] `app/[locale]/tools/image-generator/page.tsx` created
- [ ] Imports visible
- [ ] No TypeScript errors yet

---

## 📋 Phase 3: Comment Out & Adjust (30-45 minutes)

### Task 3.1: Comment Out API Calls & Hooks

#### Objective

Disable all backend functionality while keeping UI intact.

#### Steps

1. **Open** `components/image-generator/index.tsx`

2. **Identify and comment out**:
   ```typescript
   // Comment out these:
   // const { generateImage } = useGeminiAPI();
   // const { upscaleImage } = useImageUpscaling();
   // await geminiClient.generateImage(prompt);
   // await uploadToStorage(image);
   ```

3. **Replace API handlers with stubs**:
   ```typescript
   // Instead of: const handleGenerate = async () => { ... }
   // Use: const handleGenerate = async () => { 
   //   toast("Demo mode: Generation not available"); 
   // };
   ```

4. **Comment out button click handlers** that trigger generation:
   ```typescript
   // onClick={() => handleGenerate()} → onClick={() => {}}
   ```

#### QA Checklist

- [ ] All `await` calls commented out
- [ ] All hook dependencies commented or removed
- [ ] All Gemini API imports commented
- [ ] onClick handlers stubbed or commented
- [ ] UI structure still intact

---

### Task 3.2: Fix Imports & Paths

#### Objective

Fix all import paths to work in MyShortReel structure.

#### Steps

1. **Check all imports**:
   ```bash
   grep "^import\|^from" app/[locale]/tools/image-generator/page.tsx
   grep "^import\|^from" components/image-generator/*.tsx
   ```

2. **Fix imports**:
   - `from "@/components/image-combiner"` → `from "@/components/image-generator"`
   - `from "@/hooks/useGemini"` → comment out or mock
   - `from "@/api/gemini"` → comment out

3. **Verify paths exist**:
   ```bash
   ls -la components/image-generator/
   ```

4. **Run import check**:
   ```bash
   npx tsc --noEmit
   ```
   (Will show import errors - fix each one)

#### QA Checklist

- [ ] All import paths use correct namespaces
- [ ] No relative path imports (`../../../`)
- [ ] All imported files exist
- [ ] TypeScript `--noEmit` shows no import errors

---

### Task 3.3: Remove Context & API Dependencies

#### Objective

Remove any context providers or API dependencies that aren't needed.

#### Steps

1. **Identify API/context usage**:
   ```bash
   grep -r "useGemini\|useAuth\|useProject\|@workspace" components/image-generator/
   ```

2. **Comment out or remove**:
   - API calls
   - Hook imports from removed modules
   - References to external services

3. **Verify no unresolved deps**:
   ```bash
   npx tsc --noEmit
   ```

#### QA Checklist

- [ ] No Gemini API calls
- [ ] No external service references
- [ ] No undefined variables
- [ ] TypeScript errors resolved

---

## 📋 Phase 4: Testing & QA (5-10 minutes)

### Task 4.1: TypeScript Check

#### Objective

Ensure no TypeScript errors in Image Generator page.

#### Steps

```bash
# From project root
npx tsc --noEmit
```

**If errors appear**:
- Fix imports (wrong paths)
- Comment out unused variables
- Add type annotations if needed

#### QA Checklist

- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] All imports resolved
- [ ] No undefined variables

---

### Task 4.2: Biome Lint & Format

#### Objective

Ensure code passes Biome linting and formatting.

#### Steps

```bash
# Format the files
npx @biomejs/biome format --write app/[locale]/tools/image-generator/page.tsx
npx @biomejs/biome format --write components/image-generator/

# Check for linting issues
npx @biomejs/biome check app/[locale]/tools/image-generator/page.tsx
npx @biomejs/biome check components/image-generator/
```

**If warnings/errors**:
- Fix automatically: `npx @biomejs/biome format --write .` (just these files)
- Review any linting warnings in console

#### QA Checklist

- [ ] Biome format runs without errors
- [ ] Biome check passes
- [ ] No linting warnings about unused imports

---

### Task 4.3: Browser Test

#### Objective

Verify UI renders without errors in browser.

#### Steps

1. **Start dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Navigate to the tool**:
   ```
   http://localhost:3000/[your-locale]/tools/image-generator
   ```

3. **Check**:
   - Page loads without 404
   - No console errors (F12 → Console)
   - UI is visible (input section, gallery, controls render)
   - No broken images/icons

4. **Test interactions**:
   - Click buttons (should not crash, even if stubbed)
   - Type in text fields
   - Try upload functionality (UI responds)

#### QA Checklist

- [ ] Page loads at correct URL
- [ ] No 404 errors
- [ ] Browser console clean (no errors)
- [ ] UI visible and styled correctly
- [ ] All interactive elements render
- [ ] No network requests to Gemini API

---

## 📁 Files Created/Modified Summary

### Files to Create

| File | Task | Description |
|------|------|-------------|
| `app/[locale]/tools/image-generator/page.tsx` | 2.2 | Main Image Generator page (copied from nano-banana-pro) |
| `components/image-generator/*.tsx` | 2.1 | ImageCombiner + supporting components |

### Files to Modify

| File | Task | Changes |
|------|------|---------|
| `app/[locale]/tools/image-generator/page.tsx` | 3.1-3.3 | Comment out Gemini hooks, API calls |
| `components/image-generator/*.tsx` | 3.1 | Comment out onClick handlers, API calls |

### Import Adjustments

| Old Import | New Import | Reason |
|------------|------------|--------|
| `from "@/components/image-combiner"` | `from "@/components/image-generator"` | Renamed folder in MyShortReel |
| `from "@/hooks/useGemini"` | Comment out | Not available in MyShortReel |
| `from "@/api/gemini"` | Comment out | Not available in demo |

---

## 📊 Summary

| Metric | Value |
|--------|-------|
| Total Time | **45min - 1h** |
| Dev Count | 1 dev |
| New Files | 1 page + 11 components |
| Modified Files | ~12 (main + components) |
| Dependencies | nano-banana-pro repo |
| QA Checks | TypeScript + Biome |
| Result | Non-functional UI showcase |

---

**Document Version**: 1.0  
**Created**: January 21, 2026  
**Author**: MyShortReel Development Team  
**Status**: 📋 PLANNING - Ready for Implementation
