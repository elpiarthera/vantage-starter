/**
 * lui-radio-group - An accessible radio group with mutual exclusion and roving tabindex
 *
 * Features:
 * - role="radiogroup" with aria-labelledby for screen reader grouping
 * - Mutual exclusion: only one radio checked at a time
 * - Roving tabindex: single tab stop, arrow keys move focus AND selection with wrapping
 * - Form participation via ElementInternals (setFormValue, setValidity, formResetCallback)
 * - Required validation prevents form submission when nothing selected
 * - Disabled propagation to all child lui-radio elements
 * - Child discovery via slotchange event
 * - SSR compatible via isServer guards
 *
 * Keyboard navigation (W3C APG Radio Group pattern):
 * - Tab/Shift+Tab: Move into/out of group (single tab stop)
 * - ArrowDown/ArrowRight: Move focus and selection to next radio (wraps)
 * - ArrowUp/ArrowLeft: Move focus and selection to previous radio (wraps)
 * - Space: Selects the focused radio (handled by individual lui-radio)
 *
 * @example
 * ```html
 * <lui-radio-group name="color" label="Favorite color" required>
 *   <lui-radio value="red" label="Red"></lui-radio>
 *   <lui-radio value="green" label="Green"></lui-radio>
 *   <lui-radio value="blue" label="Blue"></lui-radio>
 * </lui-radio-group>
 * ```
 *
 * @example With initial value
 * ```html
 * <lui-radio-group name="size" value="md" label="Size">
 *   <lui-radio value="sm" label="Small"></lui-radio>
 *   <lui-radio value="md" label="Medium"></lui-radio>
 *   <lui-radio value="lg" label="Large"></lui-radio>
 * </lui-radio-group>
 * ```
 *
 * @slot default - Child lui-radio elements
 */

import { html, css, nothing, isServer, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';
import { dispatchCustomEvent } from '@lit-ui/core';
import type { Radio } from './radio.js';

/**
 * An accessible radio group container with mutual exclusion, roving tabindex,
 * form participation via ElementInternals, and group-level validation.
 *
 * @slot default - Child lui-radio elements
 */
export class RadioGroup extends TailwindElement {
  /**
   * Enable form association for this custom element.
   * RadioGroup owns form participation (individual radios do not).
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
  private groupId = `lui-rg-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Discovered child radio elements.
   */
  private radios: Radio[] = [];

  /**
   * Stores the initial value for formResetCallback.
   */
  private defaultValue = '';

  /**
   * The name of the radio group for form submission.
   * @default ''
   */
  @property({ type: String })
  name = '';

  /**
   * The currently selected radio's value.
   * @default ''
   */
  @property({ type: String })
  value = '';

  /**
   * Whether a selection is required for form validity.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether all child radios should be disabled.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Label text displayed above the group.
   * @default ''
   */
  @property({ type: String })
  label = '';

  /**
   * Custom error message for required validation.
   * @default ''
   */
  @property({ type: String })
  error = '';

  /**
   * Whether the user has interacted with the group.
   * Used for validation display timing.
   */
  @state()
  private touched = false;

  /**
   * Whether to show the validation error message.
   */
  @state()
  private showError = false;

  /**
   * Static styles for the radio group component.
   */
  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
      }

      :host([disabled]) {
        opacity: 0.5;
      }

      .group-wrapper {
        display: flex;
        flex-direction: column;
      }

      .group-label {
        font-weight: 500;
        margin-bottom: 0.375rem;
        font-size: 0.875rem;
        color: var(--ui-input-text, inherit);
      }

      .group-items {
        display: flex;
        flex-direction: column;
        gap: var(--ui-radio-group-gap);
      }

      .error-text {
        font-size: 0.75rem;
        color: var(--ui-radio-text-error);
        margin-top: 0.25rem;
      }
    `,
  ];

  constructor() {
    super();
    // Only attach internals on client (not during SSR)
    if (!isServer) {
      this.internals = this.attachInternals();
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.defaultValue = this.value;
    this.updateFormValue();
  }

  /**
   * Sync child states and form value when properties change.
   * Uses PropertyValues type (not Map) to avoid api-extractor DTS rollup crash.
   */
  protected override updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('value')) {
      this.syncChildStates();
      this.updateRovingTabindex();
      this.updateFormValue();
      this.validate();
    }

    if (changedProperties.has('disabled')) {
      this.syncDisabledState();
      this.updateRovingTabindex();
    }
  }

  /**
   * Handle slot changes to discover child radio elements.
   * Filters for LUI-RADIO elements and syncs state.
   */
  private handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements({ flatten: true });
    this.radios = assigned.filter(
      (el) => el.tagName === 'LUI-RADIO'
    ) as Radio[];
    this.syncChildStates();
    this.syncDisabledState();
    this.updateRovingTabindex();
  }

  /**
   * Enforce mutual exclusion: only the radio matching group value is checked.
   */
  private syncChildStates(): void {
    for (const radio of this.radios) {
      radio.checked = radio.value === this.value;
    }
  }

  /**
   * Propagate disabled state to all child radios.
   * Called when disabled property changes or children are discovered.
   */
  private syncDisabledState(): void {
    if (this.disabled) {
      this.radios.forEach((r) => (r.disabled = true));
    }
  }

  /**
   * Manage roving tabindex: only the checked (or first enabled) radio gets tabindex 0.
   * All other radios get tabindex -1. This creates a single tab stop for the group.
   */
  private updateRovingTabindex(): void {
    const enabledRadios = this.radios.filter((r) => !r.disabled);
    if (enabledRadios.length === 0) return;

    const checkedRadio = enabledRadios.find((r) => r.checked);
    const focusTarget = checkedRadio || enabledRadios[0];

    for (const radio of this.radios) {
      // Set tabIndex on the HOST element (lui-radio), not inner shadow DOM
      radio.tabIndex = radio === focusTarget && !radio.disabled ? 0 : -1;
    }
  }

  /**
   * Handle arrow key navigation within the group.
   * Arrow keys move focus AND selection simultaneously with wrapping.
   */
  private handleKeyDown(e: KeyboardEvent): void {
    const arrowKeys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'];
    if (!arrowKeys.includes(e.key)) return;
    e.preventDefault();

    const enabledRadios = this.radios.filter((r) => !r.disabled);
    if (enabledRadios.length === 0) return;

    const currentIndex = enabledRadios.findIndex((r) => r.tabIndex === 0);
    const forward = e.key === 'ArrowDown' || e.key === 'ArrowRight';
    const nextIndex = forward
      ? (currentIndex + 1) % enabledRadios.length
      : (currentIndex - 1 + enabledRadios.length) % enabledRadios.length;

    // Arrow keys MOVE FOCUS AND SELECT simultaneously
    const nextRadio = enabledRadios[nextIndex];
    this.value = nextRadio.value;
    this.touched = true;
    this.syncChildStates();
    this.updateRovingTabindex();
    this.updateFormValue();
    this.validate();
    nextRadio.focus();

    dispatchCustomEvent(this, 'ui-change', {
      value: this.value,
    });
  }

  /**
   * Handle internal ui-radio-change events from child radios.
   * Stops propagation (internal event) and dispatches consumer-facing ui-change.
   */
  private handleRadioChange(e: CustomEvent): void {
    e.stopPropagation(); // Internal event, don't leak to consumer
    this.value = e.detail.value;
    this.touched = true;
    this.syncChildStates();
    this.updateRovingTabindex();
    this.updateFormValue();
    this.validate();

    // Dispatch consumer-facing event
    dispatchCustomEvent(this, 'ui-change', {
      value: this.value,
    });
  }

  /**
   * Sync the selected value to the form via ElementInternals.
   * Submits value when selected, null when nothing selected.
   */
  private updateFormValue(): void {
    this.internals?.setFormValue(this.value || null);
  }

  /**
   * Validate required constraint and sync validity to ElementInternals.
   * @returns true if valid, false if invalid
   */
  private validate(): boolean {
    if (!this.internals) return true;

    if (this.required && !this.value) {
      this.internals.setValidity(
        { valueMissing: true },
        this.error || 'Please select an option.',
        this.radios[0] ||
          (this.shadowRoot?.querySelector('.group-items') as HTMLElement)
      );
      this.showError = this.touched;
      return false;
    }

    this.internals.setValidity({});
    this.showError = false;
    return true;
  }

  /**
   * Form lifecycle callback: reset the group to initial value.
   */
  formResetCallback(): void {
    this.value = this.defaultValue;
    this.syncChildStates();
    this.updateRovingTabindex();
    this.updateFormValue();
    this.touched = false;
    this.showError = false;
    this.internals?.setValidity({});
  }

  /**
   * Form lifecycle callback: handle disabled state from fieldset or form.
   */
  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
    this.syncDisabledState();
    this.updateRovingTabindex();
  }

  override render() {
    return html`
      <div
        class="group-wrapper"
        role="radiogroup"
        aria-labelledby="${this.groupId}-label"
        aria-required=${this.required ? 'true' : nothing}
        @ui-radio-change=${this.handleRadioChange}
        @keydown=${this.handleKeyDown}
      >
        ${this.label
          ? html`<span id="${this.groupId}-label" class="group-label"
              >${this.label}</span
            >`
          : nothing}
        <div class="group-items">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
        ${this.showError
          ? html`<div class="error-text" role="alert">
              ${this.error || 'Please select an option.'}
            </div>`
          : nothing}
      </div>
    `;
  }
}
