---
name: lit-ui-heatmap-chart
description: >-
  How to use <lui-heatmap-chart> — xCategories/yCategories JS props, HeatmapCell type, colorRange, cell-update streaming.
---

# Heatmap Chart

Cartesian heatmap chart built on ECharts with VisualMap color scale. Uses integer index pairs to address cells. Category labels must be set as JS properties — not HTML attributes.

## Usage

**Important:** `data`, `xCategories`, and `yCategories` are JS properties — they CANNOT be set as HTML attributes.

```js
import '@lit-ui/charts/heatmap-chart';

const chart = document.querySelector('lui-heatmap-chart');
chart.xCategories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
chart.yCategories = ['Morning', 'Afternoon', 'Evening'];
chart.data = [
  [0, 0, 85],   // Mon Morning: 85
  [1, 0, 72],   // Tue Morning: 72
  [2, 1, 40],   // Wed Afternoon: 40
  [4, 2, 91],   // Fri Evening: 91
];
```

```html
<!-- colorRange as comma-separated hex colors (min,max) -->
<lui-heatmap-chart color-range="#ffffff,#ef4444"></lui-heatmap-chart>
```

```tsx
// React — useRef + useEffect required for xCategories, yCategories, and data
import { useRef, useEffect } from 'react';
function HeatmapChartDemo({ xCats, yCats, data }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.xCategories = xCats;
    ref.current.yCategories = yCats;
    ref.current.data = data;
  }, [xCats, yCats, data]);
  return <lui-heatmap-chart ref={ref} />;
}
```

```js
// Cell-update streaming: update a specific cell value
chart.pushData([2, 1, 55]); // Update Wed Afternoon to 55
// pushData on heatmap updates the cell in-place — not a rolling buffer
```

## Data Type

```ts
type HeatmapCell = [xIdx: number, yIdx: number, value: number];
// xIdx: integer index into xCategories array
// yIdx: integer index into yCategories array
// value: numeric value for color encoding

// chart.data is HeatmapCell[]
chart.data = [
  [0, 0, 85],  // xCategories[0], yCategories[0], value=85
  [1, 2, 43],  // xCategories[1], yCategories[2], value=43
];
```

## Props

For shared props (data, option, loading, enableGl, maxPoints) see `skills/charts`.

| Prop | Attribute | Type | Default | Description |
|------|-----------|------|---------|-------------|
| `xCategories` | — (JS only) | `string[]` | `[]` | X-axis category labels. **Must be JS property** — cannot be HTML attribute. |
| `yCategories` | — (JS only) | `string[]` | `[]` | Y-axis category labels. **Must be JS property** — cannot be HTML attribute. |
| `colorRange` | `color-range` | `string \| null` | `null` | VisualMap color gradient as `'#minColor,#maxColor'`. Default: `'#313695,#d73027'` (blue-to-red). |

## Methods

See `skills/charts` for shared `getChart()`. `pushData()` is overridden — see behavior notes.

## CSS Custom Properties

See `skills/charts` for all 17 shared `--ui-chart-*` tokens.

## Behavior Notes

- **xCategories and yCategories are JS properties**: Cannot be set as HTML attributes (`x-categories="[...]"` will not work). Must be set as `element.xCategories = [...]` in JavaScript. In React, use a ref + useEffect.
- **Data uses integer indices**: HeatmapCell values `[xIdx, yIdx, value]` are integer positions into xCategories/yCategories arrays — not the string category values.
- **pushData() overridden**: Heatmap's `pushData()` updates a specific cell in-place, not a rolling circular buffer. Pass a `HeatmapCell` tuple `[xIdx, yIdx, newValue]`.
- **VisualMap min/max defaults**: The color scale defaults to `[0, 100]` to prevent color drift during streaming. Override via the `option` prop if your data range differs.
- **colorRange format**: Provide two hex colors separated by a comma: `'#minColor,#maxColor'`. The first color maps to the minimum value, the second to the maximum.
