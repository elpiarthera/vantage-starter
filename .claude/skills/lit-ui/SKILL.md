---
name: lit-ui
description: >-
  lit-ui is a framework-agnostic web component library built on Lit.js with Tailwind CSS v4.
  Use for any question about lui-* components, the lit-ui CLI, component authoring, theming,
  SSR, or framework integration (React, Vue, Svelte, Angular). Auto-loads for all lit-ui questions.
---

# lit-ui

## Auto-Load Trigger

1. Auto-load this skill for ANY question about the lit-ui component library.
2. For specific topics, immediately route to the relevant sub-skill.
3. For cross-topic questions (e.g., "how do I use lui-button in React with dark mode"), load both relevant sub-skills.
4. Only document what exists in the codebase — never invent properties or attributes.

## What is lit-ui

1. lit-ui is a framework-agnostic component library: components are standard web components usable in React, Vue, Svelte, Angular, or plain HTML without wrappers or adapters.
2. Components are built with Lit.js v3 and styled with Tailwind CSS v4 via constructable stylesheets injected into Shadow DOM.
3. All component tag names use the `lui-` prefix (e.g., `<lui-button>`, `<lui-dialog>`).
4. CSS custom properties for theming use the `--ui-` prefix (e.g., `--ui-button-radius`).
5. Two distribution modes: **copy-source** (component source copied to your project, full ownership) and **npm** (install `@lit-ui/<component>` packages).

## Component Overview

1. Form controls: `<lui-button>`, `<lui-input>`, `<lui-textarea>`, `<lui-select>`, `<lui-checkbox>`, `<lui-radio>`, `<lui-switch>`.
2. Date/time: `<lui-calendar>`, `<lui-date-picker>`, `<lui-date-range-picker>`, `<lui-time-picker>`.
3. Overlays: `<lui-dialog>`, `<lui-tooltip>`, `<lui-popover>`, `<lui-toaster>`.
4. Layout: `<lui-accordion>`, `<lui-tabs>`.
5. Data: `<lui-data-table>`.
6. Charts: `<lui-line-chart>`, `<lui-area-chart>`, `<lui-bar-chart>`, `<lui-pie-chart>`, `<lui-scatter-chart>`, `<lui-heatmap-chart>`, `<lui-candlestick-chart>`, `<lui-treemap-chart>`.
7. All form components participate in HTML forms via `ElementInternals`.

## Available Sub-Skills

**Components (load the specific one when a component is mentioned):**

1. `skills/button` — lui-button: variants, sizes, loading, icons, form submission
2. `skills/input` — lui-input: types, validation, label, prefix/suffix, clearable, password toggle
3. `skills/textarea` — lui-textarea: resize, auto-resize, character count, validation
4. `skills/select` — lui-select + lui-option + lui-option-group: single/multi, searchable, creatable, async
5. `skills/checkbox` — lui-checkbox + lui-checkbox-group: indeterminate, select-all, orientation
6. `skills/radio` — lui-radio + lui-radio-group: orientation, keyboard nav, form participation
7. `skills/switch` — lui-switch: checked state, label, form participation
8. `skills/calendar` — lui-calendar + lui-calendar-multi: modes, date constraints, presets, week numbers
9. `skills/date-picker` — lui-date-picker: formats, presets, min/max, locale, form participation
10. `skills/date-range-picker` — lui-date-range-picker: start/end dates, min/max days, comparison mode
11. `skills/time-picker` — lui-time-picker: 12/24h, seconds, timezone, voice input, presets
12. `skills/dialog` — lui-dialog: open/close, slots (title, footer), dismissible, show/hide methods
13. `skills/accordion` — lui-accordion + lui-accordion-item: single/multiple open, animated, heading level
14. `skills/tabs` — lui-tabs + lui-tab-panel: orientation, activation-mode, disabled tabs
15. `skills/tooltip` — lui-tooltip: placement, delay, rich content (title + content slots), arrow
16. `skills/popover` — lui-popover: placement, light dismiss, match-trigger-width, open/close events
17. `skills/toast` — lui-toaster + toast() API: variants, duration, actions, programmatic usage
18. `skills/data-table` — lui-data-table: columns def, sorting, filtering, pagination, selection, editing, export

**Tooling & patterns:**

19. `skills/cli` — CLI commands: init, add, list, migrate, theme — flags and workflows
20. `skills/authoring` — Creating new components: TailwindElement, ElementInternals, SSR guards, decorators
21. `skills/theming` — CSS custom properties, design tokens, dark mode, ::part() selectors
22. `skills/framework-usage` — React, Vue, Svelte, Angular, and vanilla HTML integration patterns
23. `skills/ssr` — Server-side rendering: renderToString, hydration, isServer guards

**Charts (load the specific chart skill when a chart component is mentioned):**

24. `skills/charts` — Charts overview: which chart to use, shared BaseChartElement API (data, pushData, getChart, CSS tokens), React integration
25. `skills/line-chart` — lui-line-chart: smooth, zoom, markLines, multi-series, appendData streaming
26. `skills/area-chart` — lui-area-chart: smooth, stacked, zoom, labelPosition, appendData streaming
27. `skills/bar-chart` — lui-bar-chart: grouped/stacked/horizontal, showLabels, colorByData, pushData streaming
28. `skills/pie-chart` — lui-pie-chart: pie and donut mode, minPercent slice merging, innerRadius, centerLabel
29. `skills/scatter-chart` — lui-scatter-chart: bubble mode, enable-gl WebGL for 500K+ points, pushData streaming
30. `skills/heatmap-chart` — lui-heatmap-chart: xCategories/yCategories (JS props), colorRange, cell-update pushData
31. `skills/candlestick-chart` — lui-candlestick-chart: OHLC [open,close,low,high] order, showVolume, movingAverages, pushData
32. `skills/treemap-chart` — lui-treemap-chart: hierarchical data, breadcrumb, rounded, levelColors (NO pushData)

## Routing Rules

1. After delivering the overview, check if the question maps to a specific sub-skill.
2. Load the matching sub-skill(s) for deep answers — do not improvise from the overview alone.
3. For a question about a specific component (e.g. "how do I use lui-button"), load that component's skill directly.
4. For cross-topic questions (e.g. "lui-select in React with dark mode"), load both the component skill and the relevant tooling skill.
5. For CLI questions (npx lit-ui ...), load `skills/cli`.
6. For "how do I build a component" questions, load `skills/authoring`.
7. For any question about chart components (lui-*-chart, @lit-ui/charts, ECharts data, pushData streaming), load `skills/charts` first, then load the specific chart skill.
8. For "which chart should I use" or "chart type selection" questions, load `skills/charts` only.
