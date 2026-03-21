import { describe, it, expect } from 'vitest';
import {
  isDateInRange,
  validateRangeDuration,
  formatISOInterval,
  isDateInPreview,
  normalizeRange,
  computeRangeDuration,
} from './range-utils.js';

describe('isDateInRange', () => {
  it('returns true for date inside range', () => {
    expect(isDateInRange('2026-01-15', '2026-01-10', '2026-01-20')).toBe(true);
  });

  it('returns true for date on start boundary', () => {
    expect(isDateInRange('2026-01-10', '2026-01-10', '2026-01-20')).toBe(true);
  });

  it('returns true for date on end boundary', () => {
    expect(isDateInRange('2026-01-20', '2026-01-10', '2026-01-20')).toBe(true);
  });

  it('returns false for date outside range (before)', () => {
    expect(isDateInRange('2026-01-05', '2026-01-10', '2026-01-20')).toBe(false);
  });

  it('returns false for date outside range (after)', () => {
    expect(isDateInRange('2026-01-25', '2026-01-10', '2026-01-20')).toBe(false);
  });

  it('returns false when start is missing', () => {
    expect(isDateInRange('2026-01-15', '', '2026-01-20')).toBe(false);
  });

  it('returns false when end is missing', () => {
    expect(isDateInRange('2026-01-15', '2026-01-10', '')).toBe(false);
  });

  it('returns false when date is missing', () => {
    expect(isDateInRange('', '2026-01-10', '2026-01-20')).toBe(false);
  });
});

describe('validateRangeDuration', () => {
  it('returns valid for a normal range', () => {
    const result = validateRangeDuration('2026-01-10', '2026-01-15');
    expect(result.valid).toBe(true);
    expect(result.error).toBe('');
  });

  it('returns valid for a single-day range', () => {
    const result = validateRangeDuration('2026-01-10', '2026-01-10');
    expect(result.valid).toBe(true);
  });

  it('returns invalid when below minDays', () => {
    const result = validateRangeDuration('2026-01-10', '2026-01-11', 5);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 5 days');
  });

  it('returns valid when exactly at minDays boundary', () => {
    // 3 days inclusive: Jan 10, 11, 12
    const result = validateRangeDuration('2026-01-10', '2026-01-12', 3);
    expect(result.valid).toBe(true);
  });

  it('returns invalid when above maxDays', () => {
    const result = validateRangeDuration('2026-01-01', '2026-01-31', undefined, 10);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at most 10 days');
  });

  it('returns valid when exactly at maxDays boundary', () => {
    // 5 days inclusive: Jan 10-14
    const result = validateRangeDuration('2026-01-10', '2026-01-14', undefined, 5);
    expect(result.valid).toBe(true);
  });

  it('returns invalid when start or end is missing', () => {
    const result = validateRangeDuration('', '2026-01-15');
    expect(result.valid).toBe(false);
  });

  it('handles minDays=0 as no minimum', () => {
    const result = validateRangeDuration('2026-01-10', '2026-01-10', 0);
    expect(result.valid).toBe(true);
  });

  it('handles maxDays=0 as no maximum', () => {
    const result = validateRangeDuration('2026-01-01', '2026-12-31', undefined, 0);
    expect(result.valid).toBe(true);
  });
});

describe('formatISOInterval', () => {
  it('formats a complete range as ISO interval', () => {
    expect(formatISOInterval('2026-01-10', '2026-01-20')).toBe('2026-01-10/2026-01-20');
  });

  it('returns empty string when start is missing', () => {
    expect(formatISOInterval('', '2026-01-20')).toBe('');
  });

  it('returns empty string when end is missing', () => {
    expect(formatISOInterval('2026-01-10', '')).toBe('');
  });

  it('returns empty string when both are missing', () => {
    expect(formatISOInterval('', '')).toBe('');
  });
});

describe('isDateInPreview', () => {
  it('returns true for date between start and hovered (hovered after start)', () => {
    expect(isDateInPreview('2026-01-15', '2026-01-10', '2026-01-20')).toBe(true);
  });

  it('returns true for date between start and hovered (hovered before start)', () => {
    expect(isDateInPreview('2026-01-08', '2026-01-10', '2026-01-05')).toBe(true);
  });

  it('returns true for date on start boundary', () => {
    expect(isDateInPreview('2026-01-10', '2026-01-10', '2026-01-20')).toBe(true);
  });

  it('returns true for date on hovered boundary', () => {
    expect(isDateInPreview('2026-01-20', '2026-01-10', '2026-01-20')).toBe(true);
  });

  it('returns false for date outside preview range', () => {
    expect(isDateInPreview('2026-01-25', '2026-01-10', '2026-01-20')).toBe(false);
  });

  it('returns false when hovered is empty', () => {
    expect(isDateInPreview('2026-01-15', '2026-01-10', '')).toBe(false);
  });

  it('returns false when start is empty', () => {
    expect(isDateInPreview('2026-01-15', '', '2026-01-20')).toBe(false);
  });
});

describe('normalizeRange', () => {
  it('returns dates in order when already correct', () => {
    expect(normalizeRange('2026-01-10', '2026-01-20')).toEqual(['2026-01-10', '2026-01-20']);
  });

  it('swaps dates when end is before start', () => {
    expect(normalizeRange('2026-01-20', '2026-01-10')).toEqual(['2026-01-10', '2026-01-20']);
  });

  it('returns same dates when they are equal', () => {
    expect(normalizeRange('2026-01-15', '2026-01-15')).toEqual(['2026-01-15', '2026-01-15']);
  });

  it('handles empty start gracefully', () => {
    expect(normalizeRange('', '2026-01-20')).toEqual(['', '2026-01-20']);
  });

  it('handles empty end gracefully', () => {
    expect(normalizeRange('2026-01-10', '')).toEqual(['2026-01-10', '']);
  });
});

describe('computeRangeDuration', () => {
  it('returns 1 for a single-day range', () => {
    expect(computeRangeDuration('2026-01-10', '2026-01-10')).toBe(1);
  });

  it('returns 7 for a 7-day inclusive range', () => {
    expect(computeRangeDuration('2026-01-10', '2026-01-16')).toBe(7);
  });

  it('returns 31 for a full month', () => {
    expect(computeRangeDuration('2026-01-01', '2026-01-31')).toBe(31);
  });

  it('returns 0 when start is missing', () => {
    expect(computeRangeDuration('', '2026-01-10')).toBe(0);
  });

  it('returns 0 when end is missing', () => {
    expect(computeRangeDuration('2026-01-10', '')).toBe(0);
  });

  it('returns 0 when both are missing', () => {
    expect(computeRangeDuration('', '')).toBe(0);
  });
});
