/**
 * Column preferences persistence utilities.
 *
 * Provides localStorage save/load/clear functions for column preferences
 * with versioning support for future migrations.
 */

import type { ColumnPreferences } from './types.js';

const STORAGE_KEY_PREFIX = 'lui-data-table-prefs';
const PREFS_VERSION = 1;

interface StoredPreferences extends ColumnPreferences {
  version: number;
}

/**
 * Save column preferences to localStorage.
 * Fails silently if storage is unavailable or full.
 *
 * @param tableId - Unique identifier for the table
 * @param prefs - Column preferences to save
 */
export function savePreferences(tableId: string, prefs: ColumnPreferences): void {
  if (!tableId) return;

  try {
    const key = `${STORAGE_KEY_PREFIX}-${tableId}`;
    const stored: StoredPreferences = {
      ...prefs,
      version: PREFS_VERSION,
    };
    localStorage.setItem(key, JSON.stringify(stored));
  } catch (e) {
    // QuotaExceededError or SecurityError - fail silently
    console.warn('Failed to save table preferences:', e);
  }
}

/**
 * Load column preferences from localStorage.
 * Returns null if no preferences exist or version mismatch.
 *
 * @param tableId - Unique identifier for the table
 * @returns Stored preferences or null
 */
export function loadPreferences(tableId: string): ColumnPreferences | null {
  if (!tableId) return null;

  try {
    const key = `${STORAGE_KEY_PREFIX}-${tableId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const prefs: StoredPreferences = JSON.parse(stored);

    // Version check for future migrations
    if (prefs.version !== PREFS_VERSION) {
      // Clear outdated preferences
      localStorage.removeItem(key);
      return null;
    }

    return {
      columnSizing: prefs.columnSizing ?? {},
      columnOrder: prefs.columnOrder ?? [],
      columnVisibility: prefs.columnVisibility ?? {},
    };
  } catch {
    // Parse error or SecurityError - return null
    return null;
  }
}

/**
 * Clear column preferences from localStorage.
 *
 * @param tableId - Unique identifier for the table
 */
export function clearPreferences(tableId: string): void {
  if (!tableId) return;

  try {
    const key = `${STORAGE_KEY_PREFIX}-${tableId}`;
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
}
