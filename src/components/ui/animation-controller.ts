/**
 * AnimationController - Slide/fade animation with reduced-motion support
 *
 * Provides slide transitions for month navigation that automatically
 * fall back to fade when prefers-reduced-motion is enabled. Cancels
 * in-progress animations before starting new ones to prevent visual
 * glitches. Rapid navigation skips animation entirely.
 */

export class AnimationController {
  private target: HTMLElement;
  private duration: number;
  private currentAnimation: Animation | null = null;
  private prefersReducedMotion: boolean;
  private mediaQuery: MediaQueryList;
  private isAnimating: boolean = false;

  private onMotionChange = (e: MediaQueryListEvent): void => {
    this.prefersReducedMotion = e.matches;
  };

  constructor(target: HTMLElement, duration = 200) {
    this.target = target;
    this.duration = duration;
    this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = this.mediaQuery.matches;
    this.mediaQuery.addEventListener('change', this.onMotionChange);
  }

  /**
   * Run a slide or fade transition based on direction and motion preference.
   * Skips animation entirely if already animating (rapid navigation).
   */
  async transition(direction: 'left' | 'right'): Promise<void> {
    // Skip animation on rapid navigation — content updates instantly
    if (this.isAnimating) return;

    // Cancel any lingering animation
    if (this.currentAnimation) {
      this.currentAnimation.cancel();
      this.currentAnimation = null;
    }

    this.isAnimating = true;

    try {
      if (this.prefersReducedMotion) {
        await this.fade();
      } else {
        await this.slide(direction);
      }
    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * Returns whether an animation is currently in progress.
   */
  getIsAnimating(): boolean {
    return this.isAnimating;
  }

  /**
   * Cancel any in-progress animation and clean up resources.
   */
  destroy(): void {
    if (this.currentAnimation) {
      this.currentAnimation.cancel();
      this.currentAnimation = null;
    }
    this.mediaQuery.removeEventListener('change', this.onMotionChange);
    this.isAnimating = false;
  }

  private async slide(direction: 'left' | 'right'): Promise<void> {
    const offset = direction === 'left' ? '-100%' : '100%';

    this.currentAnimation = this.target.animate(
      [
        { transform: `translateX(${offset})`, opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 },
      ],
      {
        duration: this.duration,
        easing: 'ease-out',
        fill: 'forwards',
      }
    );

    try {
      await this.currentAnimation.finished;
    } catch {
      // Animation was canceled — silently ignore AbortError / DOMException
    }

    this.currentAnimation = null;
  }

  private async fade(): Promise<void> {
    this.currentAnimation = this.target.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      {
        duration: 150,
        easing: 'ease-in-out',
        fill: 'forwards',
      }
    );

    try {
      await this.currentAnimation.finished;
    } catch {
      // Animation was canceled — silently ignore AbortError / DOMException
    }

    this.currentAnimation = null;
  }
}
