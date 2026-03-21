/**
 * LuiScatterChart — Scatter/Bubble chart component extending BaseChartElement.
 *
 * SCAT-01: bubble prop adds third dimension driving symbol size (Canvas mode only)
 * SCAT-02: enable-gl attribute (inherited from base) selects type: 'scatterGL' WebGL path
 * SCAT-03: streaming via inherited pushData() — circular buffer path (base default)
 *
 * STRM-04 compliance: DO NOT override _streamingMode — base 'buffer' is correct.
 * scatterGL does NOT support appendData (only linesGL does in echarts-gl 2.0.9).
 * Both Canvas and GL modes use circular buffer + setOption.
 */

import { property } from 'lit/decorators.js';
import type { PropertyValues } from 'lit';
import { BaseChartElement } from '../base/base-chart-element.js';
import { registerScatterModules } from './scatter-registry.js';
import { buildScatterOption, type ScatterPoint } from '../shared/scatter-option-builder.js';

export class LuiScatterChart extends BaseChartElement {
  // NO _streamingMode override — base 'buffer' is correct for scatter charts (SCAT-03).
  // scatterGL uses GPU progressive rendering, not appendData.

  // SCAT-01: When true, data format is [x, y, size]; symbolSize callback reads value[2].
  // Canvas mode only — GL mode uses fixed symbolSize (scatterGL limitation).
  @property({ type: Boolean }) bubble = false;

  protected override async _registerModules(): Promise<void> {
    await registerScatterModules();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed); // base handles this.option passthrough and this.loading state
    if (!this._chart) return;
    // SCAT-02: Watch enableGl so series type updates if enable-gl is toggled at runtime.
    const scatterProps = ['data', 'bubble', 'enableGl'] as const;
    if (scatterProps.some((k) => changed.has(k))) {
      this._applyData();
    }
  }

  protected override _applyData(): void {
    if (!this._chart || !this.data) return;
    // SCAT-02: useGl requires BOTH enableGl set AND successful WebGL probe.
    // _webglUnavailable is protected in BaseChartElement (changed in Plan 01).
    const useGl = this.enableGl && !this._webglUnavailable;
    const option = buildScatterOption(this.data as ScatterPoint[], {
      bubble: this.bubble,
      useGl,
    });
    this._chart.setOption(option, { notMerge: false });
  }
}

// Custom element registration — same guard pattern as all other @lit-ui packages.
if (typeof customElements !== 'undefined' && !customElements.get('lui-scatter-chart')) {
  customElements.define('lui-scatter-chart', LuiScatterChart);
}

declare global {
  interface HTMLElementTagNameMap {
    'lui-scatter-chart': LuiScatterChart;
  }
}
