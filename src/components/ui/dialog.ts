/**
 * ui-dialog - An accessible modal dialog component
 *
 * Features:
 * - Native `<dialog>` element with showModal() for automatic focus trapping
 * - Three sizes: sm, md, lg (controls max-width)
 * - Escape key handling via native cancel event
 * - Backdrop click detection for dismissible dialogs
 * - ARIA attributes: aria-labelledby, aria-describedby
 * - Named slots for title, content, and footer
 * - Smooth enter/exit animations with reduced-motion support
 * - Focus restoration to trigger element on close
 * - Nested dialogs supported via browser's top layer stack
 * - Optional close button via show-close-button attribute
 *
 * @slot title - Dialog title content
 * @slot - Default slot for dialog body
 * @slot footer - Dialog footer (typically action buttons)
 *
 * @fires close - When dialog closes, detail: { reason: 'escape' | 'backdrop' | 'programmatic' }
 *
 * @example Basic usage
 * ```html
 * <ui-dialog open>
 *   <span slot="title">Dialog Title</span>
 *   <p>Dialog content goes here.</p>
 *   <div slot="footer">
 *     <ui-button @click=${() => dialog.close()}>Close</ui-button>
 *   </div>
 * </ui-dialog>
 * ```
 *
 * @example Nested dialogs
 * To prevent parent dialogs from receiving close events from nested dialogs,
 * use stopPropagation on the close event:
 * ```html
 * <ui-dialog id="parent">
 *   <ui-dialog id="child" @close=${(e) => e.stopPropagation()}>
 *   </ui-dialog>
 * </ui-dialog>
 * ```
 */

import { html, css, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { TailwindElement } from '../../lib/lit-ui/tailwind-element';

/**
 * Dialog size types for max-width
 */
export type DialogSize = 'sm' | 'md' | 'lg';

/**
 * Close reason types for the close event detail
 */
export type CloseReason = 'escape' | 'backdrop' | 'programmatic';

/**
 * An accessible modal dialog component using the native HTML dialog element.
 * Provides automatic focus trapping, Escape key handling, and backdrop via showModal().
 *
 * @slot - Default slot for dialog content
 * @slot title - Slot for dialog title/header
 * @slot footer - Slot for dialog footer/actions
 *
 * @fires close - Fired when the dialog closes, with { reason: CloseReason } detail
 */
@customElement('ui-dialog')
export class Dialog extends TailwindElement {
  /**
   * Whether the dialog is open.
   * When true, the dialog is displayed using showModal().
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * The size of the dialog (affects max-width).
   * - sm: max-w-sm (24rem)
   * - md: max-w-md (28rem)
   * - lg: max-w-lg (32rem)
   * @default 'md'
   */
  @property({ type: String })
  size: DialogSize = 'md';

  /**
   * Whether the dialog can be dismissed via Escape key or backdrop click.
   * When false, only programmatic close() works.
   * @default true
   */
  @property({ type: Boolean })
  dismissible = true;

  /**
   * Whether to show an X close button in the top-right corner.
   * @default false
   */
  @property({ type: Boolean, attribute: 'show-close-button' })
  showCloseButton = false;

  /**
   * Reference to the native dialog element.
   */
  @query('dialog')
  private dialogEl!: HTMLDialogElement;

  /**
   * The element that had focus before the dialog opened.
   * Focus is restored to this element on close.
   */
  private triggerElement: HTMLElement | null = null;

  /**
   * Static styles for dialog animations and layout.
   * Uses native CSS transitions with @starting-style for enter animations
   * and transition-behavior: allow-discrete for exit animations.
   */
  static override styles = css`
    :host {
      display: contents;
    }

    dialog {
      border: none;
      padding: 0;
      background: transparent;
      max-height: 85vh;
      max-width: 90vw;
      margin: auto;

      /* Animation styles */
      opacity: 0;
      transform: scale(0.95);
      transition:
        opacity 150ms ease-out,
        transform 150ms ease-out,
        display 150ms allow-discrete,
        overlay 150ms allow-discrete;
    }

    dialog[open] {
      opacity: 1;
      transform: scale(1);
    }

    @starting-style {
      dialog[open] {
        opacity: 0;
        transform: scale(0.95);
      }
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition:
        opacity 150ms ease-out,
        display 150ms allow-discrete,
        overlay 150ms allow-discrete;
    }

    dialog[open]::backdrop {
      opacity: 1;
    }

    @starting-style {
      dialog[open]::backdrop {
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      dialog,
      dialog::backdrop {
        transition: none;
      }
    }

    .dialog-content {
      width: 100%;
    }
  `;

  /**
   * Called when reactive properties change.
   * Syncs the open property with the native dialog state.
   */
  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('open')) {
      if (this.open && !this.dialogEl.open) {
        this.dialogEl.showModal();
      } else if (!this.open && this.dialogEl.open) {
        this.dialogEl.close();
      }
    }
  }

  /**
   * Opens the dialog.
   * Stores the currently focused element for focus restoration on close.
   */
  show() {
    this.triggerElement = document.activeElement as HTMLElement;
    this.open = true;
  }

  /**
   * Closes the dialog.
   * Emits a close event with the specified reason.
   * @param reason - The reason for closing (default: 'programmatic')
   */
  close(reason: CloseReason = 'programmatic') {
    this.emitClose(reason);
  }

  /**
   * Emits the close event and updates the open state.
   * @param reason - The reason for closing
   */
  private emitClose(reason: CloseReason) {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent('close', {
        detail: { reason },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handles the native cancel event (triggered by Escape key).
   * Prevents default if the dialog is not dismissible.
   */
  private handleCancel(e: Event) {
    if (!this.dismissible) {
      e.preventDefault();
      return;
    }
    this.emitClose('escape');
  }

  /**
   * Handles the native close event.
   * Restores focus to the element that opened the dialog.
   */
  private handleNativeClose() {
    if (
      this.triggerElement &&
      typeof this.triggerElement.focus === 'function'
    ) {
      this.triggerElement.focus();
    }
    this.triggerElement = null;
  }

  /**
   * Handles clicks on the dialog element.
   * Closes if clicking the backdrop area (not the content) and dismissible.
   */
  private handleDialogClick(e: MouseEvent) {
    // Only close if clicking the dialog backdrop area, not content
    if (e.target === this.dialogEl && this.dismissible) {
      this.emitClose('backdrop');
    }
  }

  /**
   * Gets the size class for the dialog content.
   */
  private getSizeClasses(): string {
    const sizeClasses: Record<DialogSize, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
    };
    return sizeClasses[this.size];
  }

  override render() {
    return html`
      <dialog
        @cancel=${this.handleCancel}
        @close=${this.handleNativeClose}
        @click=${this.handleDialogClick}
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <div
          class="dialog-content ${this.getSizeClasses()} bg-card text-card-foreground rounded-lg shadow-lg p-6 relative"
          @click=${(e: Event) => e.stopPropagation()}
        >
          ${this.showCloseButton
            ? html`
                <button
                  class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  @click=${() => this.close('programmatic')}
                  aria-label="Close dialog"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              `
            : nothing}
          <header id="dialog-title" class="text-lg font-semibold mb-4">
            <slot name="title"></slot>
          </header>
          <div id="dialog-description" class="text-muted-foreground">
            <slot></slot>
          </div>
          <footer class="mt-6 flex justify-end gap-3">
            <slot name="footer"></slot>
          </footer>
        </div>
      </dialog>
    `;
  }
}

// TypeScript global interface declaration for HTMLElementTagNameMap
declare global {
  interface HTMLElementTagNameMap {
    'ui-dialog': Dialog;
  }
}
