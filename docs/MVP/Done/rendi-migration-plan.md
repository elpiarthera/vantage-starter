# 🎬 Rendi API Migration Plan - Video Assembly

**Date**: December 20, 2025  
**Status**: ✅ **COMPLETED**  
**Goal**: Migrate video assembly from Fal.ai FFmpeg API to Rendi API for xfade transitions and unified processing.  
**Reference**: [Rendi FFmpeg API Guide](../../../docs/Guides/rendi-ffmpeg-api-guide.md)

---

## 📊 Current vs Target Architecture

### Current Architecture (Hybrid - Fal.ai + Rendi)

From Sprint 8 Implementation (Option D — Parallel Execution):

```
      ┌─────────────────────┐       ┌─────────────────────┐
      │  Convex Orchestrator│◄──────│  User Request       │
      └──────────┬──────────┘       └─────────────────────┘
                 │
       (Parallel Execution)
        ┌────────┴─────────┐
        │                  │
┌───────▼──────┐    ┌──────▼──────┐
│  Track A     │    │  Track B    │
│  FAL AI      │    │  RENDI      │
│  (Merge      │    │  (Mix Audio │
│   Videos)    │    │   + Ducking)│
│  NO xfade!   │    │  ✅ Working │
└───────┬──────┘    └──────┬──────┘
        │                  │
        │ mergedVideoUrl   │ mixedAudioUrl
        └────────┬─────────┘
                 ▼
      ┌─────────────────────┐
      │  FAL AI             │
      │  (Final A/V Mux)    │
      └──────────┬──────────┘
                 │
                 ▼
      ┌─────────────────────┐
      │  finalVideoUrl      │
      │  (stored in Convex) │
      └─────────────────────┘
```

**Current Issues**:
- Fal.ai merge-videos = simple concatenation, **NO transitions**
- Two different API providers to manage
- No xfade effects between scenes

### Target Architecture (Rendi Only)

```
      ┌─────────────────────┐       ┌─────────────────────┐
      │  Convex Orchestrator│◄──────│  User Request       │
      └──────────┬──────────┘       └─────────────────────┘
                 │
       (Parallel Execution)
        ┌────────┴─────────┐
        │                  │
┌───────▼──────┐    ┌──────▼──────┐
│  Track A     │    │  Track B    │
│  RENDI       │    │  RENDI      │
│  (Merge      │    │  (Mix Audio │
│   Videos     │    │   + Ducking │
│   + XFADE!)  │    │   + Loudnorm│
│  ~$0.05      │    │  ~$0.03     │
└───────┬──────┘    └──────┬──────┘
        │                  │
        │ mergedVideoUrl   │ mixedAudioUrl
        │ (with xfade)     │ (ducked + normalized)
        └────────┬─────────┘
                 ▼
      ┌─────────────────────┐
      │  RENDI              │
      │  (Final A/V Mux)    │
      │  ~$0.02             │
      └──────────┬──────────┘
                 │
                 ▼
      ┌─────────────────────┐
      │  finalVideoUrl      │
      │  (stored in Convex) │
      └─────────────────────┘
```

**Benefits**:
- ✅ **46 xfade transitions** verified working (see `docs/MVP/x-fade-effects-tests.md`)
- ✅ Single API provider (Rendi)
- ✅ Already tested and verified
- ✅ Unified billing and debugging

**Recommended transitions for invitation videos**:
- `circleopen` - Elegant circular reveal (default)
- `fade` - Classic smooth fade
- `dissolve` - Professional cross-dissolve
- `smoothleft` / `smoothright` - Smooth sliding
- `zoomin` - Dynamic zoom effect

---

## ✅ Benefits of Migration

| Aspect | Fal.ai (Current) | Rendi (Target) |
|--------|------------------|----------------|
| **Transitions** | ❌ None (simple concat) | ✅ xfade (circleopen, fade, etc.) |
| **API Consistency** | Hybrid (2 providers) | Single provider |
| **Debugging** | Separate dashboards | Unified command history |
| **Verified** | ✅ Working | ✅ Tested (`test-xfade.js`) |
| **Cost** | ~$0.09/assembly | ~$0.10/assembly |

---

## 🛠️ Implementation Tasks

### Task 1: Update `lib/audio-processing.ts` - Fix Endpoint
**Status**: ✅ DONE

### Task 2: Create `lib/rendi-video-processing.ts` - New Module
**Status**: ✅ DONE

### Task 3: Update `convex/actions/videoAssembly.ts` - Use Rendi
**Status**: ✅ DONE

### Task 4: Update Cost Calculation
**Status**: ✅ DONE

### Task 5: Update Documentation
**Status**: ✅ DONE

### Task 6: Update Tests
**Status**: ✅ DONE

---

### Task 7: Integration Test (ALREADY CREATED)

**Priority**: HIGH (run before implementation)  
**Estimated Time**: 5 minutes

**File**: `tests/e2e/test-full-assembly.js` ✅ **CREATED**

Run the full assembly test to verify Rendi works end-to-end:
```bash
node tests/e2e/test-full-assembly.js
```

**What it tests**:
1. **Step 1**: Merge 3 video scenes with xfade transitions (circleopen)
2. **Step 2**: Mix narration + music with sidechain ducking (parallel with Step 1)
3. **Step 3**: Merge video + audio into final MP4

**Configuration required**:
- Update `SCENES` array with actual Convex storage URLs
- Update `NARRATION_URL` and `MUSIC_URL` with actual audio URLs

---

## ⏱️ Time Estimate

| Task | Estimated Time |
|------|----------------|
| Task 1: Fix audio-processing.ts endpoint | 15m |
| Task 2: Create rendi-video-processing.ts | 45m |
| Task 3: Update videoAssembly.ts | 30m |
| Task 4: Update cost calculation | 10m |
| Task 5: Update documentation | 30m |
| Task 6: Update unit tests | 20m |
| Task 7: Add integration test | 15m |
| **TOTAL** | **~2h 45m** |

---

## 🔍 Pre-Implementation Checklist

- [ ] Verify `RENDI_API_KEY` is set in all environments
- [ ] Confirm xfade test still passes: `node tests/e2e/test-xfade.js`
- [ ] Review scene metadata to get actual clip durations
- [ ] Decide on default transition type (recommended: `circleopen`)

---

## 📋 Post-Implementation Verification

- [ ] Run `npx tsc --noEmit` - TypeScript compiles
- [ ] Run `npx biome check .` - Linting passes
- [ ] Run `npx convex dev --once` - Convex deploys
- [ ] Run unit tests: `npm test -- videoAssembly`
- [ ] Manual E2E test: Create a project and assemble video
- [ ] Verify xfade transitions appear in final video
- [ ] Verify audio ducking works correctly
- [ ] Check Rendi dashboard for successful commands

---

## ⚠️ Rollback Plan

If issues arise:
1. Revert `convex/actions/videoAssembly.ts` to use Fal.ai
2. Keep `lib/rendi-video-processing.ts` for future use
3. Audio mixing can remain on Rendi (already working)

---

## 📁 Files to Create/Modify

| File | Action | Priority | Status |
|------|--------|----------|--------|
| `tests/e2e/test-full-assembly.js` | CREATE | HIGH | ✅ DONE |
| `lib/audio-processing.ts` | MODIFY (fix endpoint) | HIGH | ⏳ Pending |
| `lib/rendi-video-processing.ts` | CREATE | HIGH | ⏳ Pending |
| `convex/actions/videoAssembly.ts` | MODIFY (use Rendi) | HIGH | ⏳ Pending |
| `lib/ai/costCalculation.ts` | MODIFY (add Rendi costs) | MEDIUM | ⏳ Pending |
| `docs/Understanding/ai-models-overview.md` | MODIFY | MEDIUM | ⏳ Pending |
| `docs/Implementation/ToDo/ai-models-implementation-plan.md` | MODIFY | MEDIUM | ⏳ Pending |
| `docs/Guides/api-integration-guide.md` | MODIFY | MEDIUM | ⏳ Pending |
| `docs/Guides/data-flow-architecture.md` | MODIFY | MEDIUM | ⏳ Pending |
| `README.md` | MODIFY | MEDIUM | ⏳ Pending |
| `__tests__/convex/actions/videoAssembly.test.ts` | MODIFY | MEDIUM | ⏳ Pending |

---

## 🧪 Related Test Files

| File | Purpose | Status |
|------|---------|--------|
| `docs/MVP/x-fade-effects-tests.md` | All 58 xfade transitions tested | ✅ 46 passed, 12 failed |
| `tests/e2e/test-xfade.js` | Standalone xfade transition test | ✅ Verified (Dec 15) |
| `tests/e2e/test-full-assembly.js` | Full assembly pipeline test | ✅ Created |
| `tests/x-fade-effects-scripts/*.js` | Individual xfade effect tests | ✅ All created |
| `__tests__/convex/actions/videoAssembly.test.ts` | Unit tests (mocked) | ⏳ Update needed |

### ⚠️ Failed Transitions (Do NOT use)

The following 12 transitions are not supported by FFmpeg/Rendi:
- `hlwind`, `hrwind`, `vuwind`, `vdwind` (wind effects)
- `coverleft`, `coverright`, `coverup`, `coverdown` (cover effects)
- `revealleft`, `revealright`, `revealup`, `revealdown` (reveal effects)

---

*This plan migrates video assembly from Fal.ai to Rendi for xfade transitions and unified processing.*

