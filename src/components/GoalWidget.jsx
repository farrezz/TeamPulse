// GoalWidget — Beredningar target (from goals/{week}) vs. handled (summed
// across all teams), with a progress bar. The target is editable inline by
// coordinators (click the goal value → type → Enter/blur to save, Esc to
// cancel) — no separate editor box. Blank state when no goal exists yet.

import { useState } from 'react';

export default function GoalWidget({ goal, handled, isCoordinator, onSetGoal }) {
  const hasGoal = goal != null && typeof goal.Beredningar === 'number';
  const target = hasGoal ? goal.Beredningar : 0;
  const pct = hasGoal && target > 0 ? Math.min(100, (handled / target) * 100) : 0;
  const remaining = Math.max(0, target - handled);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function startEdit() {
    if (!isCoordinator) return;
    setDraft(hasGoal ? String(target) : '');
    setEditing(true);
  }
  function confirm() {
    onSetGoal(Math.max(0, parseInt(draft, 10) || 0));
    setEditing(false);
  }

  const goalInput = (
    <input
      type="number"
      min="0"
      value={draft}
      autoFocus
      onChange={(e) => setDraft(e.target.value)}
      onBlur={confirm}
      onKeyDown={(e) => {
        if (e.key === 'Enter') confirm();
        if (e.key === 'Escape') setEditing(false);
      }}
      style={{ width: 70, padding: '0.2rem 0.35rem', fontSize: '1.2rem' }}
    />
  );

  return (
    <div className="tp-card">
      <h2 style={{ marginTop: 0 }}>Beredningar — veckans mål</h2>

      {hasGoal ? (
        <>
          <p style={{ fontSize: '1.4rem', margin: '0.25rem 0', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span>{handled} av</span>
            {editing ? (
              goalInput
            ) : (
              <span
                onClick={startEdit}
                style={{ cursor: isCoordinator ? 'pointer' : 'default', textDecoration: isCoordinator ? 'underline dotted' : 'none' }}
                title={isCoordinator ? 'Klicka för att ändra målet' : undefined}
              >
                {target}
              </span>
            )}
            <span className="tp-muted" style={{ fontSize: '1rem' }}>· {remaining} kvar</span>
          </p>
          <div style={{ height: 14, borderRadius: 999, background: 'var(--tp-border)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--tp-accent)', transition: 'width 200ms' }} />
          </div>
        </>
      ) : (
        <>
          {editing ? (
            <p style={{ fontSize: '1.1rem', margin: '0.25rem 0', display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span>{handled} av</span>
              {goalInput}
            </p>
          ) : (
            <p
              className="tp-muted"
              style={{ fontSize: '1.1rem', cursor: isCoordinator ? 'pointer' : 'default' }}
              onClick={startEdit}
              title={isCoordinator ? 'Klicka för att sätta veckans mål' : undefined}
            >
              Inget mål satt än{isCoordinator ? ' — sätt mål' : ''}
            </p>
          )}
          <div style={{ height: 14, borderRadius: 999, background: 'var(--tp-border)', opacity: 0.5 }} />
        </>
      )}
    </div>
  );
}
