/**
 * lui-checkbox - An accessible checkbox component with animated SVG checkmark
 *
 * Features:
 * - Toggle between checked/unchecked states via click or Space key
 * - Animated SVG checkmark draw-in transition when checked
 * - Indeterminate tri-state with dash icon and aria-checked="mixed"
 * - Indeterminate clears on user interaction (always results in checked or unchecked)
 * - Form participation via ElementInternals (setFormValue, setValidity, formResetCallback)
 * - Required validation with touched-based error display
 * - Label via property or default slot
 * - Three sizes: sm, md, lg using CSS tokens
 * - role="checkbox" with aria-checked (true/false/mixed) for screen readers
 * - prefers-reduced-motion support
 * - SSR compatible via isServer guards
 *
 * @example
 * ```html
 * <lui-checkbox label="Accept terms" required></lui-checkbox>
 * <lui-checkbox checked name="newsletter" value="yes"></lui-checkbox>
 * <lui-checkbox indeterminate label="Select all"></lui-checkbox>
 * ```
 */

import { html, css, nothing, isServer, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';
import { dispatchCustomEvent } from '@lit-ui/core';

/**
 * Checkbox size types for box dimensions and label typography.
 */
export type CheckboxSize = 'sm' | 'md' | 'lg';

/**
 * An accessible checkbox component with animated SVG checkmark,
 * indeterminate tri-state, and form participation.
 * Form participation is client-side only (guarded with isServer check).
 *
 * @slot default - Custom label content (alternative to label property)
 */
export class Checkbox extends TailwindElement {
  /**
   * Enable form association for this custom element.
   * This allows the checkbox to participate in form submission.
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
  private checkboxId = `lui-cb-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Stores the initial checked state for formResetCallback.
   */
  private defaultChecked = false;

  /**
   * Whether the checkbox is in the checked state.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  checked = false;

  /**
   * Whether the checkbox is disabled.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the checkbox is required for form submission.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the checkbox is in an indeterminate state.
   * JS-only property, not reflected (matches native convention).
   * @default false
   */
  @property({ type: Boolean })
  indeterminate = false;

  /**
   * The name of the checkbox for form submission.
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
   * Label text displayed next to the checkbox.
   * @default ''
   */
  @property({ type: String })
  label = '';

  /**
   * The size of the checkbox affecting box dimensions and label typography.
   * @default 'md'
   */
  @property({ type: String })
  size: CheckboxSize = 'md';

  /**
   * Whether the checkbox has been interacted with.
   * Used for validation display timing.
   */
  @state()
  private touched = false;

  /**
   * Whether to show error state.
   * True when checkbox is invalid and has been touched.
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
   * Keep form state in sync when checked or indeterminate property changes externally.
   */
  protected override updated(changedProperties: PropertyValues): void {
    if (
      changedProperties.has('checked') ||
      changedProperties.has('indeterminate')
    ) {
      this.updateFormValue();
      this.validate();
    }
  }

  /**
   * Static styles for the checkbox component.
   * Uses CSS custom properties from the checkbox token block.
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

      /* Checkbox wrapper - flexbox row for label + box */
      .checkbox-wrapper {
        display: flex;
        flex-direction: row;
        gap: var(--ui-checkbox-label-gap);
        align-items: center;
        cursor: pointer;
      }

      /* Checkbox box - the square container */
      .checkbox-box {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: var(--ui-checkbox-border-width) solid var(--ui-checkbox-border);
        border-radius: var(--ui-checkbox-radius);
        background-color: var(--ui-checkbox-bg);
        cursor: pointer;
        transition:
          background-color var(--ui-checkbox-transition) ease-in-out,
          border-color var(--ui-checkbox-transition) ease-in-out;
        flex-shrink: 0;
        color: var(--ui-checkbox-check-color);
      }

      /* Checked and indeterminate states */
      .checkbox-box[aria-checked='true'],
      .checkbox-box[aria-checked='mixed'] {
        background-color: var(--ui-checkbox-bg-checked);
        border-color: var(--ui-checkbox-border-checked);
      }

      /* SVG icon sizing */
      .checkbox-icon {
        width: 75%;
        height: 75%;
      }

      /* Checkmark draw-in animation via stroke-dashoffset */
      .check-path {
        stroke-dasharray: 14;
        stroke-dashoffset: 14;
        transition: stroke-dashoffset var(--ui-checkbox-transition) ease-in-out;
      }

      /* When checked: draw in (offset to 0) */
      .checkbox-box[aria-checked='true'] .check-path {
        stroke-dashoffset: 0;
      }

      /* Indeterminate dash - use opacity for cross-fade */
      .dash-path {
        opacity: 0;
        transition: opacity var(--ui-checkbox-transition) ease-in-out;
      }

      .checkbox-box[aria-checked='mixed'] .dash-path {
        opacity: 1;
      }

      /* Hide checkmark when indeterminate */
      .checkbox-box[aria-checked='mixed'] .check-path {
        stroke-dashoffset: 14;
      }

      /* Size: sm */
      .box-sm {
        width: var(--ui-checkbox-size-sm);
        height: var(--ui-checkbox-size-sm);
      }

      /* Size: md */
      .box-md {
        width: var(--ui-checkbox-size-md);
        height: var(--ui-checkbox-size-md);
      }

      /* Size: lg */
      .box-lg {
        width: var(--ui-checkbox-size-lg);
        height: var(--ui-checkbox-size-lg);
      }

      /* Focus ring */
      .checkbox-box:focus-visible {
        outline: 2px solid var(--ui-focus-ring-color, var(--ui-checkbox-ring));
        outline-offset: 2px;
      }

      /* Disabled */
      .checkbox-box[aria-disabled='true'] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Label */
      .checkbox-label {
        font-weight: 500;
        color: var(--ui-input-text, inherit);
        cursor: pointer;
      }

      .label-sm {
        font-size: var(--ui-checkbox-font-size-sm);
      }

      .label-md {
        font-size: var(--ui-checkbox-font-size-md);
      }

      .label-lg {
        font-size: var(--ui-checkbox-font-size-lg);
      }

      /* Error text */
      .error-text {
        font-size: 0.75rem;
        color: var(--ui-checkbox-text-error);
        margin-top: 0.25rem;
      }

      /* Error border */
      .checkbox-box.has-error {
        border-color: var(--ui-checkbox-border-error);
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .check-path,
        .dash-path,
        .checkbox-box {
          transition-duration: 0ms;
        }
      }
    `,
  ];

  /**
   * Toggle the checkbox state.
   * Always clears indeterminate on user interaction.
   * Dispatches ui-change event with checked state and value.
   */
  private toggle(): void {
    if (this.disabled) return;
    this.indeterminate = false;
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
   * Handle click events on the checkbox wrapper.
   * Click handler is on the wrapper so clicking the label also toggles.
   */
  private handleClick(): void {
    this.toggle();
  }

  /**
   * Handle keyboard events for Space key only.
   * Per W3C APG checkbox spec, Space toggles the checkbox.
   * Enter is NOT specified for checkbox (unlike switch).
   * preventDefault stops page scroll on Space.
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === ' ') {
      e.preventDefault();
      this.toggle();
    }
  }

  /**
   * Sync the checked state to the form via ElementInternals.
   * Submits value when checked, null when unchecked.
   * Indeterminate does NOT affect form value.
   */
  private updateFormValue(): void {
    this.internals?.setFormValue(this.checked ? this.value : null);
  }

  /**
   * Validate the checkbox and sync validity state to ElementInternals.
   * @returns true if valid, false if invalid
   */
  private validate(): boolean {
    if (!this.internals) return true;

    if (this.required && !this.checked) {
      this.internals.setValidity(
        { valueMissing: true },
        'Please check this box.',
        this.shadowRoot?.querySelector('.checkbox-box') as HTMLElement
      );
      this.showError = this.touched;
      return false;
    }

    this.internals.setValidity({});
    this.showError = false;
    return true;
  }

  /**
   * Form lifecycle callback: reset the checkbox to initial state.
   */
  formResetCallback(): void {
    this.checked = this.defaultChecked;
    this.indeterminate = false;
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
      <div class="checkbox-wrapper" @click=${this.handleClick}>
        <div
          role="checkbox"
          aria-checked=${this.indeterminate
            ? 'mixed'
            : this.checked
              ? 'true'
              : 'false'}
          aria-disabled=${this.disabled ? 'true' : nothing}
          aria-required=${this.required ? 'true' : nothing}
          aria-labelledby="${this.checkboxId}-label"
          tabindex=${this.disabled ? '-1' : '0'}
          class="checkbox-box box-${this.size} ${this.showError
            ? 'has-error'
            : ''}"
          @keydown=${this.handleKeyDown}
        >
          <svg
            class="checkbox-icon"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              class="check-path"
              d="M2 6L5 9L10 3"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              class="dash-path"
              d="M3 6H9"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </div>
        ${this.label
          ? html`<label
              id="${this.checkboxId}-label"
              class="checkbox-label label-${this.size}"
              >${this.label}</label
            >`
          : html`<label
              id="${this.checkboxId}-label"
              class="checkbox-label label-${this.size}"
              ><slot></slot
            ></label>`}
      </div>
      ${this.showError
        ? html`<div class="error-text" role="alert">
            Please check this box.
          </div>`
        : nothing}
    `;
  }
}
