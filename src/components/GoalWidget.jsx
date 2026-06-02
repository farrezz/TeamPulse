// GoalWidget — Beredningar target (from goals/{week}) vs. handled (summed
// across all teams). Blank state when no goal doc exists for the week: a calm
// "Inget mål satt än" with an inert bar. No carry-forward.

export default function GoalWidget({ goal, handled }) {
  const hasGoal = goal != null && typeof goal.Beredningar === 'number';
  const target = hasGoal ? goal.Beredningar : 0;
  const pct = hasGoal && target > 0 ? Math.min(100, (handled / target) * 100) : 0;
  const remaining = Math.max(0, target - handled);

  return (
    <div className="tp-card">
      <h2 style={{ marginTop: 0 }}>Beredningar — veckans mål</h2>

      {hasGoal ? (
        <>
          <p style={{ fontSize: '1.4rem', margin: '0.25rem 0' }}>
            {handled} av {target} · {remaining} kvar
          </p>
          <div
            style={{
              height: 14,
              borderRadius: 999,
              background: 'var(--tp-border)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: 'var(--tp-accent)',
                transition: 'width 200ms',
              }}
            />
          </div>
        </>
      ) : (
        <>
          <p className="tp-muted" style={{ fontSize: '1.1rem' }}>
            Inget mål satt än
          </p>
          <div
            style={{
              height: 14,
              borderRadius: 999,
              background: 'var(--tp-border)',
              opacity: 0.5,
            }}
          />
        </>
      )}
    </div>
  );
}
