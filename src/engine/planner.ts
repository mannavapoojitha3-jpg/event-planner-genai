import { generateIdeas } from './ideas';
import { defaultPercents, rebalance } from './budget';
import { regenerateTasks, generateTasks } from './timeline';
import { generateVendors } from './vendors';
import type { CategoryId, EventInput, EventPlan, VendorStatus } from './types';

/** Builds a complete plan from validated input. */
export function createPlan(input: EventInput): EventPlan {
  return {
    input,
    percents: defaultPercents(input.type),
    tasks: generateTasks(input),
    vendors: generateVendors(input.type),
    ideas: generateIdeas(input),
    messages: [],
  };
}

/**
 * Applies changes to the event details and regenerates the dependent parts of the plan.
 * Completed tasks and vendor statuses are preserved; allocations reset only if the event type changes.
 */
export function applyInput(plan: EventPlan, patch: Partial<EventInput>): EventPlan {
  const input: EventInput = { ...plan.input, ...patch };
  const typeChanged = input.type !== plan.input.type;
  return {
    ...plan,
    input,
    percents: typeChanged ? defaultPercents(input.type) : plan.percents,
    tasks: regenerateTasks(input, plan.tasks),
    vendors: typeChanged ? generateVendors(input.type) : plan.vendors,
    ideas: generateIdeas(input),
  };
}

export function setPercent(plan: EventPlan, id: CategoryId, value: number): EventPlan {
  return { ...plan, percents: rebalance(plan.percents, id, value) };
}

export function toggleTask(plan: EventPlan, taskId: string): EventPlan {
  return {
    ...plan,
    tasks: plan.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
  };
}

export function setVendorStatus(plan: EventPlan, vendorId: string, status: VendorStatus): EventPlan {
  return {
    ...plan,
    vendors: plan.vendors.map((vendor) => (vendor.id === vendorId ? { ...vendor, status } : vendor)),
  };
}
