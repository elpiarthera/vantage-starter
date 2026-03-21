/**
 * lui-input - A customizable input component
 *
 * Features:
 * - Five input types: text, email, password, number, search
 * - Three sizes: sm, md, lg
 * - Form participation via ElementInternals - client-side only
 * - Disabled state with proper accessibility
 * - SSR compatible via isServer guards
 *
 * @example
 * ```html
 * <lui-input type="text" size="md"></lui-input>
 * <lui-input type="email" name="email" placeholder="Enter email"></lui-input>
 * <lui-input type="password" size="lg"></lui-input>
 * ```
 */

import { html, css, svg, isServer, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';

/**
 * Input type types for HTML input type attribute
 */
export type InputType = 'text' | 'email' | 'password' | 'number' | 'search';

/**
 * Input size types for padding and font sizing
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * A customizable input component with multiple types and sizes.
 * Supports form participation via ElementInternals for value submission.
 * Form participation is client-side only (guarded with isServer check).
 *
 * @slot prefix - Content displayed before the input text (e.g., currency symbol, icon)
 * @slot suffix - Content displayed after the input text (e.g., unit label, icon)
 */
export class Input extends TailwindElement {
  /**
   * Enable form association for this custom element.
   * This allows the input to participate in form submission.
   */
  static formAssociated = true;

  /**
   * ElementInternals for form participation.
   * Null during SSR since attachInternals() is not available.
   */
  private internals: ElementInternals | null = null;

  /**
   * Unique ID for the input element, used for label association.
   */
  private inputId = `lui-input-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Reference to the native input element.
   */
  @query('input')
  private inputEl!: HTMLInputElement;

  /**
   * The type of input (text, email, password, number, search).
   * @default 'text'
   */
  @property({ type: String })
  type: InputType = 'text';

  /**
   * The size of the input affecting padding and font size.
   * @default 'md'
   */
  @property({ type: String })
  size: InputSize = 'md';

  /**
   * The name of the input for form submission.
   * @default ''
   */
  @property({ type: String })
  name = '';

  /**
   * The current value of the input.
   * @default ''
   */
  @property({ type: String })
  value = '';

  /**
   * Placeholder text displayed when input is empty.
   * @default ''
   */
  @property({ type: String })
  placeholder = '';

  /**
   * Whether the input is disabled.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the input is readonly.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  readonly = false;

  /**
   * Whether the input is required for form submission.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Minimum length for text input validation.
   */
  @property({ type: Number })
  minlength?: number;

  /**
   * Maximum length for text input validation.
   */
  @property({ type: Number })
  maxlength?: number;

  /**
   * Regular expression pattern for validation.
   * @default ''
   */
  @property({ type: String })
  pattern = '';

  /**
   * Minimum value for number input validation.
   */
  @property({ type: Number })
  min?: number;

  /**
   * Maximum value for number input validation.
   */
  @property({ type: Number })
  max?: number;

  /**
   * Label text displayed above the input.
   * @default ''
   */
  @property({ type: String })
  label = '';

  /**
   * Helper text displayed between label and input.
   * @default ''
   */
  @property({ type: String, attribute: 'helper-text' })
  helperText = '';

  /**
   * Required indicator style: 'asterisk' shows *, 'text' shows "(required)".
   * @default 'asterisk'
   */
  @property({ type: String, attribute: 'required-indicator' })
  requiredIndicator: 'asterisk' | 'text' = 'asterisk';

  /**
   * Whether to show a clear button when the input has a value.
   * @default false
   */
  @property({ type: Boolean })
  clearable = false;

  /**
   * Whether to show character count when maxlength is set.
   * Displays "current/max" format (e.g., "45/200").
   * @default false
   */
  @property({ type: Boolean, attribute: 'show-count' })
  showCount = false;

  /**
   * Whether the input has been touched (blur occurred).
   * Used for validation display timing.
   */
  @state()
  private touched = false;

  /**
   * Whether to show error state.
   * True when input is invalid and has been touched.
   */
  @state()
  private showError = false;

  /**
   * Whether the password is currently visible (for type="password").
   */
  @state()
  private passwordVisible = false;

  /**
   * Whether the prefix slot has content.
   */
  @state()
  private hasPrefixContent = false;

  /**
   * Whether the suffix slot has content.
   */
  @state()
  private hasSuffixContent = false;

  /**
   * Eye icon SVG (password hidden state - click to show).
   */
  private eyeIcon = svg`
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
          stroke="currentColor" stroke-width="2" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="12" r="3"
            stroke="currentColor" stroke-width="2" fill="none"/>
  `;

  /**
   * Eye-off icon SVG (password visible state - click to hide).
   */
  private eyeOffIcon = svg`
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
          stroke="currentColor" stroke-width="2" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="1" y1="1" x2="23" y2="23"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
  `;

  /**
   * X-circle icon SVG for clear button.
   */
  private xCircleIcon = svg`
    <circle cx="12" cy="12" r="10"
            stroke="currentColor" stroke-width="2" fill="none"/>
    <line x1="15" y1="9" x2="9" y2="15"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="9" y1="9" x2="15" y2="15"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
  `;

  constructor() {
    super();
    // Only attach internals on client (not during SSR)
    if (!isServer) {
      this.internals = this.attachInternals();
    }
  }

  /**
   * Static styles for the input component.
   * Uses CSS custom properties from Phase 26 tokens.
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

      /* Input container - flex layout for prefix/suffix slots */
      .input-container {
        display: flex;
        align-items: center;
        border-radius: var(--ui-input-radius);
        border-width: var(--ui-input-border-width);
        border-style: solid;
        border-color: var(--ui-input-border);
        background-color: var(--ui-input-bg);
        transition:
          border-color var(--ui-input-transition),
          box-shadow var(--ui-input-transition);
      }

      .input-container:focus-within {
        border-color: var(--ui-input-border-focus);
        outline: 2px solid var(--ui-focus-ring-color, var(--ui-input-ring));
        outline-offset: 2px;
      }

      .input-container.container-error {
        border-color: var(--ui-input-border-error);
      }

      .input-container.container-disabled {
        background-color: var(--ui-input-bg-disabled);
        border-color: var(--ui-input-border-disabled);
        cursor: not-allowed;
      }

      .input-container.container-readonly {
        background-color: var(--ui-input-bg-readonly, var(--color-muted));
      }

      /* Input element - remove border/bg when inside container */
      input {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        color: var(--ui-input-text);
        outline: none;
      }

      input::placeholder {
        color: var(--ui-input-placeholder);
      }

      /* Disabled state */
      input:disabled {
        color: var(--ui-input-text-disabled);
        cursor: not-allowed;
      }

      /* Readonly state */
      input:read-only:not(:disabled) {
        cursor: text;
      }

      /* Size variants for input */
      input.input-sm {
        padding: var(--ui-input-padding-y-sm) var(--ui-input-padding-x-sm);
        font-size: var(--ui-input-font-size-sm);
      }

      input.input-md {
        padding: var(--ui-input-padding-y-md) var(--ui-input-padding-x-md);
        font-size: var(--ui-input-font-size-md);
      }

      input.input-lg {
        padding: var(--ui-input-padding-y-lg) var(--ui-input-padding-x-lg);
        font-size: var(--ui-input-font-size-lg);
      }

      /* Slot styling - hidden by default, shown when has content */
      .input-slot {
        display: none;
        align-items: center;
      }

      .input-slot.has-content {
        display: flex;
      }

      .prefix-slot.has-content {
        padding-left: var(--ui-input-padding-x-md);
      }

      .suffix-slot.has-content {
        padding-right: var(--ui-input-padding-x-md);
      }

      /* Size-specific slot padding */
      .container-sm .prefix-slot.has-content {
        padding-left: var(--ui-input-padding-x-sm);
      }

      .container-sm .suffix-slot.has-content {
        padding-right: var(--ui-input-padding-x-sm);
      }

      .container-lg .prefix-slot.has-content {
        padding-left: var(--ui-input-padding-x-lg);
      }

      .container-lg .suffix-slot.has-content {
        padding-right: var(--ui-input-padding-x-lg);
      }

      /* Wrapper for label structure */
      .input-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      /* Label styling - scales with size */
      .input-label {
        font-weight: 500;
        color: var(--ui-input-text);
      }

      .input-label.label-sm {
        font-size: var(--ui-input-font-size-sm);
      }

      .input-label.label-md {
        font-size: var(--ui-input-font-size-md);
      }

      .input-label.label-lg {
        font-size: var(--ui-input-font-size-lg);
      }

      .required-indicator {
        color: var(--ui-input-text-error);
        margin-left: 0.125rem;
      }

      /* Helper text - below label, above input */
      .helper-text {
        font-size: 0.875em;
        color: var(--color-muted-foreground);
      }

      /* Error text - below input */
      .error-text {
        font-size: 0.875em;
        color: var(--ui-input-text-error);
      }

      /* Password toggle button */
      .password-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        margin-right: 0.25rem;
        border: none;
        background: transparent;
        color: var(--color-muted-foreground);
        cursor: pointer;
        border-radius: var(--radius-sm, 0.25rem);
        transition:
          color 150ms,
          background-color 150ms;
      }

      .password-toggle:hover {
        color: var(--ui-input-text);
        background-color: var(--color-muted);
      }

      .password-toggle:focus-visible {
        outline: 2px solid var(--color-ring);
        outline-offset: 1px;
      }

      .toggle-icon {
        width: 1.25em;
        height: 1.25em;
      }

      /* Clear button */
      .clear-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        margin-right: 0.25rem;
        border: none;
        background: transparent;
        color: var(--color-muted-foreground);
        cursor: pointer;
        border-radius: var(--radius-sm, 0.25rem);
        transition:
          color 150ms,
          background-color 150ms;
      }

      .clear-button:hover {
        color: var(--ui-input-text);
        background-color: var(--color-muted);
      }

      .clear-button:focus-visible {
        outline: 2px solid var(--color-ring);
        outline-offset: 1px;
      }

      .clear-icon {
        width: 1.25em;
        height: 1.25em;
      }

      /* Character counter */
      .character-count {
        font-size: 0.75rem;
        color: var(--color-muted-foreground);
        padding-right: var(--ui-input-padding-x-md);
        white-space: nowrap;
      }

      .container-sm .character-count {
        padding-right: var(--ui-input-padding-x-sm);
      }

      .container-lg .character-count {
        padding-right: var(--ui-input-padding-x-lg);
      }

      /* Visually hidden for screen reader only text */
      .visually-hidden {
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

  /**
   * Sync the input value to the form via ElementInternals.
   */
  private updateFormValue(): void {
    this.internals?.setFormValue(this.value);
  }

  /**
   * Validate the input and sync validity state to ElementInternals.
   * Mirrors native input validity to the custom element for form participation.
   * @returns true if valid, false if invalid
   */
  private validate(): boolean {
    const input = this.inputEl;
    if (!input || !this.internals) return true;

    const validity = input.validity;

    if (!validity.valid) {
      // Map native validity to ElementInternals
      this.internals.setValidity(
        {
          valueMissing: validity.valueMissing,
          typeMismatch: validity.typeMismatch,
          patternMismatch: validity.patternMismatch,
          tooShort: validity.tooShort,
          tooLong: validity.tooLong,
          rangeUnderflow: validity.rangeUnderflow,
          rangeOverflow: validity.rangeOverflow,
        },
        input.validationMessage,
        input // anchor for popup positioning
      );
      return false;
    }

    // Clear validity when valid
    this.internals.setValidity({});
    return true;
  }

  /**
   * Get the current validation error message.
   */
  private get errorMessage(): string {
    return this.internals?.validationMessage || '';
  }

  /**
   * Handle input events from the native input.
   */
  private handleInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this.updateFormValue();

    // Re-validate if already touched (blur occurred)
    if (this.touched) {
      const isValid = this.validate();
      this.showError = !isValid;
    }
  }

  /**
   * Handle blur events for validation display timing.
   */
  private handleBlur(): void {
    this.touched = true;
    const isValid = this.validate();
    this.showError = !isValid;
  }

  /**
   * Handle container click to focus input.
   * Allows clicking on prefix/suffix areas to focus the input,
   * while not interfering with interactive content (buttons, links).
   */
  private handleContainerClick(e: Event): void {
    const target = e.target as HTMLElement;
    // Focus if clicking container directly or slot area (not interactive content)
    if (
      target === e.currentTarget ||
      (target.closest('slot') && !target.closest('button, a, input'))
    ) {
      this.inputEl?.focus();
    }
  }

  /**
   * Handle prefix slot change to track if content exists.
   */
  private handlePrefixSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this.hasPrefixContent = slot.assignedNodes().length > 0;
  }

  /**
   * Handle suffix slot change to track if content exists.
   */
  private handleSuffixSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this.hasSuffixContent = slot.assignedNodes().length > 0;
  }

  /**
   * Toggle password visibility between hidden and visible.
   */
  private togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  /**
   * Render the password visibility toggle button.
   */
  private renderPasswordToggle() {
    return html`
      <button
        type="button"
        class="password-toggle"
        aria-pressed=${this.passwordVisible}
        aria-controls=${this.inputId}
        @click=${this.togglePasswordVisibility}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          class="toggle-icon"
        >
          ${this.passwordVisible ? this.eyeOffIcon : this.eyeIcon}
        </svg>
        <span class="visually-hidden">
          ${this.passwordVisible ? 'Hide password' : 'Show password'}
        </span>
      </button>
    `;
  }

  /**
   * Render the live region for password toggle announcements.
   */
  private renderPasswordLiveRegion() {
    if (this.type !== 'password') return nothing;
    return html`
      <span class="visually-hidden" role="status" aria-live="polite">
        ${this.passwordVisible ? 'Password shown' : 'Password hidden'}
      </span>
    `;
  }

  /**
   * Handle clear button click - empties value and returns focus to input.
   */
  private handleClear(): void {
    this.value = '';
    this.updateFormValue();
    this.inputEl?.focus();

    // Re-validate if already touched
    if (this.touched) {
      const isValid = this.validate();
      this.showError = !isValid;
    }
  }

  /**
   * Render the clear button for clearable inputs with value.
   */
  private renderClearButton() {
    return html`
      <button
        type="button"
        class="clear-button"
        aria-label="Clear input"
        @click=${this.handleClear}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" class="clear-icon">
          ${this.xCircleIcon}
        </svg>
      </button>
    `;
  }

  /**
   * Render the character counter if showCount and maxlength are set.
   */
  private renderCharacterCount() {
    if (!this.showCount || !this.maxlength) return nothing;

    return html`
      <span class="character-count" part="counter">
        ${this.value.length}/${this.maxlength}
      </span>
    `;
  }

  /**
   * Form lifecycle callback: reset the input to initial state.
   */
  formResetCallback(): void {
    this.value = '';
    this.touched = false;
    this.showError = false;
    this.passwordVisible = false;
    this.internals?.setFormValue('');
    this.internals?.setValidity({});
  }

  /**
   * Form lifecycle callback: handle disabled state from form.
   */
  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  /**
   * Get the CSS classes for the input element.
   */
  private getInputClasses(): string {
    return `input-${this.size}`;
  }

  /**
   * Get the CSS classes for the input container.
   */
  private getContainerClasses(): string {
    const classes = [`container-${this.size}`];
    if (this.showError) {
      classes.push('container-error');
    }
    if (this.disabled) {
      classes.push('container-disabled');
    }
    if (this.readonly) {
      classes.push('container-readonly');
    }
    return classes.join(' ');
  }

  /**
   * Compute aria-describedby value based on error or helper state.
   */
  private getAriaDescribedBy(): string | typeof nothing {
    if (this.showError) {
      return `${this.inputId}-error`;
    }
    if (this.helperText) {
      return `${this.inputId}-helper`;
    }
    return nothing;
  }

  override render() {
    return html`
      <div class="input-wrapper" part="wrapper">
        ${this.label
          ? html`
              <label
                for=${this.inputId}
                part="label"
                class="input-label label-${this.size}"
              >
                ${this.label}
                ${this.required
                  ? html`<span class="required-indicator"
                      >${this.requiredIndicator === 'text'
                        ? ' (required)'
                        : '*'}</span
                    >`
                  : nothing}
              </label>
            `
          : nothing}
        ${this.helperText
          ? html`
              <span
                id="${this.inputId}-helper"
                part="helper"
                class="helper-text"
                >${this.helperText}</span
              >
            `
          : nothing}

        <div
          class="input-container ${this.getContainerClasses()}"
          part="container"
          @click=${this.handleContainerClick}
        >
          <slot
            name="prefix"
            part="prefix"
            class="input-slot prefix-slot ${this.hasPrefixContent ? 'has-content' : ''}"
            @slotchange=${this.handlePrefixSlotChange}
          ></slot>
          <input
            id=${this.inputId}
            part="input"
            class=${this.getInputClasses()}
            type=${this.type === 'password' && this.passwordVisible
              ? 'text'
              : this.type}
            name=${this.name}
            .value=${this.value}
            placeholder=${this.placeholder || nothing}
            ?required=${this.required}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            minlength=${this.minlength ?? nothing}
            maxlength=${this.maxlength ?? nothing}
            min=${this.min ?? nothing}
            max=${this.max ?? nothing}
            pattern=${this.pattern || nothing}
            aria-invalid=${this.showError ? 'true' : nothing}
            aria-describedby=${this.getAriaDescribedBy()}
            @input=${this.handleInput}
            @blur=${this.handleBlur}
          />
          ${this.type === 'password' ? this.renderPasswordToggle() : nothing}
          ${this.clearable && this.value ? this.renderClearButton() : nothing}
          ${this.renderCharacterCount()}
          <slot
            name="suffix"
            part="suffix"
            class="input-slot suffix-slot ${this.hasSuffixContent ? 'has-content' : ''}"
            @slotchange=${this.handleSuffixSlotChange}
          ></slot>
        </div>

        ${this.showError && this.errorMessage
          ? html`
              <span
                id="${this.inputId}-error"
                part="error"
                class="error-text"
                role="alert"
                >${this.errorMessage}</span
              >
            `
          : nothing}
        ${this.renderPasswordLiveRegion()}
      </div>
    `;
  }
}

// TypeScript global interface declaration for HTMLElementTagNameMap
declare global {
  interface HTMLElementTagNameMap {
    'lui-input': Input;
  }
}
