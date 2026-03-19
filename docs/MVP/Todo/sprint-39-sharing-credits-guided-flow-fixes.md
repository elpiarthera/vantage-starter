# Sprint 39: Sharing, Credits & Guided Flow Bug Fixes

**Date**: March 13, 2026
**Branch**: `sprint-39-sharing-credits-guided-flow-fixes`
**Status**: Planning
**Goal**: Fix all launch-blocking bugs in video sharing, credit validation, and guided flow state transitions before public launch.
**Dependencies**: Sprint 38 (all tasks complete) ✅
**QA Strategy**: **2-Step QA** — (1) TypeScript `npx tsc --noEmit`, (2) Biome `npx biome check --write <files>` for every task.

---

## 🔍 Problem Summary

Sprint 39 targets three categories of launch-blocking defects:

1. **Video Sharing (Issues #159, #160)** — Shared `/watch/` links work only for authenticated users. The `/shared/` token-based links (used in WhatsApp shares) have no route and redirect unauthenticated visitors to the sign-up page. Additionally, `projects.getPublic` returns `null` unless `status === "completed"`, which causes "Video Not Found" for valid projects in intermediate states.

2. **Credit System (Issues #136, #140)** — The `deductCredits` mutation correctly returns `{ success: false }` on insufficient balance, but the guided flow pages do not perform a pre-flight credit check before triggering expensive multi-step actions. Users reach dead-end states with zero credits and no recharge CTA.

3. **Guided Flow Bugs (Issues #158, #142, #149/#138, #139, #141, #154)** — Refinement modal does not visually close after approval; "Make a Change" from Step 6 does not pass a `returnTo` parameter so users must re-traverse all steps; `updateScene` in `useSceneData` fires on every Convex subscription update (missing guard); narration audio is truncated because `mixAudioWithRendi` receives `expectedDuration` computed from fixed clip × scene count while actual narration may be longer; portrait image uploads are not rejected at upload time; the AI Director system prompt never receives the project's `occasion` field.

4. **UX Quick Wins (Issues #156, #157/#153, #161)** — Assembly progress screen has no close/dismiss option; "Continue to the Story" button copy undersells the step; "Corporate Event" label should be updated.

---

## 🗺️ Sprint 39 Tasks

---

### Task 39.1 — Fix Public Video Sharing: Missing `/shared/` Route + Auth Bypass

**Status**: 📝 Pending
**Issues**: #160, #159, #151

**Objective**: Ensure that a WhatsApp-shared `/shared/<token>/<shortId>` link lands an unauthenticated visitor directly on the public watch page, and that `projects.getPublic` returns videos for projects that have a `finalVideoUrl` even when `status` is not exactly `"completed"`.

**Files to Create/Modify**:

| File | Action | Description |
|------|--------|-------------|
| `app/[locale]/shared/[token]/page.tsx` | **Create** | New public route that resolves a share token to a projectId and redirects to `/[locale]/watch/[projectId]` |
| `middleware.ts` | **Modify** | Add `/shared/` and `/(locale)/shared/` to `isPublicRoute` matcher |
| `convex/projects.ts` | **Modify** | Relax `getPublic` guard: return project if `finalVideoUrl` exists, regardless of `status` field value |
| `app/[locale]/watch/[projectId]/page.tsx` | **Verify** | Confirm `generateMetadata` handles token-based projectId — no changes expected |

**Implementation**:

**Step 1 — Add `/shared/` to middleware public routes**

In `middleware.ts`, extend `isPublicRoute`:

```typescript
const isPublicRoute = createRouteMatcher([
  // ... existing entries ...
  "/(en|fr|de|it|es|pt|ru)/watch(.*)",
  "/watch(.*)",
  // ADD THESE:
  "/(en|fr|de|it|es|pt|ru)/shared(.*)",
  "/shared(.*)",
]);
```

**Step 2 — Create the `/shared/[token]/page.tsx` server component**

The link format from the issue is `/shared/<token>/<shortId>`. Create a server-side redirect page:

```typescript
// app/[locale]/shared/[token]/page.tsx
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";

interface SharedPageProps {
  params: { token: string; locale: string };
}

export default async function SharedLinkPage({ params }: SharedPageProps) {
  const link = await fetchQuery(api.sharedLinks.getByToken, {
    token: params.token,
  });

  if (!link) {
    redirect(`/${params.locale}/watch/not-found`);
  }

  // sharedLinks stores videoId (a `videos` table ID)
  // Confirm the `videos` table has a `projectId` field and redirect accordingly
  redirect(`/${params.locale}/watch/${link.videoId}`);
}
```

> ⚠️ Pre-work confirmation: `convex/sharedLinks.ts` stores `videoId: v.id("videos")`, not `projectId`. Before implementing, open `convex/videos.ts` and confirm there is a `projectId` field on the `videos` table, then redirect to `/watch/${video.projectId}` instead of `/watch/${link.videoId}`.

**Step 3 — Relax `projects.getPublic` guard**

In `convex/projects.ts`:

```typescript
// BEFORE:
if (!project.finalVideoUrl || project.status !== "completed") {
  return null;
}

// AFTER — return if video URL exists, regardless of status string:
// Safer variant: also gate out drafts
if (!project.finalVideoUrl || project.status === "draft") {
  return null;
}
```

**Step 4 — WhatsApp OG thumbnail (Issue #151)**

The `generateMetadata` function in `app/[locale]/watch/[projectId]/page.tsx` sets `openGraph.images` from `scenes[0]?.startFrameImageUrl`. Confirm this field is populated for all completed projects. If not, add a fallback to a `thumbnailUrl` field stored at the project level.

**2-Step QA**:

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write middleware.ts "app/[locale]/shared/" convex/projects.ts

# Step 3: Deploy to Convex dev
npx convex dev --once
```

**Checklist**:
- [ ] Unauthenticated visitor clicking a WhatsApp `/shared/<token>` link lands on `/watch/` page without being redirected to sign-up
- [ ] A video with `finalVideoUrl` set but `status !== "completed"` is visible on the public watch page
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] OG image appears in WhatsApp link preview (manual test)

---

### Task 39.2 — Credit System: Pre-flight Checks + Dead-End Prevention

**Status**: 📝 Pending
**Issues**: #136, #140

**Objective**: Before entering any expensive guided-flow step, check whether the user's credit balance is sufficient to complete it. If not, immediately show `InsufficientCreditsModal` with a recharge CTA instead of letting the action start and fail mid-way.

**Files to Modify**:

| File | Action | Description |
|------|--------|-------------|
| `app/[locale]/guided/step-3/page.tsx` | Modify | Add pre-flight credit check before `generateVideoAction` is called; check balance against `VIDEO_GENERATION_CREDITS` (20) |
| `app/[locale]/guided/step-3/page.tsx` | Modify | Add pre-flight check before `handleRegenerateApproved` triggers regeneration |
| `convex/credits.ts` | Modify | Export a new `estimateProjectCreditCost` query that returns the estimated total credits needed to finish a project from the current step |
| `components/credits/InsufficientCreditsModal.tsx` | Modify | Accept optional `estimatedTotal` and `creditsRemaining` props to render the "Credits remaining: X, Credits needed: ~Y" breakdown |

**Implementation**:

**Step 1 — Pre-flight guard in `step-3/page.tsx`**

The `VIDEO_GENERATION_CREDITS` constant is already defined. The `currentCredits` from `useCredits` is already available. Add a guard before calling `generateVideoAction`:

```typescript
// In the function that triggers generateVideoAction:
if ((currentCredits ?? 0) < VIDEO_GENERATION_CREDITS) {
  setShowInsufficientCreditsModal(true);
  return; // Stop before any deduction attempt
}
```

Apply the same pattern before any "Refine with AI" regeneration call.

**Step 2 — Enhanced `InsufficientCreditsModal` for Issue #136**

Add two optional props to show project-level cost estimation:

```typescript
interface InsufficientCreditsModalProps {
  // ... existing props ...
  estimatedProjectTotal?: number;    // estimated credits to finish project
  currentStep?: number;              // which step the user is on
}
```

When `estimatedProjectTotal` is provided, render a breakdown row:

```tsx
{estimatedProjectTotal && (
  <div className="flex justify-between items-center text-sm">
    <span className="text-gray-400">
      {tCredits("estimated_to_finish")}
    </span>
    <span className="text-amber-400 font-medium">
      ~{estimatedProjectTotal} {tCredits("credits")}
    </span>
  </div>
)}
```

Add to `messages/en.json` under the `credits` namespace:

```json
"estimated_to_finish": "Est. credits to finish"
```

**Step 3 — Convex `estimateProjectCreditCost` query**

```typescript
// convex/credits.ts — add new exported query
export const estimateProjectCreditCost = query({
  args: { projectId: v.id("projects"), fromStep: v.number() },
  handler: async (ctx, { projectId, fromStep }) => {
    const scenes = await ctx.db
      .query("scenes")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    const ungenerated = scenes.filter((s) => s.status !== "completed").length;
    const VIDEO_GEN_COST = 20;
    const ASSEMBLY_COST = 50; // approximate
    return {
      estimatedCredits: ungenerated * VIDEO_GEN_COST + ASSEMBLY_COST,
      ungeneratedScenes: ungenerated,
    };
  },
});
```

**2-Step QA**:

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write "app/[locale]/guided/step-3/page.tsx" components/credits/InsufficientCreditsModal.tsx convex/credits.ts messages/en.json

# Step 3: Deploy to Convex dev
npx convex dev --once

# Step 4: Generate + verify translations
pnpm translate
node scripts/verify-translations.js
```

**Checklist**:
- [ ] Clicking "Generate Video" with insufficient credits immediately shows modal — no API call is made
- [ ] Clicking "Refine with AI" with insufficient credits shows modal — `deductCredits` is never called
- [ ] Modal shows "Required / Balance / Shortfall" three-row breakdown
- [ ] `pnpm translate` succeeds and `verify-translations.js` reports 0 missing keys

---

### Task 39.3 — Refinement Modal Stuck After Approval (Issue #158)

**Status**: 📝 Pending
**Issue**: #158

**Objective**: After the user clicks "Approve this Direction" and then "Regenerate Scene Video", the modal closes immediately and the scene card shows a visible "regenerating" state.

**Files to Modify**:

| File | Action | Description |
|------|--------|-------------|
| `components/video-generation/VideoRegenerationChat.tsx` | Modify | Pass user's last message text as `feedback` to `onRegenerateApproved`; call `onClose()` in `handleFinalRegenerate` |
| `components/video-generation/VideoGenerator.tsx` | Modify | Move `setIsRegenerationChatOpen(false)` to BEFORE the `await regenerate(...)` call |

**Root Cause**: `VideoRegenerationChat.tsx` calls `onRegenerateApproved(sceneId)` without a `feedback` string. `VideoGenerator.handleRegenerateApproved` calls `setIsRegenerationChatOpen(false)` *after* `await regenerate(...)` resolves, so the modal stays open for the entire generation duration with no visible progress.

**Implementation**:

**Step 1 — Fix `VideoRegenerationChat` to pass feedback text and close on submit**

```typescript
// VideoRegenerationChat.tsx
// Change prop type:
onRegenerateApproved: (sceneId: string, feedback: string) => void;

// In handleFinalRegenerate:
const handleFinalRegenerate = useCallback(() => {
  const lastUserMessage = messages
    .filter((m) => m.role === "user")
    .at(-1);
  const feedbackText = lastUserMessage?.parts
    .filter((p) => p.type === "text")
    .map((p) => ("text" in p ? p.text : ""))
    .join("") ?? "";

  onRegenerateApproved(sceneId, feedbackText);
  onClose();
}, [messages, onRegenerateApproved, sceneId, onClose]);
```

**Step 2 — Close modal before awaiting `regenerate` in `VideoGenerator`**

```typescript
// VideoGenerator.tsx — handleRegenerateApproved
// Move setIsRegenerationChatOpen(false) BEFORE the await:
setIsRegenerationChatOpen(false); // Close immediately for UX feedback

await regenerate({
  feedback,
  // ...
});
// Remove any duplicate setIsRegenerationChatOpen(false) calls below
```

**2-Step QA**:

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/video-generation/VideoRegenerationChat.tsx components/video-generation/VideoGenerator.tsx
```

**Checklist**:
- [ ] Clicking "Regenerate Scene Video" immediately closes the modal
- [ ] Scene card shows "generating" spinner after modal closes
- [ ] User's feedback text is passed to `regenerate()` — verify via console log in `VideoGenerator.handleRegenerateApproved`
- [ ] TypeScript: no type errors on `onRegenerateApproved` signature

---

### Task 39.4 — "Make a Change" Must Return to Step 6 After Editing (Issue #142)

**Status**: 📝 Pending
**Issue**: #142

**Objective**: When a user clicks "Make a Change" in Step 6 and navigates to Step 2 or Step 3, then completes their edit, they should be redirected back to Step 6 — not forward through the entire remaining flow.

**Files to Modify**:

| File | Action | Description |
|------|--------|-------------|
| `app/[locale]/guided/step-6/page.tsx` | Modify | Pass `returnTo=step-6` query param in `handleIterationChoice` navigation call |
| `app/[locale]/guided/step-2/page.tsx` | Modify | Detect `returnTo` query param; override "Continue" to navigate to `returnTo` destination |
| `app/[locale]/guided/step-3/page.tsx` | Modify | Same — detect `returnTo=step-6`; redirect back on completion |

**Root Cause**: `handleIterationChoice` in step-6 calls `router.push(\`/guided/${step}?projectId=${projectId}\`)` with no `returnTo` param. Step 2 and Step 3 have no concept of a return destination and always advance forward.

**Implementation**:

**Step 1 — Add `returnTo` to `handleIterationChoice`**

```typescript
// app/[locale]/guided/step-6/page.tsx
const handleIterationChoice = (step: string) => {
  setShowIterationModal(false);
  router.push(
    `/guided/${step}?projectId=${projectId}&returnTo=step-6`
  );
};
```

**Step 2 — Read `returnTo` in Step 2 and redirect on "Continue"**

```typescript
// app/[locale]/guided/step-2/page.tsx
const returnTo = searchParams.get("returnTo");

// In the "Continue" / "Approve Story" handler:
const nextStep = returnTo ?? "step-3";
router.push(`/guided/${nextStep}?projectId=${projectId}`);
```

**Step 3 — Pass `returnTo` through in Step 3**

```typescript
// app/[locale]/guided/step-3/page.tsx
const returnTo = searchParams.get("returnTo");

// In the "All scenes complete → Continue" handler:
const nextStep = returnTo ?? "step-4";
router.push(`/guided/${nextStep}?projectId=${projectId}`);
```

**2-Step QA**:

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write "app/[locale]/guided/step-6/page.tsx" "app/[locale]/guided/step-2/page.tsx" "app/[locale]/guided/step-3/page.tsx"
```

**Checklist**:
- [ ] Step 6 → Make a Change → Step 2 → Approve Story → lands on Step 6
- [ ] Step 6 → Make a Change → Step 3 → All scenes approved → lands on Step 6
- [ ] Normal flow (Step 1 → Step 2 → ...) is unaffected — no `returnTo` param present

---

### Task 39.5 — Eliminate Duplicate `updateScene` / `generateVideo` Calls (Issues #138, #149)

**Status**: 📝 Pending
**Issues**: #138, #149

**Objective**: Stop the `useSceneData` update function from firing a Convex mutation every time the Convex subscription delivers a new snapshot. A scene that has not changed locally should never trigger a write.

**Files to Modify**:

| File | Action | Description |
|------|--------|-------------|
| `hooks/business-logic/useSceneData.ts` | Modify | Guard the `update` function with a dirty-check: only schedule the debounced Convex write if the incoming `updates` differ from current scene data |
| `app/[locale]/guided/step-3/page.tsx` | Modify | Audit all `updateSceneInConvex` call sites in `useEffect` blocks; add `useRef` flags for one-time initialization effects |

**Root Cause**: In `useSceneData.ts`, a `useEffect` syncs incoming Convex data into `localScenes`. However, the `update()` function does an optimistic write *and* schedules a debounced Convex write. If any parent component calls `update()` inside a `useEffect` that re-runs when `convexScenes` changes (every real-time update), a write loop forms.

**Implementation**:

**Step 1 — Add dirty-check to `useSceneData.update`**

```typescript
// hooks/business-logic/useSceneData.ts — inside the update useCallback
const update = useCallback(
  (sceneId: Id<"scenes">, updates: Partial<SceneData>) => {
    if (!localScenes) return;

    // Dirty check: skip if all update fields already match current values
    const currentScene = localScenes.find((s) => s._id === sceneId);
    if (currentScene) {
      const hasChanges = Object.entries(updates).some(
        ([key, value]) =>
          currentScene[key as keyof SceneData] !== value
      );
      if (!hasChanges) return; // Nothing changed — do not queue a write
    }

    // Optimistic update + debounced save (existing logic below)
    // ...
  },
  [projectId, localScenes, updateMutation],
);
```

**Step 2 — Audit `useEffect` blocks in `step-3/page.tsx`**

Add `useRef` flags for initialization-only effects:

```typescript
const hasAppliedInitialStatus = useRef(false);
useEffect(() => {
  if (hasAppliedInitialStatus.current) return;
  if (!convexScenes?.length) return;
  // ... apply initial status ...
  hasAppliedInitialStatus.current = true;
}, [convexScenes]);
```

**2-Step QA**:

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write hooks/business-logic/useSceneData.ts "app/[locale]/guided/step-3/page.tsx"
```

**Checklist**:
- [ ] Console shows "updateScene called" only when a user-triggered action modifies a scene — not on every Convex subscription delivery
- [ ] No "Updating scene in Convex" log spam during idle polling
- [ ] Generate video flow completes without duplicate `generateVideo` calls (verify via Convex dashboard logs)

---

### Task 39.6 — Narration Audio Truncated in Final Video (Issue #139)

**Status**: 📝 Pending
**Issue**: #139

**Objective**: The final assembled video's narration must not be cut off. The audio mix duration passed to `mixAudioWithRendi` must be at least as long as the narration itself.

**Files to Modify**:

| File | Action | Description |
|------|--------|-------------|
| `convex/actions/videoAssembly.ts` | Modify | When `narrationDurationMs` is provided, use `max(expectedDuration, narrationDurationMs / 1000)` as the mix duration |

**Root Cause**: In `videoAssembly.ts`, `mixAudioWithRendi` is called with `expectedDuration` computed as `numScenes * clipDuration`. If the narration is longer than the total video clip duration, it is truncated at `expectedDuration` by Rendi's mixing process. The `narrationDurationMs` arg is already passed into `assembleVideo` but never used in the duration calculation.

**Implementation**:

```typescript
// convex/actions/videoAssembly.ts — after computing expectedDuration

// Use the longer of: expected video duration OR narration duration
const narrationDurationSec = args.narrationDurationMs
  ? args.narrationDurationMs / 1000
  : 0;

const mixDuration = Math.max(expectedDuration, narrationDurationSec);

console.log(
  `[VideoAssembly] Mix duration: ${mixDuration.toFixed(2)}s ` +
  `(video: ${expectedDuration.toFixed(2)}s, narration: ${narrationDurationSec.toFixed(2)}s)`
);

// Replace `expectedDuration` with `mixDuration` in ALL mixAudioWithRendi call sites:
// - hard_cut path
// - per-scene transition path  
// - project-level xfade path
```

**2-Step QA**:

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/actions/videoAssembly.ts

# Step 3: Deploy to Convex dev
npx convex dev --once
```

**Checklist**:
- [ ] Console log shows `mixDuration >= narrationDurationSec` for all assembly runs
- [ ] Assembled video narration plays to the end without cutoff
- [ ] Music track is also mixed to the full `mixDuration`

---

### Task 39.7 — Reject Portrait Images at Upload (Issue #141)

**Status**: 📝 Pending
**Issue**: #141

**Objective**: When a user selects a portrait-orientation image (height > width) as a scene frame, reject it immediately with an error message: "Unsupported image format. Please upload landscape images (16:9) for optimal video generation."

**Files to Modify**:

| File | Action | Description |
|------|--------|-------------|
| `components/scene-management/FrameAssignment.tsx` | Modify | Add `checkImageOrientation` validation before calling `onUpdateScene`; render inline error on rejection |
| `messages/en.json` | Modify | Add `"portrait_image_rejected"` key under `frame_assignment` namespace |

**Implementation**:

**Step 1 — Client-side orientation check in `FrameAssignment.tsx`**

```typescript
// Add state:
const [orientationError, setOrientationError] = useState<string | null>(null);

// Add helper function:
async function checkImageOrientation(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth >= img.naturalHeight);
    img.onerror = () => resolve(true); // Fail open on error
    img.src = url;
  });
}

// In handleAssetSelect, before calling onUpdateScene:
const handleAssetSelect = async (assetUrl: string) => {
  const isLandscape = await checkImageOrientation(assetUrl);
  if (!isLandscape) {
    setOrientationError(t("portrait_image_rejected"));
    setIsModalOpen(false);
    return;
  }
  setOrientationError(null);
  // ... existing update logic ...
};
```

Render the error below the frame cards:

```tsx
{orientationError && (
  <p className="text-sm text-destructive mt-2">{orientationError}</p>
)}
```

**Step 2 — Add i18n key**

```json
// messages/en.json — inside "frame_assignment" namespace:
"portrait_image_rejected": "Unsupported image format. Please upload landscape images (16:9) for optimal video generation."
```

**2-Step QA**:

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/scene-management/FrameAssignment.tsx messages/en.json

# Step 3: Generate + verify translations
pnpm translate
node scripts/verify-translations.js
```

**Checklist**:
- [ ] Selecting a portrait image displays the error message and does not update the scene
- [ ] Selecting a landscape image proceeds normally
- [ ] Error message clears when user opens the frame selector again
- [ ] `pnpm translate` passes without errors

---

### Task 39.8 — AI Ignores Selected Event Type in Step 2 (Issue #154)

**Status**: 📝 Pending
**Issue**: #154

**Objective**: The AI Director must receive the project's `occasion` field in its system prompt context, so it generates a story appropriate to the selected event type — not a default one.

**Files to Modify**:

| File | Action | Description |
|------|--------|-------------|
| `app/[locale]/guided/step-2/page.tsx` | Modify | Include `occasion: project.occasion` in the `/api/chat` request body |
| `app/api/chat/route.ts` | Modify | Extract `occasion` from request body; pass it to `AI_DIRECTOR_PROMPT.getPrompt()` |
| `lib/ai/prompts/chat/ai-director.prompt.ts` | Modify | Inject `occasion` into the system prompt when provided |

**Root Cause**: In `step-2/page.tsx`, the `fetch("/api/chat")` body only sends `{ messages, projectId, projectName }`. The `occasion` field from `project.occasion` is never sent. In `app/api/chat/route.ts`, `AI_DIRECTOR_PROMPT.getPrompt()` is called with no context, so the AI has no knowledge of the selected event type.

**Implementation**:

**Step 1 — Send `occasion` from Step 2**

```typescript
// app/[locale]/guided/step-2/page.tsx — in the fetch call
body: JSON.stringify({
  messages: apiMessages,
  projectId,
  projectName: project?.name,
  occasion: project?.occasion, // ADD THIS
}),
```

**Step 2 — Extract and pass `occasion` in the chat route**

```typescript
// app/api/chat/route.ts
const { messages, projectId, projectName, sceneId, occasion } = body;

// Update getPrompt call with context:
const systemPrompt = AI_DIRECTOR_PROMPT.getPrompt({
  projectType: occasion,
  currentStep: 2,
});
```

**Step 3 — Enrich the AI Director system prompt**

```typescript
// lib/ai/prompts/chat/ai-director.prompt.ts
if (context?.projectType) {
  prompt += `\n\nIMPORTANT: The user is creating a video for a **${context.projectType}**. ` +
    `All story suggestions, scene descriptions, and emotional narrative must be ` +
    `tailored specifically to this occasion type. Do NOT default to wedding content.`;
}
```

**2-Step QA**:

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write "app/[locale]/guided/step-2/page.tsx" app/api/chat/route.ts lib/ai/prompts/chat/ai-director.prompt.ts
```

**Checklist**:
- [ ] Console log in `app/api/chat/route.ts` shows `occasion` received from the client
- [ ] AI responses for a "Holiday" project reference holiday-specific content — not birthdays/weddings
- [ ] AI responses for a "Birthday" project reference birthday content
- [ ] No TypeScript errors on `project?.occasion` field access

---

### Task 39.9 — UX Quick Wins: Assembly Progress Close, Button Copy, Corporate Label

**Status**: 📝 Pending
**Issues**: #156, #157, #153, #161

**Objective**: Three targeted UX improvements: (a) add a dismiss button to the assembly progress overlay; (b) rename "Continue to the Story" button to "Break your story into 3 cinematic scenes"; (c) rename "Corporate Event" to "Unleash Your Creativity".

**Files to Modify**:

| File | Action | Description |
|------|--------|-------------|
| `app/[locale]/guided/step-6/page.tsx` | Modify | Add a "View in background" dismiss button to the assembly progress screen |
| `messages/en.json` | Modify | Update `continue_to_story_button`, `corporate`, and `corporate_desc` values |

**Implementation**:

**Step 1 — Add dismiss to assembly progress screen in Step 6**

```typescript
// app/[locale]/guided/step-6/page.tsx
const [assemblyProgressDismissed, setAssemblyProgressDismissed] = useState(false);
```

In the assembly-in-progress render block, add the guard and a dismiss button:

```typescript
if (
  assemblyStatus &&
  assemblyStatus !== "completed" &&
  assemblyStatus !== "failed" &&
  !assemblyProgressDismissed  // NEW guard
) {
  return (
    <div ...>
      <Card ...>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle ...>
              <Loader2 ... />
              {t("assembly_in_progress")}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAssemblyProgressDismissed(true)}
              className="text-gray-400 hover:text-white"
            >
              {t("assembly_view_in_background")}
            </Button>
          </div>
        </CardHeader>
        {/* ...existing content... */}
      </Card>
    </div>
  );
}
```

**Step 2 — Update copy in `messages/en.json`**

```json
// Under "guided_step6":
"assembly_view_in_background": "View in background"

// Under "guided_step1":
"continue_to_story_button": "Break Your Story into 3 Cinematic Scenes ✨"

// Under "occasions":
"corporate": "Unleash Your Creativity",
"corporate_desc": "Express Yourself Freely 🎨"
```

> Note: The `corporate` key only changes the display label. The data model value (occasion type stored in the DB) remains unchanged.

**2-Step QA**:

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write "app/[locale]/guided/step-6/page.tsx" messages/en.json

# Step 3: Generate + verify translations
pnpm translate
node scripts/verify-translations.js
```

**Checklist**:
- [ ] Assembly progress screen shows "View in background" button
- [ ] Clicking it hides the full-screen overlay and shows the Step 6 main UI
- [ ] On completion, `assemblyStatus` switches to `"completed"` which restores the final video UI (existing logic)
- [ ] Step 1 "Continue" button shows new copy "Break Your Story into 3 Cinematic Scenes"
- [ ] "Corporate Event" card in Step 1 shows "Unleash Your Creativity"
- [ ] `pnpm translate` produces no errors

---

## ✅ Final Sprint QA

After all tasks are merged on the branch:

```bash
# 1. Full TypeScript check
npx tsc --noEmit

# 2. Full Biome check
npx biome check --write .

# 3. Deploy to Convex dev
npx convex dev --once

# 4. Generate + verify all translations
pnpm translate
node scripts/verify-translations.js
```

---

### Task 39.10 — Scene Generation Detailed Progress Stages

**Status**: 📝 Pending
**Issue**: #147

**Objective**: Replace the single static `"Creating your video"` status label in `VideoGenerator` with time-based rotating stage labels that cycle through the four phases of video generation, giving the user clear feedback about what is happening.

**Files to Modify**:

| File | Action | Description |
|------|--------|-------------|
| `components/video-generation/VideoGenerator.tsx` | Modify | Add `stageIndex` state + `useEffect` interval; replace static status label with `t(\`generation_stage_\${stageIndex}\`)` |
| `messages/en.json` | Modify | Add 4 stage keys inside `video_generator` namespace |

**Implementation**:

**Step 1 — Add `stageIndex` state and interval in `VideoGenerator.tsx`**

Add after the existing state declarations:

```typescript
const [stageIndex, setStageIndex] = useState(0);

useEffect(() => {
  if (generationStatus !== "in_progress") {
    setStageIndex(0);
    return;
  }
  const interval = setInterval(() => {
    setStageIndex((i) => Math.min(i + 1, 3)); // cap at last stage
  }, 20000); // advance every 20s
  return () => clearInterval(interval);
}, [generationStatus]);
```

**Step 2 — Replace static status label (line ~466)**

```diff
- {generationStatus === "in_progress" && t("creating_status")}
+ {generationStatus === "in_progress" && t(`generation_stage_${stageIndex}`)}
```

**Step 3 — Add i18n keys to `messages/en.json`**

Inside the existing `video_generator` namespace (currently around line 1622), add 4 new keys:

```json
"generation_stage_0": "Generating frames…",
"generation_stage_1": "Rendering animation…",
"generation_stage_2": "Stitching video…",
"generation_stage_3": "Finalizing output…"
```

The existing `creating_status` key can remain for backward compatibility.

**2-Step QA**:
```bash
npx tsc --noEmit
npx biome check --write components/video-generation/VideoGenerator.tsx messages/en.json
pnpm translate
node scripts/verify-translations.js
```

**Checklist**:
- [ ] While `generationStatus === "in_progress"`, status label starts at "Generating frames…"
- [ ] Label advances to "Rendering animation…" after ~20s
- [ ] Label advances to "Stitching video…" after ~40s
- [ ] Label advances to "Finalizing output…" after ~60s and stays there
- [ ] On reset (new generation), stage resets to 0
- [ ] `pnpm translate` produces no errors
- [ ] All 7 locales have the 4 new keys

---

## 🚫 Issues Out of Scope

The following issues are labelled `invalid` or are out of scope for this sprint and are deferred:

| Issue | Label | Reason |
|-------|-------|--------|
| #148 — Multiple play buttons | `invalid` | ✅ Fixed — replaced misleading Play circle with `Clapperboard` icon in idle state |
| #146 — Duplicate upload CTA | `invalid` | ✅ Fixed — entire dropzone is now the single click target; button kept as visual affordance only |
| #145 — Update "10-15 minutes" copy | `invalid` | ✅ Fixed — `creation_time_title` updated to "20-30 min" across all 7 locales |
| #144 — Replace text with logo | `invalid` | Design asset dependency |
| #137 — Credit consumption timing | `invalid` | By design — upfront deduction + auto-refund on failure; see architecture note below |
| #162 — AI Transform CTA disabled with no credit explanation | bug | Discovered post-sprint — deferred to Sprint 40 |
| #143 — Final step frame removal/replacement | Tier 2 | ✅ Implemented in Sprint 40 |
| #147 — Scene generation progress indicator | Tier 3 | ✅ Implemented as Task 39.10 — rotating stage labels in `VideoGenerator` |
| #152 — Replace static illustrations with looping videos | Tier 3 | Asset production dependency |

---

## 📊 Task Priority & Status Table

| # | Task | Issue(s) | Priority | Tier | Status |
|---|------|----------|----------|------|--------|
| 39.1 | Public video sharing — route + auth fix | #159, #160, #151 | P0 — Launch Blocker | 1 | ✅ Done |
| 39.2 | Credit validation + dead-end prevention | #136, #140 | P0 — Launch Blocker | 1 | ✅ Done |
| 39.3 | Refinement modal stuck after approval | #158 | P1 — High | 2 | ✅ Done |
| 39.4 | "Make a Change" → return to Step 6 | #142 | P1 — High | 2 | ✅ Done |
| 39.5 | Duplicate `updateScene` / `generateVideo` calls | #138, #149 | P1 — High | 2 | ✅ Done |
| 39.6 | Narration audio truncated in final video | #139 | P1 — High | 2 | ✅ Done |
| 39.7 | Portrait image rejection at upload | #141 | P1 — High | 2 | ✅ Done |
| 39.8 | AI ignores selected event type (Step 2) | #154 | P1 — High | 2 | ✅ Done |
| 39.9 | UX quick wins (#156, #157, #153, #161) | #156, #157, #153, #161 | P2 — UX | 3 | ✅ Done |
| 39.10 | Scene generation detailed progress stages | #147 | P2 — UX | 3 | ✅ Done |

---

## ⚠️ Pre-Work Confirmations (Do Before Starting)

Before writing a single line of code, confirm the following:

1. **`sharedLinks.videoId` vs `projectId`** (Task 39.1): Open `convex/sharedLinks.ts` and `convex/videos.ts`. Confirm whether the `videos` table has a `projectId` field. The shared redirect must route to `/watch/${video.projectId}` (not `videoId`).

2. **`projects.getPublic` status relaxation** (Task 39.1): Confirm with the team whether relaxing the `status !== "completed"` guard could accidentally expose draft videos. Use the safer guard: `if (!project.finalVideoUrl || project.status === "draft")`.

3. **`AI_DIRECTOR_PROMPT.getPrompt()` context signature** (Task 39.8): In `lib/ai/prompts/chat/ai-director.prompt.ts`, confirm the TypeScript type allows partial context objects (specifically `{ projectType?: string }`). Fix the type if needed before Task 39.8.

---

## Credit System Architecture Note (Issue #137)

The credit system is **fully modular and configurable — no code changes are needed** to adjust costs or tier grants.

### Credit costs per action → `creditCosts` table in Convex

Every AI action cost is a single row in the `creditCosts` table. To change how many credits a task consumes, update that row in the Convex dashboard — no deploy required.

| `actionType` | Controls cost for |
|---|---|
| `"image_generation"` | AI image generation per image |
| `"video_generation"` | Scene video generation (Kling) |
| `"video_regeneration"` | Scene video refinement |
| `"step2_chat_message"` | AI Director story chat |
| `"kling_video_5s"` / `"kling_video_10s"` | Duration-specific video generation |

`isActive: boolean` — set to `false` to disable any action type without deleting the row.

### Credit grants per tier → `subscriptionTiers` table in Convex

Each Polar product maps to a row in `subscriptionTiers`, linked by `polarProductId`:

| Field | Purpose |
|---|---|
| `initialCredits` | Credits granted on first purchase / subscription start |
| `monthlyCredits` | Credits added on each monthly renewal (subscriptions only) |
| `bonusCredits` | Extra bonus credits on one-time packs |
| `polarProductId` | Polar product UUID — the webhook resolves the row by this field |

To change how many credits a tier grants: update the `subscriptionTiers` row in Convex and align the product in Polar. The Polar webhook resolves the tier purely by `polarProductId`, so the two stay in sync automatically.

### Credit deduction timing

Credits are deducted **upfront** before the AI call, with an automatic `refundCredits` on failure. This is intentional — it prevents exploitation on retries and keeps `userCredits.balance` the authoritative source of truth at all times. The `creditTransactions` table provides a full audit trail. All edge cases (failed generation, partial completion) are handled via the refund path.
