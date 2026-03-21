/**
 * Intl API helpers for locale-aware calendar rendering.
 *
 * Uses native browser Intl API for weekday names, month names,
 * and first day of week detection. No locale data bundles needed.
 */

/**
 * Detect the first day of the week for a given locale.
 *
 * Uses Intl.Locale.getWeekInfo() (modern browsers), falls back to
 * the weekInfo property (older spec), then to a locale-based map.
 *
 * @param locale - BCP 47 locale tag (e.g., 'en-US', 'de-DE')
 * @returns First day of week in Intl format (1=Monday ... 7=Sunday)
 */
export function getFirstDayOfWeek(locale: string): number {
  try {
    const loc = new Intl.Locale(locale);
    // Try method first (modern spec), then property (older spec)
    const weekInfo =
      (loc as any).getWeekInfo?.() ?? (loc as any).weekInfo;
    if (weekInfo?.firstDay != null) {
      return weekInfo.firstDay as number;
    }
  } catch {
    // Fallback below
  }

  // Fallback: Sunday (7) for known Sunday-start locales, Monday (1) for others
  const sundayLocales = ['en-US', 'he-IL', 'ja-JP', 'ko-KR', 'zh-TW'];
  const lang = locale || 'en-US';
  for (const sundayLocale of sundayLocales) {
    const [langPart, regionPart] = sundayLocale.split('-');
    if (lang.startsWith(langPart) && lang.includes(regionPart)) {
      return 7;
    }
  }

  return 1;
}

/**
 * Get localized weekday abbreviations starting from the given first day.
 *
 * Uses Intl.DateTimeFormat to generate locale-aware short weekday names,
 * then rotates the array so the specified first day of the week is at index 0.
 *
 * @param locale - BCP 47 locale tag
 * @param firstDayOfWeek - First day of week in Intl format (1=Monday ... 7=Sunday)
 * @returns Array of 7 localized weekday abbreviations
 */
export function getWeekdayNames(
  locale: string,
  firstDayOfWeek: number
): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  // Jan 4, 2026 is a Sunday (day index 0)
  const refSunday = new Date(2026, 0, 4);
  const days: string[] = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(refSunday);
    day.setDate(refSunday.getDate() + i);
    days.push(formatter.format(day));
  }

  // Rotate: Intl firstDay 7=Sunday maps to array index 0,
  // firstDay 1=Monday maps to index 1, etc.
  const startIndex = firstDayOfWeek === 7 ? 0 : firstDayOfWeek;
  return [...days.slice(startIndex), ...days.slice(0, startIndex)];
}

/**
 * Get localized long weekday names starting from the given first day.
 *
 * Uses Intl.DateTimeFormat to generate locale-aware long weekday names,
 * then rotates the array so the specified first day of the week is at index 0.
 * Useful for aria-labels on weekday column headers.
 *
 * @param locale - BCP 47 locale tag
 * @param firstDayOfWeek - First day of week in Intl format (1=Monday ... 7=Sunday)
 * @returns Array of 7 localized long weekday names
 */
export function getWeekdayLongNames(
  locale: string,
  firstDayOfWeek: number
): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  // Jan 4, 2026 is a Sunday (day index 0)
  const refSunday = new Date(2026, 0, 4);
  const days: string[] = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(refSunday);
    day.setDate(refSunday.getDate() + i);
    days.push(formatter.format(day));
  }

  // Rotate: Intl firstDay 7=Sunday maps to array index 0,
  // firstDay 1=Monday maps to index 1, etc.
  const startIndex = firstDayOfWeek === 7 ? 0 : firstDayOfWeek;
  return [...days.slice(startIndex), ...days.slice(0, startIndex)];
}

/**
 * Get localized month names for all 12 months.
 *
 * Uses Intl.DateTimeFormat to generate locale-aware long month names.
 * Useful for month dropdown selectors.
 *
 * @param locale - BCP 47 locale tag
 * @returns Array of 12 localized month names (January through December)
 */
export function getMonthNames(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'long' });
  const months: string[] = [];

  for (let i = 0; i < 12; i++) {
    // Use the 15th of each month to avoid timezone edge cases
    months.push(formatter.format(new Date(2026, i, 15)));
  }

  return months;
}
