---
name: lit-ui-calendar
description: >-
  How to use <lui-calendar> and <lui-calendar-multi> — props, events, CSS tokens, examples.
---

# Calendar

## Usage

```html
<!-- Basic -->
<lui-calendar></lui-calendar>

<!-- Pre-selected date -->
<lui-calendar value="2026-02-14"></lui-calendar>

<!-- Min/max range -->
<lui-calendar min-date="2026-01-10" max-date="2026-02-20"></lui-calendar>

<!-- Disabled specific dates -->
<lui-calendar disabled-dates="2026-02-14,2026-02-15,2026-02-16"></lui-calendar>

<!-- Locale (German: Monday start, German names) -->
<lui-calendar locale="de-DE"></lui-calendar>

<!-- Force first day of week -->
<lui-calendar first-day-of-week="1"></lui-calendar>

<!-- Week numbers -->
<lui-calendar show-week-numbers></lui-calendar>

<!-- Multi-month (side-by-side) -->
<lui-calendar-multi></lui-calendar-multi>
<lui-calendar-multi months="3"></lui-calendar-multi>
```

## Props — `lui-calendar`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | `""` | Selected date as ISO string (YYYY-MM-DD). |
| locale | `string` | `navigator.language` | BCP 47 locale tag for localization. |
| min-date | `string` | `""` | Minimum selectable date as ISO string. Dates before this are grayed out. |
| max-date | `string` | `""` | Maximum selectable date as ISO string. Dates after this are grayed out. |
| disabled-dates | `string[]` | `[]` | Comma-separated list of disabled dates (or JS array). E.g., "2026-02-14,2026-02-15". |
| first-day-of-week | `string` | `""` | Override first day of week from locale. 1=Monday through 7=Sunday. |
| display-month | `string` | `""` | Display a specific month without selecting. Accepts YYYY-MM-DD or YYYY-MM format. |
| hide-navigation | `boolean` | `false` | Hide the month navigation header. Used internally by CalendarMulti. |
| show-week-numbers | `boolean` | `false` | Show ISO week numbers column. Week number buttons allow selecting an entire week. |
| show-constraint-tooltips | `boolean` | `false` | Show tooltips on disabled dates explaining why they are disabled. |

## Props — `lui-calendar-multi`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| months | `number` | `2` | Number of side-by-side month calendars to display (clamped to 2–3). |
| value | `string` | `""` | Selected date as ISO string (YYYY-MM-DD). Forwarded to all child calendars. |
| locale | `string` | `navigator.language` | BCP 47 locale tag forwarded to child calendars. |
| min-date | `string` | `""` | Minimum selectable date forwarded to child calendars. |
| max-date | `string` | `""` | Maximum selectable date forwarded to child calendars. |
| show-week-numbers | `boolean` | `false` | Show ISO week numbers forwarded to child calendars. |
| first-day-of-week | `string` | `""` | Override first day of week forwarded to child calendars. |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `change` | `{ date: Date, isoString: string }` | Fired when a date is selected. `isoString` is YYYY-MM-DD. The `value` prop is updated before firing. |
| `month-change` | `{ year: number, month: number }` | Fired when the displayed month changes (navigation, keyboard, or display-month prop change). `month` is 0-indexed (January = 0). |
| `week-select` | `{ weekNumber: number, dates: Date[], isoStrings: string[] }` | Fired when a week number button is clicked (requires `show-week-numbers`). Contains the ISO week number and all selectable dates in that week. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-calendar-width` | `320px` | Width of the calendar container. |
| `--ui-calendar-day-size` | `2.5rem` | Width and height of date cell buttons. |
| `--ui-calendar-cell-size` | `2.5rem` | Alias for day-size used in some layout contexts. |
| `--ui-calendar-cell-radius` | `0.375rem` | Border radius for individual day cells. |
| `--ui-calendar-gap` | `0.25rem` | Gap between calendar grid items. |
| `--ui-calendar-radius` | `0.375rem` | Border radius for nav buttons and dropdowns. |
| `--ui-calendar-bg` | `var(--color-background, #ffffff)` | Background color for the calendar. |
| `--ui-calendar-text` | `var(--color-foreground, currentColor)` | Text color for the calendar. |
| `--ui-calendar-border` | `var(--color-border, #e5e7eb)` | Border color for the help dialog and date cells. |
| `--ui-calendar-hover-bg` | `var(--color-muted, #f3f4f6)` | Background color on hover for date and nav buttons. |
| `--ui-calendar-weekday-color` | `var(--color-muted-foreground, #6b7280)` | Weekday header text color. |
| `--ui-calendar-nav-color` | `var(--color-foreground, currentColor)` | Navigation arrow button color. |
| `--ui-calendar-today-font-weight` | `600` | Font weight for today's date cell. |
| `--ui-calendar-today-border` | `2px solid var(--color-primary, var(--ui-color-primary))` | Border applied to today's date cell. |
| `--ui-calendar-selected-bg` | `var(--color-primary, var(--ui-color-primary))` | Background color for the selected date. |
| `--ui-calendar-selected-text` | `var(--color-primary-foreground, white)` | Text color for the selected date. |
| `--ui-calendar-outside-opacity` | `0.4` | Opacity for dates from adjacent months. |
| `--ui-calendar-disabled-opacity` | `0.4` | Opacity for disabled dates. |
| `--ui-calendar-focus-ring` | `var(--color-ring, var(--ui-color-ring))` | Focus outline color for interactive elements. |
| `--ui-calendar-tooltip-bg` | `var(--color-foreground, #111827)` | Background color for constraint tooltips (show-constraint-tooltips). |
| `--ui-calendar-tooltip-text` | `var(--color-background, #ffffff)` | Text color for constraint tooltips (show-constraint-tooltips). |

## Behavior Notes

- **Three calendar views**: Month view (7-column day grid), year view (4x3 grid of 12 years in the current decade), decade view (4x3 grid of 12 decades in the current century). Click the month/year heading to drill up; click a year or decade cell to drill down; press Escape to go back one level.
- **Keyboard navigation**: Arrow keys navigate between date cells using a roving tabindex (KeyboardNavigationManager). Home/End jump to first/last day of the current view. PageUp/PageDown navigate months in month view. Enter/Space select the focused date in month view or drill into year/decade views.
- **Touch gestures**: GestureHandler on the month grid enables swipe navigation — swipe left advances to next month, swipe right goes to previous month. Not active in year or decade views.
- **Slide animation**: AnimationController on the month grid provides slide transitions between months. Respects `prefers-reduced-motion` media query (0ms duration when set).
- **Aria-live announcements**: Month changes and date selections are announced via `aria-live="polite"` region. Selected dates use the long localized format (e.g., "Thursday, January 1, 2026").
- **Today indicator**: Today's cell gets `aria-current="date"` and a 2px primary-color border. Receives keyboard focus on first render if visible in the current month.
- **Disabled dates**: Disabled cells get `aria-disabled="true"` with the disable reason appended to `aria-label` (e.g., "Thursday, January 1, 2026, Before minimum date"). `pointer-events: none` prevents clicks. With `show-constraint-tooltips`, hovering shows a CSS `::after` tooltip explaining the reason.
- **Week numbers**: `show-week-numbers` adds ISO week number buttons as the first column. Clicking a week number fires `week-select` with all selectable (non-disabled, current-month) dates in that week. Week number buttons are keyboard-accessible but excluded from the roving tabindex (tabindex="-1" fixed).
- **lui-calendar-multi**: Renders 2 or 3 side-by-side `lui-calendar` instances with `hide-navigation`. Provides shared prev/next nav buttons and advances all child months in sync. Forwards `value`, `locale`, `min-date`, `max-date`, `show-week-numbers`, and `first-day-of-week` to all children. On narrow containers, months stack vertically via CSS container queries.
- **Locale detection**: When `locale` is not set, uses `navigator.language` on client and `'en-US'` on server (SSR-safe). `first-day-of-week` overrides locale-detected week start; accepts 1–7 (Intl format: 1=Monday, 7=Sunday).
- **change event detail**: `{ date: Date, isoString: string }`. The `value` property is updated to the ISO string BEFORE the event fires, so `event.target.value` is always current.
- **Keyboard shortcuts help**: A "? Keyboard shortcuts" button at the bottom of month view opens a native `<dialog>` (`showModal()`) listing all keyboard shortcuts. The dialog has no autofocus trap; close via the Close button or Escape.
