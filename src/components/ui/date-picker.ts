/**
 * lui-date-picker - Accessible date picker component
 *
 * Composes an input field with lui-calendar inside a popup for date selection.
 * Supports text input parsing, calendar selection, form integration via
 * ElementInternals, and clear functionality.
 *
 * Features:
 * - Input field with locale-aware placeholder
 * - Calendar popup with lui-calendar for visual date selection
 * - Multi-format date parsing on blur (ISO, US, EU formats)
 * - Clear button to reset value
 * - Form participation via ElementInternals (ISO 8601 submission)
 * - SSR compatible via isServer guards
 * - Dark mode via CSS custom properties (tokens defined in tailwind.css)
 *
 * @element lui-date-picker
 * @fires change - Dispatched when a date is selected or cleared, with { date: Date | null, isoString: string }
 */

import { html, css, nothing, isServer, svg, type PropertyValues, type CSSResultGroup } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles, dispatchCustomEvent } from '@lit-ui/core';
import { parseDateInput, formatDateForDisplay, getPlaceholderText } from './date-input-parser.js';
import { type DatePreset, DEFAULT_PRESETS } from './preset-types.js';
import { parseISO, isBefore, isAfter, startOfDay, format } from 'date-fns';
import { computePosition, flip, shift, offset } from '@floating-ui/dom';

/**
 * Date picker component that renders an input field with a calendar popup.
 *
 * @example
 * ```html
 * <lui-date-picker label="Birthday" name="birthday" required></lui-date-picker>
 * <lui-date-picker value="2026-01-31" locale="de-DE"></lui-date-picker>
 * ```
 */
export class DatePicker extends TailwindElement {
  /**
   * Enable form association for this custom element.
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
  private inputId = `lui-date-picker-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Reference to the trigger element for focus restoration after popup close.
   * Used by Plan 04 for focus management.
   */
  private triggerElement: HTMLElement | null = null;

  // ---------------------------------------------------------------------------
  // Query refs
  // ---------------------------------------------------------------------------

  /**
   * Reference to the input container element (for popup positioning in Plan 03).
   */
  @query('.input-container')
  inputContainerEl!: HTMLElement;

  /**
   * Reference to the popup element (for Floating UI positioning in Plan 03).
   */
  @query('.popup')
  popupEl!: HTMLElement;

  /**
   * Reference to the native input element.
   */
  @query('input')
  inputEl!: HTMLInputElement;

  // ---------------------------------------------------------------------------
  // Properties (reflected attributes)
  // ---------------------------------------------------------------------------

  /**
   * The selected date as ISO 8601 string (YYYY-MM-DD).
   * This is the canonical form value submitted via ElementInternals.
   */
  @property({ type: String, reflect: true })
  value = '';

  /**
   * Form field name for form submission.
   */
  @property({ type: String })
  name = '';

  /**
   * BCP 47 locale tag for localization (e.g., 'en-US', 'de-DE').
   * Defaults to navigator.language on client, 'en-US' on server.
   */
  @property({ type: String })
  locale = '';

  /**
   * Custom placeholder text for the input.
   * Falls back to locale-aware placeholder from getPlaceholderText().
   */
  @property({ type: String })
  placeholder = '';

  /**
   * Helper text displayed below the input.
   */
  @property({ type: String, attribute: 'helper-text' })
  helperText = '';

  /**
   * Minimum selectable date as ISO string (YYYY-MM-DD).
   */
  @property({ type: String, attribute: 'min-date' })
  minDate = '';

  /**
   * Maximum selectable date as ISO string (YYYY-MM-DD).
   */
  @property({ type: String, attribute: 'max-date' })
  maxDate = '';

  /**
   * Whether a date selection is required for form submission.
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the date picker is disabled.
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Render an always-visible calendar without popup/input wrapper.
   * In inline mode, the input field, popup, Floating UI, click-outside,
   * and focus trap are all skipped. Label, presets, error, and helper
   * text are still rendered.
   */
  @property({ type: Boolean, reflect: true })
  inline = false;

  /**
   * External error message. When set, overrides internal validation errors.
   */
  @property({ type: String })
  error = '';

  /**
   * Accessible label for the input field.
   */
  @property({ type: String })
  label = '';

  // ---------------------------------------------------------------------------
  // Properties (JS-only, not reflected)
  // ---------------------------------------------------------------------------

  /**
   * Preset buttons for quick date selection.
   * - `false` (default): no presets shown
   * - `true`: show default presets (Today, Tomorrow, Next Week)
   * - `DatePreset[]`: show custom preset buttons
   */
  @property({
    converter: {
      fromAttribute: () => true,
    },
  })
  presets: DatePreset[] | boolean = false;

  /**
   * Custom Intl.DateTimeFormatOptions for display formatting.
   * When null (default), uses { year: 'numeric', month: 'long', day: 'numeric' }.
   * Only affects display — input parsing still accepts any parseable format.
   */
  @property({ attribute: false })
  format: Intl.DateTimeFormatOptions | null = null;

  // ---------------------------------------------------------------------------
  // State (internal reactive)
  // ---------------------------------------------------------------------------

  /**
   * Whether the calendar popup is visible.
   */
  @state()
  private open = false;

  /**
   * Formatted date string for display in the input (e.g., "January 31, 2026").
   */
  @state()
  private displayValue = '';

  /**
   * Raw text being typed by the user while the input is focused.
   */
  @state()
  private inputValue = '';

  /**
   * Whether the input is currently focused for typing.
   */
  @state()
  private isEditing = false;

  /**
   * Whether the input has been blurred at least once (for validation timing).
   */
  @state()
  private touched = false;

  /**
   * Internal validation error message.
   */
  @state()
  private internalError = '';

  // ---------------------------------------------------------------------------
  // SVG Icons
  // ---------------------------------------------------------------------------

  private calendarIcon = svg`
    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
          stroke="currentColor" stroke-width="2" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
  `;

  private clearIcon = svg`
    <circle cx="12" cy="12" r="10"
            stroke="currentColor" stroke-width="2" fill="none"/>
    <line x1="15" y1="9" x2="9" y2="15"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="9" y1="9" x2="15" y2="15"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round"/>
  `;

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  static override styles: CSSResultGroup = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: inline-block;
        width: 100%;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      .date-picker-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        position: relative;
      }

      .date-picker-label {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--ui-date-picker-label-text);
      }

      .required-indicator {
        color: var(--ui-date-picker-error, var(--ui-input-text-error));
        margin-left: 0.125rem;
      }

      .input-container {
        display: flex;
        align-items: center;
        border-radius: var(--ui-date-picker-radius, var(--ui-input-radius));
        border-width: var(--ui-date-picker-border-width, var(--ui-input-border-width));
        border-style: solid;
        border-color: var(--ui-date-picker-border, var(--ui-input-border));
        background-color: var(--ui-date-picker-bg, var(--ui-input-bg));
        transition:
          border-color 150ms,
          box-shadow 150ms;
      }

      .input-container:focus-within {
        border-color: var(--ui-date-picker-border-focus, var(--ui-input-border-focus));
      }

      .input-container.container-error {
        border-color: var(--ui-date-picker-error, var(--ui-input-border-error));
      }

      .input-container.container-disabled {
        background-color: var(--ui-date-picker-bg-disabled, var(--ui-input-bg-disabled));
        border-color: var(--ui-date-picker-border-disabled, var(--ui-input-border-disabled));
        cursor: not-allowed;
      }

      input {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        color: var(--ui-date-picker-text, var(--ui-input-text));
        outline: none;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
      }

      input::placeholder {
        color: var(--ui-date-picker-placeholder, var(--ui-input-placeholder));
      }

      input:disabled {
        color: var(--ui-date-picker-text-disabled, var(--ui-input-text-disabled));
        cursor: not-allowed;
      }

      .action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        margin-right: 0.25rem;
        border: none;
        background: transparent;
        color: var(--ui-date-picker-action-text);
        cursor: pointer;
        border-radius: 0.25rem;
        transition:
          color 150ms,
          background-color 150ms;
      }

      .action-button:hover {
        color: var(--ui-date-picker-text, var(--ui-input-text));
        background-color: var(--ui-date-picker-hover-bg);
      }

      .action-button:focus-visible {
        outline: 2px solid var(--ui-date-picker-ring);
        outline-offset: 1px;
      }

      .action-icon {
        width: 1.25em;
        height: 1.25em;
      }

      .helper-text {
        font-size: 0.75rem;
        color: var(--ui-date-picker-helper-text);
      }

      .error-text {
        font-size: 0.75rem;
        color: var(--ui-date-picker-error, var(--ui-input-text-error));
      }

      .popup {
        position: fixed;
        inset: auto;
        margin: 0;
        z-index: var(--ui-date-picker-z-index);
        background-color: var(--ui-date-picker-popup-bg);
        border: 1px solid var(--ui-date-picker-popup-border);
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      }

      .preset-buttons {
        display: flex;
        gap: 0.25rem;
        padding: 0.5rem;
        border-bottom: 1px solid var(--ui-date-picker-popup-border);
      }

      .preset-button {
        flex: 1;
        padding: 0.375rem 0.5rem;
        font-size: 0.75rem;
        border: 1px solid var(--ui-date-picker-preset-border);
        border-radius: 0.25rem;
        background: var(--ui-date-picker-preset-bg);
        color: var(--ui-date-picker-preset-text);
        cursor: pointer;
        transition: background-color 150ms, border-color 150ms;
        white-space: nowrap;
      }

      .preset-button:hover:not(:disabled) {
        background: var(--ui-date-picker-preset-bg-hover);
        border-color: var(--ui-date-picker-preset-border-hover);
      }

      .preset-button:focus-visible {
        outline: 2px solid var(--ui-date-picker-ring);
        outline-offset: 1px;
      }

      .preset-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

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

      /* Inline mode */
      :host([inline]) {
        width: auto;
        display: inline-block;
      }

      .inline-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

    `,
  ];

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  constructor() {
    super();
    if (!isServer) {
      this.internals = this.attachInternals();
    }
  }

  // ---------------------------------------------------------------------------
  // Computed getters
  // ---------------------------------------------------------------------------

  /**
   * Resolved locale, falling back to navigator.language or 'en-US'.
   */
  get effectiveLocale(): string {
    return this.locale || (isServer ? 'en-US' : navigator.language);
  }

  /**
   * Effective placeholder text, using custom or locale-aware default.
   */
  get effectivePlaceholder(): string {
    return this.placeholder || getPlaceholderText(this.effectiveLocale);
  }

  /**
   * Whether the component is in an error state.
   */
  get hasError(): boolean {
    return !!(this.error || (this.touched && this.internalError));
  }

  /**
   * The current error message to display.
   */
  get errorMessage(): string {
    return this.error || this.internalError;
  }

  /**
   * Resolved preset array based on the presets property value.
   */
  private get effectivePresets(): DatePreset[] {
    if (this.presets === true) return DEFAULT_PRESETS;
    if (Array.isArray(this.presets)) return this.presets;
    return [];
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * React to property changes: sync displayValue and form value when value changes.
   */
  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    if (changedProps.has('value')) {
      if (this.value) {
        const date = parseISO(this.value);
        this.displayValue = formatDateForDisplay(date, this.effectiveLocale, this.format ?? undefined);
        this.updateFormValue();
      } else {
        this.displayValue = '';
        this.updateFormValue();
      }
      // Sync ElementInternals validity when value changes programmatically
      this.validate();
    }
  }

  // ---------------------------------------------------------------------------
  // Click-outside detection
  // ---------------------------------------------------------------------------

  /**
   * Handle document clicks for closing popup when clicking outside.
   * Uses composedPath() to work correctly with Shadow DOM boundaries.
   */
  private handleDocumentClick = (e: MouseEvent): void => {
    if (this.open && !e.composedPath().includes(this)) {
      this.closePopup();
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (!isServer && !this.inline) {
      document.addEventListener('click', this.handleDocumentClick);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (!isServer && !this.inline) {
      document.removeEventListener('click', this.handleDocumentClick);
    }
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  /**
   * Handle input focus: switch to editing mode.
   */
  private handleInputFocus(): void {
    this.isEditing = true;
    this.inputValue = this.displayValue;
  }

  /**
   * Handle input blur: parse typed text and validate.
   * Sets internalError for display and syncs ElementInternals validity.
   */
  private handleInputBlur(): void {
    this.isEditing = false;
    this.touched = true;

    const trimmed = this.inputValue.trim();

    if (trimmed) {
      const parsed = parseDateInput(trimmed, this.effectiveLocale);
      if (parsed) {
        const isoString = format(parsed, 'yyyy-MM-dd');

        // Validate against min/max constraints
        if (this.minDate) {
          const min = startOfDay(parseISO(this.minDate));
          if (isBefore(startOfDay(parsed), min)) {
            this.internalError = `Date must be on or after ${this.minDate}`;
            this.internals?.setValidity(
              { rangeUnderflow: true },
              this.internalError,
              this.inputEl
            );
            return;
          }
        }
        if (this.maxDate) {
          const max = startOfDay(parseISO(this.maxDate));
          if (isAfter(startOfDay(parsed), max)) {
            this.internalError = `Date must be on or before ${this.maxDate}`;
            this.internals?.setValidity(
              { rangeOverflow: true },
              this.internalError,
              this.inputEl
            );
            return;
          }
        }

        this.value = isoString;
        this.displayValue = formatDateForDisplay(parsed, this.effectiveLocale, this.format ?? undefined);
        this.internalError = '';
        this.updateFormValue();
        this.validate();
        dispatchCustomEvent(this, 'change', {
          date: parsed,
          isoString: this.value,
        });
      } else {
        // Unparseable text — badInput
        this.internalError = 'Please enter a valid date';
        this.internals?.setValidity(
          { badInput: true },
          this.internalError,
          this.inputEl
        );
      }
    } else if (this.required) {
      this.internalError = 'Please select a date';
      this.internals?.setValidity(
        { valueMissing: true },
        this.internalError,
        this.inputEl
      );
    } else {
      // Empty input, not required: clear everything
      this.internalError = '';
      this.internals?.setValidity({});
      if (this.value) {
        this.value = '';
        this.displayValue = '';
        this.updateFormValue();
        dispatchCustomEvent(this, 'change', {
          date: null,
          isoString: '',
        });
      }
    }
  }

  /**
   * Handle text input changes.
   */
  private handleInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.inputValue = input.value;
    // Clear validation error while user is typing
    this.internalError = '';
  }

  /**
   * Handle keyboard events on the input.
   */
  private handleInputKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      // Blur to trigger parse
      this.inputEl?.blur();
    } else if (e.key === 'Escape') {
      if (this.open) {
        this.closePopup();
      } else {
        this.inputEl?.blur();
      }
    } else if (e.key === 'ArrowDown') {
      if (!this.open) {
        e.preventDefault();
        this.openPopup();
      }
    }
  }

  /**
   * Toggle the calendar popup open/close.
   */
  private togglePopup(): void {
    if (this.inline) return;
    if (this.open) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  /**
   * Open the calendar popup and position it via Floating UI.
   * Focuses the calendar after positioning for keyboard accessibility.
   */
  private async openPopup(): Promise<void> {
    if (this.inline) return;
    if (this.disabled) return;
    this.open = true;
    this.triggerElement = this.inputEl;

    // Wait for popup to render, then promote to top layer, position, and focus
    await this.updateComplete;
    this.popupEl?.showPopover();
    this.positionPopup();
    requestAnimationFrame(() => {
      this.focusCalendar();
    });
  }

  /**
   * Close the calendar popup and restore focus to the trigger element.
   */
  private closePopup(): void {
    try { this.popupEl?.hidePopover(); } catch { /* already hidden or removed */ }
    this.open = false;
    requestAnimationFrame(() => {
      this.triggerElement?.focus();
      this.triggerElement = null;
    });
  }

  /**
   * Focus the lui-calendar element inside the popup.
   * The calendar manages its own internal keyboard navigation.
   */
  private focusCalendar(): void {
    const calendar = this.shadowRoot?.querySelector('lui-calendar') as HTMLElement | null;
    calendar?.focus();
  }

  /**
   * Position the popup using Floating UI with flip/shift middleware.
   * Uses fixed strategy to avoid clipping in scrollable containers.
   */
  private async positionPopup(): Promise<void> {
    if (isServer) return;
    if (!this.inputContainerEl || !this.popupEl) return;

    const { x, y } = await computePosition(this.inputContainerEl, this.popupEl, {
      placement: 'bottom-start',
      strategy: 'fixed',
      middleware: [
        offset(4),
        flip({ fallbackPlacements: ['top-start'] }),
        shift({ padding: 8 }),
      ],
    });

    Object.assign(this.popupEl.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  }

  /**
   * Handle date selection from the calendar popup.
   */
  private handleCalendarSelect(e: Event): void {
    const detail = (e as CustomEvent).detail;
    if (!detail) return;

    const date = detail.date as Date;
    const isoString = detail.isoString as string;

    this.value = isoString;
    this.displayValue = formatDateForDisplay(date, this.effectiveLocale, this.format ?? undefined);
    this.internalError = '';
    this.updateFormValue();
    this.validate();

    // Close popup (restores focus to input) — skip in inline mode
    if (!this.inline) {
      this.closePopup();
    }

    dispatchCustomEvent(this, 'change', {
      date,
      isoString: this.value,
    });
  }

  /**
   * Handle clear button click: reset all state.
   */
  private handleClear(): void {
    this.value = '';
    this.displayValue = '';
    this.inputValue = '';
    this.internalError = '';
    this.updateFormValue();
    this.inputEl?.focus();

    dispatchCustomEvent(this, 'change', {
      date: null,
      isoString: '',
    });
  }

  /**
   * Handle keyboard events on the popup.
   * Traps Tab/Shift+Tab within the popup and handles Escape to close.
   * Respects calendar's defaultPrevented for Escape key (view drilling).
   */
  private handlePopupKeydown(e: KeyboardEvent): void {
    if (e.key === 'Tab') {
      // Trap focus within the popup — keep focus on the calendar
      e.preventDefault();
      this.focusCalendar();
    } else if (e.key === 'Escape') {
      // If the calendar already handled Escape (e.g., drilling from year to month view),
      // don't close the popup
      if (!e.defaultPrevented) {
        this.closePopup();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Form integration
  // ---------------------------------------------------------------------------

  /**
   * Sync the current value to the form via ElementInternals.
   */
  private updateFormValue(): void {
    this.internals?.setFormValue(this.value || null);
  }

  /**
   * Validate the current state and set validity on ElementInternals.
   */
  private validate(): boolean {
    if (!this.internals) return true;

    // In inline mode there is no input element to use as anchor.
    const anchor = this.inputEl ?? undefined;

    if (this.required && !this.value) {
      this.internals.setValidity(
        { valueMissing: true },
        'Please select a date',
        anchor
      );
      return false;
    }

    if (this.value && this.minDate) {
      const date = startOfDay(parseISO(this.value));
      const min = startOfDay(parseISO(this.minDate));
      if (isBefore(date, min)) {
        this.internals.setValidity(
          { rangeUnderflow: true },
          `Date must be on or after ${this.minDate}`,
          anchor
        );
        return false;
      }
    }

    if (this.value && this.maxDate) {
      const date = startOfDay(parseISO(this.value));
      const max = startOfDay(parseISO(this.maxDate));
      if (isAfter(date, max)) {
        this.internals.setValidity(
          { rangeOverflow: true },
          `Date must be on or before ${this.maxDate}`,
          anchor
        );
        return false;
      }
    }

    this.internals.setValidity({});
    return true;
  }

  /**
   * Form lifecycle callback: reset the date picker to initial state.
   */
  formResetCallback(): void {
    this.value = '';
    this.displayValue = '';
    this.inputValue = '';
    this.internalError = '';
    this.touched = false;
    this.open = false;
    this.internals?.setFormValue(null);
    this.internals?.setValidity({});
  }

  /**
   * Form lifecycle callback: handle disabled state from form.
   */
  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ---------------------------------------------------------------------------
  // Presets
  // ---------------------------------------------------------------------------

  /**
   * Check if a preset's resolved date falls outside min/max constraints.
   */
  private isPresetDisabled(date: Date): boolean {
    const day = startOfDay(date);
    if (this.minDate) {
      const min = startOfDay(parseISO(this.minDate));
      if (isBefore(day, min)) return true;
    }
    if (this.maxDate) {
      const max = startOfDay(parseISO(this.maxDate));
      if (isAfter(day, max)) return true;
    }
    return false;
  }

  /**
   * Handle click on a preset button: select the date, close popup, dispatch event.
   */
  private handlePresetSelect(preset: DatePreset): void {
    const date = preset.resolve();
    this.value = format(date, 'yyyy-MM-dd');
    this.displayValue = formatDateForDisplay(date, this.effectiveLocale, this.format ?? undefined);
    this.internalError = '';
    this.updateFormValue();
    this.validate();
    if (!this.inline) {
      this.closePopup();
    }

    dispatchCustomEvent(this, 'change', {
      date,
      isoString: this.value,
    });
  }

  /**
   * Render preset buttons above the calendar in the popup.
   * Returns nothing if no presets are configured.
   */
  private renderPresets() {
    const presets = this.effectivePresets;
    if (presets.length === 0) return nothing;

    return html`
      <div class="preset-buttons">
        ${presets.map((preset) => {
          const resolved = preset.resolve();
          const isDisabledPreset = this.isPresetDisabled(resolved);
          return html`
            <button
              type="button"
              class="preset-button ${isDisabledPreset ? 'preset-disabled' : ''}"
              ?disabled=${isDisabledPreset}
              @click=${() => this.handlePresetSelect(preset)}
            >${preset.label}</button>
          `;
        })}
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Inline mode
  // ---------------------------------------------------------------------------

  /**
   * Render the inline (always-visible) calendar layout.
   * Skips input field, popup, Floating UI, click-outside, and focus trap.
   * Still renders label, presets, calendar, helper text, and error text.
   */
  private renderInlineCalendar() {
    return html`
      <div class="inline-wrapper">
        ${this.label
          ? html`
              <span class="date-picker-label">
                ${this.label}
                ${this.required
                  ? html`<span class="required-indicator">*</span>`
                  : nothing}
              </span>
            `
          : nothing}

        ${this.renderPresets()}

        <lui-calendar
          .value=${this.value}
          .locale=${this.effectiveLocale}
          min-date=${this.minDate || nothing}
          max-date=${this.maxDate || nothing}
          ?show-constraint-tooltips=${!!(this.minDate || this.maxDate)}
          @change=${this.handleCalendarSelect}
        ></lui-calendar>

        ${this.helperText && !this.hasError
          ? html`<span class="helper-text">${this.helperText}</span>`
          : nothing}

        ${this.hasError && this.errorMessage
          ? html`<span class="error-text" role="alert">${this.errorMessage}</span>`
          : nothing}
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  override render() {
    if (this.inline) {
      return this.renderInlineCalendar();
    }

    const showInputValue = this.isEditing ? this.inputValue : this.displayValue;

    return html`
      <div class="date-picker-wrapper">
        ${this.label
          ? html`
              <label
                for=${this.inputId}
                class="date-picker-label"
              >
                ${this.label}
                ${this.required
                  ? html`<span class="required-indicator">*</span>`
                  : nothing}
              </label>
            `
          : nothing}

        <div
          class="input-container ${this.hasError ? 'container-error' : ''} ${this.disabled ? 'container-disabled' : ''}"
        >
          <input
            id=${this.inputId}
            type="text"
            .value=${showInputValue}
            placeholder=${this.effectivePlaceholder}
            ?required=${this.required}
            ?disabled=${this.disabled}
            aria-invalid=${this.hasError ? 'true' : nothing}
            aria-errormessage=${this.hasError ? `${this.inputId}-error` : nothing}
            aria-describedby=${this.hasError
              ? `${this.inputId}-error`
              : this.helperText
                ? `${this.inputId}-helper`
                : nothing}
            aria-label=${!this.label ? 'Date' : nothing}
            @focus=${this.handleInputFocus}
            @blur=${this.handleInputBlur}
            @input=${this.handleInput}
            @keydown=${this.handleInputKeydown}
          />

          ${this.value && !this.disabled
            ? html`
                <button
                  type="button"
                  class="action-button"
                  aria-label="Clear date"
                  @click=${this.handleClear}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
                    ${this.clearIcon}
                  </svg>
                </button>
              `
            : nothing}

          <button
            type="button"
            class="action-button"
            aria-label="Open calendar"
            ?disabled=${this.disabled}
            @click=${this.togglePopup}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
              ${this.calendarIcon}
            </svg>
          </button>
        </div>

        ${this.helperText && !this.hasError
          ? html`
              <span
                id="${this.inputId}-helper"
                class="helper-text"
              >${this.helperText}</span>
            `
          : nothing}

        ${this.hasError && this.errorMessage
          ? html`
              <span
                id="${this.inputId}-error"
                class="error-text"
                role="alert"
              >${this.errorMessage}</span>
            `
          : nothing}

        ${this.open
          ? html`
              <div
                class="popup"
                popover="manual"
                role="dialog"
                aria-modal="true"
                aria-label="Choose date"
                @keydown=${this.handlePopupKeydown}
              >
                ${this.renderPresets()}
                <lui-calendar
                  .value=${this.value}
                  .locale=${this.effectiveLocale}
                  min-date=${this.minDate || nothing}
                  max-date=${this.maxDate || nothing}
                  ?show-constraint-tooltips=${!!(this.minDate || this.maxDate)}
                  @change=${this.handleCalendarSelect}
                ></lui-calendar>

              </div>
            `
          : nothing}
      </div>
    `;
  }
}

// TypeScript global interface declaration for HTMLElementTagNameMap
declare global {
  interface HTMLElementTagNameMap {
    'lui-date-picker': DatePicker;
  }
}
