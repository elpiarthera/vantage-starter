/**
 * Date utility functions wrapping date-fns for calendar operations.
 *
 * All date math is delegated to date-fns to handle edge cases
 * (leap years, DST transitions, month boundaries) correctly.
 */

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getYear,
  getMonth,
  format,
  isBefore,
  isAfter,
  startOfDay,
  getISOWeek,
  startOfISOWeek,
  endOfISOWeek,
} from 'date-fns';

// Re-export commonly used date-fns functions for convenience
export {
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getYear,
  getMonth,
  format,
  isBefore,
  isAfter,
  startOfDay,
  getISOWeek,
};

/**
 * Generate all days visible in a calendar grid for the given month.
 *
 * Returns an array of Date objects starting from the first day of the week
 * containing the month's first day, through the last day of the week
 * containing the month's last day. This naturally produces 5-6 complete
 * rows of 7 days, including leading/trailing days from adjacent months.
 *
 * @param month - Any date within the target month
 * @param weekStartsOn - First day of week (0=Sun, 1=Mon, ..., 6=Sat) in date-fns format
 * @returns Array of Date objects for the full calendar grid
 */
export function getCalendarDays(
  month: Date,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
): Date[] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

/**
 * Format a month/year label using Intl.DateTimeFormat for localization.
 *
 * @param month - Any date within the target month
 * @param locale - BCP 47 locale tag (e.g., 'en-US', 'de-DE')
 * @returns Localized string like "January 2026" or "Januar 2026"
 */
export function getMonthYearLabel(month: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(month);
}

/**
 * Map Intl firstDay value to date-fns weekStartsOn value.
 *
 * Intl API uses 1=Monday through 7=Sunday.
 * date-fns uses 0=Sunday through 6=Saturday.
 *
 * @param intlFirstDay - Intl.Locale weekInfo firstDay value (1-7)
 * @returns date-fns weekStartsOn value (0-6)
 */
export function intlFirstDayToDateFns(
  intlFirstDay: number
): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  return (intlFirstDay === 7 ? 0 : intlFirstDay) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Information about a single week row in the calendar grid.
 */
export interface WeekInfo {
  /** ISO 8601 week number (1-53). */
  weekNumber: number;
  /** First day of this calendar row. */
  startDate: Date;
  /** Last day of this calendar row. */
  endDate: Date;
  /** All 7 days in this calendar row. */
  days: Date[];
}

/**
 * Get ISO 8601 week number for a date.
 * Week 1 is the week containing the first Thursday of the year.
 *
 * @param date - The date to get the week number for
 * @returns ISO 8601 week number (1-53)
 */
export function getISOWeekNumber(date: Date): number {
  return getISOWeek(date);
}

/**
 * Get all 7 dates in an ISO week (Monday to Sunday) for the given date.
 *
 * Always returns Monday through Sunday regardless of locale first-day-of-week
 * setting, since ISO 8601 weeks always start on Monday.
 *
 * @param date - Any date within the target ISO week
 * @returns Array of 7 Date objects (Monday to Sunday)
 */
export function getISOWeekDates(date: Date): Date[] {
  return eachDayOfInterval({
    start: startOfISOWeek(date),
    end: endOfISOWeek(date),
  });
}

/**
 * Get all weeks displayed in a calendar month grid with ISO week numbers.
 *
 * Each WeekInfo contains the week number and the 7 displayed days for that
 * calendar row. The `days` array matches what the calendar renders (respecting
 * weekStartsOn), while `weekNumber` follows ISO 8601 (determined by the
 * row's Thursday).
 *
 * @param month - Any date within the target month
 * @param weekStartsOn - First day of week (0=Sun, 1=Mon, ..., 6=Sat)
 * @returns Array of WeekInfo sorted by startDate
 */
export function getMonthWeeks(
  month: Date,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
): WeekInfo[] {
  const allDays = getCalendarDays(month, weekStartsOn);
  const seen = new Map<number, WeekInfo>();

  // Group days into rows of 7 (each row is one calendar week row)
  for (let i = 0; i < allDays.length; i += 7) {
    const row = allDays.slice(i, i + 7);
    if (row.length < 7) break;

    // ISO 8601 defines a week by its Thursday
    const thursday = row.find((d) => d.getDay() === 4) ?? row[0];
    const weekKey = startOfISOWeek(thursday).getTime();

    if (!seen.has(weekKey)) {
      seen.set(weekKey, {
        weekNumber: getISOWeekNumber(thursday),
        startDate: row[0],
        endDate: row[6],
        days: row,
      });
    }
  }

  return Array.from(seen.values()).sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );
}
