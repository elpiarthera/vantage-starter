import { subDays, startOfDay, startOfMonth, endOfMonth } from 'date-fns';

/**
 * A date range preset for quick one-click range selection.
 *
 * @example
 * ```ts
 * const preset: DateRangePreset = {
 *   label: 'Last 7 Days',
 *   resolve: () => ({
 *     start: subDays(startOfDay(new Date()), 6),
 *     end: startOfDay(new Date()),
 *   }),
 * };
 * ```
 */
export interface DateRangePreset {
  /** Display label for the preset button */
  label: string;
  /** Function that returns the resolved date range when called */
  resolve: () => { start: Date; end: Date };
}

/**
 * Default range preset buttons: Last 7 Days, Last 30 Days, This Month.
 * Resolver functions are called at evaluation time (not import time)
 * to compute dates relative to the current moment.
 */
export const DEFAULT_RANGE_PRESETS: DateRangePreset[] = [
  {
    label: 'Last 7 Days',
    resolve: () => ({
      start: subDays(startOfDay(new Date()), 6),
      end: startOfDay(new Date()),
    }),
  },
  {
    label: 'Last 30 Days',
    resolve: () => ({
      start: subDays(startOfDay(new Date()), 29),
      end: startOfDay(new Date()),
    }),
  },
  {
    label: 'This Month',
    resolve: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    }),
  },
];
