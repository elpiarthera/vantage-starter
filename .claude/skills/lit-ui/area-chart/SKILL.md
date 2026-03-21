---
name: lit-ui-area-chart
description: >-
  How to use <lui-area-chart> — props, data types, stacked areas, streaming via pushData(point, seriesIndex?) with WebGPU GPU-accelerated rendering for 1M+ point datasets, React integration.
---

# Area Chart

Filled area chart built on ECharts. Extends the line chart with area fill (areaStyle). Supports stacking, smooth curves, zoom, and real-time streaming via pushData(point, seriesIndex?) with WebGPU GPU-accelerated rendering for 1M+ point datasets.

## Usage

**Important:** `data` and `option` are JS properties — not HTML attributes.

```js
import '@lit-ui/charts/area-chart';

const chart = document.querySelector('lui-area-chart');
chart.data = [
  { name: 'Downloads', data: [120, 200, 150, 80, 70, 110, 130] },
  { name: 'Installs', data: [60, 100, 80, 40, 50, 75, 90] },
];
```

```html
<lui-area-chart smooth stacked zoom></lui-area-chart>
```

```tsx
// React
import { useRef, useEffect } from 'react';
function AreaChartDemo({ data }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.data = data;
  }, [data]);
  return <lui-area-chart ref={ref} smooth stacked />;
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
const chart = document.querySelector('lui-area-chart');
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

## Data Type

Same as line chart:
```ts
type LineChartSeries = {
  name: string;
  data: (number | [number | string, number] | null)[];
};
```
Area chart reuses the same ECharts module as line — area is a line series with `areaStyle` applied.

## Props

For shared props (data, option, loading, enableGl) see `skills/charts`. Note: `maxPoints` default is **500,000** for line/area charts (overrides base default of 1000) — at 1000 pts/sec this allows ~8 minutes before dispose+reinit reset.

| Prop | Attribute | Type | Default | Description |
|------|-----------|------|---------|-------------|
| `smooth` | `smooth` | `boolean` | `false` | Catmull-Rom spline interpolation. |
| `stacked` | `stacked` | `boolean` | `false` | Stack all series (passes `stack: 'total'` to ECharts). |
| `zoom` | `zoom` | `boolean` | `false` | DataZoom slider + mouse wheel pan. |
| `labelPosition` | `label-position` | `'top' \| 'bottom' \| ''` | `''` | Data point labels. `''` = no labels. |
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

- **JS property required**: `data` and `option` must be set as JS properties.
- **Streaming uses ring buffer**: Same as line chart — do NOT reassign `chart.data` after streaming has started.
- **pushData() multi-series**: `pushData(point, seriesIndex = 0)` — `seriesIndex` defaults to `0`. Pass `1` to stream to the second series without affecting others. All calls in the same animation frame are batched automatically.
- **enable-webgpu opt-in**: WebGPU is NOT auto-detected. Set `enable-webgpu` attribute to activate the GPU probe. Without it, charts use Canvas with zero async startup overhead.
- **renderer is read-only**: Do not assign `chart.renderer`. Read it after the `renderer-selected` event. It is a plain class field — not a Lit `@property()`, so assigning it has no effect.
- **maxPoints default is 500,000**: Line/area charts override the base 1000 default from BaseChartElement.
- **stacked translates to string**: `stacked` boolean prop passes `stack: 'total'` string internally — ECharts requires a string group name to activate stacking, not a boolean.
- **labelPosition empty string**: `labelPosition: ''` means no labels. `'top'` renders labels above fill area.
