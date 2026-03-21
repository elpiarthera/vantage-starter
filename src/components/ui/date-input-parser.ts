import { parse, isValid } from 'date-fns';
import { parseNaturalLanguage } from './natural-language.js';

/**
 * Format groups for locale-aware date parsing.
 * ISO is always tried first (unambiguous).
 * US formats: MM/dd before dd/MM
 * EU formats: dd/MM before MM/dd
 */
const ISO_FORMATS = ['yyyy-MM-dd'];

const US_ORDERED_FORMATS = [
  // Slash US
  'MM/dd/yyyy',
  'M/d/yyyy',
  // Slash EU
  'dd/MM/yyyy',
  'd/M/yyyy',
  // Dash
  'MM-dd-yyyy',
  'dd-MM-yyyy',
  // Dot
  'MM.dd.yyyy',
  'dd.MM.yyyy',
];

const EU_ORDERED_FORMATS = [
  // Slash EU
  'dd/MM/yyyy',
  'd/M/yyyy',
  // Slash US
  'MM/dd/yyyy',
  'M/d/yyyy',
  // Dash
  'dd-MM-yyyy',
  'MM-dd-yyyy',
  // Dot
  'dd.MM.yyyy',
  'MM.dd.yyyy',
];

/** Locales that use MM/dd ordering */
const US_ORDER_LOCALES = ['en-US', 'en-CA'];

/**
 * Determines if a locale uses US-style MM/dd ordering.
 */
function isUSOrderLocale(locale?: string): boolean {
  if (!locale) return true; // default to US ordering
  return US_ORDER_LOCALES.some(
    (us) => locale === us || locale.startsWith(us + '-')
  );
}

/**
 * Parse a user-typed date string into a Date object.
 *
 * Tries multiple format strings sequentially, with locale determining
 * whether MM/dd or dd/MM formats are tried first for ambiguous inputs.
 *
 * @param input - The user-typed date string
 * @param locale - BCP 47 locale string (e.g. 'en-US', 'de-DE')
 * @returns A valid Date object, or null if parsing fails
 */
export function parseDateInput(input: string, locale?: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try natural language parsing first (e.g. "today", "tomorrow", "next week")
  const nlResult = parseNaturalLanguage(trimmed);
  if (nlResult) return nlResult;

  const referenceDate = new Date();
  const localeFormats = isUSOrderLocale(locale)
    ? US_ORDERED_FORMATS
    : EU_ORDERED_FORMATS;
  const formats = [...ISO_FORMATS, ...localeFormats];

  for (const fmt of formats) {
    const result = parse(trimmed, fmt, referenceDate);
    if (isValid(result)) {
      return result;
    }
  }

  return null;
}

/**
 * Format a Date for display using Intl.DateTimeFormat.
 *
 * Uses the native Intl API for zero bundle cost locale-aware formatting.
 * Returns long month format like "January 31, 2026" (en-US) or "31 janvier 2026" (fr-FR).
 *
 * @param date - The date to format
 * @param locale - BCP 47 locale string, defaults to 'en-US' (SSR-safe)
 * @param options - Optional Intl.DateTimeFormatOptions to customize display format
 * @returns Formatted date string
 */
export function formatDateForDisplay(
  date: Date,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const effectiveLocale = locale || 'en-US';
  const effectiveOptions = options ?? {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return new Intl.DateTimeFormat(effectiveLocale, effectiveOptions).format(date);
}

/**
 * Get locale-appropriate placeholder text for a date input.
 *
 * Helps users understand the expected input format.
 *
 * @param locale - BCP 47 locale string
 * @returns Placeholder string like "MM/DD/YYYY" or "DD/MM/YYYY"
 */
export function getPlaceholderText(locale?: string): string {
  return isUSOrderLocale(locale) ? 'MM/DD/YYYY' : 'DD/MM/YYYY';
}
