/**
 * lui-global-search - Global filter input across all columns
 *
 * Provides a debounced search input that filters across all filterable columns.
 * Emits global-filter-change events for DataTable integration.
 *
 * @example
 * ```html
 * <lui-global-search
 *   placeholder="Search all columns..."
 *   @global-filter-change=${(e) => handleGlobalFilter(e.detail.value)}
 * ></lui-global-search>
 * ```
 */
import { html, css, isServer } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';

/**
 * Global search component for table-wide filtering.
 *
 * Emits:
 * - `global-filter-change` - When filter value changes (detail: { value })
 */
@customElement('lui-global-search')
export class GlobalSearch extends TailwindElement {
  /**
   * Current search value.
   */
  @property({ type: String })
  value = '';

  /**
   * Placeholder text for the search input.
   */
  @property({ type: String })
  placeholder = 'Search all columns...';

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
      }

      lui-input {
        width: 100%;
      }

      .search-icon {
        color: var(--color-muted-foreground, #71717a);
        display: flex;
        align-items: center;
      }

      .search-icon svg {
        width: 16px;
        height: 16px;
      }
    `,
  ];

  private handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.value = target.value;

    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent('global-filter-change', {
          detail: { value: this.value || '' },
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
      >
        <span slot="prefix" class="search-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>
      </lui-input>
    `;
  }
}

// JSX type declaration
declare global {
  interface HTMLElementTagNameMap {
    'lui-global-search': GlobalSearch;
  }
}
