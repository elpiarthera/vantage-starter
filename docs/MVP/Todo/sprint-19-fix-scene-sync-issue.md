# Sprint 19: Fix Scene Synchronization Bug & Lock Scene Count

**Created**: December 23, 2025  
**Priority**: P0 (Critical Bug) + P1 (UX Freeze)  
**Status**: ✅ Completed (December 23, 2025)

---

## Problem Summary

### Critical Bug: Deleted Scenes Get Recreated

When a user deletes a scene on Step 3, it gets automatically recreated on the next page load/render.

**Root Cause Analysis:**

1. `step-3/page.tsx` has a `useEffect` that calls `initializeFromStory` on every page load
2. `initializeFromStory` reads `project.generatedStory.scenes` (e.g., 4 scenes from AI)
3. It compares against existing DB scenes by **scene number**
4. If a scene number is "missing", it **recreates it**

**Bug Flow:**
```
1. AI generates story with 4 scenes → generatedStory.scenes = [1, 2, 3, 4]
2. initializeFromStory creates 4 scenes in DB
3. User deletes Scene 4 → DB now has [1, 2, 3]
4. Page re-renders or user navigates back
5. useEffect triggers initializeFromStory
6. Mutation: "Story says 4 scenes, DB has 3 → Scene 4 missing!"
7. Recreates Scene 4 ← BUG!
```

**Console Logs (User Provided):**
```
[initializeFromStory] Scene 1 already exists, skipping
[initializeFromStory] Scene 2 already exists, skipping
[initializeFromStory] Scene 3 already exists, skipping
[initializeFromStory] Created scene 4  ← Recreated after deletion!
```

---

## Solution Plan

### Task 19.1: Fix Scene Initialization Logic (P0 - Critical)

**File:** `app/[locale]/guided/step-3/page.tsx`

**Fix:** Only call `initializeFromStory` when NO scenes exist for the project.

**Before (Buggy):**
```typescript
useEffect(() => {
    if (
        projectId &&
        !scenesLoading &&
        project?.generatedStory?.scenes &&
        project.generatedStory.scenes.length > 0
    ) {
        initializeFromStoryMutation({ projectId })
```

**After (Fixed):**
```typescript
useEffect(() => {
    if (
        projectId &&
        !scenesLoading &&
        convexScenes !== undefined &&
        convexScenes.length === 0 &&  // ← ONLY if NO scenes exist
        project?.generatedStory?.scenes &&
        project.generatedStory.scenes.length > 0
    ) {
        initializeFromStoryMutation({ projectId })
```

**Rationale:** The `generatedStory` is the **initial AI output** - once scenes are created, the user manages them directly. Scene initialization should be a **one-time** operation.

---

### Task 19.2: Limit AI Story Generation to Exactly 3 Scenes

**File:** `lib/ai/prompts/step1/story-generation.prompt.ts`

**Current (Line 35):**
```
5. Include specific visual scene suggestions (3-4 scenes)
```

**Change to:**
```
5. Include exactly 3 visual scene suggestions (no more, no less)
```

**Also update the system prompt (line 31-32):**

**Current:**
```
1. Be structured for a 30-second video (approximately 75-90 words for narration)
```

**Change to:**
```
1. Be structured for a 30-second video with exactly 3 scenes (~10 seconds each)
```

**Rationale:** For MVP, we want consistent 3-scene videos. The prompt currently allows 3-4 scenes which causes inconsistency.

---

### Task 19.3: Freeze "Add Scene" Button with "Coming Soon" Message

**File:** `app/[locale]/guided/step-3/page.tsx` and/or `components/scene-management/SceneManager.tsx`

**Requirements:**
- Keep the "Add Scene" button visible but disabled
- Show "Coming Soon" tooltip or badge
- Must be translated in all supported languages

**Implementation:**

1. Find the `addScene` function and "Add Scene" button
2. Disable the button (`disabled={true}`)
3. Add a "Coming Soon" label/badge next to or on the button
4. Add translation keys for all supported languages

**i18n Keys to Add (all language files):**

```json
// messages/en.json - guided_step3 namespace
{
  "add_scene_coming_soon": "Coming Soon",
  "add_scene_disabled_tooltip": "Adding more scenes will be available in a future update"
}

// messages/fr.json
{
  "add_scene_coming_soon": "Bientôt disponible",
  "add_scene_disabled_tooltip": "L'ajout de scènes supplémentaires sera disponible dans une future mise à jour"
}

// messages/de.json
{
  "add_scene_coming_soon": "Demnächst verfügbar",
  "add_scene_disabled_tooltip": "Das Hinzufügen weiterer Szenen wird in einem zukünftigen Update verfügbar sein"
}

// messages/es.json
{
  "add_scene_coming_soon": "Próximamente",
  "add_scene_disabled_tooltip": "Agregar más escenas estará disponible en una futura actualización"
}

// messages/it.json
{
  "add_scene_coming_soon": "Prossimamente",
  "add_scene_disabled_tooltip": "L'aggiunta di altre scene sarà disponibile in un futuro aggiornamento"
}

// messages/pt.json
{
  "add_scene_coming_soon": "Em breve",
  "add_scene_disabled_tooltip": "Adicionar mais cenas estará disponível em uma atualização futura"
}

// messages/nl.json
{
  "add_scene_coming_soon": "Binnenkort beschikbaar",
  "add_scene_disabled_tooltip": "Meer scènes toevoegen zal beschikbaar zijn in een toekomstige update"
}
```

---

### Task 19.4: Also Freeze "Delete Scene" Button (Consistency)

Since we're locking scene count to 3, also freeze the delete button to prevent users from reducing below 3 scenes.

**Requirements:**
- Keep the "Delete Scene" button visible but disabled when scene count = 3
- Show "Minimum 3 scenes required" tooltip

**i18n Keys:**

```json
// messages/en.json - guided_step3 namespace
{
  "delete_scene_disabled": "Minimum 3 scenes required"
}

// messages/fr.json
{
  "delete_scene_disabled": "Minimum 3 scènes requises"
}

// (similar for other languages)
```

---

## Implementation Checklist

- [x] **19.1** Fix `useEffect` in Step 3 to only initialize when no scenes exist
- [x] **19.2** Update story generation prompt to exactly 3 scenes
- [x] **19.3** Freeze "Add Scene" button with translated "Coming Soon" message
- [x] **19.4** Freeze "Delete Scene" button when at minimum 3 scenes
- [x] Add all i18n keys to 7 language files
- [x] Run translation verification script
- [x] QA: TypeScript `noEmit` check
- [x] QA: Biome lint/format
- [x] Deploy to Convex dev
- [ ] Test on Vercel preview

---

## Post-MVP Feature: Dynamic Scene Sync (Option B)

**To be implemented after MVP launch:**

When user deletes a scene, also update `project.generatedStory.scenes` to keep it in sync with the actual scenes. This would allow dynamic scene management in future versions.

**Implementation Approach:**
1. In `convex/scenes.ts` → `remove` mutation
2. After deleting scene from DB, also update `projects` table:
   ```typescript
   // Remove deleted scene from generatedStory.scenes
   const updatedStoryScenes = project.generatedStory.scenes.filter(
     s => s.number !== scene.sceneNumber
   );
   await ctx.db.patch(projectId, {
     generatedStory: {
       ...project.generatedStory,
       scenes: updatedStoryScenes
     }
   });
   ```

**Ticket:** `POST-MVP-001: Enable dynamic scene add/delete with story sync`

---

## Time Estimates

| Task | Estimate |
|------|----------|
| 19.1 - Fix useEffect condition | 10 min |
| 19.2 - Update AI prompt (3 scenes) | 5 min |
| 19.3 - Freeze Add Scene button | 20 min |
| 19.4 - Freeze Delete Scene button | 15 min |
| i18n translations (7 languages) | 15 min |
| QA (noEmit + Biome) | 10 min |
| Deploy & test | 10 min |
| **Total** | ~1.5 hours |

---

## Files to Modify

1. `app/[locale]/guided/step-3/page.tsx` - Fix useEffect, freeze delete button
2. `lib/ai/prompts/step1/story-generation.prompt.ts` - Limit to 3 scenes
3. `components/scene-management/SceneManager.tsx` - Freeze add button (if button is here)
4. `messages/en.json` - Add i18n keys
5. `messages/fr.json` - Add i18n keys
6. `messages/de.json` - Add i18n keys
7. `messages/es.json` - Add i18n keys
8. `messages/it.json` - Add i18n keys
9. `messages/pt.json` - Add i18n keys
10. `messages/nl.json` - Add i18n keys

---

## Success Criteria

1. ✅ Deleting a scene does NOT recreate it on page refresh
2. ✅ New projects always get exactly 3 scenes from AI
3. ✅ "Add Scene" button shows "Coming Soon" and is disabled
4. ✅ "Delete Scene" button is disabled when at 3 scenes
5. ✅ All UI text is properly translated
6. ✅ No TypeScript errors
7. ✅ Biome passes

