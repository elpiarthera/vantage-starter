---
name: lit-ui-pie-chart
description: >-
  How to use <lui-pie-chart> — pie and donut mode, minPercent slice merging, innerRadius, centerLabel, streaming.
---

# Pie Chart

Pie and donut chart built on ECharts. Supports automatic small-slice merging below a configurable threshold, configurable donut hole with center label text, and streaming data updates via pushData().

## Usage

**Important:** `data` and `option` are JS properties — not HTML attributes.

```js
import '@lit-ui/charts/pie-chart';

const chart = document.querySelector('lui-pie-chart');
chart.data = [
  { name: 'Chrome', value: 65 },
  { name: 'Firefox', value: 18 },
  { name: 'Safari', value: 12 },
  { name: 'Edge', value: 5 },
];
```

```html
<!-- Pie chart with small-slice merging -->
<lui-pie-chart min-percent="3"></lui-pie-chart>

<!-- Donut chart with center label -->
<lui-pie-chart inner-radius="40%" center-label="Total"></lui-pie-chart>
```

```tsx
// React
import { useRef, useEffect } from 'react';
function PieChartDemo({ data }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.data = data;
  }, [data]);
  return <lui-pie-chart ref={ref} inner-radius="40%" center-label="Total" />;
}
```

```js
// Streaming: update proportions over time
chart.data = [{ name: 'A', value: 50 }, { name: 'B', value: 50 }];
setInterval(() => chart.pushData({ name: 'A', value: Math.random() * 100 }), 500);
```

## Data Type

```ts
type PieSlice = {
  name: string;
  value: number;
};

// chart.data is PieSlice[]
chart.data = [
  { name: 'Product A', value: 40 },
  { name: 'Product B', value: 35 },
  { name: 'Product C', value: 25 },
];
```

## Props

For shared props (data, option, loading, enableGl, maxPoints) see `skills/charts`.

| Prop | Attribute | Type | Default | Description |
|------|-----------|------|---------|-------------|
| `minPercent` | `min-percent` | `number` | `0` | Merge slices below this percentage into an "Other" segment. `0` = no merging. |
| `innerRadius` | `inner-radius` | `string \| number` | `0` | Donut hole radius. `0`, `'0'`, or `'0%'` = filled pie. Use `'40%'` for typical donut. |
| `centerLabel` | `center-label` | `string` | `''` | Text displayed in the donut center. Only shown when `innerRadius` is non-zero. |
| `labelPosition` | `label-position` | `'top' \| 'bottom'` | `'top'` | `'top'` = labels outside with connector lines; `'bottom'` = labels inside slices. |

## Methods

See `skills/charts` for shared `pushData()` and `getChart()`.

## CSS Custom Properties

See `skills/charts` for all 17 shared `--ui-chart-*` tokens.

## Behavior Notes

- **JS property required**: `data` and `option` must be set as JS properties.
- **innerRadius falsy check**: `0`, `'0'`, and `'0%'` all render a filled pie (not a donut). The string `'0'` is truthy in JavaScript but the component treats it as "no inner radius".
- **centerLabel requires innerRadius**: Setting `center-label` has no visible effect unless `inner-radius` is also non-zero.
- **minPercent merging**: Slices below `minPercent` are merged into a single "Other" segment before rendering. The merge is pre-processing — legend and tooltip data reflect original slice names, not the merged segment.
- **Streaming**: Uses circular buffer. Call `pushData({ name, value })` to update a slice by name.
