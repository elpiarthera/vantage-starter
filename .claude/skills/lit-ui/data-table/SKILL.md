---
name: lit-ui-data-table
description: >-
  How to use <lui-data-table> — props, slots, events, CSS tokens, JS setup, examples.
---

# Data Table

High-performance data table with virtual scrolling (100K+ rows), sorting, filtering, pagination, inline editing, selection, bulk actions, column customization, and CSV export.

## Usage

**Important:** `columns` and `data` are JS properties set imperatively (not HTML attributes).

```js
import '@lit-ui/data-table';

const table = document.querySelector('lui-data-table');
table.columns = [
  { accessorKey: 'name', header: 'Name', enableSorting: true },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'status', header: 'Status' },
];
table.data = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'Editor', status: 'Active' },
];
```

```html
<lui-data-table enable-selection show-column-picker></lui-data-table>
```

```js
// React example
import { useRef, useEffect } from 'react';

function MyTable({ data }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.columns = columns;
      ref.current.data = data;
    }
  }, [data]);
  return <lui-data-table ref={ref} enable-selection />;
}
```

```js
// Row actions
table.rowActions = [
  { id: 'view', label: 'View', variant: 'default' },
  { id: 'edit', label: 'Edit', variant: 'default' },
  { id: 'delete', label: 'Delete', variant: 'destructive' },
];
// 1-2 actions render inline; 3+ use a kebab menu
```

```js
// Server-side data (sorting, filtering, pagination handled by server)
table.dataCallback = async (params, signal) => {
  const res = await fetch(`/api/users?${new URLSearchParams({
    page: String(params.pageIndex),
    size: String(params.pageSize),
    sort: JSON.stringify(params.sorting),
    filters: JSON.stringify(params.columnFilters),
  })}, { signal });
  const json = await res.json();
  return { data: json.rows, totalRowCount: json.total };
};
```

```js
// Inline row editing
table.columns = [
  { accessorKey: 'name', header: 'Name', meta: { editable: true, editType: 'text' } },
  { accessorKey: 'role', header: 'Role', meta: {
      editable: true, editType: 'select',
      editOptions: [{ label: 'Admin', value: 'Admin' }, { label: 'Editor', value: 'Editor' }]
  }},
];
// Combine with enable-row-editing attribute
```

```js
// CSV export
table.exportCsv({ filename: 'users.csv' });
table.exportCsv({ filename: 'selected.csv', selectedOnly: true });
```

## Column Definition

```ts
type ColumnDef = {
  accessorKey: string;      // Maps to row data property
  header: string;           // Column header text
  enableSorting?: boolean;  // Enable sort on this column
  size?: number;            // Column width in pixels
  meta?: {
    filterType?: 'text' | 'select' | 'date';
    filterOptions?: { label: string; value: string }[];
    editable?: boolean;
    editType?: 'text' | 'select' | 'date';
    editOptions?: { label: string; value: string }[];
  };
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| columns | `ColumnDef<TData>[]` | `[]` | Column definitions array. JS property only. |
| data | `TData[]` | `[]` | Row data array. JS property only. |
| loading | `"idle" \| "loading" \| "updating"` | `"idle"` | Loading state. "loading" shows skeleton rows; "updating" shows overlay. |
| aria-label | `string` | `"Data table"` | Accessible label for the grid. |
| max-height | `string` | `"400px"` | Maximum table body height. Enables virtual scrolling when content overflows. |
| row-height | `number` | `48` | Fixed row height in pixels for virtualizer calculations. |
| skeleton-rows | `number` | `5` | Number of skeleton rows during loading state. |
| empty-state-type | `"no-data" \| "no-matches"` | `"no-data"` | Type of empty state to display. |
| no-data-message | `string` | `"No data available"` | Message when table has no data. |
| no-matches-message | `string` | `"No results match your filters"` | Message when filters exclude all rows. |
| sorting | `SortingState` | `[]` | Current sorting state. Array of `{ id, desc }` for multi-column sort. |
| manual-sorting | `boolean` | `false` | Enable server-side sorting via `ui-sort-change` events. |
| enable-selection | `boolean` | `false` | Enable row selection with checkboxes. |
| rowSelection | `RowSelectionState` | `{}` | Current row selection state. JS property. |
| row-id-key | `string` | `"id"` | Property name used as unique row identifier. |
| total-row-count | `number` | `undefined` | Total row count for server-side "select all". |
| preserve-selection-on-filter | `boolean` | `false` | Keep selected rows when filters change. |
| columnFilters | `ColumnFiltersState` | `[]` | Current column filter state. JS property. |
| global-filter | `string` | `""` | Global filter string applied across all columns. |
| manual-filtering | `boolean` | `false` | Enable server-side filtering via `ui-filter-change` events. |
| pagination | `PaginationState` | `{ pageIndex: 0, pageSize: 25 }` | Current pagination state. JS property. |
| manual-pagination | `boolean` | `false` | Enable server-side pagination via `ui-pagination-change` events. |
| page-count | `number` | `undefined` | Total page count for server-side pagination. |
| pageSizeOptions | `number[]` | `[10, 25, 50, 100]` | Available page size options. JS property. |
| enable-column-resizing | `boolean` | `true` | Enable column resizing by dragging header borders. |
| columnSizing | `ColumnSizingState` | `{}` | Current column widths. JS property. |
| column-resize-mode | `"onChange" \| "onEnd"` | `"onChange"` | When to apply resize. |
| columnVisibility | `VisibilityState` | `{}` | Column visibility state. JS property. |
| show-column-picker | `boolean` | `false` | Show column picker toggle in toolbar. |
| columnOrder | `ColumnOrderState` | `[]` | Column display order. JS property. |
| enable-column-reorder | `boolean` | `false` | Enable column reordering by dragging headers. |
| sticky-first-column | `boolean` | `false` | Pin the first column during horizontal scroll. |
| persistence-key | `string` | `""` | LocalStorage key for persisting column preferences. |
| onColumnPreferencesChange | `(prefs) => void` | `undefined` | Callback for server-side preference persistence. JS property. |
| enable-row-editing | `boolean` | `false` | Enable row-level edit mode with save/cancel controls. |
| rowActions | `RowAction[]` | `[]` | Row action definitions. JS property. |
| hover-reveal-actions | `boolean` | `false` | Show row action buttons only on hover. |
| bulkActions | `BulkAction[]` | `[]` | Bulk action definitions shown in toolbar when rows are selected. JS property. |
| onExport | `(params) => void \| Promise<void>` | `undefined` | Server-side export callback. JS property. |
| renderDetailContent | `(rowData, row) => TemplateResult` | `undefined` | Function returning detail content for expanded rows. JS property. |
| expanded | `ExpandedState` | `{}` | Expanded row state. JS property. |
| single-expand | `boolean` | `false` | Only allow one row expanded at a time (accordion mode). |
| dataCallback | `(params, signal) => Promise<DataCallbackResult>` | `undefined` | Async data fetch for server-side data. JS property. |
| debounce-delay | `number` | `300` | Debounce delay for filter changes with dataCallback. |

## Slots

| Slot | Description |
|------|-------------|
| `toolbar-start` | Content at the start (left) of the toolbar. |
| `toolbar-end` | Content at the end (right) of the toolbar. |

## Events

| Event | Detail Type | Description |
|-------|-------------|-------------|
| `ui-sort-change` | `SortChangeEvent` | Fired when sort state changes. |
| `ui-selection-change` | `SelectionChangeEvent` | Fired when row selection changes. Includes selectedRows and count. |
| `ui-filter-change` | `FilterChangeEvent` | Fired when column filters or global filter changes. |
| `ui-pagination-change` | `PaginationChangeEvent` | Fired when page index or page size changes. |
| `ui-column-visibility-change` | `ColumnVisibilityChangeEvent` | Fired when column visibility changes. |
| `ui-column-order-change` | `ColumnOrderChangeEvent` | Fired when column order changes. |
| `ui-column-preferences-change` | `ColumnPreferencesChangeEvent` | Fired when any column preference changes (sizing, order, visibility). |
| `ui-column-preferences-reset` | `{ tableId: string }` | Fired when preferences are reset. |
| `ui-cell-edit` | `CellEditEvent` | Fired when a cell edit is committed. Includes columnId, oldValue, newValue. |
| `ui-row-edit` | `RowEditEvent` | Fired when a row edit is saved. Includes oldValues and newValues. |
| `ui-row-action` | `RowActionEvent` | Fired when a row action button is clicked. Includes actionId and row data. |
| `ui-bulk-action` | `BulkActionEvent` | Fired when a bulk action is executed. Includes actionId and selectedRows. |
| `ui-expanded-change` | `ExpandedChangeEvent` | Fired when expanded row state changes. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ui-data-table-header-bg` | `var(--color-muted, var(--ui-color-muted))` | Header row background color. |
| `--ui-data-table-row-bg` | `var(--color-background, white)` | Data row background color. |
| `--ui-data-table-row-hover-bg` | `var(--color-muted, var(--ui-color-muted))` | Data row background on hover. |
| `--ui-data-table-border-color` | `var(--color-border, var(--ui-color-border))` | Border color for table, rows, and cells. |
| `--ui-data-table-text-color` | `var(--color-foreground, var(--ui-color-foreground))` | Primary text color for cell content. |
| `--ui-data-table-header-text` | `var(--color-muted-foreground, var(--ui-color-muted-foreground))` | Header cell text color. |
| `--ui-data-table-selected-bg` | `oklch(0.97 0.01 250)` | Background color for selected rows. |
| `--ui-data-table-selected-hover-bg` | `oklch(0.94 0.02 250)` | Selected row background on hover. |
| `--ui-data-table-skeleton-base` | `var(--color-border, var(--ui-color-border))` | Skeleton loading animation base color. |
| `--ui-data-table-skeleton-highlight` | `var(--color-muted, var(--ui-color-muted))` | Skeleton loading animation highlight color. |
| `--ui-data-table-header-hover-bg` | `rgba(0, 0, 0, 0.05)` | Sortable header background on hover. |
| `--ui-data-table-sticky-shadow` | `rgba(0, 0, 0, 0.06)` | Box shadow for sticky first column during horizontal scroll. |
| `--ui-data-table-menu-bg` | `var(--color-card, var(--ui-color-card))` | Background color for dropdown menus (column picker, row actions). |
| `--ui-data-table-menu-shadow` | `0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)` | Box shadow for dropdown menus. |
| `--ui-data-table-overlay-bg` | `rgba(255, 255, 255, 0.6)` | Background overlay during "updating" loading state. |
| `--ui-data-table-editable-hover-bg` | `rgba(0, 0, 0, 0.03)` | Background on hover for editable cells. |
| `--ui-data-table-editing-bg` | `color-mix(in oklch, var(--color-primary, var(--ui-color-primary)) 5%, var(--color-background, white))` | Background for a cell currently being edited. |
| `--ui-data-table-banner-bg` | `color-mix(in oklch, var(--color-primary, var(--ui-color-primary)) 8%, var(--color-background, white))` | Selection banner / bulk actions toolbar background. |
| `--ui-data-table-row-height` | `48px` | Minimum row height for data rows. |
| `--ui-data-table-header-height` | `48px` | Header row height. |
| `--ui-data-table-cell-padding` | `0.75rem 1rem` | Padding inside data and header cells. |
| `--ui-data-table-font-size` | `0.875rem` | Font size for cell content. |
| `--ui-data-table-header-font-weight` | `500` | Font weight for header cells. |
| `--ui-data-table-badge-default-bg` | `var(--color-muted, var(--ui-color-muted))` | Background for default/neutral badge cells. |
| `--ui-data-table-badge-default-text` | `var(--color-foreground, var(--ui-color-foreground))` | Text color for default/neutral badge cells. |
| `--ui-data-table-badge-green-bg` | `oklch(0.93 0.06 150)` | Background for green badge cells. |
| `--ui-data-table-badge-green-text` | `oklch(0.35 0.10 150)` | Text color for green badge cells. |
| `--ui-data-table-badge-blue-bg` | `oklch(0.93 0.06 250)` | Background for blue badge cells. |
| `--ui-data-table-badge-blue-text` | `oklch(0.35 0.10 250)` | Text color for blue badge cells. |
| `--ui-data-table-badge-red-bg` | `oklch(0.93 0.06 25)` | Background for red/danger badge cells. |
| `--ui-data-table-badge-red-text` | `oklch(0.35 0.10 25)` | Text color for red/danger badge cells. |
| `--ui-data-table-badge-yellow-bg` | `oklch(0.93 0.06 85)` | Background for yellow/warning badge cells. |
| `--ui-data-table-badge-yellow-text` | `oklch(0.40 0.12 85)` | Text color for yellow/warning badge cells. |
| `--ui-data-table-badge-purple-bg` | `oklch(0.93 0.06 310)` | Background for purple badge cells. |
| `--ui-data-table-badge-purple-text` | `oklch(0.35 0.10 310)` | Text color for purple badge cells. |

## Behavior Notes

- **JS properties required**: `columns` and `data` must be set as JS properties (not HTML attributes). Use `element.columns = [...]` and `element.data = [...]` after element is connected. In React, use a ref + useEffect.
- **Virtual scrolling**: Activates automatically when content height exceeds `max-height` (default: 400px). Virtualizer requires fixed `row-height` for accurate scroll calculations. Changing row heights dynamically is not supported.
- **Server-side mode**: Set `dataCallback` async function for server-driven data. The callback receives `{ pageIndex, pageSize, sorting, columnFilters, globalFilter }` and must return `{ data, totalRowCount }`. Use `manual-sorting`, `manual-filtering`, `manual-pagination` attributes to disable client-side logic.
- **Selection**: `enable-selection` adds a checkbox column. Access current selection via `rowSelection` JS property or `ui-selection-change` event. `row-id-key` (default: `"id"`) determines the unique row identifier used as selection key.
- **Row actions**: 1–2 actions render as inline buttons; 3+ actions collapse into a kebab menu. Use `hover-reveal-actions` to show action buttons only on row hover.
- **Column preferences persistence**: Set `persistence-key` to a unique string to save column sizing, order, and visibility to localStorage. Use `resetColumnPreferences()` method to clear. Use `onColumnPreferencesChange` callback for server-side persistence.
- **Inline editing**: Set `meta: { editable: true, editType: 'text' | 'select' | 'date' }` on column definitions. Add `enable-row-editing` attribute to show row-level save/cancel controls. Listen to `ui-cell-edit` or `ui-row-edit` events.
- **CSV export**: Call `table.exportCsv({ filename: 'file.csv' })` imperatively. Pass `selectedOnly: true` to export only selected rows. Use `onExport` callback for server-side export.
- **Badge cells**: Columns that return badge-shaped cells use `--ui-data-table-badge-*` tokens. Badge colors (green/blue/red/yellow/purple) map to semantic statuses. `badge-default-*` handles unlisted values.
- **Dark mode**: Semantic tokens (`header-bg`, `row-bg`, `border-color`, etc.) cascade automatically via `.dark --color-*` overrides. Dark-specific exceptions are set explicitly in tailwind.css `.dark` block: `selected-bg`/`selected-hover-bg` (different oklch lightness), `overlay-bg`/`editable-hover-bg`/`header-hover-bg` (color inversions), all badge oklch colors, `editing-bg`, shadow tokens.
- **Expandable rows**: Set `renderDetailContent` function returning a Lit `TemplateResult`. Use `single-expand` for accordion-style (one row at a time). Listen to `ui-expanded-change` event. Access expanded state via `expanded` JS property.
- **Column reorder / resize**: `enable-column-resizing` (default: true) allows drag-to-resize on header borders. `enable-column-reorder` enables drag-and-drop column reordering. `sticky-first-column` pins column 0 during horizontal scroll, casting a `--ui-data-table-sticky-shadow`.
