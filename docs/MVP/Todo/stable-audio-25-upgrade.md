# 🎵 Stable Audio 2.5 Upgrade Plan

**Date**: December 18, 2025  
**Status**: ✅ **COMPLETED** (Senior Review Verified)  
**Goal**: Upgrade music generation from Google Lyria 2 to fal-ai/stable-audio-25/text-to-audio for higher quality and better reliability.  
**Reference**: [Stable Audio 2.5 API Docs](https://fal.ai/models/fal-ai/stable-audio-25/text-to-audio/api)

---

## 📝 PROGRESS SUMMARY

### ✅ UPGRADE TASKS (100% Complete)
**Task 1**: ✅ Update Model Identifiers in Convex Actions  
**Task 2**: ✅ Update Cost Calculation Logic  
**Task 3**: ✅ Update Documentation (All Files)  
**Task 4**: ✅ QA & Verification  
**Task 5**: ✅ Senior Developer Review & Complete Reference Updates  

---

## 🛠️ Detailed Tasks

### Task 1: Update Model Identifiers in Convex Actions
- [x] **convex/actions/musicGeneration.ts**:
    - Changed `LYRIA_MODEL` to `STABLE_AUDIO_MODEL` ("fal-ai/stable-audio-25/text-to-audio").
    - Updated input payload to match new schema (`prompt`, `seconds_total`, `num_inference_steps`, `guidance_scale`).
    - Verified polling logic compatibility.
    - Updated return object with correct model string.

### Task 2: Update Cost Calculation Logic
- [x] **lib/ai/costCalculation.ts**:
    - Updated header comments to include Stable Audio 2.5.
    - Added model-specific pricing for `stable-audio-25` ($0.20/request flat rate).

### Task 3: Update Documentation
- [x] **docs/Implementation/ToDo/ai-models-implementation-plan.md**:
    - Replaced `fal-ai/lyria2` with `fal-ai/stable-audio-25/text-to-audio`.
    - Updated cost tables and flow diagrams.
- [x] **docs/Understanding/ai-models-overview.md**:
    - Replaced Section 5.1 (Lyria 2) with Stable Audio 2.5 details.
    - Updated cost summary table and flow diagrams.

### Task 4: QA & Verification
- [x] Run `npx tsc --noEmit` - ✅ SUCCESS
- [x] Run `npx biome check .` - ✅ SUCCESS
- [x] Run `npx convex dev --once` - ✅ SUCCESS
- [x] Verified code consistency and documentation sync.

### Task 5: Senior Developer Review (Additional Fixes)
- [x] **convex/audioTracks.ts**: Changed "Lyria2" to "Stable Audio 2.5" (lines 67, 102)
- [x] **lib/ai/prompts/audio/music-enhancement.prompt.ts**: Updated fal-ai model reference (line 17)
- [x] **components/dashboard/account/tabs/UsageCreditsTab.tsx**: Added "stable-audio" check (backwards compatible)
- [x] **README.md**: Updated all 9 Lyria references to Stable Audio 2.5
- [x] **docs/Guides/data-flow-architecture.md**: Updated model references (lines 38, 207)
- [x] **docs/Guides/api-integration-guide.md**: Updated code examples and pricing (lines 32, 214, 816)
- [x] **docs/Guides/environment-variables.md**: Updated model reference (line 168)
- [x] **docs/Guides/integration-testing-plan.md**: Updated test reference (line 260)
- [x] **docs/Guides/deployment-guide.md**: Updated code example (line 357)
- [x] **docs/Guides/convex-database-schema.md**: Updated 7 model references
- [x] **docs/Ongoing/sprint-production-ready-step-by-step.md**: Updated 13 Lyria references
- [x] **docs/MVP/sprints-priorization.md**: Updated 3 Lyria references
- [x] **docs/Implementation/ToDo/convex-implementation-plan.md**: Updated 4 Lyria references

---

## ⏱️ TIME TRACKING

| Task | Estimated | Actual | Status |
|------|-----------|--------|--------|
| Task 1: Convex Actions | 30m | 15m | ✅ |
| Task 2: Cost Calculation | 15m | 10m | ✅ |
| Task 3: Documentation | 20m | 25m | ✅ |
| Task 4: QA & Verify | 30m | 10m | ✅ |
| Task 5: Senior Review | - | 20m | ✅ |
| **TOTAL** | **1h 35m** | **80m** | **✅ 100% COMPLETE** |

---

## 🔍 SENIOR REVIEW NOTES

**Initial Review Finding**: The original implementation only updated the core files but left **25+ Lyria references** across the codebase.

**Files Left with Intentional Lyria References**:
1. `docs/MVP/Todo/sprint-7-implementation.md` - Historical sprint doc (archive)
2. `docs/MVP/Todo/sprint-9-implementation.md` - Historical sprint doc (archive)  
3. `docs/Implementation/Done/dashboard-ui-implementation-plan.md` - Completed implementation doc
4. `components/dashboard/account/tabs/UsageCreditsTab.tsx` - Keeps `lyria` check for backwards compatibility with existing usage data
5. `docs/MVP/Todo/stable-audio-25-upgrade.md` - This upgrade plan document

**Verification Commands Passed**:
```bash
npx tsc --noEmit         # ✅ SUCCESS
npx biome check .        # ✅ SUCCESS  
npx convex dev --once    # ✅ SUCCESS
```

**Status**: ✅ **PRODUCTION READY**

