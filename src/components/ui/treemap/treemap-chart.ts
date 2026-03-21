/**
 * LuiTreemapChart — Treemap chart component extending BaseChartElement.
 *
 * TREE-01: Renders hierarchical { name, value, children[] } data as a space-filling treemap
 * TREE-02: breadcrumb prop toggles ECharts built-in navigation; rounded prop applies borderRadius;
 *          level-colors prop configures per-depth color palettes
 *
 * No streaming requirement (TREE-01/TREE-02 have no pushData() requirement).
 * pushData() is overridden with a no-op + console.warn to prevent the base class
 * circular-buffer path from overwriting hierarchical tree data with a flat array (Pitfall 4).
 */

import { property } from 'lit/decorators.js';
import type { PropertyValues } from 'lit';
import { BaseChartElement } from '../base/base-chart-element.js';
import { registerTreemapModules } from './treemap-registry.js';
import {
  buildTreemapOption,
  type TreemapNode,
} from '../shared/treemap-option-builder.js';

export class LuiTreemapChart extends BaseChartElement {
  // TREE-02: Breadcrumb navigation — toggles ECharts built-in breadcrumb bar. Default: true.
  @property({ type: Boolean }) breadcrumb = true;

  // TREE-02: Rounded cells — maps to itemStyle.borderRadius: 6 when true, 0 when false.
  @property({ type: Boolean }) rounded = false;

  // TREE-02: Per-level color arrays — arrives as JSON string from HTML attribute.
  // Format: '[["#color1","#color2"],["#color3","#color4"]]' — array of arrays (Pitfall 3).
  // Parsed in _applyData() via _parseLevelColors().
  @property({ attribute: 'level-colors' }) levelColors: string | null = null;

  protected override async _registerModules(): Promise<void> {
    await registerTreemapModules();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed); // base handles this.option passthrough and this.loading state
    if (!this._chart) return;
    const treemapProps = ['data', 'breadcrumb', 'rounded', 'levelColors'] as const;
    if (treemapProps.some((k) => changed.has(k))) {
      this._applyData();
    }
  }

  protected override _applyData(): void {
    if (!this._chart) return;
    const data = this.data ? (this.data as TreemapNode[]) : [];
    const levelColors = this._parseLevelColors(this.levelColors);
    const option = buildTreemapOption(data, {
      breadcrumb: this.breadcrumb,
      borderRadius: this.rounded ? 6 : 0,
      levelColors,
    });
    // notMerge: true — replaces the entire option object so no stale series config bleeds through.
    // However, notMerge:true alone does NOT reset the ECharts treemap internal navigation stack
    // (the currentRoot path stored in the renderer model). A stale drill-down state from a prior
    // interactive session persists across setOption calls because it lives outside the option object.
    // Fix: dispatch treemapRootToNode immediately after setOption to programmatically navigate back
    // to the root node, so the chart always opens at the root view regardless of prior interaction.
    this._chart.setOption(option, { notMerge: true });
    // Reset treemap navigation to root — ECharts treemap action documented at:
    // https://echarts.apache.org/en/api.html#action.treemap.treemapRootToNode
    // Omitting targetNode navigates to the series root (level 0).
    this._chart.dispatchAction({ type: 'treemapRootToNode', seriesIndex: 0 });
  }

  /**
   * Parse 'level-colors' JSON attribute into string[][].
   * Validates that parsed value is array of arrays.
   * Returns [] on null input, empty string, or malformed JSON.
   * Pitfall 3: validates inner elements are arrays (not a flat string array).
   */
  private _parseLevelColors(raw: string | null): string[][] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Validate array of arrays — reject flat string array (Pitfall 3)
      return parsed.filter((entry: unknown) => Array.isArray(entry));
    } catch {
      return [];
    }
  }

  /**
   * Treemap has no streaming requirement.
   * Override pushData() with console.warn to prevent base class circular-buffer path
   * from overwriting hierarchical tree data with a flat array (Pitfall 4 from RESEARCH.md).
   */
  override pushData(_point: unknown): void {
    console.warn('[LuiTreemapChart] pushData() is not supported on treemap charts. Update the data property to change treemap data.');
  }
}

// Custom element registration — same guard pattern as all other chart components.
if (typeof customElements !== 'undefined' && !customElements.get('lui-treemap-chart')) {
  customElements.define('lui-treemap-chart', LuiTreemapChart);
}

declare global {
  interface HTMLElementTagNameMap {
    'lui-treemap-chart': LuiTreemapChart;
  }
}
