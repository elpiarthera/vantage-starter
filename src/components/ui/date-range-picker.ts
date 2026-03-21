/**
 * lui-date-range-picker - Accessible date range picker component
 *
 * Composes two calendars for selecting a date range with a two-click
 * state machine (idle -> start-selected -> complete).
 * Supports form integration via ElementInternals, range validation,
 * and auto-swap of start/end dates.
 *
 * Features:
 * - Two-click range selection with visual preview on hover
 * - Auto-swap when end date is before start date (DRP-09)
 * - Min/max day constraints for range duration
 * - Form participation via ElementInternals (ISO 8601 interval submission)
 * - SSR compatible via isServer guards
 *
 * @element lui-date-range-picker
 * @fires change - Dispatched when a range is selected or cleared, with { startDate, endDate, isoInterval }
 */

import { html, css, nothing, isServer, svg, type PropertyValues, type CSSResultGroup } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles, dispatchCustomEvent } from '@lit-ui/core';
import { addMonths, subMonths, getYear, format, isBefore as isBeforeDate, isAfter as isAfterDate } from '@lit-ui/calendar';
import type { DayCellState } from '@lit-ui/calendar';
import { normalizeRange, validateRangeDuration, formatISOInterval, isDateInRange, isDateInPreview, computeRangeDuration } from './range-utils.js';
import type { DateRangePreset } from './range-preset-types.js';
import { DEFAULT_RANGE_PRESETS } from './range-preset-types.js';
import { computePosition, flip, shift, offset } from '@floating-ui/dom';
import { parseISO } from 'date-fns';

/**
 * The three states of the range selection state machine.
 * - 'idle': No selection in progress
 * - 'start-selected': First date clicked, awaiting second click
 * - 'complete': Both dates selected, range is complete
 */
type RangeState = 'idle' | 'start-selected' | 'complete';

/**
 * Date range picker component with two-click selection state machine.
 *
 * @example
 * ```html
 * <lui-date-range-picker label="Trip dates" name="trip"></lui-date-range-picker>
 * <lui-date-range-picker start-date="2026-01-10" end-date="2026-01-20"></lui-date-range-picker>
 * ```
 */
export class DateRangePicker extends TailwindElement {
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
  private inputId = `lui-date-range-picker-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Reference to the trigger element for focus restoration after popup close.
   */
  private triggerElement: HTMLElement | null = null;

  // ---------------------------------------------------------------------------
  // Query refs
  // ---------------------------------------------------------------------------

  /**
   * Reference to the input container element (for popup positioning).
   */
  @query('.input-container')
  inputContainerEl!: HTMLElement;

  /**
   * Reference to the popup element (for Floating UI positioning).
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
   * The selected start date as ISO 8601 string (YYYY-MM-DD).
   */
  @property({ type: String, reflect: true, attribute: 'start-date' })
  startDate = '';

  /**
   * The selected end date as ISO 8601 string (YYYY-MM-DD).
   */
  @property({ type: String, reflect: true, attribute: 'end-date' })
  endDate = '';

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
   */
  @property({ type: String })
  placeholder = '';

  /**
   * Accessible label for the date range picker.
   */
  @property({ type: String })
  label = '';

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
   * Minimum range duration in days (inclusive). 0 = no minimum.
   */
  @property({ type: Number, attribute: 'min-days' })
  minDays = 0;

  /**
   * Maximum range duration in days (inclusive). 0 = unlimited.
   */
  @property({ type: Number, attribute: 'max-days' })
  maxDays = 0;

  /**
   * Whether a range selection is required for form submission.
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the date range picker is disabled.
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * External error message. When set, overrides internal validation errors.
   */
  @property({ type: String })
  error = '';

  /**
   * Enable comparison mode for selecting two independent date ranges.
   * When true, toggle buttons appear to switch between primary and comparison ranges.
   */
  @property({ type: Boolean, reflect: true })
  comparison = false;

  /**
   * The comparison range start date as ISO 8601 string (YYYY-MM-DD).
   */
  @property({ type: String, reflect: true, attribute: 'compare-start-date' })
  compareStartDate = '';

  /**
   * The comparison range end date as ISO 8601 string (YYYY-MM-DD).
   */
  @property({ type: String, reflect: true, attribute: 'compare-end-date' })
  compareEndDate = '';

  /**
   * Preset range buttons for quick one-click selection.
   * - false: no presets (default)
   * - true: use DEFAULT_RANGE_PRESETS (Last 7 Days, Last 30 Days, This Month)
   * - DateRangePreset[]: custom presets array
   */
  @property({
    converter: {
      fromAttribute: () => true,
    },
  })
  presets: DateRangePreset[] | boolean = false;

  // ---------------------------------------------------------------------------
  // State (internal reactive)
  // ---------------------------------------------------------------------------

  /**
   * Current state of the range selection state machine.
   */
  @state()
  private rangeState: RangeState = 'idle';

  /**
   * ISO string of the currently hovered date for preview highlighting.
   */
  @state()
  private hoveredDate = '';

  /**
   * Whether the popup is open.
   */
  @state()
  private isOpen = false;

  /**
   * The first calendar's displayed month.
   */
  @state()
  private currentMonth: Date = new Date();

  /**
   * Internal validation error message.
   */
  @state()
  private internalError = '';

  /**
   * Whether a pointer drag selection is in progress.
   * True from pointerdown on a day cell until pointerup.
   */
  @state()
  private isDragging = false;

  /**
   * Which range is currently being selected: primary or comparison.
   * Only relevant when comparison mode is enabled.
   */
  @state()
  private selectionTarget: 'primary' | 'comparison' = 'primary';

  /**
   * Current state of the comparison range selection state machine.
   */
  @state()
  private compareRangeState: RangeState = 'idle';

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  static override styles: CSSResultGroup = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
        width: 100%;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      .date-range-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        position: relative;
      }

      .date-range-label {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--ui-date-range-label-text);
      }

      .required-indicator {
        color: var(--ui-date-range-error, var(--ui-input-text-error));
        margin-left: 0.125rem;
      }

      .input-container {
        display: flex;
        align-items: center;
        border-radius: var(--ui-date-range-radius, var(--ui-input-radius));
        border-width: var(--ui-date-range-border-width, var(--ui-input-border-width));
        border-style: solid;
        border-color: var(--ui-date-range-border, var(--ui-input-border));
        background-color: var(--ui-date-range-bg, var(--ui-input-bg));
        transition:
          border-color 150ms,
          box-shadow 150ms;
        cursor: pointer;
      }

      .input-container:focus-within {
        border-color: var(--ui-date-range-border-focus, var(--ui-input-border-focus));
      }

      .input-container.container-error {
        border-color: var(--ui-date-range-error, var(--ui-input-border-error));
      }

      .input-container.container-disabled {
        background-color: var(--ui-date-range-bg-disabled, var(--ui-input-bg-disabled));
        border-color: var(--ui-date-range-border-disabled, var(--ui-input-border-disabled));
        cursor: not-allowed;
      }

      input {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        color: var(--ui-date-range-text, var(--ui-input-text));
        outline: none;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        cursor: pointer;
      }

      input::placeholder {
        color: var(--ui-date-range-placeholder, var(--ui-input-placeholder));
      }

      input:disabled {
        color: var(--ui-date-range-text-disabled, var(--ui-input-text-disabled));
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
        color: var(--ui-date-range-action-text);
        cursor: pointer;
        border-radius: 0.25rem;
        transition:
          color 150ms,
          background-color 150ms;
      }

      .action-button:hover {
        color: var(--ui-date-range-text, var(--ui-input-text));
        background-color: var(--ui-date-range-hover-bg);
      }

      .action-button:focus-visible {
        outline: 2px solid var(--ui-date-range-ring);
        outline-offset: 1px;
      }

      .action-icon {
        width: 1.25em;
        height: 1.25em;
      }

      .popup {
        position: fixed;
        inset: auto;
        margin: 0;
        z-index: var(--ui-date-range-z-index, 50);
        background-color: var(--ui-date-range-popup-bg);
        border: 1px solid var(--ui-date-range-popup-border);
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        padding: 0.5rem;
      }

      .helper-text {
        font-size: 0.75rem;
        color: var(--ui-date-range-helper-text);
      }

      .error-text {
        font-size: 0.75rem;
        color: var(--ui-date-range-error, var(--ui-input-text-error));
      }

      .popup-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
        border-top: 1px solid var(--ui-date-range-footer-border);
        margin-top: 0.25rem;
      }

      .footer-status {
        font-size: 0.75rem;
        color: var(--ui-date-range-helper-text);
      }

      .footer-clear-button {
        font-size: 0.75rem;
        padding: 0.25rem 0.75rem;
        border: 1px solid var(--ui-date-range-clear-border);
        border-radius: 0.25rem;
        background: transparent;
        color: var(--ui-date-range-clear-text);
        cursor: pointer;
        transition: background-color 150ms, border-color 150ms;
      }

      .footer-clear-button:hover {
        background-color: var(--ui-date-range-clear-hover-bg);
        border-color: var(--ui-date-range-clear-hover-border);
      }

      .footer-clear-button:focus-visible {
        outline: 2px solid var(--ui-date-range-ring);
        outline-offset: 1px;
      }

      .range-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
      }

      .range-heading {
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0;
      }

      .calendars-wrapper {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .calendars-wrapper > * {
        min-width: 240px;
        flex: 1 1 280px;
      }

      .nav-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border: none;
        background: none;
        cursor: pointer;
        border-radius: var(--ui-calendar-radius, 0.375rem);
        color: var(--ui-calendar-nav-color, currentColor);
      }

      .nav-button:hover {
        background-color: var(--ui-date-range-hover-bg);
      }

      .nav-button:focus-visible {
        outline: 2px solid var(--ui-date-range-ring);
        outline-offset: 2px;
      }

      .nav-button svg {
        width: 1rem;
        height: 1rem;
      }

      .popup-body {
        display: flex;
      }

      .preset-sidebar {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.5rem;
        border-right: 1px solid var(--ui-date-range-sidebar-border);
        min-width: 120px;
      }

      .preset-button {
        font-size: 0.75rem;
        padding: 0.375rem 0.75rem;
        border: none;
        border-radius: 0.25rem;
        background: transparent;
        color: var(--ui-date-range-text, var(--ui-input-text));
        cursor: pointer;
        text-align: left;
        white-space: nowrap;
        transition: background-color 150ms;
      }

      .preset-button:hover:not(:disabled) {
        background-color: var(--ui-date-range-hover-bg);
      }

      .preset-button:focus-visible {
        outline: 2px solid var(--ui-date-range-ring);
        outline-offset: 1px;
      }

      .preset-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Prevent text selection during pointer drag */
      .calendars-wrapper.dragging {
        user-select: none;
        -webkit-user-select: none;
      }

      /* Comparison toggle buttons */
      .comparison-toggle {
        display: flex;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        border-bottom: 1px solid var(--ui-date-range-popup-border);
      }

      .toggle-button {
        flex: 1;
        font-size: 0.75rem;
        padding: 0.375rem 0.5rem;
        border: 1px solid var(--ui-date-range-toggle-border);
        border-radius: 0.25rem;
        background: transparent;
        color: var(--ui-date-range-toggle-text);
        cursor: pointer;
        transition: background-color 150ms, border-color 150ms;
      }

      .toggle-button:hover {
        background-color: var(--ui-date-range-toggle-hover-bg);
      }

      .toggle-button:focus-visible {
        outline: 2px solid var(--ui-date-range-ring);
        outline-offset: 1px;
      }

      .toggle-active.toggle-primary {
        background-color: var(--ui-range-selected-bg, var(--color-primary));
        color: var(--ui-range-selected-text);
        border-color: var(--ui-range-selected-bg, var(--color-primary));
      }

      .toggle-active.toggle-comparison {
        background-color: var(--ui-date-range-compare-bg);
        color: var(--ui-date-range-compare-text);
        border-color: var(--ui-date-range-compare-bg);
      }

      /* Media query: vertical stacking for narrow viewports */
      @media (max-width: 599px) {
        .popup-body {
          flex-direction: column;
        }

        .preset-sidebar {
          flex-direction: row;
          flex-wrap: wrap;
          border-right: none;
          border-bottom: 1px solid var(--ui-date-range-sidebar-border);
        }

        .calendars-wrapper {
          flex-direction: column;
        }
      }

      /* Media query: wider gap for spacious viewports */
      @media (min-width: 800px) {
        .calendars-wrapper {
          gap: 1.5rem;
        }
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
   * Whether the component is in an error state.
   */
  get hasError(): boolean {
    return !!(this.error || this.internalError);
  }

  /**
   * The current error message to display.
   */
  get displayError(): string {
    return this.error || this.internalError;
  }

  /**
   * Formatted display value for the input field.
   * - Both dates: "Jan 15 – Jan 22, 2026"
   * - Only start: "Jan 15, 2026 – ..."
   * - None: empty (shows placeholder)
   */
  get displayValue(): string {
    if (!this.startDate) return '';

    const startDate = parseISO(this.startDate);
    const locale = this.effectiveLocale;

    if (this.startDate && this.endDate) {
      const endDate = parseISO(this.endDate);
      const sameYear = startDate.getFullYear() === endDate.getFullYear();

      if (sameYear) {
        // "Jan 15 – Jan 22, 2026"
        const startFmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
        const endFmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' });
        return `${startFmt.format(startDate)} \u2013 ${endFmt.format(endDate)}`;
      }

      // Cross-year: "Dec 28, 2025 – Jan 5, 2026"
      const fullFmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' });
      return `${fullFmt.format(startDate)} \u2013 ${fullFmt.format(endDate)}`;
    }

    // Only start date: "Jan 15, 2026 – ..."
    const startFmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startFmt.format(startDate)} \u2013 ...`;
  }

  /**
   * Effective placeholder text for the input.
   */
  get effectivePlaceholder(): string {
    return this.placeholder || 'Select date range';
  }

  /**
   * Status message for the popup footer based on current selection state.
   */
  get selectionStatus(): string {
    if (this.comparison && this.selectionTarget === 'comparison') {
      if (this.compareRangeState === 'idle') return 'Click a date to start comparison range';
      if (this.compareRangeState === 'start-selected') return 'Click another date to complete comparison';
      if (this.compareRangeState === 'complete') return this.displayValue;
      return '';
    }
    if (this.rangeState === 'idle') return 'Click a date to start selecting';
    if (this.rangeState === 'start-selected') return 'Click another date to complete range';
    if (this.rangeState === 'complete') return this.displayValue;
    return '';
  }

  /**
   * Resolved presets array based on the presets property.
   * - true: returns DEFAULT_RANGE_PRESETS
   * - array: returns the array as-is
   * - false: returns empty array (no presets)
   */
  private get effectivePresets(): DateRangePreset[] {
    if (this.presets === true) return DEFAULT_RANGE_PRESETS;
    if (Array.isArray(this.presets)) return this.presets;
    return [];
  }

  /**
   * Duration text for the popup footer when a range is complete.
   * Shows inclusive day count (e.g., "7 days selected").
   */
  get durationText(): string {
    if (this.comparison && this.selectionTarget === 'comparison') {
      if (this.compareRangeState !== 'complete' || !this.compareStartDate || !this.compareEndDate) return '';
      const days = computeRangeDuration(this.compareStartDate, this.compareEndDate);
      return `${days} day${days === 1 ? '' : 's'} selected (comparison)`;
    }
    if (this.rangeState !== 'complete' || !this.startDate || !this.endDate) return '';
    const days = computeRangeDuration(this.startDate, this.endDate);
    return `${days} day${days === 1 ? '' : 's'} selected`;
  }

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
  // State machine methods
  // ---------------------------------------------------------------------------

  /**
   * Handle a date click in the calendar.
   * Implements the two-click state machine:
   * - idle/complete -> start-selected (first click sets start)
   * - start-selected -> complete (second click sets end with auto-swap)
   *
   * @param isoString - ISO 8601 date string of the clicked date
   */
  handleDateClick(isoString: string): void {
    if (this.disabled) return;

    // Route to comparison range handler when in comparison mode targeting comparison
    if (this.comparison && this.selectionTarget === 'comparison') {
      this.handleComparisonDateClick(isoString);
      return;
    }

    if (this.rangeState === 'idle' || this.rangeState === 'complete') {
      // First click: set start date, reset end, enter start-selected state
      this.startDate = isoString;
      this.endDate = '';
      this.internalError = '';
      this.rangeState = 'start-selected';
    } else if (this.rangeState === 'start-selected') {
      // Second click: normalize order (auto-swap DRP-09), set both dates
      const [normalizedStart, normalizedEnd] = normalizeRange(this.startDate, isoString);
      this.startDate = normalizedStart;
      this.endDate = normalizedEnd;
      this.hoveredDate = '';
      this.rangeState = 'complete';
      this.validateAndEmit();
    }
  }

  /**
   * Handle a date click for the comparison range.
   * Same two-click state machine as primary but targeting comparison dates.
   *
   * @param isoString - ISO 8601 date string of the clicked date
   */
  private handleComparisonDateClick(isoString: string): void {
    if (this.compareRangeState === 'idle' || this.compareRangeState === 'complete') {
      this.compareStartDate = isoString;
      this.compareEndDate = '';
      this.compareRangeState = 'start-selected';
    } else if (this.compareRangeState === 'start-selected') {
      const [normalizedStart, normalizedEnd] = normalizeRange(this.compareStartDate, isoString);
      this.compareStartDate = normalizedStart;
      this.compareEndDate = normalizedEnd;
      this.hoveredDate = '';
      this.compareRangeState = 'complete';
      this.validateAndEmit();
    }
  }

  /**
   * Validate the current range and emit change event.
   * Validation runs AFTER auto-swap via normalizeRange() (Pitfall 4).
   * Updates internal error state, form value, and ElementInternals validity.
   * Closes the popup on valid complete range.
   */
  validateAndEmit(): void {
    // Update form value first
    this.updateFormValue();

    // Validate (sets ElementInternals validity + internalError)
    const isValid = this.validate();

    // Build ISO interval for event payload
    const isoInterval = formatISOInterval(this.startDate, this.endDate);

    // Dispatch change event (include comparison fields when comparison mode is active)
    dispatchCustomEvent(this, 'change', {
      startDate: this.startDate,
      endDate: this.endDate,
      isoInterval,
      ...(this.comparison ? {
        compareStartDate: this.compareStartDate,
        compareEndDate: this.compareEndDate,
        compareIsoInterval: formatISOInterval(this.compareStartDate, this.compareEndDate),
      } : {}),
    });

    // Close popup on valid complete range
    if (isValid && this.rangeState === 'complete') {
      this.closePopup();
    }
  }

  /**
   * Handle hover over a day cell for preview highlighting.
   * Only active during start-selected state.
   *
   * @param dateStr - ISO 8601 date string of the hovered date
   */
  handleDayHover(dateStr: string): void {
    const activeState = this.comparison && this.selectionTarget === 'comparison'
      ? this.compareRangeState
      : this.rangeState;
    if (activeState === 'start-selected') {
      this.hoveredDate = dateStr;
    }
  }

  /**
   * Clear the hover preview state.
   */
  clearHoverPreview(): void {
    this.hoveredDate = '';
  }

  // ---------------------------------------------------------------------------
  // Preset selection
  // ---------------------------------------------------------------------------

  /**
   * Handle a preset button click.
   * Resolves the preset dates, sets both start and end, and emits change.
   *
   * @param preset - The preset to apply
   */
  private handlePresetSelect(preset: DateRangePreset): void {
    const { start, end } = preset.resolve();
    const startISO = format(start, 'yyyy-MM-dd');
    const endISO = format(end, 'yyyy-MM-dd');

    if (this.comparison && this.selectionTarget === 'comparison') {
      this.compareStartDate = startISO;
      this.compareEndDate = endISO;
      this.compareRangeState = 'complete';
    } else {
      this.startDate = startISO;
      this.endDate = endISO;
      this.rangeState = 'complete';
    }
    this.validateAndEmit();
  }

  /**
   * Check if a preset's resolved range falls outside min/max constraints.
   *
   * @param preset - The preset to check
   * @returns true if the preset should be disabled
   */
  private isPresetDisabled(preset: DateRangePreset): boolean {
    const { start, end } = preset.resolve();
    if (this.minDate) {
      const min = parseISO(this.minDate);
      if (isBeforeDate(start, min)) return true;
    }
    if (this.maxDate) {
      const max = parseISO(this.maxDate);
      if (isAfterDate(end, max)) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Drag selection (pointer events)
  // ---------------------------------------------------------------------------

  /**
   * Start a drag selection on pointerdown.
   * Enters start-selected state (same as first click in two-click flow).
   *
   * @param isoString - ISO 8601 date string of the pressed day cell
   */
  private handleDragStart(isoString: string): void {
    if (this.disabled) return;
    this.isDragging = true;

    if (this.comparison && this.selectionTarget === 'comparison') {
      this.compareStartDate = isoString;
      this.compareEndDate = '';
      this.compareRangeState = 'start-selected';
    } else {
      // Enter start-selected state (same transition as first click)
      this.startDate = isoString;
      this.endDate = '';
      this.internalError = '';
      this.rangeState = 'start-selected';
    }
  }

  /**
   * Complete a drag selection on pointerup over a day cell.
   * If released on a different cell than start, completes the range.
   * If released on the same cell, stays in start-selected for click-to-complete.
   *
   * @param isoString - ISO 8601 date string of the released day cell
   */
  private handleDragEnd(isoString: string): void {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.comparison && this.selectionTarget === 'comparison') {
      if (this.compareRangeState === 'start-selected' && isoString !== this.compareStartDate) {
        const [normalizedStart, normalizedEnd] = normalizeRange(this.compareStartDate, isoString);
        this.compareStartDate = normalizedStart;
        this.compareEndDate = normalizedEnd;
        this.hoveredDate = '';
        this.compareRangeState = 'complete';
        this.validateAndEmit();
      }
    } else {
      if (this.rangeState === 'start-selected' && isoString !== this.startDate) {
        // Complete range (same transition as second click)
        const [normalizedStart, normalizedEnd] = normalizeRange(this.startDate, isoString);
        this.startDate = normalizedStart;
        this.endDate = normalizedEnd;
        this.hoveredDate = '';
        this.rangeState = 'complete';
        this.validateAndEmit();
      }
    }
    // If released on same cell as start, stay in start-selected for click-to-complete
  }

  /**
   * Cancel a drag when pointer is released outside day cells.
   * Keeps start-selected state so user can still click to complete.
   */
  private handleDragCancel(): void {
    if (this.isDragging) {
      this.isDragging = false;
      // Stay in start-selected state — user can still click to complete
    }
  }

  /**
   * Reset the range picker to idle state.
   * Clears all selection, updates form value, validates, and dispatches change.
   */
  handleClear(e?: Event): void {
    e?.stopPropagation();
    this.startDate = '';
    this.endDate = '';
    this.hoveredDate = '';
    this.internalError = '';
    this.rangeState = 'idle';

    // Also clear comparison state when comparison mode is active
    if (this.comparison) {
      this.compareStartDate = '';
      this.compareEndDate = '';
      this.compareRangeState = 'idle';
      this.selectionTarget = 'primary';
    }

    this.updateFormValue();
    this.validate();

    dispatchCustomEvent(this, 'change', {
      startDate: '',
      endDate: '',
      isoInterval: '',
      ...(this.comparison ? {
        compareStartDate: '',
        compareEndDate: '',
        compareIsoInterval: '',
      } : {}),
    });

    // Focus input after clear for keyboard continuity
    this.inputEl?.focus();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Sync range state and form value when properties change externally.
   */
  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps);

    // Sync form value and validity when dates change
    if (changedProps.has('startDate') || changedProps.has('endDate')) {
      // If both dates are set externally, ensure state is 'complete'
      if (this.startDate && this.endDate && this.rangeState !== 'complete') {
        this.rangeState = 'complete';
      }
      this.updateFormValue();
      this.validate();
    }

    // Sync comparison range state when comparison dates change externally
    if (changedProps.has('compareStartDate') || changedProps.has('compareEndDate')) {
      if (this.compareStartDate && this.compareEndDate && this.compareRangeState !== 'complete') {
        this.compareRangeState = 'complete';
      }
      this.updateFormValue();
    }
  }

  // ---------------------------------------------------------------------------
  // Form integration
  // ---------------------------------------------------------------------------

  /**
   * Sync the current range value to the form via ElementInternals.
   * Sets form value as ISO 8601 interval (YYYY-MM-DD/YYYY-MM-DD) or null.
   */
  private updateFormValue(): void {
    const primaryInterval = formatISOInterval(this.startDate, this.endDate);
    if (this.comparison && this.compareStartDate && this.compareEndDate) {
      const compareInterval = formatISOInterval(this.compareStartDate, this.compareEndDate);
      this.internals?.setFormValue(primaryInterval ? `${primaryInterval}|${compareInterval}` : null);
    } else {
      this.internals?.setFormValue(primaryInterval || null);
    }
  }

  /**
   * Validate the current state and set validity on ElementInternals.
   * Checks required (valueMissing) first, then duration constraints (customError).
   * Clears validity if all checks pass.
   *
   * @returns true if valid, false if invalid
   */
  private validate(): boolean {
    if (!this.internals) return true;

    const anchor = this.inputEl ?? undefined;

    // Check required: both start and end must be set
    if (this.required && (!this.startDate || !this.endDate)) {
      const msg = 'Please select a date range';
      this.internalError = msg;
      this.internals.setValidity({ valueMissing: true }, msg, anchor);
      return false;
    }

    // Check duration constraints (only when we have a complete range)
    if (this.startDate && this.endDate) {
      const validation = validateRangeDuration(
        this.startDate,
        this.endDate,
        this.minDays || undefined,
        this.maxDays || undefined,
      );

      if (!validation.valid) {
        this.internalError = validation.error;
        this.internals.setValidity({ customError: true }, validation.error, anchor);
        return false;
      }
    }

    // All checks passed
    this.internalError = '';
    this.internals.setValidity({});
    return true;
  }

  /**
   * Form lifecycle callback: reset the date range picker to initial state.
   */
  formResetCallback(): void {
    this.startDate = '';
    this.endDate = '';
    this.hoveredDate = '';
    this.internalError = '';
    this.rangeState = 'idle';
    this.isOpen = false;
    this.compareStartDate = '';
    this.compareEndDate = '';
    this.compareRangeState = 'idle';
    this.selectionTarget = 'primary';
    this.internals?.setFormValue(null);
    this.internals?.setValidity({});
  }

  /**
   * Form lifecycle callback: restore state from ISO interval string.
   * Parses "YYYY-MM-DD/YYYY-MM-DD" back into start and end dates.
   */
  formStateRestoreCallback(state: string): void {
    if (!state || typeof state !== 'string') return;

    const parts = state.split('/');
    if (parts.length === 2) {
      this.startDate = parts[0];
      this.endDate = parts[1];
      this.rangeState = 'complete';
      this.updateFormValue();
      this.validate();
    }
  }

  /**
   * Form lifecycle callback: handle disabled state from form.
   */
  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ---------------------------------------------------------------------------
  // Range day rendering (inline styles for Shadow DOM compatibility)
  // ---------------------------------------------------------------------------

  /**
   * Render callback for calendar day cells with range highlighting.
   * Uses inline styles because CSS classes defined here cannot reach
   * inside the calendar's Shadow DOM (Pitfall 1).
   *
   * Arrow function to preserve `this` binding when passed to lui-calendar.
   */
  renderRangeDay = (state: DayCellState): unknown => {
    const dateStr = state.formattedDate;

    // Primary range checks
    const isStart = dateStr === this.startDate;
    const isEnd = dateStr === this.endDate;
    const inRange = isDateInRange(dateStr, this.startDate, this.endDate);
    const inPreview = this.rangeState === 'start-selected' && !(this.comparison && this.selectionTarget === 'comparison')
      ? isDateInPreview(dateStr, this.startDate, this.hoveredDate)
      : false;

    // Comparison range checks
    const isCompareStart = this.comparison && dateStr === this.compareStartDate;
    const isCompareEnd = this.comparison && dateStr === this.compareEndDate;
    const inCompareRange = this.comparison && isDateInRange(dateStr, this.compareStartDate, this.compareEndDate);
    const inComparePreview = this.comparison && this.selectionTarget === 'comparison' && this.compareRangeState === 'start-selected'
      ? isDateInPreview(dateStr, this.compareStartDate, this.hoveredDate)
      : false;

    // Build inline styles array — inline because CSS classes cannot
    // penetrate the calendar's Shadow DOM (Pitfall 1).
    // CSS custom properties DO cascade through Shadow DOM for theming.
    const styles: string[] = [
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'width: 100%',
      'height: 100%',
      'border-radius: 0',
      'transition: background-color 150ms',
    ];

    const isSingleDay = isStart && isEnd;

    // Primary range styles take precedence over comparison styles
    if (isSingleDay) {
      // Single-day range: full circle
      styles.push(
        'background-color: var(--ui-range-selected-bg, var(--color-primary))',
        'color: var(--ui-range-selected-text)',
        'border-radius: 9999px',
      );
    } else if (isStart) {
      // Start date: rounded left
      styles.push(
        'background-color: var(--ui-range-selected-bg, var(--color-primary))',
        'color: var(--ui-range-selected-text)',
        'border-radius: 9999px 0 0 9999px',
      );
    } else if (isEnd) {
      // End date: rounded right
      styles.push(
        'background-color: var(--ui-range-selected-bg, var(--color-primary))',
        'color: var(--ui-range-selected-text)',
        'border-radius: 0 9999px 9999px 0',
      );
    } else if (inRange) {
      // In-range: highlight background, no rounding
      styles.push(
        'background-color: var(--ui-range-highlight-bg, color-mix(in oklch, var(--color-primary, var(--ui-color-primary)) 12%, var(--color-background)))',
        'color: var(--ui-range-highlight-text)',
      );
    } else if (inPreview) {
      // Preview: lighter highlight background, no rounding
      styles.push(
        'background-color: var(--ui-range-preview-bg, color-mix(in oklch, var(--color-primary, var(--ui-color-primary)) 6%, var(--color-background)))',
      );
    } else if (isCompareStart && isCompareEnd) {
      // Comparison single-day: full circle in amber
      styles.push(
        'background-color: var(--ui-date-range-compare-bg)',
        'color: var(--ui-date-range-compare-text)',
        'border-radius: 9999px',
      );
    } else if (isCompareStart) {
      // Comparison start: rounded left in amber
      styles.push(
        'background-color: var(--ui-date-range-compare-bg)',
        'color: var(--ui-date-range-compare-text)',
        'border-radius: 9999px 0 0 9999px',
      );
    } else if (isCompareEnd) {
      // Comparison end: rounded right in amber
      styles.push(
        'background-color: var(--ui-date-range-compare-bg)',
        'color: var(--ui-date-range-compare-text)',
        'border-radius: 0 9999px 9999px 0',
      );
    } else if (inCompareRange) {
      // In comparison range: amber highlight
      styles.push(
        'background-color: var(--ui-date-range-compare-highlight-bg)',
        'color: inherit',
      );
    } else if (inComparePreview) {
      // Comparison preview: lighter amber highlight
      styles.push(
        'background-color: var(--ui-date-range-compare-preview-bg)',
      );
    }

    return html`
      <span
        style="${styles.join('; ')}"
        @mouseenter="${() => this.handleDayHover(dateStr)}"
        @pointerdown="${(e: PointerEvent) => { e.preventDefault(); this.handleDragStart(dateStr); }}"
        @pointerup="${() => this.handleDragEnd(dateStr)}"
      >
        ${state.date.getDate()}
      </span>
    `;
  };

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Navigate to the previous month.
   */
  private navigatePrev(): void {
    this.currentMonth = subMonths(this.currentMonth, 1);
  }

  /**
   * Navigate to the next month.
   */
  private navigateNext(): void {
    this.currentMonth = addMonths(this.currentMonth, 1);
  }

  /**
   * Compute the range heading showing the two visible months with en-dash.
   * Examples: "January \u2013 February 2026" or "December 2025 \u2013 January 2026"
   */
  private get rangeHeading(): string {
    const firstMonth = this.currentMonth;
    const secondMonth = addMonths(this.currentMonth, 1);

    const firstYear = getYear(firstMonth);
    const secondYear = getYear(secondMonth);

    const monthFormatter = new Intl.DateTimeFormat(this.effectiveLocale, { month: 'long' });
    const firstName = monthFormatter.format(firstMonth);
    const secondName = monthFormatter.format(secondMonth);

    if (firstYear === secondYear) {
      return `${firstName} \u2013 ${secondName} ${secondYear}`;
    }
    return `${firstName} ${firstYear} \u2013 ${secondName} ${secondYear}`;
  }

  /**
   * Handle date selection from a child calendar's change event.
   * Extracts the ISO string and delegates to the state machine.
   */
  private handleCalendarSelect(e: Event): void {
    const detail = (e as CustomEvent).detail;
    if (!detail?.isoString) return;
    this.handleDateClick(detail.isoString);
  }

  // ---------------------------------------------------------------------------
  // Popup management
  // ---------------------------------------------------------------------------

  /**
   * Open the calendar popup and position it via Floating UI.
   * Focuses the first calendar after positioning for keyboard accessibility.
   */
  async openPopup(): Promise<void> {
    if (this.disabled) return;
    this.isOpen = true;
    this.triggerElement = (this.shadowRoot?.activeElement as HTMLElement) || this.inputEl;

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
   * Clears hover preview state for clean reopen.
   */
  closePopup(): void {
    try { this.popupEl?.hidePopover(); } catch { /* already hidden or removed */ }
    this.isOpen = false;
    this.hoveredDate = '';
    requestAnimationFrame(() => {
      this.triggerElement?.focus();
      this.triggerElement = null;
    });
  }

  /**
   * Toggle the calendar popup open/close.
   */
  private togglePopup(): void {
    if (this.isOpen) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  /**
   * Focus the first lui-calendar element inside the popup.
   * The calendar manages its own internal keyboard navigation.
   */
  private focusCalendar(): void {
    const calendar = this.shadowRoot?.querySelector('.popup lui-calendar') as HTMLElement | null;
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

  // ---------------------------------------------------------------------------
  // Click-outside detection
  // ---------------------------------------------------------------------------

  /**
   * Handle document clicks for closing popup when clicking outside.
   * Uses composedPath() to work correctly with Shadow DOM boundaries.
   */
  private handleDocumentClick = (e: MouseEvent): void => {
    if (this.isOpen && !e.composedPath().includes(this)) {
      this.closePopup();
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (!isServer) {
      document.addEventListener('click', this.handleDocumentClick);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (!isServer) {
      document.removeEventListener('click', this.handleDocumentClick);
    }
  }

  // ---------------------------------------------------------------------------
  // Keyboard handling
  // ---------------------------------------------------------------------------

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
  // Render
  // ---------------------------------------------------------------------------

  /**
   * Render the dual-calendar popup content (header + calendars).
   */
  private renderCalendarContent() {
    const leftDisplayMonth = format(this.currentMonth, 'yyyy-MM-dd');
    const rightDisplayMonth = format(addMonths(this.currentMonth, 1), 'yyyy-MM-dd');

    return html`
      <div class="range-header">
        <button
          class="nav-button"
          @click="${this.navigatePrev}"
          aria-label="Previous month"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 class="range-heading">${this.rangeHeading}</h2>
        <button
          class="nav-button"
          @click="${this.navigateNext}"
          aria-label="Next month"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      ${this.comparison ? html`
        <div class="comparison-toggle">
          <button
            type="button"
            class="toggle-button ${this.selectionTarget === 'primary' ? 'toggle-active toggle-primary' : ''}"
            @click="${() => { this.selectionTarget = 'primary'; }}"
          >Primary Range</button>
          <button
            type="button"
            class="toggle-button ${this.selectionTarget === 'comparison' ? 'toggle-active toggle-comparison' : ''}"
            @click="${() => { this.selectionTarget = 'comparison'; }}"
          >Comparison Range</button>
        </div>
      ` : nothing}
      <div class="popup-body">
        ${this.effectivePresets.length > 0
          ? html`
            <div class="preset-sidebar">
              ${this.effectivePresets.map(preset => html`
                <button
                  type="button"
                  class="preset-button"
                  ?disabled="${this.isPresetDisabled(preset)}"
                  @click="${() => this.handlePresetSelect(preset)}"
                >${preset.label}</button>
              `)}
            </div>
          ` : nothing}
        <div
          class="calendars-wrapper ${this.isDragging ? 'dragging' : ''}"
          @mouseleave="${this.clearHoverPreview}"
        >
          <lui-calendar
            display-month="${leftDisplayMonth}"
            hide-navigation
            .renderDay="${this.renderRangeDay}"
            .locale="${this.effectiveLocale}"
            min-date="${this.minDate || nothing}"
            max-date="${this.maxDate || nothing}"
            @change="${this.handleCalendarSelect}"
          ></lui-calendar>
          <lui-calendar
            display-month="${rightDisplayMonth}"
            hide-navigation
            .renderDay="${this.renderRangeDay}"
            .locale="${this.effectiveLocale}"
            min-date="${this.minDate || nothing}"
            max-date="${this.maxDate || nothing}"
            @change="${this.handleCalendarSelect}"
          ></lui-calendar>
        </div>
      </div>
      <div class="popup-footer">
        <span class="footer-status">${this.durationText || this.selectionStatus}</span>
        ${this.rangeState === 'complete' || (this.comparison && this.compareRangeState === 'complete')
          ? html`
              <button
                type="button"
                class="footer-clear-button"
                @click=${this.handleClear}
              >Clear</button>
            `
          : nothing}
      </div>
    `;
  }

  override render() {
    return html`
      <div class="date-range-wrapper">
        ${this.label
          ? html`
              <label
                for=${this.inputId}
                class="date-range-label"
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
          @click="${this.openPopup}"
        >
          <input
            id=${this.inputId}
            type="text"
            .value=${this.displayValue}
            placeholder=${this.effectivePlaceholder}
            readonly
            ?disabled=${this.disabled}
            aria-invalid=${this.hasError ? 'true' : nothing}
            aria-errormessage=${this.hasError ? `${this.inputId}-error` : nothing}
            aria-describedby=${this.hasError
              ? `${this.inputId}-error`
              : this.helperText
                ? `${this.inputId}-helper`
                : nothing}
            aria-label=${!this.label ? 'Date range' : nothing}
            aria-disabled=${this.disabled ? 'true' : nothing}
          />

          ${this.startDate && !this.disabled
            ? html`
                <button
                  type="button"
                  class="action-button"
                  aria-label="Clear date range"
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
            @click=${(e: Event) => { e.stopPropagation(); this.togglePopup(); }}
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

        ${this.hasError && this.displayError
          ? html`
              <span
                id="${this.inputId}-error"
                class="error-text"
                role="alert"
              >${this.displayError}</span>
            `
          : nothing}

        ${this.isOpen
          ? html`
              <div
                class="popup"
                popover="manual"
                role="dialog"
                aria-modal="true"
                aria-label="Choose date range"
                @keydown=${this.handlePopupKeydown}
                @pointerup=${this.handleDragCancel}
              >
                ${this.renderCalendarContent()}
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
    'lui-date-range-picker': DateRangePicker;
  }
}
