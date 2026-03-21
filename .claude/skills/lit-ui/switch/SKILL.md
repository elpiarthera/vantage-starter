---
name: lit-ui-switch
description: >-
  How to use <lui-switch> — props, slots, events, CSS tokens, examples.
---

# Switch

## Usage

```html
<lui-switch label="Notifications"></lui-switch>
<lui-switch checked label="Dark mode"></lui-switch>
```

```html
<!-- Sizes -->
<lui-switch size="sm" label="Small"></lui-switch>
<lui-switch size="md" label="Medium"></lui-switch>
<lui-switch size="lg" label="Large"></lui-switch>
```

```html
<!-- Disabled states -->
<lui-switch disabled label="Disabled off"></lui-switch>
<lui-switch disabled checked label="Disabled on"></lui-switch>
```

```html
<!-- Form participation -->
<form>
  <lui-switch name="notifications" value="enabled" label="Enable notifications"></lui-switch>
  <lui-switch name="dark-mode" value="on" label="Dark mode"></lui-switch>
  <button type="submit">Save</button>
</form>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| checked | `boolean` | `false` | Whether the switch is on. |
| disabled | `boolean` | `false` | Whether the switch is disabled. |
| required | `boolean` | `false` | Whether the switch must be on for form submission. |
| name | `string` | `""` | Form submission name. |
| value | `string` | `"on"` | Form submission value when checked. |
| label | `string` | `""` | Label text displayed next to the switch. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Size variant affecting track and thumb dimensions. |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `ui-change` | `{ checked: boolean, value: string \| null }` | Fired when the switch is toggled. Value is the submission value when checked, null when unchecked. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-switch-track-width-sm` | `2rem` | Track width at sm size. |
| `--ui-switch-track-height-sm` | `1.125rem` | Track height at sm size. |
| `--ui-switch-thumb-size-sm` | `0.875rem` | Thumb diameter at sm size. |
| `--ui-switch-track-width-md` | `2.5rem` | Track width at md size (default). |
| `--ui-switch-track-height-md` | `1.375rem` | Track height at md size (default). |
| `--ui-switch-thumb-size-md` | `1.125rem` | Thumb diameter at md size (default). |
| `--ui-switch-track-width-lg` | `3rem` | Track width at lg size. |
| `--ui-switch-track-height-lg` | `1.625rem` | Track height at lg size. |
| `--ui-switch-thumb-size-lg` | `1.375rem` | Thumb diameter at lg size. |
| `--ui-switch-radius` | `9999px` | Border radius of the track (pill shape). |
| `--ui-switch-thumb-radius` | `9999px` | Border radius of the thumb (circle). |
| `--ui-switch-thumb-offset` | `2px` | Inset offset for thumb from track edge. |
| `--ui-switch-label-gap` | `0.5rem` | Gap between label and track. |
| `--ui-switch-transition` | `150ms` | Transition duration for slide animation. |
| `--ui-switch-font-size-sm` | `0.875rem` | Label font size at sm size. |
| `--ui-switch-font-size-md` | `1rem` | Label font size at md size (default). |
| `--ui-switch-font-size-lg` | `1.125rem` | Label font size at lg size. |
| `--ui-switch-track-bg` | `var(--color-muted, var(--ui-color-muted))` | Track background when unchecked. |
| `--ui-switch-track-border` | `var(--color-border, var(--ui-color-border))` | Track border color. |
| `--ui-switch-thumb-bg` | `white` | Thumb background color (hardcoded white; use .dark override if needed). |
| `--ui-switch-track-bg-checked` | `var(--color-primary, var(--ui-color-primary))` | Track background when checked. |
| `--ui-switch-track-bg-disabled` | `var(--color-muted, var(--ui-color-muted))` | Track background when disabled. |
| `--ui-switch-thumb-bg-disabled` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Thumb color when disabled. |
| `--ui-switch-ring` | `var(--color-ring, var(--ui-color-ring))` | Focus ring color. |
| `--ui-switch-border-error` | `var(--color-destructive, var(--ui-color-destructive))` | Track border color on error. |
| `--ui-switch-text-error` | `var(--color-destructive, var(--ui-color-destructive))` | Error text color. |

## CSS Parts

| Part | Description |
|------|-------------|
| `wrapper` | Outer flex wrapper containing label and track. |
| `track` | The oval toggle track background. |
| `thumb` | The sliding circle thumb. |
| `label` | Label text element. |
| `error` | Error message text. |

## Behavior Notes

- **Form participation**: `lui-switch` is form-associated (uses ElementInternals, client-side only with `isServer` guard). When checked, submits the `value` attribute under the switch's `name`. When unchecked, submits null (matching native checkbox behavior).
- **Toggle activation**: Click, Space key, or Enter key toggles the switch. Space key prevents default page scroll behavior.
- **Required validation**: Error message shows only after `touched=true` (the user has interacted via click or keyboard). Submitting a form with a required unchecked switch also triggers the error.
- **Disabled state**: `pointer-events: none` on `:host([disabled])` prevents all interaction. `aria-disabled="true"` and `tabindex="-1"` are set on the track div (removes from tab order). The track renders at 50% opacity.
- **Form reset**: `formResetCallback` restores the switch to its initial `checked` state (at `connectedCallback` time) and clears `touched` and error state.
- **Form disabled**: `formDisabledCallback` propagates the form's disabled state to the switch's `disabled` property.
- **Focus ring**: Applied to `.switch-track:focus-visible` (the div with `role="switch"`). Uses `outline: 2px solid` with 2px offset.
- **Thumb positioning**: Thumb slides from `left: var(--ui-switch-thumb-offset)` (unchecked) to a computed translateX based on track-width, thumb-size, and offset (checked). Each size class has its own transition target.
- **prefers-reduced-motion**: `transition-duration: 0ms` applied to `.switch-thumb` and `.switch-track` when user prefers reduced motion.
- **Label slot**: The `label` prop renders a `<label>` element with the text. The default slot renders the same `<label>` element with slot content. Both label and track are in a flex row with `gap: var(--ui-switch-label-gap)`.
