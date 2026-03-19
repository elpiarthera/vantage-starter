# 🔧 Sprint 30d: Wire It Up + Sprint 30d.5: Model Architecture + Sprint 30e: Make It Beautiful + Sprint 30f: Inspiration Wall

**Date**: February 15, 2026  
**Status**: 🟢 Sprint 30d COMPLETE | 🟢 Sprint 30d.5 COMPLETE | 🟢 Sprint 30e COMPLETE | 🟡 Sprint 30f READY TO START  
**Estimated Time**: ~30.5 hours total (30d: 5.5h ✅, 30d.5: 5.5h ✅, 30e: 13.5h ✅, 30f: 6h)  
**Goal**: Fix critical bugs from Sprint 30c, **implement modular model architecture**, transform UI to match LTX/Artlist competitors, add inspiration wall.  
**Dependencies**: Sprint 30c (Canvas-First UI) ✅  
**Analysis**: [SPRINT-30C-POST-IMPLEMENTATION-BUGS-ANALYSIS.md](../../Analysis/SPRINT-30C-POST-IMPLEMENTATION-BUGS-ANALYSIS.md) · [UI-UX-REDESIGN-PROPOSAL.md](../../Analysis/image-generator/UI-UX-REDESIGN-PROPOSAL.md) · **[IMAGE-MODELS-ANALYSIS.md](../../Analysis/image-generator/IMAGE-MODELS-ANALYSIS.md)** (v3.5)  
**QA Strategy**: **2-Step QA** — (1) TypeScript `npx tsc --noEmit`, (2) Biome `npx biome check --write <files>` for every task. i18n tasks add (3) `pnpm translate` + (4) `pnpm i18n:verify`. Convex tasks add `npx convex dev --once`.

---

## 🚨 CRITICAL ARCHITECTURAL GAP (Sprint 30d.5)

**Problem Identified**: The original Sprint 30 goal was **"model-agnostic, enabling support for 500+ models via schema configuration"** with **"zero-code model onboarding"**. This was **NOT implemented**:

| Issue | Previous State | Current State (FIXED) |
| :--- | :--- | :--- |
| **Model schemas** | Hardcoded in `modelSchemas.ts` | ✅ Stored in Convex `imageModelSchemas` table |
| **Credit costs** | Only 2 entries (`image_generation`, `image_edit`) | ✅ 8 entries (one per model) |
| **Parameter filtering** | None — invalid params sent to FAL | ✅ Backend filters params based on schema |
| **Model config** | Hardcoded in `falModels.ts` | ✅ Stored in Convex, admin-manageable |

**Impact (RESOLVED)**: 
- ✅ Grok models work: unique `image_generation_grok_t2i` / `image_edit_grok` credit types
- ✅ Nano Banana models work: unique `image_generation_nano_banana` / `image_edit_nano_banana` credit types
- ✅ Kling models have unique credit types: `image_generation_kling_v3`, `image_edit_kling_v3`, `image_generation_kling_o3`, `image_edit_kling_o3`
- ✅ Backend filters params via `allowedParams` and `conditionalParams`
- ✅ Adding new models requires **only Convex data** (zero code changes)

**Sprint 30d.5 COMPLETE** — Sprint 30e/30f now unblocked.

---

## 🎨 DESIGN SYSTEM & MOBILE-FIRST ALIGNMENT (MANDATORY)

### Visual Strategy ("Premium Studio" + LTX/Artlist Patterns)
- **Glassmorphism**: `backdrop-blur-md bg-background/60 border border-border/50 shadow-lg rounded-xl`
- **Glass Inner Fields**: `bg-transparent border border-border/30 rounded-md` (not opaque `bg-card/50`)
- **Inline Pills**: Primary settings in prompt bar as compact pills (model, aspect, resolution, count)
- **Touch Targets**: All interactive elements **min-h-[44px]** with `active:scale-95 transition-smooth`

### Design Token Compliance
| Replace | With (Semantic Token) |
| :--- | :--- |
| `bg-white`, `bg-black` | `bg-background`, `bg-card` |
| `text-white`, `text-gray-*` | `text-foreground`, `text-muted-foreground` |
| `border-gray-*` | `border-border`, `border-border/50` |
| `bg-card/50` (inner fields) | `bg-transparent`, `bg-background/30` |

### Mobile-First
- **Responsive Pills**: `flex-wrap gap-2 md:flex-nowrap` — wrap on mobile, single row on desktop
- **Mobile Overflow**: Collapse Resolution + Count into "More" button on mobile (`sm:hidden`)
- **320px Viewport**: All layouts must work at minimum 320px width
- **Card Flip Animation**: Max 300ms (`duration: 0.3, ease: "easeOut"`) — not default spring

---

## 📊 Bug Summary (from Sprint 30c Analysis)

| # | Bug | Severity | Root Cause | Status |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Buttons hidden behind prompt bar | 🔴 CRITICAL | Both at `bottom-6`, prompt bar `z-40` covers buttons `z-30` | ✅ Fixed (30d) |
| 2 | Model selection does nothing | 🔴 CRITICAL | `onSelectSchema` is a `// TODO` no-op | ✅ Fixed (30d) |
| 3 | Options panel has duplicate prompt | 🟡 HIGH | Schema includes `prompt` param → gets rendered | ✅ Fixed (30d) |
| 4 | Fullscreen viewer broken | 🟡 HIGH | `next/image` with `fill` inside container with no dimensions | ✅ Fixed (30d) |
| 5 | "Use as Input" doesn't work | 🔴 CRITICAL | Writes to legacy `image1` state, not `editRefs` | ✅ Fixed (30d) |
| 6 | Options panel inner styling | 🟢 MEDIUM | Inner fields are plain, not glass | ✅ Fixed (30e) |
| 7 | Legacy state conflicts | 🟡 HIGH | Old `model`, `resolution` state never updated by schema | ✅ Fixed (30d) |
| 8 | Model name truncation | 🟢 LOW | Long name clips on mobile | ✅ Fixed (30e) |
| **9** | **Hardcoded badge styling** | **🔴 CRITICAL** | **Badge colors hardcoded in components** | **✅ Fixed (Feb 18, 2026)** |

---

## 🔧 Bug #9: Hardcoded Badge Styling (Feb 18, 2026) ✅ FIXED

**Severity**: 🔴 CRITICAL (Architectural)

**Problem**: Badge styling hardcoded in both `image-generator/ModelCard.tsx` and `voice-generator/VoiceModelCard.tsx`:
```tsx
badge === "PRO" && "bg-primary/20 text-primary",
badge === "FAST" && "bg-green-500/20 text-green-600 dark:text-green-400",
```

**Root Cause**: Violated Sprint 30d.5 "zero-code model onboarding". Badge text was in Convex, but styling required code changes for each new badge type.

**Solution**:
- Created `components/ui/badge-variants.ts` with CVA utility (9 variants)
- Both generators now use: `badgeVariants({ variant: getBadgeVariant(badge) })`
- Badge text from Convex → Styling from centralized utility

**Result**: ✅ Adding new badge types requires zero code changes (auto-falls back to "primary" variant).

---

## 📌 Feature: Image Generator — Save to Project (Mirror Voice Generator Phase 7)

**Status**: ✅ Implemented (2026-02-19)  
**Reference**: Voice Generator Phase 7 (Changelog 2026-02-19): project selection workflow, name + project/library, save to `audioTracks`, display in Project Details → Audio tab.  
**Principle**: Do not recreate the wheel — reuse the same **ProjectSelector** modal and the same **projects.list** (with thumbnails) and backend patterns, adapted for images.

**Implementation summary**: IG-SP.0 (schema + index) ✅; IG-SP.1 (`saveToProject` mutation + `getProjectImages` query) ✅; IG-SP.2 (ImageCombiner “Save to project” + ProjectSelector, `showSaveModal` state) ✅; IG-SP.3 (ProjectTabs Images tab + ImagesTab grid) ✅; IG-SP.4 (i18n `image_generator.project_selector` + `translationNamespace` on ProjectSelector) ✅. Files: `convex/schema.ts`, `convex/imageToolHistory.ts`, `components/image-generator/index.tsx`, `components/image-generator/output-section.tsx`, `components/voice-generator/ProjectSelector.tsx`, `components/dashboard/projects/ProjectTabs.tsx`, `components/dashboard/projects/tabs/ImagesTab.tsx`, `messages/en.json`.

### Deep analysis

| Aspect | Voice Generator (done) | Image Generator (to do) |
|--------|------------------------|--------------------------|
| **Modal** | `ProjectSelector` (name + project or library) | Reuse **same** `ProjectSelector` |
| **Backend store** | `audioTracks` (optional `projectId`, `organizationId`, `title`) | `imageToolHistory`: add optional `projectId`, `organizationId`, `title` |
| **Save flow** | Recording: `processRecordedVoice` → `audioTracks.insert`. Generation: `startGenericVoiceGeneration` (with title/projectId) → action → `audioTracks.insert` | Generation already writes to `imageToolHistory` (no project). **Save to project** = update existing entry with project linkage (no re-generation, no double credits) |
| **Entry identity** | Voice: mutation/action returns or client has last generation context | Image: `selectedGeneration.id` is Convex `imageToolHistory._id` (from `useConvexImageHistory` → `mapEntryToGeneration` with `id: entry._id.toString()`) |
| **Project list** | `api.projects.list` (with `thumbnailUrl` from scene 1) | Same query — no change |
| **Display in project** | Audio tab → `getProjectNarrations` | New query `getProjectImages(projectId)`; show in **Images** tab (or section in Assets tab) |

**Differences from voice**  
- Voice generation “Save” can re-run generation with `title`/`projectId` (mutation passes them to the action). For images we **update** the existing history entry after the fact (simpler, no extra credits).  
- So: one new **mutation** `imageToolHistory.saveToProject` (or `updateProjectLink`) that takes `entryId`, `title`, `projectId | null`, and sets `organizationId` from project when project is selected.

**Reuse**  
- **ProjectSelector**: Use as-is from `@/components/voice-generator/ProjectSelector`. Same props: `open`, `onOpenChange`, `onConfirm(title, projectId)`. Optional: extract to `@/components/shared/ProjectSelector` later to avoid voice→image dependency.  
- **projects.list**: Already used by ProjectSelector; no change.  
- **i18n**: ProjectSelector uses `voice_generator.project_selector`; either reuse (same strings) or add `image_generator.project_selector` that mirrors keys (title, description, name_label, name_placeholder, name_required, save_to_library, save_to_project, etc.).

### Tasks to add

**Task IG-SP.0 — Schema: imageToolHistory project linkage (≈15 min)**  
- **Objective**: Allow image history entries to be linked to a project or saved to library (title only).  
- **Files**: `convex/schema.ts`  
- **Implementation**:  
  - Add optional fields to `imageToolHistory`: `projectId: v.optional(v.id("projects"))`, `organizationId: v.optional(v.string())`, `title: v.optional(v.string())`.  
  - Add index: `.index("by_project", ["projectId"])`. Documents with `projectId` set are indexed; querying by project returns only that project’s entries.  
- **2-Step QA**:  
  - `npx tsc --noEmit`  
  - `npx biome check --write convex/schema.ts`  
  - `npx convex dev --once`

**Task IG-SP.1 — Backend: saveToProject mutation + getProjectImages query (≈45 min)**  
- **Objective**: Persist project choice for an existing image history entry; list project images for Project Details.  
- **Files**: `convex/imageToolHistory.ts`  
- **Implementation (Convex-master alignment):**  
  - **Mutation** `saveToProject` (public mutation): Args `entryId` (`Id<"imageToolHistory">`), `title`, `projectId` (optional, null = save to library). Auth: `ctx.auth.getUserIdentity()`; throw if missing. Load entry by `entryId`; throw if not found. Entry ownership: `entry.userId === identity.subject` (imageToolHistory.userId is Clerk ID, same as voice). If `projectId` provided: load project; get user via `ctx.db.query("users").withIndex("by_clerk_user_id", q => q.eq("clerkUserId", identity.subject)).unique()`; verify `project.userId === user._id` (throw if not owner). Set `organizationId = project.organizationId ?? undefined`. If `projectId` is null (save to library): set `projectId` and `organizationId` to `undefined` in patch. Use `ctx.db.patch("imageToolHistory", entryId, { title, projectId, organizationId })` (two-arg patch).  
  - **Query** `getProjectImages`: Args `projectId`. Auth: identity → user by `by_clerk_user_id` → load project → require `project.userId === user._id`; throw if not found or unauthorized (same pattern as getProjectNarrations). Query: `ctx.db.query("imageToolHistory").withIndex("by_project", q => q.eq("projectId", args.projectId)).collect()`. Return list (documents include `imageUrl` / `imageUrls`).  
- **2-Step QA**:  
  - `npx tsc --noEmit`  
  - `npx biome check --write convex/imageToolHistory.ts`  
  - `npx convex dev --once`

**Task IG-SP.2 — Image generator UI: “Save to project” + ProjectSelector (≈45 min)**  
- **Objective**: After a generation is shown, user can click “Save to project”, open the same ProjectSelector, and on confirm update the entry.  
- **Files**: `components/image-generator/index.tsx` (ImageCombiner), optionally `components/image-generator/output-section.tsx` if the button lives there.  
- **Implementation**:  
  - Add state: `showSaveModal`, set to true when user clicks “Save to project”.  
  - “Save to project” visible only when the selected result is from **Convex** history (i.e. `selectedGeneration` is in the Convex-backed list so `selectedGeneration.id` is the imageToolHistory `_id`), and user is signed in.  
  - Render `ProjectSelector` (import from `@/components/voice-generator/ProjectSelector`) with `open={showSaveModal}`, `onOpenChange`, `onConfirm={handleSaveToProject}`.  
  - `handleSaveToProject(title, projectId)`: call `imageToolHistory.saveToProject` with `entryId: selectedGeneration.id`, `title`, `projectId`; toast success; close modal.  
- **2-Step QA**:  
  - `npx tsc --noEmit`  
  - `npx biome check --write components/image-generator/index.tsx components/image-generator/output-section.tsx` (and any other modified files)

**Task IG-SP.3 — Project Details: show saved images (≈30 min)**  
- **Objective**: In Project Details, show images saved from Image Generator to this project (mirror Audio tab + getProjectNarrations).  
- **Files**: `components/dashboard/projects/ProjectTabs.tsx`, new `components/dashboard/projects/tabs/ImagesTab.tsx` (or extend `AssetsTab.tsx` with a “From Image Generator” section).  
- **Implementation**:  
  - Add an “Images” tab (or agreed placement).  
  - In that tab/section, call `api.imageToolHistory.getProjectImages` with `projectId`.  
  - Render list/grid of saved images (thumbnail, title, prompt, link to open).  
- **2-Step QA**:  
  - `npx tsc --noEmit`  
  - `npx biome check --write components/dashboard/projects/ProjectTabs.tsx components/dashboard/projects/tabs/ImagesTab.tsx`

**Task IG-SP.4 — i18n for image “Save to project” (≈15 min)**  
- **Objective**: All user-facing strings for “Save to project” and modal in image generator localized.  
- **Files**: `messages/en.json` (and other locale files), `components/voice-generator/ProjectSelector.tsx` (optional prop).  
- **i18n approach (Hybrid, per i18n-master):** Do **not** reuse `voice_generator.project_selector` for the modal when opened from image generator (copy is audio-specific: “Save Audio to Project”, “Audio Name”). Add **`image_generator.project_selector`** with the **same keys** as `voice_generator.project_selector` but image-specific copy (e.g. `title`: "Save Image to Project", `name_label`: "Image Name", `confirm`: "Save Image", `save_to_library_hint`: "Available across all projects", `no_projects_hint`: "Create a project first to link image"). Refactor **ProjectSelector** to accept optional **`translationNamespace`** prop (default `"voice_generator.project_selector"`); image generator passes `translationNamespace="image_generator.project_selector"`. Add **`image_generator.save_to_project`** = "Save to project" for the button that opens the modal.  
- **2-Step QA**:  
  - `npx tsc --noEmit`  
  - `npx biome check --write messages/en.json components/voice-generator/ProjectSelector.tsx`  
  - `pnpm translate`  
  - `node scripts/verify-translations.js`

### Summary

| Task | Description | Est. | Status |
|------|-------------|------|--------|
| IG-SP.0 | Schema: imageToolHistory + projectId, organizationId, title, index | 15 min | ✅ Done |
| IG-SP.1 | imageToolHistory.saveToProject mutation + getProjectImages query | 45 min | ✅ Done |
| IG-SP.2 | ImageCombiner: “Save to project” button + ProjectSelector integration | 45 min | ✅ Done |
| IG-SP.3 | Project Details: Images tab (or section) + getProjectImages | 30 min | ✅ Done |
| IG-SP.4 | i18n for image save flow | 15 min | ✅ Done |
| **Total** | | **~2.5 h** | |

### Success criteria

- User can open Image Generator, generate an image, click “Save to project”, choose name + project or library, and the same ProjectSelector modal completes and updates the history entry.  
- Project Details shows saved Image Generator images (Images tab or Assets section).  
- No duplication of ProjectSelector or projects.list logic; same modal and backend patterns as voice.

### Design system review (design-master)

**Verdict: Needs small tweaks.**

- **Reuse of ProjectSelector**: Correct — no new modal design. Existing ProjectSelector already uses `min-h-[44px]` on Input and footer Buttons, `glass-panel`, and semantic tokens. One existing violation: thumbnail placeholder uses `bg-slate-600` (should be `bg-muted` or `bg-secondary`); fix in a separate pass or when touching this file.
- **"Save to project" button (IG-SP.2)**: Must use **min-h-[44px]** (and min-w-[44px] if icon-only on small screens) and sit in the same action row as Use as Input, Copy, Download, Use in Video in `output-section.tsx`. Use the existing `buttonClassName` pattern there (`min-h-[44px] min-w-[44px] ... active:scale-95 transition-smooth`). Optionally use `variant="default"` for this button only so it reads as the primary save action (mirroring voice generator’s primary save flow).
- **Images tab (IG-SP.3)**: Mirror AudioTab structure (query → list/grid → EmptyState). Use **semantic tokens only**: `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`. Do not copy AudioTab’s hardcoded hex colors (`#0d7ff2`, `#223649`, `text-gray-300`); treat Images tab as the chance to apply design tokens for new UI.
- **i18n (IG-SP.4)**: If ProjectSelector is reused as-is, the modal will show "Save Audio to Project" and "Save Audio" when opened from the image generator. To avoid that, either: (1) add `image_generator.project_selector` with mirrored keys (title "Save Image to Project", confirm "Save Image", etc.) and extend ProjectSelector with an optional `translationNamespace` prop (e.g. `"voice_generator.project_selector"` | `"image_generator.project_selector"`), or (2) duplicate the modal for image generator with image-specific copy. Recommend (1) for a single component and consistent UX.
- **Accessibility**: New "Save to project" button must have a visible label and/or `aria-label`/`title`. Modal focus is already handled by Dialog in ProjectSelector.

**Explicit design note to add to implementation:**

- **Save to project button**: Same style as existing output-section action buttons: use `output-section`’s `buttonClassName` (or equivalent) with `min-h-[44px]` and `min-w-[44px]`, `variant="outline"` or `variant="default"` for primary emphasis, and `active:scale-95 transition-smooth`. Place in the same desktop hover bar and mobile button row as Copy, Download, Use in Video, Use as Input.

### Agent reviews summary (design, i18n, convex, senior-dev)

| Agent | Verdict | Notes |
|-------|--------|--------|
| **design-master** | Needs small tweaks | Button min-h-[44px], same row as other actions; Images tab semantic tokens only; ProjectSelector needs namespace prop for image copy; a11y label on button. |
| **i18n-master** | Hybrid | Do not reuse voice_generator.project_selector in image flow (audio-specific copy). Add image_generator.project_selector (same keys, image copy) + optional `translationNamespace` on ProjectSelector; add image_generator.save_to_project for button. |
| **convex-master** | Needs tweaks | Schema: projectId as v.optional(v.id("projects")), index by_project. saveToProject: project ownership via users table (by_clerk_user_id → project.userId === user._id); ctx.db.patch; organizationId from project.organizationId. getProjectImages: same auth pattern, .withIndex("by_project", q => q.eq("projectId", args.projectId)). |
| **senior-dev-reviewer** | Ready for implementation | All tasks have 2-Step QA (npx); IG-SP.1 clarified entryId, null = library, project ownership; IG-SP.2 clarified Convex-backed selection only; IG-SP.4 uses node scripts/verify-translations.js. No over-engineering. |

Plan updated with all agent feedback above. Reuse voice-generator ProjectSelector and backend patterns; no new modal or project list.

---

## ⚡ Sprint 30d: "Wire It Up" (5.5 hours) — ✅ COMPLETE (Historical)

**Goal**: Fix all 5 critical bugs so the current UI is functional.

> ⚠️ **NOTE**: Sprint 30d was completed using hardcoded `modelSchemas.ts`. Sprint 30d.5 will **replace** this with Convex-based schemas. The code snippets below show what was implemented; they will be updated in Sprint 30d.5.3 to use Convex queries instead.

---

### Task 30d.1: Model Selection State Wiring (1h) ✅

**Objective**: Make model selection in the ModelSelector modal actually change the active model.

**What was implemented** (using hardcoded schemas — will be replaced in 30d.5.3):
- Added `selectedT2ISchemaId` and `selectedI2ISchemaId` state
- Wired `onSelectSchema` callback to update state + reset params
- Used `getModelSchemaById()` from hardcoded `modelSchemas.ts`

**What Sprint 30d.5.3 will change**:
- Replace `getModelSchemaById()` with Convex query `api.imageModels.getBySchemaId`
- Replace `getDefaultT2ISchema()` / `getDefaultI2ISchema()` with first item from Convex query
- Schemas come from `imageModelSchemas` Convex table, not hardcoded file

**Final implementation (after 30d.5.3)**:
```tsx
// Fetch schemas from Convex
const t2iSchemas = useQuery(api.imageModels.listT2ISchemas);
const i2iSchemas = useQuery(api.imageModels.listI2ISchemas);

// Loading state
if (!t2iSchemas || !i2iSchemas) return <ImageGeneratorSkeleton />;

// Get schemas for current mode
const schemas = mode === "edit" ? i2iSchemas : t2iSchemas;

// Selected schema from Convex data
const selectedSchema = useMemo(() => {
  const id = mode === "edit" ? selectedI2ISchemaId : selectedT2ISchemaId;
  return schemas.find((s) => s.schemaId === id) ?? schemas[0];
}, [mode, selectedT2ISchemaId, selectedI2ISchemaId, schemas]);

// onSelectSchema uses schemaId (not id)
  onSelectSchema={(schema) => {
  if (schema.type === "i2i") {
    setSelectedI2ISchemaId(schema.schemaId);
      setMode("edit");
    } else {
    setSelectedT2ISchemaId(schema.schemaId);
      setMode("generate");
    }
  // Reset params from schema.params defaults
  const defaultParams: Record<string, unknown> = {};
  for (const p of schema.params) {
    if (!p.refType && p.default !== undefined) {
      defaultParams[p.key] = p.default;
    }
  }
  setParams(defaultParams);
}}
```

**Agent Reviews** (run after QA):
- [x] **design-master**: Verified no hardcoded colors introduced
- [x] **mobile-first-guardian**: Verified model selector works on mobile

---

### Task 30d.2: Fix Action Buttons Z-Order (30min) ✅

**Objective**: Make action buttons (Use as Input, Copy, Download) clickable — not hidden behind prompt bar.

**What was implemented**: Changed `bottom-6` to `bottom-24` in `output-section.tsx`.

**No changes needed in 30d.5** — this is pure CSS, not related to model architecture.

---

### Task 30d.3: Fix "Use as Input" → Edit Mode Flow (1h) ✅

**Objective**: Clicking "Use as Input" should add the image to `editRefs` and switch to Edit mode.

**What was implemented**: Created `handleLoadAsInput` callback that adds image to `editRefs` and switches mode.

**No changes needed in 30d.5** — this is state management, not related to model architecture.

---

### Task 30d.4: Fix Fullscreen Viewer (30min) ✅

**Objective**: Fix broken fullscreen image viewer.

**What was implemented**: Replaced `next/image` with `fill` with standard `<img>` tag.

**No changes needed in 30d.5** — this is pure UI, not related to model architecture.

---

### Task 30d.5: Remove Duplicate Prompt from Options Panel (15min) ✅

**Objective**: Filter out `prompt` param from OptionsPanel since FloatingPromptBar handles it.

**What was implemented**: Added `p.key !== "prompt"` filter to `mainParams` and `advancedParams`.

**No changes needed in 30d.5** — the filter logic works with any schema source (hardcoded or Convex).

---

### Task 30d.6: Remove Legacy State Variables (1h) ✅

**Objective**: Clean up dead code — legacy state variables that conflict with schema params.

**What was implemented**: Removed `model`, `resolution`, `resultType`, `numImages`, `seriesAmount`, `negativePrompt` state variables.

**No changes needed in 30d.5** — these were already removed.

---

### Task 30d.7: Visual Polish Pass (1h) ✅

**Objective**: Apply glass styling to inner fields and fix model name truncation.

**What was implemented**: Glass styling and model name truncation.

**Minor update in 30d.5.3**: The truncation uses `selectedSchema.name.split(" — ")[0]` — this works with Convex schemas since they have the same `name` field format.

---

### ✅ Sprint 30d Final QA

```bash
# 1. Full TypeScript check
npx tsc --noEmit  ✅ PASSED (0 errors)

# 2. Full Biome check
npx biome check --write components/image-generator/  ✅ PASSED (30 files, no fixes needed)

# 3. Verify i18n (if keys added)
pnpm i18n:verify  ✅ PASSED (1692 keys × 7 locales)
```

### Sprint 30d Success Criteria

- ✅ Selecting a model in the modal **changes** the displayed model and options
- ✅ Generation uses the **selected model** (verified params and selectedSchema.modelId in onStartT2I)
- ✅ Options panel shows model-specific fields **without prompt field**
- ✅ Action buttons are **clickable** (not hidden behind prompt bar)
- ✅ Clicking "Use as Input" **switches to Edit mode** and shows image in RefsPanel
- ✅ Clicking generated image opens **working** fullscreen viewer
- ✅ No legacy state variables remain (`model`, `resolution`, etc. removed)
- ✅ Glass styling applied to all inner form fields
- ✅ Model name truncates properly on mobile

**Sprint 30d Status:** ✅ **COMPLETE** (7/7 tasks, 4h actual / 5.5h estimated)

> ⚠️ **Sprint 30d.5 Impact**: Task 30d.1 (Model Selection State Wiring) will be **updated** in Sprint 30d.5.3 to use Convex queries instead of hardcoded `modelSchemas.ts`. All other tasks (30d.2–30d.7) require no changes.

---

## 🔧 Sprint 30d.5: "Model Architecture" (5 hours) — BLOCKING

**Goal**: Implement the **pure modular model architecture** from IMAGE-MODELS-ANALYSIS.md:
1. **Everything in Convex** — model schemas, credit costs, allowed params, conditional params, max prompt length
2. **Zero code changes to add a new model** — admin adds data in Convex, done
3. **Delete all hardcoded configs** — `modelSchemas.ts` and `falModels.ts` are removed after seeding
4. All 8 models work (Kling v3/O3, Grok, Nano Banana — T2I and I2I)

**Why BLOCKING**: Without this, Grok and Nano Banana models fail with `Unknown or inactive action type` errors. The current implementation only supports Kling models.

---

### 🎯 Dynamic UI Flow (How It Works After Sprint 30d.5)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONVEX DATABASE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  imageModelSchemas table                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ schemaId: "kling-v3-t2i"                                            │    │
│  │ name: "Kling v3 — Text-to-Image"                                    │    │
│  │ modelId: "fal-ai/kling-image/v3/text-to-image"                      │    │
│  │ type: "t2i"                                                         │    │
│  │ creditActionType: "image_generation"                                │    │
│  │ capabilities: {                                                     │    │
│  │   negativePrompt: true,                                             │    │
│  │   maxResolution: "2K",                                              │    │
│  │   elements: true,                                                   │    │
│  │   multiImage: false,        ← Single image input only               │    │
│  │   aspectAuto: false,                                                │    │
│  │ }                                                                   │    │
│  │ params: [                                                           │    │
│  │   { key: "prompt", control: "text", maxLength: 2500, ... },         │    │
│  │   { key: "aspect_ratio", control: "icon-select", options: [...] },  │    │
│  │   { key: "resolution", control: "segmented", options: [...] },      │    │
│  │   { key: "image_url", refType: "single", ... },  ← Single ref slot  │    │
│  │   ...                                                               │    │
│  │ ]                                                                   │    │
│  │ allowedParams: ["prompt", "aspect_ratio", "resolution", ...]        │    │
│  │ maxPromptLength: 2500                                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ schemaId: "kling-o3-i2i"                                            │    │
│  │ name: "Kling O3 — Image-to-Image"                                   │    │
│  │ type: "i2i"                                                         │    │
│  │ capabilities: {                                                     │    │
│  │   multiImage: true,         ← Multiple image inputs (1-10)          │    │
│  │   aspectAuto: true,         ← "Auto" aspect ratio option            │    │
│  │   resultTypeSeries: true,   ← Series generation support             │    │
│  │ }                                                                   │    │
│  │ params: [                                                           │    │
│  │   { key: "image_urls", refType: "multi", ... }, ← Multi ref slots   │    │
│  │   ...                                                               │    │
│  │ ]                                                                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  (8 models total)                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. useQuery(api.imageModels.listT2ISchemas) → Get all T2I models           │
│  2. useQuery(api.imageModels.listI2ISchemas) → Get all I2I models           │
│  3. User selects model in ModelSelector                                      │
│  4. selectedSchema = schemas.find(s => s.schemaId === selectedSchemaId)     │
│                                                                              │
│  5. DYNAMIC UI BASED ON SCHEMA:                                              │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ DynamicField renders controls from selectedSchema.params:       │     │
│     │ - control: "text" → <Textarea>                                  │     │
│     │ - control: "icon-select" → <VisualSelect> with icons            │     │
│     │ - control: "segmented" → <SegmentedControl>                     │     │
│     │ - control: "number" → <NumberStepper>                           │     │
│     │ - control: "toggle" → <Switch>                                  │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ RefsPanel renders based on refType in params:                   │     │
│     │ - refType: "single" → 1 image slot (Kling v3 I2I, Grok Edit)    │     │
│     │ - refType: "multi"  → 1-10 image slots (Kling O3 I2I, Nano)     │     │
│     │ - refType: "elements" → Frontal + 0-3 refs (Kling elements)     │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ "Use as Input" button visibility:                               │     │
│     │ - Only shown if i2iSchemas.length > 0 (at least 1 I2I model)    │     │
│     │ - On click: switch to Edit mode, add image to editRefs          │     │
│     │ - RefsPanel adjusts slots based on selected I2I model's refType │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │ showWhen logic hides/shows params dynamically:                  │     │
│     │ - series_amount: only when result_type === "series"             │     │
│     │ - num_images: only when result_type === "single"                │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  6. User clicks Generate → sends { modelId, params } to backend             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. startGenericGeneration receives { modelId, params }                     │
│  2. Lookup creditActionType from imageModelSchemas → deduct credits         │
│  3. Schedule generateGeneric action                                         │
│  4. Action queries imageModelSchemas for modelId:                           │
│     - Get allowedParams → filter out invalid params                         │
│     - Get conditionalParams → remove params that don't apply                │
│     - Get maxPromptLength → truncate prompt                                 │
│  5. Call FAL API with filtered params                                       │
│  6. Save result to imageToolHistory                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 📸 Image Input Handling (refType)

| refType | Models | UI Behavior |
| :--- | :--- | :--- |
| `"single"` | Kling v3 I2I, Grok Edit | **1 image slot** — user uploads or selects 1 image |
| `"multi"` | Kling O3 I2I, Nano Banana Edit | **1-10 image slots** — user can add multiple images, referenced as @Image1, @Image2 in prompt |
| `"elements"` | All Kling models | **Frontal + 0-3 refs** — character/object consistency, referenced as @Element1, @Element2 |

### 🔘 "Use as Input" Button Logic

The "Use as Input" button should:
1. **Only appear** if there are I2I models available (`i2iSchemas.length > 0`)
2. **On click**: 
   - Switch to Edit mode
   - Add the generated image to `editRefs`
   - Auto-select an appropriate I2I model (first one, or matching model family if possible)
3. **RefsPanel** then renders the correct number of slots based on the selected I2I model's `refType`:
   - If `refType: "single"` → show 1 slot with the image
   - If `refType: "multi"` → show the image in slot 1, allow adding more

**Key Point**: The code is 100% generic. The only thing that changes between models is the **data in Convex**. To add a new model:
1. Add row to `imageModelSchemas` with full config (including `refType` in params)
2. Add row to `creditCosts` with pricing
3. Done — no code changes

---

### Architecture Principle

The backend reads **all model configuration from Convex**. The only code is generic — it reads the schema, filters params, calls FAL, saves results. No model-specific code anywhere.

---

### Task 30d.5.1: Create `imageModelSchemas` Convex Table + Seed All 8 Models (2h)

**Objective**: Create the Convex table that stores **everything** about each model — UI schema, backend config, credit action type. Then seed all 8 models from IMAGE-MODELS-ANALYSIS.md.

**Files to Create/Modify**:
| File | Action | Description |
| :--- | :--- | :--- |
| `convex/schema.ts` | Modify | Add `imageModelSchemas` table |
| `convex/imageModels.ts` | Create | Queries for model schemas |
| `convex/seed/seedImageModels.ts` | Create | Seed all 8 models with full config |

**Implementation**:

1. **Add `imageModelSchemas` table to schema** (`convex/schema.ts`):
   ```typescript
   imageModelSchemas: defineTable({
     // ─── Identifiers ───
     schemaId: v.string(),           // App ID: "kling-v3-t2i"
     name: v.string(),               // Display: "Kling v3 — Text-to-Image"
     nameTranslationKey: v.optional(v.string()), // i18n key for name
     
     // ─── FAL Config ───
     modelId: v.string(),            // FAL endpoint: "fal-ai/kling-image/v3/text-to-image"
     type: v.union(v.literal("t2i"), v.literal("i2i")),
     
     // ─── Credit System ───
     creditActionType: v.string(),   // Links to creditCosts table
     
     // ─── UI Capabilities (drives visibility) ───
     capabilities: v.object({
       negativePrompt: v.optional(v.boolean()),
       maxResolution: v.optional(v.string()),    // "2K" or "4K"
       elements: v.optional(v.boolean()),
       multiImage: v.optional(v.boolean()),
       aspectAuto: v.optional(v.boolean()),
       resultTypeSeries: v.optional(v.boolean()),
     }),
     
     // ─── UI Badges ───
     badges: v.optional(v.array(v.string())),    // ["PRO", "NEW", "FAST"]
     
     // ─── UI Parameters (dynamic form rendering) ───
     params: v.array(v.object({
       key: v.string(),
       control: v.string(),          // "text", "segmented", "icon-select", "number", "select", "toggle"
       label: v.string(),            // i18n key
       options: v.optional(v.array(v.object({
         value: v.string(),
         label: v.string(),          // i18n key
       }))),
       default: v.optional(v.any()),
       min: v.optional(v.number()),
       max: v.optional(v.number()),
       minLength: v.optional(v.number()),
       maxLength: v.optional(v.number()),
       advanced: v.optional(v.boolean()),
       refType: v.optional(v.string()),  // "single", "multi", "elements"
       showWhen: v.optional(v.object({
         param: v.string(),
         value: v.string(),
       })),
     })),
     
     // ─── Backend Config (parameter filtering for FAL API) ───
     allowedParams: v.array(v.string()),         // Params to send to FAL
     conditionalParams: v.optional(v.array(v.object({
       param: v.string(),
       showWhen: v.object({
         param: v.string(),
         value: v.string(),
       }),
     }))),                                        // Params with dependencies
     maxPromptLength: v.number(),                 // Kling: 2500, Grok: 8000, Nano: 50000
     
     // ─── Metadata ───
     sortOrder: v.number(),
     isActive: v.boolean(),
     createdAt: v.number(),
     updatedAt: v.number(),
   })
     .index("by_schema_id", ["schemaId"])
     .index("by_model_id", ["modelId"])
     .index("by_type_active", ["type", "isActive", "sortOrder"]),
   ```

2. **Create `convex/imageModels.ts`** with queries:
   ```typescript
   import { query } from "./_generated/server";
   import { v } from "convex/values";

   /** Get all active T2I schemas (for Generate mode), sorted by sortOrder. */
   export const listT2ISchemas = query({
     args: {},
     handler: async (ctx) => {
       return await ctx.db
         .query("imageModelSchemas")
         .withIndex("by_type_active", (q) => q.eq("type", "t2i").eq("isActive", true))
         .collect();
     },
   });

   /** Get all active I2I schemas (for Edit mode), sorted by sortOrder. */
   export const listI2ISchemas = query({
     args: {},
     handler: async (ctx) => {
       return await ctx.db
         .query("imageModelSchemas")
         .withIndex("by_type_active", (q) => q.eq("type", "i2i").eq("isActive", true))
         .collect();
     },
   });

   /** Get schema by schemaId (app ID like "kling-v3-t2i"). */
   export const getBySchemaId = query({
     args: { schemaId: v.string() },
     handler: async (ctx, args) => {
       return await ctx.db
         .query("imageModelSchemas")
         .withIndex("by_schema_id", (q) => q.eq("schemaId", args.schemaId))
         .first();
     },
   });

   /** Get schema by FAL modelId (endpoint like "fal-ai/kling-image/v3/text-to-image"). */
   export const getByModelId = query({
     args: { modelId: v.string() },
     handler: async (ctx, args) => {
       return await ctx.db
         .query("imageModelSchemas")
         .withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
         .first();
     },
   });
   ```

3. **Create seed script** `convex/seed/seedImageModels.ts` with **all 8 models** from IMAGE-MODELS-ANALYSIS.md:
   - Kling v3 T2I, Kling v3 I2I
   - Kling O3 T2I, Kling O3 I2I
   - Grok T2I, Grok I2I
   - Nano Banana Pro T2I, Nano Banana Pro I2I
   
   Each model includes: `schemaId`, `name`, `modelId`, `type`, `creditActionType`, `capabilities`, `badges`, `params` (full UI schema), `allowedParams`, `conditionalParams`, `maxPromptLength`, `sortOrder`, `isActive`

4. **Seed credit costs in same script** — add missing `creditCosts` entries:
   - `image_generation_grok_t2i` (4 credits)
   - `image_edit_grok` (4 credits)
   - `image_generation_nano_banana` (15 credits)
   - `image_edit_nano_banana` (15 credits)

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/schema.ts convex/imageModels.ts convex/seed/seedImageModels.ts

# Step 3: Deploy schema
npx convex dev --once

# Step 4: Run seed (seeds both models AND credit costs)
npx convex run seed/seedImageModels:seedAll

# Step 5: Verify in Convex dashboard
# - imageModelSchemas: 8 entries
# - creditCosts: 6 image-related entries (2 existing + 4 new)
```

**Agent Reviews**:
- [ ] **convex-master**: Verify schema design, indexes, and seed script

---

### Task 30d.5.2: Update Backend to Use Convex Schemas (1h)

**Objective**: Rewrite `imageToolGeneric.ts` to read **all config from Convex** — no hardcoded `falModels.ts`.

**Files to Modify**:
| File | Action | Description |
| :--- | :--- | :--- |
| `convex/actions/imageToolGeneric.ts` | Rewrite | Read config from Convex, filter params |
| `convex/imageTool.ts` | Modify | Pass modelId, let action lookup schema |

**Implementation**:

1. **Rewrite `imageToolGeneric.ts`** to be fully dynamic:
   ```typescript
   export const generateGeneric = internalAction({
     args: {
       modelId: v.string(),
       params: v.any(),
       transactionId: v.id("creditTransactions"),
       clerkUserId: v.string(),
     },
     handler: async (ctx, args) => {
       // 1. Get model schema from Convex (NOT hardcoded config)
       const schema = await ctx.runQuery(api.imageModels.getByModelId, { modelId: args.modelId });
       if (!schema) {
         await ctx.runMutation(api.credits.refundCredits, {
           transactionId: args.transactionId,
           reason: `Unknown model: ${args.modelId}`,
         });
         throw new Error(`Unknown model: ${args.modelId}`);
       }
       
       // 2. Filter params based on schema.allowedParams
       const rawParams = args.params as Record<string, unknown>;
       const filteredParams: Record<string, unknown> = {};
       for (const key of schema.allowedParams) {
         if (key in rawParams && rawParams[key] !== undefined) {
           filteredParams[key] = rawParams[key];
         }
       }
       
       // 3. Apply conditional param filtering from schema.conditionalParams
       if (schema.conditionalParams) {
         for (const cond of schema.conditionalParams) {
           const conditionMet = filteredParams[cond.showWhen.param] === cond.showWhen.value;
           if (!conditionMet) {
             delete filteredParams[cond.param];
           }
         }
       }
       
       // 4. Sanitize prompt length from schema.maxPromptLength
       if (typeof filteredParams.prompt === "string") {
         filteredParams.prompt = filteredParams.prompt.slice(0, schema.maxPromptLength);
       }
       
       // 5. Call FAL API using schema.modelId as endpoint
       const url = `https://queue.fal.run/${schema.modelId}`;
       // ... rest of FAL queue logic (submit, poll, get result) ...
       
       // 6. Save to history using schema.type for mode
       const mode = schema.type === "t2i" ? "generate" : "edit";
       // ... save to imageToolHistory ...
     },
   });
   ```

2. **Update `imageTool.ts`** `startGenericGeneration` mutation:
   - Keep existing credit deduction logic
   - Remove `getFalModelConfig` import — schema lookup happens in action
   - The action now handles everything

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/actions/imageToolGeneric.ts convex/imageTool.ts

# Step 3: Deploy
npx convex dev --once
```

**Agent Reviews**:
- [ ] **convex-master**: Verify action correctly queries Convex
- [ ] **senior-dev-reviewer**: Verify no breaking changes

---

### Task 30d.5.3: Update Frontend to Use Convex Schemas (1.5h)

**Objective**: Replace all imports from `modelSchemas.ts` with Convex queries. Make UI fully dynamic based on model capabilities.

**Files to Modify**:
| File | Action | Description |
| :--- | :--- | :--- |
| `components/image-generator/index.tsx` | Modify | Use Convex queries, dynamic "Use as Input" |
| `components/image-generator/ModelSelector.tsx` | Modify | Receive schemas from props |
| `components/image-generator/RefsPanel.tsx` | Modify | Dynamic slots based on refType |
| `components/image-generator/output-section.tsx` | Modify | Conditional "Use as Input" button |
| `components/image-generator/OptionsPanel.tsx` | Verify | Already uses schema from props |
| `components/image-generator/DynamicField.tsx` | Verify | Already renders from schema |

**Implementation**:

1. **Update `index.tsx`** to fetch schemas from Convex:
```tsx
   import { useQuery } from "convex/react";
   import { api } from "@/convex/_generated/api";
   
   // Fetch schemas from Convex
   const t2iSchemas = useQuery(api.imageModels.listT2ISchemas);
   const i2iSchemas = useQuery(api.imageModels.listI2ISchemas);
   
   // Loading state while Convex loads
   if (!t2iSchemas || !i2iSchemas) {
     return <ImageGeneratorSkeleton />;
   }
   
   // Check if I2I models exist (for "Use as Input" button visibility)
   const hasI2IModels = i2iSchemas.length > 0;
   
   // Get current schemas based on mode
   const schemas = mode === "edit" ? i2iSchemas : t2iSchemas;
   
   // Selected schema from Convex data
   const selectedSchema = useMemo(() => {
     const id = mode === "edit" ? selectedI2ISchemaId : selectedT2ISchemaId;
     return schemas.find((s) => s.schemaId === id) ?? schemas[0];
   }, [mode, selectedT2ISchemaId, selectedI2ISchemaId, schemas]);
   
   // Get refType from selected schema's params (for RefsPanel)
   const refParam = selectedSchema?.params.find((p) => p.refType);
   const refType = refParam?.refType; // "single" | "multi" | "elements" | undefined
   const supportsMultiImage = selectedSchema?.capabilities?.multiImage === true;
   ```

2. **Update `output-section.tsx`** — "Use as Input" button only if I2I models exist:
   ```tsx
   interface OutputSectionProps {
     // ... existing props
     hasI2IModels: boolean;  // NEW: passed from parent
     onLoadAsInput: () => void;
   }
   
   // In the component:
   {hasI2IModels && (
     <Button onClick={onLoadAsInput} variant="secondary">
       <ImageIcon className="h-4 w-4 mr-2" />
       {t("use_as_input")}
     </Button>
   )}
   ```

3. **Update `RefsPanel.tsx`** — dynamic slots based on refType:
   ```tsx
   interface RefsPanelProps {
     refType: "single" | "multi" | "elements";
     refs: RefImage[];
     onAddRef: (url: string) => void;
     onRemoveRef: (id: string) => void;
     maxRefs?: number;  // From schema: multi = 10, elements = 3
   }
   
   // In the component:
   const maxSlots = refType === "single" ? 1 
     : refType === "elements" ? 4  // 1 frontal + 3 refs
     : maxRefs ?? 10;  // multi: default 10
   
   // Render slots dynamically
   {refs.map((ref, index) => (
     <RefSlot 
       key={ref.id} 
       ref={ref} 
       label={refType === "elements" 
         ? (index === 0 ? t("frontal_image") : t("reference_image", { n: index }))
         : t("image_n", { n: index + 1 })  // @Image1, @Image2, etc.
       }
       onRemove={() => onRemoveRef(ref.id)}
     />
   ))}
   
   // Add button only if under max
   {refs.length < maxSlots && (
     <AddRefButton onClick={handleAddRef} />
   )}
   ```

4. **Update `handleLoadAsInput`** in `index.tsx`:
   ```tsx
   const handleLoadAsInput = useCallback(() => {
  const gen = persistedGenerations.find((g) => g.id === selectedGenerationId);
     if (!gen?.imageUrl || !hasI2IModels) return;
     
     // Add to editRefs
     setEditRefs((prev) => [...prev, { id: crypto.randomUUID(), url: gen.imageUrl! }]);
     
     // Switch to Edit mode
  setMode("edit");
  
     // Auto-select first I2I model (or matching family if possible)
     if (i2iSchemas.length > 0) {
       // Try to find matching I2I model (e.g., if using Kling v3 T2I, select Kling v3 I2I)
       const currentFamily = selectedSchema?.schemaId.replace("-t2i", "");
       const matchingI2I = i2iSchemas.find((s) => s.schemaId.startsWith(currentFamily));
       setSelectedI2ISchemaId(matchingI2I?.schemaId ?? i2iSchemas[0].schemaId);
     }
     
  showToast(t("image_loaded_as_input"), "success");
   }, [selectedGenerationId, persistedGenerations, hasI2IModels, i2iSchemas, selectedSchema, showToast, t]);
   ```

5. **Update `ModelSelector`** to receive schemas from props (already dynamic — verify)

3. **Add loading skeleton** `ImageGeneratorSkeleton.tsx` for Convex loading state

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/index.tsx components/image-generator/ModelSelector.tsx
```

**Agent Reviews**:
- [ ] **convex-master**: Verify query usage patterns
- [ ] **mobile-first-guardian**: Verify loading states work on mobile

---

### Task 30d.5.4: Delete Hardcoded Files (30min)

**Objective**: Remove all hardcoded model configuration files. Everything is now in Convex.

**Files to Delete**:
| File | Reason |
| :--- | :--- |
| `components/image-generator/constants/modelSchemas.ts` | Replaced by `imageModelSchemas` Convex table |
| `convex/configs/falModels.ts` | Replaced by `imageModelSchemas` Convex table |

**Files to Update** (remove imports):
| File | Action |
| :--- | :--- |
| `components/image-generator/index.tsx` | Remove `modelSchemas.ts` imports |
| `components/image-generator/ModelSelector.tsx` | Remove `modelSchemas.ts` imports |
| `convex/actions/imageToolGeneric.ts` | Remove `falModels.ts` import |
| `convex/imageTool.ts` | Remove `falModels.ts` import |

**2-Step QA**:
```bash
# Step 1: Delete files
rm components/image-generator/constants/modelSchemas.ts
rm convex/configs/falModels.ts

# Step 2: TypeScript check (will fail if any imports remain)
npx tsc --noEmit

# Step 3: Fix any remaining imports

# Step 4: Biome lint + format
npx biome check --write .

# Step 5: Deploy
npx convex dev --once
```

---

### ✅ Sprint 30d.5 Final QA

```bash
# 1. Full TypeScript check
npx tsc --noEmit

# 2. Full Biome check
npx biome check --write .

# 3. Deploy all changes
npx convex dev --once

# 4. Verify Convex data
# - imageModelSchemas: 8 entries (all models)
# - creditCosts: 6 image-related entries

# 5. Test all 8 models in UI
# - Kling v3 T2I ✅
# - Kling v3 I2I ✅
# - Kling O3 T2I ✅
# - Kling O3 I2I ✅
# - Grok T2I ✅ (was failing)
# - Grok I2I ✅ (was failing)
# - Nano Banana Pro T2I ✅ (was failing)
# - Nano Banana Pro I2I ✅ (was failing)

# 6. Verify zero-code model addition
# - Add a test model in Convex dashboard
# - Verify it appears in UI without code changes
# - Delete test model
```

### Sprint 30d.5 Success Criteria

**Data & Backend**:
- [x] All 8 models generate images without errors
- [x] `imageModelSchemas` table has 8 entries with full config (UI + backend)
- [x] `creditCosts` table has 8 image-related entries (one per model)
- [x] Backend reads **all config from Convex** (no `falModels.ts`)
- [x] Backend filters params correctly (no more `series_amount` errors)

**Frontend — Dynamic UI**:
- [x] Frontend reads **all schemas from Convex** (no `modelSchemas.ts`)
- [x] UI controls render dynamically from `selectedSchema.params`
- [x] `showWhen` logic hides/shows params (e.g., `series_amount` only when `result_type=series`)
- [x] **"Use as Input" button** only appears if I2I models exist (`i2iSchemas.length > 0`)
- [x] **RefsPanel** renders correct number of slots based on `refType`:
  - `refType: "single"` → 1 slot (Kling v3 I2I, Grok Edit)
  - `refType: "multi"` → 1-10 slots (Kling O3 I2I, Nano Banana Edit)
  - `refType: "elements"` → 1 frontal + 0-3 refs (Kling elements)
- [x] Clicking "Use as Input" auto-selects matching I2I model family

**Cleanup**:
- [x] `modelSchemas.ts` and `falModels.ts` are **deleted**
- [x] Adding a new model requires **only Convex data** (zero code changes)

**Sprint 30d.5 Status:** ✅ **COMPLETE** (4/4 tasks) — Feb 15, 2026

---

## 🎨 Sprint 30e: "Make It Beautiful" (13.5 hours) — ✅ COMPLETE

**Goal**: Transform UI to match LTX/Artlist competitors with inline pills and unified command bar.

**Status**: ✅ **COMPLETE** (7/7 tasks) — Feb 15, 2026

---

### Task 30e.1: Inline Pills in Prompt Bar (4h) ✅

**Objective**: Move primary settings (model, aspect ratio, resolution, count) into the prompt bar as compact pills.

**Files to Create/Modify**:
| File | Action | Description |
| :--- | :--- | :--- |
| `components/image-generator/PromptPillBar.tsx` | Create | New component for inline pills |
| `components/image-generator/PillButton.tsx` | Create | Reusable pill button component |
| `components/image-generator/FloatingPromptBar.tsx` | Modify | Integrate PromptPillBar |
| `messages/en.json` | Modify | Add pill labels and tooltips |

**Implementation**:
1. **PillButton Component**:
   ```tsx
   const PillButton = ({ children, ...props }) => (
     <button
       className={cn(
         "min-h-[44px] px-3",
         "inline-flex items-center gap-1.5 rounded-lg",
         "bg-secondary/50 border border-border/50",
         "text-sm font-medium text-foreground",
         "transition-smooth hover:bg-muted/50 active:scale-95",
         "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
       )}
       {...props}
     >
       {children}
     </button>
   );
   ```

2. **PromptPillBar Component** (responsive):
   ```tsx
   <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-3 p-2 rounded-lg bg-background/40 backdrop-blur-sm border border-border/30">
     {/* Model Pill */}
     <PillButton onClick={openModelSelector}>
       <Sparkles className="h-4 w-4" />
       <span className="hidden sm:inline">{selectedSchema.name.split(" — ")[0]}</span>
       <span className="sm:hidden">v3</span>
       <ChevronDown className="h-3 w-3" />
     </PillButton>
     
     {/* Aspect Ratio Pill */}
     <PillButton>
       <AspectRatioIcon ratio={params.aspect_ratio} className="h-4 w-4" />
       <span className="hidden sm:inline">{params.aspect_ratio}</span>
     </PillButton>
     
     {/* Resolution + Count - hidden on mobile */}
     <div className="hidden sm:contents">
       <PillButton>{params.resolution}</PillButton>
       <PillButton>×{params.num_images}</PillButton>
     </div>
     
     {/* Mobile overflow menu */}
     <PillButton className="sm:hidden" aria-label={t("pills.more_options")}>
       <MoreHorizontal className="h-4 w-4" />
     </PillButton>
   </div>
   ```

**i18n Keys to Add** (`messages/en.json`):
```json
{
  "image_generator": {
    "pills": {
      "model": "Model",
      "aspect_ratio": "Aspect Ratio",
      "resolution": "Resolution",
      "count": "Count",
      "more_options": "More options",
      "tooltip_model": "Select AI model",
      "tooltip_aspect": "Choose image dimensions"
    }
  }
}
```

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/PromptPillBar.tsx components/image-generator/PillButton.tsx components/image-generator/FloatingPromptBar.tsx

# Step 3: Generate translations
pnpm translate

# Step 4: Verify translations
pnpm i18n:verify
```

**Agent Reviews**:
- [x] **design-master**: Verified pill styling matches design system ✅
- [x] **mobile-first-guardian**: Verified pills wrap correctly at 320px, touch targets 44px ✅
- [x] **i18n-master**: Verified all labels translated ✅

---

### Task 30e.2: Sidebar Becomes "Advanced Only" (1h) ✅

**Objective**: Move primary options to pills, keep only advanced options in sidebar.

**Files to Modify**:
| File | Action | Description |
| :--- | :--- | :--- |
| `components/image-generator/OptionsPanel.tsx` | Modify | Filter to advanced-only |
| `components/image-generator/FloatingOptionsPanel.tsx` | Modify | Update title/behavior |

**Implementation**:
1. Filter OptionsPanel to only show advanced params:
   - Negative prompt
   - Output format
   - Safety tolerance
   - Seed
   - Enable web search (Grok)
2. Hide primary params (resolution, aspect_ratio, num_images) — now in pills
3. Update panel title to "Advanced Options"

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/OptionsPanel.tsx components/image-generator/FloatingOptionsPanel.tsx
```

---

### Task 30e.3: Visual Aspect Ratio Icons (2h) ✅

**Objective**: Replace text labels with visual rectangle icons for aspect ratios.

**Files to Create/Modify**:
| File | Action | Description |
| :--- | :--- | :--- |
| `components/image-generator/AspectRatioIcon.tsx` | Create | SVG icon component |
| `components/image-generator/VisualSelect.tsx` | Modify | Use icons for aspect ratio |

**Implementation**:
1. **AspectRatioIcon Component**:
   ```tsx
   const ASPECT_RATIOS = {
     "1:1": { width: 16, height: 16 },
     "16:9": { width: 16, height: 9 },
     "9:16": { width: 9, height: 16 },
     "4:3": { width: 16, height: 12 },
     "3:4": { width: 12, height: 16 },
     "21:9": { width: 21, height: 9 },
   };
   
   export function AspectRatioIcon({ ratio, className }) {
     const { width, height } = ASPECT_RATIOS[ratio];
     const scale = 16 / Math.max(width, height);
     
     return (
       <svg viewBox="0 0 16 16" className={cn("text-current", className)}>
         <rect
           x={(16 - width * scale) / 2}
           y={(16 - height * scale) / 2}
           width={width * scale}
           height={height * scale}
           rx={1}
           fill="none"
           stroke="currentColor"
           strokeWidth={1.5}
         />
       </svg>
     );
   }
   ```

2. Pass icons to VisualSelect for aspect ratio options

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/AspectRatioIcon.tsx components/image-generator/VisualSelect.tsx
```

**Agent Reviews**:
- [x] **design-master**: Verified icons are visually clear and accessible ✅

---

### Task 30e.4: Inspiration Empty State (2h) ✅

**Objective**: Replace dark void with a preview of the Inspiration Wall (shows first 4 categories from Convex).

**Note**: This is a **lightweight preview** of Sprint 30f's full wall. Uses same Convex query but renders a simple 2x2 grid instead of full masonry.

**Files to Create/Modify**:
| File | Action | Description |
| :--- | :--- | :--- |
| `components/image-generator/InspirationEmptyState.tsx` | Create | Empty state with Convex categories |
| `messages/en.json` | Modify | Add empty state strings |

**Implementation**:
1. **Query first 4 categories from Convex**:
   ```tsx
   const imageGeneratorTool = useQuery(api.tools.getByKey, { key: "image_generator" });
   const categories = useQuery(
     api.tools.listCategories,
     imageGeneratorTool ? { toolId: imageGeneratorTool._id } : "skip"
   );
   
   // Take first 4 for empty state preview
   const previewCards = categories?.slice(0, 4) ?? [];
   ```

2. **InspirationEmptyState Component**:
   - Icon + "Need inspiration?" heading
   - 2x2 grid of preview cards (from Convex `toolCategories`)
   - Click loads prompt + settings into form
   - "See more" button opens full Inspiration Wall (Sprint 30f)

**Data Source**: Convex `toolCategories` — NOT hardcoded
- Images: `imageUrl` field on category
- Prompt: `prompt` or `description` field
- Model: `modelId` field
- i18n: `nameTranslationKey` for translated names

**i18n Keys**:
```json
{
  "image_generator": {
    "empty_state": {
      "title": "Need inspiration?",
      "description": "Try one of these curated prompts to get started, or write your own.",
      "see_more": "See more inspiration"
    }
  }
}
```

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/InspirationEmptyState.tsx

# Step 3: Generate translations
pnpm translate

# Step 4: Verify translations
pnpm i18n:verify
```

**Agent Reviews**:
- [x] **design-master**: Verified card styling matches design system ✅
- [x] **i18n-master**: Verified all strings translated ✅
- [x] **convex-master**: Verified query pattern is correct ✅

---

### Task 30e.5: Glass Inner Field Styling (1h) ✅

**Objective**: Apply consistent glass styling to all inner form fields.

**Files to Modify**:
| File | Action | Description |
| :--- | :--- | :--- |
| `components/image-generator/DynamicField.tsx` | Modify | Glass field styling |
| `components/image-generator/VisualSelect.tsx` | Modify | Glass option styling |
| `app/globals.css` | Modify | Add glass utility classes |

**Implementation**:
1. Add glass utilities to `globals.css`:
   ```css
   .glass-panel {
     @apply backdrop-blur-md bg-background/60 border border-border/50 shadow-lg rounded-xl;
   }
   .glass-panel-subtle {
     @apply backdrop-blur-sm bg-background/40 border border-border/30 rounded-lg;
   }
   .glass-inner-field {
     @apply bg-transparent border border-border/30 rounded-md focus-within:border-primary/50;
   }
   ```

2. Apply `.glass-inner-field` to all form inputs in DynamicField

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/DynamicField.tsx components/image-generator/VisualSelect.tsx app/globals.css
```

**Agent Reviews**:
- [x] **design-master**: Verified glass consistency across all fields ✅

---

### Task 30e.6: Quick Presets (2h) ✅

**Objective**: Add "Fast / Quality / Cinematic" preset pills.

**Files to Create/Modify**:
| File | Action | Description |
| :--- | :--- | :--- |
| `components/image-generator/QuickPresets.tsx` | Create | Preset pills component |
| `components/image-generator/constants/quickPresets.ts` | Create | Preset definitions |
| `messages/en.json` | Modify | Add preset labels |

**Implementation**:
1. **Quick Presets Data**:
   ```tsx
   export const QUICK_PRESETS = {
     fast: {
       label: "Fast",
       icon: "⚡",
       params: { resolution: "1K", num_images: 1 },
       schemaId: "kling-v3-t2i",
     },
     quality: {
       label: "Quality",
       icon: "✨",
       params: { resolution: "2K", num_images: 1 },
       schemaId: "kling-o3-t2i",
     },
     cinematic: {
       label: "Cinematic",
       icon: "🎬",
       params: { resolution: "2K", aspect_ratio: "21:9" },
       schemaId: "kling-o3-t2i",
     },
   };
   ```

2. **QuickPresets Component**: Row of preset pills that apply settings on click

**i18n Keys**:
```json
{
  "image_generator": {
    "presets": {
      "fast": "Fast",
      "quality": "Quality",
      "cinematic": "Cinematic"
    }
  }
}
```

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/QuickPresets.tsx components/image-generator/constants/quickPresets.ts

# Step 3: Generate translations
pnpm translate

# Step 4: Verify translations
pnpm i18n:verify
```

**Agent Reviews**:
- [x] **i18n-master**: Verified preset labels translated ✅

---

### Task 30e.7: Compact Model Pill (30min) ✅

**Objective**: Show "Kling v3 ▾" not "Model: Kling v3 — Text-to-Image".

**Files to Modify**:
| File | Action | Description |
| :--- | :--- | :--- |
| `components/image-generator/PremiumTabSystem.tsx` | Modify | Compact model display |

**Implementation**:
1. Extract short model name: `schema.name.split(" — ")[0]`
2. Remove "Model:" prefix
3. Add truncation for very long names: `max-w-[120px] truncate`

**Dependency**: Task 30e.1 (Inline Pills) must be complete first.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/PremiumTabSystem.tsx
```

---

### ✅ Sprint 30e Final QA

```bash
# 1. Full TypeScript check
npx tsc --noEmit

# 2. Full Biome check
npx biome check --write components/image-generator/

# 3. Verify i18n
pnpm translate
pnpm i18n:verify
```

### Sprint 30e Success Criteria

- [ ] Primary settings (model, aspect, resolution, count) are **inline pills** in prompt bar
- [ ] Pills **wrap on mobile** (320px), single row on desktop
- [ ] Sidebar shows **only advanced options** (neg prompt, output format, safety, seed)
- [ ] Aspect ratio uses **visual rectangle icons** not text labels
- [ ] Empty state shows **4 categories from Convex** not dark void
- [ ] Inner form fields have **glass styling** (transparent, subtle borders)
- [ ] Quick presets (Fast/Quality/Cinematic) **apply settings on click**
- [ ] Model pill shows **short name** ("Kling v3" not full name)

---

## 🖼️ Sprint 30f: "Inspiration Wall" (6 hours)

**Goal**: Add infinite masonry gallery with flip cards for discovery, using the **existing Convex wall system** (`toolCategories`).

### Admin Infrastructure (Already Built)

From admin screenshots analysis:

| Admin Page | URL | Status | Description |
| :--- | :--- | :--- | :--- |
| Meta Categories | `/admin/meta-categories` | ✅ Operational | Shows "Image Generator" with "0 categories" badge, "Manage categories >" link |
| Categories | `/admin/categories` | ✅ Operational | Full CRUD using Convex, filter by tool |
| Sub-Categories | `/admin/subcategories` | ✅ Operational | Full CRUD |
| Themes | `/admin/themes` | ✅ Operational | Full CRUD |
| Wall Builder | `/admin/wall-builder` | ✅ Operational | Drag-drop tool ordering, active/deactivate |
| Refinement Flows | `/admin/refinement-flows` | ✅ Operational | Flow editor |
| Ads | `/admin/ads` | ✅ Operational | Ad management |

**What this means**:
- **No seed script needed** — Admin adds 20 inspiration cards via existing `/admin/categories` UI
- **No admin code needed** — All CRUD operations already work with Convex
- **Only schema update needed** — Add `prompt`, `modelId`, `aspectRatio`, `resolution` fields to `toolCategories`

**Architecture Decision**: Use existing wall infrastructure — NOT hardcoded constants.
- Data source: `useQuery(api.tools.listCategories, { toolId })` — NOT `CURATED_PRESETS` constant
- Content management: Admin uses existing Categories page at `/admin/categories`
- Images: Convex `_storage` or `imageUrl` field (already on `toolCategories` table)
- i18n: `nameTranslationKey` (already on every tool table)

**⚠️ IMPORTANT: `hasCategories` Flag vs Category Storage**

**Current Convex Data** (verified via MCP):
| Table | Records | Notes |
| :--- | :--- | :--- |
| `tools` | 2 | `guided_flow` (hasCategories: true), `image_generator` (hasCategories: false) |
| `toolCategories` | 3 | All linked to `guided_flow` (Birthday, Wedding, Anniversary) |

**Key Insight**: The `listCategories` query does NOT check `hasCategories`:
```tsx
// convex/tools.ts line 86
export const listCategories = query({
  args: { toolId: v.id("tools") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("toolCategories")
      .withIndex("by_tool_and_active", (q) =>
        q.eq("toolId", args.toolId).eq("isActive", true),
      )
      .collect();
  },
});
```

The `hasCategories` flag only affects `HierarchyWall` navigation at `/tools`:
```tsx
// components/tools/HierarchyWall.tsx line 146
if (!item.hasCategories) {
  // Navigate directly to tool (current behavior for Image Generator)
} else {
  // Drill into categories (would change behavior if we set hasCategories: true)
}
```

**Decision**: Keep `hasCategories: false` on `image_generator` tool.
- Admin can add categories for `image_generator` via `/admin/categories` (already works — "0 categories" badge proves this)
- `listCategories` query returns categories regardless of `hasCategories` flag
- The Inspiration Wall is an **internal feature** of the Image Generator page, not a `/tools` hierarchy level
- `/tools` page continues to route directly to `/image-generator` on click
- No changes to `HierarchyWall` behavior needed

---

### Task 30f.0a: Install Dependencies (15min)

**Objective**: Add masonic package for virtualized masonry grid.

**Commands**:
```bash
pnpm add masonic
```

**2-Step QA**:
```bash
# Step 1: TypeScript check (verify types)
npx tsc --noEmit

# Step 2: Verify package.json updated
git diff package.json
```

---

### Task 30f.0b: Add Image Generator Fields to Schema + Admin Form (45min)

**Objective**: Add image-generator-specific fields to `toolCategories` schema and update the admin `CategoryDialog` form.

**Context** (from admin screenshots):
- Admin UI at `/admin/meta-categories` already shows "Image Generator" with "Manage categories >" link
- Admin UI at `/admin/categories` is fully functional with Convex
- `CategoryDialog.tsx` already handles: `name`, `description`, `imageUrl`, `key`, `sortOrder`, `isActive`
- **Missing**: `prompt`, `modelId`, `aspectRatio`, `resolution` fields for image generator inspiration cards

**No seed script needed**: Admin can manually add 20 inspiration cards via existing UI after schema update.

**Files to Modify**:
| File | Action | Description |
| :--- | :--- | :--- |
| `convex/schema.ts` | Modify | Add optional fields to `toolCategories` |
| `convex/tools.ts` | Modify | Add new fields to `createCategory` and `updateCategory` mutations |
| `components/admin/CategoryDialog.tsx` | Modify | Add form fields for new schema fields |
| `app/[locale]/admin/categories/page.tsx` | Modify | Update `handleSave` type to include new fields |

**Implementation**:

1. **Add fields to `toolCategories` schema**:
```tsx
   // convex/schema.ts - toolCategories table (add after imageUrl)
   
   // Image Generator specific fields (optional - only used when toolId = image_generator)
   prompt: v.optional(v.string()),           // Generation prompt
   modelId: v.optional(v.string()),          // Schema ID (e.g., "kling-v3-t2i")
   aspectRatio: v.optional(v.string()),      // "16:9", "9:16", etc.
   resolution: v.optional(v.string()),       // "1K", "2K"
   ```

2. **Update `CategoryDialog.tsx` form** to show new fields when tool is `image_generator`:
   ```tsx
   // Add to formData state
   prompt: "",
   modelId: "",
   aspectRatio: "",
   resolution: "",
   
   // Conditionally render fields when toolId matches image_generator
   {selectedTool?.key === "image_generator" && (
     <>
       <div className="space-y-2">
         <Label htmlFor="prompt">{t("fields.prompt")}</Label>
         <Textarea
           id="prompt"
           value={formData.prompt}
           onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
           placeholder={t("placeholders.prompt")}
           rows={4}
         />
          </div>
       
       <div className="grid grid-cols-3 gap-4">
         <div className="space-y-2">
           <Label htmlFor="modelId">{t("fields.model_id")}</Label>
           <Select value={formData.modelId} onValueChange={(v) => setFormData({ ...formData, modelId: v })}>
             <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
             <SelectContent>
               <SelectItem value="kling-v3-t2i">Kling v3</SelectItem>
               <SelectItem value="kling-o3-t2i">Kling O3</SelectItem>
               <SelectItem value="grok-imagine-t2i">Grok Imagine</SelectItem>
             </SelectContent>
           </Select>
        </div>
        
          <div className="space-y-2">
           <Label htmlFor="aspectRatio">{t("fields.aspect_ratio")}</Label>
           <Select value={formData.aspectRatio} onValueChange={(v) => setFormData({ ...formData, aspectRatio: v })}>
             <SelectTrigger><SelectValue placeholder="Aspect" /></SelectTrigger>
             <SelectContent>
               <SelectItem value="16:9">16:9</SelectItem>
               <SelectItem value="9:16">9:16</SelectItem>
               <SelectItem value="1:1">1:1</SelectItem>
               <SelectItem value="4:3">4:3</SelectItem>
             </SelectContent>
           </Select>
            </div>
         
         <div className="space-y-2">
           <Label htmlFor="resolution">{t("fields.resolution")}</Label>
           <Select value={formData.resolution} onValueChange={(v) => setFormData({ ...formData, resolution: v })}>
             <SelectTrigger><SelectValue placeholder="Res" /></SelectTrigger>
             <SelectContent>
               <SelectItem value="1K">1K</SelectItem>
               <SelectItem value="2K">2K</SelectItem>
             </SelectContent>
           </Select>
            </div>
          </div>
     </>
   )}
   ```

3. **Update `onSave` type** in `CategoryDialog.tsx` to include new fields:
   ```tsx
   onSave: (data: {
     // ... existing fields
     prompt?: string;
     modelId?: string;
     aspectRatio?: string;
     resolution?: string;
   }) => void;
   ```

4. **Update parent page** `app/[locale]/admin/categories/page.tsx` `handleSave` function:
   ```tsx
   const handleSave = async (data: {
     // ... existing fields
     prompt?: string;
     modelId?: string;
     aspectRatio?: string;
     resolution?: string;
   }) => {
     if (editingCategory) {
       await updateCategory({
         categoryId: editingCategory._id,
         updates: {
           // ... existing fields
           prompt: data.prompt,
           modelId: data.modelId,
           aspectRatio: data.aspectRatio,
           resolution: data.resolution,
         },
       });
     } else {
       await createCategory(data);
     }
     // ...
   };
   ```

5. **Update Convex mutations** in `convex/tools.ts`:
   ```tsx
   // createCategory mutation args (line ~607)
   export const createCategory = mutation({
     args: {
       // ... existing args
       prompt: v.optional(v.string()),
       modelId: v.optional(v.string()),
       aspectRatio: v.optional(v.string()),
       resolution: v.optional(v.string()),
     },
     // ...
   });
   
   // updateCategory mutation updates object (line ~468)
   export const updateCategory = mutation({
     args: {
       categoryId: v.id("toolCategories"),
       updates: v.object({
         // ... existing fields
         prompt: v.optional(v.string()),
         modelId: v.optional(v.string()),
         aspectRatio: v.optional(v.string()),
         resolution: v.optional(v.string()),
       }),
     },
     // ...
   });
   ```

**i18n Keys to Add** (`messages/en.json`):
```json
{
  "admin": {
    "categories": {
      "dialog": {
        "fields": {
          "prompt": "Generation Prompt",
          "model_id": "AI Model",
          "aspect_ratio": "Aspect Ratio",
          "resolution": "Resolution"
        },
        "placeholders": {
          "prompt": "e.g., Cinematic portrait of a woman in golden hour light..."
        }
      }
    }
  }
}
```

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/schema.ts components/admin/CategoryDialog.tsx

# Step 3: Deploy schema changes
npx convex dev --once

# Step 4: Generate translations
pnpm translate

# Step 5: Verify translations
pnpm i18n:verify
```

**After this task**: Admin can add 20 inspiration cards via `/admin/categories` → Filter by "Image Generator" → "Add Category" with prompt/model/aspect/resolution fields.

**Agent Reviews**:
- [ ] **convex-master**: Verify schema changes follow Convex best practices
- [ ] **i18n-master**: Verify admin form labels are translated

---

### Task 30f.1: Inspiration Wall Component (3h)

**Objective**: Create infinite masonry gallery using Convex `toolCategories` query.

**Files to Create/Modify**:
| File | Action | Description |
| :--- | :--- | :--- |
| `components/image-generator/InspirationWall.tsx` | Create | Main masonry component |
| `components/image-generator/FlipCard.tsx` | Create | Card with flip animation |
| `messages/en.json` | Modify | Add wall strings |

**Implementation**:
1. **InspirationWall Component** using Convex query (NOT hardcoded):
   ```tsx
   import { Masonry } from "masonic";
   import { useQuery } from "convex/react";
   import { api } from "@/convex/_generated/api";
   
   function InspirationWall({ toolId, onReuse }) {
     // ✅ Data from Convex — NOT hardcoded CURATED_PRESETS
     const categories = useQuery(api.tools.listCategories, { toolId });
     
     if (!categories) return <InspirationWallSkeleton />;
     
     // Map Convex categories to card format
     const items = categories.map((cat) => ({
       id: cat._id,
       imageUrl: cat.imageUrl,
       prompt: cat.prompt ?? cat.description ?? "",
       modelId: cat.modelId ?? "kling-v3-t2i",
       modelName: cat.name,
       aspectRatio: cat.aspectRatio,
       resolution: cat.resolution,
       nameKey: cat.nameTranslationKey,
     }));
  
  return (
    <Masonry
      items={items}
      columnGutter={12}
         columnWidth={280}
         overscanBy={5}
      render={({ data }) => <FlipCard data={data} onReuse={onReuse} />}
    />
  );
}
```

2. **FlipCard Component** with framer-motion:
   - Front: Image with gradient overlay, model badge
   - Back: Glass panel with prompt, settings, "Re-use" button
   - Animation: `duration: 0.3, ease: "easeOut"` (300ms max per design-master)
   - **i18n**: Use `nameTranslationKey` for translated category names

**Animation Constraint**: Card flip MUST be 300ms max:
```tsx
animate={{ rotateY: flipped ? 180 : 0 }}
transition={{ duration: 0.3, ease: "easeOut" }}  // 300ms ✅ NOT 500ms
```

**Accessibility**:
```tsx
<article
  tabIndex={0}
  aria-label={t("inspiration_card_aria", { prompt: data.prompt.substring(0, 50) })}
  onKeyDown={(e) => e.key === "Enter" && handleFlip()}
>
```

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/InspirationWall.tsx components/image-generator/FlipCard.tsx

# Step 3: Generate translations
pnpm translate

# Step 4: Verify translations
pnpm i18n:verify
```

**Agent Reviews**:
- [ ] **design-master**: Verify flip animation ≤300ms, glass styling on card back
- [ ] **mobile-first-guardian**: Verify touch targets, keyboard navigation
- [ ] **convex-master**: Verify query pattern is correct

---

### Task 30f.2: "Re-use" Flow (1.5h)

**Objective**: Clicking "Re-use" on a flipped card applies model, params, and prompt.

**Files to Modify**:
| File | Action | Description |
| :--- | :--- | :--- |
| `components/image-generator/index.tsx` | Modify | Handle `onReuse` callback, pass `toolId` |
| `components/image-generator/FlipCard.tsx` | Modify | Wire Re-use button |

**Implementation**:
1. **Get `image_generator` tool ID** from Convex:
   ```tsx
   const imageGeneratorTool = useQuery(api.tools.getByKey, { key: "image_generator" });
   ```

2. **Re-use Handler**:
   ```tsx
   const handleReuse = useCallback((card: InspirationCard) => {
     // 1. Select model (from Convex category data)
     setSelectedT2ISchemaId(card.modelId);
     
     // 2. Apply params
     setParams({
       aspect_ratio: card.aspectRatio,
       resolution: card.resolution,
     });
     
     // 3. Load prompt
     setPrompt(card.prompt);
     
     // 4. Scroll to top + focus prompt
     window.scrollTo({ top: 0, behavior: "smooth" });
     promptRef.current?.focus();
     
     // 5. On mobile: close wall drawer
     if (isMobile) setWallOpen(false);
   }, [setSelectedT2ISchemaId, setParams, setPrompt, isMobile]);
   ```

3. Pass `toolId` and `handleReuse` to `InspirationWall`

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/index.tsx components/image-generator/FlipCard.tsx
```

---

### Task 30f.3: Loading & Error States (45min)

**Objective**: Handle loading skeleton and failed image loads gracefully.

**Files to Create/Modify**:
| File | Action | Description |
| :--- | :--- | :--- |
| `components/image-generator/InspirationWallSkeleton.tsx` | Create | Loading skeleton |
| `components/image-generator/FlipCard.tsx` | Modify | Add error states |

**Implementation**:
1. **Loading Skeleton**: Show shimmer grid while Convex query loads
2. **Error State**: Show placeholder if image fails to load
3. **Empty State**: Show message if no categories exist (admin needs to add via wall-builder)

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/InspirationWallSkeleton.tsx components/image-generator/FlipCard.tsx
```

---

### ✅ Sprint 30f Final QA

```bash
# 1. Full TypeScript check
npx tsc --noEmit

# 2. Full Biome check
npx biome check --write components/image-generator/

# 3. Verify i18n
pnpm translate
pnpm i18n:verify
```

### Sprint 30f Success Criteria

- [ ] Schema has `prompt`, `modelId`, `aspectRatio`, `resolution` fields on `toolCategories`
- [ ] Admin `CategoryDialog` shows prompt/model/aspect/resolution fields when tool is `image_generator`
- [ ] Admin can add inspiration cards via `/admin/categories` → Filter by "Image Generator"
- [ ] Masonry gallery renders **categories from Convex** (NOT hardcoded)
- [ ] Cards **flip on click** with 300ms animation
- [ ] Card back shows **prompt, model, settings, Re-use button**
- [ ] Clicking "Re-use" **applies model + params + prompt**
- [ ] Gallery supports **keyboard navigation** (Tab, Enter)
- [ ] Loading skeleton shows while Convex query loads

---

## 📋 Convex Schema Changes (Sprint 30f Phase 2 — Future)

**Note**: Phase 2/3 are NOT part of Sprint 30f. Document here for planning.

### Phase 2: User History in Inspiration Wall

Add to `imageToolHistory` table:
```typescript
schemaId: v.optional(v.string()),  // For filtering by model
isHidden: v.optional(v.boolean()), // User can hide from wall
```

Add indexes:
```typescript
.index("by_user_visible", ["userId", "isHidden", "createdAt"])
.index("by_user_schema", ["userId", "schemaId", "createdAt"])
```

Merge user history into the wall alongside curated categories.

### Phase 3: Community Gallery

New `communityGallery` table with:
- `sourceHistoryId`, `userId`, `imageUrl`, `prompt`, `model`, `schemaId`
- `likesCount`, `viewsCount`, `status` (pending/approved/rejected/removed)
- Indexes for public feed, moderation queue

---

## 📁 FILES CREATED / MODIFIED (SUMMARY)

| File | Sprint | Action |
| :--- | :--- | :--- |
| `components/image-generator/index.tsx` | 30d, 30d.5, 30f | Modify (state wiring, Convex schema queries, handleLoadAsInput, toolId query) |
| `components/image-generator/output-section.tsx` | 30d | Modify (z-order fix) |
| `components/image-generator/fullscreen-viewer.tsx` | 30d | Modify (img tag) |
| `components/image-generator/OptionsPanel.tsx` | 30d, 30e | Modify (filter prompt, advanced-only) |
| `components/image-generator/DynamicField.tsx` | 30d, 30e | Modify (glass styling) |
| `components/image-generator/PremiumTabSystem.tsx` | 30d, 30e | Modify (truncation, compact pill) |
| `components/image-generator/ModelSelector.tsx` | 30d.5 | Modify (use Convex schemas) |
| `components/image-generator/PromptPillBar.tsx` | 30e | Create |
| `components/image-generator/PillButton.tsx` | 30e | Create |
| `components/image-generator/AspectRatioIcon.tsx` | 30e | Create |
| `components/image-generator/InspirationEmptyState.tsx` | 30e | Create |
| `components/image-generator/QuickPresets.tsx` | 30e | Create |
| `components/image-generator/InspirationWall.tsx` | 30f | Create (uses Convex query) |
| `components/image-generator/InspirationWallSkeleton.tsx` | 30f | Create |
| `components/image-generator/FlipCard.tsx` | 30f | Create |
| `components/image-generator/constants/quickPresets.ts` | 30e | Create |
| `convex/schema.ts` | 30d.5, 30f | Modify (add `imageModelSchemas` table, add fields to `toolCategories`) |
| `convex/imageModels.ts` | 30d.5 | Create (queries for model schemas) |
| `convex/seed/seedImageModels.ts` | 30d.5 | Create (seed 8 models + 4 credit costs) |
| `convex/actions/imageToolGeneric.ts` | 30d.5 | Rewrite (read all config from Convex) |
| `convex/imageTool.ts` | 30d.5 | Modify (remove falModels import) |

**Deleted after Sprint 30d.5** (replaced by Convex `imageModelSchemas` table):
- ~~`components/image-generator/constants/modelSchemas.ts`~~ — UI schemas now in Convex
- ~~`convex/configs/falModels.ts`~~ — Backend config now in Convex
| `convex/tools.ts` | 30f | Modify (add new fields to createCategory/updateCategory mutations) |
| `components/admin/CategoryDialog.tsx` | 30f | Modify (add prompt/model/aspect/resolution fields for image_generator) |
| `app/[locale]/admin/categories/page.tsx` | 30f | Modify (update handleSave type) |
| `app/globals.css` | 30e | Modify (glass utilities) |
| `messages/en.json` | 30d-f | Modify (i18n keys) |

**Deleted from plan** (using existing admin UI + Convex wall system instead):
- ~~`convex/seed/seedTools.ts`~~ — Admin adds 20 categories via `/admin/categories` UI (no seed script needed)
- ~~`components/image-generator/constants/curatedPresets.ts`~~ — Data lives in Convex `toolCategories`
- ~~`public/presets/`~~ — Images managed via Convex `_storage` or `imageUrl` field

---

## 📝 PROGRESS SUMMARY

| Task | Description | Status |
| :--- | :--- | :--- |
| **30d.1** | Model Selection State Wiring | ✅ (Feb 15, 2026) |
| **30d.2** | Fix Action Buttons Z-Order | ✅ (Feb 15, 2026) |
| **30d.3** | Fix "Use as Input" → Edit Mode Flow | ✅ (Feb 15, 2026) |
| **30d.4** | Fix Fullscreen Viewer | ✅ (Feb 15, 2026) |
| **30d.5** | Remove Duplicate Prompt from Options Panel | ✅ (Feb 15, 2026) |
| **30d.6** | Remove Legacy State Variables | ✅ (Feb 15, 2026) |
| **30d.7** | Visual Polish Pass | ✅ (Feb 15, 2026) |
| **30d.5.1** | Create `imageModelSchemas` Table + Seed All 8 Models + 8 Credit Costs | ✅ (Feb 15, 2026) |
| **30d.5.2** | Update Backend to Use Convex Schemas | ✅ (Feb 15, 2026) |
| **30d.5.3** | Update Frontend to Use Convex Schemas + Dynamic UI | ✅ (Feb 15, 2026) |
| **30d.5.4** | Delete Hardcoded Files (`modelSchemas.ts`, `falModels.ts`) | ✅ (Feb 15, 2026) |
| **30e.1** | Inline Pills in Prompt Bar | ⬜ |
| **30e.2** | Sidebar Becomes "Advanced Only" | ⬜ |
| **30e.3** | Visual Aspect Ratio Icons | ⬜ |
| **30e.4** | Inspiration Empty State | ⬜ |
| **30e.5** | Glass Inner Field Styling | ⬜ |
| **30e.6** | Quick Presets | ⬜ |
| **30e.7** | Compact Model Pill | ⬜ |
| **30f.0a** | Install Dependencies (masonic) | ⬜ |
| **30f.0b** | Schema + Admin Form Update (prompt/model/aspect/resolution) | ⬜ |
| **30f.1** | Inspiration Wall Component (Convex query) | ⬜ |
| **30f.2** | "Re-use" Flow | ⬜ |
| **30f.3** | Loading & Error States | ⬜ |

---

## ⏱️ TIME TRACKING

| Sprint | Estimated | Actual | Status |
| :--- | :--- | :--- | :--- |
| Sprint 30d: Wire It Up | 5.5h | 4h (7/7 tasks) | ✅ COMPLETE |
| **Sprint 30d.5: Model Architecture** | **5.5h** | **—** | **⬜ 🔴 BLOCKING** |
| Sprint 30e: Make It Beautiful | 13.5h | — | ⬜ |
| Sprint 30f: Inspiration Wall | 6h | — | ⬜ |
| **TOTAL** | **30h** | **4h** | |

---

## ✅ FINAL SPRINT QA (after all sprints complete)

```bash
# 1. Full TypeScript check
npx tsc --noEmit

# 2. Full Biome check
npx biome check --write .

# 3. Verify i18n
pnpm translate
pnpm i18n:verify

# 4. Build verification
pnpm build
```

---

**Document Version**: 3.5  
**Author**: Sprint Planning Agent  
**Last Updated**: February 15, 2026
**Agent Reviews Incorporated**: Senior Dev Reviewer, Design Master, Convex Master, Senior PM

---

## 📝 Revision History

| Version | Date | Changes |
| :--- | :--- | :--- |
| 3.0 | Feb 15, 2026 | Initial structured sprint plan with agent reviews |
| 3.1 | Feb 15, 2026 | **PM Review**: Replaced hardcoded `CURATED_PRESETS` with Convex wall system (`toolCategories`). Deleted `constants/curatedPresets.ts` and `public/presets/` from plan. Added Task 30f.0b for schema changes. Updated Task 30e.4 to use Convex query. |
| 3.2 | Feb 15, 2026 | **Admin Analysis**: Analyzed admin screenshots showing fully operational CRUD at `/admin/meta-categories`, `/admin/categories`, `/admin/wall-builder`. Removed seed script from plan — admin adds 20 categories via existing UI. Task 30f.0b simplified to schema update + admin form update only. Added Admin Infrastructure table to Sprint 30f. |
| 3.3 | Feb 15, 2026 | **Code Verification**: (1) Added explicit `convex/tools.ts` mutation updates for `createCategory`/`updateCategory`. (2) Added `app/[locale]/admin/categories/page.tsx` `handleSave` type update. (3) Fixed 30e.4 success criteria wording ("4 categories from Convex" not "4 curated preset cards"). (4) Added `hasCategories` flag side effect documentation — decision to keep `hasCategories: false` to avoid changing `/tools` HierarchyWall behavior. |
| 3.4 | Feb 15, 2026 | **Convex MCP Verification**: Verified current data — 2 tools (guided_flow with hasCategories:true, image_generator with hasCategories:false), 3 categories (all for guided_flow). Confirmed `listCategories` query does NOT check `hasCategories` flag — categories can be added for image_generator without changing the flag. Updated documentation with actual Convex data table. |
| **3.5** | **Feb 15, 2026** | **🔴 CRITICAL: Model Architecture Gap Identified**. Added **Sprint 30d.5** (5 hours, BLOCKING) to implement the modular model architecture from IMAGE-MODELS-ANALYSIS.md. Issues found: (1) Missing `creditCosts` entries for Grok/Nano Banana models causing "Unknown action type" errors, (2) No backend parameter filtering causing FAL errors like "series_amount should not be set", (3) Model schemas hardcoded in `modelSchemas.ts` instead of Convex — defeats "zero-code model onboarding" goal. Sprint 30d.5 adds: `imageModelSchemas` Convex table, `seedCreditCosts.ts`, `seedImageModels.ts`, backend param filtering in `imageToolGeneric.ts`, frontend Convex queries. **This is the missing architectural foundation from original Sprint 30 goal.** |
