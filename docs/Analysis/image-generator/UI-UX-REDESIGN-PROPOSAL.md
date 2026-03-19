# 🎨 Image Generator UI/UX Redesign Proposal

**Date**: February 13, 2026  
**Author**: Design Master Agent  
**Status**: 📋 PROPOSAL — Senior Design Master Visual Overhaul Incorporated  
**Priority**: 🔴 HIGH — Critical Visual & UX Overhaul  
**Version**: 3.1 (Fully Aligned & Gap-Filled)

---

## 📊 Executive Summary

After analyzing our current image generator implementation against **Artlist AI Toolkit** and **LTX Studio**, significant UX/UI gaps have been identified. Our current interface is **monolithic, non-modular**, and visually **dated** (resembling a "2000s admin panel").

### 🎨 Senior Design Master Review (v3.1)

This proposal has been refined to prioritize a **"Premium Studio" Visual Strategy**. We are moving away from standard form inputs to a modern, immersive creative environment.

**Key Strategic Refinements:**
1.  **Visual Overhaul ("Make it Sexy")**: Glassmorphism, Floating UI, and Visual Selectors (Icons > Text).
2.  **Floating Command Center**: Moving the prompt interaction to a floating bottom bar (LTX style).
3.  **Incremental Delivery**: Prioritize visual quick wins immediately (Phase 0).
4.  **Pragmatic Schema**: Start with 4-6 models, then scale.
5.  **Explicit Modes**: Keep Generate/Edit tabs separate but visually consistent.

---

## 🔍 Competitive Analysis & Benchmarking

### Artlist AI Toolkit
**Analysis**:
- **Strengths**: Extremely clean, dark mode aesthetic. Options are hidden until needed.
- **Key Features**:
    - **Resizable/expandable prompt textarea** (drag handle, grows vertically).
    - **Model selector as modal popup** with search + filters + capability badges.
    - **Dynamic options**: Fields appear/disappear based on model (e.g., negative prompt only for v3).
    - **Collapsible Advanced Options**: Progressive disclosure.
    - **Quick presets**: "Fast", "Quality", "Batch" buttons.

### LTX Studio
**Analysis**:
- **Strengths**: Immersive "Studio" feel. Controls float over the canvas.
- **Key Features**:
    - **Model-driven UI**: Selecting Pro vs Fast changes available options.
    - **Credit cost displayed** dynamically per model/resolution choice.
    - **Visual aspect ratio previews** (rectangles showing proportion, not just "16:9").
    - **Model badges**: PRO, FAST, BETA tags.
    - **Floating Prompt Bar**: Fixed at bottom, always accessible.

---

## 🚨 Current Issues in Our UI

1.  **Non-scalable**: Hardcoded for 2 models (O3/v3), impossible to add 500+ models.
2.  **Cluttered**: 20+ options always visible (cognitive overload).
3.  **Fixed prompt area**: Cannot resize for long prompts (max 140px!).
4.  **No model discovery**: Just a toggle, no way to browse/search models.
5.  **Duplicate code**: Generate + Edit are separate 500+ line components.
6.  **Visuals**: Hardcoded colors (`bg-white`), standard dropdowns, looks like a form.

---

## 🎯 Strategic Pivot: The "Premium Studio" Visual Strategy

To bridge the gap between our current "functional" UI and the "premium" feel of LTX/Artlist, we will implement a significant visual overhaul immediately.

### 1. Floating Prompt Bar (The "Command Center")
Instead of a static form field at the top or side, the prompt area becomes a **floating glass bar** at the bottom center of the screen.
- **Behavior**: Always accessible, expands vertically as you type.
- **Integration**: The "Generate" button is integrated into the right side.
- **Aesthetic**: `bg-background/80` or `bg-card/80` with `backdrop-blur-md` and `border-white/10`.

### 2. Visual Selectors > Dropdowns
Creatives think in visuals. We will replace standard `<Select>` dropdowns with **Visual Grid Menus**.
- **Aspect Ratio**: Row of clickable icons (Square, Portrait, Landscape).
- **Resolution**: A segmented control `[ 1K | 2K | 4K ]`.
- **Feedback**: Active state uses `ring-2 ring-primary` and `bg-accent`.

### 3. Modern Typography & Glass UI
- **Font**: `text-sm font-medium tracking-tight` for a dense, professional tool feel.
- **Glassmorphism**: Use semi-transparent backgrounds (`bg-black/40` or `bg-card/60`) with `backdrop-blur-md`.
- **Borders**: Subtle `border-white/10` or `border-border/50`.

---

## 🏗️ Detailed Feature Specifications

### Feature 1: Model Selector with Discovery UX

**Design**: A rich **Modal Popup** (inspired by Artlist).

**User Flow**:
1.  **Trigger**: Click "Model: Kling O3" button in the floating bar.
2.  **Modal Content**:
    - **Search bar** at top (filter by name).
    - **Category tabs**: All | Image | Video | Audio | Favorites.
    - **Filter buttons**: Fast | Quality | Multi-image | Negative Prompt | 4K.
    - **Model grid** (3-4 columns).
3.  **Model Card**:
    - **Thumbnail**: Example generation.
    - **Badges**: "PRO", "FAST", "NEW".
    - **Capabilities Icons**: 🖼️ Multi-image, ⛔ Negative prompt, 📐 All aspects.
    - **Cost**: "⚡ 10 credits".

**Code Structure (Schema)**:
```typescript
interface ModelSchema {
  id: string;
  name: string;
  badges: ("PRO" | "FAST" | "NEW")[];
  description: string;
  creditCost: number;
  capabilities: {
    multiImage: boolean;
    negativePrompt: boolean;
    maxResolution: "2K" | "4K";
  };
  // ... params definition
}
```

**Benefits**: Scales to 500+ models, clear discovery, reduces cognitive load.

---

### Feature 2: Floating Command Bar (Replaces Static Prompt)

**Design**: A floating glass bar at the bottom of the viewport.

**Specs**:
- **Layout**: `[ Prompt Input ] [ Generate Button ]`
- **Position**: `fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl z-50`
- **Behavior**:
    - Expands upwards as user types (max height 40vh).
    - Contains "Quick Action" buttons (e.g., "Add Ref Image").
- **Aesthetic**: `backdrop-blur-xl`, `rounded-2xl`, `border-white/10`, `shadow-2xl`.

**Component Structure**:
```tsx
<FloatingPromptBar>
  <div className="glass-panel flex items-end p-2 gap-2 rounded-xl">
    <TextareaAutosize 
      className="bg-transparent border-none focus:ring-0 resize-none min-h-[44px]"
      placeholder="Describe your image..."
    />
    <Button size="icon" className="h-10 w-10 rounded-lg">
      <SparklesIcon />
      <span className="sr-only">Generate</span>
      <span className="text-[10px] opacity-70 ml-1">10c</span>
    </Button>
  </div>
</FloatingPromptBar>
```

**Benefits**: Modern feel, focuses user on creation, always accessible.

---

### Feature 3: Dynamic Visual Options Panel

**Design**: Controls that adapt to the model, using **Icons** instead of text.

**Visual Types**:
1.  **Icon Select**: For Aspect Ratio (Square, Portrait, Landscape icons).
2.  **Segmented Control**: For Resolution or Mode (Fast/Quality).
3.  **Toggle Pill**: For boolean options (e.g., "Private Mode").
4.  **Slider**: For numeric values (Strength, CFG).

**Schema Definition**:
```typescript
params: {
  aspectRatio: {
    type: "icon-select",
    options: [
      { value: "1:1", icon: "Square", label: "Square" },
      { value: "16:9", icon: "Landscape", label: "Landscape" },
      { value: "9:16", icon: "Portrait", label: "Portrait" }
    ],
    default: "16:9"
  },
  resolution: {
    type: "segmented",
    options: ["1K", "2K", "4K"],
    default: "2K"
  }
}
```

**Benefits**: Visual clarity, less reading, cleaner UI.

---

### Feature 4: Smart Refs UI (Edit Mode)

**Design**: Two-zone reference panel.

**Layout**:
1.  **Selected Refs Panel** (top):
    - Row of thumbnails with clear `@Image1`, `@Image2` labels.
    - Drag to reorder.
    - "X" button to remove.
2.  **Add Refs Section** (expandable):
    - **Tab 1: Upload** (drag & drop zone).
    - **Tab 2: History** (grid of past generations).

**Visuals**: Glass panel floating above the prompt bar in Edit mode.

**Benefits**: Clear indication of inputs for Image-to-Image models.

---

### Feature 5: Unified "Glass" Interface Architecture

**Design**:
- **Generate Tab**: Shows Model Selector + Floating Prompt Bar.
- **Edit Tab**: Adds the "Smart Refs UI" panel above the prompt bar.
- **Shared Components**: Both tabs use the same `FloatingOptionsPanel` and `FloatingPromptBar`.

**Rationale**: Keeps modes explicit (Generate vs Edit) but shares 90% of the UI code and visual language.

---

## 🎨 Design System Compliance

### Color Tokens (Violations Found & Fixes)

| Current | Violation | Correct Token |
|---------|-----------|---------------|
| `bg-white` | Hardcoded | `bg-background` or `bg-card` |
| `text-white` | Hardcoded | `text-foreground` |
| `text-gray-400` | Hardcoded | `text-muted-foreground` |
| `border-gray-600` | Hardcoded | `border-border` |
| `bg-black/50` | Hardcoded | `bg-black/40` (Glass) |

### Touch Targets
- **Requirement**: All interactive elements must be `min-h-[44px]` and `min-w-[44px]`.
- **Fix**: Update all icon buttons and inputs to meet this WCAG standard.

### Typography
- **Body**: `text-sm leading-6` (Inter/Sans).
- **Labels**: `text-xs font-medium uppercase tracking-wider text-muted-foreground`.
- **Input**: `text-base` (to prevent zoom on mobile) or `text-sm` with `leading-relaxed`.

### Glassmorphism Rules
- **Background**: `bg-background/60` or `bg-card/40`.
- **Blur**: `backdrop-blur-md` or `backdrop-blur-xl`.
- **Border**: `border border-white/10`.
- **Shadow**: `shadow-lg` or `shadow-glass`.

---

## 📐 Wireframes (ASCII)

### Proposed Layout: Generate Mode (Floating Bar)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [MyShortReel]         [Generate | Edit]           [Credits: 150]       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [ Main Canvas / Preview Area ]                                         │
│                                                                         │
│   (Empty State or Last Generated Image)                                 │
│                                                                         │
│                                                                         │
│                                                                         │
│  ┌─ Floating Options (Glass) ────────────────────────────────────────┐  │
│  │ Model: [Kling O3 ▼]   Aspect: [□] [▯] [▭]   Res: [1K] [2K]        │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─ Floating Prompt Bar (Glass) ─────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  A cinematic shot of a futuristic city...                 [Gen]   │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Proposed Layout: Edit Mode (Smart Refs + Floating Bar)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [MyShortReel]         [Generate | Edit]           [Credits: 150]       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [ Main Canvas / Preview Area ]                                         │
│                                                                         │
│  ┌─ Smart Refs Panel (Glass) ────────────────────────────────────────┐  │
│  │  Selected: [ @Img1 ] [ @Img2 ]  [ + Add Ref ]                     │  │
│  │  (Drag to reorder)                                                │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─ Floating Prompt Bar (Glass) ─────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Modify @Img1 to look like a painting...                  [Gen]   │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Roadmap (80/20 Strategy)

### ⚡ Phase 0: Visual & UX Quick Wins (THIS WEEK — 7.5 hours)

**Goal**: Ship immediate visual upgrades ("Make it Sexy") while building schema system in parallel.

#### 0.1 Floating Prompt Bar (2 hours) 🔥
- **Task**: Create `FloatingPromptBar` component.
- **Specs**: Fixed bottom, glass style, auto-expanding textarea.
- **Refactor**: Remove old prompt area from `InputSection`.
- **Impact**: Immediate "modern app" feel.

#### 0.2 Visual Selectors (1.5 hours) 🔥
- **Task**: Create `VisualSelect` component.
- **Specs**: Accepts icon/label pairs, renders as grid or segmented control.
- **Apply**: Replace Aspect Ratio and Resolution dropdowns.
- **Impact**: Visual > Text-based controls.

#### 0.3 Modern Typography & Glass UI (1.5 hours) 🔥
- **Task**: Update `InputSection` container styles.
- **Specs**: Apply `backdrop-blur-md`, `bg-card/60`, `border-white/10`.
- **Typography**: Update all labels to `text-sm font-medium`.
- **Impact**: Premium aesthetic matching LTX/Artlist.

#### 0.4 Resizable Prompt Logic (1 hour)
- **Task**: Ensure `FloatingPromptBar` handles long text correctly.
- **Specs**: Max height 40vh, scrollable internal, character count.
- **Impact**: Usability for long prompts.

#### 0.5 Quick Presets (1 hour) — **NEW**
- **Task**: Add "Quick Settings" buttons above options.
- **Specs**: "Fast", "Quality", "Batch".
- **Code**:
  ```tsx
  <div className="flex gap-2 mb-4">
    <Button variant="outline" size="sm" onClick={() => applyPreset('fast')}>⚡ Fast</Button>
    <Button variant="outline" size="sm" onClick={() => applyPreset('quality')}>💎 Quality</Button>
  </div>
  ```
- **Impact**: One-click configuration for 80% of use cases.

#### 0.6 Credit Cost Display (0.5 hours) — **NEW**
- **Task**: Add dynamic credit cost badge to Generate button.
- **Specs**: Updates based on model/resolution selection.
- **Impact**: Transparency (LTX feature).

**Total**: ~7.5 hours | **Result**: UI feels **100% better** (Modern & Sexy)

---

### Phase 1: Schema Foundation (Week 1-2)

**⚠️ TECHNICAL WARNING**: Start simple. Do NOT implement complex types like `color-picker` or `slider` in Phase 1. Stick to `text`, `number`, `select`, and `toggle` to avoid overengineering.

#### 1.1 Model Schema System
- **Task**: Define `ModelSchema` interface in `types/schema.ts`.
- **Task**: Create `constants/modelSchemas.ts` with 4 initial models.
- **Deliverable**: Typed schema system.

#### 1.2 Dynamic Options Panel
- **Task**: Create `OptionsPanel` component.
- **Task**: Implement `DynamicField` renderer (supporting visual types).
- **Task**: Add collapsible "Advanced" section.
- **Deliverable**: Panel that renders from JSON schema.

---

### Phase 2: Model Discovery (Week 2-3)

#### 2.1 Model Selector Modal
- **Task**: Build `ModelSelector` dialog (shadcn/ui).
- **Task**: Implement `ModelGrid` and `ModelCard`.
- **Task**: Add search and filtering logic.
- **Deliverable**: Full discovery UX.

#### 2.2 Expand Model Schemas
- **Task**: Add schemas for top 20 fal.ai models.
- **Task**: Verify parameters and capabilities.

---

### Phase 3: Edit Mode Refinement (Week 3-4)

#### 3.1 Smart Refs UI
- **Task**: Build `RefsPanel` component (glass style).
- **Task**: Implement drag-and-drop for references.
- **Task**: Integrate history picker.

#### 3.2 Unified OptionsPanel
- **Task**: Refactor `ImageEditPanel` to use shared `OptionsPanel`.
- **Task**: Ensure explicit tab switching works smoothly.

---

## 📊 Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| **Visual Quality** | "2000s Admin Panel" | "2026 Creative Studio" |
| Models supported | 2 | 500+ |
| Time to add model | 2-4 hours | 5-10 min |
| Prompt resizable | ❌ | ✅ (Floating) |
| Model discovery | ❌ | ✅ (Visual Modal) |
| Touch Targets | <44px (Violations) | All >44px |
| **Lines of Code** | ~1145 (Duplicate) | ~550 (Modular) |

---

## 🔚 Conclusion

Our current image generator UI is functional but visually outdated and non-scalable. By adopting a **"Premium Studio" visual strategy** (Phase 0) alongside a **Schema-Driven Architecture** (Phase 1+), we will transform it into a world-class creative tool.

**Immediate Next Step**: Start Phase 0.1 (Floating Prompt Bar) today.

---

**Document Version**: 3.1 (Fully Aligned & Gap-Filled)  
**Last Updated**: February 13, 2026  
**Status**: 📋 PROPOSAL — Ready for Execution  
**Review By**: Senior Design Master
