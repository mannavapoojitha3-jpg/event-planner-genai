export type EventType = 'wedding' | 'birthday' | 'community';
export type Priority = 'high' | 'medium' | 'low';
export type VendorStatus = 'not-started' | 'shortlisted' | 'booked';
export type CategoryId = 'venue' | 'catering' | 'decor' | 'entertainment' | 'photography' | 'misc';
export type IdeaArea = 'Theme' | 'Venue' | 'Decor' | 'Catering' | 'Activities' | 'Budget';
export type Percents = Record<CategoryId, number>;

export interface EventInput {
  type: EventType;
  name: string;
  date: string; // ISO yyyy-mm-dd
  location: string;
  guests: number;
  budget: number; // INR
  theme: string;
  preferences: string;
}

interface BudgetRow {
  id: CategoryId;
  label: string;
  percent: number;
  allocated: number;
  estimated: number;
  overAllocation: number; // 0 when within allocation
}

export interface BudgetSummary {
  rows: BudgetRow[];
  budget: number;
  totalEstimated: number;
  remaining: number;
  overspent: boolean;
}

export interface TimelineTask {
  id: string;
  title: string;
  dueDate: string;
  priority: Priority;
  done: boolean;
}

export interface VendorItem {
  id: string;
  role: string;
  required: boolean;
  status: VendorStatus;
}

export interface Idea {
  area: IdeaArea;
  text: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface EventPlan {
  input: EventInput;
  percents: Percents;
  tasks: TimelineTask[];
  vendors: VendorItem[];
  ideas: Idea[];
  messages: ChatMessage[];
}

export type FormErrors = Partial<Record<keyof EventInput, string>>;
