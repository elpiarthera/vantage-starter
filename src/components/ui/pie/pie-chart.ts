/**
 * LuiPieChart — Pie/Donut chart component extending BaseChartElement.
 *
 * PIE-01: small-slice merging below min-percent threshold
 * PIE-02: donut mode via inner-radius; center-label in donut hole
 * PIE-03: streaming via inherited pushData() — circular buffer path (base default)
 *
 * STRM-04 compliance: DO NOT override _streamingMode — base 'buffer' is correct for pie charts.
 * appendData only works for line series; pie charts always use circular buffer + setOption.
 */

import { property } from 'lit/decorators.js';
import type { PropertyValues } from 'lit';
import { BaseChartElement } from '../base/base-chart-element.js';
import { registerPieModules } from './pie-registry.js';
import { buildPieOption, type PieSlice } from '../shared/pie-option-builder.js';

export class LuiPieChart extends BaseChartElement {
  // NO constructor override — base _streamingMode = 'buffer' is correct for pie charts.
  // STRM-04: "all other chart types use circular buffer + setOption({ lazyUpdate: true })"

  // PIE-01: Merge slices below this percentage into "Other". 0 = no merging (default).
  @property({ type: Number, attribute: 'min-percent' }) minPercent = 0;

  // PIE-02: Inner radius for donut mode. 0 or '' = filled pie. Example: '40%'.
  // Note: @property without type converter — attribute value is received as string from HTML.
  // buildPieOption handles string '0' as pie mode (same as numeric 0).
  @property({ attribute: 'inner-radius' }) innerRadius: string | number = 0;

  // PIE-02: Text displayed in the donut center hole. Only visible when innerRadius is non-zero.
  @property({ attribute: 'center-label' }) centerLabel = '';

  // PIE-LABEL: Slice label position.
  // 'top' (default) = outside the pie with connector lines.
  // 'bottom' = inside each slice.
  @property({ attribute: 'label-position' }) labelPosition: 'top' | 'bottom' = 'top';

  protected override async _registerModules(): Promise<void> {
    await registerPieModules();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed); // base handles this.option passthrough and this.loading state
    if (!this._chart) return;
    const pieProps = ['data', 'minPercent', 'innerRadius', 'centerLabel', 'labelPosition'] as const;
    if (pieProps.some((k) => changed.has(k))) {
      this._applyData();
    }
  }

  protected override _applyData(): void {
    if (!this._chart || !this.data) return;
    const option = buildPieOption(this.data as PieSlice[], {
      minPercent: this.minPercent,
      innerRadius: this.innerRadius,
      centerLabel: this.centerLabel || undefined,
      labelPosition: this.labelPosition,
    });
    // notMerge: false — merge with any option prop overrides from the base class.
    this._chart.setOption(option, { notMerge: false });
  }
}

// Custom element registration — same guard pattern as all other @lit-ui packages.
if (typeof customElements !== 'undefined' && !customElements.get('lui-pie-chart')) {
  customElements.define('lui-pie-chart', LuiPieChart);
}

declare global {
  interface HTMLElementTagNameMap {
    'lui-pie-chart': LuiPieChart;
  }
}
