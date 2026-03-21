import { addDays, addWeeks, startOfDay, startOfWeek } from 'date-fns';

/**
 * A date preset for quick one-click date selection.
 *
 * @example
 * ```ts
 * const preset: DatePreset = {
 *   label: 'Today',
 *   resolve: () => startOfDay(new Date()),
 * };
 * ```
 */
export interface DatePreset {
  /** Display label for the preset button */
  label: string;
  /** Function that returns the resolved Date when called */
  resolve: () => Date;
}

/**
 * Default preset buttons: Today, Tomorrow, Next Week.
 * Resolver functions are called at evaluation time (not import time)
 * to compute dates relative to the current moment.
 */
export const DEFAULT_PRESETS: DatePreset[] = [
  { label: 'Today', resolve: () => startOfDay(new Date()) },
  { label: 'Tomorrow', resolve: () => addDays(startOfDay(new Date()), 1) },
  { label: 'Next Week', resolve: () => startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }) },
];
