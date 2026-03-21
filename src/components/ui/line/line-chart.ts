/**
 * LuiLineChart — Line chart component extending BaseChartElement.
 *
 * LINE-01: Multi-series line chart via `data` prop (array of { name, data[] })
 * LINE-02: smooth, zoom, markLines props for curve interpolation, zoom/pan, threshold lines
 * LINE-03: Real-time streaming via pushData() override with per-series ring buffers + RAF coalescing
 *
 * STRM-01: Each series buffer converted to Float32Array before setOption (TypedArray requirement).
 * STRM-02: maxPoints-triggered dispose+reinit prevents unbounded memory growth.
 * STRM-03: seriesIndex routing in pushData(point, seriesIndex?) for multi-series streaming.
 */

import { property } from 'lit/decorators.js';
import type { PropertyValues } from 'lit';
import { BaseChartElement } from '../base/base-chart-element.js';
import { registerLineModules } from './line-registry.js';
import {
  buildLineOption,
  type LineChartSeries,
  type MarkLineSpec,
} from '../shared/line-option-builder.js';
import {
  getGpuDevice,
  getGpuAdapter,
  releaseGpuDevice,
} from '../shared/webgpu-device.js';

// WEBGPU-02: Minimal ChartGPU instance interface — avoids hard dependency on chartgpu types
// at module scope. Full type is inferred at runtime from await import('chartgpu').
// appendData signature matches ChartGPU 0.3.2 real API: (seriesIndex, newPoints).
// DataPoint accepts [x, y] tuples (DataPointTuple format).
interface _GpuChartInstance {
  resize(): void;
  dispose(): void;
  setZoomRange(start: number, end: number): void;
  appendData(seriesIndex: number, newPoints: ReadonlyArray<readonly [number, number]>): void;
}

export class LuiLineChart extends BaseChartElement {
  // LINE-02: Smooth Catmull-Rom spline interpolation
  @property({ type: Boolean }) smooth = false;

  // LINE-02: DataZoom inside (mouse wheel) + slider (scrubber) — already registered in canvas-core
  @property({ type: Boolean }) zoom = false;

  // LINE-02: Threshold mark lines — { value, label?, color? }[]
  // attribute: false — prevents lossy JSON.parse; set via JS property only
  @property({ attribute: false }) markLines?: MarkLineSpec[];

  // STRM-01 + STRM-03: Per-series accumulation buffers — index matches ECharts series index.
  // Each element holds all accumulated points for one series as plain JS arrays.
  // Points are converted to Float32Array at flush time (STRM-01 TypedArray requirement).
  private _lineBuffers: unknown[][] = [[]];

  // STRM-02: Total points pushed across all series — triggers reset at maxPoints.
  private _totalPoints = 0;

  // Component's own RAF handle — must be cancelled in disconnectedCallback().
  // Base class cancels its own _rafId but has no knowledge of _lineRafId.
  private _lineRafId?: number;

  // WEBGPU-02: ChartGPU instance — null when WebGPU unavailable or before init.
  private _gpuChart: _GpuChartInstance | null = null;

  // WEBGPU-02: Separate ResizeObserver for ChartGPU — the base class observer only calls this._chart.resize().
  private _gpuResizeObserver?: ResizeObserver;

  // WEBGPU-02: Flag set to true when WebGPU path was active — used to gate releaseGpuDevice() in cleanup.
  private _wasWebGpu = false;

  // WEBGPU-02: Tracks the last flushed buffer length per series — enables incremental ChartGPU pushes.
  // Incremental: each flush sends only new points since last flush, not the full buffer.
  private _gpuFlushedLengths: number[] = [];

  // STRM-02: Line/Area charts stream 1M+ points; base default of 1000 is for buffer-mode charts.
  // Override to 500_000 — allows ~8 minutes of streaming at 1000 pts/sec before reset.
  override maxPoints = 500_000;

  /**
   * WEBGPU-02: Override _initChart() to layer ChartGPU beneath ECharts when WebGPU is active.
   *
   * Calls super._initChart() first (registers modules, inits ECharts, sets up ResizeObserver,
   * ColorSchemeObserver, calls _applyData), then conditionally initializes the ChartGPU
   * data layer on top when this.renderer === 'webgpu'.
   */
  protected override async _initChart(): Promise<void> {
    // 1. Standard ECharts init (registers modules, builds theme, sets up ResizeObserver).
    await super._initChart();

    // 2. If WebGPU was detected, layer ChartGPU beneath ECharts canvas.
    if (this.renderer === 'webgpu') {
      await this._initWebGpuLayer();
    }
  }

  /**
   * WEBGPU-02: Initialize the ChartGPU GPU-accelerated data layer beneath ECharts.
   *
   * Creates a host div with z-index:0 and pointer-events:none positioned absolutely
   * inside the #chart container, then initializes ChartGPU inside it using the shared
   * GPUDevice singleton from webgpu-device.ts.
   */
  private async _initWebGpuLayer(): Promise<void> {
    const devicePromise = getGpuDevice();
    if (!devicePromise) return; // guard — renderer === 'webgpu' implies device exists

    const device = await devicePromise;
    const adapter = getGpuAdapter(); // may be null for injected-device-only case; ChartGPU accepts device-only

    // Dynamic import — NEVER at module top level (SSR + tree-shaking constraint).
    // Same pattern as echarts-gl import in base-chart-element.ts.
    const { ChartGPU } = await import('chartgpu');

    const container = this.shadowRoot?.querySelector<HTMLDivElement>('#chart');
    if (!container) return;

    // Insert a host div for ChartGPU BEFORE ECharts' canvas elements.
    // z-index:0 keeps ChartGPU below ECharts (which renders at default stacking order above 0).
    // pointer-events:none is CRITICAL — ECharts must receive all mouse events for tooltip + DataZoom.
    const gpuHost = document.createElement('div');
    gpuHost.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
    container.insertBefore(gpuHost, container.firstChild);

    // WEBGPU-03: Pass the Phase 98 singleton device — ChartGPU will NOT destroy it on dispose().
    // ChartGPUCreateContext requires both adapter and device (adapter is not optional per 0.3.2 types).
    // When adapter is null (edge case: device injected without adapter), fall back to standalone create.
    if (!adapter) {
      // No adapter stored — cannot use shared-context overload; create standalone instance.
      // This path is defensive only; renderer === 'webgpu' implies adapter was acquired.
      this._gpuChart = (await ChartGPU.create(gpuHost, {
        series: [{ type: 'line', data: [] }],
      })) as unknown as _GpuChartInstance;
    } else {
      this._gpuChart = (await ChartGPU.create(
        gpuHost,
        {
          series: [{ type: 'line', data: [] }],
          // Do NOT set renderMode:'external' — let ChartGPU own its RAF loop.
          // (Research Pitfall 7: external mode requires manual renderFrame() calls; not needed for Phase 101.)
        },
        { device, adapter }
      )) as unknown as _GpuChartInstance;
    }

    this._wasWebGpu = true;

    // ChartGPU needs its own resize tracking — the base class ResizeObserver only calls this._chart.resize().
    this._gpuResizeObserver = new ResizeObserver(() => this._gpuChart?.resize());
    this._gpuResizeObserver.observe(container);

    // Wire coordinate sync — fires on every DataZoom and after each layout paint.
    this._chart!.on('dataZoom', () => this._syncCoordinates());
    this._chart!.on('rendered', () => this._syncCoordinates());
  }

  /**
   * WEBGPU-02: Sync ECharts DataZoom percent-space to ChartGPU zoom range.
   *
   * Uses getOption().dataZoom[0].start/end (percent-space [0, 100]) which maps
   * directly to ChartGPU.setZoomRange() without an additional pixel→percent conversion.
   * This is architecturally correct — ChartGPU operates in percent-space, not pixel-space.
   */
  private _syncCoordinates(): void {
    if (!this._chart || !this._gpuChart) return;

    const option = this._chart.getOption() as Record<string, unknown>;
    const dataZoom = (option['dataZoom'] as Array<Record<string, unknown>> | undefined)?.[0];
    if (!dataZoom) return;

    const start = (dataZoom['start'] as number) ?? 0;
    const end = (dataZoom['end'] as number) ?? 100;

    // Guard against NaN — can occur before first setOption initializes coordinate system.
    if (isNaN(start) || isNaN(end)) return;

    this._gpuChart.setZoomRange(start, end);
  }

  /**
   * STRM-01 + STRM-02 + STRM-03: Ring-buffer streaming with seriesIndex routing.
   *
   * Overrides base pushData() entirely — NEVER call super.pushData().
   * super.pushData() routes to the base _pendingData accumulator which feeds the
   * appendData/buffer path — that path is bypassed entirely in Line/Area charts.
   *
   * Points are accumulated per-series and flushed once per RAF via _flushLineUpdates().
   * When _totalPoints >= maxPoints, the chart disposes and reinitializes (STRM-02).
   */
  override pushData(point: unknown, seriesIndex = 0): void {
    // Grow buffer array on demand to accommodate the requested seriesIndex.
    while (this._lineBuffers.length <= seriesIndex) {
      this._lineBuffers.push([]);
    }
    this._lineBuffers[seriesIndex].push(point);
    this._totalPoints++;

    // STRM-02: Truncation — dispose+reinit when total points reach maxPoints.
    if (this._totalPoints >= this.maxPoints) {
      this._triggerReset();
      return;
    }

    // Schedule RAF flush — coalesces multiple pushData() calls in one frame.
    if (this._lineRafId === undefined) {
      this._lineRafId = requestAnimationFrame(() => {
        this._flushLineUpdates();
        this._lineRafId = undefined;
      });
    }
  }

  /**
   * RAF flush — passes all buffered points to ECharts via setOption(lazyUpdate:true).
   *
   * STRM-01: Each series buffer is converted to Float32Array before being passed to
   * setOption. This satisfies the TypedArray ring-buffer requirement literally:
   * ECharts receives Float32Array data, not plain JS arrays.
   *
   * lazyUpdate:true batches the render and preserves DataZoom state without
   * triggering a full re-render per call.
   *
   * Only updates series indices that exist in this.data to prevent ECharts from
   * receiving a seriesIndex referencing a series that was never registered.
   */
  private _flushLineUpdates(): void {
    if (!this._chart || this._lineBuffers.every((b) => b.length === 0)) return;

    const seriesCount = Array.isArray(this.data) ? (this.data as unknown[]).length : 1;
    const seriesUpdates = this._lineBuffers
      .slice(0, seriesCount)
      .map((buf) => ({ data: new Float32Array(buf as number[]) }));

    this._chart.setOption(
      { series: seriesUpdates },
      { lazyUpdate: true } as object
    );

    // WEBGPU-02: Push new points to ChartGPU data layer (incremental — not full buffer replacement).
    // appendData(seriesIndex, newPoints) accumulates internally — only send points since last flush.
    if (this._gpuChart) {
      this._lineBuffers.slice(0, seriesCount).forEach((buf, idx) => {
        const lastFlushed = this._gpuFlushedLengths[idx] ?? 0;
        const newPoints = (buf as number[]).slice(lastFlushed);
        if (newPoints.length > 0) {
          // ChartGPU appendData expects DataPoint[] — [x, y] tuples where x is position index.
          // Line/area buffers hold y-values only (x is position index starting from lastFlushed).
          const pairs = newPoints.map(
            (v, i) => [lastFlushed + i, v] as readonly [number, number]
          );
          this._gpuChart!.appendData(idx, pairs);
          this._gpuFlushedLengths[idx] = buf.length;
        }
      });
    }
  }

  /**
   * STRM-02: Dispose + reinit when maxPoints is reached.
   *
   * dispose+reinit (not chart.clear()) is the officially recommended full-reset path.
   * chart.clear() leaves residue in ECharts 5.6. dispose() + _initChart() is clean.
   *
   * _initChart() is protected (Plan 01 change) — subclass access is valid.
   * The reinit is async (awaits module registration) — wrap in RAF to avoid blocking.
   */
  private _triggerReset(): void {
    // 1. Cancel pending RAF — nothing to flush into a chart that's being disposed.
    if (this._lineRafId !== undefined) {
      cancelAnimationFrame(this._lineRafId);
      this._lineRafId = undefined;
    }
    // 2. Clear all buffers and reset counter — fresh start after reinit.
    this._lineBuffers = this._lineBuffers.map(() => []);
    this._totalPoints = 0;
    // WEBGPU-02: Reset incremental flush positions so next flush starts from index 0.
    this._gpuFlushedLengths = [];
    // 3. Dispose current ECharts instance.
    //    Set _chart = null immediately — disconnectedCallback() guards on null.
    if (this._chart) {
      this._chart.dispose();
      this._chart = null;
    }
    // 3b. Clean up ChartGPU layer before reinit — prevents GPU canvas leak and stale
    //     refcount when WebGPU streaming crosses the maxPoints boundary (STRM-02, WEBGPU-03).
    //     Same pattern as disconnectedCallback(); _wasWebGpu reset so _initChart() can re-set it.
    this._gpuResizeObserver?.disconnect();
    this._gpuResizeObserver = undefined;
    this._gpuChart?.dispose();
    this._gpuChart = null;
    if (this._wasWebGpu) {
      void releaseGpuDevice();
      this._wasWebGpu = false;
    }
    // 4. Reinit in next frame — _initChart() awaits _registerModules() internally.
    requestAnimationFrame(() => this._initChart());
  }

  /**
   * WEBGPU-02: Full reverse-init cleanup — cancels RAF, disconnects ChartGPU resize observer,
   * disposes ChartGPU, releases GPU device refcount, then calls super (ECharts cleanup).
   *
   * Reverse-init order (Pitfall 5): undo steps in reverse order of _initWebGpuLayer().
   * super.disconnectedCallback() is LAST — base class references this._chart which ChartGPU
   * event listeners may hold; disposing early would cause use-after-free on those handlers.
   */
  override disconnectedCallback(): void {
    // 1. Cancel streaming RAF — no flushes after teardown starts.
    if (this._lineRafId !== undefined) {
      cancelAnimationFrame(this._lineRafId);
      this._lineRafId = undefined;
    }

    // 2. WEBGPU-02: Disconnect ChartGPU's resize observer before disposing.
    this._gpuResizeObserver?.disconnect();
    this._gpuResizeObserver = undefined;

    // 3. WEBGPU-02: Dispose ChartGPU — releases GPU buffers + removes canvas.
    //    Does NOT destroy the injected GPUDevice (WEBGPU-03: singleton owned by webgpu-device.ts).
    this._gpuChart?.dispose();
    this._gpuChart = null;

    // 4. WEBGPU-02: Release refcount — device.destroy() fires when last chart disconnects.
    //    void cast: releaseGpuDevice() is async; disconnectedCallback() is sync.
    if (this._wasWebGpu) {
      void releaseGpuDevice();
    }

    // 5. ECharts cleanup (base class) — disposes chart, disconnects ResizeObserver/MutationObserver.
    //    Must be LAST — base class references this._chart which ChartGPU event listeners may hold.
    super.disconnectedCallback();
  }

  protected override async _registerModules(): Promise<void> {
    await registerLineModules();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed); // base handles this.option and this.loading
    if (!this._chart) return;
    const lineProps = ['data', 'smooth', 'zoom', 'markLines'] as const;
    if (lineProps.some((k) => changed.has(k))) {
      this._applyData();
    }
  }

  protected override _applyData(): void {
    if (!this._chart || !this.data) return;
    const option = buildLineOption(
      this.data as LineChartSeries[],
      { smooth: this.smooth, zoom: this.zoom, markLines: this.markLines },
      'line'
    );
    // CRITICAL-03: setOption is called here for initial/prop-change renders only.
    // After streaming starts (pushData calls), _flushLineUpdates() handles updates
    // via lazyUpdate:true to avoid clobbering buffered data.
    this._chart.setOption(option, { notMerge: false });
  }
}

// Custom element registration — same guard pattern as all other @lit-ui packages
if (typeof customElements !== 'undefined' && !customElements.get('lui-line-chart')) {
  customElements.define('lui-line-chart', LuiLineChart);
}

declare global {
  interface HTMLElementTagNameMap {
    'lui-line-chart': LuiLineChart;
  }
}
