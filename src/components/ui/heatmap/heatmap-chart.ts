/**
 * LuiHeatmapChart — Heatmap chart component extending BaseChartElement.
 *
 * HEAT-01: Category arrays (xCategories, yCategories) set via JS property (attribute: false)
 * HEAT-01: Color range parsed from attribute 'color-range' as raw string (no type converter)
 * HEAT-02: pushData() overrides base — uses cell-update semantics with _pendingCells Map + RAF coalescing
 *
 * STRM-04 compliance: pushData() is fully overridden — base streaming path is bypassed entirely.
 * The base _streamingMode = 'buffer' default is irrelevant because pushData() never calls super.pushData().
 */

import { property } from 'lit/decorators.js';
import type { PropertyValues } from 'lit';
import { BaseChartElement } from '../base/base-chart-element.js';
import { registerHeatmapModules } from './heatmap-registry.js';
import { buildHeatmapOption, type HeatmapCell } from '../shared/heatmap-option-builder.js';

/**
 * Module-level helper — NOT exported.
 * Parses the raw 'color-range' attribute string into a [minColor, maxColor] tuple.
 * Returns undefined if input is null/empty or has fewer than 2 comma-separated parts.
 */
function _parseColorRange(raw: string | null): [string, string] | undefined {
  if (!raw) return undefined;
  const parts = raw.split(',').map((s) => s.trim());
  if (parts.length >= 2) return [parts[0], parts[1]];
  return undefined;
}

export class LuiHeatmapChart extends BaseChartElement {
  // NO constructor override — base _streamingMode = 'buffer' is irrelevant;
  // pushData() is overridden entirely so the base streaming path is never reached.

  // HEAT-01: Category arrays — attribute: false (arrays cannot be safely serialized as HTML attributes;
  // project convention per REQUIREMENTS.md Out of Scope: "data='[...]' attribute serialization").
  // Developers MUST set these via JavaScript property assignment.
  @property({ attribute: false }) xCategories: string[] = [];
  @property({ attribute: false }) yCategories: string[] = [];

  // HEAT-01: Color range — arrives as raw string from HTML (e.g., '#313695,#d73027').
  // No type converter — mirrors innerRadius pattern from LuiPieChart (Phase 91 decision).
  // Parsed in _applyData() via _parseColorRange().
  @property({ attribute: 'color-range' }) colorRange: string | null = null;

  // Component-level authoritative cell matrix — kept in sync with this.data.
  // pushData() updates cells in-place via _pendingCells Map.
  private _cellData: HeatmapCell[] = [];

  // Pending cell updates: key = "xIdx,yIdx", value = new numeric value.
  // Last write within same RAF frame wins — deduplicates rapid updates to the same cell.
  private _pendingCells = new Map<string, number>();

  // Component's own RAF handle — must be cancelled in disconnectedCallback() (Pitfall 3).
  // The BASE CLASS cancels its own _rafId but has no knowledge of _cellRafId.
  private _cellRafId?: number;

  protected override async _registerModules(): Promise<void> {
    await registerHeatmapModules();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed); // base handles this.option passthrough and this.loading state
    if (!this._chart) return;
    const heatmapProps = ['data', 'xCategories', 'yCategories', 'colorRange'] as const;
    if (heatmapProps.some((k) => changed.has(k))) {
      this._applyData();
    }
  }

  protected override _applyData(): void {
    if (!this._chart) return;
    // Sync _cellData from this.data so pushData() cell lookups start from current state.
    this._cellData = this.data ? [...(this.data as HeatmapCell[])] : [];
    const parsed = _parseColorRange(this.colorRange);
    const option = buildHeatmapOption(this._cellData, {
      xCategories: this.xCategories,
      yCategories: this.yCategories,
      colorRange: parsed,
    });
    // notMerge: false — merge with any option prop overrides from the base class.
    // NEVER use notMerge: true — it wipes the VisualMap component on each data update.
    this._chart.setOption(option, { notMerge: false });
  }

  /**
   * HEAT-02: Cell-update streaming — overrides base pushData() entirely.
   *
   * Override base implementation — heatmap uses cell-update semantics, not rolling buffer.
   * NEVER call super.pushData() — it would add point to _circularBuffer and call
   * setOption({ series: [{ data: circularBuffer }] }) on RAF flush, overwriting _cellData
   * with only the streaming points. See RESEARCH.md Pitfall 2.
   *
   * Last write for a given [xi,yi] key in same RAF frame wins — deduplicates rapid updates.
   */
  override pushData(point: unknown): void {
    const [xi, yi, val] = point as HeatmapCell;
    // Last write for a given [xi,yi] key in same RAF frame wins.
    this._pendingCells.set(`${xi},${yi}`, val);
    if (this._cellRafId === undefined) {
      this._cellRafId = requestAnimationFrame(() => {
        this._flushCellUpdates();
        this._cellRafId = undefined;
      });
    }
  }

  /**
   * Flush pending cell updates to ECharts in a single setOption call.
   *
   * Updates _cellData in-place (or adds new cells), then flushes the full matrix.
   * Passing the complete _cellData (not just deltas) ensures ECharts has the
   * authoritative state — required for correct VisualMap color mapping.
   */
  private _flushCellUpdates(): void {
    if (!this._chart || this._pendingCells.size === 0) return;
    for (const [key, val] of this._pendingCells) {
      const [xi, yi] = key.split(',').map(Number);
      const idx = this._cellData.findIndex((c) => c[0] === xi && c[1] === yi);
      if (idx >= 0) {
        this._cellData[idx] = [xi, yi, val]; // update existing cell in-place
      } else {
        this._cellData.push([xi, yi, val]); // add new cell
      }
    }
    this._pendingCells.clear();
    // Flush full _cellData — not just pending cells — so ECharts has the complete matrix.
    this._chart.setOption(
      { series: [{ data: this._cellData }] },
      { lazyUpdate: true } as object
    );
  }

  /**
   * Cancel component's own RAF before base class disposes the chart.
   * Base class cancels its own _rafId but has no knowledge of _cellRafId.
   * Failing to cancel causes post-disposal setOption errors (RESEARCH.md Pitfall 3).
   */
  override disconnectedCallback(): void {
    // Cancel component's own RAF before base class disposes the chart.
    if (this._cellRafId !== undefined) {
      cancelAnimationFrame(this._cellRafId);
      this._cellRafId = undefined;
    }
    super.disconnectedCallback();
  }
}

// Custom element registration — same guard pattern as all other @lit-ui packages.
if (typeof customElements !== 'undefined' && !customElements.get('lui-heatmap-chart')) {
  customElements.define('lui-heatmap-chart', LuiHeatmapChart);
}

declare global {
  interface HTMLElementTagNameMap {
    'lui-heatmap-chart': LuiHeatmapChart;
  }
}
