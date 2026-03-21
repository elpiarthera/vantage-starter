---
name: lit-ui-charts
description: >-
  How to use @lit-ui/charts — shared chart API, which chart type to use, React integration,
  CSS tokens, streaming with pushData(). Routes to individual chart sub-skills for chart-specific props.
---

# Charts

@lit-ui/charts provides 8 high-performance chart components built on ECharts + ECharts GL. All charts are web components with the lui- prefix. Data must be set as JS properties — not HTML attributes.

## Which Chart Type To Use

| Use Case | Component | Import |
|----------|-----------|--------|
| Time series, trend lines, multiple named series | `lui-line-chart` | `@lit-ui/charts/line-chart` |
| Filled area under a line, stacked areas | `lui-area-chart` | `@lit-ui/charts/area-chart` |
| Grouped, stacked, or horizontal bars | `lui-bar-chart` | `@lit-ui/charts/bar-chart` |
| Part-to-whole proportions, donut with center label | `lui-pie-chart` | `@lit-ui/charts/pie-chart` |
| X/Y point clouds, bubble charts, 500K+ points | `lui-scatter-chart` | `@lit-ui/charts/scatter-chart` |
| Matrix of cell values by two category axes | `lui-heatmap-chart` | `@lit-ui/charts/heatmap-chart` |
| OHLC financial candlestick with volume | `lui-candlestick-chart` | `@lit-ui/charts/candlestick-chart` |
| Hierarchical space-filling rectangle layout | `lui-treemap-chart` | `@lit-ui/charts/treemap-chart` |

## Installation

```sh
# npm install
npm install @lit-ui/charts
# CLI copy-source
npx lit-ui add line-chart   # (or area-chart, bar-chart, pie-chart, scatter-chart, heatmap-chart, candlestick-chart, treemap-chart)
```

## Usage

**CRITICAL:** `data`, `option`, `xCategories`, and `yCategories` are JS properties — they cannot be set as HTML attributes. Always assign via element reference.

```js
import '@lit-ui/charts/line-chart';

const chart = document.querySelector('lui-line-chart');
chart.data = [
  { name: 'Sales', data: [120, 200, 150, 80, 70, 110, 130] },
];
```

```tsx
// React — useRef + useEffect required for ALL .data assignments
import { useRef, useEffect } from 'react';

function LineChartDemo({ data }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.data = data;
  }, [data]);
  return <lui-line-chart ref={ref} smooth zoom />;
}
```

## Shared Props (All 8 Charts)

| Prop | Attribute | Type | Default | Description |
|------|-----------|------|---------|-------------|
| `data` | — (JS only) | chart-specific | `undefined` | Chart data. Must be JS property. |
| `option` | — (JS only) | `EChartsOption` | `undefined` | Raw ECharts option passthrough for advanced use. |
| `loading` | `loading` | `boolean` | `false` | Show ECharts loading skeleton. |
| `enableGl` | `enable-gl` | `boolean` | `false` | Opt-in WebGL via echarts-gl (meaningful on scatter chart). |
| `maxPoints` | `max-points` | `number` | `1000` | Circular buffer capacity for streaming via pushData(). Note: lui-line-chart and lui-area-chart override this to 500,000. |
| `enableWebGpu` | `enable-webgpu` | `boolean` | `false` | Opt-in WebGPU detection. All charts inherit this from BaseChartElement. Line, area, and candlestick charts activate ChartGPU rendering when WebGPU is available. Other chart types fire `renderer-selected` but remain on Canvas. |

## Shared Methods (All 8 Charts)

| Method | Signature | Description |
|--------|-----------|-------------|
| `pushData(point)` | `(point: unknown) => void` | Stream one data point. RAF-coalesced. **Not supported on treemap** (logs console.warn). |
| `getChart()` | `() => EChartsType \| undefined` | Direct ECharts instance for event binding and advanced customization. |

**Note:** `lui-line-chart` and `lui-area-chart` extend `pushData` with an optional `seriesIndex` parameter: `pushData(point, seriesIndex = 0)`. See individual chart skills for the full signature.

## Shared Events (All 8 Charts)

| Event | Detail | Description |
|-------|--------|-------------|
| `ui-webgl-unavailable` | `{ reason: string }` | Fires when `enable-gl` is set but WebGL is unavailable. Chart falls back to Canvas automatically. |
| `renderer-selected` | `{ renderer: 'webgpu' \| 'webgl' \| 'canvas' }` | Fires in `firstUpdated()` when the renderer tier is determined. All 8 charts fire this when `enable-webgpu` is set. Line, area, and candlestick charts activate ChartGPU rendering; other chart types fall through to Canvas. |

## Shared CSS Custom Properties (All 8 Charts)

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-chart-height` | `300px` | Chart host element height. |
| `--ui-chart-color-1` | `#3b82f6` | Series 1 color. |
| `--ui-chart-color-2` | `#8b5cf6` | Series 2 color. |
| `--ui-chart-color-3` | `#10b981` | Series 3 color. |
| `--ui-chart-color-4` | `#f59e0b` | Series 4 color. |
| `--ui-chart-color-5` | `#ef4444` | Series 5 color. |
| `--ui-chart-color-6` | `#06b6d4` | Series 6 color. |
| `--ui-chart-color-7` | `#f97316` | Series 7 color. |
| `--ui-chart-color-8` | `#84cc16` | Series 8 color. |
| `--ui-chart-grid-line` | `#e5e7eb` | Grid line color. |
| `--ui-chart-axis-label` | `#6b7280` | Axis label text color. |
| `--ui-chart-axis-line` | `#d1d5db` | Axis line color. |
| `--ui-chart-tooltip-bg` | `#ffffff` | Tooltip background. |
| `--ui-chart-tooltip-border` | `#e5e7eb` | Tooltip border color. |
| `--ui-chart-tooltip-text` | `#111827` | Tooltip text color. |
| `--ui-chart-legend-text` | `#374151` | Legend text color. |
| `--ui-chart-font-family` | `system-ui, sans-serif` | Font family for all chart text. |

## Streaming with pushData()

```js
const chart = document.querySelector('lui-line-chart');
chart.data = [{ name: 'Live', data: [] }];

setInterval(() => {
  chart.pushData(Math.random() * 100);
  // Multiple pushData() calls in the same animation frame are batched automatically
}, 100);
```

```js
// For line-chart and area-chart only: multi-series seriesIndex support
// chart.pushData(value, 1) routes to the second series
// See skills/line-chart and skills/area-chart for full multi-series API
```

Supported on: line, area, bar, pie, scatter, heatmap, candlestick.
NOT supported on: treemap (pushData() is a no-op with console.warn — reassign .data instead).

## Dark Mode

Charts respect the `.dark` class on `document.documentElement` — same pattern as all other LitUI components. All 17 CSS tokens update automatically when dark mode toggles. Override any token to retheme.

## Sub-Skills

Load the specific sub-skill for chart-specific props, data type definitions, and behavior notes:

- `skills/line-chart` — lui-line-chart
- `skills/area-chart` — lui-area-chart
- `skills/bar-chart` — lui-bar-chart
- `skills/pie-chart` — lui-pie-chart
- `skills/scatter-chart` — lui-scatter-chart
- `skills/heatmap-chart` — lui-heatmap-chart
- `skills/candlestick-chart` — lui-candlestick-chart
- `skills/treemap-chart` — lui-treemap-chart
