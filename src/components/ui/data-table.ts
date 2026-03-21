/**
 * lui-data-table - A high-performance data table with virtual scrolling
 *
 * Features:
 * - Renders columns and rows from column definitions
 * - TanStack Table for headless state management
 * - Virtual scrolling for 100K+ rows
 * - Column resize, reorder, and visibility customization
 * - localStorage persistence with optional server-side callback
 * - Div-based layout with ARIA grid pattern
 * - CSS Grid for column sizing
 * - SSR compatible via isServer guards
 *
 * @example
 * ```html
 * <lui-data-table
 *   .columns=${columns}
 *   .data=${data}
 *   persistence-key="users-table"
 *   enable-column-resizing
 *   enable-column-reorder
 *   show-column-picker
 *   sticky-first-column
 * ></lui-data-table>
 * ```
 *
 * @slot - Optional slot for custom content (e.g., toolbar, pagination)
 *
 * @fires ui-sort-change - When sorting state changes
 * @fires ui-selection-change - When row selection changes
 * @fires ui-filter-change - When column or global filter changes
 * @fires ui-pagination-change - When pagination state changes
 * @fires ui-column-visibility-change - When column visibility changes
 * @fires ui-column-order-change - When column order changes
 * @fires ui-column-preferences-change - When column sizing/order/visibility changes
 * @fires ui-column-preferences-reset - When preferences are reset via resetColumnPreferences()
 * @fires ui-cell-edit - When a cell edit is committed with old/new values
 * @fires ui-row-edit - When a row edit is saved with old/new values for all changed fields
 * @fires ui-row-action - When a row action button is clicked
 * @fires ui-bulk-action - When a bulk action is executed on selected rows
 * @fires ui-expanded-change - When expanded row state changes
 */

import { html, css, nothing, isServer, type TemplateResult, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';
import {
  TableController,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  flexRender,
  type RowData,
  type Table,
  type Header,
  type Cell,
  type Row,
  type Column,
  type SortingState,
  type PaginationState,
} from '@tanstack/lit-table';
import { VirtualizerController } from '@tanstack/lit-virtual';
import type {
  ColumnDef,
  LoadingState,
  EmptyStateType,
  RowSelectionState,
  SelectionChangeEvent,
  ColumnFiltersState,
  PaginationChangeEvent,
  FilterChangeEvent,
  DataCallback,
  DataCallbackParams,
  DataTableErrorState,
  ColumnSizingState,
  ColumnSizingInfoState,
  VisibilityState,
  ColumnVisibilityChangeEvent,
  ColumnOrderState,
  ColumnOrderChangeEvent,
  ExpandedState,
  DetailContentRenderer,
  ExpandedChangeEvent,
} from './types.js';
import { KeyboardNavigationManager, type GridPosition } from './keyboard-navigation.js';
import { createSelectionColumn } from './selection-column.js';
import { renderColumnPicker, columnPickerStyles } from './column-picker.js';
import { renderEditInput, isColumnEditable, renderEditableIndicator, renderRowEditActions, inlineEditingStyles } from './inline-editing.js';
import { renderRowActions, rowActionsStyles } from './row-actions.js';
import { renderBulkActionsToolbar, renderConfirmationDialog, bulkActionsStyles } from './bulk-actions.js';
import { cellRendererStyles } from './cell-renderers.js';
import { savePreferences, loadPreferences, clearPreferences } from './column-preferences.js';
import { exportToCsv } from './export-csv.js';
import { createExpandColumn, expandColumnStyles, renderDetailPanel } from './expandable-rows.js';
import type { ColumnPreferences, ColumnPreferencesChangeEvent, EditingCell, EditingRow, CellEditEvent, RowEditEvent, EditValidationResult, LitUIColumnMeta, RowAction, RowActionEvent, BulkAction, BulkActionEvent, ExportCsvOptions, ServerExportParams } from './types.js';

/**
 * A high-performance data table component with TanStack Table integration.
 *
 * Uses div-based layout with ARIA grid pattern for accessibility.
 * Supports column definitions, row data, and theme customization via CSS variables.
 *
 * @template TData - Row data type extending RowData
 */
export class DataTable<TData extends RowData = RowData> extends TailwindElement {
  /**
   * Table controller for TanStack Table integration.
   * Initialized in constructor and used in render() to create table instance.
   */
  private tableController = new TableController<TData>(this);

  /**
   * Unique ID prefix for ARIA associations.
   */
  private tableId = `lui-data-table-${Math.random().toString(36).substring(2, 11)}`;

  /**
   * Reference to the scroll container for virtualization.
   */
  private scrollRef: Ref<HTMLDivElement> = createRef();

  /**
   * VirtualizerController manages which rows are visible for efficient rendering.
   * Only initialized client-side when data is available.
   */
  private virtualizer?: VirtualizerController<HTMLDivElement, Element>;

  /**
   * Number of rows to render outside visible viewport.
   * Provides smooth scrolling by pre-rendering buffer rows.
   */
  private static readonly VIRTUALIZER_OVERSCAN = 5;

  /**
   * Keyboard navigation manager for ARIA grid pattern.
   */
  private navManager = new KeyboardNavigationManager();

  /**
   * Current focused cell position for roving tabindex.
   */
  @state()
  private _focusedCell: GridPosition = { row: 0, col: 0 };

  /**
   * Announcement for screen readers on navigation.
   */
  @state()
  private _announcement = '';

  /**
   * Track last selected row ID for shift+click range selection.
   */
  @state()
  private lastSelectedRowId: string | null = null;

  // ==========================================================================
  // Inline editing state (cell level)
  // ==========================================================================

  /** Currently editing cell state. Null when not editing. */
  @state()
  private _editingCell: EditingCell | null = null;

  /** Validation error for the currently editing cell. */
  @state()
  private _cellValidationError: string | null = null;

  /** Guard flag to prevent double-commit from Enter + blur race condition. */
  private _isCommitting = false;

  /** Reference to current table instance for use outside render(). */
  private _tableInstance?: Table<TData>;

  // ==========================================================================
  // Inline editing state (row level)
  // ==========================================================================

  /**
   * Enable row-level edit mode with pencil/save/cancel action buttons.
   * When true, each row shows a pencil icon that activates edit mode for the entire row.
   * Mutually exclusive with cell-level editing on the same row.
   * @default false
   */
  @property({ type: Boolean, attribute: 'enable-row-editing' })
  enableRowEditing = false;

  /** Currently editing row state. Null when not in row edit mode. */
  @state()
  private _editingRow: EditingRow | null = null;

  // ==========================================================================
  // Row Actions (ACT-*)
  // ==========================================================================

  /**
   * Array of row actions to display in the actions column.
   * For 1-2 actions: renders inline icon buttons.
   * For 3+: renders kebab menu with dropdown.
   */
  @property({ type: Array })
  rowActions: RowAction<TData>[] = [];

  /**
   * When true, row action buttons are hidden until row is hovered or focused.
   * Always visible on touch devices via @media (hover: none).
   * @default false
   */
  @property({ type: Boolean, attribute: 'hover-reveal-actions', reflect: true })
  hoverRevealActions = false;

  // ==========================================================================
  // Bulk Actions (BULK-*)
  // ==========================================================================

  /**
   * Array of bulk actions for the toolbar.
   * When configured and rows are selected, a floating toolbar appears
   * above the table body with action buttons.
   */
  @property({ type: Array })
  bulkActions: BulkAction[] = [];

  /**
   * Tracks a pending bulk action that requires confirmation dialog.
   * Non-null triggers the confirmation dialog to render.
   */
  @state()
  private _pendingBulkAction: BulkAction | null = null;

  /**
   * Whether an actions column should be rendered.
   * True when rowActions are configured OR enableRowEditing is true.
   */
  private get hasActionsColumn(): boolean {
    return this.rowActions.length > 0 || this.enableRowEditing;
  }

  // ==========================================================================
  // Export (EXP-*)
  // ==========================================================================

  /**
   * Server-side export callback (EXP-04).
   *
   * When set, `exportCsv()` delegates to this callback instead of performing
   * client-side CSV generation. The callback receives the current table state
   * (filters, sorting, visible columns, selected rows) so the server can
   * generate the export.
   *
   * @example
   * ```typescript
   * table.onExport = async (params) => {
   *   const response = await fetch('/api/export', {
   *     method: 'POST',
   *     body: JSON.stringify(params),
   *   });
   *   // Handle server-generated file download
   * };
   * ```
   */
  @property({ attribute: false })
  onExport?: (params: ServerExportParams) => void | Promise<void>;

  // ==========================================================================
  // Expandable Rows (EXPAND-*)
  // ==========================================================================

  /**
   * Function to render detail content for expanded rows (EXPAND-03).
   * When set, rows become expandable with a toggle button.
   * The function receives the row data and TanStack Row instance.
   */
  @property({ attribute: false })
  renderDetailContent?: DetailContentRenderer<TData>;

  /**
   * Current expanded state (EXPAND-05: controlled/uncontrolled pattern).
   * - `{}`: No rows expanded (default)
   * - `{ 'row-id': true }`: Specific rows expanded
   * - `true`: All rows expanded
   */
  @property({ type: Object })
  expanded: ExpandedState = {};

  /**
   * When true, only one row can be expanded at a time (EXPAND-04).
   * Expanding a new row automatically collapses the previous one.
   * @default false
   */
  @property({ type: Boolean, attribute: 'single-expand' })
  singleExpand = false;

  /**
   * Column definitions for the table.
   * Uses TanStack Table's ColumnDef type for full compatibility.
   */
  @property({ type: Array })
  columns: ColumnDef<TData, unknown>[] = [];

  /**
   * Row data array.
   * Each item represents a row in the table.
   */
  @property({ type: Array })
  data: TData[] = [];

  /**
   * Loading state indicator.
   * - 'idle': No loading in progress
   * - 'loading': Initial data fetch (shows skeleton in Phase 04)
   * - 'updating': Data refresh (shows overlay in Phase 04)
   */
  @property({ type: String })
  loading: LoadingState = 'idle';

  /**
   * Fixed row height in pixels for virtualization.
   * Used by VirtualizerController in Phase 03.
   * @default 48
   */
  @property({ type: Number, attribute: 'row-height' })
  rowHeight = 48;

  /**
   * Number of skeleton rows to show during initial loading.
   * @default 5
   */
  @property({ type: Number, attribute: 'skeleton-rows' })
  skeletonRows = 5;

  /**
   * Type of empty state to show when data is empty.
   * - 'no-data': Default empty state (no data available)
   * - 'no-matches': Filter resulted in no matches
   * @default 'no-data'
   */
  @property({ type: String, attribute: 'empty-state-type' })
  emptyStateType: EmptyStateType = 'no-data';

  /**
   * Custom message for no-data empty state.
   * @default 'No data available'
   */
  @property({ type: String, attribute: 'no-data-message' })
  noDataMessage = 'No data available';

  /**
   * Custom message for no-matches empty state.
   * @default 'No results match your filters'
   */
  @property({ type: String, attribute: 'no-matches-message' })
  noMatchesMessage = 'No results match your filters';

  /**
   * Accessible label for the grid.
   * Announced by screen readers when entering the table.
   */
  @property({ type: String, attribute: 'aria-label' })
  override ariaLabel = 'Data table';

  /**
   * Maximum height of the table body scroll container.
   * Set to enable vertical scrolling with virtualization.
   * @default '400px'
   */
  @property({ type: String, attribute: 'max-height' })
  maxHeight = '400px';

  /**
   * Current sorting state.
   * Array of sort objects with column ID and direction.
   * Supports multi-column sorting via Shift+click.
   */
  @property({ type: Array })
  sorting: SortingState = [];

  /**
   * Enable manual/server-side sorting mode.
   * When true, sorting is handled externally and ui-sort-change events are emitted.
   * When false (default), client-side sorting is performed via getSortedRowModel.
   */
  @property({ type: Boolean, attribute: 'manual-sorting' })
  manualSorting = false;

  /**
   * Enable row selection with checkbox column.
   * When true, adds a checkbox column as the first column.
   */
  @property({ type: Boolean, attribute: 'enable-selection' })
  enableSelection = false;

  /**
   * Current row selection state.
   * Maps row IDs to selection status.
   */
  @property({ type: Object })
  rowSelection: RowSelectionState = {};

  /**
   * Property key to use as row ID for selection tracking.
   * Defaults to 'id'. Must be a unique identifier for each row.
   */
  @property({ attribute: 'row-id-key' })
  rowIdKey = 'id';

  /**
   * Total number of rows across all pages.
   * Used for "Select all X items" display. For client-side, uses data.length.
   */
  @property({ type: Number, attribute: 'total-row-count' })
  totalRowCount?: number;

  /**
   * Whether to preserve selection when filters change.
   * Default: false (selection clears on filter change).
   */
  @property({ type: Boolean, attribute: 'preserve-selection-on-filter' })
  preserveSelectionOnFilter = false;

  // ==========================================================================
  // Filtering properties
  // ==========================================================================

  /**
   * Column filters state.
   * Array of filter objects with column ID and filter value.
   * Integrates with TanStack Table's filtering system.
   */
  @property({ type: Array })
  columnFilters: ColumnFiltersState = [];

  /**
   * Global filter string.
   * Searches across all filterable columns when set.
   */
  @property({ type: String, attribute: 'global-filter' })
  globalFilter = '';

  /**
   * Enable manual/server-side filtering mode.
   * When true, filtering is handled externally and ui-filter-change events are emitted.
   * When false (default), client-side filtering is performed via getFilteredRowModel.
   */
  @property({ type: Boolean, attribute: 'manual-filtering' })
  manualFiltering = false;

  // ==========================================================================
  // Pagination properties
  // ==========================================================================

  /**
   * Current pagination state.
   * Includes pageIndex (0-based) and pageSize.
   */
  @property({ type: Object })
  pagination: PaginationState = { pageIndex: 0, pageSize: 25 };

  /**
   * Enable manual/server-side pagination mode.
   * When true, pagination is handled externally and ui-pagination-change events are emitted.
   * When false (default), client-side pagination is performed via getPaginationRowModel.
   */
  @property({ type: Boolean, attribute: 'manual-pagination' })
  manualPagination = false;

  /**
   * Total page count for server-side pagination.
   * Required when manualPagination is true for proper page navigation.
   */
  @property({ type: Number, attribute: 'page-count' })
  pageCount?: number;

  /**
   * Available page size options for pagination controls.
   * @default [10, 25, 50, 100]
   */
  @property({ type: Array, attribute: false })
  pageSizeOptions = [10, 25, 50, 100];

  /**
   * Previous filter state for change detection.
   */
  @state()
  private _previousFilterState = '';

  // ==========================================================================
  // Column sizing properties
  // ==========================================================================

  /**
   * Enable column resizing with drag handles.
   * When true, resize handles appear between column headers.
   * @default true
   */
  @property({ type: Boolean, attribute: 'enable-column-resizing' })
  enableColumnResizing = true;

  /**
   * Column sizing state for externally-controlled sizing.
   * Maps column IDs to their widths in pixels.
   */
  @property({ type: Object })
  columnSizing: ColumnSizingState = {};

  /**
   * Column resize mode determines when width updates are applied.
   * - 'onChange': Real-time preview during drag (default)
   * - 'onEnd': Only update when drag completes (better for very large tables)
   */
  @property({ type: String, attribute: 'column-resize-mode' })
  columnResizeMode: 'onChange' | 'onEnd' = 'onChange';

  /**
   * Internal state for resize tracking (transient during drag).
   * Not persisted - only used during active resize operation.
   */
  @state()
  private _columnSizingInfo: ColumnSizingInfoState = {
    startOffset: null,
    startSize: null,
    deltaOffset: null,
    deltaPercentage: null,
    isResizingColumn: false,
    columnSizingStart: [],
  };

  // ==========================================================================
  // Column visibility properties
  // ==========================================================================

  /**
   * Column visibility state.
   * Maps column IDs to visibility (true = visible, false = hidden).
   * Omitted columns are visible by default.
   */
  @property({ type: Object })
  columnVisibility: VisibilityState = {};

  /**
   * Show column picker button in toolbar.
   * When true, displays a dropdown to toggle column visibility.
   */
  @property({ type: Boolean, attribute: 'show-column-picker' })
  showColumnPicker = false;

  // ==========================================================================
  // Column ordering properties
  // ==========================================================================

  /**
   * Column order state.
   * Array of column IDs in display order.
   * Empty array means use default column definition order.
   */
  @property({ type: Array })
  columnOrder: ColumnOrderState = [];

  /**
   * Enable column reordering via drag-and-drop.
   * When true, column headers can be dragged to reorder columns.
   * @default false
   */
  @property({ type: Boolean, attribute: 'enable-column-reorder' })
  enableColumnReorder = false;

  /**
   * Currently dragged column ID during drag operation.
   * Used for visual feedback.
   */
  @state()
  private _draggedColumnId: string | null = null;

  /**
   * Column ID of current drop target during drag operation.
   * Used for drop indicator visual feedback.
   */
  @state()
  private _dropTargetColumnId: string | null = null;

  // ==========================================================================
  // Sticky column properties
  // ==========================================================================

  /**
   * Enable sticky first column during horizontal scroll.
   * When true, the first column stays fixed while scrolling horizontally.
   * @default false
   */
  @property({ type: Boolean, attribute: 'sticky-first-column', reflect: true })
  stickyFirstColumn = false;

  // ==========================================================================
  // Column preferences persistence properties (COL-07, COL-08)
  // ==========================================================================

  /**
   * Unique key for localStorage persistence.
   * When set, column preferences are automatically saved and restored.
   * Use a unique key per table instance (e.g., 'users-table', 'orders-table').
   */
  @property({ type: String, attribute: 'persistence-key' })
  persistenceKey = '';

  /**
   * Callback for server-side preference persistence (COL-08).
   * Called with preference changes after debounce, in addition to localStorage.
   */
  @property({ attribute: false })
  onColumnPreferencesChange?: (prefs: ColumnPreferencesChangeEvent) => void;

  /**
   * Debounce timer for preference saves.
   */
  private _preferenceSaveTimer?: ReturnType<typeof setTimeout>;

  /**
   * Debounce delay in milliseconds for preference saves.
   */
  private static readonly PREFERENCE_SAVE_DEBOUNCE = 300;

  // ==========================================================================
  // Async data callback properties
  // ==========================================================================

  /**
   * Async data callback for server-side data fetching.
   * When provided, the component calls this function when state changes.
   */
  @property({ attribute: false })
  dataCallback?: DataCallback<TData>;

  /**
   * Error state from async data fetching.
   */
  @state()
  private errorState: DataTableErrorState | null = null;

  /**
   * AbortController for cancelling in-flight requests.
   */
  private abortController?: AbortController;

  /**
   * Debounce timeout for filter changes.
   */
  private debounceTimeout?: ReturnType<typeof setTimeout>;

  /**
   * Debounce delay in milliseconds for filter-triggered fetches.
   */
  @property({ type: Number, attribute: 'debounce-delay' })
  debounceDelay = 300;

  // ==========================================================================
  // Lifecycle methods
  // ==========================================================================

  /**
   * Initialize or update virtualizer when data changes.
   * Update keyboard navigation bounds when data/columns change.
   */
  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    if (changedProperties.has('data') || changedProperties.has('rowHeight') || changedProperties.has('renderDetailContent')) {
      this.initVirtualizer();
    }

    // Update keyboard navigation bounds when data, columns, selection, row-editing, row-actions, or expand state changes
    if (
      changedProperties.has('data') ||
      changedProperties.has('columns') ||
      changedProperties.has('enableSelection') ||
      changedProperties.has('enableRowEditing') ||
      changedProperties.has('rowActions') ||
      changedProperties.has('renderDetailContent')
    ) {
      const maxHeightPx = parseInt(this.maxHeight, 10) || 400;
      const visibleRowCount = Math.floor(maxHeightPx / (this.rowHeight || 48));
      // Account for selection column, expand column, and unified actions column
      let colCount = this.columns.length;
      if (this.enableSelection) colCount += 1;
      if (this.renderDetailContent) colCount += 1;
      if (this.hasActionsColumn) colCount += 1;
      this.navManager.setBounds({
        rowCount: this.data.length,
        colCount,
        visibleRowCount,
      });
    }

    // Handle filter changes: reset pagination and optionally clear selection
    if (changedProperties.has('columnFilters') || changedProperties.has('globalFilter')) {
      const currentFilterState = JSON.stringify({
        columnFilters: this.columnFilters,
        globalFilter: this.globalFilter,
      });

      if (this._previousFilterState && currentFilterState !== this._previousFilterState) {
        // Reset to first page when filters change (prevents empty page display)
        if (this.pagination.pageIndex !== 0) {
          this.pagination = { ...this.pagination, pageIndex: 0 };
          this.dispatchPaginationChange(this.pagination);
        }

        // SEL-06: Clear selection when filters change (unless configured to preserve)
        if (this.enableSelection && !this.preserveSelectionOnFilter) {
          this.rowSelection = {};
          this.lastSelectedRowId = null;

          // Get table instance to dispatch proper event
          const effectiveColumns = this.getEffectiveColumns();
          const table = this.tableController.table({
            columns: effectiveColumns,
            data: this.data,
            state: {
              sorting: this.sorting,
              rowSelection: {},
            },
            getRowId: (r) => String(r[this.rowIdKey as keyof TData]),
            enableRowSelection: this.enableSelection,
            getCoreRowModel: getCoreRowModel(),
          });

          this.dispatchSelectionChange(table, {}, 'filter-changed');
        }
      }

      this._previousFilterState = currentFilterState;
    }

    // Trigger fetch when dataCallback is first set after initial render
    if (changedProperties.has('dataCallback') && this.dataCallback && !changedProperties.get('dataCallback')) {
      this.loading = 'loading';
      this.fetchData();
    }
  }

  /**
   * Initialize previous filter state on first render and trigger initial fetch.
   */
  override firstUpdated(): void {
    this._previousFilterState = JSON.stringify({
      columnFilters: this.columnFilters,
      globalFilter: this.globalFilter,
    });

    // Initial fetch if dataCallback is provided
    if (this.dataCallback) {
      this.loading = 'loading'; // Initial load shows skeleton
      this.fetchData();
    }
  }

  /**
   * Load persisted preferences when component connects.
   */
  override connectedCallback(): void {
    super.connectedCallback();

    // Load persisted preferences if key provided
    if (this.persistenceKey) {
      const stored = loadPreferences(this.persistenceKey);
      if (stored) {
        // Only apply if not already set (allows prop override)
        if (Object.keys(this.columnSizing).length === 0) {
          this.columnSizing = stored.columnSizing;
        }
        if (this.columnOrder.length === 0) {
          this.columnOrder = stored.columnOrder;
        }
        if (Object.keys(this.columnVisibility).length === 0) {
          this.columnVisibility = stored.columnVisibility;
        }
      }
    }
  }

  /**
   * Clean up virtualizer and async resources on disconnect.
   */
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.virtualizer = undefined;
    clearTimeout(this.debounceTimeout);
    clearTimeout(this._preferenceSaveTimer);
    this.abortController?.abort();
  }

  // ==========================================================================
  // Virtualizer methods
  // ==========================================================================

  /**
   * Initialize the virtualizer for efficient row rendering.
   * Only runs client-side when data is available.
   * When expandable rows are enabled, uses measureElement for dynamic heights.
   */
  private initVirtualizer(): void {
    if (isServer || this.data.length === 0) {
      this.virtualizer = undefined;
      return;
    }

    // Always recreate to handle count changes correctly
    this.virtualizer = new VirtualizerController(this, {
      getScrollElement: () => this.scrollRef.value ?? null,
      count: this.data.length,
      estimateSize: () => this.rowHeight,
      overscan: DataTable.VIRTUALIZER_OVERSCAN,
      // Enable dynamic measurement when expandable rows are configured
      ...(this.renderDetailContent ? {
        measureElement: (el: Element) => {
          if (!el) return this.rowHeight;
          return el.getBoundingClientRect().height;
        },
      } : {}),
    });
  }

  // ==========================================================================
  // Async data methods
  // ==========================================================================

  /**
   * Fetch data from async callback with current table state.
   * Handles request cancellation and error states.
   */
  private async fetchData(): Promise<void> {
    if (!this.dataCallback) return;

    // Cancel any pending request
    this.abortController?.abort();
    this.abortController = new AbortController();

    const params: DataCallbackParams = {
      pageIndex: this.pagination.pageIndex,
      pageSize: this.pagination.pageSize,
      sorting: this.sorting,
      columnFilters: this.columnFilters,
      globalFilter: this.globalFilter,
    };

    // Show updating state (preserves existing content)
    this.loading = 'updating';
    this.errorState = null;

    try {
      const result = await this.dataCallback(params, this.abortController.signal);

      // Update data and counts
      this.data = result.data;
      this.totalRowCount = result.totalRowCount;
      if (result.pageCount !== undefined) {
        this.pageCount = result.pageCount;
      } else {
        // Calculate page count from total
        this.pageCount = Math.ceil(result.totalRowCount / this.pagination.pageSize);
      }

      this.loading = 'idle';
    } catch (error) {
      // Ignore abort errors - these are intentional cancellations
      if ((error as Error).name === 'AbortError') {
        return;
      }

      // Set error state for display
      this.errorState = {
        message: (error as Error).message || 'Failed to load data',
        canRetry: true,
      };
      this.loading = 'idle';
    }
  }

  /**
   * Debounced fetch for filter changes.
   * Prevents excessive requests during rapid input.
   */
  private debouncedFetchData(): void {
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      this.fetchData();
    }, this.debounceDelay);
  }

  /**
   * Handle retry button click from error state.
   */
  private handleRetry(): void {
    this.errorState = null;
    this.fetchData();
  }

  // ==========================================================================
  // Keyboard navigation methods
  // ==========================================================================

  /**
   * Handle keyboard navigation on the grid.
   * Delegates to KeyboardNavigationManager for position calculation.
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // Don't handle if target is interactive element within cell
    const target = e.target as HTMLElement;
    if (this.isInteractiveElement(target)) {
      return;
    }

    // Enter or F2 on a focused cell activates edit mode (EDIT-02)
    if ((e.key === 'Enter' || e.key === 'F2') && !this._editingCell) {
      const pos = this.navManager.getPosition();
      this.activateCellEdit(pos);
      e.preventDefault();
      return;
    }

    const newPos = this.navManager.handleKeyDown(e);
    if (newPos) {
      e.preventDefault();
      this._focusedCell = newPos;
      this.focusCell(newPos);
      this.announcePosition(newPos);

      // Scroll virtualized row into view
      if (this.virtualizer) {
        this.virtualizer.getVirtualizer().scrollToIndex(newPos.row, {
          align: 'auto',
          behavior: 'auto',
        });
      }
    }
  }

  /**
   * Check if element is interactive (should handle its own keyboard events).
   */
  private isInteractiveElement(el: HTMLElement): boolean {
    const interactiveTags = ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'];
    return interactiveTags.includes(el.tagName) || el.hasAttribute('contenteditable');
  }

  /**
   * Focus a cell by its position.
   * Updates roving tabindex and focuses the cell element.
   */
  private focusCell(pos: GridPosition): void {
    // Account for header row in aria-rowindex (1-indexed, header = 1, first data = 2)
    const ariaRow = pos.row + 2;
    const ariaCol = pos.col + 1;

    // Find cell by ARIA attributes
    const cell = this.shadowRoot?.querySelector(
      `[role="row"][aria-rowindex="${ariaRow}"] [aria-colindex="${ariaCol}"]`
    ) as HTMLElement | null;

    if (cell) {
      // Make this cell tabbable, others not
      this.updateRovingTabindex(pos);
      cell.focus();
    }
  }

  /**
   * Update roving tabindex: active cell gets 0, all others get -1.
   */
  private updateRovingTabindex(activePos: GridPosition): void {
    // Remove tabindex from all cells
    const allCells = this.shadowRoot?.querySelectorAll('[role="gridcell"], [role="columnheader"]');
    allCells?.forEach((cell) => cell.setAttribute('tabindex', '-1'));

    // Set tabindex=0 on active cell
    const ariaRow = activePos.row + 2;
    const ariaCol = activePos.col + 1;
    const activeCell = this.shadowRoot?.querySelector(
      `[role="row"][aria-rowindex="${ariaRow}"] [aria-colindex="${ariaCol}"]`
    );
    activeCell?.setAttribute('tabindex', '0');
  }

  /**
   * Handle cell click to update focus position.
   * Click on already-focused editable cell activates edit mode (EDIT-02).
   */
  private handleCellClick(rowIndex: number, colIndex: number): void {
    const wasFocused = this._focusedCell.row === rowIndex && this._focusedCell.col === colIndex;

    this._focusedCell = { row: rowIndex, col: colIndex };
    this.navManager.setPosition(this._focusedCell);
    this.updateRovingTabindex(this._focusedCell);

    // Click on already-focused editable cell activates edit mode (EDIT-02)
    if (wasFocused && !this._editingCell) {
      this.activateCellEdit({ row: rowIndex, col: colIndex });
    }
  }

  /**
   * Announce position change to screen readers via live region.
   */
  private announcePosition(pos: GridPosition): void {
    // Account for selection column offset
    const effectiveColIndex = this.enableSelection ? pos.col - 1 : pos.col;
    const effectiveColCount = this.enableSelection
      ? this.columns.length + 1
      : this.columns.length;

    let headerText: string;
    if (this.enableSelection && pos.col === 0) {
      headerText = 'Selection';
    } else {
      const column = this.columns[effectiveColIndex];
      const colHeader = column?.header;
      headerText =
        typeof colHeader === 'function' ? 'Column' : String(colHeader || 'Column');
    }

    this._announcement = `Row ${pos.row + 1} of ${this.data.length}, ${headerText}, Column ${pos.col + 1} of ${effectiveColCount}`;
  }

  // ==========================================================================
  // Helper methods
  // ==========================================================================

  /**
   * Dispatch sort change event with both TanStack and REST API formats.
   */
  private dispatchSortChange(sorting: SortingState): void {
    const event = new CustomEvent('ui-sort-change', {
      detail: {
        sorting,
        sortParams: sorting.map((s) => ({
          column: s.id,
          direction: s.desc ? 'desc' : 'asc',
        })),
      },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  /**
   * Dispatch selection change event with selected rows and count.
   */
  private dispatchSelectionChange(
    table: Table<TData>,
    rowSelection: RowSelectionState,
    reason: SelectionChangeEvent<TData>['reason']
  ): void {
    const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
    const event = new CustomEvent('ui-selection-change', {
      detail: {
        rowSelection,
        selectedRows,
        selectedCount: selectedRows.length,
        reason,
      } satisfies SelectionChangeEvent<TData>,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  /**
   * Dispatch pagination change event.
   */
  private dispatchPaginationChange(pagination: PaginationState): void {
    const event = new CustomEvent('ui-pagination-change', {
      detail: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        pageCount: this.pageCount,
      } satisfies PaginationChangeEvent,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  /**
   * Dispatch filter change event with both column and global filter state.
   * @param columnFilters - Current column filters state
   * @param globalFilter - Current global filter string
   * @param changedColumn - Column ID that changed (undefined if global filter changed)
   */
  private dispatchFilterChange(
    columnFilters: ColumnFiltersState,
    globalFilter: string,
    changedColumn?: string
  ): void {
    const event = new CustomEvent('ui-filter-change', {
      detail: {
        columnFilters,
        globalFilter,
        changedColumn,
        isGlobalFilter: changedColumn === undefined,
      } satisfies FilterChangeEvent,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  /**
   * Dispatch column visibility change event.
   * @param columnVisibility - Current column visibility state
   */
  private dispatchColumnVisibilityChange(columnVisibility: VisibilityState): void {
    const event = new CustomEvent('ui-column-visibility-change', {
      detail: {
        columnVisibility,
      } satisfies ColumnVisibilityChangeEvent,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  /**
   * Dispatch column order change event.
   * @param columnOrder - Current column order state
   */
  private dispatchColumnOrderChange(columnOrder: ColumnOrderState): void {
    const event = new CustomEvent('ui-column-order-change', {
      detail: {
        columnOrder,
      } satisfies ColumnOrderChangeEvent,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  /**
   * Dispatch column preference change with debouncing.
   * Saves to localStorage and calls optional callback.
   */
  private dispatchPreferenceChange(): void {
    clearTimeout(this._preferenceSaveTimer);
    this._preferenceSaveTimer = setTimeout(() => {
      const prefs: ColumnPreferences = {
        columnSizing: this.columnSizing,
        columnOrder: this.columnOrder,
        columnVisibility: this.columnVisibility,
      };

      // Save to localStorage if persistence key provided
      if (this.persistenceKey) {
        savePreferences(this.persistenceKey, prefs);
      }

      // Call optional callback for server-side persistence (COL-08)
      const event: ColumnPreferencesChangeEvent = {
        ...prefs,
        tableId: this.persistenceKey,
      };
      this.onColumnPreferencesChange?.(event);

      // Also dispatch event for declarative usage
      this.dispatchEvent(new CustomEvent('ui-column-preferences-change', {
        detail: event,
        bubbles: true,
        composed: true,
      }));
    }, DataTable.PREFERENCE_SAVE_DEBOUNCE);
  }

  /**
   * Get all rows between two row IDs (inclusive).
   * Used for shift+click range selection.
   */
  private getRowRange(rows: Row<TData>[], idA: string, idB: string): Row<TData>[] {
    const range: Row<TData>[] = [];
    let foundStart = false;
    let foundEnd = false;

    for (const row of rows) {
      if (row.id === idA || row.id === idB) {
        if (foundStart) {
          foundEnd = true;
        } else {
          foundStart = true;
        }
      }
      if (foundStart) range.push(row);
      if (foundEnd) break;
    }
    return range;
  }

  /**
   * Handle row selection with shift+click range support.
   * Called from selection column checkbox click.
   * @param row - The row being selected
   * @param shiftKey - Whether shift key was held during click
   */
  public handleRowSelect(row: Row<TData>, shiftKey: boolean): void {
    // Get effective columns to create table instance
    const effectiveColumns = this.getEffectiveColumns();
    const table = this.tableController.table({
      columns: effectiveColumns,
      data: this.data,
      state: {
        sorting: this.sorting,
        rowSelection: this.rowSelection,
      },
      getRowId: (r) => String(r[this.rowIdKey as keyof TData]),
      enableRowSelection: this.enableSelection,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: this.manualSorting ? undefined : getSortedRowModel(),
      manualSorting: this.manualSorting,
    });

    if (shiftKey && this.lastSelectedRowId && this.enableSelection) {
      const { rows } = table.getRowModel();
      const range = this.getRowRange(rows, row.id, this.lastSelectedRowId);

      // Match selection state of the last selected row
      const lastRow = rows.find((r) => r.id === this.lastSelectedRowId);
      const targetState = lastRow?.getIsSelected() ?? true;

      // Build new selection state
      const newSelection = { ...this.rowSelection };
      range.forEach((r) => {
        if (targetState) {
          newSelection[r.id] = true;
        } else {
          delete newSelection[r.id];
        }
      });

      this.rowSelection = newSelection;
      this.dispatchSelectionChange(table, newSelection, 'user');
    } else {
      // Simple toggle for non-shift clicks
      const newSelection = { ...this.rowSelection };
      if (row.getIsSelected()) {
        delete newSelection[row.id];
      } else {
        newSelection[row.id] = true;
      }
      this.rowSelection = newSelection;
      this.dispatchSelectionChange(table, newSelection, 'user');
    }

    this.lastSelectedRowId = row.id;
  }

  /**
   * Reset column preferences to defaults.
   * Clears localStorage and resets sizing, order, and visibility.
   */
  public resetColumnPreferences(): void {
    // Clear localStorage
    if (this.persistenceKey) {
      clearPreferences(this.persistenceKey);
    }

    // Reset state to defaults
    this.columnSizing = {};
    this.columnOrder = [];
    this.columnVisibility = {};

    // Dispatch event for tracking
    this.dispatchEvent(new CustomEvent('ui-column-preferences-reset', {
      detail: { tableId: this.persistenceKey },
      bubbles: true,
      composed: true,
    }));
  }

  // ==========================================================================
  // Expandable Rows methods (EXPAND-*)
  // ==========================================================================

  /**
   * Enforce single-expand accordion mode (EXPAND-04).
   * When singleExpand is true, only one row can be expanded at a time.
   * Returns the new ExpandedState with at most one row expanded.
   *
   * @param nextExpanded - The next expanded state from TanStack
   * @returns Adjusted expanded state with single-expand enforcement
   */
  private enforceSingleExpand(nextExpanded: ExpandedState): ExpandedState {
    // "Expand all" not meaningful in single-expand mode
    if (nextExpanded === true) {
      return this.expanded;
    }
    if (typeof nextExpanded !== 'object') return {};

    const prevKeys = this.expanded === true
      ? []
      : Object.keys(this.expanded as Record<string, boolean>).filter(
          (k) => (this.expanded as Record<string, boolean>)[k]
        );
    const nextKeys = Object.keys(nextExpanded).filter((k) => nextExpanded[k]);

    // Find the newly expanded row
    const newKey = nextKeys.find((k) => !prevKeys.includes(k));
    if (newKey) {
      return { [newKey]: true };
    }
    // If no new key, a row was collapsed
    return nextExpanded;
  }

  /**
   * Dispatch ui-expanded-change event (EXPAND-05).
   * Fires when expanded state changes via toggle clicks or programmatic updates.
   */
  private dispatchExpandedChange(expanded: ExpandedState): void {
    this.dispatchEvent(
      new CustomEvent<ExpandedChangeEvent>('ui-expanded-change', {
        detail: { expanded },
        bubbles: true,
        composed: true,
      })
    );
  }

  // ==========================================================================
  // CSV Export (EXP-*)
  // ==========================================================================

  /**
   * Export table data to CSV.
   *
   * When `onExport` is set, delegates to the server-side callback with
   * current table state parameters (EXP-04). Otherwise performs client-side
   * CSV generation and triggers a browser download (EXP-01, EXP-02, EXP-03).
   *
   * @param options - Export options (filename, selectedOnly, includeBom, headers)
   *
   * @example
   * ```typescript
   * // Client-side: downloads CSV file
   * const table = document.querySelector('lui-data-table');
   * table.exportCsv();
   *
   * // Export selected rows only
   * table.exportCsv({ selectedOnly: true, filename: 'selected-users.csv' });
   * ```
   */
  public async exportCsv(options?: ExportCsvOptions): Promise<void> {
    const table = this._tableInstance;
    if (!table) return;

    if (this.onExport) {
      // Server-side export (EXP-04)
      const visibleColumnIds = table.getVisibleLeafColumns()
        .filter(c => !c.id.startsWith('_'))
        .map(c => c.id);
      const selectedRowIds = Object.keys(this.rowSelection);

      await this.onExport({
        columnFilters: this.columnFilters,
        globalFilter: this.globalFilter,
        sorting: this.sorting,
        visibleColumnIds,
        selectedRowIds,
      });
    } else {
      // Client-side export (EXP-01, EXP-02, EXP-03)
      exportToCsv(table, options);
    }
  }

  // ==========================================================================
  // Inline cell editing methods
  // ==========================================================================

  /**
   * Activate cell edit mode for a given grid position.
   * Checks editability, cancels any existing edit, and sets editing state.
   * @param pos - Grid position of the cell to edit
   */
  private activateCellEdit(pos: GridPosition): void {
    const table = this._tableInstance;
    if (!table) return;

    const rows = table.getRowModel().rows;
    const row = rows[pos.row];
    if (!row) return;

    const visibleCells = row.getVisibleCells();
    const cell = visibleCells[pos.col];
    if (!cell) return;

    const meta = cell.column.columnDef.meta as LitUIColumnMeta<TData> | undefined;
    const rowData = row.original;

    // Check if column is editable for this row
    if (!isColumnEditable(meta, rowData)) return;

    // Don't allow cell edit while row edit is active (mutual exclusion)
    if (this._editingRow) return;

    // If another cell is being edited, cancel it first
    if (this._editingCell) {
      this.cancelCellEdit();
    }

    // Set editing state
    this._editingCell = {
      rowId: row.id,
      columnId: cell.column.id,
      originalValue: cell.getValue(),
    };
    this._cellValidationError = null;
  }

  /**
   * Commit a cell edit with validation and event dispatch.
   * @param newValue - The new value to commit
   */
  private commitCellEdit(newValue: unknown): void {
    if (this._isCommitting || !this._editingCell) return;
    this._isCommitting = true;

    const { rowId, columnId, originalValue } = this._editingCell;
    const table = this._tableInstance;

    if (!table) {
      this._isCommitting = false;
      return;
    }

    // Find the row and column for validation
    const row = table.getRowModel().rows.find((r) => r.id === rowId);
    if (!row) {
      this._isCommitting = false;
      return;
    }

    const column = table.getColumn(columnId);
    const meta = column?.columnDef.meta as LitUIColumnMeta<TData> | undefined;
    const rowData = row.original;

    // Run validation if provided
    if (meta?.editValidate) {
      const result = meta.editValidate(newValue, rowData);
      if (result === false || (typeof result === 'object' && !result.valid)) {
        const message = typeof result === 'object' && result.message ? result.message : 'Invalid value';
        this._cellValidationError = message;
        this._isCommitting = false;
        return; // Stay in edit mode
      }
    }

    // If value hasn't changed, just cancel silently
    // eslint-disable-next-line eqeqeq
    if (newValue == originalValue) {
      this._editingCell = null;
      this._cellValidationError = null;
      this._isCommitting = false;
      this.restoreCellFocus(rowId, columnId);
      return;
    }

    // Dispatch cell edit event (EDIT-06)
    const detail: CellEditEvent<TData> = {
      row: rowData,
      rowId,
      columnId,
      oldValue: originalValue,
      newValue,
    };
    this.dispatchEvent(new CustomEvent('ui-cell-edit', {
      detail,
      bubbles: true,
      composed: true,
    }));

    // Clear editing state
    this._editingCell = null;
    this._cellValidationError = null;
    this._isCommitting = false;
    this.restoreCellFocus(rowId, columnId);
  }

  /**
   * Cancel the current cell edit, restoring focus to the cell.
   */
  private cancelCellEdit(): void {
    const rowId = this._editingCell?.rowId;
    const columnId = this._editingCell?.columnId;
    this._editingCell = null;
    this._cellValidationError = null;
    this._isCommitting = false;
    if (rowId && columnId) {
      this.restoreCellFocus(rowId, columnId);
    }
  }

  /**
   * Restore focus to a grid cell after exiting edit mode.
   * @param rowId - Row identifier
   * @param columnId - Column identifier
   */
  private restoreCellFocus(rowId: string, columnId: string): void {
    requestAnimationFrame(() => {
      const cell = this.shadowRoot?.querySelector(
        `[data-row-id="${rowId}"] [data-column-id="${columnId}"]`
      ) as HTMLElement | null;
      if (cell) {
        cell.setAttribute('tabindex', '0');
        cell.focus();
      }
    });
  }

  // ==========================================================================
  // Row action handling (ACT-01 through ACT-04)
  // ==========================================================================

  /**
   * Handle row action click. Dispatches ui-row-action event.
   * Special handling: if actionId is 'edit' and enableRowEditing is true,
   * activates row edit mode instead of dispatching event.
   */
  private handleRowAction(actionId: string, row: Row<TData>): void {
    // Special case: built-in edit action triggers row edit mode
    if (actionId === 'edit' && this.enableRowEditing) {
      this.activateRowEdit(row);
      return;
    }

    const event = new CustomEvent<RowActionEvent<TData>>('ui-row-action', {
      detail: {
        actionId,
        row: row.original,
        rowId: row.id,
      },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  // ==========================================================================
  // Inline row editing methods (ROWEDIT-01 through ROWEDIT-06)
  // ==========================================================================

  /**
   * Activate row-level edit mode for a given row.
   *
   * - Cancels any active cell edit (mutual exclusion)
   * - Cancels any other row's edit mode (ROWEDIT-06: only one row at a time)
   * - Collects original values from all editable cells
   * - Sets _editingRow state to trigger re-render
   *
   * @param row - The TanStack Row to enter edit mode
   */
  private activateRowEdit(row: Row<TData>): void {
    // Mutual exclusion: cancel cell edit if active
    if (this._editingCell) {
      this.cancelCellEdit();
    }

    // ROWEDIT-06: only one row at a time
    if (this._editingRow && this._editingRow.rowId !== row.id) {
      this.cancelRowEdit();
    }

    // Already editing this row
    if (this._editingRow?.rowId === row.id) return;

    const table = this._tableInstance;
    if (!table) return;

    // Collect original values from all editable cells in this row
    const originalData: Record<string, unknown> = {};
    const visibleCells = row.getVisibleCells();
    for (const cell of visibleCells) {
      const meta = cell.column.columnDef.meta as LitUIColumnMeta<TData> | undefined;
      if (isColumnEditable(meta, row.original)) {
        originalData[cell.column.id] = cell.getValue();
      }
    }

    this._editingRow = {
      rowId: row.id,
      originalData,
      pendingValues: { ...originalData },
      errors: {},
    };
  }

  /**
   * Update a pending value for a column during row edit mode.
   * Clears any existing validation error for the column.
   *
   * @param columnId - The column being updated
   * @param value - The new pending value
   */
  private updateRowEditValue(columnId: string, value: unknown): void {
    if (!this._editingRow) return;

    this._editingRow = {
      ...this._editingRow,
      pendingValues: {
        ...this._editingRow.pendingValues,
        [columnId]: value,
      },
      errors: (() => {
        const errs = { ...this._editingRow!.errors };
        delete errs[columnId];
        return errs;
      })(),
    };
  }

  /**
   * Save the current row edit after validating all editable fields.
   *
   * - Validates ALL editable columns (ROWEDIT-04)
   * - If any fail, shows errors inline and stays in edit mode
   * - If all pass, dispatches ui-row-edit event (ROWEDIT-05) and exits edit mode
   */
  private saveRowEdit(): void {
    if (!this._editingRow) return;

    const table = this._tableInstance;
    if (!table) return;

    const row = table.getRowModel().rows.find((r) => r.id === this._editingRow!.rowId);
    if (!row) return;

    const rowData = row.original;
    const errors: Record<string, string> = {};

    // Validate ALL editable fields (ROWEDIT-04)
    const visibleCells = row.getVisibleCells();
    for (const cell of visibleCells) {
      const meta = cell.column.columnDef.meta as LitUIColumnMeta<TData> | undefined;
      if (!isColumnEditable(meta, rowData)) continue;
      if (!meta?.editValidate) continue;

      const pendingValue = this._editingRow.pendingValues[cell.column.id];
      const result = meta.editValidate(pendingValue, rowData);

      if (result === false) {
        errors[cell.column.id] = 'Invalid value';
      } else if (typeof result === 'object' && !result.valid) {
        errors[cell.column.id] = result.message ?? 'Invalid value';
      }
    }

    // If any validation errors, show them and stay in edit mode
    if (Object.keys(errors).length > 0) {
      this._editingRow = {
        ...this._editingRow,
        errors,
      };
      return;
    }

    // Dispatch ui-row-edit event (ROWEDIT-05)
    const detail: RowEditEvent<TData> = {
      row: rowData,
      rowId: this._editingRow.rowId,
      oldValues: this._editingRow.originalData,
      newValues: this._editingRow.pendingValues,
    };
    this.dispatchEvent(new CustomEvent('ui-row-edit', {
      detail,
      bubbles: true,
      composed: true,
    }));

    // Exit edit mode
    this._editingRow = null;
  }

  /**
   * Cancel the current row edit, reverting all pending changes.
   */
  private cancelRowEdit(): void {
    this._editingRow = null;
  }

  /**
   * Render selection banner or bulk actions toolbar.
   *
   * When bulkActions are configured and rows are selected, renders the
   * bulk actions toolbar (replaces the selection banner).
   * Otherwise, falls back to the simple "Select all X items" banner.
   */
  private renderSelectionBanner(table: Table<TData>): TemplateResult {
    if (!this.enableSelection) return html``;

    const selectedCount = Object.keys(this.rowSelection).length;

    // Render bulk actions toolbar when configured and rows are selected
    if (this.bulkActions.length > 0 && selectedCount > 0) {
      const isAllPageSelected = table.getIsAllPageRowsSelected();
      const totalCount = this.totalRowCount ?? this.data.length;
      const showSelectAll = isAllPageSelected && selectedCount < totalCount;

      return renderBulkActionsToolbar(
        selectedCount,
        this.bulkActions,
        (action) => this.handleBulkAction(action),
        () => this.clearSelection(table),
        showSelectAll ? `Select all ${totalCount.toLocaleString()} items` : undefined,
        showSelectAll ? () => this.handleSelectAll(table, totalCount) : undefined
      );
    }

    // Fallback: existing selection banner (no bulk actions configured)
    const isAllPageSelected = table.getIsAllPageRowsSelected();
    const totalCount = this.totalRowCount ?? this.data.length;

    // Only show banner when:
    // 1. All rows on current page are selected
    // 2. Not all rows in dataset are selected
    if (!isAllPageSelected || selectedCount >= totalCount) {
      return html``;
    }

    return html`
      <div class="selection-banner" role="status" aria-live="polite">
        <span class="selection-banner-text">
          ${selectedCount} items on this page selected.
        </span>
        <button
          type="button"
          class="selection-banner-link"
          @click=${() => this.handleSelectAll(table, totalCount)}
        >
          Select all ${totalCount.toLocaleString()} items
        </button>
      </div>
    `;
  }

  /**
   * Clear all row selection state.
   */
  private clearSelection(table: Table<TData>): void {
    table.resetRowSelection();
  }

  /**
   * Handle bulk action click.
   * If action requires confirmation, show dialog.
   * Otherwise dispatch event immediately.
   */
  private handleBulkAction(action: BulkAction): void {
    if (action.requiresConfirmation) {
      this._pendingBulkAction = action;
      return;
    }
    this.dispatchBulkAction(action);
  }

  /**
   * Dispatch ui-bulk-action event with selected row data.
   */
  private dispatchBulkAction(action: BulkAction): void {
    const table = this._tableInstance;
    if (!table) return;

    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((r) => r.original);

    const event = new CustomEvent<BulkActionEvent<TData>>('ui-bulk-action', {
      detail: {
        actionId: action.id,
        selectedRows,
        rowSelection: { ...this.rowSelection },
        selectedCount: selectedRows.length,
      },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  /**
   * Handle "Select all X items" click.
   * For client-side: selects all rows in data array.
   * For server-side: emits event for parent to handle.
   */
  private handleSelectAll(table: Table<TData>, totalCount: number): void {
    if (this.manualPagination) {
      // Server-side: emit event with intent
      const event = new CustomEvent('ui-select-all-requested', {
        detail: { totalCount },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    } else {
      // Client-side: select all rows
      table.toggleAllRowsSelected(true);
    }
  }

  /**
   * Compute CSS Grid template columns from column definitions.
   * Uses TanStack's column.getSize() when available for dynamic sizing.
   * Falls back to column definition sizes or minmax() for flexibility.
   *
   * @param table - Optional TanStack table instance for dynamic sizing
   */
  private getGridTemplateColumns(table?: Table<TData>): string {
    if (this.columns.length === 0) return '';

    // Actions column width (row actions buttons or row edit save/cancel)
    const actionsColumnSuffix = this.hasActionsColumn ? ' 72px' : '';

    // If we have a table instance, use TanStack's sizing
    if (table) {
      const headers = table.getFlatHeaders();
      const columns = headers
        .map((header) => {
          const size = header.getSize();
          return `${size}px`;
        })
        .join(' ');
      return columns + actionsColumnSuffix;
    }

    // Fallback for skeleton/loading states without table instance
    const columns = this.columns
      .map((col) => {
        // Check if we have a stored size in columnSizing state
        const colId = (col as { accessorKey?: string; id?: string }).accessorKey ??
                      (col as { id?: string }).id ?? '';
        const storedSize = this.columnSizing[colId];
        if (storedSize) {
          return `${storedSize}px`;
        }
        // Check for size in column definition
        const size = col.size;
        if (size) {
          return `${size}px`;
        }
        // Check for minSize/maxSize
        const minSize = col.minSize ?? 50;
        const maxSize = col.maxSize ?? 500;
        return `minmax(${minSize}px, ${maxSize}px)`;
      })
      .join(' ');
    return columns + actionsColumnSuffix;
  }

  /**
   * Get total row count for pagination display.
   * Uses totalRowCount prop for server-side, or filtered row count for client-side.
   */
  public getTotalRowCount(table: Table<TData>): number {
    if (this.manualPagination) {
      return this.totalRowCount ?? this.data.length;
    }
    // For client-side, use filtered row count
    return table.getFilteredRowModel().rows.length;
  }

  /**
   * Get page count based on mode.
   */
  public getPageCount(table: Table<TData>): number {
    if (this.manualPagination && this.pageCount !== undefined) {
      return this.pageCount;
    }
    return table.getPageCount();
  }

  /**
   * Render sort direction indicator with priority number for multi-sort.
   * @param direction - Current sort direction (false if unsorted, 'asc' or 'desc')
   * @param sortIndex - Sort priority index (-1 if not sorted, 0+ for priority)
   */
  private renderSortIndicator(
    direction: false | 'asc' | 'desc',
    sortIndex: number
  ): TemplateResult {
    const showPriority = sortIndex > 0; // Show priority number for secondary+ sorts

    return html`
      <span class="sort-indicator" aria-hidden="true">
        ${direction === 'asc'
          ? html`
              <svg viewBox="0 0 12 12" class="sort-icon">
                <path d="M6 3L10 9H2L6 3Z" fill="currentColor" />
              </svg>
            `
          : direction === 'desc'
            ? html`
                <svg viewBox="0 0 12 12" class="sort-icon">
                  <path d="M6 9L2 3H10L6 9Z" fill="currentColor" />
                </svg>
              `
            : html`
                <svg viewBox="0 0 12 12" class="sort-icon unsorted">
                  <path
                    d="M6 2L9 5H3L6 2ZM6 10L3 7H9L6 10Z"
                    fill="currentColor"
                    opacity="0.3"
                  />
                </svg>
              `}
        ${showPriority
          ? html`<span class="sort-priority">${sortIndex + 1}</span>`
          : nothing}
      </span>
    `;
  }

  /**
   * Render filter indicator icon when column has an active filter.
   * Shows a funnel icon with tooltip indicating the column is filtered.
   */
  private renderFilterIndicator(column: Column<TData, unknown>): TemplateResult {
    const filterValue = column.getFilterValue();

    // Don't show indicator if no filter value
    if (
      filterValue === undefined ||
      filterValue === null ||
      filterValue === '' ||
      (Array.isArray(filterValue) && filterValue.length === 0)
    ) {
      return html``;
    }

    return html`
      <span
        class="filter-indicator"
        aria-label="Column is filtered"
        title="Column has active filter"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M1.5 1.5h13L9 7v5.5l-2 1.5V7L1.5 1.5z" fill="currentColor" />
        </svg>
      </span>
    `;
  }

  /**
   * Render resize handle for column resizing.
   * Returns empty template if column cannot be resized.
   *
   * @param header - The header to render resize handle for
   */
  private renderResizeHandle(header: Header<TData, unknown>): TemplateResult {
    if (!header.column.getCanResize()) {
      return html``;
    }

    const isResizing = header.column.getIsResizing();
    const handler = header.getResizeHandler();
    const columnHeader = header.column.columnDef.header;
    const headerLabel = typeof columnHeader === 'string' ? columnHeader : 'column';

    return html`
      <div
        class="column-resize-handle ${isResizing ? 'is-resizing' : ''}"
        @mousedown=${handler}
        @touchstart=${handler}
        @dblclick=${(e: MouseEvent) => {
          e.stopPropagation();
          this.autoFitColumn(header.column);
        }}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const delta = e.key === 'ArrowLeft' ? -10 : 10;
            const minSize = header.column.columnDef.minSize ?? 50;
            const maxSize = header.column.columnDef.maxSize ?? 500;
            const newSize = Math.max(
              minSize,
              Math.min(maxSize, header.column.getSize() + delta)
            );
            this.columnSizing = {
              ...this.columnSizing,
              [header.column.id]: newSize,
            };
          }
        }}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow="${header.column.getSize()}"
        aria-valuemin="${header.column.columnDef.minSize ?? 50}"
        aria-valuemax="${header.column.columnDef.maxSize ?? 500}"
        aria-label="Resize ${headerLabel} column"
        tabindex="0"
      ></div>
    `;
  }

  /**
   * Auto-fit column width to content.
   * Measures visible cells and adjusts column width to fit content.
   *
   * NOTE: With virtualization, only visible rows can be measured.
   * This provides "best effort" sizing based on visible content.
   * For large datasets, the width may not fit all data perfectly.
   * Manual resize is available for fine-tuning.
   *
   * @param column - The column to auto-fit
   */
  private autoFitColumn(column: Column<TData, unknown>): void {
    // Get all visible cells for this column
    const columnCells = this.shadowRoot?.querySelectorAll(
      `.data-table-cell[data-column-id="${column.id}"]`
    );

    if (!columnCells || columnCells.length === 0) return;

    // Initialize max width
    let maxWidth = 0;

    // Measure header content
    const headerCell = this.shadowRoot?.querySelector(
      `.data-table-header-cell[data-column-id="${column.id}"]`
    );
    if (headerCell) {
      const headerContent = headerCell.querySelector('.header-content');
      if (headerContent) {
        // Add padding (32px = 16px left + 16px right from cell padding)
        maxWidth = Math.max(maxWidth, headerContent.scrollWidth + 32);
      }
    }

    // Measure visible body cells (virtualized)
    columnCells.forEach((cell) => {
      maxWidth = Math.max(maxWidth, cell.scrollWidth + 32);
    });

    // Apply min/max constraints (COL-03: minimum 50px)
    const minSize = column.columnDef.minSize ?? 50;
    const maxSize = column.columnDef.maxSize ?? 500;
    const fitWidth = Math.max(minSize, Math.min(maxSize, maxWidth));

    // Update sizing state
    this.columnSizing = {
      ...this.columnSizing,
      [column.id]: fitWidth,
    };
  }

  // ==========================================================================
  // Drag-and-drop column reorder methods
  // ==========================================================================

  /**
   * Handle drag start on column header.
   * Sets dragged column ID and configures drag transfer data.
   */
  private handleDragStart(e: DragEvent, columnId: string): void {
    if (!this.enableColumnReorder) return;

    this._draggedColumnId = columnId;
    e.dataTransfer?.setData('text/plain', columnId);
    e.dataTransfer!.effectAllowed = 'move';

    // Add dragging class after a frame (prevents immediate cancel)
    requestAnimationFrame(() => {
      this.dataset.dragging = 'true';
    });
  }

  /**
   * Handle drag over on column header.
   * Sets drop target for visual indicator.
   */
  private handleDragOver(e: DragEvent, columnId: string): void {
    if (!this.enableColumnReorder || !this._draggedColumnId) return;
    if (columnId === this._draggedColumnId) return;

    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    this._dropTargetColumnId = columnId;
  }

  /**
   * Handle drag leave on column header.
   * Clears drop target if leaving the header cell entirely.
   */
  private handleDragLeave(e: DragEvent): void {
    // Only clear if leaving the header cell entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget?.closest('.data-table-header-cell')) {
      this._dropTargetColumnId = null;
    }
  }

  /**
   * Handle drop on column header.
   * Reorders columns by moving dragged column to target position.
   */
  private handleDrop(e: DragEvent, targetColumnId: string, table: Table<TData>): void {
    e.preventDefault();
    if (!this._draggedColumnId || this._draggedColumnId === targetColumnId) {
      this.resetDragState();
      return;
    }

    // Get current column order (or default from visible columns)
    const currentOrder = this.columnOrder.length > 0
      ? [...this.columnOrder]
      : table.getAllLeafColumns().map((c) => c.id);

    // Find indices
    const draggedIndex = currentOrder.indexOf(this._draggedColumnId);
    const targetIndex = currentOrder.indexOf(targetColumnId);

    if (draggedIndex === -1 || targetIndex === -1) {
      this.resetDragState();
      return;
    }

    // Reorder: remove dragged, insert at target position
    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(targetIndex, 0, this._draggedColumnId);

    // Update state and dispatch event
    this.columnOrder = currentOrder;
    this.dispatchColumnOrderChange(currentOrder);
    this.resetDragState();
  }

  /**
   * Handle drag end on column header.
   * Cleans up drag state regardless of drop success.
   */
  private handleDragEnd(): void {
    this.resetDragState();
  }

  /**
   * Reset drag state after drag operation completes.
   */
  private resetDragState(): void {
    this._draggedColumnId = null;
    this._dropTargetColumnId = null;
    delete this.dataset.dragging;
  }

  /**
   * Render a header cell using flexRender.
   * Sortable headers have click handlers and visual indicators.
   * Draggable headers support column reordering via drag-and-drop.
   */
  private renderHeaderCell(
    header: Header<TData, unknown>,
    colIndex: number,
    table: Table<TData>
  ): TemplateResult {
    const headerContent = header.isPlaceholder
      ? nothing
      : flexRender(header.column.columnDef.header, header.getContext());

    const canSort = header.column.getCanSort();
    const sortDirection = header.column.getIsSorted(); // false | 'asc' | 'desc'
    const sortIndex = header.column.getSortIndex(); // -1 if not sorted, 0+ for priority
    const isResizing = header.column.getIsResizing();
    const columnId = header.column.id;

    // Drag state for visual feedback
    const isDragging = this._draggedColumnId === columnId;
    const isDropTarget = this._dropTargetColumnId === columnId;

    // Disable drag during resize operation
    const canDrag = this.enableColumnReorder && !isResizing;

    // Only set aria-sort on primary sorted column (sortIndex === 0)
    const ariaSort =
      sortDirection && sortIndex === 0
        ? sortDirection === 'asc'
          ? 'ascending'
          : 'descending'
        : nothing;

    // Build class list
    const classes = [
      'data-table-header-cell',
      canSort ? 'sortable' : '',
      isDragging ? 'is-dragging' : '',
      isDropTarget ? 'drop-target' : '',
    ].filter(Boolean).join(' ');

    return html`
      <div
        role="columnheader"
        aria-colindex="${colIndex + 1}"
        aria-sort=${ariaSort}
        class="${classes}"
        id="${this.tableId}-header-${header.id}"
        data-column-id="${columnId}"
        tabindex="-1"
        draggable="${canDrag ? 'true' : 'false'}"
        @click=${canSort ? header.column.getToggleSortingHandler() : nothing}
        @dragstart=${canDrag ? (e: DragEvent) => this.handleDragStart(e, columnId) : nothing}
        @dragover=${canDrag ? (e: DragEvent) => this.handleDragOver(e, columnId) : nothing}
        @dragleave=${canDrag ? (e: DragEvent) => this.handleDragLeave(e) : nothing}
        @drop=${canDrag ? (e: DragEvent) => this.handleDrop(e, columnId, table) : nothing}
        @dragend=${canDrag ? () => this.handleDragEnd() : nothing}
      >
        <span class="header-content">${headerContent}</span>
        ${canSort ? this.renderSortIndicator(sortDirection, sortIndex) : nothing}
        ${this.renderFilterIndicator(header.column)}
        ${this.renderResizeHandle(header)}
      </div>
    `;
  }

  /**
   * Render a data cell using flexRender.
   * Supports edit mode rendering with appropriate input type,
   * editable indicators, and inline validation errors.
   *
   * - View mode: shows cell content with pencil indicator for editable cells (EDIT-01)
   * - Edit mode: renders native input via renderEditInput (EDIT-03)
   * - Validation errors appear below cell without changing row height (EDIT-05)
   */
  private renderCell(
    cell: Cell<TData, unknown>,
    rowIndex: number,
    colIndex: number
  ): TemplateResult {
    const meta = cell.column.columnDef.meta as LitUIColumnMeta<TData> | undefined;
    const rowData = cell.row.original;
    const isEditable = isColumnEditable(meta, rowData);
    const isCellEditing = this._editingCell?.rowId === cell.row.id
      && this._editingCell?.columnId === cell.column.id;
    const isRowEditing = this._editingRow?.rowId === cell.row.id;
    const isFocused =
      this._focusedCell.row === rowIndex && this._focusedCell.col === colIndex;

    // Build CSS class list
    const classes = [
      'data-table-cell',
      isEditable ? 'editable' : '',
      isCellEditing ? 'editing' : '',
      isRowEditing && isEditable ? 'editing' : '',
    ].filter(Boolean).join(' ');

    // Row edit mode: all editable cells become inputs simultaneously (ROWEDIT-02)
    if (isRowEditing && isEditable) {
      const editType = meta?.editType ?? 'text';
      const pendingValue = this._editingRow!.pendingValues[cell.column.id] ?? cell.getValue();
      const fieldError = this._editingRow!.errors[cell.column.id] ?? null;

      return html`
        <div
          role="gridcell"
          aria-colindex="${colIndex + 1}"
          class="${classes}"
          data-column-id="${cell.column.id}"
          tabindex="${isFocused ? '0' : '-1'}"
        >
          ${renderEditInput(editType, pendingValue, {
            editOptions: meta?.editOptions,
            validationError: fieldError,
          }, {
            onCommit: (value: unknown) => this.updateRowEditValue(cell.column.id, value),
            onCancel: () => {}, // No individual cancel in row mode - use row cancel button
          })}
          ${fieldError ? html`
            <span class="cell-edit-error" role="alert">${fieldError}</span>
          ` : nothing}
        </div>
      `;
    }

    if (isCellEditing) {
      // Render edit input instead of cell content (EDIT-03)
      const editType = meta?.editType ?? 'text';
      const currentValue = this._editingCell!.originalValue;
      return html`
        <div
          role="gridcell"
          aria-colindex="${colIndex + 1}"
          class="${classes}"
          data-column-id="${cell.column.id}"
          tabindex="${isFocused ? '0' : '-1'}"
        >
          ${renderEditInput(editType, currentValue, {
            editOptions: meta?.editOptions,
            validationError: this._cellValidationError,
          }, {
            onCommit: (value: unknown) => this.commitCellEdit(value),
            onCancel: () => this.cancelCellEdit(),
          })}
        </div>
      `;
    }

    // Normal view mode
    const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());
    return html`
      <div
        role="gridcell"
        aria-colindex="${colIndex + 1}"
        class="${classes}"
        data-column-id="${cell.column.id}"
        tabindex="${isFocused ? '0' : '-1'}"
        @click=${() => this.handleCellClick(rowIndex, colIndex)}
      >
        ${cellContent}
        ${isEditable ? renderEditableIndicator() : nothing}
      </div>
    `;
  }

  /**
   * Render a data row.
   */
  private renderRow(row: Row<TData>, rowIndex: number): TemplateResult {
    const isSelected = row.getIsSelected();

    return html`
      <div
        role="row"
        aria-rowindex="${rowIndex + 2}"
        aria-selected="${isSelected}"
        class="data-table-row ${isSelected ? 'selected' : ''}"
        data-row-id="${row.id}"
      >
        ${row.getVisibleCells().map((cell, colIndex) =>
          this.renderCell(cell, rowIndex, colIndex)
        )}
      </div>
    `;
  }

  /**
   * Render toolbar with column picker and slot for custom controls.
   * Only renders if showColumnPicker is true or there's slotted content.
   */
  private renderToolbar(table: Table<TData>): TemplateResult {
    if (!this.showColumnPicker) {
      return html``;
    }

    return html`
      <div class="data-table-toolbar">
        <slot name="toolbar-start"></slot>
        <div class="toolbar-spacer"></div>
        <slot name="toolbar-end">
          ${this.showColumnPicker ? renderColumnPicker(table) : nothing}
        </slot>
      </div>
    `;
  }

  /**
   * Render the header row group.
   */
  private renderHeader(table: Table<TData>): TemplateResult {
    return html`
      <div class="data-table-header" role="rowgroup">
        ${table.getHeaderGroups().map(
          (headerGroup) => html`
            <div
              role="row"
              aria-rowindex="1"
              class="data-table-row header-row"
              style="grid-template-columns: ${this.getGridTemplateColumns(table)}"
            >
              ${headerGroup.headers.map((header, colIndex) =>
                this.renderHeaderCell(header, colIndex, table)
              )}
              ${this.hasActionsColumn ? html`
                <div role="columnheader" class="data-table-header-cell row-actions-header" aria-label="Actions">
                </div>
              ` : nothing}
            </div>
          `
        )}
      </div>
    `;
  }

  /**
   * Render skeleton rows during initial loading.
   */
  private renderSkeletonRows(): TemplateResult {
    const gridTemplateColumns = this.getGridTemplateColumns();

    return html`
      <div
        class="data-table-body skeleton-container"
        role="rowgroup"
        aria-busy="true"
        aria-label="Loading data"
      >
        ${Array.from({ length: this.skeletonRows }).map(
          (_, rowIndex) => html`
            <div
              class="data-table-row skeleton-row"
              role="row"
              aria-rowindex="${rowIndex + 2}"
              style="grid-template-columns: ${gridTemplateColumns}"
            >
              ${this.columns.map(
                (_, colIndex) => html`
                  <div
                    class="data-table-cell skeleton-cell"
                    role="gridcell"
                    aria-colindex="${colIndex + 1}"
                  >
                    <div class="skeleton-pulse"></div>
                  </div>
                `
              )}
            </div>
          `
        )}
      </div>
    `;
  }

  /**
   * Render empty state icon (box with X).
   */
  private renderEmptyIcon(): TemplateResult {
    return html`
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        width="48"
        height="48"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2" />
        <line x1="9" y1="9" x2="15" y2="15" stroke-width="2" />
        <line x1="15" y1="9" x2="9" y2="15" stroke-width="2" />
      </svg>
    `;
  }

  /**
   * Render search icon for no-matches state.
   */
  private renderSearchIcon(): TemplateResult {
    return html`
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        width="48"
        height="48"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" stroke-width="2" />
        <path d="M21 21l-4.35-4.35" stroke-width="2" />
      </svg>
    `;
  }

  /**
   * Render empty state when no data is available.
   */
  private renderEmptyState(): TemplateResult {
    const isNoMatches = this.emptyStateType === 'no-matches';
    const message = isNoMatches ? this.noMatchesMessage : this.noDataMessage;
    const description = isNoMatches
      ? 'Try adjusting your search or filter criteria'
      : 'Data will appear here once available';

    return html`
      <div class="data-table-body empty-state-container" role="rowgroup">
        <div class="empty-state" role="row" aria-rowindex="2">
          <div
            role="gridcell"
            aria-colspan="${this.columns.length}"
            class="empty-state-cell"
          >
            <div class="empty-state-icon">
              ${isNoMatches ? this.renderSearchIcon() : this.renderEmptyIcon()}
            </div>
            <p class="empty-state-message">${message}</p>
            <p class="empty-state-description">${description}</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render updating overlay during data updates.
   */
  private renderUpdatingOverlay(): TemplateResult {
    if (this.loading !== 'updating') {
      return html``;
    }

    return html`
      <div class="updating-overlay" aria-hidden="true">
        <div class="updating-spinner"></div>
      </div>
    `;
  }

  /**
   * Render error state with retry button.
   */
  private renderErrorState(): TemplateResult {
    if (!this.errorState) return html``;

    return html`
      <div class="error-state-container">
        <div class="error-state" role="alert" aria-live="polite">
          <div class="error-state-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <p class="error-state-message">${this.errorState.message}</p>
          <p class="error-state-description">Unable to load data. Please try again.</p>
          ${this.errorState.canRetry ? html`
            <button
              type="button"
              class="error-retry-button"
              @click=${this.handleRetry}
            >
              Retry
            </button>
          ` : nothing}
        </div>
      </div>
    `;
  }

  /**
   * Render the body row group with virtualization.
   */
  private renderBody(table: Table<TData>): TemplateResult {
    // Show error state first if present
    if (this.errorState) {
      return this.renderErrorState();
    }

    // Show skeleton during initial loading
    if (this.loading === 'loading') {
      return this.renderSkeletonRows();
    }

    // Show empty state when no data
    if (this.data.length === 0) {
      return this.renderEmptyState();
    }

    // Use virtual scrolling when virtualizer is available
    if (this.virtualizer) {
      return this.renderVirtualizedBody(table);
    }

    // Fallback: render all rows (for SSR or before virtualizer initializes)
    return this.renderAllRows(table);
  }

  /**
   * Render all rows without virtualization (fallback for SSR/small datasets).
   * Supports expandable rows with detail panels.
   */
  private renderAllRows(table: Table<TData>): TemplateResult {
    const rows = table.getRowModel().rows;
    const gridTemplateColumns = this.getGridTemplateColumns(table);

    return html`
      <div
        class="data-table-body"
        role="rowgroup"
        style="max-height: ${this.maxHeight}; overflow-y: auto;"
      >
        ${rows.map((row, rowIndex) => {
          const isSelected = row.getIsSelected();
          const isRowEditing = this._editingRow?.rowId === row.id;
          const isExpanded = this.renderDetailContent && row.getIsExpanded();
          return html`
            <div class="virtual-row-wrapper">
              <div
                role="row"
                aria-rowindex="${rowIndex + 2}"
                aria-selected="${isSelected}"
                class="data-table-row ${isSelected ? 'selected' : ''} ${isRowEditing ? 'row-editing' : ''}"
                style="grid-template-columns: ${gridTemplateColumns}"
                data-row-id="${row.id}"
              >
                ${row.getVisibleCells().map((cell, colIndex) =>
                  this.renderCell(cell, rowIndex, colIndex)
                )}
                ${this.hasActionsColumn ? html`
                  <div class="data-table-cell row-actions-cell" role="gridcell">
                    <div class="row-actions-content">
                      ${isRowEditing
                        ? renderRowEditActions(true, {
                            onEdit: () => this.activateRowEdit(row),
                            onSave: () => this.saveRowEdit(),
                            onCancel: () => this.cancelRowEdit(),
                          })
                        : this.rowActions.length > 0
                          ? renderRowActions(row, this.rowActions, (actionId, r) => this.handleRowAction(actionId, r))
                          : this.enableRowEditing
                            ? renderRowEditActions(false, {
                                onEdit: () => this.activateRowEdit(row),
                                onSave: () => this.saveRowEdit(),
                                onCancel: () => this.cancelRowEdit(),
                              })
                            : nothing
                      }
                    </div>
                  </div>
                ` : nothing}
              </div>
              ${isExpanded && this.renderDetailContent
                ? renderDetailPanel(row, this.renderDetailContent)
                : nothing}
            </div>
          `;
        })}
      </div>
      ${this.renderUpdatingOverlay()}
    `;
  }

  /**
   * Render virtualized rows for efficient 100K+ row handling.
   * Only renders visible rows plus overscan buffer.
   * When expandable rows are enabled, wraps each row+detail in a measured wrapper.
   */
  private renderVirtualizedBody(table: Table<TData>): TemplateResult {
    const virtualizer = this.virtualizer!.getVirtualizer();
    const virtualItems = virtualizer.getVirtualItems();
    const totalHeight = virtualizer.getTotalSize();
    const rows = table.getRowModel().rows;
    const gridTemplateColumns = this.getGridTemplateColumns(table);
    const hasExpanding = !!this.renderDetailContent;

    return html`
      <div
        class="data-table-body"
        role="rowgroup"
        ${ref(this.scrollRef)}
        style="max-height: ${this.maxHeight}; overflow-y: auto;"
      >
        <div class="virtual-content" style="height: ${totalHeight}px; position: relative;">
          ${virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index];
            if (!row) return nothing;

            const isSelected = row.getIsSelected();
            const isRowEditing = this._editingRow?.rowId === row.id;
            const isExpanded = hasExpanding && row.getIsExpanded();

            // Row content (data cells + optional actions column)
            const rowContent = html`
              <div
                role="row"
                aria-rowindex="${virtualRow.index + 2}"
                aria-selected="${isSelected}"
                class="data-table-row virtual-row ${isSelected ? 'selected' : ''} ${isRowEditing ? 'row-editing' : ''}"
                style="
                  grid-template-columns: ${gridTemplateColumns};
                  height: ${this.rowHeight}px;
                "
                data-row-id="${row.id}"
              >
                ${row.getVisibleCells().map((cell, colIndex) =>
                  this.renderCell(cell, virtualRow.index, colIndex)
                )}
                ${this.hasActionsColumn ? html`
                  <div class="data-table-cell row-actions-cell" role="gridcell">
                    <div class="row-actions-content">
                      ${isRowEditing
                        ? renderRowEditActions(true, {
                            onEdit: () => this.activateRowEdit(row),
                            onSave: () => this.saveRowEdit(),
                            onCancel: () => this.cancelRowEdit(),
                          })
                        : this.rowActions.length > 0
                          ? renderRowActions(row, this.rowActions, (actionId, r) => this.handleRowAction(actionId, r))
                          : this.enableRowEditing
                            ? renderRowEditActions(false, {
                                onEdit: () => this.activateRowEdit(row),
                                onSave: () => this.saveRowEdit(),
                                onCancel: () => this.cancelRowEdit(),
                              })
                            : nothing
                      }
                    </div>
                  </div>
                ` : nothing}
              </div>
              ${isExpanded && this.renderDetailContent
                ? renderDetailPanel(row, this.renderDetailContent)
                : nothing}
            `;

            // Wrap in measured container for dynamic heights (expandable)
            // or use direct absolute positioning (fixed height)
            return html`
              <div
                class="virtual-row-wrapper"
                data-index="${virtualRow.index}"
                style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  transform: translateY(${virtualRow.start}px);
                "
                ${hasExpanding
                  ? ref((el: Element | undefined) => { if (el) virtualizer.measureElement(el); })
                  : nothing}
              >
                ${rowContent}
              </div>
            `;
          })}
        </div>
      </div>
      ${this.renderUpdatingOverlay()}
    `;
  }

  static override styles = [
    ...tailwindBaseStyles,
    columnPickerStyles,
    inlineEditingStyles,
    cellRendererStyles,
    rowActionsStyles,
    bulkActionsStyles,
    expandColumnStyles,
    css`
      :host {
        display: block;
        --ui-data-table-row-height: 48px;
        --ui-data-table-header-height: 48px;
        --ui-data-table-cell-padding: 0.75rem 1rem;
        --ui-data-table-font-size: 0.875rem;
        --ui-data-table-header-font-weight: 500;
      }

      .data-table-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        border: 1px solid var(--ui-data-table-border-color);
        border-radius: var(--ui-radius, 0.5rem);
        overflow: hidden;
      }

      /* Toolbar styles */
      .data-table-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-bottom: 1px solid var(--ui-data-table-border-color);
        background: var(--ui-data-table-header-bg);
      }

      .toolbar-spacer {
        flex: 1;
      }

      .data-table-header {
        flex-shrink: 0;
        position: sticky;
        top: 0;
        z-index: 10;
        background: var(--ui-data-table-header-bg);
        border-bottom: 1px solid var(--ui-data-table-border-color);
      }

      .data-table-row {
        display: grid;
        min-height: var(--ui-data-table-row-height);
        align-items: center;
      }

      .data-table-row:not(.header-row) {
        background: var(--ui-data-table-row-bg);
        border-bottom: 1px solid var(--ui-data-table-border-color);
      }

      .data-table-row:not(.header-row):last-child {
        border-bottom: none;
      }

      .data-table-row:not(.header-row):hover {
        background: var(--ui-data-table-row-hover-bg);
      }

      .data-table-cell {
        padding: var(--ui-data-table-cell-padding);
        font-size: var(--ui-data-table-font-size);
        color: var(--ui-data-table-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        outline: none;
      }

      .data-table-cell:focus-visible {
        outline: 2px solid var(--color-primary, var(--ui-color-primary));
        outline-offset: -2px;
        border-radius: 2px;
      }

      .data-table-header-cell {
        position: relative; /* For resize handle positioning */
        padding: var(--ui-data-table-cell-padding);
        font-size: var(--ui-data-table-font-size);
        font-weight: var(--ui-data-table-header-font-weight);
        color: var(--ui-data-table-header-text);
        text-align: left;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .data-table-header-cell .header-content {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Sortable header styles */
      .data-table-header-cell.sortable {
        cursor: pointer;
        user-select: none;
      }

      .data-table-header-cell.sortable:hover {
        background: var(--ui-data-table-header-hover-bg);
      }

      .data-table-header-cell.sortable:focus-visible {
        outline: 2px solid var(--color-primary, var(--ui-color-primary));
        outline-offset: -2px;
        border-radius: 2px;
      }

      /* Column resize handle styles */
      .column-resize-handle {
        position: absolute;
        right: 0;
        top: 0;
        height: 100%;
        width: 4px;
        cursor: col-resize;
        user-select: none;
        touch-action: none;
        background: transparent;
        z-index: 1;
      }

      .column-resize-handle:hover,
      .column-resize-handle.is-resizing {
        background: var(--color-primary, var(--ui-color-primary));
      }

      .column-resize-handle:focus-visible {
        outline: 2px solid var(--color-primary, var(--ui-color-primary));
        outline-offset: -2px;
      }

      /* Prevent text selection during resize */
      :host([data-resizing]) {
        user-select: none;
        cursor: col-resize;
      }

      :host([data-resizing]) * {
        cursor: col-resize;
      }

      /* Column drag-and-drop reorder styles */
      .data-table-header-cell[draggable="true"] {
        cursor: grab;
      }

      .data-table-header-cell.is-dragging {
        opacity: 0.5;
        cursor: grabbing;
      }

      .data-table-header-cell.drop-target {
        background: var(--color-primary-100, color-mix(in oklch, var(--color-primary, var(--ui-color-primary)) 10%, transparent));
        border-left: 2px solid var(--color-primary, var(--ui-color-primary));
      }

      :host([data-dragging]) {
        user-select: none;
      }

      :host([data-dragging]) .data-table-header-cell {
        cursor: grabbing;
      }

      /* Sort indicator styles */
      .sort-indicator {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        flex-shrink: 0;
      }

      .sort-icon {
        width: 12px;
        height: 12px;
      }

      .sort-icon.unsorted {
        opacity: 0.3;
      }

      .sort-priority {
        font-size: 10px;
        font-weight: 600;
        min-width: 14px;
        height: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--color-primary, var(--ui-color-primary));
        color: var(--color-primary-foreground);
        border-radius: 50%;
      }

      /* Filter indicator styles */
      .filter-indicator {
        display: inline-flex;
        align-items: center;
        color: var(--color-primary, var(--ui-color-primary));
        margin-left: 4px;
      }

      .filter-indicator svg {
        width: 12px;
        height: 12px;
      }

      /* Selection column styles */
      .data-table-cell:first-child lui-checkbox,
      .data-table-header-cell:first-child lui-checkbox {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Selected row highlight */
      .data-table-row.selected {
        background: var(--ui-data-table-selected-bg, color-mix(in oklch, var(--color-primary, var(--ui-color-primary)) 10%, transparent));
      }

      .data-table-row.selected:hover {
        background: var(--ui-data-table-selected-hover-bg, color-mix(in oklch, var(--color-primary, var(--ui-color-primary)) 15%, transparent));
      }

      /* Selection banner styles */
      .selection-banner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: var(--ui-data-table-banner-bg, color-mix(in oklch, var(--color-primary, var(--ui-color-primary)) 8%, var(--color-background, white)));
        border-bottom: 1px solid var(--ui-data-table-border-color);
        font-size: 0.875rem;
        color: var(--ui-data-table-text-color);
      }

      .selection-banner-link {
        background: none;
        border: none;
        color: var(--color-primary, var(--ui-color-primary));
        font-weight: 500;
        cursor: pointer;
        text-decoration: underline;
        text-underline-offset: 2px;
      }

      .selection-banner-link:hover {
        text-decoration: none;
      }

      .selection-banner-link:focus-visible {
        outline: 2px solid var(--color-primary, var(--ui-color-primary));
        outline-offset: 2px;
        border-radius: 2px;
      }

      .data-table-body {
        flex: 1;
        overflow-y: auto;
        overflow-x: auto;
      }

      /* Sticky first column styles */
      :host([sticky-first-column]) .data-table-cell:first-child,
      :host([sticky-first-column]) .data-table-header-cell:first-child {
        position: sticky;
        left: 0;
        background: inherit;
      }

      :host([sticky-first-column]) .data-table-cell:first-child {
        z-index: 2;
        background: var(--ui-data-table-row-bg);
      }

      :host([sticky-first-column]) .data-table-row:hover .data-table-cell:first-child {
        background: var(--ui-data-table-row-hover-bg);
      }

      :host([sticky-first-column]) .data-table-row.selected .data-table-cell:first-child {
        background: var(--ui-data-table-selected-bg, color-mix(in oklch, var(--color-primary, var(--ui-color-primary)) 10%, transparent));
      }

      :host([sticky-first-column]) .data-table-header-cell:first-child {
        z-index: 11; /* Above sticky header row z-index (10) */
        background: var(--ui-data-table-header-bg);
      }

      /* Shadow hint for sticky column edge */
      :host([sticky-first-column]) .data-table-cell:first-child::after,
      :host([sticky-first-column]) .data-table-header-cell:first-child::after {
        content: '';
        position: absolute;
        top: 0;
        right: -8px;
        bottom: 0;
        width: 8px;
        pointer-events: none;
        background: var(--ui-data-table-sticky-shadow);
      }

      /* Virtual scrolling styles */
      .virtual-content {
        width: 100%;
      }

      .virtual-row {
        /* Override last-child border-bottom rule for virtual rows */
        border-bottom: 1px solid var(--ui-data-table-border-color) !important;
      }

      /* Skeleton Loading Styles */
      .skeleton-cell {
        padding: var(--ui-data-table-cell-padding);
      }

      .skeleton-pulse {
        height: 1em;
        background: linear-gradient(
          90deg,
          var(--ui-data-table-skeleton-base) 25%,
          var(--ui-data-table-skeleton-highlight) 50%,
          var(--ui-data-table-skeleton-base) 75%
        );
        background-size: 200% 100%;
        animation: skeleton-pulse 1.5s ease-in-out infinite;
        border-radius: 4px;
      }

      @keyframes skeleton-pulse {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .skeleton-pulse {
          animation: none;
          background: var(--ui-data-table-skeleton-base);
        }
      }

      /* Empty State Styles */
      .empty-state-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
      }

      .empty-state-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
      }

      .empty-state-icon {
        color: var(--ui-data-table-header-text);
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .empty-state-message {
        font-size: 1rem;
        font-weight: 500;
        color: var(--ui-data-table-text-color);
        margin: 0 0 0.5rem 0;
      }

      .empty-state-description {
        font-size: 0.875rem;
        color: var(--ui-data-table-header-text);
        margin: 0;
      }

      /* Error State Styles */
      .error-state-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        padding: 2rem;
      }

      .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        max-width: 300px;
      }

      .error-state-icon {
        color: var(--color-destructive, var(--ui-color-destructive));
        margin-bottom: 1rem;
      }

      .error-state-message {
        font-size: 1rem;
        font-weight: 500;
        color: var(--ui-data-table-text-color);
        margin: 0 0 0.5rem 0;
      }

      .error-state-description {
        font-size: 0.875rem;
        color: var(--ui-data-table-header-text);
        margin: 0 0 1rem 0;
      }

      .error-retry-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        background: transparent;
        border: 1px solid var(--ui-data-table-border-color);
        border-radius: var(--ui-radius, 0.375rem);
        color: var(--ui-data-table-text-color);
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease;
      }

      .error-retry-button:hover {
        background: var(--ui-data-table-row-hover-bg);
        border-color: var(--ui-data-table-header-text);
      }

      .error-retry-button:focus-visible {
        outline: 2px solid var(--color-primary, var(--ui-color-primary));
        outline-offset: 2px;
      }

      /* Updating Overlay Styles */
      .data-table-container {
        position: relative;
      }

      .updating-overlay {
        position: absolute;
        inset: 0;
        background: var(--ui-data-table-overlay-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20;
      }

      .updating-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--ui-data-table-border-color);
        border-top-color: var(--color-primary, var(--ui-color-primary));
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .updating-spinner {
          animation: none;
          border-top-color: var(--ui-data-table-border-color);
          opacity: 0.5;
        }
      }

      /* Screen reader only - for ARIA live region */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `,
  ];

  /**
   * Get effective columns including selection and expand columns if enabled.
   * The selection column is prepended first, then expand column.
   * Result order: [selection?, expand?, ...data columns]
   */
  private getEffectiveColumns(): ColumnDef<TData, unknown>[] {
    const cols = [...this.columns];

    // Prepend expand column if expandable rows enabled
    if (this.renderDetailContent) {
      cols.unshift(createExpandColumn<TData>());
    }

    // Prepend selection column if selection enabled (goes first)
    if (this.enableSelection) {
      cols.unshift(createSelectionColumn<TData>());
    }

    return cols;
  }

  override render() {
    // Get effective columns (includes selection column when enabled)
    const effectiveColumns = this.getEffectiveColumns();

    // Create table instance via controller (stored for use outside render)
    const table = this._tableInstance = this.tableController.table({
      columns: effectiveColumns,
      data: this.data,
      state: {
        sorting: this.sorting,
        rowSelection: this.rowSelection,
        columnFilters: this.columnFilters,
        globalFilter: this.globalFilter,
        pagination: this.pagination,
        columnVisibility: this.columnVisibility,
        columnSizing: this.columnSizing,
        columnSizingInfo: this._columnSizingInfo,
        columnOrder: this.columnOrder,
        expanded: this.expanded,
      },
      // Column sizing options
      enableColumnResizing: this.enableColumnResizing,
      columnResizeMode: this.columnResizeMode,
      columnResizeDirection: 'ltr',
      onColumnSizingChange: (updater) => {
        const newSizing =
          typeof updater === 'function' ? updater(this.columnSizing) : updater;
        this.columnSizing = newSizing;
        this.dispatchPreferenceChange();
      },
      onColumnSizingInfoChange: (updater) => {
        const newInfo =
          typeof updater === 'function' ? updater(this._columnSizingInfo) : updater;
        this._columnSizingInfo = newInfo;
        // Toggle data-resizing attribute on host for cursor styling
        if (newInfo.isResizingColumn) {
          this.dataset.resizing = 'true';
        } else {
          delete this.dataset.resizing;
        }
      },
      onSortingChange: (updater) => {
        const newSorting =
          typeof updater === 'function' ? updater(this.sorting) : updater;
        this.sorting = newSorting;
        this.dispatchSortChange(newSorting);
        // Trigger async fetch for server-side sorting
        if (this.dataCallback && this.manualSorting) {
          this.fetchData();
        }
      },
      onRowSelectionChange: (updater) => {
        const newSelection =
          typeof updater === 'function' ? updater(this.rowSelection) : updater;
        this.rowSelection = newSelection;
        this.dispatchSelectionChange(table, newSelection, 'user');
      },
      onColumnFiltersChange: (updater) => {
        const newFilters =
          typeof updater === 'function' ? updater(this.columnFilters) : updater;
        // Determine which column changed
        let changedColumn: string | undefined;
        if (newFilters.length !== this.columnFilters.length) {
          // Column added or removed - find the difference
          const oldIds = new Set(this.columnFilters.map((f) => f.id));
          const newIds = new Set(newFilters.map((f) => f.id));
          for (const id of newIds) {
            if (!oldIds.has(id)) {
              changedColumn = id;
              break;
            }
          }
          if (!changedColumn) {
            for (const id of oldIds) {
              if (!newIds.has(id)) {
                changedColumn = id;
                break;
              }
            }
          }
        } else {
          // Same count - find changed filter
          for (let i = 0; i < newFilters.length; i++) {
            const oldFilter = this.columnFilters.find((f) => f.id === newFilters[i].id);
            if (!oldFilter || JSON.stringify(oldFilter.value) !== JSON.stringify(newFilters[i].value)) {
              changedColumn = newFilters[i].id;
              break;
            }
          }
        }
        this.columnFilters = newFilters;
        this.dispatchFilterChange(newFilters, this.globalFilter, changedColumn);
        // Trigger debounced async fetch for server-side filtering
        if (this.dataCallback && this.manualFiltering) {
          this.debouncedFetchData();
        }
      },
      onGlobalFilterChange: (updater) => {
        const newGlobalFilter =
          typeof updater === 'function' ? updater(this.globalFilter) : updater;
        this.globalFilter = newGlobalFilter;
        this.dispatchFilterChange(this.columnFilters, newGlobalFilter, undefined);
        // Trigger debounced async fetch for server-side filtering
        if (this.dataCallback && this.manualFiltering) {
          this.debouncedFetchData();
        }
      },
      onPaginationChange: (updater) => {
        const newPagination =
          typeof updater === 'function' ? updater(this.pagination) : updater;
        this.pagination = newPagination;
        this.dispatchPaginationChange(newPagination);
        // Trigger async fetch for server-side pagination
        if (this.dataCallback && this.manualPagination) {
          this.fetchData();
        }
      },
      onColumnVisibilityChange: (updater) => {
        const newVisibility =
          typeof updater === 'function' ? updater(this.columnVisibility) : updater;
        this.columnVisibility = newVisibility;
        this.dispatchColumnVisibilityChange(newVisibility);
        this.dispatchPreferenceChange();
      },
      onColumnOrderChange: (updater) => {
        const newOrder =
          typeof updater === 'function' ? updater(this.columnOrder) : updater;
        this.columnOrder = newOrder;
        this.dispatchColumnOrderChange(newOrder);
        this.dispatchPreferenceChange();
      },
      getRowId: (row) => String(row[this.rowIdKey as keyof TData]),
      enableRowSelection: this.enableSelection,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: this.manualSorting ? undefined : getSortedRowModel(),
      getFilteredRowModel: this.manualFiltering ? undefined : getFilteredRowModel(),
      getPaginationRowModel: this.manualPagination ? undefined : getPaginationRowModel(),
      // Expanding options (EXPAND-01 to EXPAND-05)
      ...(this.renderDetailContent ? {
        enableExpanding: true,
        getRowCanExpand: () => true,
        getExpandedRowModel: getExpandedRowModel(),
        onExpandedChange: (updater: any) => {
          const next = typeof updater === 'function' ? updater(this.expanded) : updater;
          this.expanded = this.singleExpand ? this.enforceSingleExpand(next) : next;
          this.dispatchExpandedChange(this.expanded);
        },
      } : {}),
      manualSorting: this.manualSorting,
      manualFiltering: this.manualFiltering,
      manualPagination: this.manualPagination,
      pageCount: this.pageCount,
    });

    // Calculate total counts for ARIA
    const rowCount = this.data.length + 1; // +1 for header row
    const colCount = effectiveColumns.length + (this.hasActionsColumn ? 1 : 0);

    return html`
      <div
        class="data-table-container"
        role="grid"
        aria-rowcount="${rowCount}"
        aria-colcount="${colCount}"
        aria-label="${this.ariaLabel}"
        aria-busy="${this.loading !== 'idle' ? 'true' : 'false'}"
        @keydown=${this.handleKeyDown}
      >
        ${this.renderToolbar(table)}
        ${this.renderHeader(table)}
        ${this.renderSelectionBanner(table)}
        ${this.renderBody(table)}
        ${renderConfirmationDialog(
          this._pendingBulkAction,
          Object.keys(this.rowSelection).length,
          () => {
            this.dispatchBulkAction(this._pendingBulkAction!);
            this._pendingBulkAction = null;
          },
          () => {
            this._pendingBulkAction = null;
          }
        )}
        <div
          class="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          ${this._announcement}
        </div>
      </div>
    `;
  }
}

