import { isOverdue } from '../engine/timeline';
import { formatDate } from '../engine/dates';
import type { TimelineTask } from '../engine/types';

interface TimelinePanelProps {
  tasks: TimelineTask[];
  today: string;
  onToggle: (taskId: string) => void;
}

const PRIORITY_LABEL = { high: 'High priority', medium: 'Medium priority', low: 'Low priority' } as const;

export function TimelinePanel({ tasks, today, onToggle }: TimelinePanelProps) {
  const completed = tasks.filter((task) => task.done).length;

  return (
    <section className="card" aria-labelledby="timeline-heading">
      <h2 id="timeline-heading">Planning timeline</h2>
      <p className="hint" aria-live="polite">
        {completed} of {tasks.length} tasks complete.
      </p>
      <ol className="timeline">
        {tasks.map((task) => {
          const overdue = isOverdue(task, today);
          return (
            <li key={task.id} className={`timeline__item${task.done ? ' timeline__item--done' : ''}`}>
              <label className="checkbox">
                <input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)} />
                <span className="timeline__title">{task.title}</span>
              </label>
              <div className="timeline__meta">
                <time dateTime={task.dueDate}>Due {formatDate(task.dueDate)}</time>
                <span className={`badge badge--${task.priority}`}>{PRIORITY_LABEL[task.priority]}</span>
                {overdue && <span className="status status--danger">Overdue</span>}
                {task.done && <span className="status status--ok">Done</span>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
