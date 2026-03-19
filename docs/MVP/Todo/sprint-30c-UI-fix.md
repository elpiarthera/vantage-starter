# Sprint 30c: Canvas-First UI Rebuild — "Kill the Sidebar"

**Date**: February 14, 2026
**Status**: 🔴 CRITICAL FIX
**Estimated Time**: ~17.5 hours
**Goal**: Dismantle the "Admin Panel" split-screen sidebar and implement the true "Floating Studio" canvas-first UI per the [UI-UX-REDESIGN-PROPOSAL.md](../../Analysis/image-generator/UI-UX-REDESIGN-PROPOSAL.md) (v3.1).
**Dependencies**: Sprint 30 Phase 0 (FloatingPromptBar, VisualSelect, OptionsPanel, Collapsible) ✅ · Sprint 30 Phase 1 (Schema System, Generic Backend) ✅ · Sprint 30 Phase 2 (ModelSelector, ModelGrid, ModelCard) ✅
**Analysis**: [UI-UX-REDESIGN-PROPOSAL.md](../../Analysis/image-generator/UI-UX-REDESIGN-PROPOSAL.md) (v3.1) · [IMAGE-MODELS-ANALYSIS.md](../../Analysis/image-generator/IMAGE-MODELS-ANALYSIS.md) (v1.0 — 8 models)
**QA Strategy**: **2-Step QA** — (1) TypeScript `npx tsc --noEmit`, (2) Biome `npx biome check --write <files>` for every task. i18n tasks add `pnpm translate` then `pnpm i18n:verify`. No task merges without passing its QA block. Clean code: typed props, semantic tokens, translated strings per design/i18n masters.

---

## 🚨 Deep Analysis: Why the Sprint 30 Implementation Failed

The Sprint 30 code output is a **failed execution** of the design vision. It kept the old "Admin Panel" form with minor styling tweaks, whereas the proposal demanded a fundamental architectural shift to a "Creative Studio" layout.

### ❌ 1. Fundamental Layout Failure (The "Admin Panel" Trap)
- **Vision**: A **"Canvas-First"** experience — the image fills the screen, controls **float** on top.
- **Reality**: The layout remains a **Split-Screen Dashboard** (`flex-row` with `InputSection` sidebar on the left, `OutputSection` on the right, resizable handle between).
- **Verdict**: The `InputSection` sidebar rendering must be **removed from the layout**, not refactored. Its state logic is rewired to floating panels.

### ❌ 2. The "Floating" Prompt Bar Exists But Is Obscured
- **Vision**: A **Floating Command Center** at the bottom center, always visible above the canvas.
- **Reality**: `FloatingPromptBar` component exists and is correctly built, but it renders **behind the sidebar** split layout, defeating the purpose.

### ❌ 3. Model Selection is Invisible
- **Vision**: A rich **Model Discovery Modal** triggered from the floating UI.
- **Reality**: `ModelSelector` component exists but there is **no visible trigger** in the main UI — no button, no badge.

### ❌ 4. Edit Mode is a Sidebar Form, Not a Floating Tool
- **Vision**: A **"Smart Refs" Overlay** — floating panel with drag-and-drop thumbnails.
- **Reality**: `RefsPanel` and `ImageEditPanel` exist but render as sidebar content in the same split-screen layout.

---

## 🎨 DESIGN SYSTEM & MOBILE-FIRST ALIGNMENT (MANDATORY)

**CRITICAL**: All modifications must follow [.cursor/agents/design-master.md](../../.cursor/agents/design-master.md) and [.cursor/agents/mobile-first-guardian.md](../../.cursor/agents/mobile-first-guardian.md).

### Visual Strategy ("Floating Studio")
- **Glassmorphism**: `bg-background/80` or `bg-card/60` with `backdrop-blur-md` and `border-border/50`.
- **Floating UI**: All controls float above the canvas as overlay layers.
- **Typography**: Labels `text-sm font-medium tracking-tight`; inputs `text-base`; body `leading-relaxed`.
- **Transitions**: Use `transition-smooth` utility (not raw `transition-all duration-*`). All animations ≤ 500ms.

### Design Token Compliance (design-master)
| Replace | With (Semantic Token) |
| :--- | :--- |
| `border-white/10` | `border-border/50` |
| `bg-white` | `bg-background` or `bg-card` |
| `text-white` | `text-foreground` |
| `text-gray-400` | `text-muted-foreground` |
| `border-gray-600` | `border-border` |
| `bg-black/*` | `bg-background/80` or `bg-card/60` (glass) |
| `shadow-2xl` (floating panels) | `shadow-lg` (consistent) |
| `transition-all duration-200` | `transition-smooth` |

### Standardized Glass Effect (all floating panels)
All floating panels **must** use this consistent glass style:
```
backdrop-blur-md bg-background/60 border border-border/50 shadow-lg rounded-xl
```
Do **not** mix `backdrop-blur-xl` / `backdrop-blur-md` or `shadow-2xl` / `shadow-lg` across panels.

### Z-Index Stacking Context (MANDATORY)
Multiple fixed layers require a defined stacking order:

| Layer | Component | z-index | Notes |
| :--- | :--- | :--- | :--- |
| 0 | Canvas / `OutputSection` | `z-0` | Full-screen background |
| 30 | `FloatingOptionsPanel` / `RefsPanel` | `z-30` | Side/bottom overlays |
| 40 | `PremiumTabSystem` | `z-40` | Top navigation |
| 40 | `FloatingPromptBar` | `z-40` | Bottom prompt (non-overlapping with tabs) |
| 50 | Modal overlays (`ModelSelector`, `AdaptiveModal`) | `z-50` | Via shadcn Dialog/Drawer |
| 60 | `GlobalDropZone` | `z-60` | Drag overlay |
| 70 | `FullscreenViewer` | `z-70` | Fullscreen image |

### Mobile-First CSS Approach (mobile-first-guardian)
- **Base styles = mobile (320px)**. Enhance with `sm:`, `md:`, `lg:`.
- **Touch targets**: All interactive elements **min-h-[44px] min-w-[44px]** (WCAG 2.1 AA).
- **Touch feedback**: All buttons include `active:scale-95` state.
- **Inputs**: `text-base` (16px min) to prevent iOS zoom.
- **Safe areas**: Bottom panels use `pb-[env(safe-area-inset-bottom)]`.
- **Device detection**: Use `useDevice()` from `@/contexts/DeviceContext` — **not** legacy `useMobile()`.
- **Adaptive components**: Use `AdaptiveModal` for panels that become bottom-sheet drawers on mobile.
- **Breakpoints**: sm 640px, md 768px, lg 1024px. Layout works at **320px+** (iPhone SE).

### shadcn/ui Components (design-master)
- Use `Button` from `@/components/ui/button` (not raw `<button>`) with variants `default` | `secondary` | `outline` | `ghost` and sizes `default` | `sm` | `lg` | `icon`.
- Use `Tabs` / `TabsList` / `TabsTrigger` from `@/components/ui/tabs` for tab navigation (provides ARIA roles, keyboard arrow nav, focus management).
- Use `Collapsible` / `CollapsibleTrigger` / `CollapsibleContent` for expand/collapse.
- Use `Dialog` for modals; `Drawer` (via `AdaptiveModal`) for mobile overlays.
- Use `Skeleton` from `@/components/ui/skeleton` for loading states.

---

## ✅ i18n MASTER ALIGNMENT (MANDATORY)

All UI text **must** follow [.cursor/agents/i18n-master.md](../../.cursor/agents/i18n-master.md): `useTranslations("image_generator")`, ICU for plurals/variables, `Link` from `@/i18n/routing`.

### New i18n Keys to Add

All keys go under the `image_generator` namespace in `messages/en.json`. Total: **57 new keys**.

#### Component UI Keys (22 keys)

| Key | Value | Format | Task |
| :--- | :--- | :--- | :--- |
| `model_selector_trigger` | `"Model: {name}"` | ICU variable | 3 |
| `options_panel_title` | `"Options"` | plain | 2 |
| `options_panel_collapse` | `"Hide Options"` | plain | 2 |
| `options_panel_expand` | `"Show Options"` | plain | 2 |
| `credit_count` | `"{count, plural, one {1 credit} other {# credits}}"` | ICU plural | 5 |
| `capability_4k` | `"4K"` | plain | 5 |
| `capability_2k` | `"2K"` | plain | 5 |
| `capability_negative_prompt` | `"Negative prompt"` | plain | 5 |
| `capability_series` | `"Series"` | plain | 5 |
| `capability_multi_ref` | `"Multi ref"` | plain | 5 |
| `capability_elements` | `"Elements"` | plain | 5 |
| `capability_auto_aspect` | `"Auto aspect"` | plain | 5 |
| `image_copied` | `"Image copied to clipboard!"` | plain | 5 |
| `image_data_copied` | `"Image data copied! Paste in compatible apps."` | plain | 5 |
| `copy_not_supported` | `"Copy not supported. Use download button instead."` | plain | 5 |
| `copying_image` | `"Copying image..."` | plain | 5 |
| `copy_click_first` | `"Please click on the page first, then try copying again"` | plain | 5 |
| `copy_image_failed` | `"Failed to copy image"` | plain | 5 |
| `tabs_aria_label` | `"Generate or Edit"` | plain | 3 |
| `model_grid_aria_label` | `"Image models"` | plain | 5 |
| `field_decrease` | `"Decrease {label}"` | ICU variable | 5 |
| `field_increase` | `"Increase {label}"` | ICU variable | 5 |
| `resize_panels_aria` | `"Resize panels"` | plain | 1 |

#### Schema Param Label Keys (17 keys)

These replace hardcoded English `ParamSchema.label` values in `modelSchemas.ts`. The schema stores the **i18n key name**, and `DynamicField` resolves it via `t(param.label)`.

| Key | Value | Used by |
| :--- | :--- | :--- |
| `schema_label_prompt` | `"Prompt"` | All models |
| `schema_label_prompt_with_refs` | `"Prompt (use @Image1, @Image2…)"` | O3 I2I |
| `schema_label_negative_prompt` | `"Negative prompt"` | v3 T2I |
| `schema_label_elements_hint` | `"Elements (@Element1, @Element2)"` | v3 T2I |
| `schema_label_elements` | `"Elements"` | v3 I2I, O3 T2I, O3 I2I |
| `schema_label_resolution` | `"Resolution"` | Kling, Nano Banana |
| `schema_label_num_images` | `"Number of images"` | All models |
| `schema_label_aspect_ratio` | `"Aspect ratio"` | All models |
| `schema_label_output_format` | `"Output format"` | All models |
| `schema_label_result_type` | `"Result type"` | O3 T2I, O3 I2I |
| `schema_label_series_amount` | `"Series amount"` | O3 T2I, O3 I2I |
| `schema_label_reference_image` | `"Reference image"` | v3 I2I, Grok I2I |
| `schema_label_reference_images` | `"Reference images"` | O3 I2I, Nano Banana I2I |
| `schema_label_seed` | `"Seed"` | Nano Banana |
| `schema_label_safety_tolerance` | `"Safety tolerance"` | Nano Banana |
| `schema_label_limit_generations` | `"Limit generations"` | Nano Banana |
| `schema_label_enable_web_search` | `"Enable web search (+$0.015)"` | Nano Banana |

#### Schema Option Label Keys (18 keys)

These replace hardcoded English `ParamOption.label` values. Numeric ratios (`"4:3"`, `"3:2"`, etc.) are universal and stay as-is. Only translatable words are keyed.

| Key | Value | Used in |
| :--- | :--- | :--- |
| `schema_option_landscape` | `"Landscape"` | Aspect ratio options |
| `schema_option_portrait` | `"Portrait"` | Aspect ratio options |
| `schema_option_square` | `"Square"` | Aspect ratio options |
| `schema_option_auto_from_input` | `"Auto (from input)"` | O3 I2I aspect |
| `schema_option_auto_from_prompt` | `"Auto (from prompt)"` | Nano Banana aspect |
| `schema_option_1k` | `"1K"` | Resolution options |
| `schema_option_2k` | `"2K"` | Resolution options |
| `schema_option_4k` | `"4K"` | Resolution options |
| `schema_option_jpeg` | `"JPEG"` | Output format options |
| `schema_option_png` | `"PNG"` | Output format options |
| `schema_option_webp` | `"WebP"` | Output format options |
| `schema_option_single` | `"Single"` | Result type options |
| `schema_option_series` | `"Series"` | Result type options |
| `schema_option_safety_1` | `"1 (Strictest)"` | Safety tolerance |
| `schema_option_safety_2` | `"2"` | Safety tolerance |
| `schema_option_safety_3` | `"3"` | Safety tolerance |
| `schema_option_safety_4` | `"4 (Default)"` | Safety tolerance |
| `schema_option_safety_5` | `"5"` | Safety tolerance |
| `schema_option_safety_6` | `"6 (Permissive)"` | Safety tolerance |

Existing keys already cover: `tab_generate`, `tab_edit`, `edit_refs_label`, `refs_tab_upload`, `refs_tab_history`, `history`, `advanced_options_show`, `advanced_options_hide`.

### Schema Label Translation Strategy (MANDATORY — Done in Task 5)

`modelSchemas.ts` has 50+ hardcoded English labels in `ParamSchema.label` and `ParamOption.label`. **This is migrated in this sprint, not deferred.**

**Approach:**
1. **Schema `label` fields store i18n key names** (e.g., `label: "schema_label_prompt"`) instead of raw English strings.
2. **Schema `ParamOption.label` fields store i18n key names** for translatable words (e.g., `label: "schema_option_landscape"`). Numeric ratios like `"4:3"`, `"21:9"` stay as raw values since they are universal.
3. **`DynamicField` resolves labels via `t()`**: Replace `const label = param.label ?? param.key` with `const label = t(param.label ?? param.key)`. All option labels rendered in `VisualSelect`, `Select`, etc. are also resolved via `t(option.label)`.
4. **`VisualSelect` receives resolved labels**: `DynamicField` maps `param.options` through `t()` before passing to `VisualSelect`.
5. All 35 new schema keys are added to `messages/en.json` and translated via `pnpm translate`.

---

## 🏗️ New Architecture

```
Root: ImageCombiner (full screen, relative container)
├── Layer 0 (Canvas): OutputSection — full width/height, centered
├── Layer 1 (Top): PremiumTabSystem — fixed top center (z-40) + ModelSelector trigger
├── Layer 2 (Bottom): FloatingPromptBar — fixed bottom center (z-40)
├── Layer 3 (Overlay): FloatingOptionsPanel — fixed right on desktop, Drawer on mobile (z-30)
├── Layer 4 (Edit Overlay): RefsPanel — fixed left on desktop, Drawer on mobile (z-30)
└── Layer 5+ (Modals): ModelSelector, FullscreenViewer, GlobalDropZone (z-50+)
```

---

## 📋 Task List

### Task 1: Dismantle Split-Screen Layout & Unify Canvas (3 h)

**Objective**: Remove the sidebar split-screen grid and make `OutputSection` the full-screen canvas. Rewire state so all controls are accessible via floating panels.

**Files to Modify**:
- `components/image-generator/index.tsx` (major refactor)

**Implementation**:

#### 1a. Remove Split-Screen Layout
- Remove `flex-row` / `flex` grid that places `InputSection` on left and `OutputSection` on right.
- Remove the resizable handle (`ResizableHandle`) and all `leftWidth` / resize state.
- Remove `InputSection` from the render tree (the component file stays; only its rendering is removed).
- Make `OutputSection` container fill the available space: `relative w-full h-full min-h-[calc(100vh-64px)]`.

#### 1b. Migrate to `useDevice()`
- Replace `import { useMobile } from "@/hooks/use-mobile"` with `import { useDevice } from "@/contexts/DeviceContext"`.
- Replace `const isMobile = useMobile()` with `const { isMobile, isDesktop } = useDevice()`.

#### 1c. Wire Floating Panels into Canvas Layout
- Ensure `PremiumTabSystem` renders at the top with `z-40` (already exists, just needs z-index correction from `z-50` to `z-40`).
- Ensure `FloatingPromptBar` renders at the bottom with `z-40` (already exists, correct z-index from `z-50` to `z-40`).
- Add render slot for `FloatingOptionsPanel` (Task 2 builds the component).
- Add render slot for `RefsPanel` floating overlay when `mode === 'edit'` (Task 4 handles positioning).

#### 1d. History Access
- The sidebar had inline history. Add a `History` icon-button trigger in the floating prompt bar area (e.g., left of the prompt bar) that opens history via `AdaptiveModal` (Dialog on desktop, Drawer on mobile).
- Use existing `GenerationHistory` component inside the modal.
- Use existing i18n key `t("history")` for the trigger.

#### 1e. Unified Mode Handling
- Both Generate and Edit modes render within the **same canvas layout**. Do NOT swap the entire tree for `ImageEditPanel`.
- When `mode === 'edit'`: show `RefsPanel` overlay, `FloatingOptionsPanel` uses edit model schema, `FloatingPromptBar` prompt includes `@Image` hint.
- When `mode === 'generate'`: hide `RefsPanel`, `FloatingOptionsPanel` uses generate model schema.

#### States
- **Empty state** (no image generated): `OutputSection` shows centered empty state with icon + `t("empty_history_title")` + `t("empty_history_description")`.
- **Loading state**: `OutputSection` shows `Skeleton` placeholder during generation.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/index.tsx
```

---

### Task 2: FloatingOptionsPanel — Desktop Overlay + Mobile Drawer (3 h)

**Objective**: Create a floating glass overlay that wraps `OptionsPanel`, positioned as a side panel on desktop and a bottom-sheet drawer on mobile.

**Files to Create/Modify**:
- Create: `components/image-generator/FloatingOptionsPanel.tsx`
- Modify: `components/image-generator/index.tsx` (wire in)
- Modify: `components/image-generator/OptionsPanel.tsx` (fix advanced toggle touch target)

**Implementation**:

#### 2a. Desktop: Floating Side Panel
- Position: `hidden md:block md:fixed md:top-24 md:right-6 md:w-80` (only visible on `md:` and up).
- Glass style: `backdrop-blur-md bg-background/60 border border-border/50 shadow-lg rounded-xl` (standardized).
- z-index: `z-30` (per stacking table).
- Contains: `OptionsPanel` (schema-driven), collapse/expand toggle via `Collapsible`.
- Collapse trigger: `<Button variant="ghost" size="sm">` with `min-h-[44px]`, text `t("options_panel_expand")` / `t("options_panel_collapse")`.

#### 2b. Mobile: Bottom-Sheet Drawer via AdaptiveModal
- On mobile (`isMobile` from `useDevice()`): render options inside `AdaptiveModal` (Drawer).
- Trigger: A floating "Options" `<Button variant="ghost" size="icon">` (sliders icon) positioned at `fixed bottom-20 right-4 z-30` (above prompt bar, below tabs).
- Drawer content: `OptionsPanel` with `max-h-[60vh]` and internal scroll.
- Touch target: `min-h-[44px] min-w-[44px]`.

#### 2c. Fix OptionsPanel Advanced Toggle
- Replace raw `<button>` in `OptionsPanel.tsx` with `<Button variant="ghost" size="sm" className="min-h-[44px]">`.

#### 2d. VisualSelect Icons Verification
- Verify `VisualSelect.tsx` renders Lucide **icons** (Square, RectangleHorizontal, RectangleVertical) for aspect ratios, not text-only fallbacks.

#### States
- **Loading**: Show `Skeleton` lines while schema loads (if async).
- **Collapsed** (desktop): Show only the expand trigger button.
- **Open** (mobile drawer): Drawer with drag handle.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/FloatingOptionsPanel.tsx components/image-generator/OptionsPanel.tsx components/image-generator/index.tsx
```

---

### Task 3: PremiumTabSystem Fix & ModelSelector Trigger (2.5 h)

**Objective**: Fix `PremiumTabSystem` to use shadcn `Tabs` (keyboard nav, ARIA), fix design violations, and wire a visible `ModelSelector` trigger.

**Files to Modify**:
- `components/image-generator/PremiumTabSystem.tsx` (rewrite)
- `components/image-generator/index.tsx` (wire model trigger)
- `components/image-generator/ModelSelector.tsx` (verify opens correctly)

**Implementation**:

#### 3a. Rewrite PremiumTabSystem with shadcn Tabs
Replace the current raw `<button>` implementation with shadcn `Tabs`:

```tsx
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

<div className="fixed left-1/2 -translate-x-1/2 top-16 sm:top-20 md:top-24 z-40">
  <div className="flex items-center gap-3 rounded-xl backdrop-blur-md bg-background/60 border border-border/50 shadow-lg p-1">
    <Tabs value={mode} onValueChange={(v) => setMode(v as "generate" | "edit")}>
      <TabsList className="bg-transparent">
        <TabsTrigger
          value="generate"
          className="min-h-[44px] px-3 py-2 sm:px-4 rounded-lg transition-smooth active:scale-95
            data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/50"
        >
          {t("tab_generate")}
        </TabsTrigger>
        <TabsTrigger
          value="edit"
          className="min-h-[44px] px-3 py-2 sm:px-4 rounded-lg transition-smooth active:scale-95
            data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/50"
        >
          {t("tab_edit")}
        </TabsTrigger>
      </TabsList>
    </Tabs>

    {/* Model Selector Trigger */}
    <Button
      variant="outline"
      size="sm"
      onClick={() => setModelSelectorOpen(true)}
      className="min-h-[44px] rounded-lg border-border/50 bg-background/40 active:scale-95"
    >
      {t("model_selector_trigger", { name: selectedSchema.name })}
    </Button>
  </div>
</div>
```

Key fixes:
- `border-white/10` → `border-border/50`
- `transition-all duration-200` → `transition-smooth`
- Raw `<button>` → shadcn `TabsTrigger` (provides arrow-key nav, ARIA `role="tab"`, focus ring)
- Add `min-h-[44px]` to all interactive elements
- Add `active:scale-95` touch feedback
- z-index: `z-40` (not `z-50`)
- Hardcoded `aria-label="Generate or Edit"` → `aria-label={t("tabs_aria_label")}`

#### 3b. Wire ModelSelector
- Add `modelSelectorOpen` state in `index.tsx`.
- Pass to `ModelSelector` dialog: `<ModelSelector open={modelSelectorOpen} onOpenChange={setModelSelectorOpen} ... />`.
- Verify `ModelSelector.tsx` opens as `Dialog` on desktop. On mobile, use `AdaptiveModal` pattern (or keep Dialog — it's a full discovery experience).
- Verify it shows all 8 models from schema, with Search, Category Tabs, Filter Pills.

#### 3c. Props Expansion
- `PremiumTabSystem` now accepts additional props: `selectedModelName: string`, `onModelSelectorOpen: () => void`.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/PremiumTabSystem.tsx components/image-generator/ModelSelector.tsx components/image-generator/index.tsx
```

---

### Task 4: Fix Edit Mode — Floating RefsPanel (2.5 h)

**Objective**: When `mode === 'edit'`, render `RefsPanel` as a floating overlay on desktop and a bottom-sheet drawer on mobile — not as sidebar content.

**Files to Modify**:
- `components/image-generator/RefsPanel.tsx` (fix touch targets, add i18n aria-labels)
- `components/image-generator/index.tsx` (floating positioning)

**Implementation**:

#### 4a. Desktop: Floating Left Panel
- Position via wrapper in `index.tsx`: `hidden md:block md:fixed md:top-24 md:left-6 md:w-80` (mirror of FloatingOptionsPanel on right side).
- Glass style: `backdrop-blur-md bg-background/60 border border-border/50 shadow-lg rounded-xl`.
- z-index: `z-30`.
- Only renders when `mode === 'edit'`.

#### 4b. Mobile: Bottom-Sheet Drawer via AdaptiveModal
- On mobile: `RefsPanel` renders inside `AdaptiveModal` (Drawer from bottom).
- Trigger: A floating `<Button variant="ghost" size="icon">` (ImageIcon) at `fixed bottom-20 left-4 z-30` (above prompt bar).
- Drawer content: `RefsPanel` with `max-h-[60vh]` and internal scroll.

#### 4c. Fix RefsPanel Touch Targets
- Drag handle buttons: currently `p-0.5` with `size-3.5` icon (14px). Add `min-h-[44px] min-w-[44px]` wrapper with `flex items-center justify-center`.
- Remove buttons: same fix — ensure 44px touch area.
- Add `active:scale-95` to all buttons.

#### 4d. Verify Functionality
- Tabs: "Upload" and "History" tabs work correctly (existing `refs_tab_upload`, `refs_tab_history` keys).
- Drag-and-drop reordering works in floating context.
- `@Image1`, `@Image2` labels render correctly.
- Single slot vs multi-slot behavior follows model schema capabilities.

#### States
- **Empty state** (no refs uploaded): Centered drop zone with upload icon + `t("upload_ref")`.
- **Loading state**: `Skeleton` thumbnails during upload.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/RefsPanel.tsx components/image-generator/index.tsx
```

---

### Task 5: i18n Hardening, Schema Label Migration & Accessibility (4 h)

**Objective**: Eliminate ALL hardcoded English strings across image generator components — including the 50+ labels in `modelSchemas.ts`. Add missing `useTranslations` hooks, apply ICU patterns, fix accessibility labels, and migrate schema labels to translation keys.

**Files to Modify**:
- `components/image-generator/constants/modelSchemas.ts` (migrate all `label` values to i18n key names)
- `components/image-generator/DynamicField.tsx` (add `useTranslations`, resolve `param.label` and `option.label` via `t()`, translate aria-labels)
- `components/image-generator/ModelCard.tsx` (add `useTranslations`, fix credit plural, translate capability labels)
- `components/image-generator/ModelGrid.tsx` (translate aria-label)
- `components/image-generator/index.tsx` (translate toast messages, resize aria-label)
- `messages/en.json` (add all 57 new keys from i18n tables above)

**Implementation**:

#### 5a. Migrate modelSchemas.ts Labels to i18n Keys (CRITICAL)

Replace all hardcoded English `label` values with i18n key names. The schema becomes a data contract — `DynamicField` resolves the display string.

**ParamSchema.label migration** — every `label:` value in all 8 model schemas:

```typescript
// BEFORE (hardcoded English)
{ key: "prompt", control: "text", maxLength: 2500, label: "Prompt" }
{ key: "negative_prompt", control: "text", label: "Negative prompt", advanced: true }
{ key: "resolution", control: "segmented", label: "Resolution" }
{ key: "aspect_ratio", control: "icon-select", label: "Aspect ratio" }
{ key: "output_format", control: "select", label: "Output format" }
{ key: "num_images", control: "number", label: "Number of images" }
{ key: "result_type", control: "segmented", label: "Result type" }
{ key: "series_amount", control: "number", label: "Series amount" }
{ key: "image_url", refType: "single", label: "Reference image" }
{ key: "image_urls", refType: "multi", label: "Reference images" }
{ key: "elements", refType: "elements", label: "Elements (@Element1, @Element2)" }
{ key: "elements", refType: "elements", label: "Elements" }
{ key: "prompt", label: "Prompt (use @Image1, @Image2…)" }
{ key: "seed", label: "Seed" }
{ key: "safety_tolerance", label: "Safety tolerance" }
{ key: "limit_generations", label: "Limit generations" }
{ key: "enable_web_search", label: "Enable web search (+$0.015)" }

// AFTER (i18n keys)
{ key: "prompt", control: "text", maxLength: 2500, label: "schema_label_prompt" }
{ key: "negative_prompt", control: "text", label: "schema_label_negative_prompt", advanced: true }
{ key: "resolution", control: "segmented", label: "schema_label_resolution" }
{ key: "aspect_ratio", control: "icon-select", label: "schema_label_aspect_ratio" }
{ key: "output_format", control: "select", label: "schema_label_output_format" }
{ key: "num_images", control: "number", label: "schema_label_num_images" }
{ key: "result_type", control: "segmented", label: "schema_label_result_type" }
{ key: "series_amount", control: "number", label: "schema_label_series_amount" }
{ key: "image_url", refType: "single", label: "schema_label_reference_image" }
{ key: "image_urls", refType: "multi", label: "schema_label_reference_images" }
{ key: "elements", refType: "elements", label: "schema_label_elements_hint" }
{ key: "elements", refType: "elements", label: "schema_label_elements" }
{ key: "prompt", label: "schema_label_prompt_with_refs" }
{ key: "seed", label: "schema_label_seed" }
{ key: "safety_tolerance", label: "schema_label_safety_tolerance" }
{ key: "limit_generations", label: "schema_label_limit_generations" }
{ key: "enable_web_search", label: "schema_label_enable_web_search" }
```

**ParamOption.label migration** — shared option arrays:

```typescript
// BEFORE
const ASPECT_KLING_8: ParamOption[] = [
  { value: "16:9", label: "Landscape" },
  { value: "9:16", label: "Portrait" },
  { value: "1:1", label: "Square" },
  { value: "4:3", label: "4:3" },  // Numeric — stays as-is
  // ...
];

// AFTER
const ASPECT_KLING_8: ParamOption[] = [
  { value: "16:9", label: "schema_option_landscape" },
  { value: "9:16", label: "schema_option_portrait" },
  { value: "1:1", label: "schema_option_square" },
  { value: "4:3", label: "4:3" },  // Numeric ratio — universal, no key needed
  // ...
];
```

Same pattern for: `ASPECT_KLING_O3_I2I` (`"Auto (from input)"` → `"schema_option_auto_from_input"`), `ASPECT_GROK_13`, `ASPECT_NANO_11` (`"Auto (from prompt)"` → `"schema_option_auto_from_prompt"`), `RESOLUTION_1K_2K`, `RESOLUTION_1K_2K_4K`, `OUTPUT_FORMAT`, `RESULT_TYPE`, `SAFETY_TOLERANCE`.

**Rule**: Numeric/ratio strings (`"4:3"`, `"3:2"`, `"21:9"`, `"2:1"`, `"5:4"`, etc.) are universal mathematical notation and stay as raw values. Only translatable English words get keys.

#### 5b. Update DynamicField.tsx to Resolve Labels via `t()`

This is the key wiring change — `DynamicField` becomes the translation boundary between schema data and rendered UI.

```typescript
// BEFORE
const label = param.label ?? param.key;

// AFTER
const t = useTranslations("image_generator");
const label = t(param.label ?? param.key);
```

For option labels in `VisualSelect`, `Select`, and `SelectItem`:

```typescript
// BEFORE — options passed with raw label
const options: VisualSelectOption[] = param.options.map((o) => ({
  value: o.value,
  label: o.label,
  icon: optionIcons?.[o.value],
}));

// AFTER — resolve translatable labels, pass-through numeric ratios
const options: VisualSelectOption[] = param.options.map((o) => ({
  value: o.value,
  label: o.label.startsWith("schema_option_") ? t(o.label) : o.label,
  icon: optionIcons?.[o.value],
}));
```

Same pattern applies to `SelectItem` rendering:
```typescript
// BEFORE
<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>

// AFTER
<SelectItem key={o.value} value={o.value}>
  {o.label.startsWith("schema_option_") ? t(o.label) : o.label}
</SelectItem>
```

Also fix aria-labels:
- Replace `` aria-label={`Decrease ${label}`} `` with `aria-label={t("field_decrease", { label })}`.
- Replace `` aria-label={`Increase ${label}`} `` with `aria-label={t("field_increase", { label })}`.

#### 5c. ModelCard.tsx
- Add `const t = useTranslations("image_generator")`.
- Replace `{creditCost} {creditCost === 1 ? "credit" : "credits"}` with `{t("credit_count", { count: creditCost })}` (ICU plural).
- Replace hardcoded capability labels (`"4K"`, `"Negative prompt"`, etc.) with `t("capability_4k")`, `t("capability_negative_prompt")`, etc.

#### 5d. ModelGrid.tsx
- Replace `aria-label="Image models"` with `aria-label={t("model_grid_aria_label")}`.

#### 5e. index.tsx Toast Messages
- Replace all hardcoded `setToast({ message: "..." })` strings with translated versions:
  - `"Image copied to clipboard!"` → `t("image_copied")`
  - `"Image data copied! Paste in compatible apps."` → `t("image_data_copied")`
  - `"Copy not supported. Use download button instead."` → `t("copy_not_supported")`
  - `"Copying image..."` → `t("copying_image")`
  - `"Please click on the page first, then try copying again"` → `t("copy_click_first")`
  - `"Failed to copy image"` → `t("copy_image_failed")`
- Replace `aria-label="Resize panels"` with `aria-label={t("resize_panels_aria")}` (if resizable handle remains — may be removed by Task 1).

#### 5f. Add All 57 Keys to messages/en.json
- Add all 22 component UI keys + 17 schema param label keys + 18 schema option label keys from the i18n tables above.
- Run `pnpm translate` to generate all 7 languages.
- Run `pnpm i18n:verify` to verify all keys present in all locales.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/constants/modelSchemas.ts components/image-generator/DynamicField.tsx components/image-generator/ModelCard.tsx components/image-generator/ModelGrid.tsx components/image-generator/index.tsx

# Step 3: i18n verification
pnpm translate && pnpm i18n:verify
```

---

### Task 6: Cross-Component Mobile QA & Visual Polish (2.5 h)

**Objective**: End-to-end mobile-first QA pass. Verify all floating panels stack correctly at 320px, touch targets are enforced, safe areas are handled, and the glass aesthetic is consistent.

**Files to Modify**:
- `components/image-generator/FloatingPromptBar.tsx` (safe area, z-index)
- `components/image-generator/FloatingOptionsPanel.tsx` (responsive polish)
- `components/image-generator/PremiumTabSystem.tsx` (safe area)
- `components/image-generator/RefsPanel.tsx` (responsive polish)
- `components/image-generator/index.tsx` (landscape handling, final wiring)

**Implementation**:

#### 6a. Safe Area Handling
- `FloatingPromptBar`: Add `pb-[env(safe-area-inset-bottom)]` to bottom fixed element.
- `PremiumTabSystem`: Verify no overlap with status bar / Dynamic Island.

#### 6b. Landscape Orientation
- When `orientation === 'landscape'` and `isMobile`: collapse `PremiumTabSystem` to a minimal icon-only bar to maximize canvas area.
- Floating panels in landscape should use `max-h-[80vh]` to not cover entire viewport.

#### 6c. 320px Visual QA
- [ ] All floating panels render correctly at 320px width.
- [ ] No horizontal overflow or text truncation.
- [ ] Touch targets are all ≥ 44px (verify with dev tools).
- [ ] Text is readable (no `text-[10px]` on mobile — minimum `text-xs`).
- [ ] Floating options panel as drawer does not cover entire canvas (`max-h-[60vh]`).

#### 6d. Consistent Glass Aesthetic
- Verify ALL floating elements use the standardized glass effect: `backdrop-blur-md bg-background/60 border border-border/50 shadow-lg rounded-xl`.
- No mismatched `backdrop-blur-xl` or `shadow-2xl`.

#### 6e. Active Touch States
- Verify all buttons have `active:scale-95` or `active:scale-98` for touch feedback.
- Verify `transition-smooth` is used (not raw `transition-all`).

#### 6f. Focus Management
- `Escape` key closes the topmost overlay (ModelSelector > FloatingOptionsPanel > RefsPanel).
- Tab order follows visual layer order.
- Focus ring (`ring-primary`) is visible on all interactive elements.

**2-Step QA**:
```bash
# Step 1: TypeScript check
npx tsc --noEmit

# Step 2: Biome lint + format
npx biome check --write components/image-generator/FloatingPromptBar.tsx components/image-generator/FloatingOptionsPanel.tsx components/image-generator/PremiumTabSystem.tsx components/image-generator/RefsPanel.tsx components/image-generator/index.tsx
```

---

## 📱 Mobile-First Checklist (Per-Task)

Each task must verify these inline (not deferred to Task 6):

- [ ] Base CSS = mobile (320px), enhanced with `md:`, `lg:`.
- [ ] All interactive elements `min-h-[44px]` with `active:scale-95`.
- [ ] Inputs `text-base` (16px) to prevent iOS zoom.
- [ ] `useDevice()` used (not `useMobile()`).
- [ ] `AdaptiveModal` for panels that become drawers on mobile.
- [ ] No floating panel covers entire canvas on mobile.

---

## 🧪 Visual Regression Checklist

- [ ] **Is the sidebar gone?** No split-screen layout visible.
- [ ] **Is the canvas full-screen?** `OutputSection` fills available space.
- [ ] **Is the prompt bar floating at the bottom?** Glass bar, always visible.
- [ ] **Are options floating on the right (desktop)?** Glass overlay, collapsible.
- [ ] **Are options a drawer on mobile?** Bottom-sheet via `AdaptiveModal`.
- [ ] **Can I select a model?** Visible trigger in tab area → Modal → Grid of 8 models.
- [ ] **Does Edit mode show floating refs?** Left overlay (desktop) or drawer (mobile).
- [ ] **Is it Glass?** Consistent `backdrop-blur-md bg-background/60 border-border/50` on all floating elements.
- [ ] **320px?** Everything works on iPhone SE width.
- [ ] **Touch targets?** All buttons ≥ 44px, with `active:scale-95` feedback.

---

## ⏱️ Task Dependencies

```
Task 1 (Layout Teardown)
  ├── Task 2 (FloatingOptionsPanel) — needs render slot from Task 1
  ├── Task 3 (Tabs & Model Trigger) — needs z-index context from Task 1
  └── Task 4 (Floating RefsPanel) — needs edit mode wiring from Task 1
       └── Task 5 (i18n Hardening) — can run in parallel with Tasks 2-4
            └── Task 6 (Mobile QA & Polish) — final pass after all tasks
```

**Execution order**: Task 1 → Tasks 2, 3, 4 (parallel or sequential) → Task 5 → Task 6.

---

## 📝 PROGRESS SUMMARY

| Task | Description | Est. | Status |
| :--- | :--- | :--- | :--- |
| **Task 1** | Dismantle Split-Screen, Unify Canvas | 3h | ✅ COMPLETED |
| **Task 2** | FloatingOptionsPanel (Desktop Overlay + Mobile Drawer) | 3h | ✅ COMPLETED |
| **Task 3** | PremiumTabSystem Fix & ModelSelector Trigger | 2.5h | ✅ COMPLETED |
| **Task 4** | Floating RefsPanel (Edit Mode) | 2.5h | ✅ COMPLETED |
| **Task 5** | i18n Hardening, Schema Label Migration & Accessibility | 4h | ✅ COMPLETED |
| **Task 6** | Cross-Component Mobile QA & Visual Polish | 2.5h | ✅ COMPLETED |
| | **TOTAL** | **~17.5h** | |

---

## ⏱️ TIME TRACKING

| Task | Estimated | Actual | Status |
| :--- | :--- | :--- | :--- |
| Task 1: Layout Teardown | 3h | — | ✅ |
| Task 2: FloatingOptionsPanel | 3h | — | ✅ |
| Task 3: Tabs & Model Trigger | 2.5h | — | ✅ |
| Task 4: Floating RefsPanel | 2.5h | — | ✅ |
| Task 5: i18n, Schema Labels & Accessibility | 4h | — | ✅ |
| Task 6: Mobile QA & Polish | 2.5h | — | ✅ |
| **TOTAL** | **~17.5h** | — | |

---

## 📁 FILES CREATED / MODIFIED (SUMMARY)

| File | Action | Task(s) |
| :--- | :--- | :--- |
| `components/image-generator/index.tsx` | **MODIFY** (major refactor — remove split-screen, wire floating panels, migrate `useDevice`, translate toasts) | 1, 2, 3, 4, 5 |
| `components/image-generator/FloatingOptionsPanel.tsx` | **CREATE** (new — floating overlay wrapper for OptionsPanel) | 2 |
| `components/image-generator/PremiumTabSystem.tsx` | **MODIFY** (rewrite — shadcn Tabs, design fixes, model trigger) | 3 |
| `components/image-generator/ModelSelector.tsx` | **MODIFY** (verify wiring, ensure opens from trigger) | 3 |
| `components/image-generator/OptionsPanel.tsx` | **MODIFY** (fix advanced toggle to use shadcn Button) | 2 |
| `components/image-generator/RefsPanel.tsx` | **MODIFY** (fix touch targets, add aria-labels) | 4, 6 |
| `components/image-generator/ModelCard.tsx` | **MODIFY** (add useTranslations, fix credit plural, translate capabilities) | 5 |
| `components/image-generator/ModelGrid.tsx` | **MODIFY** (translate aria-label) | 5 |
| `components/image-generator/constants/modelSchemas.ts` | **MODIFY** (migrate all `label` values from English strings to i18n key names) | 5 |
| `components/image-generator/DynamicField.tsx` | **MODIFY** (add useTranslations, resolve `param.label` and `option.label` via `t()`, translate aria-labels) | 5 |
| `components/image-generator/FloatingPromptBar.tsx` | **MODIFY** (safe area, z-index correction, text-xs fix) | 6 |
| `components/image-generator/output-section.tsx` | **MODIFY** (design token migration, i18n, transition-smooth) | 6 |
| `components/image-generator/generation-history.tsx` | **MODIFY** (text-xs fix, design token fix) | 6 |
| `messages/en.json` | **MODIFY** (add 67 new keys under `image_generator`: 32 component + 17 schema param labels + 18 schema option labels) | 5, 6 |
| `messages/*.json` (6 other locales) | **AUTO** (via `pnpm translate`) | 5, 6 |

---

## 🔍 PRE-SPRINT CHECKLIST

- [ ] **Branch**: Create `sprint-30c-canvas-first-rebuild` from current `sprint-30-Image-generator-v2-13022026`.
- [ ] **Environment**: `npx convex dev` is running.
- [ ] **Sprint 30 complete**: Verify all Sprint 30 Phase 0+1+2+3 components exist and compile (`npx tsc --noEmit` passes).
- [ ] **Design tokens**: Review design-master token table above — no `border-white/10`, `bg-black/*`, `shadow-2xl` in new code.
- [ ] **i18n keys**: Existing `image_generator` namespace has 83 keys. 57 new keys will be added (22 component + 35 schema labels).
- [ ] **Device context**: Verify `DeviceProvider` wraps the app (check layout or providers file).
- [ ] **Adaptive components**: Verify `AdaptiveModal` is importable from `@/components/adaptive/AdaptiveModal`.
- [ ] **shadcn/ui**: Verify `Tabs`, `TabsList`, `TabsTrigger` exist in `@/components/ui/tabs`.

---

## 🎯 SUCCESS METRICS

| Metric | Before (Sprint 30 output) | After (Sprint 30c) |
| :--- | :--- | :--- |
| **Layout** | Split-screen sidebar | Full-screen canvas with floating overlays |
| **Mobile UX** | Cramped sidebar at 320px | Drawer-based panels, 44px touch targets |
| **Model Discovery** | No visible trigger | Badge in tab bar → Modal with 8 models |
| **i18n Coverage** | 30+ hardcoded strings + 50+ schema labels | 100% translated (140+ keys), zero hardcoded English in schemas |
| **Design Compliance** | `border-white/10`, raw buttons | Semantic tokens, shadcn components |
| **Device Detection** | Legacy `useMobile()` | `useDevice()` with full context |
| **Accessibility** | Hardcoded aria-labels, no keyboard nav | Translated labels, shadcn Tabs with ARIA |
| **Glass Consistency** | Mixed blur/shadow values | Standardized across all floating panels |

---

## ✅ FINAL SPRINT QA (before marking sprint complete)

Run after all tasks are done. Ensures full codebase passes.

```bash
# 1. Full TypeScript check
npx tsc --noEmit

# 2. Full Biome check
npx biome check --write .

# 3. i18n verification (if keys were added)
pnpm translate && pnpm i18n:verify

# 4. Run tests (if applicable)
npx vitest run
```

### Design Master Review Checklist (Final)
- [ ] Semantic tokens only — no `bg-white`, `bg-black`, `text-white`, `border-white/10`, `bg-gray-*`.
- [ ] Body text has `leading-relaxed` or `leading-6`.
- [ ] Spacing via `gap-*` — no stray margin for layout.
- [ ] Mobile-first — base CSS = 320px, enhanced with `md:`, `lg:`.
- [ ] Touch targets `min-h-[44px]` with `active:scale-95`.
- [ ] Focus visible (`ring-primary`) on all interactive elements.
- [ ] Animations ≤ 500ms, using `transition-smooth`.
- [ ] shadcn/ui components used (Button, Tabs, Collapsible, Dialog, Drawer, Skeleton).
- [ ] Glass effect consistent: `backdrop-blur-md bg-background/60 border-border/50 shadow-lg rounded-xl`.
- [ ] Z-index follows stacking table (0/30/40/50/60/70).
