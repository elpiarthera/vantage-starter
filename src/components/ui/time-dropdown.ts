/**
 * TimeDropdown - Scrollable listbox for desktop time selection
 *
 * Renders time options at configurable step intervals (e.g., every 30 minutes)
 * in a scrollable listbox. Supports keyboard navigation, auto-scroll to
 * selected option, and locale-aware formatting via Intl.DateTimeFormat.
 *
 * @fires ui-time-dropdown-select - Dispatched when a time option is selected
 */

import { html, css, type PropertyValues, type CSSResultGroup } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles, dispatchCustomEvent } from '@lit-ui/core';
import {
  type TimeValue,
  timeToISO,
  formatTimeForDisplay,
  parseTimeISO,
} from './time-utils.js';

/**
 * A single time option entry in the dropdown.
 */
interface TimeOption {
  /** The underlying time value */
  value: TimeValue;
  /** Locale-formatted display string */
  display: string;
  /** ISO 8601 time string (HH:mm:ss) */
  iso: string;
}

export class TimeDropdown extends TailwindElement {
  static override styles: CSSResultGroup = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
      }

      .time-dropdown-wrapper {
        max-height: var(--ui-time-picker-dropdown-height, 240px);
        overflow-y: auto;
        border: 1px solid var(--ui-time-picker-dropdown-border, var(--ui-input-border));
        border-radius: var(--ui-time-picker-radius, var(--ui-input-radius, 0.375rem));
        background: var(--ui-time-picker-dropdown-bg, var(--ui-input-bg));
        scrollbar-width: thin;
        scrollbar-color: var(--ui-time-picker-scrollbar) transparent;
      }

      .time-dropdown-wrapper::-webkit-scrollbar {
        width: 6px;
      }

      .time-dropdown-wrapper::-webkit-scrollbar-track {
        background: transparent;
      }

      .time-dropdown-wrapper::-webkit-scrollbar-thumb {
        background: var(--ui-time-picker-scrollbar);
        border-radius: 3px;
      }

      .time-option {
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: var(--ui-time-picker-option-text, var(--ui-input-text));
        transition: background-color 0.1s ease;
        user-select: none;
      }

      .time-option:hover {
        background: var(--ui-time-picker-option-hover-bg, var(--ui-input-hover-bg));
      }

      .time-option.highlighted {
        background: var(--ui-time-picker-option-hover-bg);
      }

      .time-option.selected {
        background: var(--ui-time-picker-option-selected-bg);
        color: var(--ui-time-picker-option-selected-text);
        font-weight: 500;
      }

      .time-option.selected.highlighted {
        background: var(--ui-time-picker-option-selected-bg);
      }

      .time-option[aria-disabled='true'] {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
      }

      .time-option.business-hour {
        border-left: 3px solid var(--ui-time-picker-business-accent);
        background: var(--ui-time-picker-business-bg);
      }

      .time-option.business-hour:hover {
        background: var(--ui-time-picker-business-hover-bg);
      }

      .time-option.business-hour.selected {
        background: var(--ui-time-picker-business-bg);
        border-left-color: var(--ui-time-picker-business-accent);
      }
    `,
  ];

  /** Currently selected time value */
  @property({ attribute: false })
  value: TimeValue | null = null;

  /** Interval in minutes between options (1-60) */
  @property({ type: Number })
  step = 30;

  /** Whether to display in 12-hour format */
  @property({ type: Boolean })
  hour12 = false;

  /** BCP 47 locale tag for formatting */
  @property()
  locale = 'en-US';

  /** Business hours range for visual highlighting (false = disabled) */
  @property({ attribute: false })
  businessHours: { start: number; end: number } | false = false;

  /** Whether the dropdown is disabled */
  @property({ type: Boolean })
  disabled = false;

  /** Minimum selectable time as HH:mm */
  @property({ attribute: 'min-time' })
  minTime = '';

  /** Maximum selectable time as HH:mm */
  @property({ attribute: 'max-time' })
  maxTime = '';

  /** Current keyboard highlight position */
  @state()
  private highlightedIndex = -1;

  /** Computed list of time options */
  @state()
  private options: TimeOption[] = [];

  /** Type-ahead search buffer */
  private _typeAheadBuffer = '';

  /** Type-ahead reset timer */
  private _typeAheadTimer: ReturnType<typeof setTimeout> | null = null;

  @query('.time-dropdown-wrapper')
  private _wrapperEl!: HTMLDivElement;

  override willUpdate(changed: PropertyValues): void {
    if (
      changed.has('step') ||
      changed.has('minTime') ||
      changed.has('maxTime') ||
      changed.has('hour12') ||
      changed.has('locale')
    ) {
      this.options = this._generateTimeOptions();
    }
  }

  override firstUpdated(): void {
    this._scrollToSelected();
  }

  override updated(changed: PropertyValues): void {
    if (changed.has('value')) {
      this._scrollToSelected();
    }
  }

  /**
   * Generate the list of time options based on step, min/max constraints.
   */
  private _generateTimeOptions(): TimeOption[] {
    const clampedStep = Math.max(1, Math.min(60, this.step));
    const minParsed = this.minTime ? parseTimeISO(this.minTime) : null;
    const maxParsed = this.maxTime ? parseTimeISO(this.maxTime) : null;
    const minMinutes = minParsed ? minParsed.hour * 60 + minParsed.minute : 0;
    const maxMinutes = maxParsed ? maxParsed.hour * 60 + maxParsed.minute : 24 * 60 - 1;

    const result: TimeOption[] = [];
    for (let totalMinutes = 0; totalMinutes < 24 * 60; totalMinutes += clampedStep) {
      if (totalMinutes < minMinutes || totalMinutes > maxMinutes) {
        continue;
      }

      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      const tv: TimeValue = { hour, minute, second: 0 };

      result.push({
        value: tv,
        display: formatTimeForDisplay(tv, this.locale, this.hour12),
        iso: timeToISO(tv),
      });
    }

    return result;
  }

  /**
   * Scroll the selected option into view within the dropdown.
   */
  private _scrollToSelected(): void {
    if (!this.value || !this._wrapperEl) return;

    requestAnimationFrame(() => {
      const idx = this.options.findIndex(
        (opt) => opt.value.hour === this.value!.hour && opt.value.minute === this.value!.minute,
      );
      if (idx < 0) return;

      const optionEl = this._wrapperEl.children[idx] as HTMLElement | undefined;
      if (optionEl) {
        optionEl.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  /**
   * Scroll a highlighted option into view.
   */
  private _scrollHighlightedIntoView(): void {
    if (this.highlightedIndex < 0 || !this._wrapperEl) return;

    requestAnimationFrame(() => {
      const optionEl = this._wrapperEl.children[this.highlightedIndex] as HTMLElement | undefined;
      if (optionEl) {
        optionEl.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  /**
   * Select a time option and dispatch the selection event.
   */
  private _selectOption(opt: TimeOption): void {
    if (this.disabled) return;
    dispatchCustomEvent<{ value: TimeValue }>(this, 'ui-time-dropdown-select', {
      value: opt.value,
    });
  }

  /**
   * Handle keyboard navigation within the dropdown.
   */
  private _handleKeydown(e: KeyboardEvent): void {
    if (this.disabled || this.options.length === 0) return;

    const len = this.options.length;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        this.highlightedIndex =
          this.highlightedIndex < 0 ? 0 : (this.highlightedIndex + 1) % len;
        this._scrollHighlightedIntoView();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        this.highlightedIndex =
          this.highlightedIndex <= 0 ? len - 1 : this.highlightedIndex - 1;
        this._scrollHighlightedIntoView();
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (this.highlightedIndex >= 0 && this.highlightedIndex < len) {
          this._selectOption(this.options[this.highlightedIndex]);
        }
        break;
      }
      case 'Home': {
        e.preventDefault();
        this.highlightedIndex = 0;
        this._scrollHighlightedIntoView();
        break;
      }
      case 'End': {
        e.preventDefault();
        this.highlightedIndex = len - 1;
        this._scrollHighlightedIntoView();
        break;
      }
      default: {
        // Type-ahead: match by first letter(s) of display text
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          this._handleTypeAhead(e.key);
        }
        break;
      }
    }
  }

  /**
   * Handle type-ahead character matching on option display text.
   */
  private _handleTypeAhead(char: string): void {
    if (this._typeAheadTimer) {
      clearTimeout(this._typeAheadTimer);
    }

    this._typeAheadBuffer += char.toLowerCase();
    this._typeAheadTimer = setTimeout(() => {
      this._typeAheadBuffer = '';
      this._typeAheadTimer = null;
    }, 500);

    const matchIndex = this.options.findIndex((opt) =>
      opt.display.toLowerCase().startsWith(this._typeAheadBuffer),
    );

    if (matchIndex >= 0) {
      this.highlightedIndex = matchIndex;
      this._scrollHighlightedIntoView();
    }
  }

  /**
   * Check if a given option matches the currently selected value.
   */
  private _isSelected(opt: TimeOption): boolean {
    if (!this.value) return false;
    return opt.value.hour === this.value.hour && opt.value.minute === this.value.minute;
  }

  override render() {
    return html`
      <div
        class="time-dropdown-wrapper"
        role="listbox"
        aria-label="Select time"
        tabindex="0"
        @keydown=${this._handleKeydown}
      >
        ${this.options.map((opt, i) => {
          const isSelected = this._isSelected(opt);
          const isHighlighted = i === this.highlightedIndex;
          const isBusinessHour = this.businessHours &&
            opt.value.hour >= this.businessHours.start &&
            opt.value.hour < this.businessHours.end;
          return html`
            <div
              role="option"
              class="time-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isBusinessHour ? 'business-hour' : ''}"
              aria-selected=${isSelected ? 'true' : 'false'}
              id="time-opt-${i}"
              @click=${() => this._selectOption(opt)}
              @pointerenter=${() => { this.highlightedIndex = i; }}
            >
              ${opt.display}
            </div>
          `;
        })}
      </div>
    `;
  }
}

// Safe custom element registration for internal component
if (typeof customElements !== 'undefined') {
  if (!customElements.get('lui-time-dropdown')) {
    customElements.define('lui-time-dropdown', TimeDropdown);
  }
}
