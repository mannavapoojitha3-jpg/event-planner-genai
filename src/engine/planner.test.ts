import { describe, expect, it } from 'vitest';
import { createPlan, applyInput, setPercent, toggleTask, setVendorStatus } from './planner';
import { generateTasks, regenerateTasks, isOverdue } from './timeline';
import { generateVendors } from './vendors';
import { generateIdeas } from './ideas';
import { respond } from './assistant';
import type { EventInput } from './types';

const birthday: EventInput = {
  type: 'birthday',
  name: 'Maya turns 8',
  date: '2027-01-20',
  location: 'Home, Indiranagar',
  guests: 25,
  budget: 40_000,
  theme: 'Dinosaurs',
  preferences: 'Kids activities',
};

const TODAY = '2026-10-25';

describe('timeline', () => {
  it('schedules tasks relative to the event date, in chronological order', () => {
    const tasks = generateTasks(birthday);
    expect(tasks[0].dueDate <= tasks[tasks.length - 1].dueDate).toBe(true);
    const setup = tasks.find((task) => task.id === 'birthday:setup');
    expect(setup?.dueDate).toBe('2027-01-19');
  });

  it('preserves completion when the date changes', () => {
    const plan = createPlan(birthday);
    const withDone = toggleTask(plan, 'birthday:venue');
    const updated = applyInput(withDone, { date: '2027-02-01' });
    expect(updated.tasks.find((task) => task.id === 'birthday:venue')?.done).toBe(true);
    expect(updated.tasks.find((task) => task.id === 'birthday:venue')?.dueDate).toBe('2026-12-18');
  });

  it('keeps completion state through regeneration', () => {
    const tasks = regenerateTasks(birthday, generateTasks(birthday).map((task) => ({ ...task, done: true })));
    expect(tasks.every((task) => task.done)).toBe(true);
  });

  it('marks open past-due tasks as overdue', () => {
    expect(isOverdue({ id: 'x', title: 'x', dueDate: '2026-10-01', priority: 'high', done: false }, TODAY)).toBe(true);
    expect(isOverdue({ id: 'x', title: 'x', dueDate: '2026-10-01', priority: 'high', done: true }, TODAY)).toBe(false);
  });
});

describe('vendors', () => {
  it('lists required roles for each event type', () => {
    const vendors = generateVendors('wedding');
    expect(vendors.some((vendor) => vendor.role === 'Caterer' && vendor.required)).toBe(true);
    expect(vendors.every((vendor) => vendor.status === 'not-started')).toBe(true);
  });
});

describe('ideas', () => {
  it('uses the theme and preferences', () => {
    const ideas = generateIdeas(birthday);
    expect(ideas.some((idea) => idea.text.includes('Dinosaurs'))).toBe(true);
    expect(ideas.some((idea) => idea.area === 'Activities')).toBe(true);
  });

  it('warns when the per-guest budget is tight', () => {
    const ideas = generateIdeas({ ...birthday, budget: 5_000, guests: 50 });
    expect(ideas.some((idea) => idea.area === 'Budget' && idea.text.includes('tight'))).toBe(true);
  });
});

describe('plan updates', () => {
  it('updates allocation percentages and keeps them summing to 100', () => {
    const plan = setPercent(createPlan(birthday), 'catering', 50);
    const total = Object.values(plan.percents).reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(100, 5);
  });

  it('changes vendor status', () => {
    const plan = createPlan(birthday);
    const id = plan.vendors[0].id;
    expect(setVendorStatus(plan, id, 'booked').vendors[0].status).toBe('booked');
  });

  it('resets allocations when the event type changes', () => {
    const plan = setPercent(createPlan(birthday), 'catering', 60);
    const converted = applyInput(plan, { type: 'community' });
    expect(converted.percents.catering).toBe(35);
    expect(converted.vendors.some((vendor) => vendor.role === 'Sound & AV')).toBe(true);
  });
});

describe('assistant', () => {
  it('applies budget and guest changes from a single message', () => {
    const plan = createPlan(birthday);
    const result = respond(plan, 'Plan this for 150 guests within ₹5 lakh', TODAY);
    expect(result.plan.input.budget).toBe(500_000);
    expect(result.plan.input.guests).toBe(150);
    expect(result.reply).toContain('Budget updated');
  });

  it('keeps existing event context when only one field changes', () => {
    const plan = createPlan(birthday);
    const result = respond(plan, 'Make the budget 60000', TODAY);
    expect(result.plan.input.name).toBe(birthday.name);
    expect(result.plan.input.guests).toBe(birthday.guests);
  });

  it('reduces a category and redistributes the freed share', () => {
    const plan = createPlan(birthday);
    const before = plan.percents.catering;
    const result = respond(plan, 'Reduce catering expenses by 20% and redistribute the savings', TODAY);
    expect(result.plan.percents.catering).toBeCloseTo(before * 0.8, 1);
    const total = Object.values(result.plan.percents).reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(100, 5);
  });

  it('asks for a category when the adjustment target is unclear', () => {
    const result = respond(createPlan(birthday), 'Reduce the cost', TODAY);
    expect(result.reply).toContain('Which category');
  });

  it('lists final-week tasks for a requested window', () => {
    const result = respond(createPlan(birthday), 'Create a checklist for the final seven days before my party', TODAY);
    expect(result.reply).toMatch(/final|last 7 days|general final-week/);
  });

  it('suggests ideas for a named area', () => {
    const result = respond(createPlan(birthday), 'Suggest elegant decor ideas', TODAY);
    expect(result.reply).toContain('decor');
  });

  it('returns guidance for an unrecognised message without changing the plan', () => {
    const plan = createPlan(birthday);
    const result = respond(plan, 'hello there', TODAY);
    expect(result.plan).toBe(plan);
    expect(result.reply).toContain('Try:');
  });
});
