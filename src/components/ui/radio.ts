/**
 * lui-radio - An accessible radio button component with animated dot transition
 *
 * Features:
 * - Circular radio button with animated dot scale transition when checked
 * - Click or Space key dispatches ui-radio-change event to parent RadioGroup
 * - Radio does NOT toggle its own checked state (group manages mutual exclusion)
 * - NOT form-associated (RadioGroup owns form participation)
 * - Label via property or default slot
 * - Three sizes: sm, md, lg using CSS tokens
 * - role="radio" with aria-checked for screen readers
 * - prefers-reduced-motion support
 * - SSR compatible via isServer guards
 *
 * @example
 * ```html
 * <lui-radio value="option1" label="Option 1"></lui-radio>
 * <lui-radio value="option2" checked label="Option 2"></lui-radio>
 * <lui-radio value="option3" disabled label="Option 3"></lui-radio>
 * ```
 *
 * @slot default - Custom label content (alternative to label property)
 */

import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';
import { dispatchCustomEvent } from '@lit-ui/core';

/**
 * Radio size types for circle dimensions and label typography.
 */
export type RadioSize = 'sm' | 'md' | 'lg';

/**
 * An accessible radio button component with animated dot transition.
 * Presentational child of RadioGroup -- does NOT participate in forms.
 *
 * @slot default - Custom label content (alternative to label property)
 */
export class Radio extends TailwindElement {
  // NOT form-associated -- RadioGroup owns form participation
  // NO internals / attachInternals()

  /**
   * Unique ID for label association.
   */
  private radioId = `lui-radio-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * The value this radio represents.
   * @default ''
   */
  @property({ type: String })
  value = '';

  /**
   * Whether the radio is in the checked state.
   * Set by RadioGroup, not by the radio itself.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  checked = false;

  /**
   * Whether the radio is disabled.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Label text displayed next to the radio.
   * @default ''
   */
  @property({ type: String })
  label = '';

  /**
   * The size of the radio affecting circle dimensions and label typography.
   * @default 'md'
   */
  @property({ type: String })
  size: RadioSize = 'md';

  /**
   * Static styles for the radio component.
   * Uses CSS custom properties from the radio token block.
   */
  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: inline-block;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      /* Radio wrapper - flexbox row for label + circle */
      .radio-wrapper {
        display: flex;
        flex-direction: row;
        gap: var(--ui-radio-label-gap);
        align-items: center;
        cursor: pointer;
      }

      /* Radio circle - the outer border */
      .radio-circle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: var(--ui-radio-border-width) solid var(--ui-radio-border);
        border-radius: 50%;
        background-color: var(--ui-radio-bg);
        cursor: pointer;
        transition: border-color var(--ui-radio-transition) ease-in-out;
        flex-shrink: 0;
      }

      /* Checked state */
      .radio-circle[aria-checked='true'] {
        border-color: var(--ui-radio-border-checked);
      }

      /* Inner dot */
      .radio-dot {
        border-radius: 50%;
        background-color: var(--ui-radio-dot-color);
        transform: scale(0);
        transition: transform var(--ui-radio-transition) ease-in-out;
      }

      /* Dot visible when checked */
      .radio-circle[aria-checked='true'] .radio-dot {
        transform: scale(1);
      }

      /* Size: sm */
      .circle-sm {
        width: var(--ui-radio-size-sm);
        height: var(--ui-radio-size-sm);
      }

      .dot-sm {
        width: var(--ui-radio-dot-size-sm);
        height: var(--ui-radio-dot-size-sm);
      }

      /* Size: md */
      .circle-md {
        width: var(--ui-radio-size-md);
        height: var(--ui-radio-size-md);
      }

      .dot-md {
        width: var(--ui-radio-dot-size-md);
        height: var(--ui-radio-dot-size-md);
      }

      /* Size: lg */
      .circle-lg {
        width: var(--ui-radio-size-lg);
        height: var(--ui-radio-size-lg);
      }

      .dot-lg {
        width: var(--ui-radio-dot-size-lg);
        height: var(--ui-radio-dot-size-lg);
      }

      /* Focus ring */
      .radio-circle:focus-visible {
        outline: 2px solid var(--ui-focus-ring-color, var(--ui-radio-ring));
        outline-offset: 2px;
      }

      /* Disabled */
      .radio-circle[aria-disabled='true'] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Label */
      .radio-label {
        font-weight: 500;
        color: var(--ui-input-text, inherit);
        cursor: pointer;
      }

      .label-sm {
        font-size: var(--ui-radio-font-size-sm);
      }

      .label-md {
        font-size: var(--ui-radio-font-size-md);
      }

      .label-lg {
        font-size: var(--ui-radio-font-size-lg);
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .radio-dot,
        .radio-circle {
          transition-duration: 0ms;
        }
      }
    `,
  ];

  /**
   * Handle click events on the radio wrapper.
   * Click handler is on the wrapper so clicking the label also triggers selection.
   * Radio does NOT toggle its own checked state -- it dispatches ui-radio-change
   * and the RadioGroup handles mutual exclusion.
   */
  private handleClick(): void {
    if (this.disabled) return;
    dispatchCustomEvent(this, 'ui-radio-change', {
      value: this.value,
    });
  }

  /**
   * Handle keyboard events for Space key only.
   * Per W3C APG radio spec, Space checks the focused radio.
   * Arrow keys are handled by the RadioGroup, not individual radios.
   * preventDefault stops page scroll on Space.
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === ' ') {
      e.preventDefault();
      this.handleClick();
    }
  }

  override render() {
    return html`
      <div class="radio-wrapper" @click=${this.handleClick}>
        <div
          role="radio"
          aria-checked=${this.checked ? 'true' : 'false'}
          aria-disabled=${this.disabled ? 'true' : nothing}
          aria-labelledby="${this.radioId}-label"
          tabindex="-1"
          class="radio-circle circle-${this.size}"
          @keydown=${this.handleKeyDown}
        >
          <span class="radio-dot dot-${this.size}"></span>
        </div>
        ${this.label
          ? html`<label
              id="${this.radioId}-label"
              class="radio-label label-${this.size}"
              >${this.label}</label
            >`
          : html`<label
              id="${this.radioId}-label"
              class="radio-label label-${this.size}"
              ><slot></slot
            ></label>`}
      </div>
    `;
  }
}
