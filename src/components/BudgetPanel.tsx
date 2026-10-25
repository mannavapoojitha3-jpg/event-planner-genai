import { memo } from 'react';
import { buildBudget } from '../engine/budget';
import { formatINR } from '../engine/money';
import type { CategoryId, EventInput, Percents } from '../engine/types';

interface BudgetPanelProps {
  input: EventInput;
  percents: Percents;
  onPercentChange: (id: CategoryId, value: number) => void;
}

export const BudgetPanel = memo(function BudgetPanel({ input, percents, onPercentChange }: BudgetPanelProps) {
  const summary = buildBudget(input, percents);
  const spentRatio = summary.budget > 0 ? Math.min(1, summary.totalEstimated / summary.budget) : 0;

  return (
    <section className="card" aria-labelledby="budget-heading">
      <h2 id="budget-heading">Budget breakdown</h2>
      <p className="hint">
        All amounts are planning estimates, not verified market prices. Adjust a share and the other categories rebalance
        to keep the total at 100%.
      </p>

      <div className="budget-summary" role="status">
        <p>
          <strong>Budget:</strong> {formatINR(summary.budget)}
        </p>
        <p>
          <strong>Estimated spend:</strong> {formatINR(summary.totalEstimated)}
        </p>
        <p className={summary.overspent ? 'status status--danger' : 'status status--ok'}>
          {summary.overspent
            ? `Over budget by ${formatINR(-summary.remaining)}`
            : `${formatINR(summary.remaining)} remaining`}
        </p>
      </div>

      <progress
        className="meter"
        value={spentRatio}
        max={1}
        aria-label={`Estimated spend is ${Math.round(spentRatio * 100)}% of the budget`}
      />

      <div className="table-wrap">
        <table className="budget-table">
          <caption className="visually-hidden">Budget allocation by category</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Share %</th>
              <th scope="col">Allocated</th>
              <th scope="col">Estimated</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                <td>
                  <label className="visually-hidden" htmlFor={`share-${row.id}`}>
                    Share for {row.label}
                  </label>
                  <input
                    id={`share-${row.id}`}
                    className="share-input"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={row.percent}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (Number.isFinite(value)) onPercentChange(row.id, value);
                    }}
                  />
                </td>
                <td>{formatINR(row.allocated)}</td>
                <td>{formatINR(row.estimated)}</td>
                <td>
                  {row.overAllocation > 0 ? (
                    <span className="status status--danger">Over by {formatINR(row.overAllocation)}</span>
                  ) : (
                    <span className="status status--ok">Within share</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
});
