import { addDays } from './dates';
import type { EventInput, EventType, Priority, TimelineTask } from './types';

interface TaskTemplate {
  key: string;
  title: string;
  /** Days before the event date that this task should be finished. */
  offsetDays: number;
  priority: Priority;
}

const TEMPLATES: Record<EventType, TaskTemplate[]> = {
  wedding: [
    { key: 'budget', title: 'Finalise budget and first guest list', offsetDays: 365, priority: 'high' },
    { key: 'venue', title: 'Shortlist and book the venue', offsetDays: 300, priority: 'high' },
    { key: 'caterer', title: 'Book caterer and schedule a tasting', offsetDays: 240, priority: 'high' },
    { key: 'photo', title: 'Book photographer and videographer', offsetDays: 210, priority: 'medium' },
    { key: 'decor', title: 'Settle decor concept and florist', offsetDays: 180, priority: 'medium' },
    { key: 'invites', title: 'Send save-the-dates and invitations', offsetDays: 60, priority: 'high' },
    { key: 'final-count', title: 'Send final guest count to caterer', offsetDays: 14, priority: 'high' },
    { key: 'confirm', title: 'Confirm all vendor bookings and arrival times', offsetDays: 7, priority: 'high' },
    { key: 'walkthrough', title: 'Walk through venue and setup plan', offsetDays: 1, priority: 'medium' },
  ],
  birthday: [
    { key: 'budget', title: 'Set budget and guest list', offsetDays: 60, priority: 'high' },
    { key: 'venue', title: 'Book venue or confirm home setup', offsetDays: 45, priority: 'high' },
    { key: 'entertain', title: 'Book entertainer or plan activities', offsetDays: 30, priority: 'medium' },
    { key: 'food', title: 'Order cake and catering', offsetDays: 21, priority: 'high' },
    { key: 'invites', title: 'Send invitations', offsetDays: 21, priority: 'high' },
    { key: 'headcount', title: 'Confirm headcount with caterer', offsetDays: 5, priority: 'high' },
    { key: 'setup', title: 'Prepare decor and setup plan', offsetDays: 1, priority: 'medium' },
  ],
  community: [
    { key: 'committee', title: 'Form organising committee and assign roles', offsetDays: 90, priority: 'high' },
    { key: 'budget', title: 'Set budget and sponsorship targets', offsetDays: 75, priority: 'high' },
    { key: 'venue', title: 'Secure venue and permits', offsetDays: 60, priority: 'high' },
    { key: 'volunteers', title: 'Recruit and schedule volunteers', offsetDays: 30, priority: 'medium' },
    { key: 'vendors', title: 'Book caterer, sound and entertainers', offsetDays: 21, priority: 'high' },
    { key: 'publicity', title: 'Publish event details and promote', offsetDays: 14, priority: 'medium' },
    { key: 'headcount', title: 'Confirm attendance and safety plan', offsetDays: 3, priority: 'high' },
    { key: 'setup', title: 'Run setup and volunteer briefing', offsetDays: 1, priority: 'medium' },
  ],
};

/** Builds the chronological task list for an event. Task ids are stable across date changes. */
export function generateTasks(input: EventInput): TimelineTask[] {
  return TEMPLATES[input.type]
    .map((template) => ({
      id: `${input.type}:${template.key}`,
      title: template.title,
      dueDate: addDays(input.date, -template.offsetDays),
      priority: template.priority,
      done: false,
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/** Regenerates tasks after an input change, keeping completion state for tasks that still exist. */
export function regenerateTasks(input: EventInput, previous: TimelineTask[]): TimelineTask[] {
  const completed = new Set(previous.filter((task) => task.done).map((task) => task.id));
  return generateTasks(input).map((task) => ({ ...task, done: completed.has(task.id) }));
}

export function isOverdue(task: TimelineTask, today: string): boolean {
  return !task.done && task.dueDate < today;
}
