/**
 * LuiBarChart — Bar chart component extending BaseChartElement.
 *
 * BAR-01: Grouped (default), stacked, and horizontal bar charts
 * BAR-02: Value labels on bars (`show-labels`); per-bar palette color (`color-by-data`)
 * BAR-03: Streaming via inherited pushData() — circular buffer path (base default)
 *
 * STRM-04 compliance: Bar charts use the circular buffer path (_streamingMode = 'buffer').
 * DO NOT override _streamingMode to 'appendData' — appendData only works for line series.
 * The base class _flushPendingData() handles circular buffer automatically.
 *
 * Streaming limitation: pushData() updates series[0].data only (base buffer behavior).
 * For grouped multi-series bar charts, only the first series is updated by pushData().
 * This satisfies BAR-03 ("chart update via circular buffer without full re-initialization").
 */

import { property } from 'lit/decorators.js';
import type { PropertyValues } from 'lit';
import { BaseChartElement } from '../base/base-chart-element.js';
import { registerBarModules } from './bar-registry.js';
import { buildBarOption, type BarChartSeries } from '../shared/bar-option-builder.js';

export class LuiBarChart extends BaseChartElement {
  // NO constructor override — base _streamingMode = 'buffer' is correct for bar charts.
  // STRM-04: "all other chart types use circular buffer + setOption({ lazyUpdate: true })"

  // BAR-01: Stack all series in one group. Passes stack: 'total' (string) to buildBarOption.
  @property({ type: Boolean }) stacked = false;

  // BAR-01: Horizontal orientation. Swaps xAxis/yAxis types atomically in buildBarOption.
  @property({ type: Boolean }) horizontal = false;

  // BAR-02: Value labels on each bar.
  @property({ type: Boolean, attribute: 'show-labels' }) showLabels = false;

  // BAR-02: Label position when show-labels is true.
  // 'top' (default) = above bar / at bar end for horizontal.
  // 'bottom' = below bar / at bar start for horizontal.
  @property({ attribute: 'label-position' }) labelPosition: 'top' | 'bottom' = 'top';

  // BAR-02: Each bar receives a distinct palette color (colorBy: 'data').
  // Best with single-series bar charts. Multi-series: each bar cycles through palette per series.
  @property({ type: Boolean, attribute: 'color-by-data' }) colorByData = false;

  protected override async _registerModules(): Promise<void> {
    await registerBarModules();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed); // base handles this.option passthrough and this.loading state
    if (!this._chart) return;
    const barProps = ['data', 'stacked', 'horizontal', 'showLabels', 'colorByData', 'labelPosition'] as const;
    if (barProps.some((k) => changed.has(k))) {
      this._applyData();
    }
  }

  protected override _applyData(): void {
    if (!this._chart || !this.data) return;
    const option = buildBarOption(this.data as BarChartSeries[], {
      stacked: this.stacked,
      horizontal: this.horizontal,
      showLabels: this.showLabels,
      labelPosition: this.labelPosition,
      colorByData: this.colorByData,
    });
    // notMerge: false — merge with any option prop overrides from the base class.
    // Note: if pushData() streaming is active, _applyData() will momentarily overwrite
    // series[0] data with the static data prop; the next RAF flush will restore streamed data.
    this._chart.setOption(option, { notMerge: false });
  }
}

// Custom element registration — same guard pattern as all other @lit-ui packages.
if (typeof customElements !== 'undefined' && !customElements.get('lui-bar-chart')) {
  customElements.define('lui-bar-chart', LuiBarChart);
}

declare global {
  interface HTMLElementTagNameMap {
    'lui-bar-chart': LuiBarChart;
  }
}
