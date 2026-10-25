const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses a strict yyyy-mm-dd string into a UTC Date, or returns null if it is not a real calendar date. */
export function parseIsoDate(value: string): Date | null {
  const match = ISO_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return valid ? date : null;
}

/** Adds (or subtracts, when negative) whole days to an ISO date. UTC arithmetic avoids DST drift. */
export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  if (!date) throw new Error(`Invalid ISO date: ${iso}`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Today's date in the user's local calendar, as yyyy-mm-dd. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Formats an ISO date for display, e.g. "12 Mar 2027". Falls back to the raw value. */
export function formatDate(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
