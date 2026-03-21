---
name: lit-ui-date-picker
description: >-
  How to use <lui-date-picker> — props, events, CSS tokens, examples.
---

# Date Picker

## Usage

```html
<lui-date-picker label="Date"></lui-date-picker>
<lui-date-picker label="Birthday" value="2026-02-14"></lui-date-picker>
<lui-date-picker label="Appointment" min-date="2026-01-10" max-date="2026-03-31"></lui-date-picker>
<lui-date-picker label="Start Date" required></lui-date-picker>
<lui-date-picker presets label="Date"></lui-date-picker>
<lui-date-picker label="Date" inline></lui-date-picker>
```

```html
<!-- Natural language input: type "tomorrow", "next friday", "in 3 days" -->
<lui-date-picker label="Date"></lui-date-picker>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | `""` | Selected date as ISO 8601 string (YYYY-MM-DD). Canonical form value submitted via ElementInternals. |
| name | `string` | `""` | Form field name for form submission. |
| locale | `string` | `navigator.language` | BCP 47 locale tag. Controls placeholder format, display formatting, and calendar locale. |
| placeholder | `string` | `""` | Custom placeholder text. Falls back to locale-aware placeholder (e.g. "mm/dd/yyyy" for en-US). |
| label | `string` | `""` | Accessible label for the input field. |
| helper-text | `string` | `""` | Helper text displayed below the input. Hidden when error is shown. |
| min-date | `string` | `""` | Minimum selectable date as ISO string. Dates before this are disabled in calendar and rejected on input. |
| max-date | `string` | `""` | Maximum selectable date as ISO string. Dates after this are disabled in calendar and rejected on input. |
| required | `boolean` | `false` | Whether a date selection is required for form submission. Shows required indicator (*) next to label. |
| disabled | `boolean` | `false` | Whether the date picker is disabled. |
| inline | `boolean` | `false` | Render an always-visible calendar without popup/input wrapper. |
| error | `string` | `""` | External error message. When set, overrides internal validation errors. |
| presets | `boolean \| DatePreset[]` | `false` | Preset buttons for quick selection. `true` shows defaults (Today, Tomorrow, Next Week). Pass custom array via JS. |
| format | `Intl.DateTimeFormatOptions \| null` | `null` | Custom display format options (JS-only). Only affects display; parsing still accepts any parseable format. |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `change` | `{ date: Date \| null, isoString: string }` | Fired when a date is selected, typed, or cleared. `date` is null when cleared. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-date-picker-bg` | `var(--color-background, white)` | Background color for the input container. |
| `--ui-date-picker-text` | `var(--color-foreground, var(--ui-color-foreground))` | Text color for the input and label. |
| `--ui-date-picker-border` | `var(--color-border, var(--ui-color-border))` | Border color for the input container. |
| `--ui-date-picker-placeholder` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Placeholder text color. |
| `--ui-date-picker-label-text` | `var(--color-foreground, var(--ui-color-foreground))` | Text color for the field label. |
| `--ui-date-picker-error` | `var(--color-destructive, var(--ui-color-destructive))` | Error text and border color. |
| `--ui-date-picker-ring` | `var(--color-ring, var(--ui-color-ring))` | Focus ring color for action buttons. |
| `--ui-date-picker-popup-bg` | `var(--color-card, var(--ui-color-card))` | Background color for the calendar popup. |
| `--ui-date-picker-popup-border` | `var(--color-border, var(--ui-color-border))` | Border color for the calendar popup. |
| `--ui-date-picker-popup-shadow` | `0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)` | Box shadow for the calendar popup. |
| `--ui-date-picker-hover-bg` | `var(--color-muted, var(--ui-color-muted))` | Background color for hovered action buttons. |
| `--ui-date-picker-disabled-bg` | `var(--color-muted, var(--ui-color-muted))` | Background color for the input container when disabled. |
| `--ui-date-picker-disabled-border` | `var(--color-border, var(--ui-color-border))` | Border color for the input container when disabled. |
| `--ui-date-picker-helper-text` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Color for helper text below the input. |
| `--ui-date-picker-action-text` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Color for the calendar and clear icon buttons. |
| `--ui-date-picker-preset-bg` | `var(--color-background, white)` | Background color for preset buttons. |
| `--ui-date-picker-preset-text` | `var(--color-foreground, var(--ui-color-foreground))` | Text color for preset buttons. |
| `--ui-date-picker-preset-border` | `var(--color-border, var(--ui-color-border))` | Border color for preset buttons. |
| `--ui-date-picker-preset-hover-bg` | `var(--color-muted, var(--ui-color-muted))` | Background color for hovered preset buttons. |
| `--ui-date-picker-preset-hover-border` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Border color for hovered preset buttons. |
| `--ui-date-picker-z-index` | `40` | z-index for the calendar popup. |

## Behavior Notes

- Popup uses Popover API (`popover="manual"`) with Floating UI for positioning; opens below the input (`bottom-start`), flips to `top-start` if insufficient space
- Popup uses `strategy: fixed` positioning to avoid clipping in scrollable containers; positioned by `@floating-ui/dom`
- Escape closes the popup and restores focus to the input; Tab is trapped within the popup when open
- Arrow Down on the input opens the popup; Enter on the input triggers blur/parse (not popup open)
- The embedded `lui-calendar` inherits all calendar keyboard navigation (arrow keys, Home/End, PageUp/PageDown, Enter/Space to select)
- `inline` mode skips the input field, popup, Floating UI, click-outside, and focus trap; renders the calendar always visible
- Form-associated via ElementInternals: submits ISO 8601 string via `name` attribute; reports `valueMissing`, `badInput`, `rangeUnderflow`, `rangeOverflow` validity states
- Natural language input parsed on blur: "tomorrow", "next friday", "in 3 days", "next week"; natural language runs before format-based parsing
- `presets` attribute shows quick-select buttons above the calendar; set to `true` for defaults (Today, Tomorrow, Next Week) or pass a custom `DatePreset[]` array via JS
- Dark mode is governed by the semantic `.dark` cascade through double-fallback `var()` tokens; no per-component `.dark` overrides required
- `locale` prop (BCP 47) controls placeholder format, display formatting, and the embedded calendar's locale; defaults to `navigator.language`
- `format` prop (`Intl.DateTimeFormatOptions`, JS-only) customizes display output only; input parsing still accepts any parseable date format
