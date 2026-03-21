import { html, nothing, type TemplateResult } from 'lit';
import type { ToastVariant } from './types.js';

/**
 * Inline SVG icon templates for toast variants.
 * Each SVG is 20x20, stroke-based, using currentColor.
 * The containing element sets color via CSS custom properties.
 */
export const toastIcons: Record<ToastVariant, TemplateResult | typeof nothing> = {
  default: nothing,

  success: html`
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" class="toast-icon">
      <circle cx="12" cy="12" r="10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  `,

  error: html`
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" class="toast-icon">
      <circle cx="12" cy="12" r="10"/>
      <path d="m15 9-6 6"/>
      <path d="m9 9 6 6"/>
    </svg>
  `,

  warning: html`
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" class="toast-icon">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <path d="M12 9v4"/>
      <path d="M12 17h.01"/>
    </svg>
  `,

  info: html`
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" class="toast-icon">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4"/>
      <path d="M12 8h.01"/>
    </svg>
  `,

  loading: html`
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" class="toast-icon toast-icon-loading">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  `,
};
