---
name: lit-ui-toast
description: >-
  How to use the toast() imperative API and <lui-toaster> — API methods, CSS tokens, examples.
---

# Toast

Toast uses an **imperative API** — import and call `toast()` functions directly. No declarative element needed for the toast itself.

## Usage

```js
import { toast } from '@lit-ui/toast';

// Basic
toast('File saved successfully');
toast.success('Profile updated!');
toast.error('Something went wrong');
toast.warning('Low disk space');
toast.info('3 items selected');

// With options
toast.success('Email sent', {
  description: 'Your message was delivered.',
  duration: 5000,
  dismissible: true,
  action: { label: 'Undo', onClick: () => undoSend() },
});

// Promise toast
toast.promise(fetchData(), {
  loading: 'Loading data...',
  success: 'Data loaded!',
  error: 'Failed to load data',
});

// Dismiss
const id = toast('Uploading...');
toast.dismiss(id);
toast.dismissAll();
```

## `lui-toaster` element

The toaster element is **auto-created** if not present. Optionally add it manually for configuration:

```html
<lui-toaster position="top-center" max-visible="5"></lui-toaster>
```

## `toast()` API

| Function | Description |
|----------|-------------|
| `toast(message, opts?)` | Show a default toast. |
| `toast.success(message, opts?)` | Show a success toast. |
| `toast.error(message, opts?)` | Show an error toast. |
| `toast.warning(message, opts?)` | Show a warning toast. |
| `toast.info(message, opts?)` | Show an info toast. |
| `toast.promise(promise, messages, opts?)` | Show a loading toast that transitions to success/error. |
| `toast.dismiss(id)` | Dismiss a specific toast by ID. |
| `toast.dismissAll()` | Dismiss all toasts. |

## `ToastOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| description | `string` | — | Additional descriptive text below the main message. |
| duration | `number` | `5000` | Auto-dismiss delay in milliseconds. |
| dismissible | `boolean` | `true` | Whether the user can manually dismiss the toast. |
| action | `{ label: string, onClick: () => void }` | — | Action button in the toast. |
| position | (position override) | — | Override position for this individual toast. |

## `lui-toaster` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| position | `"top-left" \| "top-center" \| "top-right" \| "bottom-left" \| "bottom-center" \| "bottom-right"` | `"bottom-right"` | Position of the toast stack on screen. |
| max-visible | `number` | `3` | Maximum number of toasts visible simultaneously. |
| gap | `number` | `12` | Gap in pixels between stacked toasts. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-toast-bg` | `var(--color-card, var(--ui-color-card))` | Base toast background color. |
| `--ui-toast-text` | `var(--color-card-foreground, var(--ui-color-card-foreground))` | Toast text color. |
| `--ui-toast-border` | `var(--color-border, var(--ui-color-border))` | Toast border color. |
| `--ui-toast-radius` | `0.5rem` | Toast border radius. |
| `--ui-toast-padding` | `1rem` | Inner padding of the toast. |
| `--ui-toast-shadow` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | Toast box shadow. |
| `--ui-toast-max-width` | `24rem` | Maximum width of a toast. |
| `--ui-toast-gap` | `0.75rem` | Gap between stacked toasts. |
| `--ui-toast-z-index` | `55` | Z-index of the toaster container. |
| `--ui-toast-success-bg` | `oklch(0.95 0.05 150)` | Success variant background. |
| `--ui-toast-success-border` | `oklch(0.70 0.15 150)` | Success variant border. |
| `--ui-toast-success-icon` | `oklch(0.55 0.20 150)` | Success icon color. |
| `--ui-toast-error-bg` | `oklch(0.95 0.05 25)` | Error variant background. |
| `--ui-toast-error-border` | `oklch(0.70 0.15 25)` | Error variant border. |
| `--ui-toast-error-icon` | `oklch(0.55 0.20 25)` | Error icon color. |
| `--ui-toast-warning-bg` | `oklch(0.95 0.05 85)` | Warning variant background. |
| `--ui-toast-warning-border` | `oklch(0.70 0.15 85)` | Warning variant border. |
| `--ui-toast-warning-icon` | `oklch(0.55 0.20 85)` | Warning icon color. |
| `--ui-toast-info-bg` | `oklch(0.95 0.05 250)` | Info variant background. |
| `--ui-toast-info-border` | `oklch(0.70 0.15 250)` | Info variant border. |
| `--ui-toast-info-icon` | `oklch(0.55 0.20 250)` | Info icon color. |

## CSS Parts — `lui-toaster`

| Part | Description |
|------|-------------|
| `container` | The toaster container element. |

## Accessibility

- Success and info toasts use `role="status"` + `aria-live="polite"`.
- Error toasts use `role="alert"` + `aria-live="assertive"`.
- Timer pauses on hover/focus.
- Respects `prefers-reduced-motion`.
- Close button has `aria-label="Close notification"`.

## Behavior Notes

- Imperative API only: toast is triggered via imported functions (`toast()`, `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`), not by placing a `<lui-toast>` element. No declarative element usage — only `<lui-toaster>` for configuration.
- Auto-toaster creation: calling `toast()` when no `<lui-toaster>` exists in the document auto-creates one and appends it to `document.body`. Add `<lui-toaster>` explicitly in the root layout to configure position, max-visible, or gap.
- Auto-dismiss timer: starts at `connectedCallback` with default 5000ms. Set `duration: 0` for a persistent toast that does not auto-dismiss. Timer is tracked with remaining time so pause/resume is accurate.
- Hover/focus pause: `pointerenter` pauses the auto-dismiss timer; `pointerleave` resumes it. `focusin` pauses; `focusout` resumes. Timer resumes from the remaining duration (not restarted from full).
- Swipe-to-dismiss: Pointer Events with `setPointerCapture` track horizontal swipe on touch/pointer devices. Dismisses if swipe distance exceeds 80px OR velocity exceeds 0.11 px/ms. Below threshold, the toast snaps back with a 200ms ease-out transition.
- Accessibility roles: error variant uses `role="alert"` + `aria-live="assertive"` (announces immediately). All other variants (default, success, warning, info, loading) use `role="status"` + `aria-live="polite"` (non-interrupting announcement).
- Close button: rendered when `dismissible: true` (default). Has `aria-label="Close notification"`. Fires `toast-close` custom event with `detail: { id, reason: 'dismiss' }`.
- Action button: optional `action: { label: string, onClick: () => void }` option. Renders as a styled underlined button inside the toast. Click fires the `onClick` callback then fires `toast-close` with `reason: 'action'`. The toast is dismissed after the action.
- Promise toast: `toast.promise(promise, { loading, success, error })` shows a loading spinner toast while the promise is pending. On resolution, updates the toast title to the success or error message. On rejection, updates to the error message. The loading spinner uses an `animation: spin` keyframe respecting `prefers-reduced-motion`.
- Queue management: `<lui-toaster>` renders up to `max-visible` (default 3) toasts at once. Additional toasts queue in state and appear as existing toasts dismiss. The toaster subscribes to the singleton `toastState` via a reactive subscription.
- Top-layer rendering: `<lui-toaster>` uses `popover="manual"` so it renders in the browser's top layer, above all stacking contexts. Z-index is still configurable via `--ui-toast-z-index` (default 55) for environments where popover is not supported.
- Dark mode: base tokens (`--ui-toast-bg`, `--ui-toast-text`, `--ui-toast-border`) cascade automatically via `.dark` semantic tokens (--color-card, --color-card-foreground, --color-border). Variant tokens have explicit `.dark` overrides using lower-lightness oklch values (0.25 lightness vs 0.95 in light mode) — these cannot cascade via semantic tokens.
- Cleanup: `AbortController.abort()` in `disconnectedCallback` removes all Pointer Event, hover, and focus listeners attached in `connectedCallback`. No manual `removeEventListener` calls needed.
