# Biome Errors – Current State & Fix Plan (Dec 5, 2025)

## Summary
Biome is still flagging issues in legacy/mock utilities that aren’t part of the production path. Core app files are clean; remaining errors come from:
- Legacy hook: `hooks/business-logic/useVideoWorkflow.ts`
- Mock data: `lib/mock-data/**` (`audio.ts`, `audioTracks.ts`, `chatMessages.ts`, `templates.ts`, `videos.ts`)
- Utility helpers: `lib/monitoring/analytics.ts`, `lib/storage.ts`, `services/aiChat.ts`

## Error Types (representative)
- `noExplicitAny`: mock/legacy files use `any` for payloads and configs.
- `noNonNullAssertion`: `result.videoUrl!` in `useVideoWorkflow.ts`.
- (After current ignores) no a11y/import issues in active code; remaining items are type-safety in legacy/mock modules.

## Two Paths to Green
1) **Ignore legacy paths (fastest)**
   - Add to `.biomeignore`:
     - `hooks/business-logic/useVideoWorkflow.ts`
     - `lib/mock-data/**`
     - `lib/monitoring/**`
     - `services/aiChat.ts`
     - `lib/storage.ts`
   - Rerun: `rm -rf .next && npx @biomejs/biome check --max-diagnostics=200`

2) **Type/clean the legacy files (slower, keeps lint coverage)**
   - `useVideoWorkflow.ts`
     - Replace `any` with a typed options interface (scene id, frame URLs, cinematicStyles).
     - Remove `!` non-null assertions; guard `result.videoUrl`.
   - `lib/mock-data/*`
     - Define shared interfaces (e.g., `AudioTrack`, `TemplateConfig`) and use `Record<string, unknown>` where truly dynamic.
   - `lib/monitoring/analytics.ts`
     - `data?: Record<string, unknown>`; type params.
   - `lib/storage.ts`
     - `StorageData = Record<string, unknown>` (or a typed map if known keys).
   - `services/aiChat.ts`
     - Type `context` as a specific shape or `Record<string, unknown>`.

## Recommendation
Given these are non-production helpers/mocks, adopt **Path 1 (ignore)** to keep CI green quickly. If we need lint coverage on mocks later, schedule Path 2 as a tech-debt task.

