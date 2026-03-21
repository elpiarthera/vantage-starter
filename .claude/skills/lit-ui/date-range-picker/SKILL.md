---
name: lit-ui-date-range-picker
description: >-
  How to use <lui-date-range-picker> — props, events, CSS tokens, examples.
---

# Date Range Picker

## Usage

```html
<lui-date-range-picker label="Date Range"></lui-date-range-picker>
<lui-date-range-picker label="Project Timeline" start-date="2026-01-01" end-date="2026-03-31"></lui-date-range-picker>
<lui-date-range-picker label="Booking" min-date="2026-01-01" max-date="2026-12-31" min-days="2" max-days="30"></lui-date-range-picker>
<lui-date-range-picker label="Trip" required></lui-date-range-picker>
<lui-date-range-picker presets label="Date Range"></lui-date-range-picker>
<lui-date-range-picker comparison label="Compare Periods"></lui-date-range-picker>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| start-date | `string` | `""` | Start of the selected range as ISO string (YYYY-MM-DD). |
| end-date | `string` | `""` | End of the selected range as ISO string (YYYY-MM-DD). |
| name | `string` | `""` | Form field name. Submitted as ISO 8601 interval (`YYYY-MM-DD/YYYY-MM-DD`). |
| locale | `string` | `navigator.language` | BCP 47 locale tag. |
| placeholder | `string` | `"Select date range"` | Placeholder text displayed when no range is selected. |
| label | `string` | `""` | Accessible label text. |
| helper-text | `string` | `""` | Helper text below the input. |
| min-date | `string` | `""` | Minimum selectable date as ISO string. |
| max-date | `string` | `""` | Maximum selectable date as ISO string. |
| min-days | `number` | `0` | Minimum number of days in the selected range. |
| max-days | `number` | `0` | Maximum number of days in the selected range (0 = no limit). |
| required | `boolean` | `false` | Whether a range selection is required for form submission. |
| disabled | `boolean` | `false` | Whether the date range picker is disabled. |
| error | `string` | `""` | External error message to display. |
| comparison | `boolean` | `false` | Enable comparison mode with a second range for analytics/analytics dashboards. |
| compare-start-date | `string` | `""` | Start of the comparison range. |
| compare-end-date | `string` | `""` | End of the comparison range. |
| presets | `boolean \| DateRangePreset[]` | `false` | Quick selection presets. `true` shows defaults (Last 7/30/90 days, This month, etc). Pass custom array via JS. |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `change` | `{ startDate: string, endDate: string, isoInterval: string, compareStartDate?: string, compareEndDate?: string, compareIsoInterval?: string }` | Fired when the range changes. All dates are YYYY-MM-DD. `isoInterval` is `"YYYY-MM-DD/YYYY-MM-DD"`. Compare fields included only when `comparison` is enabled. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-date-range-bg` | `var(--color-background, white)` | Input background color. |
| `--ui-date-range-text` | `var(--color-foreground, var(--ui-color-foreground))` | Input text color. |
| `--ui-date-range-border` | `var(--color-border, var(--ui-color-border))` | Input border color. |
| `--ui-date-range-placeholder` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Placeholder text color. |
| `--ui-date-range-label-text` | `var(--color-foreground, var(--ui-color-foreground))` | Label text color. |
| `--ui-date-range-error` | `var(--color-destructive, var(--ui-color-destructive))` | Error text and border color. |
| `--ui-date-range-ring` | `var(--color-ring, var(--ui-color-ring))` | Focus ring color. |
| `--ui-date-range-popup-bg` | `var(--color-card, var(--ui-color-card))` | Calendar popup background color. |
| `--ui-date-range-popup-border` | `var(--color-border, var(--ui-color-border))` | Calendar popup border color. |
| `--ui-date-range-popup-shadow` | `0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)` | Calendar popup box shadow. |
| `--ui-date-range-hover-bg` | `var(--color-muted, var(--ui-color-muted))` | Hover background for action buttons and nav. |
| `--ui-date-range-disabled-bg` | `var(--color-muted, var(--ui-color-muted))` | Disabled input background color. |
| `--ui-date-range-disabled-border` | `var(--color-border, var(--ui-color-border))` | Disabled input border color. |
| `--ui-date-range-helper-text` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Helper text and footer status color. |
| `--ui-date-range-action-text` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Calendar icon and clear button icon color. |
| `--ui-date-range-preset-bg` | `var(--color-background, white)` | Preset sidebar button background. |
| `--ui-date-range-preset-text` | `var(--color-foreground, var(--ui-color-foreground))` | Preset sidebar button text color. |
| `--ui-date-range-preset-border` | `var(--color-border, var(--ui-color-border))` | Preset sidebar button border color. |
| `--ui-date-range-preset-hover-bg` | `var(--color-muted, var(--ui-color-muted))` | Preset button hover background. |
| `--ui-date-range-sidebar-border` | `var(--color-border, var(--ui-color-border))` | Border between preset sidebar and calendars. |
| `--ui-date-range-footer-border` | `var(--color-border, var(--ui-color-border))` | Border above popup footer. |
| `--ui-date-range-clear-border` | `var(--color-border, var(--ui-color-border))` | Clear button border color. |
| `--ui-date-range-clear-text` | `var(--color-foreground, var(--ui-color-foreground))` | Clear button text color. |
| `--ui-date-range-clear-hover-bg` | `var(--color-muted, var(--ui-color-muted))` | Clear button hover background. |
| `--ui-date-range-toggle-border` | `var(--color-border, var(--ui-color-border))` | Comparison toggle button border color. |
| `--ui-date-range-toggle-hover-bg` | `var(--color-muted, var(--ui-color-muted))` | Comparison toggle button hover background. |
| `--ui-date-range-toggle-active-bg` | `var(--color-primary, var(--ui-color-primary))` | Active comparison toggle button background. |
| `--ui-date-range-toggle-active-text` | `var(--color-primary-foreground, var(--ui-color-primary-foreground))` | Active comparison toggle button text color. |
| `--ui-date-range-compare-highlight-bg` | `oklch(0.93 0.06 85)` | In-range comparison days highlight background (amber). |
| `--ui-date-range-compare-preview-bg` | `oklch(0.97 0.03 85)` | Hover-preview comparison range background (light amber). |
| `--ui-date-range-z-index` | `40` | Popup z-index stacking level. |

## Behavior Notes

- **Two-click range selection**: First click sets the start date (enters `start-selected` state); second click sets the end date and completes the range. If end < start, dates are auto-swapped (normalized order).
- **Dual-calendar popup layout**: The popup shows two months side by side. Navigation arrows advance both calendars together.
- **Drag selection**: Click-and-drag across day cells for faster range selection. Releasing on a different cell completes the range; releasing on the same starting cell stays in `start-selected` state, waiting for a second click.
- **Popup positioning**: Uses Floating UI (`computePosition`) with `flip` and `shift` middleware anchored to the input container. `strategy: 'fixed'` avoids clipping in scrollable containers.
- **Presets sidebar**: The `presets` attribute enables a sidebar of preset buttons. `true` shows built-in defaults (Last 7 Days, Last 30 Days, Last 90 Days, This Month). Pass a `DateRangePreset[]` array via JS for custom presets. Presets outside `min-date`/`max-date` constraints are disabled.
- **Comparison mode**: The `comparison` attribute enables a second independently selectable range. Toggle buttons in the popup header switch the active selection target (Primary Range vs. Comparison Range). Primary range uses blue/primary tokens; comparison range uses amber oklch tokens.
- **compare-highlight-bg and compare-preview-bg**: These two tokens use oklch literal values in `:root` (`oklch(0.93 0.06 85)` and `oklch(0.97 0.03 85)`). Override them to change comparison overlay colors. They have separate `.dark` overrides (`oklch(0.30)` / `oklch(0.22)`) because the light values are too bright on dark backgrounds.
- **range-* tokens**: Selected day, highlight, and preview backgrounds (`--ui-range-selected-bg`, `--ui-range-highlight-bg`, `--ui-range-preview-bg`) are applied by the embedded `lui-calendar` component directly via inline styles — not by `--ui-date-range-*` tokens.
- **Dark mode**: All `--ui-date-range-*` tokens except `compare-highlight-bg` and `compare-preview-bg` cascade automatically through semantic `.dark` color overrides. No per-component `.dark` block is required.
- **Form association**: Participates in native forms via `ElementInternals`. Submits as ISO 8601 interval format `YYYY-MM-DD/YYYY-MM-DD`. The `name` attribute sets the field name. In comparison mode, both intervals are submitted separated by `|`.
- **Keyboard navigation**: Escape closes the popup and restores focus to the input. Tab is trapped within the popup (focus cycles back to the calendar). Arrow keys navigate calendar days within the embedded `lui-calendar`.
- **min-days / max-days**: Constrain the allowed range duration. Violating durations show an internal validation error; presets that fall outside these constraints are disabled.
