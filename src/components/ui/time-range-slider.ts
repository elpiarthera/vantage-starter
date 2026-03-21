/**
 * TimeRangeSlider - Dual-handle slider for visual time range selection
 *
 * Renders a horizontal track with two draggable thumbs representing start and
 * end times. Each thumb maps to minutes since midnight (0-1440). Supports
 * pointer event drag, keyboard navigation (arrow keys), and displays formatted
 * time labels with a duration indicator.
 *
 * Follows WAI-ARIA Slider pattern with role="slider", aria-valuenow/min/max/text.
 *
 * This is an internal component used by TimePicker for range selection.
 * Wired into the parent component in Plan 06.
 *
 * @fires ui-time-range-change - Dispatched on pointer release with final range
 * @fires ui-range-input - Dispatched during drag with interim range values
 */

import { html, css, type CSSResultGroup } from 'lit';
import { property, state } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles, dispatchCustomEvent } from '@lit-ui/core';
import { type TimeValue, formatTimeForDisplay } from './time-utils.js';

/** Maximum minutes in a day (24 * 60) */
const MAX_MINUTES = 1440;

/** Tick mark positions: every 3 hours (0, 3, 6, ..., 21) in minutes */
const TICK_POSITIONS = [0, 180, 360, 540, 720, 900, 1080, 1260];

export class TimeRangeSlider extends TailwindElement {
  static override styles: CSSResultGroup = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
        padding: 0.5rem 0;
      }

      .range-slider-wrapper {
        position: relative;
      }

      .range-labels {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
      }

      .range-label {
        color: var(--ui-time-picker-range-label-text);
        font-variant-numeric: tabular-nums;
      }

      .range-duration {
        font-size: 0.75rem;
        color: var(--ui-time-picker-range-duration-text);
      }

      .range-track {
        position: relative;
        height: 6px;
        background: var(--ui-time-picker-range-track-bg);
        border-radius: 3px;
        cursor: pointer;
        touch-action: none;
      }

      .range-fill {
        position: absolute;
        height: 100%;
        background: var(--ui-time-picker-range-fill-bg, var(--ui-primary));
        border-radius: 3px;
      }

      .range-thumb {
        position: absolute;
        top: 50%;
        width: 20px;
        height: 20px;
        background: var(--ui-time-picker-range-thumb-bg);
        border: 2px solid var(--ui-time-picker-range-thumb-border, var(--ui-primary));
        border-radius: 50%;
        transform: translate(-50%, -50%);
        cursor: grab;
        outline: none;
        z-index: 1;
      }

      .range-thumb:focus-visible {
        box-shadow: 0 0 0 3px var(--ui-time-picker-range-focus-ring);
      }

      .range-thumb:active {
        cursor: grabbing;
      }

      .tick-marks {
        display: flex;
        justify-content: space-between;
        margin-top: 0.25rem;
        padding: 0 10px;
      }

      .tick-label {
        font-size: 0.625rem;
        color: var(--ui-time-picker-range-tick-text);
        text-align: center;
        min-width: 2rem;
      }

      :host([disabled]) .range-track {
        cursor: default;
        opacity: 0.5;
      }

      :host([disabled]) .range-thumb {
        cursor: default;
      }

    `,
  ];

  // ─── Public properties ──────────────────────────────────────────────

  /** Start of the selected range in minutes since midnight (0-1440). Default 9:00 AM. */
  @property({ type: Number }) startMinutes = 540;

  /** End of the selected range in minutes since midnight (0-1440). Default 5:00 PM. */
  @property({ type: Number }) endMinutes = 1020;

  /** Step size in minutes for snapping. */
  @property({ type: Number }) step = 30;

  /** Whether to use 12-hour display format. */
  @property({ type: Boolean }) hour12 = false;

  /** Locale for time formatting. */
  @property() locale = 'en-US';

  /** Disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  // ─── Internal state ─────────────────────────────────────────────────

  /** Which thumb is currently being dragged, or null if idle. */
  @state() private _activeThumb: 'start' | 'end' | null = null;

  // ─── Helpers ────────────────────────────────────────────────────────

  /**
   * Convert minutes since midnight to a TimeValue.
   */
  private _minutesToTimeValue(minutes: number): TimeValue {
    return {
      hour: Math.floor(minutes / 60) % 24,
      minute: minutes % 60,
      second: 0,
    };
  }

  /**
   * Format minutes since midnight into a locale-aware display string.
   */
  private _formatMinutes(minutes: number): string {
    const tv = this._minutesToTimeValue(minutes);
    return formatTimeForDisplay(tv, this.locale, this.hour12);
  }

  /**
   * Snap a raw minutes value to the nearest step and clamp to [0, 1440].
   */
  private _snapToStep(minutes: number): number {
    const snapped = Math.round(minutes / this.step) * this.step;
    return Math.max(0, Math.min(MAX_MINUTES, snapped));
  }

  /**
   * Compute the duration display string between start and end.
   */
  private _durationDisplay(): string {
    const diff = this.endMinutes - this.startMinutes;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  // ─── Pointer event handlers ─────────────────────────────────────────

  private _handlePointerDown(e: PointerEvent): void {
    if (this.disabled) return;
    e.preventDefault();

    const track = e.currentTarget as HTMLElement;
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const clickMinutes = pct * MAX_MINUTES;

    // Determine which thumb is closer to the click position
    const distStart = Math.abs(clickMinutes - this.startMinutes);
    const distEnd = Math.abs(clickMinutes - this.endMinutes);
    this._activeThumb = distStart <= distEnd ? 'start' : 'end';

    track.setPointerCapture(e.pointerId);
    this._updateFromPointer(e);
  }

  private _handlePointerMove(e: PointerEvent): void {
    if (this._activeThumb === null) return;
    this._updateFromPointer(e);
  }

  private _handlePointerUp(e: PointerEvent): void {
    if (this._activeThumb === null) return;

    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    this._activeThumb = null;

    // Dispatch final change event
    this._dispatchRangeEvent('ui-time-range-change');
  }

  /**
   * Update the active thumb position from a pointer event.
   */
  private _updateFromPointer(e: PointerEvent): void {
    const track = (e.currentTarget as HTMLElement) ?? this.renderRoot.querySelector('.range-track');
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const rawMinutes = pct * MAX_MINUTES;
    const snapped = this._snapToStep(rawMinutes);

    if (this._activeThumb === 'start') {
      this.startMinutes = Math.min(snapped, this.endMinutes);
    } else if (this._activeThumb === 'end') {
      this.endMinutes = Math.max(snapped, this.startMinutes);
    }

    // Dispatch interim input event
    this._dispatchRangeEvent('ui-range-input');
  }

  // ─── Keyboard handler ───────────────────────────────────────────────

  private _handleThumbKeydown(e: KeyboardEvent, thumb: 'start' | 'end'): void {
    if (this.disabled) return;

    let handled = true;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp': {
        if (thumb === 'start') {
          this.startMinutes = Math.min(this.startMinutes + this.step, this.endMinutes);
        } else {
          this.endMinutes = Math.min(this.endMinutes + this.step, MAX_MINUTES);
        }
        break;
      }
      case 'ArrowLeft':
      case 'ArrowDown': {
        if (thumb === 'start') {
          this.startMinutes = Math.max(this.startMinutes - this.step, 0);
        } else {
          this.endMinutes = Math.max(this.endMinutes - this.step, this.startMinutes);
        }
        break;
      }
      case 'Home': {
        if (thumb === 'start') {
          this.startMinutes = 0;
        } else {
          this.endMinutes = this.startMinutes;
        }
        break;
      }
      case 'End': {
        if (thumb === 'start') {
          this.startMinutes = this.endMinutes;
        } else {
          this.endMinutes = MAX_MINUTES;
        }
        break;
      }
      default:
        handled = false;
    }

    if (handled) {
      e.preventDefault();
      this._dispatchRangeEvent('ui-time-range-change');
    }
  }

  // ─── Event dispatch ─────────────────────────────────────────────────

  private _dispatchRangeEvent(eventName: string): void {
    dispatchCustomEvent<{
      startMinutes: number;
      endMinutes: number;
      startTime: TimeValue;
      endTime: TimeValue;
    }>(this, eventName, {
      startMinutes: this.startMinutes,
      endMinutes: this.endMinutes,
      startTime: this._minutesToTimeValue(this.startMinutes),
      endTime: this._minutesToTimeValue(this.endMinutes),
    });
  }

  // ─── Tick marks ─────────────────────────────────────────────────────

  private _renderTickMarks() {
    return html`
      <div class="tick-marks">
        ${TICK_POSITIONS.map(
          (minutes) => html`
            <span class="tick-label">${this._formatMinutes(minutes)}</span>
          `,
        )}
      </div>
    `;
  }

  // ─── Render ─────────────────────────────────────────────────────────

  override render() {
    const startPct = (this.startMinutes / MAX_MINUTES) * 100;
    const endPct = (this.endMinutes / MAX_MINUTES) * 100;

    return html`
      <div class="range-slider-wrapper">
        <div class="range-labels">
          <span class="range-label">${this._formatMinutes(this.startMinutes)}</span>
          <span class="range-duration">${this._durationDisplay()}</span>
          <span class="range-label">${this._formatMinutes(this.endMinutes)}</span>
        </div>
        <div
          class="range-track"
          @pointerdown=${this._handlePointerDown}
          @pointermove=${this._handlePointerMove}
          @pointerup=${this._handlePointerUp}
        >
          <div
            class="range-fill"
            style="left: ${startPct}%; width: ${endPct - startPct}%"
          ></div>
          <div
            class="range-thumb"
            role="slider"
            tabindex="0"
            aria-label="Start time"
            aria-valuemin="0"
            aria-valuemax="${MAX_MINUTES}"
            aria-valuenow="${this.startMinutes}"
            aria-valuetext="${this._formatMinutes(this.startMinutes)}"
            style="left: ${startPct}%"
            @keydown=${(e: KeyboardEvent) => this._handleThumbKeydown(e, 'start')}
          ></div>
          <div
            class="range-thumb"
            role="slider"
            tabindex="0"
            aria-label="End time"
            aria-valuemin="0"
            aria-valuemax="${MAX_MINUTES}"
            aria-valuenow="${this.endMinutes}"
            aria-valuetext="${this._formatMinutes(this.endMinutes)}"
            style="left: ${endPct}%"
            @keydown=${(e: KeyboardEvent) => this._handleThumbKeydown(e, 'end')}
          ></div>
        </div>
        ${this._renderTickMarks()}
      </div>
    `;
  }
}

// Safe custom element registration for internal component
if (typeof customElements !== 'undefined') {
  if (!customElements.get('lui-time-range-slider')) {
    customElements.define('lui-time-range-slider', TimeRangeSlider);
  }
}
