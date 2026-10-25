import { useCallback, useEffect, useState } from 'react';
import { Landing } from './components/Landing';
import { EventForm } from './components/EventForm';
import { Dashboard } from './components/Dashboard';
import { applyInput, createPlan, setPercent, setVendorStatus, toggleTask } from './engine/planner';
import { respond } from './engine/assistant';
import { loadPlan, savePlan } from './engine/storage';
import { todayIso } from './engine/dates';
import type { CategoryId, EventInput, EventPlan, VendorStatus } from './engine/types';

type View = 'landing' | 'setup' | 'dashboard';

let idCounter = 0;
const makeId = (): string => `${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

export default function App() {
  const [plan, setPlan] = useState<EventPlan | null>(() => loadPlan());
  const [view, setView] = useState<View>(() => (plan ? 'dashboard' : 'landing'));

  useEffect(() => {
    savePlan(plan);
  }, [plan]);

  const handleSubmit = useCallback(
    (input: EventInput) => {
      setPlan((current) => (current ? applyInput(current, input) : createPlan(input)));
      setView('dashboard');
    },
    [],
  );

  const handlePercent = useCallback((id: CategoryId, value: number) => {
    setPlan((current) => (current ? setPercent(current, id, value) : current));
  }, []);

  const handleToggleTask = useCallback((taskId: string) => {
    setPlan((current) => (current ? toggleTask(current, taskId) : current));
  }, []);

  const handleVendorStatus = useCallback((vendorId: string, status: VendorStatus) => {
    setPlan((current) => (current ? setVendorStatus(current, vendorId, status) : current));
  }, []);

  const handleChat = useCallback((text: string) => {
    setPlan((current) => {
      if (!current) return current;
      const result = respond(current, text, todayIso());
      return {
        ...result.plan,
        messages: [
          ...current.messages,
          { id: makeId(), role: 'user', text },
          { id: makeId(), role: 'assistant', text: result.reply },
        ],
      };
    });
  }, []);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <button type="button" className="brand" onClick={() => setView(plan ? 'dashboard' : 'landing')}>
          EventPlanner AI
        </button>
        {plan && view !== 'dashboard' && (
          <button type="button" className="button" onClick={() => setView('dashboard')}>
            Back to plan
          </button>
        )}
        {plan && (
          <button
            type="button"
            className="button button--quiet"
            onClick={() => {
              if (window.confirm('Delete this plan from this browser? This cannot be undone.')) {
                setPlan(null);
                setView('landing');
              }
            }}
          >
            Start over
          </button>
        )}
      </header>

      <main id="main" tabIndex={-1} className="container">
        {view === 'landing' && <Landing onStart={() => setView('setup')} />}

        {view === 'setup' && (
          <EventForm
            initial={plan?.input}
            onSubmit={handleSubmit}
            onCancel={plan ? () => setView('dashboard') : () => setView('landing')}
          />
        )}

        {view === 'dashboard' && plan && (
          <Dashboard
            plan={plan}
            today={todayIso()}
            onEdit={() => setView('setup')}
            onPercentChange={handlePercent}
            onToggleTask={handleToggleTask}
            onVendorStatus={handleVendorStatus}
            onChatSend={handleChat}
            messages={plan.messages}
          />
        )}
      </main>

      <footer className="site-footer">
        <p>
          Planning estimates only. Costs, timelines and vendor roles are suggestions to help you plan, not verified prices or
          bookings.
        </p>
      </footer>
    </div>
  );
}
