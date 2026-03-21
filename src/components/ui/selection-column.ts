/**
 * Selection column factory for lui-data-table.
 * Creates a checkbox column for row selection with header select-all.
 */

import { html } from 'lit';
import type { ColumnDef, RowData } from './types.js';
import type { Table, Row } from '@tanstack/lit-table';

/**
 * Creates a selection column with checkboxes for row selection.
 *
 * @template TData - Row data type
 * @returns Column definition for selection checkbox column
 *
 * @example
 * ```typescript
 * const columns = [
 *   createSelectionColumn<User>(),
 *   { accessorKey: 'name', header: 'Name' },
 * ];
 * ```
 */
export function createSelectionColumn<TData extends RowData>(): ColumnDef<TData, unknown> {
  return {
    id: '_selection',
    header: ({ table }: { table: Table<TData> }) => {
      const isAllPageSelected = table.getIsAllPageRowsSelected();
      const isSomePageSelected = table.getIsSomePageRowsSelected();

      return html`
        <lui-checkbox
          size="sm"
          .checked=${isAllPageSelected}
          .indeterminate=${!isAllPageSelected && isSomePageSelected}
          @ui-change=${() => table.toggleAllPageRowsSelected()}
          aria-label="Select all rows on this page"
        ></lui-checkbox>
      `;
    },
    cell: ({ row }: { row: Row<TData> }) => {
      const isSelected = row.getIsSelected();
      const canSelect = row.getCanSelect();

      return html`
        <lui-checkbox
          size="sm"
          .checked=${isSelected}
          ?disabled=${!canSelect}
          @click=${(e: MouseEvent) => {
            e.stopPropagation(); // Prevent row click
            // Store shift key state for ui-change handler
            (e.currentTarget as HTMLElement).dataset.shiftKey = String(e.shiftKey);
          }}
          @ui-change=${(e: CustomEvent) => {
            const checkbox = e.currentTarget as HTMLElement;
            const wasShiftClick = checkbox.dataset.shiftKey === 'true';
            delete checkbox.dataset.shiftKey;

            // Get data-table host element
            const dataTable = checkbox.closest('lui-data-table');
            if (dataTable && 'handleRowSelect' in dataTable) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (dataTable as any).handleRowSelect(row, wasShiftClick);
            } else {
              // Fallback: simple toggle
              row.toggleSelected();
            }
          }}
          aria-label="Select row"
        ></lui-checkbox>
      `;
    },
    size: 48,
    minSize: 48,
    maxSize: 48,
    enableSorting: false,
    enableColumnFilter: false,
    enableResizing: false,
  };
}
