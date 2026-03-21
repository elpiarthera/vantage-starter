/**
 * lui-option-group - Groups related options under a labeled header
 *
 * Follows W3C APG listbox with grouped options pattern.
 * Uses role="group" with aria-labelledby for accessibility.
 * Group labels are presentational and not focusable via keyboard.
 *
 * @example
 * <lui-select>
 *   <lui-option-group label="Fruits">
 *     <lui-option value="apple">Apple</lui-option>
 *     <lui-option value="banana">Banana</lui-option>
 *   </lui-option-group>
 * </lui-select>
 */
import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';

/**
 * Groups options under a labeled header with proper ARIA structure.
 */
export class OptionGroup extends TailwindElement {
  /**
   * Label text displayed as the group header.
   * Screen readers will announce this when entering the group.
   * @default ''
   */
  @property({ type: String })
  label = '';

  /**
   * Unique ID for aria-labelledby reference.
   */
  private groupId = `lui-option-group-${Math.random().toString(36).substr(2, 9)}`;

  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
      }

      /* Visual separator between groups (not on first group) */
      :host(:not(:first-child)) {
        border-top: 1px solid var(--ui-select-dropdown-border);
        margin-top: 0.25rem;
        padding-top: 0.25rem;
      }

      /* Group label styling - uppercase, smaller, muted */
      .group-label {
        padding: 0.375rem var(--ui-select-option-padding-x, 0.75rem);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ui-select-option-text-disabled);
        user-select: none;
        pointer-events: none;
      }

      /* Container for options */
      .group-content {
        display: block;
      }
    `,
  ];

  override render() {
    return html`
      <div role="group" aria-labelledby=${this.label ? this.groupId : nothing}>
        ${this.label
          ? html`
              <div
                id=${this.groupId}
                class="group-label"
                role="presentation"
                aria-hidden="true"
              >
                ${this.label}
              </div>
            `
          : nothing}
        <div class="group-content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
