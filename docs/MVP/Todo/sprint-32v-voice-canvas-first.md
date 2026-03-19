# Sprint 32v: Voice Generator Canvas-First UI Rebuild — "Floating Studio Alignment"

**Date**: February 19, 2026
**Status**: ✅ SUPERSEDED & COMPLETE — Fully implemented via Sprint 35 (March 1, 2026) + Sprint 36 (March 1, 2026)
**Estimated Time**: ~16 hours
**Goal**: Align Voice Generator UI/UX with Image Generator's "Floating Studio" canvas-first design pattern established in Sprint 30c.
**Reference Implementation**: Image Generator (Sprint 30c) — `components/image-generator/`, `app/[locale]/tools/image-generator/`
**Analysis**: Design Master Report (February 19, 2026) — See appendix below
**QA Strategy**: **2-Step QA** — (1) TypeScript `npx tsc --noEmit`, (2) Biome `npx biome check --write <files>` for every task. i18n tasks add `pnpm translate` then `pnpm i18n:verify`. No task merges without passing its QA block.

---

## 🚨 Executive Summary: Why This Sprint is Critical

The Voice Generator currently uses a **traditional page layout** (grid-based, in-flow content) while the Image Generator uses a **canvas-first floating studio** architecture (full-screen canvas with overlay controls). This creates:

### ❌ Current Problems

1. **UX Inconsistency**: Users experience two completely different UI paradigms when switching tools
2. **Architectural Mismatch**: No z-index layering, no floating overlays, no canvas concept
3. **Mobile-First Violations**: In-flow panels instead of adaptive drawers, missing touch feedback
4. **Accessibility Gaps**: Button tabs instead of shadcn Tabs (no keyboard navigation), untranslated ARIA labels
5. **Design System Drift**: Glass panels exist but aren't floating, inconsistent component patterns

### ✅ After Sprint 32v

- **Canvas-First**: Audio player waveform/playback as full-screen canvas (z-0)
- **Floating Prompt Bar** (z-40, bottom-center): Textarea + inline pills + generate button
- **Floating Mode Tabs** (z-40, top-center): shadcn Tabs (Generate | Record) with keyboard nav
- **Floating Options Panel** (z-30, right-side): Desktop overlay + mobile drawer pattern
- **Floating History** (z-30, bottom-left): Glass trigger button + AdaptiveModal
- **100% Design System Compliant**: Glass aesthetic, semantic tokens, touch feedback, safe areas

---

## 🎨 DESIGN SYSTEM & MOBILE-FIRST ALIGNMENT (MANDATORY)

**CRITICAL**: All modifications must follow [.cursor/agents/design-master.md](../../.cursor/agents/design-master.md) and [.cursor/agents/mobile-first-guardian.md](../../.cursor/agents/mobile-first-guardian.md).

### Visual Strategy ("Floating Studio")

- **Glassmorphism**: `bg-background/60` or `bg-card/60` with `backdrop-blur-md` and `border-border/50`.
- **Floating UI**: All controls float above the canvas as overlay layers.
- **Typography**: Labels `text-sm font-medium tracking-tight`; inputs `text-base`; body `leading-relaxed`.
- **Transitions**: Use `transition-smooth` utility (not raw `transition-all duration-*`). All animations ≤ 500ms.

### Design Token Compliance (design-master)

| Replace | With (Semantic Token) |
| :--- | :--- |
| `border-white/10` | `border-border/50` |
| `bg-white` | `bg-background` or `bg-card` |
| `text-white` | `text-foreground` |
| `text-gray-400` | `text-muted-foreground` |
| `border-gray-600` | `border-border` |
| `bg-black/*` | `bg-background/80` or `bg-card/60` (glass) |
| `shadow-2xl` (floating panels) | `shadow-lg` (consistent) |
| `transition-all duration-200` | `transition-smooth` |

### Standardized Glass Effect (all floating panels)

All floating panels **must** use this consistent glass style:
```
backdrop-blur-md bg-background/60 border border-border/50 shadow-lg rounded-xl
```

Do **not** mix `backdrop-blur-xl` / `backdrop-blur-md` or `shadow-2xl` / `shadow-lg` across panels.

### Z-Index Stacking Context (MANDATORY)

Multiple fixed layers require a defined stacking order:

| Layer | Component | z-index | Notes |
| :--- | :--- | :--- | :--- |
| 0 | Canvas / Audio Player | `z-0` | Full-screen background |
| 30 | `FloatingOptionsPanel` / History trigger | `z-30` | Side/bottom overlays |
| 40 | `PremiumTabSystem` | `z-40` | Top navigation |
| 40 | `FloatingPromptBar` | `z-40` | Bottom prompt (non-overlapping with tabs) |
| 50 | Modal overlays (`VoiceModelSelector`, `AdaptiveModal`) | `z-50` | Via shadcn Dialog/Drawer |
| 60 | Recording overlay (if needed) | `z-60` | Voice recording panel |

### Mobile-First CSS Approach (mobile-first-guardian)

- **Base styles = mobile (320px)**. Enhance with `sm:`, `md:`, `lg:`.
- **Touch targets**: All interactive elements **min-h-[44px] min-w-[44px]** (WCAG 2.1 AA).
- **Touch feedback**: All buttons include `active:scale-95` state.
- **Inputs**: `text-base` (16px min) to prevent iOS zoom.
- **Safe areas**: Bottom panels use `pb-[env(safe-area-inset-bottom)]`.
- **Device detection**: Use `useDevice()` from `@/contexts/DeviceContext` — **not** legacy `useMobile()`.
- **Adaptive components**: Use `AdaptiveModal` for panels that become bottom-sheet drawers on mobile.
- **Breakpoints**: sm 640px, md 768px, lg 1024px. Layout works at **320px+** (iPhone SE).

### shadcn/ui Components (design-master)

- Use `Button` from `@/components/ui/button` (not raw `<button>`) with variants `default` | `secondary` | `outline` | `ghost` and sizes `default` | `sm` | `lg` | `icon`.
- Use `Tabs` / `TabsList` / `TabsTrigger` from `@/components/ui/tabs` for tab navigation (provides ARIA roles, keyboard arrow nav, focus management).
- Use `Collapsible` / `CollapsibleTrigger` / `CollapsibleContent` for expand/collapse.
- Use `Dialog` for modals; `Drawer` (via `AdaptiveModal`) for mobile overlays.
- Use `Skeleton` from `@/components/ui/skeleton` for loading states.

---

## ✅ i18n MASTER ALIGNMENT (MANDATORY)

All UI text **must** follow [.cursor/agents/i18n-master.md](../../.cursor/agents/i18n-master.md): `useTranslations("voice_generator")`, ICU for plurals/variables, `Link` from `@/i18n/routing`.

### New i18n Keys to Add

All keys go under the `voice_generator` namespace in `messages/en.json`.

#### Component UI Keys

| Key | Value | Format | Task |
| :--- | :--- | :--- | :--- |
| `floating_prompt_placeholder` | `"Enter your script or text to convert to speech..."` | plain | 1 |
| `options_panel_title` | `"Voice Settings"` | plain | 2 |
| `options_panel_collapse` | `"Hide Settings"` | plain | 2 |
| `options_panel_expand` | `"Show Settings"` | plain | 2 |
| `tabs_aria_label` | `"Generate or Record"` | plain | 3 |
| `history_trigger_aria` | `"Open voice library"` | plain | 4 |
| `options_trigger_aria` | `"Open voice settings"` | plain | 2 |
| `canvas_empty_title` | `"No recordings yet"` | plain | 1 |
| `canvas_empty_description` | `"Generate your first voice or record audio to get started"` | plain | 1 |
| `playback_play_aria` | `"Play audio"` | plain | 5 |
| `playback_pause_aria` | `"Pause audio"` | plain | 5 |
| `playback_delete_aria` | `"Delete recording"` | plain | 5 |

#### Voice Library Keys (Translate hardcoded English)

| Key | Value | Current Hardcoded | Task |
| :--- | :--- | :--- | :--- |
| `library.play_aria` | `"Play"` | `"Play"` (line 153) | 5 |
| `library.pause_aria` | `"Pause"` | Inferred | 5 |
| `library.delete_aria` | `"Delete"` | `"Delete"` (line 168) | 5 |

---

## 🏗️ New Architecture

```
Root: VoiceGenerator (full screen, relative container)
├── Layer 0 (Canvas): Audio Player Canvas — full width/height, centered
│   ├── Waveform visualization (generated voices)
│   ├── Playback controls (play/pause, timeline, volume)
│   └── Empty state when no recordings
├── Layer 1 (Top): PremiumTabSystem — fixed top center (z-40)
│   ├── Generate | Record tabs (shadcn Tabs)
│   └── Optional: Model selector trigger
├── Layer 2 (Bottom): FloatingPromptBar — fixed bottom center (z-40)
│   ├── TextareaAutosize for script input
│   ├── Inline pills (model, voice, emotion, speed)
│   └── Generate button with credit cost
├── Layer 3 (Overlay): FloatingOptionsPanel — fixed right on desktop, Drawer on mobile (z-30)
│   ├── Voice settings (voice ID, emotion, speed, etc.)
│   └── Advanced settings (collapsible)
├── Layer 4 (Trigger): History Access — fixed bottom-left (z-30)
│   └── Opens VoiceLibrary via AdaptiveModal
├── Layer 5 (Recording): VoiceRecordingPanel — overlay when mode = "record" (z-60)
│   ├── Waveform, record button, preview
│   └── Floating over canvas, not in-flow
└── Layer 6+ (Modals): VoiceModelSelector, VoiceLibrary, ProjectSelector (z-50+)
```

---

## 📋 Task List

### Task 1: Dismantle Grid Layout & Unify Canvas (3 h)

**Objective**: Remove the traditional page grid and create a full-screen audio canvas. Establish z-index layering foundation.

**Files to Modify**:
- `components/voice-generator/index.tsx` (major refactor)
- Create: `components/voice-generator/CanvasSection.tsx` (optional — audio player canvas)

**Implementation**:

#### 1a. Remove Traditional Page Layout

- Remove `max-w-7xl mx-auto p-4 md:p-6 lg:p-8` container (line 234)
- Remove header section (lines 236-275) — model/history buttons will become floating triggers
- Remove mode tab Button pair (lines 278-294) — will become PremiumTabSystem
- Remove `lg:grid-cols-3` grid layout (line 297)
- Remove right column "Recent Voices" preview (lines 335-364) — redundant with history modal
- Make root container fill available space: `relative w-full min-h-[calc(100vh-64px)] bg-background select-none`

#### 1b. Migrate to `useDevice()`

- Add `import { useDevice } from "@/contexts/DeviceContext"`
- Add `const { isMobile, orientation } = useDevice()` (line 49 already has user)
- Use `isMobile` for responsive logic (instead of media queries where applicable)

#### 1c. Create Canvas Layer (z-0)

Create `CanvasSection.tsx` (similar to Image Generator's `OutputSection`):
```tsx
"use client";

import { Play, Pause, Volume2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CanvasSectionProps {
  audioUrl?: string | null;
  waveformData?: number[]; // Optional waveform visualization
  onDelete?: () => void;
  isLoading?: boolean;
}

export function CanvasSection({ audioUrl, waveformData, onDelete, isLoading }: CanvasSectionProps) {
  const t = useTranslations("voice_generator");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Empty state
  if (!audioUrl && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <Volume2 className="size-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-medium text-foreground mb-2">{t("canvas_empty_title")}</h2>
        <p className="text-sm text-muted-foreground max-w-md">{t("canvas_empty_description")}</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Audio player
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      {/* Waveform visualization (optional future enhancement) */}
      {waveformData && (
        <div className="w-full max-w-3xl h-32 flex items-end gap-1 mb-8">
          {waveformData.map((height, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/30 rounded-t-sm transition-all"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      )}

      {/* Audio element */}
      <audio
        ref={audioRef}
        src={audioUrl || ""}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Playback controls */}
      <div className="flex items-center gap-4">
        <Button
          variant="default"
          size="icon"
          onClick={togglePlayPause}
          className="size-16 rounded-full active:scale-95 transition-smooth"
          aria-label={isPlaying ? t("playback_pause_aria") : t("playback_play_aria")}
        >
          {isPlaying ? <Pause className="size-6" /> : <Play className="size-6 ml-1" />}
        </Button>
        {onDelete && (
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            className="min-h-[44px] min-w-[44px] rounded-full active:scale-95 transition-smooth"
            aria-label={t("playback_delete_aria")}
          >
            <Trash2 className="size-5" />
          </Button>
        )}
      </div>

      {/* Timeline */}
      <div className="w-full max-w-3xl mt-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
```

Wire into `index.tsx`:
```tsx
<div className="relative w-full min-h-[calc(100vh-64px)] bg-background select-none">
  {/* Layer 0: Canvas */}
  <div className="absolute inset-0 z-0">
    <CanvasSection
      audioUrl={selectedAudio?.url}
      isLoading={isGenerating}
      onDelete={() => handleDeleteRecording(selectedAudio?.id)}
    />
  </div>

  {/* Layers 1-6 added in subsequent tasks */}
</div>
```

#### 1d. Establish Z-Index Layers

Add comments in `index.tsx` for each layer:
```tsx
{/* ── Layer 0: Canvas — CanvasSection fills the screen ── */}
{/* ── Layer 1 (z-40): PremiumTabSystem (Task 3) ── */}
{/* ── Layer 2 (z-40): FloatingPromptBar (Task 1e) ── */}
{/* ── Layer 3 (z-30): FloatingOptionsPanel (Task 2) ── */}
{/* ── Layer 4 (z-30): History trigger (Task 4) ── */}
{/* ── Layer 5+ (z-50+): Modals ── */}
```

#### 1e. Create Floating Prompt Bar (Stub)

Create `components/voice-generator/FloatingPromptBar.tsx`:
```tsx
"use client";

import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";

interface FloatingPromptBarProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  creditCost: number;
  canGenerate: boolean;
  isLoading?: boolean;
}

export function FloatingPromptBar({
  prompt,
  onPromptChange,
  onGenerate,
  creditCost,
  canGenerate,
  isLoading = false,
}: FloatingPromptBarProps) {
  const t = useTranslations("voice_generator");
  const PROMPT_MAX = 10000;

  return (
    <div className="fixed bottom-6 left-1/2 z-40 w-[90%] max-w-3xl -translate-x-1/2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-background/60 p-3 shadow-lg backdrop-blur-md">
        {/* Inline pills for model/voice/emotion (Task 2/3) */}
        
        {/* Prompt Input Row */}
        <div className="relative flex items-end gap-3">
          <TextareaAutosize
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={t("floating_prompt_placeholder")}
            maxLength={PROMPT_MAX}
            className="min-h-[44px] max-h-[40vh] flex-1 resize-none border-none bg-transparent p-2 text-base leading-relaxed focus:ring-0"
            minRows={1}
            maxRows={10}
            disabled={isLoading}
          />

          <Button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate || isLoading}
            aria-label={isLoading ? t("generating") : t("generate")}
            className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center gap-1 rounded-lg px-3 active:scale-95 transition-smooth"
          >
            {isLoading ? (
              <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <SparklesIcon className="size-4" />
            )}
            <span className="text-xs opacity-70">{creditCost}c</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

Wire into `index.tsx`:
```tsx
{/* ── Layer 2 (z-40): FloatingPromptBar ── */}
<FloatingPromptBar
  prompt={promptText}
  onPromptChange={setPromptText}
  onGenerate={handleGenerate}
  creditCost={creditCost}
  canGenerate={!!promptText.trim()}
  isLoading={isGenerating}
/>
```

#### 1f. Update State Management

- Extract prompt from VoiceSettingsPanel to top-level state: `const [promptText, setPromptText] = useState("")`
- Move `selectedSchema`, `params`, `setParams` to top level (already exists)
- Remove old layout state that's no longer needed

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/voice-generator/index.tsx components/voice-generator/CanvasSection.tsx components/voice-generator/FloatingPromptBar.tsx
```

---

### Task 2: FloatingOptionsPanel — Desktop Overlay + Mobile Drawer (3 h)

**Objective**: Create a floating glass overlay that wraps VoiceSettingsPanel, positioned as a side panel on desktop and a bottom-sheet drawer on mobile.

**Files to Create/Modify**:
- Create: `components/voice-generator/FloatingOptionsPanel.tsx`
- Modify: `components/voice-generator/VoiceSettingsPanel.tsx` (remove outer glass-panel, fix advanced toggle)
- Modify: `components/voice-generator/index.tsx` (wire in)

**Implementation**:

#### 2a. Create FloatingOptionsPanel Component

Create `components/voice-generator/FloatingOptionsPanel.tsx` (mirror image generator pattern):
```tsx
"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useDevice } from "@/contexts/DeviceContext";
import { VoiceSettingsPanel } from "./VoiceSettingsPanel";
import type { VoiceModelSchema } from "./hooks/use-convex-voice-schemas";

interface FloatingOptionsPanelProps {
  schema: VoiceModelSchema;
  params: Record<string, unknown>;
  onParamsChange: (params: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function FloatingOptionsPanel({
  schema,
  params,
  onParamsChange,
  disabled,
}: FloatingOptionsPanelProps) {
  const t = useTranslations("voice_generator");
  const { isMobile, orientation } = useDevice();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLandscape = orientation === "landscape";

  /* ── Mobile: Floating trigger + Drawer via AdaptiveModal ── */
  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-28 right-4 z-30 min-h-[44px] min-w-[44px] rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg active:scale-95 transition-smooth"
          aria-label={t("options_trigger_aria")}
        >
          <SlidersHorizontal className="size-5" />
        </Button>

        <AdaptiveModal
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          title={t("options_panel_title")}
        >
          <div
            className={`${isLandscape ? "max-h-[80vh]" : "max-h-[60vh]"} overflow-y-auto px-1`}
          >
            <VoiceSettingsPanel
              schema={schema}
              params={params}
              onParamsChange={onParamsChange}
              disabled={disabled}
              hidePrompt // Prompt is in FloatingPromptBar
            />
          </div>
        </AdaptiveModal>
      </>
    );
  }

  /* ── Desktop: Floating side panel (right) with collapse ── */
  return (
    <div className="hidden md:block fixed top-24 right-6 w-80 z-30">
      <Collapsible
        open={!collapsed}
        onOpenChange={(open) => setCollapsed(!open)}
      >
        <div className="rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg overflow-hidden">
          {/* Header with collapse toggle */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <span className="text-sm font-medium tracking-tight text-foreground">
              {t("options_panel_title")}
            </span>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] px-3 text-sm text-muted-foreground hover:text-foreground active:scale-95 transition-smooth"
              >
                {collapsed
                  ? t("options_panel_expand")
                  : t("options_panel_collapse")}
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* Collapsible content */}
          <CollapsibleContent>
            <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              <VoiceSettingsPanel
                schema={schema}
                params={params}
                onParamsChange={onParamsChange}
                disabled={disabled}
                hidePrompt // Prompt is in FloatingPromptBar
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
```

#### 2b. Update VoiceSettingsPanel

Modify `components/voice-generator/VoiceSettingsPanel.tsx`:

1. Add `hidePrompt?: boolean` prop to conditionally hide prompt textarea
2. Remove outer glass-panel wrapper (parent provides glass context now)
3. Replace `<details>` with `Collapsible` for advanced settings:

```tsx
// BEFORE (lines 113-133)
<details className="group">
  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors leading-relaxed">
    {t("settings.advanced")}
  </summary>
  <div className="mt-3 space-y-3">
    {schema.params.filter((p) => p.advanced).map((param) => (
      <DynamicField ... />
    ))}
  </div>
</details>

// AFTER
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const [advancedOpen, setAdvancedOpen] = useState(false);

<Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
  <CollapsibleTrigger asChild>
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-between min-h-[44px] text-sm font-medium text-muted-foreground hover:text-foreground active:scale-95 transition-smooth"
    >
      {t("settings.advanced")}
      <ChevronDown className={cn("size-4 transition-transform", advancedOpen && "rotate-180")} />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="mt-3 space-y-3">
      {schema.params.filter((p) => p.advanced).map((param) => (
        <DynamicField ... />
      ))}
    </div>
  </CollapsibleContent>
</Collapsible>
```

4. Update prompt section to be conditional:
```tsx
{/* Text Input (Prompt/Script) */}
{!hidePrompt && promptParam && (
  <div className="space-y-2">
    {/* ... existing prompt textarea ... */}
  </div>
)}
```

#### 2c. Wire into index.tsx

Add in Layer 3 section:
```tsx
{/* ── Layer 3 (z-30): Floating Options ── */}
{selectedSchema && (
  <FloatingOptionsPanel
    schema={selectedSchema}
    params={params}
    onParamsChange={setParams}
    disabled={isGenerating}
  />
)}
```

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/voice-generator/FloatingOptionsPanel.tsx components/voice-generator/VoiceSettingsPanel.tsx components/voice-generator/index.tsx
```

---

### Task 3: PremiumTabSystem Fix & ModelSelector Trigger (2.5 h)

**Objective**: Create floating tab system with shadcn Tabs for Generate/Record modes and wire model selector trigger.

**Files to Create/Modify**:
- Create: `components/voice-generator/PremiumTabSystem.tsx`
- Modify: `components/voice-generator/index.tsx` (wire in)
- Modify: `components/voice-generator/VoiceModelSelector.tsx` (verify opens correctly)

**Implementation**:

#### 3a. Create PremiumTabSystem Component

Create `components/voice-generator/PremiumTabSystem.tsx` (mirror image generator):
```tsx
"use client";

import { Mic, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDevice } from "@/contexts/DeviceContext";

export interface PremiumTabSystemProps {
  mode: "generate" | "record";
  setMode: (mode: "generate" | "record") => void;
  /** Display name of the currently selected model. */
  selectedModelName?: string;
  /** Opens the VoiceModelSelector modal. */
  onModelSelectorOpen?: () => void;
  /**
   * Whether to show the model selector button.
   * Set to false when model selection is handled elsewhere (e.g., inline pills).
   * Default: true for backward compatibility.
   */
  showModelSelector?: boolean;
}

/** Premium floating glassmorphic tab bar for Generate | Record with model selector trigger. */
export function PremiumTabSystem({
  mode,
  setMode,
  selectedModelName,
  onModelSelectorOpen,
  showModelSelector = true,
}: PremiumTabSystemProps) {
  const t = useTranslations("voice_generator");
  const { isMobile, orientation } = useDevice();
  const isLandscapeMobile = isMobile && orientation === "landscape";

  // Only show model button if enabled and not in landscape mobile
  const shouldShowModelButton =
    showModelSelector && onModelSelectorOpen && !isLandscapeMobile;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 top-16 sm:top-20 md:top-24 z-40">
      <div className="flex items-center gap-3 rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg p-1 max-w-[calc(100vw-2rem)] w-max">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "generate" | "record")}
        >
          <TabsList
            className="bg-transparent"
            aria-label={t("tabs_aria_label")}
          >
            <TabsTrigger
              value="generate"
              className="min-h-[44px] px-3 py-2 sm:px-4 rounded-lg transition-smooth active:scale-95
                data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/50"
            >
              {isLandscapeMobile ? (
                <Sparkles className="size-4" aria-hidden />
              ) : (
                t("tab_generate")
              )}
            </TabsTrigger>
            <TabsTrigger
              value="record"
              className="min-h-[44px] px-3 py-2 sm:px-4 rounded-lg transition-smooth active:scale-95
                data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/50"
            >
              {isLandscapeMobile ? (
                <Mic className="size-4" aria-hidden />
              ) : (
                t("tab_record")
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Model Selector Trigger — Compact pill, hidden when pills handle it */}
        {shouldShowModelButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onModelSelectorOpen}
            className="min-h-[44px] min-w-0 max-w-[min(140px,50vw)] sm:max-w-none rounded-lg border-border/50 bg-background/40 active:scale-95 transition-smooth"
          >
            <span className="truncate max-w-[120px] sm:max-w-none">
              {selectedModelName || t("select_model_first")}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
```

#### 3b. Wire into index.tsx

Add in Layer 1 section:
```tsx
{/* ── Layer 1 (z-40): PremiumTabSystem ── */}
<PremiumTabSystem
  mode={mode}
  setMode={setMode}
  selectedModelName={selectedSchema?.name ?? t("loading_models")}
  onModelSelectorOpen={() => setModelSelectorOpen(true)}
  showModelSelector={true}
/>
```

#### 3c. Verify VoiceModelSelector

- Ensure modal state `modelSelectorOpen` exists (already does at line 42)
- Verify VoiceModelSelector dialog opens correctly (already wired at line 369)
- Add `active:scale-95` to any missing buttons in VoiceModelSelector

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/voice-generator/PremiumTabSystem.tsx components/voice-generator/VoiceModelSelector.tsx components/voice-generator/index.tsx
```

---

### Task 4: Floating History Access (1.5 h)

**Objective**: Replace header history button with floating glass trigger + AdaptiveModal pattern.

**Files to Modify**:
- `components/voice-generator/index.tsx` (add trigger)
- `components/voice-generator/VoiceLibrary.tsx` (migrate to AdaptiveModal, add active states)

**Implementation**:

#### 4a. Add Floating History Trigger

In `index.tsx`, add in Layer 4 section:
```tsx
{/* ── Layer 4 (z-30): History Trigger ── */}
<Button
  variant="ghost"
  size="icon"
  onClick={() => setHistoryOpen(true)}
  className="fixed bottom-28 left-4 z-30 min-h-[44px] min-w-[44px] rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg active:scale-95 transition-smooth md:bottom-6 md:left-6"
  aria-label={t("history_trigger_aria")}
>
  <History className="size-5" />
</Button>
```

#### 4b. Update VoiceLibrary to AdaptiveModal

Modify `components/voice-generator/VoiceLibrary.tsx`:

1. Replace `Dialog` pattern with `AdaptiveModal`:
```tsx
// BEFORE
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VoiceLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // ...
}

<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-h-[90vh] max-w-4xl ...">
    <DialogHeader><DialogTitle>{t("title")}</DialogTitle></DialogHeader>
    {/* History content */}
  </DialogContent>
</Dialog>

// AFTER
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal";

interface VoiceLibraryProps {
  isOpen: boolean; // Rename for consistency
  onClose: () => void; // Rename for consistency
  // ...
}

<AdaptiveModal isOpen={isOpen} onClose={onClose} title={t("library.title")}>
  {/* History content */}
</AdaptiveModal>
```

2. Update caller in `index.tsx`:
```tsx
// BEFORE (lines 377-385)
<VoiceLibrary
  open={historyOpen}
  onOpenChange={setHistoryOpen}
  history={history}
  // ...
/>

// AFTER
<VoiceLibrary
  isOpen={historyOpen}
  onClose={() => setHistoryOpen(false)}
  history={history}
  // ...
/>
```

#### 4c. Add Active States to VoiceLibrary Buttons

In `VoiceLibrary.tsx`, find all buttons and add `active:scale-95`:

```tsx
// Lines 152, 167, 196, 225 — add active:scale-95 to className
<Button ... className="... active:scale-95 transition-smooth">
```

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/voice-generator/VoiceLibrary.tsx components/voice-generator/index.tsx
```

---

### Task 5: i18n Hardening & Accessibility (3 h)

**Objective**: Translate all hardcoded ARIA labels, add new i18n keys for canvas/prompts, ensure 100% translation coverage.

**Files to Modify**:
- `components/voice-generator/VoiceLibrary.tsx` (translate ARIA labels)
- `components/voice-generator/CanvasSection.tsx` (verify translations)
- `components/voice-generator/index.tsx` (translate toast if needed)
- `messages/en.json` (add all new keys)

**Implementation**:

#### 5a. Translate Hardcoded ARIA Labels

In `VoiceLibrary.tsx`:

```tsx
// BEFORE (lines 153, 168)
aria-label={playingId === item._id ? "Pause" : "Play"}
aria-label="Delete"

// AFTER
const t = useTranslations("voice_generator"); // Already exists at line 48

aria-label={playingId === item._id ? t("library.pause_aria") : t("library.play_aria")}
aria-label={t("library.delete_aria")}
```

#### 5b. Add All New i18n Keys to messages/en.json

Add under `voice_generator` namespace:

```json
{
  "voice_generator": {
    // ... existing keys ...
    
    // New keys from Task 1
    "floating_prompt_placeholder": "Enter your script or text to convert to speech...",
    "canvas_empty_title": "No recordings yet",
    "canvas_empty_description": "Generate your first voice or record audio to get started",
    "playback_play_aria": "Play audio",
    "playback_pause_aria": "Pause audio",
    "playback_delete_aria": "Delete recording",
    
    // New keys from Task 2
    "options_panel_title": "Voice Settings",
    "options_panel_collapse": "Hide Settings",
    "options_panel_expand": "Show Settings",
    "options_trigger_aria": "Open voice settings",
    
    // New keys from Task 3
    "tabs_aria_label": "Generate or Record",
    
    // New keys from Task 4
    "history_trigger_aria": "Open voice library",
    
    // New keys from Task 5
    "library": {
      "play_aria": "Play",
      "pause_aria": "Pause",
      "delete_aria": "Delete"
    }
  }
}
```

#### 5c. Run Translation Pipeline

```bash
# Generate all 7 languages
pnpm translate

# Verify all keys present in all locales
pnpm i18n:verify
```

#### 5d. Verify No Hardcoded English Strings

Run search for common hardcoded patterns:
```bash
# Search for hardcoded English in voice-generator components
rg '"[A-Z][a-z]+ [a-z]+' components/voice-generator/ --type tsx --type ts

# Manually review results — all user-facing text should use t()
```

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/voice-generator/VoiceLibrary.tsx components/voice-generator/CanvasSection.tsx components/voice-generator/index.tsx

# Step 3: i18n verification
pnpm translate && pnpm i18n:verify
```

---

### Task 6: Cross-Component Mobile QA & Visual Polish (3 h)

**Objective**: End-to-end mobile-first QA pass. Verify all floating panels stack correctly at 320px, touch targets are enforced, safe areas are handled, and the glass aesthetic is consistent. Add missing active states throughout.

**Files to Modify**:
- All voice-generator components (comprehensive review)
- `components/voice-generator/VoiceRecordingPanel.tsx` (already has good 88px button, verify active states)
- `components/voice-generator/index.tsx` (final wiring verification)

**Implementation**:

#### 6a. Safe Area Handling

- `FloatingPromptBar`: Already has `pb-[env(safe-area-inset-bottom)]` (from Task 1e)
- `PremiumTabSystem`: Verify no overlap with status bar / Dynamic Island (should be fine at `top-16 sm:top-20 md:top-24`)

#### 6b. Landscape Orientation

- `PremiumTabSystem`: Already uses icon-only tabs on landscape mobile (from Task 3a)
- `FloatingOptionsPanel` drawer: Already uses `max-h-[80vh]` in landscape (from Task 2a)

#### 6c. Add Active States to All Buttons

**VoiceRecordingPanel** (already has on record button line 387, verify others):
```tsx
// Lines 373, 441, 447, 470 — verify active:scale-95 exists
<Button ... className="... active:scale-95 transition-smooth">
```

**ProjectSelector Modal** (lines 445-476 in index.tsx):
- Already uses shadcn Dialog, buttons should have active states
- Verify if imported from elsewhere, check that component

**Toast Notification** (lines 404-413):
```tsx
// Fix text-white token violation
// BEFORE
className={cn(
  "fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white transition-smooth ...",
  toast.type === "success" ? "bg-primary" : "bg-destructive",
)}

// AFTER
className={cn(
  "fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-smooth ...",
  toast.type === "success" ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground",
)}
```

#### 6d. 320px Visual QA

Test at iPhone SE width (320px):
- [ ] All floating panels render correctly
- [ ] No horizontal overflow
- [ ] Touch targets are all ≥ 44px (verify with dev tools)
- [ ] Text is readable (no `text-[10px]` on mobile — minimum `text-xs`)
- [ ] Floating options panel as drawer does not cover entire canvas (`max-h-[60vh]`)
- [ ] Prompt bar textarea is usable
- [ ] Tab bar doesn't wrap or overflow

#### 6e. Consistent Glass Aesthetic

Verify ALL floating elements use the standardized glass effect:
```tsx
backdrop-blur-md bg-background/60 border border-border/50 shadow-lg rounded-xl
```

Components to check:
- `FloatingPromptBar` ✅ (Task 1e)
- `FloatingOptionsPanel` desktop panel ✅ (Task 2a)
- `FloatingOptionsPanel` mobile trigger ✅ (Task 2a)
- `PremiumTabSystem` ✅ (Task 3a)
- History trigger ✅ (Task 4a)

#### 6f. Active Touch States Audit

Check ALL buttons for `active:scale-95`:
- [x] `FloatingPromptBar` generate button (Task 1e)
- [x] `FloatingOptionsPanel` trigger (Task 2a)
- [x] `FloatingOptionsPanel` collapse toggle (Task 2a)
- [x] `PremiumTabSystem` tabs (Task 3a)
- [x] `PremiumTabSystem` model button (Task 3a)
- [x] History trigger (Task 4a)
- [ ] `VoiceLibrary` play/delete buttons (Task 4c — should be done)
- [ ] `VoiceRecordingPanel` all buttons
- [ ] `CanvasSection` play/delete buttons
- [ ] Toast close button (if exists)

#### 6g. Focus Management

- **Escape key**: Close topmost overlay (VoiceModelSelector > FloatingOptionsPanel > History)
- **Tab order**: Canvas → Tabs → Prompt → Options trigger → History trigger → Modals
- **Focus ring**: `ring-primary` visible on all interactive elements
- **Modal focus trap**: AdaptiveModal handles this automatically (Radix UI)

#### 6h. Recording Panel Overlay (mode = "record")

When `mode === "record"`, ensure `VoiceRecordingPanel` renders as an overlay (z-60) above canvas, not in-flow:

```tsx
{/* ── Layer 5 (z-60): Recording Panel Overlay (Record mode only) ── */}
{mode === "record" && (
  <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-60 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[500px]">
    <div className="rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg p-4 md:p-6">
      <VoiceRecordingPanel
        onSave={handleSaveRecording}
        disabled={isGenerating}
      />
    </div>
  </div>
)}
```

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/voice-generator/*.tsx

# Step 3: Manual visual testing
# - Open in browser at 320px width
# - Test all interactive elements
# - Verify touch targets with dev tools
# - Test keyboard navigation (Tab, Arrow keys, Escape)
# - Test on iOS device (safe areas)
```

---

## 📱 Mobile-First Checklist (Per-Task)

Each task must verify these inline (not deferred to Task 6):

- [ ] Base CSS = mobile (320px), enhanced with `md:`, `lg:`.
- [ ] All interactive elements `min-h-[44px]` with `active:scale-95`.
- [ ] Inputs `text-base` (16px) to prevent iOS zoom.
- [ ] `useDevice()` used (not manual responsive logic).
- [ ] `AdaptiveModal` for panels that become drawers on mobile.
- [ ] No floating panel covers entire canvas on mobile.

---

## 🧪 Visual Regression Checklist

- [ ] **Is the grid gone?** No `lg:grid-cols-3` layout visible.
- [ ] **Is the canvas full-screen?** Audio player fills available space.
- [ ] **Is the prompt bar floating at the bottom?** Glass bar, always visible.
- [ ] **Are settings floating on the right (desktop)?** Glass overlay, collapsible.
- [ ] **Are settings a drawer on mobile?** Bottom-sheet via `AdaptiveModal`.
- [ ] **Can I select a model?** Visible trigger in tab area → Modal → Grid of voice models.
- [ ] **Does Record mode show floating panel?** Recording controls overlay canvas.
- [ ] **Is it Glass?** Consistent `backdrop-blur-md bg-background/60 border-border/50` on all floating elements.
- [ ] **320px?** Everything works on iPhone SE width.
- [ ] **Touch targets?** All buttons ≥ 44px, with `active:scale-95` feedback.
- [ ] **Matches Image Generator feel?** Same layering, same glass, same adaptive patterns.

---

## ⏱️ Task Dependencies

```
Task 1 (Canvas & Layout Teardown)
  ├── Task 2 (FloatingOptionsPanel) — needs render slot from Task 1
  ├── Task 3 (PremiumTabSystem & Model Trigger) — needs z-index context from Task 1
  └── Task 4 (Floating History) — needs layout foundation from Task 1
       └── Task 5 (i18n Hardening) — can run in parallel with Tasks 2-4
            └── Task 6 (Mobile QA & Polish) — final pass after all tasks
```

**Execution order**: Task 1 → Tasks 2, 3, 4 (parallel or sequential) → Task 5 → Task 6.

---

## 📝 PROGRESS SUMMARY

> **This sprint was never directly executed.** Its architectural goals were fully achieved by Sprint 35 + Sprint 36.

| Task | Description | Est. | Status | Implemented In |
| :--- | :--- | :--- | :--- | :--- |
| **Task 1** | Dismantle Grid Layout, Unify Canvas | 3h | ✅ DONE | Sprint 35 Tasks 2, 3, 5–9 |
| **Task 2** | FloatingOptionsPanel (Desktop Overlay + Mobile Drawer) | 3h | ✅ DONE | Sprint 35 Tasks 6, 7 |
| **Task 3** | PremiumTabSystem Fix & ModelSelector Trigger | 2.5h | ✅ DONE | Sprint 35 Tasks 5, 8 |
| **Task 4** | Floating History Access | 1.5h | ✅ DONE | Sprint 35 Task 9 |
| **Task 5** | i18n Hardening & Accessibility | 3h | ✅ DONE | Sprint 35 Task 4 + Sprint 36 Task D |
| **Task 6** | Cross-Component Mobile QA & Visual Polish | 3h | ✅ DONE | Sprint 35 Task 10 + post-review fixes |
| | **TOTAL** | **~16h** | ✅ COMPLETE | |

### Additional work beyond original scope (Sprint 36)
- Full model schema spec-parity: 17 params/MiniMax, 12 params/Qwen, all capability flags, `conditionalParams`
- `showWhen` conditional param rendering in `VoiceSettingsPanel`
- `VoiceModelCard` capability chip display
- `FloatingPromptBar.maxPromptLength` reads from schema (not hardcoded)
- Seed script made idempotent (clears old records before inserting)

---

## 📁 FILES CREATED / MODIFIED (SUMMARY)

| File | Action | Task(s) |
| :--- | :--- | :--- |
| `components/voice-generator/index.tsx` | **MODIFY** (major refactor — remove grid, wire floating panels, migrate `useDevice`, translate toasts) | 1, 2, 3, 4, 5, 6 |
| `components/voice-generator/CanvasSection.tsx` | **CREATE** (new — audio player canvas background) | 1 |
| `components/voice-generator/FloatingPromptBar.tsx` | **CREATE** (new — floating prompt input with inline pills) | 1 |
| `components/voice-generator/FloatingOptionsPanel.tsx` | **CREATE** (new — floating overlay wrapper for settings) | 2 |
| `components/voice-generator/VoiceSettingsPanel.tsx` | **MODIFY** (remove glass wrapper, add Collapsible for advanced, add hidePrompt prop) | 2 |
| `components/voice-generator/PremiumTabSystem.tsx` | **CREATE** (new — shadcn Tabs for Generate/Record modes) | 3 |
| `components/voice-generator/VoiceModelSelector.tsx` | **MODIFY** (verify wiring, ensure opens from trigger) | 3 |
| `components/voice-generator/VoiceLibrary.tsx` | **MODIFY** (migrate to AdaptiveModal, translate ARIA labels, add active states) | 4, 5 |
| `components/voice-generator/VoiceRecordingPanel.tsx` | **MODIFY** (verify active states, verify overlay rendering) | 6 |
| `messages/en.json` | **MODIFY** (add 12 new keys under `voice_generator`) | 5 |
| `messages/*.json` (6 other locales) | **AUTO** (via `pnpm translate`) | 5 |

---

## 🔍 PRE-SPRINT CHECKLIST

- [ ] **Branch**: Create `sprint-32v-voice-canvas-first` from current branch.
- [ ] **Environment**: `npx convex dev` is running.
- [ ] **Image Generator**: Sprint 30c complete and deployed (reference implementation).
- [ ] **Design tokens**: Review design-master token table above — no `border-white/10`, `bg-black/*`, `shadow-2xl` in new code.
- [ ] **i18n keys**: Existing `voice_generator` namespace ready. 12 new keys will be added.
- [ ] **Device context**: Verify `DeviceProvider` wraps the app (check layout or providers file).
- [ ] **Adaptive components**: Verify `AdaptiveModal` is importable from `@/components/adaptive/AdaptiveModal`.
- [ ] **shadcn/ui**: Verify `Tabs`, `TabsList`, `TabsTrigger`, `Collapsible` exist.
- [ ] **react-textarea-autosize**: Verify installed (used in FloatingPromptBar).

---

## 🎯 SUCCESS METRICS

| Metric | Before (Sprint 32v) | After (Sprint 32v) |
| :--- | :--- | :--- |
| **Layout** | Traditional page grid | Full-screen canvas with floating overlays |
| **Mobile UX** | In-flow panels, no drawers | Drawer-based panels, 44px touch targets |
| **Model Discovery** | Header button (not floating) | Floating trigger + inline pill |
| **i18n Coverage** | ~95% (2 hardcoded ARIA labels) | 100% translated, zero hardcoded English |
| **Design Compliance** | 1 token violation (text-white) | Semantic tokens only |
| **Device Detection** | Not using useDevice() | useDevice() with full context |
| **Accessibility** | Missing keyboard nav, translated ARIA | shadcn Tabs with ARIA, translated labels |
| **Glass Consistency** | Panels only, not floating UI | Standardized across all floating panels |
| **Touch Feedback** | Sizes correct, no active states | active:scale-95 on all buttons |
| **Z-index Architecture** | No defined layers | Strict layering (0/30/40/50/60) |

---

## ✅ FINAL SPRINT QA (before marking sprint complete)

Run after all tasks are done. Ensures full codebase passes.

```bash
# 1. Full TypeScript check
npx tsc --noEmit

# 2. Full Biome check
npx biome check --write .

# 3. i18n verification
pnpm translate && pnpm i18n:verify

# 4. Run tests (if applicable)
npx vitest run
```

### Design Master Review Checklist (Final)

- [ ] Semantic tokens only — no `bg-white`, `bg-black`, `text-white`, `border-white/10`, `bg-gray-*`.
- [ ] Body text has `leading-relaxed` or `leading-6`.
- [ ] Spacing via `gap-*` — no stray margin for layout.
- [ ] Mobile-first — base CSS = 320px, enhanced with `md:`, `lg:`.
- [ ] Touch targets `min-h-[44px]` with `active:scale-95`.
- [ ] Focus visible (`ring-primary`) on all interactive elements.
- [ ] Animations ≤ 500ms, using `transition-smooth`.
- [ ] shadcn/ui components used (Button, Tabs, Collapsible, Dialog, Drawer, Skeleton).
- [ ] Glass effect consistent: `backdrop-blur-md bg-background/60 border border-border/50 shadow-lg rounded-xl`.
- [ ] Z-index follows stacking table (0/30/40/50/60).

---

## 📊 APPENDIX A: DESIGN MASTER ANALYSIS SUMMARY

### Critical Gaps Found (🔴)

1. **No canvas-first layout** — Uses traditional page grid instead of full-screen canvas
2. **No floating prompt bar** — Prompt buried in grid column
3. **No floating mode tabs** — Button pair in document flow instead of shadcn Tabs overlay
4. **Settings not floating** — VoiceSettingsPanel in-flow instead of adaptive overlay
5. **No z-index layering** — No stacking context management
6. **Mode tabs use Button** — No keyboard navigation, ARIA failure
7. **No mobile drawer pattern** — Modals instead of AdaptiveModal drawers

### High Priority Gaps (🟠)

8. **No active touch states** — Missing `active:scale-95` on most buttons
9. **No safe area handling** — iOS notch/home indicator overlap risk
10. **No useDevice() migration** — Missing orientation detection
11. **History not floating** — Buried in header instead of floating trigger
12. **Model selector not floating** — Header button instead of glass trigger
13. **No floating glass aesthetic** — Glass panels exist but not floating
14. **Toast uses text-white** — Minor token violation
15. **ARIA labels not translated** — Hardcoded English

### Design System Compliance Score

- **Image Generator**: A (100% compliant)
- **Voice Generator (Before)**: D+ (40% compliant — functional but architecturally inconsistent)
- **Voice Generator (After Sprint 32v)**: A (Target 100% compliant)

---

## 📚 APPENDIX B: REFERENCE IMPLEMENTATIONS

### Image Generator Files to Reference

- `components/image-generator/index.tsx` — Canvas-first layout pattern
- `components/image-generator/FloatingPromptBar.tsx` — Bottom floating prompt
- `components/image-generator/FloatingOptionsPanel.tsx` — Adaptive options panel
- `components/image-generator/PremiumTabSystem.tsx` — Floating shadcn Tabs
- `components/image-generator/output-section.tsx` — Canvas/output area pattern
- `docs/MVP/Todo/sprint-30c-UI-fix.md` — Sprint structure and QA methodology

### Design System Documents

- `.cursor/agents/design-master.md` — Color tokens, typography, spacing, glassmorphism
- `.cursor/agents/mobile-first-guardian.md` — Touch targets, responsive patterns, safe areas
- `.cursor/agents/i18n-master.md` — Translation patterns, ICU format, key naming

---

**End of Sprint Plan**

Last updated: February 19, 2026
Status: Ready for execution
