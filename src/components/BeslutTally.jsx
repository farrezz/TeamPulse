// BeslutTally — goal-less running total of Beslut handled across all teams.

export default function BeslutTally({ total }) {
  return (
    <div className="tp-card">
      <h2 style={{ marginTop: 0 }}>Beslut — totalt denna vecka</h2>
      <p style={{ fontSize: '2rem', margin: '0.25rem 0' }}>{total}</p>
      <p className="tp-muted" style={{ margin: 0 }}>Inget mål — löpande summa.</p>
    </div>
  );
}
