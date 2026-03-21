// packages/charts/src/shared/bar-option-builder.ts

// BAR-01: Data shape — named series with numeric value arrays.
// Category axis labels are derived from array position (ECharts default) or via
// the `categories` field which sets xAxis.data (vertical) or yAxis.data (horizontal).
export type BarChartSeries = {
  name: string;
  data: (number | null)[];
};

export type BarOptionProps = {
  // BAR-01: Stack all series using 'total' group. string, NOT boolean — ECharts requires string group name.
  stacked?: boolean;
  // BAR-01: Swap axis types: xAxis becomes value, yAxis becomes category.
  horizontal?: boolean;
  // BAR-02: Render value labels on each bar. Position adapts: 'top' vertical, 'right' horizontal.
  showLabels?: boolean;
  // BAR-02: Label position when showLabels is true.
  // 'top' (default) = above bar end for vertical, right end for horizontal.
  // 'bottom' = below bar for vertical, left end for horizontal.
  labelPosition?: 'top' | 'bottom';
  // BAR-02: Each bar gets a distinct palette color via colorBy: 'data'.
  // Best with single-series bar; multi-series results in per-bar palette cycling (expected behavior).
  colorByData?: boolean;
  // Optional axis category labels. When provided: sets xAxis.data (vertical) or yAxis.data (horizontal).
  // When omitted: ECharts uses integer indices (0, 1, 2...) as category labels.
  categories?: string[];
};

export function buildBarOption(
  series: BarChartSeries[],
  props: BarOptionProps
): Record<string, unknown> {
  const echartsSeriesArray = series.map((s) => ({
    name: s.name,
    type: 'bar' as const,
    data: s.data,
    // BAR-01: stack MUST be string 'total', never boolean.
    // stack: false or stack: undefined disables stacking; stack: true (boolean) does NOT work.
    stack: props.stacked ? 'total' : undefined,
    // BAR-02: Value labels — position adapts to orientation unless overridden by labelPosition.
    // Horizontal bars: 'top' → 'right' (bar end), 'bottom' → 'left' (bar start).
    // Vertical bars: 'top' → 'top' (above bar), 'bottom' → 'bottom' (below bar).
    label: props.showLabels
      ? {
          show: true,
          position: props.horizontal
            ? (props.labelPosition === 'bottom' ? ('left' as const) : ('right' as const))
            : ((props.labelPosition ?? 'top') as 'top' | 'bottom'),
        }
      : undefined,
    // BAR-02: colorBy: 'data' = each bar gets a distinct palette color from ThemeBridge palette.
    // Default 'series' = all bars in a series share one palette color.
    // colorBy is on SeriesOption base (shared.d.ts:7278) — valid on BarSeriesOption.
    colorBy: props.colorByData ? ('data' as const) : ('series' as const),
  }));

  // BAR-01: Horizontal orientation — swap which axis is 'category' vs 'value'.
  // BOTH axes must swap atomically. Swapping only one produces garbled bar output.
  const categoryAxisConfig = props.categories
    ? { type: 'category' as const, data: props.categories }
    : { type: 'category' as const };
  const valueAxis = { type: 'value' as const };

  return {
    legend: { show: series.length > 1 },
    tooltip: {
      trigger: 'axis' as const,
      // axisPointer shadow shows column band on hover — conventional for bar charts.
      axisPointer: { type: 'shadow' as const },
    },
    // Horizontal: yAxis is categories, xAxis is values.
    // Vertical: xAxis is categories (default), yAxis is values.
    xAxis: props.horizontal ? valueAxis : categoryAxisConfig,
    yAxis: props.horizontal ? categoryAxisConfig : valueAxis,
    series: echartsSeriesArray,
  };
}
