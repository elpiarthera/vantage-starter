/**
 * LuiCandlestickChart — Candlestick chart component extending BaseChartElement.
 *
 * CNDL-01: Bull/bear colors set via bull-color and bear-color HTML attributes
 * CNDL-02: Volume panel shown via show-volume boolean attribute
 * CNDL-03: Moving average overlays configured via moving-averages JSON attribute
 * CNDL-04: Real-time bar streaming via pushData({ label, ohlc, volume })
 *
 * STRM-04 compliance: pushData() is fully overridden — base streaming path is bypassed entirely.
 * The base _streamingMode = 'buffer' default is irrelevant because pushData() never calls super.pushData().
 */

import { property } from 'lit/decorators.js';
import type { PropertyValues } from 'lit';
import { BaseChartElement } from '../base/base-chart-element.js';
import { registerCandlestickModules } from './candlestick-registry.js';
import {
  buildCandlestickOption,
  type CandlestickBarPoint,
  type MAConfig,
} from '../shared/candlestick-option-builder.js';
import { MAStateMachine } from '../shared/ma-state-machine.js';
import {
  getGpuDevice,
  getGpuAdapter,
  releaseGpuDevice,
} from '../shared/webgpu-device.js';

/**
 * Module-level helper — NOT exported.
 * Parses the raw 'moving-averages' attribute JSON string into MAConfig[].
 * Returns [] if input is null/empty or JSON parse fails.
 */
function _parseMovingAverages(raw: string | null): MAConfig[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// WEBGPU: Minimal ThemeConfig shape — mirrors chartgpu ThemeConfig without importing the type.
// All fields required because ChartGPU's runtime theme resolver defaults missing fields to
// the dark theme; partial overrides silently lose light-mode axis colors.
interface _GpuThemeConfig {
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly axisLineColor: string;
  readonly axisTickColor: string;
  readonly gridLineColor: string;
  readonly colorPalette: string[];
  readonly fontFamily: string;
  readonly fontSize: number;
}

// WEBGPU: Minimal ChartGPU instance interface for candlestick — avoids hard dependency on chartgpu types.
// Candlestick appendData uses 5-element tuples [index, open, close, low, high] (NOT [x,y] pairs).
interface _GpuCandlestickInstance {
  resize(): void;
  dispose(): void;
  setOption(options: { theme?: 'dark' | 'light' | _GpuThemeConfig }): void;
  setZoomRange(start: number, end: number): void;
  appendData(seriesIndex: number, newPoints: ReadonlyArray<readonly [number, number, number, number, number]>): void;
}

export class LuiCandlestickChart extends BaseChartElement {
  // NO constructor override — base _streamingMode = 'buffer' is irrelevant;
  // pushData() is overridden entirely so the base streaming path is never reached.

  // CNDL-01: Bull (rising) candle color — arrives as raw string from HTML (e.g., '#26a69a').
  // No type converter — use bullColor ?? '#default' at call site.
  @property({ attribute: 'bull-color' }) bullColor: string | null = null;

  // CNDL-01: Bear (falling) candle color — arrives as raw string from HTML (e.g., '#ef5350').
  // No type converter — use bearColor ?? '#default' at call site.
  @property({ attribute: 'bear-color' }) bearColor: string | null = null;

  // CNDL-02: Show volume panel below main candlestick grid.
  @property({ type: Boolean, attribute: 'show-volume' }) showVolume = false;

  // CNDL-03: Moving average overlay configs — arrives as JSON string from HTML attribute.
  // No type converter — parsed in _applyData() / _flushBarUpdates() via _parseMovingAverages().
  @property({ attribute: 'moving-averages' }) movingAverages: string | null = null;

  // CNDL-04: Authoritative OHLC bar store — synced from this.data in _applyData();
  // appended to by pushData() for real-time streaming.
  private _ohlcBuffer: CandlestickBarPoint[] = [];

  // One MAStateMachine per MAConfig entry — rebuilt on every _applyData() call.
  // MA-01: provides O(1) incremental push() for streaming bars.
  private _maStateMachines: MAStateMachine[] = [];

  // MA-02: Default color token sequence — starts at color-2 so MA lines don't clash with
  // the chart's primary data color (color-1 = #3b82f6 used by ECharts theme).
  private static readonly _MA_DEFAULT_COLOR_TOKENS = [
    '--ui-chart-color-2',
    '--ui-chart-color-3',
    '--ui-chart-color-4',
    '--ui-chart-color-5',
  ] as const;

  /**
   * MA-02: Resolve MA line colors — uses MAConfig.color when provided, otherwise
   * reads from CSS token sequence via readChartToken() (inherited from BaseChartElement).
   * Cycles through 4 tokens for >4 MA overlays.
   */
  private _resolveMAColors(mas: MAConfig[]): string[] {
    let defaultIndex = 0;
    return mas.map((ma) => {
      if (ma.color) return ma.color;
      const token = LuiCandlestickChart._MA_DEFAULT_COLOR_TOKENS[
        defaultIndex % LuiCandlestickChart._MA_DEFAULT_COLOR_TOKENS.length
      ];
      defaultIndex++;
      return this.readChartToken(token);
    });
  }

  // Component's own RAF handle — must be cancelled in disconnectedCallback() before super.disconnectedCallback().
  // The BASE CLASS cancels its own _rafId but has no knowledge of _barRafId.
  private _barRafId?: number;

  // WEBGPU: ChartGPU instance — null when WebGPU unavailable or before init.
  private _gpuChart: _GpuCandlestickInstance | null = null;
  // WEBGPU: Separate ResizeObserver for ChartGPU — base class observer only calls this._chart.resize().
  private _gpuResizeObserver?: ResizeObserver;
  // WEBGPU: MutationObserver that mirrors .dark class changes to ChartGPU theme.
  // The base class _colorSchemeObserver only updates ECharts; ChartGPU has its own theme state.
  private _gpuColorSchemeObserver?: MutationObserver;
  // WEBGPU: Flag set to true when WebGPU path was active — gates releaseGpuDevice() in cleanup.
  private _wasWebGpu = false;
  // WEBGPU: Tracks how many bars have been pushed to ChartGPU — enables incremental appendData.
  // Reset to 0 after _ohlcBuffer trim (see pushData() override).
  private _gpuFlushedLength = 0;

  /**
   * WEBGPU: Override _initChart() to layer ChartGPU beneath ECharts when WebGPU is active.
   *
   * Calls super._initChart() first (registers modules, inits ECharts, sets up ResizeObserver,
   * ColorSchemeObserver, calls _applyData), then conditionally initializes the ChartGPU
   * data layer on top when this.renderer === 'webgpu'.
   */
  protected override async _initChart(): Promise<void> {
    await super._initChart();
    if (this.renderer === 'webgpu') {
      await this._initWebGpuLayer();
    }
  }

  /**
   * WEBGPU: Build a ChartGPU ThemeConfig that matches the page background exactly.
   *
   * ChartGPU's WebGPU canvas uses alphaMode:"opaque" (hardcoded), so true transparency is
   * unavailable. Reading document.body's computed backgroundColor returns a resolved rgb()
   * value ChartGPU can parse, making the canvas blend with the page background.
   *
   * All fields are explicit: ChartGPU's runtime resolver falls back to the dark theme for
   * any missing field in a custom ThemeConfig, which would break light-mode axis colors.
   */
  private _buildGpuTheme(isDark: boolean): _GpuThemeConfig {
    // getComputedStyle returns a resolved rgb() string, safe for ChartGPU's color parser.
    const bgColor = getComputedStyle(document.body).backgroundColor || (isDark ? '#000000' : '#ffffff');
    const fontFamily =
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"';
    return isDark
      ? {
          backgroundColor: bgColor,
          textColor: '#e0e0e0',
          axisLineColor: 'rgba(224,224,224,0.35)',
          axisTickColor: 'rgba(224,224,224,0.55)',
          gridLineColor: 'rgba(255,255,255,0.1)',
          colorPalette: ['#00E5FF', '#FF2D95', '#B026FF', '#00F5A0', '#FFD300', '#FF6B00', '#4D5BFF', '#FF3D3D'],
          fontFamily,
          fontSize: 12,
        }
      : {
          backgroundColor: bgColor,
          textColor: '#333333',
          axisLineColor: 'rgba(0,0,0,0.35)',
          axisTickColor: 'rgba(0,0,0,0.55)',
          gridLineColor: 'rgba(0,0,0,0.1)',
          colorPalette: ['#1F77B4', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD', '#8C564B', '#E377C2', '#17BECF'],
          fontFamily,
          fontSize: 12,
        };
  }

  /**
   * WEBGPU: Initialize the ChartGPU GPU-accelerated data layer beneath ECharts.
   *
   * Creates a host div with z-index:0 and pointer-events:none positioned absolutely
   * inside the #chart container, then initializes ChartGPU inside it using the shared
   * GPUDevice singleton from webgpu-device.ts.
   */
  private async _initWebGpuLayer(): Promise<void> {
    const devicePromise = getGpuDevice();
    if (!devicePromise) return;

    const device = await devicePromise;
    const adapter = getGpuAdapter();

    const { ChartGPU } = await import('chartgpu');
    const container = this.shadowRoot?.querySelector<HTMLDivElement>('#chart');
    if (!container) return;

    const gpuHost = document.createElement('div');
    gpuHost.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
    container.insertBefore(gpuHost, container.firstChild);

    // WEBGPU: Detect initial theme — build a custom ThemeConfig so the canvas background
    // matches the page. ChartGPU's built-in themes use fixed hex backgrounds (#1a1a2e / #fff)
    // that don't match the docs palette. alphaMode:"opaque" is hardcoded in ChartGPU, so
    // true transparency is unavailable; reading document.body's computed backgroundColor
    // gives a resolved rgb() value the canvas clears to, making it visually seamless.
    const isDark = document.documentElement.classList.contains('dark');

    const gpuSeries = {
      theme: this._buildGpuTheme(isDark),
      series: [{
        type: 'candlestick' as const,
        data: [] as Array<readonly [number, number, number, number, number]>,
        itemStyle: {
          upColor: this.bullColor ?? '#26a69a',
          downColor: this.bearColor ?? '#ef5350',
          upBorderColor: this.bullColor ?? '#26a69a',
          downBorderColor: this.bearColor ?? '#ef5350',
        },
      }],
    };

    if (!adapter) {
      this._gpuChart = (await ChartGPU.create(gpuHost, gpuSeries)) as unknown as _GpuCandlestickInstance;
    } else {
      this._gpuChart = (await ChartGPU.create(gpuHost, gpuSeries, { device, adapter })) as unknown as _GpuCandlestickInstance;
    }

    this._wasWebGpu = true;
    this._gpuResizeObserver = new ResizeObserver(() => this._gpuChart?.resize());
    this._gpuResizeObserver.observe(container);

    // WEBGPU: Mirror .dark class changes from <html> to ChartGPU theme.
    // The base class _colorSchemeObserver updates ECharts only; ChartGPU maintains its own
    // theme state and must be updated separately via setOption({ theme }).
    this._gpuColorSchemeObserver = new MutationObserver(() => {
      const isDarkNow = document.documentElement.classList.contains('dark');
      this._gpuChart?.setOption({ theme: this._buildGpuTheme(isDarkNow) });
    });
    this._gpuColorSchemeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    this._chart!.on('dataZoom', () => this._syncCoordinates());
    this._chart!.on('rendered', () => this._syncCoordinates());
  }

  /**
   * WEBGPU: Sync ECharts DataZoom percent-space to ChartGPU zoom range.
   *
   * Uses getOption().dataZoom[0].start/end (percent-space [0, 100]) which maps
   * directly to ChartGPU.setZoomRange() without an additional pixel to percent conversion.
   */
  private _syncCoordinates(): void {
    if (!this._chart || !this._gpuChart) return;
    const option = this._chart.getOption() as Record<string, unknown>;
    const dataZoom = (option['dataZoom'] as Array<Record<string, unknown>> | undefined)?.[0];
    if (!dataZoom) return;
    const start = (dataZoom['start'] as number) ?? 0;
    const end = (dataZoom['end'] as number) ?? 100;
    if (isNaN(start) || isNaN(end)) return;
    this._gpuChart.setZoomRange(start, end);
  }

  // Converts CandlestickBarPoint.ohlc (ECharts [open,close,low,high]) to
  // ChartGPU OHLCDataPointTuple [index, open, close, low, high].
  // CRITICAL: These formats differ — do NOT pass ECharts ohlc directly to ChartGPU.
  private _toGpuPoint(
    bar: CandlestickBarPoint,
    index: number
  ): readonly [number, number, number, number, number] {
    return [index, bar.ohlc[0], bar.ohlc[1], bar.ohlc[2], bar.ohlc[3]];
  }

  protected override async _registerModules(): Promise<void> {
    await registerCandlestickModules();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed); // base handles this.option passthrough and this.loading state
    if (!this._chart) return;
    const candlestickProps = ['data', 'bullColor', 'bearColor', 'showVolume', 'movingAverages'] as const;
    if (candlestickProps.some((k) => changed.has(k))) {
      this._applyData();
    }
  }

  protected override _applyData(): void {
    if (!this._chart) return;
    // Sync _ohlcBuffer from this.data so pushData() starts from current authoritative state.
    this._ohlcBuffer = this.data ? [...(this.data as CandlestickBarPoint[])] : [];
    // WEBGPU: Full data reset — rebuild GPU data from scratch on next flush.
    this._gpuFlushedLength = 0;
    const mas = _parseMovingAverages(this.movingAverages);

    // MA-01: Rebuild state machines atomically with _ohlcBuffer reset.
    // Always rebuild from scratch — handles MA config count changes (Pitfall 3 from RESEARCH.md).
    this._maStateMachines = mas.map((ma) => new MAStateMachine(ma));

    // Replay all closes through state machines to build historical MA arrays.
    // O(n) here is unavoidable — this only runs on full data changes, not per-bar.
    const closes = this._ohlcBuffer.map((b) => b.ohlc[1]);
    const maValueArrays = this._maStateMachines.map((sm) => sm.reset(closes));
    const resolvedMAColors = this._resolveMAColors(mas);

    const option = buildCandlestickOption(this._ohlcBuffer, {
      bullColor: this._wasWebGpu ? 'transparent' : (this.bullColor ?? undefined),
      bearColor: this._wasWebGpu ? 'transparent' : (this.bearColor ?? undefined),
      showVolume: this.showVolume,
      movingAverages: mas,
      maValueArrays,
      resolvedMAColors,
    });
    // notMerge: false — merge with any option prop overrides from the base class.
    this._chart.setOption(option, { notMerge: false });
  }

  /**
   * CNDL-04: Real-time bar streaming — overrides base pushData() entirely.
   *
   * Override base implementation — candlestick uses append semantics (new bars), not rolling buffer.
   * NEVER call super.pushData() — it would add the raw point to _circularBuffer and call
   * setOption({ series: [{ data: circularBuffer }] }) on RAF flush, overwriting _ohlcBuffer.
   *
   * Trims _ohlcBuffer to this.maxPoints to prevent unbounded memory growth.
   * Coalesces rapid pushData() calls within the same animation frame via _barRafId RAF handle.
   */
  override pushData(point: unknown): void {
    const bar = point as CandlestickBarPoint;
    this._ohlcBuffer.push(bar);
    // Trim to maxPoints — prevents unbounded memory growth during long streaming sessions.
    if (this._ohlcBuffer.length > this.maxPoints) {
      this._ohlcBuffer = this._ohlcBuffer.slice(-this.maxPoints);
      // Trim MA value arrays in parallel to keep indices aligned with _ohlcBuffer.
      this._maStateMachines.forEach((sm) => sm.trim(this.maxPoints));
      // WEBGPU: After trim, _gpuFlushedLength must reset to 0.
      // The next _flushBarUpdates() will use _ohlcBuffer.slice(0) = full trimmed buffer
      // and send it all to ChartGPU, keeping the GPU chart consistent.
      this._gpuFlushedLength = 0;
    }
    // Schedule flush — coalesces multiple pushData() calls in the same RAF frame.
    if (this._barRafId === undefined) {
      this._barRafId = requestAnimationFrame(() => {
        this._flushBarUpdates();
        this._barRafId = undefined;
      });
    }
  }

  /**
   * Flush buffered bar updates to ECharts in a single setOption call.
   *
   * Uses lazyUpdate: true (not notMerge: false) for streaming flush — preserves DataZoom state
   * while batching the update to the next render cycle.
   */
  private _flushBarUpdates(): void {
    if (!this._chart || this._ohlcBuffer.length === 0) return;
    const mas = _parseMovingAverages(this.movingAverages);

    // MA-01: Incremental push — O(1) per machine per bar.
    // Only the last bar's close is needed — state machines hold the running window.
    const lastClose = this._ohlcBuffer[this._ohlcBuffer.length - 1].ohlc[1];
    const maValueArrays = this._maStateMachines.map((sm) => sm.push(lastClose));
    const resolvedMAColors = this._resolveMAColors(mas);

    const option = buildCandlestickOption(this._ohlcBuffer, {
      bullColor: this._wasWebGpu ? 'transparent' : (this.bullColor ?? undefined),
      bearColor: this._wasWebGpu ? 'transparent' : (this.bearColor ?? undefined),
      showVolume: this.showVolume,
      movingAverages: mas,
      maValueArrays,
      resolvedMAColors,
    });
    // lazyUpdate: true — preserves DataZoom state while batching update to next render cycle.
    this._chart.setOption(option, { lazyUpdate: true } as object);

    // WEBGPU: Push incremental new bars to ChartGPU after ECharts update.
    if (this._gpuChart) {
      const lastFlushed = this._gpuFlushedLength;
      const newBars = this._ohlcBuffer.slice(lastFlushed);
      if (newBars.length > 0) {
        const gpuPoints = newBars.map((bar, i) => this._toGpuPoint(bar, lastFlushed + i));
        this._gpuChart.appendData(0, gpuPoints);
        this._gpuFlushedLength = this._ohlcBuffer.length;
      }
    }
  }

  /**
   * WEBGPU: Full reverse-init cleanup — cancels RAF, disconnects ChartGPU resize observer,
   * disposes ChartGPU, releases GPU device refcount, then calls super (ECharts cleanup).
   *
   * Reverse-init order: undo steps in reverse order of _initWebGpuLayer().
   * super.disconnectedCallback() is LAST — base class references this._chart which ChartGPU
   * event listeners may hold; disposing early would cause use-after-free on those handlers.
   */
  override disconnectedCallback(): void {
    // 1. Cancel component's own RAF — must be first (base class only cancels _rafId, not _barRafId).
    if (this._barRafId !== undefined) {
      cancelAnimationFrame(this._barRafId);
      this._barRafId = undefined;
    }

    // 2. WEBGPU: Disconnect ChartGPU's resize observer and color scheme observer before disposing.
    this._gpuResizeObserver?.disconnect();
    this._gpuResizeObserver = undefined;
    this._gpuColorSchemeObserver?.disconnect();
    this._gpuColorSchemeObserver = undefined;

    // 3. WEBGPU: Dispose ChartGPU — releases GPU buffers + removes WebGPU canvas.
    //    Does NOT destroy the shared GPUDevice (owned by webgpu-device.ts singleton).
    this._gpuChart?.dispose();
    this._gpuChart = null;

    // 4. WEBGPU: Release refcount — device.destroy() fires when last chart disconnects.
    if (this._wasWebGpu) {
      void releaseGpuDevice();
    }

    // 5. ECharts cleanup (base class) — MUST be last.
    super.disconnectedCallback();
  }
}

// Custom element registration — same guard pattern as all other chart components.
if (typeof customElements !== 'undefined' && !customElements.get('lui-candlestick-chart')) {
  customElements.define('lui-candlestick-chart', LuiCandlestickChart);
}

declare global {
  interface HTMLElementTagNameMap {
    'lui-candlestick-chart': LuiCandlestickChart;
  }
}
