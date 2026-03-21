/**
 * lui-popover - An accessible popover component
 *
 * Features:
 * - Click-to-toggle trigger interaction (POP-01)
 * - Escape key dismissal (POP-02)
 * - Light dismiss via Popover API auto mode (POP-03)
 * - Floating UI positioning with 12 placements and collision avoidance (POP-04)
 * - Optional arrow indicator tracking placement flips (POP-05)
 * - Focus management: moves into popover on open, restores on close (POP-06)
 * - Modal mode with focus trapping (POP-07)
 * - Controlled and uncontrolled modes (POP-08)
 * - Nested popover support (POP-09)
 * - ARIA attributes: aria-expanded, aria-haspopup, role=dialog (POP-10)
 * - Native Popover API with position:fixed fallback (POP-11)
 * - Trigger width matching via size middleware (POP-12)
 * - Auto-update positioning on scroll/resize (POP-13)
 * - Reduced motion support (POP-14)
 * - SSR safe rendering (POP-15)
 * - AbortController cleanup on disconnect (POP-16)
 * - CSS custom properties for theming (POP-17)
 */

import { html, css, nothing, type PropertyValues } from 'lit';
import { isServer } from 'lit';
import { property, state } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';
import {
  computePosition,
  autoUpdatePosition,
  flip,
  shift,
  offset,
  arrow,
  size,
  type Placement,
} from '@lit-ui/core/floating';

export type { Placement };

/** Whether the native Popover API is supported */
const supportsPopoverApi =
  !isServer && typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;

/** Counter for generating unique IDs */
let idCounter = 0;

export class Popover extends TailwindElement {
  // --- Public properties ---

  @property({ type: String })
  placement: Placement = 'bottom';

  @property({ type: Boolean, reflect: true })
  get open(): boolean {
    return this._internalOpen;
  }
  set open(value: boolean) {
    const old = this._internalOpen;
    this._controlled = true;
    this._internalOpen = value;
    this.requestUpdate('open', old);
  }

  @property({ type: Boolean })
  arrow = false;

  @property({ type: Boolean })
  modal = false;

  @property({ type: Number })
  offset = 8;

  @property({ type: Boolean, attribute: 'match-trigger-width' })
  matchTriggerWidth = false;

  @property({ type: Boolean })
  disabled = false;

  // --- Internal state ---

  @state()
  private _internalOpen = false;

  @state()
  private _currentPlacement: Placement = 'bottom';

  private _controlled = false;
  private _uniqueId = `lui-popover-${++idCounter}`;
  private _panelId = `${this._uniqueId}-panel`;
  private triggerEl: HTMLElement | null = null;
  private cleanupAutoUpdate?: () => void;
  private abortController?: AbortController;

  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: inline-block;
        position: relative;
      }

      .popover-panel {
        position: fixed;
        z-index: var(--ui-popover-z-index);
        pointer-events: auto;
        max-width: var(--ui-popover-max-width);
        width: max-content;
        opacity: 0;
        transform: scale(0.95);
        transition:
          opacity 150ms ease-out,
          transform 150ms ease-out,
          display 150ms allow-discrete,
          overlay 150ms allow-discrete;
      }

      /* Override UA popover styles so Floating UI coordinates work */
      .popover-panel[popover] {
        margin: 0;
        position: fixed;
        border: none;
        padding: 0;
        overflow: visible;
        background: transparent;
        color: inherit;
      }

      .popover-panel[data-open] {
        opacity: 1;
        transform: scale(1);
      }

      .popover-panel:popover-open {
        opacity: 1;
        transform: scale(1);
      }

      @starting-style {
        .popover-panel[data-open] {
          opacity: 0;
          transform: scale(0.95);
        }
        .popover-panel:popover-open {
          opacity: 0;
          transform: scale(0.95);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .popover-panel {
          transition: none;
        }
      }

      .popover-content {
        background: var(--ui-popover-bg);
        color: var(--ui-popover-text);
        border: 1px solid var(--ui-popover-border);
        border-radius: var(--ui-popover-radius);
        padding: var(--ui-popover-padding);
        box-shadow: var(--ui-popover-shadow);
      }

      .popover-arrow {
        position: absolute;
        width: var(--ui-popover-arrow-size);
        height: var(--ui-popover-arrow-size);
        background: var(--ui-popover-bg);
        border: 1px solid var(--ui-popover-border);
        transform: rotate(45deg);
        z-index: -1;
      }

      .focus-sentinel {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `,
  ];

  override connectedCallback(): void {
    super.connectedCallback();
    if (isServer) return;

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Listen for parent popover close events (POP-09)
    this.addEventListener(
      'popover-close-children',
      this.handleParentClose as EventListener,
      { signal }
    );

    // Fallback: document click for light dismiss when Popover API unavailable
    if (!supportsPopoverApi) {
      document.addEventListener('click', this.handleDocumentClick, { signal });
      document.addEventListener('keydown', this.handleDocumentKeydown, { signal });
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.abortController?.abort();
    this.cleanupAutoUpdate?.();
    this.cleanupAutoUpdate = undefined;

    if (this._internalOpen) {
      this._internalOpen = false;
    }
  }

  override render() {
    return html`
      <div
        class="popover-trigger"
        part="trigger"
        aria-haspopup="dialog"
        aria-expanded="${this._internalOpen}"
        aria-controls="${this._panelId}"
      >
        <slot
          @slotchange=${this.handleSlotChange}
          @click=${this.handleTriggerClick}
          @keydown=${this.handleTriggerKeydown}
        ></slot>
      </div>
      ${this._internalOpen && !isServer
        ? html`
            <div
              id="${this._panelId}"
              role="dialog"
              part="popover"
              class="popover-panel"
              data-open
              ${supportsPopoverApi ? html`` : nothing}
              aria-modal="${this.modal ? 'true' : 'false'}"
              @toggle=${this.handlePopoverToggle}
            >
              ${this.modal
                ? html`<div
                    class="focus-sentinel"
                    tabindex="0"
                    @focus=${this.handleSentinelStartFocus}
                  ></div>`
                : nothing}
              <div class="popover-content" part="content">
                <slot name="content"></slot>
              </div>
              ${this.arrow
                ? html`<div class="popover-arrow" part="arrow"></div>`
                : nothing}
              ${this.modal
                ? html`<div
                    class="focus-sentinel"
                    tabindex="0"
                    @focus=${this.handleSentinelEndFocus}
                  ></div>`
                : nothing}
            </div>
          `
        : nothing}
    `;
  }

  override async updated(changedProps: PropertyValues): Promise<void> {
    super.updated(changedProps);

    if (changedProps.has('_internalOpen') || changedProps.has('open')) {
      if (this._internalOpen) {
        await this.updateComplete;
        this.setupPanel();
        this.updatePosition();
        this.startAutoUpdate();
        this.moveFocusToContent();
      } else {
        this.cleanupAutoUpdate?.();
        this.cleanupAutoUpdate = undefined;
        this.restoreFocusToTrigger();
      }
    }
  }

  // --- Event handlers ---

  private handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements({ flatten: true });
    const trigger = assigned[0] as HTMLElement | undefined;
    if (trigger) {
      this.triggerEl = trigger;
    }
  }

  private handleTriggerClick = (e: MouseEvent): void => {
    if (this.disabled) return;
    // Prevent click from immediately triggering the document click handler
    e.stopPropagation();
    this.toggle();
  };

  private handleTriggerKeydown = (e: KeyboardEvent): void => {
    if (this.disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.toggle();
    }
  };

  private handlePopoverToggle = (e: Event): void => {
    // Native Popover API toggle event (handles Escape and light dismiss)
    const toggleEvent = e as ToggleEvent;
    if (toggleEvent.newState === 'closed') {
      this.handleClose();
    }
  };

  private handleDocumentClick = (e: MouseEvent): void => {
    // Fallback light dismiss for non-Popover API browsers
    if (!this._internalOpen) return;
    if (e.composedPath().includes(this)) return;
    this.handleClose();
  };

  private handleDocumentKeydown = (e: KeyboardEvent): void => {
    // Fallback Escape handling for non-Popover API browsers
    if (e.key === 'Escape' && this._internalOpen) {
      e.preventDefault();
      this.handleClose();
    }
  };

  private handleParentClose = (): void => {
    // Close this popover when a parent popover closes (POP-09)
    if (this._internalOpen) {
      this.handleClose();
    }
  };

  private handleSentinelStartFocus = (): void => {
    // Focus trap: wrap to last focusable element
    const focusable = this.getFocusableElements();
    if (focusable.length > 0) {
      focusable[focusable.length - 1]!.focus();
    }
  };

  private handleSentinelEndFocus = (): void => {
    // Focus trap: wrap to first focusable element
    const focusable = this.getFocusableElements();
    if (focusable.length > 0) {
      focusable[0]!.focus();
    }
  };

  // --- Core behavior ---

  private toggle(): void {
    if (this._internalOpen) {
      this.handleClose();
    } else {
      this.handleOpen();
    }
  }

  private handleOpen(): void {
    if (this._controlled) {
      this.dispatchEvent(
        new CustomEvent('open-changed', {
          detail: { open: true },
          bubbles: true,
          composed: true,
        })
      );
      return;
    }
    this._internalOpen = true;
  }

  private handleClose(): void {
    // Dispatch close event to nested child popovers (POP-09)
    this.dispatchEvent(
      new CustomEvent('popover-close-children', {
        bubbles: true,
        composed: true,
      })
    );

    if (this._controlled) {
      this.dispatchEvent(
        new CustomEvent('open-changed', {
          detail: { open: false },
          bubbles: true,
          composed: true,
        })
      );
      return;
    }
    this._internalOpen = false;
  }

  /**
   * Setup the native popover panel after it renders.
   * Must call showPopover() imperatively since shadow DOM
   * doesn't support declarative popovertarget reliably.
   */
  private setupPanel(): void {
    const panel = this.renderRoot.querySelector<HTMLElement>(`#${this._panelId}`);
    if (!panel) return;

    if (supportsPopoverApi) {
      // Set popover attribute and show via API
      if (!panel.hasAttribute('popover')) {
        panel.setAttribute('popover', 'auto');
      }
      try {
        panel.showPopover();
      } catch {
        // Panel may already be showing or popover attribute not yet applied
      }
    }
  }

  private async updatePosition(): Promise<void> {
    const panel = this.renderRoot.querySelector<HTMLElement>(`#${this._panelId}`);
    const arrowEl = this.renderRoot.querySelector<HTMLElement>('.popover-arrow');
    if (!this.triggerEl || !panel) return;

    const middleware = [
      offset(this.offset),
      flip(),
      shift({ padding: 8 }),
    ];

    if (this.arrow && arrowEl) {
      middleware.push(arrow({ element: arrowEl, padding: 4 }));
    }

    if (this.matchTriggerWidth) {
      middleware.push(
        size({
          apply({ rects, elements }) {
            Object.assign(elements.floating.style, {
              width: `${rects.reference.width}px`,
            });
          },
        })
      );
    }

    const { x, y, placement: resolvedPlacement, middlewareData } =
      await computePosition(this.triggerEl, panel, {
        placement: this.placement,
        strategy: 'fixed',
        middleware,
      });

    this._currentPlacement = resolvedPlacement;

    Object.assign(panel.style, {
      left: `${x}px`,
      top: `${y}px`,
    });

    if (this.arrow && middlewareData.arrow && arrowEl) {
      const { x: ax, y: ay } = middlewareData.arrow;
      const side = resolvedPlacement.split('-')[0];
      const staticSide: Record<string, string> = {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left',
      };

      Object.assign(arrowEl.style, {
        left: ax != null ? `${ax}px` : '',
        top: ay != null ? `${ay}px` : '',
        [staticSide[side!]!]: '-4px',
      });
    }
  }

  private startAutoUpdate(): void {
    const panel = this.renderRoot.querySelector<HTMLElement>(`#${this._panelId}`);
    if (!this.triggerEl || !panel) return;
    this.cleanupAutoUpdate?.();
    this.cleanupAutoUpdate = autoUpdatePosition(
      this.triggerEl,
      panel,
      () => this.updatePosition()
    );
  }

  // --- Focus management ---

  private moveFocusToContent(): void {
    // Delay to ensure DOM is fully settled after render + popover show
    requestAnimationFrame(() => {
      const panel = this.renderRoot.querySelector<HTMLElement>(`#${this._panelId}`);
      if (!panel) return;

      const focusable = this.getFocusableElements();
      if (focusable.length > 0) {
        focusable[0]!.focus();
      } else {
        // Focus the panel itself if no focusable children
        panel.setAttribute('tabindex', '-1');
        panel.focus();
      }

      // For non-modal: close on focus leaving the popover
      if (!this.modal) {
        panel.addEventListener('focusout', this.handleFocusOut, {
          signal: this.abortController?.signal,
        });
      }
    });
  }

  private handleFocusOut = (e: FocusEvent): void => {
    if (!this._internalOpen || this.modal) return;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!relatedTarget) return;

    // Check if focus is moving outside the popover host
    const path = e.composedPath();
    if (!path.includes(this)) {
      // Defer close to allow click events to complete first
      requestAnimationFrame(() => {
        if (this._internalOpen) {
          this.handleClose();
        }
      });
    }
  };

  private restoreFocusToTrigger(): void {
    if (this.triggerEl) {
      this.triggerEl.focus();
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const panel = this.renderRoot.querySelector<HTMLElement>(`#${this._panelId}`);
    if (!panel) return [];

    // Get focusable elements from the content slot
    const contentSlot = panel.querySelector<HTMLSlotElement>('slot[name="content"]');
    if (!contentSlot) return [];

    const assigned = contentSlot.assignedElements({ flatten: true });
    const focusable: HTMLElement[] = [];

    for (const el of assigned) {
      // Check the element itself
      if (this.isFocusable(el as HTMLElement)) {
        focusable.push(el as HTMLElement);
      }
      // Check children
      const children = (el as HTMLElement).querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      for (const child of children) {
        focusable.push(child as HTMLElement);
      }
    }

    return focusable;
  }

  private isFocusable(el: HTMLElement): boolean {
    if (el.hasAttribute('disabled')) return false;
    const tabindex = el.getAttribute('tabindex');
    if (tabindex !== null && tabindex !== '-1') return true;
    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    return focusableTags.includes(el.tagName);
  }
}
