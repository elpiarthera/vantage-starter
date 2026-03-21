/**
 * lui-option - An option within a lui-select component
 *
 * This component represents a selectable option in the dropdown.
 * It provides visual states for selected, disabled, and active (keyboard navigation).
 *
 * Supports custom content via named slots:
 * - slot="start": Icon or content before the label
 * - slot="end": Icon or content after the label
 * - slot="description": Description text below the label
 * - default slot: Custom label content (alternative to label property)
 */
import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';

/**
 * An option element for use within lui-select.
 * Provides value, label, disabled, and selected states.
 * Supports named slots for custom content (icons, descriptions).
 */
export class Option extends TailwindElement {
  /**
   * The value submitted when this option is selected.
   * @default ''
   */
  @property({ type: String })
  value = '';

  /**
   * Display label for the option. Falls back to textContent or value if not provided.
   * @default ''
   */
  @property({ type: String })
  label = '';

  /**
   * Whether this option is disabled and cannot be selected.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether this option is currently selected.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  selected = false;

  /**
   * Whether this option is inside a multi-select.
   * When true, displays checkbox indicator instead of checkmark.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  multiselect = false;

  /**
   * Unique ID for aria-activedescendant reference.
   */
  private optionId = `lui-option-${Math.random().toString(36).substr(2, 9)}`;

  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
      }

      :host([disabled]) {
        pointer-events: none;
      }

      .option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: var(--ui-select-option-padding-y, 0.5rem)
          var(--ui-select-option-padding-x, 0.75rem);
        cursor: pointer;
        color: var(--ui-select-option-text);
        background-color: transparent;
        transition: background-color 150ms;
      }

      .option:hover:not(.option-disabled) {
        background-color: var(--ui-select-option-bg-hover);
      }

      .option-active {
        background-color: var(--ui-select-option-bg-active);
      }

      .option-selected {
        color: var(--ui-select-option-text-selected);
        font-weight: 500;
      }

      .option-disabled {
        color: var(--ui-select-option-text-disabled);
        cursor: not-allowed;
        opacity: 0.5;
      }

      .check-icon {
        width: 1em;
        height: 1em;
        flex-shrink: 0;
        color: var(--ui-select-option-check);
        display: none;
      }

      .option-selected .check-icon {
        display: block;
      }

      /* Checkbox indicator for multi-select mode */
      .checkbox-indicator {
        width: 1em;
        height: 1em;
        flex-shrink: 0;
        border: 2px solid var(--ui-select-checkbox-border, var(--color-border));
        border-radius: var(--radius-sm, 0.25rem);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 0.5rem;
        background-color: transparent;
        transition:
          background-color 150ms,
          border-color 150ms;
      }

      .checkbox-indicator.checked {
        background-color: var(
          --ui-select-checkbox-bg-checked,
          var(--color-primary)
        );
        border-color: var(
          --ui-select-checkbox-bg-checked,
          var(--color-primary)
        );
      }

      .checkbox-indicator svg {
        width: 0.75em;
        height: 0.75em;
        color: var(--ui-select-checkbox-check, white);
      }

      .slot-start,
      .slot-end {
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }

      .option-content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .option-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      ::slotted([slot='start']),
      ::slotted([slot='end']) {
        width: 1.25em;
        height: 1.25em;
      }

      ::slotted([slot='description']) {
        font-size: 0.75rem;
        color: var(--ui-select-option-text-disabled);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ];

  /**
   * Get the unique ID for this option (for aria-activedescendant).
   */
  getId(): string {
    return this.optionId;
  }

  /**
   * Get the display label for this option.
   * Priority: label property > textContent > value
   */
  getLabel(): string {
    return this.label || this.textContent?.trim() || this.value;
  }

  /**
   * Render the selection indicator based on multiselect mode.
   * Shows checkbox in multi-select, checkmark in single-select.
   */
  private renderSelectionIndicator() {
    if (this.multiselect) {
      return html`
        <span class="checkbox-indicator ${this.selected ? 'checked' : ''}">
          ${this.selected
            ? html`
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path
                    d="M3 8l4 4 6-7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    fill="none"
                  />
                </svg>
              `
            : nothing}
        </span>
      `;
    }
    // Single-select checkmark
    return html`
      <svg
        class="check-icon"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          d="M3 8l4 4 6-7"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;
  }

  override render() {
    const classes = ['option'];
    if (this.disabled) classes.push('option-disabled');
    if (this.selected) classes.push('option-selected');

    return html`
      <div
        id=${this.optionId}
        role="option"
        aria-selected=${this.selected ? 'true' : 'false'}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        class=${classes.join(' ')}
      >
        ${this.renderSelectionIndicator()}
        <span class="slot-start"><slot name="start"></slot></span>
        <span class="option-content">
          <span class="option-label">${this.label || html`<slot></slot>`}</span>
          <slot name="description"></slot>
        </span>
        <span class="slot-end"><slot name="end"></slot></span>
      </div>
    `;
  }
}

/**
 * Type alias for the Option element.
 */
export type OptionElement = Option;
