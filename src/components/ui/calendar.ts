/**
 * lui-calendar - Accessible calendar display component
 *
 * Renders a 7-column month grid with localized weekday headers,
 * leading/trailing days from adjacent months, and CSS Grid layout.
 * Supports month, year (decade), and decade (century) views for
 * fast drill-down navigation to distant dates.
 */

import { html, css, nothing, isServer, type PropertyValues, type CSSResultGroup } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles, dispatchCustomEvent } from '@lit-ui/core';
import {
  addMonths,
  subMonths,
  getYear,
  getMonth,
  getCalendarDays,
  getMonthYearLabel,
  intlFirstDayToDateFns,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  isBefore,
  isAfter,
  startOfDay,
  getISOWeekNumber,
  getMonthWeeks,
} from './date-utils.js';
import { parseISO } from 'date-fns';
import { getFirstDayOfWeek, getWeekdayNames, getWeekdayLongNames } from './intl-utils.js';
import { KeyboardNavigationManager } from './keyboard-nav.js';
import { GestureHandler } from './gesture-handler.js';
import { AnimationController } from './animation-controller.js';

/**
 * The three view modes for the calendar.
 * - 'month': Standard 7-column day grid
 * - 'year': 4x3 grid of 12 years (decade view)
 * - 'decade': 4x3 grid of 12 decades (century view)
 */
type CalendarView = 'month' | 'year' | 'decade';

/**
 * Represents the parsed date constraint state for the calendar.
 */
export interface DateConstraints {
  minDate: Date | null;
  maxDate: Date | null;
  disabledDates: Date[];
}

/**
 * Result of checking whether a date is disabled.
 */
interface DateDisabledResult {
  disabled: boolean;
  reason: string;
}

/**
 * State object passed to the renderDay callback for custom day cell rendering.
 * Contains all computed state for a single day cell.
 */
export interface DayCellState {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  isOutsideMonth: boolean;
  isInRange: boolean;
  weekNumber: number;
  formattedDate: string;
}

/**
 * Format a date as a full accessible label for screen readers.
 *
 * @param date - The date to format
 * @param locale - BCP 47 locale tag
 * @returns Localized string like "Thursday, January 1, 2026"
 */
function formatDateLabel(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Calendar display component that renders a 7-column month grid.
 *
 * Features:
 * - Localized weekday headers via Intl API
 * - Leading/trailing days from adjacent months with reduced opacity
 * - CSS Grid layout with customizable sizing via CSS custom properties
 * - SSR-safe with isServer guards
 * - Date constraints: min-date, max-date, and disabled-dates with ARIA support
 * - Month, year, and decade views for fast date navigation
 *
 * @element lui-calendar
 * @fires change - Dispatched when a date is selected, with { date: Date, isoString: string }
 * @fires month-change - Dispatched when the displayed month changes
 */
export class Calendar extends TailwindElement {
  static override styles: CSSResultGroup = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
        container-type: inline-size;
      }

      .calendar {
        width: var(--ui-calendar-width, 100%);
        max-width: 380px;
      }

      .calendar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
      }

      .calendar-header h2 {
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0;
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

      .view-heading {
        font-size: 0.875rem;
        font-weight: 600;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: var(--ui-calendar-radius, 0.375rem);
        color: inherit;
      }

      .view-heading:hover {
        background-color: var(--ui-calendar-hover-bg);
      }

      .view-heading:focus-visible {
        outline: 2px solid var(--ui-calendar-focus-ring, var(--color-ring));
        outline-offset: 2px;
      }

      .view-heading.top-level {
        cursor: default;
      }

      .view-heading.top-level:hover {
        background: none;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }

      .calendar-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: var(--ui-calendar-gap, 0.125rem);
        text-align: center;
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: var(--ui-calendar-gap, 0.125rem);
      }

      .weekday-header {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--ui-calendar-weekday-color);
        padding: 0.5rem 0;
      }

      .date-button {
        width: var(--ui-calendar-day-size, 2.5rem);
        height: var(--ui-calendar-day-size, 2.5rem);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--ui-calendar-radius, 0.375rem);
        border: 2px solid transparent;
        background: none;
        cursor: pointer;
        font-size: 0.875rem;
        margin: 0 auto;
        color: inherit;
      }

      .date-button:hover {
        background-color: var(--ui-calendar-hover-bg);
      }

      .date-button.outside-month {
        opacity: var(--ui-calendar-outside-opacity, 0.4);
      }

      .date-button.today {
        border: 2px solid var(--ui-calendar-today-border, var(--color-primary));
        font-weight: 600;
      }

      .date-button[aria-selected="true"] {
        background-color: var(--ui-calendar-selected-bg, var(--color-primary));
        color: var(--ui-calendar-selected-text, white);
      }

      .date-button[aria-selected="true"]:hover {
        background-color: var(--ui-calendar-selected-bg, var(--color-primary));
        filter: brightness(0.9);
      }

      .date-button:focus-visible {
        outline: 2px solid var(--ui-calendar-focus-ring, var(--color-ring));
        outline-offset: 2px;
      }

      .date-button[aria-disabled="true"] {
        opacity: var(--ui-calendar-disabled-opacity, 0.5);
        cursor: not-allowed;
        pointer-events: none;
      }

      .year-grid,
      .decade-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.25rem;
        padding: 0.5rem;
      }

      .year-cell,
      .decade-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.75rem 0.5rem;
        border-radius: var(--ui-calendar-radius, 0.375rem);
        border: 2px solid transparent;
        background: none;
        cursor: pointer;
        font-size: 0.875rem;
        color: inherit;
      }

      .year-cell:hover,
      .decade-cell:hover {
        background-color: var(--ui-calendar-hover-bg);
      }

      .year-cell:focus-visible,
      .decade-cell:focus-visible {
        outline: 2px solid var(--ui-calendar-focus-ring, var(--color-ring));
        outline-offset: 2px;
      }

      .year-cell.outside,
      .decade-cell.outside {
        opacity: var(--ui-calendar-outside-opacity, 0.4);
      }

      .year-cell.current {
        border-color: var(--ui-calendar-today-border, var(--color-primary));
        font-weight: 600;
      }

      .decade-cell.current {
        border-color: var(--ui-calendar-today-border, var(--color-primary));
        font-weight: 600;
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
        border-width: 0;
      }

      .help-button {
        font-size: 0.75rem;
        color: var(--ui-calendar-weekday-color);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        text-decoration: underline;
      }

      .help-dialog {
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid var(--ui-calendar-border);
        max-width: 320px;
      }

      .help-dialog::backdrop {
        background: rgba(0, 0, 0, 0.3);
      }

      .shortcut-list {
        list-style: none;
        padding: 0;
        margin: 0.5rem 0;
        font-size: 0.875rem;
      }

      .shortcut-list li {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
      }

      .shortcut-list kbd {
        font-family: monospace;
        background: var(--ui-calendar-hover-bg);
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
      }

      /* Constraint tooltip for disabled dates */
      .date-button[data-tooltip],
      .date-button-wrapper[data-tooltip] {
        position: relative;
      }

      .date-button[data-tooltip]:hover::after,
      .date-button-wrapper[data-tooltip]:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: calc(100% + 4px);
        left: 50%;
        transform: translateX(-50%);
        padding: 0.25rem 0.5rem;
        background: var(--ui-calendar-tooltip-bg);
        color: var(--ui-calendar-tooltip-text);
        font-size: 0.6875rem;
        line-height: 1.25;
        border-radius: 0.25rem;
        white-space: nowrap;
        z-index: 10;
        pointer-events: none;
      }

      .month-grid {
        overflow: hidden;
      }

      .calendar-weekdays-with-weeks {
        display: grid;
        grid-template-columns: auto repeat(7, 1fr);
        gap: var(--ui-calendar-gap, 0.125rem);
        text-align: center;
      }

      .calendar-grid-with-weeks {
        display: grid;
        grid-template-columns: auto repeat(7, 1fr);
        gap: var(--ui-calendar-gap, 0.125rem);
      }

      .week-number {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        color: var(--ui-calendar-weekday-color);
        cursor: pointer;
        padding: 0.25rem;
        border: none;
        background: none;
        border-radius: var(--ui-calendar-radius, 0.375rem);
        width: 2rem;
      }

      .week-number:hover {
        background-color: var(--ui-calendar-hover-bg);
      }

      .week-number:focus-visible {
        outline: 2px solid var(--ui-calendar-focus-ring, var(--color-ring));
        outline-offset: 2px;
      }

      .week-number-header {
        width: 2rem;
      }

      .date-button-wrapper {
        width: var(--ui-calendar-day-size, 2.5rem);
        height: var(--ui-calendar-day-size, 2.5rem);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--ui-calendar-radius, 0.375rem);
        border: 2px solid transparent;
        background: none;
        cursor: pointer;
        font-size: 0.875rem;
        margin: 0 auto;
        color: inherit;
      }

      .date-button-wrapper:hover {
        background-color: var(--ui-calendar-hover-bg);
      }

      .date-button-wrapper.outside-month {
        opacity: var(--ui-calendar-outside-opacity, 0.4);
      }

      .date-button-wrapper.today {
        border: 2px solid var(--ui-calendar-today-border, var(--color-primary));
        font-weight: 600;
      }

      .date-button-wrapper[aria-selected="true"] {
        background-color: var(--ui-calendar-selected-bg, var(--color-primary));
        color: var(--ui-calendar-selected-text, white);
      }

      .date-button-wrapper[aria-selected="true"]:hover {
        background-color: var(--ui-calendar-selected-bg, var(--color-primary));
        filter: brightness(0.9);
      }

      .date-button-wrapper:focus-visible {
        outline: 2px solid var(--ui-calendar-focus-ring, var(--color-ring));
        outline-offset: 2px;
      }

      .date-button-wrapper[aria-disabled="true"] {
        opacity: var(--ui-calendar-disabled-opacity, 0.5);
        cursor: not-allowed;
        pointer-events: none;
      }

      /* Container query: compact (<280px) */
      @container (max-width: 279px) {
        .calendar {
          --ui-calendar-day-size: 1.75rem;
        }
        .calendar-header h2,
        .view-heading {
          font-size: 0.75rem;
        }
        .weekday-header {
          font-size: 0.625rem;
          padding: 0.25rem 0;
        }
        .date-button, .date-button-wrapper {
          font-size: 0.75rem;
        }
        .nav-button {
          width: 1.5rem;
          height: 1.5rem;
        }
        .nav-button svg {
          width: 0.75rem;
          height: 0.75rem;
        }
        .year-cell, .decade-cell {
          padding: 0.5rem 0.25rem;
          font-size: 0.75rem;
        }
        .week-number {
          font-size: 0.625rem;
          width: 1.5rem;
        }
        .help-button {
          font-size: 0.625rem;
        }
      }

      /* Container query: spacious (>380px) */
      @container (min-width: 381px) {
        .calendar {
          --ui-calendar-day-size: 3rem;
        }
        .date-button, .date-button-wrapper {
          font-size: 1rem;
        }
        .weekday-header {
          font-size: 0.875rem;
        }
        .calendar-header h2,
        .view-heading {
          font-size: 1rem;
        }
        .year-cell, .decade-cell {
          padding: 1rem 0.75rem;
          font-size: 1rem;
        }
      }
    `,
  ];

  /**
   * Selected date as ISO string (YYYY-MM-DD).
   */
  @property({ type: String })
  value = '';

  /**
   * BCP 47 locale tag for localization.
   * Defaults to navigator.language on client, 'en-US' on server.
   */
  @property({ type: String })
  locale = '';

  /**
   * Minimum selectable date as ISO string (YYYY-MM-DD).
   * Dates before this are visually grayed and not selectable.
   */
  @property({ type: String, attribute: 'min-date' })
  minDate = '';

  /**
   * Maximum selectable date as ISO string (YYYY-MM-DD).
   * Dates after this are visually grayed and not selectable.
   */
  @property({ type: String, attribute: 'max-date' })
  maxDate = '';

  /**
   * Array of specific disabled dates as ISO strings (YYYY-MM-DD).
   * These dates are visually grayed and not selectable.
   */
  @property({
    attribute: 'disabled-dates',
    converter: {
      fromAttribute: (value: string | null) =>
        value ? value.split(',').map(s => s.trim()).filter(Boolean) : [],
    },
  })
  disabledDates: string[] = [];

  /**
   * Override the first day of week detected from locale.
   * Accepts Intl format values: 1=Monday through 7=Sunday.
   * When empty or invalid, falls back to locale detection.
   */
  @property({ type: String, attribute: 'first-day-of-week' })
  firstDayOfWeekOverride = '';

  /**
   * The currently displayed month.
   */
  @state()
  private currentMonth = new Date();

  /**
   * The currently selected date.
   */
  @state()
  private selectedDate: Date | null = null;

  /**
   * The current calendar view mode.
   */
  @state()
  private currentView: CalendarView = 'month';

  /**
   * Text for the dedicated aria-live announcement region.
   */
  @state()
  private liveAnnouncement = '';

  /**
   * Whether the keyboard shortcuts help dialog is open.
   */
  @state()
  private showHelp = false;

  /**
   * Parsed date constraints derived from minDate, maxDate, and disabledDates properties.
   */
  private parsedConstraints: DateConstraints = {
    minDate: null,
    maxDate: null,
    disabledDates: [],
  };

  /**
   * Reference to the native dialog element for help shortcuts.
   */
  @query('.help-dialog')
  private helpDialog!: HTMLDialogElement;

  /**
   * Keyboard navigation manager for roving tabindex (imperative, not reactive).
   */
  private navigationManager: KeyboardNavigationManager | null = null;

  /**
   * Track previous view for detecting view changes in updated().
   */
  private previousView: CalendarView = 'month';

  /**
   * Override the displayed month externally (e.g., from CalendarMulti).
   * Accepts ISO strings in YYYY-MM-DD or YYYY-MM format.
   * When set, currentMonth is driven by this property.
   */
  @property({ type: String, attribute: 'display-month' })
  displayMonth = '';

  /**
   * When true, hides the calendar header (prev/next buttons and heading).
   * Used by CalendarMulti to suppress individual calendar navigation.
   */
  @property({ type: Boolean, attribute: 'hide-navigation' })
  hideNavigation = false;

  /**
   * Whether to display ISO week numbers in a column.
   */
  @property({ type: Boolean, attribute: 'show-week-numbers' })
  showWeekNumbers = false;

  /**
   * Whether to show constraint tooltips on disabled dates.
   * When true, hovering over a disabled date shows a tooltip
   * explaining why it's disabled (e.g., "Before minimum date").
   */
  @property({ type: Boolean, attribute: 'show-constraint-tooltips' })
  showConstraintTooltips = false;

  /**
   * Callback for custom day cell rendering.
   * Receives DayCellState and returns a Lit template result.
   * When null, default rendering is used.
   */
  @property({ attribute: false })
  renderDay: ((state: DayCellState) => unknown) | null = null;

  /**
   * GestureHandler for swipe navigation on touch devices.
   */
  private gestureHandler: GestureHandler | null = null;

  /**
   * AnimationController for slide/fade month transitions.
   */
  private animationController: AnimationController | null = null;

  /**
   * Track direction of last navigation for triggering animation after render.
   */
  private lastNavigationDirection: 'left' | 'right' | null = null;

  /**
   * Initialize keyboard navigation manager after first render.
   */
  protected override firstUpdated(): void {
    if (isServer) return;
    this.navigationManager = new KeyboardNavigationManager(7);
    requestAnimationFrame(() => this.setupCells());

    // Initialize gesture handler and animation controller on month-grid wrapper
    this.updateComplete.then(() => {
      const grid = this.renderRoot.querySelector('.month-grid') as HTMLElement;
      if (grid) {
        this.gestureHandler = new GestureHandler(grid, (direction) => {
          if (direction === 'left') this.navigateNextMonth();
          else this.navigatePrevMonth();
        });
        this.gestureHandler.attach();
        this.animationController = new AnimationController(grid);
      }
    });
  }

  /**
   * Clean up gesture handler and animation controller on disconnect.
   */
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.gestureHandler?.detach();
    this.animationController?.destroy();
  }

  /**
   * Query current-month date buttons and initialize roving tabindex.
   * Sets initial focus to today (if visible) or first day of month.
   */
  private setupCells(): void {
    if (!this.navigationManager) return;
    // Query both .date-button and .date-button-wrapper (renderDay callback uses wrapper)
    // Exclude .week-number buttons — they are not part of keyboard navigation
    const buttons = Array.from(
      this.renderRoot.querySelectorAll('.date-button:not(.outside-month), .date-button-wrapper:not(.outside-month)')
    ) as HTMLElement[];
    this.navigationManager.setCells(buttons);

    // Try to focus today, otherwise first cell
    const todayIndex = buttons.findIndex(
      (btn) => btn.classList.contains('today')
    );
    if (todayIndex >= 0) {
      this.navigationManager.setFocusedIndex(todayIndex);
    } else {
      this.navigationManager.setFocusedIndex(0);
    }
  }

  /**
   * Initialize keyboard navigation for the current view.
   * Sets column count and cell references for year/decade grids.
   */
  private setupViewCells(): void {
    if (!this.navigationManager) return;

    if (this.currentView === 'month') {
      this.navigationManager.setColumns(7);
      this.setupCells();
    } else if (this.currentView === 'year') {
      this.navigationManager.setColumns(4);
      const buttons = Array.from(
        this.renderRoot.querySelectorAll('.year-cell')
      ) as HTMLElement[];
      this.navigationManager.setCells(buttons);
      this.navigationManager.setFocusedIndex(0);
    } else if (this.currentView === 'decade') {
      this.navigationManager.setColumns(4);
      const buttons = Array.from(
        this.renderRoot.querySelectorAll('.decade-cell')
      ) as HTMLElement[];
      this.navigationManager.setCells(buttons);
      this.navigationManager.setFocusedIndex(0);
    }
  }

  /**
   * Switch to the parent view level.
   * month -> year, year -> decade, decade stays.
   */
  private drillUp(): void {
    if (this.currentView === 'month') {
      this.currentView = 'year';
    } else if (this.currentView === 'year') {
      this.currentView = 'decade';
    }
    // decade is top level, do nothing
  }

  /**
   * Switch to a specific child view level.
   * Initializes keyboard navigation after the view renders.
   */
  private drillDown(view: CalendarView): void {
    this.currentView = view;
    this.updateComplete.then(() => {
      requestAnimationFrame(() => this.setupViewCells());
    });
  }

  /**
   * Handle click on the view heading button to drill up.
   */
  private handleViewHeadingClick(): void {
    this.drillUp();
  }

  /**
   * Handle keyboard events on the view heading button.
   */
  private handleViewHeadingKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.drillUp();
    }
  }

  /**
   * Handle keyboard navigation on the calendar grid.
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (!this.navigationManager) return;

    // Escape key navigates back one view level
    if (e.key === 'Escape') {
      if (this.currentView === 'decade') {
        e.preventDefault();
        this.drillDown('year');
      } else if (this.currentView === 'year') {
        e.preventDefault();
        this.drillDown('month');
      }
      return;
    }

    // Enter/Space handling for year and decade views
    if (this.currentView === 'year' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      const idx = this.navigationManager.getFocusedIndex();
      const buttons = Array.from(
        this.renderRoot.querySelectorAll('.year-cell')
      ) as HTMLElement[];
      if (buttons[idx]) {
        buttons[idx].click();
      }
      return;
    }

    if (this.currentView === 'decade' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      const idx = this.navigationManager.getFocusedIndex();
      const buttons = Array.from(
        this.renderRoot.querySelectorAll('.decade-cell')
      ) as HTMLElement[];
      if (buttons[idx]) {
        buttons[idx].click();
      }
      return;
    }

    const keyMap: Record<string, 'left' | 'right' | 'up' | 'down' | 'home' | 'end'> = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
      Home: 'home',
      End: 'end',
    };

    const direction = keyMap[e.key];
    if (direction) {
      e.preventDefault();
      const result = this.navigationManager.moveFocus(direction);

      // Boundary crossing only applies in month view (navigate months)
      // In year/decade views, boundary just stops (no wrapping)
      if (result === -1 && this.currentView === 'month') {
        if (direction === 'left' || direction === 'up') {
          this.navigatePrevMonth();
          this.updateComplete.then(() => {
            requestAnimationFrame(() => {
              this.setupCells();
              // Focus last cell when navigating backward
              const buttons = Array.from(
                this.renderRoot.querySelectorAll('.date-button:not(.outside-month), .date-button-wrapper:not(.outside-month)')
              ) as HTMLElement[];
              if (buttons.length > 0) {
                this.navigationManager!.setFocusedIndex(buttons.length - 1);
                this.navigationManager!.focusCurrent();
              }
            });
          });
        } else {
          this.navigateNextMonth();
          this.updateComplete.then(() => {
            requestAnimationFrame(() => {
              this.setupCells();
              this.navigationManager!.focusCurrent();
            });
          });
        }
      }
      return;
    }

    // PageUp/PageDown only in month view
    if (this.currentView === 'month') {
      if (e.key === 'PageUp') {
        e.preventDefault();
        const currentIdx = this.navigationManager.getFocusedIndex();
        this.navigatePrevMonth();
        this.updateComplete.then(() => {
          requestAnimationFrame(() => {
            this.setupCells();
            this.navigationManager!.setFocusedIndex(currentIdx);
            this.navigationManager!.focusCurrent();
          });
        });
        return;
      }

      if (e.key === 'PageDown') {
        e.preventDefault();
        const currentIdx = this.navigationManager.getFocusedIndex();
        this.navigateNextMonth();
        this.updateComplete.then(() => {
          requestAnimationFrame(() => {
            this.setupCells();
            this.navigationManager!.setFocusedIndex(currentIdx);
            this.navigationManager!.focusCurrent();
          });
        });
        return;
      }
    }

    if (this.currentView === 'month' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      const idx = this.navigationManager.getFocusedIndex();
      const buttons = Array.from(
        this.renderRoot.querySelectorAll('.date-button:not(.outside-month)')
      ) as HTMLElement[];
      if (buttons[idx]) {
        buttons[idx].click();
      }
      return;
    }
  }

  /**
   * Sync view state, value property, and date constraints when reactive properties change.
   */
  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    // Detect view changes and reinitialize keyboard nav
    if (this.currentView !== this.previousView) {
      this.previousView = this.currentView;
      if (!isServer) {
        this.updateComplete.then(() => {
          requestAnimationFrame(() => this.setupViewCells());
        });
      }
    }

    if (changedProperties.has('currentMonth' as keyof this)) {
      if (!isServer && this.currentView === 'month') {
        requestAnimationFrame(() => this.setupCells());
      }
      // Trigger animation after DOM updates with new content
      if (!isServer && this.lastNavigationDirection && this.animationController) {
        const direction = this.lastNavigationDirection;
        this.lastNavigationDirection = null;
        this.animationController.transition(direction);
      }
    }
    // Parse display-month when it changes to drive currentMonth externally
    if (changedProperties.has('displayMonth') && this.displayMonth) {
      const raw = this.displayMonth.trim();
      if (raw.length === 7) {
        // YYYY-MM format — append '-01' for valid ISO date
        this.currentMonth = parseISO(raw + '-01');
      } else if (raw.length >= 10) {
        // YYYY-MM-DD format
        this.currentMonth = parseISO(raw);
      }
    }
    if (changedProperties.has('value') && this.value) {
      this.selectedDate = parseISO(this.value);
    }
    // Parse constraint properties to Date objects when they change
    if (changedProperties.has('minDate')) {
      this.parsedConstraints = {
        ...this.parsedConstraints,
        minDate: this.minDate ? startOfDay(parseISO(this.minDate)) : null,
      };
    }
    if (changedProperties.has('maxDate')) {
      this.parsedConstraints = {
        ...this.parsedConstraints,
        maxDate: this.maxDate ? startOfDay(parseISO(this.maxDate)) : null,
      };
    }
    if (changedProperties.has('disabledDates' as keyof this)) {
      this.parsedConstraints = {
        ...this.parsedConstraints,
        disabledDates: this.disabledDates.map((d) => startOfDay(parseISO(d))),
      };
    }
  }

  /**
   * Check whether a date is disabled based on min/max/disabled constraints.
   *
   * @param date - The date to check
   * @returns Object with disabled flag and human-readable reason
   */
  private isDateDisabled(date: Date): DateDisabledResult {
    const normalized = startOfDay(date);
    const { minDate, maxDate, disabledDates } = this.parsedConstraints;

    if (minDate && isBefore(normalized, minDate)) {
      return { disabled: true, reason: 'Before minimum date' };
    }
    if (maxDate && isAfter(normalized, maxDate)) {
      return { disabled: true, reason: 'After maximum date' };
    }
    if (disabledDates.some((d) => isSameDay(d, normalized))) {
      return { disabled: true, reason: 'Unavailable' };
    }
    return { disabled: false, reason: '' };
  }

  /**
   * Resolved locale, falling back to navigator.language or 'en-US'.
   */
  private get effectiveLocale(): string {
    return this.locale || (isServer ? 'en-US' : navigator.language);
  }

  /**
   * First day of week in Intl format (1=Mon ... 7=Sun).
   * Uses the override property if valid (1-7), otherwise detects from locale.
   */
  private get firstDayOfWeek(): number {
    if (this.firstDayOfWeekOverride) {
      const parsed = parseInt(this.firstDayOfWeekOverride, 10);
      if (parsed >= 1 && parsed <= 7) {
        return parsed;
      }
    }
    return getFirstDayOfWeek(this.effectiveLocale);
  }

  /**
   * First day of week in date-fns format (0=Sun ... 6=Sat).
   */
  private get weekStartsOn(): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
    return intlFirstDayToDateFns(this.firstDayOfWeek);
  }

  /**
   * Navigate to the previous month.
   */
  private navigatePrevMonth(): void {
    this.lastNavigationDirection = 'right';
    this.currentMonth = subMonths(this.currentMonth, 1);
    this.emitMonthChange();
    this.announceMonthChange();
  }

  /**
   * Navigate to the next month.
   */
  private navigateNextMonth(): void {
    this.lastNavigationDirection = 'left';
    this.currentMonth = addMonths(this.currentMonth, 1);
    this.emitMonthChange();
    this.announceMonthChange();
  }

  /**
   * Navigate year view to previous decade.
   */
  private navigatePrevDecade(): void {
    const newDate = new Date(this.currentMonth);
    newDate.setFullYear(getYear(this.currentMonth) - 10);
    this.currentMonth = newDate;
  }

  /**
   * Navigate year view to next decade.
   */
  private navigateNextDecade(): void {
    const newDate = new Date(this.currentMonth);
    newDate.setFullYear(getYear(this.currentMonth) + 10);
    this.currentMonth = newDate;
  }

  /**
   * Navigate decade view to previous century.
   */
  private navigatePrevCentury(): void {
    const newDate = new Date(this.currentMonth);
    newDate.setFullYear(getYear(this.currentMonth) - 100);
    this.currentMonth = newDate;
  }

  /**
   * Navigate decade view to next century.
   */
  private navigateNextCentury(): void {
    const newDate = new Date(this.currentMonth);
    newDate.setFullYear(getYear(this.currentMonth) + 100);
    this.currentMonth = newDate;
  }

  /**
   * Select a year from the year view and drill down to month view.
   */
  private selectYear(year: number): void {
    const newDate = new Date(this.currentMonth);
    newDate.setFullYear(year);
    newDate.setMonth(0);
    newDate.setDate(1);
    this.currentMonth = newDate;
    this.drillDown('month');
  }

  /**
   * Select a decade from the decade view and drill down to year view.
   */
  private selectDecade(decade: number): void {
    const newDate = new Date(this.currentMonth);
    newDate.setFullYear(decade);
    newDate.setMonth(0);
    newDate.setDate(1);
    this.currentMonth = newDate;
    this.drillDown('year');
  }

  /**
   * Emit month-change event with the current year and month.
   */
  private emitMonthChange(): void {
    dispatchCustomEvent(this, 'month-change', {
      year: getYear(this.currentMonth),
      month: getMonth(this.currentMonth),
    });
  }

  /**
   * Announce the current month to screen readers via the aria-live region.
   */
  private announceMonthChange(): void {
    this.liveAnnouncement = 'Now showing ' + getMonthYearLabel(this.currentMonth, this.effectiveLocale);
  }

  /**
   * Open the keyboard shortcuts help dialog.
   */
  private openHelpDialog(): void {
    this.showHelp = true;
    if (!isServer) {
      this.updateComplete.then(() => {
        this.helpDialog?.showModal();
      });
    }
  }

  /**
   * Close the keyboard shortcuts help dialog.
   */
  private closeHelpDialog(): void {
    this.showHelp = false;
    if (!isServer) {
      this.helpDialog?.close();
    }
  }

  /**
   * Handle date selection via click.
   * Skips outside-month dates and disabled dates, sets selectedDate, updates value, and emits change.
   */
  private handleDateSelect(date: Date): void {
    if (!isSameMonth(date, this.currentMonth)) {
      return;
    }
    const { disabled } = this.isDateDisabled(date);
    if (disabled) {
      return;
    }
    this.selectedDate = date;
    this.value = format(date, 'yyyy-MM-dd');
    dispatchCustomEvent(this, 'change', {
      date: date,
      isoString: this.value,
    });
    this.liveAnnouncement = 'Selected ' + formatDateLabel(date, this.effectiveLocale);
  }

  /**
   * Render the main calendar dispatching to view-specific renderers.
   */
  protected override render() {
    switch (this.currentView) {
      case 'year':
        return this.renderYearView();
      case 'decade':
        return this.renderDecadeView();
      default:
        return this.renderMonthView();
    }
  }

  /**
   * Render the standard month view with 7-column day grid.
   */
  private renderMonthView() {
    const weekdays = getWeekdayNames(this.effectiveLocale, this.firstDayOfWeek);
    const weekdayLongNames = getWeekdayLongNames(this.effectiveLocale, this.firstDayOfWeek);
    const days = getCalendarDays(this.currentMonth, this.weekStartsOn);
    const monthLabel = getMonthYearLabel(this.currentMonth, this.effectiveLocale);
    const weeks = this.showWeekNumbers ? getMonthWeeks(this.currentMonth, this.weekStartsOn) : null;

    const weekdaysClass = this.showWeekNumbers ? 'calendar-weekdays-with-weeks' : 'calendar-weekdays';
    const gridClass = this.showWeekNumbers ? 'calendar-grid-with-weeks' : 'calendar-grid';

    return html`
      <div class="calendar">
        ${this.hideNavigation ? nothing : html`
        <div class="calendar-header">
          <button
            class="nav-button"
            @click="${this.navigatePrevMonth}"
            aria-label="Previous month, ${getMonthYearLabel(subMonths(this.currentMonth, 1), this.effectiveLocale)}"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            class="view-heading"
            @click="${this.handleViewHeadingClick}"
            @keydown="${this.handleViewHeadingKeydown}"
            aria-label="Switch to year view"
          >
            ${monthLabel}
          </button>
          <h2 id="month-heading" class="sr-only" aria-live="polite">${monthLabel}</h2>
          <button
            class="nav-button"
            @click="${this.navigateNextMonth}"
            aria-label="Next month, ${getMonthYearLabel(addMonths(this.currentMonth, 1), this.effectiveLocale)}"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        `}
        <div class="month-grid">
          <div class="${weekdaysClass}" role="row">
            ${this.showWeekNumbers ? html`<div class="weekday-header week-number-header" role="columnheader" aria-label="Week number"></div>` : nothing}
            ${weekdays.map(
              (name, i) => html`
                <div
                  class="weekday-header"
                  role="columnheader"
                  aria-label="${weekdayLongNames[i]}"
                >
                  ${name}
                </div>
              `
            )}
          </div>
          <div
            class="${gridClass}"
            role="grid"
            aria-labelledby="month-heading"
            @keydown="${this.handleKeydown}"
          >
            ${this.showWeekNumbers && weeks
              ? this.renderWeeksWithNumbers(weeks)
              : this.renderFlatDays(days)}
          </div>
        </div>
        <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          ${this.liveAnnouncement}
        </div>
        <div style="text-align: center; padding: 0.25rem;">
          <button
            class="help-button"
            @click="${this.openHelpDialog}"
            aria-label="Keyboard shortcuts"
          >
            ? Keyboard shortcuts
          </button>
        </div>
        <dialog class="help-dialog" @close="${() => this.showHelp = false}">
          <h3 style="margin: 0 0 0.5rem; font-size: 1rem; font-weight: 600;">Keyboard Shortcuts</h3>
          <ul class="shortcut-list">
            <li><span>Previous day</span> <kbd>&#8592;</kbd></li>
            <li><span>Next day</span> <kbd>&#8594;</kbd></li>
            <li><span>Previous week</span> <kbd>&#8593;</kbd></li>
            <li><span>Next week</span> <kbd>&#8595;</kbd></li>
            <li><span>Previous month</span> <kbd>PageUp</kbd></li>
            <li><span>Next month</span> <kbd>PageDown</kbd></li>
            <li><span>Start of month</span> <kbd>Home</kbd></li>
            <li><span>End of month</span> <kbd>End</kbd></li>
            <li><span>Select date</span> <kbd>Enter</kbd></li>
            <li><span>Year view</span> <kbd>Click heading</kbd></li>
            <li><span>Back to month</span> <kbd>Escape</kbd></li>
          </ul>
          <button
            @click="${this.closeHelpDialog}"
            style="margin-top: 0.5rem; padding: 0.375rem 0.75rem; border: 1px solid var(--ui-calendar-border); border-radius: 0.25rem; background: none; cursor: pointer;"
          >
            Close
          </button>
        </dialog>
      </div>
    `;
  }

  /**
   * Render days as a flat grid (no week numbers).
   */
  private renderFlatDays(days: Date[]) {
    const tracker = { found: false };
    return days.map((day) => this.renderDayCell(day, tracker));
  }

  /**
   * Render weeks with week number buttons prepended to each row.
   */
  private renderWeeksWithNumbers(weeks: import('./date-utils.js').WeekInfo[]) {
    const tracker = { found: false };
    return weeks.map((week) => {
      const weekNumberButton = html`
        <button
          class="week-number"
          tabindex="-1"
          aria-label="Week ${week.weekNumber}, select entire week"
          @click="${() => this.handleWeekSelect(week.days)}"
        >
          ${week.weekNumber}
        </button>
      `;
      const dayCells = week.days.map((day) =>
        this.renderDayCell(day, tracker)
      );
      return html`${weekNumberButton}${dayCells}`;
    });
  }

  /**
   * Render a single day cell, supporting the renderDay callback.
   */
  private renderDayCell(
    day: Date,
    tracker: { found: boolean },
  ) {
    const outsideMonth = !isSameMonth(day, this.currentMonth);
    const todayFlag = isToday(day);
    const selected = this.selectedDate !== null && isSameDay(day, this.selectedDate);
    const constraint = this.isDateDisabled(day);
    const isDisabled = outsideMonth || constraint.disabled;
    const label = constraint.disabled
      ? `${formatDateLabel(day, this.effectiveLocale)}, ${constraint.reason}`
      : formatDateLabel(day, this.effectiveLocale);

    // Initial tabindex: first current-month cell gets 0, all others -1
    let initialTabindex = -1;
    if (!outsideMonth && !tracker.found) {
      tracker.found = true;
      initialTabindex = 0;
    }

    // Build DayCellState for renderDay callback
    if (this.renderDay) {
      const dayCellState: DayCellState = {
        date: day,
        isToday: todayFlag,
        isSelected: selected,
        isDisabled,
        isOutsideMonth: outsideMonth,
        isInRange: !isDisabled,
        weekNumber: getISOWeekNumber(day),
        formattedDate: format(day, 'yyyy-MM-dd'),
      };
      return html`
        <div
          class="date-button-wrapper ${outsideMonth ? 'outside-month' : ''} ${todayFlag ? 'today' : ''}"
          tabindex="${initialTabindex}"
          role="gridcell"
          aria-label="${label}"
          aria-current="${todayFlag ? 'date' : nothing}"
          aria-selected="${selected ? 'true' : 'false'}"
          aria-disabled="${isDisabled ? 'true' : 'false'}"
          data-tooltip="${this.showConstraintTooltips && constraint.disabled && constraint.reason ? constraint.reason : nothing}"
          @click="${() => this.handleDateSelect(day)}"
        >
          ${this.renderDay(dayCellState)}
        </div>
      `;
    }

    return html`
      <button
        class="date-button ${outsideMonth ? 'outside-month' : ''} ${todayFlag ? 'today' : ''}"
        tabindex="${initialTabindex}"
        aria-label="${label}"
        aria-current="${todayFlag ? 'date' : nothing}"
        aria-selected="${selected ? 'true' : 'false'}"
        aria-disabled="${isDisabled ? 'true' : 'false'}"
        data-tooltip="${this.showConstraintTooltips && constraint.disabled && constraint.reason ? constraint.reason : nothing}"
        @click="${() => this.handleDateSelect(day)}"
      >
        ${day.getDate()}
      </button>
    `;
  }

  /**
   * Handle week number click — select all current-month, non-disabled days in the week.
   */
  private handleWeekSelect(weekDays: Date[]): void {
    const filteredDays = weekDays.filter((day) => {
      if (!isSameMonth(day, this.currentMonth)) return false;
      const { disabled } = this.isDateDisabled(day);
      return !disabled;
    });

    // Determine week number from Thursday (ISO 8601)
    const thursday = weekDays.find((d) => d.getDay() === 4) ?? weekDays[0];
    const weekNumber = getISOWeekNumber(thursday);

    dispatchCustomEvent(this, 'week-select', {
      weekNumber,
      dates: filteredDays,
      isoStrings: filteredDays.map((d) => format(d, 'yyyy-MM-dd')),
    });

    this.liveAnnouncement = `Selected week ${weekNumber}`;
  }

  /**
   * Render the year view showing a 4x3 grid of 12 years (decade).
   */
  private renderYearView() {
    const currentYear = getYear(this.currentMonth);
    const decadeStart = Math.floor(currentYear / 10) * 10;
    const years: number[] = [];
    for (let y = decadeStart - 1; y <= decadeStart + 10; y++) {
      years.push(y);
    }
    const headingLabel = `${decadeStart}\u2013${decadeStart + 9}`;

    return html`
      <div class="calendar">
        ${this.hideNavigation ? nothing : html`
        <div class="calendar-header">
          <button
            class="nav-button"
            @click="${this.navigatePrevDecade}"
            aria-label="Previous decade"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            class="view-heading"
            @click="${this.handleViewHeadingClick}"
            @keydown="${this.handleViewHeadingKeydown}"
            aria-label="Switch to decade view"
          >
            ${headingLabel}
          </button>
          <button
            class="nav-button"
            @click="${this.navigateNextDecade}"
            aria-label="Next decade"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        `}
        <div
          class="year-grid"
          role="grid"
          aria-label="${headingLabel}"
          @keydown="${this.handleKeydown}"
        >
          ${years.map((year) => {
            const outside = year < decadeStart || year > decadeStart + 9;
            const current = year === currentYear;
            return html`
              <button
                class="year-cell ${outside ? 'outside' : ''} ${current ? 'current' : ''}"
                tabindex="-1"
                aria-label="${year}"
                @click="${() => this.selectYear(year)}"
              >
                ${year}
              </button>
            `;
          })}
        </div>
        <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          ${this.liveAnnouncement}
        </div>
      </div>
    `;
  }

  /**
   * Render the decade view showing a 4x3 grid of 12 decades (century).
   */
  private renderDecadeView() {
    const currentYear = getYear(this.currentMonth);
    const centuryStart = Math.floor(currentYear / 100) * 100;
    const decades: number[] = [];
    for (let d = centuryStart - 10; d <= centuryStart + 100; d += 10) {
      decades.push(d);
    }
    const headingLabel = `${centuryStart}\u2013${centuryStart + 99}`;
    const currentDecade = Math.floor(currentYear / 10) * 10;

    return html`
      <div class="calendar">
        ${this.hideNavigation ? nothing : html`
        <div class="calendar-header">
          <button
            class="nav-button"
            @click="${this.navigatePrevCentury}"
            aria-label="Previous century"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span class="view-heading top-level" aria-label="${headingLabel}">
            ${headingLabel}
          </span>
          <button
            class="nav-button"
            @click="${this.navigateNextCentury}"
            aria-label="Next century"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        `}
        <div
          class="decade-grid"
          role="grid"
          aria-label="${headingLabel}"
          @keydown="${this.handleKeydown}"
        >
          ${decades.map((decade) => {
            const outside = decade < centuryStart || decade >= centuryStart + 100;
            const current = decade === currentDecade;
            return html`
              <button
                class="decade-cell ${outside ? 'outside' : ''} ${current ? 'current' : ''}"
                tabindex="-1"
                aria-label="${decade} to ${decade + 9}"
                @click="${() => this.selectDecade(decade)}"
              >
                ${decade}
              </button>
            `;
          })}
        </div>
        <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
          ${this.liveAnnouncement}
        </div>
      </div>
    `;
  }
}
