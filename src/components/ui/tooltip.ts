/**
 * lui-tooltip - An accessible tooltip component
 *
 * Features:
 * - Hover trigger with configurable show delay (TIP-01)
 * - Keyboard focus trigger with same delay behavior (TIP-02)
 * - Escape key dismissal (TIP-03)
 * - 12 Floating UI placement options with collision avoidance (TIP-04)
 * - Optional arrow indicator positioned by Floating UI (TIP-05)
 * - aria-describedby linking trigger to tooltip content (TIP-06)
 * - Non-interactive content only (role="tooltip") (TIP-07)
 * - Auto-repositioning on scroll/resize via autoUpdate (TIP-08)
 * - Delay group for skip-delay when moving between tooltips (TIP-09)
 * - Rich variant with title + description (TIP-10)
 * - Hide delay cursor bridge for gap traversal (TIP-11)
 * - Touch device filtering via pointerType (TIP-12)
 * - Reduced motion support via prefers-reduced-motion (TIP-13)
 * - SSR safety with isServer guard (TIP-14)
 * - AbortController cleanup in disconnectedCallback (TIP-15)
 * - CSS custom properties (--ui-tooltip-*) for theming (TIP-16)
 *
 * @slot - Default slot for trigger element
 * @slot content - Named slot for rich tooltip content (overrides content property)
 * @slot title - Named slot for rich tooltip title (overrides tooltip-title property)
 *
 * @csspart trigger - The trigger wrapper
 * @csspart tooltip - The tooltip panel
 * @csspart content - The tooltip content container
 * @csspart arrow - The arrow indicator
 *
 * @example Basic usage
 * ```html
 * <lui-tooltip content="Save document">
 *   <button>Save</button>
 * </lui-tooltip>
 * ```
 *
 * @example Rich tooltip
 * ```html
 * <lui-tooltip rich tooltip-title="Keyboard Shortcut" content="Ctrl+S to save" placement="bottom">
 *   <button>Save</button>
 * </lui-tooltip>
 * ```
 */

import { html, css, nothing } from 'lit';
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
  type Placement,
} from '@lit-ui/core/floating';
import { delayGroup, type TooltipInstance } from './delay-group.js';

export type { Placement };

export class Tooltip extends TailwindElement implements TooltipInstance {
  // ---------------------------------------------------------------------------
  // Public properties
  // ---------------------------------------------------------------------------

  /** Text content for the tooltip. Alternative to the content slot. */
  @property({ type: String })
  content = '';

  /** Preferred placement relative to trigger. Floating UI may flip if space is insufficient. */
  @property({ type: String })
  placement: Placement = 'top';

  /** Delay in ms before showing tooltip on hover (TIP-01) */
  @property({ type: Number, attribute: 'show-delay' })
  showDelay = 300;

  /** Delay in ms before hiding tooltip after pointer leaves (TIP-11) */
  @property({ type: Number, attribute: 'hide-delay' })
  hideDelay = 100;

  /** Whether to show an arrow pointing at the trigger (TIP-05) */
  @property({ type: Boolean })
  arrow = true;

  /** Offset distance from trigger in pixels */
  @property({ type: Number })
  offset = 8;

  /** Whether this is a rich tooltip with title + description (TIP-10) */
  @property({ type: Boolean })
  rich = false;

  /** Title text for rich tooltip variant (TIP-10) */
  @property({ type: String, attribute: 'tooltip-title' })
  tooltipTitle = '';

  /** Disable tooltip display */
  @property({ type: Boolean })
  disabled = false;

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  @state()
  private open = false;

  private triggerEl: HTMLElement | null = null;
  private showTimeout?: ReturnType<typeof setTimeout>;
  private hideTimeout?: ReturnType<typeof setTimeout>;
  private cleanupAutoUpdate?: () => void;
  private abortController?: AbortController;

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: inline-block;
        position: relative;
      }

      .tooltip-panel {
        position: fixed;
        z-index: var(--ui-tooltip-z-index);
        pointer-events: auto;
        max-width: var(--ui-tooltip-max-width);
        width: max-content;

        /* Animation: fade only (TIP-13 respected via prefers-reduced-motion) */
        opacity: 0;
        transition:
          opacity 150ms ease-out,
          display 150ms allow-discrete,
          overlay 150ms allow-discrete;
      }

      .tooltip-panel[data-open] {
        opacity: 1;
      }

      @starting-style {
        .tooltip-panel[data-open] {
          opacity: 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .tooltip-panel {
          transition: none;
        }
      }

      .tooltip-content {
        background: var(--ui-tooltip-bg);
        color: var(--ui-tooltip-text);
        border-radius: var(--ui-tooltip-radius);
        padding: var(--ui-tooltip-padding-y) var(--ui-tooltip-padding-x);
        font-size: var(--ui-tooltip-font-size);
        box-shadow: var(--ui-tooltip-shadow);
        line-height: 1.4;
      }

      /* Rich tooltip variant (TIP-10) */
      :host([rich]) .tooltip-content {
        padding: 0.75rem 1rem;
      }

      .tooltip-title {
        font-weight: 600;
        margin-bottom: 0.25rem;
      }

      .tooltip-description {
        opacity: 0.9;
      }

      /* Arrow (TIP-05) */
      .tooltip-arrow {
        position: absolute;
        width: var(--ui-tooltip-arrow-size);
        height: var(--ui-tooltip-arrow-size);
        background: var(--ui-tooltip-bg);
        transform: rotate(45deg);
      }
    `,
  ];

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  override connectedCallback(): void {
    super.connectedCallback();
    if (isServer) return;

    this.abortController = new AbortController();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.abortController?.abort();
    this.cleanupAutoUpdate?.();
    clearTimeout(this.showTimeout);
    clearTimeout(this.hideTimeout);

    if (this.open) {
      this.open = false;
      if (this.triggerEl) {
        this.triggerEl.removeAttribute('aria-describedby');
      }
      delayGroup.clearActive(this);
      delayGroup.notifyClosed();
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  override render() {
    return html`
      <div class="tooltip-trigger" part="trigger">
        <slot
          @slotchange=${this.handleSlotChange}
          @pointerenter=${this.handlePointerEnter}
          @pointerleave=${this.handlePointerLeave}
          @focusin=${this.handleFocusIn}
          @focusout=${this.handleFocusOut}
          @keydown=${this.handleKeyDown}
        ></slot>
      </div>
      ${this.open && !isServer
        ? html`
            <div
              id="tooltip"
              role="tooltip"
              part="tooltip"
              class="tooltip-panel"
              data-open
              @pointerenter=${this.handleTooltipPointerEnter}
              @pointerleave=${this.handleTooltipPointerLeave}
            >
              <div class="tooltip-content" part="content">
                ${this.rich
                  ? html`
                      <div class="tooltip-title">
                        ${this.tooltipTitle}
                        <slot name="title"></slot>
                      </div>
                      <div class="tooltip-description">
                        ${this.content}
                        <slot name="content"></slot>
                      </div>
                    `
                  : html`
                      ${this.content}
                      <slot name="content"></slot>
                    `}
              </div>
              ${this.arrow
                ? html`<div class="tooltip-arrow" part="arrow"></div>`
                : nothing}
            </div>
          `
        : nothing}
    `;
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  private handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements({ flatten: true });
    const trigger = assigned[0] as HTMLElement | undefined;

    if (trigger) {
      this.triggerEl = trigger;
    }
  }

  private handlePointerEnter = (e: PointerEvent): void => {
    // Skip touch -- tooltips are hover-only (TIP-12)
    if (e.pointerType === 'touch') return;
    if (this.disabled) return;
    this.scheduleShow();
  };

  private handlePointerLeave = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    this.scheduleHide();
  };

  private handleFocusIn = (): void => {
    if (this.disabled) return;
    this.scheduleShow();
  };

  private handleFocusOut = (): void => {
    this.scheduleHide();
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.open) {
      e.preventDefault();
      this.hide();
      delayGroup.notifyClosed();
    }
  };

  private handleTooltipPointerEnter = (): void => {
    clearTimeout(this.hideTimeout);
  };

  private handleTooltipPointerLeave = (): void => {
    this.scheduleHide();
  };

  // ---------------------------------------------------------------------------
  // Show/hide state machine
  // ---------------------------------------------------------------------------

  private scheduleShow(): void {
    clearTimeout(this.hideTimeout);
    if (this.open) return;

    const delay = delayGroup.isInGroupWindow() ? 0 : this.showDelay;
    this.showTimeout = setTimeout(() => this.show(), delay);
  }

  private scheduleHide(): void {
    clearTimeout(this.showTimeout);
    if (!this.open) return;

    this.hideTimeout = setTimeout(() => {
      this.hide();
      delayGroup.notifyClosed();
    }, this.hideDelay);
  }

  private show(): void {
    this.open = true;

    // Set aria-describedby when tooltip becomes visible (TIP-06)
    if (this.triggerEl) {
      this.triggerEl.setAttribute('aria-describedby', 'tooltip');
    }

    // Track in delay group for force-close behavior (TIP-09)
    delayGroup.setActive(this);

    // Position after render
    this.updateComplete.then(() => {
      this.updatePosition();
      this.startAutoUpdate();
    });
  }

  hide(): void {
    this.open = false;

    // Remove aria-describedby when tooltip hides (TIP-06)
    if (this.triggerEl) {
      this.triggerEl.removeAttribute('aria-describedby');
    }

    // Stop auto-update (no need to reposition when invisible)
    this.cleanupAutoUpdate?.();
    this.cleanupAutoUpdate = undefined;

    // Clear from delay group
    delayGroup.clearActive(this);

    // Clear pending timeouts
    clearTimeout(this.showTimeout);
    clearTimeout(this.hideTimeout);
  }

  // ---------------------------------------------------------------------------
  // Positioning (TIP-04, TIP-05, TIP-08)
  // ---------------------------------------------------------------------------

  private async updatePosition(): Promise<void> {
    const tooltipEl = this.renderRoot.querySelector<HTMLElement>('#tooltip');
    const arrowEl = this.renderRoot.querySelector<HTMLElement>('.tooltip-arrow');

    if (!this.triggerEl || !tooltipEl) return;

    const middleware = [
      offset(this.offset),
      flip(),
      shift({ padding: 8 }),
    ];

    if (this.arrow && arrowEl) {
      middleware.push(arrow({ element: arrowEl, padding: 4 }));
    }

    const { x, y, placement: resolvedPlacement, middlewareData } =
      await computePosition(this.triggerEl, tooltipEl, {
        placement: this.placement,
        strategy: 'fixed',
        middleware,
      });

    Object.assign(tooltipEl.style, {
      left: `${x}px`,
      top: `${y}px`,
    });

    // Position arrow based on resolved placement (TIP-05)
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
        [staticSide[side]!]: '-4px',
      });
    }
  }

  private startAutoUpdate(): void {
    const tooltipEl = this.renderRoot.querySelector<HTMLElement>('#tooltip');

    if (!this.triggerEl || !tooltipEl) return;

    this.cleanupAutoUpdate?.();
    this.cleanupAutoUpdate = autoUpdatePosition(
      this.triggerEl,
      tooltipEl,
      () => this.updatePosition()
    );
  }
}
