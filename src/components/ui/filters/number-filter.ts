/**
 * lui-column-number-filter - Numeric range filter (min/max)
 *
 * Provides min/max range filtering for numeric columns.
 * Emits filter-change events for DataTable integration.
 *
 * @example
 * ```html
 * <lui-column-number-filter
 *   column-id="price"
 *   min-placeholder="Min price"
 *   max-placeholder="Max price"
 *   @filter-change=${(e) => handleFilterChange(e.detail)}
 * ></lui-column-number-filter>
 * ```
 */
import { html, css, isServer } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';

/**
 * Number range filter value type.
 * [min, max] where either can be null for one-sided filtering.
 */
export type NumberRangeValue = [number | null, number | null];

/**
 * Number filter component for column-level numeric range filtering.
 *
 * Emits:
 * - `filter-change` - When filter value changes (detail: { columnId, value })
 */
@customElement('lui-column-number-filter')
export class ColumnNumberFilter extends TailwindElement {
  /**
   * Current filter value as [min, max].
   */
  @property({ type: Array })
  value: NumberRangeValue = [null, null];

  /**
   * Column ID this filter is associated with.
   * Used in the filter-change event detail.
   */
  @property({ type: String, attribute: 'column-id' })
  columnId = '';

  /**
   * Placeholder for minimum value input.
   */
  @property({ type: String, attribute: 'min-placeholder' })
  minPlaceholder = 'Min';

  /**
   * Placeholder for maximum value input.
   */
  @property({ type: String, attribute: 'max-placeholder' })
  maxPlaceholder = 'Max';

  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
        min-width: 180px;
      }

      .number-filter {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      lui-input {
        flex: 1;
      }

      .separator {
        color: var(--color-muted-foreground, #71717a);
        font-size: 0.875rem;
        flex-shrink: 0;
      }
    `,
  ];

  private handleMinChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const min = input.value ? parseFloat(input.value) : null;
    this.emitChange([min, this.value[1]]);
  }

  private handleMaxChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const max = input.value ? parseFloat(input.value) : null;
    this.emitChange([this.value[0], max]);
  }

  private emitChange(value: NumberRangeValue): void {
    this.value = value;

    // Only emit if at least one value is set, otherwise clear filter
    const filterValue = value[0] === null && value[1] === null ? undefined : value;

    this.dispatchEvent(
      new CustomEvent('filter-change', {
        detail: {
          columnId: this.columnId,
          value: filterValue,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    return html`
      <div class="number-filter">
        <lui-input
          type="number"
          size="sm"
          placeholder=${this.minPlaceholder}
          .value=${this.value[0]?.toString() ?? ''}
          @change=${this.handleMinChange}
        ></lui-input>
        <span class="separator">-</span>
        <lui-input
          type="number"
          size="sm"
          placeholder=${this.maxPlaceholder}
          .value=${this.value[1]?.toString() ?? ''}
          @change=${this.handleMaxChange}
        ></lui-input>
      </div>
    `;
  }
}

// JSX type declaration
declare global {
  interface HTMLElementTagNameMap {
    'lui-column-number-filter': ColumnNumberFilter;
  }
}
