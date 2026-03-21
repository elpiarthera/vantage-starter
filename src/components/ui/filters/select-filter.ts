/**
 * lui-column-select-filter - Multi-select enum filter
 *
 * Provides multi-select filtering from predefined options.
 * Emits filter-change events for DataTable integration.
 *
 * @example
 * ```html
 * <lui-column-select-filter
 *   column-id="status"
 *   placeholder="Filter by status..."
 *   .options=${[
 *     { value: 'active', label: 'Active' },
 *     { value: 'pending', label: 'Pending' },
 *     { value: 'inactive', label: 'Inactive' },
 *   ]}
 *   @filter-change=${(e) => handleFilterChange(e.detail)}
 * ></lui-column-select-filter>
 * ```
 */
import { html, css, isServer } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';

/**
 * Option type for select filter.
 */
export interface SelectFilterOption {
  /** The value to filter by */
  value: string;
  /** Display label for the option */
  label: string;
}

/**
 * Select filter component for column-level multi-select filtering.
 *
 * Emits:
 * - `filter-change` - When filter value changes (detail: { columnId, value })
 */
@customElement('lui-column-select-filter')
export class ColumnSelectFilter extends TailwindElement {
  /**
   * Currently selected filter values.
   */
  @property({ type: Array })
  value: string[] = [];

  /**
   * Available options to select from.
   */
  @property({ type: Array })
  options: SelectFilterOption[] = [];

  /**
   * Column ID this filter is associated with.
   * Used in the filter-change event detail.
   */
  @property({ type: String, attribute: 'column-id' })
  columnId = '';

  /**
   * Placeholder text when no selection.
   */
  @property({ type: String })
  placeholder = 'Select...';

  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
        min-width: 180px;
      }

      lui-select {
        width: 100%;
      }
    `,
  ];

  private handleChange(e: CustomEvent): void {
    const selectedValues = e.detail.value as string[];
    this.value = selectedValues;

    this.dispatchEvent(
      new CustomEvent('filter-change', {
        detail: {
          columnId: this.columnId,
          value: selectedValues.length > 0 ? selectedValues : undefined,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    return html`
      <lui-select
        multiple
        size="sm"
        placeholder=${this.placeholder}
        .value=${this.value}
        @ui-change=${this.handleChange}
      >
        ${this.options.map(
          (opt) => html` <lui-option value=${opt.value}>${opt.label}</lui-option> `
        )}
      </lui-select>
    `;
  }
}

// JSX type declaration
declare global {
  interface HTMLElementTagNameMap {
    'lui-column-select-filter': ColumnSelectFilter;
  }
}
