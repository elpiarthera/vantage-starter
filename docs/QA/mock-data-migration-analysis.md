# Mock Data Migration Analysis & Remediation Plan

**Date**: November 28, 2025  
**Purpose**: Migrate all mock data to Convex for production-ready code  
**Status**: 🔴 CRITICAL - 36 files using mock data or localStorage  
**Timeline**: 6 HOURS (solo dev, same-day sprint)

---

## 🚀 QUICK START (DO THIS NOW)

### The 6-Hour Plan:
1. **[30 min]** Remove localStorage from scene-store.ts and video-store.ts
2. **[1 hour]** Create 3 Convex files: subscriptions, creditBalances, usageTracking
3. **[2 hours]** Migrate 10 dashboard components to use Convex
4. **[1 hour]** Delete `lib/mock-data/` folder, verify, deploy

### Start Here:
```bash
# 1. Fix stores (Phase 1)
# Edit: stores/scene-store.ts - Remove persist() wrapper
# Edit: stores/video-store.ts - Remove persist() wrapper

# 2. Create Convex functions (Phase 2)
# Create: convex/subscriptions.ts
# Create: convex/creditBalances.ts
# Create: convex/usageTracking.ts
# Create: convex/audioTracks.ts (optional if time)

# 3. Migrate components (Phase 3)
# Edit 10 files in components/dashboard/*
# Replace mock imports with useQuery(api.*)

# 4. Cleanup (Phase 4)
rm -rf lib/mock-data/
grep -r "mock-data" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules
npx tsc --noEmit
npx convex dev --once
```

**Result**: Production-ready codebase in 6 hours ✅

---

## Executive Summary

**Problem**: Despite passing all tests and having zero TypeScript errors, the codebase still relies heavily on mock data and localStorage, making it **NOT production-ready**.

**Impact**:
- Mock data files in `lib/mock-data/` (15 files)
- Components importing mock data (10 files)
- localStorage/sessionStorage usage (3 files)
- Services with fallback mocks (2 files)
- Stores persisting to localStorage (2 files)

**Total Files Affected**: 36 files (excluding tests and docs)

**Convex Schema Coverage**: 14/14 tables implemented ✅
- All necessary Convex tables exist
- Need to create queries/mutations for remaining tables
- Need to migrate components from mock → Convex

---

## Category 1: Mock Data Files (15 files)

### Status: 🟡 SOME DELETED, MOST REMAIN

Located in `lib/mock-data/`:

| File | Status | Convex Table | Action Required |
|------|--------|--------------|-----------------|
| `assets.ts` | 🟡 PARTIAL | ✅ `assets` | Verify no usage, consider archiving |
| `audio.ts` | 🔴 ACTIVE | ✅ `audioTracks` | DELETE after migration |
| `audioTracks.ts` | 🔴 ACTIVE | ✅ `audioTracks` | DELETE after migration |
| `chatMessages.ts` | 🟡 PARTIAL | ✅ `chatMessages` | Verify no usage, consider archiving |
| `credit-balances.ts` | 🔴 ACTIVE | ✅ `creditBalances` | DELETE after migration |
| `creditBalances.ts` | 🔴 ACTIVE | ✅ `creditBalances` | DELETE (duplicate) |
| `organizations.ts` | 🔴 ACTIVE | ✅ `organizations` | DELETE after migration |
| `scenes.ts` | 🔴 ACTIVE | ✅ `scenes` | DELETE after migration |
| `shared-links.ts` | ✅ DELETED | ✅ `sharedLinks` | DONE |
| `sharedLinks.ts` | 🟡 PARTIAL | ✅ `sharedLinks` | Verify no usage, DELETE |
| `subscriptions.ts` | 🔴 ACTIVE | ✅ `subscriptions` | DELETE after migration |
| `templates.ts` | 🔴 ACTIVE | ✅ `templates` | DELETE after migration |
| `usage-tracking.ts` | 🔴 ACTIVE | ✅ `usageTracking` | DELETE after migration |
| `usageTracking.ts` | 🔴 ACTIVE | ✅ `usageTracking` | DELETE (duplicate) |
| `users.ts` | 🔴 ACTIVE | ✅ `users` | DELETE after migration |
| `videos.ts` | 🔴 ACTIVE | ✅ `videos` | DELETE after migration |

### Analysis:
- **2 duplicates**: `credit-balances.ts`/`creditBalances.ts`, `usage-tracking.ts`/`usageTracking.ts`
- **1 deleted**: `shared-links.ts` (ShareTab migration complete)
- **13 active**: Need migration to Convex

---

## Category 2: Components Using Mock Data (10 files)

### Dashboard Components - Account Section

#### 2.1 `components/dashboard/account/tabs/SubscriptionTab.tsx`
**Mock Imports**:
```typescript
import { mockSubscriptions } from "@/lib/mock-data/subscriptions"
```

**Convex Table**: ✅ `subscriptions` (fully defined in schema)

**Migration Plan**:
1. Create `convex/subscriptions.ts` with:
   - `list(organizationId)` - Get org subscriptions
   - `getCurrent(organizationId)` - Get active subscription
   - `updateStatus(subscriptionId, status)` - Update via Polar webhook
2. Replace mock import with `useQuery(api.subscriptions.getCurrent)`
3. Add loading states and error handling
4. Test with real Polar webhook data

**Priority**: 🔴 HIGH (billing critical)

---

#### 2.2 `components/dashboard/account/tabs/UsageCreditsTab.tsx`
**Mock Imports**:
```typescript
import { mockCreditBalances } from "@/lib/mock-data/creditBalances"
import { mockUsageTracking } from "@/lib/mock-data/usageTracking"
```

**Convex Tables**: 
- ✅ `creditBalances` (fully defined)
- ✅ `usageTracking` (fully defined)

**Migration Plan**:
1. Create `convex/creditBalances.ts` with:
   - `get(organizationId)` - Get current balance
   - `deduct(organizationId, amount, reason)` - Deduct credits
   - `add(organizationId, amount, type)` - Add purchased/subscription credits
2. Create `convex/usageTracking.ts` with:
   - `listByOrg(organizationId, dateRange)` - Get usage history
   - `track(userId, service, model, cost, metadata)` - Log usage (already exists?)
3. Replace mock imports with Convex queries
4. Add real-time credit updates

**Priority**: 🔴 HIGH (usage tracking critical for billing)

---

### Dashboard Components - Projects Section

#### 2.3 `components/dashboard/projects/tabs/AudioTab.tsx`
**Mock Imports**:
```typescript
import { mockAudioTracks } from "@/lib/mock-data/audioTracks"
```

**Convex Table**: ✅ `audioTracks` (fully defined)

**Migration Plan**:
1. Create `convex/audioTracks.ts` with:
   - `listByProject(projectId)` - Get all audio for project
   - `create(projectId, type, assetId, config)` - Add audio track
   - `update(trackId, updates)` - Update volume, timing, etc.
   - `remove(trackId)` - Delete audio track
   - `reorder(projectId, trackIds)` - Reorder tracks
2. Replace mock import with `useQuery(api.audioTracks.listByProject)`
3. Add audio upload and generation UI
4. Integrate with Step 4 (Voice & Music)

**Priority**: 🟡 MEDIUM (Step 4 functionality)

---

#### 2.4 `components/dashboard/projects/tabs/ScenesTab.tsx`
**Mock Imports**:
```typescript
import { mockScenes } from "@/lib/mock-data/scenes"
```

**Convex Table**: ✅ `scenes` (fully defined, actively used in guided flow)

**Status**: 🟡 PARTIAL - Guided flow uses Convex, but dashboard tab uses mocks

**Migration Plan**:
1. ✅ `convex/scenes.ts` already exists with full CRUD
2. Replace mock import with `useQuery(api.scenes.listByProject, { projectId })`
3. Reuse existing mutations: `create`, `update`, `remove`
4. Ensure consistency with guided flow Step 3

**Priority**: 🟢 LOW (guided flow already migrated, this is just dashboard view)

---

### Dashboard Components - Scenes Section

#### 2.5 `components/dashboard/scenes/SceneCard.tsx`
**Mock Usage**: Receives `MockScene` type as prop

**Convex Table**: ✅ `scenes` (with full video generation tracking)

**Migration Plan**:
1. Update type from `MockScene` to `Doc<"scenes">`
2. Update parent component to pass Convex scene data
3. Handle video generation status UI
4. Add regeneration button integration

**Priority**: 🟢 LOW (downstream of ScenesTab migration)

---

#### 2.6 `components/dashboard/scenes/ScenePreviewModal.tsx`
**Mock Usage**: Receives `MockScene` type as prop

**Convex Table**: ✅ `scenes`

**Migration Plan**:
1. Update type from `MockScene` to `Doc<"scenes">`
2. Display video generation metadata (provider, model, cost)
3. Show regeneration history if available
4. Add video player for generated videos

**Priority**: 🟢 LOW (downstream of ScenesTab migration)

---

### Dashboard Components - Sharing Section

#### 2.7 `components/dashboard/sharing/SharedLinkCard.tsx`
**Mock Usage**: Receives `MockSharedLink` type as prop

**Convex Table**: ✅ `sharedLinks` (functions already created!)

**Status**: 🟡 PARTIAL - `convex/sharedLinks.ts` exists, but this card component not updated

**Migration Plan**:
1. ✅ `convex/sharedLinks.ts` already has `list`, `create`, `remove`
2. Update type from `MockSharedLink` to `Doc<"sharedLinks">`
3. Update parent component (likely ShareTab - already migrated?)
4. Add real-time view count updates

**Priority**: 🟢 LOW (ShareTab already migrated, just update card component)

---

### Dashboard Components - Templates Section

#### 2.8 `components/dashboard/templates/TemplateCard.tsx`
**Mock Usage**: Receives `MockTemplate` type as prop

**Convex Table**: ✅ `templates` (fully defined)

**Migration Plan**:
1. Create `convex/templates.ts` with:
   - `listSystem()` - Get all system templates
   - `listByOrg(organizationId)` - Get org custom templates
   - `get(templateId)` - Get single template
   - `create(template)` - Create custom template
   - `incrementUsage(templateId)` - Track usage count
2. Update type from `MockTemplate` to `Doc<"templates">`
3. Add template creation UI (admin/agency feature)

**Priority**: 🟡 MEDIUM (nice-to-have for v1)

---

#### 2.9 `components/dashboard/templates/TemplatesList.tsx`
**Mock Imports**:
```typescript
import { mockTemplates } from "@/lib/mock-data/templates"
```

**Convex Table**: ✅ `templates`

**Migration Plan**:
1. Use `convex/templates.ts` queries (create if doesn't exist)
2. Replace mock import with `useQuery(api.templates.listSystem)`
3. Add filtering by category/type
4. Add search functionality

**Priority**: 🟡 MEDIUM (template marketplace feature)

---

### Dashboard Components - Usage Section

#### 2.10 `components/dashboard/usage/UsageChart.tsx`
**Mock Imports**:
```typescript
import { mockUsageTracking } from "@/lib/mock-data/usageTracking"
```

**Convex Table**: ✅ `usageTracking` (fully defined)

**Migration Plan**:
1. Use `convex/usageTracking.ts` (create if doesn't exist)
2. Query usage with date range filters
3. Aggregate by service/model for charts
4. Real-time usage updates as API calls happen
5. Add export to CSV functionality

**Priority**: 🔴 HIGH (usage analytics critical for billing)

---

## Category 3: localStorage/sessionStorage Usage (3 files)

### 3.1 `lib/storage.ts`
**Usage**: Wrapper functions for localStorage operations

**Analysis**:
```typescript
// Generic storage utilities
export function getItem<T>(key: string): T | null
export function setItem<T>(key: string, value: T): void
export function removeItem(key: string): void
```

**Status**: 🟡 UTILITY - Not inherently bad, but enables anti-patterns

**Action**: 
- Keep for legitimate client-side storage (UI preferences, draft state)
- Audit all usage to ensure no data persistence
- Document allowed use cases

**Priority**: 🟢 LOW (utility, not data storage)

---

### 3.2 `stores/scene-store.ts` (Zustand)
**localStorage Usage**: Persists scene state to localStorage

**Analysis**:
```typescript
// Zustand store with localStorage persistence
persist(
  (set, get) => ({
    scenes: [...DEFAULT_SCENES],
    // ... mutations
  }),
  { name: 'scene-storage' }
)
```

**Problem**: 
- Scenes are already in Convex (`convex/scenes.ts`)
- localStorage creates data inconsistency
- No sync between devices
- **MAJOR ISSUE**: This is the root cause of many bugs!

**Migration Plan**:
1. **IMMEDIATE**: Remove localStorage persistence from Zustand store
2. Make Zustand store ephemeral (UI state only)
3. Use Convex as source of truth via `useQuery(api.scenes.listByProject)`
4. Keep Zustand for:
   - Active scene selection (UI state)
   - Draft edits before save (optimistic updates)
   - Scene reordering (commit to Convex on blur)
5. Add sync indicator when saving to Convex

**Priority**: 🔴 CRITICAL (data consistency issue)

---

### 3.3 `stores/video-store.ts` (Zustand)
**localStorage Usage**: Persists video state to localStorage

**Analysis**:
```typescript
// Similar pattern to scene-store
persist(
  (set, get) => ({
    videos: [],
    // ... mutations
  }),
  { name: 'video-storage' }
)
```

**Problem**: Same as scene-store - data inconsistency

**Migration Plan**:
1. **IMMEDIATE**: Remove localStorage persistence
2. Use Convex `videos` table as source of truth
3. Create `convex/videos.ts` with:
   - `listByProject(projectId)` - Get project videos
   - `get(videoId)` - Get single video with metadata
   - `updateStatus(videoId, status)` - Update render status
4. Keep Zustand for:
   - Current video player state
   - Playback position
   - Volume settings (UI only)

**Priority**: 🔴 CRITICAL (data consistency issue)

---

## Category 4: Type Definitions (1 file)

### 4.1 `components/types.ts`
**Mock Types**: Defines `MockScene`, `MockTemplate`, `MockSharedLink`, etc.

**Analysis**: Central type definition file with mock types

**Migration Plan**:
1. Replace all `Mock*` types with Convex `Doc<"tableName">`
2. Export type aliases for convenience:
   ```typescript
   export type Scene = Doc<"scenes">
   export type Template = Doc<"templates">
   export type SharedLink = Doc<"sharedLinks">
   ```
3. Update all components using mock types
4. Remove mock type definitions

**Priority**: 🟡 MEDIUM (blocks component migrations)

---

## Category 5: Services (2 files)

### 5.1 `services/aiChat.ts`
**Mock Usage**: May have fallback to mock responses

**Analysis**: Need to check if this service has mock fallbacks

**Migration Plan**:
1. Audit for any mock response fallbacks
2. Ensure all responses come from real AI providers
3. Add proper error handling instead of mocks
4. Use Convex for persistence, not localStorage

**Priority**: 🔴 HIGH (AI critical feature)

---

### 5.2 `services/videoGeneration.ts`
**Mock Usage**: May have fallback to mock video URLs

**Analysis**: Need to check if this service has mock fallbacks

**Migration Plan**:
1. Audit for any mock video URLs or responses
2. Ensure all generation goes through fal.ai
3. Use Convex `scenes.videoGeneration` for tracking
4. Remove any mock video placeholders

**Priority**: 🔴 HIGH (core video generation feature)

---

## Category 6: Configuration (1 file)

### 6.1 `config/constants.ts`
**Mock Usage**: May define mock data constants

**Analysis**: Configuration file, likely has mock URLs or test data

**Action**:
- Review for any mock URLs, test tokens, or fake data
- Replace with environment variables
- Keep only legitimate constants (limits, defaults, etc.)

**Priority**: 🟡 MEDIUM (configuration hygiene)

---

## Category 7: Guided Flow Pages (2 files)

### 7.1 `app/guided/step-1/page.tsx`
**Mock Usage**: TBD - need to check what mock data is used

**Status**: 🟡 UNCLEAR - May already use Convex, just grep matched "mock" in comments

**Action**: Audit to confirm Convex usage only

**Priority**: 🟢 LOW (likely false positive)

---

### 7.2 `app/guided/step-3/page.tsx`
**Mock Usage**: TBD - need to check what mock data is used

**Status**: 🟡 UNCLEAR - May already use Convex, tests passed

**Action**: Audit to confirm Convex usage only

**Priority**: 🟢 LOW (likely false positive)

---

## Convex Functions Needed

### Already Exist ✅
- `convex/projects.ts` - Full CRUD ✅
- `convex/scenes.ts` - Full CRUD + video generation ✅
- `convex/chatMessages.ts` - List, create ✅
- `convex/assets.ts` - List, upload ✅
- `convex/files.ts` - Storage operations ✅
- `convex/sharedLinks.ts` - List, create, remove ✅

### Need to Create 🔴
1. **`convex/subscriptions.ts`** (HIGH PRIORITY)
   - `list(organizationId)`
   - `getCurrent(organizationId)`
   - `create(organizationId, polarData)`
   - `updateStatus(subscriptionId, status)`
   - `cancel(subscriptionId)`

2. **`convex/creditBalances.ts`** (HIGH PRIORITY)
   - `get(organizationId)`
   - `deduct(organizationId, amount, reason)`
   - `add(organizationId, amount, type)`
   - `reset(organizationId)` - Monthly reset

3. **`convex/usageTracking.ts`** (HIGH PRIORITY)
   - `track(userId, service, model, cost, metadata)` - Log usage
   - `listByOrg(organizationId, dateRange)`
   - `aggregateByService(organizationId, dateRange)`
   - `aggregateByModel(organizationId, dateRange)`

4. **`convex/audioTracks.ts`** (MEDIUM PRIORITY)
   - `listByProject(projectId)`
   - `create(projectId, type, assetId, config)`
   - `update(trackId, updates)`
   - `remove(trackId)`
   - `reorder(projectId, trackIds)`

5. **`convex/templates.ts`** (MEDIUM PRIORITY)
   - `listSystem()`
   - `listByOrg(organizationId)`
   - `get(templateId)`
   - `create(template)`
   - `update(templateId, updates)`
   - `incrementUsage(templateId)`

6. **`convex/videos.ts`** (LOW PRIORITY - Sprint 9 feature)
   - `listByProject(projectId)`
   - `get(videoId)`
   - `create(projectId, renderConfig)`
   - `updateStatus(videoId, status)`
   - `updateMetadata(videoId, metadata)`

7. **`convex/organizations.ts`** (LOW PRIORITY - Multi-tenancy)
   - `get(clerkOrganizationId)`
   - `create(clerkOrganizationId, name, type)`
   - `update(organizationId, updates)`
   - `incrementStats(organizationId, field, amount)`

8. **`convex/users.ts`** (CHECK IF EXISTS)
   - May already exist from Sprint 1 user sync
   - If not, create: `getByClerkId`, `create`, `update`

---

## Migration Strategy (FAST-TRACK - 6 HOURS)

### Phase 1: CRITICAL STORES (30 minutes)
**Goal**: Fix localStorage persistence bugs NOW

1. **scene-store.ts** (15 min)
   - Remove `persist()` wrapper
   - Keep Zustand for UI state only (activeSceneId)
   - Scenes come from Convex `useQuery(api.scenes.listByProject)`
   - Test: Create scene, refresh page, data persists via Convex

2. **video-store.ts** (15 min)
   - Remove `persist()` wrapper
   - Keep Zustand for player state only
   - Videos come from Convex (when implemented)
   - Or delete store entirely if not needed

**Output**: Zero localStorage data persistence ✅

---

### Phase 2: BILLING FUNCTIONS (1 hour)
**Goal**: Create critical Convex functions for billing

**15 min each file:**

1. **`convex/subscriptions.ts`**
   ```typescript
   export const getCurrent = query({
     args: { organizationId: v.string() },
     handler: async (ctx, { organizationId }) => {
       return await ctx.db
         .query("subscriptions")
         .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
         .filter((q) => q.eq(q.field("status"), "active"))
         .first();
     },
   });
   ```

2. **`convex/creditBalances.ts`**
   - `get(organizationId)` - Simple query
   - `deduct(organizationId, amount, reason)` - Mutation with validation

3. **`convex/usageTracking.ts`**
   - `track(userId, service, model, cost, metadata)` - Insert
   - `listByOrg(organizationId, dateRange)` - Query with date filter

4. **Deploy to Convex dev** (5 min)
   ```bash
   npx convex dev --once
   ```

**Output**: Billing infrastructure ready ✅

---

### Phase 3: MIGRATE COMPONENTS (2 hours)
**Goal**: Replace all mock imports with Convex queries

**10-15 min per component** (10 components = 2 hours):

1. **SubscriptionTab** - Replace mock with `useQuery(api.subscriptions.getCurrent)`
2. **UsageCreditsTab** - Replace mock with `useQuery(api.creditBalances.get)`
3. **UsageChart** - Replace mock with `useQuery(api.usageTracking.listByOrg)`
4. **AudioTab** - Create `convex/audioTracks.ts` + migrate component
5. **ScenesTab** - Replace mock with `useQuery(api.scenes.listByProject)` (already exists!)
6. **SceneCard** - Update type `MockScene` → `Doc<"scenes">`
7. **ScenePreviewModal** - Update type `MockScene` → `Doc<"scenes">`
8. **SharedLinkCard** - Update type `MockSharedLink` → `Doc<"sharedLinks">` (already exists!)
9. **TemplatesList** - Create `convex/templates.ts` + migrate OR skip (not critical)
10. **TemplateCard** - Same as above OR skip

**Fast Track**: Skip templates if not critical for MVP

**Output**: All dashboard components on Convex ✅

---

### Phase 4: CLEANUP (1 hour)
**Goal**: Delete all mock files, final verification

1. **Delete mock files** (10 min)
   ```bash
   rm -rf lib/mock-data/
   ```

2. **Verify no imports** (5 min)
   ```bash
   grep -r "from.*mock-data" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules
   # Should return: 0 results
   ```

3. **Update types.ts** (10 min)
   - Replace `Mock*` types with `Doc<"tableName">`

4. **Audit services** (10 min)
   - Check `services/aiChat.ts` for mock fallbacks
   - Check `services/videoGeneration.ts` for mock URLs

5. **Final verification** (25 min)
   ```bash
   npx tsc --noEmit           # 0 errors
   npx @biomejs/biome check   # CLEAN
   npx convex dev --once      # Deploy
   pnpm test                  # All tests pass
   ```

6. **Manual smoke test** (10 min)
   - Create project
   - Navigate through all steps
   - Check dashboard tabs
   - Verify data persists across refresh

**Output**: Production-ready codebase ✅

---

## Verification Checklist

### Pre-Migration
- [ ] Backup current database state
- [ ] Document all localStorage keys in use
- [ ] List all components using mock data
- [ ] Identify all Convex functions needed

### During Migration (Per Component)
- [ ] Create/verify Convex functions exist
- [ ] Update component imports (mock → Convex)
- [ ] Update TypeScript types (Mock* → Doc<"">)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test data flow (create, read, update, delete)
- [ ] Test real-time updates
- [ ] Verify cross-device sync
- [ ] Run TypeScript check
- [ ] Run Biome check
- [ ] Deploy to Convex dev
- [ ] Manual QA

### Post-Migration
- [ ] Delete mock data files
- [ ] Remove localStorage persistence (except UI prefs)
- [ ] Full integration test suite passes
- [ ] Load testing with realistic data
- [ ] Staging deployment successful
- [ ] Production deployment plan ready

---

## Risk Assessment

### High Risk 🔴
1. **Data Loss**: Migrating from localStorage to Convex could lose user data
   - **Mitigation**: Write migration script to export localStorage → Convex
   - **Mitigation**: Warn users before migration

2. **Billing Errors**: Wrong credit deduction could cause financial issues
   - **Mitigation**: Extensive testing of creditBalances logic
   - **Mitigation**: Add audit trail for all credit changes
   - **Mitigation**: Manual verification of first 100 transactions

3. **Performance**: Convex queries could be slower than localStorage
   - **Mitigation**: Use Convex optimistic updates
   - **Mitigation**: Implement proper loading states
   - **Mitigation**: Cache frequently accessed data

### Medium Risk 🟡
1. **Breaking Changes**: Component updates could break existing features
   - **Mitigation**: Comprehensive integration tests
   - **Mitigation**: Gradual rollout (feature flags?)

2. **Type Inconsistencies**: Mock types vs Convex types mismatch
   - **Mitigation**: TypeScript strict mode
   - **Mitigation**: Update all types before component migration

### Low Risk 🟢
1. **Template System**: Not critical for MVP
   - **Mitigation**: Migrate last, can be deferred

---

## Success Metrics (6-HOUR SPRINT)

### Technical Metrics
- **Mock Data Usage**: 36 files → 0 files ✅
- **localStorage Keys**: 10+ → 0 (UI prefs moved to user preferences table)
- **Convex Functions**: 6 files → 10 files (subscriptions, creditBalances, usageTracking, audioTracks)
- **TypeScript Errors**: 0 (maintained) ✅
- **Biome**: CLEAN (maintained) ✅
- **Convex Deploy**: Successful ✅

### Product Metrics
- **Data Consistency**: Cross-device sync working 100%
- **Real-time Updates**: Dashboard updates via Convex reactivity
- **Billing Accuracy**: Credit tracking in Convex (audit trail)
- **User Experience**: Zero localStorage bugs
- **Performance**: Convex queries < 100ms

### Completion Checklist
- [ ] Phase 1: Stores fixed (30 min)
- [ ] Phase 2: Billing Convex functions created (1 hour)
- [ ] Phase 3: Components migrated (2 hours)
- [ ] Phase 4: Mock files deleted (1 hour)
- [ ] `grep -r "mock-data"` returns 0 results
- [ ] `npx tsc --noEmit` = 0 errors
- [ ] `npx convex dev --once` succeeds
- [ ] Manual smoke test passes

**Total Time**: 6 hours max → PRODUCTION READY 🚀

---

## Timeline Estimate (REALISTIC - SOLO DEV)

| Phase | Duration | Effort | Priority |
|-------|----------|--------|----------|
| Phase 1: Critical Stores | 1 hour | Fix scene/video stores | 🔴 NOW |
| Phase 2: Billing (High Value) | 2 hours | Subscriptions + Credits | 🔴 NOW |
| Phase 3: Dashboard Components | 2 hours | Migrate 10 components | 🟡 TODAY |
| Phase 4: Cleanup | 1 hour | Delete mocks, verify | 🟢 TODAY |
| **TOTAL** | **6 hours** | **Same day sprint** | **FOCUS** |

**Team Size**: 1 solo developer  
**Start Date**: NOW  
**Target Completion**: TODAY (6 hours max)

---

## Notes

- **NO SHORTCUTS**: Every mock must be replaced with Convex, no exceptions
- **DATA FIRST**: Convex functions before component migration
- **TEST EVERYTHING**: Integration tests for every migrated component
- **PRODUCTION READY**: Zero mock data, zero localStorage persistence (except UI)
- **This is a dedicated sprint**: Treat as Sprint 10 - "Production Readiness Sprint"

---

## Next Steps (IMMEDIATE - SOLO DEV)

**RIGHT NOW**:
1. ✅ Review this analysis (DONE)
2. 🔴 Start Phase 1: Fix stores (30 min)
3. 🔴 Start Phase 2: Create billing Convex functions (1 hour)
4. 🟡 Start Phase 3: Migrate dashboard components (2 hours)
5. 🟢 Phase 4: Delete mock files, final verification (1 hour)

**TOTAL TIME**: 6 hours to production-ready code

**Focus Mode**: No meetings, no distractions, pure coding sprint

**Once this is done TODAY, the app will be truly production-ready!** 🚀

