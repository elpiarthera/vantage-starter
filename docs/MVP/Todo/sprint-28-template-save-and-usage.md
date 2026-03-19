# Sprint 28: Template Save and Usage — Full Clone Flow

**Status**: ✅ Done  
**Goal**: Make “save as template” capture the full project (story, narration script, scene data with first/last frame images) and make “use the template” create a draft project prepopulated with that data (clone flow). Provide a template detail page (reuse project details) so users see full template content before use.

**Related**: Changelog entries “Save template + Use template: full clone flow” and “Sprint 28: Template detail page + clone flow completion” (2026-01-28).

---

## Doc purpose

This document is **retrospective documentation** of what was implemented. All planned items have been completed.

---

## ⚡ Quick Summary

| Area | Before | After (Done) |
|------|--------|--------------|
| **Save template — story** | Not stored | `config.emotionalStory` stored |
| **Save template — narration script** | Not stored | `config.approvedNarrationScript` stored |
| **Save template — scenes** | `defaultScenes: []` | `defaultScenes` = scene structure + frame URLs |
| **Use template** | Only `incrementUsage` + redirect to step-1?templateId= | Create project + scenes from template; **incrementUsage only after createFromTemplate succeeds** (step-1); redirect to step-1?projectId=newId |
| **Scene frame URLs (template)** | N/A | Scenes have `startFrameImageUrl` / `endFrameImageUrl`; **Step-3 passes them to generateVideo** when videoGeneration is not set |
| **Template “view”** | Modal only | **Template detail page** at `/dashboard/templates/[id]` (copy of project detail, adapted); Eye → detail page; ViewTemplateModal removed |
| **createFromTemplate** | — | **Cleanup on failure**: on error after project insert, project is deleted to avoid orphans; no `as string` casts for IDs |
| **Language on clone** | Hardcoded "English" | Step-1 shows language selector prepopulated from project; user can change language when arriving from template |

---

## Part 1 — ✅ Done (retrospective)

What is already implemented and working.

### 1.1 Schema changes

**File**: `convex/schema.ts`

- **Templates table — config**
  - Optional fields: `emotionalStory: v.optional(v.string())`, `approvedNarrationScript: v.optional(v.string())`.
- **Scenes table**
  - Optional fields: `startFrameImageUrl: v.optional(v.string())`, `endFrameImageUrl: v.optional(v.string())`.

### 1.2 Convex — templates.create

**File**: `convex/templates.ts`

- Config args extended with optional `emotionalStory`, `approvedNarrationScript`.
- Callers (step-6 and CreateTemplateModal) pass emotionalStory, approvedNarrationScript, and `defaultScenes` built from project scenes (sceneNumber, title, description, duration, cinematicStyles, startFrameUrl, endFrameUrl from scene.videoGeneration).

### 1.3 Convex — scenes.create

**File**: `convex/scenes.ts`

- Args: optional `startFrameImageUrl`, `endFrameImageUrl`; insert includes them when provided.

### 1.4 Convex — projects.createFromTemplate

**File**: `convex/projects.ts`

- Mutation `createFromTemplate({ templateId })`: auth + template access, create project (“Copy of …”, eventDetails with emotionalStory, step4Data, approvedNarrationScript, visualStyle from template), create scenes from config.defaultScenes (with startFrameImageUrl/endFrameImageUrl), set duration, increment user totalProjects, return projectId.

### 1.5 Frontend — Save template

- **Step-6** (`app/[locale]/guided/step-6/page.tsx`): Build defaultScenes from scenes; pass emotionalStory, approvedNarrationScript, defaultScenes to createTemplate.
- **CreateTemplateModal** (`components/dashboard/templates/CreateTemplateModal.tsx`): Same: scenes list, build defaultScenes, pass emotionalStory, approvedNarrationScript, defaultScenes.

### 1.6 Frontend — Use template (step-1)

**File**: `app/[locale]/guided/step-1/page.tsx`

- Read `templateId` from URL; when present (and no projectId), call `createFromTemplate({ templateId })`; **on success**, call `templates.incrementUsage({ templateId })` then redirect to step-1?projectId=newId; show loading while creating. “Use the template” (TemplateCard or template detail page) links to step-1?templateId=... **without** calling incrementUsage (increment only after createFromTemplate succeeds).

### 1.7 Acceptance criteria (Done)

- [x] Save template: Template stores emotionalStory, approvedNarrationScript, defaultScenes (with frame URLs). Step-6 and CreateTemplateModal both send these.
- [x] Use template: Step-1 with templateId calls createFromTemplate, then redirects to step-1?projectId=newId. New project is draft with eventDetails, step4Data, approvedNarrationScript, visualStyle; scenes created with startFrameImageUrl/endFrameImageUrl when present.
- [x] Schema: templates.config optional emotionalStory, approvedNarrationScript; scenes optional startFrameImageUrl, endFrameImageUrl; scenes.create accepts them.

---

## Part 2 — Completed (implementation)

All items below were implemented.

### 2.1 Template detail page ✅

**Requirement**: Replace the View Template modal with a **template detail page** so users see full template content before using it. Reuse the project details page structure and existing components; do not recreate the wheel.

**Route and entry**

- **Route**: `/dashboard/templates/[id]` — `app/[locale]/dashboard/templates/[id]/page.tsx`.
- **Entry**: Eye icon (and optionally card click) → navigate to `/dashboard/templates/[id]`. Do **not** open ViewTemplateModal for “view”; remove or repurpose it so the primary view is the detail page.

**Page structure (reuse project detail, single scroll)**

- **Header** (same pattern as ProjectDetail): Back link “← Back to Templates” → `/dashboard/templates`; title = template name; badges = category/occasion, system vs custom (no status); actions = **Use the template** (link to `step-1?templateId=...`), **Delete** (only if custom, existing AlertDialog pattern).
- **Content**: Single scrollable page (no tabs). Sections in order:
  1. **Preview** — Final video (thumbnail URL) in an aspect-video player.
  2. **Overview** — Description, category, emotion/story: `template.description`, `template.category`, `config.emotionalStory`.
  3. **Visual style** — One line or badge: `config.suggestedStyles[0]`.
  4. **Story used for the video** — Box with `config.approvedNarrationScript` (full text).
  5. **Scenes & frames** — For each item in `config.defaultScenes`: scene number, title, description, first frame image (`startFrameUrl`), last frame image (`endFrameUrl`). No scene videos.
  6. **Narration** — Script + narration audio: from `defaultSettings.narrationTakes` pick by `selectedNarrationTake` or first; `<audio src={...} controls />`.
  7. **Music** — Music description: `defaultSettings.musicPrompt` and/or selected music take; music audio: **fallback logic required** — `selectedMusicTrack` index may not exist in `musicTakes[]`; use `musicTakes[selectedMusicTrack] ?? musicTakes[0]` (or clamp index) so we never read out of bounds.
  8. **Actions** (again at bottom): Use the template, Delete (if custom).

**Breadcrumb**: TemplateDetail already fetches the template via `api.templates.get`. **Do not** duplicate the query in DashboardNav. Pass the template name **up from TemplateDetail via context or shared state** (e.g. a dashboard breadcrumb context that TemplateDetail sets when template is loaded and DashboardNav reads when path is `/dashboard/templates/[id]`). Breadcrumb: Home > Dashboard > Templates > **[Template name]**.

**Modal**: Remove the View Template modal for “view”. Eye icon and/or card click → go to `/dashboard/templates/[id]`. “Use the template” lives on the detail page (and can remain on the card in the list as a shortcut).

**Data mapping (template → UI)** — all data already in template (no schema/API changes):

| UI section | Source |
|------------|--------|
| Name, description, category, type | `template.name`, `template.description`, `template.category`, `template.type` |
| Thumbnail / final video | `template.thumbnail` |
| Emotion / story (step 1) | `template.config.emotionalStory` |
| Visual style | `template.config.suggestedStyles[0]` |
| Story used for video | `template.config.approvedNarrationScript` |
| Scenes & frames | `template.config.defaultScenes[]`: sceneNumber, title, description, startFrameUrl, endFrameUrl |
| Narration audio | `template.config.defaultSettings.narrationTakes[]`, selectedNarrationTake or first; audioUrl |
| Music description + audio | `template.config.defaultSettings.musicPrompt`, musicTakes[].prompt, musicTakes[].audioUrl; **fallback**: `musicTakes[selectedMusicTrack] ?? musicTakes[0]` (selectedMusicTrack may be out of range) |

**Reuse strategy (no new wheels)**

- **Reuse as-is**: ErrorState, Badge, Button, Card, Skeleton, useDevice, useRouter (from `@/i18n/routing`), useTranslations, delete confirmation (AlertDialog pattern from TemplateCard).
- **Loading/error states**: Same pattern as ProjectDetail — **explicitly** use: `template === undefined` → loading (Skeleton block); `template === null` or `!template` → ErrorState with retry or “Back to Templates”. Do not assume; document and implement this.
- **Copy then adapt**: (1) Route: copy `app/[locale]/dashboard/projects/[id]/page.tsx` → `app/[locale]/dashboard/templates/[id]/page.tsx`; replace ProjectDetail with TemplateDetail, pass `templateId={params.id}`. (2) Main component: copy `ProjectDetail.tsx` → `TemplateDetail.tsx`; then: props `templateId`; data `api.templates.get({ templateId })`; back “Back to Templates”; title `template.name`; badges category + system vs custom; actions Use the template + Delete only; replace `<ProjectTabs />` with template sections (Preview, Overview, Visual style, Story, Scenes & frames, Narration, Music, Actions); one delete AlertDialog, no Share.
- **Do not copy**: ProjectTabs and tabs/ (ScenesTab, AssetsTab, AudioTab, SettingsTab, ShareTab). Template content stays inside TemplateDetail as inline sections from `template.config` only; no new tab components.
- **Mobile responsiveness (Scenes & frames grid)**: Reuse the **same responsive pattern as ScenesTab**: grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6`, and `useDevice()` from `@/contexts/DeviceContext` for mobile vs desktop (e.g. touch vs hover, button sizes where relevant). Existing dashboard components (ScenesTab, SceneCard, SettingsTab, etc.) already use this; TemplateDetail scenes & frames block must use the same grid and useDevice so mobile and desktop are covered.

**Template detail implementation checklist (all required)**

| # | Task | Notes |
|---|------|--------|
| 1 | Route | Add `app/[locale]/dashboard/templates/[id]/page.tsx`; render TemplateDetail with `templateId={params.id}`; same container as project page. |
| 2 | TemplateDetail component | Copy ProjectDetail → TemplateDetail; switch to api.templates.get, template wording, “Back to Templates”, Use template + Delete only; replace ProjectTabs with template sections. Use existing Card, Badge, Button, etc. |
| 3 | Scenes & frames block | Map template.config.defaultScenes to rows/cards: scene number, title, description, img startFrameUrl/endFrameUrl. Placeholder or omit if URLs missing. **Responsive**: same grid as ScenesTab — `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6`; use `useDevice()` for mobile/desktop. |
| 4 | Narration block | Display config.approvedNarrationScript; from defaultSettings.narrationTakes pick by selectedNarrationTake or first; audio controls. |
| 5 | Music block | Display defaultSettings.musicPrompt and/or selected music take prompt; from musicTakes use **fallback**: `musicTakes[selectedMusicTrack] ?? musicTakes[0]` (selectedMusicTrack may not exist in array); audio controls. |
| 6 | List → detail | In TemplateCard, Eye click (and optionally card click) → router.push to /dashboard/templates/[id]. Remove ViewTemplateModal usage for “view”. |
| 7 | Use the template | On detail page, link to step-1?templateId=... (incrementUsage: call after createFromTemplate succeeds in step-1, see 2.3). |
| 8 | Delete | Reuse AlertDialog + api.templates.remove; show Delete only when !template.isSystem. |
| 9 | Breadcrumb | Pass template name from TemplateDetail to DashboardNav via context/state (TemplateDetail already has template; no second api.templates.get). DashboardNav when path is /dashboard/templates/[id] reads template name from that context. |
| 10 | i18n | Add keys for section titles and actions: “Overview”, “Visual style”, “Story used for the video”, “Scenes & frames”, “Narration”, “Music”, “Use the template”, “Back to Templates”, etc. |
| 11 | Loading/error | TemplateDetail: loading = Skeleton (same structure as ProjectDetail); error/not found = ErrorState with retry or “Back to Templates”. |

**Template detail edge cases**

- Empty or legacy templates: missing emotionalStory, approvedNarrationScript, defaultScenes → show “—” or “Not set”; hide or collapse empty sections.
- Narration/Music: missing defaultSettings or empty narrationTakes/musicTakes → show script or music prompt text only; no audio player.
- Frame URLs missing for a scene → placeholder image or “No frame”.
- System templates: Delete button hidden; rest read-only.

### 2.2 Step-3: use template frame URLs in video generation ✅

- **Done**: In `app/[locale]/guided/step-3/page.tsx`, scene-to-UI mapping and `handleGenerateVideoClick` now resolve frame URLs as: `videoGeneration?.startFrameUrl` ?? `startFrameImageUrl` ?? `startFrame` (and same for end). So template-sourced scenes (with `startFrameImageUrl`/`endFrameImageUrl` but no `videoGeneration`) pass those URLs to `generateVideoAction`. At least `startFrameUrl` is required; generation is allowed when template frames are present.

### 2.3 incrementUsage only after createFromTemplate succeeds ✅

- **Done**: Step-1 calls `incrementTemplateUsage({ templateId })` **after** `createFromTemplate` resolves successfully, then redirects. TemplateCard and template detail page “Use the template” are plain links to step-1?templateId=... with **no** incrementUsage on click.

### 2.4 Language on clone ✅

- **Done**: Step-1 syncs `language` from project when project loads (`setLanguage(project.language)`). When the user arrives from a template (redirect to step-1?projectId=newId), the new project is loaded and the language selector is prepopulated and editable. createFromTemplate still sets initial `language: "English"`; user can change it on step-1.

### 2.5 projectId / userId in scene insert ✅

- **Done**: createFromTemplate passes `projectId` and `userId: user._id` directly (no `as string` casts). Schema uses v.string() for these fields; Convex Id<> is accepted.

### 2.6 Partial failure / orphan data ✅

- **Done**: createFromTemplate wraps all steps after project insert in try/catch; on throw, it deletes the created project (best-effort cleanup) and rethrows. Comment in code documents the behavior.

---

## Completed checklist

| # | Task | Status |
|---|------|--------|
| 1 | Template detail page | ✅ Route, TemplateDetail (copy ProjectDetail → adapt), list→detail (Eye → /dashboard/templates/[id]), breadcrumb via context, i18n, loading/error, music fallback |
| 2 | Step-3: template frame URLs in video generation | ✅ startFrameUrl/endFrameUrl from startFrameImageUrl/endFrameImageUrl or videoGeneration when calling generateVideo |
| 3 | incrementUsage after createFromTemplate | ✅ Called in step-1 after success; removed from card and modal |
| 4 | Language on clone | ✅ Step-1 language selector visible and editable when project loaded (from template or not) |
| 5 | projectId/userId casts | ✅ No casts; IDs passed directly |
| 6 | Partial failure | ✅ Cleanup: delete project on failure after insert; documented in code |

---

## Files touched (Done)

| File | Change |
|------|--------|
| `convex/schema.ts` | templates.config: optional emotionalStory, approvedNarrationScript; scenes: optional startFrameImageUrl, endFrameImageUrl |
| `convex/templates.ts` | create args config: optional emotionalStory, approvedNarrationScript |
| `convex/projects.ts` | createFromTemplate mutation; try/catch + delete project on failure (cleanup); no ID casts |
| `convex/scenes.ts` | create args and insert: optional startFrameImageUrl, endFrameImageUrl |
| `app/[locale]/guided/step-6/page.tsx` | build defaultScenes; pass emotionalStory, approvedNarrationScript, defaultScenes |
| `components/dashboard/templates/CreateTemplateModal.tsx` | scenes query; build defaultScenes; pass emotionalStory, approvedNarrationScript, defaultScenes |
| `app/[locale]/guided/step-1/page.tsx` | templateId from URL; createFromTemplate then incrementUsage on success then redirect; loading state |
| `app/[locale]/guided/step-3/page.tsx` | Scene mapping and handleGenerateVideoClick: use startFrameImageUrl/endFrameImageUrl when videoGeneration missing; pass to generateVideoAction |
| `app/[locale]/dashboard/templates/[id]/page.tsx` | Template detail route; TemplateDetail with templateId (copy of project [id] page, adapted) |
| `components/dashboard/templates/TemplateDetail.tsx` | Copy of ProjectDetail, adapted: api.templates.get, breadcrumb context, template sections (Preview, Overview, Visual style, Story, Scenes & frames, Narration, Music), Use template + Delete, AlertDialog delete; music fallback musicTakes[selectedMusicTrack] ?? musicTakes[0] |
| `components/dashboard/templates/TemplateCard.tsx` | Eye → router.push(/dashboard/templates/[id]); remove incrementUsage from Use link; remove ViewTemplateModal |
| `components/dashboard/DashboardNav.tsx` | Template detail path: last crumb = template name from DashboardBreadcrumbContext (no duplicate query) |
| `contexts/DashboardBreadcrumbContext.tsx` | New: templateName state + setTemplateName for breadcrumb when on template detail |
| `app/[locale]/dashboard/layout.tsx` | Wrap with DashboardBreadcrumbProvider |
| `messages/en.json` | common.back_to_templates; errors.template_load_*; template_detail.* |
| `Changelog.md` | Entries for Sprint 28 completion |

---

## Changelog entries

See Changelog.md for:
- “Save template + Use template: full clone flow” (initial implementation)
- “Sprint 28: Template detail page + clone flow completion” (template detail page, step-3 frames, incrementUsage timing, cleanup on failure, i18n)
