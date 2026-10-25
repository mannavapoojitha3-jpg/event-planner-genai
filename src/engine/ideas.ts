import { TIGHT_BUDGET_PER_GUEST } from './costs';
import type { EventInput, EventType, Idea, IdeaArea } from './types';

type AreaIdeas = Partial<Record<IdeaArea, string[]>>;

const BASE_IDEAS: Record<EventType, AreaIdeas> = {
  wedding: {
    Venue: ['Pick a venue that holds your guest count comfortably, with a separate dining area.'],
    Decor: ['Focus decor on the entrance, mandap or stage and the dining tables, where guests look most.'],
    Catering: ['Offer a live counter or two rather than a full plated service to control per-guest cost.'],
    Activities: ['Plan a short welcome performance or a photo booth to keep guests engaged.'],
  },
  birthday: {
    Venue: ['A home or community hall keeps costs low; check the space fits your headcount.'],
    Decor: ['Use one bold colour and a balloon or banner display for a strong look on a small budget.'],
    Catering: ['A snack-and-cake spread is cheaper than a full meal and suits most birthday formats.'],
    Activities: ['Pick two or three games with a clear start and end time so the afternoon runs smoothly.'],
  },
  community: {
    Venue: ['Check whether a public hall or school ground can be booked at a subsidised rate.'],
    Decor: ['Reuse banners and signage across events and ask volunteers to bring basic decor.'],
    Catering: ['Potluck or sponsored meals can cut costs; plan a food-safety and labelling process.'],
    Activities: ['Mix a main programme with open activity zones so people can join in at any time.'],
  },
};

const THEME_CATEGORY_NOTE = (theme: string): string =>
  `Build the look around "${theme}": choose two or three colours and repeat them in decor, signage and favours.`;

interface PreferenceRule {
  pattern: RegExp;
  idea: Idea;
}

const PREFERENCE_RULES: PreferenceRule[] = [
  {
    pattern: /vegetarian|vegan|jain/i,
    idea: { area: 'Catering', text: 'Plan a clearly labelled vegetarian-first menu, with dietary notes on every dish.' },
  },
  {
    pattern: /outdoor|garden|lawn|terrace/i,
    idea: { area: 'Venue', text: 'For an outdoor space, book a covered backup area in case of rain.' },
  },
  {
    pattern: /kids?|children|family/i,
    idea: { area: 'Activities', text: 'Add a supervised play area and kid-friendly activities to keep younger guests busy.' },
  },
  {
    pattern: /music|dance|dj|band/i,
    idea: { area: 'Activities', text: 'Schedule a music or dance segment and agree on volume limits with the venue.' },
  },
  {
    pattern: /elegant|luxury|classic|royal/i,
    idea: { area: 'Decor', text: 'Use a neutral palette with candles, fresh florals and layered linens for an elegant feel.' },
  },
  {
    pattern: /eco|sustainab|green|plastic/i,
    idea: { area: 'Decor', text: 'Choose reusable decor and rented props over single-use items to keep the event sustainable.' },
  },
];

/**
 * Generates themed, budget-aware ideas. Deterministic: the same input always yields the same ideas,
 * and each idea reflects the event type, theme, stated preferences and per-guest budget.
 */
export function generateIdeas(input: EventInput): Idea[] {
  const ideas: Idea[] = [];
  const base = BASE_IDEAS[input.type];
  for (const [area, texts] of Object.entries(base) as [IdeaArea, string[]][]) {
    for (const text of texts) ideas.push({ area, text });
  }

  if (input.theme) ideas.push({ area: 'Theme', text: THEME_CATEGORY_NOTE(input.theme) });

  for (const rule of PREFERENCE_RULES) {
    if (rule.pattern.test(input.preferences)) ideas.push(rule.idea);
  }

  const perGuest = input.budget / input.guests;
  if (perGuest < TIGHT_BUDGET_PER_GUEST[input.type]) {
    ideas.push({
      area: 'Budget',
      text: 'The budget per guest is tight: prioritise catering and venue, and cut extras such as premium decor first.',
    });
  } else {
    ideas.push({
      area: 'Budget',
      text: 'The budget leaves room for one premium touch, such as live music or a professional photo session.',
    });
  }

  return ideas;
}
