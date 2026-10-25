import { parseIsoDate } from './dates';
import { parseMoney } from './money';
import type { EventInput, EventType, FormErrors } from './types';

export const EVENT_TYPES: readonly EventType[] = ['wedding', 'birthday', 'community'];

export const LIMITS = {
  minGuests: 1,
  maxGuests: 5000,
  minBudget: 5_000,
  maxBudget: 100_000_000,
  nameMax: 80,
  locationMax: 120,
  themeMax: 80,
  preferencesMax: 500,
} as const;

/** Raw, unparsed values as typed into the setup form. */
export interface EventFormValues {
  type: string;
  name: string;
  date: string;
  location: string;
  guests: string;
  budget: string;
  theme: string;
  preferences: string;
}

type ParseResult = { ok: true; input: EventInput } | { ok: false; errors: FormErrors };

/** Removes control characters, collapses whitespace and enforces a maximum length. */
export function sanitizeText(value: string, maxLength: number): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function parseWholeNumber(value: string): number | null {
  const trimmed = value.replace(/,/g, '').trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}

/** Validates and normalises the setup form. Pure, so it can be unit tested without the DOM. */
export function parseEventForm(values: EventFormValues, today: string): ParseResult {
  const errors: FormErrors = {};

  const type = EVENT_TYPES.find((candidate) => candidate === values.type);
  if (!type) errors.type = 'Choose wedding, birthday or community event.';

  const name = sanitizeText(values.name, LIMITS.nameMax);
  if (!name) errors.name = 'Give your event a name.';

  const date = values.date.trim();
  if (!parseIsoDate(date)) {
    errors.date = 'Enter a valid event date.';
  } else if (date < today) {
    errors.date = 'The event date cannot be in the past.';
  }

  const location = sanitizeText(values.location, LIMITS.locationMax);
  if (!location) errors.location = 'Enter a location.';

  const guests = parseWholeNumber(values.guests);
  if (guests === null || guests < LIMITS.minGuests || guests > LIMITS.maxGuests) {
    errors.guests = `Enter a whole number of guests between ${LIMITS.minGuests} and ${LIMITS.maxGuests}.`;
  }

  const budget = parseMoney(values.budget);
  if (budget === null || budget < LIMITS.minBudget || budget > LIMITS.maxBudget) {
    errors.budget = `Enter a budget between ₹${LIMITS.minBudget.toLocaleString('en-IN')} and ₹${LIMITS.maxBudget.toLocaleString('en-IN')}.`;
  }

  if (Object.keys(errors).length > 0 || !type || guests === null || budget === null) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    input: {
      type,
      name,
      date,
      location,
      guests,
      budget,
      theme: sanitizeText(values.theme, LIMITS.themeMax),
      preferences: sanitizeText(values.preferences, LIMITS.preferencesMax),
    },
  };
}
