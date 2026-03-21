---
name: lit-ui-candlestick-chart
description: >-
  How to use <lui-candlestick-chart> — OHLC data order, bull/bear colors, volume panel, moving averages, streaming.
---

# Candlestick Chart

Financial OHLC candlestick chart built on ECharts. Supports configurable bull/bear colors, optional volume panel on a secondary axis, SMA/EMA moving average overlays, and streaming new bars via pushData().

**CRITICAL:** ECharts candlestick data order is `[open, close, low, high]` — NOT the OHLC acronym order `[open, high, low, close]`. Using the wrong order produces silently incorrect candlesticks (wicks in the wrong position, colors reversed).

## Usage

**Important:** `data` and `option` are JS properties — not HTML attributes.

```js
import '@lit-ui/charts/candlestick-chart';

const chart = document.querySelector('lui-candlestick-chart');
chart.data = [
  // [open, close, low, high] — NOT [open, high, low, close]!
  { label: '2024-01-01', ohlc: [100, 110, 95, 115], volume: 50000 },
  { label: '2024-01-02', ohlc: [110, 105, 102, 112], volume: 45000 },
  { label: '2024-01-03', ohlc: [105, 120, 103, 122], volume: 62000 },
];
```

```html
<!-- Show volume panel -->
<lui-candlestick-chart show-volume></lui-candlestick-chart>

<!-- Custom bull/bear colors -->
<lui-candlestick-chart bull-color="#00c853" bear-color="#ff1744"></lui-candlestick-chart>

<!-- MA with explicit colors -->
<lui-candlestick-chart moving-averages='[{"period":20,"color":"#f59e0b"},{"period":50,"color":"#8b5cf6","type":"ema"}]'></lui-candlestick-chart>

<!-- MA with CSS token defaults (omit color — auto-assigned --ui-chart-color-2, -3, -4...) -->
<lui-candlestick-chart moving-averages='[{"period":20},{"period":50,"type":"ema","showType":true}]'></lui-candlestick-chart>
<!-- Second MA above: legend shows "MA50 (EMA)" because showType is true -->
```

```tsx
// React
import { useRef, useEffect } from 'react';
function CandlestickChartDemo({ data }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.data = data;
  }, [data]);
  return <lui-candlestick-chart ref={ref} show-volume />;
}
```

```js
// Real-time streaming: append a new OHLC bar
chart.pushData({ label: '2024-01-04', ohlc: [120, 118, 115, 125], volume: 48000 });
```

```js
// NaN closes produce null MA gaps — they do NOT corrupt the MA window
chart.pushData({ label: '2024-01-03', ohlc: [105, NaN, 103, 122] });
// This bar's MA value will be null → rendered as a gap in the MA line
// Next valid close resumes MA calculation cleanly
```

## Data Type

```ts
// WARNING: ECharts order is [open, close, low, high]
// NOT the OHLC acronym order [open, high, low, close]
type OhlcBar = [
  open: number,
  close: number,  // ← second position, not fourth
  low: number,
  high: number    // ← fourth position, not second
];

type CandlestickBarPoint = {
  label: string;     // x-axis label — typically a date string
  ohlc: OhlcBar;     // [open, close, low, high]
  volume?: number;   // required if show-volume is set
};

type MAConfig = {
  period: number;        // number of bars in MA window (required)
  color?: string;        // optional — omit to use CSS token defaults (see Behavior Notes)
  type?: 'sma' | 'ema'; // default: 'sma'
  showType?: boolean;    // when true: legend label becomes "MA20 (EMA)" instead of "MA20"
};

// chart.data is CandlestickBarPoint[]
```

## Props

For shared props (data, option, loading, enableGl, maxPoints, enableWebGpu, renderer) see `skills/charts`.

| Prop | Attribute | Type | Default | Description |
|------|-----------|------|---------|-------------|
| `bullColor` | `bull-color` | `string \| null` | `null` → `'#26a69a'` | Rising candle fill color. |
| `bearColor` | `bear-color` | `string \| null` | `null` → `'#ef5350'` | Falling candle fill color. |
| `showVolume` | `show-volume` | `boolean` | `false` | Render a volume bar panel on a secondary y-axis below the main chart. |
| `movingAverages` | `moving-averages` | `string \| null` | `null` | JSON string of `MAConfig[]`. See data type section. |
| `enableWebGpu` | `enable-webgpu` | `boolean` | `false` | Opt-in WebGPU rendering via ChartGPU 0.3.2. When set and WebGPU is available, renders OHLC candles on a GPU-accelerated canvas beneath ECharts. MA overlay lines, volume bars, axes, tooltip, and DataZoom slider always render in ECharts regardless of renderer. Falls back to Canvas automatically on unsupported browsers. |
| `renderer` | — (read-only) | `'webgpu' \| 'webgl' \| 'canvas'` | `'canvas'` | Active renderer tier after `renderer-selected` fires. Read from the event, not synchronously — the async GPU probe may not have resolved at element creation time. |

## Methods

See `skills/charts` for `getChart()`. `pushData()` is overridden — see below.

| Method | Signature | Description |
|--------|-----------|-------------|
| `pushData(point)` | `(point: CandlestickBarPoint) => void` | Append a new OHLC bar. Uses `lazyUpdate: true` to preserve DataZoom state. |

## CSS Custom Properties

See `skills/charts` for all 17 shared `--ui-chart-*` tokens.

## Behavior Notes

- **OHLC order is [open, close, low, high]**: ECharts expects this order, NOT the OHLC acronym `[open, high, low, close]`. Wrong order produces silently incorrect candlesticks — no error is thrown.
- **JS property required**: `data` and `option` must be set as JS properties.
- **movingAverages as JSON string**: The `moving-averages` attribute accepts a JSON string (not a JS object). Pass it as `'[{"period":20,"color":"#f59e0b"}]'`. In JavaScript, use `JSON.stringify(maConfigs)`.
- **volume required for show-volume**: When `show-volume` is set, each data point should include a `volume` field. Points without volume will render as 0-height bars.
- **DataZoom synchronization**: When `show-volume` is true, DataZoom controls both the main and volume panels simultaneously.
- **pushData uses lazyUpdate**: Streaming preserves DataZoom scroll position (unlike `setOption` which resets it).
- **MA CSS token default colors**: When `MAConfig.color` is omitted, MA overlays receive colors from the CSS token sequence: `--ui-chart-color-2` (first MA), `--ui-chart-color-3` (second), `--ui-chart-color-4` (third), `--ui-chart-color-5` (fourth), cycling back to color-2 for a fifth. `--ui-chart-color-1` is reserved for the candlestick data series and is intentionally skipped.
- **NaN closes are gaps**: A `NaN` close value in a streaming bar returns `null` for that bar's MA value — rendered as a gap in the MA line. NaN is NOT propagated through the SMA/EMA window and does NOT corrupt the running sum. MA calculation resumes cleanly on the next valid close.
- **showType appends MA type to legend**: Setting `showType: true` in MAConfig changes the legend label from "MA20" to "MA20 (SMA)" or "MA20 (EMA)" depending on the `type` field.

- **LOOKS DONE BUT ISN'T — Changing movingAverages after streaming starts**: If you reassign the `moving-averages` attribute after `pushData()` has been called, the new MA config takes effect but the state machines rebuild from only the current `_ohlcBuffer` (which may have been trimmed). Historical MA values before the trim are lost. To get correct MA history after a config change, call `chart.data = []` first to perform a full reinit, then replay your history. The chart will appear correct for new bars immediately, so the corruption of historical MA is easy to miss.
- **WebGPU candles only — MA/volume stay in ECharts**: When `enable-webgpu` is set and WebGPU is active, ChartGPU renders only the OHLC candle bodies and wicks. Moving average overlay lines, volume bars, axes, legend, tooltip, and DataZoom slider all render in the ECharts canvas layer above. ECharts candlestick series is set to transparent colors internally to prevent double-rendering.
- **Bull/bear colors are init-time only on WebGPU path**: `bull-color` and `bear-color` are passed to ChartGPU at `_initWebGpuLayer()` time. If you change these attributes after chart initialization, ECharts updates its (transparent) candlestick series, but ChartGPU candle colors do not update. To apply new colors on the GPU path, recreate the chart element. (Full dynamic color wiring deferred to v10.1.)
- **DataZoom sync works with show-volume**: When `show-volume` is true (two-grid layout), the DataZoom percent-space sync to ChartGPU's `setZoomRange()` still works correctly — both ECharts grids and the ChartGPU layer are synchronized via the same `start`/`end` percent values.
