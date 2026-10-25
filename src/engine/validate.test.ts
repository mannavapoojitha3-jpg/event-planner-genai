import { describe, expect, it } from 'vitest';
import { parseEventForm, sanitizeText, type EventFormValues } from './validate';
import { parseMoney, formatINR } from './money';
import { addDays, parseIsoDate } from './dates';

const valid: EventFormValues = {
  type: 'wedding',
  name: 'Asha & Ravi',
  date: '2027-03-12',
  location: 'Bengaluru',
  guests: '150',
  budget: '5,00,000',
  theme: 'Monsoon garden',
  preferences: 'Vegetarian menu',
};

describe('parseEventForm', () => {
  it('accepts a complete, valid form', () => {
    const result = parseEventForm(valid, '2026-10-25');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.guests).toBe(150);
      expect(result.input.budget).toBe(500_000);
    }
  });

  it('rejects an unknown event type', () => {
    const result = parseEventForm({ ...valid, type: 'funeral' }, '2026-10-25');
    expect(result.ok).toBe(false);
  });

  it('rejects dates in the past and invalid calendar dates', () => {
    expect(parseEventForm({ ...valid, date: '2020-01-01' }, '2026-10-25').ok).toBe(false);
    expect(parseEventForm({ ...valid, date: '2027-02-30' }, '2026-10-25').ok).toBe(false);
  });

  it('accepts today as the event date', () => {
    expect(parseEventForm({ ...valid, date: '2026-10-25' }, '2026-10-25').ok).toBe(true);
  });

  it.each(['0', '-3', '1.5', 'abc', '5001'])('rejects guest count %s', (guests) => {
    expect(parseEventForm({ ...valid, guests }, '2026-10-25').ok).toBe(false);
  });

  it('accepts the guest-count boundaries', () => {
    expect(parseEventForm({ ...valid, guests: '1' }, '2026-10-25').ok).toBe(true);
    expect(parseEventForm({ ...valid, guests: '5000' }, '2026-10-25').ok).toBe(true);
  });

  it('rejects budgets below the minimum and accepts the minimum', () => {
    expect(parseEventForm({ ...valid, budget: '4999' }, '2026-10-25').ok).toBe(false);
    expect(parseEventForm({ ...valid, budget: '5000' }, '2026-10-25').ok).toBe(true);
  });

  it('reports every missing required field', () => {
    const result = parseEventForm({ ...valid, name: '', location: '  ' }, '2026-10-25');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.location).toBeDefined();
    }
  });
});

describe('sanitizeText', () => {
  it('strips control characters and collapses whitespace', () => {
    expect(sanitizeText('  Hello\u0000   world\n ', 80)).toBe('Hello world');
  });

  it('enforces the maximum length', () => {
    expect(sanitizeText('a'.repeat(200), 10)).toHaveLength(10);
  });
});

describe('parseMoney', () => {
  it.each([
    ['500000', 500_000],
    ['5,00,000', 500_000],
    ['₹5 lakh', 500_000],
    ['5L', 500_000],
    ['2.5 crore', 25_000_000],
    ['50k', 50_000],
  ])('parses %s', (input, expected) => {
    expect(parseMoney(input)).toBe(expected);
  });

  it('returns null for unrecognised text', () => {
    expect(parseMoney('lots')).toBeNull();
    expect(parseMoney('5 gazillion')).toBeNull();
  });

  it('formats with Indian grouping', () => {
    expect(formatINR(500_000)).toBe('₹5,00,000');
  });
});

describe('dates', () => {
  it('rejects malformed ISO strings', () => {
    expect(parseIsoDate('2027/03/12')).toBeNull();
    expect(parseIsoDate('2027-13-01')).toBeNull();
  });

  it('subtracts days across month boundaries', () => {
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
  });
});
