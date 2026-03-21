/**
 * lui-column-date-filter - Date range filter using native date inputs
 *
 * Provides date range filtering with native HTML date inputs.
 * Emits filter-change events for DataTable integration.
 *
 * @example
 * ```html
 * <lui-column-date-filter
 *   column-id="createdAt"
 *   start-placeholder="Start date"
 *   end-placeholder="End date"
 *   @filter-change=${(e) => handleFilterChange(e.detail)}
 * ></lui-column-date-filter>
 * ```
 */
import { html, css, isServer } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';

/**
 * Date range filter value type.
 * [start, end] where either can be null for one-sided filtering.
 * Values are ISO date strings (YYYY-MM-DD).
 */
export type DateRangeValue = [string | null, string | null];

/**
 * Date filter component for column-level date range filtering.
 *
 * Emits:
 * - `filter-change` - When filter value changes (detail: { columnId, value })
 */
@customElement('lui-column-date-filter')
export class ColumnDateFilter extends TailwindElement {
  /**
   * Current filter value as [start, end] ISO date strings.
   */
  @property({ type: Array })
  value: DateRangeValue = [null, null];

  /**
   * Column ID this filter is associated with.
   * Used in the filter-change event detail.
   */
  @property({ type: String, attribute: 'column-id' })
  columnId = '';

  /**
   * Placeholder/aria-label for start date input.
   */
  @property({ type: String, attribute: 'start-placeholder' })
  startPlaceholder = 'Start date';

  /**
   * Placeholder/aria-label for end date input.
   */
  @property({ type: String, attribute: 'end-placeholder' })
  endPlaceholder = 'End date';

  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
        min-width: 200px;
      }

      .date-filter {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .date-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      label {
        font-size: 0.75rem;
        color: var(--color-muted-foreground);
        min-width: 40px;
      }

      input[type='date'] {
        flex: 1;
        padding: 0.375rem 0.5rem;
        font-size: 0.875rem;
        border: 1px solid var(--color-border);
        border-radius: var(--ui-radius-sm, 0.25rem);
        background: var(--color-background);
        color: var(--color-foreground);
      }

      input[type='date']:focus {
        outline: 2px solid var(--color-primary, var(--ui-color-primary));
        outline-offset: -1px;
      }

    `,
  ];

  private handleStartChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const start = input.value || null;
    this.emitChange([start, this.value[1]]);
  }

  private handleEndChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const end = input.value || null;
    this.emitChange([this.value[0], end]);
  }

  private emitChange(value: DateRangeValue): void {
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
      <div class="date-filter">
        <div class="date-row">
          <label>From</label>
          <input
            type="date"
            .value=${this.value[0] ?? ''}
            @change=${this.handleStartChange}
            aria-label=${this.startPlaceholder}
          />
        </div>
        <div class="date-row">
          <label>To</label>
          <input
            type="date"
            .value=${this.value[1] ?? ''}
            @change=${this.handleEndChange}
            aria-label=${this.endPlaceholder}
          />
        </div>
      </div>
    `;
  }
}

// JSX type declaration
declare global {
  interface HTMLElementTagNameMap {
    'lui-column-date-filter': ColumnDateFilter;
  }
}
