import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseDateInput, formatDateForDisplay, getPlaceholderText } from './date-input-parser.js';

describe('parseDateInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 31, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('natural language integration', () => {
    it('parses "tomorrow" to tomorrow\'s date', () => {
      const result = parseDateInput('tomorrow', 'en-US');
      expect(result).toEqual(new Date(2026, 1, 1, 0, 0, 0, 0));
    });

    it('parses "today" to today\'s date', () => {
      const result = parseDateInput('today', 'en-US');
      expect(result).toEqual(new Date(2026, 0, 31, 0, 0, 0, 0));
    });

    it('parses "yesterday" to yesterday\'s date', () => {
      const result = parseDateInput('yesterday', 'en-US');
      expect(result).toEqual(new Date(2026, 0, 30, 0, 0, 0, 0));
    });

    it('parses "next week" to start of next week', () => {
      const result = parseDateInput('next week', 'en-US');
      expect(result).toEqual(new Date(2026, 1, 2, 0, 0, 0, 0));
    });
  });

  describe('format-based parsing (regression)', () => {
    it('parses US format MM/dd/yyyy', () => {
      const result = parseDateInput('01/31/2026', 'en-US');
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2026);
      expect(result!.getMonth()).toBe(0);
      expect(result!.getDate()).toBe(31);
    });

    it('parses ISO format yyyy-MM-dd', () => {
      const result = parseDateInput('2026-01-31', 'en-US');
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2026);
      expect(result!.getMonth()).toBe(0);
      expect(result!.getDate()).toBe(31);
    });

    it('parses EU format dd/MM/yyyy', () => {
      const result = parseDateInput('31/01/2026', 'de-DE');
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2026);
      expect(result!.getMonth()).toBe(0);
      expect(result!.getDate()).toBe(31);
    });

    it('returns null for empty input', () => {
      expect(parseDateInput('', 'en-US')).toBeNull();
    });

    it('returns null for invalid input', () => {
      expect(parseDateInput('not-a-date', 'en-US')).toBeNull();
    });
  });
});

describe('formatDateForDisplay', () => {
  it('formats date in en-US locale', () => {
    const date = new Date(2026, 0, 31);
    const result = formatDateForDisplay(date, 'en-US');
    expect(result).toBe('January 31, 2026');
  });
});

describe('getPlaceholderText', () => {
  it('returns MM/DD/YYYY for US locale', () => {
    expect(getPlaceholderText('en-US')).toBe('MM/DD/YYYY');
  });

  it('returns DD/MM/YYYY for EU locale', () => {
    expect(getPlaceholderText('de-DE')).toBe('DD/MM/YYYY');
  });
});
