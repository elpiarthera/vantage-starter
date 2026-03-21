/**
 * lui-toaster - Container element for toast notifications
 *
 * Features:
 * - Subscribes to singleton toastState for reactive rendering
 * - Queue management with configurable maxVisible (TOAST-07)
 * - 6 position options via CSS positioning (TOAST-05)
 * - Top-layer rendering via popover="manual" (TOAST-17)
 * - Pre-registered accessible live regions (TOAST-08)
 * - Enter/exit animations with @starting-style (TOAST-09)
 * - SSR safe with isServer guard (TOAST-18)
 */

import { html, css, nothing } from 'lit';
import { isServer } from 'lit';
import { property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';
import { toastState } from './state.js';
import type { ToastData, ToastPosition } from './types.js';

export class Toaster extends TailwindElement {
  // ---------------------------------------------------------------------------
  // Public properties
  // ---------------------------------------------------------------------------

  @property({ type: String, reflect: true })
  position: ToastPosition = 'bottom-right';

  @property({ type: Number, attribute: 'max-visible' })
  maxVisible = 3;

  @property({ type: Number })
  gap = 12;

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  @state()
  private _toasts: ToastData[] = [];

  private _unsubscribe: (() => void) | null = null;
  private _exitingIds = new Set<string>();
  private _popoverEl: HTMLElement | null = null;

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  private get _visibleToasts(): ToastData[] {
    return this._toasts.slice(0, this.maxVisible);
  }

  private get _isTopPosition(): boolean {
    return this.position.startsWith('top');
  }

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: contents;
      }

      .toaster-wrapper {
        /* Override UA popover styles */
        margin: 0;
        border: none;
        padding: 0;
        background: transparent;
        overflow: visible;
        /* Layout */
        position: fixed;
        z-index: var(--ui-toast-z-index);
        display: flex;
        flex-direction: column;
        gap: var(--ui-toast-gap);
        pointer-events: none;
        max-height: 100vh;
        width: var(--ui-toast-max-width);
      }

      /* Bottom positions: newest at bottom (column-reverse stacks upward) */
      :host([position="bottom-right"]) .toaster-wrapper,
      :host([position="bottom-left"]) .toaster-wrapper,
      :host([position="bottom-center"]) .toaster-wrapper {
        flex-direction: column-reverse;
      }

      /* Position mapping */
      :host([position="bottom-right"]) .toaster-wrapper { bottom: 1rem; right: 1rem; }
      :host([position="bottom-left"]) .toaster-wrapper { bottom: 1rem; left: 1rem; }
      :host([position="bottom-center"]) .toaster-wrapper { bottom: 1rem; left: 50%; transform: translateX(-50%); }
      :host([position="top-right"]) .toaster-wrapper { top: 1rem; right: 1rem; }
      :host([position="top-left"]) .toaster-wrapper { top: 1rem; left: 1rem; }
      :host([position="top-center"]) .toaster-wrapper { top: 1rem; left: 50%; transform: translateX(-50%); }

      /* Toast entry/exit animations */
      lui-toast {
        opacity: 0;
        transition:
          opacity 200ms ease-out,
          transform 200ms ease-out;
      }

      lui-toast[data-open] {
        opacity: 1;
        transform: translateY(0);
      }

      @starting-style {
        lui-toast[data-open] {
          opacity: 0;
        }
      }

      /* Exiting state */
      lui-toast[data-exiting] {
        opacity: 0;
        transition:
          opacity 150ms ease-in,
          transform 150ms ease-in;
      }

      @media (prefers-reduced-motion: reduce) {
        lui-toast,
        lui-toast[data-open],
        lui-toast[data-exiting] {
          transition: none;
        }
      }

      /* Screen reader only */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
    `,
  ];

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  override connectedCallback(): void {
    super.connectedCallback();
    if (isServer) return;

    this._unsubscribe = toastState.subscribe(() => {
      this._toasts = [...toastState.toasts];
      // Show popover if we have toasts
      if (this._toasts.length > 0) {
        this.updateComplete.then(() => this._showPopover());
      }
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubscribe?.();
    this._unsubscribe = null;
  }

  // ---------------------------------------------------------------------------
  // Popover management (TOAST-17)
  // ---------------------------------------------------------------------------

  private _showPopover(): void {
    if (!this._popoverEl) {
      this._popoverEl = this.renderRoot.querySelector<HTMLElement>('.toaster-wrapper');
    }
    if (this._popoverEl && !this._popoverEl.matches(':popover-open')) {
      try {
        this._popoverEl.showPopover();
      } catch {
        // Already showing or not supported
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  private _handleToastClose(e: CustomEvent<{ id: string; reason: string }>): void {
    const { id } = e.detail;
    toastState.dismiss(id);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  override render() {
    const visible = this._visibleToasts;

    return html`
      <!-- Pre-registered live regions for accessibility (TOAST-08) -->
      <div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
        ${visible
          .filter(t => t.variant !== 'error')
          .map(t => html`<div>${t.title ?? ''}${t.description ? ` ${t.description}` : ''}</div>`)}
      </div>
      <div role="alert" aria-atomic="true" class="sr-only">
        ${visible
          .filter(t => t.variant === 'error')
          .map(t => html`<div>${t.title ?? ''}${t.description ? ` ${t.description}` : ''}</div>`)}
      </div>

      <div
        class="toaster-wrapper"
        popover="manual"
        part="container"
      >
        ${repeat(
          visible,
          (t) => t.id,
          (t) => html`
            <lui-toast
              toast-id=${t.id}
              variant=${t.variant}
              toast-title=${t.title ?? ''}
              description=${t.description ?? ''}
              .duration=${t.duration}
              .dismissible=${t.dismissible}
              .action=${t.action}
              .position=${this.position}
              .onAutoClose=${t.onAutoClose}
              data-open
              @toast-close=${this._handleToastClose}
            >
            </lui-toast>
          `,
        )}
      </div>
    `;
  }
}
