---
name: lit-ui-radio
description: >-
  How to use <lui-radio> and <lui-radio-group> — props, slots, events, CSS tokens, keyboard nav, examples.
---

# Radio

## Usage

```html
<lui-radio-group name="color" label="Favorite color">
  <lui-radio value="red" label="Red"></lui-radio>
  <lui-radio value="green" label="Green"></lui-radio>
  <lui-radio value="blue" label="Blue"></lui-radio>
</lui-radio-group>
```

```html
<!-- With initial value -->
<lui-radio-group name="size" value="md" label="Size">
  <lui-radio value="sm" label="Small"></lui-radio>
  <lui-radio value="md" label="Medium"></lui-radio>
  <lui-radio value="lg" label="Large"></lui-radio>
</lui-radio-group>
```

```html
<!-- Required -->
<lui-radio-group name="plan" label="Select a plan" required>
  <lui-radio value="free" label="Free"></lui-radio>
  <lui-radio value="pro" label="Pro"></lui-radio>
  <lui-radio value="enterprise" label="Enterprise"></lui-radio>
</lui-radio-group>
```

```html
<!-- Disabled group or individual item -->
<lui-radio-group name="status" label="Status" disabled>
  <lui-radio value="active" label="Active"></lui-radio>
  <lui-radio value="inactive" label="Inactive"></lui-radio>
</lui-radio-group>

<lui-radio-group name="tier" label="Tier">
  <lui-radio value="free" label="Free"></lui-radio>
  <lui-radio value="enterprise" label="Enterprise" disabled></lui-radio>
</lui-radio-group>
```

## Props — `lui-radio`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | `""` | The value submitted when this radio is selected. |
| checked | `boolean` | `false` | Whether this radio is currently selected. |
| disabled | `boolean` | `false` | Whether this radio is disabled. |
| label | `string` | `""` | Label text displayed next to the radio. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Size variant. |

## Props — `lui-radio-group`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| name | `string` | `""` | Form submission name for the group. |
| value | `string` | `""` | Currently selected radio value. |
| required | `boolean` | `false` | Whether a selection is required. |
| disabled | `boolean` | `false` | Disables all child radios. |
| label | `string` | `""` | Group label text (rendered as fieldset legend). |
| error | `string` | `""` | Error message displayed below the group. |

## Events

| Event | Fired on | Detail | Description |
|-------|----------|--------|-------------|
| `ui-change` | `lui-radio-group` | `{ value: string }` | Fired when the selected radio changes. |
| `ui-radio-change` | `lui-radio` | `{ value: string }` | Internal event consumed by RadioGroup. Do not listen to this — use `ui-change` on the group. |

## Keyboard Navigation

| Key | Behavior |
|-----|----------|
| Arrow Down / Arrow Right | Move focus and selection to next radio option (wraps to first). |
| Arrow Up / Arrow Left | Move focus and selection to previous radio option (wraps to last). |
| Tab | Move focus out of the radio group. |
| Shift + Tab | Move focus to previous focusable element before the group. |
| Space | Select the currently focused radio (if not already selected). |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-radio-size-sm` | `1rem` | Radio circle width and height at sm size. |
| `--ui-radio-size-md` | `1.25rem` | Radio circle width and height at md size (default). |
| `--ui-radio-size-lg` | `1.5rem` | Radio circle width and height at lg size. |
| `--ui-radio-dot-size-sm` | `0.5rem` | Inner dot width and height at sm size. |
| `--ui-radio-dot-size-md` | `0.625rem` | Inner dot width and height at md size (default). |
| `--ui-radio-dot-size-lg` | `0.75rem` | Inner dot width and height at lg size. |
| `--ui-radio-border-width` | `2px` | Border width of the radio circle. |
| `--ui-radio-label-gap` | `0.5rem` | Gap between radio circle and label. |
| `--ui-radio-group-gap` | `0.5rem` | Gap between radio items in a group. |
| `--ui-radio-transition` | `150ms` | Transition duration for state changes. |
| `--ui-radio-font-size-sm` | `0.875rem` | Label font size at sm size. |
| `--ui-radio-font-size-md` | `1rem` | Label font size at md size (default). |
| `--ui-radio-font-size-lg` | `1.125rem` | Label font size at lg size. |
| `--ui-radio-bg` | `var(--color-background, white)` | Background color of the radio circle (unchecked). |
| `--ui-radio-border` | `var(--color-border, var(--ui-color-border))` | Border color of the radio circle (unchecked). |
| `--ui-radio-border-checked` | `var(--color-primary, var(--ui-color-primary))` | Border color when checked. |
| `--ui-radio-dot-color` | `var(--color-primary, var(--ui-color-primary))` | Color of the inner dot when checked. |
| `--ui-radio-ring` | `var(--color-ring, var(--ui-color-ring))` | Focus ring color. |
| `--ui-radio-border-error` | `var(--color-destructive, var(--ui-color-destructive))` | Border color in error/invalid state. |
| `--ui-radio-text-error` | `var(--color-destructive, var(--ui-color-destructive))` | Error message text color. |

## Behavior Notes

- **Mutual exclusion**: `lui-radio` does NOT toggle its own `checked` state. It dispatches `ui-radio-change` internally; `lui-radio-group` handles mutual exclusion by setting `checked` on the matching child radio.
- **Form participation**: `lui-radio-group` is form-associated (uses ElementInternals, client-side only with `isServer` guard). Individual `lui-radio` is NOT form-associated. The group submits its selected `value` under the group's `name` attribute.
- **Roving tabindex**: RadioGroup implements the W3C APG Radio Group pattern. Only the checked (or first enabled) radio receives `tabIndex=0`. All others get `tabIndex=-1`. This creates a single tab stop for the entire group.
- **Keyboard**: Arrow Down/Right moves focus and selection to next radio (wraps). Arrow Up/Left moves to previous (wraps). Space selects the focused radio. Tab/Shift+Tab moves into/out of the group.
- **Required validation**: Error message shows only after `touched=true` (the user has interacted with the group via arrow keys or click). Submitting the form with nothing selected also triggers the error.
- **Disabled propagation**: Setting `disabled` on `lui-radio-group` propagates `disabled=true` to all child `lui-radio` elements. Group-level disabled renders at 50% opacity via `:host([disabled])` on the group.
- **Form reset**: `formResetCallback` restores the group to its `defaultValue` (the `value` attribute at `connectedCallback` time) and clears `touched` and error state.
- **Focus ring**: Applied to `.radio-circle:focus-visible` (the inner div with `role="radio"`, not the host). Uses `outline: 2px solid` with 2px offset.
- **prefers-reduced-motion**: `transition-duration: 0ms` is applied to `.radio-dot` and `.radio-circle` when the user prefers reduced motion.
