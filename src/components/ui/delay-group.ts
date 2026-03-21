/**
 * Tooltip Delay Group - Module-level singleton for coordinating tooltip delays.
 *
 * When moving between adjacent tooltips, the delay group allows the second
 * tooltip to skip its show delay if the first tooltip closed recently
 * (within the group window, default 300ms). This creates a smooth "hover
 * through" experience similar to native menu bars.
 *
 * Also tracks the currently-active tooltip instance to force-close it
 * when a new tooltip opens, preventing visual overlap.
 */

/**
 * Interface that tooltip instances must implement to participate
 * in the delay group's active instance tracking.
 */
export interface TooltipInstance {
  hide(): void;
}

class TooltipDelayGroup {
  /** Timestamp of the last tooltip close event */
  private lastCloseTimestamp = 0;

  /** Currently-open tooltip instance (for force-close on new open) */
  private activeInstance: TooltipInstance | null = null;

  /** Time window in ms for skip-delay behavior */
  private windowMs = 300;

  /** Record that a tooltip just closed */
  notifyClosed(): void {
    this.lastCloseTimestamp = Date.now();
    this.activeInstance = null;
  }

  /** Check if we're within the delay group window */
  isInGroupWindow(): boolean {
    return Date.now() - this.lastCloseTimestamp < this.windowMs;
  }

  /** Set the currently-active tooltip, force-closing the previous one if different */
  setActive(instance: TooltipInstance): void {
    if (this.activeInstance && this.activeInstance !== instance) {
      this.activeInstance.hide();
    }
    this.activeInstance = instance;
  }

  /** Clear active instance if it matches the given instance */
  clearActive(instance: TooltipInstance): void {
    if (this.activeInstance === instance) {
      this.activeInstance = null;
    }
  }
}

/** Singleton shared across all tooltip instances on the page */
export const delayGroup = new TooltipDelayGroup();
