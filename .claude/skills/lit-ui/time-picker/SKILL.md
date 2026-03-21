---
name: lit-ui-time-picker
description: >-
  How to use <lui-time-picker> — props, events, CSS tokens, sub-components, examples.
---

# Time Picker

## Usage

```html
<lui-time-picker label="Meeting Time"></lui-time-picker>
<lui-time-picker label="Appointment" value="14:30:00"></lui-time-picker>
<lui-time-picker label="Start Time" min-time="09:00" max-time="17:00"></lui-time-picker>
<lui-time-picker label="Time" hour12></lui-time-picker>
<lui-time-picker label="Time" step="15"></lui-time-picker>
<lui-time-picker label="Time" interface-mode="clock"></lui-time-picker>
<lui-time-picker label="Time" interface-mode="wheel"></lui-time-picker>
<lui-time-picker label="Time" show-timezone></lui-time-picker>
<lui-time-picker label="Time" presets></lui-time-picker>
<lui-time-picker label="Time" voice></lui-time-picker>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | `""` | Current time value as ISO `HH:mm:ss` string. |
| name | `string` | `""` | Form submission name. |
| label | `string` | `""` | Accessible label text. |
| placeholder | `string` | `"Select time"` | Placeholder text when no time is selected. |
| required | `boolean` | `false` | Whether the time picker is required for form submission. |
| disabled | `boolean` | `false` | Whether the time picker is disabled. |
| readonly | `boolean` | `false` | Whether the time picker is readonly. |
| hour12 | `boolean` | auto from locale | 12-hour clock display. Defaults to locale preference. |
| locale | `string` | `"en-US"` | BCP 47 locale for display formatting. |
| step | `number` | `30` | Minute step interval (minutes). |
| min-time | `string` | `""` | Minimum selectable time as `HH:mm`. |
| max-time | `string` | `""` | Maximum selectable time as `HH:mm`. |
| allow-overnight | `boolean` | `false` | Allow min-time > max-time (overnight range crossing midnight). |
| show-timezone | `boolean` | `false` | Show timezone display and selector. |
| timezone | `string` | local | Timezone identifier (e.g. "America/New_York"). |
| voice | `boolean` | `false` | Enable voice input via Web Speech API (progressive enhancement). |
| interface-mode | `"clock" \| "dropdown" \| "both" \| "wheel" \| "range"` | `"both"` | Which time input interface to show. |
| presets | `boolean \| TimePreset[]` | `false` | Quick preset buttons. `true` for defaults, or pass custom `TimePreset[]` via JS. |
| businessHours | `{start: string, end: string} \| false` | — | Business hours constraint. JS-only property. |
| additionalTimezones | `string[]` | `[]` | Extra timezone options. Pass as comma-separated attribute or JS array. |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `change` | `{ value: string, timeValue: TimeValue \| null }` | Fired when the time value changes. `value` is `HH:mm:ss`. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-time-picker-bg` | `var(--color-background, white)` | Background color of the input display. |
| `--ui-time-picker-text` | `var(--color-foreground, var(--ui-color-foreground))` | Text color of the input display. |
| `--ui-time-picker-border` | `var(--color-border, var(--ui-color-border))` | Border color of the input display. |
| `--ui-time-picker-placeholder` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Placeholder text color. |
| `--ui-time-picker-label-text` | `var(--color-foreground, var(--ui-color-foreground))` | Label text color. |
| `--ui-time-picker-error` | `var(--color-destructive, var(--ui-color-destructive))` | Error state color. |
| `--ui-time-picker-ring` | `var(--color-ring, var(--ui-color-ring))` | Focus ring color. |
| `--ui-time-picker-popup-bg` | `var(--color-card, var(--ui-color-card))` | Popup background color. |
| `--ui-time-picker-popup-border` | `var(--color-border, var(--ui-color-border))` | Popup border color. |
| `--ui-time-picker-popup-shadow` | `0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)` | Popup box shadow. |
| `--ui-time-picker-hover-bg` | `var(--color-muted, var(--ui-color-muted))` | Hover background on interactive areas. |
| `--ui-time-picker-disabled-bg` | `var(--color-muted, var(--ui-color-muted))` | Disabled state background. |
| `--ui-time-picker-disabled-border` | `var(--color-border, var(--ui-color-border))` | Disabled state border color. |
| `--ui-time-picker-tab-bg` | `var(--color-background, white)` | Tab bar background. |
| `--ui-time-picker-tab-text` | `var(--color-foreground, var(--ui-color-foreground))` | Tab text color. |
| `--ui-time-picker-tab-border` | `var(--color-border, var(--ui-color-border))` | Tab border color. |
| `--ui-time-picker-tab-hover-bg` | `var(--color-muted, var(--ui-color-muted))` | Tab background on hover. |
| `--ui-time-picker-tab-active-bg` | `var(--color-primary, var(--ui-color-primary))` | Active tab background. |
| `--ui-time-picker-tab-active-text` | `var(--color-primary-foreground, var(--ui-color-primary-foreground))` | Active tab text color. |
| `--ui-time-picker-preset-bg` | `var(--color-background, white)` | Preset button background. |
| `--ui-time-picker-preset-text` | `var(--color-foreground, var(--ui-color-foreground))` | Preset button text color. |
| `--ui-time-picker-preset-border` | `var(--color-border, var(--ui-color-border))` | Preset button border. |
| `--ui-time-picker-preset-hover-bg` | `var(--color-muted, var(--ui-color-muted))` | Preset button background on hover. |
| `--ui-time-picker-preset-hover-border` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Preset button border on hover. |
| `--ui-time-picker-muted-text` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Muted/secondary text color. |
| `--ui-time-picker-z-index` | `40` | Z-index of the popup layer. |
| `--ui-time-picker-dropdown-bg` | `var(--color-card, var(--ui-color-card))` | Time dropdown panel background. |
| `--ui-time-picker-dropdown-border` | `var(--color-border, var(--ui-color-border))` | Time dropdown panel border. |
| `--ui-time-picker-option-text` | `var(--color-foreground, var(--ui-color-foreground))` | Dropdown option text color. |
| `--ui-time-picker-option-hover-bg` | `var(--color-muted, var(--ui-color-muted))` | Dropdown option background on hover. |
| `--ui-time-picker-option-selected-bg` | `oklch(0.95 0.03 250)` | Selected time option background (oklch blue). |
| `--ui-time-picker-option-selected-text` | `oklch(0.45 0.15 250)` | Selected time option text color (oklch blue). |
| `--ui-time-picker-business-accent` | `oklch(0.60 0.18 150)` | Business hours accent color (oklch green). |
| `--ui-time-picker-business-bg` | `oklch(0.97 0.02 150)` | Business hours slot background (oklch green). |
| `--ui-time-picker-business-hover-bg` | `oklch(0.93 0.04 150)` | Business hours slot background on hover (oklch green). |
| `--ui-time-picker-spinbutton-bg` | `var(--color-background, white)` | Spinbutton (hour/minute/second) background. |
| `--ui-time-picker-spinbutton-text` | `var(--color-foreground, var(--ui-color-foreground))` | Spinbutton text color. |
| `--ui-time-picker-spinbutton-border` | `var(--color-border, var(--ui-color-border))` | Spinbutton border color. |
| `--ui-time-picker-separator-color` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Colon separator color between spinbuttons. |
| `--ui-time-picker-period-bg` | `var(--color-background, white)` | AM/PM period toggle background. |
| `--ui-time-picker-period-text` | `var(--color-foreground, var(--ui-color-foreground))` | AM/PM period toggle text. |
| `--ui-time-picker-period-border` | `var(--color-border, var(--ui-color-border))` | AM/PM period toggle border. |
| `--ui-time-picker-period-hover-bg` | `var(--color-muted, var(--ui-color-muted))` | AM/PM period toggle background on hover. |
| `--ui-time-picker-clock-bg` | `var(--color-muted, var(--ui-color-muted))` | Clock face background. |
| `--ui-time-picker-clock-border` | `var(--color-border, var(--ui-color-border))` | Clock face border. |
| `--ui-time-picker-clock-text` | `var(--color-foreground, var(--ui-color-foreground))` | Clock face number text color. |
| `--ui-time-picker-clock-selected-bg` | `var(--color-primary, var(--ui-color-primary))` | Selected time position circle background. |
| `--ui-time-picker-clock-selected-text` | `var(--color-primary-foreground, var(--ui-color-primary-foreground))` | Selected time position text color. |
| `--ui-time-picker-clock-hand` | `var(--color-primary, var(--ui-color-primary))` | Clock hand color. |
| `--ui-time-picker-voice-bg` | `var(--color-background, white)` | Voice input area background. |
| `--ui-time-picker-voice-text` | `var(--color-foreground, var(--ui-color-foreground))` | Voice input area text color. |
| `--ui-time-picker-voice-border` | `var(--color-border, var(--ui-color-border))` | Voice input area border. |
| `--ui-time-picker-voice-hover-border` | `var(--color-primary, var(--ui-color-primary))` | Voice input area border on hover. |
| `--ui-time-picker-voice-hover-text` | `var(--color-primary, var(--ui-color-primary))` | Voice input area text on hover. |
| `--ui-time-picker-range-label` | `var(--color-foreground, var(--ui-color-foreground))` | Range slider label color. |
| `--ui-time-picker-range-muted` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Range slider muted/secondary text. |
| `--ui-time-picker-range-track` | `var(--color-border, var(--ui-color-border))` | Range slider track color. |
| `--ui-time-picker-range-fill` | `var(--color-primary, var(--ui-color-primary))` | Range slider fill between thumbs. |
| `--ui-time-picker-range-thumb-bg` | `var(--color-background, white)` | Range slider thumb background. |
| `--ui-time-picker-range-thumb-border` | `var(--color-primary, var(--ui-color-primary))` | Range slider thumb border color. |
| `--ui-time-picker-wheel-text` | `var(--color-foreground, var(--ui-color-foreground))` | Scroll wheel item text color. |
| `--ui-time-picker-wheel-selected-text` | `var(--color-primary, var(--ui-color-primary))` | Scroll wheel selected item text color. |
| `--ui-time-picker-wheel-highlight-border` | `var(--color-border, var(--ui-color-border))` | Scroll wheel selection highlight border. |
| `--ui-time-picker-wheel-highlight-bg` | `oklch(0.97 0.01 250)` | Scroll wheel selection highlight background (oklch near-white). |
| `--ui-time-picker-wheel-separator` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Scroll wheel column separator color. |
| `--ui-time-picker-timezone-text` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Timezone display text color. |
| `--ui-time-picker-timezone-separator` | `var(--color-border, var(--ui-color-border))` | Timezone section separator color. |

## Sub-Components

These are exported from `@lit-ui/time-picker` for advanced use:

- `lui-timezone-display` — Timezone display widget
- `lui-time-range-slider` — Dual-handle time range slider
- `lui-time-scroll-wheel` — Scroll-wheel time selection
- `lui-time-voice-input` — Voice input control

## Behavior Notes

- `interface-mode` prop controls the active input UI in the popup: `"clock"` shows a circular clock face; `"dropdown"` shows a scrollable time list; `"both"` shows both with a tab bar to switch between them; `"wheel"` shows scroll-wheel columns for hour/minute/second; `"range"` shows a dual-thumb slider for selecting a time range.
- Popup positioning uses Floating UI (`flip` + `shift` + `offset` middleware) anchored to the input display trigger; popup remains within the viewport and flips when near edges.
- Spinbutton time input uses ARIA `role="spinbutton"` for hour, minute, second, and AM/PM fields — keyboard up/down arrows increment/decrement each field; Tab moves between fields in order.
- Token scope: `clock-*` tokens apply only when `interface-mode` includes `"clock"`; `wheel-*` tokens apply only for `"wheel"` mode; `range-*` tokens apply only for `"range"` mode; `voice-*` tokens apply only when the `voice` attribute is set.
- `business-*` tokens (oklch green palette) highlight business-hours slots in the dropdown list; set the `businessHours` JS property to `{ start: "HH:mm", end: "HH:mm" }` to define the highlighted range.
- `option-selected-bg` and `option-selected-text` (oklch blue palette) highlight the currently selected time slot in the dropdown; override with a different hue to brand the selection color.
- `wheel-highlight-bg` (oklch near-white) marks the selected row in the scroll wheel; override this token for dark themes since it does not cascade through semantic `.dark`.
- Dark mode: 61 of 67 tokens cascade automatically through semantic `.dark` (via `--color-background`, `--color-foreground`, etc.). Six oklch literal exceptions — `option-selected-bg`, `option-selected-text`, `business-accent`, `business-bg`, `business-hover-bg`, and `wheel-highlight-bg` — require an explicit `.dark` override when using custom oklch values.
- Presets: `presets` attribute (boolean) enables default time presets; pass a custom `TimePreset[]` array via JS property for custom quick-select options shown above the time interface.
- Voice input: `voice` attribute enables voice input via the Web Speech API; this is progressive enhancement — falls back silently if the browser does not support `SpeechRecognition`.
- Form integration: form-associated element; submits the value as ISO 8601 `HH:mm:ss` string via `ElementInternals`; supports `required`, `min-time`, and `max-time` validation attributes.
- Timezone: `show-timezone` attribute shows a timezone selector; `timezone` sets the default timezone identifier (e.g. `"America/New_York"`); `additionalTimezones` (JS property or comma-separated attribute) adds extra timezone options.
