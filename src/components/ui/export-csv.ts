/**
 * CSV export utility for lui-data-table.
 *
 * Provides RFC 4180 compliant CSV generation with browser download trigger.
 * Supports column visibility filtering, row selection, UTF-8 BOM for Excel,
 * and custom header labels.
 *
 * This module is a standalone utility that can be used independently of the
 * DataTable component, following the pattern of bulk-actions.ts and row-actions.ts.
 */

import type { Table, RowData } from '@tanstack/lit-table';
import type { ExportCsvOptions } from './types.js';

// =============================================================================
// CSV Field Escaping (RFC 4180)
// =============================================================================

/**
 * Escape a field value for CSV output per RFC 4180.
 *
 * Rules:
 * - If the field contains a comma, double-quote, newline, or carriage return,
 *   wrap the entire field in double-quotes.
 * - Double-quote characters within the field are escaped by doubling them.
 * - Otherwise, return the field as-is.
 *
 * @param field - The string value to escape
 * @returns RFC 4180 compliant escaped field
 */
export function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// =============================================================================
// Browser Download Trigger
// =============================================================================

/**
 * Trigger a file download in the browser.
 *
 * Creates a temporary anchor element with an object URL, clicks it to
 * initiate the download, then cleans up the DOM element and revokes
 * the object URL.
 *
 * @param blob - The file content as a Blob
 * @param filename - The filename for the download
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// =============================================================================
// CSV Export
// =============================================================================

/**
 * Export table data to CSV and trigger a browser download.
 *
 * Reads the current table state to determine which rows and columns to export:
 * - Rows: Uses filtered rows by default, or selected rows when `selectedOnly` is true
 * - Columns: Uses visible leaf columns, excluding utility columns (_selection, _actions, _expand)
 * - Headers: Uses custom labels from options, column header strings, or column IDs as fallback
 *
 * The generated CSV is RFC 4180 compliant with optional UTF-8 BOM for Excel compatibility.
 *
 * @template TData - Row data type
 * @param table - TanStack Table instance
 * @param options - Export configuration options
 *
 * @example
 * ```typescript
 * // Export all visible/filtered data
 * exportToCsv(tableInstance);
 *
 * // Export selected rows only
 * exportToCsv(tableInstance, { selectedOnly: true });
 *
 * // Custom filename and headers
 * exportToCsv(tableInstance, {
 *   filename: 'users-report.csv',
 *   headers: { firstName: 'First Name', lastName: 'Last Name' },
 * });
 * ```
 */
export function exportToCsv<TData extends RowData>(
  table: Table<TData>,
  options: ExportCsvOptions = {}
): void {
  const {
    filename = 'export.csv',
    selectedOnly = false,
    includeBom = true,
    headers,
  } = options;

  // Determine rows to export (EXP-01, EXP-02)
  let rows = selectedOnly
    ? table.getSelectedRowModel().rows
    : table.getFilteredRowModel().rows;

  // EXP-02 fallback: if selectedOnly but no rows selected, export all filtered rows
  if (selectedOnly && rows.length === 0) {
    rows = table.getFilteredRowModel().rows;
  }

  // Get visible columns, excluding utility columns (EXP-03)
  // Utility columns: _selection, _actions, _expand
  const columns = table.getVisibleLeafColumns().filter(col => !col.id.startsWith('_'));

  // Build header row
  const headerRow = columns.map(col => {
    // Priority: custom header label > column header string > column ID
    if (headers?.[col.id]) {
      return escapeCsvField(headers[col.id]);
    }
    if (typeof col.columnDef.header === 'string') {
      return escapeCsvField(col.columnDef.header);
    }
    return escapeCsvField(col.id);
  }).join(',');

  // Build data rows
  const dataRows = rows.map(row => {
    return columns.map(col => {
      const value = row.getValue(col.id);
      if (value === null || value === undefined) {
        return '';
      }
      return escapeCsvField(String(value));
    }).join(',');
  });

  // Assemble CSV content with CRLF line endings (RFC 4180)
  const csv = [headerRow, ...dataRows].join('\r\n');

  // Create Blob with optional UTF-8 BOM for Excel compatibility
  const bom = includeBom ? '\uFEFF' : '';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });

  // Trigger browser download
  triggerDownload(blob, filename);
}
