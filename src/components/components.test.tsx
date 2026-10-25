import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BudgetPanel } from './BudgetPanel';
import { TimelinePanel } from './TimelinePanel';
import { VendorChecklist } from './VendorChecklist';
import { Landing } from './Landing';
import { createPlan } from '../engine/planner';
import { defaultPercents } from '../engine/budget';
import type { EventInput } from '../engine/types';

const input: EventInput = {
  type: 'wedding',
  name: 'Asha & Ravi',
  date: '2027-03-12',
  location: 'Bengaluru',
  guests: 150,
  budget: 100_000,
  theme: '',
  preferences: '',
};

describe('BudgetPanel', () => {
  it('reports overspending in text, not colour alone', () => {
    const html = renderToStaticMarkup(
      <BudgetPanel input={input} percents={defaultPercents('wedding')} onPercentChange={() => undefined} />,
    );
    expect(html).toContain('Over budget by');
    expect(html).toContain('planning estimates');
  });

  it('labels each share input with its category', () => {
    const html = renderToStaticMarkup(
      <BudgetPanel input={input} percents={defaultPercents('wedding')} onPercentChange={() => undefined} />,
    );
    expect(html).toContain('Share for Venue');
    expect(html).toContain('Share for Catering &amp; food');
  });

  it('reports remaining budget when the plan is within budget', () => {
    const html = renderToStaticMarkup(
      <BudgetPanel
        input={{ ...input, budget: 50_000_000 }}
        percents={defaultPercents('wedding')}
        onPercentChange={() => undefined}
      />,
    );
    expect(html).toContain('remaining');
    expect(html).not.toContain('Over budget by');
  });
});

describe('TimelinePanel', () => {
  it('shows overdue status for open tasks past their due date', () => {
    const plan = createPlan({ ...input, type: 'birthday', date: '2026-10-30' });
    const html = renderToStaticMarkup(
      <TimelinePanel tasks={plan.tasks} today="2026-10-29" onToggle={() => undefined} />,
    );
    expect(html).toContain('Overdue');
    expect(html).toContain('0 of');
  });

  it('shows a completed status for finished tasks', () => {
    const plan = createPlan(input);
    const done = plan.tasks.map((task) => ({ ...task, done: true }));
    const html = renderToStaticMarkup(<TimelinePanel tasks={done} today="2026-10-25" onToggle={() => undefined} />);
    expect(html).toContain('Done');
    expect(html).not.toContain('Overdue');
  });
});

describe('VendorChecklist', () => {
  it('summarises progress and open required roles', () => {
    const plan = createPlan(input);
    const html = renderToStaticMarkup(<VendorChecklist vendors={plan.vendors} onStatusChange={() => undefined} />);
    expect(html).toContain('0</strong> of');
    expect(html).toContain('required roles still open');
    expect(html).toContain('Required');
  });
});

describe('Landing', () => {
  it('states that costs are estimates and vendors are not real listings', () => {
    const html = renderToStaticMarkup(<Landing onStart={() => undefined} />);
    expect(html).toContain('planning estimates');
    expect(html).toContain('no real vendors');
  });
});
