# Radix -> Base UI migration pattern (M1: accordion, checkbox, collapsible, radio-group, slider)

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

## Packages removed this wave

`@radix-ui/react-accordion`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-radio-group`, `@radix-ui/react-slider` — each proven `remaining: 0` importers repo-wide before removal (see PR description / task completionNote for the exact `grep` output). `pnpm-lock.yaml` regenerated via `pnpm install --lockfile-only`, never hand-edited.

## What this wave did NOT touch

Every other `@radix-ui/react-*` package in `package.json` (`alert-dialog`, `aspect-ratio`, `avatar`, `context-menu`, `dialog`, `dropdown-menu`, `hover-card`, `label`, `menubar`, `navigation-menu`, `popover`, `progress`, `scroll-area`, `select`, `separator`, `slot`, `switch`, `tabs`, `toast`, `tooltip`, etc.) is still in active use by consumer components and was left untouched. A future wave should apply the same research-first process (read the primitive's own `.d.ts` before assuming a 1:1 API, verify zero-consumer status is NOT required for those — they have real consumers, so those migrations need consumer-level review, not just this doc's proof pattern).
