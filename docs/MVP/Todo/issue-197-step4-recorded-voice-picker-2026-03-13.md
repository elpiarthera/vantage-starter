# Issue #197: Step 4 — Recorded Voice Picker + Voice Generator Return Flow

**Date**: March 13, 2026
**Branch**: `sprint-45-step4-recorded-voice-picker` (new branch from `sprint-38-image-generator-responsive-fix`)
**Status**: Planning — agent review complete, ready for implementation
**Reference**: [GitHub Issue #197 — Step 4: Recorded Voice Picker + Voice Generator Return Flow](https://github.com/jacquesdahan/MyShortReel-beta/issues/197)
**Goal**: Let users in Guided Flow Step 4 select a previously recorded voice from their project as narration, and navigate to the Voice Generator to record a new one and return seamlessly.
**QA Strategy**: **2-Step QA** — (1) TypeScript `npx tsc --noEmit`, (2) Biome `npx biome check --write <files>` after every task. i18n tasks add `pnpm translate` + `node scripts/verify-translations.js`. No task merges without passing its QA block.

---

## Agent Review — Issues Addressed (v2)

This plan was reviewed by i18n Master, Mobile-first Guardian, and Senior Dev Reviewer. All three returned NEEDS ATTENTION. All 15+ issues have been resolved in this v2. Changes are documented inline below each task.

---

## Context: Current state of Step 4

Step 4 (`app/[locale]/guided/step-4/page.tsx`) only offers **AI-generated narration** via MiniMax TTS. Users choose a voice preset, adjust pacing/pitch/energy sliders, hit "Generate Narration", and pick from a list of generated takes stored in `narrationTakes[]`. The `saveAudioSettings()` function reads `narrationTakes.find(selectedNarrationTake).audioStorageId` and writes it to `project.narrationAudioStorageId` — that field is what video assembly reads in Step 6.

Users can record their own voice in the standalone Voice Generator (`/tools/voice-generator`), which saves recordings as `audioTrack` documents in the `audioTracks` Convex table (`type: "narration"`). Currently there is no path from Step 4 to those recordings.

### Key invariant that must not break

`saveAudioSettings()` reads from `narrationTakes[]`. Downstream pipeline (Step 5, Step 6, video assembly) reads `project.narrationAudioStorageId` + `project.narrationDurationMs`. Any new recording selection **must** inject its data into the `narrationTakes[]` array as a synthetic take — no changes to the core signature of `saveAudioSettings()` are needed, **but the conditional spread for `narrationAudioStorageId` must be fixed** (see C2 in Task 197.1).

---

## Feature 1 — Recorded Voice Picker inside the Narrator Panel

### UI

A **segmented toggle** is added at the top of the Narrator Panel card. Two segments:
- **AI Voice** (left, default) — the current voice selector + sliders + Generate button, unchanged
- **My Recordings** (right) — a list of saved recordings from the project

State:
```typescript
const [narratorMode, setNarratorMode] = useState<"ai" | "recorded">("ai");
```

When the user switches modes, the current `selectedNarrationTake` must be **atomically cleared** and any synthetic take removed from `narrationTakes[]` before `saveAudioSettings()` fires. Additionally, when switching away from a selected state, `saveAudioSettings()` must write `narrationAudioStorageId: undefined` (not skip the field) to prevent a stale storage ID from persisting in Convex (see C2 fix below).

### Data: synthetic take injection

When the user selects a recording from "My Recordings":

```typescript
// Guard first — tracks without storageId cannot be used
if (!track.storageId) {
  // Show disabled state in UI — do not inject
  return;
}

const syntheticTake = {
  id: track._id,           // deterministic — the Convex audioTrack _id
  name: track.title,
  voice: "recorded",
  settings: { pacing: 50, pitch: 50, energy: 50 },
  audioStorageId: track.storageId,  // guaranteed non-null after the guard above
  audioUrl: track.audioUrl ?? undefined,  // ephemeral — re-hydrated on mount
  durationMs: track.duration * 1000,
};
```

> **Critical**: Store `audioStorageId` (= `track.storageId`) not the resolved URL. Convex signed storage URLs expire within hours. The `narrationAudioStorageId` field already holds `storageId` for downstream assembly — this is correct.

Tracks where `storageId` is `undefined` (schema-valid) are displayed as disabled with a "not available" indicator. They cannot be selected.

### audioUrl re-hydration — two-effect pattern

`getProjectNarrations` returns fresh signed `audioUrl` values at query time. However, `projectNarrations` may not be available when the initial Convex sync block (`hasSyncedFromConvex`) fires. Two separate effects handle this:

**Effect A** (inside the existing `hasSyncedFromConvex` guard): Stores `step4Data.selectedNarrationTake` into a `step4DataRef` ref for use by Effect B.

**Effect B** (new, separate `useEffect`): Watches `[projectNarrations]`. When both `hasSyncedFromConvex.current === true` AND `projectNarrations !== undefined` AND `hasSyncedNarratorMode.current === false`:
1. Look up `step4DataRef.current?.selectedNarrationTake` in `projectNarrations`
2. If found: inject fresh synthetic take + `setNarratorMode("recorded")`
3. Set `hasSyncedNarratorMode.current = true` (never re-runs)

Both effects are idempotent. The `returnedFrom=voice-generator` detection effect (Feature 2) and Effect B are non-conflicting: both set `narratorMode = "recorded"`, which is idempotent.

### Recordings list row UI

Each row in the My Recordings list:

```tsx
// Row wrapper: column on mobile, row on desktop
<div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 p-2 rounded ...">
  {/* Title + badges block */}
  <div className="flex flex-wrap items-center gap-1 min-w-0">
    <span>{track.title}</span>
    <span className="text-xs text-gray-400">{durationSec}s</span>
    {/* Source badge — reuse voice_generator.library keys */}
    <span className="text-xs px-1.5 py-0.5 rounded-full ...">
      {track.source === "recorded" ? tVG("voice_mode_recorded") : tVG("voice_mode_generated")}
    </span>
  </div>
  {/* Audio player — always full width */}
  <audio
    controls
    src={track.audioUrl ?? undefined}
    aria-label={track.title}
    className="w-full min-h-[44px] md:flex-1"
  >
    <track kind="captions" />
  </audio>
  {/* Radio */}
  <RadioGroupItem value={track._id} id={track._id} disabled={!track.storageId || durationSec > 30} />
</div>
```

**Duration cap**: Recorded tracks longer than 30 seconds are displayed with a `<AlertTriangle>` icon + `t("recording_too_long")` indicator and their `RadioGroupItem` is disabled — identical to the existing AI take behaviour.

**Row click**: The entire row `<div>` should have `cursor-pointer` and call `handleSelectRecording(track)` on click, not just the radio button — for a larger tap target.

### Empty state

When `projectNarrations` is empty or loading:
- Show a centered "No recordings yet" message
- Show a prominent "Record a voice" CTA button (Mic icon) that navigates to the Voice Generator

When the list has recordings:
- Show the list
- Show a smaller secondary link "Record another voice" below the list (use Lucide `<Plus>` icon, NOT `＋` unicode)

**State-loss notice**: Show an inline dismissible notice below the toggle when the user is about to navigate away: `t("state_loss_notice")` → "Any unsaved changes will remain — just come back here after recording."

### Convex query

```typescript
import { useQuery } from "convex/react";
const projectNarrations = useQuery(
  api.audioTracks.getProjectNarrations,
  projectId ? { projectId } : "skip",
);
```

`getProjectNarrations` already exists in `convex/audioTracks.ts`, is fully secured, and returns `source: "recorded" | "generated"` + resolved `audioUrl`. **No new Convex function needed.**

---

## Feature 2 — Voice Generator CTA + Return Flow

### Navigation URL

```
/tools/voice-generator?projectId=<projectId>&returnTo=/guided/step-4%3FprojectId%3D<projectId>%26returnedFrom%3Dvoice-generator
```

### Changes to `app/[locale]/tools/voice-generator/page.tsx`

The tools route (`/tools/voice-generator`) has **no fixed nav bar** — the banner must be in-flow (not sticky or fixed). The `VoiceGenerator` root div uses `h-[calc(100vh-56px)]` which must be `h-full` to fill a flex parent. The `PremiumTabSystem` renders `fixed top-14 z-40` and would collide with a `sticky` banner at the same offset.

Correct page structure:

```tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { VoiceGenerator } from "@/components/voice-generator";

function VoiceGeneratorPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("common");
  const projectId = searchParams.get("projectId") ?? undefined;
  const returnTo = searchParams.get("returnTo");

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {returnTo && (
        // In-flow banner — NOT sticky. No nav bar on this route.
        <div className="w-full bg-[#182634] border-b border-[#314d68] px-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => router.push(returnTo)}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 active:text-blue-500 active:bg-[#1e3347] min-h-[44px] w-full"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("back_to_step4")}
          </button>
        </div>
      )}
      {/* flex-1 + min-h-0 so VoiceGenerator fills remaining height */}
      <div className="flex-1 min-h-0">
        <VoiceGenerator projectId={projectId} />
      </div>
    </main>
  );
}
```

> `VoiceGenerator`'s root `div` must change from `h-[calc(100vh-56px)]` to `h-full`. Add this change to the `components/voice-generator/index.tsx` task.

### Wire `projectId` in `VoiceGenerator` and `ProjectSelector`

The `projectId` prop exists in `VoiceGeneratorProps` but is not destructured. The `ProjectSelector` component does NOT currently accept an `initialProjectId` prop.

Two changes required:

1. **`components/voice-generator/index.tsx`**: Destructure `projectId` in the function signature. Pass `initialProjectId={projectId as Id<"projects"> | undefined}` to `<ProjectSelector>` in both the TTS save flow and the recording save flow.

2. **`components/voice-generator/ProjectSelector.tsx`**: Add `initialProjectId?: Id<"projects">` to `ProjectSelectorProps`. Add a `useEffect` to pre-select on open:
   ```typescript
   useEffect(() => {
     if (open && initialProjectId) {
       setSelectedProjectId(initialProjectId);
     }
   }, [open, initialProjectId]);
   ```
   The type conversion from `string` (from `VoiceGeneratorProps`) to `Id<"projects">` must happen at the call site in `VoiceGenerator` with an explicit cast: `projectId as Id<"projects">`.

### Return flow — auto-switch on return

When Step 4 mounts and `searchParams.get("returnedFrom") === "voice-generator"`:
1. Wait until `hasLoadedInitialData === true`
2. Set `narratorMode` to `"recorded"`
3. Strip `returnedFrom` from URL via `router.replace(...)`:
   ```typescript
   const nextParams = new URLSearchParams(searchParams.toString());
   nextParams.delete("returnedFrom");
   router.replace(`?${nextParams.toString()}`);
   ```

The new recording is already in `projectNarrations` (reactive Convex query) — no manual refresh needed.

---

## Files to change

| File | What changes |
|------|-------------|
| `app/[locale]/guided/step-4/page.tsx` | Add `narratorMode` state; `useQuery(getProjectNarrations)`; segmented toggle; My Recordings list; empty-state CTA; `returnedFrom` detection; synthetic take injection with `storageId` guard; atomic mode-switch; two-effect re-hydration pattern; `step4DataRef`; `hasSyncedNarratorMode` ref; `saveAudioSettings` conditional spread fix; new imports: `Mic`, `Plus`, `AlertTriangle`, `useQuery` |
| `app/[locale]/tools/voice-generator/page.tsx` | Add `Suspense`-wrapped content component; read `projectId` + `returnTo` from `useSearchParams`; in-flow "Back" banner; pass `projectId` to `<VoiceGenerator>`; `flex flex-col` layout structure |
| `components/voice-generator/index.tsx` | Destructure `projectId` prop; pass as `initialProjectId` to `ProjectSelector`; change root `div` from `h-[calc(100vh-56px)]` to `h-full` |
| `components/voice-generator/ProjectSelector.tsx` | Add `initialProjectId?: Id<"projects">` to props; add `useEffect` to pre-select on open |
| `messages/en.json` | Add 8 new i18n keys (see Task 197.3) |
| `messages/fr.json` + 5 other locales | Add translated strings (via `pnpm translate`) |

**No changes needed** to: `convex/audioTracks.ts`, Step 5, Step 6, video assembly.

> **Note on `saveAudioSettings`**: The function body in `step-4/page.tsx` requires a one-line fix (C2). It is technically modified — it is listed in `step-4/page.tsx` above, not as a separate file.

> **Note on Convex deploy**: No new Convex functions are added. A `npx convex dev --once` deploy is not strictly required, but should be run as part of the standard deployment step for the sprint.

---

## Task List

---

### Task 197.1 — Recorded Voice Picker UI in Step 4

**Priority**: P0 — Core feature
**Files**: `app/[locale]/guided/step-4/page.tsx`

**Steps**:

1. **Add imports**: `Mic`, `Plus`, `AlertTriangle` from `lucide-react`; `useQuery` from `convex/react`. `api`, `Id`, `useRef` are already imported.

2. **Add state and refs**:
   ```typescript
   const [narratorMode, setNarratorMode] = useState<"ai" | "recorded">("ai");

   // Two-effect re-hydration: store step4Data for use by the late-arriving projectNarrations effect
   const step4DataRef = useRef<typeof project.step4Data | null>(null);
   const hasSyncedNarratorMode = useRef(false);
   ```

3. **Add Convex query for project narrations** (unconditional — before any early returns):
   ```typescript
   const projectNarrations = useQuery(
     api.audioTracks.getProjectNarrations,
     projectId ? { projectId } : "skip",
   );
   ```

4. **Fix `saveAudioSettings` conditional spread** (C2 fix):
   Change:
   ```typescript
   ...(narrationAudioStorageId !== undefined && { narrationAudioStorageId }),
   ```
   To:
   ```typescript
   narrationAudioStorageId,  // always write — undefined clears the field when no take is selected
   ```
   This ensures switching modes clears the stored storageId, not silently retains it.

5. **Update the Convex sync effect** (Effect A) — inside the existing `if (!hasSyncedFromConvex.current)` block, store data into the ref:
   ```typescript
   // Store for Effect B (late-arriving projectNarrations)
   step4DataRef.current = step4Data ?? null;
   ```
   Keep all existing `setState` calls unchanged.

6. **Add Effect B** (new `useEffect` for late-arriving `projectNarrations` re-hydration):
   ```typescript
   useEffect(() => {
     if (
       !hasSyncedFromConvex.current ||
       hasSyncedNarratorMode.current ||
       projectNarrations === undefined
     ) return;

     const savedTakeId = step4DataRef.current?.selectedNarrationTake;
     if (!savedTakeId) {
       hasSyncedNarratorMode.current = true;
       return;
     }

     const matchingTrack = projectNarrations.find((t) => t._id === savedTakeId);
     if (!matchingTrack || !matchingTrack.storageId) {
       hasSyncedNarratorMode.current = true;
       return;
     }

     hasSyncedNarratorMode.current = true;
     setNarratorMode("recorded");
     const freshTake = {
       id: matchingTrack._id,
       name: matchingTrack.title,
       voice: "recorded" as const,
       settings: { pacing: 50, pitch: 50, energy: 50 },
       audioStorageId: matchingTrack.storageId,
       audioUrl: matchingTrack.audioUrl ?? undefined,
       durationMs: matchingTrack.duration * 1000,
     };
     setNarrationTakes((prev) => {
       const withoutSynthetic = prev.filter((t) => t.voice !== "recorded");
       return [...withoutSynthetic, freshTake];
     });
     setSelectedNarrationTake(matchingTrack._id);
   }, [projectNarrations]);
   ```

7. **Add `returnedFrom` detection effect** (fires after `hasLoadedInitialData`):
   ```typescript
   useEffect(() => {
     if (
       hasLoadedInitialData &&
       searchParams.get("returnedFrom") === "voice-generator"
     ) {
       setNarratorMode("recorded");
       const nextParams = new URLSearchParams(searchParams.toString());
       nextParams.delete("returnedFrom");
       router.replace(`?${nextParams.toString()}`);
     }
   }, [hasLoadedInitialData, searchParams, router]);
   ```

8. **Mode-switch handlers** (React 18 batching — called from event handlers):
   ```typescript
   const handleSwitchToAI = () => {
     setNarrationTakes((prev) => prev.filter((t) => t.voice !== "recorded"));
     setSelectedNarrationTake("");
     setNarratorMode("ai");
     // saveAudioSettings will fire with empty selectedNarrationTake → writes narrationAudioStorageId: undefined
   };

   const handleSwitchToRecorded = () => {
     setSelectedNarrationTake("");
     setNarratorMode("recorded");
   };
   ```

9. **Synthetic take injection handler**:
   ```typescript
   const handleSelectRecording = (track: NonNullable<typeof projectNarrations>[0]) => {
     if (!track.storageId) return; // guard — disabled in UI, but also guarded here
     const syntheticTake = {
       id: track._id,
       name: track.title,
       voice: "recorded" as const,
       settings: { pacing: 50, pitch: 50, energy: 50 },
       audioStorageId: track.storageId,
       audioUrl: track.audioUrl ?? undefined,
       durationMs: track.duration * 1000,
     };
     setNarrationTakes((prev) => {
       const withoutSynthetic = prev.filter((t) => t.voice !== "recorded");
       return [...withoutSynthetic, syntheticTake];
     });
     setSelectedNarrationTake(track._id);
   };
   ```

10. **Segmented toggle UI** — at top of Narrator Panel `<CardContent>`:
    ```tsx
    <div className="flex w-full rounded-lg overflow-hidden border border-[#314d68] mb-4">
      <button
        type="button"
        onClick={handleSwitchToAI}
        className={`flex-1 min-h-[44px] text-sm font-medium transition-colors px-3 ${
          narratorMode === "ai"
            ? "bg-[#0d7ff2] text-white"
            : "bg-[#223649] text-gray-300 hover:text-white"
        }`}
      >
        {t("narrator_mode_ai")}
      </button>
      <button
        type="button"
        onClick={handleSwitchToRecorded}
        className={`flex-1 min-h-[44px] text-sm font-medium transition-colors px-3 ${
          narratorMode === "recorded"
            ? "bg-[#0d7ff2] text-white"
            : "bg-[#223649] text-gray-300 hover:text-white"
        }`}
      >
        {t("narrator_mode_recordings")}
      </button>
    </div>
    ```

11. **AI Voice section**: wrap all existing content in `{narratorMode === "ai" && (...)}`.

12. **My Recordings section**: wrap in `{narratorMode === "recorded" && (...)}`:

    - Loading skeleton: when `projectNarrations === undefined`
    - State-loss notice (inline, below toggle):
      ```tsx
      <p className="text-xs text-gray-400 mb-3">{t("state_loss_notice")}</p>
      ```
    - Empty state: when `projectNarrations?.length === 0`:
      ```tsx
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-gray-400 text-sm">{t("no_recordings_yet")}</p>
        <Button
          onClick={() => router.push(voiceGeneratorUrl)}
          className="bg-[#0d7ff2] hover:bg-[#0a6bd1] text-white min-h-[44px]"
        >
          <Mic className="h-4 w-4 mr-2" aria-hidden="true" />
          {t("record_a_voice_cta")}
        </Button>
      </div>
      ```
    - Non-empty list:
      ```tsx
      <RadioGroup value={selectedNarrationTake} onValueChange={(id) => {
        const track = projectNarrations?.find((t) => t._id === id);
        if (track) handleSelectRecording(track);
      }}>
        {projectNarrations?.map((track) => {
          const durationSec = Math.ceil(track.duration);
          const isOverLimit = durationSec > MAX_NARRATION_DURATION_SEC;
          const isUnavailable = !track.storageId;
          return (
            <div
              key={track._id}
              onClick={() => !isOverLimit && !isUnavailable && handleSelectRecording(track)}
              className={`flex flex-col gap-2 md:flex-row md:items-center md:gap-4 p-2 rounded cursor-pointer ${
                isOverLimit ? "bg-amber-950/40 border border-amber-700" :
                isUnavailable ? "bg-[#223649] opacity-50" :
                "bg-[#223649]"
              }`}
            >
              <div className="flex flex-wrap items-center gap-1 min-w-0">
                <RadioGroupItem
                  value={track._id}
                  id={track._id}
                  disabled={isOverLimit || isUnavailable}
                  onClick={(e) => e.stopPropagation()} // let row onClick handle it
                />
                <Label htmlFor={track._id} className="text-white cursor-pointer">
                  {track.title}
                </Label>
                <span className="text-xs text-gray-400">
                  {tVG("voice_duration", { duration: durationSec })}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#314d68] text-gray-300">
                  {track.source === "recorded" ? tVG("voice_mode_recorded") : tVG("voice_mode_generated")}
                </span>
                {isOverLimit && (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                    {t("recording_too_long")}
                  </span>
                )}
                {isUnavailable && (
                  <span className="text-xs text-gray-500">{t("recording_unavailable")}</span>
                )}
              </div>
              <audio
                controls
                src={track.audioUrl ?? undefined}
                aria-label={track.title}
                className="w-full min-h-[44px] md:flex-1"
              >
                <track kind="captions" />
              </audio>
            </div>
          );
        })}
      </RadioGroup>
      <div className="mt-3">
        <Button
          variant="ghost"
          onClick={() => router.push(voiceGeneratorUrl)}
          className="text-blue-400 hover:text-blue-300 min-h-[44px]"
        >
          <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
          {t("record_another_voice")}
        </Button>
      </div>
      ```

13. **Voice Generator URL** (computed once):
    ```typescript
    const voiceGeneratorUrl = projectId
      ? `/tools/voice-generator?projectId=${projectId}&returnTo=${encodeURIComponent(
          `/guided/step-4?projectId=${projectId}&returnedFrom=voice-generator`,
        )}`
      : "/tools/voice-generator";
    ```

14. **Sticky footer safe-area fix** (pre-existing bug, fix here):
    Change the fixed footer `className` from `"fixed bottom-0 left-0 right-0 p-4"` to:
    ```
    "fixed bottom-0 left-0 right-0 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    ```
    Also update the main content bottom padding from `pb-24` to `pb-[calc(6rem+env(safe-area-inset-bottom))]`.

15. **Add `tVG` translator** for `voice_generator.library` keys:
    ```typescript
    const tVG = useTranslations("voice_generator.library");
    ```

16. **2-Step QA**: `npx tsc --noEmit` + `npx biome check --write app/[locale]/guided/step-4/page.tsx`

---

### Task 197.2 — Wire Voice Generator `projectId` prop + "Back" banner

**Priority**: P0 — Required for return flow
**Files**: `app/[locale]/tools/voice-generator/page.tsx`, `components/voice-generator/index.tsx`, `components/voice-generator/ProjectSelector.tsx`

**Steps**:

1. **`components/voice-generator/ProjectSelector.tsx`** — add `initialProjectId` prop:
   - Add `initialProjectId?: Id<"projects">` to `ProjectSelectorProps`
   - Add effect inside `ProjectSelector`:
     ```typescript
     useEffect(() => {
       if (open && initialProjectId) {
         setSelectedProjectId(initialProjectId);
       }
     }, [open, initialProjectId]);
     ```

2. **`components/voice-generator/index.tsx`**:
   - Destructure `projectId`: `export function VoiceGenerator({ onUseInProject, projectId }: VoiceGeneratorProps = {})`
   - Pass to `ProjectSelector` in both TTS and recording save flows:
     ```tsx
     <ProjectSelector
       ...
       initialProjectId={projectId as Id<"projects"> | undefined}
     />
     ```
   - Change root `div` from `h-[calc(100vh-56px)]` to `h-full` (to fill the flex parent when the "Back" banner is present).

3. **`app/[locale]/tools/voice-generator/page.tsx`** — full replacement:
   ```typescript
   "use client";
   import { useRouter, useSearchParams } from "next/navigation";
   import { ArrowLeft, Loader2 } from "lucide-react";
   import { Suspense } from "react";
   import { useTranslations } from "next-intl";
   import { VoiceGenerator } from "@/components/voice-generator";

   function VoiceGeneratorPageContent() {
     const searchParams = useSearchParams();
     const router = useRouter();
     const t = useTranslations("common");
     const projectId = searchParams.get("projectId") ?? undefined;
     const returnTo = searchParams.get("returnTo");

     return (
       <main className="min-h-screen bg-background flex flex-col">
         {returnTo && (
           <div className="w-full bg-[#182634] border-b border-[#314d68] px-4 flex-shrink-0">
             <button
               type="button"
               onClick={() => router.push(returnTo)}
               className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 active:text-blue-500 active:bg-[#1e3347] min-h-[44px] w-full"
             >
               <ArrowLeft className="h-4 w-4" aria-hidden="true" />
               {t("back_to_step4")}
             </button>
           </div>
         )}
         <div className="flex-1 min-h-0">
           <VoiceGenerator projectId={projectId} />
         </div>
       </main>
     );
   }

   function Loading() {
     return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
       </div>
     );
   }

   export default function VoiceGeneratorPage() {
     return (
       <Suspense fallback={<Loading />}>
         <VoiceGeneratorPageContent />
       </Suspense>
     );
   }
   ```
   > Banner is in-flow (not sticky). No nav bar exists on this route. `VoiceGenerator` fills via `flex-1 min-h-0`.

4. **2-Step QA**:
   ```bash
   npx tsc --noEmit
   npx biome check --write \
     app/[locale]/tools/voice-generator/page.tsx \
     components/voice-generator/index.tsx \
     components/voice-generator/ProjectSelector.tsx
   ```

---

### Task 197.3 — i18n keys

**Priority**: P0 — Required for every text string
**Files**: `messages/en.json` (+ `pnpm translate` for all 6 other locales)

Add the following keys under `guided_step4` (8 new keys):

```json
"narrator_mode_ai": "AI Voice",
"narrator_mode_recordings": "My Recordings",
"no_recordings_yet": "No recordings yet",
"record_a_voice_cta": "Record a voice",
"record_another_voice": "Record another voice",
"recording_too_long": "Too long (max 30s)",
"recording_unavailable": "Not available",
"state_loss_notice": "Any unsaved changes will remain — just come back here after recording."
```

Add the following key under `common` (not `voice_generator` — navigation context belongs in `common`):

```json
"back_to_step4": "Back to Step 4"
```

**Dead key cleanup**: The following 3 existing keys in `guided_step4` will become dead keys if the old Voice Mode toggle is fully replaced by the new segmented toggle. Remove them from all 7 locale files:
- `"voice_mode_title"` (line 1201)
- `"mode_generate"` (line 1202)
- `"mode_record"` (line 1203)

> Only remove these keys if the old toggle is confirmed removed from the UI in Task 197.1. If the old toggle is kept nested inside the AI Voice segment, keep the keys.

**Reuse — do NOT add new keys for**:
- Source badges: reuse `voice_generator.library.voice_mode_recorded` and `voice_generator.library.voice_mode_generated`
- Duration badge: reuse `voice_generator.library.voice_duration` with `{ duration: durationSec }`
- Recording duration suffix: use inline JSX consistent with existing `{takeDurationSec}s` pattern — no separate key

**Steps**:
1. Add 8 keys to `messages/en.json` under `guided_step4`
2. Add `"back_to_step4"` to `common` in `messages/en.json`
3. Run dead key cleanup on all 7 locale files (if old toggle removed)
4. Run `pnpm translate` to generate translations for all 6 other locales
5. Run `node scripts/verify-translations.js` to confirm no missing keys
6. **2-Step QA**: `npx tsc --noEmit` + `npx biome check --write messages/en.json`

---

### Task 197.4 — Tests

**Priority**: P1 — Required before merge
**Files**: New test file `__tests__/guided-step4-recorder-picker.test.tsx`

**Tests to write**:

| Test ID | Description |
|---------|------------|
| T1 | Segmented toggle renders both segments; default is "AI Voice" |
| T2 | Clicking "My Recordings" switches `narratorMode` to `"recorded"` |
| T3 | Switching from "My Recordings" back to "AI Voice" clears `selectedNarrationTake`, removes synthetic takes, AND does not write stale `narrationAudioStorageId` to the project |
| T4 | Selecting a recording injects a synthetic take with `voice: "recorded"` and `audioStorageId = track.storageId` |
| T5 | Synthetic take has `audioStorageId` set (not null/undefined); `audioUrl` may be undefined without breaking |
| T6 | Tracks where `storageId` is undefined are shown disabled; `handleSelectRecording` returns early |
| T7 | Tracks > 30s are displayed with "Too long" indicator and cannot be selected |
| T8 | Empty `projectNarrations` → shows "Record a voice" CTA button |
| T9 | Non-empty `projectNarrations` → shows list + "Record another voice" link |
| T10 | `returnedFrom=voice-generator` param sets `narratorMode = "recorded"` only after `hasLoadedInitialData` is true |
| T11 | `returnedFrom` param is stripped from URL after acting on it (via `router.replace`) |
| T12 | Effect B: `projectNarrations` arriving late (after `hasSyncedFromConvex`) triggers re-hydration and injects fresh synthetic take |
| T13 | Voice Generator page renders "Back to Step 4" banner when `returnTo` param is present |
| T14 | Voice Generator page does NOT render banner when `returnTo` is absent |
| T15 | `VoiceGenerator` receives `projectId` prop from Voice Generator page |
| T16 | `ProjectSelector` pre-selects `initialProjectId` when opened |

**2-Step QA + test run**:
```bash
npx tsc --noEmit
npx biome check --write __tests__/guided-step4-recorder-picker.test.tsx
npx vitest run __tests__/guided-step4-recorder-picker.test.tsx
```

---

## Open decisions (resolved)

| # | Question | Decision |
|---|----------|---------|
| D1 | 30s duration cap for recorded tracks? | YES — same policy as AI takes. The hard cap exists in video assembly. |
| D2 | Project pre-selected AND locked in Voice Generator, or just pre-selected? | Pre-selected, not locked. User may want to save to a different project. |
| D3 | State-loss warning when navigating to Voice Generator? | Simple inline notice ("Any unsaved changes will remain — just come back here after recording."), rendered below the toggle. |

---

## Non-goals (explicitly out of scope)

- No changes to `convex/audioTracks.ts`
- No changes to Step 5 or Step 6
- No changes to video assembly
- No Convex schema changes
- No new Convex queries or mutations

---

## Definition of done

- [ ] Segmented toggle renders correctly on mobile (375px) and desktop
- [ ] Selecting a recording enables the "Continue" button in Step 4
- [ ] `saveAudioSettings()` persists `narrationAudioStorageId` correctly for recorded takes
- [ ] Switching modes atomically clears stale state AND writes `narrationAudioStorageId: undefined` to Convex
- [ ] Tracks without `storageId` are shown disabled
- [ ] Tracks > 30s are shown disabled with "Too long" indicator
- [ ] Voice Generator page shows in-flow "Back" banner when `returnTo` is present (not sticky — no nav bar on tools route)
- [ ] Voice Generator pre-selects the project from `projectId` search param via `ProjectSelector`
- [ ] Returning from Voice Generator auto-switches to "My Recordings" tab
- [ ] `returnedFrom` param is stripped from URL
- [ ] `audioUrl` is re-hydrated from live `projectNarrations` query (two-effect pattern)
- [ ] Fixed footer has `env(safe-area-inset-bottom)` padding on iOS
- [ ] All 8 new `guided_step4` keys + `common.back_to_step4` present and translated in all 7 locales
- [ ] Dead keys removed (if old toggle removed)
- [ ] All 16 tests pass
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npx biome check` — 0 errors
- [ ] Changelog.md updated
- [ ] Committed and pushed
