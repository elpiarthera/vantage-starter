---
name: lit-ui-button
description: >-
  How to use <lui-button> — props, slots, events, CSS tokens, examples.
---

# Button

## Usage

```html
<lui-button variant="primary">Primary</lui-button>
<lui-button variant="secondary">Secondary</lui-button>
<lui-button variant="outline">Outline</lui-button>
<lui-button variant="ghost">Ghost</lui-button>
<lui-button variant="destructive">Destructive</lui-button>
```

```html
<lui-button loading>Loading...</lui-button>
<lui-button variant="secondary" loading>Saving</lui-button>
```

```html
<lui-button>
  <svg slot="icon-start" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  Add Item
</lui-button>
<lui-button variant="outline">
  Settings
  <svg slot="icon-end" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
</lui-button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"primary" \| "secondary" \| "outline" \| "ghost" \| "destructive"` | `"primary"` | The visual style of the button. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | The size affecting padding and font size. |
| type | `"button" \| "submit" \| "reset"` | `"button"` | The button type for form behavior. |
| disabled | `boolean` | `false` | Whether the button is disabled. Uses aria-disabled — stays in tab order. |
| loading | `boolean` | `false` | Shows a pulsing dots spinner and prevents interaction. |
| btn-class | `string` | `""` | Additional Tailwind classes applied to the inner button element. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Button text content. |
| icon-start | Icon placed before the text. Scales with button font-size via 1em. |
| icon-end | Icon placed after the text. Scales with button font-size via 1em. |

## Events

No custom events. Use standard DOM events (e.g. `click`).

## Behavior Notes

- **Form participation**: `type="submit"` and `type="reset"` work inside `<form>` elements via ElementInternals. This is client-side only.
- **Disabled state**: Uses `aria-disabled` (not the HTML `disabled` attribute), so the element stays focusable for screen readers. Visually: opacity 0.5, cursor not-allowed.
- **Loading state**: Replaces content with a 3-dot pulsing spinner. Sets `aria-busy` and `aria-label="Loading"`. Pointer-events disabled.
- **Auto-contrast**: For `primary`, `secondary`, and `destructive` variants, text color is automatically calculated from the background color lightness using CSS relative color syntax (requires browser support; static fallback provided).
- **Focus ring**: `outline: 2px solid var(--ui-focus-ring-color)` with `outline-offset: 2px` on `:focus-visible`.

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-button-radius` | `0.375rem` | Border radius of the button. |
| `--ui-button-shadow` | `none` | Box shadow of the button. |
| `--ui-button-border-width` | `1px` | Border width (used by outline variant). |
| `--ui-button-font-weight` | `500` | Font weight of the button text. |
| `--ui-button-font-size-sm` | `0.875rem` | Font size for size="sm". |
| `--ui-button-font-size-md` | `1rem` | Font size for size="md". |
| `--ui-button-font-size-lg` | `1.125rem` | Font size for size="lg". |
| `--ui-button-padding-x-md` | `1rem` | Horizontal padding for size="md". |
| `--ui-button-padding-y-md` | `0.5rem` | Vertical padding for size="md". |
| `--ui-button-primary-bg` | `var(--color-primary, var(--ui-color-primary))` | Primary variant background. |
| `--ui-button-secondary-bg` | `var(--color-secondary, var(--ui-color-secondary))` | Secondary variant background. |
| `--ui-button-destructive-bg` | `var(--color-destructive, var(--ui-color-destructive))` | Destructive variant background. |

## CSS Parts

| Part | Description |
|------|-------------|
| `button` | The inner button element. |
| `icon-start` | The icon-start slot wrapper. |
| `content` | The default slot wrapper for button text. |
| `icon-end` | The icon-end slot wrapper. |
