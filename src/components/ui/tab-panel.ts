/**
 * lui-tab-panel - A tab panel content wrapper for use inside lui-tabs
 *
 * Features:
 * - Simple show/hide wrapper controlled by the parent lui-tabs container
 * - value/label/disabled attributes read by container to render tab buttons
 * - Dispatches internal ui-tab-panel-update event when label or disabled changes
 * - data-state attribute reflects active/inactive for external styling
 * - SSR compatible
 *
 * @slot default - Panel content
 */

import { html, css, nothing, isServer, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { TailwindElement, tailwindBaseStyles } from '@lit-ui/core';
import { dispatchCustomEvent } from '@lit-ui/core';

/**
 * A tab panel content wrapper. Visibility is controlled by the parent
 * lui-tabs container via the active attribute.
 *
 * @slot default - Panel content
 */
export class TabPanel extends TailwindElement {
  /**
   * Unique ID for ARIA associations.
   */
  private panelId = `lui-tp-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Unique identifier for this panel within the tabs group.
   * Used by the parent to match tab buttons to panels.
   * @default ''
   */
  @property({ type: String })
  value = '';

  /**
   * Text label displayed in the tab button.
   * Read by the parent container to render the tablist.
   * @default ''
   */
  @property({ type: String })
  label = '';

  /**
   * Whether this tab is disabled (cannot be activated).
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether this panel is currently active (visible).
   * Set by the parent tabs container — NEVER self-toggled.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  active = false;

  /**
   * When true, panel content is not rendered until first activation.
   * After first activation, content is preserved even when inactive.
   * @default false
   */
  @property({ type: Boolean })
  lazy = false;

  /**
   * Tracks whether this lazy panel has been activated at least once.
   */
  private _hasBeenExpanded = false;

  protected override updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('label') || changedProperties.has('disabled')) {
      // Notify container to re-render tab buttons with fresh metadata
      dispatchCustomEvent(this, 'ui-tab-panel-update', {});
    }

    if (changedProperties.has('active') && !isServer) {
      this.setAttribute('data-state', this.active ? 'active' : 'inactive');
    }

    if (changedProperties.has('active') && this.active) {
      this._hasBeenExpanded = true;
    }
  }

  static override styles = [
    ...tailwindBaseStyles,
    css`
      :host {
        display: block;
      }

      :host(:not([active])) {
        display: none;
      }
    `,
  ];

  override render() {
    if (this.lazy && !this._hasBeenExpanded && !this.active) {
      return nothing;
    }
    return html`<slot></slot>`;
  }
}
