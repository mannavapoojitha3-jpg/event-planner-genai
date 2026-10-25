import { useRef, useState, type KeyboardEvent } from 'react';
import { BudgetPanel } from './BudgetPanel';
import { TimelinePanel } from './TimelinePanel';
import { VendorChecklist } from './VendorChecklist';
import { ChatPanel } from './ChatPanel';
import { nextTabIndex } from './tabNavigation';
import { formatDate } from '../engine/dates';
import { formatINR } from '../engine/money';
import type { CategoryId, ChatMessage, EventPlan, VendorStatus } from '../engine/types';

type TabId = 'overview' | 'timeline' | 'vendors' | 'assistant';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'assistant', label: 'Assistant' },
];

interface DashboardProps {
  plan: EventPlan;
  today: string;
  onEdit: () => void;
  onPercentChange: (id: CategoryId, value: number) => void;
  onToggleTask: (taskId: string) => void;
  onVendorStatus: (vendorId: string, status: VendorStatus) => void;
  onChatSend: (text: string) => void;
  messages: ChatMessage[];
}

export function Dashboard({
  plan,
  today,
  onEdit,
  onPercentChange,
  onToggleTask,
  onVendorStatus,
  onChatSend,
  messages,
}: DashboardProps) {
  const [tab, setTab] = useState<TabId>('overview');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { input } = plan;

  /** Arrow keys, Home and End move between tabs, as the WAI-ARIA tabs pattern expects. */
  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = nextTabIndex(event.key, index, TABS.length);
    if (next === null) return;
    event.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header card">
        <div>
          <p className="eyebrow">{input.type === 'community' ? 'Community event' : input.type}</p>
          <h1>{input.name}</h1>
          <p className="hint">
            {formatDate(input.date)} · {input.location} · {input.guests} guests · {formatINR(input.budget)} budget
          </p>
        </div>
        <button type="button" className="button" onClick={onEdit}>
          Edit event details
        </button>
      </header>

      <div role="tablist" aria-label="Plan sections" className="tabs">
        {TABS.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            id={`tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            className={`tab${tab === item.id ? ' tab--active' : ''}`}
            onClick={() => setTab(item.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="tabpanel">
        {tab === 'overview' && (
          <div className="overview">
            <section className="card" aria-labelledby="ideas-heading">
              <h2 id="ideas-heading">Personalised ideas</h2>
              <ul className="ideas">
                {plan.ideas.map((idea, index) => (
                  <li key={`${idea.area}-${index}`}>
                    <span className="badge badge--neutral">{idea.area}</span> {idea.text}
                  </li>
                ))}
              </ul>
            </section>
            <BudgetPanel input={input} percents={plan.percents} onPercentChange={onPercentChange} />
          </div>
        )}
        {tab === 'timeline' && <TimelinePanel tasks={plan.tasks} today={today} onToggle={onToggleTask} />}
        {tab === 'vendors' && <VendorChecklist vendors={plan.vendors} onStatusChange={onVendorStatus} />}
        {tab === 'assistant' && <ChatPanel messages={messages} onSend={onChatSend} />}
      </div>
    </div>
  );
}
