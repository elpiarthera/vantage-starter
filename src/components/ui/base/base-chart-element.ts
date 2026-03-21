/**
 * BaseChartElement — Abstract Lit base class for all @lit-ui/charts chart components.
 *
 * Encapsulates every cross-cutting concern shared by all chart types:
 * - SSR safety (CRITICAL-04): No static echarts imports; dynamic imports inside firstUpdated()
 * - ECharts lifecycle: init in RAF after updateComplete, full disposal with WebGL context release
 * - ThemeBridge integration: CSS token resolution before any value reaches ECharts Canvas API
 * - Dark mode: MutationObserver on document.documentElement watching the 'class' attribute
 * - ResizeObserver: Automatic chart resize when container dimensions change
 * - WebGL guard (INFRA-03): Dynamic echarts-gl import with graceful Canvas fallback
 * - Streaming (STRM-01..04): pushData() with RAF coalescing and dual appendData/circular-buffer paths
 * - Loading skeleton (CHART-04): showLoading/hideLoading tied to 'loading' property
 *
 * Phases 89-95 extend this class. They never re-solve SSR, WebGL, theming, streaming, or disposal.
 */

import { html, css, isServer, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles, dispatchCustomEvent } from '@lit-ui/core';
import { ThemeBridge } from './theme-bridge.js';
import { acquireGpuDevice, type RendererTier } from '../shared/webgpu-device.js';

// TYPE-ONLY imports — erased at compile time, never execute at runtime.
// This is the ONLY safe way to reference ECharts types in an SSR context.
// Do NOT add any value import from 'echarts' or 'echarts/core' at the top level.
import type { EChartsType, EChartsCoreOption } from 'echarts/core';

// Re-expose EChartsCoreOption under the public alias used by consumers.
// EChartsCoreOption = ECBasicOption from echarts/core, which is the correct
// type for setOption payloads in tree-shaken (echarts/core) builds.
export type { EChartsCoreOption as EChartsOption };

export abstract class BaseChartElement extends TailwindElement {
  // ---------------------------------------------------------------------------
  // Static styles
  // CRITICAL-01: :host { display: block; height: ... } guarantees non-zero
  // dimensions before echarts.init() reads the container in the RAF callback.
  // CRITICAL-05: Height var uses a CSS token so consumers can override it.
  // ---------------------------------------------------------------------------
  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
        position: relative;
        width: 100%;
        height: var(--ui-chart-height, 300px);
      }
      #chart {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }
    `,
  ];

  // ---------------------------------------------------------------------------
  // Public reactive properties
  // ---------------------------------------------------------------------------

  /**
   * CHART-02: Raw ECharts option passthrough.
   * attribute: false — JSON.parse on large datasets is lossy (number precision).
   */
  @property({ attribute: false }) option?: EChartsCoreOption;

  /**
   * CHART-01: Data property — typed as unknown; concrete classes narrow the type
   * in their own _applyData() overrides or watch via updated().
   */
  @property({ attribute: false }) data?: unknown;

  /**
   * CHART-04: Loading skeleton toggle — delegates to ECharts showLoading/hideLoading.
   */
  @property({ type: Boolean }) loading = false;

  /**
   * INFRA-03: WebGL opt-in attribute.
   * Triggers dynamic echarts-gl import in _maybeLoadGl().
   */
  @property({ type: Boolean, attribute: 'enable-gl' }) enableGl = false;

  /**
   * WEBGPU-01: Opt-in attribute for WebGPU rendering.
   * When set, _detectRenderer() probes navigator.gpu during firstUpdated().
   * Without this attribute, detection fast-paths to WebGL/Canvas with no async GPU probe.
   * Mirrors the enable-gl opt-in pattern for echarts-gl.
   */
  @property({ type: Boolean, attribute: 'enable-webgpu' }) enableWebGpu = false;

  /**
   * WEBGPU-01: Active renderer tier — readable after the 'renderer-selected' event fires.
   * Defaults to 'canvas' (safe fallback). Async detection updates this value during
   * firstUpdated() after the GPU probe resolves. Do NOT read synchronously before the
   * 'renderer-selected' event — the value may still be the default 'canvas'.
   */
  renderer: RendererTier = 'canvas';

  /**
   * STRM-02: Circular buffer capacity — maximum data points retained in buffer mode.
   */
  @property({ type: Number }) maxPoints = 1000;

  // ---------------------------------------------------------------------------
  // Protected fields (accessible to concrete chart subclasses)
  // ---------------------------------------------------------------------------

  /** ECharts instance — set after _initChart(), null after disposal. */
  protected _chart: EChartsType | null = null;

  /**
   * STRM-04: Streaming mode selector.
   * 'appendData' — for time-series Line/Area charts (NEVER call setOption after)
   * 'buffer'     — circular rolling buffer for all other chart types
   * Concrete chart classes set this in their constructor or _registerModules().
   */
  protected _streamingMode: 'appendData' | 'buffer' = 'buffer';

  // ---------------------------------------------------------------------------
  // Private fields
  // ---------------------------------------------------------------------------

  private _themeBridge = new ThemeBridge(this);
  private _resizeObserver?: ResizeObserver;
  private _colorSchemeObserver?: MutationObserver;

  /** STRM-03: Accumulator for pushData() calls before the RAF fires. */
  private _pendingData: unknown[] = [];

  /** STRM-04: Rolling data buffer for 'buffer' streaming mode. */
  private _circularBuffer: unknown[] = [];

  /** STRM-03: Handle for the scheduled requestAnimationFrame flush. */
  private _rafId?: number;

  /** Set to true when WebGL probe fails; readable by subclasses for series type selection. */
  protected _webglUnavailable = false;

  // ---------------------------------------------------------------------------
  // Protected accessors
  // ---------------------------------------------------------------------------

  /**
   * MA-02: Protected CSS token reader — delegates to _themeBridge.readToken().
   * Exposes token resolution to subclasses (e.g., LuiCandlestickChart for MA default colors)
   * without making _themeBridge itself accessible. ThemeBridge instance stays private.
   */
  protected readChartToken(name: string): string {
    return this._themeBridge.readToken(name);
  }

  // ---------------------------------------------------------------------------
  // Abstract interface (implemented by every concrete chart class)
  // ---------------------------------------------------------------------------

  /**
   * Concrete chart classes register their ECharts chart-type modules here.
   * Must call registerCanvasCore() plus the specific chart module(s).
   *
   * @example
   * ```typescript
   * protected async _registerModules(): Promise<void> {
   *   await registerCanvasCore();
   *   const { LineChart } = await import('echarts/charts');
   *   const { use } = await import('echarts/core');
   *   use([LineChart]);
   * }
   * ```
   */
  protected abstract _registerModules(): Promise<void>;

  /**
   * Called by _initChart() after the ECharts instance is ready.
   *
   * Concrete chart classes override this to apply any `data` (or other
   * chart-specific properties) that were set before initialisation completed.
   * Without this hook, properties set via JS before the first RAF fires are
   * silently dropped because updated() returns early while this._chart is null.
   *
   * Default implementation is a no-op — base class has no chart-type-specific
   * data model.
   */
  protected _applyData(): void {}

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * CHART-03: Escape hatch for direct ECharts instance access.
   * Useful for event binding, manual zoom resets, and advanced interactions.
   * Returns undefined if chart has not been initialised or has been disposed.
   */
  getChart(): EChartsType | undefined {
    return this._chart ?? undefined;
  }

  /**
   * STRM-01 + STRM-03: Streaming data ingestion with RAF coalescing.
   *
   * Multiple pushData() calls within the same animation frame are batched
   * into a single ECharts update (_flushPendingData). This prevents
   * per-point redraws when data arrives faster than 60 fps.
   */
  pushData(point: unknown): void {
    this._pendingData.push(point);
    if (this._rafId === undefined) {
      this._rafId = requestAnimationFrame(() => {
        this._flushPendingData();
        this._rafId = undefined;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Lit lifecycle
  // ---------------------------------------------------------------------------

  override render() {
    return html`<div id="chart" part="chart"></div>`;
  }

  /**
   * CRITICAL-04: firstUpdated() never fires during SSR.
   * isServer guard is belt-and-suspenders defense in case the component is
   * instantiated in a mixed SSR+hydration context where lifecycle timing differs.
   *
   * CRITICAL-01: requestAnimationFrame() ensures browser layout is complete
   * before echarts.init() reads container dimensions.
   */
  override async firstUpdated(_changed: PropertyValues): Promise<void> {
    if (isServer) return;

    await this.updateComplete;
    await this._detectRenderer();   // WEBGPU-01 + WEBGPU-03 — runs before GL load
    await this._maybeLoadGl();      // existing WebGL path unchanged

    // RAF ensures :host has been painted and has non-zero dimensions
    requestAnimationFrame(() => this._initChart());
  }

  /**
   * Reactive property change handler — forwards changes to the live ECharts instance.
   * Short-circuits if chart hasn't been initialised yet (changes applied in _initChart).
   */
  override updated(changed: PropertyValues): void {
    if (!this._chart) return;

    if (changed.has('option') && this.option) {
      // CRITICAL-03: setOption is safe here only when NOT actively streaming via
      // appendData. Concrete appendData-mode charts should NOT set this.option
      // after streaming has started.
      this._chart.setOption(this.option);
    }

    if (changed.has('loading')) {
      this.loading ? this._chart.showLoading() : this._chart.hideLoading();
    }
  }

  /**
   * Full disposal chain — run in this exact order to avoid GPU resource leaks.
   *
   * CRITICAL-02: loseContext() MUST be called before dispose().
   * dispose() alone does not promptly release the underlying WebGL context.
   * Browsers enforce a limit of ~16 concurrent WebGL contexts; exceeding it
   * silently causes subsequent echarts.init() calls to return a degraded instance.
   */
  override disconnectedCallback(): void {
    super.disconnectedCallback();

    // 1. Cancel any pending RAF to prevent post-disposal ECharts calls
    if (this._rafId !== undefined) {
      cancelAnimationFrame(this._rafId);
      this._rafId = undefined;
    }

    // 2. Disconnect DOM observers
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
    this._colorSchemeObserver?.disconnect();
    this._colorSchemeObserver = undefined;

    if (this._chart) {
      // 3. CRITICAL-02: Release WebGL GPU context BEFORE dispose()
      const dom = this._chart.getDom();
      if (dom) {
        const canvases = dom.getElementsByTagName('canvas');
        for (const canvas of Array.from(canvases)) {
          const gl =
            canvas.getContext('webgl2') ||
            (canvas.getContext as (ctx: string) => WebGLRenderingContext | null)('webgl');
          gl?.getExtension('WEBGL_lose_context')?.loseContext();
        }
      }

      // 4. Dispose ECharts instance and null the reference.
      // Nulling prevents GC-retained JS references after DOM removal.
      this._chart.dispose();
      this._chart = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Private implementation
  // ---------------------------------------------------------------------------

  /**
   * Full chart initialization sequence, runs inside a requestAnimationFrame
   * callback scheduled by firstUpdated().
   *
   * MEDIUM-02: getInstanceByDom check handles Chrome moveBefore() double-init
   * scenario where the element is moved in the DOM without being disconnected first.
   */
  protected async _initChart(): Promise<void> {
    // Register chart-type-specific ECharts modules (implemented by subclass)
    await this._registerModules();

    // Dynamic value import — ONLY safe place to import echarts functions.
    // CRITICAL-04: Never import at the top level — this crashes SSR environments.
    const { init, getInstanceByDom } = await import('echarts/core');

    const container = this.shadowRoot?.querySelector<HTMLDivElement>('#chart');
    if (!container) return;

    // MEDIUM-02: Dispose any existing instance on this container before re-init
    const existing = getInstanceByDom(container);
    if (existing) existing.dispose();

    // Build theme with resolved CSS token values (CRITICAL-05)
    const theme = this._themeBridge.buildThemeObject();
    this._chart = init(container, theme, { renderer: 'canvas' });

    // CHART-05: ResizeObserver on the inner container for accurate dimension tracking
    this._resizeObserver = new ResizeObserver(() => this._chart?.resize());
    this._resizeObserver.observe(container);

    // INFRA-04 / MEDIUM-04: Watch .dark class changes on <html> for dark mode
    this._colorSchemeObserver = new MutationObserver(() => this._applyThemeUpdate());
    this._colorSchemeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Apply any property values that arrived before chart initialisation
    if (this.option) this._chart.setOption(this.option);
    if (this.loading) this._chart.showLoading();

    // Apply chart-specific data that may have been set before _initChart() ran.
    // Concrete classes override _applyData() to convert this.data -> ECharts setOption().
    // This is necessary because React/JS consumers often set .data synchronously after
    // mount, before the RAF callback fires. updated() returns early while this._chart
    // is null, so without this call that data would never reach ECharts.
    this._applyData();
  }

  /**
   * Incremental dark mode theme update — avoids dispose+reinit flicker.
   *
   * Rebuilds only the color array via ThemeBridge and applies it with setOption.
   * CRITICAL-03 note: This setOption touches only the color palette, not series data.
   * For appendData-mode charts this is safe — no series data keys are included.
   */
  private _applyThemeUpdate(): void {
    if (!this._chart) return;
    const update = this._themeBridge.buildColorUpdate();
    this._chart.setOption(update);
  }

  /**
   * RAF flush — consumes all pending pushData() points in a single ECharts call.
   *
   * STRM-03: Points accumulated since the last RAF are processed together.
   * STRM-04: Routes to appendData (time-series) or circular-buffer (other types).
   * CRITICAL-03: appendData and setOption are STRICTLY SEPARATE paths.
   */
  private _flushPendingData(): void {
    if (!this._chart || this._pendingData.length === 0) return;

    const points = this._pendingData.splice(0); // consume all pending points

    if (this._streamingMode === 'appendData') {
      // STRM-04 appendData path — for Line/Area time-series charts.
      // CRITICAL-03: NEVER call setOption on a chart that has received appendData.
      this._chart.appendData({ seriesIndex: 0, data: points });
    } else {
      // STRM-04 circular-buffer path — for Bar, Scatter, Gauge, etc.
      this._circularBuffer.push(...points);
      if (this._circularBuffer.length > this.maxPoints) {
        this._circularBuffer = this._circularBuffer.slice(-this.maxPoints);
      }
      // lazyUpdate: true batches the render with other pending updates in this frame
      this._chart.setOption(
        { series: [{ data: this._circularBuffer }] },
        { lazyUpdate: true } as object
      );
    }
  }

  /**
   * WEBGPU-01 + WEBGPU-03: Detect the active renderer tier and fire 'renderer-selected'.
   *
   * Detection order:
   * 1. If isServer or navigator unavailable → canvas/webgl fallback (SSR safety)
   * 2. If enable-webgpu is NOT set → skip async GPU probe, use WebGL if available
   * 3. If navigator.gpu is available AND enable-webgpu is set → probe adapter
   * 4. If adapter acquired → call acquireGpuDevice() (WEBGPU-03 singleton) → renderer = 'webgpu'
   * 5. If adapter null → WebGL/Canvas fallback
   *
   * Always dispatches 'renderer-selected' at the end regardless of the tier selected.
   * Called from firstUpdated() before _maybeLoadGl().
   */
  protected async _detectRenderer(): Promise<void> {
    // Belt-and-suspenders: isServer covers Lit SSR; typeof navigator covers other Node environments.
    // Must check both because isServer is a compile-time Lit flag; typeof is a runtime guard.
    if (isServer || typeof navigator === 'undefined' || !navigator.gpu) {
      this.renderer = this._isWebGLSupported() ? 'webgl' : 'canvas';
      dispatchCustomEvent(this, 'renderer-selected', { renderer: this.renderer });
      return;
    }

    if (!this.enableWebGpu) {
      // WebGPU not requested — skip the async adapter probe entirely.
      // This avoids ~10-50ms async GPU startup overhead on charts that won't use WebGPU.
      this.renderer = this._isWebGLSupported() ? 'webgl' : 'canvas';
      dispatchCustomEvent(this, 'renderer-selected', { renderer: this.renderer });
      return;
    }

    // requestAdapter() resolves to null when no GPU adapter is available.
    // It NEVER rejects — null means no WebGPU, not an error. Always check for null.
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      this.renderer = this._isWebGLSupported() ? 'webgl' : 'canvas';
      dispatchCustomEvent(this, 'renderer-selected', { renderer: this.renderer });
      return;
    }

    // WEBGPU-03: Acquire (or reuse) the page-scoped singleton GPUDevice.
    // Multiple chart instances safely call this — only the first adapter is used.
    await acquireGpuDevice(adapter);
    this.renderer = 'webgpu';
    dispatchCustomEvent(this, 'renderer-selected', { renderer: this.renderer });
  }

  /**
   * INFRA-03: Conditionally load echarts-gl if enable-gl attribute is set.
   *
   * Probes for WebGL support first. If unavailable, fires 'webgl-unavailable'
   * event so the host application can degrade gracefully, then falls through
   * to canvas-only rendering.
   *
   * echarts-gl is a separate bundle chunk — it is NEVER included in the main bundle.
   */
  private async _maybeLoadGl(): Promise<void> {
    if (!this.enableGl) return;

    if (!this._isWebGLSupported()) {
      this._webglUnavailable = true;
      dispatchCustomEvent(this, 'webgl-unavailable', {
        reason: 'WebGL context unavailable in this environment',
      });
      // Fall through — chart will use Canvas renderer instead
      return;
    }

    // Dynamic side-effect import — echarts-gl registers itself with ECharts globally.
    // @ts-ignore: echarts-gl 2.0.9 does not ship subpath type declarations.
    // Type shims are deferred to Phase 92 per project research recommendation.
    await import('echarts-gl');
  }

  /**
   * Probes for WebGL availability by attempting to create a context.
   * Returns false on SSR, in environments without a GPU, or when the
   * browser has exceeded the concurrent WebGL context limit.
   */
  private _isWebGLSupported(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      return !!(
        canvas.getContext('webgl2') ||
        (canvas.getContext as (ctx: string) => WebGLRenderingContext | null)('webgl')
      );
    } catch {
      return false;
    }
  }
}
