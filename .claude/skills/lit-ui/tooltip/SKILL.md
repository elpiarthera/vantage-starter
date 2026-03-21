---
name: lit-ui-tooltip
description: >-
  How to use <lui-tooltip> — props, slots, CSS tokens, CSS parts, examples.
---

# Tooltip

## Usage

```html
<!-- Basic -->
<lui-tooltip content="This is a helpful tooltip">
  <lui-button>Hover me</lui-button>
</lui-tooltip>
```

```html
<!-- Placement -->
<lui-tooltip content="Top tooltip" placement="top"><lui-button variant="outline">Top</lui-button></lui-tooltip>
<lui-tooltip content="Right tooltip" placement="right"><lui-button variant="outline">Right</lui-button></lui-tooltip>
<lui-tooltip content="Bottom tooltip" placement="bottom"><lui-button variant="outline">Bottom</lui-button></lui-tooltip>
<lui-tooltip content="Left tooltip" placement="left"><lui-button variant="outline">Left</lui-button></lui-tooltip>
```

```html
<!-- Rich tooltip with title and description -->
<lui-tooltip rich tooltip-title="Keyboard Shortcut">
  <span slot="content">Press Ctrl+S to save your document</span>
  <lui-button>Details</lui-button>
</lui-tooltip>
```

```html
<!-- Without arrow -->
<lui-tooltip content="No arrow indicator" arrow="false">
  <lui-button variant="outline">No Arrow</lui-button>
</lui-tooltip>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| content | `string` | `""` | Text content for the tooltip. Alternative to the content slot. |
| placement | `Placement` | `"top"` | Preferred placement relative to trigger. Floating UI may flip if space is insufficient. Supports 12 Floating UI positions. |
| show-delay | `number` | `300` | Delay in milliseconds before showing tooltip on hover. |
| hide-delay | `number` | `100` | Delay in milliseconds before hiding tooltip after pointer leaves. |
| arrow | `boolean` | `true` | Whether to show an arrow indicator pointing at the trigger. |
| offset | `number` | `8` | Offset distance from trigger in pixels. |
| rich | `boolean` | `false` | Whether this is a rich tooltip with title and description. |
| tooltip-title | `string` | `""` | Title text for the rich tooltip variant. Uses tooltip-title attribute to avoid HTMLElement.title conflict. |
| disabled | `boolean` | `false` | Disable tooltip display. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Trigger element that the tooltip attaches to. |
| content | Named slot for rich tooltip content. Overrides the content property. |
| title | Named slot for rich tooltip title. Overrides the tooltip-title property. |

## Events

No custom events. Tooltip opens on hover and keyboard focus automatically.

## Accessibility Notes

- Uses `aria-describedby` to link trigger to tooltip content for screen readers.
- Tooltip appears on both hover and keyboard focus.
- Pressing `Escape` dismisses the tooltip.
- Touch devices do not trigger tooltips (pointer type filtering).
- Delay groups skip show delay when moving between adjacent tooltips.
- Animations respect `prefers-reduced-motion`.

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-tooltip-bg` | `var(--color-foreground, var(--ui-color-foreground))` | Background color of the tooltip. |
| `--ui-tooltip-text` | `var(--color-background, white)` | Text color of the tooltip. |
| `--ui-tooltip-radius` | `0.375rem` | Border radius of the tooltip. |
| `--ui-tooltip-padding-x` | `0.75rem` | Horizontal padding of the tooltip. |
| `--ui-tooltip-padding-y` | `0.375rem` | Vertical padding of the tooltip. |
| `--ui-tooltip-font-size` | `0.875rem` | Font size of the tooltip text. |
| `--ui-tooltip-shadow` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | Box shadow of the tooltip. |
| `--ui-tooltip-arrow-size` | `8px` | Size of the arrow indicator. |
| `--ui-tooltip-max-width` | `20rem` | Maximum width of the tooltip. |
| `--ui-tooltip-z-index` | `50` | Z-index of the tooltip panel. |

## CSS Parts

| Part | Description |
|------|-------------|
| `trigger` | The trigger wrapper element. |
| `tooltip` | The tooltip panel container. |
| `content` | The tooltip content container with background and padding. |
| `arrow` | The arrow indicator pointing at the trigger. |

## Behavior Notes

- Tooltip opens on pointer hover (pointerenter) and keyboard focus (focusin) after `show-delay` ms (default 300ms). Both trigger types use the same show/hide state machine.
- Touch events are excluded: `pointerType === 'touch'` events are ignored. Tooltips are pointer and keyboard only — no touch activation.
- `Escape` key dismisses the tooltip immediately when it is open (keydown handler on the trigger slot wrapper).
- `hide-delay` (default 100ms) keeps the tooltip visible briefly after the pointer leaves, allowing cursor movement into the tooltip panel without the tooltip closing. The tooltip panel also extends this bridge via its own pointerenter/pointerleave handlers.
- Delay groups: when `<lui-tooltip>` elements share a delay group context, moving between adjacent tooltips skips `show-delay` for instant switching. The group tracks the last closed tooltip timestamp.
- Rich variant (`rich` attribute): the tooltip content area renders a title (from `tooltip-title` prop or `title` slot) above a description (from `content` prop or `content` slot). Padding increases to `0.75rem 1rem` in rich mode.
- Dark mode: all 10 `--ui-tooltip-*` tokens cascade automatically through the semantic `.dark` system. No explicit `.dark` overrides are needed. `--ui-tooltip-bg` (foreground) remains light in dark mode and `--ui-tooltip-text` (background) remains dark — preserving the inverted monochrome appearance in both themes.
- Floating UI positioning: `computePosition` with `flip`, `shift` (8px edge padding), and `offset` (default 8px) middleware. The `arrow` middleware positions the arrow element relative to the resolved placement side. `autoUpdate` repositions on scroll and resize while the tooltip is open.
- Arrow element is a `--ui-tooltip-arrow-size` square (default 8px) rotated 45° with `background: var(--ui-tooltip-bg)`. Disable with `arrow={false}`. Override arrow size via `--ui-tooltip-arrow-size`.
- Animation: fade-only via CSS opacity transition (150ms ease-out). `@starting-style` provides the entry animation. `prefers-reduced-motion: reduce` disables all transitions. No scale or slide animations.
- SSR safe: `isServer` guard prevents tooltip panel from rendering on the server. Tooltip DOM only exists while `open=true`; it is removed from DOM when hidden.
- Cleanup: `AbortController` and `autoUpdatePosition` cleanup run in `disconnectedCallback` — no event listener or animation frame leaks.
