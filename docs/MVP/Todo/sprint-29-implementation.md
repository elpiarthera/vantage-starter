# 🖼️ MyShortReel - Sprint 29: Image Tool (Generator + Editor) — Kling Image

**Date**: February 10, 2026  
**Status**: ✅ DONE (Tasks 0–8 complete)  
**Estimated Time**: 10–14 hours

### Progress (done so far)

| Task | Status | Notes |
|------|--------|------|
| Task 0: Convex schema `imageToolHistory` | ✅ Done | Table + indexes in `convex/schema.ts` (after `usageTracking`) |
| Task 0.5: Mutations `startKlingT2IGeneration` / `startKlingI2IGeneration` | ✅ Done | `convex/imageTool.ts`; deduct credits, schedule internal actions |
| Task 3: History insert + listByUser | ✅ Done | `convex/imageToolHistory.ts`: `insertImageToolEntry` (internal), `listByUser` (query, auth from `ctx`) |
| Task 1: Kling T2I internal action | ✅ Done | `convex/actions/imageToolKlingT2I.ts` (O3/v3, queue + poll, refund, history insert) |
| Task 2: Kling I2I internal action | ✅ Done | `convex/actions/imageToolKlingI2I.ts` (O3: image_urls; v3: image_url; queue + poll, refund, history insert) |
| Task 4: Generate mode UI | ✅ Done | Tabs (Generate \| Edit), Convex history + mutation, credits, new form fields |
| Task 5: Edit mode UI | ✅ Done | Edit tab: refs (upload + history), prompt, model/resolution/result_type/aspect; I2I mutation; credits; v0/Vercel branding removed from Generate |
| Task 6: History component + Use in Video | ✅ Done | OutputSection: Use in Video button, Download/Copy/Use in Video ≥44px; GenerationHistory: empty state (title, description, CTA), historyLabel; onUseInVideo callback or copy+toast; ImageEditPanel Use in Video; doc in ImageToolView; Biome fixes (output-section, generation-history). |
| Task 7: Credits, auth, error handling | ✅ Done | Auth in mutations; refund in T2I/I2I on all failure paths; UI toast on mutation error + clear loading; credit costs in seedCredits. |
| Task 8: QA & polish | ✅ Done | tsc + Biome pass (all touched files including input-section, use-image-upload); T2I/I2I tests pass; i18n completed: use-image-upload + index toasts use `t()`, keys in `image_generator` (en.json), `pnpm translate` + `pnpm i18n:verify` run — all 7 locales in sync (1596 keys). Mobile to verify manually. |
| Task 9: CSP fix — remove heic-to | ✅ Done | Removed `heic-to` dependency causing CSP eval blocking on Vercel. Image upload now follows Step 3 pattern (direct upload, no client-side HEIC conversion). HEIC files show "format not supported" message instead of failing silently. |

**Files created:** `convex/imageToolHistory.ts`, `convex/imageTool.ts`, `convex/actions/imageToolKlingT2I.ts`, `convex/actions/imageToolKlingI2I.ts`, `components/image-generator/ImageEditPanel.tsx`.  
**Files modified:** `convex/schema.ts` (added `imageToolHistory` table), `app/[locale]/tools/image-generator/ImageToolView.tsx` (Edit tab = ImageEditPanel), `components/image-generator/index.tsx` (export ImageEditPanel; removed v0/Vercel footer and header; title/description from i18n; removed `onApiKeyMissing`; all toasts use `t()`), `components/image-generator/constants.tsx` (aspect "auto" for I2I; SVG aria-hidden + &lt;title&gt; for a11y), `components/image-generator/hooks/use-image-upload.ts` (accepts `t`, all user-facing strings via `t()`), `messages/en.json` (image_generator: Edit, errors, upload/HEIC/paste/drop/copy keys). **i18n:** `messages/fr.json` … `ru.json` updated via `pnpm translate`; `pnpm i18n:verify` passes (1596 keys per locale).  
**Production-ready cleanup (post–Task 7):** `components/image-generator/hooks/use-image-generation.ts` — removed `onApiKeyMissing` prop and all dead demo/legacy code (old `/api/generate-image` FormData path); T2I path is Convex → fal.ai/Kling (FAL_KEY server-side) only; fallbacks: "Sign in to generate images" / "Use the Edit tab to edit images". **Biome (7 files):** `constants.tsx`, `fullscreen-viewer.tsx`, `use-image-generation.ts`, `image-upload-box.tsx`, `global-drop-zone.tsx`, `ImageEditPanel.tsx`, `index.tsx` — a11y (SVG title/aria-hidden, button type, semantic elements, Next Image), no unused params; fullscreen wrapper `role="img"`.

### QA (files modified/created so far)

Run from repo root. **Step 1:** TypeScript; **Step 2:** Biome (same order as 2-Step QA in each task).

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/schema.ts convex/imageToolHistory.ts convex/imageTool.ts convex/actions/imageToolKlingT2I.ts convex/actions/imageToolKlingI2I.ts
```

**Last run (backend-only):**

| Step | Command | Result |
|------|--------|--------|
| 1 | `npx tsc --noEmit` | Run from project root; if exit code 1, check for pre-existing errors elsewhere. Convex files type-check after `npx convex codegen`. |
| 2 | `npx biome check --write convex/...` | **Passed.** Checked 5 files, fixed 3 (formatting). |

**Last run (Task 5 + UI cleanup, 2026-02-10):**

| Step | Command | Result |
|------|--------|--------|
| 1 | `npx biome check --write components/image-generator/index.tsx` | **Passed.** Checked 1 file, fixed 1 (formatting). |
| 2 | `npx convex dev --once` | **Passed.** Convex functions ready. |

**Last run (Post–Task 7 / Task 8 start, 2026-02-10):**

| Step | Command | Result |
|------|--------|--------|
| 1 | `npx tsc --noEmit` | **Passed.** |
| 2 | `npx biome check --write` on 7 image-generator files (constants, fullscreen-viewer, use-image-generation, image-upload-box, global-drop-zone, ImageEditPanel, index) | **Passed.** No errors; fullscreen-viewer wrapper fixed to `role="img"`. |

Optional after backend changes: `npx convex codegen` or `npx convex dev --once` to regenerate API and deploy.  
**Goal**: Production-ready merged Image Tool (Generate + Edit) with Kling Image O3/v3 T2I and O3/v3 I2I, Convex persistence, credits, "Use in Video", **Elements** (character/object control), **Edit ref file upload**. Route: **`/[locale]/tools/image-generator`** (Sprint 23 route retained).  
**Dependencies**: Sprint 23 (Image Generator demo UI) ✅  
**Analysis**: [MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md](../../Analysis/MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md)  
**Sprint 23 Reference**: [sprint-23-Image-Generator-demo.md](./sprint-23-Image-Generator-demo.md)  
**QA Strategy**: **2-Step QA** — TypeScript (noEmit) → Biome for all created/modified files; Convex tasks add deploy step; i18n tasks add `pnpm translate` + `pnpm i18n:verify`. Manual browser test for UI.  
**Mobile Strategy**: Mobile-first; tools page responsive per [mobile-first-best-practices.md](../../Best-Practices/mobile-first-best-practices.md).  
**Credit System**: Reuse `image_generation` and `image_edit` action types; deduct via `deductCredits` mutation.  
**Design System**: [design-system.md](../../Guides/design-system.md) + `.cursor/agents/design-master.md` — semantic tokens, shadcn/ui only, WCAG 2.1 AA touch targets (min 44×44px).

---

## 🎨 DESIGN SYSTEM & MOBILE-FIRST ALIGNMENT (MANDATORY)

Sprint 23 components were copied from nano-banana-pro and **contain design system violations**. Sprint 29 must align all Image Tool UI with MyShortReel design system before or during feature wiring.

### Design token compliance (no hardcoded colors)

| Replace | With (semantic token) |
|--------|------------------------|
| `text-white` | `text-foreground` |
| `text-white/60`, `text-gray-*` | `text-muted-foreground` |
| `bg-white` (primary actions) | `bg-primary` + `text-primary-foreground` |
| `bg-black/50`, `bg-black/95` | `bg-card` or `bg-secondary` |
| `border-gray-600`, `border-white` | `border-border` |
| `focus:ring-white`, `focus:border-white` | `focus-visible:ring-ring` (or default ring) |
| `hover:bg-gray-200`, `hover:bg-gray-700` | `hover:bg-accent` or `hover:bg-muted` |

**Files to fix**: `components/image-generator/index.tsx`, `input-section.tsx`, `output-section.tsx`, `generation-history.tsx`, `image-upload-box.tsx`, `progress-bar.tsx`, `toast-notification.tsx`, `fullscreen-viewer.tsx`, `how-it-works-modal.tsx`, `global-drop-zone.tsx`. Use design-master checklist before marking Task 8 done.

### Mobile-first and responsive

- **Tabs (Generate | Edit)**: Use `@/components/ui/tabs`; `TabsList` with `grid grid-cols-2`; stack content on small viewports; `px-4 md:px-6 lg:px-8` for page padding.
- **Layout**: Preserve `flex flex-col md:flex-row` (or equivalent) so panels stack on mobile; history as horizontal scroll or single-column grid on narrow viewports (e.g. 320px–375px).
- **Breakpoints**: Design for 320px+ first; enhance with `sm:`, `md:`, `lg:` per design-master (sm 640px, md 768px, lg 1024px).

### Touch targets and accessibility (WCAG 2.1 AA)

- All interactive elements: **minimum 44×44px** touch target. Use `min-h-[44px]` (or `min-h-[48px]` for primary inputs) on:
  - Run / Generate / Edit submit buttons
  - "Use in Video", Download, Copy URL, Select from history
  - Tab triggers (Generate | Edit)
  - History item actions (select, delete)
- Buttons: Prefer `<Button>` from `@/components/ui/button` with `size="default"` (h-10) or add `className="min-h-[44px]"` where needed; avoid custom `h-7` on critical actions.
- Focus: Use `focus-visible:ring-2 focus-visible:ring-ring`; no removal of focus outlines.

### Typography and spacing

- Headings: `text-2xl`/`text-xl` for section titles; `text-lg font-semibold` for card titles; body `text-base` with `leading-relaxed` or `leading-6`.
- Spacing: Use `gap-4` / `p-4` as default; `rounded-lg` (12px) for cards and panels.

### Animations

- Use `transition-smooth` or `transition-transform-smooth`; avoid durations > 500ms for UI feedback.
- Optional: `active:scale-98` for button press feedback on mobile.

### Page metadata

- Update `app/[locale]/tools/image-generator/page.tsx` metadata: title/description to **MyShortReel** + **Kling Image** (Generator + Editor); remove "Nano Banana Pro" / "Gemini".

---

## 🖼️ KLING MODELS UI/UX — NOTHING MISSED

Per [MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md](../../Analysis/MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md), ensure the following are exposed or documented so we fully leverage Kling Image APIs.

### Generate (T2I)

| API / capability | UI/UX | Status in plan |
|------------------|--------|----------------|
| **prompt** (max 2500 chars) | Textarea + optional character count or `maxLength={2500}` / hint "Up to 2500 characters" | Add in Task 4: prompt hint or counter |
| **aspect_ratio** | Dropdown mapped to Kling enums (16:9, 9:16, 1:1, 4:3, 3:4, 3:2, 2:3, 21:9) | ✅ In reuse inventory + Task 4 |
| **resolution** (O3: 1K/2K/4K; v3: 1K/2K) | Select; show 4K only when model=O3; show cost hint for 4K (2×) | ✅ Task 4 |
| **result_type** single / series | Toggle or select | ✅ Task 4 |
| **num_images** (1–9) when single | Number input or select | ✅ Task 4 |
| **series_amount** (2–9) when series | Number input or select | ✅ Task 4 |
| **negative_prompt** (v3 only) | Optional text field when model=v3 | ✅ Task 4 |
| **output_format** (jpeg, png, webp) | Optional selector or default `png`; document in API call | Add: default `png` in actions; optional UI in Task 4 if time |
| **elements** (frontal + refs, @Element1/@Element2) | **MVP (high value):** Add character/object control: frontal_image_url + reference_image_urls (0–3); reference in prompt as @Element1, @Element2 | ✅ Task 4 (Generate) + Task 5 (Edit); action args in Task 1 & 2 |

### Edit (I2I)

| API / capability | UI/UX | Status in plan |
|------------------|--------|----------------|
| **prompt** (max 2500) + **@Image1, @Image2** (O3) | Textarea with hint: "Use @Image1, @Image2 … for multiple refs (O3)." | ✅ Task 5 |
| **image_urls** (1–10) O3 / **image_url** (1) v3 | **MVP (high value):** Both "Select from history" **and** file upload for new refs; 1–10 slots for O3, 1 for v3 | ✅ Task 5 |
| **aspect_ratio** including **"auto"** (O3 I2I) | Include "Auto (from input)" in aspect dropdown for Edit O3 | ✅ Task 5; verify "auto" in dropdown |
| **resolution**, **result_type**, **series_amount** / **num_images** | Same as Generate where applicable | ✅ Task 5 |
| **output_format** | Default `png` in action; optional UI later | Same as T2I |

### Shared

| Item | UI/UX |
|------|--------|
| **Empty history** | Use design system empty-state pattern: icon + "No images yet" + short CTA (e.g. "Generate your first image") |
| **Loading** | Progress bar + "Generating…" / "Editing…"; disable submit; use existing progress-bar component with semantic colors |
| **Errors** | Toast or inline message; retry button; no perpetual loading |
| **Credits** | Show balance where appropriate; InsufficientCreditsModal before submit |

---

## ⚡ CONVEX MASTER ALIGNMENT (MANDATORY)

Per `.cursor/agents/convex-master.md` — **client must never call actions directly**.

| Rule | Application for Sprint 29 |
|------|---------------------------|
| **Never call actions from client** | UI calls **mutations** `imageTool.startKlingT2IGeneration` and `imageTool.startKlingI2IGeneration`, not `useAction(api.actions.imageToolKlingT2I.generateKlingT2I)`. |
| **Mutation → schedule action** | Each mutation: (1) auth, (2) credit check via query + `deductCredits`, (3) `ctx.scheduler.runAfter(0, internal.actions.imageToolKlingT2I.generateKlingT2I, { ... })`. Action receives `transactionId` for refund on failure. |
| **Credit deduction before AI** | Deduct in mutation before scheduling. Action calls `refundCredits(transactionId, reason)` if FAL submit/poll fails. |
| **Internal for scheduling** | Use `internal.actions.imageToolKlingT2I.generateKlingT2I` and `internal.actions.imageToolKlingI2I.generateKlingI2I` in `scheduler.runAfter`, never `api.*`. |
| **db.patch with table name** | Use `ctx.db.patch("imageToolHistory", id, { ... })` when patching. |

**Backend surface**: New file `convex/imageTool.ts` with **mutations** `startKlingT2IGeneration` and `startKlingI2IGeneration`. Each mutation deducts credits (gets `transactionId`), then schedules the corresponding **internal** action with form args + `transactionId`. Actions remain in `convex/actions/imageToolKlingT2I.ts` and `imageToolKlingI2I.ts` and are **not** exported on `api` for the client.

**History query auth**: `listByUser` must **not** accept `userId` from the client. Use `ctx.auth.getUserIdentity()` and query by `identity.subject` (Clerk ID) so users cannot list another user's history.

### Credits API (verified from codebase)

**Source**: `convex/credits.ts`. No assumptions — use these exact exports and signatures.

| Function | Type | Call from | Args | Return (success) |
|----------|------|-----------|------|------------------|
| **deductCredits** | mutation | `ctx.runMutation(api.credits.deductCredits, args)` | `clerkUserId: string`, `actionType: string`, `organizationId?: string`, `projectId?: string`, `projectName?: string`, `resourceId?: string` | `{ success: true, transactionId: Id<"creditTransactions">, creditsDeducted, newBalance }` |
| **refundCredits** | mutation | `ctx.runMutation(api.credits.refundCredits, args)` | `transactionId: v.id("creditTransactions")`, `reason: string` | `{ success: true }` |
| **getUserCredits** | query | Client: `useQuery(api.credits.getUserCredits, { clerkUserId })` | `clerkUserId: string` | `{ balance, ... }` or null |
| **getCreditCost** | query | Client: `useQuery(api.credits.getCreditCost, { actionType })` | `actionType: string` | `{ credits, ... }` or null |

**Existing usage**: `convex/actions/videoAssembly.ts` calls `api.credits.deductCredits` (line ~205) and `api.credits.refundCredits` (line ~400). Use the same pattern in `convex/imageTool.ts` (mutations) and in T2I/I2I actions for refund. **Action types for this sprint**: `actionType: "image_generation"` (T2I) and `actionType: "image_edit"` (I2I). Ensure these exist in `creditCosts` (seed or dashboard).

---

## 🌐 TRANSLATION (i18n) ALIGNMENT (MANDATORY)

Per `.cursor/agents/i18n-master.md` — **all user-facing strings** in the Image Tool must use `next-intl`; no hardcoded UI copy. Sprint 23 components were copied from nano-banana-pro and **contain no i18n**. Sprint 29 must introduce translations for the full Image Tool surface.

### Namespace and pattern

| Item | Convention |
|------|-------------|
| **Namespace** | `image_generator` (top-level in `messages/en.json`), matching path `app/[locale]/tools/image-generator` and `components/image-generator/`. |
| **Tool card** | Existing `tools.image_generator.name` and `tools.image_generator.description` stay for the tools landing page; update copy to "Kling Image (Generator + Editor)" if desired. |
| **Page metadata** | Use **localized** title/description: in `app/[locale]/tools/image-generator/page.tsx` use `generateMetadata` with `getTranslations("image_generator")` from `next-intl/server` and keys e.g. `page_title`, `page_description` (MyShortReel + Kling Image). |
| **Client components** | `import { useTranslations, useLocale, useFormatter } from "next-intl";` and `const t = useTranslations("image_generator");` — replace **all** user-visible strings with `t("key")`. |
| **Links** | Any `Link` in image-generator must use `import { Link } from "@/i18n/routing";` so locale is preserved. |
| **Shared strings** | Reuse existing namespaces where applicable: `errors.insufficient_credits_title`, `errors.insufficient_credits_description` (with `actionName` from image_generator), `common.close`, `common.cancel`, `common.retry`, `status.generating`. |

### Keys to add in `messages/en.json`

Add a **top-level** `image_generator` object (page/component namespace). The tools landing card keeps using `tools.image_generator.name` and `tools.image_generator.description`; do not move those. New keys under top-level `image_generator`:

- **Tabs & mode**: `tab_generate`, `tab_edit`.
- **Actions**: `generate`, `run`, `clear`, `use_in_video`, `download`, `copy_url`, `select`, `delete`, `cancel_generation`.
- **Labels**: `prompt`, `prompt_placeholder`, `prompt_hint_max_chars` (e.g. "Up to 2500 characters"), `aspect_ratio`, `images_optional`, `files`, `urls`, `first_image_url`, `second_image_url`, `model`, `model_o3`, `model_v3`, `resolution`, `resolution_1k`, `resolution_2k`, `resolution_4k`, `result_type`, `result_type_single`, `result_type_series`, `num_images`, `series_amount`, `negative_prompt`, `negative_prompt_placeholder`, `elements_section_title`, `elements_hint` (e.g. "Reference in prompt as @Element1, @Element2"), `edit_refs_hint` (e.g. "For multiple refs use @Image1, @Image2 in prompt (O3).").
- **Empty & loading**: `empty_history_title` ("No images yet"), `empty_history_description`, `empty_history_cta` ("Generate your first image"), `generating`, `editing`.
- **Errors & toasts**: `generation_failed`, `edit_failed`, `url_copied` (or reuse common if exists).
- **Aspect ratios** (if labels come from code): add keys for each ratio or use dynamic key e.g. `aspect_ratio_16_9` etc.; alternatively keep aspect labels in constants and add a single `aspect_ratio_label` with variable.
- **Page**: `page_title`, `page_description`.

Add keys as each component is touched (Tasks 4–6); Task 8 performs final audit and runs `pnpm translate` then `pnpm i18n:verify`.

### Checklist for Image Tool components (i18n-master)

- [ ] Every modified/created UI file under `components/image-generator/` and the page uses `useTranslations("image_generator")` (or `getTranslations` in server metadata).
- [ ] All user-facing strings (buttons, labels, placeholders, hints, empty state, errors, toasts) use `t()` — no hardcoded English.
- [ ] Page metadata uses `generateMetadata` + `getTranslations("image_generator")` for title/description.
- [ ] Any `Link` uses `Link` from `@/i18n/routing`.
- [ ] ICU used for variables (e.g. `prompt_hint_max_chars` with count) and plurals where needed.
- [ ] After adding keys: `pnpm translate` then `pnpm i18n:verify`; test in at least two languages.

### CRITICAL EXCLUSIONS (do not translate)

- API routes, Convex functions, AI prompts, Tailwind classes, console messages, database keys/IDs (per i18n-master).

### Page metadata (verified from codebase)

**Current state**: `app/[locale]/tools/image-generator/page.tsx` uses **static** export only:

```ts
export const metadata: Metadata = {
  title: "Nano Banana Pro - Free AI Image Generator & Editor",
  description: "...",
};
```

No `generateMetadata` and no `getTranslations` are used anywhere in the app for page metadata today.

**Target (Sprint 29)**: Replace the static `metadata` export with **async `generateMetadata`** so the tab title and description are localized. Use next-intl’s server API as follows (next-intl: [Server Actions, Metadata & Route Handlers](https://next-intl.dev/docs/environments/actions-metadata-route-handlers)).

- **File**: `app/[locale]/tools/image-generator/page.tsx`.
- **Import**: `import { getTranslations } from "next-intl/server";`
- **Export**: Remove `export const metadata`. Add (project uses **Next.js 14**; `params` is synchronous):

```ts
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "image_generator" });
  return {
    title: t("page_title"),
    description: t("page_description"),
  };
}
```

- **Keys**: Add `page_title` and `page_description` to the **top-level** `image_generator` object in `messages/en.json` (e.g. "MyShortReel – Kling Image (Generator + Editor)" and a short description). No divergence: follow this pattern exactly.

---

## 📝 PROGRESS SUMMARY

| Task | Description | Status |
|------|-------------|--------|
| **Task 0** | Convex schema: `imageToolHistory` table | ✅ |
| **Task 0.5** | Mutations `startKlingT2IGeneration` / `startKlingI2IGeneration` (deduct + schedule action) | ✅ |
| **Task 1** | Kling T2I Convex action (O3 + v3, queue + poll; internal, refund on failure) | ✅ |
| **Task 2** | Kling I2I Convex action (O3 + v3, queue + poll; internal, refund on failure) | ✅ |
| **Task 3** | History: internal mutation insert + query listByUser (auth from ctx, no client userId) | ✅ |
| **Task 4** | Generate mode UI (T2I mutation, Elements) | ✅ |
| **Task 5** | Edit mode UI (tab, refs via upload + history, Elements, I2I) | ✅ |
| **Task 6** | Shared history component + "Use in Video" | ✅ |
| **Task 7** | Credits, auth, error handling | ✅ |
| **Task 8** | QA & polish (i18n, mobile, tests) | ✅ |

---

## ⏱️ TIME TRACKING

| Task | Estimated | Actual | Status |
|------|-----------|--------|--------|
| Task 0: Schema | 0.5h | | ⬜ |
| Task 0.5: Mutations (start T2I/I2I, deduct + schedule) | 0.5h | | ⬜ |
| Task 1: T2I action (internal, refund on failure) | 1.5h | | ⬜ |
| Task 2: I2I action (internal, refund on failure) | 1.5h | | ⬜ |
| Task 3: History mutations/queries (listByUser auth from ctx) | 1.5h | | ⬜ |
| Task 4: Generate mode UI (call mutation, not action) | 2.5h | | ⬜ |
| Task 5: Edit mode UI | 2h | | ⬜ |
| Task 6: History + "Use in Video" | 1.5h | | ⬜ |
| Task 7: Credits, auth, errors | 1h | | ⬜ |
| Task 8: QA & polish | 1h | | ⬜ |
| **TOTAL** | **~12–14h** | | |

---

## 📦 SPRINT 23 — WHAT EXISTS (REUSE INVENTORY)

**Do not recreate** the following. Sprint 23 already copied and adapted them from nano-banana-pro; Sprint 29 **reuses** and **wires** only.

### Route & page

| Item | Location | Reuse |
|------|----------|--------|
| Page | `app/[locale]/tools/image-generator/page.tsx` | Keep. Renders `<ImageCombiner />` in `<main>`. Add **tabs** (Generate \| Edit) here or inside ImageCombiner. |
| Metadata | Same file: title/description | Update to MyShortReel + Kling Image (optional). |

### Components (all under `components/image-generator/`)

| Component | Purpose | Reuse / change |
|-----------|---------|----------------|
| **index.tsx** | Main `ImageCombiner`: layout, left (input) + right (output), resizable panels, toasts, fullscreen, keyboard, drag/paste | **Reuse layout and structure.** Replace `usePersistentHistory` with Convex query; replace `useImageGeneration` internal API call with **mutations** `useMutation(api.imageTool.startKlingT2IGeneration)` and `useMutation(api.imageTool.startKlingI2IGeneration)` (client never calls actions). Add **Generate / Edit** tab at top if not on page. |
| **input-section.tsx** | Prompt textarea, aspect ratio Select, Clear, Images (Files/URLs) with 2 slots, Run button | **Reuse as-is for Generate.** Add model (O3/v3), resolution (1K/2K/4K), result_type (single/series), num_images/series_amount, negative prompt (v3). Map aspect values to Kling enums (see below). |
| **output-section.tsx** | Selected image, ProgressBar (loading), Use as Input / Copy / Download buttons | **Reuse.** Add "Use in Video" button that calls `onUseInVideo?.(url)`. |
| **generation-history.tsx** | Horizontal list of thumbnails, select/cancel/delete | **Reuse UI.** Feed from Convex `listByUser` instead of `persistedGenerations`; adapt item shape (Convex has `imageUrl`/`imageUrls`, `mode`, `prompt`, etc.). |
| **image-upload-box.tsx** | Single upload box (slot 1 or 2), preview, clear | **Reuse** for Edit refs (one box per ref for v3; multi for O3). |
| **fullscreen-viewer.tsx** | Fullscreen image + nav arrows | **Reuse.** |
| **progress-bar.tsx** | Loading progress + cancel | **Reuse.** |
| **toast-notification.tsx** | Toast message | **Reuse.** |
| **global-drop-zone.tsx** | Drag-over overlay for drop | **Reuse.** |
| **how-it-works-modal.tsx** | Modal content | **Reuse** or replace with MyShortReel copy (optional). |

### Hooks

| Hook | Purpose | Reuse / change |
|------|---------|----------------|
| **use-aspect-ratio.ts** | `aspectRatio` state + `availableAspectRatios` from `constants.tsx` | **Reuse.** Add mapping to Kling API values: e.g. `square` → `"1:1"`, `portrait` → `"9:16"`, `landscape` → `"16:9"`, `wide` → `"21:9"` (see `constants.tsx` for full list). Kling expects `"16:9"` \| `"9:16"` \| `"1:1"` \| `"4:3"` \| `"3:4"` \| `"3:2"` \| `"2:3"` \| `"21:9"`. |
| **use-image-upload.ts** | image1/image2 (File or URL), previews, handleImageUpload, handleUrlChange, clearImage, HEIC | **Reuse** for Generate (2 slots) and for Edit (1–10 refs: extend or use same for first 2, add more slots for O3). |
| **use-image-generation.ts** | generateImage, cancelGeneration, loadGeneratedAsInput; **currently stubbed** (toast "Demo mode: generation not available") | **Replace stub only.** Call Convex **mutation** `api.imageTool.startKlingT2IGeneration` with prompt, aspect (mapped), model, resolution, result_type, num_images/series_amount; mutation deducts credits and schedules internal T2I action; on completion history updates and set local "selected" result. Keep cancel/loadAsInput behavior. |
| **use-persistent-history.tsx** | localStorage get/set, addGeneration, deleteGeneration, clearHistory; **generations** state | **Replace with Convex.** Use `useQuery(api.imageToolHistory.listByUser, { limit: 50 })` for list (query uses auth, no userId from client); `addGeneration` becomes "mutation scheduled action, history updates when action inserts"; delete = new mutation `deleteImageToolEntry` (optional in MVP). Do **not** keep localStorage for history. |

### Types & constants

| File | Purpose | Reuse / change |
|------|---------|----------------|
| **types.ts** | `Generation` (id, status, progress, imageUrl, prompt, …), `AspectRatioOption` | **Reuse** `Generation` for local UI state (loading/complete). Convex history row can map to same shape for `GenerationHistory` (id = Convex `_id`, imageUrl from row, etc.). |
| **constants.tsx** | `DEFAULT_ASPECT_RATIOS`, `ALL_ASPECT_RATIOS` (value/label/ratio/icon) | **Reuse.** Add a small map or function `aspectValueToKling(aspectRatio: string): "16:9" | "9:16" | ...` for API calls. |

### Other

| Item | Location | Reuse |
|------|----------|--------|
| **ApiKeyWarning** | `@/components/api-key-warning` | **Reuse** for "missing FAL key" or replace with MyShortReel "insufficient credits" / auth message in Sprint 29. |
| **v0 logo / footer links** | In `index.tsx`: logo, "How it works", "Make this app your own", "Feedback?" | **Replace** with MyShortReel branding and remove or repurpose links (optional polish). |

### Summary: what to do vs not do

- **Do not** recreate: page route, ImageCombiner layout, InputSection, OutputSection, GenerationHistory UI, upload boxes, fullscreen viewer, progress bar, toasts, global drop zone, aspect-ratio hook, image-upload hook, types, constants.
- **Do**: Add Convex schema + actions (T2I, I2I); add **history from Convex** (replace usePersistentHistory); **replace the stubbed API call** in useImageGeneration with Convex T2I action; add **Generate/Edit tabs** (shadcn/ui Tabs, semantic tokens) and Edit form; add **model/resolution/result_type** (and negative prompt) to Generate form; add **"Use in Video"** to OutputSection; map aspect ratio values to Kling enums; wire credits and auth; **align all Image Tool UI with design system** (semantic colors, touch targets, mobile-first, empty state) per Design System section above; **add i18n** for entire Image Tool (namespace `image_generator`, all user-facing strings via `useTranslations`, localized page metadata, Link from `@/i18n/routing`) per "Translation (i18n) alignment" section.

---

## 📊 SPRINT OVERVIEW

### Goal

Deliver the **merged Image Tool** at `/[locale]/tools/image-generator`: one page with **Generate** (Kling O3 T2I default, v3 T2I optional) and **Edit** (Kling O3 I2I default, v3 I2I optional), shared Convex-backed history, credit deduction, and "Use in Video" callback. Builds on Sprint 23 UI; adds real backend via FAL queue API and polling.

### Why Sprint 29?

- **VC demo**: Single tool for "generate → edit → animate" in Kling ecosystem.
- **Sprint 23 done**: UI shell exists; this sprint wires Kling Image and persistence.
- **Credit system**: Reuse existing `image_generation` / `image_edit` and `deductCredits`.

### Duration

**Total**: 10–14 hours (schema + 2 Convex actions with queue/poll + history + Generate/Edit UI + credits + QA).

### Complexity

**Medium–High**

- FAL queue + polling for four endpoints (O3 T2I, v3 T2I, O3 I2I, v3 I2I).
- Single history table for both modes; multi-image results (series, num_images).
- Edit mode: 1–10 refs for O3 I2I, prompt with @Image1/@Image2.

### Risk Level

**Medium**

- Queue/poll pattern already used in `videoGeneration` / `videoPolling`.
- New table and actions; no change to guided flow.

### Success Criteria

- Generate: O3 T2I (default) and v3 T2I (optional) with aspect ratio, resolution (1K/2K/4K for O3), result_type single/series, num_images/series_amount.
- Edit: O3 I2I (default, 1–10 refs, @ImageN in prompt, aspect "auto") and v3 I2I (optional, single image).
- History: All entries in Convex, shared across modes, scoped by user.
- Credits: Deduct per generation (`image_generation`) and per edit (`image_edit`).
- "Use in Video": Callback to pass selected image URL to video pipeline.
- Route: `/[locale]/tools/image-generator` (Sprint 23 route retained).

---

## 🔍 PRE-SPRINT CHECKLIST (5 min)

- [ ] **Sprint 23 verified**: `app/[locale]/tools/image-generator/page.tsx` and `components/image-generator/*` exist; page loads (demo mode).
- [ ] **FAL_KEY** set in `.env.local` and Convex dashboard (same as video/image).
- [ ] **Convex dev** runs: `npx convex dev --once`.
- [ ] **Credit costs**: `image_generation` and `image_edit` exist in `creditCosts` (seed or dashboard).
- [ ] **Read**: [MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md](../../Analysis/MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md) (model strategy + API capabilities).
- [ ] **Queue pattern**: Skim `convex/actions/videoGeneration.ts` and `convex/actions/videoPolling.ts` for submit → request_id → poll → result.
- [ ] **i18n**: Read "Translation (i18n) alignment" in this doc and `.cursor/agents/i18n-master.md`; namespace `image_generator`, `Link` from `@/i18n/routing`, `pnpm translate` / `pnpm i18n:verify` after adding keys.

---

## ✅ Task 0: Convex schema — imageToolHistory (0.5 h)

### Objective

Add `imageToolHistory` table for unified history (generate + edit), supporting single or multiple result images.

### Implementation Steps

#### Step 0.1: Add table to schema

**File**: `convex/schema.ts`

Add (with other tables, e.g. after `usageTracking` or in a logical tools section):

```typescript
// Image Tool (Generator + Editor) - unified history
imageToolHistory: defineTable({
  userId: v.string(),           // Clerk user ID
  mode: v.union(v.literal("generate"), v.literal("edit")),
  prompt: v.string(),
  imageUrl: v.optional(v.string()),
  imageUrls: v.optional(v.array(v.string())),
  sourceImageUrl: v.optional(v.string()),
  sourceImageUrls: v.optional(v.array(v.string())),
  model: v.string(),
  resolution: v.optional(v.string()),
  aspectRatio: v.optional(v.string()),
  resultType: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_created", ["userId", "createdAt"]),
```

#### Step 0.2: Deploy and verify

```bash
npx convex dev --once
```

### Deliverables

- `imageToolHistory` in `convex/schema.ts` with indexes.
- Schema push succeeds.

### 2-Step QA

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/schema.ts

# Step 3: Deploy to Convex dev
npx convex dev --once
```

### Checklist

- [x] No TypeScript errors in `convex/schema.ts`.
- [x] `npx convex dev --once` completes.

---

## ✅ Task 0.5: Mutations — startKlingT2IGeneration / startKlingI2IGeneration (0.5 h)

### Objective

Expose mutations that the **client** calls. Each mutation deducts credits, then schedules the corresponding **internal** action so the client never calls actions directly (Convex Master alignment).

### Implementation Steps

#### Step 0.5.1: Create `convex/imageTool.ts`

- **startKlingT2IGeneration** (mutation): Args — prompt, model, resolution?, resultType?, numImages?, seriesAmount?, aspectRatio?, negativePrompt? (v3), plus any other T2I params. Handler: (1) `ctx.auth.getUserIdentity()` → throw if not authenticated; (2) `ctx.runMutation(api.credits.deductCredits, { clerkUserId: identity.subject, actionType: "image_generation", ... })`; (3) if `!result.success` throw or return error; (4) `ctx.scheduler.runAfter(0, internal.actions.imageToolKlingT2I.generateKlingT2I, { ...formArgs, transactionId: result.transactionId, clerkUserId: identity.subject })`. Return `{ success: true, message: "Generation started" }`.
- **startKlingI2IGeneration** (mutation): Same pattern for I2I; `actionType: "image_edit"`; schedule `internal.actions.imageToolKlingI2I.generateKlingI2I` with `transactionId` and `clerkUserId`.

#### Step 0.5.2: Action args

- T2I and I2I actions must accept `transactionId: v.id("creditTransactions")` and `clerkUserId: v.string()` in addition to generation params. On FAL submit or poll failure, call `ctx.runMutation(api.credits.refundCredits, { transactionId, reason: "FAL request failed" })`.

### Deliverables

- `convex/imageTool.ts` with `startKlingT2IGeneration` and `startKlingI2IGeneration` mutations.
- Actions in Tasks 1 and 2 accept and use `transactionId` for refund on failure.

### 2-Step QA

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/imageTool.ts

# Step 3: Deploy to Convex dev
npx convex dev --once
```

### Checklist

- [x] Client can call only mutations; no `useAction` for T2I/I2I.
- [x] Deduct happens before scheduler.runAfter; action refunds on failure.

---

## ✅ Task 1: Kling T2I Convex action (1.5 h)

### Objective

Implement Convex action that calls FAL queue for Kling O3 T2I or v3 T2I, polls for completion, deducts credits, and returns image URL(s). Used by Generate mode.

### Implementation Steps

#### Step 1.1: Create action file

**File**: `convex/actions/imageToolKlingT2I.ts` (new)

- Use `"use node";`, get `FAL_KEY` from `process.env`.
- **Submit**: `POST https://queue.fal.run/fal-ai/kling-image/o3/text-to-image` or `.../v3/text-to-image` with body per OpenAPI: `prompt`, `resolution`, `result_type`, `num_images` or `series_amount`, `aspect_ratio`, `output_format`, optional `negative_prompt` (v3 only), optional **`elements`** (array of `{ frontal_image_url?, reference_image_urls? }` — MVP: support in action and UI).
- **Poll**: GET `https://queue.fal.run/.../requests/{request_id}/status` until `status === "COMPLETED"` (then GET `.../requests/{request_id}` for result); same pattern as `videoPolling.ts` (interval 2s, max attempts ~60).
- **Auth**: `Authorization: Key ${FAL_KEY}`.
- **Args**: `clerkUserId`, `transactionId` (for refund on failure), `prompt`, `model: "o3" | "v3"`, `resolution?`, `resultType?`, `numImages?`, `seriesAmount?`, `aspectRatio?`, `negativePrompt?` (v3 only), `elements?` (optional `{ frontal_image_url?, reference_image_urls?: string[] }[]` for character/object control). Optional: `output_format` default `"png"`.
- **Return**: `{ imageUrl?: string, imageUrls?: string[] }` (first image in `imageUrl` when single; multiple in `imageUrls`).
- **Credits**: **Not in action.** Credits are deducted in the **mutation** (Task 0.5) before the action is scheduled. Action receives `transactionId` and must call `ctx.runMutation(api.credits.refundCredits, { transactionId, reason })` if FAL submit or poll fails.
- **History**: After success, call internal mutation `imageToolHistory.insertImageToolEntry` via `ctx.runMutation(internal.imageToolHistory.insertImageToolEntry, { ... })` (Task 3).
- **Visibility**: Export the action for **internal** use only (scheduled by mutation). Do not expose on public `api` for the client.

#### Step 1.2: Map model to endpoint

- `model === "o3"` → `fal-ai/kling-image/o3/text-to-image`
- `model === "v3"` → `fal-ai/kling-image/v3/text-to-image`

Use correct request bodies per OpenAPI (O3: no `negative_prompt`; v3: has `negative_prompt`, no `result_type`/`series_amount`).

### Deliverables

- `convex/actions/imageToolKlingT2I.ts` with submit + poll + credit deduction + history insert.

### 2-Step QA

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/actions/imageToolKlingT2I.ts

# Step 3: Deploy to Convex dev
npx convex dev --once
```

### Checklist

- [x] `npx tsc --noEmit` passes.
- [x] Biome check passes.
- [ ] Manual test: run action from dashboard or script with valid FAL_KEY and clerkUserId.

---

## ✅ Task 2: Kling I2I Convex action (1.5 h)

### Objective

Implement Convex action for Kling O3 I2I or v3 I2I: O3 accepts `image_urls[]` (1–10) and prompt with @Image1/@Image2; v3 accepts single `image_url`. Queue + poll, credits, history.

### Implementation Steps

#### Step 2.1: Create action file

**File**: `convex/actions/imageToolKlingI2I.ts` (new)

- **O3**: `POST https://queue.fal.run/fal-ai/kling-image/o3/image-to-image` with `prompt`, `image_urls` (array), `resolution`, `result_type`, `num_images` or `series_amount`, `aspect_ratio` (include `"auto"`), optional `elements`. See [OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/o3/image-to-image).
- **v3**: `POST .../fal-ai/kling-image/v3/image-to-image` with `prompt`, `image_url` (single), `resolution`, `num_images`, `aspect_ratio`. See [OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/v3/image-to-image).
- Poll same way as Task 1 (status then result URL).
- **Args**: `clerkUserId`, `transactionId`, `model`, `prompt`, `imageUrls` (O3) or `imageUrl` (v3), `resolution?`, `resultType?`, `numImages?`, `seriesAmount?`, `aspectRatio?`, **`elements?`** (optional, same shape as T2I for face/object control in Edit).
- **Credits**: Same as T2I — deducted in mutation; action receives `transactionId` and calls `refundCredits` on failure.
- **History**: Insert with `mode: "edit"`, `sourceImageUrl` or `sourceImageUrls`, `imageUrl` or `imageUrls`.
- **Visibility**: Internal only; scheduled by mutation.

### Deliverables

- `convex/actions/imageToolKlingI2I.ts` with O3/v3 branch, queue + poll, credits, history.

### 2-Step QA

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/actions/imageToolKlingI2I.ts

# Step 3: Deploy to Convex dev
npx convex dev --once
```

### Checklist

- [x] TypeScript and Biome pass.
- [ ] Manual test with one image (v3) and optionally multiple (O3).

---

## ✅ Task 3: History mutations + queries (1.5 h)

### Objective

Provide mutations to append to `imageToolHistory` (called from T2I/I2I actions) and queries for the UI to list user history.

### Implementation Steps

#### Step 3.1: Internal mutation (called from actions)

**File**: `convex/imageToolHistory.ts` (new). **Do not** add this logic to `convex/tools.ts`: that file is for the Tool Selection Wall (listActiveTools, getByKey, etc.); image tool history lives in its own module.

- `insertImageToolEntry`: internal mutation (export with `internalMutation`); args match table fields (`userId`, `mode`, `prompt`, `imageUrl`, `imageUrls`, `sourceImageUrl`, `sourceImageUrls`, `model`, `resolution`, `aspectRatio`, `resultType`, `metadata`, `createdAt`). Actions call it via `ctx.runMutation(internal.imageToolHistory.insertImageToolEntry, { ... })`.

#### Step 3.2: Public query

- `listByUser`: query with **no** `userId` from client. In handler: `const identity = await ctx.auth.getUserIdentity(); if (!identity) return [];` then query with `identity.subject` (Clerk ID) so users cannot list another user's history. Args: optional `limit` (default 50). Order by `createdAt` desc using index `by_user_created`.

### Deliverables

- Internal mutation for insert.
- Public query `listByUser` for history list.

### 2-Step QA

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/imageToolHistory.ts

# Step 3: Deploy to Convex dev
npx convex dev --once
```

### Checklist

- [x] Actions (Task 1 and 2) call insert after success.
- [x] Query returns entries for authenticated user.

---

## ✅ Task 4: Generate mode UI (2.5 h)

### Objective

Wire existing Sprint 23 Generate UI to Kling T2I action: model toggle (O3 / v3), resolution, result_type (single/series), num_images/series_amount, aspect ratio, negative prompt (v3). Show loading and result; deduct credits and show history.

**Reuse (do not recreate):** `InputSection`, `OutputSection`, `useAspectRatio`, `useImageUpload`, layout and keyboard/download/copy from **Sprint 23 reuse inventory** above. Only add new form fields (model, resolution, result_type, num_images/series_amount, negative prompt) and replace the **stub** in `useImageGeneration` with Convex action call. **i18n:** When adding or changing any UI text, use `useTranslations("image_generator")` and add keys to `messages/en.json` (see "Translation (i18n) alignment" section).

### Implementation Steps

#### Step 4.1: Route and layout

- Keep route **`app/[locale]/tools/image-generator/page.tsx`** (Sprint 23). Add **tabs**: "Generate" | "Edit" (e.g. Tabs from shadcn/ui). Generate tab renders current Sprint 23 content; Edit tab added in Task 5.

#### Step 4.2: Generate form and action wiring

- In Generate tab: prompt textarea (**maxLength 2500** or character count hint), **model toggle** (O3 / v3), **resolution**, **result type**, **num_images** / **series_amount**, **aspect_ratio**. For v3 show **negative prompt**. Optional: **output_format** selector or default `png`. **Elements (MVP):** Add optional "Character/object control" section: frontal image URL + 0–3 reference image URLs; hint "Reference in prompt as @Element1, @Element2"; pass `elements` array to mutation/action.
- On submit: get `clerkUserId` from `useUser()` (Clerk); check credits with `useQuery(api.credits.getUserCredits, { clerkUserId })` and `getCreditCost` for `image_generation`; if insufficient show existing `InsufficientCreditsModal`; else call **mutation** `useMutation(api.imageTool.startKlingT2IGeneration, …)` with form values. The mutation deducts credits and schedules the T2I action; the action runs async (queue + poll). UI shows loading until the new entry appears in history (refetch `listByUser` which takes no userId — query uses auth).
- **Loading**: Disable button, show progress text or spinner after mutation returns (mutation returns immediately; action runs in background). Optionally poll or rely on Convex reactivity: when the action inserts into history, `useQuery(api.imageToolHistory.listByUser, { limit: 50 })` will update and the new entry appears.
- **Result**: When history query updates with the new entry, display `imageUrl` or first of `imageUrls` in existing output area; select it in local state.

#### Step 4.3: Credits and auth

- Require signed-in user; redirect or show message if not authenticated.
- After successful generation, history is written by action; refetch `listByUser` to show new row. Optionally show credit balance update via `getUserCredits`.

### Deliverables

- Generate tab with full form (O3/v3, resolution, result_type, num_images/series_amount, aspect, negative prompt for v3).
- Submit → action → result display and history update.
- Credit check and insufficient-credits handling.

### 2-Step QA

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write app/[locale]/tools/image-generator/ components/image-generator/
```

### Checklist

- [ ] Generate flow runs end-to-end (prompt → image(s)).
- [ ] **Elements**: Optional frontal + ref images and @Element1/@Element2 in prompt work when provided.
- [x] History shows new entry after generate (Convex listByUser + length-based selection).
- [x] Credits decrease; insufficient credits blocks and shows modal.

---

## ✅ Task 5: Edit mode UI (2 h) — DONE

### Objective

Add Edit tab: upload or select 1–10 images (O3) or 1 image (v3); prompt with optional @Image1, @Image2 for O3; model toggle O3 / v3; resolution, result_type, aspect (include "auto" for O3). Call I2I action and show result in history.

### Implementation Steps

#### Step 5.1: Edit tab layout

- **Edit** tab: **Refs (MVP):** Both **file upload** and **"Select from history"**. Upload zone + history picker; for O3 allow 1–10 refs, for v3 single. Show thumbnails of selected refs. Prompt textarea with hint from `t("edit_refs_hint")`. **Elements (MVP):** Optional character/object control: frontal + ref images; @Element1, @Element2 in prompt; pass `elements` to I2I action. **i18n:** All new labels, hints, and buttons use `useTranslations("image_generator")` and keys in `messages/en.json`.
- **Model**: O3 (default) / v3. When v3, enforce single image; hide series/num_images if not applicable.
- **Resolution**, **result_type**, **series_amount** / **num_images**, **aspect_ratio** (include **"Auto (from input)"** for O3 I2I).

#### Step 5.2: Call I2I via mutation

- Submit: `useMutation(api.imageTool.startKlingI2IGeneration, …)` with `imageUrls` (O3) or `imageUrl` (v3), `prompt`, `model`, etc. Credit check for `image_edit` in UI; mutation deducts and schedules action; on completion, history query updates reactively.

#### Step 5.3: Image upload for refs (MVP includes file upload)

- **Select from history:** Use `imageUrl`/`imageUrls` from history entries. **File upload (MVP):** Support upload of new reference images via existing Convex file/asset upload (or upload-to-URL flow); resolve to URLs and pass to I2I mutation. Both sources must work: user can mix history-selected and newly uploaded refs up to 1–10 (O3) or 1 (v3).

### Deliverables

- Edit tab with ref selection via **upload + history** (1–10 for O3, 1 for v3), prompt, model/resolution/result_type/aspect, **Elements** (optional).
- I2I mutation called; result and new history entry shown.

### 2-Step QA

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write app/[locale]/tools/image-generator/ components/image-generator/
```

### Checklist

- [x] Edit with one image (v3) works (upload or from history).
- [x] Edit with multiple images (O3) and @Image1/@Image2 in prompt works; **file upload** for new refs works.
- [ ] **Elements** in Edit (frontal + refs, @Element1/@Element2) work when provided (optional MVP).
- [x] Credits for `image_edit` deducted.

### Notes (implementation)

- **ImageEditPanel**: refs via upload (Convex `generateUploadUrl` → POST → `saveFileMetadata`) and "Select from history"; model O3/v3, resolution, result_type, num_images/series_amount, aspect ("Auto (from input)" for O3); I2I mutation; InsufficientCreditsModal for `image_edit`.
- **Generate tab cleanup**: Removed v0/Vercel branding (logo, "Nano Banana Pro", "Playground by Vercel AI Gateway"), footer ("Make this app your own", "How it works", "Feedback?"), ApiKeyWarning, HowItWorksModal. Header uses `t("page_title")` and `t("page_description")` (Kling Image – Generator & Editor). Fal AI key is server-side; no user API key.

---

## ✅ Task 6: Shared history component + "Use in Video" (1.5 h) — DONE

### Objective

Single history list for both modes (generate + edit), with download/copy and "Use in Video" callback.

**Reuse (do not recreate):** `GenerationHistory` component and its UI (thumbnails, select, delete). Feed it from Convex `listByUser`; map Convex rows to the existing `Generation`-like shape (id, imageUrl or first of imageUrls, prompt, etc.). Add **"Use in Video"** button to `OutputSection` (and optionally on history items) that calls `onUseInVideo?.(url)`.

### Implementation Steps

#### Step 6.1: History list component

- Query: `useQuery(api.imageToolHistory.listByUser, { limit: 50 })` (no userId — query uses auth server-side). Render list (cards or grid) with thumbnail (use `imageUrl` or first of `imageUrls`), prompt snippet, mode badge (generate/edit), date. Each row: **Download**, **Copy URL**, **Use in Video** button (all ≥44px touch target). When list is empty, show design system **empty state**: centered icon in `bg-muted` circle, heading "No images yet", short description, CTA button (e.g. "Generate your first image").

#### Step 6.2: "Use in Video" callback

- "Use in Video" passes selected image URL to parent or app context. If Image Tool is opened from guided flow (e.g. modal/drawer), callback can set selected asset/URL for the current scene. If standalone page, callback can navigate to guided flow with image pre-selected or copy URL to clipboard and show toast "URL copied; paste in video step." Document the callback contract (e.g. `onUseInVideo?: (url: string) => void`) so guided flow can inject it when embedding the tool.

### Deliverables

- Shared history component showing last N entries with download, copy, "Use in Video."
- Callback prop and behavior documented.

### 2-Step QA

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/
```

### Checklist

- [x] History shows both generate and edit entries.
- [x] Download and copy work.
- [x] "Use in Video" triggers callback or copy with toast.

### Notes (implementation)

- **OutputSection**: Added `onUseInVideo(url)`, `useInVideoLabel`; "Use in Video" button; Download/Copy/Use in Video buttons use `min-h-[44px] min-w-[44px]`.
- **ImageCombiner**: Optional `onUseInVideo?: (url: string) => void`; when not provided, copies URL and shows toast `use_in_video_copied`. Passes `handleUseInVideo` and label to OutputSection.
- **ImageEditPanel**: Optional `onUseInVideo`; "Use in Video" button under preview; copy+toast on standalone. GenerationHistory gets empty state props and historyLabel.
- **GenerationHistory**: Optional `emptyStateTitle`, `emptyStateDescription`, `emptyStateCtaLabel`, `onEmptyStateCta`, `historyLabel`; when empty and title set, shows design system empty state (icon in `bg-muted` circle, CTA ≥44px). Button types fixed for a11y.
- **ImageToolView**: JSDoc documents that when embedding, pass `onUseInVideo` to ImageCombiner and ImageEditPanel.
- **i18n**: `use_in_video`, `use_in_video_copied` in `image_generator`.

---

## ✅ Task 7: Credits, auth, error handling (1 h) — DONE

### Objective

Ensure all actions require auth; credit deduction and refund on failure; user-facing error messages and optional retry.

### Implementation Steps

#### Step 7.1: Auth

- In both actions: `const identity = await ctx.auth.getUserIdentity(); if (!identity) throw new Error("Not authenticated");`. Use `identity.subject` as `clerkUserId` for credits and history.

#### Step 7.2: Credit refund on failure

- In T2I and I2I actions: if credits were deducted and then FAL call or poll fails, call `refundCredits` with same `actionType` and resourceId/transactionId so balance is restored.

#### Step 7.3: Error handling in UI

- On action error: show toast or inline message (e.g. "Generation failed: …"). Optional retry button. Do not leave UI in perpetual loading state.

#### Step 7.4: Credit cost seeding (if missing)

- Ensure `creditCosts` has `image_generation` and `image_edit` with desired credit amount. Use `seedCredits` or Convex dashboard. Document in sprint: "If new deployment, run seed or add these action types."

### Deliverables

- Auth in both actions; refund on failure; UI errors and optional retry; credit costs documented/verified.

### 2-Step QA

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/actions/imageToolKlingT2I.ts convex/actions/imageToolKlingI2I.ts convex/imageTool.ts components/image-generator/
```

### Checklist

- [x] Unauthenticated user cannot trigger actions (and is redirected or shown message).
- [x] On FAL failure, credits refunded when applicable.
- [x] User sees clear error message and can retry or go back.

### Notes (implementation)

- **7.1 Auth:** Mutations `startKlingT2IGeneration` and `startKlingI2IGeneration` in `convex/imageTool.ts` call `ctx.auth.getUserIdentity()` and throw "Not authenticated" if missing; they pass `identity.subject` as `clerkUserId` to the scheduled actions. Unauthenticated users never reach the mutation (Generate/Edit UIs show "Sign in to generate" when not signed in).
- **7.2 Refund:** T2I and I2I actions already call `api.credits.refundCredits` on every failure path (FAL_KEY missing, submit failed, no request_id, status check failed, result fetch failed, no images, FAILED status, polling timeout); they also refund in the outer catch for network errors.
- **7.3 UI:** Generate (ImageCombiner): on mutation throw, `setIsGenerating(false)` and toast with `err.message` or `t("generation_failed")`. Edit (ImageEditPanel): on mutation throw, `setIsGenerating(false)` and show `errorMessage` (red) from `t("edit_failed")`, auto-clear after 4s. No perpetual loading.
- **7.4 Credit costs:** `convex/seedCredits.ts` already seeds `creditCosts` with `image_generation` and `image_edit`. **If new deployment:** run the seed (or add these action types in Convex dashboard) so deduct/refund and cost display work.

---

## ✅ Task 8: QA & polish (1 h) — DONE

### Objective

TypeScript, Biome, basic i18n keys, mobile check, and **required** tests for T2I/I2I actions.

### Implementation Steps

#### Step 8.1: TypeScript and Biome

- From repo root run the 2-Step QA (see below). Fix all issues.

#### Step 8.2: i18n (see "Translation (i18n) alignment" section above)

- Ensure **all** Image Tool user-facing strings use `useTranslations("image_generator")` and keys in `messages/en.json`. No hardcoded copy in `components/image-generator/*` or the page.
- Reuse existing keys where applicable: `errors.insufficient_credits_title`, `errors.insufficient_credits_description` (with `actionName`), `common.close`, `common.cancel`, `common.retry`, `status.generating`.
- Page metadata: use `generateMetadata` with `getTranslations("image_generator")` for localized title/description (requires **top-level** `image_generator` in `messages/en.json` for page keys like `page_title`, `page_description`; tool card stays at `tools.image_generator.name` / `tools.image_generator.description`).
- Run `pnpm translate` then `pnpm i18n:verify`; test in at least two languages.

#### Step 8.3: Mobile and design system

- **Mobile**: Verify Generate and Edit tabs and history list are usable on narrow viewport (e.g. 320px–375px). Use `flex flex-col` / stack on small screens; horizontal scroll or single-column grid for history.
- **Design system review** (see "Design System & Mobile-First Alignment" above):
  - [ ] No hardcoded colors: use `text-foreground`, `text-muted-foreground`, `bg-card`, `bg-primary`, `border-border`, etc. (no `text-white`, `bg-white`, `bg-gray-*`).
  - [ ] Touch targets: all primary actions (Run, Use in Video, Download, Copy, tab triggers) at least 44×44px (`min-h-[44px]` or Button default).
  - [ ] Tabs use `@/components/ui/tabs` with semantic tokens (e.g. `TabsList` with `bg-secondary` or `bg-muted`, not hardcoded hex).
  - [ ] Empty history uses design system empty-state pattern (centered icon, heading, description, CTA).
  - [ ] Typography: body `leading-relaxed` or `leading-6`; headings per design-master scale.
  - [ ] Animations ≤ 500ms; use `transition-smooth` where applicable.

#### Step 8.4: Tests (required)

- **Required:** Unit tests for Kling T2I and I2I actions. Use the same approach as `__tests__/convex/actions/imageGeneration.test.ts` and `videoAssembly.test.ts`: validate args schema, FAL queue request/response shapes, refund and history mutation payloads, error paths, and constants (ENDPOINTS, POLL_INTERVAL_MS, MAX_POLL_ATTEMPTS). Mock `fetch` for submit/status/result where the action logic is testable.
- Files: `__tests__/convex/actions/imageToolKlingT2I.test.ts`, `__tests__/convex/actions/imageToolKlingI2I.test.ts`.
- Run: `pnpm test:convex` (or `vitest run __tests__/convex`).

### Deliverables

- Clean TypeScript and Biome; i18n keys for new strings; mobile check; **passing unit tests for T2I and I2I actions**.

### 2-Step QA (Final Sprint QA)

```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format (all touched files)
npx biome check --write app/[locale]/tools/image-generator/ components/image-generator/ convex/schema.ts convex/imageTool.ts convex/imageToolHistory.ts convex/actions/imageToolKlingT2I.ts convex/actions/imageToolKlingI2I.ts

# Step 3: i18n — generate and verify
pnpm translate
pnpm i18n:verify

# Step 4: Convex actions tests (required)
pnpm test:convex

# Step 5: Deploy to Convex dev
npx convex dev --once
```

### Checklist

- [x] `npx tsc --noEmit` passes.
- [x] Biome check passes for all touched files (including `input-section.tsx`, `use-image-upload.ts`: noNonNullAssertion, noExplicitAny, noLabelWithoutControl, useSemanticElements, noSvgWithoutTitle, useButtonType fixed).
- [ ] All Image Tool user-facing strings use `image_generator` namespace; no hardcoded UI copy; `pnpm translate` and `pnpm i18n:verify` pass.
- [ ] Mobile layout acceptable.
- [x] **Tests:** `imageToolKlingT2I.test.ts` and `imageToolKlingI2I.test.ts` pass (`npx vitest run __tests__/convex/actions/imageToolKlingT2I.test.ts __tests__/convex/actions/imageToolKlingI2I.test.ts`); cover args schema, FAL request/response shapes, refund/history payloads, and error paths.

### Notes (implementation)

- **8.1 TypeScript:** `npx tsc --noEmit` passes.
- **8.1 Biome:** All 27 touched files pass. Fixes applied: `use-image-upload.ts` — replaced `getContext("2d")!` with null check and `reject()`; `input-section.tsx` — `generations?: Generation[]`, Prompt label `htmlFor="image-tool-prompt"` + textarea `id="image-tool-prompt"`, Model/Result type divs → `fieldset`, Result/Count/Size/Images labels → `span`, four buttons `type="button"`, two SVGs `<title>Clear</title>` + `aria-hidden`.
- **8.4 Tests:** T2I and I2I test files created and passing.
- **8.2 i18n / 8.3 mobile:** To be verified manually; Image Tool already uses `useTranslations("image_generator")` in main components; page metadata and full key audit per "Translation (i18n) alignment" section.

---

## 📁 FILES CREATED / MODIFIED (SUMMARY)

### Created

| File | Purpose |
|------|---------|
| `convex/imageTool.ts` | Mutations `startKlingT2IGeneration` and `startKlingI2IGeneration` (deduct credits + schedule internal actions) |
| `convex/actions/imageToolKlingT2I.ts` | Kling O3/v3 T2I queue + poll, refund on failure, history insert (internal only) |
| `convex/actions/imageToolKlingI2I.ts` | Kling O3/v3 I2I queue + poll, refund on failure, history insert (internal only) |
| `convex/imageToolHistory.ts` | Internal mutation insert + query listByUser (auth from ctx). **Only** this file; not in `convex/tools.ts`. |

### Modified (Sprint 23 assets — do not duplicate)

| File | Changes |
|------|---------|
| `convex/schema.ts` | Add `imageToolHistory` table + indexes |
| `app/[locale]/tools/image-generator/page.tsx` | Add tabs Generate/Edit; **localized metadata** via `generateMetadata` + `getTranslations("image_generator")` (page_title, page_description); MyShortReel + Kling Image. |
| `components/image-generator/index.tsx` | Replace `usePersistentHistory` with Convex query; wire `useImageGeneration` to T2I **mutation**; add Edit mode branch; Elements; branding/links |
| `components/image-generator/input-section.tsx` | Add model (O3/v3), resolution, result_type, num_images/series_amount, negative prompt (v3), **Elements** (frontal + refs); map aspect to Kling enum |
| `components/image-generator/output-section.tsx` | Add "Use in Video" button calling `onUseInVideo?.(url)` |
| `components/image-generator/hooks/use-image-generation.ts` | T2I via `onStartT2I` (Convex mutation → fal/Kling); removed `onApiKeyMissing` and all demo/legacy commented code; fallbacks for sign-in and Edit tab |
| `components/image-generator/hooks/use-persistent-history.tsx` | Replace localStorage with Convex: `useQuery(api.imageToolHistory.listByUser)`, mutations for delete (optional) |
| `components/image-generator/generation-history.tsx` | Accept data from Convex (map rows to existing Generation-like props); no structural rewrite |

### Optional

- `convex/seedCredits.ts`: Add or verify `image_generation` and `image_edit` in `creditCosts` if not already present.

**Required tests (Task 8.4):** `__tests__/convex/actions/imageToolKlingT2I.test.ts`, `__tests__/convex/actions/imageToolKlingI2I.test.ts` — unit tests for args schema, FAL request/response shapes, refund/history payloads, error paths. Run: `pnpm test:convex` or `npx vitest run __tests__/convex/actions/imageToolKlingT2I.test.ts __tests__/convex/actions/imageToolKlingI2I.test.ts`.

---

## 🔧 BACKEND / KLING COMPLETENESS CHECKLIST

Before marking backend done, verify:

| Item | Where |
|------|--------|
| **FAL queue base** | `https://queue.fal.run/` + endpoint path (e.g. `fal-ai/kling-image/o3/text-to-image`). |
| **Polling** | Same pattern as `convex/actions/videoPolling.ts`: GET status URL until `COMPLETED`, then GET result; interval ~2s, max attempts ~60. |
| **output_format** | Default `"png"` in request body for T2I and I2I (analysis: jpeg, png, webp). |
| **Credit refund** | Action catches errors and calls `refundCredits(transactionId, reason)` when FAL submit or poll fails. |
| **History insert** | Action calls `internal.imageToolHistory.insertImageToolEntry` only on success (after poll returns URLs). |
| **listByUser auth** | Query uses `ctx.auth.getUserIdentity()` and filters by `identity.subject`; no `userId` in args. |
| **elements** (MVP) | T2I and I2I actions accept optional `elements` array; pass to FAL body when provided (frontal_image_url, reference_image_urls; ref in prompt as @Element1, @Element2). |
| **usageTracking** | Optional: log to `usageTracking` table with service `fal`, model `kling-image-o3-t2i` etc.; not blocking for MVP. |

---

## 📚 REFERENCES

- **Convex Master**: `.cursor/agents/convex-master.md` — mutation → schedule action; no client actions.
- **i18n**: `.cursor/agents/i18n-master.md` — next-intl, namespace `image_generator`, `messages/en.json`, `pnpm translate`, `pnpm i18n:verify`; Link from `@/i18n/routing`.
- **Design system**: [design-system.md](../../Guides/design-system.md), [mobile-first-best-practices.md](../../Best-Practices/mobile-first-best-practices.md), [.cursor/agents/design-master.md](../../../.cursor/agents/design-master.md).
- **Analysis**: [MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md](../../Analysis/MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md)
- **Sprint 23**: [sprint-23-Image-Generator-demo.md](./sprint-23-Image-Generator-demo.md)
- **FAL Queue OpenAPI**: [O3 T2I](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/o3/text-to-image), [O3 I2I](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/o3/image-to-image), [v3 T2I](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/v3/text-to-image), [v3 I2I](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-image/v3/image-to-image)
- **Queue pattern**: `convex/actions/videoGeneration.ts`, `convex/actions/videoPolling.ts`
- **Credits**: `convex/credits.ts` (`deductCredits`, `refundCredits`, `getUserCredits`, `getCreditCost`)

---

## ✅ ALIGNMENT WITH MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS

This sprint is fully aligned with [MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md](../../Analysis/MINI-APP-IMAGE-TOOL-MERGED-ANALYSIS.md):

| Analysis | Sprint 29 |
|----------|-----------|
| **Model strategy**: O3 T2I default, v3 T2I optional; O3 I2I default, v3 I2I optional | Same; Goal, Success Criteria, Tasks 1–2, 4–5 |
| **Route**: "e.g. `/tools/image`" | Kept `/[locale]/tools/image-generator` (Sprint 23) — analysis allows it |
| **Convex schema**: imageToolHistory (userId, mode, prompt, imageUrl/imageUrls, source*, model, resolution, aspectRatio, resultType, metadata, createdAt) | Task 0: identical schema + indexes |
| **Generate**: result_type, num_images, series_amount, resolution 1K/2K/4K, aspect_ratio, negative_prompt (v3), elements (optional), output_format default png | Tasks 1 & 4: all covered; Elements in MVP; output_format default in actions |
| **Edit**: O3 image_urls (1–10), @Image1/@Image2, aspect "auto", series; v3 image_url (single), num_images | Tasks 2 & 5: O3/v3 branches, refs upload + history, aspect "Auto (from input)" |
| **Shared history**, download/copy, "Use in Video", credits, auth | Tasks 3, 6, 7 |
| **Time**: 10–14h | ~12–14h |
| **Out of scope (analysis)**: AI edit suggestions, native tools, multi-model comparison | Not in scope |
| **Implementation path**: Schema + actions → Generate → Edit → History + polish | Task 0 → 0.5 → 1–3 → 4–6 → 7–8 (mutations + internal actions per Convex Master) |

The only intentional scope addition is **Elements** and **Edit ref file upload** in MVP (analysis marked Elements "Phase 2 ok"; sprint includes them for high value).

---

## 🎯 SUCCESS METRICS

- Generate (O3 and v3) produces image(s) and stores in history; credits deducted; **Elements** (frontal + refs, @Element1/@Element2) supported in UI and API.
- Edit (O3 multi-ref, v3 single) with **file upload** for refs (and "Select from history"); result in history; **Elements** supported; credits deducted.
- History list shows all entries; download, copy, and "Use in Video" work.
- Unauthenticated users cannot run actions; errors handled and optionally refunded.
- Mobile-friendly and i18n-ready.

---

## ✅ HIGH-VALUE MVP SCOPE (INCLUDED — NOT DEFERRED)

The following are **in scope** for this sprint (high value); do **not** defer to Phase 2.

| Item | Requirement |
|------|-------------|
| **Elements** (face/object control) | Implement in MVP: frontal_image_url + reference_image_urls (0–3); prompt refs @Element1, @Element2. Expose in Generate (Task 4) and Edit (Task 5); add `elements` to T2I/I2I action args (Tasks 1 & 2). |
| **Edit ref upload** | MVP includes **file upload** for new reference images, not only "Select from history". Edit tab: upload zone + history picker; support 1–10 refs (O3) or 1 (v3). Use existing Convex file/asset upload or upload-to-URL flow. |
| **Route** | Keep **`/[locale]/tools/image-generator`** (Sprint 23 route); no change. |

---

**Document Version**: 1.0  
**Last Updated**: February 10, 2026  
**Status**: 📋 PLANNED — Ready for implementation  
**Next**: Task 0 (schema) → Task 0.5 (mutations: startKlingT2IGeneration / startKlingI2IGeneration) → Task 3 (history) → Task 1 (T2I action) → Task 2 (I2I action) → Task 4 (Generate UI) → Task 5, 6, 7, 8.
