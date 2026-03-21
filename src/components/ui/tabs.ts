/**
 * lui-tabs - An accessible tabs container with tablist rendering and state management
 *
 * Features:
 * - Container-rendered tablist: all tab buttons are siblings under role="tablist"
 * - Child discovery via slotchange with SSR hydration workaround
 * - Controlled (value) and uncontrolled (default-value) modes
 * - Dynamic panel add/remove updates tab buttons automatically
 * - Dispatches ui-change event with the new active tab value
 * - ARIA roles, aria-selected, aria-controls, aria-labelledby
 * - Keyboard navigation with orientation-aware arrow keys, Home, End
 * - Automatic and manual activation modes
 * - Roving tabindex for focus management
 * - Disabled tab handling (skipped in keyboard navigation)
 * - SSR compatible via isServer guards
 *
 * @example
 * ```html
 * <lui-tabs value="tab-1">
 *   <lui-tab-panel value="tab-1" label="First">Content 1</lui-tab-panel>
 *   <lui-tab-panel value="tab-2" label="Second">Content 2</lui-tab-panel>
 * </lui-tabs>
 * ```
 *
 * @slot default - Child lui-tab-panel elements
 */

import { html, css, nothing, isServer, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';
import { dispatchCustomEvent } from '@lit-ui/core';
import type { TabPanel } from './tab-panel.js';

/**
 * A tabs container that renders tab buttons from slotted lui-tab-panel
 * metadata and manages active tab state. Supports controlled/uncontrolled
 * modes, disabled state, keyboard navigation, and dynamic panel add/remove.
 *
 * @slot default - Child lui-tab-panel elements
 */
export class Tabs extends TailwindElement {
  /**
   * Discovered child tab panel elements.
   */
  private panels: TabPanel[] = [];

  /**
   * Unique ID prefix for ARIA associations between tabs and panels.
   */
  private tabsId = `lui-tabs-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Tracks which tab currently has focus (distinct from active tab in manual mode).
   */
  private _focusedValue = '';

  /**
   * Computed indicator position/size for the active tab.
   */
  private _indicatorStyle: Record<string, string> = {};

  /**
   * Prevents flash of unstyled indicator on first render.
   */
  private _indicatorReady = false;

  /**
   * Tracks container resize to reposition indicator.
   */
  private resizeObserver: ResizeObserver | null = null;

  /**
   * Whether the left scroll button should be visible.
   */
  @state()
  private _showScrollLeft = false;

  /**
   * Whether the right scroll button should be visible.
   */
  @state()
  private _showScrollRight = false;

  /**
   * Active tab value (controlled mode).
   * @default ''
   */
  @property({ type: String })
  value = '';

  /**
   * Initial active tab for uncontrolled mode.
   * Only used if value is not set.
   * @default ''
   */
  @property({ type: String, attribute: 'default-value' })
  defaultValue = '';

  /**
   * Disable all tabs.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Accessible label for the tablist element.
   * Use when the tablist has no visible label.
   * @default ''
   */
  @property({ type: String })
  label = '';

  /**
   * Orientation of the tablist for keyboard navigation.
   * Horizontal uses ArrowLeft/ArrowRight, vertical uses ArrowUp/ArrowDown.
   * @default 'horizontal'
   */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Tab activation mode for keyboard navigation.
   * Automatic: arrow keys move focus AND activate tab.
   * Manual: arrow keys move focus only, Enter/Space activates.
   * @default 'automatic'
   */
  @property({ type: String, attribute: 'activation-mode' })
  activationMode: 'automatic' | 'manual' = 'automatic';

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.defaultValue && !this.value) {
      this.value = this.defaultValue;
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  /**
   * SSR slotchange workaround: after hydration, manually trigger
   * slotchange to discover children that were server-rendered.
   * Also sets up ResizeObserver for indicator repositioning.
   */
  protected override firstUpdated(): void {
    if (!isServer) {
      const slot = this.shadowRoot?.querySelector(
        'slot:not([name])'
      ) as HTMLSlotElement | null;
      if (slot) {
        slot.dispatchEvent(new Event('slotchange'));
      }

      // Set up ResizeObserver for indicator repositioning and scroll buttons
      const tablist = this.shadowRoot?.querySelector('.tablist') as HTMLElement | null;
      if (tablist) {
        this.resizeObserver = new ResizeObserver(() => {
          this.updateIndicator();
          this.updateScrollButtons();
        });
        this.resizeObserver.observe(tablist);
      }
      this.updateComplete.then(() => {
        this.updateIndicator();
        this.updateScrollButtons();
      });
    }
  }

  /**
   * Compute indicator position/size from the active tab button.
   */
  private updateIndicator(): void {
    if (isServer) return;

    const button = this.shadowRoot?.querySelector(
      `#${this.tabsId}-tab-${this.value}`
    ) as HTMLElement | null;
    const tablist = this.shadowRoot?.querySelector('.tablist') as HTMLElement | null;

    if (!button || !tablist) {
      this._indicatorReady = false;
      this.requestUpdate();
      return;
    }

    const buttonRect = button.getBoundingClientRect();
    const tablistRect = tablist.getBoundingClientRect();

    if (this.orientation === 'vertical') {
      this._indicatorStyle = {
        transform: `translateY(${buttonRect.top - tablistRect.top + tablist.scrollTop}px)`,
        height: `${buttonRect.height}px`,
      };
    } else {
      this._indicatorStyle = {
        transform: `translateX(${buttonRect.left - tablistRect.left + tablist.scrollLeft}px)`,
        width: `${buttonRect.width}px`,
      };
    }

    this._indicatorReady = true;
    this.requestUpdate();
  }

  /**
   * Check if the tablist overflows and update scroll button visibility.
   */
  private updateScrollButtons(): void {
    if (isServer) return;
    if (this.orientation === 'vertical') {
      this._showScrollLeft = false;
      this._showScrollRight = false;
      return;
    }
    const tablist = this.shadowRoot?.querySelector('.tablist') as HTMLElement | null;
    if (!tablist) return;

    this._showScrollLeft = tablist.scrollLeft > 1;
    this._showScrollRight =
      tablist.scrollLeft + tablist.clientWidth < tablist.scrollWidth - 1;
  }

  /**
   * Scroll the tablist in the given direction.
   */
  private scrollTabs(direction: 'left' | 'right'): void {
    const tablist = this.shadowRoot?.querySelector('.tablist') as HTMLElement | null;
    if (!tablist) return;

    const scrollAmount = tablist.clientWidth * 0.75;
    tablist.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }

  /**
   * Sync panel states when value changes.
   * In automatic mode, keep _focusedValue in sync with active value.
   */
  protected override updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('value')) {
      this.syncPanelStates();
      if (this.activationMode === 'automatic') {
        this._focusedValue = this.value;
      }
      this.updateComplete.then(() => this.updateIndicator());
    }
  }

  /**
   * Discover child tab panels from slotchange event.
   * Filters for LUI-TAB-PANEL elements, syncs state, and auto-selects
   * the first non-disabled panel if no value is set.
   */
  private handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements({ flatten: true });
    this.panels = assigned.filter(
      (el) => el.tagName === 'LUI-TAB-PANEL'
    ) as TabPanel[];

    // Auto-select first non-disabled panel if no value set
    if (!this.value && this.panels.length > 0) {
      const firstEnabled = this.panels.find((p) => !p.disabled);
      if (firstEnabled) {
        this.value = firstEnabled.value;
      }
    }

    this._focusedValue = this.value;
    this.syncPanelStates();
    this.requestUpdate();
    this.updateComplete.then(() => {
      this.updateIndicator();
      this.updateScrollButtons();
    });
  }

  /**
   * Handle click on a tab button.
   * Sets the active tab, syncs panel states, and dispatches ui-change event.
   */
  private handleTabClick(panelValue: string, panelDisabled: boolean): void {
    if (this.disabled || panelDisabled) return;

    this.value = panelValue;
    this._focusedValue = panelValue;
    this.syncPanelStates();

    dispatchCustomEvent(this, 'ui-change', { value: this.value });
  }

  /**
   * Handle keyboard navigation on the tablist.
   * Orientation-aware arrow keys, Home, End, and Enter/Space (manual mode).
   */
  private handleKeyDown(e: KeyboardEvent): void {
    const forwardKey =
      this.orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    const backwardKey =
      this.orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';

    const handledKeys = [forwardKey, backwardKey, 'Home', 'End'];
    if (this.activationMode === 'manual') {
      handledKeys.push('Enter', ' ');
    }

    if (!handledKeys.includes(e.key)) return;
    e.preventDefault();

    // Manual mode: Enter/Space activates the currently focused tab
    if (
      this.activationMode === 'manual' &&
      (e.key === 'Enter' || e.key === ' ')
    ) {
      if (this._focusedValue && this._focusedValue !== this.value) {
        const panel = this.panels.find(
          (p) => p.value === this._focusedValue && !p.disabled
        );
        if (panel) {
          this.value = this._focusedValue;
          this.syncPanelStates();
          dispatchCustomEvent(this, 'ui-change', { value: this.value });
        }
      }
      return;
    }

    const enabledPanels = this.panels.filter((p) => !p.disabled);
    if (enabledPanels.length === 0) return;

    const currentFocused = this._focusedValue || this.value;
    const currentIndex = enabledPanels.findIndex(
      (p) => p.value === currentFocused
    );

    let nextIndex: number;
    switch (e.key) {
      case forwardKey:
        nextIndex = (currentIndex + 1) % enabledPanels.length;
        break;
      case backwardKey:
        nextIndex =
          (currentIndex - 1 + enabledPanels.length) % enabledPanels.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = enabledPanels.length - 1;
        break;
      default:
        return;
    }

    const nextPanel = enabledPanels[nextIndex];

    if (this.activationMode === 'automatic') {
      // Automatic: move focus AND activate
      this.value = nextPanel.value;
      this._focusedValue = nextPanel.value;
      this.syncPanelStates();
      dispatchCustomEvent(this, 'ui-change', { value: this.value });
      this.focusTabButton(nextPanel.value);
    } else {
      // Manual: move focus only
      this._focusedValue = nextPanel.value;
      this.requestUpdate();
      this.updateComplete.then(() => {
        this.focusTabButton(nextPanel.value);
      });
    }
  }

  /**
   * Focus a tab button in the shadow DOM by its panel value.
   */
  private focusTabButton(panelValue: string): void {
    const button = this.shadowRoot?.querySelector(
      `#${this.tabsId}-tab-${panelValue}`
    ) as HTMLElement | null;
    button?.focus();
  }

  /**
   * Get the tabindex for a tab button based on activation mode.
   * In automatic mode: active tab gets 0, others -1.
   * In manual mode: focused tab gets 0, others -1.
   */
  private getTabIndex(panel: TabPanel): '0' | '-1' {
    const focusTarget = this._focusedValue || this.value;
    return panel.value === focusTarget ? '0' : '-1';
  }

  /**
   * Check if a panel contains focusable content (links, buttons, inputs, etc.).
   * Used to determine whether active panels need tabindex="0" for keyboard access.
   */
  private panelHasFocusableContent(panel: TabPanel): boolean {
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"])';
    return panel.querySelector(focusableSelector) !== null;
  }

  /**
   * Sync active state and ARIA attributes on all child panels.
   * Sets active, id, aria-labelledby, role, and conditional tabindex on each panel host element.
   * Active panels get tabindex="0" only when they have no focusable children (W3C APG).
   */
  private syncPanelStates(): void {
    for (const panel of this.panels) {
      const isActive = panel.value === this.value;
      panel.active = isActive;
      panel.id = `${this.tabsId}-panel-${panel.value}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute(
        'aria-labelledby',
        `${this.tabsId}-tab-${panel.value}`
      );
      if (isActive) {
        if (this.panelHasFocusableContent(panel)) {
          panel.removeAttribute('tabindex');
        } else {
          panel.setAttribute('tabindex', '0');
        }
      } else {
        panel.removeAttribute('tabindex');
      }
    }

    // Handle lazy panel + tabindex timing: slot content may not be in DOM yet
    const activePanel = this.panels.find((p) => p.value === this.value);
    if (activePanel?.lazy && !isServer) {
      requestAnimationFrame(() => {
        if (this.panelHasFocusableContent(activePanel)) {
          activePanel.removeAttribute('tabindex');
        } else {
          activePanel.setAttribute('tabindex', '0');
        }
      });
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
        pointer-events: none;
      }

      .tablist-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .tablist {
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--ui-tabs-list-gap);
        padding: var(--ui-tabs-list-padding);
        background: var(--ui-tabs-list-bg);
        border-radius: var(--ui-tabs-list-radius);
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .tablist::-webkit-scrollbar {
        display: none;
      }

      :host([orientation='vertical']) .tablist-wrapper {
        display: contents;
      }

      :host([orientation='vertical']) .tablist {
        flex-direction: column;
        align-items: stretch;
      }

      :host([orientation='vertical']) .tabs-wrapper {
        display: flex;
        gap: 1rem;
      }

      .tab-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        border: none;
        background: var(--ui-tabs-tab-bg);
        color: var(--ui-tabs-tab-text);
        font-family: inherit;
        font-size: var(--ui-tabs-tab-font-size);
        font-weight: var(--ui-tabs-tab-font-weight);
        padding: var(--ui-tabs-tab-padding);
        border-radius: var(--ui-tabs-tab-radius);
        cursor: pointer;
        transition:
          color var(--ui-tabs-transition),
          background var(--ui-tabs-transition),
          box-shadow var(--ui-tabs-transition);
      }

      .tab-button:hover:not([aria-disabled='true']) {
        color: var(--ui-tabs-tab-hover-text);
        background: var(--ui-tabs-tab-hover-bg);
      }

      .tab-button.tab-active {
        color: var(--ui-tabs-tab-active-text);
        background: var(--ui-tabs-tab-active-bg);
        box-shadow: var(--ui-tabs-tab-active-shadow);
      }

      .tab-button[aria-disabled='true'] {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .tab-button:focus-visible {
        outline: 2px solid var(--ui-focus-ring-color, var(--ui-tabs-ring));
        outline-offset: 2px;
      }

      .tab-button.tab-active:focus-visible {
        outline: 2px solid var(--ui-focus-ring-color, var(--ui-tabs-ring));
        outline-offset: 2px;
      }

      .scroll-button {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--ui-tabs-scroll-button-size, 2rem);
        height: var(--ui-tabs-scroll-button-size, 2rem);
        border: none;
        background: var(--ui-tabs-list-bg);
        color: var(--ui-tabs-tab-text);
        cursor: pointer;
        border-radius: var(--ui-tabs-tab-radius);
        transition: color var(--ui-tabs-transition), background var(--ui-tabs-transition);
      }

      .scroll-button:hover {
        color: var(--ui-tabs-tab-hover-text);
        background: var(--ui-tabs-tab-hover-bg);
      }

      .panels-container {
        padding: var(--ui-tabs-panel-padding);
        color: var(--ui-tabs-panel-text);
      }

      .tab-indicator {
        position: absolute;
        bottom: 0;
        left: 0;
        height: var(--ui-tabs-indicator-height, 2px);
        background: var(--ui-tabs-indicator-color, var(--color-primary, var(--ui-color-primary)));
        border-radius: var(--ui-tabs-indicator-radius, 9999px);
        transition:
          transform var(--ui-tabs-indicator-transition, 200ms) ease,
          width var(--ui-tabs-indicator-transition, 200ms) ease,
          height var(--ui-tabs-indicator-transition, 200ms) ease,
          opacity 150ms ease;
        pointer-events: none;
      }

      :host([orientation="vertical"]) .tab-indicator {
        bottom: auto;
        top: 0;
        width: var(--ui-tabs-indicator-height, 2px) !important;
      }

      @media (prefers-reduced-motion: reduce) {
        .tab-button {
          transition-duration: 0ms;
        }
        .tab-indicator {
          transition-duration: 0ms;
        }
      }
    `,
  ];

  override render() {
    return html`
      <div
        class="tabs-wrapper"
        @ui-tab-panel-update=${() => this.requestUpdate()}
      >
        <div class="tablist-wrapper">
          ${this._showScrollLeft ? html`
            <button
              class="scroll-button scroll-left"
              aria-hidden="true"
              tabindex="-1"
              @click=${() => this.scrollTabs('left')}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true" width="16" height="16">
                <path d="M10 4l-4 4 4 4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          ` : nothing}

          <div
            class="tablist"
            role="tablist"
            aria-orientation="${this.orientation}"
            aria-label="${this.label || nothing}"
            @keydown=${this.handleKeyDown}
            @scroll=${this.updateScrollButtons}
          >
            ${this.panels.map(
              (panel) => html`
                <button
                  id="${this.tabsId}-tab-${panel.value}"
                  role="tab"
                  aria-selected="${panel.value === this.value ? 'true' : 'false'}"
                  aria-controls="${this.tabsId}-panel-${panel.value}"
                  aria-disabled="${panel.disabled ? 'true' : nothing}"
                  data-state="${panel.value === this.value ? 'active' : 'inactive'}"
                  tabindex="${this.getTabIndex(panel)}"
                  class="tab-button ${panel.value === this.value
                    ? 'tab-active'
                    : ''}"
                  @click=${() => this.handleTabClick(panel.value, panel.disabled)}
                >
                  ${panel.label}
                </button>
              `
            )}
            <div
              class="tab-indicator"
              style=${styleMap({
                ...this._indicatorStyle,
                opacity: this._indicatorReady ? '1' : '0',
              })}
            ></div>
          </div>

          ${this._showScrollRight ? html`
            <button
              class="scroll-button scroll-right"
              aria-hidden="true"
              tabindex="-1"
              @click=${() => this.scrollTabs('right')}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true" width="16" height="16">
                <path d="M6 4l4 4-4 4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          ` : nothing}
        </div>
        <div class="panels-container">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
      </div>
    `;
  }
}
