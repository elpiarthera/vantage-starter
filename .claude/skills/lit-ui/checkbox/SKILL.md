---
name: lit-ui-checkbox
description: >-
  How to use <lui-checkbox> and <lui-checkbox-group> — props, slots, events, CSS tokens, examples.
---

# Checkbox

## Usage

```html
<lui-checkbox label="Accept terms"></lui-checkbox>
<lui-checkbox checked label="Subscribed"></lui-checkbox>
<lui-checkbox indeterminate label="Select all"></lui-checkbox>
```

```html
<!-- Checkbox group -->
<lui-checkbox-group label="Notifications">
  <lui-checkbox label="Email" name="notif" value="email"></lui-checkbox>
  <lui-checkbox label="SMS" name="notif" value="sms"></lui-checkbox>
  <lui-checkbox label="Push" name="notif" value="push"></lui-checkbox>
</lui-checkbox-group>
```

```html
<!-- Group with select-all -->
<lui-checkbox-group label="Toppings" select-all>
  <lui-checkbox label="Cheese" name="top" value="cheese"></lui-checkbox>
  <lui-checkbox label="Pepperoni" name="top" value="pepperoni"></lui-checkbox>
  <lui-checkbox label="Mushroom" name="top" value="mushroom"></lui-checkbox>
</lui-checkbox-group>
```

```html
<!-- Sizes -->
<lui-checkbox size="sm" label="Small"></lui-checkbox>
<lui-checkbox size="md" label="Medium"></lui-checkbox>
<lui-checkbox size="lg" label="Large"></lui-checkbox>
```

## Props — `lui-checkbox`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| checked | `boolean` | `false` | Whether the checkbox is checked. |
| disabled | `boolean` | `false` | Whether the checkbox is disabled. |
| required | `boolean` | `false` | Whether the checkbox is required for form submission. |
| indeterminate | `boolean` | `false` | Whether to show indeterminate (dash) state. |
| name | `string` | `""` | Form submission name. |
| value | `string` | `"on"` | Form submission value when checked. |
| label | `string` | `""` | Label text displayed next to the checkbox. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Size variant affecting box dimensions and label typography. |

## Props — `lui-checkbox-group`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | `""` | Group label text displayed above the checkboxes. |
| disabled | `boolean` | `false` | Disables all child checkboxes. |
| required | `boolean` | `false` | At least one checkbox must be checked. |
| error | `string` | `""` | Custom error message displayed below the group. |
| select-all | `boolean` | `false` | Shows a select-all parent checkbox. |

## Slots — `lui-checkbox`

| Slot | Description |
|------|-------------|
| default | Custom label content (alternative to label property). |

## Slots — `lui-checkbox-group`

| Slot | Description |
|------|-------------|
| default | Child `lui-checkbox` elements. |

## Events

| Event | Fired on | Detail | Description |
|-------|----------|--------|-------------|
| `ui-change` | `lui-checkbox` | `{ checked: boolean, value: string \| null }` | Fired when checkbox is toggled. value is null when unchecked. |
| `ui-change` | `lui-checkbox-group` | `{ allChecked: boolean, checkedCount: number, totalCount: number }` | Fired when select-all checkbox is toggled. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-checkbox-size-sm` | `1rem` | Checkbox box width and height at sm size. |
| `--ui-checkbox-size-md` | `1.25rem` | Checkbox box width and height at md size (default). |
| `--ui-checkbox-size-lg` | `1.5rem` | Checkbox box width and height at lg size. |
| `--ui-checkbox-radius` | `0.25rem` | Border radius of the checkbox box. |
| `--ui-checkbox-border-width` | `2px` | Border width of the checkbox box. |
| `--ui-checkbox-label-gap` | `0.5rem` | Gap between checkbox box and label text. |
| `--ui-checkbox-transition` | `150ms` | Transition duration for check/uncheck animations. |
| `--ui-checkbox-group-gap` | `0.5rem` | Gap between items in a checkbox group. |
| `--ui-checkbox-font-size-sm` | `0.875rem` | Label font size at sm size. |
| `--ui-checkbox-font-size-md` | `1rem` | Label font size at md size (default). |
| `--ui-checkbox-font-size-lg` | `1.125rem` | Label font size at lg size. |
| `--ui-checkbox-bg` | `var(--color-background, white)` | Background color when unchecked. |
| `--ui-checkbox-border` | `var(--color-border, var(--ui-color-border))` | Border color when unchecked. |
| `--ui-checkbox-bg-checked` | `var(--color-primary, var(--ui-color-primary))` | Background color when checked. |
| `--ui-checkbox-border-checked` | `var(--color-primary, var(--ui-color-primary))` | Border color when checked. |
| `--ui-checkbox-check-color` | `white` | Checkmark and dash icon color. |
| `--ui-checkbox-bg-indeterminate` | `var(--color-primary, var(--ui-color-primary))` | Background color in indeterminate state. |
| `--ui-checkbox-border-indeterminate` | `var(--color-primary, var(--ui-color-primary))` | Border color in indeterminate state. |
| `--ui-checkbox-ring` | `var(--color-ring, var(--ui-color-ring))` | Focus ring color. |
| `--ui-checkbox-border-error` | `var(--color-destructive, var(--ui-color-destructive))` | Border color on validation error. |
| `--ui-checkbox-text-error` | `var(--color-destructive, var(--ui-color-destructive))` | Error message text color. |

## CSS Parts — `lui-checkbox`

| Part | Description |
|------|-------------|
| `wrapper` | Outer wrapper div containing checkbox and label. |
| `box` | The checkbox box element with role="checkbox". |
| `label` | Label text element. |
| `error` | Error text element. |

## Behavior Notes

- **Indeterminate tri-state**: The `indeterminate` property is JS-only (not reflected to attribute). It always clears to checked or unchecked when the user interacts — there is no way for the user to set indeterminate directly.
- **Form participation**: Uses ElementInternals (client-side only, guarded with `isServer`). Submits `value` when checked, `null` when unchecked. Indeterminate state does not affect form submission value.
- **Keyboard**: Space key toggles the checkbox. Enter key does NOT toggle (per W3C APG checkbox pattern). `preventDefault()` stops page scroll on Space.
- **Accessibility**: `role="checkbox"` on the box div, `aria-checked` is `"true"`, `"false"`, or `"mixed"` (indeterminate). `aria-labelledby` links box to label element. `aria-disabled` set on box when disabled. `aria-required` set on box when required.
- **Required validation**: Error shows only after `touched` is true (user has interacted). The error message "Please check this box." is hardcoded in the component.
- **Select-all coordination**: `lui-checkbox-group` with `select-all` attribute renders an internal "Select all" checkbox. When some children are checked, select-all shows indeterminate state. Toggling select-all checks/unchecks all enabled children in a batch (prevents race condition via internal `_batchUpdating` flag).
- **Disabled propagation**: Setting `disabled` on `lui-checkbox-group` propagates to all child `lui-checkbox` elements. Group-level disabled renders at 50% opacity via `:host([disabled])`.
- **Focus ring**: Applied to `.checkbox-box:focus-visible` (the box div, not the host). Uses `outline: 2px solid` with 2px offset.
- **prefers-reduced-motion**: All transitions on `.check-path`, `.dash-path`, and `.checkbox-box` are set to `transition-duration: 0ms`.
