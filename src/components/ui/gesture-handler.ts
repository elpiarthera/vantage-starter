/**
 * GestureHandler - Pointer Events swipe detection
 *
 * Detects horizontal swipe gestures using the Pointer Events API.
 * Sets touch-action: pan-y to allow vertical scrolling while
 * capturing horizontal swipes. Evaluates swipe only on pointerup
 * (no pointermove tracking) for simplicity and performance.
 */

export class GestureHandler {
  private startX: number = 0;
  private startY: number = 0;
  private pointerId: number | null = null;

  private element: HTMLElement;
  private onSwipe: (direction: 'left' | 'right') => void;
  private threshold: number;
  private ratio: number;

  constructor(
    element: HTMLElement,
    onSwipe: (direction: 'left' | 'right') => void,
    threshold = 50,
    ratio = 1.5
  ) {
    this.element = element;
    this.onSwipe = onSwipe;
    this.threshold = threshold;
    this.ratio = ratio;
  }

  /**
   * Attach pointer event listeners and set touch-action: pan-y
   * to allow vertical scroll while capturing horizontal swipe.
   */
  attach(): void {
    this.element.style.touchAction = 'pan-y';
    this.element.addEventListener('pointerdown', this.onPointerDown);
    this.element.addEventListener('pointerup', this.onPointerUp);
    this.element.addEventListener('pointercancel', this.onPointerCancel);
  }

  /**
   * Remove all pointer event listeners and reset touch-action.
   */
  detach(): void {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointerup', this.onPointerUp);
    this.element.removeEventListener('pointercancel', this.onPointerCancel);
    this.element.style.touchAction = '';
  }

  /**
   * Alias for detach() for semantic clarity.
   */
  destroy(): void {
    this.detach();
  }

  private onPointerDown = (e: PointerEvent): void => {
    // Ignore multi-touch — only track first pointer
    if (this.pointerId !== null) return;
    this.pointerId = e.pointerId;
    this.startX = e.clientX;
    this.startY = e.clientY;
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    if (Math.abs(dx) > this.threshold && Math.abs(dx) > Math.abs(dy) * this.ratio) {
      this.onSwipe(dx > 0 ? 'right' : 'left');
    }

    this.pointerId = null;
  };

  private onPointerCancel = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
  };
}
