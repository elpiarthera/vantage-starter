# Radix -> Base UI migration pattern (M1: accordion, checkbox, collapsible, radio-group, slider; M2: select, separator)

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

## What M1 + M2 together did NOT touch

Every other remaining `@radix-ui/react-*` package in `package.json` (`alert-dialog`, `aspect-ratio`, `avatar`, `context-menu`, `dialog`, `dropdown-menu`, `hover-card`, `label`, `menubar`, `navigation-menu`, `popover`, `progress`, `scroll-area`, `slot`, `switch`, `tabs`, `toast`, `tooltip`, etc.) is still in active use by consumer components and was left untouched. A future wave should apply the same research-first process (read the primitive's own `.d.ts` before assuming a 1:1 API; most of these have real consumers like M2's `select`/`separator` did, so they need the consumer-level review + consumer-mounting tests this doc's M2 section demonstrates, not just M1's zero-consumer proof pattern).
