// packages/charts/src/shared/candlestick-option-builder.ts

/**
 * OhlcBar — ECharts candlestick data tuple.
 *
 * WARNING: The order is [open, close, low, high] — NOT the OHLC acronym order [open, high, low, close].
 * ECharts CandlestickChart expects: index 0 = open, index 1 = close, index 2 = low, index 3 = high.
 * Swapping low and high is a silent rendering error with no runtime exception.
 */
export type OhlcBar = [number, number, number, number]; // [open, close, low, high]

export type MAConfig = {
  period: number;
  /** MA-02: Optional — component assigns default color from CSS token if omitted. */
  color?: string;
  /** Defaults to 'sma' when not specified. */
  type?: 'sma' | 'ema';
  /** MA-04: When true, appends type suffix to legend label — e.g., "MA20 (EMA)". */
  showType?: boolean;
};

export type CandlestickBarPoint = {
  /** x-axis category label (typically a timestamp string) */
  label: string;
  /** [open, close, low, high] — ECharts candlestick data order */
  ohlc: OhlcBar;
  /** Optional volume value for the volume panel */
  volume?: number;
};

export type CandlestickOptionProps = {
  /** Bull (rising) candle fill and wick color. ECharts: itemStyle.color. Default: '#26a69a' */
  bullColor?: string;
  /** Bear (falling) candle fill and wick color. ECharts: itemStyle.color0. Default: '#ef5350' */
  bearColor?: string;
  /** Show a volume bar panel below the candlestick grid. Default: false */
  showVolume?: boolean;
  /** Moving average overlay configs. Default: [] */
  movingAverages?: MAConfig[];
  /** Pre-computed MA value arrays (one per MAConfig entry). When provided, skips O(n) _computeSMA/_computeEMA. */
  maValueArrays?: (number | null)[][];
  /** Pre-resolved MA colors (one per MAConfig entry). When provided, skips token resolution in builder. */
  resolvedMAColors?: string[];
};

/**
 * Compute Simple Moving Average.
 * Returns null for warm-up indices (0..period-2), then sliding window average.
 */
function _computeSMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    return slice.reduce((sum, v) => sum + v, 0) / period;
  });
}

/**
 * Compute Exponential Moving Average.
 * Returns null for warm-up indices (0..period-2).
 * Seeds with SMA of first `period` closes, then applies EMA formula:
 * ema[i] = close[i] * k + ema[i-1] * (1 - k), where k = 2 / (period + 1)
 */
function _computeEMA(closes: number[], period: number): (number | null)[] {
  if (closes.length < period) return closes.map(() => null);

  const k = 2 / (period + 1);

  // Seed: SMA of first `period` closes
  const seed = closes.slice(0, period).reduce((sum, v) => sum + v, 0) / period;

  const result: (number | null)[] = closes.map(() => null);
  result[period - 1] = seed;

  for (let i = period; i < closes.length; i++) {
    const prev = result[i - 1] as number;
    result[i] = closes[i] * k + prev * (1 - k);
  }

  return result;
}

/**
 * MA-04: Resolve the legend/series name for a moving average config.
 * Returns "MA{period}" by default. When showType is true, appends the type suffix:
 * "MA20 (EMA)" or "MA20 (SMA)".
 */
function _maLegendName(ma: MAConfig): string {
  const base = `MA${ma.period}`;
  if (!ma.showType) return base;
  const typeSuffix = (ma.type ?? 'sma').toUpperCase();
  return `${base} (${typeSuffix})`;
}

/**
 * Build an ECharts option object for a candlestick chart.
 *
 * - showVolume=false: single-grid layout with candlestick + MA overlays
 * - showVolume=true: two-grid layout (candlestick top, volume bottom) with synchronized DataZoom
 *
 * Bull/bear colors use ECharts-native itemStyle.color / itemStyle.color0.
 * NEVER use upColor/downColor — these do not exist in EChartsItemStyleOption.
 */
export function buildCandlestickOption(
  bars: CandlestickBarPoint[],
  props: CandlestickOptionProps
): Record<string, unknown> {
  // Apply defaults
  const bullColor = props.bullColor ?? '#26a69a';
  const bearColor = props.bearColor ?? '#ef5350';
  const showVolume = props.showVolume ?? false;
  const movingAverages = props.movingAverages ?? [];
  const { maValueArrays, resolvedMAColors } = props;

  // Derive labels and OHLC data arrays
  const labels = bars.map((b) => b.label);
  const ohlcData: OhlcBar[] = bars.map((b) => b.ohlc);

  // Build candlestick series
  // itemStyle.color = bull fill+wick, itemStyle.color0 = bear fill+wick (ECharts CandlestickItemStyleOption)
  // barMaxWidth: 40 — prevents overly wide candles on small datasets (e.g. 5 bars on a 1200px canvas).
  const candlestickSeries = {
    name: 'Candlestick',
    type: 'candlestick',
    xAxisIndex: 0,
    yAxisIndex: 0,
    data: ohlcData,
    barMaxWidth: 40,
    itemStyle: {
      color: bullColor,
      color0: bearColor,
      borderColor: bullColor,
      borderColor0: bearColor,
    },
  };

  // Build MA line series — bound to main price panel (xAxisIndex: 0, yAxisIndex: 0)
  // close is at ohlc index 1: [open, close, low, high]
  const closes = bars.map((b) => b.ohlc[1]);

  const maSeries = movingAverages.map((ma, i) => {
    const computed =
      (maValueArrays && maValueArrays[i]) ??
      ((ma.type ?? 'sma') === 'ema'
        ? _computeEMA(closes, ma.period)
        : _computeSMA(closes, ma.period));

    const color = (resolvedMAColors && resolvedMAColors[i]) ?? ma.color ?? '#888888';
    const name = _maLegendName(ma);

    return {
      name,
      type: 'line',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: computed,
      smooth: true,
      lineStyle: { color, width: 1.5, opacity: 0.85 },
      symbol: 'none',
      tooltip: { show: true },
    };
  });

  const legendData = ['Candlestick', ...movingAverages.map((m) => _maLegendName(m))];
  const tooltip = { trigger: 'axis', axisPointer: { type: 'cross' } };
  const legend = { data: legendData };

  if (!showVolume) {
    // Single-grid layout
    // boundaryGap: true (category default) — adds half-interval padding so the first and last
    // candle are not flush with the axis edges, preventing clipping of edge labels.
    // grid.right: '8%' — reserves space so wide date labels (e.g. "2024-01-05") are not clipped
    // at the right edge of the chart.
    return {
      tooltip,
      legend,
      grid: [{ containLabel: true, right: '8%' }],
      xAxis: [{ type: 'category', data: labels, gridIndex: 0, boundaryGap: true }],
      yAxis: [{ scale: true, gridIndex: 0 }],
      dataZoom: [
        { type: 'inside', xAxisIndex: [0] },
        { type: 'slider', xAxisIndex: [0], bottom: 2 },
      ],
      series: [candlestickSeries, ...maSeries],
    };
  }

  // Two-grid layout: candlestick (top) + volume (bottom)
  // DataZoom MUST bind xAxisIndex: [0, 1] to synchronize both panels (Pitfall 3 from RESEARCH.md)
  const volumeBarSeries = {
    type: 'bar',
    xAxisIndex: 1,
    yAxisIndex: 1,
    data: bars.map((b) => b.volume ?? 0),
    barWidth: '60%',
    itemStyle: { color: 'rgba(150,150,150,0.5)' },
  };

  return {
    tooltip,
    legend,
    grid: [
      { top: '5%', height: '60%', containLabel: true },   // grid[0]: candlestick panel
      { top: '73%', height: '22%', containLabel: true },  // grid[1]: volume panel
    ],
    xAxis: [
      {
        type: 'category',
        data: labels,
        gridIndex: 0,
        boundaryGap: true,
        axisLine: { onZero: false },
      },
      {
        type: 'category',
        data: labels,
        gridIndex: 1,
        boundaryGap: true,
        axisLine: { onZero: false },
      },
    ],
    yAxis: [
      { scale: true, gridIndex: 0 },
      { scale: true, gridIndex: 1 },
    ],
    // CRITICAL: xAxisIndex: [0, 1] synchronizes both x-axes so pan/zoom on candlestick
    // also scrolls the volume panel (Pitfall 3 from RESEARCH.md).
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1] },
      { type: 'slider', xAxisIndex: [0, 1], bottom: 2 },
    ],
    series: [candlestickSeries, volumeBarSeries, ...maSeries],
  };
}
