import { EVENT_TYPES } from './validate';
import type { EventPlan } from './types';

const STORAGE_KEY = 'event-planner-ai:plan:v1';

/** Structural check for data read back from localStorage, so corrupt or outdated data is ignored. */
function isEventPlan(value: unknown): value is EventPlan {
  if (typeof value !== 'object' || value === null) return false;
  const plan = value as Partial<EventPlan>;
  const input = plan.input;
  return (
    typeof input === 'object' &&
    input !== null &&
    EVENT_TYPES.includes(input.type) &&
    typeof input.name === 'string' &&
    typeof input.date === 'string' &&
    typeof input.guests === 'number' &&
    typeof input.budget === 'number' &&
    typeof plan.percents === 'object' &&
    plan.percents !== null &&
    Array.isArray(plan.tasks) &&
    Array.isArray(plan.vendors) &&
    Array.isArray(plan.ideas) &&
    Array.isArray(plan.messages)
  );
}

export function loadPlan(): EventPlan | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    return isEventPlan(data) ? data : null;
  } catch {
    return null;
  }
}

export function savePlan(plan: EventPlan | null): void {
  try {
    if (plan) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be unavailable (private mode, quota). The app keeps working in memory.
  }
}
