/**
 * lui-checkbox-group - An accessible checkbox group container
 *
 * Features:
 * - role="group" with aria-labelledby for screen reader grouping
 * - Label text display for group identification
 * - Disabled propagation to all child lui-checkbox elements
 * - Select-all checkbox with indeterminate (mixed) state coordination
 * - Batch update flag prevents race conditions during select-all toggling
 * - Group-level validation (required: at least one must be checked)
 * - NOT form-associated: each child checkbox submits independently
 * - Child discovery via slotchange event
 * - SSR compatible
 *
 * @example
 * ```html
 * <lui-checkbox-group label="Preferences" required>
 *   <lui-checkbox label="Email" name="pref" value="email"></lui-checkbox>
 *   <lui-checkbox label="SMS" name="pref" value="sms"></lui-checkbox>
 * </lui-checkbox-group>
 * ```
 *
 * @example Select-all
 * ```html
 * <lui-checkbox-group label="Toppings" select-all>
 *   <lui-checkbox label="Cheese" name="topping" value="cheese"></lui-checkbox>
 *   <lui-checkbox label="Pepperoni" name="topping" value="pepperoni"></lui-checkbox>
 * </lui-checkbox-group>
 * ```
 */

import { html, css, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';
import { dispatchCustomEvent } from '@lit-ui/core';
import type { Checkbox } from './checkbox.js';

/**
 * An accessible checkbox group container with disabled propagation,
 * select-all coordination, and group-level validation.
 * NOT form-associated — each child checkbox submits independently.
 *
 * @slot default - Child lui-checkbox elements
 */
export class CheckboxGroup extends TailwindElement {
  // NOT form-associated — children submit themselves

  /**
   * Unique ID for label association.
   */
  private groupId = `lui-cbg-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Discovered child checkboxes (NOT including select-all).
   */
  private checkboxes: Checkbox[] = [];

  /**
   * Flag to prevent select-all race condition during batch updates.
   * When true, handleChildChange skips recalculation (Pitfall 6).
   */
  private _batchUpdating = false;

  /**
   * Reference to the internal select-all checkbox element.
   */
  private selectAllEl: Checkbox | null = null;

  /**
   * Label text displayed above the group.
   * @default ''
   */
  @property({ type: String })
  label = '';

  /**
   * Whether all child checkboxes should be disabled.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether at least one checkbox must be checked (group-level validation).
   * @default false
   */
  @property({ type: Boolean })
  required = false;

  /**
   * Custom error message for group validation.
   * @default ''
   */
  @property({ type: String })
  error = '';

  /**
   * Whether to show a select-all checkbox.
   * @default false
   */
  @property({ type: Boolean, attribute: 'select-all' })
  selectAll = false;

  /**
   * Whether to show the validation error message.
   */
  @state()
  private showError = false;

  /**
   * Static styles for the checkbox group component.
   */
  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
      }

      :host([disabled]) {
        opacity: 0.5;
      }

      .group-wrapper {
        display: flex;
        flex-direction: column;
      }

      .group-label {
        font-weight: 500;
        margin-bottom: 0.375rem;
        font-size: 0.875rem;
        color: var(--ui-input-text, inherit);
      }

      .group-items {
        display: flex;
        flex-direction: column;
        gap: var(--ui-checkbox-group-gap);
      }

      .select-all-wrapper {
        padding-bottom: var(--ui-checkbox-group-gap);
        border-bottom: 1px solid var(--ui-checkbox-border);
        margin-bottom: var(--ui-checkbox-group-gap);
      }

      .error-text {
        font-size: 0.75rem;
        color: var(--ui-checkbox-text-error);
        margin-top: 0.25rem;
      }
    `,
  ];

  /**
   * Sync disabled state and select-all reference when properties change.
   */
  protected override updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('disabled')) {
      this.syncDisabledState();
    }

    if (changedProperties.has('selectAll') || changedProperties.has('disabled')) {
      // Get select-all checkbox reference after render
      if (this.selectAll) {
        this.selectAllEl = this.shadowRoot?.querySelector(
          '.select-all-wrapper lui-checkbox'
        ) as Checkbox | null;
        this.updateSelectAllState();
      } else {
        this.selectAllEl = null;
      }
    }
  }

  /**
   * Handle slot changes to discover child checkboxes.
   * Filters for LUI-CHECKBOX elements and syncs disabled state.
   */
  private handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements({ flatten: true });
    this.checkboxes = assigned.filter(
      (el) => el.tagName === 'LUI-CHECKBOX'
    ) as Checkbox[];
    this.syncDisabledState();
    this.updateSelectAllState();
  }

  /**
   * Propagate disabled state to all child checkboxes.
   * Called when disabled property changes or children are discovered.
   */
  private syncDisabledState(): void {
    if (this.disabled) {
      this.checkboxes.forEach((cb) => (cb.disabled = true));
    }
  }

  /**
   * Handle ui-change events bubbling from child checkboxes.
   * Skips during batch updates to prevent race conditions (Pitfall 6).
   */
  private handleChildChange(): void {
    if (this._batchUpdating) return;

    if (this.selectAll) {
      this.updateSelectAllState();
    }
    this.validateGroup();
  }

  /**
   * Update the select-all checkbox to reflect the aggregate state of children.
   * - All checked: checked=true, indeterminate=false
   * - None checked: checked=false, indeterminate=false
   * - Some checked: checked=false, indeterminate=true
   */
  private updateSelectAllState(): void {
    if (!this.selectAllEl || this.checkboxes.length === 0) return;

    const enabled = this.checkboxes.filter((cb) => !cb.disabled);
    const checkedCount = enabled.filter((cb) => cb.checked).length;
    const total = enabled.length;

    if (checkedCount === 0) {
      this.selectAllEl.checked = false;
      this.selectAllEl.indeterminate = false;
    } else if (checkedCount === total) {
      this.selectAllEl.checked = true;
      this.selectAllEl.indeterminate = false;
    } else {
      this.selectAllEl.checked = false;
      this.selectAllEl.indeterminate = true;
    }
  }

  /**
   * Handle the select-all checkbox toggle.
   * Uses batch update flag to prevent race conditions (Pitfall 6).
   * Stops propagation to prevent handleChildChange from also firing.
   */
  private handleSelectAllToggle(e: Event): void {
    e.stopPropagation();

    const shouldCheck = !this.checkboxes
      .filter((cb) => !cb.disabled)
      .every((cb) => cb.checked);

    this._batchUpdating = true;
    this.checkboxes.forEach((cb) => {
      if (!cb.disabled) {
        cb.checked = shouldCheck;
      }
    });
    this._batchUpdating = false;

    this.updateSelectAllState();
    this.validateGroup();

    dispatchCustomEvent(this, 'ui-change', {
      allChecked: shouldCheck,
      checkedCount: this.checkboxes.filter((cb) => cb.checked).length,
      totalCount: this.checkboxes.length,
    });
  }

  /**
   * Validate group-level required constraint.
   * Shows error if required and no children are checked.
   */
  private validateGroup(): void {
    if (this.required && !this.checkboxes.some((cb) => cb.checked)) {
      this.showError = true;
    } else {
      this.showError = false;
    }
  }

  override render() {
    return html`
      <div
        class="group-wrapper"
        role="group"
        aria-labelledby="${this.groupId}-label"
        @ui-change=${this.handleChildChange}
      >
        ${this.label
          ? html`<span id="${this.groupId}-label" class="group-label"
              >${this.label}</span
            >`
          : nothing}
        ${this.selectAll
          ? html`
              <div class="select-all-wrapper">
                <lui-checkbox
                  label="Select all"
                  @ui-change=${this.handleSelectAllToggle}
                  .disabled=${this.disabled}
                ></lui-checkbox>
              </div>
            `
          : nothing}
        <div class="group-items">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
        ${this.showError
          ? html`<div class="error-text" role="alert">
              ${this.error || 'Please select at least one option.'}
            </div>`
          : nothing}
      </div>
    `;
  }
}
