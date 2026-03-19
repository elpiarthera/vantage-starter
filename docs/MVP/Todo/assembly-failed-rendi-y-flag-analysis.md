# Assembly Failed: Rendi “Don’t use -y” — Root Cause & Fix

**Date**: 2026-01-25  
**Status**: Analysis complete, no code change yet  
**Error**: `Rendi submit failed: 400 {"detail":"Don't use the -y flag in the command, we handle this internally."}`

---

## 1. Observed behaviour

- User clicks “Assemble & Render Final Video” on Step 5.
- Assembly runs (video merge via per-scene xfade, then audio merge).
- **First Rendi call** (video merge) returns **400** with:
  - `"Don't use the -y flag in the command, we handle this internally."`
- Convex action throws; project gets `assemblyStatus: "failed"`.
- Step 6 shows “Assembly Failed” with “Retry Assembly”.

Console/Convex logs show:

- `[VideoAssembly] Using per-scene transitions: [{"effectKey":"fade","duration":1},{"effectKey":"dissolve","duration":1}]`
- `[mergeVideosWithPerSceneXfade] Filter complex: ...`
- Then: `Uncaught Error: Rendi submit failed: 400 {"detail":"Don't use the -y flag in the command, we handle this internally."}` at `videoAssembly.ts` when the merge result is checked (after the failed submit).

So the failure happens on **submit** of the first Rendi job (video merge with per-scene xfade). Rendi rejects the request before running FFmpeg.

---

## 2. Root cause

### 2.1 What Rendi forbids

- FFmpeg’s **`-y`** means “overwrite output without prompting”.
- Rendi runs FFmpeg in their own environment and **manages output files themselves**.
- They explicitly forbid putting `-y` in the `ffmpeg_command` and return **400** if it is present.

So the root cause is: **our FFmpeg command strings include `-y`**, and Rendi’s API rejects them.

### 2.2 Where we use `-y`

All Rendi commands are built in:

- `lib/rendi-video-processing.ts`
- `tests/e2e/test-full-assembly.js`

**Production code** (`lib/rendi-video-processing.ts`):

| Location        | Function                       | Command snippet (end of string)     | Uses `-y`? |
|----------------|--------------------------------|-------------------------------------|-----------|
| ~line 145      | `mergeVideosWithXfade`         | `... -c:v libx264 -y {{out_video}}`  | ✅ Yes    |
| ~line 222      | `mergeVideosConcat`            | `... -c:v libx264 -y {{out_video}}` | ✅ Yes    |
| ~line 493      | `mergeVideosWithPerSceneXfade` | `... -c:v libx264 -y {{out_video}}` | ✅ Yes    |

`mergeAudioVideo` (~line 299) uses:

```ts
`-i {{in_video}} -i {{in_audio}} -c:v copy -c:a aac -b:a 192k -shortest {{out_final}}`
```

No `-y` there — correct.

**E2E test** (`tests/e2e/test-full-assembly.js`):

| Step   | Function               | Line  | Command snippet (end)     | Uses `-y`? |
|--------|------------------------|-------|---------------------------|-----------|
| Step 1 | `mergeVideosWithXfade` | 223   | `... -c:v libx264 -y {{out_video}}` | ✅ Yes    |
| Step 2 | `mixAudioWithDucking`  | 274   | `... {{out_mixed}}`       | ❌ No     |
| Step 3 | `mergeVideoAndAudio`   | 309   | `... -shortest {{out_final}}`        | ❌ No     |

So:

- The **failing path** in production is **per-scene xfade** → `mergeVideosWithPerSceneXfade` → command built with `-y {{out_video}}` → Rendi 400.
- The same bug exists in **all three** video-merge functions in `lib/rendi-video-processing.ts` and in **Step 1** of the full-assembly test.

### 2.3 Why the test “was working”

- `docs/Guides/rendi-ffmpeg-api-guide.md` (lines 73–76) shows an example **without** `-y`:
  - `"-i {{in_scene1}} -i {{in_scene2}} -filter_complex '...' {{out_video}}"`
- So the **documented** contract is “no `-y`”.
- The implementation and test added `-y` by habit (normal FFmpeg usage).  
  Either:
  - the test was last run when Rendi still accepted `-y`, or
  - the test was run in a mode/path that didn’t hit the video-merge step, or
  - it wasn’t run recently against the current Rendi API.

Either way, **given Rendi’s current 400 response**, any run that sends `-y` in the video-merge command would fail. Aligning code and test with the guide (no `-y`) is required for the test and production to pass.

---

## 3. Call path that failed

From your logs and repo:

1. Step 5 → `handleContinue` → `buildFinalVideo` Convex action.
2. `buildFinalVideoHandler`:
   - `transitionMode === "xfade"` and `hasPerSceneTransitions === true`
   - Calls `mergeVideosWithPerSceneXfade(sceneUrls, { transitions, clipDuration })`.
3. `mergeVideosWithPerSceneXfade` (in `lib/rendi-video-processing.ts`):
   - Builds a command ending with `... -c:v libx264 -y {{out_video}}`.
   - `POST /v1/run-ffmpeg-command` with that `ffmpeg_command`.
4. Rendi responds **400** with `"Don't use the -y flag in the command, we handle this internally."`
5. `submitRes.ok` is false → `throw new Error(\`Rendi submit failed: ${submitRes.status} ${errorText}\`)` in `rendi-video-processing.ts`.
6. That error propagates to `buildFinalVideoHandler` → assembly fails, status set to `"failed"`.

So the **exact** root cause is the **`-y` in the FFmpeg command** sent by `mergeVideosWithPerSceneXfade` (and the same pattern in the other two video-merge helpers).

---

## 4. How to fix

### 4.1 Code changes

1. **`lib/rendi-video-processing.ts`**  
   In all three places that build the video-merge command, **remove `-y`** so the output placeholder is just the Rendi output placeholder:

   - **Line ~145** (`mergeVideosWithXfade`):  
     From: `... -map "[out]" -c:v libx264 -y {{out_video}}`  
     To:   `... -map "[out]" -c:v libx264 {{out_video}}`

   - **Line ~222** (`mergeVideosConcat`):  
     Same change: drop `-y ` before `{{out_video}}`.

   - **Line ~493** (`mergeVideosWithPerSceneXfade`):  
     Same change: drop `-y ` before `{{out_video}}`.

   Do **not** add `-y` in `mergeAudioVideo`; it’s already correct.

2. **`tests/e2e/test-full-assembly.js`**  
   - **Line 223** (Step 1 – merge videos):  
     From: `... -c:v libx264 -y {{out_video}}`  
     To:   `... -c:v libx264 {{out_video}}`

   Steps 2 and 3 already use only `{{out_mixed}}` / `{{out_final}}`; no change.

3. **`lib/audio-processing.ts`**  
   Grep shows no `-y`; no change.

### 4.2 Documentation

- **`docs/Guides/rendi-ffmpeg-api-guide.md`**  
  Add a short “Do not use `-y`” rule, for example in **“Key Learnings”** or **“Troubleshooting”**:

  - **Rule**: Do not pass the FFmpeg `-y` flag in `ffmpeg_command`. Rendi handles overwriting internally; including `-y` leads to a 400 from the API.
  - Optional: mention that the example in the guide (line 74) is already correct because it omits `-y`.

That keeps the guide aligned with both Rendi’s requirement and the fixed implementation/test.

---

## 5. Why this wasn’t caught earlier

- The **guide** example never used `-y`, but the guide didn’t state the rule explicitly.
- **Implementation** and **e2e test** used standard FFmpeg habit (`-y` for non-interactive runs).
- Rendi’s “we handle this internally” suggests they added or tightened this check; older runs might have accepted `-y` or the test might not have been run against the current API.

So: **contract** (Rendi + guide) = no `-y`; **code** and **test** = used `-y`. Fix is to remove `-y` everywhere we send a command to Rendi and to document the rule.

---

## 6. Summary

| Item            | Detail                                                                 |
|-----------------|------------------------------------------------------------------------|
| **Symptom**    | Assembly fails with Rendi 400: “Don’t use the -y flag …”               |
| **Root cause**  | `ffmpeg_command` includes `-y` in three video-merge paths + test Step 1 |
| **Failing path**| Per-scene xfade → `mergeVideosWithPerSceneXfade` → command with `-y`  |
| **Fix**         | Remove `-y` from those command strings in code and test; document it  |
| **Files**       | `lib/rendi-video-processing.ts` (3 edits), `tests/e2e/test-full-assembly.js` (1 edit), `docs/Guides/rendi-ffmpeg-api-guide.md` (1 note) |

No other code change is required for this specific error. After removing `-y`, the same assembly flow and the full-assembly test should succeed (assuming Rendi and env are otherwise correct).
