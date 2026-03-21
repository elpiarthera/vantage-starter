/**
 * lui-time-picker - Main time picker component with popup, form integration, and presets
 *
 * Composes TimeInput (spinbuttons), ClockFace (visual clock), and TimeDropdown
 * (scrollable list) in a popup for time selection. Supports form participation
 * via ElementInternals, validation (required, min/max, end-after-start), presets,
 * timezone display, and keyboard confirmation.
 *
 * @element lui-time-picker
 * @fires change - Dispatched when a time is selected or cleared, with { value: string, timeValue: TimeValue | null }
 */

import { html, css, nothing, isServer, svg, type PropertyValues, type CSSResultGroup } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles, dispatchCustomEvent } from '@lit-ui/core';
import {
  type TimeValue,
  parseTimeISO,
  timeToISO,
  formatTimeForDisplay,
  getDefaultHourCycle,
  isEndTimeAfterStart,
} from './time-utils.js';
import { type TimePreset, DEFAULT_TIME_PRESETS, resolveNow } from './time-presets.js';
import { computePosition, flip, shift, offset } from '@floating-ui/dom';

/**
 * Accessible time picker component that renders an input display with a popup
 * containing clock face, dropdown, and preset buttons.
 *
 * @example
 * ```html
 * <lui-time-picker label="Start time" name="start" required></lui-time-picker>
 * <lui-time-picker value="14:30:00" hour12 presets></lui-time-picker>
 * ```
 */
export class TimePicker extends TailwindElement {
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
   * Unique ID for accessibility associations.
   */
  private pickerId = `lui-time-picker-${Math.random().toString(36).substr(2, 9)}`;

  // ---------------------------------------------------------------------------
  // Query refs
  // ---------------------------------------------------------------------------

  /**
   * Reference to the input display container (for popup positioning).
   */
  @query('.input-display')
  private inputDisplayEl!: HTMLElement;

  /**
   * Reference to the popup element (for Floating UI positioning).
   */
  @query('.time-picker-popup')
  private popupEl!: HTMLElement;

  /**
   * Reference to the toggle button (for focus restoration).
   */
  @query('.toggle-btn')
  private toggleBtnEl!: HTMLButtonElement;

  // ---------------------------------------------------------------------------
  // SVG Icons
  // ---------------------------------------------------------------------------

  private clockIcon = svg`
    <circle cx="12" cy="12" r="10"
            stroke="currentColor" stroke-width="2" fill="none"/>
    <polyline points="12 6 12 12 16 14"
              stroke="currentColor" stroke-width="2" fill="none"
              stroke-linecap="round" stroke-linejoin="round"/>
  `;

  // ---------------------------------------------------------------------------
  // Public properties
  // ---------------------------------------------------------------------------

  /**
   * The selected time as ISO 8601 string (HH:mm:ss).
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
   * Accessible label text for the time picker.
   */
  @property({ type: String })
  label = '';

  /**
   * Placeholder text shown when no value is set.
   */
  @property({ type: String })
  placeholder = 'Select time';

  /**
   * Whether a time selection is required for form submission.
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the time picker is disabled.
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the time picker is readonly.
   */
  @property({ type: Boolean, reflect: true })
  readonly = false;

  /**
   * Whether to display in 12-hour format with AM/PM.
   * Auto-detected from locale when not explicitly set.
   */
  @property({ type: Boolean, attribute: 'hour12' })
  hour12: boolean | undefined = undefined;

  /**
   * BCP 47 locale tag for formatting (e.g., 'en-US', 'de-DE').
   */
  @property({ type: String })
  locale = 'en-US';

  /**
   * Interval in minutes between dropdown options (1-60).
   */
  @property({ type: Number })
  step = 30;

  /**
   * Minimum selectable time as HH:mm or HH:mm:ss.
   */
  @property({ type: String, attribute: 'min-time' })
  minTime = '';

  /**
   * Maximum selectable time as HH:mm or HH:mm:ss.
   */
  @property({ type: String, attribute: 'max-time' })
  maxTime = '';

  /**
   * Allow midnight-crossing validation (end time before start time is valid).
   */
  @property({ type: Boolean, attribute: 'allow-overnight' })
  allowOvernight = false;

  /**
   * Whether to display a timezone label next to the time value.
   */
  @property({ type: Boolean, attribute: 'show-timezone' })
  showTimezone = false;

  /**
   * IANA timezone identifier (e.g., 'America/New_York').
   * Defaults to the user's local timezone.
   */
  @property({ type: String })
  timezone = '';

  /**
   * Preset buttons for quick time selection.
   * - `false` (default): no presets shown
   * - `true`: show default presets (Morning, Afternoon, Evening)
   * - `TimePreset[]`: show custom preset buttons
   */
  @property({
    converter: {
      fromAttribute: () => true,
    },
  })
  presets: boolean | TimePreset[] = false;

  /**
   * Which popup interface(s) to show.
   * - 'clock': clock face only
   * - 'dropdown': dropdown list only
   * - 'both': tabbed clock face and dropdown
   */
  @property({ type: String, attribute: 'interface-mode' })
  interfaceMode: 'clock' | 'dropdown' | 'both' | 'wheel' | 'range' = 'both';

  /**
   * Business hours range for visual highlighting.
   * - `false` (default): no highlighting
   * - `{ start: number; end: number }`: highlight hours in range (24h format)
   */
  @property({ attribute: false })
  businessHours: { start: number; end: number } | false = false;

  /**
   * Additional IANA timezone identifiers for multi-timezone display.
   * When set, a timezone comparison row appears in the popup.
   * Example: ['America/Los_Angeles', 'Europe/London']
   */
  @property({
    attribute: 'additional-timezones',
    converter: {
      fromAttribute: (value: string | null) =>
        value ? value.split(',').map(s => s.trim()).filter(Boolean) : [],
    },
  })
  additionalTimezones: string[] = [];

  /**
   * Enable voice input button (progressive enhancement).
   * Button hidden when Web Speech API is unavailable.
   */
  @property({ type: Boolean })
  voice = false;

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  /**
   * Whether the popup is currently visible.
   */
  @state()
  private isOpen = false;

  /**
   * Parsed time value from the value string.
   */
  @state()
  private internalValue: TimeValue | null = null;

  /**
   * Which interface tab is active in the popup.
   */
  @state()
  private activeInterface: 'clock' | 'dropdown' = 'clock';

  /**
   * Current mode of the clock face (hour selection or minute selection).
   */
  @state()
  private clockMode: 'hour' | 'minute' = 'hour';

  /**
   * Internal validation error message.
   */
  @state()
  private internalError = '';

  /**
   * Whether the picker has been interacted with (for validation timing).
   */
  @state()
  private touched = false;

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

      .time-picker-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        position: relative;
      }

      .time-picker-label {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--ui-time-picker-label-text, var(--ui-input-text, inherit));
      }

      .required-indicator {
        color: var(--ui-time-picker-error, var(--ui-input-text-error));
        margin-left: 0.125rem;
      }

      .input-display {
        display: flex;
        align-items: center;
        border-radius: var(--ui-time-picker-radius, var(--ui-input-radius, 0.375rem));
        border-width: var(--ui-time-picker-border-width, var(--ui-input-border-width, 1px));
        border-style: solid;
        border-color: var(--ui-time-picker-border, var(--ui-input-border));
        background-color: var(--ui-time-picker-bg, var(--ui-input-bg));
        transition:
          border-color 150ms,
          box-shadow 150ms;
        cursor: pointer;
      }

      .input-display:focus-within {
        border-color: var(--ui-time-picker-border-focus, var(--ui-input-border-focus));
      }

      .input-display.has-error {
        border-color: var(--ui-time-picker-error, var(--ui-input-border-error));
      }

      .input-display.is-disabled {
        background-color: var(--ui-time-picker-bg-disabled, var(--ui-input-bg-disabled));
        border-color: var(--ui-time-picker-border-disabled, var(--ui-input-border-disabled));
        cursor: not-allowed;
      }

      .display-text {
        flex: 1;
        min-width: 0;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        color: var(--ui-time-picker-text, var(--ui-input-text, inherit));
        user-select: none;
      }

      .display-text.is-placeholder {
        color: var(--ui-time-picker-placeholder, var(--ui-input-placeholder));
      }

      .timezone-label {
        font-size: 0.75rem;
        color: var(--ui-time-picker-timezone-text, var(--ui-input-placeholder));
        padding-right: 0.25rem;
        white-space: nowrap;
      }

      .action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.25rem;
        margin-right: 0.25rem;
        border: none;
        background: transparent;
        color: var(--color-muted-foreground, var(--ui-time-picker-muted-text));
        cursor: pointer;
        border-radius: 0.25rem;
        transition:
          color 150ms,
          background-color 150ms;
      }

      .action-button:hover {
        color: var(--ui-time-picker-text, var(--ui-input-text, inherit));
        background-color: var(--color-muted, var(--ui-time-picker-hover-bg));
      }

      .action-button:focus-visible {
        outline: 2px solid var(--color-ring, var(--ui-time-picker-ring));
        outline-offset: 1px;
      }

      .action-icon {
        width: 1.25em;
        height: 1.25em;
      }

      .time-picker-popup {
        position: fixed;
        z-index: var(--ui-time-picker-z-index);
        background-color: var(--ui-time-picker-popup-bg);
        border: 1px solid var(--ui-time-picker-popup-border);
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 260px;
      }

      .interface-tabs {
        display: flex;
        gap: 0.25rem;
        border-bottom: 1px solid var(--ui-time-picker-popup-border);
        padding-bottom: 0.5rem;
      }

      .interface-tab {
        flex: 1;
        padding: 0.375rem 0.5rem;
        font-size: 0.75rem;
        border: 1px solid var(--ui-time-picker-border);
        border-radius: 0.25rem;
        background: var(--ui-time-picker-tab-bg);
        color: var(--ui-time-picker-text, inherit);
        cursor: pointer;
        transition: background-color 150ms, border-color 150ms;
        text-align: center;
      }

      .interface-tab:hover {
        background: var(--ui-time-picker-tab-bg-hover);
      }

      .interface-tab[aria-selected='true'] {
        background: var(--ui-time-picker-primary, var(--color-primary, var(--ui-color-primary)));
        color: white;
        border-color: var(--ui-time-picker-primary, var(--color-primary, var(--ui-color-primary)));
      }

      .interface-tab:focus-visible {
        outline: 2px solid var(--color-ring, var(--ui-time-picker-ring));
        outline-offset: 1px;
      }

      .preset-buttons {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
      }

      .preset-btn {
        flex: 1;
        padding: 0.375rem 0.5rem;
        font-size: 0.75rem;
        border: 1px solid var(--ui-time-picker-preset-border);
        border-radius: 0.25rem;
        background: var(--ui-time-picker-preset-bg);
        color: var(--ui-time-picker-preset-text, inherit);
        cursor: pointer;
        transition: background-color 150ms, border-color 150ms;
        white-space: nowrap;
      }

      .preset-btn:hover:not(:disabled) {
        background: var(--ui-time-picker-preset-bg-hover);
        border-color: var(--ui-time-picker-preset-border-hover);
      }

      .preset-btn:focus-visible {
        outline: 2px solid var(--color-ring, var(--ui-time-picker-ring));
        outline-offset: 1px;
      }

      .preset-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .now-btn {
        background: var(--ui-time-picker-primary, var(--color-primary, var(--ui-color-primary)));
        color: white;
        border-color: var(--ui-time-picker-primary, var(--color-primary, var(--ui-color-primary)));
      }

      .now-btn:hover:not(:disabled) {
        opacity: 0.9;
        background: var(--ui-time-picker-primary, var(--color-primary, var(--ui-color-primary)));
        border-color: var(--ui-time-picker-primary, var(--color-primary, var(--ui-color-primary)));
      }

      .error-message {
        font-size: 0.75rem;
        color: var(--ui-time-picker-error, var(--ui-input-text-error));
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
   * Effective hour12 setting, auto-detected from locale if not explicitly set.
   */
  private get effectiveHour12(): boolean {
    if (this.hour12 !== undefined) return this.hour12;
    return getDefaultHourCycle(this.locale) === 'h12';
  }

  /**
   * Formatted time string for display in the input.
   */
  private get displayValue(): string {
    if (!this.internalValue) return '';
    return formatTimeForDisplay(this.internalValue, this.locale, this.effectiveHour12);
  }

  /**
   * Timezone label text (e.g., "EST", "PST").
   */
  private get timezoneLabel(): string {
    if (!this.showTimezone) return '';
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZoneName: 'short',
        hour: 'numeric',
      };
      if (this.timezone) {
        options.timeZone = this.timezone;
      }
      const parts = new Intl.DateTimeFormat(this.locale, options).formatToParts(new Date());
      const tzPart = parts.find((p) => p.type === 'timeZoneName');
      return tzPart?.value ?? '';
    } catch {
      return '';
    }
  }

  /**
   * Whether the component is in an error state.
   */
  private get hasError(): boolean {
    return !!(this.touched && this.internalError);
  }

  /**
   * Resolved preset array based on the presets property value.
   */
  private get effectivePresets(): TimePreset[] {
    if (this.presets === true) return DEFAULT_TIME_PRESETS;
    if (Array.isArray(this.presets)) return this.presets;
    return [];
  }

  /**
   * Whether presets should be shown (Now button + preset list).
   */
  private get showPresets(): boolean {
    return this.presets === true || (Array.isArray(this.presets) && this.presets.length > 0);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    if (changedProps.has('value')) {
      if (this.value) {
        this.internalValue = parseTimeISO(this.value);
      } else {
        this.internalValue = null;
      }
      this.updateFormValue();
      this.validate();
    }
  }

  // ---------------------------------------------------------------------------
  // Click-outside detection
  // ---------------------------------------------------------------------------

  /**
   * Handle document pointer events for closing popup when clicking outside.
   * Uses composedPath() to work correctly with Shadow DOM boundaries.
   */
  private handleDocumentPointerDown = (e: PointerEvent): void => {
    if (this.isOpen && !e.composedPath().includes(this)) {
      this.closePopup();
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (!isServer) {
      document.addEventListener('pointerdown', this.handleDocumentPointerDown);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (!isServer) {
      document.removeEventListener('pointerdown', this.handleDocumentPointerDown);
    }
  }

  // ---------------------------------------------------------------------------
  // Popup management
  // ---------------------------------------------------------------------------

  /**
   * Open the popup and position it via Floating UI.
   */
  private async openPopup(): Promise<void> {
    if (this.disabled || this.readonly) return;
    this.isOpen = true;
    this.clockMode = 'hour';

    await this.updateComplete;
    this.positionPopup();
    requestAnimationFrame(() => {
      this.focusTimeInput();
    });
  }

  /**
   * Close the popup and restore focus to the toggle button.
   * Marks the component as touched for validation display.
   */
  private closePopup(): void {
    this.isOpen = false;
    this.touched = true;
    requestAnimationFrame(() => {
      this.toggleBtnEl?.focus();
    });
  }

  /**
   * Toggle the popup open/close.
   */
  private togglePopup(): void {
    if (this.isOpen) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  /**
   * Position the popup using Floating UI with flip/shift middleware.
   * Uses fixed strategy to avoid clipping in scrollable containers.
   */
  private async positionPopup(): Promise<void> {
    if (isServer) return;
    if (!this.inputDisplayEl || !this.popupEl) return;

    const { x, y } = await computePosition(this.inputDisplayEl, this.popupEl, {
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
   * Focus the hour spinbutton inside the TimeInput component.
   */
  private focusTimeInput(): void {
    const timeInput = this.shadowRoot?.querySelector('lui-time-input') as HTMLElement | null;
    if (timeInput?.shadowRoot) {
      const hourSpinbutton = timeInput.shadowRoot.querySelector('[role="spinbutton"]') as HTMLElement | null;
      hourSpinbutton?.focus();
    }
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  /**
   * Handle click on the input display area.
   */
  private handleDisplayClick(): void {
    if (!this.isOpen) {
      this.openPopup();
    }
  }

  /**
   * Handle time-input value changes from the spinbuttons.
   */
  private handleTimeInputChange(e: Event): void {
    const detail = (e as CustomEvent).detail;
    if (!detail?.value) return;

    this.internalValue = detail.value as TimeValue;
    this.syncValueFromInternal();
  }

  /**
   * Handle clock face selection events.
   * In hour mode: set hour, switch to minute mode.
   * In minute mode: set minute and close popup.
   */
  private handleClockSelect(e: Event): void {
    const detail = (e as CustomEvent).detail;
    if (!detail) return;

    const selectedValue = detail.value as number;
    const mode = detail.mode as 'hour' | 'minute';

    const current = this.internalValue ?? { hour: 0, minute: 0, second: 0 };

    if (mode === 'hour') {
      this.internalValue = { ...current, hour: selectedValue };
      this.clockMode = 'minute';
      this.syncValueFromInternal();
    } else {
      this.internalValue = { ...current, minute: selectedValue };
      this.syncValueFromInternal();
      this.closePopup();
    }
  }

  /**
   * Handle dropdown time selection.
   */
  private handleDropdownSelect(e: Event): void {
    const detail = (e as CustomEvent).detail;
    if (!detail?.value) return;

    this.internalValue = detail.value as TimeValue;
    this.syncValueFromInternal();
    this.closePopup();
  }

  /**
   * Handle clear button click: reset value.
   */
  private handleClear(e: Event): void {
    e.stopPropagation();
    this.value = '';
    this.internalValue = null;
    this.internalError = '';
    this.updateFormValue();
    this.validate();

    dispatchCustomEvent(this, 'change', {
      value: '',
      timeValue: null,
    });
  }

  /**
   * Handle keyboard events on the popup.
   * Enter confirms and closes, Escape cancels and closes,
   * Tab is trapped within the popup for focus management.
   */
  private handlePopupKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.closePopup();
    } else if (e.key === 'Enter') {
      // Only confirm if the event originated from a spinbutton or the popup itself
      // (not from buttons which handle their own clicks)
      const target = e.target as HTMLElement;
      const isButton = target.tagName === 'BUTTON';
      if (!isButton) {
        e.preventDefault();
        if (this.internalValue) {
          this.syncValueFromInternal();
        }
        this.closePopup();
      }
    } else if (e.key === 'Tab') {
      // Trap focus within the popup — cycle back to time input
      e.preventDefault();
      this.focusTimeInput();
    }
  }

  /**
   * Select the current time via the Now button.
   */
  private selectNow(): void {
    const now = resolveNow();
    this.internalValue = now;
    this.syncValueFromInternal();
    this.closePopup();
  }

  /**
   * Select a preset time value.
   */
  private selectPreset(preset: TimePreset): void {
    const resolved = preset.resolve();
    this.internalValue = resolved;
    this.syncValueFromInternal();
    this.closePopup();
  }

  /**
   * Handle scroll wheel value changes.
   */
  private handleScrollWheelChange(e: Event): void {
    const detail = (e as CustomEvent).detail;
    if (!detail?.value) return;
    this.internalValue = detail.value as TimeValue;
    this.syncValueFromInternal();
  }

  /**
   * Handle voice input time selection.
   */
  private handleVoiceSelect(e: Event): void {
    const detail = (e as CustomEvent).detail;
    if (!detail?.value) return;
    this.internalValue = detail.value as TimeValue;
    this.syncValueFromInternal();
    this.closePopup();
  }

  /**
   * Handle range slider value changes.
   */
  private handleRangeChange(e: Event): void {
    const detail = (e as CustomEvent).detail;
    if (!detail) return;
    // Range slider emits start/end, use startTime as the primary value
    if (detail.startTime) {
      this.internalValue = detail.startTime as TimeValue;
      this.syncValueFromInternal();
    }
  }

  // ---------------------------------------------------------------------------
  // Value synchronization
  // ---------------------------------------------------------------------------

  /**
   * Sync the value string from the internal TimeValue.
   */
  private syncValueFromInternal(): void {
    if (this.internalValue) {
      this.value = timeToISO(this.internalValue);
    } else {
      this.value = '';
    }
    this.updateFormValue();
    this.validate();

    dispatchCustomEvent(this, 'change', {
      value: this.value,
      timeValue: this.internalValue,
    });
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

    const anchor = this.inputDisplayEl ?? undefined;

    // Required check
    if (this.required && !this.value) {
      this.internalError = 'Please select a time';
      this.internals.setValidity(
        { valueMissing: true },
        this.internalError,
        anchor,
      );
      return false;
    }

    if (this.value) {
      // Min time check
      if (this.minTime) {
        const minParsed = parseTimeISO(this.minTime);
        const valParsed = parseTimeISO(this.value);
        if (minParsed && valParsed) {
          const minMinutes = minParsed.hour * 60 + minParsed.minute;
          const valMinutes = valParsed.hour * 60 + valParsed.minute;
          if (valMinutes < minMinutes) {
            const formatted = formatTimeForDisplay(minParsed, this.locale, this.effectiveHour12);
            this.internalError = `Time must be after ${formatted}`;
            this.internals.setValidity(
              { rangeUnderflow: true },
              this.internalError,
              anchor,
            );
            return false;
          }
        }
      }

      // Max time check
      if (this.maxTime) {
        const maxParsed = parseTimeISO(this.maxTime);
        const valParsed = parseTimeISO(this.value);
        if (maxParsed && valParsed) {
          const maxMinutes = maxParsed.hour * 60 + maxParsed.minute;
          const valMinutes = valParsed.hour * 60 + valParsed.minute;
          if (valMinutes > maxMinutes) {
            const formatted = formatTimeForDisplay(maxParsed, this.locale, this.effectiveHour12);
            this.internalError = `Time must be before ${formatted}`;
            this.internals.setValidity(
              { rangeOverflow: true },
              this.internalError,
              anchor,
            );
            return false;
          }
        }
      }

      // End-after-start validation (when minTime is used as start constraint)
      if (this.minTime && !isEndTimeAfterStart(this.minTime, this.value, this.allowOvernight)) {
        const minParsed = parseTimeISO(this.minTime);
        const formatted = minParsed
          ? formatTimeForDisplay(minParsed, this.locale, this.effectiveHour12)
          : this.minTime;
        this.internalError = `Time must be after ${formatted}`;
        this.internals.setValidity(
          { rangeUnderflow: true },
          this.internalError,
          anchor,
        );
        return false;
      }
    }

    // All valid
    this.internalError = '';
    this.internals.setValidity({});
    return true;
  }

  /**
   * Form lifecycle callback: reset to initial state.
   */
  formResetCallback(): void {
    this.value = '';
    this.internalValue = null;
    this.internalError = '';
    this.touched = false;
    this.isOpen = false;
    this.internals?.setFormValue(null);
    this.internals?.setValidity({});
  }

  /**
   * Form lifecycle callback: handle disabled state from form.
   */
  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  /**
   * Form lifecycle callback: restore form state.
   */
  formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === 'string') {
      this.value = state;
      this.internalValue = parseTimeISO(state);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  override render() {
    const showValue = this.displayValue;
    const hasValue = !!this.value && !this.readonly && !this.disabled;

    return html`
      <div class="time-picker-wrapper">
        ${this.label
          ? html`
              <label
                class="time-picker-label"
                id="${this.pickerId}-label"
              >
                ${this.label}
                ${this.required
                  ? html`<span class="required-indicator">*</span>`
                  : nothing}
              </label>
            `
          : nothing}

        <div
          class="input-display ${this.hasError ? 'has-error' : ''} ${this.disabled ? 'is-disabled' : ''}"
          @click=${this.handleDisplayClick}
          aria-labelledby=${this.label ? `${this.pickerId}-label` : nothing}
          aria-invalid=${this.hasError ? 'true' : nothing}
        >
          <span class="display-text ${!showValue ? 'is-placeholder' : ''}">
            ${showValue || this.placeholder}
          </span>

          ${this.showTimezone && this.timezoneLabel
            ? html`<span class="timezone-label">${this.timezoneLabel}</span>`
            : nothing}

          ${hasValue
            ? html`
                <button
                  type="button"
                  class="action-button clear-btn"
                  aria-label="Clear time"
                  @click=${this.handleClear}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
                    ${svg`
                      <circle cx="12" cy="12" r="10"
                              stroke="currentColor" stroke-width="2" fill="none"/>
                      <line x1="15" y1="9" x2="9" y2="15"
                            stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round"/>
                      <line x1="9" y1="9" x2="15" y2="15"
                            stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round"/>
                    `}
                  </svg>
                </button>
              `
            : nothing}

          <button
            type="button"
            class="action-button toggle-btn"
            aria-label="Toggle time picker"
            ?disabled=${this.disabled}
            @click=${(e: Event) => { e.stopPropagation(); this.togglePopup(); }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
              ${this.clockIcon}
            </svg>
          </button>

          ${this.voice
            ? html`
                <lui-time-voice-input
                  .locale=${this.locale}
                  ?disabled=${this.disabled || this.readonly}
                  @ui-voice-time-select=${this.handleVoiceSelect}
                ></lui-time-voice-input>
              `
            : nothing}
        </div>

        ${this.hasError && this.internalError
          ? html`
              <span
                class="error-message"
                role="alert"
              >${this.internalError}</span>
            `
          : nothing}

        ${this.isOpen
          ? html`
              <div
                class="time-picker-popup"
                role="dialog"
                aria-modal="true"
                aria-label="Select time"
                @keydown=${this.handlePopupKeydown}
              >
                <lui-time-input
                  .value=${this.internalValue}
                  .hour12=${this.effectiveHour12}
                  ?disabled=${this.disabled}
                  ?readonly=${this.readonly}
                  @ui-time-input-change=${this.handleTimeInputChange}
                ></lui-time-input>

                ${this.renderInterfaceTabs()}
                ${this.renderActiveInterface()}
                ${this.renderPresets()}
                ${this.additionalTimezones.length > 0
                  ? html`
                      <lui-timezone-display
                        .value=${this.internalValue}
                        .locale=${this.locale}
                        .hour12=${this.effectiveHour12}
                        .primaryTimezone=${this.timezone}
                        .additionalTimezones=${this.additionalTimezones}
                      ></lui-timezone-display>
                    `
                  : nothing}
              </div>
            `
          : nothing}
      </div>
    `;
  }

  /**
   * Render interface tabs when both clock and dropdown are available.
   */
  private renderInterfaceTabs() {
    if (this.interfaceMode !== 'both') return nothing;

    return html`
      <div class="interface-tabs" role="tablist">
        <button
          type="button"
          class="interface-tab"
          role="tab"
          aria-selected=${this.activeInterface === 'clock' ? 'true' : 'false'}
          @click=${() => { this.activeInterface = 'clock'; }}
        >Clock</button>
        <button
          type="button"
          class="interface-tab"
          role="tab"
          aria-selected=${this.activeInterface === 'dropdown' ? 'true' : 'false'}
          @click=${() => { this.activeInterface = 'dropdown'; }}
        >List</button>
      </div>
    `;
  }

  /**
   * Render the active interface (clock face or dropdown).
   */
  private renderActiveInterface() {
    const showWheel = this.interfaceMode === 'wheel';
    const showRange = this.interfaceMode === 'range';
    const showClock =
      this.interfaceMode === 'clock' ||
      (this.interfaceMode === 'both' && this.activeInterface === 'clock');
    const showDropdown =
      this.interfaceMode === 'dropdown' ||
      (this.interfaceMode === 'both' && this.activeInterface === 'dropdown');

    if (showWheel) {
      return html`
        <lui-time-scroll-wheel
          .value=${this.internalValue}
          .hour12=${this.effectiveHour12}
          .step=${this.step}
          ?disabled=${this.disabled}
          @ui-scroll-wheel-change=${this.handleScrollWheelChange}
        ></lui-time-scroll-wheel>
      `;
    }

    if (showRange) {
      return html`
        <lui-time-range-slider
          .startMinutes=${this.internalValue ? this.internalValue.hour * 60 + this.internalValue.minute : 540}
          .endMinutes=${1020}
          .step=${this.step}
          .hour12=${this.effectiveHour12}
          .locale=${this.locale}
          ?disabled=${this.disabled}
          @ui-time-range-change=${this.handleRangeChange}
        ></lui-time-range-slider>
      `;
    }

    if (showClock) {
      return html`
        <lui-clock-face
          .mode=${this.clockMode}
          .hour=${this.internalValue?.hour ?? 0}
          .minute=${this.internalValue?.minute ?? 0}
          .hour12=${this.effectiveHour12}
          .step=${this.step}
          .businessHours=${this.businessHours}
          ?disabled=${this.disabled}
          @clock-select=${this.handleClockSelect}
        ></lui-clock-face>
      `;
    }

    if (showDropdown) {
      return html`
        <lui-time-dropdown
          .value=${this.internalValue}
          .step=${this.step}
          .hour12=${this.effectiveHour12}
          .locale=${this.locale}
          .minTime=${this.minTime}
          .maxTime=${this.maxTime}
          .businessHours=${this.businessHours}
          ?disabled=${this.disabled}
          @ui-time-dropdown-select=${this.handleDropdownSelect}
        ></lui-time-dropdown>
      `;
    }

    return nothing;
  }

  /**
   * Render preset buttons (Now + configured presets).
   */
  private renderPresets() {
    if (!this.showPresets) return nothing;

    const presetList = this.effectivePresets;

    return html`
      <div class="preset-buttons">
        <button
          type="button"
          class="preset-btn now-btn"
          ?disabled=${this.disabled || this.readonly}
          @click=${this.selectNow}
        >Now</button>
        ${presetList.map(
          (preset) => html`
            <button
              type="button"
              class="preset-btn"
              ?disabled=${this.disabled || this.readonly}
              @click=${() => this.selectPreset(preset)}
            >${preset.label}</button>
          `,
        )}
      </div>
    `;
  }
}

// TypeScript global interface declaration for HTMLElementTagNameMap
declare global {
  interface HTMLElementTagNameMap {
    'lui-time-picker': TimePicker;
  }
}
