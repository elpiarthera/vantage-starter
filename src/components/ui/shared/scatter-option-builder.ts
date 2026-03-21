// packages/charts/src/shared/scatter-option-builder.ts

// SCAT-01: [x, y] for scatter, [x, y, size] for bubble.
// The third element (size) is only read when bubble mode is enabled.
export type ScatterPoint = [number, number] | [number, number, number];

export type ScatterOptionProps = {
  // SCAT-01: When true, reads value[2] as symbol size (Canvas only).
  // In GL mode, per-point size callbacks are not supported — a fixed size is used instead.
  bubble?: boolean;
  // SCAT-02: When true, emits type: 'scatterGL'. Default: false (Canvas).
  useGl?: boolean;
  // Fixed symbol size when bubble is false, or when bubble + useGl is true. Default: 10.
  symbolSize?: number;
};

/**
 * Build an ECharts option object for scatter or bubble charts.
 *
 * Series type selection:
 * - useGl: false → type: 'scatter' (Canvas renderer)
 * - useGl: true  → type: 'scatterGL' (WebGL renderer, requires echarts-gl)
 *
 * Symbol size selection:
 * - bubble && !useGl → callback reading value[2] per-point (Canvas supports this)
 * - bubble && useGl  → fixed size (scatterGL does not support per-point callbacks)
 * - !bubble          → fixed size (props.symbolSize ?? 10)
 */
export function buildScatterOption(
  data: ScatterPoint[],
  props: ScatterOptionProps
): Record<string, unknown> {
  const useGl = props.useGl ?? false;
  const bubble = props.bubble ?? false;
  const fixedSize = props.symbolSize ?? 10;

  // Determine symbolSize based on bubble + useGl flags
  let symbolSize: unknown;
  if (bubble && !useGl) {
    // SCAT-01: Canvas scatter supports per-point size via callback.
    // value[2] is the bubble radius; fall back to 10 if not provided.
    symbolSize = (value: number[]) => value[2] ?? 10;
  } else if (bubble && useGl) {
    // SCAT-02: scatterGL renders on GPU — per-point size callbacks are not supported.
    // Emit a dev warning so consumers know why their bubble sizes are fixed.
    console.warn(
      '[LuiScatterChart] bubble symbolSize callback not supported in GL mode; using fixed size.'
    );
    symbolSize = fixedSize;
  } else {
    symbolSize = fixedSize;
  }

  const series: Record<string, unknown> = {
    type: useGl ? 'scatterGL' : 'scatter',
    data,
    symbolSize,
  };

  // SCAT-02: GL-specific series options for high-performance rendering.
  // progressive/progressiveThreshold enable chunked rendering for large datasets.
  // blendMode: 'source-over' ensures correct alpha compositing on the WebGL canvas.
  if (useGl) {
    series['progressive'] = 1e5;
    series['progressiveThreshold'] = 1e5;
    series['blendMode'] = 'source-over';
  }

  const option: Record<string, unknown> = {
    grid: { containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
    tooltip: { trigger: 'item' },
    series: [series],
  };

  // SCAT-01: Custom tooltip formatter for bubble Canvas mode — shows coordinates + size.
  // Only applied when bubble is meaningful (Canvas only; GL uses default tooltip).
  if (bubble && !useGl) {
    option['tooltip'] = {
      trigger: 'item',
      formatter: (params: unknown) => {
        const val = (params as Record<string, unknown>)['value'] as number[];
        return `(${val[0]}, ${val[1]}) size: ${val[2]}`;
      },
    };
  }

  return option;
}
