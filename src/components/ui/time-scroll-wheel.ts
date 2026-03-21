/**
 * TimeScrollWheel - iOS-style scroll wheel time picker
 *
 * Uses CSS scroll-snap for native-feeling momentum scrolling with three
 * columns: hour, minute, and optional AM/PM. The selected value snaps
 * to a highlighted center row. Non-selected items fade out with reduced
 * opacity.
 *
 * @fires ui-scroll-wheel-change - Dispatched when scroll selection changes
 */

import { html, css, nothing, type PropertyValues, type CSSResultGroup } from 'lit';
import { property, state } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles, dispatchCustomEvent } from '@lit-ui/core';
import { type TimeValue, to12Hour, to24Hour } from './time-utils.js';

/** Height of each wheel item in pixels */
const ITEM_HEIGHT = 40;

/** Number of visible items in each column */
const VISIBLE_ITEMS = 5;

/** Debounce timeout (ms) for scrollend fallback */
const SCROLL_DEBOUNCE = 200;

interface WheelItem {
  value: number;
  label: string;
}

export class TimeScrollWheel extends TailwindElement {
  static override styles: CSSResultGroup = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
      }

      .scroll-wheel-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        gap: 0.25rem;
      }

      .wheel-column {
        position: relative;
        width: 60px;
      }

      .wheel-container {
        height: calc(${VISIBLE_ITEMS} * ${ITEM_HEIGHT}px);
        overflow-y: auto;
        scroll-snap-type: y mandatory;
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .wheel-container::-webkit-scrollbar {
        display: none;
      }

      .wheel-item {
        height: ${ITEM_HEIGHT}px;
        scroll-snap-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        font-variant-numeric: tabular-nums;
        color: var(--ui-time-picker-wheel-text);
        opacity: 0.4;
        transition: opacity 0.15s ease;
      }

      .wheel-item.selected {
        opacity: 1;
        font-weight: 600;
        color: var(--ui-time-picker-wheel-selected-text, var(--ui-primary));
      }

      .wheel-highlight {
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        height: ${ITEM_HEIGHT}px;
        border-top: 1px solid var(--ui-time-picker-wheel-highlight-border);
        border-bottom: 1px solid var(--ui-time-picker-wheel-highlight-border);
        background: var(--ui-time-picker-wheel-highlight-bg);
        pointer-events: none;
        z-index: 1;
      }

      .wheel-separator {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--ui-time-picker-wheel-separator);
        user-select: none;
      }
    `,
  ];

  /** Currently selected time value */
  @property({ attribute: false })
  value: TimeValue | null = null;

  /** Whether to display in 12-hour format */
  @property({ type: Boolean })
  hour12 = false;

  /** Minute step interval */
  @property({ type: Number })
  step = 1;

  /** Whether the scroll wheel is disabled */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  @state() private _selectedHour = 0;
  @state() private _selectedMinute = 0;
  @state() private _selectedPeriod: 'AM' | 'PM' = 'AM';

  /** Debounce timers for scroll fallback, keyed by column name */
  private _scrollTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  override updated(changed: PropertyValues): void {
    if (changed.has('value') && this.value) {
      if (this.hour12) {
        const converted = to12Hour(this.value.hour);
        this._selectedHour = converted.hour;
        this._selectedPeriod = converted.period;
      } else {
        this._selectedHour = this.value.hour;
      }
      this._selectedMinute = this.value.minute;

      // Scroll each column to selected position after render
      this.updateComplete.then(() => {
        this._scrollColumnTo('hour');
        this._scrollColumnTo('minute');
        if (this.hour12) {
          this._scrollColumnTo('period');
        }
      });
    }
  }

  /**
   * Scroll a specific column to its selected value position.
   */
  private _scrollColumnTo(column: 'hour' | 'minute' | 'period'): void {
    const container = this.renderRoot.querySelector(
      `.wheel-column[data-column="${column}"] .wheel-container`,
    ) as HTMLElement | null;
    if (!container) return;

    let index = 0;
    if (column === 'hour') {
      const items = this._getHourItems();
      index = items.findIndex((item) => item.value === this._selectedHour);
    } else if (column === 'minute') {
      const items = this._getMinuteItems();
      index = items.findIndex((item) => item.value === this._selectedMinute);
    } else {
      index = this._selectedPeriod === 'AM' ? 0 : 1;
    }

    if (index < 0) index = 0;

    // Account for padding items (2 empty items at top)
    container.scrollTop = (index + 2) * ITEM_HEIGHT - (VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT;
  }

  /**
   * Get hour items based on hour12 mode.
   */
  private _getHourItems(): WheelItem[] {
    if (this.hour12) {
      const items: WheelItem[] = [];
      for (let i = 1; i <= 12; i++) {
        items.push({ value: i, label: String(i) });
      }
      return items;
    }
    const items: WheelItem[] = [];
    for (let i = 0; i <= 23; i++) {
      items.push({ value: i, label: String(i).padStart(2, '0') });
    }
    return items;
  }

  /**
   * Get minute items based on step interval.
   */
  private _getMinuteItems(): WheelItem[] {
    const items: WheelItem[] = [];
    for (let i = 0; i < 60; i += this.step) {
      items.push({ value: i, label: String(i).padStart(2, '0') });
    }
    return items;
  }

  /**
   * Handle native scrollend event to read final scroll position.
   */
  private _handleScrollEnd(column: 'hour' | 'minute' | 'period', e: Event): void {
    const container = e.currentTarget as HTMLElement;
    // Subtract padding items offset
    const rawIndex = Math.round(container.scrollTop / ITEM_HEIGHT);
    // The padding adds 2 items at the top, so subtract 2 from raw index
    // But scrollTop=0 corresponds to the first padding item
    // selected index = rawIndex - paddingOffset that centers items
    // With 5 visible items and padding of 2, the center item at scrollTop=0 is index -2
    // After snapping: selectedIndex = rawIndex - 2 + floor((VISIBLE_ITEMS - 1) / 2)
    // Simplify: the _scrollColumnTo sets scrollTop = (index + 2) * ITEM_HEIGHT - 2 * ITEM_HEIGHT = index * ITEM_HEIGHT
    // So selectedIndex = rawIndex
    const selectedIndex = Math.round(container.scrollTop / ITEM_HEIGHT);

    if (column === 'hour') {
      const items = this._getHourItems();
      const clamped = Math.max(0, Math.min(items.length - 1, selectedIndex));
      this._selectedHour = items[clamped].value;
    } else if (column === 'minute') {
      const items = this._getMinuteItems();
      const clamped = Math.max(0, Math.min(items.length - 1, selectedIndex));
      this._selectedMinute = items[clamped].value;
    } else {
      const clamped = Math.max(0, Math.min(1, selectedIndex));
      this._selectedPeriod = clamped === 0 ? 'AM' : 'PM';
    }

    this._emitChange();
  }

  /**
   * Handle scroll event with debounce fallback for browsers without scrollend.
   */
  private _handleScroll(column: string, e: Event): void {
    // If browser supports scrollend natively, let that handler fire instead
    if ('onscrollend' in window) return;

    const existing = this._scrollTimers.get(column);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this._handleScrollEnd(column as 'hour' | 'minute' | 'period', e);
      this._scrollTimers.delete(column);
    }, SCROLL_DEBOUNCE);

    this._scrollTimers.set(column, timer);
  }

  /**
   * Emit the current selection as a TimeValue.
   */
  private _emitChange(): void {
    let hour = this._selectedHour;
    if (this.hour12) {
      hour = to24Hour(this._selectedHour, this._selectedPeriod);
    }

    const value: TimeValue = {
      hour,
      minute: this._selectedMinute,
      second: 0,
    };

    dispatchCustomEvent<{ value: TimeValue }>(this, 'ui-scroll-wheel-change', { value });
  }

  /**
   * Render padding items so first/last real items can center in the highlight.
   */
  private _renderPadding() {
    // Render 2 empty items (half of visible - 1 rounded down)
    return html`
      <div class="wheel-item" aria-hidden="true"></div>
      <div class="wheel-item" aria-hidden="true"></div>
    `;
  }

  /**
   * Render a single scroll column with items.
   */
  private _renderColumn(
    items: WheelItem[],
    column: 'hour' | 'minute' | 'period',
    selectedValue: number,
  ) {
    return html`
      <div class="wheel-column" data-column=${column}>
        <div
          class="wheel-container"
          @scrollend=${(e: Event) => this._handleScrollEnd(column, e)}
          @scroll=${(e: Event) => this._handleScroll(column, e)}
        >
          ${this._renderPadding()}
          ${items.map(
            (item) => html`
              <div
                class="wheel-item ${item.value === selectedValue ? 'selected' : ''}"
                data-value=${item.value}
              >
                ${item.label}
              </div>
            `,
          )}
          ${this._renderPadding()}
        </div>
      </div>
    `;
  }

  override render() {
    return html`
      <div class="scroll-wheel-wrapper" role="group" aria-label="Select time">
        <div class="wheel-highlight" aria-hidden="true"></div>
        ${this._renderColumn(this._getHourItems(), 'hour', this._selectedHour)}
        <span class="wheel-separator" aria-hidden="true">:</span>
        ${this._renderColumn(this._getMinuteItems(), 'minute', this._selectedMinute)}
        ${this.hour12
          ? this._renderColumn(
              [
                { value: 0, label: 'AM' },
                { value: 1, label: 'PM' },
              ],
              'period',
              this._selectedPeriod === 'AM' ? 0 : 1,
            )
          : nothing}
      </div>
    `;
  }
}

// Safe custom element registration
if (typeof customElements !== 'undefined') {
  if (!customElements.get('lui-time-scroll-wheel')) {
    customElements.define('lui-time-scroll-wheel', TimeScrollWheel);
  }
}
