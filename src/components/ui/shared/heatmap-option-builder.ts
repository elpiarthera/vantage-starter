// packages/charts/src/shared/heatmap-option-builder.ts

// HEAT-01: Data shape — [xIdx, yIdx, value] tuple.
// xIdx and yIdx are integer positions into xCategories/yCategories arrays.
// value is the numeric intensity mapped through the visualMap color scale.
export type HeatmapCell = [number, number, number]; // [xIdx, yIdx, value]

export type HeatmapOptionProps = {
  xCategories: string[];
  yCategories: string[];
  // Two-color gradient endpoints [minColor, maxColor]. Defaults: ['#313695', '#d73027'] (blue-to-red).
  colorRange?: [string, string];
  // VisualMap value domain. Defaults: [0, 100]. Pin these to prevent color drift during streaming (Pitfall 6).
  min?: number;
  max?: number;
};

export function buildHeatmapOption(
  data: HeatmapCell[],
  props: HeatmapOptionProps
): Record<string, unknown> {
  // HEAT-01: Extract color range — default blue-to-red gradient.
  const [minColor, maxColor] = props.colorRange ?? ['#313695', '#d73027'];

  // HEAT-01: Pin min/max explicitly to prevent color drift during pushData() streaming.
  // Auto-range causes visualMap to rescale colors on every setOption call.
  const minVal = props.min ?? 0;
  const maxVal = props.max ?? 100;

  return {
    grid: { containLabel: true },

    // HEAT-01: type: 'category' on BOTH axes — NOT 'value'.
    // Heatmap indices are integer positions into category arrays.
    // splitArea: { show: true } creates visible cell border grid.
    // Omitting splitArea causes cells to blend without borders.
    xAxis: {
      type: 'category',
      data: props.xCategories,
      splitArea: { show: true },
    },
    yAxis: {
      type: 'category',
      data: props.yCategories,
      splitArea: { show: true },
    },

    // HEAT-01: visualMap min/max MUST be set explicitly — auto-range causes
    // color drift during pushData() streaming (Pitfall 6 from RESEARCH.md).
    visualMap: {
      type: 'continuous',
      min: minVal,
      max: maxVal,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: { color: [minColor, maxColor] },
    },

    tooltip: { trigger: 'item' },

    series: [
      {
        type: 'heatmap',
        // HEAT-01: coordinateSystem: 'cartesian2d' explicitly required.
        // Heatmap supports cartesian2d, geo, and calendar — must specify Cartesian mode.
        coordinateSystem: 'cartesian2d',
        data,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.5)',
          },
        },
      },
    ],
  };
}
