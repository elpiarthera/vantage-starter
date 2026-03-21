/**
 * Inline editing utilities for lui-data-table.
 *
 * Provides edit cell renderers (text, number, select, date, checkbox),
 * helper functions for column editability checks, and CSS styles for
 * edit mode UI. This module is imported by the DataTable component
 * and kept separate for maintainability.
 */

import { html, css, nothing, type TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import type { RowData, LitUIColumnMeta, EditType } from './types.js';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check whether a column is editable for a given row.
 *
 * Centralizes the `boolean | function` check from column meta.
 * Returns false if meta is undefined or editable is not set.
 *
 * @param meta - Column meta configuration (may be undefined)
 * @param row - The row data to check against (for conditional editability)
 * @returns Whether the column is editable for this row
 */
export function isColumnEditable<TData extends RowData>(
  meta: LitUIColumnMeta<TData> | undefined,
  row: TData
): boolean {
  if (!meta?.editable) return false;
  if (typeof meta.editable === 'function') return meta.editable(row);
  return meta.editable === true;
}

// =============================================================================
// Edit Input Handlers Interface
// =============================================================================

/**
 * Callbacks for edit input interaction.
 * Provided by the DataTable component to handle commit/cancel flow.
 */
export interface EditInputHandlers {
  /** Commit the edit with the new value */
  onCommit: (value: unknown) => void;
  /** Cancel the edit and restore original value */
  onCancel: () => void;
}

/**
 * Options for rendering an edit input.
 */
export interface EditInputOptions {
  /** Options for select-type inputs */
  editOptions?: Array<{ label: string; value: string }>;
  /** Current validation error message (null if no error) */
  validationError?: string | null;
}

// =============================================================================
// Auto-Focus Directive
// =============================================================================

/**
 * Ref callback that auto-focuses an element on first render.
 * Uses requestAnimationFrame to ensure the element is in the DOM
 * before attempting focus.
 */
const autoFocus = (el: Element | undefined) => {
  if (el instanceof HTMLElement) {
    // Use rAF to ensure element is laid out before focusing.
    // Select text content for text/number inputs for easy replacement.
    requestAnimationFrame(() => {
      el.focus();
      if (el instanceof HTMLInputElement && (el.type === 'text' || el.type === 'number' || el.type === 'date')) {
        el.select();
      }
    });
  }
};

// =============================================================================
// Edit Input Renderers
// =============================================================================

/**
 * Guard flag to prevent double-commit from Enter + blur sequence.
 * When Enter commits, the input loses focus triggering blur.
 * This flag prevents the blur handler from committing again.
 */
let _isCommitting = false;

/**
 * Create a guarded commit function that prevents double-commit.
 * After committing via Enter key, blur fires but should not commit again.
 */
function createGuardedCommit(handlers: EditInputHandlers): (value: unknown) => void {
  return (value: unknown) => {
    if (_isCommitting) return;
    _isCommitting = true;
    handlers.onCommit(value);
    // Reset after microtask to allow next edit cycle
    requestAnimationFrame(() => {
      _isCommitting = false;
    });
  };
}

/**
 * Render the appropriate native HTML input for the given edit type.
 *
 * Each input type:
 * - Calls `e.stopPropagation()` on keydown events (prevents grid navigation)
 * - Handles Enter key to commit (except checkbox which commits on change)
 * - Handles Escape key to cancel
 * - Handles blur to commit (with double-commit guard)
 * - Auto-focuses when rendered via ref directive
 *
 * @param editType - The type of edit input to render
 * @param value - Current cell value
 * @param options - Additional options (select options, validation error)
 * @param handlers - Commit and cancel callbacks
 * @returns Lit TemplateResult for the edit input
 */
export function renderEditInput(
  editType: EditType,
  value: unknown,
  options: EditInputOptions,
  handlers: EditInputHandlers
): TemplateResult {
  const guardedCommit = createGuardedCommit(handlers);
  const errorClass = options.validationError ? ' has-error' : '';

  switch (editType) {
    case 'text':
      return html`
        <input
          type="text"
          class="cell-edit-input${errorClass}"
          .value=${String(value ?? '')}
          ${ref(autoFocus)}
          @keydown=${(e: KeyboardEvent) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              guardedCommit((e.target as HTMLInputElement).value);
            }
            if (e.key === 'Escape') {
              handlers.onCancel();
            }
          }}
          @blur=${(e: FocusEvent) => {
            guardedCommit((e.target as HTMLInputElement).value);
          }}
        />
        ${options.validationError ? html`<span class="cell-edit-error">${options.validationError}</span>` : nothing}
      `;

    case 'number':
      return html`
        <input
          type="number"
          class="cell-edit-input${errorClass}"
          .value=${String(value ?? '')}
          ${ref(autoFocus)}
          @keydown=${(e: KeyboardEvent) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              const numValue = (e.target as HTMLInputElement).valueAsNumber;
              guardedCommit(Number.isNaN(numValue) ? null : numValue);
            }
            if (e.key === 'Escape') {
              handlers.onCancel();
            }
          }}
          @blur=${(e: FocusEvent) => {
            const numValue = (e.target as HTMLInputElement).valueAsNumber;
            guardedCommit(Number.isNaN(numValue) ? null : numValue);
          }}
        />
        ${options.validationError ? html`<span class="cell-edit-error">${options.validationError}</span>` : nothing}
      `;

    case 'select':
      return html`
        <select
          class="cell-edit-select${errorClass}"
          ${ref(autoFocus)}
          @keydown=${(e: KeyboardEvent) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              guardedCommit((e.target as HTMLSelectElement).value);
            }
            if (e.key === 'Escape') {
              handlers.onCancel();
            }
          }}
          @change=${(e: Event) => {
            guardedCommit((e.target as HTMLSelectElement).value);
          }}
          @blur=${(e: FocusEvent) => {
            guardedCommit((e.target as HTMLSelectElement).value);
          }}
        >
          ${options.editOptions?.map(
            (opt) => html`
              <option value=${opt.value} ?selected=${opt.value === String(value)}>
                ${opt.label}
              </option>
            `
          )}
        </select>
        ${options.validationError ? html`<span class="cell-edit-error">${options.validationError}</span>` : nothing}
      `;

    case 'date':
      return html`
        <input
          type="date"
          class="cell-edit-input${errorClass}"
          .value=${String(value ?? '')}
          ${ref(autoFocus)}
          @keydown=${(e: KeyboardEvent) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              guardedCommit((e.target as HTMLInputElement).value);
            }
            if (e.key === 'Escape') {
              handlers.onCancel();
            }
          }}
          @blur=${(e: FocusEvent) => {
            guardedCommit((e.target as HTMLInputElement).value);
          }}
        />
        ${options.validationError ? html`<span class="cell-edit-error">${options.validationError}</span>` : nothing}
      `;

    case 'checkbox':
      return html`
        <input
          type="checkbox"
          class="cell-edit-checkbox"
          .checked=${Boolean(value)}
          ${ref(autoFocus)}
          @keydown=${(e: KeyboardEvent) => {
            e.stopPropagation();
            if (e.key === 'Escape') {
              handlers.onCancel();
            }
            // Checkbox commits on change, not Enter
          }}
          @change=${(e: Event) => {
            guardedCommit((e.target as HTMLInputElement).checked);
          }}
        />
      `;
  }
}

// =============================================================================
// Row Edit Action Handlers
// =============================================================================

/**
 * Callbacks for row-level edit action buttons.
 * Provided by the DataTable component to handle row edit lifecycle.
 */
export interface RowEditActionHandlers {
  /** Enter row edit mode */
  onEdit: () => void;
  /** Save all pending row changes (validates first) */
  onSave: () => void;
  /** Cancel row editing and revert all changes */
  onCancel: () => void;
}

/**
 * Render row-level edit action buttons.
 *
 * In view mode: renders a pencil icon button to enter row edit mode (ROWEDIT-01).
 * In edit mode: renders save (check) and cancel (X) icon buttons (ROWEDIT-03).
 *
 * All buttons call stopPropagation to prevent row click handlers from firing.
 *
 * @param isEditing - Whether this row is currently in edit mode
 * @param handlers - Callbacks for edit/save/cancel actions
 * @returns Lit TemplateResult with appropriate action buttons
 */
export function renderRowEditActions(
  isEditing: boolean,
  handlers: RowEditActionHandlers
): TemplateResult {
  if (isEditing) {
    return html`
      <div class="row-edit-actions">
        <button
          type="button"
          class="row-edit-save"
          @click=${(e: MouseEvent) => { e.stopPropagation(); handlers.onSave(); }}
          aria-label="Save row changes"
          title="Save"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 8 7 12 13 4"/>
          </svg>
        </button>
        <button
          type="button"
          class="row-edit-cancel"
          @click=${(e: MouseEvent) => { e.stopPropagation(); handlers.onCancel(); }}
          aria-label="Cancel row editing"
          title="Cancel"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="4" y1="4" x2="12" y2="12"/>
            <line x1="12" y1="4" x2="4" y2="12"/>
          </svg>
        </button>
      </div>
    `;
  }

  return html`
    <button
      type="button"
      class="row-edit-trigger"
      @click=${(e: MouseEvent) => { e.stopPropagation(); handlers.onEdit(); }}
      aria-label="Edit this row"
      title="Edit row"
    >
      <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
        <path d="M12.1 1.9a1.5 1.5 0 0 1 2.1 2.1L5.6 12.6l-3.2.8.8-3.2L12.1 1.9z"/>
      </svg>
    </button>
  `;
}

// =============================================================================
// Editable Cell Indicator
// =============================================================================

/**
 * Render a small pencil icon to indicate a cell is editable.
 * Shown on hover/focus via CSS (opacity transition).
 *
 * @returns Lit TemplateResult with pencil SVG icon
 */
export function renderEditableIndicator(): TemplateResult {
  return html`
    <span class="editable-indicator" aria-hidden="true">
      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
        <path d="M12.1 1.9a1.5 1.5 0 0 1 2.1 2.1L5.6 12.6l-3.2.8.8-3.2L12.1 1.9z"/>
      </svg>
    </span>
  `;
}

// =============================================================================
// Inline Editing Styles
// =============================================================================

/**
 * CSS styles for inline editing UI elements.
 *
 * Includes styles for:
 * - Edit inputs (text, number, date, select) - compact 32px height
 * - Checkbox input with accent color
 * - Validation error text (absolute positioned)
 * - Editable cell hover/focus indicators
 * - Pencil icon indicator
 * - Edit mode cell overrides
 * - Dark mode support
 */
export const inlineEditingStyles = css`
  /* ── Edit inputs (text, number, date, select) ── */
  .cell-edit-input,
  .cell-edit-select {
    width: 100%;
    height: 32px;
    padding: 4px 8px;
    font-size: var(--ui-data-table-font-size, 14px);
    font-family: inherit;
    border: 1px solid var(--color-primary, var(--ui-color-primary));
    border-radius: 4px;
    background: var(--ui-data-table-row-bg);
    color: var(--ui-data-table-text-color);
    outline: none;
    box-sizing: border-box;
  }

  .cell-edit-input:focus,
  .cell-edit-select:focus {
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--color-primary, var(--ui-color-primary)) 25%, transparent);
  }

  .cell-edit-input.has-error {
    border-color: var(--color-destructive, var(--ui-color-destructive));
  }

  .cell-edit-input.has-error:focus {
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--color-destructive, var(--ui-color-destructive)) 25%, transparent);
  }

  /* ── Checkbox input ── */
  .cell-edit-checkbox {
    width: 18px;
    height: 18px;
    accent-color: var(--color-primary, var(--ui-color-primary));
    cursor: pointer;
  }

  /* ── Validation error text ── */
  .cell-edit-error {
    position: absolute;
    bottom: -16px;
    left: 0;
    font-size: 11px;
    color: var(--color-destructive, var(--ui-color-destructive));
    white-space: nowrap;
    z-index: 10;
    pointer-events: none;
  }

  /* ── Editable cell indicator (pencil icon) ── */
  .editable-indicator {
    opacity: 0;
    transition: opacity 0.15s;
    margin-left: 4px;
    color: var(--color-muted-foreground);
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
  }

  .data-table-cell.editable:hover .editable-indicator,
  .data-table-cell.editable:focus-within .editable-indicator {
    opacity: 1;
  }

  /* ── Editable cell hover state (EDIT-01) ── */
  .data-table-cell.editable:hover {
    cursor: pointer;
    background: var(--ui-data-table-editable-hover-bg);
  }

  /* ── Cell in edit mode ── */
  .data-table-cell.editing {
    position: relative;
    overflow: visible;
    padding: 4px 8px;
  }

  /* ── Row edit action buttons (ROWEDIT-01, ROWEDIT-03) ── */
  .row-edit-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .row-edit-trigger,
  .row-edit-save,
  .row-edit-cancel {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: transparent;
    color: var(--color-muted-foreground);
    transition: background-color 0.15s, color 0.15s;
  }

  .row-edit-trigger:hover {
    background: var(--ui-data-table-row-hover-bg);
    color: var(--ui-data-table-text-color);
  }

  .row-edit-save {
    color: var(--color-success);
  }

  .row-edit-save:hover {
    background: color-mix(in oklch, var(--color-success) 10%, transparent);
    color: var(--color-success);
  }

  .row-edit-cancel {
    color: var(--color-destructive, var(--ui-color-destructive));
  }

  .row-edit-cancel:hover {
    background: color-mix(in oklch, var(--color-destructive, var(--ui-color-destructive)) 10%, transparent);
    color: var(--color-destructive, var(--ui-color-destructive));
  }

  .row-edit-trigger:focus-visible,
  .row-edit-save:focus-visible,
  .row-edit-cancel:focus-visible {
    outline: 2px solid var(--color-primary, var(--ui-color-primary));
    outline-offset: 1px;
  }

  /* ── Row in edit mode highlight ── */
  .data-table-row.row-editing {
    background: var(--ui-data-table-editing-bg);
  }

  /* ── Row actions cell ── */
  .row-actions-cell {
    display: flex;
    align-items: center;
    justify-content: center;
  }

`;
