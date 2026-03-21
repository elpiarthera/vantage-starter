import { addDays, addWeeks, startOfDay, startOfWeek } from 'date-fns';

/**
 * A resolver function that returns a Date when called.
 * Called at evaluation time (not import time) to avoid SSR date issues.
 */
type NLResolver = () => Date;

/**
 * Dictionary mapping normalized English phrases to date resolver functions.
 * Each resolver computes the date relative to "now" when invoked.
 */
const NL_PHRASES: Record<string, NLResolver> = {
  today: () => startOfDay(new Date()),
  tomorrow: () => addDays(startOfDay(new Date()), 1),
  yesterday: () => addDays(startOfDay(new Date()), -1),
  'next week': () => startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }),
};

/**
 * Normalize input for dictionary lookup.
 * Trims, lowercases, and collapses whitespace to single spaces.
 */
function normalizeInput(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Parse a natural language date phrase into a Date object.
 *
 * Supports common English phrases like "today", "tomorrow", "yesterday",
 * and "next week". Case-insensitive and whitespace-tolerant.
 *
 * @param input - The user-typed string
 * @returns A Date object if the phrase matches, or null if no match
 */
export function parseNaturalLanguage(input: string): Date | null {
  const normalized = normalizeInput(input);
  if (!normalized) return null;

  const resolver = NL_PHRASES[normalized];
  return resolver ? resolver() : null;
}
