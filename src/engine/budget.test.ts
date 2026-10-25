import { describe, expect, it } from 'vitest';
import { buildBudget, defaultPercents, estimateCosts, rebalance } from './budget';
import { CATEGORY_IDS, COST_MODEL } from './costs';
import type { EventInput } from './types';

const wedding: EventInput = {
  type: 'wedding',
  name: 'Test wedding',
  date: '2027-03-12',
  location: 'Bengaluru',
  guests: 150,
  budget: 500_000,
  theme: '',
  preferences: '',
};

describe('defaultPercents', () => {
  it.each(['wedding', 'birthday', 'community'] as const)('sums to 100 for %s', (type) => {
    const total = CATEGORY_IDS.reduce((sum, id) => sum + defaultPercents(type)[id], 0);
    expect(total).toBe(100);
  });
});

describe('estimateCosts', () => {
  it('scales catering with guest count', () => {
    const estimates = estimateCosts('wedding', 150);
    expect(estimates.catering).toBe(COST_MODEL.wedding.catering.perGuest * 150);
  });

  it('keeps fixed costs independent of guest count', () => {
    expect(estimateCosts('wedding', 10).venue).toBe(estimateCosts('wedding', 500).venue);
  });

  it('estimates miscellaneous spend as a share of the other categories', () => {
    const estimates = estimateCosts('birthday', 20);
    const others = CATEGORY_IDS.filter((id) => id !== 'misc').reduce((sum, id) => sum + estimates[id], 0);
    expect(estimates.misc).toBe(Math.round(others * 0.08));
  });
});

describe('buildBudget', () => {
  it('computes allocations from the budget and percentages', () => {
    const summary = buildBudget(wedding, defaultPercents('wedding'));
    const venue = summary.rows.find((row) => row.id === 'venue');
    expect(venue?.allocated).toBe(125_000);
  });

  it('keeps totals internally consistent', () => {
    const summary = buildBudget(wedding, defaultPercents('wedding'));
    const sumEstimated = summary.rows.reduce((sum, row) => sum + row.estimated, 0);
    expect(summary.totalEstimated).toBe(sumEstimated);
    expect(summary.remaining).toBe(wedding.budget - sumEstimated);
    expect(summary.overspent).toBe(summary.remaining < 0);
  });

  it('flags overspending when estimates exceed the budget', () => {
    const tight = { ...wedding, budget: 100_000 };
    const summary = buildBudget(tight, defaultPercents('wedding'));
    expect(summary.overspent).toBe(true);
    expect(summary.rows.some((row) => row.overAllocation > 0)).toBe(true);
  });

  it('reports no overspend when the budget covers estimates', () => {
    const generous = { ...wedding, type: 'community' as const, guests: 20, budget: 1_000_000 };
    expect(buildBudget(generous, defaultPercents('community')).overspent).toBe(false);
  });

  it('handles a zero-guest boundary without dividing by zero', () => {
    const summary = buildBudget({ ...wedding, guests: 0 }, defaultPercents('wedding'));
    expect(Number.isFinite(summary.totalEstimated)).toBe(true);
  });
});

describe('rebalance', () => {
  it('always sums to 100 after a change', () => {
    const next = rebalance(defaultPercents('wedding'), 'catering', 45);
    const total = CATEGORY_IDS.reduce((sum, id) => sum + next[id], 0);
    expect(total).toBeCloseTo(100, 5);
    expect(next.catering).toBe(45);
  });

  it('spreads the difference across other categories proportionally', () => {
    const before = defaultPercents('wedding');
    const next = rebalance(before, 'catering', 15);
    // Catering loses 15 points; venue held 25 of the remaining 70 points, so it should gain ~5.36 points.
    expect(next.venue).toBeGreaterThan(before.venue);
  });

  it('clamps values to the 0-100 range', () => {
    expect(rebalance(defaultPercents('wedding'), 'venue', 150).venue).toBe(100);
    expect(rebalance(defaultPercents('wedding'), 'venue', -5).venue).toBe(0);
  });

  it('handles a category moved to 100 without producing NaN', () => {
    const next = rebalance(defaultPercents('wedding'), 'venue', 100);
    expect(CATEGORY_IDS.every((id) => Number.isFinite(next[id]))).toBe(true);
  });
});
