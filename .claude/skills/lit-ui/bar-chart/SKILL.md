---
name: lit-ui-bar-chart
description: >-
  How to use <lui-bar-chart> — grouped/stacked/horizontal bars, value labels, colorByData, streaming.
---

# Bar Chart

Grouped, stacked, and horizontal bar chart built on ECharts. Supports value labels on bars, per-bar palette coloring, and streaming data updates.

## Usage

**Important:** `data` and `option` are JS properties — not HTML attributes.

```js
import '@lit-ui/charts/bar-chart';

const chart = document.querySelector('lui-bar-chart');
chart.data = [
  { name: 'Q1', data: [120, 80, 95] },
  { name: 'Q2', data: [150, 110, 130] },
];
```

```html
<lui-bar-chart stacked show-labels></lui-bar-chart>
<lui-bar-chart horizontal color-by-data></lui-bar-chart>
```

```tsx
// React
import { useRef, useEffect } from 'react';
function BarChartDemo({ data }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.data = data;
  }, [data]);
  return <lui-bar-chart ref={ref} stacked show-labels />;
}
```

```js
// With category axis labels — use option prop
import { buildBarOption } from '@lit-ui/charts/bar-chart';
chart.option = buildBarOption(data, { categories: ['Jan', 'Feb', 'Mar'] });
```

## Data Type

```ts
type BarChartSeries = {
  name: string;
  data: (number | null)[];
};

// chart.data is BarChartSeries[]
chart.data = [
  { name: 'Product A', data: [300, 450, 200, 380] },
  { name: 'Product B', data: [250, 300, 175, 420] },
];
```

## Props

For shared props (data, option, loading, enableGl, maxPoints) see `skills/charts`.

| Prop | Attribute | Type | Default | Description |
|------|-----------|------|---------|-------------|
| `stacked` | `stacked` | `boolean` | `false` | Stack all series on a shared axis (passes `stack: 'total'` internally). |
| `horizontal` | `horizontal` | `boolean` | `false` | Flip to horizontal orientation (x/y axes swapped). |
| `showLabels` | `show-labels` | `boolean` | `false` | Render value labels on each bar. |
| `labelPosition` | `label-position` | `'top' \| 'bottom'` | `'top'` | Label position. `'top'` = above bar for vertical; `'right'` = end of bar for horizontal. |
| `colorByData` | `color-by-data` | `boolean` | `false` | Each bar gets a distinct color from the palette (uses ECharts `colorBy: 'data'`). |

## Methods

See `skills/charts` for shared `pushData()` and `getChart()`.

## CSS Custom Properties

See `skills/charts` for all 17 shared `--ui-chart-*` tokens.

## Behavior Notes

- **JS property required**: `data` and `option` must be set as JS properties.
- **Category labels**: The `categories` field (x-axis labels) is not a reactive property. Pass categories via the `option` prop or use `buildBarOption(data, { categories: ['Jan', 'Feb', 'Mar'] })`.
- **stacked translates to string**: The `stacked` boolean passes `stack: 'total'` string to ECharts — ECharts requires a string group name, not a boolean.
- **labelPosition adapts to orientation**: When `horizontal` is true, `labelPosition: 'top'` maps to `'right'` automatically to avoid clipping at bar ends.
- **colorByData palette**: When `color-by-data` is set, uses ThemeBridge palette automatically — no manual color lookup needed.
- **Streaming**: Uses circular buffer + setOption (not appendData). Call `pushData(point)` to append. `maxPoints` controls buffer size (default 1000).
