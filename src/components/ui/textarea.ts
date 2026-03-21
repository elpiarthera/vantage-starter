/**
 * lui-textarea - A customizable textarea component
 *
 * Features:
 * - Vertical resize by default (configurable: none, vertical, horizontal, both)
 * - Three sizes: sm, md, lg
 * - Form participation via ElementInternals - client-side only
 * - Disabled and readonly states with proper accessibility
 * - SSR compatible via isServer guards
 *
 * @example
 * ```html
 * <lui-textarea size="md"></lui-textarea>
 * <lui-textarea name="comment" placeholder="Enter comment" rows="5"></lui-textarea>
 * <lui-textarea resize="both" label="Description"></lui-textarea>
 * ```
 */

import { html, css, isServer, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';

/**
 * Textarea size types for padding and font sizing
 */
export type TextareaSize = 'sm' | 'md' | 'lg';

/**
 * Textarea resize types for resize handle behavior
 */
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

/**
 * A customizable textarea component with multiple sizes and resize options.
 * Supports form participation via ElementInternals for value submission.
 * Form participation is client-side only (guarded with isServer check).
 */
export class Textarea extends TailwindElement {
  /**
   * Enable form association for this custom element.
   * This allows the textarea to participate in form submission.
   */
  static formAssociated = true;

  /**
   * ElementInternals for form participation.
   * Null during SSR since attachInternals() is not available.
   */
  private internals: ElementInternals | null = null;

  /**
   * Unique ID for the textarea element, used for label association.
   */
  private textareaId = `lui-textarea-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Reference to the native textarea element.
   */
  @query('textarea')
  private textareaEl!: HTMLTextAreaElement;

  /**
   * The size of the textarea affecting padding and font size.
   * @default 'md'
   */
  @property({ type: String })
  size: TextareaSize = 'md';

  /**
   * The name of the textarea for form submission.
   * @default ''
   */
  @property({ type: String })
  name = '';

  /**
   * The current value of the textarea.
   * @default ''
   */
  @property({ type: String })
  value = '';

  /**
   * Placeholder text displayed when textarea is empty.
   * @default ''
   */
  @property({ type: String })
  placeholder = '';

  /**
   * Label text displayed above the textarea.
   * @default ''
   */
  @property({ type: String })
  label = '';

  /**
   * Helper text displayed between label and textarea.
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
   * Initial height of the textarea in rows.
   * @default 3
   */
  @property({ type: Number })
  rows = 3;

  /**
   * Resize behavior of the textarea.
   * @default 'vertical'
   */
  @property({ type: String })
  resize: TextareaResize = 'vertical';

  /**
   * Whether the textarea auto-resizes to fit content.
   * When enabled, resize handle is hidden.
   * @default false
   */
  @property({ type: Boolean })
  autoresize = false;

  /**
   * Maximum number of rows when auto-resizing.
   * Takes precedence after maxHeight.
   */
  @property({ type: Number, attribute: 'max-rows' })
  maxRows?: number;

  /**
   * Maximum height when auto-resizing (CSS value like "200px" or "10rem").
   * Takes precedence over maxRows if both are set.
   */
  @property({ type: String, attribute: 'max-height' })
  maxHeight?: string;

  /**
   * Minimum length for text validation.
   */
  @property({ type: Number })
  minlength?: number;

  /**
   * Maximum length for text validation.
   */
  @property({ type: Number })
  maxlength?: number;

  /**
   * Whether to show character count when maxlength is set.
   * Displays "current/max" format (e.g., "45/200").
   * @default false
   */
  @property({ type: Boolean, attribute: 'show-count' })
  showCount = false;

  /**
   * Whether the textarea is required for form submission.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the textarea is disabled.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the textarea is readonly.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  readonly = false;

  /**
   * Whether the textarea has been touched (blur occurred).
   * Used for validation display timing.
   */
  @state()
  private touched = false;

  /**
   * Whether to show error state.
   * True when textarea is invalid and has been touched.
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

  /**
   * Lifecycle callback when element is first rendered.
   * Sets up initial auto-resize height.
   */
  protected firstUpdated(): void {
    if (this.autoresize) {
      this.adjustHeight();
    }
  }

  /**
   * Adjust textarea height to fit content.
   * Only active when autoresize is enabled.
   */
  private adjustHeight(): void {
    if (!this.autoresize || !this.textareaEl) return;

    const textarea = this.textareaEl;
    const minHeight = this.getMinHeight();

    // Reset height to get accurate scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height
    let newHeight = textarea.scrollHeight;

    // Apply max height constraint if set
    const maxHeightPx = this.getMaxHeightPx();
    if (maxHeightPx && newHeight > maxHeightPx) {
      newHeight = maxHeightPx;
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }

    // Never shrink below initial rows
    if (newHeight < minHeight) {
      newHeight = minHeight;
    }

    textarea.style.height = `${newHeight}px`;
  }

  /**
   * Get minimum height based on rows attribute.
   */
  private getMinHeight(): number {
    const computed = getComputedStyle(this.textareaEl);
    const lineHeight = parseFloat(computed.lineHeight) || 20;
    const paddingTop = parseFloat(computed.paddingTop) || 0;
    const paddingBottom = parseFloat(computed.paddingBottom) || 0;
    const borderTop = parseFloat(computed.borderTopWidth) || 0;
    const borderBottom = parseFloat(computed.borderBottomWidth) || 0;
    return (this.rows * lineHeight) + paddingTop + paddingBottom + borderTop + borderBottom;
  }

  /**
   * Get max height in pixels from maxHeight or maxRows.
   * maxHeight takes precedence if both are set.
   */
  private getMaxHeightPx(): number | null {
    if (this.maxHeight) {
      // Parse CSS value - create temp element for conversion
      const temp = document.createElement('div');
      temp.style.height = this.maxHeight;
      temp.style.position = 'absolute';
      temp.style.visibility = 'hidden';
      document.body.appendChild(temp);
      const height = temp.offsetHeight;
      document.body.removeChild(temp);
      return height > 0 ? height : null;
    }
    if (this.maxRows) {
      const computed = getComputedStyle(this.textareaEl);
      const lineHeight = parseFloat(computed.lineHeight) || 20;
      const paddingTop = parseFloat(computed.paddingTop) || 0;
      const paddingBottom = parseFloat(computed.paddingBottom) || 0;
      const borderTop = parseFloat(computed.borderTopWidth) || 0;
      const borderBottom = parseFloat(computed.borderBottomWidth) || 0;
      return (this.maxRows * lineHeight) + paddingTop + paddingBottom + borderTop + borderBottom;
    }
    return null;
  }

  /**
   * Static styles for the textarea component.
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

      /* Textarea element */
      textarea {
        display: block;
        width: 100%;
        border-radius: var(--ui-input-radius);
        border-width: var(--ui-input-border-width);
        border-style: solid;
        border-color: var(--ui-input-border);
        background-color: var(--ui-input-bg);
        color: var(--ui-input-text);
        transition:
          border-color var(--ui-input-transition),
          box-shadow var(--ui-input-transition);
      }

      textarea::placeholder {
        color: var(--ui-input-placeholder);
      }

      textarea:focus {
        border-color: var(--ui-input-border-focus);
        outline: 2px solid var(--ui-focus-ring-color, var(--ui-textarea-ring));
        outline-offset: 2px;
      }

      /* Error state */
      textarea.textarea-error {
        border-color: var(--ui-input-border-error);
      }

      /* Disabled state */
      textarea:disabled {
        background-color: var(--ui-input-bg-disabled);
        border-color: var(--ui-input-border-disabled);
        color: var(--ui-input-text-disabled);
        cursor: not-allowed;
      }

      /* Readonly state */
      textarea:read-only:not(:disabled) {
        background-color: var(--ui-input-bg-readonly, var(--color-muted));
        cursor: text;
      }

      /* Size variants */
      textarea.textarea-sm {
        padding: var(--ui-input-padding-y-sm) var(--ui-input-padding-x-sm);
        font-size: var(--ui-input-font-size-sm);
      }

      textarea.textarea-md {
        padding: var(--ui-input-padding-y-md) var(--ui-input-padding-x-md);
        font-size: var(--ui-input-font-size-md);
      }

      textarea.textarea-lg {
        padding: var(--ui-input-padding-y-lg) var(--ui-input-padding-x-lg);
        font-size: var(--ui-input-font-size-lg);
      }

      /* Resize variants */
      textarea.resize-none {
        resize: none;
      }

      textarea.resize-vertical {
        resize: vertical;
      }

      textarea.resize-horizontal {
        resize: horizontal;
      }

      textarea.resize-both {
        resize: both;
      }

      /* Auto-resize mode - hide resize handle, smooth transition */
      textarea.autoresize {
        resize: none;
        overflow-y: hidden;
        transition: height 150ms ease-out,
                    border-color var(--ui-input-transition),
                    box-shadow var(--ui-input-transition);
      }

      /* Wrapper for label structure */
      .textarea-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      /* Label styling - scales with size */
      .textarea-label {
        font-weight: 500;
        color: var(--ui-input-text);
      }

      .textarea-label.label-sm {
        font-size: var(--ui-input-font-size-sm);
      }

      .textarea-label.label-md {
        font-size: var(--ui-input-font-size-md);
      }

      .textarea-label.label-lg {
        font-size: var(--ui-input-font-size-lg);
      }

      .required-indicator {
        color: var(--ui-input-text-error);
        margin-left: 0.125rem;
      }

      /* Helper text - below label, above textarea */
      .helper-text {
        font-size: 0.875em;
        color: var(--color-muted-foreground);
      }

      /* Error text - below textarea */
      .error-text {
        font-size: 0.875em;
        color: var(--ui-input-text-error);
      }

      /* Character counter container */
      .textarea-container {
        position: relative;
        display: inline-block;
        width: 100%;
      }

      /* Character counter - positioned inside textarea bottom-right */
      .character-count {
        position: absolute;
        bottom: 0.5rem;
        right: 0.75rem;
        font-size: 0.75rem;
        color: var(--color-muted-foreground);
        pointer-events: none;
        background: var(--ui-input-bg);
        padding: 0 0.25rem;
      }

      /* Extra bottom padding when counter is shown to avoid text overlap */
      textarea.has-counter {
        padding-bottom: 1.75rem;
      }
    `,
  ];

  /**
   * Sync the textarea value to the form via ElementInternals.
   */
  private updateFormValue(): void {
    this.internals?.setFormValue(this.value);
  }

  /**
   * Validate the textarea and sync validity state to ElementInternals.
   * Mirrors native textarea validity to the custom element for form participation.
   * @returns true if valid, false if invalid
   */
  private validate(): boolean {
    const textarea = this.textareaEl;
    if (!textarea || !this.internals) return true;

    const validity = textarea.validity;

    if (!validity.valid) {
      // Map native validity to ElementInternals
      this.internals.setValidity(
        {
          valueMissing: validity.valueMissing,
          tooShort: validity.tooShort,
          tooLong: validity.tooLong,
        },
        textarea.validationMessage,
        textarea // anchor for popup positioning
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
   * Handle input events from the native textarea.
   */
  private handleInput(e: Event): void {
    const textarea = e.target as HTMLTextAreaElement;
    this.value = textarea.value;
    this.updateFormValue();

    // Auto-resize if enabled
    if (this.autoresize) {
      this.adjustHeight();
    }

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
   * Form lifecycle callback: reset the textarea to initial state.
   */
  formResetCallback(): void {
    this.value = '';
    this.touched = false;
    this.showError = false;
    this.internals?.setFormValue('');
    this.internals?.setValidity({});
    if (this.autoresize) {
      // Use requestAnimationFrame to ensure DOM updated
      requestAnimationFrame(() => this.adjustHeight());
    }
  }

  /**
   * Form lifecycle callback: handle disabled state from form.
   */
  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
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
   * Get the CSS classes for the textarea element.
   */
  private getTextareaClasses(): string {
    const classes = [`textarea-${this.size}`];

    if (this.autoresize) {
      classes.push('autoresize');
    } else {
      classes.push(`resize-${this.resize}`);
    }

    if (this.showCount && this.maxlength) {
      classes.push('has-counter');
    }

    if (this.showError) {
      classes.push('textarea-error');
    }

    return classes.join(' ');
  }

  /**
   * Compute aria-describedby value based on error or helper state.
   */
  private getAriaDescribedBy(): string | typeof nothing {
    if (this.showError) {
      return `${this.textareaId}-error`;
    }
    if (this.helperText) {
      return `${this.textareaId}-helper`;
    }
    return nothing;
  }

  override render() {
    return html`
      <div class="textarea-wrapper" part="wrapper">
        ${this.label
          ? html`
              <label
                for=${this.textareaId}
                part="label"
                class="textarea-label label-${this.size}"
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
                id="${this.textareaId}-helper"
                part="helper"
                class="helper-text"
                >${this.helperText}</span
              >
            `
          : nothing}

        <div class="textarea-container">
          <textarea
            id=${this.textareaId}
            part="textarea"
            class=${this.getTextareaClasses()}
            name=${this.name}
            .value=${this.value}
            placeholder=${this.placeholder || nothing}
            rows=${this.rows}
            ?required=${this.required}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            minlength=${this.minlength ?? nothing}
            maxlength=${this.maxlength ?? nothing}
            aria-invalid=${this.showError ? 'true' : nothing}
            aria-describedby=${this.getAriaDescribedBy()}
            @input=${this.handleInput}
            @blur=${this.handleBlur}
          ></textarea>
          ${this.renderCharacterCount()}
        </div>

        ${this.showError && this.errorMessage
          ? html`
              <span
                id="${this.textareaId}-error"
                part="error"
                class="error-text"
                role="alert"
                >${this.errorMessage}</span
              >
            `
          : nothing}
      </div>
    `;
  }
}

// TypeScript global interface declaration for HTMLElementTagNameMap
declare global {
  interface HTMLElementTagNameMap {
    'lui-textarea': Textarea;
  }
}
