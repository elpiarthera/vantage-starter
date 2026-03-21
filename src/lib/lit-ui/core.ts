/**
 * @lit-ui/core shim — re-exports everything components expect from '@lit-ui/core'
 * This file is aliased by the esbuild config so components can import from '@lit-ui/core'.
 */

import { type CSSResultGroup, isServer } from 'lit';
export { TailwindElement } from './tailwind-element';
export { isServer };

/**
 * tailwindBaseStyles — components spread this into their static styles array.
 * Since TailwindElement already injects Tailwind via adoptedStyleSheets,
 * this is an empty array. Components get Tailwind for free from the base class.
 */
export const tailwindBaseStyles: CSSResultGroup[] = [];

/**
 * dispatchCustomEvent — typed event dispatcher used by lit-ui components.
 */
export function dispatchCustomEvent<T>(
  el: HTMLElement,
  name: string,
  detail: T,
  options?: { bubbles?: boolean; composed?: boolean; cancelable?: boolean }
): boolean {
  const event = new CustomEvent(name, {
    detail,
    bubbles: options?.bubbles ?? true,
    composed: options?.composed ?? true,
    cancelable: options?.cancelable ?? false,
  });
  return el.dispatchEvent(event);
}
