/**
 * ui-button - A customizable button component
 *
 * Features:
 * - Five visual variants: primary, secondary, outline, ghost, destructive
 * - Three sizes: sm, md, lg
 * - Form participation via ElementInternals (submit/reset)
 * - Disabled state with proper accessibility (aria-disabled, remains in tab order)
 * - Loading state with pulsing dots spinner (aria-busy)
 * - Icon slots (icon-start, icon-end) for icon placement
 * - Inner glow focus ring for visibility across all variants
 * - Keyboard accessible (Enter/Space via native button)
 *
 * @example
 * ```html
 * <ui-button variant="primary" size="md">Click me</ui-button>
 * <ui-button variant="destructive" disabled>Delete</ui-button>
 * <ui-button loading>Saving...</ui-button>
 * <ui-button type="submit">Submit Form</ui-button>
 * ```
 */

import { html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { TailwindElement } from '../../lib/lit-ui/tailwind-element';

/**
 * Button variant types for visual styling
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';

/**
 * Button size types for padding and font sizing
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button type for form behavior
 */
export type ButtonType = 'button' | 'submit' | 'reset';

/**
 * A customizable button component with multiple variants and sizes.
 * Supports form participation via ElementInternals for submit/reset behavior.
 *
 * @slot - Default slot for button text content
 * @slot icon-start - Slot for icon before text
 * @slot icon-end - Slot for icon after text
 */
@customElement('ui-button')
export class Button extends TailwindElement {
  /**
   * Enable form association for this custom element.
   * This allows the button to participate in form submission/reset.
   */
  static formAssociated = true;

  /**
   * ElementInternals for form participation and ARIA.
   */
  private internals: ElementInternals;

  /**
   * The visual style variant of the button.
   * @default 'primary'
   */
  @property({ type: String })
  variant: ButtonVariant = 'primary';

  /**
   * The size of the button affecting padding and font size.
   * @default 'md'
   */
  @property({ type: String })
  size: ButtonSize = 'md';

  /**
   * The button type for form behavior.
   * - 'button': No form action (default)
   * - 'submit': Submits the containing form
   * - 'reset': Resets the containing form
   * @default 'button'
   */
  @property({ type: String })
  type: ButtonType = 'button';

  /**
   * Whether the button is disabled.
   * Uses aria-disabled for better screen reader accessibility.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the button is in a loading state.
   * Shows a pulsing dots spinner and prevents interaction.
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  loading = false;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  /**
   * Static styles for focus ring (inner glow) and loading spinner
   * that cannot be expressed with Tailwind utility classes alone.
   */
  static override styles = css`
    :host {
      display: inline-block;
    }

    :host([disabled]),
    :host([loading]) {
      pointer-events: none;
    }

    button:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px var(--color-ring);
    }

    /* Pulsing dots spinner */
    .spinner {
      display: inline-flex;
      align-items: center;
      gap: 0.2em;
    }

    .spinner::before,
    .spinner::after,
    .spinner > span {
      content: '';
      width: 0.4em;
      height: 0.4em;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 1.2s ease-in-out infinite;
    }

    .spinner::before {
      animation-delay: 0s;
    }
    .spinner > span {
      animation-delay: 0.2s;
    }
    .spinner::after {
      animation-delay: 0.4s;
    }

    @keyframes pulse {
      0%,
      80%,
      100% {
        opacity: 0.3;
        transform: scale(0.7);
      }
      40% {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Icon slots - scale with button font-size via em units */
    ::slotted([slot='icon-start']),
    ::slotted([slot='icon-end']) {
      width: 1em;
      height: 1em;
      flex-shrink: 0;
    }
  `;

  /**
   * Get the Tailwind classes for the current variant.
   */
  private getVariantClasses(): string {
    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-primary text-primary-foreground hover:opacity-90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
      outline:
        'border border-border bg-transparent text-foreground hover:bg-accent',
      ghost: 'bg-transparent text-foreground hover:bg-accent',
      destructive:
        'bg-destructive text-destructive-foreground hover:opacity-90',
    };
    return variants[this.variant];
  }

  /**
   * Get the Tailwind classes for the current size.
   * Includes gap for icon spacing.
   */
  private getSizeClasses(): string {
    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
    };
    return sizes[this.size];
  }

  /**
   * Get the base classes common to all button variants.
   */
  private getBaseClasses(): string {
    return 'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150';
  }

  /**
   * Get classes for the disabled/loading state.
   */
  private getDisabledClasses(): string {
    return this.disabled || this.loading
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer';
  }

  /**
   * Render the pulsing dots spinner.
   * Uses three dots with staggered animation delays.
   */
  private renderSpinner() {
    return html`<span class="spinner" aria-hidden="true"><span></span></span>`;
  }

  /**
   * Handle click events.
   * Prevents action when disabled or loading.
   * Triggers form submission or reset based on button type.
   */
  private handleClick(e: MouseEvent) {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Handle form actions via ElementInternals
    if (this.type === 'submit' && this.internals.form) {
      this.internals.form.requestSubmit();
    } else if (this.type === 'reset' && this.internals.form) {
      this.internals.form.reset();
    }
  }

  /**
   * Combine all classes into a single string.
   */
  private getButtonClasses(): string {
    return [
      this.getBaseClasses(),
      this.getVariantClasses(),
      this.getSizeClasses(),
      this.getDisabledClasses(),
    ].join(' ');
  }

  override render() {
    return html`
      <button
        class=${this.getButtonClasses()}
        ?aria-disabled=${this.disabled || this.loading}
        ?aria-busy=${this.loading}
        aria-label=${this.loading ? 'Loading' : nothing}
        @click=${this.handleClick}
        type="button"
      >
        <slot name="icon-start"></slot>
        ${this.loading ? this.renderSpinner() : html`<slot></slot>`}
        <slot name="icon-end"></slot>
      </button>
    `;
  }
}

// TypeScript global interface declaration for HTMLElementTagNameMap
declare global {
  interface HTMLElementTagNameMap {
    'ui-button': Button;
  }
}
