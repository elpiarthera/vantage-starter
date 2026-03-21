import { describe, it, expect } from 'vitest';
import {
  parseTimeISO,
  timeToISO,
  to12Hour,
  to24Hour,
  isEndTimeAfterStart,
  clampHour,
  clampMinute,
  getDefaultHourCycle,
  formatTimeForDisplay,
} from './time-utils.js';

describe('parseTimeISO', () => {
  it('parses HH:mm:ss format', () => {
    expect(parseTimeISO('14:30:00')).toEqual({ hour: 14, minute: 30, second: 0 });
  });

  it('parses HH:mm format (no seconds defaults to 0)', () => {
    expect(parseTimeISO('09:05')).toEqual({ hour: 9, minute: 5, second: 0 });
  });

  it('parses midnight', () => {
    expect(parseTimeISO('0:00:00')).toEqual({ hour: 0, minute: 0, second: 0 });
  });

  it('parses max time', () => {
    expect(parseTimeISO('23:59:59')).toEqual({ hour: 23, minute: 59, second: 59 });
  });

  it('rejects hour 24', () => {
    expect(parseTimeISO('24:00:00')).toBeNull();
  });

  it('rejects invalid minutes', () => {
    expect(parseTimeISO('12:60:00')).toBeNull();
  });

  it('rejects non-time string', () => {
    expect(parseTimeISO('invalid')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(parseTimeISO('')).toBeNull();
  });
});

describe('timeToISO', () => {
  it('converts time to zero-padded HH:mm:ss', () => {
    expect(timeToISO({ hour: 14, minute: 30, second: 0 })).toBe('14:30:00');
  });

  it('converts midnight', () => {
    expect(timeToISO({ hour: 0, minute: 0, second: 0 })).toBe('00:00:00');
  });

  it('zero-pads single digits', () => {
    expect(timeToISO({ hour: 9, minute: 5, second: 7 })).toBe('09:05:07');
  });
});

describe('to12Hour', () => {
  it('converts 0 to 12 AM (midnight)', () => {
    expect(to12Hour(0)).toEqual({ hour: 12, period: 'AM' });
  });

  it('converts 1 to 1 AM', () => {
    expect(to12Hour(1)).toEqual({ hour: 1, period: 'AM' });
  });

  it('converts 11 to 11 AM', () => {
    expect(to12Hour(11)).toEqual({ hour: 11, period: 'AM' });
  });

  it('converts 12 to 12 PM (noon)', () => {
    expect(to12Hour(12)).toEqual({ hour: 12, period: 'PM' });
  });

  it('converts 13 to 1 PM', () => {
    expect(to12Hour(13)).toEqual({ hour: 1, period: 'PM' });
  });

  it('converts 23 to 11 PM', () => {
    expect(to12Hour(23)).toEqual({ hour: 11, period: 'PM' });
  });
});

describe('to24Hour', () => {
  it('converts 12 AM to 0 (midnight)', () => {
    expect(to24Hour(12, 'AM')).toBe(0);
  });

  it('converts 1 AM to 1', () => {
    expect(to24Hour(1, 'AM')).toBe(1);
  });

  it('converts 12 PM to 12 (noon)', () => {
    expect(to24Hour(12, 'PM')).toBe(12);
  });

  it('converts 1 PM to 13', () => {
    expect(to24Hour(1, 'PM')).toBe(13);
  });

  it('converts 11 PM to 23', () => {
    expect(to24Hour(11, 'PM')).toBe(23);
  });
});

describe('isEndTimeAfterStart', () => {
  it('returns true when end is after start', () => {
    expect(isEndTimeAfterStart('09:00:00', '17:00:00')).toBe(true);
  });

  it('returns false when end is before start', () => {
    expect(isEndTimeAfterStart('17:00:00', '09:00:00')).toBe(false);
  });

  it('returns false when times are equal', () => {
    expect(isEndTimeAfterStart('09:00:00', '09:00:00')).toBe(false);
  });

  it('returns true for overnight when allowOvernight is true', () => {
    expect(isEndTimeAfterStart('23:00:00', '01:00:00', true)).toBe(true);
  });

  it('returns true when start is empty (skip validation)', () => {
    expect(isEndTimeAfterStart('', '09:00:00')).toBe(true);
  });
});

describe('clampHour', () => {
  it('clamps below 0 in 24h mode', () => {
    expect(clampHour(-1, false)).toBe(0);
  });

  it('clamps above 23 in 24h mode', () => {
    expect(clampHour(24, false)).toBe(23);
  });

  it('clamps below 1 in 12h mode', () => {
    expect(clampHour(0, true)).toBe(1);
  });

  it('clamps above 12 in 12h mode', () => {
    expect(clampHour(13, true)).toBe(12);
  });
});

describe('clampMinute', () => {
  it('clamps below 0', () => {
    expect(clampMinute(-1)).toBe(0);
  });

  it('clamps above 59', () => {
    expect(clampMinute(60)).toBe(59);
  });
});

describe('getDefaultHourCycle', () => {
  it('returns h12 for en-US', () => {
    expect(getDefaultHourCycle('en-US')).toBe('h12');
  });

  it('returns h23 for de-DE', () => {
    expect(getDefaultHourCycle('de-DE')).toBe('h23');
  });
});

describe('formatTimeForDisplay', () => {
  it('formats in 12-hour mode for en-US', () => {
    const result = formatTimeForDisplay({ hour: 14, minute: 30, second: 0 }, 'en-US', true);
    expect(result).toContain('2:30');
    expect(result).toContain('PM');
  });

  it('formats in 24-hour mode', () => {
    const result = formatTimeForDisplay({ hour: 14, minute: 30, second: 0 }, 'en-US', false);
    expect(result).toContain('14:30');
  });
});
