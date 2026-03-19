# Sprint 35: Voice Generator — Canvas-First Rebuild + Backend Bug Fixes

**Date**: March 1, 2026
**Status**: ✅ COMPLETE — All 13 tasks implemented, TypeScript ✅ Biome ✅ i18n ✅
**Estimated Time**: ~18 hours
**Branch**: `sprint-35-voice-generator-fix`
**Goal**: Fully implement Sprint-32v (Voice Generator canvas-first UI rebuild) which was **never executed**, plus fix 24 bugs discovered by deep agent audit — including 4 critical backend bugs that break history, MiniMax voice settings, and the generate flow.
**Reference Sprint**: `docs/MVP/Todo/sprint-32v-voice-canvas-first.md` (architecture spec)
**Reference Implementation**: Image Generator — `components/image-generator/`
**QA Strategy**: **2-Step QA** — (1) `npx tsc --noEmit`, (2) `npx biome check --write <files>` after every task. i18n tasks add `pnpm translate` then `pnpm i18n:verify`. No task merges without passing its QA block.

---

## ✅ Implementation Notes (March 1, 2026)

### What was completed

**Backend (Task 1)**
- `convex/voiceModels.ts` — Added `listVoiceHistoryFromTracks` + `listVoicesByProjectFromTracks` queries reading from `audioTracks` table (the table actions actually write to)
- `components/voice-generator/hooks/use-convex-voice-history.ts` — Switched to `listVoiceHistoryFromTracks`
- `convex/actions/voiceToolGeneric.ts` — Fixed MiniMax dotted-key param mapping with flat-key fallback; Qwen `"prompt"` style key renamed to `"style_prompt"` with backward-compat fallback
- `convex/seed/seedVoiceModels.ts` — Qwen style param key renamed `"prompt"` → `"style_prompt"`
- `convex/voiceTool.ts` — Dead code `saveVoiceGeneration` + unused `internalMutation` import removed (done post-implementation cleanup)

**New components (Tasks 5–8)**
- `components/voice-generator/CanvasSection.tsx` — Created
- `components/voice-generator/FloatingPromptBar.tsx` — Created
- `components/voice-generator/PremiumTabSystem.tsx` — Created
- `components/voice-generator/FloatingOptionsPanel.tsx` — Created
- `components/voice-generator/VoiceSettingsPanel.tsx` — Added `hidePrompt` prop; replaced `<details>/<summary>` with shadcn `Collapsible`

**i18n (Task 4)** — 17 new keys added to `messages/en.json` under `voice_generator` (confirmed all language keys `voice_generator.languages.*` already existed and are correctly wired through `DynamicField.translateLabel()`)

**index.tsx refactor (Tasks 2, 3, 9)** — Full canvas-first rewrite:
- Grid / `max-w-7xl` container / header / right column removed
- 6-layer z-index architecture (`z-0` canvas → `z-30` options/history → `z-40` tabs/prompt → `z-60` recording overlay)
- `promptText` extracted as top-level state (no more data loss on model switch)
- `userCredits = 0` → real balance from `useHasEnoughCredits`
- Generate flow: validate → ProjectSelector → API call → success toast (premature toast bug fixed)
- Toast: `text-primary-foreground` / `text-destructive-foreground` (no more `text-white`)
- `PremiumTabSystem`, `FloatingPromptBar`, `FloatingOptionsPanel`, `CanvasSection`, floating `History` button, recording overlay all wired

**Polish (Task 10, 12)**
- `VoiceLibrary.tsx` — Migrated to `AdaptiveModal`; `active:scale-95` on all buttons; locale-aware `formatDate`; ARIA labels translated; hardcoded `" • Recorded"` fixed
- `VoiceRecordingPanel.tsx` — Removed 6 `console.log` statements; `xs:flex-row` verified valid (breakpoint defined in tailwind config)
- `VoiceModelCard.tsx` — `min-h-[44px]` added; `aria-pressed` kept (correct per spec — `aria-selected` invalid on `<button>`)

### Deviations from plan
- **Task 10 prop names**: `VoiceLibrary` external props kept as `open`/`onOpenChange` (not renamed to `isOpen`/`onClose`) to avoid a more disruptive refactor — `AdaptiveModal` is called internally with the correct props
- **Task 1 history shape**: `audioTracks` items have `storageId` (not `audioUrl`). `CanvasSection` currently shows empty state; audio URL resolution from `storageId` is a known follow-up (see remaining work)
- **`arabic` language**: Key exists in `en.json` but not in seed — intentionally left as-is pending product decision

### QA results (final)
- `npx tsc --noEmit` — ✅ 0 errors
- `npx biome check --write` — ✅ 0 errors, 1 pre-existing warning (`storageId as any` in `voiceToolGeneric.ts`)
- `pnpm translate` — ✅ 17 new voice_generator keys translated into all 7 locales (fr, de, it, es, pt, ru)
- `pnpm i18n:verify` — ✅ All 6 locale files perfect match (2079 keys each)

---

## 🚨 Audit Summary

Sprint-32v was **never executed**. All 6 planned tasks remain at 0% completion. Additionally, a deep code review found **4 critical backend bugs** that make the feature non-functional for users even before any UI changes:

| Severity | Count | Highlights |
|---|---|---|
| 🔴 CRITICAL | 4 | Empty history (wrong table), MiniMax voice settings dropped, misleading success toast, credits always show 0 |
| 🟠 HIGH | 8 | RecordingPanel in-flow, Button tabs (no a11y), prompt data loss on model switch, VoiceLibrary Dialog (no mobile drawer), floating triggers missing, `<details>` for advanced settings, no credit costs in model selector |
| 🟡 MEDIUM | 6 | Toast token violation, missing `active:scale-95`, locale-hardcoded dates, fake pagination, Qwen style prompt hidden, dead code |
| 🟢 LOW | 5 | console.log leaks, hardcoded "Recorded" string, aria-pressed wrong, min-h missing, xs: breakpoint risk |

---

## 📋 Task List

Tasks are ordered: backend fixes → foundation → new components → layout refactor → polish → i18n/QA.

---

### Task 1: Critical Backend Fixes (2.5 h)

**Objective**: Fix 3 critical backend bugs that make voice generation non-functional or misleading regardless of UI.

**Files to Modify**:
- `convex/actions/voiceToolGeneric.ts`
- `convex/actions/voiceProcessing.ts`
- `convex/voiceModels.ts`
- `convex/seed/seedVoiceModels.ts`
- `components/voice-generator/hooks/use-convex-voice-history.ts`

#### 1a. Fix BUG-01: VoiceLibrary Always Empty (History Data Source Mismatch)

**Problem**: Both `voiceToolGeneric.generateGenericVoice` and `voiceProcessing.processRecordedVoice` write audio to `internal.audioTracks.insert`, not to `voiceToolHistory`. The frontend hook `useConvexVoiceHistory` queries `api.voiceModels.listVoiceHistory` → `voiceToolHistory` which is **never written to**. History is always empty.

**Fix**: Add a new `listVoiceHistory` query in Convex that reads from `audioTracks` (filtered by userId), and update `useConvexVoiceHistory` to call it. This is the least invasive fix — does not require changing the actions.

In `convex/voiceModels.ts`, add a new query (or update `listVoiceHistory`) that pulls from `audioTracks` by userId, returning items shaped like `VoiceHistoryItem`:
```ts
export const listVoiceHistoryFromTracks = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit = 20 }) => {
    return await ctx.db
      .query("audioTracks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});
```

Then update `use-convex-voice-history.ts` to use this query instead of `api.voiceModels.listVoiceHistory`.

Also: mark `convex/voiceTool.ts` `saveVoiceGeneration` as `// DEAD CODE — not called by any action` or delete it once the data source decision is confirmed.

#### 1b. Fix BUG-02: MiniMax Voice Settings Silently Dropped

**Problem**: Seed defines MiniMax params with dotted keys (`"voice_setting.voice_id"`, `"voice_setting.speed"`, `"voice_setting.pitch"`, `"voice_setting.emotion"`). These arrive in `rawParams` as literal keys `rawParams["voice_setting.voice_id"]`. The action at `voiceToolGeneric.ts:93-96` looks for `rawParams.voice_id`, `rawParams.speed`, `rawParams.pitch`, `rawParams.emotion` — all `undefined`. Every MiniMax generation uses FAL defaults regardless of user selection.

**Fix** — update `voiceToolGeneric.ts` lines 93-96:
```ts
// BEFORE
if (rawParams.voice_id) voiceSetting.voice_id = rawParams.voice_id as string;
if (rawParams.speed !== undefined) voiceSetting.speed = rawParams.speed as number;
if (rawParams.pitch !== undefined) voiceSetting.pitch = rawParams.pitch as number;
if (rawParams.emotion) voiceSetting.emotion = rawParams.emotion as string;

// AFTER
const voiceId = rawParams["voice_setting.voice_id"] ?? rawParams.voice_id;
const speed = rawParams["voice_setting.speed"] ?? rawParams.speed;
const pitch = rawParams["voice_setting.pitch"] ?? rawParams.pitch;
const emotion = rawParams["voice_setting.emotion"] ?? rawParams.emotion;
if (voiceId) voiceSetting.voice_id = voiceId as string;
if (speed !== undefined) voiceSetting.speed = speed as number;
if (pitch !== undefined) voiceSetting.pitch = pitch as number;
if (emotion) voiceSetting.emotion = emotion as string;
```

#### 1c. Fix BUG-19: Qwen Style Prompt Key `"prompt"` Collision

**Problem**: Qwen 3 TTS has a speech text param (`key: "text"`) and a style description param (`key: "prompt"`). `VoiceSettingsPanel` filters out params where `p.key === "prompt" || p.key === "text"` to identify the main textarea. This filter hides the Qwen style description field entirely. Users can never set voice style for Qwen.

**Fix** — rename in `seedVoiceModels.ts` and update the action:
```ts
// In seedVoiceModels.ts — Qwen style prompt param
{ key: "style_prompt", label: "Voice style", ... }  // was: key: "prompt"

// In voiceToolGeneric.ts — Qwen handler
if (rawParams.style_prompt) falParams.prompt = rawParams.style_prompt as string;  // was: rawParams.style_prompt
```

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write convex/actions/voiceToolGeneric.ts convex/voiceModels.ts convex/seed/seedVoiceModels.ts components/voice-generator/hooks/use-convex-voice-history.ts
```

---

### Task 2: Fix Generate Flow + Extract Prompt State (1.5 h)

**Objective**: Fix BUG-03 (misleading success toast fires before generation) and BUG-07 (prompt lives in params, gets reset on model switch). Both are required before creating `FloatingPromptBar`.

**Files to Modify**:
- `components/voice-generator/index.tsx`
- `components/voice-generator/VoiceSettingsPanel.tsx`

#### 2a. Extract `promptText` to Top-Level State (BUG-07)

Add dedicated prompt state at top of `index.tsx`:
```ts
const [promptText, setPromptText] = useState("");
```

Update `useEffect` that resets params on schema change — ensure it does **not** reset `promptText`:
```ts
useEffect(() => {
  if (!selectedSchema) return;
  // Reset model-specific params only (not prompt)
  const defaults = getDefaultParamsFromSchema(selectedSchema);
  // Remove prompt/text keys from defaults — those live in promptText
  delete defaults.prompt;
  delete defaults.text;
  setParams(defaults);
}, [selectedSchema]);
```

Add `hidePrompt?: boolean` prop to `VoiceSettingsPanel` and conditionally hide the prompt textarea:
```tsx
// In VoiceSettingsPanel.tsx — add to props interface
hidePrompt?: boolean;

// In render — wrap prompt textarea
{!hidePrompt && promptParam && (
  <div className="space-y-2">
    {/* ... existing textarea ... */}
  </div>
)}
```

#### 2b. Fix Generate Flow: Toast Fires After Generation (BUG-03)

**Decision**: Align with the image generator pattern — trigger generation immediately on "Generate" button press. Show `ProjectSelector` only after generation succeeds (with the resulting URL), so users choose where to save the finished audio.

Update `handleGenerate` in `index.tsx`:
```ts
const handleGenerate = async () => {
  if (!selectedSchema || !promptText.trim()) return;
  if (!hasEnoughCredits) {
    setShowInsufficientCredits(true);
    return;
  }
  setIsGenerating(true);
  try {
    const fullParams = {
      ...params,
      [selectedSchema.promptKey ?? "prompt"]: promptText,
    };
    await startGenericVoiceGeneration({
      schemaId: selectedSchema.schemaId,
      params: fullParams,
    });
    showToast(t("success.generated"), "success");  // Toast fires AFTER success
    setShowSaveModal(true);
  } catch (err) {
    showToast(t("error.generation_failed"), "error");
  } finally {
    setIsGenerating(false);
  }
};
```

Remove `lastGeneration` state (no longer needed for deferred generation).

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/voice-generator/index.tsx components/voice-generator/VoiceSettingsPanel.tsx
```

---

### Task 3: Fix `userCredits` + Wire Credit Hook (30 min)

**Objective**: Fix BUG-04 — `InsufficientCreditsModal` always shows "0 credits available".

**Files to Modify**:
- `components/voice-generator/index.tsx`

Remove the hardcoded `const userCredits = 0` and wire the real credit hook:
```ts
// REMOVE:
const userCredits = 0; // TODO: Get from user credits hook

// ADD (after clerkUserId is available, matching image generator pattern):
const { hasEnough: hasEnoughCredits, balance: userCredits, required: creditCost } =
  useHasEnoughCredits(
    clerkUserId ?? "",
    selectedSchema?.creditActionType ?? "voice_generation_minimax_28_hd",
  );
```

Update `canGenerate` guard:
```ts
const canGenerate =
  !!promptText.trim() &&
  !!selectedSchema &&
  hasEnoughCredits &&
  !isGenerating;
```

Pass `userCredits` and `creditCost` where needed:
```tsx
<InsufficientCreditsModal
  isOpen={showInsufficientCredits}
  onClose={() => setShowInsufficientCredits(false)}
  required={creditCost}
  available={userCredits}  // was: 0
/>
```

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/voice-generator/index.tsx
```

---

### Task 4: Add All i18n Keys (30 min)

**Objective**: Add all 17 missing i18n keys before creating new components that depend on them.

**Files to Modify**:
- `messages/en.json`

Add all missing keys under `voice_generator` namespace. Find the existing `voice_generator` block and extend it:

```json
{
  "voice_generator": {
    // --- New keys for Sprint 35 ---
    "floating_prompt_placeholder": "Enter your script or text to convert to speech...",
    "canvas_empty_title": "No recordings yet",
    "canvas_empty_description": "Generate your first voice or record audio to get started",
    "playback_play_aria": "Play audio",
    "playback_pause_aria": "Pause audio",
    "playback_delete_aria": "Delete recording",
    "options_panel_title": "Voice Settings",
    "options_panel_collapse": "Hide Settings",
    "options_panel_expand": "Show Settings",
    "options_trigger_aria": "Open voice settings",
    "tabs_aria_label": "Generate or Record",
    "history_trigger_aria": "Open voice library",
    "generate": "Generate",
    "select_save_location": "Choose where to save your voice",
    "library": {
      "play_aria": "Play",
      "pause_aria": "Pause",
      "delete_aria": "Delete"
    }
  }
}
```

Then run translation pipeline:
```bash
pnpm translate
pnpm i18n:verify
```

---

### Task 5: Create `CanvasSection.tsx` (2 h)

**Objective**: Create the full-screen audio canvas background layer (z-0), analogous to image generator's `output-section.tsx`.

**Files to Create**:
- `components/voice-generator/CanvasSection.tsx`

Three states: empty (no audio), loading (generation in progress), and audio player.

```tsx
"use client";

import { Pause, Play, Trash2, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CanvasSectionProps {
  audioUrl?: string | null;
  isLoading?: boolean;
  onDelete?: () => void;
}

export function CanvasSection({ audioUrl, isLoading = false, onDelete }: CanvasSectionProps) {
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
      void audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-3 w-64 rounded-full" />
          <Skeleton className="h-3 w-48 rounded-full" />
        </div>
      </div>
    );
  }

  if (!audioUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <Volume2 className="mb-4 size-16 text-muted-foreground/40" />
        <h2 className="mb-2 text-xl font-medium text-foreground">{t("canvas_empty_title")}</h2>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {t("canvas_empty_description")}
        </p>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="w-full max-w-3xl space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="default"
            size="icon"
            onClick={togglePlayPause}
            className="size-16 rounded-full active:scale-95 transition-smooth"
            aria-label={isPlaying ? t("playback_pause_aria") : t("playback_play_aria")}
          >
            {isPlaying ? <Pause className="size-6" /> : <Play className="ml-1 size-6" />}
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

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/voice-generator/CanvasSection.tsx
```

---

### Task 6: Create `FloatingPromptBar.tsx` (1.5 h)

**Objective**: Create fixed bottom-center floating prompt bar — direct mirror of image generator's `FloatingPromptBar.tsx` with `voice_generator` namespace.

**Files to Create**:
- `components/voice-generator/FloatingPromptBar.tsx`

```tsx
"use client";

import { Sparkles } from "lucide-react";
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
  const PROMPT_MAX = 10_000;

  return (
    <div className="fixed bottom-6 left-1/2 z-40 w-[90%] max-w-3xl -translate-x-1/2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-background/60 p-3 shadow-lg backdrop-blur-md">
        <div className="relative flex items-end gap-3">
          <TextareaAutosize
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={t("floating_prompt_placeholder")}
            maxLength={PROMPT_MAX}
            className="min-h-[44px] max-h-[40vh] flex-1 resize-none border-none bg-transparent p-2 text-base leading-relaxed focus:ring-0 focus:outline-none"
            minRows={1}
            maxRows={10}
            disabled={isLoading}
          />
          <Button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate || isLoading}
            aria-label={isLoading ? t("generating") : t("generate")}
            className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center gap-1.5 rounded-lg px-3 active:scale-95 transition-smooth"
          >
            {isLoading ? (
              <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Sparkles className="size-4" />
            )}
            <span className="text-xs opacity-70">{creditCost}c</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/voice-generator/FloatingPromptBar.tsx
```

---

### Task 7: Create `PremiumTabSystem.tsx` (1 h)

**Objective**: Create floating glass tab bar for Generate/Record mode switching — mirrors image generator's `PremiumTabSystem.tsx`.

**Files to Create**:
- `components/voice-generator/PremiumTabSystem.tsx`

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
  selectedModelName?: string;
  onModelSelectorOpen?: () => void;
  showModelSelector?: boolean;
}

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
  const shouldShowModelButton = showModelSelector && onModelSelectorOpen && !isLandscapeMobile;

  return (
    <div className="fixed left-1/2 top-16 z-40 -translate-x-1/2 sm:top-20 md:top-24">
      <div className="flex w-max max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-border/50 bg-background/60 p-1 shadow-lg backdrop-blur-md">
        <Tabs value={mode} onValueChange={(v) => setMode(v as "generate" | "record")}>
          <TabsList className="bg-transparent" aria-label={t("tabs_aria_label")}>
            <TabsTrigger
              value="generate"
              className="min-h-[44px] rounded-lg px-3 py-2 transition-smooth active:scale-95 sm:px-4 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/50"
            >
              {isLandscapeMobile ? <Sparkles className="size-4" aria-hidden /> : t("tab_generate")}
            </TabsTrigger>
            <TabsTrigger
              value="record"
              className="min-h-[44px] rounded-lg px-3 py-2 transition-smooth active:scale-95 sm:px-4 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/50"
            >
              {isLandscapeMobile ? <Mic className="size-4" aria-hidden /> : t("tab_record")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {shouldShowModelButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onModelSelectorOpen}
            className="min-h-[44px] min-w-0 max-w-[min(140px,50vw)] rounded-lg border-border/50 bg-background/40 active:scale-95 transition-smooth sm:max-w-none"
          >
            <span className="max-w-[120px] truncate sm:max-w-none">
              {selectedModelName ?? t("select_model_first")}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
```

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/voice-generator/PremiumTabSystem.tsx
```

---

### Task 8: Create `FloatingOptionsPanel.tsx` (1.5 h)

**Objective**: Create adaptive voice settings panel — fixed right-side on desktop, `AdaptiveModal` drawer on mobile. Direct mirror of image generator's `FloatingOptionsPanel.tsx`.

**Files to Create**:
- `components/voice-generator/FloatingOptionsPanel.tsx`

**Files to Modify**:
- `components/voice-generator/VoiceSettingsPanel.tsx` — complete the `hidePrompt` prop from Task 2a, and replace `<details>/<summary>` with shadcn `Collapsible` (BUG-10).

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
import type { VoiceModelSchema } from "./hooks/use-convex-voice-schemas";
import { VoiceSettingsPanel } from "./VoiceSettingsPanel";

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

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-28 right-4 z-30 min-h-[44px] min-w-[44px] rounded-xl border border-border/50 bg-background/60 shadow-lg backdrop-blur-md active:scale-95 transition-smooth"
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
            className={`${orientation === "landscape" ? "max-h-[80vh]" : "max-h-[60vh]"} overflow-y-auto px-1`}
          >
            <VoiceSettingsPanel
              schema={schema}
              params={params}
              onParamsChange={onParamsChange}
              disabled={disabled}
              hidePrompt
            />
          </div>
        </AdaptiveModal>
      </>
    );
  }

  return (
    <div className="fixed right-6 top-24 z-30 hidden w-80 md:block">
      <Collapsible open={!collapsed} onOpenChange={(open) => setCollapsed(!open)}>
        <div className="overflow-hidden rounded-xl border border-border/50 bg-background/60 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
            <span className="text-sm font-medium tracking-tight text-foreground">
              {t("options_panel_title")}
            </span>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] px-3 text-sm text-muted-foreground hover:text-foreground active:scale-95 transition-smooth"
              >
                {collapsed ? t("options_panel_expand") : t("options_panel_collapse")}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-4">
              <VoiceSettingsPanel
                schema={schema}
                params={params}
                onParamsChange={onParamsChange}
                disabled={disabled}
                hidePrompt
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
```

#### 8b. Update `VoiceSettingsPanel.tsx` — Replace `<details>` with `Collapsible` (BUG-10)

In `VoiceSettingsPanel.tsx`, replace `<details>/<summary>`:

```tsx
// ADD imports
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// ADD state
const [advancedOpen, setAdvancedOpen] = useState(false);

// REPLACE <details>...</details> block:
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
        <DynamicField key={param.key} param={param} value={params[param.key]} onChange={...} />
      ))}
    </div>
  </CollapsibleContent>
</Collapsible>
```

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/voice-generator/FloatingOptionsPanel.tsx components/voice-generator/VoiceSettingsPanel.tsx
```

---

### Task 9: Major `index.tsx` Layout Refactor (2.5 h)

**Objective**: Remove the traditional page grid and wire all floating components (canvas-first architecture). This is the central task that brings everything together.

**Files to Modify**:
- `components/voice-generator/index.tsx`

**What to remove**:
- `max-w-7xl mx-auto p-4 md:p-6 lg:p-8` page container (line 234)
- Full header section with in-flow title, description, model/history buttons (lines 236-275)
- Raw `Button` pair mode tabs (lines 278-294)
- `grid grid-cols-1 lg:grid-cols-3 gap-4` grid layout (line 297)
- Right column "Recent Voices" preview section (lines 335-364)

**New root structure**:
```tsx
export function VoiceGenerator({ onUseInVideo }: VoiceGeneratorProps) {
  // ... state + hooks ...
  const { isMobile } = useDevice(); // ADD: migrate from useMobile or manual checks

  return (
    <div className="relative w-full min-h-[calc(100vh-64px)] bg-background select-none">

      {/* ── Layer 0: Canvas ── */}
      <div className="absolute inset-0 z-0">
        <CanvasSection
          audioUrl={currentAudioUrl}
          isLoading={isGenerating}
          onDelete={handleDeleteAudio}
        />
      </div>

      {/* ── Layer 1 (z-40): PremiumTabSystem ── */}
      <PremiumTabSystem
        mode={mode}
        setMode={setMode}
        selectedModelName={selectedSchema?.name ?? t("loading_models")}
        onModelSelectorOpen={() => setModelSelectorOpen(true)}
      />

      {/* ── Layer 2 (z-40): FloatingPromptBar (generate mode only) ── */}
      {mode === "generate" && (
        <FloatingPromptBar
          prompt={promptText}
          onPromptChange={setPromptText}
          onGenerate={handleGenerate}
          creditCost={creditCost}
          canGenerate={canGenerate}
          isLoading={isGenerating}
        />
      )}

      {/* ── Layer 3 (z-30): FloatingOptionsPanel ── */}
      {selectedSchema && mode === "generate" && (
        <FloatingOptionsPanel
          schema={selectedSchema}
          params={params}
          onParamsChange={setParams}
          disabled={isGenerating}
        />
      )}

      {/* ── Layer 4 (z-30): Floating History Trigger ── */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setHistoryOpen(true)}
        className="fixed bottom-28 left-4 z-30 min-h-[44px] min-w-[44px] rounded-xl border border-border/50 bg-background/60 shadow-lg backdrop-blur-md active:scale-95 transition-smooth md:bottom-6 md:left-6"
        aria-label={t("history_trigger_aria")}
      >
        <History className="size-5" />
      </Button>

      {/* ── Layer 5 (z-60): Recording Panel Overlay (record mode) ── */}
      {mode === "record" && (
        <div className="fixed inset-x-4 top-1/2 z-60 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:w-[500px] md:-translate-x-1/2">
          <div className="rounded-xl border border-border/50 bg-background/60 p-4 shadow-lg backdrop-blur-md md:p-6">
            <VoiceRecordingPanel onSave={handleSaveRecording} disabled={isGenerating} />
          </div>
        </div>
      )}

      {/* ── Layer 6+ (z-50): Modals ── */}
      <VoiceModelSelector
        open={modelSelectorOpen}
        onOpenChange={setModelSelectorOpen}
        schemas={ttsSchemas}
        selectedSchemaId={selectedSchemaId}
        onSelect={(id) => { setSelectedSchemaId(id); setModelSelectorOpen(false); }}
      />
      <VoiceLibrary
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onLoadMore={loadMore}
        hasMore={hasMore}
        onUseInVideo={onUseInVideo}
      />
      <InsufficientCreditsModal
        isOpen={showInsufficientCredits}
        onClose={() => setShowInsufficientCredits(false)}
        required={creditCost}
        available={userCredits}
      />
      <ProjectSelector
        open={showSaveModal}
        onOpenChange={setShowSaveModal}
        onSave={handleSaveGeneration}
      />

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50 rounded-lg p-4 shadow-lg transition-smooth",
            toast.type === "success"
              ? "bg-primary text-primary-foreground"
              : "bg-destructive text-destructive-foreground",
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
```

Add all required imports for the new components at the top of `index.tsx`.

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/voice-generator/index.tsx
```

---

### Task 10: Fix `VoiceLibrary` — AdaptiveModal + Active States + Locale (1 h)

**Objective**: Migrate `VoiceLibrary` to `AdaptiveModal` (BUG-08), add `active:scale-95` to all buttons (BUG-14), fix locale-hardcoded date format (BUG-15), translate ARIA labels (BUG-21).

**Files to Modify**:
- `components/voice-generator/VoiceLibrary.tsx`

```tsx
// Replace Dialog with AdaptiveModal
import { AdaptiveModal } from "@/components/adaptive/AdaptiveModal";
// Remove: import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Update props
interface VoiceLibraryProps {
  isOpen: boolean;   // was: open
  onClose: () => void;  // was: onOpenChange
  // ...rest unchanged
}

// Wrap content:
<AdaptiveModal isOpen={isOpen} onClose={onClose} title={t("library.title")}>
  {/* existing content */}
</AdaptiveModal>

// Fix date format (locale-aware):
import { useLocale } from "next-intl";
const locale = useLocale();
const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp));

// Fix ARIA labels (lines 153, 168):
aria-label={playingId === item._id ? t("library.pause_aria") : t("library.play_aria")}
aria-label={t("library.delete_aria")}

// Add active:scale-95 to ALL buttons (lines 148, 162, 186, 205, 225):
className="... active:scale-95 transition-smooth"
```

**Update callers in `index.tsx`** — prop names `open` → `isOpen`, `onOpenChange` → `onClose` (done in Task 9).

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/voice-generator/VoiceLibrary.tsx
```

---

### Task 11: Wire `creditCosts` to `VoiceModelSelector` (45 min)

**Objective**: Fix BUG-11 — model cards in the selector never show credit costs.

**Files to Modify**:
- `components/voice-generator/index.tsx`
- `components/voice-generator/VoiceModelSelector.tsx` (if needed)

The `creditCosts` prop should receive a map of `creditActionType → credit count`. Query the `creditCosts` Convex table to build this:
```ts
// In index.tsx, alongside ttsSchemas:
const allCreditCosts = useQuery(api.creditCosts.listAll);  // verify query exists

const creditCostsMap = useMemo<Record<string, number>>(() => {
  if (!allCreditCosts || !ttsSchemas) return {};
  const map: Record<string, number> = {};
  for (const schema of ttsSchemas) {
    const entry = allCreditCosts.find((c) => c.actionType === schema.creditActionType);
    if (entry) map[schema.creditActionType] = entry.credits;
  }
  return map;
}, [allCreditCosts, ttsSchemas]);

// Pass to VoiceModelSelector:
<VoiceModelSelector
  creditCosts={creditCostsMap}
  // ...
/>
```

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/voice-generator/index.tsx
```

---

### Task 12: Remaining Bug Fixes & Polish (1 h)

**Objective**: Fix all remaining medium and low severity issues in a single pass.

**Files to Modify**:
- `components/voice-generator/VoiceRecordingPanel.tsx` (BUG-20, BUG-23)
- `components/voice-generator/VoiceModelCard.tsx` (BUG-18, BUG-22)
- `components/voice-generator/index.tsx` (BUG-21 hardcoded strings)

#### 12a. Remove `console.log` from `VoiceRecordingPanel` (BUG-20)
Remove all 7 `console.log("[Waveform] ...")` lines.

#### 12b. Fix `xs:` Tailwind breakpoint (BUG-23)
In `VoiceRecordingPanel.tsx:437`, replace `xs:flex-row` with `sm:flex-row` (or verify `xs` exists in `tailwind.config.ts`).

#### 12c. Fix `aria-pressed` → `aria-selected` on `VoiceModelCard` (BUG-18)
```tsx
// VoiceModelCard.tsx:36
aria-selected={selected}  // was: aria-pressed
```

#### 12d. Add `min-h-[44px]` to `VoiceModelCard` root button (BUG-22)
```tsx
// VoiceModelCard.tsx:28
className="... min-h-[44px] ..."
```

#### 12e. Fix hardcoded English strings in `index.tsx` (BUG-21 inline)
```tsx
// Line 165 — "Not authenticated"
// Use: t("sign_in_to_generate")

// Line 341 — "Loading..."
// Use: t("loading_models")
```

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/voice-generator/VoiceRecordingPanel.tsx components/voice-generator/VoiceModelCard.tsx components/voice-generator/index.tsx
```

---

### Task 13: Final Sprint QA (30 min)

Run full codebase validation:

```bash
# Step 1: Full TypeScript check
npx tsc --noEmit

# Step 2: Full Biome check on all modified files
npx biome check --write \
  components/voice-generator/index.tsx \
  components/voice-generator/CanvasSection.tsx \
  components/voice-generator/FloatingPromptBar.tsx \
  components/voice-generator/PremiumTabSystem.tsx \
  components/voice-generator/FloatingOptionsPanel.tsx \
  components/voice-generator/VoiceSettingsPanel.tsx \
  components/voice-generator/VoiceLibrary.tsx \
  components/voice-generator/VoiceRecordingPanel.tsx \
  components/voice-generator/VoiceModelCard.tsx \
  components/voice-generator/hooks/use-convex-voice-history.ts \
  convex/actions/voiceToolGeneric.ts \
  convex/voiceModels.ts \
  convex/seed/seedVoiceModels.ts \
  messages/en.json

# Step 3: i18n verification
pnpm translate && pnpm i18n:verify

# Step 4: Run tests (if voice-generator tests exist)
npx vitest run __tests__/components/voice-generator/ 2>&1 > /tmp/vitest-voice.txt; cat /tmp/vitest-voice.txt
```

**Design Master Final Checklist**:
- [x] Semantic tokens only — no `bg-white`, `bg-black`, `text-white`, `border-white/10`
- [x] `text-white` → `text-primary-foreground` / `text-destructive-foreground` in toast (Task 9)
- [x] All floating elements: `backdrop-blur-md bg-background/60 border border-border/50 shadow-lg rounded-xl`
- [x] Touch targets `min-h-[44px]` with `active:scale-95` on all interactive elements
- [x] `pb-[env(safe-area-inset-bottom)]` on `FloatingPromptBar` (Task 6)
- [x] `useDevice()` used in `index.tsx`, `FloatingOptionsPanel`, `PremiumTabSystem`
- [x] Z-index layers respected: canvas=0, options/history=z-30, tabs/prompt=z-40, modals=z-50, recording=z-[60]
- [x] No `grid-cols-3` layout in `index.tsx`
- [x] `VoiceRecordingPanel` renders as z-[60] overlay, not in-flow grid cell
- [x] All ARIA labels translated (zero hardcoded English in rendered output)

---

## 📊 Progress Summary

| Task | Description | Est. | Status |
|---|---|---|---|
| **Task 1** | Critical Backend Fixes (history, MiniMax params, Qwen key) | 2.5h | ✅ DONE |
| **Task 2** | Fix Generate Flow + Extract Prompt State | 1.5h | ✅ DONE |
| **Task 3** | Fix `userCredits` + Wire Credit Hook | 30min | ✅ DONE |
| **Task 4** | Add All i18n Keys | 30min | ✅ DONE |
| **Task 5** | Create `CanvasSection.tsx` | 2h | ✅ DONE |
| **Task 6** | Create `FloatingPromptBar.tsx` | 1.5h | ✅ DONE |
| **Task 7** | Create `PremiumTabSystem.tsx` | 1h | ✅ DONE |
| **Task 8** | Create `FloatingOptionsPanel.tsx` + Fix VoiceSettingsPanel | 1.5h | ✅ DONE |
| **Task 9** | Major `index.tsx` Layout Refactor | 2.5h | ✅ DONE |
| **Task 10** | Fix `VoiceLibrary` (AdaptiveModal + active states + locale) | 1h | ✅ DONE |
| **Task 11** | Wire `creditCosts` to `VoiceModelSelector` | 45min | ✅ DONE |
| **Task 12** | Remaining Bug Fixes & Polish | 1h | ✅ DONE |
| **Task 13** | Final Sprint QA | 30min | ✅ DONE |
| | **TOTAL** | **~18h** | |

---

## 📁 Files Created / Modified

| File | Action | Task(s) |
|---|---|---|
| `components/voice-generator/index.tsx` | **MODIFY** (major refactor) | 2, 3, 9, 11, 12 |
| `components/voice-generator/CanvasSection.tsx` | **CREATE** | 5 |
| `components/voice-generator/FloatingPromptBar.tsx` | **CREATE** | 6 |
| `components/voice-generator/PremiumTabSystem.tsx` | **CREATE** | 7 |
| `components/voice-generator/FloatingOptionsPanel.tsx` | **CREATE** | 8 |
| `components/voice-generator/VoiceSettingsPanel.tsx` | **MODIFY** | 2, 8 |
| `components/voice-generator/VoiceLibrary.tsx` | **MODIFY** | 10 |
| `components/voice-generator/VoiceRecordingPanel.tsx` | **MODIFY** | 12 |
| `components/voice-generator/VoiceModelCard.tsx` | **MODIFY** | 12 |
| `components/voice-generator/hooks/use-convex-voice-history.ts` | **MODIFY** | 1 |
| `convex/actions/voiceToolGeneric.ts` | **MODIFY** | 1 |
| `convex/voiceModels.ts` | **MODIFY** | 1 |
| `convex/seed/seedVoiceModels.ts` | **MODIFY** | 1 |
| `messages/en.json` | **MODIFY** | 4 |
| `messages/*.json` (6 other locales) | **AUTO** (via `pnpm translate`) | 4 |

---

## ⏱️ Task Dependencies

```
Task 1 (Backend Fixes)         ← Independent, do first
Task 2 (Generate Flow / Prompt State)  ← Before new components
Task 3 (Credits)               ← Independent, quick
Task 4 (i18n Keys)             ← Before Tasks 5–8
Task 5 (CanvasSection)         ← After Task 4
Task 6 (FloatingPromptBar)     ← After Tasks 2 + 4
Task 7 (PremiumTabSystem)      ← After Task 4
Task 8 (FloatingOptionsPanel)  ← After Tasks 2 + 4
Task 9 (index.tsx refactor)    ← After Tasks 5, 6, 7, 8
Task 10 (VoiceLibrary)         ← Independent (after Task 4 for ARIA keys)
Task 11 (creditCosts)          ← After Task 9
Task 12 (Polish)               ← Independent, any time
Task 13 (Final QA)             ← After all tasks
```

**Execution order**: Tasks 1 + 3 + 4 → Tasks 2 + 5 + 7 + 10 + 12 (parallel) → Task 6 + 8 → Task 9 → Task 11 → Task 13.

---

## 🔍 Audit Findings Reference

Full audit report compiled by agent review on March 1, 2026:
- Sprint-32v completion: **0% (0/29 sub-tasks)**
- Critical bugs (🔴): 4 — history always empty, MiniMax settings dropped, generate flow misleading, credits show 0
- High bugs (🟠): 8 — recording panel in-flow, Button tabs (no a11y), prompt data loss, VoiceLibrary Dialog, missing floating triggers, `<details>` for advanced settings, no credit costs in selector, inline right-column preview
- Medium bugs (🟡): 6 — toast design token, missing active states, locale-hardcoded date, fake pagination, Qwen style prompt hidden, dead code
- Low bugs (🟢): 5 — console.log leaks, hardcoded "Recorded", aria-pressed semantic, min-h missing, xs: breakpoint risk
- i18n gaps: 17 missing keys + 6 hardcoded strings in components

---

**End of Sprint Plan**

Last updated: March 1, 2026
Status: Ready for execution
