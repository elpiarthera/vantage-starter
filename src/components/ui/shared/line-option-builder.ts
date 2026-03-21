// packages/charts/src/shared/line-option-builder.ts

export type LineChartSeries = {
  name: string;
  data: (number | [number | string, number] | null)[];
};

export type MarkLineSpec = {
  value: number;
  label?: string;
  color?: string;
};

export type LineOptionProps = {
  smooth?: boolean | number;
  zoom?: boolean;
  markLines?: MarkLineSpec[];
  stacked?: boolean;        // area chart only — ignored in 'line' mode
  opacity?: number;         // area chart only — default 0.6
  // AREA-LABEL: When set, show data-point labels at this position (area mode only).
  // Omitted or '' = no labels (default). Valid values match ECharts line label position.
  labelPosition?: 'top' | 'bottom';
};

export function buildLineOption(
  series: LineChartSeries[],
  props: LineOptionProps,
  mode: 'line' | 'area'
): Record<string, unknown> {
  const isArea = mode === 'area';

  const echartsSeriesArray = series.map((s, i) => ({
    name: s.name,
    type: 'line' as const,
    data: s.data,
    smooth: props.smooth ?? false,
    sampling: 'lttb' as const,      // STRM-04: native LTTB decimation — activates at high point counts
    large: true,                     // STRM-01: large dataset rendering optimization
    largeThreshold: 2000,            // STRM-01: switch to large path above 2000 points
    // Area mode: add areaStyle with semi-transparency for readability
    areaStyle: isArea ? { opacity: props.opacity ?? 0.6 } : undefined,
    // Stacking: all series share the same group string — boolean true would NOT work (ECharts pitfall)
    stack: isArea && props.stacked ? 'total' : undefined,
    // AREA-LABEL: Show data-point labels when labelPosition is explicitly set in area mode.
    label: isArea && props.labelPosition ? { show: true, position: props.labelPosition } : undefined,
    // markLine only on the first series to prevent duplicate threshold lines per series
    markLine:
      i === 0 && props.markLines?.length
        ? {
            silent: false,
            data: props.markLines.map((ml) => ({
              yAxis: ml.value,
              name: ml.label ?? '',
              lineStyle: ml.color ? { color: ml.color } : undefined,
            })),
          }
        : undefined,
  }));

  const option: Record<string, unknown> = {
    legend: { show: series.length > 1 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', boundaryGap: false },
    yAxis: { type: 'value' },
    series: echartsSeriesArray,
  };

  if (props.zoom) {
    option['dataZoom'] = [
      { type: 'inside', xAxisIndex: 0 },
      { type: 'slider', xAxisIndex: 0, bottom: 0 },
    ];
  }

  return option;
}
