/**
 * Keyboard navigation manager for calendar grid.
 *
 * Implements WAI-ARIA APG Grid Pattern with roving tabindex.
 * Manages focus imperatively (not via Lit reactive properties)
 * to avoid re-render loops.
 */

/**
 * Direction for focus movement within the calendar grid.
 */
export type NavigationDirection = 'left' | 'right' | 'up' | 'down' | 'home' | 'end';

/**
 * Manages roving tabindex and keyboard focus for a grid of cells.
 *
 * Only the focused cell has tabindex="0"; all others have tabindex="-1".
 * Focus is managed imperatively via DOM manipulation, not Lit state,
 * to prevent unnecessary re-renders.
 */
export class KeyboardNavigationManager {
  private cells: HTMLElement[] = [];
  private focusedIndex: number = 0;
  private columns: number;

  constructor(columns: number = 7) {
    this.columns = columns;
  }

  /**
   * Update the list of focusable cells.
   * Clamps focusedIndex to valid range and updates tabindexes.
   */
  setCells(cells: HTMLElement[]): void {
    this.cells = cells;
    if (this.cells.length > 0) {
      this.focusedIndex = Math.max(0, Math.min(this.focusedIndex, this.cells.length - 1));
    } else {
      this.focusedIndex = 0;
    }
    this.updateTabindexes();
  }

  /**
   * Set the focused cell index.
   * Clamps to valid range and updates tabindexes.
   */
  setFocusedIndex(index: number): void {
    if (this.cells.length === 0) return;
    this.focusedIndex = Math.max(0, Math.min(index, this.cells.length - 1));
    this.updateTabindexes();
  }

  /**
   * Returns the current focused cell index.
   */
  getFocusedIndex(): number {
    return this.focusedIndex;
  }

  /**
   * Update the column count at runtime.
   * Allows switching between 7-column (month grid) and 4-column
   * (decade/century grid) layouts without recreating the manager.
   */
  setColumns(columns: number): void {
    this.columns = columns;
  }

  /**
   * Returns the current column count.
   */
  getColumns(): number {
    return this.columns;
  }

  /**
   * Move focus in the given direction.
   *
   * Returns the new focused index, or -1 if the movement would
   * cross the grid boundary (signals month navigation to caller).
   */
  moveFocus(direction: NavigationDirection): number {
    if (this.cells.length === 0) return -1;

    let newIndex: number;

    switch (direction) {
      case 'left':
        newIndex = this.focusedIndex - 1;
        break;
      case 'right':
        newIndex = this.focusedIndex + 1;
        break;
      case 'up':
        newIndex = this.focusedIndex - this.columns;
        break;
      case 'down':
        newIndex = this.focusedIndex + this.columns;
        break;
      case 'home': {
        const rowStart = Math.floor(this.focusedIndex / this.columns) * this.columns;
        newIndex = rowStart;
        break;
      }
      case 'end': {
        const rowStart = Math.floor(this.focusedIndex / this.columns) * this.columns;
        newIndex = Math.min(rowStart + this.columns - 1, this.cells.length - 1);
        break;
      }
    }

    // Out of bounds — signal boundary crossing
    if (newIndex < 0 || newIndex >= this.cells.length) {
      return -1;
    }

    this.focusedIndex = newIndex;
    this.updateTabindexes();
    this.cells[this.focusedIndex].focus();
    return this.focusedIndex;
  }

  /**
   * Focus the current cell. Useful after month navigation
   * when cells have been replaced in the DOM.
   */
  focusCurrent(): void {
    if (this.cells.length > 0 && this.cells[this.focusedIndex]) {
      this.cells[this.focusedIndex].focus();
    }
  }

  /**
   * Set tabindex="0" on the focused cell, tabindex="-1" on all others.
   */
  private updateTabindexes(): void {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i].tabIndex = i === this.focusedIndex ? 0 : -1;
    }
  }
}
