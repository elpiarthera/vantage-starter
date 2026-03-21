/**
 * Range utility functions for date range picker.
 *
 * Pure functions for range validation, formatting, and preview logic.
 * All date parameters are ISO 8601 strings (YYYY-MM-DD).
 */

import { parseISO, differenceInCalendarDays, isWithinInterval, isBefore, startOfDay } from 'date-fns';

/**
 * Result of range duration validation.
 */
export interface RangeValidation {
  valid: boolean;
  error: string;
}

/**
 * Check if a date falls within a start-end range (inclusive).
 * Returns false if either start or end is missing.
 *
 * @param dateISO - The date to check (YYYY-MM-DD)
 * @param startISO - Range start date (YYYY-MM-DD)
 * @param endISO - Range end date (YYYY-MM-DD)
 * @returns true if dateISO is within [startISO, endISO] inclusive
 */
export function isDateInRange(dateISO: string, startISO: string, endISO: string): boolean {
  if (!dateISO || !startISO || !endISO) return false;

  const date = startOfDay(parseISO(dateISO));
  const start = startOfDay(parseISO(startISO));
  const end = startOfDay(parseISO(endISO));

  return isWithinInterval(date, { start, end });
}

/**
 * Validate range duration against optional min/max day constraints.
 * Returns { valid: true, error: '' } if valid.
 *
 * @param startISO - Range start date (YYYY-MM-DD)
 * @param endISO - Range end date (YYYY-MM-DD)
 * @param minDays - Minimum number of days (inclusive), 0 = no minimum
 * @param maxDays - Maximum number of days (inclusive), 0 = no maximum
 * @returns RangeValidation with valid flag and error message
 */
export function validateRangeDuration(
  startISO: string,
  endISO: string,
  minDays?: number,
  maxDays?: number,
): RangeValidation {
  if (!startISO || !endISO) {
    return { valid: false, error: 'Start and end dates are required' };
  }

  const start = startOfDay(parseISO(startISO));
  const end = startOfDay(parseISO(endISO));
  const days = differenceInCalendarDays(end, start) + 1; // inclusive count

  if (days < 1) {
    return { valid: false, error: 'End date must be on or after start date' };
  }

  if (minDays && minDays > 0 && days < minDays) {
    return { valid: false, error: `Range must be at least ${minDays} day${minDays === 1 ? '' : 's'}` };
  }

  if (maxDays && maxDays > 0 && days > maxDays) {
    return { valid: false, error: `Range must be at most ${maxDays} day${maxDays === 1 ? '' : 's'}` };
  }

  return { valid: true, error: '' };
}

/**
 * Format start and end dates as ISO 8601 interval: YYYY-MM-DD/YYYY-MM-DD
 * Returns empty string if either date is missing.
 *
 * @param startISO - Range start date (YYYY-MM-DD)
 * @param endISO - Range end date (YYYY-MM-DD)
 * @returns ISO 8601 interval string or empty string
 */
export function formatISOInterval(startISO: string, endISO: string): string {
  if (!startISO || !endISO) return '';
  return `${startISO}/${endISO}`;
}

/**
 * Check if a date falls within a hover preview range.
 * The preview range spans from startISO to hoveredISO (or hoveredISO to startISO
 * if hovered is before start).
 * Returns false if startISO or hoveredISO is empty.
 *
 * @param dateISO - The date to check (YYYY-MM-DD)
 * @param startISO - The selected start date (YYYY-MM-DD)
 * @param hoveredISO - The currently hovered date (YYYY-MM-DD)
 * @returns true if dateISO falls within the preview range
 */
export function isDateInPreview(dateISO: string, startISO: string, hoveredISO: string): boolean {
  if (!dateISO || !startISO || !hoveredISO) return false;

  const date = startOfDay(parseISO(dateISO));
  const start = startOfDay(parseISO(startISO));
  const hovered = startOfDay(parseISO(hoveredISO));

  // Normalize order: preview range is always [min, max]
  const rangeStart = isBefore(hovered, start) ? hovered : start;
  const rangeEnd = isBefore(hovered, start) ? start : hovered;

  return isWithinInterval(date, { start: rangeStart, end: rangeEnd });
}

/**
 * Auto-swap start and end if end is before start.
 * Returns [start, end] in correct chronological order.
 *
 * @param startISO - First selected date (YYYY-MM-DD)
 * @param endISO - Second selected date (YYYY-MM-DD)
 * @returns Tuple of [start, end] in correct order
 */
/**
 * Compute the inclusive day count between two ISO date strings.
 * Returns 0 if either date is missing.
 *
 * @param startISO - Range start date (YYYY-MM-DD)
 * @param endISO - Range end date (YYYY-MM-DD)
 * @returns Inclusive day count (e.g., Jan 10 to Jan 16 = 7 days)
 */
export function computeRangeDuration(startISO: string, endISO: string): number {
  if (!startISO || !endISO) return 0;

  const start = startOfDay(parseISO(startISO));
  const end = startOfDay(parseISO(endISO));

  return differenceInCalendarDays(end, start) + 1;
}

export function normalizeRange(startISO: string, endISO: string): [string, string] {
  if (!startISO || !endISO) return [startISO, endISO];

  const start = startOfDay(parseISO(startISO));
  const end = startOfDay(parseISO(endISO));

  if (isBefore(end, start)) {
    return [endISO, startISO];
  }

  return [startISO, endISO];
}
