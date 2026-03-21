---
name: lit-ui-dialog
description: >-
  How to use <lui-dialog> — props, slots, events, CSS tokens, examples.
---

# Dialog

## Usage

```html
<!-- HTML: controlled via ID reference -->
<lui-button onclick="document.getElementById('my-dialog').open = true">Open Dialog</lui-button>

<lui-dialog id="my-dialog" show-close-button>
  <span slot="title">Dialog Title</span>
  <p>This is the dialog content.</p>
</lui-dialog>
```

```html
<!-- Confirm dialog with footer actions -->
<lui-dialog id="confirm-dialog">
  <span slot="title">Confirm Action</span>
  <p>Are you sure you want to proceed? This action cannot be undone.</p>
  <div slot="footer">
    <lui-button variant="outline" onclick="this.closest('lui-dialog').open = false">Cancel</lui-button>
    <lui-button variant="destructive" onclick="handleConfirm()">Confirm</lui-button>
  </div>
</lui-dialog>
```

```js
// React: controlled with state
const [open, setOpen] = useState(false);
// ...
<lui-button onClick={() => setOpen(true)}>Open Dialog</lui-button>
<lui-dialog open={open} show-close-button onClose={() => setOpen(false)}>
  <span slot="title">Dialog Title</span>
  <p>This is the dialog content.</p>
</lui-dialog>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| open | `boolean` | `false` | Whether the dialog is visible. Uses showModal() for focus trapping. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | The max-width of the dialog (24rem, 28rem, or 32rem). |
| dismissible | `boolean` | `true` | Whether the dialog can be closed via Escape or backdrop click. |
| show-close-button | `boolean` | `false` | Shows an X button in the top-right corner. |
| dialog-class | `string` | `""` | Additional Tailwind classes to customize the dialog content container. |

## Slots

| Slot | Description |
|------|-------------|
| title | Dialog title/header content. |
| (default) | Dialog body content. |
| footer | Dialog footer, typically action buttons. |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `close` | `{ reason: "escape" \| "backdrop" \| "programmatic" }` | Fired when the dialog closes. Detail includes the close reason. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-dialog-radius` | `0.5rem` | Border radius of the dialog content panel. |
| `--ui-dialog-shadow` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | Box shadow of the dialog content panel. |
| `--ui-dialog-padding` | `1.5rem` | Inner padding of the dialog content panel. |
| `--ui-dialog-max-width-sm` | `24rem` | Max-width for size="sm". |
| `--ui-dialog-max-width-md` | `28rem` | Max-width for size="md". |
| `--ui-dialog-max-width-lg` | `32rem` | Max-width for size="lg". |
| `--ui-dialog-bg` | `var(--color-card, var(--ui-color-card))` | Background color of the dialog content panel. |
| `--ui-dialog-backdrop` | `rgba(0, 0, 0, 0.5)` | Color of the backdrop overlay. |
| `--ui-dialog-title-size` | `1.125rem` | Font size of the dialog title. |
| `--ui-dialog-title-weight` | `600` | Font weight of the dialog title. |
| `--ui-dialog-body-color` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Text color of the dialog body. |
| `--ui-dialog-footer-gap` | `0.75rem` | Gap between buttons in the footer. |

## CSS Parts

| Part | Description |
|------|-------------|
| `dialog` | The native dialog element. |
| `content` | The content container with background and padding. |
| `close-button` | The optional close button in the top-right corner. |
| `header` | The header/title section. |
| `body` | The main body content area. |
| `footer` | The footer section for action buttons. |

## Behavior Notes

- **Focus trapping**: Uses native `showModal()` — the browser automatically traps focus inside the dialog and places it in the top layer. No custom focus trap needed.
- **Close reasons**: The `close` event fires with `{ reason: 'escape' | 'backdrop' | 'programmatic' }` so consumers can distinguish how the dialog was dismissed.
- **dismissible=false**: When set, Escape key and backdrop clicks are blocked. Only `dialog.close()` or setting `open=false` will close the dialog.
- **Focus restoration**: `show()` captures the active element and restores focus to it after the dialog closes. Call `show()` instead of setting `open=true` directly when focus restoration matters.
- **dialog-class**: Passes Tailwind classes to the inner `.dialog-content` div (the visible panel), not the outer `<dialog>` element. Use this for per-instance width overrides like `dialog-class="max-w-2xl"`.
- **Nested dialogs**: Supported natively via the browser's top-layer stack. Use `@close=${(e) => e.stopPropagation()}` on the inner dialog to prevent its close event from bubbling to the parent.
- **Animations**: Enter/exit uses `@starting-style` + `transition-behavior: allow-discrete` — modern CSS with no JavaScript required. Reduced motion is respected (`prefers-reduced-motion: reduce` sets `transition: none`).
