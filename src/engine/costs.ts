import type { CategoryId, EventType } from './types';

/**
 * Rough planning estimates in INR. These are illustrative defaults for budgeting,
 * NOT verified market prices. The UI labels every figure derived from this table as an estimate.
 */
interface CostRule {
  fixed: number;
  perGuest: number;
  defaultPercent: number;
}

export const CATEGORY_IDS: readonly CategoryId[] = [
  'venue',
  'catering',
  'decor',
  'entertainment',
  'photography',
  'misc',
];

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  venue: 'Venue',
  catering: 'Catering & food',
  decor: 'Decor & flowers',
  entertainment: 'Music & entertainment',
  photography: 'Photography & video',
  misc: 'Invitations, transport & buffer',
};

/** Miscellaneous spend (invitations, transport, contingency) is estimated as a share of the other categories. */
export const MISC_RATE = 0.08;

const MISC_ZERO: CostRule = { fixed: 0, perGuest: 0, defaultPercent: 0 };

export const COST_MODEL: Record<EventType, Record<CategoryId, CostRule>> = {
  wedding: {
    venue: { fixed: 150_000, perGuest: 0, defaultPercent: 25 },
    catering: { fixed: 0, perGuest: 1_200, defaultPercent: 30 },
    decor: { fixed: 80_000, perGuest: 150, defaultPercent: 12 },
    entertainment: { fixed: 60_000, perGuest: 0, defaultPercent: 8 },
    photography: { fixed: 80_000, perGuest: 0, defaultPercent: 10 },
    misc: { ...MISC_ZERO, defaultPercent: 15 },
  },
  birthday: {
    venue: { fixed: 15_000, perGuest: 0, defaultPercent: 15 },
    catering: { fixed: 0, perGuest: 500, defaultPercent: 35 },
    decor: { fixed: 8_000, perGuest: 50, defaultPercent: 12 },
    entertainment: { fixed: 10_000, perGuest: 0, defaultPercent: 15 },
    photography: { fixed: 5_000, perGuest: 0, defaultPercent: 8 },
    misc: { ...MISC_ZERO, defaultPercent: 15 },
  },
  community: {
    venue: { fixed: 10_000, perGuest: 0, defaultPercent: 15 },
    catering: { fixed: 0, perGuest: 300, defaultPercent: 35 },
    decor: { fixed: 5_000, perGuest: 20, defaultPercent: 10 },
    entertainment: { fixed: 12_000, perGuest: 0, defaultPercent: 15 },
    photography: { fixed: 3_000, perGuest: 0, defaultPercent: 5 },
    misc: { ...MISC_ZERO, defaultPercent: 20 },
  },
};

/** Per-guest budget below which the planner warns that the plan is tight. */
export const TIGHT_BUDGET_PER_GUEST: Record<EventType, number> = {
  wedding: 3_000,
  birthday: 800,
  community: 500,
};
