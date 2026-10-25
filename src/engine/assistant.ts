import { addDays, formatDate } from './dates';
import { buildBudget, rebalance } from './budget';
import { CATEGORY_LABELS } from './costs';
import { formatINR, parseMoney } from './money';
import { applyInput } from './planner';
import { LIMITS } from './validate';
import type { CategoryId, EventPlan, Idea, IdeaArea } from './types';

export interface AssistantResult {
  plan: EventPlan;
  reply: string;
}

/** Keywords that identify which budget category a message refers to. */
const CATEGORY_PATTERNS: [CategoryId, RegExp][] = [
  ['venue', /\bvenue|\bhall\b|\bspace\b/i],
  ['catering', /cater|\bfood\b|\bmeals?\b|\bmenu\b/i],
  ['decor', /decor|decoration|flower|florist/i],
  ['entertainment', /entertain|music|\bdj\b|\bband\b|activit/i],
  ['photography', /photo|video/i],
  ['misc', /invitation|\bmisc\b|contingency|buffer|transport/i],
];

const IDEA_AREA_PATTERNS: [IdeaArea, RegExp][] = [
  ['Decor', /decor|decoration|flower|elegant/i],
  ['Catering', /cater|food|menu|meal/i],
  ['Activities', /activit|entertain|game|music/i],
  ['Venue', /venue|hall|space/i],
  ['Theme', /theme|colou?r|style/i],
  ['Budget', /budget|cheap|save|saving/i],
];

const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, thirty: 30,
};

const BUDGET_PATTERN = /(?:within|under|up to|budget(?: of| is| to)?|total(?: of)?)\s*(₹?\s*\d[\d,.]*\s*(?:k|thousand|lakhs?|lacs?|crores?|cr)?)/i;
const GUEST_PATTERN = /(\d{1,5})\s*(?:guests?|people|attendees|persons?)\b/i;
const ADJUST_PATTERN = /\b(reduce|cut|lower|decrease|increase|raise|boost)\b/i;
const PERCENT_PATTERN = /(\d{1,2}(?:\.\d+)?)\s*%/;
const CHECKLIST_PATTERN = /\b(checklist|tasks?|timeline|schedule)\b/i;
const WINDOW_PATTERN = /\b(?:last|final)\s+(\d{1,3}|[a-z]+)\s+days?\b/i;
const IDEA_PATTERN = /\b(ideas?|suggest\w*|recommend\w*)\b/i;
const VENDOR_PATTERN = /\bvendors?\b/i;

/** Days-before-event final-week actions, used when the user asks for a short final checklist. */
const FINAL_WEEK_ACTIONS = [
  'Confirm headcount and dietary numbers with vendors',
  'Share arrival and setup times with every vendor',
  'Prepare a printed run sheet and emergency contacts',
  'Check decor, equipment and seating against the plan',
  'Keep a small buffer of cash or payment method for last-minute costs',
];

function findCategory(text: string): CategoryId | null {
  for (const [id, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(text)) return id;
  }
  return null;
}

function findIdeaArea(text: string): IdeaArea | null {
  for (const [area, pattern] of IDEA_AREA_PATTERNS) {
    if (pattern.test(text)) return area;
  }
  return null;
}

function parseWindowDays(text: string): number | null {
  const match = WINDOW_PATTERN.exec(text);
  if (!match) return null;
  const token = match[1].toLowerCase();
  const days = /^\d+$/.test(token) ? Number(token) : WORD_NUMBERS[token];
  return days && days > 0 && days <= 60 ? days : null;
}

function summariseTasks(plan: EventPlan, windowDays: number | null, today: string): string {
  const eventDate = plan.input.date;
  if (windowDays !== null) {
    const start = addDays(eventDate, -windowDays);
    const inWindow = plan.tasks.filter((task) => task.dueDate >= start && task.dueDate <= eventDate);
    const tasks = inWindow.length
      ? inWindow.map((task) => `• ${task.title} (due ${formatDate(task.dueDate)})`)
      : FINAL_WEEK_ACTIONS.map((action) => `• ${action}`);
    const intro = inWindow.length
      ? `Here are the timeline tasks due in the last ${windowDays} days before ${plan.input.name}:`
      : `No timeline tasks fall in the last ${windowDays} days, so here is a general final-week checklist:`;
    return [intro, ...tasks].join('\n');
  }
  const upcoming = plan.tasks.filter((task) => !task.done && task.dueDate >= today).slice(0, 5);
  if (upcoming.length === 0) return 'There are no open upcoming tasks. Nice work.';
  return [
    'Your next open tasks:',
    ...upcoming.map((task) => `• ${task.title} (due ${formatDate(task.dueDate)})`),
  ].join('\n');
}

function summariseIdeas(ideas: Idea[], area: IdeaArea | null): string {
  const matching = area ? ideas.filter((idea) => idea.area === area) : ideas.slice(0, 4);
  if (matching.length === 0) return 'No ideas for that area yet. Try decor, catering, activities or the budget.';
  return [`Ideas${area ? ` for ${area.toLowerCase()}` : ''}:`, ...matching.map((idea) => `• ${idea.text}`)].join('\n');
}

function summariseVendors(plan: EventPlan): string {
  const booked = plan.vendors.filter((vendor) => vendor.status === 'booked').length;
  const notStarted = plan.vendors.filter((vendor) => vendor.status === 'not-started').length;
  return `${booked} of ${plan.vendors.length} vendor roles are booked, and ${notStarted} have not been started. Use the Vendors tab to update each one.`;
}

function budgetLine(plan: EventPlan): string {
  const summary = buildBudget(plan.input, plan.percents);
  const status = summary.overspent
    ? `over budget by ${formatINR(-summary.remaining)}`
    : `${formatINR(summary.remaining)} left`;
  return `Estimated total is ${formatINR(summary.totalEstimated)} against a budget of ${formatINR(plan.input.budget)}, so ${status}. These are estimates, not verified prices.`;
}

/**
 * Rule-based planning assistant. It reads the message for budget, guest, allocation,
 * checklist, idea and vendor requests, applies any changes to the plan, and replies with a summary.
 * Because the plan is passed in and returned, earlier event context is preserved across follow-ups.
 */
export function respond(plan: EventPlan, message: string, today: string): AssistantResult {
  const text = message.trim();
  const notes: string[] = [];
  let next = plan;
  let changed = false;

  const budgetMatch = BUDGET_PATTERN.exec(text);
  const budget = budgetMatch ? parseMoney(budgetMatch[1]) : null;
  if (budget !== null && budget >= LIMITS.minBudget && budget <= LIMITS.maxBudget) {
    next = applyInput(next, { budget });
    notes.push(`Budget updated to ${formatINR(budget)}.`);
    changed = true;
  }

  const guestMatch = GUEST_PATTERN.exec(text);
  const guests = guestMatch ? Number(guestMatch[1]) : null;
  if (guests !== null && guests >= LIMITS.minGuests && guests <= LIMITS.maxGuests) {
    next = applyInput(next, { guests });
    notes.push(`Guest count updated to ${guests}.`);
    changed = true;
  }

  const adjust = ADJUST_PATTERN.exec(text);
  if (adjust) {
    const categoryId = findCategory(text);
    if (categoryId) {
      const percentMatch = PERCENT_PATTERN.exec(text);
      const amount = percentMatch ? Number(percentMatch[1]) : 10;
      const direction = /^(reduce|cut|lower|decrease)$/i.test(adjust[1]) ? -1 : 1;
      const current = next.percents[categoryId];
      const percents = rebalance(next.percents, categoryId, current * (1 + (direction * amount) / 100));
      next = { ...next, percents };
      notes.push(
        `${CATEGORY_LABELS[categoryId]} share moved from ${current.toFixed(1)}% to ${percents[categoryId].toFixed(1)}%. The difference was spread across the other categories in proportion to their current shares.`,
      );
      changed = true;
    } else {
      notes.push('Which category should I change? Try venue, catering, decor, entertainment, photography or misc.');
    }
  }

  if (CHECKLIST_PATTERN.test(text)) {
    notes.push(summariseTasks(next, parseWindowDays(text), today));
  }

  if (IDEA_PATTERN.test(text)) {
    notes.push(summariseIdeas(next.ideas, findIdeaArea(text)));
  }

  if (VENDOR_PATTERN.test(text)) {
    notes.push(summariseVendors(next));
  }

  if (notes.length === 0) {
    return {
      plan: next,
      reply:
        'I can update your budget, guest count and category shares, list tasks, or suggest ideas. Try: "Plan this for 150 guests within ₹5 lakh", "Reduce catering by 20%", "Create a checklist for the final seven days" or "Suggest elegant decor ideas".',
    };
  }

  if (changed) notes.push(budgetLine(next));
  return { plan: next, reply: notes.join('\n\n') };
}
