# Radix -> Base UI migration pattern (M1: accordion, checkbox, collapsible, radio-group, slider; M2: select, separator; M3: switch, progress, tooltip; M4: alert-dialog, avatar, tabs; M5: label -> native `<label>`, no Base UI equivalent used; M6: scroll-area)

This wave migrated the five `components/ui/*` primitives with **zero consumers** in the repo — chosen deliberately so a wrong mapping stays invisible while the pattern gets proven. Each mapping below is code-level, taken directly from `@base-ui/react@1.6.0`'s own `.d.ts` files (`node_modules/@base-ui/react/<primitive>/`), not assumed from Radix muscle memory.

## General rules that apply to every primitive

1. **Import shape changes.** Radix: `import * as XPrimitive from "@radix-ui/react-x"`. Base UI: named export per component, imported as a namespace-like object:
   ```ts
   import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
   ```
   Base UI does not ship a `* as X` namespace import for these five — it exports a single named object (`Accordion`, `Checkbox`, `Collapsible`, `Radio`, `Slider`) whose keys are the parts (`.Root`, `.Trigger`, `.Panel`, ...).

2. **`React.ElementRef` is deprecated** in React 19 types in favor of `React.ComponentRef`. Both work, but this migration used `ComponentRef` throughout to avoid a deprecation warning surfacing in strict mode.

3. **`data-state="open|closed"` becomes boolean presence attributes.** Radix put the state in a single `data-state` attribute with a string value; Base UI splits each state into its own boolean presence attribute (no value). Concretely:

   | Radix | Base UI |
   |---|---|
   | `data-[state=open]:` | `data-[open]:` (or a component-specific name, see table below) |
   | `data-[state=closed]:` | absence of the attribute, or `data-[ending-style]:` / `data-[closed]:` depending on the part |
   | `data-[state=checked]:` | `data-[checked]:` |
   | `data-[state=unchecked]:` | `data-[unchecked]:` |

   Always verify the exact attribute name via the primitive's `*DataAttributes.d.ts` file (e.g. `node_modules/@base-ui/react/checkbox/root/CheckboxRootDataAttributes.d.ts`) — names differ per part (`AccordionItemDataAttributes.open = "data-open"` but `AccordionTriggerDataAttributes.panelOpen = "data-panel-open"`).

4. **`asChild` is gone. Base UI uses `render`.** None of these five primitives needed `asChild` in their existing usage in this repo, so no `render` prop rewiring was required in this wave. For a future primitive that does use `asChild`, the mapping is:
   ```tsx
   // Radix
   <Trigger asChild><button>Custom</button></Trigger>
   // Base UI
   <Trigger render={<button>Custom</button>} />
   // or, when the child needs the primitive's own props/state:
   <Trigger render={(props, state) => <button {...props}>Custom</button>} />
   ```

5. **`displayName` on `React.forwardRef` components.** Radix parts exposed `.displayName` you could copy (`Checkbox.displayName = CheckboxPrimitive.Root.displayName`). Base UI's exported parts do not consistently expose the same `.displayName` shape once destructured through the namespace import, so this migration sets an explicit literal displayName per wrapper (`Checkbox.displayName = "Checkbox"`) instead of forwarding a primitive's — safer and equally informative in React DevTools.

## Per-primitive mapping

### Accordion

`components/ui/accordion.tsx`

| Radix part | Base UI part |
|---|---|
| `AccordionPrimitive.Root` | `AccordionPrimitive.Root` |
| `AccordionPrimitive.Item` | `AccordionPrimitive.Item` |
| `AccordionPrimitive.Header` | `AccordionPrimitive.Header` (unchanged) |
| `AccordionPrimitive.Trigger` | `AccordionPrimitive.Trigger` |
| `AccordionPrimitive.Content` | `AccordionPrimitive.Panel` (renamed) |

Data attributes:
- Chevron rotation: Radix `[&[data-state=open]>svg]:rotate-180` -> Base UI `[&[data-panel-open]>svg]:rotate-180` (`AccordionTriggerDataAttributes.panelOpen = "data-panel-open"`).
- Panel enter/exit animation: Radix `data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down` -> Base UI `data-[ending-style]:animate-accordion-up data-[starting-style]:animate-accordion-down` (`AccordionPanelDataAttributes.startingStyle` / `.endingStyle`). These fire only during the transition, which is the correct hook point for enter/exit keyframes (vs. the static `open`/`disabled` attributes which persist).
- Existing Tailwind keyframes (`--animate-accordion-down` / `--animate-accordion-up` in `app/globals.css`) needed no change — only the attribute selector triggering them changed.

API-level change consumers must know about (for the day this component gets a consumer): Base UI's `Accordion.Root` has no `type="single"|"multiple"` prop. Single-vs-multiple is controlled by the boolean `multiple` prop (default `false` = single-open behavior). There is also no separate `collapsible` prop — closing the open item is Base UI's default single-mode behavior.

### Checkbox

`components/ui/checkbox.tsx`

| Radix part | Base UI part |
|---|---|
| `CheckboxPrimitive.Root` | `CheckboxPrimitive.Root` (renders a `<span>` + hidden `<input>`, same as Radix) |
| `CheckboxPrimitive.Indicator` | `CheckboxPrimitive.Indicator` (unchanged name) |

Data attribute: Radix `data-[state=checked]:bg-primary` -> Base UI `data-[checked]:bg-primary` (`CheckboxRootDataAttributes.checked = "data-checked"`, present only when checked — no `data-unchecked` needed for this styling since absence already implies unchecked).

### Collapsible

`components/ui/collapsible.tsx`

| Radix part | Base UI part |
|---|---|
| `CollapsiblePrimitive.Root` | `CollapsiblePrimitive.Root` |
| `CollapsiblePrimitive.CollapsibleTrigger` | `CollapsiblePrimitive.Trigger` (name simplified) |
| `CollapsiblePrimitive.CollapsibleContent` | `CollapsiblePrimitive.Panel` (renamed AND simplified) |

This was the simplest migration — the wrapper file re-exports the primitives directly with no styling, so only the import + part names changed. The exported name `CollapsibleContent` in this repo's public API is preserved even though Base UI's own part is called `Panel`.

### RadioGroup

`components/ui/radio-group.tsx`

Radix bundles the group and the item into one package (`@radix-ui/react-radio-group` exports both `Root` and `Item`). Base UI **splits them into two packages**:

| Radix | Base UI |
|---|---|
| `@radix-ui/react-radio-group` `.Root` | `@base-ui/react/radio-group` `{ RadioGroup }` (a plain function component, not a namespace with `.Root`) |
| `@radix-ui/react-radio-group` `.Item` | `@base-ui/react/radio` `{ Radio }` -> `Radio.Root` |
| `@radix-ui/react-radio-group` `.Indicator` | `@base-ui/react/radio` `{ Radio }` -> `Radio.Indicator` |

This is the one primitive in this wave where the package boundary itself moved — `radio-group` no longer owns the per-item visuals; `radio` does. Two imports are required where Radix needed one.

### Slider

`components/ui/slider.tsx`

| Radix part | Base UI part |
|---|---|
| `SliderPrimitive.Root` | `SliderPrimitive.Root` |
| (none — Radix puts Track directly under Root) | `SliderPrimitive.Control` (new, interposed between Root and Track — owns the click/drag hit-testing) |
| `SliderPrimitive.Track` | `SliderPrimitive.Track` |
| `SliderPrimitive.Range` | `SliderPrimitive.Indicator` (renamed) |
| `SliderPrimitive.Thumb` | `SliderPrimitive.Thumb` |

Base UI's own docs recommend the `Root > Control > Track > Indicator` + `Thumb` (sibling of `Track`, inside `Control`) structure — `Control` is the part that owns track-press-to-seek interaction; omitting it does not error, but track-press-to-set-value stops proving to be exercised so it was kept. This is a structural addition (extra DOM wrapper), not a rename, so any future consumer's assumptions about exact DOM node count under the slider would need re-checking — the two exported components (`Slider`) keep an identical public prop surface, only the internal composition gained one wrapper `<div>`.

### Separator

`components/ui/separator.tsx`

The simplest of the M2 wave — Base UI's `Separator` is a single component (no `.Root`/parts split), imported as a named export rather than a namespace:

```ts
// Radix
import * as SeparatorPrimitive from "@radix-ui/react-separator";
// SeparatorPrimitive.Root

// Base UI
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
// SeparatorPrimitive itself IS the root element
```

| Radix prop | Base UI prop |
|---|---|
| `orientation` | `orientation` (unchanged) |
| `decorative` | **dropped** — Base UI's `Separator` has no `decorative` prop (verified against `SeparatorProps` in `node_modules/@base-ui/react/separator/Separator.d.ts`: only `orientation` + standard `BaseUIComponentProps`). It renders a plain `<div>` with no ARIA role by default, so there was never a Radix-style `decorative` escape hatch to preserve. Repo-wide grep confirmed zero consumers passed `decorative` explicitly, so dropping it from the wrapper's public API is a safe, silent-no-op removal, not a behavior change for any caller.

Consumer: `components/ui/sidebar.tsx`'s `SidebarSeparator` — passes through `className` only, unaffected.

### Select

`components/ui/select.tsx`

This is the structurally biggest change in the repo so far — Base UI's Select has roughly twice the part count of Radix's, because it separates positioning (`Positioner`), the popup surface (`Popup`), and the scrollable list (`List`) into three distinct parts where Radix's `Content` did all three. Verified against `node_modules/@base-ui/react/select/index.d.ts` re-exporting `./index.parts.js`, plus each part's own `.d.ts`.

| Radix part | Base UI part | Note |
|---|---|---|
| `SelectPrimitive.Root` | `SelectPrimitive.Root` | Same name. Public wrapper `Select` intentionally does NOT re-export this directly — see "onValueChange signature" below. |
| `SelectPrimitive.Group` | `SelectPrimitive.Group` | Unchanged |
| `SelectPrimitive.Value` | `SelectPrimitive.Value` | Unchanged. Base UI's version additionally accepts a `children` render-function `(value) => ReactNode` for custom label formatting — not used in this repo's one consumer, which relies on the raw locale-code string. |
| `SelectPrimitive.Trigger` | `SelectPrimitive.Trigger` | Unchanged name; renders a `<button>` in both |
| `SelectPrimitive.Icon` | `SelectPrimitive.Icon` | Unchanged name. Radix used `asChild` here (`<Icon asChild><ChevronDown/></Icon>`); Base UI's `Icon` renders its own `<span>` wrapper around children directly — no `asChild`/`render` needed for a plain icon child, so the `asChild` prop was simply dropped, not replaced with `render`. |
| `SelectPrimitive.Portal` | `SelectPrimitive.Portal` | Unchanged |
| (none — Radix's `Content` combined position + surface + scroll) | `SelectPrimitive.Positioner` (new) | Owns anchor positioning (`sideOffset`, `align`, `side`). Interposed between `Portal` and `Popup`. |
| `SelectPrimitive.Content` | `SelectPrimitive.Popup` (renamed + narrowed) | Now only owns the visual surface (border/shadow/animation classes) — positioning moved to `Positioner` above it. |
| `SelectPrimitive.Viewport` | `SelectPrimitive.List` (renamed) | Owns the scrollable item container |
| `SelectPrimitive.Item` | `SelectPrimitive.Item` | Unchanged name |
| `SelectPrimitive.ItemIndicator` | `SelectPrimitive.ItemIndicator` | Unchanged name; same conditional-render-only-when-selected behavior confirmed by reading the compiled `SelectItemIndicator.js` (`shouldRender = keepMounted || selected`) |
| `SelectPrimitive.ItemText` | `SelectPrimitive.ItemText` | Unchanged name |
| `SelectPrimitive.Label` | `SelectPrimitive.GroupLabel` (renamed) | Radix's `Label` was actually a *group* label in this component's usage (labels a `SelectGroup`); Base UI names this part accordingly |
| `SelectPrimitive.Separator` | **removed, no Base UI equivalent** | See "SelectSeparator" note below |
| `SelectPrimitive.ScrollUpButton` | `SelectPrimitive.ScrollUpArrow` (renamed) | |
| `SelectPrimitive.ScrollDownButton` | `SelectPrimitive.ScrollDownArrow` (renamed) | |

**`SelectSeparator` — no Base UI part exists.** Confirmed by directory listing of `node_modules/@base-ui/react/select/` (`arrow`, `backdrop`, `group`, `group-label`, `icon`, `item`, `item-indicator`, `item-text`, `label`, `list`, `popup`, `portal`, `positioner`, `root`, `scroll-*-arrow`, `trigger`, `value` — no `separator`). The wrapper preserves the exported `SelectSeparator` name (public API unchanged) but renders a plain `aria-hidden="true"` `<div>` instead of delegating to a primitive — it is purely decorative (no semantic meaning, unlike the standalone `Separator` component above which IS meaningful), so `aria-hidden` is the correct a11y treatment, not a compromise. Zero repo consumers currently render `SelectSeparator`, so this has no observed behavioral impact — flagged here for whoever adds the first consumer.

**`onValueChange` signature — the one place the wrapper adapts Base UI's API to preserve the pre-migration public contract.** Radix's `onValueChange` was `(value: string) => void`. Base UI's is `(value: SelectValueType | null, eventDetails: SelectRootChangeEventDetails) => void` — it can pass `null` (deselection) and always passes a second `eventDetails` argument. `components/ui/select.tsx` exports its own `Select` function (not a direct alias of `SelectPrimitive.Root` the way M1's simplest wrappers were) that narrows this back to `(value: string) => void`, filtering out the `null` case and dropping `eventDetails`, so `ProfileTab.tsx`'s existing `onValueChange={handleLanguageChange}` (typed `(newLanguage: string) => Promise<void>`) required zero changes.

**CSS var for popper-width matching.** Radix: `--radix-select-trigger-height` / `--radix-select-trigger-width`, applied to `Viewport`. Base UI's equivalent, applied to `Positioner`, is `--anchor-width` only (confirmed in `node_modules/@base-ui/react/select/positioner/SelectPositionerCssVars.js`: `availableWidth`, `availableHeight`, `anchorWidth` — no matching trigger-height var). The wrapper now applies `min-w-[var(--anchor-width)]` on the `Popup` under the `position === "popper"` branch; there is no direct trigger-height equivalent to match, so height is left to the popup's own `max-h-96` cap (same visual result — Radix's height var only mattered for the (unused-here) `item-aligned` position mode).

**Data attributes** — confirmed via each part's own `*DataAttributes.d.ts`:

| Radix | Base UI |
|---|---|
| `data-[state=open]:animate-in` / `data-[state=closed]:animate-out` (on `Content`) | `data-[open]:animate-in` / `data-[closed]:animate-out` (on `Popup` — `SelectPopupDataAttributes.open = "data-open"`, `.closed = "data-closed"`) |
| `data-[side=...]` (on `Content`) | `data-[side=...]` (on `Popup` — `SelectPopupDataAttributes.side = "data-side"`, unchanged values) |
| `focus:bg-accent` (Radix `Item`, a real CSS `:focus` pseudo-class since Radix's item itself receives DOM focus) | `data-[highlighted]:bg-accent` (Base UI's `Item` does NOT receive real DOM focus — highlighting is tracked via `data-highlighted`, `SelectItemDataAttributes.highlighted = "data-highlighted"`. A plain `:focus` selector would never fire under Base UI's roving-highlight model, so this was a required rewrite, not a style choice.) |
| `data-[disabled]:` (Item) | `data-[disabled]:` (Item — unchanged, `SelectItemDataAttributes.disabled = "data-disabled"`) |

Both migrations are covered by `__tests__/components/ProfileTab.test.tsx` (Select's sole consumer, `components/dashboard/account/tabs/ProfileTab.tsx`) and `__tests__/components/sidebar-separator.test.tsx` (Separator's sole consumer, `SidebarSeparator` in `components/ui/sidebar.tsx`) — each renders the real consumer end-to-end (not the primitive in isolation) and, for `Select`, drives a real option click through to the consumer's real `onValueChange` handler.

### Switch

`components/ui/switch.tsx` -> consumers: `ProfileTab.tsx` (imported, currently unused pending Post-MVP-Improvement), `NotificationsTab.tsx` (four live toggles).

| Radix part | Base UI part |
|---|---|
| `SwitchPrimitives.Root` | `SwitchPrimitive.Root` (unchanged name, `{ Switch }` named export from `@base-ui/react/switch`) |
| `SwitchPrimitives.Thumb` | `SwitchPrimitive.Thumb` (unchanged name) |

Prop-level API is identical to Radix — `checked`, `defaultChecked`, `onCheckedChange` (verified against `node_modules/@base-ui/react/switch/root/SwitchRoot.d.ts`; the only difference is `onCheckedChange`'s second `eventDetails` argument, which no consumer in this repo reads). No wrapper adaptation was needed.

Data attributes: Radix `data-[state=checked]:` / `data-[state=unchecked]:` -> Base UI `data-[checked]:` / `data-[unchecked]:` (`SwitchRootDataAttributes.checked = "data-checked"`, `.unchecked = "data-unchecked"` — same two-attribute split, present on both `Root` and `Thumb`, confirmed via each part's own `*DataAttributes.d.ts`).

`role="switch"` and `aria-checked` are preserved automatically by Base UI's `Switch.Root` (verified end-to-end in `__tests__/components/NotificationsTab.test.tsx`, which queries `getByRole("switch")` and asserts `aria-checked`).

### Progress

`components/ui/progress.tsx` -> consumers: `components/shared/step-header.tsx`, `app/[locale]/dashboard/missions/[missionId]/page.tsx`.

| Radix part | Base UI part |
|---|---|
| `ProgressPrimitive.Root` | `ProgressPrimitive.Root` (unchanged name) |
| (none — Radix puts `Indicator` directly under `Root`) | `ProgressPrimitive.Track` (new, interposed between `Root` and `Indicator`) |
| `ProgressPrimitive.Indicator` | `ProgressPrimitive.Indicator` (unchanged name, but no longer needs a manual `style={{ transform: ... }}`) |

**Width is computed automatically, not hand-rolled.** Radix's `Indicator` required the wrapper to compute `translateX(-${100 - value}%)` itself. Base UI's `ProgressIndicator` reads `value`/`min`/`max` from `ProgressRootContext` (provided by `Root`) and sets its own `width: ${percentage}%` internally (confirmed by reading the compiled `ProgressIndicator.js`) — the wrapper no longer touches `style` at all, it only supplies structural classes.

**`value` is a required, nullable prop in Base UI** (`ProgressRootProps.value: number | null`, no default) — Radix's was optional and treated `undefined` as `0`. The wrapper preserves the pre-migration public contract (`value?: number | null`, `<Progress value={progressValue} />` unchanged in both consumers) by defaulting internally: `value={value ?? 0}`.

Data attributes (`ProgressRootDataAttributes` / `...IndicatorDataAttributes` / `...TrackDataAttributes`, identical shape on all three parts): `data-complete`, `data-indeterminate`, `data-progressing` — none of these were used by either consumer's Tailwind classes pre-migration, so no selector rewrite was required.

`role="progressbar"` + `aria-valuenow`/`aria-valuemin`/`aria-valuemax` are preserved automatically by `Progress.Root` (verified end-to-end in `__tests__/components/step-header.test.tsx` and `__tests__/components/mission-detail-progress.test.tsx`, both querying `getByRole("progressbar")` and asserting `aria-valuenow`).

### Tooltip

`components/ui/tooltip.tsx` -> consumers: `components/app-sidebar.tsx` (wraps the nav tree in `TooltipProvider`), `components/ui/sidebar.tsx`'s `SidebarMenuButton` (full `Tooltip`/`TooltipTrigger`/`TooltipContent` stack, driven via the `asChild` public API).

This is the structurally biggest change in the M3 wave — Base UI splits Radix's single `Content` (position + surface + arrow, wrapped in one `Portal`) into `Portal` > `Positioner` (owns anchor positioning: `side`, `align`, `sideOffset`) > `Popup` (visual surface) + a sibling `Arrow` inside `Popup`. Verified against `node_modules/@base-ui/react/tooltip/index.d.ts` re-exporting `./index.parts.js`, plus each part's own `.d.ts`.

| Radix part | Base UI part | Note |
|---|---|---|
| `TooltipPrimitive.Provider` | `TooltipPrimitive.Provider` | Prop renamed: Radix's `delayDuration` -> Base UI's `delay` (`TooltipProviderProps.delay?: number`). The wrapper's own public `TooltipProvider` keeps the `delayDuration` prop name (so `app-sidebar.tsx`'s `<TooltipProvider delayDuration={0}>` needs no change) and forwards it internally as `delay={delayDuration}`. |
| `TooltipPrimitive.Root` | `TooltipPrimitive.Root` | Unchanged name; no `delayDuration` prop on Root in either library |
| `TooltipPrimitive.Trigger` | `TooltipPrimitive.Trigger` | Unchanged name; renders a `<button>` in both. Radix's usage here relied on `asChild`; Base UI has no `asChild` prop on `Trigger` (confirmed in `TooltipTriggerProps` — no `asChild` field). The wrapper's own `TooltipTrigger` keeps `asChild` in its public prop surface and, when `asChild` is set with a valid element child, maps it internally to Base UI's `render={children}` (the general `asChild` -> `render` mapping from the top-level rules section) — `SidebarMenuButton`'s `<TooltipTrigger asChild>{button}</TooltipTrigger>` needed zero changes. |
| `TooltipPrimitive.Portal` | `TooltipPrimitive.Portal` | Unchanged |
| (none — Radix's `Content` combined position + surface) | `TooltipPrimitive.Positioner` (new) | Owns `side`, `align`, `sideOffset`. Interposed between `Portal` and `Popup`. |
| `TooltipPrimitive.Content` | `TooltipPrimitive.Popup` (renamed + narrowed) | Now only owns the visual surface (border/shadow/animation classes); positioning moved to `Positioner`. |
| `TooltipPrimitive.Arrow` | `TooltipPrimitive.Arrow` | Unchanged name; still a sibling of the popup content inside `Popup` |

**`role="tooltip"` is NOT stamped by Base UI's `Popup`** (confirmed by grepping the compiled `TooltipPopup.js`/`TooltipTrigger.js` — no `role` attribute anywhere in the tooltip package, unlike Radix's `Content` which carried an implicit `role="tooltip"`). This is a genuine accessibility regression in the vendor library if left unaddressed, so the wrapper adds `role="tooltip"` explicitly on `Popup` in `TooltipContent` to preserve the pre-migration a11y contract — this is the one place M3 adds behavior Base UI doesn't provide out of the box, flagged loudly here rather than left silent.

**CSS var for transform-origin.** Radix: `--radix-tooltip-content-transform-origin`, applied to `Content`. Base UI's equivalent, applied to `Positioner`, is `--transform-origin` (`TooltipPositionerCssVars.transformOrigin = "--transform-origin"`). The wrapper's `origin-(--radix-tooltip-content-transform-origin)` Tailwind arbitrary-property class became `origin-(--transform-origin)`.

**Data attributes** — confirmed via each part's own `*DataAttributes.d.ts`:

| Radix | Base UI |
|---|---|
| `data-[state=closed]:animate-out` (on `Content`) | `data-[closed]:animate-out` (on `Popup` — `TooltipPopupDataAttributes.closed = "data-closed"`) |
| `data-[side=...]` (on `Content`) | `data-[side=...]` (on `Popup` — `TooltipPopupDataAttributes.side = "data-side"`, unchanged values) |

Both migrations are covered end-to-end by real consumer-mounting tests: `__tests__/components/NotificationsTab.test.tsx` + `__tests__/components/ProfileTab.test.tsx` (Switch), `__tests__/components/step-header.test.tsx` + `__tests__/components/mission-detail-progress.test.tsx` (Progress), `__tests__/components/sidebar-tooltip.test.tsx` + `__tests__/components/app-sidebar-tooltip.test.tsx` (Tooltip) — none of the six consumer source files needed any change.

## Testing note: jsdom needs a `PointerEvent` polyfill for Base UI

Base UI's interaction primitives (`useButton`, checkbox/radio press handling, slider thumb focus/drag) dispatch real `PointerEvent`s, which jsdom does not implement. Any Jest suite driving one of these components via `@testing-library/user-event` throws `TypeError: ... PointerEvent is not a constructor` before the first click resolves. Fixed once, globally, in `jest.setup.ts`:

```ts
if (typeof globalThis.PointerEvent === "undefined") {
	class PointerEventPolyfill extends MouseEvent {
		public pointerId: number;
		public pointerType: string;
		public isPrimary: boolean;
		constructor(type: string, params: PointerEventInit = {}) {
			super(type, params);
			this.pointerId = params.pointerId ?? 0;
			this.pointerType = params.pointerType ?? "mouse";
			this.isPrimary = params.isPrimary ?? true;
		}
	}
	Object.assign(globalThis, { PointerEvent: PointerEventPolyfill });
}
```

Any future Base UI migration wave inherits this for free — it does not need to be re-added per component.

## Packages removed this wave (M1)

`@radix-ui/react-accordion`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-radio-group`, `@radix-ui/react-slider` — each proven `remaining: 0` importers repo-wide before removal (see PR description / task completionNote for the exact `grep` output). `pnpm-lock.yaml` regenerated via `pnpm install --lockfile-only`, never hand-edited.

## Packages removed this wave (M2)

`@radix-ui/react-select`, `@radix-ui/react-separator` — each had exactly one direct consumer in the repo before migration (`ProfileTab.tsx` for Select, `SidebarSeparator` in `sidebar.tsx` for Separator), unlike M1's zero-consumer wave. Sweep before removal:

```
grep -rn "@radix-ui/react-select" app/ components/ lib/ hooks/ providers/ src/     # remaining: 0
grep -rn "@radix-ui/react-separator" app/ components/ lib/ hooks/ providers/ src/  # remaining: 0
```

`pnpm-lock.yaml` regenerated via `pnpm install --lockfile-only`. Public API of both wrappers (exported names, prop shapes) is unchanged from pre-migration except `Separator`'s `decorative` prop, which had zero repo consumers and no Base UI equivalent (see the Separator section above) — every consumer file was left untouched.

**What makes a removal safe — and what does NOT.** The only thing that makes removing a package from `package.json` safe is `remaining: 0` **direct** importers in the repo. A transitive survival ("it's still pulled in by another dependency, so it's still installed") is NOT the reason, and citing it is a trap: it invites you to believe a removal is safe *because* the package is still there, when the real guarantee is that nothing in our code imports it any more.

The M1 wave proved the trap concretely. Four of the five removed packages (`accordion`, `checkbox`, `collapsible`, `radio-group`) do survive transitively via `@polar-sh/ui` (verify with `pnpm why <pkg>`, which reads the real `.pnpm` tree — not `ls node_modules`, which misses it). The fifth, `slider`, **disappears from the install tree entirely** — no transitive puller. Its removal is exactly as safe as the other four, because all five had zero direct importers. If "transitive survival" had been the safety argument, `slider` would have looked unsafe while being fine, and a future package with a real direct importer could look safe (still installed transitively) while breaking. Prove `remaining: 0` on direct imports; do not look at, or cite, the transitive tree.

## Packages removed this wave (M3)

`@radix-ui/react-switch`, `@radix-ui/react-progress`, `@radix-ui/react-tooltip` — each had exactly two direct consumers in the repo before migration. Sweep before removal:

```
grep -rn "@radix-ui/react-switch"   app/ components/ lib/ hooks/ providers/ src/  # remaining: 0
grep -rn "@radix-ui/react-progress" app/ components/ lib/ hooks/ providers/ src/  # remaining: 0
grep -rn "@radix-ui/react-tooltip"  app/ components/ lib/ hooks/ providers/ src/  # remaining: 0
```

`pnpm-lock.yaml` regenerated via `pnpm install --lockfile-only`. All three packages still survive transitively via `@polar-sh/ui` -> `@polar-sh/checkout` -> `@convex-dev/polar` (a different, newer version — `1.2.6`/`1.2.8` vs. the removed `1.1.x` direct entries) — per the M1/M2 doctrine above, this transitive survival is irrelevant to the safety of the removal; `remaining: 0` **direct** importers is the only guarantee, and it holds. Public API of all three wrappers (exported names, prop shapes) is unchanged from pre-migration; every consumer file was left untouched.

## What M1 + M2 + M3 together did NOT touch

Every other remaining `@radix-ui/react-*` package in `package.json` (`alert-dialog`, `aspect-ratio`, `avatar`, `context-menu`, `dialog`, `dropdown-menu`, `hover-card`, `label`, `menubar`, `navigation-menu`, `popover`, `scroll-area`, `slot`, `tabs`, `toast`, `toggle`, `toggle-group`, etc.) is still in active use by consumer components and was left untouched. A future wave should apply the same research-first process (read the primitive's own `.d.ts` before assuming a 1:1 API; most of these have real consumers, so they need the consumer-level review + consumer-mounting tests this doc's M2/M3 sections demonstrate, not just M1's zero-consumer proof pattern).

## Packages removed this wave (M4)

`@radix-ui/react-alert-dialog`, `@radix-ui/react-avatar`, `@radix-ui/react-tabs` — each had exactly two direct consumers in the repo before migration. Sweep before removal:

```
grep -rn "@radix-ui/react-alert-dialog" app/ components/ lib/ hooks/ providers/ src/  # remaining: 0
grep -rn "@radix-ui/react-avatar"       app/ components/ lib/ hooks/ providers/ src/  # remaining: 0
grep -rn "@radix-ui/react-tabs"         app/ components/ lib/ hooks/ providers/ src/  # remaining: 0
```

`pnpm-lock.yaml` regenerated via `pnpm install --lockfile-only`. `@radix-ui/react-alert-dialog` (1.1.15) and `@radix-ui/react-tabs` (1.1.13) still survive transitively via `@polar-sh/ui` -> `@polar-sh/checkout` -> `@convex-dev/polar` — different, newer versions than the removed direct entries (1.1.4 / 1.1.2). `@radix-ui/react-avatar` has zero entries left anywhere in the lockfile — no transitive puller at all. Per the M1/M2/M3 doctrine above, this difference is irrelevant to the safety of the removal; `remaining: 0` **direct** importers is the only guarantee, and it holds for all three.

### Alert Dialog

`components/ui/alert-dialog.tsx` -> consumers: `app/[locale]/dashboard/missions/[missionId]/page.tsx` (`CheckpointGate`'s reject flow), `components/dashboard/account/tabs/ProfileTab.tsx` (delete-account flow).

| Radix part | Base UI part |
|---|---|
| `AlertDialogPrimitive.Root` | `AlertDialogPrimitive.Root` (unchanged name) |
| `AlertDialogPrimitive.Trigger` | `AlertDialogPrimitive.Trigger` (unchanged name, but see `asChild` note below) |
| `AlertDialogPrimitive.Portal` | `AlertDialogPrimitive.Portal` (unchanged) |
| `AlertDialogPrimitive.Overlay` | `AlertDialogPrimitive.Backdrop` (renamed — Base UI's alert-dialog re-exports the underlying `dialog` package's parts, which name this part `Backdrop`) |
| `AlertDialogPrimitive.Content` | `AlertDialogPrimitive.Popup` (renamed — also a `dialog`-package part; no `Positioner` split is needed here, unlike Select/Tooltip, because `Popup` alone owns fixed positioning + surface for a modal alert dialog) |
| `AlertDialogPrimitive.Title` | `AlertDialogPrimitive.Title` (unchanged name) |
| `AlertDialogPrimitive.Description` | `AlertDialogPrimitive.Description` (unchanged name, but see `asChild` note below) |
| `AlertDialogPrimitive.Action` | **removed, no Base UI equivalent** — mapped onto `AlertDialogPrimitive.Close` (see below) |
| `AlertDialogPrimitive.Cancel` | **removed, no Base UI equivalent** — mapped onto `AlertDialogPrimitive.Close` (see below) |

Confirmed via `node_modules/@base-ui/react/alert-dialog/index.parts.d.ts`: Base UI's alert-dialog package exports `Root`, `Backdrop`, `Close`, `Description`, `Popup`, `Portal`, `Title`, `Trigger`, `Viewport`, `Handle`/`createHandle` — most of these are direct re-exports of the sibling `dialog` package's own parts (`DialogBackdrop`, `DialogClose`, `DialogDescription`, `DialogPopup`, `DialogPortal`, `DialogTitle`, `DialogViewport`), with only `AlertDialogRoot` and `AlertDialogTrigger` genuinely alert-dialog-specific (they set the dialog's ARIA `role` to `alertdialog` instead of `dialog` — confirmed in `dialog/root/useRenderDialogRoot.js`: `role = isAlertDialog ? 'alertdialog' : 'dialog'`, so `role="alertdialog"` is stamped automatically with zero wrapper code, verified end-to-end by `mission-detail-alert-dialog.test.tsx`'s `screen.findByRole("alertdialog")`).

**`Action`/`Cancel` -> single `Close` part, with a composed `onClick`.** Radix modeled the destructive-confirm button (`Action`) and the dismiss button (`Cancel`) as two distinct parts, both of which close the dialog automatically on click. Base UI has neither — only a generic `Close` (confirmed by directory listing of `node_modules/@base-ui/react/dialog/`: no `action` or `cancel` subdirectory). Reading `DialogClose.js`'s compiled source: `Close`'s internal `handleClick` only closes the dialog; it does not know about a consumer-supplied `onClick`. The wrapper's `AlertDialogAction` and `AlertDialogCancel` both render `AlertDialogPrimitive.Close` and simply spread the consumer's own `onClick` through `{...props}` — Base UI's `useRenderElement`/`mergeProps` (confirmed in `merge-props/mergeProps.js`) composes multiple `onClick` props rather than overwriting: for two handlers passed at different positions in the internal `props` array, **the later-positioned (consumer, i.e. `elementProps`) handler executes before the earlier-positioned (`Close`'s own `handleClick`) one** ("merged and called in right-to-left order (rightmost handler executes first, leftmost last)", per the function's own doc comment). Concretely: `<AlertDialogAction onClick={handleReject}>` still calls `handleReject` first, then Base UI closes the dialog — exactly the pre-migration Radix behavior, verified end-to-end (not just by inspection) by both `mission-detail-alert-dialog.test.tsx` (asserts `rejectMock` was called with the real checkpoint id after clicking the confirm button) and `ProfileTab-danger-zone.test.tsx` (asserts `deleteAccountMock` was called after clicking "Delete permanently").

**`asChild` — genuinely absent from two parts Radix had it on, added back by the wrapper.** `AlertDialogTriggerProps`/`DialogTriggerProps` and `DialogDescriptionProps` have no `asChild` field (confirmed by reading each `.d.ts`) — Base UI's replacement is the general `render` prop. Both of this wave's consumers depend on `asChild`: the mission page and `ProfileTab.tsx` both wrap a `<Button>` in `<AlertDialogTrigger asChild>`, and `ProfileTab.tsx` wraps a `<div>` of mixed content (paragraph + conditional warning blocks) in `<AlertDialogDescription asChild>` (Base UI's `Description` always renders its own `<p>`, so a `<div>` child needs `render`, not children-passthrough). The wrapper keeps `asChild` in its own public prop surface on both `AlertDialogTrigger` and `AlertDialogDescription`, mapping `asChild={true}` + a valid single React element child to Base UI's `render={children}` (the same asChild -> render mapping M3's `TooltipTrigger` established) — both consumers needed zero changes.

**Data attributes** — confirmed via each part's own `*DataAttributes.d.ts` (all shared with the `dialog` package, since `Backdrop`/`Popup` are direct re-exports): Radix `data-[state=open]:`/`data-[state=closed]:` (on `Overlay`/`Content`) -> Base UI `data-[open]:`/`data-[closed]:` (on `Backdrop`/`Popup` — `DialogBackdropDataAttributes.open = "data-open"`, `DialogPopupDataAttributes.open = "data-open"`, `.closed = "data-closed"`).

Both migrations are covered end-to-end by real consumer-mounting tests: `mission-detail-alert-dialog.test.tsx` (mission page, drives the real `reject` mutation through the dialog) and `ProfileTab-danger-zone.test.tsx` (drives the real `deleteAccount` action through the dialog) — neither consumer's source needed any change.

### Avatar

`components/ui/avatar.tsx` -> consumers: `components/dashboard/DashboardHeader.tsx`, `components/dashboard/account/tabs/ProfileTab.tsx`.

| Radix part | Base UI part |
|---|---|
| `AvatarPrimitive.Root` | `AvatarPrimitive.Root` (unchanged name, renders a `<span>` in both) |
| `AvatarPrimitive.Image` | `AvatarPrimitive.Image` (unchanged name) |
| `AvatarPrimitive.Fallback` | `AvatarPrimitive.Fallback` (unchanged name, same `delay` prop for deferred-fallback rendering) |

The simplest migration in this wave — a straight 1:1 part-name and prop-shape mapping (confirmed against `node_modules/@base-ui/react/avatar/{root,image,fallback}/*.d.ts`), no `asChild`/`render` rewiring needed, no data-attribute selector used by either consumer. Both migrations are covered end-to-end by real consumer-mounting tests: `DashboardHeader-avatar.test.tsx` (desktop user-menu trigger) and `ProfileTab-danger-zone.test.tsx` (profile-picture card) — neither consumer's source needed any change.

### Tabs

`components/ui/tabs.tsx` -> consumers: `components/dashboard/shared/TabNavigation.tsx`, `components/adaptive/AdaptiveNavigation.tsx` (desktop branch).

| Radix part | Base UI part |
|---|---|
| `TabsPrimitive.Root` | `TabsPrimitive.Root` (unchanged name) |
| `TabsPrimitive.List` | `TabsPrimitive.List` (unchanged name) |
| `TabsPrimitive.Trigger` | `TabsPrimitive.Tab` (renamed — confirmed in `node_modules/@base-ui/react/tabs/tab/TabsTab.d.ts`) |
| `TabsPrimitive.Content` | `TabsPrimitive.Panel` (renamed — confirmed in `node_modules/@base-ui/react/tabs/panel/TabsPanel.d.ts`) |

This repo's public export names (`TabsTrigger`, `TabsContent`) are preserved regardless of Base UI's internal `Tab`/`Panel` naming — only the wrapper's own internals reference the renamed parts.

`role="tab"` (+ `aria-controls`, `aria-selected`) and `role="tabpanel"` (+ `aria-labelledby`) are stamped automatically (confirmed by grepping the compiled `TabsTab.js`/`TabsPanel.js`), verified end-to-end by `TabNavigation.test.tsx` and `AdaptiveNavigation.test.tsx` (`getByRole("tab")` + `toHaveAttribute("aria-selected", ...)`).

**Active-tab data attribute — the one place a consumer edit was unavoidable.** Radix put the selected state in `data-state="active"` on the trigger; Base UI splits it into a valueless boolean presence attribute, `data-active` (confirmed in `TabsTabDataAttributes.active = "data-active"`), present only when the tab is active (absence implies inactive — no `data-inactive` counterpart, mirroring M1's Checkbox precedent). Both of this wave's Tabs consumers style the active state directly in their **own** `className` string (not through the wrapper's default styling) using Radix's raw selector: `data-[state=active]:bg-primary` in `TabNavigation.tsx`, `data-[state=active]:bg-primary data-[state=active]:text-primary-foreground` in `AdaptiveNavigation.tsx`. Since Base UI never emits `data-state`, these selectors would silently stop matching after migration — this is a real, unavoidable behavioral break, not a style preference, so per the brief's "if a consumer genuinely must change... edit minimally and report it loudly" rule, both selector strings were renamed to `data-[active]:` (mechanical Tailwind-selector rename only — no prop, logic, or markup change in either consumer file). The wrapper's own internal default styling for `TabsTrigger` (`components/ui/tabs.tsx`) was updated the same way.

`onValueChange`'s second argument (`eventDetails`) is new in Base UI, same difference already documented for `select.tsx` in M2 — neither Tabs consumer's `onTabChange`/`onItemChange` signature reads it, so no consumer change was needed there.

Both migrations are covered end-to-end by real consumer-mounting tests: `TabNavigation.test.tsx` and `AdaptiveNavigation.test.tsx`, each driving a real tab click through to the consumer's real `onTabChange`/`onItemChange` handler.

## What M1 + M2 + M3 + M4 together did NOT touch

Every other remaining `@radix-ui/react-*` package in `package.json` (`aspect-ratio`, `context-menu`, `dialog`, `dropdown-menu`, `hover-card`, `label`, `menubar`, `navigation-menu`, `popover`, `scroll-area`, `slot`, `toast`, `toggle`, `toggle-group`) is still in active use by consumer components and was left untouched. A future wave should apply the same research-first process demonstrated across M2/M3/M4: read the primitive's own `.d.ts` before assuming a 1:1 API, check for missing `asChild`/`render` support on parts a real consumer depends on (not just the parts an isolated demo would exercise), and add consumer-mounting tests that click through to the real handler.

## Packages removed this wave (M5) — the migration target is the platform, not Base UI

### Label

`components/ui/label.tsx` -> consumers: `components/dashboard/account/modals/ChangePasswordModal.tsx`, `components/dashboard/account/tabs/ProfileTab.tsx`. Both use the plain, universal pattern: `<Label htmlFor={id}>text</Label>` immediately followed by a matching `id` on the field.

**Why NOT Base UI here — this is the one migration in the series where the correct target isn't the Base UI equivalent at all.** Base UI ships no standalone label primitive; its label lives inside the `field` package (`node_modules/@base-ui/react/field/label/FieldLabel.d.ts`) and its `Field.Label` **requires** a `Field.Root` ancestor context (confirmed by reading `field/root/FieldRoot.js` — `Field.Label` reads its `htmlFor` target from the `FieldRootContext`, it does not accept a bare `htmlFor` prop the way Radix's `Label.Root` does). Wrapping both consumers' existing `<Label htmlFor="name">…</Label>` markup in `<Field.Root>` to satisfy that context would mean rewriting each consumer's field markup and props — a red flag under this doc's own rule that a migration should not change a consumer's API. `Field` is the right tool when a form needs Base UI's validation/error-message wiring; it is the wrong tool for a page that just needs an accessible label-input pairing.

**What Radix's `Label.Root` actually added over a plain `<label>`**: reading `node_modules/@radix-ui/react-label/dist/index.mjs`, the only behavior beyond rendering a native `<label>` is an `onMouseDown` handler that calls `event.preventDefault()` when the click target is not already inside the label (double-click text-selection prevention on the label text itself). Neither consumer relies on that behavior, and a plain `<label htmlFor>` already gives the browser's own native focus-forwarding to the associated control for free — no JavaScript required.

**The migration**: `components/ui/label.tsx` now wraps a native `<label>` element directly. `React.forwardRef<HTMLLabelElement, React.ComponentPropsWithoutRef<"label"> & VariantProps<typeof labelVariants>>` replaces the old `React.ElementRef<typeof LabelPrimitive.Root>`/`ComponentPropsWithoutRef<typeof LabelPrimitive.Root>` pair — this is a mechanical narrowing (`typeof LabelPrimitive.Root` resolved to `"label"` anyway, since that's what Radix rendered under the hood). `Label.displayName` becomes the literal `"Label"` (previously derived from `LabelPrimitive.Root.displayName`, which no longer exists). The public export (`Label`), its props (`className` + any native `<label>` attribute, `htmlFor` included), and `labelVariants`'s classes are all unchanged — neither consumer needed an edit.

`@radix-ui/react-label` proven `remaining: 0` direct importers:

```
grep -rn "@radix-ui/react-label" app/ components/ lib/ hooks/ providers/ src/  # remaining: 0
```

`pnpm-lock.yaml` regenerated via `pnpm install --lockfile-only`. `@radix-ui/react-label@2.1.8` still survives transitively (a different, newer version than the removed direct `2.1.1` entry) — per every prior wave's doctrine, transitive survival is irrelevant to the safety of this removal; `remaining: 0` **direct** importers is the only guarantee, and it holds.

Both migrations are covered end-to-end by real consumer-mounting tests: `ChangePasswordModal.test.tsx` (`getByLabelText` resolves all three password fields to their `<input>`) and `ProfileTab.test.tsx` (`getByLabelText` resolves the Full Name field to its populated `<input>`) — neither consumer's source needed any change.

## Packages migrated this wave (M6)

### ScrollArea

`components/ui/scroll-area.tsx` -> consumers: `app/[locale]/dashboard/architect/_components/chat-interface.tsx`, `app/[locale]/dashboard/consultant/onboard/[projectId]/_components/onboarding-chat.tsx`, `app/[locale]/dashboard/missions/[missionId]/page.tsx`.

Confirmed via `node_modules/@base-ui/react/scroll-area/index.parts.d.ts`:

| Radix part | Base UI part |
|---|---|
| `ScrollAreaPrimitive.Root` | `ScrollAreaPrimitive.Root` (unchanged name) |
| `ScrollAreaPrimitive.Viewport` | `ScrollAreaPrimitive.Viewport` (unchanged name — still the actual scrollable `<div>`: `scrollTop`/`scrollHeight`/`clientHeight` are read directly off it internally, confirmed in `ScrollAreaViewport.js`'s `computeThumbPosition`) |
| (none — Radix's `Viewport` held children directly) | `ScrollAreaPrimitive.Content` (new — required nesting, see below) |
| `ScrollAreaPrimitive.ScrollAreaScrollbar` | `ScrollAreaPrimitive.Scrollbar` (renamed — shorter, no `ScrollArea` prefix repeated) |
| `ScrollAreaPrimitive.ScrollAreaThumb` | `ScrollAreaPrimitive.Thumb` (renamed, same simplification) |
| `ScrollAreaPrimitive.Corner` | `ScrollAreaPrimitive.Corner` (unchanged name) |

**`Viewport > Content` nesting is required, not optional.** Base UI interposes an explicit `Content` part (`ScrollAreaContent`, "A container for the content of the scroll area", per its own `.d.ts` doc comment) between `Viewport` and the consumer's children — Radix had no equivalent part; children went directly inside `Viewport`. The migrated wrapper wraps `{children}` in `<ScrollAreaPrimitive.Content data-slot="scroll-area-content">` inside `Viewport`. This is a structural DOM addition (one extra wrapper `<div>`), the same category of change M1's Slider `Control` interposition already established for this migration series — omitting it does not error at runtime, but the part exists specifically to isolate content-driven layout reflow from the viewport's own overflow-tracking measurements (confirmed by its state type `ScrollAreaContentState extends ScrollAreaRootState`, mirroring `Viewport`'s own state shape), so it was kept.

**Import shape**: Base UI exports a single named object per M1-M5 convention: `import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"` (whose keys are `.Root`/`.Viewport`/`.Content`/`.Scrollbar`/`.Thumb`/`.Corner`), replacing Radix's `import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"`.

**No `asChild`/`render` rewiring needed** — none of the six parts used `asChild` in the existing wrapper.

**No data-attribute selector rewrite needed** — unlike M4's Tabs, the wrapper's own Tailwind classes for `ScrollBar`/`ScrollAreaThumb` never selected on `data-state`; the only conditional styling (`orientation === "vertical"`/`"horizontal"`) reads the React prop directly, not a DOM attribute, so it survived unchanged. Base UI's `ScrollAreaScrollbarDataAttributes`/`ScrollAreaThumbDataAttributes` do expose `data-orientation`, `data-hovering`, `data-scrolling`, `data-has-overflow-x`/`-y` etc. for a future consumer that wants to style those states directly.

**Zero consumer edits.** All three consumers query `document.querySelector('[data-slot="scroll-area-viewport"]')` and read `scrollTop`/`scrollHeight`/`clientHeight` off the returned element to drive their own stick-to-bottom auto-scroll logic — this works unchanged because Base UI's `Viewport`, like Radix's, remains the actual scrolling element (verified against `ScrollAreaViewport.js`'s internal `computeThumbPosition`, which reads exactly those three properties off `viewportRef.current`).

**`@radix-ui/react-scroll-area` proven `remaining: 0` direct importers:**

```
grep -rn "@radix-ui/react-scroll-area" app/ components/ lib/ hooks/ providers/ src/  # remaining: 0
```

`pnpm-lock.yaml` regenerated via `pnpm install --lockfile-only`.

**jsdom gap surfaced by this migration (fixed in `jest.setup.ts`, not per-test)**: Base UI's `ScrollAreaViewport` calls `Element.prototype.getAnimations()` on every real `scroll` event (to wait out any in-flight scrollbar fade-out animation before hiding it) — jsdom implements no Web Animations API, so any suite mounting a `ScrollArea` consumer and dispatching a `scroll` event throws `viewport.getAnimations is not a function`. Polyfilled globally as a no-op returning `[]`, alongside the existing `TransformStream`/`PointerEvent` jsdom polyfills already documented there.

The consumer tests assert the real rendered content is nested inside `[data-slot="scroll-area-viewport"]`, not merely that the component mounts: `mission-detail-scroll-area.test.tsx` (mission page operations list — real operation rows), `chat-interface-scroll-area-content.test.tsx` (Architect chat — real user/assistant message bubbles), `onboarding-chat-scroll-area-content.test.tsx` (Consultant onboarding chat — real message bubbles).

The auto-scroll **decision logic** is also covered, but only because `chat-interface-stick-to-bottom.test.tsx` injects the scroll geometry by hand: it `Object.defineProperty`-mocks `scrollTop`/`scrollHeight`/`clientHeight` on the viewport (jsdom performs no layout, so all three are `0` otherwise) and asserts `scrollIntoView` fires — or doesn't — per the stick-to-bottom threshold. That test survives the migration unchanged because Base UI's `Viewport`, like Radix's, remains the element the consumer queries and reads those properties off.

**Declared coverage limit — what is NOT and cannot be tested here.** The *physical* scroll — whether the viewport actually overflows and scrolls in a real browser, and whether the scrollbar thumb tracks it — has no jsdom coverage: jsdom renders no layout, so real overflow never happens under test. The stick-to-bottom test proves the *decision* (given geometry X, call scrollIntoView), and the content tests prove the *structure* (content nested in the queried viewport), but neither proves the browser scrolls. That last mile is a **human visual-verification item**: check `/dashboard/architect`, the consultant onboarding chat, and `/dashboard/missions/[id]` in a real browser — send several messages and confirm the view sticks to the bottom. Do not read the green suite as proof the viewport physically scrolls; a `scrollTop`-asserting test with real (unmocked) geometry would pass vacuously on `0 === 0` and be a false guard (the vacuous-test lesson from this series).

## Packages removed this wave (M7)

### Dialog + Sheet — migrated together, one package coupling

`components/ui/dialog.tsx` and `components/ui/sheet.tsx` both imported `@radix-ui/react-dialog` — confirmed via `git grep -l "@radix-ui/react-dialog" -- components` returning exactly these two files, no others. Radix's `Sheet` component is literally built on the same `@radix-ui/react-dialog` package (a slide-in variant styled via `cva`, not a distinct primitive), so the package could not be removed after migrating only one of the two — that would leave dead-weight `@radix-ui/react-dialog` in `package.json` with zero remaining reason to exist except the other half of this pair. This is why the two were treated as a single migration unit rather than two independent ones.

Both were ported directly from the already-migrated `alert-dialog.tsx` (M4), which re-exports the same underlying `dialog` package's parts under the `alert-dialog` namespace — the mapping is therefore identical:

| Radix part | Base UI part |
|---|---|
| `DialogPrimitive.Root` / `SheetPrimitive.Root` | `DialogPrimitive.Root` (imported as `import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"`, and the same import aliased to `SheetPrimitive` in `sheet.tsx`) |
| `DialogPrimitive.Trigger` | `DialogPrimitive.Trigger` (unchanged name) |
| `DialogPrimitive.Portal` | `DialogPrimitive.Portal` (unchanged) |
| `DialogPrimitive.Close` | `DialogPrimitive.Close` (unchanged) |
| `DialogPrimitive.Overlay` | `DialogPrimitive.Backdrop` (renamed, same as M4's alert-dialog `Overlay`->`Backdrop`) |
| `DialogPrimitive.Content` | `DialogPrimitive.Popup` (renamed) |
| `DialogPrimitive.Title` | `DialogPrimitive.Title` (unchanged) |
| `DialogPrimitive.Description` | `DialogPrimitive.Description` (unchanged) |

Confirmed against `node_modules/@base-ui/react/dialog/index.parts.d.ts`: the package exports exactly `Root`, `Trigger`, `Portal`, `Backdrop`, `Popup`, `Close`, `Title`, `Description`, `Viewport`, `Handle`/`createHandle` — the same set `alert-dialog`'s package re-exports under different names, confirming M4's finding that alert-dialog is a thin wrapper over this very `dialog` package.

**Data attributes** — every `data-[state=open]:`/`data-[state=closed]:` selector across both files' className strings (the backdrop's fade classes, the popup's fade/zoom/slide classes, `sheetVariants`'s cva `side` variants, and both in-component close-button classes) was rewritten to `data-[open]:`/`data-[closed]:` (`DialogBackdropDataAttributes.open`/`.closed`, `DialogPopupDataAttributes.open`/`.closed` — same attribute names M4's alert-dialog migration already confirmed). `git grep -n "data-\[state=" -- components/ui/dialog.tsx components/ui/sheet.tsx` returns zero hits post-migration — no stale token survived.

`displayName`: Radix's `.displayName` (forwarded from each part, e.g. `DialogOverlay.displayName = DialogPrimitive.Overlay.displayName`) replaced with explicit string literals (`DialogOverlay.displayName = "DialogOverlay"`), same rationale as every prior wave — Base UI's destructured parts do not consistently expose the same `.displayName` shape.

**`asChild` — derived per-part from real consumer usage, not blanket-added.**

- `SheetTrigger`: two real consumers pass `asChild` — confirmed via `git grep -n "SheetTrigger asChild"` -> `app/[locale]/admin/layout.tsx:212` and `components/dashboard/DashboardHeader.tsx:59` (the mobile user-menu trigger). `SheetTrigger` therefore became a small wrapper function mapping `asChild` + a valid single React-element child to Base UI's `render` prop — the identical pattern `AlertDialogTrigger` established in M4. Both consumers needed zero changes.
- `DialogTrigger`: zero real consumers pass `asChild` (confirmed: `git grep -n "DialogTrigger asChild"` -> only hits are `docs/example/implementation-example.md`, a vendored reference doc, not repo code). `DialogTrigger` stayed a direct re-export (`const DialogTrigger = DialogPrimitive.Trigger`) — adding an unused render bridge here would be speculative code with no consumer to prove it, so it was not added.
- `DialogClose`/`SheetClose` and the in-component `×` close buttons (rendered via `DialogPrimitive.Close`/`SheetPrimitive.Close` directly, not through the public `DialogClose`/`SheetClose` re-export) also stayed direct — no consumer passes `asChild` to either.

`sheetVariants`'s cva definition and its `side` variant API (`top`/`bottom`/`left`/`right`) are unchanged — only the `data-state` tokens inside each variant's class string were rewritten, per the table above.

`@radix-ui/react-dialog` proven `remaining: 0` direct importers:

```
git grep -n "@radix-ui/react-dialog"
# remaining hits: docs/example/*.md|.txt (vendored reference snippets, not repo code),
# pnpm-lock.yaml (regenerated lockfile bookkeeping), package.json (removed by this wave)
# -- zero hits inside app/ components/ lib/ hooks/ providers/ src/
```

`pnpm-lock.yaml` regenerated via `pnpm remove @radix-ui/react-dialog` (not a hand edit).

Both migrations are covered end-to-end by real consumer-mounting tests: `InsufficientCreditsModal-dialog.test.tsx` (desktop-branch `Dialog`/`DialogContent` — asserts the popup's title/description render while open and the sr-only `t("close")` button is a real, clickable `<button>` that fires the consumer's `onClose`) and `DashboardHeader-sheet.test.tsx` (mobile user-menu `Sheet` — asserts `SheetTrigger asChild` renders the actual `<button aria-label="User menu">` DOM node, proving the render bridge landed rather than wrapping the child in a Base UI default element, and that clicking it reveals the sheet's real content). Neither consumer's source needed any change.

## What M1 + M2 + M3 + M4 + M5 + M6 + M7 together did NOT touch

Every other remaining `@radix-ui/react-*` package in `package.json` (`aspect-ratio`, `context-menu`, `dropdown-menu`, `hover-card`, `menubar`, `navigation-menu`, `popover`, `slot`, `toast`, `toggle`, `toggle-group`) is still in active use by consumer components and was left untouched. A future wave should keep applying the M5 lesson alongside M2/M3/M4/M7's: before reaching for Base UI's nearest-named equivalent, check whether the Radix primitive is a thin wrapper over a native HTML element the consumer's usage doesn't actually need wrapped at all, and check whether two files share one underlying `@radix-ui/react-*` package (as `dialog.tsx`/`sheet.tsx` did) before declaring either migration complete on its own.
