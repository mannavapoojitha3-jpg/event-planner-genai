import { CATEGORY_IDS, CATEGORY_LABELS, COST_MODEL, MISC_RATE } from './costs';
import type { BudgetSummary, CategoryId, EventInput, EventType, Percents } from './types';

const round1 = (value: number): number => Math.round(value * 10) / 10;

export function defaultPercents(type: EventType): Percents {
  const rules = COST_MODEL[type];
  return Object.fromEntries(CATEGORY_IDS.map((id) => [id, rules[id].defaultPercent])) as Percents;
}

/** Estimated cost per category for a given event type and guest count. Rounded to whole rupees. */
export function estimateCosts(type: EventType, guests: number): Record<CategoryId, number> {
  const rules = COST_MODEL[type];
  const estimates = {} as Record<CategoryId, number>;
  let subtotal = 0;
  for (const id of CATEGORY_IDS) {
    if (id === 'misc') continue;
    const rule = rules[id];
    estimates[id] = Math.round(rule.fixed + rule.perGuest * guests);
    subtotal += estimates[id];
  }
  estimates.misc = Math.round(subtotal * MISC_RATE);
  return estimates;
}

/** Combines allocated budget (budget x percent) with estimated spend, and flags overspending. */
export function buildBudget(input: EventInput, percents: Percents): BudgetSummary {
  const estimates = estimateCosts(input.type, input.guests);
  const rows = CATEGORY_IDS.map((id) => {
    const allocated = Math.round((input.budget * percents[id]) / 100);
    const estimated = estimates[id];
    return {
      id,
      label: CATEGORY_LABELS[id],
      percent: percents[id],
      allocated,
      estimated,
      overAllocation: Math.max(0, estimated - allocated),
    };
  });
  const totalEstimated = rows.reduce((sum, row) => sum + row.estimated, 0);
  const remaining = input.budget - totalEstimated;
  return {
    rows,
    budget: input.budget,
    totalEstimated,
    remaining,
    overspent: remaining < 0,
  };
}

/**
 * Sets one category's share of the budget to `value` (0-100) and spreads the difference
 * across the other categories in proportion to their current shares. Result always sums to 100.
 */
export function rebalance(percents: Percents, changed: CategoryId, value: number): Percents {
  const target = round1(Math.min(100, Math.max(0, value)));
  const others = CATEGORY_IDS.filter((id) => id !== changed);
  const othersTotal = others.reduce((sum, id) => sum + percents[id], 0);
  const remaining = 100 - target;

  const next = { ...percents, [changed]: target } as Percents;
  for (const id of others) {
    next[id] = round1(
      othersTotal > 0 ? (percents[id] / othersTotal) * remaining : remaining / others.length,
    );
  }

  // Push any rounding residual onto the largest other category so the total is exactly 100.
  const residual = round1(100 - CATEGORY_IDS.reduce((sum, id) => sum + next[id], 0));
  if (residual !== 0) {
    const largest = others.reduce((a, b) => (next[a] >= next[b] ? a : b));
    next[largest] = round1(next[largest] + residual);
  }
  return next;
}
