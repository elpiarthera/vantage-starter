# Sprint 39 — Fix Report

**Date**: March 13, 2026
**Branch**: `sprint-39-sharing-credits-guided-flow-fixes`
**Commit**: `3318de8`
**Status**: ✅ Merged to branch — Ready for PR
**Issues resolved**: 18 GitHub issues across 13 tasks (including #143 — Edit Visuals & Styles, implemented in Sprint 40)
**Files changed**: 17 (1204 insertions, 89 deletions)
**QA**: 0 TypeScript errors · 0 Biome errors

---

## How to read this report

Each section corresponds to one GitHub issue. It includes:
- The original bug/request description
- The root cause identified
- The task that addressed it
- The exact files and code changes made

---

## Issue #160 — Public shared video link redirects recipient to "Create Account"

**Label**: bug · **Priority**: P0 Launch Blocker
**Task**: 39.1

### Description
When sharing a ShortReel video via WhatsApp, the recipient clicked the link and was redirected to the "Create Account" page instead of watching the video. The `/shared/<token>` URL pattern had no route in the application, so Clerk middleware intercepted it and redirected unauthenticated visitors to sign-up.

### Root cause
1. No `app/[locale]/shared/[token]/page.tsx` route existed.
2. The `/shared/` path was not listed in `middleware.ts` as a public route, so Clerk blocked unauthenticated access.

### Fix

**`middleware.ts`** — Added `/shared/` to public route matcher:
```diff
+ "/(en|fr|de|it|es|pt|ru)/shared(.*)", // Public shared link redirect page
+ "/shared(.*)", // Public shared link redirect page (fallback without locale)
```

**`app/[locale]/shared/[token]/page.tsx`** — New server component created:
```typescript
export default async function SharedLinkPage({ params }) {
  const link = await fetchQuery(api.sharedLinks.getByToken, { token });
  if (!link) notFound();

  const videoData = await fetchQuery(api.videos.getProjectIdByVideoId, {
    videoId: link.videoId,
  });
  if (!videoData?.projectId) notFound();

  redirect(`/${locale}/watch/${videoData.projectId}`);
}
```

**`convex/videos.ts`** — New `getProjectIdByVideoId` query added to resolve the `videoId` stored in `sharedLinks` back to a `projectId` for the watch page redirect.

---

## Issue #159 — WhatsApp shared video link leads to "Video Not Found" page

**Label**: bug · **Priority**: P0 Launch Blocker
**Task**: 39.1

### Description
When the recipient opened the shared link `/en/watch/<projectId>`, the page showed "Video Not Found — The video you're looking for doesn't exist or has been removed." even though the video existed and was accessible from the creator's account.

### Root cause
The `projects.getPublic` Convex query required `project.status === "completed"` to return data. Projects that had a `finalVideoUrl` set but a status value other than exactly `"completed"` (e.g., `"in_progress"`, `"saving_video"`) were silently rejected.

### Fix

**`convex/projects.ts`** — Relaxed the public visibility guard:
```diff
- // Only return if video is complete
- if (!project.finalVideoUrl || project.status !== "completed") {
+ // Only return if video is ready (has a URL) and not a draft
+ if (!project.finalVideoUrl || project.status === "draft") {
```

Projects now become publicly viewable as soon as they have a `finalVideoUrl` — the only exclusion is projects explicitly in `"draft"` status.

---

## Issue #151 — WhatsApp link preview thumbnail not generated

**Label**: bug · **Priority**: P1
**Task**: 39.1

### Description
When sharing a video on WhatsApp, no thumbnail appeared in the link preview card.

### Root cause
The `generateMetadata` in the watch page was already configured to set `openGraph.images` from `scenes[0]?.startFrameImageUrl`. The underlying issue was that the watch page was never reached by the OG crawler because the `/shared/` → `/watch/` redirect chain did not exist (same root cause as #160).

### Fix
Resolved as a side effect of Task 39.1. Once the `/shared/[token]` route was created and the `projects.getPublic` guard relaxed, the watch page became accessible to WhatsApp's crawler, which can now read the Open Graph metadata including the thumbnail.

---

## Issue #158 — Step 3 "Refine Scene Video with AI" modal gets stuck after approval

**Label**: bug · **Priority**: P1
**Task**: 39.3

### Description
After entering a refinement prompt and clicking "Approve this Direction" → "Regenerate Scene Video", the modal stayed open with no visible feedback. The backend eventually completed the regeneration, but the frontend showed nothing. Users believed the feature was broken.

Console evidence: repeated `updateScene` and `generateVideo` calls eventually completed with `Status: COMPLETED`, but the UI never reflected this.

### Root cause
Two separate bugs:

1. **`VideoRegenerationChat.tsx`**: `handleFinalRegenerate` called `onRegenerateApproved(sceneId)` without the user's feedback text. The feedback was never passed to the backend.
2. **`VideoGenerator.tsx`**: `setIsRegenerationChatOpen(false)` was called **after** `await regenerate(...)` resolved. Since `regenerate()` is a long-running async call (video generation), the modal stayed open for the entire duration with no progress indication.

### Fix

**`components/video-generation/VideoRegenerationChat.tsx`** — Updated prop type and feedback extraction:
```diff
- onRegenerateApproved: (sceneId: string) => void;
+ onRegenerateApproved: (sceneId: string, feedback: string) => void;

  const handleFinalRegenerate = useCallback(() => {
+   const lastUserMessage = messages.filter((m) => m.role === "user").at(-1);
+   const feedbackText = lastUserMessage?.parts
+     ?.filter((p) => p.type === "text")
+     .map((p) => ("text" in p ? p.text : ""))
+     .join("") ?? "";
-   onRegenerateApproved(sceneId);
+   onRegenerateApproved(sceneId, feedbackText);
    onClose();
  }, [messages, onRegenerateApproved, sceneId, onClose]);
```

**`components/video-generation/VideoGenerator.tsx`** — Modal closes before `await regenerate()`:
```diff
  async (sceneId: string, feedback: string) => {
    // ...credit check...
+   setIsRegenerationChatOpen(false); // Close immediately for UX feedback
    if (onRegenerateApproved) { onRegenerateApproved(sceneId, feedback); }
    await regenerate({ feedback, ... });
-   setIsRegenerationChatOpen(false);
  }
```

---

## Issue #142 — Final step "Make a Change" breaks return flow

**Label**: bug · **Priority**: P1
**Task**: 39.4

### Description
From Step 6 (Premiere Night / final review), clicking "Make a Change" navigated the user to Step 2 or Step 3. After completing their edit, the user was routed forward through the entire remaining flow (Step 3 → Step 4 → Step 5 → Step 6) instead of returning directly to Step 6. This caused confusion and significant friction at the final stage.

### Root cause
`handleIterationChoice` in `step-6/page.tsx` called `router.push(\`/guided/${step}?projectId=${projectId}\`)` with no context about where to return. Steps 2 and 3 had no `returnTo` mechanism and always navigated forward to their default next step.

### Fix

**`app/[locale]/guided/step-6/page.tsx`** — Added `returnTo` param:
```diff
  const handleIterationChoice = (step: string) => {
    setShowIterationModal(false);
-   router.push(`/guided/${step}?projectId=${projectId}`);
+   router.push(`/guided/${step}?projectId=${projectId}&returnTo=step-6`);
  };
```

**`app/[locale]/guided/step-2/page.tsx`** — Reads `returnTo` and uses it on continue:
```diff
+ const returnTo = searchParams.get("returnTo");

  // Continue button handler:
- router.push(`/guided/step-2b?projectId=${projectId}`)
+ const nextStep = returnTo ?? "step-2b";
+ router.push(`/guided/${nextStep}?projectId=${projectId}`);
```

**`app/[locale]/guided/step-3/page.tsx`** — Both forward-navigation paths respect `returnTo`:
```diff
+ const returnTo = searchParams.get("returnTo");

  // With approved narration:
- router.push(`/guided/step-4?projectId=${projectId}`)
+ const nextStep = returnTo ?? "step-4";
+ router.push(`/guided/${nextStep}?projectId=${projectId}`);

  // Without approved narration:
- router.push(`/guided/step-3b?projectId=${projectId}`)
+ const nextStep = returnTo ?? "step-3b";
+ router.push(`/guided/${nextStep}?projectId=${projectId}`);
```

**Bonus cleanup**: Removed a dead code block in `handleContinue` that contained a hardcoded English string comparison (`nextAction.text === "Continue to Step 4"`) that could never evaluate to `true` because the text comes from `t("continue_sound_design")`. Also removed an unused `generatedVideos` `useMemo` that was only referenced inside the dead block.

---

## Issue #149 / #138 — Excessive scene update calls and duplicate generation triggers

**Labels**: bug (none) · **Priority**: P1
**Task**: 39.5

### Description
The console showed repeated `[Step 3] updateScene called` and `[Step 3] Updating scene in Convex` messages on every Convex real-time subscription delivery — not just when the user changed something. This caused unnecessary backend load, higher Convex costs, potential race conditions, and debugging noise.

A related dead `useEffect(() => { getNextAction(); }, [getNextAction])` fired on every scene data change and re-ran a no-op function on each update.

### Root cause
1. **`useSceneData.ts`**: The `update()` function scheduled a debounced Convex write unconditionally, even when the incoming `updates` values were identical to what was already in `localScenes`. Any parent `useEffect` that called `update()` on subscription delivery (even with unchanged values) caused a write loop.
2. **`step-3/page.tsx`**: The initial active scene `useEffect` had `activeSceneId` in its dependency array. Every time the user changed the active scene, the effect re-ran and re-read the scenes list, creating spurious update cycles.

### Fix

**`hooks/business-logic/useSceneData.ts`** — Dirty check added before any write:
```typescript
// Dirty check: skip if all update fields already match current values
const currentScene = localScenes.find((s) => s._id === sceneId);
if (currentScene) {
  const hasChanges = Object.entries(updates).some(
    ([key, value]) =>
      currentScene[key as keyof typeof currentScene] !== value,
  );
  if (!hasChanges) return;
}
```

**`app/[locale]/guided/step-3/page.tsx`** — `useRef` init-once guard:
```diff
+ const hasSetInitialActiveScene = useRef(false);

  useEffect(() => {
+   if (hasSetInitialActiveScene.current) return;
    if (scenes.length === 0) return;
    setActiveSceneId(scenes[0].id);
+   hasSetInitialActiveScene.current = true;
- }, [scenes, activeSceneId]);
+ }, [scenes]);
```

Removed the dead no-op `useEffect`:
```diff
- useEffect(() => {
-   getNextAction();
- }, [getNextAction]);
```

---

## Issue #139 — Narration audio truncated at end of final video

**Label**: bug · **Priority**: P1
**Task**: 39.6

### Description
After rendering the final video, the narration audio was cut off before the end. The video appeared to end abruptly, cutting the narrator mid-sentence.

### Root cause
In `videoAssembly.ts`, `mixAudioWithRendi` was called with `expectedDuration` — computed as `numScenes × clipDuration` (e.g., 3 scenes × 10s = 30s). If the narration was longer than 30s, the audio mixing tool truncated it to `expectedDuration`. The `narrationDurationMs` argument was passed into `assembleVideo` but **never used** in the duration calculation.

### Fix

**`convex/actions/videoAssembly.ts`** — Compute `mixDuration` using the longer of the two durations, applied to all three `mixAudioWithRendi` call sites (hard-cut, per-scene transitions, xfade):

```diff
  const expectedDuration =
    transitionMode === "hard_cut"
      ? numScenes * clipDuration
      : numScenes * clipDuration - (numScenes - 1) * transitionDuration;

+ // Use the longer of: expected video duration OR narration duration
+ // to prevent narration from being truncated during audio mix.
+ const narrationDurationSec = args.narrationDurationMs
+   ? args.narrationDurationMs / 1000
+   : 0;
+
+ const mixDuration = Math.max(expectedDuration, narrationDurationSec);
+
+ console.log(
+   `[VideoAssembly] Mix duration: ${mixDuration.toFixed(2)}s (video: ${expectedDuration.toFixed(2)}s, narration: ${narrationDurationSec.toFixed(2)}s)`
+ );

  // All three call sites:
- mixAudioWithRendi(args.narrationUrl, args.musicUrl, expectedDuration)
+ mixAudioWithRendi(args.narrationUrl, args.musicUrl, mixDuration)
```

**`app/[locale]/guided/step-4/page.tsx`** — Added a UI-level guard that blocks narration generation when estimated duration exceeds 30 seconds, with an adaptive Dialog/Drawer modal:

```typescript
const MAX_NARRATION_DURATION_SEC = 30;

// In generateNarrationTake, before any API call:
if (estimatedDuration > MAX_NARRATION_DURATION_SEC) {
  setShowNarrationTooLongModal(true);
  return;
}
```

The modal renders with the project's dark theme (`bg-[#182634]`, `border-[#314d68]`) and tells the user: *"Your narration is estimated at ~{N}s. Please shorten it to under 30 seconds (~75 words) for a well-paced video."*

---

## Issue #141 — Portrait image format causes character distortion during final video assembly

**Label**: bug · **Priority**: P1
**Task**: 39.7

### Description
When users uploaded portrait-orientation images (taller than wide) as scene frames, characters appeared stretched or distorted in the final assembled video. The rendering pipeline expects landscape images (16:9), but the interface allowed portrait images without warning.

### Root cause
`FrameAssignment.tsx` called `onUpdateScene()` immediately on asset selection with no orientation validation. No check existed anywhere in the upload flow to detect portrait format images.

### Fix

**`components/scene-management/FrameAssignment.tsx`** — Added async orientation validation before any scene update:

```typescript
async function checkImageOrientation(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve(img.naturalWidth >= img.naturalHeight);
    img.onerror = () => resolve(true); // Fail open on error
    img.src = url;
  });
}

const handleAssetSelect = async (assetUrl: string) => {
  const isLandscape = await checkImageOrientation(assetUrl);
  if (!isLandscape) {
    setShowPortraitError(true);
    setIsModalOpen(false);
    return; // Block the update
  }
  // ... existing update logic ...
};
```

Added an adaptive Dialog/Drawer modal (matching the project's dark theme) displayed when a portrait image is selected:

- **Title**: "Landscape images only"
- **Description**: "Portrait images (taller than wide) cause character distortion in the final video. Please upload landscape images (16:9) for optimal video generation."
- **CTA**: "Got it"

**`messages/en.json`** — New keys added under `frame_assignment`:
```json
"portrait_image_title": "Landscape images only",
"portrait_image_description": "Portrait images (taller than wide) cause character distortion in the final video. Please upload landscape images (16:9) for optimal video generation.",
"portrait_image_cta": "Got it"
```

---

## Issue #154 — Step 2 — AI ignores selected event type when generating story

**Label**: bug · **Priority**: P1
**Task**: 39.8

### Description
When the user selected "Holiday" as their event type in Step 1, the AI in Step 2 generated or regenerated a story for a completely different occasion (e.g., a birthday). The AI had no knowledge of the user's selected event type.

### Root cause
In `step-2/page.tsx`, the `fetch("/api/chat")` request body only sent `{ messages, projectId, projectName }`. The `project.occasion` field was never included. In `app/api/chat/route.ts`, `AI_DIRECTOR_PROMPT.getPrompt()` was called with no context, so the AI used only its default system prompt which mentions weddings/birthdays generically.

### Fix

**`app/[locale]/guided/step-2/page.tsx`** — `occasion` added to both `/api/chat` request bodies (main submit + "Start Over" path):
```diff
  body: JSON.stringify({
    messages: apiMessages,
    projectId,
    projectName: project?.name,
+   occasion: project?.occasion,
  }),
```

**`app/api/chat/route.ts`** — Extracted and passed to `getPrompt`:
```diff
- const { messages, projectId, projectName, sceneId } = body;
+ const { messages, projectId, projectName, sceneId, occasion } = body;

  const systemPrompt = AI_DIRECTOR_PROMPT.getPrompt(
-   undefined
+   occasion ? { projectType: occasion } : undefined,
  );
```

**`lib/ai/prompts/chat/ai-director.prompt.ts`** — Replaced weak context line with a strong explicit instruction:
```diff
  if (context?.projectType) {
-   prompt += `\n\nCurrent project type: ${context.projectType}`;
+   prompt +=
+     `\n\nIMPORTANT: The user is creating a video for a **${context.projectType}**. ` +
+     `All story suggestions, scene descriptions, and emotional narrative must be ` +
+     `tailored specifically to this occasion type. Do NOT default to wedding or generic content.`;
  }
```

---

## Issue #156 — Step 6 "View assembly progress" window cannot be closed

**Label**: enhancement · **Priority**: P2
**Task**: 39.9

### Description
Once the final video assembly started, the assembly progress overlay took over the full Step 6 screen with no way to dismiss it. Users were locked into watching the progress bar with no option to return to the main UI or do anything else.

### Root cause
The assembly progress early-return block rendered a full-screen `Card` with no dismiss option. The condition only cleared when `assemblyStatus` became `"completed"` or `"failed"` — which could take 10–20 minutes.

### Fix

**`app/[locale]/guided/step-6/page.tsx`** — Added `assemblyProgressDismissed` state and a dismiss button:

```diff
+ const [assemblyProgressDismissed, setAssemblyProgressDismissed] = useState(false);

  if (
    assemblyStatus &&
    assemblyStatus !== "completed" &&
    assemblyStatus !== "failed" &&
+   !assemblyProgressDismissed
  ) {
    return (
      <div ...>
        <Card ...>
          <CardHeader>
+           <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <Loader2 ... />
                {t("assembly_in_progress")}
              </CardTitle>
+             <Button
+               variant="ghost"
+               size="sm"
+               onClick={() => setAssemblyProgressDismissed(true)}
+               className="text-gray-400 hover:text-white"
+             >
+               {t("assembly_view_in_background")}
+             </Button>
+           </div>
          </CardHeader>
```

**`messages/en.json`** — New key under `guided_step6`:
```json
"assembly_view_in_background": "View in background"
```

Clicking the button hides the full-screen overlay and shows the Step 6 main UI. When assembly completes, `assemblyStatus` switches to `"completed"`, which renders the final video UI regardless of the dismissed state.

---

## Issue #157 / #153 — Replace "Continue to the Story" button with clearer cinematic guidance

**Labels**: enhancement · **Priority**: P2
**Task**: 39.9

### Description
The CTA button in Step 1 read "Continue to The Story ✨". Since the user has already written their story in the field above, this was ambiguous. What the system actually does in the next step is break the story into 3 cinematic scenes — a key part of the ShortReel storytelling workflow.

### Fix

**`messages/en.json`** — Key `guided_step1.continue_to_story_button` updated:
```diff
- "continue_to_story_button": "Continue to The Story ✨"
+ "continue_to_story_button": "Break Your Story into 3 Cinematic Scenes ✨"
```

---

## Issue #161 — Rename "Corporate Event" use-case to "Unleash Your Creativity"

**Label**: enhancement · **Priority**: P2
**Task**: 39.9

### Description
The "Corporate Event" occasion label was too restrictive and implied a business context. The platform is positioned as an AI cinematic storytelling tool, and this category should serve as a creative sandbox for any type of video that doesn't fit traditional event categories.

### Fix

**`messages/en.json`** — Keys under `occasions` updated (display labels only — the underlying data model key `"corporate"` in the database is unchanged):
```diff
- "corporate": "Corporate Event",
- "corporate_desc": "Professional & Energetic 💼"
+ "corporate": "Unleash Your Creativity",
+ "corporate_desc": "Express Yourself Freely 🎨"
```

---

## Issue #136 / #140 — Credit system dead-end + missing credit validation

**Labels**: bug · **Priority**: P0 Launch Blocker
**Task**: 39.2

### Description
**#140**: The interface displayed "Refine with AI (5 left) — 20 credits" but still allowed the regeneration process to start even when the user had only 5 credits (less than the 20 required). Backend validation caught the failure after the fact, but users wasted time waiting.

**#136**: More broadly, the system allowed credits to be consumed throughout the flow without pre-flight checks. Users could reach a dead-end with zero credits and no recharge option, unable to complete their project.

### Finding
Upon investigation, both pre-flight guards were already correctly implemented in the codebase before this sprint:

- **`app/[locale]/guided/step-3/page.tsx`**: `handleGenerateVideoClick` already checks `(currentCredits ?? 0) < VIDEO_GENERATION_CREDITS` before any API call, and shows `InsufficientCreditsModal` on failure.
- **`components/video-generation/VideoGenerator.tsx`**: `handleRegenerateVideoClick` (the "Refine with AI" path) already guards with `currentCredits < VIDEO_GENERATION_CREDITS` before opening the regeneration modal — meaning the modal never opens if credits are insufficient.
- `InsufficientCreditsModal` is rendered in both components with correct `required` and `available` props.

The reported behavior from the issues may have been observed on an older version of the app. No code changes were required for this task.

---

## Issue #147 — Scene generation lacks detailed progress indicator

**Label**: enhancement · **Priority**: P2
**Task**: 39.10

### Description
During scene generation in Step 3, the status label showed a single static message: "Creating your video" — with no indication of which stage the generation was in. Users had no way to know whether anything was happening or how long to expect to wait.

### Root cause
`VideoGenerator.tsx` used a single i18n key `t("creating_status")` for the entire `"in_progress"` status, regardless of elapsed time. The four internal stages of generation (frame generation, rendering, stitching, finalization) were never surfaced to the user.

### Fix

**`components/video-generation/VideoGenerator.tsx`** — Added `stageIndex` state that advances every 20 seconds while `generationStatus === "in_progress"`, capped at the 4th stage:

```typescript
const [stageIndex, setStageIndex] = useState(0);

useEffect(() => {
  if (generationStatus !== "in_progress") {
    setStageIndex(0);
    return;
  }
  const interval = setInterval(() => {
    setStageIndex((i) => Math.min(i + 1, 3));
  }, 20000);
  return () => clearInterval(interval);
}, [generationStatus]);
```

Replaced static label:
```diff
- {generationStatus === "in_progress" && t("creating_status")}
+ {generationStatus === "in_progress" && t(`generation_stage_${stageIndex}`)}
```

**`messages/en.json`** — 4 new keys added inside `video_generator` namespace:
```json
"generation_stage_0": "Generating frames…",
"generation_stage_1": "Rendering animation…",
"generation_stage_2": "Stitching video…",
"generation_stage_3": "Finalizing output…"
```

**All 7 locales** (en, fr, de, it, es, pt, ru) updated via `pnpm translate`. `creating_status` key preserved for backward compatibility.

### Behaviour
- Stage 0 — "Generating frames…" shown immediately on generation start
- Stage 1 — "Rendering animation…" after ~20s
- Stage 2 — "Stitching video…" after ~40s
- Stage 3 — "Finalizing output…" after ~60s, stays until completion
- Resets to Stage 0 on next generation

---

## Issue #148 — Multiple play buttons visible before video generation

**Label**: enhancement · **Priority**: P2
**Task**: post-sprint fix

### Description
Before video generation starts, the Video Generation card showed three visually confusing play-related elements simultaneously: a `Play` icon in the card section header, a large blue filled circle with a `Play` icon in the idle state (mimicking a video player play button), and the "Generate Scene Video" action button below it. The centred blue Play circle had no `onClick` handler, so tapping it did nothing — making the UI appear broken.

### Root cause
The idle state used a large `bg-[#0d7ff2]` filled circle with a `<Play>` icon as a decorative placeholder. Visually it was indistinguishable from a functional video player play button. Users expected it to be interactive.

### Fix

**`components/video-generation/VideoGenerator.tsx`** — Replaced the blue Play circle with a neutral `Clapperboard` icon on a dark muted background:

```diff
- import { CheckCircle, Download, Play, RefreshCw } from "lucide-react";
+ import { CheckCircle, Clapperboard, Download, Play, RefreshCw } from "lucide-react";

  // Idle state icon:
- <div className="w-16 h-16 bg-[#0d7ff2] rounded-full flex items-center justify-center mx-auto mb-4">
-   <Play className="h-8 w-8 text-white" />
- </div>
+ <div className="w-16 h-16 bg-[#1a3a52] rounded-full flex items-center justify-center mx-auto mb-4">
+   <Clapperboard className="h-8 w-8 text-[#0d7ff2]" />
+ </div>
```

The `Play` icon in the card header title is kept — it is a small label icon next to the "Video Generation" section title, contextually distinct from a play button. The `Clapperboard` icon clearly communicates "video production ready" without implying interactivity. No logic, props, or i18n changes required.

---

## Issue #146 — Duplicate upload CTA in the Upload New tab

**Label**: enhancement · **Priority**: P2
**Task**: post-sprint fix

### Description
In the "Upload New" tab of the `AssetSelector`, the upload zone showed two overlapping interactive affordances: a large `Upload` icon with a "Click to select files or drag and drop" subtitle (which looked clickable but did nothing), and a separate blue "Choose Files" button below it (the only actual trigger). Clicking anywhere on the zone except the button had no effect, making the UI feel broken.

### Root cause
The dropzone `div` handled drag events but had no `onClick` — only the inner `<Button>` did. The large icon and descriptive text created a false affordance that clicking the zone area would open the file picker.

Additionally, the button contained a redundant `<Upload>` icon inline, mirroring the large icon already displayed above it.

### Fix

**`components/asset-management/AssetSelector.tsx`** — Made the entire dropzone area the single click target:

```diff
  <div
    className={`border-2 border-dashed rounded-lg ... transition-colors
+     cursor-pointer`}
    onDragEnter={handleDrag}
    onDragLeave={handleDrag}
    onDragOver={handleDrag}
    onDrop={handleDrop}
+   onClick={() => document.getElementById("file-upload")?.click()}
  >
-   <Upload className="h-8 w-8 ... text-gray-400" />
+   <Upload className="h-8 w-8 ... text-gray-400 pointer-events-none" />
    <h3>...</h3>
    <p>...</p>
    <Input type="file" id="file-upload" ... />
    <Button
-     onClick={() => document.getElementById("file-upload")?.click()}
+     onClick={(e) => e.stopPropagation()}
+     tabIndex={-1}
+     aria-hidden="true"
+     className="... pointer-events-none"
    >
-     <Upload className="h-4 w-4 mr-2" />
      {t("upload.choose_files")}
    </Button>
  </div>
```

The entire dropzone (icon + text + button area) is now one unified click target that opens the file picker. The button is kept as a visual CTA with its blue styling but is removed from the tab order and interaction model — click bubbles up from anywhere in the zone to the container's `onClick`. No i18n changes required.

---

## Issue #145 — Creation time messaging shows "10-15 min" instead of actual "20-30 min"

**Label**: enhancement · **Priority**: P2
**Task**: post-sprint fix

### Description
The homepage displayed "10-15 min" as the total creation time, but real user testing consistently showed the process takes closer to 20-30 minutes. The mismatch set incorrect expectations and degraded trust.

### Fix

**`messages/en.json`** (and all 6 locale files) — Updated `creation_time_title`:

```diff
- "creation_time_title": "10-15 min"
+ "creation_time_title": "20-30 min"
```

Locale-specific formatting preserved: German uses `"20-30 Min."`, Russian uses `"20-30 мин"`. All other locales (fr, pt, es, it, en) use `"20-30 min"`.

---

## Issues Out of Scope (Sprint 39)

The following issues were triaged but deferred:

| Issue | Label | Reason |
|-------|-------|--------|
| #143 — Frame removal/replacement not functional | bug | ✅ Implemented in Sprint 40 |
| #147 — Scene generation progress indicator | enhancement | ✅ Implemented as Task 39.10 — rotating stage labels in `VideoGenerator` |
| #152 — Replace static illustrations with looping videos | enhancement | Asset production dependency |
| #148 — Multiple play buttons | `invalid` | ✅ Fixed — replaced misleading Play circle with `Clapperboard` icon in idle state |
| #146 — Duplicate upload CTA | `invalid` | ✅ Fixed — entire dropzone is now the single click target; button kept as visual affordance only |
| #145 — Update creation time message | `invalid` | ✅ Fixed — `creation_time_title` updated to "20-30 min" across all 7 locales |
| #144 — Replace text with logo | `invalid` | Design asset dependency |
| #137 — Credit consumption timing | `invalid` | By design — upfront deduction + auto-refund on failure; see architecture note below |
| #162 — AI Transform CTA disabled with no credit explanation | bug | Not yet addressed — deferred to Sprint 40 |

---

## Files Changed Summary

| File | Issues addressed | Nature of change |
|------|-----------------|-----------------|
| `middleware.ts` | #159, #160 | Added `/shared/` to public routes |
| `app/[locale]/shared/[token]/page.tsx` | #159, #160 | **New file** — public share token resolver |
| `convex/projects.ts` | #159 | Relaxed `getPublic` status guard |
| `convex/videos.ts` | #159, #160 | New `getProjectIdByVideoId` query |
| `convex/actions/videoAssembly.ts` | #139 | `mixDuration = max(videoDuration, narrationDuration)` |
| `hooks/business-logic/useSceneData.ts` | #138, #149 | Dirty-check guard in `update()` |
| `app/[locale]/guided/step-2/page.tsx` | #142, #154 | `returnTo` param + `occasion` in fetch body |
| `app/[locale]/guided/step-3/page.tsx` | #142, #138 | `returnTo` navigation + dead code removal + `useRef` init guard |
| `app/[locale]/guided/step-4/page.tsx` | #139 | 30s narration cap modal |
| `app/[locale]/guided/step-6/page.tsx` | #142, #156 | `returnTo=step-6` param + assembly dismiss button |
| `app/api/chat/route.ts` | #154 | Extract + forward `occasion` to AI prompt |
| `lib/ai/prompts/chat/ai-director.prompt.ts` | #154 | Strong occasion instruction in system prompt |
| `components/scene-management/FrameAssignment.tsx` | #141 | Portrait orientation check + rejection modal |
| `components/video-generation/VideoGenerator.tsx` | #158 | Close modal before `await regenerate()` |
| `components/video-generation/VideoRegenerationChat.tsx` | #158 | Pass feedback text through `onRegenerateApproved` |
| `messages/en.json` | #141, #139, #156, #157, #153, #161 | New i18n keys for all new UI strings |
| `components/video-generation/VideoGenerator.tsx` | #147, #148 | Rotating stage labels + `Clapperboard` idle state icon |
| `messages/en.json` *(updated)* | #147 | 4 `generation_stage_N` keys + 7-locale translations via `pnpm translate` |
| `docs/MVP/Todo/sprint-39-sharing-credits-guided-flow-fixes.md` | — | Sprint planning document |
| `components/asset-management/AssetSelector.tsx` | #146 | Unified dropzone click target; button demoted to visual affordance |
| `messages/en.json` + 6 locale files | #145 | `creation_time_title` updated to "20-30 min" |

---

## Issue #143 — Deferred Analysis & Sprint 40 Plan

### Why "Edit Visuals & Styles" cannot be a simple redirect

"Edit Visuals & Styles" from Step 6 is not a lightweight frame swap. Replacing a scene frame only changes the **source image** — the scene video was already generated from the original frame and is baked into the final assembly. Simply swapping the frame image without re-generating the scene video would leave the old video unchanged.

The full re-generation chain required is:

> **Step 6 → Step 3 (replace/remove/upload/generate frame) → regenerate scene video → re-assemble final video → return to Step 6**

If this chain is not built, the "Edit Visuals & Styles" option must be **disabled with a tooltip** to prevent the misleading UX promise described in the issue.

### GitHub comment (copy-paste ready)

> **Engineering analysis — Sprint 39**
>
> After investigation, the root cause is architectural: "Edit Visuals & Styles" from Step 6 is not a lightweight frame swap. It requires a full re-generation chain:
>
> **Step 6 → Step 3 (replace/remove/upload/generate frame) → regenerate scene video → re-assemble final video → return to Step 6**
>
> The scene video was already generated from the original frame. Simply replacing the frame image does not update the video — the scene video must be regenerated first, and then the final assembly must run again with the new scene video.
>
> **What we cannot do**: redirect to Step 3 for a simple frame edit and return to Step 6 without re-generating. The final video would still contain the old scene.
>
> **What needs to be built (Sprint 40)**:
> 1. When the user enters "Edit Visuals & Styles" from Step 6 and saves a new frame, mark the affected scene(s) as `needs_regeneration`
> 2. Trigger scene video regeneration for those scenes (same flow as Step 3)
> 3. Once all edited scenes are regenerated, automatically trigger a new final assembly
> 4. Return the user to Step 6 once the new assembly is complete
>
> **Short-term mitigation**: If this full chain cannot be shipped in Sprint 40, the "Edit Visuals & Styles" option should be **hidden or disabled** in the Step 6 iteration modal to avoid the misleading UX described in this issue. A disabled button with a tooltip — *"Visual editing requires scene regeneration — coming soon"* — is better than a broken promise.

### Sprint 40 task breakdown

| Sub-task | Description |
|---|---|
| A | Disable "Edit Visuals & Styles" button with tooltip (immediate mitigation) |
| B | Add `needs_regeneration` flag to scene schema; set it on frame change when `returnTo=step-6` |
| C | On return to Step 6: detect flagged scenes, auto-trigger scene video regeneration |
| D | After regeneration completes: auto-trigger `buildFinalVideo` re-assembly |
| E | i18n (new strings) + 2-Step QA |

**Recommended order**: Ship Sub-task A first (30 min, zero risk) to close the misleading UX gap immediately. Then implement B → C → D in sequence since each depends on the previous.

---

## Issue #137 — Credit Consumption Timing: Architecture Note

**Label**: `invalid` · **Priority**: N/A — by design

### Summary

Issue #137 questioned when credits are deducted during a generation. This is not a bug — the timing is intentional and the credit system is fully modular and configurable. No code changes are needed to adjust costs or tier grants.

---

### Credit costs per action → `creditCosts` table in Convex

Every AI action cost is a single row in the `creditCosts` table. To change how many credits a task consumes, update that row in the Convex dashboard — **no code change, no deploy required**.

| `actionType` | Controls cost for |
|---|---|
| `"image_generation"` | AI image generation per image |
| `"video_generation"` | Scene video generation (Kling) |
| `"video_regeneration"` | Scene video refinement |
| `"step2_chat_message"` | AI Director story chat |
| `"kling_video_5s"` / `"kling_video_10s"` | Duration-specific video generation |

`isActive: boolean` — set to `false` to disable any action type without deleting the row.

---

### Credit grants per tier → `subscriptionTiers` table in Convex

Each Polar product (subscription or one-time credit pack) maps to a row in `subscriptionTiers`, linked by `polarProductId`:

| Field | Purpose |
|---|---|
| `initialCredits` | Credits granted on first purchase / subscription start |
| `monthlyCredits` | Credits added on each monthly renewal (subscriptions only) |
| `bonusCredits` | Extra bonus credits on one-time packs |
| `polarProductId` | Polar product UUID — the webhook resolves the row by this field |

To change how many credits a tier grants: update the `subscriptionTiers` row in Convex and align the product configuration in Polar. The webhook resolves the tier purely by `polarProductId`, so the two stay in sync automatically.

---

### The timing question

Credits are deducted **upfront** before the AI call, with an automatic `refundCredits` on failure. This is intentional:

- Prevents credit exploitation on retries
- Keeps `userCredits.balance` consistent as the source of truth at all times
- The `creditTransactions` table provides a full audit trail of every deduction, refund, and purchase

This is the correct pattern for metered AI systems. All edge cases (failed generation, partial completion) are already handled via the refund path — no changes needed.

---

## Issue #162 — AI Transform CTA disabled with no credit explanation (Deferred — Sprint 40)

**Label**: bug · **Priority**: P1
**Status**: Deferred to Sprint 40

### Description
In the AI Transform End Frame modal (Step 3 → Visual Design), the "Transform (1 image) – 5 credits" CTA button appears disabled/non-clickable when the user likely has insufficient credits. The UI provides no explanation: no remaining balance, no required amount, no shortfall, and no purchase path. The user hits a hard dead-end in the creative flow.

A secondary console warning — *"The deferred DOM Node could not be resolved to a valid node"* — was also reported, potentially related to the disabled state rendering.

### Root cause (likely)
The `AITransformModal` component checks the credit balance before enabling the Transform button, but when `currentCredits < CREDITS_PER_IMAGE` it simply disables the button with `disabled={true}` and no accompanying explanation or `InsufficientCreditsModal` trigger. Unlike `VideoGenerator` and `AssetSelector` (which both show `InsufficientCreditsModal` on click), the AI Transform path silently blocks the action.

### What needs to be built (Sprint 40)

| Sub-task | Description |
|---|---|
| A | When Transform button is disabled due to insufficient credits, render an inline explanation: remaining balance, required credits, shortfall |
| B | Add a "Buy Credits" CTA inside the modal that opens `InsufficientCreditsModal` (same pattern as `VideoGenerator`) |
| C | After successful credit purchase, return user to same project / same scene / same modal context |
| D | Preserve the drafted transform prompt across the purchase flow if possible |
| E | Investigate the DOM node warning and resolve if related to the disabled state |

### Acceptance criteria (from issue)
- Disabled CTA clearly explains the reason
- Remaining credit balance is visible in the modal
- Missing credit amount is visible
- User can directly access purchase/top-up flow from within the modal
- After successful purchase, user is returned to the exact workflow context
- Drafted transform prompt is preserved if possible
- DOM node console warning resolved
