---
name: lit-ui-input
description: >-
  How to use <lui-input> — props, slots, events, CSS tokens, examples.
---

# Input

## Usage

```html
<lui-input type="text" placeholder="Text input"></lui-input>
<lui-input type="email" placeholder="Email input"></lui-input>
<lui-input type="password" placeholder="Password input"></lui-input>
<lui-input type="number" placeholder="Number input"></lui-input>
<lui-input type="search" placeholder="Search input"></lui-input>
```

```html
<lui-input label="Email Address" type="email" placeholder="you@example.com"></lui-input>
<lui-input
  label="Username"
  helper-text="Choose a unique username, 3-20 characters"
  placeholder="your-username"
></lui-input>
<lui-input label="Email" required placeholder="Required field"></lui-input>
<lui-input clearable placeholder="Type to see clear button" value="Clear me"></lui-input>
```

```html
<!-- Prefix/suffix slots -->
<lui-input placeholder="0.00">
  <span slot="prefix">$</span>
</lui-input>
<lui-input type="number" placeholder="100">
  <span slot="suffix">kg</span>
</lui-input>
```

```html
<!-- Character counter -->
<lui-input label="Bio" placeholder="Tell us about yourself" maxlength="100" show-count></lui-input>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | `"text" \| "email" \| "password" \| "number" \| "search"` | `"text"` | The input type. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Size variant affecting padding and font size. |
| name | `string` | `""` | Form submission name. |
| value | `string` | `""` | Current value of the input. |
| placeholder | `string` | `""` | Placeholder text displayed when empty. |
| label | `string` | `""` | Label text above the input. |
| helper-text | `string` | `""` | Helper text between label and input. |
| required | `boolean` | `false` | Whether the input is required for form submission. |
| required-indicator | `"asterisk" \| "text"` | `"asterisk"` | Style of required indicator: * or (required). |
| disabled | `boolean` | `false` | Whether the input is disabled. |
| readonly | `boolean` | `false` | Whether the input is readonly. |
| minlength | `number` | `-` | Minimum length for text validation. |
| maxlength | `number` | `-` | Maximum length for text validation. |
| pattern | `string` | `""` | Regex pattern for validation. |
| min | `number` | `-` | Minimum value for number type. |
| max | `number` | `-` | Maximum value for number type. |
| clearable | `boolean` | `false` | Show clear button when input has value. |
| show-count | `boolean` | `false` | Show character counter (requires maxlength). |

## Slots

| Slot | Description |
|------|-------------|
| prefix | Content before the input (e.g., currency symbol, icon). |
| suffix | Content after the input (e.g., unit label, icon). |

## Events

No custom events. Use standard DOM events (`input`, `change`, `focus`, `blur`).

## Behavior Notes

- **Password toggle**: `type="password"` automatically renders an eye-icon button inside the suffix area. Clicking it toggles between password (dots) and text (visible). Uses `aria-pressed` and an `aria-live` region that announces "Password shown" / "Password hidden".
- **Validation timing**: Error state shows only after the user has blurred the input (touched state). Subsequent input re-validates on each keystroke. Error message sourced from native `validationMessage` (required, minlength, pattern, etc.).
- **Form participation**: ElementInternals (client-side only, SSR-guarded). `type`, `required`, `minlength`, `maxlength`, `pattern`, `min`, `max` all participate in native form validation. `formResetCallback` clears value and resets validation state.
- **Clearable**: When `clearable` is set and `value` is non-empty, an X-circle button appears inside the container. Clicking it empties the value and returns focus to the input.
- **Character counter**: `show-count` with `maxlength` displays a live "current/max" count inside the container (e.g., "45/200"). Uses CSS part `counter`.
- **Disabled vs readonly**: `disabled` prevents all interaction and sets `pointer-events: none` on the host. `readonly` allows text selection/copy but not editing. Both visually indicated via background and cursor.
- **Focus ring**: `outline: 2px solid var(--ui-focus-ring-color, var(--ui-input-ring))` with `outline-offset: 2px` on `:focus-within` on the container — not on the native input directly.
- **Prefix/suffix slot detection**: Slots are hidden by default and shown only when assigned content exists, avoiding visual gaps when empty.

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-input-radius` | `0.375rem` | Border radius of the input container. |
| `--ui-input-border-width` | `1px` | Border width of the input container. |
| `--ui-input-transition` | `150ms` | Transition duration for border-color and box-shadow. |
| `--ui-input-font-size-sm` | `0.875rem` | Font size for size="sm". |
| `--ui-input-font-size-md` | `1rem` | Font size for size="md". |
| `--ui-input-font-size-lg` | `1.125rem` | Font size for size="lg". |
| `--ui-input-padding-x-md` | `1rem` | Horizontal padding for size="md". |
| `--ui-input-padding-y-md` | `0.5rem` | Vertical padding for size="md". |
| `--ui-input-bg` | `var(--color-background, white)` | Background color of the input. |
| `--ui-input-text` | `var(--color-foreground, ...)` | Text color of the input. |
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
| `label` | Label element above the input. |
| `helper` | Helper text span. |
| `container` | Input container with border and focus ring. |
| `input` | Native input element. |
| `prefix` | Prefix slot wrapper. |
| `suffix` | Suffix slot wrapper. |
| `counter` | Character counter span. |
| `error` | Error text span (role="alert"). |
