/**
 * MAStateMachine — O(1) incremental SMA/EMA state machine with NaN gap handling.
 *
 * MA-01: Each new streaming bar produces a new MA value in O(1) time via ring buffer
 *        (SMA) or exponential smoothing (EMA). No full-array recomputation per RAF flush.
 *
 * MA-03: NaN closes are treated as gaps. push(NaN) returns null without corrupting the
 *        SMA running sum or incrementing the EMA warm-up counter.
 */

import type { MAConfig } from './candlestick-option-builder.js';

// ---------------------------------------------------------------------------
// SMAState — ring buffer incremental Simple Moving Average
// ---------------------------------------------------------------------------

class SMAState {
  private readonly _window: number[];
  private _sum = 0;
  private _count = 0;    // valid (non-NaN) elements currently in the window
  private _ptr = 0;
  private _ready = false; // true once the window has been filled for the first time

  constructor(private readonly period: number) {
    this._window = new Array<number>(period).fill(NaN);
  }

  /**
   * Push one close value.
   * Returns null during warm-up (fewer than `period` valid closes seen) or when close is NaN.
   * MA-03: NaN input returns null without touching _sum or _window.
   */
  push(close: number): number | null {
    if (Number.isNaN(close)) return null;

    const evicted = this._window[this._ptr];
    this._window[this._ptr] = close;
    this._ptr = (this._ptr + 1) % this.period;

    // Remove evicted value from running sum only if it was a valid number
    if (!Number.isNaN(evicted)) {
      this._sum -= evicted;
      this._count--;
    }

    this._sum += close;
    this._count++;

    if (this._count === this.period) this._ready = true;
    return this._ready ? this._sum / this.period : null;
  }

  reset(): void {
    this._window.fill(NaN);
    this._sum = 0;
    this._count = 0;
    this._ptr = 0;
    this._ready = false;
  }
}

// ---------------------------------------------------------------------------
// EMAState — warm-up + incremental Exponential Moving Average
// ---------------------------------------------------------------------------

class EMAState {
  private readonly _k: number;
  private _prevEma: number | null = null;
  private _warmup: number[] = [];

  constructor(private readonly period: number) {
    // EMA multiplier: k = 2 / (period + 1)
    this._k = 2 / (period + 1);
  }

  /**
   * Push one close value.
   * Returns null during warm-up (fewer than `period` valid non-NaN closes accumulated).
   * MA-03: NaN input returns null without appending to _warmup or incrementing warm-up counter.
   * Seeds from the SMA of the first `period` valid closes, then applies EMA formula.
   */
  push(close: number): number | null {
    if (Number.isNaN(close)) return null;

    if (this._prevEma === null) {
      // Warm-up: accumulate valid closes until we reach `period`
      this._warmup.push(close);
      if (this._warmup.length < this.period) return null;
      // Seed: SMA of the first `period` valid closes
      this._prevEma = this._warmup.reduce((a, b) => a + b, 0) / this.period;
      return this._prevEma;
    }

    // After warm-up: ema = close * k + prevEma * (1 - k)
    const ema = close * this._k + this._prevEma * (1 - this._k);
    this._prevEma = ema;
    return ema;
  }

  reset(): void {
    this._prevEma = null;
    this._warmup = [];
  }
}

// ---------------------------------------------------------------------------
// MAStateMachine — public wrapper class
// ---------------------------------------------------------------------------

/**
 * MAStateMachine wraps SMAState or EMAState based on MAConfig.type.
 *
 * Lifecycle:
 * - reset(closes): O(n) full replay — call from _applyData() when base dataset changes.
 * - push(close):   O(1) incremental — call from _flushBarUpdates() for each new bar.
 * - values:        Current output array — pass directly to ECharts series.data.
 */
export class MAStateMachine {
  private readonly _state: SMAState | EMAState;
  private _values: (number | null)[] = [];

  constructor(config: MAConfig) {
    this._state =
      (config.type ?? 'sma') === 'ema'
        ? new EMAState(config.period)
        : new SMAState(config.period);
  }

  /**
   * Full reset and replay from a complete closes array.
   * O(n) — intended for _applyData() when the full dataset is reassigned.
   */
  reset(closes: number[]): (number | null)[] {
    this._state.reset();
    this._values = closes.map((c) => this._state.push(c));
    return this._values;
  }

  /**
   * Incremental push of a single new close value.
   * O(1) — intended for _flushBarUpdates() on each streaming bar.
   * Appends to _values and returns the updated array reference.
   */
  push(close: number): (number | null)[] {
    this._values.push(this._state.push(close));
    return this._values;
  }

  /**
   * Trim _values to match a trimmed _ohlcBuffer. Call after _ohlcBuffer.slice(-maxPoints).
   * Keeps indices aligned between _maStateMachines[i]._values and _ohlcBuffer.
   */
  trim(maxLen: number): void {
    if (this._values.length > maxLen) {
      this._values = this._values.slice(-maxLen);
    }
  }

  /**
   * Current computed MA values array.
   * Returns the internal reference — no copy. Suitable for direct ECharts series.data assignment.
   */
  get values(): (number | null)[] {
    return this._values;
  }
}
