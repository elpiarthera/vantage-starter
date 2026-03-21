/**
 * Bulk actions toolbar and confirmation dialog for lui-data-table.
 *
 * Provides a floating toolbar that appears when rows are selected and
 * bulkActions are configured. Includes action buttons, selected count,
 * clear selection, and a native HTML confirmation dialog for destructive
 * actions.
 *
 * This module is imported by the DataTable component and kept separate
 * for maintainability, following the inline-editing.ts and row-actions.ts pattern.
 */

import { html, css, nothing, type TemplateResult } from 'lit';
import type { BulkAction } from './types.js';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Resolve a confirmation message that may be a string or function.
 *
 * @param msg - Static string, function receiving count, or undefined
 * @param count - Number of selected items
 * @returns Resolved message string
 */
function resolveMessage(
  msg: string | ((count: number) => string) | undefined,
  count: number
): string {
  if (typeof msg === 'function') return msg(count);
  return msg ?? `Are you sure? This will affect ${count} item${count !== 1 ? 's' : ''}.`;
}

// =============================================================================
// Bulk Actions Toolbar
// =============================================================================

/**
 * Render the bulk actions toolbar.
 *
 * Displays a primary-colored bar with:
 * - Selected count (e.g. "3 selected")
 * - Optional "Select all X items" link (when all page rows are selected)
 * - Action buttons from bulkActions array
 * - Clear selection button
 *
 * @param selectedCount - Number of currently selected rows
 * @param bulkActions - Array of BulkAction configurations
 * @param onAction - Callback when an action button is clicked
 * @param onClear - Callback to clear all selections
 * @param selectAllText - Optional text for "Select all X items" link
 * @param onSelectAll - Optional callback when "Select all" is clicked
 * @returns Lit TemplateResult for the toolbar
 */
export function renderBulkActionsToolbar(
  selectedCount: number,
  bulkActions: BulkAction[],
  onAction: (action: BulkAction) => void,
  onClear: () => void,
  selectAllText?: string,
  onSelectAll?: () => void
): TemplateResult {
  return html`
    <div class="bulk-actions-toolbar" role="toolbar" aria-label="Bulk actions">
      <span class="bulk-actions-count">${selectedCount} selected</span>
      ${selectAllText && onSelectAll
        ? html`
            <button
              type="button"
              class="bulk-actions-select-all"
              @click=${onSelectAll}
            >
              ${selectAllText}
            </button>
          `
        : nothing}
      ${bulkActions.map(
        (action) => html`
          <button
            type="button"
            class="bulk-action-btn${action.variant === 'destructive'
              ? ' destructive'
              : ''}"
            @click=${() => onAction(action)}
          >
            ${action.icon
              ? html`<span class="bulk-action-icon">${action.icon}</span>`
              : nothing}
            ${action.label}
          </button>
        `
      )}
      <button
        type="button"
        class="bulk-action-clear"
        @click=${onClear}
      >
        Clear selection
      </button>
    </div>
  `;
}

// =============================================================================
// Confirmation Dialog
// =============================================================================

/**
 * Render a confirmation dialog for destructive bulk actions.
 *
 * Uses native HTML elements (not lui-dialog/lui-button) to avoid
 * dependency overhead, matching the project pattern of using native
 * elements where possible.
 *
 * The overlay click dismisses the dialog. The inner dialog content
 * stops propagation to prevent overlay dismiss when clicking inside.
 *
 * @param action - The pending bulk action (null = no dialog shown)
 * @param selectedCount - Number of selected rows (for message)
 * @param onConfirm - Callback when user confirms the action
 * @param onCancel - Callback when user cancels (or clicks overlay)
 * @returns Lit TemplateResult (or nothing if no action pending)
 */
export function renderConfirmationDialog(
  action: BulkAction | null,
  selectedCount: number,
  onConfirm: () => void,
  onCancel: () => void
): TemplateResult | typeof nothing {
  if (!action) return nothing;

  return html`
    <div class="bulk-confirm-overlay" @click=${onCancel}>
      <div
        class="bulk-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="bulk-confirm-title"
        @click=${(e: Event) => e.stopPropagation()}
      >
        <h3 id="bulk-confirm-title" class="bulk-confirm-title">
          ${action.confirmTitle ?? 'Confirm Action'}
        </h3>
        <p class="bulk-confirm-message">
          ${resolveMessage(action.confirmMessage, selectedCount)}
        </p>
        <div class="bulk-confirm-footer">
          <button
            type="button"
            class="bulk-confirm-cancel"
            @click=${onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            class="bulk-confirm-action"
            @click=${onConfirm}
          >
            ${action.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// =============================================================================
// Bulk Actions Styles
// =============================================================================

/**
 * CSS styles for bulk actions toolbar and confirmation dialog.
 *
 * Includes styles for:
 * - Toolbar bar with primary background
 * - Selected count badge
 * - Action buttons (default + destructive variants)
 * - Select all link
 * - Clear selection link
 * - Confirmation dialog overlay and modal
 * - Focus-visible outlines
 * - Dark mode support
 */
export const bulkActionsStyles = css`
  /* ── Bulk Actions Toolbar ── */
  .bulk-actions-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--color-primary, var(--ui-color-primary));
    color: white;
    font-size: 14px;
    border-radius: 0;
  }

  .bulk-actions-count {
    font-weight: 600;
    margin-right: 8px;
  }

  /* ── Action Buttons ── */
  .bulk-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    background: transparent;
    color: white;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    transition: background 0.15s;
  }

  .bulk-action-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .bulk-action-btn.destructive {
    border-color: rgba(255, 255, 255, 0.5);
  }

  .bulk-action-btn.destructive:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .bulk-action-icon {
    display: inline-flex;
    align-items: center;
  }

  /* ── Clear Selection ── */
  .bulk-action-clear {
    margin-left: auto;
    padding: 4px 12px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    font-size: 13px;
    font-family: inherit;
    text-decoration: underline;
  }

  .bulk-action-clear:hover {
    color: white;
  }

  /* ── Select All Link ── */
  .bulk-actions-select-all {
    padding: 4px 12px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    font-size: 13px;
    font-family: inherit;
    text-decoration: underline;
  }

  .bulk-actions-select-all:hover {
    color: white;
  }

  /* ── Focus-Visible Outlines ── */
  .bulk-action-btn:focus-visible,
  .bulk-action-clear:focus-visible,
  .bulk-actions-select-all:focus-visible {
    outline: 2px solid white;
    outline-offset: 1px;
  }

  /* ── Confirmation Dialog Overlay ── */
  .bulk-confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  /* ── Confirmation Dialog ── */
  .bulk-confirm-dialog {
    background: var(--ui-data-table-row-bg);
    border-radius: 8px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .bulk-confirm-title {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
    color: var(--ui-data-table-text-color);
  }

  .bulk-confirm-message {
    margin: 0 0 24px;
    font-size: 14px;
    color: var(--color-muted-foreground);
    line-height: 1.5;
  }

  .bulk-confirm-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .bulk-confirm-cancel {
    padding: 6px 16px;
    border: 1px solid var(--ui-data-table-border-color);
    border-radius: 6px;
    background: transparent;
    color: var(--ui-data-table-text-color);
    cursor: pointer;
    font-size: 14px;
    font-family: inherit;
    font-weight: 500;
    transition: background 0.15s;
  }

  .bulk-confirm-cancel:hover {
    background: var(--color-muted);
  }

  .bulk-confirm-action {
    padding: 6px 16px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: var(--color-destructive, var(--ui-color-destructive));
    color: white;
    cursor: pointer;
    font-size: 14px;
    font-family: inherit;
    font-weight: 500;
    transition: background 0.15s;
  }

  .bulk-confirm-action:hover {
    background: var(--color-destructive-hover);
  }

  .bulk-confirm-cancel:focus-visible,
  .bulk-confirm-action:focus-visible {
    outline: 2px solid var(--color-primary, var(--ui-color-primary));
    outline-offset: 1px;
  }

`;
