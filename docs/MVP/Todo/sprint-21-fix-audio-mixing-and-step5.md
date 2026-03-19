# Sprint 21: Fix Audio Mixing Failure & Step 5 Issues

**Created:** December 23, 2025  
**Status:** ✅ Completed  
**Priority:** P0 - Critical (music not included in final video)

---

## Implementation Summary

### ✅ Completed Tasks

1. **21.1 Audio Polling Resilience** - Added retry logic for transient HTTP errors (3 consecutive before failing), increased timeout to 4 minutes
2. **21.2 Video Polling Resilience** - Same pattern applied to video processing
3. **21.3 Translation Key** - Added `"reassembling"` key + synced to all 6 languages
4. **21.4 Music URL** - Kept as required (user must select music before assembly - no fallback needed)
5. **21.5 Clip Duration** - Fixed to use 10s per scene (not derived from narration)
6. **Step 6 UI** - Commented out "Assemble Final Video" button (assembly now triggered from Step 5)

### 🔄 Pending (For Later)

- **Duration Review**: Verify final video duration for both hard cut (30s) and xfade (28s) modes
- **21.6 Pass Scene Durations**: Future enhancement to support per-scene variable durations

---

## Problem Summary

### Issue 1: Audio Mixing Fails in Production (Music Not Included)

**Symptom:** Final assembled videos have no background music - only narration.

**Evidence:**
- Convex logs: `[VideoAssembly] Audio mixing failed, falling back to narration only. Reason: Rendi poll fail...`
- E2E test with SAME URLs: ✅ Works perfectly (48.5s audio mixing)
- Production with SAME URLs: ❌ Fails

**Root Cause Found:**

The production polling code in `lib/audio-processing.ts` is **too strict** about HTTP errors:

```typescript
// PRODUCTION CODE (FAILS on transient errors)
if (!pollRes.ok) {
    throw new Error(`Rendi poll failed: ${pollRes.status} ${errorText}`);
}
```

vs the E2E test script which is **more resilient**:

```javascript
// TEST SCRIPT (ignores transient HTTP errors)
const data = await res.json();  // No res.ok check!
if (data.status === "SUCCESS") { ... }  // Only cares about JSON status
```

If Rendi has a brief hiccup (500, 502, 503, 429) during the ~48s of polling, production fails immediately while the test continues polling.

### Issue 2: Missing Translation Key

The "Re-assembling..." button text in Step 5 uses `t("reassembling")` but this key is not in `messages/en.json`.

### Issue 3: Step 5 Incomplete Fallback Chain

```typescript
// CURRENT (Step 5 - incomplete):
musicUrl: project.musicAudioUrl || project.narrationAudioUrl,

// CORRECT (Step 6 pattern):
musicUrl:
    project.musicAudioUrl ||
    project.step4Data?.musicTakes?.[0]?.audioUrl ||
    project.narrationAudioUrl,
```

### Issue 4: Wrong Clip Duration Calculation (CRITICAL)

**Expected behavior:**
- Scene duration is FIXED (10s per scene from Step 3)
- **Hard Cut:** 3 × 10s = **30s video**
- **Xfade:** 30s - 2×1s = **28s video**

**Actual behavior (bug):**
- Video duration based on narration duration (28s)
- Hard cut with 28s narration: 28/3 = 9.3s per clip = **28s video** ❌

---

## Solution Plan

### Task 21.1: Fix Audio Polling Resilience (P0)

**File:** `lib/audio-processing.ts`

**Change:** Add retry logic for transient HTTP errors instead of failing immediately.

```typescript
// BEFORE (fails on first HTTP error)
if (!pollRes.ok) {
    const errorText = await pollRes.text();
    throw new Error(`Rendi poll failed: ${pollRes.status} ${errorText}`);
}

// AFTER (retry on transient errors, only fail after multiple consecutive failures)
if (!pollRes.ok) {
    consecutiveErrors++;
    const errorText = await pollRes.text();
    console.warn(`[AudioMixing] Poll error (${consecutiveErrors}/3): ${pollRes.status} ${errorText}`);
    
    if (consecutiveErrors >= 3) {
        throw new Error(`Rendi poll failed after 3 consecutive errors: ${pollRes.status} ${errorText}`);
    }
    continue; // Retry on next iteration
}
consecutiveErrors = 0; // Reset on successful poll
```

**Also increase timeout** as safety measure:
- Change `maxAttempts` from 60 to 120
- Change delay from 1000ms to 2000ms (match video polling)
- Total max wait: 240s (4 minutes) like video processing

### Task 21.2: Apply Same Fix to Video Polling (P1)

**File:** `lib/rendi-video-processing.ts`

Apply the same transient error resilience to `pollRendiCommand` function.

### Task 21.3: Add Missing Translation Key (P1)

**Files:** 
- `messages/en.json` - Add key
- `messages/*.json` - Sync all languages via script

**Step 1:** Add to `guided_step5` section in `messages/en.json`:
```json
{
  "guided_step5": {
    "reassembling": "Re-assembling..."
  }
}
```

**Step 2:** Run translation script to sync all 7 languages:
```bash
node scripts/translate.js
```

**Step 3:** Verify all translations synced:
```bash
node scripts/verify-translations.js
```

### Task 21.4: Fix Step 5 Music URL Fallback (P1)

**File:** `app/[locale]/guided/step-5/page.tsx`

Update `handleReassemble` to match Step 6's fallback pattern:

```typescript
// CHANGE FROM:
musicUrl: project.musicAudioUrl || project.narrationAudioUrl,

// CHANGE TO:
musicUrl:
    project.musicAudioUrl ||
    project.step4Data?.musicTakes?.[0]?.audioUrl ||
    project.narrationAudioUrl,
```

### Task 21.5: Fix Clip Duration Calculation - Use Scene Duration NOT Narration (P0)

**File:** `convex/actions/videoAssembly.ts`

**Problem:** The `calculateClipDuration` function bases clip duration on narration duration, but it should use fixed scene duration (10s).

**Current (WRONG):**
```typescript
function calculateClipDuration(narrationDurationMs, numScenes, transitionMode, transitionDuration) {
    const narrationDurationSec = narrationDurationMs / 1000;
    if (transitionMode === "hard_cut") {
        return narrationDurationSec / numScenes;  // ← WRONG: uses narration
    }
    // ...
}
```

**Correct:**
```typescript
const DEFAULT_SCENE_DURATION = 10.0; // seconds

function calculateClipDuration(numScenes, transitionMode, transitionDuration, sceneDuration = DEFAULT_SCENE_DURATION) {
    // Scene duration is fixed, not derived from narration
    return sceneDuration;
}

// Video duration:
// - Hard cut: numScenes × sceneDuration = 3 × 10 = 30s
// - Xfade: (numScenes × sceneDuration) - ((numScenes-1) × transitionDuration) = 30 - 2 = 28s
```

**Note:** Each scene in Step 3 has a `duration` field (5s or 10s). This should be passed to the assembly, not calculated from narration.

### Task 21.6: Pass Scene Durations to Assembly (P1)

**File:** `app/[locale]/guided/step-5/page.tsx` and `app/[locale]/guided/step-6/page.tsx`

Pass individual scene durations to the assembly action so it can calculate correct video length:

```typescript
await buildFinalVideo({
    projectId,
    sceneIds: scenes.map(s => s._id),
    sceneDurations: scenes.map(s => s.duration || 10), // Array of durations per scene
    // ...
});
```

---

## QA Checklist

### Pre-Implementation
- [ ] Verify test script still passes with current URLs
- [ ] Check Convex environment has RENDI_API_KEY set

### Post-Implementation
- [ ] TypeScript: `npx tsc --noEmit` passes
- [ ] Biome: `npx biome check --write` passes
- [ ] Translations: `node scripts/translate.js` syncs all languages
- [ ] Translations: `node scripts/verify-translations.js` shows all 7 languages synced
- [ ] Deploy: `npx convex dev --once` succeeds
- [ ] E2E Test: Run `node tests/e2e/test-full-assembly.js` passes
- [ ] Manual Test: Create new assembly with hard cut → verify 30s video
- [ ] Manual Test: Create new assembly with xfade → verify 28s video
- [ ] Manual Test: Verify music is audible in final video

### Manual Testing Steps
1. Go to Step 4 with existing project
2. Ensure narration and music are selected
3. Continue to Step 5
4. Click "Re-assemble with changes"
5. Wait for assembly to complete on Step 6
6. Play final video - **verify music is audible**

---

## Time Estimate

| Task | Priority | Status | Estimate |
|------|----------|--------|----------|
| 21.1 Fix audio polling resilience | P0 | ✅ Done | 15 min |
| 21.2 Fix video polling resilience | P1 | ✅ Done | 10 min |
| 21.3 Add translation key + run translate.js | P1 | ✅ Done | 10 min |
| 21.4 Music URL (kept required) | P1 | ✅ Done | 5 min |
| 21.5 Fix clip duration (10s/scene) | P0 | ✅ Done | 20 min |
| 21.6 Pass scene durations to assembly | P1 | 🔄 Later | - |
| Step 6 assembly button commented out | P1 | ✅ Done | 5 min |
| Duration review (hard cut/xfade) | P1 | 🔄 Later | - |
| QA & Testing | - | ✅ Done | 20 min |

---

## Technical Notes

### Why the Test Works but Production Fails

**Key Difference #1: Polling Resilience**

The E2E test script polls without checking `res.ok`:
```javascript
const res = await fetch(...);
const data = await res.json();  // Just parse JSON directly
if (data.status === "SUCCESS") { return success; }
if (data.status === "FAILED") { throw error; }
// Otherwise continue polling (even if HTTP status was 500!)
```

The production code throws on ANY HTTP error:
```typescript
if (!pollRes.ok) {
    throw new Error(`Rendi poll failed...`);  // FAIL IMMEDIATELY
}
```

A single transient 500/502/503/429 during the ~48s of audio processing causes the entire operation to fail.

**Key Difference #2: Clip Duration Calculation (CRITICAL BUG)**

The E2E test uses **FIXED 10s scene duration**:
```javascript
const CLIP_DURATION = 10.0; // Each scene = 10 seconds
// Hard cut: 3 × 10s = 30s video
// Xfade: 30s - 2×1s = 28s video
```

The production code **WRONGLY calculates clip duration from narration**:
```typescript
function calculateClipDuration(narrationDurationMs, numScenes, ...) {
    const narrationDurationSec = narrationDurationMs / 1000;
    if (transitionMode === "hard_cut") {
        return narrationDurationSec / numScenes;  // ← WRONG!
    }
}
// With 28s narration, 3 scenes: 28/3 = 9.3s per clip = 28s video
```

### Correct Video Duration Calculation

**How it SHOULD work:**
- Scene duration is FIXED (10s per scene from Step 3)
- **Hard Cut:** `numScenes × sceneDuration` = 3 × 10s = **30s**
- **Xfade:** `(numScenes × sceneDuration) - ((numScenes-1) × transitionDuration)` = 30s - 2×1s = **28s**
- Narration/audio is trimmed or padded to match video, NOT the other way around

**How it's CURRENTLY working (bug):**
- Takes narration duration (e.g., 28s)
- Divides by scenes: 28/3 = 9.3s per clip
- Results in 28s video (matches narration, ignores scene duration)

---

## Files Modified

1. `lib/audio-processing.ts` - Polling resilience (retry on transient HTTP errors, 4 min timeout)
2. `lib/rendi-video-processing.ts` - Polling resilience (same pattern)
3. `messages/en.json` - Added "reassembling" key
4. `messages/*.json` - Synced translations to all 6 languages
5. `app/[locale]/guided/step-5/page.tsx` - Music URL kept required (no fallback)
6. `app/[locale]/guided/step-6/page.tsx` - Commented out "Assemble Final Video" button
7. `convex/actions/videoAssembly.ts` - Fixed clip duration to use 10s/scene (not narration)

