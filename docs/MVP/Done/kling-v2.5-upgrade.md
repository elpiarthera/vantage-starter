# 🎬 Kling v2.5 Turbo Pro Upgrade Plan

**Date**: December 18, 2025  
**Status**: ✅ **COMPLETED**  
**Goal**: Upgrade video generation from Kling v2.1 Pro to Kling v2.5 Turbo Pro for better motion fluidity and prompt precision.  
**Reference**: [Kling v2.5 API Docs](https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video/api)

---

## 📝 PROGRESS SUMMARY

### ✅ UPGRADE TASKS (100% Complete)

**Task 1**: ✅ Update Model Identifiers & Fix Payload Bug  
**Task 2**: ✅ Update Status Polling Logic (Full Path)  
**Task 3**: ✅ Update Cost Calculation & Prompt Metadata  
**Task 4**: ✅ Update Documentation & Schema  
**Task 5**: ✅ QA & Verification  
**Task 6**: ✅ Deployment to Convex  

---

## 🛠️ Detailed Tasks

### Task 1: Update Model Identifiers & Fix Payload Bug
- [x] **convex/actions/videoGeneration.ts**:
    - Line 10: Changed `KLING_MODEL_ID` to `"fal-ai/kling-video/v2.5-turbo/pro/image-to-video"`.
    - Line 209: Updated `logAIUsage` model name to `"kling-video-v2.5-turbo-pro"`.
    - Lines 228-231: Updated `KlingVideoInput` interface JSDoc to reference v2.5.
- [x] **convex/actions/videoRegeneration.ts**:
    - Line 10: Changed `KLING_MODEL_ID` to v2.5.
    - **CRITICAL BUG FIX** (Line 135): Changed `body: JSON.stringify({ input: falInput })` to `body: JSON.stringify(falInput)`. The payload must be root-level.
    - Line 245: Updated `logAIUsage` model name.

### Task 2: Update Status Polling Logic (Full Path)
- [x] **convex/actions/videoPolling.ts**:
    - Line 12: Updated `_KLING_MODEL_ID` to v2.5.
    - **CRITICAL** (Line 14): Updated `KLING_BASE_MODEL` to `"fal-ai/kling-video/v2.5-turbo/pro/image-to-video"`. v2.5 requires the full path for queue status endpoints.
    - Lines 272, 310, 372: Updated model name in `calculateAICost` and `logAIUsage` calls.
    - Line 482: Updated `KlingVideoOutput` interface JSDoc to reference v2.5.

### Task 3: Update Cost Calculation & Prompt Metadata
- [x] **lib/ai/costCalculation.ts**:
    - Line 11: Updated header comment from `~$0.50/10s video` to `~$0.70/10s video`.
    - Lines 96-98: Changed video pricing rate from `0.05` to `0.07` per second.
- [x] **lib/ai/prompts/video/generation.prompt.ts**:
    - Updated header comments (line 6) and `metadata.model` field (line 124) to reference v2.5.

### Task 4: Update Documentation & Schema
- [x] **convex/schema.ts**:
    - Updated line 272 comment to reference v2.5.
- [x] **docs/Implementation/ToDo/ai-models-implementation-plan.md**:
    - Replaced references to v2.1 with v2.5 throughout the guide and code examples.
- [x] **docs/Understanding/ai-models-overview.md**:
    - Updated section 4.3 with v2.5 features and new pricing ($0.07/sec).
- [x] **docs/Guides/api-integration-guide.md**:
    - Updated model ID and pricing in code examples.
- [x] **docs/Guides/data-flow-architecture.md**:
    - Updated all video generation references to v2.5.
- [x] **README.md**:
    - Updated AI Models table to reference v2.5.
- [x] **__tests__/integration/fal-video-generation.integration.test.ts**:
    - Updated test file model ID to v2.5.
- [x] **convex/actions/videoGeneration.ts** (additional):
    - Line 94: Fixed stale comment URL to v2.5.
- [x] **convex/actions/videoPolling.ts** (additional):
    - Lines 113, 200: Updated comments to reflect v2.5 full path requirement.

### Task 5: QA & Verification
- [x] Run `npx tsc --noEmit` - ✅ SUCCESS
- [x] Run `npx biome check .` - ✅ SUCCESS
- [x] Verified all string constants and URLs.
- [x] Verified payload structure consistency between generation and regeneration.
- [x] Verified cost logic matches the new pricing specification.
- [x] **Senior Code Review**: All v2.1 references removed from active codebase.
    - Note: `docs/MVP/Todo/sprint-6-implementation.md` retains historical v2.1 references (by design).

### Task 6: Deployment to Convex
- [x] Run `npx convex dev --once` - ✅ SUCCESS (Functions deployed to Dev environment)

---

## ⏱️ TIME TRACKING

| Task | Estimated | Actual | Status |
|------|-----------|--------|--------|
| Task 1: Convex Actions | 30m | 15m | ✅ |
| Task 2: Polling Logic | 20m | 10m | ✅ |
| Task 3: Cost & Prompts | 20m | 10m | ✅ |
| Task 4: Documentation | 15m | 20m | ✅ |
| Task 5: QA & Verify | 40m | 10m | ✅ |
| Task 6: Deployment | 5m | 5m | ✅ |
| **TOTAL** | **2h 10m** | **70m** | **✅ 100% COMPLETE** |
