# 🔧 Sprint 38: Image Generator — Responsive Layout Bulletproofing

**Date**: March 3, 2026  
**Branch**: `sprint-38-image-generator-responsive-fix`  
**Status**: ✅ IMPLEMENTED — All tasks complete, 2-Step QA passed  
**Estimated Time**: ~6-7 hours  
**Goal**: Fix the "hidden actions" problem permanently. Make image generator responsive across desktop, tablet, and mobile without hover-dependent interactions.  
**Dependencies**: Sprint 34 (all tasks complete) ✅  
**QA Strategy**: **2-Step QA** — (1) TypeScript `npx tsc --noEmit`, (2) Biome `npx biome check --write <files>` for every task. Test on real devices (iOS Safari, Android Chrome, iPad).

---

## 🔍 Problem Summary

The image generator has **three critical responsive failures**:

1. **Hover-only actions** — Action buttons (Copy, Download, Use as Input, etc.) are only visible on hover. Touch devices (mobile/tablet) can never access them.
2. **Broken bottom spacing** — Canvas height uses a static `bottom-28` magic number that doesn't account for prompt bar height, pills expansion, or safe areas. Elements overlap or float in wrong positions.
3. **No tablet layout** — Tablet (768px-1024px) is treated as "desktop" but 320px floating panels consume 42% of screen width, squeezing the image.

---

## 🎯 Solution Architecture (Option B — Proper Fix)

### New Layout Stack

```
┌─────────────────────────────────────────┐
│  PremiumTabSystem (fixed, top, z-40)    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────┐                    ┌─────────┐ │
│  │Refs │   OutputSection    │ Options │ │  <- Desktop (lg+): floating panels (w-80)
│  │Panel│     (flexible)     │  Panel  │ │  <- Tablet/Mobile: drawer pattern
│  │(I2I)│                    │         │ │  <- Mobile: drawer triggers
│  └─────┘                    └─────────┘ │
│         ┌───────────────────┐           │
│         │   ActionBar       │           │  <- Always visible on touch
│         │ (below image)     │           │     Hover-only on desktop
│         └───────────────────┘           │
├─────────────────────────────────────────┤
│  FloatingPromptBar (fixed, z-40)        │
│  with pb-[env(safe-area-inset-bottom)]  │
└─────────────────────────────────────────┘
```

### Key Changes

1. **Extract actions to fixed ActionBar** — Always visible on touch (`isMobile || isTablet`), hover-only on desktop (`!isMobile && !isTablet`)
2. **CSS custom properties for dynamic spacing** — Canvas height uses CSS vars with pixel fallbacks (180px baseline)
3. **Tablet uses drawer pattern** — Same as mobile: floating triggers + AdaptiveModal, not floating panels (`hidden lg:block` not `hidden md:block`)
4. **Safe area handling** — All fixed-position elements respect `env(safe-area-inset-bottom)`

---

## 🗺️ Sprint 38 Tasks

### ✅ Task 38.1 — Add tablet detection to DeviceContext — **PRE-COMPLETED** ✅

**Status**: ✅ ALREADY IMPLEMENTED — No changes needed

**Verification**: `contexts/DeviceContext.tsx` already has:
- Line 9: `useIsTablet` imported from hooks
- Line 17: `isTablet: boolean` in interface
- Line 42: `const isTablet = useIsTablet()` in provider
- Line 70: `isTablet` in context value

**Action**: Skip this task. Proceed to 38.2.

---

### ✅ Task 38.2 — Create ActionBar component — 90 min

**Objective**: Create a new `ActionBar` component that is always visible on touch devices, with full accessibility attributes.

**New File**: `components/image-generator/ActionBar.tsx`

**Implementation**:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useDevice } from "@/contexts/DeviceContext";
import { cn } from "@/lib/utils";

interface ActionBarProps {
    generatedImage: { url: string; prompt: string } | null;
    hasI2IModels?: boolean;
    onLoadAsInput: () => void;
    onCopy: () => void;
    onDownload: () => void;
    onUseInVideo: () => void;
    useInVideoLabel?: string;
    onSaveToProject?: () => void;
    saveToProjectLabel?: string;
}

export function ActionBar({
    generatedImage,
    hasI2IModels = true,
    onLoadAsInput,
    onCopy,
    onDownload,
    onUseInVideo,
    useInVideoLabel,
    onSaveToProject,
    saveToProjectLabel,
}: ActionBarProps) {
    const t = useTranslations("image_generator");
    const { isMobile, isTablet } = useDevice();
    const isTouchDevice = isMobile || isTablet;
    
    const resolvedUseInVideoLabel = useInVideoLabel ?? t("use_in_video");
    const resolvedSaveToProjectLabel = saveToProjectLabel ?? t("save_to_project");

    // Button styling — compact (icons only) on touch devices, full (icons + text) on desktop
    const buttonClassName = cn(
        "min-h-[44px] text-xs bg-background/80 backdrop-blur-sm border-border/50",
        "text-foreground hover:bg-background/90 hover:border-border",
        "flex items-center gap-1 active:scale-95 transition-smooth",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isTouchDevice ? "min-w-[44px] px-2" : "min-w-[44px] px-3"
    );

    if (!generatedImage) return null;

    return (
        <div className="flex items-center justify-center gap-2 p-2">
            {hasI2IModels && (
                <Button
                    type="button"
                    onClick={onLoadAsInput}
                    disabled={!generatedImage}
                    variant="outline"
                    size="sm"
                    className={buttonClassName}
                    title={t("use_as_input")}
                >
                    <svg 
                        className="w-3 h-3" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        aria-hidden
                        role="img"
                    >
                        <title>{t("use_as_input")}</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className={isTouchDevice ? "sr-only" : ""}>{t("use_as_input")}</span>
                </Button>
            )}
            
            <Button
                type="button"
                onClick={onCopy}
                disabled={!generatedImage}
                variant="outline"
                size="sm"
                className={buttonClassName}
                title={t("copy_to_clipboard")}
            >
                <svg 
                    className="w-3 h-3" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden
                    role="img"
                >
                    <title>{t("copy")}</title>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" />
                </svg>
                <span className={isTouchDevice ? "sr-only" : ""}>{t("copy")}</span>
            </Button>
            
            <Button
                type="button"
                onClick={onDownload}
                disabled={!generatedImage}
                variant="outline"
                size="sm"
                className={buttonClassName}
                title={t("download_image")}
            >
                <svg 
                    className="w-3 h-3" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden
                    role="img"
                >
                    <title>{t("download")}</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className={isTouchDevice ? "sr-only" : ""}>{t("download")}</span>
            </Button>
            
            <Button
                type="button"
                onClick={onUseInVideo}
                disabled={!generatedImage}
                variant="outline"
                size="sm"
                className={buttonClassName}
                title={resolvedUseInVideoLabel}
            >
                <svg 
                    className="w-3 h-3" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden
                    role="img"
                >
                    <title>{resolvedUseInVideoLabel}</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className={isTouchDevice ? "sr-only" : ""}>{resolvedUseInVideoLabel}</span>
            </Button>
            
            {onSaveToProject && (
                <Button
                    type="button"
                    onClick={onSaveToProject}
                    disabled={!generatedImage}
                    variant="default"
                    size="sm"
                    className={cn(buttonClassName, "bg-primary text-primary-foreground hover:bg-primary/90")}
                    title={resolvedSaveToProjectLabel}
                >
                    <svg 
                        className="w-3 h-3" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        aria-hidden
                        role="img"
                    >
                        <title>{resolvedSaveToProjectLabel}</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span className={isTouchDevice ? "sr-only" : ""}>{resolvedSaveToProjectLabel}</span>
                </Button>
            )}
        </div>
    );
}
```

**Key Requirements**:
- ✅ All SVGs have `aria-hidden` and `role="img"` attributes (accessibility preserved)
- ✅ All SVGs have `<title>` elements for screen readers
- ✅ Touch devices (mobile + tablet) show icons only with `sr-only` text
- ✅ Desktop shows icons + text

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/image-generator/ActionBar.tsx
```

---

### ✅ Task 38.3 — Refactor OutputSection with ActionBar — 60 min

**Objective**: Replace the hover-only action overlay with the new ActionBar. Use JS conditional (not styled-jsx) for touch vs desktop behavior. Place touch ActionBar outside the absolute container so it flows below the image.

**File**: `components/image-generator/output-section.tsx`

**Implementation**:

**Step 1**: Import the new ActionBar and update device detection:

```typescript
import { ActionBar } from "./ActionBar";
// ... existing imports

// In OutputSection component:
const { isMobile, isTablet } = useDevice();
const isTouchDevice = isMobile || isTablet;
```

**Step 2**: Reorganize the JSX structure. The touch ActionBar must be placed **outside** the `absolute inset-0` image container so it flows in normal document order. The current structure is:

```typescript
// Current structure (simplified):
<div className="flex flex-col h-full min-h-0">
    <div className="relative flex-1 min-h-0 flex flex-col">
        {generatedImage ? (
            <div className="absolute inset-0 flex flex-col select-none group">
                <div className="flex-1 flex items-center justify-center">...</div>
                {/* Hover overlay here - inside absolute container */}
            </div>
        )}
    </div>
</div>
```

**New structure**:

```typescript
<div className="flex flex-col h-full min-h-0 select-none relative group/output">
    <div className="relative flex-1 min-h-0 flex flex-col">
        {selectedGeneration?.status === "loading" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                <ProgressBar ... />
            </div>
        ) : isConvertingHeic ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                <ProgressBar ... />
            </div>
        ) : generatedImage ? (
            <>
                {/* Image container - absolute inset-0 only contains the image */}
                <div className="absolute inset-0 flex flex-col select-none">
                    <div className="flex-1 flex items-center justify-center relative max-w-full max-h-full overflow-hidden">
                        <button type="button" className="absolute inset-0 w-full h-full ..." onClick={onOpenFullscreen}>
                            <Image ... />
                        </button>
                    </div>
                    
                    {/* Desktop: Hover overlay - stays inside absolute container */}
                    {!isTouchDevice && (
                        <div className="flex absolute inset-x-0 bottom-4 justify-center opacity-0 group-hover/output:opacity-100 transition-smooth z-50 pointer-events-none group-hover/output:pointer-events-auto">
                            <div className="bg-background/70 backdrop-blur-md rounded-xl p-2 border border-border/30 shadow-lg">
                                <ActionBar
                                    generatedImage={generatedImage}
                                    hasI2IModels={hasI2IModels}
                                    onLoadAsInput={onLoadAsInput}
                                    onCopy={onCopy}
                                    onDownload={onDownload}
                                    onUseInVideo={() => generatedImage && onUseInVideo(generatedImage.url)}
                                    useInVideoLabel={useInVideoLabel}
                                    onSaveToProject={onSaveToProject}
                                    saveToProjectLabel={saveToProjectLabel}
                                />
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Touch: Permanent ActionBar - OUTSIDE absolute container, in normal flow */}
                {isTouchDevice && (
                    <div className="mt-auto flex justify-center pt-4 pb-2">
                        <div className="bg-background/70 backdrop-blur-md rounded-xl p-2 border border-border/30 shadow-lg">
                            <ActionBar
                                generatedImage={generatedImage}
                                hasI2IModels={hasI2IModels}
                                onLoadAsInput={onLoadAsInput}
                                onCopy={onCopy}
                                onDownload={onDownload}
                                onUseInVideo={() => generatedImage && onUseInVideo(generatedImage.url)}
                                useInVideoLabel={useInVideoLabel}
                                onSaveToProject={onSaveToProject}
                                saveToProjectLabel={saveToProjectLabel}
                            />
                        </div>
                    </div>
                )}
            </>
        ) : (
            <div className="absolute inset-0 flex items-center justify-center text-center ...">
                {/* Empty state */}
            </div>
        )}
    </div>
</div>
```

**Key change**: The touch ActionBar uses `mt-auto` and `pt-4 pb-2` to sit below the flex-1 image container, outside the absolute positioning.

**Implementation note**: The parent `<div className="relative flex-1 min-h-0 flex flex-col">` is a flex column container. Inside it, the fragment `<>...</>` wraps two children: (1) the absolute-positioned image div, and (2) the ActionBar div. The absolute div has zero height in normal flow, so `mt-auto` on the ActionBar correctly pushes it to the bottom of the available space. This is the intended flexbox behavior.

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/image-generator/output-section.tsx
```

---

### ✅ Task 38.4 — Implement CSS custom properties for dynamic spacing — 90 min

**Objective**: Replace static `bottom-28` with CSS custom properties. **Inline the CSS variables into globals.css** to avoid @layer collision risk.

**File to Modify**: `app/globals.css`

**Implementation**:

Add the CSS variables directly into the existing `@layer base` block in `globals.css` (don't create a separate file):

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Existing variables... */
    
    /* 
     * Sprint 38: Image Generator Layout Variables
     * Baseline heights — "best effort" baselines with runtime fallbacks.
     * The prompt bar can grow when pills expand (TextareaAutosize).
     */
    --ig-prompt-bar-min-height: 60px;
    --ig-action-bar-height: 56px;
    --ig-floating-panel-top: 96px;
    
    /* Spacing */
    --ig-safe-area-bottom: env(safe-area-inset-bottom, 0px);
    --ig-margin-sm: 16px;
    --ig-margin-md: 24px;
    
    /* Calculated positions */
    --ig-prompt-bar-total: calc(var(--ig-prompt-bar-min-height) + var(--ig-safe-area-bottom) + var(--ig-margin-md));
    --ig-action-bar-total: calc(var(--ig-action-bar-height) + var(--ig-margin-sm));
    --ig-canvas-bottom-offset: calc(var(--ig-prompt-bar-total) + var(--ig-action-bar-total));
    --ig-mobile-button-offset: calc(var(--ig-prompt-bar-total) + var(--ig-margin-md));
  }
}
```

**File to Modify**: `components/image-generator/index.tsx`

Update the OutputSection container (line ~1037):

```typescript
{/* ── Layer 0: Canvas — OutputSection stops above the floating prompt bar ── */}
<div 
    className="absolute inset-x-0 top-0 z-0"
    style={{ 
        bottom: 'var(--ig-canvas-bottom-offset, 180px)',
    }}
>
    <OutputSection ... />
</div>
```

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write app/globals.css components/image-generator/index.tsx
```

---

### ✅ Task 38.5 — Add tablet-specific drawer layout — 60 min

**Objective**: Make tablet (768px-1024px) use the same drawer pattern as mobile. Change `hidden md:block` to `hidden lg:block` for desktop-only floating panels.

**Files**:
- `components/image-generator/index.tsx`
- `components/image-generator/FloatingOptionsPanel.tsx`

**Implementation**:

**Step 1**: Update FloatingOptionsPanel to use drawer for tablet:

```typescript
// In FloatingOptionsPanel.tsx, line 41:
const { isMobile, isTablet, orientation } = useDevice(); // Add isTablet
const isTouchDevice = isMobile || isTablet; // Use this for conditional

// Line 52: Change condition from `if (isMobile)` to `if (isTouchDevice)`
if (isTouchDevice) {
    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
                className="fixed right-4 z-30 min-h-[44px] min-w-[44px] rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg active:scale-95 transition-smooth"
                style={{ bottom: 'var(--ig-mobile-button-offset, 140px)' }}
                aria-label={panelTitle}
            >
                <SlidersHorizontal className="size-5" />
            </Button>
            // ... AdaptiveModal (unchanged)
        </>
    );
}
```

**Step 2**: Update RefsPanel in `index.tsx` to use `hidden lg:block` (not `hidden md:block`):

```typescript
// Line ~1137: Change from hidden md:block to hidden lg:block
{/* Desktop (lg+): floating left glass panel */}
<div className="hidden lg:block fixed top-24 left-6 w-80 z-30">
    <div className="rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        <RefsPanel ... />
    </div>
</div>

{/* Tablet/Mobile: floating trigger + Drawer */}
<Button
    variant="ghost"
    size="icon"
    onClick={() => setRefsOpen(true)}
    className="fixed left-4 z-30 min-h-[44px] min-w-[44px] rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg active:scale-95 transition-smooth lg:hidden"
    style={{ bottom: 'var(--ig-mobile-button-offset, 140px)' }}
    aria-label={t("edit_refs_label")}
>
    <ImageIcon className="size-5" />
</Button>
```

**Step 3**: Update History button positioning for Edit mode spatial separation:

In Edit mode on mobile/tablet, the Refs button occupies the left side. Move History button to the **right** side so both are accessible simultaneously. On desktop (`lg+`), both buttons use their standard left-side positioning.

**Important**: The `mode === "edit" && "hidden lg:flex"` condition from the previous implementation is **intentionally removed**. History is now always visible on touch devices in Edit mode — just repositioned to the right side. Do not add the `hidden` condition back.

```typescript
// Line ~1201: Change positioning logic for Edit mode
<Button
    variant="ghost"
    size="icon"
    onClick={() => setHistoryOpen(true)}
    className={cn(
        "fixed z-30 min-h-[44px] min-w-[44px] rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg active:scale-95 transition-smooth",
        "lg:bottom-6 lg:left-6", // Desktop: standard left positioning
        // Mobile/Tablet: left in Generate mode, right in Edit mode (Refs is on left)
        mode === "edit" 
            ? "right-4 lg:left-6 lg:right-auto" 
            : "left-4",
    )}
    style={{ bottom: 'var(--ig-mobile-button-offset, 140px)' }}
    aria-label={t("history")}
>
    <History className="size-5" />
</Button>
```

**Why drawer for tablet**: Floating panels at 320px width consume 42% of 768px tablet screen. Drawer pattern (same as mobile) is the safer UX choice—panel doesn't obscure the image, and touch targets are larger.

**Why `hidden lg:block`**: `md:` breakpoint (768px+) includes tablet. We want floating panels only at `lg:` (1024px+) for true desktop.

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/image-generator/FloatingOptionsPanel.tsx components/image-generator/index.tsx
```

---

### ✅ Task 38.6 — Add safe area handling to all floating elements — 30 min

**Objective**: Ensure History button, Refs button, and Options button respect iOS/Android safe areas. Fix conflicting padding classes.

**Files**:
- `app/[locale]/tools/image-generator/ImageToolView.tsx`

**Implementation**:

Update ImageToolView.tsx to use safe area-aware padding:

```typescript
// Replace the current className:
// className="w-full px-4 pt-24 pb-4 sm:pt-28 md:pt-32 md:px-6 lg:px-8"

// With safe area handling (use max() to avoid conflict with existing pb-4):
className="w-full px-4 pt-24 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-28 md:pt-32 md:px-6 lg:px-8"
```

**Note**: The `max()` CSS function has full support since 2019 across all modern browsers. No fallback needed.

**Verification**: Ensure these already have safe area handling:
- ✅ FloatingPromptBar — already has `pb-[env(safe-area-inset-bottom)]`
- ✅ Mobile buttons — now use CSS var `--ig-safe-area-bottom` via `--ig-mobile-button-offset`

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write app/[locale]/tools/image-generator/ImageToolView.tsx
```

---

### ✅ Task 38.7 — Clean up legacy renderButtons function — 20 min

**Objective**: Remove the old `renderButtons` function from `output-section.tsx` since ActionBar replaces it.

**File**: `components/image-generator/output-section.tsx`

**Implementation**:

Remove lines 111-262 (the entire `renderButtons` function). This function is no longer called after Task 38.3.

**Before removing, verify**:
- No other references to `renderButtons` exist in the file
- All button functionality is now handled by ActionBar

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/image-generator/output-section.tsx
```

---

## 📊 Task Priority & Status

| # | Task | Focus | Est. | Status |
|---|------|-------|------|--------|
| 38.1 | Add tablet detection | Layout foundation | — | ✅ **PRE-COMPLETED** |
| 38.2 | Create ActionBar component | Touch accessibility | 90m | 📝 |
| 38.3 | Refactor OutputSection | Hover → always-visible | 60m | 📝 |
| 38.4 | CSS custom properties | Dynamic spacing | 90m | 📝 |
| 38.5 | Tablet drawer layout | Responsive breakpoints | 60m | 📝 |
| 38.6 | Safe area handling | iOS/Android polish | 30m | 📝 |
| 38.7 | Remove renderButtons | Cleanup | 20m | 📝 |
| **—** | **TOTAL** | | **~6-7h** | |

---

## 🚀 Execution Order

Run in this order (dependencies):

1. **38.2** (creates ActionBar — unblocks 38.3)
2. **38.4** (CSS vars — foundation for 38.5, 38.6)
3. **38.3** (integrate ActionBar — can run parallel with 38.4 after 38.2)
4. **38.5** (tablet drawer — needs 38.4)
5. **38.6** (safe areas — needs 38.4)
6. **38.7** (cleanup — last)

---

## ✅ FINAL SPRINT QA

```bash
# 1. Full TypeScript check
npx tsc --noEmit

# 2. Full Biome check
npx biome check --write .

# 3. i18n verification (no-op — no new keys needed)
pnpm i18n:verify
```

### Manual Device Testing Checklist

| Device | Viewport | Tests |
|--------|----------|-------|
| iPhone 14 Pro | 393×852 | Actions visible below image ✓, no overlap ✓, safe area respected ✓ |
| iPad Air | 820×1180 | Drawer pattern renders ✓, panels don't obscure image ✓ |
| Desktop Chrome | 1440×900 | Hover overlay works ✓, all actions accessible ✓ |
| Android Pixel 7 | 412×915 | Actions visible ✓, back gesture doesn't conflict ✓ |

---

## 📁 Files to Modify (Summary)

| File | Tasks | Changes |
|------|-------|---------|
| `contexts/DeviceContext.tsx` | 38.1 | ✅ Already complete — no changes |
| `components/image-generator/ActionBar.tsx` | 38.2 | **NEW FILE** — Extracted action buttons with accessibility |
| `components/image-generator/output-section.tsx` | 38.3, 38.7 | Replace renderButtons with ActionBar, restructure JSX for touch layout |
| `components/image-generator/index.tsx` | 38.4, 38.5 | CSS vars, change `hidden md:block` to `hidden lg:block`, History button `lg:` prefix |
| `components/image-generator/FloatingOptionsPanel.tsx` | 38.5 | Add isTablet, use `isTouchDevice` for drawer |
| `app/[locale]/tools/image-generator/ImageToolView.tsx` | 38.6 | Safe area padding with `pb-[max(...)]` |
| `app/globals.css` | 38.4 | Add CSS variables to existing `@layer base` block |

---

## 🎯 Success Metrics

- **Mobile (iOS/Android)**: All 5 action buttons visible below generated image without hovering
- **Tablet (iPad)**: Drawer pattern (same as mobile) — panels don't obscure image
- **Desktop**: Hover overlay still works for clean UI, but buttons accessible via ActionBar fallback
- **No overlap**: Canvas, action bar, prompt bar, and floating buttons never overlap
- **Safe areas**: On iOS Safari and Android gesture nav, system bars don't cover UI elements
- **Accessibility**: All SVGs have `aria-hidden`, `role="img"`, and `<title>` elements
- **TypeScript**: Zero errors
- **Biome**: Zero lint/format issues
- **Manual test**: All actions (Copy, Download, Use as Input, Use in Video, Save to Project) work on real touch devices
