# Rendi FFmpeg API Integration Guide

**Last Updated**: December 15, 2025  
**Status**: ✅ Verified & Working  
**Test Result**: Successfully merged 3 video scenes with xfade transitions

---

## 📚 Official Documentation

| Resource | URL |
|----------|-----|
| **Introduction** | https://docs.rendi.dev/api-reference/introduction.md |
| **Run FFmpeg Command** | https://docs.rendi.dev/api-reference/endpoint/run-ffmpeg-command.md |
| **Poll Command Status** | https://docs.rendi.dev/api-reference/endpoint/poll-command.md |
| **List Commands** | https://docs.rendi.dev/api-reference/endpoint/list-commands.md |
| **Delete Files** | https://docs.rendi.dev/api-reference/endpoint/delete-file.md |
| **FFmpeg Cheatsheet** | https://docs.rendi.dev/ffmpeg-cheatsheet.md |
| **LLM-friendly docs** | https://docs.rendi.dev/llms.txt |
| **System Status** | https://status.rendi.dev |

---

## 🔑 Authentication

All Rendi API endpoints require an API key in the `X-API-KEY` header:

```bash
curl -H "X-API-KEY: YOUR_RENDI_API_KEY" https://api.rendi.dev/v1/...
```

**Environment Variable**: Store in `.env.local`:
```bash
RENDI_API_KEY="your_api_key_here"
```

---

## 🎯 Key Learnings

### 1. Correct Endpoint for Running FFmpeg Commands

**❌ WRONG** (returns "Method Not Allowed"):
```
POST https://api.rendi.dev/v1/commands
```

**✅ CORRECT**:
```
POST https://api.rendi.dev/v1/run-ffmpeg-command
```

### 2. Request Body Structure

The request body uses specific field names:

| Field | Description |
|-------|-------------|
| `ffmpeg_command` | The FFmpeg command (NOT `command`) |
| `input_files` | Dictionary mapping placeholders to URLs |
| `output_files` | Dictionary mapping placeholders to output filenames |
| `vcpu_count` | Number of vCPUs (NOT `vcpus`) |

### 3. File Placeholder Syntax

Rendi uses `{{placeholder}}` syntax:

- **Input files**: Must start with `in_` prefix (e.g., `{{in_scene1}}`)
- **Output files**: Must start with `out_` prefix (e.g., `{{out_video}}`)

**Example**:
```javascript
{
  ffmpeg_command: "-i {{in_scene1}} -i {{in_scene2}} -filter_complex '...' {{out_video}}",
  input_files: {
    in_scene1: "https://storage.example.com/video1.mp4",
    in_scene2: "https://storage.example.com/video2.mp4"
  },
  output_files: {
    out_video: "merged.mp4"
  },
  vcpu_count: 8
}
```

### 4. Polling for Results

Poll endpoint: `GET /v1/commands/{command_id}`

**Status values** (from API docs):
- `QUEUED` - Waiting to be processed
- `PROCESSING` - Currently running
- `PREPARED_FFMPEG_COMMAND` - Command prepared
- `SUCCESS` - Completed successfully
- `FAILED` - Failed with error

**Note**: The polling status uses `SUCCESS`/`FAILED` (uppercase), not `completed`/`failed`.

### 5. Output File Access

On success, the response includes:
```json
{
  "status": "SUCCESS",
  "output_files": {
    "out_video": {
      "file_id": "...",
      "storage_url": "https://storage.rendi.dev/.../merged.mp4",
      "duration": 28.084,
      "size_mbytes": 17.43,
      ...
    }
  }
}
```

---

## 🧪 Testing with test-xfade.js

### Prerequisites

1. **RENDI_API_KEY** in `.env.local`
2. **Video URLs** from Convex storage

### Running the Test

```bash
cd /home/laurentperello/myshortreel-alpha
node tests/e2e/test-xfade.js
```

### What It Tests

- **xfade transitions** between 3 video scenes
- **Transition type**: `circleopen` (can try: `fade`, `dissolve`, `wipeleft`, `slideup`, `pixelize`)
- **Duration calculation**: Proper offset math for seamless transitions

### Expected Output

```
🔑 API Key loaded (first 20 chars): eJwzsDCwSDUxTfNI...
🧪 Starting XFADE PoC with Rendi API...
   Transition type: 'circleopen'
   Clip duration: 10s
   Transition duration: 1s
   Scenes: 3

   Offset 1: 9s
   Offset 2: 18s

📝 Generated FFmpeg Command:
   -i {{in_scene1}} -i {{in_scene2}} -i {{in_scene3}} -filter_complex "...

🚀 Submitting to Rendi API...
✅ Job Submitted! ID: 826cf473-3016-464e-b767-0a9c39eb1509
⏳ Polling for result...

   Processing...

✅ SUCCESS! (took 45.2s)
📹 Here is your video:
https://storage.rendi.dev/.../merged.mp4
```

---

## ✅ How to Verify It Worked

### Method 1: Check via Script Output

The script prints the video URL on success. Click it to watch.

### Method 2: Manual API Poll

If the script was interrupted, check status manually:

```bash
curl -s -H "X-API-KEY: YOUR_API_KEY" \
  "https://api.rendi.dev/v1/commands/YOUR_COMMAND_ID"
```

**Look for**:
- `"status": "SUCCESS"` - Job completed
- `"storage_url"` - URL to download/watch the video

### Method 3: List Recent Commands

```bash
curl -s -H "X-API-KEY: YOUR_API_KEY" \
  "https://api.rendi.dev/v1/commands?limit=5"
```

---

## 📐 FFmpeg xfade Transition Math

For videos with **N scenes** of duration **D** seconds and transition duration **T**:

```
Offset[1] = D - T
Offset[2] = Offset[1] + (D - T)
Offset[3] = Offset[2] + (D - T)
... and so on

Final duration = N × D - (N-1) × T
```

**Example** (3 scenes × 10s with 1s transitions):
- Offset 1 = 10 - 1 = 9s
- Offset 2 = 9 + 9 = 18s
- Final duration = 3 × 10 - 2 × 1 = 28s ✅

---

## ⚠️ Transition Duration vs Expected Output (UX Consideration)

### The Problem

With **xfade transitions**, scenes **overlap** during the transition, reducing total duration:

```
Scene 1: |==========| (10s)
Scene 2:          |==========| (starts at 9s, overlaps 1s)
Scene 3:                   |==========| (starts at 18s, overlaps 1s)
         0        9       18        28
```

**Users expect**: 3 scenes × 10s = **30s output**  
**Actual result**: 3 × 10 - 2 × 1 = **28s output**

### Solutions

#### Option 1: Generate Longer Scenes (Recommended)

To get **30s output** with 3 scenes and 1s transitions:
```
30 = 3 × D - 2 × 1
D = 32/3 ≈ 10.67s per scene
```

Generate scenes at **11s** and trim the final output to exactly 30s.

**Formula to calculate scene duration**:
```
Scene Duration = (Desired Total + (N-1) × Transition) / N
```

#### Option 2: Shorter Transition Duration

Use `0.5s` transitions instead of `1s`:
```
Total = 3 × 10 - 2 × 0.5 = 29s (closer to 30s)
```

#### Option 3: Accept the Trade-off

Document that "smooth transitions reduce total duration slightly" - many professional video editors work this way. This is industry standard behavior.

#### Option 4: Extend Last Scene

Keep scenes at 10s but extend the last scene by `(N-1) × T`:
- Last scene = 10s + 2s = 12s → Total = 30s

This requires generating the last scene with a longer duration.

### Recommendation

**Option 1** is the cleanest solution - generate scenes at 11s each (or calculate dynamically based on desired output duration and transition time). This ensures users get their expected 30s output with nice 1s transitions.

**Status**: Pending client discussion on preferred approach.

---

## 🎬 Supported xfade Transitions

From FFmpeg documentation, common transitions include:

| Transition | Effect |
|------------|--------|
| `fade` | Simple fade |
| `dissolve` | Cross dissolve |
| `wipeleft` | Wipe from right to left |
| `wiperight` | Wipe from left to right |
| `wipeup` | Wipe from bottom to top |
| `wipedown` | Wipe from top to bottom |
| `slideup` | Slide up |
| `slidedown` | Slide down |
| `slideleft` | Slide left |
| `slideright` | Slide right |
| `circleopen` | Circle expanding |
| `circleclose` | Circle shrinking |
| `pixelize` | Pixelation effect |
| `smoothleft` | Smooth slide left |
| `smoothright` | Smooth slide right |

---

## 🔧 Existing Integration

### Audio Mixing (lib/audio-processing.ts)

The project uses Rendi for audio mixing with sidechain compression.

**Note**: The audio mixing code has been updated to use the recommended `/v1/run-ffmpeg-command` endpoint and `ffmpeg_command` payload.

### Video Merging & Final Assembly (lib/rendi-video-processing.ts)

A dedicated library handles video-specific tasks:
- `mergeVideosWithXfade`: Chains multiple scenes with cinematic transitions.
- `mergeAudioVideo`: Final A/V multiplexing.

These functions use the high-performance Rendi infrastructure for consistent results.

---

## 💰 Cost Considerations

- Rendi charges based on **vCPU-seconds**
- Higher `vcpu_count` = faster processing but higher cost
- Video merging with xfade typically takes 30-60 seconds
- Consider `vcpu_count: 4` for balance between speed and cost

---

## 🚨 Troubleshooting

### "Method Not Allowed" Error

**Cause**: Using wrong endpoint  
**Fix**: Use `/v1/run-ffmpeg-command` instead of `/v1/commands`

### "Invalid input file" Error

**Cause**: File URL not accessible or wrong placeholder prefix  
**Fix**: 
- Ensure URLs are publicly accessible
- Use `in_` prefix for input files

### Job Stuck in "PROCESSING"

**Cause**: Large files or complex filter  
**Fix**: 
- Wait longer (video processing takes time)
- Check with manual poll command
- Increase `vcpu_count`

### Output Video Has Wrong Duration

**Cause**: Incorrect offset calculation  
**Fix**: Verify your clip durations match `CLIP_DURATION` in the script

### FFmpeg Command Timed Out (60 seconds for your account)

**Cause**: Trial/free Rendi plans cap FFmpeg runtime at **60 seconds** per command. Video merge with 3×10s scenes (scale + xfade) often exceeds this.  
**Fix**: Upgrade at [https://app.rendi.dev/plans](https://app.rendi.dev/plans) for longer command run times. For local tests, you can use fewer/shorter scenes or run only the audio step to validate the pipeline.

---

## 📁 Related Files

| File | Purpose |
|------|---------|
| `tests/e2e/test-xfade.js` | Standalone xfade transition test |
| `tests/e2e/test-full-assembly.js` | Full assembly pipeline test (video + audio + merge) |
| `lib/audio-processing.ts` | Audio mixing with Rendi |
| `convex/actions/videoAssembly.ts` | Full video assembly action |
| `__tests__/convex/actions/videoAssembly.test.ts` | Unit tests (mocked) |
| `docs/MVP/Todo/rendi-migration-plan.md` | Migration plan from Fal.ai to Rendi |

---

## 🔗 References

- [FFmpeg xfade filter docs](https://ffmpeg.org/ffmpeg-filters.html#xfade)
- [Rendi API Documentation](https://docs.rendi.dev)
- [Rendi GitHub - FFmpeg Cheatsheet](https://github.com/rendi-api/ffmpeg-cheatsheet)

---

## ✅ Verified Test Result (December 15, 2025)

```json
{
  "command_id": "826cf473-3016-464e-b767-0a9c39eb1509",
  "status": "SUCCESS",
  "total_processing_seconds": 41.1,
  "ffmpeg_command_run_seconds": 35.8,
  "output_files": {
    "out_video": {
      "storage_url": "https://storage.rendi.dev/trial_files/.../merged.mp4",
      "duration": 28.084,
      "size_mbytes": 17.43,
      "width": 1924,
      "height": 1076,
      "codec": "h264",
      "frame_rate": 24.0
    }
  }
}
```

**Video URL**: https://storage.rendi.dev/trial_files/0808e41b-6373-4dfe-86ca-a33a34165828/826cf473-3016-464e-b767-0a9c39eb1509/merged.mp4

---

*This guide documents the learnings from integrating and testing Rendi's FFmpeg API for video assembly with xfade transitions.*

