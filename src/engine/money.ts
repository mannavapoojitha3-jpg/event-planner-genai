const UNIT_MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  thousand: 1_000,
  lakh: 100_000,
  lakhs: 100_000,
  lac: 100_000,
  lacs: 100_000,
  crore: 10_000_000,
  crores: 10_000_000,
  cr: 10_000_000,
};

/**
 * Parses an amount typed by a user: "500000", "5,00,000", "₹5 lakh", "5L", "2.5 crore", "50k".
 * Returns null when the text is not a recognisable non-negative amount.
 */
export function parseMoney(input: string): number | null {
  const text = input
    .toLowerCase()
    .replace(/₹|\brs\.?|\binr\b/g, '')
    .replace(/,/g, '')
    .trim();
  const match = /^(\d+(?:\.\d+)?)\s*([a-z]*)$/.exec(text);
  if (!match) return null;
  const base = Number(match[1]);
  const unit = match[2];
  if (!unit) return Math.round(base);
  const multiplier = UNIT_MULTIPLIERS[unit] ?? (unit === 'l' ? UNIT_MULTIPLIERS.lakh : undefined);
  if (multiplier === undefined) return null;
  return Math.round(base * multiplier);
}

/** Formats rupees with Indian digit grouping, e.g. ₹5,00,000. */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
