# 🎬 Sprint 16: Skip to Final Video (Step 5 Enhancement)

**Date**: December 23, 2025  
**Status**: ✅ COMPLETED  
**Actual Time**: ~35 minutes  
**Estimated Time**: 40 minutes  
**Goal**: Allow users to skip video re-assembly on Step 5 if video already exists  
**Dependencies**: Sprint 8 (Video Assembly), Sprint 11 (Transitions)  
**Mobile Strategy**: **Strictly Mobile-First** per `mobile-first-best-practices.md` 📱  
**Design System**: **shadcn/ui only** per `design-system.md`  
**QA Strategy**: **2-Step QA** - TypeScript (noEmit) → Biome for all files  

---

## 📊 Executive Summary

### Problem Statement

Currently, users are **forced to re-assemble their video** (costing 5 credits) every time they navigate through Step 5 → Step 6, even if:
- The video has already been assembled successfully
- No changes were made to scenes, narration, or transitions

This is frustrating and wasteful for users who just want to:
- View their completed video
- Download or share their video
- Check the final result

### Solution

Add a **"Skip to Final Video"** button on Step 5 (mirroring Step 1's skip pattern) that:
1. Shows when `assemblyStatus === "completed"` AND `finalVideoUrl` exists
2. Navigates directly to Step 6 where the completed video is displayed
3. Is **FREE** (no credits charged)
4. Keeps the "Re-assemble" option available for users who made changes

---

## 🔍 Current Flow Analysis

### Step 1 Skip Pattern (Reference Implementation)

```typescript
// Step 1 — Lines 802-825
{project?.approvedMessageId && (
  <Button onClick={() => router.push(`/guided/step-2b?projectId=${projectId}`)}>
    {tStep1("skip_to_visual_style")}
    <Badge>FREE</Badge>
  </Button>
)}
```

| Element | Implementation |
|---------|----------------|
| **Condition** | `project?.approvedMessageId` exists |
| **Action** | Navigate to `step-2b` (skip story generation) |
| **Cost** | FREE (green badge) |
| **Button text** | "Skip to Visual Style" |
| **Purpose** | Don't regenerate story if already validated |

### Step 5 Current Behavior

| Element | Current State |
|---------|---------------|
| **Navigation** | Always goes to Step 6 |
| **No skip logic** | Forces user through flow |
| **Button** | "Assemble & Render" → Step 6 |

### Step 6 Current Behavior

| assemblyStatus | finalVideoUrl | What Step 6 Shows |
|----------------|---------------|-------------------|
| `"completed"` | ✅ exists | ✅ Video player with download/share |
| `"failed"` | ❌ | Error + Retry button |
| in-progress | ❌ | Progress bar |
| `undefined` | ❌ | "Ready to Assemble" UI |

**Key insight:** Step 6 already correctly handles showing the completed video. The problem is Step 5 doesn't offer a skip option.

---

## 📐 UI Design

### Step 5 Footer — Video Already Assembled

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  ✅  Skip to Final Video                      [FREE]        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  Your video is ready! Go directly to view, download, and share.    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  ✨  Re-assemble with Changes                 [5 credits]   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  Made changes? Re-render your video.                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 5 Footer — No Video Yet (Default)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  ✨  Assemble & Render                        [5 credits]   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  Total duration: 28 seconds                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 5 Footer — Assembly In Progress

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  🔄  View Assembly Progress                   [FREE]        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  Your video is being assembled. Check the progress.                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 5 Footer — Assembly Failed

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  ⚠️  Retry Assembly                           [FREE]        │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  Previous assembly failed. Credits were refunded.                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Plan

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `app/[locale]/guided/step-5/page.tsx` | MODIFY | Add skip button + conditional logic |
| `messages/en.json` | MODIFY | Add i18n strings |

### Task Breakdown

| Task | Description | Est. Time | Status |
|------|-------------|-----------|--------|
| 16.1 | Add state detection logic | 5 min | ✅ |
| 16.2 | Add conditional button rendering | 15 min | ✅ |
| 16.3 | Add i18n strings | 5 min | ✅ |
| 16.4 | Run translations | 2 min | ✅ |
| 16.5 | 2-Step QA (TypeScript + Biome) | 10 min | ✅ |
| 16.6 | Deploy to Convex dev | 3 min | ✅ |
| **Total** | | **~40 min** | ✅ |

---

## 📝 Task 16.1: Add State Detection Logic

**File**: `app/[locale]/guided/step-5/page.tsx`

Add after the existing hooks (around line 82):

```typescript
// Assembly status detection
const hasCompletedVideo = 
  project?.assemblyStatus === "completed" && 
  !!project?.finalVideoUrl;

const isAssemblyInProgress = 
  project?.assemblyStatus && 
  !["completed", "failed"].includes(project.assemblyStatus);

const isAssemblyFailed = project?.assemblyStatus === "failed";
```

---

## 📝 Task 16.2: Add Conditional Button Rendering

**File**: `app/[locale]/guided/step-5/page.tsx`

Replace the footer button section (lines 504-526) with conditional rendering:

```typescript
<div
  className="fixed bottom-0 left-0 right-0 p-4 border-t border-[#314d68]"
  style={{ backgroundColor: "#182634" }}
>
  <div className="max-w-4xl mx-auto space-y-3">
    {/* CASE 1: Video already assembled - Show Skip + Re-assemble options */}
    {hasCompletedVideo && (
      <>
        <Button
          onClick={() => router.push(`/guided/step-6?projectId=${projectId}`)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg text-lg"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          {t("skip_to_final_video")}
          <Badge variant="secondary" className="ml-2 bg-green-800 text-white">
            {t("free")}
          </Badge>
        </Button>
        <p className="text-sm text-gray-400 text-center">
          {t("skip_to_final_video_hint")}
        </p>
        <Button
          onClick={handleContinue}
          variant="outline"
          className="w-full border-[#314d68] text-white hover:bg-[#223649] font-semibold py-3 px-8 rounded-lg"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          {t("reassemble_with_changes")}
          <Badge variant="secondary" className="ml-2 bg-[#223649]">
            5 {t("credits")}
          </Badge>
        </Button>
        <p className="text-xs text-gray-500 text-center">
          {t("reassemble_hint")}
        </p>
      </>
    )}

    {/* CASE 2: Assembly in progress - Show View Progress button */}
    {isAssemblyInProgress && (
      <>
        <Button
          onClick={() => router.push(`/guided/step-6?projectId=${projectId}`)}
          className="w-full bg-[#0d7ff2] hover:bg-[#0c6fd1] text-white font-semibold py-4 px-8 rounded-lg text-lg"
        >
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          {t("view_assembly_progress")}
        </Button>
        <p className="text-sm text-gray-400 text-center">
          {t("view_assembly_progress_hint")}
        </p>
      </>
    )}

    {/* CASE 3: Assembly failed - Show Retry button */}
    {isAssemblyFailed && (
      <>
        <Button
          onClick={() => router.push(`/guided/step-6?projectId=${projectId}`)}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 px-8 rounded-lg text-lg"
        >
          <AlertCircle className="h-5 w-5 mr-2" />
          {t("retry_assembly")}
        </Button>
        <p className="text-sm text-gray-400 text-center">
          {t("retry_assembly_hint")}
        </p>
      </>
    )}

    {/* CASE 4: Default - No assembly yet */}
    {!hasCompletedVideo && !isAssemblyInProgress && !isAssemblyFailed && (
      <>
        <Button
          onClick={handleContinue}
          className="w-full bg-[#0d7ff2] hover:bg-[#0c6fd1] text-white font-semibold py-4 px-8 rounded-lg text-lg"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          {t("assemble_render")}
        </Button>
        {!hasScenes && (
          <p className="text-sm text-gray-400 text-center">
            {t("no_scenes_warning")}
          </p>
        )}
        {hasScenes && totalDuration > 0 && (
          <p className="text-sm text-gray-400 text-center">
            {t("total_duration", { duration: totalDuration })}
          </p>
        )}
      </>
    )}
  </div>
</div>
```

**Required Imports** (add to existing imports):

```typescript
import { CheckCircle, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
```

---

## 📝 Task 16.3: Add i18n Strings

**File**: `messages/en.json`

Add to `guided_step5` section:

```json
{
  "guided_step5": {
    "skip_to_final_video": "Skip to Final Video",
    "skip_to_final_video_hint": "Your video is ready! Go directly to view, download, and share.",
    "reassemble_with_changes": "Re-assemble with Changes",
    "reassemble_hint": "Made changes to scenes, narration, or transitions? Re-render your video.",
    "view_assembly_progress": "View Assembly Progress",
    "view_assembly_progress_hint": "Your video is being assembled. Check the progress.",
    "retry_assembly": "Retry Assembly",
    "retry_assembly_hint": "Previous assembly failed. Credits were refunded.",
    "free": "FREE",
    "credits": "credits"
  }
}
```

---

## 📝 Task 16.4: Run Translations

```bash
pnpm translate
```

---

## 📝 Task 16.5: 2-Step QA

### Step 1: TypeScript Check

```bash
npx tsc --noEmit app/[locale]/guided/step-5/page.tsx
```

### Step 2: Biome Check

```bash
npx @biomejs/biome check --write app/[locale]/guided/step-5/page.tsx
```

---

## 📝 Task 16.6: Deploy to Convex Dev

```bash
npx convex dev --once
```

---

## ✅ Success Criteria

- [x] Skip button shows when video is already assembled
- [x] Skip button is FREE (no credits charged)
- [x] Re-assemble button is available for changes
- [x] In-progress state shows progress button
- [x] Failed state shows retry button
- [x] Default state shows normal assemble button
- [x] All i18n strings translated
- [x] TypeScript passes
- [x] Biome passes

---

## 🔄 Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| `assemblyStatus === "completed"` + `finalVideoUrl` exists | Show Skip + Re-assemble buttons |
| `assemblyStatus === "processing_media"` | Show "View Progress" button |
| `assemblyStatus === "failed"` | Show "Retry Assembly" button |
| `assemblyStatus === undefined` | Show normal "Assemble & Render" button |
| `finalVideoUrl` exists but `assemblyStatus !== "completed"` | Show normal button (edge case) |

---

## 📁 Files Modified Summary

| File | Lines Changed | Description |
|------|---------------|-------------|
| `app/[locale]/guided/step-5/page.tsx` | +50 | Add state detection + conditional buttons |
| `messages/en.json` | +10 | Add i18n strings |

---

**Document Version**: 1.0  
**Created**: December 23, 2025  
**Author**: MyShortReel Development Team  
**Status**: 🔄 IN PROGRESS

