/**
 * Built-in cell renderer factory functions for lui-data-table.
 *
 * Each factory returns a function compatible with TanStack Table's `cell`
 * property in column definitions. Renderers are used via `flexRender` and
 * produce Lit `TemplateResult` values.
 *
 * Available renderers:
 * - textCellRenderer — plain text with ellipsis truncation
 * - numberCellRenderer — Intl.NumberFormat with prefix/suffix
 * - dateCellRenderer — Intl.DateTimeFormat with Date/string input
 * - booleanCellRenderer — check/cross SVG icons
 * - badgeCellRenderer — colored badge pills
 * - progressCellRenderer — horizontal progress bar
 * - avatarCellRenderer — image with initials fallback
 */

import { html, css, nothing, type TemplateResult } from 'lit';
import type { CellContext, RowData } from '@tanstack/lit-table';

// =============================================================================
// CellRenderer Type
// =============================================================================

/**
 * Type alias for a cell renderer function.
 *
 * Compatible with TanStack Table's `cell` property on column definitions.
 * Receives the full CellContext and returns a Lit TemplateResult.
 *
 * @template TData - Row data type
 * @template TValue - Cell value type
 */
export type CellRenderer<TData extends RowData, TValue = unknown> = (
  info: CellContext<TData, TValue>
) => TemplateResult;

// =============================================================================
// Text Cell Renderer
// =============================================================================

/**
 * Text cell renderer with CSS ellipsis truncation.
 *
 * Wraps the cell value in a `<span class="cell-text">` with overflow handling.
 * Null/undefined values render as empty string.
 *
 * @example
 * ```typescript
 * { accessorKey: 'name', header: 'Name', cell: textCellRenderer() }
 * ```
 */
export function textCellRenderer<TData extends RowData>(): CellRenderer<TData, string> {
  return (info) => {
    const value = info.getValue() ?? '';
    return html`<span class="cell-text">${value}</span>`;
  };
}

// =============================================================================
// Number Cell Renderer
// =============================================================================

/** Options for the number cell renderer */
export interface NumberCellRendererOptions {
  /** Locale for number formatting (e.g. 'en-US', 'de-DE') */
  locale?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Prefix string (e.g. '$') */
  prefix?: string;
  /** Suffix string (e.g. '%') */
  suffix?: string;
}

/**
 * Number cell renderer with locale-aware formatting.
 *
 * Uses `Intl.NumberFormat` for proper locale formatting.
 * Null/undefined values render as an em-dash.
 *
 * @example
 * ```typescript
 * { accessorKey: 'price', header: 'Price', cell: numberCellRenderer({ prefix: '$', decimals: 2 }) }
 * ```
 */
export function numberCellRenderer<TData extends RowData>(
  options?: NumberCellRendererOptions
): CellRenderer<TData, number> {
  const formatter = new Intl.NumberFormat(options?.locale, {
    minimumFractionDigits: options?.decimals ?? 0,
    maximumFractionDigits: options?.decimals ?? 2,
  });
  return (info) => {
    const value = info.getValue();
    if (value == null) return html`<span class="cell-number cell-empty">\u2014</span>`;
    const formatted = `${options?.prefix ?? ''}${formatter.format(value)}${options?.suffix ?? ''}`;
    return html`<span class="cell-number">${formatted}</span>`;
  };
}

// =============================================================================
// Date Cell Renderer
// =============================================================================

/** Options for the date cell renderer */
export interface DateCellRendererOptions {
  /** Locale for date formatting (e.g. 'en-US') */
  locale?: string;
  /** Intl.DateTimeFormat options */
  format?: Intl.DateTimeFormatOptions;
}

/**
 * Date cell renderer with locale-aware formatting.
 *
 * Uses `Intl.DateTimeFormat` for proper locale formatting.
 * Accepts both `Date` objects and date strings.
 * Null/undefined/invalid values render as an em-dash.
 *
 * @example
 * ```typescript
 * { accessorKey: 'createdAt', header: 'Created', cell: dateCellRenderer({ format: { dateStyle: 'medium' } }) }
 * ```
 */
export function dateCellRenderer<TData extends RowData>(
  options?: DateCellRendererOptions
): CellRenderer<TData, string | Date> {
  const defaultFormat: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  const formatter = new Intl.DateTimeFormat(
    options?.locale,
    options?.format ?? defaultFormat
  );
  return (info) => {
    const value = info.getValue();
    if (!value) return html`<span class="cell-date cell-empty">\u2014</span>`;
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime()))
      return html`<span class="cell-date cell-empty">\u2014</span>`;
    return html`<span class="cell-date">${formatter.format(date)}</span>`;
  };
}

// =============================================================================
// Boolean Cell Renderer
// =============================================================================

/** Options for the boolean cell renderer */
export interface BooleanCellRendererOptions {
  /** Accessible label for true value (default: 'Yes') */
  trueLabel?: string;
  /** Accessible label for false value (default: 'No') */
  falseLabel?: string;
}

/**
 * Boolean cell renderer with check/cross SVG icons.
 *
 * Renders a green checkmark for true and a muted X for false.
 * Includes `aria-label` for screen reader accessibility.
 *
 * @example
 * ```typescript
 * { accessorKey: 'active', header: 'Active', cell: booleanCellRenderer({ trueLabel: 'Active', falseLabel: 'Inactive' }) }
 * ```
 */
export function booleanCellRenderer<TData extends RowData>(
  options?: BooleanCellRendererOptions
): CellRenderer<TData, boolean> {
  return (info) => {
    const value = info.getValue();
    if (value) {
      return html`
        <span
          class="cell-boolean cell-boolean--true"
          aria-label="${options?.trueLabel ?? 'Yes'}"
        >
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="3 8 7 12 13 4" />
          </svg>
        </span>
      `;
    }
    return html`
      <span
        class="cell-boolean cell-boolean--false"
        aria-label="${options?.falseLabel ?? 'No'}"
      >
        <svg
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="4" y1="4" x2="12" y2="12" />
          <line x1="12" y1="4" x2="4" y2="12" />
        </svg>
      </span>
    `;
  };
}

// =============================================================================
// Badge Cell Renderer
// =============================================================================

/** Options for the badge cell renderer */
export interface BadgeCellRendererOptions {
  /** Map of cell values to badge color names (e.g. { active: 'green', inactive: 'red' }) */
  colorMap?: Record<string, string>;
  /** Default color when value is not in colorMap (default: 'default') */
  defaultColor?: string;
}

/**
 * Badge cell renderer with color mapping.
 *
 * Renders a pill-shaped badge with the cell value as label.
 * Color is determined by the `colorMap` option, falling back to `defaultColor`.
 *
 * Built-in color classes: default, green, blue, red, yellow, purple.
 *
 * @example
 * ```typescript
 * { accessorKey: 'status', header: 'Status', cell: badgeCellRenderer({ colorMap: { active: 'green', inactive: 'red' } }) }
 * ```
 */
export function badgeCellRenderer<TData extends RowData>(
  options?: BadgeCellRendererOptions
): CellRenderer<TData, string> {
  return (info) => {
    const value = String(info.getValue() ?? '');
    const color =
      options?.colorMap?.[value] ?? options?.defaultColor ?? 'default';
    return html`<span class="cell-badge cell-badge--${color}">${value}</span>`;
  };
}

// =============================================================================
// Progress Cell Renderer
// =============================================================================

/** Options for the progress cell renderer */
export interface ProgressCellRendererOptions {
  /** Maximum value (default: 100) */
  max?: number;
  /** Whether to show percentage label beside the bar */
  showLabel?: boolean;
  /** Custom color for the progress bar fill */
  color?: string;
}

/**
 * Progress bar cell renderer.
 *
 * Renders a horizontal progress bar with ARIA progressbar role.
 * Supports custom max value, percentage label, and bar color.
 *
 * @example
 * ```typescript
 * { accessorKey: 'completion', header: 'Progress', cell: progressCellRenderer({ showLabel: true }) }
 * ```
 */
export function progressCellRenderer<TData extends RowData>(
  options?: ProgressCellRendererOptions
): CellRenderer<TData, number> {
  const max = options?.max ?? 100;
  return (info) => {
    const value = info.getValue() ?? 0;
    const percent = Math.min(100, Math.max(0, (value / max) * 100));
    const colorStyle = options?.color ? `background: ${options.color}` : '';
    return html`
      <div class="cell-progress-wrapper">
        <div
          class="cell-progress"
          role="progressbar"
          aria-valuenow="${value}"
          aria-valuemin="0"
          aria-valuemax="${max}"
        >
          <div
            class="cell-progress-bar"
            style="width: ${percent}%;${colorStyle}"
          ></div>
        </div>
        ${options?.showLabel
          ? html`<span class="cell-progress-label"
              >${Math.round(percent)}%</span
            >`
          : nothing}
      </div>
    `;
  };
}

// =============================================================================
// Avatar Cell Renderer
// =============================================================================

/** Options for the avatar cell renderer */
export interface AvatarCellRendererOptions {
  /** Key in row data to use for the name (for initials fallback) */
  nameKey?: string;
  /** Avatar size in pixels (default: 28) */
  size?: number;
}

/**
 * Avatar cell renderer with initials fallback.
 *
 * Renders an `<img>` when the cell value (src URL) exists.
 * Falls back to initials derived from the `nameKey` row property.
 *
 * @example
 * ```typescript
 * { accessorKey: 'avatarUrl', header: 'Avatar', cell: avatarCellRenderer({ nameKey: 'name', size: 32 }) }
 * ```
 */
export function avatarCellRenderer<TData extends RowData>(
  options?: AvatarCellRendererOptions
): CellRenderer<TData, string> {
  const size = options?.size ?? 28;
  return (info) => {
    const src = info.getValue();
    const name = options?.nameKey
      ? String(
          (info.row.original as Record<string, unknown>)[options.nameKey] ?? ''
        )
      : '';
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .substring(0, 2)
      .toUpperCase();
    if (src) {
      return html`<img
        class="cell-avatar"
        src="${src}"
        alt="${name}"
        width="${size}"
        height="${size}"
      />`;
    }
    return html`<span
      class="cell-avatar cell-avatar--initials"
      style="width:${size}px;height:${size}px"
      >${initials}</span
    >`;
  };
}

// =============================================================================
// Cell Renderer Styles
// =============================================================================

/**
 * CSS styles for all built-in cell renderers.
 *
 * Must be included in the data table's static styles array
 * for the renderer classes to take effect.
 */
export const cellRendererStyles = css`
  /* ── Text Renderer ── */
  .cell-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Number Renderer ── */
  .cell-number {
    font-variant-numeric: tabular-nums;
    text-align: right;
    display: block;
  }

  /* ── Empty Value ── */
  .cell-empty {
    color: var(--color-muted-foreground);
  }

  /* ── Date Renderer ── */
  .cell-date {
    white-space: nowrap;
  }

  /* ── Boolean Renderer ── */
  .cell-boolean {
    display: inline-flex;
    align-items: center;
  }

  .cell-boolean--true {
    color: var(--color-success);
  }

  .cell-boolean--false {
    color: var(--color-muted-foreground);
  }

  /* ── Badge Renderer ── */
  .cell-badge {
    display: inline-flex;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.5;
    white-space: nowrap;
  }

  .cell-badge--default {
    background: var(--ui-data-table-badge-default-bg);
    color: var(--ui-data-table-badge-default-text);
  }

  .cell-badge--green {
    background: var(--ui-data-table-badge-green-bg);
    color: var(--ui-data-table-badge-green-text);
  }

  .cell-badge--blue {
    background: var(--ui-data-table-badge-blue-bg);
    color: var(--ui-data-table-badge-blue-text);
  }

  .cell-badge--red {
    background: var(--ui-data-table-badge-red-bg);
    color: var(--ui-data-table-badge-red-text);
  }

  .cell-badge--yellow {
    background: var(--ui-data-table-badge-yellow-bg);
    color: var(--ui-data-table-badge-yellow-text);
  }

  .cell-badge--purple {
    background: var(--ui-data-table-badge-purple-bg);
    color: var(--ui-data-table-badge-purple-text);
  }

  /* ── Progress Renderer ── */
  .cell-progress-wrapper {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 8px;
  }

  .cell-progress {
    flex: 1;
    height: 8px;
    background: var(--color-muted);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .cell-progress-bar {
    height: 100%;
    background: var(--color-primary, var(--ui-color-primary));
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .cell-progress-label {
    font-size: 12px;
    color: var(--color-muted-foreground);
    flex-shrink: 0;
    min-width: 32px;
    text-align: right;
  }

  /* ── Avatar Renderer ── */
  .cell-avatar {
    border-radius: 50%;
    object-fit: cover;
    vertical-align: middle;
  }

  .cell-avatar--initials {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-muted);
    color: var(--color-muted-foreground);
    font-size: 11px;
    font-weight: 600;
    border-radius: 50%;
  }

`;
