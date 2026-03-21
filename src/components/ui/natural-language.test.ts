import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseNaturalLanguage } from './natural-language.js';

describe('parseNaturalLanguage', () => {
  beforeEach(() => {
    // Fix date to 2026-01-31 (Saturday) for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 31, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('today', () => {
    it('returns start of today', () => {
      const result = parseNaturalLanguage('today');
      expect(result).toEqual(new Date(2026, 0, 31, 0, 0, 0, 0));
    });

    it('is case-insensitive', () => {
      expect(parseNaturalLanguage('Today')).toEqual(new Date(2026, 0, 31, 0, 0, 0, 0));
      expect(parseNaturalLanguage('TODAY')).toEqual(new Date(2026, 0, 31, 0, 0, 0, 0));
    });
  });

  describe('tomorrow', () => {
    it('returns start of tomorrow', () => {
      const result = parseNaturalLanguage('tomorrow');
      expect(result).toEqual(new Date(2026, 1, 1, 0, 0, 0, 0));
    });

    it('is case-insensitive', () => {
      expect(parseNaturalLanguage('Tomorrow')).toEqual(new Date(2026, 1, 1, 0, 0, 0, 0));
      expect(parseNaturalLanguage('TOMORROW')).toEqual(new Date(2026, 1, 1, 0, 0, 0, 0));
    });
  });

  describe('yesterday', () => {
    it('returns start of yesterday', () => {
      const result = parseNaturalLanguage('yesterday');
      expect(result).toEqual(new Date(2026, 0, 30, 0, 0, 0, 0));
    });

    it('is case-insensitive', () => {
      expect(parseNaturalLanguage('YESTERDAY')).toEqual(new Date(2026, 0, 30, 0, 0, 0, 0));
    });
  });

  describe('next week', () => {
    it('returns start of next week (Monday)', () => {
      // 2026-01-31 is Saturday, next Monday is 2026-02-02
      const result = parseNaturalLanguage('next week');
      expect(result).toEqual(new Date(2026, 1, 2, 0, 0, 0, 0));
    });

    it('is case-insensitive', () => {
      expect(parseNaturalLanguage('Next Week')).toEqual(new Date(2026, 1, 2, 0, 0, 0, 0));
      expect(parseNaturalLanguage('NEXT WEEK')).toEqual(new Date(2026, 1, 2, 0, 0, 0, 0));
    });

    it('normalizes extra whitespace', () => {
      expect(parseNaturalLanguage('  Next  Week  ')).toEqual(new Date(2026, 1, 2, 0, 0, 0, 0));
      expect(parseNaturalLanguage('\tnext\t\tweek\t')).toEqual(new Date(2026, 1, 2, 0, 0, 0, 0));
    });
  });

  describe('non-matching input', () => {
    it('returns null for random text', () => {
      expect(parseNaturalLanguage('random text')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseNaturalLanguage('')).toBeNull();
    });

    it('returns null for date strings', () => {
      expect(parseNaturalLanguage('01/31/2026')).toBeNull();
      expect(parseNaturalLanguage('2026-01-31')).toBeNull();
    });

    it('returns null for partial matches', () => {
      expect(parseNaturalLanguage('tomorrowish')).toBeNull();
      expect(parseNaturalLanguage('not today')).toBeNull();
    });
  });
});
