---
name: lit-ui-popover
description: >-
  How to use <lui-popover> — props, slots, events, CSS tokens, CSS parts, examples.
---

# Popover

## Usage

```html
<!-- Basic popover -->
<lui-popover>
  <lui-button>Open Popover</lui-button>
  <div slot="content">
    <p>This is the popover content.</p>
  </div>
</lui-popover>
```

```html
<!-- With arrow indicator -->
<lui-popover arrow placement="bottom">
  <lui-button>With Arrow</lui-button>
  <div slot="content">Popover with arrow pointing at trigger.</div>
</lui-popover>
```

```html
<!-- Modal popover (traps focus) -->
<lui-popover modal>
  <lui-button>Modal Popover</lui-button>
  <div slot="content">Focus is trapped inside this popover.</div>
</lui-popover>
```

```html
<!-- Match trigger width (useful for dropdowns) -->
<lui-popover match-trigger-width placement="bottom-start">
  <lui-button>Dropdown</lui-button>
  <div slot="content">
    <p>Same width as trigger</p>
  </div>
</lui-popover>
```

```js
// Controlled mode (React)
const [open, setOpen] = useState(false);
// ...
<lui-popover open={open} onOpen-changed={(e) => setOpen(e.detail.open)}>
  <lui-button>Toggle</lui-button>
  <div slot="content">Controlled popover</div>
</lui-popover>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| placement | `Placement` | `"bottom"` | Preferred placement relative to trigger (Floating UI). Supports all 12 Floating UI positions. |
| open | `boolean` | `false` | Whether the popover is visible. Setting this enables controlled mode. |
| arrow | `boolean` | `false` | Whether to show an arrow indicator pointing at the trigger. |
| modal | `boolean` | `false` | Enable modal mode with focus trapping inside the popover (uses sentinel elements). |
| offset | `number` | `8` | Offset distance in pixels from the trigger. |
| match-trigger-width | `boolean` | `false` | Make the popover the same width as the trigger element. |
| disabled | `boolean` | `false` | Disable popover interaction. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | The trigger element (receives aria-haspopup and aria-expanded). |
| content | The popover body content (role="dialog"). |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `open-changed` | `{ open: boolean }` | Fired when open state changes (fired in controlled mode). |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-popover-bg` | `var(--color-card, var(--ui-color-card))` | Background color of the popover. |
| `--ui-popover-text` | `var(--color-card-foreground, var(--ui-color-card-foreground))` | Text color of the popover. |
| `--ui-popover-border` | `var(--color-border, var(--ui-color-border))` | Border color of the popover. |
| `--ui-popover-radius` | `0.5rem` | Border radius of the popover. |
| `--ui-popover-padding` | `1rem` | Inner padding of the popover content. |
| `--ui-popover-shadow` | `0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)` | Box shadow of the popover. |
| `--ui-popover-arrow-size` | `8px` | Size of the arrow indicator. |
| `--ui-popover-max-width` | `20rem` | Maximum width of the popover. |
| `--ui-popover-z-index` | `45` | Z-index of the popover panel. |

## CSS Parts

| Part | Description |
|------|-------------|
| `trigger` | The trigger wrapper (has aria-haspopup="dialog", aria-expanded). |
| `popover` | The popover panel container (role="dialog"). |
| `content` | The popover content area. |
| `arrow` | The arrow indicator pointing at the trigger. |

## Behavior Notes

- Trigger model: click or Enter/Space keydown on the default slot element toggles the popover. The trigger wrapper has `aria-haspopup="dialog"` and `aria-expanded` reflecting the open state. `aria-controls` links trigger to panel by ID.
- Light dismiss: uses native Popover API `popover="auto"` mode — clicking outside the popover closes it automatically. Falls back to a document click listener when the Popover API is not supported.
- Escape key: dismissed via the native Popover API `toggle` event (newState === 'closed') when supported. Falls back to a document `keydown` listener in older browsers.
- Floating UI positioning: `computePosition` with `flip`, `shift` (8px edge padding), and `offset` (default 8px) middleware. Strategy is `fixed`. `autoUpdatePosition` repositions on scroll and resize while open.
- Arrow element: a `--ui-popover-arrow-size` square (default 8px) rotated 45° using `background: var(--ui-popover-bg)` and `border: 1px solid var(--ui-popover-border)`. Enabled with the `arrow` boolean prop. Arrow position tracks placement flips via Floating UI arrow middleware.
- Focus management: on open, `moveFocusToContent()` moves focus to the first focusable element in the `content` slot (or the panel itself if none). On close, focus returns to the trigger element via `restoreFocusToTrigger()`.
- Modal mode (`modal` attribute): sentinel `<div tabindex="0">` elements at start and end of the panel implement a focus trap. Focus wraps from last to first (and vice versa) without leaving the popover. Non-modal mode instead closes the popover on `focusout` if focus moves outside the host.
- Controlled mode: setting the `open` prop programmatically enables controlled mode. In controlled mode, user interactions fire `open-changed` custom event (`detail: { open: boolean }`) instead of toggling internally. The consumer must update the `open` prop in response.
- Nested popovers: when a parent popover closes, it dispatches `popover-close-children` on itself (bubbles, composed). Child `<lui-popover>` elements listen for this event and close themselves. This ensures nested menus collapse properly.
- Match trigger width (`match-trigger-width` attribute): Floating UI `size` middleware sets the popover's inline width to match the trigger's bounding rect width. Useful for dropdown-style patterns where the menu should align to the input or button width.
- Dark mode: all 9 `--ui-popover-*` tokens cascade automatically via the semantic `.dark` system. `--ui-popover-bg` resolves to `--color-card` (dark: gray-900), `--ui-popover-text` resolves to `--color-card-foreground` (dark: gray-50), `--ui-popover-border` resolves to `--color-border` (dark: gray-800). No explicit `.dark` overrides are needed.
- SSR safety: `isServer` guard prevents the popover panel from rendering on the server. Panel DOM is only created while `open=true`; it is removed from the DOM when closed. The Popover API `showPopover()` call is also guarded by `isServer`.
- Cleanup: `AbortController.abort()` in `disconnectedCallback` cleans up all event listeners. `autoUpdatePosition` cleanup runs on close and on disconnect. No listener or rAF leaks.
