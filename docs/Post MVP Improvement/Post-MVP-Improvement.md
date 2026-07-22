# Post-MVP Improvement: Dashboard / Projects Card Alignment

## Summary

- **Dashboard (RecentProjects):** card = top media block (aspect-video, grey + FolderOpen) → title → badges (occasion, status). No date/duration.
- **Dashboard/Projects (ProjectCard):** no media block; title, occasion, status, theme, date, duration, dropdown. You want the same layout as Dashboard (media on top) but keep date and duration and use real media with fallback.

## Data today

- **Projects:** `finalVideoUrl` (optional). Full doc from `api.projects.list` → ProjectCard already has `finalVideoUrl` available.
- **Scenes:** `videoUrl` (scene video), `videoGeneration.startFrameUrl` / `endFrameUrl` (images). No project-level "project image" field; "project image" = first scene's image (e.g. `startFrameUrl`) or first scene's `videoUrl` for video.

## Fallback order

1. **Final video** → `project.finalVideoUrl`
2. **Scene video** → first scene with `videoUrl` (need scenes per project)
3. **Project image** → first scene's `videoGeneration.startFrameUrl` (or first image we have)
4. **Placeholder** → same grey block + FolderOpen as Dashboard

## Steps (no code, just plan)

### 1. Media source for each card

- **Either backend:** new Convex query (e.g. `projects.listWithCardMedia`) that for each project returns the same list plus one "card media" field: `{ url, type: 'final_video' | 'scene_video' | 'scene_image' | null }` using project's `finalVideoUrl` and first scene's `videoUrl` / `startFrameUrl`.
- **Or frontend:** keep `api.projects.list` and per project use `api.scenes.listByProject` (or one batch query) and compute the same priority (final → scene video → scene image → placeholder). Backend is better for one query and consistent logic.

### 2. Align card layout with Dashboard

- In `ProjectCard.tsx`, reuse Dashboard's structure: **top** = same `aspect-video` block (Dashboard uses `bg-slate-600 rounded-lg mb-3` + icon).
- Put **inside** that block: if `cardMedia.url` exists, render `<video>` or `<img>` (and keep poster/fallback to placeholder); else only the placeholder (grey + FolderOpen).
- Under the block: **title**, then **badges** (occasion, status, theme) in the same style as RecentProjects where possible, then **date + duration** row (Calendar + Clock) so date/duration stay.

### 3. Grid vs list

- **Grid:** same as Dashboard (media on top, then text).
- **List:** either keep a small media strip on the left (same aspect-video crop) and right side = title, badges, date, duration, or reuse the same block scaled down so it still "looks like" the dashboard card.

### 4. Optional: reuse Dashboard card in both places

- Extract a shared `ProjectCardContent` (or `ProjectCardMedia` + body) used by both `RecentProjects` and `ProjectCard`, with a prop like `showDateAndDuration?: boolean` and `mediaUrl?: string | null`, `mediaType?: 'video' | 'image' | null`. Dashboard passes placeholder only; Projects passes resolved media + `showDateAndDuration: true`. Reduces drift.

### 5. RecentProjects

- Optionally feed it the same `cardMedia` (from the new query or from existing list + scene data) so Dashboard cards also show final/scene/image when available instead of always the folder icon. Same fallback order.

## Order of work

1. Add Convex: either `projects.listWithCardMedia` or a small `scenes.getFirstSceneMedia(projectId)` and compute in the frontend.
2. In `ProjectCard`, add the top media block (video/image/placeholder), then reorder content: title → badges → date & duration.
3. Match Dashboard styles (slate, rounded, spacing).
4. Adjust list layout if needed.
5. Optionally extract shared card component and use it on Dashboard + Projects.

---

## Account Preferences (Dashboard / Account)

In the **Preferences** section of the Profile tab (`/dashboard/account`), **Theme** and **Email notifications** are currently **hidden** (commented out in code). Only **Language** is shown for now.

- **Theme:** Light / Dark / System selector — commented in `components/dashboard/account/tabs/ProfileTab.tsx`. To implement: persist choice in Clerk `user.unsafeMetadata.theme` (or Convex `users.preferences.theme`), and apply via app theme provider.
- **Email notifications:** Toggle for email notification preference — commented in `ProfileTab.tsx`. To implement: persist in Clerk metadata or Convex, and wire to notification logic when it exists.

**Do not delete** the commented blocks; they are marked with `COMMENT DO NOT DELETE` and reference this doc. When implementing, uncomment and add save/persistence (e.g. Convex `users.update` or Clerk `user.update`) for theme and notifications.

---

## Usage and Credits Tab: Cost Breakdown (Dashboard / Account)

In the **Usage and credits** tab (`/dashboard/account` → Usage tab), the **Cost Breakdown** section is currently **hidden** (commented out in code). That section showed the usage chart (`UsageChart` with `usageHistory`). Credit Balance, Usage Statistics, Usage History table (with Project name, Credits, Date), and Total credits used remain visible.

- **Cost Breakdown:** Chart of usage/cost over time — commented in `components/dashboard/account/tabs/UsageCreditsTab.tsx`. To implement: uncomment the block (title `t("cost_breakdown")` + `Card` with `<UsageChart usageData={usageHistory || []} />`). The `UsageChart` import is kept with a biome-ignore until the section is re-enabled.

**Do not delete** the commented block; it is marked with `COMMENT DO NOT DELETE` and references this doc.

---

## Usage History Table (Dashboard / Account → Usage tab)

The **Usage History** table in the Usage and credits tab has been updated as follows.

- **First column: Project name** — Added. Shows the project name from `api.projects.list` keyed by `usage.projectId`; when `projectId` is missing, shows `t("no_project")` ("—").
- **Service column** — Hidden (commented out). Do not delete; marked with `COMMENT DO NOT DELETE` in `UsageCreditsTab.tsx` (desktop `<th>`/`<td>` and mobile card block). To re-enable: uncomment the Service header and cells.
- **Model column** — Hidden (commented out). Same as Service; uncomment to show again.
- **Cost column** — Now displays **credits** instead of USD: uses `usage.creditsUsed` and `t("credits_label", { count })`. The "Cost" header is replaced by "Credits" (`t("credits")`).
- **Date column** — Unchanged.
- **Total summary** — Shows **Total Credits Used** (`t("total_credits_used")`) and the sum of `creditsUsed` over the listed usage records (`usageStats.totalCredits`).

**Future improvements (optional):** Re-enable Service and Model columns if needed; optionally show USD cost again (e.g. in a tooltip or secondary column) using `formatCurrency(usage.cost)` (kept in code with biome-ignore).

---

## Notifications Tab (Dashboard / Account)

The **Notifications** tab on the account page (`/dashboard/account`) is currently **hidden** (commented out in code). The tab no longer appears in the tab bar; only Profile, Subscription, and Usage tabs are visible.

- **Where:** `components/dashboard/account/AccountTabs.tsx`. The notifications entry is commented out in the `tabs` array (`{ id: "notifications", label: "notifications", icon: Bell }`), and the content line `{activeTab === "notifications" && <NotificationsTab user={user} />}` is commented out.
- **To re-enable:** Uncomment the notifications entry in `tabs` and the Notifications tab content block. The `NotificationsTab` component and `Bell` icon imports are kept with biome-ignore until the tab is re-enabled.
- **Do not delete** the commented blocks; they are marked with `COMMENT DO NOT DELETE` and reference this doc.

---

## Smooth Transitions (Step 5 – Guided flow)

On **Step 5/6: Final Review & Polish** (`/guided/step-5`), the **Smooth Transitions** (xfade) option is currently **frozen** and shown as **Coming soon**. Only **Hard cut** is selectable and is the default.

- **Layout:** Bottom padding of the main content was increased (`pb-56 md:pb-60`) so the **Transition Style** section is not overlapped by the fixed action buttons when scrolling.
- **Where:** `components/transitions/TransitionSelector.tsx`. The xfade radio option is commented out (do not delete; marked `COMMENT DO NOT DELETE`). A disabled **Smooth Transitions** card with a **Coming soon** badge is shown instead. Per-scene transition pickers and the xfade fallback block are gated by `smoothTransitionsEnabled = false`.
- **Step 5 page:** `app/[locale]/guided/step-5/page.tsx`. When syncing from the project, `transitionConfig.mode` is forced to `"hard_cut"` so assembly and display always use Hard cut while Smooth Transitions is frozen.
- **To implement:** Set `smoothTransitionsEnabled = true` in `TransitionSelector.tsx`, uncomment the xfade `Label` (and remove or repurpose the disabled “Coming soon” card), stop forcing `mode: "hard_cut"` in step-5’s `useEffect` so project `transitionConfig.mode` is respected, and ensure assembly/backend supports xfade (per-scene transitions, `transitionEffects`, etc.).
- **i18n:** `guided_step5.smooth_transitions_coming_soon` (“Coming Soon”) added in en.json.
- **Do not delete** the commented xfade option or the `smoothTransitionsEnabled` gate; they reference this doc.

---

## Audio in Convex + Assembly Fix (Step 4 → Assembly)

**Goal:** Narration and music files must be stored in Convex (not Fal URLs). Assembly must produce final video with duration = video length (e.g. 30s for 3×10s hard cut).

### Current state

- **Narration:** `generateNarration` (Convex action) calls Fal TTS, returns `audioUrl: result.audio.url` (Fal URL). Step 4 saves that Fal URL in `narrationTakes[].audioUrl` and, when selected, in `project.narrationAudioUrl`.
- **Music:** `generateMusic` (Convex action) calls Fal, returns `audioUrl: result.audio.url` (Fal URL). Step 4 saves that in `musicTakes[].audioUrl` and `project.musicAudioUrl`.
- **Assembly:** `buildFinalVideo` receives `project.narrationAudioUrl` and `project.musicAudioUrl`, passes them to Rendi (mix then merge). Rendi fetches from those URLs. Final duration = min(video length, mixed audio length) via `-shortest`; today mixed audio can be 26s (narration length) so final = 26s instead of 30s.
- **audioTracks table:** Empty; nothing inserts into it. Dashboard Audio tab builds the list from project + step4Data only.

### What must be done

#### 1. Store narration in Convex (not Fal URL)

- **In `convex/actions/narrationGeneration.ts`:** After Fal returns `result.audio.url`, add a step: `fetch(result.audio.url)` → get blob/buffer → `ctx.storage.store(blob)` (with appropriate MIME type, e.g. `audio/mpeg` for mp3) → `ctx.storage.getUrl(storageId)`.
- **Return** the Convex storage URL (and optionally `storageId` for future cleanup) instead of the Fal URL. Keep returning `durationMs`, `modelUsed`, etc.
- **Step 4** already saves `result.audioUrl` into `narrationTakes` and, when selected, into `project.narrationAudioUrl` via `projects.update`. No change needed there; the URL will now be a Convex URL.
- **Existing projects** with Fal narration URLs: either leave as-is (assembly can still fetch Fal) or add a one-time migration / “re-save” that downloads and re-stores to Convex. Prefer: new generations get Convex URLs; assembly accepts both (no change to assembly URL handling).

#### 2. Store music in Convex (not Fal URL)

- **In `convex/actions/musicGeneration.ts`:** After Fal returns `result.audio.url`, add the same pattern: fetch → `ctx.storage.store(blob)` (e.g. `audio/wav` or `audio/mpeg` per Fal format) → `ctx.storage.getUrl(storageId)`.
- **Return** the Convex storage URL instead of the Fal URL.
- Step 4 and project fields unchanged; they will now receive Convex URLs.

#### 3. Schema / project document

- **No schema change required.** `narrationAudioUrl` and `musicAudioUrl` (and `step4Data.*Takes[].audioUrl`) remain strings (URLs). Convex storage URLs are strings like `https://<deployment>.convex.cloud/api/storage/<id>`.
- Optional: add `narrationAudioStorageId` and `musicAudioStorageId` (optional `v.id("_storage")`) on the project if you want to track storage for deletion or quotas.

#### 4. Assembly: final duration = video length (30s)

- **This item no longer has a host in this template.** The audio-mix helper it described, `mixAudioWithRendi` in `lib/audio-processing.ts`, together with the merge helpers in `lib/rendi-video-processing.ts`, belonged to the retired video fork and was removed on 2026-07-22. The assembly action it fed, `convex/actions/videoAssembly.ts`, is likewise absent from this repository.
- **Kept for the record, not as a work item:** the original diagnosis was that mixed audio length is driven by amix (26s when narration is 26s) while the merge uses `-shortest`, so the final video came out at min(30, 26) = 26s. The intended fix was to pass an expected video duration down into the mix step and trim or pad the mix to exactly that length (`atrim=duration=N` then `apad=whole_dur=N`).
- **If a video pipeline is ever reintroduced here,** this duration-trimming behaviour is worth designing in from the start, but there is currently no file in the template to change.

#### 5. Rendi and Convex URLs

- Convex storage URLs are publicly readable (GET). Rendi’s merge job can fetch from them the same way it fetches from Fal. Ensure the Convex deployment URL is reachable from Rendi (no auth required for storage GET).

#### 6. audioTracks table (optional)

- **Current:** `audioTracks.listByProject` builds the list from project + step4Data; it does **not** read from the `audioTracks` table. So the table can stay empty for the current UX.
- **If you want** the table populated: after storing narration/music in Convex (in the generation actions or in a mutation called from Step 4), insert a row into `audioTracks` (projectId, type, title, assetId or storageId, duration, etc.). The schema uses `assetId`; if you store files in Convex storage only (no assets table), you could add an optional `storageId` to audioTracks or keep using project + step4Data as the source of truth and use audioTracks only for analytics/counts via `getProjectAudioCount`. Clarify product need (single source of truth = project + step4Data vs. denormalized audioTracks) before adding inserts.

### Order of work

1. **Narration:** In `generateNarration`, after Fal result, fetch audio → `ctx.storage.store` → return Convex URL. Verify Step 4 and assembly still work (assembly receives Convex URL, Rendi fetches it).
2. **Music:** Same in `generateMusic`: fetch → store → return Convex URL.
3. **Assembly duration:** dropped. The helpers this step would have changed were removed with the retired video fork (see section 4 above); there is nothing in this template to modify.
4. Optional: Backfill or migration for existing projects with Fal URLs (download + store to Convex, update project); or leave old projects as Fal until they re-generate.
5. Optional: Populate `audioTracks` when saving a take, if product requires it.
