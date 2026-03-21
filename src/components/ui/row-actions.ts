/**
 * Row actions rendering utilities for lui-data-table.
 *
 * Provides the renderRowActions function that renders inline buttons
 * for 1-2 actions or a kebab dropdown menu for 3+ actions.
 * Also provides pre-built action factories for common operations
 * (view, edit, delete) and CSS styles including hover-reveal support.
 *
 * This module is imported by the DataTable component and kept separate
 * for maintainability, following the inline-editing.ts pattern.
 */

import { html, css, nothing, type TemplateResult } from 'lit';
import type { RowData, Row } from '@tanstack/lit-table';
import type { RowAction } from './types.js';

// =============================================================================
// Kebab Icon
// =============================================================================

/** SVG icon for the kebab (three vertical dots) menu trigger */
export const kebabIcon = html`
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
    <circle cx="8" cy="3" r="1.5" />
    <circle cx="8" cy="8" r="1.5" />
    <circle cx="8" cy="13" r="1.5" />
  </svg>
`;

// =============================================================================
// Pre-built Action Icons
// =============================================================================

/** Eye icon for view action */
const viewIcon = html`<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 3C4.5 3 1.7 5.1.3 8c1.4 2.9 4.2 5 7.7 5s6.3-2.1 7.7-5C14.3 5.1 11.5 3 8 3zm0 8.3A3.3 3.3 0 1 1 8 4.7a3.3 3.3 0 0 1 0 6.6zM8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>`;

/** Pencil icon for edit action */
const editIcon = html`<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M12.1 1.9a1.5 1.5 0 0 1 2.1 2.1L5.6 12.6l-3.2.8.8-3.2L12.1 1.9z"/></svg>`;

/** Trash icon for delete action */
const deleteIcon = html`<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>`;

// =============================================================================
// Render Row Actions
// =============================================================================

/**
 * Render row action buttons.
 *
 * For 1-2 visible actions: renders inline icon buttons.
 * For 3+ visible actions: renders a kebab menu trigger that opens a lui-popover dropdown.
 *
 * Hidden actions are filtered out using the `hidden` property (boolean or per-row function).
 * Disabled actions are rendered but not interactive (using the `disabled` property).
 *
 * @param row - The TanStack Row instance
 * @param actions - Array of RowAction configurations
 * @param onAction - Callback when an action is triggered
 * @returns Lit TemplateResult with action buttons
 */
export function renderRowActions<TData extends RowData>(
  row: Row<TData>,
  actions: RowAction<TData>[],
  onAction: (actionId: string, row: Row<TData>) => void
): TemplateResult {
  // Filter out hidden actions
  const visibleActions = actions.filter((a) => {
    if (typeof a.hidden === 'function') return !a.hidden(row.original);
    return !a.hidden;
  });

  if (visibleActions.length === 0) return html``;

  // For 1-2 actions: render inline buttons
  if (visibleActions.length <= 2) {
    return html`
      <div class="row-actions-inline">
        ${visibleActions.map((action) => {
          const isDisabled =
            typeof action.disabled === 'function'
              ? action.disabled(row.original)
              : action.disabled;
          return html`
            <button
              type="button"
              class="row-action-btn${action.variant === 'destructive'
                ? ' destructive'
                : ''}"
              ?disabled=${isDisabled}
              @click=${(e: MouseEvent) => {
                e.stopPropagation();
                onAction(action.id, row);
              }}
              aria-label="${action.label}"
              title="${action.label}"
            >
              ${action.icon ?? action.label}
            </button>
          `;
        })}
      </div>
    `;
  }

  // For 3+ actions: render kebab menu with popover
  return html`
    <lui-popover placement="bottom-end" .offset=${4}>
      <button
        slot="trigger"
        type="button"
        class="row-action-kebab"
        @click=${(e: MouseEvent) => e.stopPropagation()}
        aria-label="Row actions"
        aria-haspopup="menu"
      >
        ${kebabIcon}
      </button>
      <div role="menu" class="row-actions-menu">
        ${visibleActions.map((action) => {
          const isDisabled =
            typeof action.disabled === 'function'
              ? action.disabled(row.original)
              : action.disabled;
          return html`
            <button
              type="button"
              role="menuitem"
              class="row-actions-menu-item${action.variant === 'destructive'
                ? ' destructive'
                : ''}"
              ?disabled=${isDisabled}
              @click=${(e: MouseEvent) => {
                e.stopPropagation();
                onAction(action.id, row);
                // Close popover after action
                const popover = (e.target as HTMLElement).closest(
                  'lui-popover'
                );
                if (popover && 'open' in popover)
                  (popover as { open: boolean }).open = false;
              }}
            >
              ${action.icon
                ? html`<span class="menu-item-icon">${action.icon}</span>`
                : nothing}
              <span class="menu-item-label">${action.label}</span>
            </button>
          `;
        })}
      </div>
    </lui-popover>
  `;
}

// =============================================================================
// Pre-built Action Factories
// =============================================================================

/** Options for customizing pre-built actions */
export interface PrebuiltActionOptions {
  /** Custom label */
  label?: string;
  /** Custom icon */
  icon?: TemplateResult;
}

/**
 * Create a pre-built "View" action.
 *
 * Renders an eye icon. Default label: "View".
 *
 * @example
 * ```typescript
 * const actions = [createViewAction(), createEditAction()];
 * ```
 */
export function createViewAction<TData extends RowData>(
  options?: PrebuiltActionOptions
): RowAction<TData> {
  return {
    id: 'view',
    label: options?.label ?? 'View',
    icon: options?.icon ?? viewIcon,
  };
}

/**
 * Create a pre-built "Edit" action.
 *
 * Renders a pencil icon. Default label: "Edit".
 */
export function createEditAction<TData extends RowData>(
  options?: PrebuiltActionOptions
): RowAction<TData> {
  return {
    id: 'edit',
    label: options?.label ?? 'Edit',
    icon: options?.icon ?? editIcon,
  };
}

/**
 * Create a pre-built "Delete" action.
 *
 * Renders a trash icon with destructive variant (red). Default label: "Delete".
 */
export function createDeleteAction<TData extends RowData>(
  options?: PrebuiltActionOptions
): RowAction<TData> {
  return {
    id: 'delete',
    label: options?.label ?? 'Delete',
    variant: 'destructive',
    icon: options?.icon ?? deleteIcon,
  };
}

// =============================================================================
// Row Actions Styles
// =============================================================================

/**
 * CSS styles for row actions UI elements.
 *
 * Includes styles for:
 * - Inline action buttons (1-2 actions)
 * - Kebab menu trigger button
 * - Dropdown menu items via lui-popover
 * - Destructive variant styling
 * - Hover-reveal mode (actions hidden until row hover/focus)
 * - Focus-visible outlines
 * - Dark mode support
 */
export const rowActionsStyles = css`
  /* ── Inline Action Buttons ── */
  .row-actions-inline {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .row-action-btn {
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

  .row-action-btn:hover {
    background: var(--ui-data-table-row-hover-bg);
    color: var(--ui-data-table-text-color);
  }

  .row-action-btn.destructive {
    color: var(--color-destructive, var(--ui-color-destructive));
  }

  .row-action-btn.destructive:hover {
    background: color-mix(in oklch, var(--color-destructive, var(--ui-color-destructive)) 10%, transparent);
    color: var(--color-destructive, var(--ui-color-destructive));
  }

  .row-action-btn:disabled {
    color: var(--color-muted-foreground);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .row-action-btn:disabled:hover {
    background: transparent;
  }

  /* ── Kebab Menu Trigger ── */
  .row-action-kebab {
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

  .row-action-kebab:hover {
    background: var(--ui-data-table-row-hover-bg);
    color: var(--ui-data-table-text-color);
  }

  /* ── Dropdown Menu ── */
  .row-actions-menu {
    min-width: 160px;
    padding: 4px 0;
    background: var(--ui-data-table-menu-bg);
    border: 1px solid var(--ui-data-table-border-color);
    border-radius: 6px;
    box-shadow: var(--ui-data-table-menu-shadow);
  }

  .row-actions-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    font-family: inherit;
    color: var(--ui-data-table-text-color);
    text-align: left;
    transition: background-color 0.1s;
  }

  .row-actions-menu-item:hover {
    background: var(--ui-data-table-row-hover-bg);
  }

  .row-actions-menu-item.destructive {
    color: var(--color-destructive, var(--ui-color-destructive));
  }

  .row-actions-menu-item.destructive:hover {
    background: color-mix(in oklch, var(--color-destructive, var(--ui-color-destructive)) 8%, transparent);
  }

  .row-actions-menu-item:disabled {
    color: var(--color-muted-foreground);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .row-actions-menu-item:disabled:hover {
    background: none;
  }

  .menu-item-icon {
    display: inline-flex;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
  }

  .menu-item-label {
    flex: 1;
  }

  /* ── Focus-Visible Outlines ── */
  .row-action-btn:focus-visible,
  .row-action-kebab:focus-visible {
    outline: 2px solid var(--color-primary, var(--ui-color-primary));
    outline-offset: 1px;
  }

  .row-actions-menu-item:focus-visible {
    outline: 2px solid var(--color-primary, var(--ui-color-primary));
    outline-offset: -2px;
  }

  /* ── Hover-Reveal Mode ── */
  :host([hover-reveal-actions]) .row-actions-content {
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.15s ease, visibility 0.15s ease;
  }

  :host([hover-reveal-actions]) .data-table-row:hover .row-actions-content,
  :host([hover-reveal-actions])
    .data-table-row:focus-within
    .row-actions-content {
    opacity: 1;
    visibility: visible;
  }

  /* Touch devices: always show actions (no hover) */
  @media (hover: none) {
    :host([hover-reveal-actions]) .row-actions-content {
      opacity: 1;
      visibility: visible;
    }
  }

`;
