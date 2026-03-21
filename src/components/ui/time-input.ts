/**
 * lui-time-input - Internal time input component with hour/minute spinbuttons
 *
 * Provides accessible spinbutton inputs for hours and minutes following the
 * WAI-ARIA Spinbutton Pattern, plus an AM/PM toggle for 12-hour format.
 * Supports keyboard navigation (arrows, Home/End, PageUp/Down) and
 * type-ahead digit entry with a 750ms buffer timeout.
 *
 * This is an internal composition component used by the main time-picker.
 *
 * @element lui-time-input
 * @fires ui-time-input-change - Dispatched when the time value changes, with { value: TimeValue }
 */

import { html, css, nothing, isServer, type PropertyValues, type CSSResultGroup } from 'lit';
import { property, state } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles, dispatchCustomEvent } from '@lit-ui/core';
import { type TimeValue, to12Hour, to24Hour, clampHour, clampMinute } from './time-utils.js';

/**
 * Internal time input with hour/minute spinbuttons and optional AM/PM toggle.
 *
 * @example
 * ```ts
 * const input = document.createElement('lui-time-input');
 * input.value = { hour: 14, minute: 30, second: 0 };
 * input.hour12 = true;
 * ```
 */
export class TimeInput extends TailwindElement {
  // ---------------------------------------------------------------------------
  // Public properties
  // ---------------------------------------------------------------------------

  /**
   * Current time value. Always stored in 24-hour format internally.
   * Null when no time is set.
   */
  @property({ attribute: false })
  value: TimeValue | null = null;

  /**
   * Whether to display in 12-hour format with AM/PM toggle.
   * When false, uses 24-hour format (0-23).
   */
  @property({ type: Boolean, reflect: true })
  hour12 = false;

  /**
   * Whether the input is disabled.
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the input is readonly.
   */
  @property({ type: Boolean, reflect: true })
  readonly = false;

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  /**
   * Currently focused field within the time input.
   */
  @state()
  private focusedField: 'hour' | 'minute' | 'period' = 'hour';

  /**
   * Buffer for type-ahead digit entry.
   * Digits accumulate within the 750ms timeout window.
   */
  @state()
  private typeAheadBuffer = '';

  /**
   * Timer ID for the type-ahead buffer timeout.
   */
  private typeAheadTimer: number | undefined;

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  static override styles: CSSResultGroup = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: inline-block;
      }

      .time-input-wrapper {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.25rem;
      }

      .spinbutton {
        min-width: 2.5rem;
        text-align: center;
        padding: 0.375rem 0.5rem;
        border-radius: 0.375rem;
        border: 1px solid var(--ui-time-picker-spinbutton-border, var(--ui-input-border));
        background: var(--ui-time-picker-spinbutton-bg, var(--ui-input-bg));
        color: var(--ui-time-picker-spinbutton-text, var(--ui-input-text));
        font-variant-numeric: tabular-nums;
        cursor: default;
        user-select: none;
        outline: none;
        font-size: inherit;
        line-height: 1.5;
      }

      .spinbutton:focus {
        border-color: var(--ui-time-picker-focus-ring, var(--ui-input-focus-ring));
        box-shadow: 0 0 0 2px var(--ui-time-picker-focus-ring, var(--ui-input-focus-ring));
      }

      .spinbutton[aria-disabled='true'] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .separator {
        color: var(--ui-time-picker-separator-color, var(--ui-input-text));
        font-weight: 500;
        user-select: none;
      }

      .period-toggle {
        margin-left: 0.25rem;
        padding: 0.375rem 0.5rem;
        border-radius: 0.375rem;
        border: 1px solid var(--ui-time-picker-period-border, var(--ui-input-border));
        background: var(--ui-time-picker-period-bg, var(--ui-input-bg));
        color: var(--ui-time-picker-period-text, var(--ui-input-text));
        cursor: pointer;
        font-size: inherit;
        line-height: 1.5;
        outline: none;
        user-select: none;
      }

      .period-toggle:hover:not(:disabled) {
        background: var(--ui-time-picker-period-hover-bg, var(--ui-input-hover-bg));
      }

      .period-toggle:focus {
        border-color: var(--ui-time-picker-focus-ring, var(--ui-input-focus-ring));
        box-shadow: 0 0 0 2px var(--ui-time-picker-focus-ring, var(--ui-input-focus-ring));
      }

      .period-toggle:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

    `,
  ];

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearTypeAheadTimer();
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  /**
   * Get the current hour value for display.
   * In 12-hour mode, converts from 24h internal storage.
   */
  private get displayHour(): number {
    if (!this.value) return this.hour12 ? 12 : 0;
    if (this.hour12) {
      return to12Hour(this.value.hour).hour;
    }
    return this.value.hour;
  }

  /**
   * Get the current minute value for display.
   */
  private get displayMinute(): number {
    return this.value?.minute ?? 0;
  }

  /**
   * Get the current period (AM/PM) based on the 24-hour value.
   */
  private get currentPeriod(): 'AM' | 'PM' {
    if (!this.value) return 'AM';
    return to12Hour(this.value.hour).period;
  }

  /**
   * Hour minimum value based on format mode.
   */
  private get hourMin(): number {
    return this.hour12 ? 1 : 0;
  }

  /**
   * Hour maximum value based on format mode.
   */
  private get hourMax(): number {
    return this.hour12 ? 12 : 23;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  override render() {
    const hourText = String(this.displayHour).padStart(2, '0');
    const minuteText = String(this.displayMinute).padStart(2, '0');
    const isInteractive = !this.disabled && !this.readonly;

    const hourAriaText = this.hour12
      ? `${this.displayHour} ${this.currentPeriod}`
      : String(this.displayHour);

    return html`
      <div class="time-input-wrapper">
        <div
          class="spinbutton"
          role="spinbutton"
          tabindex=${isInteractive ? '0' : '-1'}
          aria-label="Hour"
          aria-valuenow=${this.displayHour}
          aria-valuemin=${this.hourMin}
          aria-valuemax=${this.hourMax}
          aria-valuetext=${hourAriaText}
          aria-disabled=${this.disabled ? 'true' : 'false'}
          aria-readonly=${this.readonly ? 'true' : 'false'}
          @keydown=${this.handleHourKeydown}
          @focus=${() => { this.focusedField = 'hour'; }}
        >${hourText}</div>

        <span class="separator" aria-hidden="true">:</span>

        <div
          class="spinbutton"
          role="spinbutton"
          tabindex=${isInteractive ? '0' : '-1'}
          aria-label="Minute"
          aria-valuenow=${this.displayMinute}
          aria-valuemin=${0}
          aria-valuemax=${59}
          aria-valuetext=${String(this.displayMinute)}
          aria-disabled=${this.disabled ? 'true' : 'false'}
          aria-readonly=${this.readonly ? 'true' : 'false'}
          @keydown=${this.handleMinuteKeydown}
          @focus=${() => { this.focusedField = 'minute'; }}
        >${minuteText}</div>

        ${this.hour12
          ? html`
              <button
                class="period-toggle"
                type="button"
                aria-label="AM/PM toggle: currently ${this.currentPeriod}"
                ?disabled=${this.disabled || this.readonly}
                @click=${this.togglePeriod}
                @keydown=${this.handlePeriodKeydown}
                @focus=${() => { this.focusedField = 'period'; }}
              >${this.currentPeriod}</button>
            `
          : nothing}
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Keyboard handlers
  // ---------------------------------------------------------------------------

  /**
   * Handle keyboard events on the hour spinbutton.
   */
  private handleHourKeydown(e: KeyboardEvent): void {
    if (this.disabled || this.readonly) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        this.incrementHour(1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.incrementHour(-1);
        break;
      case 'Home':
        e.preventDefault();
        this.setHourDisplay(this.hourMin);
        break;
      case 'End':
        e.preventDefault();
        this.setHourDisplay(this.hourMax);
        break;
      case 'PageUp':
        e.preventDefault();
        this.incrementHour(6);
        break;
      case 'PageDown':
        e.preventDefault();
        this.incrementHour(-6);
        break;
      default:
        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          this.handleTypeAhead(e.key, 'hour');
        }
        break;
    }
  }

  /**
   * Handle keyboard events on the minute spinbutton.
   */
  private handleMinuteKeydown(e: KeyboardEvent): void {
    if (this.disabled || this.readonly) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        this.incrementMinute(1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.incrementMinute(-1);
        break;
      case 'Home':
        e.preventDefault();
        this.setMinute(0);
        break;
      case 'End':
        e.preventDefault();
        this.setMinute(59);
        break;
      case 'PageUp':
        e.preventDefault();
        this.incrementMinute(10);
        break;
      case 'PageDown':
        e.preventDefault();
        this.incrementMinute(-10);
        break;
      default:
        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          this.handleTypeAhead(e.key, 'minute');
        }
        break;
    }
  }

  /**
   * Handle keyboard events on the AM/PM toggle button.
   * Space and Enter are handled natively by the button element.
   */
  private handlePeriodKeydown(e: KeyboardEvent): void {
    if (this.disabled || this.readonly) return;

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.togglePeriod();
    }
  }

  // ---------------------------------------------------------------------------
  // Value mutation helpers
  // ---------------------------------------------------------------------------

  /**
   * Increment/decrement the display hour by a delta, wrapping at boundaries.
   */
  private incrementHour(delta: number): void {
    const current = this.displayHour;
    const min = this.hourMin;
    const max = this.hourMax;
    const range = max - min + 1;

    let next = current + delta;
    // Wrap within the valid range
    next = ((next - min) % range + range) % range + min;

    this.setHourDisplay(next);
  }

  /**
   * Set the display hour value (handles 12h to 24h conversion).
   */
  private setHourDisplay(displayHour: number): void {
    const clamped = clampHour(displayHour, this.hour12);
    let hour24: number;

    if (this.hour12) {
      hour24 = to24Hour(clamped, this.currentPeriod);
    } else {
      hour24 = clamped;
    }

    this.updateValue(hour24, this.value?.minute ?? 0);
  }

  /**
   * Increment/decrement the minute by a delta, wrapping 0-59.
   */
  private incrementMinute(delta: number): void {
    const current = this.displayMinute;
    let next = (current + delta) % 60;
    if (next < 0) next += 60;
    this.setMinute(next);
  }

  /**
   * Set the minute value directly.
   */
  private setMinute(minute: number): void {
    const clamped = clampMinute(minute);
    this.updateValue(this.value?.hour ?? 0, clamped);
  }

  /**
   * Toggle between AM and PM, preserving the display hour.
   */
  private togglePeriod(): void {
    if (this.disabled || this.readonly) return;

    const newPeriod = this.currentPeriod === 'AM' ? 'PM' : 'AM';
    const hour24 = to24Hour(this.displayHour, newPeriod);
    this.updateValue(hour24, this.value?.minute ?? 0);
  }

  /**
   * Update the internal value and dispatch change event.
   */
  private updateValue(hour24: number, minute: number): void {
    const newValue: TimeValue = {
      hour: hour24,
      minute,
      second: this.value?.second ?? 0,
    };
    this.value = newValue;

    dispatchCustomEvent(this, 'ui-time-input-change', { value: newValue });
  }

  // ---------------------------------------------------------------------------
  // Type-ahead buffer
  // ---------------------------------------------------------------------------

  /**
   * Handle digit keypress for type-ahead entry.
   * Accumulates digits within a 750ms window, then parses and clamps.
   */
  private handleTypeAhead(digit: string, field: 'hour' | 'minute'): void {
    this.clearTypeAheadTimer();
    this.typeAheadBuffer += digit;

    this.typeAheadTimer = window.setTimeout(() => {
      this.applyTypeAheadBuffer(field);
    }, 750);

    // If buffer reaches max digits for the field, apply immediately
    const maxDigits = field === 'hour' ? 2 : 2;
    if (this.typeAheadBuffer.length >= maxDigits) {
      this.clearTypeAheadTimer();
      this.applyTypeAheadBuffer(field);
    }
  }

  /**
   * Parse the type-ahead buffer and apply the value to the specified field.
   */
  private applyTypeAheadBuffer(field: 'hour' | 'minute'): void {
    if (!this.typeAheadBuffer) return;

    const parsed = parseInt(this.typeAheadBuffer, 10);
    this.typeAheadBuffer = '';

    if (isNaN(parsed)) return;

    if (field === 'hour') {
      this.setHourDisplay(parsed);
    } else {
      this.setMinute(parsed);
    }
  }

  /**
   * Clear the type-ahead timer and reset buffer state.
   */
  private clearTypeAheadTimer(): void {
    if (this.typeAheadTimer !== undefined) {
      window.clearTimeout(this.typeAheadTimer);
      this.typeAheadTimer = undefined;
    }
  }
}

// Safe custom element registration for internal component
if (typeof customElements !== 'undefined') {
  if (!customElements.get('lui-time-input')) {
    customElements.define('lui-time-input', TimeInput);
  }
}
