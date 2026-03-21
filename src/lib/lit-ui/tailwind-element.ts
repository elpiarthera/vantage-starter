/**
 * TailwindElement Base Class
 *
 * A base class for Lit components that automatically injects Tailwind CSS
 * into the Shadow DOM via constructable stylesheets.
 *
 * Usage:
 * import { TailwindElement } from './lib/lit-ui/tailwind-element';
 * import { html } from 'lit';
 * import { customElement } from 'lit/decorators.js';
 *
 * @customElement('my-component')
 * export class MyComponent extends TailwindElement {
 *   render() {
 *     return html`<div class="p-4 bg-primary text-white">Hello</div>`;
 *   }
 * }
 */

import { LitElement, type CSSResultGroup } from 'lit';

// Import your compiled Tailwind CSS (adjust path as needed)
import tailwindStyles from '../styles/tailwind.css?inline';
// Import host defaults for Shadow DOM @property workaround
import hostDefaults from './host-defaults.css?inline';

// =============================================================================
// SHARED STYLESHEETS (parse once, share across all component instances)
// =============================================================================

const tailwindSheet = new CSSStyleSheet();
tailwindSheet.replaceSync(tailwindStyles);

const hostDefaultsSheet = new CSSStyleSheet();
hostDefaultsSheet.replaceSync(hostDefaults);

// =============================================================================
// @property RULES WORKAROUND
// =============================================================================

/**
 * Extract @property rules from Tailwind CSS and apply them to the document.
 * CSS @property declarations only work at the document level, not inside
 * Shadow DOM (W3C spec limitation).
 */
const propertyRulePattern = /@property\s+[^{]+\{[^}]+\}/g;
const propertyRules = tailwindStyles.match(propertyRulePattern) || [];

if (propertyRules.length > 0 && typeof document !== 'undefined') {
  const propertySheet = new CSSStyleSheet();
  propertySheet.replaceSync(propertyRules.join('\n'));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, propertySheet];
}

// =============================================================================
// TAILWIND ELEMENT BASE CLASS
// =============================================================================

/**
 * Base class for Tailwind-enabled web components.
 */
export class TailwindElement extends LitElement {
  static styles: CSSResultGroup = [];

  override connectedCallback(): void {
    super.connectedCallback();
    this._adoptTailwindStyles();
  }

  private _adoptTailwindStyles(): void {
    if (this.shadowRoot) {
      const existingSheets = this.shadowRoot.adoptedStyleSheets;
      this.shadowRoot.adoptedStyleSheets = [
        tailwindSheet,
        hostDefaultsSheet,
        ...existingSheets,
      ];
    }
  }
}
