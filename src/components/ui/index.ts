// @lit-ui/tooltip - Accessible tooltip component with SSR support
/// <reference path="./jsx.d.ts" />
import { isServer } from 'lit';

// Export component class and types
export { Tooltip } from './tooltip.js';
export type { Placement } from './tooltip.js';

// Re-export TailwindElement and isServer for convenience
export { TailwindElement, isServer } from '@lit-ui/core';

// Safe custom element registration with collision detection
import { Tooltip } from './tooltip.js';

if (typeof customElements !== 'undefined') {
  if (!customElements.get('lui-tooltip')) {
    customElements.define('lui-tooltip', Tooltip);
  } else if (!isServer && import.meta.env?.DEV) {
    console.warn(
      '[lui-tooltip] Custom element already registered. ' +
        'This may indicate duplicate imports or version conflicts.'
    );
  }
}

// TypeScript global type registration
declare global {
  interface HTMLElementTagNameMap {
    'lui-tooltip': Tooltip;
  }
}
