---
name: lit-ui-treemap-chart
description: >-
  How to use <lui-treemap-chart> — hierarchical data, breadcrumb navigation, rounded cells, levelColors, data updates.
---

# Treemap Chart

Hierarchical space-filling treemap chart built on ECharts. Supports breadcrumb drill-down navigation, rounded cell borders, and per-level color palettes.

**IMPORTANT:** `pushData()` is NOT supported on treemap charts. Calling `pushData()` on a treemap logs a console warning and does nothing. To update data, reassign the `.data` property directly.

## Usage

**Important:** `data` and `option` are JS properties — not HTML attributes.

```js
import '@lit-ui/charts/treemap-chart';

const chart = document.querySelector('lui-treemap-chart');
chart.data = [
  {
    name: 'Technology',
    value: 80,
    children: [
      { name: 'Frontend', value: 35 },
      { name: 'Backend', value: 30 },
      { name: 'DevOps', value: 15 },
    ],
  },
  {
    name: 'Design',
    value: 45,
    children: [
      { name: 'UI', value: 25 },
      { name: 'UX', value: 20 },
    ],
  },
];
```

```html
<!-- Rounded cells, no breadcrumb -->
<lui-treemap-chart rounded></lui-treemap-chart>
<lui-treemap-chart breadcrumb="false"></lui-treemap-chart>

<!-- Per-level colors (JSON string of string[][]) -->
<lui-treemap-chart level-colors='[["#ef4444","#f97316","#eab308"],["#3b82f6","#8b5cf6"]]'></lui-treemap-chart>
```

```tsx
// React
import { useRef, useEffect } from 'react';
function TreemapChartDemo({ data }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.data = data;
  }, [data]);
  return <lui-treemap-chart ref={ref} rounded />;
}
```

```js
// Updating treemap data — DO NOT use pushData()
const chart = document.querySelector('lui-treemap-chart');

// WRONG: pushData() is a no-op (console.warn, no update)
// chart.pushData({ name: 'New Node', value: 10 }); // ← does nothing

// CORRECT: reassign .data to trigger a re-render
chart.data = [...updatedHierarchy];
```

## Data Type

```ts
type TreemapNode = {
  name: string;
  value: number;
  children?: TreemapNode[]; // optional — leaf nodes have no children
};

// chart.data is TreemapNode[]
chart.data = [
  {
    name: 'Category A',
    value: 40,
    children: [
      { name: 'Sub A1', value: 25 },
      { name: 'Sub A2', value: 15 },
    ],
  },
  { name: 'Category B', value: 30 }, // leaf node
];
```

## Props

For shared props (data, option, loading, enableGl, maxPoints) see `skills/charts`.

| Prop | Attribute | Type | Default | Description |
|------|-----------|------|---------|-------------|
| `breadcrumb` | `breadcrumb` | `boolean` | `true` | Show ECharts breadcrumb navigation for drill-down into child nodes. |
| `rounded` | `rounded` | `boolean` | `false` | Apply border-radius to cells (6px top level, decremented per depth level). |
| `levelColors` | `level-colors` | `string \| null` | `null` | JSON string of `string[][]` — per-level color palettes. See behavior notes. |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getChart()` | `() => EChartsType \| undefined` | Direct ECharts instance access. |
| `pushData(point)` | — | **NOT SUPPORTED.** Logs console.warn and does nothing. Use `.data` reassignment instead. |

## CSS Custom Properties

See `skills/charts` for all 17 shared `--ui-chart-*` tokens.

## Behavior Notes

- **pushData() not supported**: Treemap overrides `pushData()` with a console.warn no-op to prevent the base class circular buffer from corrupting hierarchical data. Update treemap data by reassigning the `.data` property.
- **JS property required**: `data` and `option` must be set as JS properties.
- **levelColors requires array-of-arrays**: `levelColors` must be a `string[][]` — an array of arrays where each inner array is the color palette for one depth level. A flat `string[]` (single array of colors) is silently rejected and no colors are applied. Example: `[["#ef4444","#f97316"],["#3b82f6"]]` — first level uses red/orange, second level uses blue.
- **levelColors as JSON string**: The `level-colors` attribute accepts a JSON string. Pass it as `'[["#ef4444"],["#3b82f6"]]'`. In JavaScript, use `JSON.stringify(colorArrayOfArrays)`.
- **breadcrumb: false behavior**: When `breadcrumb` is `false`, users can still click to drill down but cannot navigate back via breadcrumb — use the ECharts instance from `getChart()` to programmatically navigate if needed.
- **Drill-down state preserved**: When the `data` prop changes, the component uses `notMerge: false` internally so the user's current drill-down position in the hierarchy is preserved.
