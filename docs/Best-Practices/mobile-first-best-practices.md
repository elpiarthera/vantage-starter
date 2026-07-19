# 📱 Mobile-First Architecture & Best Practices

*Complete reference guide for mobile-first development in this template*

**Last Updated**: October 11, 2025  
**Implementation Status**: ✅ Production-Ready - Core patterns tested and documented  
**Target Audience**: Developers implementing new features or maintaining existing code

---

## 📋 Table of Contents

1. [Project Directory Structure](#project-directory-structure)
2. [Architecture Overview](#architecture-overview)
3. [Complete File Inventory](#complete-file-inventory)
4. [Core Systems](#core-systems)
5. [Implementation Patterns](#implementation-patterns)
6. [Decision Trees](#decision-trees)
7. [Code Examples](#code-examples)
8. [Testing & Validation](#testing--validation)

---

## 📂 Project Directory Structure

### **Complete Mobile-First File Tree**

\`\`\`
your-app/
│
├── 📱 MOBILE-FIRST CORE SYSTEM
│   ├── config/
│   │   ├── responsive.ts              # Breakpoint definitions (640px, 768px, 1024px, 1280px)
│   │   └── features.ts                # Feature flags for responsive architecture
│   │
│   ├── contexts/
│   │   └── DeviceContext.tsx          # ⭐ Central device detection context
│   │
│   └── hooks/
│       ├── responsive/
│       │   ├── useBreakpoint.ts       # Media query detection + convenience hooks
│       │   ├── useOrientation.ts      # Portrait/landscape detection
│       │   └── useViewport.ts         # Viewport dimensions with debouncing
│       ├── use-mobile.tsx             # Legacy mobile detection wrapper
│       └── use-hydration.ts           # SSR-safe hydration helper
│
├── 🎨 ADAPTIVE COMPONENTS (Same content, different UI)
│   └── components/adaptive/
│       ├── AdaptiveModal.tsx          # Modal (desktop) / Drawer (mobile)
│       ├── AdaptiveNavigation.tsx     # Tabs (desktop) / Accordion (mobile)
│       └── AdaptiveGrid.tsx           # Responsive grid layout
│
├── 🎬 VIDEO GENERATION WORKFLOW (Mobile-first guided flow)
│   └── app/guided/
│       ├── layout.tsx                 # ⭐ DeviceProvider wrapper for all steps
│       ├── step-1/page.tsx            # Emotional Foundation (mobile-optimized)
│       ├── step-2/page.tsx            # Story Creation (mobile-optimized)
│       ├── step-3/page.tsx            # Visual Design (mobile-optimized)
│       ├── step-4/page.tsx            # Music Selection (mobile-optimized)
│       ├── step-5/page.tsx            # Effects & Transitions (mobile-optimized)
│       └── step-6/page.tsx            # Video Generation (mobile-optimized)
│
├── 🎨 SCENE MANAGEMENT (Mobile-first with adaptive UI)
│   └── components/scene-management/
│       ├── SceneManager.tsx           # Main scene orchestrator
│       ├── SceneEditor.tsx            # Scene editing interface
│       └── FrameAssignment.tsx        # Frame-by-frame assignment
│
├── 🖼️ ASSET MANAGEMENT (Touch-optimized)
│   └── components/asset-management/
│       ├── AssetSelector.tsx          # ⭐ Comprehensive asset selection UI
│       │                              # - AI generation tab
│       │                              # - Library tab (uploaded assets)
│       │                              # - Upload tab
│       │                              # - Responsive grid layouts
│       │                              # - Touch-optimized buttons
│       └── AssetUploader.tsx          # File upload interface
│
├── 🎥 VIDEO GENERATION (Mobile-aware)
│   └── components/video-generation/
│       └── VideoGenerator.tsx         # Video generation interface
│
├── 💬 AI CHAT SYSTEM (Mobile-optimized)
│   └── components/ai-elements/
│       ├── conversation.tsx           # Chat conversation container
│       ├── message.tsx                # Individual message component
│       └── thread.tsx                 # Message thread display
│
├── 🧩 SHARED COMPONENTS (Mobile-first)
│   └── components/shared/
│       └── step-header.tsx            # ⭐ Responsive step navigation header
│                                      # - Compact on mobile
│                                      # - Full navigation on desktop
│                                      # - Progress indicator
│
├── 🎨 UI COMPONENTS (Mobile Support)
│   └── components/ui/
│       ├── drawer.tsx                 # Bottom sheet with gestures (vaul)
│       ├── sheet.tsx                  # Side sheet with slide animation
│       ├── dialog.tsx                 # Center modal with backdrop
│       ├── button.tsx                 # 44px min touch target
│       ├── input.tsx                  # 48px min height (prevents iOS zoom)
│       ├── sidebar.tsx                # Responsive sidebar component
│       └── use-mobile.tsx             # Legacy mobile hook (768px breakpoint)
│
├── 📄 PAGES (Mobile-first routing)
│   └── app/
│       ├── page.tsx                   # Landing page (mobile-first hero)
│       ├── dashboard/page.tsx         # User dashboard (responsive grid)
│       └── layout.tsx                 # Root layout with fonts
│
├── 🗄️ STATE MANAGEMENT (Device-aware)
│   └── stores/
│       ├── video-store.ts             # Video generation state (Zustand)
│       └── scene-store.ts             # Scene management state (Zustand)
│
├── 🛠️ SERVICES (Backend integration)
│   └── services/
│       ├── aiChat.ts                  # AI chat service
│       ├── videoGeneration.ts         # Video generation service
│       ├── assetUpload.ts             # Asset upload service
│       └── storage.ts                 # Storage service
│
├── 🛠️ UTILITIES & MONITORING
│   └── lib/
│       ├── utils.ts                   # cn() - conditional className merging
│       └── monitoring/
│           └── analytics.ts           # debugResponsive(), debugDevice()
│
└── 📚 DOCUMENTATION
    ├── README.md                                        # Project overview
    ├── docs/Best-Practices/
    │   ├── mobile-first-best-practices.md              # ⭐ This file
    │   └── feature-implementation-best-practices.md    # Feature development patterns
    └── docs/Implementation/
        ├── README.md                                    # Implementation guide
        ├── ToDo/                                        # Pending implementations
        │   ├── auth-implementation-plan.md             # Clerk auth plan
        │   ├── convex-implementation-plan.md           # Convex backend plan
        │   └── ai-models-implementation-plan.md        # AI models plan
        └── Done/                                        # Completed implementations
\`\`\`

### **Key Directory Patterns**

#### **Pattern 1: Adaptive Component Architecture**
\`\`\`
components/adaptive/
├── AdaptiveModal.tsx          # Single component, device-aware
├── AdaptiveNavigation.tsx     # Single component, device-aware
└── AdaptiveGrid.tsx           # Single component, device-aware
\`\`\`

**When to use**: Same content, different presentation

**Examples in codebase**:
- `AdaptiveModal` - Modal on desktop, drawer on mobile
- `AdaptiveNavigation` - Tabs on desktop, accordion on mobile
- `AdaptiveGrid` - Dynamic columns based on device

---

#### **Pattern 2: Responsive Hooks Architecture**
\`\`\`
hooks/
├── responsive/
│   ├── useBreakpoint.ts       # Core media query detection
│   ├── useOrientation.ts      # Orientation detection
│   └── useViewport.ts         # Viewport dimensions
└── use-mobile.tsx             # Legacy wrapper (768px)
\`\`\`

**When to use**: Need device detection in component logic

**Examples in codebase**:
- All guided workflow pages use `useDevice()` from DeviceProvider
- Legacy components use `useIsMobile()` from use-mobile.tsx

---

#### **Pattern 3: Guided Workflow Architecture**
\`\`\`
app/guided/
├── layout.tsx                 # DeviceProvider wrapper
├── step-1/page.tsx            # Emotional Foundation
├── step-2/page.tsx            # Story Creation
├── step-3/page.tsx            # Visual Design
├── step-4/page.tsx            # Music Selection
├── step-5/page.tsx            # Effects & Transitions
└── step-6/page.tsx            # Video Generation
\`\`\`

**When to use**: Multi-step workflows requiring consistent responsive behavior

**Examples in codebase**:
- All 6 steps of video creation workflow
- Consistent header navigation across steps
- Responsive progress indicators

---

## 🏗️ Architecture Overview

### **Design Philosophy**

This template follows a **mobile-first, progressive enhancement** architecture:

1. **Base Layer**: Mobile experience (320px - 767px)
2. **Enhanced Layer**: Tablet experience (768px - 1023px)
3. **Optimal Layer**: Desktop experience (1024px+)

### **Key Architectural Principles**

- **Single Source of Truth**: Device context via React Context API (`DeviceProvider`)
- **Modular Components**: Adaptive components for different device experiences
- **Tailwind-First Styling**: Mobile-first responsive classes (`md:`, `lg:`, `xl:`)
- **Touch-First Design**: 44px minimum touch targets (WCAG 2.1 Level AA)
- **Performance-Optimized**: Debounced viewport updates, lazy loading
- **SSR-Safe**: Proper client-side detection with hydration safety

---

## 📁 Complete File Inventory

### **1. Configuration & Setup**

| File | Purpose | Key Exports |
|------|---------|-------------|
| `config/responsive.ts` | Breakpoint definitions | `BREAKPOINTS` (sm: 640, md: 768, lg: 1024, xl: 1280), `Breakpoint`, `Orientation` |
| `config/features.ts` | Feature flags | `FEATURES.useNewArchitecture`, `FEATURES.enableAdaptiveComponents` |

### **2. Context & Providers**

| File | Purpose | Key Exports |
|------|---------|-------------|
| `contexts/DeviceContext.tsx` | Central device detection context | `DeviceProvider`, `useDevice()`, `DeviceContextValue` |
| `app/guided/layout.tsx` | Guided workflow layout wrapper | Wraps children in `DeviceProvider` |

### **3. Responsive Hooks**

| File | Purpose | Key Exports |
|------|---------|-------------|
| `hooks/responsive/useBreakpoint.ts` | Media query hook with convenience functions | `useBreakpoint()`, `useIsMobile()`, `useIsTablet()`, `useIsDesktop()` |
| `hooks/responsive/useOrientation.ts` | Portrait/landscape detection | `useOrientation()` |
| `hooks/responsive/useViewport.ts` | Viewport dimensions with debouncing | `useViewport()` |
| `hooks/use-mobile.tsx` | Legacy mobile detection wrapper | `useIsMobile()` (768px breakpoint) |
| `hooks/use-hydration.ts` | SSR-safe hydration helper | `useHydration()` |

### **4. Adaptive Components**

| File | Purpose | Mobile Behavior | Desktop Behavior |
|------|---------|-----------------|------------------|
| `components/adaptive/AdaptiveGrid.tsx` | Responsive grid layout | 1 column | 2-3 columns |
| `components/adaptive/AdaptiveModal.tsx` | Modal/drawer system | Bottom drawer (vaul) | Center modal |
| `components/adaptive/AdaptiveNavigation.tsx` | Navigation UI | Expandable accordion | Horizontal tabs |

### **5. Guided Workflow (Mobile-First)**

| File | Purpose | Mobile Optimizations |
|------|---------|---------------------|
| `app/guided/step-1/page.tsx` | Emotional Foundation | 2-column grid for emotions, responsive spacing |
| `app/guided/step-2/page.tsx` | Story Creation | Full-width chat interface, compact messages |
| `app/guided/step-3/page.tsx` | Visual Design | Accordion scenes (mobile), tabs (desktop) |
| `app/guided/step-4/page.tsx` | Music Selection | 1-column grid (mobile), 3-column (desktop) |
| `app/guided/step-5/page.tsx` | Effects & Transitions | 1-column grid (mobile), 2-column (desktop) |
| `app/guided/step-6/page.tsx` | Video Generation | 1-column layout (mobile), 2-column (desktop) |

### **6. Scene Management (Mobile-Optimized)**

| File | Purpose | Mobile Features |
|------|---------|-----------------|
| `components/scene-management/SceneManager.tsx` | Scene orchestration | Touch-optimized scene cards, responsive grid |
| `components/scene-management/SceneEditor.tsx` | Scene editing | Full-screen editor on mobile, split-view on desktop |
| `components/scene-management/FrameAssignment.tsx` | Frame assignment | Touch-friendly frame selection |

### **7. Asset Management (Touch-Optimized)**

| File | Purpose | Mobile Optimizations |
|------|---------|---------------------|
| `components/asset-management/AssetSelector.tsx` | Comprehensive asset UI | - 2-column grid (mobile), 3-column (desktop)<br>- Touch-optimized buttons (44px min)<br>- Responsive image sizing<br>- Compact cards on mobile |

### **8. Shared Components (Mobile-First)**

| File | Purpose | Mobile Behavior | Desktop Behavior |
|------|---------|-----------------|------------------|
| `components/shared/step-header.tsx` | Step navigation header | Compact buttons, hidden labels | Full navigation with labels |

### **9. UI Components (Mobile Support)**

| File | Purpose | Mobile Features |
|------|---------|-----------------|
| `components/ui/drawer.tsx` | Bottom sheet (vaul) | Gesture-based, safe area support |
| `components/ui/sheet.tsx` | Side sheet | Slide-in animation, backdrop |
| `components/ui/dialog.tsx` | Modal dialog | Center modal, backdrop blur |
| `components/ui/sidebar.tsx` | Responsive sidebar | Modal on mobile, always visible on desktop |
| `components/ui/use-mobile.tsx` | Legacy mobile hook | 768px breakpoint detection |

### **10. State Management**

| File | Purpose | Responsive Features |
|------|---------|---------------------|
| `stores/video-store.ts` | Video generation state | Device-aware state management |
| `stores/scene-store.ts` | Scene management state | Device-aware state management |

### **11. Utilities & Monitoring**

| File | Purpose | Key Functions |
|------|---------|---------------|
| `lib/utils.ts` | Utility functions | `cn()` - conditional className merging |
| `lib/monitoring/analytics.ts` | Debug utilities | `debugResponsive()`, `debugDevice()` |

---

## 🎯 Core Systems

### **System 1: Device Detection**

**Architecture**: React Context + Custom Hooks

\`\`\`
DeviceProvider (Context)
    ↓
useDevice() hook
    ↓
Component receives: { 
  isMobile, isTablet, isDesktop, 
  isSmUp, isMdUp, isLgUp, isXlUp,
  orientation, viewport, isBreakpoint() 
}
\`\`\`

**Implementation Files**:
- `contexts/DeviceContext.tsx` - Context provider
- `hooks/responsive/useBreakpoint.ts` - Media query detection
- `hooks/responsive/useOrientation.ts` - Orientation detection
- `hooks/responsive/useViewport.ts` - Viewport dimensions

**Usage Pattern**:
\`\`\`tsx
import { useDevice } from "@/contexts/DeviceContext"

function MyComponent() {
  const { isMobile, isTablet, isDesktop } = useDevice()
  
  return (
    <div>
      {isMobile && <MobileView />}
      {isDesktop && <DesktopView />}
    </div>
  )
}
\`\`\`

**When to Use**:
- ✅ Need device type in component logic
- ✅ Conditional rendering based on screen size
- ✅ Different layouts for mobile/desktop
- ❌ Simple CSS-only responsive design (use Tailwind classes instead)

---

### **System 2: Adaptive Components**

**Architecture**: Single component, multiple UI implementations

\`\`\`
AdaptiveComponent
    ↓
useDevice() to detect device
    ↓
if (isMobile) → Mobile UI (Drawer, Accordion)
if (isDesktop) → Desktop UI (Modal, Tabs)
\`\`\`

**Implementation Files**:
- `components/adaptive/AdaptiveModal.tsx` - Modal/Drawer
- `components/adaptive/AdaptiveNavigation.tsx` - Tabs/Accordion
- `components/adaptive/AdaptiveGrid.tsx` - Responsive grid

**Usage Pattern**:
\`\`\`tsx
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal"

function MyFeature() {
  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Scene Settings"
    >
      {/* Same content, different presentation */}
      <SceneSettingsForm />
    </AdaptiveModal>
  )
}
\`\`\`

**When to Use**:
- ✅ Same content, different presentation
- ✅ Modal on desktop, drawer on mobile
- ✅ Tabs on desktop, accordion on mobile
- ❌ Completely different features per device

---

### **System 3: Tailwind Responsive Classes**

**Architecture**: Mobile-first CSS utility classes

\`\`\`
Base styles (mobile)
    ↓
md: prefix (tablet - 768px+)
    ↓
lg: prefix (desktop - 1024px+)
    ↓
xl: prefix (large desktop - 1280px+)
\`\`\`

**Usage Pattern**:
\`\`\`tsx
<div className="
  p-4 space-y-3           // Mobile base
  md:p-6 md:space-y-4     // Tablet
  lg:p-8 lg:space-y-6     // Desktop
">
  <h2 className="text-lg md:text-xl lg:text-2xl">
    Title
  </h2>
</div>
\`\`\`

**When to Use**:
- ✅ Layout adjustments (padding, margins, spacing)
- ✅ Typography scaling (text sizes)
- ✅ Grid column changes
- ✅ Show/hide elements (`hidden md:block`)
- ❌ Complex logic-based rendering (use `useDevice()` instead)

---

### **System 4: Conditional Rendering**

**Architecture**: Render components only when needed

\`\`\`tsx
{!isMobile && <DesktopOnlyFeature />}
{isMobile && <MobileOnlyFeature />}
\`\`\`

**Usage Pattern**:
\`\`\`tsx
function Layout() {
  const { isMobile } = useDevice()
  
  return (
    <div>
      {/* Desktop: Always visible sidebar */}
      {!isMobile && <Sidebar />}
      
      {/* Mobile: Modal sidebar */}
      {isMobile && (
        <AdaptiveModal isOpen={isOpen}>
          <Sidebar />
        </AdaptiveModal>
      )}
      
      <MainContent />
    </div>
  )
}
\`\`\`

**When to Use**:
- ✅ Desktop-only features (e.g., keyboard shortcuts panel)
- ✅ Mobile-only features (e.g., pull-to-refresh)
- ✅ Performance optimization
- ❌ Core functionality (should work on all devices)

---

## 🧭 Decision Trees

### **Decision Tree 1: Which Responsive Approach?**

\`\`\`
START: Need responsive behavior?
    ↓
Q1: Is it just layout/styling?
    YES → Use Tailwind responsive classes (md:, lg:, xl:)
    NO → Continue
    ↓
Q2: Same content, different presentation?
    YES → Use Adaptive Component (AdaptiveModal, AdaptiveNavigation)
    NO → Continue
    ↓
Q3: Fundamentally different UX?
    YES → Use conditional rendering with useDevice()
    NO → Continue
    ↓
Q4: Feature only makes sense on one device type?
    YES → Use conditional rendering {!isMobile && <Feature />}
    NO → Reconsider - might be CSS-only solution
\`\`\`

### **Decision Tree 2: Touch Target Sizing**

\`\`\`
START: Interactive element?
    ↓
Q1: Is it a button, link, or clickable element?
    YES → Minimum 44px × 44px (WCAG 2.1 Level AA)
          className="min-h-[44px] min-w-[44px]"
    NO → Continue
    ↓
Q2: Is it a form input?
    YES → Minimum 48px height (prevents iOS zoom)
          className="min-h-[48px]"
    NO → Continue
    ↓
Q3: Is it a card or list item?
    YES → Minimum 80px height for comfortable tapping
          className="min-h-[80px]"
    NO → Standard sizing OK
\`\`\`

### **Decision Tree 3: Modal vs Drawer**

\`\`\`
START: Need to show overlay content?
    ↓
Q1: Is content form-based or requires input?
    YES → Use AdaptiveModal (drawer on mobile for keyboard)
    NO → Continue
    ↓
Q2: Is content tall/scrollable?
    YES → Use AdaptiveModal (drawer on mobile for better scrolling)
    NO → Continue
    ↓
Q3: Is content simple/quick action?
    YES → Use Dialog on all devices
    NO → Use AdaptiveModal (best of both worlds)
\`\`\`

---

## 💻 Implementation Patterns

### **Pattern 1: Mobile-First Component**

\`\`\`tsx
"use client"

import { useDevice } from "@/contexts/DeviceContext"
import { Button } from "@/components/ui/button"

export function MyComponent() {
  const { isMobile } = useDevice()
  
  return (
    <div className="
      // Mobile-first base styles
      p-4 space-y-3
      // Tablet enhancements
      md:p-6 md:space-y-4
      // Desktop enhancements
      lg:p-8 lg:space-y-6
    ">
      <h2 className="text-lg md:text-xl lg:text-2xl">
        Scene Title
      </h2>
      
      <Button 
        size={isMobile ? "lg" : "default"}
        className="min-h-[44px] min-w-[44px]"
      >
        Generate Video
      </Button>
    </div>
  )
}
\`\`\`

**Key Points**:
- Start with mobile styles (no prefix)
- Add tablet styles with `md:` prefix
- Add desktop styles with `lg:` prefix
- Use `useDevice()` for logic, Tailwind for styling

---

### **Pattern 2: Adaptive Modal Implementation**

\`\`\`tsx
"use client"

import { useState } from "react"
import { useDevice } from "@/contexts/DeviceContext"
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal"
import { Button } from "@/components/ui/button"

export function SceneSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const { isMobile } = useDevice()
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Scene Settings
      </Button>
      
      <AdaptiveModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Scene Settings"
      >
        {/* Mobile: Bottom drawer with gesture support */}
        {/* Desktop: Center modal with backdrop */}
        <SceneSettingsForm />
      </AdaptiveModal>
    </>
  )
}
\`\`\`

**Key Points**:
- AdaptiveModal handles device detection internally
- Same content, different presentation
- Automatic gesture support on mobile
- Backdrop blur on both devices

---

### **Pattern 3: Responsive Grid Layout**

\`\`\`tsx
"use client"

import { AdaptiveGrid } from "@/components/adaptive/AdaptiveGrid"

export function AssetGallery() {
  return (
    <AdaptiveGrid
      mobileColumns={1}
      tabletColumns={2}
      desktopColumns={3}
      className="gap-4"
    >
      {assets.map(asset => (
        <AssetCard key={asset.id} {...asset} />
      ))}
    </AdaptiveGrid>
  )
}
\`\`\`

**Alternative with Tailwind**:
\`\`\`tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {assets.map(asset => (
    <AssetCard key={asset.id} {...asset} />
  ))}
</div>
\`\`\`

**Key Points**:
- Use AdaptiveGrid for dynamic columns
- Or use Tailwind: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Consistent gap spacing across breakpoints
- Automatic reflow on resize

---

### **Pattern 4: Touch-Optimized Interactive Elements**

\`\`\`tsx
"use client"

import { useDevice } from "@/contexts/DeviceContext"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function SceneCard({ onClick }) {
  const { isMobile } = useDevice()
  
  return (
    <Card
      onClick={onClick}
      className={`
        cursor-pointer transition-all
        // Mobile: Larger touch target, no hover
        ${isMobile ? 'min-h-[80px] active:scale-98' : 'hover:shadow-lg'}
      `}
    >
      <div className="p-4 flex items-center gap-3">
        <Button
          size={isMobile ? "lg" : "default"}
          className="min-h-[44px] min-w-[44px]"
        >
          Edit Scene
        </Button>
      </div>
    </Card>
  )
}
\`\`\`

**Key Points**:
- Minimum 44px × 44px touch targets
- Use `active:` instead of `hover:` on mobile
- Larger spacing on mobile (easier tapping)
- No hover states on touch devices

---

### **Pattern 5: Responsive Step Header**

\`\`\`tsx
"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Home } from 'lucide-react'
import Link from "next/link"

export function StepHeader({ currentStep, backHref }) {
  return (
    <div className="
      shadow-md p-3 md:p-4 
      fixed top-0 w-full z-50
      bg-[#182634] border-b border-[#223649]
    ">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href={backHref}>
          <Button 
            variant="ghost" 
            className="text-white hover:bg-[#223649] p-2 md:px-4"
          >
            <ArrowLeft className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Back</span>
          </Button>
        </Link>

        <div className="flex-1 max-w-md mx-4 md:mx-8">
          {/* Progress indicator */}
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div
                key={num}
                className={`
                  w-5 h-5 md:w-6 md:h-6 
                  rounded-full flex items-center justify-center text-xs
                  ${num <= currentStep ? 'bg-[#0d7ff2] text-white' : 'bg-[#314d68] text-gray-400'}
                `}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        <Link href="/">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-[#223649] p-2 md:px-4"
          >
            <Home className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Home</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
\`\`\`

**Key Points**:
- Compact buttons on mobile (icon only)
- Full labels on desktop (`hidden md:inline`)
- Responsive padding: `p-3 md:p-4`
- Responsive icon sizing: `h-4 w-4 md:mr-2`

---

### **Pattern 6: Performance Optimization**

\`\`\`tsx
"use client"

import { memo, useMemo, useCallback } from "react"
import { useDevice } from "@/contexts/DeviceContext"

// Memoize component to prevent unnecessary re-renders
export const OptimizedSceneList = memo(function OptimizedSceneList({ 
  scenes, 
  onSceneSelect 
}) {
  const { isMobile } = useDevice()
  
  // Memoize expensive computations
  const sortedScenes = useMemo(() => {
    return scenes.sort((a, b) => a.order - b.order)
  }, [scenes])
  
  // Memoize callbacks
  const handleSceneClick = useCallback((sceneId: string) => {
    onSceneSelect(sceneId)
  }, [onSceneSelect])
  
  return (
    <div className="space-y-4">
      {sortedScenes.map(scene => (
        <SceneCard 
          key={scene.id} 
          scene={scene}
          onClick={handleSceneClick}
          isMobile={isMobile}
        />
      ))}
    </div>
  )
})
\`\`\`

**Key Points**:
- Use `React.memo` for expensive components
- Use `useMemo` for expensive computations
- Use `useCallback` for stable function references
- Pass device state as prop to avoid context re-renders

---

## ✅ Testing & Validation

### **Testing Checklist**

#### **Breakpoint Testing**
- [ ] 320px (iPhone SE) - Smallest mobile
- [ ] 375px (iPhone 12/13/14) - Common mobile
- [ ] 768px (iPad Portrait) - Tablet breakpoint
- [ ] 1024px (iPad Landscape) - Desktop breakpoint
- [ ] 1440px (Laptop) - Large desktop

#### **Touch Target Testing**
- [ ] All buttons ≥ 44px × 44px
- [ ] All form inputs ≥ 48px height
- [ ] All cards/list items ≥ 80px height
- [ ] Adequate spacing between touch targets (≥ 8px)

#### **Orientation Testing**
- [ ] Portrait mode works correctly
- [ ] Landscape mode works correctly
- [ ] Orientation change doesn't break layout
- [ ] Content reflows properly

#### **Performance Testing**
- [ ] First Contentful Paint < 1.5s on 3G
- [ ] Largest Contentful Paint < 2.5s on 3G
- [ ] Cumulative Layout Shift < 0.1
- [ ] First Input Delay < 100ms

#### **Accessibility Testing**
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets meet WCAG 2.1 Level AA

---

## 🎯 Quick Reference

### **Breakpoints**
\`\`\`typescript
sm: 640px   // Small tablets
md: 768px   // Tablets (mobile breakpoint)
lg: 1024px  // Desktop (desktop breakpoint)
xl: 1280px  // Large desktop
\`\`\`

### **Touch Targets**
\`\`\`typescript
Button: min-h-[44px] min-w-[44px]  // WCAG 2.1 Level AA
Input: min-h-[48px]                 // Prevents iOS zoom
Card: min-h-[80px]                  // Comfortable tapping
\`\`\`

### **Common Patterns**
\`\`\`tsx
// Device detection
const { isMobile, isTablet, isDesktop } = useDevice()

// Conditional rendering
{isMobile && <MobileView />}
{!isMobile && <DesktopView />}

// Responsive classes
className="p-4 md:p-6 lg:p-8"

// Touch-optimized
className={isMobile ? 'active:scale-98' : 'hover:scale-105'}

// Show/hide elements
className="hidden md:inline"  // Hidden on mobile, visible on desktop
className="md:hidden"          // Visible on mobile, hidden on desktop
\`\`\`

### **Color System**
\`\`\`css
Background: #101a23 (dark blue)
Card: #182634 (darker blue)
Primary: #0d7ff2 (bright blue)
Secondary: #223649 (muted blue)
Muted: #314d68 (lighter muted blue)
Border: #223649
\`\`\`

---

## 📚 Additional Resources

- **Project README**: `README.md`
- **Feature Best Practices**: `docs/Best-Practices/feature-implementation-best-practices.md`
- **Implementation Plans**: `docs/Implementation/ToDo/`
  - Auth Implementation: `auth-implementation-plan.md`
  - Convex Backend: `convex-implementation-plan.md`
  - AI Models: `ai-models-implementation-plan.md`
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Touch Target Guidance**: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
- **Tailwind CSS Docs**: https://tailwindcss.com/docs

---

## 🚀 Implementation Status

### **✅ Completed**
- Core device detection system (`DeviceContext`, responsive hooks)
- Adaptive components (`AdaptiveModal`, `AdaptiveNavigation`, `AdaptiveGrid`)
- Guided workflow with mobile-first design (all 6 steps)
- Responsive step header navigation
- Touch-optimized asset management
- Mobile-first scene management
- Tailwind responsive utilities throughout

### **🔄 In Progress**
- None (frontend mobile-first implementation complete)

### **📋 Pending**
- Backend integration (Convex) - See `docs/Implementation/ToDo/convex-implementation-plan.md`
- Authentication (Clerk) - See `docs/Implementation/ToDo/auth-implementation-plan.md`

---

*Last updated: October 11, 2025 - This document is the definitive guide for mobile-first development in this template. All patterns are production-tested.*
