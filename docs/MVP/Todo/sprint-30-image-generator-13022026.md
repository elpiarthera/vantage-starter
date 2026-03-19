# 🎨 MyShortReel - Sprint 30: Image Tool Redesign (Premium Studio UI) & Modular Backend

**Date**: February 13, 2026
**Status**: 🚧 IN PROGRESS (Phase 0 done)
**Estimated Time**: ~27 hours
**Goal**: Transform the Image Generator UI into a "Premium Studio" experience and refactor the backend to be **model-agnostic**, enabling support for 500+ models via schema configuration.
**Dependencies**: Sprint 29 (Backend & Basic UI) ✅
**Analysis**: [UI-UX-REDESIGN-PROPOSAL.md](../../Analysis/image-generator/UI-UX-REDESIGN-PROPOSAL.md) (v3.1) · [IMAGE-MODELS-ANALYSIS.md](../../Analysis/image-generator/IMAGE-MODELS-ANALYSIS.md) (v1.0 — 8 models documented)
**QA Strategy**: **2-Step QA** — (1) TypeScript `npx tsc --noEmit`, (2) Biome `npx biome check --write <files>` for every task. Tasks that modify Convex files add (3) `npx convex dev --once`. No task merges without passing its QA block. Clean code: typed props, semantic tokens, translated strings per design/i18n masters.

---

## 🎨 DESIGN SYSTEM & MOBILE-FIRST ALIGNMENT (MANDATORY)

**CRITICAL**: This sprint is a **visual overhaul**. All new components must follow the "Premium Studio" aesthetic and [.cursor/agents/design-master.md](../../.cursor/agents/design-master.md).

### Visual Strategy ("Premium Studio")
-   **Glassmorphism**: `bg-background/80` or `bg-card/60` with `backdrop-blur-md` and `border-border/50` (or `border-white/10` for subtle light edge).
-   **Floating UI**: Prompt bar and panels float above the canvas.
-   **Typography**: Labels `text-sm font-medium tracking-tight`; inputs `text-base`; body `leading-relaxed` (design-master).
-   **Visual Selectors**: Icons/Grids instead of text dropdowns.

### Design Token Compliance (design-master)
| Replace | With (Semantic Token) |
| :--- | :--- |
| `bg-white` | `bg-background` or `bg-card` |
| `text-white` | `text-foreground` |
| `text-gray-400` | `text-muted-foreground` |
| `border-gray-600` | `border-border` |
| `bg-black/*` | `bg-background/80` or `bg-card/60` (glass) |

### Mobile-First (design-master)
-   **Floating Bar**: Fixed at bottom on mobile (`bottom-4 left-4 right-4`); layout works at 320px+.
-   **Touch Targets**: All interactive elements **min-h-[44px]** (WCAG 2.1 AA).
-   **Responsive**: Stack panels vertically on small screens; `flex-col md:flex-row`, `gap-4`.

---

## ⚠️ PRE-SPRINT WARNINGS

-   **Backend Integration**: Do NOT modify existing `convex/imageTool.ts` mutations signature if possible, but we WILL be creating a new generic mutation.
-   **Guided Flow**: Do NOT touch `app/[locale]/guided` or `convex/actions/videoGeneration.ts`. This sprint is scoped to `tools/image-generator`.
-   **Elements Feature**: The "Elements" (character/object consistency) feature from Sprint 29 must be preserved in the new UI.

---

## ✅ MANDATORY CONVEX MASTER COMPLIANCE

All new backend work **must** follow [.cursor/agents/convex-master.md](../../.cursor/agents/convex-master.md). Summary for this sprint:

### Client never calls actions
-   **UI** calls only **mutations** (e.g. `startGenericGeneration`). Never `useAction(api.actions.imageToolGeneric.*)`.
-   Same pattern as Sprint 29: `useMutation(api.imageTool.startKlingT2IGeneration)` → mutation deducts credits and **schedules** the action.

### Mutation → schedule internal action
-   **Workflow**: Mutation (auth, deduct credits, optional create pending record) → `ctx.scheduler.runAfter(0, internal.actions.imageToolGeneric.generateGeneric, { ... })` → return to client.
-   **Action is internal only**: Export with `internalAction`, schedule with `internal.actions.imageToolGeneric.generateGeneric`. Client has no reference to the action.

### Credits before AI
-   Deduct credits in the **mutation** (via `api.credits.deductCredits`) before scheduling the action. Pass `transactionId` to the action for refund on failure.

### Action updates state only via mutations
-   On **success**: Action calls `ctx.runMutation(internal.imageToolHistory.insertImageToolEntry, { ... })` to persist result (same as `imageToolKlingT2I`).
-   On **failure**: Action calls `ctx.runMutation(api.credits.refundCredits, { transactionId, reason })`; no direct `ctx.db` writes from the action. If we later add a "pending" history row at schedule time, the action would call an internal mutation to patch it to `failed`.

### Argument validation
-   All new mutations use Convex `v.*` validators for args (e.g. `modelId: v.string()`, `params: v.any()` or a structured validator). No unvalidated payloads.

### Indexes
-   `imageToolHistory` already has `by_user` and `by_user_created`. If new queries filter by `mode` or a future `status` field, add compound indexes per Convex Master (e.g. `by_user_and_mode`, `by_user_and_status`) in schema.

---

## ✅ i18n MASTER ALIGNMENT

All new UI text **must** follow [.cursor/agents/i18n-master.md](../../.cursor/agents/i18n-master.md): `useTranslations("image_generator")`, ICU for plurals/variables, `Link` from `@/i18n/routing`, add keys to `messages/en.json` then `pnpm translate` and `pnpm i18n:verify`.

### i18n key checklist (new components)

| Area | Keys to add / verify in `image_generator` namespace |
|------|------------------------------------------------------|
| **Floating Prompt Bar** | `floating_prompt_placeholder`; maxLength warning messages (ICU if needed) |
| **Visual Selectors** | `visual_select_aspect_square`, `visual_select_aspect_landscape`, `visual_select_aspect_portrait`; resolution selector labels |
| **Prompt logic** | Character counter messages; `warningAt` thresholds (ICU `{count}` / plural if applicable) |
| **Quick Presets** | `preset_fast`, `preset_quality`, `preset_batch` |
| **Advanced Options** | `advanced_options_show`, `advanced_options_hide` |
| **Credit cost** | Cost display supports variable pricing (e.g. `credits_cost` or inline `{cost}` in button label) |
| **Model selector** | `model_selector_title`, `search_models`, `no_models_found`, `no_models_found_desc` (empty state) |

Icon names (Square, Landscape, Portrait) stay as Lucide component usage; labels are translated via the keys above. No hardcoded user-facing strings in new components.

---

## ✅ DESIGN MASTER ALIGNMENT

All new UI **must** follow [.cursor/agents/design-master.md](../../.cursor/agents/design-master.md). Summary for this sprint:

### Semantic color tokens only
-   Use `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `ring-primary`. **Never** `bg-white`, `bg-black`, `text-white`, `bg-gray-*`. Glass: `bg-background/80`, `bg-card/60` with `border-border/50` or `border-white/10` for subtle edge; avoid `bg-black/*`.

### Typography
-   Headings: `text-4xl font-bold` (page), `text-3xl/2xl/xl font-semibold/medium` (sections). Labels: `text-sm font-medium tracking-tight`. Body: `text-base` with `leading-relaxed` or `leading-6`; secondary `text-sm text-muted-foreground`.

### Spacing & layout
-   Use `gap-4` / `gap-6` for flex/grid; spacing scale `p-4`, `p-6`. **Layout**: Flexbox > Grid > absolute. Prefer `flex flex-col md:flex-row gap-4`, `grid grid-cols-1 md:grid-cols-2 gap-4`.

### Border radius & animations
-   Default `rounded-lg` (12px); `rounded-xl`/`rounded-2xl` for prominent panels. Use `transition-smooth` or `transition-transform-smooth`; `active:scale-98` for touch feedback. **Animations ≤ 500ms** (design-master); prefer `animate-in fade-in duration-300` or `transition-all duration-200` for panel/button transitions. When using explicit duration classes, keep ≤500ms; optional code comment: `/* 500ms max per design-master */`.

### Mobile-first & accessibility (WCAG 2.1 AA)
-   **Breakpoints**: sm 640px, md 768px, lg 1024px; layout must work at **320px+**. Stack on mobile, row on desktop.
-   **Touch targets**: All interactive elements **min-h-[44px]** (buttons, toggles, selector tiles). Inputs `min-h-[48px]` where applicable.
-   **Focus**: Use `ring` (e.g. `ring-primary`) for focus visibility.

### Components
-   Use **shadcn/ui** from `components/ui/` (Button, Card, Collapsible, Dialog, Input, Switch). Button variants: `default` | `secondary` | `outline` | `ghost`; sizes `default` | `sm` | `lg` | `icon`. Do not build custom UI that duplicates shadcn.

### Design Master review checklist (before merge)
-   [ ] Semantic tokens only; no hardcoded colors.
-   [ ] Body text has `leading-relaxed` or `leading-6`.
-   [ ] Spacing via `gap-*`; no stray margin for layout.
-   [ ] Mobile-first; touch targets 44px; focus visible.

---

## ⚡ Phase 0: Visual & UX Quick Wins (8.5 hours)

**Goal**: Ship immediate visual upgrades ("Make it Sexy") while building schema system in parallel.

### ✅ Task 0.1: Floating Prompt Bar (2 h)

**Objective**: Replace the static prompt area with a floating glass bar at the bottom center.

**Files to Create/Modify**:
-   Create: `components/image-generator/FloatingPromptBar.tsx`
-   Modify: `components/image-generator/input-section.tsx` (remove old prompt)
-   Modify: `components/image-generator/index.tsx` (layout adjustment)

**Implementation**:
-   Create `FloatingPromptBar` component:
    -   Fixed position: `fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl z-50`.
    -   Glass style: `backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl bg-background/80` (design-master: semantic tokens only).
    -   Contains `TextareaAutosize` and "Generate" button. **Generate button**: `min-h-[44px]`, `transition-smooth` (design-master).
    -   **i18n**: Use `t("floating_prompt_placeholder")`.
-   Refactor `InputSection` to remove the old prompt field.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/FloatingPromptBar.tsx components/image-generator/input-section.tsx components/image-generator/index.tsx
```

### ✅ Task 0.2: Visual Selectors (1.5 h)

**Objective**: Replace standard dropdowns with visual grid menus (icons/segmented controls).

**Files to Create/Modify**:
-   Create: `components/image-generator/VisualSelect.tsx`
-   Modify: `components/image-generator/input-section.tsx`

**Implementation**:
-   Create `VisualSelect` component:
    -   Props: `options: { value, label, icon? }[]`, `value`, `onChange`, `type: "grid" | "segmented"`.
    -   **Icons**: Use `lucide-react`:
        -   Square: `<Square />`
        -   Landscape: `<RectangleHorizontal />`
        -   Portrait: `<RectangleVertical />`
    -   "Segmented" renders pill toggles; **resolution options from schema** (v3: 1K, 2K only; O3/Nano Banana: 1K, 2K, 4K) so 4K is hidden when model does not support it — see IMAGE-MODELS-ANALYSIS.
    -   Active state: `ring-2 ring-primary bg-accent`.
    -   **i18n**: Labels must be translated (`visual_select_aspect_square`, etc.).
-   Update `InputSection` to use `VisualSelect` for Aspect Ratio and Resolution.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/VisualSelect.tsx components/image-generator/input-section.tsx
```

### ✅ Task 0.3: Modern Typography & Glass UI (1.5 h)

**Objective**: Apply the "Premium Studio" aesthetic to the main containers.

**Files to Create/Modify**:
-   Modify: `components/image-generator/input-section.tsx`
-   Modify: `components/image-generator/index.tsx`

**Implementation**:
-   Apply `backdrop-blur-md`, `bg-card/60`, `border-white/10` to the main options panel container.
-   Update all labels to `text-sm font-medium tracking-tight`.
-   Ensure background image/gradient shows through the glass panels.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/
```

### ✅ Task 0.3.5: Collapsible Advanced Options (1 h) — **NEW**

**Objective**: Declutter the UI by hiding less common options (Negative Prompt, Seed).

**Files to Create/Modify**:
-   Modify: `components/image-generator/input-section.tsx`

**Implementation**:
-   Wrap "Negative Prompt" and any future advanced settings in a `Collapsible` component (shadcn/ui).
-   Add a trigger button "Advanced Options" (text-xs, muted-foreground).
-   **i18n**: `t("advanced_options_show")`, `t("advanced_options_hide")`.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/input-section.tsx
```

### ✅ Task 0.4: Resizable Prompt Logic (1 h)

**Objective**: Ensure the floating prompt bar handles long text gracefully.

**Files to Create/Modify**:
-   Modify: `components/image-generator/FloatingPromptBar.tsx`

**Implementation**:
-   Use `react-textarea-autosize` (or similar logic).
-   Set `max-height: 40vh` with internal scroll.
-   Character counter: show when nearing limit; **maxLength and warning threshold come from model schema** (e.g. Kling 2500, Grok 8000, Nano Banana 50k). Phase 0 can default to 2500 / warn at 2000; Task 1.3 makes it schema-driven. **i18n**: Use ICU for counter (e.g. `t("prompt_characters", { count, max })` or plural form per i18n-master).

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/FloatingPromptBar.tsx
```

### ✅ Task 0.5: Quick Presets (1 h)

**Objective**: Add one-click configuration buttons.

**Files to Create/Modify**:
-   Modify: `components/image-generator/input-section.tsx`

**Implementation**:
-   Add "Quick Settings" buttons above options: "Fast", "Quality", "Batch".
-   Logic: Clicking "Fast" sets Model=v3, Res=1K. Clicking "Quality" sets Model=O3, Res=4K. "Batch" can set result_type=series or num_images (model-dependent). **Note**: Presets are Kling-oriented initially; when schemas include Grok/Nano Banana, presets may be schema-driven or scoped to current model family.
-   **i18n**: `t("preset_fast")`, `t("preset_quality")`, `t("preset_batch")`.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/input-section.tsx
```

### ✅ Task 0.6: Credit Cost Display (0.5 h)

**Objective**: Show dynamic credit cost on the Generate button.

**Files to Create/Modify**:
-   Modify: `components/image-generator/FloatingPromptBar.tsx`

**Implementation**:
-   Cost from schema: **creditCost** or derived from model + resolution (e.g. 4K = 2× for O3 / Nano Banana). See IMAGE-MODELS-ANALYSIS for per-model pricing; app credits map from that. Display badge inside Generate button with variable cost. **i18n**: Use a key that supports variable pricing (e.g. `t("generate_with_cost", { cost })` or `t("generate")` + `t("credits_short", { count: cost })`) so all 7 languages get correct formatting.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/FloatingPromptBar.tsx
```

---

## 🏗️ Phase 1: Modular Backend & Schema Foundation (6.5 hours)

**Goal**: Refactor backend to be generic and build the frontend engine.

### Phase 1 — Decisions (Task 1.1 & credits)

- **Client**: In Phase 1 the UI keeps calling `startKlingT2IGeneration` / `startKlingI2IGeneration` until **Task 1.3**. When OptionsPanel exists, **switch the UI to `startGenericGeneration`** (do not keep the old mutations for the image tool).
- **Credits — same pattern as step-3**: Use the existing Convex flow: `api.credits.deductCredits({ clerkUserId, actionType })`. Cost is **never hardcoded**: it is read from the **`creditCosts`** table by `actionType` (see `convex/credits.ts`, `app/[locale]/guided/step-3/page.tsx`). Refund on failure via `refundCredits(transactionId)`.
- **actionType for generic image flow**: **Derive from config**, do not pass from client. Reason: models in IMAGE-MODELS-ANALYSIS have **different prices per image**; the system must stay flexible by changing cost in the Convex table only.
  - In `startGenericGeneration`: receive `modelId` (and params). Look up **creditActionType** from model config (e.g. in `falModels.ts`: each model has `creditActionType`). Call `deductCredits(identity.subject, creditActionType)`.
  - **creditCosts table**: One row per action type. Today we have `image_generation` and `image_edit`. When adding models with different prices, add a row per model (e.g. `image_generation_kling_o3_t2i`, `image_edit_nano_banana`) and set that `creditActionType` in the model config. Changing price = update the row in Convex; no code change.
  - **UI cost display**: When the model selector exists, use `getCreditCost(selectedModel.creditActionType)` so the Generate button shows the correct cost (FloatingPromptBar already receives `creditCost`; in Task 1.3 the parent will pass cost from the selected model’s `creditActionType`).

### ✅ Task 1.1: Generic Fal Action (2.5 h) — **CRITICAL REFACTOR**

**Objective**: Create a modular backend action that can handle *any* Fal model, replacing the hardcoded `imageToolKlingT2I.ts`.

**Files to Create/Modify**:
-   Create: `convex/actions/imageToolGeneric.ts`
-   Create: `convex/configs/falModels.ts` (Internal config mapping model IDs to endpoints)
-   Modify: `convex/imageTool.ts` (Add `startGenericGeneration` mutation)

**Implementation**:
-   `falModels.ts`: Export config per model (e.g. app id `kling-o3-t2i` or fal id `fal-ai/kling-image/o3/text-to-image`): `{ endpoint, type: "t2i"|"i2i", creditActionType: string }`. `creditActionType` must exist in `creditCosts` (cost is read from Convex table). Optionally **parameterMapping** (canonical → API param names; e.g. refs → `image_url` vs `image_urls` per model) and **responsePath** (e.g. `images`, or `images[0].url`; optional `revised_prompt` / `description`). See IMAGE-MODELS-ANALYSIS § Backend integration.
-   `convex/imageTool.ts` — **new mutation** `startGenericGeneration`:
    -   **Args** (all validated with Convex `v.*`): e.g. `modelId: v.string()`, `params: v.any()` (or structured object), plus any required refs. Match pattern of `startKlingT2IGeneration` (no `clerkUserId` from client — use `ctx.auth.getUserIdentity()`).
    -   **Handler**: (1) Auth; (2) look up model config by `modelId`, get `creditActionType`; (3) deduct credits via `api.credits.deductCredits({ clerkUserId: identity.subject, actionType: creditActionType })` (cost comes from `creditCosts` table); (4) `ctx.scheduler.runAfter(0, internal.actions.imageToolGeneric.generateGeneric, { ... })`; (5) return. **Client never calls the action.**
-   `imageToolGeneric.ts` — **internal action only** (`internalAction`):
    -   **Args**: `modelId`, `params`, `transactionId`, `clerkUserId` (passed from mutation), all with `v.*` validators.
    -   **Logic**: Look up endpoint + mapping from config. Map params to API shape. Submit to Fal. Poll. On success: `ctx.runMutation(internal.imageToolHistory.insertImageToolEntry, { ... })`. On failure: `ctx.runMutation(api.credits.refundCredits, { transactionId, reason })` then throw. **No direct `ctx.db` in the action** — state changes only via mutations.
    -   **Benefit**: Adding a new model = adding one config entry; no action code change.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write convex/actions/imageToolGeneric.ts convex/configs/falModels.ts convex/imageTool.ts

# Step 3: Deploy to Convex dev
npx convex dev --once
```
**Convex Master checks**: (1) No `api.actions.imageToolGeneric` exposed to client; only mutation `api.imageTool.startGenericGeneration`. (2) Mutation uses `internal.actions.imageToolGeneric.generateGeneric` in scheduler. (3) Action uses `internalAction`; state updates only via `runMutation` (insertImageToolEntry, refundCredits).

**Task 1.1 QA checklist** (run before marking done):
- [x] Step 1: `npx tsc --noEmit` — passes
- [x] Step 2: `npx biome check --write convex/actions/imageToolGeneric.ts convex/configs/falModels.ts convex/imageTool.ts` — passes
- [x] Step 3: `npx convex dev --once` (or deploy) — done
- [x] Convex Master (1): Client cannot call `api.actions.imageToolGeneric` (internal only)
- [x] Convex Master (2): `imageTool.ts` schedules `internal.actions.imageToolGeneric.generateGeneric`
- [x] Convex Master (3): `imageToolGeneric.ts` uses `internalAction`; no `ctx.db`, only `runMutation` (refundCredits, insertImageToolEntry)

### ✅ Task 1.2: Model Schema System (2 h)

**Objective**: Define the TypeScript interfaces and model schemas for the Frontend, aligned with **all models** in IMAGE-MODELS-ANALYSIS.md.

**Files to Create/Modify**:
-   Create: `components/image-generator/types/schema.ts`
-   Create: `components/image-generator/constants/modelSchemas.ts`

**Implementation**:
-   Define `ModelSchema` interface (id, name, **modelId** for FAL/API, **creditActionType** for `getCreditCost`, badges, **capabilities**, params). **Capabilities** per IMAGE-MODELS-ANALYSIS: `negativePrompt`, `maxResolution`, `multiImage`, `elements`, `resultTypeSeries`, `aspectAuto` — drive visibility of params and RefsPanel (single vs multi slot). Schema **id** can be app-facing (e.g. `kling-o3-t2i`); **modelId** must match backend (e.g. `fal-ai/kling-image/o3/text-to-image`) for `startGenericGeneration`. **creditActionType** must match a row in Convex `creditCosts` so the UI can call `getCreditCost(selectedModel.creditActionType)` for the Generate button cost.
-   Create schemas for **all 8 analyzed models** (see IMAGE-MODELS-ANALYSIS.md § Models to Analyze):
  - **Kling**: `fal-ai/kling-image/v3/text-to-image`, `fal-ai/kling-image/v3/image-to-image`, `fal-ai/kling-image/o3/text-to-image`, `fal-ai/kling-image/o3/image-to-image`
  - **Grok**: `xai/grok-imagine-image`, `xai/grok-imagine-image/edit`
  - **Nano Banana Pro**: `fal-ai/nano-banana-pro`, `fal-ai/nano-banana-pro/edit`
  Param names, control types, options, and defaults must follow each model’s “Schema → control mapping” and “Input Parameters” in the analysis. No arbitrary subset — the schema system covers every documented model.
-   **Control types**: Use `text`, `number`, `select`, `toggle`, `icon-select`, `segmented`; include `slider` where the analysis requires it (e.g. Nano Banana `safety_tolerance` 1–6). **result_type** dependency (show series_amount vs num_images when result_type = series) must be expressible in schema or OptionsPanel logic. Optional `advanced: true` on params for collapsible “Advanced options” (e.g. negative_prompt, seed, enable_web_search).

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/types/schema.ts components/image-generator/constants/modelSchemas.ts
```

### ✅ Task 1.3: Dynamic Options Panel (2 h)

**Objective**: Create a component that renders the UI based on the selected model's schema.

**Files to Create/Modify**:
-   Create: `components/image-generator/OptionsPanel.tsx`
-   Create: `components/image-generator/DynamicField.tsx`
-   Modify: `components/image-generator/input-section.tsx` (replace hardcoded fields)
-   Modify: `components/image-generator/index.tsx` (wire submit to `startGenericGeneration(modelId, params)`; pass `creditCost` from selected model’s `creditActionType` or mode)

**Implementation**:
-   **Switch to generic mutation**: Where the UI currently calls `startKlingT2IGeneration` / `startKlingI2IGeneration` (e.g. from `index.tsx` or input-section callback), replace with `startGenericGeneration({ modelId, params, ...refs })`. Parent must pass `modelId` (Phase 1: one model per mode, e.g. from schema or constant) and collect `params` from OptionsPanel state.
-   `OptionsPanel`: Iterates over schema params; respects **capabilities** and **mode** (Generate vs Edit) so e.g. resolution 4K, negative_prompt, aspect "auto" only show when supported. Renders `DynamicField` per param.
-   `DynamicField`: Renders `VisualSelect` (icon-select / segmented), `Input`, `Switch`, etc. from param type. **Advanced**: params with `advanced: true` go inside collapsible "Advanced options" (Negative prompt, Seed, safety_tolerance, etc. per model).
-   Implement **parameter dependency** for O3: when result_type = series show series_amount and hide num_images; when single, opposite (per IMAGE-MODELS-ANALYSIS).
-   **Credit cost**: Use `getCreditCost(creditActionType)` for the current model/mode (Phase 1: e.g. `image_generation` / `image_edit` or per-model actionType from schema) and pass to FloatingPromptBar.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/OptionsPanel.tsx components/image-generator/DynamicField.tsx components/image-generator/input-section.tsx components/image-generator/index.tsx
```

---

## 🔍 Phase 2: Model Discovery (6 hours)

**Goal**: Enable browsing of 20+ models.

### ✅ Task 2.1: Model Selector Modal (4 h)

**Objective**: Build a rich modal for model discovery.

**Files to Create/Modify**:
-   Create: `components/image-generator/ModelSelector.tsx`
-   Create: `components/image-generator/ModelGrid.tsx`
-   Create: `components/image-generator/ModelCard.tsx`

**Implementation**:
-   Use `shadcn/ui` Dialog.
-   Implement Search (filter by name) and Category Tabs.
-   `ModelCard`: Thumbnail, Badges, Cost, Capabilities icons.
-   **Empty state** (when no models match search/filter): Use design-master empty-state pattern — centered layout, icon in rounded muted circle, title + description, no CTA needed. Example:
    ```tsx
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-muted p-6">
        <Search className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{t("no_models_found")}</h3>
      <p className="mb-6 text-sm text-muted-foreground">{t("no_models_found_desc")}</p>
    </div>
    ```
-   **i18n**: `t("model_selector_title")`, `t("search_models")`, `t("no_models_found")`, `t("no_models_found_desc")`.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/ModelSelector.tsx components/image-generator/ModelGrid.tsx components/image-generator/ModelCard.tsx
```

### ✅ Task 2.2: Expand Model Schemas (2 h)

**Objective**: Align schemas and backend with the **8 selected models** in IMAGE-MODELS-ANALYSIS.md (no 20+ expansion for now).

**Scope (v1.0)**: 8 models — Kling v3/O3 T2I & I2I, Grok T2I & Edit, Nano Banana Pro T2I & Edit. Expand to 20+ (Flux, SDXL, etc.) in a later phase.

**Files to Create/Modify**:
-   Modify: `components/image-generator/constants/modelSchemas.ts` (already has all 8 with params, capabilities)
-   Modify: `convex/configs/falModels.ts` (Backend mapping — add Grok + Nano Banana)
-   Modify: `convex/seedCredits.ts` (creditCosts rows for Grok + Nano action types)

**Implementation**:
-   **modelSchemas.ts**: Already complete for 8 models (params, control types, options, defaults, capabilities). No change needed unless aligning further with analysis.
-   **falModels.ts**: Add entries for `xai/grok-imagine-image`, `xai/grok-imagine-image/edit`, `fal-ai/nano-banana-pro`, `fal-ai/nano-banana-pro/edit` with endpoint, type, creditActionType matching schema.
-   **creditCosts**: Seed rows for `image_generation_grok_t2i`, `image_edit_grok`, `image_generation_nano_banana`, `image_edit_nano_banana` so backend can deduct; adjust credits in dashboard as needed.
-   Ensure resolution/aspect/negative_prompt/etc. are omitted or limited per model (e.g. Grok has no resolution; Grok Edit has no aspect_ratio) — already reflected in schemas.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/constants/modelSchemas.ts convex/configs/falModels.ts

# Step 3: Deploy to Convex dev (backend config changed)
npx convex dev --once
```

---

## 🛠️ Phase 3: Edit Mode Refinement (6 hours)

**Goal**: Polish the Edit workflow with Smart Refs.

### ✅ Task 3.1: Smart Refs UI (3 h)

**Objective**: Create the two-zone reference panel (Selected + Add).

**Files to Create/Modify**:
-   Create: `components/image-generator/RefsPanel.tsx`
-   Modify: `components/image-generator/ImageEditPanel.tsx`

**Implementation**:
-   "Selected Refs": Row of thumbnails with `@Image1`, `@Image2` … labels. Drag-and-drop reordering. **Schema-driven**: **single slot** (image_url) for v3 I2I and Grok Edit; **multiple slots** (image_urls, 1–10 or 1+) for O3 I2I and Nano Banana Edit — see IMAGE-MODELS-ANALYSIS; capability `multiImage` or param name drives which.
-   "Add Refs": Tabs for Upload / History.
-   **Preserve Elements**: Ensure the existing "Elements" (character/object) functionality is integrated or preserved alongside this for Kling models; other models (Grok, Nano Banana) have no elements — schema omits.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/RefsPanel.tsx components/image-generator/ImageEditPanel.tsx
```

### ✅ Task 3.2: Premium Tab System & Unified OptionsPanel (3 h) - **CRITICAL TRANSFORMATION**

**Objective**: Transform the broken "2000s admin panel" tabs into a premium glassmorphic tab system with unified OptionsPanel.

**Files to Create/Modify**:
-   Create: `components/image-generator/PremiumTabSystem.tsx`
-   Modify: `components/image-generator/ImageEditPanel.tsx`
-   Modify: `components/image-generator/index.tsx` (integrate new tab system)

**Implementation**:
-   **Glassmorphic Tab Container**: Floating panel with `backdrop-blur-md`, `bg-background/60`, `border-white/10`, `rounded-xl`.
-   **Premium Tab Design**: 
    - Subtle active states with `ring-1 ring-primary/50` and `bg-primary/20`
    - Smooth transitions between modes
    - No harsh borders or blocky rectangles
-   **Visual Integration**: Tabs float above the canvas as part of the command center
-   **Unified OptionsPanel**: Replace hardcoded edit options with `<OptionsPanel model={editModel} />`
-   **Mode Context**: Ensure Generate/Edit tabs change available toolsets seamlessly
-   **Dependency**: Requires Task 1.2 and 1.3 to be complete.

**Design Specification**:
```tsx
// Premium floating glass tabs - RESPONSIVE
interface PremiumTabSystemProps {
  mode: 'generate' | 'edit';
  setMode: (mode: 'generate' | 'edit') => void;
}

// Mobile-first responsive positioning
<div className="fixed left-1/2 -translate-x-1/2 z-50
  top-16 sm:top-20 md:top-24">
  <div className="flex gap-2 p-1 rounded-xl bg-background/60 backdrop-blur-md border border-white/10 shadow-lg">
    <button className={`px-3 py-2 sm:px-4 rounded-lg transition-all duration-200 ${
      mode === 'generate' 
        ? 'bg-primary/20 text-primary ring-1 ring-primary/50' 
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
    }`}>
      Generate
    </button>
    <button className={`px-3 py-2 sm:px-4 rounded-lg transition-all duration-200 ${
      mode === 'edit' 
        ? 'bg-primary/20 text-primary ring-1 ring-primary/50' 
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
    }`}>
      Edit
    </button>
  </div>
</div>
```

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/PremiumTabSystem.tsx components/image-generator/ImageEditPanel.tsx components/image-generator/index.tsx
```

---

## 📝 PROGRESS SUMMARY

| Task | Description | Status |
| :--- | :--- | :--- |
| **Task 0.1** | Floating Prompt Bar (Glass UI) | ✅ |
| **Task 0.2** | Visual Selectors (Icons > Text) | ✅ |
| **Task 0.3** | Modern Typography & Glass Containers | ✅ |
| **Task 0.3.5**| Collapsible Advanced Options | ✅ |
| **Task 0.4** | Resizable Prompt Logic | ✅ |
| **Task 0.5** | Quick Presets | ✅ |
| **Task 0.6** | Credit Cost Display | ✅ |
| **Task 1.1** | **Generic Backend Action** (Refactor) | ✅ |
| **Task 1.2** | Model Schema System (Types/Constants) | ✅ |
| **Task 1.3** | Dynamic Options Panel | ✅ |
| **Task 2.1** | Model Selector Modal | ✅ |
| **Task 2.2** | Expand Model Schemas (8 models) | ✅ |
| **Task 3.1** | Smart Refs UI (Edit Mode) | ✅ |
| **Task 3.2** | Premium Tab System & Unified OptionsPanel | ✅ |

---

## ⏱️ TIME TRACKING

| Task | Estimated | Actual | Status |
| :--- | :--- | :--- | :--- |
| Phase 0: Visual Quick Wins | 8.5h | — | ✅ |
| Phase 1: Modular Backend & Schema | 6.5h | | ⬜ |
| Phase 2: Model Discovery | 6h | | ⬜ |
| Phase 3: Edit Mode Refinement | 6h | | ⬜ |
| **TOTAL** | **~27h** | | |

---

## 📁 FILES CREATED / MODIFIED (SUMMARY)

| File | Purpose | Phase 0 |
| :--- | :--- | :--- |
| `convex/actions/imageToolGeneric.ts` | **NEW**: Modular backend action for any Fal model | |
| `convex/configs/falModels.ts` | **NEW**: Configuration map for backend models | |
| `components/image-generator/FloatingPromptBar.tsx` | Floating glass prompt bar (i18n, ICU counter, cost) | ✅ |
| `components/image-generator/VisualSelect.tsx` | **NEW**: Visual selector (grid / segmented) | ✅ |
| `components/ui/collapsible.tsx` | **NEW**: Radix Collapsible wrapper (shadcn) | ✅ |
| `components/image-generator/OptionsPanel.tsx` | Dynamic form renderer | |
| `components/image-generator/DynamicField.tsx` | Field renderer for schema types | |
| `components/image-generator/ModelSelector.tsx` | Discovery modal | |
| `components/image-generator/RefsPanel.tsx` | Edit mode reference manager | |
| `components/image-generator/PremiumTabSystem.tsx` | **NEW**: Premium floating tabs | |
| `components/image-generator/types/schema.ts` | Schema interfaces | |
| `components/image-generator/constants/modelSchemas.ts` | Model definitions | |
| `components/image-generator/input-section.tsx` | Refactored: VisualSelect, Collapsible, Quick Presets, tokens | ✅ |
| `components/image-generator/ImageEditPanel.tsx` | Updated with RefsPanel and PremiumTabs | |
| `components/image-generator/index.tsx` | FloatingPromptBar, glass container, typography | ✅ |
| `messages/en.json` | Phase 0 i18n keys; `pnpm translate` run | ✅ |

---

## 🔍 PRE-SPRINT CHECKLIST

-   [ ] **Design Assets**: Verify access to icons (Lucide React) for visual selectors.
-   [ ] **Convex Master alignment**: New mutation `startGenericGeneration` only; client never calls actions. Mutation deducts credits then schedules `internal.actions.imageToolGeneric.generateGeneric`. Action is `internalAction`; state changes only via `runMutation` (insertImageToolEntry, refundCredits). All mutation args use `v.*` validators.
-   [ ] **IMAGE-MODELS-ANALYSIS**: Reviewed; initial 4 Kling schemas and backend mapping align with analysis (param names, image_url vs image_urls, response path, capabilities). Phase 2 expansion uses full list of 8 documented models.
-   [ ] **Fal.ai API**: Verify model capabilities for schema definitions (analysis doc is source of truth).
-   [ ] **Environment**: Ensure `npx convex dev` is running.
-   [ ] **Per-task QA**: Run each task's 2-Step QA (Step 3 `npx convex dev --once` for Convex tasks) before moving to the next; do not merge without passing.
-   [ ] **i18n (image_generator namespace)**:
    -   [ ] Floating Prompt Bar: `floating_prompt_placeholder`, maxLength warning keys.
    -   [ ] Visual Selectors: aspect/resolution keys (e.g. `visual_select_aspect_square`, etc.).
    -   [ ] Prompt logic: character counter messages (ICU if plural/variable).
    -   [ ] Quick Presets: `preset_fast`, `preset_quality`, `preset_batch`.
    -   [ ] Advanced Options: `advanced_options_show`, `advanced_options_hide`.
    -   [ ] Credit cost: variable cost display (e.g. `{cost}` in label).
    -   [ ] Model selector: `model_selector_title`, `search_models`, `no_models_found`, `no_models_found_desc`.
    -   [ ] Add keys to `messages/en.json` then run `pnpm translate` and `pnpm i18n:verify`.
-   [ ] **Design Master**: Semantic tokens only (no `bg-white`/`bg-black`/`bg-gray-*`); touch targets `min-h-[44px]`; body `leading-relaxed`; use shadcn/ui from `components/ui/`; animations ≤500ms. Check `input-section.tsx` and `output-section.tsx` for hardcoded colors and replace with `bg-card`/`bg-background`/`text-muted-foreground`.

---

## 🎯 SUCCESS METRICS

-   **Visuals**: UI matches "Premium Studio" aesthetic (Glassmorphism, Floating Bar, Premium Tabs).
-   **Scalability**: Adding a new model requires only a schema update + backend config entry (endpoint, type, optional parameterMapping/responsePath), **NO code changes** — per IMAGE-MODELS-ANALYSIS.
-   **Alignment**: Schema capabilities and params match analysis (single vs multi ref, resolution 2K vs 4K, negative prompt, result_type, aspect auto, etc.); RefsPanel and OptionsPanel behave correctly for all 8 documented models when expanded in Phase 2.
-   **Usability**: Prompt bar handles long text (schema-driven maxLength); visual selectors are intuitive; advanced options collapsible.
-   **Performance**: Dynamic options load instantly; no layout shift.

---

## ✅ FINAL SPRINT QA (before marking sprint complete)

Run after all tasks are done. Ensures full codebase passes and Convex dev is deployed.

```bash
# 1. Full TypeScript check
npx tsc --noEmit

# 2. Full Biome check
npx biome check --write .

# 3. Deploy to Convex dev
npx convex dev --once
```

If i18n keys were added: `pnpm translate` then `pnpm i18n:verify`. If the project has relevant tests, run `npx vitest run` before deploy.
