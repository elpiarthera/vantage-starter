/**
 * lui-toast - An individual toast notification element
 *
 * Features:
 * - Auto-dismiss timer with pause on hover/focus (TOAST-02, TOAST-14)
 * - Swipe-to-dismiss via Pointer Events with velocity threshold (TOAST-13)
 * - Close button for manual dismiss (TOAST-06)
 * - Action button with callback (TOAST-11)
 * - Accessible: role=status/alert based on variant (TOAST-08)
 * - Title + description text support (TOAST-10)
 * - Custom content via slot (TOAST-15)
 * - CSS custom properties for theming (TOAST-16)
 * - Reduced motion support (TOAST-09)
 * - AbortController cleanup (TOAST lifecycle)
 *
 * @slot - Default slot for custom content
 * @fires toast-close - When toast should be removed (detail: { id, reason })
 */

import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';
import { toastIcons } from './icons.js';
import type { ToastAction, ToastVariant, ToastPosition } from './types.js';

export class Toast extends TailwindElement {
  // ---------------------------------------------------------------------------
  // Public properties
  // ---------------------------------------------------------------------------

  @property({ type: String, attribute: 'toast-id' })
  toastId = '';

  @property({ type: String, reflect: true })
  variant: ToastVariant = 'default';

  @property({ type: String, attribute: 'toast-title' })
  toastTitle?: string;

  @property({ type: String })
  description?: string;

  @property({ type: Number })
  duration = 5000;

  @property({ type: Boolean })
  dismissible = true;

  /** Set via property only (not attribute) */
  @property({ attribute: false })
  action?: ToastAction;

  @property({ type: String })
  position: ToastPosition = 'bottom-right';

  /** Callback when auto-close fires */
  @property({ attribute: false })
  onAutoClose?: () => void;

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  private _remaining = 0;
  private _startTime = 0;
  private _timerId: ReturnType<typeof setTimeout> | null = null;
  private _paused = false;
  private _swiping = false;
  private _swipeX = 0;
  private _swipeStartX = 0;
  private _swipeStartTime = 0;
  private _abortController?: AbortController;

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: var(--ui-toast-padding);
        background: var(--ui-toast-bg);
        color: var(--ui-toast-text);
        border: 1px solid var(--ui-toast-border);
        border-radius: var(--ui-toast-radius);
        box-shadow: var(--ui-toast-shadow);
        max-width: var(--ui-toast-max-width);
        width: 100%;
        position: relative;
        touch-action: pan-y;
        cursor: default;
        user-select: none;
        box-sizing: border-box;
        pointer-events: auto;
      }

      /* Variant backgrounds and borders */
      :host([variant="success"]) {
        background: var(--ui-toast-success-bg);
        border-color: var(--ui-toast-success-border);
      }
      :host([variant="error"]) {
        background: var(--ui-toast-error-bg);
        border-color: var(--ui-toast-error-border);
      }
      :host([variant="warning"]) {
        background: var(--ui-toast-warning-bg);
        border-color: var(--ui-toast-warning-border);
      }
      :host([variant="info"]) {
        background: var(--ui-toast-info-bg);
        border-color: var(--ui-toast-info-border);
      }

      /* Variant icon colors */
      :host([variant="success"]) .toast-icon-wrapper { color: var(--ui-toast-success-icon); }
      :host([variant="error"]) .toast-icon-wrapper { color: var(--ui-toast-error-icon); }
      :host([variant="warning"]) .toast-icon-wrapper { color: var(--ui-toast-warning-icon); }
      :host([variant="info"]) .toast-icon-wrapper { color: var(--ui-toast-info-icon); }
      :host([variant="loading"]) .toast-icon-wrapper { color: var(--ui-toast-info-icon); }

      .toast-icon-wrapper {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        padding-top: 0.125rem;
      }

      .toast-icon-loading {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .toast-content {
        flex: 1;
        min-width: 0;
      }

      .toast-title {
        font-weight: 600;
        line-height: 1.4;
      }

      .toast-description {
        margin-top: 0.25rem;
        font-size: 0.875rem;
        opacity: 0.9;
        line-height: 1.4;
      }

      .toast-action {
        appearance: none;
        background: none;
        border: none;
        color: inherit;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: underline;
        text-underline-offset: 2px;
        cursor: pointer;
        padding: 0;
        margin-top: 0.5rem;
      }

      .toast-action:hover {
        opacity: 0.8;
      }

      .toast-close {
        appearance: none;
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 0.25rem;
        margin: -0.25rem -0.25rem -0.25rem 0;
        flex-shrink: 0;
        opacity: 0.5;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.25rem;
        transition: opacity 150ms;
      }

      .toast-close:hover {
        opacity: 1;
      }

      @media (prefers-reduced-motion: reduce) {
        .toast-icon-loading {
          animation: none;
        }
      }
    `,
  ];

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  override connectedCallback(): void {
    super.connectedCallback();
    this._abortController = new AbortController();
    const signal = this._abortController.signal;

    // Start auto-dismiss timer
    this._remaining = this.duration;
    if (this.duration > 0) {
      this._startTimer();
    }

    // Pointer events for swipe-to-dismiss
    this.addEventListener('pointerdown', this._handlePointerDown, { signal });
    this.addEventListener('pointermove', this._handlePointerMove, { signal });
    this.addEventListener('pointerup', this._handlePointerUp, { signal });
    this.addEventListener('pointercancel', this._handlePointerUp, { signal });

    // Pause on hover
    this.addEventListener('pointerenter', this._handlePointerEnter, { signal });
    this.addEventListener('pointerleave', this._handlePointerLeave, { signal });

    // Pause on focus
    this.addEventListener('focusin', this._handleFocusIn, { signal });
    this.addEventListener('focusout', this._handleFocusOut, { signal });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._abortController?.abort();
    this._clearTimer();
  }

  // ---------------------------------------------------------------------------
  // Timer management
  // ---------------------------------------------------------------------------

  private _startTimer(): void {
    this._startTime = Date.now();
    this._timerId = setTimeout(() => this._handleAutoClose(), this._remaining);
  }

  private _pauseTimer(): void {
    if (this._timerId === null) return;
    clearTimeout(this._timerId);
    this._timerId = null;
    this._remaining -= (Date.now() - this._startTime);
    if (this._remaining < 0) this._remaining = 0;
    this._paused = true;
  }

  private _resumeTimer(): void {
    if (!this._paused || this._remaining <= 0 || this.duration === 0) return;
    this._paused = false;
    this._startTimer();
  }

  private _clearTimer(): void {
    if (this._timerId !== null) {
      clearTimeout(this._timerId);
      this._timerId = null;
    }
  }

  private _handleAutoClose(): void {
    this.onAutoClose?.();
    this.dispatchEvent(new CustomEvent('toast-close', {
      bubbles: true,
      composed: true,
      detail: { id: this.toastId, reason: 'auto' },
    }));
  }

  // ---------------------------------------------------------------------------
  // Swipe-to-dismiss (TOAST-13)
  // ---------------------------------------------------------------------------

  private _handlePointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return; // only primary button
    this._swipeStartX = e.clientX;
    this._swipeStartTime = Date.now();
    this._swipeX = 0;
    this._swiping = true;
    this.setPointerCapture(e.pointerId);
    this._pauseTimer();
  };

  private _handlePointerMove = (e: PointerEvent): void => {
    if (!this._swiping) return;
    this._swipeX = e.clientX - this._swipeStartX;
    this.style.transform = `translateX(${this._swipeX}px)`;
    this.style.opacity = String(1 - Math.abs(this._swipeX) / 200);
  };

  private _handlePointerUp = (e: PointerEvent): void => {
    if (!this._swiping) return;
    this._swiping = false;
    this.releasePointerCapture(e.pointerId);

    const distance = Math.abs(this._swipeX);
    const elapsed = Date.now() - this._swipeStartTime;
    const velocity = elapsed > 0 ? distance / elapsed : 0; // px/ms

    if (distance > 80 || velocity > 0.11) {
      // Dismiss via swipe
      this.dispatchEvent(new CustomEvent('toast-close', {
        bubbles: true,
        composed: true,
        detail: { id: this.toastId, reason: 'swipe' },
      }));
    } else {
      // Snap back
      this.style.transition = 'transform 200ms ease-out, opacity 200ms ease-out';
      this.style.transform = '';
      this.style.opacity = '';
      // Remove transition after snap back completes
      const cleanup = () => {
        this.style.transition = '';
        this.removeEventListener('transitionend', cleanup);
      };
      this.addEventListener('transitionend', cleanup, { once: true });
      this._resumeTimer();
    }
  };

  // ---------------------------------------------------------------------------
  // Hover/focus pause (TOAST-14)
  // ---------------------------------------------------------------------------

  private _handlePointerEnter = (): void => {
    if (!this._swiping) {
      this._pauseTimer();
    }
  };

  private _handlePointerLeave = (): void => {
    if (!this._swiping) {
      this._resumeTimer();
    }
  };

  private _handleFocusIn = (): void => {
    this._pauseTimer();
  };

  private _handleFocusOut = (): void => {
    if (!this._swiping) {
      this._resumeTimer();
    }
  };

  // ---------------------------------------------------------------------------
  // Close / Action handlers
  // ---------------------------------------------------------------------------

  private _handleClose(): void {
    this.dispatchEvent(new CustomEvent('toast-close', {
      bubbles: true,
      composed: true,
      detail: { id: this.toastId, reason: 'dismiss' },
    }));
  }

  private _handleAction(): void {
    this.action?.onClick();
    this.dispatchEvent(new CustomEvent('toast-close', {
      bubbles: true,
      composed: true,
      detail: { id: this.toastId, reason: 'action' },
    }));
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  override render() {
    // Accessibility: error gets role="alert" (implies assertive), others get role="status" + polite
    const isError = this.variant === 'error';
    const icon = toastIcons[this.variant];

    return html`
      <div
        class="toast-inner"
        role=${isError ? 'alert' : 'status'}
        aria-live=${isError ? nothing : 'polite'}
        aria-atomic="true"
        style="display:contents"
      >
        ${icon !== nothing
          ? html`<div class="toast-icon-wrapper">${icon}</div>`
          : nothing}

        <div class="toast-content">
          ${this.toastTitle
            ? html`<div class="toast-title">${this.toastTitle}</div>`
            : nothing}
          ${this.description
            ? html`<div class="toast-description">${this.description}</div>`
            : nothing}
          <slot></slot>
          ${this.action
            ? html`<button class="toast-action" @click=${this._handleAction}>${this.action.label}</button>`
            : nothing}
        </div>

        ${this.dismissible
          ? html`
            <button class="toast-close" @click=${this._handleClose} aria-label="Close notification">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                aria-hidden="true">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
            </button>
          `
          : nothing}
      </div>
    `;
  }
}
