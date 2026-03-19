# Archive Manifest

Date: 2026-03-19
Sprint: VantageStarter Sprint 1 (Tasks 1.1 + 1.2 + 1.4)
Reason: Strip MSR (MyShortReel) domain-specific code. Keep generic SaaS infrastructure only.

---

## What Was Moved and Why

### convex/ — Convex Functions

| File | Reason |
|------|--------|
| `convex/scenes.ts` | MSR 6-step video scene model. No reuse value. |
| `convex/audioTracks.ts` | MSR audio track management. Tied to video pipeline. |
| `convex/imageModels.ts` | MSR image model registry. Replaced by imageModelSchemas pattern. |
| `convex/videoModels.ts` | MSR video model registry. Replaced by videoModelSchemas pattern. |
| `convex/voiceModels.ts` | MSR voice model registry. Replaced by voiceModelSchemas pattern. |
| `convex/tools.ts` | MSR Tool Selection Wall CRUD. No generic equivalent yet. |
| `convex/imageToolHistory.ts` | MSR image tool history. Domain-specific. |
| `convex/imageTool.ts` | MSR image generation tool. Contains credit-gate pattern — see imageToolGeneric.ts. |
| `convex/refinementFlows.ts` | MSR guided refinement flows. Domain-specific. |
| `convex/transitionEffects.ts` | MSR FFmpeg xfade transition table. No reuse value. |
| `convex/templates.ts` | MSR video templates. Pattern is reusable (preset library) — see comments. |
| `convex/projects.ts` | MSR 6-step video project model. Auth pattern is reusable — see file header. |
| `convex/videoStatus.ts` | MSR video assembly status tracking. |
| `convex/videos.ts` | MSR final rendered video records. |
| `convex/videoTool.ts` | MSR video generation tool. References deductCreditsForVideo (archived). |
| `convex/voiceTool.ts` | MSR voice generation tool. |

### convex/actions/ — All Actions Archived

| File | Reason |
|------|--------|
| `aiChat.ts` | OpenAI + Together.ai dual-provider pattern. Reference for any LLM integration. |
| `imageGeneration.ts` | MSR scene frame image generation. Domain-specific. |
| `imageToolGeneric.ts` | **HIGH VALUE** — canonical FAL integration: queue submit → poll → refund on failure. |
| `musicGeneration.ts` | MSR music generation. No reuse value. |
| `narrationGeneration.ts` | MSR narration scripts. No reuse value. |
| `videoAssembly.ts` | MSR video assembly pipeline. No reuse value. |
| `videoGeneration.ts` | FAL video queue submit + poll. Reference for async job pattern. |
| `videoPolling.ts` | Background polling action for long-running FAL jobs. Reusable pattern. |
| `videoRegeneration.ts` | Retry + credit handling. Reusable pattern. |
| `videoToolGeneric.ts` | Zero-code video model onboarding via Convex table. High value reference. |
| `voiceProcessing.ts` | Voice upload → enhance → transcript. Reference if audio uploads needed. |
| `voiceToolGeneric.ts` | Same quality as imageToolGeneric. Voice model config from Convex table. |

### convex/migrations/ — All MSR Migrations

| File | Reason |
|------|--------|
| `cleanDuplicateVoiceModels.ts` | MSR-specific. Voice model deduplication. |
| `fixDraftProjectsWithVideo.ts` | MSR-specific. Project data fix. |
| `migrateTransitionConfig.ts` | MSR-specific. Transition effect migration. |

### convex/seed/ — MSR Seed Data

| File | Reason |
|------|--------|
| `fixVoiceModelSchemas.ts` | MSR voice model schema fix. |
| `seedCompleteVoiceModels.ts` | MSR voice model seed data. |
| `seedImageModels.ts` | MSR image model seed data. |
| `seedTools.ts` | MSR Tool Selection Wall seed data. |
| `seedVideoModels.ts` | MSR video model seed data. |
| `seedVoiceModels.ts` | MSR voice model seed data. |

---

## Schema Tables Removed

| Table | Reason |
|-------|--------|
| `scenes` | MSR video scene model |
| `audioTracks` | MSR audio track management |
| `videos` | MSR final rendered video records |
| `templates` | MSR video templates (pattern reusable) |
| `projects` | MSR 6-step video projects |
| `creditBalances` | Legacy org-level balance — superseded by userCredits |
| `imageToolHistory` | MSR image tool history |
| `transitionEffects` | MSR FFmpeg transitions |
| `tools` / `toolCategories` / `toolSubCategories` / `toolThemes` / `toolSubCategoryThemes` / `toolWallConfigs` | MSR Tool Selection Wall hierarchy |
| `ads` | MSR promotional ads |
| `refinementFlows` / `refinementQuestions` / `refinementSessions` | MSR guided refinement |
| `imageModelSchemas` | MSR image model config table |
| `imagePresets` | MSR image presets |
| `voiceModelSchemas` | MSR voice model config table |
| `videoModelSchemas` | MSR video model config table |
| `voiceToolHistory` | MSR voice tool history |

---

## What Was Modified (Not Archived)

### convex/schema.ts
- Kept: 13 generic tables (users, organizations, assets, chatMessages, subscriptions, usageTracking, activities, sharedLinks, userCredits, creditTransactions, creditCosts, subscriptionTiers, systemConfig)
- Removed: all MSR-domain tables listed above
- Changed: `activities.type` from strict union literal to `v.string()` (generic)
- Changed: `sharedLinks.videoId` → `sharedLinks.resourceId` (generic)
- Changed: `organizations` simplified (removed MSR-specific fields)
- Changed: `users` simplified (removed `totalProjects`, `defaultStyle`)

### convex/chatMessages.ts
- Renamed field: `step` → `context` (generic context/thread identifier)
- Renamed index: `by_project_and_step` → `by_project_and_context`
- Removed: MSR project ownership check (projects table gone)
- Removed: `adminClearByProjectAndStep` debug mutation
- Added: `clearByProjectAndContext` (replaces `clearByProjectAndStep`)

### convex/assets.ts
- Removed: `getSceneFrames` query (referenced `scenes` table)
- Removed: `sceneId` filter from `list` args

### convex/credits.ts
- Removed: `deductCreditsForVideo` plain async function (video-specific duration scaling)
- Removed: `refundVideoCredits` internalMutation
- Removed: `creditCost.step` field reference from `getCreditCost` return
- Removed: unused `Id` and `MutationCtx` imports

### convex/files.ts
- Changed: `projectId: v.id("projects")` → `v.string()` (generic)
- Removed: `sceneId: v.id("scenes")` arg entirely

### convex/sharedLinks.ts
- Rewrote: `videoId` → `resourceId` throughout (generic sharing pattern)

### convex/users.ts
- Removed: `totalProjects: 0` from user insert (field no longer in schema)

---

## Reuse Value (Read Before Building)

When building AI tool features for VantageStarter, reference these archived files first:

1. **FAL integration** → `_archive/convex/actions/imageToolGeneric.ts`
2. **Credit-gated action pattern** → `_archive/convex/imageTool.ts`
3. **Zero-code model onboarding** → `_archive/convex/actions/videoToolGeneric.ts`
4. **Dual-provider LLM fallback** → `_archive/convex/actions/aiChat.ts`
5. **Async job polling** → `_archive/convex/actions/videoPolling.ts`
6. **Preset library pattern** → `_archive/convex/templates.ts`
