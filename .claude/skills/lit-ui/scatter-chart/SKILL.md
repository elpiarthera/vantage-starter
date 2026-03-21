---
name: lit-ui-scatter-chart
description: >-
  How to use <lui-scatter-chart> — bubble mode, WebGL rendering for 500K+ points, ScatterPoint type, streaming.
---

# Scatter Chart

Scatter and bubble chart built on ECharts. Supports 2D point cloud (Canvas) and 500K+ point WebGL rendering via echarts-gl. Bubble mode adds a third dimension for point size.

## Usage

**Important:** `data` and `option` are JS properties — not HTML attributes.

```js
import '@lit-ui/charts/scatter-chart';

const chart = document.querySelector('lui-scatter-chart');
chart.data = [
  [10.0, 8.04],
  [8.0, 6.95],
  [13.0, 7.58],
];
```

```html
<!-- Standard scatter -->
<lui-scatter-chart></lui-scatter-chart>

<!-- Bubble mode: data[2] drives point size -->
<lui-scatter-chart bubble></lui-scatter-chart>

<!-- WebGL mode for 500K+ points -->
<lui-scatter-chart enable-gl></lui-scatter-chart>
```

```tsx
// React
import { useRef, useEffect } from 'react';
function ScatterChartDemo({ data }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.data = data;
  }, [data]);
  return <lui-scatter-chart ref={ref} bubble />;
}
```

```js
// WebGL fallback handling
const chart = document.querySelector('lui-scatter-chart');
chart.addEventListener('ui-webgl-unavailable', (e) => {
  console.warn('WebGL not available:', e.detail.reason);
  // Chart automatically falls back to Canvas
});
```

## Data Type

```ts
type ScatterPoint = [number, number] | [number, number, number];
// [x, y] for 2D scatter
// [x, y, size] for bubble mode — size drives symbol radius (Canvas only)

// chart.data is ScatterPoint[]
chart.data = [
  [10.0, 8.04],
  [8.0, 6.95],
  [13.0, 7.58, 30], // bubble: 30 = point size (Canvas only)
];
```

## Props

For shared props (data, option, loading, enableGl, maxPoints) see `skills/charts`.

| Prop | Attribute | Type | Default | Description |
|------|-----------|------|---------|-------------|
| `bubble` | `bubble` | `boolean` | `false` | Use `value[2]` as symbol size. Canvas only — see behavior note. |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `ui-webgl-unavailable` | `{ reason: string }` | Fires when `enable-gl` is set but WebGL is unavailable. Chart falls back to Canvas. |

## CSS Custom Properties

See `skills/charts` for all 17 shared `--ui-chart-*` tokens.

## Behavior Notes

- **JS property required**: `data` and `option` must be set as JS properties.
- **bubble + enable-gl = fixed size**: When both `bubble` and `enable-gl` are set simultaneously, point size is fixed (GPU rendering cannot support per-point size callbacks). `bubble` mode size variation only works in Canvas rendering (without `enable-gl`).
- **WebGL bundle impact**: Setting `enable-gl` lazy-loads echarts-gl (approximately +200KB gzipped). This load only happens once. If WebGL is unavailable, the chart falls back to Canvas automatically and fires `ui-webgl-unavailable`.
- **Streaming**: Uses circular buffer (not appendData) even in GL mode. Call `pushData([x, y])` to append.
- **500K+ point performance**: Use `enable-gl` for datasets with 100K+ points. Canvas mode degrades above ~50K points.
