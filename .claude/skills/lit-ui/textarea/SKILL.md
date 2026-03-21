---
name: lit-ui-textarea
description: >-
  How to use <lui-textarea> — props, slots, events, CSS tokens, examples.
---

# Textarea

## Usage

```html
<lui-textarea placeholder="Enter your message..."></lui-textarea>
```

```html
<lui-textarea label="Bio" helper-text="Max 500 characters" placeholder="About you..."></lui-textarea>
<lui-textarea label="Notes" required placeholder="Required field"></lui-textarea>
<lui-textarea autoresize placeholder="Grows as you type"></lui-textarea>
<lui-textarea autoresize max-rows="6" placeholder="Max 6 rows"></lui-textarea>
<lui-textarea label="Bio" maxlength="200" show-count placeholder="Tell us about yourself"></lui-textarea>
<lui-textarea resize="none" placeholder="Fixed size"></lui-textarea>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | `"sm" \| "md" \| "lg"` | `"md"` | Size variant affecting padding and font size. |
| name | `string` | `""` | Form submission name. |
| value | `string` | `""` | Current value of the textarea. |
| placeholder | `string` | `""` | Placeholder text displayed when empty. |
| label | `string` | `""` | Label text above the textarea. |
| helper-text | `string` | `""` | Helper text between label and textarea. |
| rows | `number` | `3` | Initial height in rows. |
| resize | `"none" \| "vertical" \| "horizontal" \| "both"` | `"vertical"` | Resize handle behavior. |
| autoresize | `boolean` | `false` | Auto-grow to fit content. Hides resize handle when enabled. |
| max-rows | `number` | `-` | Maximum rows for auto-resize constraint. |
| max-height | `string` | `-` | Maximum height CSS value (e.g., "200px"). Takes precedence over max-rows. |
| required | `boolean` | `false` | Whether the textarea is required for form submission. |
| required-indicator | `"asterisk" \| "text"` | `"asterisk"` | Style of required indicator: * or (required). |
| disabled | `boolean` | `false` | Whether the textarea is disabled. |
| readonly | `boolean` | `false` | Whether the textarea is readonly. |
| minlength | `number` | `-` | Minimum length for text validation. |
| maxlength | `number` | `-` | Maximum length for text validation. |
| show-count | `boolean` | `false` | Show character counter (requires maxlength). Displays "current/max" format. |

## Slots

No slots. All content is via properties.

## Events

No custom events. Use standard DOM events (`input`, `change`, `focus`, `blur`).

## Behavior Notes

- **Auto-resize**: When `autoresize` is set, the textarea grows to fit content on each `input` event. Resize handle is hidden (`resize: none`). Height is calculated from `scrollHeight` and clamped to the initial `rows` minimum and `max-rows` / `max-height` maximum.
- **Max height constraints**: `max-height` (CSS value, e.g. "200px") takes precedence over `max-rows`. When the constraint is reached, `overflow-y: auto` is set so the user can scroll.
- **Validation timing**: Error state shows only after the user has blurred the textarea (touched state). Subsequent input re-validates on each keystroke. Error message sourced from native `validationMessage` (required, minlength, maxlength).
- **Form participation**: ElementInternals (client-side only, SSR-guarded). `required`, `minlength`, `maxlength` participate in native form validation. `formResetCallback` clears value, resets touched state, and adjusts height if autoresize is active.
- **Character counter**: `show-count` with `maxlength` displays a live "current/max" count inside the textarea bottom-right corner (e.g., "45/200"). Extra bottom padding (`padding-bottom: 1.75rem`) is added automatically via the `has-counter` CSS class to prevent text overlap.
- **Disabled vs readonly**: `disabled` prevents all interaction and sets `pointer-events: none` on the host. `readonly` allows text selection/copy but not editing. Both states visually indicated via background and cursor styles.
- **Focus ring**: `outline: 2px solid var(--ui-focus-ring-color, var(--ui-textarea-ring))` with `outline-offset: 2px` on the native `textarea:focus` — applied directly to the textarea element (not a wrapper container).
- **Required indicator**: When `required` is set, the label shows either an asterisk (`*`) or the text `(required)` depending on `required-indicator`. The required state participates in native form validation via ElementInternals.

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-input-radius` | `0.375rem` | Border radius of the textarea. |
| `--ui-input-border-width` | `1px` | Border width of the textarea. |
| `--ui-input-transition` | `150ms` | Transition duration for border-color and box-shadow. |
| `--ui-input-font-size-sm` | `0.875rem` | Font size for size="sm". |
| `--ui-input-font-size-md` | `1rem` | Font size for size="md". |
| `--ui-input-font-size-lg` | `1.125rem` | Font size for size="lg". |
| `--ui-input-padding-x-md` | `1rem` | Horizontal padding for size="md". |
| `--ui-input-padding-y-md` | `0.5rem` | Vertical padding for size="md". |
| `--ui-input-bg` | `var(--color-background, white)` | Background color of the textarea. |
| `--ui-input-text` | `var(--color-foreground, ...)` | Text color of the textarea. |
| `--ui-input-border` | `var(--color-border, ...)` | Border color (default state). |
| `--ui-input-placeholder` | `var(--color-muted-foreground, ...)` | Placeholder text color. |
| `--ui-input-border-focus` | `var(--color-ring, ...)` | Border color on focus. |
| `--ui-input-border-error` | `var(--color-destructive, ...)` | Border color on validation error. |
| `--ui-input-bg-disabled` | `var(--color-muted, ...)` | Background color when disabled. |
| `--ui-input-text-disabled` | `var(--color-muted-foreground, ...)` | Text color when disabled. |

## CSS Parts

| Part | Description |
|------|-------------|
| `wrapper` | Outer wrapper div containing all elements. |
| `label` | Label element above the textarea. |
| `helper` | Helper text span. |
| `textarea` | Native textarea element. |
| `counter` | Character counter span. |
| `error` | Error text span. |
