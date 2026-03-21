/**
 * lui-accordion - An accessible accordion container with expand/collapse state management
 *
 * Features:
 * - Single-expand mode: opening one panel auto-collapses others
 * - Multi-expand mode (multiple attribute): multiple panels open simultaneously
 * - Collapsible flag: controls whether last panel can close in single-expand mode
 * - Controlled (value) and uncontrolled (default-value) modes
 * - Child discovery via slotchange with SSR hydration workaround
 * - Disabled propagation to all child items
 * - Dispatches ui-change event with value and expandedItems
 * - SSR compatible via isServer guards
 *
 * @example Single-expand (default)
 * ```html
 * <lui-accordion value="item-1">
 *   <lui-accordion-item value="item-1">
 *     <span slot="header">Item 1</span>
 *     Content for item 1
 *   </lui-accordion-item>
 *   <lui-accordion-item value="item-2">
 *     <span slot="header">Item 2</span>
 *     Content for item 2
 *   </lui-accordion-item>
 * </lui-accordion>
 * ```
 *
 * @example Multi-expand with collapsible
 * ```html
 * <lui-accordion multiple collapsible>
 *   <lui-accordion-item value="a"><span slot="header">A</span>Content A</lui-accordion-item>
 *   <lui-accordion-item value="b"><span slot="header">B</span>Content B</lui-accordion-item>
 * </lui-accordion>
 * ```
 *
 * @slot default - Child lui-accordion-item elements
 */

import { html, css, isServer, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';
import { dispatchCustomEvent } from '@lit-ui/core';
import type { AccordionItem } from './accordion-item.js';

/**
 * An accordion container that manages expand/collapse state for child
 * lui-accordion-item elements. Supports single-expand, multi-expand,
 * collapsible, and controlled/uncontrolled modes.
 *
 * @slot default - Child lui-accordion-item elements
 */
export class Accordion extends TailwindElement {
  /**
   * Discovered child accordion item elements.
   */
  private items: AccordionItem[] = [];

  /**
   * Comma-separated list of expanded item values (controlled mode).
   * @default ''
   */
  @property({ type: String })
  value = '';

  /**
   * Initial expanded items for uncontrolled mode.
   * Only used if value is not set.
   * @default ''
   */
  @property({ type: String, attribute: 'default-value' })
  defaultValue = '';

  /**
   * Allow multiple panels open simultaneously.
   * @default false
   */
  @property({ type: Boolean })
  multiple = false;

  /**
   * Allow all panels to close in single-expand mode.
   * When false, clicking the open panel is a no-op.
   * @default false
   */
  @property({ type: Boolean })
  collapsible = false;

  /**
   * Disable all child items.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Parse the comma-separated value string into a Set.
   * Private to avoid api-extractor issues with Set in public API.
   */
  private getExpandedSet(): Set<string> {
    return new Set(
      this.value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v !== '')
    );
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.defaultValue && !this.value) {
      this.value = this.defaultValue;
    }
  }

  /**
   * SSR slotchange workaround: after hydration, manually trigger
   * slotchange to discover children that were server-rendered.
   */
  protected override firstUpdated(): void {
    if (!isServer) {
      const slot = this.shadowRoot?.querySelector(
        'slot:not([name])'
      ) as HTMLSlotElement | null;
      if (slot) {
        slot.dispatchEvent(new Event('slotchange'));
      }
    }
  }

  /**
   * Sync child states when properties change.
   * Uses PropertyValues type (not Map) to avoid api-extractor DTS rollup crash.
   */
  protected override updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('value')) {
      this.syncChildStates();
      this.updateRovingTabindex();
    }
    if (changedProperties.has('disabled')) {
      this.syncDisabledState();
      this.updateRovingTabindex();
    }
  }

  /**
   * Discover child accordion items from slotchange event.
   * Filters for LUI-ACCORDION-ITEM elements and syncs state.
   */
  private handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements({ flatten: true });
    this.items = assigned.filter(
      (el) => el.tagName === 'LUI-ACCORDION-ITEM'
    ) as AccordionItem[];
    this.syncChildStates();
    this.syncDisabledState();
    this.updateRovingTabindex();
  }

  /**
   * Handle keyboard navigation on the accordion container.
   * ArrowDown/ArrowUp move focus between enabled items with wrapping.
   * Home/End jump to first/last enabled item.
   * Enter/Space are NOT handled here — they trigger the button's native click.
   */
  private handleKeyDown(e: KeyboardEvent): void {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();

    const enabledItems = this.items.filter((i) => !i.disabled);
    if (enabledItems.length === 0) return;

    const currentIndex = enabledItems.findIndex((i) => i.tabIndex === 0);
    const idx = currentIndex === -1 ? 0 : currentIndex;
    let nextIndex: number;

    switch (e.key) {
      case 'ArrowDown':
        nextIndex = (idx + 1) % enabledItems.length;
        break;
      case 'ArrowUp':
        nextIndex = (idx - 1 + enabledItems.length) % enabledItems.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = enabledItems.length - 1;
        break;
      default:
        return;
    }

    // Update roving tabindex
    for (const item of this.items) {
      item.tabIndex = -1;
    }
    enabledItems[nextIndex].tabIndex = 0;
    enabledItems[nextIndex].focusHeader();
  }

  /**
   * Update roving tabindex so exactly one enabled item has tabindex=0.
   * Priority: first expanded enabled item, otherwise first enabled item.
   */
  private updateRovingTabindex(): void {
    const enabledItems = this.items.filter((i) => !i.disabled);
    if (enabledItems.length === 0) return;

    const expanded = this.getExpandedSet();
    const focusTarget =
      enabledItems.find((i) => expanded.has(i.value)) ?? enabledItems[0];

    for (const item of this.items) {
      item.tabIndex = -1;
    }
    focusTarget.tabIndex = 0;
  }

  /**
   * Handle internal ui-accordion-toggle events from child items.
   * Manages single-expand, multi-expand, and collapsible logic.
   * Dispatches consumer-facing ui-change event.
   */
  private handleItemToggle(e: CustomEvent): void {
    e.stopPropagation(); // Internal event, don't leak to consumer

    const itemValue = e.detail.value as string;
    const expanded = this.getExpandedSet();

    if (this.multiple) {
      // Multi-expand: toggle the item in the set
      const updated = new Set(expanded);
      if (updated.has(itemValue)) {
        updated.delete(itemValue);
      } else {
        updated.add(itemValue);
      }
      this.value = [...updated].join(',');
    } else {
      // Single-expand
      if (expanded.has(itemValue)) {
        // Already open — close only if collapsible
        if (this.collapsible) {
          this.value = '';
        } else {
          return; // No-op
        }
      } else {
        this.value = itemValue;
      }
    }

    this.syncChildStates();

    // Dispatch consumer-facing event
    dispatchCustomEvent(this, 'ui-change', {
      value: this.value,
      expandedItems: [...this.getExpandedSet()],
    });
  }

  /**
   * Sync expanded state to all child items based on current value.
   */
  private syncChildStates(): void {
    const expanded = this.getExpandedSet();
    for (const item of this.items) {
      item.expanded = expanded.has(item.value);
    }
  }

  /**
   * Propagate disabled state to all child items.
   */
  private syncDisabledState(): void {
    if (this.disabled) {
      for (const item of this.items) {
        item.disabled = true;
      }
    }
  }

  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
      }

      :host([disabled]) {
        opacity: 0.5;
      }

      .accordion-wrapper {
        border: var(--ui-accordion-border-width) solid var(--ui-accordion-border);
        border-radius: var(--ui-accordion-radius);
        overflow: hidden;
      }
    `,
  ];

  override render() {
    return html`
      <div
        class="accordion-wrapper"
        @ui-accordion-toggle=${this.handleItemToggle}
        @keydown=${this.handleKeyDown}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `;
  }
}
