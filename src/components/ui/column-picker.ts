/**
 * Column picker dropdown for toggling column visibility.
 *
 * Uses lui-popover for dropdown positioning and lui-checkbox for toggles.
 * Exported as a function to allow flexible placement in different toolbar layouts.
 */

import { html, css, type TemplateResult } from 'lit';
import type { Table, RowData, Column } from '@tanstack/lit-table';
import '@lit-ui/popover';
import '@lit-ui/checkbox';

/**
 * Render column picker dropdown for toggling column visibility.
 * Uses lui-popover for positioning and lui-checkbox for toggles.
 *
 * @param table - TanStack Table instance
 * @returns TemplateResult for the column picker
 */
export function renderColumnPicker<TData extends RowData>(
  table: Table<TData>
): TemplateResult {
  const columns = table.getAllLeafColumns().filter((col) => col.getCanHide());

  if (columns.length === 0) {
    return html``;
  }

  return html`
    <lui-popover placement="bottom-end" class="column-picker-popover">
      <button
        slot="trigger"
        type="button"
        class="column-picker-trigger"
        aria-label="Toggle columns"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M12 3v18M3 12h18M9 3h6M3 9v6M21 9v6M9 21h6" />
        </svg>
        <span>Columns</span>
      </button>
      <div slot="content" class="column-picker-content">
        <div class="column-picker-header">Show/Hide Columns</div>
        <div class="column-picker-list">
          ${columns.map((col) => renderColumnPickerItem(col))}
        </div>
      </div>
    </lui-popover>
  `;
}

/**
 * Render a single column picker item with checkbox toggle.
 */
function renderColumnPickerItem<TData extends RowData>(
  column: Column<TData, unknown>
): TemplateResult {
  const label =
    typeof column.columnDef.header === 'string'
      ? column.columnDef.header
      : column.id;

  return html`
    <label class="column-picker-item">
      <lui-checkbox
        .checked=${column.getIsVisible()}
        @ui-change=${() => column.toggleVisibility()}
      ></lui-checkbox>
      <span class="column-picker-label">${label}</span>
    </label>
  `;
}

/**
 * Styles for the column picker component.
 * Exported separately so DataTable can include them in its styles array.
 */
export const columnPickerStyles = css`
  .column-picker-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--ui-data-table-text-color);
    background: var(--ui-data-table-row-bg);
    border: 1px solid var(--ui-data-table-border-color);
    border-radius: var(--ui-radius, 6px);
    cursor: pointer;
    transition:
      background-color 0.15s,
      border-color 0.15s;
  }

  .column-picker-trigger:hover {
    background: var(--ui-data-table-row-hover-bg);
    border-color: var(--color-primary, #3b82f6);
  }

  .column-picker-trigger:focus-visible {
    outline: 2px solid var(--color-primary, #3b82f6);
    outline-offset: 2px;
  }

  .column-picker-content {
    min-width: 200px;
    max-height: 300px;
    overflow-y: auto;
  }

  .column-picker-header {
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ui-data-table-header-text);
    border-bottom: 1px solid var(--ui-data-table-border-color);
  }

  .column-picker-list {
    padding: 4px 0;
  }

  .column-picker-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .column-picker-item:hover {
    background: var(--ui-data-table-row-hover-bg);
  }

  .column-picker-label {
    font-size: 14px;
    color: var(--ui-data-table-text-color);
  }
`;
