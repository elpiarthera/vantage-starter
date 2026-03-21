/**
 * lui-switch - An accessible toggle switch component
 *
 * Features:
 * - Toggle between on/off states via click, Space, or Enter
 * - Animated track + thumb with CSS slide transition
 * - Form participation via ElementInternals (setFormValue, setValidity, formResetCallback)
 * - Required validation and disabled state
 * - Label via property or default slot
 * - Three sizes: sm, md, lg using CSS tokens
 * - role="switch" with aria-checked for screen readers
 * - prefers-reduced-motion support
 * - SSR compatible via isServer guards
 *
 * @example
 * ```html
 * <lui-switch label="Notifications" size="md"></lui-switch>
 * <lui-switch checked name="dark-mode" value="on"></lui-switch>
 * <lui-switch required label="Accept terms"></lui-switch>
 * ```
 */

import { html, css, nothing, isServer, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';
import { dispatchCustomEvent } from '@lit-ui/core';

/**
 * Switch size types for track and thumb dimensions.
 */
export type SwitchSize = 'sm' | 'md' | 'lg';

/**
 * An accessible toggle switch component with form participation.
 * Renders a track + thumb visual with animated CSS slide transition.
 * Form participation is client-side only (guarded with isServer check).
 *
 * @slot default - Custom label content (alternative to label property)
 */
export class Switch extends TailwindElement {
  /**
   * Enable form association for this custom element.
   * This allows the switch to participate in form submission.
   */
  static formAssociated = true;

  /**
   * ElementInternals for form participation.
   * Null during SSR since attachInternals() is not available.
   */
  private internals: ElementInternals | null = null;

  /**
   * Unique ID for label association.
   */
  private switchId = `lui-switch-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Stores the initial checked state for formResetCallback.
   */
  private defaultChecked = false;

  /**
   * Whether the switch is in the on state.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  checked = false;

  /**
   * Whether the switch is disabled.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the switch is required for form submission.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * The name of the switch for form submission.
   * @default ''
   */
  @property({ type: String })
  name = '';

  /**
   * The value submitted when checked.
   * @default 'on'
   */
  @property({ type: String })
  value = 'on';

  /**
   * Label text displayed next to the switch.
   * @default ''
   */
  @property({ type: String })
  label = '';

  /**
   * The size of the switch affecting track and thumb dimensions.
   * @default 'md'
   */
  @property({ type: String })
  size: SwitchSize = 'md';

  /**
   * Whether the switch has been interacted with.
   * Used for validation display timing.
   */
  @state()
  private touched = false;

  /**
   * Whether to show error state.
   * True when switch is invalid and has been touched.
   */
  @state()
  private showError = false;

  constructor() {
    super();
    // Only attach internals on client (not during SSR)
    if (!isServer) {
      this.internals = this.attachInternals();
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.defaultChecked = this.checked;
    this.updateFormValue();
  }

  /**
   * Keep form state in sync when checked property changes externally.
   */
  protected override updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('checked')) {
      this.updateFormValue();
      this.validate();
    }
  }

  /**
   * Static styles for the switch component.
   * Uses CSS custom properties from the switch token block.
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

      /* Switch wrapper - flexbox row for label + track */
      .switch-wrapper {
        display: flex;
        flex-direction: row;
        gap: var(--ui-switch-label-gap);
        align-items: center;
      }

      /* Track - the oval background */
      .switch-track {
        display: inline-flex;
        align-items: center;
        position: relative;
        border-radius: var(--ui-switch-radius);
        background-color: var(--ui-switch-track-bg);
        cursor: pointer;
        border: 1px solid var(--ui-switch-track-border);
        transition: background-color var(--ui-switch-transition) ease-in-out;
        flex-shrink: 0;
      }

      .switch-track[aria-checked='true'] {
        background-color: var(--ui-switch-track-bg-checked);
        border-color: var(--ui-switch-track-bg-checked);
      }

      .switch-track[aria-disabled='true'] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Thumb - the sliding circle */
      .switch-thumb {
        position: absolute;
        left: var(--ui-switch-thumb-offset);
        top: 50%;
        transform: translateY(-50%);
        border-radius: var(--ui-switch-thumb-radius);
        background-color: var(--ui-switch-thumb-bg);
        transition: transform var(--ui-switch-transition) ease-in-out;
      }

      /* Size: sm */
      .track-sm {
        width: var(--ui-switch-track-width-sm);
        height: var(--ui-switch-track-height-sm);
      }

      .track-sm .switch-thumb {
        width: var(--ui-switch-thumb-size-sm);
        height: var(--ui-switch-thumb-size-sm);
      }

      .track-sm[aria-checked='true'] .switch-thumb {
        transform: translateX(
            calc(
              var(--ui-switch-track-width-sm) - var(--ui-switch-thumb-size-sm) -
                var(--ui-switch-thumb-offset) * 2
            )
          )
          translateY(-50%);
      }

      /* Size: md */
      .track-md {
        width: var(--ui-switch-track-width-md);
        height: var(--ui-switch-track-height-md);
      }

      .track-md .switch-thumb {
        width: var(--ui-switch-thumb-size-md);
        height: var(--ui-switch-thumb-size-md);
      }

      .track-md[aria-checked='true'] .switch-thumb {
        transform: translateX(
            calc(
              var(--ui-switch-track-width-md) - var(--ui-switch-thumb-size-md) -
                var(--ui-switch-thumb-offset) * 2
            )
          )
          translateY(-50%);
      }

      /* Size: lg */
      .track-lg {
        width: var(--ui-switch-track-width-lg);
        height: var(--ui-switch-track-height-lg);
      }

      .track-lg .switch-thumb {
        width: var(--ui-switch-thumb-size-lg);
        height: var(--ui-switch-thumb-size-lg);
      }

      .track-lg[aria-checked='true'] .switch-thumb {
        transform: translateX(
            calc(
              var(--ui-switch-track-width-lg) - var(--ui-switch-thumb-size-lg) -
                var(--ui-switch-thumb-offset) * 2
            )
          )
          translateY(-50%);
      }

      /* Focus ring */
      .switch-track:focus-visible {
        outline: 2px solid var(--ui-focus-ring-color, var(--ui-switch-ring));
        outline-offset: 2px;
      }

      /* Error state */
      .switch-track.has-error {
        border-color: var(--ui-switch-border-error);
      }

      /* Label */
      .switch-label {
        font-weight: 500;
        color: var(--ui-input-text, inherit);
      }

      .label-sm {
        font-size: var(--ui-switch-font-size-sm);
      }

      .label-md {
        font-size: var(--ui-switch-font-size-md);
      }

      .label-lg {
        font-size: var(--ui-switch-font-size-lg);
      }

      /* Error text */
      .error-text {
        font-size: 0.75rem;
        color: var(--ui-switch-text-error);
        margin-top: 0.25rem;
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .switch-thumb,
        .switch-track {
          transition-duration: 0ms;
        }
      }
    `,
  ];

  /**
   * Toggle the switch state.
   * Dispatches ui-change event with checked state and value.
   */
  private toggle(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.touched = true;
    this.updateFormValue();
    this.validate();
    dispatchCustomEvent(this, 'ui-change', {
      checked: this.checked,
      value: this.checked ? this.value : null,
    });
  }

  /**
   * Handle click events on the switch track.
   */
  private handleClick(): void {
    this.toggle();
  }

  /**
   * Handle keyboard events for Space and Enter keys.
   * Prevents default to avoid page scroll on Space.
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.toggle();
    }
  }

  /**
   * Sync the checked state to the form via ElementInternals.
   * Submits value when checked, null when unchecked (matches native checkbox).
   */
  private updateFormValue(): void {
    this.internals?.setFormValue(this.checked ? this.value : null);
  }

  /**
   * Validate the switch and sync validity state to ElementInternals.
   * @returns true if valid, false if invalid
   */
  private validate(): boolean {
    if (!this.internals) return true;

    if (this.required && !this.checked) {
      this.internals.setValidity(
        { valueMissing: true },
        'Please toggle this switch.',
        this.shadowRoot?.querySelector('.switch-track') as HTMLElement
      );
      this.showError = this.touched;
      return false;
    }

    this.internals.setValidity({});
    this.showError = false;
    return true;
  }

  /**
   * Form lifecycle callback: reset the switch to initial state.
   */
  formResetCallback(): void {
    this.checked = this.defaultChecked;
    this.touched = false;
    this.showError = false;
    this.updateFormValue();
    this.internals?.setValidity({});
  }

  /**
   * Form lifecycle callback: handle disabled state from form.
   */
  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  override render() {
    return html`
      <div class="switch-wrapper">
        ${this.label
          ? html`<label
              id="${this.switchId}-label"
              class="switch-label label-${this.size}"
              >${this.label}</label
            >`
          : html`<label
              id="${this.switchId}-label"
              class="switch-label label-${this.size}"
              ><slot></slot
            ></label>`}
        <div
          role="switch"
          aria-checked=${this.checked ? 'true' : 'false'}
          aria-disabled=${this.disabled ? 'true' : nothing}
          aria-required=${this.required ? 'true' : nothing}
          aria-labelledby="${this.switchId}-label"
          tabindex=${this.disabled ? '-1' : '0'}
          class="switch-track track-${this.size} ${this.showError
            ? 'has-error'
            : ''}"
          @click=${this.handleClick}
          @keydown=${this.handleKeyDown}
        >
          <span class="switch-thumb"></span>
        </div>
      </div>
      ${this.showError
        ? html`<div class="error-text" role="alert">
            Please toggle this switch.
          </div>`
        : nothing}
    `;
  }
}
