/**
 * lui-calendar-multi - Multi-month calendar wrapper component
 *
 * Renders 2-3 side-by-side Calendar instances showing consecutive months.
 * Owns navigation (prev/next); child Calendars hide their navigation.
 * Heading shows month range with en-dash (e.g., "January - March 2026").
 */

import { html, css, nothing, isServer, type CSSResultGroup } from 'lit';
import { property, state } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles, dispatchCustomEvent } from '@lit-ui/core';
import { addMonths, subMonths, getYear, getMonth, format } from './date-utils.js';
import './calendar.js';

/**
 * Multi-month calendar display component.
 *
 * Features:
 * - Renders 2-3 consecutive month calendars side-by-side
 * - Unified navigation (prev/next) controls all child calendars
 * - Range heading shows first and last month with en-dash
 * - Forwards value, locale, constraints, and events to child calendars
 *
 * @element lui-calendar-multi
 * @fires change - Forwarded from child calendar when a date is selected
 * @fires week-select - Forwarded from child calendar when a week is selected
 * @fires month-change - Dispatched when navigation changes the displayed months
 */
export class CalendarMulti extends TailwindElement {
  static override styles: CSSResultGroup = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
        container-type: inline-size;
      }

      .multi-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
      }

      .multi-heading {
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0;
      }

      .multi-wrapper {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .multi-wrapper > * {
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
        background-color: var(--ui-calendar-hover-bg);
      }

      .nav-button:focus-visible {
        outline: 2px solid var(--ui-calendar-focus-ring, var(--color-ring));
        outline-offset: 2px;
      }

      .nav-button svg {
        width: 1rem;
        height: 1rem;
      }

      /* Container query: vertical stacking for narrow containers */
      @container (max-width: 599px) {
        .multi-wrapper {
          flex-direction: column;
        }
      }

      /* Container query: wider gap for spacious containers */
      @container (min-width: 800px) {
        .multi-wrapper {
          gap: 1.5rem;
        }
      }
    `,
  ];

  /**
   * Number of months to display (clamped to 2-3).
   */
  @property({ type: Number })
  months = 2;

  /**
   * Selected date as ISO string (YYYY-MM-DD). Forwarded to child calendars.
   */
  @property({ type: String })
  value = '';

  /**
   * BCP 47 locale tag for localization. Forwarded to child calendars.
   */
  @property({ type: String })
  locale = '';

  /**
   * Minimum selectable date as ISO string (YYYY-MM-DD). Forwarded to child calendars.
   */
  @property({ type: String, attribute: 'min-date' })
  minDate = '';

  /**
   * Maximum selectable date as ISO string (YYYY-MM-DD). Forwarded to child calendars.
   */
  @property({ type: String, attribute: 'max-date' })
  maxDate = '';

  /**
   * Array of specific disabled dates as ISO strings. Forwarded to child calendars.
   */
  @property({ type: Array, attribute: false })
  disabledDates: string[] = [];

  /**
   * Override the first day of week. Forwarded to child calendars.
   */
  @property({ type: String, attribute: 'first-day-of-week' })
  firstDayOfWeekOverride = '';

  /**
   * Whether to show ISO week numbers. Forwarded to child calendars.
   */
  @property({ type: Boolean, attribute: 'show-week-numbers' })
  showWeekNumbers = false;

  /**
   * The base month for the multi-month display.
   * The first calendar shows this month; subsequent calendars show consecutive months.
   */
  @state()
  private currentMonth = new Date();

  /**
   * Clamped month count (2-3).
   */
  private get monthCount(): number {
    return Math.max(2, Math.min(3, this.months));
  }

  /**
   * Navigate to the previous month.
   */
  private navigatePrev(): void {
    this.currentMonth = subMonths(this.currentMonth, 1);
    dispatchCustomEvent(this, 'month-change', {
      year: getYear(this.currentMonth),
      month: getMonth(this.currentMonth),
    });
  }

  /**
   * Navigate to the next month.
   */
  private navigateNext(): void {
    this.currentMonth = addMonths(this.currentMonth, 1);
    dispatchCustomEvent(this, 'month-change', {
      year: getYear(this.currentMonth),
      month: getMonth(this.currentMonth),
    });
  }

  /**
   * Resolved locale, falling back to navigator.language or 'en-US'.
   */
  private get effectiveLocale(): string {
    return this.locale || (isServer ? 'en-US' : navigator.language);
  }

  /**
   * Compute the range heading showing first and last month with en-dash.
   * Examples: "January - February 2026" or "January - March 2026"
   * If months span years: "December 2025 - February 2026"
   */
  private get rangeHeading(): string {
    const firstMonth = this.currentMonth;
    const lastMonth = addMonths(this.currentMonth, this.monthCount - 1);

    const firstYear = getYear(firstMonth);
    const lastYear = getYear(lastMonth);

    const monthFormatter = new Intl.DateTimeFormat(this.effectiveLocale, { month: 'long' });
    const firstName = monthFormatter.format(firstMonth);
    const lastName = monthFormatter.format(lastMonth);

    if (firstYear === lastYear) {
      return `${firstName} \u2013 ${lastName} ${lastYear}`;
    }
    return `${firstName} ${firstYear} \u2013 ${lastName} ${lastYear}`;
  }

  /**
   * Handle date selection events from child calendars.
   * Re-dispatches the event from this component.
   */
  private handleDateSelect(e: Event): void {
    const detail = (e as CustomEvent).detail;
    // Update value to reflect selection
    this.value = detail?.isoString ?? '';
    dispatchCustomEvent(this, 'change', detail);
  }

  /**
   * Handle week selection events from child calendars.
   * Re-dispatches the event from this component.
   */
  private handleWeekSelect(e: Event): void {
    const detail = (e as CustomEvent).detail;
    dispatchCustomEvent(this, 'week-select', detail);
  }

  /**
   * Generate the display-month ISO string for a given month offset.
   */
  private getDisplayMonth(offset: number): string {
    const month = addMonths(this.currentMonth, offset);
    return format(month, 'yyyy-MM-dd');
  }

  protected override render() {
    const months = Array.from({ length: this.monthCount }, (_, i) => i);

    return html`
      <div>
        <div class="multi-header">
          <button
            class="nav-button"
            @click="${this.navigatePrev}"
            aria-label="Previous month"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 class="multi-heading">${this.rangeHeading}</h2>
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
        <div class="multi-wrapper">
          ${months.map(
            (offset) => html`
              <lui-calendar
                display-month="${this.getDisplayMonth(offset)}"
                hide-navigation
                value="${this.value}"
                locale="${this.locale}"
                min-date="${this.minDate}"
                max-date="${this.maxDate}"
                .disabledDates="${this.disabledDates}"
                first-day-of-week="${this.firstDayOfWeekOverride}"
                ?show-week-numbers="${this.showWeekNumbers}"
                @ui-change="${this.handleDateSelect}"
                @ui-week-select="${this.handleWeekSelect}"
              ></lui-calendar>
            `
          )}
        </div>
      </div>
    `;
  }
}
