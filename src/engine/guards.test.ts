import { describe, expect, it } from 'vitest';
import { isEventPlan, STORED_LIMITS } from './guards';
import { parseStoredPlan } from './storage';
import { createPlan, toggleTask } from './planner';
import { respond } from './assistant';
import type { EventPlan } from './types';

const basePlan = (): EventPlan =>
  createPlan({
    type: 'birthday',
    name: 'Maya turns 8',
    date: '2027-01-20',
    location: 'Bengaluru',
    guests: 25,
    budget: 40_000,
    theme: 'Dinosaurs',
    preferences: 'Kids activities',
  });

const clone = (plan: EventPlan): Record<string, unknown> => JSON.parse(JSON.stringify(plan));

describe('isEventPlan', () => {
  it('accepts a plan produced by the planner', () => {
    expect(isEventPlan(basePlan())).toBe(true);
  });

  it('accepts a plan after a round trip through JSON', () => {
    expect(isEventPlan(JSON.parse(JSON.stringify(toggleTask(basePlan(), 'birthday:venue'))))).toBe(true);
  });

  it.each([null, undefined, 'plan', 42, [], {}])('rejects non-plan value %j', (value) => {
    expect(isEventPlan(value)).toBe(false);
  });

  it('rejects an unknown event type', () => {
    const data = clone(basePlan());
    (data.input as Record<string, unknown>).type = 'funeral';
    expect(isEventPlan(data)).toBe(false);
  });

  it('rejects guest counts outside the allowed range', () => {
    const data = clone(basePlan());
    (data.input as Record<string, unknown>).guests = 0;
    expect(isEventPlan(data)).toBe(false);
  });

  it('rejects a non-integer guest count', () => {
    const data = clone(basePlan());
    (data.input as Record<string, unknown>).guests = 2.5;
    expect(isEventPlan(data)).toBe(false);
  });

  it('rejects an invalid calendar date in a task', () => {
    const data = clone(basePlan());
    (data.tasks as Record<string, unknown>[])[0].dueDate = '2027-02-31';
    expect(isEventPlan(data)).toBe(false);
  });

  it('rejects percentage shares that do not total 100', () => {
    const data = clone(basePlan());
    (data.percents as Record<string, number>).venue = 90;
    expect(isEventPlan(data)).toBe(false);
  });

  it('rejects percentage shares that are negative or not finite', () => {
    const negative = clone(basePlan());
    (negative.percents as Record<string, number>).catering = -10;
    expect(isEventPlan(negative)).toBe(false);
    const infinite = clone(basePlan());
    (infinite.percents as Record<string, unknown>).catering = null;
    expect(isEventPlan(infinite)).toBe(false);
  });

  it('rejects an unknown vendor status', () => {
    const data = clone(basePlan());
    (data.vendors as Record<string, unknown>[])[0].status = 'paid-in-full';
    expect(isEventPlan(data)).toBe(false);
  });

  it('rejects a message with an unknown role', () => {
    const data = clone(basePlan());
    data.messages = [{ id: 'm1', role: 'system', text: 'hi' }];
    expect(isEventPlan(data)).toBe(false);
  });

  it('rejects an oversized list, which stops storage growing without limit', () => {
    const data = clone(basePlan());
    const message = { id: 'm', role: 'user', text: 'hi' };
    data.messages = Array.from({ length: STORED_LIMITS.messages + 1 }, () => message);
    expect(isEventPlan(data)).toBe(false);
  });

  it('rejects text that exceeds the stored length limit', () => {
    const data = clone(basePlan());
    data.messages = [{ id: 'm', role: 'user', text: 'x'.repeat(STORED_LIMITS.textMax + 1) }];
    expect(isEventPlan(data)).toBe(false);
  });
});

describe('parseStoredPlan', () => {
  it('returns null for missing storage', () => {
    expect(parseStoredPlan(null)).toBeNull();
    expect(parseStoredPlan('')).toBeNull();
  });

  it('returns null for corrupt JSON instead of throwing', () => {
    expect(parseStoredPlan('{not json')).toBeNull();
  });

  it('returns the plan when the stored data is valid', () => {
    const plan = basePlan();
    expect(parseStoredPlan(JSON.stringify(plan))).toEqual(plan);
  });

  it('ignores a structurally valid but tampered plan', () => {
    const data = clone(basePlan());
    (data.input as Record<string, unknown>).budget = 1;
    expect(parseStoredPlan(JSON.stringify(data))).toBeNull();
  });
});

describe('assistant edge cases', () => {
  const today = '2026-10-25';

  it('ignores a budget below the minimum instead of applying it', () => {
    const plan = basePlan();
    const result = respond(plan, 'Make the budget 100', today);
    expect(result.plan.input.budget).toBe(plan.input.budget);
  });

  it('ignores a guest count outside the allowed range', () => {
    const plan = basePlan();
    const result = respond(plan, 'Plan this for 999999 guests', today);
    expect(result.plan.input.guests).toBe(plan.input.guests);
  });

  it('asks for a category when an adjustment names none', () => {
    const result = respond(basePlan(), 'Increase it by 5%', today);
    expect(result.reply).toContain('Which category');
  });

  it('keeps the percentage total at 100 after an adjustment', () => {
    const result = respond(basePlan(), 'Increase decor by 50%', today);
    const total = Object.values(result.plan.percents).reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(100, 5);
  });

  it('does not change the event when the message is only a greeting', () => {
    const plan = basePlan();
    expect(respond(plan, '   ', today).plan).toBe(plan);
  });
});
