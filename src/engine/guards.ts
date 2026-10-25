import { parseIsoDate } from './dates';
import { CATEGORY_IDS } from './costs';
import { EVENT_TYPES, LIMITS } from './validate';
import type {
  ChatMessage,
  EventInput,
  EventPlan,
  Idea,
  IdeaArea,
  Percents,
  Priority,
  TimelineTask,
  VendorItem,
  VendorStatus,
} from './types';

/** Upper bounds that stop a tampered or corrupted saved plan from growing without limit. */
export const STORED_LIMITS = {
  tasks: 50,
  vendors: 20,
  ideas: 50,
  messages: 200,
  textMax: 2_000,
} as const;

const PRIORITIES: readonly Priority[] = ['high', 'medium', 'low'];
const VENDOR_STATUSES: readonly VendorStatus[] = ['not-started', 'shortlisted', 'booked'];
const IDEA_AREAS: readonly IdeaArea[] = ['Theme', 'Venue', 'Decor', 'Catering', 'Activities', 'Budget'];

type Obj = Record<string, unknown>;

const isObject = (value: unknown): value is Obj =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown, max: number = STORED_LIMITS.textMax): value is string =>
  typeof value === 'string' && value.length <= max;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isInEnum = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value);

const isIsoDate = (value: unknown): value is string => isString(value, 10) && parseIsoDate(value) !== null;

function isEventInput(value: unknown): value is EventInput {
  if (!isObject(value)) return false;
  return (
    isInEnum(value.type, EVENT_TYPES) &&
    isString(value.name, LIMITS.nameMax) &&
    isIsoDate(value.date) &&
    isString(value.location, LIMITS.locationMax) &&
    isFiniteNumber(value.guests) &&
    Number.isInteger(value.guests) &&
    value.guests >= LIMITS.minGuests &&
    value.guests <= LIMITS.maxGuests &&
    isFiniteNumber(value.budget) &&
    value.budget >= LIMITS.minBudget &&
    value.budget <= LIMITS.maxBudget &&
    isString(value.theme, LIMITS.themeMax) &&
    isString(value.preferences, LIMITS.preferencesMax)
  );
}

function isPercents(value: unknown): value is Percents {
  if (!isObject(value)) return false;
  const values = CATEGORY_IDS.map((id) => value[id]);
  const allValid = values.every((v) => isFiniteNumber(v) && v >= 0 && v <= 100);
  const total = values.reduce<number>((sum, v) => sum + (isFiniteNumber(v) ? v : 0), 0);
  return allValid && Math.abs(total - 100) < 0.5;
}

function isTask(value: unknown): value is TimelineTask {
  return (
    isObject(value) &&
    isString(value.id, 100) &&
    isString(value.title, 200) &&
    isIsoDate(value.dueDate) &&
    isInEnum(value.priority, PRIORITIES) &&
    typeof value.done === 'boolean'
  );
}

function isVendor(value: unknown): value is VendorItem {
  return (
    isObject(value) &&
    isString(value.id, 100) &&
    isString(value.role, 100) &&
    typeof value.required === 'boolean' &&
    isInEnum(value.status, VENDOR_STATUSES)
  );
}

function isIdea(value: unknown): value is Idea {
  return isObject(value) && isInEnum(value.area, IDEA_AREAS) && isString(value.text, 400);
}

function isMessage(value: unknown): value is ChatMessage {
  return (
    isObject(value) &&
    isString(value.id, 100) &&
    (value.role === 'user' || value.role === 'assistant') &&
    isString(value.text, 2_000)
  );
}

const arrayOf = <T>(value: unknown, max: number, guard: (item: unknown) => item is T): value is T[] =>
  Array.isArray(value) && value.length <= max && value.every(guard);

/** Full structural check of a plan read back from storage. Every field is checked, not just the outer shape. */
export function isEventPlan(value: unknown): value is EventPlan {
  if (!isObject(value)) return false;
  return (
    isEventInput(value.input) &&
    isPercents(value.percents) &&
    arrayOf(value.tasks, STORED_LIMITS.tasks, isTask) &&
    arrayOf(value.vendors, STORED_LIMITS.vendors, isVendor) &&
    arrayOf(value.ideas, STORED_LIMITS.ideas, isIdea) &&
    arrayOf(value.messages, STORED_LIMITS.messages, isMessage)
  );
}
