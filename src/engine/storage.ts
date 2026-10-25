import { isEventPlan } from './guards';
import type { EventPlan } from './types';

const STORAGE_KEY = 'event-planner-ai:plan:v1';

/** Parses and fully validates a stored plan. Anything malformed or outdated is ignored, never partly used. */
export function parseStoredPlan(raw: string | null): EventPlan | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    return isEventPlan(data) ? data : null;
  } catch {
    return null;
  }
}

export function loadPlan(): EventPlan | null {
  try {
    return parseStoredPlan(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage can be blocked (private mode, disabled cookies). The app keeps working in memory.
    return null;
  }
}

export function savePlan(plan: EventPlan | null): void {
  try {
    if (plan) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Quota exceeded or storage blocked. The plan remains available for this session.
  }
}
