/**
 * lui-column-text-filter - Text/contains filter with debounce
 *
 * Provides case-insensitive text filtering with a debounced input.
 * Emits filter-change events for DataTable integration.
 *
 * @example
 * ```html
 * <lui-column-text-filter
 *   column-id="name"
 *   placeholder="Filter by name..."
 *   @filter-change=${(e) => handleFilterChange(e.detail)}
 * ></lui-column-text-filter>
 * ```
 */
import { html, css, isServer } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';

/**
 * Text filter component for column-level text filtering.
 *
 * Emits:
 * - `filter-change` - When filter value changes (detail: { columnId, value })
 */
@customElement('lui-column-text-filter')
export class ColumnTextFilter extends TailwindElement {
  /**
   * Current filter value.
   */
  @property({ type: String })
  value = '';

  /**
   * Placeholder text for the input.
   */
  @property({ type: String })
  placeholder = 'Filter...';

  /**
   * Column ID this filter is associated with.
   * Used in the filter-change event detail.
   */
  @property({ type: String, attribute: 'column-id' })
  columnId = '';

  /**
   * Debounce delay in milliseconds.
   * @default 300
   */
  @property({ type: Number, attribute: 'debounce-delay' })
  debounceDelay = 300;

  /**
   * Debounce timeout reference.
   */
  private debounceTimeout?: ReturnType<typeof setTimeout>;

  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
        min-width: 150px;
      }

      lui-input {
        width: 100%;
      }
    `,
  ];

  private handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.value = target.value;

    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent('filter-change', {
          detail: {
            columnId: this.columnId,
            value: this.value || undefined, // undefined clears the filter
          },
          bubbles: true,
          composed: true,
        })
      );
    }, this.debounceDelay);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this.debounceTimeout);
  }

  override render() {
    return html`
      <lui-input
        type="search"
        size="sm"
        .value=${this.value}
        placeholder=${this.placeholder}
        clearable
        @input=${this.handleInput}
      ></lui-input>
    `;
  }
}

// JSX type declaration
declare global {
  interface HTMLElementTagNameMap {
    'lui-column-text-filter': ColumnTextFilter;
  }
}
