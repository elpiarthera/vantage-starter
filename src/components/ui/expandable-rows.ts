/**
 * Expandable rows support for lui-data-table.
 *
 * Provides a column factory for expand/collapse toggles, styles for
 * the expand toggle and detail panels, and a helper to render detail content.
 *
 * Follows the selection-column.ts factory pattern.
 */

import { html, css, nothing } from 'lit';
import type { ColumnDef, RowData } from './types.js';
import type { Row } from '@tanstack/lit-table';

/**
 * Creates an expand toggle column for expandable rows.
 *
 * Renders a chevron button that toggles row expansion.
 * The column is fixed-width (40px) with no sorting, filtering, or resizing.
 *
 * @template TData - Row data type
 * @returns Column definition for expand toggle column
 *
 * @example
 * ```typescript
 * // Typically auto-prepended by DataTable when renderDetailContent is set.
 * // Can also be added manually:
 * const columns = [
 *   createExpandColumn<Order>(),
 *   { accessorKey: 'orderNumber', header: 'Order #' },
 * ];
 * ```
 */
export function createExpandColumn<TData extends RowData>(): ColumnDef<TData, unknown> {
  return {
    id: '_expand',
    header: () => nothing,
    cell: ({ row }: { row: Row<TData> }) => {
      if (!row.getCanExpand()) return nothing;

      const isExpanded = row.getIsExpanded();
      return html`
        <button
          type="button"
          class="expand-toggle"
          aria-expanded="${isExpanded}"
          aria-label="${isExpanded ? 'Collapse row' : 'Expand row'}"
          @click=${(e: MouseEvent) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
        >
          <svg
            class="expand-icon ${isExpanded ? 'expanded' : ''}"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      `;
    },
    size: 40,
    minSize: 40,
    maxSize: 40,
    enableSorting: false,
    enableColumnFilter: false,
    enableResizing: false,
  };
}

/**
 * Styles for expand toggle buttons and detail panels.
 * Include in DataTable's static styles array.
 */
export const expandColumnStyles = css`
  .expand-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: var(--ui-radius-sm, 0.25rem);
    cursor: pointer;
    color: var(--ui-data-table-header-text);
    padding: 0;
  }

  .expand-toggle:hover {
    background: var(--ui-data-table-row-hover-bg);
  }

  .expand-toggle:focus-visible {
    outline: 2px solid var(--color-primary, var(--ui-color-primary));
    outline-offset: -2px;
  }

  .expand-icon {
    transition: transform 0.15s ease;
  }

  .expand-icon.expanded {
    transform: rotate(90deg);
  }

  .detail-panel {
    padding: 1rem 1rem 1rem calc(1rem + 40px);
    border-top: 1px solid var(--ui-data-table-border-color);
    background: var(--ui-data-table-header-bg);
  }

  .virtual-row-wrapper {
    /* Virtual row wrapper combines data row + optional detail panel */
    border-bottom: 1px solid var(--ui-data-table-border-color);
  }

  .virtual-row-wrapper:last-child {
    border-bottom: none;
  }
`;

/**
 * Render a detail panel for an expanded row.
 *
 * Wraps the developer-provided content in an accessible region
 * with proper ARIA labelling and consistent styling.
 *
 * @template TData - Row data type
 * @param row - The TanStack Row instance
 * @param renderFn - Developer-provided function to render detail content
 * @returns TemplateResult for the detail panel
 */
export function renderDetailPanel<TData extends RowData>(
  row: Row<TData>,
  renderFn: (rowData: TData, row: any) => any
) {
  return html`
    <div
      class="detail-panel"
      role="region"
      aria-label="Row ${row.id} details"
    >
      ${renderFn(row.original, row)}
    </div>
  `;
}
