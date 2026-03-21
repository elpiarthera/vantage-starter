---
name: lit-ui-line-chart
description: >-
  How to use <lui-line-chart> — props, data types, streaming via pushData(point, seriesIndex?) with WebGPU GPU-accelerated rendering for 1M+ point datasets, React integration, CSS tokens.
---

# Line Chart

Multi-series time series and trend line chart built on ECharts. Supports smooth interpolation, zoom/pan controls, mark lines, and real-time streaming via pushData(point, seriesIndex?) with WebGPU GPU-accelerated rendering for 1M+ point datasets.

## Usage

**Important:** `data`, `option`, and `markLines` are JS properties — not HTML attributes.

```js
import '@lit-ui/charts/line-chart';

const chart = document.querySelector('lui-line-chart');
chart.data = [
  { name: 'Sales', data: [120, 200, 150, 80, 70, 110, 130] },
  { name: 'Revenue', data: [60, 100, 80, 40, 50, 75, 90] },
];
```

```html
<lui-line-chart smooth zoom></lui-line-chart>
```

```tsx
// React — useRef + useEffect required for all .data assignments
import { useRef, useEffect } from 'react';

function LineChartDemo({ data }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.data = data;
  }, [data]);
  return <lui-line-chart ref={ref} smooth zoom />;
}
```

```js
// Real-time streaming
chart.data = [{ name: 'Live', data: [] }];
setInterval(() => chart.pushData(Math.random() * 100), 100);
// Multiple pushData() calls in the same frame are batched via requestAnimationFrame
```

```js
// WebGPU opt-in for 1M+ point streaming (Chrome/Edge, Firefox 141+, Safari 26+)
// Set enable-webgpu attribute BEFORE data assignment
const chart = document.querySelector('lui-line-chart');
chart.setAttribute('enable-webgpu', '');
chart.data = [{ name: 'Live', data: [] }];

// Always wait for renderer-selected before reading chart.renderer
chart.addEventListener('renderer-selected', (e) => {
  console.log('Renderer:', e.detail.renderer); // 'webgpu' | 'webgl' | 'canvas'
});

setInterval(() => chart.pushData(Math.random() * 100), 10);
```

```js
// Multi-series streaming (v10.0 — STRM-03)
chart.data = [
  { name: 'CPU', data: [] },
  { name: 'Memory', data: [] },
];
chart.pushData(cpuValue);          // seriesIndex defaults to 0
chart.pushData(memoryValue, 1);    // routes to second series
// Both are batched in the same RAF frame automatically
```

```js
// Mark lines (threshold/reference lines)
chart.markLines = [
  { value: 80, label: 'Target', color: '#ef4444' },
];
// markLines is JS property only — cannot be set as HTML attribute
```

## Data Type

```ts
type LineChartSeries = {
  name: string;
  data: (number | [number | string, number] | null)[];
};

// chart.data is LineChartSeries[]
chart.data = [
  { name: 'Series A', data: [10, 20, 15, 30] },
  { name: 'Series B', data: [5, 15, 25, 20] },
];
```

## Props

For shared props (data, option, loading, enableGl) see `skills/charts`. Note: `maxPoints` default is **500,000** for line/area charts (overrides base default of 1000) — at 1000 pts/sec this allows ~8 minutes before dispose+reinit reset.

| Prop | Attribute | Type | Default | Description |
|------|-----------|------|---------|-------------|
| `smooth` | `smooth` | `boolean` | `false` | Catmull-Rom spline interpolation between data points. |
| `zoom` | `zoom` | `boolean` | `false` | DataZoom slider at bottom + mouse wheel pan. |
| `markLines` | — (JS only) | `MarkLineSpec[]` | `undefined` | Threshold/reference horizontal lines. |
| `enableWebGpu` | `enable-webgpu` | `boolean` | `false` | Opt-in WebGPU rendering via ChartGPU 0.3.2. When set and WebGPU is available (Chrome/Edge, Firefox 141+, Safari 26+), renders data pixels on a GPU-accelerated canvas beneath ECharts axes. Falls back to Canvas automatically. |
| `renderer` | — (read-only JS) | `'webgpu' \| 'webgl' \| 'canvas'` | `'canvas'` | Active renderer tier. Read ONLY after `renderer-selected` event fires. NOT a Lit `@property()` — does not trigger reactive updates. |

## Methods

See `skills/charts` for shared `pushData()` and `getChart()`.

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `renderer-selected` | `{ renderer: 'webgpu' \| 'webgl' \| 'canvas' }` | Fires during `firstUpdated()` when the renderer tier has been determined. Always wait for this event before reading `chart.renderer`. |

See `skills/charts` for shared `ui-webgl-unavailable` event.

## CSS Custom Properties

See `skills/charts` for all 17 shared `--ui-chart-*` tokens.

## Behavior Notes

- **JS property required**: `data`, `option`, and `markLines` must be set as JS properties. Use `element.data = [...]` after element is connected. In React, use a ref + useEffect.
- **Streaming uses ring buffer**: Line chart uses per-series ring buffers + RAF coalescing + Float32Array flush — do NOT call `chart.option = ...` or reassign `chart.data` after `pushData()` has started. Doing so wipes the streamed data.
- **pushData() multi-series**: `pushData(point, seriesIndex = 0)` — `seriesIndex` defaults to `0`. Pass `1` to stream to the second series without affecting others. All calls in the same animation frame are batched automatically.
- **enable-webgpu opt-in**: WebGPU is NOT auto-detected. Set `enable-webgpu` attribute to activate the GPU probe. Without it, charts use Canvas with zero async startup overhead.
- **renderer is read-only**: Do not assign `chart.renderer`. Read it after the `renderer-selected` event. It is a plain class field — not a Lit `@property()`, so assigning it has no effect.
- **maxPoints default is 500,000**: Line/area charts override the base 1000 default from BaseChartElement.
- **markLines on index-0 series only**: Mark lines are rendered on the first series only to avoid N duplicate threshold lines for N series.
