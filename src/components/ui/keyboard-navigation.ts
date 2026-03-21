/**
 * Keyboard navigation manager for ARIA grid pattern.
 * Handles arrow keys, Home/End, PageUp/PageDown per W3C APG.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 */

/**
 * Represents a position in the grid.
 */
export interface GridPosition {
  /** Zero-based row index */
  row: number;
  /** Zero-based column index */
  col: number;
}

/**
 * Grid bounds for navigation constraints.
 */
export interface GridBounds {
  /** Total number of rows in the grid */
  rowCount: number;
  /** Total number of columns in the grid */
  colCount: number;
  /** Number of visible rows for PageUp/PageDown */
  visibleRowCount: number;
}

/**
 * Manages keyboard navigation for ARIA grid pattern.
 * Handles arrow keys, Home/End, PageUp/PageDown per W3C APG.
 *
 * @example
 * ```ts
 * const nav = new KeyboardNavigationManager();
 * nav.setBounds({ rowCount: 100, colCount: 5, visibleRowCount: 10 });
 *
 * // Handle keydown
 * const newPos = nav.handleKeyDown(event);
 * if (newPos) {
 *   focusCell(newPos);
 * }
 * ```
 */
export class KeyboardNavigationManager {
  private position: GridPosition = { row: 0, col: 0 };
  private bounds: GridBounds = { rowCount: 0, colCount: 0, visibleRowCount: 10 };

  /**
   * Update grid bounds when data or columns change.
   * Clamps current position to new bounds.
   */
  setBounds(bounds: GridBounds): void {
    this.bounds = bounds;
    // Clamp position to new bounds
    this.position.row = Math.min(this.position.row, Math.max(0, bounds.rowCount - 1));
    this.position.col = Math.min(this.position.col, Math.max(0, bounds.colCount - 1));
  }

  /**
   * Get current focused position.
   * Returns a copy to prevent external mutation.
   */
  getPosition(): GridPosition {
    return { ...this.position };
  }

  /**
   * Set position directly (e.g., from click).
   * Clamps to grid bounds.
   */
  setPosition(pos: GridPosition): void {
    this.position = {
      row: Math.max(0, Math.min(pos.row, this.bounds.rowCount - 1)),
      col: Math.max(0, Math.min(pos.col, this.bounds.colCount - 1)),
    };
  }

  /**
   * Handle keyboard event and return new position if changed.
   * Returns null if key not handled.
   *
   * Supported keys:
   * - ArrowRight/ArrowLeft: Move column
   * - ArrowDown/ArrowUp: Move row
   * - Home: Go to first cell in row (Ctrl+Home: first cell in grid)
   * - End: Go to last cell in row (Ctrl+End: last cell in grid)
   * - PageDown/PageUp: Jump by visible row count
   */
  handleKeyDown(e: KeyboardEvent): GridPosition | null {
    const { key, ctrlKey, metaKey } = e;
    const ctrl = ctrlKey || metaKey;
    let newPos: GridPosition | null = null;

    switch (key) {
      case 'ArrowRight':
        newPos = this.moveCol(1);
        break;
      case 'ArrowLeft':
        newPos = this.moveCol(-1);
        break;
      case 'ArrowDown':
        newPos = this.moveRow(1);
        break;
      case 'ArrowUp':
        newPos = this.moveRow(-1);
        break;
      case 'Home':
        newPos = ctrl ? this.moveToStart() : this.moveToRowStart();
        break;
      case 'End':
        newPos = ctrl ? this.moveToEnd() : this.moveToRowEnd();
        break;
      case 'PageDown':
        newPos = this.moveRow(this.bounds.visibleRowCount);
        break;
      case 'PageUp':
        newPos = this.moveRow(-this.bounds.visibleRowCount);
        break;
      default:
        return null;
    }

    if (newPos) {
      this.position = newPos;
    }
    return newPos;
  }

  /**
   * Move column by delta, clamped to bounds.
   */
  private moveCol(delta: number): GridPosition {
    const newCol = Math.max(0, Math.min(this.position.col + delta, this.bounds.colCount - 1));
    return { row: this.position.row, col: newCol };
  }

  /**
   * Move row by delta, clamped to bounds.
   */
  private moveRow(delta: number): GridPosition {
    const newRow = Math.max(0, Math.min(this.position.row + delta, this.bounds.rowCount - 1));
    return { row: newRow, col: this.position.col };
  }

  /**
   * Move to first cell in current row.
   */
  private moveToRowStart(): GridPosition {
    return { row: this.position.row, col: 0 };
  }

  /**
   * Move to last cell in current row.
   */
  private moveToRowEnd(): GridPosition {
    return { row: this.position.row, col: this.bounds.colCount - 1 };
  }

  /**
   * Move to first cell in grid (Ctrl+Home).
   */
  private moveToStart(): GridPosition {
    return { row: 0, col: 0 };
  }

  /**
   * Move to last cell in grid (Ctrl+End).
   */
  private moveToEnd(): GridPosition {
    return { row: this.bounds.rowCount - 1, col: this.bounds.colCount - 1 };
  }
}
