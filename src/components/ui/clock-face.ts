/**
 * ClockFace - SVG clock face for visual time selection
 *
 * Renders a circular clock face with hour markers (12h or 24h inner/outer ring)
 * or minute indicators. Supports click and drag interaction via Pointer Events API.
 * Dispatches ui-clock-select events on value selection.
 *
 * This is an internal component used by the time-picker popup. Primary input is
 * via spinbuttons; the clock face provides a supplementary visual interaction.
 */

import { html, css, svg, type CSSResultGroup } from 'lit';
import { property, state } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles, dispatchCustomEvent } from '@lit-ui/core';

/** Angle offset so 12 o'clock position is at top (SVG 0 degrees is 3 o'clock) */
const ANGLE_OFFSET = -90;
const DEG_TO_RAD = Math.PI / 180;

/** SVG dimensions */
const SIZE = 240;
const CENTER = SIZE / 2; // 120
const OUTER_RADIUS = 100;
const OUTER_NUMBER_RADIUS = 85;
const INNER_NUMBER_RADIUS = 55;
const MARKER_RADIUS = 16;
const INNER_OUTER_THRESHOLD = 70; // percentage of outer radius for ring detection

/**
 * Calculate (x, y) position on a circle given angle in degrees and radius.
 */
function polarToCartesian(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg + ANGLE_OFFSET) * DEG_TO_RAD;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

export class ClockFace extends TailwindElement {
  static styles: CSSResultGroup = [
    tailwindBaseStyles,
    css`
      :host {
        display: block;
      }

      svg {
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        cursor: pointer;
        width: 100%;
        height: 100%;
      }

      .clock-hand {
        transition: x1 0.2s ease, y1 0.2s ease, x2 0.2s ease, y2 0.2s ease;
      }

      .clock-marker {
        transition: cx 0.2s ease, cy 0.2s ease;
      }

      .number-text {
        pointer-events: none;
      }

      .clock-bg {
        fill: var(--ui-time-picker-clock-bg);
        stroke: var(--ui-time-picker-clock-border);
      }

      .clock-number {
        fill: var(--ui-time-picker-clock-text);
      }

      .clock-tick {
        fill: var(--ui-time-picker-clock-text);
      }

      .business-indicator {
        fill: var(--ui-time-picker-business-accent);
      }
    `,
  ];

  /** Which ring to display: hour numbers or minute indicators */
  @property({ reflect: true }) mode: 'hour' | 'minute' = 'hour';

  /** Currently selected hour (0-23) */
  @property({ type: Number }) hour = 0;

  /** Currently selected minute (0-59) */
  @property({ type: Number }) minute = 0;

  /** Whether to show 12-hour or 24-hour display */
  @property({ type: Boolean, attribute: 'hour12' }) hour12 = false;

  /** Minute step interval (controls snapping and label rendering in minute mode) */
  @property({ type: Number }) step = 1;

  /** Business hours range for visual indicator (false = disabled) */
  @property({ attribute: false }) businessHours: { start: number; end: number } | false = false;

  /** Disabled state */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Whether the user is currently dragging on the clock face */
  @state() private _dragging = false;

  // ─── Interval snapping ─────────────────────────────────────────────

  /**
   * Snap a minute value to the nearest step interval.
   * If step <= 1, returns minute unchanged.
   */
  private _snapToInterval(minute: number): number {
    if (this.step <= 1) return minute;
    return Math.round(minute / this.step) * this.step % 60;
  }

  /**
   * Check if a given 24-hour value falls within business hours range.
   */
  private _isBusinessHour(hour24: number): boolean {
    if (!this.businessHours) return false;
    return hour24 >= this.businessHours.start && hour24 < this.businessHours.end;
  }

  // ─── Hour mode rendering ───────────────────────────────────────────

  private _renderHourMode() {
    if (this.hour12) {
      return this._renderHour12();
    }
    return this._renderHour24();
  }

  /**
   * 12-hour mode: 12 text labels (1-12) on the outer ring at 30-degree intervals.
   * 12 is at the top (angle 0, which maps to 12 o'clock via ANGLE_OFFSET).
   */
  private _renderHour12() {
    const selected = this.hour === 0 ? 12 : this.hour > 12 ? this.hour - 12 : this.hour;
    // Determine AM/PM context from current hour for business hours check
    const isPM = this.hour >= 12;
    const items = [];

    for (let i = 1; i <= 12; i++) {
      const angle = i * 30;
      const pos = polarToCartesian(angle, OUTER_NUMBER_RADIUS);
      const isSelected = i === selected;

      // Map display hour to 24-hour for business hours check
      const hour24 = isPM ? (i === 12 ? 12 : i + 12) : (i === 12 ? 0 : i);
      const isBusiness = this._isBusinessHour(hour24);

      items.push(svg`
        ${isSelected ? svg`
          <circle
            cx="${pos.x}" cy="${pos.y}" r="${MARKER_RADIUS}"
            fill="var(--ui-time-picker-clock-selected-bg, var(--ui-primary))"
          />
        ` : ''}
        ${isBusiness && !isSelected ? svg`
          <circle
            class="business-indicator"
            cx="${pos.x}" cy="${pos.y + MARKER_RADIUS + 4}" r="3"
          />
        ` : ''}
        <text
          class="number-text ${isSelected ? '' : 'clock-number'}"
          x="${pos.x}" y="${pos.y}"
          text-anchor="middle" dominant-baseline="central"
          font-size="14"
          fill="${isSelected ? 'white' : ''}"
        >${i}</text>
      `);
    }

    return items;
  }

  /**
   * 24-hour mode: outer ring (1-12) and inner ring (13-23 + 0).
   * Material Design inner/outer ring pattern.
   */
  private _renderHour24() {
    const items = [];

    // Outer ring: 1-12
    for (let i = 1; i <= 12; i++) {
      const angle = i * 30;
      const pos = polarToCartesian(angle, OUTER_NUMBER_RADIUS);
      const isSelected = this.hour === i;
      const isBusiness = this._isBusinessHour(i);

      items.push(svg`
        ${isSelected ? svg`
          <circle
            cx="${pos.x}" cy="${pos.y}" r="${MARKER_RADIUS}"
            fill="var(--ui-time-picker-clock-selected-bg, var(--ui-primary))"
          />
        ` : ''}
        ${isBusiness && !isSelected ? svg`
          <circle
            class="business-indicator"
            cx="${pos.x}" cy="${pos.y + MARKER_RADIUS + 4}" r="3"
          />
        ` : ''}
        <text
          class="number-text ${isSelected ? '' : 'clock-number'}"
          x="${pos.x}" y="${pos.y}"
          text-anchor="middle" dominant-baseline="central"
          font-size="14"
          fill="${isSelected ? 'white' : ''}"
        >${i}</text>
      `);
    }

    // Inner ring: 13-23 and 0
    // 0 sits at the 12 o'clock position on the inner ring (angle = 0 mapped via offset)
    const innerNumbers = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    for (const num of innerNumbers) {
      // 0 -> position 0 (12 o'clock), 13 -> position 1, etc.
      const position = num === 0 ? 0 : num - 12;
      const angle = position * 30;
      const pos = polarToCartesian(angle, INNER_NUMBER_RADIUS);
      const isSelected = this.hour === num;
      const isBusiness = this._isBusinessHour(num);

      items.push(svg`
        ${isSelected ? svg`
          <circle
            cx="${pos.x}" cy="${pos.y}" r="${MARKER_RADIUS}"
            fill="var(--ui-time-picker-clock-selected-bg, var(--ui-primary))"
          />
        ` : ''}
        ${isBusiness && !isSelected ? svg`
          <circle
            class="business-indicator"
            cx="${pos.x}" cy="${pos.y + MARKER_RADIUS + 4}" r="3"
          />
        ` : ''}
        <text
          class="number-text ${isSelected ? '' : 'clock-number'}"
          x="${pos.x}" y="${pos.y}"
          text-anchor="middle" dominant-baseline="central"
          font-size="12"
          fill="${isSelected ? 'white' : ''}"
        >${num}</text>
      `);
    }

    return items;
  }

  // ─── Minute mode rendering ─────────────────────────────────────────

  private _renderMinuteMode() {
    const items = [];

    if (this.step > 1) {
      // Step-aware rendering: only show labels at step interval positions
      for (let i = 0; i < 60; i += this.step) {
        const angle = i * 6;
        const pos = polarToCartesian(angle, OUTER_NUMBER_RADIUS);
        const isSelected = this.minute === i;
        const label = String(i).padStart(2, '0');

        items.push(svg`
          ${isSelected ? svg`
            <circle
              cx="${pos.x}" cy="${pos.y}" r="${MARKER_RADIUS}"
              fill="var(--ui-time-picker-clock-selected-bg, var(--ui-primary))"
            />
          ` : ''}
          <text
            class="number-text ${isSelected ? '' : 'clock-number'}"
            x="${pos.x}" y="${pos.y}"
            text-anchor="middle" dominant-baseline="central"
            font-size="14"
            fill="${isSelected ? 'white' : ''}"
          >${label}</text>
        `);
      }
    } else {
      // Default rendering: 60 positions with ticks and labels
      for (let i = 0; i < 60; i++) {
        const angle = i * 6;
        const isMajor = i % 5 === 0;
        const pos = polarToCartesian(angle, OUTER_NUMBER_RADIUS);
        const isSelected = this.minute === i;

        if (isMajor) {
          // Major label every 5 minutes
          const label = String(i).padStart(2, '0');
          items.push(svg`
            ${isSelected ? svg`
              <circle
                cx="${pos.x}" cy="${pos.y}" r="${MARKER_RADIUS}"
                fill="var(--ui-time-picker-clock-selected-bg, var(--ui-primary))"
              />
            ` : ''}
            <text
              class="number-text ${isSelected ? '' : 'clock-number'}"
              x="${pos.x}" y="${pos.y}"
              text-anchor="middle" dominant-baseline="central"
              font-size="14"
              fill="${isSelected ? 'white' : ''}"
            >${label}</text>
          `);
        } else {
          // Minor tick: small dot
          items.push(svg`
            ${isSelected ? svg`
              <circle
                cx="${pos.x}" cy="${pos.y}" r="${MARKER_RADIUS}"
                fill="var(--ui-time-picker-clock-selected-bg, var(--ui-primary))"
              />
            ` : ''}
            <circle
              class="clock-tick"
              cx="${pos.x}" cy="${pos.y}" r="1"
            />
          `);
        }
      }
    }

    return items;
  }

  // ─── Clock hand rendering ──────────────────────────────────────────

  private _getSelectedPosition(): { x: number; y: number } {
    if (this.mode === 'minute') {
      const angle = this.minute * 6;
      return polarToCartesian(angle, OUTER_NUMBER_RADIUS);
    }

    // Hour mode
    if (this.hour12) {
      const displayHour = this.hour === 0 ? 12 : this.hour > 12 ? this.hour - 12 : this.hour;
      const angle = displayHour * 30;
      return polarToCartesian(angle, OUTER_NUMBER_RADIUS);
    }

    // 24-hour mode: determine inner vs outer ring
    const isInner = this.hour === 0 || this.hour > 12;
    const position = this.hour === 0 ? 0 : isInner ? this.hour - 12 : this.hour;
    const radius = isInner ? INNER_NUMBER_RADIUS : OUTER_NUMBER_RADIUS;
    const angle = position * 30;
    return polarToCartesian(angle, radius);
  }

  private _renderClockHand() {
    const pos = this._getSelectedPosition();

    return svg`
      <line
        class="clock-hand"
        x1="${CENTER}" y1="${CENTER}"
        x2="${pos.x}" y2="${pos.y}"
        stroke="var(--ui-time-picker-clock-selected-bg, var(--ui-primary))"
        stroke-width="2"
      />
      <circle
        class="clock-marker"
        cx="${pos.x}" cy="${pos.y}" r="3"
        fill="var(--ui-time-picker-clock-selected-bg, var(--ui-primary))"
      />
    `;
  }

  // ─── Pointer event handling ────────────────────────────────────────

  private _handlePointerDown(e: PointerEvent) {
    if (this.disabled) return;
    e.preventDefault();

    const svgEl = e.currentTarget as SVGSVGElement;
    svgEl.setPointerCapture(e.pointerId);
    this._dragging = true;

    this._selectFromPointer(e);
  }

  private _handlePointerMove(e: PointerEvent) {
    if (!this._dragging || this.disabled) return;
    this._selectFromPointer(e);
  }

  private _handlePointerUp(e: PointerEvent) {
    if (!this._dragging) return;
    this._dragging = false;

    const svgEl = e.currentTarget as SVGSVGElement;
    svgEl.releasePointerCapture(e.pointerId);

    const value = this._calculateValueFromPointer(e);
    if (value !== null) {
      dispatchCustomEvent(this, 'clock-select', {
        value,
        mode: this.mode,
      });
    }
  }

  private _selectFromPointer(e: PointerEvent) {
    const value = this._calculateValueFromPointer(e);
    if (value === null) return;

    if (this.mode === 'hour') {
      this.hour = value;
    } else {
      this.minute = value;
    }
  }

  /**
   * Calculate the selected value from a pointer event position.
   *
   * 1. Get SVG bounding rect
   * 2. Calculate pointer position relative to center
   * 3. Calculate angle from atan2, rotated so 12 o'clock = 0
   * 4. For hours: divide by 30; for 24h detect inner/outer ring by distance
   * 5. For minutes: divide by 6, round to nearest integer
   */
  private _calculateValueFromPointer(e: PointerEvent): number | null {
    const svgEl = (e.currentTarget ?? this.renderRoot.querySelector('svg')) as SVGSVGElement | null;
    if (!svgEl) return null;

    const rect = svgEl.getBoundingClientRect();
    const scaleX = SIZE / rect.width;
    const scaleY = SIZE / rect.height;

    // Pointer position in SVG coordinate space
    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;

    const dx = svgX - CENTER;
    const dy = svgY - CENTER;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Ignore clicks very close to center
    if (distance < 20) return null;

    // Angle in degrees, rotated so 12 o'clock = 0
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (this.mode === 'minute') {
      // Each minute = 6 degrees
      const minute = Math.round(angle / 6) % 60;
      return this._snapToInterval(minute);
    }

    // Hour mode
    // Each hour = 30 degrees
    let hourPos = Math.round(angle / 30);
    if (hourPos === 0 || hourPos === 12) hourPos = 12;

    if (this.hour12) {
      // 12-hour mode: return 1-12
      return hourPos > 12 ? hourPos - 12 : hourPos;
    }

    // 24-hour mode: determine inner vs outer ring
    const threshold = OUTER_RADIUS * (INNER_OUTER_THRESHOLD / 100);

    if (distance < threshold) {
      // Inner ring: 0, 13-23
      if (hourPos === 12) return 0;
      return hourPos + 12;
    }

    // Outer ring: 1-12
    return hourPos > 12 ? hourPos - 12 : hourPos;
  }

  // ─── Render ────────────────────────────────────────────────────────

  render() {
    const modeLabel = this.mode === 'hour' ? 'hour' : 'minute';

    return html`
      <svg
        viewBox="0 0 ${SIZE} ${SIZE}"
        role="group"
        aria-label="Clock face for ${modeLabel} selection"
        @pointerdown=${this._handlePointerDown}
        @pointermove=${this._handlePointerMove}
        @pointerup=${this._handlePointerUp}
      >
        <!-- Clock circle background -->
        <circle
          class="clock-bg"
          cx="${CENTER}" cy="${CENTER}" r="${OUTER_RADIUS}"
          stroke-width="1"
        />

        <!-- Clock hand (rendered before numbers so numbers appear on top) -->
        ${this._renderClockHand()}

        <!-- Numbers/ticks -->
        ${this.mode === 'hour' ? this._renderHourMode() : this._renderMinuteMode()}

        <!-- Center dot -->
        <circle
          cx="${CENTER}" cy="${CENTER}" r="3"
          fill="var(--ui-time-picker-clock-selected-bg, var(--ui-primary))"
        />
      </svg>
    `;
  }
}

// Safe custom element registration for internal component
if (typeof customElements !== 'undefined') {
  if (!customElements.get('lui-clock-face')) {
    customElements.define('lui-clock-face', ClockFace);
  }
}
