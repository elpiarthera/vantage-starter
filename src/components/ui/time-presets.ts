import type { TimeValue } from './time-utils.js';

/**
 * A time preset for quick one-click time selection.
 *
 * @example
 * ```ts
 * const preset: TimePreset = {
 *   label: 'Morning',
 *   resolve: () => ({ hour: 9, minute: 0, second: 0 }),
 * };
 * ```
 */
export interface TimePreset {
  /** Display label for the preset button */
  label: string;
  /** Function that returns the resolved TimeValue when called */
  resolve: () => TimeValue;
}

/**
 * Default preset buttons: Morning, Afternoon, Evening.
 * Resolver functions are called at evaluation time (not import time)
 * to ensure SSR safety.
 */
export const DEFAULT_TIME_PRESETS: TimePreset[] = [
  { label: 'Morning', resolve: () => ({ hour: 9, minute: 0, second: 0 }) },
  { label: 'Afternoon', resolve: () => ({ hour: 14, minute: 0, second: 0 }) },
  { label: 'Evening', resolve: () => ({ hour: 18, minute: 0, second: 0 }) },
];

/**
 * Resolve the current time as a TimeValue.
 * Called at evaluation time (not import time) for SSR safety.
 */
export function resolveNow(): TimeValue {
  const now = new Date();
  return { hour: now.getHours(), minute: now.getMinutes(), second: 0 };
}
