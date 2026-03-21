/**
 * Core time value interface. Always stores 24-hour format internally.
 * Display conversion to 12-hour is handled by to12Hour/formatTimeForDisplay.
 */
export interface TimeValue {
  /** Hour in 24-hour format (0-23) */
  hour: number;
  /** Minute (0-59) */
  minute: number;
  /** Second (0-59, default 0) */
  second: number;
}

/**
 * Parse an ISO 8601 time string (HH:mm or HH:mm:ss) into a TimeValue.
 * Returns null for invalid or out-of-range input.
 */
export function parseTimeISO(value: string): TimeValue | null {
  const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const second = match[3] ? parseInt(match[3], 10) : 0;

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    return null;
  }

  return { hour, minute, second };
}

/**
 * Convert a TimeValue to a zero-padded ISO 8601 time string (HH:mm:ss).
 */
export function timeToISO(time: TimeValue): string {
  const h = String(time.hour).padStart(2, '0');
  const m = String(time.minute).padStart(2, '0');
  const s = String(time.second).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * Convert a 24-hour value (0-23) to 12-hour format with AM/PM.
 * Handles boundary cases: 0 -> 12 AM, 12 -> 12 PM.
 */
export function to12Hour(hour24: number): { hour: number; period: 'AM' | 'PM' } {
  if (hour24 === 0) return { hour: 12, period: 'AM' };
  if (hour24 < 12) return { hour: hour24, period: 'AM' };
  if (hour24 === 12) return { hour: 12, period: 'PM' };
  return { hour: hour24 - 12, period: 'PM' };
}

/**
 * Convert a 12-hour value with AM/PM to 24-hour format (0-23).
 * Handles boundary cases: 12 AM -> 0, 12 PM -> 12.
 */
export function to24Hour(hour12: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

/**
 * Validate that end time is after start time.
 * Returns true if either value is empty/invalid (skip validation).
 * When allowOvernight is true, any different time is considered valid.
 */
export function isEndTimeAfterStart(
  startValue: string,
  endValue: string,
  allowOvernight = false,
): boolean {
  const start = parseTimeISO(startValue);
  const end = parseTimeISO(endValue);
  if (!start || !end) return true;

  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;

  if (allowOvernight) {
    return startMinutes !== endMinutes;
  }
  return endMinutes > startMinutes;
}

/**
 * Clamp an hour value to valid range.
 * In 12-hour mode: 1-12. In 24-hour mode: 0-23.
 */
export function clampHour(hour: number, is12Hour: boolean): number {
  if (is12Hour) {
    return Math.max(1, Math.min(12, hour));
  }
  return Math.max(0, Math.min(23, hour));
}

/**
 * Clamp a minute value to valid range (0-59).
 */
export function clampMinute(minute: number): number {
  return Math.max(0, Math.min(59, minute));
}

/**
 * Detect the default hour cycle for a locale.
 * Returns 'h12' for locales using 12-hour clock (en-US, etc.)
 * Returns 'h23' for locales using 24-hour clock (de-DE, etc.)
 */
export function getDefaultHourCycle(locale: string): 'h12' | 'h23' {
  try {
    const resolved = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions();
    return resolved.hourCycle === 'h11' || resolved.hourCycle === 'h12' ? 'h12' : 'h23';
  } catch {
    return 'h12';
  }
}

/**
 * Format a TimeValue for locale-aware display using Intl.DateTimeFormat.
 */
export function formatTimeForDisplay(
  time: TimeValue,
  locale: string,
  hour12: boolean,
): string {
  const date = new Date(2000, 0, 1, time.hour, time.minute, time.second);
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12,
  }).format(date);
}
