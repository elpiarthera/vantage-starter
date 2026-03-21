---
name: lit-ui-tabs
description: >-
  How to use <lui-tabs> and <lui-tab-panel> — props, slots, events, CSS tokens, examples.
---

# Tabs

## Usage

```html
<lui-tabs default-value="tab-1" label="Example tabs">
  <lui-tab-panel value="tab-1" label="Account">
    Manage your account settings and preferences.
  </lui-tab-panel>
  <lui-tab-panel value="tab-2" label="Security">
    Update your password and two-factor authentication.
  </lui-tab-panel>
  <lui-tab-panel value="tab-3" label="Notifications">
    Configure email and push notification preferences.
  </lui-tab-panel>
</lui-tabs>
```

```html
<!-- Vertical orientation -->
<lui-tabs orientation="vertical" default-value="general" label="Settings">
  <lui-tab-panel value="general" label="General">General application settings.</lui-tab-panel>
  <lui-tab-panel value="appearance" label="Appearance">Theme and display preferences.</lui-tab-panel>
  <lui-tab-panel value="privacy" label="Privacy">Privacy and data sharing options.</lui-tab-panel>
</lui-tabs>
```

```html
<!-- Manual activation (arrow keys move focus, Enter/Space activates) -->
<lui-tabs activation-mode="manual" default-value="tab-1" label="Manual tabs">
  <lui-tab-panel value="tab-1" label="Overview">Arrow keys move focus. Press Enter or Space to activate.</lui-tab-panel>
  <lui-tab-panel value="tab-2" label="Details">Useful when tab switching has side effects.</lui-tab-panel>
</lui-tabs>
```

```html
<!-- Disabled tab -->
<lui-tabs default-value="tab-1" label="Tabs with disabled">
  <lui-tab-panel value="tab-1" label="Active">Active tab content.</lui-tab-panel>
  <lui-tab-panel value="tab-2" label="Disabled" disabled>Cannot be selected.</lui-tab-panel>
  <lui-tab-panel value="tab-3" label="Available">Another functional tab.</lui-tab-panel>
</lui-tabs>
```

```html
<!-- Lazy loading -->
<lui-tabs default-value="tab-1" label="Lazy tabs">
  <lui-tab-panel value="tab-1" label="Eager">Renders immediately.</lui-tab-panel>
  <lui-tab-panel value="tab-2" label="Lazy" lazy>Not rendered until first click.</lui-tab-panel>
</lui-tabs>
```

## Props — `lui-tabs`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | `""` | Active tab value (controlled mode). |
| default-value | `string` | `""` | Initial active tab for uncontrolled mode. |
| disabled | `boolean` | `false` | Disable all tabs. |
| label | `string` | `""` | Accessible label for the tablist element. |
| orientation | `"horizontal" \| "vertical"` | `"horizontal"` | Orientation for keyboard navigation and layout. |
| activation-mode | `"automatic" \| "manual"` | `"automatic"` | Tab activation mode. Automatic activates on focus; manual requires Enter/Space. |

## Props — `lui-tab-panel`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | `""` | Unique identifier for this panel. |
| label | `string` | `""` | Text label displayed in the tab button. |
| disabled | `boolean` | `false` | Whether this tab is disabled. |
| active | `boolean` | `false` | Whether this panel is active (set by parent). |
| lazy | `boolean` | `false` | Defer content rendering until first activation. |

## Slots — `lui-tabs`

| Slot | Description |
|------|-------------|
| (default) | Child `lui-tab-panel` elements. |

## Slots — `lui-tab-panel`

| Slot | Description |
|------|-------------|
| (default) | Panel content. |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `ui-change` | `{ value: string }` | Fired on `lui-tabs` when the active tab changes. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-tabs-border` | `var(--color-border, var(--ui-color-border))` | Border color. |
| `--ui-tabs-list-bg` | `var(--color-muted, var(--ui-color-muted))` | Tab list background. |
| `--ui-tabs-list-padding` | `0.25rem` | Tab list padding. |
| `--ui-tabs-list-radius` | `0.375rem` | Tab list border radius. |
| `--ui-tabs-list-gap` | `0.25rem` | Gap between tab buttons. |
| `--ui-tabs-tab-padding` | `0.5rem 1rem` | Tab button padding. |
| `--ui-tabs-tab-radius` | `0.25rem` | Tab button border radius. |
| `--ui-tabs-tab-font-size` | `0.875rem` | Tab font size. |
| `--ui-tabs-tab-font-weight` | `500` | Tab font weight. |
| `--ui-tabs-tab-text` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Inactive tab text color. |
| `--ui-tabs-tab-bg` | `transparent` | Inactive tab background. |
| `--ui-tabs-tab-hover-text` | `var(--color-foreground, var(--ui-color-foreground))` | Hover tab text color. |
| `--ui-tabs-tab-hover-bg` | `transparent` | Hover tab background. |
| `--ui-tabs-tab-active-text` | `var(--color-foreground, var(--ui-color-foreground))` | Active tab text color. |
| `--ui-tabs-tab-active-bg` | `var(--color-background, white)` | Active tab background. |
| `--ui-tabs-tab-active-shadow` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Active tab box shadow. |
| `--ui-tabs-panel-padding` | `1rem 0` | Panel content padding. |
| `--ui-tabs-panel-text` | `var(--color-foreground, var(--ui-color-foreground))` | Panel text color. |
| `--ui-tabs-ring` | `var(--color-ring, var(--ui-color-ring))` | Focus ring color. |
| `--ui-tabs-transition` | `150ms` | Transition duration. |
| `--ui-tabs-indicator-color` | `var(--color-primary, var(--ui-color-primary))` | Sliding indicator color. |
| `--ui-tabs-indicator-height` | `2px` | Sliding indicator height. |
| `--ui-tabs-indicator-radius` | `9999px` | Sliding indicator border radius. |
| `--ui-tabs-indicator-transition` | `200ms` | Sliding indicator transition duration. |
| `--ui-tabs-scroll-button-size` | `2rem` | Scroll button size for overflow navigation. |

## Behavior Notes

- **State management**: `lui-tabs` manages active tab state centrally. Tab buttons are rendered by the parent inside `role="tablist"` — `lui-tab-panel` provides label and value metadata, not the button itself.
- **Controlled mode**: Set `value` on `lui-tabs` to control the active tab externally. React to the `ui-change` event (`{ value: string }`) to keep it in sync.
- **Uncontrolled mode**: Use `default-value` for the initial active tab. Omit `value` entirely — once `value` is set it takes precedence over `default-value`.
- **Orientation**: `orientation="horizontal"` (default) lays tabs in a row with Left/Right arrow navigation. `orientation="vertical"` stacks tabs with Up/Down arrow navigation and side-by-side layout.
- **Activation mode**: `activation-mode="automatic"` (default) activates a tab when it receives focus via arrow keys. `activation-mode="manual"` separates focus from activation — arrows move focus, Enter/Space activates the focused tab. Use manual mode when switching tabs has side effects (e.g. network requests).
- **Roving tabindex**: Only the active tab button has `tabindex="0"`. All others have `tabindex="-1"`. Tab key enters and exits the tablist as a single stop.
- **Animated indicator**: A sliding underline indicator tracks the active tab using CSS `transform: translateX/translateY`. Indicator position is computed via JS from button bounding rects. Respects `prefers-reduced-motion` (transition-duration set to 0ms).
- **Overflow scroll**: When the tablist overflows its container, left/right scroll buttons appear automatically. `--ui-tabs-scroll-button-size` controls button dimensions. Scrolls 75% of container width per click.
- **Lazy panels**: `lazy` attribute on `lui-tab-panel` defers slot content rendering until the first time the tab is activated. Once rendered, content is preserved when the tab is deactivated (not destroyed).
- **data-state attribute**: Each `lui-tab-panel` exposes `data-state="active"` or `data-state="inactive"` for CSS targeting or test queries.
- **Keyboard navigation**: Arrow Left/Right (horizontal) or Arrow Up/Down (vertical) move between enabled tabs with wrapping. Home/End jump to first/last enabled tab. Disabled tabs are skipped.
- **Panel tabindex**: Active panels receive `tabindex="0"` only when they contain no focusable children (W3C APG Tabs pattern). If a panel has focusable children, the panel itself is not focusable.
- **SSR compatibility**: `isServer` guards skip DOM operations (ResizeObserver, indicator calculation, scroll detection) during server-side rendering.
